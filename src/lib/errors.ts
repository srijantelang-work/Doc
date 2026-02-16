/**
 * Custom error classes for consistent API error handling.
 *
 * Usage:
 * ```ts
 * throw new ValidationError('Question is required');
 * throw new NotFoundError('Document');
 * throw new ExternalServiceError('Gemini API', originalError);
 * ```
 */

/** Base class for all application errors with HTTP status and error code. */
export class AppError extends Error {
    public readonly status: number;
    public readonly code: string;

    constructor(message: string, status: number, code: string) {
        super(message);
        this.name = this.constructor.name;
        this.status = status;
        this.code = code;
    }

    /** Serialize to a consistent JSON shape for API responses. */
    toJSON() {
        return {
            error: this.message,
            code: this.code,
        };
    }
}

/** 400 — Invalid input from the client. */
export class ValidationError extends AppError {
    constructor(message: string) {
        super(message, 400, 'VALIDATION_ERROR');
    }
}

/** 404 — Requested resource does not exist. */
export class NotFoundError extends AppError {
    constructor(resource: string) {
        super(`${resource} not found`, 404, 'NOT_FOUND');
    }
}

/** 429 — Client has sent too many requests. */
export class RateLimitError extends AppError {
    constructor() {
        super('Too many requests. Please try again later.', 429, 'RATE_LIMIT_EXCEEDED');
    }
}

/** 500 — Failure when calling an external service (LLM, embedding API). */
export class ExternalServiceError extends AppError {
    public readonly cause: unknown;

    constructor(service: string, cause?: unknown) {
        super(`${service} is currently unavailable. Please try again.`, 500, 'EXTERNAL_SERVICE_ERROR');
        this.cause = cause;
    }
}

/**
 * Convert any thrown value into a consistent NextResponse-compatible error object.
 * Known AppErrors keep their status; unknown errors become 500.
 */
export function toErrorResponse(error: unknown): { body: { error: string; code: string }; status: number } {
    if (error instanceof AppError) {
        return { body: error.toJSON(), status: error.status };
    }

    console.error('Unhandled error:', error);
    return {
        body: { error: 'An unexpected error occurred. Please try again.', code: 'INTERNAL_ERROR' },
        status: 500,
    };
}
