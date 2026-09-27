import { defineAsset, sdf, profile, noise, rgb, mixRgb } from '../src/index.js';

/**
 * Design note — chunky turnip (props/food/turnip).
 *
 * Role: cozy chibi farm/market food prop; must read at 128 px sprite.
 * Size: ~0.18 m tall total (bulb ~0.13 m + tuft + tiny tail); stands on y = 0,
 *   centred on Y, faces +Z.
 * One idea: a plump egg-shaped turnip with a soft purple shoulder, cream-white belly, and a
 *   tight tuft of three plump green leaves fanning out from a small socket on top.
 * Shape language: round/egg dominant; soft paddle leaves secondary.
 * Palette: cream white #f2eee4 (60 bottom), purple #9a5aa0 (30 shoulder), darker purple #6e3a76,
 *   leaf green #5cb85c / #3c7a3d / #86d47e highlight; tiny tail pale cream.
 * Materials: turnip skin (rough 0.5), leaves satin (0.55), tail root matte (0.85).
 * Detail: smooth top-to-bottom gradient, soft belly bulge, three plump fanned leaves + small
 *   leaf base, tiny tail nub at the base.
 * Rig/animation: none (static prop).
 */

const PURPLE = rgb('#9a5aa0');
const PURPLE_DARK = rgb('#6e3a76');
const CREAM = rgb('#f2eee4');
const CREAM_SHADE = rgb('#d8cfb8');
const LEAF = rgb('#5cb85c');
const LEAF_DARK = rgb('#3c7a3d');
const LEAF_LIGHT = rgb('#86d47e');
const TAIL = rgb('#d8c8a8');

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (e0: number, e1: number, v: number): number => {
  const t = clamp01((v - e0) / (e1 - e0 || 1e-6));
  return t * t * (3 - 2 * t);
};

export default defineAsset({
  name: 'turnip',
  description: 'A chunky egg-shaped turnip with a pale cream-white root, purple shoulder, three fanned green leaves, and a tiny tail nub.',
  detail: 0.006,
  reference: 'docs/item-mockups/turnip-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------ bulb body
    // Egg-shaped profile: belly widest about 55% up, narrows more at the top
    // and gently at the bottom so the leaves have a small socket and the
    // base looks like a real root, not a flat disc.
    const bulbProfile = profile.polygon(
      [
        [0.0, 0.024],     // base centre (tiny tail attaches just below)
        [0.02, 0.024],    // soft shoulder out
        [0.032, 0.032],
        [0.041, 0.044],
        [0.047, 0.058],
        [0.048, 0.074],
        [0.045, 0.088],
        [0.04, 0.1],
        [0.033, 0.108],
        [0.024, 0.114],
        [0.015, 0.118],
        [0.008, 0.119],
        [0.0, 0.118],     // top centre socket (narrower neck)
      ],
      { smooth: true, samples: 14 },
    );
    const bulb = sdf.revolve(bulbProfile)
      // Tiny dimple at the top so leaves sit in a socket.
      .smoothSubtract(0.004, sdf.sphere(0.014).at(0, 0.118, 0))
      .paintFn((x, y, z, base) => {
        // Top (purple) → bottom (cream) gradient by height. t = 0 at base, 1 at top.
        const t = clamp01((y - 0.03) / 0.088);
        // Soft purple shoulder (light purple up high, slightly darker just under the leaves).
        const purpleTop = mixRgb(PURPLE_DARK, PURPLE, smoothstep(0.55, 1, t));
        // Soft cream belly (lighter in the middle, slightly shaded at the very base).
        const creamBot = mixRgb(CREAM_SHADE, CREAM, smoothstep(0.0, 0.4, t));
        // Extra-wide transition band so the colour blends smoothly with no visible stripe.
        const band = smoothstep(0.1, 0.95, t);
        let c = mixRgb(creamBot, purpleTop, band);
        // Subtle warm-to-cool side shade so the belly reads round.
        const r = Math.hypot(x, z);
        const side = clamp01((r - 0.042) / 0.008);
        c = mixRgb(c, CREAM_SHADE, side * (1 - t) * 0.18);
        // Mottle for organic skin.
        const m = 0.5 + 0.5 * noise.fbm(x * 18, y * 18, z * 18, 2);
        c = mixRgb(c, mixRgb(CREAM, PURPLE, t), m * 0.06);
        return c;
      });
    k.body('bulb', bulb, {
      color: '#b481a8', // mid purple — paint dominates
      roughness: 0.5,
      metalness: 0,
      detail: 0.005,
      textureDensity: 2,
      paintWeight: 2,
      maxTriangles: 900,
      bump: (x, y, z) => 0.0008 * noise.fbm(x * 32, y * 32, z * 32, 2),
    });

    // ------------------------------------------------------------ tail roots
    // Three tiny stubby roots peeking out from the bottom — barely visible,
    // each at a different azimuth. They give the silhouette a soft base
    // without a single sharp point.
    function tailRoot(azDeg: number, len: number, r0: number) {
      const az = (azDeg * Math.PI) / 180;
      const tip: [number, number, number] = [Math.sin(az) * (r0 - 0.004), 0.024 - len, Math.cos(az) * (r0 - 0.004)];
      const base: [number, number, number] = [Math.sin(az) * r0, 0.024, Math.cos(az) * r0];
      return sdf
        .cone(base, tip, 0.014, 0.006)
        .paintFn((x, y, z, base) => {
          const t = clamp01((y - 0.0) / 0.024);
          return mixRgb(CREAM_SHADE, TAIL, t * 0.5 + 0.3);
        });
    }
    const tail = sdf.union(
      tailRoot(160, 0.024, 0.022),
      tailRoot(20, 0.024, 0.022),
      tailRoot(260, 0.024, 0.022),
    );
    k.body('tail', tail, {
      color: '#d8c8a8',
      roughness: 0.85,
      metalness: 0,
      detail: 0.004,
      maxTriangles: 120,
    });

    // ------------------------------------------------------------ leaves
    // Three plump 3D paddle leaves fanning out from the top socket. Each
    // leaf is a thick paddle (extruded with depth) curved up like a petal,
    // pushed apart radially so they read as three separate blades, and
    // placed at a different azimuth.
    const LEAF_R = 0.028;
    const BASE_Y = 0.118;
    function leafBlade(azDeg: number, leanDeg: number, twistDeg: number, length: number) {
      // Teardrop outline: narrow base, wider in the middle, blunt rounded tip.
      // The wider middle gives the leaf its paddle shape.
      const tip = 0.062 * length;
      const leafOutline = profile.polygon(
        [
          [0, 0.0],
          [0.012, 0.005],
          [0.022, 0.016],
          [0.026, 0.03],
          [0.022, 0.044],
          [0.014, 0.054],
          [0.005, 0.06],
          [0.0, tip],
          [-0.005, 0.06],
          [-0.014, 0.054],
          [-0.022, 0.044],
          [-0.026, 0.03],
          [-0.022, 0.016],
          [-0.012, 0.005],
        ],
        { smooth: true, samples: 14 },
      );
      const cosL = Math.cos((leanDeg * Math.PI) / 180);
      const yTip = BASE_Y + tip * cosL;
      return sdf
        .extrude(leafOutline, 0.02, 0.008)
        .round(0.004)
        .rotateY(twistDeg)      // twist about the leaf's length axis
        .rotateX(-leanDeg)      // tip the leaf back so the lean becomes radial outward
        .at(0, BASE_Y, LEAF_R)  // offset the base off the Y axis so rotateY actually spreads them
        .rotateY(azDeg)
        .paintFn((x, y, z, base) => {
          const yNorm = clamp01((y - BASE_Y) / Math.max(0.03, yTip - BASE_Y));
          let c = mixRgb(LEAF_DARK, LEAF, smoothstep(0.0, 0.55, yNorm));
          c = mixRgb(c, LEAF_LIGHT, smoothstep(0.6, 1, yNorm) * 0.5);
          // Centre vein: darker line down the leaf middle.
          const vein = clamp01(1 - Math.abs(x) / 0.005);
          c = mixRgb(c, LEAF_DARK, vein * 0.3);
          return c;
        });
    }

    // Small leaf base nub at the top socket where leaves emerge.
    const leafBase = sdf
      .ellipsoid([0.014, 0.01, 0.014])
      .at(0, BASE_Y + 0.003, 0)
      .round(0.003)
      .paintFn((x, y, z, base) => {
        return mixRgb(LEAF_DARK, LEAF, 0.55);
      });

    // Three fanned leaves: back leaf slightly taller and upright, two front
    // leaves leaning outward and clearly separated.
    const leaves = sdf.union(
      leafBase,
      leafBlade(180, 18, 0, 1.0),     // back leaf, almost upright (taller)
      leafBlade(75, 42, -16, 0.85),   // front-right leaf, leaning out
      leafBlade(285, 42, 16, 0.85),   // front-left leaf, leaning out
    );
    k.body('leaves', leaves, {
      color: '#5cb85c',
      roughness: 0.55,
      metalness: 0,
      detail: 0.005,
      textureDensity: 2,
      paintWeight: 2,
      maxTriangles: 800,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 24, y * 24, z * 24, 2),
    });
  },
});