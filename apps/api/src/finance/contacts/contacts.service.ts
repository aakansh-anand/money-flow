import { contacts, type Db } from "@kosh/db";
import type { Contact, CreateContactInput } from "@kosh/shared";
import { Inject, Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";

import { DB } from "@/database/database.module";
import { serializeContact } from "@/finance/serialize.util";

@Injectable()
export class ContactsService {
  constructor(@Inject(DB) private readonly db: Db) {}

  async list(userId: string): Promise<Contact[]> {
    const rows = await this.db.query.contacts.findMany({
      where: eq(contacts.userId, userId),
      orderBy: (t, { asc }) => [asc(t.name)],
    });
    return rows.map(serializeContact);
  }

  async create(userId: string, input: CreateContactInput): Promise<Contact> {
    const [row] = await this.db
      .insert(contacts)
      .values({
        userId,
        name: input.name,
        type: input.type,
      })
      .returning();
    if (!row) throw new Error("Failed to create contact");
    return serializeContact(row);
  }
}
