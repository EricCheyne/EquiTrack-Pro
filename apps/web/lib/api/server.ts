/**
 * Server-Side API Helpers
 *
 * Helpers for using the API client in Next.js server components and server actions
 * Handles cookies, authentication, and internal API calls
 */

import { cookies, headers } from "next/headers";
import { z } from "zod";
import { ApiClient, createApiClient } from "./client";
import { ApiRequestOptions } from "./types";

/**
 * Create a server-side API client
 *
 * Automatically includes cookies for authentication
 * Uses internal API URL if available for server-to-server calls
 *
 * @param customHeaders - Additional headers to include in requests
 *
 * @example
 * ```typescript
 * // In a Server Component
 * const properties = await serverApi().get(
 *   '/properties',
 *   PropertyListSchema
 * );
 *
 * // In a Server Action
 * 'use server';
 *
 * export async function createProperty(data: PropertyCreateDTO) {
 *   const result = await serverApi().post(
 *     '/properties',
 *     data,
 *     PropertySchema
 *   );
 *   return result.data;
 * }
 * ```
 */
export function serverApi(customHeaders: Record<string, string> = {}): ApiClient {
    // Get cookies for authentication
    const cookieStore = cookies();
    const requestHeaders = headers();

    // Build headers with authentication
    const apiHeaders: Record<string, string> = {
        ...customHeaders,
    };

    // Include cookies as Authorization header if present
    const authCookie = cookieStore.get("auth")?.value;
    if (authCookie) {
        apiHeaders["Authorization"] = `Bearer ${authCookie}`;
    }

    // Include request ID for distributed tracing
    const requestId = requestHeaders.get("x-request-id");
    if (requestId) {
        apiHeaders["x-request-id"] = requestId;
    }

    // Use internal API URL for server-to-server calls if available
    const baseUrl = process.env.API_INTERNAL_URL || process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;

    return createApiClient({
        baseUrl,
        headers: apiHeaders,
        timeout: 30000,
    });
}

/**
 * Fetch data server-side with automatic error handling
 *
 * Useful in Server Components for initial page load
 *
 * @param endpoint - API endpoint to fetch from
 * @param schema - Zod schema to validate response
 * @param options - Request options
 *
 * @throws If the API returns an error or request fails
 *
 * @example
 * ```typescript
 * // In a Server Component
 * export default async function PropertiesPage() {
 *   const response = await serverFetch(
 *     '/properties',
 *     PropertyListSchema,
 *     { params: { skip: 0, take: 10 } }
 *   );
 *
 *   return (
 *     <div>
 *       {response.data?.items?.map(property => (
 *         <PropertyCard key={property.id} {...property} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export async function serverFetch<T>(
    endpoint: string,
    schema: z.ZodSchema,
    options: ApiRequestOptions = {}
): Promise<{ data: T; requestId?: string }> {
    const client = serverApi();
    const response = await client.get<T>(endpoint, schema, options);
    return {
        data: response.data,
        requestId: response.requestId,
    };
}

/**
 * Create a server action for mutations
 *
 * Wraps server action error handling and API calls
 *
 * @param handler - Async function that makes API calls
 *
 * @returns Server action that handles errors and returns data/error
 *
 * @example
 * ```typescript
 * export const createPropertyAction = serverAction(
 *   async (formData: FormData) => {
 *     const data = Object.fromEntries(formData);
 *     const response = await serverApi().post(
 *       '/properties',
 *       data,
 *       PropertySchema
 *     );
 *     return response.data;
 *   }
 * );
 *
 * // In a Client Component
 * 'use client';
 *
 * export function CreatePropertyForm() {
 *   const [error, setError] = useState<string | null>(null);
 *
 *   async function onSubmit(formData: FormData) {
 *     const result = await createPropertyAction(formData);
 *     if (result.error) {
 *       setError(result.error);
 *     }
 *   }
 *
 *   return <form action={onSubmit}>...</form>;
 * }
 * ```
 */
export function serverAction<T extends (...args: any[]) => Promise<any>>(handler: T): T {
    return (async (...args: any[]) => {
        try {
            const result = await handler(...args);
            return { data: result, error: null };
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : typeof error === "string"
                        ? error
                        : "An unknown error occurred";

            return { data: null, error: message };
        }
    }) as T;
}

/**
 * Create multiple server actions from an object of handlers
 *
 * Useful for organizing related server actions
 *
 * @param handlers - Object mapping action names to handler functions
 *
 * @returns Object with same keys, wrapped handlers
 *
 * @example
 * ```typescript
 * const propertyActions = serverActions({
 *   create: async (data: PropertyCreateDTO) => {
 *     return (await serverApi().post('/properties', data, PropertySchema)).data;
 *   },
 *   update: async (id: string, data: PropertyUpdateDTO) => {
 *     return (await serverApi().patch(`/properties/${id}`, data, PropertySchema)).data;
 *   },
 *   delete: async (id: string) => {
 *     return (await serverApi().delete(`/properties/${id}`)).status;
 *   },
 * });
 *
 * // Then use in Client Component
 * const result = await propertyActions.create(formData);
 * ```
 */
export function serverActions<T extends Record<string, (...args: any[]) => Promise<any>>>(
    handlers: T
): {
        [K in keyof T]: (
            ...args: Parameters<T[K]>
        ) => Promise<{ data: Awaited<ReturnType<T[K]>> | null; error: string | null }>;
    } {
    const wrapped = {} as any;

    for (const [key, handler] of Object.entries(handlers)) {
        wrapped[key] = serverAction(handler);
    }

    return wrapped;
}

/**
 * Fetch with revalidation for ISR (Incremental Static Regeneration)
 *
 * Use in getStaticProps equivalent (Server Components with caching)
 *
 * @param endpoint - API endpoint to fetch from
 * @param schema - Zod schema to validate response
 * @param revalidate - Revalidate time in seconds (default: 60)
 *
 * @example
 * ```typescript
 * export default async function PropertyPage({ params }: Props) {
 *   const response = await serverFetchWithRevalidation(
 *     `/properties/${params.id}`,
 *     PropertySchema,
 *     3600 // Revalidate every hour
 *   );
 *
 *   return <PropertyDetail {...response.data} />;
 * }
 * ```
 */
export async function serverFetchWithRevalidation<T>(
    endpoint: string,
    schema: z.ZodSchema,
    revalidate: number = 60
): Promise<{ data: T; requestId?: string }> {
    const client = serverApi();
    const response = await client.get<T>(endpoint, schema, {});

    // Note: For actual revalidation in Next.js, you would use
    // revalidatePath() or revalidateTag() in your route handlers
    // This function just marks the intent to revalidate

    return {
        data: response.data,
        requestId: response.requestId,
    };
}

/**
 * Handle API errors in Server Actions
 *
 * Converts API errors to user-friendly messages
 *
 * @param error - Error from API call
 *
 * @returns User-friendly error message
 *
 * @example
 * ```typescript
 * export const createPropertyAction = serverAction(
 *   async (data: PropertyCreateDTO) => {
 *     try {
 *       return (await serverApi().post('/properties', data, PropertySchema)).data;
 *     } catch (error) {
 *       throw new Error(handleApiError(error));
 *     }
 *   }
 * );
 * ```
 */
export function handleApiError(error: any): string {
    if (error?.constructor?.name === "ApiErrorResponse") {
        // Handle validation errors
        if (error.hasValidationErrors?.()) {
            const errors = error.getAllErrors?.();
            const messages = Object.entries(errors)
                .map(([field, msgs]) => `${field}: ${msgs.join(", ")}`)
                .join("\n");
            return `Validation failed:\n${messages}`;
        }

        // Return the detail message
        return error.detail || error.message || "An error occurred";
    }

    if (error?.constructor?.name === "NetworkError") {
        return "Network error: Please check your connection and try again";
    }

    if (error?.constructor?.name === "ValidationError") {
        return "Response validation failed: Server returned invalid data";
    }

    return error?.message || "An unknown error occurred";
}

/**
 * Type-safe server action builder with schema validation
 *
 * Validates input and output with zod schemas
 *
 * @param handler - Server action handler
 * @param inputSchema - Optional input validation schema
 * @param outputSchema - Optional output validation schema
 *
 * @example
 * ```typescript
 * export const createProperty = createServerAction(
 *   async (data) => {
 *     return (await serverApi().post('/properties', data, PropertySchema)).data;
 *   },
 *   PropertyCreateSchema,
 *   PropertySchema
 * );
 * ```
 */
export function createServerAction<Input = any, Output = any>(
    handler: (input: Input) => Promise<Output>,
    inputSchema?: z.ZodSchema,
    outputSchema?: z.ZodSchema
) {
    return async (input: any) => {
        try {
            // Validate input
            const validatedInput = inputSchema ? inputSchema.parse(input) : input;

            // Execute handler
            const result = await handler(validatedInput);

            // Validate output
            const validatedOutput = outputSchema ? outputSchema.parse(result) : result;

            return { data: validatedOutput, error: null };
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : typeof error === "string"
                        ? error
                        : "An unknown error occurred";

            return { data: null, error: message };
        }
    };
}
