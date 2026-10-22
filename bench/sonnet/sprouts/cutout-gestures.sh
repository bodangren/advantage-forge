#!/usr/bin/env bash
# Week 1 gesture key frames of the Adventurer at the shared scale, into gestures/adventurer/.
cd "$(dirname "$0")/../../.."
L=~/Desktop/primary-parity-progress/heavy.lock
OUT=out/chibi-sprouts/r1/week1/gestures
A=sprout-adventurer
frame() { # clip seconds stem
  flock $L ./forge cutout $A --out $OUT --clip "$1" --at "$2" --stem "$3" --ppm 1080 --canvas 1024x1200 2>&1 | grep -iE "error|warning|fit|needed"
}
frame gesture-clap 0.5 clap-apart
frame gesture-clap 1.0 clap-together
frame gesture-wave 0.5 wave-left
frame gesture-wave 1.0 wave-right
frame gesture-nod 0.5 nod-up
frame gesture-nod 1.0 nod-down
frame gesture-point-to-self 1.0 point-to-self
frame gesture-point-forward 1.0 point-forward
frame gesture-hands-out 1.0 hands-out
frame gesture-idle 1.0 idle
mkdir -p $OUT/adventurer; mv $OUT/$A/*.png $OUT/adventurer/ 2>/dev/null; rmdir $OUT/$A 2>/dev/null
ls $OUT/adventurer/
node scripts/cutout-check.mjs $OUT | tail -1
