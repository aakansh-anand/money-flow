import {
  type Contact,
  type CreateContactInput,
  createContactInputSchema,
} from "@kosh/shared";
import { Controller, Get, Inject, Post } from "@nestjs/common";

import type { AuthContext } from "@/auth/auth.types";
import { CurrentAuth } from "@/auth/decorators/current-auth.decorator";
import { ZodBody } from "@/common/zod-validation.pipe";
import { ContactsService } from "./contacts.service";

@Controller("contacts")
export class ContactsController {
  constructor(@Inject(ContactsService) private readonly contacts: ContactsService) {}

  @Get()
  list(@CurrentAuth() auth: AuthContext): Promise<Contact[]> {
    return this.contacts.list(auth.userId);
  }

  @Post()
  create(
    @CurrentAuth() auth: AuthContext,
    @ZodBody(createContactInputSchema) body: CreateContactInput,
  ): Promise<Contact> {
    return this.contacts.create(auth.userId, body);
  }
}
