#!/usr/bin/env bash
# Launch the chibi-env batch: one trial-one.sh run per manifest row, its own trial dir per asset
# (trial-one.sh slugs its run dir by model, so per-asset dirs keep same-model runs apart),
# <parallel> assets at a time, then print "all done".
#
#   bench/trials/chibi-env/launch.sh <parallel>
#
# Env overrides (used by re-assignment rounds):
#   RUNS_DIR     run output root      (default $BENCH/runs/chibi-env)
#   MANIFEST     task manifest        (default $here/manifest.tsv)
#   PROMPTS_DIR  prompt files         (default $here/prompts)
#
# Assets with a mockup get TRIAL_REFS pointing at their mockup folder (copied to ws/reference).
set -uo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PAR="${1:?usage: launch.sh <parallel>}"
BENCH="$here/../.."
runs="${RUNS_DIR:-$BENCH/runs/chibi-env}"
manifest="${MANIFEST:-$here/manifest.tsv}"
prompts="${PROMPTS_DIR:-$here/prompts}"
mkdir -p "$runs"

run_one() {
  IFS=$'\t' read -r id file model _desc <<<"$1"
  refs=""
  [ -d "$here/mockups/$file" ] && refs="$here/mockups/$file"
  TRIAL_REFS="$refs" "$BENCH/trial-one.sh" "$runs/$file" "$file" "$prompts/$file.prompt.md" "$model"
}
export -f run_one
export here runs BENCH prompts

tail -n +2 "$manifest" | xargs -P "$PAR" -I{} bash -c 'run_one "$@"' _ {}
echo "all done"
