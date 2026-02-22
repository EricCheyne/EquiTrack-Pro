import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap, catchError } from "rxjs/operators";
import { Request, Response } from "express";
import { StructuredLoggerService } from "../services/structured-logger.service";

/**
 * HTTP Logging Interceptor
 * Automatically logs all HTTP requests and responses with timing information
 */
@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
    constructor(private readonly logger: StructuredLoggerService) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const ctx = context.switchToHttp();
        const request = ctx.getRequest<Request>();
        const response = ctx.getResponse<Response>();
        const { method, url } = request;
        const requestId = (request as any).id;
        const startTime = Date.now();

        this.logger.logRequest(method, url, requestId, {
            userAgent: request.get("user-agent"),
            contentType: request.get("content-type"),
        });

        return next.handle().pipe(
            tap(() => {
                const duration = Date.now() - startTime;
                this.logger.logResponse(method, url, response.statusCode, requestId, duration);
            }),
            catchError((error) => {
                const duration = Date.now() - startTime;
                this.logger.logResponse(
                    method,
                    url,
                    error.status || 500,
                    requestId,
                    duration,
                    {
                        error: error.message,
                    }
                );
                throw error;
            })
        );
    }
}
