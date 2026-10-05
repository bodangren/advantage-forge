import { mixRgb, noise, profile, rgb, sdf } from '../src/index.js';
import { birdAsset } from './parts/bird-kind.js';
import { bellySpots } from './parts/bird-extras.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Owl — Chibi Quest wildlife (catalog `wildlife/birds/owl`), a round brown owl about 0.42 m tall to
 * the ear tufts, faces +Z. Target: docs/wildlife-mockups/owl_001.jpg (made with mmx).
 *
 * The bird of `assets/parts/bird-kind.ts` at 0.46 of its size, as an owl: a round body and a big
 * head with ear tufts, a pale heart-shaped face disc round very big orange eyes, a tiny hooked
 * grey beak, speckled brown feathers, a cream heart on the belly, and pale feathered feet.
 * Role: a night forest bird and a wise helper in the reading games; the big eyes in the pale face
 *   disc and the ear tufts read at 128 px.
 * Palette (60/30/10): brown #8a5a3a body, head, and wings with dark speckles; a cream face disc and
 *   belly #ecd6ac; orange eyes #f09020 as the accent; a grey beak.
 */
export default scaleAsset(
  birdAsset({
    name: 'owl',
    description: 'Chibi owl: a squat round brown owl with short ear horns that point out, a large cream face disc round very big brown eyes in cream rings, a tiny hooked grey beak, round dark speckles, a cream heart-shaped belly patch, and very short legs; bird rig with wings.',
    reference: 'docs/wildlife-mockups/owl_001.jpg',
    variants: {
      body: { brown: '#8a5a3a', grey: '#7a7470', tawny: '#a8743e', dark: '#5a4232' },
      head: { brown: '#8e5e3c', grey: '#7e7874', tawny: '#ac7840', dark: '#5e4634' },
      wings: { brown: '#7a4a2e', grey: '#6a6460', tawny: '#946234', dark: '#4a3428' },
      eyes: { amber: '#e8901c', brown: '#6a3e1e', yellow: '#f0c020', orange: '#f07a18' },
    },
    presets: {
      grey: { body: 'grey', head: 'grey', wings: 'grey', eyes: 'yellow' },
      eagle: { body: 'brown', head: 'brown', wings: 'brown', eyes: 'orange' },
      tawny: { body: 'tawny', head: 'tawny', wings: 'tawny', eyes: 'amber' },
      dark: { body: 'dark', head: 'dark', wings: 'dark', eyes: 'orange' },
    },
    colors: { belly: '#8a5a3a', flight: '#5a3a24', scale: '#e8d0a8', scaleDark: '#d8c098', talon: '#3a2a22', eyeRim: '#f2e2c0', pupil: '#141012' },
    body: [0.25, 0.2, 0.22],
    head: 0.17,
    beak: 'short',
    beakScale: 0.9,
    eyesOverPaint: true,
    beakWidth: 1.25,
    beakDroop: 40,
    beakColors: ['#6a6060', '#6a6060'],
    mouth: false,
    brows: false,
    eyeScale: 1.35,
    featherOn: { body: false, head: false, wings: false },
    walkBob: 0.3,
    wingRest: -112,
    wingTurn: 40,
    wingOut: 0.07,
    wingScale: 0.62,
    legLength: 0.15,
    wingStyle: 'paddle',
    neckScale: 1.6,
    paint(plumage, b) {
      const { HEAD_C, HR } = b.joints;
      const pale = b.tone('head', '#ecd6ac', 0.3);
      const dark = rgb(b.tone('head', '#4a2e1c', 0.6));
      const e = b.eye.at;
      // The face disc: a large cream heart round both eyes, its point under the beak.
      const disc = sdf
        .smoothUnion(0.03, sdf.sphere(HR * 0.62).at(e[0] * 0.95, e[1], e[2]).mirror('x'), sdf.sphere(HR * 0.34).at(0, HEAD_C[1] - HR * 0.52, e[2]))
        .intersect(sdf.halfSpace([0, 0, -1], -(HEAD_C[2] + HR * 0.35)));
      // Round dark speckles on the crown (cells of jittered dots).
      const speckled = plumage.paintFn((x, y, z, base) => {
        const c = 26;
        const [i, j, l] = [Math.floor(x * c), Math.floor(y * c), Math.floor(z * c)];
        if (noise.random(i, j, l) < 0.6) return base;
        const [cx, cy, cz] = [(i + 0.5) / c, (j + 0.5) / c, (l + 0.5) / c];
        return Math.hypot(x - cx, (y - cy) * 0.8, z - cz) < 0.34 / c ? mixRgb(base, dark, 0.8) : base;
      });
      return speckled.paintWhere(disc, pale, 0.01);
    },
    extra(k, b) {
      const { HEAD_C, HR, BODY_C, B } = b.joints;
      // Short ear horns that point up and out to the sides.
      const root = b.topHit(HR * 0.62, HEAD_C[2] + HR * 0.05);
      const horn = sdf.chain(
        [
          [root[0] - 0.01, root[1] - 0.02, root[2], 0.032],
          [root[0] + 0.04, root[1] + 0.03, root[2] - 0.01, 0.022],
          [root[0] + 0.085, root[1] + 0.05, root[2] - 0.02, 0.005],
        ],
        0.012,
      );
      k.body('tufts', horn.mirror('x').bone('head'), { color: b.tone('head', '#5a3a24', 0.7), roughness: 0.85, detail: 0.003 });
      // A cream heart-shaped belly patch with a clear edge: two lobes at the top and a point at the bottom.
      const fy = BODY_C[1];
      const heart = sdf.smoothUnion(
        0.02,
        sdf.cylinder(B[0] * 0.4, 1).rotateX(90).at(B[0] * 0.3, fy + B[1] * 0.15, 0).mirror('x'),
        sdf.extrude(profile.polygon([[-B[0] * 0.66, fy + B[1] * 0.1], [B[0] * 0.66, fy + B[1] * 0.1], [0, fy - B[1] * 0.85]], { smooth: false }), 1),
      );
      const patch = b.trunk.round(0.003).intersect(heart).intersect(sdf.halfSpace([0, 0, -1], 0));
      k.body('belly-patch', patch.bone('spine'), { color: b.tone('head', '#ecd6ac', 0.3), roughness: 0.85, detail: 0.004 });
      // Dark spots on the brown sides.
      const spots = bellySpots(b, 5, 9, 0.019, [fy - B[1] * 0.55, fy + B[1] * 0.75]).subtract(heart.round(0.012));
      k.body('spots', spots, { color: b.tone('wings', '#4a2e1c', 0.6), roughness: 0.8, detail: 0.003 });
    },
  }),
  0.46,
);
