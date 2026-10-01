import { noise, profile, sdf, type Part } from '../../src/index.js';

/**
 * Paladin heater shield (part of `assets/paladin.ts`; standalone `assets/paladin-shield.ts`).
 * Class: shield. Local frame: the origin at the handle plane center, the face toward +Z, the point
 * down (-Y). 0.252 m wide; the top edge at y = 0.214, the point at y = -0.24.
 * Bodies: shield, shield-face, shield-gold (bone `forearm.L`). Tint slots: none.
 */

const C = { steel: '#c3c8cf', pearl: '#e6eaee', gold: '#e0b040' };

const heater = profile.polygon(
  [
    [-0.12, 0.2],
    [-0.126, 0.12],
    [-0.12, 0.03],
    [-0.098, -0.07],
    [-0.06, -0.155],
    [0, -0.24],
    [0.06, -0.155],
    [0.098, -0.07],
    [0.12, 0.03],
    [0.126, 0.12],
    [0.12, 0.2],
    [0.04, 0.214],
    [-0.04, 0.214],
  ],
  { smooth: true, samples: 4 },
);

/** A sun: a star of long and short rays around a disc (radius `outer`), centered at the origin. */
const sunProfile = (rays: number, outer: number, inner: number) =>
  profile.polygon(
    Array.from({ length: rays * 2 }, (_, i) => {
      const a = (i / (rays * 2)) * Math.PI * 2 + Math.PI / 2;
      const r = i % 2 === 1 ? inner : i % 4 === 0 ? outer : outer * 0.74;
      return [Math.cos(a) * r, Math.sin(a) * r] as [number, number];
    }),
  );


export function paladinShield(): Part {
    const inner = profile.offsetProfile(heater, -0.022);
    const handle = sdf.capsule([-0.03, 0.02, -0.02], [0.03, -0.01, -0.02], 0.012);
    const face = sdf.extrude(profile.offsetProfile(heater, -0.018), 0.028, 0.005);
    const rim = sdf.extrude(heater, 0.036, 0.008).subtract(sdf.extrude(inner, 0.1));
    const shieldSun = sdf
      .union(sdf.extrude(sunProfile(8, 0.1, 0.034), 0.034, 0.003), sdf.extrude(profile.circle(0.032), 0.042, 0.008))
      .at(0, 0.02, 0);
  return {
    name: 'paladin-shield',
    bodies: [
      { name: 'shield', shape: sdf.union(sdf.extrude(heater, 0.024, 0.006), handle), options: { color: C.steel, roughness: 0.4, metalness: 0.8 }, bone: 'forearm.L' },
      { name: 'shield-face', shape: face, options: { color: C.pearl, roughness: 0.35, metalness: 0.3 }, bone: 'forearm.L' },
      { name: 'shield-gold', shape: sdf.union(rim, shieldSun), options: { color: C.gold, roughness: 0.3, metalness: 0.9 }, bone: 'forearm.L' },
    ],
  };
}
