import { users, type Db } from "@kosh/db";
import {
  CHANGE_PASSWORD_SUCCESS_MESSAGE,
  CURRENT_PASSWORD_INCORRECT_MESSAGE,
  type ChangePasswordResponse,
  type Profile,
  type SaveOnboardingInput,
} from "@kosh/shared";
import { BadRequestException, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

import { BCRYPT_ROUNDS } from "@/auth/auth.constants";
import { DB } from "@/database/database.module";

@Injectable()
export class ProfileService {
  constructor(@Inject(DB) private readonly db: Db) {}

  async get(userId: string): Promise<Profile> {
    const user = await this.db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { name: true, email: true, onboardingStatus: true, onboardingStep: true },
    });
    if (!user) {
      throw new UnauthorizedException("Invalid or expired access token");
    }
    return user;
  }

  async saveOnboarding(userId: string, input: SaveOnboardingInput): Promise<Profile> {
    const onboardingStep = input.onboardingStatus === "in-progress" ? input.onboardingStep : null;
    const updated = await this.db
      .update(users)
      .set({ onboardingStatus: input.onboardingStatus, onboardingStep })
      .where(eq(users.id, userId))
      .returning({ id: users.id });
    if (updated.length === 0) {
      throw new UnauthorizedException("Invalid or expired access token");
    }
    return this.get(userId);
  }

  /**
   * 400, not 401: a wrong current password is a form error. 401 would make
   * the web client rotate the session as if the access token had expired.
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<ChangePasswordResponse> {
    const user = await this.db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { passwordHash: true },
    });
    if (!user) {
      throw new UnauthorizedException("Invalid or expired access token");
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      throw new BadRequestException(CURRENT_PASSWORD_INCORRECT_MESSAGE);
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.db.update(users).set({ passwordHash }).where(eq(users.id, userId));

    return { message: CHANGE_PASSWORD_SUCCESS_MESSAGE };
  }
}
