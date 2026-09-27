import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — chunky forest tree stump (catalog `forest/prop/tree-stump`).
 *
 * Role: forest-floor prop beside the hamlet set; must read at 128 px sprite.
 * Size: 0.88 m across the body, 0.50 m tall at the dome; stands on y = 0, faces +Z.
 * One idea: a freshly cut cookie — a pale ringed top glowing against dark grooved bark,
 *   with two small root flares and a tiny mushroom cluster as the warm accent.
 * Shape language: round dominant (domed top, bulged sides, soft bevels everywhere).
 * Palette: bark #8a5a35, grooves #5f3d22, flare #a9713c, cut wood #9a7143 with pale
 *   rings #c9a06a, moss #4a8a3f, mushrooms #c9a06a on cream stems.
 * Materials: bark (roughness 0.88), cut wood terraces (0.85), cap skin (0.5), stems (0.8).
 * Detail: stump + root flares (primary), bark grooves + terraced growth rings (secondary),
 *   knot, moss and mushrooms (tertiary). Focal point: the pale ringed cut top.
 * Rig/animation: none (static prop).
 *
 * The growth rings are shallow terraces — one flat-colored body per ring band. Flat paint
 * never seam-splits the mesh, so each terrace reduces to a handful of triangles, the 1.5 mm
 * steps give the rings a crisp edge, and the texture bake gets clean ring colors.
 */

const BARK = rgb('#8a5a35');
const BARK_DARK = rgb('#5f3d22');
const BARK_LIGHT = rgb('#a9713c');
const MOSS = rgb('#4a8a3f');
const CAP_RED = '#c9a06a';
const CAP_LIGHT = rgb('#e3d2ab');
const STEM = '#e8d9b8';

const CUT_Y = 0.44; // the cut face takes over from the bark above this height

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Open Catmull-Rom through 2D points (endpoint-clamped), for hand-drawn silhouettes. */
const crOpen = (pts: readonly (readonly [number, number])[], samples: number): [number, number][] => {
  const out: [number, number][] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]!;
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const p3 = pts[Math.min(pts.length - 1, i + 2)]!;
    for (let s = 0; s < samples; s++) {
      const t = s / samples;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) =>
        0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  const last = pts[pts.length - 1]!;
  out.push([last[0], last[1]]);
  return out;
};

interface Shroom {
  readonly a: number; // azimuth from +Z toward +X
  readonly p: readonly [number, number, number];
  readonly tilt: number; // degrees, leaning away from the trunk
  readonly len: number;
  readonly stemR: number;
  readonly capR: number;
}

// Tiny cluster on the front-right bark, biggest mushroom lowest; stubby stems, caps
// nestling against the bark with bases buried for a clean join.
const shrooms: readonly Shroom[] = [
  { a: 0.42, p: [0.179, 0.135, 0.4], tilt: 18, len: 0.05, stemR: 0.016, capR: 0.05 },
  { a: 0.42, p: [0.229, 0.147, 0.377], tilt: 26, len: 0.04, stemR: 0.012, capR: 0.037 },
  { a: 0.42, p: [0.133, 0.141, 0.419], tilt: 12, len: 0.034, stemR: 0.011, capR: 0.03 },
];

const place = (
  shape: ReturnType<typeof sdf.sphere>,
  m: Shroom,
): ReturnType<typeof sdf.sphere> => shape.rotateX(m.tilt).rotateY((m.a * 180) / Math.PI).at(...m.p);

export default defineAsset({
  name: 'tree-stump',
  description:
    'Chunky tree stump: domed pale cut top with growth rings, grooved bark, two root flares and a tiny mushroom cluster.',
  detail: 0.01,
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ stump + roots
    // Squat revolved body: flared foot, gentle belly, rounded rim, slight dome on top.
    // The outer silhouette is an open spline, closed with exact edges on the revolve axis
    // (a closed smooth polygon overshoots past the axis and grows a spike).
    const silhouette = crOpen(
      [
        [0.36, 0.0],
        [0.415, 0.01],
        [0.437, 0.06],
        [0.442, 0.16],
        [0.437, 0.27],
        [0.425, 0.37],
        [0.417, 0.43],
        [0.405, 0.462],
        [0.37, 0.478],
        [0.29, 0.495],
        [0.18, 0.5005],
        [0.08, 0.502],
        [0.0, 0.502],
      ],
      6,
    );
    const bodyProfile = profile.polygon([[0, 0] as const, ...silhouette], { smooth: false });
    const stump = sdf.revolve(bodyProfile).intersect(sdf.halfSpace([0, -1, 0], 0));

    // Two short thick root flares (spider-leg roots are a failure mode; keep them stubby).
    const root = (a: number, len: number): ReturnType<typeof sdf.cone> =>
      sdf.cone(
        [Math.sin(a) * 0.15, 0.24, Math.cos(a) * 0.15],
        [Math.sin(a) * len, 0.016, Math.cos(a) * len],
        0.18,
        0.055,
      );

    const wood = sdf
      .smoothUnion(0.07, stump, root(0.55, 0.5), root(-0.75, 0.47))
      // Flat cut at y = 0: root cone lips must never dip below the ground plane.
      .intersect(sdf.halfSpace([0, -1, 0], 0));

    // ------------------------------------------------------------------ bark sides
    // Vertical grooves stretched along Y, dark seams, warm sunlit ridges, moss low behind.
    const ridges = (x: number, y: number, z: number): number =>
      noise.fbm(x * 6.5, y * 2.2, z * 6.5, 3, 41);
    const barkPaint = (x: number, y: number, z: number) => {
      const g = Math.max(0, -ridges(x, y, z));
      let c = mixRgb(BARK, BARK_DARK, Math.min(1, g * 2.6));
      const ridgeLight = Math.max(0, ridges(x, y, z));
      c = mixRgb(c, BARK_LIGHT, Math.min(0.55, ridgeLight * 1.3 * clamp01(y / 0.4 + 0.35)));
      // Shade under the cut rim and around the ground line.
      c = mixRgb(c, BARK_DARK, 0.5 * clamp01((y - 0.34) / 0.1));
      c = mixRgb(c, BARK_DARK, 0.5 * clamp01(1 - y / 0.12));
      // Moss creeping up the shaded back side, low on the trunk.
      const damp =
        clamp01(1 - y / 0.25) * clamp01(0.35 - z) * (0.3 + 0.6 * noise.fbm(x * 7, y * 7, z * 7, 2, 17));
      return mixRgb(c, MOSS, Math.min(0.65, damp * 0.7));
    };
    k.body(
      'bark',
      wood
        .intersect(sdf.halfSpace([0, 1, 0], CUT_Y + 0.004))
        .paintFn(barkPaint)
        .paintWhere(sdf.sphere(0.05).at(0.33, 0.3, 0.32), BARK_DARK, 0.018),
      {
        color: '#8a5a35',
        roughness: 0.88,
        detail: 0.012,
        textureDensity: 2,
        paintWeight: 2,
        bump: (x, y, z) => 0.005 * ridges(x, y, z),
        maxTriangles: 1400,
      },
    );

    // ------------------------------------------------------------------ cut top
    // Terraced growth rings: one flat-colored body per band. Each band is a slice of the same
    // squashed-ellipsoid dome, overlapping 6 mm under its neighbour and sitting 1.5 mm proud
    // of the band outside it, so the rings read as crisp steps in geometry and color.
    const CY = 0.44; // dome centre height
    const domeAt = (dy: number): ReturnType<typeof sdf.ellipsoid> =>
      sdf.ellipsoid([0.415, 0.058, 0.415]).at(0, CY + dy, 0);
    const annulus = (rIn: number, rOut: number): ReturnType<typeof sdf.cylinder> =>
      sdf.cylinder(rOut, 0.3, 0.006)
        .at(0, CY, 0)
        .subtract(sdf.cylinder(Math.max(rIn, 0.001), 0.32).at(0, CY, 0));

    interface Band {
      readonly rIn: number;
      readonly rOut: number;
      readonly color: string;
      readonly dy: number;
    }
    const HEARTWOOD = '#8f663c';
    const WOOD = '#a5794a';
    const WOOD_OUT = '#96703f';
    const RING = '#c9a06a';
    const bands: readonly Band[] = [
      { rIn: 0.0, rOut: 0.042, color: HEARTWOOD, dy: 0.004 },
      { rIn: 0.036, rOut: 0.072, color: RING, dy: 0.003 },
      { rIn: 0.066, rOut: 0.114, color: WOOD, dy: 0.002 },
      { rIn: 0.108, rOut: 0.144, color: RING, dy: 0.001 },
      { rIn: 0.138, rOut: 0.186, color: WOOD, dy: 0.0 },
      { rIn: 0.18, rOut: 0.216, color: RING, dy: -0.001 },
      { rIn: 0.21, rOut: 0.258, color: WOOD, dy: -0.002 },
      { rIn: 0.252, rOut: 0.288, color: RING, dy: -0.003 },
      { rIn: 0.282, rOut: 0.415, color: WOOD_OUT, dy: -0.004 },
    ];
    for (const [i, b] of bands.entries()) {
      const slice = domeAt(b.dy)
        .intersect(annulus(b.rIn, b.rOut))
        .intersect(sdf.halfSpace([0, -1, 0], -(CY + b.dy - 0.012)));
      // Broad low-frequency mottling keeps the flat bands from looking sterile; it is smooth
      // enough to never seam-split the mesh.
      const tinted = slice.paintFn((x, y, z) => {
        const m = noise.fbm(x * 9, y * 9, z * 9, 2, 5 + i);
        return m >= 0
          ? mixRgb(rgb(b.color), rgb(RING), m * 0.14)
          : mixRgb(rgb(b.color), rgb(WOOD_OUT), -m * 0.16);
      });
      k.body(`ring-${i}`, tinted, {
        color: b.color,
        roughness: 0.85,
        detail: 0.014,
        maxTriangles: 220,
      });
    }

    // ------------------------------------------------------------------ mushrooms
    // Stems first, then red caps with a flat cut underside, both tilted away from the trunk.
    const stems = sdf.union(
      ...shrooms.map((m) => place(sdf.capsule([0, -0.02, 0], [0, m.len - 0.005, 0], m.stemR), m)),
    );
    k.body('mushroom-stems', stems, {
      color: STEM,
      roughness: 0.8,
      detail: 0.008,
      maxTriangles: 250,
    });

    const caps = sdf.union(
      ...shrooms.map((m) =>
        place(
          sdf.ellipsoid([m.capR, m.capR * 0.62, m.capR])
            .at(0, m.len * 0.96, 0)
            .intersect(sdf.halfSpace([0, -1, 0], -(m.len * 0.96 - m.capR * 0.22))),
          m,
        ),
      ),
    );
    // A little top light on each cap: smaller caps sit higher, so a height gradient works.
    k.body(
      'mushroom-caps',
      caps.paintFn((x, y, z, base) => {
        const lit = clamp01((y - 0.18) / 0.06);
        return mixRgb(base, CAP_LIGHT, lit * 0.5);
      }),
      {
        color: CAP_RED,
        roughness: 0.5,
        detail: 0.008,
        paintWeight: 2,
        maxTriangles: 400,
      },
    );
  },
});
