/**
 * Shared Types for EquiTrack Pro
 * Common types used across the monorepo
 */

/**
 * User Types
 */
export interface IUser {
    id: string;
    email: string;
    name?: string;
}

/**
 * API Response Wrapper
 */
export interface IApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

/**
 * Paginated Response
 */
export interface IPaginatedResponse<T> {
    items: T[];
    total: number;
    skip: number;
    take: number;
}

/**
 * Error Response
 */
export interface IErrorResponse {
    statusCode: number;
    message: string;
    timestamp: string;
    path?: string;
    details?: Record<string, unknown>;
}
