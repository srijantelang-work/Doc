'use client';

import { useState, useEffect, useCallback } from 'react';
import UploadZone from '@/components/UploadZone';
import DocumentList, { DocumentItem } from '@/components/DocumentList';
import QASection from '@/components/QASection';

export default function DocumentsPage() {
    const [documents, setDocuments] = useState<DocumentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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

    return (
        <div className="page fade-in">
            <div className="page-header">
                <h1 className="page-title">Documents</h1>
                <p className="page-subtitle">
                    Upload text files to build your knowledge base
                </p>
            </div>

            <UploadZone onUploadComplete={fetchDocuments} onToast={showToast} />

            <DocumentList
                documents={documents}
                loading={loading}
                onDelete={handleDelete}
            />

            <QASection
                hasDocuments={documents.length > 0}
                loading={loading}
            />

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
