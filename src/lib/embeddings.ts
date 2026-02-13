import { GoogleGenerativeAI } from '@google/generative-ai';

const EMBEDDING_MODEL = 'gemini-embedding-001';

function getClient(): GoogleGenerativeAI {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        throw new Error('GOOGLE_API_KEY environment variable is not set');
    }
    return new GoogleGenerativeAI(apiKey);
}

/**
 * Generate an embedding vector for a single text string.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    const client = getClient();
    const model = client.getGenerativeModel({ model: EMBEDDING_MODEL });

    const result = await model.embedContent(text);
    return result.embedding.values;
}

/**
 * Generate embeddings for multiple text strings.
 * Processes sequentially to avoid rate limits.
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];

    for (const text of texts) {
        const embedding = await generateEmbedding(text);
        embeddings.push(embedding);
    }

    return embeddings;
}

/**
 * Check if the Gemini API is reachable by generating a tiny embedding.
 */
export async function checkLlmHealth(): Promise<{ ok: boolean; error?: string }> {
    try {
        await generateEmbedding('health check');
        return { ok: true };
    } catch (error) {
        return { ok: false, error: (error as Error).message };
    }
}
