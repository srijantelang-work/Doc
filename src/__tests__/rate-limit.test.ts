import { describe, it, expect } from 'vitest';
import { checkRateLimit } from '../lib/rate-limit';

describe('checkRateLimit', () => {
    const config = { maxRequests: 3, windowMs: 1000 };

    it('allows requests within the limit', () => {
        const ip = `test-allow-${Date.now()}`;
        expect(checkRateLimit(ip, config)).toBe(true);
        expect(checkRateLimit(ip, config)).toBe(true);
        expect(checkRateLimit(ip, config)).toBe(true);
    });

    it('blocks requests exceeding the limit', () => {
        const ip = `test-block-${Date.now()}`;
        checkRateLimit(ip, config);
        checkRateLimit(ip, config);
        checkRateLimit(ip, config);
        expect(checkRateLimit(ip, config)).toBe(false);
    });

    it('treats different IPs independently', () => {
        const ip1 = `test-ip1-${Date.now()}`;
        const ip2 = `test-ip2-${Date.now()}`;
        checkRateLimit(ip1, config);
        checkRateLimit(ip1, config);
        checkRateLimit(ip1, config);
        // ip1 is exhausted, but ip2 should still be allowed
        expect(checkRateLimit(ip2, config)).toBe(true);
    });
});
