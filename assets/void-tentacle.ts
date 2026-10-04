import { noise, profile, sdf } from '../src/index.js';
import { octopusAsset } from './parts/octopus-kind.js';

/**
 * Void tentacle — Chibi Quest monster (catalog `monsters/abyssal-and-cosmic/void-tentacle`), a small
 * octopus from the void that rises out of a round portal, about 0.7 m tall, faces +Z. Target:
 * docs/monster-mockups/void-tentacle_001.jpg (made with mmx from the eldritch eye mockup).
 *
 * The octopus of `assets/parts/octopus-kind.ts` (a head dome, tentacles on their own bones, a face,
 * rig, and clips): a purple dome with small bumps, two glossy black eyes, and a small smile; five
 * tentacles that leave a dark portal pot, two short ones raised in front with glowing violet tips and
 * three long ones that arch out to the sides and the back. The portal is a dark rim with drips on the
 * ground and a glowing violet swirl inside.
 * Role: a creature of the void rifts; the portal ring and the glowing tips read at 128 px.
 * Palette (60/30/10): purple #8a6ad8 skin; dark violet #4a2f80 portal; glowing lilac #c8a0ff tips
 *   and swirl as the accent.
 * Bodies added: portal (rigid on `root`), swirl (glowing, on `root`), tips (glowing, on the tip bones).
 */
type V3 = [number, number, number];

export default octopusAsset({
  name: 'void-tentacle',
  description: 'Chibi void tentacle monster: a small purple octopus with a bumpy dome head, glossy black eyes, and a small smile that rises out of a dark round portal pot, two short front tentacles with glowing violet tips, and three long tentacles that arch out to the sides and the back; octopus rig.',
  reference: 'docs/monster-mockups/void-tentacle_001.jpg',
  variants: {
    body: { purple: '#8a6ad8', indigo: '#5a5ac8', magenta: '#b05ab8' },
    eyes: { black: '#141018', blue: '#1a2050', plum: '#2a1030' },
    glow: { lilac: '#c8a0ff', cyan: '#80e0ff', pink: '#ff90d0' },
    portal: { violet: '#4a2f80', night: '#262a5a', wine: '#5a2050' },
  },
  presets: {
    deep: { body: 'indigo', eyes: 'blue', glow: 'cyan', portal: 'night' },
    bloom: { body: 'magenta', eyes: 'plum', glow: 'pink', portal: 'wine' },
  },
  head: { at: [0, 0.48, 0], r: [0.19, 0.18, 0.18] },
  base: [0, 0.22, 0],
  tentacles: [
    { angle: 35, points: [[0.06, 0.22, 0.057], [0.12, 0.27, 0.049], [0.17, 0.35, 0.041], [0.17, 0.43, 0.034]] },
    { angle: -35, points: [[0.06, 0.22, 0.057], [0.13, 0.26, 0.049], [0.18, 0.33, 0.041], [0.19, 0.4, 0.034]] },
    { angle: 100, points: [[0.08, 0.22, 0.06], [0.2, 0.3, 0.053], [0.32, 0.32, 0.044], [0.4, 0.25, 0.034], [0.4, 0.15, 0.025]] },
    { angle: -105, points: [[0.08, 0.22, 0.06], [0.19, 0.31, 0.053], [0.31, 0.34, 0.044], [0.39, 0.28, 0.034], [0.4, 0.18, 0.025]] },
    { angle: 180, points: [[0.08, 0.22, 0.057], [0.16, 0.34, 0.051], [0.26, 0.4, 0.041], [0.33, 0.34, 0.032], [0.34, 0.25, 0.023]] },
  ],
  eyes: { r: 0.036, x: 0.36, y: 0.02 },
  bumps: true,
  extra(k, o) {
    const glow = k.tint('glow');
    // The portal: a dark pot with a thick rim and drips that run down to a ragged foot on the ground.
    const pot = sdf.revolve(
      profile.polygon(
        [
          [0, 0],
          [0.25, 0],
          [0.26, 0.03],
          [0.22, 0.07],
          [0.2, 0.12],
          [0.21, 0.16],
          [0.17, 0.17],
          [0.15, 0.13],
          [0, 0.13],
        ],
        { smooth: true, samples: 5 },
      ),
    );
    const drips = sdf.union(
      ...Array.from({ length: 9 }, (_, i) => {
        const a = (i / 9) * Math.PI * 2 + noise.random(i, 2, 3) * 0.4;
        const r = 0.215;
        const len = 0.03 + noise.random(i, 4, 5) * 0.04;
        const end: [number, number, number] = [Math.sin(a) * (r + 0.015), 0.14 - len, Math.cos(a) * (r + 0.015)];
        return sdf.smoothUnion(0.015, sdf.capsule([Math.sin(a) * r, 0.15, Math.cos(a) * r], end, 0.02), sdf.sphere(0.028).at(...end));
      }),
    );
    k.body('portal', sdf.smoothUnion(0.03, pot, drips).bone('root'), { color: k.tint('portal'), roughness: 0.4 });
    // A glowing swirl on the inside floor of the pot.
    const swirl = sdf
      .cylinder(0.15, 0.012)
      .at(0, 0.135, 0)
      .paintFn((x, _y, z, c) => {
        const a = Math.atan2(z, x) + Math.hypot(x, z) * 30;
        return Math.sin(a * 3) > 0.2 ? c : [c[0] * 0.55, c[1] * 0.45, c[2] * 0.8];
      });
    k.body('swirl', swirl.bone('root'), { color: glow, roughness: 0.3, emissive: glow, emissiveIntensity: 0.6 });
    // Glowing tips on the two front tentacles.
    const tips = sdf.union(
      ...o.arms.slice(0, 2).map((a) => {
        const p = a.points[a.points.length - 1]!;
        const q = a.points[a.points.length - 2]!;
        const tip: V3 = [p[0], p[1], p[2]];
        const back: V3 = [p[0] + (q[0] - p[0]) * 0.35, p[1] + (q[1] - p[1]) * 0.35, p[2] + (q[2] - p[2]) * 0.35];
        return sdf.capsule(back, tip, p[3] + 0.006).bone(a.tipBone);
      }),
    );
    k.body('tips', tips, { color: glow, roughness: 0.3, emissive: glow, emissiveIntensity: 0.5 });
  },
});
