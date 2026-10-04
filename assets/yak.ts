import { noise, sdf } from '../src/index.js';
import { horseAsset } from './parts/horse-kind.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Yak — Chibi Quest wildlife (catalog `wildlife/land/yak`), about 1.1 m to the horn tips, faces
 * +Z. Target: docs/wildlife-mockups/yak_001.jpg (made with mmx).
 *
 * The horse of `assets/horse.ts` (body, head, rig, and clips from `assets/parts/horse-kind.ts`) at
 * 0.95 of its size, as a shaggy mountain yak: a long dark coat that hangs in strands from the back
 * and the neck down past the knees, a shaggy fringe on the crown and the cheeks round a tan face,
 * cream horns that curve out and up, ears held out to the sides, a bushy tail, and black hooves;
 * no halter, blaze, socks, or horse mane.
 * Role: a mountain pack and herd animal; the hanging coat and the horns read at 128 px.
 * Palette (60/30/10): dark brown hair #4a3020; a tan face and legs #c89a70 with a cream muzzle;
 *   cream horns #ece2c8; black eyes and hooves.
 */

type V3 = readonly [number, number, number];

export default scaleAsset(
  horseAsset({
    name: 'yak',
    description: 'Chibi yak: a tan face with big glossy eyes peeking out from a shaggy fringe, cream horns curving out and up, a long dark brown coat hanging in strands to the knees, a bushy tail, and black hooves; quadruped rig.',
    reference: 'docs/wildlife-mockups/yak_001.jpg',
    variants: {
      coat: { tan: '#c89a70', grey: '#a8a098', brown: '#8a6040' },
      mane: { brown: '#4a3020', black: '#262020', cream: '#e6dcc8', red: '#7a4426' },
      eyes: { brown: '#2a1a12', dark: '#120c0a' },
    },
    presets: {
      black: { coat: 'grey', mane: 'black', eyes: 'dark' },
      white: { coat: 'tan', mane: 'cream', eyes: 'brown' },
      red: { coat: 'brown', mane: 'red', eyes: 'brown' },
    },
    colors: { muzzle: '#ecd2ac', coatDark: '#e0a890', brow: '#3a2418', hoof: '#1e1a18', nostril: '#4a2a20' },
    muzzleFollow: 0.3,
    halter: false,
    blaze: false,
    socks: false,
    mane: false,
    earSpread: 82,
    earWidth: 1.3,
    ears: 0.9,
    earAt: [0.16, 0.95, 0.23],
    extra(k, horse) {
      const shag = (s: sdf.Shape) => s.displace(0.005, (x, y, z) => noise.fbm(x * 40, y * 12, z * 40, 2));
      // The coat: the trunk grown thick, and strands that hang from it in rows down the sides.
      const trunk = horse.trunk;
      const strands: sdf.Shape[] = [];
      for (let i = 0; i < 7; i++) {
        const z = 0.24 - i * 0.11;
        for (const [a, len] of [[30, 0.33], [60, 0.4], [85, 0.42]] as const) {
          const d: V3 = [Math.sin((a * Math.PI) / 180), Math.cos((a * Math.PI) / 180), 0];
          const hit = sdf.raycast(trunk, [d[0] * 1, 0.5 + d[1] * 1, z], [-d[0], -d[1], 0]);
          if (!hit) continue;
          const top: V3 = [hit[0] + d[0] * 0.02, hit[1] + d[1] * 0.02, hit[2]];
          const bot: V3 = [top[0] + 0.03 + 0.02 * Math.sin(i * 1.7), Math.max(0.2, top[1] - len), top[2] - 0.02];
          strands.push(sdf.cone(top, bot, 0.05, 0.016).bone(z > -0.12 ? 'spine' : 'hips'));
        }
      }
      // A skirt of strands round the front of the chest.
      for (const x of [-0.12, -0.06, 0, 0.06, 0.12]) strands.push(sdf.cone([x, 0.56, 0.26], [x * 1.2, 0.26, 0.3], 0.05, 0.016).bone('spine'));
      const body = sdf.smoothUnion(0.03, trunk.round(0.035), ...strands.map((s) => s.mirror('x')));
      const neck = sdf.capsule([0, 0.62, 0.07], [0, 0.88, 0.18], 0.15).bone('neck');
      k.body('coat-hair', shag(sdf.smoothUnion(0.04, body, neck)), { color: horse.tint.mane, roughness: 0.9, detail: 0.006, textureDensity: 1.2 });
      // The fringe: strands from the crown over the forehead to the brows, and down the cheeks.
      const fringe: sdf.Shape[] = [];
      // Front locks end on the forehead surface, above the eyes.
      for (const x of [-0.12, -0.06, 0, 0.06, 0.12]) {
        const end = horse.faceHit(x * 1.3, 0.97 - Math.abs(x) * 0.3);
        fringe.push(sdf.cone([x * 0.8, 1.1, 0.24], [end[0], end[1], end[2] + 0.012], 0.055, 0.016));
      }
      for (const s of [1, -1]) fringe.push(sdf.cone([0.16 * s, 1.0, 0.22], [0.23 * s, 0.74, 0.3], 0.055, 0.018), sdf.cone([0.13 * s, 1.06, 0.2], [0.21 * s, 0.82, 0.36], 0.05, 0.016));
      // The mop: messy locks from the crown, up, out, and back.
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * 2 * Math.PI + 0.3;
        const r = 0.09;
        const base: V3 = [r * 0.6 * Math.cos(a), 1.12, 0.2 + r * 0.5 * Math.sin(a)];
        fringe.push(sdf.cone(base, [r * 1.6 * Math.cos(a), 1.2 + 0.03 * Math.sin(i * 2.3), 0.2 + r * 1.3 * Math.sin(a) - 0.03], 0.045, 0.012));
      }
      k.body('fringe', shag(sdf.smoothUnion(0.02, sdf.ellipsoid([0.18, 0.1, 0.16]).at(0, 1.08, 0.22), ...fringe)), { color: horse.tint.mane, roughness: 0.9, detail: 0.004, bone: 'head' });
      // Horns: out and up from above the ears.
      const horn = sdf.chain([[0.1, 1.03, 0.22, 0.05], [0.21, 1.05, 0.21, 0.043], [0.29, 1.11, 0.2, 0.034], [0.31, 1.2, 0.19, 0.024], [0.29, 1.27, 0.19, 0.012]], 0.012);
      k.body('horns', horn.mirror('x'), { color: '#ece2c8', roughness: 0.45, detail: 0.003, bone: 'head' });
    },
  }),
  0.95,
);
