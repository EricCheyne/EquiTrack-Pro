/**
 * Core API Client
 *
 * Provides typed fetch wrapper with zod validation
 * Supports both server-side and client-side usage
 */

import { z } from "zod";
import {
    ApiRequestOptions,
    ApiResponse,
    ApiError,
    ApiErrorResponse,
    NetworkError,
    ValidationError,
    ApiClientConfig,
} from "./types";

/**
 * Core API client with typed requests and responses
 *
 * Usage:
 * ```typescript
 * const client = new ApiClient({ baseUrl: 'http://localhost:3001' });
 *
 * // With zod schema for type-safe responses
 * const response = await client.get('/properties', PropertySchema);
 *
 * // Raw response without validation
 * const raw = await client.getRaw('/health/ping');
 * ```
 */
export class ApiClient {
    private baseUrl: string;
    private defaultHeaders: Record<string, string>;
    private timeout: number;
    private onError?: (error: ApiError) => void;
    private onSuccess?: <T>(data: T) => void;

    constructor(config: ApiClientConfig = {}) {
        this.baseUrl = config.baseUrl || this.getDefaultBaseUrl();
        this.defaultHeaders = config.headers || {};
        this.timeout = config.timeout || 30000;
        this.onError = config.onError;
        this.onSuccess = config.onSuccess;

        // Ensure baseUrl doesn't have trailing slash
        if (this.baseUrl.endsWith("/")) {
            this.baseUrl = this.baseUrl.slice(0, -1);
        }
    }

    /**
     * Get default base URL from environment or return localhost
     */
    private getDefaultBaseUrl(): string {
        if (typeof window !== "undefined") {
            // Client-side
            return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        }
        // Server-side - use internal hostname if available, otherwise localhost
        return process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    }

    /**
     * Build full URL from endpoint and query params
     */
    private buildUrl(endpoint: string, params?: Record<string, any>): string {
        const url = new URL(endpoint.startsWith("/") ? endpoint : `/${endpoint}`, this.baseUrl);

        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    url.searchParams.append(key, String(value));
                }
            });
        }

        return url.toString();
    }

    /**
     * Make a request with timeout and error handling
     */
    private async request<T>(
        url: string,
        options: ApiRequestOptions,
        schema?: z.ZodSchema
    ): Promise<ApiResponse<T>> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), options.timeout || this.timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
                headers: {
                    "Content-Type": "application/json",
                    ...this.defaultHeaders,
                    ...options.headers,
                },
            });

            const responseText = await response.text();
            let responseData: any;

            try {
                responseData = responseText ? JSON.parse(responseText) : {};
            } catch {
                responseData = { raw: responseText };
            }

            // Extract request ID from headers or response
            const requestId =
                response.headers.get("x-request-id") ||
                (responseData && typeof responseData === "object" ? responseData.requestId : undefined);

            // Handle non-2xx status codes
            if (!response.ok) {
                const error: ApiError = {
                    type: responseData?.type || "https://httpwg.org/specs/rfc7807.html#section-3.1",
                    title: responseData?.title || `HTTP ${response.status}`,
                    status: response.status,
                    detail: responseData?.detail || responseText || "An error occurred",
                    instance: responseData?.instance || url,
                    requestId,
                    timestamp: responseData?.timestamp || new Date().toISOString(),
                    errors: responseData?.errors,
                };

                const apiError = new ApiErrorResponse(error);

                if (this.onError) {
                    this.onError(error);
                }

                if (options.throwErrors !== false) {
                    throw apiError;
                }

                return { data: null as any, status: response.status, headers: response.headers, requestId };
            }

            // Validate response with schema if provided
            if (schema) {
                try {
                    const validatedData = schema.parse(responseData);
                    if (this.onSuccess) {
                        this.onSuccess(validatedData);
                    }
                    return {
                        data: validatedData as T,
                        status: response.status,
                        headers: response.headers,
                        requestId,
                    };
                } catch (error) {
                    if (error instanceof z.ZodError) {
                        const validationError = new ValidationError(
                            `Response validation failed: ${error.message}`,
                            error
                        );
                        throw validationError;
                    }
                    throw error;
                }
            }

            if (this.onSuccess) {
                this.onSuccess(responseData);
            }

            return {
                data: responseData as T,
                status: response.status,
                headers: response.headers,
                requestId,
            };
        } catch (error) {
            if (error instanceof Error && error.name === "AbortError") {
                throw new NetworkError(`Request timeout after ${options.timeout || this.timeout}ms`);
            }

            if (error instanceof ApiErrorResponse || error instanceof ValidationError) {
                throw error;
            }

            if (error instanceof Error) {
                throw new NetworkError(error.message, error);
            }

            throw new NetworkError("An unknown error occurred");
        } finally {
            clearTimeout(timeoutId);
        }
    }

    /**
     * GET request with type-safe response validation
     *
     * @param endpoint - API endpoint path
     * @param schema - Zod schema to validate response
     * @param options - Request options (params, headers, etc)
     *
     * @example
     * ```typescript
     * const properties = await client.get('/properties', PropertyListSchema, {
     *   params: { skip: 0, take: 10 }
     * });
     * ```
     */
    async get<T>(
        endpoint: string,
        schema: z.ZodSchema,
        options: ApiRequestOptions = {}
    ): Promise<ApiResponse<T>> {
        const url = this.buildUrl(endpoint, options.params);
        return this.request<T>(url, { ...options, method: "GET" }, schema);
    }

    /**
     * POST request with request/response validation
     *
     * @param endpoint - API endpoint path
     * @param body - Request body (or null for no body)
     * @param schema - Zod schema to validate response
     * @param options - Request options
     *
     * @example
     * ```typescript
     * const newProperty = await client.post(
     *   '/properties',
     *   { name: 'Test', type: 'LAND' },
     *   PropertySchema
     * );
     * ```
     */
    async post<T>(
        endpoint: string,
        body?: any,
        schema?: z.ZodSchema,
        options: ApiRequestOptions = {}
    ): Promise<ApiResponse<T>> {
        const url = this.buildUrl(endpoint, options.params);
        return this.request<T>(
            url,
            {
                ...options,
                method: "POST",
                body: body !== undefined && body !== null ? JSON.stringify(body) : undefined,
            },
            schema
        );
    }

    /**
     * PATCH request with request/response validation
     *
     * @param endpoint - API endpoint path (including ID)
     * @param body - Request body for update
     * @param schema - Zod schema to validate response
     * @param options - Request options
     *
     * @example
     * ```typescript
     * const updated = await client.patch(
     *   '/properties/123',
     *   { name: 'Updated' },
     *   PropertySchema
     * );
     * ```
     */
    async patch<T>(
        endpoint: string,
        body?: any,
        schema?: z.ZodSchema,
        options: ApiRequestOptions = {}
    ): Promise<ApiResponse<T>> {
        const url = this.buildUrl(endpoint, options.params);
        return this.request<T>(
            url,
            {
                ...options,
                method: "PATCH",
                body: body !== undefined && body !== null ? JSON.stringify(body) : undefined,
            },
            schema
        );
    }

    /**
     * DELETE request
     *
     * @param endpoint - API endpoint path (including ID)
     * @param schema - Optional zod schema for response validation
     * @param options - Request options
     *
     * @example
     * ```typescript
     * const response = await client.delete('/properties/123');
     * ```
     */
    async delete<T = void>(
        endpoint: string,
        schema?: z.ZodSchema,
        options: ApiRequestOptions = {}
    ): Promise<ApiResponse<T>> {
        const url = this.buildUrl(endpoint, options.params);
        return this.request<T>(url, { ...options, method: "DELETE" }, schema);
    }

    /**
     * GET request without schema validation
     * Returns raw response data
     *
     * @param endpoint - API endpoint path
     * @param options - Request options
     */
    async getRaw<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> {
        const url = this.buildUrl(endpoint, options.params);
        return this.request<T>(url, { ...options, method: "GET" });
    }

    /**
     * POST request without schema validation
     * Returns raw response data
     */
    async postRaw<T>(
        endpoint: string,
        body?: any,
        options: ApiRequestOptions = {}
    ): Promise<ApiResponse<T>> {
        const url = this.buildUrl(endpoint, options.params);
        return this.request<T>(url, {
            ...options,
            method: "POST",
            body: body !== undefined && body !== null ? JSON.stringify(body) : undefined,
        });
    }

    /**
     * Set custom error handler
     */
    setErrorHandler(handler: (error: ApiError) => void): void {
        this.onError = handler;
    }

    /**
     * Set custom success handler
     */
    setSuccessHandler<T>(handler: (data: T) => void): void {
        this.onSuccess = handler as any;
    }

    /**
     * Create a new client with merged config
     * Useful for creating scoped clients with different base URLs
     */
    createScoped(config: Partial<ApiClientConfig>): ApiClient {
        return new ApiClient({
            baseUrl: this.baseUrl,
            headers: this.defaultHeaders,
            timeout: this.timeout,
            onError: this.onError,
            onSuccess: this.onSuccess,
            ...config,
        });
    }
}

/**
 * Global API client instance
 * Configured with default settings
 */
export const apiClient = new ApiClient();

/**
 * Create a new API client with custom configuration
 *
 * @example
 * ```typescript
 * const customClient = createApiClient({
 *   baseUrl: 'https://api.example.com',
 *   timeout: 60000,
 * });
 * ```
 */
export function createApiClient(config: ApiClientConfig): ApiClient {
    return new ApiClient(config);
}
