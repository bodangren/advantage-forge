import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — Storytime week 1 nut, a hand-sized picture prop.
 * Role: one big nut for a kindergarten book page, readable in color and in 1-bit line art.
 * Size: about 0.048 m wide and 0.055 m tall, standing on y = 0 and facing +Z.
 * One idea: a classic picture-book acorn. An oval nut that ends in a small point at the bottom,
 * a cup-shaped cap over the top third with a bumpy lower edge, and a short stem that leans +X.
 * Shape language: round and soft. No level lid rim, no knob on top of a dome, no flat bottom.
 * Palette: warm brown shell #b0703c, darker cap #6e4126, stem #4f3120.
 * Materials: one matte nut, roughness 0.85. Shell, cap, and stem are one body.
 * Why one body: three separate bodies left buried faces and thin charts at the cap rim and the
 * stem tip. One union removes the buried faces.
 * Why vertex colors: the 1024 bake left pure black texels inside the charts, and the review saw
 * them as specks along the cap edge and at the stem tip. Vertex colors need no atlas gutter.
 * Detail: one nut, one cap cup, five large cap lobes, one stem. No fine scales.
 * Rig/animation: none.
 */

const BROWN = rgb('#b0703c');
const DARK = rgb('#5f3719');
const LIGHT = rgb('#d8a973');
const CAP = rgb('#6e4126');
const CAPDARK = rgb('#4a2a16');
const STEM = rgb('#4f3120');

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

/**
 * The cap cup, in a local frame: rim at local y = 0, crown at local y = 0.0140.
 * The under-cut pulls 1.6 mm inside the shell, so the union buries the rim and no dark cavity
 * shows along the edge.
 */
const capProfile = profile.polygon(
  [
    [0, 0.0140],
    [0.0085, 0.0136],
    [0.0150, 0.0122],
    [0.0192, 0.0102],
    [0.0215, 0.0078],
    [0.0226, 0.0052],
    [0.0229, 0.002],
    [0.0204, 0.0006],
    [0, 0],
  ],
  { smooth: true },
);

/**
 * Five large soft lobes make the lower cap edge bumpy, so it is not a level lid rim.
 * The shell, the cap, and the stem join with a soft fillet, so no knife edge or cusp forms where
 * their surfaces cross. A sharp join read as dark teeth along the edge.
 */
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

/** The stem leans toward +X. Its lower end sits inside the cap crown. */
const stemShape = sdf.chain(
  [
    [-0.0012, 0.0452, 0, 0.0024],
    [0.0016, 0.0492, -0.0002, 0.0020],
    [0.0042, 0.0524, 0.0004, 0.0019],
  ],
  0.0028,
);


export default defineAsset({
  name: 'storytime-nut',
  description: 'One acorn: a warm brown nut with a point at the bottom and a dark bumpy cap.',
  detail: 0.0008,
  texture: false,

  build(k) {
    const shell = sdf.revolve(bodyProfile).at(0, 0.002, 0);
    const cap = sdf
      .smoothUnion(0.005, sdf.revolve(capProfile), ...capLobes)
      .rotateZ(5)
      .at(0, 0.032, 0);

    // One body. The union removes the faces that the cap, the shell, and the stem hide from each
    // other, so no chart sits on a buried knife edge.
    const nut = sdf.smoothUnion(0.0045, shell, cap, stemShape).paintFn((x, y, z, base) => {
      const a = Math.atan2(z, x);
      const grain = 0.5 + 0.5 * noise.fbm(x * 150, y * 80, z * 150, 2);
      const streak = Math.pow(0.5 + 0.5 * Math.cos(a * 7 + y * 70), 8);
      const shoulder = Math.max(0, 1 - Math.abs(y - 0.0315) / 0.012);
      const low = Math.max(0, 1 - y / 0.018);
      let shellColor = mixRgb(BROWN, LIGHT, 0.1 + 0.2 * grain + 0.25 * shoulder);
      shellColor = mixRgb(shellColor, DARK, 0.1 * streak + 0.3 * low);

      const mottle = 0.5 + 0.5 * noise.fbm(x * 190, y * 130, z * 190, 2);
      const crown = Math.min(1, Math.max(0, (y - 0.036) / 0.012));
      const capColor = mixRgb(CAP, CAPDARK, 0.14 + 0.34 * mottle * (0.45 + 0.55 * crown));

      // The colors follow the union, not a guessed boundary. The nearest part wins, with a narrow
      // blend, so the cap color stops exactly at the crease and leaves no dark fingers.
      const soft = 0.0015;
      const dShell = shell.dist(x, y, z);
      const dCap = cap.dist(x, y, z);
      const dStem = stemShape.dist(x, y, z);
      const dMin = Math.min(dShell, dCap, dStem);
      const wShell = Math.exp(-(dShell - dMin) / soft);
      const wCap = Math.exp(-(dCap - dMin) / soft);
      const wStem = Math.exp(-(dStem - dMin) / soft);
      const total = wShell + wCap + wStem;
      const blend = (i: 0 | 1 | 2): number =>
        (wShell * shellColor[i] + wCap * capColor[i] + wStem * STEM[i]) / total;
      return mixRgb(base, [blend(0), blend(1), blend(2)] as const, 0.93);
    });

    k.body('nut', nut, {
      color: '#b0703c',
      roughness: 0.85,
      detail: 0.0008,
      paintWeight: 1,
      maxTriangles: 8000,
      maxError: 0.00004,
    });
  },
});
