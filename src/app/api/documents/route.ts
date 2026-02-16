import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { chunkText } from '@/lib/chunker';
import { generateEmbeddings } from '@/lib/embeddings';
import { v4 as uuidv4 } from 'uuid';
import { MAX_FILE_SIZE, VALID_EXTENSIONS, VALID_MIME_TYPES } from '@/lib/constants';
import { ValidationError, toErrorResponse, RateLimitError } from '@/lib/errors';
import { checkRateLimit, getClientIp, UPLOAD_RATE_LIMIT } from '@/lib/rate-limit';
import { sanitizeFilename } from '@/lib/sanitize';

interface DocumentRow {
    id: string;
    name: string;
    content: string;
    uploaded_at: string;
}

/** GET /api/documents — list all documents. */
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
        const { body, status } = toErrorResponse(error);
        return NextResponse.json(body, { status });
    }
}

/** POST /api/documents — upload a document. */
export async function POST(request: NextRequest) {
    try {
        // ── Rate limiting ──
        const ip = getClientIp(request);
        if (!checkRateLimit(ip, UPLOAD_RATE_LIMIT)) {
            throw new RateLimitError();
        }

        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            throw new ValidationError('No file provided.');
        }

        // ── Validate file type ──
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

        if (
            !VALID_MIME_TYPES.includes(file.type as typeof VALID_MIME_TYPES[number]) &&
            !VALID_EXTENSIONS.includes(fileExtension as typeof VALID_EXTENSIONS[number])
        ) {
            throw new ValidationError(`Only ${VALID_EXTENSIONS.join(', ')} files are supported.`);
        }

        // ── Validate file size ──
        if (file.size > MAX_FILE_SIZE) {
            throw new ValidationError(`File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB.`);
        }

        // ── Extract text content ──
        const content = await file.text();

        if (!content.trim()) {
            throw new ValidationError('File is empty or contains no extractable text.');
        }

        // ── Sanitize filename ──
        const safeName = sanitizeFilename(file.name);

        const db = getDb();
        const documentId = uuidv4();
        const uploadedAt = new Date().toISOString();

        // Insert document
        db.prepare(
            'INSERT INTO documents (id, name, content, uploaded_at) VALUES (?, ?, ?, ?)'
        ).run(documentId, safeName, content, uploadedAt);

        // Chunk text
        const chunks = chunkText(content);

        // Generate embeddings for all chunks
        const embeddings = await generateEmbeddings(chunks);

        // Insert chunks with embeddings in a transaction
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
                name: safeName,
                uploaded_at: uploadedAt,
                chunk_count: chunks.length,
            },
        });
    } catch (error) {
        const { body, status } = toErrorResponse(error);
        return NextResponse.json(body, { status });
    }
}
