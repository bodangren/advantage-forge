import { profile, sdf, type Part, type PartTint } from '../../src/index.js';

/**
 * Guardian tower shield (part of `assets/guardian.ts`; standalone `assets/guardian-shield.ts`).
 * Class: shield. Local frame: the center of the outline on the back plane, the face toward +Z,
 * the point down; 0.6 m tall before the host's 1.15 scale. Bodies: shield, shield-face,
 * shield-gold, shield-star (bone `forearm.L`). Tint slot: `cloth` (the shield face).
 */

const C = { steelDark: '#b8b4ac', gold: '#d4a93a', pearl: '#e8e4dc' };

/** The tower shield outline in the shield's frame: the face toward +Z, a pointed bottom, 0.6 m tall. */
const tower = profile.polygon(
  [
    [-0.14, 0.24],
    [-0.145, 0.15],
    [-0.14, 0.0],
    [-0.115, -0.14],
    [-0.07, -0.26],
    [0, -0.34],
    [0.07, -0.26],
    [0.115, -0.14],
    [0.14, 0.0],
    [0.145, 0.15],
    [0.14, 0.24],
    [0.07, 0.262],
    [-0.07, 0.262],
  ],
  { smooth: true, samples: 4 },
);

/** A four-pointed star, longest toward the bottom (the mockup's shield emblem). */
const starProfile = profile.polygon([
  [0, 0.115],
  [0.03, 0.03],
  [0.085, 0.0],
  [0.03, -0.03],
  [0, -0.13],
  [-0.03, -0.03],
  [-0.085, 0.0],
  [-0.03, 0.03],
]);

export function guardianShield(tint: PartTint): Part {
  const cloth = tint('cloth');
  const inner = profile.offsetProfile(tower, -0.024);
  const handle = sdf.capsule([-0.09, -0.01, -0.028], [-0.09, -0.14, -0.028], 0.014);
  const face = sdf.extrude(profile.offsetProfile(tower, -0.02), 0.028, 0.005);
  const outline = sdf
    .extrude(profile.offsetProfile(starProfile, 0.008), 0.031, 0.002)
    .subtract(sdf.extrude(starProfile, 0.1))
    .at(0, 0.03, 0);
  const rim = sdf.extrude(tower, 0.04, 0.014).subtract(sdf.extrude(inner, 0.1));
  const star = sdf.extrude(starProfile, 0.034, 0.004).at(0, 0.03, 0);
  return {
    name: 'guardian-shield',
    bodies: [
      { name: 'shield', shape: sdf.union(sdf.extrude(tower, 0.024, 0.006), handle), options: { color: C.steelDark, roughness: 0.5, metalness: 0.5 }, bone: 'forearm.L' },
      { name: 'shield-face', shape: face, options: { color: cloth, roughness: 0.75 }, bone: 'forearm.L' },
      { name: 'shield-gold', shape: sdf.union(rim, outline), options: { color: C.gold, roughness: 0.35, metalness: 1 }, bone: 'forearm.L' },
      { name: 'shield-star', shape: star, options: { color: C.pearl, roughness: 0.5, metalness: 0.3 }, bone: 'forearm.L' },
    ],
  };
}
