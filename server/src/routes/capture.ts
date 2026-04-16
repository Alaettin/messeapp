import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { getDb, saveDb } from '../db/index.js';
import { extractBusinessCard } from '../services/ocr.js';
import { generateAvatar } from '../services/avatar.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10_000_000 } });

// Check if visitor exists
router.get('/api/visitors/:id/exists', async (req, res) => {
  try {
    const db = await getDb();
    const result = db.exec('SELECT id, name, company FROM visitors WHERE id = ?', [req.params.id]);
    if (result.length > 0 && result[0].values.length > 0) {
      const [id, name, company] = result[0].values[0];
      res.json({ exists: true, visitor: { id, name, company } });
    } else {
      res.json({ exists: false });
    }
  } catch (err) {
    console.error('Check visitor error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create visitor (just the ID)
router.post('/api/visitors', async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'ID required' });

    const db = await getDb();
    // Upsert: delete existing if overwrite
    db.run('DELETE FROM visitors WHERE id = ?', [id]);
    db.run('INSERT INTO visitors (id) VALUES (?)', [id]);
    saveDb();

    res.status(201).json({ id });
  } catch (err) {
    console.error('Create visitor error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload business card + OCR
router.post('/api/visitors/:id/business-card', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No photo uploaded' });

    const filePath = path.join('/data/storage/business-cards', `${req.params.id}.jpg`);
    fs.writeFileSync(filePath, req.file.buffer);

    const ocr = await extractBusinessCard(filePath);
    res.json({ ocr });
  } catch (err) {
    console.error('Business card upload error:', err);
    res.status(500).json({ error: 'OCR processing failed' });
  }
});

// Update visitor data
router.put('/api/visitors/:id', async (req, res) => {
  try {
    const { name, company, position, address, email, phone, website, notes } = req.body;
    const db = await getDb();

    // Check if business card file exists
    const bcPath = path.join('/data/storage/business-cards', `${req.params.id}.jpg`);
    const businessCardPath = fs.existsSync(bcPath) ? bcPath : null;

    db.run(
      `UPDATE visitors SET
        name = ?, company = ?, position = ?, address = ?,
        email = ?, phone = ?, website = ?, notes = ?,
        business_card_path = COALESCE(?, business_card_path),
        updated_at = datetime('now')
      WHERE id = ?`,
      [name ?? null, company ?? null, position ?? null, address ?? null,
       email ?? null, phone ?? null, website ?? null, notes ?? null,
       businessCardPath, req.params.id]
    );
    saveDb();

    // Return updated visitor
    const result = db.exec('SELECT * FROM visitors WHERE id = ?', [req.params.id]);
    if (result.length > 0 && result[0].values.length > 0) {
      const cols = result[0].columns;
      const vals = result[0].values[0];
      const visitor = Object.fromEntries(cols.map((c, i) => [c, vals[i]]));
      res.json(visitor);
    } else {
      res.status(404).json({ error: 'Visitor not found' });
    }
  } catch (err) {
    console.error('Update visitor error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get active documents
router.get('/api/documents', async (_req, res) => {
  try {
    const db = await getDb();
    const result = db.exec('SELECT * FROM documents WHERE active = 1 ORDER BY sort_order, name');
    const documents = resultToObjects(result);
    res.json({ documents });
  } catch (err) {
    console.error('Get documents error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get active contacts
router.get('/api/contacts', async (_req, res) => {
  try {
    const db = await getDb();
    const result = db.exec('SELECT * FROM contacts WHERE active = 1 ORDER BY sort_order, name');
    const contacts = resultToObjects(result);
    res.json({ contacts });
  } catch (err) {
    console.error('Get contacts error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Save document + contact selections
router.put('/api/visitors/:id/selections', async (req, res) => {
  try {
    const { documentIds = [], contactIds = [] } = req.body;
    const db = await getDb();

    db.run('DELETE FROM visitor_documents WHERE visitor_id = ?', [req.params.id]);
    db.run('DELETE FROM visitor_contacts WHERE visitor_id = ?', [req.params.id]);

    for (const docId of documentIds) {
      db.run('INSERT INTO visitor_documents (visitor_id, document_id) VALUES (?, ?)', [req.params.id, docId]);
    }
    for (const contactId of contactIds) {
      db.run('INSERT INTO visitor_contacts (visitor_id, contact_id) VALUES (?, ?)', [req.params.id, contactId]);
    }
    saveDb();

    res.json({ success: true });
  } catch (err) {
    console.error('Save selections error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get avatar options grouped by category
router.get('/api/avatar-options', async (_req, res) => {
  try {
    const db = await getDb();
    const result = db.exec('SELECT * FROM avatar_options WHERE active = 1 ORDER BY category, sort_order');
    const options = resultToObjects(result);

    // Group by category
    const grouped: Record<string, typeof options> = {};
    for (const opt of options) {
      const cat = opt.category as string;
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(opt);
    }

    res.json({ options: grouped });
  } catch (err) {
    console.error('Get avatar options error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate avatar
router.post('/api/visitors/:id/avatar', async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ error: 'OpenAI API key not configured' });
    }

    const { selections = {}, freeText = '' } = req.body;
    const { prompt, imageBuffer } = await generateAvatar(selections, freeText);

    const avatarPath = path.join('/data/storage/avatars', `${req.params.id}.png`);
    fs.writeFileSync(avatarPath, imageBuffer);

    const db = await getDb();
    db.run(
      'UPDATE visitors SET avatar_path = ?, avatar_prompt = ?, updated_at = datetime(\'now\') WHERE id = ?',
      [avatarPath, prompt, req.params.id]
    );
    saveDb();

    res.json({ avatarUrl: `/api/storage/avatars/${req.params.id}.png`, prompt });
  } catch (err) {
    console.error('Generate avatar error:', err);
    res.status(500).json({ error: 'Avatar generation failed' });
  }
});

// Get full visitor with documents and contacts
router.get('/api/visitors/:id', async (req, res) => {
  try {
    const db = await getDb();

    // Get visitor
    const visitorResult = db.exec('SELECT * FROM visitors WHERE id = ?', [req.params.id]);
    if (visitorResult.length === 0 || visitorResult[0].values.length === 0) {
      return res.status(404).json({ error: 'Visitor not found' });
    }
    const visitor = resultToObjects(visitorResult)[0];

    // Get assigned documents
    const docsResult = db.exec(
      `SELECT d.* FROM documents d
       JOIN visitor_documents vd ON d.id = vd.document_id
       WHERE vd.visitor_id = ?
       ORDER BY d.sort_order, d.name`,
      [req.params.id]
    );
    visitor.documents = resultToObjects(docsResult);

    // Get assigned contacts
    const contactsResult = db.exec(
      `SELECT c.* FROM contacts c
       JOIN visitor_contacts vc ON c.id = vc.contact_id
       WHERE vc.visitor_id = ?
       ORDER BY c.sort_order, c.name`,
      [req.params.id]
    );
    visitor.contacts = resultToObjects(contactsResult);

    res.json(visitor);
  } catch (err) {
    console.error('Get visitor error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper: Convert sql.js result to array of objects
function resultToObjects(result: { columns: string[]; values: unknown[][] }[]): Record<string, unknown>[] {
  if (result.length === 0) return [];
  const { columns, values } = result[0];
  return values.map(row => Object.fromEntries(columns.map((col, i) => [col, row[i]])));
}

export default router;
