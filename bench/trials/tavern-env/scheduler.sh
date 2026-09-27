#!/usr/bin/env bash
# Keep about LIMIT tavern trial builds running at all times. The queue is the single source
# of truth — no meta.json skip check (re-rolls re-append the same row).
#
#   bench/trials/tavern-env/scheduler.sh <runs-root> [limit] [queue-file]
#
# Pulls rows (asset<TAB>model<TAB>prompt-path) from <queue-file> (default queue.tsv) and
# launches bench/trial-one.sh whenever fewer than LIMIT trials are active. Every trial gets
# the shared tavern concept images (mockups/) as TRIAL_REFS. Appends to scheduler.log.
#
# Multiple instances may run in parallel against different <runs-root> + <queue-file>
# pairs (e.g. wave 1 on tavern-env-r1/queue.tsv, wave 2 on tavern-env-r2/queue-r2.tsv);
# each instance only counts trials under its own runs-root so they do not starve each other.
set -u
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo="$(cd "$here/../../.." && pwd)"
queue_file="${3:-queue.tsv}"
queue="$here/$queue_file"
log="$here/scheduler.log"
runs_root="${1:?usage: scheduler.sh <runs-root> [limit] [queue-file]}"
limit="${2:-3}"
# Pattern that uniquely identifies this scheduler's trials in `pgrep -af` output. The trial
# command line includes the absolute trial dir as its first arg; we anchor on the runs root.
runs_re="$(printf '%s' "$runs_root" | sed 's:[\\/]:\\\\&:g')"

active() { # count distinct trial-one.sh processes whose trial dir lives under this runs_root
  pgrep -af "trial-one.sh" 2>/dev/null | awk -v re="$runs_re" '$0 ~ re' | wc -l
}

echo "$(date +%H:%M:%S) scheduler start: root=$runs_root queue=$queue_file limit=$limit" >> "$log"
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