#!/usr/bin/env bash
# Week 1 cast cut-outs at the shared scale: ./cutout-cast.sh <asset> [<asset> ...]
cd "$(dirname "$0")/../../.."
L=~/Desktop/primary-parity-progress/heavy.lock
for a in "$@"; do
  flock $L ./forge cutout "$a" --out out/chibi-sprouts/r1/week1/cast --views front,three-quarter --ppm 1080 --canvas 1024x1200 2>&1 | grep -iE "error|warning|fit|needed" 
  echo "$a: $(ls out/chibi-sprouts/r1/week1/cast/$a/ 2>/dev/null | tr '\n' ' ')"
done
node scripts/cutout-check.mjs out/chibi-sprouts/r1/week1/cast | tail -1
