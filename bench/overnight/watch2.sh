#!/usr/bin/env bash
# Event stream for the overnight run: one line per finished trial, and one line per change to the
# real repo's source files that is not listed in expected.txt (catches a trial that escapes its
# workspace). expected.txt: one repo-relative path per line (files Claude or its subagents edit).
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo="$(cd "$here/../.." && pwd)"
cd "$repo" || exit 1
log="$here/scheduler.log"
touch "$log" "$here/expected.txt"
lines=$(wc -l < "$log")
snap() {
  git status --porcelain -- assets src scenes docs AGENTS.md .claude bench/trial-one.sh bench/lib.ts bench/env.sh 2>/dev/null |
    grep -vE ' (src/demo/|tests/demo/|demo/)' | while read -r st path; do
      grep -qxF "$path" "$here/expected.txt" && continue
      [ -e "$path" ] && echo "$st $path $(stat -c %Y "$path" 2>/dev/null)" || echo "$st $path gone"
    done | sort
}
prev="$(snap)"
while true; do
  now=$(wc -l < "$log")
  if [ "$now" -gt "$lines" ]; then
    sed -n "$((lines + 1)),${now}p" "$log" | grep -E 'finished |scheduler stop'
    lines=$now
  fi
  cur="$(snap)"
  if [ "$cur" != "$prev" ]; then
    comm -13 <(echo "$prev") <(echo "$cur") | sed 's/^/repo-change: /'
    prev="$cur"
  fi
  sleep 20
done
