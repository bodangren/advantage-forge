#!/usr/bin/env bash
set -euo pipefail

root="${MEASURE_ROOT:-$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)}"
status=0
for name in lessons-learned.md tech-debt.md; do
  path="$root/measure/$name"
  if [[ ! -f "$path" ]]; then
    printf 'error: measure/%s is missing\n' "$name" >&2
    status=1
    continue
  fi
  lines="$(awk 'END { print NR }' "$path")"
  if (( lines > 50 )); then
    printf 'error: measure/%s has %s lines; maximum is 50\n' "$name" "$lines" >&2
    status=1
  fi
done
exit "$status"
