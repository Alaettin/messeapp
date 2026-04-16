import initSqlJs, { type Database } from 'sql.js';
import path from 'path';
import fs from 'fs';
import { initializeDatabase } from './schema.js';

const dbPath = process.env.DB_PATH || path.join('/data', 'db', 'messepass.db');

let db: Database;

// Simple mutex for serializing DB access
let lockQueue: (() => void)[] = [];
let locked = false;

function acquireLock(): Promise<void> {
  return new Promise<void>((resolve) => {
    if (!locked) {
      locked = true;
      resolve();
    } else {
      lockQueue.push(resolve);
    }
  });
}

function releaseLock(): void {
  const next = lockQueue.shift();
  if (next) {
    next();
  } else {
    locked = false;
  }
}

export async function getDb(): Promise<Database> {
  if (db) return db;

  const SQL = await initSqlJs();

  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA foreign_keys = ON');
  initializeDatabase(db);
  saveDb();

  return db;
}

export function saveDb(): void {
  if (!db) return;
  const dir = path.dirname(dbPath);
  fs.mkdirSync(dir, { recursive: true });
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

/**
 * Execute a function with exclusive DB access.
 * Serializes all writes — safe for concurrent requests.
 * Automatically saves to disk after the function completes.
 */
export async function withDb<T>(fn: (db: Database) => T | Promise<T>): Promise<T> {
  await acquireLock();
  try {
    const database = await getDb();
    const result = await fn(database);
    saveDb();
    return result;
  } finally {
    releaseLock();
  }
}

export async function getSetting(key: string, fallback: number): Promise<number> {
  const database = await getDb();
  const result = database.exec('SELECT value FROM settings WHERE key = ?', [key]);
  if (result.length > 0 && result[0].values.length > 0) {
    const val = Number(result[0].values[0][0]);
    return isNaN(val) ? fallback : val;
  }
  return fallback;
}

export default { getDb, saveDb, withDb, getSetting };
