#!/usr/bin/env bash
# Builds the demo and copies it into the Primary Advantage site (apps/www-reading-advantage/public/experience).
#   scripts/demo-embed.sh [target-dir]
# The target defaults to ../reading-advantage-monorepo/apps/www-reading-advantage/public/experience.
set -euo pipefail
cd "$(dirname "$0")/.."
TARGET="${1:-../reading-advantage-monorepo/apps/www-reading-advantage/public/experience}"
node_modules/.bin/vite build --config vite.demo.config.ts
mkdir -p "$TARGET"
# The RPG skin and the avatar pack are app files (Primary Advantage pages); the demo loads neither.
rsync -a --delete --exclude /rpg/ --exclude /avatar-pack/ dist-demo/ "$TARGET"/
echo "demo copied to $TARGET ($(du -sh "$TARGET" | cut -f1))"
