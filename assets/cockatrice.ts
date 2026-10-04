import { motion, sdf } from '../src/index.js';
import { birdAsset } from './parts/bird-kind.js';

/**
 * Cockatrice — Chibi Quest monster (catalog `monsters/beast/cockatrice`), a rooster with a serpent
 * tail about 0.85 m to the comb, faces +Z. Target: docs/monster-mockups/cockatrice_001.jpg (made
 * with mmx from the griffin mockup).
 *
 * The bird of `assets/parts/bird-kind.ts` (egg body, head, beak, legs, wings, rig, and clips) as a
 * chubby white rooster: a short yellow beak, big glaring yellow eyes, a red comb and a red wattle, a
 * cream belly, small green folded wings, yellow feet, and in place of tail feathers a long green
 * scaly serpent tail on three bones, with an arrow tip, that sways in every clip.
 * Role: a petrifying beast of ruins and caves; the red comb on the white head and the green serpent
 *   tail read at 128 px.
 * Palette (60/30/10): white #f6f2ea body and head; a cream belly; green #4a9a4a wings and tail; a
 *   red comb and wattle #e03a2a and yellow eyes as the accent.
 * Bodies added: comb and wattle (rigid on the head), serpent tail (tagged to its bones).
 */
type V3 = [number, number, number];

const T0: V3 = [0, 0.27, -0.14];
const T1: V3 = [0, 0.2, -0.29];
const T2: V3 = [0, 0.2, -0.44];
const T3: V3 = [0, 0.3, -0.54];
const TIP: V3 = [0, 0.42, -0.56];

export default birdAsset({
  name: 'cockatrice',
  description: 'Chibi cockatrice monster: a chubby white rooster with a short yellow beak, big glaring yellow eyes, a red comb and wattle, small green wings, yellow feet, and a long green serpent tail with an arrow tip; bird rig with wings.',
  reference: 'docs/monster-mockups/cockatrice_001.jpg',
  variants: {
    body: { white: '#f6f2ea', buff: '#ead2a0', black: '#3a3436' },
    head: { white: '#f8f4ee', buff: '#eed8a8', black: '#423c3e' },
    wings: { green: '#4a9a4a', teal: '#3a8a8a', purple: '#7a4a9a' },
    eyes: { yellow: '#f2c020', orange: '#f07a1a', red: '#e03a3a' },
  },
  presets: {
    buff: { body: 'buff', head: 'buff', wings: 'teal', eyes: 'orange' },
    shadow: { body: 'black', head: 'black', wings: 'purple', eyes: 'red' },
  },
  colors: { belly: '#f4e8b8', flight: '#6ab25a', eyeRim: '#fbf8f0', scale: '#f2c43a', scaleDark: '#e0a428' },
  body: [0.17, 0.21, 0.17],
  head: 0.145,
  beak: 'short',
  brows: false,
  eyeScale: 1.35,
  wingRest: -95,
  wingTurn: -35,
  wingScale: 0.55,
  tail: false,
  bones: {
    tail1: { parent: 'tail', at: T1 },
    tail2: { parent: 'tail1', at: T2 },
    tail3: { parent: 'tail2', at: T3, tail: TIP },
  },
  extra(k, b) {
    const { HEAD_C, HR } = b.joints;
    const red = '#e03a2a';
    // A comb of four round lobes along the top of the head, tallest in the middle, and a wattle of
    // two drops under the beak.
    const lobes = ([[0.07, 0.05, 0.042], [0.025, 0.09, 0.05], [-0.025, 0.085, 0.048], [-0.07, 0.05, 0.04]] as const).map(([z, h, r]) => {
      const root = b.topHit(0, HEAD_C[2] + z);
      return sdf.capsule([0, 0, 0], [0, h + 0.01, -0.01], r).scale([0.7, 1, 1]).at(0, root[1] - 0.01, root[2]);
    });
    const comb = sdf.smoothUnion(0.012, ...lobes);
    const chin = b.faceHit(0, HEAD_C[1] - HR * 0.42);
    const wattle = sdf.union(
      sdf.ellipsoid([0.024, 0.04, 0.02]).at(0.02, chin[1] - 0.045, chin[2] + 0.012),
      sdf.ellipsoid([0.024, 0.04, 0.02]).at(-0.02, chin[1] - 0.045, chin[2] + 0.012),
    );
    k.body('comb', sdf.union(comb, wattle).bone('head'), { color: red, roughness: 0.55, detail: 0.004 });
    // The serpent tail: a tapered chain from the rump down, back, and up, on three bones, with
    // darker scale bands and an arrow tip.
    const green = b.tint.wings;
    const dark = b.tone('wings', '#2e6a32', 1);
    const seg = (a: V3, c: V3, ra: number, rc: number, bone: string) => sdf.chain([[...a, ra], [...c, rc]], 0.01).bone(bone);
    const tail = sdf
      .smoothUnion(0.02, seg(T0, T1, 0.055, 0.045, 'tail'), seg(T1, T2, 0.045, 0.036, 'tail1'), seg(T2, T3, 0.036, 0.028, 'tail2'), seg(T3, TIP, 0.028, 0.018, 'tail3'))
      .paintFn((x, y, z, base) => (Math.sin((y * 0.6 - z) * 90) > 0.55 ? [base[0] * 0.75, base[1] * 0.75, base[2] * 0.75] : base))
      .paintWhere(sdf.halfSpace([0, -1, 0], -0.33).intersect(sdf.sphere(0.2).at(...TIP)), dark, 0.02);
    const arrow = sdf
      .cone([0, 0, 0], [0, 0.075, 0], 0.045, 0.004)
      .scale([1, 1, 0.45])
      .rotateX(-12)
      .at(TIP[0], TIP[1] - 0.01, TIP[2])
      .bone('tail3');
    k.body('serpent-tail', sdf.smoothUnion(0.01, tail, arrow.paint(dark)), { color: green, roughness: 0.5 });
  },
  pose(clip, p) {
    const { wave, keys } = motion;
    const n = clip === 'walk' || clip === 'fly' ? 1 : 2;
    let lash = 0;
    if (clip === 'attack') lash = keys(p, [[0, 0], [0.3, -14], [0.5, 20], [1, 0]] as const);
    const sway = (k: number) => ({ rotate: [lash * k + 5 * wave(p, n, 0.2 * k), 14 * k * wave(p, n, 0.15 * k), 0] as [number, number, number] });
    return { tail1: sway(1), tail2: sway(1.3), tail3: sway(1.6) };
  },
});
