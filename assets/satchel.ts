import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note — leather satchel (equipment/accessories/satchel).
 *
 * Role: hero gear item that also lies as a world prop; must read at 128 px.
 * Size: 0.35 m wide, ~0.28 m tall, 0.13 m deep, standing on y = 0, facing +Z.
 * One idea: a soft, slouchy leather satchel — a wide rounded bag with a big
 *   folded flap and one bright brass buckle, plus the long flat shoulder strap
 *   looped up beside it so the silhouette is never a plain box.
 * Shape language: round dominant (soft padded bag, folded flap, strap loop),
 *   square secondary (straight flap edge and buckle).
 * Palette: leather #8a5a35 dominant, dark leather #4f3019 secondary,
 *   brass #d4a93a accent (focal), thread #e0cda6 highlight.
 * Value plan: mid leather bag, dark strap and lower seams, small bright brass
 *   at the buckle — the buckle is the focal point.
 * Materials: leather (roughness 0.62, metalness 0), dark leather strap
 *   (roughness 0.68), polished brass (roughness 0.3, metalness 1), thread paint.
 * Detail: primary bag + flap; secondary strap loop, closure strap, buckle,
 *   front pocket; tertiary stitched seams and grain bump.
 * Rig/animation: none (static equipment item).
 */

const LEATHER = rgb('#8a5a35');
const LEATHER_DARK = rgb('#4f3019');
const LEATHER_LIGHT = rgb('#b07a46');
const THREAD = rgb('#e0cda6');

const W = 0.35;
const BODY_H = 0.2;
const DEPTH = 0.13;

export default defineAsset({
  name: 'satchel',
  description:
    'A soft brown leather satchel with a folded buckled flap, stitched seams, and a long shoulder strap arched over the top.',
  detail: 0.008,
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ bag body
    // Wide padded box with a soft belly, clipped flat on the ground plane.
    const bag = sdf
      .smoothUnion(
        0.028,
        sdf.box([W, BODY_H, DEPTH], 0.03),
        sdf.ellipsoid([W / 2 - 0.012, BODY_H / 2 + 0.006, DEPTH / 2 + 0.01]),
      )
      .at(0, BODY_H / 2, 0)
      .intersect(sdf.halfSpace([0, -1, 0], 0));

    // Shallow lower front pocket: a clean panel that layers the bag.
    const pocket = sdf.box([0.19, 0.085, 0.032], 0.013).at(0, 0.05, 0.066);

    // ------------------------------------------------------------------ folded flap
    // A distinct hood over the top and front; it sits proud of the bag so its
    // lower edge throws a real shadow line.
    const flap = sdf.box([W + 0.016, 0.15, DEPTH + 0.02], 0.036).at(0, 0.19, 0.008);

    const leatherPaint = (x: number, y: number, z: number): readonly [number, number, number] => {
      const grain = 0.5 + 0.5 * noise.fbm(x * 9 + 3, y * 9, z * 9, 2);
      const fine = 0.5 + 0.5 * noise.fbm(x * 34, y * 60, z * 34, 2);
      let c = mixRgb(LEATHER, LEATHER_LIGHT, 0.05 + 0.34 * grain);
      c = mixRgb(c, LEATHER_DARK, 0.16 * fine);
      // Flap sits lighter; the lower bag and the pocket fall into shade.
      c = mixRgb(c, LEATHER_LIGHT, 0.34 * Math.max(0, (y - 0.2) / 0.06));
      c = mixRgb(c, LEATHER_DARK, 0.5 * Math.max(0, (0.09 - y) / 0.09));
      const front = z > 0.055;
      // Dark crease where the flap overlaps the bag, then dashed thread lines.
      if (front && Math.abs(y - 0.115) < 0.013) c = mixRgb(c, LEATHER_DARK, 0.55);
      const flapStitch = Math.abs(y - 0.15) < 0.006;
      const pocketStitch = front && Math.abs(y - 0.092) < 0.005;
      if (front && (flapStitch || pocketStitch) && Math.sin(x * 190) > 0.1)
        c = mixRgb(c, THREAD, 0.8);
      return c;
    };

    const leatherBody = sdf
      .smoothUnion(0.018, bag, pocket, flap)
      .displace(0.0012, (x, y, z) => noise.fbm(x * 22, y * 22, z * 22, 2))
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .paintFn(leatherPaint);
    k.body('leather', leatherBody, {
      color: '#8a5a35',
      roughness: 0.62,
      metalness: 0,
      detail: 0.009,
      paintWeight: 2,
      maxTriangles: 1900,
      bump: (x, y, z) =>
        0.0009 * noise.fbm(x * 35, y * 70, z * 35, 2) + 0.0005 * noise.fbm(x * 120, y * 120, z * 120, 2),
    });

    // ------------------------------------------------------------------ dark leather strap
    // The closure strap down the flap, and the long flat shoulder strap looped
    // upright beside the bag (its inner edge tucks into the bag's right side).
    const closure = sdf.box([0.058, 0.17, 0.026], 0.008).at(0, 0.175, 0.09);
    // Shoulder strap: a flat band that arches over the bag from side to side.
    const loop = sdf
      .torus(W / 2 - 0.004, 0.016)
      .rotateX(90)
      .scale([1, 1.25, 0.45])
      .at(0, 0.12, -0.01)
      .intersect(sdf.halfSpace([0, -1, 0], -0.1).intersect(sdf.box([0.6, 0.6, 0.3]).at(0, 0.3, 0)));
    const strap = sdf
      .union(closure, loop)
      .displace(0.001, (x, y, z) => noise.fbm(x * 30, y * 30, z * 30, 2))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    k.body('strap', strap, {
      color: '#4f3019',
      roughness: 0.68,
      metalness: 0,
      detail: 0.006,
      maxTriangles: 700,
      bump: (x, y, z) => 0.0008 * noise.fbm(x * 45, y * 90, z * 45, 2),
    });

    // ------------------------------------------------------------------ brass buckle + rivets
    const buckle = sdf
      .box([0.072, 0.056, 0.02], 0.007)
      .subtract(sdf.box([0.048, 0.034, 0.06], 0.005))
      .at(0, 0.125, 0.108);
    const pin = sdf.box([0.052, 0.012, 0.026], 0.004).at(0, 0.125, 0.108);
    const rivets = sdf.union(
      sdf.sphere(0.009).at(0.152, 0.238, 0.072),
      sdf.sphere(0.009).at(-0.152, 0.238, 0.072),
    );
    k.body('brass', sdf.union(buckle, pin, rivets), {
      color: '#d4a93a',
      roughness: 0.3,
      metalness: 1,
      detail: 0.004,
      maxTriangles: 350,
    });
  },
});
