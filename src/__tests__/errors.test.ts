import { describe, it, expect } from 'vitest';
import {
    AppError,
    ValidationError,
    NotFoundError,
    RateLimitError,
    ExternalServiceError,
    toErrorResponse,
} from '../lib/errors';

describe('Error classes', () => {
    it('ValidationError has status 400', () => {
        const err = new ValidationError('bad input');
        expect(err.status).toBe(400);
        expect(err.code).toBe('VALIDATION_ERROR');
        expect(err.message).toBe('bad input');
    });

    it('NotFoundError has status 404', () => {
        const err = new NotFoundError('Document');
        expect(err.status).toBe(404);
        expect(err.code).toBe('NOT_FOUND');
        expect(err.message).toBe('Document not found');
    });

    it('RateLimitError has status 429', () => {
        const err = new RateLimitError();
        expect(err.status).toBe(429);
        expect(err.code).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('ExternalServiceError has status 500', () => {
        const cause = new Error('timeout');
        const err = new ExternalServiceError('Gemini', cause);
        expect(err.status).toBe(500);
        expect(err.code).toBe('EXTERNAL_SERVICE_ERROR');
        expect(err.cause).toBe(cause);
    });

    it('toJSON returns consistent shape', () => {
        const err = new ValidationError('test');
        expect(err.toJSON()).toEqual({ error: 'test', code: 'VALIDATION_ERROR' });
    });

    it('errors are instances of AppError', () => {
        expect(new ValidationError('x')).toBeInstanceOf(AppError);
        expect(new NotFoundError('x')).toBeInstanceOf(AppError);
        expect(new RateLimitError()).toBeInstanceOf(AppError);
        expect(new ExternalServiceError('x')).toBeInstanceOf(AppError);
    });
});

describe('toErrorResponse', () => {
    it('converts AppError to typed response', () => {
        const err = new ValidationError('missing field');
        const resp = toErrorResponse(err);
        expect(resp.status).toBe(400);
        expect(resp.body).toEqual({ error: 'missing field', code: 'VALIDATION_ERROR' });
    });

    it('converts unknown errors to 500', () => {
        const resp = toErrorResponse(new Error('random'));
        expect(resp.status).toBe(500);
        expect(resp.body.code).toBe('INTERNAL_ERROR');
    });

    it('converts non-Error values to 500', () => {
        const resp = toErrorResponse('string error');
        expect(resp.status).toBe(500);
        expect(resp.body.code).toBe('INTERNAL_ERROR');
    });
});
