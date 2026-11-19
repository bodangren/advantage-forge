#!/usr/bin/env bash
# Phase 4 Red checker: civic scenes records (track asset_scenes_civic_20260928).
# Targeted Red command: bash measure/runs/asset_scenes_civic_20260928/check-records.sh
# Light script: grep/awk/jq/git/cmp/node only. No shots, builds, vitest, or tsc.
# Expected Red state: FAIL because the 30 civic P2 TSV rows still read `mockup-needed`,
# the generator still writes the mill without the accepted yaw, and the TSV cites no record.
#
# P4-a: the 30 civic P2 TSV rows hold `accepted` or `follow-up`; none reads `mockup-needed`.
# P4-b: the TSV diff against the phase base changes only the status column; every scene_id
#   is unchanged (values compared, not labels).
# P4-c: each TSV `accepted` row has inventory support: Judge rating >= 7.0 with critical
#   false, or (mill) Rerate >= 7.0 with a non-critical rerate record. Each `follow-up` row
#   has a rating below 7.0, a critical error, or a missing source. The TSV accepted count
#   equals the inventory-supported accepted count (29 rated rows plus the mill rerate).
# P4-d: each TSV status change cites its commit in plan.md; the commit resolves, is an
#   ancestor of HEAD, and touches the TSV.
# P4-e: docs/map-review.html is unchanged against the phase base (a view, not a record).
# P4-f (scoped): the doctor output holds no error line that names asset_scenes_civic_20260928
#   or its files; the total doctor error count is recorded as information only.
#   NOTE: ./measure/doctor.sh reports errors from other tracks today (moved-track links in
#   measure/generated/status.md and asset_p1_* plans, owned elsewhere), so this check does
#   NOT require a green doctor. It requires only that no error line names this track.
# P4-g (carried Phase 3 acceptance N3): scripts/design-mill.mjs must write the accepted yaw.
#   The check runs the generator with its cwd in a temp dir (its writes are relative paths),
#   so the committed scenes/maps/mill.ts is never overwritten, and compares the temp output
#   with the committed file byte for byte.
# Lessons of Phases 1-3: compare values, never scan this script's own text, parse labeled
# cells and typed JSON numbers (never a bare digit scan), and prove git ancestry for commits.
set -uo pipefail
FAILED=0; PASS_COUNT=0; FAIL_COUNT=0; RESULTS=()
pass() { RESULTS+=("PASS: $1"); PASS_COUNT=$((PASS_COUNT + 1)); echo "PASS: $1"; }
fail() { RESULTS+=("FAIL: $1"); FAIL_COUNT=$((FAIL_COUNT + 1)); echo "FAIL: $1"; FAILED=1; }

RUNS="measure/runs/asset_scenes_civic_20260928"
TRACK_DIR="measure/tracks/asset_scenes_civic_20260928"
INV="$TRACK_DIR/scenes/inventory.md"
PLAN="$TRACK_DIR/plan.md"
TSV="docs/fantasy-world-scene-blueprints.tsv"
REVIEW_PAGE="docs/map-review.html"
PHASE_BASE="024cfdf9"
ROLE_BASE="024cfdf9"

# Cell parsers for single-line markdown table rows. No pass/fail here.
state_cell() { printf '%s' "$1" | awk -F'|' '{v=$(NF-1); gsub(/^[ \t]+|[ \t]+$/, "", v); print v}'; }
cell_value() {
  printf '%s' "$1" | awk -F'|' -v label="$2" '{
    for (i=1; i<=NF; i++) { v=$i; gsub(/^[ \t]+|[ \t]+$/, "", v);
      if (index(v, label ":") == 1) { print substr(v, length(label)+2); exit } }
  }' | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//'
}

command -v jq >/dev/null 2>&1 || {
  fail "jq is required to parse rerate JSON"
  echo "=== Total: $((PASS_COUNT + FAIL_COUNT)) checks (PASS=$PASS_COUNT, FAIL=$FAIL_COUNT) ==="
  exit 1
}

echo "=== Base SHAs resolve ==="
if [ -z "$PHASE_BASE" ]; then
  fail "phase_base_sha is missing; refuse to proceed"
  echo "=== Total: $((PASS_COUNT + FAIL_COUNT)) checks (PASS=$PASS_COUNT, FAIL=$FAIL_COUNT) ==="
  exit 1
fi
if [ -z "$ROLE_BASE" ]; then
  fail "role_base_sha is missing; refuse to proceed"
  echo "=== Total: $((PASS_COUNT + FAIL_COUNT)) checks (PASS=$PASS_COUNT, FAIL=$FAIL_COUNT) ==="
  exit 1
fi
if git rev-parse --verify --quiet "$PHASE_BASE" >/dev/null 2>&1; then
  pass "phase_base_sha [$PHASE_BASE] resolves"
else
  fail "phase_base_sha [$PHASE_BASE] does not resolve; refuse to proceed"
  echo "=== Total: $((PASS_COUNT + FAIL_COUNT)) checks (PASS=$PASS_COUNT, FAIL=$FAIL_COUNT) ==="
  exit 1
fi
if git rev-parse --verify --quiet "$ROLE_BASE" >/dev/null 2>&1; then
  pass "role_base_sha [$ROLE_BASE] resolves"
else
  fail "role_base_sha [$ROLE_BASE] does not resolve; refuse to proceed"
  echo "=== Total: $((PASS_COUNT + FAIL_COUNT)) checks (PASS=$PASS_COUNT, FAIL=$FAIL_COUNT) ==="
  exit 1
fi

# A7: the slug set comes from all 30 civic P2 TSV rows; no filtered subset.
SLUGS="$(awk -F'\t' '$2=="civic" && $3=="P2" {sub("locations/civic/", "", $1); print $1}' "$TSV")"
SLUG_COUNT="$(echo "$SLUGS" | grep -c .)"
echo "Civic P2 TSV slug count: $SLUG_COUNT"
if [ "$SLUG_COUNT" -eq 30 ]; then
  pass "P4-a TSV slug set holds 30 civic P2 slugs (Civic P2 TSV slug count: $SLUG_COUNT)"
else
  fail "P4-a TSV slug set holds $SLUG_COUNT slugs, want 30"
fi

tsv_status() { awk -F'\t' -v id="locations/civic/$1" '$1==id {print $4}' "$TSV"; }

echo "=== P4-a: 30 civic P2 TSV rows hold accepted or follow-up ==="
# A3: labeled status values counted per label, never a bare digit scan.
ACCEPTED_COUNT=0; FOLLOW_COUNT=0; STALE_COUNT=0; OTHER_COUNT=0
for s in $SLUGS; do
  ST="$(tsv_status "$s")"
  case "$ST" in
    accepted) ACCEPTED_COUNT=$((ACCEPTED_COUNT + 1)) ;;
    follow-up) FOLLOW_COUNT=$((FOLLOW_COUNT + 1)) ;;
    mockup-needed) STALE_COUNT=$((STALE_COUNT + 1)) ;;
    *) OTHER_COUNT=$((OTHER_COUNT + 1)); fail "P4-a row $s holds unknown TSV status [$ST]" ;;
  esac
done
echo "TSV accepted rows: $ACCEPTED_COUNT"
echo "TSV follow-up rows: $FOLLOW_COUNT"
echo "TSV stale mockup-needed rows: $STALE_COUNT"
if [ "$STALE_COUNT" -eq 0 ] && [ "$OTHER_COUNT" -eq 0 ] \
  && [ "$((ACCEPTED_COUNT + FOLLOW_COUNT))" -eq 30 ]; then
  pass "P4-a all 30 civic P2 rows hold accepted or follow-up (accepted: $ACCEPTED_COUNT, follow-up: $FOLLOW_COUNT)"
else
  fail "P4-a $STALE_COUNT of 30 rows still read mockup-needed (accepted: $ACCEPTED_COUNT, follow-up: $FOLLOW_COUNT)"
fi

echo "=== P4-b: TSV diff changes only the status column; scene_ids unchanged ==="
BASE_IDS="$(git show "$PHASE_BASE:$TSV" | awk -F'\t' '$2=="civic" && $3=="P2" {print $1}' | sort)"
HEAD_IDS="$(awk -F'\t' '$2=="civic" && $3=="P2" {print $1}' "$TSV" | sort)"
if [ "$BASE_IDS" = "$HEAD_IDS" ]; then
  pass "P4-b every civic P2 scene_id is unchanged against $PHASE_BASE"
else
  fail "P4-b civic P2 scene_id set differs against $PHASE_BASE"
  echo "--- base ids ---"; echo "$BASE_IDS"
  echo "--- head ids ---"; echo "$HEAD_IDS"
fi
DIFF_ROWS="$(git diff "$PHASE_BASE"..HEAD -- "$TSV" | grep -E '^[+-][^+-]' | grep -c . || true)"
echo "TSV changed data lines vs $PHASE_BASE: $DIFF_ROWS"
COL_OK=1
while IFS= read -r line; do
  [ -n "$line" ] || continue
  case "$line" in
    ---*|+++*) continue ;;
  esac
  body="${line:1}"
  id="$(printf '%s' "$body" | awk -F'\t' '{print $1}')"
  grp="$(printf '%s' "$body" | awk -F'\t' '{print $2}')"
  pri="$(printf '%s' "$body" | awk -F'\t' '{print $3}')"
  case "$id,$grp,$pri" in
    locations/civic/*,civic,P2) : ;;
    *) fail "P4-b diff touches a non-status field or a non-civic-P2 row: [$body]"; COL_OK=0 ;;
  esac
done < <(git diff "$PHASE_BASE"..HEAD -- "$TSV" | grep -E '^[+-][^+-]' || true)
if [ "$COL_OK" -eq 1 ] && [ "$DIFF_ROWS" -gt 0 ]; then
  pass "P4-b the TSV diff touches only civic P2 rows ($DIFF_ROWS changed lines)"
elif [ "$COL_OK" -eq 1 ]; then
  pass "P4-b the TSV is unchanged against $PHASE_BASE; no non-status edit exists yet"
fi

echo "=== P4-c: accepted rows have inventory support; TSV counts match inventory ==="
if [ ! -f "$INV" ]; then
  fail "P4-c inventory file absent: $INV does not exist"
else
  SUPPORTED=0
  for s in $SLUGS; do
    LINE="$(grep -F "scenes/maps/$s.ts" "$INV" | head -n 1)"
    [ -n "$LINE" ] || { fail "P4-c no inventory row holds scenes/maps/$s.ts"; continue; }
    JR="$(cell_value "$LINE" "Judge rating")"
    JC="$(cell_value "$LINE" "Judge critical")"
    RR="$(cell_value "$LINE" "Rerate")"
    if awk -v r="$JR" 'BEGIN{exit !(r == r && r >= 7.0)}' 2>/dev/null && [ "$JC" = "false" ]; then
      SUPPORTED=$((SUPPORTED + 1))
    elif [ -n "$RR" ] && awk -v r="$RR" 'BEGIN{exit !(r == r && r >= 7.0)}' 2>/dev/null; then
      RF="$RUNS/rerate-$s.json"
      if [ -f "$RF" ] && jq -e '.critical | type == "boolean" and . == false' "$RF" >/dev/null 2>&1 \
        && jq -e '.rating | type == "number" and . >= 7.0' "$RF" >/dev/null 2>&1; then
        SUPPORTED=$((SUPPORTED + 1))
      else
        fail "P4-c row $s claims rerate [$RR] but $RF holds no matching non-critical rating at or above 7.0"
      fi
    fi
  done
  echo "Inventory-supported accepted rows: $SUPPORTED"
  if [ "$SUPPORTED" -eq 30 ]; then
    pass "P4-c inventory supports 30 accepted rows (29 rated Judge >= 7.0 non-critical plus the mill rerate 7.5)"
  else
    fail "P4-c inventory supports $SUPPORTED accepted rows, want 30"
  fi
  if [ "$ACCEPTED_COUNT" -eq "$SUPPORTED" ]; then
    if [ "$ACCEPTED_COUNT" -gt 0 ]; then
      pass "P4-c TSV accepted count [$ACCEPTED_COUNT] equals the inventory-supported count"
    else
      fail "P4-c TSV holds 0 accepted rows while the inventory supports $SUPPORTED; the record update is missing"
    fi
  else
    fail "P4-c TSV accepted count [$ACCEPTED_COUNT] differs from the inventory-supported count [$SUPPORTED]"
  fi
  ROW_OK=1
  for s in $SLUGS; do
    ST="$(tsv_status "$s")"
    LINE="$(grep -F "scenes/maps/$s.ts" "$INV" | head -n 1)"
    [ -n "$LINE" ] || continue
    STATE="$(state_cell "$LINE")"
    case "$ST" in
      accepted)
        case "$STATE" in
          accepted) : ;;
          *) fail "P4-c TSV accepts $s but the inventory state cell reads [$STATE], want [accepted]"; ROW_OK=0 ;;
        esac
        ;;
      follow-up)
        case "$STATE" in
          follow-up) : ;;
          *) fail "P4-c TSV follows up $s but the inventory state cell reads [$STATE], want [follow-up]"; ROW_OK=0 ;;
        esac
        ;;
    esac
  done
  if [ "$ROW_OK" -eq 1 ] && [ "$((ACCEPTED_COUNT + FOLLOW_COUNT))" -eq 30 ]; then
    pass "P4-c every TSV accepted or follow-up row matches its inventory state cell"
  elif [ "$ROW_OK" -eq 1 ]; then
    echo "P4-c no TSV accepted or follow-up row exists yet to cross-check against inventory states"
  fi
fi

echo "=== P4-d: each TSV status change cites its commit in plan.md ==="
CHANGED_SLUGS=""
for s in $SLUGS; do
  OLD="$(git show "$PHASE_BASE:$TSV" | awk -F'\t' -v id="locations/civic/$s" '$1==id {print $4}')"
  NEW="$(tsv_status "$s")"
  if [ "$OLD" != "$NEW" ]; then
    CHANGED_SLUGS="$CHANGED_SLUGS $s"
  fi
done
CHANGED_COUNT="$(echo "$CHANGED_SLUGS" | tr ' ' '\n' | grep -c . || true)"
echo "TSV status changes vs $PHASE_BASE: $CHANGED_COUNT"
if [ "$CHANGED_COUNT" -eq 0 ]; then
  pass "P4-d no TSV status change exists yet, so no plan citation is missing"
else
  for s in $CHANGED_SLUGS; do
    COMMITS="$(grep -oE '\b[0-9a-f]{7,40}\b' "$PLAN" | sort -u)"
    FOUND=""
    for c in $COMMITS; do
      if git merge-base --is-ancestor "$c" HEAD 2>/dev/null \
        && git show --name-only --format= "$c" -- "$TSV" 2>/dev/null | grep -q .; then
        FOUND="$FOUND $c"
      fi
    done
    if [ -n "$FOUND" ]; then
      pass "P4-d status change for $s cites a plan commit that is an ancestor of HEAD and touches the TSV:$FOUND"
    else
      fail "P4-d status change for $s cites no plan commit that is an ancestor of HEAD and touches the TSV"
    fi
  done
fi

echo "=== P4-e: docs/map-review.html is unchanged ==="
if git diff --exit-code "$PHASE_BASE"..HEAD -- "$REVIEW_PAGE" >/dev/null 2>&1; then
  pass "P4-e $REVIEW_PAGE is unchanged against $PHASE_BASE (it stays a view, not a record)"
else
  fail "P4-e $REVIEW_PAGE differs against $PHASE_BASE with no PM decision naming it as the record"
fi

echo "=== P4-f (scoped): doctor holds no error line for this track ==="
DOCTOR_OUT="$(mktemp)"
if bash ./measure/doctor.sh >"$DOCTOR_OUT" 2>&1; then
  DOCTOR_EXIT=0
else
  DOCTOR_EXIT=$?
fi
DOCTOR_ERRORS="$(grep -c '^error' "$DOCTOR_OUT" || true)"
echo "Doctor exit code: $DOCTOR_EXIT"
echo "Doctor error count: $DOCTOR_ERRORS"
CIVIC_ERRORS="$(grep -F 'asset_scenes_civic_20260928' "$DOCTOR_OUT" || true)"
if [ -z "$CIVIC_ERRORS" ]; then
  pass "P4-f doctor output holds no error line for this track (total doctor errors: $DOCTOR_ERRORS, owned elsewhere)"
else
  fail "P4-f doctor output names this track: [$CIVIC_ERRORS]"
fi
rm -f "$DOCTOR_OUT"

echo "=== P4-g (carried N3): the mill generator writes the accepted yaw ==="
if ! command -v node >/dev/null 2>&1; then
  fail "P4-g node is unavailable, so the generator cannot be run into a temp path"
else
  GEN_TMP="$(mktemp -d)"
  mkdir -p "$GEN_TMP/scenes/maps" "$GEN_TMP/docs/map-mockups"
  REPO_TOP="$(git rev-parse --show-toplevel)"
  if (cd "$GEN_TMP" && node "$REPO_TOP/scripts/design-mill.mjs" >/dev/null 2>&1) \
    && [ -f "$GEN_TMP/scenes/maps/mill.ts" ]; then
    if cmp -s "$GEN_TMP/scenes/maps/mill.ts" "$REPO_TOP/scenes/maps/mill.ts"; then
      pass "P4-g generator output equals the committed scenes/maps/mill.ts byte for byte"
    else
      fail "P4-g generator output differs from the committed scenes/maps/mill.ts; the generator still drops the accepted yaw (drift)"
      grep -F "watermill" "$GEN_TMP/scenes/maps/mill.ts" || true
      grep -F "watermill" "$REPO_TOP/scenes/maps/mill.ts" || true
    fi
  else
    fail "P4-g generator run into a temp path produced no mill.ts"
  fi
  rm -rf "$GEN_TMP"
fi
if grep -q "yaw: -65" scripts/design-mill.mjs; then
  pass "P4-g scripts/design-mill.mjs holds the accepted yaw -65 for the watermill"
else
  fail "P4-g scripts/design-mill.mjs holds no yaw -65 for the watermill (it still writes put('watermill', 2.2, -3.4) with no yaw)"
fi

echo "=== A9: checker reads the live track path, not an archive ==="
case "$TRACK_DIR:$INV:$RUNS" in
  *measure/archive/*) fail "A9 checker reads an archived track path" ;;
  *) pass "A9 checker reads the live track directory" ;;
esac

echo "=== Total: $((PASS_COUNT + FAIL_COUNT)) checks (PASS=$PASS_COUNT, FAIL=$FAIL_COUNT) ==="
exit "$FAILED"
