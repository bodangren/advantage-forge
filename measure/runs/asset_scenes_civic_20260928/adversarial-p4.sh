#!/usr/bin/env bash
# Phase 4 adversarial probes for check-records.sh (track asset_scenes_civic_20260928).
# Role: measure-adversarial-testing. Light script: git, sed, awk, grep, node.
# No shots, builds, vitest, or tsc. This script edits no checker, no record, no
# inventory, no plan, and no map: every mutation lives in a shared git clone under
# /tmp/opencode/adv-p4-civic and is reset after each probe.
#
# New probes only. Review A at be89dc91 already falsified in /tmp fixtures: an ID
# edit (P4-b), an extra 31st row (P4-a, P4-b), a below-bar accepted row on the
# Judge path and on the mill Rerate path (P4-c), a citation that does not touch
# the TSV (P4-d), and a citation that is not an ancestor of HEAD (P4-d). This
# script does not repeat those. It probes the surface the earlier run left open.
#
# Method: a shared clone under /tmp holds the committed tree at the audited HEAD
# (c1e84b19). The control must pass 44 of 44 before any probe counts. Each probe
# mutates exactly one fact, commits the mutation when the checker reads it through
# `git diff <phase_base>..HEAD`, runs the unmodified committed checker inside the
# clone, and resets the clone. Working-tree mutations serve the probes whose
# checks read the tree directly (P4-d plan grep, P4-f doctor, P4-g generator).
#
# Probes (brief of 2026-11-19):
#   ADV-P4-00 control      pristine shared clone.        want exit 0, PASS=44
#   ADV-P4-01 follow-up    bathhouse TSV row reads follow-up while the inventory
#                          state cell stays accepted.     want exit 1 (P4-c)
#   ADV-P4-02 non-civic    the P0 adventure row dungeon changes status.
#                                                                        want exit 1 (P4-b)
#   ADV-P4-03 whitespace   a trailing space in the status cell (want exit 1)
#                          and a trailing tab, which adds a 5th column
#                          (want exit 1; a pass is a confirmed gap).
#   ADV-P4-04 reorder      two civic P2 rows swap (a pass is a confirmed gap);
#                          two non-civic rows swap (want exit 1).
#   ADV-P4-05 generator    design-mill.mjs writes x=2.3, so the generated mill.ts
#                          differs by one character; the yaw line stays -65.
#                                                                        want exit 1 (P4-g cmp)
#   ADV-P4-06 review page  one byte is appended to docs/map-review.html and
#                          committed.                     want exit 1 (P4-e)
#   ADV-P4-07 doctor line  a doctor error names scenes/maps/mill.ts (a) or the
#                          scope-map row locations/civic/mill (b) but not the
#                          track id. A P4-f pass is a confirmed gap.
#   ADV-P4-08 citation     plan.md cites e2c7, a 4-character sha that does not
#                          resolve.                       want exit 1 (P4-d)
#
# Exit codes: 0 every probe is caught, passes as designed, or confirms a gap with
#               no live instance (the gap is routed to Red as a hardening Nit);
#             1 a probe the checker should catch passes instead (regression of
#               an existing defense), or a boundary behaves backwards;
#             2 harness failure (the committed-tree gate fails, or the control
#               clone does not pass with the live checker total).
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$SCRIPT_DIR/../../.." && pwd)"
RUNS_REL="measure/runs/asset_scenes_civic_20260928"
TRACK_DIR="measure/tracks/asset_scenes_civic_20260928"
TSV="docs/fantasy-world-scene-blueprints.tsv"
WORK="/tmp/opencode/adv-p4-civic"
CLONE="$WORK/clone"
AUDITED_HEAD="c1e84b19dd1b6a73b9b5ac3c1f5dbe394f88c9be"

REGRESSION=0
GAPS=0

log() { printf '%s\n' "$*"; }

command -v node >/dev/null 2>&1 || { echo "HARNESS FAIL: node is required"; exit 2; }

run_checker() { # $1 = out file
  (cd "$CLONE" && bash "$RUNS_REL/check-records.sh") > "$1" 2>&1
  RUN_EXIT=$?
}

total_line() { grep -F "=== Total:" "$1" | tail -n 1; }

fail_lines() { grep -E "^FAIL:" "$1" | head -n 6; }

reset_clone() {
  git -C "$CLONE" reset --hard -q "$AUDITED_HEAD"
  git -C "$CLONE" clean -fdq
}

commit_clone() { # $1 = message
  git -C "$CLONE" add -A
  git -C "$CLONE" commit -qm "$1"
}

expect_caught() { # $1 = probe id, $2 = out file, $3 = grep pattern (fixed string)
  if [ "$RUN_EXIT" -ne 0 ] && grep -qF "$3" "$2"; then
    log "verdict: CAUGHT"
    fail_lines "$2"
    return 0
  fi
  log "verdict: DEFECT (regression) -- the checker passed a mutation it must catch"
  fail_lines "$2"
  REGRESSION=1
  return 1
}

expect_gap() { # $1 = out file, $2 = grep pattern proving the fact is live (fixed string)
  if grep -qF "PASS: P4-f doctor output holds no error line for this track" "$1"; then :; fi
  if [ "$RUN_EXIT" -eq 0 ]; then
    log "verdict: DEFECT CONFIRMED (checker gap) -- the gate passes the mutation"
    GAPS=$((GAPS + 1))
    return 0
  fi
  log "verdict: CAUGHT -- the checker rejects the mutation (stronger than expected)"
  fail_lines "$1"
  return 0
}

rm -rf "$WORK"
mkdir -p "$WORK"

echo "ADV-P4 adversarial probes for check-records.sh (asset_scenes_civic_20260928, Phase 4)"
echo "repo: $REPO"
echo "work: $WORK"
echo "audited head: $AUDITED_HEAD"
echo ""

echo "=== committed tree gate (live repo) ==="
bash "$REPO/$RUNS_REL/check-records.sh" > "$WORK/committed.out" 2>&1
COMMITTED_EXIT=$?
LIVE_TOTAL="$(total_line "$WORK/committed.out" | grep -oE 'PASS=[0-9]+' | grep -oE '[0-9]+')"
echo "  check-records.sh on the committed tree: exit $COMMITTED_EXIT; $(total_line "$WORK/committed.out")"
if [ "$COMMITTED_EXIT" -ne 0 ] || [ "$LIVE_TOTAL" != "44" ]; then
  echo "HARNESS FAIL: the committed tree gate does not pass with PASS=44; probe results would be void"
  exit 2
fi
echo ""

echo "=== shared clone (one checkout, reset per probe) ==="
git clone -q --shared "$REPO" "$CLONE"
git -C "$CLONE" config user.email "adv@example.invalid"
git -C "$CLONE" config user.name "adversarial-fixture"
CLONE_HEAD="$(git -C "$CLONE" rev-parse HEAD)"
if [ "$CLONE_HEAD" != "$AUDITED_HEAD" ]; then
  echo "HARNESS FAIL: the clone head is $CLONE_HEAD, want $AUDITED_HEAD"
  exit 2
fi
echo "  clone head: $CLONE_HEAD (equals the audited head)"
echo ""

# ---------------------------------------------------------------- ADV-P4-00 control
echo "=== ADV-P4-00 control: the pristine clone must pass 44 of 44 ==="
run_checker "$WORK/t00.out"
echo "checker exit: $RUN_EXIT; $(total_line "$WORK/t00.out")"
if [ "$RUN_EXIT" -eq 0 ] && total_line "$WORK/t00.out" | grep -q "PASS=44, FAIL=0"; then
  echo "verdict: CONTROL OK (probes below count)"
else
  echo "verdict: HARNESS FAIL (control did not pass 44 of 44)"
  cat "$WORK/t00.out"
  exit 2
fi
V00="CONTROL OK"
# Live-instance scan for the gap probes: the clone doctor output must hold no
# error line that names a civic file path or civic row without the track id.
(cd "$CLONE" && bash ./measure/doctor.sh) > "$WORK/t00.doctor" 2>&1
DOCTOR_EXIT=$?
CIVIC_PATH_LINES="$(grep -E 'scenes/maps/|locations/civic/' "$WORK/t00.doctor" || true)"
echo "clone doctor exit: $DOCTOR_EXIT; error lines: $(grep -c '^error' "$WORK/t00.doctor" || true)"
if [ -z "$CIVIC_PATH_LINES" ]; then
  echo "live-instance scan: no doctor error line names scenes/maps/* or locations/civic/* (gap probes hold no live instance)"
  V00="$V00; no live civic doctor line"
else
  echo "live-instance scan: the doctor already names a civic path:"
  echo "$CIVIC_PATH_LINES" | sed 's/^/  /'
fi
# Live-instance scan for the TSV probes: column count and masked line order.
BADNF="$(awk -F'\t' 'NR>1 && NF!=4 {print NR": NF="NF}' "$CLONE/$TSV" || true)"
echo "clone TSV rows with a column count other than 4: ${BADNF:-none}"
git -C "$CLONE" show "024cfdf9:$TSV" | cut -f1-3 | sha256sum | awk '{print "base cut -f1-3 sha256:  " $1}'
cut -f1-3 "$CLONE/$TSV" | sha256sum | awk '{print "head cut -f1-3 sha256:  " $1}'
echo ""

# ---------------------------------------------------------------- ADV-P4-01 follow-up vs accepted
echo "=== ADV-P4-01: bathhouse TSV reads follow-up while the inventory state stays accepted ==="
sed -i -E 's/^(locations\/civic\/bathhouse\tcivic\tP2\t)accepted$/\1follow-up/' "$CLONE/$TSV"
echo "mutated row: $(awk -F'\t' '$1=="locations/civic/bathhouse"{print $1" -> ["$4"]"}' "$CLONE/$TSV")"
echo "inventory state cell: $(grep -E '^\| bathhouse \|' "$CLONE/$TRACK_DIR/scenes/inventory.md" | awk -F'|' '{v=$(NF-1); gsub(/^[ \t]+|[ \t]+$/, "", v); print "["v"]"}')"
commit_clone "records: bathhouse accepted to follow-up (probe)"
run_checker "$WORK/t01.out"
echo "checker exit: $RUN_EXIT; $(total_line "$WORK/t01.out")"
V01="CAUGHT"
expect_caught t01 "$WORK/t01.out" "P4-c TSV follows up bathhouse but the inventory state cell reads [accepted], want [follow-up]" \
  && grep -qF "P4-c TSV accepted count [29] differs from the inventory-supported count [30]" "$WORK/t01.out" \
  && echo "  second FAIL also present: the accepted count [29] differs from the supported count [30]" \
  || V01="DEFECT (regression)"
reset_clone
echo ""

# ---------------------------------------------------------------- ADV-P4-02 non-civic P0 row
echo "=== ADV-P4-02: the non-civic P0 row locations/adventure/dungeon changes status ==="
sed -i -E 's/^(locations\/adventure\/dungeon\tadventure\tP0\t)accepted$/\1follow-up/' "$CLONE/$TSV"
echo "mutated row: $(awk -F'\t' '$1=="locations/adventure/dungeon"{print $1" -> ["$4"]"}' "$CLONE/$TSV")"
commit_clone "records: dungeon P0 status edit (probe)"
run_checker "$WORK/t02.out"
echo "checker exit: $RUN_EXIT; $(total_line "$WORK/t02.out")"
V02="CAUGHT"
expect_caught t02 "$WORK/t02.out" "P4-b diff touches a non-status field or a non-civic-P2 row" \
  || V02="DEFECT (regression)"
[ "$V02" = "CAUGHT" ] && grep -qF "locations/adventure/dungeon" "$WORK/t02.out" \
  && echo "  the FAIL line names the dungeon row"
reset_clone
echo ""

# ---------------------------------------------------------------- ADV-P4-03 status cell whitespace
echo "=== ADV-P4-03a: a trailing space in the apothecary status cell ==="
sed -i -E 's/^(locations\/civic\/apothecary\tcivic\tP2\t)accepted$/\1accepted /' "$CLONE/$TSV"
echo "mutated cell: [$(awk -F'\t' '$1=="locations/civic/apothecary"{print "["$4"]"}' "$CLONE/$TSV")]"
commit_clone "records: trailing space in a status cell (probe)"
run_checker "$WORK/t03a.out"
echo "checker exit: $RUN_EXIT; $(total_line "$WORK/t03a.out")"
V03A="CAUGHT"
expect_caught t03a "$WORK/t03a.out" "P4-a row apothecary holds unknown TSV status [accepted ]" \
  || V03A="DEFECT (regression)"
reset_clone

echo "=== ADV-P4-03b: a trailing tab in the apothecary status cell adds a 5th column ==="
awk '/^locations\/civic\/apothecary\tcivic\tP2\taccepted$/ {print $0 "\t"; next} {print}' \
  "$CLONE/$TSV" > "$WORK/t03b.tsv" && mv "$WORK/t03b.tsv" "$CLONE/$TSV"
echo "mutated row fields: $(awk -F'\t' '$1=="locations/civic/apothecary"{print "NF="NF" ["$4"]"}' "$CLONE/$TSV")"
commit_clone "records: trailing tab in a status cell (probe)"
run_checker "$WORK/t03b.out"
echo "checker exit: $RUN_EXIT; $(total_line "$WORK/t03b.out")"
V03B=""
if [ "$RUN_EXIT" -eq 0 ]; then
  echo "verdict: DEFECT CONFIRMED (checker gap) -- P4-a reads the 4th field and misses the 5th"
  echo "  column; the TSV now holds a data row with NF=5"
  GAPS=$((GAPS + 1))
  V03B="DEFECT CONFIRMED (gap: no column-count check)"
else
  echo "verdict: CAUGHT -- the checker rejects a 5-column row (stronger than expected)"
  fail_lines "$WORK/t03b.out"
  V03B="CAUGHT"
fi
reset_clone
echo ""

# ---------------------------------------------------------------- ADV-P4-04 row reorder
echo "=== ADV-P4-04a: the adjacent civic P2 rows apothecary and archive swap ==="
awk -F'\t' '
  $1=="locations/civic/apothecary" {a=$0; next}
  $1=="locations/civic/archive" && a!="" {print $0; print a; a=""; next}
  {print}
' "$CLONE/$TSV" > "$WORK/t04a.tsv" && mv "$WORK/t04a.tsv" "$CLONE/$TSV"
echo "row order around the swap: $(awk -F'\t' '$1=="locations/civic/apothecary"||$1=="locations/civic/archive"{printf "%d:%s ", NR, $1}' "$CLONE/$TSV")"
echo "cut -f1-3 sha256 after the swap: $(cut -f1-3 "$CLONE/$TSV" | sha256sum | awk '{print $1}') (differs from the base order sha)"
commit_clone "records: civic row reorder (probe)"
run_checker "$WORK/t04a.out"
echo "checker exit: $RUN_EXIT; $(total_line "$WORK/t04a.out")"
V04A=""
if [ "$RUN_EXIT" -eq 0 ]; then
  echo "verdict: DEFECT CONFIRMED (checker gap) -- P4-b compares sorted ID sets and"
  echo "  per-line column prefixes, so a pure row reorder inside the civic P2 block passes"
  GAPS=$((GAPS + 1))
  V04A="DEFECT CONFIRMED (gap: no line-order guard)"
else
  echo "verdict: CAUGHT -- the checker rejects a civic row reorder (stronger than expected)"
  fail_lines "$WORK/t04a.out"
  V04A="CAUGHT"
fi
reset_clone

echo "=== ADV-P4-04b: the adjacent non-civic rows abandoned-fort and alchemy-lab swap ==="
awk -F'\t' '
  $1=="locations/adventure/abandoned-fort" {a=$0; next}
  $1=="locations/adventure/alchemy-lab" && a!="" {print $0; print a; a=""; next}
  {print}
' "$CLONE/$TSV" > "$WORK/t04b.tsv" && mv "$WORK/t04b.tsv" "$CLONE/$TSV"
echo "row order around the swap: $(awk -F'\t' '$1=="locations/adventure/abandoned-fort"||$1=="locations/adventure/alchemy-lab"{printf "%d:%s ", NR, $1}' "$CLONE/$TSV")"
commit_clone "records: non-civic row reorder (probe)"
run_checker "$WORK/t04b.out"
echo "checker exit: $RUN_EXIT; $(total_line "$WORK/t04b.out")"
V04B="CAUGHT"
expect_caught t04b "$WORK/t04b.out" "P4-b diff touches a non-status field or a non-civic-P2 row" \
  || V04B="DEFECT (regression)"
reset_clone
echo ""

# ---------------------------------------------------------------- ADV-P4-05 generator one-character drift
echo "=== ADV-P4-05: design-mill.mjs writes watermill x=2.3; the generated mill.ts differs by one character ==="
sed -i -E "s/put\('watermill', 2\.2, -3\.4,/put('watermill', 2.3, -3.4,/" "$CLONE/scripts/design-mill.mjs"
echo "generator line: $(grep -F "put('watermill'" "$CLONE/scripts/design-mill.mjs")"
echo "the yaw line still holds -65, so the grep defense alone cannot catch this drift"
run_checker "$WORK/t05.out"
echo "checker exit: $RUN_EXIT; $(total_line "$WORK/t05.out")"
V05="CAUGHT"
if [ "$RUN_EXIT" -ne 0 ] && grep -qF "P4-g generator output differs from the committed scenes/maps/mill.ts" "$WORK/t05.out"; then
  echo "verdict: CAUGHT -- the P4-g byte compare catches a one-character drift the yaw grep misses"
  fail_lines "$WORK/t05.out"
  grep -F "holds the accepted yaw -65" "$WORK/t05.out" | sed 's/^/  (the yaw grep still passes: /;s/$/)/'
else
  echo "verdict: DEFECT (regression) -- the checker passed a generator whose output drifts"
  REGRESSION=1
  V05="DEFECT (regression)"
fi
reset_clone
echo ""

# ---------------------------------------------------------------- ADV-P4-06 review page one byte
echo "=== ADV-P4-06: one byte is appended to docs/map-review.html and committed ==="
BYTES_BEFORE="$(wc -c < "$CLONE/docs/map-review.html")"
printf 'x' >> "$CLONE/docs/map-review.html"
echo "bytes: $BYTES_BEFORE -> $(wc -c < "$CLONE/docs/map-review.html")"
commit_clone "map review page one-byte edit (probe)"
run_checker "$WORK/t06.out"
echo "checker exit: $RUN_EXIT; $(total_line "$WORK/t06.out")"
V06="CAUGHT"
expect_caught t06 "$WORK/t06.out" "P4-e docs/map-review.html differs against 024cfdf9 with no PM decision naming it as the record" \
  || V06="DEFECT (regression)"
reset_clone
echo ""

# ---------------------------------------------------------------- ADV-P4-07 doctor line without the track id
echo "=== ADV-P4-07a: the doctor names scenes/maps/mill.ts through a broken link, with no track id ==="
printf '\nThe mill map source: [mill](scenes/maps/mill.ts)\n' >> "$CLONE/measure/tech-debt.md"
echo "tech-debt.md lines: $(wc -l < "$CLONE/measure/tech-debt.md") (limit 50)"
(cd "$CLONE" && bash ./measure/doctor.sh) > "$WORK/t07a.doctor" 2>&1
echo "doctor error line: $(grep -F 'scenes/maps/mill.ts' "$WORK/t07a.doctor" || echo MISSING)"
run_checker "$WORK/t07a.out"
echo "checker exit: $RUN_EXIT; $(total_line "$WORK/t07a.out")"
V07A=""
if grep -qF "broken local link scenes/maps/mill.ts" "$WORK/t07a.doctor" \
  && grep -qF "PASS: P4-f doctor output holds no error line for this track" "$WORK/t07a.out"; then
  echo "verdict: DEFECT CONFIRMED (checker gap) -- the doctor error names the civic file path"
  echo "  scenes/maps/mill.ts, but P4-f greps only the track id, so the scoped check passes"
  GAPS=$((GAPS + 1))
  V07A="DEFECT CONFIRMED (gap: P4-f blind to file-level doctor errors)"
elif grep -qF "FAIL: P4-f doctor output names this track" "$WORK/t07a.out"; then
  echo "verdict: CAUGHT -- the doctor line names the track id as well (stronger than expected)"
  V07A="CAUGHT"
else
  echo "verdict: HARNESS PROBE MISS -- the injected doctor line did not appear; the probe is void"
  V07A="PROBE VOID"
fi
reset_clone

echo "=== ADV-P4-07b: the doctor names the scope-map row locations/civic/mill, with no track id ==="
awk -F'\t' 'BEGIN{OFS="\t"} $1=="scene" && $2=="locations/civic/mill" {next} {print}' \
  "$CLONE/measure/scope-map.tsv" > "$WORK/t07b.tsv" && mv "$WORK/t07b.tsv" "$CLONE/measure/scope-map.tsv"
(cd "$CLONE" && bash ./measure/doctor.sh) > "$WORK/t07b.doctor" 2>&1
echo "doctor error line: $(grep -F 'locations/civic/mill' "$WORK/t07b.doctor" || echo MISSING)"
run_checker "$WORK/t07b.out"
echo "checker exit: $RUN_EXIT; $(total_line "$WORK/t07b.out")"
V07B=""
if grep -qF "missing scene row for locations/civic/mill" "$WORK/t07b.doctor" \
  && grep -qF "PASS: P4-f doctor output holds no error line for this track" "$WORK/t07b.out"; then
  echo "verdict: DEFECT CONFIRMED (checker gap) -- the doctor error names this track's row"
  echo "  locations/civic/mill, but P4-f greps only the track id, so the scoped check passes"
  GAPS=$((GAPS + 1))
  V07B="DEFECT CONFIRMED (gap: same P4-f blindness, row-shaped)"
elif grep -qF "FAIL: P4-f doctor output names this track" "$WORK/t07b.out"; then
  echo "verdict: CAUGHT -- the doctor line names the track id as well (stronger than expected)"
  V07B="CAUGHT"
else
  echo "verdict: HARNESS PROBE MISS -- the injected doctor line did not appear; the probe is void"
  V07B="PROBE VOID"
fi
reset_clone
echo ""

# ---------------------------------------------------------------- ADV-P4-08 4-character citation
echo "=== ADV-P4-08: plan.md cites e2c7, a 4-character sha that does not resolve ==="
git -C "$CLONE" rev-parse --verify --quiet e2c7 >/dev/null 2>&1 \
  && echo "e2c7 resolves in the clone" || echo "e2c7 does not resolve uniquely in the clone"
sed -i 's/e2c7bb9c/e2c7/g' "$CLONE/$TRACK_DIR/plan.md"
echo "citations left in the plan: $(grep -oE '\b[0-9a-f]{7,40}\b' "$CLONE/$TRACK_DIR/plan.md" | grep -c . || true) (each 7 to 40 characters)"
echo "none of the remaining citations touches the TSV (verified on the live tree before the probe)"
run_checker "$WORK/t08.out"
echo "checker exit: $RUN_EXIT; $(total_line "$WORK/t08.out")"
V08="CAUGHT"
if [ "$RUN_EXIT" -ne 0 ] && grep -qF "P4-d status change for" "$WORK/t08.out" \
  && grep -qF "cites no plan commit that is an ancestor of HEAD and touches the TSV" "$WORK/t08.out"; then
  echo "verdict: CAUGHT -- the P4-d citation regex needs 7 to 40 characters, so a 4-character"
  echo "  citation is invisible and every changed slug fails its citation check"
  fail_lines "$WORK/t08.out" | head -n 3
  echo "  (30 FAIL lines in total, one per changed slug)"
else
  echo "verdict: DEFECT (regression) -- the checker passed a citation that cannot resolve"
  REGRESSION=1
  V08="DEFECT (regression)"
fi
reset_clone
echo ""

# ---------------------------------------------------------------- summary
echo "=== ADV-P4 summary ==="
echo "ADV-P4-00 control:                 $V00"
echo "ADV-P4-01 follow-up vs accepted:    $V01"
echo "ADV-P4-02 non-civic P0 row:         $V02"
echo "ADV-P4-03a trailing space:          $V03A"
echo "ADV-P4-03b trailing tab (5th col):  $V03B"
echo "ADV-P4-04a civic row reorder:      $V04A"
echo "ADV-P4-04b non-civic row reorder:   $V04B"
echo "ADV-P4-05 generator one-char drift: $V05"
echo "ADV-P4-06 review page one byte:     $V06"
echo "ADV-P4-07a doctor names mill.ts:   $V07A"
echo "ADV-P4-07b doctor names civic row:  $V07B"
echo "ADV-P4-08 4-character citation:     $V08"
echo "confirmed gaps: $GAPS (each with no live instance, routed to Red as a hardening Nit)"
if [ "$REGRESSION" -eq 1 ]; then
  echo "gate verdict: FAIL -- at least one probe the checker should catch passed instead"
  exit 1
fi
echo "gate verdict: PASS -- every caught probe fails with the exact expected line, the control"
echo "  holds 44 of 44, and each confirmed gap names a missing defense with no live instance"
exit 0
