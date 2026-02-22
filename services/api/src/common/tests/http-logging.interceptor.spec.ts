import { Test } from '@nestjs/testing';
import {
    CallHandler,
    ExecutionContext,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { HttpLoggingInterceptor } from '../interceptors/http-logging.interceptor';
import { StructuredLoggerService } from '../services/structured-logger.service';
import { of, throwError } from 'rxjs';
import { Response } from 'express';

describe('HttpLoggingInterceptor', () => {
    let interceptor: HttpLoggingInterceptor;
    let mockLogger: jest.Mocked<StructuredLoggerService>;
    let mockExecutionContext: Partial<ExecutionContext>;
    let mockCallHandler: Partial<CallHandler>;

    beforeEach(async () => {
        mockLogger = {
            logResponse: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
        } as any;

        const module = await Test.createTestingModule({
            providers: [
                HttpLoggingInterceptor,
                {
                    provide: StructuredLoggerService,
                    useValue: mockLogger,
                },
            ],
        }).compile();

        interceptor = module.get<HttpLoggingInterceptor>(
            HttpLoggingInterceptor,
        );

        mockExecutionContext = {
            switchToHttp: jest.fn().mockReturnValue({
                getRequest: jest.fn().mockReturnValue({
                    method: 'GET',
                    url: '/api/test',
                    headers: {
                        authorization: 'Bearer token123',
                    },
                }),
                getResponse: jest.fn().mockReturnValue({
                    statusCode: 200,
                }),
            }),
        };

        mockCallHandler = {
            handle: jest.fn(),
        };
    });

    it('should be defined', () => {
        expect(interceptor).toBeDefined();
    });

    it('should log successful response', (done) => {
        const testData = { id: 1, name: 'Test' };

        mockCallHandler.handle = jest.fn().mockReturnValue(of(testData));

        interceptor.intercept(
            mockExecutionContext as ExecutionContext,
            mockCallHandler as CallHandler,
        );

        // Give it time to execute the observable
        setTimeout(() => {
            expect(mockLogger.logResponse).toHaveBeenCalled();
            const logCall = mockLogger.logResponse.mock.calls[0];
            expect(logCall[0]).toBe(200);
            done();
        }, 10);
    });

    it('should measure request duration', (done) => {
        mockCallHandler.handle = jest.fn().mockReturnValue(of({ success: true }));

        interceptor.intercept(
            mockExecutionContext as ExecutionContext,
            mockCallHandler as CallHandler,
        );

        setTimeout(() => {
            const logCall = mockLogger.logResponse.mock.calls[0];
            expect(logCall[3]).toBeGreaterThanOrEqual(0); // duration in ms
            done();
        }, 10);
    });

    it('should log response status code', (done) => {
        mockCallHandler.handle = jest.fn().mockReturnValue(
            of({ data: 'response' }),
        );

        interceptor.intercept(
            mockExecutionContext as ExecutionContext,
            mockCallHandler as CallHandler,
        );

        setTimeout(() => {
            expect(mockLogger.logResponse).toHaveBeenCalled();
            const logCall = mockLogger.logResponse.mock.calls[0];
            expect(logCall[0]).toBe(200);
            done();
        }, 10);
    });

    it('should handle errors from handler', (done) => {
        const error = new HttpException(
            'Bad Request',
            HttpStatus.BAD_REQUEST,
        );
        mockCallHandler.handle = jest
            .fn()
            .mockReturnValue(throwError(() => error));

        interceptor.intercept(
            mockExecutionContext as ExecutionContext,
            mockCallHandler as CallHandler,
        );

        setTimeout(() => {
            expect(mockLogger.error).toHaveBeenCalled();
            done();
        }, 10);
    });

    it('should log timing information', (done) => {
        mockCallHandler.handle = jest.fn().mockReturnValue(of({ ok: true }));

        interceptor.intercept(
            mockExecutionContext as ExecutionContext,
            mockCallHandler as CallHandler,
        );

        setTimeout(() => {
            const logCall = mockLogger.logResponse.mock.calls[0];
            // Duration should be a number representing milliseconds
            expect(typeof logCall[3]).toBe('number');
            expect(logCall[3]).toBeGreaterThanOrEqual(0);
            done();
        }, 10);
    });

    it('should call next handler', () => {
        mockCallHandler.handle = jest.fn().mockReturnValue(of({}));

        interceptor.intercept(
            mockExecutionContext as ExecutionContext,
            mockCallHandler as CallHandler,
        );

        expect(mockCallHandler.handle).toHaveBeenCalled();
    });

    it('should pass through response data', (done) => {
        const testData = { id: 123, name: 'Test Data' };
        mockCallHandler.handle = jest.fn().mockReturnValue(of(testData));

        const result = interceptor.intercept(
            mockExecutionContext as ExecutionContext,
            mockCallHandler as CallHandler,
        );

        result.subscribe((data) => {
            expect(data).toEqual(testData);
            done();
        });
    });

    it('should re-throw errors after logging', (done) => {
        const error = new Error('Test error');
        mockCallHandler.handle = jest
            .fn()
            .mockReturnValue(throwError(() => error));

        const result = interceptor.intercept(
            mockExecutionContext as ExecutionContext,
            mockCallHandler as CallHandler,
        );

        result.subscribe(
            () => {
                fail('Should have thrown error');
            },
            (err) => {
                expect(err).toEqual(error);
                expect(mockLogger.error).toHaveBeenCalled();
                done();
            },
        );
    });

    it('should get timing before and after handler execution', (done) => {
        const startTime = Date.now();
        mockCallHandler.handle = jest.fn().mockImplementation(() => {
            // Simulate some async work
            return of({ delayed: true });
        });

        interceptor.intercept(
            mockExecutionContext as ExecutionContext,
            mockCallHandler as CallHandler,
        );

        setTimeout(() => {
            const logCall = mockLogger.logResponse.mock.calls[0];
            const duration = logCall[3];

            expect(duration).toBeGreaterThanOrEqual(0);
            done();
        }, 10);
    });

    it('should handle null response', (done) => {
        mockCallHandler.handle = jest.fn().mockReturnValue(of(null));

        interceptor.intercept(
            mockExecutionContext as ExecutionContext,
            mockCallHandler as CallHandler,
        );

        setTimeout(() => {
            expect(mockLogger.logResponse).toHaveBeenCalled();
            done();
        }, 10);
    });

    it('should work with different HTTP methods', (done) => {
        (
            mockExecutionContext.switchToHttp() as any
        ).getRequest.mockReturnValue({
            method: 'POST',
            url: '/api/create',
        });

        mockCallHandler.handle = jest.fn().mockReturnValue(of({ created: true }));

        interceptor.intercept(
            mockExecutionContext as ExecutionContext,
            mockCallHandler as CallHandler,
        );

        setTimeout(() => {
            expect(mockCallHandler.handle).toHaveBeenCalled();
            done();
        }, 10);
    });
});
