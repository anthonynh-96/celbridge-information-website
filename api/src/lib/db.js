import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '..', 'data');

async function ensureFile(name, fallback) {
  const file = path.join(dataDir, name);
  await fs.mkdir(dataDir, { recursive: true });
  try { await fs.access(file); }
  catch { await fs.writeFile(file, JSON.stringify(fallback, null, 2)); }
}

async function read(name, fallback) {
  await ensureFile(name, fallback);
  const raw = await fs.readFile(path.join(dataDir, name), 'utf-8');
  return JSON.parse(raw);
}

async function write(name, data) {
  await fs.writeFile(path.join(dataDir, name), JSON.stringify(data, null, 2));
}

export async function getUsers() { return read('users.json', []); }
export async function saveUsers(users) { return write('users.json', users); }

export async function getPosts() { return read('posts.json', []); }
export async function savePosts(posts) { return write('posts.json', posts); }
