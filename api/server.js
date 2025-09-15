import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './src/routes/auth.js';
import postRoutes from './src/routes/posts.js';

// Resolve paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');

// Load .env explicitly from the api folder
dotenv.config({ path: path.join(__dirname, '.env') });

// Fail fast if secret missing
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'dev_only_secret_change_me';
  console.warn('[auth] Using DEV fallback JWT secret. Set JWT_SECRET in .env for production.');
}

const PORT = parseInt(process.env.PORT || '5174', 10);
const ORIGIN = process.env.ORIGIN || `http://localhost:${PORT}`;

const app = express();

// Middleware
app.use(cors({ origin: ORIGIN, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// API
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);

// Static site
app.use('/assets', express.static(path.join(ROOT, 'assets')));
app.use('/images', express.static(path.join(ROOT, 'images')));
app.use(express.static(ROOT)); // serves index.html, signup.html, etc.

// API 404 + error handler
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Server error' });
});

// Start
app.listen(PORT, () => {
  console.log(`✅ Celbridge API running on http://localhost:${PORT}`);
});