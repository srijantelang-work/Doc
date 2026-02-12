import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { generateEmbedding } from '@/lib/embeddings';
import { findTopKChunks, ChunkWithEmbedding } from '@/lib/similarity';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface ChunkRow {
    id: string;
    document_id: string;
    content: string;
    chunk_index: number;
    embedding: string;
    document_name: string;
}

const LLM_MODEL = 'gemini-1.5-flash';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { question } = body;

        if (!question || typeof question !== 'string' || question.trim().length === 0) {
            return NextResponse.json(
                { error: 'Please provide a non-empty question' },
                { status: 400 }
            );
        }

        if (question.trim().length > 1000) {
            return NextResponse.json(
                { error: 'Question must be less than 1000 characters' },
                { status: 400 }
            );
        }

        const db = getDb();

        // Check if there are any documents
        const docCount = db.prepare('SELECT COUNT(*) as count FROM documents').get() as { count: number };
        if (docCount.count === 0) {
            return NextResponse.json(
                { error: 'No documents uploaded yet. Please upload some documents first.' },
                { status: 400 }
            );
        }

        // Check if there are any chunks with embeddings
        const chunkCount = db.prepare('SELECT COUNT(*) as count FROM chunks WHERE embedding IS NOT NULL').get() as { count: number };
        if (chunkCount.count === 0) {
            return NextResponse.json(
                { error: 'Documents are still being processed. Please try again shortly.' },
                { status: 400 }
            );
        }

        // Generate embedding for the question
        const questionEmbedding = await generateEmbedding(question.trim());

        // Load all chunks with embeddings
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

        // Find top relevant chunks
        const topChunks = findTopKChunks(questionEmbedding, chunksWithEmbeddings, 5);

        // Filter out chunks with very low similarity
        const relevantChunks = topChunks.filter((c) => c.similarity > 0.3);

        if (relevantChunks.length === 0) {
            return NextResponse.json({
                answer: "I couldn't find relevant information in the uploaded documents to answer your question. Try rephrasing your question or upload more relevant documents.",
                sources: [],
            });
        }

        // Build context from top chunks
        const context = relevantChunks
            .map((chunk, i) => `[Source ${i + 1} - "${chunk.documentName}"]\n${chunk.content}`)
            .join('\n\n---\n\n');

        // Call Gemini for the answer
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: 'LLM API key is not configured' },
                { status: 500 }
            );
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: LLM_MODEL });

        const prompt = `You are a helpful assistant that answers questions based ONLY on the provided context from the user's documents. If the context doesn't contain enough information to answer the question, say so clearly.

When answering:
- Be accurate and concise
- Reference which source(s) you're drawing from by mentioning the document name
- If the answer comes from multiple sources, mention all of them
- Do not make up information not present in the context

Context from uploaded documents:
${context}

Question: ${question.trim()}

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
        });
    } catch (error) {
        console.error('Error processing question:', error);
        return NextResponse.json(
            { error: 'Failed to process your question. Please try again.' },
            { status: 500 }
        );
    }
}
