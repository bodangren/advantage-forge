import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note - slim turned-iron three-socket candelabra, lit (props/furniture/candelabra).
 *
 * Role: warm accent light on tavern tables; reads at 128 px as a slim dark
 *   iron silhouette with two scroll arms and three warm flames.
 * Size: ~0.30 m wide, ~0.46 m tall, ~0.2 m deep; stands on y = 0, faces +Z.
 * One idea: a slim turned stem with knops, two S-scroll arms curling out to
 *   each side, three brass drip pans under three cream candles.
 * Shape language: round (turned stem, scrolls); triangular flames on top.
 * Palette: dark iron #2e2a28 (dominant), brass #b08a3a (pans), wax #efe2c0,
 *   flame yellow #ffd23a to red-orange #e8400a (accent, emissive 0.25).
 * Materials: iron (0.5, metal 0.7), brass (0.4, metal 0.8), wax (0.6),
 *   flame (roughness 0.95, one paintFn gradient, low emissive).
 * Detail: domed foot with ring and bead, stem with 3 knops, 2 scroll arms
 *   with tip curls, 3 pans, candles with drips and wicks, teardrop flames.
 * Rig/animation: none (static prop).
 */

const IRON = '#2e2a28';
const BRASS = '#b08a3a';
const WAX = '#efe2c0';

export default defineAsset({
  name: 'candelabra',
  description: 'Slim turned-iron three-socket candelabra with scroll arms, brass drip pans, and three lit candles.',
  detail: 0.005,
  texture: { size: 1024 },
  reference: 'docs/tavern-mockups/tavern-quest_001.jpg',

  build(k) {
    // Foot: domed revolve with foot ring and bead molding.
    const footPoints: [number, number][] = [
      [0, 0.05], [0.03, 0.046], [0.065, 0.032], [0.09, 0.02], [0.1, 0.012],
      [0.1, 0], [0.085, 0], [0.085, 0.008], [0.06, 0.018], [0, 0.018],
    ];
    const footProfile = profile.polygon(
      footPoints.slice(0, 6).concat([[0.1, 0], [0, 0]]),
      { smooth: false },
    );
    const foot = sdf.revolve(footProfile).round(0.004);
    const bead = sdf.torus(0.045, 0.008).at(0, 0.048, 0);
    const stemKnops = [0.095, 0.17, 0.25];
    const stem = sdf.smoothUnion(
      0.01,
      sdf.cylinder(0.014, 0.3).at(0, 0.17, 0),
      sdf.sphere(0.024).at(0, 0.095, 0).scale([1, 0.8, 1]),
      sdf.sphere(0.022).at(0, 0.17, 0).scale([1, 0.8, 1]),
      sdf.sphere(0.024).at(0, 0.25, 0).scale([1, 0.8, 1]),
      sdf.sphere(0.02).at(0, 0.05, 0),
    );
    void stemKnops;
    // S-scroll arm to +X: out from stem, dips, sweeps up to the pan; tip curl.
    const arm = sdf.chain(
      [
        [0.01, 0.2, 0, 0.0095],
        [0.05, 0.175, 0, 0.009],
        [0.09, 0.2, 0, 0.009],
        [0.12, 0.25, 0, 0.009],
        [0.125, 0.28, 0, 0.009],
      ],
      0.01,
    );
    const curl = sdf.torus(0.016, 0.0085).rotateX(90).at(0.088, 0.225, 0);
    const curl2 = sdf.torus(0.014, 0.0085).rotateX(90).at(0.042, 0.19, 0).scale(1);
    const armR = sdf.smoothUnion(0.008, arm, curl);
    void curl2;
    const arms = sdf.union(armR, armR.mirror('x', 0));
    const ironShape = sdf.smoothUnion(0.008, foot, bead, stem).union(arms);
    k.body('iron', ironShape.paintFn((x, y, z) => mixRgb(rgb(IRON), rgb('#3a3532'), 0.5 + 0.5 * noise.fbm(x * 15, y * 15, z * 15, 2))), {
      color: IRON,
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.004,
      maxTriangles: 2600,
      bump: (x, y, z) => 0.0008 * noise.fbm(x * 40, y * 40, z * 40, 2),
    });

    // Sockets: center on stem top, two at arm tips.
    const seats: Array<[number, number, number]> = [[0, 0.3, 0], [0.125, 0.285, 0], [-0.125, 0.285, 0]];
    const panProfile = profile.polygon([[0, 0], [0.012, 0], [0.016, 0.004], [0.03, 0.01], [0.03, 0.014], [0.02, 0.012], [0, 0.012]], { smooth: false });
    const pan = sdf.revolve(panProfile);
    const pans = sdf.union(...seats.map(([x, y, z]) => pan.at(x, y - 0.012, z)));
    k.body('pans', pans.round(0.002), { color: BRASS, roughness: 0.4, metalness: 0.8, detail: 0.004, maxTriangles: 800 });

    // Candles (center taller), drips, wicks, flames.
    const heights = [0.08, 0.06, 0.06];
    const candleShapes = seats.map(([x, y, z], i) => {
      const h = heights[i] ?? 0.06;
      const c = sdf.cylinder(0.014, h, 0.004).at(x, y + h / 2, z);
      const drip = sdf.capsule([x + 0.012, y + h, z + 0.004], [x + 0.013, y + h - 0.02, z + 0.004], 0.0045);
      const drip2 = sdf.capsule([x - 0.008, y + h, z + 0.011], [x - 0.009, y + h - 0.014, z + 0.012], 0.0042);
      return sdf.smoothUnion(0.004, c, drip, drip2);
    });
    k.body('wax', sdf.union(...candleShapes), { color: WAX, roughness: 0.6, metalness: 0, detail: 0.004, maxTriangles: 900 });
    const wicks = sdf.union(...seats.map(([x, y, z], i) => sdf.capsule([x, y + (heights[i] ?? 0.06), z], [x, y + (heights[i] ?? 0.06) + 0.012, z], 0.0025)));
    k.body('wick', wicks, { color: '#151210', roughness: 0.9, detail: 0.002, maxTriangles: 200 });

    const flameFor = (x: number, y: number, z: number) => {
      const base = y;
      const f = sdf.smoothUnion(0.012, sdf.sphere(0.0135).at(x, base + 0.014, z), sdf.sphere(0.006).at(x, base + 0.034, z), sdf.sphere(0.003).at(x, base + 0.05, z));
      return f.paintFn((_px, py) => {
        const t = Math.max(0, Math.min(1, (py - base) / 0.05));
        if (t < 0.33) return mixRgb(rgb('#ffd23a'), rgb('#ffa010'), t / 0.33);
        if (t < 0.66) return mixRgb(rgb('#ffa010'), rgb('#ff6a00'), (t - 0.33) / 0.33);
        return mixRgb(rgb('#ff6a00'), rgb('#e8400a'), (t - 0.66) / 0.34);
      });
    };
    const flames = sdf.union(...seats.map(([x, y, z], i) => flameFor(x, y + (heights[i] ?? 0.06) + 0.008, z)));
    k.body('flame', flames, {
      color: '#ffa010',
      roughness: 0.95,
      metalness: 0,
      emissive: '#ff5a00',
      emissiveIntensity: 0.25,
      detail: 0.003,
      maxTriangles: 700,
    });
  },
});
