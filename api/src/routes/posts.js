import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { getPosts, savePosts } from '../lib/db.js';
import requireAuth from '../middleware/requireAuth.js';

const router = Router();

// Public: list posts
router.get('/', async (_req, res) => {
  const posts = await getPosts();
  posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(posts);
});

// Public: get one
router.get('/:id', async (req, res) => {
  const posts = await getPosts();
  const post = posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'Not found' });
  res.json(post);
});

// Create (auth)
router.post('/', requireAuth, async (req, res) => {
  const { title, body } = req.body || {};
  if (!title || !body) return res.status(400).json({ error: 'Title and body required' });

  const now = new Date().toISOString();
  const posts = await getPosts();
  const post = { id: uuid(), authorId: req.user.id, title, body, createdAt: now, updatedAt: now };
  posts.push(post);
  await savePosts(posts);
  res.status(201).json(post);
});

// Update (auth & author)
router.put('/:id', requireAuth, async (req, res) => {
  const { title, body } = req.body || {};
  const posts = await getPosts();
  const idx = posts.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  if (posts[idx].authorId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  posts[idx] = {
    ...posts[idx],
    title: title ?? posts[idx].title,
    body: body ?? posts[idx].body,
    updatedAt: new Date().toISOString()
  };
  await savePosts(posts);
  res.json(posts[idx]);
});

// Delete (auth & author)
router.delete('/:id', requireAuth, async (req, res) => {
  const posts = await getPosts();
  const idx = posts.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  if (posts[idx].authorId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  const [removed] = posts.splice(idx, 1);
  await savePosts(posts);
  res.json(removed);
});

export default router;
