# Prompts Used

A record of prompts used during app development. Agent responses and API keys are excluded.

---

## 1. Initial Planning

**Prompt:**
> Go through the doc and make a markdown file for the implementation plan for implementing "Problem statement A: Private Knowledge Q&A (your mini workspace)". Build a web app where I can: add a few documents (text files are enough), see the list of uploaded documents, ask a question, get an answer, see "where the answer came from" (show which document and the part of it that helped).

**Purpose:** Initial project planning and architecture design.

---

## 2. Implementation

**Prompt:**
> LLM Provider - use gemini. Database - SQLite. Hosting - vercel. ABOUTME.md - will do this later.

**Purpose:** Finalize tech stack choices and begin implementation.

---

## 3. Debugging Upload & File Types

**Prompt:**
> When i am trying to upload any doc this error is coming @[Docs/terminal.log]. Also for uploading any doc it only takes .txt and .md only why cant it take .doc or pdf is it mentioned in the @[Docs/assignment.md] that not to take doc or pdf. Trace the full user flow and identify where the issue originates. think deeply about the root cause and treat the symptom as a clue, not the target.

**Purpose:** Identified two issues:
1. `text-embedding-004` model was shut down (fixed by switching to `gemini-embedding-001`).
2. Assignment didn't prohibit PDFs (added `pdf-parse` support).

---

## 4. Merging Q&A UI

**Prompt:**
> The ask section should be in the doc section because in doc its mentioned @[Docs/assignment.md] user ask a question * get an answer * see “where the answer came from” (show which document and the part of it that helped)

**Purpose:** Merged the standalone `/ask` page functionality into the `/documents` page for a unified experience.

---

## 5. Root Cause Analysis (Quota Error)

**Prompt:**
> @[Docs/terminal.log] https://docs.cloud.google.com/docs/authentication/api-keys-best-practices... trace the full user flow and identify where the issue originates. think deeply about the root cause and treat the symptom as a clue, not the target. Reflect on 5-7 different possible source of the problem, distill those down to 1-2 most likely sources, and the add logs to validate your assumptions before we move onto the implementing the actual code fix.

**Purpose:** Deep analysis of `429 Too Many Requests (limit: 0)` error.
- **Hypothesis:** `gemini-2.0-flash` has no free-tier quota for the project.
- **Validation:** Added diagnostic logs, tested with `curl`.
- **Finding:** `gemini-2.0` family has 0 quota; `gemini-1.5` is shut down.
- **Fix:** Switched to **`gemini-2.5-flash`** (confirmed working).

---

## 6. Design System Overhaul

**Prompt:**
> @[Docs/design.md] Implement this design

**Design spec included:** A complete design system document specifying warm dark palette (#141412 bg, #C4714A terracotta accent), Playfair Display/Lora headings, JetBrains Mono for mono text, horizontal timeline on Home, table-based Status page, footnote-style sources, underline-only inputs, no gradients, no rounded corners beyond 4px.

**Purpose:** Full UI overhaul across 6 files: `globals.css`, `layout.tsx`, `Navbar.tsx`, `page.tsx`, `documents/page.tsx`, `status/page.tsx`.

---


## 7. Code Quality Review & Refactoring

**Prompt:**
> You are code reviewer check the quality of code check proper parsing is done or not evaluate on the basis of this criteria: Code Quality, Architecture & Extensibility, Types & Domain Modeling, Error Handling, It works and is easy to use, Clean code, Basic checks and testing, Sensible use of AI (not blind copy-paste)

**Outcome:**
Performed a comprehensive review scoring ~6.75/10. Identified key gap in testing (0 tests).
Implemented 5 major fixes:
1.  **Shared Constants**: Centralized magic numbers in `lib/constants.ts`.
2.  **Dynamic Imports**: Fixed `require('pdf-parse')` to use `import()` with proper types.
3.  **Dead Code Removal**: Deleted unused `page.module.css`.
4.  **Component Extraction**: Split `documents/page.tsx` (391 lines) into 3 sub-components (`UploadZone`, `DocumentList`, `QASection`).
5.  **Unit Testing**: Added `vitest` and wrote 20 unit tests for `chunker.ts` and `similarity.ts` (100% pass rate).
