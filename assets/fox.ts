import { noise, sdf } from '../src/index.js';
import { scaleAsset } from './parts/scale-asset.js';
import { wolfAsset } from './parts/wolf-kind.js';

/**
 * Fox — Chibi Quest wildlife (catalog `wildlife/land/fox`), about 0.6 m to the ear tips, faces +Z.
 * Target: docs/wildlife-mockups/fox_001.jpg (made with mmx).
 *
 * The dire wolf (`assets/dire-wolf.ts`; body, head, rig, and clips from `assets/parts/wolf-kind.ts`)
 * at 0.75 of its size, as a red fox: large ears with black backs and tips, soft round white cheek
 * fluff, a white muzzle and smooth chest, big auburn eyes with lashes, a small mouth, black socks,
 * and a very big fluffy tail that curls round its left side, with a white tip, on the tail bone
 * (the kind's own tail is off).
 * Role: a clever forest animal for ambient life and the nature games; the orange coat, the black
 *   ears and socks, and the big tail read at 128 px.
 * Palette (60/30/10): orange #ec7428; white #fff6ec (muzzle, cheeks, chest, tail tip); black
 *   #2a1e1a ear backs and socks; big auburn eyes.
 */

export default scaleAsset(
  wolfAsset({
    name: 'fox',
    description: 'Chibi fox: an orange fox with a big round head, large black-backed ears, soft round white cheek fluff, a white muzzle and chest, big auburn eyes with lashes, a small mouth, black socks, and a very big fluffy tail that curls round its side with a white tip; quadruped rig.',
    reference: 'docs/wildlife-mockups/fox_001.jpg',
    // The mockup sits: the rest pose stands (for the walk), and the `sit` clip holds the sitting pose.
    sit: true,
    variants: {
      fur: { orange: '#ec7428', red: '#c8502a', silver: '#9a9aa2', arctic: '#f0f0ec' },
      markings: { white: '#fff6ec', cream: '#f4e4c8' },
      eyes: { auburn: '#7a2c1a', brown: '#3a2010', gold: '#8a6a18' },
    },
    presets: {
      red: { fur: 'red', markings: 'cream', eyes: 'brown' },
      silver: { fur: 'silver', markings: 'white', eyes: 'gold' },
      arctic: { fur: 'arctic', markings: 'white', eyes: 'auburn' },
    },
    colors: { furLight: '#fff6ec', furDark: '#2a1e1a', earInner: '#fff0e4', eyeRim: '#1a100a', nose: '#1a1214', claw: '#2a1e1a' },
    headScale: 1.35,
    earScale: 1.25,
    eyeScale: 1.45,
    noseScale: 0.62,
    fangs: false,
    teeth: false,
    pupilScale: 1.3,
    cheekTufts: false,
    smileArc: [263, 277],
    snout: 0.02,
    brows: false,
    forelock: false,
    smile: true,
    ruff: 'smooth',
    tail: false,
    paint(fur, t, tone) {
      // Black ear tips (front and back) and black ear backs behind the ear plane (which leans back
      // 6 degrees); the cream insides and the orange rims stay. Black socks.
      const n = Math.hypot(0.105, 1);
      const backs = sdf.halfSpace([0, -1, 0], -0.64).intersect(sdf.halfSpace([0, 0.105 / n, 1 / n], (0.125 + 0.105 * 0.62) / n));
      // The cream inside of each ear: the kind's ear hollow (as the kind poses the ear), grown a little.
      const hollow = sdf
        .cone([0, 0.02, 0.02], [0, 0.15, 0.02], 0.05, 0.004)
        .scale([1, 1, 0.55])
        .round(0.006)
        .scale(1.25)
        .rotateZ(-14)
        .rotateX(-6)
        .at(0.105, 0.62, 0.14)
        .mirror('x');
      return fur
        .paintWhere(backs, t.furDark, 0.008)
        .paintWhere(hollow, tone('markings', '#fff0e4', 0.5), 0.004)
        .paintWhere(sdf.halfSpace([0, -1, 0], -0.775), t.furDark, 0.012)
        .paintWhere(sdf.ellipsoid([0.1, 0.085, 0.09]).at(0.22, 0.45, 0.2).mirror('x'), t.markings, 0.015)
        .paintWhere(sdf.halfSpace([0, 1, 0], 0.1), t.furDark, 0.02);
    },
    extra(k, w) {
      // The very big fluffy tail: thick from the rump, it sweeps back and round the fox's left side
      // and curls forward along the body, with a white tip near the front leg.
      const TIP: [number, number, number] = [0.22, 0.36, 0.02];
      const tail = sdf
        .chain(
          [
            [0, 0.31, -0.28, 0.05],
            [0.08, 0.3, -0.4, 0.11],
            [0.21, 0.32, -0.36, 0.14],
            [0.28, 0.35, -0.2, 0.13],
            [0.27, 0.37, -0.06, 0.09],
            [TIP[0], TIP[1], TIP[2], 0.035],
          ],
          0.04,
        )
        .paintWhere(sdf.sphere(0.1).at(TIP[0] + 0.03, TIP[1], TIP[2] + 0.02), w.tint.markings, 0.045)
        .bone('tail');
      const fur = (x: number, y: number, z: number) => 0.0008 * noise.fbm(x * 60, y * 25, z * 60, 2);
      k.body('tail-fur', tail, { color: w.tint.fur, roughness: 0.85, bump: fur });
      // Soft white fluff on the cheeks: a flare out to each side of the face below the eyes, with a
      // rounded tip.
      // Built about its own height and flattened there, so it stays at the mouth line.
      // Two soft points on each side (a long one out and a short one out and down), from wide roots
      // inside the face, so the fluff blends into the cream cheeks.
      const fluff = sdf
        .smoothUnion(
          0.035,
          sdf.chain([[0.07, 0.01, 0.2, 0.08], [0.17, 0.0, 0.18, 0.068], [0.27, -0.012, 0.13, 0.024]], 0.035),
          sdf.chain([[0.1, -0.02, 0.19, 0.06], [0.19, -0.06, 0.15, 0.04], [0.23, -0.095, 0.11, 0.014]], 0.03),
        )
        .scale([1, 0.85, 1])
        .at(0, 0.45, 0)
        .mirror('x');
      k.body('cheek-fluff', fluff.bone('head'), { color: w.tint.markings, roughness: 0.9, bump: fur });
      // Three short dark lashes at the outer top corner of each eye.
      const e = w.eye;
      const lashes = sdf
        .union(
          ...[0, 1, 2].map((i) => {
            const a = ((25 + i * 22) * Math.PI) / 180;
            const r = 0.048;
            const base: [number, number, number] = [e[0] + Math.cos(a) * r * 0.95, e[1] + Math.sin(a) * r * 0.95, e[2] - 0.004];
            return sdf.cone(base, [base[0] + Math.cos(a) * 0.022, base[1] + Math.sin(a) * 0.022, base[2] - 0.004], 0.005, 0.0015);
          }),
        )
        .mirror('x');
      k.body('lashes', lashes.bone('head'), { color: '#1a100a', roughness: 0.6, detail: 0.002 });
    },
  }),
  0.75,
);
