import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
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
const ROPE = rgb('#8a6a3a');
const ROPE_DARK = rgb('#6f5430');

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
        [BASE_R - 0.02, 0.0],
        [BASE_R, 0.015],
        [0.168, 0.08],
        [BELLY_R, 0.17],
        [0.168, 0.25],
        [0.135, 0.3],
        [NECK_R, ROPE_Y - 0.008],
        [0.074, 0.35], // gathers flare just above the rope
        [0.048, 0.382], // bunched top
        [0.0, H],
      ],
      { smooth: true, samples: 32 },
    );
    // Slightly elliptical (slumped front-to-back), low-frequency cloth
    // irregularity, then a clean cut on the ground plane.
    const bodyShape = sdf
      .revolve(sackProfile)
      .scale([1, 1, 0.92])
      .displace(0.003, (x, y, z) => noise.fbm(x * 5 + 3, y * 5, z * 5, 2))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    // The tied nub: a small flop of gathered cloth leaning off-axis, so the
    // top of the silhouette breaks the lathe symmetry.
    const nub = sdf
      .sphere(0.052)
      .scale([1, 0.6, 0.85])
      .rotateZ(14)
      .rotateX(-6)
      .at(0.012, H - 0.008, 0.004);
    const bodyFull = bodyShape.smoothUnion(0.02, nub);

    // Soft tonal variation + value plan: shaded seated base, sun-lit
    // shoulder. The neck crease under the rope is painted by a stencil
    // below so the cinch reads at 128 px.
    const burlapPaint = (x: number, y: number, z: number) => {
      const patch = 0.5 + 0.5 * noise.fbm(x * 4, y * 4, z * 4, 2);
      const mottle = 0.5 + 0.5 * noise.fbm(x * 11 + 5, y * 11, z * 11, 2);
      let c = mixRgb(BURLAP, BURLAP_LIGHT, 0.06 * patch);
      c = mixRgb(c, BURLAP_SHADE, 0.18 + 0.32 * mottle);
      const t = Math.min(1, Math.max(0, y / H));
      c = mixRgb(c, BURLAP_SHADE, 0.5 * Math.pow(1 - t, 1.6)); // damp seated base
      c = mixRgb(c, BURLAP_LIGHT, 0.1 * Math.max(0, (t - 0.55) / 0.45)); // lit shoulder
      return c;
    };
    const bodyPainted = bodyFull
      .paintFn(burlapPaint)
      .paintWhere(sdf.torus(0.075, 0.028).at(0, ROPE_Y - 0.008, 0), BURLAP_SHADE, 0.015);

    k.body('burlap', bodyPainted, {
      color: '#c2a06a',
      roughness: 0.9,
      metalness: 0,
      detail: 0.009,
      paintWeight: 2,
      maxTriangles: 1700,
      // Coarse weave hint: two stretched-noise thread directions (hoop +
      // vertical), non-periodic so it cannot moire into rings in the bake.
      bump: (x, y, z) =>
        0.0007 * noise.fbm(x * 190, y * 5, z * 190, 2) +
        0.0007 * noise.fbm(x * 5 + 9, y * 190, z * 5 + 9, 2) +
        0.0005 * noise.fbm(x * 42, y * 42, z * 42, 2),
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
        [0.096, 0.298, 0.032, 0.013],
        [0.108, 0.26, 0.042, 0.01],
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
      color: '#8a6a3a',
      roughness: 0.85,
      metalness: 0,
      detail: 0.005,
      maxTriangles: 550,
      bump: (x, y, z) => 0.0012 * Math.cos(Math.atan2(z, x) * 3 + y * 55),
    });
  },
});
