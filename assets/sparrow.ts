import { profile, sdf } from '../src/index.js';
import { birdAsset } from './parts/bird-kind.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Sparrow — Chibi Quest wildlife (catalog `wildlife/birds/sparrow`), a tiny round bird about 0.27 m
 * tall, faces +Z. Target: docs/wildlife-mockups/sparrow_001.jpg (made with mmx).
 *
 * The bird of `assets/parts/bird-kind.ts` at 0.32 of its size, as a house sparrow: a round brown
 * body with a cream belly, a grey cap, pale cheeks, a small black bib, darker brown wings, dark
 * eyes, a short dark conical beak, and pink feet.
 * Role: ambient life in villages, farms, and gardens; the grey cap and the black bib read at
 *   128 px.
 * Palette (60/30/10): brown #9a6a3e body and head; a cream belly #efe0c4 and cheeks; a grey cap; dark
 *   brown wings; a black bib and pink feet as the accent.
 */
export default scaleAsset(
  birdAsset({
    name: 'sparrow',
    description: 'Chibi sparrow: a tiny egg-shaped sparrow with a cream face and front, brown sides and back, a grey cap that comes down in a point between the eyes, a small tuft, small black bead eyes, a big dark beak, a small black bib with a scalloped edge below the beak, a clear brown edge round the cream front, brown wings held out a little, and pink legs; bird rig with wings.',
    reference: 'docs/wildlife-mockups/sparrow_001.jpg',
    variants: {
      body: { brown: '#9a6a3e', sandy: '#b08a5a', grey: '#8a8076' },
      head: { brown: '#a07040', sandy: '#b8925e', grey: '#90867c' },
      wings: { brown: '#7a4a2a', sandy: '#8e6a42', grey: '#6a5e54' },
      eyes: { dark: '#1e1612', brown: '#4a2a14' },
    },
    presets: {
      sandy: { body: 'sandy', head: 'sandy', wings: 'sandy', eyes: 'brown' },
      grey: { body: 'grey', head: 'grey', wings: 'grey', eyes: 'dark' },
    },
    colors: { belly: '#efe0c4', flight: '#5a3a22', scale: '#e8a0a0', scaleDark: '#d48888', talon: '#6a5050' },
    body: [0.2, 0.21, 0.19],
    head: 0.15,
    beak: 'short',
    beakScale: 0.75,
    beakWidth: 1.2,
    beakDroop: 22,
    beakColors: ['#2e2a28', '#2e2a28'],
    mouth: false,
    brows: 'head',
    browSize: 0.7,
    eyeStyle: 'bead',
    eyesOverPaint: true,
    eyeScale: 0.9,
    bellySize: 1.0,
    talons: false,
    walkBob: 0.8,
    stillNeck: true,
    wingRest: -122,
    wingTurn: 42,
    wingOut: 0.08,
    wingScale: 0.56,
    legLength: 0.6,
    thighs: false,
    wingBars: { color: '#4a2c18', at: [0.1, 0.18, 0.26] },
    wingStyle: 'paddle',
    neckScale: 1.55,
    paint(plumage, b) {
      const { HEAD_C, HR } = b.joints;
      const grey = b.tone('head', '#8a8a92', 0.3);
      const cream = b.tone('body', '#efe0c4');
      const black = b.tone('head', '#2a2420', 0.2);
      // A cream face over the whole front of the head, under a grey cap whose front edge comes down
      // in a V between the eyes to the beak: the sloped edges are a stern brow over each eye.
      const face = sdf.ellipsoid([HR * 0.95, HR * 1.05, HR]).at(0, HEAD_C[1] - HR * 0.15, HEAD_C[2] + HR * 0.5);
      const cap = sdf
        .smoothUnion(
          0.006,
          sdf.sphere(HR * 1.2).at(0, HEAD_C[1] + HR * 0.15, HEAD_C[2] - HR * 0.1).intersect(sdf.halfSpace([0, -1, 0], -(HEAD_C[1] + HR * 0.5))),
          sdf
            .extrude(profile.polygon([[-HR * 1.1, HR * 1.4], [HR * 1.1, HR * 1.4], [HR * 1.1, HR * 0.9], [HR * 0.1, -HR * 0.2], [-HR * 0.1, -HR * 0.2], [-HR * 1.1, HR * 0.9]], { smooth: false }), 1)
            .at(0, HEAD_C[1], 0)
            .intersect(sdf.halfSpace([0, 0, -1], -HEAD_C[2])),
        );
      void black;
      return plumage.paintWhere(face, cream, 0.012).paintWhere(cap, grey, 0.01);
    },
    paintBody(body, b) {
      // The cream front with a clear edge, so the brown cape reads round it.
      const { BODY_C, B } = b.joints;
      // The cream reaches up to the bib under the chin.
      const front = sdf.ellipsoid([B[0] * 0.68, B[1] * 1.05, B[2] * 0.55]).at(0, BODY_C[1] + B[1] * 0.05, BODY_C[2] + B[2] * 0.6);
      // Dark streaks on the back: short strokes down the back in loose rows.
      const streaks: sdf.Shape[] = [];
      for (let row = 0; row < 4; row++) {
        for (let j = 0; j < 4; j++) {
          const x = (j - 1.5) * B[0] * 0.32 + (row % 2) * B[0] * 0.12;
          const y = BODY_C[1] + B[1] * (0.55 - row * 0.32);
          streaks.push(sdf.ellipsoid([B[0] * 0.05, B[1] * 0.13, 0.3]).rotateZ(x * 60).at(x, y, BODY_C[2] - 0.3));
        }
      }
      return body
        .paintWhere(front, b.tone('body', '#efe0c4'), 0.012)
        .paintWhere(sdf.union(...streaks).intersect(sdf.halfSpace([0, 0, 1], BODY_C[2] - B[2] * 0.3)), b.tone('body', '#5a3a22', 0.6), 0.006);
    },
    extra(k, b) {
      // A small tuft of three short crest feathers on the crown, bent back.
      const { HEAD_C, HR } = b.joints;
      const cr = b.topHit(0, HEAD_C[2] + HR * 0.1);
      const curl = sdf.smoothUnion(
        0.006,
        ...[-1, 0, 1].map((i) =>
          sdf
            .chain([[0, -0.01, 0.004, 0.014], [0, 0.016, -0.004, 0.011], [0, 0.026, -0.02, 0.004]], 0.006)
            .scale(1.45 * (1 - Math.abs(i) * 0.2))
            .rotateZ(i * 22)
            .at(i * 0.011, 0, -Math.abs(i) * 0.011),
        ),
      );
      k.body('tuft', curl.at(cr[0], cr[1], cr[2]).bone('head'), { color: b.tone('head', '#8a8a92', 0.3), roughness: 0.85, detail: 0.003 });
      // The black bib on the throat below the beak, with three scallops on its lower edge. It
      // stays below the head, on the neck and the upper chest.
      const w = 0.068;
      const top = HEAD_C[1] - HR * 0.5;
      const bottom = top - 0.075;
      const outline = profile.polygon(
        [
          [-w, top],
          [w, top],
          [w * 0.95, bottom + 0.02],
          [w * 0.62, bottom - 0.005],
          [w * 0.33, bottom + 0.012],
          [0, bottom - 0.012],
          [-w * 0.33, bottom + 0.012],
          [-w * 0.62, bottom - 0.005],
          [-w * 0.95, bottom + 0.02],
        ],
        { smooth: true },
      );
      const bib = b.trunk.round(0.004).intersect(sdf.extrude(outline, 1)).intersect(sdf.halfSpace([0, 0, -1], -(HEAD_C[2] + 0.02)));
      k.body('bib', bib.bone('neck'), { color: b.tone('head', '#2a2622', 0.2), roughness: 0.8, detail: 0.003 });
    },
  }),
  0.32,
);
