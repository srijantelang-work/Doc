# KnowledgeBase — Private Knowledge Q&A

Upload text documents, ask questions, get AI-powered answers with source citations.

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
npm test                # 20 unit tests via Vitest
```

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Vanilla CSS (dark-mode design system) |
| Database | SQLite (better-sqlite3) |
| LLM | Gemini 2.5 Flash |
| Embeddings | gemini-embedding-001 |
| Tests | Vitest |

## What's Done

- Upload `.txt` and `.md` files (drag-and-drop or click)
- View/delete uploaded documents
- Ask questions → get RAG-powered answers with source citations
- Source panel shows which document & passage contributed
- Status dashboard (backend, database, LLM health)
- Input validation with clear error messages
- Docker one-command setup
- Unit tests for chunker and similarity logic (20 tests)

## What's Not Done (Optional / Beyond Scope)

- PDF/Word document support (assignment says "text files are enough")
- Streaming LLM responses
- Conversation history / follow-up questions

## Project Structure

```
src/
├── __tests__/              # Unit tests (chunker, similarity)
├── app/
│   ├── api/ask/            # Q&A endpoint
│   ├── api/documents/      # Upload, list, delete
│   ├── api/status/         # Health check
│   ├── documents/page.tsx  # Documents + Q&A page
│   ├── status/page.tsx     # Status dashboard
│   └── page.tsx            # Home
├── components/             # UploadZone, DocumentList, QASection, Navbar
└── lib/                    # db, chunker, embeddings, similarity, constants
```
