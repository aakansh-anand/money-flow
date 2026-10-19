import { tags, transactions, users, type Db } from "@kosh/db";
import type {
  CreateTagInput,
  Tag,
  TagSortMode,
  TagSortPreferences,
  UpdateTagInput,
  UpdateTagSortPreferences,
} from "@kosh/shared";
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { and, eq, isNotNull, ne, sql } from "drizzle-orm";

import { DB } from "@/database/database.module";
import { serializeTag } from "@/finance/serialize.util";

@Injectable()
export class TagsService {
  constructor(@Inject(DB) private readonly db: Db) {}

  async getSortPreferences(userId: string): Promise<TagSortPreferences> {
    const sortMode = await this.getSortMode(userId);
    return { sortMode };
  }

  async updateSortPreferences(
    userId: string,
    input: UpdateTagSortPreferences,
  ): Promise<TagSortPreferences> {
    if (input.sortMode === "manual") {
      const ordered = await this.listAutomatic(userId);
      await this.persistSortOrder(
        userId,
        ordered.map((tag) => tag.id),
      );
    }

    await this.db.update(users).set({ tagSortMode: input.sortMode }).where(eq(users.id, userId));

    return { sortMode: input.sortMode };
  }

  async list(userId: string): Promise<Tag[]> {
    const sortMode = await this.getSortMode(userId);
    return sortMode === "manual" ? this.listManual(userId) : this.listAutomatic(userId);
  }

  async create(userId: string, input: CreateTagInput): Promise<Tag> {
    await this.assertNameAvailable(userId, input.name);
    const sortOrder = await this.nextSortOrder(userId);

    const [row] = await this.db
      .insert(tags)
      .values({
        userId,
        name: input.name,
        kind: input.kind,
        color: input.color,
        sortOrder,
      })
      .returning();
    if (!row) throw new Error("Failed to create tag");
    return serializeTag(row);
  }

  async update(userId: string, tagId: string, input: UpdateTagInput): Promise<Tag> {
    const existing = await this.db.query.tags.findFirst({
      where: and(eq(tags.id, tagId), eq(tags.userId, userId)),
    });
    if (!existing) throw new NotFoundException("Tag not found");

    const patch: Partial<typeof tags.$inferInsert> = {};
    if (input.name !== undefined) {
      await this.assertNameAvailable(userId, input.name, tagId);
      patch.name = input.name;
    }
    if (input.color !== undefined) patch.color = input.color;

    if (Object.keys(patch).length === 0) {
      return serializeTag(existing);
    }

    const [row] = await this.db
      .update(tags)
      .set(patch)
      .where(and(eq(tags.id, tagId), eq(tags.userId, userId)))
      .returning();
    if (!row) throw new NotFoundException("Tag not found");
    return serializeTag(row);
  }

  /**
   * Save drag-and-drop order (manual mode). Also switches sort mode to manual.
   */
  async reorder(userId: string, tagIds: string[]): Promise<Tag[]> {
    const existing = await this.db.query.tags.findMany({
      where: eq(tags.userId, userId),
    });

    if (tagIds.length !== existing.length) {
      throw new BadRequestException("tagIds must include every tag exactly once");
    }

    const owned = new Set(existing.map((row) => row.id));
    if (new Set(tagIds).size !== tagIds.length) {
      throw new BadRequestException("Duplicate tag id in tagIds");
    }
    for (const id of tagIds) {
      if (!owned.has(id)) {
        throw new BadRequestException("Unknown tag id in tagIds");
      }
    }

    await this.db.transaction(async (tx) => {
      for (let index = 0; index < tagIds.length; index++) {
        await tx
          .update(tags)
          .set({ sortOrder: index })
          .where(and(eq(tags.id, tagIds[index]!), eq(tags.userId, userId)));
      }
      await tx.update(users).set({ tagSortMode: "manual" }).where(eq(users.id, userId));
    });

    return this.listManual(userId);
  }

  /** Saved drag-and-drop order. */
  private async listManual(userId: string): Promise<Tag[]> {
    const rows = await this.db.query.tags.findMany({
      where: eq(tags.userId, userId),
      orderBy: (t, { asc }) => [asc(t.sortOrder), asc(t.createdAt)],
    });
    return rows.map(serializeTag);
  }

  /**
   * Most-used tags first (expense/income transactions with tagId).
   * Ties and zero-use tags fall back to creation order (createdAt).
   */
  private async listAutomatic(userId: string): Promise<Tag[]> {
    const rows = await this.db.query.tags.findMany({
      where: eq(tags.userId, userId),
    });

    const counts = await this.db
      .select({
        tagId: transactions.tagId,
        count: sql<number>`count(*)::int`,
      })
      .from(transactions)
      .where(and(eq(transactions.userId, userId), isNotNull(transactions.tagId)))
      .groupBy(transactions.tagId);

    const countByTag = new Map(
      counts.filter((row) => row.tagId).map((row) => [row.tagId!, row.count]),
    );

    rows.sort((a, b) => {
      const byFreq = (countByTag.get(b.id) ?? 0) - (countByTag.get(a.id) ?? 0);
      if (byFreq !== 0) return byFreq;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    return rows.map(serializeTag);
  }

  private async persistSortOrder(userId: string, tagIds: string[]): Promise<void> {
    await this.db.transaction(async (tx) => {
      for (let index = 0; index < tagIds.length; index++) {
        await tx
          .update(tags)
          .set({ sortOrder: index })
          .where(and(eq(tags.id, tagIds[index]!), eq(tags.userId, userId)));
      }
    });
  }

  private async getSortMode(userId: string): Promise<TagSortMode> {
    const user = await this.db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { tagSortMode: true },
    });
    if (!user) throw new NotFoundException("User not found");
    return user.tagSortMode;
  }

  private async nextSortOrder(userId: string): Promise<number> {
    const last = await this.db.query.tags.findFirst({
      where: eq(tags.userId, userId),
      orderBy: (t, { desc }) => [desc(t.sortOrder)],
    });
    return (last?.sortOrder ?? -1) + 1;
  }

  /** Names unique per user; comparison is case-insensitive (Meal = MEAL). */
  private async assertNameAvailable(
    userId: string,
    name: string,
    excludeTagId?: string,
  ): Promise<void> {
    const conditions = [eq(tags.userId, userId), sql`lower(${tags.name}) = lower(${name})`];
    if (excludeTagId) {
      conditions.push(ne(tags.id, excludeTagId));
    }

    const conflict = await this.db.query.tags.findFirst({
      where: and(...conditions),
    });
    if (conflict) {
      throw new ConflictException("Tag name already exists");
    }
  }
}
