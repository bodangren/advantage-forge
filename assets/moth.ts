import { mixRgb, rgb, sdf } from '../src/index.js';
import { insectAsset } from './parts/insect-kind.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Moth — Chibi Quest wildlife (catalog `wildlife/insects/moth`), a fuzzy moth about 0.38 m tall to
 * the antenna tips, faces +Z. Target: docs/wildlife-mockups/moth_001.jpg (made with mmx).
 *
 * The insect of `assets/parts/insect-kind.ts` at 0.5 of its size, as a moth: a fuzzy brown head
 * with big glossy eyes and an open smile, two antennae with round knobs, a fluffy cream hood of
 * round tufts over the head that runs down onto the chest and frames the face, a plump brown pear
 * body with small arms, and four broad caramel wings, spread nearly level, that darken toward the
 * edges, with dark brown dots.
 * Role: ambient night life round lamps, campfires, and towers; the knobbed antennae, the fluffy
 *   hood, and the wing dots read at 128 px.
 * Palette (60/30/10): brown #8a6a4a head and body; a cream hood #f0e4c8; caramel wings #c8904e
 *   with darker edges and dark brown dots; dark glossy eyes.
 */
export default scaleAsset(
  insectAsset({
    name: 'moth',
    description: 'Chibi moth: a brown moth with a fluffy cream hood of round tufts over its head and chest round its face, big glossy dark eyes, an open happy mouth, two short antennae with round knobs, a round pear body with small arms, and four broad caramel wings with darker edges and brown dots; flyer rig.',
    reference: 'docs/wildlife-mockups/moth_001.jpg',
    variants: {
      body: { brown: '#b07848', grey: '#7a7470', green: '#6a7a4a' },
      stripes: { cream: '#f0e4c8', white: '#f6f4f0' },
      wings: { caramel: '#c8904e', tan: '#c8a880', grey: '#b0aca6', green: '#a8c08a', rose: '#d8a8a0' },
      antennae: { brown: '#5e3a22', grey: '#5a5450', green: '#4a5a2e' },
    },
    presets: {
      grey: { body: 'grey', stripes: 'white', wings: 'grey', antennae: 'grey' },
      luna: { body: 'green', stripes: 'white', wings: 'green', antennae: 'green' },
      rosy: { body: 'brown', stripes: 'cream', wings: 'rose', antennae: 'brown' },
    },
    abdomen: 'pear',
    mane: 'stripes',
    antennae: 'knob',
    eyeStyle: 'iris',
    eyeScale: 1.3,
    iris: '#3e2412',
    nose: '#6a4630',
    antennaSlot: 'antennae',
    limbs: 'arms',
    mouth: 'open',
    maneStyle: 'spiky-hood',
    hindWingLift: 22,
    armPose: 'out',
    wingScale: 1.45,
    wingRootOut: 0.05,
    restHover: 0.08,
    paintHead(head, s) {
      // A warm brown face.
      const { HEAD_C, HR } = s.joints;
      return head.paintWhere(sdf.ellipsoid([HR * 0.85, HR * 0.8, HR]).at(HEAD_C[0], HEAD_C[1] - HR * 0.05, HEAD_C[2] + HR * 0.5), s.tone('body', '#9a6640', 0.5), 0.02);
    },
    wings: 'moth',
    extra(k, s) {
      // Two small legs under the round belly.
      const { BODY_C } = s.joints;
      const leg = sdf.chain([[0.035, BODY_C[1] - 0.06, BODY_C[2] + 0.02, 0.016], [0.045, BODY_C[1] - 0.11, BODY_C[2] + 0.035, 0.013], [0.048, BODY_C[1] - 0.135, BODY_C[2] + 0.05, 0.015]], 0.008);
      k.body('feet', leg.mirror('x').bone('body'), { color: s.tone('body', '#7a5a3c', 0.9), roughness: 0.6, detail: 0.003 });
    },
    paintWing(plate, which, s) {
      // The wing darkens toward its outer edge, and round brown dots.
      const dots: [number, number, number][] = which === 'fore' ? [[0.24, 0.03, 0.03], [0.12, 0.02, 0.022]] : [[0.15, -0.08, 0.028]];
      const darkBrown = s.tone('wings', '#6a4428', 0.5);
      const edge = rgb(s.tone('wings', '#8a5a30', 0.6));
      const reach = which === 'fore' ? 0.3 : 0.2;
      const shaded = plate.paintFn((x, y, _z, base) => {
        const t = Math.min(1, Math.max(0, (Math.hypot(x, y) - reach * 0.6) / (reach * 0.4)));
        return mixRgb(base, edge, t * t * 0.85);
      });
      return dots.reduce((w, [x, y, r]) => w.paintWhere(sdf.cylinder(r, 1).rotateX(90).at(x, y, 0), darkBrown, 0.003), shaded);
    },
  }),
  0.5,
);
