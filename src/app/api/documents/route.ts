import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { chunkText } from '@/lib/chunker';
import { generateEmbeddings } from '@/lib/embeddings';
import { v4 as uuidv4 } from 'uuid';

interface DocumentRow {
    id: string;
    name: string;
    content: string;
    uploaded_at: string;
}

interface ChunkCountRow {
    document_id: string;
    chunk_count: number;
}

// GET /api/documents — list all documents
export async function GET() {
    try {
        const db = getDb();

        const documents = db
            .prepare(
                `SELECT d.id, d.name, d.uploaded_at, COUNT(c.id) as chunk_count
         FROM documents d
         LEFT JOIN chunks c ON c.document_id = d.id
         GROUP BY d.id
         ORDER BY d.uploaded_at DESC`
            )
            .all() as (DocumentRow & { chunk_count: number })[];

        return NextResponse.json({ documents });
    } catch (error) {
        console.error('Error listing documents:', error);
        return NextResponse.json(
            { error: 'Failed to list documents' },
            { status: 500 }
        );
    }
}

// POST /api/documents — upload a document
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        // Validate file type
        const validTypes = ['text/plain', 'text/markdown', 'application/octet-stream'];
        const validExtensions = ['.txt', '.md', '.text'];
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

        if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
            return NextResponse.json(
                { error: 'Only text files (.txt, .md) are supported' },
                { status: 400 }
            );
        }

        // Validate file size (max 1MB)
        if (file.size > 1024 * 1024) {
            return NextResponse.json(
                { error: 'File size must be less than 1MB' },
                { status: 400 }
            );
        }

        const content = await file.text();

        if (!content.trim()) {
            return NextResponse.json(
                { error: 'File is empty' },
                { status: 400 }
            );
        }

        const db = getDb();
        const documentId = uuidv4();
        const uploadedAt = new Date().toISOString();

        // Insert document
        db.prepare(
            'INSERT INTO documents (id, name, content, uploaded_at) VALUES (?, ?, ?, ?)'
        ).run(documentId, file.name, content, uploadedAt);

        // Chunk text
        const chunks = chunkText(content);

        // Generate embeddings for all chunks
        const embeddings = await generateEmbeddings(chunks);

        // Insert chunks with embeddings
        const insertChunk = db.prepare(
            'INSERT INTO chunks (id, document_id, content, chunk_index, embedding) VALUES (?, ?, ?, ?, ?)'
        );

        const insertMany = db.transaction(() => {
            for (let i = 0; i < chunks.length; i++) {
                insertChunk.run(
                    uuidv4(),
                    documentId,
                    chunks[i],
                    i,
                    JSON.stringify(embeddings[i])
                );
            }
        });

        insertMany();

        return NextResponse.json({
            document: {
                id: documentId,
                name: file.name,
                uploaded_at: uploadedAt,
                chunk_count: chunks.length,
            },
        });
    } catch (error) {
        console.error('Error uploading document:', error);
        return NextResponse.json(
            { error: 'Failed to upload document. Please try again.' },
            { status: 500 }
        );
    }
}
