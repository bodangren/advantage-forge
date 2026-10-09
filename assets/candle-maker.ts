import { profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Candle-maker — Chibi Quest settlement NPC (catalog `npcs/settlement/candle-maker`), about 1.0 m to
 * the top of the hair bun, faces +Z. Target: docs/npc-mockups/candle-maker_001.jpg. Built on the
 * humanoid kind.
 *
 * Role: the village shop NPC who sells candles and lanterns; seen in 3D and as a 128 px sprite. The
 *   two lit candles, the high bun, and the wax-dripped cream apron must read.
 * One idea: a gentle girl in a rust dress whose raised tall candle and outstretched short candle
 *   glow like two warm lights against a cream apron.
 * Shape language: round and soft (bun, sleeves, drips, shoes), with the straight candles as the
 *   one hard form.
 * Palette (60/30/10): rust dress #b0582a and cream apron #e8dcc0 (90 percent of the body), brown
 *   hair #6b3e22 and shoes #5a3a24, flame #ffb040 as the accent.
 * Value plan: the light apron and candles frame the mid rust dress; the emissive flames are the
 *   brightest points, the dark hair bun the darkest.
 * Bodies: skin, hair, dress, collar, cuffs, apron, drips, shoes, candle.R, candle.L, string, flames.
 * Rig: the humanoid kind's skeleton and clips. Both arms keep a held pose; the candles are rigid on
 *   the grip bones `knife.R` and `knife.L`.
 */

const C = {
  hair: '#6b3e22',
  dress: '#b0582a',
  hem: '#8f4521',
  apron: '#e8dcc0',
  seam: '#cdbb94',
  drip: '#f6f1ea',
  shoe: '#5a3a24',
  sole: '#3a2416',
  candleTall: '#f6f1ea',
  candleShort: '#ece0c4',
  string: '#8a6a3a',
  flame: '#ffe070',
  flameCore: '#fffbe6',
  wick: '#3a2a20',
};

export default humanoidAsset({
  name: 'candle-maker',
  description: 'A gentle candle-maker with a brown bun and a wax-spotted apron, holding up two lit candles.',
  reference: 'docs/npc-mockups/candle-maker_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { chestnut: '#6b3e22', black: '#231a17', blond: '#c4974a', auburn: '#8e3b1c', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { rust: '#b0582a', madder: '#9a3f35', ochre: '#b8803a', clay: '#8a5a48' },
  },
  presets: {
    honey: { skin: 'tan', hair: 'auburn', eyes: 'hazel', cloth: 'ochre' },
  },
  hair: false,
  undershirt: false,
  pants: false,
  shoes: false,
  // The right hand raised beside the head (the tall candle); the left hand out in front (the short candle).
  pose: {
    R: { elbow: [0.23, 0.36, 0.03], wrist: [0.3, 0.445, 0.075] },
    L: { elbow: [0.17, 0.335, 0.05], wrist: [0.2, 0.33, 0.15] },
  },

  // Thin, arched brows: the kind's straight brows are painted over with skin first.
  paintSkin(skin, h) {
    const oldBrows = sdf.extrude(profile.arc(0.1, 0.036, 54, 126), 0.3).at(0.1, 0.622, 0.1).mirror('x');
    const brows = sdf.extrude(profile.arc(0.07, 0.01, 56, 124), 0.3).at(0.1, 0.645, 0.1).mirror('x');
    return skin.paintWhere(oldBrows, h.tint.skin!, 0.002).paintWhere(brows, h.tint.brow!, 0.002);
  },

  extra(k, h) {
    const { SHOULDER, HIP, KNEE, ANKLE, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];

    // ------------------------------------------------------------------ hair: a cap, a fringe, side locks, a high bun
    const hairColor = k.tint('hair');
    const shell = sdf.ellipsoid([0.213, 0.208, 0.198]).at(0, HEAD_Y, 0);
    // The hairline slopes from high at the front to the nape at the back; the ears stay clear.
    const slope = sdf.halfSpace([0, -0.7071, 0.7071], -0.41);
    const ears = sdf.ellipsoid([0.06, 0.075, 0.07]).at(0.2, 0.6, -0.005).mirror('x', 0);
    const cap = shell.smoothIntersect(0.025, slope).smoothSubtract(0.012, ears);
    const fringe = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.11, 0.045, 0.06]).rotateZ(-14).at(-0.035, 0.78, 0.15),
      sdf.ellipsoid([0.07, 0.04, 0.05]).rotateZ(24).at(0.1, 0.79, 0.13),
      sdf.ellipsoid([0.05, 0.035, 0.05]).rotateZ(-30).at(-0.13, 0.76, 0.1),
    );
    // The long strands that hang in front of the ears, down past the jaw.
    const lock = (s: 1 | -1) =>
      sdf.chain(
        [
          [0.2 * s, 0.76, 0.05, 0.018],
          [0.205 * s, 0.68, 0.05, 0.013],
          [0.2 * s, 0.6, 0.06, 0.011],
          [0.192 * s, 0.53, 0.07, 0.009],
          [0.186 * s, 0.485, 0.074, 0.006],
        ],
        0.015,
      );
    // A round swirl bun: a soft ball inside a rolled ring, a knot on top, and a loose tail.
    // A wide, low coiled bun: a flat ball with two rolls wound around it and a knot on top.
    const bunAt = [0, 0.9, -0.06] as const;
    const bun = sdf.smoothUnion(
      0.022,
      sdf.ellipsoid([0.13, 0.062, 0.11]).at(...bunAt),
      sdf.torus(0.098, 0.03).at(bunAt[0], bunAt[1] + 0.022, bunAt[2]).scale([1, 1, 0.88]),
      sdf.torus(0.056, 0.026).at(bunAt[0] + 0.006, bunAt[1] + 0.046, bunAt[2]),
      sdf.ellipsoid([0.045, 0.03, 0.042]).at(bunAt[0] + 0.006, bunAt[1] + 0.07, bunAt[2]),
    );
    // One loose curl that hangs from the bun on the viewer's right and curls in at the end.
    const swirl = sdf.chain(
      [
        [0.09, 0.915, -0.06, 0.018],
        [0.15, 0.915, -0.06, 0.015],
        [0.19, 0.88, -0.06, 0.013],
        [0.2, 0.84, -0.06, 0.009],
        [0.19, 0.805, -0.06, 0.005],
      ],
      0.012,
    );
    const hair = sdf.smoothUnion(0.02, cap, fringe, lock(1), lock(-1), bun, swirl).bone('head');
    k.body('hair', hair, { color: hairColor, roughness: 0.6, detail: 0.004, bump: (x, y, z) => 0.0015 * Math.sin(x * 160 + y * 90) * Math.cos(z * 140) });

    // ------------------------------------------------------------------ dress: long sleeves, a flared skirt
    const skirtProfile = profile.polygon(
      [
        [0, 0.3],
        [0.128, 0.3],
        [0.145, 0.25],
        [0.168, 0.2],
        [0.192, 0.162],
        [0.2, 0.146],
        [0.198, 0.138],
        [0, 0.138],
      ],
      { smooth: true, samples: 8 },
    );
    const skirt = sdf.revolve(skirtProfile).scale([1, 1, 0.8]);
    const sleeves = h.perArm((j) =>
      sdf.smoothUnion(
        0.016,
        sdf.cone(lerp(SHOULDER, j.ELBOW, -0.1), j.ELBOW, 0.05, 0.048).bone('upperarm.L'),
        sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.55), 0.048, 0.046).bone('forearm.L'),
      ),
    );
    const dress = sdf
      .smoothUnion(0.012, h.weighted(h.torso.round(0.005)), h.weighted(skirt), sleeves)
      .paintWhere(h.band(0.1, 0.162), C.hem, 0.004);
    const dressColor = h.tint.shirt ?? C.dress;
    k.body('dress', dress, { color: dressColor, roughness: 0.85, detail: 0.005 });

    // The standing collar and the cuffs (the slot's darker shade).
    const collar = sdf.cylinder(0.064, 0.03, 0.012).at(0, 0.455, -0.01).bone('chest');
    const cuffs = h.perArm((j) => sdf.cone(lerp(j.ELBOW, j.WRIST, 0.46), lerp(j.ELBOW, j.WRIST, 0.58), 0.05, 0.05).round(0.004).bone('forearm.L'));
    k.body('collar', sdf.union(collar, cuffs), { color: k.tint('cloth', -0.18), roughness: 0.85, detail: 0.004 });

    // ------------------------------------------------------------------ apron: bib, straps, skirt panel, wax drips
    const torsoShell = h.torso.round(0.013).subtract(h.torso.round(-0.003));
    const front = (x: number, y0: number, y1: number) => sdf.box([2 * x, y1 - y0, 0.5], 0.01).at(0, (y0 + y1) / 2, 0.25);
    const bib = torsoShell.intersect(front(0.075, 0.27, 0.42));
    const strap = torsoShell
      .intersect(sdf.box([0.03, 0.2, 0.6]).at(0.07, 0.4, 0))
      .intersect(sdf.halfSpace([0, -1, 0], -0.3))
      .intersect(sdf.halfSpace([0, 1, 0], 0.46))
      .bone('chest');
    const skirtShell = skirt.round(0.013).subtract(skirt.round(0.002));
    const panel = skirtShell.intersect(sdf.box([0.25, 0.13, 0.5], 0.02).at(0, 0.235, 0.25));
    const apron = sdf
      .smoothUnion(0.008, h.weighted(bib), pair(strap), h.weighted(panel))
      .paintWhere(h.band(0.268, 0.28), C.seam, 0.002);
    k.body('apron', apron, { color: C.apron, roughness: 0.9, detail: 0.005 });

    // A lighter wax layer over the apron hem with a rolled upper edge and drips that hang over the hem.
    const skirtOuter = skirt.round(0.022);
    const surfZ = (x: number, y: number) => sdf.raycast(skirtOuter, [x, y, 1], [0, 0, -1])![2];
    const layer = skirtOuter
      .subtract(skirt.round(0.009))
      .intersect(sdf.box([0.236, 0.07, 0.5], 0.02).at(0, 0.205, 0.25));
    const bead = (x: number, y: number, r: number) => sdf.sphere(r).at(x, y, surfZ(x, y) - 0.004);
    const topEdge = sdf.union(...[-0.1, -0.06, -0.02, 0.02, 0.06, 0.1].map((x, i) => bead(x, 0.236 - 0.004 * (i % 2), 0.014)));
    const hang = (x: number, y0: number, y1: number, r: number) =>
      sdf.smoothUnion(
        0.006,
        sdf.sphere(r * 1.1).at(x, y0, surfZ(x, y0) - 0.006),
        sdf.capsule([x, y0, surfZ(x, y0) - 0.006], [x, y1, surfZ(x, y1) - 0.006], r),
        sdf.sphere(r * 1.25).at(x, y1, surfZ(x, y1) - 0.006),
      );
    const hangs = sdf.union(
      hang(-0.095, 0.2, 0.152, 0.011),
      hang(-0.05, 0.2, 0.162, 0.013),
      hang(-0.005, 0.2, 0.154, 0.012),
      hang(0.045, 0.2, 0.164, 0.012),
      hang(0.09, 0.2, 0.15, 0.011),
    );
    const dripBody = sdf.smoothUnion(0.01, layer, topEdge, hangs);
    // a small wax blob on the bib
    const blob = sdf.ellipsoid([0.014, 0.012, 0.008]).at(0.03, 0.33, sdf.raycast(h.torso.round(0.013), [0.03, 0.33, 1], [0, 0, -1])![2] - 0.002);
    k.body('drips', sdf.union(dripBody.bone('hips'), blob.bone('chest')), { color: C.drip, roughness: 0.8, detail: 0.003 });

    // ------------------------------------------------------------------ brown shoes
    const shoe = sdf
      .smoothUnion(
        0.025,
        sdf.ellipsoid([0.058, 0.044, 0.1]).at(0, 0.04, 0.04),
        sdf.sphere(0.052).at(0, 0.052, -0.005),
        sdf.cylinder(0.05, 0.075, 0.014).at(0, 0.07, 0),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('shoes', pair(shoe), { color: C.shoe, roughness: 0.6 });
    void HIP;
    void KNEE;

    // ------------------------------------------------------------------ candles
    // Both candles stand upright in the posed fists: thick wax, long drips, a twine wrap, big flames.
    const twine: sdf.Shape[] = [];
    const candle = (
      grip: readonly [number, number, number],
      x: number,
      len: number,
      r: number,
      bone: string,
      color: string,
      name: string,
      tail: boolean,
    ) => {
      const y0 = grip[1] - 0.06;
      const z = grip[2] + 0.004;
      const body = sdf.cylinder(r, len, 0.01).at(x, y0 + len / 2, z);
      const top = y0 + len;
      const pool = sdf.ellipsoid([r * 0.92, 0.012, r * 0.92]).at(x, top - 0.002, z); // melted dip
      const at = (a: number, y: number): [number, number, number] => [x + (r + 0.001) * Math.sin(a), y, z + (r + 0.001) * Math.cos(a)];
      const sideDrip = (a: number, l: number, w: number) =>
        sdf.smoothUnion(0.006, sdf.sphere(w * 1.2).at(...at(a, top - 0.006)), sdf.capsule(at(a, top - 0.006), at(a, top - l), w), sdf.sphere(w * 1.3).at(...at(a, top - l)));
      const wax = sdf
        .smoothUnion(0.008, body, pool, sideDrip(0.5, len * 0.5, 0.015), sideDrip(1.7, len * 0.28, 0.013), sideDrip(2.6, len * 0.4, 0.015), sideDrip(-0.9, len * 0.33, 0.014), sideDrip(-2.2, len * 0.22, 0.012))
        .bone(bone);
      k.body(name, wax, { color, roughness: 0.55, detail: 0.003 });
      const wick = sdf.capsule([x, top, z], [x, top + 0.02, z], 0.004).bone(bone);
      k.body(`${name}.wick`, wick, { color: C.wick, roughness: 0.9, detail: 0.002 });
      // A big teardrop flame: a round body and a tall tip, in a full-brightness orange with a pale core.
      const flame = sdf
        .smoothUnion(
          0.012,
          sdf.ellipsoid([0.031, 0.034, 0.031]).at(x, top + 0.046, z),
          sdf.cone([x, top + 0.052, z], [x, top + 0.118, z], 0.027, 0.003),
        )
        .bone(bone);
      k.body(`${name}.flame`, flame, { color: C.flame, emissive: C.flame, emissiveIntensity: 0.7, roughness: 0.5, detail: 0.003 });
      const core = sdf.ellipsoid([0.015, 0.026, 0.013]).at(x, top + 0.046, z + 0.016).bone(bone);
      k.body(`${name}.core`, core, { color: C.flameCore, emissive: C.flameCore, emissiveIntensity: 0.7, roughness: 0.5, detail: 0.003 });
      // Twine: three turns near the fist and (the tall candle) two loose ends that hang below it.
      const ty = y0 + 0.055;
      for (const dy of [0, 0.011, 0.022]) twine.push(sdf.torus(r + 0.002, 0.0055).at(x, ty + dy, z).bone(bone));
      if (tail) {
        const loose = (dx: number, dz: number) =>
          sdf.chain([[x + 0.012, ty - 0.004, z + r, 0.0048], [x + 0.02 + dx, ty - 0.05, z + r + 0.008 + dz, 0.0046], [x + 0.012 + dx * 1.5, ty - 0.1, z + r + 0.004 + dz, 0.004]], 0.004).bone(bone);
        twine.push(loose(0, 0), loose(0.016, 0.01));
      }
      return { top, z };
    };
    const gR = h.arms.R.GRIP;
    const gL = h.arms.L.GRIP;
    candle(gR, -gR[0], 0.24, 0.037, 'knife.R', C.candleTall, 'candle.R', true);
    candle(gL, gL[0], 0.12, 0.042, 'knife.L', C.candleShort, 'candle.L', false);
    k.body('string', sdf.union(...twine), { color: C.string, roughness: 0.9, detail: 0.0025 });
  },
});
