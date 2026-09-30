import { defineAsset, mixRgb, noise, profile, rgb, sdf, type Rgb, type Sdf } from '../src/index.js';

/**
 * Design note — forest campfire (catalog `forest/prop/campfire`).
 *
 * Role: small warming fire prop and the map's only warm accent; must read at the 128 px sprite.
 * Size: ~0.7 m wide stone ring, flame tip about 0.46 m tall (footprint kept); stands on y = 0, faces +Z. No rig.
 * One idea: a ring of chunky rounded stones cradling a cluster of orange tongues with a yellow core, with split logs
 *   leaning together into the fire. The flame is the single focal point.
 * Shape language: round/soft dominant (rounded stones, D-section logs, flame belly) with one
 *   pointed accent (the flame tip) for a readable silhouette.
 * Palette: cool gray stone #8a94a0 (dominant), warm bark #8a5a35 / dark #5f3d22, pale cut wood
 *   #c9a06a, pale ash #cfc9bd, char #3a342e; flame orange #ff7a1a, core #ffd23a, embers #ff5a1a (emissive 0.5-0.7).
 *   Value plan: mid-gray stones, dark log undersides and char, bright emissive flame focal point.
 * Materials: stone (rough 0.9), wood (rough 0.82), ash (rough 0.95), flame + embers (emissive).
 * Detail list: primary 9 stones + 4 leaning split logs + ash bed; secondary teardrop flame;
 *   tertiary 3 ember dots and the warm glow painted on the stones near the fire.
 * Rig/animation: none (static prop).
 */

const STONE = rgb('#8a8580');
const STONE_DARK = rgb('#57524d');
const STONE_LIGHT = rgb('#a8a39c');
const WOOD = rgb('#8a5a35');
const WOOD_DARK = rgb('#5f3d22');
const WOOD_CUT = rgb('#c9a06a');
const ASH_LIGHT = rgb('#cfc9bd');
const ASH_DARK = rgb('#8f887c');
const CHAR = rgb('#2a1e18');
const FLAME = rgb('#ff9a3c');
const FLAME_HOT = rgb('#ffd98a');
const GLOW = rgb('#d97e33');

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

const STONES = 9;
const STONE_RING = 0.245;
const LOGS = 4;
const LOG_L = 0.22;
const LOG_R = 0.038;
const LOG_RING = 0.235;
const LOG_LEAN = 61; // degrees from vertical; shallow, so the tips meet low over the ash

/** A chunky rounded stone at azimuth `a` (radians); varied by index for a natural scatter. */
function stoneAt(a: number, i: number): Sdf {
  const ring = STONE_RING + (noise.random(i, 1) - 0.5) * 0.03;
  const rx = 0.056 + noise.random(i, 2) * 0.022;
  const ry = 0.036 + noise.random(i, 3) * 0.016;
  const rz = 0.052 + noise.random(i, 4) * 0.022;
  // Main lump plus a smaller shoulder, softly merged so each stone is one rounded form.
  const lump = sdf.ellipsoid([rx, ry, rz]);
  const shoulder = sdf.ellipsoid([rx * 0.6, ry * 0.6, rz * 0.6]).at(
    (noise.random(i, 5) - 0.5) * rx * 0.7,
    ry * 0.45,
    (noise.random(i, 6) - 0.5) * rz * 0.7,
  );
  let stone = lump.smoothUnion(0.018, shoulder);
  for (let c = 0; c < 3; c++) {
    const az = noise.random(i, 40 + c) * Math.PI * 2;
    const el = 0.25 + noise.random(i, 50 + c) * 0.9;
    const n: [number, number, number] = [Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el)];
    stone = stone.smoothIntersect(0.006, sdf.halfSpace(n, Math.min(rx, rz) * (0.72 + noise.random(i, 60 + c) * 0.1)));
  }
  return stone
    .rotate(noise.random(i, 7) * 50 - 25, noise.random(i, 8) * 360, noise.random(i, 9) * 40 - 20)
    .at(Math.cos(a) * ring, ry * 0.72, Math.sin(a) * ring);
}

/**
 * A split log lying along its local Y axis. One flat face (local +X) is cut and painted pale,
 * so leaning it flat-side up shows the split wood, as on the reference campfire.
 */
function splitLogLocal(): Sdf {
  const body = sdf.capsule([0, -LOG_L / 2, 0], [0, LOG_L / 2, 0], LOG_R);
  const c = LOG_R * 0.38;
  const flatCut = sdf.halfSpace([-1, 0, 0], -c); // removes x >= c
  const cut = body.subtract(flatCut);
  const bark = (x: number, y: number, z: number, base: Rgb): Rgb => {
    const grain = noise.fbm(x * 40, y * 6, z * 40, 3);
    let color = mixRgb(WOOD_DARK, base, clamp01(0.68 + 0.32 * (0.5 + 0.5 * grain)));
    const patch = noise.fbm(x * 11, y * 3, z * 11, 2);
    color = mixRgb(color, WOOD, clamp01(0.5 + 0.5 * patch) * 0.25);
    color = mixRgb(color, WOOD_DARK, clamp01(-patch) * 0.18);
    return color;
  };
  const splitFace = sdf.halfSpace([-1, 0, 0], -(c - 0.001)); // surface x >= c
  const tip = sdf.halfSpace([0, 1, 0], LOG_L / 2 - 0.05); // inner end, charred by the fire
  return cut.paintFn(bark).paintWhere(splitFace, WOOD_CUT, 0.004).paintWhere(tip, CHAR, 0.02);
}

export default defineAsset({
  name: 'campfire',
  description:
    'A small forest campfire: a ring of chunky rounded stones around a shallow ash bed, four split logs leaning together, a cluster of orange flame tongues around a yellow core, an ember bed with coals, and a few glowing embers.',
  detail: 0.01,
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ stone ring
    const stones: Sdf[] = [];
    for (let i = 0; i < STONES; i++) {
      const a = ((i + 0.5) / STONES) * Math.PI * 2;
      stones.push(stoneAt(a, i));
    }
    const stoneShape = sdf.union(...stones).intersect(sdf.halfSpace([0, -1, 0], 0));
    const stonePaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      const t = clamp01(y / 0.075);
      let color = mixRgb(STONE_DARK, base, clamp01(0.15 + t * 0.85));
      color = mixRgb(color, STONE_LIGHT, clamp01((t - 0.45) / 0.5) * 0.85);
      const n = noise.fbm(x * 9, y * 9, z * 9, 3);
      color = mixRgb(color, STONE_DARK, clamp01(-n) * 0.38);
      color = mixRgb(color, STONE_LIGHT, clamp01(n) * 0.14);
      return color;
    };
    const stonesBody = stoneShape
      .paintFn(stonePaint)
      // Warm glow from the fire, painted softly on the stones facing the flames.
      .paintWhere(sdf.sphere(0.185).at(0, 0.06, 0), GLOW, 0.07);
    k.body('stones', stonesBody, {
      color: STONE,
      roughness: 0.9,
      metalness: 0,
      detail: 0.01,
      maxTriangles: 1600,
      paintWeight: 3,
      bump: (x, y, z) =>
        0.002 * noise.fbm(x * 30, y * 30, z * 30, 3, 7) + 0.0008 * noise.noise3(x * 90, y * 90, z * 90, 11),
    });

    // ------------------------------------------------------------------ ash bed
    const ashShape = sdf.cylinder(0.215, 0.055, 0.03).at(0, 0.027, 0);
    const ashPaint = (x: number, y: number, z: number): Rgb => {
      const r = Math.hypot(x, z);
      let color = mixRgb(ASH_DARK, ASH_LIGHT, clamp01(0.45 + 0.55 * (1 - r / 0.215)));
      const n = noise.fbm(x * 24, y * 24, z * 24, 3);
      color = mixRgb(color, ASH_LIGHT, clamp01(n) * 0.25);
      color = mixRgb(color, CHAR, clamp01(-n) * 0.42);
      // Charred patch under the fire.
      color = mixRgb(color, CHAR, clamp01((0.11 - r) / 0.11) * 0.6);
      return color;
    };
    const ashBody = ashShape
      .paintFn(ashPaint)
      .paintWhere(sdf.sphere(0.095).at(0, 0.05, 0), GLOW, 0.05);
    k.body('ash', ashBody, {
      color: '#cfc9bd',
      roughness: 0.95,
      metalness: 0,
      detail: 0.02,
      maxTriangles: 300,
      paintWeight: 2,
      bump: (x, y, z) => 0.0016 * noise.fbm(x * 60, y * 60, z * 60, 3, 5),
    });

    // ------------------------------------------------------------------ split logs
    const logs: Sdf[] = [];
    for (let i = 0; i < LOGS; i++) {
      const a = (i / LOGS) * Math.PI * 2 + Math.PI / 4;
      const lean = LOG_LEAN + (noise.random(i, 21) - 0.5) * 6;
      const phi = (lean * Math.PI) / 180;
      const d: [number, number, number] = [
        -Math.sin(phi) * Math.cos(a),
        Math.cos(phi),
        -Math.sin(phi) * Math.sin(a),
      ];
      const base: [number, number, number] = [Math.cos(a) * LOG_RING, 0.03, Math.sin(a) * LOG_RING];
      const mid: [number, number, number] = [
        base[0] + (d[0] * LOG_L) / 2,
        base[1] + (d[1] * LOG_L) / 2,
        base[2] + (d[2] * LOG_L) / 2,
      ];
      logs.push(splitLogLocal().rotateZ(lean).rotateY(-a).at(mid[0], mid[1], mid[2]));
    }
    const logShape = sdf
      .union(...logs)
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .paintWhere(sdf.sphere(0.135).at(0, 0.06, 0), GLOW, 0.05);
    k.body('logs', logShape, {
      color: '#8a5a35',
      roughness: 0.82,
      metalness: 0,
      detail: 0.009,
      maxTriangles: 900,
      paintWeight: 3,
      bump: (x, y, z) => 0.0018 * noise.fbm(x * 50, y * 14, z * 50, 3, 3),
    });

    // ------------------------------------------------------------------ flame tongues
    // [x, z, height, base radius, lean x, lean z]: ring of tongues around a central core
    const RING = 0.095;
    const ringH = [0.39, 0.27, 0.31, 0.24, 0.29];
    const tongues: Array<readonly [number, number, number, number, number, number]> = ringH.map((h, i) => {
      const a = (i / ringH.length) * Math.PI * 2 + 0.4;
      return [Math.cos(a) * RING, Math.sin(a) * RING, h, 0.042, -Math.cos(a) * 0.03, -Math.sin(a) * 0.03] as const;
    });
    const tongue = (t: readonly number[], scale: number): Sdf => {
      const [x, z, h, r, lx, lz] = t;
      const y0 = 0.045;
      return sdf.chain(
        [
          [x, y0, z, r * scale],
          [x + lx * 0.4, y0 + h * 0.35, z + lz * 0.4, r * 0.82 * scale],
          [x + lx * 0.9, y0 + h * 0.7, z + lz * 0.9, r * 0.45 * scale],
          [x + lx * 1.4, y0 + h, z + lz * 1.4, 0.008],
        ],
        0.02,
      );
    };
    const outer = sdf.smoothUnion(0.02, ...tongues.map((t) => tongue(t, 1)));
    k.body('flame', outer.paint(rgb('#ff7a1a')), {
      color: '#ff7a1a',
      roughness: 0.5,
      metalness: 0,
      emissive: '#ff7a1a',
      emissiveIntensity: 0.6,
      detail: 0.006,
      maxTriangles: 1800,
    });
    const coreShape = tongue([0, 0, 0.34, 0.058, 0.004, -0.004], 1);
    k.body('flame-core', coreShape.paint(rgb('#ffd23a')), {
      color: '#ffd23a',
      roughness: 0.5,
      metalness: 0,
      emissive: '#ffd23a',
      emissiveIntensity: 0.7,
      detail: 0.006,
      maxTriangles: 1000,
    });

    // ------------------------------------------------------------------ embers and coals
    const bed = sdf.cylinder(0.15, 0.03, 0.012).at(0, 0.058, 0);
    k.body('embers', bed.paint(rgb('#ff5a1a')), {
      color: '#ff5a1a',
      roughness: 0.6,
      metalness: 0,
      emissive: '#ff5a1a',
      emissiveIntensity: 0.5,
      detail: 0.008,
      maxTriangles: 500,
    });
    const coalSpots: ReadonlyArray<readonly [number, number, number]> = [
      [0.1, 0.07, 0.04],
      [-0.09, 0.07, 0.07],
      [0.03, 0.07, 0.11],
      [-0.06, 0.07, -0.09],
      [0.09, 0.07, -0.07],
    ];
    const coals = sdf.union(
      ...coalSpots.map((p, i) =>
        sdf
          .ellipsoid([0.032 + noise.random(i, 31) * 0.01, 0.022, 0.028])
          .rotateY(noise.random(i, 32) * 180)
          .at(p[0], p[1], p[2]),
      ),
    );
    k.body('coals', coals.paint(rgb('#2a1e18')), {
      color: '#2a1e18',
      roughness: 0.95,
      metalness: 0,
      detail: 0.008,
      maxTriangles: 400,
      bump: (x, y, z) => 0.002 * noise.fbm(x * 50, y * 50, z * 50, 3, 4),
    });
  },
});
