# key-bronze and key-skeleton rework (items/quest-and-treasure) -> assets/key-bronze.ts, assets/key-skeleton.ts

Both files exist and build clean (about 1,500 and 2,200 triangles). Their shafts, collars and bits are accepted. Only the bows change. Both keys lie flat on y = 0 with the bow toward -X and the bit toward +X; the thickness axis is Y, so the "face" of the bow is seen from above (+Y) and from the front view.

Mockups: docs/item-mockups/key-bronze-mock.jpg and docs/item-mockups/key-skeleton-mock.jpg. Match the idea, not every detail.

## key-bronze: a clean heart hole

The bow is a flat rounded disc; keep it. The heart hole now reads as a rough notch. Build the heart as one 2D profile and cut it through the whole disc along Y:
- `const heart = profile.polygon([...], { smooth: true })` with points around a heart 0.04 m wide and 0.038 m tall: top lobes at (-0.011, 0.012) and (0.011, 0.012) as the peaks, a notch at (0, 0.004) between them, and the point at (0, -0.024).
- `bow.subtract(sdf.extrude(heart, 0.1).rotateX(90).at(bowX, 0.01, 0))` so the extrusion runs along Y through the disc. Check the orientation in the render: the heart must be upright when seen from the front view with the point toward +X... no: keep the point toward the shaft (+X) and the lobes toward -X, the way a heart charm hangs.
- The rim around the hole stays at least 0.01 m wide everywhere.
- One bronze body, color #b5763a, metalness 0.9, roughness 0.45, with #7a4a1e on the underside via a halfSpace paintWhere.

## key-skeleton: a skull that reads

Keep the skull sphere and its two dark eye pits. Fix the jaw and add shape:
- Skull sphere r 0.032 at y 0.032. Eye pits: two spheres r 0.012 subtracted at the front-left face (the -X side, which faces away from the shaft, and toward +Y so they show from above), each with a dark sphere r 0.01 inside as a separate body (#2a2622).
- Jaw: a rounded box 0.036 x 0.016 x 0.03 on the -X side under the eyes, at y 0.016, so it shows from above and from the front. Four teeth: boxes 0.006 x 0.008 x 0.006 standing proud of the jaw's -X face by 0.005 m, in the same bone color.
- A nose notch: a small triangle extruded and subtracted between the eyes, 0.008 m tall.
- Bone color #e8e0cc, roughness 0.7, no metal, with #a89e88 painted on the underside.

For each key: `FORGE_WORKERS=2 ./forge render <name> --fast`, look at out/<name>/render.png and confirm the heart or the skull face shows in the front and three-quarter views, then `FORGE_WORKERS=2 ./forge all <name>` once. Under 3,000 triangles, no `warning:` lines. Never commit. Only edit assets/key-bronze.ts and assets/key-skeleton.ts.
