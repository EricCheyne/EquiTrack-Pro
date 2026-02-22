import {
    ArgumentsHost,
    BadRequestException,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
    Inject,
} from "@nestjs/common";
import { Request, Response } from "express";
import { StructuredLoggerService } from "../services/structured-logger.service";
import { createProblemDetails, getStatusTitle } from "../types/problem-details";

/**
 * Global Exception Filter
 * Catches all exceptions and returns RFC 7807 Problem Details JSON format
 * Includes request ID and structured logging
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    constructor(
        @Inject(StructuredLoggerService)
        private readonly logger: StructuredLoggerService
    ) { }

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        const requestId = (request as any).id || "unknown";

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let title = "Internal Server Error";
        let detail: string | undefined;
        let errors: Record<string, string[]> | undefined;

        if (exception instanceof BadRequestException) {
            // Handle validation errors
            status = exception.getStatus();
            title = getStatusTitle(status);
            const exceptionResponse = exception.getResponse() as any;

            if (exceptionResponse.message) {
                if (Array.isArray(exceptionResponse.message)) {
                    detail = exceptionResponse.message.join("; ");
                } else {
                    detail = exceptionResponse.message;
                }
            }

            // Extract validation errors if present
            if (exceptionResponse.error && exceptionResponse.error === "Bad Request") {
                // Standard Bad Request
                detail = exceptionResponse.message;
            }
        } else if (exception instanceof HttpException) {
            status = exception.getStatus();
            title = getStatusTitle(status);
            const exceptionResponse = exception.getResponse();

            if (typeof exceptionResponse === "object") {
                const res = exceptionResponse as any;
                if (res.message) {
                    detail = Array.isArray(res.message) ? res.message.join("; ") : res.message;
                }
                // Extract validation errors from the response
                if (res.error === "Unprocessable Entity" && res.errors) {
                    errors = res.errors;
                } else if (res.errors) {
                    errors = res.errors;
                }
            } else {
                detail = exceptionResponse as string;
            }
        } else if (exception instanceof Error) {
            title = "Internal Server Error";
            detail = exception.message;

            // Log stack trace for internal errors
            this.logger.error(
                "Unhandled exception",
                exception,
                "GlobalExceptionFilter",
                {
                    requestId,
                    method: request.method,
                    path: request.url,
                }
            );
        } else {
            detail = String(exception);
        }

        // Create Problem Details response
        const problemDetails = createProblemDetails(
            status,
            title,
            detail,
            request.url,
            requestId,
            errors
        );

        // Log the error
        this.logger.error(
            `Exception: ${title}`,
            detail,
            "GlobalExceptionFilter",
            {
                requestId,
                status,
                method: request.method,
                path: request.url,
            }
        );

        response.status(status).json(problemDetails);
    }
}
