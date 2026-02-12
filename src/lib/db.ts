import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let db: Database.Database | null = null;

function getDbPath(): string {
    // On Vercel (serverless), use /tmp for ephemeral storage
    const isVercel = process.env.VERCEL === '1';
    const dir = isVercel ? '/tmp' : path.join(process.cwd(), 'data');

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    return path.join(dir, 'knowledge.db');
}

export function getDb(): Database.Database {
    if (!db) {
        const dbPath = getDbPath();
        db = new Database(dbPath);

        // Enable WAL mode for better concurrent read performance
        db.pragma('journal_mode = WAL');
        db.pragma('foreign_keys = ON');

        // Create tables
        db.exec(`
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        content TEXT NOT NULL,
        uploaded_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS chunks (
        id TEXT PRIMARY KEY,
        document_id TEXT NOT NULL,
        content TEXT NOT NULL,
        chunk_index INTEGER NOT NULL,
        embedding TEXT,
        FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
      );
    `);
    }

    return db;
}

// Helper to check if the DB is healthy
export function checkDbHealth(): { ok: boolean; error?: string } {
    try {
        const database = getDb();
        const result = database.prepare('SELECT 1 as health').get() as { health: number };
        return { ok: result.health === 1 };
    } catch (error) {
        return { ok: false, error: (error as Error).message };
    }
}
