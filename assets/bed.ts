import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — inn bed (props/furniture/bed).
 *
 * Role: furniture prop for a cozy firelit tavern; must read at 128 px sprite.
 * Size: 1.9 m long (along Z), 1.0 m wide, stands on y = 0, headboard at -Z,
 *   footboard toward +Z.
 * One idea: a chunky honey-oak inn bed whose tall arched headboard and fat
 *   pillow promise a good sleep, dressed with a folded red patchwork quilt.
 * Shape language: round dominant (rounded posts, arched rail, fat pillow),
 *   square secondary (plank panels, straight rails).
 * Palette: honey oak #b5814a (dominant wood), dark walnut #6b4226 (shaded
 *   feet, post gaps), cream #f0e4cc (mattress, pillow, quilt squares),
 *   fabric red #9a4a3a (quilt accent). Value plan: light mattress/quilt top
 *   against mid wood, dark under-bed shadow.
 * Materials: wood (roughness 0.8, metalness 0), mattress cloth (0.95),
 *   pillow cloth (0.9), quilt cloth (0.88) with patchwork paint + weave bump.
 * Detail: primary 4 posts + 2 rails + 2 panels + mattress + pillow + quilt;
 *   secondary arch torus, post caps, quilt fold flap; tertiary wood grain and
 *   weave in bump. Focal point: red quilt with cream squares on the bed top.
 * Rig/animation: none (static prop).
 */

const OAK = rgb('#b5814a');
const OAK_LIGHT = rgb('#c9a06a');
const WALNUT = rgb('#6b4226');
const CREAM = rgb('#f0e4cc');
const CREAM_LIGHT = rgb('#f6eedd');
const QUILT_RED = rgb('#9a4a3a');
const QUILT_DARK = rgb('#7e3a2d');

const POST_X = 0.45; // post centers; 0.1 wide posts -> 1.0 m outer width
const HEAD_Z = -0.9; // headboard post centers (1.9 m outer length)
const FOOT_Z = 0.9;

export default defineAsset({
  name: 'bed',
  description:
    'Honey-oak inn bed with a tall arched headboard, cream mattress, fat pillow, and a folded red patchwork quilt.',
  detail: 0.008,
  reference: 'docs/item-mockups/bed-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ frame (wood)
    // Four chunky posts with rounded caps; headboard pair taller than foot pair.
    const post = (x: number, z: number, h: number) =>
      sdf
        .box([0.1, h, 0.1], 0.03)
        .at(x, h / 2, z)
        .smoothUnion(0.02, sdf.sphere(0.062).at(x, h + 0.01, z));

    const headPostL = post(-POST_X, HEAD_Z, 1.12);
    const headPostR = post(POST_X, HEAD_Z, 1.12);
    const footPostL = post(-POST_X, FOOT_Z, 0.72);
    const footPostR = post(POST_X, FOOT_Z, 0.72);

    // Headboard: arched top rail (extruded 2D arc band) over a plank panel;
    // footboard: straight rail over a shorter panel.
    const arch = sdf.extrude(profile.arc(0.44, 0.075, 18, 162), 0.06, 0.02).at(
      0,
      0.72,
      HEAD_Z,
    );
    const headRail = sdf
      .box([0.84, 0.1, 0.06], 0.02)
      .at(0, 0.85, HEAD_Z)
      .smoothUnion(0.03, arch);
    const headPanel = sdf.box([0.8, 0.58, 0.045], 0.015).at(0, 0.6, HEAD_Z);

    const footRail = sdf.box([0.84, 0.1, 0.06], 0.02).at(0, 0.58, FOOT_Z);
    const footPanel = sdf.box([0.8, 0.26, 0.045], 0.015).at(0, 0.4, FOOT_Z);

    // Side rails linking head and foot.
    const sideL = sdf.box([0.05, 0.15, 1.72], 0.015).at(-POST_X, 0.3, 0);
    const sideR = sdf.box([0.05, 0.15, 1.72], 0.015).at(POST_X, 0.3, 0);

    const frame = sdf
      .smoothUnion(
        0.025,
        headPostL,
        headPostR,
        footPostL,
        footPostR,
        headRail,
        headPanel,
        footRail,
        footPanel,
        sideL,
        sideR,
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0.001)); // flat feet on y = 0

    // Honey-oak paint: vertical grain, darker toward the floor, pale wear on
    // the rail tops.
    const woodPaint = (x: number, y: number, z: number) => {
      const grain = 0.5 + 0.5 * noise.fbm(x * 22, y * 5, z * 22, 2);
      const patch = 0.5 + 0.5 * noise.fbm(x * 4, y * 4, z * 4, 2);
      let c = mixRgb(OAK, OAK_LIGHT, 0.12 + 0.22 * grain + 0.15 * patch);
      c = mixRgb(c, WALNUT, 0.38 * Math.max(0, 1 - y / 0.5) ** 2);
      // Horizontal plank seams on the headboard and footboard panels.
      if (Math.abs(z) > 0.85) {
        const f = y / 0.14 - Math.floor(y / 0.14);
        const seam = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * f), 8);
        c = mixRgb(c, WALNUT, 0.55 * seam);
      }
      return c;
    };
    k.body('frame', frame.paintFn(woodPaint), {
      color: '#b5814a',
      roughness: 0.8,
      metalness: 0,
      detail: 0.012,
      maxTriangles: 2800,
      bump: (x, y, z) =>
        0.0016 * noise.fbm(x * 30, y * 7, z * 30, 2) -
        0.0012 * Math.pow(Math.abs(noise.fbm(x * 6, y * 1.2, z * 6, 2)), 3),
    });

    // ------------------------------------------------------------------ mattress (cream cloth)
    const mattress = sdf
      .box([0.9, 0.24, 1.68], 0.07)
      .at(0, 0.44, 0.03)
      .displace(0.006, (x, y, z) =>
        y > 0.5 ? noise.fbm(x * 9, y * 9, z * 9, 2) : 0,
      );
    const mattressPaint = (x: number, y: number, z: number) => {
      let c = mixRgb(CREAM, CREAM_LIGHT, 0.35 + 0.25 * noise.fbm(x * 6, y * 6, z * 6, 2));
      // Piping line around the top edge.
      const d = Math.max(Math.abs(x) / 0.45, Math.abs(z - 0.03) / 0.84);
      c = mixRgb(c, mixRgb(CREAM, WALNUT, 0.25), 0.5 * Math.max(0, 1 - Math.abs(d - 0.93) / 0.07));
      return c;
    };
    k.body('mattress', mattress.paintFn(mattressPaint), {
      color: '#f0e4cc',
      roughness: 0.95,
      metalness: 0,
      detail: 0.01,
      maxTriangles: 1800,
      bump: (x, y, z) => 0.0022 * noise.fbm(x * 40, y * 40, z * 40, 2),
    });

    // ------------------------------------------------------------------ pillow (cream cloth)
    const pillow = sdf
      .ellipsoid([0.31, 0.12, 0.2])
      .at(0, 0.635, -0.6)
      .displace(0.008, (x, y, z) =>
        noise.fbm(x * 14 + 3, y * 14, z * 14, 2),
      );
    k.body('pillow', pillow.paintFn((x, y, z) => {
      const t = Math.min(1, Math.max(0, (y - 0.52) / 0.24));
      return mixRgb(CREAM, CREAM_LIGHT, 0.3 + 0.45 * t);
    }), {
      color: '#f6eedd',
      roughness: 0.9,
      metalness: 0,
      detail: 0.007,
      maxTriangles: 900,
      bump: (x, y, z) => 0.003 * noise.fbm(x * 35, y * 35, z * 35, 2),
    });

    // ------------------------------------------------------------------ quilt (red patchwork)
    // Top slab over the foot half of the mattress plus a flap folded down
    // over the foot end, with soft cloth wrinkles.
    const quiltTop = sdf
      .box([0.94, 0.1, 1.1], 0.045)
      .at(0, 0.575, 0.37)
      .displace(0.007, (x, y, z) => noise.fbm(x * 10, y * 10, z * 10 + 7, 2));
    const quiltFlap = sdf
      .box([0.94, 0.36, 0.1], 0.035)
      .at(0, 0.5, 0.95)
      .displace(0.006, (x, y, z) => noise.fbm(x * 12 + 9, y * 12, z * 12, 2));
    const quilt = sdf.smoothUnion(0.04, quiltTop, quiltFlap);

    // Patchwork: cream squares on a red ground, faded on the vertical flap so
    // the top face carries the pattern (matches the mockup).
    const SQ = 0.135;
    const quiltPaint = (x: number, y: number, z: number) => {
      const u = x / SQ;
      const v = (z - 0.37) / SQ;
      const cu = u - Math.floor(u);
      const cv = v - Math.floor(v);
      // Smooth checker: 1 inside a cream square, 0 on red ground.
      const su = Math.min(1, Math.min(cu, 1 - cu) / 0.07);
      const sv = Math.min(1, Math.min(cv, 1 - cv) / 0.07);
      const border = su * su * sv * sv;
      const parity = (Math.floor(u) + Math.floor(v)) % 2 === 0 ? 1 : 0;
      const wear = 0.5 + 0.5 * noise.fbm(x * 5, y * 5, z * 5, 2);
      let c = mixRgb(QUILT_RED, QUILT_DARK, 0.3 * wear);
      const creamSq = mixRgb(CREAM, CREAM_LIGHT, 0.4 * wear);
      // Only the horizontal top face of the slab gets squares, not the fold.
      const topness =
        Math.min(1, Math.max(0, (y - 0.615) / 0.03)) *
        Math.min(1, Math.max(0, (0.84 - z) / 0.06));
      c = mixRgb(c, creamSq, parity * border * topness);
      // Fold shadow where the flap bends over the foot end.
      c = mixRgb(c, QUILT_DARK, 0.3 * Math.max(0, 1 - Math.abs(z - 0.85) / 0.08));
      return c;
    };
    k.body('quilt', quilt.paintFn(quiltPaint), {
      color: '#9a4a3a',
      roughness: 0.88,
      metalness: 0,
      detail: 0.02,
      textureDensity: 2,
      maxTriangles: 1800,
      bump: (x, y, z) => 0.0028 * noise.fbm(x * 45, y * 45, z * 45, 2),
    });
  },
});
