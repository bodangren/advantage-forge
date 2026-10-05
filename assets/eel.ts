import { motion, profile, sdf } from '../src/index.js';
import { scaleAsset } from './parts/scale-asset.js';
import { serpentAsset } from './parts/serpent-kind.js';

/**
 * Eel — Chibi Quest wildlife (catalog `wildlife/water/eel`), a long green eel about 0.4 m tall with
 * its neck raised, faces +Z. Target: docs/wildlife-mockups/eel_001.jpg (made with mmx).
 *
 * The serpent of `assets/parts/serpent-kind.ts` (body chain, rig, and clips, as the giant snake of
 * `assets/giant-snake.ts`) at 0.75 of its size, as a baby sea eel: a thick smooth green body that
 * rises from the ground in an S curve and ends in a tail that curls up, a pale yellow belly with
 * plate lines, and its own big round head (no snake jaw or tongue) that grows out of the neck, with
 * a full snout, a wide thin smile along both sides, and glossy black eyes on the sides. A crest of
 * round soft nubs runs from a larger nub on top of the head down the neck and the back to the tail.
 * Role: ambient life in rivers, ponds, and the sea games; the big head, the S curve, and the crest
 *   read at 128 px.
 * Palette (60/30/10): green #5aae5a body and crest; a pale yellow belly #f2eaa0; dark eyes.
 */
// The head (at the kind size, before the 0.75 scale): a round cranium over the top of the neck and
// a full rounded snout in front, with a wide thin smile that runs back along both sides of the snout.
const HEAD_C: [number, number, number] = [0, 0.45, 0.07];
const eelHead = () =>
  sdf.smoothUnion(
    0.05,
    sdf.ellipsoid([0.148, 0.128, 0.14]).at(...HEAD_C),
    sdf.ellipsoid([0.1, 0.078, 0.122]).at(0, 0.398, 0.172),
  );
const SMILE = sdf.extrude(profile.arc(0.16, 0.008, 250, 290), 0.3).at(0, 0.374 + 0.16, 0.3);

export default scaleAsset(
  serpentAsset({
    name: 'eel',
    description: 'Chibi eel: a thick smooth green eel in an S curve with its neck raised and its tail curled up, a pale yellow belly, a big round head with a wide smile and glossy black eyes on the sides, and a crest of soft round nubs from the head down the back; serpent rig.',
    reference: 'docs/wildlife-mockups/eel_001.jpg',
    variants: {
      body: { mint: '#86c886', green: '#5aae5a', olive: '#7a8a3a', blue: '#3a7ab0', moray: '#8a7a3a' },
      belly: { yellow: '#f2eaa0', cream: '#f0e8d4' },
      eyes: { black: '#161214', brown: '#3a2416' },
    },
    presets: {
      olive: { body: 'olive', belly: 'cream', eyes: 'brown' },
      blue: { body: 'blue', belly: 'cream', eyes: 'black' },
      moray: { body: 'moray', belly: 'yellow', eyes: 'brown' },
    },
    // A short S coil: up from the ground behind the neck, out to the left, back across to the
    // right, and the tail curls up close behind the body.
    path: [
      [-0.075, 0.25, -0.15, 0.012],
      [-0.09, 0.18, -0.18, 0.022],
      [-0.085, 0.11, -0.185, 0.034],
      [-0.045, 0.068, -0.155, 0.046],
      [0.035, 0.064, -0.12, 0.056],
      [0.085, 0.066, -0.04, 0.064],
      [0.05, 0.076, 0.05, 0.07],
      [0, 0.16, 0.105, 0.074],
      [0, 0.265, 0.095, 0.076],
      [0, 0.335, 0.075, 0.078],
    ],
    root: 5,
    // The pale belly starts after the raised tail tip.
    bellyFrom: 0.3,
    // The head is built here: one smooth round head that grows out of the thick neck (merged into
    // the body mesh in `paint`), so there is no snake jaw, mouth, or tongue.
    face: false,
    paint(body, s) {
      return sdf.smoothUnion(0.06, body, eelHead().paintWhere(SMILE, s.tone('body', '#2a4a2a', 0.3), 0.002).bone('head'));
    },
    extra(k, s) {
      // Glossy black eyes on the sides of the head, looking forward and out, with one shine each.
      const head = eelHead();
      const eye = (side: 1 | -1) => {
        const c = sdf.surfacePoint(head, [0.12 * side, 0.455, 0.14], -0.013);
        return sdf
          .sphere(0.034)
          .at(...c)
          .paintWhere(sdf.sphere(0.01).at(c[0] + 0.013 * side, c[1] + 0.019, c[2] + 0.026), '#ffffff', 0.001);
      };
      k.body('eyes', sdf.union(eye(1), eye(-1)).bone('head'), { color: s.tint.eye, roughness: 0.08, textureDensity: 2, detail: 0.003 });
      // The crest: round soft nubs along the middle of the back, from a larger leaf nub on top of
      // the head, down the back of the head and the neck, and along the body to the tail.
      const nubs: sdf.Shape[] = [];
      const C: [number, number, number] = [0, HEAD_C[1], HEAD_C[2]];
      [8, 36, 62, 88, 112].forEach((deg, i) => {
        const a = (deg * Math.PI) / 180;
        const dir: [number, number, number] = [0, Math.cos(a), -Math.sin(a)];
        const hit = sdf.raycast(head, [C[0] + dir[0], C[1] + dir[1], C[2] + dir[2]], [-dir[0], -dir[1], -dir[2]]);
        if (!hit) return;
        const h = i === 0 ? 0.05 : 0.034 - i * 0.003;
        const lean = a + 0.5; // each nub leans a little back
        const tip: [number, number, number] = [hit[0], hit[1] + Math.cos(lean) * h, hit[2] - Math.sin(lean) * h];
        nubs.push(sdf.cone([hit[0], hit[1] - dir[1] * 0.01, hit[2] - dir[2] * 0.01], tip, i === 0 ? 0.026 : 0.022, i === 0 ? 0.019 : 0.015).bone('head'));
      });
      const N = 13;
      for (let i = 0; i < N; i++) {
        const t = 0.1 + (0.66 * i) / (N - 1);
        const f = s.frame(t);
        const back: [number, number, number] = [-f.belly[0], -f.belly[1], -f.belly[2]];
        const base: [number, number, number] = [f.p[0] + back[0] * f.r * 0.7, f.p[1] + back[1] * f.r * 0.7, f.p[2] + back[2] * f.r * 0.7];
        const h = 0.022 + 0.014 * Math.sin(Math.PI * t);
        const tip: [number, number, number] = [base[0] + back[0] * h - f.dir[0] * h * 0.4, base[1] + back[1] * h - f.dir[1] * h * 0.4, base[2] + back[2] * h - f.dir[2] * h * 0.4];
        nubs.push(sdf.cone(base, tip, 0.018 + 0.006 * Math.sin(Math.PI * t), 0.012).bone(f.bone));
      }
      k.body('crest', sdf.union(...nubs), { color: s.tone('body', '#96d290'), roughness: 0.5, detail: 0.003 });
    },
    // The walk: a clear wave that runs along the whole coil to the tail tip.
    pose(clip, p) {
      if (clip !== 'walk') return {};
      const w = (o: number) => motion.wave(p, 1, o);
      return {
        root: { rotate: [0, 10 * w(0.5), 0] },
        tail1: { rotate: [0, 16 * w(0.6), 0] },
        tail2: { rotate: [0, 20 * w(0.72), 0] },
        tail3: { rotate: [0, 24 * w(0.84), 0] },
        tail4: { rotate: [0, 26 * w(0.96), 0] },
        spine1: { rotate: [0, 8 * w(0.38), 0] },
      };
    },
  }),
  0.75,
);
