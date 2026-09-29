import { defineAsset, motion, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Orc shaman — Chibi Quest enemy (catalog `enemies/humanoid/orc-shaman`), a hunched caster about
 * 1.1 m to the headdress feathers (1.23 m to the top of the staff skull), faces +Z. Target:
 * docs/enemy-mockups/orc-shaman_001.jpg. Built on the orc warrior's skeleton, knee bones, face,
 * variant slots, and presets.
 *
 * Role: a caster enemy seen in 3D and as a 128 px sprite; the white face paint, the feathered
 *   headdress, and the green glowing staff skull must read.
 * One idea: a hunched sage-green orc buried in a dark hood and fur, with a big grey beard, whose
 *   tall staff ends in a glowing green skull and flame (the accent).
 * Shape language: round and heavy (head, shoulders, fists) with sharp accents (feathers, tusk,
 *   ragged hide hem, the staff's flame).
 * Palette: skin sage #7f9a5a / #5d7540; beard grey #6a6560; paint and bone #efe4cc; hood #3f3a35;
 *   feathers #8a7a68 with white tips; fur #6a4a30; hide skirt #8a5a35; staff wood #4a2c17;
 *   glowing green #7dff5a on a dark #1f3a14 base (the only saturated part).
 * Value plan: the green skull and the white face paint are the strongest contrast; the dark hood
 *   and staff are the darks; skin and skirt are mid.
 * Bodies: skin, hood, band, bone-head (skull, sticks), feathers, beard, tusk, mantle fur, beads,
 *   belt, rope, charm, skirt, staff, staff skull (emissive), skull pits, flame (emissive).
 * Rig: the warrior's skeleton without the topknot, plus `staff` (child of hand.R, so the staff can
 *   slide in the fist) and `flame`. The spine is tilted 8 degrees forward in the rest pose (the
 *   upper body is built through `hunch`). Clips: idle, walk, run (staff carried), attack (staff
 *   lifts, then thrusts forward: a bolt cast), attack2 (both arms up, a slam with the staff butt),
 *   roar, hit, death.
 */

const C = {
  skin: '#7f9a5a',
  skinDark: '#5d7540',
  eye: '#f2c230',
  pupil: '#141010',
  lid: '#3a4a26',
  mouth: '#2a1a14',
  beard: '#6a6560',
  tusk: '#f1e6c8',
  bone: '#efe4cc',
  hood: '#3f3a35',
  band: '#2a2622',
  feather: '#8a7a68',
  fur: '#6a4a30',
  furDark: '#4a3220',
  bead: '#d9ccb0',
  hide: '#8a5a35',
  hideDark: '#6b4226',
  red: '#96302a',
  belt: '#4a2f1f',
  rope: '#cdbb92',
  wood: '#4a2c17',
  glowBase: '#1f3a14',
  glow: '#7dff5a',
};

type V3 = readonly [number, number, number];

const pair = (s: sdf.Shape) => s.mirror('x');
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};
const DEG = Math.PI / 180;
const rotXv = (v: V3, d: number): V3 => [v[0], v[1] * Math.cos(d * DEG) - v[2] * Math.sin(d * DEG), v[1] * Math.sin(d * DEG) + v[2] * Math.cos(d * DEG)];

// The hunch: everything above the hips leans forward 8 degrees about the pivot (world meters).
const HUNCH = 8;
const PIV: V3 = [0, 0.3, 0];
const HP = (p: V3): V3 => {
  const q = rotXv(sub(p, PIV), HUNCH);
  return [q[0] + PIV[0], q[1] + PIV[1], q[2] + PIV[2]];
};
const hunch = (s: sdf.Shape) => s.at(-PIV[0], -PIV[1], -PIV[2]).rotateX(HUNCH).at(...PIV);
// The head keeps its own tilt and moves with the neck: a shift only.
const HD: V3 = sub(HP([0, 0.66, 0]), [0, 0.66, 0]);
const H = (s: sdf.Shape) => s.at(...HD);

const SHOULDER = HP([0.22, 0.52, 0]);
const ELBOW = HP([0.31, 0.4, 0.02]);
const WRIST = HP([0.345, 0.3, 0.05]);
const HIP: V3 = [0.1, 0.25, 0];
const ANKLE: V3 = [0.155, 0.075, 0];
const KNEE: V3 = [0.1275, 0.1625, 0];
const SOLE_HEEL: V3 = [0.155, 0, -0.022];
const SOLE_TOE: V3 = [0.169, 0, 0.09];
const HEAD_Y = 0.72;
// The right fist's center (the staff passes through it) and the staff's top.
const FIST: V3 = [-WRIST[0] - 0.006, WRIST[1] - 0.06, WRIST[2] + 0.006];
const STAFF_TOP = 1.08;
const SKULL_Y = 1.145;

const fistAt = (w: V3, s: 1 | -1) => {
  const o = (dx: number, dy: number, dz: number): V3 => [w[0] + dx * s, w[1] + dy, w[2] + dz];
  return sdf.smoothUnion(
    0.022,
    sdf.ellipsoid([0.066, 0.068, 0.07]).at(...o(0.006, -0.06, 0.006)),
    sdf.capsule(o(-0.016, -0.092, 0.05), o(-0.01, -0.058, 0.07), 0.028),
    sdf.cone(o(0.036, -0.036, 0.042), o(0.004, -0.05, 0.08), 0.027, 0.021),
  );
};

export default defineAsset({
  name: 'orc-shaman',
  description: 'Chibi orc shaman enemy: hunched, sage green, a grey beard, one tusk, white face paint, a hood headdress with a skull and feathered bone sticks, a fur mantle, bone beads, a hide skirt, and a tall staff with a glowing green skull.',
  detail: 0.005,
  reference: 'docs/enemy-mockups/orc-shaman_001.jpg',
  variants: {
    eyes: { yellow: C.eye, red: '#d8321e', orange: '#f0861c' },
    hair: { grey: C.beard, black: '#1e1a18', brown: '#3a2a1e' },
    skin: { sage: C.skin, olive: '#5a6a30', grey: '#7a8470' },
    clothing: { hide: C.hide, red: C.red, black: '#2e2019' },
  },
  presets: {
    bloodfang: { eyes: 'red', hair: 'black', skin: 'sage', clothing: 'red' },
    bog: { eyes: 'yellow', hair: 'brown', skin: 'olive', clothing: 'hide' },
    ashen: { eyes: 'orange', hair: 'brown', skin: 'grey', clothing: 'black' },
  },

  build(k) {
    const T = {
      eye: k.tint('eyes'),
      hair: k.tint('hair'),
      skin: k.tint('skin'),
      skinDark: k.tint('skin', { color: C.skinDark, follow: 1 }),
      lid: k.tint('skin', { color: C.lid, follow: 1 }),
      mouth: k.tint('skin', { color: C.mouth, follow: 0.5 }),
      cloth: k.tint('clothing'),
    };
    const shadeOf = (body: string, shade: string) => {
      const a = rgb(body);
      const b = rgb(shade);
      return [b[0] - a[0], b[1] - a[1], b[2] - a[2]] as const;
    };
    const smooth01 = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    const FLAME_AT: V3 = [FIST[0] - 0.035, SKULL_Y + 0.07, FIST[2]];
    // ------------------------------------------------------------------ skeleton
    k.skeleton({
      hips: { at: [0, 0.26, 0] },
      spine: { parent: 'hips', at: HP([0, 0.34, 0]) },
      chest: { parent: 'spine', at: HP([0, 0.44, 0]) },
      neck: { parent: 'chest', at: HP([0, 0.54, -0.01]) },
      head: { parent: 'neck', at: HP([0, 0.58, -0.01]) },
      'upperarm.L': { parent: 'chest', at: SHOULDER },
      'forearm.L': { parent: 'upperarm.L', at: ELBOW },
      'hand.L': { parent: 'forearm.L', at: WRIST },
      'upperarm.R': { parent: 'chest', at: mx(SHOULDER) },
      'forearm.R': { parent: 'upperarm.R', at: mx(ELBOW) },
      'hand.R': { parent: 'forearm.R', at: mx(WRIST) },
      staff: { parent: 'hand.R', at: FIST },
      flame: { parent: 'staff', at: FLAME_AT },
      'leg.L': { parent: 'hips', at: HIP },
      'shin.L': { parent: 'leg.L', at: KNEE, split: 0.015 },
      'foot.L': { parent: 'shin.L', at: ANKLE },
      'leg.R': { parent: 'hips', at: mx(HIP) },
      'shin.R': { parent: 'leg.R', at: mx(KNEE), split: 0.015 },
      'foot.R': { parent: 'shin.R', at: mx(ANKLE) },
    });

    // ------------------------------------------------------------------ head (built in its own frame, then shifted by H)
    const head = sdf
      .smoothUnion(
        0.05,
        sdf.ellipsoid([0.19, 0.2, 0.18]).at(0, HEAD_Y, -0.01),
        sdf.ellipsoid([0.178, 0.09, 0.14]).at(0, 0.58, 0.05),
        pair(sdf.sphere(0.078).at(0.108, 0.645, 0.078)),
        sdf.ellipsoid([0.16, 0.038, 0.065]).at(0, 0.748, 0.12),
      )
      .bone('head');
    const faceZ = (x: number, y: number) => sdf.raycast(head, [x, y, 1], [0, 0, -1])![2];
    const nose = sdf.ellipsoid([0.05, 0.036, 0.036]).at(0, 0.655, faceZ(0, 0.655) - 0.008).bone('head');
    const ears = pair(
      sdf
        .cone([0.15, 0.7, -0.01], [0.26, 0.775, -0.05], 0.052, 0.008)
        .smoothSubtract(0.006, sdf.cone([0.16, 0.705, 0.012], [0.25, 0.77, -0.025], 0.03, 0.004))
        .bone('head'),
    );
    const neck = sdf.capsule(HP([0, 0.5, -0.01]), HP([0, 0.62, -0.01]), 0.095).bone('neck');

    // ------------------------------------------------------------------ torso, arms, legs (hunched)
    const trunk = sdf.smoothUnion(
      0.06,
      hunch(sdf.ellipsoid([0.2, 0.16, 0.15]).at(0, 0.47, 0)).bone('chest'),
      hunch(sdf.ellipsoid([0.17, 0.13, 0.14]).at(0, 0.35, 0.02)).bone('spine'),
      pair(hunch(sdf.sphere(0.1).at(0.155, 0.545, -0.02)).bone('chest')),
      pair(hunch(sdf.ellipsoid([0.088, 0.062, 0.05]).at(0.076, 0.48, 0.1)).bone('chest')),
    );
    const trunkShape = hunch(
      sdf.smoothUnion(0.06, sdf.ellipsoid([0.2, 0.16, 0.15]).at(0, 0.47, 0), sdf.ellipsoid([0.17, 0.13, 0.14]).at(0, 0.35, 0.02)),
    );
    const armAt = (s: 1 | -1) => {
      const sh: V3 = s > 0 ? SHOULDER : mx(SHOULDER);
      const el: V3 = s > 0 ? ELBOW : mx(ELBOW);
      const wr: V3 = s > 0 ? WRIST : mx(WRIST);
      const side = s > 0 ? 'L' : 'R';
      return sdf.smoothUnion(
        0.03,
        sdf.cone(sh, el, 0.09, 0.075).bone(`upperarm.${side}`),
        sdf.ellipsoid([0.07, 0.08, 0.068]).at(...lerp(sh, el, 0.5)).bone(`upperarm.${side}`),
        sdf.cone(el, wr, 0.075, 0.068).bone(`forearm.${side}`),
        fistAt(wr, s).bone(`hand.${side}`),
      );
    };
    const legs = pair(sdf.capsule([HIP[0], 0.26, 0], [ANKLE[0], 0.1, 0.01], 0.078).bone('leg.L'));
    const footLocal = sdf
      .smoothUnion(
        0.02,
        sdf.ellipsoid([0.078, 0.052, 0.11]).at(0, 0.045, 0.035),
        ...[-0.045, -0.015, 0.015, 0.045].map((x, i) => sdf.sphere(0.024 - i * 0.001).at(x, 0.03, 0.135 - Math.abs(x) * 0.3)),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const feet = pair(footLocal.rotateY(14).at(ANKLE[0], 0, 0).bone('foot.L'));

    // ------------------------------------------------------------------ face and paint
    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const EYE: V3 = [0.074, 0.69, 0];
    const eyeBall = pair(at(sdf.ellipsoid([0.049, 0.041, 0.07]), EYE[0], EYE[1]));
    const pupil = pair(at(sdf.ellipsoid([0.02, 0.025, 0.07]), EYE[0] - 0.008, EYE[1] - 0.004));
    const lidL = sdf
      .extrude(
        profile.polygon([
          [EYE[0] - 0.06, EYE[1] + 0.014],
          [EYE[0] + 0.06, EYE[1] + 0.04],
          [EYE[0] + 0.06, EYE[1] + 0.08],
          [EYE[0] - 0.06, EYE[1] + 0.08],
        ]),
        0.4,
      )
      .at(0, 0, 0.2);
    const lids = pair(lidL);
    const shine = sdf.union(...[EYE[0], -EYE[0]].map((x) => at(sdf.sphere(0.008), x - 0.002, EYE[1] + 0.004)));
    const MOUTH_Y = 0.604;
    const mouth = sdf.extrude(profile.arc(0.06, 0.013, 45, 135), 0.4).at(0, MOUTH_Y - 0.06, 0.2);
    const nostrils = pair(sdf.sphere(0.009).at(0.02, 0.64, faceZ(0, 0.64) + 0.012));
    // White paint: a slanted mask around each eye, a bar across the brow, a stripe down the nose.
    const paintEye = pair(at(sdf.ellipsoid([0.1, 0.058, 0.09]).rotateZ(14), 0.09, 0.694));
    const paintBrow = sdf.extrude(profile.rect([0.06, 0.05], 0.012), 0.4).at(0, 0.74, 0.2);
    // One band across both eyes, 0.06 tall, and a nose stripe 0.02 wide down to the upper lip.
    const paintBand = sdf.extrude(profile.rect([0.3, 0.06], 0.02), 0.4).at(0, 0.694, 0.2);
    const paintNose = sdf.extrude(profile.rect([0.022, 0.165], 0.008), 0.4).at(0, 0.688, 0.2);
    const headSkin = sdf
      .smoothUnion(0.015, head, nose, ears)
      .paintWhere(paintEye, C.bone, 0.003)
      .paintWhere(paintBrow, C.bone, 0.003)
      .paintWhere(paintBand, C.bone, 0.003)
      .paintWhere(paintNose, C.bone, 0.003)
      .paintWhere(eyeBall, T.eye, 0.002)
      .paintWhere(pupil, C.pupil, 0.002)
      .paintWhere(shine, '#ffffff', 0.002)
      .paintWhere(lids.intersect(eyeBall.round(0.006)), T.lid, 0.002)
      .paintWhere(mouth, T.mouth, 0.003)
      .paintWhere(nostrils, T.mouth, 0.004);
    const skin = sdf
      .smoothUnion(0.04, H(headSkin), neck)
      .smoothUnion(0.05, trunk)
      .union(armAt(1), armAt(-1))
      .smoothUnion(0.03, legs)
      .union(feet);
    k.body('skin', skin, { color: T.skin, roughness: 0.55, textureDensity: 2 });

    // ------------------------------------------------------------------ hood headdress
    const hoodRegion = sdf.smoothUnion(
      0.03,
      sdf.halfSpace([0, -1, 0.65], -0.7 / Math.hypot(1, 0.65)),
      sdf.halfSpace([-1.6, -1, 0], -0.96 / Math.hypot(1.6, 1)),
      sdf.halfSpace([1.6, -1, 0], -0.96 / Math.hypot(1.6, 1)),
    );
    // Horn nubs at the temples (rooted in the hood, 30 degrees above horizontal) and a peak at the back.
    const NUB_A: V3 = [0.15, 0.83, 0.0];
    const NUB_DIR: V3 = [Math.cos(30 * DEG), Math.sin(30 * DEG), 0];
    const NUB_LEN = 0.1;
    const NUB_B: V3 = [NUB_A[0] + NUB_DIR[0] * NUB_LEN, NUB_A[1] + NUB_DIR[1] * NUB_LEN, NUB_A[2]];
    const nubs = pair(sdf.cone(NUB_A, NUB_B, 0.048, 0.022));
    const peak = sdf.cone([0, 0.84, -0.12], [0, 0.955, -0.185], 0.06, 0.014);
    const hood = sdf
      .smoothUnion(0.03, head.round(0.022), sdf.ellipsoid([0.14, 0.05, 0.12]).at(0, 0.87, -0.01))
      .smoothIntersect(0.004, hoodRegion)
      .smoothSubtract(0.004, sdf.ellipsoid([0.15, 0.17, 0.14]).at(0, 0.65, 0.19))
      .smoothUnion(0.015, nubs, peak)
      .paintFn((x, y, z, base) => {
        const f = noise.fbm(x * 30, y * 30, z * 30, 2);
        return f > 0.2 ? ([base[0] * 0.8, base[1] * 0.8, base[2] * 0.8] as const) : base;
      });
    k.body('hood', H(hood).bone('head'), {
      color: C.hood,
      roughness: 0.9,
      detail: 0.006,
      bump: (x, y, z) => 0.0015 * noise.fbm(x * 40, y * 40, z * 40, 2),
    });
    // Two rope rings around each horn nub.
    const nubRings = pair(
      sdf.union(
        ...[0.3, 0.62].map((t) => {
          const c = lerp(NUB_A, NUB_B, t);
          return sdf.torus(0.048 + (0.022 - 0.048) * t + 0.004, 0.009).rotateZ(-60).at(...c);
        }),
      ),
    );
    k.body('horn-rings', H(nubRings).bone('head'), { color: '#4a3426', roughness: 0.85, detail: 0.005 });
    const bandY = 0.81;
    const band = head.round(0.026).smoothIntersect(0.006, sdf.box([0.7, 0.03, 0.7], 0.008).at(0, bandY, 0));
    k.body('band', H(band).bone('head'), { color: C.band, roughness: 0.85, detail: 0.006 });

    // The small skull on the brow, the bone sticks, and their feathers.
    const browZ = sdf.raycast(hood, [0, 0.84, 1], [0, 0, -1])![2];
    const skullBrow = sdf
      .smoothUnion(
        0.008,
        sdf.ellipsoid([0.055, 0.05, 0.052]),
        sdf.ellipsoid([0.032, 0.024, 0.034]).at(0, -0.042, 0.032),
      )
      .smoothSubtract(
        0.004,
        sdf.sphere(0.016).at(0.023, -0.002, 0.042),
        sdf.sphere(0.016).at(-0.023, -0.002, 0.042),
        sdf.ellipsoid([0.007, 0.011, 0.012]).at(0, -0.034, 0.06),
      )
      .union(...[-0.018, -0.006, 0.006, 0.018].map((x) => sdf.box([0.011, 0.02, 0.009], 0.003).at(x, -0.068, 0.05)))
      .scale(1.2)
      .rotateX(-10)
      .at(0, 0.842, browZ + 0.008);
    const STICK_BASE: V3 = [0.075, 0.885, -0.01];
    const STICK_TIP: V3 = [STICK_BASE[0] + 0.17 * Math.sin(22 * DEG), STICK_BASE[1] + 0.17 * Math.cos(22 * DEG), -0.01];
    const sticks = pair(sdf.capsule(STICK_BASE, STICK_TIP, 0.017));
    k.body('bone-head', H(sdf.union(skullBrow, sticks)).bone('head'), { color: C.bone, roughness: 0.55, detail: 0.004 });
    // A barbed feather: a leaf outline with 6 shallow notches along each edge, a dark quill line, white tips.
    const FL = 0.24;
    const FW = 0.072;
    const FX0 = -0.1;
    const barbTop: [number, number][] = [[FX0, 0]];
    for (let n = 0; n < 6; n++) {
      const t0 = (n + 0.2) / 6;
      const t1 = (n + 0.78) / 6;
      barbTop.push([FX0 + FL * t0, FW * Math.sin(Math.PI * Math.pow(t0, 0.7))]);
      barbTop.push([FX0 + FL * t1, FW * 0.62 * Math.sin(Math.PI * Math.pow(t1, 0.7))]);
    }
    barbTop.push([FX0 + FL, 0]);
    const barbBottom = barbTop.slice(1, -1).reverse().map(([x, y]) => [x, -y] as [number, number]);
    const featherLocal = sdf
      .extrude(profile.polygon([...barbTop, ...barbBottom]), 0.016, 0.004)
      .paintFn((x, y, _z, base) => {
        if (x > 0.105) return rgb(C.bone);
        if (Math.abs(y) < 0.0045 && x > -0.09) return rgb('#3a2c22');
        return base;
      });
    const FANG = 56;
    const featherAt = featherLocal.rotateZ(FANG).at(STICK_TIP[0] + Math.cos(FANG * DEG) * 0.09, STICK_TIP[1] + Math.sin(FANG * DEG) * 0.09 - 0.005, -0.01);
    k.body('feathers', H(featherAt.mirror('x', 0)).bone('head'), { color: C.feather, roughness: 0.75, detail: 0.004 });

    // ------------------------------------------------------------------ beard, brows
    const jawFront = faceZ(0, 0.52);
    const beardNoise = (x: number, y: number, z: number) => noise.fbm(x * 45, y * 35, z * 45, 2);
    // Two rows of overlapping grey tufts hanging from the jaw line, then three thin strands below.
    const rowA = [-0.12, -0.06, 0, 0.06, 0.12].map((x) =>
      sdf.ellipsoid([0.05, 0.08, 0.04]).at(x, 0.5 - Math.abs(x) * 0.12, jawFront - 0.005 - Math.abs(x) * 0.5),
    );
    const rowB = [-0.09, -0.03, 0.03, 0.09].map((x) =>
      sdf.ellipsoid([0.05, 0.08, 0.04]).at(x, 0.43 - Math.abs(x) * 0.08, jawFront + 0.01 - Math.abs(x) * 0.45),
    );
    const strandsBeard = [-0.045, 0, 0.045].map((x, i) =>
      sdf.chain(
        [
          [x, 0.43, jawFront + 0.03, 0.017],
          [x * 1.1, 0.4, jawFront + 0.035, 0.012],
          [x * 1.2, 0.35 - (i === 1 ? 0.015 : 0), jawFront + 0.04, 0.006],
        ],
        0.008,
      ),
    );
    const beard = sdf
      .smoothUnion(0.015, ...rowA, ...rowB, sdf.ellipsoid([0.13, 0.05, 0.05]).at(0, 0.54, jawFront - 0.02), ...strandsBeard)
      .displace(0.006, beardNoise, 1.5);
    const browAt = (x: number, y: number): V3 => [x, y, faceZ(Math.abs(x), y) - 0.006];
    const brows = pair(
      sdf.chain(
        [
          [...browAt(EYE[0] + 0.062, EYE[1] + 0.064), 0.018],
          [...browAt(EYE[0] + 0.008, EYE[1] + 0.047), 0.023],
          [...browAt(EYE[0] - 0.05, EYE[1] + 0.022), 0.019],
        ],
        0.008,
      ),
    );
    k.body('beard', H(sdf.union(beard, brows)).bone('head'), {
      color: T.hair,
      roughness: 0.6,
      detail: 0.005,
      bump: (x, y, z) => 0.002 * noise.fbm(x * 90, y * 40, z * 90, 2),
    });

    // ------------------------------------------------------------------ one tusk (the left)
    const tuskPath = [
      [0.062, MOUTH_Y - 0.002, 0.021, 0.0],
      [0.075, MOUTH_Y - 0.026, 0.021, 0.024],
      [0.085, MOUTH_Y - 0.05, 0.017, 0.042],
      [0.09, MOUTH_Y - 0.068, 0.011, 0.055],
    ].map(([x, y, r, lift]) => [x!, y!, faceZ(x!, y!) + lift!, r!] as [number, number, number, number]);
    const tusk = sdf.chain(tuskPath, 0.012).intersect(sdf.halfSpace([0, 1, 0], MOUTH_Y - 0.002));
    const tuskRoot = rgb('#b9a57a');
    const tuskTip = rgb(C.tusk);
    k.body(
      'tusk',
      H(
        tusk.paintFn((_x, y) => {
          const t = 1 - smooth01(MOUTH_Y - 0.075, MOUTH_Y, y);
          return [tuskRoot[0] + (tuskTip[0] - tuskRoot[0]) * t, tuskRoot[1] + (tuskTip[1] - tuskRoot[1]) * t, tuskRoot[2] + (tuskTip[2] - tuskRoot[2]) * t];
        }),
      ).bone('head'),
      { color: C.tusk, roughness: 0.4, detail: 0.004 },
    );

    // ------------------------------------------------------------------ fur mantle, bone necklace
    const furFn = (x: number, y: number, z: number) =>
      0.55 * Math.sin(Math.atan2(x, z) * 14 + noise.fbm(x * 30, y * 15, z * 30, 2) * 3) + 0.45 * noise.fbm(x * 60, y * 25, z * 60, 2);
    const mantle = hunch(
      sdf
        .smoothUnion(
          0.03,
          sdf.torus(0.19, 0.068).scale([1.12, 1, 0.7]).at(0, 0.55, -0.045),
          pair(sdf.ellipsoid([0.075, 0.058, 0.095]).rotateZ(-22).at(0.232, 0.545, -0.01)),
          pair(sdf.ellipsoid([0.05, 0.07, 0.04]).rotateZ(-10).at(0.24, 0.5, 0.06)),
          sdf.ellipsoid([0.15, 0.09, 0.05]).at(0, 0.52, -0.13),
        )
        .displace(0.012, furFn, 2),
    );
    k.body('mantle', mantle.paintFn((x, y, z, base) => (furFn(x, y, z) > 0.3 ? rgb(C.furDark) : base)), {
      color: C.fur,
      roughness: 0.95,
      bone: 'chest',
      detail: 0.008,
    });
    const beads = sdf.union(
      ...Array.from({ length: 13 }, (_, i) => {
        const x = -0.135 + i * 0.0225;
        const y = 0.55 - 0.165 * (1 - (x / 0.15) ** 2);
        const hit = sdf.raycast(trunkShape, [x, y, 1], [0, 0, -1]);
        const z = hit ? hit[2] + 0.021 : 0.165;
        return sdf.sphere(0.0165).at(x, y, z);
      }),
    );
    k.body('beads', beads, { color: C.bead, roughness: 0.5, bone: 'chest', detail: 0.005 });

    // ------------------------------------------------------------------ belt, rope, charm
    const beltY = 0.325;
    const belt = trunkShape.round(0.016).smoothIntersect(0.006, sdf.box([0.6, 0.06, 0.6], 0.008).at(0, beltY, 0));
    k.body('belt', belt, { color: C.belt, roughness: 0.7, bone: 'spine' });
    const rope = trunkShape
      .round(0.026)
      .smoothIntersect(0.006, sdf.box([0.6, 0.024, 0.6], 0.006).at(0, beltY + 0.028, 0));
    k.body('rope', rope, {
      color: C.rope,
      roughness: 0.85,
      bone: 'spine',
      detail: 0.006,
      bump: (x, y, z) => 0.002 * Math.sin(Math.atan2(x, z) * 60 + y * 200),
    });
    const charm = sdf.union(
      sdf.sphere(0.014).at(0, beltY + 0.028, 0.2),
      sdf.cone([0.012, beltY + 0.02, 0.205], [0.02, beltY - 0.07, 0.212], 0.014, 0.005),
      sdf.cone([-0.012, beltY + 0.02, 0.205], [-0.016, beltY - 0.06, 0.212], 0.012, 0.005),
    );
    k.body('charm', charm, { color: C.bone, roughness: 0.5, bone: 'spine', detail: 0.004 });

    // ------------------------------------------------------------------ hide skirt with a ragged hem
    const skirtCone = (grow: number, top: number) =>
      sdf
        .revolve(
          profile.polygon([
            [0, top],
            [0.182 + grow, top],
            [0.182 + grow, 0.33],
            [0.21 + grow, 0.26],
            [0.238 + grow, 0.165],
            [0, 0.165],
          ]),
        )
        .scale([1, 1, 0.84])
        .at(0, 0, 0.018);
    const clothFolds = (x: number, y: number, z: number) =>
      Math.sin(Math.atan2(x, z) * 11 + noise.fbm(x * 12, y * 4, z * 12, 2) * 2) * Math.min(1, Math.max(0, (0.31 - y) / 0.12));
    const tearCut = (i: number, w: number, top: number) =>
      sdf
        .extrude(
          profile.polygon([
            [-w, 0.08],
            [w, 0.08],
            [0, top],
          ]),
          0.3,
        )
        .at(0, 0, 0.25)
        .rotateY(i);
    const tears = sdf.union(
      ...Array.from({ length: 14 }, (_, i) =>
        tearCut(i * 25.7 + (noise.random(i, 7, 1) - 0.5) * 10, 0.024 + noise.random(i, 7, 2) * 0.016, 0.2 + noise.random(i, 7, 3) * 0.07),
      ),
    );
    const skirt = skirtCone(0, 0.33).subtract(skirtCone(-0.013, 0.45)).displace(0.009, clothFolds, 1.5).subtract(tears);
    const hideDark = shadeOf(C.hide, C.hideDark);
    const loin = sdf
      .union(
        skirt.intersect(sdf.halfSpace([0, -1, 0], -0.25)).bone('hips'),
        skirt.intersect(sdf.halfSpace([0, 1, 0], 0.3)).intersect(sdf.halfSpace([-1, 0, 0], 0)).bone('leg.L'),
        skirt.intersect(sdf.halfSpace([0, 1, 0], 0.3)).intersect(sdf.halfSpace([1, 0, 0], 0)).bone('leg.R'),
      )
      .paintFn((x, y, z, base) => {
        const a = Math.atan2(x, z);
        const streak = noise.fbm(a * 7, y * 5, 0.3, 2);
        const hem = Math.min(1, Math.max(0, (0.25 - y) / 0.07));
        const t = Math.min(1, Math.max(0, hem * 0.8 + (streak > 0.15 ? 0.4 : streak < -0.3 ? -0.2 : 0)));
        return [base[0] + hideDark[0] * t, base[1] + hideDark[1] * t, base[2] + hideDark[2] * t];
      });
    k.body('skirt', loin, { color: T.cloth, roughness: 0.88, detail: 0.007 });

    // ------------------------------------------------------------------ the staff
    const SX = FIST[0] - 0.035;
    const SZ = FIST[2];
    const ys = [0.027, 0.2, 0.4, 0.6, 0.8, 0.98];
    const rs = [0.027, 0.031, 0.026, 0.032, 0.028, 0.034];
    const stPts = ys.map((y, i) => [SX + 0.011 * Math.sin(i * 2.1 + 0.4), y, SZ + 0.011 * Math.cos(i * 1.7), rs[i]!] as [number, number, number, number]);
    const knobs = [
      [0.47, 0.03, 0.0],
      [0.68, -0.025, 0.012],
      [0.9, 0.02, -0.014],
    ].map(([y, dx, dz]) => sdf.sphere(0.04).scale([1, 1.3, 1]).at(SX + dx!, y!, SZ + dz!));
    const staffWood = sdf
      .smoothUnion(0.03, sdf.chain(stPts, 0.02), ...knobs, sdf.cone([SX, 1.0, SZ], [SX, STAFF_TOP + 0.03, SZ], 0.034, 0.056))
      .displace(0.006, (x, y, z) => (y > 0.72 && y < 1.0 ? Math.sin(y * 150 + Math.atan2(x - SX, z - SZ) * 2.5) : 0), 1.4);
    k.body('staff-wood', staffWood, {
      color: C.wood,
      roughness: 0.8,
      bone: 'staff',
      detail: 0.005,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 40, y * 12, z * 40, 2),
    });
    const skullLocal = sdf
      .smoothUnion(
        0.012,
        sdf.ellipsoid([0.085, 0.08, 0.082]),
        sdf.ellipsoid([0.055, 0.03, 0.055]).at(0, -0.066, 0.03),
      )
      .smoothSubtract(
        0.006,
        sdf.sphere(0.024).at(0.036, -0.005, 0.062),
        sdf.sphere(0.024).at(-0.036, -0.005, 0.062),
        sdf.ellipsoid([0.01, 0.017, 0.014]).at(0, -0.04, 0.078),
      )
      .union(...[-0.026, -0.0087, 0.0087, 0.026].map((x) => sdf.box([0.017, 0.022, 0.012], 0.004).at(x, -0.088, 0.062 - Math.abs(x) * 0.5)));
    const skullPose = (s: sdf.Shape) => s.at(SX, SKULL_Y, SZ);
    k.body('staff-skull', skullPose(skullLocal), {
      color: C.glowBase,
      roughness: 0.4,
      emissive: C.glow,
      emissiveIntensity: 1.8,
      bone: 'staff',
      detail: 0.004,
    });
    k.body(
      'skull-pits',
      skullPose(sdf.union(sdf.sphere(0.02).at(0.036, -0.005, 0.038), sdf.sphere(0.02).at(-0.036, -0.005, 0.038), sdf.ellipsoid([0.007, 0.013, 0.01]).at(0, -0.04, 0.062))),
      { color: '#07120a', roughness: 0.9, bone: 'staff', detail: 0.004 },
    );
    const fy = SKULL_Y + 0.06;
    const flame = sdf.union(
      sdf.cone([SX, fy, SZ], [SX, fy + 0.15, SZ - 0.005], 0.036, 0.008),
      sdf.cone([SX + 0.032, fy, SZ], [SX + 0.055, fy + 0.095, SZ], 0.026, 0.007),
      sdf.cone([SX - 0.032, fy, SZ], [SX - 0.055, fy + 0.08, SZ], 0.026, 0.007),
    );
    k.body('flame-glow', flame, {
      color: C.glowBase,
      roughness: 0.3,
      emissive: C.glow,
      emissiveIntensity: 1.8,
      opacity: 0.85,
      bone: 'flame',
      detail: 0.004,
    });

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop, keys, reach, orient } = motion;
    const LEG = 0.19;
    const RW = mx(WRIST);
    const LW = WRIST;
    const ARM_R = { root: mx(SHOULDER), mid: mx(ELBOW), end: mx(WRIST) };
    const ARM_L = { root: SHOULDER, mid: ELBOW, end: WRIST };
    const deg = (r: number) => r / DEG;
    const shake = (p: number, a: number, len: number, n: number) => (p < a ? 0 : Math.exp((-(p - a) / len) * 3) * Math.sin(((p - a) / len) * Math.PI * n));
    const UPV: V3 = [0, 1, 0];
    // The skull's facing (+Z at rest) carried along by the minimal turn from up to `dir`.
    const upFor = (dir: V3): V3 => {
      const d = norm(dir);
      const axis: V3 = [-d[2], 0, d[0]]; // up x d
      const s = Math.hypot(axis[0], axis[2]);
      if (s < 1e-6) return [0, 0, 1];
      const ang = Math.atan2(s, d[1]);
      const a: V3 = [axis[0] / s, 0, axis[2] / s];
      const c = Math.cos(ang);
      const sn = Math.sin(ang);
      const v: V3 = [0, 0, 1];
      const cr: V3 = [a[1] * v[2] - a[2] * v[1], a[2] * v[0] - a[0] * v[2], a[0] * v[1] - a[1] * v[0]];
      const dt = a[0] * v[0] + a[1] * v[1] + a[2] * v[2];
      return [v[0] * c + cr[0] * sn + a[0] * dt * (1 - c), v[1] * c + cr[1] * sn + a[1] * dt * (1 - c), v[2] * c + cr[2] * sn + a[2] * dt * (1 - c)];
    };
    const STAFF_REST = { dir: UPV, up: [0, 0, 1] as V3 };
    /** The right arm holds the staff with the wrist at `wrist` and the staff along `dir`; `slide` moves it along its axis. */
    const holdR = (wrist: V3, dir: V3, slide = 0, pole: V3 = [-0.8, 0.2, -0.3]) => {
      const a = reach(ARM_R, wrist, pole);
      const d = norm(dir);
      const hand = orient([a.upper, a.lower], STAFF_REST, { dir: d, up: upFor(d) });
      return {
        'upperarm.R': { rotate: a.upper },
        'forearm.R': { rotate: a.lower },
        'hand.R': { rotate: hand },
        staff: { move: [0, slide, 0] as V3 },
      };
    };
    const armL = (wrist: V3, pole: V3 = [0.8, 0.2, -0.3]) => {
      const a = reach(ARM_L, wrist, pole);
      return { 'upperarm.L': { rotate: a.upper }, 'forearm.L': { rotate: a.lower } };
    };
    // Keep the feet planted while the hips move `hz` along Z.
    const plant = (hz: number, extraY = 0) => {
      const ang = deg(Math.atan2(hz, LEG));
      return {
        hips: { move: [0, -legDrop(LEG, ang) - extraY, hz] as V3 },
        'leg.L': { rotate: [ang, 0, 0] as V3 },
        'leg.R': { rotate: [ang, 0, 0] as V3 },
        'foot.L': { rotate: [-ang, 0, 0] as V3 },
        'foot.R': { rotate: [-ang, 0, 0] as V3 },
      };
    };
    const flick = (p: number, boost = 0) => ({
      scale: [1 + 0.06 * wave(p, 3) + 0.5 * boost, 1 + 0.14 * wave(p, 4, 0.3) + 0.8 * boost, 1 + 0.06 * wave(p, 3, 0.5) + 0.5 * boost] as V3,
    });

    k.animation('idle', {
      duration: 2.6,
      pose: (_t, p) => ({
        hips: { move: [0, -0.004 * bump(p), 0] },
        chest: { rotate: [1.8 * wave(p), 0, 0], scale: [1 + 0.015 * bump(p), 1, 1 + 0.015 * bump(p)] },
        neck: { rotate: [-2 * wave(p), 0, 0] },
        head: { rotate: [0, 6 * wave(p, 1, 0.25), 2 * wave(p, 1, 0.1)] },
        'upperarm.L': { rotate: [2 * wave(p, 1, 0.1), 0, 4 * bump(p)] },
        'forearm.L': { rotate: [-5 * bump(p), 0, 0] },
        flame: flick(p),
      }),
    });

    const stride = (duration: number, step: number, footLift: number, duty: number, bob: number, armSwing: number, lean: number, sway: number, staffLift: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        const hipsTurn = [0, 6 * s, sway * s] as const;
        const legs = motion.gait(p - 0.25, { hip: HIP, knee: KNEE, ankle: ANKLE }, {
          stride: step,
          lift: footLift,
          duty,
          bob,
          roll: 8,
          heel: SOLE_HEEL,
          toe: SOLE_TOE,
          hips: { at: [0, 0.26, 0], rotate: hipsTurn },
        });
        return {
          ...legs.pose,
          hips: { move: [0, legs.hipsY, 0] as const, rotate: hipsTurn },
          spine: { rotate: [lean, 0, -sway * 0.6 * s] as const },
          chest: { rotate: [lean * 0.5, -10 * s, 0] as const },
          head: { rotate: [-lean, 5 * s, 0] as const },
          'upperarm.L': { rotate: [armSwing * s, 0, 4] as const },
          'forearm.L': { rotate: [-armSwing * 0.4 - armSwing * 0.3 * Math.max(0, -s), 0, 0] as const },
          'upperarm.R': { rotate: [-armSwing * 0.18 * s, 0, -3] as const },
          staff: { move: [0, staffLift + 0.025 * Math.max(0, wave(p, 2, 0.25)), 0] as const },
          flame: flick(p),
        };
      },
    });
    k.animation('walk', stride(1.0, 0.11, 0.025, 0.62, 0.008, 18, 4, 4, 0.05));
    k.animation('run', stride(0.6, 0.16, 0.045, 0.42, 0.03, 34, 11, 3, 0.1));

    // ------------------------------------------------------------------ attack: the staff lifts, then thrusts forward (a bolt cast)
    k.animation('attack', {
      duration: 1.25,
      loop: false,
      pose: (_t, p) => {
        const wrist = keys(p, [[0, RW], [0.2, [-0.31, 0.5, 0.1]], [0.4, [-0.31, 0.66, -0.02]], [0.5, [-0.33, 0.6, 0.12]], [0.56, [-0.27, 0.53, 0.28]], [0.76, [-0.27, 0.53, 0.28]], [0.92, [-0.29, 0.4, 0.14]], [1, RW]] as const, 'smooth');
        const dir = keys(p, [[0, UPV], [0.2, [-0.15, 0.9, -0.3]], [0.4, [-0.24, 0.7, -0.66]], [0.5, [-0.1, 0.85, 0.35]], [0.56, [-0.05, 0.22, 0.97]], [0.76, [-0.05, 0.25, 0.96]], [0.92, [-0.08, 0.75, 0.3]], [1, UPV]] as const, 'smooth');
        const slide = keys(p, [[0, 0], [0.4, 0], [0.5, 0.08], [0.56, 0.22], [0.76, 0.22], [0.92, 0.05], [1, 0]] as const);
        const sh = shake(p, 0.56, 0.16, 5);
        const spineX = keys(p, [[0, 0], [0.4, -6], [0.55, 7], [0.76, 6], [1, 0]] as const);
        const spineY = keys(p, [[0, 0], [0.4, -10], [0.55, 8], [0.76, 6], [1, 0]] as const);
        const chestX = keys(p, [[0, 0], [0.4, -4], [0.55, 5], [0.76, 4], [1, 0]] as const) + 2 * sh;
        const chestY = keys(p, [[0, 0], [0.4, -12], [0.55, 10], [0.76, 8], [1, 0]] as const);
        const hz = keys(p, [[0, 0], [0.4, -0.02], [0.55, 0.03], [0.76, 0.03], [1, 0]] as const);
        const flare = keys(p, [[0, 0], [0.5, 0], [0.57, 1], [0.76, 0.6], [0.95, 0]] as const);
        const offW = keys(p, [[0, LW], [0.2, [0.34, 0.45, 0.0]], [0.4, [0.36, 0.6, -0.1]], [0.56, [0.27, 0.53, 0.22]], [0.76, [0.27, 0.53, 0.22]], [1, LW]] as const);
        return {
          ...plant(hz),
          spine: { rotate: [spineX, spineY, 0] },
          chest: { rotate: [chestX, chestY, 0] },
          head: { rotate: [-(spineX + chestX) * 0.5 - 2 * sh, -(spineY + chestY) * 0.7, 0] },
          ...holdR(wrist, dir, slide),
          ...armL(offW),
          flame: flick(p, flare),
        };
      },
    });

    // ------------------------------------------------------------------ attack2: both arms up, then a slam with the staff butt
    k.animation('attack2', {
      duration: 1.4,
      loop: false,
      pose: (_t, p) => {
        const wrist = keys(p, [[0, RW], [0.3, [-0.36, 0.74, 0.05]], [0.46, [-0.36, 0.75, 0.04]], [0.55, [-0.29, 0.322, 0.17]], [0.78, [-0.29, 0.322, 0.17]], [0.95, [-0.33, 0.32, 0.09]], [1, RW]] as const);
        const dir = keys(p, [[0, UPV], [0.3, [-0.2, 1, -0.1]], [0.46, [-0.2, 1, -0.15]], [0.55, [-0.06, 1, 0.12]], [0.78, [-0.06, 1, 0.12]], [1, UPV]] as const);
        const sh = shake(p, 0.55, 0.12, 5);
        const hz = keys(p, [[0, 0], [0.3, -0.02], [0.46, -0.02], [0.55, 0.035], [0.78, 0.03], [1, 0]] as const);
        const spineX = keys(p, [[0, 0], [0.3, -6], [0.46, -7], [0.55, 11], [0.78, 9], [1, 0]] as const);
        const chestX = keys(p, [[0, 0], [0.3, -8], [0.46, -9], [0.55, 10], [0.78, 9], [1, 0]] as const) + 3 * sh;
        const flare = keys(p, [[0, 0], [0.55, 0], [0.6, 1.2], [0.85, 0.3], [1, 0]] as const);
        const offW = keys(p, [[0, LW], [0.3, [0.36, 0.74, 0.05]], [0.46, [0.36, 0.75, 0.04]], [0.55, [0.29, 0.3, 0.17]], [0.78, [0.29, 0.3, 0.17]], [0.95, [0.33, 0.32, 0.09]], [1, LW]] as const);
        return {
          ...plant(hz, 0.004 * Math.abs(sh)),
          spine: { rotate: [spineX, 0, 0] },
          chest: { rotate: [chestX, 0, 0] },
          neck: { rotate: [keys(p, [[0, 0], [0.46, -8], [0.55, 6], [1, 0]] as const), 0, 0] },
          head: { rotate: [-(spineX + chestX) * 0.5 - 3 * sh, 0, 0] },
          ...holdR(wrist, dir, 0),
          ...armL(offW),
          flame: flick(p, flare),
        };
      },
    });

    // ------------------------------------------------------------------ roar: the staff raised, a war cry
    k.animation('roar', {
      duration: 1.8,
      loop: false,
      pose: (_t, p) => {
        const rise = keys(p, [[0, 0], [0.16, -0.5], [0.3, 1], [0.8, 1], [1, 0]] as const);
        const lift = Math.max(0, rise);
        const crouch = Math.max(0, -rise);
        const tremble = p > 0.3 && p < 0.82 ? wave((p - 0.3) / 0.52, 7) * Math.sin(((p - 0.3) / 0.52) * Math.PI) : 0;
        const wrist = keys(p, [[0, RW], [0.16, [-0.34, 0.32, 0.08]], [0.3, [-0.37, 0.72, 0.04]], [0.8, [-0.37, 0.72, 0.04]], [1, RW]] as const);
        const dir = keys(p, [[0, UPV], [0.16, UPV], [0.3, [-0.22, 1, 0]], [0.8, [-0.22, 1, 0]], [1, UPV]] as const);
        const offW = keys(p, [[0, LW], [0.16, [0.28, 0.33, 0.1]], [0.3, [0.38, 0.66, 0.06]], [0.8, [0.38, 0.66, 0.06]], [1, LW]] as const);
        return {
          hips: { move: [0, -0.025 * crouch - 0.003 * Math.abs(tremble), 0] },
          spine: { rotate: [10 * crouch - 6 * lift, 0, 0] },
          chest: { rotate: [8 * crouch - 10 * lift + 1.5 * tremble, 2 * tremble, 0], scale: [1 + 0.04 * lift, 1, 1 + 0.03 * lift] },
          neck: { rotate: [6 * crouch - 8 * lift, 0, 0] },
          head: { rotate: [8 * crouch - 12 * lift + 2 * tremble, 3 * tremble, 0] },
          ...holdR(wrist, dir, 0),
          ...armL(offW),
          'leg.L': { rotate: [0, 0, 4 * lift] },
          'leg.R': { rotate: [0, 0, -4 * lift] },
          flame: flick(p, lift * 0.9),
        };
      },
    });

    // ------------------------------------------------------------------ hit
    k.animation('hit', {
      duration: 0.45,
      loop: false,
      pose: (_t, p) => {
        const r = keys(p, [[0, 0], [0.16, 1], [0.38, 0.8], [1, 0]] as const);
        const back = -0.025 * r;
        const legL = deg(Math.atan2(back, 0.19));
        return {
          hips: { move: [0, -legDrop(LEG, 12 * r), back], rotate: [0, 5 * r, 0] },
          spine: { rotate: [-8 * r, 0, 3 * r] },
          chest: { rotate: [-9 * r, 7 * r, 0] },
          neck: { rotate: [-5 * r, 0, 0] },
          head: { rotate: [-14 * r, -9 * r, 6 * r] },
          'upperarm.L': { rotate: [12 * r, 0, 24 * r] },
          'forearm.L': { rotate: [-22 * r, 0, 0] },
          'upperarm.R': { rotate: [10 * r, 0, 4 * r] },
          'forearm.R': { rotate: [-12 * r, 0, 0] },
          staff: { move: [0, 0.04 * r, 0] },
          'leg.L': { rotate: [legL, 0, 0] },
          'foot.L': { rotate: [-legL, 0, 0] },
          'leg.R': { rotate: [12 * r, 0, 0] },
          'foot.R': { rotate: [-12 * r, 0, 0] },
          flame: flick(p, 0.6 * r),
        };
      },
    });

    // ------------------------------------------------------------------ death
    k.animation('death', {
      duration: 1.5,
      loop: false,
      pose: (_t, p) => {
        const fall = keys(p, [[0, 0], [0.2, -8], [0.4, 3], [0.54, -40], [0.66, -88], [0.72, -84], [0.8, -88], [1, -88]] as const);
        const hipsY = keys(p, [[0, 0], [0.4, 0], [0.54, -0.006], [0.66, -0.05], [0.72, -0.038], [0.8, -0.05], [1, -0.05]] as const);
        const hipsZ = keys(p, [[0, 0], [0.2, -0.035], [0.4, -0.02], [0.66, -0.13], [1, -0.13]] as const);
        const legs = keys(p, [[0, 0], [0.2, 4], [0.4, -3], [0.54, 36], [0.66, 50], [1, 50]] as const);
        const stepR = keys(p, [[0, 0], [0.2, 14], [0.4, 4], [0.54, 0], [1, 0]] as const);
        const spill = keys(p, [[0, 0], [0.54, 0], [0.62, 1], [1, 1]] as const);
        return {
          hips: { move: [0, hipsY, hipsZ], rotate: [fall, keys(p, [[0, 0], [0.2, 8], [0.66, -6], [1, -6]] as const), 0] },
          spine: { rotate: [keys(p, [[0, 0], [0.2, -10], [0.4, 8], [0.56, 6], [0.66, -4], [1, 0]] as const), 0, 0] },
          chest: { rotate: [keys(p, [[0, 0], [0.2, -8], [0.4, 6], [0.66, -2], [1, 0]] as const), keys(p, [[0, 0], [0.2, 10], [0.5, -6], [1, 0]] as const), 0] },
          neck: { rotate: [keys(p, [[0, 0], [0.2, -8], [0.4, 8], [0.6, 16], [0.7, -6], [0.8, 0], [1, 0]] as const), 0, 0] },
          head: { rotate: [keys(p, [[0, 0], [0.2, -14], [0.4, 10], [0.6, 14], [0.7, -10], [0.8, 0], [1, 0]] as const), keys(p, [[0, 0], [0.7, 0], [0.9, 28], [1, 28]] as const), 0] },
          'upperarm.L': { rotate: [keys(p, [[0, 0], [0.2, 12], [0.4, -8], [0.58, -55], [0.7, 30], [1, 34]] as const), 0, keys(p, [[0, 0], [0.2, 28], [0.4, 12], [0.58, 40], [0.7, 60], [1, 62]] as const)] },
          'forearm.L': { rotate: [keys(p, [[0, 0], [0.2, -30], [0.58, -20], [0.7, -6], [1, -8]] as const), 0, 0] },
          'upperarm.R': { rotate: [keys(p, [[0, 0], [0.2, 10], [0.4, -6], [0.58, -45], [0.7, 30], [1, 34]] as const), 0, keys(p, [[0, 0], [0.2, -22], [0.4, -10], [0.58, -35], [0.7, -58], [1, -60]] as const)] },
          'forearm.R': { rotate: [keys(p, [[0, 0], [0.2, -20], [0.58, -15], [0.7, 0], [1, 0]] as const), 0, 0] },
          'hand.R': { rotate: [keys(p, [[0, 0], [0.62, 0], [0.8, 40], [1, 40]] as const), 0, 0] },
          'leg.L': { rotate: [legs + keys(p, [[0, 0], [0.2, -6], [0.4, 0]] as const), 0, 6 * spill] },
          'leg.R': { rotate: [legs + stepR, 0, -8 * spill] },
          'foot.L': { rotate: [-keys(p, [[0, 0], [0.4, 0], [0.66, 12], [1, 12]] as const), 0, 0] },
          'foot.R': { rotate: [-stepR * 0.8, 0, 0] },
          staff: { rotate: [58 * keys(p, [[0, 0], [0.55, 0], [0.8, 1], [1, 1]] as const), 0, 24 * keys(p, [[0, 0], [0.1, 0.6], [0.5, 1], [0.7, 0.8], [1, 0]] as const)] as V3, move: [0, 0.03 * keys(p, [[0, 0], [0.5, 0], [0.75, 1], [1, 1]] as const), 0.065 * keys(p, [[0, 0], [0.55, 0], [0.7, 1], [1, 1]] as const)] as V3 },
          flame: { scale: [1 - 0.9 * keys(p, [[0, 0], [0.7, 0], [0.9, 1], [1, 1]] as const), 1 - 0.9 * keys(p, [[0, 0], [0.7, 0], [0.9, 1], [1, 1]] as const), 1 - 0.9 * keys(p, [[0, 0], [0.7, 0], [0.9, 1], [1, 1]] as const)] },
        };
      },
    });
  },
});
