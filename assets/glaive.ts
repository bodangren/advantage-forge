import { defineAsset, noise, profile, sdf } from '../src/index.js';

/**
 * Glaive, 1.85 m tall, standing on its butt on y = 0, centered on the Y axis.
 * Role: hero polearm, seen in hand and as an icon, so the silhouette must read at 128 px.
 * The one idea: a long honey-oak pole topped by a big crescent blade that sweeps up and
 * hooks back like a wave crest, with a small back spike at the socket.
 * Shape language: one long vertical line (pole) broken by a curved triangular blade.
 * Palette: honey oak pole (dominant), dark iron blade and socket, bright steel cutting
 * edge, small gold collars as the accent. Materials: wood, gold, iron, steel.
 * No rig; the pole is the grip (center around y 0.9 when held).
 */

const POLE_R = 0.028;
const POLE_TOP = 1.42;

export default defineAsset({
  name: 'glaive',
  description: 'A 1.8 m glaive: honey-oak pole, curved single-edged iron blade, small back spike, gold collars.',
  detail: 0.004,
  reference: 'docs/item-mockups/glaive-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ pole
    const pole = sdf.cylinder(POLE_R, POLE_TOP - 0.06, 0.01).at(0, POLE_TOP / 2 + 0.02, 0);
    k.body('pole', pole, {
      color: '#b5814a',
      roughness: 0.82,
      detail: 0.007,
      // Long grain streaks: oak with warm brown variation along the shaft.
      paintFn: (x, y, z, base) => {
        const g = noise.fbm(x * 26, y * 3.5, z * 26, 3);
        const streak = noise.fbm(x * 60, y * 2, z * 60, 2);
        let c = g > 0.25 ? '#8a5a35' : base;
        if (streak > 0.45) c = '#c9a06a';
        return c;
      },
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 40, y * 3, z * 40, 2),
    });

    // ------------------------------------------------------------------ gold collars
    const collar = (y: number) => sdf.cylinder(POLE_R + 0.005, 0.03, 0.01).at(0, y, 0);
    k.body('gold', sdf.union(collar(0.09), collar(1.3)), {
      color: '#d4a93a',
      roughness: 0.3,
      metalness: 1,
      detail: 0.008,
      maxError: 0.002,
    });

    // ------------------------------------------------------------------ iron: butt ferrule, socket, back spike
    // Flat-bottomed ferrule (the rounded cone alone would bulge below y = 0).
    const butt = sdf.union(
      sdf.cylinder(0.023, 0.032, 0.008).at(0, 0.016, 0),
      sdf.cone([0, 0.02, 0], [0, 0.06, 0], 0.02, POLE_R + 0.002),
    );
    const socket = sdf
      .smoothUnion(
        0.012,
        sdf.cone([0, POLE_TOP - 0.06, 0], [0, POLE_TOP + 0.1, 0], 0.032, 0.02),
        sdf.ellipsoid([0.038, 0.05, 0.032]).at(0, POLE_TOP + 0.02, 0),
      );
    const backSpike = sdf.cone([0, POLE_TOP + 0.04, -0.01], [0, POLE_TOP + 0.075, -0.13], 0.018, 0.004);
    k.body('iron', sdf.union(butt, socket, backSpike), {
      color: '#363a3f',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.008,
      maxError: 0.002,
      bump: (x, y, z) => 0.0004 * noise.fbm(x * 200, y * 40, z * 200, 2),
    });

    // ------------------------------------------------------------------ crescent blade
    // Cutting edge and spine sampled as two curves around a center below-right of the
    // blade, so the outline is a fat crescent that hooks back at the tip. The inner
    // curve is the cutting edge; the spine is pushed out along the radial normal.
    const center: [number, number] = [0.34, 1.36];
    const curve = (t: number): [number, number] => [
      0.27 * Math.sin(t * Math.PI * 0.52) - 0.14 * t ** 4.5,
      1.44 + 0.38 * t,
    ];
    const normal = (t: number): [number, number] => {
      const [x, y] = curve(t);
      const dx = x - center[0];
      const dy = y - center[1];
      const len = Math.hypot(dx, dy);
      return [dx / len, dy / len];
    };
    const width = (t: number) => 0.04 + 0.085 * Math.sin(Math.PI * t) + 0.02 * t ** 3;
    const N = 12;
    const edgePts: [number, number][] = [];
    const spinePts: [number, number][] = [];
    const stripInner: [number, number][] = [];
    const stripOuter: [number, number][] = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const [x, y] = curve(t);
      const [nx, ny] = normal(t);
      const w = width(t);
      edgePts.push([x, y]);
      spinePts.push([x + nx * w, y + ny * w]);
      stripInner.push([x, y]);
      stripOuter.push([x + nx * 0.022, y + ny * 0.022]);
    }
    const outline = profile.polygon([...edgePts, ...spinePts.reverse()], { smooth: false });
    const blade = sdf.extrude(outline, 0.016, 0.004);
    k.body('blade', blade, {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.007,
      maxError: 0.002,
      bump: (x, y, z) => 0.0003 * noise.fbm(x * 300, y * 20, z * 300, 2),
    });

    // Bright steel cutting edge: a thin strip hugging the inner curve, a hair thicker.
    const edgeOutline = profile.polygon([...stripInner, ...stripOuter.reverse()], { smooth: false });
    const edge = sdf.extrude(edgeOutline, 0.019, 0.005);
    k.body('edge', edge, {
      color: '#c8ccd2',
      roughness: 0.3,
      metalness: 1,
      detail: 0.007,
      maxError: 0.002,
    });
  },
});
