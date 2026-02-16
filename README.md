# KnowledgeBase — Private Knowledge Q&A

Upload text documents, ask questions, get AI-powered answers with source citations.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Next.js   │────▶│  API Routes  │────▶│    SQLite DB     │
│  Frontend   │     │  (validated) │     │  (documents +    │
│  (React)    │◀────│  + rate-     │     │   chunks +       │
│             │     │    limited   │     │   embeddings)    │
└─────────────┘     └──────┬───────┘     └─────────────────┘
                           │
                    ┌──────▼───────┐
                    │  Google AI   │
                    │  Gemini API  │
                    │  (embed +    │
                    │   generate)  │
                    └──────────────┘
```

**RAG Pipeline:** Upload → Chunk (paragraph-based, 500 char, 50 char overlap) → Embed (gemini-embedding-001, 768d) → Store → Query → Cosine similarity → Top-5 → Gemini 2.5 Flash → Cited answer

## How to Run

### Local

```bash
git clone <repo-url> && cd Doc
npm install
cp .env.example .env   # add your GOOGLE_API_KEY
npm run dev             # http://localhost:3000
```

### Docker (one command)

```bash
cp .env.example .env    # add your GOOGLE_API_KEY
docker compose up --build
```

### Tests

```bash
npm test                # 35+ unit tests via Vitest
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_API_KEY` | Yes | Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey) |

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Vanilla CSS (dark-mode design system) |
| Database | SQLite (better-sqlite3, WAL mode) |
| LLM | Gemini 2.5 Flash (temperature: 0.2) |
| Embeddings | gemini-embedding-001 (768 dimensions) |
| Tests | Vitest |

## What's Done

- Upload `.txt` and `.md` files (drag-and-drop or click)
- View/delete uploaded documents
- Ask questions → get RAG-powered answers with source citations
- Source panel shows which document & passage contributed
- Status dashboard (backend, database, LLM health)
- Input validation with clear error messages
- Input sanitization (XSS prevention, filename sanitization)
- Rate limiting (20 req/min for Q&A, 10 req/min for uploads)
- Typed error handling with consistent API responses
- Keyboard accessibility (focus-visible, aria-labels, reduced-motion)
- Error boundary for crash recovery
- Docker one-command setup
- Unit tests (35+ tests: chunker, similarity, sanitization, rate-limit, errors)

## What's Not Done (Optional / Beyond Scope)

- PDF/Word document support (assignment says "text files are enough")
- Streaming LLM responses
- Conversation history / follow-up questions

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `GOOGLE_API_KEY is not set` | Copy `.env.example` to `.env` and add your key |
| `429 Too Many Requests` | Rate limit hit — wait 60 seconds and retry |
| Upload fails silently | Check file is `.txt` or `.md` and under 5MB |
| Docker build fails | Ensure Docker is running and ports 3000 is free |

## Project Structure

```
src/
├── __tests__/              # Unit tests (chunker, similarity, sanitize, rate-limit, errors)
├── app/
│   ├── api/ask/            # Q&A endpoint (rate-limited, sanitized)
│   ├── api/documents/      # Upload, list, delete (rate-limited)
│   ├── api/status/         # Health check
│   ├── documents/page.tsx  # Documents + Q&A page
│   ├── status/page.tsx     # Status dashboard
│   └── page.tsx            # Home
├── components/             # UploadZone, DocumentList, QASection, Navbar, ErrorBoundary
└── lib/                    # db, chunker, embeddings, similarity, constants, errors, rate-limit, sanitize
```
