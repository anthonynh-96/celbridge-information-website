import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { getUsers, saveUsers } from '../lib/db.js';
import { hashPassword, comparePassword, signCookie, clearCookie } from '../lib/auth.js';

const router = Router();

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { email, password, displayName } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const users = await getUsers();
  if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const passwordHash = await hashPassword(password);
  const user = {
    id: uuid(),
    email,
    displayName: displayName || email.split('@')[0],
    passwordHash,
    createdAt: new Date().toISOString()
  };
  users.push(user);
  await saveUsers(users);

  const cookie = signCookie(user);
  res.setHeader('Set-Cookie', cookie.value);
  res.status(201).json({ id: user.id, email: user.email, displayName: user.displayName });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const users = await getUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const ok = await comparePassword(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  const cookie = signCookie(user);
  res.setHeader('Set-Cookie', cookie.value);
  res.json({ id: user.id, email: user.email, displayName: user.displayName });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  // simple decode without strict 401
  const cookie = req.headers.cookie || '';
  const payload = require('../lib/auth.js').verifyTokenFromCookies(cookie);
  if (!payload) return res.status(200).json({ user: null });
  res.json({ user: { id: payload.sub, email: payload.email, displayName: payload.displayName } });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  const cleared = clearCookie();
  res.setHeader('Set-Cookie', cleared.value);
  res.json({ ok: true });
});

export default router;
