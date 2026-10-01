import { mixRgb, noise, profile, rgb, sdf, type Part, type PartTint } from '../../src/index.js';

/**
 * Skeleton knight's battered kite shield (part of `assets/skeleton-knight.ts`; standalone
 * `assets/skeleton-knight-shield.ts`).
 *
 * A dented iron kite in a raised rim with a worn outer edge, a chip bitten out of the upper edge,
 * a sword gash across the face, and rivets around the rim.
 * Class: shield. Local frame: the origin is the center of the kite outline on the back plane,
 * where the handle is; the face toward +Z, the point down (-Y). The kite is 0.29 m wide and
 * 0.40 m tall.
 * Bodies: kite-shield, shield-studs (bone `shield`, a child of `forearm.L`).
 * Tint slot: `armor` (the iron, its worn edges, and the patina).
 */

const C = {
  ironDark: '#33373c',
  worn: '#a8acb1',
};

// The kite shield's outline: a rounded top and a long point down (local frame, face toward +Z).
export const KITE_PTS: [number, number][] = [
  [0, 0.165],
  [0.085, 0.158],
  [0.135, 0.12],
  [0.145, 0.04],
  [0.125, -0.06],
  [0.075, -0.155],
  [0, -0.235],
  [-0.075, -0.155],
  [-0.125, -0.06],
  [-0.145, 0.04],
  [-0.135, 0.12],
  [-0.085, 0.158],
];
const kite = profile.polygon(KITE_PTS, { smooth: true, samples: 6 });

export function skeletonKnightShield(tint: PartTint): Part {
  const SLOT = {
    iron: tint('armor'),
    ironDark: tint('armor', { color: C.ironDark, follow: 1 }),
    worn: tint('armor', { color: C.worn, follow: 1 }),
    // The patina mixes 18% of this into the iron.
    patina: tint('armor', { color: '#00002c', follow: 1 }),
  };
  const patina = (s: sdf.Shape, f = 30) =>
    s.paintFn((x, y, z, base) => (noise.fbm(x * f, y * f, z * f, 3) > 0.3 ? mixRgb(base, rgb(SLOT.patina), 0.18) : base));
  const ironBump = (x: number, y: number, z: number) => 0.0008 * noise.fbm(x * 70, y * 70, z * 70, 2);
  const dents = (s: sdf.Shape, a = 0.0028, f = 11) => s.displace(a, (x, y, z) => noise.fbm(x * f, y * f, z * f, 2));

  const chip = sdf.sphere(0.024).at(0.142, 0.1, 0);
  const gash = sdf.box([0.1, 0.006, 0.02], 0.002).rotateZ(28).at(-0.035, -0.03, 0.014);
  const face = dents(sdf.extrude(kite, 0.024, 0.006), 0.003, 14).subtract(gash);
  const rim = sdf.extrude(kite, 0.034, 0.008).subtract(sdf.extrude(profile.offsetProfile(kite, -0.018), 0.1));
  const handle = sdf.capsule([-0.03, 0.02, -0.024], [0.03, -0.01, -0.024], 0.012);
  const shieldLocal = patina(sdf.union(face, rim, handle).subtract(chip), 24)
    .paintWhere(sdf.extrude(kite, 0.3).subtract(sdf.extrude(profile.offsetProfile(kite, -0.007), 0.4)), SLOT.worn, 0.003)
    .paintWhere(chip.round(0.006), SLOT.worn, 0.003)
    .paintWhere(gash.round(0.003), SLOT.worn, 0.002);
  // Rivets around the rim.
  const shieldRivets = sdf.union(...KITE_PTS.filter((_, i) => i !== 2).map(([x, y]) => sdf.sphere(0.009).at(x * 0.9, y * 0.9 + (y < -0.2 ? 0.012 : 0), 0.016)));

  return {
    name: 'skeleton-knight-shield',
    bodies: [
      {
        name: 'kite-shield',
        shape: shieldLocal,
        options: { color: SLOT.iron, roughness: 0.55, metalness: 0.3, bump: ironBump },
        bone: 'shield',
      },
      {
        name: 'shield-studs',
        shape: shieldRivets,
        options: { color: SLOT.worn, roughness: 0.4, metalness: 0.8, detail: 0.0035 },
        bone: 'shield',
      },
    ],
  };
}
