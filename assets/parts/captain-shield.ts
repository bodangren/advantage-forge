import { profile, sdf, type Part } from '../../src/index.js';

/**
 * Captain's round shield (part of `assets/captain.ts`; standalone `assets/captain-shield.ts`).
 * Class: shield. Local frame: the origin is the center of the disc on the back plane, the face
 * toward +Z. Steel field, gold rim, gold lion crest on a boss. 0.264 m across.
 * Bodies: shield, shield-face, shield-gold, shield-rim (bone `forearm.L`). Tint slots: none.
 */

const C = { shieldSteel: '#5a616b', gold: '#e0b040', goldRim: '#d9b24c' };

const crestProfile = (h: number) => {
  const s = h / 0.066;
  const pts: [number, number][] = [
    [-0.03, 0.033],
    [-0.016, 0.024],
    [0, 0.037],
    [0.016, 0.024],
    [0.03, 0.033],
    [0.034, 0.004],
    [0.024, -0.018],
    [0, -0.033],
    [-0.024, -0.018],
    [-0.034, 0.004],
  ];
  return profile.polygon(pts.map(([x, y]) => [x * s, y * s] as [number, number]));
};

/** Keeps the front of a decoration: its back stays inside the plate (back plane z = -0.012). */
const front = (s: sdf.Shape) => s.intersect(sdf.halfSpace([0, 0, -1], 0.006));

export function captainShield(): Part {
  const handle = sdf.capsule([-0.03, 0.02, -0.02], [0.03, -0.01, -0.02], 0.012);
  const steel = { color: C.shieldSteel, roughness: 0.4, metalness: 0.85 };
  const shieldRim = sdf.extrude(profile.circle(0.132), 0.038, 0.009).subtract(sdf.extrude(profile.circle(0.112), 0.1));
  const shieldCrest = front(
    sdf.union(sdf.extrude(crestProfile(0.096), 0.036, 0.004), sdf.extrude(profile.circle(0.04), 0.046, 0.012).at(0, 0.0, 0)),
  );
  return {
    name: 'captain-shield',
    bodies: [
      { name: 'shield', shape: sdf.union(sdf.extrude(profile.circle(0.122), 0.024, 0.006), handle), options: steel, bone: 'forearm.L' },
      { name: 'shield-face', shape: front(sdf.extrude(profile.circle(0.118), 0.03, 0.005)), options: steel, bone: 'forearm.L' },
      { name: 'shield-gold', shape: shieldCrest, options: { color: C.gold, roughness: 0.35, metalness: 0.8 }, bone: 'forearm.L' },
      { name: 'shield-rim', shape: shieldRim, options: { color: C.goldRim, roughness: 0.35, metalness: 0.8 }, bone: 'forearm.L' },
    ],
  };
}
