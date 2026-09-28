#!/usr/bin/env bash
# Graft one reviewed trial into the repo: guard, copy, fix the reference path, ./forge all, commit, log.
#
#   bench/overnight/graft.sh <asset> <trial-dir> <category> <score> "<notes>" [scope] [--replace]
#
# Refuses when assets/<asset>.ts exists at HEAD (use --replace only for a file this run made).
# A reference image that exists only in the trial workspace is copied to docs/item-mockups/.
set -uo pipefail
extra=""
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo="$(cd "$here/../.." && pwd)"
cd "$repo" || exit 1
asset="$1"; trial="$2"; category="$3"; score="$4"; notes="$5"; scope="${6:-kit}"
replace=0; [ "${7:-}" = "--replace" ] && replace=1
src="$trial/ws/assets/$asset.ts"
[ -f "$src" ] || { echo "graft: no $src"; exit 2; }
if git cat-file -e "HEAD:assets/$asset.ts" 2>/dev/null && [ "$replace" = 0 ]; then
  echo "graft: REFUSED, assets/$asset.ts exists at HEAD"; exit 3
fi
cp "$src" "assets/$asset.ts"
ref=$(grep -oE "reference: *'[^']+'" "assets/$asset.ts" | head -1 | cut -d"'" -f2)
if [ -n "$ref" ] && [ ! -e "$ref" ]; then
  if [ -e "$trial/ws/$ref" ]; then
    mkdir -p docs/item-mockups
    cp "$trial/ws/$ref" "docs/item-mockups/$(basename "$ref")"
    sed -i "s#reference: *'$ref'#reference: 'docs/item-mockups/$(basename "$ref")'#" "assets/$asset.ts"
    git add "docs/item-mockups/$(basename "$ref")"
    extra="docs/item-mockups/$(basename "$ref")"
  else
    sed -i "/reference: *'${ref//\//\\/}',\?/d" "assets/$asset.ts"
  fi
fi
out=$(./forge all "$asset" 2>&1); code=$?
if [ "$code" != 0 ] && echo "$out" | grep -q 'page.goto: Timeout'; then
  echo "graft: render timeout (machine busy); retrying once in 60 s"; sleep 60
  out=$(./forge all "$asset" 2>&1); code=$?
fi
warn=$(echo "$out" | grep -c 'warning:')
line=$(echo "$out" | grep -E "^$asset:" | head -1)
if [ "$code" != 0 ] || [ "$warn" != 0 ]; then
  echo "graft: BUILD PROBLEM exit=$code warnings=$warn"; echo "$out" | grep -E 'warning:|rror' | head -5
  git checkout -q HEAD -- "assets/$asset.ts" 2>/dev/null || rm -f "assets/$asset.ts"
  exit 4
fi
if node "$here/meshcount.mjs" "$asset" | grep -q '^EMPTY'; then
  echo "graft: GLB had no mesh after forge all; rebuilding once"
  ./forge build "$asset" > /dev/null 2>&1
  node "$here/meshcount.mjs" "$asset" | grep -q '^ok' || { echo "graft: GLB STILL EMPTY"; exit 6; }
fi
model=$(node -e 'console.log(require(process.argv[1]).model)' "$repo/$trial/meta.json")
mins=$(node -e 'console.log(Math.round(require(process.argv[1]).seconds/60))' "$repo/$trial/meta.json")
git add "assets/$asset.ts"
ok=0
for try in 1 2 3 4 5 6; do
  if git commit -q -m "feat($scope): $asset ($model trial, reviewed $score/10)

$notes

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -- "assets/$asset.ts" $extra; then ok=1; break; fi
  sleep 5; git add "assets/$asset.ts" 2>/dev/null
done
[ "$ok" = 1 ] || { echo "graft: commit failed"; exit 5; }
c=$(git rev-parse --short HEAD)
printf '%s\t%s\t%s\t%s\tyes\t%s\tgraft\t%s\t%s\n' "$asset" "$category" "$model" "$mins" "$score" "$notes" "$c" >> "$here/log.tsv"
echo "graft: ok $asset $c  $line"
