import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note — blacksmith anvil (props/craft-and-trade/anvil).
 *
 * Role: hero tool of the blacksmith shop set (forge, quench-tub, grinding-wheel,
 *   bellows); must read at 128 px as "anvil" from silhouette alone.
 * Size: 0.57 m long with the horn, 0.2 m wide, 0.35 m tall, stands on y = 0,
 *   horn pointing +X, face level with a workbench.
 * One idea: a heavy dark-iron body that pinches to a narrow waist and flares
 *   into four splayed feet, crowned by a bright worn face and one long,
 *   slightly drooping polished horn.
 * Shape language: square dominant (face, heel, waist, feet), one strong
 *   triangle/round secondary (the tapered horn breaking the outline).
 * Palette: iron #4a4f55 (dominant), shadow #363a3f (waist, feet, underside),
 *   worn face #a8acb1 (focal accent on the top face and horn).
 * Materials: one worn cast-iron body (roughness 0.5, metalness 0.7), hammered
 *   texture in tiny `bump` only.
 * Detail: primary face slab + horn + heel; secondary waist + four splayed feet;
 *   tertiary hardy hole (square) and pritchel hole (round) cut through the
 *   face, edge wear and mottling on the top. Focal point: bright face vs dark
 *   body.
 * Rig/animation: none (static prop).
 */

const IRON = rgb('#4a4f55');
const IRON_DARK = rgb('#363a3f');
const IRON_WORN = rgb('#a8acb1');

const ss = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export default defineAsset({
  name: 'anvil',
  description:
    'Classic blacksmith anvil: dark iron body with a narrow waist, four splayed feet, a long tapered horn, a square heel, a hardy hole and a pritchel hole, and a bright worn face.',
  detail: 0.005,
  reference: 'docs/blacksmith-mockups/blacksmith-quest_001.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------- main mass
    // Face slab + square heel: one rounded block, top at y = 0.35.
    const face = sdf.box([0.4, 0.035, 0.2], 0.008).at(-0.06, 0.3325, 0);
    // Horn: long cone sweeping out and slightly down from the face end to a
    // point (~0.19 m of reach past the face center line).
    const horn = sdf.cone([0.125, 0.31, 0], [0.315, 0.289, 0], 0.046, 0.004);
    // Waist: clearly narrower block under the face.
    const waist = sdf.box([0.25, 0.15, 0.088], 0.01).at(-0.05, 0.235, 0);
    // Four splayed feet: tapered cones flaring out from the waist corners.
    const leg = (tx: number, tz: number) =>
      sdf.cone(
        [tx, 0.17, tz * 0.032],
        [tx + Math.sign(tx) * 0.055, 0.004, tz * 0.082],
        0.05,
        0.057,
      );
    const legs = sdf.union(
      leg(-0.155, 1),
      leg(-0.155, -1),
      leg(0.055, 1),
      leg(0.055, -1),
    );

    const mass = face
      .smoothUnion(0.018, horn)
      .smoothUnion(0.02, waist)
      .smoothUnion(0.02, legs)
      // Flat cut at the ground plane so all four feet sit perfectly.
      .intersect(sdf.halfSpace([0, -1, 0], 0));

    // ------------------------------------------------------------- face holes
    // Hardy hole (square, near the horn) and pritchel hole (round, near the
    // heel), cut through the face slab.
    const hardy = sdf.box([0.028, 0.05, 0.028], 0.002).at(0.03, 0.35, 0);
    const pritchel = sdf.cylinder(0.011, 0.05).at(-0.19, 0.35, 0);
    const iron = mass.subtract(hardy, pritchel);

    // ------------------------------------------------------------- paint
    const paint = (x: number, y: number, z: number) => {
      const patch = 0.5 + 0.5 * noise.fbm(x * 9 + 3, y * 9, z * 9, 2);
      let c = mixRgb(IRON, IRON_DARK, 0.1 + 0.22 * patch);

      // Shadow under the face overhang and down the waist.
      const under = ss(0.318, 0.3, y) * ss(0.17, 0.24, y);
      c = mixRgb(c, IRON_DARK, 0.5 * under);

      // Damp dark feet.
      const low = 1 - ss(0.02, 0.1, y);
      c = mixRgb(c, IRON_DARK, 0.55 * low);

      // Worn bright top face (focal point), mottled by use. The threshold
      // reaches just past the top edge bevel so the face reads bright from
      // the front and side views too.
      const topY = ss(0.334, 0.342, y);
      const faceX = ss(-0.275, -0.255, x) * (1 - ss(0.13, 0.15, x));
      const faceZ = 1 - ss(0.08, 0.1, Math.abs(z));
      const mottle = 0.5 + 0.5 * noise.fbm(x * 26, 1, z * 26, 2);
      c = mixRgb(c, IRON_WORN, topY * faceX * faceZ * (0.82 + 0.18 * mottle));

      // Polished horn, lighter than the body but not as bright as the face.
      const hornMask = ss(0.1, 0.16, x) * ss(0.265, 0.295, y);
      c = mixRgb(c, mixRgb(IRON, IRON_WORN, 0.5), 0.85 * hornMask);

      return c;
    };

    k.body('iron', iron.paintFn(paint), {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.005,
      paintWeight: 2,
      bump: (x, y, z) => 0.0005 * noise.fbm(x * 46, y * 46, z * 46, 2),
      maxTriangles: 3900,
    });
  },
});
