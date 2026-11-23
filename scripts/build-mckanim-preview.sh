#!/usr/bin/env bash
set -euo pipefail
# Allowlist the static frontend, never the NestJS backend or private documents.
for file in index.html styles.css script.js favicon.svg content/site-content.js; do
  test -f "$file" || { echo "Missing public asset: $file" >&2; exit 1; }
done
rm -rf render-public
mkdir -p render-public/content
cp styles.css script.js favicon.svg render-public/
cp content/site-content.js render-public/content/
awk '
  /<head>/ { print; print "    <meta name=\"robots\" content=\"noindex,nofollow,noarchive\" />"; next }
  { print }
' index.html > render-public/index.html
printf 'User-agent: *\nDisallow: /\n' > render-public/robots.txt

# Materialized directory routes ensure direct loading/reloading works on any
# static host without provider-specific rewrite settings.
# Insert <base href="/"> ONLY in the hosted copies; index.html remains offline-capable.
for page in menu about gallery reviews reservations contact; do
  mkdir -p "render-public/$page"
  sed 's|<head>|<head><base href="/" />|' render-public/index.html > "render-public/$page/index.html"
done

expected="$(printf '%s\n' \
  render-public/about/index.html \
  render-public/contact/index.html \
  render-public/content/site-content.js \
  render-public/favicon.svg \
  render-public/gallery/index.html \
  render-public/index.html \
  render-public/menu/index.html \
  render-public/reservations/index.html \
  render-public/reviews/index.html \
  render-public/robots.txt \
  render-public/script.js \
  render-public/styles.css)"
actual="$(find render-public -type f | LC_ALL=C sort)"
test "$expected" = "$actual" || { printf 'Unexpected public files:\n%s\n' "$actual" >&2; exit 1; }
grep -q 'name="robots" content="noindex,nofollow,noarchive"' render-public/index.html
for page in menu about gallery reviews reservations contact; do
  grep -q '<base href="/" />' "render-public/$page/index.html"
done
echo "McKanim static routes and 12 allowlisted files validated."
