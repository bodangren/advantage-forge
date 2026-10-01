import { profile, rgb, sdf, type Part, type Vec3 } from '../../src/index.js';

/**
 * Enchanter scroll and its magic (parts of `assets/enchanter.ts`; standalone
 * `assets/enchanter-scroll.ts`).
 *
 * A cream sheet 0.16 m wide and 0.3 m long hangs from a roll, with a pink glow at its edges.
 * Local frame of `enchanterScroll`: the origin is the roll center, the roll axis along Z, the
 * sheet hanging down to y = -0.3 and facing +X (the host turns it with `scrollPose`).
 * `enchanterScrollFlame` (the character frame shifted by `FLAME_MOUNT`; the host shifts it back; the standalone turns it by `FLAME_YAW`): a pink flame rising 0.235 m above the roll, and three
 * sparks above it, on the `orb` bone that the clips scale.
 * Bodies: scroll (bone `hand.L`); flame, sparks (bone `orb`). Tint slots: none.
 */

const C = { paper: '#f4ecd8', glow: '#ff7ad8', spark: '#f080e0', sparkBase: '#501040' };

// The enchanter's frame: the roll center and the scroll yaw (assets/enchanter.ts).
const WRIST_L: Vec3 = [0.258, 0.35, 0.07];
const HAND_L_YAW = -40;
const SCROLL_YAW = 72;
const rotY = (p: Vec3, d: number): Vec3 => {
  const c = Math.cos((d * Math.PI) / 180);
  const s = Math.sin((d * Math.PI) / 180);
  return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c];
};
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const ROLL_C: Vec3 = add(WRIST_L, rotY([0.1, 0.034, 0], HAND_L_YAW));
const scrollPoint = (p: Vec3): Vec3 => add(rotY(p, SCROLL_YAW), ROLL_C);
/** The roll center rounded to 1/1024 m. The flame part is in the character frame, shifted by it. */
export const FLAME_MOUNT = ROLL_C.map((v) => Math.round(v * 1024) / 1024) as unknown as Vec3;
/** The flame part turns the character frame back to the scroll frame (the standalone uses it). */
export const FLAME_YAW = SCROLL_YAW;
const STRIP = { y0: -0.3, y1: 0, w: 0.16, half: 0.006 };
const stripX = (y: number) => {
  const t = (y - STRIP.y0) / (STRIP.y1 - STRIP.y0);
  return 0.02 * Math.sin(t * Math.PI * 1.4) * Math.min(1, (1 - t) * 3);
};
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function enchanterScroll(): Part {
  const roll = sdf.cylinder(0.02, STRIP.w + 0.008, 0.006).rotateX(90);
  const stripPts: [number, number][] = [];
  const N = 18;
  for (let i = 0; i <= N; i++) {
    const y = STRIP.y0 + ((STRIP.y1 - STRIP.y0) * i) / N;
    stripPts.push([stripX(y) - STRIP.half, y]);
  }
  for (let i = N; i >= 0; i--) {
    const y = STRIP.y0 + ((STRIP.y1 - STRIP.y0) * i) / N;
    stripPts.push([stripX(y) + STRIP.half, y]);
  }
  const strip = sdf.extrude(profile.polygon(stripPts), STRIP.w, 0.003);
  const paperC = rgb(C.paper);
  const glowC = rgb(C.glow);
  const scroll = sdf.smoothUnion(0.006, roll, strip).paintFn((x, y, z) => {
    const e = 0.35 * smooth(STRIP.w / 2 - 0.014, STRIP.w / 2, Math.abs(z));
    return [paperC[0] + (glowC[0] - paperC[0]) * e, paperC[1] + (glowC[1] - paperC[1]) * e, paperC[2] + (glowC[2] - paperC[2]) * e] as const;
  });
  return {
    name: 'enchanter-scroll',
    bodies: [{ name: 'scroll', shape: scroll, options: { color: C.paper, roughness: 0.7, detail: 0.003 }, bone: 'hand.L' }],
  };
}

export function enchanterScrollFlame(): Part {
  const flameLocal: [number, number, number, number][] = [
    [0, 0.03, 0, 0.032],
    [0.014, 0.09, 0, 0.025],
    [-0.014, 0.15, 0, 0.015],
    [0.016, 0.2, 0, 0.008],
    [0, 0.235, 0, 0.002],
  ];
  const flame = sdf.chain(flameLocal.map(([x, y, z, r]) => [...scrollPoint([x, y, z]), r] as [number, number, number, number]), 0.02).at(-FLAME_MOUNT[0], -FLAME_MOUNT[1], -FLAME_MOUNT[2]);
  const p = (x: number, y: number, z: number): Vec3 => scrollPoint([x, y, z]);
  const sparks = sdf.union(
    sdf.sphere(0.016).at(...p(0.034, 0.27, 0)),
    sdf.sphere(0.012).at(...p(-0.03, 0.3, 0.01)),
    sdf.sphere(0.01).at(...p(0.02, 0.325, -0.01)),
  ).at(-FLAME_MOUNT[0], -FLAME_MOUNT[1], -FLAME_MOUNT[2]);
  return {
    name: 'enchanter-scroll-flame',
    bodies: [
      { name: 'flame', shape: flame, options: { color: C.glow, roughness: 0.4, emissive: C.glow, emissiveIntensity: 0.6, opacity: 0.6, detail: 0.003 }, bone: 'orb' },
      { name: 'sparks', shape: sparks, options: { color: C.sparkBase, roughness: 0.4, emissive: C.spark, emissiveIntensity: 1.4, opacity: 0.8, detail: 0.003 }, bone: 'orb' },
    ],
  };
}
