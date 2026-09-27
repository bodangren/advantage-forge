#!/usr/bin/env bash
# Keep about six trial builds running at all times.
#
#   bench/trials/chibi-env/scheduler.sh <runs-root> [limit]
#
# Pulls rows (asset<TAB>model<TAB>prompt-path) from queue.tsv in this directory and launches
# bench/trial-one.sh whenever fewer than LIMIT trials are active. A trial counts as active
# while its run directory appears in a running trial-one.sh command line. Appends everything
# to scheduler.log. Stays alive when the queue is empty so later rows launch on their own.
set -u
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo="$(cd "$here/../../.." && pwd)"
queue="$here/queue.tsv"
log="$here/scheduler.log"
runs_root="${1:?usage: scheduler.sh <runs-root> [limit]}"
limit="${2:-6}"

active() { # wrapper and child share one command line; count distinct run directories
  pgrep -af "trial-one.sh" 2>/dev/null | awk '$4 ~ /\/runs\/chibi-env/ {print $4}' | sort -u | wc -l
}

echo "$(date +%H:%M:%S) scheduler start: root=$runs_root limit=$limit" >> "$log"
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
  if [ -f "$runs_root/$file/"*/meta.json ] 2>/dev/null; then
    echo "$(date +%H:%M:%S) skip $file (run already finished)" >> "$log"
    continue
  fi
  refs=""
  [ -d "$here/mockups/$file" ] && refs="$here/mockups/$file"
  echo "$(date +%H:%M:%S) launch $file -> $model" >> "$log"
  (
    cd "$repo" || exit 1
    TRIAL_REFS="$refs" nohup "$here/../../trial-one.sh" \
      "$runs_root/$file" "$file" "$prompt" "$model" >> "$log" 2>&1 &
  )
  sleep 8
done
