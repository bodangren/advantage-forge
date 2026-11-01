import { sdf } from '../src/index.js';
import { AGE5, humanoidAsset } from './parts/humanoid-kind.js';
import { sproutGestures } from './parts/sprout-gestures.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Pat, a five-year-old boy of Chibi Sprouts, the smallest of the children (the kind at 0.96), faces
 * +Z. Target: docs/sprout-mockups/pat.jpg (the cast sheet).
 * Role: a classmate in the kindergarten renders; the teddy bear in his left arm is the focal point.
 * One idea: a small cheerful boy hugging a brown teddy bear. Shape language: round and soft.
 * Palette (60/30/10): green shirt #4f9a4a, brown shorts #8a5a36, black hair #231a17; the bear
 *   (#7a4a2a, light muzzle #d8b88c) and the brown sandals (#7a4a2c) are the accent.
 * Bodies: skin, hair, shirt, shorts and pockets, sandals, teddy (body, muzzle, features).
 * Rig: the humanoid kind with a left-arm `pose` (the arm bent across the chest in every clip); the
 *   teddy is rigid on the chest bone.
 */

const C = { shorts: '#8a5a36', pocket: '#6c4024', sandal: '#7a4a2c', strap: '#6a4024', sole: '#4a2c1c', bear: '#7a4a2a', bearLight: '#d8b88c', dark: '#2a1a12' };

export default scaleAsset(
  humanoidAsset({
    name: 'sprout-pat',
    description: 'Pat, a five-year-old boy: large dark-brown eyes, short black hair, a green T-shirt, brown shorts with pockets, brown sandals, and a small brown teddy bear held in the crook of his left arm.',
    reference: 'docs/sprout-mockups/pat.jpg',
    proportions: { ...AGE5, clips: { ...AGE5.clips, stride: 1.25, lift: 1.2 } },
    sing: true,
    sproutFace: true,
    hair: false,
    undershirt: false,
    pants: false,
    shoes: false,
    // Both arms hug the bear at the chest: the elbows out and low, the fists in front, the bear between them.
    hold: { elbow: [0.15, 0.3, 0.06], wrist: [0.07, 0.3, 0.13] },
    variants: {
      skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
      hair: { black: '#231a17', brown: '#5a301d', auburn: '#8e3b1c', blond: '#c4974a' },
      eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a' },
      cloth: { green: '#4f9a4a', forest: '#3f8a58', lime: '#7aa83c', teal: '#3f9a7a' },
    },
    presets: {
      pat: { skin: 'fair', hair: 'black', eyes: 'brown', cloth: 'green' },
    },

    extra(k, h) {
      const { HIP, ANKLE, HEAD_Y } = h.joints;
      const pair = (s: sdf.Shape) => s.mirror('x', 0);
      const P = AGE5;

      // ---------------------------------------------------------------- short black hair: one smooth shell and a swept fringe
      const H = P.head;
      const faceMask = sdf.ellipsoid([0.24, 0.15, 0.25]).rotateZ(12).at(0.02, -0.06, 0.14);
      const outer = sdf.ellipsoid([H[0] + 0.03, H[1] + 0.03, H[2] + 0.03]).at(0, 0.008, -0.01);
      const cap = sdf.ellipsoid([H[0] + 0.013, H[1] + 0.015, H[2] + 0.013]).at(0, 0.008, -0.01).smoothSubtract(0.02, faceMask);
      const fringe = sdf.chain(
        [
          [0.11, 0.13, 0.11, 0.042],
          [0.04, 0.14, 0.17, 0.05],
          [-0.05, 0.115, 0.205, 0.05],
          [-0.12, 0.07, 0.19, 0.04],
          [-0.165, 0.015, 0.13, 0.028],
        ],
        0.03,
      );
      const lock2 = sdf.chain(
        [
          [0.15, 0.1, 0.08, 0.034],
          [0.085, 0.1, 0.175, 0.038],
          [0.01, 0.075, 0.215, 0.03],
        ],
        0.02,
      );
      const fringeAll = sdf.smoothUnion(0.02, fringe, lock2).smoothIntersect(0.02, outer);
      // Soft rounded tufts: short fat capsules that lie along the skull at the fringe and the crown.
      const tuft = (azDeg: number, elDeg: number, turnDeg: number, len: number, r: number) => {
        const [az, el, ph] = [azDeg, elDeg, turnDeg].map((d) => (d * Math.PI) / 180) as [number, number, number];
        const R = [H[0] + 0.013, H[1] + 0.015, H[2] + 0.013];
        const p: [number, number, number] = [R[0]! * Math.cos(el) * Math.sin(az) * 1.0, R[1]! * Math.sin(el) + 0.008, R[2]! * Math.cos(el) * Math.cos(az) - 0.01];
        const a: [number, number, number] = [Math.cos(az), 0, -Math.sin(az)];
        const m: [number, number, number] = [-Math.sin(el) * Math.sin(az), Math.cos(el), -Math.sin(el) * Math.cos(az)];
        const d = [0, 1, 2].map((i) => Math.cos(ph) * a[i]! + Math.sin(ph) * m[i]!) as [number, number, number];
        const lift = 0.006;
        const c: [number, number, number] = [p[0] + Math.cos(el) * Math.sin(az) * lift, p[1] + Math.sin(el) * lift, p[2] + Math.cos(el) * Math.cos(az) * lift];
        return sdf.capsule([c[0] - d[0] * len, c[1] - d[1] * len, c[2] - d[2] * len], [c[0] + d[0] * len, c[1] + d[1] * len, c[2] + d[2] * len], r);
      };
      const tufts = sdf.smoothUnion(
        0.02,
        tuft(58, 50, -40, 0.04, 0.026),
        tuft(22, 58, 25, 0.04, 0.026),
        tuft(-20, 55, 170, 0.04, 0.026),
        tuft(-55, 40, 160, 0.04, 0.026),
        tuft(0, 80, 90, 0.04, 0.03),
        tuft(120, 62, 30, 0.04, 0.026),
        tuft(-120, 62, 150, 0.04, 0.026),
        tuft(180, 70, 90, 0.04, 0.026),
      );
      const hair = sdf.smoothUnion(0.025, cap, fringeAll, tufts).bone('head');
      k.body('hair', hair.at(0, HEAD_Y, 0), { color: k.tint('hair'), roughness: 0.6, detail: 0.004 });

      // ---------------------------------------------------------------- green T-shirt
      const sleeveEnd = (j: { ELBOW: readonly [number, number, number] }): [number, number, number] =>
        j.ELBOW === P.elbow ? [...P.shirt.sleeveEnd] : [j.ELBOW[0] - 0.008, j.ELBOW[1] + 0.016, j.ELBOW[2] - 0.002];
      const sleeves = h.perArm((j) => sdf.cone(P.shirt.sleeveStart, sleeveEnd(j), ...P.shirt.sleeveR).bone('upperarm.L'));
      const body = h.torso.round(0.006).smoothIntersect(0.01, sdf.halfSpace([0, -1, 0], -0.185));
      const shirt = sdf
        .smoothUnion(0.012, h.weighted(body), sleeves)
        .paintWhere(sdf.halfSpace([0, -1, 0], -P.shirt.collarY), k.tint('cloth', -0.15), 0.003);
      k.body('shirt', shirt, { color: h.tint.shirt!, roughness: 0.85 });

      // ---------------------------------------------------------------- brown shorts with pockets
      const waist = h.torso.round(0.0).smoothIntersect(0.01, sdf.box([0.6, 0.05, 0.6]).at(0, 0.175, 0));
      const shortLeg = sdf.cone(HIP, [HIP[0] + 0.008, 0.15, 0], 0.052, 0.06).round(0.003).bone('leg.L');
      const pocket = sdf.box([0.026, 0.046, 0.046], 0.01).at(HIP[0] + 0.058, 0.166, 0.012).bone('leg.L');
      const shorts = sdf.smoothUnion(0.02, h.weighted(waist), sdf.ellipsoid([0.099, 0.05, 0.074]).at(0, 0.19, 0).bone('hips'), pair(shortLeg));
      k.body('shorts', shorts, { color: C.shorts, roughness: 0.85 });
      k.body('pockets', pair(pocket), { color: C.pocket, roughness: 0.85, detail: 0.003 });

      // ---------------------------------------------------------------- brown sandals: a sole and two straps over the bare foot
      const foot = sdf.ellipsoid(P.foot.size).at(0, P.foot.y, P.foot.z);
      const sole = sdf.smoothUnion(0.02, sdf.ellipsoid([0.034, 0.016, 0.052]).at(0, 0.008, 0.062), sdf.ellipsoid([0.03, 0.016, 0.034]).at(0, 0.008, -0.004)).intersect(sdf.halfSpace([0, -1, 0], 0)).intersect(sdf.halfSpace([0, 1, 0], 0.016)).paint(C.sole);
      const strapAt = (z: number) => foot.round(0.005).intersect(sdf.box([0.3, 0.3, 0.012]).at(0, 0.04, z)).subtract(foot.round(-0.001));
      const sandal = sdf.union(sole, strapAt(0.012), strapAt(0.055)).at(ANKLE[0], 0, 0).bone('foot.L');
      k.body('sandals', pair(sandal), { color: C.sandal, roughness: 0.7, detail: 0.003 });

      // ---------------------------------------------------------------- teddy bear (0.14 m), rigid on the chest bone
      const bearAt = (s: sdf.Shape) => s.scale(1.15).at(0, 0.262, 0.15).bone('hand.R');
      const bear = sdf.smoothUnion(
        0.012,
        sdf.ellipsoid([0.036, 0.042, 0.032]),
        sdf.sphere(0.034).at(0, 0.062, 0.006),
        sdf.sphere(0.014).at(0.026, 0.092, 0),
        sdf.sphere(0.014).at(-0.026, 0.092, 0),
        sdf.capsule([0.034, 0.02, 0.005], [0.05, -0.012, 0.03], 0.013),
        sdf.capsule([-0.034, 0.02, 0.005], [-0.05, -0.012, 0.03], 0.013),
        sdf.capsule([0.02, -0.035, 0.01], [0.026, -0.06, 0.034], 0.015),
        sdf.capsule([-0.02, -0.035, 0.01], [-0.026, -0.06, 0.034], 0.015),
      );
      k.body('teddy', bearAt(bear), { color: C.bear, roughness: 0.95, detail: 0.003, bump: (x: number, y: number, z: number) => 0.0008 * Math.sin(x * 400) * Math.cos(y * 380 + z * 200) });
      const muzzle = sdf.smoothUnion(0.006, sdf.ellipsoid([0.018, 0.014, 0.013]).at(0, 0.054, 0.034), sdf.sphere(0.0075).at(0.026, 0.092, 0.011), sdf.sphere(0.0075).at(-0.026, 0.092, 0.011));
      k.body('teddy-muzzle', bearAt(muzzle), { color: C.bearLight, roughness: 0.95, detail: 0.0025 });
      const features = sdf.union(
        sdf.sphere(0.0058).at(0, 0.06, 0.045),
        sdf.sphere(0.0045).at(0.013, 0.073, 0.035),
        sdf.sphere(0.0045).at(-0.013, 0.073, 0.035),
      );
      k.body('teddy-face', bearAt(features), { color: C.dark, roughness: 0.5, detail: 0.002 });

      // ---------------------------------------------------------------- the week 1 gestures (option C: every singer plays them)
      sproutGestures(k, h);
    },
  }),
  0.96,
);
