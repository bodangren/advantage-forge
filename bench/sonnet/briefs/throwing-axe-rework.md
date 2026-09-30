# throwing-axe rework (equipment/ranged-weapons/throwing-axe) -> assets/throwing-axe.ts

Rebuild the existing file in place. The current build lies flat with a thin blade that vanishes from the front. There is no mockup; the target is a chunky chibi throwing axe standing upright on its butt: a short thick handle with a leather wrap, and a big bearded steel head with a bright edge, seen flat-on in the front view.

Stands on y = 0, 0.55 m tall, faces +Z (the head is in the XY plane, blade toward +X).

Construction recipe:
1. Handle: a capsule r 0.03 from y 0.03 to y 0.48, honey wood #a86a3a, with a leather wrap: six torus rings R 0.033 r 0.01 from y 0.08 to y 0.22 in #5a3522, and a rounded pommel sphere r 0.038 at y 0.03. Wood one body, wrap one body.
2. Head: an extruded 2D profile in XY, 0.05 m thick, edge radius 0.006: an eye socket around the handle at y 0.44 (a rounded rectangle 0.08 x 0.1), a blade that sweeps to +X: top corner at (0.17, 0.53), edge running down to a beard tip at (0.14, 0.3) hooking back toward the handle, blade 0.16 m tall at the edge. A small flat poll on the -X side (a box 0.04 x 0.06). Steel #9aa0a8 with the edge (the outer 0.025 m along +X) painted #dde1e6 and the socket #6c737a, metalness 0.85, roughness 0.35. One body.
3. Two iron rivets r 0.012 on the socket face.
4. Under 3,500 triangles.

Checks: `FORGE_WORKERS=2 ./forge render throwing-axe --fast`, look at out/throwing-axe/render.png; the front view must show a thick handle with a big bearded blade at the top. At most two looks. Then `FORGE_WORKERS=2 ./forge all throwing-axe` once. No `warning:` lines. Update the design note. Never commit. Only edit assets/throwing-axe.ts.
