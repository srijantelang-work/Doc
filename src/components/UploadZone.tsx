'use client';

import { useRef, useState } from 'react';
import { VALID_EXTENSIONS, MAX_FILE_SIZE } from '@/lib/constants';

interface UploadZoneProps {
    onUploadComplete: () => void;
    onToast: (message: string, type: 'success' | 'error') => void;
}

/** Format file size in human-readable form. */
function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadZone({ onUploadComplete, onToast }: UploadZoneProps) {
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    async function handleUpload(file: File) {
        if (!file) return;

        const ext = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!VALID_EXTENSIONS.includes(ext as typeof VALID_EXTENSIONS[number])) {
            onToast(`Only ${VALID_EXTENSIONS.join(', ')} files are supported`, 'error');
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            onToast(`File must be smaller than ${MAX_FILE_SIZE / (1024 * 1024)}MB`, 'error');
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
                onToast(data.error || 'Upload failed', 'error');
                return;
            }

            onToast(
                `"${data.document.name}" uploaded — ${data.document.chunk_count} chunks (${formatSize(file.size)})`,
                'success'
            );
            onUploadComplete();
        } catch {
            onToast('Upload failed. Please try again.', 'error');
        } finally {
            setUploading(false);
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

    return (
        <div
            className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            role="button"
            tabIndex={0}
            aria-label="Upload a text document — click or drag and drop"
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
        >
            <input
                ref={fileInputRef}
                type="file"
                accept={VALID_EXTENSIONS.join(',')}
                onChange={handleFileChange}
                className="sr-only"
                aria-label="Choose file to upload"
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
                        .txt and .md files — max {MAX_FILE_SIZE / (1024 * 1024)}MB
                    </p>
                </>
            )}
        </div>
    );
}
