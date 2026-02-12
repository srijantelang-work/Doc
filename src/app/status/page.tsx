'use client';

import { useState, useEffect, useCallback } from 'react';

interface ServiceStatus {
    status: 'ok' | 'error';
    responseTime: number;
    error?: string;
}

interface HealthStatus {
    status: 'healthy' | 'degraded';
    timestamp: string;
    totalResponseTime: number;
    services: {
        backend: ServiceStatus;
        database: ServiceStatus;
        llm: ServiceStatus;
    };
}

export default function StatusPage() {
    const [health, setHealth] = useState<HealthStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastChecked, setLastChecked] = useState<string | null>(null);

    const checkHealth = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/status');
            const data: HealthStatus = await res.json();
            setHealth(data);
            setLastChecked(new Date().toLocaleTimeString());
        } catch {
            setHealth(null);
            setLastChecked(new Date().toLocaleTimeString());
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        checkHealth();

        // Auto-refresh every 30 seconds
        const interval = setInterval(checkHealth, 30000);
        return () => clearInterval(interval);
    }, [checkHealth]);

    const services = [
        {
            key: 'backend',
            label: 'Backend Server',
            icon: '🖥️',
            description: 'Next.js API routes',
        },
        {
            key: 'database',
            label: 'Database',
            icon: '🗄️',
            description: 'SQLite storage',
        },
        {
            key: 'llm',
            label: 'LLM Connection',
            icon: '🤖',
            description: 'Google Gemini API',
        },
    ];

    return (
        <div className="page fade-in">
            <div className="page-header">
                <h1 className="page-title">System Status</h1>
                <p className="page-subtitle">
                    Health check for all services
                </p>
            </div>

            {/* Overall Status */}
            <div
                className="card"
                style={{
                    textAlign: 'center',
                    marginBottom: 'var(--space-xl)',
                    padding: 'var(--space-xl)',
                }}
            >
                {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-md)' }}>
                        <div className="loading-spinner"></div>
                        <span style={{ color: 'var(--text-secondary)' }}>Checking services...</span>
                    </div>
                ) : health ? (
                    <>
                        <div
                            style={{
                                fontSize: '48px',
                                marginBottom: 'var(--space-md)',
                            }}
                        >
                            {health.status === 'healthy' ? '✅' : '⚠️'}
                        </div>
                        <h2 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-sm)' }}>
                            {health.status === 'healthy' ? 'All Systems Operational' : 'Service Degraded'}
                        </h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                            Total response time: {health.totalResponseTime}ms
                        </p>
                    </>
                ) : (
                    <>
                        <div style={{ fontSize: '48px', marginBottom: 'var(--space-md)' }}>❌</div>
                        <h2 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-sm)' }}>
                            Unable to reach backend
                        </h2>
                    </>
                )}
            </div>

            {/* Service Cards */}
            <div className="status-grid">
                {services.map((svc) => {
                    const status = health?.services[svc.key as keyof typeof health.services];
                    return (
                        <div key={svc.key} className="status-card">
                            <div
                                className={`status-indicator ${loading ? 'loading' : status?.status === 'ok' ? 'ok' : 'error'
                                    }`}
                            >
                                {loading ? '⏳' : status?.status === 'ok' ? '✓' : '✗'}
                            </div>
                            <div style={{ fontSize: '24px', marginBottom: 'var(--space-sm)' }}>
                                {svc.icon}
                            </div>
                            <div className="status-label">{svc.label}</div>
                            <div className="status-detail">{svc.description}</div>
                            {status && !loading && (
                                <div style={{ marginTop: 'var(--space-md)' }}>
                                    <span
                                        className={`badge ${status.status === 'ok' ? 'badge-success' : 'badge-error'
                                            }`}
                                    >
                                        {status.status === 'ok' ? 'Healthy' : 'Error'} · {status.responseTime}ms
                                    </span>
                                    {status.error && (
                                        <p
                                            style={{
                                                color: 'var(--error)',
                                                fontSize: 'var(--text-xs)',
                                                marginTop: 'var(--space-sm)',
                                                wordBreak: 'break-all',
                                            }}
                                        >
                                            {status.error}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Footer */}
            <div
                style={{
                    textAlign: 'center',
                    marginTop: 'var(--space-xl)',
                    color: 'var(--text-muted)',
                    fontSize: 'var(--text-sm)',
                }}
            >
                {lastChecked && <p>Last checked: {lastChecked}</p>}
                <p style={{ marginTop: 'var(--space-xs)' }}>
                    Auto-refreshes every 30 seconds
                </p>
                <button
                    className="btn btn-secondary btn-sm"
                    onClick={checkHealth}
                    style={{ marginTop: 'var(--space-md)' }}
                    disabled={loading}
                >
                    {loading ? 'Checking...' : 'Refresh Now'}
                </button>
            </div>
        </div>
    );
}
