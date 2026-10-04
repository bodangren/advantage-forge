import { motion, noise, profile, sdf } from '../src/index.js';
import { wolfAsset } from './parts/wolf-kind.js';

/**
 * Manticore — Chibi Quest monster (catalog `monsters/beast/manticore`), a lion cub with bat wings and
 * a scorpion tail, about 0.8 m tall to the top of the tail, faces +Z. Target:
 * docs/monster-mockups/manticore_001.jpg (made with mmx from the displacer beast mockup).
 *
 * The dire wolf (`assets/dire-wolf.ts`; body, head, rig, and clips from `assets/parts/wolf-kind.ts`)
 * as a manticore cub: red fur with a peach muzzle and chest, small round ears, a closed smile, no
 * brows and no forelock, a big shaggy dark red mane around the head and down the neck, two small
 * dark bat wings on the shoulders, and in place of the bushy tail a segmented scorpion tail that
 * curls up over the back to a round stinger. The wings flap and the tail stings in the attack.
 * Role: a desert and mountain beast; the mane, the wings, and the curled tail read at 128 px.
 * Palette (60/30/10): red #e0584a fur; dark red #8a2436 mane and wings; peach #f4b098 muzzle; a
 *   dark #5a1a2a stinger as the accent.
 * Bones added: `wing.L`, `wing.R` (on `spine`), `tail2` to `tail4` (after `tail`).
 */
type V3 = [number, number, number];

const T: V3[] = [
  [0, 0.32, -0.3],
  [0, 0.4, -0.42],
  [0, 0.54, -0.47],
  [0, 0.68, -0.42],
  [0, 0.75, -0.31],
];
const WING_AT: V3 = [0.07, 0.44, -0.13];

export default wolfAsset({
  name: 'manticore',
  description: 'Chibi manticore monster: a red lion cub with a peach muzzle, a big shaggy dark red mane, small round ears, a closed smile, two small dark red bat wings, and a segmented scorpion tail that curls over its back to a round stinger; wolf rig with wings and tail bones.',
  reference: 'docs/monster-mockups/manticore_001.jpg',
  variants: {
    fur: { red: '#e0584a', gold: '#e0a040', sand: '#d8b080' },
    markings: { peach: '#f4b098', cream: '#f4e2c0', pale: '#f2e8dc' },
    eyes: { blue: '#3a6ac0', amber: '#d08a20', green: '#3a8a40' },
    mane: { wine: '#8a2436', brown: '#6a3a1e', violet: '#5a3a7a' },
  },
  presets: {
    sun: { fur: 'gold', markings: 'cream', eyes: 'amber', mane: 'brown' },
    dusk: { fur: 'sand', markings: 'pale', eyes: 'green', mane: 'violet' },
  },
  colors: { furLight: '#f08a70', furDark: '#b83a34', earInner: '#f4b098' },
  earScale: 0.9,
  brows: false,
  forelock: false,
  smile: true,
  tail: false,
  bones: {
    'wing.L': { parent: 'spine', at: WING_AT, tail: [0.3, 0.55, -0.2] },
    'wing.R': { parent: 'spine', at: [-WING_AT[0], WING_AT[1], WING_AT[2]], tail: [-0.3, 0.55, -0.2] },
    tail2: { parent: 'tail', at: T[1]! },
    tail3: { parent: 'tail2', at: T[2]! },
    tail4: { parent: 'tail3', at: T[3]!, tail: T[4]! },
  },
  extra(k, w) {
    const mane = k.tint('mane');
    // The mane: a shaggy ruff behind the face around the head, and down the neck to the chest.
    const lobes = (x: number, y: number, z: number) => noise.fbm(x * 14, y * 14, z * 14, 2) + 0.6 * Math.sin(Math.atan2(y - 0.47, x) * 11);
    // A thick mass over the top, the sides, and the back of the head, with a hole for the face.
    const ruff = sdf
      .ellipsoid([0.26, 0.25, 0.23])
      .at(0, 0.52, 0.1)
      .displace(0.018, lobes)
      .smoothSubtract(0.03, sdf.ellipsoid([0.175, 0.15, 0.3]).at(0, 0.48, 0.32))
      .bone('head');
    const neckMane = sdf.ellipsoid([0.17, 0.2, 0.16]).at(0, 0.36, 0.06).displace(0.014, lobes).bone('neck');
    k.body('mane', sdf.smoothUnion(0.04, ruff, neckMane), { color: mane, roughness: 0.85, detail: 0.006 });
    // Small bat wings on the shoulders: a scalloped membrane with three finger bones, raised and
    // swept back, built flat in a local frame (X out along the wing, Y up).
    const membrane = sdf.extrude(
      profile.polygon(
        [
          [0, 0.02],
          [0.08, 0.07],
          [0.17, 0.11],
          [0.22, 0.08],
          [0.19, 0.03],
          [0.16, -0.01],
          [0.12, 0.02],
          [0.09, -0.04],
          [0.05, -0.01],
          [0, -0.03],
        ],
        { smooth: false },
      ),
      0.012,
      0.004,
    );
    const fingers = sdf.union(
      sdf.capsule([0, 0.02, 0], [0.17, 0.11, 0], 0.009),
      sdf.capsule([0.08, 0.07, 0], [0.16, -0.01, 0], 0.006),
      sdf.capsule([0.06, 0.06, 0], [0.09, -0.04, 0], 0.006),
    );
    const wingPose = (s: sdf.Shape) => s.scale(1.35).rotateZ(38).rotateY(-30).at(...WING_AT);
    const wing = wingPose(sdf.smoothUnion(0.006, membrane, fingers.paint(w.tone('mane', '#5a1424')))).bone('wing.L');
    k.body('wings', wing.mirror('x'), { color: w.tone('mane', '#7a2030'), roughness: 0.6, detail: 0.004 });
    // The scorpion tail: beads that shrink along the curl, and a round stinger with a short hook.
    const beads = sdf.smoothUnion(
      0.012,
      ...T.slice(0, -1).flatMap((a, i) => {
        const b = T[i + 1]!;
        const r0 = 0.05 - i * 0.008;
        const bone = i === 0 ? 'tail' : `tail${i + 1}`;
        return [0.25, 0.75].map((u) => sdf.sphere(r0 - u * 0.006).at(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u).bone(bone));
      }),
    );
    const tip = T[4]!;
    const stinger = sdf
      .smoothUnion(0.01, sdf.sphere(0.04).at(...tip), sdf.cone([tip[0], tip[1] + 0.01, tip[2] + 0.025], [tip[0], tip[1] - 0.03, tip[2] + 0.075], 0.016, 0.003))
      .bone('tail4');
    k.body('scorpion-tail', beads, { color: w.tint.fur, roughness: 0.55 });
    k.body('stinger', stinger, { color: w.tone('mane', '#5a1a2a'), roughness: 0.4 });
  },
  pose(clip, p) {
    const { wave, keys } = motion;
    // The wings flap (fast in the run and the attack), the tail sways, and it stings in the attack.
    const fast = clip === 'run' || clip === 'attack' ? 3 : clip === 'walk' ? 2 : 1;
    const flap = (clip === 'death' ? 0 : 14) * wave(p, fast);
    let sting = 0;
    if (clip === 'attack') sting = keys(p, [[0, 0], [0.3, -1], [0.45, 1.3], [0.6, 1], [1, 0]]);
    const droop = clip === 'death' ? keys(p, [[0.3, 0], [0.7, 1]]) : 0;
    const sway = (k: number) => [16 * sting * k + 30 * droop * k, 8 * k * wave(p, 1, 0.2 * k), 0] as [number, number, number];
    return {
      'wing.L': { rotate: [0, 0, flap - 20 * droop] },
      'wing.R': { rotate: [0, 0, -flap + 20 * droop] },
      tail2: { rotate: sway(1) },
      tail3: { rotate: sway(1.2) },
      tail4: { rotate: sway(1.4) },
    };
  },
});
