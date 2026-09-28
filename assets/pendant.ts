import { defineAsset, mixRgb, profile, rgb, sdf } from '../src/index.js';

/**
 * Pendant (equipment/accessories/pendant): a silver pendant on a short chain loop, lying flat
 * on the ground (gem face up, +Y), centred on the Y axis, bail and chain toward +Z.
 * About 0.095 m long, 0.016 m tall.
 *
 * Role: gear icon / pickup seen at ~128 px; must read as "silver teardrop pendant with a blue
 * gem" instantly from the top and three-quarter views.
 * One idea: a fat glowing teardrop cabochon nestled in a chunky rounded silver frame, with a
 * bail ring threaded by a short chain loop.
 * Shape language: round (friendly) — teardrop + circles (bail, chain links).
 * Palette: silver #a8acb1/#c8ccd2 with dark iron shadow #4a4f55 (dominant), gem dark teal base
 * #0d3a4d under a cyan glow #35c2d6 (accent, focal point).
 * Materials: silver (metalness 1, roughness ~0.35), gem (dark base + emissive, flat facets).
 * No rig: a lying-flat display piece.
 */

const TEARDROP = profile.polygon(
  [
    [0, -0.026], // tip (bail side, +Z after the flat transform)
    [0.0153, -0.0053], // tangent point
    [0.019, 0.006], // widest
    [0.015, 0.02],
    [0, 0.025], // bulb top
    [-0.015, 0.02],
    [-0.019, 0.006],
    [-0.0153, -0.0053],
  ],
  { smooth: true },
);

const Z_CENTER = -0.004; // teardrop centre in Z
const BAIL_Z = 0.0282;

const SILVER_DARK = rgb('#5a5f66');
const SILVER_LIGHT = rgb('#dde1e7');

export default defineAsset({
  name: 'pendant',
  description: 'Silver teardrop pendant with a glowing blue gem, on a short chain loop, lying flat.',
  detail: 0.003,
  reference: 'docs/item-mockups/pendant-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ silver frame + bail
    // Teardrop ring: outer profile minus an offset inner profile, lying flat, soft edges.
    const frame = sdf
      .extrude(TEARDROP, 0.01)
      .subtract(sdf.extrude(profile.offsetProfile(TEARDROP, -0.0045), 0.03))
      .rotateX(-90)
      .at(0, 0.005, Z_CENTER)
      .round(0.002);
    // Bail ring stands upright (hole along X) so the chain can thread through it.
    const bail = sdf.torus(0.005, 0.002).rotateZ(90).at(0, 0.007, BAIL_Z);
    // Neck bridges the frame tip and the bail without plugging the hole.
    const neck = sdf.capsule([0, 0.006, 0.011], [0, 0.006, 0.0195], 0.0024);
    const silver = sdf
      .union(frame, bail, neck)
      // Value plan: dark iron shadow underneath, bright steel highlight on top.
      .paintFn((_x, y, _z) => mixRgb(SILVER_DARK, SILVER_LIGHT, Math.min(1, Math.max(0, y / 0.01))));
    k.body('silver', silver, {
      color: '#a8acb1',
      roughness: 0.35,
      metalness: 1,
      detail: 0.002,
      maxTriangles: 520,
      paintWeight: 1,
    });

    // ------------------------------------------------------------------ gem
    // Slab cut by a sphere into a shallow cabochon dome; edge tucked under the frame wall.
    const gem = sdf
      .extrude(profile.offsetProfile(TEARDROP, -0.0052), 0.02)
      .intersect(sdf.sphere(0.056).at(0, 0, -0.044))
      .rotateX(-90)
      .at(0, 0.004, Z_CENTER)
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    k.body('gem', gem, {
      color: '#0d3a4d',
      roughness: 0.12,
      emissive: '#35c2d6',
      emissiveIntensity: 1.4,
      flat: true,
      detail: 0.002,
      maxTriangles: 260,
      textureDensity: 2,
    });

    // ------------------------------------------------------------------ chain loop
    // Alternating flat / standing oval links around a small loop through the bail.
    const LR = 0.0032; // link ring radius
    const Lr = 0.0012; // link tube radius
    const CA = 0.01; // oval half width (X)
    const CB = 0.016; // oval half length (Z)
    const CZ = 0.044; // oval centre Z
    const N = 10;
    let chain: ReturnType<(typeof sdf)['torus']> | null = null;
    for (let i = 0; i < N; i++) {
      const th = (i / N) * Math.PI * 2;
      const x = CA * Math.sin(th);
      const z = CZ + CB * Math.cos(th);
      let tx = CA * Math.cos(th);
      let tz = -CB * Math.sin(th);
      const len = Math.hypot(tx, tz);
      tx /= len;
      tz /= len;
      const link =
        i % 2 === 0
          ? sdf
              .torus(LR, Lr)
              .rotateY((Math.atan2(tx, tz) * 180) / Math.PI)
              .at(x, Lr, z)
          : sdf
              .torus(LR, Lr)
              .rotateX(90)
              .rotateY((Math.atan2(tz, -tx) * 180) / Math.PI)
              .at(x, LR + Lr, z);
      chain = chain ? chain.union(link) : link;
    }
    k.body('chain', chain!.paintFn((_x, y, _z) => mixRgb(SILVER_DARK, SILVER_LIGHT, Math.min(1, Math.max(0, y / 0.01)))), {
      color: '#a8acb1',
      roughness: 0.38,
      metalness: 1,
      detail: 0.0016,
      maxTriangles: 520,
      paintWeight: 1,
    });
  },
});
