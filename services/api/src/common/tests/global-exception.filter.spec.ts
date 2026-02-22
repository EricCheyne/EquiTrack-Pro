import { Test } from '@nestjs/testing';
import {
    BadRequestException,
    HttpException,
    HttpStatus,
    NotFoundException,
} from '@nestjs/common';
import { GlobalExceptionFilter } from '../filters/global-exception.filter';
import { StructuredLoggerService } from '../services/structured-logger.service';
import { ArgumentsHost } from '@nestjs/common';
import { Response } from 'express';

describe('GlobalExceptionFilter', () => {
    let filter: GlobalExceptionFilter;
    let mockLogger: jest.Mocked<StructuredLoggerService>;
    let mockResponse: jest.Mocked<Response>;
    let mockArgumentsHost: Partial<ArgumentsHost>;

    beforeEach(async () => {
        mockLogger = {
            error: jest.fn(),
            warn: jest.fn(),
            log: jest.fn(),
            debug: jest.fn(),
            verbose: jest.fn(),
            logRequest: jest.fn(),
            logResponse: jest.fn(),
            setContext: jest.fn(),
            resetContext: jest.fn(),
        } as any;

        const module = await Test.createTestingModule({
            providers: [
                GlobalExceptionFilter,
                {
                    provide: StructuredLoggerService,
                    useValue: mockLogger,
                },
            ],
        }).compile();

        filter = module.get<GlobalExceptionFilter>(GlobalExceptionFilter);

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            setHeader: jest.fn().mockReturnThis(),
        } as any;

        mockArgumentsHost = {
            switchToHttp: jest.fn().mockReturnValue({
                getRequest: jest.fn().mockReturnValue({
                    url: '/test',
                    method: 'GET',
                    id: 'test-request-id',
                }),
                getResponse: jest.fn().mockReturnValue(mockResponse),
            }),
        };
    });

    it('should be defined', () => {
        expect(filter).toBeDefined();
    });

    it('should handle BadRequestException with validation errors', () => {
        const exception = new BadRequestException({
            message: 'Validation failed',
            error: {
                email: ['Email is invalid'],
                name: ['Name is required'],
            },
        });

        filter.catch(
            exception,
            mockArgumentsHost as ArgumentsHost,
        );

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalled();

        const response = mockResponse.json.mock.calls[0][0];
        expect(response.status).toBe(400);
        expect(response.title).toBe('Bad Request');
        expect(response.errors).toEqual({
            email: ['Email is invalid'],
            name: ['Name is required'],
        });
    });

    it('should handle NotFoundException', () => {
        const exception = new NotFoundException('Resource not found');

        filter.catch(
            exception,
            mockArgumentsHost as ArgumentsHost,
        );

        expect(mockResponse.status).toHaveBeenCalledWith(404);
        expect(mockResponse.json).toHaveBeenCalled();

        const response = mockResponse.json.mock.calls[0][0];
        expect(response.status).toBe(404);
        expect(response.title).toBe('Not Found');
        expect(response.detail).toBe('Resource not found');
    });

    it('should handle generic HttpException', () => {
        const exception = new HttpException('Server error', HttpStatus.INTERNAL_SERVER_ERROR);

        filter.catch(
            exception,
            mockArgumentsHost as ArgumentsHost,
        );

        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalled();

        const response = mockResponse.json.mock.calls[0][0];
        expect(response.status).toBe(500);
        expect(response.title).toBe('Internal Server Error');
    });

    it('should handle generic Error', () => {
        const exception = new Error('Unexpected error');

        filter.catch(
            exception,
            mockArgumentsHost as ArgumentsHost,
        );

        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalled();

        const response = mockResponse.json.mock.calls[0][0];
        expect(response.status).toBe(500);
        expect(response.detail).toBe('Unexpected error');
    });

    it('should include RFC 7807 required fields in response', () => {
        const exception = new BadRequestException('Validation failed');

        filter.catch(
            exception,
            mockArgumentsHost as ArgumentsHost,
        );

        const response = mockResponse.json.mock.calls[0][0];

        expect(response).toHaveProperty('type');
        expect(response).toHaveProperty('title');
        expect(response).toHaveProperty('status');
        expect(response).toHaveProperty('detail');
        expect(response).toHaveProperty('instance');
        expect(response).toHaveProperty('timestamp');
        expect(response).toHaveProperty('requestId');
    });

    it('should include request ID in error response', () => {
        const exception = new NotFoundException('Not found');

        filter.catch(
            exception,
            mockArgumentsHost as ArgumentsHost,
        );

        const response = mockResponse.json.mock.calls[0][0];
        expect(response.requestId).toBe('test-request-id');
    });

    it('should set correct request instance in response', () => {
        const exception = new NotFoundException('Not found');

        filter.catch(
            exception,
            mockArgumentsHost as ArgumentsHost,
        );

        const response = mockResponse.json.mock.calls[0][0];
        expect(response.instance).toBe('/test');
    });

    it('should log exceptions using StructuredLoggerService', () => {
        const exception = new BadRequestException('Validation failed');

        filter.catch(
            exception,
            mockArgumentsHost as ArgumentsHost,
        );

        expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should format validation errors from BadRequestException', () => {
        const exception = new BadRequestException({
            message: 'Validation failed',
            error: {
                username: ['Username is required', 'Username must be unique'],
                email: ['Email is invalid'],
            },
        });

        filter.catch(
            exception,
            mockArgumentsHost as ArgumentsHost,
        );

        const response = mockResponse.json.mock.calls[0][0];
        expect(response.errors.username).toEqual([
            'Username is required',
            'Username must be unique',
        ]);
        expect(response.errors.email).toEqual(['Email is invalid']);
    });

    it('should include RFC 7807 type URL', () => {
        const exception = new BadRequestException('Invalid request');

        filter.catch(
            exception,
            mockArgumentsHost as ArgumentsHost,
        );

        const response = mockResponse.json.mock.calls[0][0];
        expect(response.type).toBe(
            'https://httpwg.org/specs/rfc7807.html#section-3.1',
        );
    });

    it('should set x-request-id header in response', () => {
        const exception = new NotFoundException('Not found');

        filter.catch(
            exception,
            mockArgumentsHost as ArgumentsHost,
        );

        expect(mockResponse.setHeader).toHaveBeenCalledWith(
            'x-request-id',
            'test-request-id',
        );
    });

    it('should include timestamp in ISO 8601 format', () => {
        const exception = new BadRequestException('Error');

        filter.catch(
            exception,
            mockArgumentsHost as ArgumentsHost,
        );

        const response = mockResponse.json.mock.calls[0][0];
        expect(response.timestamp).toBeDefined();
        expect(typeof response.timestamp).toBe('string');
        // Verify ISO 8601 format
        expect(new Date(response.timestamp)).not.toEqual(new Date('Invalid Date'));
    });
});
