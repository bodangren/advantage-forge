import { defineAsset, mixRgb, noise, profile, rgb, sdf, type Rgb, type Sdf } from '../src/index.js';

/**
 * Glowing mushroom — Chibi Quest cave nature prop (catalog `nature/plants/glowing-mushroom`).
 *
 * - Role: cave-floor dressing that also acts as a soft light source; must read at 128 px.
 *   Static prop, no rig, no clips.
 * - Size: 0.3 m tall, about 0.42 m wide, stands on y = 0, centred on the Y axis, faces +Z.
 * - One idea: five small toadstools crowded on one mossy stone, their lumpy teal caps glowing
 *   like lanterns and overlapping into one canopy; the big back cap is tallest and widest.
 * - Shape language: round dominant (lumpy domed caps, fat stems, rounded stone); soft bevels.
 * - Palette: stone cool gray #6f7680 (dark #4b525c, lit #8b939d), moss #4d6b3a (light #7ba24c),
 *   stems pale bone #d9dcc9 (shade #a9ae97), caps dark teal base #10302c with emissive
 *   #3fe0c0. Value plan: dark stone and moss below, pale stems mid, bright glowing caps on top.
 *   Accent and focal point: the big glowing cap.
 * - Materials: stone 0.9, pebbles 0.9 (darker), moss 0.98 (fuzzy bump), stems 0.65 satin,
 *   caps 0.35 emissive (dark base, never bright plain paint).
 * - Detail: (1) mossy stone mound, (2) fat pale stems, (3) lumpy warted caps, (4) embedded
 *   pebbles + pits, (5) small moss tufts. Focal point: the big warted cap.
 * - Budget: per-body `detail` and `maxTriangles` keep the final build under 3,000 triangles.
 */

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (e0: number, e1: number, v: number): number => {
  const t = clamp01((v - e0) / (e1 - e0 || 1e-6));
  return t * t * (3 - 2 * t);
};

const C = {
  rock: '#6f7680',
  rockDark: '#4b525c',
  rockLight: '#8b939d',
  pebble: '#565d67',
  moss: '#4d6b3a',
  mossDark: '#2f4526',
  mossLight: '#7ba24c',
  stem: '#d9dcc9',
  stemShade: '#a9ae97',
  stemLight: '#f2f4e4',
  capBase: '#10302c',
  capEmit: '#3fe0c0',
};

interface Shroom {
  /** Stem base on / inside the stone, meters. */
  readonly bx: number;
  readonly bz: number;
  /** Outward lean, degrees. */
  readonly lean: number;
  /** Lean azimuth, degrees: 0 = +Z (front), 90 = +X. */
  readonly spin: number;
  /** Cap underside height, meters. */
  readonly h: number;
  readonly r0: number;
  readonly r1: number;
  /** Lateral bow of the stem tip in the local frame. */
  readonly bow: number;
  readonly capR: number;
  readonly capH: number;
}

/** Five mushrooms crowded together: one big focal cap high at the back, two mid leaning left
 *  and right, two small at the front. The caps overlap into one glowing canopy. */
const SHROOMS: readonly Shroom[] = [
  { bx: 0.0, bz: -0.012, lean: 5, spin: 176, h: 0.2, r0: 0.056, r1: 0.044, bow: 0.004, capR: 0.1, capH: 0.092 },
  { bx: -0.072, bz: 0.018, lean: 26, spin: -76, h: 0.155, r0: 0.042, r1: 0.032, bow: 0.008, capR: 0.07, capH: 0.066 },
  { bx: 0.072, bz: 0.028, lean: 26, spin: 76, h: 0.15, r0: 0.04, r1: 0.03, bow: 0.008, capR: 0.067, capH: 0.063 },
  { bx: -0.045, bz: 0.07, lean: 36, spin: -42, h: 0.115, r0: 0.035, r1: 0.026, bow: 0.006, capR: 0.052, capH: 0.048 },
  { bx: 0.045, bz: 0.078, lean: 36, spin: 38, h: 0.11, r0: 0.033, r1: 0.024, bow: 0.006, capR: 0.05, capH: 0.046 },
];

/** Cap silhouette: a wide rounded dome whose rim curls back under the cap. */
const capPoints = (R: number, H: number): [number, number][] => [
  [0, H],
  [0.12 * R, 0.995 * H],
  [0.32 * R, 0.97 * H],
  [0.52 * R, 0.92 * H],
  [0.7 * R, 0.84 * H],
  [0.85 * R, 0.72 * H],
  [0.94 * R, 0.56 * H],
  [0.99 * R, 0.38 * H],
  [1.0 * R, 0.22 * H],
  [0.97 * R, 0.08 * H],
  [0.9 * R, -0.02 * H],
  [0.76 * R, -0.05 * H],
  [0.5 * R, -0.06 * H],
  [0, -0.06 * H],
];

/** Shared pose: lean about the base, spin about Y, then place on the stone. */
const pose = (m: Shroom, s: Sdf): Sdf => s.rotateX(m.lean).rotateY(m.spin).at(m.bx, 0, m.bz);

/** One stem: a fat tapered chain with a slight bow, shaded at the foot and streaked above. */
const stemOf = (m: Shroom): Sdf =>
  pose(
    m,
    sdf
      .chain(
        [
          [0, m.r0 * 0.7, 0, m.r0],
          [0, m.r0 * 1.5, 0, m.r0 * 1.0],
          [m.bow * 0.4, m.h * 0.6, 0, m.r1 * 1.06],
          [m.bow, m.h - 0.004, 0, m.r1],
        ],
        0.02,
      )
      .paintFn((x, y, z, base: Rgb) => {
        const t = clamp01(y / Math.max(0.03, m.h));
        let c = mixRgb(rgb(C.stemShade), base, smoothstep(0, 0.32, t));
        const streak = noise.fbm(x * 30, y * 5, z * 30, 2);
        c = mixRgb(c, rgb(C.stemLight), clamp01(streak) * 0.4 * smoothstep(0.12, 0.7, t));
        // A teal lift where the stem meets the glow, so the stem picks up the cap light.
        c = mixRgb(c, rgb('#8fd8c2'), smoothstep(0.6, 1, t) * 0.28);
        return c;
      }),
  );

/**
 * Warty lumps riding the cap dome: a cauliflower cluster of rounded lobes so the cap reads as
 * bumpy rather than a smooth ball. `rf` = radial fraction, `az` = azimuth degrees, `s` = lobe
 * size as a fraction of the cap height.
 */
const warts = (R: number, H: number): Sdf => {
  const parts: Sdf[] = [];
  const ring = (rf: number, count: number, sr: number, phaseDeg: number): void => {
    for (let i = 0; i < count; i++) {
      const a = ((phaseDeg + (i * 360) / count) * Math.PI) / 180;
      const x = rf * R * Math.cos(a);
      const z = rf * R * Math.sin(a);
      const y = H * Math.sqrt(Math.max(0, 1 - rf * rf * 0.9)) - 0.26 * H;
      parts.push(sdf.sphere(Math.max(0.006, sr * R)).at(x, y, z));
    }
  };
  ring(0, 1, 0.44, 0);
  ring(0.5, 5, 0.34, 18);
  ring(0.86, 6, 0.25, 0);
  return sdf.smoothUnion(R * 0.13, ...parts);
};

/** One cap: a lumpy warted revolved dome, dark rim and underside, posed above the stem. */
const capOf = (m: Shroom): Sdf => {
  const R = m.capR;
  const H = m.capH;
  const dome = sdf.revolve(profile.polygon(capPoints(R * 0.9, H * 0.88), { smooth: false })).paintFn((x, y, z, base: Rgb) => {
    const t = clamp01(y / H);
    // Darker underside and rim; a faint lift on the crown so the glow has a focal peak.
    let c = mixRgb(base, rgb(C.capBase), (1 - t) * 0.5);
    c = mixRgb(c, rgb('#1f5a50'), smoothstep(0.6, 1, t) * 0.3);
    const n = noise.fbm(x * 22, y * 22, z * 22, 2);
    return mixRgb(c, rgb(C.capBase), clamp01(-n) * 0.18);
  });
  const cap = warts(R, H)
    .smoothUnion(R * 0.12, dome)
    .displace(0.002, (x, y, z) => noise.fbm(x * 34, y * 34, z * 34, 2))
    .at(m.bow, m.h, 0);
  return pose(m, cap);
};

export default defineAsset({
  name: 'glowing-mushroom',
  description:
    'Cluster of five small cave mushrooms with glowing lumpy teal caps and pale stems on a mossy stone.',
  detail: 0.008,
  reference: 'docs/item-mockups/glowing-mushroom-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ stone
    // One rounded mound with a few low lobes, cut flat at y = 0. Displaced for a weathered
    // silhouette, then pitted with a few shallow craters.
    const mass = sdf
      .ellipsoid([0.142, 0.085, 0.132])
      .at(0, 0.026, 0)
      .smoothUnion(0.05, sdf.ellipsoid([0.09, 0.064, 0.08]).at(-0.068, 0.038, 0.045))
      .smoothUnion(0.05, sdf.ellipsoid([0.082, 0.056, 0.076]).at(0.076, 0.034, -0.04))
      .smoothUnion(0.045, sdf.ellipsoid([0.066, 0.046, 0.066]).at(0.016, 0.03, 0.095))
      .displace(0.012, (x, y, z) => noise.fbm(x * 6, y * 6, z * 6, 3));

    // Probe the displaced mound so pits, pebbles and moss sit exactly on the surface.
    const topAt = (x: number, z: number): number => {
      const hit = sdf.raycast(mass, [x, 0.6, z], [0, -1, 0], 1.2);
      return hit ? hit[1] : 0;
    };

    // Shallow craters carved into the crown and flanks.
    const pitAt = (x: number, z: number, r: number): Sdf => sdf.sphere(r).at(x, topAt(x, z) - r * 0.5, z);
    const pits = sdf.smoothUnion(
      0.006,
      pitAt(0.02, 0.088, 0.018),
      pitAt(-0.1, 0.03, 0.02),
      pitAt(0.085, -0.06, 0.016),
      pitAt(-0.03, -0.08, 0.014),
      pitAt(0.12, 0.04, 0.015),
    );

    const stone = mass
      .subtract(pits)
      .round(0.008)
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .paintFn((x, y, z, base: Rgb) => {
        const t = clamp01(y / 0.11);
        let c = mixRgb(rgb(C.rockDark), base, clamp01(0.3 + t * 0.7));
        c = mixRgb(c, rgb(C.rockLight), smoothstep(0.45, 1, t) * 0.5);
        const patch = noise.fbm(x * 5, y * 5, z * 5, 3);
        c = mixRgb(c, rgb(C.rockDark), clamp01(-patch) * 0.5);
        c = mixRgb(c, rgb(C.rockLight), clamp01(patch) * 0.15);
        // Moss creeping over the crown, broken up by noise.
        const n = noise.fbm(x * 12, y * 12, z * 12, 3);
        const up = clamp01((y - 0.02) / 0.09);
        const m = clamp01((n + 0.15) / 0.6) * up;
        c = mixRgb(c, rgb(C.mossDark), m * 0.7);
        c = mixRgb(c, rgb(C.mossLight), m * clamp01(n * 0.7 + 0.4) * 0.5);
        return c;
      });

    k.body('stone', stone, {
      color: C.rock,
      roughness: 0.9,
      metalness: 0,
      detail: 0.009,
      maxTriangles: 700,
      paintWeight: 2,
      bump: (x, y, z) =>
        0.0022 * noise.fbm(x * 38, y * 38, z * 38, 3) + 0.0007 * noise.noise3(x * 100, y * 100, z * 100, 5),
    });

    // ------------------------------------------------------------------ pebbles
    // Darker stones set into the mound, plus a couple of chips at the base.
    const pebAt = (x: number, z: number, rx: number, ry: number, rz: number, spin: number): Sdf =>
      sdf.ellipsoid([rx, ry, rz]).rotateY(spin).at(x, topAt(x, z) - ry * 0.2, z);
    const pebbles = sdf
      .smoothUnion(
        0.006,
        pebAt(0.055, 0.025, 0.03, 0.019, 0.026, 20),
        pebAt(-0.07, 0.05, 0.026, 0.017, 0.024, -30),
        pebAt(0.095, -0.015, 0.028, 0.018, 0.024, 15),
        pebAt(-0.045, -0.055, 0.024, 0.016, 0.022, -12),
        pebAt(0.11, 0.07, 0.022, 0.015, 0.02, 40),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    k.body('pebbles', pebbles, {
      color: C.pebble,
      roughness: 0.9,
      metalness: 0,
      detail: 0.006,
      maxTriangles: 190,
      paintWeight: 2,
      bump: (x, y, z) => 0.0018 * noise.fbm(x * 50, y * 50, z * 50, 2),
    });

    // ------------------------------------------------------------------ moss tufts
    // A few soft lumps of moss on the crown and along the rim.
    const mossAt = (x: number, z: number, rx: number, ry: number, rz: number): Sdf =>
      sdf.ellipsoid([rx, ry, rz]).at(x, topAt(x, z) - ry * 0.1, z);
    const moss = sdf
      .smoothUnion(
        0.01,
        mossAt(0.05, 0.06, 0.05, 0.022, 0.045),
        mossAt(-0.09, -0.05, 0.04, 0.018, 0.038),
        mossAt(0.1, -0.08, 0.035, 0.016, 0.032),
        mossAt(-0.02, -0.035, 0.03, 0.014, 0.03),
      )
      .displace(0.005, (x, y, z) => noise.fbm(x * 20, y * 20, z * 20, 2))
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .paintFn((x, y, z, base: Rgb) => {
        const v = 0.5 + 0.5 * noise.fbm(x * 16, y * 16, z * 16, 2);
        let c = mixRgb(rgb(C.mossDark), base, clamp01(0.3 + v * 0.6));
        c = mixRgb(c, rgb(C.mossLight), clamp01((v - 0.5) * 2) * 0.5);
        return c;
      });
    k.body('moss', moss, {
      color: C.moss,
      roughness: 0.98,
      metalness: 0,
      detail: 0.006,
      maxTriangles: 200,
      bump: (x, y, z) => 0.0035 * noise.fbm(x * 70, y * 70, z * 70, 3),
    });

    // ------------------------------------------------------------------ stems
    const stems = sdf.union(...SHROOMS.map(stemOf)).intersect(sdf.halfSpace([0, -1, 0], 0));
    k.body('stems', stems, {
      color: C.stem,
      roughness: 0.65,
      metalness: 0,
      detail: 0.007,
      textureDensity: 1.5,
      paintWeight: 2,
      maxTriangles: 380,
    });

    // ------------------------------------------------------------------ caps
    // One emissive body for every cap: dark teal base color so the glow does not wash out.
    const caps = sdf.union(...SHROOMS.map(capOf));
    k.body('caps', caps, {
      color: C.capBase,
      roughness: 0.35,
      metalness: 0,
      emissive: C.capEmit,
      emissiveIntensity: 1.8,
      detail: 0.007,
      textureDensity: 2,
      maxTriangles: 1500,
    });
  },
});
