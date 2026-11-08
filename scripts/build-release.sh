#!/usr/bin/env bash
# Сглобява готовата за качване папка: dist/<SLUG>/ и dist/<SLUG>.zip
# Употреба: scripts/build-release.sh [slug]
set -euo pipefail
cd "$(dirname "$0")/.."
SLUG="${1:-$(cat RELEASE_SLUG)}"
OUT="dist/$SLUG"
rm -rf "dist" && mkdir -p "$OUT"
cp index.html manifest.webmanifest sw.js "$OUT/"
cp -r css js data assets "$OUT/"
cp hosting/htaccess "$OUT/.htaccess"
cp hosting/robots-note.txt "dist/README-качване.txt"
(cd dist && zip -qr "$SLUG.zip" "$SLUG")
echo "Готово: $OUT  ($(du -sh "$OUT" | cut -f1)) и dist/$SLUG.zip"
