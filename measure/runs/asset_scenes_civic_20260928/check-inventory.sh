#!/usr/bin/env bash
# Phase 1 Red checker: civic scenes inventory (track asset_scenes_civic_20260928).
# Targeted Red command: bash measure/runs/asset_scenes_civic_20260928/check-inventory.sh
# Light script: grep/awk/test only. No shots, builds, vitest, or tsc.
# Expected Red state: FAIL because scenes/inventory.md does not exist yet.
# Inventory contract (one markdown table row per slug, single line per row):
#   | <slug> | scenes/maps/<slug>.ts | docs/map-mockups/<slug>.md |
#     docs/map-mockups/<slug>-3q.png | docs/map-mockups/<slug>-top.png |
#     MAPS rating: <n> | <maps note> | judge: no | maker: <family> |
#     inventoried|missing |
# A row whose source is absent in scenes/maps/ must carry `missing` in its state cell.
# No row may carry `rated` in its state cell in Phase 1 (that label belongs to Phase 2).
# A MAPS note may quote the word `rated`; only the state cell counts.
set -uo pipefail
FAILED=0; PASS_COUNT=0; FAIL_COUNT=0; RESULTS=()
pass() { RESULTS+=("PASS: $1"); PASS_COUNT=$((PASS_COUNT + 1)); echo "PASS: $1"; }
fail() { RESULTS+=("FAIL: $1"); FAIL_COUNT=$((FAIL_COUNT + 1)); echo "FAIL: $1"; FAILED=1; }

TRACK_DIR="measure/tracks/asset_scenes_civic_20260928"
INV="$TRACK_DIR/scenes/inventory.md"
TSV="docs/fantasy-world-scene-blueprints.tsv"

echo "=== P1-a: inventory exists with exactly 30 civic P2 rows ==="
if [ ! -f "$INV" ]; then
  fail "P1-a inventory file absent: $INV does not exist"
  echo "=== Total: 1 checks (PASS=$PASS_COUNT, FAIL=$FAIL_COUNT) ==="
  exit 1
fi
pass "P1-a inventory file exists: $INV"

# A3: labeled integer count, never a bare digit match.
ROW_COUNT="$(grep -c 'scenes/maps/' "$INV")"
echo "Inventory data rows: $ROW_COUNT"
if [ "$ROW_COUNT" -eq 30 ] && [ "$ROW_COUNT" -ge 1 ]; then
  pass "P1-a labeled row count equals 30 (Inventory data rows: $ROW_COUNT)"
else
  fail "P1-a labeled row count is $ROW_COUNT, want exactly 30"
fi

# A7: slug set comes from all 30 civic P2 TSV rows; no filtered subset.
SLUGS="$(awk -F'\t' '$2=="civic" && $3=="P2" {sub("locations/civic/", "", $1); print $1}' "$TSV")"
SLUG_COUNT="$(echo "$SLUGS" | grep -c .)"
echo "Civic P2 TSV slug count: $SLUG_COUNT"
if [ "$SLUG_COUNT" -eq 30 ]; then
  pass "P1-a TSV slug set holds 30 civic P2 slugs"
else
  fail "P1-a TSV slug set holds $SLUG_COUNT slugs, want 30"
fi

echo "=== P1-a: slug set equality ==="
SLUG_MISS=0
for s in $SLUGS; do
  if ! grep -q -F "$s" "$INV"; then
    fail "P1-a slug absent from inventory: $s"
    SLUG_MISS=1
  fi
done
if [ "$SLUG_MISS" -eq 0 ]; then
  pass "P1-a all 30 TSV slugs appear in the inventory"
fi

echo "=== P1-b: each row names source, note, mockup JPG, and both shots ==="
PATH_MISS=0
for s in $SLUGS; do
  for f in "scenes/maps/$s.ts" "docs/map-mockups/$s.md" "docs/map-mockups/$s.jpg" "docs/map-mockups/$s-3q.png" "docs/map-mockups/$s-top.png"; do
    if ! grep -q -F "$f" "$INV"; then
      fail "P1-b inventory row for $s does not name $f"
      PATH_MISS=1
    fi
    if [ ! -f "$f" ]; then
      fail "P1-b named path absent on disk: $f"
      PATH_MISS=1
    fi
  done
done
if [ "$PATH_MISS" -eq 0 ]; then
  pass "P1-b all 30 rows name 5 existing paths each"
fi

echo "=== P1-c: MAPS rating, judge field no, maker family ==="
FIELD_MISS=0
for s in $SLUGS; do
  LINE="$(grep -F "$s" "$INV" | head -n 1)"
  case "$LINE" in
    *"MAPS rating:"*) ;;
    *) fail "P1-c row for $s lacks labeled MAPS rating field"; FIELD_MISS=1 ;;
  esac
  case "$LINE" in
    *"judge: no"*) ;;
    *) fail "P1-c row for $s lacks independent-judge field judge: no"; FIELD_MISS=1 ;;
  esac
  case "$LINE" in
    *"maker:"*) ;;
    *) fail "P1-c row for $s lacks maker family field"; FIELD_MISS=1 ;;
  esac
done
if [ "$FIELD_MISS" -eq 0 ]; then
  pass "P1-c all 30 rows record MAPS rating, judge: no, and maker family"
fi

echo "=== P1-d: state inventoried, or missing when the source is absent ==="
STATE_MISS=0
for s in $SLUGS; do
  LINE="$(grep -F "scenes/maps/$s.ts" "$INV" | head -n 1)"
  if [ -z "$LINE" ]; then
    fail "P1-d no inventory row holds scenes/maps/$s.ts"
    STATE_MISS=1
    continue
  fi
  if [ ! -f "scenes/maps/$s.ts" ]; then
    case "$LINE" in
      *missing*) pass "P1-d row for $s is missing (source absent)" ;;
      *) fail "P1-d source absent but row for $s lacks missing label"; STATE_MISS=1 ;;
    esac
  else
    case "$LINE" in
      *inventoried*) ;;
      *missing*) fail "P1-d row for $s says missing but its source exists"; STATE_MISS=1 ;;
      *) fail "P1-d row for $s lacks inventoried state"; STATE_MISS=1 ;;
    esac
  fi
done
if [ "$STATE_MISS" -eq 0 ]; then
  pass "P1-d all 30 rows hold inventoried, or missing for an absent source"
fi

echo "=== P1-d: no rated label in the state cell in Phase 1 ==="
RATED_MISS=0
for s in $SLUGS; do
  LINE="$(grep -F "scenes/maps/$s.ts" "$INV" | head -n 1)"
  if [ -z "$LINE" ]; then
    fail "P1-d no inventory row holds scenes/maps/$s.ts"
    RATED_MISS=1
    continue
  fi
  STATE="$(printf '%s' "$LINE" | awk -F'|' '{v=$(NF-1); gsub(/^[ \t]+|[ \t]+$/, "", v); print v}')"
  case "$STATE" in
    inventoried|missing) ;;
    rated) fail "P1-d row for $s carries rated in its state cell; rated belongs to Phase 2"; RATED_MISS=1 ;;
    *) fail "P1-d row for $s holds unknown state cell: $STATE"; RATED_MISS=1 ;;
  esac
done
if [ "$RATED_MISS" -eq 0 ]; then
  pass "P1-d no rated label in the state cell in Phase 1"
fi

echo "=== A9: checker reads the live track path, not an archive ==="
case "$TRACK_DIR:$INV:$TSV" in
  *measure/archive/*) fail "A9 checker reads an archived track path" ;;
  *) pass "A9 checker reads the live track directory" ;;
esac

echo "=== Total: $((PASS_COUNT + FAIL_COUNT)) checks (PASS=$PASS_COUNT, FAIL=$FAIL_COUNT) ==="
exit "$FAILED"
