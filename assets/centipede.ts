import { motion, rgb, sdf } from '../src/index.js';
import { serpentAsset } from './parts/serpent-kind.js';

/**
 * Centipede — Chibi Quest monster (catalog `monsters/small/centipede`), a chubby giant centipede
 * about 0.5 m tall and 0.65 m long, faces +Z. Target: docs/monster-mockups/centipede_001.jpg (made
 * with mmx).
 *
 * The serpent of `assets/parts/serpent-kind.ts` (a spine path, rig, and clips) low along the ground
 * with no snake head: a fat orange body in dark red bands, a lighter belly, eight pairs of short legs
 * with round yellow feet, and a big round head at the raised front with big glossy eyes, a small
 * round mouth, and two long antennae on their own bones.
 * Role: a small cave and forest monster; the big round head and the banded body read at 128 px.
 * Palette (60/30/10): orange #e88a48 body and head; dark red #a8402e bands; yellow #f2c84a feet as
 *   the accent with the black and white eyes.
 * Bodies added: head, eyes, mouth (on the head), antennae (on `antenna.L` and `antenna.R`), legs
 * (tagged to the body bones).
 */
type V3 = [number, number, number];

const HEAD_C: V3 = [0, 0.34, 0.1];
const ANT: V3 = [0.06, 0.46, 0.08];

export default serpentAsset({
  name: 'centipede',
  description: 'Chibi giant centipede monster: a fat orange segmented body in dark red bands, eight pairs of short legs with round yellow feet, a big round head with big glossy eyes, a small round mouth, and two long antennae; serpent rig with antenna bones.',
  reference: 'docs/monster-mockups/centipede_001.jpg',
  variants: {
    body: { orange: '#e88a48', green: '#7ab04a', violet: '#9a72c0' },
    belly: { peach: '#f4b07a', lime: '#b8d880', lilac: '#c8b0e0' },
    eyes: { black: '#161214', brown: '#3a2416', blue: '#24406a' },
    feet: { yellow: '#f2c84a', white: '#f2eee4', pink: '#f0a0a8' },
  },
  presets: {
    moss: { body: 'green', belly: 'lime', eyes: 'brown', feet: 'white' },
    dusk: { body: 'violet', belly: 'lilac', eyes: 'blue', feet: 'pink' },
  },
  path: [
    [0.03, 0.1, -0.46, 0.065],
    [0.02, 0.12, -0.36, 0.09],
    [0, 0.13, -0.25, 0.105],
    [-0.01, 0.14, -0.13, 0.115],
    [0, 0.15, -0.02, 0.115],
    [0, 0.22, 0.06, 0.095],
  ],
  root: 3,
  bellyEdge: 0.6,
  plate: 1,
  face: false,
  bones: {
    'antenna.L': { parent: 'head', at: ANT, tail: [0.12, 0.6, 0.02] },
    'antenna.R': { parent: 'head', at: [-ANT[0], ANT[1], ANT[2]], tail: [-0.12, 0.6, 0.02] },
  },
  paint(body, s) {
    // Dark red bands around the body, one every 0.075 m.
    const band = s.tone('body', '#a8402e');
    return body.paintFn((x, y, z, c) => {
      const a = s.along(x, y, z);
      return a.side > -0.5 && (a.s / 0.075) % 1 < 0.34 ? rgb(band) : c;
    });
  },
  extra(k, s) {
    // The big round head, with big glossy eyes, a small round mouth, and a lighter chin.
    const head = sdf.ellipsoid([0.15, 0.135, 0.13]).at(...HEAD_C);
    const mouth = sdf.ellipsoid([0.022, 0.026, 0.05]).at(HEAD_C[0], HEAD_C[1] - 0.06, HEAD_C[2] + 0.12);
    k.body('head-ball', head.smoothSubtract(0.006, mouth).paintWhere(mouth.round(0.004), '#5a2430', 0.002).bone('head'), {
      color: s.tint.body,
      roughness: 0.55,
      textureDensity: 1.8,
    });
    const eyeAt = sdf.surfacePoint(head, [0.07, HEAD_C[1] + 0.02, HEAD_C[2] + 0.12], -0.012);
    const eye = sdf
      .sphere(0.045)
      .at(...eyeAt)
      .paintWhere(sdf.sphere(0.036).at(eyeAt[0] - 0.002, eyeAt[1] - 0.002, eyeAt[2] + 0.02), s.tint.eye, 0.002)
      .paintWhere(sdf.sphere(0.012).at(eyeAt[0] + 0.01, eyeAt[1] + 0.017, eyeAt[2] + 0.038), '#ffffff', 0.001);
    k.body('eyes', eye.mirror('x').bone('head'), { color: '#fbf8f2', roughness: 0.12, textureDensity: 2, detail: 0.003 });
    // Two long antennae, bent back, on their own bones.
    const antenna = sdf.chain([[ANT[0], ANT[1] - 0.02, ANT[2], 0.014], [0.09, 0.56, 0.06, 0.011], [0.12, 0.6, 0.02, 0.009], [0.14, 0.6, -0.01, 0.012]], 0.008);
    k.body('antennae', antenna.bone('antenna.L').mirror('x'), { color: s.tone('body', '#8a3a2a'), roughness: 0.5, detail: 0.003 });
    // Eight pairs of short legs down the body, each with a round foot on the ground.
    const feetColor = k.tint('feet');
    const legs: sdf.Shape[] = [];
    const feet: sdf.Shape[] = [];
    for (let i = 0; i < 8; i++) {
      const f = s.frame(0.1 + i * 0.105);
      const side: V3 = [f.dir[2], 0, -f.dir[0]]; // the body's left, flat on the ground
      const l = Math.hypot(side[0], side[2]) || 1;
      const sx = side[0] / l;
      const sz = side[2] / l;
      const hip: V3 = [f.p[0] + sx * f.r * 0.7, f.p[1] - f.r * 0.35, f.p[2] + sz * f.r * 0.7];
      const foot: V3 = [f.p[0] + sx * (f.r + 0.035), 0.022, f.p[2] + sz * (f.r + 0.035) + 0.01];
      legs.push(sdf.capsule(hip, foot, 0.017).bone(f.bone));
      feet.push(sdf.sphere(0.024).scale([1, 0.85, 1.1]).at(...foot).bone(f.bone));
      // The right leg of the pair, on the other side of the body.
      const hipR: V3 = [f.p[0] - sx * f.r * 0.7, hip[1], f.p[2] - sz * f.r * 0.7];
      const footR: V3 = [f.p[0] - sx * (f.r + 0.035), 0.022, f.p[2] - sz * (f.r + 0.035) + 0.01];
      legs.push(sdf.capsule(hipR, footR, 0.017).bone(f.bone));
      feet.push(sdf.sphere(0.024).scale([1, 0.85, 1.1]).at(...footR).bone(f.bone));
    }
    k.body('legs', sdf.union(...legs), { color: s.tone('body', '#c8603a'), roughness: 0.55, detail: 0.004 });
    k.body('feet', sdf.union(...feet), { color: feetColor, roughness: 0.5, detail: 0.004 });
  },
  pose(clip, p) {
    const { wave, keys } = motion;
    // The antennae sway in every clip, and wave fast when it is hit.
    const n = clip === 'hit' ? 4 : clip === 'walk' ? 2 : 1;
    const amp = clip === 'death' ? 0 : 10;
    const droop = clip === 'death' ? keys(p, [[0.3, 0], [0.7, 30]]) : 0;
    const antennae = {
      'antenna.L': { rotate: [amp * wave(p, n) + droop, 0, 6 * wave(p, n, 0.25) - droop * 0.5] as [number, number, number] },
      'antenna.R': { rotate: [amp * wave(p, n, 0.15) + droop, 0, -6 * wave(p, n, 0.4) + droop * 0.5] as [number, number, number] },
    };
    if (clip === 'attack') {
      // The short raised front needs a bigger bend: it rears up, then lunges down and bites.
      const b = keys(p, [[0, 0], [0.3, -1], [0.38, -1], [0.5, 1.2], [0.62, 1], [1, 0]]);
      return { ...antennae, spine1: { rotate: [16 * b, 0, 0] }, head: { rotate: [12 * b, 0, 0] }, root: { rotate: [4 * b, 0, 0] } };
    }
    return antennae;
  },
});
