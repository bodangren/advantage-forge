import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — tavern writing desk (props/furniture/desk).
 *
 * Role: an interactive furniture prop in the warm firelit tavern; must read at 128 px
 *   as "desk with an open book and a quill".
 * Size: 1.1 m wide (X), 0.6 m deep (Z), 0.75 m tall. Stands on y = 0, faces +Z.
 * One idea: a chunky honey-oak top floating on four stout legs, with a tall cream quill
 *   rising out of a dark ink pot — the quill breaks the silhouette.
 * Shape language: square dominant (slab, block legs, apron, H-stretcher), round
 *   secondary (soft bevels, pale peg studs, revolved ink pot and candle).
 * Palette: honey oak #b5814a top (light dominant), warm brown #8a5a35 frame (mid),
 *   pale cut wood #c9a06a drawer + pegs (accent), dark walnut #6b4226 book + shadow,
 *   pewter #9aa3ad metal, fabric red #9a4a3a bookmark, flame emissive #ff9a3c.
 * Materials: oak top (roughness 0.78), walnut frame + drawer (roughness 0.85),
 *   pewter (metalness 0.8, roughness 0.4), plaster pages (roughness 0.9),
 *   wax (roughness 0.55), emissive flame (dark base under the glow).
 * Detail: primary slab + legs + apron + stretcher; secondary drawer + knob + pegs;
 *   tertiary plank seams, grain, page lines. Focal: the quill over the ink pot.
 * Rig/animation: none (static prop).
 */

const HONEY = rgb('#b5814a');
const HONEY_PALE = rgb('#c9a06a');
const HONEY_DEEP = rgb('#8a5a35');
const WALNUT = rgb('#8a5a35');
const WALNUT_DEEP = rgb('#6b4226');
const WALNUT_SHADOW = rgb('#472a15');
const PEWTER = rgb('#9aa3ad');
const PEWTER_DEEP = rgb('#5b636c');
const IRON = rgb('#3d4047');
const WAX = rgb('#f0e4cc');
const WAX_DEEP = rgb('#d3b98a');
const FLAME = rgb('#ff9a3c');
const CLOTH = rgb('#9a4a3a');
const PAGE = rgb('#f0e4cc');
const PAGE_LINE = rgb('#b08f63');
const PAGE_SHADOW = rgb('#8a7048');
const INK = rgb('#1a1410');

const W = 1.1;
const D = 0.6;
const H = 0.75;
const HALF_W = W / 2;
const HALF_D = D / 2;
const TOP_T = 0.05;
const TOP_Y = H - TOP_T / 2; // 0.7275, slab spans 0.705..0.75
const APRON_TOP = H - TOP_T; // 0.705
const APRON_H = 0.115;
const APRON_Y = APRON_TOP - APRON_H / 2; // 0.6475
const LEG = 0.11;
const LEG_X = 0.455;
const LEG_Z = 0.235;
const STRETCH_Y = 0.135;
const STRETCH = 0.05;

// top props
const BOOK_X = -0.15;
const BOOK_Z = 0.0;
const POT = { x: 0.33, z: -0.11 };
const CANDLE = { x: 0.31, z: 0.16 };

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// ---------------------------------------------------------------- top paint
const TOP_BOARD = 0.15;
const topPaint = (x: number, y: number, z: number) => {
  // Planks run along the length; seams fall across Z.
  const v = (z + HALF_D) / TOP_BOARD;
  const idx = Math.floor(v);
  const f = v - idx;
  const seam = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * f), 12);
  const tint = noise.random(idx, 11, 5);
  const grain = 0.5 + 0.5 * noise.fbm(x * 7, y * 55, z * 26, 2);
  let c = mixRgb(HONEY, HONEY_PALE, 0.14 + 0.38 * tint);
  c = mixRgb(c, HONEY_DEEP, 0.18 * grain);
  // Sun-bleached working top and a lighter front edge.
  const top = clamp01((y - (H - 0.012)) / 0.01);
  c = mixRgb(c, HONEY_PALE, 0.7 * top);
  const front = clamp01((z - (HALF_D - 0.03)) / 0.03) * top;
  c = mixRgb(c, HONEY_PALE, 0.5 * front);
  // Pale cut end grain on the two short ends.
  const end = 1 - clamp01((HALF_W - Math.abs(x)) / 0.012);
  c = mixRgb(c, HONEY_PALE, 0.6 * end);
  // Small story: ink stains around the pot and a pale worn patch under the book.
  const rp = Math.hypot(x - POT.x, z - POT.z);
  const stain = Math.pow(clamp01(1 - rp / 0.12), 2) * (0.4 + 0.6 * noise.fbm(x * 45, 0, z * 45, 2));
  c = mixRgb(c, rgb('#3a2a1c'), 0.3 * stain * top);
  const rb = Math.hypot(x - BOOK_X, z - BOOK_Z);
  c = mixRgb(c, HONEY_PALE, 0.25 * Math.pow(clamp01(1 - rb / 0.22), 2) * top);
  // Shaded underside.
  const under = clamp01((APRON_TOP + 0.012 - y) / 0.012);
  c = mixRgb(c, WALNUT_SHADOW, 0.5 * under);
  c = mixRgb(c, WALNUT_DEEP, 0.7 * seam);
  return c;
};

// -------------------------------------------------------------- frame paint
const framePaint = (x: number, y: number, z: number) => {
  let c = WALNUT;
  const grain = 0.5 + 0.5 * noise.fbm(x * 15, y * 5, z * 15, 2);
  c = mixRgb(c, WALNUT_DEEP, 0.4 * grain);
  // Deep shade up under the slab and down near the floor.
  c = mixRgb(c, WALNUT_SHADOW, 0.85 * clamp01((y - (APRON_TOP - 0.12)) / 0.12));
  c = mixRgb(c, WALNUT_SHADOW, 0.45 * clamp01((0.22 - y) / 0.22));
  c = mixRgb(c, WALNUT_SHADOW, 0.7 * clamp01((0.05 - y) / 0.05));
  // Pale cut end grain on the outer leg faces.
  const endGrain = clamp01((Math.abs(x) - 0.49) / 0.02) * clamp01((y - 0.1) / 0.1);
  c = mixRgb(c, HONEY_PALE, 0.6 * endGrain);
  return c;
};

// ------------------------------------------------------------- drawer paint
const drawerPaint = (x: number, y: number, z: number) => {
  let c = HONEY_PALE;
  const grain = 0.5 + 0.5 * noise.fbm(x * 40, y * 8, z * 20, 2);
  c = mixRgb(c, HONEY, 0.3 + 0.3 * grain);
  // Dark reveal groove around the drawer face.
  const border = Math.max(
    clamp01((Math.abs(x) - 0.185) / 0.012),
    clamp01((Math.abs(y - APRON_Y) - 0.038) / 0.012),
  );
  c = mixRgb(c, WALNUT_SHADOW, 0.75 * clamp01(border));
  return c;
};

export default defineAsset({
  name: 'desk',
  description:
    'Honey-oak writing desk with four stout legs, one drawer, and an open book, ink pot with quill, and candle stub on top.',
  detail: 0.009,
  reference: 'docs/item-mockups/desk-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ top
    const top = sdf.box([W, TOP_T, D], 0.022).at(0, TOP_Y, 0);
    k.body('top', top.paintFn(topPaint), {
      color: '#b5814a',
      roughness: 0.78,
      metalness: 0,
      detail: 0.011,
      textureDensity: 2,
      bump: (x, y, z) => {
        const v = (z + HALF_D) / TOP_BOARD;
        const f = v - Math.floor(v);
        const seam = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * f), 12);
        return -0.0025 * seam + 0.001 * (noise.fbm(x * 22, y * 40, z * 22, 2) - 0.5);
      },
    });

    // ---------------------------------------------------------------- frame
    // Four stout block legs with a low H-stretcher, tied by the apron rails.
    const leg = (sx: number, sz: number) =>
      sdf.box([LEG, 0.72, LEG], 0.018).at(sx * LEG_X, 0.36, sz * LEG_Z);
    const frame = sdf
      .smoothUnion(
        0.014,
        leg(1, 1),
        leg(-1, 1),
        leg(1, -1),
        leg(-1, -1),
        // Front and back apron rails carry the drawer.
        sdf.box([0.87, APRON_H, STRETCH], 0.012).at(0, APRON_Y, LEG_Z),
        sdf.box([0.87, APRON_H, STRETCH], 0.012).at(0, APRON_Y, -LEG_Z),
        // Side apron rails.
        sdf.box([STRETCH, APRON_H, 0.4], 0.012).at(LEG_X, APRON_Y, 0),
        sdf.box([STRETCH, APRON_H, 0.4], 0.012).at(-LEG_X, APRON_Y, 0),
        // Low H-stretcher: two side rails joined by one centre rail.
        sdf.box([STRETCH, STRETCH, 0.4], 0.012).at(LEG_X, STRETCH_Y, 0),
        sdf.box([STRETCH, STRETCH, 0.4], 0.012).at(-LEG_X, STRETCH_Y, 0),
        sdf.box([0.87, STRETCH, STRETCH], 0.012).at(0, STRETCH_Y, 0),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    k.body('frame', frame.paintFn(framePaint), {
      color: '#8a5a35',
      roughness: 0.85,
      metalness: 0,
      detail: 0.0125,
      bump: (x, y, z) => 0.0012 * (noise.fbm(x * 16, y * 5, z * 16, 2) - 0.5),
    });

    // ----------------------------------------------------- drawer + pale pegs
    const drawer = sdf.box([0.42, 0.1, 0.024], 0.007).at(0, APRON_Y, LEG_Z + STRETCH / 2 + 0.012);
    k.body('drawer', drawer.paintFn(drawerPaint), {
      color: '#c9a06a',
      roughness: 0.8,
      metalness: 0,
      detail: 0.009,
      textureDensity: 2,
    });

    // Round pale peg studs where the rails meet each leg (the mock's signature dots).
    const pegs: ReturnType<typeof sdf.sphere>[] = [];
    for (const sx of [1, -1]) {
      for (const sz of [1, -1]) {
        for (const y of [0.075, 0.6]) {
          pegs.push(sdf.sphere(0.018).at(sx * (LEG_X + LEG / 2), y, sz * LEG_Z));
        }
      }
    }
    k.body('pegs', sdf.union(...pegs), {
      color: '#c9a06a',
      roughness: 0.8,
      metalness: 0,
      detail: 0.015,
    });

    // ----------------------------------------------------------------- metal
    // Ink pot, candle saucer, and drawer knob share one pewter body.
    const potProfile = profile.polygon(
      [
        [0.0, 0.0],
        [0.048, 0.0],
        [0.055, 0.022],
        [0.05, 0.05],
        [0.03, 0.066],
        [0.028, 0.085],
        [0.037, 0.096],
        [0.03, 0.102],
        [0.0, 0.102],
      ],
      { smooth: true, samples: 10 },
    );
    const pot = sdf.revolve(potProfile).at(POT.x, H, POT.z);
    const saucer = sdf.smoothUnion(
      0.004,
      sdf.cylinder(0.052, 0.008, 0.002).at(CANDLE.x, H + 0.004, CANDLE.z),
      sdf.torus(0.048, 0.006).at(CANDLE.x, H + 0.012, CANDLE.z),
    );
    const knob = sdf.smoothUnion(
      0.004,
      sdf.cylinder(0.012, 0.022, 0.004).rotateX(90).at(0, APRON_Y, LEG_Z + 0.035),
      sdf.sphere(0.016).at(0, APRON_Y, LEG_Z + 0.052),
    );
    const metal = sdf.union(pot, saucer, knob);
    const metalPaint = (x: number, y: number, z: number) => {
      // Ink sits dark inside the pot neck.
      const r = Math.hypot(x - POT.x, z - POT.z);
      if (y > H + 0.07 && r < 0.03) return INK;
      let c = PEWTER;
      const t = 0.5 + 0.5 * noise.fbm(x * 30, y * 30, z * 30, 2);
      c = mixRgb(c, PEWTER_DEEP, 0.45 * t);
      c = mixRgb(c, IRON, 0.5 * clamp01((H + 0.05 - y) / 0.06));
      // Bright worn lip where hands touch the pot and the knob.
      const lip = clamp01((y - (H + 0.09)) / 0.012);
      c = mixRgb(c, WAX, 0.35 * lip);
      const knobShine = 1 - clamp01((Math.hypot(x, y - APRON_Y, z - (LEG_Z + 0.05)) - 0.012) / 0.02);
      c = mixRgb(c, WAX, 0.3 * clamp01(knobShine));
      return c;
    };
    k.body('metal', metal.paintFn(metalPaint), {
      color: '#9aa3ad',
      roughness: 0.4,
      metalness: 0.8,
      detail: 0.0085,
      textureDensity: 2,
      bump: (x, y, z) => 0.0007 * (noise.fbm(x * 60, y * 60, z * 60, 2) - 0.5),
    });

    // ------------------------------------------------------------------ book
    // Open book: leather cover, a block of pages with a gutter notch, a red bookmark.
    const cover = sdf.box([0.37, 0.02, 0.28], 0.006).at(BOOK_X, H + 0.01, BOOK_Z);
    k.body('book-cover', cover.paintFn((x, y, z) => {
      let c = WALNUT_DEEP;
      const grain = 0.5 + 0.5 * noise.fbm(x * 26, y * 10, z * 26, 2);
      c = mixRgb(c, WALNUT_SHADOW, 0.4 * grain);
      const edge = 1 - clamp01((Math.min(0.185 - Math.abs(x - BOOK_X), 0.14 - Math.abs(z - BOOK_Z))) / 0.01);
      c = mixRgb(c, HONEY, 0.4 * clamp01(edge));
      return c;
    }), { color: '#6b4226', roughness: 0.6, metalness: 0, detail: 0.008, textureDensity: 2 });

    // Page block, then a V gutter cut along its length.
    const gutter = sdf
      .extrude(
        profile.polygon([
          [-0.05, 0.06],
          [0.05, 0.06],
          [0.0, 0.0],
        ]),
        0.3,
      )
      .at(BOOK_X, H + 0.05, BOOK_Z);
    const pages = sdf
      .box([0.33, 0.062, 0.26], 0.008)
      .at(BOOK_X, H + 0.05, BOOK_Z)
      .subtract(gutter);
    k.body('book-pages', pages.paintFn((x, y, z) => {
      let c = PAGE;
      const v = y / 0.0045;
      const f = v - Math.floor(v);
      const line = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * f), 8);
      c = mixRgb(c, PAGE_LINE, 0.4 * line);
      const gutterShade = clamp01((0.055 - Math.abs(x - BOOK_X)) / 0.055);
      c = mixRgb(c, PAGE_SHADOW, 0.5 * gutterShade);
      const stain = Math.max(0, noise.fbm(x * 18, y * 18, z * 18, 2));
      c = mixRgb(c, PAGE_LINE, 0.18 * stain);
      return c;
    }), { color: '#f0e4cc', roughness: 0.9, metalness: 0, detail: 0.005, textureDensity: 2 });

    const bookmark = sdf
      .box([0.05, 0.005, 0.17], 0.002)
      .rotateX(-5)
      .at(BOOK_X + 0.06, H + 0.005, BOOK_Z + 0.2);
    k.body('bookmark', bookmark, {
      color: CLOTH,
      roughness: 0.85,
      metalness: 0,
      detail: 0.005,
      textureDensity: 2,
    });

    // ------------------------------------------------------------------ quill
    // Built along +Y at its base, then leaned out of the ink pot. Tall enough to
    // break the silhouette and read at 128 px.
    const feather = sdf
      .smoothUnion(
        0.01,
        sdf.ellipsoid([0.034, 0.1, 0.008]).at(0, 0.2, 0),
        sdf.ellipsoid([0.016, 0.05, 0.006]).at(0.004, 0.285, 0),
      );
    const quill = sdf.smoothUnion(
      0.004,
      sdf.cone([0, 0, 0], [0, 0.31, 0], 0.008, 0.005),
      feather,
    );
    k.body('quill', quill.paintFn((x, y, z, base) => {
      let c = base;
      const m = 0.5 + 0.5 * noise.fbm(x * 40, y * 90, z * 40, 2);
      c = mixRgb(c, HONEY_PALE, 0.25 * m);
      // Warm base where the shaft leaves the ink.
      c = mixRgb(c, PAGE_SHADOW, 0.5 * clamp01((0.06 - y) / 0.06));
      return c;
    }).rotateZ(-18).rotateX(-11).at(POT.x, H + 0.07, POT.z), {
      color: '#f0e4cc',
      roughness: 0.8,
      metalness: 0,
      detail: 0.007,
      textureDensity: 2,
    });

    // ----------------------------------------------------------------- candle
    const wax = sdf
      .smoothUnion(
        0.008,
        sdf.cylinder(0.03, 0.075, 0.006).at(CANDLE.x, H + 0.0455, CANDLE.z),
        sdf.torus(0.027, 0.005).at(CANDLE.x, H + 0.078, CANDLE.z),
      );
    k.body('wax', wax.paintFn((x, y, z, base) => {
      let c = base;
      const t = clamp01((y - (H + 0.02)) / 0.06);
      c = mixRgb(c, WAX_DEEP, 0.4 * (1 - t));
      const m = 0.5 + 0.5 * noise.fbm(x * 60, y * 40, z * 60, 2);
      c = mixRgb(c, WAX_DEEP, 0.18 * m);
      return c;
    }), { color: '#f0e4cc', roughness: 0.55, metalness: 0, detail: 0.006, textureDensity: 2 });

    const wick = sdf.cone([CANDLE.x, H + 0.08, CANDLE.z], [CANDLE.x, H + 0.108, CANDLE.z], 0.005, 0.0032);
    k.body('wick', wick, { color: '#241a10', roughness: 0.8, metalness: 0, detail: 0.003 });

    // Teardrop flame: dark base under an orange glow (never bright plain paint).
    const flame = sdf.smoothUnion(
      0.008,
      sdf.sphere(0.017).at(CANDLE.x, H + 0.127, CANDLE.z),
      sdf.sphere(0.009).at(CANDLE.x, H + 0.15, CANDLE.z),
    );
    k.body('flame', flame, {
      color: '#4a1405',
      roughness: 0.4,
      metalness: 0,
      emissive: FLAME,
      emissiveIntensity: 1.8,
      detail: 0.007,
    });
  },
});
