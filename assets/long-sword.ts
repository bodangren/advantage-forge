import { HAND_FIT, defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Long sword (common shop version), 0.99 m, standing on its round pommel with the blade up (+Y);
 * the flat of the blade faces +Z. Broad chibi blade: 0.07 m wide, flat-diamond section (ridge
 * 0.02 m thick, edges 0.004 m), straight edges and a diamond point over the last 0.1 m.
 * Role: shop-stock melee weapon / pickup icon; a bold vertical silhouette at 128 px.
 * Size: 0.99 m tall (pommel r 0.03 m, grip 0.12 m long, shoulder before the point), grip centre y = 0.115, on y = 0, centred on the Y axis.
 * One idea: a chunky steel slab blade with a bright bevel band and a heavy ball guard.
 * Shape language: square blade, round balls (guard ends, pommel) and soft bevels.
 * Palette: steel #b9c0c8 with bevel #dfe4ea, dark steel #6e747c, leather #a8582a / gaps #6b3a1e.
 * Materials: blade steel (0.9 / 0.3, flat), dark steel (0.8 / 0.45), leather (0 / 0.72).
 * Detail: blade bevels (focal), guard with collar ring, 5 raised grip bands, pommel ball.
 * Rig/animation: none; a static item.
 */

const DARK = '#6e747c';
const STEEL = '#b9c0c8';
const BEVEL = '#dfe4ea';
const LEATHER = '#a8582a';
const GAP = '#6b3a1e';

const TOTAL = 0.99;
const POMMEL_Y = 0.03;
const POMMEL_R = 0.03;
const GRIP_BOT = 0.055;
const GRIP_TOP = 0.175;
const GUARD_Y = 0.197;
const GUARD_HALF = 0.1;
const BLADE_LEN = TOTAL - GUARD_Y;
const BLADE_W = 0.07;
const RIDGE = 0.02;
const EDGE = 0.004;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export default defineAsset({
  name: 'long-sword',
  description: 'Plain steel longsword with an iron crossguard and a leather-wrapped grip.',
  reference: 'docs/item-mockups/long-sword-mock.jpg',
  detail: 0.004,
  texture: { size: 1024 },
  equip: { slot: 'mainhand', fitScale: HAND_FIT, origin: [0, 0.115, 0] },

  build(k) {
    // ------------------------------------------------------------------ blade
    const hw = BLADE_W / 2;
    const outline = profile.polygon([
      [-hw, -0.02],
      [hw, -0.02],
      [hw, BLADE_LEN - 0.14],
      [hw + 0.006, BLADE_LEN - 0.12],
      [0, BLADE_LEN],
      [-hw - 0.006, BLADE_LEN - 0.12],
      [-hw, BLADE_LEN - 0.14],
    ]);
    // Flat diamond section: two tilted planes per face from the ridge to the edge.
    const dz = RIDGE / 2 - EDGE / 2;
    const nl = Math.hypot(dz, hw);
    const nx = dz / nl;
    const nz = hw / nl;
    const off = (RIDGE / 2) * nz;
    const hs = (sx: number, sz: number) => sdf.halfSpace([sx * nx, 0, sz * nz], off);
    const section = hs(1, 1).intersect(hs(-1, 1)).intersect(hs(1, -1)).intersect(hs(-1, -1));
    const cSteel = rgb(STEEL);
    const cBevel = rgb(BEVEL);
    const blade = sdf
      .extrude(outline, 0.2)
      .intersect(section)
      .at(0, GUARD_Y, 0)
      .paintFn((x) => {
        const t = clamp01((Math.abs(x) - 0.007) / 0.006);
        return mixRgb(cSteel, cBevel, t);
      });
    k.body('blade', blade, {
      color: STEEL,
      roughness: 0.3,
      metalness: 0.9,
      detail: 0.003,
      flat: true,
    });

    // ------------------------------------------------------------------ dark steel guard and pommel
    const guard = sdf.union(
      sdf.capsule([-GUARD_HALF, GUARD_Y, 0], [GUARD_HALF, GUARD_Y, 0], 0.016),
      sdf.sphere(0.024).at(GUARD_HALF + 0.008, GUARD_Y, 0).mirror('x', 0),
      sdf.torus(0.032, 0.013).scale([1.3, 1, 0.75]).at(0, GUARD_Y + 0.022, 0), // collar ring
    );
    const pommel = sdf.sphere(POMMEL_R).at(0, POMMEL_Y, 0);
    k.body('iron', sdf.union(guard, pommel), {
      color: DARK,
      roughness: 0.45,
      metalness: 0.8,
      detail: 0.004,
      bump: (x, y, z) => 0.0004 * noise.fbm(x * 60, y * 60, z * 60, 2),
    });

    // ------------------------------------------------------------------ leather grip
    const core = sdf.cylinder(0.02, GRIP_TOP - GRIP_BOT, 0.004).at(0, (GRIP_BOT + GRIP_TOP) / 2, 0);
    const ringYs = [0.07, 0.0925, 0.115, 0.1375, 0.16];
    const wraps = ringYs.map((y) => sdf.torus(0.0205, 0.0075).at(0, y, 0));
    const cLeather = rgb(LEATHER);
    const cGap = rgb(GAP);
    const grip = sdf.smoothUnion(0.002, core, ...wraps).paintFn((x, y) => {
      const d = Math.min(...ringYs.map((r) => Math.abs(y - r)));
      return mixRgb(cLeather, cGap, clamp01((d - 0.004) / 0.004));
    });
    k.body('grip', grip, {
      color: LEATHER,
      roughness: 0.72,
      metalness: 0,
      detail: 0.0035,
      bump: (x, y, z) => 0.0008 * Math.abs(Math.sin(Math.atan2(z, x) * 3 + y * 120)),
    });
  },
});
