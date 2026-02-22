/**
 * API Client Types and Interfaces
 *
 * Defines types for typed API client with fetch and zod validation
 * Supports both server-side and client-side usage
 */

import { z } from "zod";

/**
 * API Error Response type
 * Implements RFC 7807 Problem Details format
 */
export interface ApiError {
    type: string;
    title: string;
    status: number;
    detail: string;
    instance?: string;
    requestId?: string;
    timestamp?: string;
    errors?: Record<string, string[]>;
}

/**
 * API Request options
 * Allows customization of request behavior
 */
export interface ApiRequestOptions extends RequestInit {
    /** Query parameters to append to URL */
    params?: Record<string, string | number | boolean>;
    /** Skip global error handling and throw instead */
    throwErrors?: boolean;
    /** Custom timeout in milliseconds */
    timeout?: number;
}

/**
 * Typed API Response wrapper
 * Automatically validates response against zod schema
 */
export interface ApiResponse<T> {
    /** Response data (validated by zod schema) */
    data: T;
    /** Response status code */
    status: number;
    /** Response headers */
    headers: Headers;
    /** Request ID for tracing */
    requestId?: string;
}

/**
 * API Client configuration
 * Used to configure the API client behavior
 */
export interface ApiClientConfig {
    /** Base URL for API requests */
    baseUrl?: string;
    /** Default headers to include in all requests */
    headers?: Record<string, string>;
    /** Default timeout for requests in milliseconds */
    timeout?: number;
    /** Custom error handler */
    onError?: (error: ApiError) => void;
    /** Custom success handler */
    onSuccess?: <T>(data: T) => void;
}

/**
 * Parsed API error with more information
 * Created when API returns an error response
 */
export class ApiErrorResponse extends Error implements ApiError {
    type: string;
    title: string;
    status: number;
    detail: string;
    instance?: string;
    requestId?: string;
    timestamp?: string;
    errors?: Record<string, string[]>;

    constructor(error: ApiError) {
        super(error.detail);
        this.name = "ApiErrorResponse";
        this.type = error.type;
        this.title = error.title;
        this.status = error.status;
        this.detail = error.detail;
        this.instance = error.instance;
        this.requestId = error.requestId;
        this.timestamp = error.timestamp;
        this.errors = error.errors;
    }

    /**
     * Get validation errors for a specific field
     */
    getFieldErrors(field: string): string[] {
        return this.errors?.[field] ?? [];
    }

    /**
     * Check if error has validation errors
     */
    hasValidationErrors(): boolean {
        return this.errors !== undefined && Object.keys(this.errors).length > 0;
    }

    /**
     * Get all validation errors as a map
     */
    getAllErrors(): Record<string, string[]> {
        return this.errors ?? {};
    }
}

/**
 * Network error that's not from API
 * Typically connection issues
 */
export class NetworkError extends Error {
    constructor(message: string, public originalError?: Error) {
        super(message);
        this.name = "NetworkError";
    }
}

/**
 * Validation error from zod
 * Occurs when response doesn't match schema
 */
export class ValidationError extends Error {
    constructor(
        message: string,
        public zodErrors?: z.ZodError
    ) {
        super(message);
        this.name = "ValidationError";
    }
}
