# The avatar in the games

## Purpose

A student plays as the student's own avatar. Section 11 of `docs/avatar-system.md` defines the
rule: the host passes the avatar, and a game never fetches it. A 3D game composes the avatar. A 2D
game uses the portrait until layered sprites exist. A game that shows a fixed hero today uses the
avatar when the host passes one, and it keeps the fixed hero when the host passes none.

Owner rule (2026-10-06): the avatar is the student's identity. A student with an avatar always
appears as that avatar, never as a hero. A stand-in is a neutral grey figure with no face.

The owner started this work on 2026-10-06, after the pack release track was complete.

## Scope and ownership

Forge owns the kit, the games, the avatar pack, and this track. The monorepo session owns every
change in the monorepo (owner rule, 2026-10-06). Forge sends the release and a written request;
the monorepo session applies them.

| Part | Owner |
| --- | --- |
| The contract copy, the session option, the avatar actor, the game changes, the demo host | Forge |
| `launchAvatarSchema` in `packages/game-contracts/src/avatar.ts` (the source of the copy) | Monorepo |
| The app host: it reads the student's avatar state and passes the launch avatar to a game | Monorepo |
| The served avatar pack (`apps/primary-advantage/public/packs/avatar/<version>/`) | Monorepo, from the Forge release |

## Requirements

1. **Contract.** Forge copies `launchAvatarSchema` (and the enums it uses) from
   `packages/game-contracts/src/avatar.ts` (integration 0dac27db2) into `src/apk3d/contracts/`.
   The launch avatar is `{ catalogVersion, classId, tints: { skin, hair, eyes, cloth }, pieces:
   [{ itemId, dye }] }`. Forge does not change the shape. A change goes to the monorepo session
   first.
2. **Session option.** `SessionOptions` (`src/apk3d/factory/types.ts`, Forge-owned) gets an
   optional `avatar`. The 3D factory and the 2D views receive it with the other options. The APK
   contract `GameFactoryContext` does not change.
3. **Pack files.** The kit loads the base and the pieces from `packs/avatar/<catalogVersion>/`
   (`catalog.json` gives the files of each piece). This is an asset load, not a fetch of the
   avatar state. When that version is not served, the kit uses the current pack version.
4. **Avatar actor.** A 3D game gets an `Actor` for the avatar from the kit. The composer gives
   each avatar its own material copies with a tint shader, so the actor uses the composed avatar
   as it is and does not clone it.
5. **Clips.** The avatar base has `idle`, `walk`, `run`, `attack`, `hit`, `rest`, `cheer`, and
   `cast`. The heroes have `death` and `victory`. The kit maps `victory` to `cheer` and `death`
   to `rest` (content is rated G). A clip that the avatar does not have falls back as the actor
   does today.
6. **Fallback.** With no avatar, the game shows the fixed hero. With an avatar, a piece that fails
   to load or fit is left off (`apk3d/avatar-partial`), and when the catalog or the base fails to
   load, the game shows a neutral grey figure (`apk3d/avatar-fallback`). Both send a `warning`
   diagnostic. A game never stops for the avatar, and it never shows a hero for a student with an
   avatar (owner rule, 2026-10-06).
7. **Monster Encounters first** (section 13, phase 3). The party has three heroes (knight,
   wizard, cleric). The avatar takes the party place of the role of its class: casters (wizard,
   witch, druid, shaman) take the wizard place, healers (cleric, bard) take the cleric place, and
   the other classes take the knight place. The other two places keep their heroes. The student
   answers their turns too ("Knight's turn"). The owner confirmed this on 2026-10-06.
8. **2D.** The 2D pack has sprites for the knight, the wizard, and the cleric only. Until layered
   sprites exist, a 2D view shows the student's own figure: the avatar portrait (composed from the
   portrait layers) as a still image with simple motion, at the place of the class's role
   (requirement 7). It shows a neutral grey silhouette while the portrait loads and when it does
   not load. The role's hero gives only the clip names and effects.
9. **The other games.** Each game that reads `options.hero` uses the avatar through the same kit
   helper. The game list is in the plan.
10. **Pack version.** A changed avatar pack gets a new version (debt TD-24), because a game loads
    `packs/avatar/<catalogVersion>/` and a browser may keep old files of a version.
11. **Budget.** The avatar adds no more than the base (under 2 MB) and the worn pieces (under
    400 KB each) to a 3D game load. The 2D view loads only the portrait layers.

## Acceptance

- The Forge contract copy parses the same fixtures as the monorepo schema (a test with fixtures
  from the monorepo file).
- Monster Encounters in 3D shows the avatar in the place of its role, in every clip of a battle,
  for the 15 starter sets. Reviewed by QC shots.
- Monster Encounters in 2D shows the student's figure at the place of the role and the face in
  the HUD. No 2D or 3D view shows a hero for a student with an avatar.
- With no avatar, every game looks the same as before (the QC shots of the fixed hero).
- `tests/apk3d` and `tests/games` pass, and the type check of `src/apk3d` and `src/games` is
  clean.
- The monorepo session confirms that the app host passes the launch avatar and that the games
  show it on the integration branch.

## Questions for later

- Layered 2D sprites of the avatar (a sprite sheet per piece, composed like the portrait). Not in
  this track.
- Guild Mode (section 13, phase 4) uses the avatars of a class. Not in this track.
