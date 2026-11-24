#!/usr/bin/env bash
set -u
ROOT=/home/daniebo/Desktop/forge-worktrees/sprouts-redesign
RUNS=$ROOT/measure/runs/chibi_sprouts_redesign_20261123
cd "$ROOT"
node node_modules/vitest/vitest.mjs run --maxWorkers=1 --exclude tests/storytime-book-pictures.test.ts > "$RUNS/project-gate-r3-inner.log" 2>&1 &
pid=$!
printf 'vitest_pid=%s\n' "$pid" > "$RUNS/project-gate-r3-pid.txt"
wait "$pid"
code=$?
printf 'exit=%s\n' "$code" >> "$RUNS/project-gate-r3-pid.txt"
cat "$RUNS/project-gate-r3-inner.log"
exit "$code"
