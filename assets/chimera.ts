import { motion, noise, sdf } from '../src/index.js';
import { wolfAsset } from './parts/wolf-kind.js';

/**
 * Chimera — Chibi Quest monster (catalog `monsters/beast/chimera`), a lion cub with a goat head and
 * a snake tail, about 0.9 m tall to the goat's horns, faces +Z. Target:
 * docs/monster-mockups/chimera_001.jpg (made with mmx from the displacer beast mockup).
 *
 * The dire wolf (`assets/dire-wolf.ts`; body, head, rig, and clips from `assets/parts/wolf-kind.ts`)
 * as a chimera cub: golden fur with a cream muzzle and chest, a closed smile, no brows and no
 * forelock, a fluffy orange-brown mane around the lion head; a small cream goat head with floppy
 * ears and curled brown horns on a short neck that rises from the back; and in place of the bushy
 * tail a green snake with a small head, black eyes, and a pink tongue. The goat head butts and the
 * snake bites in the attack.
 * Role: a beast of the hills and the ruins; the three heads (lion, goat, snake) read at 128 px.
 * Palette (60/30/10): gold #e8b040 fur; orange-brown #c8803a mane; green #5aa04a snake and cream
 *   #f2e6d0 goat as the accents.
 * Bones added: `goatneck` and `goathead` (on `spine`), `tail2` to `tail4` (after `tail`).
 */
type V3 = [number, number, number];

const T: V3[] = [
  [0, 0.32, -0.3],
  [0, 0.35, -0.42],
  [0.03, 0.43, -0.5],
  [0.05, 0.54, -0.5],
  [0.04, 0.6, -0.43],
];
const GOAT_NECK: V3 = [0, 0.42, -0.2];
const GOAT_HEAD: V3 = [0, 0.64, -0.2];

export default wolfAsset({
  name: 'chimera',
  description: 'Chibi chimera monster: a golden lion cub with a cream muzzle, a fluffy orange-brown mane, and a closed smile; a small cream goat head with floppy ears and curled brown horns on a neck from its back; and a green snake for a tail with black eyes and a pink tongue; wolf rig with goat and tail bones.',
  reference: 'docs/monster-mockups/chimera_001.jpg',
  variants: {
    fur: { gold: '#e8b040', sand: '#d8b88a', red: '#d8704a' },
    markings: { cream: '#f6e4b8', pale: '#f2ece0', peach: '#f4c8a8' },
    eyes: { green: '#4a7a30', amber: '#c08020', blue: '#3a6aa8' },
    mane: { amber: '#c8803a', brown: '#7a4a28', red: '#a83a2a' },
  },
  presets: {
    dune: { fur: 'sand', markings: 'pale', eyes: 'amber', mane: 'brown' },
    ember: { fur: 'red', markings: 'peach', eyes: 'blue', mane: 'red' },
  },
  colors: { furLight: '#f2c870', furDark: '#c08a2a', earInner: '#f4c8a8' },
  earScale: 0.9,
  brows: false,
  forelock: false,
  smile: true,
  tail: false,
  bones: {
    goatneck: { parent: 'spine', at: GOAT_NECK },
    goathead: { parent: 'goatneck', at: GOAT_HEAD, tail: [0, 0.76, -0.08] },
    tail2: { parent: 'tail', at: T[1]! },
    tail3: { parent: 'tail2', at: T[2]! },
    tail4: { parent: 'tail3', at: T[3]!, tail: T[4]! },
  },
  extra(k) {
    const mane = k.tint('mane');
    // A fluffy mane over the top, the sides, and the back of the lion head, with a hole for the face.
    const lobes = (x: number, y: number, z: number) => noise.fbm(x * 12, y * 12, z * 12, 2) + 0.6 * Math.sin(Math.atan2(y - 0.47, x) * 9);
    const ruff = sdf
      .ellipsoid([0.25, 0.24, 0.22])
      .at(0, 0.51, 0.1)
      .displace(0.016, lobes)
      .smoothSubtract(0.03, sdf.ellipsoid([0.18, 0.155, 0.3]).at(0, 0.48, 0.32))
      .bone('head');
    const neckMane = sdf.ellipsoid([0.16, 0.18, 0.15]).at(0, 0.36, 0.06).displace(0.012, lobes).bone('neck');
    k.body('mane', sdf.smoothUnion(0.04, ruff, neckMane), { color: mane, roughness: 0.85, detail: 0.006 });

    // The goat: a short neck from the back, a small round head with a muzzle, floppy ears, curled
    // horns, black eyes, and a pink nose.
    const cream = '#f2e6d0';
    const G = 1.25; // the goat head scale
    const gh: V3 = [GOAT_HEAD[0], GOAT_HEAD[1] + 0.06, GOAT_HEAD[2] + 0.03];
    const goatNeck = sdf.chain([[GOAT_NECK[0], GOAT_NECK[1] - 0.02, GOAT_NECK[2], 0.06], [GOAT_HEAD[0], GOAT_HEAD[1], GOAT_HEAD[2], 0.05]], 0.02).bone('goatneck');
    // The head is built at the origin, then scaled and moved to `gh`.
    const local = sdf.smoothUnion(0.02, sdf.ellipsoid([0.072, 0.066, 0.075]), sdf.ellipsoid([0.046, 0.04, 0.05]).at(0, -0.025, 0.06));
    const place = (sh: sdf.Shape) => sh.scale(G).at(...gh);
    const skull = place(local);
    const ear = place(sdf.ellipsoid([0.04, 0.014, 0.022]).rotateZ(-30).at(0.08, 0.005, -0.01));
    const nose = sdf.raycast(skull, [gh[0], gh[1] - 0.02 * G, 2], [0, 0, -1])! as V3;
    const goat = sdf
      .smoothUnion(0.012, skull, ear.mirror('x'))
      .paintWhere(sdf.sphere(0.016).at(nose[0], nose[1], nose[2]), '#f0a0a8', 0.003)
      .bone('goathead');
    k.body('goat', sdf.smoothUnion(0.02, goatNeck, goat), { color: cream, roughness: 0.7 });
    const eyeAt = sdf.surfacePoint(skull, [gh[0] + 0.035 * G, gh[1] + 0.012 * G, gh[2] + 0.07 * G], -0.004);
    const eye = sdf
      .sphere(0.016)
      .at(...eyeAt)
      .paintWhere(sdf.sphere(0.005).at(eyeAt[0] + 0.005, eyeAt[1] + 0.006, eyeAt[2] + 0.013), '#ffffff', 0.001);
    k.body('goat-eyes', eye.mirror('x').bone('goathead'), { color: '#161214', roughness: 0.15, detail: 0.003 });
    const horn = place(
      sdf.chain(
        [
          [0.03, 0.05, -0.01, 0.018],
          [0.07, 0.08, -0.05, 0.015],
          [0.1, 0.05, -0.09, 0.012],
          [0.09, 0.0, -0.07, 0.009],
          [0.075, 0.005, -0.04, 0.007],
        ],
        0.008,
      ),
    );
    k.body('goat-horns', horn.mirror('x').bone('goathead'), { color: '#8a5a32', roughness: 0.5, detail: 0.003 });

    // The snake tail: a tapered green chain on four bones, with a small head at the tip that looks
    // forward, black eyes, and a forked pink tongue.
    const green = '#5aa04a';
    const radii = [0.04, 0.034, 0.03, 0.028, 0.026];
    const body = sdf.smoothUnion(
      0.01,
      ...T.slice(0, -1).map((a, i) => sdf.chain([[...a, radii[i]!], [...T[i + 1]!, radii[i + 1]!]], 0.01).bone(i === 0 ? 'tail' : `tail${i + 1}`)),
    );
    const tip = T[4]!;
    const sh: V3 = [tip[0], tip[1] + 0.015, tip[2] + 0.03];
    const snakeHead = sdf.ellipsoid([0.04, 0.032, 0.052]).at(...sh).bone('tail4');
    k.body('snake', sdf.smoothUnion(0.012, body, snakeHead), { color: green, roughness: 0.5 });
    const sEye = sdf.surfacePoint(snakeHead, [sh[0] + 0.03, sh[1] + 0.012, sh[2] + 0.025], -0.003);
    const sEyeR: V3 = [2 * sh[0] - sEye[0], sEye[1], sEye[2]];
    k.body('snake-eyes', sdf.union(sdf.sphere(0.01).at(...sEye), sdf.sphere(0.01).at(...sEyeR)).bone('tail4'), { color: '#161214', roughness: 0.15, detail: 0.003 });
    const t0: V3 = [sh[0], sh[1] - 0.012, sh[2] + 0.05];
    const tongue = sdf.union(
      sdf.capsule(t0, [t0[0], t0[1] - 0.006, t0[2] + 0.025], 0.004),
      sdf.capsule([t0[0], t0[1] - 0.006, t0[2] + 0.025], [t0[0] + 0.008, t0[1] - 0.012, t0[2] + 0.036], 0.003),
      sdf.capsule([t0[0], t0[1] - 0.006, t0[2] + 0.025], [t0[0] - 0.008, t0[1] - 0.012, t0[2] + 0.036], 0.003),
    );
    k.body('snake-tongue', tongue.bone('tail4'), { color: '#e0707e', roughness: 0.4, detail: 0.002 });
  },
  pose(clip, p) {
    const { wave, keys } = motion;
    // The goat head looks around; the snake sways. In the attack the goat butts and the snake bites.
    let butt = 0;
    let bite = 0;
    if (clip === 'attack') {
      butt = keys(p, [[0, 0], [0.28, -1], [0.45, 1.2], [0.62, 1], [1, 0]]);
      bite = keys(p, [[0, 0], [0.32, -1], [0.5, 1.3], [0.66, 1], [1, 0]]);
    }
    const droop = clip === 'death' ? keys(p, [[0.3, 0], [0.7, 1]]) : 0;
    const n = clip === 'run' ? 3 : clip === 'walk' ? 2 : 1;
    const sway = (k: number) => [-14 * bite * k + 25 * droop * k, 10 * k * wave(p, n, 0.2 * k), 0] as [number, number, number];
    return {
      goatneck: { rotate: [12 * butt - 40 * droop, 0, 0] },
      goathead: { rotate: [10 * butt + 3 * wave(p, n), 14 * wave(p, 1, 0.3) * (1 - droop), 0] },
      tail2: { rotate: sway(1) },
      tail3: { rotate: sway(1.2) },
      tail4: { rotate: sway(1.4) },
    };
  },
});
