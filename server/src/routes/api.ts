import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { getDb } from '../db/index.js';

const router = Router();
const API_BASE = '/api/connector';

function resultToObjects(result: { columns: string[]; values: unknown[][] }[]): Record<string, unknown>[] {
  if (result.length === 0) return [];
  const { columns, values } = result[0];
  return values.map(row => Object.fromEntries(columns.map((col, i) => [col, row[i]])));
}

// 1. GET /Product/ids — Alle Besucher-Identifier
router.get(`${API_BASE}/Product/ids`, async (_req, res) => {
  try {
    const db = await getDb();
    const result = db.exec('SELECT id FROM visitors ORDER BY created_at DESC');
    const ids = result.length > 0 ? result[0].values.map(r => r[0]) : [];
    res.json(ids);
  } catch (err) {
    console.error('API Product/ids error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 2. GET /Product/hierarchies — Leer (reserved)
router.get(`${API_BASE}/Product/hierarchies`, (_req, res) => {
  res.json([]);
});

// 3. GET /Product/hierarchy/levels — Ein Level "Asset"
router.get(`${API_BASE}/Product/hierarchy/levels`, (_req, res) => {
  res.json([{ level: 1, name: 'Asset' }]);
});

// 4. GET /model — Datenmodell (Visitor + Dokumente + Ansprechpartner)
router.get(`${API_BASE}/model`, async (_req, res) => {
  try {
    const db = await getDb();

    // Static visitor properties
    const model: { id: string; name: string; type: number }[] = [
      { id: 'name', name: 'Name', type: 0 },
      { id: 'company', name: 'Firma', type: 0 },
      { id: 'position', name: 'Position', type: 0 },
      { id: 'email', name: 'E-Mail', type: 0 },
      { id: 'phone', name: 'Telefon', type: 0 },
      { id: 'website', name: 'Website', type: 0 },
      { id: 'address', name: 'Adresse', type: 0 },
      { id: 'notes', name: 'Notizen', type: 0 },
      { id: 'created_at', name: 'Erfasst am', type: 0 },
      { id: 'avatar', name: 'Avatar', type: 1 },
      { id: 'business_card', name: 'Visitenkarte', type: 1 },
    ];

    // Dynamic: documents as file properties
    const docs = resultToObjects(db.exec('SELECT id, name FROM documents WHERE active = 1 ORDER BY sort_order, name'));
    for (const doc of docs) {
      model.push({ id: `document_${doc.id}`, name: doc.name as string, type: 1 });
    }

    // Dynamic: contacts as property groups
    const contacts = resultToObjects(db.exec('SELECT id, name FROM contacts WHERE active = 1 ORDER BY sort_order, name'));
    for (let i = 0; i < contacts.length; i++) {
      const c = contacts[i];
      const prefix = `contact_${c.id}`;
      const label = `Ansprechpartner ${i + 1}`;
      model.push({ id: `${prefix}_name`, name: `${label} - Name`, type: 0 });
      model.push({ id: `${prefix}_company`, name: `${label} - Firma`, type: 0 });
      model.push({ id: `${prefix}_role`, name: `${label} - Rolle`, type: 0 });
      model.push({ id: `${prefix}_email`, name: `${label} - E-Mail`, type: 0 });
      model.push({ id: `${prefix}_phone`, name: `${label} - Telefon`, type: 0 });
      model.push({ id: `${prefix}_website`, name: `${label} - Website`, type: 0 });
      model.push({ id: `${prefix}_linkedin`, name: `${label} - LinkedIn`, type: 0 });
    }

    res.json(model);
  } catch (err) {
    console.error('API model error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 5. GET /Product/{itemId}/hierarchy — Wert "Avatar"
router.get(`${API_BASE}/Product/:itemId/hierarchy`, async (req, res) => {
  try {
    const db = await getDb();
    const result = db.exec('SELECT id FROM visitors WHERE id = ?', [req.params.itemId]);
    if (result.length === 0 || result[0].values.length === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    res.json([{ level: 1, name: 'Avatar' }]);
  } catch (err) {
    console.error('API Product hierarchy error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 6. POST /Product/{itemId}/values — Visitor-Daten als Properties
router.post(`${API_BASE}/Product/:itemId/values`, async (req, res) => {
  try {
    const db = await getDb();
    const itemId = req.params.itemId;

    // Check visitor exists
    const visitorResult = db.exec('SELECT * FROM visitors WHERE id = ?', [itemId]);
    if (visitorResult.length === 0 || visitorResult[0].values.length === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    const visitor = resultToObjects(visitorResult)[0];

    // Parse filter from body
    const body = req.body || {};
    const requestedIds = new Set<string>();
    let filterActive = false;

    if (body.propertiesWithLanguage?.propertyIds?.length > 0) {
      body.propertiesWithLanguage.propertyIds.forEach((id: string) => requestedIds.add(id));
      filterActive = true;
    }
    if (body.propertiesWithoutLanguage?.propertyIds?.length > 0) {
      body.propertiesWithoutLanguage.propertyIds.forEach((id: string) => requestedIds.add(id));
      filterActive = true;
    }

    const properties: {
      propertyId: string;
      value: string;
      valueLanguage: string;
      mimeType?: string;
      filename?: string;
      needsResolve: boolean;
    }[] = [];

    function addProp(id: string, value: string | null, opts?: { mimeType?: string; filename?: string; needsResolve?: boolean }) {
      if (filterActive && !requestedIds.has(id)) return;
      if (value === null || value === undefined) return;
      properties.push({
        propertyId: id,
        value: String(value),
        valueLanguage: 'en',
        ...(opts?.mimeType && { mimeType: opts.mimeType }),
        ...(opts?.filename && { filename: opts.filename }),
        needsResolve: opts?.needsResolve ?? false,
      });
    }

    // Visitor text properties
    addProp('name', visitor.name as string | null);
    addProp('company', visitor.company as string | null);
    addProp('position', visitor.position as string | null);
    addProp('email', visitor.email as string | null);
    addProp('phone', visitor.phone as string | null);
    addProp('website', visitor.website as string | null);
    addProp('address', visitor.address as string | null);
    addProp('notes', visitor.notes as string | null);
    addProp('created_at', visitor.created_at as string | null);

    // Avatar (file)
    const avatarPath = path.join('/data/storage/avatars', `${itemId}.png`);
    if (fs.existsSync(avatarPath)) {
      addProp('avatar', `avatar_${itemId}`, { mimeType: 'image/png', filename: 'avatar', needsResolve: true });
    }

    // Business card (file)
    const bcPath = path.join('/data/storage/business-cards', `${itemId}.jpg`);
    if (fs.existsSync(bcPath)) {
      addProp('business_card', `bc_${itemId}`, { mimeType: 'image/jpeg', filename: 'business_card', needsResolve: true });
    }

    // Assigned documents (files)
    const assignedDocs = resultToObjects(db.exec(
      `SELECT d.id, d.name, d.file_path FROM documents d
       JOIN visitor_documents vd ON d.id = vd.document_id
       WHERE vd.visitor_id = ?`, [itemId]
    ));
    for (const doc of assignedDocs) {
      const ext = path.extname(doc.file_path as string).toLowerCase();
      const mime = ext === '.pdf' ? 'application/pdf'
        : ext === '.docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        : ext === '.xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'application/octet-stream';
      addProp(`document_${doc.id}`, `doc_${doc.id}`, { mimeType: mime, filename: doc.name as string, needsResolve: true });
    }

    // Assigned contacts (text properties)
    const assignedContacts = resultToObjects(db.exec(
      `SELECT c.* FROM contacts c
       JOIN visitor_contacts vc ON c.id = vc.contact_id
       WHERE vc.visitor_id = ? ORDER BY c.sort_order, c.name`, [itemId]
    ));
    for (const c of assignedContacts) {
      const prefix = `contact_${c.id}`;
      addProp(`${prefix}_name`, c.name as string | null);
      addProp(`${prefix}_company`, c.company as string | null);
      addProp(`${prefix}_role`, c.role as string | null);
      addProp(`${prefix}_email`, c.email as string | null);
      addProp(`${prefix}_phone`, c.phone as string | null);
      addProp(`${prefix}_website`, c.website as string | null);
      addProp(`${prefix}_linkedin`, c.linkedin as string | null);
    }

    res.json(properties);
  } catch (err) {
    console.error('API Product values error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 7. POST /Product/{itemId}/documents — Dateien als Base64
router.post(`${API_BASE}/Product/:itemId/documents`, async (req, res) => {
  try {
    const db = await getDb();
    const itemId = req.params.itemId;

    // Check visitor exists
    const visitorResult = db.exec('SELECT id FROM visitors WHERE id = ?', [itemId]);
    if (visitorResult.length === 0 || visitorResult[0].values.length === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    const body = req.body || {};
    const requestedIds: string[] = body.propertyIds || [];
    const wantAll = requestedIds.length === 0;

    const results: {
      propertyId: string;
      value: string;
      filename: string;
      valueLanguage: string;
      needsResolve: boolean;
    }[] = [];

    function resolveFile(propertyId: string, filePath: string, filename: string) {
      if (!wantAll && !requestedIds.includes(propertyId)) return;
      if (!fs.existsSync(filePath)) return;
      const buffer = fs.readFileSync(filePath);
      results.push({
        propertyId,
        value: buffer.toString('base64'),
        filename,
        valueLanguage: 'en',
        needsResolve: false,
      });
    }

    // Avatar
    resolveFile('avatar', path.join('/data/storage/avatars', `${itemId}.png`), 'avatar');

    // Business card
    resolveFile('business_card', path.join('/data/storage/business-cards', `${itemId}.jpg`), 'business_card');

    // Assigned documents
    const assignedDocs = resultToObjects(db.exec(
      `SELECT d.id, d.name, d.file_path FROM documents d
       JOIN visitor_documents vd ON d.id = vd.document_id
       WHERE vd.visitor_id = ?`, [itemId]
    ));
    for (const doc of assignedDocs) {
      resolveFile(`document_${doc.id}`, doc.file_path as string, doc.name as string);
    }

    res.json(results);
  } catch (err) {
    console.error('API Product documents error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
