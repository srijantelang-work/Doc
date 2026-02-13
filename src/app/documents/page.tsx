'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface Document {
    id: string;
    name: string;
    uploaded_at: string;
    chunk_count: number;
}

interface Source {
    documentName: string;
    documentId: string;
    chunkText: string;
    similarity: number;
}

interface QAResult {
    answer: string;
    sources: Source[];
}

export default function DocumentsPage() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Q&A State
    const [question, setQuestion] = useState('');
    const [asking, setAsking] = useState(false);
    const [qaResult, setQaResult] = useState<QAResult | null>(null);
    const [qaError, setQaError] = useState<string | null>(null);
    const [expandedSources, setExpandedSources] = useState<Set<number>>(new Set());

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

    // ── Upload ──────────────────────────────────────────────

    async function handleUpload(file: File) {
        if (!file) return;

        const validExtensions = ['.txt', '.md', '.text', '.pdf'];
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!validExtensions.includes(ext)) {
            showToast('Only .txt, .md, and .pdf files are supported', 'error');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showToast('File must be smaller than 5MB', 'error');
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
        if (fileInputRef.current) fileInputRef.current.value = '';
    }

    // ── Q&A ─────────────────────────────────────────────────

    async function handleAsk(e: React.FormEvent) {
        e.preventDefault();

        const trimmed = question.trim();
        if (!trimmed) {
            setQaError('Please enter a question');
            return;
        }

        if (trimmed.length > 1000) {
            setQaError('Question must be less than 1000 characters');
            return;
        }

        setAsking(true);
        setQaError(null);
        setQaResult(null);
        setExpandedSources(new Set());

        try {
            const res = await fetch('/api/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: trimmed }),
            });

            const data = await res.json();

            if (!res.ok) {
                setQaError(data.error || 'Failed to get an answer');
                return;
            }

            setQaResult(data);
        } catch {
            setQaError('Something went wrong. Please try again.');
        } finally {
            setAsking(false);
        }
    }

    function toggleSource(index: number) {
        setExpandedSources((prev) => {
            const next = new Set(prev);
            if (next.has(index)) {
                next.delete(index);
            } else {
                next.add(index);
            }
            return next;
        });
    }

    function getSimilarityLabel(score: number): string {
        if (score >= 0.8) return 'Very High';
        if (score >= 0.6) return 'High';
        if (score >= 0.4) return 'Moderate';
        return 'Low';
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
                    accept=".txt,.md,.text,.pdf"
                    onChange={handleFileChange}
                    className="sr-only"
                />
                {uploading ? (
                    <>
                        <div style={{ marginBottom: 'var(--space-md)' }}>
                            <div className="loading-spinner" style={{ width: 24, height: 24 }}></div>
                        </div>
                        <p className="upload-zone-text">Processing document...</p>
                        <p className="upload-zone-hint">Chunking text and generating embeddings</p>
                    </>
                ) : (
                    <>
                        <p className="upload-zone-text">
                            Drop files here or <strong>click to upload</strong>
                        </p>
                        <p className="upload-zone-hint">
                            .txt · .md · .pdf — max 5MB
                        </p>
                    </>
                )}
            </div>

            {/* Document List */}
            <div className="mt-2xl">
                {loading ? (
                    <div className="doc-list">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="skeleton" style={{ height: 48, marginBottom: 8 }}></div>
                        ))}
                    </div>
                ) : documents.length === 0 ? (
                    <div className="empty-state">
                        <p className="empty-state-text">No documents uploaded yet</p>
                    </div>
                ) : (
                    <div className="doc-list">
                        {documents.map((doc) => (
                            <div key={doc.id} className="doc-item">
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
                                    onClick={() => handleDelete(doc.id, doc.name)}
                                    title={`Delete ${doc.name}`}
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Ask a Question Section ─────────────────────── */}
            <div className="section-divider">
                <h2 className="page-title" style={{ fontSize: 'var(--text-2xl)' }}>
                    Ask a Question
                </h2>

                <form onSubmit={handleAsk} className="question-form" style={{ marginTop: 'var(--space-xl)' }}>
                    <input
                        type="text"
                        className="input"
                        placeholder="What would you like to know?"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        disabled={asking}
                    />
                    <button
                        type="submit"
                        className="btn btn-text"
                        disabled={asking || !question.trim() || documents.length === 0}
                        style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                    >
                        {asking ? (
                            <>
                                <span className="loading-spinner"></span>
                            </>
                        ) : (
                            'Ask →'
                        )}
                    </button>
                </form>

                {documents.length === 0 && !loading && (
                    <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', marginTop: 'var(--space-md)' }}>
                        Upload documents above to start asking questions
                    </p>
                )}

                {/* Q&A Error */}
                {qaError && (
                    <div className="error-card mt-xl">
                        {qaError}
                    </div>
                )}

                {/* Loading Skeleton */}
                {asking && (
                    <div className="mt-xl">
                        <div className="skeleton" style={{ height: 16, width: '80%', marginBottom: 10 }}></div>
                        <div className="skeleton" style={{ height: 16, width: '100%', marginBottom: 10 }}></div>
                        <div className="skeleton" style={{ height: 16, width: '65%' }}></div>
                    </div>
                )}

                {/* Answer + Sources */}
                {qaResult && (
                    <div className="answer-container">
                        <div className="answer-box">
                            {qaResult.answer.split('\n').map((line, i) => (
                                <p key={i}>{line || '\u00A0'}</p>
                            ))}
                        </div>

                        {qaResult.sources.length > 0 && (
                            <>
                                <h3 className="sources-title">Sources</h3>
                                {qaResult.sources.map((source, i) => (
                                    <div key={i}>
                                        <div
                                            className="source-item"
                                            onClick={() => toggleSource(i)}
                                        >
                                            <span className="source-number">
                                                <sup>{i + 1}</sup>
                                            </span>
                                            <span>{source.documentName}</span>
                                            <span style={{ color: 'var(--text-muted)' }}>·</span>
                                            <span>{getSimilarityLabel(source.similarity)}</span>
                                            <span style={{ color: 'var(--text-muted)', marginLeft: 'auto' }}>
                                                {expandedSources.has(i) ? '▾' : '▸'}
                                            </span>
                                        </div>
                                        {expandedSources.has(i) && (
                                            <div className="source-text">{source.chunkText}</div>
                                        )}
                                    </div>
                                ))}
                            </>
                        )}
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
