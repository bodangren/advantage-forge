# scout hair rework (heroes/martial/scout) -> assets/scout.ts

The scout in assets/scout.ts is reviewed at 7.5/10 (bar 8). Body, cloak, scarf, spyglass, dagger, rig, clips, and presets are accepted and stay as they are. Only the hair fails: six leaf locks sit in one row along the crown like a wreath over a smooth blond dome. The mockup docs/hero-mockups/scout_001.jpg has a full tousled mane that covers the whole skull.

Rebuild the `hair` body only (the head skin, the face, and the bangs may be touched to fit):

1. Base cap: a sphere 0.012 larger than the skull, cut flat 0.02 above the brow line at the front and sloping to the nape; this replaces the smooth dome and it must be covered by locks on top and at the sides.
2. Locks: 14 to 18 tapered capsules or flattened ellipsoids, 0.07 to 0.12 m long, radius 0.02 to 0.03, laid over the whole cap from the crown outward in every direction like a shaggy mop: five on top that sweep up and to +X, four on each side that sweep down over the temples and past the ear tops, three at the nape that sweep back and down, plus the low bangs over the brow. Blend each into the cap with smoothUnion 0.012 so the joins are soft. Vary each lock's direction by 10 to 25 degrees so the mane reads tousled from every view, and keep the locks within 0.04 of the skull so they never pass through the cloak collar or the scarf in any clip.
3. Paint: keep the hair color slot and its tints; paint the lock undersides one tint darker so the locks separate at 128 px.
4. Keep the head clearance of every held item at 0.04 m or more; run ./forge check scout at the end.

Loop: ./forge render scout --fast, look at out/scout/render.png (front, three-quarter, side, back), compare the mane with the mockup, fix the largest difference, repeat. Finish with one ./forge all scout, ./forge check scout, and a look at out/scout/sprites/preview.png.

Limits: under 65,000 triangles, no `warning:` lines, FORGE_WORKERS=2 on every forge command, never commit, edit only assets/scout.ts.
