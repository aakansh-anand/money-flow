import {
  type ChangePasswordInput,
  type ChangePasswordResponse,
  changePasswordInputSchema,
  type Profile,
  type SaveOnboardingInput,
  saveOnboardingInputSchema,
} from "@kosh/shared";
import { Controller, Get, HttpCode, Inject, Patch, Post } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";

import type { AuthContext } from "@/auth/auth.types";
import { CurrentAuth } from "@/auth/decorators/current-auth.decorator";
import { ZodBody } from "@/common/zod-validation.pipe";
import { ProfileService } from "./profile.service";

/** Same ceiling as login: the current password is a credential. */
const CHANGE_PASSWORD_THROTTLE = { default: { limit: 5, ttl: 60_000 } };

@Controller("profile")
export class ProfileController {
  constructor(@Inject(ProfileService) private readonly profile: ProfileService) {}

  @Get()
  get(@CurrentAuth() auth: AuthContext): Promise<Profile> {
    return this.profile.get(auth.userId);
  }

  @HttpCode(200)
  @Patch("onboarding")
  saveOnboarding(
    @CurrentAuth() auth: AuthContext,
    @ZodBody(saveOnboardingInputSchema) body: SaveOnboardingInput,
  ): Promise<Profile> {
    return this.profile.saveOnboarding(auth.userId, body);
  }

  @Throttle(CHANGE_PASSWORD_THROTTLE)
  @HttpCode(200)
  @Post("change-password")
  changePassword(
    @CurrentAuth() auth: AuthContext,
    @ZodBody(changePasswordInputSchema) body: ChangePasswordInput,
  ): Promise<ChangePasswordResponse> {
    return this.profile.changePassword(auth.userId, body.currentPassword, body.newPassword);
  }
}
