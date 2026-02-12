export interface ChunkWithEmbedding {
    id: string;
    documentId: string;
    documentName: string;
    content: string;
    chunkIndex: number;
    embedding: number[];
}

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
 * Returns a value between -1 and 1, where 1 means identical direction.
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
