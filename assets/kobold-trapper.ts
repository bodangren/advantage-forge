import { defineAsset, motion, noise, profile, sdf, Sdf, THREE } from '../src/index.js';

/**
 * Kobold trapper — a dungeon denizen (catalog `enemies/humanoid/kobold-trapper`), about 0.9 m
 * tall, faces +Z. Target: docs/enemy-mockups/kobold-trapper_001.jpg. Built on the kobold warrior
 * (same small lizard rig with knee bones, right-hand tool bone, and clip set).
 *
 * Role: a sneaky small enemy that lays snares; seen in 3D and as a 128 px sprite.
 * One idea: a dull olive kobold with a long crocodile snout, one yellow eye and one leather
 *   eyepatch, huge upright fan ears, and a fur-trimmed hood over a shaggy fur mantle.
 * Shape language: round (head, belly, haunches) with one long snout, two leaf ears, a shaggy mantle.
 * Palette: olive scales #6f7a34 (shade #52602a), pale belly #b8b48a; hood leather #5a3e2a, fur
 *   #a89878; dark straps #4a3020; rope #a08a5a; yellow pouches #c8a030; iron #5a5a60.
 * Value plan: the yellow eye beside the dark eyepatch is the focal point; the pale fur frames the
 *   face; the pale belly with dark crossed straps and the rope knot carry the body.
 * Bodies: skin, eyes, patch, hood, fur-trim, mantle, straps, rope, rope-belt, pouches, iron,
 *   claws, tool-shaft, tool-hook, pin.
 * Rig: the kobold warrior skeleton; the hook tool is rigid on `tool` (child of `hand.R`), the
 *   spike pin is rigid on `hand.L`. Clips: idle, walk, run, attack (a low hook sweep), hit, death,
 *   taunt.
 */

const C = {
  scales: '#6f7a34',
  scalesDark: '#52602a',
  belly: '#b8b48a',
  bellyDark: '#98946a',
  earInner: '#9ea45e',
  eye: '#ffd23a',
  pupil: '#141012',
  lid: '#3a3a1c',
  mouth: '#2e2a14',
  nostril: '#2e2e14',
  claw: '#8e8e88',
  hood: '#5a3e2a',
  fur: '#a89878',
  furDark: '#8a7a5a',
  strap: '#4a3020',
  rope: '#a08a5a',
  pouch: '#c8a030',
  iron: '#5a5a60',
  patch: '#4a2e1c',
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

// Joints. The left arm hangs relaxed; the right fist holds the hook tool upright beside the body.
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
const EAR: V3 = [0.13, 0.685, -0.07];
// The tool: nearly upright, the top a little out and forward; the grip point sits just above the fist.
const TOOL_TILT = { z: 13, x: 8 };
const GRIP_DIR = norm([
  -Math.sin(TOOL_TILT.z * DEG),
  Math.cos(TOOL_TILT.z * DEG) * Math.cos(TOOL_TILT.x * DEG),
  Math.cos(TOOL_TILT.z * DEG) * Math.sin(TOOL_TILT.x * DEG),
]);
const FLAT: V3 = [0, -Math.sin(TOOL_TILT.x * DEG), Math.cos(TOOL_TILT.x * DEG)]; // hook plane normal at rest
const FIST_R = add(WRIST_R, norm([WRIST_R[0] - ELBOW_R[0], WRIST_R[1] - ELBOW_R[1], WRIST_R[2] - ELBOW_R[2]]), 0.04);
const GUARD = add(FIST_R, GRIP_DIR, 0.048);
const toolPose = (s: sdf.Shape) => s.rotateZ(TOOL_TILT.z).rotateX(TOOL_TILT.x).at(...GUARD);
const BUTT = 0.075; // grip point to the butt
const TOP = 0.2; // grip point to the start of the hook

/** A relaxed claw hanging from the wrist `w`. */
const fistAt = (w: V3) =>
  sdf.smoothUnion(
    0.02,
    sdf.ellipsoid([0.046, 0.05, 0.05]).at(w[0] + 0.008, w[1] - 0.044, w[2] + 0.004),
    sdf.capsule([w[0] - 0.01, w[1] - 0.068, w[2] + 0.034], [w[0] - 0.006, w[1] - 0.044, w[2] + 0.05], 0.02),
    sdf.cone([w[0] + 0.024, w[1] - 0.026, w[2] + 0.029], [w[0] + 0.001, w[1] - 0.038, w[2] + 0.056], 0.019, 0.015),
  );

// Scales: 3D Worley cells, F2 - F1 in cell units (0 on the cell edges, about 0.5 in a cell's middle).
const SCALE_F = 40; // cells per meter
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
  name: 'kobold-trapper',
  description:
    'Chibi kobold trapper enemy: an olive scaly reptile with a long crocodile snout, one yellow eye and a leather eyepatch, huge fan ears, a fur-trimmed hood and fur mantle, crossed straps with a rope knot, a rope belt with pouches, a hooked iron trap tool and a spike pin.',
  detail: 0.005,
  reference: 'docs/enemy-mockups/kobold-trapper_001.jpg',
  // Color slots for individual kobolds (the first option is the default look).
  variants: {
    scales: { olive: C.scales, red: '#b84a2e', blue: '#4a6a9a' },
    hood: { brown: C.hood, black: '#2a2a2e', green: '#3a5a3a' },
    pouches: { yellow: C.pouch, red: '#8a3a2a', grey: '#6a6a6a' },
  },
  presets: {
    bog: { scales: 'olive', hood: 'brown', pouches: 'yellow' },
    ember: { scales: 'red', hood: 'black', pouches: 'red' },
    frost: { scales: 'blue', hood: 'green', pouches: 'grey' },
  },

  build(k) {
    const TS = {
      scales: k.tint('scales'),
      scalesDark: k.tint('scales', { color: C.scalesDark, follow: 1 }),
      belly: k.tint('scales', { color: C.belly, follow: 0.5 }),
      bellyDark: k.tint('scales', { color: C.bellyDark, follow: 0.5 }),
      earInner: k.tint('scales', { color: C.earInner, follow: 0.5 }),
      hood: k.tint('hood'),
      pouch: k.tint('pouches'),
      pouchDark: k.tint('pouches', { color: '#a07c1c', follow: 1 }),
    };
    const EAR_TIP: V3 = [0.27, 0.9, -0.15];
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
      tool: { parent: 'hand.R', at: GUARD },
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
      sdf.ellipsoid([0.088, 0.064, 0.19]).at(0, 0.64, 0.16), // the long upper jaw
    );
    const brows = pair(sdf.ellipsoid([0.054, 0.022, 0.04]).rotateZ(18).at(0.082, 0.752, 0.072));
    // The upper lid over the seeing eye: a cap over the top third of the eyeball, the inner end lower.
    const LID_UP = norm([-0.32, 0.95, 0.1]);
    const lidCut = (h: number) => sdf.halfSpace(LID_UP.map((c) => -c) as unknown as V3, -h).at(...EYE_C);
    const lid = sdf.sphere(0.046).at(...EYE_C).intersect(lidCut(0.016));
    const head = headCore
      .smoothUnion(0.02, sdf.ellipsoid([0.072, 0.058, 0.055]).at(0, 0.654, 0.3)) // the round nose end
      .smoothUnion(0.012, sdf.ellipsoid([0.072, 0.034, 0.15]).at(0, 0.585, 0.145)) // the lower jaw, set in
      .smoothUnion(0.03, brows)
      .smoothUnion(0.006, lid)
      .bone('head');
    const faceZ = (x: number, y: number) => sdf.raycast(head, [x, y, 1], [0, 0, -1])![2];

    // Fan ears: a smooth flattened ellipsoid leaf (long axis up), cupped on its front face and
    // painted pale inside; leaned outward, swept back, and turned out from the head.
    const earBody = sdf.smoothUnion(
      0.04,
      sdf.ellipsoid([0.105, 0.13, 0.03]).at(0, 0.115, 0),
      sdf.cone([0, 0.15, 0], [0.012, 0.3, 0], 0.075, 0.01).scale([1, 1, 0.4]), // the leaf's tip
    );
    const earCup = sdf.ellipsoid([0.088, 0.108, 0.03]).at(0, 0.12, 0.027);
    const earLocal = earBody.smoothSubtract(0.008, earCup).paintWhere(earCup.round(0.006), TS.earInner, 0.006);
    const earPose = (s: sdf.Shape) => s.rotateX(-20).rotateZ(-26).rotateY(48).at(...EAR);
    const ears = pair(earPose(earLocal).bone('ear.L'));

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
    const fistR = toolPose(
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
    // The tail curls out to the left at its tip.
    const tail = sdf.smoothUnion(
      0.02,
      sdf.cone([0, 0.245, -0.04], TAIL1, 0.058, 0.04).bone('tail'),
      sdf.cone(TAIL1, TAIL2, 0.04, 0.028).bone('tail.2'),
      sdf
        .chain(
          [
            [TAIL2[0], TAIL2[1], TAIL2[2], 0.028],
            [0.02, 0.09, -0.39, 0.021],
            [0.07, 0.085, -0.44, 0.016],
            [0.125, 0.1, -0.455, 0.011],
            [0.16, 0.125, -0.43, 0.007],
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
      sdf.box([0.4, 0.2, 0.7]).at(0, 0.52, 0.25),
    );
    const mouthLine = region((_x, y, z) => (z < -0.025 ? 0.05 : Math.abs(y - mouthY(z)) - 0.0035)).intersect(
      sdf.box([0.4, 0.12, 0.5]).at(0, 0.6, 0.17),
    );
    const noseFront = faceZ(0.022, 0.662);
    const nostrils = pair(sdf.ellipsoid([0.013, 0.01, 0.022]).at(0.024, 0.662, noseFront));
    const nostrilDents = pair(sdf.ellipsoid([0.009, 0.007, 0.014]).at(0.024, 0.662, noseFront + 0.001));
    const lidLine = sdf
      .sphere(0.05)
      .intersect(sdf.halfSpace(LID_UP, 0.022))
      .intersect(sdf.halfSpace(LID_UP.map((c) => -c) as unknown as V3, -0.012))
      .at(...EYE_C);

    const scaly = sdf
      .smoothUnion(0.03, torso.bone('spine'), chestPart.bone('chest'), legs, tail)
      .smoothUnion(0.02, armL, armR, feet)
      .smoothUnion(0.03, sdf.smoothUnion(0.03, head, neck))
      .paintWhere(scaleLines, TS.scalesDark, 0.0015);
    const skin = scaly
      .smoothUnion(0.02, ears)
      .subtract(nostrilDents)
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
        return 0.0022 * Math.min(1, scaleCells(x, y, z) / 0.3);
      },
    });

    // ------------------------------------------------------------------ the one yellow eye
    {
      const c = EYE_C;
      const d = EYE_DIR;
      const shineDir = norm(add(d, [0.3, 0.42, 0]));
      const eyeBall = sdf
        .sphere(0.042)
        .at(...c)
        .paintWhere(sdf.ellipsoid([0.024, 0.026, 0.02]).at(...add(c, d, 0.042)), C.pupil, 0.002)
        .paintWhere(sdf.sphere(0.008).at(...add(c, shineDir, 0.042)), '#ffffff', 0.002);
      k.body('eyes', eyeBall, { color: C.eye, roughness: 0.15, detail: 0.003, textureDensity: 2, bone: 'head' });
    }

    // ------------------------------------------------------------------ the eyepatch and its strap
    const PX = -0.08;
    const PY = 0.708;
    const patchZ = faceZ(PX, PY);
    const disc = sdf
      .ellipsoid([0.043, 0.043, 0.018])
      .rotateY(-23)
      .at(PX - 0.004, PY, patchZ + 0.004);
    const dome = sdf.sphere(0.017).at(PX - 0.008, PY, patchZ + 0.014);
    const strapBand = head
      .round(0.008)
      .smoothIntersect(0.004, sdf.box([0.7, 0.02, 0.7], 0.004).rotateZ(20).at(0, PY + 0.364 * (0 - PX), 0))
      .intersect(sdf.box([0.6, 0.6, 0.26]).at(0, 0.7, 0.04));
    const cheekStrap = head
      .round(0.008)
      .smoothIntersect(0.004, sdf.box([0.02, 0.6, 0.7], 0.004).rotateZ(-6).at(PX - 0.025, 0.6, 0))
      .intersect(sdf.box([0.6, 0.16, 0.26]).at(0, 0.6, 0.04));
    k.body('patch', sdf.smoothUnion(0.008, disc, dome, strapBand, cheekStrap), {
      color: C.patch,
      roughness: 0.6,
      detail: 0.0035,
      bone: 'head',
    });

    // ------------------------------------------------------------------ hood: a shell that fits the skull, open at the face
    const hoodOuter = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.157, 0.14, 0.154]).at(0, 0.69, -0.03), // the head, 1.06x
      sdf.ellipsoid([0.13, 0.09, 0.13]).at(0, 0.6, -0.05), // the cowl behind the neck
    );
    const hoodOpening = sdf.ellipsoid([0.14, 0.14, 0.26]).at(0, 0.67, 0.17);
    const hood = hoodOuter.subtract(hoodOuter.round(-0.014), hoodOpening);
    k.body('hood', hood, {
      color: TS.hood,
      roughness: 0.85,
      detail: 0.005,
      // Leather grain, with seam grooves running up the hood and one across the brow.
      bump: (x, y, z) => {
        const a = Math.atan2(x, z + 0.03);
        const seam = Math.min(1, Math.abs(Math.sin(a * 3)) / 0.12);
        const brow = Math.min(1, Math.abs(y - 0.79) / 0.006);
        return 0.0025 * Math.min(seam, brow) + 0.0012 * noise.fbm(x * 60, y * 60, z * 60, 2);
      },
      bone: 'head',
    });
    // The fur trim: a shaggy band around the opening with short fur cones along its rim.
    const trimBand = hoodOuter
      .round(0.012)
      .subtract(hoodOpening)
      .intersect(hoodOpening.round(0.034))
      .displace(0.005, (x, y, z) => noise.fbm(x * 50, y * 50, z * 50, 2));
    const rimCones: sdf.Shape[] = [];
    const RIM_N = 14;
    for (let n = 0; n < RIM_N; n++) {
      const a = (n / RIM_N) * 2 * Math.PI + 0.2;
      const dirXY: [number, number] = [Math.cos(a), Math.sin(a)];
      const surf = (r: number) => sdf.raycast(hoodOuter, [dirXY[0] * r, 0.67 + dirXY[1] * r, 1], [0, 0, -1]);
      // Bisect the radius where the hood surface leaves the opening.
      let lo = 0.05;
      let hi = 0.2;
      for (let it = 0; it < 30; it++) {
        const mid = (lo + hi) / 2;
        const h = surf(mid);
        if (h && hoodOpening.dist(h[0], h[1], h[2]) < 0) lo = mid;
        else hi = mid;
      }
      const hit = surf(lo + 0.008);
      if (!hit) continue;
      const d = norm([dirXY[0], dirXY[1], 0.7]);
      rimCones.push(sdf.cone(add(hit, d, -0.006), add(hit, d, 0.024 + 0.006 * ((n * 5) % 3)), 0.02, 0.007));
    }
    k.body('fur-trim', sdf.union(trimBand, ...rimCones), {
      color: C.fur,
      roughness: 0.95,
      detail: 0.0065,
      bump: (x, y, z) => 0.003 * noise.fbm(x * 110, y * 110, z * 110, 2),
      bone: 'head',
    });
    // The mantle: a full, shaggy fur band on the shoulders and back, with fur cones on top.
    const mantle = sdf
      .smoothUnion(
        0.035,
        pair(sdf.ellipsoid([0.115, 0.085, 0.12]).rotateZ(-14).at(0.12, 0.44, -0.02)),
        sdf.ellipsoid([0.175, 0.09, 0.095]).at(0, 0.44, -0.07),
      )
      .displace(0.007, (x, y, z) => noise.fbm(x * 28, y * 28, z * 28, 2));
    k.body('mantle', mantle, {
      color: C.furDark,
      roughness: 0.95,
      detail: 0.006,
      bump: (x, y, z) => 0.004 * noise.fbm(x * 100, y * 100, z * 100, 2),
      bone: 'chest',
    });
    const tufts: sdf.Shape[] = [];
    const TUFT_SPOTS: [number, number][] = [
      [0.06, -0.11], [0.12, -0.1], [0.19, -0.05], [0.21, 0.01], [0.17, 0.06], [0.1, 0.07], [0.15, -0.14], [0.03, -0.14],
    ];
    for (const [sx, sz] of TUFT_SPOTS) {
      for (const side of [1, -1]) {
        const hit = sdf.raycast(mantle, [sx * side, 0.7, sz], [0, -1, 0]);
        if (!hit) continue;
        const d = norm([side * sx * 1.2, 1, sz * 0.8]);
        tufts.push(sdf.cone(add(hit, d, -0.012), add(hit, d, 0.03), 0.026, 0.009));
      }
    }
    k.body('mantle-tufts', sdf.union(...tufts), { color: C.fur, roughness: 0.95, detail: 0.0065, bone: 'chest' });

    // ------------------------------------------------------------------ crossed straps, rope knot, wrist wraps, rope belt
    const STRAP_Y = 0.39;
    const BELT_Y = 0.292;
    const strapA = torso.round(0.02).smoothIntersect(0.005, sdf.box([0.7, 0.036, 0.7], 0.005).rotateZ(34).at(0, STRAP_Y, 0));
    const strapB = torso.round(0.023).smoothIntersect(0.005, sdf.box([0.7, 0.036, 0.7], 0.005).rotateZ(-34).at(0, STRAP_Y, 0));
    k.body('straps', sdf.union(strapA, strapB).bone('chest'), { color: C.strap, roughness: 0.65 });
    // The knot: a tangle of three overlapping rope rings at the strap crossing.
    const knotAt = sdf.surfacePoint(torso.round(0.03), [0, STRAP_Y, 0.25], 0.008);
    const knot = sdf.union(
      ...[0, 60, 120].map((a, i) =>
        sdf.torus(0.03, 0.008).rotateX(90).rotateZ(a).at(knotAt[0] + 0.004 * (i - 1), knotAt[1] + 0.003 * (1 - i), knotAt[2] + 0.004 * i),
      ),
    );
    // Rope wraps: three stacked rings on each wrist, turned to the forearm's axis.
    const ringAlong = (c: V3, dir: V3, R: number, r: number) => {
      const d = norm(dir);
      const phi = -Math.asin(d[0]) / DEG;
      const theta = Math.atan2(d[2], d[1]) / DEG;
      return sdf.torus(R, r).rotateZ(phi).rotateX(theta).at(...c);
    };
    const wraps = (e: V3, w: V3) =>
      sdf.union(...[0.45, 0.66, 0.87].map((t) => ringAlong(lerp(e, w, t), [w[0] - e[0], w[1] - e[1], w[2] - e[2]], 0.046 - 0.006 * t, 0.0075)));
    k.body('rope', sdf.union(knot.bone('chest'), wraps(ELBOW, WRIST).bone('forearm.L'), wraps(ELBOW_R, WRIST_R).bone('forearm.R')), {
      color: C.rope,
      roughness: 0.9,
      detail: 0.004,
    });
    const belt = torso.round(0.026).smoothIntersect(0.005, sdf.box([0.6, 0.042, 0.6], 0.005).rotateZ(-4).at(0, BELT_Y, 0));
    k.body('rope-belt', belt.bone('spine'), {
      color: C.rope,
      roughness: 0.9,
      detail: 0.004,
      bump: (x, y, z) => 0.0025 * (0.5 + 0.5 * Math.sin(Math.atan2(x, z) * 42 + y * 260)),
    });

    // ------------------------------------------------------------------ two pouches with flaps and buckles on the belt
    const pouchSpots = [1, -1].map((side) => sdf.surfacePoint(torso.round(0.02), [side * 0.2, 0.256, 0.12], 0.02));
    const yawOf = (p: V3) => Math.atan2(p[0], p[2]) / DEG;
    const pouchBodies = pouchSpots.map((p) => sdf.box([0.09, 0.098, 0.058], 0.014).rotateY(yawOf(p)).at(...p));
    const pouchFlaps = pouchSpots.map((p) =>
      sdf.box([0.096, 0.046, 0.066], 0.012).at(0, 0.036, 0.004).rotateY(yawOf(p)).at(...p),
    );
    k.body('pouches', sdf.union(...pouchBodies).bone('spine'), { color: TS.pouch, roughness: 0.7, detail: 0.004 });
    k.body('pouch-flaps', sdf.union(...pouchFlaps).bone('spine'), { color: TS.pouchDark, roughness: 0.7, detail: 0.004 });

    // ------------------------------------------------------------------ iron: the belt ring and the pouch buckles
    const ringAt = sdf.surfacePoint(torso.round(0.024), [0, BELT_Y - 0.03, 0.25], 0.006);
    const beltRing = sdf.torus(0.03, 0.008).rotateX(90).at(...ringAt);
    const buckles = sdf.union(
      ...pouchSpots.map((p) =>
        sdf
          .union(
            sdf.box([0.03, 0.03, 0.012], 0.004).subtract(sdf.box([0.016, 0.016, 0.03], 0.002)).at(0, 0.024, 0.036),
            sdf.box([0.008, 0.026, 0.012], 0.003).at(0, 0.0, 0.036),
          )
          .rotateY(yawOf(p))
          .at(...p),
      ),
    );
    k.body('iron', sdf.union(beltRing, buckles).bone('spine'), { color: C.iron, roughness: 0.5, metalness: 0.6 });

    // ------------------------------------------------------------------ claws: fingers and toes
    const clawsL = sdf.union(
      ...[0, 1, 2].map((i) => {
        const x = WRIST[0] - 0.02 + 0.017 * i;
        return sdf.cone([x, WRIST[1] - 0.08, WRIST[2] + 0.046], [x + 0.002, WRIST[1] - 0.102, WRIST[2] + 0.036], 0.009, 0.002);
      }),
    );
    const clawsR = toolPose(
      sdf.union(...[-0.07, -0.05, -0.03].map((y) => sdf.cone([0.012, y, 0.046], [-0.012, y - 0.004, 0.05], 0.008, 0.002))),
    );
    const toeClaws = footPose(sdf.union(...TOES.map((dx) => sdf.cone([dx * 1.02, 0.024, 0.104], [dx * 1.08, 0.006, 0.134], 0.014, 0.003))));
    k.body('claws', sdf.union(clawsL.bone('hand.L'), clawsR.bone('hand.R'), pair(toeClaws)), { color: C.claw, roughness: 0.4, detail: 0.0035 });

    // ------------------------------------------------------------------ the hook tool in the right fist
    // Local frame: the grip point at the origin, the shaft up (+Y), the hook in the XY plane.
    const shaft = sdf
      .smoothUnion(
        0.008,
        sdf.capsule([0, -BUTT, 0], [0, TOP, 0], 0.0125),
        sdf.sphere(0.021).at(0, -BUTT, 0), // the pommel
      )
      .displace(0.001, (x, y, z) => noise.fbm(x * 40, y * 12, z * 40, 2));
    k.body('tool-shaft', toolPose(shaft), { color: C.iron, roughness: 0.5, metalness: 0.6, detail: 0.004, bone: 'tool' });
    const hook = sdf.smoothUnion(
      0.008,
      sdf.chain(
        [
          [0, TOP - 0.03, 0, 0.0155],
          [0, TOP + 0.03, 0, 0.0145],
          [0.02, TOP + 0.075, 0, 0.013],
          [0.055, TOP + 0.082, 0, 0.012],
          [0.078, TOP + 0.05, 0, 0.0115],
          [0.072, TOP + 0.024, 0, 0.011],
        ],
        0.012,
      ),
      sdf.torus(0.045, 0.011).rotateX(90).at(0.09, TOP - 0.02, 0), // the big iron ring on the hook's tip
    );
    k.body('tool-hook', toolPose(hook), { color: C.iron, roughness: 0.45, metalness: 0.6, detail: 0.003, bone: 'tool' });

    // ------------------------------------------------------------------ the spike pin in the left fist
    const PIN_AT: V3 = [WRIST[0] + 0.008, WRIST[1] - 0.044, WRIST[2] + 0.004];
    const pin = sdf.smoothUnion(
      0.006,
      sdf.capsule([0, -0.05, 0], [0, 0.14, 0], 0.0125),
      sdf.sphere(0.022).at(0, -0.052, 0),
      sdf.cone([0, 0.1, 0], [0, 0.16, 0], 0.014, 0.002),
    );
    k.body('pin', pin.rotateX(50).at(...PIN_AT), { color: C.iron, roughness: 0.45, metalness: 0.6, detail: 0.003, bone: 'hand.L' });

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
    // the tool arm swings little, the forearm lifted against the lean so the butt clears the floor.
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

    // A low hook sweep from the hip, solved by targets. The grip point follows a path in world space;
    // each frame converts it into the chest's rest frame, reach solves the arm, and orient turns the
    // fist so the tool lies along the path. Anticipation: the kobold crouches, coils, and pulls the
    // tool back to the right hip, level, the point forward. Strike: the right foot steps, the hips
    // drive forward, and the fist runs straight along the tool's own line. Recovery: the tool
    // pulls back along the line, then all returns to rest. The ears and the tail lag.
    const { keys, reach, orient, follow, quat } = motion;
    const ARM_R = { root: mx(SHOULDER), mid: ELBOW_R, end: WRIST_R };
    const TRUNK: readonly V3[] = [[0, 0.2, 0], [0, 0.27, 0], [0, 0.35, 0]]; // hips, spine, chest pivots
    const COCK: V3 = [-0.31, 0.31, -0.1]; // the grip at the right hip, the point forward
    const HIT: V3 = [-0.3, 0.24, 0.34]; // the hook at full sweep, low and across the front
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
    // heels and lands on its back. The arms lie out on the ground; the hand opens and the tool
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
          tool: { move: [d.x, d.y, d.z], rotate: euler(inv.clone().multiply(handQ.clone().slerp(DROP_TURN, loose))) },
          'leg.L': { rotate: [-lean + legs, 0, 8 * land] },
          'leg.R': { rotate: [-lean + legs, 0, -8 * land] },
          'foot.L': { rotate: [lean, 20 * land, 0] },
          'foot.R': { rotate: [lean, -20 * land, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ taunt: point, hop, thump
    // Played when the kobold first sees the player. It levels the tool at the player, the left
    // fist on the hip; it hops from foot to foot twice, the head cocked and the ears flicking; then
    // it pulls the tool upright and thumps the butt on the floor twice.
    const FIST_OFF: V3 = [FIST_R[0] - WRIST_R[0], FIST_R[1] - WRIST_R[1], FIST_R[2] - WRIST_R[2]];
    const FIST_POINT: V3 = [-0.225, 0.37, 0.19]; // the tool level at chest height, out beside the body
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
        // Raise the tool and slam the butt down, twice; then it settles back to rest.
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
          // The head cocks to its left, away from the tool, the chin a little down: a sneer.
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
