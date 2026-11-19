#!/usr/bin/env bash
# Phase 2 Red checker: civic scenes independent review (track asset_scenes_civic_20260928).
# Targeted Red command: bash measure/runs/asset_scenes_civic_20260928/check-review.sh
# Light script: grep/awk/jq/test only. No shots, builds, vitest, or tsc.
# Expected Red state: FAIL because no vision-review-b<N>.json file exists yet.
# Batch contract (one JSON + one log per batch, N = 1..4, about 8 maps each):
#   {batch, route, model_family, maps: [{slug, rating (JSON number 0-10), critical (bool), note}]}
# Inventory contract: each of the 30 civic P2 rows holds state cell `rated` and labeled
#   cells `Judge rating: <n>` and `Judge note: <text>` equal to the batch JSON values.
# Lessons of Phase 1: compare values, not labels; parse the state cell, never substrings;
#   never scan the checker's own text.
set -uo pipefail
FAILED=0; PASS_COUNT=0; FAIL_COUNT=0; RESULTS=()
pass() { RESULTS+=("PASS: $1"); PASS_COUNT=$((PASS_COUNT + 1)); echo "PASS: $1"; }
fail() { RESULTS+=("FAIL: $1"); FAIL_COUNT=$((FAIL_COUNT + 1)); echo "FAIL: $1"; FAILED=1; }

RUNS="measure/runs/asset_scenes_civic_20260928"
TRACK_DIR="measure/tracks/asset_scenes_civic_20260928"
INV="$TRACK_DIR/scenes/inventory.md"
TSV="docs/fantasy-world-scene-blueprints.tsv"

# Cell parsers for single-line markdown table rows. No pass/fail here.
state_cell() { printf '%s' "$1" | awk -F'|' '{v=$(NF-1); gsub(/^[ \t]+|[ \t]+$/, "", v); print v}'; }
cell_value() {
  printf '%s' "$1" | awk -F'|' -v label="$2" '{
    for (i=1; i<=NF; i++) { v=$i; gsub(/^[ \t]+|[ \t]+$/, "", v);
      if (index(v, label ":") == 1) { print substr(v, length(label)+2); exit } }
  }' | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//'
}

command -v jq >/dev/null 2>&1 || {
  fail "jq is required to parse batch JSON"
  echo "=== Total: $((PASS_COUNT + FAIL_COUNT)) checks (PASS=$PASS_COUNT, FAIL=$FAIL_COUNT) ==="
  exit 1
}

# A7: the slug set comes from all 30 civic P2 TSV rows; no filtered subset.
SLUGS="$(awk -F'\t' '$2=="civic" && $3=="P2" {sub("locations/civic/", "", $1); print $1}' "$TSV")"
SLUG_COUNT="$(echo "$SLUGS" | grep -c .)"
echo "Civic P2 TSV slug count: $SLUG_COUNT"

echo "=== P2-a: four batch JSON files and four batch logs exist ==="
BATCH_MISS=0
for n in 1 2 3 4; do
  for ext in json log; do
    if [ -f "$RUNS/vision-review-b$n.$ext" ]; then
      pass "P2-a batch file exists: vision-review-b$n.$ext"
    else
      fail "P2-a batch file absent: $RUNS/vision-review-b$n.$ext does not exist"
      BATCH_MISS=1
    fi
  done
done
if [ "$BATCH_MISS" -ne 0 ]; then
  echo "=== Total: $((PASS_COUNT + FAIL_COUNT)) checks (PASS=$PASS_COUNT, FAIL=$FAIL_COUNT) ==="
  exit 1
fi

echo "=== P2-a: each batch holds about 8 maps ==="
for n in 1 2 3 4; do
  COUNT="$(jq '.maps | length' "$RUNS/vision-review-b$n.json")"
  echo "Batch b$n map count: $COUNT"
  case "$COUNT" in
    ''|*[!0-9]*) fail "P2-a batch b$n holds a non-numeric map count: [$COUNT]"; continue ;;
  esac
  if [ "$COUNT" -ge 6 ] && [ "$COUNT" -le 9 ]; then
    pass "P2-a batch b$n holds $COUNT maps (about 8)"
  else
    fail "P2-a batch b$n holds $COUNT maps, want 6 to 9 (about 8)"
  fi
done

echo "=== P2-a: union holds 30 unique slugs, one rating each ==="
ALL_SLUGS="$(for n in 1 2 3 4; do jq -r '.maps[]?.slug' "$RUNS/vision-review-b$n.json"; done)"
TOTAL="$(echo "$ALL_SLUGS" | grep -c .)"
echo "Batch rating count: $TOTAL"
if [ "$TOTAL" -eq 30 ]; then
  pass "P2-a labeled rating count equals 30 (Batch rating count: $TOTAL)"
else
  fail "P2-a labeled rating count is $TOTAL, want exactly 30"
fi
UNIQ="$(echo "$ALL_SLUGS" | sort -u | grep -c .)"
DUPES="$(echo "$ALL_SLUGS" | sort | uniq -d | tr '\n' ' ')"
if [ "$UNIQ" -eq 30 ] && [ -z "${DUPES// }" ]; then
  pass "P2-a 30 ratings cover 30 unique slugs with no duplicate"
else
  fail "P2-a unique slug count is $UNIQ with duplicates [$DUPES], want 30 unique and none repeated"
fi
SLUG_MISS=0
for s in $SLUGS; do
  HITS=0
  for n in 1 2 3 4; do
    HITS=$((HITS + $(jq --arg s "$s" '[.maps[] | select(.slug==$s)] | length' "$RUNS/vision-review-b$n.json")))
  done
  if [ "$HITS" -ne 1 ]; then
    fail "P2-a slug $s appears in $HITS batch entries, want exactly 1"
    SLUG_MISS=1
  fi
done
if [ "$SLUG_MISS" -eq 0 ]; then
  pass "P2-a every TSV slug appears in exactly one batch"
fi

echo "=== P2-b: each rating is a labeled JSON number in [0, 10] ==="
RATING_MISS=0
RATED_OK=0
for s in $SLUGS; do
  FOUND=0
  for n in 1 2 3 4; do
    if jq -e --arg s "$s" '[.maps[] | select(.slug==$s)] | length == 1' "$RUNS/vision-review-b$n.json" >/dev/null 2>&1; then
      FOUND=$n
      break
    fi
  done
  if [ "$FOUND" -eq 0 ]; then
    fail "P2-b slug $s has no batch entry to rate"
    RATING_MISS=1
    continue
  fi
  F="$RUNS/vision-review-b$FOUND.json"
  RATING="$(jq -r --arg s "$s" '.maps[] | select(.slug==$s) | .rating' "$F")"
  echo "Judge rating for $s: $RATING"
  if jq -e --arg s "$s" '.maps[] | select(.slug==$s) | .rating | type == "number" and . >= 0 and . <= 10' "$F" >/dev/null 2>&1; then
    RATED_OK=$((RATED_OK + 1))
  else
    fail "P2-b rating for $s is [$RATING], want a labeled JSON number in [0, 10]"
    RATING_MISS=1
  fi
  if jq -e --arg s "$s" '.maps[] | select(.slug==$s) | .critical | type == "boolean"' "$F" >/dev/null 2>&1; then
    :
  else
    fail "P2-b entry for $s lacks a boolean critical field"
    RATING_MISS=1
  fi
  NOTE="$(jq -r --arg s "$s" '.maps[] | select(.slug==$s) | .note' "$F")"
  if [ -n "$NOTE" ] && [ "$NOTE" != "null" ]; then
    :
  else
    fail "P2-b entry for $s lacks a note string"
    RATING_MISS=1
  fi
done
echo "Independent judge ratings parsed: $RATED_OK"
if [ "$RATING_MISS" -eq 0 ]; then
  pass "P2-b all 30 ratings are labeled JSON numbers in [0, 10] with a critical flag and a note"
fi

echo "=== P2-c: judge route and family differ from the maker family ==="
FAMILY_MISS=0
for n in 1 2 3 4; do
  FAM="$(jq -r '.model_family' "$RUNS/vision-review-b$n.json")"
  ROUTE="$(jq -r '.route' "$RUNS/vision-review-b$n.json")"
  echo "Batch b$n judge route: $ROUTE"
  echo "Batch b$n judge family: $FAM"
  # .route is the provider/model route printed by `ra-quota pick vision-review`
  # (for example kimi-code-plan-cn/kimi-for-coding). It never names the role.
  if [ -z "$ROUTE" ] || [ "$ROUTE" = "null" ]; then
    fail "P2-c batch b$n records no route"
    FAMILY_MISS=1
    continue
  fi
  case "$ROUTE" in
    */?*)
      pass "P2-c batch b$n route [$ROUTE] is a provider/model string"
      ;;
    *)
      fail "P2-c batch b$n route [$ROUTE] is not a provider/model string"
      FAMILY_MISS=1
      continue
      ;;
  esac
  if [ -z "$FAM" ] || [ "$FAM" = "null" ]; then
    fail "P2-c batch b$n records no model_family"
    FAMILY_MISS=1
    continue
  fi
  LFAM="$(printf '%s' "$FAM" | tr '[:upper:]' '[:lower:]')"
  case "$LFAM" in
    *claude*|*anthropic*|*sonnet*)
      fail "P2-c batch b$n judge family [$FAM] is in the maker/claude family; the judge must differ from the maker (Anthropic Sonnet)"
      FAMILY_MISS=1
      ;;
    *)
      pass "P2-c batch b$n judge family [$FAM] differs from the maker family"
      ;;
  esac
  # The route must agree with the family: a claude-code/* route or a
  # */claude-* model fails even when model_family claims otherwise.
  PROVIDER="$(printf '%s' "$ROUTE" | cut -d/ -f1)"
  MODEL="$(printf '%s' "$ROUTE" | cut -d/ -f2-)"
  LROUTE="$(printf '%s' "$PROVIDER/$MODEL" | tr '[:upper:]' '[:lower:]')"
  case "$LROUTE" in
    *claude*|*anthropic*)
      fail "P2-c batch b$n route [$ROUTE] names the claude/anthropic family; the judge must differ from the maker"
      FAMILY_MISS=1
      ;;
    *)
      pass "P2-c batch b$n route [$ROUTE] agrees with a non-maker family"
      ;;
  esac
  # The log cites the same route string and a model id or model family.
  LOG="$RUNS/vision-review-b$n.log"
  if grep -qF "$ROUTE" "$LOG" && { grep -qF "$MODEL" "$LOG" || grep -qiF "$FAM" "$LOG"; }; then
    pass "P2-c batch b$n log cites its route and a model id or family"
  else
    fail "P2-c batch b$n log does not cite its route and a model id or family"
    FAMILY_MISS=1
  fi
done

echo "=== P2-d: inventory holds 30 rated rows with copied ratings and notes ==="
if [ ! -f "$INV" ]; then
  fail "P2-d inventory file absent: $INV does not exist"
else
  ROW_MISS=0
  RATED_ROWS=0
  for s in $SLUGS; do
    LINE="$(grep -F "scenes/maps/$s.ts" "$INV" | head -n 1)"
    if [ -z "$LINE" ]; then
      fail "P2-d no inventory row holds scenes/maps/$s.ts"
      ROW_MISS=1
      continue
    fi
    STATE="$(state_cell "$LINE")"
    if [ "$STATE" != "rated" ]; then
      fail "P2-d row for $s holds state cell [$STATE], want [rated]"
      ROW_MISS=1
      continue
    fi
    RATED_ROWS=$((RATED_ROWS + 1))
    FOUND=0
    for n in 1 2 3 4; do
      if jq -e --arg s "$s" '[.maps[] | select(.slug==$s)] | length == 1' "$RUNS/vision-review-b$n.json" >/dev/null 2>&1; then
        FOUND=$n
        break
      fi
    done
    if [ "$FOUND" -eq 0 ]; then
      fail "P2-d slug $s has no batch entry to copy from"
      ROW_MISS=1
      continue
    fi
    F="$RUNS/vision-review-b$FOUND.json"
    EXP_R="$(jq -r --arg s "$s" '.maps[] | select(.slug==$s) | .rating' "$F")"
    GOT_R="$(cell_value "$LINE" "Judge rating")"
    if [ -n "$GOT_R" ] && awk -v a="$GOT_R" -v b="$EXP_R" 'BEGIN{exit !(a == b)}' 2>/dev/null; then
      :
    else
      fail "P2-d row for $s holds Judge rating [$GOT_R], want [$EXP_R] from batch b$FOUND"
      ROW_MISS=1
    fi
    EXP_N="$(jq -r --arg s "$s" '.maps[] | select(.slug==$s) | .note' "$F")"
    GOT_N="$(cell_value "$LINE" "Judge note")"
    if [ "$GOT_N" = "$EXP_N" ]; then
      :
    else
      fail "P2-d row for $s holds a Judge note that differs from batch b$FOUND"
      ROW_MISS=1
    fi
  done
  echo "Inventory rated rows: $RATED_ROWS"
  if [ "$ROW_MISS" -eq 0 ]; then
    pass "P2-d all 30 inventory rows hold rated with the batch rating and note"
  fi
fi

echo "=== A9: checker reads the live track path, not an archive ==="
case "$TRACK_DIR:$INV:$RUNS" in
  *measure/archive/*) fail "A9 checker reads an archived track path" ;;
  *) pass "A9 checker reads the live track directory" ;;
esac

echo "=== Total: $((PASS_COUNT + FAIL_COUNT)) checks (PASS=$PASS_COUNT, FAIL=$FAIL_COUNT) ==="
exit "$FAILED"
