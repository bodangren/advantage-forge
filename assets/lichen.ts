import { defineAsset, mixRgb, noise, rgb, sdf, type Rgb, type Sdf } from '../src/index.js';

/**
 * Lichen stone — Chibi Quest forest-floor dressing (catalog `nature/plants/lichen`).
 *
 * - Role: low ground dressing / a little landmark in the clearing; must read at 128 px.
 *   Static prop, no rig, no clips.
 * - Size: stone 0.60 m wide, ~0.49 m deep, ~0.27 m tall, on y = 0, centred on the Y axis,
 *   front toward +Z. Lichen rosettes add ~0.013 m of relief on top.
 * - One idea: one fat, smooth river stone carrying a thick pale green-yellow lichen rosette
 *   like a flower, with smaller crusty orange rosettes scattered around its rim.
 * - Shape language: round dominant (pillow stone, blobby lichen lobes); soft bevels only.
 * - Palette: stone grey #848990 (dominant) with light #9ca0a6 and dark #60646b;
 *   lichen green-yellow #b9cb63 (secondary) with light #d6e290 and dark #82993f;
 *   lichen orange accent #e39a34 with light #f2bd63 and dark #bd6d1c.
 *   Value plan: mid-grey stone mass, lighter green rosette, small orange accents.
 * - Materials: stone (roughness 0.92, grain in bump); lichen crust (roughness 0.95, lumpy
 *   low-frequency displacement + fine crust in bump). No metal, no emissive (nothing glows).
 * - Detail: (1) pillow stone with lumpy displacement, (2) green rosette with radiating lobes,
 *   (3) orange blobs and dots at the rim. Focal point: the green rosette.
 * - Budget: per-body `maxTriangles` keeps the final build under 3,000 triangles.
 */

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

const C = {
  stone: '#848990',
  stoneLight: '#9ca0a6',
  stoneDark: '#60646b',
  green: '#b9cb63',
  greenLight: '#d6e290',
  greenDark: '#82993f',
  orange: '#e39a34',
  orangeLight: '#f2bd63',
  orangeDark: '#bd6d1c',
};

const STONE = rgb(C.stone);
const STONE_LIGHT = rgb(C.stoneLight);
const STONE_DARK = rgb(C.stoneDark);
const GREEN = rgb(C.green);
const GREEN_LIGHT = rgb(C.greenLight);
const GREEN_DARK = rgb(C.greenDark);
const ORANGE = rgb(C.orange);
const ORANGE_LIGHT = rgb(C.orangeLight);
const ORANGE_DARK = rgb(C.orangeDark);

/**
 * Half extents of the flat pillow stone: 0.60 m wide, 0.49 m deep, top near 0.26 m. A low,
 * wide pebble: the flattened top gives the lichen rosette a calm plate to sit on.
 */
const RX = 0.3;
const RY = 0.15;
const RZ = 0.245;
const CY = 0.1;

/** The stone body before the ground cut; also the probe target for placing lichen. */
const stoneCore: Sdf = sdf
  .ellipsoid([RX, RY, RZ])
  .at(0, CY, 0)
  .displace(0.014, (x, y, z) => noise.fbm(x * 5, y * 5, z * 5, 3, 5));

/** Top surface height of the stone at (x, z), so lichen sits on the dome, never floats. */
const topY = (x: number, z: number): number => {
  const hit = sdf.raycast(stoneCore, [x, 1.2, z], [0, -1, 0], 3);
  return hit ? hit[1] : CY + RY;
};

interface RosetteOpts {
  /** Centre on the top of the stone, meters. */
  readonly cx: number;
  readonly cz: number;
  /** Overall radius of the rosette, meters. */
  readonly r: number;
  readonly lobes: number;
  /** Seed so each rosette differs. */
  readonly seed: number;
  /** Half thickness of the crust before sinking, meters. */
  readonly thick: number;
  /** How far the crust is sunk into the stone, meters. */
  readonly sink: number;
}

/**
 * A flat lobed rosette: a soft central disc with wide rounded lobes radiating outward, each lobe
 * placed on the stone surface so it hugs the dome. The crust is sunk into the stone, so only its
 * low crown shows.
 */
const rosette = (o: RosetteOpts): Sdf => {
  const parts: Sdf[] = [];
  parts.push(
    sdf.ellipsoid([o.r * 0.55, o.thick, o.r * 0.55]).at(o.cx, topY(o.cx, o.cz) - o.sink, o.cz),
  );
  for (let i = 0; i < o.lobes; i++) {
    const aDeg = (i * 360) / o.lobes + (noise.random(i, o.seed) - 0.5) * 18;
    const a = (aDeg * Math.PI) / 180;
    const d = o.r * (0.5 + noise.random(i, o.seed + 1) * 0.1);
    const lx = o.cx + Math.cos(a) * d;
    const lz = o.cz + Math.sin(a) * d;
    const ly = topY(lx, lz) - o.sink;
    const len = o.r * (0.4 + noise.random(i, o.seed + 2) * 0.12);
    const wid = o.r * (0.34 + noise.random(i, o.seed + 3) * 0.08);
    const th = o.thick * (0.86 + noise.random(i, o.seed + 4) * 0.26);
    parts.push(sdf.ellipsoid([len, th, wid]).rotateY(-aDeg).at(lx, ly, lz));
  }
  return sdf.smoothUnion(0.02, ...parts);
};

/** A chunky rounded blob cluster (orange lichen): a fat centre with two or three round nubs. */
const blobCluster = (cx: number, cz: number, r: number, n: number, seed: number): Sdf => {
  const parts: Sdf[] = [
    sdf.ellipsoid([r, r * 0.34, r]).at(cx, topY(cx, cz) - r * 0.16, cz),
  ];
  for (let i = 0; i < n; i++) {
    const a = ((i * 360) / n + (noise.random(i, seed) - 0.5) * 40) * (Math.PI / 180);
    const d = r * (0.62 + noise.random(i, seed + 1) * 0.28);
    const lx = cx + Math.cos(a) * d;
    const lz = cz + Math.sin(a) * d;
    const rr = r * (0.5 + noise.random(i, seed + 2) * 0.28);
    parts.push(sdf.ellipsoid([rr, rr * 0.4, rr]).at(lx, topY(lx, lz) - rr * 0.18, lz));
  }
  return sdf.smoothUnion(0.012, ...parts);
};

export default defineAsset({
  name: 'lichen',
  description:
    'A flat rounded grey stone carrying a thick pale green-yellow lichen rosette on top, with smaller crusty orange lichen rosettes and dots around its rim.',
  detail: 0.008,
  reference: 'docs/item-mockups/lichen-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------- stone
    const stone = stoneCore.intersect(sdf.halfSpace([0, -1, 0], 0));

    const stonePaint = (x: number, y: number, z: number): Rgb => {
      const n = noise.fbm(x * 7, y * 7, z * 7, 3, 3);
      const up = clamp01((y - 0.02) / 0.21);
      let c = mixRgb(STONE, STONE_DARK, clamp01(0.42 - n * 0.34));
      c = mixRgb(c, STONE_LIGHT, up * 0.38);
      // A faint warm-cool mottle so the grey is not dead flat.
      c = mixRgb(c, rgb('#9a9788'), clamp01(noise.noise3(x * 16, y * 16, z * 16, 9)) * 0.12);
      // Dark ground contact around the base.
      c = mixRgb(c, STONE_DARK, clamp01((0.04 - y) / 0.05) * 0.5);
      return c;
    };

    k.body('stone', stone.paintFn(stonePaint), {
      color: C.stone,
      roughness: 0.92,
      metalness: 0,
      detail: 0.013,
      paintWeight: 2,
      maxTriangles: 950,
      bump: (x, y, z) =>
        0.0022 * noise.fbm(x * 42, y * 42, z * 42, 2, 8) + 0.0009 * noise.noise3(x * 95, y * 95, z * 95, 4),
    });

    // ------------------------------------------------------------------- green
    // The focal green rosette: a broad flat lobed patch over the crown of the stone.
    const greenPaint = (x: number, y: number, z: number): Rgb => {
      const n = noise.fbm(x * 20, y * 20, z * 20, 2, 11);
      let c = mixRgb(GREEN_DARK, GREEN, clamp01(0.55 + n * 0.5));
      c = mixRgb(c, GREEN_LIGHT, clamp01(noise.fbm(x * 44, y * 44, z * 44, 2, 17) * 0.7 + 0.1));
      return c;
    };
    const green = rosette({ cx: 0.015, cz: 0, r: 0.145, lobes: 5, seed: 4, thick: 0.022, sink: 0.009 })
      .displace(0.003, (x, y, z) => noise.fbm(x * 12, y * 12, z * 12, 2, 23))
      .paintFn(greenPaint);

    k.body('lichen-green', green, {
      color: C.green,
      roughness: 0.95,
      metalness: 0,
      detail: 0.01,
      textureDensity: 2,
      paintWeight: 2,
      maxTriangles: 1000,
      bump: (x, y, z) => 0.0028 * noise.fbm(x * 70, y * 70, z * 70, 2, 31),
    });

    // ------------------------------------------------------------------ orange
    // Smaller chunky orange lichen clusters and dots scattered around the green rosette.
    const orangePaint = (x: number, y: number, z: number): Rgb => {
      const n = noise.fbm(x * 24, y * 24, z * 24, 2, 41);
      let c = mixRgb(ORANGE_DARK, ORANGE, clamp01(0.5 + n * 0.55));
      c = mixRgb(c, ORANGE_LIGHT, clamp01(noise.fbm(x * 55, y * 55, z * 55, 2, 47) * 0.6 + 0.1));
      return c;
    };
    const orange = sdf
      .union(
        blobCluster(-0.16, 0.06, 0.046, 2, 7),
        blobCluster(0.17, 0.02, 0.048, 2, 13),
        blobCluster(-0.02, 0.17, 0.042, 2, 19),
        // Loose dots between the clusters.
        sdf.ellipsoid([0.014, 0.011, 0.013]).at(-0.09, topY(-0.09, 0.15) - 0.005, 0.15),
        sdf.ellipsoid([0.012, 0.01, 0.012]).at(0.22, topY(0.22, -0.04) - 0.004, -0.04),
      )
      .displace(0.002, (x, y, z) => noise.fbm(x * 14, y * 14, z * 14, 2, 53))
      .paintFn(orangePaint);

    k.body('lichen-orange', orange, {
      color: C.orange,
      roughness: 0.95,
      metalness: 0,
      detail: 0.014,
      textureDensity: 2,
      paintWeight: 2,
      maxTriangles: 700,
      bump: (x, y, z) => 0.0026 * noise.fbm(x * 72, y * 72, z * 72, 2, 59),
    });
  },
});
