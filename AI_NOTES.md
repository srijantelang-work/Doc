# AI Notes

## LLM & Provider

**Models used:**
- **Gemini 1.5 Flash** — for generating Q&A answers from document context
- **Gemini text-embedding-004** — for generating vector embeddings of document chunks and questions

**Provider:** Google AI (via `@google/generative-ai` SDK)

**Why Gemini:**
- Fast inference speed (Flash model is optimized for low latency)
- Large context window (1M tokens) — good headroom for RAG context
- Competitive pricing for the embedding + generation pipeline
- Simple SDK with good TypeScript support

## What I Used AI For

- **Code scaffolding**: Generated initial project structure, boilerplate API routes, and component shells
- **CSS design system**: AI helped draft the initial CSS variables and dark-mode token set
- **Text chunking logic**: AI assisted with the paragraph-splitting and overlap strategy
- **RAG prompt engineering**: Collaborated on the system prompt used for grounded Q&A

## What I Checked / Wrote Myself

- **Architecture decisions**: Chose SQLite over Postgres/Pinecone for simplicity; designed the RAG pipeline flow
- **Database schema**: Defined the documents + chunks tables, embedding storage strategy (JSON in SQLite)
- **Error handling**: Manually tested and refined all API error paths and user-facing messages
- **Cosine similarity implementation**: Verified the math and tested with known vectors
- **UI/UX flow**: Designed the 3-step home page flow, source citation expand/collapse interaction
- **Input validation**: Defined all validation rules (file type, size, empty checks, question length)
- **Docker setup**: Configured multi-stage build and volume mounting for SQLite persistence
