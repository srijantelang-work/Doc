import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { ValidationError, NotFoundError, toErrorResponse } from '@/lib/errors';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** DELETE /api/documents/[id] — delete a document and its chunks. */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id || !UUID_REGEX.test(id)) {
            throw new ValidationError('A valid document ID is required.');
        }

        const db = getDb();

        // Check if document exists
        const doc = db.prepare('SELECT id FROM documents WHERE id = ?').get(id);
        if (!doc) {
            throw new NotFoundError('Document');
        }

        // Delete chunks first (belt-and-suspenders with FK cascade)
        db.prepare('DELETE FROM chunks WHERE document_id = ?').run(id);
        db.prepare('DELETE FROM documents WHERE id = ?').run(id);

        return NextResponse.json({ success: true });
    } catch (error) {
        const { body, status } = toErrorResponse(error);
        return NextResponse.json(body, { status });
    }
}
