# KnowledgeBase — Private Knowledge Q&A

A web app that lets you upload text documents, ask questions in natural language, and get AI-powered answers with source citations showing exactly which document and passage the answer came from.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- A [Google Gemini API key](https://aistudio.google.com/app/apikey)

### Run Locally

```bash
# 1. Clone the repo
git clone <repo-url>
cd Doc

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env
# Edit .env and add your GOOGLE_API_KEY

# 4. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Run with Docker

```bash
# 1. Set up environment
cp .env.example .env
# Edit .env and add your GOOGLE_API_KEY

# 2. Start with one command
docker compose up --build
```

## 🏗 Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 15 (App Router, TypeScript) |
| Styling | Vanilla CSS (custom dark-mode design system) |
| Database | SQLite via better-sqlite3 |
| LLM | Google Gemini 1.5 Flash |
| Embeddings | Gemini text-embedding-004 |

## 📋 Features

### ✅ Done
- **Document Upload**: Upload `.txt` and `.md` files via drag-and-drop or click-to-browse
- **Document Management**: View list of uploaded documents with metadata, delete documents
- **Q&A with RAG**: Ask natural-language questions, get AI answers grounded in your documents
- **Source Citations**: Every answer shows which document(s) and which specific passages contributed
- **Status Dashboard**: Real-time health check for backend, database, and LLM connection
- **Premium UI**: Dark-mode glassmorphism design with animations and responsive layout
- **Input Validation**: Handles empty/wrong input with clear error messages
- **Docker Support**: One-command deployment with `docker compose up`

### ❌ Not Done
- PDF / Word document support (only plain text files)
- User authentication / multi-user support
- Persistent storage on Vercel (ephemeral due to serverless filesystem)
- Streaming responses from LLM
- Conversation history / follow-up questions
- Full-text search (only semantic/embedding-based search)

## 🧠 How It Works (RAG Pipeline)

1. **Upload**: Text file is received and stored in SQLite
2. **Chunk**: Text is split into overlapping ~500-character chunks by paragraphs
3. **Embed**: Each chunk is converted to a 768-dim vector using Gemini `text-embedding-004`
4. **Store**: Chunks with embeddings are stored in SQLite
5. **Query**: User's question is embedded → cosine similarity finds top-5 relevant chunks
6. **Answer**: Relevant chunks are sent as context to Gemini 1.5 Flash, which generates a grounded answer
7. **Cite**: Source documents and passages are returned alongside the answer

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── ask/route.ts          # Q&A endpoint
│   │   ├── documents/route.ts    # Upload & list
│   │   ├── documents/[id]/route.ts  # Delete
│   │   └── status/route.ts       # Health check
│   ├── ask/page.tsx              # Q&A page
│   ├── documents/page.tsx        # Document management
│   ├── status/page.tsx           # Status dashboard
│   ├── page.tsx                  # Home page
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Design system
├── components/
│   └── Navbar.tsx                # Navigation
└── lib/
    ├── db.ts                     # SQLite connection
    ├── chunker.ts                # Text chunking
    ├── embeddings.ts             # Gemini embeddings
    └── similarity.ts             # Cosine similarity search
```
