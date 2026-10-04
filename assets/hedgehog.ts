import { noise, sdf } from '../src/index.js';
import { boarAsset } from './parts/boar-kind.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Hedgehog — Chibi Quest wildlife (catalog `wildlife/forest/hedgehog`), about 0.3 m tall and 0.38 m
 * long, faces +Z. Target: docs/wildlife-mockups/hedgehog_001.jpg (made with mmx).
 *
 * The bear of `assets/bear.ts` (body, head, rig, and clips from `assets/parts/boar-kind.ts`) at 0.45
 * of the boar's size, as a hedgehog: a cream face, body, and legs, a long pointed muzzle with a
 * black nose, big glossy dark eyes, small round ears, pink paws, and a dome of brown spines over
 * the back and the back of the head. The spines are a separate body in a `spines` slot: a shell
 * over the trunk with short blunt cones along its normals.
 * Role: a small forest and garden animal; the spine dome and the pointed nose read at 128 px.
 * Palette (60/30/10): brown spines #7a5034 with pale tips; a cream face and body #f0d8a8; pink
 *   paws and ear insides; a black nose; dark eyes with a white glint.
 */

type V3 = readonly [number, number, number];

export default scaleAsset(
  boarAsset({
    name: 'hedgehog',
    description: 'Chibi hedgehog: a small round cream hedgehog with a long pointed muzzle and a black nose, big glossy dark eyes, small round ears, pink paws, and a dome of brown spines over the back and the head; quadruped rig.',
    reference: 'docs/wildlife-mockups/hedgehog_001.jpg',
    variants: {
      fur: { cream: '#f0d8a8', pale: '#f6ece0', tan: '#d8b080' },
      spines: { brown: '#7a5034', dark: '#4a3a30', sandy: '#a8845a', grey: '#7a7470' },
      skin: { pink: '#f0a8a0', rose: '#e08888', tan: '#d8a888' },
      eyes: { dark: '#2a1a12', brown: '#5a3218' },
    },
    presets: {
      dark: { fur: 'pale', spines: 'dark', skin: 'pink', eyes: 'dark' },
      sandy: { fur: 'tan', spines: 'sandy', skin: 'tan', eyes: 'brown' },
      grey: { fur: 'pale', spines: 'grey', skin: 'rose', eyes: 'dark' },
    },
    colors: { furDark: '#e8bc9c', belly: '#f6e4c4', earInner: '#f0a8a0', nostril: '#1a1416', ivoryBase: '#e08888' },
    // Pink claws on the paws.
    ivorySlot: 'skin',
    horns: false,
    tuskScale: 0,
    mane: false,
    snout: 'bear',
    muzzleLength: 1.6,
    ears: 'round',
    feet: 'paws',
    eyeScale: 1.1,
    eyeGlow: 0,
    brows: false,
    lids: false,
    paint(fur, boar) {
      // The muzzle in the cream of the face, not in the pink of the skin slot.
      return fur.paintWhere(sdf.sphere(0.3).at(0, 0.39, 0.55).intersect(sdf.halfSpace([0, 0, -1], -0.33)), boar.tint.fur, 0.01);
    },
    extra(k, boar) {
      const spine = k.tint('spines');
      const tip = k.tint('spines', { color: '#b88a62', follow: 0.6 });
      // The spine dome: a thick shell over the back of the trunk, behind a plane that leans back
      // from the crown to the shoulders, above the belly line.
      const n = Math.hypot(0.4, 1);
      const behindFace = sdf.halfSpace([0, -0.4 / n, 1 / n], -0.08 / n);
      const above = sdf.halfSpace([0, -1, 0], -0.25);
      // The dome rounds out over the back to the height of the head, like a ball of spines.
      const ball = sdf.smoothUnion(0.06, boar.trunk.round(0.045), sdf.ellipsoid([0.25, 0.22, 0.28]).at(0, 0.42, -0.06));
      const dome = ball.smoothIntersect(0.03, behindFace.intersect(above).intersect(sdf.box([0.8, 0.8, 1.0]).at(0, 0.5, -0.05)));
      // Blunt cones along the dome normals, on a jittered grid of directions from the body center.
      const C0: V3 = [0, 0.4, -0.06];
      const cones: sdf.Shape[] = [];
      for (let i = 0; i < 9; i++)
        for (let j = 0; j < 16; j++) {
          const el = (12 + i * 10 + (noise.random(i, j, 1) - 0.5) * 6) * (Math.PI / 180);
          const az = ((j + (i % 2) * 0.5) / 16) * Math.PI * 2;
          const d: V3 = [Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az)];
          const from: V3 = [C0[0] + d[0], C0[1] + d[1], C0[2] + d[2]];
          const hit = sdf.raycast(dome, from, [-d[0], -d[1], -d[2]]);
          if (!hit) continue;
          const nn = sdf.normalAt(dome, hit);
          const len = 0.042 + 0.012 * noise.random(i, j, 2);
          // Each spine leans back a little, toward the tail.
          const dir: V3 = [nn[0], nn[1], nn[2] - 0.35];
          const dl = Math.hypot(...dir);
          const end: V3 = [hit[0] + (dir[0] / dl) * len, hit[1] + (dir[1] / dl) * len, hit[2] + (dir[2] / dl) * len];
          const bone = hit[2] > 0.16 ? 'head' : hit[2] > 0.08 ? 'neck' : hit[2] > -0.1 ? 'spine' : 'hips';
          cones.push(sdf.cone([hit[0] - nn[0] * 0.02, hit[1] - nn[1] * 0.02, hit[2] - nn[2] * 0.02], end, 0.034, 0.014).bone(bone));
        }
      // Paler tips: the ends of the cones, farther than 0.04 m out from the dome.
      const tips = sdf.box([0.9, 0.9, 1.1]).at(0, 0.45, -0.05).subtract(dome.round(0.04));
      const spines = dome.smoothUnion(0.012, sdf.union(...cones)).paintWhere(tips, tip, 0.012);
      k.body('spines', spines, { color: spine, roughness: 0.7, detail: 0.004 });
    },
  }),
  0.45,
);
