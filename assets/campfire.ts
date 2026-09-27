import { defineAsset, mixRgb, noise, profile, rgb, sdf, type Rgb, type Sdf } from '../src/index.js';

/**
 * Design note — forest campfire (catalog `forest/prop/campfire`).
 *
 * Role: small warming fire prop and the map's only warm accent; must read at the 128 px sprite.
 * Size: ~0.7 m wide stone ring, flame tip about 0.24 m tall; stands on y = 0, faces +Z. No rig.
 * One idea: a ring of chunky rounded stones cradling a bright teardrop flame, with split logs
 *   leaning together into the fire. The flame is the single focal point.
 * Shape language: round/soft dominant (rounded stones, D-section logs, flame belly) with one
 *   pointed accent (the flame tip) for a readable silhouette.
 * Palette: cool gray stone #8a94a0 (dominant), warm bark #8a5a35 / dark #5f3d22, pale cut wood
 *   #c9a06a, pale ash #cfc9bd, char #3a342e; warm accent flame #ff9a3c (emissive, intensity 2).
 *   Value plan: mid-gray stones, dark log undersides and char, bright emissive flame focal point.
 * Materials: stone (rough 0.9), wood (rough 0.82), ash (rough 0.95), flame + embers (emissive).
 * Detail list: primary 9 stones + 4 leaning split logs + ash bed; secondary teardrop flame;
 *   tertiary 3 ember dots and the warm glow painted on the stones near the fire.
 * Rig/animation: none (static prop).
 */

const STONE = rgb('#7d8794');
const STONE_DARK = rgb('#4b545f');
const STONE_LIGHT = rgb('#9ba5b1');
const WOOD = rgb('#8a5a35');
const WOOD_DARK = rgb('#5f3d22');
const WOOD_CUT = rgb('#c9a06a');
const ASH_LIGHT = rgb('#cfc9bd');
const ASH_DARK = rgb('#8f887c');
const CHAR = rgb('#332d28');
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
  const stone = lump.smoothUnion(0.018, shoulder);
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
  const tip = sdf.halfSpace([0, 1, 0], LOG_L / 2 - 0.01); // inner end, charred by the fire
  return cut.paintFn(bark).paintWhere(splitFace, WOOD_CUT, 0.004).paintWhere(tip, CHAR, 0.008);
}

export default defineAsset({
  name: 'campfire',
  description:
    'A small forest campfire: a ring of chunky rounded stones around a shallow ash bed, four split logs leaning together, a bright teardrop flame, and a few glowing embers.',
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
      const t = clamp01(y / 0.08);
      let color = mixRgb(STONE_DARK, base, clamp01(0.3 + t * 0.7));
      color = mixRgb(color, STONE_LIGHT, clamp01((t - 0.5) / 0.5) * 0.5);
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
      maxTriangles: 1500,
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

    // ------------------------------------------------------------------ flame
    const flameProfile = profile.polygon(
      [
        [0, 0],
        [0.03, 0.007],
        [0.053, 0.034],
        [0.062, 0.075],
        [0.057, 0.115],
        [0.042, 0.156],
        [0.019, 0.19],
        [0, 0.204],
      ],
      { smooth: true, samples: 10 },
    );
    const flameShape = sdf.revolve(flameProfile).at(0, 0.038, 0);
    const flamePaint = (x: number, y: number, z: number): Rgb => {
      let color = FLAME;
      const t = clamp01((y - 0.038) / 0.204);
      const r = Math.hypot(x, z);
      const core = clamp01((0.055 - r) / 0.055) * clamp01(1 - t * 1.6);
      color = mixRgb(color, FLAME_HOT, core * 0.45);
      return color;
    };
    k.body('flame', flameShape.paintFn(flamePaint), {
      color: '#ff9a3c',
      roughness: 0.45,
      metalness: 0,
      emissive: '#ff9a3c',
      emissiveIntensity: 3,
      detail: 0.007,
      maxTriangles: 380,
      paintWeight: 3,
    });

    // ------------------------------------------------------------------ embers
    const spots: ReadonlyArray<readonly [number, number, number]> = [
      [0.14, 0.062, 0.0],
      [0.0, 0.062, 0.14],
      [-0.13, 0.058, -0.05],
    ];
    const emberShape = sdf.union(
      ...spots.map((p, i) => sdf.sphere(0.013 + noise.random(i, 31) * 0.005).at(p[0], p[1], p[2])),
    );
    k.body('embers', emberShape, {
      color: '#ffb257',
      roughness: 0.5,
      metalness: 0,
      emissive: '#ff9a3c',
      emissiveIntensity: 2.4,
      detail: 0.006,
      maxTriangles: 150,
    });
  },
});
