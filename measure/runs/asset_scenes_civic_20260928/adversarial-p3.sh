#!/usr/bin/env bash
# Phase 3 adversarial probes for check-rework.sh (track asset_scenes_civic_20260928).
# Role: measure-adversarial-testing. Light script: git, cp, sed, jq, sha256sum, grep, awk.
# No shots, builds, vitest, or tsc. This script edits no checker, no inventory, no record,
# and no map: every mutation lives in a git fixture tree under /tmp/opencode/adv-p3-civic.
#
# New probes only. Review A at cddadba3 already falsified (fixture M1..M6): a reused shot,
# a shot sha256 mismatch, a 3q elevation of 60, an Anthropic Sonnet rerate judge, a rerate
# judge equal to the rework maker (hy), a second rerate file, a 6.9 rerate marked accepted,
# and an inventory Rerate cell that disagrees with the record. This script does not repeat
# those as gate probes; probe 06 re-verifies the cell-record compare in the flip direction
# (inventory 5.0 against record 7.5) because the brief lists it.
#
# Method: a control git fixture reproduces the committed Phase 3 records with a faithful
# history (base c0, rework commit c1 that touches scenes/maps/mill.ts and both shots,
# records c2, checker c3, rerate audited_head = c1). The control must pass 39 of 39 before
# any probe counts. Each probe then changes exactly one fact, most by copying the control
# fixture (cp -a keeps the git history), and runs the unmodified checker copy from the
# fixture root, so its relative paths and git commands resolve inside the fixture.
#
# Re-audit at fa85bb2a: Red closed ADV-5 (P3-a now verifies the rework commit touches
# its source_paths) and ADV-6 (P3-c now verifies the rerate audited_head descends from
# the rework commit), so the checker grew from 39 to 41 checks. The control no longer
# hardcodes a check count: it compares the faithful fixture against the live checker
# total parsed from the committed-tree run. Probes 01 and 03 now expect CAUGHT.
#
# Probes (brief of 2026-11-19; re-audit expectations at fa85bb2a):
#   ADV-P3-00 control       faithful fixture.        want exit 0, PASS = live total
#   ADV-P3-01 source        rework commit c1 touches only the shots and a stray file,
#                          not scenes/maps/mill.ts.  want exit 1 (ADV-5 fix)
#   ADV-P3-02 side branch   rework record commit = a commit on an unmerged side branch
#                          (resolves, but is not an ancestor of HEAD).  want exit 1
#   ADV-P3-03 stale head    rerate audited_head = c0, which predates the rework commit
#                          (the judge saw the old shots). want exit 1 (ADV-6 fix)
#   ADV-P3-04 model id      rerate log model_id: glm-5.3 while the route model is
#                          kimi-for-coding.                    want exit 1
#   ADV-P3-05 above bar     a second map (bank, judge 7.5, critical false, state rated)
#                          gets a rework record.               want exit 1
#   ADV-P3-06 cell drift    mill inventory Rerate cell 5.0 while the record keeps 7.5.
#                                                                             want exit 1
#   ADV-P3-07 critical      state accepted with Rerate 7.5 while the rerate record holds
#                          critical true.                      want exit 1
#   ADV-P3-08 el boundary   3q elevation 45.0 and 50.0 (want exit 0 each) and 44.9
#                          (want exit 1).
#
# Exit codes: 0 every probe is caught or passes as designed;
#             1 any probe the checker should catch passes instead (regression of the
#               fa85bb2a fix or of an earlier defense), or a boundary case behaves
#               backwards;
#             2 harness failure (the committed-tree gate fails, or the control fixture
#               does not pass with the live checker total).
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$SCRIPT_DIR/../../.." && pwd)"
TRACK_DIR="measure/tracks/asset_scenes_civic_20260928"
RUNS_REL="measure/runs/asset_scenes_civic_20260928"
WORK="/tmp/opencode/adv-p3-civic"

REGRESSION=0

log() { printf '%s\n' "$*"; }

command -v jq >/dev/null 2>&1 || { echo "HARNESS FAIL: jq is required"; exit 2; }

# build_fixture <root> <faithful|source-untouched>
# Builds the git fixture and leaves C0_SHA / C1_SHA set in the caller's scope via the
# files $WORK/c0.last and $WORK/c1.last (a function cannot export conveniently under set -u).
build_fixture() {
  local root="$1" mode="$2"
  rm -rf "$root"
  mkdir -p "$root/docs/map-mockups" "$root/scenes/maps" \
    "$root/$TRACK_DIR/scenes" "$root/$RUNS_REL" || return 1
  cp "$REPO/$TRACK_DIR/scenes/inventory.md" "$root/$TRACK_DIR/scenes/inventory.md" || return 1
  cp "$REPO/docs/fantasy-world-scene-blueprints.tsv" "$root/docs/fantasy-world-scene-blueprints.tsv" || return 1
  cp "$REPO/docs/map-mockups/mill-3q.png" "$root/docs/map-mockups/mill-3q.png" || return 1
  cp "$REPO/docs/map-mockups/mill-top.png" "$root/docs/map-mockups/mill-top.png" || return 1
  # The checker only requires the source file to exist; a stand-in keeps the fixture light.
  printf 'fixture stand-in for the committed scenes/maps/mill.ts\n' > "$root/scenes/maps/mill.ts"
  git init -q "$root" || return 1
  git -C "$root" config user.email "adv@example.invalid"
  git -C "$root" config user.name "adversarial-fixture"
  git -C "$root" add -A || return 1
  git -C "$root" commit -qm "c0 phase base: inventory, TSV, shots, source stand-in" || return 1
  C0="$(git -C "$root" rev-parse HEAD)"
  # c1 rework commit: fresh shots; in faithful mode it also edits the map source.
  printf 'p' >> "$root/docs/map-mockups/mill-3q.png"
  printf 'p' >> "$root/docs/map-mockups/mill-top.png"
  if [ "$mode" = "faithful" ]; then
    printf '\n// rework: watermill yaw -65\n' >> "$root/scenes/maps/mill.ts"
  else
    printf 'stray rework-adjacent file, not a map source\n' > "$root/docs/stray.txt"
  fi
  git -C "$root" add -A || return 1
  git -C "$root" commit -qm "c1 rework: fresh shots (+ source edit in faithful mode)" || return 1
  C1="$(git -C "$root" rev-parse HEAD)"
  SHA3Q="$(sha256sum "$root/docs/map-mockups/mill-3q.png" | awk '{print $1}')"
  SHATOP="$(sha256sum "$root/docs/map-mockups/mill-top.png" | awk '{print $1}')"
  cat > "$root/$RUNS_REL/rework-mill.json" <<EOF
{
  "slug": "mill",
  "maker_route": "opencode-go/hy4-flash-free#high",
  "maker_family": "hy",
  "change": "Fixture rework: yaw the watermill -65 degrees in scenes/maps/mill.ts so the wheel disc faces the three-quarter camera. Same change text as the committed record.",
  "source_paths": ["scenes/maps/mill.ts"],
  "commit": "$C1",
  "shots": [
    { "path": "docs/map-mockups/mill-3q.png", "sha256": "$SHA3Q" },
    { "path": "docs/map-mockups/mill-top.png", "sha256": "$SHATOP" }
  ],
  "cameras": {
    "3q": { "az": 35, "el": 47, "dist": 34 },
    "top": { "az": 0, "el": 86, "dist": 34 }
  }
}
EOF
  jq -e . "$root/$RUNS_REL/rework-mill.json" >/dev/null 2>&1 || return 1
  cat > "$root/$RUNS_REL/rerate-mill.json" <<EOF
{
  "slug": "mill",
  "route": "kimi-code-plan-cn/kimi-for-coding",
  "model_family": "kimi",
  "model_id": "kimi-for-coding",
  "audited_head": "$C1",
  "rating": 7.5,
  "critical": false,
  "note": "Fixture rerate: the wheel now faces the camera; above the 7.0 bar."
}
EOF
  jq -e . "$root/$RUNS_REL/rerate-mill.json" >/dev/null 2>&1 || return 1
  sed -e "s/304a75d6c9a97064e84f4ea5eec54b67ca5daa86/$C1/" \
      -e "s/commit 7619c491/commit $C1/" \
      "$REPO/$RUNS_REL/rerate-mill.log" > "$root/$RUNS_REL/rerate-mill.log" || return 1
  git -C "$root" add -A || return 1
  git -C "$root" commit -qm "c2 records: rework and rerate JSON plus log" || return 1
  cp "$REPO/$RUNS_REL/check-rework.sh" "$root/check-rework.sh" || return 1
  git -C "$root" add -A || return 1
  git -C "$root" commit -qm "c3 checker copy" || return 1
  printf '%s\n%s\n' "$C0" "$C1" > "$WORK/ctrl-shas.txt"
  return 0
}

run_checker() {
  (cd "$1" && bash ./check-rework.sh) > "$2" 2>&1
  RUN_EXIT=$?
}

total_line() { grep -F "=== Total:" "$1" | tail -n 1; }

fail_lines() { grep -E "^FAIL:" "$1" | head -n 8; }

rm -rf "$WORK"
mkdir -p "$WORK"

echo "ADV-P3 adversarial probes for check-rework.sh (asset_scenes_civic_20260928, Phase 3)"
echo "repo: $REPO"
echo "work: $WORK"
echo "committed tree gate first:"
bash "$REPO/$RUNS_REL/check-rework.sh" > "$WORK/committed.out" 2>&1
COMMITTED_EXIT=$?
LIVE_TOTAL="$(total_line "$WORK/committed.out" | grep -oE 'Total: [0-9]+' | grep -oE '[0-9]+')"
echo "  check-rework.sh on the committed tree: exit $COMMITTED_EXIT; $(total_line "$WORK/committed.out")"
echo "  live checker total on the committed tree: $LIVE_TOTAL"
if [ "$COMMITTED_EXIT" -ne 0 ]; then
  echo "HARNESS FAIL: the committed tree gate does not pass; probe results would be void"
  exit 2
fi
echo ""

# ---------------------------------------------------------------- ADV-P3-00 control
echo "=== ADV-P3-00 control: faithful git fixture must pass with the live total ($LIVE_TOTAL of $LIVE_TOTAL) ==="
build_fixture "$WORK/t00" faithful || { echo "HARNESS FAIL: could not build the control fixture"; exit 2; }
run_checker "$WORK/t00" "$WORK/t00.out"
echo "checker exit: $RUN_EXIT; $(total_line "$WORK/t00.out")"
if [ "$RUN_EXIT" -eq 0 ] && total_line "$WORK/t00.out" | grep -q "PASS=$LIVE_TOTAL, FAIL=0"; then
  echo "verdict: CONTROL OK (faithful history reproduces Green at the live total; probes below count)"
else
  echo "verdict: HARNESS FAIL (control did not pass with PASS=$LIVE_TOTAL, FAIL=0; probe results would be void)"
  cat "$WORK/t00.out"
  exit 2
fi
V00="CONTROL OK"
CTRL_C0="$(sed -n 1p "$WORK/ctrl-shas.txt")"
CTRL_C1="$(sed -n 2p "$WORK/ctrl-shas.txt")"
echo ""

# ---------------------------------------------------------------- ADV-P3-01 source untouched
echo "=== ADV-P3-01: rework commit c1 touches no map source (shots + stray file only) ==="
build_fixture "$WORK/t01" source-untouched || { echo "HARNESS FAIL on t01 build"; exit 2; }
P01_C1="$(sed -n 2p "$WORK/ctrl-shas.txt")"
echo "c1 changed files (git show --stat, name only):"
git -C "$WORK/t01" show --name-only --oneline "$P01_C1" | sed 's/^/  /'
echo "c1 touches scenes/maps/mill.ts: $(git -C "$WORK/t01" show --name-only --format= "$P01_C1" -- scenes/maps/mill.ts | grep -c .) (0 = never touched)"
run_checker "$WORK/t01" "$WORK/t01.out"
echo "checker exit: $RUN_EXIT; $(total_line "$WORK/t01.out")"
if [ "$RUN_EXIT" -ne 0 ] && grep -q "touches none of its source_paths" "$WORK/t01.out"; then
  echo "verdict: CAUGHT -- the ADV-5 fix (fa85bb2a) verifies the rework commit touches"
  echo "  its source_paths, so a commit that changed no map source fails the phase gate"
  V01="CAUGHT (ADV-5 closed)"
  fail_lines "$WORK/t01.out"
else
  echo "verdict: DEFECT (regression) -- the checker passed a rework commit that touches"
  echo "  no map source"
  REGRESSION=1
  V01="DEFECT (regression)"
fi
echo ""

# ---------------------------------------------------------------- ADV-P3-02 side branch
echo "=== ADV-P3-02: rework record commit = a side-branch commit, not an ancestor of HEAD ==="
cp -a "$WORK/t00" "$WORK/t02"
BR="$(git -C "$WORK/t02" symbolic-ref --short HEAD)"
git -C "$WORK/t02" checkout -q -b side
printf 'side branch work, never merged\n' > "$WORK/t02/docs/side.txt"
git -C "$WORK/t02" add -A
git -C "$WORK/t02" commit -qm "side: work outside the accepted line"
C_SIDE="$(git -C "$WORK/t02" rev-parse HEAD)"
git -C "$WORK/t02" checkout -q "$BR"
jq --arg c "$C_SIDE" '.commit = $c' "$WORK/t02/$RUNS_REL/rework-mill.json" > "$WORK/t02/$RUNS_REL/rework-mill.json.tmp" &&
  mv "$WORK/t02/$RUNS_REL/rework-mill.json.tmp" "$WORK/t02/$RUNS_REL/rework-mill.json"
echo "record commit: $C_SIDE; resolves: $(git -C "$WORK/t02" rev-parse --verify --quiet "$C_SIDE" >/dev/null && echo yes || echo no); ancestor of HEAD: $(git -C "$WORK/t02" merge-base --is-ancestor "$C_SIDE" HEAD && echo yes || echo no)"
run_checker "$WORK/t02" "$WORK/t02.out"
echo "checker exit: $RUN_EXIT; $(total_line "$WORK/t02.out")"
if [ "$RUN_EXIT" -ne 0 ] && grep -q "is not an ancestor of HEAD" "$WORK/t02.out"; then
  echo "verdict: CAUGHT -- P3-a rejects a rework commit that is not an ancestor of HEAD"
  V02="CAUGHT"
  fail_lines "$WORK/t02.out"
else
  echo "verdict: DEFECT -- the checker passed a rework commit outside the accepted line"
  REGRESSION=1
  V02="DEFECT (regression)"
fi
echo ""

# ---------------------------------------------------------------- ADV-P3-03 stale audited head
echo "=== ADV-P3-03: rerate audited_head = c0, which predates the rework commit ==="
cp -a "$WORK/t00" "$WORK/t03"
jq --arg a "$CTRL_C0" '.audited_head = $a' "$WORK/t03/$RUNS_REL/rerate-mill.json" > "$WORK/t03/$RUNS_REL/rerate-mill.json.tmp" &&
  mv "$WORK/t03/$RUNS_REL/rerate-mill.json.tmp" "$WORK/t03/$RUNS_REL/rerate-mill.json"
sed -i "s/$CTRL_C1/$CTRL_C0/" "$WORK/t03/$RUNS_REL/rerate-mill.log"
echo "audited_head: $CTRL_C0; ancestor of HEAD: $(git -C "$WORK/t03" merge-base --is-ancestor "$CTRL_C0" HEAD && echo yes || echo no); rework commit $CTRL_C1 is an ancestor of the audited_head: $(git -C "$WORK/t03" merge-base --is-ancestor "$CTRL_C1" "$CTRL_C0" && echo yes || echo no) (no = the judge saw the old shots)"
run_checker "$WORK/t03" "$WORK/t03.out"
echo "checker exit: $RUN_EXIT; $(total_line "$WORK/t03.out")"
if [ "$RUN_EXIT" -ne 0 ] && grep -q "predates the rework commit" "$WORK/t03.out"; then
  echo "verdict: CAUGHT -- the ADV-6 fix (fa85bb2a) verifies the rerate audited_head"
  echo "  descends from the rework commit, so a judge who saw the old shots fails the gate"
  V03="CAUGHT (ADV-6 closed)"
  fail_lines "$WORK/t03.out"
else
  echo "verdict: DEFECT (regression) -- the checker passed a rerate that judged the"
  echo "  pre-rework tree"
  REGRESSION=1
  V03="DEFECT (regression)"
fi
echo ""

# ---------------------------------------------------------------- ADV-P3-04 wrong model id
echo "=== ADV-P3-04: rerate log model_id: glm-5.3 while the route model is kimi-for-coding ==="
cp -a "$WORK/t00" "$WORK/t04"
sed -i 's/^model_id: kimi-for-coding$/model_id: glm-5.3/' "$WORK/t04/$RUNS_REL/rerate-mill.log"
echo "log model line: $(grep -E '^model_id:' "$WORK/t04/$RUNS_REL/rerate-mill.log")"
run_checker "$WORK/t04" "$WORK/t04.out"
echo "checker exit: $RUN_EXIT; $(total_line "$WORK/t04.out")"
if [ "$RUN_EXIT" -ne 0 ] && grep -q "differs from the route model" "$WORK/t04.out"; then
  echo "verdict: CAUGHT -- the checker compares the log model_id with the route model"
  V04="CAUGHT"
  fail_lines "$WORK/t04.out"
else
  echo "verdict: DEFECT -- the checker passed a log whose model_id names another model"
  REGRESSION=1
  V04="DEFECT (regression)"
fi
echo ""

# ---------------------------------------------------------------- ADV-P3-05 above-bar rework
echo "=== ADV-P3-05: bank (judge 7.5, critical false, rated) gets a rework record ==="
cp -a "$WORK/t00" "$WORK/t05"
printf 'fixture stand-in for the committed scenes/maps/bank.ts\n' > "$WORK/t05/scenes/maps/bank.ts"
cp "$REPO/docs/map-mockups/bank-3q.png" "$WORK/t05/docs/map-mockups/bank-3q.png"
cp "$REPO/docs/map-mockups/bank-top.png" "$WORK/t05/docs/map-mockups/bank-top.png"
printf 'p' >> "$WORK/t05/docs/map-mockups/bank-3q.png"
printf 'p' >> "$WORK/t05/docs/map-mockups/bank-top.png"
git -C "$WORK/t05" add -A
git -C "$WORK/t05" commit -qm "bank: unnecessary rework commit touching source and shots"
C_BANK="$(git -C "$WORK/t05" rev-parse HEAD)"
B3Q="$(sha256sum "$WORK/t05/docs/map-mockups/bank-3q.png" | awk '{print $1}')"
BTOP="$(sha256sum "$WORK/t05/docs/map-mockups/bank-top.png" | awk '{print $1}')"
cat > "$WORK/t05/$RUNS_REL/rework-bank.json" <<EOF
{
  "slug": "bank",
  "maker_route": "opencode-go/hy4-flash-free#high",
  "maker_family": "hy",
  "change": "Unneeded rework of a map that rated 7.5 in Phase 2: chandelier lift.",
  "source_paths": ["scenes/maps/bank.ts"],
  "commit": "$C_BANK",
  "shots": [
    { "path": "docs/map-mockups/bank-3q.png", "sha256": "$B3Q" },
    { "path": "docs/map-mockups/bank-top.png", "sha256": "$BTOP" }
  ],
  "cameras": {
    "3q": { "az": 35, "el": 47, "dist": 16 },
    "top": { "az": 0, "el": 86, "dist": 14 }
  }
}
EOF
echo "bank inventory row state: $(grep -E '^\| bank \|' "$WORK/t05/$TRACK_DIR/scenes/inventory.md" | grep -oE 'Judge rating: [0-9.]+|Judge critical: [a-z]+|rated$' | tr '\n' ' ')"
run_checker "$WORK/t05" "$WORK/t05.out"
echo "checker exit: $RUN_EXIT; $(total_line "$WORK/t05.out")"
if [ "$RUN_EXIT" -ne 0 ] && grep -q "reworked map bank is not below the bar" "$WORK/t05.out"; then
  echo "verdict: CAUGHT -- P3-a rejects a rework record for a map that is not below the bar"
  V05="CAUGHT"
  fail_lines "$WORK/t05.out"
else
  echo "verdict: DEFECT -- the checker passed a rework record for an above-bar map"
  REGRESSION=1
  V05="DEFECT (regression)"
fi
echo ""

# ---------------------------------------------------------------- ADV-P3-06 Rerate cell drift
echo "=== ADV-P3-06: mill inventory Rerate cell 5.0 while the record keeps 7.5 ==="
cp -a "$WORK/t00" "$WORK/t06"
sed -i -E '/^\| mill \|/ s/Rerate: 7\.5/Rerate: 5.0/' "$WORK/t06/$TRACK_DIR/scenes/inventory.md"
echo "mutated cell: $(grep -E '^\| mill \|' "$WORK/t06/$TRACK_DIR/scenes/inventory.md" | grep -o 'Rerate: [0-9.]*')"
run_checker "$WORK/t06" "$WORK/t06.out"
echo "checker exit: $RUN_EXIT; $(total_line "$WORK/t06.out")"
if [ "$RUN_EXIT" -ne 0 ] && grep -q "inventory Rerate \[5.0\] differs from the rerate record \[7.5\]" "$WORK/t06.out"; then
  echo "verdict: CAUGHT -- P3-e compares the inventory Rerate cell with the rerate record"
  V06="CAUGHT"
  fail_lines "$WORK/t06.out"
else
  echo "verdict: DEFECT -- the checker passed a Rerate cell that contradicts its record"
  REGRESSION=1
  V06="DEFECT (regression)"
fi
echo ""

# ---------------------------------------------------------------- ADV-P3-07 accepted + critical true
echo "=== ADV-P3-07: state accepted with Rerate 7.5 while the rerate record holds critical true ==="
cp -a "$WORK/t00" "$WORK/t07"
jq '.critical = true' "$WORK/t07/$RUNS_REL/rerate-mill.json" > "$WORK/t07/$RUNS_REL/rerate-mill.json.tmp" &&
  mv "$WORK/t07/$RUNS_REL/rerate-mill.json.tmp" "$WORK/t07/$RUNS_REL/rerate-mill.json"
echo "record critical: $(jq -r '.critical' "$WORK/t07/$RUNS_REL/rerate-mill.json"); inventory state cell: $(grep -E '^\| mill \|' "$WORK/t07/$TRACK_DIR/scenes/inventory.md" | awk -F'|' '{v=$(NF-1); gsub(/^[ \t]+|[ \t]+$/, "", v); print v}')"
run_checker "$WORK/t07" "$WORK/t07.out"
echo "checker exit: $RUN_EXIT; $(total_line "$WORK/t07.out")"
if [ "$RUN_EXIT" -ne 0 ] && grep -q "critical \[true\] wants state \[follow-up\]" "$WORK/t07.out"; then
  echo "verdict: CAUGHT -- P3-e sets follow-up whenever the rerate holds a critical error"
  V07="CAUGHT"
  fail_lines "$WORK/t07.out"
else
  echo "verdict: DEFECT -- the checker passed accepted against a critical rerate"
  REGRESSION=1
  V07="DEFECT (regression)"
fi
echo ""

# ---------------------------------------------------------------- ADV-P3-08 elevation boundary
echo "=== ADV-P3-08: 3q elevation boundary 45.0 and 50.0 pass, 44.9 fails ==="
V08="OK"
for case in "45.0:t08a:pass" "50.0:t08b:pass" "44.9:t08c:fail"; do
  EL="${case%%:*}"; rest="${case#*:}"; DIR="${rest%%:*}"; WANT="${rest#*:}"
  cp -a "$WORK/t00" "$WORK/$DIR"
  jq --argjson e "$EL" '.cameras."3q".el = $e' "$WORK/$DIR/$RUNS_REL/rework-mill.json" > "$WORK/$DIR/$RUNS_REL/rework-mill.json.tmp" &&
    mv "$WORK/$DIR/$RUNS_REL/rework-mill.json.tmp" "$WORK/$DIR/$RUNS_REL/rework-mill.json"
  run_checker "$WORK/$DIR" "$WORK/$DIR.out"
  echo "el $EL: checker exit: $RUN_EXIT; $(total_line "$WORK/$DIR.out")"
  if [ "$WANT" = "pass" ] && [ "$RUN_EXIT" -eq 0 ]; then
    echo "  verdict: CAUGHT-BY-NONE (boundary accepted, as the band [45, 50] requires)"
  elif [ "$WANT" = "fail" ] && [ "$RUN_EXIT" -ne 0 ] && grep -q "3q elevation \[44.9\] lies outside \[45, 50\]" "$WORK/$DIR.out"; then
    echo "  verdict: CAUGHT -- the checker rejects 44.9 below the band"
    fail_lines "$WORK/$DIR.out"
  else
    echo "  verdict: DEFECT (regression) -- el $EL behaved against the band requirement [$WANT]"
    REGRESSION=1
    V08="DEFECT (regression at el $EL)"
    fail_lines "$WORK/$DIR.out"
  fi
done
echo ""

# ---------------------------------------------------------------- summary
echo "=== ADV-P3 summary ==="
echo "ADV-P3-00 control:              $V00"
echo "ADV-P3-01 source untouched:     $V01"
echo "ADV-P3-02 side-branch commit:   $V02"
echo "ADV-P3-03 stale audited head:   $V03"
echo "ADV-P3-04 wrong model id:       $V04"
echo "ADV-P3-05 above-bar rework:     $V05"
echo "ADV-P3-06 Rerate cell drift:    $V06"
echo "ADV-P3-07 accepted + critical:   $V07"
echo "ADV-P3-08 el boundary 45/50/44.9: $V08"
if [ "$REGRESSION" -eq 1 ]; then
  echo "gate verdict: FAIL -- at least one probe the checker should catch passed instead"
  exit 1
fi
echo "gate verdict: PASS -- every probe is caught or passes as designed; ADV-5 and ADV-6"
echo "  are closed by fa85bb2a (probes 01 and 03 now fail the gate on their fixtures)"
exit 0
