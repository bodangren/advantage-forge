import { sdf } from '../src/index.js';
import { insectAsset } from './parts/insect-kind.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Moth — Chibi Quest wildlife (catalog `wildlife/insects/moth`), a fuzzy moth about 0.38 m tall to
 * the antenna tips, faces +Z. Target: docs/wildlife-mockups/moth_001.jpg (made with mmx).
 *
 * The insect of `assets/parts/insect-kind.ts` at 0.5 of its size, as a moth: a fuzzy brown head
 * with big glossy eyes and a smile, two big feathery antennae, a fluffy cream collar, a plump
 * fuzzy brown body, and four broad pale brown wings with dark eye spots.
 * Role: ambient night life round lamps, campfires, and towers; the feathery antennae, the fluffy
 *   collar, and the eye spots read at 128 px.
 * Palette (60/30/10): brown #8a6a4a head and body; a cream collar #f0e4c8; pale brown wings #c8a880
 *   with dark brown eye spots; dark glossy eyes.
 */
export default scaleAsset(
  insectAsset({
    name: 'moth',
    description: 'Chibi moth: a brown moth with a big fluffy cream mane round its face, big glossy dark eyes, an open happy mouth, two short antennae with round knobs, a round pear body with small arms, and four broad pale tan wings with brown dots; flyer rig.',
    reference: 'docs/wildlife-mockups/moth_001.jpg',
    variants: {
      body: { brown: '#8a6a4a', grey: '#7a7470', green: '#6a7a4a' },
      stripes: { cream: '#f0e4c8', white: '#f6f4f0' },
      wings: { tan: '#c8a880', grey: '#b0aca6', green: '#a8c08a', rose: '#d8a8a0' },
      antennae: { brown: '#5e3a22', grey: '#5a5450', green: '#4a5a2e' },
    },
    presets: {
      grey: { body: 'grey', stripes: 'white', wings: 'grey', antennae: 'grey' },
      luna: { body: 'green', stripes: 'white', wings: 'green', antennae: 'green' },
      rosy: { body: 'brown', stripes: 'cream', wings: 'rose', antennae: 'brown' },
    },
    abdomen: 'pear',
    mane: 'stripes',
    antennae: 'lobe',
    eyeStyle: 'iris',
    eyeScale: 1.3,
    iris: '#8a5426',
    nose: '#6a4630',
    antennaSlot: 'antennae',
    limbs: 'arms',
    mouth: 'open',
    maneStyle: 'strands',
    armPose: 'out',
    wingScale: 1.45,
    wingRootOut: 0.05,
    restHover: 0.08,
    paintHead(head, s) {
      // A lighter tan-brown face.
      const { HEAD_C, HR } = s.joints;
      return head.paintWhere(sdf.ellipsoid([HR * 0.85, HR * 0.8, HR]).at(HEAD_C[0], HEAD_C[1] - HR * 0.05, HEAD_C[2] + HR * 0.5), s.tone('body', '#c8a070', 0.5), 0.02);
    },
    wings: 'moth',
    paintWing(plate, which, s) {
      // Round brown dots on each wing.
      const dots: [number, number, number][] = which === 'fore' ? [[0.24, 0.03, 0.03], [0.12, 0.02, 0.022]] : [[0.15, -0.08, 0.028]];
      const darkBrown = s.tone('wings', '#6a4428', 0.5);
      return dots.reduce((w, [x, y, r]) => w.paintWhere(sdf.cylinder(r, 1).rotateX(90).at(x, y, 0), darkBrown, 0.003), plate);
    },
  }),
  0.5,
);
