#!/usr/bin/env bash
# Run a batch: models x briefs x arms x repeats, serially (one run at a time keeps renders and
# timings stable on this machine). Runs that already have a valid score are skipped.
#
#   bench/batch.sh                                  # every model in config/models.json, every brief, arms a b
#   MODELS="kimi-k3 glm-5.3" BRIEFS="frost-wolf oil-lantern" ARMS=b REPS=2 bench/batch.sh
#
# Before a batch, the calibration canary grades the reference assets; the batch stops if any of
# them scores below its expected minimum (set CANARY=0 to skip, for example to save judge cost).
set -uo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/env.sh"

WEEK="${WEEK:-$(date -u +%Gw%V)}"
ARMS="${ARMS:-a b}"
REPS="${REPS:-1}"
PROVIDER="${PROVIDER:-opencode-go}"
if [ -z "${MODELS:-}" ]; then
  MODELS=$(node -e 'for (const m of require(process.argv[1]).models) console.log(m.id)' "$BENCH/config/models.json")
fi
if [ -z "${BRIEFS:-}" ]; then
  BRIEFS=$(cd "$BENCH/briefs" && ls *.json | sed 's/\.json$//')
fi

if [ "${CANARY:-1}" = "1" ]; then
  "$BENCH/calibrate.sh" || { echo "calibration canary failed; not running the batch" >&2; exit 1; }
fi

for model in $MODELS; do
  slug=$(printf '%s' "$model" | tr '.' '-' | tr -c 'A-Za-z0-9_-' '-')
  for brief in $BRIEFS; do
    for arm in $ARMS; do
      for rep in $(seq 1 "$REPS"); do
        id="$arm-$brief-$slug-$WEEK-r$rep"
        score="$BENCH/runs/$id/score.json"
        if [ -f "$score" ] && node -e 'const s=require(process.argv[1]); process.exit(s.valid?0:1)' "$score"; then
          echo "skip $id (scored)"
          continue
        fi
        echo "=== $id"
        "$BENCH/run.sh" "$PROVIDER" "$model" "$arm" "$brief" "$id" || echo "run failed: $id" >&2
      done
    done
  done
done
"$TSX" "$BENCH/report.ts"
