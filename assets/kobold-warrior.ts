import { defineAsset, motion, noise, profile, sdf, Sdf, THREE } from '../src/index.js';

/**
 * Kobold warrior — a P1 dungeon denizen of the Sunken Vault (catalog
 * `enemies/humanoid/kobold-warrior`), about 0.87 m to the horn tips, faces +Z. Target:
 * docs/enemy-mockups/kobold-warrior_001.jpg. Built on the goblin warrior (same skeleton, knees,
 * clip set, and right-hand weapon bone).
 *
 * Role: a small, common, cowardly-mean enemy in packs; seen in 3D and as a 128 px sprite.
 * One idea: a rust-orange reptile-dog with a long toothy snout, big yellow eyes, and a crude
 *   spear taller than itself; the snout, the frill ears, and the spear are the silhouette.
 * Proportions (on the goblin's body): cranium center 0.69, eyes 0.708, snout tip z 0.27,
 *   horn tips 0.87, shoulders 0.41, pot belly 0.27, tail to z -0.49, spear tip 1.08.
 * Shape language: round (cranium, belly, haunches) with small sharp points (teeth, horns, crown
 *   spikes, claws, spear barbs); one long horizontal snout.
 * Palette: rust-orange scales #c8602e with darker scale edges; cream belly, jaw, and throat
 *   #e8b070; dark leather vest and pads #5e3c28; darker straps #3a2519; iron ring and rivets;
 *   ivory horns with dark bases; grey claws; a dark wood spear with rope and a beige rag.
 * Value plan: the yellow eyes with dark pupils and heavy lids are the focal point; the cream
 *   belly and jaw against the rust scales carry the body; the dark vest frames the belly.
 * Bodies: skin, eyes, teeth, horns, claws, vest, straps, iron, spear-shaft, spear-head, rope, rag.
 * Rig: the goblin's chibi skeleton with `ear.L`/`ear.R`, plus `tail`, `tail.2`, `tail.3` (the
 *   scarf `knot` is gone); the spear is rigid on `spear`, a child of `hand.R` that the death clip
 *   moves (the spear drops to the ground).
 *   Clips: idle, walk, run, attack (a spear thrust from the hip), hit, death (falls on its back),
 *   taunt (points the spear at the player, hops foot to foot twice, thumps the butt down twice).
 */

const C = {
  scales: '#c8602e',
  scalesDark: '#9a4420',
  belly: '#e8b070',
  bellyDark: '#c98c56',
  earInner: '#d99a68',
  eye: '#e8b818',
  eyeLow: '#c8860e',
  pupil: '#141012',
  lid: '#3a1a10',
  mouth: '#3a1810',
  nostril: '#4a1e10',
  tooth: '#f2ead2',
  horn: '#e6dab8',
  hornBase: '#4e3226',
  claw: '#8e8a84',
  vest: '#5e3c28',
  vestLight: '#7a5238',
  strap: '#3a2519',
  iron: '#8a8c90',
  wood: '#5a3a26',
  steel: '#a2a6ac',
  steelDark: '#74787e',
  rope: '#c9b48a',
  rag: '#b8a27c',
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

// Joints. The left arm hangs relaxed; the right fist holds the spear upright beside the body.
const SHOULDER: V3 = [0.14, 0.405, 0];
const ELBOW: V3 = [0.2, 0.335, 0.01];
const WRIST: V3 = [0.222, 0.262, 0.03];
const ELBOW_R: V3 = [-0.2, 0.335, 0.03];
const WRIST_R: V3 = [-0.232, 0.292, 0.1];
const HIP: V3 = [0.075, 0.2, 0];
const ANKLE: V3 = [0.108, 0.075, 0];
const KNEE: V3 = [0.0915, 0.1375, 0]; // the knee: splits the leg (shin.L takes the weight below it)
const TAIL0: V3 = [0, 0.22, -0.1];
const TAIL1: V3 = [0, 0.16, -0.22];
const TAIL2: V3 = [0, 0.11, -0.32];
const EAR: V3 = [0.118, 0.665, -0.075];
// The spear: nearly upright, the top a little out and forward; the grip point sits just above the fist.
const SPEAR_TILT = { z: 6, x: 8 };
const GRIP_DIR = norm([
  -Math.sin(SPEAR_TILT.z * DEG),
  Math.cos(SPEAR_TILT.z * DEG) * Math.cos(SPEAR_TILT.x * DEG),
  Math.cos(SPEAR_TILT.z * DEG) * Math.sin(SPEAR_TILT.x * DEG),
]);
const FLAT: V3 = [0, -Math.sin(SPEAR_TILT.x * DEG), Math.cos(SPEAR_TILT.x * DEG)]; // spearhead flat normal at rest
const FIST_R = add(WRIST_R, norm([WRIST_R[0] - ELBOW_R[0], WRIST_R[1] - ELBOW_R[1], WRIST_R[2] - ELBOW_R[2]]), 0.04);
const GUARD = add(FIST_R, GRIP_DIR, 0.048);
const spearPose = (s: sdf.Shape) => s.rotateZ(SPEAR_TILT.z).rotateX(SPEAR_TILT.x).at(...GUARD);
const BUTT = 0.245; // grip point to the butt
const TOP = 0.6; // grip point to the socket

/** A relaxed claw hanging from the wrist `w`. */
const fistAt = (w: V3) =>
  sdf.smoothUnion(
    0.02,
    sdf.ellipsoid([0.046, 0.05, 0.05]).at(w[0] + 0.008, w[1] - 0.044, w[2] + 0.004),
    sdf.capsule([w[0] - 0.01, w[1] - 0.068, w[2] + 0.034], [w[0] - 0.006, w[1] - 0.044, w[2] + 0.05], 0.02),
    sdf.cone([w[0] + 0.024, w[1] - 0.026, w[2] + 0.029], [w[0] + 0.001, w[1] - 0.038, w[2] + 0.056], 0.019, 0.015),
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
// The mouth line: along the snout at 0.597, rising into the cheek at the back (a grin).
const mouthY = (z: number) => 0.597 + 0.03 * Math.pow(Math.max(0, (0.07 - z) / 0.09), 1.6);

export default defineAsset({
  name: 'kobold-warrior',
  description:
    'Chibi kobold warrior enemy: a rust-orange scaly reptile-dog with a long toothy snout, big yellow eyes, small horns, frill ears, a tail, a battered leather vest with straps, and a crude spear with a rag.',
  detail: 0.005,
  reference: 'docs/enemy-mockups/kobold-warrior_001.jpg',
  // Color slots for individual kobolds (the first option is the default look).
  variants: {
    scales: { rust: C.scales, olive: '#86883a', slate: '#56708a', sand: '#c8a060' },
    eyes: { yellow: C.eye, red: '#c83a1e', green: '#8cb82e' },
    vest: { leather: C.vest, grey: '#4a4846' },
  },
  presets: {
    swamp: { scales: 'olive', eyes: 'yellow', vest: 'leather' },
    deep: { scales: 'slate', eyes: 'red', vest: 'grey' },
    dune: { scales: 'sand', eyes: 'green', vest: 'leather' },
  },

  build(k) {
    // The slot colors: the belly, jaw, and ear membranes follow the scales halfway (pale on every hide).
    const TS = {
      scales: k.tint('scales'),
      scalesDark: k.tint('scales', { color: C.scalesDark, follow: 1 }),
      belly: k.tint('scales', { color: C.belly, follow: 0.5 }),
      bellyDark: k.tint('scales', { color: C.bellyDark, follow: 0.5 }),
      earInner: k.tint('scales', { color: C.earInner, follow: 0.5 }),
      eye: k.tint('eyes'),
      eyeLow: k.tint('eyes', { color: C.eyeLow, follow: 1 }),
      vest: k.tint('vest'),
      vestLight: k.tint('vest', { color: C.vestLight, follow: 1 }),
    };
    const EAR_TIP: V3 = [0.31, 0.71, -0.22];
    // ------------------------------------------------------------------ skeleton
    k.skeleton({
      hips: { at: [0, 0.2, 0] },
      spine: { parent: 'hips', at: [0, 0.27, 0] },
      chest: { parent: 'spine', at: [0, 0.35, 0] },
      neck: { parent: 'chest', at: [0, 0.46, -0.01] },
      head: { parent: 'neck', at: [0, 0.51, -0.01] },
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

    // ------------------------------------------------------------------ head: cranium, long snout, jaw
    const EYE_C: V3 = [0.08, 0.708, 0.088];
    const EYE_DIR = norm([0.42, 0.04, 1]);
    const headCore = sdf.smoothUnion(
      0.045,
      sdf.ellipsoid([0.148, 0.132, 0.145]).at(0, 0.69, -0.03), // cranium
      pair(sdf.sphere(0.068).at(0.082, 0.628, 0.02)), // cheeks at the jaw hinge
      sdf.ellipsoid([0.082, 0.058, 0.145]).at(0, 0.638, 0.13), // the upper jaw
    );
    const brows = pair(sdf.ellipsoid([0.054, 0.022, 0.04]).rotateZ(18).at(0.082, 0.752, 0.072));
    // The upper lids: a cap over the top third of each eyeball, the inner end lower (a mean glare).
    const LID_UP = norm([-0.32, 0.95, 0.1]);
    const lidCut = (h: number) => sdf.halfSpace(LID_UP.map((c) => -c) as unknown as V3, -h).at(...EYE_C);
    const lid = pair(sdf.sphere(0.046).at(...EYE_C).intersect(lidCut(0.016)));
    const head = headCore
      .smoothUnion(0.02, sdf.ellipsoid([0.066, 0.052, 0.046]).at(0, 0.654, 0.245)) // the round nose end
      .smoothUnion(0.012, sdf.ellipsoid([0.066, 0.034, 0.112]).at(0, 0.585, 0.108)) // the lower jaw, set in
      .smoothUnion(0.03, brows)
      .smoothUnion(0.006, lid)
      .smoothUnion(0.012, pair(sdf.cone([0.022, 0.806, 0.004], [0.03, 0.852, 0.016], 0.016, 0.003))) // crown spikes
      .bone('head');
    const faceZ = (x: number, y: number) => sdf.raycast(head, [x, y, 1], [0, 0, -1])![2];

    // Frill ears: a flat leaf drawn outward along +X (base at the origin, the cup facing +Z), with
    // a scalloped lower edge and dark ribs, swept back from the jaw hinge.
    const earOutline = profile.polygon(
      [
        [-0.05, 0.105],
        [0.05, 0.11],
        [0.15, 0.113],
        [0.225, 0.112],
        [0.258, 0.1],
        [0.225, 0.07],
        [0.17, 0.015],
        [0.105, -0.05],
        [0.04, -0.1],
        [-0.05, -0.125],
      ],
      { smooth: true, samples: 5 },
    );
    const earCup = sdf.extrude(profile.offsetProfile(earOutline, -0.028), 0.03, 0.01).at(0.012, 0.004, 0.02);
    const scallops = sdf.union(
      ...[
        [0.214, 0.064],
        [0.158, 0.008],
        [0.098, -0.052],
      ].map(([x, y]) => sdf.extrude(profile.circle(0.02), 0.2).at(x!, y!, 0)),
    );
    const rib = (bx: number, by: number) =>
      sdf.extrude(
        profile.polygon([
          [0.0, -0.004],
          [bx, by - 0.003],
          [bx, by + 0.003],
          [0.0, 0.004],
        ]),
        0.2,
      );
    const ribs = sdf.union(rib(0.235, 0.1), rib(0.19, 0.045), rib(0.13, -0.015));
    const earLocal = sdf.extrude(earOutline, 0.028, 0.012).smoothSubtract(0.01, earCup).smoothSubtract(0.006, scallops);
    const EAR_CUP = 0.014;
    const cupOffset = (x: number, y: number) => {
      const ramp = Math.min(1, Math.max(0, (x + 0.03) / 0.12));
      const across = (y - (0.01 + 0.35 * x)) / Math.max(0.035, 0.1 - 0.3 * x);
      return EAR_CUP * ramp * across * across;
    };
    const cupped = (s: sdf.Shape): sdf.Shape =>
      new Sdf(
        (x, y, z) => s.dist(x, y, z - cupOffset(x, y)) * 0.75,
        { min: s.bounds.min, max: [s.bounds.max[0], s.bounds.max[1], s.bounds.max[2] + EAR_CUP * 3] },
        (x, y, z, f) => s.color(x, y, z - cupOffset(x, y), f),
      );
    const earPose = (s: sdf.Shape) => s.scale(0.95).rotateX(-18).rotateY(36).at(...EAR);
    const ears = pair(
      earPose(cupped(earLocal.paintWhere(earCup.round(0.004), TS.earInner, 0.008).paintWhere(ribs, TS.scalesDark, 0.003))).bone('ear.L'),
    );

    const neck = sdf.capsule([0, 0.44, -0.01], [0, 0.56, -0.01], 0.058).bone('neck');

    // ------------------------------------------------------------------ body: pot belly, arms, haunches, feet, tail
    const torso = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.5],
            [0.06, 0.497],
            [0.1, 0.48],
            [0.126, 0.45],
            [0.136, 0.4],
            [0.14, 0.34],
            [0.148, 0.28],
            [0.154, 0.23],
            [0.148, 0.19],
            [0.115, 0.165],
            [0, 0.16],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.85])
      .smoothUnion(0.04, sdf.ellipsoid([0.12, 0.12, 0.1]).at(0, 0.27, 0.06)); // the pot belly
    const chestPart = sdf.ellipsoid([0.125, 0.08, 0.1]).at(0, 0.43, 0);

    const armL = sdf.smoothUnion(
      0.02,
      sdf.cone(SHOULDER, ELBOW, 0.05, 0.042).bone('upperarm.L'),
      sdf.cone(ELBOW, WRIST, 0.042, 0.038).bone('forearm.L'),
      fistAt(WRIST).bone('hand.L'),
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
      sdf.ellipsoid([0.12, 0.06, 0.1]).at(0, 0.21, -0.005).bone('hips'),
      pair(
        sdf
          .smoothUnion(
            0.03,
            sdf.cone(HIP, [ANKLE[0], 0.1, 0.004], 0.062, 0.044),
            sdf.ellipsoid([0.062, 0.062, 0.068]).at(0.088, 0.17, 0.004), // haunch
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
    const scaleLines = region((x, y, z) => (scaleCells(x, y, z) - 0.09) / (2 * SCALE_F));
    const bellyZone = sdf.smoothUnion(
      0.04,
      sdf.ellipsoid([0.105, 0.14, 0.2]).at(0, 0.29, 0.1),
      sdf.ellipsoid([0.055, 0.1, 0.15]).at(0, 0.47, 0.06),
    );
    const plateLines = region((x, y) => {
      const t = (y - 0.19) / 0.034;
      return Math.min(Math.abs(t - Math.round(t)) * 0.034, Math.abs(x)) - 0.0016;
    }).intersect(sdf.ellipsoid([0.09, 0.1, 0.2]).at(0, 0.27, 0.1));
    const jawZone = region((x, y, z) => Math.max(y - mouthY(z) + 0.001, Math.abs(x) - 0.075, -z)).intersect(
      sdf.box([0.4, 0.2, 0.5]).at(0, 0.52, 0.15),
    );
    const mouthLine = region((_x, y, z) => (z < -0.025 ? 0.05 : Math.abs(y - mouthY(z)) - 0.0035)).intersect(
      sdf.box([0.4, 0.12, 0.4]).at(0, 0.6, 0.12),
    );
    const noseFront = faceZ(0.022, 0.662);
    const nostrils = pair(sdf.ellipsoid([0.012, 0.009, 0.02]).at(0.024, 0.662, noseFront));
    const lidLine = pair(
      sdf
        .sphere(0.05)
        .intersect(sdf.halfSpace(LID_UP, 0.022))
        .intersect(sdf.halfSpace(LID_UP.map((c) => -c) as unknown as V3, -0.012))
        .at(...EYE_C),
    );

    const scaly = sdf
      .smoothUnion(0.03, torso.bone('spine'), chestPart.bone('chest'), legs, tail)
      .smoothUnion(0.02, armL, armR, feet)
      .smoothUnion(0.03, sdf.smoothUnion(0.03, head, neck))
      .paintWhere(scaleLines, TS.scalesDark, 0.0015);
    const skin = scaly
      .smoothUnion(0.02, ears)
      .paintWhere(bellyZone, TS.belly, 0.012)
      .paintWhere(plateLines, TS.bellyDark, 0.002)
      .paintWhere(jawZone, TS.belly, 0.004)
      .paintWhere(mouthLine, C.mouth, 0.002)
      .paintWhere(nostrils, C.nostril, 0.003)
      .paintWhere(lidLine, C.lid, 0.002);
    // Scale domes with grooves between them; horizontal plates on the belly.
    const bellyTest = (x: number, y: number, z: number) => z > 0.06 && (x / 0.09) ** 2 + ((y - 0.28) / 0.11) ** 2 < 1;
    k.body('skin', skin, {
      color: TS.scales,
      roughness: 0.55,
      textureDensity: 2,
      detail: 0.0045,
      bump: (x, y, z) => {
        if (bellyTest(x, y, z)) {
          const t = (y - 0.19) / 0.034;
          return 0.0012 * Math.min(1, (Math.abs(t - Math.round(t)) * 0.034) / 0.006);
        }
        return 0.0016 * Math.min(1, scaleCells(x, y, z) / 0.3);
      },
    });

    // ------------------------------------------------------------------ eyes: glossy yellow balls
    const eyeBall = (side: number) => {
      const c: V3 = [EYE_C[0] * side, EYE_C[1], EYE_C[2]];
      const d: V3 = [EYE_DIR[0] * side, EYE_DIR[1], EYE_DIR[2]];
      const shineDir = norm(add(d, [0.3, 0.42, 0]));
      return sdf
        .sphere(0.042)
        .at(...c)
        .paintWhere(sdf.halfSpace([0, 1, 0], c[1] - 0.012).intersect(sdf.sphere(0.06).at(...c)), TS.eyeLow, 0.012)
        .paintWhere(sdf.ellipsoid([0.024, 0.026, 0.02]).at(...add(c, d, 0.042)), C.pupil, 0.002)
        .paintWhere(sdf.sphere(0.008).at(...add(c, shineDir, 0.042)), '#ffffff', 0.002);
    };
    k.body('eyes', sdf.union(eyeBall(1), eyeBall(-1)), { color: TS.eye, roughness: 0.15, detail: 0.003, textureDensity: 2, bone: 'head' });

    // ------------------------------------------------------------------ teeth along the upper jaw
    const teeth: sdf.Shape[] = [];
    for (const a of [12, 32, 52, 72, 90]) {
      for (const side of [1, -1]) {
        const d: V3 = [side * Math.sin(a * DEG), 0, Math.cos(a * DEG)];
        const hit = sdf.raycast(head, [d[0] * 0.5, 0.603, 0.12 + d[2] * 0.5], [-d[0], 0, -d[2]]);
        if (!hit) continue;
        const long = a === 32 ? 0.022 : 0.015;
        teeth.push(sdf.cone(add(add(hit, d, -0.004), [0, 0.004, 0]), add(add(hit, d, 0.001), [0, -long, 0]), 0.0065, 0.0015));
      }
    }
    k.body('teeth', sdf.union(...teeth).bone('head'), { color: C.tooth, roughness: 0.35, detail: 0.003 });

    // ------------------------------------------------------------------ horns: ivory, dark wrapped bases
    const hornLocal = sdf
      .chain(
        [
          [0, 0, 0, 0.024],
          [0.008, 0.035, -0.006, 0.018],
          [0.018, 0.062, -0.022, 0.011],
          [0.022, 0.078, -0.045, 0.004],
        ],
        0.01,
      )
      .paintWhere(sdf.sphere(0.034).at(0, 0.008, 0), C.hornBase, 0.004);
    k.body('horns', pair(hornLocal.scale(1.25).at(0.07, 0.785, -0.065)), { color: C.horn, roughness: 0.45, detail: 0.0035, bone: 'head' });

    // ------------------------------------------------------------------ claws: fingers and toes
    const clawsL = sdf.union(
      ...[0, 1, 2].map((i) => {
        const x = WRIST[0] - 0.02 + 0.017 * i;
        return sdf.cone([x, WRIST[1] - 0.08, WRIST[2] + 0.046], [x + 0.002, WRIST[1] - 0.102, WRIST[2] + 0.036], 0.009, 0.002);
      }),
    );
    const clawsR = spearPose(
      sdf.union(...[-0.07, -0.05, -0.03].map((y) => sdf.cone([0.012, y, 0.046], [-0.012, y - 0.004, 0.05], 0.008, 0.002))),
    );
    const toeClaws = footPose(sdf.union(...TOES.map((dx) => sdf.cone([dx * 1.02, 0.024, 0.104], [dx * 1.08, 0.006, 0.134], 0.014, 0.003))));
    k.body('claws', sdf.union(clawsL.bone('hand.L'), clawsR.bone('hand.R'), pair(toeClaws)), { color: C.claw, roughness: 0.4, detail: 0.0035 });

    // ------------------------------------------------------------------ vest: open front, jagged hem, shoulder pads, bracers, cuffs
    const notch = (angle: number, top: number) =>
      sdf
        .extrude(
          profile.polygon([
            [-0.028, 0.27],
            [0.028, 0.27],
            [0, top],
          ]),
          0.5,
        )
        .rotateY(angle);
    const hem = sdf.union(...[0, 30, 60, 90, 120, 150].map((a, i) => notch(a + 14, 0.33 + 0.012 * ((i * 7) % 3))));
    const opening = sdf
      .extrude(
        profile.polygon([
          [-0.04, 0.54],
          [0.04, 0.54],
          [0.095, 0.29],
          [-0.095, 0.29],
        ]),
        0.4,
      )
      .at(0, 0, 0.2);
    const vestBand = torso
      .round(0.012)
      .smoothIntersect(0.006, sdf.box([0.5, 0.215, 0.5]).at(0, 0.41, 0))
      .smoothSubtract(0.005, opening)
      .subtract(hem)
      .displace(0.0015, (x, y, z) => noise.fbm(x * 30, y * 30, z * 30, 2));
    const lame = (s: number) =>
      sdf
        .ellipsoid([0.085 * s, 0.05 * s, 0.082 * s])
        .intersect(sdf.halfSpace([0, -1, 0], 0.012 * s))
        .round(0.003);
    const padPose = (s: sdf.Shape) => s.rotateZ(-28).at(0.155, 0.448, 0);
    const pad = padPose(sdf.union(lame(1), lame(1.12).at(0, -0.028, 0)));
    const bracersFor = (e: V3, w: V3) =>
      sdf.union(...[0.3, 0.62].map((t) => sdf.cone(lerp(e, w, t - 0.16), lerp(e, w, t + 0.16), 0.05, 0.047).round(0.002)));
    const cuffs = pair(footPose(sdf.cylinder(0.05, 0.036, 0.01).at(0, 0.088, -0.008)));
    const scuffs = region((x, y, z) => (0.3 - noise.fbm(x * 22, y * 22, z * 22, 3)) * 0.01);
    const vest = sdf
      .union(
        vestBand.bone('chest'),
        pair(pad.bone('upperarm.L')),
        bracersFor(ELBOW, WRIST).bone('forearm.L'),
        bracersFor(ELBOW_R, WRIST_R).bone('forearm.R'),
        cuffs,
      )
      .paintWhere(scuffs, TS.vestLight, 0.004);
    k.body('vest', vest, { color: TS.vest, roughness: 0.7 });

    // ------------------------------------------------------------------ straps: a cross strap and a belly strap
    const STRAP_Y = 0.39;
    const BELT_Y = 0.315;
    const strap = torso.round(0.02).smoothIntersect(0.005, sdf.box([0.7, 0.034, 0.7], 0.005).rotateZ(34).at(0, STRAP_Y, 0));
    const belt = torso.round(0.022).smoothIntersect(0.005, sdf.box([0.6, 0.03, 0.6], 0.005).rotateZ(-6).at(0, BELT_Y, 0));
    k.body('straps', sdf.union(strap.bone('chest'), belt.bone('spine')), { color: C.strap, roughness: 0.65 });

    // ------------------------------------------------------------------ iron: the strap ring, belt buckle, pad rivets
    const ringAt = sdf.surfacePoint(strap, [0, STRAP_Y, 0.25], 0.003);
    const ring = sdf.torus(0.022, 0.0065).rotateX(90).at(...ringAt);
    const beltAt = sdf.surfacePoint(belt, [0.04, BELT_Y - 0.004, 0.25], 0.002);
    const buckle = sdf.box([0.032, 0.03, 0.01], 0.004).subtract(sdf.box([0.016, 0.014, 0.03], 0.002)).at(...beltAt);
    const rivets = pair(
      sdf
        .union(
          ...[
            [0.2, 0.47, 0.05],
            [0.2, 0.47, -0.05],
          ].map((p) => sdf.sphere(0.009).at(...sdf.surfacePoint(pad, p as unknown as V3, 0))),
        )
        .bone('upperarm.L'),
    );
    k.body('iron', sdf.union(ring.bone('chest'), buckle.bone('spine'), rivets), { color: C.iron, roughness: 0.45, metalness: 0.75 });

    // ------------------------------------------------------------------ the spear in the right fist
    // Local frame: the grip point at the origin, the shaft up (+Y), the flat of the head facing +Z.
    const shaft = sdf
      .capsule([0, -BUTT, 0], [0, TOP + 0.01, 0], 0.0125)
      .displace(0.0012, (x, y, z) => noise.fbm(x * 40, y * 12, z * 40, 2));
    k.body('spear-shaft', spearPose(shaft), { color: C.wood, roughness: 0.75, detail: 0.004, bone: 'spear' });
    const headOutline = profile.polygon(
      [
        [-0.011, 0],
        [0.011, 0],
        [0.013, 0.018],
        [0.036, 0.004],
        [0.03, 0.032],
        [0.03, 0.06],
        [0, 0.17],
        [-0.03, 0.06],
        [-0.03, 0.032],
        [-0.036, 0.004],
        [-0.013, 0.018],
      ],
      { smooth: false },
    );
    const T = 0.007; // half thickness at the ridge
    const W = 0.03; // half width where the bevels meet the edge
    const bevel = (sx: number, sz: number) => sdf.halfSpace(norm([sx * T, 0, sz * W]), (T * W) / Math.hypot(T, W));
    const blade = sdf
      .extrude(headOutline, 0.03)
      .intersect(bevel(1, 1))
      .intersect(bevel(-1, 1))
      .intersect(bevel(1, -1))
      .intersect(bevel(-1, -1))
      .round(0.0015)
      .paintWhere(sdf.halfSpace([1, 0, 0], 0), C.steelDark)
      .at(0, TOP + 0.006, 0);
    const socket = sdf.cone([0, TOP - 0.05, 0], [0, TOP + 0.012, 0], 0.017, 0.012).paint(C.steelDark);
    k.body('spear-head', spearPose(sdf.union(blade, socket)), { color: C.steel, roughness: 0.4, metalness: 0.7, detail: 0.003, bone: 'spear' });
    const binding = (ys: readonly number[]) => sdf.union(...ys.map((y) => sdf.torus(0.0145, 0.0055).at(0, y, 0)));
    k.body('rope', spearPose(sdf.union(binding([TOP - 0.066, TOP - 0.08, TOP - 0.094]), binding([-0.17, -0.184, -0.198]))), {
      color: C.rope,
      roughness: 0.9,
      detail: 0.003,
      bone: 'spear',
    });
    // The rag: a knot under the binding and two torn strips hanging out, away from the head.
    const strip = (pts: readonly (readonly [number, number, number, number])[]) =>
      sdf.chain(pts, 0.01).scale([1, 1, 0.35]);
    const rag = sdf
      .union(
        sdf.ellipsoid([0.018, 0.016, 0.014]).at(-0.014, 0, 0.002),
        strip([
          [-0.014, 0, 0, 0.012],
          [-0.04, -0.03, 0, 0.016],
          [-0.056, -0.08, 0, 0.014],
          [-0.06, -0.125, 0, 0.009],
        ]),
        strip([
          [-0.014, 0, 0, 0.01],
          [-0.03, -0.035, 0, 0.012],
          [-0.03, -0.075, 0, 0.007],
        ]).rotateY(-35),
      )
      .at(0, TOP - 0.1, 0);
    k.body('rag', spearPose(rag), { color: C.rag, roughness: 0.95, detail: 0.0035, bone: 'spear' });

    // ------------------------------------------------------------------ animation
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
        'forearm.L': { rotate: [-5 * bump(p), 0, 0] },
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
          'upperarm.L': { rotate: [armSwing * s, 0, 6] as const },
          'upperarm.R': { rotate: [-armSwing * 0.35 * s, 0, -6] as const },
          'forearm.R': { rotate: [-lean * 1.3 - 4, 0, 0] as const },
          'forearm.L': { rotate: [-armSwing * 0.5 - armSwing * 0.4 * Math.max(0, -s), 0, 0] as const },
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
    const COCK: V3 = [-0.25, 0.29, -0.06]; // the grip at the right hip, the point forward
    const HIT: V3 = [-0.1, 0.33, 0.35]; // the grip at full extension
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
    const DROP_AT: V3 = [-0.46, 0.022, -0.12]; // the grip point on the ground
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
});
