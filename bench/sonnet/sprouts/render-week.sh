#!/usr/bin/env bash
# Render one Storytime song week: the contact sheet, then the silent video, under the heavy lock.
#   bench/sonnet/sprouts/render-week.sh <week 01..08> <cut name, e.g. song-cut1> [extra record options]
# Inputs: Workbooks' spec.json and Storytime's stage.json for the week; output out/chibi-sprouts/r1/week<N>/song/.
set -u
cd "$(dirname "$0")/../../.."
W=$1; NAME=$2; shift 2
SPEC=/home/daniebo/Desktop/Workbooks/video/storytime-song/public/l2/w$W/spec.json
STAGE=/home/daniebo/Desktop/primary-parity-progress/storytime-stage/l2/w$W/stage.json
OUT=out/chibi-sprouts/r1/week$((10#$W))/song
L=~/Desktop/primary-parity-progress/heavy.lock
[ -f "$SPEC" ] || { echo "no spec: $SPEC"; exit 1; }
[ -f "$STAGE" ] || { echo "no stage: $STAGE"; exit 1; }
mkdir -p "$OUT"
flock $L bash -c "node --import tsx scripts/song-record.ts sheet $SPEC $STAGE --out $OUT --count 12 --name $NAME 2>&1 | grep -E 'warning|page:|sheet '; node --import tsx scripts/song-record.ts record $SPEC $STAGE --out $OUT --fps 24 --name $NAME $* 2>&1 | grep -E 'page:|video '"
