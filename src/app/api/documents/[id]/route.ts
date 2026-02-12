import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// DELETE /api/documents/[id] — delete a document and its chunks
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                { error: 'Document ID is required' },
                { status: 400 }
            );
        }

        const db = getDb();

        // Check if document exists
        const doc = db.prepare('SELECT id FROM documents WHERE id = ?').get(id);
        if (!doc) {
            return NextResponse.json(
                { error: 'Document not found' },
                { status: 404 }
            );
        }

        // Delete chunks first (in case FK cascade doesn't work)
        db.prepare('DELETE FROM chunks WHERE document_id = ?').run(id);
        db.prepare('DELETE FROM documents WHERE id = ?').run(id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting document:', error);
        return NextResponse.json(
            { error: 'Failed to delete document' },
            { status: 500 }
        );
    }
}
