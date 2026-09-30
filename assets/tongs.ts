import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note — blacksmith tongs (props/blacksmith/tongs), reworked.
 *
 * Role: hand tool in the blacksmith corner; reads at 128 px from above as a
 *   narrow V of reins ending in a pincer around a glowing stub.
 * Size: 0.48 m long, lying flat on y = 0, long axis X, jaws toward +X,
 *   rein tips at -X.
 * One idea: two straight tapered reins spreading 7 degrees each from one
 *   riveted crossing, chunky curved jaws closing on an orange hot stub.
 * Shape language: round dominant, tapered secondary.
 * Palette contract: iron #4a4f55, shadow #363a3f, highlight #a8acb1;
 *   accent glowing orange #ff8c2a stub (focal point).
 * Materials: iron (reins, bolsters, jaws), rivet steel, emissive stub.
 * Detail: primary reins + jaws + rivet; secondary bolster collars, domed
 *   rivet head; tertiary forged grain in bump only.
 * Rig/animation: none.
 */

const IRON = rgb('#4a4f55');
const SHADOW = rgb('#363a3f');
const HIGHLIGHT = rgb('#a8acb1');

const Y = 0.018;
const RX = 0.08; // rivet x
const A = (7 * Math.PI) / 180;
const CA = Math.cos(A);
const SA = Math.sin(A);
const ss = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// +Z arm; mirrored to -Z with a hard copy.
const along = (d: number, r: number): [number, number, number] => [RX - d * CA, Y, d * SA * 1 + 0 * r];
const tip = along(0.3, 0);
const rein = sdf
  .cone([RX, Y, 0], tip, 0.014, 0.009)
  .union(sdf.sphere(0.009).at(tip[0], tip[1], tip[2]));
const b0 = along(0.02, 0);
const b1 = along(0.05, 0);
const bolster = sdf.cone(b0, b1, 0.018, 0.018).round(0.002);
const jaw = sdf.chain(
  [
    [RX, Y, 0.008, 0.016],
    [0.12, Y, 0.031, 0.016],
    [0.16, Y, 0.034, 0.014],
    [0.2, Y, 0.028, 0.012],
    [0.222, Y, 0.024, 0.012],
  ],
  0.01,
);
const arm = sdf.smoothUnion(0.006, rein, bolster, jaw).mirror('z', 0);

const paint = (x: number, y: number, z: number) => {
  let c = IRON;
  c = mixRgb(c, SHADOW, 0.16 * (0.5 + 0.5 * noise.fbm(x * 6 + 7, y * 6, z * 6, 2)));
  c = mixRgb(c, SHADOW, 0.3 * ss(0.03, 0.0, y));
  c = mixRgb(c, HIGHLIGHT, 0.12 * ss(0.026, 0.036, y));
  const dTip = Math.hypot(x - 0.222, y - Y, Math.abs(z) - 0.024);
  c = mixRgb(c, HIGHLIGHT, 0.6 * ss(0.03, 0.008, dTip));
  return c;
};

const disc = sdf.cylinder(0.024, 0.012, 0.003).at(RX, 0.04, 0);
const shaft = sdf.cylinder(0.018, 0.04, 0.003).at(RX, 0.02, 0);
const dome = sdf.sphere(0.014).at(RX, 0.044, 0).intersect(sdf.box([0.05, 0.05, 0.05]).at(RX, 0.071, 0));
const rivetPaint = (_x: number, y: number) => (y > 0.046 ? HIGHLIGHT : mixRgb(IRON, HIGHLIGHT, 0.25));

export default defineAsset({
  name: 'tongs',
  description:
    'Blacksmith tongs lying flat: two tapered iron reins in a narrow V with forged bolsters, a domed rivet, and curved jaws gripping a glowing hot stub.',
  detail: 0.0045,
  reference: 'docs/blacksmith-mockups/blacksmith-quest_001.jpg',
  texture: { size: 1024 },

  build(k) {
    k.body('arms', arm.paintFn(paint), {
      color: '#4a4f55',
      roughness: 0.45,
      metalness: 0.8,
      textureDensity: 2,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 38, y * 38, z * 38, 2),
      maxTriangles: 2400,
    });
    k.body('rivet', shaft.union(disc).union(dome).paintFn((x, y, z) => rivetPaint(x, y)), {
      color: '#4a4f55',
      roughness: 0.35,
      metalness: 0.9,
      detail: 0.004,
      maxTriangles: 700,
    });
    const stub = sdf.box([0.07, 0.024, 0.024], 0.006).at(0.21, Y, 0);
    k.body('stub', stub.paint(rgb('#4a1405')), {
      color: '#4a1405',
      roughness: 0.6,
      emissive: '#ff8c2a',
      emissiveIntensity: 1.8,
      detail: 0.004,
      maxTriangles: 300,
    });
  },
});
