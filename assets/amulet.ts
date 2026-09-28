import { defineAsset, mixRgb, rgb, sdf, type Rgb } from '../src/index.js';

// Design note — gold amulet with red gem (equipment/accessories/amulet).
//
// Role: small equipment pickup and inventory icon. Reads at 128 px as a
//   chunky gold medallion pendant with a glowing red gem, on a loose gold
//   chain loop.
// Size: pendant 0.08 m wide (r 0.04 m), chain loop ~0.15 m across. Whole
//   asset is roughly 0.17 m wide and 0.09 m tall.
// Layout: pendant stands upright on its bottom edge on y = 0, centred on
//   the Y axis, front face (+Z) showing the gem. A loose, slightly
//   irregular oval chain loop is laid flat on the ground around the
//   pendant, with one link tucking under the bail at the top.
// One idea: a chunky gold medallion, slightly oversized, with a glowing
//   red cabochon gem cradled in a thick bezel ring, with four small
//   gold "petal" bumps at the cardinal points giving the face its
//   crafted, jewel-like character. The chain forms a loose loop of
//   chunky links around it — readable as "necklace on the ground".
// Shape language: round dominant (disc, dome, torus, chain links).
// Palette (60/30/10): gold #d4a93a dominant, gold shadow #8a6a1e, gold
//   highlight #f4d870; gem dark base #4a0a05 under glow #ff2818
//   (intensity 1.6, per the emissive rule).
// Materials: gold (metalness 1, roughness 0.3); gem (roughness 0.15,
//   faint emissive, dark base color so the glow stays saturated).
// Detail list: pendant disc + raised rim + bezel ring + 4 petal bumps
//   + cabochon gem + bail loop + ~26 chunky chain links in an
//   irregular oval loop.
// Rig/animation: none (static item).

const GOLD = rgb('#d4a93a');
const GOLD_DARK = rgb('#8a6a1e');
const GOLD_HI = rgb('#f4d870');
const GOLD_PALE = rgb('#fff0b8');

const GEM_DARK = rgb('#4a0a05');
const GEM_MID = rgb('#9a1a18');
const GEM_RIM = rgb('#ff6a4a');
const GEM_GLOW = '#ff2818';

const PENDANT_R = 0.04; // pendant radius (0.08 m wide)
const PENDANT_T = 0.008; // pendant thickness
const PENDANT_Y = PENDANT_R; // bottom of disc touches y = 0

const GEM_R = 0.0125; // gem cabochon radius
const GEM_LIFT = 0.006; // how far the dome lifts off the face
const FRONT_Z = PENDANT_T / 2; // front face of the pendant
const BEZEL_R = 0.018; // bezel ring radius (around the gem)
const BEZEL_TUBE = 0.004; // bezel ring tube radius (chunky)

const BAIL_R = 0.008; // bail loop ring radius
const BAIL_TUBE = 0.0024; // bail loop tube radius

const PETAL_R = 0.005; // decorative petal bump radius (sphere)

const CHAIN_R = 0.0075; // chain link ring radius
const CHAIN_TUBE = 0.0032; // chain link tube radius
const N_LINKS = 22; // number of chain links

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (e0: number, e1: number, v: number): number => {
  const t = clamp01((v - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

export default defineAsset({
  name: 'amulet',
  description:
    'Gold medallion pendant with a glowing red gem and four petal decorations, on a loose gold chain loop.',
  detail: 0.0045,
  reference: 'docs/item-mockups/amulet-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------
    // Pendant body: a vertical gold disc standing on its bottom edge.
    // Cylinder with axis along Z so the circular face is in the XY plane
    // and the front (with the gem) faces +Z. The disc centre sits at
    // (0, PENDANT_R, 0) so its rounded bottom edge rests on y = 0.
    const disc = sdf
      .cylinder(PENDANT_R, PENDANT_T, 0.003)
      .rotateX(90)
      .at(0, PENDANT_Y, 0);

    // A thin raised rim around the disc edge for visual interest.
    const rim = sdf
      .torus(PENDANT_R - 0.003, 0.0025)
      .rotateX(90)
      .at(0, PENDANT_Y, 0);

    // ------------------------------------------------------------------
    // Bezel: a chunky gold ring set into the front face, around the gem.
    // Axis rotated to Z so the ring sits in the XY plane (the pendant's
    // front face), with its tube bulging outward in +Z and inward.
    const bezel = sdf
      .torus(BEZEL_R, BEZEL_TUBE)
      .rotateX(90)
      .at(0, PENDANT_Y, FRONT_Z);

    // ------------------------------------------------------------------
    // Four petal bumps at the cardinal points around the bezel. Small
    // spheres raised off the face give the pendant the crafted
    // jewel-like character of the mockup.
    const petals: sdf.Shape[] = [];
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4; // 45°, 135°, 225°, 315°
      const d = BEZEL_R + 0.0045;
      const px = Math.cos(a) * d;
      const py = PENDANT_Y + Math.sin(a) * d;
      petals.push(sdf.sphere(PETAL_R).at(px, py, FRONT_Z));
    }

    // ------------------------------------------------------------------
    // Bail: a clear loop at the very top of the pendant, sticking up
    // above the disc. The loop axis is along Z (rotated 90 around X)
    // so it opens front-to-back and the chain visibly threads through.
    // The bail's pivot is at the top edge of the disc, and the loop
    // extends upward, so it reads as a separate hanging loop.
    const bailY = PENDANT_Y + PENDANT_R + BAIL_R + 0.003;
    const bail = sdf
      .torus(BAIL_R, BAIL_TUBE)
      .rotateX(90)
      .at(0, bailY, FRONT_Z + 0.001);

    const goldPaint = (x: number, y: number, z: number): Rgb => {
      // Vertical value ramp: shadow near the bottom of the disc, bright
      // mid-height where the light catches, pale highlight near the top.
      const yT = clamp01((y - 0.005) / 0.09);
      let c = mixRgb(GOLD_DARK, GOLD, 0.3 + 0.55 * smoothstep(0.0, 0.7, yT));
      const sheen = 0.5 + 0.5 * Math.sin(x * 60 + z * 60);
      c = mixRgb(c, GOLD_HI, 0.18 * smoothstep(0.6, 0.95, yT));
      c = mixRgb(c, GOLD_PALE, 0.14 * Math.max(0, sheen) * smoothstep(0.7, 1.0, yT));
      // Slight rim darkening where the disc edge catches a shadow.
      const r = Math.hypot(x, z);
      const onRim = Math.exp(-Math.pow((r - PENDANT_R) / 0.0035, 2));
      c = mixRgb(c, GOLD_DARK, 0.35 * onRim);
      return c;
    };

    const goldShape = sdf
      .smoothUnion(0.002, disc, rim, bezel, bail, ...petals)
      .paintFn(goldPaint);
    k.body('gold', goldShape, {
      color: '#d4a93a',
      roughness: 0.3,
      metalness: 1,
      detail: 0.004,
      maxTriangles: 1500,
      paintWeight: 2,
    });

    // ------------------------------------------------------------------
    // Gem: a low red cabochon dome on the front face. Dark base color
    // keeps the emissive glow saturated instead of washing out to peach.
    const gem = sdf
      .ellipsoid([GEM_R, GEM_R, GEM_LIFT])
      .at(0, PENDANT_Y, FRONT_Z + GEM_LIFT - 0.0005);
    const gemPaint = (x: number, y: number, z: number): Rgb => {
      const zT = clamp01((z - FRONT_Z + 0.0005) / GEM_LIFT);
      let c = mixRgb(GEM_DARK, GEM_MID, 0.4 + 0.5 * zT);
      // Highlight toward the top of the dome (where the light catches).
      const yT = clamp01((y - (PENDANT_Y - GEM_R)) / (2 * GEM_R));
      c = mixRgb(c, GEM_RIM, 0.5 * smoothstep(0.55, 1.0, yT) * zT);
      // Soft rim shadow around the gem's edge.
      const r = Math.hypot(x, z - FRONT_Z);
      const onEdge = Math.exp(-Math.pow((r - GEM_R * 0.85) / 0.002, 2));
      c = mixRgb(c, GEM_DARK, 0.55 * onEdge);
      return c;
    };
    k.body('gem', gem.paintFn(gemPaint), {
      color: '#4a0a05',
      roughness: 0.15,
      metalness: 0.05,
      emissive: GEM_GLOW,
      emissiveIntensity: 1.6,
      detail: 0.004,
      textureDensity: 2,
      paintWeight: 2,
      maxTriangles: 700,
    });

    // ------------------------------------------------------------------
    // Chain: a loose, slightly irregular oval loop of chunky gold links
    // around the pendant. Each link is a small torus lying flat on the
    // ground (axis along Y). All links have the same orientation, so the
    // loop reads as a connected chain of flat rings rather than a
    // scattered pile. The link height is large enough that even links
    // rotated by their yaw (which lifts the outer edge of the ring)
    // stay well above y = 0.
    const chainLinks: sdf.Shape[] = [];
    const CHAIN_Y = CHAIN_R + CHAIN_TUBE + 0.002; // sits well above ground
    for (let i = 0; i < N_LINKS; i++) {
      const t = i / N_LINKS;
      const angle = t * Math.PI * 2 + 0.07;
      // Slight irregular radius and ellipse: 10% wobble around a base
      // oval of (rx, rz) = (0.062, 0.054). Tighter loop so the chain
      // reads as connected (links overlap) rather than scattered.
      const rx = 0.062 + 0.006 * Math.sin(angle * 3 + 1.2);
      const rz = 0.054 + 0.005 * Math.sin(angle * 2 - 0.4);
      const x = Math.cos(angle) * rx;
      const z = Math.sin(angle) * rz;

      // All links lie flat (axis along Y, the default torus), yawed so
      // they follow the loop path. Slight per-link twist on Z so the
      // chain doesn't look rigidly aligned.
      const yaw = angle * (180 / Math.PI);
      const twist = 18 * Math.sin(i * 1.3);
      const link = sdf.torus(CHAIN_R, CHAIN_TUBE);
      chainLinks.push(link.rotateZ(twist).rotateY(yaw).at(x, CHAIN_Y, z));
    }

    // One short chain segment rising from the ground up to the bail,
    // making the bail visibly attached to the chain. Two links: one at
    // ground level transitioning into one positioned at the bail's y.
    const tailLink1 = sdf
      .torus(CHAIN_R, CHAIN_TUBE)
      .rotateX(90)
      .at(0, CHAIN_Y, 0);
    const tailLink2 = sdf
      .torus(CHAIN_R, CHAIN_TUBE)
      .rotateX(90)
      .at(0, (bailY + CHAIN_Y) / 2, 0);
    chainLinks.push(tailLink1);
    chainLinks.push(tailLink2);

    const chain = sdf.union(...chainLinks).paintFn(goldPaint);
    k.body('chain', chain, {
      color: '#d4a93a',
      roughness: 0.3,
      metalness: 1,
      detail: 0.004,
      maxTriangles: 1600,
      paintWeight: 2,
    });
  },
});