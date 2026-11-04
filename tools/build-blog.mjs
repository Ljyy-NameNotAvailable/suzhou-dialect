#!/usr/bin/env node
/**
 * build-blog.mjs — static generator for /blog/
 *
 * Reads Markdown from blog-src/posts/ (gitignored, never committed) and writes
 * a fully generated site into blog/ (committed, served by GitHub Pages).
 *
 * Posts are private by default: title, metadata and body are encrypted with
 * AES-256-GCM under a key derived from your passphrase via PBKDF2-SHA256.
 * Only ciphertext is ever written to blog/, so the public repo never contains
 * the plaintext of a private post.
 *
 * Usage:
 *   node tools/build-blog.mjs                 # prompts for passphrase
 *   BLOG_PASSPHRASE=... node tools/build-blog.mjs
 *   node tools/build-blog.mjs --rotate        # re-key to a new passphrase
 *   node tools/build-blog.mjs --allow-weak    # permit a short passphrase
 */

import { readFile, writeFile, readdir, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { marked } from './vendor/marked.esm.js';

// ---------------------------------------------------------------- site config

const SITE = {
  title: '麻瓜的玄学笔记',
  subtitle: '宗教、玄学，以及读经典时的笔记',
  // Shown in the footer. Set to '' to omit.
  footer: '',
  lang: 'zh-CN',
};

const PBKDF2_ITER = 600000;          // OWASP guidance for PBKDF2-HMAC-SHA256
const KEYCHECK_SENTINEL = 'blog-keycheck-v1';
const MIN_PASSPHRASE = 12;

// ------------------------------------------------------------------ locations

const HERE = import.meta.dirname;
const ROOT = path.resolve(HERE, '..');
const PUB_DIR = path.join(ROOT, 'blog-src', 'posts');     // committed, public
const PRIV_DIR = path.join(ROOT, 'blog-src', 'private');  // gitignored, encrypted
const OUT_DIR = path.join(ROOT, 'blog');
const TPL_DIR = path.join(HERE, 'templates');
const SALT_FILE = path.join(ROOT, 'blog-src', '.slug-salt');
const KEYCHECK = path.join(OUT_DIR, 'keycheck.json');

const argv = new Set(process.argv.slice(2));
const ROTATE = argv.has('--rotate');
const ALLOW_WEAK = argv.has('--allow-weak');
const CHECK = argv.has('--check');

// ---------------------------------------------------------------- small utils

const b64 = (buf) => Buffer.from(buf).toString('base64');
const unb64 = (s) => Buffer.from(s, 'base64');

function esc(s = '') {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function die(msg) {
  console.error(`\n  build-blog: ${msg}\n`);
  process.exit(1);
}

function fmtDate(iso) {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
  }).format(d);
}

// ------------------------------------------------------------------- passhrase

async function promptHidden(label) {
  if (!process.stdin.isTTY) {
    die('no TTY for the passphrase prompt. Set BLOG_PASSPHRASE instead.');
  }
  process.stdout.write(label);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding('utf8');

  return new Promise((resolve) => {
    let acc = '';
    const finish = () => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.removeListener('data', onData);
      process.stdout.write('\n');
      // Strip stray control characters: a pasted passphrase can carry its own
      // newline, and a trailing \r silently breaks every later unlock.
      resolve(acc.replace(/[\u0000-\u001f\u007f]/g, ''));
    };

    // stdin delivers CHUNKS, not keypresses. Pasting hands us the whole
    // passphrase (often with its newline) in one event, so walk it per
    // character or the newline ends up inside the passphrase.
    const onData = (chunk) => {
      for (const ch of String(chunk)) {
        if (ch === '\r' || ch === '\n' || ch === '\u0004') { finish(); return; }
        if (ch === '\u0003') {                      // ctrl-c
          process.stdin.setRawMode(false);
          process.stdout.write('\n');
          process.exit(130);
        }
        if (ch === '\u007f' || ch === '\b') { acc = acc.slice(0, -1); continue; }
        acc += ch;
      }
    };
    process.stdin.on('data', onData);
  });
}

function deriveKey(passphrase, salt, iter = PBKDF2_ITER) {
  return crypto.pbkdf2Sync(Buffer.from(passphrase, 'utf8'), salt, iter, 32, 'sha256');
}

/**
 * One salt per build, so the browser derives the key once per session and can
 * cache it across pages. Each blob still gets a fresh random IV, which is what
 * actually has to be unique for AES-GCM.
 */
function encrypt(plaintext, key, salt) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([cipher.update(Buffer.from(plaintext, 'utf8')), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    v: 1,
    kdf: { name: 'PBKDF2', hash: 'SHA-256', iter: PBKDF2_ITER, salt: b64(salt) },
    iv: b64(iv),
    // WebCrypto expects the GCM tag appended to the ciphertext
    ct: b64(Buffer.concat([ct, tag])),
  };
}

function decrypt(blob, passphrase) {
  const salt = unb64(blob.kdf.salt);
  const iv = unb64(blob.iv);
  const all = unb64(blob.ct);
  const ct = all.subarray(0, all.length - 16);
  const tag = all.subarray(all.length - 16);
  const key = deriveKey(passphrase, salt, blob.kdf.iter);
  const d = crypto.createDecipheriv('aes-256-gcm', key, iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(ct), d.final()]).toString('utf8');
}

// ---------------------------------------------------------- markdown pipeline

marked.setOptions({ gfm: true, breaks: false, mangle: false, headerIds: false });

/** Pull `---` front matter off the top of a document. */
function parseFrontMatter(raw) {
  const text = raw.replace(/^﻿/, '');
  if (!text.startsWith('---')) return { meta: {}, body: text };
  const end = text.indexOf('\n---', 3);
  if (end === -1) return { meta: {}, body: text };
  const head = text.slice(text.indexOf('\n') + 1, end);
  const body = text.slice(text.indexOf('\n', end + 1) + 1);
  const meta = {};
  for (const line of head.split('\n')) {
    const m = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/);
    if (!m) continue;
    let [, k, v] = m;
    v = v.trim().replace(/^["'](.*)["']$/, '$1');
    if (k === 'tags') {
      meta.tags = v.replace(/^\[|\]$/g, '').split(',').map((t) => t.trim()).filter(Boolean);
    } else {
      meta[k] = v;
    }
  }
  return { meta, body };
}

/**
 * Footnotes: `[^id]` in the text, `[^id]: note` on its own line.
 * marked has no native footnote support, so refs become inline HTML before
 * rendering and the collected notes are appended afterwards.
 */
function extractFootnotes(body) {
  const defs = new Map();
  const stripped = body.replace(/^\[\^([^\]]+)\]:[ \t]*(.+(?:\n[ \t]+.+)*)$/gm, (_, id, text) => {
    defs.set(id.trim(), text.replace(/\n[ \t]+/g, ' ').trim());
    return '';
  });
  if (defs.size === 0) return { body: stripped, notesHtml: '' };

  const order = [];
  const withRefs = stripped.replace(/\[\^([^\]]+)\]/g, (whole, rawId) => {
    const id = rawId.trim();
    if (!defs.has(id)) return whole;
    if (!order.includes(id)) order.push(id);
    const n = order.indexOf(id) + 1;
    return `<sup class="fn-ref" id="fnref-${esc(id)}"><a href="#fn-${esc(id)}">${n}</a></sup>`;
  });

  const items = order.map((id, i) => {
    const inner = marked.parseInline(defs.get(id));
    return `<li id="fn-${esc(id)}"><span class="fn-num">${i + 1}</span>`
      + `<div class="fn-body">${inner} <a class="fn-back" href="#fnref-${esc(id)}" `
      + `aria-label="返回正文">↩</a></div></li>`;
  }).join('\n');

  return {
    body: withRefs,
    notesHtml: `<section class="footnotes" aria-labelledby="fn-h">`
      + `<h2 id="fn-h">注释</h2><ol>${items}</ol></section>`,
  };
}

/** Give h2/h3 stable ids and return a table of contents. */
function addHeadingIds(html) {
  const headings = [];
  let i = 0;
  const out = html.replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (_, level, inner) => {
    i += 1;
    const id = `sec-${i}`;
    const text = inner.replace(/<[^>]+>/g, '').trim();
    headings.push({ id, level: Number(level), text });
    return `<h${level} id="${id}">`
      + `<a class="anchor" href="#${id}" aria-hidden="true" tabindex="-1">#</a>`
      + `${inner}</h${level}>`;
  });
  return { html: out, headings };
}

function renderMarkdown(body) {
  const { body: withRefs, notesHtml } = extractFootnotes(body);
  const raw = marked.parse(withRefs);
  const { html, headings } = addHeadingIds(raw);
  return { html: html + notesHtml, headings };
}

// --------------------------------------------------------------------- slugs

async function slugSalt() {
  if (existsSync(SALT_FILE)) return (await readFile(SALT_FILE, 'utf8')).trim();
  const s = crypto.randomBytes(16).toString('hex');
  await writeFile(SALT_FILE, `${s}\n`, 'utf8');
  console.log('  created blog-src/.slug-salt (keep it: it fixes private post URLs)');
  return s;
}

/** Public posts keep a readable slug; private posts get an opaque one so the
 *  filename itself leaks nothing about the subject. */
function publicSlug(name) {
  return name.replace(/\.md$/i, '')
    .toLowerCase().replace(/[^\w一-鿿-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'post';
}

function privateSlug(name, salt) {
  return crypto.createHmac('sha256', salt)
    .update(name.replace(/\.md$/i, '')).digest('hex').slice(0, 16);
}

// ------------------------------------------------------------------- loading

async function readPostDir(dir, visibility, salt, posts) {
  if (!existsSync(dir)) return;
  const files = (await readdir(dir)).filter((f) => /\.md$/i.test(f) && !f.startsWith('.'));

  for (const file of files.sort()) {
    const rel = path.relative(ROOT, path.join(dir, file));
    const raw = await readFile(path.join(dir, file), 'utf8');
    const { meta, body } = parseFrontMatter(raw);
    if (!meta.title) die(`${rel} has no "title:" in its front matter`);
    if (!meta.date) die(`${rel} has no "date:" in its front matter`);

    // The folder is authoritative. A front-matter claim that disagrees is a
    // typo away from committing a private post as plaintext, so refuse it.
    if (meta.visibility && meta.visibility.toLowerCase() !== visibility) {
      die(`${rel} says "visibility: ${meta.visibility}", but it lives in a `
        + `${visibility} folder.\n`
        + '  The folder decides, so that a typo can never publish a private post:\n'
        + '      blog-src/posts/    public, committed to git\n'
        + '      blog-src/private/  encrypted, never committed\n'
        + '  Move the file, or drop the visibility line.');
    }

    const { html, headings } = renderMarkdown(body);
    posts.push({
      file,
      slug: visibility === 'private' ? privateSlug(file, salt) : publicSlug(file),
      title: meta.title,
      date: meta.date,
      tags: meta.tags || [],
      book: meta.book || '',
      author: meta.author || '',
      excerpt: meta.excerpt || '',
      visibility,
      html,
      headings,
      words: body.replace(/\s+/g, '').length,
    });
  }
}

async function loadPosts(salt) {
  const posts = [];
  await readPostDir(PUB_DIR, 'public', salt, posts);
  await readPostDir(PRIV_DIR, 'private', salt, posts);
  if (posts.length === 0) {
    die(`no .md files in ${path.relative(ROOT, PUB_DIR)} or `
      + `${path.relative(ROOT, PRIV_DIR)}`);
  }
  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

// ------------------------------------------------------------------ templates

function tocHtml(headings) {
  if (headings.length < 3) return '';
  const items = headings.map((h) => (
    `<li class="toc-l${h.level}"><a href="#${h.id}">${esc(h.text)}</a></li>`
  )).join('');
  return `<nav class="toc" aria-label="目录"><div class="toc-h">目录</div><ol>${items}</ol></nav>`;
}

function citationHtml(post) {
  if (!post.book) return '';
  const who = post.author ? `<span class="cite-author">${esc(post.author)}</span>` : '';
  return `<div class="citation"><span class="cite-label">读书笔记</span>`
    + `<span class="cite-book">${esc(post.book)}</span>${who}</div>`;
}

function shell({ title, lang, head = '', body, cls = '' }) {
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex">
<meta name="referrer" content="no-referrer">
<title>${esc(title)}</title>
<link rel="stylesheet" href="/blog/assets/blog.css">
${head}
</head>
<body class="${cls}">
${body}
<script src="/blog/assets/blog.js" defer></script>
</body>
</html>
`;
}

function siteHeader(isPost) {
  const home = isPost
    ? '<a class="back" href="/blog/">← 全部文章</a>'
    : '';
  return `<header class="site-head">
  ${home}
  <h1 class="site-title"><a href="/blog/">${esc(SITE.title)}</a></h1>
  ${isPost ? '' : `<p class="site-sub">${esc(SITE.subtitle)}</p>`}
</header>`;
}

function siteFooter() {
  const note = SITE.footer ? `<p>${esc(SITE.footer)}</p>` : '';
  return `<footer class="site-foot">${note}</footer>`;
}

function unlockForm(kind) {
  return `<form class="unlock" data-unlock="${kind}" autocomplete="off">
  <div class="lock-icon" aria-hidden="true">
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor"
         stroke-width="1.6" stroke-linecap="round">
      <rect x="4.5" y="10.5" width="15" height="10" rx="2"></rect>
      <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"></path>
    </svg>
  </div>
  <label class="unlock-label" for="pp-${kind}">需要密码</label>
  <div class="unlock-row">
    <input id="pp-${kind}" class="unlock-input" type="password" name="passphrase"
           autocomplete="current-password" spellcheck="false" placeholder="密码">
    <button class="unlock-btn" type="submit">解锁</button>
  </div>
  <label class="unlock-remember">
    <input type="checkbox" class="unlock-keep" checked>
    <span>在本标签页内保持解锁</span>
  </label>
  <p class="unlock-msg" role="status" aria-live="polite"></p>
</form>`;
}

function postPage(post, key, salt) {
  const meta = `<div class="post-meta"><time datetime="${esc(post.date)}">${esc(fmtDate(post.date))}</time>`
    + (post.tags.length ? `<span class="tags">${post.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</span>` : '')
    + `</div>`;

  if (post.visibility === 'public') {
    const article = `<article class="post">
  <h1 class="post-title">${esc(post.title)}</h1>
  ${meta}
  ${citationHtml(post)}
  ${tocHtml(post.headings)}
  <div class="prose protected">${post.html}</div>
</article>`;
    return shell({
      title: `${post.title} · ${SITE.title}`,
      lang: SITE.lang,
      body: `<div class="wrap">${siteHeader(true)}<main>${article}</main>${siteFooter()}</div>`,
    });
  }

  // Private: everything the reader would care about goes inside the ciphertext.
  const payload = JSON.stringify({
    title: post.title,
    date: post.date,
    dateLabel: fmtDate(post.date),
    tags: post.tags,
    citation: citationHtml(post),
    toc: tocHtml(post.headings),
    html: post.html,
  });
  const blob = encrypt(payload, key, salt);

  const body = `<div class="wrap">
${siteHeader(true)}
<main>
  <article class="post locked" id="post">
    <div class="locked-pane">
      <h1 class="post-title muted">已加密的文章</h1>
      <p class="locked-note">这篇文章以 AES-256-GCM 加密存储，输入密码后在本地解密。</p>
      ${unlockForm('post')}
    </div>
    <div class="unlocked-pane" hidden></div>
  </article>
</main>
${siteFooter()}
</div>
<script type="application/json" id="cipher">${JSON.stringify(blob)}</script>`;

  return shell({ title: `🔒 · ${SITE.title}`, lang: SITE.lang, body, cls: 'is-locked' });
}

function indexPage(posts, key, salt) {
  const pub = posts.filter((p) => p.visibility === 'public');
  const priv = posts.filter((p) => p.visibility === 'private');

  const pubList = pub.length ? `<ul class="post-list">${pub.map((p) => `
    <li class="post-item">
      <a class="post-link" href="/blog/posts/${p.slug}.html">
        <span class="post-item-title">${esc(p.title)}</span>
        ${p.book ? `<span class="post-item-book">${esc(p.book)}</span>` : ''}
      </a>
      <time datetime="${esc(p.date)}">${esc(fmtDate(p.date))}</time>
      ${p.excerpt ? `<p class="post-item-excerpt">${esc(p.excerpt)}</p>` : ''}
    </li>`).join('')}</ul>` : '';

  const manifest = priv.map((p) => ({
    slug: p.slug,
    title: p.title,
    date: p.date,
    dateLabel: fmtDate(p.date),
    tags: p.tags,
    book: p.book,
    excerpt: p.excerpt,
  }));

  const lockedSection = priv.length ? `<section class="locked-section">
  <div class="locked-head">
    <h2>私密文章</h2>
    <span class="locked-count">${priv.length} 篇</span>
  </div>
  ${unlockForm('index')}
  <ul class="post-list" id="private-list" hidden></ul>
</section>` : '';

  const blob = priv.length ? encrypt(JSON.stringify(manifest), key, salt) : null;

  const body = `<div class="wrap">
${siteHeader(false)}
<main>
  ${pubList}
  ${lockedSection}
</main>
${siteFooter()}
</div>
${blob ? `<script type="application/json" id="cipher">${JSON.stringify(blob)}</script>` : ''}`;

  return shell({ title: SITE.title, lang: SITE.lang, body });
}

// ----------------------------------------------------------------- key check

async function verifyPassphrase(passphrase) {
  if (!existsSync(KEYCHECK)) return;
  let blob;
  try {
    blob = JSON.parse(await readFile(KEYCHECK, 'utf8'));
  } catch {
    return;
  }
  if (ROTATE) return;
  let ok = false;
  try {
    ok = decrypt(blob, passphrase) === KEYCHECK_SENTINEL;
  } catch {
    ok = false;
  }
  if (!ok) {
    die('that passphrase does not match the one previous builds used.\n'
      + '  Existing posts were encrypted with the old passphrase, so mixing them\n'
      + '  would leave half the blog unreadable.\n\n'
      + '  Re-run with the right passphrase, or re-key everything with:\n'
      + '      node tools/build-blog.mjs --rotate');
  }
}

// ---------------------------------------------------------------------- build

/** Test a passphrase against the built site without rebuilding anything. */
async function checkPassphrase() {
  if (!existsSync(KEYCHECK)) {
    die('no blog/keycheck.json to test against. It is only written when the\n'
      + '  site has private posts, so build once first.');
  }
  const blob = JSON.parse(await readFile(KEYCHECK, 'utf8'));
  const pp = process.env.BLOG_PASSPHRASE || await promptHidden('  Passphrase to test: ');
  let ok = false;
  try { ok = decrypt(blob, pp) === KEYCHECK_SENTINEL; } catch { ok = false; }

  if (ok) {
    console.log('\n  match: this unlocks the current blog/.\n');
  } else {
    console.log(`\n  NO match against the current blog/.`);
    console.log(`  (read ${pp.length} characters)\n`);
    process.exitCode = 1;
  }
}

async function main() {
  if (CHECK) return checkPassphrase();
  const salt = await slugSalt();
  const posts = await loadPosts(salt);
  const priv = posts.filter((p) => p.visibility === 'private');

  let passphrase = process.env.BLOG_PASSPHRASE || '';
  if (priv.length && !passphrase) passphrase = await promptHidden('  Passphrase: ');

  if (priv.length) {
    if (!passphrase) die('a passphrase is required to encrypt private posts.');
    if (passphrase.length < MIN_PASSPHRASE && !ALLOW_WEAK) {
      die(`passphrase is ${passphrase.length} characters; ${MIN_PASSPHRASE} is the minimum.\n`
        + '  A short passphrase is the weakest link here: the ciphertext is public,\n'
        + '  so anyone can attack it offline, as fast as their hardware allows.\n'
        + '  Use a long passphrase (four or more random words), or pass --allow-weak.');
    }
    await verifyPassphrase(passphrase);
  }

  const siteSalt = crypto.randomBytes(16);
  const siteKey = priv.length ? deriveKey(passphrase, siteSalt) : null;

  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(path.join(OUT_DIR, 'posts'), { recursive: true });
  await mkdir(path.join(OUT_DIR, 'assets'), { recursive: true });

  for (const name of ['blog.css', 'blog.js']) {
    await writeFile(path.join(OUT_DIR, 'assets', name),
      await readFile(path.join(TPL_DIR, name), 'utf8'), 'utf8');
  }

  for (const post of posts) {
    await writeFile(path.join(OUT_DIR, 'posts', `${post.slug}.html`),
      postPage(post, siteKey, siteSalt), 'utf8');
  }
  await writeFile(path.join(OUT_DIR, 'index.html'), indexPage(posts, siteKey, siteSalt), 'utf8');

  if (priv.length) {
    await writeFile(KEYCHECK,
      JSON.stringify(encrypt(KEYCHECK_SENTINEL, siteKey, siteSalt)), 'utf8');
  }

  console.log(`\n  built ${posts.length} post(s) → blog/`);
  for (const p of posts) {
    const mark = p.visibility === 'private' ? 'encrypted' : '  public ';
    console.log(`    ${mark}  ${p.date}  ${p.title}  (${p.words} chars)  /blog/posts/${p.slug}.html`);
  }
  console.log('');
}

main().catch((err) => die(err.stack || String(err)));
