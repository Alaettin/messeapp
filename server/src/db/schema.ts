import type { Database } from 'sql.js';

export function initializeDatabase(db: Database): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS visitors (
      id TEXT PRIMARY KEY,
      name TEXT,
      company TEXT,
      position TEXT,
      address TEXT,
      email TEXT,
      phone TEXT,
      website TEXT,
      business_card_path TEXT,
      avatar_path TEXT,
      avatar_prompt TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT (datetime('now')),
      updated_at DATETIME DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      filename TEXT NOT NULL,
      file_path TEXT NOT NULL,
      category TEXT,
      active INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      company TEXT,
      role TEXT,
      email TEXT,
      phone TEXT,
      website TEXT,
      linkedin TEXT,
      notes TEXT,
      photo_path TEXT,
      active INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS visitor_documents (
      visitor_id TEXT NOT NULL,
      document_id INTEGER NOT NULL,
      PRIMARY KEY (visitor_id, document_id),
      FOREIGN KEY (visitor_id) REFERENCES visitors(id) ON DELETE CASCADE,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS visitor_contacts (
      visitor_id TEXT NOT NULL,
      contact_id INTEGER NOT NULL,
      PRIMARY KEY (visitor_id, contact_id),
      FOREIGN KEY (visitor_id) REFERENCES visitors(id) ON DELETE CASCADE,
      FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS avatar_options (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      label TEXT NOT NULL,
      prompt_value TEXT NOT NULL,
      active INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  // Default settings
  const defaults: [string, string][] = [
    ['ocr_timeout', '30'],
    ['avatar_timeout', '60'],
    ['avatar_download_timeout', '30'],
  ];
  for (const [key, value] of defaults) {
    db.run('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', [key, value]);
  }

  // Migrations: add columns if they don't exist yet
  const migrations: [string, string][] = [
    ['contacts', 'company'],
    ['contacts', 'website'],
    ['contacts', 'linkedin'],
    ['contacts', 'notes'],
  ];
  for (const [table, column] of migrations) {
    try {
      db.run(`ALTER TABLE ${table} ADD COLUMN ${column} TEXT`);
    } catch {
      // Column already exists, ignore
    }
  }
}
