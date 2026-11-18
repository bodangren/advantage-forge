#!/usr/bin/env bash
# Phase 1 adversarial probes for check-inventory.sh (track asset_scenes_civic_20260928).
# Role: measure-adversarial-testing. Light script: cp, grep, awk, sed, and test only.
# No shots, builds, vitest, or tsc. This script edits no checker and no inventory.
#
# Method: each probe copies the committed inventory, the committed TSV, and the
# unmodified checker into a fixture tree under /tmp/opencode/adv-p1-civic, stubs the
# 150 named files as empty files (the checker tests path existence only), applies one
# mutation, and runs the checker from the fixture root, so its relative paths resolve
# inside the fixture. The control fixture is the unmutated copy: it must pass 9 of 9,
# which proves that the harness is faithful before any probe counts.
#
# Probes:
#   ADV-P1-00 control           no mutation.                       want checker exit 0
#   ADV-P1-01 rating fraud      MAPS rating 9.9 and a fake note.   gate: want exit 1
#                                 Confirms review-a F1 (P1-c presence-only).
#   ADV-P1-02 family fraud      maker value moved to the claude family.  gate: want exit 1
#                                 Confirms the maker-value slice of review-a F1.
#   ADV-P1-03 state fraud       source absent, note holds the word missing,
#                                 state cell inventoried.          gate: want exit 1
#                                 Confirms review-a F2 (substring match).
#   ADV-P1-04 duplicate rows    watchtower row replaced by a second apothecary row.
#                                                                   want exit 1
#   ADV-P1-05 slug mutation     apothecary renamed apothecarie in slug and paths.
#                                                                   want exit 1
#   ADV-P1-06 slug cell fraud   slug cell mutated, paths untouched.  informational:
#                                 exposes a gap; the verdict does not set the exit code.
#   ADV-P1-07 rated in Phase 1  state cell rated.                   want exit 1
#   ADV-P1-08 judge claim       judge cell claims a claude-family judge rating.
#                                                                   want exit 1
#
# Exit codes: 0 every gate probe is caught (the checker survives every probe);
#             1 a gate probe (01 to 03) passes, or a want-exit-1 probe (04, 05, 07,
#               08) passes;
#             2 harness failure (the control fixture does not pass 9 of 9).
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$SCRIPT_DIR/../../.." && pwd)"
TRACK_DIR="measure/tracks/asset_scenes_civic_20260928"
INV_SRC="$REPO/$TRACK_DIR/scenes/inventory.md"
TSV_SRC="$REPO/docs/fantasy-world-scene-blueprints.tsv"
CHECKER_SRC="$REPO/measure/runs/asset_scenes_civic_20260928/check-inventory.sh"
WORK="/tmp/opencode/adv-p1-civic"

GATE_DEFECT=0
REGRESSION=0

log() { printf '%s\n' "$*"; }

slugs() {
  awk -F'\t' '$2=="civic" && $3=="P2" {sub("locations/civic/", "", $1); print $1}' "$TSV_SRC"
}

# build_base <root>: pristine fixture tree with stub files for every named path.
build_base() {
  local root="$1" s
  rm -rf "$root"
  mkdir -p "$root/$TRACK_DIR/scenes" "$root/docs/map-mockups" "$root/scenes/maps" || return 1
  cp "$INV_SRC" "$root/$TRACK_DIR/scenes/inventory.md" || return 1
  cp "$TSV_SRC" "$root/docs/fantasy-world-scene-blueprints.tsv" || return 1
  cp "$CHECKER_SRC" "$root/check-inventory.sh" || return 1
  for s in $(slugs); do
    : > "$root/scenes/maps/$s.ts"
    : > "$root/docs/map-mockups/$s.md"
    : > "$root/docs/map-mockups/$s.jpg"
    : > "$root/docs/map-mockups/$s-3q.png"
    : > "$root/docs/map-mockups/$s-top.png"
  done
}

# run_checker <root> <outfile>: runs the unmodified checker copy; sets RUN_EXIT.
run_checker() {
  (cd "$1" && bash ./check-inventory.sh) > "$2" 2>&1
  RUN_EXIT=$?
}

total_line() { grep -F "=== Total:" "$1" | tail -n 1; }

fail_lines() { grep -E "^FAIL:" "$1" | head -n 6; }

rm -rf "$WORK"
mkdir -p "$WORK"

echo "ADV-P1 adversarial probes for check-inventory.sh (asset_scenes_civic_20260928, Phase 1)"
echo "repo: $REPO"
echo "work: $WORK"
echo ""

# ---------------------------------------------------------------- ADV-P1-00 control
echo "=== ADV-P1-00 control: unmutated fixture must pass ==="
build_base "$WORK/t00" || { echo "HARNESS FAIL: could not build the control fixture"; exit 2; }
run_checker "$WORK/t00" "$WORK/t00.out"
echo "checker exit: $RUN_EXIT; $(total_line "$WORK/t00.out")"
if [ "$RUN_EXIT" -eq 0 ] && total_line "$WORK/t00.out" | grep -q "PASS=9, FAIL=0"; then
  echo "verdict: CONTROL OK (stub files and copied records reproduce Green; probes below count)"
else
  echo "verdict: HARNESS FAIL (control did not pass 9 of 9; probe results would be void)"
  cat "$WORK/t00.out"
  exit 2
fi
V00="CONTROL OK"
echo ""

# ---------------------------------------------------------------- ADV-P1-01 rating fraud (F1)
echo "=== ADV-P1-01: fabricated MAPS rating and note (review-a F1) ==="
build_base "$WORK/t01"
INV="$WORK/t01/$TRACK_DIR/scenes/inventory.md"
sed -i -E '/^\| apothecary \|/ s/MAPS rating: 7\.0/MAPS rating: 9.9/' "$INV"
sed -i -E '/^\| apothecary \|/ s/MAPS note: not re-viewed by orchestrator/MAPS note: totally fabricated by the maker/' "$INV"
echo "mutated row: $(grep -E '^\| apothecary \|' "$INV")"
run_checker "$WORK/t01" "$WORK/t01.out"
echo "checker exit: $RUN_EXIT; $(total_line "$WORK/t01.out")"
if [ "$RUN_EXIT" -eq 0 ]; then
  echo "verdict: DEFECT CONFIRMED -- the phase gate passes a fabricated MAPS rating and note (P1-c tests label presence only)"
  GATE_DEFECT=1
  V01="DEFECT CONFIRMED (gate)"
else
  echo "verdict: CAUGHT -- the checker now rejects the fabricated rating and note"
  V01="CAUGHT"
  fail_lines "$WORK/t01.out"
fi
echo ""

# ---------------------------------------------------------------- ADV-P1-02 family fraud (F1, maker value)
echo "=== ADV-P1-02: maker value moved to the claude family (review-a F1, family rule) ==="
build_base "$WORK/t02"
INV="$WORK/t02/$TRACK_DIR/scenes/inventory.md"
sed -i -E '/^\| apothecary \|/ s/maker: Anthropic Sonnet/maker: Claude Sonnet 4.5/' "$INV"
echo "mutated row: $(grep -E '^\| apothecary \|' "$INV")"
run_checker "$WORK/t02" "$WORK/t02.out"
echo "checker exit: $RUN_EXIT; $(total_line "$WORK/t02.out")"
if [ "$RUN_EXIT" -eq 0 ]; then
  echo "verdict: DEFECT CONFIRMED -- the maker family value is never validated; a claude-family maker passes P1-c"
  GATE_DEFECT=1
  V02="DEFECT CONFIRMED (gate)"
else
  echo "verdict: CAUGHT -- the checker now rejects the claude-family maker value"
  V02="CAUGHT"
  fail_lines "$WORK/t02.out"
fi
echo ""

# ---------------------------------------------------------------- ADV-P1-03 state fraud (F2)
echo "=== ADV-P1-03: absent source, note holds the word missing, state cell inventoried (review-a F2) ==="
build_base "$WORK/t03"
INV="$WORK/t03/$TRACK_DIR/scenes/inventory.md"
rm "$WORK/t03/scenes/maps/inn.ts"
echo "inn row (unchanged, note holds the word missing): $(grep -E '^\| inn \|' "$INV")"
run_checker "$WORK/t03" "$WORK/t03.out"
echo "checker exit: $RUN_EXIT; $(total_line "$WORK/t03.out")"
echo "P1-b and P1-d lines for inn:"
grep -E "P1-(b|d) .*inn" "$WORK/t03.out" || true
if grep -q "PASS: P1-d row for inn is missing" "$WORK/t03.out"; then
  echo "verdict: DEFECT CONFIRMED -- the absent-source branch matched the substring missing in the"
  echo "  MAPS note while the state cell reads inventoried. Exit $RUN_EXIT comes from the P1-b"
  echo "  path-existence FAIL, not from the state check; the mislabeled row itself passes P1-d."
  GATE_DEFECT=1
  V03="DEFECT CONFIRMED (gate)"
else
  echo "verdict: CAUGHT -- the state check rejects the mislabeled row"
  V03="CAUGHT"
fi
echo ""

# ---------------------------------------------------------------- ADV-P1-04 duplicate rows
echo "=== ADV-P1-04: duplicate rows (watchtower row replaced by a second apothecary row) ==="
build_base "$WORK/t04"
INV="$WORK/t04/$TRACK_DIR/scenes/inventory.md"
awk '/^\| apothecary \|/ {dup=$0} /^\| watchtower \|/ {print dup; next} {print}' "$INV" > "$INV.new" && mv "$INV.new" "$INV"
echo "rows naming scenes/maps/apothecary.ts: $(grep -c 'scenes/maps/apothecary\.ts' "$INV") (want 2)"
echo "rows naming scenes/maps/watchtower.ts: $(grep -c 'scenes/maps/watchtower\.ts' "$INV") (want 0)"
run_checker "$WORK/t04" "$WORK/t04.out"
echo "checker exit: $RUN_EXIT; $(total_line "$WORK/t04.out")"
if [ "$RUN_EXIT" -ne 0 ]; then
  echo "verdict: CAUGHT -- the slug-set and path checks reject the dropped watchtower row"
  V04="CAUGHT"
  fail_lines "$WORK/t04.out"
else
  echo "verdict: DEFECT -- the checker passed a 30-row inventory that dropped watchtower and duplicated apothecary"
  REGRESSION=1
  V04="DEFECT (regression)"
fi
echo ""

# ---------------------------------------------------------------- ADV-P1-05 slug mutation (full)
echo "=== ADV-P1-05: slug ID mutation, slug cell and paths renamed to apothecarie ==="
build_base "$WORK/t05"
INV="$WORK/t05/$TRACK_DIR/scenes/inventory.md"
sed -i -E '/^\| apothecary \|/ s/apothecary/apothecarie/g' "$INV"
echo "mutated row: $(grep -E '^\| apothecarie \|' "$INV")"
run_checker "$WORK/t05" "$WORK/t05.out"
echo "checker exit: $RUN_EXIT; $(total_line "$WORK/t05.out")"
if [ "$RUN_EXIT" -ne 0 ]; then
  echo "verdict: CAUGHT -- the slug-set and path-existence checks reject the mutated ID"
  V05="CAUGHT"
  fail_lines "$WORK/t05.out"
else
  echo "verdict: DEFECT -- the checker passed a row whose slug no longer matches the TSV scene_id"
  REGRESSION=1
  V05="DEFECT (regression)"
fi
echo ""

# ---------------------------------------------------------------- ADV-P1-06 slug cell fraud
echo "=== ADV-P1-06: slug cell mutated to apothecarie, paths untouched (informational) ==="
build_base "$WORK/t06"
INV="$WORK/t06/$TRACK_DIR/scenes/inventory.md"
sed -i -E '/^\| apothecary \|/ s/^\| apothecary \|/| apothecarie |/' "$INV"
echo "mutated row: $(grep -E '^\| apothecarie \|' "$INV")"
run_checker "$WORK/t06" "$WORK/t06.out"
echo "checker exit: $RUN_EXIT; $(total_line "$WORK/t06.out")"
if [ "$RUN_EXIT" -eq 0 ]; then
  echo "verdict: DEFECT CONFIRMED (informational) -- no check parses the Slug cell against the TSV"
  echo "  scene_id; the slug grep matches the row through the intact paths, so a mutated Slug cell passes"
  V06="DEFECT CONFIRMED (informational)"
else
  echo "verdict: CAUGHT -- the checker now validates the Slug cell against the TSV"
  V06="CAUGHT"
  fail_lines "$WORK/t06.out"
fi
echo ""

# ---------------------------------------------------------------- ADV-P1-07 rated in Phase 1
echo "=== ADV-P1-07: rated state cell in Phase 1 ==="
build_base "$WORK/t07"
INV="$WORK/t07/$TRACK_DIR/scenes/inventory.md"
sed -i -E '/^\| apothecary \|/ s/\| inventoried \|$/| rated |/' "$INV"
echo "mutated row: $(grep -E '^\| apothecary \|' "$INV")"
run_checker "$WORK/t07" "$WORK/t07.out"
echo "checker exit: $RUN_EXIT; $(total_line "$WORK/t07.out")"
if [ "$RUN_EXIT" -ne 0 ]; then
  echo "verdict: CAUGHT -- the state-cell parse rejects rated in Phase 1"
  V07="CAUGHT"
  fail_lines "$WORK/t07.out"
else
  echo "verdict: DEFECT -- the checker passed a rated state cell in Phase 1"
  REGRESSION=1
  V07="DEFECT (regression)"
fi
echo ""

# ---------------------------------------------------------------- ADV-P1-08 judge claim
echo "=== ADV-P1-08: judge cell claims a claude-family judge rating in Phase 1 ==="
build_base "$WORK/t08"
INV="$WORK/t08/$TRACK_DIR/scenes/inventory.md"
sed -i -E '/^\| apothecary \|/ s/judge: no/judge: Claude Sonnet 4.5 rated 9.5/' "$INV"
echo "mutated row: $(grep -E '^\| apothecary \|' "$INV")"
run_checker "$WORK/t08" "$WORK/t08.out"
echo "checker exit: $RUN_EXIT; $(total_line "$WORK/t08.out")"
if [ "$RUN_EXIT" -ne 0 ] && grep -q "lacks independent-judge field judge: no" "$WORK/t08.out"; then
  echo "verdict: CAUGHT -- P1-c rejects the claude-family judge claim because the row lacks judge: no"
  V08="CAUGHT"
  fail_lines "$WORK/t08.out"
else
  echo "verdict: DEFECT -- the checker passed a Phase 1 row that claims a claude-family judge rating"
  REGRESSION=1
  V08="DEFECT (regression)"
fi
echo ""

# ---------------------------------------------------------------- summary
echo "=== ADV-P1 summary ==="
echo "ADV-P1-00 control:               $V00"
echo "ADV-P1-01 rating fraud:          $V01"
echo "ADV-P1-02 maker family fraud:    $V02"
echo "ADV-P1-03 state fraud (F2):      $V03"
echo "ADV-P1-04 duplicate rows:        $V04"
echo "ADV-P1-05 slug mutation (full):  $V05"
echo "ADV-P1-06 slug cell fraud:       $V06"
echo "ADV-P1-07 rated in Phase 1:      $V07"
echo "ADV-P1-08 judge claim:           $V08"
if [ "$GATE_DEFECT" -eq 1 ] || [ "$REGRESSION" -eq 1 ]; then
  echo "gate verdict: FAIL -- at least one bad inventory passed the phase gate; fix routes to Red"
  exit 1
fi
echo "gate verdict: PASS -- every gate probe is caught; the informational probes are listed above"
exit 0
