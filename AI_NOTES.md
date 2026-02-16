# AI Notes

## LLM & Provider

**Models used:**
- **Gemini 2.5 Flash** (`gemini-2.5-flash`) — answer generation from document context
- **Gemini Embedding 001** (`gemini-embedding-001`) — vector embeddings for chunks and queries

**Provider:** Google AI (via `@google/generative-ai` SDK)

**Why Gemini:**
- Fast inference speed (Flash model optimized for low latency)
- Large context window (1M tokens) — good headroom for RAG context
- Competitive pricing for embedding + generation pipeline
- Simple SDK with strong TypeScript support
- `gemini-embedding-001` provides 768-dimensional vectors, sufficient for document similarity

**Why not OpenAI / Anthropic:**
- Google AI offers a generous free tier suitable for this project
- Single provider for both embeddings and generation reduces integration complexity
- No additional API key management overhead

## RAG Pipeline Decisions

| Decision | Choice | Reasoning |
|----------|--------|-----------|
| Vector DB | SQLite (JSON column) | Avoids external dependency; sufficient for <1000 documents |
| Chunk strategy | Paragraph-based with overlap | Respects natural text boundaries; overlap prevents context loss |
| Similarity | Cosine similarity | Standard for normalized embeddings; simple to implement correctly |
| Top-k | 5 chunks | Balances context quality with token budget |
| Threshold | 0.3 min similarity | Filters clearly irrelevant chunks while keeping moderate matches |
| Temperature | 0.2 | Low temperature for factual, grounded responses |

## What I Used AI For

- **Code scaffolding**: Generated initial project structure, boilerplate API routes, and component shells
- **CSS design system**: AI helped draft the initial CSS variables and dark-mode token set
- **Text chunking logic**: AI assisted with the paragraph-splitting and overlap strategy
- **RAG prompt engineering**: Collaborated on the system prompt for grounded Q&A
- **Error handling patterns**: AI suggested the typed error class hierarchy

## What I Checked / Wrote Myself

- **Architecture decisions**: Chose SQLite over Postgres/Pinecone for simplicity; designed the RAG pipeline flow
- **Database schema**: Defined the documents + chunks tables, embedding storage strategy (JSON in SQLite)
- **Error handling**: Manually tested and refined all API error paths and user-facing messages
- **Cosine similarity**: Verified the math and tested with known vectors
- **UI/UX flow**: Designed the 3-step home page flow, source citation expand/collapse interaction
- **Input validation**: Defined all validation rules (file type, size, empty checks, question length)
- **Security**: Added rate limiting, input sanitization, and filename sanitization
- **Docker setup**: Configured multi-stage build and volume mounting for SQLite persistence
- **Unit tests**: Wrote test suites for chunking, similarity, sanitization, rate limiting, and error handling (35+ tests)
- **Refactoring**: Extracted monolithic components into smaller, reusable parts and centralized constants
