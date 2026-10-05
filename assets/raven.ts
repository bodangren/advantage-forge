import { noise, profile, sdf } from '../src/index.js';
import { birdAsset } from './parts/bird-kind.js';
import { crownTuft, domeEyes } from './parts/bird-extras.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Raven — Chibi Quest wildlife (catalog `wildlife/birds/raven`), a big round black bird about 0.45 m
 * tall, faces +Z. Target: docs/wildlife-mockups/raven_001.jpg (made with mmx).
 *
 * The bird of `assets/parts/bird-kind.ts` (egg body, head, beak, legs, wings, rig, and clips) at 0.5
 * of its size, as a raven: squat and bigger than the crow (`assets/crow.ts`), with a heavy dark beak
 * that points down, round white eyes with black pupils under heavy brows, purple feather tufts at
 * the cheeks, ruffled locks on the head, long pointed throat feathers, feather relief, purple-black wings, and short dark grey legs.
 * Role: a wise or ominous bird of towers, ruins, and witches; the heavy beak and the shaggy throat
 *   make it different from the crow at 128 px.
 * Palette (60/30/10): black #26262e body and head; purple-black wings #2c2638 with a violet sheen;
 *   dark grey beak and feet; dark eyes with white glints.
 */
export default scaleAsset(
  birdAsset({
    name: 'raven',
    description: 'Chibi raven: a big squat black raven with a heavy dark beak that points down, two round white eyes with black pupils under heavy brows, purple cheek tufts, ruffled feather locks on the head, long pointed feathers that hang from the throat, feather relief, purple-black wings, a fan tail, and short dark grey legs; bird rig with wings.',
    reference: 'docs/wildlife-mockups/raven_001.jpg',
    variants: {
      body: { black: '#26262e', grey: '#4a4a52', brown: '#3a2e28' },
      head: { black: '#28282f', grey: '#505058', brown: '#3e322a' },
      wings: { black: '#24242c', violet: '#2c2638', blue: '#242a3a', green: '#22302a' },
      eyes: { dark: '#1e1612', brown: '#6a4426', amber: '#a86a1a', grey: '#6a6e78' },
    },
    presets: {
      ash: { body: 'grey', head: 'grey', wings: 'blue', eyes: 'amber' },
      bronze: { body: 'brown', head: 'brown', wings: 'green', eyes: 'grey' },
    },
    colors: { belly: '#2e2e38', flight: '#26262e', scale: '#3e3e46', scaleDark: '#2e2e36', talon: '#18181c', eyeRim: '#4e4e5a', mouth: '#2a2c32', pupil: '#0c0c10' },
    body: [0.24, 0.19, 0.21],
    head: 0.17,
    beak: 'short',
    beakScale: 1.0,
    beakWidth: 1.15,
    beakDroop: 40,
    beakColors: ['#24262c', '#24262c'],
    mouth: false,
    brows: false,
    eyeStyle: 'white',
    eyeScale: 1.18,
    eyeSpread: 0.95,
    irisScale: 0.7,
    eyeLift: 0.2,
    lids: 0.22,
    featherBump: 0.008,
    featherCell: 1.5,
    featherOn: { head: false },
    walkBob: 0.5,
    wingRest: -128,
    wingTurn: 55,
    wingOut: 0.06,
    wingScale: 0.72,
    legLength: 0.25,
    wingStyle: 'paddle',
    neckScale: 1.35,
    extra(k, b) {
      // The shaggy throat: four rows of broad pointed feathers that hang down over the chest from
      // under the beak, of different lengths, each turned a little, and one longer in the middle.
      const { HEAD_C, HR } = b.joints;
      const leaf = sdf.extrude(profile.polygon([[-0.03, 0.02], [0, 0.03], [0.03, 0.02], [0.022, -0.02], [0, -0.06], [-0.022, -0.02]], { smooth: true }), 0.014, 0.005);
      const throat: sdf.Shape[] = [];
      [0, 1, 2, 3].forEach((row) => {
        const y = HEAD_C[1] - HR * (0.82 + row * 0.26);
        const n = 9 - row;
        for (let i = 0; i < n; i++) {
          const deg = -80 + (160 * (i + 0.5 * (row % 2))) / (n - 1 + (row % 2));
          const a = (deg * Math.PI) / 180;
          const hit = sdf.raycast(b.trunk, [Math.sin(a) * 2, y, HEAD_C[2] + Math.cos(a) * 2], [-Math.sin(a), 0, -Math.cos(a)]);
          if (!hit) continue;
          const len = 0.85 + 0.45 * noise.random(row, i, 3) + (Math.abs(deg) < 15 ? 0.3 : 0);
          throat.push(
            leaf
              .scale([1, len, 1])
              .rotateZ((noise.random(row, i, 5) - 0.5) * 24)
              .rotateX(-9)
              .rotateY(deg)
              .at(hit[0] + Math.sin(a) * 0.001, hit[1] - 0.012, hit[2] + Math.cos(a) * 0.001),
          );
        }
      });
      k.body('hackles', sdf.smoothUnion(0.004, ...throat).bone('neck'), { color: b.tint.head, roughness: 0.8, detail: 0.003 });
      // Ruffled feather locks on the crown and the back and sides of the head: each a fat lock from
      // just under the surface, back and down along the head, its tip lifting off (a shaggy outline).
      const locks: sdf.Shape[] = [];
      for (const [elev, from, to, n] of [[8, -120, 120, 7], [38, -105, 105, 7], [66, -70, 70, 5], [88, 0, 0, 1], [64, 145, 215, 3]] as const) {
        for (let i = 0; i < n; i++) {
          const az = ((n === 1 ? 0 : from + ((to - from) * i) / (n - 1)) + (noise.random(elev, i, 9) - 0.5) * 12) * (Math.PI / 180);
          const e = (elev * Math.PI) / 180;
          const d: [number, number, number] = [Math.sin(az) * Math.cos(e), Math.sin(e), -Math.cos(az) * Math.cos(e)];
          const fd = -0.35 * d[1] - d[2];
          let f: [number, number, number] = [-fd * d[0], -0.35 - fd * d[1], -1 - fd * d[2]];
          const fl = Math.hypot(...f) || 1;
          f = [f[0] / fl, f[1] / fl, f[2] / fl];
          const base: [number, number, number] = [HEAD_C[0] + d[0] * HR * 0.88, HEAD_C[1] + d[1] * HR * 0.88, HEAD_C[2] + d[2] * HR * 0.88];
          const L = HR * (0.42 + 0.18 * noise.random(elev, i, 4));
          const lift = HR * (0.16 + 0.1 * noise.random(elev, i, 6));
          locks.push(sdf.cone(base, [base[0] + f[0] * L + d[0] * lift, base[1] + f[1] * L + d[1] * lift, base[2] + f[2] * L + d[2] * lift], 0.03, 0.008));
        }
      }
      k.body('head-locks', sdf.smoothUnion(0.008, ...locks).bone('head'), { color: b.tint.head, roughness: 0.85, detail: 0.003 });
      // Heavy frowning brows over the eyes.
      domeEyes(k, b, { iris: b.tint.eye, low: b.tint.eye, ball: false, r: 1.0, brow: 0.3 });
      // A shaggy crest, and purple feather tufts that curl out and back at the sides of the head.
      k.body('crest', crownTuft(b, 0.07, 0.018), { color: b.tint.head, roughness: 0.85, detail: 0.003 });
      const tuft = sdf.union(
        ...[0, 1].map((i) =>
          sdf.chain(
            [
              [HR * 0.86, HEAD_C[1] - HR * 0.42 + i * 0.03, HEAD_C[2] + HR * 0.15, 0.026],
              [HR * 1.14, HEAD_C[1] - HR * 0.36 + i * 0.034, HEAD_C[2] + HR * 0.02, 0.02],
              [HR * 1.34, HEAD_C[1] - HR * 0.22 + i * 0.04, HEAD_C[2] - HR * 0.12, 0.005],
            ],
            0.01,
          ),
        ),
      );
      k.body('cheek-tufts', tuft.mirror('x').bone('head'), { color: b.tone('wings', '#7a52b8', 0.5), roughness: 0.6, detail: 0.003 });
    },
  }),
  0.5,
);
