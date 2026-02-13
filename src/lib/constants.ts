// ── Validation Constants ────────────────────────────────────────

/** Maximum upload file size in bytes (5 MB) */
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

/** Maximum question length in characters */
export const MAX_QUESTION_LENGTH = 1000;

/** Allowed file extensions for upload */
export const VALID_EXTENSIONS = ['.txt', '.md', '.text', '.pdf'] as const;

/** Allowed MIME types for upload */
export const VALID_MIME_TYPES = [
    'text/plain',
    'text/markdown',
    'application/octet-stream',
    'application/pdf',
] as const;

// ── RAG Pipeline Constants ──────────────────────────────────────

/** Minimum cosine-similarity score to consider a chunk relevant */
export const MIN_SIMILARITY_THRESHOLD = 0.3;

/** Number of top-k chunks to retrieve during search */
export const TOP_K_CHUNKS = 5;

// ── Chunking Constants ──────────────────────────────────────────

/** Default maximum chunk size in characters */
export const DEFAULT_MAX_CHUNK_SIZE = 500;

/** Default overlap between chunks in characters */
export const DEFAULT_OVERLAP = 50;

// ── AI Model Constants ──────────────────────────────────────────

/** Embedding model identifier */
export const EMBEDDING_MODEL = 'gemini-embedding-001';

/** LLM model identifier for answer generation */
export const LLM_MODEL = 'gemini-2.5-flash';
