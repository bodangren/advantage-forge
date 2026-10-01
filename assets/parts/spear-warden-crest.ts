import { mixRgb, noise, profile, rgb, sdf, type Part } from '../../src/index.js';

/**
 * Spear warden crest (part of `assets/spear-warden.ts`; standalone `assets/spear-warden-crest.ts`).
 * One broad swept red fin from the brow to the nape, fanned with 6 grooves like horsehair.
 * Class: head. Local frame: the origin is the head center, the face toward +Z.
 * Bodies: crest (bone `plume`). Tint slots: none.
 */
const C = { red: '#b83a3a', redDark: '#8a2424' };
const rad = Math.PI / 180;
/** The head center rounded to 1/1024 m, so the host round trip adds no float error. */
export const SPEAR_WARDEN_CREST_MOUNT = [0, 0.675, 0].map((v) => Math.round(v * 1024) / 1024) as unknown as readonly [number, number, number];
const M = SPEAR_WARDEN_CREST_MOUNT;

export function spearWardenCrest(): Part {
  const finSide: [number, number][] = [
    [0.14, 0.83],
    [0.155, 0.9],
    [0.13, 0.97],
    [0.08, 1.05],
    [0.02, 1.105],
    [-0.05, 1.125],
    [-0.12, 1.09],
    [-0.18, 1.02],
    [-0.235, 0.94],
    [-0.215, 0.89],
    [-0.15, 0.85],
    [-0.08, 0.82],
    [0.0, 0.84],
    [0.08, 0.82],
  ];
  const fin = sdf
    .extrude(profile.polygon(finSide.map(([z, y]) => [-z, y] as [number, number]), { smooth: true, samples: 6 }), 0.03, 0.01)
    .rotateY(90);
  const PZ = -0.06;
  const PY = 0.8;
  const grooveAt = [-50, -31, -12, 7, 26, 44];
  const grooveD = (y: number, z: number) => {
    const t = Math.atan2(PZ - z, y - PY) / rad;
    return Math.min(...grooveAt.map((g) => Math.abs(t - g)));
  };
  const crest = fin.paintFn((x, y, z, base) => {
    const d = grooveD(y, z);
    const shade = y < 0.93 ? mixRgb(base, rgb(C.redDark), 0.55) : base;
    return d < 2.6 && y > 0.88 ? mixRgb(shade, rgb(C.redDark), 0.9) : shade;
  });
  return {
    name: 'spear-warden-crest',
    bodies: [
      {
        name: 'crest',
        shape: crest.at(-M[0], -M[1], -M[2]),
        options: {
          color: C.red,
          roughness: 0.7,
          detail: 0.005,
          bump: (x, y, z) => -0.0022 * Math.max(0, 1 - grooveD(y, z) / 3.4) + 0.0008 * noise.noise3(x * 120, y * 40, z * 120),
        },
        bone: 'plume',
      },
    ],
  };
}
