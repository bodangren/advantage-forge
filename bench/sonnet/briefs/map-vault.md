# Dungeon map (Sunken Vault) rework -> scripts/design-sunken-vault.mjs

Read `bench/sonnet/briefs/map-rules.md` first. Priority P0: target 7.5 of 10.

Mockup: `docs/dungeon-mockups/dungeon-quest_002.jpg` (style anchor) and `dungeon-quest_001.jpg` (top-down tiles).
Layout and rules: `docs/dungeon-mockups/README.md`, `docs/dungeon-mockups/map.md`, `docs/dungeon-mockups/masonry.md`.
Map source: the generator `scripts/design-sunken-vault.mjs`; run `node scripts/design-sunken-vault.mjs` to write
`scenes/sunken-vault.ts` and `docs/dungeon-mockups/map.md`. Scene name: `vault`.
Current shots (2026-10-02): `docs/dungeon-mockups/vault-3q.png`, `docs/dungeon-mockups/vault-top.png` (the
top view is older and lacks the four wall-alcoves that the 3q view shows).
Orchestrator score now: 6.5. The walls, portals, and room plan are right; keep the zone plan.

Faults, largest first:
1. The floor reads pale grey-lavender; the mockup floor is a mid blue slate with dark grout and the
   walls a step darker. You may edit `assets/floor.ts` and `assets/floor-cracked.ts` for this only:
   darken the slab top colors about one step toward MID (#4a5d75), keep the grout and every shape
   unchanged, then run `FORGE_WORKERS=2 ./forge all floor` and `./forge all floor-cracked` (long
   timeouts; they can wait for a build slot) and confirm no `warning:` lines.
2. The braziers and one adventurer stand outside the gate on no ground (they float over the void).
   Give the gatehouse approach a short floor run (two or three tiles outside the gate) or move them inside.
3. The rooms read bare next to the mockup: add dressing from the existing kit (barrel, crate, chains,
   bone-pile, rubble, gold-pile, candle-cluster, moss-tuft, mushroom-cluster, crystal-cluster) so each
   room has one clear story (cells: chains and bones; treasury: gold and chests; sanctum: altar and candles).

Final shots (overwrite):
```
FORGE_SHOT_BASE=http://127.0.0.1:5232/hamlet.html node scripts/shoot-map.mjs docs/dungeon-mockups \
  'vault-3q=scene=vault&clean&az=32&el=50&dist=36&tx=0&tz=1' 'vault-top=scene=vault&clean&az=0&el=88&dist=42&tx=0&tz=0'
```
Also update `docs/dungeon-mockups/components.tsv` counts.
