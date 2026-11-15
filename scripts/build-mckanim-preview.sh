#!/usr/bin/env bash
set -euo pipefail

# Multi-page static Render preview. Only explicit public files are deployed.
# Does not expose NestJS, API secrets, repository metadata, docs or tests.
pages=(index.html menu/index.html about/index.html gallery/index.html reviews/index.html reservations/index.html contact/index.html)
assets=(styles.css premium.css script.js favicon.svg content/site-content.js)
for file in "${pages[@]}" "${assets[@]}"; do
  if [[ ! -f "$file" ]]; then
    printf 'Missing required frontend source: %s\n' "$file" >&2
    exit 1
  fi
done

rm -rf render-public
mkdir -p render-public/content
cp styles.css premium.css script.js favicon.svg render-public/
cp content/site-content.js render-public/content/
for page in "${pages[@]}"; do
  mkdir -p "render-public/$(dirname "$page")"
  # Privacy-first public preview; noindex is advisory, not access protection.
  awk '
    /<head>/ { print; print "    <meta name=\"robots\" content=\"noindex,nofollow,noarchive\" />"; next }
    { print }
  ' "$page" > "render-public/$page"
done
printf 'User-agent: *\nDisallow: /\n' > render-public/robots.txt

expected="$(printf '%s\n' render-public/robots.txt; for file in "${pages[@]}" "${assets[@]}"; do printf 'render-public/%s\n' "$file"; done)"
actual="$(find render-public -type f | LC_ALL=C sort)"
if [[ "$(printf '%s\n' "$expected" | LC_ALL=C sort)" != "$actual" ]]; then
  printf 'Preview includes an unexpected or missing file:\n%s\n' "$actual" >&2
  exit 1
fi
for page in "${pages[@]}"; do
  grep -q 'name="robots" content="noindex,nofollow,noarchive"' "render-public/$page"
done
printf 'Premium McKanim multi-page staging allowlist verified (%s files).\n' "$(find render-public -type f | wc -l)"
