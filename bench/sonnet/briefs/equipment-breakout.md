# Equipment breakout brief (one character per agent)

Track `asset_equipment_parts_20260930`. Contract and recipe: `docs/equipment-parts.md`. Read it
first. Worked examples: `assets/parts/knight-helm.ts` (head, translation),
`assets/parts/cleric-hammer.ts` (hand-held along a tilted axis: a translation by a mount rounded to
1/1024 m; use this before `holdPose`), `assets/parts/cleric-book.ts` (a second part on its own
bone), `assets/parts/mage-wand.ts` (an upright flame as a second part),
`assets/parts/mage-spellbook.ts` and `assets/parts/skeleton-knight-shield.ts` (local frame with a
host pose function), and their hosts `assets/knight.ts`, `assets/cleric.ts`, `assets/mage.ts`,
`assets/skeleton-knight.ts`.

Each standalone shows the whole piece: if the host keeps an effect or a moving detail of the
piece on its own bone (a cross, a flame, a gem), put it in the module as a second part.

The orchestrator fills in, per agent:

- Host: `<host>` (file `assets/<host>.ts`)
- Pieces and bodies: for example `helmet` = bodies `helmet`, `plume`; `sword` = `blade`, `hilt`, `grip`
- Part names: for example `<host>-helmet`, `<host>-sword`

## Scope

Rigid equipment only: head pieces (helmets, hats, hoods, crowns), held items (weapons, staffs,
wands, books, tools, lanterns), and shields. Skinned clothing and armor (robes, cuirasses, capes,
boots) stay in the host. Eye glows and body effects stay in the host.

## Steps

1. Run `./forge render <host>` and `./forge sprites <host>`. Run `node scripts/part-check.mjs save <host>`.
2. For each piece, write `assets/parts/<host>-<piece>.ts` by the recipe in `docs/equipment-parts.md`.
   Copy the code; do not redesign it. Keep the body names, options, bones, and order.
3. Change `assets/<host>.ts` to `addPart(...)` for each piece. Keep every constant that the
   skeleton and the clips use.
4. Write `assets/<host>-<piece>.ts` for each piece: `bones: null`, standing on y = 0, the front
   toward +Z, the host's `detail` and `reference`, `texture: { size: 512 }`, and `variants` for
   the part's tint slots with the host's options for those slots.
5. Run `./forge render <host>` and `./forge sprites <host>`. Run
   `node scripts/part-check.mjs compare <host>`. It must end with `result PASS`. If it fails,
   find the body that moved and fix the placement. Do not change the tolerance.
6. Run `./forge check <host>`. It must report `result ok` (or `no held items to check`).
7. Run `./forge render <host>-<piece> --fast` for each piece and look at each render once.
8. Run `node_modules/.bin/tsc --noEmit -p . 2>&1 | grep -E "assets/(parts/)?<host>"`. It must
   print nothing.

## Rules

- Edit only `assets/<host>.ts`, `assets/parts/<host>-*.ts`, and `assets/<host>-*.ts`.
- Never edit `src/`, other assets, or `scripts/`. Never commit. Never run `pnpm`.
- Do not change a body name unless a host body mixes part and non-part shapes (recipe step 6).
- Do not run `./forge all` on the host; the orchestrator does it after the review.

## Final report (under 200 words)

The host; each part module and standalone file with its bodies; the `part-check` result line and
the largest image change; the `forge check` result; any body split or rename; the number of
renders viewed.
