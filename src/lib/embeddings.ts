import { GoogleGenerativeAI } from '@google/generative-ai';
import { EMBEDDING_MODEL, EMBEDDING_DIMENSIONS, MAX_RETRIES, RETRY_BASE_DELAY_MS } from './constants';
import { ExternalServiceError } from './errors';

/** Singleton Gemini client — avoids re-creating on every request. */
let client: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
    if (!client) {
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            throw new ExternalServiceError('Gemini API (GOOGLE_API_KEY is not set)');
        }
        client = new GoogleGenerativeAI(apiKey);
    }
    return client;
}

/**
 * Sleep for a given number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate an embedding vector for a single text string.
 *
 * Includes retry logic with exponential backoff for transient failures
 * (rate limits, network errors). Validates the returned vector dimensions.
 *
 * @param text — the text to embed
 * @returns a numeric vector of length `EMBEDDING_DIMENSIONS`
 * @throws ExternalServiceError after all retries are exhausted
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    const genAI = getClient();
    const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });

    let lastError: unknown;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            const result = await model.embedContent(text);
            const values = result.embedding.values;

            // Validate embedding dimensions
            if (values.length !== EMBEDDING_DIMENSIONS) {
                console.warn(
                    `Unexpected embedding dimensions: got ${values.length}, expected ${EMBEDDING_DIMENSIONS}`
                );
            }

            return values;
        } catch (error) {
            lastError = error;
            const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
            console.warn(`Embedding attempt ${attempt + 1}/${MAX_RETRIES} failed, retrying in ${delay}ms...`);

            if (attempt < MAX_RETRIES - 1) {
                await sleep(delay);
            }
        }
    }

    throw new ExternalServiceError('Embedding API', lastError);
}

/**
 * Generate embeddings for multiple text strings.
 *
 * Processes sequentially to avoid overwhelming rate limits.
 * Each individual call has its own retry logic.
 *
 * @param texts — array of strings to embed
 * @returns array of numeric vectors, one per input string
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
 *
 * @returns `{ ok: true }` if healthy, `{ ok: false, error: string }` otherwise
 */
export async function checkLlmHealth(): Promise<{ ok: boolean; error?: string }> {
    try {
        await generateEmbedding('health check');
        return { ok: true };
    } catch (error) {
        return { ok: false, error: (error as Error).message };
    }
}
