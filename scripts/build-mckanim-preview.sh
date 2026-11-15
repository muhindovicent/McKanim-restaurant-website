#!/usr/bin/env bash
set -euo pipefail

# Render static preview — only publish an explicit allowlist.
# This script NEVER packages backend sources, tests, docs, .env or repo metadata.
for file in index.html styles.css script.js favicon.svg content/site-content.js; do
  if [[ ! -f "$file" ]]; then
    printf 'Missing required public asset: %s\n' "$file" >&2
    exit 1
  fi
done

# The output directory is fixed to avoid inadvertently publishing the repo root.
rm -rf render-public
mkdir -p render-public/content
cp styles.css script.js favicon.svg render-public/
cp content/site-content.js render-public/content/

# This preview is intentionally public but not intended for search indexing.
# Copy HTML without mutating the checked-in customer website.
awk '
  /<head>/ { print; print "    <meta name=\"robots\" content=\"noindex,nofollow,noarchive\" />"; next }
  { print }
' index.html > render-public/index.html
printf 'User-agent: *\nDisallow: /\n' > render-public/robots.txt

# Defense in depth: fail if a build change added unexpected files.
expected="$(printf '%s\n' \
  'render-public/content/site-content.js' \
  'render-public/favicon.svg' \
  'render-public/index.html' \
  'render-public/robots.txt' \
  'render-public/script.js' \
  'render-public/styles.css')"
actual="$(find render-public -type f | LC_ALL=C sort)"
if [[ "$expected" != "$actual" ]]; then
  printf 'Static preview contains unexpected assets:\n%s\n' "$actual" >&2
  exit 1
fi
grep -q 'name="robots" content="noindex,nofollow,noarchive"' render-public/index.html
printf 'Staging static-site allowlist validated (6 files).\n'
