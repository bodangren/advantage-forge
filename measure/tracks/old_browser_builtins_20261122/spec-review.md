Author model: opencode-go/deepseek-v4.1-flash

## Created 2026-11-22

- Source: the PM decision of 2026-11-22 and the ES2022+ built-in scan of `src/` on 2026-11-22. Due
  2026-11-27, before the Storytime launch of 2026-11-30. The device gate stays.
- Recount by hand with `grep` and a balanced-paren probe at `a414b406`: `structuredClone` 35 calls
  in 30 files, `Array.prototype.at` 8 calls in 5 files, `findLastIndex` 1 call, and `Object.hasOwn`
  0 calls (2 before audio T6k `0cc7b5c4`). The current total is 44, and it was 46 at creation.
- The scan found zero hits for `findLast`, `toSorted`, `toReversed`, `toSpliced`, `Object.groupBy`,
  `Map.groupBy`, `Promise.withResolvers`, `Array.fromAsync`, and the new Set methods. The named
  false positives are `this.at(` in the two boards, `.at(` with two or more arguments, `z.union(`,
  and the three `Box3.union` calls of `src/render/page.ts`.
- The track owns one behaviour repair, one index repair, one scan, one browser check, and no
  product decision beyond the PM decisions (a) to (c) of `spec.md`.
- Open at creation: task T6k of `audio_game_integration_20261014` removed the two `Object.hasOwn`
  hits. The AC3 scan starts at 44 hits and never reports that label. `test-strategy.md` belongs to
  the strategy role and is not part of this authoring.

## Amendment after r1 (2026-11-22)

- F1 closed: the recount gives 8 array `.at(` calls, not 9. The command
  `rg -n '\.at\(' src/games/dragon-flight/view2d/game.ts src/games/dragon-rider/view2d/game.ts src/games/spellweavers-run/view/game.ts src/games/spellweavers-run/view2d/game.ts src/storytime/book-pictures.ts`
  prints 8 lines at `a414b406`: `565` in dragon-flight, `591` in dragon-rider, `216` in
  spellweavers-run view, `311` and `429` in its view2d, and `2269`, `3935`, `4558` in
  book-pictures. The per-file breakdown of the finding (2 + 1 + 1 + 1 + 3) also sums to 8. A
  balanced-paren probe of all of `src/` finds 17 single-argument `.at(` calls: these 8, the 8
  `this.at(` tile lookups of the two boards, and one doc comment at `src/sdf/profile.ts:189`. The
  nearest ninth hit is that comment, and it is a false positive. The totals stay 44 track-owned and
  46 at creation. `spec.md` Context and AC2, `plan.md` T2 and T5, and TD-45 list each site by line.
  The 9 of the old AC2 rule 5 was the count of old call sites (8 `.at(` plus 1 `findLastIndex`), and
  AC2 rule 5 now says so.
- F2 closed: this track adds no `tests/old-browser/no-es2022-builtins.test.ts`. It widens
  `tests/apk3d/no-unpolyfilled-builtins.test.ts` (`1f45fcfe`): `SCAN_ROOT` becomes `src/`, the strip
  keeps the line numbers, the missing patterns join the 19-label list, the named exclusions join the
  file (with a rot check), and the two controls join the test. `spec.md` Decisions (c), Scope,
  Exclusions, AC3, AC6, and Scope control, and `plan.md` file list, T3, T5, T6, and T8 name the one
  file. T3 runs the widened file from `measure/runs/old_browser_builtins_20261122/` and T5 commits
  it with the replacements, so the shared suite never sees a failing scan.
- F3 closed: `Object.hasOwn` is fixed in the baseline. Audio task T6k (`0cc7b5c4`) changed
  `src/apk3d/audio/bus.ts` and `src/apk3d/audio/chibi.ts`, and a `grep` of `src/` at `a414b406`
  finds 0 calls. `spec.md` Context, Exclusions, AC3 rule 7, and AC5 rule 1 and `plan.md` T3 and T7
  record T6k as a met prerequisite with the SHA, so the deletion of `Object.hasOwn` in AC5 is
  valid. AC5 stays after the Green replacements.
- F4 closed: `spec.md` AC4 and `plan.md` T8 hold no pinned file count or test count. They require
  the reporter output of the actual run: file count, passed test count, skipped count, exit code 0,
  and the commit that the run tested. The 217-file and 3,299-test line left AC4.
- Checked at `a414b406`: `tests/apk3d/no-unpolyfilled-builtins.test.ts` exists with `SCAN_ROOT` on
  `src/apk3d/audio/`; audio T6k `0cc7b5c4` is in HEAD; a `grep` of `Object.hasOwn` in `src/`
  returns 0; and the five named files hold 8 array `.at(` calls. The line 1 author line is
  unchanged.

## Amendment after r2 (2026-11-23)

- F1 to F4 were withdrawn by the r2 review (baseline `e6027f50`). The count of 8 array `.at(` calls
  stands, and the one-scanner decision stands.
- F5 closed: `spec.md` AC3 rule 3 fixes the strip as one left-to-right pass, and rule 7 adds the
  control table as fixture strings inside the test. The table has six rows, and three of them demand
  a fixed hit and a witness miss: a URL string before a call on the same line, a call inside a
  `${...}` template interpolation, and a call with its argument on the next lines. The witness stays
  in the test as `stripCommentsFirst`, and the two multi-line rows that both scanners catch are
  labelled regression pins. `plan.md` T3 builds the controls, and T6 records the three
  discriminating rows as they pass. Source: audio review A round 6 F2
  (`review-a-a414b40.json`) and audio adversarial round 5 F1 (`adversarial-p3-a414b40.json`).
- F6 closed: the copy under `measure/runs/` is gone. AC3 rule 1 sets
  `ROOT = path.resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')` and
  `SCAN_ROOT = join(ROOT, 'src')`, so the file resolves the repository `src/` only while it stays at
  `tests/apk3d/`. `plan.md` T3 edits the file in place and runs it with
  `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/apk3d/no-unpolyfilled-builtins.test.ts'`,
  writes only `measure/runs/old_browser_builtins_20261122/red-scan.log`, leaves the file modified and
  unstaged through T4, and T5 commits it with the replacements. The r1 F2 sentence about the
  `measure/runs/` copy is superseded.
- Chosen approach: the file is edited and run in place, so no copy exists and no root decision
  remains. The cost is one modified, uncommitted failing test file from T3 to T5. T3 records that
  window, and the orchestrator runs T3 and T5 back to back.
