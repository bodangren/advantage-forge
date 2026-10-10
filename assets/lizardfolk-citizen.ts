import { defineAsset, motion, noise, profile, sdf, Sdf, THREE } from '../src/index.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Lizardfolk citizen — a P2 NPC of the river town (catalog `npcs/fantasy-peoples/lizardfolk-citizen`),
 * about 1.0 m to the top of the frill, faces +Z. Target: docs/npc-mockups/lizardfolk-citizen_001.jpg.
 * Built on the kobold warrior (a reptile body on the goblin skeleton: knees, tail, clip set), at 1.15x.
 *
 * Role: a friendly river trader at the market and the docks; a 128 px sprite and a 3D NPC.
 * One idea: a round green lizard with a short smiling snout, huge yellow eyes, and a big pink spiral
 *   seashell held up in the right hand; the shell, the frill, and the long tail are the silhouette.
 * Shape language: round and soft everywhere; the orange frill is the one spiky accent.
 * Palette: skin #5a8a4a over a cream belly #e8dcb0; frill #e0803a; eyes #f0c830 with dark pupils;
 *   teal headscarf #2a7a7a; reed vest #c8a870; shells #f0d0c0 and #ece0c8; skirt #6b4226 with a
 *   #5a3a24 belt; claws #ece0c8; seashell #f0a0a0 with #f6e0d0 bands.
 * Value plan: the eyes and the pink shell are the focal points; the green body and the cream belly
 *   carry the middle values; the brown skirt and the dark teal band anchor the dark values.
 * Bodies: skin, eyes, frill, scarf, vest, skirt, belt, necklace, claws, seashell.
 * Rig: the kobold's (ear bones kept, no ears built); the shell is rigid on `spear`, a child of
 *   `hand.R` (the raised right fist). Clips: idle, walk, run, attack, hit, death, taunt.
 */

const C = {
  scales: '#5a8a4a',
  scalesDark: '#456f3a',
  belly: '#e8dcb0',
  bellyDark: '#c9bd90',
  eye: '#f0c830',
  eyeLow: '#d8a418',
  pupil: '#141012',
  mouth: '#3a2a1a',
  nostril: '#2e4a26',
  blush: '#e89080',
  frill: '#e0803a',
  frillLight: '#f2a060',
  scarf: '#2a7a7a',
  scarfDark: '#1e5e5e',
  vest: '#c8a870',
  vestLight: '#dcc08c',
  shellA: '#f0d0c0',
  shellB: '#ece0c8',
  skirt: '#6b4226',
  belt: '#5a3a24',
  claw: '#ece0c8',
  conch: '#f0a0a0',
  conchLight: '#f6e0d0',
  conchDeep: '#c46a70',
  rope: '#a87c48',
};

type V3 = readonly [number, number, number];

const pair = (s: sdf.Shape) => s.mirror('x');
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const add = (a: V3, b: V3, s = 1): V3 => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};
const DEG = Math.PI / 180;

// Joints. The left arm hangs relaxed; the right arm is raised, the fist holds the seashell up.
const SHOULDER: V3 = [0.14, 0.405, 0];
const ELBOW: V3 = [0.235, 0.43, 0.02]; // the left arm is raised in a wave
const WRIST: V3 = [0.29, 0.52, 0.04];
const ELBOW_R: V3 = [-0.275, 0.37, 0.02];
const WRIST_R: V3 = [-0.34, 0.435, 0.04];
const DY = -0.08; // the head sits this far lower on the short body
const HIP: V3 = [0.075, 0.2, 0];
const ANKLE: V3 = [0.108, 0.075, 0];
const KNEE: V3 = [0.0915, 0.1375, 0]; // the knee: splits the leg (shin.L takes the weight below it)
const TAIL0: V3 = [0, 0.22, -0.1];
const TAIL1: V3 = [0, 0.16, -0.22];
const TAIL2: V3 = [0, 0.11, -0.32];
const EAR: V3 = [0.118, 0.625, -0.075];
// The held shell: nearly upright; the grip point sits just above the fist.
const SPEAR_TILT = { z: 10, x: 8 };
const GRIP_DIR = norm([
  -Math.sin(SPEAR_TILT.z * DEG),
  Math.cos(SPEAR_TILT.z * DEG) * Math.cos(SPEAR_TILT.x * DEG),
  Math.cos(SPEAR_TILT.z * DEG) * Math.sin(SPEAR_TILT.x * DEG),
]);
const FLAT: V3 = [0, -Math.sin(SPEAR_TILT.x * DEG), Math.cos(SPEAR_TILT.x * DEG)];
const FIST_R = add(WRIST_R, norm([WRIST_R[0] - ELBOW_R[0], WRIST_R[1] - ELBOW_R[1], WRIST_R[2] - ELBOW_R[2]]), 0.04);
const GUARD = add(FIST_R, GRIP_DIR, 0.048);
const spearPose = (s: sdf.Shape) => s.rotateZ(SPEAR_TILT.z).rotateX(SPEAR_TILT.x).at(...GUARD);

/** An open waving hand above the wrist `w`: a palm and four spread fingers. */
const FINGER_DX = [-0.034, -0.011, 0.012, 0.033];
const FINGER_UP = [0.1, 0.116, 0.112, 0.094];
const handUp = (w: V3) =>
  sdf.smoothUnion(
    0.02,
    sdf.ellipsoid([0.05, 0.05, 0.03]).at(w[0] + 0.008, w[1] + 0.045, w[2]),
    sdf.cone([w[0] - 0.026, w[1] + 0.035, w[2] + 0.006], [w[0] - 0.066, w[1] + 0.07, w[2] + 0.012], 0.017, 0.012), // thumb
    ...FINGER_DX.map((dx, i) =>
      sdf.cone([w[0] + dx * 0.6 + 0.008, w[1] + 0.065, w[2]], [w[0] + dx * 1.7 + 0.008, w[1] + FINGER_UP[i]!, w[2] + 0.004], 0.0145, 0.009),
    ),
  );

// Scales: 3D Worley cells, F2 - F1 in cell units (0 on the cell edges, about 0.5 in a cell's middle).
const SCALE_F = 30; // cells per meter
const scaleCells = (x: number, y: number, z: number): number => {
  const px = x * SCALE_F;
  const py = y * SCALE_F * 1.15;
  const pz = z * SCALE_F;
  const xi = Math.floor(px);
  const yi = Math.floor(py);
  const zi = Math.floor(pz);
  let f1 = 9;
  let f2 = 9;
  for (let i = -1; i <= 1; i++)
    for (let j = -1; j <= 1; j++)
      for (let l = -1; l <= 1; l++) {
        const cx = xi + i;
        const cy = yi + j;
        const cz = zi + l;
        const dx = cx + 0.15 + 0.7 * noise.random(cx, cy, cz) - px;
        const dy = cy + 0.15 + 0.7 * noise.random(cy + 71, cz, cx) - py;
        const dz = cz + 0.15 + 0.7 * noise.random(cz, cx + 13, cy) - pz;
        const d = dx * dx + dy * dy + dz * dz;
        if (d < f1) {
          f2 = f1;
          f1 = d;
        } else if (d < f2) f2 = d;
      }
  return Math.sqrt(f2) - Math.sqrt(f1);
};
/** A paint stencil from a distance function, bounded to the whole figure. */
const region = (dist: (x: number, y: number, z: number) => number) =>
  new Sdf(dist, { min: [-0.7, -0.1, -0.8], max: [0.7, 1.2, 0.7] });
// The mouth line: along the snout, curling up into the cheek at the back (a smile).
const mouthY = (z: number) => 0.585 + DY + 0.09 * Math.pow(Math.max(0, (0.19 - z) / 0.19), 1.3);

export default scaleAsset(
  defineAsset({
    name: 'lizardfolk-citizen',
    description:
      'Chibi lizardfolk river trader NPC: a friendly green scaly lizard with a short smiling snout, big yellow eyes, a small orange frill, a teal headscarf, a woven reed vest, a shell necklace, a brown wrap skirt, a long tail, and a big pink spiral seashell held up in the right hand.',
    detail: 0.005,
    reference: 'docs/npc-mockups/lizardfolk-citizen_001.jpg',
    variants: {
      skin: { green: C.scales, moss: '#6a7e3a', jade: '#3f8a6a', sand: '#9a9a52' },
      eyes: { yellow: C.eye, amber: '#d8902a', green: '#7ab83a', violet: '#8a6ab0' },
      cloth: { reed: C.vest, ochre: '#c8903a', clay: '#b8704a', slate: '#6a7a8a' },
      scarf: { teal: C.scarf, plum: '#7a4a7a', saffron: '#d09a2a', navy: '#3a5a8a' },
    },
    presets: {
      river: { skin: 'green', eyes: 'yellow', cloth: 'reed', scarf: 'teal' },
      marsh: { skin: 'moss', eyes: 'amber', cloth: 'clay', scarf: 'plum' },
    },

    build(k) {
      const TS = {
        scales: k.tint('skin'),
        scalesDark: k.tint('skin', { color: C.scalesDark, follow: 1 }),
        belly: k.tint('skin', { color: C.belly, follow: 0.4 }),
        bellyDark: k.tint('skin', { color: C.bellyDark, follow: 0.4 }),
        eye: k.tint('eyes'),
        eyeLow: k.tint('eyes', { color: C.eyeLow, follow: 1 }),
        vest: k.tint('cloth'),
        vestLight: k.tint('cloth', { color: C.vestLight, follow: 1 }),
        scarf: k.tint('scarf'),
        scarfDark: k.tint('scarf', { color: C.scarfDark, follow: 1 }),
      };
      const EAR_TIP: V3 = [0.31, 0.67, -0.22];
      // ------------------------------------------------------------------ skeleton
      k.skeleton({
        hips: { at: [0, 0.2, 0] },
        spine: { parent: 'hips', at: [0, 0.27, 0] },
        chest: { parent: 'spine', at: [0, 0.35, 0] },
        neck: { parent: 'chest', at: [0, 0.46, -0.01] },
        head: { parent: 'neck', at: [0, 0.47, -0.01] },
        'ear.L': { parent: 'head', at: EAR, tail: EAR_TIP },
        'ear.R': { parent: 'head', at: mx(EAR), tail: mx(EAR_TIP) },
        tail: { parent: 'hips', at: TAIL0 },
        'tail.2': { parent: 'tail', at: TAIL1 },
        'tail.3': { parent: 'tail.2', at: TAIL2, tail: [0, 0.13, -0.48] },
        'upperarm.L': { parent: 'chest', at: SHOULDER },
        'forearm.L': { parent: 'upperarm.L', at: ELBOW },
        'hand.L': { parent: 'forearm.L', at: WRIST },
        'upperarm.R': { parent: 'chest', at: mx(SHOULDER) },
        'forearm.R': { parent: 'upperarm.R', at: ELBOW_R },
        'hand.R': { parent: 'forearm.R', at: WRIST_R },
        spear: { parent: 'hand.R', at: GUARD },
        'leg.L': { parent: 'hips', at: HIP },
        'shin.L': { parent: 'leg.L', at: KNEE, split: 0.015 },
        'foot.L': { parent: 'shin.L', at: ANKLE },
        'leg.R': { parent: 'hips', at: mx(HIP) },
        'shin.R': { parent: 'leg.R', at: mx(KNEE), split: 0.015 },
        'foot.R': { parent: 'shin.R', at: mx(ANKLE) },
      });

      // ------------------------------------------------------------------ head: round cranium, short snout, cheeks
      const EYE_C: V3 = [0.09, 0.715, 0.092];
      const EYE_R = 0.048;
      const EYE_DIR = norm([0.42, 0.04, 1]);
      const CRANIUM = sdf.ellipsoid([0.17, 0.15, 0.16]).at(0, 0.7, -0.03);
      const headCore = sdf.smoothUnion(
        0.045,
        CRANIUM,
        pair(sdf.sphere(0.075).at(0.095, 0.628, 0.03)), // round cheeks
        sdf.ellipsoid([0.076, 0.056, 0.08]).at(0, 0.636, 0.118), // the longer upper jaw
      );
      const brows = pair(sdf.ellipsoid([0.046, 0.011, 0.03]).at(0.09, 0.79, 0.07)); // soft level brows, lifted
      const head = headCore
        .smoothUnion(0.02, sdf.ellipsoid([0.068, 0.052, 0.05]).at(0, 0.646, 0.172)) // the round nose end
        .smoothUnion(0.012, sdf.ellipsoid([0.064, 0.036, 0.075]).at(0, 0.585, 0.096)) // the lower jaw, set in
        .smoothUnion(0.03, brows)
        .bone('head');
      const faceZ = (x: number, y: number) => sdf.raycast(head, [x, y, 1], [0, 0, -1])![2];
      const headS = head.at(0, DY, 0);

      const neck = sdf.capsule([0, 0.44, -0.01], [0, 0.56, -0.01], 0.058).bone('neck');

      // ------------------------------------------------------------------ body: pot belly, arms, haunches, feet, tail
      const torso = sdf
        .revolve(
          profile.polygon(
            [
              [0, 0.47],
              [0.06, 0.467],
              [0.1, 0.455],
              [0.13, 0.43],
              [0.15, 0.39],
              [0.165, 0.34],
              [0.178, 0.28],
              [0.18, 0.23],
              [0.168, 0.19],
              [0.12, 0.163],
              [0, 0.158],
            ],
            { smooth: true, samples: 8 },
          ),
        )
        .scale([1, 1, 0.92])
        .smoothUnion(0.04, sdf.ellipsoid([0.14, 0.12, 0.12]).at(0, 0.27, 0.07)); // the pot belly
      const chestPart = sdf.ellipsoid([0.15, 0.07, 0.1]).at(0, 0.42, 0);

      const armL = sdf.smoothUnion(
        0.02,
        sdf.cone(SHOULDER, ELBOW, 0.05, 0.042).bone('upperarm.L'),
        sdf.cone(ELBOW, WRIST, 0.042, 0.038).bone('forearm.L'),
        handUp(WRIST).bone('hand.L'),
      );
      const fistR = spearPose(
        sdf.smoothUnion(
          0.018,
          sdf.ellipsoid([0.046, 0.052, 0.048]).at(0, -0.046, 0),
          sdf.capsule([0.02, -0.075, 0.03], [0.022, -0.02, 0.032], 0.02), // curled fingers
          sdf.cone([-0.03, -0.02, 0.02], [0.01, -0.006, 0.034], 0.019, 0.014), // thumb over the fingers
        ),
      );
      const armR = sdf.smoothUnion(
        0.02,
        sdf.cone(mx(SHOULDER), ELBOW_R, 0.05, 0.042).bone('upperarm.R'),
        sdf.cone(ELBOW_R, WRIST_R, 0.042, 0.038).bone('forearm.R'),
        fistR.bone('hand.R'),
      );
      const legs = sdf.smoothUnion(
        0.03,
        sdf.ellipsoid([0.16, 0.06, 0.12]).at(0, 0.21, -0.005).bone('hips'),
        pair(
          sdf
            .smoothUnion(
              0.03,
              sdf.cone(HIP, [ANKLE[0], 0.1, 0.004], 0.062, 0.044),
              sdf.ellipsoid([0.076, 0.07, 0.08]).at(0.115, 0.165, 0.01), // haunch
            )
            .bone('leg.L'),
        ),
      );
      // A three-toed foot built at the ankle's ground point, then turned out.
      const TOES = [-0.034, 0, 0.034];
      const footLocal = sdf
        .smoothUnion(
          0.028,
          sdf.cylinder(0.042, 0.06, 0.015).at(0, 0.078, -0.01),
          sdf.ellipsoid([0.058, 0.036, 0.07]).at(0, 0.036, 0.018),
          sdf.sphere(0.032).at(0, 0.032, -0.042),
          ...TOES.map((dx) => sdf.capsule([dx * 0.3, 0.03, 0.05], [dx, 0.022, 0.098], 0.02)),
        )
        .intersect(sdf.halfSpace([0, -1, 0], 0));
      const footPose = (s: sdf.Shape) => s.rotateY(16).at(ANKLE[0], 0, 0).bone('foot.L');
      const feet = pair(footPose(footLocal));
      const tail = sdf.smoothUnion(
        0.02,
        sdf.cone([0, 0.245, -0.04], TAIL1, 0.058, 0.04).bone('tail'),
        sdf.cone(TAIL1, TAIL2, 0.04, 0.028).bone('tail.2'),
        sdf
          .chain(
            [
              [TAIL2[0], TAIL2[1], TAIL2[2], 0.028],
              [0, 0.09, -0.39, 0.021],
              [0, 0.095, -0.45, 0.015],
              [0, 0.125, -0.485, 0.01],
              [0, 0.16, -0.478, 0.006],
            ],
            0.012,
          )
          .bone('tail.3'),
      );

      // ------------------------------------------------------------------ skin: scales, belly, face paint
      const onHead = (x: number, y: number, z: number) => Math.hypot(x, y - 0.62, z * 0.8) < 0.25;
      const scaleLines = region((x, y, z) => (scaleCells(x, y, z) - (onHead(x, y, z) ? 0 : 0.05)) / (2 * SCALE_F));
      const bellyZone = sdf.smoothUnion(
        0.04,
        sdf.ellipsoid([0.13, 0.17, 0.22]).at(0, 0.3, 0.1),
        sdf.ellipsoid([0.08, 0.1, 0.2]).at(0, 0.43, 0.08),
      );
      const plateLines = region((x, y) => {
        const t = (y - 0.19) / 0.034;
        return Math.abs(t - Math.round(t)) * 0.034 - 0.003;
      }).intersect(sdf.ellipsoid([0.13, 0.1, 0.25]).at(0, 0.37, 0.1));
      const jawZone = region((x, y, z) => Math.max(y - mouthY(z) + 0.001, Math.abs(x) - 0.05, -z)).intersect(
        sdf.box([0.4, 0.2, 0.5]).at(0, 0.52 + DY, 0.15),
      );
      const mouthLine = region((_x, y, z) => (z < -0.01 ? 0.05 : Math.abs(y - mouthY(z)) - 0.0045)).intersect(
        sdf.box([0.4, 0.12, 0.4]).at(0, 0.6 + DY, 0.12),
      );
      const noseFront = faceZ(0.022, 0.658);
      const nostrils = pair(sdf.ellipsoid([0.011, 0.008, 0.018]).at(0.022, 0.658 + DY, noseFront));
      const blush = pair(sdf.sphere(0.03).at(0.125, 0.636 + DY, 0.072));

      const scaly = sdf
        .smoothUnion(0.03, torso.bone('spine'), chestPart.bone('chest'), legs, tail)
        .smoothUnion(0.02, armL, armR, feet)
        .smoothUnion(0.03, sdf.smoothUnion(0.03, headS, neck))
        .paintWhere(scaleLines, TS.scalesDark, 0.0015);
      const skin = scaly
        .paintWhere(bellyZone, TS.belly, 0.012)
        .paintWhere(plateLines, TS.bellyDark, 0.002)
        .paintWhere(jawZone, TS.belly, 0.004)
        .paintWhere(blush, C.blush, 0.02)
        .paintWhere(mouthLine, C.mouth, 0.002)
        .paintWhere(nostrils, C.nostril, 0.003);
      const bellyTest = (x: number, y: number, z: number) => z > 0.06 && (x / 0.11) ** 2 + ((y - 0.37) / 0.1) ** 2 < 1;
      k.body('skin', skin, {
        color: TS.scales,
        roughness: 0.55,
        textureDensity: 2,
        detail: 0.0053,
        maxTriangles: 31500,
        bump: (x, y, z) => {
          if (bellyTest(x, y, z)) {
            const t = (y - 0.19) / 0.034;
            return 0.0022 * Math.min(1, (Math.abs(t - Math.round(t)) * 0.034) / 0.007);
          }
          return (onHead(x, y, z) ? 0.0004 : 0.001) * Math.min(1, scaleCells(x, y, z) / 0.3);
        },
      });

      // ------------------------------------------------------------------ eyes: big glossy yellow balls, big pupils
      const eyeBall = (side: number) => {
        const c: V3 = [EYE_C[0] * side, EYE_C[1], EYE_C[2]];
        const d: V3 = [EYE_DIR[0] * side, EYE_DIR[1], EYE_DIR[2]];
        const shineDir = norm(add(d, [0.3 * side, 0.42, 0]));
        return sdf
          .sphere(EYE_R)
          .at(...c)
          .paintWhere(sdf.halfSpace([0, 1, 0], c[1] - 0.014).intersect(sdf.sphere(0.06).at(...c)), TS.eyeLow, 0.012)
          .paintWhere(sdf.ellipsoid([0.03, 0.033, 0.024]).at(...add(c, d, EYE_R)), C.pupil, 0.002)
          .paintWhere(sdf.sphere(0.01).at(...add(c, shineDir, EYE_R)), '#ffffff', 0.002);
      };
      k.body('eyes', sdf.union(eyeBall(1), eyeBall(-1)).at(0, DY, 0), { color: TS.eye, roughness: 0.15, detail: 0.003, textureDensity: 2, bone: 'head' });

      // ------------------------------------------------------------------ frill: a fan of tapered spines on the crown
      const spine = (angle: number, len: number, light: boolean) =>
        sdf
          .cone([0, 0, 0], [0, len, 0], 0.021, 0.006)
          .rotateZ(angle)
          .paint(light ? C.frillLight : C.frill);
      const frill = sdf
        .smoothUnion(
          0.012,
          sdf.ellipsoid([0.04, 0.02, 0.03]).at(0, 0.004, 0).paint(C.frill),
          spine(-46, 0.09, false),
          spine(-23, 0.115, true),
          spine(0, 0.135, false),
          spine(23, 0.115, true),
          spine(46, 0.09, false),
        )
        .scale([1, 1, 0.85])
        .rotateX(-14)
        .at(0, 0.83, -0.04);
      k.body('frill', frill.at(0, DY, 0).bone('head'), { color: C.frill, roughness: 0.6, detail: 0.003 });

      // ------------------------------------------------------------------ teal headscarf: a band over the brow, a knot, two tails
      const bandSlab = sdf.box([0.8, 0.038, 0.8]).rotateX(-10).at(0, 0.808, -0.03);
      const band = CRANIUM.round(0.012).smoothIntersect(0.006, bandSlab).paintWhere(
        sdf.box([0.8, 0.006, 0.8]).rotateX(-10).at(0, 0.819, -0.03),
        TS.scarfDark,
        0.004,
      );
      const knotAt: V3 = [0, 0.755, -0.19];
      const tailsBack = pair(
        sdf.chain(
          [
            [0.012, 0.752, -0.194, 0.012],
            [0.034, 0.722, -0.212, 0.013],
            [0.05, 0.69, -0.216, 0.011],
            [0.058, 0.668, -0.212, 0.008],
          ],
          0.01,
        ),
      );
      k.body('scarf', band.paint(TS.scarf).union(sdf.ellipsoid([0.026, 0.022, 0.02]).at(...knotAt).paint(TS.scarf), tailsBack.paint(TS.scarf)).at(0, DY, 0).bone('head'), {
        color: TS.scarf,
        roughness: 0.85,
        detail: 0.004,
      });

      // ------------------------------------------------------------------ claws: fingers and toes
      const clawsL = sdf.union(
        ...FINGER_DX.map((dx, i) =>
          sdf.cone([WRIST[0] + dx * 1.7 + 0.008, WRIST[1] + FINGER_UP[i]! - 0.006, WRIST[2] + 0.004], [WRIST[0] + dx * 1.95 + 0.008, WRIST[1] + FINGER_UP[i]! + 0.024, WRIST[2] + 0.006], 0.008, 0.002),
        ),
      );
      const clawsR = spearPose(
        sdf.union(...[-0.07, -0.05, -0.03].map((y) => sdf.cone([0.012, y, 0.046], [-0.012, y - 0.004, 0.05], 0.008, 0.002))),
      );
      const toeClaws = footPose(sdf.union(...TOES.map((dx) => sdf.cone([dx * 1.02, 0.024, 0.104], [dx * 1.08, 0.006, 0.134], 0.014, 0.003))));
      k.body('claws', sdf.union(clawsL.bone('hand.L'), clawsR.bone('hand.R'), pair(toeClaws)), { color: C.claw, roughness: 0.4, detail: 0.0035 });

      // ------------------------------------------------------------------ woven reed vest: open front, plain hem
      const opening = sdf
        .extrude(
          profile.polygon([
            [-0.05, 0.54],
            [0.05, 0.54],
            [0.115, 0.27],
            [-0.115, 0.27],
          ]),
          0.4,
        )
        .at(0, 0, 0.2);
      const vestBand = torso
        .round(0.012)
        .smoothIntersect(0.006, sdf.box([0.5, 0.215, 0.5], 0.01).at(0, 0.41, 0))
        .smoothSubtract(0.005, opening);
      k.body('vest', vestBand.bone('chest'), {
        color: TS.vest,
        roughness: 0.9,
        bump: (x, y, z) => 0.0014 * Math.abs(Math.sin(x * 210 + Math.floor(y * 100) * 1.9 + z * 40)),
      });

      // ------------------------------------------------------------------ skirt and belt: a brown wrap, a knotted belt
      const BELT_Y = 0.278;
      const skirtBand = torso.round(0.018).smoothIntersect(0.006, sdf.box([0.7, 0.11, 0.7], 0.01).at(0, 0.218, 0));
      const wrapFlap = torso
        .round(0.028)
        .smoothIntersect(0.006, sdf.box([0.1, 0.11, 0.7], 0.01).at(0.05, 0.215, 0));
      k.body('skirt', sdf.union(skirtBand, wrapFlap).bone('hips'), {
        color: C.skirt,
        roughness: 0.85,
        bump: (x, y, z) => 0.0012 * Math.abs(Math.sin(y * 150 + x * 20 + z * 10)),
      });
      const belt = torso.round(0.024).smoothIntersect(0.005, sdf.box([0.7, 0.036, 0.7], 0.006).at(0, BELT_Y, 0));
      const knotP = sdf.surfacePoint(belt, [0.045, BELT_Y - 0.002, 0.3], 0.004);
      const beltKnot = sdf
        .union(
          sdf.ellipsoid([0.026, 0.022, 0.016]).at(...knotP),
          sdf.chain([[knotP[0] - 0.01, knotP[1] - 0.01, knotP[2] + 0.004, 0.011], [knotP[0] - 0.02, knotP[1] - 0.045, knotP[2] + 0.004, 0.009]], 0.008),
          sdf.chain([[knotP[0] + 0.012, knotP[1] - 0.01, knotP[2] + 0.004, 0.011], [knotP[0] + 0.03, knotP[1] - 0.04, knotP[2] + 0.004, 0.009]], 0.008),
        )
        .smoothUnion(0.006, belt);
      k.body('belt', beltKnot.bone('spine'), { color: C.belt, roughness: 0.7, detail: 0.004 });

      // ------------------------------------------------------------------ rope collar: two coils around the neck
      const collar = sdf
        .smoothUnion(
          0.012,
          sdf.torus(0.135, 0.032).at(0, 0.428, -0.005),
          sdf.torus(0.125, 0.029).at(0, 0.464, -0.008),
        )
        .scale([1, 1, 0.95])
        .paint(C.rope);
      k.body('collar', collar.bone('chest'), {
        color: C.rope,
        roughness: 0.9,
        detail: 0.004,
        bump: (x, y, z) => 0.0022 * Math.abs(Math.sin(Math.atan2(x, z) * 34 + y * 130)),
      });

      // ------------------------------------------------------------------ necklace: a cord and five small shells
      const bodyForNeck = sdf.union(torso, chestPart, neck);
      const NECK_PHI = [-72, -54, -36, -18, 0, 18, 36, 54, 72];
      const cordAt = (phi: number): V3 => {
        const s = Math.sin(phi * DEG);
        const c = Math.cos(phi * DEG);
        const y = 0.43 - 0.07 * (1 - (phi / 80) ** 2);
        const hit = sdf.raycast(bodyForNeck, [s * 0.4, y, c * 0.4], [-s, 0, -c]);
        if (!hit) return [s * 0.1, y, c * 0.1];
        return [hit[0] + s * 0.022, hit[1], hit[2] + c * 0.022];
      };
      const cordPts = NECK_PHI.map((p) => cordAt(p));
      const cord = sdf.chain(cordPts.map((p) => [p[0], p[1], p[2], 0.0065] as [number, number, number, number]), 0.004);
      const SHELL_PHI = [-30, -15, 0, 15, 30];
      const shellOf = (phi: number, i: number) => {
        const p = cordAt(phi);
        return sdf
          .union(
            sdf.ellipsoid([0.014, 0.019, 0.012]).at(p[0], p[1] - 0.016, p[2] + 0.003),
            sdf.cone([p[0], p[1] - 0.03, p[2] + 0.003], [p[0], p[1] - 0.045, p[2] + 0.003], 0.007, 0.002),
          )
          .paint(i % 2 === 0 ? C.shellA : C.shellB);
      };
      k.body('necklace', sdf.union(cord.paint('#7a5a3a'), ...SHELL_PHI.map((p, i) => shellOf(p, i))).bone('chest'), {
        color: C.shellA,
        roughness: 0.4,
        detail: 0.003,
      });

      // ------------------------------------------------------------------ the spiral seashell in the right fist
      // Local frame: the grip point at the origin, the shell above it, its face toward +Z.
      const spiral: [number, number, number, number][] = [];
      for (let i = 0; i <= 18; i++) {
        const t = i / 18;
        const th = t * 4 * Math.PI;
        const cr = 0.004 + 0.03 * t;
        spiral.push([cr * Math.cos(th), cr * Math.sin(th), 0.004, 0.008 + 0.024 * t]);
      }
      const conchBands = region((x, y) => {
        const s = Math.hypot(x, y - 0.06) / 0.015 - 0.27 - Math.atan2(y - 0.06, x) / (2 * Math.PI);
        const d = s - Math.round(s);
        return (Math.abs(d) - 0.3) * 0.015;
      });
      // The mouth of the shell: a thick lip ring on the lower outer rim, a dark pink hollow inside.
      const MOUTH: V3 = [-0.034, -0.026, 0.034];
      const lip = sdf.torus(0.021, 0.009).rotateX(90).rotateY(-18).at(...MOUTH).paint(C.conchLight);
      const hollow = sdf.ellipsoid([0.022, 0.022, 0.01]).rotateY(-18).at(MOUTH[0], MOUTH[1], MOUTH[2] + 0.004).paint(C.conchDeep);
      const conch = sdf
        .union(sdf.chain(spiral, 0.014), sdf.ellipsoid([0.046, 0.046, 0.03]).at(0, 0, 0.0), lip, hollow)
        .at(0, 0.06, 0)
        .paint(C.conch)
        .paintWhere(conchBands, C.conchLight, 0.002);
      k.body('seashell', spearPose(conch.scale(1.9).rotateY(20)), {
        color: C.conch,
        roughness: 0.35,
        detail: 0.005,
        bone: 'spear',
        textureDensity: 2,
        maxTriangles: 14000,
      });

    const { wave, bump, legDrop } = motion;
    const LEG = 0.19;

    k.animation('idle', {
      duration: 2.4,
      pose: (_t, p) => ({
        hips: { move: [0, -0.003 * bump(p), 0] },
        chest: { rotate: [2.5 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        head: { rotate: [0, 5 * wave(p, 1, 0.25), 2 * wave(p, 1, 0.1)] },
        'ear.L': { rotate: [0, 0, 4 * wave(p, 1, 0.35)] },
        'ear.R': { rotate: [0, 0, -4 * wave(p, 1, 0.35)] },
        tail: { rotate: [2 * wave(p, 1, 0.2), 7 * wave(p), 0] },
        'tail.2': { rotate: [0, 9 * wave(p, 1, 0.1), 0] },
        'tail.3': { rotate: [3 * wave(p, 1, 0.3), 12 * wave(p, 1, 0.2), 0] },
        'upperarm.L': { rotate: [2 * wave(p, 1, 0.1), 0, 3 * bump(p)] },
        'upperarm.R': { rotate: [2 * wave(p, 1, 0.1), 0, -3 * bump(p)] },
        'forearm.L': { rotate: [0, 0, 14 * wave(p, 2, 0)] }, // the raised hand waves
      }),
    });

    // The legs come from motion.gait (see the goblin warrior); the tail sways against the hips and
    // the spear arm swings little, the forearm lifted against the lean so the butt clears the floor.
    const stride = (duration: number, step: number, lift: number, duty: number, armSwing: number, lean: number, hop: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        const sway = armSwing / 28;
        const hipsTurn = [0, 7 * s, 0] as const;
        const legs = motion.gait(p - 0.25, { hip: HIP, knee: KNEE, ankle: ANKLE }, {
          stride: step,
          lift,
          duty,
          bob: hop,
          roll: 10,
          heel: [0.097, 0, -0.068],
          toe: [0.128, 0, 0.107],
          hips: { at: [0, 0.2, 0], rotate: hipsTurn },
        });
        return {
          ...legs.pose,
          hips: { move: [0, legs.hipsY, 0] as const, rotate: hipsTurn },
          spine: { rotate: [lean, 0, 0] as const },
          chest: { rotate: [lean * 0.5, -11 * s, 0] as const },
          head: { rotate: [-lean, 5 * s, 0] as const },
          'ear.L': { rotate: [0, lean * 0.8 + 3 * wave(p, 2, 0.2), 7 * wave(p, 2, 0.15)] as const },
          'ear.R': { rotate: [0, -lean * 0.8 - 3 * wave(p, 2, 0.2), -7 * wave(p, 2, 0.15)] as const },
          tail: { rotate: [2 * wave(p, 2, 0.1) + lean * 0.5, -9 * sway * s, 0] as const },
          'tail.2': { rotate: [0, -10 * sway * wave(p, 1, 0.07), 0] as const },
          'tail.3': { rotate: [0, -14 * sway * wave(p, 1, 0.14), 0] as const },
          'upperarm.L': { rotate: [armSwing * 0.25 * s, 0, 4] as const },
          'upperarm.R': { rotate: [-armSwing * 0.35 * s, 0, -6] as const },
          'forearm.R': { rotate: [-lean * 1.3 - 4, 0, 0] as const },
          'forearm.L': { rotate: [-armSwing * 0.1, 0, 12 * wave(p, 2, 0)] as const },
        };
      },
    });
    k.animation('walk', stride(0.9, 0.1, 0.03, 0.58, 28, 3, 0.008));
    k.animation('run', stride(0.56, 0.15, 0.05, 0.38, 50, 12, 0.035));

    // A spear thrust from the hip, solved by targets. The grip point follows a path in world space;
    // each frame converts it into the chest's rest frame, reach solves the arm, and orient turns the
    // fist so the spear lies along the path. Anticipation: the kobold crouches, coils, and pulls the
    // spear back to the right hip, level, the point forward. Strike: the right foot steps, the hips
    // drive forward, and the fist runs straight along the spear's own line. Recovery: the spear
    // pulls back along the line, then all returns to rest. The ears and the tail lag.
    const { keys, reach, orient, follow, quat } = motion;
    const ARM_R = { root: mx(SHOULDER), mid: ELBOW_R, end: WRIST_R };
    const TRUNK: readonly V3[] = [[0, 0.2, 0], [0, 0.27, 0], [0, 0.35, 0]]; // hips, spine, chest pivots
    const COCK: V3 = [-0.34, 0.3, -0.04]; // the grip at the right hip, the point forward
    const HIT: V3 = [-0.22, 0.36, 0.35]; // the grip at full extension
    const AIM = norm([HIT[0] - COCK[0], HIT[1] - COCK[1], HIT[2] - COCK[2]]);
    const ROLL: V3 = [0, -1, 0]; // the head's flat stays level through the thrust
    const GRIP_OFFSET: V3 = [GUARD[0] - WRIST_R[0], GUARD[1] - WRIST_R[1], GUARD[2] - WRIST_R[2]];
    const POLE_COCK: V3 = [-0.4, 0.3, -0.35]; // the elbow back and out
    const POLE_HIT: V3 = [-0.42, 0.2, 0.1]; // the elbow out and a little down
    const chestFrame = (rots: readonly V3[], move: V3) => {
      const inv = quat(rots[0]!).multiply(quat(rots[1]!)).multiply(quat(rots[2]!)).invert();
      const at = follow(TRUNK, rots, TRUNK[2]!);
      const c = TRUNK[2]!;
      return {
        point: (w: V3): V3 => {
          const v = new THREE.Vector3(w[0] - at[0] - move[0], w[1] - at[1] - move[1], w[2] - at[2] - move[2]).applyQuaternion(inv);
          return [v.x + c[0], v.y + c[1], v.z + c[2]];
        },
        dir: (d: V3): V3 => {
          const v = new THREE.Vector3(d[0], d[1], d[2]).applyQuaternion(inv);
          return [v.x, v.y, v.z];
        },
      };
    };
    k.animation('attack', {
      duration: 0.75,
      loop: false,
      pose: (_t, p) => {
        const coil = keys(p, [[0, 0], [0.3, 1], [0.36, 1], [0.46, 0]] as const);
        const lunge = keys(p, [[0.36, 0], [0.47, 1], [0.6, 1], [0.8, 0.25], [1, 0]] as const);
        const step = keys(p, [[0.36, 0], [0.42, 1], [0.48, 0]] as const);
        const aim = keys(p, [[0, 0], [0.28, 1], [0.7, 1], [1, 0]] as const);
        const ext = keys(p, [[0.28, 0], [0.36, -0.08], [0.47, 1], [0.58, 1], [0.72, 0.5]] as const);
        const flop = keys(p, [[0.4, 0], [0.54, 1], [0.66, 0.8], [1, 0]] as const);
        const legL = -8 * coil + 20 * lunge;
        const legR = -8 * coil - 20 * lunge - 8 * step;
        const hipsMove: V3 = [0, -legDrop(LEG, legL), LEG * Math.sin(legL * DEG)];
        const hipsR: V3 = [0, -10 * coil + 8 * lunge, 0];
        const spineR: V3 = [13 * coil + 8 * lunge, -8 * coil + 6 * lunge, 0];
        const chestR: V3 = [4 * coil + 4 * lunge, -12 * coil + 12 * lunge, 0];
        const frame = chestFrame([hipsR, spineR, chestR], hipsMove);
        const guard = lerp(GUARD, lerp(COCK, HIT, ext), aim);
        const dirW = norm(lerp(GRIP_DIR, AIM, aim));
        const upW = norm(lerp(FLAT, ROLL, aim));
        const turn = quat(orient([], { dir: GRIP_DIR, up: FLAT }, { dir: dirW, up: upW }));
        const off = new THREE.Vector3(...GRIP_OFFSET).applyQuaternion(turn);
        const wrist: V3 = [guard[0] - off.x, guard[1] - off.y, guard[2] - off.z];
        const pole = lerp(ELBOW_R, keys(p, [[0.1, POLE_COCK], [0.36, POLE_COCK], [0.47, POLE_HIT]] as const), aim);
        const arm = reach(ARM_R, frame.point(wrist), frame.point(pole));
        const hand = orient([arm.upper, arm.lower], { dir: GRIP_DIR, up: FLAT }, { dir: frame.dir(dirW), up: frame.dir(upW) });
        return {
          hips: { move: hipsMove, rotate: hipsR },
          spine: { rotate: spineR },
          chest: { rotate: chestR },
          head: { rotate: [-11 * coil - 8 * lunge, 20 * coil - 16 * lunge, 0] },
          'ear.L': { rotate: [6 * flop, 12 * flop - 4 * coil, 5 * coil - 6 * flop] },
          'ear.R': { rotate: [6 * flop, -12 * flop + 4 * coil, -5 * coil + 6 * flop] },
          tail: { rotate: [8 * flop, 10 * coil - 14 * lunge, 0] },
          'tail.2': { rotate: [0, 8 * coil - 10 * lunge, 0] },
          'tail.3': { rotate: [6 * flop, 6 * coil - 12 * lunge, 0] },
          'upperarm.R': { rotate: arm.upper },
          'forearm.R': { rotate: arm.lower },
          'hand.R': { rotate: hand },
          'upperarm.L': { rotate: [-14 * coil + 28 * lunge, 0, 8 * coil + 14 * lunge] },
          'forearm.L': { rotate: [-24 * coil - 10 * lunge, 0, 0] },
          'leg.L': { rotate: [legL, 0, 0] },
          'leg.R': { rotate: [legR, 0, 0] },
          'foot.L': { rotate: [-legL, 0, 0] },
          'foot.R': { rotate: [-legR - 10 * step, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ hit: a blow from the front
    const SHIN = 0.125; // hip joint to ankle joint, in the Y-Z plane
    const HEEL = 0.077; // the back of the foot, behind the ankle's ground point
    /** The leg angle (degrees) that keeps a foot on its rest spot when the hips move `back` meters. */
    const plant = (back: number) => Math.asin(Math.max(-1, Math.min(1, back / SHIN))) / DEG;
    k.animation('hit', {
      duration: 0.4,
      loop: false,
      pose: (_t, p) => {
        const h = keys(p, [[0, 0], [0.15, 1], [0.32, 0.85], [0.8, 0]] as const);
        const lift = keys(p, [[0.04, 0], [0.13, 1], [0.24, 0], [0.5, 0], [0.62, 0.7], [0.74, 0]] as const);
        const flop = keys(p, [[0.08, 0], [0.3, 1], [0.5, -0.4], [0.68, 0.15], [0.85, 0]] as const);
        const back = 0.028 * h;
        const lean = plant(back);
        return {
          hips: { move: [0, -legDrop(SHIN, lean), -back], rotate: [0, 5 * h, 0] },
          spine: { rotate: [-6 * h, 0, 0] },
          chest: { rotate: [-10 * h, 6 * h, 3 * h] },
          neck: { rotate: [-6 * h, 0, 0] },
          head: { rotate: [-16 * h, -6 * h, -5 * h] },
          'ear.L': { rotate: [4 * flop, -10 * flop, 6 * flop] },
          'ear.R': { rotate: [4 * flop, 10 * flop, -6 * flop] },
          tail: { rotate: [12 * flop, 4 * flop, 0] },
          'tail.3': { rotate: [10 * flop, 8 * flop, 0] },
          'leg.L': { rotate: [-lean, 0, 0] },
          'foot.L': { rotate: [lean, 0, 0] },
          'leg.R': { rotate: [lean + 16 * lift, 0, 0] },
          'foot.R': { rotate: [-lean - 16 * lift, 0, 0] },
          'upperarm.L': { rotate: [-18 * h, 0, 20 * h] },
          'forearm.L': { rotate: [-16 * h, 0, 0] },
          'upperarm.R': { rotate: [-6 * h, 0, -8 * h] },
          'forearm.R': { rotate: [-6 * h, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ death: a stagger, then a fall on the back
    // As the goblin: the chest snaps back, the kobold slumps and wobbles, then tips back over its
    // heels and lands on its back. The arms lie out on the ground; the hand opens and the spear
    // drops to lie flat beside the right side, the point toward the feet. The ears turn out flat
    // and the tail lifts in the fall, then swings out to lie on the ground to the left.
    const { euler } = motion;
    const LIE = 86; // the hips' final tilt back, degrees
    const LIE_Y = 0.15; // the hips' height when the kobold lies on its back
    const ARM_L = { root: SHOULDER, mid: ELBOW, end: WRIST };
    const HAND_CHAIN: readonly V3[] = [...TRUNK, mx(SHOULDER), ELBOW_R, WRIST_R];
    const DROP_AT: V3 = [-0.46, 0.066, -0.12]; // the grip point on the ground
    const DROP_TURN = quat(orient([], { dir: GRIP_DIR, up: FLAT }, { dir: norm([-0.1, 0, 1]), up: [0, 1, 0] }));
    k.animation('death', {
      duration: 1.4,
      loop: false,
      pose: (_t, p) => {
        const hitB = keys(p, [[0, 0], [0.07, 1], [0.18, 0.5], [0.3, 0.2], [0.4, 0]] as const);
        const sag = keys(p, [[0.1, 0], [0.26, 1], [0.36, 0.8], [0.5, 0]] as const);
        const wob = keys(p, [[0.12, 0], [0.22, 1], [0.32, -0.6], [0.42, 0]] as const);
        const u = Math.min(1, Math.max(0, (p - 0.36) / 0.24));
        const bounce = keys(p, [[0.6, 0], [0.66, 1], [0.73, 0]] as const);
        const tilt = LIE * u * u - 5 * bounce;
        const fly = keys(p, [[0.36, 0], [0.5, 1], [0.62, 0.2], [0.7, 0]] as const);
        const land = keys(p, [[0.44, 0], [0.62, 1]] as const);
        const loose = keys(p, [[0.44, 0], [0.6, 1]] as const);
        const tailLift = keys(p, [[0.3, 0], [0.48, 1], [0.62, 0.5], [0.72, 0]] as const);
        const back = 0.022 * hitB;
        const lean = plant(back);
        const a = tilt * DEG;
        const hipsY = Math.max(LIE_Y, 0.2 * Math.cos(a) + HEEL * Math.sin(a));
        const hipsMove: V3 = [0, hipsY - 0.2 - legDrop(SHIN, lean), -HEEL - 0.2 * Math.sin(a) + HEEL * Math.cos(a) - back];
        const legs = 16 * Math.min(1, Math.max(0, (tilt - 66) / 18));
        const hipsR: V3 = [-tilt, 0, 0];
        const spineR: V3 = [-8 * hitB + 6 * sag, 0, 4 * wob];
        const chestR: V3 = [-10 * hitB + 5 * sag, 6 * hitB, 5 * wob];
        const standR = add(add(add(WRIST_R, [-0.05, 0.02, -0.05], hitB), [0, -0.07, -0.03], sag), [-0.07, 0, 0.04], fly);
        const armR = reach(ARM_R, lerp(standR, [-0.27, 0.34, -0.07], land), lerp(ELBOW_R, [-0.25, 0.3, -0.2], land));
        const standL = add(add(add(WRIST, [0.05, 0.05, 0.06], hitB), [0, -0.02, 0.03], sag), [0.07, 0.06, 0.08], fly);
        const armL = reach(ARM_L, lerp(standL, [0.27, 0.34, -0.07], land), lerp(ELBOW, [0.25, 0.3, -0.2], land));
        const handQ = quat(hipsR).multiply(quat(spineR)).multiply(quat(chestR)).multiply(quat(armR.upper)).multiply(quat(armR.lower));
        const held = add(follow(HAND_CHAIN, [hipsR, spineR, chestR, armR.upper, armR.lower, [0, 0, 0]], GUARD), hipsMove);
        const drop = keys(p, [[0.44, add(DROP_AT, [0, 0.12, 0])], [0.6, DROP_AT], [0.65, add(DROP_AT, [0, 0.02, 0])], [0.7, DROP_AT]] as const);
        const inv = handQ.clone().invert();
        const d = new THREE.Vector3(...add(lerp(held, drop, loose), held, -1)).applyQuaternion(inv);
        return {
          hips: { move: hipsMove, rotate: hipsR },
          spine: { rotate: spineR },
          chest: { rotate: chestR },
          neck: { rotate: [-8 * hitB + 5 * sag, 0, 0] },
          head: { rotate: [-16 * hitB + 8 * sag + 6 * land, -8 * hitB, 8 * wob + 6 * land] },
          'ear.L': { rotate: [0, -6 * hitB - 32 * land, 5 * wob + 8 * fly] },
          'ear.R': { rotate: [0, 6 * hitB + 32 * land, -5 * wob - 8 * fly] },
          tail: { rotate: [40 * tailLift, -80 * land, 0] },
          'tail.2': { rotate: [0, -15 * land, 0] },
          'tail.3': { rotate: [10 * tailLift, -20 * land, 0] },
          'upperarm.L': { rotate: armL.upper },
          'forearm.L': { rotate: armL.lower },
          'upperarm.R': { rotate: armR.upper },
          'forearm.R': { rotate: armR.lower },
          spear: { move: [d.x, d.y, d.z], rotate: euler(inv.clone().multiply(handQ.clone().slerp(DROP_TURN, loose))) },
          'leg.L': { rotate: [-lean + legs, 0, 8 * land] },
          'leg.R': { rotate: [-lean + legs, 0, -8 * land] },
          'foot.L': { rotate: [lean, 20 * land, 0] },
          'foot.R': { rotate: [lean, -20 * land, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ taunt: point, hop, thump
    // Played when the kobold first sees the player. It levels the spear at the player, the left
    // fist on the hip; it hops from foot to foot twice, the head cocked and the ears flicking; then
    // it pulls the spear upright and thumps the butt on the floor twice.
    const FIST_OFF: V3 = [FIST_R[0] - WRIST_R[0], FIST_R[1] - WRIST_R[1], FIST_R[2] - WRIST_R[2]];
    const FIST_POINT: V3 = [-0.225, 0.37, 0.19]; // the spear level at chest height, out beside the body
    const Q_REST = new THREE.Quaternion();
    const Q_POINT = quat(orient([], { dir: GRIP_DIR, up: FLAT }, { dir: [0, 0, 1], up: [0, -1, 0] }));
    const POLE_POINT: V3 = [-0.42, 0.34, 0.08];
    const WRIST_HIP: V3 = [0.2, 0.3, -0.005];
    const POLE_HIP: V3 = [0.42, 0.42, -0.14];
    const HIPS_AT: V3 = [0, 0.2, 0];
    const HOP = 0.075;
    const FLY = 0.11;
    const V = (4 * HOP) / FLY;
    const HIPS_Y: readonly (readonly [number, number, number])[] = [
      [0.15, 0, 0],
      [0.215, -0.034, 0],
      [0.25, 0, V],
      [0.305, HOP, 0],
      [0.36, 0, -V],
      [0.395, -0.035, 0],
      [0.43, 0, V],
      [0.485, HOP, 0],
      [0.54, 0, -V],
      [0.575, -0.032, 0],
      [0.65, 0, 0],
    ];
    const hipsY = (p: number) => {
      if (p <= HIPS_Y[0]![0] || p >= HIPS_Y[HIPS_Y.length - 1]![0]) return 0;
      let i = 0;
      while (p > HIPS_Y[i + 1]![0]) i++;
      const [t0, y0, m0] = HIPS_Y[i]!;
      const [t1, y1, m1] = HIPS_Y[i + 1]!;
      const s = t1 - t0;
      const u = (p - t0) / s;
      const u2 = u * u;
      const u3 = u2 * u;
      return (2 * u3 - 3 * u2 + 1) * y0 + (u3 - 2 * u2 + u) * m0 * s + (-2 * u3 + 3 * u2) * y1 + (u3 - u2) * m1 * s;
    };
    const TUCK = 0.075;
    const legTo = (right: boolean, ankleW: V3, pitch: number, hipsR: V3, hipsMove: V3) => {
      const f = (v: V3) => (right ? mx(v) : v);
      const qH = quat(hipsR);
      const t = new THREE.Vector3(ankleW[0] - HIPS_AT[0] - hipsMove[0], ankleW[1] - HIPS_AT[1] - hipsMove[1], ankleW[2] - HIPS_AT[2] - hipsMove[2])
        .applyQuaternion(qH.clone().invert());
      const leg = reach({ root: f(HIP), mid: f(KNEE), end: f(ANKLE) }, add(HIPS_AT, [t.x, t.y, t.z]), f([HIP[0] + 0.02, KNEE[1], 0.3]));
      const foot = euler(qH.multiply(quat(leg.upper)).multiply(quat(leg.lower)).invert().multiply(quat([pitch, 0, 0])));
      return { leg: leg.upper, shin: leg.lower, foot };
    };
    k.animation('taunt', {
      duration: 1.4,
      loop: false,
      pose: (_t, p) => {
        const up = keys(p, [[0, 0], [0.14, 1]] as const); // rest to the point
        const jab = keys(p, [[0.12, 0], [0.17, 1], [0.24, 0]] as const); // "you!": a short thrust
        const upright = keys(p, [[0.58, 0], [0.66, 1]] as const); // the point back to upright
        // Raise the spear and slam the butt down, twice; then it settles back to rest.
        const thump = keys(p, [[0.64, 0], [0.68, 1], [0.715, -0.9], [0.74, 1], [0.775, -0.9], [0.8, -0.9], [0.92, 0]] as const);
        const akimbo = keys(p, [[0, 0], [0.14, 1], [0.82, 1], [1, 0]] as const);
        const cock = keys(p, [[0.06, 0], [0.2, 1], [0.8, 1], [1, 0]] as const);
        const side = keys(p, [[0.2, 0], [0.3, 1], [0.4, 1], [0.48, -1], [0.56, -1], [0.64, 0]] as const);
        const h = hipsY(p);
        const land = Math.min(1, Math.max(0, -h / 0.035));
        const env = keys(p, [[0.16, 0], [0.22, 1], [0.58, 1], [0.66, 0]] as const);
        const flick = env * Math.sin((2 * Math.PI * (p - 0.2)) / 0.18);
        const hipsR: V3 = [0, 0, -5 * side];
        const hipsMove: V3 = [0.01 * side, h, 0];
        const tuckL = keys(p, [[0.43, 0], [0.47, 1], [0.56, 1], [0.62, 0]] as const);
        const tuckR = keys(p, [[0.25, 0], [0.29, 1], [0.44, 1], [0.51, 0]] as const);
        const ankle = (a: number, s: number): V3 => [0.012 * a * s, a * (h + TUCK) + (1 - a) * 0.9 * Math.max(0, h), -0.025 * a];
        const legsL = legTo(false, add(ANKLE, ankle(tuckL, 1)), 10 * tuckL, hipsR, hipsMove);
        const legsR = legTo(true, add(mx(ANKLE), ankle(tuckR, -1)), 10 * tuckR, hipsR, hipsMove);
        const spineR: V3 = [-4 * cock * (1 - upright) + 3 * land + 4 * Math.max(0, -thump), 0, 3 * side];
        const chestR: V3 = [-3 * cock * (1 - upright), 10 * up * (1 - upright), 0];
        const frame = chestFrame([hipsR, spineR, chestR], hipsMove);
        const pointAt = add(FIST_POINT, [0, 0, 0.03], jab);
        const fist = add(lerp(lerp(FIST_R, pointAt, up), add(FIST_R, [0, 0.07, 0.01], thump), upright), hipsMove);
        const turn = Q_REST.clone().slerp(Q_POINT, up).slerp(Q_REST, upright);
        const off = new THREE.Vector3(...FIST_OFF).applyQuaternion(turn);
        const wrist: V3 = [fist[0] - off.x, fist[1] - off.y, fist[2] - off.z];
        const pole = lerp(lerp(ELBOW_R, POLE_POINT, up), ELBOW_R, upright);
        const arm = reach(ARM_R, frame.point(wrist), frame.point(add(pole, hipsMove)));
        const dirW = new THREE.Vector3(...GRIP_DIR).applyQuaternion(turn);
        const upW = new THREE.Vector3(...FLAT).applyQuaternion(turn);
        const hand = orient(
          [arm.upper, arm.lower],
          { dir: GRIP_DIR, up: FLAT },
          { dir: frame.dir([dirW.x, dirW.y, dirW.z]), up: frame.dir([upW.x, upW.y, upW.z]) },
        );
        const armL = reach(ARM_L, lerp(WRIST, WRIST_HIP, akimbo), lerp(ELBOW, POLE_HIP, akimbo));
        return {
          hips: { move: hipsMove, rotate: hipsR },
          spine: { rotate: spineR },
          chest: { rotate: chestR },
          neck: { rotate: [4 * land, 0, 0] },
          // The head cocks to its left, away from the spear, the chin a little down: a sneer.
          head: { rotate: [5 * cock, 0, -10 * cock - 3 * side] },
          'ear.L': { rotate: [0, 22 * flick, 8 * up * (1 - upright) - 6 * land + 8 * flick] },
          'ear.R': { rotate: [0, -22 * flick, -8 * up * (1 - upright) + 6 * land - 8 * flick] },
          tail: { rotate: [4 * env, 14 * flick, 0] },
          'tail.2': { rotate: [0, 12 * flick, 0] },
          'tail.3': { rotate: [6 * env, 16 * flick, 0] },
          'upperarm.R': { rotate: arm.upper },
          'forearm.R': { rotate: arm.lower },
          'hand.R': { rotate: hand },
          'upperarm.L': { rotate: armL.upper },
          'forearm.L': { rotate: armL.lower },
          'leg.L': { rotate: legsL.leg },
          'shin.L': { rotate: legsL.shin },
          'foot.L': { rotate: legsL.foot },
          'leg.R': { rotate: legsR.leg },
          'shin.R': { rotate: legsR.shin },
          'foot.R': { rotate: legsR.foot },
        };
      },
    });
  },
  }),
  1.15,
);
