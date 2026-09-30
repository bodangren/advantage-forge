# tongs rework (props/blacksmith/tongs) -> assets/tongs.ts

Rework the existing file in place. It builds clean, but the render reads as two parallel sausages with a blob on top: the reins are lumpy, parallel and the same thickness end to end, the rivet is a ball, and the jaws are missing. Build real tongs.

Reference: docs/blacksmith-mockups/blacksmith-quest_001.jpg (scene style only). Lies flat on y = 0, long axis along X, jaws toward +X, rein tips toward -X. Total length 0.48 m. Palette contract: iron #4a4f55, shadow #363a3f, highlight #a8acb1.

Construction recipe:
1. Reins: two straight tapered cones (`sdf.cone`), each 0.30 m long, r 0.014 at the rivet end and r 0.009 at the tip, with a sphere r 0.009 on the tip. They meet at the rivet point (x 0.08) and spread apart toward -X at 7 degrees each, so the tips are 0.075 m apart in Z. Smooth, no displacement noise on the reins (keep the forged look in bump only). Iron, roughness 0.45, metalness 0.8.
2. Rivet: a flat cylinder r 0.024, height 0.012, standing on Y at the crossing point, with a dome (sphere r 0.014 cut flat) on top. Highlight steel #a8acb1 on the dome via paintWhere.
3. Jaws: beyond the rivet, two chunky curved jaws 0.10 m long, each a chain of three segments (`sdf.chain`) r 0.016 to 0.012 that curve inward toward +X so the two tips almost meet (gap 0.03 m). Flat inner faces are optional. The jaws are one body with the reins (union), in the same iron.
4. Hot stub: a rounded box [0.07, 0.024, 0.024] gripped between the jaw tips, centered at x 0.21, dark base #4a1405, emissive #ff8c2a, emissiveIntensity 1.8, roughness 0.6.
5. A bolster: a short thicker collar (cylinder r 0.018, length 0.03 along each rein) right behind the rivet on each rein, so the tool looks forged.

Checks: `FORGE_WORKERS=2 ./forge render tongs --fast`, look at out/tongs/render.png. From above (three-quarter view) the reins must form a narrow V and the jaws a closed pincer around the orange stub. At most three looks. Then `FORGE_WORKERS=2 ./forge all tongs` once. Under 4,000 triangles, no `warning:` lines. Update the design note at the top of the file. Never commit. Only edit assets/tongs.ts.
