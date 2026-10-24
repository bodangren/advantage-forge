#!/usr/bin/env bash
# Gesture key frames of the Adventurer for weeks 2 to 7 (set 2 + turn) at the week 1 scale,
# into out/chibi-sprouts/r1/week2-7/gestures/adventurer/ with a manifest.json in the Workbooks shape.
# The last frame of a gesture is the beat frame. Clip keys are in seconds of a 2 s clip.
cd "$(dirname "$0")/../../.."
L=~/Desktop/primary-parity-progress/heavy.lock
OUT=out/chibi-sprouts/r1/week2-7/gestures
A=sprout-adventurer
FRAMES="
point-up gesture-point-up 1.0 point-up
reach gesture-reach 1.0 reach
count-fingers gesture-count-fingers 0.68 count-fingers-low
count-fingers gesture-count-fingers 0.85 count-fingers-high
sway gesture-sway 0.5 sway-left
sway gesture-sway 1.0 sway-right
look gesture-look 0.5 look-left
look gesture-look 1.2 look-right
hop gesture-hop 0.15 hop-crouch
hop gesture-hop 0.5 hop-up
stretch-up gesture-stretch-up 1.0 stretch-up
eat gesture-eat 0.3 eat-lift
eat gesture-eat 0.5 eat-bite
hug-self gesture-hug-self 1.0 hug-self
bow gesture-bow 1.15 bow
listen gesture-listen 1.0 listen
stamp gesture-stamp 0.3 stamp-lift
stamp gesture-stamp 0.45 stamp-down
march gesture-march 0.25 march-left
march gesture-march 0.75 march-right
turn gesture-turn 0.73 turn-side
turn gesture-turn 0.95 turn-back
"
only="${1:-}"   # optional: one slug to (re)render
echo "$FRAMES" | while read -r slug clip at stem; do
  [ -z "$slug" ] && continue
  [ -n "$only" ] && [ "$only" != "$slug" ] && continue
  echo "== $stem ($clip @ $at) $(date +%H:%M)"
  flock $L ./forge cutout $A --out $OUT --clip "$clip" --at "$at" --stem "$stem" --ppm 1080 --canvas 1024x1200 2>&1 | grep -iE "error|warning|fit|needed"
done
mkdir -p $OUT/adventurer; mv $OUT/$A/*.png $OUT/adventurer/ 2>/dev/null; rmdir $OUT/$A 2>/dev/null
# The manifest in the Workbooks shape: canvas, ppm, footPoint, gestures.adventurer.<slug> = [files, beat frame last].
echo "$FRAMES" | python3 -c '
import json, sys, os
out = sys.argv[1]
g = {}
for line in sys.stdin:
    p = line.split()
    if not p: continue
    slug, clip, at, stem = p
    g.setdefault(slug, []).append(f"gestures/adventurer/{stem}.png")
m = json.load(open(os.path.join(out, "manifest.json")))
m = {"ppm": m["ppm"], "canvas": m["canvas"], "footPoint": m["footPoint"],
     "notes": "Adventurer gesture frames for weeks 2 to 7 at the week 1 scale; the last frame of a gesture is the beat frame; all renders face +Z and are unmirrored.",
     "gestures": {"adventurer": g}, "files": m.get("files", {})}
json.dump(m, open(os.path.join(out, "manifest.json"), "w"), indent=2)
print("manifest", len(g), "gestures")
' $OUT
ls $OUT/adventurer/ | wc -l
node scripts/cutout-check.mjs $OUT | tail -1
