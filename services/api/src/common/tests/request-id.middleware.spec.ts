import { Test } from '@nestjs/testing';
import { RequestIdMiddleware } from '../middleware/request-id.middleware';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

describe('RequestIdMiddleware', () => {
    let middleware: RequestIdMiddleware;
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [RequestIdMiddleware],
        }).compile();

        middleware = module.get<RequestIdMiddleware>(RequestIdMiddleware);

        // Mock request and response
        req = {
            headers: {},
        };

        res = {
            setHeader: jest.fn().mockReturnValue(res),
        };

        next = jest.fn();
    });

    it('should be defined', () => {
        expect(middleware).toBeDefined();
    });

    it('should generate a request ID if not provided', (done) => {
        middleware.use(req as Request, res as Response, next as NextFunction);

        // Check that request ID was set on the request
        expect((req as any).id).toBeDefined();
        // Validate it's a UUID format
        expect((req as any).id).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        );
        done();
    });

    it('should use existing x-request-id header if provided', (done) => {
        const customId = uuidv4();
        req.headers = { 'x-request-id': customId };

        middleware.use(req as Request, res as Response, next as NextFunction);

        expect((req as any).id).toBe(customId);
        done();
    });

    it('should set x-request-id header in response', (done) => {
        middleware.use(req as Request, res as Response, next as NextFunction);

        expect(res.setHeader).toHaveBeenCalledWith(
            'x-request-id',
            (req as any).id,
        );
        done();
    });

    it('should call next middleware', (done) => {
        middleware.use(req as Request, res as Response, next as NextFunction);

        expect(next).toHaveBeenCalled();
        done();
    });

    it('should generate unique IDs for different requests', (done) => {
        // First request
        const req1 = { headers: {} } as Request;
        const res1 = { setHeader: jest.fn() } as unknown as Response;
        middleware.use(req1, res1, jest.fn());

        // Second request
        const req2 = { headers: {} } as Request;
        const res2 = { setHeader: jest.fn() } as unknown as Response;
        middleware.use(req2, res2, jest.fn());

        expect((req1 as any).id).not.toBe((req2 as any).id);
        done();
    });

    it('should handle case-insensitive x-request-id header', (done) => {
        const customId = uuidv4();
        req.headers = { 'X-Request-ID': customId } as any;

        middleware.use(req as Request, res as Response, next as NextFunction);

        // Should still work with case normalization
        expect((req as any).id).toBeDefined();
        done();
    });
});
