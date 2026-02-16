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
    const [copied, setCopied] = useState(false);

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
        setCopied(false);

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

    async function copyAnswer() {
        if (!qaResult) return;
        try {
            await navigator.clipboard.writeText(qaResult.answer);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Clipboard API not available — silently fail
        }
    }

    const charCount = question.length;

    return (
        <div className="section-divider">
            <h2 className="page-title" style={{ fontSize: 'var(--text-2xl)' }}>
                Ask a Question
            </h2>

            <form onSubmit={handleAsk} className="question-form" style={{ marginTop: 'var(--space-xl)' }} role="search" aria-label="Ask a question about your documents">
                <div style={{ flex: 1, position: 'relative' }}>
                    <input
                        type="text"
                        className="input"
                        placeholder="What would you like to know?"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        disabled={asking}
                        aria-label="Your question"
                        maxLength={MAX_QUESTION_LENGTH}
                    />
                    <div style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 'var(--text-xs)',
                        color: charCount > MAX_QUESTION_LENGTH * 0.9 ? 'var(--error)' : 'var(--text-muted)',
                        marginTop: 'var(--space-xs)',
                        textAlign: 'right',
                    }}>
                        {charCount}/{MAX_QUESTION_LENGTH}
                    </div>
                </div>
                <button
                    type="submit"
                    className="btn btn-text"
                    disabled={asking || !question.trim() || !hasDocuments}
                    style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                    aria-label="Submit question"
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
                <div className="error-card mt-xl" role="alert">
                    {qaError}
                </div>
            )}

            {/* Loading Skeleton */}
            {asking && (
                <div className="mt-xl" aria-live="polite" aria-label="Loading answer">
                    <div className="skeleton" style={{ height: 16, width: '80%', marginBottom: 10 }}></div>
                    <div className="skeleton" style={{ height: 16, width: '100%', marginBottom: 10 }}></div>
                    <div className="skeleton" style={{ height: 16, width: '65%' }}></div>
                </div>
            )}

            {/* Answer + Sources */}
            {qaResult && (
                <div className="answer-container" aria-live="polite">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-md)' }}>
                        <div className="answer-box" style={{ flex: 1 }}>
                            {qaResult.answer.split('\n').map((line, i) => (
                                <p key={i}>{line || '\u00A0'}</p>
                            ))}
                        </div>
                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={copyAnswer}
                            aria-label="Copy answer to clipboard"
                            title="Copy answer"
                            style={{ flexShrink: 0 }}
                        >
                            {copied ? '✓ Copied' : 'Copy'}
                        </button>
                    </div>

                    {qaResult.sources.length > 0 && (
                        <>
                            <h3 className="sources-title">Sources</h3>
                            {qaResult.sources.map((source, i) => (
                                <div key={i}>
                                    <div
                                        className="source-item"
                                        onClick={() => toggleSource(i)}
                                        role="button"
                                        tabIndex={0}
                                        aria-expanded={expandedSources.has(i)}
                                        aria-label={`Source ${i + 1}: ${source.documentName}`}
                                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSource(i); }}
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
