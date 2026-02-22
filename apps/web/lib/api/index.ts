/**
 * EquiTrack Pro Web API Client
 *
 * Main export point for all API client functionality
 * Supports typed requests/responses with zod validation
 * Works in both server and client components
 */

// Core client
export { ApiClient, apiClient, createApiClient } from "./client";
export type { ApiClientConfig, ApiRequestOptions, ApiResponse } from "./types";

// Types and errors
export {
    ApiErrorResponse,
    NetworkError,
    ValidationError,
    type ApiError,
} from "./types";

// React hooks for client-side
export {
    useApi,
    useMutation,
    usePaginated,
    useDebouncedApi,
    type UseApiState,
    type UseApiOptions,
} from "./hooks";

// Server-side helpers
export {
    serverApi,
    serverFetch,
    serverAction,
    serverActions,
    serverFetchWithRevalidation,
    handleApiError,
    createServerAction,
} from "./server";
