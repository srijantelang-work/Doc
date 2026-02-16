'use client';

export interface DocumentItem {
    id: string;
    name: string;
    uploaded_at: string;
    chunk_count: number;
}

interface DocumentListProps {
    documents: DocumentItem[];
    loading: boolean;
    onDelete: (id: string, name: string) => void;
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function DocumentList({ documents, loading, onDelete }: DocumentListProps) {
    if (loading) {
        return (
            <div className="doc-list mt-2xl" aria-label="Loading documents">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="skeleton" style={{ height: 48, marginBottom: 8 }}></div>
                ))}
            </div>
        );
    }

    if (documents.length === 0) {
        return (
            <div className="empty-state mt-2xl">
                <p className="empty-state-text">No documents uploaded yet</p>
            </div>
        );
    }

    return (
        <div className="mt-2xl">
            <p style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                color: 'var(--text-muted)',
                marginBottom: 'var(--space-md)',
            }}>
                {documents.length} document{documents.length !== 1 ? 's' : ''}
            </p>
            <div className="doc-list" role="list" aria-label="Uploaded documents">
                {documents.map((doc) => (
                    <div key={doc.id} className="doc-item" role="listitem">
                        <div className="doc-info">
                            <div className="doc-details">
                                <div className="doc-name">{doc.name}</div>
                                <div className="doc-meta">
                                    <span>{formatDate(doc.uploaded_at)}</span>
                                    <span className="badge">{doc.chunk_count} chunks</span>
                                </div>
                            </div>
                        </div>
                        <button
                            className="btn btn-danger"
                            onClick={() => onDelete(doc.id, doc.name)}
                            title={`Delete ${doc.name}`}
                            aria-label={`Delete document: ${doc.name}`}
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
