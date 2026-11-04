# /blog/ — 麻瓜的玄学笔记

A static blog at `suzhouhamster.com/blog/`, built from Markdown.

## The model

**Writing is private. Reading is public.**

Write-privacy is not something this tool implements — it's GitHub. Only you can
push to the repo, so only you can publish. There is no login, no admin page, and
nothing to attack, because publishing happens on your machine and travels over
your existing GitHub credentials.

Reading is open: posts are plain HTML that anyone can read, and search engines
are asked to stay away (`noindex` + `robots.txt`), but that's a request, not a
wall.

### Optional: locking individual posts

A post in `blog-src/private/` is encrypted at build time and needs a passphrase
to read. This is the exception, not the default — use it for something you want
online but not readable. If you later want proper accounts or cookie-based
access, that needs a server; GitHub Pages can't do it, and this encryption is
the closest a static host gets.

| | Folder | In git? | Who can read |
|---|---|---|---|
| Public post | `blog-src/posts/` | yes — drafts get history | everyone |
| Locked post | `blog-src/private/` | no, gitignored | anyone with the passphrase |

The **folder decides** visibility, not front matter. A `visibility:` line that
contradicts its folder aborts the build — otherwise one typo could commit a
private post as plaintext.

## Writing a post

Create `blog-src/posts/anything.md`:

```markdown
---
title: 读《宗教经验之种种》：从体验而非教义出发
date: 2026-11-03
tags: [宗教, 现象学]
book: 《宗教经验之种种》
author: William James
excerpt: 一句话摘要，显示在列表页。
---

正文从这里开始。
```

`title` and `date` (`YYYY-MM-DD`) are required; the rest are optional.
`book`/`author` render the reading-note citation header.

Markdown gets headings, **bold**, *italic*, blockquotes, lists, tables, code,
images, and footnotes (`[^1]` in the text, `[^1]: note` on its own line). No
length limit; three or more `##`/`###` headings generate a table of contents.

## Building and publishing

```sh
node tools/build-blog.mjs
git add blog/ blog-src/posts/ && git commit -m "blog: new post" && git push
```

With no locked posts, the build asks for nothing. GitHub Pages republishes in
about a minute.

### Flags

- `--check` — test a passphrase against the built site without rebuilding. Use
  this first if a password is being rejected; it reports the character count it
  read, which catches stray whitespace.
- `--rotate` — re-encrypt under a new passphrase. Required to change it.
- `--allow-weak` — permit a passphrase under 12 characters. Don't.

## The encryption, for locked posts only

AES-256-GCM, key from PBKDF2-HMAC-SHA256 at 600,000 rounds. One random salt per
build, one random IV per blob. The ciphertext covers the title, date, tags,
citation and body; the filename is `HMAC(slug-salt, name)` so the URL leaks
nothing either. `blog/keycheck.json` holds an encrypted sentinel so a mistyped
passphrase aborts the build instead of silently re-encrypting everything under
something you don't know.

The passphrase is the entire security: the ciphertext is public, so it can be
attacked offline with no rate limit. Four or more random words. There is no
recovery — `--rotate` needs the old one.

`blog-src/.slug-salt` is gitignored and fixes locked-post URLs. Losing it
changes those URLs; it does not affect readability.

## Copy-blocking

`blog.js` blocks selection, copy, cut, right-click, drag and ⌘C/X/A/S/P outside
form fields; CSS blocks printing.

**This is deterrence, not security.** View Source, devtools, `curl`, Reader Mode
and screenshots all defeat it instantly. It stops a casual reader lifting a
paragraph and nothing more. Since posts are public HTML, assume anything you
publish can be copied.

## Layout

```
tools/build-blog.mjs        the generator
tools/templates/blog.css    styles  -> blog/assets/blog.css
tools/templates/blog.js     client  -> blog/assets/blog.js
tools/vendor/marked.esm.js  Markdown renderer, pinned v14.1.3, MIT
blog-src/posts/*.md         public sources (committed)
blog-src/private/*.md       locked sources (gitignored)
blog/                       generated output — never edit by hand
```

Title, subtitle and footer are the `SITE` object at the top of
`tools/build-blog.mjs`.
