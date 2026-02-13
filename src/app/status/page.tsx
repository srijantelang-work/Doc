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
        const interval = setInterval(checkHealth, 30000);
        return () => clearInterval(interval);
    }, [checkHealth]);

    const services = [
        { key: 'backend', label: 'Backend Server', detail: 'Next.js API routes' },
        { key: 'database', label: 'Database', detail: 'SQLite storage' },
        { key: 'llm', label: 'LLM Connection', detail: 'Google Gemini API' },
    ];

    return (
        <div className="page fade-in">
            <div className="page-header">
                <h1 className="page-title">System Status</h1>
            </div>

            {/* Overall Status */}
            {loading ? (
                <div className="status-summary">
                    <span className="status-dot loading"></span>
                    <span style={{ color: 'var(--text-secondary)' }}>Checking services...</span>
                </div>
            ) : health ? (
                <>
                    <div className="status-summary">
                        <span className="status-dot ok"></span>
                        <span>
                            {health.status === 'healthy' ? 'All Systems Operational' : 'Service Degraded'}
                        </span>
                    </div>
                    <p className="status-timestamp">
                        {lastChecked && `Last checked at ${lastChecked}`} · {health.totalResponseTime}ms total
                    </p>
                </>
            ) : (
                <div className="status-summary">
                    <span className="status-dot error"></span>
                    <span>Unable to reach backend</span>
                </div>
            )}

            {/* Service Table */}
            <table className="status-table">
                <thead>
                    <tr>
                        <th>Service</th>
                        <th>Status</th>
                        <th>Latency</th>
                    </tr>
                </thead>
                <tbody>
                    {services.map((svc) => {
                        const status = health?.services[svc.key as keyof typeof health.services];
                        return (
                            <tr key={svc.key}>
                                <td>
                                    <div style={{ fontWeight: 500 }}>{svc.label}</div>
                                    <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
                                        {svc.detail}
                                    </div>
                                </td>
                                <td>
                                    {loading ? (
                                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                                    ) : (
                                        <div className={`status-cell ${status?.status === 'ok' ? 'healthy' : 'unhealthy'}`}>
                                            <span className={`status-dot ${status?.status === 'ok' ? 'ok' : 'error'}`}></span>
                                            {status?.status === 'ok' ? 'Healthy' : 'Error'}
                                        </div>
                                    )}
                                    {status?.error && (
                                        <div style={{ color: 'var(--error)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', marginTop: 4 }}>
                                            {status.error}
                                        </div>
                                    )}
                                </td>
                                <td>
                                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)' }}>
                                        {loading ? '—' : status ? `${status.responseTime}ms` : '—'}
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {/* Refresh */}
            <div style={{ textAlign: 'center', marginTop: 'var(--space-3xl)' }}>
                <button
                    className="btn btn-ghost"
                    onClick={checkHealth}
                    disabled={loading}
                >
                    {loading ? 'Checking...' : 'Refresh'}
                </button>
            </div>
        </div>
    );
}
