# Avatar system: base, equipment fit, pack, composer

## Purpose

Let a Primary Advantage student dress one chibi avatar in forge equipment and show it in the
profile, the shop, the games, and the Guild Mode battle. The full specification is
[docs/avatar-system.md](../../../docs/avatar-system.md). The program plan is
[docs/chibi-quest-progression.md](../../../docs/chibi-quest-progression.md).

## Owner decisions (2026-10-01)

- Docs in this repo; database and API work in the monorepo.
- Primary Advantage only.
- Rigid slots first; cloth later.
- Cooperative boss first; no guild war.
- No real-time multiplayer: HTTP completions, heartbeats, and polling.

## Scope

- `assets/avatar-base.ts` with tints, hair styles, and clips.
- The `equip` block on equipment assets, its validation, and `forge check` for equipment.
- Fit rework of the 10 pieces in the `equipment-fit.md` audit.
- The reduced output pass, `scripts/avatar-pack.ts`, portrait layers, `src/apk3d/avatar/`.
- A review page with the 15 starter sets.

## Exclusions

- Monorepo tables, API, and pages (a monorepo track).
- Guild Mode seasons, power-ups, and the battle pages (a later track).
- Cloth slots, layered 2D sprites, phone 3D avatars, the guild war.

## Acceptance criteria

See section 12 of the specification. In short: the base and every phase 1 piece build clean and
pass the fit and clearance checks; the 15 starter sets compose in 3D and as portraits with no
intersections; the pack stays under 25 MB; a 30-avatar composite runs at 30 fps on a 2020 laptop.
