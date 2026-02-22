/**
 * Problem Details JSON Response (RFC 7807)
 * Standard format for API error responses
 */
export interface ProblemDetails {
    type: string; // URI reference to problem type documentation
    title: string; // Short human-readable summary
    status: number; // HTTP status code
    detail?: string; // Human-readable explanation
    instance?: string; // Request path
    requestId?: string; // Request ID for tracing
    timestamp?: string; // ISO timestamp
    errors?: Record<string, string[]>; // Validation errors
    [key: string]: unknown; // Extensible for custom properties
}

/**
 * Create Problem Details response
 */
export function createProblemDetails(
    status: number,
    title: string,
    detail?: string,
    instance?: string,
    requestId?: string,
    errors?: Record<string, string[]>
): ProblemDetails {
    const problemDetails: ProblemDetails = {
        type: `https://httpwg.org/specs/rfc7807.html#section-3.1`,
        title,
        status,
        timestamp: new Date().toISOString(),
    };

    if (detail) {
        problemDetails.detail = detail;
    }

    if (instance) {
        problemDetails.instance = instance;
    }

    if (requestId) {
        problemDetails.requestId = requestId;
    }

    if (errors && Object.keys(errors).length > 0) {
        problemDetails.errors = errors;
    }

    return problemDetails;
}

/**
 * HTTP Status Code to Title Mapping
 */
export const STATUS_TITLES: Record<number, string> = {
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    409: "Conflict",
    422: "Unprocessable Entity",
    429: "Too Many Requests",
    500: "Internal Server Error",
    501: "Not Implemented",
    502: "Bad Gateway",
    503: "Service Unavailable",
};

export function getStatusTitle(status: number): string {
    return STATUS_TITLES[status] || "Error";
}
