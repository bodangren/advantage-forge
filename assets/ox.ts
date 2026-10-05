import { sdf } from '../src/index.js';
import { horseAsset } from './parts/horse-kind.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Ox — Chibi Quest wildlife (catalog `wildlife/land/ox`), about 1.25 m to the horn tips and 1.15
 * m from muzzle to tail, faces +Z. Target: docs/wildlife-mockups/ox_001.jpg (made with mmx).
 *
 * The horse of `assets/horse.ts` (body, head, rig, and clips from `assets/parts/horse-kind.ts`) at
 * 1.05 of its size, as a stocky draught ox: a big head (1.3) on a short body with short legs,
 * thick cream horns that curve out and up like a crescent, ears held out to the sides, a very
 * wide tan muzzle with nostrils only (no smile line), heavy brows, a brown coat with a pale belly
 * and chest patch, a twisted rope round the chest with a brass bell at the front, a thin tail
 * with a dark tuft, and black hooves; no mane, halter, blaze, or socks.
 * Role: the farm's strong worker that pulls carts and ploughs; the wide horns read at 128 px.
 * Palette (60/30/10): brown coat #8a5a3a; a tan-pink muzzle #c8907c and a pale belly #e8d0b0; cream
 *   horns #e8dcc0 with dark tips; a brass bell as the accent.
 */

export default scaleAsset(
  horseAsset({
    name: 'ox',
    description: 'Chibi ox: a stocky ox with a big round head, glossy eyes, thick crescent horns, ears held out to the sides, a wide tan muzzle, a brown coat with a pale belly, a rope round the chest with a brass bell, short legs, and a thin tufted tail; quadruped rig.',
    reference: 'docs/wildlife-mockups/ox_001.jpg',
    variants: {
      coat: { brown: '#8a5a3a', red: '#a0502e', black: '#3a302c', grey: '#a8a49c' },
      mane: { dark: '#3a2a20', black: '#1e1a18', cream: '#e8dcc0' },
      eyes: { brown: '#2a1a12', dark: '#120c0a', hazel: '#6b4a22' },
    },
    presets: {
      red: { coat: 'red', mane: 'dark', eyes: 'brown' },
      black: { coat: 'black', mane: 'black', eyes: 'hazel' },
      grey: { coat: 'grey', mane: 'cream', eyes: 'dark' },
    },
    colors: { muzzle: '#cc9270', coatDark: '#c89080', brow: '#4a2a1a', hoof: '#1e1a18', nostril: '#5a3028' },
    muzzleFollow: 0.4,
    halter: false,
    blaze: false,
    socks: false,
    mane: false,
    tail: 'tuft',
    earSpread: 88,
    earWidth: 1.5,
    ears: 1.0,
    earAt: [0.16, 0.95, 0.23],
    muzzleScale: 1.3,
    smile: false,
    headScale: 1.3,
    legLength: -0.09,
    bodyLength: -0.07,
    paint(coat, horse) {
      const pale = horse.tone('coat', '#e8d0b0', 0.3);
      return coat
        .paintWhere(sdf.ellipsoid([0.15, 0.09, 0.3]).at(0, 0.33, -0.1), pale, 0.03)
        .paintWhere(sdf.ellipsoid([0.13, 0.11, 0.08]).at(0, 0.4, 0.27), pale, 0.02);
    },
    extra(k, horse) {
      // Horns: thick at the root, out to the sides, then up and a little in (a crescent).
      const horn = sdf.chain(
        [
          [0.07, 1.04, 0.23, 0.05],
          [0.16, 1.06, 0.22, 0.047],
          [0.24, 1.1, 0.21, 0.04],
          [0.29, 1.17, 0.2, 0.032],
          [0.3, 1.25, 0.19, 0.022],
          [0.28, 1.31, 0.185, 0.009],
        ],
        0.014,
      );
      k.body('horns', horn.mirror('x'), { color: '#e8dcc0', roughness: 0.45, detail: 0.003, bone: 'head' });
      // Heavy brows: a soft ridge over the eyes.
      const eh = horse.faceHit(0.1, 0.87);
      const brow = sdf.capsule([0.03, eh[1] + 0.07, eh[2] - 0.03], [0.15, eh[1] + 0.06, eh[2] - 0.07], 0.026);
      k.body('brows', brow.mirror('x'), { color: horse.tint.coat, roughness: 0.7, detail: 0.003, bone: 'head' });
      // A twisted rope round the chest and the withers: a closed loop just outside the body, low at the front, with
      // a brass bell that hangs from it at the front.
      const body = horse.trunk.round(0.03);
      const loop = Array.from({ length: 25 }, (_, i) => {
        // A ray from inside the chest in a plane tilted 38 degrees (low at the front, high on the withers).
        const a = (i / 24) * 2 * Math.PI;
        const t = (38 * Math.PI) / 180;
        const d: [number, number, number] = [Math.sin(a), -Math.cos(a) * Math.sin(t), Math.cos(a) * Math.cos(t)];
        const hit = sdf.raycast(body, [d[0] * 2, 0.6 + d[1] * 2, 0.1 + d[2] * 2], [-d[0], -d[1], -d[2]])!;
        return [hit[0], hit[1], hit[2], 0.022] as [number, number, number, number];
      });
      const rope = sdf.chain(loop, 0.01).displace(0.005, (x, y, z) => Math.sin(Math.atan2(x, z - 0.1) * 30 + y * 60));
      k.body('rope', rope, { color: '#b88a58', roughness: 0.85, detail: 0.003 });
      const front = loop[0]!;
      const bell = sdf.smoothUnion(
        0.008,
        sdf.capsule([0, front[1] + 0.02, front[2] + 0.01], [0, front[1] - 0.02, front[2] + 0.03], 0.012),
        sdf.cone([0, front[1] - 0.025, front[2] + 0.035], [0, front[1] - 0.1, front[2] + 0.045], 0.024, 0.045),
        sdf.sphere(0.013).at(0, front[1] - 0.11, front[2] + 0.045),
      );
      k.body('bell', bell, { color: '#d0a040', roughness: 0.3, metalness: 0.8, detail: 0.003, bone: 'spine' });
    },
  }),
  1.05,
);
