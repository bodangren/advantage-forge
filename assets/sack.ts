import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Rework: 6 cut vertical folds, 7-lobe ruffled flare over the rope, crosshatch weave bump,
 *   sewn patch with stitch dashes on the front (#c9a26a cloth, #9c7a48 folds).
 * Design note — plump grain sack (props/containers/sack).
 *
 * Role: tavern / storeroom clutter prop; must read at 128 px as one stout
 *   tied bundle. Size: 0.4 m tall, 0.3 m wide at the base, 0.35 m at the
 *   belly, standing on y = 0, facing +Z.
 * One idea: a soft, heavy burlap sack slumped where it sits, cinched at the
 *   neck by one short rough rope — belly much wider than the gathered top.
 * Shape language: round dominant (plump revolved body, soft bevels),
 *   small secondary pinch at the rope.
 * Palette: burlap #c2a06a dominant, shade #9a7d4c (base, neck crease),
 *   light #d8b888 (sun-lit shoulder); rope #8a6a3a darker accent.
 * Materials: burlap cloth (roughness 0.9, weave in bump), rough rope
 *   (roughness 0.85, twist hint in bump). No metal.
 * Detail: primary revolved body with slump displace; secondary rope ring +
 *   knot + short tail; tertiary weave bump and soft tonal paint patches.
 * Rig/animation: none (static prop).
 */

const BURLAP = rgb('#c2a06a');
const BURLAP_SHADE = rgb('#9a7d4c');
const BURLAP_LIGHT = rgb('#d8b888');
const ROPE = rgb('#6a4e2a');
const ROPE_DARK = rgb('#4f3a1e');

const H = 0.4; // total height
const BELLY_R = 0.175; // 0.35 m wide at the belly
const BASE_R = 0.15; // 0.3 m wide at the base
const NECK_R = 0.073; // pinched neck at the rope
const ROPE_Y = 0.335;

export default defineAsset({
  name: 'sack',
  description: 'Plump burlap grain sack, slumped at the base, neck gathered and tied with a short rough rope.',
  detail: 0.01,
  reference: 'docs/tavern-mockups/tavern-quest_001.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ body
    // Revolved sack profile: flat seated base, plump belly, tucked shoulder,
    // pinch at the rope, small gathered flare above, bunched top.
    const sackProfile = profile.polygon(
      [
        [0.0, 0.0],
        [0.145, 0.0],
        [0.163, 0.02],
        [0.166, 0.07],
        [0.152, 0.14],
        [0.125, 0.21],
        [0.097, 0.27],
        [NECK_R, ROPE_Y - 0.008],
        [0.058, 0.35],
        [0.04, 0.37],
        [0.0, 0.38],
      ],
      { smooth: true, samples: 32 },
    );
    // Slightly elliptical (slumped front-to-back), low-frequency cloth
    // irregularity, then a clean cut on the ground plane.
    const base = sdf
      .revolve(sackProfile)
      .scale([1, 1, 0.92])
      .smoothUnion(0.05, sdf.ellipsoid([0.155, 0.1, 0.145]).at(0.022, 0.09, 0))
      .rotateZ(-2)
      .displace(0.004, (x, y, z) => noise.fbm(x * 5 + 3, y * 5, z * 5, 2));
    // Soft vertical folds: thin capsules cut 0.01 m into the belly.
    const foldAngles = [-150, -95, -40, 25, 70, 130];
    const folds = foldAngles.map((deg, i) => {
      const a = (deg * Math.PI) / 180;
      const r = 0.172 + (i % 2) * 0.004;
      const x0 = Math.sin(a) * (r + 0.008);
      const z0 = Math.cos(a) * (r + 0.008) * 0.92;
      return sdf.capsule([x0, 0.1 + (i % 3) * 0.02, z0], [x0, 0.25 - (i % 2) * 0.03, z0], 0.012);
    });
    const bodyShape = sdf
      .smoothSubtract(0.01, base, ...folds)
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    // Ruffled flared top: 7 lobes fanned out above the rope.
    const lobes = [0, 1, 2, 3, 4, 5, 6].map((i) => {
      const hgt = 0.028 + (i % 3) * 0.004;
      return sdf
        .cone([0.02, ROPE_Y + 0.085 - hgt * 0.5, 0], [0.09, ROPE_Y + 0.02 + hgt * 0.2, 0], 0.03, 0.008)
        .rotateY(((i / 7) * 360 + 10) % 360);
    });
    const ruffle = sdf.smoothUnion(0.01, ...lobes);
    const bodyFull = bodyShape.smoothUnion(0.02, ruffle);

    const patchBox = sdf.box([0.1, 0.085, 0.12], 0.01).at(0.0, 0.14, 0.17);
    const stitch = (x: number, y: number, w: number, h: number) =>
      sdf.box([w, h, 0.12]).at(x, y, 0.17);
    const stitches: ReturnType<typeof stitch>[] = [];
    for (let i = 0; i < 4; i++) {
      const o = -0.036 + i * 0.024;
      stitches.push(stitch(o, 0.1, 0.012, 0.004), stitch(o, 0.18, 0.012, 0.004));
    }
    for (let i = 0; i < 3; i++) {
      const o = 0.112 + i * 0.024;
      stitches.push(stitch(-0.046, o + 0.02, 0.004, 0.012), stitch(0.046, o + 0.02, 0.004, 0.012));
    }
    const PATCH = rgb('#b48f58');
    const THREAD = rgb('#5e4526');

    const burlapPaint = (x: number, y: number, z: number) => {
      const patch = 0.5 + 0.5 * noise.fbm(x * 4, y * 4, z * 4, 2);
      let c = mixRgb(BURLAP, BURLAP_LIGHT, 0.15 * patch);
      // darker folds: angular bands matching the cut grooves
      const ang = Math.atan2(x, z);
      let f = 0;
      for (const deg of foldAngles) {
        let d = Math.abs(ang - (deg * Math.PI) / 180);
        d = Math.min(d, Math.PI * 2 - d);
        f = Math.max(f, Math.max(0, 1 - d / 0.12));
      }
      c = mixRgb(c, BURLAP_SHADE, 0.75 * f * (y < 0.3 ? 1 : 0));
      const t = Math.min(1, Math.max(0, y / H));
      c = mixRgb(c, BURLAP_SHADE, 0.35 * Math.pow(1 - t, 1.6));
      c = mixRgb(c, BURLAP_LIGHT, 0.15 * Math.max(0, (t - 0.6) / 0.4));
      return c;
    };
    let bodyPainted = bodyFull
      .paintFn(burlapPaint)
      .paintWhere(sdf.torus(0.078, 0.03).at(0, ROPE_Y - 0.012, 0), BURLAP_SHADE, 0.015)
      .paintWhere(patchBox, PATCH, 0.004);
    bodyPainted = bodyPainted.paintWhere(sdf.union(...stitches), THREAD, 0.002);

    k.body('burlap', bodyPainted, {
      color: '#c2a06a',
      roughness: 0.9,
      metalness: 0,
      detail: 0.007,
      paintWeight: 2,
      maxTriangles: 4200,
      // Coarse weave hint: two stretched-noise thread directions (hoop +
      // vertical), non-periodic so it cannot moire into rings in the bake.
      bump: (x, y, z) => {
        const u = Math.atan2(x, z) * 0.16 * 780;
        const v = y * 780;
        return 0.00045 * (Math.sin(u) * Math.sin(v) + 0.5 * Math.sin(u * 0.5 + v)) + 0.00025 * noise.fbm(x * 42, y * 42, z * 42, 2);
      },
    });

    // ------------------------------------------------------------------ rope
    // One rough rope cinched around the neck, with a knot and a short tail
    // hanging down the front-left. Slight tilt so it reads hand-tied.
    const ropeRing = sdf
      .torus(0.078, 0.02)
      .rotateX(4)
      .rotateZ(-3)
      .at(0, ROPE_Y + 0.002, 0);
    const knot = sdf.sphere(0.022).at(0.082, ROPE_Y + 0.002, 0.014);
    const tail = sdf.chain(
      [
        [0.082, ROPE_Y - 0.004, 0.02, 0.016],
        [0.096, 0.30, 0.04, 0.014],
        [0.11, 0.25, 0.06, 0.012],
        [0.118, 0.215, 0.07, 0.01],
      ],
      0.012,
    );
    const ropeShape = sdf
      .smoothUnion(0.008, ropeRing, knot, tail)
      .paintFn((x, y, z) => {
        const twist = 0.5 + 0.5 * Math.cos(Math.atan2(z, x) * 3 + y * 55);
        let c = mixRgb(ROPE, ROPE_DARK, 0.15 + 0.5 * twist);
        c = mixRgb(c, ROPE_DARK, 0.35 * Math.max(0, (0.28 - y) / 0.28)); // worn dark tail end
        return c;
      });
    k.body('rope', ropeShape, {
      color: '#6a4e2a',
      roughness: 0.85,
      metalness: 0,
      detail: 0.005,
      maxTriangles: 550,
      bump: (x, y, z) => 0.0012 * Math.cos(Math.atan2(z, x) * 3 + y * 55),
    });
  },
});
