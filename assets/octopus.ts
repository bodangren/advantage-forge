import { mixRgb, profile, rgb, sdf } from '../src/index.js';
import { octopusAsset } from './parts/octopus-kind.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Octopus — Chibi Quest wildlife (catalog `wildlife/water/octopus`), a small purple octopus about
 * 0.4 m tall, faces +Z. Target: docs/wildlife-mockups/octopus_001.jpg (made with mmx).
 *
 * The octopus of `assets/parts/octopus-kind.ts` (head dome, tentacles on their own bones, face, rig,
 * and clips, as the kraken of `assets/kraken.ts`) at 0.6 of its size: one purple color for the head
 * and the arms, a few darker spots on the dome, big glossy eyes, pink cheeks, a small smile, and
 * eight short tentacles that lie on the ground and curl up at the tips, with pale suckers.
 * Role: ambient life in harbors, tide pools, and the sea games; the round dome and the curled arms
 *   read at 128 px. The kraken stays the monster of the kind.
 * Palette (60/30/10): purple #9a6ac8 head and arms; darker spots; pale suckers; pink cheeks and dark
 *   eyes as the accent.
 */
// Each tentacle leaves the base, lies on the ground with an even taper, and ends where its tip
// curls up; the spiral of the tip is built in `extra` on the tip bone.
const ground = (u: number, up: number, r: number): [number, number, number][] => [
  [0.07, 0.18, r],
  [0.15, 0.095, r * 0.88],
  [0.225 * u, 0.062, r * 0.76],
  [0.29 * u, 0.058 + up * 0.3, r * 0.64],
  [0.335 * u, 0.064 + up * 0.5, r * 0.55],
];
const HEAD_Y = 0.345;
const ARM_DARK = '#7a52b4';

export default scaleAsset(
  octopusAsset({
    name: 'octopus',
    description: 'Chibi octopus: a small round pale lilac octopus with very big glossy dark eyes low on the head, pink cheeks, a small smile, small raised bumps on its dome, and eight short tentacles that hug the ground and curl up at the tips, with pale suckers; octopus rig.',
    reference: 'docs/wildlife-mockups/octopus_001.jpg',
    variants: {
      body: { violet: '#a27cd6', lilac: '#c4a8e0', purple: '#9a6ac8', red: '#d8584a', orange: '#e8883a', blue: '#4a8ad0' },
      eyes: { black: '#141018', brown: '#3a2416' },
    },
    presets: {
      purple: { body: 'purple', eyes: 'black' },
      red: { body: 'red', eyes: 'black' },
      orange: { body: 'orange', eyes: 'brown' },
      blue: { body: 'blue', eyes: 'black' },
    },
    head: { at: [0, HEAD_Y, 0], r: [0.235, 0.215, 0.225] },
    base: [0, 0.19, 0],
    tentacles: [22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map((angle, i) => ({
      angle,
      points: ground(Math.abs(Math.cos((angle * Math.PI) / 180)) > 0.9 ? 0.88 : 1, 0.02 * (i % 2), 0.066),
    })),
    eyes: { r: 0.058, x: 0.42, y: -0.24 },
    bumps: true,
    // The kind's smile sits at eye level for these low eyes; it is made too thin to show, and the
    // smile is painted lower in `paint`.
    smile: { r: 0.05, width: 0.0001 },
    grounded: true,
    suckers: true,
    colors: { mouth: '#3a1424' },
    paint(skin, o) {
      const [hx, hy, hz] = [0, HEAD_Y, 0];
      // The arms and the base of the dome a darker violet, blending up into the dome color.
      const dark = rgb(o.tone('body', ARM_DARK, 1));
      const shaded = skin.paintFn((_x, y, _z, base) => (y > 0.2 ? base : mixRgb(base, dark, Math.min(1, (0.2 - y) / 0.1) * 0.85)));
      // Pink cheeks beside and under the big eyes.
      const cheeks = sdf.union(
        sdf.capsule([hx + 0.155, hy - 0.1, hz], [hx + 0.155, hy - 0.1, hz + 0.5], 0.03),
        sdf.capsule([hx - 0.155, hy - 0.1, hz], [hx - 0.155, hy - 0.1, hz + 0.5], 0.03),
      );
      const smile = sdf.extrude(profile.arc(0.048, 0.012, 228, 312), 0.5).at(hx, hy - 0.112 + 0.048, hz + 0.2);
      return shaded.paintWhere(cheeks.intersect(sdf.halfSpace([0, -1, 0], -0.2)), o.tone('body', '#f07aa0', 0.4), 0.008).paintWhere(smile, '#3a1424', 0.003);
    },
    extra(k, o) {
      // The tip of each arm curls up and back over itself in a neat spiral (a smooth chain of many
      // small points in the arm's own upright plane), on the tip bone.
      const tips = o.arms.map((a) => {
        const [tx, ty, tz] = a.tip;
        const l = Math.hypot(tx, tz) || 1;
        const out = [tx / l, tz / l];
        const R0 = 0.034;
        const r0 = 0.066 * 0.55;
        const N = 11;
        const pts: [number, number, number, number][] = [];
        for (let i = 0; i < N; i++) {
          const t = i / (N - 1);
          const th = ((-90 + 300 * t) * Math.PI) / 180;
          const rs = R0 * (1 - 0.55 * t);
          const du = Math.cos(th) * rs;
          const dv = R0 + Math.sin(th) * rs;
          pts.push([tx + out[0]! * du, ty + dv, tz + out[1]! * du, r0 * (1 - 0.62 * t)]);
        }
        return sdf.chain(pts, 0.006).bone(a.tipBone);
      });
      k.body('arm-tips', sdf.union(...tips), { color: o.tone('body', ARM_DARK, 1), roughness: 0.5, detail: 0.003 });
    },
  }),
  0.6,
);
