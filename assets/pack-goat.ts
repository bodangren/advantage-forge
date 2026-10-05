import { noise, profile, sdf } from '../src/index.js';
import { deerAsset } from './parts/deer-kind.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Pack goat — Chibi Quest wildlife (catalog `wildlife/mounts-and-pets/pack-goat`), about 0.9 m to
 * the top of the horns, faces +Z. Target: docs/wildlife-mockups/pack-goat_001.jpg (made with mmx).
 *
 * The deer of `assets/deer.ts` (body, head, rig, and clips from `assets/parts/deer-kind.ts`) at
 * 0.95 of its size, as a mountain pack goat: a long goat face (the kind's `muzzle`) with a smile
 * and white eyes, big ridged horns that curl back, down, and forward, a long grey beard, ears held
 * out to the sides, a long low grey body (`bodyLength`), a soft grey mane and a hairy tail, and a
 * red harness with two soft leather bags on each side (a flap, a red tab, and a brass ring); no fawn
 * spots, bib, eye patches, or antlers.
 * Role: the traveller's pack animal on mountain paths; the curled horns and the bags read at
 *   128 px.
 * Palette (60/30/10): grey coat #807b75; tan horns #c8a87a; leather bags #d0a050; a red harness
 *   #b0403a as the accent; black hooves.
 */

export default scaleAsset(
  deerAsset({
    name: 'pack-goat',
    description: 'Chibi pack goat: a big head with a long goat face, a smile, big white eyes, big curled ridged horns, a long grey beard, ears held out to the sides, a long low grey body with a soft mane and a hairy tail, and a red harness with four soft leather saddlebags with flaps and brass rings; quadruped rig.',
    reference: 'docs/wildlife-mockups/pack-goat_001.jpg',
    variants: {
      fur: { grey: '#807b75', brown: '#8a6a4c', white: '#e8e0d0', black: '#3e3834' },
      eyes: { dark: '#2a1a12', brown: '#5a3418', amber: '#a87a2a' },
      pad: { red: '#b0403a', blue: '#4a6aa0', green: '#5a8a4a' },
    },
    presets: {
      brown: { fur: 'brown', eyes: 'amber', pad: 'green' },
      white: { fur: 'white', eyes: 'brown', pad: 'blue' },
      black: { fur: 'black', eyes: 'amber', pad: 'red' },
    },
    colors: { cream: '#b0aaa0', earInner: '#5e5854', nose: '#2a2624', mouth: '#3a2e28', hoof: '#221c1a', pupil: '#120c0a' },
    mask: false,
    bib: false,
    spots: false,
    antlers: false,
    tail: 'puff',
    eyeStyle: 'white',
    eyeScale: 1.12,
    pupil: 1.4,
    muzzle: { length: 0.065, drop: 0.04, width: 0.84 },
    slim: 1.2,
    legThick: 1.25,
    legLength: -0.07,
    bodyLength: 0.12,
    smile: false,
    earTilt: -106,
    earTurn: 24,
    bulk: 0.05,
    headProbes: [[0.088, 1.065, 0.035], [-0.088, 1.065, 0.035], [0.115, 1.05, -0.05], [-0.115, 1.05, -0.05], [0.14, 0.95, -0.115], [-0.14, 0.95, -0.115], [0, 0.4, 0.34]],
    paint(fur, deer) {
      // A wide smile under the nose that wraps onto the sides of the long muzzle.
      const M = deer.joints.MUZZLE_C;
      return fur.paintWhere(sdf.extrude(profile.arc(0.05, 0.007, 214, 326), 0.12).at(0, M[1] + 0.02, M[2] + 0.04), '#3a2e28', 0.002);
    },
    extra(k, deer) {
      // Horns: thick ridged curls that rise from the crown, sweep back over the head, and hook
      // down and forward at the tip.
      const pts: [number, number, number, number][] = [
        [0.045, 0.83, 0.12, 0.04],
        [0.062, 0.95, 0.1, 0.038],
        [0.088, 1.03, 0.035, 0.034],
        [0.115, 1.02, -0.05, 0.029],
        [0.135, 0.95, -0.09, 0.024],
        [0.142, 0.88, -0.07, 0.018],
        [0.138, 0.865, -0.02, 0.012],
      ];
      // Each ridge is a ring at an equal length along the horn.
      const cum = [0];
      for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1]! + Math.hypot(pts[i]![0] - pts[i - 1]![0], pts[i]![1] - pts[i - 1]![1], pts[i]![2] - pts[i - 1]![2]));
      const along = (x: number, y: number, z: number) => {
        let best = Infinity;
        let at = 0;
        for (let i = 1; i < pts.length; i++) {
          const a = pts[i - 1]!;
          const b = pts[i]!;
          const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
          const l2 = d[0]! * d[0]! + d[1]! * d[1]! + d[2]! * d[2]!;
          const t = Math.min(1, Math.max(0, ((x - a[0]) * d[0]! + (y - a[1]) * d[1]! + (z - a[2]) * d[2]!) / l2));
          const q = [a[0] + d[0]! * t, a[1] + d[1]! * t, a[2] + d[2]! * t];
          const e = Math.hypot(x - q[0]!, y - q[1]!, z - q[2]!);
          if (e < best) {
            best = e;
            at = cum[i - 1]! + t * (cum[i]! - cum[i - 1]!);
          }
        }
        return at;
      };
      const horn = sdf
        .chain(pts, 0.015)
        .displace(-0.0025, (x, y, z) => Math.max(0, Math.cos((along(Math.abs(x), y, z) / 0.026) * 2 * Math.PI)) ** 3)
        .paintFn((x, y, z, c) => {
          const s = 0.88 + 0.12 * Math.cos((along(Math.abs(x), y, z) / 0.026) * 2 * Math.PI);
          return [c[0] * s, c[1] * s, c[2] * s];
        });
      k.body('horns', horn.mirror('x'), { color: '#c8a87a', roughness: 0.5, detail: 0.003, bone: 'head' });
      const hair = (s: sdf.Shape) => s.displace(0.0035, (x, y, z) => noise.fbm(x * 60, y * 24, z * 60, 2));
      const shagColor = deer.tone('fur', '#8a8580', 1);
      // A long grey beard: three soft locks that hang from under the chin to a point.
      const M = deer.joints.MUZZLE_C;
      const beard = hair(
        sdf.smoothUnion(
          0.014,
          ...[-0.02, 0, 0.02].map((x, i) =>
            sdf.chain([[x * 0.6, M[1] - 0.045, M[2] - 0.02, 0.028], [x, M[1] - 0.1, M[2] - 0.012, 0.024], [x * 0.8, M[1] - 0.17 - (i === 1 ? 0.02 : 0), M[2] - 0.02, 0.008]], 0.012),
          ),
        ),
      );
      k.body('beard', beard, { color: shagColor, roughness: 0.9, detail: 0.003, bone: 'jaw' });
      // A soft mane: a flat crest of wavy hair that lies along the back of the head and the
      // neck down to the shoulders, and a hairy tail that hangs back from the rump.
      const back = sdf.smoothUnion(0.06, deer.trunk, deer.head);
      const crest = [0, 0.2, 0.4, 0.6, 0.8, 1].map((t) => {
        const p = sdf.surfacePoint(back, [0, 0.86 - t * 0.36, 0.06 - t * 0.12 - Math.sin(t * Math.PI) * 0.1], 0.006);
        return [p[0], p[1], p[2], 0.022 + 0.012 * Math.sin(t * Math.PI)] as [number, number, number, number];
      });
      const mane = sdf
        .chain(crest, 0.02)
        .scale([0.62, 1, 1])
        .displace(0.0025, (x, y, z) => Math.sin(y * 55 + z * 30 + Math.abs(x) * 90));
      k.body('mane', hair(mane.bone('neck')), { color: shagColor, roughness: 0.9, detail: 0.003 });
      const tail = sdf.smoothUnion(
        0.012,
        ...[-0.016, 0, 0.016].map((x, i) => sdf.chain([[x * 0.5, 0.47, -0.27, 0.03], [x, 0.44, -0.33, 0.028], [x * 1.4, 0.37 - (i === 1 ? 0.02 : 0), -0.36, 0.01]], 0.012)),
      );
      k.body('tail-hair', hair(tail).bone('tail'), { color: shagColor, roughness: 0.9, detail: 0.004 });
      // The harness: a red pad over the back and straps round the chest and the belly.
      const trunk = deer.trunk;
      const red = k.tint('pad');
      const pad = trunk.round(0.01).smoothIntersect(0.008, sdf.box([0.36, 0.13, 0.19], 0.03).at(0, 0.475, -0.07));
      k.body('pad', pad, { color: red, roughness: 0.8, detail: 0.004 });
      const band = (z: number, bone: string) => trunk.round(0.012).smoothIntersect(0.004, sdf.box([0.6, 0.6, 0.024], 0.006).at(0, 0.4, z)).bone(bone);
      k.body('straps', sdf.union(band(0.07, 'spine'), band(-0.1, 'hips')), { color: k.tint('pad', -0.12), roughness: 0.7, detail: 0.003 });
      // Two soft leather saddlebags on each side: a round pillow bag, a flap over the top that
      // hangs down the outside, a red tab down the middle of the flap, and a brass ring on the tab.
      const bags: sdf.Shape[] = [];
      const flaps: sdf.Shape[] = [];
      const tabs: sdf.Shape[] = [];
      const rings: sdf.Shape[] = [];
      for (const z of [0.0, -0.15]) {
        const side = sdf.raycast(trunk, [1, 0.38, z], [-1, 0, 0])!;
        const bx = side[0] + 0.04;
        const bone = z > -0.07 ? 'spine' : 'hips';
        const bag = sdf.smoothUnion(0.02, sdf.box([0.06, 0.13, 0.12], 0.028), sdf.ellipsoid([0.038, 0.058, 0.054]).at(0.012, -0.012, 0)).at(bx, 0.365, z);
        bags.push(bag.bone(bone));
        flaps.push(bag.round(0.006).smoothIntersect(0.004, sdf.box([0.3, 0.06, 0.3]).at(bx, 0.415, z)).bone(bone));
        const out = sdf.raycast(bag, [1, 0.37, z], [-1, 0, 0])!;
        tabs.push(sdf.box([0.012, 0.055, 0.022], 0.005).at(out[0] + 0.002, 0.39, z).bone(bone));
        rings.push(sdf.torus(0.012, 0.0035).rotateZ(90).at(out[0] + 0.008, 0.362, z).bone(bone));
      }
      k.body('bags', sdf.union(...bags).mirror('x'), { color: '#d0a050', roughness: 0.85, detail: 0.004, bump: (x: number, y: number, z: number) => 0.0004 * noise.fbm(x * 220, y * 220, z * 220, 2) });
      k.body('flaps', sdf.union(...flaps).mirror('x'), { color: '#c08c40', roughness: 0.85, detail: 0.003 });
      k.body('tabs', sdf.union(...tabs).mirror('x'), { color: red, roughness: 0.6, detail: 0.003 });
      k.body('rings', sdf.union(...rings).mirror('x'), { color: '#d8b048', roughness: 0.3, metalness: 0.85, detail: 0.002 });
    },
  }),
  0.95,
);
