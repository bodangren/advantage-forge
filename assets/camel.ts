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
    description: 'Chibi camel: a big round head with glossy lashed eyes, a long head with a big droopy snout on a long neck that curves up from the chest, small round ears, one tall hump under a red blanket with a rolled rope trim and tassels, a sandy coat, knobby knees, and wide brown feet; quadruped rig.',
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
    colors: { earInner: '#c89a70', hoof: '#7a5638', cream: '#e8caa0' },
    mask: false,
    bib: false,
    spots: false,
    antlers: false,
    nose: false,
    headShift: [0, 0.14, 0.11],
    legThick: 1.3,
    smile: false,
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
      // A long head: the snout reaches well forward and droops, big and round at the end.
      const snout = sdf.smoothUnion(0.03, sdf.ellipsoid([0.095, 0.08, 0.11]).at(0, 0.6, 0.31), sdf.ellipsoid([0.092, 0.08, 0.075]).at(0, 0.575, 0.41));
      const nh = sdf.raycast(snout, [0.04, 0.6, 2], [0, 0, -1])!;
      const slits = sdf.capsule([nh[0] - 0.008, nh[1] + 0.008, nh[2]], [nh[0] + 0.01, nh[1] - 0.006, nh[2]], 0.005).mirror('x');
      const lip = sdf.box([0.004, 0.03, 0.2]).at(0, 0.53, 0.45);
      const mouth = sdf.extrude(profile.arc(0.06, 0.007, 238, 302), 0.3).at(0, 0.585, 0.45);
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
      const hump = sdf.ellipsoid([0.1, 0.2, 0.13]).at(0, 0.57, -0.08).bone('spine');
      const back = sdf.smoothUnion(0.05, deer.trunk, hump);
      k.body('hump', hump, { color: deer.tint.fur, roughness: 0.85, detail: 0.005, bone: 'spine' });
      // A plain red blanket over the hump, edged with a rolled rope trim in bright colors (yellow,
      // green, and blue in turn) and tassels that hang from its lower corners.
      const cloth = k.tint('blanket');
      const blanket = back.round(0.012).smoothIntersect(0.01, sdf.box([0.4, 0.3, 0.2], 0.03).at(0, 0.64, -0.08));
      k.body('blanket', blanket, { color: cloth, roughness: 0.85, detail: 0.004, bone: 'spine' });
      const trimColors = ['#e8b040', '#4a9a5a', '#3a6ab0'].map((c) => rgb(c));
      const edge = blanket.round(0.012).subtract(blanket.round(0.002)).intersect(sdf.box([0.4, 0.3, 0.2], 0.03).at(0, 0.64, -0.08).subtract(sdf.box([0.4, 0.28, 0.18], 0.025).at(0, 0.66, -0.08)));
      const trim = edge.round(0.006).paintFn((x, y, z, c) => {
        const seg = Math.floor((y * 2 + z) / 0.03);
        return trimColors[((seg % 3) + 3) % 3] ?? c;
      });
      k.body('trim', trim, { color: '#e8b040', roughness: 0.8, detail: 0.003, bone: 'spine' });
      const fringe = sdf.union(
        ...[0.01, -0.17].flatMap((zc) => {
          const top = sdf.raycast(back.round(0.012), [1, 0.5, zc], [-1, 0, 0]);
          return top ? [sdf.chain([[top[0] + 0.008, 0.5, top[2], 0.01], [top[0] + 0.012, 0.46, top[2], 0.008], [top[0] + 0.012, 0.43, top[2], 0.013]], 0.006)] : [];
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
