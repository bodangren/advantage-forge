import { mixRgb, motion, rgb, sdf } from '../src/index.js';
import { spiderAsset } from './parts/spider-kind.js';

/**
 * Scorpion — Chibi Quest monster (catalog `monsters/small/scorpion`), about 0.75 m to the top of
 * its curled tail, faces +Z. Target: docs/monster-mockups/scorpion_001.jpg (made with mmx from the
 * giant spider mockup).
 *
 * The giant spider (`assets/giant-spider.ts`; head, thorax, eight legs, fangs, rig, and clips from
 * `assets/parts/spider-kind.ts`) as a giant scorpion: no abdomen, no small eyes, no web spit, and no
 * chest mark; a sandy shell with brown bands on the legs and on the back; two big pincers on arms
 * in front (the outer finger of each claw opens on its own bone); and a segmented tail that curls up
 * over the back to a dark stinger (five bones).
 * Role: a desert and cave enemy; the raised tail and the two pincers read at 128 px, also from
 *   above.
 * Palette (60/30/10): sand #e0a050 (darker underneath); brown bands #8a5a2a; a dark stinger and
 *   claw tips #4a2e18; brown eyes.
 * Bodies added: tail-segments and stinger (tagged to the tail bones), pincers (tagged to the arms).
 * Clips: idle, walk, run, attack (the spider's lunge, with the claws open and snapping and the tail
 *   striking over the head), hit, death.
 */

type V3 = [number, number, number];

// The tail: joints from the back of the thorax, up and over the back, to the stinger.
const TAIL: V3[] = [
  [0, 0.22, -0.08],
  [0, 0.31, -0.22],
  [0, 0.46, -0.29],
  [0, 0.61, -0.26],
  [0, 0.71, -0.16],
  [0, 0.73, -0.05],
];
const SEG_R = [0.095, 0.088, 0.08, 0.07, 0.06];
// A pincer arm (left): the root at the front of the thorax, the elbow, and the wrist.
const ARM_ROOT: V3 = [0.12, 0.19, 0.2];
const ARM_ELBOW: V3 = [0.25, 0.19, 0.3];
const ARM_WRIST: V3 = [0.27, 0.17, 0.4];
const NIP: V3 = [0.34, 0.16, 0.54]; // the pivot of the outer (moving) finger
const BAND = '#8a5a2a';

const mxv = (p: V3): V3 => [-p[0], p[1], p[2]];

export default spiderAsset({
  name: 'scorpion',
  description: 'Chibi scorpion monster: a sandy giant scorpion with big round eyes, small fangs, eight brown-banded legs, two big pincers in front, and a segmented tail curled over its back to a dark stinger.',
  reference: 'docs/monster-mockups/scorpion_001.jpg',
  variants: {
    body: { sand: '#e0a050', ochre: '#c88a3a', black: '#3a3236' },
    markings: { brown: BAND, rust: '#9a4a2a', grey: '#6a6460' },
    eyes: { brown: '#5a3a1a', amber: '#e8a020', red: '#c8302a' },
  },
  presets: {
    canyon: { body: 'ochre', markings: 'rust', eyes: 'amber' },
    emperor: { body: 'black', markings: 'grey', eyes: 'red' },
  },
  colors: { bodyDark: '#b07a34', brow: '#a86a30', claw: '#4a2e18', irisRim: '#2e1c0c', pupil: '#140c06', fang: '#f4ecd8' },
  abdomen: false,
  smallEyes: false,
  web: false,
  chestMark: false,
  fangScale: 0.7,
  face: {
    // Brown bands across the back of the thorax.
    paint(carapace, s) {
      const band = rgb(s.tint.markings);
      return carapace.paintFn((_x, y, z, c) => {
        const back = Math.min(1, Math.max(0, (0.06 - z) * 20)) * Math.min(1, Math.max(0, (y - 0.2) * 20));
        return Math.sin(z * 70) > 0.35 ? mixRgb(c, band, back) : c;
      });
    },
  },
  bones: {
    tail1: { parent: 'body', at: TAIL[0]! },
    tail2: { parent: 'tail1', at: TAIL[1]! },
    tail3: { parent: 'tail2', at: TAIL[2]! },
    tail4: { parent: 'tail3', at: TAIL[3]! },
    sting: { parent: 'tail4', at: TAIL[4]!, tail: [0, 0.64, 0.03] },
    'arm.L': { parent: 'body', at: ARM_ROOT },
    'claw.L': { parent: 'arm.L', at: ARM_WRIST },
    'nip.L': { parent: 'claw.L', at: NIP, tail: [0.255, 0.16, 0.72] },
    'arm.R': { parent: 'body', at: mxv(ARM_ROOT) },
    'claw.R': { parent: 'arm.R', at: mxv(ARM_WRIST) },
    'nip.R': { parent: 'claw.R', at: mxv(NIP), tail: [-0.255, 0.16, 0.72] },
  },
  extra(k, s) {
    // Tail segments: one capsule per bone, a little shorter than the bone, so a small groove
    // shows at each joint.
    const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
    const segs = sdf.smoothUnion(
      0.012,
      ...SEG_R.map((r, i) => {
        const a = TAIL[i]!;
        const b = TAIL[i + 1]!;
        return sdf.capsule(lerp(a, b, 0.2), lerp(a, b, 0.8), r).bone(i < 4 ? `tail${i + 1}` : 'sting');
      }),
    );
    const band = s.tint.markings;
    k.body('tail-segments', segs.paintWhere(sdf.union(...TAIL.slice(1, 5).map((p) => sdf.sphere(0.03).at(p[0], p[1], p[2]).scale([3, 1, 1]))), band, 0.01), {
      color: s.tint.body,
      roughness: 0.6,
    });
    // The stinger: a bulb and a curved spike that points forward and down.
    const tip = TAIL[5]!;
    const stinger = sdf
      .smoothUnion(
        0.015,
        sdf.sphere(0.055).at(tip[0], tip[1], tip[2] - 0.02),
        sdf.chain(
          [
            [tip[0], tip[1], tip[2] + 0.01, 0.03],
            [tip[0], tip[1] - 0.015, tip[2] + 0.06, 0.016],
            [tip[0], tip[1] - 0.06, tip[2] + 0.085, 0.003],
          ],
          0.008,
        ),
      )
      .bone('sting');
    k.body('stinger', stinger, { color: s.tint.dark, roughness: 0.35, detail: 0.004 });
    // The pincers: an arm in two parts, a big palm with the inner finger, and the outer finger.
    const arm = sdf
      .smoothUnion(
        0.02,
        sdf.chain([[...ARM_ROOT, 0.048], [...ARM_ELBOW, 0.056]], 0.01),
        sdf.chain([[...ARM_ELBOW, 0.056], [...ARM_WRIST, 0.062]], 0.01),
      )
      .bone('arm.L');
    const palm = sdf
      .smoothUnion(
        0.02,
        sdf.ellipsoid([0.1, 0.085, 0.12]).at(0.29, 0.155, 0.48),
        sdf.cone([0.25, 0.15, 0.56], [0.2, 0.15, 0.71], 0.055, 0.012),
      )
      .bone('claw.L');
    const finger = sdf.cone([NIP[0], NIP[1], NIP[2]], [0.255, 0.16, 0.72], 0.05, 0.01).bone('nip.L');
    const pincer = sdf
      .smoothUnion(0.018, arm, palm)
      .union(finger)
      .paintWhere(sdf.union(sdf.sphere(0.05).at(0.2, 0.15, 0.71), sdf.sphere(0.05).at(0.255, 0.16, 0.72)), s.tint.dark, 0.012);
    k.body('pincers', pincer.mirror('x'), { color: s.tint.body, roughness: 0.6 });
  },
  pose(clip, p) {
    const { wave, keys } = motion;
    const n = clip === 'run' ? 2 : 1;
    // The tail sways; the claws open and close a little.
    const sway = 4 * wave(p, n);
    let strike = 0;
    let open = 6 + 6 * wave(p, n, 0.3);
    let reach = 0;
    if (clip === 'attack') {
      // Cocked back in the rear-up, then a strike over the head at the lunge; the claws open wide
      // and snap shut on the bite.
      strike = keys(p, [[0, 0], [0.3, -14], [0.4, -16], [0.48, 20], [0.6, 18], [1, 0]] as const);
      open = keys(p, [[0, 6], [0.3, 32], [0.42, 34], [0.47, -4], [0.62, -4], [1, 6]] as const);
      reach = keys(p, [[0, 0], [0.3, -10], [0.45, 18], [0.62, 16], [1, 0]] as const);
    } else if (clip === 'hit') {
      strike = keys(p, [[0, 0], [0.2, -12], [1, 0]] as const);
    } else if (clip === 'death') {
      strike = keys(p, [[0, 0], [0.4, 20], [1, 24]] as const);
      open = keys(p, [[0, 6], [0.4, 20], [1, 20]] as const);
    }
    const tail = (k: number) => ({ rotate: [strike * k, sway * (1 - k * 0.5), 0] as [number, number, number] });
    return {
      tail1: tail(0.15),
      tail2: tail(0.25),
      tail3: tail(0.3),
      tail4: tail(0.3),
      sting: { rotate: [strike * 0.3, 0, 0] },
      'arm.L': { rotate: [0, -reach, 0] },
      'arm.R': { rotate: [0, reach, 0] },
      'nip.L': { rotate: [0, -open, 0] },
      'nip.R': { rotate: [0, open, 0] },
    };
  },
});
