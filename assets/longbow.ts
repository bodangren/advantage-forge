import { HAND_FIT, defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Longbow, 1.3 m, standing on its lower tip at y = 0. The stave bows toward +Z; the
 * taut pale string runs tip to tip on the -Z side.
 *
 * Role: ranged-weapon pickup and shop icon. It must read at 128 px.
 * Size: 1.3 m tall, centred on x = 0, the grip centred at [0, 0.65, 0.058].
 * One idea: one tall smooth D-curve of warm walnut, pinched by a dark leather grip.
 * Shape language: round, long, and soft, with a small arrow-rest peg breaking the outline.
 * Palette: walnut #4a2c17 / #7d5230 / #c9a06a (dominant), leather #3a2312 (dark, mid),
 *   string #e8dcc0 (light accent, the long line).
 * Materials: wood (rough 0.82), leather (rough 0.68), string fibre (rough 0.80).
 * Detail: smooth tapered stave, ribbed leather grip, tip wraps, arrow rest, taut string.
 * Rig: none. A static item.
 */

const H = 1.3; // total height, tip to tip
const HALF = H / 2;
const DEPTH = 0.115; // how far the stave bows toward +Z
const TIP_Z = -DEPTH / 2; // z of both tips (and the string chord)

const WOOD_DARK = rgb('#4a2c17');
const WOOD_LIGHT = rgb('#c9a06a');
const LEATHER = rgb('#3a2312');
const LEATHER_LIGHT = rgb('#7a4a2a');
const LEATHER_HEX = '#3a2312';
const STRING_HEX = '#e8dcc0';

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

// The stave centreline: a smooth arc, deepest at the grip, tapering to the tips.
const zAt = (y: number) => {
  const s = (y - HALF) / HALF;
  return DEPTH * (1 - s * s) - DEPTH / 2;
};
const rAt = (y: number) => {
  const s = (y - HALF) / HALF;
  return 0.0095 + 0.0125 * (1 - s * s);
};

export default defineAsset({
  name: 'longbow',
  description: 'Tall walnut longbow with a dark leather grip and a taut pale string.',
  reference: 'docs/item-mockups/longbow-mock.jpg',
  detail: 0.006,
  texture: { size: 1024 },
  equip: { slot: 'mainhand', fitScale: HAND_FIT, origin: [0, 0.65, 0.058], rotate: [0, -90, 0], twoHanded: true },

  build(k) {
    // ------------------------------------------------------------------ walnut stave
    // One long tapered rod bent into a single smooth arc, in the YZ plane.
    const N = 16;
    const pts: [number, number, number, number][] = [];
    for (let i = 0; i <= N; i++) {
      const y = (H * i) / N;
      pts.push([0, y, zAt(y), rAt(y)]);
    }
    // Cut the bottom cap flat so the bow stands on a small foot at y = 0.
    const stave = sdf.chain(pts, 0.02).intersect(sdf.halfSpace([0, -1, 0], 0));

    // The arrow rest: a short peg out the +Z back, just above the grip.
    const restZ = zAt(0.7);
    const peg = sdf.smoothUnion(
      0.004,
      sdf.capsule([0, 0.7, restZ - 0.02], [0, 0.7, restZ + 0.045], 0.0075),
      sdf.sphere(0.0095).at(0, 0.7, restZ + 0.045),
    );

    const wood = sdf.union(stave, peg).paintFn((x, y, z) => {
      // A vertical value plan: the pale grip end, the dark tips, and a lit back (+Z).
      const grain = 0.5 + 0.5 * noise.fbm(x * 16, y * 3.0, z * 16, 3);
      const back = clamp01((z + 0.02) / 0.08);
      const belly = clamp01((0.1 - z) / 0.16);
      const t = clamp01(0.1 + 0.5 * grain + 0.5 * back - 0.35 * belly);
      return mixRgb(WOOD_DARK, WOOD_LIGHT, t);
    });
    k.body('wood', wood, {
      color: '#7d5230',
      roughness: 0.82,
      metalness: 0,
      detail: 0.006,
      maxTriangles: 2400,
      bump: (x, y, z) => 0.0008 * noise.fbm(x * 18, y * 4, z * 18, 3),
    });

    // ------------------------------------------------------------------ leather grip and wraps
    // A ribbed grip around the middle and a small wrap near each tip (the string nocks).
    const band = (y0: number, y1: number, r: number) =>
      sdf.capsule([0, y0, zAt(y0)], [0, y1, zAt(y1)], r);
    // A smooth swelling around the middle, ribbed by three rings.
    const grip = sdf.smoothUnion(
      0.008,
      sdf.ellipsoid([0.028, 0.077, 0.028]).at(0, 0.65, zAt(0.65)),
      sdf.torus(0.026, 0.004).at(0, 0.607, zAt(0.607)),
      sdf.torus(0.026, 0.004).at(0, 0.65, zAt(0.65)),
      sdf.torus(0.026, 0.004).at(0, 0.693, zAt(0.693)),
    );
    const wrap = sdf
      .union(
        grip,
        band(0.078, 0.104, 0.0155),
        band(H - 0.104, H - 0.078, 0.0155),
      )
      .paintFn((x, y, z) => {
        const grain = 0.5 + 0.5 * noise.fbm(x * 60, y * 60, z * 60, 2);
        return mixRgb(LEATHER, LEATHER_LIGHT, 0.2 + 0.6 * grain);
      });
    k.body('leather', wrap, {
      color: LEATHER_HEX,
      roughness: 0.68,
      metalness: 0,
      detail: 0.006,
      maxTriangles: 1100,
      bump: (x, y, z) => 0.0012 * Math.abs(Math.sin(y * 150 + Math.atan2(z, x) * 2)),
    });

    // ------------------------------------------------------------------ taut string, -Z side
    const bot = sdf.surfacePoint(stave, [0, 0.01, TIP_Z], 0.001);
    const top = sdf.surfacePoint(stave, [0, H - 0.01, TIP_Z], 0.001);
    k.body('string', sdf.capsule(bot, top, 0.006), {
      color: STRING_HEX,
      roughness: 0.8,
      metalness: 0,
      detail: 0.004,
      maxTriangles: 260,
    });
  },
});
