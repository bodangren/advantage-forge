import { noise, rgb, sdf, type Part, type PartTint } from '../../src/index.js';

/**
 * Shield-maiden round spiral shield (part of `assets/shield-maiden.ts`; standalone `assets/shield-maiden-shield.ts`).
 * Class: shield. Local frame: the disc center, the face toward +Z, the top toward +Y; 0.31 m across.
 * The host keeps its pose function `shieldPose`. Bodies: shield, shield-face, shield-back, spiral (bone `forearm.L`).
 * Tint slot: `shield` (the face; the host maps it to `clothing`).
 */
const C = { steel: '#8a9099', steelDark: '#5a6068', shield: '#3a8ab8', spiral: '#c8e0e8', wood: '#8a5a35' };

export function shieldMaidenShield(tint: PartTint): Part {
  const T = { shield: tint('shield', { color: C.shield, follow: 1 }) };
    const rim = sdf.torus(0.146, 0.017).rotateX(90).at(0, 0, 0.006);
    const handle = sdf.capsule([-0.03, 0.01, -0.03], [0.03, 0.01, -0.03], 0.011);
    const faceDisc = sdf
      .cylinder(0.145, 0.026, 0.006)
      .rotateX(90)
      .at(0, 0, 0.006)
      .paintFn((x, y, z, base) => (Math.abs(Math.hypot(x, y) - 0.128) < 0.0035 ? rgb(C.spiral) : base));
    const spiralPts: [number, number, number, number][] = [];
    for (let i = 0; i <= 44; i++) {
      const th = (i / 44) * Math.PI * 3.6 + 0.4;
      const r = 0.014 + 0.0068 * th;
      spiralPts.push([r * Math.cos(th), r * Math.sin(th) - 0.004, 0.0195, 0.0068]);
    }
  return {
    name: 'shield-maiden-shield',
    bodies: [
      { name: 'shield', shape: sdf.union(rim, handle).paintWhere(sdf.halfSpace([0, 1, 0], 0), C.steelDark, 0.02), options: { color: C.steel, roughness: 0.45, metalness: 0.8, detail: 0.004 }, bone: 'forearm.L' },
      { name: 'shield-face', shape: faceDisc, options: { color: T.shield, roughness: 0.55, metalness: 0.1, detail: 0.004 }, bone: 'forearm.L' },
      {
        name: 'shield-back',
        shape: sdf.cylinder(0.146, 0.022, 0.005).rotateX(90).at(0, 0, -0.012),
        options: { color: C.wood, roughness: 0.85, detail: 0.005, bump: (x: number, y: number, z: number) => 0.0015 * Math.abs(Math.sin(y * 90 + noise.noise3(x * 5, y * 5, z * 5) * 3)) },
        bone: 'forearm.L',
      },
      { name: 'spiral', shape: sdf.chain(spiralPts, 0.003), options: { color: C.spiral, roughness: 0.6, metalness: 0.2, detail: 0.0042 }, bone: 'forearm.L' },
    ],
  };
}
