import { defineAsset, mixRgb, noise, rgb, sdf, type Rgb, type Sdf } from '../src/index.js';

/**
 * Design note — dungeon wall lever switch (props/world/switch).
 *
 * Role: interactive dungeon prop for the Sunken Vault; the player flips it to open a gate.
 *   Must read at 128 px as "iron plate with a lever and a red handle knob".
 * Size: 0.30 m wide x 0.50 m tall plate, standing on y = 0, centred on the Y axis,
 *   front toward +Z. The lever tilts up and forward to about 0.45 m.
 * One idea: a chunky iron wall plate with a raised frame and two slots, holding one heavy
 *   iron lever tipped with a warm wooden grip and a fat red knob; two red end caps break
 *   the plate outline at the sides.
 * Shape language: square dominant (plate, frame, slots, slots) with a round secondary
 *   (boss, lever shaft, grip, faceted red caps). The tilted lever breaks the flat silhouette.
 * Palette: worn iron #4a4f55 / #363a3f / highlight #a8acb1 dominant; wood #8a5a30 / #4e2c13
 *   secondary; the accent is the red knob #bf3a28 (about 10%); gold #d4a93a on the axle cap.
 * Materials: worn iron (roughness 0.5, metalness 0.7), wood (roughness 0.82, metalness 0),
 *   red painted iron (roughness 0.42, metalness 0.15), gold (roughness 0.3, metalness 1).
 * Detail: primary plate + frame + lever + grip; secondary slots, boss, rivets, axle cap,
 *   side caps, collars; tertiary worn grit and wood grain in paint and `bump`.
 *   Focal point: the red knob at the lever tip.
 * Rig/animation: base + handle bones; the lever flips down.
 */

const IRON = rgb('#5c626a');
const IRON_DARK = rgb('#383d43');
const IRON_LIGHT = rgb('#a8acb1');
const WOOD = rgb('#8a5a30');
const WOOD_DARK = rgb('#4e2c13');
const WOOD_LIGHT = rgb('#c08a4e');

const RED = '#c9452c';
const GOLD = '#d4a93a';

// Wall plate.
const PW = 0.3; // width (X)
const PH = 0.5; // height (Y)
const CY = PH / 2; // plate centre height

// Lever mechanism. Rest pose: tilted 45 deg up and forward out of the plate.
const PIVOT: [number, number, number] = [0, 0.255, 0.078];
const TILT = (45 * Math.PI) / 180;
const DIR: [number, number, number] = [0, Math.cos(TILT), Math.sin(TILT)];
const along = (t: number): [number, number, number] => [
  PIVOT[0] + DIR[0] * t,
  PIVOT[1] + DIR[1] * t,
  PIVOT[2] + DIR[2] * t,
];
/** Distance of a point along the lever axis, measured from the pivot. */
const axisV = (y: number, z: number): number =>
  (y - PIVOT[1]) * DIR[1] + (z - PIVOT[2]) * DIR[2];

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const ss = (a: number, b: number, v: number): number => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** Worn iron: mottled patches, a soft vertical value plan, a faint sheen, grit. */
const ironPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
  const patch = noise.fbm(x * 11, y * 11, z * 11, 3, 6);
  let c = mixRgb(base, IRON_DARK, Math.max(0, patch) * 0.3);
  c = mixRgb(c, IRON_LIGHT, Math.max(0, -patch) * 0.28);
  // Value plan: lit worn crown up top, damp shaded foot.
  const t = clamp01(y / PH);
  c = mixRgb(c, IRON_LIGHT, 0.22 * ss(0.45, 1.0, t));
  c = mixRgb(c, IRON_DARK, 0.32 * (1 - ss(0.0, 0.4, t)));
  const grit = noise.fbm(x * 46, y * 46, z * 46, 2, 12);
  c = mixRgb(c, IRON_DARK, Math.max(0, grit) * 0.1);
  return c;
};

const ironBump = (x: number, y: number, z: number): number =>
  0.0009 * noise.fbm(x * 34, y * 34, z * 34, 2, 13);

/** Wood grain running along the lever axis, dark near the collars, lit in the middle. */
const woodPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
  const v = axisV(y, z);
  const f = clamp01((v - 0.165) / 0.11); // 0..1 along the grip
  const grain = 0.5 + 0.5 * noise.fbm(v * 26, x * 9, z * 9, 2, 4);
  let c = mixRgb(base, WOOD_DARK, 0.16 + 0.42 * grain);
  c = mixRgb(c, WOOD_LIGHT, 0.24 * ss(0.35, 0.6, f) * (1 - ss(0.85, 1, f)));
  const end = Math.min(f, 1 - f);
  c = mixRgb(c, WOOD_DARK, 0.42 * (1 - ss(0.0, 0.14, end)));
  return c;
};

const woodBump = (x: number, y: number, z: number): number => {
  const v = axisV(y, z);
  return 0.0016 * noise.fbm(v * 30, x * 10, z * 10, 2, 7);
};

/** A chunky faceted red cap, the accent of the switch. */
const redCap = (w: number, h: number, d: number): Sdf =>
  sdf.box([w, h, d], 0.03).paintFn((x, y, z) => {
    const n = 0.5 + 0.5 * noise.noise3(x * 24, y * 24, z * 24);
    let c = mixRgb(rgb(RED), rgb('#7e2116'), 0.35 * n);
    c = mixRgb(c, rgb('#e2643f'), clamp01((y / (h * 0.5)) * 0.5 + 0.5) * 0.22);
    return c;
  });

export default defineAsset({
  name: 'switch',
  description:
    'Dungeon wall lever switch: an iron plate with a raised frame and two slots, a red-capped axle, and an up-tilted iron lever with a wooden grip and a red end knob. Base and handle flip.',
  reference: 'docs/item-mockups/switch-mock.jpg',
  detail: 0.008,
  texture: { size: 1024 },

  build(k) {
    k.skeleton({
      base: { at: [0, 0, 0] },
      handle: { parent: 'base', at: PIVOT },
    });

    // ------------------------------------------------------------------ plate + frame
    // Flat back plate, a raised rounded frame, and a recessed inner panel.
    const basePlate = sdf.box([PW, PH, 0.05], 0.024).at(0, CY, 0);
    const ringOuter = sdf.box([PW + 0.014, PH + 0.014, 0.058], 0.024).at(0, CY, 0.012);
    const ringHole = sdf.box([PW - 0.055, PH - 0.055, 0.2], 0.02).at(0, CY, 0.012);
    const frame = ringOuter.subtract(ringHole);
    // Two vertical slots through the inner panel, one each side of the boss.
    const slots = sdf.union(
      sdf.box([0.022, 0.16, 0.3], 0.008).at(0.082, 0.3, 0).mirror('x', 0),
    );
    const plate = sdf
      .smoothUnion(0.006, basePlate, frame)
      .subtract(slots)
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .paintFn(ironPaint);
    k.body('plate', plate, {
      color: '#5c626a',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.011,
      maxError: 0.005,
      maxTriangles: 900,
      paintWeight: 1,
      bump: ironBump,
      bone: 'base',
    });

    // ------------------------------------------------------------------ boss, axle, rivets
    // Round pivot housing on the plate, a gold axle cap at its centre, and corner rivets.
    const boss = sdf
      .cylinder(0.058, 0.06, 0.012)
      .rotateX(90)
      .at(0, CY, 0.052)
      .smoothUnion(0.008, sdf.cylinder(0.03, 0.1, 0.01).rotateX(90).at(0, CY, 0.07));
    const rivets = sdf.union(
      sdf.sphere(0.013).at(0.128, CY + 0.19, 0.032).mirror('x', 0),
      sdf.sphere(0.013).at(0.128, CY - 0.19, 0.032).mirror('x', 0),
    );
    const pivotIron = boss
      .smoothUnion(0.008, rivets)
      .paintFn(ironPaint);
    k.body('pivot-iron', pivotIron, {
      color: '#5c626a',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.006,
      maxError: 0.002,
      maxTriangles: 550,
      bump: ironBump,
      bone: 'base',
    });
    const axle = sdf.cylinder(0.042, 0.026, 0.006).rotateX(90).at(0, CY, 0.112);
    k.body('axle', axle, {
      color: GOLD,
      roughness: 0.3,
      metalness: 1,
      detail: 0.005,
      maxTriangles: 140,
      bone: 'base',
    });

    // ------------------------------------------------------------------ side caps
    // Two chunky faceted red caps on the plate sides (see the mock), tilted for a hand-cut read.
    const cap = (sx: number): Sdf =>
      redCap(0.09, 0.1, 0.085)
        .rotate(12, 18 * sx, 14 * sx)
        .at(sx * (PW / 2 + 0.012), CY - 0.015, 0.01);
    k.body('side-caps', sdf.union(cap(1), cap(-1)), {
      color: RED,
      roughness: 0.42,
      metalness: 0.15,
      detail: 0.007,
      maxError: 0.002,
      maxTriangles: 420,
      flat: true,
      bone: 'base',
    });

    // ------------------------------------------------------------------ lever: iron shaft
    // Tapered shaft from the boss to the grip, with an iron collar under the hand.
    const shaft = sdf.cone(along(-0.06), along(0.17), 0.021, 0.015).paintFn(ironPaint);
    const collar = sdf.cone(along(0.152), along(0.176), 0.027, 0.025);
    k.body('lever-iron', shaft.smoothUnion(0.005, collar), {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.005,
      maxError: 0.002,
      maxTriangles: 520,
      bump: ironBump,
      bone: 'handle',
    });

    // ------------------------------------------------------------------ wooden grip
    const grip = sdf
      .cone(along(0.166), along(0.276), 0.019, 0.024)
      .paintFn(woodPaint);
    k.body('grip', grip, {
      color: '#8a5a30',
      roughness: 0.82,
      metalness: 0,
      detail: 0.005,
      maxError: 0.002,
      maxTriangles: 420,
      paintWeight: 1,
      bump: woodBump,
      bone: 'handle',
    });

    // ------------------------------------------------------------------ red end knob
    const knob = redCap(0.06, 0.06, 0.06)
      .rotate(20, 15, 25)
      .at(...along(0.288));
    k.body('knob', knob, {
      color: RED,
      roughness: 0.42,
      metalness: 0.15,
      detail: 0.006,
      maxError: 0.002,
      maxTriangles: 320,
      flat: true,
      bone: 'handle',
    });

    // ------------------------------------------------------------------ clip
    const easeOutBack = (t: number): number => 1 + 2.2 * (t - 1) ** 3 + 1.2 * (t - 1) ** 2;
    // The lever rests tilted up; flipping swings the handle forward to horizontal.
    // The lever is longer than half the plate, so a full down-swing would hit the floor.
    k.animation('flip', {
      duration: 0.85,
      loop: false,
      pose: (_t, p) => ({
        handle: { rotate: [92 * easeOutBack(Math.min(1, p * 1.12)), 0, 0] },
      }),
    });
  },
});
