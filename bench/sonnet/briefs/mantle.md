# mantle (equipment/armor/mantle) -> assets/mantle.ts

A short fur-trimmed mantle standing as on invisible shoulders: a deep red cloth capelet 0.5 m wide and about 0.45 m tall, a thick white fur collar around the neck opening, and a gold clasp at the front. No body, no head. Stand the hem on y = 0, centered on Y, front toward +Z (the same convention as assets/cape.ts: the cloth hem touches the ground plane, the collar on top).

Mockup: bench/overnight/refs/p1-gear/mantle-mock.jpg (set `reference` to that path). Match its idea and colors, not every detail: the mockup shows a boy wearing it; build only the capelet, collar, and clasp.
Pattern file: assets/cape.ts (a hanging cloth revolve with a collar band and a clasp; copy its structure). Read it first.

Palette: red cloth #c8423a dominant, dark red #8e2a25 in the folds, light red #da6248 on the fold ridges; fur cream #efe4cc with #d9ccb0 shadow; gold #d4a93a (metalness 1, roughness 0.3). Cloth roughness 0.88, fur roughness 1.
Art direction (Chibi Quest): rounded chunky forms, soft bevels, a silhouette that reads at 128 px. One body per material.

Construction recipe:
1. Capelet: `sdf.revolve` of a profile from the neck ring (r 0.11 at y 0.42) flaring to the hem (r 0.25 at y 0). Scale z by 0.85 so it is flatter front-to-back. Add 5 to 6 soft vertical folds with `.displace` (a cosine of the angle around Y, amplitude 0.012, stronger near the hem). A shallow wavy hem.
2. Front split: cut a narrow vertical V from the hem to the clasp at the front with `subtract`, so the two front edges read.
3. Fur collar: a fat torus (R 0.13, r 0.055) at y 0.42, `.displace(0.006, noise)` for a fluffy edge, `bump` for fur; cream.
4. Clasp: a small gold rounded box or disc (0.05 m) at the front at the collar base, with a smaller domed button on it.

Limits: whole asset under 4,000 triangles; `detail` 0.005. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only create or edit assets/mantle.ts.

## Retry notes (2026-09-29, after two low-tier passes scored 6.5 and 6.0)
The low-tier build failed on these points; avoid them:
- The cloth wall was too thin: fold displacement broke through and left a hole in the back hem. Make the capelet a solid revolve (no shell), and keep the fold displacement below 0.02 with the hem profile at least 0.06 thick.
- Red fold tips poked up through the top of the fur collar. The collar must be a solid torus (R 0.13, r 0.06) whose top is at least 0.03 above the top of the cloth, and the cloth profile must end 0.02 below the collar center.
- The collar became a giant lumpy pillow. Keep it a clean fat ring with two small front lobes (ellipsoids 0.12 x 0.07 x 0.09 at +-x 0.08, z 0.11), `.displace(0.004, noise)` only; the collar outer radius must stay under 0.2.
- The clasp disappeared under the collar. Put the gold clasp on the cloth just below the collar front (y 0.34, z 0.24), 0.06 wide, proud of the cloth by 0.02.
- Front split: a clean V opening 0.05 wide at the hem, 0 at the clasp; subtract a wedge, then check the front view for floating slivers.
Verify in the front, side, and back views: no holes, nothing pokes through the collar, nothing floats.
