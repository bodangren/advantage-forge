import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note — steel greaves (equipment/armor/greaves).
 *
 * Role: shop pickup and inventory icon for chibi heroes. Must read at 128 px as a pair.
 * Size: each greave 0.4 m tall, pair about 0.3 m wide. On y = 0, centered on the Y axis,
 *   front toward +Z.
 * One idea: two upright steel shin plates with an S-curved leg profile, a domed polished
 *   knee cap, and dark leather straps with brass buckles.
 * Shape language: round dominant (chain curve, knee dome); square secondary (buckles).
 * Palette: iron #4a4f55, shadow #363a3f, highlight #a8acb1, steel edge #c8ccd2 on the
 *   knee and rims; leather #5c3a22 / #8a5a35 straps; brass #d4a93a buckles (accent).
 * Materials: worn iron (roughness 0.5, metalness 0.7), leather (0.65, 0), brass (0.3, 1).
 * Detail: curved shin plate, knee dome, center ridge, bottom rim, two straps per greave
 *   with a side buckle, one boss on the knee. Focal point: the brass buckles. No rig.
 *
 * Local frame: +Y up, +Z front. One greave built at x = 0, copied with .mirror('x', 0).
 */

const IRON = rgb('#4a4f55');
const IRON_DARK = rgb('#363a3f');
const IRON_HI = rgb('#a8acb1');
const STEEL = rgb('#c8ccd2');
const LEATHER_HI = rgb('#8a5a35');
const BRASS_HI = rgb('#f0d48a');

const SPAN = 0.098;
const YAW = -8;

function place(s: sdf.Shape): sdf.Shape {
  // Toes yaw slightly outward, then set the pair apart; mirror copies hard-surface.
  return s.rotateY(YAW).at(SPAN, 0, 0).mirror('x', 0);
}

export default defineAsset({
  name: 'greaves',
  description:
    'A pair of steel greaves standing upright: S-curved shin plates, domed knee caps, and leather straps with brass buckles.',
  detail: 0.006,
  reference: 'docs/item-mockups/greaves-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------- iron shin plate
    // Chain of tapered segments traces a shin: ankle forward, shin bone bulging,
    // calf back, then the knee dome on top.
    const plate = sdf
      .chain(
        [
          [0, 0.045, 0.024, 0.047], // ankle flare over the instep
          [0, 0.125, 0.026, 0.05], // shin bulge
          [0, 0.235, 0.014, 0.052], // upper shin
          [0, 0.315, 0.004, 0.048], // below the knee
        ],
        0.022,
      )
      .scale([1.14, 1, 0.94]); // wider than deep, like a leg
    const knee = sdf.ellipsoid([0.058, 0.05, 0.047]).at(0, 0.342, 0.016);
    const neck = sdf.cylinder(0.047, 0.028, 0.01).scale([1.18, 1, 0.98]).at(0, 0.38, 0.006);
    const greave = plate.smoothUnion(0.012, knee).smoothUnion(0.01, neck); // flat top opening

    const ironPainted = greave
      .paintFn((x, y, z, base) => {
        const front = Math.max(0, Math.min(1, (z - 0.008) / 0.04));
        const back = Math.max(0, Math.min(1, (-z - 0.01) / 0.03));
        const wear = 0.5 + 0.5 * noise.fbm(x * 16, y * 12, z * 16, 2);
        let c = mixRgb(base, IRON_HI, 0.34 * front);
        c = mixRgb(c, IRON_DARK, 0.35 * back);
        return mixRgb(c, IRON_DARK, 0.12 * wear * (1 - front * 0.5));
      })
      .paintWhere(knee.round(0.006), STEEL, 0.004) // polished knee plate
      .paintWhere(sdf.box([0.016, 0.3, 0.12]).at(0, 0.17, 0.06), STEEL, 0.004) // front ridge
      .paintWhere(sdf.box([0.2, 0.02, 0.2]).at(0, 0.012, 0.01), STEEL, 0.004) // bottom rim
      .paintWhere(sdf.box([0.2, 0.02, 0.2]).at(0, 0.388, 0), IRON_DARK, 0.006); // top opening

    k.body('iron', place(ironPainted), {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.008,
      maxTriangles: 2200,
      textureDensity: 1.3,
      paintWeight: 2,
      bump: (x, y, z) => 0.0003 * noise.fbm(x * 50, y * 50, z * 50, 2),
    });

    // ------------------------------------------------------------- leather straps
    // Fat rounded bands (scaled tori) hugging the leg cross-section at two heights.
    const strapLo = sdf.torus(0.048, 0.019).scale([1.2, 1, 1.0]).at(0, 0.115, 0.024);
    const strapHi = sdf.torus(0.05, 0.019).scale([1.18, 1, 0.98]).at(0, 0.265, 0.011);
    const straps = sdf
      .union(strapLo, strapHi)
      .paintFn((x, y, z, base) => {
        const n = 0.5 + 0.5 * noise.fbm(x * 24, y * 10, z * 24, 2);
        return mixRgb(base, LEATHER_HI, 0.3 * Math.max(0, Math.min(1, (z + 0.01) / 0.04)) + 0.12 * n);
      });

    k.body('leather', place(straps), {
      color: '#5c3a22',
      roughness: 0.65,
      metalness: 0,
      detail: 0.01,
      maxTriangles: 800,
      bump: (x, y, z) => 0.0006 * noise.fbm(x * 30, y * 10, z * 30, 2),
    });

    // ------------------------------------------------------------- brass fittings
    const buckleAt = (y: number) => {
      const p = sdf.surfacePoint(straps, [0.08, y, 0.008], -0.003); // embed in the strap
      return sdf.box([0.02, 0.028, 0.034], 0.007).at(p[0], p[1], p[2]);
    };
    const bossAt = sdf.surfacePoint(greave, [0, 0.338, 0.1], -0.004);
    const brass = sdf
      .union(buckleAt(0.115), buckleAt(0.265), sdf.sphere(0.014).at(bossAt[0], bossAt[1], bossAt[2]))
      .paintFn((x, y, z, base) => mixRgb(base, BRASS_HI, Math.max(0, Math.min(1, (z - 0.02) / 0.04)) * 0.5));

    k.body('brass', place(brass), {
      color: '#d4a93a',
      roughness: 0.3,
      metalness: 1,
      detail: 0.006,
      maxTriangles: 350,
    });
  },
});
