import { mixRgb, motion, profile, rgb, sdf } from '../src/index.js';
import type { AnimationDef, Pose } from '../src/index.js';
import { AGE5, humanoidAsset } from './parts/humanoid-kind.js';
import { sproutGestures } from './parts/sprout-gestures.js';

/**
 * May, a five-year-old girl of Chibi Sprouts, faces +Z. Target: docs/sprout-mockups/may.jpg.
 * Role: a classmate in the kindergarten renders; the high ponytail with the yellow star clip and the
 * pleated blue skirt must read in a large transparent render.
 * One idea: a bright girl whose long black ponytail rises from the crown, falls down her back, and
 * carries a yellow star. Shape language: round and soft, with the pleats as the one repeated form.
 * Palette (60/30/10): yellow shirt #f2c23a, blue skirt #3a62b8, black hair #231a17; white socks and
 *   sneakers (grey soles); the yellow star clip #f6c830 is the accent.
 * Bodies: skin, hair (shell and ponytail), clip, shirt, skirt (9 pleats), socks, shoes.
 * Rig: the humanoid kind's skeleton and clips at age 5; the skirt is rigid on the hips.
 */

const C = { skirt: '#3a62b8', fold: '#1f3a80', sock: '#f6f4ef', shoe: '#f6f4ef', sole: '#8d8f96', strap: '#9ea4b2', clip: '#f6c830' };
const PLEATS = 10;

const star = (outer: number, inner: number) =>
  profile.polygon(
    Array.from({ length: 10 }, (_, i): [number, number] => {
      const a = Math.PI / 2 + (i * Math.PI) / 5;
      const r = i % 2 === 0 ? outer : inner;
      return [r * Math.cos(a), r * Math.sin(a)];
    }),
  );

export default humanoidAsset({
  name: 'sprout-may',
  description: 'May, a five-year-old girl: large dark-brown eyes, long straight black hair in a high ponytail with a yellow star clip, a yellow T-shirt, a blue pleated skirt, white socks, and white sneakers.',
  reference: 'docs/sprout-mockups/may.jpg',
  proportions: AGE5,
  sing: true,
  sproutFace: true,
  hair: false,
  undershirt: false,
  pants: false,
  shoes: false,
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { black: '#231a17', brown: '#5a301d', auburn: '#8e3b1c', blond: '#c4974a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a' },
    cloth: { yellow: '#f2c23a', honey: '#e8aa30', lemon: '#f2d65a', amber: '#f0a83a' },
  },
  presets: {
    may: { skin: 'fair', hair: 'black', eyes: 'brown', cloth: 'yellow' },
  },

  extra(k, h) {
    const { KNEE, ANKLE, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x', 0);
    const P = AGE5;
    const H = P.head;
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];

    // ---------------------------------------------------------------- hair: a smooth shell, side-swept bangs, and one tapered ponytail
    const faceMask = sdf.ellipsoid([0.24, 0.15, 0.25]).rotateZ(12).at(0.02, -0.06, 0.14);
    const outer = sdf.ellipsoid([H[0] + 0.03, H[1] + 0.03, H[2] + 0.03]).at(0, 0.008, -0.01);
    const cap = sdf
      .ellipsoid([H[0] + 0.013, H[1] + 0.015, H[2] + 0.013])
      .at(0, 0.008, -0.01)
      .smoothSubtract(0.02, faceMask);
    // The bangs: a long soft sweep from the part to the far temple, and a short one on the near side.
    const bangs = sdf.smoothUnion(
      0.02,
      sdf.chain(
        [
          [0.1, 0.13, 0.12, 0.04],
          [0.03, 0.14, 0.18, 0.046],
          [-0.05, 0.115, 0.2, 0.046],
          [-0.12, 0.07, 0.185, 0.038],
          [-0.165, 0.015, 0.13, 0.027],
        ],
        0.03,
      ),
      sdf.chain(
        [
          [0.13, 0.11, 0.1, 0.034],
          [0.17, 0.05, 0.1, 0.026],
        ],
        0.02,
      ),
    ).smoothIntersect(0.02, outer);
    // One smooth lock: from the crown, out to the right side of the head (image left from the front), and down.
    const tail = sdf.chain(
      [
        [-0.05, 0.175, -0.12, 0.034],
        [-0.14, 0.15, -0.19, 0.034],
        [-0.225, 0.03, -0.17, 0.031],
        [-0.235, -0.14, -0.12, 0.025],
        [-0.21, -0.28, -0.1, 0.016],
      ],
      0.07,
    );
    const hairShell = sdf.smoothUnion(0.025, cap, bangs).bone('head');
    k.body('hair', sdf.smoothUnion(0.03, hairShell, tail.bone('cloak')).at(0, HEAD_Y, 0), { color: k.tint('hair'), roughness: 0.6, detail: 0.004 });
    // Follow-through: the kind's walk and run turn the cloak bone a few degrees; the ponytail hangs on
    // that bone, so walk and run add a larger, lagging swing to it (the kind's clip list stays the same).
    const addClip = k.animation.bind(k);
    k.animation = (name: string, def: AnimationDef) => {
      if (name !== 'walk' && name !== 'run') return addClip(name, def);
      const pose = (t: number, p: number): Pose => {
        const base = def.pose(t, p);
        const c = base.cloak;
        const [rx, ry, rz] = c?.rotate ?? [0, 0, 0];
        const gain = name === 'run' ? 2 : 1;
        return { ...base, cloak: { ...c, rotate: [rx + gain * 5 * motion.wave(p, 2, 0.35), ry, rz * 2 + gain * 7 * motion.wave(p, 1, 0.3)] } };
      };
      return addClip(name, { ...def, pose });
    };
    // The star clip: larger, at the side of the ponytail base.
    const clip = sdf.extrude(star(0.046, 0.02), 0.03, 0.004).rotateX(-36).rotateY(-105).at(-0.145, 0.2, -0.05).bone('head');
    k.body('clip', clip.at(0, HEAD_Y, 0), { color: C.clip, roughness: 0.4, detail: 0.003 });

    // ---------------------------------------------------------------- yellow T-shirt
    const HEM_SHIRT = 0.22;
    const sleeves = h.perArm(() => sdf.cone(P.shirt.sleeveStart, P.shirt.sleeveEnd, ...P.shirt.sleeveR).bone('upperarm.L'));
    const body = h.torso.round(0.006).smoothIntersect(0.01, sdf.halfSpace([0, -1, 0], -HEM_SHIRT));
    const shirt = sdf
      .smoothUnion(0.012, h.weighted(body), sleeves)
      .paintWhere(sdf.halfSpace([0, -1, 0], -P.shirt.collarY), k.tint('cloth', -0.12), 0.003);
    k.body('shirt', shirt, { color: h.tint.shirt!, roughness: 0.85 });

    // ---------------------------------------------------------------- blue pleated skirt to the knee
    // The waistband stays inside the shirt (radius below the shirt) and the pleats start 0.015 m below
    // the shirt hem (y = 0.2). The folds are straight triangle-wave ridges from there to the hem.
    const PLEAT_TOP = HEM_SHIRT - 0.015;
    const SKIRT_HEM = 0.135;
    const tri = (x: number, z: number) => {
      const t = ((((PLEATS * Math.atan2(x, z)) / (2 * Math.PI)) % 1) + 1) % 1;
      return 1 - 4 * Math.abs(t - 0.5);
    };
    const ramp = (y: number) => Math.min(1, Math.max(0, (PLEAT_TOP - y) / 0.008));
    const skirtBase = sdf
      .revolve(
        profile.polygon([
          [0, 0.235],
          [0.104, 0.235],
          [0.108, HEM_SHIRT],
          [0.117, PLEAT_TOP],
          [0.146, SKIRT_HEM],
          [0, SKIRT_HEM],
        ]),
      )
      .scale([1, 1, 0.84]);
    const skirt = skirtBase
      .displace(0.01, (x, y, z) => ramp(y) * tri(x, z))
      .intersect(sdf.box([0.6, 0.2, 0.6]).at(0, SKIRT_HEM + 0.12, 0))
      .paintFn((x, y, z, base) => mixRgb(base, rgb(C.fold), 0.7 * ramp(y) * (0.5 - 0.5 * tri(x, z))))
      .bone('hips');
    k.body('skirt', skirt, { color: C.skirt, roughness: 0.85, detail: 0.004, textureDensity: 2, maxError: 0.004 });

    // ---------------------------------------------------------------- short white ankle socks, bare skin above
    const sockA = lerp(KNEE, ANKLE, 0.72);
    const sockB = lerp(KNEE, ANKLE, 1.0);
    const sock = sdf
      .smoothUnion(0.004, sdf.cone(sockA, sockB, 0.0355, 0.0345), sdf.torus(0.0355, 0.005).at(sockA[0], sockA[1], sockA[2]))
      .bone('shin.L');
    k.body('socks', pair(sock), { color: C.sock, roughness: 0.9, detail: 0.003 });

    // ---------------------------------------------------------------- white sneakers, grey soles
    const shoeFoot = sdf
      .smoothUnion(0.03, sdf.cylinder(...P.shoe.cylinder).at(0, P.shoe.cylinderY, 0), sdf.ellipsoid(P.shoe.toeSize).at(...P.shoe.toeAt))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const sole = shoeFoot.round(0.005).intersect(sdf.halfSpace([0, 1, 0], 0.026)).intersect(sdf.halfSpace([0, -1, 0], 0));
    // Three laces across the instep, painted where the bars cross the toe cap.
    const laceY = (z: number) => 0.048 + 0.05 * Math.sqrt(Math.max(0, 1 - ((z - 0.045) / 0.098) ** 2));
    const laces = sdf.union(...[0.045, 0.068, 0.091].map((z) => sdf.box([0.07, 0.03, 0.011]).at(0, laceY(z), z)));
    const sneaker = sdf
      .union(shoeFoot.paintWhere(laces, C.strap, 0.002), sole.paint(C.sole))
      .rotateY(12)
      .scale(P.shoe.scale)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('shoes', pair(sneaker), { color: C.shoe, roughness: 0.6 });

    // ---------------------------------------------------------------- the week 1 gestures (option C: every singer plays them)
    sproutGestures(k, h);
  },
});
