#!/usr/bin/env bash
# Gesture key frames of one Sprout cast member for weeks 2 to 7 (set 2 + turn)
# at the week 1 scale, into out/chibi-sprouts/r1/week2-7/gestures/<cast>/, with
# gestures.<cast> keys merged into the same manifest.json (adventurer key kept).
# Adults (Mom first; Dad, Grandma, Grandpa later) render at the same 1080 px/m scale
# into gestures-adult/<cast>/ with their own manifest: one folder keeps one canvas,
# and a grown-up does not fit the children's 1024x1200.
# Usage: ./cutout-gestures-cast.sh <cast> [slug]
#   <cast>: pat | sam | mia | may | mom | dad | grandma (also nan ben adventurer for re-renders)
#   [slug]: optional, one gesture slug to (re)render (point-up, reach, ...)
# The FRAMES list is a copy of cutout-gestures-w2-7.sh; the last frame of a
# gesture is the beat frame. The *-picture slugs are held poses for the 64 px
# song-line pictures only. Clip keys are in seconds of a 2 s clip.
# Each render runs through heavy-run (one heavy job at a time). Exit 75 means
# the machine has no headroom: wait and retry later.
cd "$(dirname "$0")/../../.."
OUT=out/chibi-sprouts/r1/week2-7/gestures
CAST="${1:?usage: cutout-gestures-cast.sh <cast> [slug]}"
# Adults share one folder (one canvas): Mom first, Dad second (1.61 m), Grandma third.
# Grandma (1.53 m with her bun) fits the same canvas. Dad's
# widest pose (sway-picture, arms fully out) needs 1738 px wide, so the adult
# canvas is 1760x1856 for every adult. Same 1080 px/m scale, own manifest.
case "$CAST" in mom|dad|grandma|grandpa) OUT=out/chibi-sprouts/r1/week2-7/gestures-adult;; esac
REL="$(basename "$OUT")"
A="sprout-$CAST"
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
march-picture picture-march 1.0 march-picture
stamp-picture picture-stamp 1.0 stamp-picture
sway-picture picture-sway 1.0 sway-picture
"
only="${2:-}"   # optional: one slug to (re)render
# Canvas at the week 1 scale (1080 px/m for every cast). Adults share the taller
# and wider canvas: a grown-up does not fit the children's 1024x1200, and the
# tallest adult (Dad) sets the adult width.
CANVAS="1024x1200"
case "$CAST" in mom|dad|grandma|grandpa) CANVAS="1760x1856";; esac
echo "$FRAMES" | while read -r slug clip at stem; do
  [ -z "$slug" ] && continue
  [ -n "$only" ] && [ "$only" != "$slug" ] && continue
  echo "== $CAST $stem ($clip @ $at) $(date +%H:%M)"
  HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c "./forge cutout $A --out $OUT --clip \"$clip\" --at \"$at\" --stem \"$stem\" --ppm 1080 --canvas $CANVAS --hide-sing" 2>&1 | grep -iE "error|warning|fail|needed|exit 75"
done
mkdir -p "$OUT/$CAST"; mv "$OUT/$A/"*.png "$OUT/$CAST/" 2>/dev/null; rmdir "$OUT/$A" 2>/dev/null
# Merge gestures.<cast> into the manifest; keep every existing key (adventurer stays).
export CAST REL
echo "$FRAMES" | python3 -c '
import json, sys, os
cast = os.environ["CAST"]
rel = os.environ["REL"]
out = sys.argv[1]
g = {}
files = {}
for line in sys.stdin:
    p = line.split()
    if not p: continue
    slug, clip, at, stem = p
    g.setdefault(slug, []).append(f"{rel}/{cast}/{stem}.png")
    files[f"sprout-{cast}/{stem}"] = True
mp = os.path.join(out, "manifest.json")
m = json.load(open(mp))
m.setdefault("gestures", {})[cast] = g
m.setdefault("files", {}).update(files)
json.dump(m, open(mp, "w"), indent=2)
print("manifest gestures:", sorted(m["gestures"].keys()))
' "$OUT"
ls "$OUT/$CAST/" | wc -l
node scripts/cutout-check.mjs "$OUT" | tail -3
