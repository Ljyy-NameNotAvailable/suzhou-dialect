/* blog.js — generated into /blog/assets/. Edit tools/templates/blog.js.
 *
 * Two unrelated jobs:
 *   1. decrypt() — real protection. AES-256-GCM over a PBKDF2-SHA256 key.
 *      The page ships ciphertext only; plaintext exists in this tab's memory.
 *   2. deterrence() — not protection. Blocks selection, copy and right-click
 *      for a casual reader. Anyone who opens devtools walks straight past it.
 */
(() => {
  'use strict';

  const CACHE_KEY = 'blog.sessionKey';
  const enc = new TextEncoder();
  const dec = new TextDecoder();

  const toBytes = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const toB64 = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes)));

  // ------------------------------------------------------------------ crypto

  async function deriveKey(passphrase, saltB64, iter) {
    const base = await crypto.subtle.importKey(
      'raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey'],
    );
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: toBytes(saltB64), iterations: iter, hash: 'SHA-256' },
      base,
      { name: 'AES-GCM', length: 256 },
      true,                            // extractable, so it can be cached per tab
      ['decrypt'],
    );
  }

  async function decryptBlob(blob, key) {
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: toBytes(blob.iv) }, key, toBytes(blob.ct),
    );
    return dec.decode(plain);
  }

  async function cacheKey(key, saltB64) {
    try {
      const raw = await crypto.subtle.exportKey('raw', key);
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ salt: saltB64, k: toB64(raw) }));
    } catch { /* private mode, blocked storage — unlocking still works */ }
  }

  async function cachedKey(saltB64) {
    try {
      const hit = JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null');
      if (!hit || hit.salt !== saltB64) return null;   // stale: site was rebuilt
      return await crypto.subtle.importKey(
        'raw', toBytes(hit.k), { name: 'AES-GCM', length: 256 }, true, ['decrypt'],
      );
    } catch {
      return null;
    }
  }

  function dropCachedKey() {
    try { sessionStorage.removeItem(CACHE_KEY); } catch { /* ignore */ }
  }

  // ----------------------------------------------------------------- render

  function renderPost(data) {
    const article = document.getElementById('post');
    const pane = article.querySelector('.unlocked-pane');
    const tags = (data.tags || []).map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join('');

    pane.innerHTML = `
      <h1 class="post-title">${escapeHtml(data.title)}</h1>
      <div class="post-meta">
        <time datetime="${escapeHtml(data.date)}">${escapeHtml(data.dateLabel)}</time>
        ${tags ? `<span class="tags">${tags}</span>` : ''}
      </div>
      ${data.citation || ''}
      ${data.toc || ''}
      <div class="prose protected">${data.html}</div>`;

    article.querySelector('.locked-pane').hidden = true;
    pane.hidden = false;
    article.classList.remove('locked');
    document.title = `${data.title} · ${document.title.replace(/^🔒 · /, '')}`;
    document.body.classList.remove('is-locked');

    // Jump to a #hash now that its target exists.
    if (location.hash) {
      const target = document.getElementById(location.hash.slice(1));
      if (target) target.scrollIntoView();
    }
  }

  function renderIndex(items) {
    const list = document.getElementById('private-list');
    list.innerHTML = items.map((p) => `
      <li class="post-item">
        <a class="post-link" href="/blog/posts/${encodeURIComponent(p.slug)}.html">
          <span class="post-item-title">${escapeHtml(p.title)}</span>
          ${p.book ? `<span class="post-item-book">${escapeHtml(p.book)}</span>` : ''}
        </a>
        <time datetime="${escapeHtml(p.date)}">${escapeHtml(p.dateLabel)}</time>
        ${p.excerpt ? `<p class="post-item-excerpt">${escapeHtml(p.excerpt)}</p>` : ''}
      </li>`).join('');
    list.hidden = false;
    document.querySelector('.locked-section .unlock').hidden = true;
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // ----------------------------------------------------------------- unlock

  function setupUnlock() {
    const holder = document.getElementById('cipher');
    const form = document.querySelector('[data-unlock]');
    if (!holder || !form) return;

    const blob = JSON.parse(holder.textContent);
    const kind = form.dataset.unlock;
    const input = form.querySelector('.unlock-input');
    const button = form.querySelector('.unlock-btn');
    const keep = form.querySelector('.unlock-keep');
    const msg = form.querySelector('.unlock-msg');

    const show = (text, state) => {
      msg.textContent = text;
      if (state) msg.dataset.state = state; else delete msg.dataset.state;
    };

    const paint = (text) => {
      const data = JSON.parse(text);
      if (kind === 'post') renderPost(data); else renderIndex(data);
    };

    if (!window.crypto || !crypto.subtle) {
      show('此浏览器无法解密（需要 HTTPS 环境下的 Web Crypto）。', 'error');
      button.disabled = true;
      return;
    }

    // Already unlocked in this tab? Go straight through.
    cachedKey(blob.kdf.salt).then(async (key) => {
      if (!key) return;
      try {
        paint(await decryptBlob(blob, key));
      } catch {
        dropCachedKey();
      }
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const passphrase = input.value;
      if (!passphrase) return;

      button.disabled = true;
      show('解密中…');

      // Yield a frame so the button's disabled state paints before PBKDF2 blocks.
      await new Promise((r) => requestAnimationFrame(r));

      try {
        const key = await deriveKey(passphrase, blob.kdf.salt, blob.kdf.iter);
        const text = await decryptBlob(blob, key);     // throws if the tag fails
        if (keep && keep.checked) await cacheKey(key, blob.kdf.salt);
        input.value = '';
        show('');
        paint(text);
      } catch {
        show('密码不正确。', 'error');
        input.select();
      } finally {
        button.disabled = false;
      }
    });

    input.focus({ preventScroll: true });
  }

  // ------------------------------------------------------------- deterrence

  function setupDeterrence() {
    const editable = (node) => {
      const el = node instanceof Element ? node : node && node.parentElement;
      return !!(el && el.closest('input, textarea, [contenteditable="true"], .unlock'));
    };

    for (const type of ['copy', 'cut', 'contextmenu', 'dragstart', 'selectstart']) {
      document.addEventListener(type, (event) => {
        if (editable(event.target)) return;
        event.preventDefault();
      });
    }

    document.addEventListener('keydown', (event) => {
      if (!(event.metaKey || event.ctrlKey)) return;
      if (editable(event.target)) return;
      if (['c', 'x', 'a', 's', 'p'].includes(event.key.toLowerCase())) {
        event.preventDefault();
      }
    });
  }

  // -------------------------------------------------------------------- init

  setupDeterrence();
  setupUnlock();
})();
