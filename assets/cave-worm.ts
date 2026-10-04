import { motion, noise, sdf } from '../src/index.js';
import { serpentAsset } from './parts/serpent-kind.js';

/**
 * Cave worm — Chibi Quest monster (catalog `monsters/small/cave-worm`), a fat burrowing worm about
 * 0.65 m to the top of its feeler, faces +Z. Target: docs/monster-mockups/cave-worm_001.jpg (made with
 * mmx).
 *
 * The serpent of `assets/parts/serpent-kind.ts` (a spine path, rig, and clips) as a short upright egg
 * with no snake head: a big round mouth on the front with a thick orange lip ring, a pink throat, and
 * four small white fangs, two tiny black eyes and a small nose above it, a fat roll near the ground,
 * two stubby feet, small orange three-pronged bristles on the skin, and a white curly feeler on top.
 * Role: a small cave and mine monster; the ring mouth in the egg read at 128 px.
 * Palette (60/30/10): terracotta #d8735a body; orange #f0985a lip ring and bristles; a pink throat,
 *   white fangs, and the white feeler as the accent.
 * Bodies added: lip (rigid on `spine1`), fangs (on `spine1`), face (eyes and nose, on `spine1`),
 * feeler (on the head), bristles and feet and roll (tagged to the body bones).
 */
type V3 = [number, number, number];

const MOUTH: V3 = [0, 0.27, 0.158];

export default serpentAsset({
  name: 'cave-worm',
  description: 'Chibi cave worm monster: a fat terracotta egg-shaped worm with a big round mouth with a thick orange lip ring, a pink throat, and four small white fangs, two tiny black eyes, a fat roll near the ground, stubby feet, small orange bristles, and a white curly feeler on top; serpent rig.',
  reference: 'docs/monster-mockups/cave-worm_001.jpg',
  variants: {
    body: { terracotta: '#d8735a', sand: '#c8a070', slate: '#8a84a8' },
    belly: { orange: '#f0985a', peach: '#f4b890', lilac: '#b49ad0' },
    eyes: { black: '#141012', brown: '#3a2416', plum: '#341e40' },
  },
  presets: {
    sandy: { body: 'sand', belly: 'peach', eyes: 'brown' },
    deep: { body: 'slate', belly: 'lilac', eyes: 'plum' },
  },
  path: [
    [0, 0.07, -0.14, 0.06],
    [0, 0.17, -0.03, 0.17],
    [0, 0.3, 0.0, 0.16],
    [0, 0.43, -0.01, 0.12],
  ],
  root: 1,
  bellyEdge: 1,
  face: false,
  paint(body, s) {
    // The round mouth: a cavity into the front with a pink throat inside.
    const cavity = sdf.ellipsoid([0.098, 0.098, 0.13]).at(MOUTH[0], MOUTH[1], MOUTH[2] + 0.03);
    return body.smoothSubtract(0.008, cavity).paintWhere(cavity.round(0.012), s.tone('belly', '#e0877e', 0.3), 0.004);
  },
  extra(k, s) {
    const lipColor = s.tint.belly;
    // A thick lip ring around the mouth, and four small fangs on its inner edge.
    const lip = sdf.torus(0.106, 0.03).scale([1, 1, 0.6]).rotateX(90).at(...MOUTH);
    k.body('lip', lip, { color: lipColor, roughness: 0.55, bone: 'spine1' });
    const fangs = sdf.union(
      ...[40, 140, 230, 310].map((deg) => {
        const a = (deg * Math.PI) / 180;
        const c: V3 = [MOUTH[0] + Math.cos(a) * 0.082, MOUTH[1] + Math.sin(a) * 0.082, MOUTH[2] - 0.004];
        const tip: V3 = [MOUTH[0] + Math.cos(a) * 0.052, MOUTH[1] + Math.sin(a) * 0.052, MOUTH[2] - 0.012];
        return sdf.cone(c, tip, 0.011, 0.002);
      }),
    );
    k.body('fangs', fangs, { color: '#fbf6ee', roughness: 0.3, detail: 0.003, bone: 'spine1' });
    // Two tiny black eyes with a shine, far apart above the mouth, and a small dark nose between.
    const eyeAt = sdf.surfacePoint(s.body, [0.085, 0.425, 0.2], -0.006);
    const eye = sdf
      .sphere(0.016)
      .at(...eyeAt)
      .paintWhere(sdf.sphere(0.006).at(eyeAt[0] + 0.004, eyeAt[1] + 0.008, eyeAt[2] + 0.013), '#ffffff', 0.001);
    const noseAt = sdf.surfacePoint(s.body, [0, 0.4, 0.2], 0);
    const nose = sdf.capsule([0.012, noseAt[1] + 0.006, noseAt[2]], [0, noseAt[1] - 0.006, noseAt[2] + 0.002], 0.005).mirror('x');
    k.body('face', sdf.union(eye.mirror('x'), nose.paint(s.tint.eye)), { color: s.tint.eye, roughness: 0.15, detail: 0.003, bone: 'spine1' });
    // A white curly feeler on top with two small side prongs.
    const feeler = sdf.smoothUnion(
      0.008,
      sdf.chain(
        [
          [0, 0.53, -0.02, 0.017],
          [0, 0.59, -0.01, 0.014],
          [0.02, 0.635, 0.0, 0.011],
          [0.045, 0.64, 0.03, 0.008],
          [0.045, 0.615, 0.05, 0.006],
        ],
        0.01,
      ),
      sdf.cone([0, 0.575, -0.012], [-0.03, 0.605, 0.0], 0.008, 0.003),
      sdf.cone([0.015, 0.625, -0.004], [0.02, 0.66, -0.03], 0.007, 0.003),
    );
    k.body('feeler', feeler.bone('head'), { color: '#f6eee6', roughness: 0.5, detail: 0.003 });
    // Small three-pronged bristles on the skin, away from the mouth and the face.
    const bristles: sdf.Shape[] = [];
    for (let i = 0; bristles.length < 14 && i < 80; i++) {
      const a = noise.random(i, 3, 7) * Math.PI * 2;
      const y = 0.08 + noise.random(i, 5, 11) * 0.38;
      const guess: V3 = [Math.sin(a) * 0.2, y, Math.cos(a) * 0.2];
      if (Math.cos(a) > 0.55 && y > 0.14 && y < 0.46) continue; // the mouth and the face
      const p = sdf.surfacePoint(s.body, guess, -0.004);
      const nrm = sdf.normalAt(s.body, p);
      const up: V3 = [0, 1, 0];
      const side: V3 = [nrm[1] * up[2] - nrm[2] * up[1], nrm[2] * up[0] - nrm[0] * up[2], nrm[0] * up[1] - nrm[1] * up[0]];
      const prong = (sx: number, len: number) =>
        sdf.cone(p, [p[0] + nrm[0] * len + side[0] * sx + 0.008 * (sx === 0 ? 1 : 0), p[1] + nrm[1] * len + (sx === 0 ? 0.01 : 0.004), p[2] + nrm[2] * len + side[2] * sx], 0.006, 0.002);
      bristles.push(sdf.union(prong(0, 0.032), prong(0.016, 0.024), prong(-0.016, 0.024)).bone(y > 0.3 ? 'spine1' : 'root'));
    }
    k.body('bristles', sdf.union(...bristles), { color: lipColor, roughness: 0.55, detail: 0.003 });
    // A fat roll around the base, bulging at the front, and two stubby feet.
    const roll = sdf.torus(0.13, 0.045).scale([1, 1, 1.05]).at(0, 0.1, 0.025).bone('root');
    const feet = sdf.ellipsoid([0.045, 0.03, 0.05]).at(0.075, 0.028, 0.13).mirror('x').bone('root');
    k.body('roll', sdf.smoothUnion(0.02, roll, feet), { color: s.tint.body, roughness: 0.6 });
  },
  pose(clip, p) {
    const { keys } = motion;
    // The short body needs bigger bends: a lunge forward with the mouth in the attack, and a flop
    // onto the side in the death.
    if (clip === 'attack') {
      const b = keys(p, [[0, 0], [0.3, -1], [0.45, 1.4], [0.6, 1.2], [1, 0]]);
      return { spine1: { rotate: [20 * b, 0, 0] }, head: { rotate: [10 * b, 0, 0] } };
    }
    if (clip === 'death') {
      const cry = keys(p, [[0, 0], [0.12, 1], [0.26, 1], [0.36, 0]]);
      const d = keys(p, [[0.28, 0], [0.62, 1], [0.68, 0.92], [0.74, 1]]);
      return { spine1: { rotate: [-12 * cry, 0, -55 * d] }, head: { rotate: [-8 * cry, 0, -30 * d] } };
    }
    return {};
  },
});
