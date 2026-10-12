#!/bin/sh
# Install and build every pack (each is its own Vite project).
set -e
ROOT=$(cd "$(dirname "$0")/.." && pwd)
for p in linear linear-ext linear-extended handcast casting collective; do
  echo "== $p"; (cd "$ROOT/packs/$p" && { [ -d node_modules ] || npm ci --no-audit --no-fund; } && npx vite build --logLevel error)
done
node "$ROOT/tools/extract-presets.mjs"
