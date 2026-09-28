import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — rain puddle (nature/terrain/puddle).
 *
 * Role: small terrain dressing for the chibi hamlet; sits on grass or dirt and must
 *   read as a glossy water shape at 128 px. Background prop, low detail budget.
 * Size: 0.9 m wide, ~0.85 m deep, water surface ~0.016 m above the ground, lies on
 *   y = 0, centred on the Y axis, faces +Z.
 * One idea: a mirror-flat dark blue-grey rain puddle with a lobed, irregular outline,
 *   one fat rounded bulge where the water pools, and two stray drops beside it.
 * Shape language: round/organic dominant (soft splat outline), flat secondary
 *   (level water plane gives the calm mirror read).
 * Palette: water dark blue-grey #33414f dominant, deep #1a222b, sky sheen #9ab4cb;
 *   muddy rim dark walnut #6b4226, wet brown #4a2c16, wet dark #2a190b.
 * Materials: water (roughness 0.05, metalness 0, whisper of grain in bump); mud
 *   (roughness 0.9, metalness 0, grainy bump).
 * Detail list: primary lobed water slab + pooled bulge (focal), secondary two stray
 *   drops, tertiary thin muddy rim and a soaked-earth halo. Rig/animation: none.
 */

const WATER = rgb('#33414f');
const WATER_DEEP = rgb('#1a222b');
const WATER_SHEEN = rgb('#9ab4cb');
const MUD = rgb('#4a2c16');
const MUD_LIGHT = rgb('#6b4226');
const MUD_DARK = rgb('#2a190b');

const WATER_TOP = 0.016; // water surface height above ground
const MUD_TOP = 0.008; // muddy rim sits just below the water film
const GROUND = sdf.halfSpace([0, -1, 0], 0); // keep every part on y >= 0
const S = 0.98; // overall scale, so the finished puddle is ~0.9 m wide

const clamp01 = (t: number): number => (t < 0 ? 0 : t > 1 ? 1 : t);

// Irregular rain-splat outline (0.9 m wide). Wavy radii give the lobed edge.
const OUTLINE = profile.polygon(
  [
    [0.42, 0.02],
    [0.28, 0.33],
    [0.06, 0.40],
    [-0.17, 0.31],
    [-0.33, 0.35],
    [-0.42, 0.08],
    [-0.33, -0.12],
    [-0.20, -0.27],
    [0.01, -0.40],
    [0.22, -0.33],
    [0.40, -0.18],
  ],
  { smooth: true, samples: 10 },
);
// Thin muddy rim: a slightly larger, lower copy of the outline.
const MUD_OUTLINE = profile.offsetProfile(OUTLINE, 0.024);

// A low rounded pool and two stray drops, each resting on y = 0.
const pooled = (x: number, z: number, rx: number, ry: number, rz: number) =>
  sdf.ellipsoid([rx, ry, rz]).at(x, ry, z).displace(0.004, (px, py, pz) => noise.fbm(px * 9, py * 9, pz * 9, 2));

const water = sdf
  .extrude(OUTLINE, 0.016, 0.006)
  .rotateX(90)
  .at(0, WATER_TOP / 2, 0)
  .smoothUnion(
    0.012,
    pooled(0.23, -0.20, 0.11, 0.034, 0.10),
    pooled(-0.41, 0.26, 0.05, 0.032, 0.044),
    pooled(0.36, 0.26, 0.042, 0.028, 0.038),
  )
  .intersect(GROUND)
  .scale(S);

// A raised wet rim plus a wider, flatter halo of soaked dark earth around it.
const stain = sdf
  .extrude(profile.offsetProfile(OUTLINE, 0.075), 0.005, 0.003)
  .rotateX(90)
  .at(0, 0.0025, 0)
  .intersect(GROUND);

const mud = sdf
  .union(
    sdf
      .extrude(MUD_OUTLINE, 0.010, 0.004)
      .rotateX(90)
      .at(0, MUD_TOP / 2, 0)
      .displace(0.004, (x, y, z) => noise.fbm(x * 8, y * 8, z * 8, 2))
      .intersect(GROUND),
    stain,
  )
  .displace(0.002, (x, y, z) => noise.fbm(x * 15, y * 15, z * 15, 2))
  .intersect(GROUND)
  .scale(S);

export default defineAsset({
  name: 'puddle',
  description:
    'A flat irregular rain puddle 0.9 m wide with a glossy dark blue-grey water surface and a thin muddy rim.',
  detail: 0.02,
  reference: 'docs/item-mockups/puddle-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ water
    const waterPaint = (x: number, _y: number, z: number) => {
      const u = x / S;
      const v = z / S;
      const r = Math.hypot(u / 0.42, v / 0.40);
      // Deep pool in the middle, a reflected-sky sheen toward the rim.
      let c = mixRgb(WATER_DEEP, WATER, clamp01(r * 1.25));
      c = mixRgb(c, WATER_SHEEN, 0.3 * clamp01((r - 0.45) / 0.55));
      // Stylised reflection: a dark lip along the near (+Z) edge and a bright
      // patch of reflected sky toward the back, so the water has value range.
      const near = clamp01((v + 0.2) / 0.6);
      c = mixRgb(c, WATER_DEEP, 0.6 * near);
      const bright = Math.exp(-((u / 0.26) ** 2 + ((v + 0.16) / 0.2) ** 2));
      c = mixRgb(c, WATER_SHEEN, 0.55 * bright);
      // Muddy contamination right at the edge.
      c = mixRgb(c, MUD, 0.45 * clamp01((r - 0.82) / 0.26));
      const n = 0.5 + 0.5 * noise.fbm(x * 4, 0, z * 4, 2);
      c = mixRgb(c, WATER_SHEEN, 0.1 * n);
      return c;
    };
    k.body('water', water.paintFn(waterPaint), {
      color: '#33414f',
      roughness: 0.05,
      metalness: 0,
      detail: 0.007,
      paintWeight: 2,
      maxTriangles: 1000,
      // Keep the mirror clean: only a whisper of texture in the normal map.
      bump: (x, _y, z) => 0.00025 * noise.fbm(x * 20, 0, z * 20, 2),
    });

    // ------------------------------------------------------------------ muddy rim
    k.body(
      'mud',
      mud.paintFn((x, _y, z) => {
        const r = Math.hypot(x / (0.44 * S), z / (0.42 * S));
        const n = 0.5 + 0.5 * noise.fbm(x * 9, 0, z * 9, 2);
        let c = mixRgb(MUD_DARK, MUD_LIGHT, 0.35 + 0.5 * n);
        // Raised rim: wetter and darker where it meets the water.
        c = mixRgb(c, MUD_DARK, 0.55 * clamp01((1.06 - r) / 0.25));
        // Outer halo of soaked earth, very dark, drying lighter at the far edge.
        c = mixRgb(c, MUD_DARK, 0.85 * clamp01((r - 1.02) / 0.06));
        c = mixRgb(c, MUD, 0.45 * clamp01((r - 1.13) / 0.06));
        return c;
      }),
      {
        color: '#4a2c16',
        roughness: 0.9,
        metalness: 0,
        detail: 0.006,
        paintWeight: 2,
        maxTriangles: 700,
        bump: (x, _y, z) => 0.002 * noise.fbm(x * 26, 0, z * 26, 2),
      },
    );
  },
});
