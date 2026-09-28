import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — hand drum with sticks (equipment/tools/drum).
 *
 * Role: cheerful hamlet/tavern music prop; must read at 128 px as a drum + sticks.
 * Size: 0.35 m wide, ~0.32 m tall, stands on y = 0, faces +Z, centred on Y.
 * One idea: a fat wooden goblet drum — flared foot, tucked waist, wide hide head —
 *   laced shut by a bold cream rope zigzag; two mallets rest beside it.
 * Shape language: round dominant (bulged shell, domed head, rope tubes);
 *   square secondary (flat red paint bands give a sturdy read).
 * Palette: honey oak #b5814a dominant; red band #a83a2a + pale hide #e2d3ad as
 *   the secondary contrast; rope cream #cdb98e; dark walnut #6b4226 accents.
 * Materials: wood (roughness 0.82), hide (0.75), rope (0.85), mallet heads
 *   (0.6). No metal needed.
 * Detail: primary shell + head + rope zigzag; secondary rope rings + two
 *   mallets; tertiary wood grain and rope twist in `bump` only.
 * Rig/animation: none (static prop).
 */

const WOOD = rgb('#ac7539');
const WOOD_PALE = rgb('#c9a06a');
const WOOD_DARK = rgb('#6b4226');
const RED = '#a83a2a';
const HIDE = '#dcc79c';
const ROPE = '#c9b184';
const WALNUT = '#4a2c18';

const R_TOP = 0.176; // widest shell radius at the top rim (0.35 m wide)
const H_TOP = 0.30; // top of the wooden shell
const ROPE_R = 0.0078;
const TOP_Y = 0.272;
const BOT_Y = 0.078;
const TOP_R = 0.171;
const BOT_R = 0.156;
const LANES = 6; // rope anchors around the shell

export default defineAsset({
  name: 'drum',
  description:
    'Hand drum: wooden goblet shell with red paint bands, a pale hide head laced by a cream rope zigzag, and two mallets resting beside it.',
  detail: 0.008,
  reference: 'docs/item-mockups/drum-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ shell
    // Flared foot, tucked waist, widest at the rim — reads as a goblet drum.
    const shellProfile = profile.polygon(
      [
        [0, 0.002],
        [0.135, 0.002],
        [0.172, 0.015],
        [0.175, 0.034],
        [0.162, 0.066],
        [0.147, 0.105],
        [0.145, 0.16],
        [0.152, 0.215],
        [0.164, 0.262],
        [R_TOP, H_TOP],
        [0.168, 0.312],
        [0.12, 0.314],
        [0, 0.314],
      ],
      { smooth: true, samples: 16 },
    );
    // Flat foot so the drum sits perfectly on y = 0.
    const shell = sdf.revolve(shellProfile).intersect(sdf.halfSpace([0, -1, 0], 0));

    const shellPaint = (x: number, y: number, z: number) => {
      // Wood grain stretched with the height of the shell.
      const grain = 0.5 + 0.5 * noise.fbm(x * 5, y * 34, z * 5, 2);
      const patch = 0.5 + 0.5 * noise.fbm(x * 9, y * 9, z * 9, 2);
      let c = mixRgb(WOOD, WOOD_PALE, 0.04 + 0.26 * grain);
      c = mixRgb(c, WOOD_DARK, 0.16 * patch);
      const t = Math.min(1, Math.max(0, y / H_TOP));
      // Shaded foot, sun-lit shoulder.
      c = mixRgb(c, WOOD_DARK, 0.3 * Math.pow(1 - t, 1.6));
      c = mixRgb(c, WOOD_PALE, 0.08 * Math.max(0, (t - 0.6) / 0.4));
      return c;
    };
    const band = (y: number, h: number) => sdf.cylinder(0.3, h).at(0, y, 0);
    const shellShape = shell
      .paintFn(shellPaint)
      .paintWhere(band(0.108, 0.036), RED, 0.004)
      .paintWhere(band(0.245, 0.044), RED, 0.004);
    k.body('shell', shellShape, {
      color: '#b5814a',
      roughness: 0.82,
      metalness: 0,
      detail: 0.009,
      paintWeight: 2,
      bump: (x, y, z) => 0.0016 * noise.fbm(x * 22, y * 7, z * 22, 2),
      maxTriangles: 1150,
    });

    // ------------------------------------------------------------------ head
    // Pale hide disc, softly domed, with a slight lip over the rim.
    const head = sdf
      .smoothUnion(
        0.012,
        sdf.cylinder(0.176, 0.026, 0.012).at(0, H_TOP + 0.006, 0),
        sdf.ellipsoid([0.126, 0.024, 0.126]).at(0, H_TOP + 0.02, 0),
      )
      .paintWhere(sdf.torus(0.152, 0.02).at(0, H_TOP + 0.016, 0), '#c1a878', 0.025);
    k.body('head', head, {
      color: HIDE,
      roughness: 0.78,
      metalness: 0,
      detail: 0.007,
      maxTriangles: 340,
    });

    // ------------------------------------------------------------------ ropes
    // Cream rope ring top and bottom, joined by a bold tension zigzag.
    const pt = (angle: number, y: number, r: number) =>
      [Math.cos(angle) * r, y, Math.sin(angle) * r] as [number, number, number];
    const segs: sdf.Shape[] = [];
    for (let i = 0; i < LANES; i++) {
      const topA = (i / LANES) * Math.PI * 2;
      const topB = ((i + 1) / LANES) * Math.PI * 2;
      const botA = ((i + 0.5) / LANES) * Math.PI * 2;
      const top = pt(topA, TOP_Y, TOP_R);
      const topNext = pt(topB, TOP_Y, TOP_R);
      const bot = pt(botA, BOT_Y, BOT_R);
      segs.push(sdf.capsule(top, bot, ROPE_R));
      segs.push(sdf.capsule(bot, topNext, ROPE_R));
    }
    const ropes = sdf.union(
      ...segs,
      sdf.torus(TOP_R, ROPE_R * 0.85).at(0, TOP_Y, 0),
      sdf.torus(BOT_R, ROPE_R * 0.85).at(0, BOT_Y, 0),
    );
    k.body('ropes', ropes, {
      color: ROPE,
      roughness: 0.88,
      metalness: 0,
      detail: 0.007,
      maxTriangles: 820,
    });

    // ------------------------------------------------------------------ mallets
    const mallet = (ax: number, az: number, bx: number, bz: number) =>
      sdf.smoothUnion(
        0.01,
        sdf.capsule([ax, 0.012, az], [bx, 0.012, bz], 0.011),
        sdf.sphere(0.025).at(bx, 0.025, bz),
      );
    const malletA = mallet(0.215, 0.16, 0.25, -0.17);
    const malletB = mallet(0.325, -0.155, 0.36, 0.165);
    const mallets = sdf
      .union(malletA, malletB)
      .paintWhere(sdf.sphere(0.036).at(0.25, 0.025, -0.17), WALNUT, 0.004)
      .paintWhere(sdf.sphere(0.036).at(0.36, 0.025, 0.165), RED, 0.004);
    k.body('mallets', mallets, {
      color: '#c9a06a',
      roughness: 0.62,
      metalness: 0,
      detail: 0.006,
      maxTriangles: 480,
    });
  },
});
