import { sdf } from '../src/index.js';
import { birdAsset } from './parts/bird-kind.js';
import { collar, collarFront } from './parts/bird-extras.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Messenger bird — Chibi Quest wildlife (catalog `wildlife/mounts-and-pets/messenger-bird`), a
 * carrier pigeon about 0.33 m tall, faces +Z. Target: docs/wildlife-mockups/messenger-bird_001.jpg
 * (made with mmx).
 *
 * The pigeon's shape (`assets/pigeon.ts`, the bird of `assets/parts/bird-kind.ts`) at 0.4 of the
 * bird's size, as a carrier pigeon: a cream body and head, tan wings, rosy cheeks, dark eyes, a small
 * dark beak, pink feet, and a leather strap round the body that holds a message tube on the back
 * with a rolled letter and a red wax seal.
 * Role: the bird that brings quest letters and class messages in the games; the tube with the
 *   letter on the back reads at 128 px.
 * Palette (60/30/10): cream #f0e4cc body and head; caramel #c8905a wings; a brown leather strap and
 *   tube; a white letter with a red seal and pink feet as the accent.
 */
export default scaleAsset(
  birdAsset({
    name: 'messenger-bird',
    description: 'Chibi messenger bird: a small round cream chick in one smooth clay shape, with large layered caramel wings, a cream tail, rosy cheeks, small black bead eyes, a small grey beak, short legs with soft pink toes, and a brown leather collar with a buckle that holds a message tube with a rolled letter and a red wax seal up at its side; bird rig with wings.',
    reference: 'docs/wildlife-mockups/messenger-bird_001.jpg',
    variants: {
      body: { butter: '#f4e2a6', cream: '#f0e4cc', white: '#f4f2ee', grey: '#a8aab2' },
      head: { butter: '#f6e6b0', cream: '#f2e8d2', white: '#f6f4f0', grey: '#9a9ca6' },
      wings: { caramel: '#c8905a', tan: '#c09a6a', grey: '#8a8c96', dark: '#7a5236' },
      eyes: { dark: '#2a1a12', brown: '#5a3218' },
    },
    presets: {
      white: { body: 'white', head: 'white', wings: 'grey', eyes: 'dark' },
      grey: { body: 'grey', head: 'grey', wings: 'dark', eyes: 'brown' },
      cream: { body: 'cream', head: 'cream', wings: 'tan', eyes: 'dark' },
    },
    colors: { belly: '#f8eabc', flight: '#a87444', scale: '#e88a8a', scaleDark: '#d47878', talon: '#6a5050' },
    body: [0.2, 0.18, 0.19],
    head: 0.168,
    beak: 'short',
    beakScale: 0.62,
    beakDroop: 14,
    beakColors: ['#7a7680', '#7a7680'],
    mouth: false,
    brows: false,
    eyeStyle: 'bead',
    eyeScale: 0.8,
    eyesOverPaint: true,
    talons: false,
    walkBob: 0.8,
    stillNeck: true,
    clay: true,
    featherBump: 0.003,
    featherOn: { body: false, head: false, wings: true },
    tailSlot: 'body',
    wingRest: -122,
    wingTurn: 60,
    wingOut: 0.05,
    wingScale: 0.7,
    wingSlim: 1.25,
    legLength: 0.2,
    wingStyle: 'paddle',
    neckScale: 1.15,
    headBlend: 0.06,
    oneBody: 0.03,
    cheeks: 0,
    paint(plumage, b) {
      const { HEAD_C, HR } = b.joints;
      const cheek = b.faceHit(HR * 0.62, HEAD_C[1] - HR * 0.3);
      return plumage.paintWhere(sdf.sphere(HR * 0.22).at(cheek[0], cheek[1], cheek[2]).mirror('x'), b.tone('head', '#f0a0a0', 0.4), 0.02);
    },
    extra(k, b) {
      const leather = b.tone('wings', '#7a4a2a', 0.3);
      const tan = '#dcbc8a';
      // The collar: a leather band round the neck with a small brass buckle at the front.
      k.body('strap', collar(b, 0.026), { color: leather, roughness: 0.6, detail: 0.003 });
      const f = collarFront(b);
      const buckle = sdf.box([0.03, 0.026, 0.008], 0.003).subtract(sdf.box([0.018, 0.014, 0.02])).at(f[0], f[1], f[2] + 0.004);
      k.body('buckle', buckle.bone('neck'), { color: '#c8a050', roughness: 0.3, metalness: 0.8, detail: 0.002 });
      // The tube at the left side, held up from the collar so it shows from the front, with a rolled
      // letter and a red seal.
      const a = (75 * Math.PI) / 180;
      const side = sdf.raycast(b.trunk, [Math.sin(a) * 2, f[1] - 0.02, b.joints.HEAD_C[2] + Math.cos(a) * 2], [-Math.sin(a), 0, -Math.cos(a)])!;
      const lean = (s: sdf.Shape) => s.rotateZ(-22).at(side[0] + 0.03, side[1] + 0.04, side[2]);
      const tube = lean(sdf.cylinder(0.034, 0.14, 0.008).subtract(sdf.cylinder(0.026, 0.1).at(0, 0.04, 0)));
      const caps = lean(sdf.union(sdf.torus(0.035, 0.006).at(0, 0.055, 0), sdf.torus(0.035, 0.006).at(0, -0.055, 0)));
      k.body('tube', tube, { color: tan, roughness: 0.55, detail: 0.003, bone: 'spine' });
      k.body('tube-bands', caps, { color: '#a87a4a', roughness: 0.55, detail: 0.003, bone: 'spine' });
      const letter = lean(sdf.cylinder(0.023, 0.1, 0.003).at(0, 0.1, 0));
      k.body('letter', letter, { color: '#f6f0e0', roughness: 0.8, detail: 0.003, bone: 'spine' });
      const seal = lean(sdf.cylinder(0.014, 0.007, 0.002).rotateX(90).at(0, 0.11, 0.024));
      k.body('seal', seal, { color: '#c8202a', roughness: 0.4, detail: 0.002, bone: 'spine' });
    },
  }),
  0.4,
);
