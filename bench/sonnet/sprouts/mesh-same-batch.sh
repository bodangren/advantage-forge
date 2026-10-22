#!/usr/bin/env bash
# Wider mesh-same proof for the humanoid-kind proportions option: one asset per option path.
# Runs serially under the shared heavy lock; prints one line per asset and a final verdict.
cd "$(dirname "$0")/../../.."
fail=0
check() { out=$(flock ~/Desktop/primary-parity-progress/heavy.lock node scripts/mesh-same.mjs "$1" --part "$2" 2>&1 | tail -1); echo "$1: $out"; case "$out" in SAME*) ;; *) fail=1 ;; esac; }
for a in avatar-base baker acolyte brewer archaeologist apothecary ambassador armorer bartender; do check "$a" assets/parts/humanoid-kind.ts; done
for a in avatar-hair-swept avatar-hair-long avatar-hair-short avatar-hair-ponytail; do [ -f assets/$a.ts ] && check "$a" assets/parts/avatar-hair.ts; done
[ $fail = 0 ] && echo "verdict SAME" || echo "verdict DIFF"
