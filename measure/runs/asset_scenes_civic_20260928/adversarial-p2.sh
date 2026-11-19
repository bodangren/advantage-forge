#!/usr/bin/env bash
# Phase 2 adversarial probes for check-review.sh (track asset_scenes_civic_20260928).
# Role: measure-adversarial-testing. Light script: cp, sed, jq, grep, awk, and test only.
# No shots, builds, vitest, or tsc. This script edits no checker, no inventory, and no
# batch record: every mutation lives in a fixture tree under /tmp/opencode/adv-p2-civic.
#
# Method: each probe copies the committed inventory, the committed TSV, the four committed
# batch JSON and log files, and the unmodified checker into a fixture tree, applies one
# mutation, and runs the checker from the fixture root, so its relative paths resolve
# inside the fixture. The control fixture is the unmutated copy: it must pass 34 of 34,
# which proves that the harness is faithful before any probe counts.
#
# Probes:
#   ADV-P2-00 control         no mutation.                       want exit 0 (34 of 34)
#   ADV-P2-01 critical flip   mill inventory Judge critical true -> false
#                             (review-a F1, first cell).         gate: want exit 1
#   ADV-P2-02 judge cell      mill inventory judge route cell -> anthropic/claude-sonnet-5-5
#                             (review-a F1, second cell).         gate: want exit 1
#   ADV-P2-03 log no model id b1 log reduced to its route line only
#                             (review-a F2, vacuous grep).        gate: want exit 1
#   ADV-P2-04 rating drift     mill inventory Judge rating 5.5 -> 6.0 while batch b3
#                             keeps 5.5.                          want exit 1
#   ADV-P2-05 duplicate slug   apothecary b1 entry copied into b2.  want exit 1
#   ADV-P2-06 foreign head     b1 audited_head -> a SHA that is not an ancestor of HEAD.
#                             informational: exposes a gap; the verdict does not set the
#                             exit code.
#   ADV-P2-07 string rating    b1 apothecary rating 8.0 -> JSON string "7.5".  want exit 1
#   ADV-P2-08 double rating    mill entry with rating 9.0 appended to b4 while b3 keeps
#                             its 5.5 entry.                       want exit 1
#
# Exit codes: 0 every gate probe is caught (the checker survives every probe);
#             1 a gate probe (01 to 03) passes, or a want-exit-1 probe (04, 05, 07, 08)
#               passes;
#             2 harness failure (the control fixture does not pass 34 of 34).
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$SCRIPT_DIR/../../.." && pwd)"
TRACK_DIR="measure/tracks/asset_scenes_civic_20260928"
RUNS_REL="measure/runs/asset_scenes_civic_20260928"
INV_SRC="$REPO/$TRACK_DIR/scenes/inventory.md"
TSV_SRC="$REPO/docs/fantasy-world-scene-blueprints.tsv"
CHECKER_SRC="$REPO/$RUNS_REL/check-review.sh"
WORK="/tmp/opencode/adv-p2-civic"

GATE_DEFECT=0
REGRESSION=0

log() { printf '%s\n' "$*"; }

# build_base <root>: pristine fixture tree with the committed Phase 2 records.
build_base() {
  local root="$1" n
  rm -rf "$root"
  mkdir -p "$root/$TRACK_DIR/scenes" "$root/docs" "$root/$RUNS_REL" || return 1
  cp "$INV_SRC" "$root/$TRACK_DIR/scenes/inventory.md" || return 1
  cp "$TSV_SRC" "$root/docs/fantasy-world-scene-blueprints.tsv" || return 1
  cp "$CHECKER_SRC" "$root/check-review.sh" || return 1
  for n in 1 2 3 4; do
    cp "$REPO/$RUNS_REL/vision-review-b$n.json" "$root/$RUNS_REL/vision-review-b$n.json" || return 1
    cp "$REPO/$RUNS_REL/vision-review-b$n.log" "$root/$RUNS_REL/vision-review-b$n.log" || return 1
  done
}

# run_checker <root> <outfile>: runs the unmodified checker copy; sets RUN_EXIT.
run_checker() {
  (cd "$1" && bash ./check-review.sh) > "$2" 2>&1
  RUN_EXIT=$?
}

total_line() { grep -F "=== Total:" "$1" | tail -n 1; }

fail_lines() { grep -E "^FAIL:" "$1" | head -n 6; }

command -v jq >/dev/null 2>&1 || { echo "HARNESS FAIL: jq is required"; exit 2; }

rm -rf "$WORK"
mkdir -p "$WORK"

echo "ADV-P2 adversarial probes for check-review.sh (asset_scenes_civic_20260928, Phase 2)"
echo "repo: $REPO"
echo "work: $WORK"
echo ""

# ---------------------------------------------------------------- ADV-P2-00 control
echo "=== ADV-P2-00 control: unmutated fixture must pass ==="
build_base "$WORK/t00" || { echo "HARNESS FAIL: could not build the control fixture"; exit 2; }
run_checker "$WORK/t00" "$WORK/t00.out"
echo "checker exit: $RUN_EXIT; $(total_line "$WORK/t00.out")"
if [ "$RUN_EXIT" -eq 0 ] && total_line "$WORK/t00.out" | grep -q "PASS=34, FAIL=0"; then
  echo "verdict: CONTROL OK (copied records reproduce Green; probes below count)"
else
  echo "verdict: HARNESS FAIL (control did not pass 34 of 34; probe results would be void)"
  cat "$WORK/t00.out"
  exit 2
fi
V00="CONTROL OK"
echo ""

# ---------------------------------------------------------------- ADV-P2-01 critical flip (F1)
echo "=== ADV-P2-01: mill inventory Judge critical true -> false (review-a F1) ==="
build_base "$WORK/t01"
INV="$WORK/t01/$TRACK_DIR/scenes/inventory.md"
sed -i -E '/^\| mill \|/ s/Judge critical: true/Judge critical: false/' "$INV"
echo "mutated cell: $(grep -E '^\| mill \|' "$INV" | grep -o 'Judge critical: [a-z]*')"
echo "batch b3 keeps: $(jq -c '.maps[] | select(.slug=="mill") | {rating, critical}' "$WORK/t01/$RUNS_REL/vision-review-b3.json")"
run_checker "$WORK/t01" "$WORK/t01.out"
echo "checker exit: $RUN_EXIT; $(total_line "$WORK/t01.out")"
if [ "$RUN_EXIT" -eq 0 ]; then
  echo "verdict: DEFECT CONFIRMED -- the phase gate passes a critical flag that contradicts"
  echo "  its batch JSON; P2-d never reads the Judge critical cell, so a critical map can"
  echo "  silently leave the Phase 3 rework set"
  GATE_DEFECT=1
  V01="DEFECT CONFIRMED (gate)"
else
  echo "verdict: CAUGHT -- the checker now compares the Judge critical cell with the batch"
  V01="CAUGHT"
  fail_lines "$WORK/t01.out"
fi
echo ""

# ---------------------------------------------------------------- ADV-P2-02 judge cell (F1)
echo "=== ADV-P2-02: mill inventory judge route cell -> anthropic/claude-sonnet-5-5 (review-a F1) ==="
build_base "$WORK/t02"
INV="$WORK/t02/$TRACK_DIR/scenes/inventory.md"
sed -i -E '/^\| mill \|/ s|judge: kimi-code-plan-cn/kimi-for-coding|judge: anthropic/claude-sonnet-5-5|' "$INV"
echo "mutated cell: $(grep -E '^\| mill \|' "$INV" | grep -o 'judge: [^|]*' | head -n 1)"
run_checker "$WORK/t02" "$WORK/t02.out"
echo "checker exit: $RUN_EXIT; $(total_line "$WORK/t02.out")"
if [ "$RUN_EXIT" -eq 0 ]; then
  echo "verdict: DEFECT CONFIRMED -- the phase gate passes an inventory row whose judge cell"
  echo "  names the maker family; P2-d never reads the judge route cell, so the per-row"
  echo "  record of judge independence is unchecked"
  GATE_DEFECT=1
  V02="DEFECT CONFIRMED (gate)"
else
  echo "verdict: CAUGHT -- the checker now rejects a maker-family judge cell in the row"
  V02="CAUGHT"
  fail_lines "$WORK/t02.out"
fi
echo ""

# ---------------------------------------------------------------- ADV-P2-03 log without model id (F2)
echo "=== ADV-P2-03: b1 log reduced to its route line only, no model id (review-a F2) ==="
build_base "$WORK/t03"
LOG="$WORK/t03/$RUNS_REL/vision-review-b1.log"
printf 'route: kimi-code-plan-cn/kimi-for-coding\n' > "$LOG"
echo "log content: $(cat "$LOG")"
run_checker "$WORK/t03" "$WORK/t03.out"
echo "checker exit: $RUN_EXIT; $(total_line "$WORK/t03.out")"
if grep -q "PASS: P2-c batch b1 log cites its route and a model id or family" "$WORK/t03.out"; then
  echo "verdict: DEFECT CONFIRMED -- the log check reduces to grep for the route string:"
  echo "  the model id kimi-for-coding and the family kimi are substrings of the route"
  echo "  kimi-code-plan-cn/kimi-for-coding, so a log with no model id or family line passes"
  GATE_DEFECT=1
  V03="DEFECT CONFIRMED (gate)"
else
  echo "verdict: CAUGHT -- the log check now requires a model id or family beyond the route"
  V03="CAUGHT"
  fail_lines "$WORK/t03.out"
fi
echo ""

# ---------------------------------------------------------------- ADV-P2-04 rating drift
echo "=== ADV-P2-04: mill inventory Judge rating 5.5 -> 6.0, batch b3 keeps 5.5 ==="
build_base "$WORK/t04"
INV="$WORK/t04/$TRACK_DIR/scenes/inventory.md"
sed -i -E '/^\| mill \|/ s/Judge rating: 5\.5/Judge rating: 6.0/' "$INV"
echo "mutated cell: $(grep -E '^\| mill \|' "$INV" | grep -o 'Judge rating: [0-9.]*')"
run_checker "$WORK/t04" "$WORK/t04.out"
echo "checker exit: $RUN_EXIT; $(total_line "$WORK/t04.out")"
if [ "$RUN_EXIT" -ne 0 ] && grep -q "P2-d row for mill holds Judge rating" "$WORK/t04.out"; then
  echo "verdict: CAUGHT -- P2-d compares the copied rating with the batch value"
  V04="CAUGHT"
  fail_lines "$WORK/t04.out"
else
  echo "verdict: DEFECT -- the checker passed an inventory rating that differs from its batch"
  REGRESSION=1
  V04="DEFECT (regression)"
fi
echo ""

# ---------------------------------------------------------------- ADV-P2-05 duplicate slug
echo "=== ADV-P2-05: apothecary b1 entry copied into b2 (duplicate slug across batches) ==="
build_base "$WORK/t05"
B1="$WORK/t05/$RUNS_REL/vision-review-b1.json"
B2="$WORK/t05/$RUNS_REL/vision-review-b2.json"
ENTRY="$(jq -c '.maps[0]' "$B1")"
echo "appended entry: $ENTRY"
jq --argjson e "$ENTRY" '.maps += [$e]' "$B2" > "$B2.tmp" && mv "$B2.tmp" "$B2"
run_checker "$WORK/t05" "$WORK/t05.out"
echo "checker exit: $RUN_EXIT; $(total_line "$WORK/t05.out")"
if [ "$RUN_EXIT" -ne 0 ] && grep -q "appears in" "$WORK/t05.out"; then
  echo "verdict: CAUGHT -- P2-a rejects the duplicate slug across batches"
  V05="CAUGHT"
  fail_lines "$WORK/t05.out"
else
  echo "verdict: DEFECT -- the checker passed a map rated by two batches"
  REGRESSION=1
  V05="DEFECT (regression)"
fi
echo ""

# ---------------------------------------------------------------- ADV-P2-06 foreign head
echo "=== ADV-P2-06: b1 audited_head -> 1a2b3c4d (not an ancestor of HEAD) (informational) ==="
build_base "$WORK/t06"
B1="$WORK/t06/$RUNS_REL/vision-review-b1.json"
jq '.audited_head = "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b"' "$B1" > "$B1.tmp" && mv "$B1.tmp" "$B1"
echo "mutated audited_head: $(jq -r '.audited_head' "$B1")"
git merge-base --is-ancestor 1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b HEAD 2>/dev/null \
  && echo "ancestor check: is an ancestor (unexpected)" \
  || echo "ancestor check: 1a2b3c4d is not an ancestor of HEAD (expected)"
run_checker "$WORK/t06" "$WORK/t06.out"
echo "checker exit: $RUN_EXIT; $(total_line "$WORK/t06.out")"
if [ "$RUN_EXIT" -eq 0 ]; then
  echo "verdict: DEFECT CONFIRMED (informational) -- no check reads the batch audited_head;"
  echo "  a batch that claims to judge a tree it never saw passes the phase gate"
  V06="DEFECT CONFIRMED (informational)"
else
  echo "verdict: CAUGHT -- the checker now validates the batch audited_head"
  V06="CAUGHT"
  fail_lines "$WORK/t06.out"
fi
echo ""

# ---------------------------------------------------------------- ADV-P2-07 string rating
echo "=== ADV-P2-07: b1 apothecary rating 8.0 -> JSON string \"7.5\" ==="
build_base "$WORK/t07"
B1="$WORK/t07/$RUNS_REL/vision-review-b1.json"
jq '(.maps[] | select(.slug=="apothecary") | .rating) = "7.5"' "$B1" > "$B1.tmp" && mv "$B1.tmp" "$B1"
echo "mutated rating: $(jq -c '.maps[0].rating' "$B1") (jq type: $(jq -r '.maps[0].rating | type' "$B1"))"
run_checker "$WORK/t07" "$WORK/t07.out"
echo "checker exit: $RUN_EXIT; $(total_line "$WORK/t07.out")"
if [ "$RUN_EXIT" -ne 0 ] && grep -q "P2-b rating for apothecary" "$WORK/t07.out"; then
  echo "verdict: CAUGHT -- P2-b requires a labeled JSON number, so a string rating fails"
  V07="CAUGHT"
  fail_lines "$WORK/t07.out"
else
  echo "verdict: DEFECT -- the checker passed a rating stored as a string"
  REGRESSION=1
  V07="DEFECT (regression)"
fi
echo ""

# ---------------------------------------------------------------- ADV-P2-08 double rating
echo "=== ADV-P2-08: mill rated by b3 (5.5) and by an appended b4 entry (9.0) ==="
build_base "$WORK/t08"
B4="$WORK/t08/$RUNS_REL/vision-review-b4.json"
jq '.maps += [{slug: "mill", rating: 9.0, critical: false, note: "duplicate contradictory rating appended by the adversarial fixture"}]' \
  "$B4" > "$B4.tmp" && mv "$B4.tmp" "$B4"
echo "b4 mill entry: $(jq -c '.maps[] | select(.slug=="mill")' "$B4")"
echo "b3 mill entry: $(jq -c '.maps[] | select(.slug=="mill")' "$WORK/t08/$RUNS_REL/vision-review-b3.json")"
run_checker "$WORK/t08" "$WORK/t08.out"
echo "checker exit: $RUN_EXIT; $(total_line "$WORK/t08.out")"
echo "P2-d mill line (first-match batch is b3): $(grep -E 'P2-d row for mill' "$WORK/t08.out" || echo 'none: P2-d passed mill silently')"
if [ "$RUN_EXIT" -ne 0 ] && grep -q "appears in" "$WORK/t08.out"; then
  echo "verdict: CAUGHT -- P2-a rejects the double rating; note that P2-d alone would take"
  echo "  the first batch (b3) and pass, so only the P2-a count defends the stop rule here"
  V08="CAUGHT"
  fail_lines "$WORK/t08.out"
else
  echo "verdict: DEFECT -- the checker passed one map rated twice with different ratings"
  REGRESSION=1
  V08="DEFECT (regression)"
fi
echo ""

# ---------------------------------------------------------------- summary
echo "=== ADV-P2 summary ==="
echo "ADV-P2-00 control:            $V00"
echo "ADV-P2-01 critical flip (F1): $V01"
echo "ADV-P2-02 judge cell (F1):    $V02"
echo "ADV-P2-03 log no model id:    $V03"
echo "ADV-P2-04 rating drift:       $V04"
echo "ADV-P2-05 duplicate slug:     $V05"
echo "ADV-P2-06 foreign head:       $V06"
echo "ADV-P2-07 string rating:      $V07"
echo "ADV-P2-08 double rating:      $V08"
if [ "$GATE_DEFECT" -eq 1 ] || [ "$REGRESSION" -eq 1 ]; then
  echo "gate verdict: FAIL -- at least one bad record passed the phase gate; fix routes to Red"
  exit 1
fi
echo "gate verdict: PASS -- every gate probe is caught; the informational probes are listed above"
exit 0
