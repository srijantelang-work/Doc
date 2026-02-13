'use client';

import { useState } from 'react';
import { MAX_QUESTION_LENGTH } from '@/lib/constants';

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

interface QASectionProps {
    hasDocuments: boolean;
    loading: boolean;
}

function getSimilarityLabel(score: number): string {
    if (score >= 0.8) return 'Very High';
    if (score >= 0.6) return 'High';
    if (score >= 0.4) return 'Moderate';
    return 'Low';
}

export default function QASection({ hasDocuments, loading }: QASectionProps) {
    const [question, setQuestion] = useState('');
    const [asking, setAsking] = useState(false);
    const [qaResult, setQaResult] = useState<QAResult | null>(null);
    const [qaError, setQaError] = useState<string | null>(null);
    const [expandedSources, setExpandedSources] = useState<Set<number>>(new Set());

    async function handleAsk(e: React.FormEvent) {
        e.preventDefault();

        const trimmed = question.trim();
        if (!trimmed) {
            setQaError('Please enter a question');
            return;
        }

        if (trimmed.length > MAX_QUESTION_LENGTH) {
            setQaError(`Question must be less than ${MAX_QUESTION_LENGTH} characters`);
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

    return (
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
                    disabled={asking || !question.trim() || !hasDocuments}
                    style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                >
                    {asking ? (
                        <span className="loading-spinner"></span>
                    ) : (
                        'Ask →'
                    )}
                </button>
            </form>

            {!hasDocuments && !loading && (
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
    );
}
