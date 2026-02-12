'use client';

import { useState } from 'react';

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

export default function AskPage() {
    const [question, setQuestion] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<QAResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [expandedSources, setExpandedSources] = useState<Set<number>>(new Set());

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        const trimmed = question.trim();
        if (!trimmed) {
            setError('Please enter a question');
            return;
        }

        if (trimmed.length > 1000) {
            setError('Question must be less than 1000 characters');
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);
        setExpandedSources(new Set());

        try {
            const res = await fetch('/api/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: trimmed }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Failed to get an answer');
                return;
            }

            setResult(data);
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
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

    return (
        <div className="page fade-in">
            <div className="page-header">
                <h1 className="page-title">Ask a Question</h1>
                <p className="page-subtitle">
                    Ask anything about your uploaded documents
                </p>
            </div>

            {/* Question Form */}
            <form onSubmit={handleSubmit} className="question-form">
                <input
                    type="text"
                    className="input"
                    placeholder="What would you like to know?"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    disabled={loading}
                    autoFocus
                />
                <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    disabled={loading || !question.trim()}
                >
                    {loading ? (
                        <>
                            <span className="loading-spinner"></span>
                            Thinking...
                        </>
                    ) : (
                        'Ask →'
                    )}
                </button>
            </form>

            {/* Error */}
            {error && (
                <div
                    className="card mt-xl"
                    style={{
                        background: 'var(--error-bg)',
                        borderColor: 'rgba(248, 113, 113, 0.2)',
                        color: 'var(--error)',
                    }}
                >
                    ⚠️ {error}
                </div>
            )}

            {/* Loading Skeleton */}
            {loading && (
                <div className="mt-xl">
                    <div className="skeleton" style={{ height: 24, width: '60%', marginBottom: 12 }}></div>
                    <div className="skeleton" style={{ height: 16, width: '100%', marginBottom: 8 }}></div>
                    <div className="skeleton" style={{ height: 16, width: '90%', marginBottom: 8 }}></div>
                    <div className="skeleton" style={{ height: 16, width: '75%' }}></div>
                </div>
            )}

            {/* Answer + Sources */}
            {result && (
                <div className="answer-container">
                    {/* Answer */}
                    <div className="answer-box">
                        {result.answer.split('\n').map((line, i) => (
                            <p key={i}>{line || '\u00A0'}</p>
                        ))}
                    </div>

                    {/* Sources */}
                    {result.sources.length > 0 && (
                        <>
                            <h3 className="sources-title">
                                📎 Sources ({result.sources.length})
                            </h3>
                            {result.sources.map((source, i) => (
                                <div
                                    key={i}
                                    className="source-card"
                                    onClick={() => toggleSource(i)}
                                >
                                    <div className="source-header">
                                        <span className="source-doc-name">
                                            📄 {source.documentName}
                                        </span>
                                        <span className="badge badge-accent">
                                            {getSimilarityLabel(source.similarity)} ({Math.round(source.similarity * 100)}%)
                                        </span>
                                    </div>
                                    {expandedSources.has(i) ? (
                                        <div className="source-text">{source.chunkText}</div>
                                    ) : (
                                        <p
                                            style={{
                                                color: 'var(--text-muted)',
                                                fontSize: 'var(--text-xs)',
                                                marginTop: 'var(--space-xs)',
                                            }}
                                        >
                                            Click to expand source passage ▸
                                        </p>
                                    )}
                                </div>
                            ))}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
