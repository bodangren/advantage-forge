import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — raised garden bed (architecture/landscape-parts/garden-bed).
 *
 * Role: village landscape prop for cozy chibi hamlets; must read at 128 px.
 * Size: 2.0 m x 1.0 m, plank walls 0.25 m tall; stands on y = 0, faces +Z.
 * One idea: a tidy chunky planter box — four fat corner posts rising above two
 *   courses of planks, full of dark earth, bright tufts and carrot tops.
 * Shape language: round chunky dominant (soft bevels everywhere), square secondary.
 * Palette: honey oak #b5814a walls (60), dark soil #5a3a24 (30), leaf green
 *   #5cb85c tufts + orange #e0762e carrots (10 accent), iron #4a4f55 bolts.
 * Materials: wood (rough 0.8), soil (rough 0.95), leaf (rough 0.62),
 *   carrot (rough 0.5), worn iron (rough 0.5, metal 0.7).
 * Detail: primary box + posts + soil; secondary plank courses, bolts, tufts,
 *   carrots; tertiary grain, clods, cut-wood tops. Focal point: green tufts
 *   against dark soil inside the warm frame.
 * Rig/animation: none (static prop).
 */

const W = 2.0; // outer width (X)
const D = 1.0; // outer depth (Z)
const H = 0.25; // plank wall top
const POST = 0.16; // corner post thickness
const POST_H = 0.31; // posts rise above the planks
const COURSE_H = 0.115; // one plank course
const GAP = 0.012; // shadow gap between courses
const PLANK_T = 0.055; // plank thickness
const SOIL_TOP = 0.205;
const BOLT_Y = 0.2;

const wood = rgb('#b5814a');
const woodWarm = rgb('#8a5a35');
const woodCut = rgb('#c9a06a');
const woodDark = rgb('#6b4226');

const soilC = rgb('#5a3a24');
const soilDark = rgb('#3f2716');
const soilLight = rgb('#6f4c2e');

const leaf = rgb('#5cb85c');
const leafDark = rgb('#3c7a3d');
const leafLight = rgb('#86d47e');

const carrotC = rgb('#e0762e');
const carrotDark = rgb('#b3541e');

const ironC = rgb('#4a4f55');

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

// Soil surface: low clods plus fine grain (form via displace, rest via bump).
const soilBump = (x: number, y: number, z: number) =>
  0.6 * noise.fbm(x * 5, y * 5, z * 5, 3, 11) + 0.4 * noise.noise3(x * 24, y * 24, z * 24, 3);

export default defineAsset({
  name: 'garden-bed',
  description:
    'A raised vegetable bed 2m x 1m: chunky corner posts, two plank courses, dark soil with leafy tufts and carrot tops.',
  detail: 0.008,
  reference: 'docs/item-mockups/garden-bed-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // -------------------------------------------------------------- wood: posts + plank courses
    // Per-part tint and grain. Long planks: grain along X; short planks: along Z;
    // posts: vertical grain and a slightly richer tint.
    const grainX = (x: number, y: number, z: number) => noise.fbm(x * 3, y * 24, z * 24, 3, 7);
    const grainZ = (x: number, y: number, z: number) => noise.fbm(x * 24, y * 24, z * 3, 3, 7);
    const grainY = (x: number, y: number, z: number) => noise.fbm(x * 24, y * 3, z * 24, 3, 7);
    const woodPaint = (kind: 'x' | 'z' | 'post', seed: number) => (x: number, y: number, z: number) => {
      const g = 0.5 + 0.5 * (kind === 'x' ? grainX : kind === 'z' ? grainZ : grainY)(x, y, z);
      const tint = noise.random(seed, 3) * 0.3;
      let c = mixRgb(wood, woodWarm, Math.min(0.8, tint + g * 0.4));
      c = mixRgb(c, woodDark, Math.max(0, noise.fbm(x * 2.5, y * 2.5, z * 2.5, 2, 9) - 0.3) * 1.1);
      return c;
    };

    const courseY = (course: number) => course * (COURSE_H + GAP) + COURSE_H / 2;
    const longLen = W - 2 * POST;
    const shortLen = D - 2 * POST;
    const INSET = 0.014; // planks sit a step behind the post faces, as in the mock
    const planks: sdf.Shape[] = [];
    for (const course of [0, 1]) {
      const y = courseY(course);
      for (const sz of [-1, 1]) {
        planks.push(
          sdf
            .box([longLen, COURSE_H, PLANK_T], 0.012)
            .at(0, y, sz * (D / 2 - INSET - PLANK_T / 2))
            .paintFn(woodPaint('x', course * 2 + (sz > 0 ? 0 : 1))),
        );
      }
      for (const sx of [-1, 1]) {
        planks.push(
          sdf
            .box([PLANK_T, COURSE_H, shortLen], 0.012)
            .at(sx * (W / 2 - INSET - PLANK_T / 2), y, 0)
            .paintFn(woodPaint('z', 4 + course * 2 + (sx > 0 ? 0 : 1))),
        );
      }
    }

    // Corner posts, chunky and beveled, rising above the rim.
    const px = W / 2 - POST / 2;
    const pz = D / 2 - POST / 2;
    const posts: sdf.Shape[] = [];
    for (const sx of [-1, 1])
      for (const sz of [-1, 1])
        posts.push(
          sdf
            .box([POST, POST_H, POST], 0.022)
            .at(sx * px, POST_H / 2, sz * pz)
            .paintFn(woodPaint('post', 8 + (sx > 0 ? 1 : 0) + (sz > 0 ? 2 : 0))),
        );

    const woodBody = sdf.union(...planks, ...posts);
    // Pale cut wood on the top faces (plank tops and post tops).
    const cutTops = sdf.union(
      sdf.box([W + 0.02, 0.014, D + 0.02]).at(0, H + 0.002, 0),
      sdf.box([W + 0.02, 0.012, D + 0.02]).at(0, POST_H + 0.001, 0),
    );
    k.body('wood', woodBody.paintWhere(cutTops, woodCut, 0.006), {
      color: '#b5814a',
      roughness: 0.8,
      detail: 0.012,
      maxError: 0.005,
      maxTriangles: 2600,
      paintWeight: 2,
    });

    // -------------------------------------------------------------- soil
    const soilShape = sdf
      .box([W - 2 * PLANK_T - 0.06, 0.3, D - 2 * PLANK_T - 0.06], 0.02)
      .at(0, SOIL_TOP - 0.15, 0)
      .displace(0.008, (x, _y, z) => noise.fbm(x * 4.5, 0.35, z * 4.5, 3, 11))
      .intersect(sdf.halfSpace([0, -1, 0], 0)) // never shows below the ground plane
      .paintFn((x, y, z) => {
        const t = 0.5 + 0.5 * soilBump(x, y, z);
        const base = mixRgb(soilC, soilDark, 0.38 + 0.5 * t);
        return mixRgb(base, soilLight, Math.max(0, t - 0.62) * 0.6);
      });
    k.body('soil', soilShape, {
      color: '#5a3a24',
      roughness: 0.95,
      detail: 0.018,
      maxError: 0.006,
      bump: soilBump,
    });

    // -------------------------------------------------------------- leafy tufts
    // Two staggered rows of lobed cabbage-like tufts, each a blended cluster of
    // spheres with per-tuft jitter so the rows feel hand-planted.
    const tuft = (x: number, z: number, s: number) => {
      const r = 0.058 + noise.random(s, 1) * 0.008;
      const y0 = SOIL_TOP + 0.008;
      const a0 = noise.random(s, 2) * Math.PI;
      const parts = [sdf.sphere(r).at(x, y0 + r * 0.75, z)];
      for (let i = 0; i < 3; i++) {
        const a = a0 + (i * Math.PI * 2) / 3 + noise.random(s, 3 + i) * 0.6;
        const d = r * 0.58;
        parts.push(
          sdf
            .sphere(0.042 + noise.random(s, 7 + i) * 0.007)
            .at(x + Math.cos(a) * d, y0 + r * 1.05 + noise.random(s, 11 + i) * 0.012, z + Math.sin(a) * d),
        );
      }
      return sdf.smoothUnion(0.016, ...parts);
    };
    const tufts: sdf.Shape[] = [];
    let seed = 1;
    for (let i = 0; i < 5; i++) {
      const x = -0.68 + i * 0.34 + (noise.random(seed, 21) - 0.5) * 0.03;
      tufts.push(tuft(x, 0.2 + (noise.random(seed, 22) - 0.5) * 0.02, seed++));
    }
    for (let i = 0; i < 4; i++) {
      const x = -0.51 + i * 0.34 + (noise.random(seed, 21) - 0.5) * 0.03;
      tufts.push(tuft(x, -0.2 + (noise.random(seed, 22) - 0.5) * 0.02, seed++));
    }
    k.body(
      'leaf',
      sdf.union(...tufts).paintFn((x, y, z) => {
        const t = clamp01((y - 0.2) / 0.1); // darker in the crevices, lighter on the lobes
        let c = mixRgb(leafDark, leaf, 0.22 + 0.7 * t);
        c = mixRgb(c, leafLight, Math.max(0, t - 0.6) * 0.9);
        const m = 0.5 + 0.5 * noise.fbm(x * 9, y * 9, z * 9, 2, 5);
        return mixRgb(c, leaf, m * 0.22);
      }),
      {
        color: '#5cb85c',
        roughness: 0.62,
        detail: 0.009,
        maxError: 0.004,
        maxTriangles: 1900,
        textureDensity: 2,
        paintWeight: 2,
      },
    );

    // -------------------------------------------------------------- carrot tops
    // Orange shoulders poking out of the soil at small tilts, down the center strip.
    const carrots: sdf.Shape[] = [];
    const spots: Array<[number, number, number]> = [
      [-0.6, 0.02, 14],
      [0.05, -0.03, 15],
      [0.62, 0.0, 16],
    ];
    for (const [x, z, s] of spots) {
      const lean = (noise.random(s, 1) - 0.5) * 0.5;
      const lean2 = noise.random(s, 2) > 0.5 ? 0.18 : -0.18;
      carrots.push(
        sdf
          .cone([x, SOIL_TOP - 0.06, z], [x + lean * 0.16, SOIL_TOP + 0.075, z + lean2 * 0.12], 0.04, 0.02)
          .paintFn((_x, y, _z) => {
            const t = clamp01((y - (SOIL_TOP - 0.06)) / 0.14);
            return mixRgb(carrotDark, carrotC, 0.35 + 0.65 * t);
          }),
      );
    }
    k.body('carrot', sdf.union(...carrots), {
      color: '#e0762e',
      roughness: 0.5,
      detail: 0.008,
      maxTriangles: 350,
      textureDensity: 2,
    });

    // -------------------------------------------------------------- iron bolts
    // Chunky hex bolt caps on the outward faces of every corner post.
    const hex = sdf.extrude(
      profile.polygon(
        Array.from({ length: 6 }, (_, i) => {
          const a = (Math.PI * i) / 3;
          return [Math.cos(a) * 0.02, Math.sin(a) * 0.02] as [number, number];
        }),
      ),
      0.014,
      0.003,
    );
    const bolts: sdf.Shape[] = [];
    for (const sx of [-1, 1])
      for (const sz of [-1, 1]) {
        bolts.push(hex.rotateY(sz > 0 ? 0 : 180).at(sx * px, BOLT_Y, sz * (D / 2 - 0.004)));
        bolts.push(hex.rotateY(sx > 0 ? 90 : -90).at(sx * (W / 2 - 0.004), BOLT_Y, sz * pz));
      }
    k.body(
      'iron',
      sdf
        .union(...bolts)
        .paintFn((_x, y, _z) =>
          mixRgb(ironC, rgb('#a8acb1'), clamp01((y - BOLT_Y + 0.012) / 0.024) * 0.4 + 0.5),
        ),
      { color: '#4a4f55', roughness: 0.5, metalness: 0.7, detail: 0.006, maxTriangles: 700 },
    );
  },
});
