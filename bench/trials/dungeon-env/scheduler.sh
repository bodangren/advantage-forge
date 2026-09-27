#!/usr/bin/env bash
# Keep about six dungeon trial builds running at all times. v2: the queue is the single source
# of truth — no meta.json skip check (it silently dropped round-2 re-roll rows for assets that
# already had round-1 runs).
#
#   bench/trials/dungeon-env/scheduler.sh <runs-root> [limit]
#
# Pulls rows (asset<TAB>model<TAB>prompt-path) from queue.tsv in this directory and launches
# bench/trial-one.sh whenever fewer than LIMIT trials are active. Every trial gets the shared
# dungeon concept images + masonry canon (mockups/) as TRIAL_REFS. Appends to scheduler.log.
set -u
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo="$(cd "$here/../../.." && pwd)"
queue="$here/queue.tsv"
log="$here/scheduler.log"
runs_root="${1:?usage: scheduler.sh <runs-root> [limit]}"
limit="${2:-6}"

active() { # wrapper and child share one command line; count distinct run directories
  pgrep -af "trial-one.sh" 2>/dev/null | awk '$4 ~ /\/runs\/dungeon-env/ {print $4}' | sort -u | wc -l
}

echo "$(date +%H:%M:%S) scheduler v2 start: root=$runs_root limit=$limit" >> "$log"
echo $$ > "$here/scheduler.pid"
while true; do
  n=$(active)
  row="$(head -n1 "$queue" 2>/dev/null)"
  if [ -z "$row" ] || [ "$n" -ge "$limit" ]; then
    sleep 20
    continue
  fi
  sed -i '1d' "$queue"
  IFS=$'\t' read -r file model prompt <<<"$row"
  refs="$here/mockups"
  echo "$(date +%H:%M:%S) launch $file -> $model" >> "$log"
  (
    cd "$repo" || exit 1
    TRIAL_REFS="$refs" nohup "$here/../../trial-one.sh" \
      "$runs_root/$file" "$file" "$here/$prompt" "$model" >> "$log" 2>&1 &
  )
  sleep 8
done
