import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — Storytime week 1 nut, a hand-sized picture prop.
 * Role: one big nut for a kindergarten book page, readable without surface detail.
 * Size: about 0.047 m wide and 0.049 m tall, standing on y = 0 and facing +Z.
 * One idea: a plump brown hazelnut with a large pale cap and a tiny stem.
 * Shape language: round and soft, with a gently pointed crown.
 * Palette: warm brown #9a5c32, dark grain #6e3f24, pale tan cap #d8b47c.
 * Materials: matte brown shell and a slightly rougher pale cap.
 * Detail: one plump shell, a cap covering the upper third, restrained shell grain.
 * Rig/animation: none.
 */

const BROWN = rgb('#9a5c32');
const DARK = rgb('#6e3f24');
const LIGHT = rgb('#bd7d48');

const nutProfile = profile.polygon(
  [
    [0, 0],
    [0.011, 0],
    [0.018, 0.003],
    [0.0225, 0.011],
    [0.0235, 0.023],
    [0.0215, 0.034],
    [0.015, 0.043],
    [0.005, 0.047],
    [0, 0.0475],
  ],
  { smooth: true },
);

export default defineAsset({
  name: 'storytime-nut',
  description: 'One plump brown hazelnut-like nut with a pale tan cap and a tiny stem.',
  detail: 0.00065,
  texture: { size: 512 },

  build(k) {
    const shell = sdf.revolve(nutProfile).scale(0.875).paintFn((x, y, z, base) => {
      const a = Math.atan2(z, x);
      const grain = 0.5 + 0.5 * noise.fbm(x * 180, y * 85, z * 180, 2);
      const stripe = Math.pow(0.5 + 0.5 * Math.cos(a * 9 + y * 22), 12);
      let c = mixRgb(BROWN, LIGHT, 0.12 * grain);
      c = mixRgb(c, DARK, 0.13 * stripe + 0.1 * (1 - y / 0.0475));
      return mixRgb(base, c, 0.92);
    });
    k.body('shell', shell.at(0, 0.003, 0), {
      color: '#9a5c32',
      roughness: 0.78,
      detail: 0.00065,
      bump: (x, y, z) => 0.00009 * noise.fbm(x * 190, y * 100, z * 190, 2),
      maxTriangles: 7000,
    });

    const cap = sdf
      .revolve(nutProfile)
      .scale(0.89075)
      .intersect(sdf.halfSpace([0, -1, 0], -0.0325));
    k.body('cap', cap.at(0, 0.003, 0), {
      color: '#d8b47c',
      roughness: 0.86,
      detail: 0.0006,
      bump: (x, y, z) => 0.00012 * noise.fbm(x * 230, y * 150, z * 230, 2),
      maxTriangles: 3500,
    });

    const stem = sdf.capsule([0, 0.0465, 0], [0.0007, 0.049, 0], 0.00125).scale(0.875);
    k.body('stem', stem.at(0, 0.003, 0), { color: '#6e3f24', roughness: 0.88, detail: 0.00045, maxTriangles: 500 });
  },
});
