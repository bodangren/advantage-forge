import { motion, sdf } from '../src/index.js';
import { wolfAsset } from './parts/wolf-kind.js';

/**
 * Displacer beast — Chibi Quest monster (catalog `monsters/beast/displacer-beast`), a tentacled
 * panther about 0.75 m tall and 1.0 m across the tentacles, faces +Z. Target:
 * docs/monster-mockups/displacer-beast_001.jpg (made with mmx from the dire wolf mockup).
 *
 * The dire wolf of `assets/dire-wolf.ts` (body, head, rig, and clips from `assets/parts/wolf-kind.ts`)
 * as a displacer beast: dark blue-black fur, dark slate markings, smaller cat-like ears, glowing
 * green eyes, and two long tentacles that grow from its shoulders and end in spiked pads.
 * Role: a cunning ambush beast; the two tentacles make the silhouette at 128 px.
 * Palette (60/30/10): blue-black #2a3040 fur; dark slate #4a5468 muzzle and ruff; slate tentacles
 *   with bone-white spikes; green eyes as the accent.
 * Features: each tentacle has two bones (`tent1.L` on the spine, `tent2.L` at its middle; mirrored
 *   for the right) that sway in every clip and whip forward in the attack.
 */

type V3 = readonly [number, number, number];
const ROOT: V3 = [0.08, 0.4, 0.0];
const MID: V3 = [0.28, 0.6, -0.09];
const TIP: V3 = [0.45, 0.5, -0.22];
// An arch: up and out from the shoulder, over, and down toward the pad.
const PTS: [number, number, number, number][] = [
  [ROOT[0], ROOT[1], ROOT[2], 0.055],
  [0.17, 0.54, -0.03, 0.047],
  [MID[0], MID[1], MID[2], 0.039],
  [0.38, 0.58, -0.16, 0.031],
  [TIP[0], TIP[1], TIP[2], 0.026],
];
const CYCLES: Record<string, number> = { idle: 1, walk: 2, run: 2, attack: 1, hit: 1, death: 1, howl: 2 };

export default wolfAsset({
  name: 'displacer-beast',
  description: 'Chibi displacer beast monster: a dark blue-black panther-like beast with a toothy grin, small ears, glowing green eyes, and two long tentacles from its shoulders that end in spiked pads; quadruped rig.',
  reference: 'docs/monster-mockups/displacer-beast_001.jpg',
  variants: {
    fur: { night: '#2a3040', violet: '#3a2e48', grey: '#40444a' },
    markings: { slate: '#4a5468', dusk: '#5a4a6a', ash: '#6a6e72' },
    eyes: { green: '#5aff6a', yellow: '#f0e040', cyan: '#4ae8ff' },
  },
  presets: {
    violet: { fur: 'violet', markings: 'dusk', eyes: 'yellow' },
    grey: { fur: 'grey', markings: 'ash', eyes: 'cyan' },
  },
  colors: { furLight: '#3a4256', furDark: '#1c2030', earInner: '#4a4a5a', eyeRim: '#1e6a2a', nose: '#101216', mouth: '#16121a', claw: '#d8d4c8' },
  earScale: 0.75,
  eyeGlow: 0.9,
  bones: {
    'tent1.L': { parent: 'spine', at: ROOT },
    'tent2.L': { parent: 'tent1.L', at: MID, tail: TIP },
    'tent1.R': { parent: 'spine', at: [-ROOT[0], ROOT[1], ROOT[2]] },
    'tent2.R': { parent: 'tent1.R', at: [-MID[0], MID[1], MID[2]], tail: [-TIP[0], TIP[1], TIP[2]] },
  },
  extra(k, wolf) {
    const tentacle = sdf.smoothUnion(0.02, sdf.chain(PTS.slice(0, 3), 0.015).bone('tent1.L'), sdf.chain(PTS.slice(2), 0.015).bone('tent2.L'));
    // The pad: a flat round club at the tip, with a ring of spikes.
    const pad = sdf.ellipsoid([0.06, 0.045, 0.06]).at(TIP[0] + 0.02, TIP[1] - 0.02, TIP[2] - 0.02).bone('tent2.L');
    k.body('tentacles', sdf.smoothUnion(0.02, tentacle, pad).mirror('x'), { color: wolf.tint.fur, roughness: 0.6, textureDensity: 1.2 });
    const spikes = sdf
      .union(
        ...[0, 60, 120, 180, 240, 300].map((deg) => {
          const a = (deg * Math.PI) / 180;
          const c: V3 = [TIP[0] + 0.02, TIP[1] - 0.02, TIP[2] - 0.02];
          return sdf.cone([c[0] + Math.cos(a) * 0.045, c[1] + Math.sin(a) * 0.032, c[2]], [c[0] + Math.cos(a) * 0.1, c[1] + Math.sin(a) * 0.075, c[2] - 0.012], 0.016, 0.002);
        }),
      )
      .bone('tent2.L');
    k.body('pad-spikes', spikes.mirror('x'), { color: '#d8d4c8', roughness: 0.4, detail: 0.003 });
  },
  pose(clip, p) {
    const n = CYCLES[clip] ?? 1;
    const { wave, keys } = motion;
    let a1: [number, number, number] = [8 * wave(p, n), 10 * wave(p, n, 0.2), 6 * wave(p, n, 0.4)];
    let a2: [number, number, number] = [12 * wave(p, n, 0.3), 16 * wave(p, n, 0.5), 10 * wave(p, n, 0.6)];
    if (clip === 'attack') {
      // The tentacles rise, then whip forward over the head and back.
      const lift = keys(p, [[0, 0], [0.3, 1], [0.45, -0.6], [0.7, -0.3], [1, 0]] as const);
      a1 = [a1[0] - 30 * lift, a1[1] - 40 * Math.max(0, -lift), a1[2] + 30 * lift];
      a2 = [a2[0] - 30 * lift, a2[1], a2[2] + 25 * lift];
    }
    const mirror = (r: [number, number, number]): [number, number, number] => [r[0], -r[1], -r[2]];
    return { 'tent1.L': { rotate: a1 }, 'tent2.L': { rotate: a2 }, 'tent1.R': { rotate: mirror(a1) }, 'tent2.R': { rotate: mirror(a2) } };
  },
});
