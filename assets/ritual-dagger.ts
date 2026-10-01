import { HAND_FIT, defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — ritual dagger (equipment/magic-weapons/ritual-dagger).
 *
 * Role: an occult off-hand / altar item; must read at 128 px as a wavy black
 *   blade with one bright gem, not as a plain knife.
 * Size: 0.35 m long, lying horizontally along X on y = 0, broad face toward
 *   +Z, centred on the Y axis. Pommel at -X, tip at +X. The brief says "lying
 *   flat", so it rests low instead of standing point-up.
 * One idea: a serpentine obsidian blade with a glowing violet rune channel,
 *   held by a ribbed bone grip that ends in a fat faceted purple gem. The wave
 *   in the blade is the silhouette and the gem is the focal point.
 * Shape language: triangular/spiky dominant (wavy blade, bone spur) with a
 *   round secondary (ribbed grip, fat gem, round collar).
 * Palette: obsidian #241d2b / #141018 blade with a violet sheen #5a3f80; bone
 *   #d8cfb8 / #b3a68c; gold #d4a93a accent; rune and gem violet #a24bff over a
 *   dark base #2a0a3a.
 * Value plan: dark blade (largest area), light bone grip, small bright gold
 *   band and glowing violet at the pommel.
 * Materials: obsidian (roughness 0.25, metalness 0.3), rune glow (0.2,
 *   emissive 1.5), bone (0.5), gold (0.3, metalness 1), gem (0.1, flat,
 *   emissive 1.8).
 * Detail list: blade, rune line, bone grip + collar + spur (primary/secondary);
 *   gold band, gem facets (tertiary). Focal point: the gem pommel.
 * Rig/animation: none (static item).
 */

const OBSIDIAN = rgb('#241d2b');
const OBSIDIAN_DEEP = rgb('#141018');
const VIOLET_SHEEN = rgb('#5a3f80');
const BONE = rgb('#d8cfb8');
const BONE_DEEP = rgb('#b3a68c');
const BONE_WARM = rgb('#c9b98f');

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// ------------------------------------------------------------------ proportions
const BLADE_X0 = -0.010; // base of the blade (into the collar)
const BLADE_L = 0.185; // tip lands at x = 0.175
const BLADE_T = 0.013; // full thickness along Z
const Y0 = 0.039; // lifts the tilted assembly so the blade belly rests on y = 0
const TILT = 2.0; // degrees; drops the pommel onto the ground

// Wavy obsidian blade, drawn in XY: x runs to the tip, y is across the blade.
// The spine is nearly straight; the belly dips through a notch (the wave) into a
// fat belly, then sweeps up to the point.
const bladeOutline = profile.polygon(
  [
    [0.185, 0.000], // tip
    [0.168, 0.008],
    [0.140, 0.013],
    [0.100, 0.014],
    [0.050, 0.013],
    [0.000, 0.011],
    [0.000, -0.014],
    [0.012, -0.022],
    [0.032, -0.031],
    [0.050, -0.034],
    [0.066, -0.026], // the wave / notch
    [0.086, -0.040],
    [0.112, -0.042], // belly
    [0.140, -0.034],
    [0.164, -0.022],
  ],
  { smooth: true },
);

// Narrow channel down the middle of the blade that carries the rune glow.
const runeOutline = profile.polygon(
  [
    [0.145, -0.004],
    [0.110, -0.006],
    [0.070, -0.007],
    [0.020, -0.005],
    [0.000, -0.004],
    [0.000, -0.012],
    [0.020, -0.013],
    [0.070, -0.014],
    [0.110, -0.013],
  ],
  { smooth: true },
);

const bladePaint = (x: number, y: number, z: number) => {
  const t = clamp01((x - BLADE_X0) / BLADE_L); // 0 at base, 1 at tip
  const edge = clamp01((Math.abs(y + 0.012) - 0.006) / 0.02); // brightest at the edges
  let c = mixRgb(OBSIDIAN, OBSIDIAN_DEEP, 0.35 * (1 - t));
  c = mixRgb(c, VIOLET_SHEEN, 0.5 * edge * (0.4 + 0.6 * t));
  const sparkle = 0.5 + 0.5 * noise.fbm(x * 55, y * 55, z * 55, 2);
  return mixRgb(c, OBSIDIAN_DEEP, 0.16 * sparkle);
};

const bonePaint = (x: number, y: number, z: number) => {
  const t = clamp01((x + 0.115) / 0.08); // pale toward the collar
  const valley = 1 - Math.abs(Math.sin(x * 95)); // dark in the rib valleys
  let c = mixRgb(BONE_DEEP, BONE, t);
  c = mixRgb(c, BONE_WARM, 0.3 * valley);
  const grain = 0.5 + 0.5 * noise.fbm(x * 22, y * 90, z * 90, 2);
  return mixRgb(c, BONE_DEEP, 0.12 * grain);
};

export default defineAsset({
  name: 'ritual-dagger',
  description:
    'A 0.35 m ritual dagger lying flat: a wavy obsidian blade with a glowing violet rune channel, a ribbed bone grip with a bone spur, and a fat faceted purple gem pommel.',
  detail: 0.004,
  reference: 'docs/item-mockups/ritual-dagger-mock.jpg',
  texture: { size: 512 },
  equip: { slot: 'mainhand', fitScale: HAND_FIT, origin: [-0.09, 0.04, 0], rotate: [0, 0, -90] },

  build(k) {
    // ------------------------------------------------------------------ blade
    const blade = sdf
      .extrude(bladeOutline, BLADE_T, 0.004)
      .at(BLADE_X0, 0, 0)
      .paintFn(bladePaint)
      .rotateZ(TILT)
      .at(0, Y0, 0);
    k.body('blade', blade, {
      color: '#241d2b',
      roughness: 0.25,
      metalness: 0.3,
      detail: 0.0035,
      paintWeight: 1.5,
      maxTriangles: 700,
      bump: (x, y, z) => 0.0004 * noise.fbm(x * 90, y * 90, z * 300, 2),
    });

    // ------------------------------------------------------------------ rune glow
    const rune = sdf
      .extrude(runeOutline, BLADE_T + 0.005, 0.002)
      .at(BLADE_X0, 0, 0)
      .rotateZ(TILT)
      .at(0, Y0, 0);
    k.body('rune', rune, {
      color: '#240a30',
      roughness: 0.2,
      metalness: 0,
      emissive: '#a24bff',
      emissiveIntensity: 1.5,
      detail: 0.004,
      maxTriangles: 140,
    });

    // ------------------------------------------------------------------ bone grip, collar and spur
    const handle = sdf.capsule([-0.108, 0, 0], [-0.028, 0, 0], 0.011);
    const collar = sdf
      .cylinder(0.032, 0.022, 0.006)
      .rotateZ(90)
      .scale([1, 1, 0.72])
      .at(-0.020, 0, 0);
    const ribs = [-0.042, -0.062, -0.082, -0.100].map((x) =>
      sdf.torus(0.0135, 0.0045).rotateZ(90).at(x, 0, 0),
    );
    // A curved bone spur off the pommel that breaks the silhouette.
    const spur = sdf.chain(
      [
        [-0.126, 0.010, 0, 0.010],
        [-0.150, 0.026, 0, 0.007],
        [-0.170, 0.046, 0, 0.003],
      ],
      0.004,
    );
    const bone = sdf
      .smoothUnion(0.006, handle, collar, ...ribs)
      .union(spur)
      .paintFn(bonePaint)
      .rotateZ(TILT)
      .at(0, Y0, 0);
    k.body('bone', bone, {
      color: '#d8cfb8',
      roughness: 0.5,
      metalness: 0,
      detail: 0.004,
      paintWeight: 1.5,
      maxTriangles: 520,
      bump: (x, y, z) => 0.0012 * Math.abs(Math.sin(x * 95)) + 0.0005 * noise.fbm(x * 30, y * 30, z * 30, 2),
    });

    // ------------------------------------------------------------------ gold accent
    const goldBand = sdf
      .union(
        sdf.torus(0.030, 0.005).rotateZ(90).scale([1, 1, 0.72]).at(-0.010, 0, 0),
        sdf.torus(0.019, 0.004).rotateZ(90).at(-0.122, 0, 0),
      )
      .rotateZ(TILT)
      .at(0, Y0, 0);
    k.body('gold', goldBand, {
      color: '#d4a93a',
      roughness: 0.3,
      metalness: 1,
      detail: 0.004,
      maxTriangles: 200,
    });

    // ------------------------------------------------------------------ gem pommel
    const gem = sdf
      .intersect(sdf.box([0.036, 0.036, 0.036]).rotate(30, 40, 25), sdf.sphere(0.025))
      .at(-0.138, 0, 0)
      .rotateZ(TILT)
      .at(0, Y0, 0);
    k.body('gem', gem, {
      color: '#2a0a3a',
      roughness: 0.1,
      metalness: 0,
      emissive: '#a24bff',
      emissiveIntensity: 1.8,
      flat: true,
      detail: 0.004,
      maxTriangles: 140,
    });
  },
});
