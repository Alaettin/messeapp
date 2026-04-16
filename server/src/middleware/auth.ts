import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

interface Session {
  username: string;
  createdAt: number;
}

const SESSION_TTL = 24 * 60 * 60 * 1000; // 24h
const sessions = new Map<string, Session>();

// Parse APP_USER_* from env
function getUsers(): Map<string, string> {
  const users = new Map<string, string>();
  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith('APP_USER_') && value) {
      const sep = value.indexOf(':');
      if (sep > 0) {
        users.set(value.substring(0, sep), value.substring(sep + 1));
      }
    }
  }
  return users;
}

// Cleanup expired sessions
function cleanupSessions() {
  const now = Date.now();
  for (const [token, session] of sessions) {
    if (now - session.createdAt > SESSION_TTL) {
      sessions.delete(token);
    }
  }
}

// Auth middleware — rejects if no valid token
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Nicht authentifiziert' });
    return;
  }

  const token = header.substring(7);
  const session = sessions.get(token);

  if (!session || Date.now() - session.createdAt > SESSION_TTL) {
    sessions.delete(token);
    res.status(401).json({ error: 'Sitzung abgelaufen' });
    return;
  }

  next();
}

// Auth routes (login, logout, me)
export const authRouter = Router();

authRouter.post('/api/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'Username und Passwort erforderlich' });
    return;
  }

  const users = getUsers();
  const expected = users.get(username);

  if (!expected || expected !== password) {
    res.status(401).json({ error: 'Ungültige Anmeldedaten' });
    return;
  }

  cleanupSessions();

  const token = crypto.randomUUID();
  sessions.set(token, { username, createdAt: Date.now() });

  res.json({ token, username });
});

authRouter.post('/api/logout', (req: Request, res: Response) => {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    sessions.delete(header.substring(7));
  }
  res.json({ success: true });
});

authRouter.get('/api/me', (req: Request, res: Response) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Nicht authentifiziert' });
    return;
  }

  const session = sessions.get(header.substring(7));
  if (!session || Date.now() - session.createdAt > SESSION_TTL) {
    res.status(401).json({ error: 'Sitzung abgelaufen' });
    return;
  }

  res.json({ username: session.username });
});
