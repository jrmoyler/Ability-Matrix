#!/bin/sh
# Assemble the publishable matrix: shell + presets + every pack's build
# (sourcemaps and the MediaPipe hand-tracking runtime left out — the hosted
# page cannot use a camera anyway). Run tools/build-all.sh first.
set -e
ROOT=$(cd "$(dirname "$0")/.." && pwd)
OUT="$ROOT/site"
rm -rf "$OUT" && mkdir -p "$OUT/packs"
cp "$ROOT/index.html" "$OUT/"
cp -r "$ROOT/presets" "$OUT/presets"
for p in linear linear-ext linear-extended handcast casting collective; do
  mkdir -p "$OUT/packs/$p"
  (cd "$ROOT/packs/$p/dist" && find . -type f ! -name '*.map' ! -path './mediapipe/*' | tar cf - -T -) | (cd "$OUT/packs/$p" && tar xf -)
done
du -sh "$OUT"; find "$OUT" -type f | wc -l
