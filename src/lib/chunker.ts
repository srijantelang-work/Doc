/**
 * Split text into overlapping chunks for embedding generation.
 *
 * Strategy:
 * 1. Split by double-newlines (paragraphs)
 * 2. Merge small paragraphs together until we hit maxChunkSize
 * 3. If a single paragraph exceeds maxChunkSize, split it by sentences
 * 4. Add overlap between chunks for context continuity
 * 5. Filter out chunks shorter than minChunkLength
 *
 * @param text          — the raw document text to chunk
 * @param maxChunkSize  — maximum characters per chunk (default: 500)
 * @param overlap       — characters of overlap between chunks (default: 50)
 * @param minChunkLength — discard chunks shorter than this (default: 20)
 * @returns array of non-empty text chunks
 */

import { DEFAULT_MAX_CHUNK_SIZE, DEFAULT_OVERLAP, MIN_CHUNK_LENGTH } from './constants';

export function chunkText(
    text: string,
    maxChunkSize: number = DEFAULT_MAX_CHUNK_SIZE,
    overlap: number = DEFAULT_OVERLAP,
    minChunkLength: number = MIN_CHUNK_LENGTH
): string[] {
    if (!text || text.trim().length === 0) {
        return [];
    }

    // Normalize whitespace
    const normalized = text.replace(/\r\n/g, '\n').trim();

    // Split into paragraphs
    const paragraphs = normalized
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

    if (paragraphs.length === 0) {
        return [];
    }

    const chunks: string[] = [];
    let currentChunk = '';

    for (const paragraph of paragraphs) {
        // If the paragraph alone exceeds max size, split it by sentences
        if (paragraph.length > maxChunkSize) {
            // Flush current chunk first
            if (currentChunk.length > 0) {
                chunks.push(currentChunk.trim());
                currentChunk = '';
            }

            // Split large paragraph by sentences
            const sentences = paragraph.match(/[^.!?]+[.!?]+\s*/g) || [paragraph];
            let sentenceChunk = '';

            for (const sentence of sentences) {
                if ((sentenceChunk + sentence).length > maxChunkSize && sentenceChunk.length > 0) {
                    chunks.push(sentenceChunk.trim());
                    // Add overlap from the end of previous chunk
                    const overlapText = sentenceChunk.slice(-overlap);
                    sentenceChunk = overlapText + sentence;
                } else {
                    sentenceChunk += sentence;
                }
            }

            if (sentenceChunk.trim().length > 0) {
                chunks.push(sentenceChunk.trim());
            }
            continue;
        }

        // Try adding paragraph to current chunk
        const potentialChunk = currentChunk
            ? currentChunk + '\n\n' + paragraph
            : paragraph;

        if (potentialChunk.length > maxChunkSize && currentChunk.length > 0) {
            chunks.push(currentChunk.trim());

            // Start new chunk with overlap from end of previous chunk
            const overlapText = currentChunk.slice(-overlap);
            currentChunk = overlapText + '\n\n' + paragraph;
        } else {
            currentChunk = potentialChunk;
        }
    }

    // Don't forget the last chunk
    if (currentChunk.trim().length > 0) {
        chunks.push(currentChunk.trim());
    }

    // Filter out chunks that are too short to be useful
    return chunks.filter((chunk) => chunk.length >= minChunkLength);
}
