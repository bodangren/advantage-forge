import { defineAsset, mixRgb, noise, profile, rgb, sdf, type Rgb } from '../src/index.js';

/**
 * Design note
 * Role: hamlet market stall, a background landmark prop that must read at 128 px.
 * Size: 2.45 m wide (X), 1.63 m deep (Z), 2.59 m tall (Y); stands on y = 0, faces +Z.
 * One idea: a broad candy-striped awning with a wavy scalloped fringe, over a chunky wooden
 *   counter heaped with bright market goods, with a gold-coin sign hanging in the open middle.
 * Shape language: square and sturdy wood posts, counter, and crates (dominant); soft round
 *   produce and the wavy awning edge (secondary).
 * Palette: awning cream #f4ecdc + coral #d9543f (dominant light/mid); wood #8a5a30, dark #55341b
 *   (secondary mid/dark); focal accents: apple #c0342b, bread #e0ad63, melon #5f9b3f,
 *   cheese #f2c14e, glazed pot #2fb5a9, sign gold #e0b94a.
 * Materials: cloth awning (0.85), wood (0.82), crate wood (0.78), produce (0.55), bread (0.7),
 *   cheese (0.5), glazed pot (0.3, metalness 0.1).
 * Detail: primary awning + four posts + counter; secondary crates + valance; tertiary goods.
 *   Focal point: the goods on the counter.
 * Rig: none.
 */

const DEG = Math.PI / 180;

// ---------------------------------------------------------------- layout
const W_HALF = 1.22; // awning half width
const POST_X = 1.02;
const POST_Z = 0.62;
const POST_T = 0.13;

const AWNING_TILT = 16; // degrees, front edge dips
const AWNING_Y = 2.34;
const AWNING_Z = 0.08;
const AWNING_T = 0.06;
const AWNING_HD = 0.82; // half depth of the slab along the slope

const TILT = AWNING_TILT * DEG;
const COS = Math.cos(TILT);
const SIN = Math.sin(TILT);
const TAN = Math.tan(TILT);

const COUNTER_TOP = 0.99; // top surface of the counter
const COUNTER_HW = 1.04; // counter half width
const COUNTER_Z = 0.26; // center of the top slab
const COUNTER_D = 0.66; // depth of the top slab

const STRIPE = 0.305; // awning stripe width

/** Mid-surface height of the sloped awning at a world z. */
const awningYAt = (z: number) => AWNING_Y - (z - AWNING_Z) * TAN;

// Top-front corner of the awning: where the valance hangs.
const frontEdgeY = AWNING_Y - AWNING_HD * SIN + (AWNING_T / 2) * COS;
const frontEdgeZ = AWNING_Z + AWNING_HD * COS + (AWNING_T / 2) * SIN;

// Post tops stop just inside the awning slab: no gap under it, and no poke through its top.
const postFrontTop = awningYAt(POST_Z) - 0.006;
const postBackTop = awningYAt(-POST_Z) - 0.006;

const C = {
  awningA: rgb('#f4ecdc'),
  awningB: rgb('#d9543f'),
  wood: rgb('#8a5a30'),
  woodDark: rgb('#55341b'),
  woodLight: rgb('#b07a45'),
  crate: rgb('#b5813f'),
  crateDark: rgb('#7a4f22'),
  bread: rgb('#e0ad63'),
  breadDark: rgb('#9a6329'),
  apple: rgb('#c0342b'),
  appleDark: rgb('#7d1f1c'),
  melon: rgb('#5f9b3f'),
  melonLight: rgb('#8cbf5a'),
  melonDark: rgb('#33641f'),
  cheese: rgb('#f2c14e'),
  cheeseDark: rgb('#c8922e'),
  pot: rgb('#2fb5a9'),
  potDark: rgb('#1a7a72'),
  herb: rgb('#4f8a3a'),
};

// ---------------------------------------------------------------- paint helpers

/** Soft-edged candy stripes across the awning width. */
const stripePaint = (x: number): Rgb => {
  const m = (x + W_HALF) / STRIPE;
  const s = Math.floor(m);
  const f = m - s;
  const even = Math.abs(s) % 2 === 0;
  const base = even ? C.awningA : C.awningB;
  const other = even ? C.awningB : C.awningA;
  const edge = 0.02 / STRIPE;
  const d = Math.min(f, 1 - f);
  return mixRgb(other, base, d >= edge ? 1 : d / edge);
};

/** Vertical wood grain, a little darker at the base. */
const woodPaint =
  (base: Rgb, dark: Rgb, light: Rgb) => (x: number, y: number, z: number) => {
    const grain = 0.5 + 0.5 * noise.noise3(x * 18, y * 3.5, z * 18);
    const baseDark = mixRgb(base, dark, 0.12 + 0.32 * grain);
    return mixRgb(baseDark, light, Math.max(0, (y - 1.4) / 1.4) * 0.18);
  };

// ---------------------------------------------------------------- reusable parts

/** A tapered wooden post with a plinth and a capital, from the ground to `top`. */
const postAt = (x: number, z: number, top: number) =>
  sdf.smoothUnion(
    0.02,
    sdf.box([POST_T, top - 0.02, POST_T], 0.022).at(x, top / 2, z),
    sdf.box([POST_T + 0.08, 0.1, POST_T + 0.08], 0.028).at(x, 0.05, z),
    sdf.box([POST_T + 0.05, 0.06, POST_T + 0.05], 0.02).at(x, top - 0.025, z),
  );

/** A slatted crate sitting with its base at (x, z) and its bottom on `bottom`. */
const crateAt = (x: number, bottom: number, z: number, w: number, h: number, d: number, seed: number) => {
  const cy = bottom + h / 2;
  const body = sdf
    .smoothUnion(
      0.012,
      sdf.box([w, h, d], 0.022).at(x, cy, z),
      sdf.box([w + 0.045, 0.055, d + 0.045], 0.02).at(x, bottom + h - 0.02, z),
      sdf.box([w + 0.035, 0.05, d + 0.035], 0.02).at(x, bottom + 0.022, z),
    );
  return body.paintFn((px, py, pz) => {
    const slat = py / 0.082;
    const f = slat - Math.floor(slat);
    const tint = noise.random(Math.floor(slat), seed);
    const grain = 0.5 + 0.5 * noise.noise3(px * 26, py * 4, pz * 26);
    const c = mixRgb(C.crate, C.crateDark, 0.1 + 0.3 * tint + 0.22 * grain);
    return f < 0.09 ? C.crateDark : c;
  });
};

const appleAt = (x: number, y: number, z: number) =>
  sdf.sphere(0.058).at(x, y, z).paintFn((px, py, pz) => {
    const t = 0.5 + 0.5 * noise.fbm(px * 12, py * 12, pz * 12, 2);
    return mixRgb(C.apple, C.appleDark, 0.1 + 0.32 * t);
  });

const leafAt = (x: number, y: number, z: number) =>
  sdf.ellipsoid([0.03, 0.012, 0.05]).rotateX(-30).at(x, y, z).paint(C.herb);

/** A crusty loaf: an elongated ellipsoid with diagonal slashes. */
const loafAt = (x: number, y: number, z: number, rot: number, seed: number) =>
  sdf
    .ellipsoid([0.075, 0.058, 0.072])
    .elongate(0.05, 0, 0)
    .paintFn((px, py, pz) => {
      const g = px * 4 + pz * 11 + py * 2;
      const f = g - Math.floor(g);
      const crust = 0.5 + 0.5 * noise.noise3(px * 16, py * 16, pz * 16);
      const c = mixRgb(C.bread, C.breadDark, 0.12 + 0.3 * crust + 0.12 * noise.random(seed, 4));
      return f < 0.2 ? C.breadDark : c;
    })
    .rotateY(rot)
    .at(x, y, z);

export default defineAsset({
  name: 'shop-stall',
  description:
    'Chunky market stall: four wooden posts carry a broad candy-striped awning with a scalloped fringe over a counter heaped with crates, fruit, bread, and cheese.',
  detail: 0.012,
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ awning + valance
    const slab = sdf
      .box([2 * W_HALF, AWNING_T, 2 * AWNING_HD], 0.022)
      .rotateX(AWNING_TILT)
      .at(0, AWNING_Y, AWNING_Z);
    // Scalloped fringe: a strip plus a row of overlapping round lobes at its lower edge.
    const strip = sdf.box([2 * W_HALF, 0.15, 0.042], 0.018).at(0, frontEdgeY - 0.075, frontEdgeZ);
    const LOBES = 12;
    const lobes = Array.from({ length: LOBES }, (_, i) =>
      sdf
        .cylinder(0.108, 0.042, 0.01)
        .rotateX(90)
        .at(-W_HALF + (i + 0.5) * ((2 * W_HALF) / LOBES), frontEdgeY - 0.15, frontEdgeZ),
    );
    const awning = sdf.smoothUnion(0.012, slab, strip, ...lobes).paintFn((x) => stripePaint(x));
    k.body('awning', awning, {
      color: C.awningA,
      roughness: 0.85,
      detail: 0.016,
      bump: (x, y, z) => 0.0016 * noise.noise3(x * 55, y * 55, z * 55),
    });

    // ------------------------------------------------------------------ posts and counter
    const posts = sdf
      .union(
        postAt(POST_X, POST_Z, postFrontTop),
        postAt(-POST_X, POST_Z, postFrontTop),
        postAt(POST_X, -POST_Z, postBackTop),
        postAt(-POST_X, -POST_Z, postBackTop),
      )
      .paintFn(woodPaint(C.wood, C.woodDark, C.woodLight))
      // Damp, dark footings ground the posts and add the palette's darkest value.
      .paintWhere(sdf.box([3, 0.16, 3]).at(0, 0.08, 0), rgb('#33200f'), 0.012);
    k.body('posts', posts, {
      color: C.wood,
      roughness: 0.82,
      detail: 0.014,
      bump: (x, y, z) => 0.002 * noise.fbm(x * 22, y * 3, z * 22, 2),
    });

    const counter = sdf
      .smoothUnion(
        0.016,
        sdf.box([2 * COUNTER_HW, 0.08, COUNTER_D], 0.024).at(0, COUNTER_TOP - 0.04, COUNTER_Z),
        sdf
          .box([2 * COUNTER_HW, 0.91, 0.06], 0.014)
          .at(0, 0.455, COUNTER_Z + COUNTER_D / 2 - 0.03),
        sdf.box([0.1, 0.91, 0.1], 0.016).at(0.95, 0.455, -0.03),
        sdf.box([0.1, 0.91, 0.1], 0.016).at(-0.95, 0.455, -0.03),
      )
      .paintFn((x, y, z) => {
        const grain = 0.5 + 0.5 * noise.noise3(x * 24, y * 5, z * 24);
        let c = mixRgb(C.wood, C.woodDark, 0.14 + 0.3 * grain);
        if (z > 0.5) {
          const p = (x + COUNTER_HW) / 0.26;
          const pi = Math.floor(p);
          const f = p - pi;
          c = mixRgb(c, C.woodDark, 0.1 + 0.28 * noise.random(pi, 7));
          if (f < 0.07) c = C.woodDark;
        }
        // Darker toward the ground so the counter reads as one solid mass with a shadowed base.
        const depth = Math.max(0, 1 - y / 0.28);
        return mixRgb(c, rgb('#2c1c0e'), depth * 0.6);
      });
    k.body('counter', counter, {
      color: C.wood,
      roughness: 0.82,
      detail: 0.013,
      bump: (x, y, z) => 0.002 * noise.fbm(x * 26, y * 4, z * 26, 2),
    });

    // ------------------------------------------------------------------ crates (background mass)
    const crates = sdf.union(
      crateAt(-0.78, COUNTER_TOP, -0.05, 0.42, 0.26, 0.34, 3),
      crateAt(0.78, COUNTER_TOP, -0.05, 0.4, 0.28, 0.32, 8),
    );
    k.body('crates', crates, {
      color: C.crate,
      roughness: 0.78,
      detail: 0.012,
      bump: (x, y, z) => 0.002 * noise.fbm(x * 30, y * 6, z * 30, 2),
    });

    // ------------------------------------------------------------------ display boards
    // A shallow tray and a bread board lift the goods off the counter and frame the focal point.
    const tray = sdf
      .box([0.54, 0.1, 0.4], 0.022)
      .subtract(sdf.box([0.46, 0.18, 0.33]).at(0, 0.07, 0))
      .at(-0.58, COUNTER_TOP + 0.05, 0.38);
    const board = sdf.box([0.58, 0.045, 0.4], 0.016).at(0.6, COUNTER_TOP + 0.022, 0.36);
    k.body('boards', sdf.union(tray, board).paintFn(woodPaint(C.wood, C.woodDark, C.wood)), {
      color: C.woodLight,
      roughness: 0.8,
      detail: 0.01,
      bump: (x, y, z) => 0.002 * noise.fbm(x * 30, y * 6, z * 30, 2),
    });

    // ------------------------------------------------------------------ goods (focal point)
    const apples = sdf.union(
      appleAt(-0.76, COUNTER_TOP + 0.1, 0.32),
      appleAt(-0.58, COUNTER_TOP + 0.1, 0.46),
      appleAt(-0.42, COUNTER_TOP + 0.1, 0.34),
      appleAt(-0.68, COUNTER_TOP + 0.12, 0.4),
      appleAt(-0.5, COUNTER_TOP + 0.18, 0.39),
      appleAt(-0.14, COUNTER_TOP + 0.07, 0.46),
      appleAt(0.3, COUNTER_TOP + 0.07, 0.46),
      leafAt(-0.5, COUNTER_TOP + 0.25, 0.39),
    );
    k.body('apples', apples, {
      color: C.apple,
      roughness: 0.5,
      detail: 0.009,
      textureDensity: 1.5,
    });

    const loaves = sdf.union(
      loafAt(0.44, COUNTER_TOP + 0.11, 0.3, 20, 1),
      loafAt(0.6, COUNTER_TOP + 0.12, 0.42, -16, 2),
      loafAt(0.74, COUNTER_TOP + 0.1, 0.32, 44, 3),
    );
    k.body('loaves', loaves, {
      color: C.bread,
      roughness: 0.7,
      detail: 0.009,
      textureDensity: 1.5,
    });

    const melon = sdf
      .sphere(0.11)
      .at(0.02, COUNTER_TOP + 0.115, 0.4)
      .paintFn((px, _py, pz) => {
        const s = Math.sin(Math.atan2(pz, px) * 9);
        if (s > 0.35) return C.melonDark;
        if (s < -0.6) return C.melonLight;
        return C.melon;
      });
    k.body('melon', melon, { color: C.melon, roughness: 0.55, detail: 0.01 });

    // A cheese wheel sits on the right crate, a bright yellow note at the top of the display.
    const cheese = sdf
      .cylinder(0.11, 0.1, 0.022)
      .at(0.78, COUNTER_TOP + 0.33, -0.05)
      .paintFn((px, py, pz) => {
        const hole = noise.noise3(px * 26, py * 26, pz * 26);
        const rind = py < COUNTER_TOP + 0.3 ? 0.5 : 0;
        return mixRgb(C.cheese, C.cheeseDark, Math.min(1, rind + 0.55 * Math.max(0, hole)));
      });
    k.body('cheese', cheese, { color: C.cheese, roughness: 0.5, detail: 0.01 });

    // ------------------------------------------------------------------ hanging shop sign
    // A small board hangs from the awning into the open middle, a bright focal point at 128 px.
    const signY = 1.62;
    const signZ = 0.78;
    const sign = sdf
      .box([0.42, 0.3, 0.05], 0.022)
      .at(0, signY, signZ)
      .paintFn(woodPaint(C.wood, C.woodDark, C.wood))
      .paintWhere(sdf.cylinder(0.097, 0.3).rotateX(90).at(0, signY, signZ), rgb('#8a6a1f'), 0.005)
      .paintWhere(sdf.cylinder(0.074, 0.3).rotateX(90).at(0, signY, signZ), rgb('#e0b94a'), 0.005);
    k.body('sign', sign, { color: C.wood, roughness: 0.8, detail: 0.008, textureDensity: 1.5 });

    const ropes = sdf.union(
      sdf.capsule([-0.15, signY + 0.15, signZ], [-0.15, 2.13, signZ], 0.012),
      sdf.capsule([0.15, signY + 0.15, signZ], [0.15, 2.13, signZ], 0.012),
    );
    k.body('sign-rope', ropes, { color: '#d8b87e', roughness: 0.92, detail: 0.006 });

    // A glazed teal pot with a herb sprig gives the composition its color accent.
    const potProfile = profile.polygon(
      [
        [0, 0],
        [0.075, 0],
        [0.088, 0.03],
        [0.1, 0.15],
        [0.112, 0.185],
        [0.084, 0.185],
        [0.076, 0.16],
        [0.07, 0.05],
        [0, 0.05],
      ],
      { smooth: true },
    );
    const pot = sdf
      .revolve(potProfile)
      .scale(1.18)
      .at(0.92, COUNTER_TOP, 0.32)
      .paintFn((px, py, _pz) => {
        const glaze = 0.5 + 0.5 * noise.noise3(px * 20, py * 20, 0);
        return mixRgb(C.pot, C.potDark, 0.18 + 0.34 * glaze);
      });
    k.body('pot', pot, { color: C.pot, roughness: 0.3, metalness: 0.1, detail: 0.009 });

    const herb = sdf
      .ellipsoid([0.095, 0.08, 0.095])
      .at(0.92, COUNTER_TOP + 0.235, 0.32)
      .displace(0.012, (x, y, z) => noise.fbm(x * 22, y * 22, z * 22, 2))
      .paintFn((px, py, pz) => {
        const t = 0.5 + 0.5 * noise.fbm(px * 16, py * 16, pz * 16, 2);
        return mixRgb(C.herb, rgb('#2f5a2a'), 0.15 + 0.35 * t);
      });
    k.body('herb', herb, { color: C.herb, roughness: 0.8, detail: 0.009 });
  },
});
