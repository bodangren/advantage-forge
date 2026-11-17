// Trial tool: the duck's wing geometry from assets/parts/bird-kind.ts, measured against the body's
// surface. It prints the rotation conventions, then the wing's protrusion for candidate options.
import { sdf } from '../../../src/index.js';

const DEG = Math.PI / 180;

// 1. The rotation conventions of the SDF transforms.
const bar = sdf.ellipsoid([0.2, 0.02, 0.02]).rotateY(90);
console.log('rotateY(90) of a bar along X:', bar.bounds.min, bar.bounds.max);

// 2. The duck's constants (assets/duck.ts and assets/parts/bird-kind.ts).
const B = [0.22, 0.2, 0.34];
const legLength = 0.5;
const DROP = 0.085 * (1 - legLength);
const BODY_C = [0, 0.16 - DROP + B[1], 0];
const WING_ROOT = [B[0] * 0.72, BODY_C[1] + B[1] * 0.4, -0.03];
const CHEST = { c: [0, BODY_C[1] + B[1] * 0.25, 0.01], r: [B[0], B[1] * 0.75, B[2]] };
const ARM_DEG = Math.atan2(0.27, 0.29) / DEG;
const SCALE = 0.437;

/** The body's half width at a point, from the chest ellipsoid. */
function surfaceX(y: number, z: number): number {
  const dy = (y - CHEST.c[1]) / CHEST.r[1];
  const dz = (z - CHEST.c[2]) / CHEST.r[2];
  const k = 1 - dy * dy - dz * dz;
  return k <= 0 ? 0 : CHEST.r[0] * Math.sqrt(k);
}

// The body's real shape: the kind's trunk, with its smooth unions (assets/parts/bird-kind.ts).
const HR = 0.13;
const headForward = 0.04;
const headLift = 0.025;
const neckScale = 1.15;
const HEAD_C = [0, BODY_C[1] + B[1] * 0.78 + HR * 0.62 - headForward * 0.4 + headLift, 0.03 + headForward];
const NECK_AT = [0, BODY_C[1] + B[1] * 0.55, 0.02];
const chest = sdf.ellipsoid([B[0], B[1] * 0.75, B[2]]).at(BODY_C[0], BODY_C[1] + B[1] * 0.25, BODY_C[2] + 0.01);
const belly = sdf.ellipsoid([B[0] * 0.96, B[1] * 0.7, B[2] * 0.96]).at(BODY_C[0], BODY_C[1] - B[1] * 0.3, BODY_C[2] - 0.01);
const neck = sdf.capsule(NECK_AT, [0, HEAD_C[1] - HR * 0.3, HEAD_C[2]], HR * 0.66 * neckScale);
const trunk = sdf.smoothUnion(0.08, chest, belly).smoothUnion(0.05, neck);

/** The body's real surface x at a height and a depth, from a ray along -X. */
function realSurfaceX(y: number, z: number): number {
  const hit = sdf.raycast(trunk, [1, y, z], [-1, 0, 0], 2);
  return hit ? hit[0] : 0;
}

type P = [number, number, number];

const rotZ = (deg: number, p: P): P => {
  const c = Math.cos(deg * DEG);
  const s = Math.sin(deg * DEG);
  return [p[0] * c - p[1] * s, p[0] * s + p[1] * c, p[2]];
};
const rotY = (deg: number, p: P): P => {
  const c = Math.cos(deg * DEG);
  const s = Math.sin(deg * DEG);
  return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c];
};

/** The wing's surface points, in the kind's own coordinates. */
function wingPoints(o: { rest: number; turn: number; scale: number; slim: number; thick: number; out: number }) {
  const LONG = 1 + (1 - o.slim) * 0.8;
  const WS = 1.12 * o.scale;
  const along = (u: number, v: number): P => [
    u * Math.cos(ARM_DEG * DEG) - v * Math.sin(ARM_DEG * DEG),
    u * Math.sin(ARM_DEG * DEG) + v * Math.cos(ARM_DEG * DEG),
    0,
  ];
  const parts = [
    { r: [0.2 * LONG, 0.115 * o.slim, 0.03 * o.thick] as P, c: along(0.17 * LONG, -0.04) },
    { r: [0.085, 0.072 * o.slim, 0.024 * o.thick] as P, c: along(0.3 * LONG, -0.035) },
  ];
  const out: { p: P; tag: string }[] = [];
  for (const [pi, part] of parts.entries()) {
    const local: P[] = [];
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      for (let j = 0; j < 12; j++) {
        const b = (j / 12) * Math.PI * 2;
        local.push([
          part.c[0] + part.r[0] * Math.cos(a) * Math.cos(b),
          part.c[1] + part.r[1] * Math.sin(b),
          part.c[2] + part.r[2] * Math.sin(a) * Math.cos(b),
        ]);
      }
    }
    for (const p of local) {
      const z1 = rotZ(o.rest, p);
      const s1: P = [z1[0] * WS, z1[1] * WS, z1[2] * WS];
      const y1 = rotY(o.turn, s1);
      out.push({ p: [y1[0] + WING_ROOT[0] + o.out, y1[1] + WING_ROOT[1], y1[2] + WING_ROOT[2]], tag: pi === 0 ? 'coverts' : 'flight' });
    }
  }
  return out;
}

/** The wing's protrusion beyond the body's surface, in metres. */
function measure(o: { rest: number; turn: number; scale: number; slim: number; thick: number; out: number }) {
  const pts = wingPoints(o);
  let worst = -1;
  let worstAt: P = [0, 0, 0];
  let maxX = -1;
  // The profile: the protrusion at the wing's own height, sampled along its length.
  const zs = new Map<number, number>();
  let yMin = Infinity;
  let yMax = -Infinity;
  for (const { p } of pts) {
    yMin = Math.min(yMin, p[1]);
    yMax = Math.max(yMax, p[1]);
  }
  const yMid = (yMin + yMax) / 2;
  for (const { p } of pts) {
    maxX = Math.max(maxX, p[0]);
    const out = p[0] - realSurfaceX(p[1], p[2]);
    if (out > worst) {
      worst = out;
      worstAt = p;
    }
    if (Math.abs(p[1] - yMid) < 0.008) {
      const z = Math.round(p[2] * 1000) / 1000;
      zs.set(z, Math.max(zs.get(z) ?? -1, out));
    }
  }
  let outside = 0;
  let total = 0;
  let zLo = Infinity;
  let zHi = -Infinity;
  for (const { p } of pts) {
    total++;
    if (p[0] > realSurfaceX(p[1], p[2]) + 0.0005) {
      outside++;
      zLo = Math.min(zLo, p[2]);
      zHi = Math.max(zHi, p[2]);
    }
  }
  const visible = [...zs.entries()]
    .filter(([, v]) => v > 0.0008)
    .sort((a, b) => b[0] - a[0]);
  return {
    worst: worst * SCALE,
    maxX: maxX * SCALE,
    worstAt: worstAt.map((v) => +(v * SCALE).toFixed(4)),
    yMid: yMid * SCALE,
    span: visible.length ? [visible[visible.length - 1][0], visible[0][0]] : null,
    share: Math.round((outside / total) * 100),
    zExt: [zLo, zHi],
    profile: visible
      .slice(0, 12)
      .map(([z, v]) => `${z}:${(v * 1000).toFixed(1)}`)
      .join(' '),
  };
}

const out: string[] = [];
for (const rest of [-45, -55, -65]) {
  for (const turn of [95, 101, 107]) {
    for (const scale of [0.22, 0.26, 0.3]) {
      for (const wingOut of [0.05, 0.06, 0.07]) {
        const m = measure({ rest, turn, scale, slim: 0.95, thick: 1.1, out: wingOut });
        out.push(
          `rest ${rest} turn ${turn} scale ${scale} out ${wingOut} -> worst ${(m.worst * 1000).toFixed(1)} mm, maxX ${m.maxX.toFixed(4)} m, visible ${m.share}%, z ${m.zExt.map((v) => v.toFixed(3)).join('..')}`,
        );
      }
    }
  }
}
console.log(out.join('\n'));
