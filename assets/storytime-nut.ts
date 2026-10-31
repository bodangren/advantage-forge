import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — Storytime week 1 nut, a hand-sized picture prop.
 * Role: one big nut for a kindergarten book page, readable in color and in 1-bit line art.
 * Size: about 0.050 m wide and 0.053 m tall, standing on y = 0 and facing +Z.
 * One idea: a classic picture-book acorn. An oval nut that ends in a small point at the bottom,
 * a cup-shaped cap over the top third with a bumpy lower edge, and a short stem that leans +X.
 * Shape language: round and soft. No level lid rim, no knob on top of a dome, no flat bottom.
 * Palette: warm brown shell #a8663a, dark grain #7a4726, darker cap #7a4a2c, stem #4f3120.
 * Materials: matte shell, slightly rougher cap, smooth stem.
 * Detail: one nut, one cap cup, four large cap lobes, one stem. No fine scales.
 * Rig/animation: none.
 */

const BROWN = rgb('#b0703c');
const DARK = rgb('#5f3719');
const LIGHT = rgb('#d8a973');
const CAP = rgb('#6e4126');
const CAPDARK = rgb('#4a2a16');

/** The nut body: a small point at the bottom, widest at mid height, closed under the cap. */
const bodyProfile = profile.polygon(
  [
    [0, 0],
    [0.0035, 0.0018],
    [0.0085, 0.0048],
    [0.014, 0.0092],
    [0.0188, 0.0146],
    [0.0216, 0.0196],
    [0.0228, 0.0242],
    [0.0224, 0.0284],
    [0.0218, 0.031],
    [0.0212, 0.034],
    [0.0198, 0.037],
    [0.016, 0.0396],
    [0, 0.041],
  ],
  { smooth: true },
);

/** The cap cup, in a local frame: rim at local y = 0, crown at local y = 0.0172. */
const capProfile = profile.polygon(
  [
    [0, 0.0140],
    [0.0085, 0.0136],
    [0.0150, 0.0122],
    [0.0192, 0.0102],
    [0.0215, 0.0078],
    [0.0226, 0.0052],
    [0.0229, 0.002],
    [0.0220, 0.0006],
    [0, 0],
  ],
  { smooth: true },
);

/** Four large soft lobes make the lower cap edge bumpy, so it is not a level lid rim. */
const capLobes = [
  [0, 0.0025, 0.0078],
  [72, 0.0044, 0.0070],
  [144, 0.0030, 0.0082],
  [216, 0.0042, 0.0072],
  [288, 0.0027, 0.0076],
].map(([deg, y, r]) => {
  const a = (deg * Math.PI) / 180;
  return sdf.sphere(r).at(Math.cos(a) * 0.0165, y, Math.sin(a) * 0.0165);
});

export default defineAsset({
  name: 'storytime-nut',
  description: 'One acorn: a warm brown nut with a point at the bottom and a dark bumpy cap.',
  detail: 0.00065,
  texture: { size: 512 },

  build(k) {
    const shell = sdf.revolve(bodyProfile).paintFn((x, y, z, base) => {
      const a = Math.atan2(z, x);
      const grain = 0.5 + 0.5 * noise.fbm(x * 150, y * 80, z * 150, 2);
      const streak = Math.pow(0.5 + 0.5 * Math.cos(a * 7 + y * 70), 8);
      const shoulder = Math.max(0, 1 - Math.abs(y - 0.0315) / 0.012);
      const low = Math.max(0, 1 - y / 0.018);
      let c = mixRgb(BROWN, LIGHT, 0.1 + 0.2 * grain + 0.25 * shoulder);
      c = mixRgb(c, DARK, 0.1 * streak + 0.3 * low);
      return mixRgb(base, c, 0.92);
    });
    k.body('shell', shell.at(0, 0.002, 0), {
      color: '#b0703c',
      roughness: 0.8,
      detail: 0.00065,
      bump: (x, y, z) => 0.00008 * noise.fbm(x * 170, y * 95, z * 170, 2),
      maxTriangles: 7000,
    });

    const cap = sdf
      .smoothUnion(0.004, sdf.revolve(capProfile), ...capLobes)
      .paintFn((x, y, z, base) => {
        const mottle = 0.5 + 0.5 * noise.fbm(x * 260, y * 180, z * 260, 2);
        const crown = Math.min(1, Math.max(0, (y - 0.030) / 0.014));
        return mixRgb(base, mixRgb(CAP, CAPDARK, 0.2 + 0.4 * mottle * (1 - crown)), 0.9);
      })
      .rotateZ(5)
      .at(0, 0.032, 0);
    k.body('cap', cap, {
      color: '#6e4126',
      roughness: 0.9,
      detail: 0.0006,
      bump: (x, y, z) => 0.00016 * noise.fbm(x * 210, y * 140, z * 210, 2),
      maxTriangles: 5000,
    });

    const stem = sdf.chain([
      [-0.0012, 0.0452, 0, 0.0024],
      [0.0016, 0.0492, -0.0002, 0.0019],
      [0.0042, 0.0528, 0.0004, 0.0013],
    ], 0.0025);
    k.body('stem', stem, { color: '#4f3120', roughness: 0.85, detail: 0.0005, maxTriangles: 800 });
  },
});
