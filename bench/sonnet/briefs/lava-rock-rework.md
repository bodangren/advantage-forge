# lava-rock rework (nature/terrain/lava-rock) -> assets/lava-rock.ts

Rebuild the existing file in place. The current build is a smooth faceted egg with three thin orange stripes painted on the surface; the stripes look like tape. The mockup docs/item-mockups/lava-rock-mock.jpg is a boulder broken into thick basalt plates with wide glowing gaps between them, a few plate fragments at the foot, and small embers on the ground.

Size stays: 0.9 m wide, 0.6 m tall, on y = 0. Palette: basalt #2e2e34 / #45454d, lava glow #ff6a12 on a dark base #4a1405 (emissiveIntensity 1.8).

Construction recipe:
1. Core: a glowing sphere r 0.27 at y 0.27 (the lava body: color #4a1405, emissive #ff6a12, emissiveIntensity 1.8, roughness 0.3). Cut it flat at y 0.
2. Plates: seven to nine thick basalt plates over the core: each plate is `sdf.sphere(0.32).at(0, 0.27, 0).subtract(sdf.sphere(0.25).at(0, 0.27, 0))` (a shell 0.07 m thick) intersected with a rounded box or a wedge that keeps one patch of the shell, rotated to a different direction. Leave gaps of 0.03 to 0.05 m between plates so the core glows through the cracks. Round the plate edges (`.round(0.01)` after intersection). Use `flat: true`. One basalt body for all plates, plus a flat bottom cut at y 0. Paint a light #45454d on the top faces.
3. Fragments: three plate fragments (rounded boxes [0.16, 0.06, 0.12], tilted) lying at the foot, in basalt, and five embers: spheres r 0.02 to 0.03 on the ground near the foot, same emissive material as the core.
4. Nothing painted orange on the basalt: all glow comes from the emissive bodies.

Checks: `FORGE_WORKERS=2 ./forge render lava-rock --fast`, look at out/lava-rock/render.png; the boulder must read as broken plates with glowing seams in every view, and no view may show a plain smooth egg. At most three looks. Then `FORGE_WORKERS=2 ./forge all lava-rock` once. Under 8,000 triangles, no `warning:` lines. Update the design note. Never commit. Only edit assets/lava-rock.ts.
