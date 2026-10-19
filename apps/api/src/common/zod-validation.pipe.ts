import {
  BadRequestException,
  Injectable,
  type PipeTransform,
} from "@nestjs/common";
import { z, type ZodType } from "zod";

/**
 * Parameter-level pipe validating a body against a shared Zod schema.
 * Usage: `@Body(new ZodValidationPipe(registerInputSchema)) body: RegisterInput`
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodType) {}

  transform(value: unknown): unknown {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        message: "Validation failed",
        issues: z.prettifyError(result.error),
      });
    }
    return result.data;
  }
}
