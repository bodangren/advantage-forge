import { defineAsset, mixRgb, noise, profile, rgb, sdf, type Rgb } from '../src/index.js';

/**
 * Design note — stone stairs (architecture/building-parts/stairs-stone).
 *
 * Role: a flight of dungeon stairs the player climbs; a level-building part that
 *   must read as chunky worn steps at 128 px.
 * Size: 1.2 m wide (X), 1.6 m run (Z), 1.0 m rise toward -Z, stands on y = 0, faces +Z.
 * One idea: five fat rounded steps climbing between two stepped walls of pillow
 *   blocks, like the mock — the chunky side blocks are the silhouette.
 * Shape language: square/blocky (sturdy) dominant, very round bevels (friendly, chunky).
 * Palette (60/30/10): stone mid cool gray #6f7680 dominant, dark #4b525c secondary
 *   (joints, shaded base), worn light top #9aa4b0 small accent on tread nosing.
 * Materials: one stone body for the step flight, one stone body for the side blocks
 *   (same values, same roughness 0.9; split only to keep block detail local).
 * Detail list: primary = stepped flight + two side walls (big); secondary = painted
 *   block joints and worn nosings (medium); tertiary = per-block tint + stone bump (small).
 * Focal point: the chunky side blocks stepping up the flight.
 * Rig/animation: none (static building part).
 */

const STONE = rgb('#6f7680'); // cool gray stone
const STONE_DARK = rgb('#4b525c'); // dark stone: joints, shaded base
const WORN = rgb('#9aa4b0'); // worn pale tread top
const WORN_HI = rgb('#b4bcc6'); // bleached nosing edge
const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (e0: number, e1: number, v: number): number => {
  const t = clamp01((v - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

const W = 1.2; // width across X
const Z_FRONT = 0.8; // front (low) edge
const Z_BACK = -0.8; // back (high) edge
const NSTEP = 5;
const RISE = 0.2; // 5 * 0.2 = 1.0 m rise
const RUN = 0.32; // 5 * 0.32 = 1.6 m run
const WALL_X = 0.49; // side wall center (0.22 m thick, outer face at 0.6)
const WALL_W = 0.22;
const WALL_LIFT = 0.15; // side wall rises this far above its tread

/** Which step run a z falls into (0 = lowest, at the front). */
const stepAt = (z: number): number =>
  Math.max(0, Math.min(NSTEP - 1, Math.floor((Z_FRONT - z) / RUN)));

/** Tread top height for a step index. */
const stepTop = (i: number): number => (i + 1) * RISE;

export default defineAsset({
  name: 'stairs-stone',
  description:
    'A flight of five chunky worn stone steps, 1.2 m wide, rising 1.0 m over 1.6 m toward -Z, with rounded edges and stepped walls of pillow blocks on both sides.',
  detail: 0.018,
  reference: 'docs/item-mockups/stairs-stone-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ step flight
    // Stair solid as one extruded profile (v = -z so the high end lands at -Z after
    // rotateY(90)), edges rounded. The base is cut flat at y = 0.
    const stairProfile = profile.polygon([
      [0.8, 0],
      [-0.8, 0],
      [-0.8, 0.2],
      [-0.48, 0.2],
      [-0.48, 0.4],
      [-0.16, 0.4],
      [-0.16, 0.6],
      [0.16, 0.6],
      [0.16, 0.8],
      [0.48, 0.8],
      [0.48, 1.0],
      [0.8, 1.0],
    ]);
    const flight = sdf
      .extrude(stairProfile, W, 0.028)
      .rotateY(90)
      .intersect(sdf.halfSpace([0, -1, 0], 0));

    const flightPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      const i = stepAt(z);
      const top = stepTop(i);
      let c = base;
      // Per-step tint so the flight is not one flat value.
      const tint = noise.random(i, 5, 2);
      c = mixRgb(c, STONE_DARK, 0.08 + 0.14 * tint);
      // Cool damp mottling on the vertical faces (kept off the worn tread tops).
      // Soft-edged: a hard clamp01 threshold on fbm reads as harsh camo speckle.
      const wear = smoothstep(top - 0.09, top - 0.015, y);
      const patch = noise.fbm(x * 4, y * 4, z * 4, 2);
      c = mixRgb(c, STONE_DARK, 0.2 * smoothstep(0.05, 0.55, -patch) * (1 - wear));
      // Soft shadow line under each nosing.
      const below = top - y;
      c = mixRgb(c, STONE_DARK, 0.2 * smoothstep(0.14, 0.05, below) * smoothstep(0.02, 0.05, below));
      // Worn pale tread top with a sun-bleached nosing, in one wide gradient.
      c = mixRgb(c, WORN, 0.8 * wear);
      c = mixRgb(c, WORN_HI, 0.45 * wear * wear);
      // Damp dark stone at the foot.
      c = mixRgb(c, STONE_DARK, 0.5 * smoothstep(0.2, 0.0, y));
      // The flat back face is plain stone: two painted block courses break it up.
      const back = smoothstep(Z_BACK + 0.05, Z_BACK + 0.015, z);
      if (back > 0) {
        const fy = (y / 0.4) % 1;
        const joint = smoothstep(0.045, 0.012, Math.min(fy, 1 - fy) * 0.4);
        c = mixRgb(c, STONE_DARK, back * (0.18 + 0.62 * joint));
      }
      return c;
    };
    k.body('flight', flight.paintFn(flightPaint), {
      color: STONE,
      roughness: 0.9,
      metalness: 0,
      detail: 0.016,
      maxTriangles: 2200,
      textureDensity: 2,
      paintWeight: 2,
      // No bump on this body: the bake projects texels onto the bump-perturbed
      // distance field, and on this coarse concave flight the projection slides
      // far enough to alias the painted wear bands into camo speckle.
      // The side blocks carry the stone grain instead.
    });

    // ------------------------------------------------------------------ side walls
    // One pillow block per step run per side: each rises WALL_LIFT above its tread,
    // so the wall silhouette steps up with the flight (the mock's chunky sides).
    const wallBlocks: sdf.Shape[] = [];
    for (let i = 0; i < NSTEP; i++) {
      const z0 = Z_FRONT - (i + 1) * RUN;
      const z1 = Z_FRONT - i * RUN;
      const h = stepTop(i) + WALL_LIFT;
      const jz = (noise.random(i, 9, 1) - 0.5) * 0.012;
      const jy = (noise.random(i, 9, 2) - 0.5) * 0.01;
      wallBlocks.push(
        sdf
          .box([WALL_W, h - 0.02, RUN - 0.035], 0.045)
          .at(WALL_X, (h - 0.02) / 2 + 0.01, (z0 + z1) / 2 + jz + jy * 0),
      );
    }
    const walls = sdf
      .union(...wallBlocks, ...wallBlocks.map((b) => b.mirror('x', 0)))
      .intersect(sdf.halfSpace([0, -1, 0], 0));

    const wallPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      const i = stepAt(z);
      const h = stepTop(i) + WALL_LIFT;
      let c = base;
      // Per-block tint.
      const tint = noise.random(i, 17, 3);
      c = mixRgb(c, STONE_DARK, 0.06 + 0.16 * tint);
      // Damp mottling, soft-edged like the flight's.
      const patch = noise.fbm(x * 4.5, y * 4.5, z * 4.5, 2);
      c = mixRgb(c, STONE_DARK, 0.2 * smoothstep(0.05, 0.55, -patch));
      // Dark recessed joints: vertical seam at every step boundary, horizontal mid-course.
      const fz = ((Z_FRONT - z) / RUN) % 1;
      const vJoint = smoothstep(0.085, 0.02, Math.min(fz, 1 - fz) * RUN);
      const midY = h * 0.52;
      const hJoint = smoothstep(0.045, 0.01, Math.abs(y - midY));
      const joint = Math.max(vJoint, hJoint);
      c = mixRgb(c, STONE_DARK, 0.85 * joint);
      c = mixRgb(c, rgb('#3a4048'), 0.5 * smoothstep(0.5, 0.05, Math.abs(y - midY)) * hJoint);
      // Worn pale top of each block: one wide gradient (narrow bands dither
      // into speckle on the rounded pillow tops at texel scale).
      const topWear = smoothstep(h - 0.12, h - 0.02, y);
      c = mixRgb(c, WORN, 0.85 * topWear);
      c = mixRgb(c, WORN_HI, 0.45 * topWear * topWear);
      // Damp dark base.
      c = mixRgb(c, STONE_DARK, 0.55 * smoothstep(0.22, 0.0, y));
      return c;
    };
    k.body('side-blocks', walls.paintFn(wallPaint), {
      color: STONE,
      roughness: 0.9,
      metalness: 0,
      detail: 0.02,
      maxTriangles: 3200,
      textureDensity: 2,
      paintWeight: 2,
      bump: (x, y, z) => {
        const h = stepTop(stepAt(z)) + WALL_LIFT;
        const fz = ((Z_FRONT - z) / RUN) % 1;
        const vJoint = smoothstep(0.085, 0.02, Math.min(fz, 1 - fz) * RUN);
        const hJoint = smoothstep(0.045, 0.01, Math.abs(y - h * 0.52));
        const groove = Math.max(vJoint, hJoint);
        return (
          0.0022 * noise.fbm(x * 24, y * 24, z * 24, 3, 7) +
          0.0008 * noise.noise3(x * 70, y * 70, z * 70) -
          0.0035 * groove
        );
      },
    });
  },
});
