import { noise, profile, sdf } from '../src/index.js';
import { deerAsset } from './parts/deer-kind.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Pack goat — Chibi Quest wildlife (catalog `wildlife/mounts-and-pets/pack-goat`), about 0.9 m to
 * the top of the horns, faces +Z. Target: docs/wildlife-mockups/pack-goat_001.jpg (made with mmx).
 *
 * The deer of `assets/deer.ts` (body, head, rig, and clips from `assets/parts/deer-kind.ts`) at
 * 0.95 of its size, as a mountain pack goat: big ridged horns that curl back, down, and forward
 * beside the head, a long grey beard, drooping ears, a grey-brown coat, and a red pad with a canvas
 * saddle bag on each side; no fawn spots, bib, eye patches, or antlers.
 * Role: the traveller's pack animal on mountain paths; the curled horns and the bags read at
 *   128 px.
 * Palette (60/30/10): grey coat #807b75; tan horns #b8946a; canvas bags #d8b878; a red pad #b0403a
 *   as the accent; black hooves.
 */

export default scaleAsset(
  deerAsset({
    name: 'pack-goat',
    description: 'Chibi pack goat: a big round head with glossy eyes, big curled ridged horns, a long shaggy grey beard and shaggy hair on the neck, the chest, and the belly, drooping ears, a smile, a stocky grey-brown body on short thick legs, and a red pad with four large canvas saddlebags on brown straps; quadruped rig.',
    reference: 'docs/wildlife-mockups/pack-goat_001.jpg',
    variants: {
      fur: { grey: '#807b75', brown: '#8a6a4c', white: '#e8e0d0', black: '#3e3834' },
      eyes: { brown: '#5a3418', amber: '#a87a2a' },
      pad: { red: '#b0403a', blue: '#4a6aa0', green: '#5a8a4a' },
    },
    presets: {
      brown: { fur: 'brown', eyes: 'amber', pad: 'green' },
      white: { fur: 'white', eyes: 'brown', pad: 'blue' },
      black: { fur: 'black', eyes: 'amber', pad: 'red' },
    },
    colors: { cream: '#b0aaa0', earInner: '#6a6460', nose: '#2a2624', mouth: '#4a3a34', hoof: '#221c1a' },
    mask: false,
    bib: false,
    spots: false,
    antlers: false,
    slim: 1.25,
    legThick: 1.25,
    legLength: -0.04,
    smile: false,
    earTilt: -122,
    earTurn: 28,
    bulk: 0.05,
    headProbes: [[0.19, 0.78, 0.04], [-0.19, 0.78, 0.04], [0.16, 0.97, 0.0], [-0.16, 0.97, 0.0], [0, 0.44, 0.29]],
    paint(fur) {
      // A smile on the muzzle above the beard.
      return fur.paintWhere(sdf.extrude(profile.arc(0.042, 0.008, 218, 322), 0.3).at(0, 0.64, 0.3), '#3a2e28', 0.002);
    },
    extra(k, deer) {
      // Horns: thick ridged spirals, back, down, and forward beside the head.
      const BASE = [0.05, 0.83, 0.13] as const;
      const horn = sdf
        .chain(
          [[0.05, 0.83, 0.13, 0.042], [0.09, 0.93, 0.1, 0.04], [0.14, 0.97, 0.02, 0.036], [0.175, 0.89, -0.03, 0.031], [0.19, 0.79, 0.01, 0.025], [0.18, 0.75, 0.08, 0.016]],
          0.015,
        )
        .paintFn((x, y, z, c) => {
          const d = Math.hypot(x - BASE[0], y - BASE[1], z - BASE[2]);
          const ring = Math.floor(d / 0.024) % 2 === 1 ? 0.8 : 1;
          return [c[0] * ring, c[1] * ring, c[2] * ring];
        });
      k.body('horns', horn.mirror('x'), { color: '#b8946a', roughness: 0.5, detail: 0.003, bone: 'head' });
      const hair = (s: sdf.Shape) => s.displace(0.004, (x, y, z) => noise.fbm(x * 70, y * 30, z * 70, 2));
      const shagColor = deer.tone('fur', '#66625c', 0.8);
      // A long shaggy grey beard: three locks that hang from the chin to ragged points.
      const beard = hair(
        sdf.smoothUnion(
          0.012,
          ...[-0.018, 0, 0.018].map((x, i) => sdf.chain([[x * 0.5, 0.585, 0.272, 0.03], [x, 0.52, 0.285, 0.026], [x * 1.2, 0.44 - (i === 1 ? 0.03 : 0), 0.29, 0.008]], 0.012)),
        ),
      );
      k.body('beard', beard, { color: shagColor, roughness: 0.9, detail: 0.003, bone: 'jaw' });
      // Long shaggy hair: a fringe of pointed locks that hang under the neck, the chest, and the
      // belly, and a short mane along the top of the neck.
      const locks: sdf.Shape[] = [];
      for (let i = 0; i < 9; i++) {
        const z = 0.1 - i * 0.04;
        for (const x of [-0.075, 0.075]) {
          const top = sdf.raycast(deer.trunk, [x, 0, z], [0, 1, 0]);
          if (!top) continue;
          const len = 0.05 + 0.02 * noise.random(i, x > 0 ? 1 : 2, 3);
          locks.push(sdf.cone([top[0], top[1] + 0.025, top[2]], [top[0] * 1.15, top[1] - len, top[2] - 0.01], 0.03, 0.006).bone(z > -0.06 ? 'spine' : 'hips'));
        }
      }
      for (let i = 0; i < 5; i++) {
        const t = i / 4;
        const p: [number, number, number] = [0, 0.43 + t * 0.12, 0.18 + t * 0.02];
        locks.push(sdf.cone([p[0], p[1] + 0.02, p[2] - 0.02], [p[0], p[1] - 0.06, p[2] + 0.025], 0.032, 0.007).bone('neck'));
      }
      for (let i = 0; i < 5; i++) {
        const t = i / 4;
        const p: [number, number, number] = [0, 0.66 - t * 0.17, 0.08 - t * 0.09];
        locks.push(sdf.cone([p[0], p[1] - 0.02, p[2]], [p[0], p[1] + 0.03, p[2] - 0.05], 0.026, 0.006).bone('neck'));
      }
      k.body('shag', hair(sdf.smoothUnion(0.01, ...locks)), { color: shagColor, roughness: 0.9, detail: 0.004 });
      // The pack: a pad over the back and a canvas bag with a flap and a buckle on each side.
      const trunk = deer.trunk;
      const pad = trunk.round(0.01).smoothIntersect(0.008, sdf.box([0.4, 0.15, 0.2], 0.03).at(0, 0.47, -0.07));
      k.body('pad', pad, { color: k.tint('pad'), roughness: 0.85, detail: 0.004 });
      // Two large canvas saddlebags on each side, each with a flap and a buckle.
      const bags: sdf.Shape[] = [];
      const buckles: sdf.Shape[] = [];
      for (const z of [0.01, -0.15]) {
        const side = sdf.raycast(trunk, [1, 0.4, z], [-1, 0, 0])!;
        const bx = side[0] + 0.05;
        bags.push(sdf.box([0.085, 0.16, 0.13], 0.03).at(bx, 0.37, z).paintWhere(sdf.box([0.4, 0.06, 0.4]).at(bx, 0.425, z), '#b8985a', 0.004).bone(z > -0.06 ? 'spine' : 'hips'));
        buckles.push(sdf.box([0.012, 0.024, 0.022], 0.004).at(bx + 0.044, 0.39, z).bone(z > -0.06 ? 'spine' : 'hips'));
      }
      k.body('bags', sdf.union(...bags).mirror('x'), { color: '#d8b878', roughness: 0.85, detail: 0.004 });
      k.body('buckles', sdf.union(...buckles).mirror('x'), { color: '#c8a040', roughness: 0.35, metalness: 0.8, detail: 0.003 });
      // Brown straps round the chest and the belly that hold the pack.
      const band = (z: number, bone: string) => trunk.round(0.012).intersect(sdf.box([0.6, 0.6, 0.026]).at(0, 0.4, z)).bone(bone);
      k.body('straps', sdf.union(band(0.09, 'spine'), band(-0.07, 'spine')), { color: '#6a4026', roughness: 0.7, detail: 0.003 });
    },
  }),
  0.95,
);
