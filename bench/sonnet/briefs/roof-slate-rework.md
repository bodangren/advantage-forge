# roof-slate rework (architecture/building-parts/roof-slate) -> assets/roof-slate.ts

Rework the existing file in place. The design note promises "six chunky pillow courses" but the render is a flat slab with slate tiles painted on; from the side it is a thin plank. Match the mockup docs/item-mockups/roof-slate-mock.jpg: each slate is a fat rounded pillow with real depth, the courses overlap, and the ridge cap is a row of fat rounded ridge tiles.

Size and placement stay: 2.0 m along X, 2.0 m down the slope at a 35 degree pitch, the eave edge on y = 0 at +Z, the ridge at -Z crest about 1.32 m. Keep the two bodies: slate, ridge-cap.

Changes:
1. Build the panel in a local frame lying flat in XZ (X across, Z down the slope), then rotate the whole union by the pitch and move it into place with a helper: `const place = (s) => s.rotateX(-35).at(0, ..., ...)` (compute so the eave rests on y = 0).
2. Slates: six courses, each course a row of five rounded boxes [0.40, 0.10, 0.44] with radius 0.045 (real pillows 0.10 m thick), with every other course shifted 0.20 m in X (staggered bond). Each course overlaps the one below by 0.12 m in Z and sits 0.03 m higher, so the roof steps down like scales. Add a small random tilt (1 to 3 degrees) per tile. Union them and add a thin backing slab 0.06 m thick underneath so the underside is closed. Slate #7d8ba0 with #5a6678 in the gaps and a lighter #a3b0c2 on the upper faces via paintFn on the local Y.
3. Ridge cap: seven fat rounded boxes [0.28, 0.16, 0.30] radius 0.07 in a row along the ridge, each straddling the crest, lighter slate #8e9bb0.
4. Roughness 0.75, no metal. Subtle grit in bump only.

Checks: `FORGE_WORKERS=2 ./forge render roof-slate --fast`, look at out/roof-slate/render.png; the side view must show a stepped, scaly profile at least 0.15 m deep and the front view must show pillow tiles with shadows between them. At most three looks. Then `FORGE_WORKERS=2 ./forge all roof-slate` once. Under 12,000 triangles, no `warning:` lines. Update the design note. Never commit. Only edit assets/roof-slate.ts.
