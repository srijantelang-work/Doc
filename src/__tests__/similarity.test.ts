import { describe, it, expect } from 'vitest';
import { cosineSimilarity, findTopKChunks, ChunkWithEmbedding } from '../lib/similarity';

describe('cosineSimilarity', () => {
    it('returns 1 for identical vectors', () => {
        const a = [1, 2, 3];
        expect(cosineSimilarity(a, a)).toBeCloseTo(1, 5);
    });

    it('returns -1 for opposite vectors', () => {
        const a = [1, 0, 0];
        const b = [-1, 0, 0];
        expect(cosineSimilarity(a, b)).toBeCloseTo(-1, 5);
    });

    it('returns 0 for orthogonal vectors', () => {
        const a = [1, 0, 0];
        const b = [0, 1, 0];
        expect(cosineSimilarity(a, b)).toBeCloseTo(0, 5);
    });

    it('returns 0 when a vector is all zeros', () => {
        const a = [0, 0, 0];
        const b = [1, 2, 3];
        expect(cosineSimilarity(a, b)).toBe(0);
    });

    it('throws for vectors of different lengths', () => {
        expect(() => cosineSimilarity([1, 2], [1, 2, 3])).toThrow('Vector length mismatch');
    });

    it('computes correct similarity for known vectors', () => {
        // cos([1,2,3], [4,5,6]) = 32 / (sqrt(14) * sqrt(77)) ≈ 0.9746
        const a = [1, 2, 3];
        const b = [4, 5, 6];
        expect(cosineSimilarity(a, b)).toBeCloseTo(0.9746, 3);
    });
});

describe('findTopKChunks', () => {
    const makeChunk = (id: string, embedding: number[]): ChunkWithEmbedding => ({
        id,
        documentId: 'doc-1',
        documentName: 'test.txt',
        content: `Content for ${id}`,
        chunkIndex: 0,
        embedding,
    });

    const chunks: ChunkWithEmbedding[] = [
        makeChunk('a', [1, 0, 0]),      // Most similar to [1,0,0]
        makeChunk('b', [0, 1, 0]),      // Orthogonal
        makeChunk('c', [0.9, 0.1, 0]),  // Very similar
        makeChunk('d', [-1, 0, 0]),     // Opposite
        makeChunk('e', [0.5, 0.5, 0]),  // Moderate
    ];

    it('returns top-k most similar chunks sorted descending', () => {
        const query = [1, 0, 0];
        const top = findTopKChunks(query, chunks, 3);
        expect(top).toHaveLength(3);
        // First should be the most similar
        expect(top[0].id).toBe('a');
        // Verify descending order
        for (let i = 1; i < top.length; i++) {
            expect(top[i].similarity).toBeLessThanOrEqual(top[i - 1].similarity);
        }
    });

    it('limits results to k', () => {
        const query = [1, 0, 0];
        const top = findTopKChunks(query, chunks, 2);
        expect(top).toHaveLength(2);
    });

    it('returns all if k > chunks.length', () => {
        const query = [1, 0, 0];
        const top = findTopKChunks(query, chunks, 100);
        expect(top).toHaveLength(chunks.length);
    });

    it('includes similarity score in results', () => {
        const query = [1, 0, 0];
        const top = findTopKChunks(query, chunks, 1);
        expect(top[0].similarity).toBeCloseTo(1, 5);
    });

    it('does not include embedding in result (RankedChunk type)', () => {
        const query = [1, 0, 0];
        const top = findTopKChunks(query, chunks, 1);
        // RankedChunk should not carry the embedding field
        expect(top[0]).not.toHaveProperty('embedding');
    });
});
