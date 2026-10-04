import { noise, profile, rgb, sdf } from '../src/index.js';
import { deerAsset } from './parts/deer-kind.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Camel — Chibi Quest wildlife (catalog `wildlife/land/camel`), about 1.2 m to the top of the
 * head, faces +Z. Target: docs/wildlife-mockups/camel_001.jpg (made with mmx).
 *
 * The deer of `assets/deer.ts` (body, head, rig, and clips from `assets/parts/deer-kind.ts`) at
 * 1.35 of its size: its long neck and thin legs make a camel. A sandy coat, one big hump under a
 * striped woven blanket with a fringe, a long droopy snout with slit nostrils, long lashes, small
 * round ears, a tuft on the crown, knobby knees, wide pale feet, and a dark-tipped tail; no fawn
 * spots, bib, eye patches, or antlers.
 * Role: the desert traveller's mount and pack animal; the hump and the bright blanket read at
 *   128 px.
 * Palette (60/30/10): sandy coat #d8b07a; a pale snout #e8caa0; a woven blanket in red #c8443a,
 *   gold #e8b040, green #4a9a5a, and blue #3a6ab0 as the accent.
 */

export default scaleAsset(
  deerAsset({
    name: 'camel',
    description: 'Chibi camel: a big round head with glossy lashed eyes, a long droopy snout, small round ears, one big hump under a striped woven blanket, a sandy coat, knobby knees, and wide pale feet; quadruped rig.',
    reference: 'docs/wildlife-mockups/camel_001.jpg',
    variants: {
      fur: { sand: '#d8b07a', brown: '#a87a4e', cream: '#ecdcc0' },
      eyes: { dark: '#2a1a12', brown: '#5a3418' },
      blanket: { red: '#c8443a', blue: '#3a6ab0', green: '#4a9a5a', purple: '#7a4aa0' },
    },
    presets: {
      brown: { fur: 'brown', eyes: 'brown', blanket: 'blue' },
      cream: { fur: 'cream', eyes: 'dark', blanket: 'green' },
    },
    colors: { earInner: '#c89a70', hoof: '#b08a64', cream: '#e8caa0' },
    mask: false,
    bib: false,
    spots: false,
    antlers: false,
    nose: false,
    earScale: 0.55,
    earTilt: -60,
    bulk: 0.04,
    headProbes: [[0, 0.56, 0.38], [0, 0.9, 0.16]],
    paint(fur, deer) {
      // A dark tip on the tail instead of the white flag.
      return fur.paintWhere(sdf.sphere(0.08).at(0, 0.51, -0.325), deer.tone('fur', '#7a5a3a', 0.6), 0.01);
    },
    extra(k, deer) {
      const pale = deer.tone('fur', '#e8caa0', 0.5);
      // The snout: long and droopy, with slit nostrils and a split lip.
      const snout = sdf.smoothUnion(0.02, sdf.ellipsoid([0.085, 0.072, 0.09]).at(0, 0.6, 0.3), sdf.ellipsoid([0.075, 0.064, 0.06]).at(0, 0.585, 0.375));
      const nh = sdf.raycast(snout, [0.036, 0.61, 2], [0, 0, -1])!;
      const slits = sdf.capsule([nh[0] - 0.008, nh[1] + 0.008, nh[2]], [nh[0] + 0.01, nh[1] - 0.006, nh[2]], 0.005).mirror('x');
      const lip = sdf.box([0.004, 0.03, 0.2]).at(0, 0.55, 0.4);
      const mouth = sdf.extrude(profile.arc(0.05, 0.006, 240, 300), 0.3).at(0, 0.59, 0.42);
      k.body('snout', snout.paintWhere(slits, '#4a3020', 0.002).paintWhere(lip, '#8a6040', 0.002).paintWhere(mouth, '#6a4a30', 0.002), {
        color: pale,
        roughness: 0.75,
        detail: 0.003,
        textureDensity: 1.6,
        bone: 'head',
      });
      // Long lashes over each eye, and a tuft on the crown.
      const eL = deer.faceHit(0.086, 0.7);
      const lashes = sdf.union(...[-1, 0, 1].map((i) => sdf.cone([eL[0] + 0.03 + 0.012 * i, eL[1] + 0.045 - 0.004 * Math.abs(i), eL[2] - 0.005], [eL[0] + 0.05 + 0.02 * i, eL[1] + 0.065, eL[2] + 0.02], 0.006, 0.002))).mirror('x');
      const hair = (s: sdf.Shape) => s.displace(0.003, (x, y, z) => noise.fbm(x * 70, y * 30, z * 70, 2));
      const tuft = hair(sdf.union(...[-1, 0, 1].map((i) => sdf.cone([0.02 * i, 0.86, 0.15], [0.035 * i, 0.92, 0.19], 0.022, 0.007))));
      k.body('lashes', sdf.union(lashes, tuft), { color: deer.tone('fur', '#5a3a24', 0.5), roughness: 0.8, detail: 0.003, bone: 'head' });
      // The hump over the middle of the back, and a woven blanket over it with a fringe.
      const hump = sdf.ellipsoid([0.095, 0.13, 0.13]).at(0, 0.53, -0.08).bone('spine');
      const back = sdf.smoothUnion(0.05, deer.trunk, hump);
      k.body('hump', hump, { color: deer.tint.fur, roughness: 0.85, detail: 0.005, bone: 'spine' });
      const cloth = k.tint('blanket');
      const stripes = ['#e8b040', '#4a9a5a', '#3a6ab0'].map((c) => rgb(c));
      const blanket = back
        .round(0.012)
        .smoothIntersect(0.01, sdf.box([0.4, 0.34, 0.22], 0.03).at(0, 0.56, -0.08))
        .paintFn((x, y, z, c) => {
          const band = Math.floor((z + 0.18) / 0.028);
          const pick = ((band % 4) + 4) % 4;
          return pick === 0 ? c : stripes[pick - 1]!;
        });
      k.body('blanket', blanket, { color: cloth, roughness: 0.85, detail: 0.004, bone: 'spine' });
      const fringe = sdf.union(
        ...[-0.06, -0.03, 0, 0.03, 0.06].flatMap((dz) => {
          const top = sdf.raycast(back.round(0.012), [1, 0.41, -0.08 + dz], [-1, 0, 0]);
          return top ? [sdf.capsule([top[0] + 0.004, 0.405, top[2]], [top[0] + 0.006, 0.375, top[2]], 0.006)] : [];
        }),
      ).mirror('x');
      k.body('tassels', fringe, { color: '#e8b040', roughness: 0.8, detail: 0.003, bone: 'spine' });
      // Knobby knees.
      const { FKNEE, BKNEE } = deer.joints;
      const knees = sdf.union(sdf.sphere(0.036).at(FKNEE[0], FKNEE[1], FKNEE[2] + 0.008).bone('fshin.L'), sdf.sphere(0.034).at(BKNEE[0], BKNEE[1], BKNEE[2] - 0.006).bone('bshin.L')).mirror('x');
      k.body('knees', knees, { color: deer.tint.fur, roughness: 0.85, detail: 0.004 });
    },
  }),
  1.35,
);
