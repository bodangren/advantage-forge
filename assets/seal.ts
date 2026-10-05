import { sdf } from '../src/index.js';
import { fishAsset } from './parts/fish-kind.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Seal — Chibi Quest wildlife (catalog `wildlife/water/seal`), a round grey seal pup about 0.3 m tall
 * and 0.6 m long, faces +Z. Target: docs/wildlife-mockups/seal_001.jpg (made with mmx).
 *
 * The fish of `assets/parts/fish-kind.ts` (body, eyes, fins, rig, and clips) at 0.75 of its size, as a
 * seal pup: a big round head on a short body that lies on the ground, a short muzzle with a big
 * black nose, a mouth line down to two small chin dots, two whisker lines on each side, calm dark
 * almond eyes with a thin raised lid line over each, two short wide front flippers on the ground,
 * and two large rear flippers that rise behind. No back fin.
 * Role: a coast and ice animal; the round grey shape with the black nose reads at 128 px.
 * Palette (60/30/10): warm grey #878684 (a little lighter on the belly); a black nose and eyes; dark
 *   whisker, mouth, and lid lines.
 */
// The almond eyes: [y, z] of the eye line, the angle from the front, and the radius.
const EYE: [number, number] = [0.312, 0.13];
const EYE_ANGLE = 33;
const EYE_R = 0.026;

export default scaleAsset(
  fishAsset({
    name: 'seal',
    description: 'Chibi seal: a warm grey seal pup with a big round head on a short body, a big black nose, a mouth line and chin dots, whisker lines, calm dark almond eyes under thin lid lines, short wide front flippers, and large rear flippers that rise behind; fish rig.',
    reference: 'docs/wildlife-mockups/seal_001.jpg',
    variants: {
      body: { grey: '#878684', brown: '#8a7a68', white: '#e8e6e2' },
      belly: { grey: '#9a9896', cream: '#c8b8a0', white: '#f4f2ee' },
      fins: { grey: '#7c7b79', brown: '#7a6a58', white: '#dcdad6' },
      eyes: { dark: '#141012', brown: '#3a2418' },
    },
    presets: {
      harbor: { body: 'brown', belly: 'cream', fins: 'brown', eyes: 'brown' },
      pup: { body: 'white', belly: 'white', fins: 'white', eyes: 'dark' },
    },
    colors: { eyeWhite: '#1a1416' },
    spine: [
      [0.258, 0.1, 0.17],
      [0.135, -0.03, 0.128],
      [0.098, -0.14, 0.082],
      [0.125, -0.235, 0.038],
    ],
    rootSection: 1,
    width: 1.2,
    blend: 0.06,
    beak: { from: [0.225, 0.2], to: [0.218, 0.255], r: 0.068 },
    belly: [0.08, 0],
    eye: { at: EYE, angle: EYE_ANGLE, r: EYE_R, style: 'almond', tilt: -4, long: 1.75 },
    tail: 'flippers',
    tailSize: 0.98,
    tailTilt: 68,
    dorsal: false,
    pectoral: 'flipper',
    pectoralAt: [0.085, 0.05],
    pectoralSize: 1.15,
    flipperShape: [0.092, 0.02, 0.05],
    flipperTurn: -52,
    paint(body, fish) {
      const dark = fish.tone('body', '#2a2a30', 0.3);
      const [, ny, nz] = fish.nose;
      // Two whisker lines on each side, and a mouth line down from the nose to two small chin dots:
      // strokes seen from the front, pushed back along Z onto the muzzle.
      const whiskers = sdf.union(...[-14, 0].map((a, i) => sdf.box([0.06, 0.006, 0.3]).rotateZ(a).at(0.09, ny - 0.016 - 0.018 * i, nz - 0.12))).mirror('x');
      const mouth = sdf.box([0.006, 0.04, 0.3]).at(0, ny - 0.034, nz - 0.12);
      const dots = sdf.cylinder(0.0045, 0.3).rotateX(90).at(0.009, ny - 0.06, nz - 0.12).mirror('x');
      return body.paintWhere(sdf.union(whiskers, mouth, dots), dark, 0.002);
    },
    extra(k, fish) {
      // The black nose on top of the muzzle tip.
      const [, ny, nz] = fish.nose;
      const nose = sdf.smoothUnion(0.01, sdf.ellipsoid([0.048, 0.027, 0.03]).at(0, ny + 0.022, nz - 0.012), sdf.ellipsoid([0.018, 0.026, 0.02]).at(0, ny - 0.002, nz - 0.006));
      k.body('nose', nose.bone('head'), { color: '#1a1618', roughness: 0.3, detail: 0.003 });
      // A thin raised lid line over each almond eye, from the inner corner over the top to just
      // past the outer corner, laid on the face along its curve.
      const head = fish.body;
      const onFace = (a: number, y: number, z: number) => sdf.raycast(head, [Math.sin(a), y, z + Math.cos(a)], [-Math.sin(a), 0, -Math.cos(a)])!;
      // The eye center as the kind finds it, then the lid points round an upright axis through the
      // middle of the head (PZ), so they follow the curve of the face.
      const c = onFace((EYE_ANGLE * Math.PI) / 180, EYE[0], EYE[1]);
      const PZ = 0.1;
      const a0 = Math.atan2(c[0], c[2] - PZ);
      const d = Math.hypot(c[0], c[2] - PZ);
      const lid = sdf.chain(
        [-1.6, -0.8, 0, 0.8, 1.6, 2.1].map((u, i) => {
          const y = EYE[0] + EYE_R * (0.4 + 0.16 * Math.cos(u * 0.8)) - (i === 5 ? EYE_R * 0.22 : 0);
          const p = onFace(a0 + (u * EYE_R) / d, y, PZ);
          return [p[0], p[1], p[2], 0.0027] as [number, number, number, number];
        }),
        0.002,
      );
      k.body('lids', lid.mirror('x').bone('head'), { color: '#2a2a30', roughness: 0.4, detail: 0.002 });
    },
  }),
  0.75,
);
