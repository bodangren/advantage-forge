import { defineAsset, mixRgb, noise, profile, rgb, Sdf, sdf } from '../src/index.js';

/**
 * Design note — candle cluster (dungeon/light/candle-cluster).
 *
 * Role: small dungeon light prop; a warm pool of candlelight on cool stone. Reads at 128 px.
 * Size: 0.27 x 0.22 m footprint, 0.26 m tall with flames; stands on y = 0, faces +Z.
 * One idea: four chunky melted candles on one slate shard, one candle bent outward.
 * Shape language: round dominant (fat wax columns, drip runs, teardrop flames),
 *   square secondary (angular slate shard with soft bevels).
 * Palette: slate #4a5d75 (dominant), ivory wax #f0e6d2 (secondary),
 *   warm accent #ff9a3c on the flames and the firelight pool (focal point).
 * Materials: slate stone (rough), ivory wax (satin), burnt wick (matte), emissive flames.
 * Detail: chips + pale worn stone top; wax craters, drip runs, spilled pools; firelight paint.
 * Rig/animation: none (static prop).
 */

const STONE = '#4a5d75';
const STONE_TOP = '#7a8ba0';
const STONE_DARK = '#2a3547';
const GLOW = '#ff9a3c';
const GLOW_SOFT = '#ffb36a';
const WAX = '#f0e6d2';
const WAX_GRIME = '#a8a094';
const WICK = '#2b2622';
const MOSS = '#3fae9a';
const FLAME = '#ff9a3c';
const FLAME_HOT = '#ffe9bd';

const TOP = 0.036; // top face of the stone shard

interface Candle {
  readonly x: number;
  readonly z: number;
  readonly r: number;
  readonly h: number;
  readonly leanZ?: number;
  readonly leanY?: number;
  readonly flameScale: number;
  readonly seed: number;
}

// Bodies keep at least ~6 mm of air between neighbours; only the wax pools touch.
const CANDLES: Candle[] = [
  { x: -0.052, z: -0.045, r: 0.043, h: 0.145, flameScale: 1.0, seed: 1 },
  { x: 0.05, z: -0.05, r: 0.04, h: 0.1, flameScale: 0.92, seed: 2 },
  { x: 0.058, z: 0.05, r: 0.036, h: 0.062, flameScale: 0.8, seed: 3 },
  { x: -0.02, z: 0.04, r: 0.038, h: 0.105, leanZ: 24, leanY: 55, flameScale: 0.85, seed: 4 },
];

const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);

/** Pose a shape built in the candle's local frame (base at y = 0) into the cluster. */
const pose = (shape: Sdf, c: Candle): Sdf => {
  let out = shape;
  if (c.leanZ) out = out.rotateZ(c.leanZ);
  if (c.leanY) out = out.rotateY(c.leanY);
  return out.at(c.x, TOP, c.z);
};

/** World position of a local-frame point on a candle (used for glow falloff). */
const worldPoint = (c: Candle, y: number): [number, number, number] => {
  const rz = ((c.leanZ ?? 0) * Math.PI) / 180;
  const ry = ((c.leanY ?? 0) * Math.PI) / 180;
  const x1 = -y * Math.sin(rz);
  const y1 = y * Math.cos(rz);
  return [c.x + x1 * Math.cos(ry), TOP + y1, c.z - x1 * Math.sin(ry)];
};

const FLAME_CENTERS = CANDLES.map((c) => worldPoint(c, c.h + 0.028));

/** Warm firelight strength at a world point: near a flame, and only on upper surfaces. */
const firelight = (x: number, y: number, z: number, reach: number, lift: number, vScale: number) => {
  let g = 0;
  for (const [fx, fy, fz] of FLAME_CENTERS) {
    const dy = (y - fy) * vScale;
    const d = Math.sqrt((x - fx) ** 2 + dy * dy + (z - fz) ** 2);
    g = Math.max(g, clamp01(1 - d / reach));
  }
  return g * clamp01((y - lift) / 0.012);
};

/** One melted wax column: fat body, uneven lip, carved melt crater, drip runs. */
const candleShape = (c: Candle): Sdf => {
  const { r, h, seed } = c;
  const body = sdf
    // cylinder is origin-centered: stand it on its base
    .cylinder(r, h, Math.min(0.012, r * 0.28))
    .at(0, h / 2, 0)
    // melted lip bulging over the rim
    .smoothUnion(0.012, sdf.torus(r - 0.008, 0.01).at(0, h - 0.006, 0))
    // lopsided melt pool carved into the top
    .smoothSubtract(0.008, sdf.sphere(r * 0.6).at(r * 0.14, h + r * 0.35, -r * 0.08));

  const runs: Sdf[] = [body];
  for (let i = 0; i < 3; i++) {
    const a = noise.random(seed, i, 7) * Math.PI * 2;
    const y = h * (0.36 + 0.46 * noise.random(seed, i, 11));
    const len = 0.014 + noise.random(seed, i, 13) * 0.018;
    const rr = 0.008 + noise.random(seed, i, 17) * 0.003;
    const cx = Math.cos(a) * r * 0.93;
    const cz = Math.sin(a) * r * 0.93;
    // raised run down the wall, plus a bead at its end
    runs.push(sdf.sphere(rr).scale([0.85, 2, 0.85]).at(cx, y, cz));
    runs.push(sdf.sphere(rr * 1.1).scale([1, 1.2, 1]).at(cx, y - len, cz));
  }
  // one lump of wax hanging over the rim
  const la = noise.random(seed, 3, 19) * Math.PI * 2;
  runs.push(
    sdf
      .sphere(0.0095)
      .scale([1.15, 1.5, 1.15])
      .at(Math.cos(la) * r, h - 0.007, Math.sin(la) * r),
  );
  return sdf.smoothUnion(0.011, ...runs);
};

/** Teardrop flame in the candle's local frame, seated on the wick above the crater. */
const flameShape = (c: Candle): Sdf => {
  const s = c.flameScale;
  const y0 = c.h + 0.022;
  return pose(
    sdf.chain(
      [
        [0, y0, 0, 0.021 * s],
        [0.002 * s, y0 + 0.026 * s, 0, 0.014 * s],
        [0.005 * s, y0 + 0.048 * s, 0, 0.009 * s],
        [0.008 * s, y0 + 0.064 * s, 0, 0.005 * s],
      ],
      0.007 * s,
    ),
    c,
  );
};

export default defineAsset({
  name: 'candle-cluster',
  description: 'Four chunky melted candles, one bent, on a slate shard with lit flames.',
  detail: 0.006,
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ slate shard
    const shard = sdf
      .extrude(
        profile.polygon(
          [
            [-0.13, -0.05],
            [-0.07, -0.105],
            [0.03, -0.11],
            [0.125, -0.05],
            [0.13, 0.05],
            [0.05, 0.11],
            [-0.06, 0.1],
            [-0.135, 0.02],
          ],
          { smooth: false },
        ),
        0.036,
        0.014,
      )
      .rotateX(90)
      .at(0, TOP / 2, 0)
      // chipped corners
      .subtract(sdf.sphere(0.026).at(0.118, TOP + 0.006, -0.062))
      .subtract(sdf.sphere(0.022).at(-0.122, TOP + 0.01, 0.062))
      .paintFn((x, y, z, base) => {
        // value plan: dark at the ground, mid sides, pale worn top
        let c = mixRgb(rgb(STONE_DARK), base, clamp01(y / 0.014));
        const top = clamp01((y - 0.008) / (TOP - 0.008));
        c = mixRgb(c, rgb(STONE_TOP), 0.45 * top * top);
        // small warm pool of firelight on the stone under each flame
        const g = firelight(x, y, z, 0.1, 0.014, 0.35);
        c = mixRgb(c, rgb(GLOW), 0.7 * g);
        // one small moss tuft creeping over the back-left edge
        const m = clamp01(1 - Math.hypot(x + 0.09, z + 0.075) / 0.042);
        c = mixRgb(c, rgb(MOSS), 0.45 * m * m);
        return c;
      });
    k.body('stone', shard, {
      color: STONE,
      roughness: 0.92,
      metalness: 0,
      detail: 0.01,
      paintWeight: 2,
      bump: (x, y, z) => 0.0014 * noise.fbm(x * 70, y * 70, z * 70, 2),
      maxTriangles: 850,
    });

    // ------------------------------------------------------------------ wax
    const columns = CANDLES.map((c) => pose(candleShape(c), c));
    const pools = CANDLES.map((c) =>
      sdf.ellipsoid([c.r * 1.1, c.r * 0.24, c.r * 1.1]).at(c.x, TOP + 0.004, c.z),
    );
    // wax that ran off the tall candle and cooled on the stone
    pools.push(sdf.ellipsoid([0.03, 0.008, 0.016]).at(-0.078, TOP + 0.001, -0.072));
    pools.push(sdf.ellipsoid([0.02, 0.007, 0.016]).at(0.06, TOP + 0.001, -0.08));
    const wax = sdf
      .smoothUnion(0.011, sdf.smoothUnion(0.008, ...pools), ...columns)
      .paintFn((x, y, z, base) => {
        // wax grime where the candles meet the stone
        const grime = clamp01((TOP + 0.055 - y) / 0.055);
        let c = mixRgb(base, rgb(WAX_GRIME), 0.55 * grime * grime);
        // warm bounce light from each flame, kept off the wax pools
        c = mixRgb(c, rgb(GLOW_SOFT), 0.4 * firelight(x, y, z, 0.085, TOP + 0.012, 0.5));
        return c;
      });
    k.body('wax', wax, {
      color: WAX,
      roughness: 0.5,
      metalness: 0,
      detail: 0.005,
      paintWeight: 2,
      maxTriangles: 1450,
    });

    // ------------------------------------------------------------------ wicks
    const wick = sdf.smoothUnion(
      0.004,
      ...CANDLES.map((c) => pose(sdf.cylinder(0.0055, 0.028, 0.0015).at(0, c.h - 0.002, 0), c)),
    );
    k.body('wick', wick, {
      color: WICK,
      roughness: 0.9,
      metalness: 0,
      detail: 0.004,
      maxTriangles: 180,
    });

    // ------------------------------------------------------------------ flames
    const flames = sdf
      .smoothUnion(0.006, ...CANDLES.map(flameShape))
      .paintFn((x, y, z, base) => {
        let best = 0;
        let bestD = Infinity;
        for (const [fx, fy, fz] of FLAME_CENTERS) {
          const d = Math.hypot(x - fx, z - fz);
          if (d < bestD) {
            bestD = d;
            best = fy;
          }
        }
        // hot only at the very base of each flame; body stays warm orange
        const t = clamp01((y - best + 0.03) / 0.014);
        return mixRgb(rgb(FLAME_HOT), base, t);
      });
    k.body('flames', flames, {
      color: FLAME,
      roughness: 0.35,
      metalness: 0,
      emissive: GLOW,
      emissiveIntensity: 2,
      detail: 0.005,
      maxTriangles: 400,
    });
  },
});
