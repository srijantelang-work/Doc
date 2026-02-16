/**
 * Vector similarity utilities for the RAG pipeline.
 *
 * Ranks document chunks by cosine similarity to a query embedding,
 * returning the top-k most relevant results.
 */

/** A document chunk with its pre-computed embedding vector. */
export interface ChunkWithEmbedding {
    id: string;
    documentId: string;
    documentName: string;
    content: string;
    chunkIndex: number;
    embedding: number[];
}

/** A ranked chunk result with its similarity score (no embedding). */
export interface RankedChunk {
    id: string;
    documentId: string;
    documentName: string;
    content: string;
    chunkIndex: number;
    similarity: number;
}

/**
 * Compute cosine similarity between two vectors.
 *
 * @param a — first vector
 * @param b — second vector (must be same length as `a`)
 * @returns a value between -1 and 1, where 1 means identical direction
 * @throws Error if vector lengths don't match
 */
export function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
        throw new Error(`Vector length mismatch: ${a.length} vs ${b.length}`);
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    if (denominator === 0) return 0;

    return dotProduct / denominator;
}

/**
 * Find the top-k most similar chunks to a query embedding.
 *
 * @param queryEmbedding — the embedding vector of the user's question
 * @param chunks         — all document chunks with their embeddings
 * @param k              — number of top results to return (default: 5)
 * @returns top-k chunks sorted by similarity descending
 */
export function findTopKChunks(
    queryEmbedding: number[],
    chunks: ChunkWithEmbedding[],
    k: number = 5
): RankedChunk[] {
    const scored = chunks.map((chunk) => ({
        id: chunk.id,
        documentId: chunk.documentId,
        documentName: chunk.documentName,
        content: chunk.content,
        chunkIndex: chunk.chunkIndex,
        similarity: cosineSimilarity(queryEmbedding, chunk.embedding),
    }));

    // Sort by similarity descending, take top k
    scored.sort((a, b) => b.similarity - a.similarity);
    return scored.slice(0, k);
}
