#!/usr/bin/env bash
# Сглобява готовата за качване папка: dist/<SLUG>/ и dist/<SLUG>.zip
# Употреба: scripts/build-release.sh [slug]
set -euo pipefail
cd "$(dirname "$0")/.."
SLUG="${1:-$(cat RELEASE_SLUG)}"
OUT="dist/$SLUG"
rm -rf "$OUT" "dist/$SLUG.zip" && mkdir -p "$OUT"
cp index.html manifest.webmanifest sw.js "$OUT/"
cp -r css js data assets "$OUT/"
cp hosting/htaccess "$OUT/.htaccess"
cp hosting/robots-note.txt "dist/README-качване.txt"
(cd dist && zip -qr "$SLUG.zip" "$SLUG")
echo "Готово: $OUT  ($(du -sh "$OUT" | cut -f1)) и dist/$SLUG.zip"

# Пакет за Netlify (поддомейн, напр. app.idezo.eu): тайната папка + настройки
NET="dist/netlify-site"
rm -rf "$NET" "dist/netlify-site.zip" && mkdir -p "$NET"
cp -r "$OUT" "$NET/$SLUG" && rm -f "$NET/$SLUG/.htaccess"
sed "s#__SLUG__#$SLUG#g" hosting/netlify_headers > "$NET/_headers"
cp hosting/netlify_redirects "$NET/_redirects"
cp hosting/robots.txt "$NET/robots.txt"
(cd dist && zip -qr "netlify-site.zip" "netlify-site")
echo "Netlify пакет: $NET и dist/netlify-site.zip"
