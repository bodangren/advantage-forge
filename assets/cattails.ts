import { defineAsset, mixRgb, noise, rgb, sdf, type Sdf } from '../src/index.js';

/**
 * Cattails — Chibi Quest wetland dressing (catalog `nature/plants/cattails`): about 0.9 m tall,
 * 0.35 m wide, standing on y = 0 and facing +Z. No rig, no clips.
 *
 * - Role: water-edge dressing beside pond and river assets; a vertical accent that reads at
 *   128 px and breaks the green-band silhouette with five upright brown sausages.
 * - One idea: a fan of eight long arching blades and five thin stalks, each topped with a
 *   plump brown sausage head and a tiny golden male spike poking out of the tip.
 * - Shape language: round and soft (tapered flat blades, plump capsule heads, low tuft mound);
 *   the upright brown sausages break the silhouette and are the focal accent.
 * - Palette: leaves deep green #2f7a3f with lighter tips #4a9a4f and sunny #7ec850 ridge;
 *   shaded base #22572e; stalks #4a8a3f; tuft dark moss #1f5a2a over shaded #163f1d.
 *   Cattail heads warm brown #6e4526 (per brief) over dark #3a2516, lighter warm tip #9a6238;
 *   spike bright #d8a23a. Value plan: dark tuft and blade bases, mid blades, light tips;
 *   brown sausages are the focal accent.
 * - Materials: matte foliage (roughness 0.8), soft matte cattail (0.75), rough tuft (0.88).
 * - Detail: (1) low mossy tuft at y = 0, (2) eight arching blades with painted sun-tips,
 *   (3) five stalk + sausage heads with golden spike, (4) base-to-tip paint gradients.
 *   Focal point: the brown sausages above the green fan.
 * - Budget: per-body maxTriangles plus coarse detail keep the final under 4,000 triangles.
 */

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

const BLADE_DEEP = rgb('#2f7a3f');
const BLADE_TIP = rgb('#4a9a4f');
const BLADE_SUN = rgb('#a4e26a');
const BLADE_SHADE = rgb('#1a4a23');

const STALK = rgb('#4a8a3f');
const STALK_SHADE = rgb('#2f6a35');

const HEAD_MID = rgb('#6e4526'); // brief-specified brown
const HEAD_DARK = rgb('#3a2516');
const HEAD_LIGHT = rgb('#9a6238');

const SPIKE = rgb('#d8a23a');

const TUFT_DARK = rgb('#163f1d');
const TUFT_MID = rgb('#1f5a2a');
const TUFT_SUN = rgb('#3a7a3a');

interface Blade {
  /** Base of the blade (world meters), around the tuft crown. */
  readonly base: readonly [number, number, number];
  /** Blade tip position (world meters). */
  readonly tip: readonly [number, number, number];
  /** Blade base half-width, meters. */
  readonly w: number;
  /** Curve control point; bows the blade outward. */
  readonly bow: readonly [number, number, number];
}

/**
 * Eight chunky blades fan out from the tuft: three tall heart, three mid ring, two short outer
 * fill, with bow control points pushed far outward so every leaf arcs gracefully like in the
 * reference, instead of standing straight like grass.
 */
const BLADES: readonly Blade[] = [
  // tall heart: arch up and out to the sides
  { base: [0.02, 0.05, -0.01], tip: [-0.22, 0.78, -0.06], w: 0.034, bow: [-0.32, 0.5, -0.05] },
  { base: [-0.01, 0.05, 0.01], tip: [0.26, 0.74, 0.04], w: 0.034, bow: [0.36, 0.48, 0.03] },
  { base: [0.0, 0.05, 0.02], tip: [0.06, 0.82, 0.24], w: 0.032, bow: [0.06, 0.5, 0.34] },
  // mid ring: stronger outward lean
  { base: [-0.05, 0.04, 0.02], tip: [-0.34, 0.58, 0.06], w: 0.031, bow: [-0.4, 0.4, 0.06] },
  { base: [0.05, 0.04, 0.0], tip: [0.36, 0.54, -0.04], w: 0.031, bow: [0.42, 0.38, -0.04] },
  { base: [0.01, 0.04, -0.04], tip: [0.06, 0.6, -0.28], w: 0.031, bow: [0.08, 0.4, -0.36] },
  // short outer fill: low and wide
  { base: [-0.04, 0.04, -0.03], tip: [-0.34, 0.36, -0.16], w: 0.03, bow: [-0.4, 0.26, -0.16] },
  { base: [0.04, 0.04, 0.04], tip: [0.24, 0.32, 0.24], w: 0.03, bow: [0.3, 0.24, 0.26] },
];

/**
 * Sample a quadratic Bezier from base through `bow` to `tip` into a 7-point spine with a
 * smooth base-to-tip taper. Producing a real curve (instead of two straight segments) keeps
 * the chain smooth and removes the visible "knee" a straight line would leave at the bow.
 */
const spineOf = (b: Blade): [number, number, number, number][] => {
  const out: [number, number, number, number][] = [];
  for (let i = 0; i <= 6; i++) {
    const s = i / 6;
    const u = 1 - s;
    const q0 = u * u;
    const q1 = 2 * u * s;
    const q2 = s * s;
    const x = q0 * b.base[0] + q1 * b.bow[0] + q2 * b.tip[0];
    const y = q0 * b.base[1] + q1 * b.bow[1] + q2 * b.tip[1];
    const z = q0 * b.base[2] + q1 * b.bow[2] + q2 * b.tip[2];
    const r = b.w * (1 - 0.78 * s);
    out.push([x, y, z, r]);
  }
  return out;
};

/**
 * A blade as a smooth 7-point chain sampled from a Bezier through the bow control point,
 * then flattened in Z so it reads as a long ribbon leaf. The wide chain blend (`k = 0.05`)
 * hides every joint into one sweeping arc, like the cattails-mock reference.
 */
const blade = (b: Blade): Sdf => sdf.chain(spineOf(b), 0.05).scale([1, 1, 0.42]);

interface Cattail {
  /** Stalk base inside the tuft. */
  readonly base: readonly [number, number, number];
  /** Stalk top where the head sits. */
  readonly top: readonly [number, number, number];
  /** Head length, meters. */
  readonly len: number;
  /** Head radius, meters. */
  readonly r: number;
}

/**
 * Five stalks: tallest at the back-center, mid ring of three, one shorter front.
 * The brown sausages ride at varied heights so the silhouette stacks like a candelabra.
 */
const CATTAILS: readonly Cattail[] = [
  { base: [-0.03, 0.05, -0.03], top: [-0.05, 0.7, -0.04], len: 0.16, r: 0.034 },
  { base: [0.04, 0.05, -0.01], top: [0.06, 0.78, -0.02], len: 0.18, r: 0.036 },
  { base: [0.0, 0.05, 0.04], top: [0.01, 0.66, 0.07], len: 0.15, r: 0.032 },
  { base: [-0.07, 0.04, 0.02], top: [-0.11, 0.6, 0.04], len: 0.14, r: 0.03 },
  { base: [0.07, 0.04, 0.01], top: [0.12, 0.58, 0.02], len: 0.13, r: 0.029 },
];

/** Thin stalk with a gentle outward bow from base to head, narrowing toward the tip. */
const stalk = (c: Cattail): Sdf =>
  sdf.chain(
    [
      [c.base[0], c.base[1], c.base[2], 0.009],
      [(c.base[0] + c.top[0]) / 2, (c.base[1] + c.top[1]) / 2, (c.base[2] + c.top[2]) / 2, 0.008],
      [c.top[0], c.top[1], c.top[2], 0.007],
    ],
    0.018,
  );

/**
 * Brown sausage head: rounded capsule plus a small golden male flower spike poking out of
 * the top, like the cattails-mock reference. The spike sits proud of the head so it reads
 * as a separate accent at the 128 px sprite size.
 */
const head = (c: Cattail): Sdf => {
  const [tx, ty, tz] = c.top;
  const sausage = sdf.capsule([tx, ty, tz], [tx, ty + c.len, tz], c.r);
  const spike = sdf.cone(
    [tx, ty + c.len - 0.008, tz],
    [tx, ty + c.len + 0.06, tz],
    0.014,
    0.004,
  );
  return sdf.smoothUnion(0.01, sausage, spike);
};

export default defineAsset({
  name: 'cattails',
  description:
    'A wetland cattail clump: eight fanned green blades and five brown sausage stalks with golden tips, rising from a small mossy tuft.',
  detail: 0.006,
  texture: { size: 1024 },
  reference: 'docs/item-mockups/cattails-mock.jpg',

  build(k) {
    // ------------------------------------------------------------------ tuft
    // A low mossy dome, flat at y = 0; darkest at the ground line, light sun patches on top.
    const tuft = sdf
      .smoothUnion(
        0.025,
        sdf.ellipsoid([0.13, 0.055, 0.12]).at(0, 0.03, 0),
        sdf.ellipsoid([0.08, 0.045, 0.07]).at(-0.07, 0.025, 0.04),
        sdf.ellipsoid([0.07, 0.04, 0.07]).at(0.07, 0.025, -0.04),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .displace(0.008, (x, y, z) => noise.fbm(x * 12, y * 12, z * 12, 2))
      .paintFn((x, y, z) => {
        const t = clamp01(y / 0.05);
        const v = 0.5 + 0.5 * noise.fbm(x * 8, y * 8, z * 8, 2);
        let col = mixRgb(TUFT_DARK, TUFT_MID, t * (0.6 + 0.4 * v));
        col = mixRgb(col, TUFT_SUN, clamp01(t * 2 - 1) * v * 0.5);
        return col;
      });
    k.body('tuft', tuft, {
      color: '#1f5a2a',
      roughness: 0.88,
      detail: 0.012,
      maxTriangles: 350,
      paintWeight: 2,
    });

    // ------------------------------------------------------------------ blades
    // Fanned tapered blades: very dark shaded base, deep mid, light sunlit tips, top ridge
    // catches the sun. Strong value contrast so the focal brown heads read against them.
    const blades = sdf
      .smoothUnion(0.012, ...BLADES.map(blade))
      .paintFn((x, y, z) => {
        // 0 at base, 1 at tip: a simple height-driven gradient.
        const t = clamp01((y - 0.04) / 0.78);
        const v = 0.5 + 0.5 * noise.fbm(x * 7, y * 7, z * 7, 2);
        // Sunlit on the top side of the arch: y high catches sun, especially near tips.
        const sunUp = clamp01((y - 0.18) / 0.6) * 0.55;
        let col = mixRgb(BLADE_DEEP, BLADE_TIP, clamp01(t * 1.15 - 0.1 + (v - 0.5) * 0.25));
        col = mixRgb(col, BLADE_SHADE, (1 - clamp01(t * 4)) * 0.9);
        col = mixRgb(col, BLADE_SUN, clamp01((t - 0.55) * 2.4) * (0.5 + sunUp * 0.5));
        return col;
      });
    k.body('blades', blades, {
      color: '#2f7a3f',
      roughness: 0.8,
      detail: 0.008,
      maxTriangles: 1700,
      paintWeight: 2,
    });

    // ------------------------------------------------------------------ stalks
    // Thin green stalks; shaded darker at the base where they enter the tuft.
    const stalksShape = sdf
      .smoothUnion(0.008, ...CATTAILS.map(stalk))
      .paintFn((x, y, z) => {
        const t = clamp01(y / 0.78);
        const v = 0.5 + 0.5 * noise.fbm(x * 8, y * 8, z * 8, 2);
        let col = mixRgb(STALK_SHADE, STALK, t * (0.7 + 0.3 * v));
        return col;
      });
    k.body('stalks', stalksShape, {
      color: '#4a8a3f',
      roughness: 0.8,
      detail: 0.005,
      maxTriangles: 250,
      paintWeight: 1,
    });

    // ------------------------------------------------------------------ heads
    // Brown sausage bodies with a warm tip highlight; the tiny golden spike is its own body
    // so the bright accent color does not wash the brown out via vertex-color blending.
    const sausageBodies = sdf.smoothUnion(0.012, ...CATTAILS.map((c) => {
      const [tx, ty, tz] = c.top;
      return sdf.capsule([tx, ty, tz], [tx, ty + c.len, tz], c.r);
    })).paintFn((x, y, z) => {
      // Per-head height window: estimate the local head span by nearest cattail top.
      let best = CATTAILS[0]!;
      let bestD = Infinity;
      for (const c of CATTAILS) {
        const dx = c.top[0] - x;
        const dy = c.top[1] - y;
        const dz = c.top[2] - z;
        const d = dx * dx + dy * dy + dz * dz;
        if (d < bestD) {
          bestD = d;
          best = c;
        }
      }
      const local = clamp01((y - best.top[1]) / best.len);
      const v = 0.5 + 0.5 * noise.fbm(x * 14, y * 14, z * 14, 2);
      let col = mixRgb(HEAD_DARK, HEAD_MID, clamp01(0.35 + local * 0.9));
      col = mixRgb(col, HEAD_LIGHT, clamp01(local - 0.7) * 0.5);
      col = mixRgb(col, HEAD_MID, v * 0.2);
      return col;
    });
    k.body('heads', sausageBodies, {
      color: '#6e4526',
      roughness: 0.75,
      detail: 0.006,
      maxTriangles: 700,
      paintWeight: 2,
    });

    // Golden male flower spikes on top of each head, kept as their own bright body so the
    // accent reads at sprite size. Sized to be visible from across the canvas.
    const spikesShape = sdf.smoothUnion(0.004, ...CATTAILS.map((c) => {
      const [tx, ty, tz] = c.top;
      return sdf.cone(
        [tx, ty + c.len - 0.008, tz],
        [tx, ty + c.len + 0.06, tz],
        0.014,
        0.004,
      );
    }));
    k.body('spikes', spikesShape, {
      color: '#d8a23a',
      roughness: 0.7,
      detail: 0.005,
      maxTriangles: 350,
    });
  },
});
