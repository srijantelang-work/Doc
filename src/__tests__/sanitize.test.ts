import { describe, it, expect } from 'vitest';
import { sanitizeInput, sanitizeFilename, stripHtml } from '../lib/sanitize';

describe('stripHtml', () => {
    it('removes simple HTML tags', () => {
        expect(stripHtml('<b>bold</b>')).toBe('bold');
    });

    it('removes script tags and content', () => {
        expect(stripHtml('<script>alert("xss")</script>')).toBe('alert("xss")');
    });

    it('returns plain text unchanged', () => {
        expect(stripHtml('no tags here')).toBe('no tags here');
    });

    it('handles empty string', () => {
        expect(stripHtml('')).toBe('');
    });
});

describe('sanitizeInput', () => {
    it('returns null for non-string input', () => {
        expect(sanitizeInput(undefined)).toBeNull();
        expect(sanitizeInput(null)).toBeNull();
        expect(sanitizeInput(123)).toBeNull();
    });

    it('returns null for empty string', () => {
        expect(sanitizeInput('')).toBeNull();
    });

    it('returns null for whitespace-only string', () => {
        expect(sanitizeInput('   \n\t  ')).toBeNull();
    });

    it('strips HTML and trims', () => {
        expect(sanitizeInput('  <b>hello</b>  ')).toBe('hello');
    });

    it('preserves clean text', () => {
        expect(sanitizeInput('What is the meaning of life?')).toBe('What is the meaning of life?');
    });
});

describe('sanitizeFilename', () => {
    it('removes path traversal sequences', () => {
        expect(sanitizeFilename('../../../etc/passwd')).toBe('______etc_passwd');
    });

    it('replaces backslashes', () => {
        expect(sanitizeFilename('folder\\file.txt')).toBe('folder_file.txt');
    });

    it('removes null bytes', () => {
        expect(sanitizeFilename('file\0.txt')).toBe('file.txt');
    });

    it('preserves normal filenames', () => {
        expect(sanitizeFilename('my-document.txt')).toBe('my-document.txt');
    });
});
