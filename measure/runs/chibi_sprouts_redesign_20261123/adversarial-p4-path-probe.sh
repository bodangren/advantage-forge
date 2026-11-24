#!/usr/bin/env bash
set +e
cd /home/daniebo/Desktop/forge-worktrees/sprouts-redesign
for name in '__missing_probe_asset__' 'wizard-argon-trial' '../assets/sprout-mom-kim' '../measure/runs/chibi_sprouts_redesign_20261123/adversarial-p4-probe'; do
 echo "ASSET=$name"
 ./node_modules/.bin/tsx scripts/proportion-check.mjs --asset "$name"
 echo "EXIT=$?"
done
