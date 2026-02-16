/**
 * Input sanitization utilities.
 *
 * Strips HTML tags and trims whitespace to prevent XSS when
 * user-provided text is reflected in API responses or stored.
 */

/** Strip all HTML/XML tags from a string. */
export function stripHtml(input: string): string {
    return input.replace(/<[^>]*>/g, '');
}

/**
 * Sanitize user-provided text: strip HTML tags and trim whitespace.
 * Returns the sanitized string, or `null` if the result is empty.
 */
export function sanitizeInput(input: unknown): string | null {
    if (typeof input !== 'string') return null;
    const cleaned = stripHtml(input).trim();
    return cleaned.length > 0 ? cleaned : null;
}

/**
 * Sanitize a filename to prevent path traversal attacks.
 * Strips directory separators and null bytes.
 */
export function sanitizeFilename(filename: string): string {
    return filename
        .replace(/[\\/]/g, '_')    // replace path separators
        .replace(/\0/g, '')        // remove null bytes
        .replace(/\.\./g, '_')     // prevent directory traversal
        .trim();
}
