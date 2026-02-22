import { Injectable, Logger, LogLevel } from "@nestjs/common";

/**
 * Structured Logger Service
 * Provides structured logging with context and request ID
 */
@Injectable()
export class StructuredLoggerService {
    private logger = new Logger();

    constructor() { }

    /**
     * Set the logger context
     */
    setContext(context: string) {
        this.logger = new Logger(context);
    }

    /**
     * Log with context
     */
    log(message: string, context?: string, meta?: Record<string, any>) {
        this.logger.log(this.formatMessage(message, meta), context);
    }

    /**
     * Error logging
     */
    error(
        message: string,
        error?: Error | string,
        context?: string,
        meta?: Record<string, any>
    ) {
        const stack = error instanceof Error ? error.stack : undefined;
        this.logger.error(
            this.formatMessage(message, { ...meta, error: error?.toString?.() }),
            stack,
            context
        );
    }

    /**
     * Warning logging
     */
    warn(message: string, context?: string, meta?: Record<string, any>) {
        this.logger.warn(this.formatMessage(message, meta), context);
    }

    /**
     * Debug logging
     */
    debug(message: string, context?: string, meta?: Record<string, any>) {
        this.logger.debug(this.formatMessage(message, meta), context);
    }

    /**
     * Verbose logging
     */
    verbose(message: string, context?: string, meta?: Record<string, any>) {
        this.logger.verbose(this.formatMessage(message, meta), context);
    }

    /**
     * Log HTTP request
     */
    logRequest(method: string, path: string, requestId: string, meta?: Record<string, any>) {
        this.log(`↓ ${method.toUpperCase()} ${path}`, "HTTP", {
            requestId,
            ...meta,
        });
    }

    /**
     * Log HTTP response
     */
    logResponse(
        method: string,
        path: string,
        statusCode: number,
        requestId: string,
        duration?: number,
        meta?: Record<string, any>
    ) {
        const statusIcon =
            statusCode >= 200 && statusCode < 300
                ? "✓"
                : statusCode >= 300 && statusCode < 400
                    ? "→"
                    : "✗";

        this.log(
            `↑ ${statusIcon} ${method.toUpperCase()} ${path} ${statusCode}`,
            "HTTP",
            {
                requestId,
                duration: duration ? `${duration}ms` : undefined,
                ...meta,
            }
        );
    }

    /**
     * Format message with metadata
     */
    private formatMessage(message: string, meta?: Record<string, any>): string {
        if (!meta || Object.keys(meta).length === 0) {
            return message;
        }

        const metaStr = Object.entries(meta)
            .filter(([, v]) => v !== undefined && v !== null)
            .map(([k, v]) => `${k}=${v}`)
            .join(" ");

        return `${message} ${metaStr}`;
    }
}
