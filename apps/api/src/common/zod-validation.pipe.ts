import {
  BadRequestException,
  Body,
  Injectable,
  Optional,
  Query,
  type PipeTransform,
  type Type,
} from "@nestjs/common";
import type { ArgumentMetadata } from "@nestjs/common/interfaces/features/pipe-transform.interface";
import { z, type ZodType } from "zod";

type ZodBodyClass = Type<unknown> & { readonly zodSchema: ZodType };

/** `@ZodBody(schema)` — shorthand for `@Body(new ZodValidationPipe(schema))`. */
export function ZodBody(schema: ZodType): ParameterDecorator {
  return Body(new ZodValidationPipe(schema));
}

/** `@ZodQuery(schema)` — validates query strings against a shared Zod schema. */
export function ZodQuery(schema: ZodType): ParameterDecorator {
  return Query(new ZodValidationPipe(schema));
}

/**
 * Registered as global `APP_PIPE`. Validates parameter pipes constructed with
 * a schema, and any future DTO class carrying a static `zodSchema`.
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(@Optional() private readonly explicitSchema?: ZodType) {}

  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    const schema =
      this.explicitSchema ?? (metadata.metatype as ZodBodyClass | undefined)?.zodSchema;
    if (!schema) return value;

    const result = schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        message: "Validation failed",
        issues: z.prettifyError(result.error),
      });
    }
    return result.data;
  }
}
