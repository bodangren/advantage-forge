#!/usr/bin/env bash
# Calibration canary: grade the reference assets through the full pipeline (no model). Each must
# reach the `expect_min` total in its calibration brief, or the harness or judge is miscalibrated.
#
#   bench/calibrate.sh                 # all calibration briefs
#   bench/calibrate.sh horned-boar     # one
set -uo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/env.sh"
WEEK="${WEEK:-$(date -u +%Gw%V)}"
ids="${*:-$(cd "$BENCH/briefs/calibration" && ls *.json | sed 's/\.json$//')}"
fail=0
for id in $ids; do
  brief="$BENCH/briefs/calibration/$id.json"
  asset=$(node -e 'process.stdout.write(require(process.argv[1]).asset)' "$brief")
  min=$(node -e 'process.stdout.write(String(require(process.argv[1]).expect_min))' "$brief")
  run="cal-$id-$WEEK"
  AGENT_SKIP="$asset" "$BENCH/run.sh" local reference a "$id" "$run" >/dev/null 2>&1
  total=$(node -e 'const s=require(process.argv[1]); process.stdout.write(String(s.total))' "$BENCH/runs/$run/score.json" 2>/dev/null || echo null)
  if [ "$total" = "null" ] || [ -z "$total" ] || awk "BEGIN{exit !($total < $min)}"; then
    echo "FAIL $id: total $total (expected at least $min)"
    fail=1
  else
    echo "ok   $id: total $total (expected at least $min)"
  fi
done
exit $fail
