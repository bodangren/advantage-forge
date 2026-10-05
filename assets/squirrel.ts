import { motion, noise, sdf } from '../src/index.js';
import { scaleAsset } from './parts/scale-asset.js';
import { wolfAsset } from './parts/wolf-kind.js';

/**
 * Squirrel — Chibi Quest wildlife (catalog `wildlife/forest/squirrel`), a red squirrel about 0.4 m
 * tall to the top of its tail, faces +Z. Target: docs/wildlife-mockups/squirrel_001.jpg (made with
 * mmx).
 *
 * The four-legged body of the wolf kind (`assets/parts/wolf-kind.ts`: a big round head on a low
 * horizontal body, rig, and walk and run clips) at 0.5 of the dire wolf's size, as a red squirrel
 * on the run: red-orange fur with cream lips, cheeks, chest, and belly, big round haunches on
 * short legs, small pointed ears with soft fans of fur at the tips, big glossy dark brown eyes
 * with big round highlights, a short narrow pointed orange snout with a small black nose and a
 * small smile, and a big round plume of a tail that rises behind the back (on the tail bone,
 * with a gap to the head).
 * Role: a forest and park animal; the big round tail reads at 128 px.
 * Palette (60/30/10): red-orange #d06a2a fur and tail; cream #f4e2c4 muzzle, chest, and belly;
 *   dark brown eyes as the accent.
 */

const EAR_SCALE = 0.85;
// The kind's ear frame (see `earPose` in the wolf kind), so the tufts sit on the ear tips.
const earPose = (s: sdf.Shape) => s.scale(EAR_SCALE).rotateZ(-14).rotateX(-6).at(0.105, 0.62, 0.14);

export default scaleAsset(
  wolfAsset({
    name: 'squirrel',
    description: 'Chibi squirrel: a red squirrel on four legs with a big round head, a cream muzzle, cheeks, chest, and belly, big round haunches, small pointed ears with soft fur tufts, big dark glossy eyes, a small black nose and smile, and a big round plume of a tail behind its back; quadruped rig with walk and run.',
    reference: 'docs/wildlife-mockups/squirrel_001.jpg',
    variants: {
      fur: { red: '#d06a2a', grey: '#8a8680', brown: '#8a5a36', black: '#3a3432' },
      markings: { cream: '#f4e2c4', white: '#f6f4f0' },
      eyes: { brown: '#7a4a24', dark: '#3a2214' },
    },
    presets: {
      grey: { fur: 'grey', markings: 'white', eyes: 'brown' },
      brown: { fur: 'brown', markings: 'cream', eyes: 'dark' },
      black: { fur: 'black', markings: 'white', eyes: 'dark' },
    },
    // The lower legs keep the fur color (no dark socks); the lower cheeks and the chest are cream.
    colors: { furLight: '#f4e2c4', furDark: '#d06a2a', earInner: '#f4d6b8', eyeRim: '#24160c', nose: '#1a1214', pupil: '#0e0a08' },
    earScale: EAR_SCALE,
    eyeScale: 1.55,
    pupilScale: 1.25,
    smileArc: [252, 288],
    headScale: 1.18,
    furBump: 0,
    snout: 0.03,
    muzzleWidth: 0.62,
    cheekCream: false,
    noseScale: 0.55,
    brows: false,
    forelock: false,
    smile: true,
    cheekTufts: false,
    ruff: 'smooth',
    claws: false,
    tail: false,
    legLength: -0.03,
    fangs: false,
    teeth: false,
    // The top of the snout keeps the fur color; the lips and the chin are cream.
    paintMuzzle: (m, t) => m.paintWhere(sdf.halfSpace([0, -1, 0], -0.425), t.fur, 0.01),
    paint(fur, t) {
      // Big round haunches on the hind legs, and the cream belly between the legs.
      const haunch = sdf.ellipsoid([0.1, 0.14, 0.15]).rotateX(-12).at(0.09, 0.25, -0.2).bone('bleg.L').mirror('x');
      // The front legs keep the fur color below the cream chest.
      const frontLeg = sdf.capsule([0.1, 0.17, 0.08], [0.105, 0.0, 0.09], 0.062).mirror('x');
      return fur
        .smoothUnion(0.035, haunch)
        .paintWhere(sdf.ellipsoid([0.075, 0.06, 0.22]).at(0, 0.15, -0.05), t.markings, 0.008)
        .paintWhere(frontLeg, t.fur, 0.02);
    },
    extra(k, w) {
      // Soft flames of fur at the ear tips: seven tapered strands that grow close together from the
      // upper ear and rise to a frayed point, built in the ear's own frame (the ear tip is at y = 0.17)
      // and posed like the kind's ears, a little darker than the fur.
      const strand = (bx: number, by: number, tx: number, ty: number, r: number) =>
        sdf.chain([[bx, by, 0, r], [(bx + tx) / 2 + (tx - bx) * 0.25, (by + ty) / 2, -0.004, r * 0.7], [tx, ty, -0.01, 0.003]], 0.01).scale([1, 1, 0.55]);
      const fan = sdf.smoothUnion(
        0.008,
        strand(-0.03, 0.06, -0.05, 0.16, 0.016),
        strand(-0.02, 0.08, -0.036, 0.21, 0.016),
        strand(-0.01, 0.09, -0.016, 0.24, 0.016),
        strand(0, 0.1, 0.002, 0.265, 0.016),
        strand(0.01, 0.09, 0.022, 0.235, 0.016),
        strand(0.02, 0.08, 0.04, 0.2, 0.015),
        strand(0.03, 0.06, 0.054, 0.15, 0.014),
      );
      k.body('ear-tufts', earPose(fan).mirror('x').bone('head'), { color: w.tone('fur', '#c45a22', 0.9), roughness: 0.85, detail: 0.003 });
      // The tail: a round plume of fur locks that rises from the rump behind the back and curls
      // forward at the top, with a gap to the head. Each lock follows the tail's path, offset round
      // it, so soft grooves run between the locks. The plume is darker red at the base and in the
      // grooves, lighter at the outer edges.
      const KEY: [number, number, number, number][] = [
        [0, 0.3, -0.29, 0.06],
        [0, 0.36, -0.43, 0.13],
        [0, 0.49, -0.57, 0.19],
        [0, 0.67, -0.62, 0.23],
        [0, 0.83, -0.53, 0.2],
        [0, 0.86, -0.38, 0.14],
        [0, 0.78, -0.31, 0.08],
      ];
      // A smooth path through the key points (Catmull-Rom, two samples per span), so the plume
      // outline is round and not a polygon.
      type P4 = [number, number, number, number];
      const P: P4[] = [];
      for (let i = 0; i + 1 < KEY.length; i++) {
        const [a, b, c, d] = [KEY[Math.max(0, i - 1)]!, KEY[i]!, KEY[i + 1]!, KEY[Math.min(KEY.length - 1, i + 2)]!];
        for (let j = 0; j < 2; j++) {
          const t = j / 2;
          const t2 = t * t;
          const t3 = t2 * t;
          P.push(b.map((_, m) => 0.5 * (2 * b[m]! + (-a[m]! + c[m]!) * t + (2 * a[m]! - 5 * b[m]! + 4 * c[m]! - d[m]!) * t2 + (-a[m]! + 3 * b[m]! - 3 * c[m]! + d[m]!) * t3)) as P4);
        }
      }
      P.push(KEY[KEY.length - 1]!);
      const core = sdf.chain(P.map((p) => [p[0], p[1], p[2], p[3] * 0.66] as P4), 0.04);
      const N = 9;
      const locks = Array.from({ length: N }, (_, j) => {
        const pts = P.map((p, i) => {
          const th = (j / N) * 2 * Math.PI + 0.3 + 0.1 * i; // the locks twist a little along the tail
          const a = P[Math.max(0, i - 1)]!;
          const b = P[Math.min(P.length - 1, i + 1)]!;
          const ty = b[1] - a[1];
          const tz = b[2] - a[2];
          const tl = Math.hypot(ty, tz) || 1;
          const off = p[3] * (0.6 + 0.06 * noise.random(j, i >> 1, 5));
          return [p[0] + Math.cos(th) * off * 0.85, p[1] - (tz / tl) * Math.sin(th) * off, p[2] + (ty / tl) * Math.sin(th) * off, p[3] * (0.36 + 0.04 * noise.random(j, i >> 1, 9))] as P4;
        });
        return sdf.chain(pts, 0.025);
      });
      const dark = w.tone('fur', '#a8441a', 0.9);
      const plume = sdf
        // A round fill inside the curl, so the plume reads as one full ball from the side.
        .smoothUnion(0.007, core, ...locks, sdf.ellipsoid([0.14, 0.19, 0.19]).at(0, 0.63, -0.46))
        .paintWhere(core.round(0.035), dark, 0.03)
        .paintWhere(sdf.sphere(0.16).at(0, 0.32, -0.32), dark, 0.06);
      // Big round highlights on the eyes (upper outer side of each eye).
      const e = w.eye;
      const shine = sdf.sphere(0.016).scale([1, 1, 0.3]).at(e[0] + 0.016, e[1] + 0.02, e[2] - 0.004).mirror('x');
      k.body('eye-shine', shine.bone('head'), { color: '#ffffff', roughness: 0.1, detail: 0.002 });
      k.body('tail-fur', plume.bone('tail'), { color: w.tone('fur', '#e0823c', 1), roughness: 0.85, detail: 0.005 });
    },
    // The run is a bound: in the air the body stretches, the hind legs reach back, and the front
    // paws fold up to the chest; on landing the front paws reach down and the hind legs swing
    // forward under the body.
    pose(clip, p) {
      if (clip !== 'run') return {};
      const a = motion.wave(p);
      const air = Math.max(0, a);
      const land = Math.max(0, -a);
      const front = { rotate: [-65 * air + 18 * land, 0, 0] as const };
      const frontShin = { rotate: [110 * air - 8 * land, 0, 0] as const };
      const hind = { rotate: [62 * air - 45 * land, 0, 0] as const };
      const hindShin = { rotate: [-22 * air + 34 * land, 0, 0] as const };
      return {
        hips: { move: [0, 0.11 * air, 0] as const, rotate: [0, 0, 0] as const },
        spine: { rotate: [-10 * a, 0, 0] as const },
        head: { rotate: [4 * a, 0, 0] as const },
        tail: { rotate: [14 * a, 0, 0] as const },
        'fleg.L': front,
        'fleg.R': front,
        'fshin.L': frontShin,
        'fshin.R': frontShin,
        'bleg.L': hind,
        'bleg.R': hind,
        'bshin.L': hindShin,
        'bshin.R': hindShin,
      };
    },
  }),
  0.5,
);
