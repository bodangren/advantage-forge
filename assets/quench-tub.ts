import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — blacksmith quench tub (blacksmith/props/quench-tub).
 *
 * Role: foreground working prop beside the anvil in the blacksmith shop; must read at 128 px
 *   as one stout little wooden tub with water.
 * Size: 0.40 m across the rim, 0.30 m tall, stands on y = 0, faces +Z. A lid leans on +X.
 * One idea: a squat bucket in honey-oak staves, two dark iron straps, and a calm teal water
 *   surface sunk just below the chunky rolled rim.
 * Shape language: round dominant (revolved staved tub, rolled rim, round lid), square
 *   secondary (flat strap bands, the leaning plank lid break the roundness).
 * Palette: honey oak #b5814a dominant, light #d9a86b rims/seams, shadow #6d4523 stave
 *   shadows and damp foot; iron #4a4f55 bands; water #6fa8b8 with a pale #a9d3dd rim glint
 *   (the cool accent).
 * Materials: oak staves (roughness 0.82, metalness 0), worn iron straps (roughness 0.5,
 *   metalness 0.7), calm water (roughness 0.18, metalness 0.1), oak lid.
 * Detail: primary tub shell + rolled rim + leaning lid; secondary iron straps + rivets;
 *   tertiary stave seams and grain in `bump`. Focal point: the teal water at the rim.
 * Rig/animation: none (static prop).
 */

const HONEY = rgb('#b5814a');
const HONEY_LIGHT = rgb('#d9a86b');
const HONEY_DARK = rgb('#6d4523');

const IRON = '#4a4f55';
const IRON_LIGHT = rgb('#6b7078');

const WATER = rgb('#6fa8b8');
const WATER_DEEP = rgb('#4d8296');
const WATER_LIGHT = rgb('#a9d3dd');

const TOP = 0.3; // rim height
const STAVES = 16;
const BAND_LO = 0.078; // low iron strap centre
const BAND_HI = 0.232; // high iron strap centre
const BAND_W = 0.038; // strap width

export default defineAsset({
  name: 'quench-tub',
  description:
    'Stout honey-oak quench tub in vertical staves with two dark iron strap bands, a calm teal water surface, and a flat wooden lid leaning against one side.',
  detail: 0.006,
  reference: 'docs/blacksmith-mockups/blacksmith-quest_001.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------- tub shell
    // One revolved bucket profile: narrow flat foot, gently swelling staves, chunky rolled
    // rim, then down the inside into a shallow basin. A solid basin (rather than a deep
    // hollow shell) hides the wall below the waterline, so it costs no surface at all.
    const tubProfile = profile.polygon(
      [
        [0, 0.0],
        [0.1, 0.0],
        [0.138, 0.008],
        [0.146, 0.045],
        [0.153, 0.12],
        [0.166, 0.2],
        [0.184, 0.258],
        [0.198, 0.284],
        [0.206, 0.298],
        [0.207, 0.306],
        [0.2, 0.312],
        [0.178, 0.314],
        [0.162, 0.31],
        [0.154, 0.3],
        [0.15, 0.288],
        [0.147, 0.276],
        [0.144, 0.272],
        [0.12, 0.264],
        [0.07, 0.257],
        [0, 0.255],
      ],
      { smooth: true, samples: 12 },
    );
    const outerSolid = sdf.revolve(tubProfile);
    // Flat foot on y = 0 so the ground line is perfect (the smooth profile dips near the axis).
    // A small round first turns the cut into a fillet, which reduces folded slivers later.
    const tub = outerSolid.round(0.004).intersect(sdf.halfSpace([0, -1, 0], 0));

    // Per-stave tint, dark seams, and a damp-foot / lit-shoulder value plan.
    const stavePaint = (x: number, y: number, z: number) => {
      const a = Math.atan2(z, x);
      const u = ((a + Math.PI) / (Math.PI * 2)) * STAVES;
      const idx = Math.floor(u);
      const f = u - idx;
      const edge = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * f), 6);
      const tint = noise.random(idx, 7, 3);
      const patch = 0.5 + 0.5 * noise.fbm(x * 6, y * 6, z * 6, 2);
      const grain = 0.5 + 0.5 * noise.fbm(x * 12, y * 46, z * 12, 2);
      let c = mixRgb(HONEY, HONEY_LIGHT, 0.14 + 0.32 * tint);
      c = mixRgb(c, HONEY, 0.3 * patch);
      c = mixRgb(c, HONEY_LIGHT, 0.12 * grain);
      const t = Math.min(1, Math.max(0, y / TOP));
      c = mixRgb(c, HONEY_DARK, 0.44 * (1 - t) * (1 - t)); // damp shaded foot
      c = mixRgb(c, HONEY_LIGHT, 0.2 * Math.max(0, (t - 0.5) / 0.5)); // lit upper staves
      c = mixRgb(c, HONEY_LIGHT, 0.26 * Math.max(0, (y - 0.292) / 0.038)); // bright rim lip
      c = mixRgb(c, HONEY_DARK, 0.72 * edge); // dark seam lines between staves
      return c;
    };
    const staveBump = (x: number, y: number, z: number) => {
      const a = Math.atan2(z, x);
      const u = ((a + Math.PI) / (Math.PI * 2)) * STAVES;
      const f = u - Math.floor(u);
      const edge = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * f), 6);
      return -0.0032 * edge + 0.0016 * noise.fbm(x * 26, y * 9, z * 26, 2);
    };
    k.body('staves', tub.paintFn(stavePaint), {
      color: '#b5814a',
      roughness: 0.82,
      metalness: 0,
      detail: 0.009,
      bump: staveBump,
      maxTriangles: 2600,
    });

    // ------------------------------------------------------------- water
    // A calm disc that exactly fills the basin and sits just below the rim, so the
    // wood ring frames it from every view. Barely a ripple: calm quench water.
    const waterSolid = sdf.cylinder(0.142, 0.26, 0.004).at(0, 0.154, 0);
    const waterPaint = (x: number, _y: number, z: number) => {
      const r = Math.hypot(x, z);
      const ripple = 0.5 + 0.5 * noise.fbm(x * 11, _y * 60, z * 11, 2);
      let c = mixRgb(WATER, WATER_DEEP, 0.1 + 0.22 * ripple);
      const rimGlint = Math.max(0, (r - 0.11) / 0.032);
      c = mixRgb(c, WATER_LIGHT, 0.3 * Math.pow(rimGlint, 1.5)); // thin pale ring at the wall
      return c;
    };
    k.body('water', waterSolid.paintFn(waterPaint), {
      color: '#6fa8b8',
      roughness: 0.18,
      metalness: 0.1,
      detail: 0.012,
      maxTriangles: 300,
    });

    // ------------------------------------------------------------- iron straps
    // Thin shells of the outer wall, cut into two narrow bands so they hug the
    // curve. Four rivets per band sit proud on the outside.
    // 9 mm proud so the straps survive the wood's triangle reduction.
    const bandShell = outerSolid.round(0.009).subtract(outerSolid.round(-0.002));
    const bandAt = (y: number) =>
      bandShell.intersect(sdf.box([1.2, BAND_W, 1.2], 0.008).at(0, y, 0));
    const rivetR = [0.158, 0.184]; // outer wall radius at the low/high strap
    const rivets: ReturnType<typeof sdf.sphere>[] = [];
    [BAND_LO, BAND_HI].forEach((y, bi) => {
      const rr = rivetR[bi] ?? 0.184;
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + (bi === 0 ? Math.PI / 4 : 0);
        rivets.push(sdf.sphere(0.009).at(Math.cos(a) * rr, y, Math.sin(a) * rr));
      }
    });
    const straps = sdf
      .union(bandAt(BAND_LO), bandAt(BAND_HI), ...rivets)
      .paintFn((x, y, _z, base) => {
        // Worn iron: darker in the seams, a lit rub along the outer edge.
        const wear = 0.5 + 0.5 * noise.fbm(x * 14, y * 14, _z * 14, 2);
        return mixRgb(mixRgb(base, rgb('#2f3338'), 0.35 * wear), IRON_LIGHT, 0.2 * (1 - wear));
      });
    k.body('straps', straps, {
      color: IRON,
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.006,

      bump: (x, y, z) => 0.0009 * noise.fbm(x * 40, y * 40, z * 40, 2),
      maxTriangles: 2400,
    });

    // ------------------------------------------------------------- leaning lid
    // A flat oak disc tilted 18 degrees off vertical against the +X rim: bottom
    // edge on the ground, top edge resting on the rolled lip.
    const LID_R = 0.176;
    const LID_T = 0.02;
    const LID_CX = 0.254;
    const LID_CY = 0.167;
    const lidSolid = sdf.cylinder(LID_R, LID_T, 0.006).rotateZ(108).at(LID_CX, LID_CY, 0);

    // Paint planks in the disc's own frame: un-tilt the world, then board seams run
    // across one radius direction, grain along the other.
    const c108 = Math.cos((-108 * Math.PI) / 180);
    const s108 = Math.sin((-108 * Math.PI) / 180);
    const lidPaint = (x: number, y: number, z: number) => {
      const px = x - LID_CX;
      const py = y - LID_CY;
      const lx = px * c108 - py * s108; // across the boards
      const lz = z; // along the boards
      const f = lx / 0.058 - Math.floor(lx / 0.058);
      const seam = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * f), 4);
      const grain = 0.5 + 0.5 * noise.fbm(lx * 5, lz * 44, 3, 2);
      let c = mixRgb(HONEY_LIGHT, HONEY, 0.28 + 0.3 * grain);
      c = mixRgb(c, HONEY_DARK, 0.5 * seam);
      const r = Math.hypot(lx, lz);
      c = mixRgb(c, HONEY_DARK, 0.4 * Math.max(0, (r - 0.148) / 0.03)); // dark round edge
      return c;
    };
    k.body('lid', lidSolid.paintFn(lidPaint), {
      color: '#c9a06a',
      roughness: 0.82,
      metalness: 0,
      detail: 0.01,
      bump: (x, y, z) => {
        const px = x - LID_CX;
        const py = y - LID_CY;
        const lx = px * c108 - py * s108;
        const f = lx / 0.058 - Math.floor(lx / 0.058);
        const seam = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * f), 4);
        return -0.0022 * seam + 0.0012 * noise.fbm(lx * 30, z * 30, 4, 2);
      },
      maxTriangles: 300,
    });
  },
});
