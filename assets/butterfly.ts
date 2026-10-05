import { profile, sdf } from '../src/index.js';
import { insectAsset } from './parts/insect-kind.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Butterfly — Chibi Quest wildlife (catalog `wildlife/insects/butterfly`), a small butterfly about
 * 0.38 m tall and 0.5 m across the wings, faces +Z. Target: docs/wildlife-mockups/butterfly_001.jpg
 * (made with mmx).
 *
 * The insect of `assets/parts/insect-kind.ts` at 0.5 of its size, as a butterfly: a round head with
 * a pale face, a dark cap, big glossy eyes, pink cheeks, and a smile, curled antennae, a slim dark
 * body, and four large bright orange wings with dark borders, dark veins, and white spots, held
 * open and flapping slowly.
 * Role: ambient life in meadows, gardens, and fairy places; the bright wings read at 128 px.
 * Palette (60/30/10): bright orange wings #f08a1a; dark #2a2426 body, borders, and veins; a pale
 *   peach face #f6d8c0; white spots and pink cheeks as the accent.
 */
export default scaleAsset(
  insectAsset({
    name: 'butterfly',
    description: 'Chibi butterfly: a small butterfly with a round head, a pale face, big glossy dark eyes, pink cheeks, a smile, curled antennae, a slim dark body, and four large bright orange wings with dark borders and white spots; flyer rig.',
    reference: 'docs/wildlife-mockups/butterfly_001.jpg',
    variants: {
      body: { dark: '#2a2426', brown: '#4a3426' },
      stripes: { dark: '#2a2426', brown: '#4a3426' },
      wings: { orange: '#f08a1a', blue: '#3a8ae0', yellow: '#f2d02a', pink: '#e86aa8' },
      face: { peach: '#f6d8c0', cream: '#f4ecd8' },
    },
    presets: {
      blue: { body: 'dark', stripes: 'dark', wings: 'blue', face: 'cream' },
      lemon: { body: 'brown', stripes: 'brown', wings: 'yellow', face: 'peach' },
      rose: { body: 'dark', stripes: 'dark', wings: 'pink', face: 'peach' },
    },
    headSlot: 'face',
    head: 0.16,
    abdomen: 'slim',
    limbs: 'arms',
    antennae: 'spiral',
    eyeScale: 1.5,
    armPose: 'out',
    wings: 'butterfly',
    cheeks: true,
    restHover: 0.08,
    paintHead(head, s) {
      // A dark cap over the top and the back of the head.
      const { HEAD_C, HR } = s.joints;
      // The dark cap over the top of the head comes down to a point between the eyes.
      const cap = sdf.sphere(HR * 1.15).at(HEAD_C[0], HEAD_C[1] + HR * 0.55, HEAD_C[2] - HR * 0.35);
      const point = sdf
        .extrude(profile.polygon([[-HR * 0.42, HR * 0.62], [HR * 0.42, HR * 0.62], [0, HR * 0.08]], { smooth: false }), 1)
        .at(HEAD_C[0], HEAD_C[1], 0)
        .intersect(sdf.halfSpace([0, 0, -1], -HEAD_C[2]));
      return head.paintWhere(sdf.smoothUnion(HR * 0.06, cap, point), s.tint.body, 0.008);
    },
    paintWing(plate, which, s) {
      const dark = s.tint.stripes;
      // The dark border: the plate outside a copy shrunk about the middle of the wing.
      const c: [number, number] = which === 'fore' ? [0.17, 0.1] : [0.13, -0.1];
      const inner = plate.at(-c[0], -c[1], 0).scale([0.78, 0.74, 20]).at(c[0], c[1], 0);
      const border = sdf.box([1, 1, 1]).subtract(inner);
      // One large white dot inside each wing.
      const dot: [number, number, number] = which === 'fore' ? [0.21, 0.12, 0.034] : [0.16, -0.12, 0.028];
      return plate.paintWhere(border, dark, 0.004).paintWhere(sdf.cylinder(dot[2], 1).rotateX(90).at(dot[0], dot[1], 0), '#fbf6ee', 0.003);
    },
  }),
  0.5,
);
