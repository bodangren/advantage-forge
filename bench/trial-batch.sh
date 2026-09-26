#!/usr/bin/env bash
# Run bench/trial-one.sh for several models, <parallel> at a time, then print "all done".
#
#   bench/trial-batch.sh <trial-dir> <asset-id> <prompt-file> <parallel> <provider/model>...
#
# Start it detached, so it outlives the session that starts it:
#   setsid -f bench/trial-batch.sh ... > <trial-dir>/launcher.log 2>&1 < /dev/null
# The TRIAL_* environment variables of trial-one.sh pass through.
set -uo pipefail
TRIAL="${1:?}"; ASSET="${2:?}"; PROMPT="${3:?}"; PAR="${4:?}"; shift 4
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
printf '%s\n' "$@" | xargs -P "$PAR" -I{} "$here/trial-one.sh" "$TRIAL" "$ASSET" "$PROMPT" {}
echo "all done"
