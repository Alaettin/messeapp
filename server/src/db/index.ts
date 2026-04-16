import initSqlJs, { type Database } from 'sql.js';
import path from 'path';
import fs from 'fs';
import { initializeDatabase } from './schema.js';

const dbPath = process.env.DB_PATH || path.join('/data', 'db', 'messepass.db');

let db: Database;

export async function getDb(): Promise<Database> {
  if (db) return db;

  const SQL = await initSqlJs();

  // Load existing database file if it exists
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

export default { getDb, saveDb };
