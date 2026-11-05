import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ConflictError, DomainError, InvalidCredentialsError, ResourceNotFoundError } from '../../domain/domain-error';

/**
 * Translates every error into an RFC 7807 "Problem Details" JSON body so that
 * all microservices answer errors with the same contract (Anti-Corruption Layer).
 */
@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let title = 'Internal Server Error';
    let detail: string | string[] = 'An unexpected error occurred.';
    let type = 'about:blank';

    if (exception instanceof ResourceNotFoundError) {
      status = HttpStatus.NOT_FOUND;
      title = 'Not Found';
      detail = exception.message;
      type = exception.code;
    } else if (exception instanceof ConflictError) {
      status = HttpStatus.CONFLICT;
      title = 'Conflict';
      detail = exception.message;
      type = exception.code;
    } else if (exception instanceof InvalidCredentialsError) {
      status = HttpStatus.UNAUTHORIZED;
      title = 'Unauthorized';
      detail = exception.message;
      type = exception.code;
    } else if (exception instanceof DomainError) {
      status = HttpStatus.UNPROCESSABLE_ENTITY;
      title = 'Business Rule Violated';
      detail = exception.message;
      type = exception.code;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse() as { message?: string | string[]; error?: string } | string;
      title = typeof body === 'string' ? body : body.error ?? exception.name;
      detail = typeof body === 'string' ? body : body.message ?? exception.message;
    } else {
      this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    }

    response.status(status).type('application/problem+json').json({
      type,
      title,
      status,
      detail,
      instance: request.originalUrl,
    });
  }
}
