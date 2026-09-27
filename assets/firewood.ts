import { defineAsset, mixRgb, noise, profile, rgb, sdf, type Rgb, type Sdf } from '../src/index.js';

/**
 * Design note — firewood stack (props/world/firewood).
 *
 * Role: background village prop for the Chibi Quest hamlet; must read at 128 px.
 * Size: the stack is 1.0 m long (X), 0.5 m deep (Z) and 0.6 m tall (Y). The logs lie along Z,
 *   so their cut ends face +Z in one broad pale plane. Stands on y = 0, centred on the Y axis.
 * One idea: a wide, chunky heap of 12 split logs whose big pale cut ends fill the front face,
 *   each ringed by a dark bark rim — a warm wooden wall you could stack by a cottage door.
 * Shape language: round dominant (fat round logs, soft bevels on every rim), square secondary
 *   (the flat pale cut faces and the flat base).
 * Palette: bark warm brown #8a5a35 (dominant) with dark #6b4226 and light #a4713f variation
 *   per log; pale cut wood #dcbb85 (secondary, the focal plane) with ring #a87d4b and a hint
 *   of #6b4226 at the rim. No emissive, no metal.
 * Materials: one wood body (roughness 0.85, metalness 0). Bark grooves and growth rings go in
 *   `bump`; `displace` only grows the round bark lumps.
 * Detail list: 12 fat logs in three nested rows (primary); pale ringed cut ends and a per-log
 *   bark tint (secondary, focal point); bark grooves (small).
 * Rig/animation: none.
 */

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

const BARK = rgb('#8a5a35');
const BARK_DARK = rgb('#6b4226');
const BARK_DEEP = rgb('#4a2e1c');
const BARK_LIGHT = rgb('#a4713f');
const CUT = rgb('#c9a06a');
const CUT_LIGHT = rgb('#dcbb85');
const CUT_RING = rgb('#a87d4b');

const EDGE_ROUND = 0.012;

type LogDef = { x: number; y: number; r: number; len: number; rot: number; seed: number };

// Three nested rows (5 + 4 + 3), touching so the wall has no see-through gaps. Lengths vary a
// little so the cut ends do not sit in one perfectly flat plane.
const LOGS: LogDef[] = [
  { x: -0.38, y: 0.107, r: 0.107, len: 0.5, rot: 8, seed: 1 },
  { x: -0.19, y: 0.105, r: 0.105, len: 0.47, rot: 52, seed: 2 },
  { x: 0.0, y: 0.107, r: 0.107, len: 0.5, rot: 95, seed: 3 },
  { x: 0.19, y: 0.105, r: 0.105, len: 0.46, rot: 141, seed: 4 },
  { x: 0.38, y: 0.107, r: 0.107, len: 0.49, rot: 188, seed: 5 },
  { x: -0.285, y: 0.2976, r: 0.106, len: 0.5, rot: 233, seed: 6 },
  { x: -0.095, y: 0.2976, r: 0.106, len: 0.47, rot: 279, seed: 7 },
  { x: 0.095, y: 0.2976, r: 0.106, len: 0.48, rot: 322, seed: 8 },
  { x: 0.285, y: 0.2976, r: 0.106, len: 0.5, rot: 9, seed: 9 },
  { x: -0.19, y: 0.4882, r: 0.105, len: 0.49, rot: 57, seed: 10 },
  { x: 0.0, y: 0.4882, r: 0.105, len: 0.5, rot: 103, seed: 11 },
  { x: 0.19, y: 0.4882, r: 0.105, len: 0.47, rot: 149, seed: 12 },
];

// Each log gets its own bark value so neighbours separate at 128 px.
const LOG_TONE = LOGS.map((_l, i) => clamp01(0.16 + 0.72 * noise.random(i * 3 + 1, 5, 9)));

// A wobbly rounded cross-section, so the logs read as split wood, not pipes.
const logProfile = (r: number, seed: number) => {
  const pts: Array<[number, number]> = [];
  const n = 9;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const j = 0.85 + 0.2 * noise.random(seed * 13 + i, 3, 7);
    pts.push([Math.cos(a) * r * j, Math.sin(a) * r * j]);
  }
  return profile.polygon(pts, { smooth: true, samples: 5 });
};

// 0 on the bark flank, 1 on the flat cut faces at the log's two ends.
const endWeight = (z: number, h: number): number => clamp01((Math.abs(z) - (h - 0.014)) / 0.012);

const groove = (x: number, y: number, z: number): number =>
  noise.fbm(x * 32, y * 32, z * 3.2, 3, 7) + 0.35 * noise.fbm(x * 84, y * 84, z * 7, 2, 23);

const nearest = (x: number, y: number): { i: number; d: number; log: LogDef } => {
  let d = Infinity;
  let i = 0;
  for (let j = 0; j < LOGS.length; j++) {
    const l = LOGS[j]!;
    const dd = Math.hypot(x - l.x, y - l.y);
    if (dd < d) {
      d = dd;
      i = j;
    }
  }
  return { i, d, log: LOGS[i]! };
};

const woodPaint = (x: number, y: number, z: number, _base: Rgb): Rgb => {
  const { i, d, log } = nearest(x, y);
  let c = mixRgb(BARK_DARK, BARK_LIGHT, LOG_TONE[i]!);
  // Big weathered patches, then grooves along the log so paint lines up with the bump.
  const pat = 0.5 + 0.5 * noise.fbm(x * 5, y * 5, z * 1.4, 2, 31);
  c = mixRgb(c, BARK, 0.35 + 0.3 * pat);
  const g = groove(x, y, z);
  c = mixRgb(c, BARK_DEEP, clamp01((-g - 0.05) * 2.6) * 0.7);
  c = mixRgb(c, BARK_LIGHT, clamp01((g - 0.1) * 2.2) * 0.35);
  // Damp shaded underside near the ground.
  c = mixRgb(c, BARK_DEEP, clamp01((0.32 - y) / 0.32) * 0.32);

  const ew = endWeight(z, log.len / 2);
  if (ew > 0.004) {
    // Pale cut wood, faint growth rings, darker ring where it meets the bark rim.
    const ring = 0.5 + 0.5 * Math.sin(d * 210 + noise.fbm(x * 26, y * 26, z * 26, 2, 41) * 1.7);
    let pc = mixRgb(CUT_LIGHT, CUT, 0.35 + ring * 0.35);
    pc = mixRgb(pc, CUT_RING, clamp01((d - log.r * 0.5) / (log.r * 0.4)) * 0.35);
    pc = mixRgb(pc, BARK_DARK, clamp01((d - log.r * 0.74) / (log.r * 0.16)) * 0.6);
    c = mixRgb(c, pc, ew * clamp01((log.r * 0.82 - d) / 0.012));
  }
  return c;
};

const woodBump = (x: number, y: number, z: number): number => {
  const { log } = nearest(x, y);
  const ew = endWeight(z, log.len / 2);
  let b = 0.005 * groove(x, y, z) * (1 - ew);
  b += 0.0016 * noise.fbm(x * 66, y * 66, z * 66, 2, 5) * (1 - 0.6 * ew);
  b += -0.0015 * ew; // cut faces sit a touch proud of the bark
  return b;
};

export default defineAsset({
  name: 'firewood',
  description:
    'Neat stack of 12 split firewood logs, 1.0 m long, 0.5 m deep, 0.6 m tall, with pale ringed cut ends and rough bark.',
  detail: 0.03,
  texture: { size: 1024 },
  reference: 'docs/item-mockups/firewood-mock.jpg',

  build(k) {
    const shapes: Sdf[] = LOGS.map((l) => {
      const log = sdf.extrude(logProfile(l.r, l.seed), l.len, EDGE_ROUND).rotateZ(l.rot).at(l.x, l.y, 0);
      // Chunky round bark lumps, faded to nothing at the flat cut faces.
      const h = l.len / 2;
      return log.displace(0.007, (x, y, z) => {
        const damp = clamp01((h - 0.05 - Math.abs(z)) / 0.05);
        return (
          (0.5 * noise.fbm(x * 8, y * 8, z * 3, 2, 51) + 0.4 * noise.fbm(x * 24, y * 24, z * 7, 2, 61)) *
          damp
        );
      });
    });
    const pile = sdf.union(...shapes).intersect(sdf.halfSpace([0, -1, 0], 0));

    k.body('logs', pile.paintFn(woodPaint), {
      color: BARK,
      roughness: 0.85,
      metalness: 0,
      detail: 0.03,
      paintWeight: 2,
      textureDensity: 2,
      bump: woodBump,
      maxTriangles: 4600,
    });
  },
});
