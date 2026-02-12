import { NextResponse } from 'next/server';
import { checkDbHealth } from '@/lib/db';
import { checkLlmHealth } from '@/lib/embeddings';

export const dynamic = 'force-dynamic';

export async function GET() {
    const startTime = Date.now();

    // Check backend (always ok if this responds)
    const backend = { status: 'ok' as const, responseTime: 0 };

    // Check database
    const dbStart = Date.now();
    const dbResult = checkDbHealth();
    const dbTime = Date.now() - dbStart;
    const database = {
        status: dbResult.ok ? ('ok' as const) : ('error' as const),
        responseTime: dbTime,
        ...(dbResult.error && { error: dbResult.error }),
    };

    // Check LLM connection
    const llmStart = Date.now();
    const llmResult = await checkLlmHealth();
    const llmTime = Date.now() - llmStart;
    const llm = {
        status: llmResult.ok ? ('ok' as const) : ('error' as const),
        responseTime: llmTime,
        ...(llmResult.error && { error: llmResult.error }),
    };

    const totalTime = Date.now() - startTime;

    const allOk = backend.status === 'ok' && database.status === 'ok' && llm.status === 'ok';

    return NextResponse.json(
        {
            status: allOk ? 'healthy' : 'degraded',
            timestamp: new Date().toISOString(),
            totalResponseTime: totalTime,
            services: {
                backend,
                database,
                llm,
            },
        },
        { status: allOk ? 200 : 503 }
    );
}
