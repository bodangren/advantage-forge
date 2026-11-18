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

# Cell parsers for single-line markdown table rows. No pass/fail here.
slug_cell() { printf '%s' "$1" | awk -F'|' '{v=$2; gsub(/^[ \t]+|[ \t]+$/, "", v); print v}'; }
state_cell() { printf '%s' "$1" | awk -F'|' '{v=$(NF-1); gsub(/^[ \t]+|[ \t]+$/, "", v); print v}'; }
cell_value() {
  printf '%s' "$1" | awk -F'|' -v label="$2" '{
    for (i=1; i<=NF; i++) { v=$i; gsub(/^[ \t]+|[ \t]+$/, "", v);
      if (index(v, label ":") == 1) { print substr(v, length(label)+2); exit } }
  }' | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//'
}

# Expected MAPS values per slug: the final row per asset in bench/sonnet/log.tsv
# (rating is the recorded score column, note is the notes column; an empty note is
# recorded as "none recorded"). docs/map-review.html agrees on all 30 rows.
# Embedded because adversarial fixtures carry the checker but not the log.
maps_expected() {
  case "$1" in
    apothecary) EXP_RATING="7.0"; EXP_NOTE="not re-viewed by orchestrator" ;;
    archive) EXP_RATING="7.0"; EXP_NOTE="agent 6.5; orchestrator rated 7.0; corner cupboards crowd edge" ;;
    arena) EXP_RATING="7.0"; EXP_NOTE="agent 7.0 after rebuild with weapon-rack and rock-wall; orchestrator viewed 3q" ;;
    armory) EXP_RATING="7.0"; EXP_NOTE="shots predate one workbench move" ;;
    bakery) EXP_RATING="7.0"; EXP_NOTE="after 1 feedback; 115 pieces; not re-viewed by orchestrator" ;;
    bank) EXP_RATING="7.0"; EXP_NOTE="agent 6.8 after feedback with marble-floor; orchestrator rated 7.0; no teller grille or vault door piece" ;;
    barracks) EXP_RATING="7.0"; EXP_NOTE="not re-viewed by orchestrator" ;;
    bathhouse) EXP_RATING="7.0"; EXP_NOTE="after 1 feedback with sandstone-wall and marble-floor; orchestrator viewed 3q; no steam" ;;
    castle) EXP_RATING="7.0"; EXP_NOTE="after 1 feedback; longhouse roof covers throne corner" ;;
    cathedral) EXP_RATING="7.0"; EXP_NOTE="rework with marble-floor and sandstone-wall; orchestrator viewed 3q; dense pews, dark columns" ;;
    cemetery) EXP_RATING="7.0"; EXP_NOTE="after 1 feedback; dark chapels" ;;
    courthouse) EXP_RATING="7.0"; EXP_NOTE="agent 6.8; orchestrator rated 7.0; all-wood palette" ;;
    general-store) EXP_RATING="7.0"; EXP_NOTE="after 1 feedback; not re-viewed by orchestrator" ;;
    granary) EXP_RATING="7.0"; EXP_NOTE="agent 6.5; orchestrator rated 7.0; no chickens" ;;
    guild-hall) EXP_RATING="7.0"; EXP_NOTE="none recorded" ;;
    inn) EXP_RATING="7.0"; EXP_NOTE="missing hanging lantern" ;;
    library) EXP_RATING="7.0"; EXP_NOTE="commit 19c4f92 says 7.0 after 1 feedback; orchestrator viewed 3q; log row 6.5 was the first pass" ;;
    market-square) EXP_RATING="7.0"; EXP_NOTE="agent 6.5, orchestrator 7.0; palette differs from mockup" ;;
    mill) EXP_RATING="7.0"; EXP_NOTE="agent 6.8; orchestrator rated 7.0; straight river, no sail" ;;
    monastery) EXP_RATING="7.0"; EXP_NOTE="mockup generated after build; chapel and tower are stand-ins" ;;
    palace) EXP_RATING="7.0"; EXP_NOTE="rework with dome-pavilion, sandstone-house; orchestrator viewed 3q; red-roofed gate towers clash" ;;
    prison) EXP_RATING="7.0"; EXP_NOTE="no feedback pass; orchestrator viewed 3q" ;;
    school) EXP_RATING="7.0"; EXP_NOTE="not re-viewed by orchestrator" ;;
    shrine) EXP_RATING="7.0"; EXP_NOTE="none recorded" ;;
    stable) EXP_RATING="7.0"; EXP_NOTE="orchestrator rated 7.0 (agent 6.8); clear stable, dirt ground bare" ;;
    temple) EXP_RATING="7.0"; EXP_NOTE="none recorded" ;;
    theater) EXP_RATING="7.0"; EXP_NOTE="agent 6.5; orchestrator rated 7.0; flat stage, no proscenium" ;;
    town-hall) EXP_RATING="7.0"; EXP_NOTE="orchestrator viewed 3q; separate tower, dark stair dais" ;;
    warehouse) EXP_RATING="7.0"; EXP_NOTE="none recorded" ;;
    watchtower) EXP_RATING="7.0"; EXP_NOTE="rework with rock-wall rise; orchestrator viewed 3q; flat grass lowland" ;;
    *) return 1 ;;
  esac
}

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
    continue
  fi
  ROW="$(grep -F "scenes/maps/$s.ts" "$INV" | head -n 1)"
  if [ -n "$ROW" ] && [ "$(slug_cell "$ROW")" != "$s" ]; then
    fail "P1-a row for $s holds slug cell [$(slug_cell "$ROW")], want [$s]"
    SLUG_MISS=1
  fi
done
if [ "$SLUG_MISS" -eq 0 ]; then
  pass "P1-a all 30 TSV slugs appear in the inventory"
fi

echo "=== P1-b: each row names source, note, mockup JPG, and both shots ==="
PATH_MISS=0
for s in $SLUGS; do
  ROW="$(grep -F "scenes/maps/$s.ts" "$INV" | head -n 1)"
  ROW_STATE="$(state_cell "$ROW")"
  for f in "scenes/maps/$s.ts" "docs/map-mockups/$s.md" "docs/map-mockups/$s.jpg" "docs/map-mockups/$s-3q.png" "docs/map-mockups/$s-top.png"; do
    if ! grep -q -F "$f" "$INV"; then
      fail "P1-b inventory row for $s does not name $f"
      PATH_MISS=1
    fi
    if [ "$ROW_STATE" != "missing" ] && [ ! -f "$f" ]; then
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
  LINE="$(grep -F "scenes/maps/$s.ts" "$INV" | head -n 1)"
  if [ -z "$LINE" ]; then
    fail "P1-c no inventory row holds scenes/maps/$s.ts"
    FIELD_MISS=1
    continue
  fi
  case "$LINE" in
    *"judge: no"*) ;;
    *) fail "P1-c row for $s lacks independent-judge field judge: no"; FIELD_MISS=1 ;;
  esac
  RATING="$(cell_value "$LINE" "MAPS rating")"
  NOTE="$(cell_value "$LINE" "MAPS note")"
  MAKER="$(cell_value "$LINE" "maker")"
  maps_expected "$s" || { fail "P1-c unknown civic P2 slug: $s"; FIELD_MISS=1; continue; }
  case "$RATING" in
    ''|*[!0-9.]*) fail "P1-c row for $s holds a non-numeric MAPS rating: [$RATING]"; FIELD_MISS=1 ;;
    *)
      if awk -v a="$RATING" -v b="$EXP_RATING" 'BEGIN{exit !(a == b)}'; then
        :
      else
        fail "P1-c row for $s holds MAPS rating [$RATING], want [$EXP_RATING] from bench/sonnet/log.tsv"
        FIELD_MISS=1
      fi
      ;;
  esac
  if [ "$NOTE" != "$EXP_NOTE" ]; then
    fail "P1-c row for $s holds a MAPS note that differs from bench/sonnet/log.tsv"
    FIELD_MISS=1
  fi
  case "$MAKER" in
    "Anthropic Sonnet") ;;
    *) fail "P1-c row for $s holds unknown maker family: [$MAKER]; want Anthropic Sonnet"; FIELD_MISS=1 ;;
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
    STATE="$(state_cell "$LINE")"
    case "$STATE" in
      missing) pass "P1-d row for $s is missing (source absent)" ;;
      *) fail "P1-d source absent but the state cell of $s reads [$STATE], want [missing]"; STATE_MISS=1 ;;
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
