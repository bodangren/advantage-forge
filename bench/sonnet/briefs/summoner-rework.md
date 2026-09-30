# summoner hair rework (heroes/magic/summoner) -> assets/summoner.ts

The summoner in assets/summoner.ts is reviewed at 7.8/10 (bar 8). The body, the open coat, the belt, the book, the spirit, the rig, the clips, and the presets are accepted and stay as they are. The braid stays. Only the hair on the head fails: it is a smooth lumpy violet helmet with a topknot bump. The mockup docs/hero-mockups/summoner_001.jpg has a swept-back wavy mane with visible strands and a tall front wave.

Rebuild the head hair body only (keep the braid body and its bone; the gold headband may stay):

1. Base cap: a sphere 0.012 larger than the skull, cut 0.02 above the brow at the front and down to the nape at the back; it must be covered by locks on the top and the sides.
2. Locks: 14 to 18 tapered capsules or flattened ellipsoids, 0.07 to 0.12 m long, radius 0.02 to 0.03, laid over the whole cap from a parting on the +X brow: five on top that sweep back and up as the front wave (the tallest rises 0.05 m above the cap and curls back, the next two lower), four on each side that sweep back over the temples and past the ear tops, three at the nape that feed into the braid root. Blend each into the cap with smoothUnion 0.012 so the mesh reduction passes. Vary each lock's direction by 10 to 25 degrees so it reads tousled from every view. Keep the locks within 0.04 of the skull so they never pass through the collar in any clip.
3. Paint: keep the hair color slot and its tints; paint the lock undersides one tint darker so the locks separate at 128 px.
4. Keep the head clearance of the spirit and the book at 0.04 m or more; run ./forge check summoner at the end.

Loop: ./forge render summoner --fast, look at out/summoner/render.png (front, three-quarter, side, back), compare the mane with the mockup, fix the largest difference, repeat. Finish with one ./forge all summoner, ./forge check summoner, and a look at out/summoner/sprites/preview.png.

Limits: under 65,000 triangles, no `warning:` lines, FORGE_WORKERS=2 on every forge command, never commit, edit only assets/summoner.ts.
