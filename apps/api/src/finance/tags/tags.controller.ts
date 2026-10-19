import {
  type CreateTagInput,
  createTagInputSchema,
  type ReorderTagsInput,
  reorderTagsInputSchema,
  type Tag,
  type TagSortPreferences,
  type UpdateTagInput,
  type UpdateTagSortPreferences,
  updateTagInputSchema,
  updateTagSortPreferencesSchema,
} from "@kosh/shared";
import {
  Controller,
  Get,
  HttpCode,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
} from "@nestjs/common";

import type { AuthContext } from "@/auth/auth.types";
import { CurrentAuth } from "@/auth/decorators/current-auth.decorator";
import { ZodBody } from "@/common/zod-validation.pipe";
import { TagsService } from "./tags.service";

@Controller("tags")
export class TagsController {
  constructor(@Inject(TagsService) private readonly tags: TagsService) {}

  @Get()
  list(@CurrentAuth() auth: AuthContext): Promise<Tag[]> {
    return this.tags.list(auth.userId);
  }

  @Get("preferences")
  getSortPreferences(@CurrentAuth() auth: AuthContext): Promise<TagSortPreferences> {
    return this.tags.getSortPreferences(auth.userId);
  }

  @Patch("preferences")
  updateSortPreferences(
    @CurrentAuth() auth: AuthContext,
    @ZodBody(updateTagSortPreferencesSchema) body: UpdateTagSortPreferences,
  ): Promise<TagSortPreferences> {
    return this.tags.updateSortPreferences(auth.userId, body);
  }

  @Post()
  create(
    @CurrentAuth() auth: AuthContext,
    @ZodBody(createTagInputSchema) body: CreateTagInput,
  ): Promise<Tag> {
    return this.tags.create(auth.userId, body);
  }

  /** Save custom tag order from the tags settings screen. */
  @Put("order")
  @HttpCode(200)
  reorder(
    @CurrentAuth() auth: AuthContext,
    @ZodBody(reorderTagsInputSchema) body: ReorderTagsInput,
  ): Promise<Tag[]> {
    return this.tags.reorder(auth.userId, body.tagIds);
  }

  @Patch(":id")
  update(
    @CurrentAuth() auth: AuthContext,
    @Param("id", ParseUUIDPipe) id: string,
    @ZodBody(updateTagInputSchema) body: UpdateTagInput,
  ): Promise<Tag> {
    return this.tags.update(auth.userId, id, body);
  }
}
