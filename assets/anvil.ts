import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Anvil on a stump (props/blacksmith/anvil), the focal prop of the blacksmith shop
 * (docs/blacksmith-mockups/blacksmith-quest_001.jpg). Size: 0.62 m long, 0.5 m tall, on y = 0.
 * One idea: a classic waisted anvil (wide feet, narrow waist, flat face, long tapered horn,
 * square heel with a hardy hole) sitting on a thick banded tree stump.
 * Palette: iron #3d4148 / edge #5a5f67, polished face #9aa0a8, stump #7a5234 / bark #4e3320 /
 * end grain #b08a5a, band #2f3236. Materials: iron (0.45, metal 0.8), wood (0.85).
 */

const IRON = rgb('#3d4148');
const IRON_EDGE = rgb('#5a5f67');
const FACE = rgb('#9aa0a8');
const WOOD = rgb('#7a5234');
const BARK = rgb('#4e3320');
const END = rgb('#b08a5a');

const STUMP_H = 0.26;
const clamp = (v: number, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);
const ground = (s: ReturnType<typeof sdf.sphere>) =>
  s.intersect(sdf.halfSpace([0, -1, 0], 0).intersect(sdf.box([2, 2, 2]).at(0, 0.8, 0)));

export default defineAsset({
  name: 'anvil',
  description: 'A classic waisted iron anvil with a long horn and a polished face, on a thick banded tree stump.',
  detail: 0.006,
  reference: 'docs/blacksmith-mockups/blacksmith-quest_001.jpg',
  texture: { size: 1024 },

  build(k) {
    // Stump: a thick log with a slightly flared foot and bark ridges.
    const stump = sdf
      .smoothUnion(
        0.04,
        sdf.cylinder(0.19, STUMP_H, 0.015).at(0, STUMP_H / 2, 0),
        sdf.cylinder(0.215, 0.05, 0.02).at(0, 0.025, 0),
      )
      .displace(0.004, (x, y, z) => Math.pow(0.5 + 0.5 * Math.cos(Math.atan2(z, x) * 22 + noise.noise3(x * 8, y * 3, z * 8) * 2), 3));
    k.body(
      'stump',
      ground(stump).paintFn((x, y, z) => {
        const r = Math.hypot(x, z);
        const n = 0.5 + 0.5 * noise.fbm(x * 20, y * 5, z * 20, 2);
        if (y > STUMP_H - 0.004 && r < 0.18) return mixRgb(END, WOOD, 0.4 * Math.pow(0.5 + 0.5 * Math.sin(r * 160), 2));
        return mixRgb(WOOD, BARK, 0.3 + 0.5 * n);
      }),
      { color: '#7a5234', roughness: 0.85, metalness: 0, detail: 0.008 },
    );
    // Two iron bands around the stump.
    const bands = sdf.union(
      ...[0.06, STUMP_H - 0.05].map((y) => sdf.cylinder(0.197, 0.028, 0.006).at(0, y, 0).subtract(sdf.cylinder(0.17, 0.1, 0).at(0, y, 0))),
    );
    k.body('bands', bands, { color: '#2f3236', roughness: 0.5, metalness: 0.7, detail: 0.005 });

    // Anvil: feet, waist, and body blended into a waisted block, then the horn and heel.
    const Y = STUMP_H;
    const feet = sdf.box([0.34, 0.05, 0.24], 0.015).at(0, Y + 0.025, 0);
    const waist = sdf.box([0.16, 0.08, 0.1], 0.02).at(0, Y + 0.09, 0);
    const body = sdf.box([0.4, 0.075, 0.16], 0.012).at(-0.01, Y + 0.165, 0);
    const horn = sdf
      .cone([0.17, Y + 0.17, 0], [0.33, Y + 0.155, 0], 0.052, 0.01)
      .intersect(sdf.halfSpace([0, 1, 0], Y + 0.2));
    const heel = sdf.box([0.08, 0.06, 0.12], 0.01).at(-0.235, Y + 0.172, 0);
    const hardy = sdf.box([0.024, 0.08, 0.024]).at(-0.2, Y + 0.2, 0);
    const anvil = sdf
      .smoothUnion(0.045, feet, waist)
      .smoothUnion(0.035, body)
      .smoothUnion(0.02, horn, heel)
      .subtract(hardy)
      .paintFn((x, y, z) => {
        const n = 0.5 + 0.5 * noise.fbm(x * 40, y * 40, z * 40, 2);
        let c = mixRgb(IRON, IRON_EDGE, 0.35 * n);
        // Polished working face on top.
        c = mixRgb(c, FACE, clamp((y - (Y + 0.195)) / 0.006) * (0.7 + 0.3 * n));
        return c;
      });
    k.body('anvil', anvil, {
      color: '#3d4148',
      roughness: 0.45,
      metalness: 0.8,
      detail: 0.005,
      paintWeight: 2,
      bump: (x, y, z) => 0.0008 * noise.fbm(x * 50, y * 50, z * 50, 2),
    });
  },
});
