import { Router } from 'express';
import multer from 'multer';
import type { SqlValue } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { getDb, saveDb } from '../db/index.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50_000_000 } });

// Helper: Convert sql.js result to array of objects
function resultToObjects(result: { columns: string[]; values: unknown[][] }[]): Record<string, unknown>[] {
  if (result.length === 0) return [];
  const { columns, values } = result[0];
  return values.map(row => Object.fromEntries(columns.map((col, i) => [col, row[i]])));
}

// ──────────────────────────────────────
// DOCUMENTS
// ──────────────────────────────────────

router.get('/api/admin/documents', async (_req, res) => {
  try {
    const db = await getDb();
    const result = db.exec('SELECT * FROM documents ORDER BY sort_order, name');
    res.json({ documents: resultToObjects(result) });
  } catch (err) {
    console.error('Admin get documents error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/api/admin/documents', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Keine Datei hochgeladen' });

    const { name, category } = req.body;
    const displayName = name || req.file.originalname;
    const ext = path.extname(req.file.originalname);
    const filename = req.file.originalname;

    const db = await getDb();
    db.run(
      'INSERT INTO documents (name, filename, file_path, category) VALUES (?, ?, ?, ?)',
      [displayName, filename, '', category || null]
    );

    // Get the inserted ID
    const idResult = db.exec('SELECT last_insert_rowid() as id');
    const docId = idResult[0].values[0][0] as number;

    // Save file
    const filePath = path.join('/data/storage/documents', `${docId}${ext}`);
    fs.writeFileSync(filePath, req.file.buffer);

    // Update file_path
    db.run('UPDATE documents SET file_path = ? WHERE id = ?', [filePath, docId]);
    saveDb();

    const doc = resultToObjects(db.exec('SELECT * FROM documents WHERE id = ?', [docId]))[0];
    res.status(201).json(doc);
  } catch (err) {
    console.error('Admin create document error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/api/admin/documents/:id', async (req, res) => {
  try {
    const { name, category, active, sort_order } = req.body;
    const db = await getDb();

    const fields: string[] = [];
    const values: SqlValue[] = [];

    if (name !== undefined) { fields.push('name = ?'); values.push(name); }
    if (category !== undefined) { fields.push('category = ?'); values.push(category || null); }
    if (active !== undefined) { fields.push('active = ?'); values.push(active ? 1 : 0); }
    if (sort_order !== undefined) { fields.push('sort_order = ?'); values.push(sort_order); }

    if (fields.length === 0) return res.status(400).json({ error: 'Keine Felder zum Aktualisieren' });

    values.push(req.params.id);
    db.run(`UPDATE documents SET ${fields.join(', ')} WHERE id = ?`, values);
    saveDb();

    const doc = resultToObjects(db.exec('SELECT * FROM documents WHERE id = ?', [req.params.id]))[0];
    if (!doc) return res.status(404).json({ error: 'Dokument nicht gefunden' });
    res.json(doc);
  } catch (err) {
    console.error('Admin update document error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/api/admin/documents/:id', async (req, res) => {
  try {
    const db = await getDb();
    const docs = resultToObjects(db.exec('SELECT * FROM documents WHERE id = ?', [req.params.id]));
    if (docs.length === 0) return res.status(404).json({ error: 'Dokument nicht gefunden' });

    const doc = docs[0];
    // Delete file
    if (doc.file_path && typeof doc.file_path === 'string' && fs.existsSync(doc.file_path)) {
      fs.unlinkSync(doc.file_path);
    }

    db.run('DELETE FROM documents WHERE id = ?', [req.params.id]);
    saveDb();
    res.json({ success: true });
  } catch (err) {
    console.error('Admin delete document error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ──────────────────────────────────────
// CONTACTS
// ──────────────────────────────────────

router.get('/api/admin/contacts', async (_req, res) => {
  try {
    const db = await getDb();
    const result = db.exec('SELECT * FROM contacts ORDER BY sort_order, name');
    res.json({ contacts: resultToObjects(result) });
  } catch (err) {
    console.error('Admin get contacts error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/api/admin/contacts', async (req, res) => {
  try {
    const { name, role, email, phone } = req.body;
    if (!name) return res.status(400).json({ error: 'Name ist erforderlich' });

    const db = await getDb();
    db.run(
      'INSERT INTO contacts (name, role, email, phone) VALUES (?, ?, ?, ?)',
      [name, role || null, email || null, phone || null]
    );

    const idResult = db.exec('SELECT last_insert_rowid() as id');
    const contactId = idResult[0].values[0][0] as number;
    saveDb();

    const contact = resultToObjects(db.exec('SELECT * FROM contacts WHERE id = ?', [contactId]))[0];
    res.status(201).json(contact);
  } catch (err) {
    console.error('Admin create contact error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/api/admin/contacts/:id', async (req, res) => {
  try {
    const { name, role, email, phone, active, sort_order } = req.body;
    const db = await getDb();

    const fields: string[] = [];
    const values: SqlValue[] = [];

    if (name !== undefined) { fields.push('name = ?'); values.push(name); }
    if (role !== undefined) { fields.push('role = ?'); values.push(role || null); }
    if (email !== undefined) { fields.push('email = ?'); values.push(email || null); }
    if (phone !== undefined) { fields.push('phone = ?'); values.push(phone || null); }
    if (active !== undefined) { fields.push('active = ?'); values.push(active ? 1 : 0); }
    if (sort_order !== undefined) { fields.push('sort_order = ?'); values.push(sort_order); }

    if (fields.length === 0) return res.status(400).json({ error: 'Keine Felder zum Aktualisieren' });

    values.push(req.params.id);
    db.run(`UPDATE contacts SET ${fields.join(', ')} WHERE id = ?`, values);
    saveDb();

    const contact = resultToObjects(db.exec('SELECT * FROM contacts WHERE id = ?', [req.params.id]))[0];
    if (!contact) return res.status(404).json({ error: 'Kontakt nicht gefunden' });
    res.json(contact);
  } catch (err) {
    console.error('Admin update contact error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/api/admin/contacts/:id', async (req, res) => {
  try {
    const db = await getDb();
    db.run('DELETE FROM contacts WHERE id = ?', [req.params.id]);
    saveDb();
    res.json({ success: true });
  } catch (err) {
    console.error('Admin delete contact error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ──────────────────────────────────────
// VISITORS
// ──────────────────────────────────────

router.get('/api/admin/visitors', async (req, res) => {
  try {
    const db = await getDb();
    const search = (req.query.search as string) || '';

    let result;
    if (search) {
      const like = `%${search}%`;
      result = db.exec(
        `SELECT * FROM visitors
         WHERE name LIKE ? OR company LIKE ? OR id LIKE ?
         ORDER BY created_at DESC`,
        [like, like, like]
      );
    } else {
      result = db.exec('SELECT * FROM visitors ORDER BY created_at DESC');
    }

    res.json({ visitors: resultToObjects(result) });
  } catch (err) {
    console.error('Admin get visitors error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/api/admin/visitors/:id', async (req, res) => {
  try {
    const { name, company, position, address, email, phone, website, notes } = req.body;
    const db = await getDb();

    db.run(
      `UPDATE visitors SET
        name = ?, company = ?, position = ?, address = ?,
        email = ?, phone = ?, website = ?, notes = ?,
        updated_at = datetime('now')
      WHERE id = ?`,
      [name ?? null, company ?? null, position ?? null, address ?? null,
       email ?? null, phone ?? null, website ?? null, notes ?? null,
       req.params.id]
    );
    saveDb();

    const visitor = resultToObjects(db.exec('SELECT * FROM visitors WHERE id = ?', [req.params.id]))[0];
    if (!visitor) return res.status(404).json({ error: 'Besucher nicht gefunden' });
    res.json(visitor);
  } catch (err) {
    console.error('Admin update visitor error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/api/admin/visitors/:id', async (req, res) => {
  try {
    const db = await getDb();
    const id = req.params.id;

    // Delete files
    const avatarPath = path.join('/data/storage/avatars', `${id}.png`);
    const bcPath = path.join('/data/storage/business-cards', `${id}.jpg`);
    if (fs.existsSync(avatarPath)) fs.unlinkSync(avatarPath);
    if (fs.existsSync(bcPath)) fs.unlinkSync(bcPath);

    db.run('DELETE FROM visitors WHERE id = ?', [id]);
    saveDb();
    res.json({ success: true });
  } catch (err) {
    console.error('Admin delete visitor error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
