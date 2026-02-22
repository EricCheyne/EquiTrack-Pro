// Shared types for EquiTrack Pro
// Add type definitions that are used across the monorepo

export interface IUser {
    id: string;
    email: string;
    name?: string;
}

export interface IApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}
