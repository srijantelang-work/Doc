// ── Validation Constants ────────────────────────────────────────

/** Maximum upload file size in bytes (5 MB). */
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

/** Maximum question length in characters. */
export const MAX_QUESTION_LENGTH = 1000;

/** Allowed file extensions for upload. */
export const VALID_EXTENSIONS = ['.txt', '.md', '.text'] as const;

/** Allowed MIME types for upload. */
export const VALID_MIME_TYPES = [
    'text/plain',
    'text/markdown',
    'application/octet-stream',
] as const;

// ── RAG Pipeline Constants ──────────────────────────────────────

/** Minimum cosine-similarity score to consider a chunk relevant. */
export const MIN_SIMILARITY_THRESHOLD = 0.3;

/** Number of top-k chunks to retrieve during search. */
export const TOP_K_CHUNKS = 5;

// ── Chunking Constants ──────────────────────────────────────────

/** Default maximum chunk size in characters. */
export const DEFAULT_MAX_CHUNK_SIZE = 500;

/** Default overlap between chunks in characters. */
export const DEFAULT_OVERLAP = 50;

/** Minimum chunk length — chunks shorter than this are discarded. */
export const MIN_CHUNK_LENGTH = 20;

// ── AI Model Constants ──────────────────────────────────────────

/** Embedding model identifier. */
export const EMBEDDING_MODEL = 'gemini-embedding-001';

/** Expected embedding vector dimensionality (for validation). */
export const EMBEDDING_DIMENSIONS = 768;

/** LLM model identifier for answer generation. */
export const LLM_MODEL = 'gemini-2.5-flash';

/** LLM temperature — low value for factual, grounded answers. */
export const LLM_TEMPERATURE = 0.2;

/** Maximum retries for external API calls. */
export const MAX_RETRIES = 3;

/** Base delay (ms) for exponential backoff between retries. */
export const RETRY_BASE_DELAY_MS = 1000;
