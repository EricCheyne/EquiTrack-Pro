import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";

/**
 * Request ID Middleware
 * Generates a unique request ID for each incoming request and attaches it to headers
 * This ID can be used for tracing and logging
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        // Check if request already has an ID from upstream
        const requestId = req.get("x-request-id") || randomUUID();

        // Attach request ID to request object
        (req as any).id = requestId;

        // Set response header with request ID
        res.set("x-request-id", requestId);

        next();
    }
}

/**
 * Declare module augmentation to add requestId to Express Request
 */
declare global {
    namespace Express {
        interface Request {
            id: string;
        }
    }
}
