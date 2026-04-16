import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { getDb } from './db/index.js';
import { authRouter, requireAuth } from './middleware/auth.js';
import captureRouter from './routes/capture.js';
import adminRouter from './routes/admin.js';
import apiRouter from './routes/api.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
const PORT = process.env.PORT || 3000;

// Ensure storage directories exist
const storageDirs = [
  '/data/db',
  '/data/storage/avatars',
  '/data/storage/business-cards',
  '/data/storage/documents',
];
for (const dir of storageDirs) {
  fs.mkdirSync(dir, { recursive: true });
}

// Initialize database
await getDb();

const app = express();

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Health check (no auth)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Static file serving for uploaded storage files (no auth — loaded via <img> tags)
app.use('/api/storage', express.static('/data/storage'));

// Connector API (no auth — public for external systems)
app.use(apiRouter);

// Auth routes (login, logout, me — no auth required)
app.use(authRouter);

// All routes below require auth
app.use('/api', requireAuth);

// Capture workflow routes
app.use(captureRouter);

// Admin routes
app.use(adminRouter);

// In production, serve the built client
const clientDist = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Interner Serverfehler' });
});

// Process-level error handlers
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

app.listen(PORT, () => {
  console.log(`NeoPass server running on port ${PORT}`);
});
