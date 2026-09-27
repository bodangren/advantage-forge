import { defineAsset, mixRgb, noise, rgb, sdf, type Rgb } from '../src/index.js';

/**
 * Design note — dungeon wall lever (props/world/lever).
 *
 * Role: interactive dungeon prop for the Sunken Vault; the player flips it to open a gate.
 *   Must read at 128 px as "stone block with an iron lever".
 * Size: 0.42 x 0.38 m stone block, 0.40 m tall; the lever adds height to ~0.9 m.
 *   Stands on y = 0, centred on the Y axis, front toward +Z.
 * One idea: one heavy chunky stone block split by deep mortar, gripped by an iron slot
 *   plate, with the iron lever pulled halfway and topped by a fat round wooden grip.
 * Shape language: square dominant (block, plate, brackets, sturdy) with a round secondary
 *   (bevels, pin, lever shaft, grip). The tilted lever breaks the blocky silhouette.
 * Palette: dungeon stone #6f7680 dominant, dark #454c56 (damp base and shading), light #9aa3ad
 *   (worn block crowns), mortar #2b3138; worn iron #4a4f55 / #363a3f / highlight #a8acb1;
 *   the single warm accent is the terracotta wood grip #b0674a (matches the mock).
 * Materials: stone (roughness 0.9, metalness 0), worn iron (roughness 0.5, metalness 0.7),
 *   wood (roughness 0.82, metalness 0). Mortar and grain live in paint and `bump`.
 * Detail: primary block + plate + lever + grip; secondary brackets, pin, collars, corner
 *   feet; tertiary mortar grooves and grit in `bump`. Focal point: the warm grip.
 * Rig/animation: base + handle bones; the handle pulls down.
 */

const STONE = rgb('#6f7680');
const STONE_DARK = rgb('#454c56');
const STONE_LIGHT = rgb('#9aa3ad');
const MORTAR = rgb('#2b3138');
const IRON = rgb('#4a4f55');
const IRON_DARK = rgb('#363a3f');
const IRON_LIGHT = rgb('#a8acb1');
const WOOD = rgb('#b0674a');
const WOOD_DARK = rgb('#7a4028');
const WOOD_LIGHT = rgb('#cf9270');
const SLOT = rgb('#1c1f24');

const W = 0.42; // block width (X)
const D = 0.38; // block depth (Z)
const H = 0.4; // block height
const HALF_W = W / 2;
const HALF_D = D / 2;

// Lever mechanism geometry.
const PIVOT: [number, number, number] = [0, 0.515, 0];
const DIR: [number, number, number] = [0, Math.SQRT1_2, Math.SQRT1_2]; // 45 deg: pulled halfway
const along = (t: number): [number, number, number] => [
  PIVOT[0] + DIR[0] * t,
  PIVOT[1] + DIR[1] * t,
  PIVOT[2] + DIR[2] * t,
];

const ss = (a: number, b: number, v: number): number => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Brick cell under a point on a side face: joint strength (1 in the mortar) and brick id. */
function brickAt(x: number, y: number, z: number): { joint: number; id: number; top: number } {
  const useX = Math.abs(x) / HALF_W >= Math.abs(z) / HALF_D; // x-dominant face -> tangent is z
  const u = useX ? z : x;
  const rowH = 0.118;
  const row = Math.floor(y / rowH);
  const colW = 0.165;
  const uu = u + ((row & 1) === 1 ? colW * 0.5 : 0);
  const col = Math.floor(uu / colW);
  const fu = uu / colW - col;
  const fv = y / rowH - row;
  const eu = Math.min(fu, 1 - fu);
  const ev = Math.min(fv, 1 - fv);
  const joint = 1 - ss(0.0, 1.0, Math.min(eu / 0.05, ev / 0.08, 1));
  return { joint, id: row * 13 + col + (useX ? 211 : 0), top: ss(0.33, 0.4, y) };
}

/** Stone paint: per-brick value, worn crown, damp base, grit, dark recessed mortar. */
function stonePaint(x: number, y: number, z: number, base: Rgb): Rgb {
  const { joint, id, top } = brickAt(x, y, z);
  const t = (noise.random(id, 5) - 0.5) * 2;
  let c = t < 0 ? mixRgb(STONE, STONE_DARK, -t * 0.6) : mixRgb(STONE, STONE_LIGHT, t * 0.5);
  c = mixRgb(c, base, 0.12);
  const mottle = noise.fbm(x * 9, y * 9, z * 9, 3, 4);
  c = mottle < 0 ? mixRgb(c, STONE_DARK, -mottle * 0.16) : mixRgb(c, STONE_LIGHT, mottle * 0.08);
  // Value plan: shaded lower block, light worn crown, so the shape is not one flat mid tone.
  c = mixRgb(c, STONE_DARK, (1 - Math.min(1, y / H)) * 0.26);
  c = mixRgb(c, STONE_LIGHT, top * 0.3);
  c = mixRgb(c, STONE_DARK, ss(0.16, 0.0, y) * 0.28); // damp rise from the floor
  const grit = noise.fbm(x * 44, y * 44, z * 44, 2, 11);
  c = mixRgb(c, STONE_DARK, Math.max(0, grit) * 0.08);
  return mixRgb(c, MORTAR, joint * 0.8);
}

/** Stone bump: recessed mortar grooves plus a faint grit; grooves match the paint joints. */
function stoneBump(x: number, y: number, z: number): number {
  const { joint } = brickAt(x, y, z);
  return -0.0032 * joint + 0.001 * noise.fbm(x * 30, y * 30, z * 30, 2, 9);
}

const easeOutBack = (t: number): number => 1 + 2.2 * (t - 1) ** 3 + 1.2 * (t - 1) ** 2;

export default defineAsset({
  name: 'lever',
  description:
    'Dungeon wall lever on a chunky stone block: an iron slot plate with brackets and a pin, an iron lever pulled halfway, and a round wooden grip. Base and handle pull down.',
  reference: 'docs/item-mockups/lever-mock.jpg',
  detail: 0.008,
  texture: { size: 1024 },

  build(k) {
    k.skeleton({
      base: { at: [0, 0, 0] },
      handle: { parent: 'base', at: PIVOT },
    });

    // ------------------------------------------------------------------ stone block
    // Three stacked ashlar courses, jittered so the bed joints read, plus four chunky
    // corner feet that break the outline at the ground.
    const courses = sdf.smoothUnion(
      0.012,
      sdf.box([W, 0.14, D], 0.02).at(0, 0.07, 0),
      sdf.box([W - 0.006, 0.13, D + 0.01], 0.02).at(0, 0.205, 0),
      sdf.box([W + 0.005, 0.13, D - 0.008], 0.02).at(0, 0.335, 0),
    );
    const feet = sdf
      .box([0.125, 0.09, 0.125], 0.028)
      .at(0.176, 0.045, 0.148)
      .mirror('x', 0)
      .mirror('z', 0);
    const block = sdf
      .smoothUnion(0.012, courses, feet)
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    k.body('stone', block.paintFn(stonePaint), {
      color: '#6f7680',
      roughness: 0.9,
      metalness: 0,
      detail: 0.01,
      maxError: 0.005,
      maxTriangles: 1320,
      paintWeight: 1,
      bump: stoneBump,
      bone: 'base',
    });

    // ------------------------------------------------------------------ iron bracket
    // Flat slot plate on the block top, a raised slotted track, two cheeks and the pin.
    const plate = sdf.box([0.35, 0.028, 0.3], 0.01).at(0, H + 0.014, 0);
    const track = sdf.box([0.09, 0.032, 0.27], 0.009).at(0, H + 0.036, 0);
    const slot = sdf.box([0.042, 0.07, 0.21], 0.004).at(0, H + 0.05, 0);
    const cheeks = sdf
      .box([0.024, 0.135, 0.105], 0.009)
      .at(0.052, 0.4875, 0)
      .mirror('x', 0);
    const pin = sdf.cylinder(0.016, 0.17, 0.004).rotateZ(90).at(PIVOT[0], PIVOT[1], PIVOT[2]);
    const bracket = sdf
      .smoothUnion(0.006, plate, track, cheeks, pin)
      .subtract(slot)
      .paintFn((x, y, z, base) => {
        const patch = noise.fbm(x * 10, y * 10, z * 10, 3, 6);
        let c = mixRgb(base, IRON_DARK, Math.max(0, patch) * 0.3);
        c = mixRgb(c, IRON_LIGHT, Math.max(0, -patch) * 0.14);
        return c;
      })
      .paintWhere(slot.round(0.002), SLOT, 0.004);
    k.body('bracket', bracket, {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.008,
      maxError: 0.0025,
      maxTriangles: 430,
      bump: (x, y, z) => 0.0009 * noise.fbm(x * 34, y * 34, z * 34, 2, 13),
      bone: 'base',
    });

    // ------------------------------------------------------------------ iron lever arm
    // A tapered shaft with a short tail that drops into the slot, plus a rounded tip cap.
    const arm = sdf
      .smoothUnion(
        0.01,
        sdf.cone(along(-0.09), along(0.5), 0.026, 0.017),
        sdf.sphere(0.019).at(...along(0.5)),
      )
      .paintFn((x, y, z, base) => {
        const n = 0.5 + 0.5 * noise.noise3(x * 22, y * 22, z * 22);
        let c = mixRgb(base, IRON_LIGHT, 0.16 * n);
        c = mixRgb(c, IRON_DARK, 0.22 * (0.5 + 0.5 * noise.fbm(x * 8, y * 8, z * 8, 2, 5)));
        return c;
      });
    k.body('arm', arm, {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.006,
      maxError: 0.002,
      maxTriangles: 700,
      bump: (x, y, z) => 0.0008 * noise.fbm(x * 40, y * 40, z * 40, 2, 17),
      bone: 'handle',
    });

    // Collars where the wood grip meets the iron shaft.
    const collarA = sdf.cylinder(0.04, 0.016, 0.005).rotateX(45).at(...along(0.285));
    const collarB = sdf.cylinder(0.04, 0.016, 0.005).rotateX(45).at(...along(0.475));
    k.body('collars', sdf.union(collarA, collarB), {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.006,
      maxTriangles: 220,
      bone: 'handle',
    });

    // ------------------------------------------------------------------ wooden grip
    const grip = sdf.cylinder(0.036, 0.18, 0.014).rotateX(45).at(...along(0.38));
    k.body('grip', grip.paintFn((x, y, z, base) => {
      const a = alongAxis(y, z); // distance along the lever axis through the grip
      const f = (a - 0.29) / 0.18; // 0..1 along the grip
      const grain = 0.5 + 0.5 * noise.fbm(a * 30, x * 10, 3, 2, 3);
      let c = mixRgb(base, WOOD_DARK, 0.18 + 0.4 * grain);
      // polished, lighter band where the hand wraps the middle
      c = mixRgb(c, WOOD_LIGHT, 0.25 * ss(0.4, 0.6, f) * (1 - ss(0.85, 1, f)));
      // darker at both ends, where the hand never polishes
      const end = Math.min(f, 1 - f);
      c = mixRgb(c, WOOD_DARK, 0.4 * (1 - ss(0.0, 0.12, end)));
      return c;
    }), {
      color: '#b0674a',
      roughness: 0.82,
      metalness: 0,
      detail: 0.005,
      maxTriangles: 360,
      bone: 'handle',
      bump: (x, y, z) => 0.0016 * noise.fbm(x * 30, y * 30, z * 30, 2, 7),
    });

    // ------------------------------------------------------------------ clip
    // The lever rests halfway; pulling it swings the handle from up to down-forward.
    k.animation('pull', {
      duration: 0.9,
      loop: false,
      pose: (_t, p) => ({
        handle: { rotate: [-45 + 135 * easeOutBack(Math.min(1, p * 1.12)), 0, 0] },
      }),
    });
  },
});

/** Distance of a point below the pivot measured along the lever axis (for shading). */
function alongAxis(y: number, z: number): number {
  return (y - PIVOT[1]) * DIR[1] + (z - PIVOT[2]) * DIR[2];
}
