import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Request, Response } from "express";

interface ErrorBody {
  statusCode: number;
  message?: string | string[];
  path: string;
  timestamp: string;
  [key: string]: unknown;
}

/** postgres.js error shape (SQLSTATE). */
function isPgError(err: unknown): err is { code: string } {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    typeof (err as { code: unknown }).code === "string"
  );
}

/**
 * Global filter: one consistent error shape for the whole API.
 * Known HttpExceptions keep their status + message; Postgres errors map to
 * sane HTTP statuses; anything else becomes a generic 500 (internals logged,
 * never leaked to the client).
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const req = host.switchToHttp().getRequest<Request>();
    const res = host.switchToHttp().getResponse<Response>();
    const base = {
      path: req.url,
      timestamp: new Date().toISOString(),
    };

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const payload: ErrorBody =
        typeof body === "string"
          ? { ...base, statusCode: status, message: body }
          : { ...base, ...(body as Record<string, unknown>), statusCode: status };
      res.status(status).json(payload);
      return;
    }

    // Postgres unique violation (e.g. duplicate email at the DB level).
    if (isPgError(exception) && exception.code === "23505") {
      res.status(HttpStatus.CONFLICT).json({
        ...base,
        statusCode: HttpStatus.CONFLICT,
        message: "Resource already exists",
      });
      return;
    }

    this.logger.error(
      { err: exception, path: req.url },
      "Unhandled error",
    );
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      ...base,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: "Internal server error",
    });
  }
}
