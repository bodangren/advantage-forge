import { profile, rgb, sdf } from '../src/index.js';
import { AGE5, humanoidAsset } from './parts/humanoid-kind.js';
import { sproutGestures, sproutIndexFinger } from './parts/sprout-gestures.js';

/**
 * Sprout Adventurer: the Chibi Quest adventurer at age 5 (catalog Chibi Sprouts, the gesture
 * Sprout), about 0.9 m to the top of his hair, faces +Z. Target: docs/hero-mockups/adventurer_001.jpg.
 * Role: the one Sprout that does the week 1 gestures in an inset (clap, wave, nod, point, hands
 *   out), seen as large transparent renders and cut-out key frames; the grin, the bandana, and the
 *   free hands must read.
 * One idea: a beaming boy with a tousled chestnut mop under a teal bandana and a red neckerchief,
 *   a brass lantern swinging at his hip, and both hands free.
 * Shape language: round and soft (soft rounded hair tufts, no spikes, a puffed scarf, round shoes).
 * Palette (60/30/10): cream shirt #efe2c4 and grey-green shorts #6e7560; brown leather #7a4a2c and
 *   chestnut hair #84502c; the teal bandana #4f9c8a and the red neckerchief #c8413a are the accent
 *   pair; a small brass lantern #b8893a with a warm glow #ffcc55.
 * Value plan: the dark hair and the teal bandana frame the light face (focal point); the red
 *   neckerchief is the strongest accent under it.
 * Bodies: skin (open grin), finger, hair, bandana, shirt, shorts, scarf, belt, steel (buckle),
 *   shoes, lantern-frame, lantern-light.
 * Rig: the humanoid kind's skeleton at age 5 (`AGE5`) and its clips, plus the seven gesture clips
 *   (`assets/parts/sprout-gestures.ts`). Hands: the kind's closed fists; the right fist has a short
 *   index finger (tag `hand.R`, in every clip) for the pointing gestures. The lantern is rigid on `hips`.
 */

const C = {
  teal: '#4f9c8a',
  tealDark: '#3a7a6a',
  red: '#c8413a',
  shirtShade: '#d8c8a4',
  trousers: '#6e7560',
  cuff: '#8a917a',
  leather: '#7a4a2c',
  leatherDark: '#503020',
  steel: '#b8bec6',
  brass: '#b8893a',
  glow: '#ffcc55',
  hairLight: '#a0683a',
  shoe: '#7a4428',
  sole: '#42281a',
  mouth: '#7a2a2a',
  teeth: '#fbf5ee',
  tongue: '#e0706a',
};

type V3 = readonly [number, number, number];
const RAD = Math.PI / 180;

/** The hero torso heights mapped onto the age-5 torso (the kind's `scaled`: legs 1.05, torso 0.84). */
const TS = 0.84;
const T = (y: number) => AGE5.torso.profile.at(-1)![1] + (y - 0.152) * TS;

const pair = (s: sdf.Shape) => s.mirror('x', 0);

/** A wide open grin painted on the face: dark inside, a row of teeth at the top, a tongue below. */
const grin = (skin: sdf.Shape, smileY: number): sdf.Shape => {
  const outline = (s: number) =>
    profile.polygon(
      (
        [
          [-0.052, 0.014],
          [-0.026, 0.006],
          [0, 0.004],
          [0.026, 0.006],
          [0.052, 0.014],
          [0.044, -0.012],
          [0.018, -0.03],
          [-0.018, -0.03],
          [-0.044, -0.012],
        ] as [number, number][]
      ).map(([x, y]): [number, number] => [x * s * 1.35, y * s * 1.15]),
      { smooth: true },
    );
  const mouth = sdf.extrude(outline(1), 0.3).at(0, smileY, 0.1);
  const teeth = sdf
    .extrude(outline(0.94), 0.3)
    .at(0, smileY + 0.001, 0.1)
    .intersect(sdf.halfSpace([0, -1, 0], -(smileY - 0.012)));
  const tongue = mouth.intersect(sdf.ellipsoid([0.03, 0.012, 0.5]).at(0, smileY - 0.03, 0.1));
  return skin.paintWhere(mouth, C.mouth, 0.001).paintWhere(tongue, C.tongue, 0.002).paintWhere(teeth, C.teeth, 0.001);
};

/** A small brass lantern, 0.12 m tall, hook ring on top, centered at the origin (the adventurer's, without a skin tag). */
const lanternFrame = () =>
  sdf.union(
    sdf.cylinder(0.03, 0.012, 0.004).at(0, 0.028, 0),
    sdf.cone([0, 0.032, 0], [0, 0.048, 0], 0.024, 0.01),
    sdf.cylinder(0.032, 0.012, 0.004).at(0, -0.034, 0),
    ...[0, 90, 180, 270].map((a) => sdf.capsule([0.026, -0.028, 0], [0.026, 0.024, 0], 0.004).rotateY(a + 45)),
    sdf.torus(0.02, 0.004).rotateX(90).at(0, 0.068, 0),
  );

export default humanoidAsset({
  name: 'sprout-adventurer',
  description:
    'The Chibi Quest adventurer at age 5: tousled chestnut hair under a teal bandana, a red neckerchief, a cream shirt, grey-green shorts, a small brass lantern at the hip, free hands, and the week 1 gesture clips.',
  reference: 'docs/hero-mockups/adventurer_001.jpg',
  proportions: AGE5,
  hair: false,
  undershirt: false,
  pants: false,
  shoes: false,
  lashes: false,
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { chestnut: '#84502c', brown: '#5a301d', black: '#231a17', blond: '#c4974a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a' },
    cloth: { cream: '#efe2c4', sand: '#d8c490', sky: '#a8c6dc', sage: '#b6c79a' },
  },
  presets: {
    adventurer: { skin: 'fair', hair: 'chestnut', eyes: 'brown', cloth: 'cream' },
  },

  paintSkin: (skin) => grin(skin, AGE5.face.smileY),

  extra(k, h) {
    const { HIP, KNEE, ANKLE, HEAD_Y } = h.joints;
    const P = AGE5;
    const H = P.head;
    const tintHair = k.tint('hair');
    const tintHairLight = k.tint('hair', { color: C.hairLight, follow: 1 });

    // ---------------------------------------------------------------- bandana: a soft band, a knot at the back, two long free tails
    const skull = sdf.ellipsoid([H[0], H[1], H[2]]);
    const bandBox = sdf.box([0.6, 0.074, 0.6], 0.016).rotateX(-8).at(0, 0.107, 0);
    const band = skull.round(0.031).subtract(skull.round(0.004)).smoothIntersect(0.014, bandBox);
    const KNOT: V3 = [0.02, 0.09, -0.215];
    // The tails leave the knot backward and outward, so they hang free of the back hair (0.08 m or more behind it).
    const tail = (dx: number) =>
      sdf.chain(
        [
          [KNOT[0], KNOT[1], KNOT[2], 0.024],
          [KNOT[0] + dx * 0.35, KNOT[1] - 0.03, KNOT[2] - 0.07, 0.02],
          [KNOT[0] + dx * 0.75, KNOT[1] - 0.1, KNOT[2] - 0.12, 0.017],
          [KNOT[0] + dx, KNOT[1] - 0.18, KNOT[2] - 0.13, 0.011],
        ],
        0.01,
      );
    const knot = sdf.ellipsoid([0.038, 0.03, 0.028]).at(...KNOT);
    const bandana = sdf
      .smoothUnion(0.01, band, knot, tail(-0.11), tail(0.13))
      .paintFn((_x, y, z, base) => {
        const v = y - HEAD_Y - 0.107 - z * 0.139;
        return v < -0.026 || Math.abs(v - 0.008) < 0.0025 ? rgb(C.tealDark) : base;
      });
    k.body('bandana', bandana.at(0, HEAD_Y, 0).bone('head'), { color: C.teal, roughness: 0.85 });

    // ---------------------------------------------------------------- hair: a shell above the band and swept, pointed locks
    const faceMask = sdf.ellipsoid([0.235, 0.16, 0.22]).at(0, -0.065, 0.15);
    // A soft dome (skull + 0.014 with a low crown, about 0.02 m above the skull at the top), no flame.
    const volume = sdf
      .union(sdf.ellipsoid([H[0] + 0.01, H[1] + 0.008, H[2] + 0.01]).at(0, 0.003, 0))
      .smoothSubtract(0.015, faceMask)
      ;
    // Nothing of the shell hangs below the band's top edge at the front (a plane 0.005 m above the edge).
    const frontBelowBand = sdf.box([0.26, 0.4, 0.4]).at(0, 0.042 - 0.2, 0.25).rotateX(-8).at(0, 0.107, 0);
    type Pt = [number, number, number, number];
    // A point on the skull (elevation `e` above the horizon, azimuth `az` from +Z toward +X, `lift` m outside the skull).
    const onSkull = (e: number, az: number, lift: number, r: number): Pt => {
      const ce = Math.cos(e * RAD);
      const u: V3 = [ce * Math.sin(az * RAD), Math.sin(e * RAD), ce * Math.cos(az * RAD)];
      const q = Math.hypot(u[0] / H[0], u[1] / H[1], u[2] / H[2]);
      const s0 = 1 / q;
      const n = Math.hypot(u[0] / (H[0] * H[0]), u[1] / (H[1] * H[1]), u[2] / (H[2] * H[2]));
      const nx = u[0] / (H[0] * H[0]) / n;
      const ny = u[1] / (H[1] * H[1]) / n;
      const nz = u[2] / (H[2] * H[2]) / n;
      return [u[0] * s0 + nx * lift, u[1] * s0 + ny * lift, u[2] * s0 + nz * lift, r];
    };
    // A lock: skull points from (elevation, azimuth) pairs, swelling from `lift0` to `lift1`, ending in a point (r 0.006).
    const lock = (path: [number, number][], lift0 = 0.01, lift1 = 0.03, r0 = 0.028): sdf.Shape => {
      const n = path.length - 1;
      return sdf.chain(
        path.map(([e, az], i) => onSkull(e, az, lift0 + (lift1 - lift0) * (i / n), i === n ? 0.006 : r0 * (1 - 0.55 * (i / n)))),
        0.012,
      );
    };
    // Locks lie along the skull and sweep from the right of the part over the crown to the left (+X) and back.
    // A swirl from the crown: nine locks start 40 degrees apart and each sweeps 95 degrees toward +X and back.
    const locks = Array.from({ length: 9 }, (_, i) => {
      const a0 = -160 + i * 40;
      const tipE = 42 + ((i * 5) % 3) * 4;
      return lock([[84, a0], [72, a0 + 30], [58, a0 + 65], [tipE, a0 + 95]]);
    });
    // One short fringe lock sweeps over the band at the forehead (the only lock that crosses the band).
    const bandLock = lock([[76, -30], [64, 0], [50, 28], [38, 50]], 0.006, 0.03, 0.026);
    // Flicks past the band: above the ears and at the nape.
    const both = (s: sdf.Shape) => s.mirror('x', 0);
    const flicks = [
      both(sdf.chain([[0.17, 0.06, -0.08, 0.03], [0.22, 0.045, -0.1, 0.022], [0.255, 0.01, -0.1, 0.006]], 0.02)),
      both(sdf.chain([[0.1, 0.0, -0.17, 0.034], [0.14, -0.05, -0.21, 0.024], [0.15, -0.11, -0.23, 0.006]], 0.02)),
      sdf.chain([[0.0, -0.03, -0.17, 0.034], [0.0, -0.09, -0.215, 0.024], [0.0, -0.14, -0.2, 0.006]], 0.02),
    ];
    const sideburns = pair(sdf.cone([0.192, 0.025, 0.04], [0.196, -0.065, 0.064], 0.026, 0.012));
    const hair = sdf
      .smoothUnion(0.015, volume.subtract(frontBelowBand), sideburns)
      .smoothUnion(0.02, ...flicks)
      .at(0, HEAD_Y, 0)
      // Lighter on top, where the light falls; a black base stays black.
      .paintFn((_x, y, _z, base) => {
        if (base[0] + base[1] + base[2] === 0) return base;
        const top = Math.min(1, Math.max(0, (y - HEAD_Y - 0.12) / 0.14)) * 0.3;
        const l = rgb(tintHairLight);
        return [base[0] + (l[0] - base[0]) * top, base[1] + (l[1] - base[1]) * top, base[2] + (l[2] - base[2]) * top];
      });
    k.body('hair', hair.bone('head'), { color: tintHair, roughness: 0.6, detail: 0.0045 });
    // The swept locks are a separate, lighter body on top: each reads against the darker dome under it.
    const lockBody = sdf.smoothUnion(0.008, ...locks, bandLock).at(0, HEAD_Y, 0);
    k.body('hair-locks', lockBody.bone('head'), { color: k.tint('hair', -0.14), roughness: 0.6, detail: 0.0045 });

    // ---------------------------------------------------------------- the index finger of the right fist (every clip)
    k.body('finger', sproutIndexFinger(h), { color: k.tint('skin'), roughness: 0.55, detail: 0.004 });

    // ---------------------------------------------------------------- cream shirt with rolled cuffs
    const sleeves = h.perArm(() =>
      sdf
        .smoothUnion(
          0.01,
          sdf.cone(P.shirt.sleeveStart, P.shirt.sleeveEnd, ...P.shirt.sleeveR),
          sdf
            .cone(
              [P.shirt.sleeveStart[0] + (P.shirt.sleeveEnd[0] - P.shirt.sleeveStart[0]) * 0.72, P.shirt.sleeveStart[1] + (P.shirt.sleeveEnd[1] - P.shirt.sleeveStart[1]) * 0.72, P.shirt.sleeveStart[2] + (P.shirt.sleeveEnd[2] - P.shirt.sleeveStart[2]) * 0.72],
              [P.shirt.sleeveEnd[0] + (P.shirt.sleeveEnd[0] - P.shirt.sleeveStart[0]) * 0.18, P.shirt.sleeveEnd[1] + (P.shirt.sleeveEnd[1] - P.shirt.sleeveStart[1]) * 0.18, P.shirt.sleeveEnd[2] + (P.shirt.sleeveEnd[2] - P.shirt.sleeveStart[2]) * 0.18],
              P.shirt.sleeveR[1] + 0.003,
              P.shirt.sleeveR[1] + 0.004,
            )
            .round(0.004)
            .paint(k.tint('cloth', -0.12)),
        )
        .bone('upperarm.L'),
    );
    const hem = T(0.2) - 0.015;
    const body = h.torso.round(0.012).smoothIntersect(0.01, sdf.halfSpace([0, -1, 0], -hem));
    const shirt = sdf.smoothUnion(0.012, h.weighted(body), sleeves);
    k.body('shirt', shirt, { color: h.tint.shirt!, roughness: 0.85 });

    // ---------------------------------------------------------------- grey-green shorts to the knee, a lighter turned-up hem
    const hemEnd: [number, number, number] = [P.pants.cuff[0] + 0.002, 0.116, P.pants.cuff[2]];
    const leg = sdf.smoothUnion(
      0.012,
      sdf.capsule(HIP, KNEE, P.pants.thighR + 0.01).bone('leg.L'),
      sdf.cone(KNEE, hemEnd, P.pants.thighR + 0.008, P.pants.thighR + 0.012).bone('shin.L'),
    );
    const hips = sdf.ellipsoid([P.pants.hipsSize[0] * 1.04, P.pants.hipsSize[1] * 1.08, P.pants.hipsSize[2] * 1.04]).at(0, P.pants.hipsY, 0).bone('hips');
    const waist = h.torso.round(0.009).intersect(sdf.box([0.6, 0.07, 0.6]).at(0, 0.185, 0));
    const shorts = sdf
      .smoothUnion(0.03, h.weighted(waist), hips, pair(leg))
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.13), C.cuff, 0.004);
    k.body('shorts', shorts, { color: C.trousers, roughness: 0.9 });

    // ---------------------------------------------------------------- red neckerchief: a puffed ring and a small triangle on the chest
    const m0 = (x: number, y: number): [number, number] => [x * TS, T(y)];
    const m = (x: number, y: number): [number, number] => [x < 0 ? Math.min(-0.056, x * TS) : Math.max(0.056, x * TS), T(y)];
    const scarfRing = sdf
      .revolve(
        profile.polygon([m(0.05, 0.5), m(0.09, 0.494), m(0.124, 0.47), m(0.134, 0.448), m(0.112, 0.434), m(0.08, 0.455), m(0.05, 0.468)], { smooth: true, samples: 6 }),
      )
      .at(0, -T(0.46), 0)
      .scale([1.14, 1.3, 0.96])
      .at(0, T(0.46), 0)
      // Two loose folds ride over the shoulders.
      .displace(0.006, (x, y, z) => Math.sin(Math.atan2(x, z) * 6 + y * 35));
    const shell = (r0: number, r1: number) => h.torso.round(r0).subtract(h.torso.round(r1));
    const tri = (w: number, len: number) => sdf.extrude(profile.polygon([[-w, 0], [w, 0], [0.004, -len], [-0.004, -len]]), 0.4);
    const KY = T(0.455);
    const scarfTip = shell(0.022, 0.006).intersect(
      sdf.extrude(profile.polygon([m0(-0.105, 0.475), m0(0.105, 0.475), m0(0.03, 0.35), m0(0, 0.325), m0(-0.03, 0.35)]), 0.4).at(0, 0, 0.2),
    );
    // A knot at the throat and two tails that stand off the drape, one with a fold.
    const tails = sdf.union(
      tri(0.034, 0.1).rotateZ(16).at(0.004, KY, 0.2),
      tri(0.028, 0.075).rotateZ(-24).at(-0.004, KY, 0.2),
    );
    const scarfTails = shell(0.03, 0.01).intersect(tails);
    const knotZ = sdf.raycast(scarfRing, [0, KY, 1], [0, 0, -1])?.[2] ?? 0.09;
    const scarfKnot = sdf.ellipsoid([0.032, 0.027, 0.027]).at(0, KY + 0.003, knotZ + 0.006);
    const scarf = sdf.smoothUnion(0.012, scarfRing, scarfTip, scarfTails, scarfKnot);
    k.body('scarf', scarf.bone('chest'), { color: C.red, roughness: 0.8 });

    // ---------------------------------------------------------------- belt, buckle, and the lantern strap
    const beltY = T(0.25);
    const belt = h.torso.round(0.017).smoothIntersect(0.006, sdf.box([0.5, 0.04, 0.5], 0.006).at(0, beltY, 0));
    const beltZ = sdf.raycast(belt, [0, beltY, 1], [0, 0, -1])![2];
    const buckle = sdf
      .box([0.052, 0.042, 0.012], 0.006)
      .subtract(sdf.box([0.032, 0.022, 0.03], 0.005))
      .at(0, beltY, beltZ + 0.003);
    const hipHit = sdf.raycast(belt, [0.3, beltY, -0.03], [-1, 0, 0])!;
    const LANTERN: V3 = [0.138, beltY - 0.04 - 0.072, -0.03];
    const strap = sdf.capsule([hipHit[0], beltY - 0.004, hipHit[2]], [LANTERN[0], LANTERN[1] + 0.072, LANTERN[2]], 0.0065);
    k.body('belt', sdf.union(belt, strap).bone('spine'), { color: C.leather, roughness: 0.6 });
    k.body('steel', buckle.bone('spine'), { color: C.steel, roughness: 0.35, metalness: 0.85 });

    // ---------------------------------------------------------------- lantern (rigid on the hips)
    k.body('lantern-frame', lanternFrame().at(...LANTERN), { color: C.brass, roughness: 0.35, metalness: 0.8, bone: 'hips' });
    k.body('lantern-light', sdf.cylinder(0.024, 0.056, 0.01).at(...LANTERN), {
      color: C.glow,
      roughness: 0.3,
      emissive: C.glow,
      emissiveIntensity: 0.8,
      bone: 'hips',
    });

    // ---------------------------------------------------------------- a small brown pouch on the right hip (mirrors the lantern)
    const POUCH: V3 = [-0.128, beltY - 0.04, 0.02];
    const pouch = sdf
      .smoothUnion(0.006, sdf.box([0.05, 0.056, 0.04], 0.014), sdf.box([0.054, 0.02, 0.044], 0.008).at(0, 0.022, 0.0).paint(C.leatherDark))
      .at(...POUCH);
    k.body('pouch', pouch, { color: C.leather, roughness: 0.65, bone: 'hips' });

    // ---------------------------------------------------------------- brown shoes with dark soles
    const shoeFoot = sdf
      .smoothUnion(0.03, sdf.cylinder(...P.shoe.cylinder).at(0, P.shoe.cylinderY, 0), sdf.ellipsoid(P.shoe.toeSize).at(...P.shoe.toeAt))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const sole = shoeFoot.scale([1.06, 1, 1.04]).intersect(sdf.halfSpace([0, 1, 0], 0.02)).intersect(sdf.halfSpace([0, -1, 0], 0));
    const strapBand = sdf.box([1, 0.014, 1]).at(0, 0.082, 0);
    const shoe = sdf
      .union(shoeFoot.paintWhere(strapBand, C.leatherDark, 0.002), sole.paint(C.sole))
      .rotateY(12)
      .scale(P.shoe.scale)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('shoes', pair(shoe), { color: C.shoe, roughness: 0.6 });

    // ---------------------------------------------------------------- the week 1 gestures
    sproutGestures(k, h);
  },
});
