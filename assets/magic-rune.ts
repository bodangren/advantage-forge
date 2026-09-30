import { defineAsset, noise, sdf } from '../src/index.js';

/**
 * Magic rune (props/world/magic-rune), matched to docs/item-mockups/magic-rune-mock.jpg.
 * Role: floor prop, seen from above at a distance. Size: 1.2 x 1.2 m footprint, 0.32 m tall,
 * standing on y = 0, facing +Z.
 * One idea: a chunky pale block base carrying a thick glowing purple disc with a white-hot core.
 * Shape language: square base (sturdy), round disc (magic). Rest area: the plain block sides.
 * Palette: stone #cfc6d6 / gaps #9a8fa6, purple #c07af0, core #ffffff.
 * Materials: base (stone), disc (emissive purple, rings, dome, eight raised bars), glow (core).
 * Every mark is geometry; there is no painted line art.
 */

const PITCH = 0.4;

export default defineAsset({
  name: 'magic-rune',
  description: 'A raised base of nine pale stone blocks with a thick glowing purple disc, two raised rings, eight rune bars, and a white-hot center.',
  detail: 0.005,
  reference: 'docs/item-mockups/magic-rune-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    const blocks = [];
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        blocks.push(sdf.box([0.38, 0.2, 0.38], 0.05).at(i * PITCH, 0.1, j * PITCH));
      }
    }
    const base = sdf.union(...blocks).displace(0.008, (x, y, z) => noise.fbm(x * 9, y * 9, z * 9, 2));
    k.body('base', base.paintFn((x, y, z) => {
      const gx = Math.abs(((x + 0.6) % PITCH) - PITCH / 2) > 0.17;
      const gz = Math.abs(((z + 0.6) % PITCH) - PITCH / 2) > 0.17;
      const n = 0.5 + 0.5 * noise.fbm(x * 8, y * 8, z * 8, 2);
      const edge = gx || gz || y < 0.05 ? 1 : 0;
      const t = Math.min(1, 0.15 * n + edge * 0.7);
      return [0.72 - 0.2 * t, 0.68 - 0.2 * t, 0.76 - 0.17 * t];
    }), { color: '#cfc6d6', roughness: 0.9, metalness: 0, maxTriangles: 4200, detail: 0.007, bump: (x, y, z) => 0.002 * noise.fbm(x * 25, y * 25, z * 25, 2) });

    const bars = [];
    for (let i = 0; i < 8; i++) {
      const a = (i * 360) / 8 + 22.5;
      const r = 0.28;
      const rad = (a * Math.PI) / 180;
      bars.push(sdf.box([0.08, 0.015, 0.03], 0.005).rotateY(-a + 90).at(Math.cos(rad) * r, 0.262, Math.sin(rad) * r));
    }
    const disc = sdf
      .cylinder(0.5, 0.06, 0.02)
      .at(0, 0.23, 0)
      .smoothUnion(0.01, sdf.torus(0.36, 0.025).at(0, 0.26, 0), sdf.torus(0.2, 0.02).at(0, 0.26, 0), sdf.ellipsoid([0.09, 0.06, 0.09]).at(0, 0.26, 0), ...bars);
    k.body('disc', disc, { color: '#c07af0', roughness: 0.3, metalness: 0, emissive: '#c07af0', emissiveIntensity: 0.6, maxTriangles: 2200 });

    k.body('glow', sdf.cylinder(0.07, 0.02, 0.006).at(0, 0.309, 0), {
      color: '#ffffff', roughness: 0.3, metalness: 0, emissive: '#f4e8ff', emissiveIntensity: 0.9, detail: 0.004, maxTriangles: 300,
    });
  },
});
