#!/bin/sh
# Build the blog and publish it in one step.
#
#   ./tools/publish.sh                 -> commits as "blog: update"
#   ./tools/publish.sh "新文章：论宗教"  -> uses your message
#
set -eu
cd "$(dirname "$0")/.."

node tools/build-blog.mjs

# Staging is deliberately narrow. `git add -u` only touches files git already
# tracks, so nothing loose in the repo root can ever be swept into this public
# repo; the second line picks up genuinely new posts and generated pages.
git add -u
git add blog blog-src 2>/dev/null || true

if git diff --cached --quiet; then
  echo "  nothing to publish — no changes since the last push"
  exit 0
fi

echo ""
echo "  about to publish:"
git diff --cached --name-status | sed 's/^/    /'
echo ""

git commit -q -m "${1:-blog: update}"
git push -q origin main
echo "  pushed. live in about a minute:"
echo "    https://suzhouhamster.com/blog/"
