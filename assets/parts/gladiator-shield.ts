import { mixRgb, noise, profile, rgb, sdf, type Part } from '../../src/index.js';

/**
 * Gladiator round shield (part of `assets/gladiator.ts`; standalone `assets/gladiator-shield.ts`).
 * Class: shield. Local frame: centered on the origin, the face toward +Z. Radius 0.13 m.
 * Bodies: shield-bronze, shield (bone `forearm.L`).
 */
const C = { bronze: '#b08a3a', shieldFace: '#8a5a35', shieldDark: '#6e4426' };
const rad = Math.PI / 180;
export const SHIELD_R = 0.13;

export function gladiatorShield(): Part {
    const face = sdf
      .cylinder(SHIELD_R - 0.006, 0.02, 0.004)
      .rotateX(90)
      .at(0, -0.006, 0)
      .paintFn((x, y, z, base) => {
        const g = Math.sin(noise.noise3(x * 4, y * 4, z * 4) * 3 + y * 120);
        return g > 0.4 ? mixRgb(base, rgb(C.shieldDark), 0.5) : base;
      });
    const rim = sdf.cylinder(SHIELD_R, 0.032, 0.006).subtract(sdf.cylinder(SHIELD_R - 0.019, 0.2)).rotateX(90).at(0, -0.006, 0);
    const boss = sdf.smoothUnion(0.008, sdf.sphere(0.036).scale([1, 1, 0.55]).at(0, -0.006, 0.01), sdf.cylinder(0.042, 0.012, 0.004).rotateX(90).at(0, -0.006, 0.006));
    const bossStuds = sdf.union(
      ...[0, 60, 120, 180, 240, 300].map((a) => sdf.sphere(0.0075).at(0.075 * Math.cos(a * rad), -0.006 + 0.075 * Math.sin(a * rad), 0.012)),
    );
    const handle = sdf.capsule([-0.035, -0.006, -0.026], [0.035, -0.006, -0.026], 0.011);
  return {
    name: 'gladiator-shield',
    bodies: [
      { name: 'shield-bronze', shape: sdf.union(rim, boss, bossStuds, handle), options: { color: C.bronze, roughness: 0.45, metalness: 0.7, detail: 0.005 }, bone: 'forearm.L' },
      { name: 'shield', shape: face, options: { color: C.shieldFace, roughness: 0.75, detail: 0.004 }, bone: 'forearm.L' },
    ],
  };
}
