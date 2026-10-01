import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — leather cuirass on an armor stand (equipment/armor/leather-armor).
 *
 * Role: shop display piece / equipment item for the Chibi Quest hamlet; must read at 128 px.
 * Size: stand 1.11 m tall total; torso shell 0.56 m wide, 0.64 m tall, 0.44 m deep (chest armor
 *   contract v2, 2x the hero torso); on y = 0, centered on Y, the armor front toward +Z.
 *   Vest hem height above the stand base: 0.34 m (avatar fit: subtract it, then scale 0.5).
 * One idea: a brown leather VEST (not a ball) hanging on a dark walnut stand — flat front,
 *   V-neck, open arm holes, straight hem with short tassets, straps and buckles.
 * Shape language: square dominant (flat front, straight hem, tassets), round secondary
 *   (rounded shell, soft shoulder caps, round buckles).
 * Palette (60/30/10): leather #8a5a35 (dominant), dark panels/straps #5c3a22 (secondary),
 *   walnut #4a2c17 (stand); iron #3d4047 side buckles; brass #d9a93a belt buckle (accent).
 * Materials: walnut wood (rough 0.85), leather (rough 0.65), worn iron (rough 0.55, metal 0.7),
 *   brass (rough 0.3, metal 1). Stitch thread #d9b285.
 * Detail: stitched panels + dashed stitch lines on the front, tassets with stitched tops,
 *   two iron side buckles, brass belt buckle. Focal point: the brass buckle.
 * Rig/animation: none (static display prop).
 */

const LEATHER = rgb('#8a5a35');
const LEATHER_LIGHT = rgb('#a06a3e');
const PANEL = rgb('#5c3a22');
const EDGE = rgb('#4e3018');
const STITCH = rgb('#d9b285');
const WALNUT = rgb('#4a2c17');
const WALNUT_DARK = rgb('#33200f');
const WALNUT_LIGHT = rgb('#5f3a1f');
const IRON = rgb('#3d4047');
const BRASS = rgb('#d9a93a');

const Y_HEM = 0.34; // vest bottom hem above the stand base
const BELT_Y = 0.616;
const STRAP_Y = 0.72;

const ss = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// Distance from (x, y) to a segment, plus the arc coordinate along it.
function seg(x: number, y: number, x0: number, y0: number, x1: number, y1: number) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  let t = ((x - x0) * dx + (y - y0) * dy) / (len * len);
  t = Math.max(0, Math.min(1, t));
  return { d: Math.hypot(x - (x0 + t * dx), y - (y0 + t * dy)), u: t * len };
}

// Dashed stitch segments on the front of the vest (and the tops of the front tassets).
const STITCHES: readonly (readonly [number, number, number, number])[] = [
  [-0.03, 0.63, -0.03, 0.8], // chest panel inner seams
  [0.03, 0.63, 0.03, 0.8],
  [-0.19, 0.63, -0.19, 0.8], // chest panel outer seams
  [0.19, 0.63, 0.19, 0.8],
  [-0.19, 0.63, 0.19, 0.63], // panel bottom seam
  [-0.1, 0.98, -0.005, 0.81], // V-neck trim
  [0.1, 0.98, 0.005, 0.81],
  [-0.2, 0.375, 0.2, 0.375], // hem stitch (on the tassets)
];

export default defineAsset({
  name: 'leather-armor',
  description:
    'Brown leather cuirass with stitched panels, tassets, and buckles, displayed on a walnut armor stand.',
  detail: 0.005,
  reference: 'docs/item-mockups/leather-armor-mock.jpg',
  texture: { size: 1024 },
  equip: { slot: 'chest', fitScale: 2, origin: [0, Y_HEM, 0], hides: ['undershirt'], displayOnly: ['stand'] },

  build(k) {
    // ------------------------------------------------------------------ stand (walnut)
    // Cross foot on y = 0, a post up the middle, a crossbar at shoulder height, a knob on top.
    const footA = sdf.box([0.56, 0.05, 0.12], 0.02).at(0, 0.025, 0);
    const footB = sdf.box([0.12, 0.05, 0.56], 0.02).at(0, 0.025, 0);
    const post = sdf.cylinder(0.032, 1.06, 0.01).at(0, 0.53, 0);
    const crossbar = sdf.cylinder(0.02, 0.6, 0.008).rotateZ(90).at(0, 0.93, 0);
    const knob = sdf.sphere(0.036).at(0, 1.075, 0);
    const wood = sdf
      .union(footA, footB, post, crossbar, knob)
      .paintFn((x, y, z, base) => {
        const patch = 0.5 + 0.5 * noise.fbm(x * 6, y * 6, z * 6, 2);
        const streak = 0.5 + 0.5 * noise.fbm(x * 18, y * 3, z * 18, 2);
        let c = mixRgb(base, WALNUT_LIGHT, 0.28 * patch);
        c = mixRgb(c, WALNUT_DARK, 0.4 * streak);
        // Worn lighter tips where hands would polish the crossbar ends and the knob.
        c = mixRgb(c, WALNUT_LIGHT, 0.3 * ss(0.22, 0.3, Math.abs(x)) * ss(0.88, 0.93, y));
        return c;
      });
    k.body('stand', wood, {
      color: WALNUT,
      roughness: 0.85,
      metalness: 0,
      detail: 0.008,
      maxTriangles: 1400,
      bump: (x, y, z) => 0.0015 * noise.fbm(x * 24, y * 5, z * 24, 2),
    });

    // ------------------------------------------------------------------ vest shell (leather)
    // Smooth revolved torso (like the knight's cuirass): gently domed crown, shoulder curve, max
    // width at the ribs, straight hem on the axis. Flattened at the front with a soft roll, then
    // the V-neck and arm holes are smooth-subtracted so the rims bevel without refilling.
    const torso = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.636],
            [0.14, 0.636],
            [0.21, 0.576],
            [0.25, 0.496],
            [0.26, 0.376],
            [0.248, 0.276],
            [0.26, 0.196],
            [0.276, 0.096],
            [0.28, 0.026],
            [0.264, 0],
            [0, 0],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.78])
      .at(0, Y_HEM, 0);
    const vNeck = sdf
      .extrude(
        profile.polygon([
          [-0.16, 1.06],
          [0.16, 1.06],
          [0, 0.79],
        ]),
        0.5,
        0.006,
      )
      .at(0, 0, 0.15);
    // Arm holes: short cutters that open only at the sides.
    const armHole = sdf
      .cylinder(0.09, 0.28, 0.01)
      .rotateZ(90)
      .scale([1, 1, 1.2])
      .at(0.29, 0.83, 0);
    const shell = torso.smoothSubtract(0.004, vNeck, armHole, armHole.mirror('x', 0));

    // Tassets: short flaps hanging from the straight hem, front and back.
    const flap = (w: number, deg: number) => {
      const r = (deg * Math.PI) / 180;
      return sdf
        .extrude(profile.rect([w, 0.105], 0.02), 0.02, 0.006)
        .rotateY(deg)
        .at(0.262 * Math.sin(r), 0.3225, 0.205 * Math.cos(r));
    };
    const tassets = sdf.union(
      flap(0.16, 0),
      flap(0.13, 38),
      flap(0.13, -38),
      flap(0.13, 75),
      flap(0.13, -75),
      flap(0.13, 145),
      flap(0.13, -145),
      flap(0.16, 180),
    );

    // Shoulder pads: flat leather caps resting on the crossbar ends and the shoulder line.
    const pad = sdf.ellipsoid([0.12, 0.03, 0.115]).rotateZ(-14).at(0.19, 0.965, 0);
    const pads = pad.mirror('x', 0);

    const leatherPaint = (x: number, y: number, z: number, base: typeof LEATHER) => {
      let c = base;
      const mottle = 0.5 + 0.5 * noise.fbm(x * 22, y * 22, z * 22, 2);
      c = mixRgb(c, PANEL, 0.1 * mottle);
      c = mixRgb(c, LEATHER_LIGHT, 0.1 * ss(0.85, 0.98, y)); // sun-bleached shoulders
      c = mixRgb(c, EDGE, 0.25 * ss(-0.03, -0.18, z)); // shaded back
      c = mixRgb(c, EDGE, 0.45 * ss(0.22, 0.275, Math.abs(x))); // dark side edges
      c = mixRgb(c, EDGE, 0.35 * ss(0.17, 0.23, Math.abs(x)) * ss(0.78, 0.86, y)); // arm hole shade
      const front = ss(0.1, 0.13, z);
      if (front > 0) {
        // Darker stitched chest panels (left and right of the center seam).
        const px = ss(0.03, 0.05, Math.abs(x)) * (1 - ss(0.19, 0.21, Math.abs(x)));
        const py = ss(0.625, 0.65, y) * (1 - ss(0.78, 0.81, y));
        c = mixRgb(c, PANEL, 0.85 * front * px * py);
        // The tassets read as darker layered leather.
        const fl = front * (1 - ss(0.365, 0.385, y));
        c = mixRgb(c, PANEL, 0.55 * fl);
        // Dashed stitch lines.
        for (const [x0, y0, x1, y1] of STITCHES) {
          const { d, u } = seg(x, y, x0, y0, x1, y1);
          if (d < 0.0052 && Math.sin((u * Math.PI * 2) / 0.014) > -0.25) {
            c = mixRgb(c, STITCH, front * (1 - ss(0.0035, 0.0052, d)));
          }
        }
      }
      return c;
    };
    k.body(
      'leather',
      sdf.union(shell, tassets, pads).paintFn(leatherPaint),
      {
        color: LEATHER,
        roughness: 0.65,
        metalness: 0,
        detail: 0.005,
        maxTriangles: 3800,
        textureDensity: 2,
        bump: (x, y, z) => 0.0012 * noise.fbm(x * 38, y * 38, z * 38, 2),
      },
    );

    // ------------------------------------------------------------------ belt and side straps (dark leather)
    // Bands hug the finished shell so they sit proud of the leather.
    const hug = (y: number, h: number) =>
      shell
        .round(0.0035)
        .subtract(shell.round(-0.012))
        .smoothIntersect(0.005, sdf.box([0.7, h, 0.5], 0.008).at(0, y, 0));
    const belt = hug(BELT_Y, 0.05);
    const strap = hug(STRAP_Y, 0.038);
    k.body('belt', sdf.union(belt, strap), {
      color: PANEL,
      roughness: 0.65,
      metalness: 0,
      detail: 0.005,
      maxTriangles: 1400,
      bump: (x, y, z) => 0.001 * noise.fbm(x * 38, y * 38, z * 38, 2),
    });

    // ------------------------------------------------------------------ buckles
    // Brass frame + prong on the belt (the accent, front and center).
    const beltHit = sdf.raycast(belt, [0, BELT_Y, 0.6], [0, 0, -1]);
    const beltZ = (beltHit ? beltHit[2] : 0.2) + 0.006;
    const beltBuckle = sdf.union(
      sdf.torus(0.033, 0.009).rotateX(90).at(0, BELT_Y, beltZ),
      sdf.box([0.008, 0.052, 0.009], 0.003).at(0, BELT_Y, beltZ),
      sdf.box([0.02, 0.008, 0.008], 0.003).at(0, BELT_Y + 0.028, beltZ - 0.008),
    );
    k.body('brass', beltBuckle, {
      color: BRASS,
      roughness: 0.3,
      metalness: 1,
      detail: 0.0035,
      maxTriangles: 350,
    });

    // Iron buckles where the side straps cinch, one on each side, on the front-side of the torso.
    const strapHit =
      sdf.raycast(strap, [0.6, STRAP_Y, 0.25], [-0.93, 0, -0.37]) ?? [0.26, STRAP_Y, 0.115];
    const faceDeg = (Math.atan2(strapHit[0], strapHit[2]) * 180) / Math.PI;
    const sideBuckle = (sx: number) =>
      sdf
        .union(
          sdf.torus(0.024, 0.007).rotateX(90).rotateY(faceDeg * sx).at(strapHit[0] * sx + 0.004 * sx, STRAP_Y, strapHit[2] + 0.004),
          sdf.box([0.008, 0.038, 0.007], 0.003).rotateY(faceDeg * sx).at(strapHit[0] * sx + 0.006 * sx, STRAP_Y, strapHit[2] + 0.006),
          // The strap end pokes through the frame and flops a little.
          sdf
            .box([0.04, 0.028, 0.012], 0.005)
            .rotateY(faceDeg * sx - 14 * sx)
            .at(strapHit[0] * sx + 0.022 * sx, STRAP_Y - 0.006, strapHit[2] + 0.012),
        );
    k.body('iron', sideBuckle(1).union(sideBuckle(-1)), {
      color: IRON,
      roughness: 0.55,
      metalness: 0.7,
      detail: 0.0035,
      maxTriangles: 600,
    });
  },
});
