import { defineAsset, mixRgb, noise, rgb, sdf, type Rgb } from '../src/index.js';

/**
 * Design note
 * Role: open village market tent, a background landmark that must read at 128 px.
 * Size: 2.2 m wide (X), 1.6 m deep (Z), 2.2 m tall; stands on y = 0, faces +Z.
 * One idea: a peaked cream-and-faded-red canvas roof with a scalloped valance,
 *   held on four chunky poles over a low trestle of baskets and cloth bolts.
 * Shape language: triangular roof (dominant), square wood (secondary), round goods.
 * Palette: cream #efe2c0 and faded red #b8584a (dominant); honey oak #b5814a,
 *   warm brown #8a5a35, walnut #6b4226 (secondary); straw #e0bb60, leaf #5cb85c,
 *   iron #4a4f55 (accents). Light roof, mid wood, dark feet and iron.
 * Materials: canvas cloth 0.88, wood 0.82, wicker 0.8, produce 0.55, iron 0.5 / 0.7.
 * Detail: roof + valance + poles (primary), trestle and goods (secondary),
 *   grain and weave in bump (tertiary). Focal point: the striped peak and valance.
 * Rig: none.
 */

const CREAM = rgb('#efe2c0');
const CREAM_SHADE = rgb('#cbb892');
const RED = rgb('#b8584a');
const RED_SHADE = rgb('#8a3c34');
const OAK = rgb('#b5814a');
const OAK_PALE = rgb('#c9a06a');
const BROWN = rgb('#8a5a35');
const WALNUT = rgb('#6b4226');
const FOOT = rgb('#3d2414');
const STRAW = rgb('#e0bb60');
const STRAW_DARK = rgb('#a07c38');
const STRAW_LIGHT = rgb('#f0d488');
const BURLAP = rgb('#c8a86b');
const LEAF = rgb('#5cb85c');
const LEAF_DARK = rgb('#3d7a35');
const LEAF_LIGHT = rgb('#8ed17a');
const IRON = rgb('#4a4f55');
const IRON_DARK = rgb('#363a3f');
const IRON_HI = rgb('#a8acb1');

const DEG = Math.PI / 180;

// Ridge along X. Eaves stay inside z = ±0.78 so the valance lands on a 1.6 m depth.
const ROOF_W = 2.04;
const HALF_RUN = 0.7;
const PEAK_Y = 2.08;
const EAVE_Y = 1.38;
const RISE = PEAK_Y - EAVE_Y;
const PITCH = Math.atan2(RISE, HALF_RUN) / DEG;
const SLOPE_LEN = Math.hypot(HALF_RUN, RISE) + 0.05;
const THICK = 0.05;
const Y_MID = (PEAK_Y + EAVE_Y) / 2;
const Z_MID = HALF_RUN / 2;
const SIN = Math.sin(PITCH * DEG);
const COS = Math.cos(PITCH * DEG);
const HD = SLOPE_LEN / 2;

const EAVE_FRONT_Y = Y_MID - HD * SIN + (THICK / 2) * COS;
const EAVE_FRONT_Z = Z_MID + HD * COS + (THICK / 2) * SIN;

const POLE_X = 0.74;
const POLE_Z = 0.48;
const POLE_T = 0.12;
const POLE_TOP = 1.56;

const TABLE_Y = 0.66;
const TABLE_Z = 0.02;
const TABLE_HW = 0.64;
const TABLE_HD = 0.25;

const STRIPE = ROOF_W / 7;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Soft candy stripes across the roof width. The center stripe is faded red. */
const stripeAt = (x: number): Rgb => {
  const m = (x + ROOF_W / 2) / STRIPE;
  const s = Math.floor(m);
  const f = m - s;
  const even = ((s % 2) + 2) % 2 === 0;
  const base = even ? CREAM : RED;
  const other = even ? RED : CREAM;
  const edge = 0.016 / STRIPE;
  const d = Math.min(f, 1 - f);
  return mixRgb(other, base, d >= edge ? 1 : d / edge);
};

const canvasPaint = (x: number, y: number, z: number): Rgb => {
  let c = stripeAt(x);
  const n = noise.fbm(x * 2.4, y * 2.2, z * 2.4, 2);
  const shade = c[0] > 0.7 ? CREAM_SHADE : RED_SHADE;
  c = mixRgb(c, shade, 0.08 + 0.1 * (0.5 + 0.5 * n));
  c = mixRgb(c, shade, 0.16 * clamp01((1.28 - y) / 0.16));
  return c;
};

const woodGrain = (x: number, y: number, z: number, base: Rgb): Rgb => {
  const g = noise.fbm(x * 5, y * 1.4, z * 7, 2);
  const dark = mixRgb(base, WALNUT, 0.55);
  let c = mixRgb(base, dark, 0.1 + 0.22 * (0.5 + 0.5 * g));
  c = mixRgb(c, OAK_PALE, 0.08 * Math.max(0, g));
  if (y < 0.1) c = mixRgb(c, FOOT, 0.55 * (1 - y / 0.1));
  return c;
};

/** A sloped canvas slab. Positive pitch lowers the +Z edge. */
const slope = (pitch: number, z: number) =>
  sdf.box([ROOF_W, THICK, SLOPE_LEN], 0.018).rotateX(pitch).at(0, Y_MID, z);

/** Scalloped valance hanging from an eave. `zSign` is +1 at the front. */
const valance = (y: number, z: number, zSign: number) => {
  const span = 1.82;
  const lobes = 7;
  const strip = sdf.box([span, 0.11, 0.048], 0.016).at(0, y - 0.045, z + zSign * 0.008);
  const discs = Array.from({ length: lobes }, (_, i) => {
    const x = -span / 2 + (i + 0.5) * (span / lobes);
    return sdf
      .cylinder(0.125, 0.048, 0.012)
      .rotateX(90)
      .at(x, y - 0.12, z + zSign * 0.01);
  });
  return sdf.smoothUnion(0.016, strip, ...discs);
};

/** Canvas tip that curls up at an eave corner, inside the 2.2 m width. */
const cornerCurl = (x: number, z: number) => {
  const sx = Math.sign(x) || 1;
  const sz = Math.sign(z) || 1;
  const root: [number, number, number] = [x * 0.96, EAVE_FRONT_Y - 0.01, z * 0.98];
  const tip: [number, number, number] = [x + sx * 0.032, EAVE_FRONT_Y + 0.22, z + sz * 0.018];
  return sdf.smoothUnion(
    0.016,
    sdf.capsule(root, tip, 0.036),
    sdf.sphere(0.044).at(tip[0], tip[1] + 0.01, tip[2]),
  );
};

const postAt = (x: number, z: number) =>
  sdf.smoothUnion(
    0.016,
    sdf.box([POLE_T, POLE_TOP - 0.04, POLE_T], 0.02).at(x, (POLE_TOP - 0.04) / 2 + 0.02, z),
    sdf.box([POLE_T + 0.07, 0.08, POLE_T + 0.07], 0.02).at(x, 0.04, z),
    sdf.box([POLE_T + 0.035, 0.045, POLE_T + 0.035], 0.014).at(x, POLE_TOP - 0.02, z),
  );

/** A-frame trestle. Capsule feet sit on y = 0 and do not dig in. */
const trestleAt = (x: number) => {
  const leg = (sz: number) =>
    sdf.capsule([x, 0.03, TABLE_Z + sz * 0.2], [x, 0.62, TABLE_Z + sz * 0.04], 0.028);
  return sdf.smoothUnion(
    0.012,
    leg(1),
    leg(-1),
    sdf.box([0.05, 0.04, 0.32], 0.012).at(x, 0.28, TABLE_Z),
    sdf.box([0.065, 0.038, 0.14], 0.012).at(x, 0.62, TABLE_Z),
  );
};

/** Hollow bowl with a fat lip. No torus, so the mesh stays light. */
const basketAt = (x: number, z: number, r: number, h: number) => {
  const y0 = TABLE_Y;
  const outer = sdf.cylinder(r, h, 0.016).at(x, y0 + h / 2, z);
  const cavity = sdf.cylinder(r - 0.03, h * 0.85, 0.008).at(x, y0 + h * 0.62, z);
  const lip = sdf.cylinder(r + 0.012, 0.03, 0.01).at(x, y0 + h - 0.016, z);
  return outer.subtract(cavity).smoothUnion(0.01, lip);
};

const weavePaint = (cx: number, cz: number) => (x: number, y: number, z: number) => {
  const a = Math.atan2(z - cz, x - cx);
  const row = 0.5 + 0.5 * Math.sin((y - TABLE_Y) * 70);
  const stitch = 0.5 + 0.5 * Math.sin(a * 8 + y * 5);
  const brick = row * (0.55 + 0.45 * stitch);
  let c = mixRgb(STRAW, STRAW_DARK, 0.62 * (1 - brick));
  c = mixRgb(c, STRAW_LIGHT, 0.18 * brick);
  c = mixRgb(c, BURLAP, 0.1 * (0.5 + 0.5 * noise.noise3(x * 8, y * 8, z * 8)));
  return c;
};

export default defineAsset({
  name: 'market-tent',
  description:
    'Open market tent: four wooden poles hold a peaked cream and faded-red canvas roof with a scalloped valance, over a low trestle table of baskets and cloth bolts.',
  reference: 'docs/item-mockups/market-tent-mock.jpg',
  detail: 0.014,
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ canvas roof
    const roof = sdf.smoothUnion(
      0.026,
      slope(PITCH, Z_MID),
      slope(-PITCH, -Z_MID),
      sdf.cylinder(0.042, ROOF_W - 0.06, 0.014).rotateZ(90).at(0, PEAK_Y + 0.01, 0),
    );
    const frontVal = valance(EAVE_FRONT_Y, EAVE_FRONT_Z, 1);
    const backVal = valance(EAVE_FRONT_Y, -EAVE_FRONT_Z, -1);
    const curls = sdf.union(
      cornerCurl(ROOF_W / 2, EAVE_FRONT_Z),
      cornerCurl(-ROOF_W / 2, EAVE_FRONT_Z),
      cornerCurl(ROOF_W / 2, -EAVE_FRONT_Z),
      cornerCurl(-ROOF_W / 2, -EAVE_FRONT_Z),
    );
    const horn = (x: number) => {
      const sx = Math.sign(x) || 1;
      return sdf.smoothUnion(
        0.016,
        sdf.capsule([x - sx * 0.04, PEAK_Y + 0.01, 0], [x, PEAK_Y + 0.06, 0], 0.03),
        sdf.sphere(0.044).at(x, PEAK_Y + 0.07, 0),
      );
    };
    const knobs = sdf.union(horn(ROOF_W / 2 - 0.06), horn(-(ROOF_W / 2 - 0.06)));
    const canvas = sdf.smoothUnion(0.018, roof, frontVal, backVal, curls, knobs).paintFn(canvasPaint);

    // Two cloth bolts and a short drape over the front edge.
    const redY = TABLE_Y + 0.058;
    const redZ = TABLE_Z + 0.08;
    const redBolt = sdf
      .cylinder(0.056, 0.32, 0.012)
      .rotateZ(90)
      .at(0.36, redY, redZ)
      .paint(RED)
      .paintFn((x, y, z, base) => {
        const core = Math.hypot(y - redY, z - redZ);
        return Math.abs(x - 0.36) > 0.132 && core < 0.032 ? CREAM : base;
      });
    const creamY = TABLE_Y + 0.05;
    const creamZ = TABLE_Z - 0.1;
    const creamBolt = sdf
      .cylinder(0.048, 0.28, 0.01)
      .rotateZ(90)
      .at(0.22, creamY, creamZ)
      .paint(CREAM)
      .paintWhere(sdf.box([0.045, 0.14, 0.14]).at(0.22, creamY, creamZ), RED);
    const drape = sdf
      .smoothUnion(
        0.012,
        sdf.box([0.18, 0.036, 0.09], 0.01).at(0.44, TABLE_Y + 0.008, TABLE_Z + 0.2),
        sdf.box([0.16, 0.14, 0.036], 0.012).at(0.44, TABLE_Y - 0.06, TABLE_Z + TABLE_HD + 0.008),
      )
      .paint(RED)
      .paintWhere(
        sdf.box([0.2, 0.036, 0.06]).at(0.44, TABLE_Y - 0.12, TABLE_Z + TABLE_HD + 0.008),
        CREAM,
      );

    k.body('canvas', sdf.union(canvas, redBolt, creamBolt, drape), {
      color: CREAM,
      roughness: 0.88,
      metalness: 0,
      detail: 0.016,
      maxTriangles: 4300,
      paintWeight: 1,
      bump: (x, y, z) => 0.0016 * noise.noise3(x * 40, y * 40, z * 40),
    });

    // ------------------------------------------------------------------ wood frame and trestle
    const posts = sdf.union(
      postAt(POLE_X, POLE_Z),
      postAt(-POLE_X, POLE_Z),
      postAt(POLE_X, -POLE_Z),
      postAt(-POLE_X, -POLE_Z),
    );
    const eaveBeam = (z: number) => sdf.box([1.64, 0.06, 0.06], 0.015).at(0, POLE_TOP - 0.02, z);
    const ridge = sdf.box([1.76, 0.055, 0.055], 0.014).at(0, 1.96, 0);
    const rafter = (x: number, z: number) =>
      sdf.capsule([x, POLE_TOP - 0.02, z * 0.92], [x * 0.98, 1.96, z * 0.05], 0.03);
    const frame = sdf
      .smoothUnion(
        0.014,
        posts,
        eaveBeam(POLE_Z),
        eaveBeam(-POLE_Z),
        ridge,
        rafter(0.86, POLE_Z),
        rafter(-0.86, POLE_Z),
        rafter(0.86, -POLE_Z),
        rafter(-0.86, -POLE_Z),
      )
      .paint(BROWN);

    const top = sdf
      .box([TABLE_HW * 2, 0.058, TABLE_HD * 2], 0.014)
      .at(0, TABLE_Y - 0.029, TABLE_Z)
      .paint(OAK)
      .paintFn((x, y, z, base) => {
        const u = (z - TABLE_Z + TABLE_HD) / 0.125;
        const f = u - Math.floor(u);
        const line = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * f), 12);
        const edge = Math.max(Math.abs(x) / TABLE_HW, Math.abs(z - TABLE_Z) / TABLE_HD);
        let c = mixRgb(base, WALNUT, 0.4 * line);
        c = mixRgb(c, OAK_PALE, 0.55 * clamp01((edge - 0.86) / 0.1));
        return c;
      });
    const trestles = sdf
      .smoothUnion(
        0.012,
        trestleAt(-0.38),
        trestleAt(0.38),
        sdf.box([0.7, 0.04, 0.042], 0.012).at(0, 0.26, TABLE_Z),
      )
      .paint(WALNUT);

    k.body('wood', sdf.union(frame, top, trestles).paintFn(woodGrain), {
      color: BROWN,
      roughness: 0.82,
      metalness: 0,
      detail: 0.014,
      maxTriangles: 2400,
      bump: (x, y, z) => 0.002 * noise.fbm(x * 9, y * 3, z * 12, 2),
    });

    // ------------------------------------------------------------------ baskets
    const b1 = basketAt(-0.34, TABLE_Z + 0.01, 0.15, 0.17).paintFn(weavePaint(-0.34, TABLE_Z + 0.01));
    const b2 = basketAt(0.0, TABLE_Z - 0.08, 0.11, 0.14).paintFn(weavePaint(0.0, TABLE_Z - 0.08));
    const handle = sdf
      .smoothUnion(
        0.01,
        sdf.capsule([-0.46, TABLE_Y + 0.15, TABLE_Z + 0.01], [-0.34, TABLE_Y + 0.34, TABLE_Z + 0.01], 0.018),
        sdf.capsule([-0.34, TABLE_Y + 0.34, TABLE_Z + 0.01], [-0.22, TABLE_Y + 0.15, TABLE_Z + 0.01], 0.018),
      )
      .paint(STRAW_DARK);
    k.body('baskets', sdf.union(b1, b2, handle), {
      color: STRAW,
      roughness: 0.8,
      metalness: 0,
      detail: 0.012,
      maxTriangles: 1100,
      textureDensity: 1.3,
      bump: (x, y) => 0.0028 * Math.sin((y - TABLE_Y) * 70),
    });

    // ------------------------------------------------------------------ greens and a few red rounds
    const mound = (x: number, y: number, z: number, rx: number, ry: number, rz: number) =>
      sdf.ellipsoid([rx, ry, rz]).at(x, y, z).paintFn((px, py, pz) => {
        const n = 0.5 + 0.5 * noise.fbm(px * 9, py * 9, pz * 9, 2);
        return mixRgb(LEAF, n > 0.55 ? LEAF_LIGHT : LEAF_DARK, 0.35);
      });
    const apple = (x: number, y: number, z: number) =>
      sdf.sphere(0.038).at(x, y, z).paintFn(() => RED);
    k.body(
      'goods',
      sdf.union(
        mound(-0.34, TABLE_Y + 0.15, TABLE_Z + 0.01, 0.1, 0.05, 0.09),
        mound(0.0, TABLE_Y + 0.12, TABLE_Z - 0.08, 0.075, 0.04, 0.065),
        apple(-0.28, TABLE_Y + 0.19, TABLE_Z + 0.05),
        apple(-0.4, TABLE_Y + 0.17, TABLE_Z - 0.02),
        apple(0.04, TABLE_Y + 0.15, TABLE_Z - 0.04),
        apple(-0.08, TABLE_Y + 0.038, TABLE_Z + 0.14),
      ),
      { color: LEAF, roughness: 0.55, metalness: 0, detail: 0.012, maxTriangles: 480 },
    );

    // Iron bands sit proud of the poles. Front pegs catch the front view.
    const band = (x: number, z: number) =>
      sdf
        .cylinder(0.086, 0.032, 0.008)
        .at(x, 1.36, z)
        .paintFn((px, py, pz) => {
          const n = 0.5 + 0.5 * noise.noise3(px * 18, py * 18, pz * 18);
          const hi = py > 1.368 ? 0.55 : 0.1;
          return mixRgb(mixRgb(IRON, IRON_HI, hi), IRON_DARK, 0.3 * n);
        });
    const peg = (x: number) =>
      sdf
        .cylinder(0.02, 0.055, 0.008)
        .rotateX(90)
        .at(x, 1.06, POLE_Z + 0.085)
        .paint(IRON_DARK);
    k.body(
      'iron',
      sdf.union(band(POLE_X, POLE_Z), band(-POLE_X, POLE_Z), band(POLE_X, -POLE_Z), band(-POLE_X, -POLE_Z), peg(POLE_X), peg(-POLE_X)),
      { color: IRON, roughness: 0.5, metalness: 0.7, detail: 0.01, maxTriangles: 360 },
    );
  },
});
