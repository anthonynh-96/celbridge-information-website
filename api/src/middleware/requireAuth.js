import { verifyTokenFromCookies } from '../lib/auth.js';

export default function requireAuth(req, res, next) {
  const payload = verifyTokenFromCookies(req.headers.cookie || '');
  if (!payload) return res.status(401).json({ error: 'Unauthorized' });
  req.user = { id: payload.sub, email: payload.email, displayName: payload.displayName };
  next();
}
