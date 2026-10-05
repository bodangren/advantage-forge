import { noise, profile, rgb, sdf } from '../src/index.js';
import { deerAsset } from './parts/deer-kind.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Camel — Chibi Quest wildlife (catalog `wildlife/land/camel`), about 1.2 m to the top of the
 * head, faces +Z. Target: docs/wildlife-mockups/camel_001.jpg (made with mmx).
 *
 * The deer of `assets/deer.ts` (body, head, rig, and clips from `assets/parts/deer-kind.ts`) at
 * 1.35 of its size: a long low body (`bodyLength`) and a long neck (`headShift`) make a camel. A
 * sandy coat, one low round hump in the middle of the back under a red blanket with rows of
 * twisted cords in bright colors and tassels, a long droopy snout with slit nostrils, long lashes,
 * small round ears, a tuft on the crown, knobby knees, wide brown feet, and a short tail with a dark
 * tuft; no fawn spots, bib, eye patches, or antlers.
 * Role: the desert traveller's mount and pack animal; the hump and the bright blanket read at
 *   128 px.
 * Palette (60/30/10): sandy coat #d8b07a; a pale snout #e8caa0; a woven blanket in red #c8443a,
 *   gold #e8b040, green #4a9a5a, and blue #3a6ab0 as the accent.
 */

export default scaleAsset(
  deerAsset({
    name: 'camel',
    description: 'Chibi camel: a big round head with glossy lashed eyes, a big droopy snout, a long neck that reaches up and forward from the chest, small round ears, a long low body with one low round hump under a red blanket with twisted cords in bright colors and tassels, a sandy coat, knobby knees, wide brown feet, and a short tail with a dark tuft; quadruped rig.',
    reference: 'docs/wildlife-mockups/camel_001.jpg',
    variants: {
      fur: { sand: '#e8b87c', brown: '#b07a4c', cream: '#f0dcc0' },
      eyes: { dark: '#2a1a12', brown: '#5a3418' },
      blanket: { red: '#c8443a', blue: '#3a6ab0', green: '#4a9a5a', purple: '#7a4aa0' },
    },
    presets: {
      brown: { fur: 'brown', eyes: 'brown', blanket: 'blue' },
      cream: { fur: 'cream', eyes: 'dark', blanket: 'green' },
    },
    colors: { earInner: '#d8a07a', hoof: '#9a6656', cream: '#f2d2a6' },
    furBump: 0,
    mask: false,
    bib: false,
    spots: false,
    antlers: false,
    nose: false,
    headShift: [0, 0.21, 0.15],
    bodyZone: sdf.ellipsoid([0.1, 0.13, 0.11]).at(0, 0.5, -0.1),
    bodyLength: 0.14,
    legLength: -0.055,
    tail: 'puff',
    legThick: 1.6,
    smile: false,
    earScale: 0.8,
    earWidth: 0.85,
    earTilt: -48,
    bulk: 0.04,
    headProbes: [[0, 0.56, 0.38], [0, 0.9, 0.16]],
    paint(fur) {
      return fur;
    },
    extra(k, deer) {
      const pale = deer.tone('fur', '#f2d2a6', 0.5);
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
      // A soft knob of hair on the crown: three round lumps.
      const tuft = sdf.smoothUnion(0.012, ...[-1, 0, 1].map((i) => sdf.sphere(0.024 - 0.003 * Math.abs(i)).at(0.022 * i, 0.885 - 0.006 * Math.abs(i), 0.16 - 0.012 * Math.abs(i))));
      void hair;
      k.body('lashes', lashes, { color: deer.tone('fur', '#5a3a24', 0.5), roughness: 0.8, detail: 0.003, bone: 'head' });
      k.body('tuft', tuft, { color: deer.tone('fur', '#c08a5a', 0.6), roughness: 0.85, detail: 0.003, bone: 'head' });
      // A low round hump over the middle of the back (the body stretch makes it long), and a red
      // blanket over it.
      // The body stretch (`bodyLength`) makes space between z -0.12 and -0.02 2.4 times longer, so
      // the hump and the blanket are built short in Z here.
      const HZ = -0.075;
      const hump = sdf.ellipsoid([0.12, 0.16, 0.055]).at(0, 0.52, HZ).bone('spine');
      const back = sdf.smoothUnion(0.05, deer.trunk, hump);
      k.body('hump', hump, { color: deer.tint.fur, roughness: 0.85, detail: 0.005, bone: 'spine' });
      // The base of the neck bulges forward from the chest, so the neck curves forward and then up.
      const neckBase = sdf.capsule([0, 0.43, 0.12], [0, 0.53, 0.17], 0.07).bone('neck');
      k.body('neck-base', neckBase, { color: deer.tint.fur, roughness: 0.85, detail: 0.005 });
      const cloth = k.tint('blanket');
      // The blanket drapes over the hump and hangs down the sides, its hem in soft folds.
      const cut = sdf.box([0.4, 0.3, 0.1], 0.02).at(0, 0.6, HZ).displace(0.01, (x, y, z) => (y < 0.5 ? Math.sin(z * 260) : 0));
      const blanket = back.round(0.012).smoothIntersect(0.01, cut);
      k.body('blanket', blanket, { color: cloth, roughness: 0.85, detail: 0.004, bone: 'spine' });
      // Loops of twisted cords in bright colors round the hump, each in small ruffles: each loop
      // follows the blanket surface at one height.
      const humpSurf = sdf.smoothUnion(0.05, deer.trunk.intersect(sdf.box([0.5, 0.4, 0.22]).at(0, 0.5, -0.09)), hump).round(0.024);
      const cord = (pts: [number, number, number][], r: number, color: string) =>
        sdf
          .chain(pts.map(([x, y, z]) => [x, y, z, r] as [number, number, number, number]), r * 0.6)
          .paintFn((x, y, z, c) => {
            const t = 0.82 + 0.18 * Math.sin(z * 260 + y * 260 + x * 120);
            return [c[0] * t, c[1] * t, c[2] * t];
          })
          .paint(color);
      const loop = (y: number, phase: number) => {
        const pts: [number, number, number][] = [];
        for (let i = 0; i <= 32; i++) {
          const a = (i / 32) * 2 * Math.PI;
          const yy = y + 0.008 * Math.sin(a * 9 + phase);
          const hit = sdf.raycast(humpSurf, [Math.cos(a) * 0.5, yy, HZ + Math.sin(a) * 0.5], [-Math.cos(a), 0, -Math.sin(a)]);
          if (hit) pts.push([hit[0], hit[1], hit[2]]);
        }
        return pts;
      };
      const cordColors = ['#e8b040', '#3a6ab0', '#4a9a5a', '#e8b040'];
      const cords = sdf.union(...[0.585, 0.62, 0.65, 0.675].map((y, i) => cord(loop(y, i * 1.3), 0.012 - 0.001 * i, cordColors[i]!)));
      k.body('trim', cords, { color: '#e8b040', roughness: 0.8, detail: 0.0025, bone: 'spine' });
      const fringe = sdf.union(
        ...[HZ + 0.04, HZ - 0.04].flatMap((zc) => {
          const top = sdf.raycast(humpSurf, [1, 0.47, zc], [-1, 0, 0]);
          return top ? [sdf.chain([[top[0] + 0.004, 0.465, top[2], 0.01], [top[0] + 0.008, 0.43, top[2], 0.008], [top[0] + 0.008, 0.4, top[2], 0.014]], 0.006)] : [];
        }),
      ).mirror('x');
      k.body('tassels', fringe, { color: '#e8b040', roughness: 0.8, detail: 0.003, bone: 'spine' });
      // A short tail that points back from the rump, with a dark tuft at the end.
      const tail = sdf.smoothUnion(0.012, sdf.chain([[0, 0.45, -0.26, 0.022], [0, 0.44, -0.32, 0.017], [0, 0.42, -0.36, 0.014]], 0.01), sdf.ellipsoid([0.026, 0.034, 0.026]).at(0, 0.405, -0.38).paint(deer.tone('fur', '#6a4a30', 0.6)));
      k.body('tail-hair', tail.bone('tail'), { color: deer.tint.fur, roughness: 0.85, detail: 0.003 });
      // Knobby knees.
      const { FKNEE, BKNEE } = deer.joints;
      const knees = sdf.union(sdf.ellipsoid([0.054, 0.04, 0.054]).at(FKNEE[0], FKNEE[1], FKNEE[2] + 0.006).bone('fshin.L'), sdf.ellipsoid([0.052, 0.038, 0.052]).at(BKNEE[0], BKNEE[1], BKNEE[2] - 0.004).bone('bshin.L')).mirror('x');
      k.body('knees', knees, { color: deer.tint.fur, roughness: 0.85, detail: 0.004 });
    },
  }),
  1.35,
);
