import { motion, sdf } from '../src/index.js';
import { flameTongue } from './parts/element-features.js';
import { wolfAsset } from './parts/wolf-kind.js';

/**
 * Shadow hound — Chibi Quest monster (catalog `monsters/abyssal-and-cosmic/shadow-hound`), about
 * 0.85 m to the ear tips, faces +Z. Target: docs/monster-mockups/shadow-hound_001.jpg (made with
 * mmx from the dire wolf mockup).
 *
 * The dire wolf of `assets/dire-wolf.ts` (body, head, rig, and clips from `assets/parts/wolf-kind.ts`)
 * as a hound of shadow: near-black fur, dark violet markings, taller ears, glowing violet eyes,
 * and wisps of clear violet smoke that rise from its back and its tail.
 * Role: a fast night hunter of the abyss; the glowing eyes and the smoke read at 128 px on dark
 *   ground.
 * Palette (60/30/10): near-black #24222a fur; dark violet #4a3a6a muzzle, brows, and ruff; violet
 *   smoke #9a6ae0; bright violet eyes as the accent.
 * Features: two smoke plumes on their own bones (`smokeFront` on the spine, `smokeBack` on the
 *   hips) that flicker in every clip, and a wisp at the tail tip.
 */

const CYCLES: Record<string, number> = { idle: 3, walk: 2, run: 2, attack: 2, hit: 1, death: 3, howl: 3 };

export default wolfAsset({
  name: 'shadow-hound',
  description: 'Chibi shadow hound monster: a near-black wolf hound with a toothy grin, tall ears, dark violet markings, glowing violet eyes, and wisps of violet smoke rising from its back and tail; quadruped rig.',
  reference: 'docs/monster-mockups/shadow-hound_001.jpg',
  variants: {
    fur: { black: '#24222a', night: '#1e2430', ash: '#3a3438' },
    markings: { violet: '#4a3a6a', indigo: '#3a3e6a', ember: '#6a3a2a' },
    eyes: { violet: '#c070ff', cyan: '#5ae0ff', red: '#ff4a3a' },
  },
  presets: {
    night: { fur: 'night', markings: 'indigo', eyes: 'cyan' },
    ember: { fur: 'ash', markings: 'ember', eyes: 'red' },
  },
  colors: { furLight: '#34303c', furDark: '#16141a', earInner: '#5a3a6a', eyeRim: '#5a2a8a', nose: '#0e0c10', mouth: '#1a1018' },
  earScale: 1.15,
  eyeGlow: 1.1,
  bones: {
    smokeFront: { parent: 'spine', at: [0, 0.42, 0.0] },
    smokeBack: { parent: 'hips', at: [0, 0.37, -0.17] },
  },
  extra(k, wolf) {
    // Wisps rooted on the top of the back, leaning back and out; a wisp at the tail tip.
    const wisp = (x: number, z: number, lean: number, h: number, r: number) => {
      const p = wolf.on(wolf.trunk, x, 0.6, z, -0.012);
      return flameTongue(p[0], p[1], p[2], lean, h, r, 0.07);
    };
    const front = sdf.union(wisp(0.04, 0.06, 20, 0.16, 0.03), wisp(-0.05, 0.0, -24, 0.14, 0.028), wisp(0.0, -0.05, 4, 0.19, 0.032)).bone('smokeFront');
    const back = sdf.union(wisp(0.05, -0.14, 26, 0.13, 0.026), wisp(-0.04, -0.2, -18, 0.15, 0.028)).bone('smokeBack');
    const tail = flameTongue(0.09, 0.53, -0.44, 14, 0.12, 0.025, 0.05).bone('tail');
    k.body('smoke', sdf.union(front, back, tail), { color: wolf.tone('eyes', '#9a6ae0', 0.7), roughness: 0.6, opacity: 0.7, emissive: wolf.tone('eyes', '#8a5ad8', 0.7), emissiveIntensity: 0.45, detail: 0.004 });
  },
  pose(clip, p) {
    const n = CYCLES[clip] ?? 2;
    const w = motion.wave(p, n);
    const f = (o: number) => ({ rotate: [6 * motion.wave(p, n, o), 0, 5 * motion.wave(p, n, o + 0.3)] as [number, number, number], scale: [1, 1 + 0.12 * motion.wave(p, n, o), 1] as [number, number, number] });
    return { smokeFront: f(0), smokeBack: f(0.4 + 0 * w) };
  },
});
