import { noise, profile, sdf } from '../src/index.js';
import { deerAsset } from './parts/deer-kind.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Moose — Chibi Quest wildlife (catalog `wildlife/land/moose`), about 1.25 m to the top of the head
 * (1.45 m to the antler tips), faces +Z. Target: docs/wildlife-mockups/moose_001.jpg (made with
 * mmx from the deer mockup).
 *
 * The deer of `assets/deer.ts` (body, head, rig, and clips from `assets/parts/deer-kind.ts`) at
 * 1.4 of its size, as a moose: wide flat palm antlers with points along the top edge, a big
 * droopy lighter snout with dark nostrils, a beard bell under the chin, a tuft on the crown, a
 * hump over the shoulders, a dark brown coat, and pale stockings over black hooves; no fawn spots,
 * bib, or eye patches.
 * Role: big, slow marsh and forest wildlife; the palm antlers and the long snout read at 128 px.
 * Palette (60/30/10): dark brown coat #4a3426; a lighter snout #7a5a40 and pale stockings #d8c8a8;
 *   brown antlers #8a6448; black eyes and hooves.
 */

// The palm: a broad paddle in the XY plane (x out from the head, y up), points along the top edge.
const PALM = profile.polygon(
  [
    [0, -0.02], [0.06, -0.035], [0.17, -0.045], [0.26, -0.01], [0.3, 0.05], [0.285, 0.1], [0.265, 0.075],
    [0.245, 0.13], [0.22, 0.095], [0.19, 0.15], [0.165, 0.1], [0.135, 0.14], [0.11, 0.085], [0.07, 0.07], [0, 0.03],
  ],
  { smooth: true },
);
const palmPose = (s: sdf.Shape) => s.rotateZ(16).rotateY(-12).at(0.07, 0.84, 0.12);
const PALM_TIPS: [number, number, number][] = (
  [[0.3, 0.05], [0.245, 0.13], [0.19, 0.15], [0.135, 0.14]] as const
).map(([x, y]) => {
  const a = (16 * Math.PI) / 180;
  const b = (-12 * Math.PI) / 180;
  const [x1, y1] = [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
  return [0.07 + x1 * Math.cos(b), 0.84 + y1, 0.12 - x1 * Math.sin(b)];
});

export default scaleAsset(
  deerAsset({
    name: 'moose',
    description: 'Chibi moose: a big round head with glossy eyes, wide flat palm antlers, a big droopy snout, a beard bell, a shoulder hump, a dark brown coat, and pale stockings over black hooves; quadruped rig.',
    reference: 'docs/wildlife-mockups/moose_001.jpg',
    variants: {
      fur: { dark: '#4a3426', brown: '#6a4630', black: '#2e2420' },
      eyes: { dark: '#2a1a12', brown: '#5a3418' },
      antlers: { brown: '#8a6448', pale: '#c8b090', dark: '#5e4430' },
    },
    presets: {
      brown: { fur: 'brown', eyes: 'brown', antlers: 'pale' },
      black: { fur: 'black', eyes: 'dark', antlers: 'dark' },
    },
    colors: { earInner: '#8a6a50', cream: '#7a5e48', hoof: '#1e1a18' },
    mask: false,
    spots: false,
    bib: false,
    antlers: false,
    headProbes: [...PALM_TIPS, ...PALM_TIPS.map(([x, y, z]) => [-x, y, z] as const), [0, 0.47, 0.24], [0, 0.6, 0.42]],
    paint(fur, deer) {
      // Pale stockings, and a dark tail (no white flag).
      return fur
        .paintWhere(sdf.box([0.6, 0.2, 0.8]).at(0, 0.09, -0.06), deer.tone('fur', '#d8c8a8', 0.2), 0.02)
        .paintWhere(sdf.sphere(0.08).at(0, 0.51, -0.325), deer.tint.fur, 0.01);
    },
    extra(k, deer) {
      const tone = (c: string, f = 0.8) => deer.tone('fur', c, f);
      // The palms on a short beam from the crown.
      const palm = palmPose(sdf.extrude(PALM, 0.022, 0.01)).smoothUnion(0.015, sdf.capsule([0.04, 0.82, 0.125], [0.1, 0.86, 0.12], 0.026));
      k.body('antlers', palm.mirror('x'), { color: k.tint('antlers'), roughness: 0.7, detail: 0.004, bone: 'head' });
      // The snout: a long droopy nose over the muzzle, with nostrils and a mouth line.
      const snout = sdf.smoothUnion(0.03, sdf.ellipsoid([0.115, 0.095, 0.11]).at(0, 0.6, 0.315), sdf.ellipsoid([0.1, 0.08, 0.07]).at(0, 0.585, 0.39));
      const nh = sdf.raycast(snout, [0.045, 0.615, 2], [0, 0, -1])!;
      const nostrils = sdf.ellipsoid([0.016, 0.022, 0.03]).rotateZ(-25).at(nh[0], nh[1], nh[2]).mirror('x');
      const mouth = sdf.extrude(profile.arc(0.06, 0.007, 235, 305), 0.3).at(0, 0.6, 0.42);
      k.body('snout', snout.smoothSubtract(0.006, nostrils).paintWhere(nostrils.round(0.006), '#241a14', 0.004).paintWhere(mouth, '#2e2018', 0.002), {
        color: tone('#7a5a40'),
        roughness: 0.75,
        detail: 0.004,
        textureDensity: 1.6,
        bone: 'head',
      });
      // The bell under the chin, the crown tuft, and the hump over the shoulders.
      const hair = (s: sdf.Shape) => s.displace(0.004, (x, y, z) => noise.fbm(x * 60, y * 30, z * 60, 2));
      const bell = hair(sdf.chain([[0, 0.56, 0.21, 0.03], [0, 0.51, 0.225, 0.026], [0, 0.46, 0.23, 0.02]], 0.015));
      const tuft = hair(sdf.union(...[-1, 0, 1].map((i) => sdf.cone([0.025 * i, 0.85, 0.15], [0.04 * i, 0.92, 0.17], 0.022, 0.006))));
      k.body('beard', sdf.union(bell, tuft), { color: tone('#2a1e18', 0.6), roughness: 0.9, detail: 0.004, bone: 'head' });
      k.body('hump', sdf.ellipsoid([0.085, 0.07, 0.11]).at(0, 0.455, 0.02), { color: deer.tint.fur, roughness: 0.85, detail: 0.005, bone: 'spine' });
    },
  }),
  1.4,
);
