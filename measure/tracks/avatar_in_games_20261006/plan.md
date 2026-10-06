# The avatar in the games

Status: in progress. The plan records execution state. The specification and
`docs/avatar-system.md` retain design detail.

## Phase 0: Contract and options

- [x] Task: Copy `launchAvatarSchema` and its enums from the monorepo `game-contracts` (integration 0dac27db2) into `src/apk3d/contracts/`, with a source note. A test parses fixtures taken from the monorepo file. `src/apk3d/contracts/avatar.ts` with `readLaunchAvatar` (the reason with its path). The monorepo has no fixtures for this schema, so `tests/apk3d/avatar-launch.test.ts` (18 tests) checks the class enum against the 15 starter sets, accepts every starter set, and rejects eight broken variants.
- [x] Task: `SessionOptions.avatar` (optional), passed by the 3D factory and the 2D views; `SESSION_OPTIONS_DEFAULT` has none. The factories pass `options` as one object, so no factory change was needed.
- [x] Task: Send the scope to the monorepo session: the launch avatar from the app host, the served pack, and the contract check of `port-kit.mjs`. Sent 2026-10-06, with a question: will `launchAvatarSchema` change before the cutover?

## Phase 1: The avatar actor (kit)

- [x] Task: A kit loader for the launch avatar: `catalog.json` of `packs/avatar/<catalogVersion>/`, the base, the pieces with their capped and tucked forms and dyes, cached by file; the current version when the given one is not served. `loadAvatarBody` and `playerBody` in `src/apk3d/stage/avatar.ts`; `ModelLoader.json` and `avatarRoot` (default `packs/avatar`; the Forge demo serves `avatar-pack`), set through `StageOptions` and `ThreeFactoryOptions`. The dyes follow the monorepo `avatar-kit` rule (`pieceDyes`).
- [x] Task: An `Actor` from a composed avatar (no material clone), with the clip map (`victory` to `cheer`, `death` to `rest`). The actor body is a GLB or an `AvatarBody`; the new option `aliases` maps clip names (an own clip wins). The import rules now let `apk3d/stage` import `apk3d/avatar` (section 4 of `docs/apk3d-cartridge.md`).
- [x] Task: The role of a class (fighter, caster, healer) and the fallback with a `warning` diagnostic. Unit tests for the pure parts. `src/apk3d/avatar/launch.ts` (`CLASS_ROLES`, `roleHero`, `pieceDyes`, `AVATAR_CLIP_ALIASES`); the fallback code is `apk3d/avatar-fallback`. `tests/apk3d/avatar-body.test.ts` (6 tests, an in-memory pack); `tests/apk3d` 23 files, 408 tests pass; the type check of `src/apk3d`, `src/games`, and `src/host` is clean.

## Phase 2: Monster Encounters

- [x] Task: 3D: the avatar takes the party place of its role. QC shots for a fighter, a caster, and a healer starter set, and for no avatar. `BattleStage.load` takes the player's body for one place (the actor keeps the place id); the card reads "Your turn" for that place (3D and 2D, new string `hud.yourTurn`). `scripts/apk3d-shot.ts --avatar <class>`: rogue (portrait, knight place), witch (landscape, wizard place), bard (landscape, cleric place), and no avatar (landscape): every run played to the results and the class boss with no diagnostics and no errors. The battle camera shows the party from behind.
- [x] Task: 2D: the portrait in the HUD and the role sprite. QC shots. `avatarPortrait` and `portraitIcon` (`src/apk3d/avatar/portrait-of.ts`): the launch avatar's layers with the shop's dye rule, and a round face crop (`PORTRAIT_FACE`, measured on the base layer). `Card2D.pill` takes an optional icon; the "Your turn" pill shows the face, and the body is the role sprite. 2D views get `avatarRoot` (default `/packs/avatar`; the demo passes its own). QC `--2d --avatar rogue` (portrait): the face shows, no diagnostics, no errors. The demo pack has no portrait layers yet (see Phase 5), so this run used a temporary copy of the 2026-10-04 layers from `out/packs/avatar/1.0.0/`, removed after the run.

## Phase 3: The demo host

- [x] Task: An avatar choice on the Forge demo host (a starter set and its tints), passed as `SessionOptions.avatar`, so that the games can be checked without the app. Done as a page parameter, not a screen: `?avatar=<class>` passes that class's starter set (`starterLaunchAvatar`); the demo serves the pack at `avatar-pack/` (`AVATAR_ROOT`).

## Phase 4: The other games

- [x] Task: List every game that reads `options.hero` (3D and 2D) and move each to the kit helper. 2026-10-06: 20 one-hero 3D games load `playerBody` with their scene (no hero model with an avatar; riders scale by `bodyHeight`; the builders of Alchemist's Synthesis, Rune Forge Chamber, and Potion Rush and the body helpers of Labyrinth and Realm Carver take the body); the 6 other party games on the battle stage (Archer's Revenge, Castle Defense, Magic Defense, Paladin's Twin Soul, RPG Battle, Rune Match) give the avatar the place of its role, and Castle Defense and RPG Battle label that place "Your post" and "You"; the 20 2D views show the hero of the avatar's role (`shownHero`). A color preset applies only to a fixed hero. `tests/apk3d` and `tests/games`: 144 files, 2,263 tests pass.
- [ ] Task: QC shots of each changed game with and without an avatar.

## Phase 4b: The identity rule

The owner rule of 2026-10-06: the avatar is the student's identity, so a student with an avatar never appears as a hero. The first Phase 4 build broke it in three places: the 2D views showed the role's hero sprite, a failed avatar fell back to the hero, and the demo host granted hero looks with an avatar.

- [x] Task: 3D fallback. `loadAvatarBody` leaves off a piece that does not load or fit (a slot conflict, a missing bone or hair form) and lists it in `dropped` (warning `apk3d/avatar-partial`); without the default hair style the base keeps its own hair. When the catalog or the base does not load, `playerBody` returns `neutralAvatarBody`: a grey figure with no face and simple clips under the hero clip names (warning `apk3d/avatar-fallback`). Only a session with no avatar loads the hero. `tests/apk3d/avatar-body.test.ts`: 11 tests.
- [x] Task: 2D figure. `src/apk3d/view2d/figure.ts`: `FigureSource` (an image, its feet point, its scale), `Figure2D` (the still image at the sprite scale with simple motion: a breath, a running bob, a lunge, a recoil, a hop, a fall), and a grey silhouette while the image loads or after it fails. `portraitFigure` and `playerFigure` (`src/apk3d/avatar/portrait-of.ts`) make the source from the portrait layers and start the load when the view is made. `Actor2D` takes the option `figure`. The 15 `Actor2D` views pass it; the 5 rider and runner views (Gryphon Patrol, Griffin Riders' Escape, Griffin Sky Joust, Dragon Rider, Spellweavers' Run) use `Figure2D` directly; `BattleStage2D` puts it at the role's party place (`partyPlayer2D`) in the 7 battle views. Monster Encounters makes its face icon from the same pixels.
- [x] Task: Hero looks. The demo host grants no hero look and shows no hero-look reward when the page has an avatar. Avatar rewards (pieces, dyes) belong to the monorepo.
- [ ] Task: QC shots of the 2D figure (one-hero, rider, and battle views) and of the neutral figure.
- [ ] Task: Tell the monorepo session the owner rule: its host grants hero looks and shows hero choosers.

## Phase 5: Release and hand-off

- [ ] Task: The release renders the portrait layers (`scripts/avatar-portraits.ts` after `avatar-pack.ts`) into the avatar pack of the demo and the app. The release copied the pack without them; the app has its own copy of the 2026-10-04 layers.
- [ ] Task: The avatar pack version changes when its content changes (TD-24).
- [ ] Task: Run the Forge tests and type checks; release with `apk-release.ts`; run `monorepo-sync.ts --check`.
- [ ] Task: Send the release and the host request to the monorepo session; record its confirmation.
- [ ] Task: Update `docs/avatar-system.md` (section 11), `docs/apk-port.md`, the debt registry, and Measure; run the generator and the doctor.
