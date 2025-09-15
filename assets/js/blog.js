<!-- assets/js/blog.js -->
<script type="module">
import { api, me, logout } from './auth.js';

const who = document.querySelector('[data-who]');
const newPost = document.querySelector('[data-new-post]');
const form = document.querySelector('#createPost');
const list = document.querySelector('#postList');
const logoutBtn = document.querySelector('[data-logout]');

init();

async function init() {
  const user = await me();
  if (!user) { location.href = '/login.html'; return; }
  who.textContent = `Signed in as ${user.displayName}`;
  newPost.hidden = false;
  await renderPosts();
}

async function renderPosts() {
  const posts = await api('/api/posts', { method: 'GET' });
  list.innerHTML = posts.map(p => `
    <article class="card post" data-id="${p.id}">
      <header class="post__head">
        <h3 class="post__title">${escapeHTML(p.title)}</h3>
        <small class="post__meta">${new Date(p.createdAt).toLocaleString()}</small>
      </header>
      <div class="post__body">${escapeHTML(p.body).replace(/\n/g,'<br>')}</div>
      <footer class="post__actions">
        <button class="btn btn--secondary edit">Edit</button>
        <button class="btn btn--danger del">Delete</button>
      </footer>
    </article>
  `).join('');
}

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(form);
  const payload = Object.fromEntries(fd.entries());
  try {
    await api('/api/posts', { method:'POST', body: JSON.stringify(payload) });
    form.reset();
    await renderPosts();
  } catch (err) {
    alert(err.message);
  }
});

list?.addEventListener('click', async (e) => {
  const card = e.target.closest('.post'); if (!card) return;
  const id = card.dataset.id;

  if (e.target.classList.contains('del')) {
    if (!confirm('Delete this post?')) return;
    try { await api(`/api/posts/${id}`, { method:'DELETE' }); card.remove(); }
    catch (err) { alert(err.message); }
  }

  if (e.target.classList.contains('edit')) {
    const title = prompt('New title:', card.querySelector('.post__title').textContent);
    if (title == null) return;
    const body = prompt('New body:', card.querySelector('.post__body').textContent);
    if (body == null) return;
    try { await api(`/api/posts/${id}`, { method:'PUT', body: JSON.stringify({ title, body }) }); await renderPosts(); }
    catch (err) { alert(err.message); }
  }
});

logoutBtn?.addEventListener('click', logout);

function escapeHTML(s=''){ return s.replace(/[&<>"']/g,m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }
</script>
