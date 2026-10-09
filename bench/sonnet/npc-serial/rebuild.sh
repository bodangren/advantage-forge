#!/usr/bin/env bash
# Rebuild stale NPC sources one at a time with no agent: forge all, then check.
# Usage: bench/sonnet/npc-serial/rebuild.sh <name>...   Summary rows go to out/npc-rebuild.tsv.
cd "$(dirname "$0")/../../.." || exit 1
for n in "$@"; do
  mkdir -p "out/$n"
  if FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge all "$n" > "out/$n/rebuild.log" 2>&1; then b=ok; else b=FAIL; fi
  w=$(grep -c 'warning:' "out/$n/rebuild.log")
  c=$(FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge check "$n" 2>&1 | grep -oE '(result|ground) [a-z]+' | tr '\n' ' ')
  printf '%s\t%s\twarnings=%s\t%s\n' "$n" "$b" "$w" "$c" >> out/npc-rebuild.tsv
done
