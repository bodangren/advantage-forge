import { mixRgb, rgb, sdf } from '../src/index.js';
import { crystal } from './parts/element-features.js';
import { spiritAsset } from './parts/spirit-kind.js';

/**
 * Ice elemental — Chibi Quest monster (catalog `monsters/elemental/ice-elemental`), a floating
 * frost spirit about 1 m tall with its crystals, faces +Z. Target:
 * docs/monster-mockups/ice-elemental_001.jpg (made with mmx).
 *
 * The spirit of `assets/parts/spirit-kind.ts` (the ghost's egg head, face, arms, rig, and clips)
 * on a white wisp body that turns teal toward its curled tail, with pointed ears and a crown of
 * clear ice crystals.
 * Role: a frost caster of the elemental family; the crystal crown and the pointed ears read at
 *   128 px.
 * Palette (60/30/10): white head #eef6f8; the wisp from white to teal #6fd0d4; pale blue crystals;
 *   ice-blue pupils.
 * Features: two pointed ears on the head, and seven crystals on the head (rigid on the `head`
 *   bone: a crown of ice does not flicker).
 */

const ICE = rgb('#b8eaff');
const ICE_TIP = rgb('#ffffff');

export default spiritAsset({
  name: 'ice-elemental',
  description: 'Chibi ice elemental monster: a white egg head with pointed ears and a crown of clear ice crystals, dark eyes with ice-blue glowing pupils, on a white wisp body that turns teal toward its curled tail.',
  reference: 'docs/monster-mockups/ice-elemental_001.jpg',
  variants: {
    body: { snow: '#eef6f8', frost: '#e2eef6', pearl: '#f4f2ee' },
    element: { teal: '#6fd0d4', glacier: '#6aa8e0', mint: '#7adcb8' },
    eyes: { ice: '#8fd8ff', white: '#f0fbff', violet: '#a89cff' },
  },
  presets: {
    glacier: { body: 'frost', element: 'glacier', eyes: 'white' },
    mint: { body: 'pearl', element: 'mint', eyes: 'violet' },
  },
  colors: { eye: '#101820', pupilBase: '#0b3046', mouth: '#2a3440' },
  head: { roughness: 0.45 },
  wisp: {
    roughness: 0.2,
    paint: (wisp, s) => {
      const snow = rgb(s.tint.body);
      // White under the head, teal toward the tail.
      return wisp.paintFn((_x, y, _z, c) => mixRgb(c, snow, Math.max(0, Math.min(1, (y - 0.12) / 0.14))));
    },
  },
  extra: {
    build(k, s) {
      // Pointed ears: flat leaves that sweep out and up from the sides of the head.
      const ear = sdf
        .smoothUnion(0.02, sdf.cone([0.17, 0.56, -0.02], [0.37, 0.69, -0.06], 0.07, 0.006), sdf.cone([0.2, 0.52, -0.02], [0.33, 0.56, -0.05], 0.045, 0.006))
        .scale([1, 1, 0.55])
        .mirror('x')
        .bone('head');
      k.body('ears', ear, { color: s.tint.body, roughness: 0.45, detail: 0.004 });
      // Each crystal: [x, z, tilt toward +x (deg), tilt toward +z (deg), radius, length].
      const set: [number, number, number, number, number, number][] = [
        [0, 0, 0, -4, 0.042, 0.22],
        [0.06, 0.02, -24, 6, 0.032, 0.16],
        [-0.06, 0.02, 24, 6, 0.032, 0.16],
        [0.1, -0.04, -42, -8, 0.026, 0.12],
        [-0.1, -0.04, 42, -8, 0.026, 0.12],
        [0.03, -0.07, -12, -26, 0.03, 0.15],
        [-0.035, 0.07, 14, 28, 0.024, 0.1],
      ];
      const cluster = sdf.union(...set.map(([x, z, rz, rx, r, len]) => crystal(r, len).rotate(rx, 0, rz).at(x, 0.74, z)));
      const ice = cluster.paintFn((_x, y) => mixRgb(ICE, ICE_TIP, Math.min(1, Math.max(0, (y - 0.82) / 0.14))));
      k.body('crystals', ice, { color: '#d0f2ff', roughness: 0.06, opacity: 0.85, emissive: '#bfefff', emissiveIntensity: 0.25, flat: true, bone: 'head', detail: 0.003 });
    },
  },
});
