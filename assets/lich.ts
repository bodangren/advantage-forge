import { defineAsset, mixRgb, motion, noise, profile, rgb, sdf, THREE } from '../src/index.js';
import type { AnimationDef, BonePose, Pose as RigPose } from '../src/index.js';

/**
 * Lich — Chibi Quest dungeon boss (catalog `enemies/undead/lich`, the P1 boss of the Sunken Vault),
 * about 1.1 m to the tips of its crown, faces +Z. Target: docs/enemy-mockups/lich_001.jpg.
 * Built on the skeleton mage (its skull, bony hands, rig, and clips), authored in the mage's
 * units and scaled up by SC as a whole (shapes, joints, and every clip's moves).
 *
 * Role: the boss of a dungeon, seen in 3D and as a 128 px sprite; the crown, the big green eye
 *   lights, and the green gem on the staff must read.
 * One idea: a grinning skull king with a small spiky gold crown, pointed bony ears, in a tattered
 *   purple robe with gold trim and a high collar, a green flame in one open bony hand and a staff
 *   with a clawed green gem in the other.
 * Proportions: the mage's head (skull center 0.705, sockets 0.65), the crown from 0.82 to 0.96,
 *   the robe to the ground, the gem at 0.82 beside the skull (all before the scale SC).
 * Shape language: a round skull, sharp crown points, pointed ears, ragged robe edges, curling flames.
 * Palette (60/30/10): deep purple robe #4a2a6a; pale bone #e8e2c2; gold trim and crown #d4a93a;
 *   glowing green #5aff7a as the accent (eyes, gem, flames).
 * Value plan: the green eye lights in the black sockets are the focal point; the gem and the palm
 *   flame at the sides are the second accents; the gold crown and trims frame the silhouette.
 * Bodies: bone, eyes, crown, crown-gems, robe, trim, rope, staff, claw, staff-gem, staff-magic,
 *   palm-fire, spell-orb.
 * Rig: the skeleton mage's skeleton, bone for bone: `weapon` (the staff, rigid under `hand.L`),
 *   `lantern` (now the green flames and wisps over the gem, under `weapon`), `candle` (now the
 *   crown, under `head`), `palmfire` (under `hand.R`), `eyeglow` (under `head`), and `bolt`
 *   (under `hand.R`, hidden outside the cast). Clips: idle, walk (a gliding shuffle), run,
 *   attack (a staff-raise spell: the staff rises, the gem charges and flares, then the staff
 *   points at the target), cast (the mage's palm bolt), hit, death (the robe crumples into a heap,
 *   the staff falls, the crowned skull drops off), taunt (a cackle, then a point).
 */

const C = {
  bone: '#e8e2c2',
  boneShade: '#c4b78e',
  socket: '#0e0b0d',
  eye: '#5aff7a',
  eyeDark: '#0e3a1a', // the eye lights' base color: dark, so the emissive green keeps its hue
  magicCore: '#d4ffdc',
  robe: '#4a2a6a',
  robeDark: '#2c1842',
  gold: '#d4a93a',
  lining: '#c89632', // the cape's gold cloth lining
  rope: '#d2c6a0',
  wood: '#4a3226',
  woodDark: '#2c1c16',
  wrap: '#6a4a2e',
  claw: '#2e2a30',
};

type V3 = readonly [number, number, number];

/** The whole lich is authored in the skeleton mage's units and scaled by SC. */
const SC = 1.12;
const sv = (p: V3): V3 => [p[0] * SC, p[1] * SC, p[2] * SC];

const HEAD_Y = 0.675;
const pair = (s: sdf.Shape) => s.mirror('x');
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const unit = (v: V3): V3 => {
  const l = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / l, v[1] / l, v[2] / l];
};

// Joints. The right hand (-X) is open, palm up, with a green flame; the left hand (+X) holds
// the staff upright.
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW_R: V3 = [-0.2, 0.345, 0.03];
const WRIST_R: V3 = [-0.245, 0.335, 0.1];
const ELBOW_L: V3 = [0.2, 0.33, 0.02];
const WRIST_L: V3 = [0.235, 0.3, 0.09];
const HIP: V3 = [0.068, 0.195, 0];
const ANKLE: V3 = [0.098, 0.07, 0];
const KNEE: V3 = [0.083, 0.1325, 0]; // the knee: splits the leg (shin.L takes the weight below it)
const GRIP: V3 = [WRIST_L[0] + 0.012, WRIST_L[1] - 0.038, WRIST_L[2] + 0.014];

/** A bony hand wrapped around a vertical staff at `g`: a small palm and four curled finger bones. */
const boneGrip = (g: V3) =>
  sdf.smoothUnion(
    0.006,
    sdf.ellipsoid([0.03, 0.04, 0.03]).at(g[0] + 0.012, g[1], g[2] - 0.004),
    ...[0, 1, 2, 3].map((i) => {
      const y = g[1] + 0.024 - i * 0.017;
      return sdf.chain(
        [
          [g[0] + 0.022, y, g[2] + 0.01, 0.0095],
          [g[0] + 0.004, y - 0.002, g[2] + 0.026, 0.0088],
          [g[0] - 0.018, y - 0.004, g[2] + 0.014, 0.008],
        ],
        0.004,
      );
    }),
    sdf.chain(
      [
        [g[0] + 0.03, g[1] + 0.02, g[2] + 0.004, 0.01],
        [g[0] + 0.01, g[1] + 0.034, g[2] + 0.018, 0.0085],
      ],
      0.004,
    ),
  );

/** An open bony hand, palm up, pointing along -X from the wrist at `w`. */
const boneOpenHand = (w: V3) =>
  sdf.smoothUnion(
    0.006,
    sdf.ellipsoid([0.036, 0.016, 0.032]).at(w[0] - 0.034, w[1], w[2] + 0.006),
    ...[-0.02, -0.007, 0.007, 0.02].map((dz, i) =>
      sdf.chain(
        [
          [w[0] - 0.06, w[1], w[2] + 0.006 + dz, 0.0085],
          [w[0] - 0.084 + Math.abs(i - 1.5) * 0.004, w[1] + 0.008, w[2] + 0.006 + dz * 1.1, 0.0078],
          [w[0] - 0.098 + Math.abs(i - 1.5) * 0.006, w[1] + 0.022, w[2] + 0.006 + dz * 1.15, 0.007],
        ],
        0.004,
      ),
    ),
    sdf.chain(
      [
        [w[0] - 0.026, w[1] + 0.004, w[2] + 0.034, 0.0095],
        [w[0] - 0.048, w[1] + 0.02, w[2] + 0.048, 0.008],
      ],
      0.004,
    ),
  );

/** A flame: a round base that rises into three curling tongues. `h` is its height. */
const flame = (h: number) =>
  sdf.smoothUnion(
    h * 0.08,
    sdf.sphere(h * 0.3).at(0, h * 0.3, 0),
    sdf.chain(
      [
        [0, h * 0.35, 0, h * 0.28],
        [h * 0.05, h * 0.7, 0, h * 0.16],
        [-h * 0.04, h, 0, h * 0.03],
      ],
      h * 0.1,
    ),
    sdf.chain(
      [
        [h * 0.14, h * 0.4, 0.0, h * 0.13],
        [h * 0.3, h * 0.66, 0, h * 0.07],
        [h * 0.26, h * 0.86, 0, h * 0.018],
      ],
      h * 0.06,
    ),
    sdf.chain(
      [
        [-h * 0.15, h * 0.36, 0, h * 0.12],
        [-h * 0.3, h * 0.58, 0.02 * h, h * 0.06],
        [-h * 0.3, h * 0.76, 0, h * 0.016],
      ],
      h * 0.06,
    ),
  );
/** Flame color: a light core low in the flame, the outer color toward the tips. */
const flamePaint = (base: V3, h: number, coreHex: string, outerHex: string) => {
  const core = rgb(coreHex);
  const outer = rgb(outerHex);
  return (x: number, y: number, z: number) => {
    const t = Math.min(1, Math.max(0, (y - base[1]) / h));
    const r = Math.hypot(x - base[0], z - base[2]) / (h * 0.3);
    const k = Math.min(1, Math.max(0, t * 0.9 + r * 0.5 - 0.15));
    return mixRgb(core, outer, k); // a blend of two slot colors stays in the slot's tint mask
  };
};

type RigDef = Record<string, { parent?: string; at: V3; tail?: V3; split?: number }>;

export default defineAsset({
  name: 'lich',
  description:
    'Chibi lich dungeon boss: a grinning skull with green eye lights, pointed ears, and a spiky gold crown, a tattered purple robe with gold trim and a high collar, a green flame in one bony hand, and a staff with a clawed green gem.',
  detail: 0.005,
  reference: 'docs/enemy-mockups/lich_001.jpg',
  // Color slots for individual liches (the first option is the default look). `eyes` also
  // colors all the magic: the gem, the flames, the wisps, the crown's gems, and the bolt.
  variants: {
    eyes: { green: C.eye, blue: '#5ac4ff', red: '#ff5a4a' },
    bone: { ivory: C.bone, grey: '#bcbab0', yellowed: '#d6c48e' },
    clothing: { purple: C.robe, black: '#2a2430', crimson: '#6a2232', teal: '#1e5258' },
  },
  presets: {
    'frost-lich': { eyes: 'blue', bone: 'grey', clothing: 'teal' },
    'blood-lich': { eyes: 'red', bone: 'yellowed', clothing: 'crimson' },
    'shadow-lich': { eyes: 'green', bone: 'grey', clothing: 'black' },
  },

  build(kk) {
    // Everything below is in the skeleton mage's units: this wrapper scales every body, joint,
    // and clip move by SC about the origin (the feet stay on y = 0; rotations do not change).
    const scalePose = (pose: RigPose): RigPose => {
      const out: Record<string, BonePose> = {};
      for (const [n, b] of Object.entries(pose)) out[n] = b.move ? { ...b, move: sv(b.move) } : b;
      return out;
    };
    const k = {
      tint: kk.tint.bind(kk) as typeof kk.tint,
      body: (name: string, shape: sdf.Shape, options?: Parameters<typeof kk.body>[2]) => kk.body(name, shape.scale(SC), options),
      skeleton: (rig: RigDef) =>
        kk.skeleton(
          Object.fromEntries(
            Object.entries(rig).map(([n, b]) => [
              n,
              { ...b, at: sv(b.at), ...(b.tail ? { tail: sv(b.tail) } : {}), ...(b.split ? { split: b.split * SC } : {}) },
            ]),
          ),
        ),
      animation: (name: string, def: AnimationDef) => kk.animation(name, { ...def, pose: (t, p) => scalePose(def.pose(t, p)) }),
    };

    // The slot colors (see variants): shades of a slot keep their exact default color and follow
    // the slot when a game recolors it. All the glows follow the eyes slot.
    const T = {
      eye: k.tint('eyes'),
      eyeDark: k.tint('eyes', { color: C.eyeDark, follow: 1 }),
      magicCore: k.tint('eyes', { color: C.magicCore, follow: 1 }),
      bone: k.tint('bone'),
      boneShade: k.tint('bone', { color: C.boneShade, follow: 1 }),
      crack: k.tint('bone', -0.45),
      robe: k.tint('clothing'),
      robeDark: k.tint('clothing', { color: C.robeDark, follow: 1 }),
      robeBlack: k.tint('clothing', -1), // black, but inside the slot: the robe's dark mottling
    };
    // ------------------------------------------------------------------ the staff line
    const STAFF_TOP = 0.765; // the top of the shaft; the claw holds the gem above it
    const GEM: V3 = [GRIP[0] + 0.004, 0.82, GRIP[2]];
    const GEM_R = 0.042;
    const CROWN_AT: V3 = [0, 0.84, -0.015]; // the crown's center, on top of the skull
    const PALM: V3 = [WRIST_R[0] - 0.05, WRIST_R[1] + 0.02, WRIST_R[2] + 0.006]; // the palm flame's base
    // The spell bolt waits at rest inside the base of the palm flame (hidden), and flies out in the cast.
    const BOLT: V3 = [PALM[0], PALM[1] + 0.052, PALM[2]];
    const EYE_GLOW: V3 = [0, 0.64, 0.1]; // between the glowing eyes, inside the skull
    // Hidden, the bolt shrinks to a point inside the bony palm, where nothing (a falling skull) crosses it.
    const HIDE = { move: [0, -0.06, 0] as V3, scale: [0.001, 0.001, 0.001] as V3 };

    // ------------------------------------------------------------------ skeleton (rig)
    const RIG: RigDef = {
      hips: { at: [0, 0.2, 0] },
      spine: { parent: 'hips', at: [0, 0.26, 0] },
      chest: { parent: 'spine', at: [0, 0.33, 0] },
      neck: { parent: 'chest', at: [0, 0.43, -0.01] },
      head: { parent: 'neck', at: [0, 0.48, -0.01] },
      'upperarm.L': { parent: 'chest', at: SHOULDER },
      'forearm.L': { parent: 'upperarm.L', at: ELBOW_L },
      'hand.L': { parent: 'forearm.L', at: WRIST_L },
      weapon: { parent: 'hand.L', at: GRIP },
      lantern: { parent: 'weapon', at: GEM, tail: [GEM[0], GEM[1] + 0.08, GEM[2]] },
      candle: { parent: 'head', at: CROWN_AT },
      palmfire: { parent: 'hand.R', at: PALM },
      bolt: { parent: 'hand.R', at: BOLT },
      eyeglow: { parent: 'head', at: EYE_GLOW },
      'upperarm.R': { parent: 'chest', at: mx(SHOULDER) },
      'forearm.R': { parent: 'upperarm.R', at: ELBOW_R },
      'hand.R': { parent: 'forearm.R', at: WRIST_R },
      'leg.L': { parent: 'hips', at: HIP },
      'shin.L': { parent: 'leg.L', at: KNEE, split: 0.015 },
      'foot.L': { parent: 'shin.L', at: ANKLE },
      'leg.R': { parent: 'hips', at: mx(HIP) },
      'shin.R': { parent: 'leg.R', at: mx(KNEE), split: 0.015 },
      'foot.R': { parent: 'shin.R', at: mx(ANKLE) },
    };
    k.skeleton(RIG);

    // ------------------------------------------------------------------ skull
    // A round cranium, wide cheekbones, a narrower block of teeth, and pointed bony ears.
    const ear = sdf.chain(
      [
        [0.15, 0.665, -0.02, 0.032],
        [0.215, 0.7, -0.032, 0.026],
        [0.278, 0.748, -0.048, 0.004],
      ],
      0.01,
    );
    const skullSolid = sdf.smoothUnion(
      0.04,
      sdf.box([0.36, 0.29, 0.33], 0.14).at(0, HEAD_Y + 0.03, -0.005),
      pair(sdf.sphere(0.08).at(0.11, 0.59, 0.08)), // cheekbones
      sdf.box([0.16, 0.085, 0.13], 0.035).at(0, 0.53, 0.075), // the teeth block
    );
    const skullEars = skullSolid.smoothUnion(0.02, pair(ear));
    const faceZ = (x: number, y: number) => sdf.raycast(skullSolid, [x, y, 1], [0, 0, -1])![2];
    // Big round eye sockets and a nose hole shaped like an upside-down heart.
    const EYE: V3 = [0.088, 0.65, 0];
    const sockets = pair(sdf.ellipsoid([0.066, 0.06, 0.07]).at(EYE[0], EYE[1], faceZ(EYE[0], EYE[1]) + 0.006));
    const noseZ = faceZ(0, 0.572);
    const noseHole = pair(sdf.ellipsoid([0.013, 0.021, 0.03]).rotateZ(-24).at(0.011, 0.571, noseZ + 0.01));
    const skull = skullEars.smoothSubtract(0.01, sockets).smoothSubtract(0.004, noseHole);
    const TEETH_Y = 0.535;
    const mouthLine = sdf.extrude(profile.rect([0.15, 0.009], 0.004), 0.4).at(0, TEETH_Y, 0.2);
    const gap = (x: number, y: number) => sdf.extrude(profile.rect([0.007, 0.03], 0.002), 0.4).at(x, y, 0.2);
    const gaps = sdf.union(...[-0.054, -0.018, 0.018, 0.054].map((x) => gap(x, TEETH_Y + 0.018)), ...[-0.036, 0, 0.036].map((x) => gap(x, TEETH_Y - 0.017)));
    // A crack across the forehead, under the crown.
    const crackPath: [number, number][] = [
      [-0.11, 0.8],
      [-0.06, 0.782],
      [-0.02, 0.792],
      [0.02, 0.768],
      [0.06, 0.778],
      [0.1, 0.758],
    ];
    const crack = sdf.extrude(profile.polygon([...crackPath, ...crackPath.map(([x, y]) => [x, y - 0.006] as [number, number]).reverse()]), 0.4).at(0, 0, 0.2);
    // Bony feet peek out under the hem.
    const foot = sdf
      .smoothUnion(0.008, sdf.ellipsoid([0.04, 0.024, 0.05]).at(0, 0.024, 0.03), ...[-0.022, 0, 0.022].map((x) => sdf.sphere(0.014).at(x, 0.016, 0.08)))
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .rotateY(10)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    const bone = sdf
      .union(skull.bone('head'), boneGrip(GRIP).bone('hand.L'), boneOpenHand(WRIST_R).bone('hand.R'), pair(foot))
      .paintWhere(sockets.round(0.014), T.boneShade, 0.01)
      .paintWhere(sockets.round(0.006), C.socket, 0.003)
      .paintWhere(noseHole.round(0.003), C.socket, 0.003)
      .paintWhere(mouthLine, C.socket, 0.002)
      .paintWhere(gaps.intersect(sdf.box([0.15, 0.07, 0.4]).at(0, TEETH_Y, 0.2)), C.socket, 0.002)
      .paintWhere(crack, T.crack, 0.002);
    k.body('bone', bone, { color: T.bone, roughness: 0.6, textureDensity: 2 });

    // Glowing eye lights in the black sockets: a dark base color with a green glow.
    const eyes = pair(sdf.sphere(0.031).at(EYE[0] - 0.002, EYE[1] - 0.006, faceZ(EYE[0], EYE[1]) - 0.034));
    k.body('eyes', eyes, { bone: 'eyeglow', color: T.eyeDark, roughness: 0.2, emissive: T.eye, emissiveIntensity: 1.1 });

    // ------------------------------------------------------------------ the spiky gold crown
    // A band on the cranium with five points, a little tilted, and a green gem on each point.
    const crownPose = (s: sdf.Shape) => s.rotateX(-5).rotateZ(-7).at(...CROWN_AT);
    const spikeA = (i: number) => (i * 72 * Math.PI) / 180;
    const band = sdf.cylinder(0.098, 0.05, 0.006).at(0, 0.005, 0).subtract(sdf.cylinder(0.086, 0.2).at(0, 0.005, 0));
    const spikes = sdf.union(
      ...[0, 1, 2, 3, 4].map((i) => {
        const a = spikeA(i);
        const h = i === 0 ? 0.115 : 0.095;
        // A broad point, flattened along the band.
        return sdf
          .cone([0, 0.02, 0], [0, 0.02 + h, 0], 0.05, 0.003)
          .scale([1, 1, 0.45])
          .rotateY((a * 180) / Math.PI)
          .at(Math.sin(a) * 0.093, 0, Math.cos(a) * 0.093);
      }),
    );
    const rim = sdf.torus(0.098, 0.007).at(0, -0.018, 0);
    k.body('crown', crownPose(sdf.smoothUnion(0.004, band, spikes, rim)), { bone: 'candle', color: C.gold, roughness: 0.3, metalness: 1, detail: 0.0035 });
    const crownGems = sdf.union(
      ...[0, 1, 4].map((i) => {
        const a = spikeA(i);
        return sdf
          .box([0.016, 0.022, 0.012], 0.003)
          .rotateZ(45)
          .scale([0.8, 1, 1])
          .rotateY((a * 180) / Math.PI)
          .at(Math.sin(a) * 0.121, 0.05, Math.cos(a) * 0.121);
      }),
    );
    k.body('crown-gems', crownPose(crownGems), { bone: 'candle', color: T.eyeDark, roughness: 0.15, emissive: T.eye, emissiveIntensity: 0.9, detail: 0.003 });

    // ------------------------------------------------------------------ robe: to the ground, a torn hem, a hood roll, and a high collar
    const robeShape = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.47],
            [0.07, 0.465],
            [0.105, 0.44],
            [0.125, 0.4],
            [0.13, 0.34],
            [0.13, 0.29],
            [0.14, 0.24],
            [0.165, 0.16],
            [0.2, 0.08],
            [0.225, 0.03],
            [0.215, 0.02],
            [0, 0.02],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.82]);
    // Ragged points along the hem: V notches of different depths all around.
    const notch = (angle: number, top: number, w: number) =>
      sdf
        .extrude(
          profile.polygon([
            [-w, -0.01],
            [w, -0.01],
            [0, top],
          ]),
          0.6,
        )
        .rotateY(angle);
    const hem = sdf.union(...Array.from({ length: 9 }, (_, i) => notch(i * 20 + 7, 0.05 + 0.03 * ((i * 5) % 3) * 0.5, 0.024 + 0.006 * (i % 2))));
    // The fallen hood: a thick soft roll around the neck and over the shoulders at the back.
    const hood = sdf
      .revolve(
        profile.polygon(
          [
            [0.06, 0.53],
            [0.12, 0.52],
            [0.17, 0.48],
            [0.18, 0.43],
            [0.15, 0.41],
            [0.1, 0.45],
            [0.06, 0.47],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.9])
      .smoothUnion(0.04, sdf.ellipsoid([0.16, 0.075, 0.06]).at(0, 0.485, -0.12)) // the hood's folds behind the neck
      .subtract(sdf.box([0.16, 0.3, 0.3]).at(0, 0.55, 0.2)); // open in front of the jaw
    // The high collar: a flared wall that stands up behind the skull, open at the front.
    const collar = sdf
      .revolve(
        profile.polygon(
          [
            [0.11, 0.44],
            [0.15, 0.5],
            [0.2, 0.57],
            [0.245, 0.64],
            [0.24, 0.648],
            [0.228, 0.642],
            [0.185, 0.575],
            [0.138, 0.505],
            [0.1, 0.45],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.9])
      .intersect(sdf.halfSpace([0, 0, 1], 0.01));
    // Wide bell sleeves with ragged ends and a gold cuff at the mouth.
    const sleeve = (s: V3, e: V3, w: V3) => {
      const a: V3 = [s[0] * 0.85, 0.41, 0];
      const end = lerp(e, w, 0.55);
      const notches = sdf.union(sdf.sphere(0.024).at(end[0], end[1] - 0.074, end[2]), sdf.sphere(0.02).at(end[0], end[1] + 0.01, end[2] + 0.074));
      const opening = sdf.sphere(0.058).at(...lerp(e, w, 0.82)); // a dark opening for the hand
      const cone = sdf.cone(a, end, 0.05, 0.072);
      return {
        cloth: cone.subtract(opening).subtract(notches),
        cuff: cone.round(0.005).intersect(opening.round(0.018)).subtract(opening.round(0.001)).subtract(notches), // a gold ring around the opening
      };
    };
    // A cape hangs from the shoulders behind the arms and flares to the floor: purple outside,
    // lined with gold cloth, with the same ragged hem.
    const capeOuter = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.46],
            [0.13, 0.46],
            [0.17, 0.38],
            [0.215, 0.2],
            [0.27, 0.045],
            [0.265, 0.03],
            [0, 0.03],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.8]);
    const cape = capeOuter
      .subtract(capeOuter.round(-0.012))
      .intersect(sdf.halfSpace([0, -1, 0], -0.036))
      .intersect(sdf.halfSpace([0, 0, 1], -0.02))
      .subtract(hem);
    const lining = capeOuter.round(-0.006).subtract(capeOuter.round(-0.022)).intersect(sdf.halfSpace([0, 0, 1], -0.005));
    const sleeveL = sleeve(SHOULDER, ELBOW_L, WRIST_L);
    const sleeveR = sleeve(mx(SHOULDER), ELBOW_R, WRIST_R);
    const robeBlack = rgb(T.robeBlack);
    const robe = sdf
      .union(
        robeShape.subtract(hem).bone('spine'),
        cape.bone('spine'),
        sdf.union(hood, collar).bone('chest'),
        sleeveL.cloth.bone('upperarm.L'),
        sleeveR.cloth.bone('upperarm.R'),
      )
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.12), T.robeDark, 0.04)
      .paintWhere(lining, C.lining, 0.002)
      .paintFn((x, y, z, base) => (noise.fbm(x * 20, y * 20, z * 20, 2) > 0.35 ? mixRgb(base, robeBlack, 0.15) : base));
    k.body('robe', robe, { color: T.robe, roughness: 0.85, bump: (x, y, z) => 0.0008 * noise.fbm(x * 70, y * 30, z * 70, 2) });

    // Gold trim: the ragged hem band, the sleeve cuffs, the collar's rim, and a clasp at the throat.
    const hemBand = robeShape.round(0.006).subtract(hem).intersect(sdf.box([0.7, 0.024, 0.7]).at(0, 0.03, 0));
    const collarRim = collar.round(0.004).intersect(sdf.halfSpace([0, -1, 0], -0.622)).intersect(sdf.box([0.8, 0.2, 0.8]).at(0, 0.6, 0));
    const claspZ = sdf.raycast(robeShape, [0, 0.43, 1], [0, 0, -1])![2];
    const clasp = sdf
      .extrude(
        profile.polygon([
          [0, 0.036],
          [0.03, 0],
          [0, -0.036],
          [-0.03, 0],
        ]),
        0.02,
        0.005,
      )
      .at(0, 0.43, claspZ + 0.002);
    const trim = sdf.union(hemBand.bone('spine'), sleeveL.cuff.bone('upperarm.L'), sleeveR.cuff.bone('upperarm.R'), sdf.union(collarRim, clasp).bone('chest'));
    k.body('trim', trim, { color: C.gold, roughness: 0.35, metalness: 1 });

    // A pale rope belt at the waist with a hanging end.
    const beltY = 0.25;
    const sash = robeShape.round(0.01).smoothIntersect(0.006, sdf.box([0.6, 0.026, 0.6], 0.008).at(0, beltY, 0));
    const ropeFront = sdf.raycast(sash, [0.03, beltY, 1], [0, 0, -1])![2];
    const ropeEnds = sdf.union(
      sdf.chain([[0.03, beltY, ropeFront - 0.004, 0.011], [0.04, beltY - 0.06, ropeFront - 0.002, 0.009], [0.035, beltY - 0.12, ropeFront, 0.012]], 0.004),
      sdf.chain([[0.03, beltY, ropeFront - 0.004, 0.011], [0.06, beltY - 0.05, ropeFront - 0.006, 0.009], [0.07, beltY - 0.1, ropeFront - 0.008, 0.012]], 0.004),
      sdf.sphere(0.02).at(0.03, beltY, ropeFront - 0.002),
    );
    k.body('rope', sdf.union(sash, ropeEnds).bone('spine'), { color: C.rope, roughness: 0.8 });

    // ------------------------------------------------------------------ the staff with a clawed green gem
    const staffPts: [number, number, number, number][] = [
      [GRIP[0] - 0.004, 0.02, GRIP[2] + 0.006, 0.014],
      [GRIP[0] + 0.006, 0.2, GRIP[2] - 0.004, 0.016],
      [GRIP[0], 0.45, GRIP[2] + 0.004, 0.017],
      [GRIP[0] + 0.004, STAFF_TOP, GRIP[2], 0.02],
    ];
    // A leather wrap winds around the upper staff.
    const wrap = sdf.chain(
      Array.from({ length: 12 }, (_, i) => {
        const y = 0.36 + i * 0.03;
        const a = i * 1.3;
        return [GRIP[0] + Math.cos(a) * 0.017, y, GRIP[2] + Math.sin(a) * 0.017, 0.007] as [number, number, number, number];
      }),
      0.005,
    );
    const staff = sdf
      .smoothUnion(0.01, sdf.chain(staffPts, 0.02), wrap.paint(C.wrap))
      .paintFn((x, y, z, base) => (y < 0.35 && noise.fbm(x * 90, y * 12, z * 90, 2) > 0.25 ? rgb(C.woodDark) : base));
    k.body('staff', staff, { color: C.wood, roughness: 0.8, bone: 'weapon', bump: (x, y, z) => 0.0012 * noise.fbm(x * 160, y * 25, z * 160, 2) });
    // The claw: a knuckled cup on the staff top and four hooked talons around the gem.
    const talon = (deg: number) => {
      const a = (deg * Math.PI) / 180;
      const at = (r: number, y: number, rad: number) => [GEM[0] + Math.cos(a) * r, y, GEM[2] + Math.sin(a) * r, rad] as [number, number, number, number];
      return sdf.chain([at(0.026, STAFF_TOP + 0.01, 0.014), at(0.052, GEM[1] - 0.02, 0.012), at(0.058, GEM[1] + 0.02, 0.009), at(0.036, GEM[1] + 0.05, 0.004)], 0.006);
    };
    const claw = sdf.smoothUnion(0.012, sdf.sphere(0.032).at(GEM[0], STAFF_TOP + 0.005, GEM[2]), ...[45, 135, 225, 315].map(talon));
    k.body('claw', claw, { color: C.claw, roughness: 0.5, metalness: 0.3, bone: 'weapon', detail: 0.0035 });
    k.body('staff-gem', sdf.sphere(GEM_R).at(...GEM), { bone: 'weapon', color: T.eyeDark, roughness: 0.12, emissive: T.eye, emissiveIntensity: 1.0, detail: 0.0035 });
    // Green flames lick up from the gem, and two small wisps float beside it.
    const gemFlame = flame(0.11).at(GEM[0], GEM[1] + 0.012, GEM[2]);
    const wisp = (h: number, p: V3) => flame(h).at(...p);
    const magic = sdf.union(gemFlame, wisp(0.045, [GEM[0] + 0.075, GEM[1] + 0.07, GEM[2] - 0.02]), wisp(0.035, [GEM[0] + 0.045, GEM[1] + 0.14, GEM[2] + 0.05]));
    k.body('staff-magic', magic.paintFn(flamePaint([GEM[0], GEM[1], GEM[2]], 0.13, T.magicCore, T.eye)), {
      bone: 'lantern',
      color: T.eye,
      roughness: 0.3,
      emissive: T.eye,
      emissiveIntensity: 0.9,
      opacity: 0.9,
      detail: 0.0035,
    });

    // ------------------------------------------------------------------ the green flame over the open right hand
    const palmFlame = flame(0.17).at(...PALM);
    k.body('palm-fire', palmFlame.paintFn(flamePaint(PALM, 0.17, T.magicCore, T.eye)), {
      bone: 'palmfire',
      color: T.eye,
      roughness: 0.3,
      emissive: T.eye,
      emissiveIntensity: 0.9,
      detail: 0.0035,
    });
    // The spell bolt: a bright green orb with a short tail back toward the hand (local -Y, so it
    // trails behind when the orb flies along the flame's axis).
    const boltOrb = sdf.smoothUnion(0.01, sdf.sphere(0.03), sdf.cone([0, -0.012, 0], [0, -0.042, 0], 0.022, 0.006)).at(...BOLT);
    k.body('spell-orb', boltOrb.paintFn(flamePaint([BOLT[0], BOLT[1] - 0.042, BOLT[2]], 0.08, T.eye, T.magicCore)), {
      bone: 'bolt',
      color: T.eye,
      roughness: 0.25,
      emissive: T.eye,
      emissiveIntensity: 1.4,
      detail: 0.003,
    });

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop } = motion;
    const LEG = 0.19;

    k.animation('idle', {
      duration: 2.8,
      pose: (_t, p) => ({
        hips: { move: [0, -0.004 * bump(p), 0], rotate: [0, 0, 2 * wave(p)] },
        chest: { rotate: [2.5 * wave(p), 0, 0] },
        // The skull tilts, curious and a bit creepy.
        head: { rotate: [2 * wave(p, 1, 0.3), 6 * wave(p, 1, 0.1), 8 * wave(p, 1, 0.25)] },
        lantern: { scale: [1 + 0.05 * wave(p, 3), 1 + 0.12 * wave(p, 4, 0.3), 1 + 0.05 * wave(p, 3)] },
        'upperarm.R': { rotate: [-3 * bump(p), 0, -2 * wave(p, 1, 0.2)] },
        'forearm.R': { rotate: [-6 * bump(p), 0, 0] },
        bolt: HIDE,
      }),
    });

    // A gliding shuffle: short steps under the robe, a gentle bob and sway. The legs come from
    // motion.gait: planted stance feet, a knee lift in the swing, heel strike and toe-off.
    const glide = (duration: number, step: number, lift: number, duty: number, hop: number, lean: number, sway: number, swing: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        const hipsTurn = [0, 5 * s, sway * s] as const;
        const legs = motion.gait(p - 0.25, { hip: HIP, knee: KNEE, ankle: ANKLE }, {
          stride: step,
          lift,
          duty,
          bob: hop,
          roll: 10,
          heel: [0.098, 0, 0.003],
          toe: [0.089, 0, 0.089],
          hips: { at: [0, 0.2, 0], rotate: hipsTurn },
        });
        const fl = 1 + (swing / 100) * wave(p, 2, 0.2);
        return {
          ...legs.pose,
          hips: { move: [0, legs.hipsY, 0] as const, rotate: hipsTurn },
          spine: { rotate: [lean, 0, -sway * 0.5 * s] as const },
          head: { rotate: [-lean, 4 * s, 3 * wave(p, 1, 0.25)] as const },
          lantern: { scale: [1, fl, 1] as const },
          'upperarm.R': { rotate: [-6 * s, 0, 0] as const },
          'upperarm.L': { rotate: [4 * s, 0, 0] as const },
          bolt: HIDE,
        };
      },
    });
    k.animation('walk', glide(1.1, 0.09, 0.02, 0.6, 0.005, 4, 3, 10));
    k.animation('run', glide(0.7, 0.13, 0.035, 0.42, 0.02, 12, 4, 18));

    const { keys, reach, orient } = motion;

    // ------------------------------------------------------------------ attack: a staff-raise spell
    // The lich lifts the staff high and out to its left, leans back, and the gem charges (its
    // flames swell and tremble). Then it thrusts the staff forward so the gem points at the
    // target, and the flames flare to twice their size for a beat. Recovery: back to rest. The
    // hand counters the arm's lift, so the staff stays upright and out, clear of the skull and
    // the crown; the feet stay planted.
    k.animation('attack', {
      duration: 1.2,
      loop: false,
      pose: (_t, p) => {
        const K = (pts: readonly (readonly [number, number])[]) => keys(p, pts);
        const upX = K([[0, 0], [0.3, -45], [0.46, -48], [0.54, -60], [0.68, -58], [1, 0]]);
        const upZ = K([[0, 0], [0.3, 30], [0.46, 32], [0.54, 27], [0.68, 26], [1, 0]]);
        const foX = K([[0, 0], [0.3, -35], [0.46, -38], [0.54, -15], [0.68, -15], [1, 0]]);
        const tiltX = K([[0, 0], [0.3, 4], [0.46, 2], [0.54, 22], [0.68, 20], [1, 0]]); // the staff: + tips the gem forward
        const tiltZ = K([[0, 0], [0.3, -12], [0.46, -13], [0.54, -3], [0.68, -3], [1, 0]]); // - tips the gem out
        const raise = K([[0, 0], [0.3, 1], [0.68, 1], [1, 0]]);
        const charge = K([[0.12, 0], [0.3, 0.6], [0.46, 1], [0.52, 0.3], [0.56, 0]]);
        const strike = K([[0.44, 0], [0.54, 1], [0.68, 1], [1, 0]]);
        const flare = K([[0, 1], [0.3, 1.25], [0.46, 1.4], [0.54, 2.0], [0.62, 1.85], [0.74, 1.05], [1, 1]]);
        const shake = charge * Math.sin(2 * Math.PI * 14 * p);
        const twist = K([[0, 0], [0.3, 6], [0.46, 7], [0.54, -10], [0.68, -9], [1, 0]]);
        const lean = -5 * raise + 11 * strike;
        return {
          spine: { rotate: [lean * 0.5, twist * 0.4, 0] },
          chest: { rotate: [lean * 0.5, twist * 0.6, 1.5 * shake] },
          head: { rotate: [-8 * raise + 6 * strike - 0.6 * lean, -0.7 * twist, 2 * shake] },
          eyeglow: { scale: [1 + 0.25 * charge + 0.3 * strike, 1 + 0.25 * charge + 0.3 * strike, 1 + 0.25 * charge + 0.3 * strike] },
          'upperarm.L': { rotate: [upX, 0, upZ] },
          'forearm.L': { rotate: [foX, 0, 0] },
          'hand.L': { rotate: [tiltX - upX - foX, 0, tiltZ - upZ] },
          lantern: { scale: [flare * (1 + 0.06 * shake), flare * (1 + 0.1 * shake), flare * (1 + 0.06 * shake)] },
          // The flame hand drops a little forward and out, the flame tipped away from the skull.
          'upperarm.R': { rotate: [-6 * raise, 0, 7 * raise] },
          palmfire: { scale: [1 + 0.06 * raise, 1 + 0.12 * raise + 0.05 * shake, 1 + 0.06 * raise] },
          bolt: HIDE,
        };
      },
    });

    // ------------------------------------------------------------------ cast: the palm bolt
    // A cast, solved by targets. The wrist follows keys in the chest's rest frame (reach); the
    // flame axis (the hand's rest +Y) follows its own keys (orient), and the fingers stay pointed
    // out to the right, so the palm turns from up to forward about one axis. Gather: the flame
    // hand pulls back and down to the right hip, and the body leans back and turns the right
    // shoulder away. Push: the arm thrusts straight, forward and out to the right at chest height,
    // below and outside the skull, and the flame points at the target. Recovery: back to rest.
    // The palm flame (its own bone) gathers and flares at the release, and a bolt flies out.
    const ARM_R = { root: mx(SHOULDER), mid: ELBOW_R, end: WRIST_R };
    const FLAME_UP: V3 = [0, 1, 0]; // the flame's axis at rest
    const FINGERS: V3 = [-1, 0, 0]; // the open hand's fingers at rest
    const HIP_R: V3 = [-0.215, 0.255, -0.05];
    const PUSH: V3 = [-0.255, 0.37, 0.115];
    k.animation('cast', {
      duration: 1.0,
      loop: false,
      pose: (_t, p) => {
        const wrist = keys(
          p,
          [
            [0, WRIST_R],
            [0.14, [-0.25, 0.3, 0.03]],
            [0.3, HIP_R],
            [0.4, [-0.22, 0.26, -0.055]], // the hold at the hip
            [0.46, [-0.275, 0.32, 0.03]], // out past the robe
            [0.52, PUSH],
            [0.66, [-0.252, 0.366, 0.11]],
            [1, WRIST_R],
          ] as const,
          'spline',
        );
        const dir = unit(
          keys(
            p,
            [
              [0, FLAME_UP],
              [0.3, [-0.35, 1, -0.25]], // up, out, and back at the hip
              [0.4, [-0.35, 1, -0.25]],
              [0.46, [-0.4, 0.75, 0.55]],
              [0.52, [-0.45, 0.1, 0.89]], // at the target: forward and out to the right
              [0.66, [-0.42, 0.14, 0.9]],
              [1, FLAME_UP],
            ] as const,
          ),
        );
        const fingers = keys(p, [[0, FINGERS], [0.3, [-1, 0, 0.3]], [0.4, [-1, 0, 0.3]], [0.52, [-1, 0.4, 0]], [0.66, [-1, 0.4, 0]], [1, FINGERS]] as const);
        // The elbow bends back and out at the hip, down and out in the thrust.
        const pole = keys(p, [[0, ELBOW_R], [0.3, [-0.35, 0.3, -0.25]], [0.4, [-0.35, 0.3, -0.25]], [0.52, [-0.35, 0.2, 0.05]], [0.66, [-0.35, 0.2, 0.05]], [1, ELBOW_R]] as const);
        const arm = reach(ARM_R, wrist, pole);
        const hand = orient([arm.upper, arm.lower], { dir: FLAME_UP, up: FINGERS }, { dir, up: fingers });
        const twist = keys(p, [[0, 0], [0.3, -14], [0.4, -15], [0.52, 12], [0.66, 10], [1, 0]] as const);
        const lean = keys(p, [[0, 0], [0.3, -6], [0.4, -7], [0.52, 9], [0.66, 8], [1, 0]] as const);
        const fwd = keys(p, [[0, 0], [0.3, -0.012], [0.4, -0.014], [0.52, 0.035], [0.66, 0.03], [1, 0]] as const);
        const look = keys(p, [[0, 0], [0.3, 6], [0.4, 6], [0.52, -18], [0.66, -16], [1, 0]] as const);
        const thrust = keys(p, [[0, 0], [0.4, 0], [0.52, 1], [0.66, 1], [1, 0]] as const);
        const gather = keys(p, [[0, 0], [0.3, 1], [0.4, 1], [0.52, 0]] as const);
        const flare = keys(
          p,
          [[0, 1], [0.14, 0.94], [0.3, 0.8], [0.4, 0.84], [0.47, 1.22], [0.52, 1.8], [0.59, 1.74], [0.66, 1.02], [0.76, 0.9], [1, 1]] as const,
        );
        // The bolt leaves the palm at the release and flies 0.6 m along the flame's axis in 0.12 s.
        const fly = (p - 0.52) / 0.12;
        const boltS = 1.6 - 0.6 * Math.min(1, Math.max(0, (fly - 0.75) / 0.25));
        const bolt = fly >= 0 && fly <= 1 ? { move: [0, 0.6 * (1 - (1 - fly) ** 1.6), 0] as V3, scale: [boltS, boltS, boltS] as V3 } : HIDE;
        // The feet stay planted: the legs tilt under the hips as the hips move.
        const legA = (Math.atan2(fwd, LEG) * 180) / Math.PI;
        return {
          hips: { move: [0, -legDrop(LEG, legA), fwd] },
          spine: { rotate: [lean, twist * 0.4, 0] },
          chest: { rotate: [0, twist * 0.6, 0] },
          head: { rotate: [-0.7 * lean, look, 0] },
          lantern: { scale: [1 + 0.2 * thrust, 1 + 0.3 * thrust, 1 + 0.2 * thrust] },
          'upperarm.L': { rotate: [8 * thrust - 4 * gather, 0, -3 * gather] }, // the staff tilts out, clear of the skull
          'upperarm.R': { rotate: arm.upper },
          'forearm.R': { rotate: arm.lower },
          'hand.R': { rotate: hand },
          palmfire: { scale: [flare, flare, flare] },
          bolt,
          'leg.L': { rotate: [legA, 0, 0] },
          'leg.R': { rotate: [legA, 0, 0] },
          'foot.L': { rotate: [-legA, 0, 0] },
          'foot.R': { rotate: [-legA, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ hit: a blow from the front
    // The chest snaps back and the loose skull rattles on its neck; the crown jolts, the staff
    // flames gutter, the robe jolts. The staff and the palm flame stay in the hands.
    const { quat, euler } = motion;
    const DEG = Math.PI / 180;
    const SHIN = HIP[1] - ANKLE[1]; // hip joint to ankle joint
    /** The leg angle (degrees) that keeps a foot on its rest spot when the hips move `back` meters. */
    const plantLean = (back: number) => Math.asin(Math.max(-1, Math.min(1, back / SHIN))) / DEG;
    k.animation('hit', {
      duration: 0.4,
      loop: false,
      pose: (_t, p) => {
        const h = keys(p, [[0, 0], [0.14, 1], [0.3, 0.8], [0.8, 0]] as const);
        const rattle = keys(p, [[0.06, 0], [0.14, 1], [0.22, -0.8], [0.3, 0.55], [0.38, -0.35], [0.46, 0.18], [0.56, 0]] as const);
        const jolt = keys(p, [[0.06, 0], [0.18, 1], [0.32, -0.6], [0.46, 0.3], [0.6, -0.1], [0.72, 0]] as const);
        const flick = keys(p, [[0.04, 1], [0.1, 0.45], [0.16, 1.3], [0.24, 0.7], [0.32, 1.15], [0.44, 0.9], [0.58, 1]] as const);
        const back = 0.025 * h;
        const lean = plantLean(back);
        const fw = 0.7 + 0.3 * flick;
        return {
          hips: { move: [0, -legDrop(SHIN, lean), -back], rotate: [0, 4 * h, 0] },
          spine: { rotate: [-4 * h + 2 * jolt, 0, 3 * jolt] },
          chest: { rotate: [-10 * h, 5 * h, 2 * h] },
          neck: { rotate: [-8 * h + 3 * rattle, 0, 0] },
          head: { rotate: [-16 * h + 6 * rattle, 8 * rattle, 7 * rattle - 3 * h] },
          candle: { rotate: [-5 * jolt, 0, 4 * rattle] },
          lantern: { scale: [fw, flick, fw] },
          // The staff arm holds the staff near upright and tilts it out, away from the skull.
          'upperarm.L': { rotate: [5 * h, 0, -4 * h] },
          'forearm.L': { rotate: [3 * h, 0, 0] },
          'upperarm.R': { rotate: [-4 * h, 0, -12 * h] },
          'forearm.R': { rotate: [8 * h, 0, 0] },
          palmfire: { scale: [1 - 0.1 * rattle, 1 + 0.15 * rattle, 1 - 0.1 * rattle] },
          bolt: HIDE,
          'leg.L': { rotate: [-lean, 0, 0] },
          'leg.R': { rotate: [-lean, 0, 0] },
          'foot.L': { rotate: [lean, 0, 0] },
          'foot.R': { rotate: [lean, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ death: a stagger, then a heap of robe and bones
    // The blow snaps the chest back and rattles the skull; the palm flame and the staff flames
    // sputter out. The hand lets the staff go: it topples out to the left front and lands flat on
    // its claw. The robe crumples into a heap (the spine squashes; the chest scales back, so all
    // above it keeps its shape), the legs fold forward under it, and the arms sprawl. At last the
    // crowned skull drops off to the right, lands tilted back, and the eye lights go out.
    // The `weapon` (staff) and `head` bones are placed in world space under their posed parents.
    type Pose = Record<string, { move?: V3; rotate?: V3; scale?: V3 }>;
    const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
    /** 0 to 1 from `a` to `b`, speeding up like a drop. */
    const fall = (a: number, b: number, x: number) => clamp01((x - a) / (b - a)) ** 2;
    const vec = (a: V3) => new THREE.Vector3(a[0], a[1], a[2]);
    const arr = (v: THREE.Vector3): V3 => [v.x, v.y, v.z];
    const offsetOf = (name: string): V3 => {
      const b = RIG[name]!;
      const pa: V3 = b.parent ? RIG[b.parent]!.at : [0, 0, 0];
      return [b.at[0] - pa[0], b.at[1] - pa[1], b.at[2] - pa[2]];
    };
    /** A bone's world matrix in a pose, by the rig's rule: rest offset plus move, then rotate, then scale. */
    const worldOf = (name: string, pose: Pose): THREE.Matrix4 => {
      const bp = pose[name] ?? {};
      const o = offsetOf(name);
      const m = bp.move ?? [0, 0, 0];
      const local = new THREE.Matrix4().compose(vec([o[0] + m[0], o[1] + m[1], o[2] + m[2]]), quat(bp.rotate ?? [0, 0, 0]), vec(bp.scale ?? [1, 1, 1]));
      const parent = RIG[name]!.parent;
      return parent ? worldOf(parent, pose).multiply(local) : local;
    };
    /** Where a point bound to bone `name` (given in rest world meters) is in a pose. */
    const pointOf = (name: string, pose: Pose, pt: V3): V3 => {
      const at = RIG[name]!.at;
      return arr(vec([pt[0] - at[0], pt[1] - at[1], pt[2] - at[2]]).applyMatrix4(worldOf(name, pose)));
    };
    const turnOf = (name: string, pose: Pose) => {
      const q = new THREE.Quaternion();
      worldOf(name, pose).decompose(new THREE.Vector3(), q, new THREE.Vector3());
      return q;
    };
    /** The move and rotate that put bone `name`'s pivot at `at` with the world turn `turn`. */
    const placeAt = (name: string, pose: Pose, at: V3, turn: THREE.Quaternion) => {
      const local = worldOf(RIG[name]!.parent!, pose).invert().multiply(new THREE.Matrix4().compose(vec(at), turn, new THREE.Vector3(1, 1, 1)));
      const pos = new THREE.Vector3();
      const q = new THREE.Quaternion();
      local.decompose(pos, q, new THREE.Vector3());
      const o = offsetOf(name);
      return { move: [pos.x - o[0], pos.y - o[1], pos.z - o[2]] as V3, rotate: euler(q) };
    };
    const turned = (v: V3, q: THREE.Quaternion) => arr(vec(v).applyQuaternion(q));
    const plus = (a: V3, b: V3, s = 1): V3 => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
    // Where the staff comes to rest: flat on the floor, out to the left front, on its claw.
    const STAFF_FOOT: V3 = [GRIP[0] - 0.004, 0.02, GRIP[2] + 0.006]; // the bottom end of the staff
    const LIE_D = unit([0.75, 0, 0.66]);
    const LIE_U = unit([0.66, 0, -0.75]);
    const STAFF_TURN = quat(orient([], { dir: [0, 1, 0], up: [1, 0, 0] }, { dir: LIE_D, up: LIE_U }));
    const FOOT_DOWN: V3 = [0.31, 0.062, 0.13]; // keeps the staff's axis about 6 cm up (the claw's radius)
    // Where the skull comes to rest: on the floor to the right, tilted back, the crown still on.
    const SKULL_C: V3 = [0, HEAD_Y + 0.03, -0.005];
    const SKULL_DOWN: V3 = [-0.5, 0.22, 0.06];
    const SKULL_TURN = quat([-20, 30, 12]);
    const HEAP = { y: 0.5, xz: 0.3 }; // the robe's squash: height lost, width gained
    k.animation('death', {
      duration: 1.4,
      loop: false,
      pose: (_t, p) => {
        const hitB = keys(p, [[0, 0], [0.06, 1], [0.16, 0.5], [0.3, 0.15], [0.36, 0]] as const);
        const rattle = keys(p, [[0.03, 0], [0.08, 1], [0.13, -0.8], [0.18, 0.6], [0.23, -0.35], [0.28, 0.15], [0.33, 0]] as const);
        const wob = keys(p, [[0.1, 0], [0.2, 1], [0.3, -0.4], [0.36, 0]] as const);
        const sag = keys(p, [[0.16, 0], [0.32, 1]] as const);
        // The palm flame and the staff flames sputter and go out.
        const pf = keys(p, [[0, 1], [0.05, 1.3], [0.1, 0.55], [0.15, 0.8], [0.22, 0.25], [0.28, 0]] as const);
        const mf = keys(p, [[0, 1], [0.06, 1.3], [0.14, 0.7], [0.22, 0.9], [0.3, 0.3], [0.36, 0.001]] as const);
        // The eyes flare in the blow, then dim and go out as the skull rocks to a stop.
        const ef = keys(p, [[0, 1], [0.06, 1.2], [0.14, 0.9], [0.22, 1], [0.8, 1], [0.83, 0.65], [0.85, 0.8], [0.88, 0.001]] as const);
        // The collapse: the robe crumples, faster and faster, to the impact at 0.52, and settles.
        const c = fall(0.3, 0.52, p);
        const sq = c + 0.12 * keys(p, [[0.52, 0], [0.57, 1], [0.64, 0]] as const);
        const sy = 1 - HEAP.y * sq;
        const sxz = 1 + HEAP.xz * sq;
        const limp = keys(p, [[0.3, 0], [0.46, 0.6], [0.56, 1.12], [0.64, 1]] as const);
        const back = 0.03 * hitB;
        const lean = plantLean(back) * (1 - c);
        // The hem stays on the floor as the robe squashes about the spine pivot (0.24 m above it).
        const pose: Pose = {
          hips: { move: [0, 0.24 * (sy - 1) - legDrop(SHIN, lean), -back * (1 - c) + 0.01 * c], rotate: [0, 8 * c, 0] },
          spine: { rotate: [(-6 * hitB + 3 * sag) * (1 - c), 0, 5 * wob * (1 - c)], scale: [sxz, sy, sxz] },
          // No chest turn while squashed: its counter-scale then keeps all above it rigid.
          chest: {
            rotate: [(-12 * hitB + 3 * sag) * (1 - c), 6 * hitB * (1 - c), 3 * wob * (1 - c)],
            scale: [1 / sxz, 1 / sy, 1 / sxz],
            move: [0, (-0.045 * sq) / sy, (0.025 * sq) / sxz],
          },
          neck: { rotate: [-8 * hitB + 3 * rattle + 10 * sag, 0, 0] },
          head: { rotate: [-18 * hitB + 6 * rattle + 6 * sag, 8 * rattle, 7 * rattle + 8 * wob] },
          candle: { rotate: [-6 * hitB, 0, 6 * rattle] },
          eyeglow: { scale: [ef, ef, ef] },
          palmfire: { scale: [pf, pf, pf] },
          lantern: { scale: [mf, mf, mf] },
          bolt: HIDE,
          // The arms fling in the blow, then sprawl out over the heap.
          'upperarm.L': { rotate: [-6 * hitB - 30 * limp, 0, -4 * hitB + 35 * limp] },
          'forearm.L': { rotate: [-20 * limp, 0, 0] },
          'upperarm.R': { rotate: [-4 * hitB - 50 * limp, 0, -12 * hitB + 14 * limp] }, // forward, clear of the skull's path
          'forearm.R': { rotate: [8 * hitB + 20 * sag - 20 * limp, 0, 0] },
          // The legs fold forward under the heap; the bony feet poke out, toes up.
          'leg.L': { rotate: [-lean - 80 * c, -12 * c, 18 * c] },
          'leg.R': { rotate: [-lean - 80 * c, 12 * c, -18 * c] },
          'foot.L': { rotate: [lean, 0, 0] },
          'foot.R': { rotate: [lean, 0, 0] },
        };
        // The staff: the hand lets go at 0.28; it topples about its foot and lands flat at 0.5.
        const sw = fall(0.28, 0.5, p);
        const swB = keys(p, [[0.5, 0], [0.54, 1], [0.6, 0]] as const);
        if (p > 0.28) {
          const heldTurn = turnOf('weapon', pose);
          const held = pointOf('weapon', pose, STAFF_FOOT);
          const foot = plus(lerp([held[0], Math.max(STAFF_FOOT[1], held[1]), held[2]], FOOT_DOWN, sw), [0, 0.012 * swB, 0]);
          const turn = heldTurn.clone().slerp(STAFF_TURN, sw);
          pose.weapon = placeAt('weapon', pose, plus(foot, turned([GRIP[0] - STAFF_FOOT[0], GRIP[1] - STAFF_FOOT[1], GRIP[2] - STAFF_FOOT[2]], turn)), turn);
        }
        // The skull topples off the neck at 0.6, lands at 0.76, and rocks to a stop.
        if (p > 0.6) {
          const heldTurn = turnOf('head', pose);
          const skullNow = pointOf('head', pose, SKULL_C);
          const off = fall(0.6, 0.76, p);
          const offT = keys(p, [[0.6, 0], [0.76, 1]] as const);
          const rock = keys(p, [[0.76, 0], [0.81, 1], [0.87, -0.45], [0.93, 0.15], [0.98, 0]] as const);
          const turnH = heldTurn.clone().slerp(quat([0, 0, -6 * rock]).multiply(SKULL_TURN), offT);
          const skullAt = plus(lerp(skullNow, SKULL_DOWN, off), [0, 0.12 * Math.sin(Math.PI * clamp01((p - 0.6) / 0.16)), 0]);
          pose.head = placeAt('head', pose, plus(skullAt, turned([SKULL_C[0] - RIG.head!.at[0], SKULL_C[1] - RIG.head!.at[1], SKULL_C[2] - RIG.head!.at[2]], turnH), -1), turnH);
        }
        return pose;
      },
    });

    // ------------------------------------------------------------------ taunt: a cackle, then a point
    // Played when the lich first sees the player. It throws the skull back and cackles: the skull
    // bobs back and up four times, the shoulders shake with each laugh, the eyes pulse, and the
    // flame hand rises out beside the skull while the palm flame swells to 1.5 times and flickers.
    // Then it leans in and points the flame hand at the player for a beat, and returns to rest.
    const WRIST_CACKLE: V3 = [-0.27, 0.46, 0.06]; // beside the skull, out past the cheekbone
    const POLE_CACKLE: V3 = [-0.36, 0.3, -0.02]; // the elbow out and down
    const WRIST_POINT: V3 = [-0.235, 0.375, 0.13]; // forward at chest height, out to the right
    const POLE_POINT: V3 = [-0.34, 0.26, 0.06];
    const LAUGH_A = 0.12; // the first "ha"
    const LAUGH_B = 0.57; // the end of the fourth
    k.animation('taunt', {
      duration: 1.6,
      loop: false,
      pose: (_t, p) => {
        const cackle = keys(p, [[0, 0], [0.12, 1], [0.56, 1], [0.68, 0]] as const);
        const pt = keys(p, [[0.56, 0], [0.68, 1], [0.84, 1], [1, 0]] as const);
        const jab = keys(p, [[0.66, 0], [0.71, 1], [0.78, 0]] as const); // "you!"
        const u = (p - LAUGH_A) / (LAUGH_B - LAUGH_A);
        const laugh = u > 0 && u < 1 ? Math.sin(Math.PI * 4 * u) ** 2 : 0;
        const sway = cackle * Math.sin(2 * Math.PI * 2 * u);
        const wrist = keys(
          p,
          [[0, WRIST_R], [0.14, WRIST_CACKLE], [0.56, WRIST_CACKLE], [0.68, WRIST_POINT], [0.84, WRIST_POINT], [1, WRIST_R]] as const,
          'spline',
        );
        const pole = keys(p, [[0, ELBOW_R], [0.14, POLE_CACKLE], [0.56, POLE_CACKLE], [0.68, POLE_POINT], [0.84, POLE_POINT], [1, ELBOW_R]] as const);
        const arm = reach(ARM_R, [wrist[0], wrist[1], wrist[2] + 0.012 * jab], pole);
        const dir = unit(keys(p, [[0, FLAME_UP], [0.14, [-0.15, 1, 0]], [0.56, [-0.15, 1, 0]], [0.68, [0, 1, 0.08]], [0.84, [0, 1, 0.08]], [1, FLAME_UP]] as const));
        const fingers = keys(p, [[0, FINGERS], [0.14, [-1, 0, 0.25]], [0.56, [-1, 0, 0.25]], [0.68, [0.12, -0.1, 1]], [0.84, [0.12, -0.1, 1]], [1, FINGERS]] as const);
        const hand = orient([arm.upper, arm.lower], { dir: FLAME_UP, up: FINGERS }, { dir, up: fingers });
        const swell = keys(p, [[0, 1], [0.14, 1.5], [0.56, 1.5], [0.68, 1.2], [0.84, 1.2], [1, 1]] as const);
        const flick = 0.6 * Math.sin(2 * Math.PI * 11 * p) + 0.4 * Math.sin(2 * Math.PI * 17 * p + 1);
        const fa = (swell - 1) / 0.5;
        const fxz = swell * (1 + 0.05 * fa * flick);
        const fy = swell * (1 + 0.1 * fa * flick + 0.06 * laugh);
        const eye = 1 + 0.3 * laugh + 0.15 * pt;
        const gm = 1 + 0.15 * laugh + 0.1 * pt;
        return {
          spine: { rotate: [-3 * cackle + 3 * pt, 4 * pt, 0] },
          chest: { rotate: [-5 * cackle - 3 * laugh + 4 * pt, 10 * pt, 0], move: [0, 0.005 * laugh, 0] },
          neck: { rotate: [-8 * cackle + 4 * pt, 0, 0] },
          head: { rotate: [-12 * cackle - 8 * laugh + 6 * pt, 0, 3 * sway], move: [0, 0.006 * laugh, 0] },
          candle: { rotate: [-3 * laugh, 0, 2 * sway] },
          eyeglow: { scale: [eye, eye, eye] },
          lantern: { scale: [gm, gm * (1 + 0.05 * flick), gm] },
          'upperarm.L': { rotate: [-7 * pt, 0, -1.5 * cackle - 1.5 * pt] }, // the staff tilts out, clear of the skull
          'upperarm.R': { rotate: arm.upper },
          'forearm.R': { rotate: arm.lower },
          'hand.R': { rotate: hand },
          palmfire: { scale: [fxz, fy, fxz] },
          bolt: HIDE,
        };
      },
    });
  },
});
