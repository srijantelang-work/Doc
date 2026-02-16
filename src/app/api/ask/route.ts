import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { generateEmbedding } from '@/lib/embeddings';
import { findTopKChunks, ChunkWithEmbedding } from '@/lib/similarity';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
    LLM_MODEL,
    LLM_TEMPERATURE,
    MAX_QUESTION_LENGTH,
    MIN_SIMILARITY_THRESHOLD,
    TOP_K_CHUNKS,
} from '@/lib/constants';
import { ValidationError, ExternalServiceError, toErrorResponse } from '@/lib/errors';
import { checkRateLimit, getClientIp, ASK_RATE_LIMIT } from '@/lib/rate-limit';
import { RateLimitError } from '@/lib/errors';
import { sanitizeInput } from '@/lib/sanitize';

interface ChunkRow {
    id: string;
    document_id: string;
    content: string;
    chunk_index: number;
    embedding: string;
    document_name: string;
}

export async function POST(request: NextRequest) {
    try {
        // ── Rate limiting ──
        const ip = getClientIp(request);
        if (!checkRateLimit(ip, ASK_RATE_LIMIT)) {
            throw new RateLimitError();
        }

        // ── Input validation ──
        const body = await request.json();
        const question = sanitizeInput(body.question);

        if (!question) {
            throw new ValidationError('Please provide a non-empty question.');
        }

        if (question.length > MAX_QUESTION_LENGTH) {
            throw new ValidationError(`Question must be less than ${MAX_QUESTION_LENGTH} characters.`);
        }

        const db = getDb();

        // Check for uploaded documents
        const docCount = db.prepare('SELECT COUNT(*) as count FROM documents').get() as { count: number };
        if (docCount.count === 0) {
            throw new ValidationError('No documents uploaded yet. Please upload some documents first.');
        }

        // Check for processed chunks
        const chunkCount = db.prepare('SELECT COUNT(*) as count FROM chunks WHERE embedding IS NOT NULL').get() as { count: number };
        if (chunkCount.count === 0) {
            throw new ValidationError('Documents are still being processed. Please try again shortly.');
        }

        // ── Generate question embedding ──
        const questionEmbedding = await generateEmbedding(question);

        // ── Retrieve & rank chunks ──
        const rows = db
            .prepare(
                `SELECT c.id, c.document_id, c.content, c.chunk_index, c.embedding, d.name as document_name
                 FROM chunks c
                 JOIN documents d ON d.id = c.document_id
                 WHERE c.embedding IS NOT NULL`
            )
            .all() as ChunkRow[];

        const chunksWithEmbeddings: ChunkWithEmbedding[] = rows.map((row) => ({
            id: row.id,
            documentId: row.document_id,
            documentName: row.document_name,
            content: row.content,
            chunkIndex: row.chunk_index,
            embedding: JSON.parse(row.embedding),
        }));

        const topChunks = findTopKChunks(questionEmbedding, chunksWithEmbeddings, TOP_K_CHUNKS);
        const relevantChunks = topChunks.filter((c) => c.similarity > MIN_SIMILARITY_THRESHOLD);

        if (relevantChunks.length === 0) {
            return NextResponse.json({
                answer:
                    "I couldn't find relevant information in the uploaded documents to answer your question. Try rephrasing or upload more relevant documents.",
                sources: [],
            });
        }

        // ── Build context & call LLM ──
        const context = relevantChunks
            .map((chunk, i) => `[Source ${i + 1} — "${chunk.documentName}"]\n${chunk.content}`)
            .join('\n\n---\n\n');

        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            throw new ExternalServiceError('LLM (API key not configured)');
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: LLM_MODEL,
            generationConfig: { temperature: LLM_TEMPERATURE },
        });

        const prompt = `You are a helpful assistant that answers questions based ONLY on the provided context from the user's documents. If the context doesn't contain enough information, say so clearly.

Rules:
- Be accurate and concise
- Reference which source(s) you draw from by mentioning the document name
- If the answer spans multiple sources, mention all of them
- Never fabricate information not present in the context

Context from uploaded documents:
${context}

Question: ${question}

Answer:`;

        const result = await model.generateContent(prompt);
        const answer = result.response.text();

        return NextResponse.json({
            answer,
            sources: relevantChunks.map((chunk) => ({
                documentName: chunk.documentName,
                documentId: chunk.documentId,
                chunkText: chunk.content,
                similarity: Math.round(chunk.similarity * 100) / 100,
            })),
            metadata: {
                chunksSearched: rows.length,
                chunksUsed: relevantChunks.length,
            },
        });
    } catch (error) {
        const { body, status } = toErrorResponse(error);
        return NextResponse.json(body, { status });
    }
}
