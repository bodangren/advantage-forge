import { defineAsset, mixRgb, noise, rgb, sdf, type Sdf } from '../src/index.js';

/**
 * Mushroom cluster — dungeon dressing (catalog `dungeon/dressing/mushroom-cluster`).
 *
 * Role: low dungeon floor dressing; sits on y = 0, faces +Z, reads at 128 px sprite size.
 * One idea: six fat baby dungeon mushrooms huddled on one damp moss pad, the big
 *   middle cap leaning over the small ones like a sheltering dome.
 * Shape language: round/chunky dominant (domed caps, fat stems, moss pad); no spikes.
 * Palette: moss pad deep teal #2c4a44 to #3fae9a; stems pale cool gray #8b9cb3 with
 *   slate feet; caps mid blue-gray #4a5d75 and deep teal #35707a with pale worn dots
 *   #7a8ba0; gill glow teal #3fae9a (emissive 0.3, the only light source).
 * Materials: moss matte 0.95, stems satin 0.6, caps satin 0.5, glow 0.4 + emissive.
 * Detail: (1) moss pad, (2) 6 fat stems, (3) 6 domed caps, (4) pale cap dots,
 *   (5) emissive gill discs. Focal point: the big 0.12 m cap. No rig, no animation.
 */

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

interface Shroom {
  /** Stem foot on the moss, meters. */
  readonly bx: number;
  readonly bz: number;
  /** Cap center, meters. */
  readonly cx: number;
  readonly cy: number;
  readonly cz: number;
  /** Cap radius, meters (largest 0.06 = 0.12 m across). */
  readonly r: number;
  /** Lean of the whole mushroom, degrees. */
  readonly lean: number;
  /** Turn of the lean, degrees. */
  readonly spin: number;
  /** Teal cap when true, blue-gray when false. */
  readonly teal: boolean;
}

// Big / medium / small rhythm: one 0.12 m dome, two mid, three small.
const SHROOMS: readonly Shroom[] = [
  { bx: 0.0, bz: -0.03, cx: 0.005, cy: 0.175, cz: -0.03, r: 0.06, lean: 4, spin: 10, teal: false },
  { bx: -0.11, bz: 0.05, cx: -0.12, cy: 0.125, cz: 0.055, r: 0.045, lean: -9, spin: 20, teal: true },
  { bx: 0.1, bz: 0.06, cx: 0.11, cy: 0.105, cz: 0.065, r: 0.04, lean: 10, spin: -15, teal: false },
  { bx: 0.09, bz: -0.08, cx: 0.1, cy: 0.145, cz: -0.085, r: 0.038, lean: 8, spin: -30, teal: true },
  { bx: -0.08, bz: -0.09, cx: -0.088, cy: 0.095, cz: -0.095, r: 0.032, lean: -7, spin: -12, teal: false },
  { bx: 0.01, bz: 0.11, cx: 0.012, cy: 0.068, cz: 0.115, r: 0.028, lean: 3, spin: 5, teal: true },
];

/** Fat stem: tapered cone from the moss into the cap plus a rounded foot. */
const stemOf = (m: Shroom): Sdf => {
  const topR = m.r * 0.52;
  const botR = m.r * 0.7;
  const top: [number, number, number] = [m.cx, m.cy - m.r * 0.2, m.cz];
  return sdf.smoothUnion(
    0.008,
    sdf.cone([m.bx, 0.03, m.bz], top, botR, topR),
    sdf.sphere(botR * 1.1).at(m.bx, 0.045, m.bz),
  );
};

/** Domed cap: squashed sphere with a soft under-curl toward the stem. */
const capOf = (m: Shroom): Sdf =>
  sdf
    .smoothUnion(
      m.r * 0.18,
      sdf.ellipsoid([m.r, m.r * 0.62, m.r]).at(0, 0, 0),
      sdf.ellipsoid([m.r * 0.72, m.r * 0.4, m.r * 0.72]).at(0, -m.r * 0.28, 0),
    )
    .rotateZ(m.lean)
    .rotateY(m.spin)
    .at(m.cx, m.cy, m.cz);

/** Glowing gills: a squashed disc bulging just below the cap rim. */
const gillOf = (m: Shroom): Sdf =>
  sdf
    .ellipsoid([m.r * 0.66, m.r * 0.36, m.r * 0.66])
    .rotateZ(m.lean)
    .rotateY(m.spin)
    .at(m.cx, m.cy - m.r * 0.46, m.cz);

/** Pale worn dots riding the cap dome: azimuth around Y, elevation above horizon. */
const dotStencil = (m: Shroom, azDeg: number, elDeg: number, s: number): Sdf => {
  const az = (azDeg * Math.PI) / 180;
  const el = (elDeg * Math.PI) / 180;
  const d: [number, number, number] = [
    Math.cos(el) * Math.sin(az),
    Math.sin(el),
    Math.cos(el) * Math.cos(az),
  ];
  // Distance from the dome center to the ellipsoid surface along d.
  const t =
    1 /
    Math.sqrt((d[0] / m.r) ** 2 + (d[1] / (m.r * 0.62)) ** 2 + (d[2] / m.r) ** 2);
  return sdf
    .sphere(m.r * s)
    .rotateZ(m.lean)
    .rotateY(m.spin)
    .at(m.cx + d[0] * t * 0.96, m.cy + d[1] * t * 0.96, m.cz + d[2] * t * 0.96);
};

// [azimuth, elevation, size]: low on the dome, well separated, so they read as spots.
const DOTS: readonly (readonly [number, number, number])[] = [
  [25, 38, 0.17],
  [-48, 28, 0.14],
  [78, 26, 0.13],
];

export default defineAsset({
  name: 'mushroom-cluster',
  description: 'Six chunky blue-gray and teal dungeon mushrooms with glowing gills on a moss pad.',
  detail: 0.005,
  reference: 'docs/dungeon-mockups/dungeon-quest_002.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------- moss pad
    // Low damp pad cut flat at y = 0; deep shadow crevices, faint teal crown.
    const pad = sdf.ellipsoid([0.17, 0.05, 0.15]);
    const lumps = sdf.smoothUnion(
      0.012,
      sdf.ellipsoid([0.045, 0.022, 0.04]).at(0.13, 0.012, 0.06),
      sdf.ellipsoid([0.04, 0.02, 0.045]).at(-0.125, 0.012, -0.035),
      sdf.ellipsoid([0.042, 0.02, 0.038]).at(0.02, 0.012, -0.115),
      sdf.ellipsoid([0.038, 0.018, 0.04]).at(-0.03, 0.01, 0.115),
    );
    const moss = sdf
      .smoothUnion(0.012, pad, lumps)
      .displace(0.006, (x, y, z) => noise.fbm(x * 14, y * 14, z * 14, 2))
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .paintFn((x, y, z) => {
        const v = 0.5 + 0.5 * noise.fbm(x * 9, y * 9, z * 9, 2);
        const base = mixRgb(rgb('#1e2e29'), rgb('#2c463d'), v);
        return mixRgb(base, rgb('#3fae9a'), clamp01((y - 0.02) / 0.035) * 0.35);
      });
    k.body('moss', moss, {
      color: '#2c4a44',
      roughness: 0.95,
      detail: 0.008,
      maxTriangles: 400,
      bump: (x, y, z) => noise.fbm(x * 40, y * 40, z * 40, 2) * 0.5,
    });

    // ------------------------------------------------------------- stems
    // Fat pale stems, darker slate feet sinking into the moss, satin damp look.
    const stems = sdf
      .smoothUnion(0.006, ...SHROOMS.map(stemOf))
      .intersect(sdf.halfSpace([0, -1, 0], -0.001))
      .paintFn((x, y, z, base) => {
        const foot = clamp01(1 - (y - 0.015) / 0.07);
        const v = 0.5 + 0.5 * noise.fbm(x * 22, y * 22, z * 22, 2);
        const slate = mixRgb(rgb('#4a5d75'), rgb('#2a3547'), v * 0.4);
        return mixRgb(base, slate, foot * 0.75);
      });
    k.body('stems', stems, { color: '#8b9cb3', roughness: 0.6, detail: 0.006, maxTriangles: 1000 });

    // ------------------------------------------------------------- caps
    const blue = SHROOMS.filter((m) => !m.teal);
    const teal = SHROOMS.filter((m) => m.teal);

    const paintCap = (deep: string, mid: string, pale: string) => (x: number, y: number, z: number) => {
      const v = 0.5 + 0.5 * noise.fbm(x * 26, y * 26, z * 26, 2);
      return mixRgb(mixRgb(rgb(deep), rgb(mid), 0.45 + v * 0.35), rgb(pale), v * v * 0.18);
    };

    let capsBlue: Sdf = sdf.smoothUnion(0.004, ...blue.map(capOf)).paintFn(paintCap('#2a3547', '#4a5d75', '#7a8ba0'));
    for (const m of blue)
      for (const [az, el, s] of DOTS)
        capsBlue = capsBlue.paintWhere(dotStencil(m, az, el, s), '#93a7bd', 0.003);
    k.body('capsBlue', capsBlue, {
      color: '#4a5d75',
      roughness: 0.5,
      detail: 0.006,
      maxTriangles: 600,
      textureDensity: 2,
    });

    let capsTeal: Sdf = sdf.smoothUnion(0.004, ...teal.map(capOf)).paintFn(paintCap('#23484a', '#35707a', '#7ab5a8'));
    for (const m of teal)
      for (const [az, el, s] of DOTS)
        capsTeal = capsTeal.paintWhere(dotStencil(m, az, el, s), '#8fd0bd', 0.003);
    k.body('capsTeal', capsTeal, {
      color: '#35707a',
      roughness: 0.5,
      detail: 0.006,
      maxTriangles: 550,
      textureDensity: 2,
    });

    // ------------------------------------------------------------- gill glow
    // Faint teal light under every cap; emissive only, never baked brightness.
    const gills = sdf.union(...SHROOMS.map(gillOf));
    k.body('gills', gills, {
      color: '#3fae9a',
      roughness: 0.4,
      emissive: '#3fae9a',
      emissiveIntensity: 0.3,
      detail: 0.008,
      maxTriangles: 300,
    });
  },
});
