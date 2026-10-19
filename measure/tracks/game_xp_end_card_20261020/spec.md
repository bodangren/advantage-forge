# Specification: the end card shows the XP that the server awards

## Finding (2026-10-20)

The Primary manual test (run 2, port 3005) found that the end card XP differs from the XP that the
server awards. Examples: Enchanted Library 8 of 9 showed +7 XP, and the server gave +10. Castle
Defense 3 of 25 showed +0 XP, and the server gave +5. The stored XP is correct.

Cause: two XP rules. The end card (monorepo `packages/advantage-play-kit-3d/src/host/results.ts`)
shows `GameResults.xp`. Forge `calculateXP` in `src/apk3d/contracts/results.ts` makes that number
with the old app rule `floor(correctAnswers * accuracy)`. The server rule `calculateGameXP`
(monorepo `packages/domain/src/games/xp.ts`) decides the awarded XP:
`min(10, correctAnswers + 2 at full accuracy + 1 for victory + 1 under 60 s)`.

## Decision

Decision (agreed with the monorepo session, 2026-10-20): way a. The host gives the saved
`xpEarned` to the end card, and the card never shows a client number. There is one rule only.
Way b (a kit copy of the server rule) was refused: a second copy caused this fault, and the kit
does not know the duration that the app sends. Ownership: port-kit.mjs marks the kit `host/` and
`__tests__/` as monorepo-owned, so the monorepo owns the end card. Forge owns the games and
`calculateXP`.

## Acceptance

- No game view or game catalog shows XP (Forge guard test, copied into the monorepo).
- The app end card shows only the `xpEarned` that the server returns (monorepo kit test).
- `scripts/monorepo-sync.ts` runs both tests before it commits a sync.
