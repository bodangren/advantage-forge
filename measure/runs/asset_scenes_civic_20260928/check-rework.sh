#!/usr/bin/env bash
# Phase 3 Red checker: civic scenes rework + rerate (track asset_scenes_civic_20260928).
# Targeted Red command: bash measure/runs/asset_scenes_civic_20260928/check-rework.sh
# Light script: grep/awk/jq/git/sha256sum only. No shots, builds, vitest, or tsc.
# Expected Red state: FAIL because no rework-mill.json record exists yet.
#
# Record format for the orchestrator to follow:
# - rework record: measure/runs/asset_scenes_civic_20260928/rework-<slug>.json
#   {slug, maker_route, maker_family, change (text), source_paths [..], commit,
#    shots: [{path, sha256}], cameras: {"3q": {az, el, dist}, "top": {az, el, dist}}}.
# - rerate: measure/runs/asset_scenes_civic_20260928/rerate-<slug>.json and .log
#   {slug, route, model_family, audited_head, rating, critical, note}.
# - inventory row: add cells `Rework: <commit>`, `Rerate: <rating>`, and the state
#   cell last as `accepted` (rerate >= 7.0 and not critical) or `follow-up`.
#
# Recency note: shot freshness is proven with `git log` on the shot path, not with
# file mtime, since a checkout resets mtime. A shot counts as fresh only when its
# most recent commit is the rework commit or a descendant of it.
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
  fail "jq is required to parse rework and rerate JSON"
  echo "=== Total: $((PASS_COUNT + FAIL_COUNT)) checks (PASS=$PASS_COUNT, FAIL=$FAIL_COUNT) ==="
  exit 1
}

# The slug set comes from all civic P2 TSV rows; no filtered subset.
SLUGS="$(awk -F'\t' '$2=="civic" && $3=="P2" {sub("locations/civic/", "", $1); print $1}' "$TSV")"
SLUG_COUNT="$(echo "$SLUGS" | grep -c .)"
echo "Civic P2 TSV slug count: $SLUG_COUNT"

echo "=== P3-a: rework set equals the below-bar set ==="
# Below-bar set: Judge rating < 7.0 or Judge critical true, parsed from labeled cells.
BELOW=""
if [ ! -f "$INV" ]; then
  fail "P3-a inventory file absent: $INV does not exist"
else
  for s in $SLUGS; do
    LINE="$(grep -F "scenes/maps/$s.ts" "$INV" | head -n 1)"
    [ -n "$LINE" ] || continue
    JR="$(cell_value "$LINE" "Judge rating")"
    JC="$(cell_value "$LINE" "Judge critical")"
    if awk -v r="$JR" 'BEGIN{exit !(r == r && r < 7.0)}' 2>/dev/null || [ "$JC" = "true" ]; then
      BELOW="$BELOW $s"
    fi
  done
fi
BELOW_COUNT="$(echo "$BELOW" | tr ' ' '\n' | grep -c .)"
echo "Below-bar map count: $BELOW_COUNT"
echo "Below-bar maps:$BELOW"
shopt -s nullglob
REWORK_FILES=("$RUNS"/rework-*.json)
shopt -u nullglob
REWORK_COUNT="${#REWORK_FILES[@]}"
echo "Rework record count: $REWORK_COUNT"
# A4: an empty rework list passes only when no map is below the bar.
if [ "$BELOW_COUNT" -eq 0 ] && [ "$REWORK_COUNT" -eq 0 ]; then
  pass "P3-a no map is below the bar and no rework record exists"
elif [ "$BELOW_COUNT" -gt 0 ] && [ "$REWORK_COUNT" -eq 0 ]; then
  fail "P3-a $BELOW_COUNT map(s) below the bar but Rework record count is 0"
fi
REWORK_SLUGS=""
for f in ${REWORK_FILES[@]+"${REWORK_FILES[@]}"}; do
  base="$(basename "$f" .json)"
  slug="${base#rework-}"
  REWORK_SLUGS="$REWORK_SLUGS $slug"
  REC_SLUG="$(jq -r '.slug // empty' "$f")"
  if [ "$REC_SLUG" = "$slug" ] && [ -n "$REC_SLUG" ]; then
    pass "P3-a record $f names its own slug [$REC_SLUG]"
  else
    fail "P3-a record $f holds slug [$REC_SLUG], want [$slug]"
  fi
done
for s in $BELOW; do
  # shellcheck disable=SC2086
  n=0; for f in ${REWORK_FILES[@]+"${REWORK_FILES[@]}"}; do
    case "$(basename "$f")" in "rework-$s.json") n=$((n+1)) ;; esac
  done
  if [ "$n" -eq 1 ]; then
    pass "P3-a below-bar map $s holds exactly one rework record"
  else
    fail "P3-a below-bar map $s holds $n rework records, want exactly 1"
  fi
done
for slug in $REWORK_SLUGS; do
  hit=0; for s in $BELOW; do [ "$s" = "$slug" ] && hit=1; done
  if [ "$hit" -eq 1 ]; then
    pass "P3-a reworked map $slug is in the below-bar set"
  else
    fail "P3-a reworked map $slug is not below the bar; only below-bar maps get a rework"
  fi
done

echo "=== P3-a: rework record schema and maker agreement ==="
for f in ${REWORK_FILES[@]+"${REWORK_FILES[@]}"}; do
  base="$(basename "$f" .json)"; slug="${base#rework-}"
  MR="$(jq -r '.maker_route // empty' "$f")"
  MF="$(jq -r '.maker_family // empty' "$f")"
  case "$MR" in
    */?*) pass "P3-a $slug maker_route [$MR] is a provider/model string" ;;
    *) fail "P3-a $slug maker_route [$MR] is not a provider/model string"; continue ;;
  esac
  [ -n "$MF" ] && [ "$MF" != "null" ] || { fail "P3-a $slug records no maker_family"; continue; }
  LMF="$(printf '%s' "$MF" | tr '[:upper:]' '[:lower:]')"
  case "$LMF" in
    *claude*|*anthropic*|*sonnet*)
      echo "P3-a $slug maker family: $MF (matches the 2026-10 batch maker; the rerate judge must differ)" ;;
    *) pass "P3-a $slug maker family [$MF] is recorded" ;;
  esac
  LMR="$(printf '%s' "$MR" | tr '[:upper:]' '[:lower:]')"
  FIRST="$(printf '%s' "$LMF" | awk '{print $1}')"
  case "$LMR" in
    *"$FIRST"*) pass "P3-a $slug maker_route [$MR] agrees with maker family [$MF]" ;;
    *) fail "P3-a $slug maker_route [$MR] does not agree with maker family [$MF]" ;;
  esac
  LINE="$(grep -F "scenes/maps/$slug.ts" "$INV" | head -n 1)"
  INVMK="$(cell_value "$LINE" "maker")"
  if [ "$INVMK" = "$MF" ]; then
    pass "P3-a $slug inventory maker [$INVMK] agrees with the rework record"
  else
    fail "P3-a $slug inventory maker [$INVMK] differs from the rework record [$MF]"
  fi
  CHG="$(jq -r '.change // empty' "$f")"
  if [ -n "$CHG" ] && [ "$CHG" != "null" ]; then
    pass "P3-a $slug rework record describes the change"
  else
    fail "P3-a $slug rework record holds no change text"
  fi
  if jq -e '.source_paths | type == "array" and length >= 1' "$f" >/dev/null 2>&1; then
    pass "P3-a $slug rework record lists at least one source path"
  else
    fail "P3-a $slug rework record lists no source_paths array"
  fi
  MISS=0
  while IFS= read -r p; do
    [ -n "$p" ] || continue
    if [ -f "$p" ]; then :; else fail "P3-a $slug source path [$p] does not exist"; MISS=1; fi
  done < <(jq -r '.source_paths[]? // empty' "$f")
  if ! jq -e --arg s "scenes/maps/$slug.ts" '.source_paths | index($s) != null' "$f" >/dev/null 2>&1; then
    fail "P3-a $slug source_paths lacks scenes/maps/$slug.ts"
    MISS=1
  fi
  [ "$MISS" -eq 0 ] && pass "P3-a $slug source paths exist and cover scenes/maps/$slug.ts"
  COMMIT="$(jq -r '.commit // empty' "$f")"
  if git rev-parse --verify --quiet "$COMMIT" >/dev/null 2>&1; then
    if git merge-base --is-ancestor "$COMMIT" HEAD 2>/dev/null; then
      pass "P3-a $slug rework commit [$COMMIT] is an ancestor of HEAD"
    else
      fail "P3-a $slug rework commit [$COMMIT] is not an ancestor of HEAD"
    fi
  else
    fail "P3-a $slug rework commit [$COMMIT] does not resolve"
  fi
  if jq -e '.shots | type == "array" and length == 2' "$f" >/dev/null 2>&1; then
    pass "P3-a $slug rework record lists exactly two shots"
  else
    fail "P3-a $slug rework record must list exactly two shots"
  fi
  if jq -e '.cameras."3q" | type == "object" and (.az|type=="number") and (.el|type=="number") and (.dist|type=="number")' "$f" >/dev/null 2>&1 &&
     jq -e '.cameras.top | type == "object" and (.az|type=="number") and (.el|type=="number") and (.dist|type=="number")' "$f" >/dev/null 2>&1; then
    pass "P3-a $slug rework record holds numeric 3q and top cameras"
  else
    fail "P3-a $slug rework record lacks numeric 3q/top camera triples"
  fi
done

echo "=== P3-b: fresh shots match recorded SHA-256 and git recency; 3q el in [45, 50] ==="
for f in ${REWORK_FILES[@]+"${REWORK_FILES[@]}"}; do
  base="$(basename "$f" .json)"; slug="${base#rework-}"
  COMMIT="$(jq -r '.commit // empty' "$f")"
  for view in 3q top; do
    SHOT="docs/map-mockups/$slug-$view.png"
    if [ -f "$SHOT" ]; then
      pass "P3-b $slug $view shot exists at $SHOT"
    else
      fail "P3-b $slug $view shot absent: $SHOT does not exist"
      continue
    fi
    REC_SHA="$(jq -r --arg p "$SHOT" '.shots[] | select(.path==$p) | .sha256' "$f")"
    ACT_SHA="$(sha256sum "$SHOT" | awk '{print $1}')"
    echo "$slug $view recorded sha256: $REC_SHA"
    echo "$slug $view actual sha256: $ACT_SHA"
    if [ -n "$REC_SHA" ] && [ "$REC_SHA" != "null" ] && [ "$REC_SHA" = "$ACT_SHA" ]; then
      pass "P3-b $slug $view shot matches the recorded sha256"
    else
      fail "P3-b $slug $view shot sha256 [$ACT_SHA] differs from the recorded [$REC_SHA]"
    fi
    # A checkout resets mtime, so recency is proven with git log, not mtime.
    SHOT_COMMIT="$(git log --format=%H -1 -- "$SHOT" 2>/dev/null || true)"
    if [ -z "$SHOT_COMMIT" ]; then
      fail "P3-b $slug $view shot has no commit; commit the fresh shot"
    elif [ "$SHOT_COMMIT" = "$COMMIT" ]; then
      pass "P3-b $slug $view shot was committed with the rework commit"
    elif git merge-base --is-ancestor "$COMMIT" "$SHOT_COMMIT" 2>/dev/null; then
      pass "P3-b $slug $view shot commit is the rework commit or a descendant of it"
    else
      fail "P3-b $slug $view shot commit [$SHOT_COMMIT] predates the rework commit [$COMMIT]; reshoot and commit"
    fi
  done
  EL="$(jq -r '.cameras."3q".el' "$f")"
  echo "$slug 3q camera elevation: $EL"
  if jq -e '.cameras."3q".el | type == "number" and . >= 45 and . <= 50' "$f" >/dev/null 2>&1; then
    pass "P3-b $slug 3q elevation [$EL] lies in [45, 50]"
  else
    fail "P3-b $slug 3q elevation [$EL] lies outside [45, 50]"
  fi
done
if [ "$REWORK_COUNT" -eq 0 ]; then
  fail "P3-b no rework record names shots to verify"
fi

echo "=== P3-c: exactly one rerate with an independent family ==="
shopt -s nullglob
RERATE_FILES=("$RUNS"/rerate-*.json)
shopt -u nullglob
RERATE_COUNT="${#RERATE_FILES[@]}"
echo "Rerate record count: $RERATE_COUNT"
if [ "$REWORK_COUNT" -gt 0 ] && [ "$RERATE_COUNT" -eq "$REWORK_COUNT" ]; then
  pass "P3-c Rerate record count [$RERATE_COUNT] equals Rework record count [$REWORK_COUNT]"
elif [ "$REWORK_COUNT" -eq 0 ]; then
  fail "P3-c no rework record exists, so rerates cannot be checked"
else
  fail "P3-c Rerate record count [$RERATE_COUNT] differs from Rework record count [$REWORK_COUNT]; each reworked map gets exactly one rerate"
fi
for f in ${REWORK_FILES[@]+"${REWORK_FILES[@]}"}; do
  base="$(basename "$f" .json)"; slug="${base#rework-}"
  RF="$RUNS/rerate-$slug.json"
  RL="$RUNS/rerate-$slug.log"
  [ -f "$RF" ] || { fail "P3-c $slug rerate record absent: $RF does not exist"; continue; }
  [ -f "$RL" ] || { fail "P3-c $slug rerate log absent: $RL does not exist"; continue; }
  # shellcheck disable=SC2086
  extras="$(ls "$RUNS"/rerate-$slug-*.json 2>/dev/null | tr '\n' ' ')"
  if [ -n "$extras" ]; then
    fail "P3-c $slug holds extra rerate files [$extras]; exactly one rerate per map"
  else
    pass "P3-c $slug holds exactly one rerate record"
  fi
  RSLUG="$(jq -r '.slug // empty' "$RF")"
  [ "$RSLUG" = "$slug" ] && pass "P3-c $slug rerate record names its own slug" ||
    fail "P3-c $slug rerate record holds slug [$RSLUG]"
  ROUTE="$(jq -r '.route // empty' "$RF")"
  RFAM="$(jq -r '.model_family // empty' "$RF")"
  MF="$(jq -r '.maker_family // empty' "$f")"
  echo "$slug rerate route: $ROUTE"
  echo "$slug rerate family: $RFAM"
  case "$ROUTE" in
    */?*) pass "P3-c $slug rerate route [$ROUTE] is a provider/model string" ;;
    *) fail "P3-c $slug rerate route [$ROUTE] is not a provider/model string"; continue ;;
  esac
  [ -n "$RFAM" ] && [ "$RFAM" != "null" ] || { fail "P3-c $slug rerate records no model_family"; continue; }
  LRFAM="$(printf '%s' "$RFAM" | tr '[:upper:]' '[:lower:]')"
  case "$LRFAM" in
    *claude*|*anthropic*|*sonnet*)
      fail "P3-c $slug rerate family [$RFAM] is in the maker/claude family; the judge must differ from the maker" ;;
    *) pass "P3-c $slug rerate family [$RFAM] lies outside the maker/claude family" ;;
  esac
  if [ "$RFAM" = "$MF" ]; then
    fail "P3-c $slug rerate family [$RFAM] equals the maker family [$MF]"
  else
    pass "P3-c $slug rerate family [$RFAM] differs from the maker family [$MF]"
  fi
  LROUTE="$(printf '%s' "$ROUTE" | tr '[:upper:]' '[:lower:]')"
  case "$LROUTE" in
    *claude*|*anthropic*)
      fail "P3-c $slug rerate route [$ROUTE] names the claude/anthropic family" ;;
    *) pass "P3-c $slug rerate route [$ROUTE] agrees with a non-maker family" ;;
  esac
  FIRST_R="$(printf '%s' "$LRFAM" | awk '{print $1}')"
  case "$LROUTE" in
    *"$FIRST_R"*) pass "P3-c $slug rerate route [$ROUTE] agrees with family [$RFAM]" ;;
    *) fail "P3-c $slug rerate route [$ROUTE] does not agree with family [$RFAM]" ;;
  esac
  MODEL="${ROUTE#*/}"
  MID="$(grep -E '^[[:space:]]*model_id:[[:space:]]*[^[:space:]]' "$RL" | head -n 1 | sed -e 's/^[^:]*:[[:space:]]*//' -e 's/[[:space:]]*$//')"
  if grep -qF "$ROUTE" "$RL" && [ -n "$MID" ]; then
    if [ "$MID" = "$MODEL" ]; then
      pass "P3-c $slug rerate log cites its route and model id [$MID] equal to the route model"
    else
      fail "P3-c $slug rerate log model id [$MID] differs from the route model [$MODEL]"
    fi
  else
    fail "P3-c $slug rerate log does not cite its route and a labeled model_id line"
  fi
  RR="$(jq -r '.rating' "$RF")"
  if jq -e '.rating | type == "number" and . >= 0 and . <= 10' "$RF" >/dev/null 2>&1; then
    pass "P3-c $slug rerate rating [$RR] is a labeled JSON number in [0, 10]"
  else
    fail "P3-c $slug rerate rating [$RR] is not a labeled JSON number in [0, 10]"
  fi
  jq -e '.critical | type == "boolean"' "$RF" >/dev/null 2>&1 &&
    pass "P3-c $slug rerate holds a boolean critical flag" ||
    fail "P3-c $slug rerate lacks a boolean critical flag"
  NOTE="$(jq -r '.note // empty' "$RF")"
  if [ -n "$NOTE" ] && [ "$NOTE" != "null" ]; then
    pass "P3-c $slug rerate holds a note"
  else
    fail "P3-c $slug rerate holds no note"
  fi
  AHEAD="$(jq -r '.audited_head // empty' "$RF")"
  if [ -z "$AHEAD" ]; then
    fail "P3-c $slug rerate records no audited_head"
  elif git rev-parse --verify --quiet "$AHEAD" >/dev/null 2>&1 && git merge-base --is-ancestor "$AHEAD" HEAD 2>/dev/null; then
    pass "P3-c $slug rerate audited_head is an ancestor of HEAD"
  else
    fail "P3-c $slug rerate audited_head [$AHEAD] is not an ancestor of HEAD"
  fi
done
# No rerate may exist for a map that needed no rework.
for rf in ${RERATE_FILES[@]+"${RERATE_FILES[@]}"}; do
  base="$(basename "$rf" .json)"; slug="${base#rerate-}"
  hit=0; for s in $BELOW; do [ "$s" = "$slug" ] && hit=1; done
  [ "$hit" -eq 1 ] || fail "P3-c rerate for $slug has no below-bar map; only reworked maps get a rerate"
done

echo "=== P3-d: stop rule, at most three ratings per slug ==="
for s in $SLUGS; do
  # shellcheck disable=SC2086
  n=0; for rf in ${RERATE_FILES[@]+"${RERATE_FILES[@]}"}; do
    case "$(basename "$rf")" in "rerate-$s.json") n=$((n+1)) ;; "rerate-$s-"*) n=$((n+2)) ;; esac
  done
  total=$((2 + n))
  if [ "$total" -le 3 ]; then
    :;
  else
    fail "P3-d $s holds $total ratings (MAPS, Judge, plus $n rerates); at most three ratings exist per slug"
  fi
done
DEDUP_OK=1
for s in $BELOW; do
  # shellcheck disable=SC2086
  c=0; for rf in ${RERATE_FILES[@]+"${RERATE_FILES[@]}"}; do
    case "$(basename "$rf")" in "rerate-$s"*) c=$((c+1)) ;; esac
  done
  if [ "$c" -gt 1 ]; then fail "P3-d $s holds $c rerate files; the plan allows one rerate"; DEDUP_OK=0; fi
done
[ "$DEDUP_OK" -eq 1 ] && [ -n "$BELOW" ] && [ "$RERATE_COUNT" -gt 0 ] &&
  pass "P3-d every reworked map holds at most one rerate (three ratings at most)"
if [ "$RERATE_COUNT" -eq 0 ]; then
  fail "P3-d no rerate exists, so the stop rule cannot be verified"
fi

echo "=== P3-e: accepted only with a rerate at or above 7.0; untouched rows stay rated ==="
if [ ! -f "$INV" ]; then
  fail "P3-e inventory file absent: $INV does not exist"
else
  for f in ${REWORK_FILES[@]+"${REWORK_FILES[@]}"}; do
    base="$(basename "$f" .json)"; slug="${base#rework-}"
    LINE="$(grep -F "scenes/maps/$slug.ts" "$INV" | head -n 1)"
    [ -n "$LINE" ] || { fail "P3-e no inventory row holds scenes/maps/$slug.ts"; continue; }
    STATE="$(state_cell "$LINE")"
    RRV="$(cell_value "$LINE" "Rerate")"
    RF="$RUNS/rerate-$slug.json"
    if [ -f "$RF" ]; then
      EXP_R="$(jq -r '.rating' "$RF")"
      EXP_C="$(jq -r '.critical' "$RF")"
    else
      EXP_R=""; EXP_C=""
    fi
    echo "$slug inventory Rerate cell: [$RRV], state cell: [$STATE]"
    if [ -z "$RRV" ]; then
      fail "P3-e $slug inventory holds no Rerate cell"
      continue
    fi
    if ! awk -v a="$RRV" -v b="$EXP_R" 'BEGIN{exit !(a == b)}' 2>/dev/null; then
      fail "P3-e $slug inventory Rerate [$RRV] differs from the rerate record [$EXP_R]"
      continue
    fi
    if awk -v r="$EXP_R" 'BEGIN{exit !(r >= 7.0)}' 2>/dev/null && [ "$EXP_C" = "false" ]; then
      if [ "$STATE" = "accepted" ]; then
        pass "P3-e $slug rerate [$EXP_R] reaches 7.0 with no critical error, state accepted"
      else
        fail "P3-e $slug rerate [$EXP_R] reaches 7.0 with no critical error but state is [$STATE], want [accepted]"
      fi
    else
      if [ "$STATE" = "follow-up" ]; then
        pass "P3-e $slug rerate [$EXP_R] critical [$EXP_C] sets follow-up"
      else
        fail "P3-e $slug rerate [$EXP_R] critical [$EXP_C] wants state [follow-up], found [$STATE]"
      fi
    fi
    if [ "$STATE" = "accepted" ]; then
      if awk -v r="$RRV" 'BEGIN{exit !(r >= 7.0)}' 2>/dev/null; then
        pass "P3-e $slug accepted row holds a rating at or above 7.0"
      else
        fail "P3-e $slug holds accepted with a rating below 7.0"
      fi
    fi
  done
  if [ "$REWORK_COUNT" -eq 0 ]; then
    fail "P3-e no reworked row carries a Rerate cell and an accepted or follow-up state"
  fi
  for s in $SLUGS; do
    hit=0; for b in $BELOW; do [ "$s" = "$b" ] && hit=1; done
    [ "$hit" -eq 0 ] || continue
    LINE="$(grep -F "scenes/maps/$s.ts" "$INV" | head -n 1)"
    [ -n "$LINE" ] || continue
    STATE="$(state_cell "$LINE")"
    if [ "$STATE" = "rated" ]; then
      :;
    else
      fail "P3-e $s needed no rework but holds state [$STATE]; rows that need no rework keep rated in Phase 3"
    fi
  done
  UNTOUCHED_OK=1
  for s in $SLUGS; do
    hit=0; for b in $BELOW; do [ "$s" = "$b" ] && hit=1; done
    [ "$hit" -eq 0 ] || continue
    LINE="$(grep -F "scenes/maps/$s.ts" "$INV" | head -n 1)"
    [ -n "$LINE" ] || { UNTOUCHED_OK=0; continue; }
    [ "$(state_cell "$LINE")" = "rated" ] || UNTOUCHED_OK=0
  done
  [ "$UNTOUCHED_OK" -eq 1 ] && pass "P3-e every row that needs no rework keeps rated in Phase 3"
fi

echo "=== A9: checker reads the live track path, not an archive ==="
case "$TRACK_DIR:$INV:$RUNS" in
  *measure/archive/*) fail "A9 checker reads an archived track path" ;;
  *) pass "A9 checker reads the live track directory" ;;
esac

echo "=== Total: $((PASS_COUNT + FAIL_COUNT)) checks (PASS=$PASS_COUNT, FAIL=$FAIL_COUNT) ==="
exit "$FAILED"
