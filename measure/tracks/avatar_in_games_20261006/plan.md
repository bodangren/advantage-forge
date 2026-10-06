# The avatar in the games

Status: in progress. The plan records execution state. The specification and
`docs/avatar-system.md` retain design detail.

## Phase 0: Contract and options

- [ ] Task: Copy `launchAvatarSchema` and its enums from the monorepo `game-contracts` (integration 0dac27db2) into `src/apk3d/contracts/`, with a source note. A test parses fixtures taken from the monorepo file.
- [ ] Task: `SessionOptions.avatar` (optional), passed by the 3D factory and the 2D views; `SESSION_OPTIONS_DEFAULT` has none.
- [ ] Task: Send the scope to the monorepo session: the launch avatar from the app host, the served pack, and the contract check of `port-kit.mjs`.

## Phase 1: The avatar actor (kit)

- [ ] Task: A kit loader for the launch avatar: `catalog.json` of `packs/avatar/<catalogVersion>/`, the base, the pieces with their capped and tucked forms and dyes, cached by file; the current version when the given one is not served.
- [ ] Task: An `Actor` from a composed avatar (no material clone), with the clip map (`victory` to `cheer`, `death` to `rest`).
- [ ] Task: The role of a class (fighter, caster, healer) and the fallback with a `warning` diagnostic. Unit tests for the pure parts.

## Phase 2: Monster Encounters

- [ ] Task: 3D: the avatar takes the party place of its role. QC shots for a fighter, a caster, and a healer starter set, and for no avatar.
- [ ] Task: 2D: the portrait in the HUD and the role sprite. QC shots.

## Phase 3: The demo host

- [ ] Task: An avatar choice on the Forge demo host (a starter set and its tints), passed as `SessionOptions.avatar`, so that the games can be checked without the app.

## Phase 4: The other games

- [ ] Task: List every game that reads `options.hero` (3D and 2D) and move each to the kit helper. Abyssal Well, Alchemist's Synthesis, Archer's Revenge, Astral Mage, Castle Defense, Dragon Rider, Dungeon Liberator, Enchanted Library, Griffin Riders' Escape, Griffin Sky Joust, Gryphon Patrol, Haunted Library, Hero vs Zombie, Labyrinth, Magic Defense, Paladin's Twin Soul, Potion Rush, Realm Carver, RPG Battle, Rune Forge Chamber, Rune Match, Shadow Gate Dungeon, Sorcerer's Ziggurat, Spellweaver's Run, Storm Castle Tower, Village Guardian.
- [ ] Task: QC shots of each changed game with and without an avatar.

## Phase 5: Release and hand-off

- [ ] Task: The avatar pack version changes when its content changes (TD-24).
- [ ] Task: Run the Forge tests and type checks; release with `apk-release.ts`; run `monorepo-sync.ts --check`.
- [ ] Task: Send the release and the host request to the monorepo session; record its confirmation.
- [ ] Task: Update `docs/avatar-system.md` (section 11), `docs/apk-port.md`, the debt registry, and Measure; run the generator and the doctor.
