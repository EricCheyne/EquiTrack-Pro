/**
 * React Hooks for API Client
 *
 * Provides useApi, useMutation, and other hooks for data fetching
 * Handles loading, error, and success states automatically
 */

"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import { z } from "zod";
import { apiClient } from "./client";
import {
    ApiResponse,
    ApiErrorResponse,
    NetworkError,
    ValidationError,
    ApiRequestOptions,
} from "./types";

/**
 * State for data fetching hooks
 */
export interface UseApiState<T> {
    /** Fetched data */
    data: T | null;
    /** Loading state */
    isLoading: boolean;
    /** Error if one occurred */
    error: Error | null;
    /** Is this the first load */
    isInitial: boolean;
}

/**
 * Options for useApi hook
 */
export interface UseApiOptions extends ApiRequestOptions {
    /** Skip fetching initially */
    skip?: boolean;
    /** Refetch interval in milliseconds */
    refetchInterval?: number;
    /** Refetch on window focus */
    refetchOnFocus?: boolean;
    /** Retry failed requests up to N times */
    retry?: number;
    /** Delay between retries in milliseconds */
    retryDelay?: number;
    /** Called when data is fetched */
    onSuccess?: <T>(data: T) => void;
    /** Called when error occurs */
    onError?: (error: Error) => void;
}

/**
 * Hook for GET requests with automatic loading/error handling
 *
 * @param endpoint - API endpoint to fetch from
 * @param schema - Zod schema to validate response
 * @param options - Hook options
 *
 * @example
 * ```typescript
 * // Basic usage
 * const { data, isLoading, error } = useApi(
 *   '/properties',
 *   PropertyListSchema
 * );
 *
 * // With params and refetch
 * const { data, isLoading, refetch } = useApi(
 *   '/properties',
 *   PropertyListSchema,
 *   {
 *     params: { skip: 0, take: 10 },
 *     refetchInterval: 30000,
 *   }
 * );
 *
 * // Skip initial fetch
 * const { data, refetch } = useApi(
 *   '/properties',
 *   PropertyListSchema,
 *   { skip: true }
 * );
 *
 * return <button onClick={() => refetch()}>Load Properties</button>;
 * ```
 */
export function useApi<T>(
    endpoint: string,
    schema: z.ZodSchema,
    options: UseApiOptions = {}
): UseApiState<T> & {
    refetch: () => Promise<T | null>;
    mutate: (data: T | null) => void;
} {
    const [state, setState] = useState<UseApiState<T>>({
        data: null,
        isLoading: !options.skip,
        error: null,
        isInitial: true,
    });

    const retryCountRef = useRef(0);
    const refetchIntervalRef = useRef<NodeJS.Timeout>();

    const fetch = useCallback(
        async (retryCount = 0): Promise<T | null> => {
            try {
                setState((prev) => ({ ...prev, isLoading: true, error: null }));

                const response = await apiClient.get<T>(endpoint, schema, {
                    ...options,
                    params: options.params,
                });

                setState((prev) => ({
                    ...prev,
                    data: response.data,
                    isLoading: false,
                    error: null,
                    isInitial: false,
                }));

                retryCountRef.current = 0;

                if (options.onSuccess) {
                    options.onSuccess(response.data);
                }

                return response.data;
            } catch (error) {
                const err = error instanceof Error ? error : new Error("Unknown error");

                if (
                    options.retry &&
                    retryCount < options.retry &&
                    (error instanceof NetworkError || error instanceof ApiErrorResponse)
                ) {
                    retryCountRef.current = retryCount + 1;
                    const delay = options.retryDelay || 1000;
                    await new Promise((resolve) => setTimeout(resolve, delay));
                    return fetch(retryCount + 1);
                }

                setState((prev) => ({
                    ...prev,
                    isLoading: false,
                    error: err,
                    isInitial: false,
                }));

                if (options.onError) {
                    options.onError(err);
                }

                return null;
            }
        },
        [endpoint, schema, options]
    );

    // Initial fetch
    useEffect(() => {
        if (options.skip) return;
        fetch();
    }, [fetch, options.skip]);

    // Refetch interval
    useEffect(() => {
        if (!options.refetchInterval || options.skip) return;

        refetchIntervalRef.current = setInterval(() => {
            fetch();
        }, options.refetchInterval);

        return () => {
            if (refetchIntervalRef.current) {
                clearInterval(refetchIntervalRef.current);
            }
        };
    }, [fetch, options.refetchInterval, options.skip]);

    // Refetch on focus
    useEffect(() => {
        if (!options.refetchOnFocus) return;

        const handleFocus = () => {
            fetch();
        };

        window.addEventListener("focus", handleFocus);
        return () => window.removeEventListener("focus", handleFocus);
    }, [fetch, options.refetchOnFocus]);

    return {
        ...state,
        refetch: () => fetch(),
        mutate: (data) => {
            setState((prev) => ({ ...prev, data }));
        },
    };
}

/**
 * Hook for mutations (POST, PATCH, DELETE)
 *
 * @param endpoint - API endpoint
 * @param method - HTTP method ('post', 'patch', 'delete')
 * @param schema - Optional zod schema for response
 *
 * @example
 * ```typescript
 * // Create
 * const { mutate, isLoading } = useMutation(
 *   '/properties',
 *   'post',
 *   PropertySchema
 * );
 *
 * const handleCreate = async (data) => {
 *   const result = await mutate(data);
 *   if (!result?.error) router.push(`/properties/${result?.data.id}`);
 * };
 *
 * // Update
 * const { mutate, error } = useMutation(
 *   `/properties/${id}`,
 *   'patch',
 *   PropertySchema
 * );
 *
 * // Delete
 * const { mutate, isPending } = useMutation(
 *   `/properties/${id}`,
 *   'delete'
 * );
 * ```
 */
export function useMutation<T = any>(
    endpoint: string,
    method: "post" | "patch" | "delete" = "post",
    schema?: z.ZodSchema,
    options: UseApiOptions = {}
): {
    mutate: (body?: any, requestOptions?: ApiRequestOptions) => Promise<T | null>;
    data: T | null;
    error: Error | null;
    isPending: boolean;
    reset: () => void;
} {
    const [state, setState] = useState<{
        data: T | null;
        error: Error | null;
        isPending: boolean;
    }>({
        data: null,
        error: null,
        isPending: false,
    });

    const mutate = useCallback(
        async (body?: any, requestOptions?: ApiRequestOptions): Promise<T | null> => {
            try {
                setState((prev) => ({ ...prev, isPending: true, error: null }));

                let response: ApiResponse<T>;

                if (method === "post") {
                    response = await apiClient.post<T>(endpoint, body, schema, requestOptions);
                } else if (method === "patch") {
                    response = await apiClient.patch<T>(endpoint, body, schema, requestOptions);
                } else {
                    response = await apiClient.delete<T>(endpoint, schema, requestOptions);
                }

                setState((prev) => ({
                    ...prev,
                    data: response.data,
                    isPending: false,
                    error: null,
                }));

                if (options.onSuccess) {
                    options.onSuccess(response.data);
                }

                return response.data;
            } catch (error) {
                const err = error instanceof Error ? error : new Error("Unknown error");

                setState((prev) => ({
                    ...prev,
                    error: err,
                    isPending: false,
                }));

                if (options.onError) {
                    options.onError(err);
                }

                return null;
            }
        },
        [endpoint, method, schema, options]
    );

    const reset = useCallback(() => {
        setState({ data: null, error: null, isPending: false });
    }, []);

    return {
        mutate,
        data: state.data,
        error: state.error,
        isPending: state.isPending,
        reset,
    };
}

/**
 * Hook for paginated GET requests
 *
 * @param endpoint - API endpoint
 * @param schema - Zod schema for response
 * @param initialPage - Starting page (default: 1)
 * @param pageSize - Items per page (default: 10)
 *
 * @example
 * ```typescript
 * const {
 *   data,
 *   page,
 *   totalPages,
 *   goToNext,
 *   goToPrevious,
 * } = usePaginated('/properties', PropertyListSchema);
 *
 * return (
 *   <>
 *     {data?.items.map(item => <PropertyCard key={item.id} {...item} />)}
 *     <button onClick={() => goToPrevious()} disabled={page === 1}>
 *       Previous
 *     </button>
 *     <button onClick={() => goToNext()} disabled={page === totalPages}>
 *       Next
 *     </button>
 *   </>
 * );
 * ```
 */
export function usePaginated<T extends { items?: any[] }>(
    endpoint: string,
    schema: z.ZodSchema,
    initialPage = 1,
    pageSize = 10,
    options: UseApiOptions = {}
): UseApiState<T> & {
    page: number;
    goToPage: (page: number) => Promise<T | null>;
    goToNext: () => Promise<T | null>;
    goToPrevious: () => Promise<T | null>;
    totalPages: number;
} {
    const [page, setPage] = useState(initialPage);

    const { data, isLoading, error, isInitial, refetch } = useApi<T>(
        endpoint,
        schema,
        {
            ...options,
            params: {
                ...options.params,
                skip: (page - 1) * pageSize,
                take: pageSize,
            },
        }
    );

    const goToPage = useCallback(
        async (newPage: number) => {
            setPage(newPage);
            return refetch();
        },
        [refetch]
    );

    const goToNext = useCallback(
        () => goToPage(page + 1),
        [page, goToPage]
    );

    const goToPrevious = useCallback(
        () => goToPage(Math.max(1, page - 1)),
        [page, goToPage]
    );

    // Calculate total pages from data
    const totalPages = data && "total" in data ? Math.ceil(data.total / pageSize) : 1;

    return {
        data,
        isLoading,
        error,
        isInitial,
        page,
        totalPages,
        goToPage,
        goToNext,
        goToPrevious,
    };
}

/**
 * Hook for debounced search/filter requests
 *
 * @param endpoint - API endpoint
 * @param schema - Zod schema for response
 * @param debounceMs - Debounce delay in milliseconds
 *
 * @example
 * ```typescript
 * const [search, setSearch] = useState('');
 * const { data, isLoading } = useDebouncedApi(
 *   '/properties',
 *   PropertyListSchema,
 *   500,
 *   { params: { query: search } }
 * );
 *
 * return (
 *   <>
 *     <input value={search} onChange={(e) => setSearch(e.target.value)} />
 *     {isLoading && <Spinner />}
 *     {data?.items.map(item => <Item key={item.id} {...item} />)}
 *   </>
 * );
 * ```
 */
export function useDebouncedApi<T>(
    endpoint: string,
    schema: z.ZodSchema,
    debounceMs = 500,
    options: UseApiOptions = {}
): UseApiState<T> & { refetch: () => Promise<T | null> } {
    const [debouncedEndpoint, setDebouncedEndpoint] = useState(endpoint);

    // Debounce endpoint changes
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedEndpoint(endpoint);
        }, debounceMs);

        return () => clearTimeout(timer);
    }, [endpoint, debounceMs]);

    return useApi<T>(debouncedEndpoint, schema, {
        ...options,
        skip: options.skip || endpoint === "",
    });
}
