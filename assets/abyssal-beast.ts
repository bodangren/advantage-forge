import { sdf } from '../src/index.js';
import { wolfAsset } from './parts/wolf-kind.js';

/**
 * Abyssal beast — Chibi Quest monster (catalog `monsters/abyssal-and-cosmic/abyssal-beast`), a
 * demon hound about 0.85 m to the horn tips, faces +Z. Target:
 * docs/monster-mockups/abyssal-beast_001.jpg (made with mmx from the dire wolf mockup).
 *
 * The dire wolf (`assets/dire-wolf.ts`; body, head, rig, and clips from `assets/parts/wolf-kind.ts`)
 * as a demon hound from the abyss: crimson fur with a near-black muzzle, brows, and chest, small
 * ears, two big curved black horns, glowing orange eyes, black paws, and glowing orange ember spots
 * on the shoulders and the legs, as if lava shows through its hide.
 * Role: a fiend of the abyss family; the horns, the glowing eyes, and the embers read at 128 px.
 * Palette (60/30/10): crimson #7a2228; near-black markings #2e1418; black horns and paws; glowing
 *   orange eyes and embers #ff8a1a as the accent.
 * Bodies added: horns (rigid on the head), embers (on the chest and tagged to the legs).
 * Options: no brows and no forelock, so the round glowing eyes read; smaller ears.
 */

type V3 = [number, number, number];

export default wolfAsset({
  name: 'abyssal-beast',
  description: 'Chibi abyssal beast monster: a crimson demon hound with two big curved black horns, glowing orange eyes, a toothy grin, a near-black chest, black paws, and glowing orange ember spots on its shoulders and legs.',
  reference: 'docs/monster-mockups/abyssal-beast_001.jpg',
  variants: {
    fur: { crimson: '#7a2228', ash: '#4a4048', umber: '#5a3424' },
    markings: { black: '#2e1418', soot: '#3a3436', char: '#2a2018' },
    eyes: { ember: '#ff8a1a', violet: '#b060ff', green: '#80f040' },
  },
  presets: {
    ash: { fur: 'ash', markings: 'soot', eyes: 'violet' },
    umber: { fur: 'umber', markings: 'char', eyes: 'green' },
  },
  colors: { furLight: '#8a2a30', furDark: '#1e1214', earInner: '#4a1a1e', eyeRim: '#c04a10', claw: '#1a1214' },
  earScale: 0.75,
  eyeGlow: 0.6,
  brows: false,
  forelock: false,
  paint(fur, t) {
    // Black paws.
    return fur.paintWhere(sdf.halfSpace([0, 1, 0], 0.085), t.furDark, 0.01);
  },
  extra(k, w) {
    // Two big horns that curve up and in from the top of the head.
    const horn = sdf.chain(
      [
        [0.085, 0.62, 0.12, 0.052],
        [0.15, 0.7, 0.11, 0.04],
        [0.17, 0.78, 0.11, 0.026],
        [0.145, 0.86, 0.13, 0.006],
      ],
      0.02,
    );
    k.body('horns', horn.mirror('x'), { color: '#1e1a1e', roughness: 0.35, bone: 'head', detail: 0.004 });
    // Glowing embers: flat ovals half sunk in the hide, on the shoulders and on the legs.
    const spots = () => {
      const ember = (p: V3, r: number) => sdf.ellipsoid([r, r * 0.8, r]).at(...p);
      const shoulder = (x: number, y: number, z: number, r: number) => ember(w.on(w.trunk, x, y, z, -0.008) as V3, r);
      const chest = sdf.union(shoulder(0.11, 0.33, 0.14, 0.036), shoulder(0.15, 0.3, 0.0, 0.03), shoulder(0.13, 0.3, -0.16, 0.03)).bone('spine');
      const legs = sdf.union(
        ember([0.163, 0.19, 0.08], 0.026).bone('fleg.L'),
        ember([0.158, 0.08, 0.1], 0.02).bone('fshin.L'),
        ember([0.163, 0.19, -0.2], 0.026).bone('bleg.L'),
      );
      return sdf.union(chest, legs).mirror('x');
    };
    k.body('embers', spots(), { color: w.tint.eye, emissive: w.tint.eye, emissiveIntensity: 0.7, roughness: 0.4, detail: 0.003 });
  },
});
