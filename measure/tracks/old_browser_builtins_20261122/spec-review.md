Author model: opencode-go/deepseek-v4.1-flash

## Created 2026-11-22

- Source: the PM decision of 2026-11-22 and the ES2022+ built-in scan of `src/` on 2026-11-22. Due
  2026-11-27, before the Storytime launch of 2026-11-30. The device gate stays.
- Recount by hand with `grep` at commit `b88cb45d`: `structuredClone` 35 calls in 30 files,
  `Array.prototype.at` 8 calls in 5 files, `findLastIndex` 1 call, and `Object.hasOwn` 2 calls. The
  total is 46 hits. The 44 outside `src/apk3d/audio/` belong to this track.
- The scan found zero hits for `findLast`, `toSorted`, `toReversed`, `toSpliced`, `Object.groupBy`,
  `Map.groupBy`, `Promise.withResolvers`, `Array.fromAsync`, and the new Set methods. The named
  false positives are `this.at(` in the two boards, `.at(` with two or more arguments, `z.union(`,
  and the three `Box3.union` calls of `src/render/page.ts`.
- The track owns one behaviour repair, one index repair, one scan, one browser check, and no
  product decision beyond the PM decisions (a) to (c) of `spec.md`.
- Open at creation: task T6k of `audio_game_integration_20261014` removes the two `Object.hasOwn`
  hits. The AC3 scan reports 46 hits until that task lands, and 0 after it. Task T6 of this plan
  records that commit. `test-strategy.md` belongs to the strategy role and is not part of this
  authoring.
