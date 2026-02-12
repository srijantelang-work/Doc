'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface Document {
    id: string;
    name: string;
    uploaded_at: string;
    chunk_count: number;
}

export default function DocumentsPage() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchDocuments = useCallback(async () => {
        try {
            const res = await fetch('/api/documents');
            const data = await res.json();
            setDocuments(data.documents || []);
        } catch {
            showToast('Failed to load documents', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    function showToast(message: string, type: 'success' | 'error') {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    }

    async function handleUpload(file: File) {
        if (!file) return;

        // Validate client-side
        const validExtensions = ['.txt', '.md', '.text'];
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!validExtensions.includes(ext)) {
            showToast('Only .txt and .md files are supported', 'error');
            return;
        }

        if (file.size > 1024 * 1024) {
            showToast('File must be smaller than 1MB', 'error');
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/documents', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                showToast(data.error || 'Upload failed', 'error');
                return;
            }

            showToast(`"${data.document.name}" uploaded (${data.document.chunk_count} chunks)`, 'success');
            fetchDocuments();
        } catch {
            showToast('Upload failed. Please try again.', 'error');
        } finally {
            setUploading(false);
        }
    }

    async function handleDelete(id: string, name: string) {
        if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;

        try {
            const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });

            if (!res.ok) {
                showToast('Failed to delete document', 'error');
                return;
            }

            showToast(`"${name}" deleted`, 'success');
            fetchDocuments();
        } catch {
            showToast('Failed to delete document', 'error');
        }
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleUpload(file);
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) handleUpload(file);
        // Reset input so the same file can be uploaded again
        if (fileInputRef.current) fileInputRef.current.value = '';
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

    return (
        <div className="page fade-in">
            <div className="page-header">
                <h1 className="page-title">Documents</h1>
                <p className="page-subtitle">
                    Upload text files to build your knowledge base
                </p>
            </div>

            {/* Upload Zone */}
            <div
                className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.md,.text"
                    onChange={handleFileChange}
                    className="sr-only"
                />
                {uploading ? (
                    <>
                        <div className="upload-zone-icon">
                            <div className="loading-spinner" style={{ width: 48, height: 48, borderWidth: 3 }}></div>
                        </div>
                        <p className="upload-zone-text">Processing document...</p>
                        <p className="upload-zone-hint">Chunking text and generating embeddings</p>
                    </>
                ) : (
                    <>
                        <div className="upload-zone-icon">📁</div>
                        <p className="upload-zone-text">
                            <strong>Click to upload</strong> or drag and drop
                        </p>
                        <p className="upload-zone-hint">
                            Supports .txt and .md files (max 1MB)
                        </p>
                    </>
                )}
            </div>

            {/* Document List */}
            <div className="mt-xl">
                <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 600, marginBottom: 'var(--space-lg)' }}>
                    Uploaded Documents {!loading && `(${documents.length})`}
                </h2>

                {loading ? (
                    <div className="doc-list">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="skeleton" style={{ height: 72 }}></div>
                        ))}
                    </div>
                ) : documents.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📭</div>
                        <p className="empty-state-text">No documents uploaded yet</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                            Upload your first document to get started
                        </p>
                    </div>
                ) : (
                    <div className="doc-list">
                        {documents.map((doc) => (
                            <div key={doc.id} className="doc-item">
                                <div className="doc-info">
                                    <div className="doc-icon">📄</div>
                                    <div className="doc-details">
                                        <div className="doc-name">{doc.name}</div>
                                        <div className="doc-meta">
                                            <span>{formatDate(doc.uploaded_at)}</span>
                                            <span className="badge badge-accent">
                                                {doc.chunk_count} chunks
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleDelete(doc.id, doc.name)}
                                >
                                    Delete
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Toast */}
            {toast && (
                <div className="toast-container">
                    <div className={`toast toast-${toast.type}`}>
                        {toast.message}
                    </div>
                </div>
            )}
        </div>
    );
}
