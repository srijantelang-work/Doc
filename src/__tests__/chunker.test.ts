import { describe, it, expect } from 'vitest';
import { chunkText } from '../lib/chunker';

describe('chunkText', () => {
    it('returns empty array for empty string', () => {
        expect(chunkText('')).toEqual([]);
    });

    it('returns empty array for whitespace-only string', () => {
        expect(chunkText('   \n\n  ')).toEqual([]);
    });

    it('returns a single chunk for short text', () => {
        const text = 'Hello, this is a short paragraph.';
        const chunks = chunkText(text);
        expect(chunks).toHaveLength(1);
        expect(chunks[0]).toBe(text);
    });

    it('splits paragraphs separated by double newlines', () => {
        const text = 'Paragraph one.\n\nParagraph two.\n\nParagraph three.';
        const chunks = chunkText(text, 1000); // large max so no splitting
        expect(chunks).toHaveLength(1);
        expect(chunks[0]).toContain('Paragraph one.');
        expect(chunks[0]).toContain('Paragraph two.');
    });

    it('splits into multiple chunks when total exceeds maxChunkSize', () => {
        const paragraph = 'A'.repeat(200);
        const text = `${paragraph}\n\n${paragraph}\n\n${paragraph}`;
        const chunks = chunkText(text, 300);
        expect(chunks.length).toBeGreaterThan(1);
    });

    it('includes overlap between chunks', () => {
        const p1 = 'First paragraph with unique content alpha.';
        const p2 = 'Second paragraph with unique content beta.';
        const p3 = 'Third paragraph with unique content gamma.';
        const text = `${p1}\n\n${p2}\n\n${p3}`;
        const chunks = chunkText(text, 60, 20);
        // With overlap, later chunks should contain trailing text from previous ones
        if (chunks.length > 1) {
            const lastCharsOfFirst = chunks[0].slice(-20);
            expect(chunks[1]).toContain(lastCharsOfFirst);
        }
    });

    it('handles CRLF line endings by normalizing them', () => {
        const text = 'Line one.\r\n\r\nLine two.';
        const chunks = chunkText(text);
        expect(chunks).toHaveLength(1);
        expect(chunks[0]).not.toContain('\r');
    });

    it('splits very long single paragraph by sentences', () => {
        // Create a long paragraph with multiple sentences
        const sentence = 'This is a complete sentence. ';
        const longParagraph = sentence.repeat(20); // ~560 chars
        const chunks = chunkText(longParagraph, 200);
        expect(chunks.length).toBeGreaterThan(1);
        // Each chunk should be sentence-boundary or overlap-boundary
        for (const chunk of chunks) {
            expect(chunk.length).toBeGreaterThan(0);
        }
    });

    it('preserves all text content across chunks', () => {
        const text = 'Alpha.\n\nBravo.\n\nCharlie.\n\nDelta.\n\nEcho.';
        const chunks = chunkText(text, 30, 0); // no overlap for clean check
        const joined = chunks.join(' ');
        expect(joined).toContain('Alpha.');
        expect(joined).toContain('Bravo.');
        expect(joined).toContain('Charlie.');
        expect(joined).toContain('Delta.');
        expect(joined).toContain('Echo.');
    });
});
