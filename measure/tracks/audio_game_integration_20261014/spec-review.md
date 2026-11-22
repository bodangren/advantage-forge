Author model: opencode-go/deepseek-v4.1-flash

## Amendment 2026-11-22

Scope: `spec.md`, `plan.md`, and `metadata.json` only. No implementation, no test, no game change.

- The "Owner decisions needed before the work starts" section became a decisions table with the
  four PM decisions of 2026-11-22: (a) the earshot set is the first source and the synth recipe
  stays the fallback, (b) the wrapper writes an MP3 copy and the game picks a format per browser,
  (c) the set needs no credits screen, and (d) the files ship in the game package through a PM
  hand-off folder with a MANIFEST.
- Reason: the earshot track `chore_earshot_sounds_20261121` closed on 2026-11-21 with seven
  rendered sounds, so the track has a source before the library takes arrive. The former MP3-only
  rule, the credits requirement for the set, and the two open owner questions no longer hold.
- `sounds/sets/chibi.json` and `scripts/sound-set.mjs` are now evidence. The metadata adds the
  earshot dependency and 9 tasks. The feature-freeze exclusion stays, with the owner rule of
  2026-10-07 stated as it stands.
- The spec H1 stays as it is, because `index.md` and the `measure/tracks.md` registry keep that
  name outside this commit.

## Amendment after r1

Date: 2026-11-22. Scope: `spec.md`, `plan.md`, and `spec-review.md` only. No implementation, no test.

- F1 closed: `plan.md` T2 now writes the map as `spec.md` AC1 states. The file holds one header line
  `event<TAB>source<TAB>note`, exactly 58 data rows, and no other line. The header-comment sentence
  is gone. AC1 now says "one header line and exactly 58 data rows, and nothing else". AC1 also names
  itself the one document of the map's meaning. T1 case 1 checks the header and the 58 data rows,
  and T1 case 2 checks the three fields of each row. The three texts agree line for line.
- F2 closed: `spec.md` decision d and AC6 and `plan.md` T8 now call
  `apps/advantage-games/public/audio/chibi/` a proposed target. The MANIFEST `target` values carry
  the `proposed:` prefix, and `README.md` names the same path. The PM or Monorepo session confirms
  or replaces the path at hand-off. The T8 done-when depends on the folder contents and the
  checksums only. The model is `docs/apk-port.md`, line 238.
- F3 closed: `spec.md` Context and Exclusions now give 26 moods: 3 built-in in `BUILT_IN_MOODS`
  (`calm`, `battle`, `boss`) and 23 `defineMood` names. Command: a `node -e` scan of `src/` that
  reads the `BUILT_IN_MOODS` block and each `defineMood('<name>'` call. It prints `union 26`.
- F4 closed: `spec.md` Context now speaks of game sound effects only. It names
  `demo/public/stories/*/story.json` with `article.mp3` and `words.mp3`. A new Exclusions bullet
  keeps that story audio and the story player out of scope.
- F5 closed: `plan.md` T4 and T7 name the wrapper
  `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<cmd>'`
  for the render and the browser measure. Both tasks cite D8 of the sibling track.

## Amendment after strategy (2026-11-22)

- The test strategy named a product wiring gap: the AudioBus gained `useSoundFiles` and `preload`,
  and no game called them, so no game played a file.
- F7 closed: `plan.md` adds T6a Red and T6b Green at the end of Phase 3, and `spec.md` adds AC9.
  Each of the 29 `view2d/game.ts` hosts calls one helper once, and the helper sets the 31-event map
  and preloads the game's own mapped events. `estimated_tasks` becomes 11.
- T8 no longer copies the demo files, because T6b does it; T8 checks the copy and builds the
  hand-off. The synth fallback, AC4, and every later task number stay as they are.

## Amendment after r3 (2026-11-22)

- F7 closed: `soundBase` has one meaning, the site base with a trailing slash (`'/demo/'` or
  `${BASE}`), and `wireChibiSounds` appends `audio/chibi/`. `spec.md` AC9, `plan.md` T6a cases 3 and
  5, `plan.md` T6b, and the T6b doc comment for `src/apk3d/factory/types.ts` say this. T6b sets
  `src/host/main.ts` to `${BASE}`, so `'/demo/'` gives `'/demo/audio/chibi/tap.ogg'`.
- F8 closed: `spec.md` AC6 now lists `MANIFEST.sha256`, with the `sha256sum` format and one line per
  shipped file, and counts 17 files. AC6 and `plan.md` T8 agree.
- F9 closed: `spec.md` AC9 now says 29 hosts create the `AudioBus`, 27 games name
  `primary-chibi-2d` by that string, and dragon-rider and griffin-sky-joust bind their 2D files
  through `requiredAssetBindings: [...FILES_2D]` from `HERO_CLIPS_2D` without the string. A grep of
  the 29 game folders gives 27 with the string and those 2 without. All 29 call `wireChibiSounds`
  once. `test-strategy.md` marks the product wiring gap closed by T6a and T6b.
