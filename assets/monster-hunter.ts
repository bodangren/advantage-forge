import { defineAsset, motion, noise, profile, rgb, sdf, Sdf, THREE } from '../src/index.js';

/**
 * Monster hunter — Chibi Quest hero (catalog `heroes/support/monster-hunter`), 1.03 m to the top
 * of the hat, faces +Z. Target: docs/hero-mockups/monster-hunter_001.jpg (one front view; side and
 * back are designed here). Built on the ranger (the rogue's body, face, and skeleton with knee
 * bones), so the heroes read as one set. The mockup's beard is left out: the young round face stays.
 *
 * Role: player hero, seen in 3D and as a 128 px sprite: the wide hat, the long black coat, the
 *   bandolier of silver stakes, and the curved sword must read.
 * One idea: a huge flat-brimmed black hat over a big-eyed, heavy-browed face, on a long black
 *   leather coat; a bandolier of silver stakes and a silver sword are the only bright things.
 * Proportions: hat crown top 1.02, brim 0.765 (r 0.262, tilted up 8 degrees at the front), eyes
 *   0.628, chin 0.48, shoulders 0.385, belt 0.252, coat hem 0.15 (x +-0.215), boot cuffs 0.15.
 * Shape language: round (head, boots, coat) with the flat brim disc, the tooth and the stakes as
 *   the sharp accents.
 * Palette (60/30/10): black leather #1c1a1e with lit edges #2e2a30 (60); skin, dark hair, brown
 *   bandolier (30); silver #c3c8cf as the accent, with a green vial liquid as a small spark.
 * Value plan: the pale face under the black brim is the focal point; the silver badge, stakes,
 *   buckle, and sword blade are the second contrast.
 * Bodies: skin, hair, hat, scarf, coat, coat-trim, vest, belt, bandolier, silver, vials, vial-caps,
 *   teeth, pants, boots, crossbow, crossbow-steel, sword, sword-grip, stake, stake-cap.
 * Rig: the ranger's skeleton without the hood peak and the bow bones. The sword is rigid on
 *   `hand.R` (held low, blade out), the stake on `hand.L`; the crossbow is on the chest, the hat
 *   on the head. Clips: idle, walk, run, attack (a slash), attack2 (a two-hand stake stab), hit,
 *   death, victory (the sword raised).
 */

const C = {
  skin: '#f2c7a4',
  earInner: '#eaa98e',
  blush: '#f09a86',
  freckle: '#cf8a66',
  scar: '#d98f7e',
  eyeWhite: '#f6f1ea',
  irisRim: '#1e1a14',
  iris: '#6e4020',
  irisLow: '#a8703a',
  pupil: '#141210',
  lid: '#1c130f',
  brow: '#2a1810',
  mouth: '#7a3a36',
  hair: '#3a2418',
  hat: '#1c1a1e',
  hatLit: '#3a363c',
  hatBand: '#34303a',
  coat: '#2a2a30',
  lit: '#4a3f3a',
  stitch: '#5a5460',
  scarf: '#2e2a30',
  vest: '#26222a',
  belt: '#3a2a20',
  beltLit: '#5a4030',
  band: '#6b4226',
  tooth0: '#3a2a20',
  silver: '#c3c8cf',
  silverLit: '#e6eaef',
  steel: '#b8bcc0',
  steelDark: '#6a6e74',
  glass: '#4a3a20',
  liquid: '#8ab040',
  cork: '#8a6a40',
  tooth: '#ece4d0',
  grip: '#3a2618',
  stake: '#4a3020',
  pants: '#2a2830',
  boot: '#5a3a24',
  bootCuff: '#6b4630',
  bootStrap: '#3a2618',
  sole: '#2a1a10',
  wood: '#5a3a24',
  cord: '#c9bf9f',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.105, 0.628] as const;
const pair = (s: sdf.Shape) => s.mirror('x');
const DEG = Math.PI / 180;

// Joints: both arms hang (the sword and the stake are held low).
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW: V3 = [0.18, 0.332, 0.012];
const WRIST: V3 = [0.205, 0.238, 0.03];
const HIP: V3 = [0.068, 0.195, 0];
const ANKLE: V3 = [0.098, 0.07, 0];
const KNEE: V3 = [0.083, 0.1325, 0];
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];

const fistAt = (w: V3, s: 1 | -1) => {
  const o = (dx: number, dy: number, dz: number): V3 => [w[0] + dx * s, w[1] + dy, w[2] + dz];
  return sdf.smoothUnion(
    0.018,
    sdf.ellipsoid([0.042, 0.047, 0.048]).at(...o(0.008, -0.042, 0.004)),
    sdf.capsule(o(-0.01, -0.064, 0.033), o(-0.006, -0.042, 0.046), 0.019),
    sdf.cone(o(0.022, -0.025, 0.028), o(0.001, -0.036, 0.053), 0.018, 0.014),
  );
};
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scl = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
const len = (a: V3) => Math.hypot(a[0], a[1], a[2]);
const norm = (a: V3): V3 => scl(a, 1 / len(a));
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const smooth01 = (x: number) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};

// The held items. Each is built in a local frame (origin at the fist's center, the blade or the
// stake along +Y) and placed so that +Y points along its rest direction in the fist.
const SW_D0 = norm([-0.75, -0.2, 0.6]); // the blade, out and a little forward, tip low
const STK_D0 = norm([0.5, -0.6, 0.6]); // the stake, tip out and forward, low
const FIST_R: V3 = [-0.213, 0.194, 0.04];
const FIST_L: V3 = [0.213, 0.194, 0.04];
/** A right-handed frame with +Y along `dir` and +Z as near to `zHint` as `dir` allows. */
const frameOf = (dir: V3, zHint: V3) => {
  const y = norm(dir);
  const z = norm(sub(zHint, scl(y, dot(zHint, y))));
  return { x: cross(y, z), y, z };
};
const place = (s: sdf.Shape, at: V3, dir: V3, zHint: V3) => {
  const f = frameOf(dir, zHint);
  const m = new THREE.Matrix4().makeBasis(
    new THREE.Vector3(...f.x),
    new THREE.Vector3(...f.y),
    new THREE.Vector3(...f.z),
  );
  const e = new THREE.Euler().setFromRotationMatrix(m, 'ZYX');
  const d = 1 / DEG;
  return s.rotate(e.x * d, e.y * d, e.z * d).at(...at);
};
const SW_Z0 = frameOf(SW_D0, [0, 0, -1]).z; // the blade's flat normal in the rest pose

// The hat: a flat brim (a height field tilted up 8 degrees at the front, curled at the rim) and a
// low crown. `brimY` is the brim's mid height at (x, z).
const HAT_Y = 0.85;
const TILT = Math.tan(8 * DEG);
const BRIM_R = 0.3;
const brimY = (x: number, z: number) => {
  const r = Math.hypot(x, z);
  const side = r > 1e-6 ? (x / r) * (x / r) : 0;
  return HAT_Y + TILT * z + 0.01 * smooth01((r - 0.22) / 0.08) - 0.04 * side * smooth01((r - 0.15) / 0.13);
};
const brimHalf = (x: number, z: number) => 0.007;
const brimSheet = new Sdf(
  (x, y, z) => Math.max((Math.abs(y - brimY(x, z)) - brimHalf(x, z)) / 1.4, Math.hypot(x, z) - BRIM_R),
  { min: [-0.37, 0.7, -0.37], max: [0.37, 1.0, 0.37] },
);
// Everything below the brim's underside (hair is clipped to it, so it never pokes through).
const belowBrim = new Sdf((x, y, z) => (y - (brimY(x, z) - 0.006)) / 1.4, { min: [-0.37, 0.3, -0.37], max: [0.37, 0.98, 0.37] });

export default defineAsset({
  name: 'monster-hunter',
  description:
    'Chibi monster hunter hero in a wide black hat and a long black leather coat, with a bandolier of silver stakes, a tooth necklace, a crossbow on the back, a curved silver sword, and a wooden stake.',
  detail: 0.006,
  reference: 'docs/hero-mockups/monster-hunter_001.jpg',
  variants: {
    eyes: { brown: C.iris, grey: '#6a7078', green: '#3d7a35' },
    hair: { brown: C.hair, black: '#231a17', auburn: '#8e3b1c' },
    skin: { fair: C.skin, tan: '#d49a72', brown: '#8a5a3e' },
    coat: { black: C.coat, oxblood: '#4a1a1e', forest: '#1e3a2a' },
  },
  presets: {
    default: { eyes: 'brown', hair: 'brown', skin: 'fair', coat: 'black' },
    oxblood: { eyes: 'grey', hair: 'auburn', skin: 'tan', coat: 'oxblood' },
    forest: { eyes: 'green', hair: 'black', skin: 'brown', coat: 'forest' },
  },

  build(k) {
    const T = {
      iris: k.tint('eyes'),
      irisLow: k.tint('eyes', { color: C.irisLow, follow: 1 }),
      hair: k.tint('hair'),
      brow: k.tint('hair', { color: C.brow, follow: 1 }),
      skin: k.tint('skin'),
      earInner: k.tint('skin', { color: C.earInner, follow: 1 }),
      freckle: k.tint('skin', { color: C.freckle, follow: 1 }),
      scar: k.tint('skin', { color: C.scar, follow: 1 }),
      coat: k.tint('coat'),
      lit: k.tint('coat', { color: C.lit, follow: 1 }),
    };
    // ------------------------------------------------------------------ skeleton
    k.skeleton({
      hips: { at: [0, 0.2, 0] },
      spine: { parent: 'hips', at: [0, 0.26, 0] },
      chest: { parent: 'spine', at: [0, 0.33, 0] },
      neck: { parent: 'chest', at: [0, 0.43, -0.01] },
      head: { parent: 'neck', at: [0, 0.48, -0.01] },
      'upperarm.L': { parent: 'chest', at: SHOULDER },
      'forearm.L': { parent: 'upperarm.L', at: ELBOW },
      'hand.L': { parent: 'forearm.L', at: WRIST },
      'upperarm.R': { parent: 'chest', at: mx(SHOULDER) },
      'forearm.R': { parent: 'upperarm.R', at: mx(ELBOW) },
      'hand.R': { parent: 'forearm.R', at: mx(WRIST) },
      'leg.L': { parent: 'hips', at: HIP },
      'shin.L': { parent: 'leg.L', at: KNEE, split: 0.015 },
      'foot.L': { parent: 'shin.L', at: ANKLE },
      'leg.R': { parent: 'hips', at: mx(HIP) },
      'shin.R': { parent: 'leg.R', at: mx(KNEE), split: 0.015 },
      'foot.R': { parent: 'shin.R', at: mx(ANKLE) },
    });
    /** A part that crosses the chest/spine split: the upper half on `chest`, the lower on `spine`. */
    const splitChest = (s: sdf.Shape) =>
      sdf.union(
        s.intersect(sdf.halfSpace([0, -1, 0], -0.3)).bone('chest'),
        s.intersect(sdf.halfSpace([0, 1, 0], 0.3)).bone('spine'),
      );

    // ------------------------------------------------------------------ head and face
    const head = sdf
      .smoothUnion(
        0.06,
        sdf.ellipsoid(HEAD).at(0, HEAD_Y, 0),
        pair(sdf.sphere(0.1).at(0.095, 0.575, 0.072)),
        sdf.ellipsoid([0.11, 0.055, 0.085]).at(0, 0.53, 0.058),
      )
      .bone('head');
    const faceZ = (x: number, y: number) => sdf.raycast(head, [x, y, 1], [0, 0, -1])![2];
    const nose = sdf.ellipsoid([0.02, 0.016, 0.015]).at(0, 0.566, faceZ(0, 0.566) - 0.004).bone('head');
    const ears = pair(
      sdf
        .ellipsoid([0.026, 0.044, 0.032])
        .subtract(sdf.sphere(0.017).at(0.016, 0, 0.006))
        .rotateY(-12)
        .at(0.196, 0.605, 0.004)
        .bone('head'),
    );
    const earHollow = pair(sdf.sphere(0.021).at(0.214, 0.605, 0.012));
    const neck = sdf.capsule([0, 0.42, -0.01], [0, 0.52, -0.01], 0.05).bone('neck');

    const armOne = sdf.smoothUnion(
      0.02,
      sdf.cone(SHOULDER, ELBOW, 0.04, 0.036).bone('upperarm.L'),
      sdf.cone(ELBOW, WRIST, 0.036, 0.032).bone('forearm.L'),
      fistAt(WRIST, 1).bone('hand.L'),
    );
    const arms = pair(armOne);

    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const eyeWhite = pair(at(sdf.ellipsoid([0.052, 0.056, 0.07]), EYE[0], EYE[1]));
    const irisRim = pair(at(sdf.ellipsoid([0.042, 0.049, 0.07]), EYE[0], EYE[1] - 0.004));
    const iris = pair(at(sdf.ellipsoid([0.036, 0.043, 0.07]), EYE[0], EYE[1] - 0.006));
    const irisLow = iris.intersect(sdf.halfSpace([0, 1, 0], EYE[1] - 0.02));
    const pupil = pair(at(sdf.ellipsoid([0.026, 0.029, 0.07]), EYE[0], EYE[1] + 0.002));
    // A heavy upper lid line, a little lower than the ranger's (a grim stare).
    const lid = pair(sdf.extrude(profile.arc(0.05, 0.015, 18, 162), 0.3).at(EYE[0], EYE[1] - 0.008, 0.1));
    const shine = sdf.union(
      ...[EYE[0], -EYE[0]].flatMap((x) => [
        at(sdf.sphere(0.012), x + 0.016, EYE[1] + 0.017),
        at(sdf.sphere(0.006), x - 0.014, EYE[1] - 0.022),
      ]),
    );
    // Heavy, straight brows: the inner end low (grim), thick, and close over the eyes.
    const brows = pair(
      sdf.extrude(profile.arc(0.22, 0.032, 75, 105), 0.3).at(0, -0.22, 0).rotateZ(14).at(0.104, 0.735, 0.1),
    );
    const mouth = sdf.extrude(profile.rect([0.062, 0.012], 0.005), 0.3).at(0, 0.534, 0.1);
    const blush = pair(at(sdf.sphere(0.03), 0.138, 0.56));
    const freckles = pair(
      sdf.union(
        ...(
          [
            [0.118, 0.575],
            [0.14, 0.582],
            [0.156, 0.568],
          ] as const
        ).map(([x, y]) => at(sdf.sphere(0.0055), x, y)),
      ),
    );
    // A scar across the right cheek.
    const scar = sdf.extrude(profile.rect([0.07, 0.008], 0.003), 0.3).rotateZ(-58).at(-0.138, 0.572, 0.1);

    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.012, nose, ears)
      .union(arms)
      .paintWhere(earHollow, T.earInner, 0.006)
      .paintWhere(blush, C.blush, 0.03)
      .paintWhere(freckles, T.freckle, 0.003)
      .paintWhere(eyeWhite, C.eyeWhite)
      .paintWhere(irisRim, C.irisRim)
      .paintWhere(iris, T.iris)
      .paintWhere(irisLow, T.irisLow, 0.012)
      .paintWhere(pupil, C.pupil)
      .paintWhere(lid, C.lid)
      .paintWhere(shine, '#ffffff')
      .paintWhere(scar, T.scar, 0.002)
      .paintWhere(brows, T.brow)
      .paintWhere(mouth, C.mouth);
    k.body('skin', skin, { color: T.skin, roughness: 0.55, textureDensity: 2 });

    // ------------------------------------------------------------------ hair: thick separate locks
    const faceMask = sdf.ellipsoid([0.25, 0.16, 0.23]).rotateZ(6).at(0.0, 0.615, 0.14);
    const cap = sdf
      .ellipsoid([HEAD[0] + 0.007, HEAD[1] + 0.008, HEAD[2] + 0.007])
      .at(0, HEAD_Y + 0.004, -0.01)
      .smoothSubtract(0.015, faceMask)
      .intersect(sdf.halfSpace([0, -1, 0], -0.6));
    const safeZ = (x: number, y: number): number => {
      let xs = x;
      for (let i = 0; i < 12; i++) {
        const hit = sdf.raycast(head, [xs, y, 1], [0, 0, -1]);
        if (hit) return hit[2];
        xs *= 0.9;
      }
      return 0.05;
    };
    // A lock on the forehead: points (x, y, r) laid on the face, half sunk in it.
    const fringe = (pts: readonly (readonly [number, number, number])[]) =>
      sdf.chain(pts.map(([x, y, r]) => [x, y, safeZ(Math.abs(x), y) + 0.004, r] as const), 0.012);
    const foreLocks = sdf.union(
      pair(fringe([[0.19, 0.84, 0.024], [0.172, 0.812, 0.024], [0.158, 0.786, 0.016], [0.152, 0.768, 0.008]])),
      pair(fringe([[0.135, 0.85, 0.024], [0.128, 0.822, 0.024], [0.114, 0.797, 0.016], [0.108, 0.778, 0.008]])),
      pair(fringe([[0.075, 0.855, 0.024], [0.072, 0.83, 0.024], [0.062, 0.805, 0.015], [0.058, 0.786, 0.008]])),
      fringe([[0.012, 0.857, 0.024], [0.016, 0.832, 0.024], [0.006, 0.808, 0.014], [0.0, 0.79, 0.007]]),
    );
    // Thick side locks in front of and behind the ears, to the jaw.
    const sideLocks = pair(
      sdf.union(
        sdf.chain([[0.178, 0.81, 0.06, 0.026], [0.192, 0.74, 0.08, 0.024], [0.2, 0.68, 0.09, 0.022], [0.203, 0.63, 0.092, 0.01]], 0.012),
        sdf.chain([[0.17, 0.81, -0.02, 0.026], [0.192, 0.74, -0.03, 0.024], [0.2, 0.67, -0.04, 0.022], [0.198, 0.6, -0.05, 0.01]], 0.012),
      ),
    );
    // Locks down the back of the head, to the nape.
    const backZ = (x: number, y: number) =>
      -HEAD[2] * Math.sqrt(Math.max(0.12, 1 - ((y - HEAD_Y) / HEAD[1]) ** 2 - (x / HEAD[0]) ** 2)) + 0.004;
    const backLock = (x: number, y0: number, y1: number, r: number) =>
      sdf.chain(
        [0, 1, 2, 3].map((i) => {
          const y = y0 + ((y1 - y0) * i) / 3;
          const xs = x * (1 - 0.1 * i);
          return [xs, y, backZ(xs, y), i === 3 ? r * 0.3 : r] as const;
        }),
        0.008,
      );
    const backLocks = sdf.union(
      ...[-0.165, -0.11, -0.055, 0, 0.055, 0.11, 0.165].map((x, i) => backLock(x, 0.83, 0.535 + 0.02 * (i % 2), 0.03)),
    );
    const hair = sdf
      .smoothUnion(0.012, cap, foreLocks, sideLocks, backLocks)
      .intersect(belowBrim);
    k.body('hair', hair, { color: T.hair, roughness: 0.6, detail: 0.005, bone: 'head' });

    // ------------------------------------------------------------------ the hat
    const crown = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.8],
            [0.214, 0.8],
            [0.217, 0.86],
            [0.208, 0.95],
            [0.192, 1.01],
            [0.172, 1.04],
            [0.14, 1.05],
            [0, 1.05],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.94])
      .at(0, 0, -0.005);
    // A dent in the crown top, so the crown reads as its own volume.
    const crownDent = sdf.ellipsoid([0.11, 0.03, 0.1]).at(0, 1.078, 0);
    const bandRing = sdf
      .revolve(
        profile.polygon([
          [0.19, 0.866],
          [0.226, 0.869],
          [0.23, 0.928],
          [0.19, 0.932],
        ]),
      )
      .round(0.004)
      .scale([1, 1, 0.94])
      .at(0, 0, -0.005);
    const brim = brimSheet.round(0.004);
    const hatShape = sdf
      .smoothUnion(0.018, crown.smoothSubtract(0.02, crownDent), brim)
      .union(bandRing)
      .paintFn((x, y, z, base) => {
        const r = Math.hypot(x, z);
        const th = Math.atan2(x, z);
        if (y > 0.864 && y < 0.934 && r > 0.216) return rgb(C.hatBand); // the band
        if (y > 1.02 && r > 0.12) return rgb(C.hatLit); // the crown's top rim
        if (y < brimY(x, z) + 0.02 && r > BRIM_R - 0.03) return rgb(C.hatLit); // the brim's rolled rim
        if (y < brimY(x, z) + 0.02 && y > brimY(x, z) && Math.abs(r - (BRIM_R - 0.045)) < 0.0028 && Math.sin(th * 130) > 0.2) return rgb(C.stitch);
        return base;
      });
    k.body('hat', hatShape, {
      color: C.hat,
      roughness: 0.85,
      detail: 0.006,
      bone: 'head',
      bump: (x, y, z) => 0.0005 * noise.noise3(x * 80, y * 80, z * 80),
    });

    // The silver badge on the crown's front: a fang-shaped shield, sunk a little in the crown.
    const crownFront = sdf.raycast(crown, [0, 0.985, 1], [0, 0, -1])![2];
    const bandFront = sdf.raycast(bandRing, [0, 0.9, 1], [0, 0, -1])![2];
    const badge = sdf
      .extrude(
        profile.polygon([
          [-0.022, -0.02],
          [0.022, -0.02],
          [0.016, 0.0],
          [0.006, 0.022],
          [0, 0.03],
          [-0.006, 0.022],
          [-0.016, 0.0],
        ]),
        0.014,
        0.004,
      )
      .at(0, 0.985, crownFront)
      .bone('head');

    // A silver buckle plate (0.05 m) on the band's front, with a prong across its window.
    const hatBuckle = sdf
      .union(
        sdf.box([0.05, 0.042, 0.014], 0.004).subtract(sdf.box([0.03, 0.022, 0.03], 0.003)),
        sdf.box([0.008, 0.03, 0.01], 0.003).at(0.004, 0, 0.002),
      )
      .at(0, 0.9, bandFront + 0.002)
      .bone('head');

    // ------------------------------------------------------------------ vest
    const torso = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.47],
            [0.07, 0.465],
            [0.105, 0.44],
            [0.125, 0.4],
            [0.13, 0.34],
            [0.125, 0.29],
            [0.134, 0.25],
            [0.148, 0.212],
            [0.158, 0.178],
            [0.161, 0.163],
            [0.15, 0.153],
            [0, 0.153],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.78]);
    const vest = torso.paintFn((x, y, z, base) =>
      Math.abs(x) < 0.003 && z > 0 && y > 0.17 && y < 0.44 && Math.sin(y * 140) > 0.3 ? rgb(C.stitch) : base,
    );
    k.body('vest', vest.bone('spine'), { color: C.vest, roughness: 0.75 });

    // ------------------------------------------------------------------ coat: a long black leather shell, closed at the back, open at the front
    const coatSolid = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.47],
            [0.095, 0.462],
            [0.13, 0.44],
            [0.152, 0.41],
            [0.16, 0.36],
            [0.158, 0.31],
            [0.165, 0.26],
            [0.182, 0.21],
            [0.205, 0.17],
            [0.215, 0.148],
            [0.222, 0.12],
            [0, 0.11],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.8]);
    const opening = sdf
      .extrude(
        profile.polygon([
          [-0.04, 0.5],
          [0.04, 0.5],
          [0.1, 0.12],
          [-0.1, 0.12],
        ]),
        0.4,
      )
      .at(0, 0, 0.2);
    const neckHole = sdf.cylinder(0.072, 0.2).at(0, 0.47, 0);
    const shellOf = (outer: sdf.Shape, t: number) => outer.subtract(outer.round(-t));
    const coatShell = shellOf(coatSolid, 0.014)
      .intersect(sdf.halfSpace([0, -1, 0], -0.15))
      .subtract(neckHole)
      .smoothSubtract(0.006, opening);
    // The high collar: a flared ring, tall at the back and cut down toward a V at the front.
    const collar = sdf
      .revolve(
        profile.polygon([
          [0.098, 0.43],
          [0.125, 0.45],
          [0.138, 0.49],
          [0.136, 0.535],
          [0.117, 0.535],
          [0.118, 0.492],
          [0.104, 0.456],
          [0.074, 0.43],
        ]),
      )
      .round(0.004)
      .scale([1, 1, 0.92])
      .at(0, 0, -0.012)
      .intersect(sdf.halfSpace([0, 0.912, 0.41], 0.4287));
    // Sleeves over the arms, with a wide flared cuff at the wrist.
    const sleeveOne = sdf.union(
      sdf.cone(SHOULDER, ELBOW, 0.053, 0.05).bone('upperarm.L'),
      sdf
        .cone(ELBOW, lerp(ELBOW, WRIST, 0.7), 0.05, 0.058)
        .round(0.004)
        .subtract(sdf.cone(lerp(ELBOW, WRIST, 0.45), lerp(ELBOW, WRIST, 1.2), 0.044, 0.047))
        .bone('forearm.L'),
    );
    const sleeves = pair(sleeveOne);
    const coatBody = sdf
      .union(coatShell.intersect(sdf.halfSpace([0, -1, 0], -0.3)).bone('chest'), coatShell.intersect(sdf.halfSpace([0, 1, 0], 0.3)).bone('spine'))
      .smoothUnion(0.01, collar.bone('chest'), sleeves)
      .paintFn((x, y, z, base) => {
        const ax = Math.abs(x);
        const dash = Math.sin(y * 150) > 0.1;
        if (z > 0.02 && y > 0.17 && y < 0.4 && dash && (Math.abs(ax - 0.13) < 0.0028 || (Math.abs(ax - 0.18) < 0.0028 && y < 0.3))) return rgb(C.stitch);
        if (z < -0.02 && y > 0.17 && y < 0.42 && dash && ax < 0.0028) return rgb(C.stitch);
        return base;
      });
    k.body('coat', coatBody, {
      color: T.coat,
      roughness: 0.85,
      bump: (x, y, z) => {
        const ax = Math.abs(x);
        const stitch =
          z > 0.02 && y > 0.17 && y < 0.4 && Math.sin(y * 150) > 0.1 && (Math.abs(ax - 0.13) < 0.003 || (Math.abs(ax - 0.18) < 0.003 && y < 0.3)) ? -0.0016 : 0;
        return stitch + 0.0006 * noise.noise3(x * 70, y * 70, z * 70);
      },
    });

    // Raised lit rims: the hem, the front edges, the collar top, and the cuffs.
    const rimShell = coatSolid.round(0.007).subtract(coatSolid.round(-0.014)).intersect(sdf.halfSpace([0, -1, 0], -0.15));
    const hemRim = rimShell.intersect(sdf.box([1, 0.03, 1]).at(0, 0.165, 0)).subtract(opening);
    const edgeAt = (y: number) => {
      const x = 0.04 + (0.06 * (0.5 - y)) / 0.38; // the opening's half width at y
      const z = sdf.raycast(coatSolid, [x, y, 1], [0, 0, -1])![2];
      return [x + 0.004, y, z - 0.007, y > 0.3 ? 0.019 : 0.0105] as const;
    };
    const frontRim = pair(sdf.chain([0.44, 0.39, 0.34, 0.29, 0.24, 0.2, 0.165, 0.15].map(edgeAt), 0.012));
    const collarRim = collar
      .round(0.005)
      .intersect(sdf.halfSpace([0, 0.912, 0.41], 0.4287))
      .subtract(sdf.halfSpace([0, 0.912, 0.41], 0.4287 - 0.016));
    const cuffOne = sdf.union(
      sdf
        .cone(lerp(ELBOW, WRIST, 0.5), lerp(ELBOW, WRIST, 0.74), 0.056, 0.063)
        .round(0.004)
        .subtract(sdf.cone(lerp(ELBOW, WRIST, 0.45), lerp(ELBOW, WRIST, 1.2), 0.044, 0.047))
        .bone('forearm.L'),
    );
    const trim = sdf.union(
      splitChest(hemRim),
      splitChest(frontRim),
      collarRim.bone('chest'),
      pair(cuffOne),
    );
    k.body('coat-trim', trim, { color: T.lit, roughness: 0.8, detail: 0.006 });

    // ------------------------------------------------------------------ scarf, necklace
    const wrapA = sdf.torus(0.078, 0.028).scale([1, 1, 0.92]).rotateX(14).at(0, 0.47, -0.01);
    const wrapB = sdf.torus(0.072, 0.02).scale([1, 1, 0.92]).rotateX(-8).at(0, 0.44, -0.01);
    const tail = sdf.chain(
      [
        [-0.05, 0.455, 0.092, 0.03],
        [-0.072, 0.4, 0.118, 0.027],
        [-0.085, 0.345, 0.124, 0.022],
        [-0.088, 0.292, 0.122, 0.014],
      ],
      0.02,
    );
    const scarf = sdf.union(sdf.smoothUnion(0.012, wrapA, wrapB).bone('neck'), tail.bone('chest'));
    k.body('scarf', scarf, { color: C.scarf, roughness: 0.9, bump: (x, y, z) => 0.0008 * noise.noise3(x * 60, y * 90, z * 60) });

    const frontSurf = sdf.union(torso, coatShell, tail);
    const fz = (x: number, y: number) => sdf.raycast(frontSurf, [x, y, 1], [0, 0, -1])![2];
    const neckPts = [-0.085, -0.064, -0.043, -0.021, 0, 0.021, 0.043, 0.064, 0.085].map((x) => {
      const y = 0.41 - 0.05 * (1 - (x / 0.09) ** 2);
      return [x, y, fz(x, y) + 0.012, 0.0045] as const;
    });
    const toothAt = (x: number, size: number) => {
      const y = 0.41 - 0.05 * (1 - (x / 0.09) ** 2);
      const z = fz(x, y) + 0.012;
      return sdf.cone([x, y - 0.002, z], [x, y - size, z + 0.007], 0.0075, 0.0012);
    };
    const necklace = sdf.union(
      sdf.chain(neckPts, 0.006),
      ...[-0.06, -0.04, -0.02, 0, 0.02, 0.04, 0.06].map((x) => toothAt(x, x === 0 ? 0.03 : 0.022)),
    );
    k.body('necklace', splitChest(necklace.paintFn((x, y, z, base) => (y < 0.385 - 0.012 * Math.abs(x) * 10 && Math.abs(x) < 0.07 ? rgb(C.tooth) : base))), {
      color: C.band,
      roughness: 0.6,
      detail: 0.0035,
    });

    // ------------------------------------------------------------------ belt, buckle
    const beltY = 0.252;
    const belt = torso
      .round(0.01)
      .smoothIntersect(0.006, sdf.box([0.5, 0.05, 0.5], 0.006).at(0, beltY, 0))
      .paintFn((x, y, z, base) => (Math.abs(Math.abs(y - beltY) - 0.0215) < 0.003 ? rgb(C.beltLit) : base));
    k.body('belt', belt.bone('spine'), { color: C.belt, roughness: 0.5 });
    const beltZ = sdf.raycast(belt, [0, beltY, 1], [0, 0, -1])![2];
    const buckle = sdf
      .union(
        sdf.box([0.058, 0.046, 0.012], 0.005).subtract(sdf.box([0.036, 0.026, 0.03], 0.003)),
        sdf.box([0.008, 0.03, 0.01], 0.003).at(0.004, 0, 0.004),
      )
      .at(0, beltY, beltZ + 0.004);
    // Vest buttons, seen through the open coat.
    const buttons = sdf.union(
      ...[0.4, 0.365, 0.33, 0.295].map((y) => sdf.sphere(0.008).at(0, y, sdf.raycast(torso, [0, y, 1], [0, 0, -1])![2] + 0.001)),
    );

    // ------------------------------------------------------------------ bandolier with stakes and vials
    const coatSurf = (y: number, th: number) => {
      const s = Math.sin(th * DEG);
      const c = Math.cos(th * DEG);
      return sdf.raycast(coatSolid, [s * 0.6, y, c * 0.6], [-s, 0, -c])!;
    };
    // The strap is a sloped plane cut around the coat: y = 0.33 + 0.75 x, left shoulder to right hip.
    const strapAt = (th: number) => {
      let y = 0.33;
      let p = coatSurf(y, th);
      for (let i = 0; i < 6; i++) {
        y = Math.min(0.44, Math.max(0.18, 0.33 + 0.75 * p[0]));
        p = coatSurf(y, th);
      }
      return { p: p as V3, n: norm([Math.sin(th * DEG), 0, Math.cos(th * DEG)]) };
    };
    const ring = [...Array(18).keys()].map((i) => strapAt(i * 20).p);
    const strapPts = [...ring, ring[0]!].map((p) => [p[0], p[1], p[2], 0.02] as const);
    const strap = sdf.chain(
      strapPts.map(([x, y, z, r]) => [x * 0.985, y, z * 0.985, r] as const),
      0.012,
    );
    const band = splitChest(strap);
    k.body('bandolier', band, { color: C.band, roughness: 0.6, detail: 0.005 });
    // Stakes lie along the strap's front, tips toward the hip; vials hang under it.
    const stakeAt = (th: number) => {
      const a = strapAt(th + 4);
      const b = strapAt(th - 4);
      const { p, n } = strapAt(th);
      const t = norm(sub(b.p, a.p));
      let down = cross(n, t);
      if (down[1] > 0) down = scl(down, -1);
      const base = add(p, scl(n, 0.017));
      return sdf.cone(base, add(add(base, scl(down, 0.06)), scl(n, 0.004)), 0.0115, 0.002);
    };
    const stakes = sdf.union(...[44, 32, 20, 8, -44].map(stakeAt));
    // Three round silver ball vials sit on the strap; a short chain of links hangs above it.
    const balls = sdf.union(
      ...[-8, -20, -32].map((th) => {
        const { p, n } = strapAt(th);
        return sdf.sphere(0.018).at(...add(p, scl(n, 0.026)));
      }),
    );
    const links = sdf.union(
      ...[...Array(9).keys()].map((i) => {
        const { p, n } = strapAt(32 - 7.5 * i);
        const c = add(add(p, scl(n, 0.02)), [0, 0.032 - 0.014 * Math.sin((Math.PI * i) / 8), 0]);
        return sdf.torus(0.0085, 0.0028).rotateX(90).rotateY(i % 2 === 0 ? 0 : 90).at(...c);
      }),
    );
    k.body('chain', splitChest(links), { color: C.silver, roughness: 0.35, metalness: 0.8, detail: 0.003 });

    // ------------------------------------------------------------------ legs and heavy boots
    const pants = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.115, 0.05, 0.085]).at(0, 0.2, 0).bone('hips'),
      pair(sdf.capsule([HIP[0], 0.2, 0], [0.094, 0.115, 0.004], 0.046).bone('leg.L')),
    );
    k.body('pants', pants, { color: C.pants, roughness: 0.85 });

    const bootFoot = sdf
      .smoothUnion(
        0.035,
        sdf.cylinder(0.052, 0.068, 0.02).at(0, 0.054, 0),
        sdf.ellipsoid([0.062, 0.056, 0.108]).at(0, 0.05, 0.05),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const sole = bootFoot.round(0.006).intersect(sdf.halfSpace([0, 1, 0], 0.02)).intersect(sdf.halfSpace([0, -1, 0], 0));
    const bootShaft = sdf.cone([0, 0.055, 0], [0, 0.135, 0], 0.054, 0.058).round(0.003);
    const bootCuff = sdf.cone([0, 0.118, 0], [0, 0.156, 0], 0.06, 0.068).round(0.005).subtract(sdf.cylinder(0.052, 0.1).at(0, 0.2, 0));
    const strap2 = sdf.torus(0.059, 0.0085).at(0, 0.1, 0).paint(C.bootStrap);
    const turnOut = (s: sdf.Shape) => s.rotateY(12).at(ANKLE[0], 0, 0);
    const boot = sdf.union(
      turnOut(sdf.union(bootFoot, sole.paint(C.sole))).bone('foot.L'),
      turnOut(sdf.union(bootShaft, bootCuff.paint(C.bootCuff), strap2)).bone('shin.L'),
    );
    const bootBuckles = pair(
      turnOut(sdf.box([0.022, 0.024, 0.012], 0.003).subtract(sdf.box([0.012, 0.012, 0.03], 0.002)).at(0, 0.1, 0.066)).bone('shin.L'),
    );
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.6 });

    k.body(
      'silver',
      sdf.union(splitChest(stakes), splitChest(balls), buckle.bone('spine'), buttons.bone('spine'), badge, hatBuckle, bootBuckles),
      { color: C.silver, roughness: 0.35, metalness: 0.8, detail: 0.004 },
    );

    // ------------------------------------------------------------------ crossbow on the back
    // Laid over the coat's back, behind the collar: the prod's right end peeks above the right shoulder.
    const backPt = (x: number, y: number, off: number): V3 => {
      const zb = sdf.raycast(coatSolid, [x, Math.min(y, 0.44), -1], [0, 0, 1]);
      return [x, y, Math.min(zb ? zb[2] : -0.12, -0.127) - off];
    };
    const PC: V3 = [-0.05, 0.47, 0];
    const vProd = norm([-0.89, 0.45, 0]);
    const uDown = norm([-0.45, -0.89, 0]);
    const tipA = add(PC, scl(vProd, 0.12));
    const tipB = add(PC, scl(vProd, -0.12));
    const butt = add(PC, scl(uDown, 0.27));
    const fore = add(PC, scl(uDown, -0.045));
    const stockPts = [fore, PC, lerp(PC, butt, 0.5), butt].map((q, i) => {
      const p = backPt(q[0], q[1], 0.034);
      return [p[0], p[1], p[2], i === 3 ? 0.02 : 0.015] as const;
    });
    const stock = sdf.chain(stockPts, 0.01);
    const prodPts = [tipA, add(PC, scl(vProd, 0.06)), PC, add(PC, scl(vProd, -0.06)), tipB].map((q, i) => {
      const p = backPt(q[0], q[1], 0.034);
      const curve = [0.036, 0.008, 0, 0.008, 0.036][i]!;
      return [p[0], p[1], p[2] + curve, [0.008, 0.011, 0.013, 0.011, 0.008][i]!] as const;
    });
    const prod = sdf.chain(prodPts, 0.01);
    const stringLine = sdf.union(
      sdf.capsule([prodPts[0]![0], prodPts[0]![1], prodPts[0]![2]], [stockPts[3]![0] * 0.15 + PC[0] * 0.85, PC[1] - 0.05, prodPts[2]![2] - 0.012], 0.0035),
      sdf.capsule([prodPts[4]![0], prodPts[4]![1], prodPts[4]![2]], [stockPts[3]![0] * 0.15 + PC[0] * 0.85, PC[1] - 0.05, prodPts[2]![2] - 0.012], 0.0035),
    );
    const stirrup = sdf.torus(0.016, 0.0045).rotateX(90).at(stockPts[0]![0], stockPts[0]![1], stockPts[0]![2] - 0.0);
    k.body('crossbow', stock, { color: C.wood, roughness: 0.75, bone: 'chest', detail: 0.004 });
    k.body('crossbow-steel', sdf.union(prod, stirrup, stringLine.paint(C.cord)), {
      color: C.steel,
      roughness: 0.4,
      metalness: 0.7,
      bone: 'chest',
      detail: 0.004,
    });

    // ------------------------------------------------------------------ the sword (right hand) and the stake (left hand)
    // The cleaver: a 0.25 m dark wood handle with a steel collar and a 0.2 m x 0.09 m blade (0.012 m
    // thick, a bright edge line), held out to the side. Local frame: the fist at the origin.
    const bladeEdge: [number, number][] = [
      [0.0, 0.2],
      [0.03, 0.222],
      [0.06, 0.255],
      [0.074, 0.3],
      [0.068, 0.35],
      [0.04, 0.388],
      [0.0, 0.402],
    ];
    const edgeX = (y: number) => {
      for (let i = 0; i + 1 < bladeEdge.length; i++) {
        const [x0, y0] = bladeEdge[i]!;
        const [x1, y1] = bladeEdge[i + 1]!;
        if (y >= y0 && y <= y1) return x0 + ((x1 - x0) * (y - y0)) / (y1 - y0);
      }
      return 0;
    };
    const blade = sdf
      .extrude(profile.polygon([[-0.02, 0.2], ...bladeEdge, [-0.02, 0.402]]), 0.012, 0.0035)
      .paintFn((x, y, z, base) => (y > 0.21 && y < 0.4 && x > edgeX(y) - 0.011 ? rgb(C.silverLit) : base));
    const steelCollar = sdf.cylinder(0.022, 0.022, 0.004).at(0, 0.205, 0).paint(C.steelDark);
    const swordSilver = place(sdf.union(blade, steelCollar).at(0, -0.05, 0), FIST_R, SW_D0, [0, 0, -1]);
    const swordGrip = place(
      sdf.union(
        sdf.cylinder(0.0165, 0.25, 0.004).at(0, 0.085, 0),
        sdf.sphere(0.02).at(0, -0.04, 0),
      ).at(0, -0.05, 0),
      FIST_R,
      SW_D0,
      [0, 0, -1],
    );
    k.body('sword', swordSilver, { color: C.steel, roughness: 0.35, metalness: 0.8, detail: 0.004, bone: 'hand.R' });
    k.body('sword-grip', swordGrip, { color: C.grip, roughness: 0.6, detail: 0.004, bone: 'hand.R' });
    // The club: 0.28 m of dark wood, a steel band, and a 0.06 m silver spike at the tip.
    const stakeShape = sdf
      .cone([0, -0.05, 0], [0, 0.17, 0], 0.022, 0.0205)
      .round(0.002)
      .paintFn((x, y, z, base) => (y > -0.03 && y < 0.04 && Math.sin((y + x * 2) * 200) > -0.2 ? rgb('#2a1a10') : base));
    k.body('stake', place(stakeShape, FIST_L, STK_D0, [0, 1, 0]), { color: C.stake, roughness: 0.75, detail: 0.004, bone: 'hand.L' });
    const stakeMetal = sdf.union(
      sdf.cone([0, 0.165, 0], [0, 0.23, 0], 0.0205, 0.002),
      sdf.cylinder(0.0245, 0.014, 0.003).at(0, 0.148, 0).paint(C.steelDark),
      sdf.sphere(0.0225).at(0, -0.05, 0),
    );
    k.body('stake-cap', place(stakeMetal, FIST_L, STK_D0, [0, 1, 0]), {
      color: C.silver,
      roughness: 0.35,
      metalness: 0.8,
      detail: 0.004,
      bone: 'hand.L',
    });

    // ------------------------------------------------------------------ animation helpers
    const { wave, bump, legDrop, keys, reach, orient, quat, euler } = motion;
    const ARM_L = { root: SHOULDER, mid: ELBOW, end: WRIST };
    const ARM_R = { root: mx(SHOULDER), mid: mx(ELBOW), end: mx(WRIST) };
    const Z3: V3 = [0, 0, 0];
    const SW_REST = { dir: SW_D0, up: SW_Z0 };
    const STK_REST = { dir: STK_D0, up: frameOf(STK_D0, [0, 1, 0]).z };
    /** The right hand's rotation that turns the blade to `d` (in the chest's rest frame). */
    const swordTurn = (arm: { upper: V3; lower: V3 }, d: V3): V3 => {
      const hint: V3 = Math.abs(d[2]) > 0.95 ? [0, -1, 0] : [0, 0, -1];
      return orient([arm.upper, arm.lower], SW_REST, { dir: norm(d), up: frameOf(d, hint).z }) as V3;
    };
    const stakeTurn = (arm: { upper: V3; lower: V3 }, d: V3): V3 =>
      orient([arm.upper, arm.lower], STK_REST, { dir: norm(d), up: frameOf(d, [0, 1, 0]).z }) as V3;
    void quat;
    void euler;

    // ------------------------------------------------------------------ idle, walk, run
    k.animation('idle', {
      duration: 2.4,
      pose: (_t, p) => ({
        hips: { move: [0, -0.003 * bump(p), 0] },
        chest: { rotate: [2.5 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        head: { rotate: [0, 5 * wave(p, 1, 0.25), 2 * wave(p, 1, 0.1)] },
        'upperarm.L': { rotate: [1.5 * wave(p, 1, 0.1), 0, 2 * bump(p)] },
        'upperarm.R': { rotate: [2 * wave(p, 1, 0.1), 0, -3 * bump(p)] },
        'forearm.R': { rotate: [-5 * bump(p), 0, 0] },
        'forearm.L': { rotate: [-3 * bump(p), 0, 0] },
      }),
    });

    const stride = (duration: number, step: number, footLift: number, duty: number, armSwing: number, lean: number, hop: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        const hipsTurn = [0, 7 * s, 0] as const;
        const legs = motion.gait(p - 0.25, { hip: HIP, knee: KNEE, ankle: ANKLE }, {
          stride: step,
          lift: footLift,
          duty,
          bob: hop,
          roll: 10,
          heel: [0.092, 0, -0.025],
          toe: [0.11, 0, 0.1],
          hips: { at: [0, 0.2, 0], rotate: hipsTurn },
        });
        return {
          ...legs.pose,
          hips: { move: [0, legs.hipsY, 0] as const, rotate: hipsTurn },
          spine: { rotate: [lean, 0, 0] as const },
          chest: { rotate: [lean * 0.5, -11 * s, 0] as const },
          head: { rotate: [-lean, 5 * s, 0] as const },
          'upperarm.L': { rotate: [armSwing * s, 0, 6] as const },
          'upperarm.R': { rotate: [-armSwing * s, 0, -6] as const },
          'forearm.L': { rotate: [-armSwing * 0.5 - armSwing * 0.4 * Math.max(0, -s), 0, 0] as const },
          'forearm.R': { rotate: [-armSwing * 0.5 - armSwing * 0.4 * Math.max(0, s), 0, 0] as const },
        };
      },
    });
    k.animation('walk', stride(0.9, 0.1, 0.025, 0.6, 16, 3, 0.006));
    k.animation('run', stride(0.56, 0.15, 0.045, 0.4, 26, 12, 0.03));

    // ------------------------------------------------------------------ attack: a sword slash, solved by targets
    // The hunter turns to the right and raises the sword behind the shoulder, then cuts down and
    // across the body to the left in a fast arc, and follows through. The arm is solved in the
    // chest's rest frame. The left arm swings back for balance.
    const POLE_REST = mx(ELBOW);
    k.animation('attack', {
      duration: 0.9,
      loop: false,
      pose: (_t, p) => {
        const turn = keys(p, [[0, 0], [0.3, 1], [0.44, 1], [0.6, -0.6], [0.78, -0.6], [1, 0]] as const);
        const up = keys(p, [[0, 0], [0.3, 1], [0.44, 1], [0.56, 0], [1, 0]] as const);
        const wrist = keys(p, [
          [0, mx(WRIST)],
          [0.3, [-0.235, 0.53, -0.05]],
          [0.44, [-0.235, 0.535, -0.05]],
          [0.52, [-0.215, 0.45, 0.13]],
          [0.6, [-0.05, 0.33, 0.2]],
          [0.72, [-0.02, 0.3, 0.19]],
          [1, mx(WRIST)],
        ] as const);
        const dir = keys(p, [
          [0, SW_D0],
          [0.3, norm([-0.6, 0.75, -0.25])],
          [0.44, norm([-0.6, 0.75, -0.25])],
          [0.52, norm([-0.45, 0.4, 0.8])],
          [0.6, norm([0.3, -0.15, 0.9])],
          [0.72, norm([0.3, -0.12, 0.9])],
          [1, SW_D0],
        ] as const);
        const shR = keys(p, [[0, Z3], [0.3, [0, 0.012, -0.02]], [0.44, [0, 0.012, -0.02]], [0.6, [0.02, 0, 0.05]], [0.78, [0.02, 0, 0.04]], [1, Z3]] as const);
        const armR = reach(ARM_R, sub(wrist, shR), add(POLE_REST, scl([-0.12, 0.1, -0.3], up)));
        const back = keys(p, [[0, 0], [0.44, 1], [0.6, -0.5], [0.78, -0.3], [1, 0]] as const);
        return {
          hips: { rotate: [0, -16 * turn, 0] },
          spine: { rotate: [2 * turn * 0 - 3 * up + 5 * (1 - up) * Math.max(0, -turn), -10 * turn, 0] },
          chest: { rotate: [0, -8 * turn, 0] },
          neck: { rotate: [0, 8 * turn, 0] },
          head: { rotate: [0, 16 * turn, 0] },
          'upperarm.R': { move: shR, rotate: armR.upper },
          'forearm.R': { rotate: armR.lower },
          'hand.R': { rotate: swordTurn(armR, dir) },
          'upperarm.L': { rotate: [14 * back, 0, 8 * Math.abs(turn)] },
          'forearm.L': { rotate: [-10 * Math.abs(turn), 0, 0] },
          'leg.L': { rotate: [-4 * Math.abs(turn), 16 * turn, 3 * Math.abs(turn)] },
          'leg.R': { rotate: [3 * Math.abs(turn), 16 * turn, -3 * Math.abs(turn)] },
        };
      },
    });

    // ------------------------------------------------------------------ hit: a blow from the front
    const SHIN = 0.125;
    const plant = (back: number) => Math.asin(Math.max(-1, Math.min(1, back / SHIN))) / DEG;
    k.animation('hit', {
      duration: 0.4,
      loop: false,
      pose: (_t, p) => {
        const h = keys(p, [[0, 0], [0.15, 1], [0.32, 0.85], [0.8, 0]] as const);
        const lift = keys(p, [[0.04, 0], [0.13, 1], [0.24, 0], [0.5, 0], [0.62, 0.7], [0.74, 0]] as const);
        const back = 0.028 * h;
        const lean = plant(back);
        return {
          hips: { move: [0, -legDrop(SHIN, lean), -back], rotate: [0, 5 * h, 0] },
          spine: { rotate: [-6 * h, 0, 0] },
          chest: { rotate: [-10 * h, 6 * h, 3 * h] },
          neck: { rotate: [-6 * h, 0, 0] },
          head: { rotate: [-16 * h, -6 * h, 4 * h] },
          'leg.L': { rotate: [-lean, 0, 0] },
          'foot.L': { rotate: [lean, 0, 0] },
          'leg.R': { rotate: [lean + 16 * lift, 0, 0] },
          'foot.R': { rotate: [-lean - 16 * lift, 0, 0] },
          'upperarm.L': { rotate: [-8 * h, 0, 10 * h] },
          'forearm.L': { rotate: [-10 * h, 0, 0] },
          'upperarm.R': { rotate: [-8 * h, 0, -10 * h] },
          'forearm.R': { rotate: [-10 * h, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ death: a stagger, then a fall on the back
    const LIE = 80;
    const LIE_Y = 0.13;
    const HEEL = 0.055;
    // Points that touch the floor when lying (y, z in the hips' rest frame): the hat's back rim,
    // the crossbow, and the coat's back. The hips rise so that none of them goes below the floor.
    const PROPS: readonly (readonly [number, number])[] = [[0.62, -0.3], [0.27, -0.17], [0.12, -0.2]];
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
        const land = keys(p, [[0.48, 0], [0.7, 1]] as const);
        const back = 0.022 * hitB;
        const lean = plant(back);
        const a = tilt * DEG;
        const heels = Math.max(LIE_Y, 0.2 * Math.cos(a) + HEEL * Math.sin(a));
        const rise = Math.max(0, ...PROPS.map(([py, pz]) => -(heels + py * Math.cos(a) + pz * Math.sin(a)) + 0.004));
        const hipsY = heels + rise;
        const hipsMove: V3 = [0, hipsY - 0.2 - legDrop(SHIN, lean), -HEEL - 0.2 * Math.sin(a) + HEEL * Math.cos(a) - back];
        const legs = 16 * Math.min(1, Math.max(0, (tilt - LIE + 14) / 14));
        const spineR: V3 = [-8 * hitB + 6 * sag, 0, 4 * wob];
        const chestR: V3 = [-10 * hitB + 5 * sag, 6 * hitB, 5 * wob];
        const standR = add(add(add(mx(WRIST), scl([-0.05, 0.02, -0.05], hitB)), scl([0, -0.06, -0.03], sag)), scl([-0.07, 0, 0.04], fly));
        const armR = reach(ARM_R, lerp(standR, [-0.225, 0.33, -0.1], land), lerp(mx(ELBOW), [-0.3, 0.3, -0.1], land));
        const standL = add(add(add(WRIST, scl([0.05, 0.02, -0.05], hitB)), scl([0, -0.06, -0.03], sag)), scl([0.07, 0, 0.04], fly));
        const armL = reach(ARM_L, lerp(standL, [0.225, 0.33, -0.1], land), lerp(ELBOW, [0.3, 0.3, -0.1], land));
        // The held items turn outward as the hands open on the floor, lying flat and clear of it.
        const swordD = norm(lerp(SW_D0, [-0.95, 0.1, 0.3], land));
        const stakeD = norm(lerp(STK_D0, [0.95, -0.05, 0.3], land));
        return {
          hips: { move: hipsMove, rotate: [-tilt, 0, 0] },
          spine: { rotate: spineR },
          chest: { rotate: chestR },
          neck: { rotate: [-8 * hitB + 5 * sag + 8 * land, 0, 0] },
          head: { rotate: [-16 * hitB + 8 * sag + 10 * land, -8 * hitB, -6 * wob + 6 * land] },
          'upperarm.L': { rotate: armL.upper },
          'forearm.L': { rotate: armL.lower },
          'hand.L': { rotate: stakeTurn(armL, stakeD) },
          'upperarm.R': { rotate: armR.upper },
          'forearm.R': { rotate: armR.lower },
          'hand.R': { rotate: swordTurn(armR, swordD) },
          'leg.L': { rotate: [-lean + legs, 0, 8 * land] },
          'leg.R': { rotate: [-lean + legs, 0, -8 * land] },
          'foot.L': { rotate: [lean, 20 * land, 0] },
          'foot.R': { rotate: [lean, -20 * land, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ attack2: a two-hand stake stab
    // The hunter pulls the stake back at the hip, the right fist comes across to steady it, then
    // the stake thrusts straight forward at chest height, holds, and draws back. The sword is
    // held forward at the right side, away from the stake (its pommel stays outside the coat).
    k.animation('attack2', {
      duration: 1.1,
      loop: false,
      pose: (_t, p) => {
        const set = keys(p, [[0, 0], [0.25, 1], [0.86, 1], [1, 0]] as const);
        const thrust = keys(p, [[0.3, 0], [0.42, 0], [0.52, 1], [0.7, 1], [0.86, 0.15], [1, 0]] as const);
        const wristL = keys(p, [
          [0, WRIST],
          [0.25, [0.2, 0.3, 0.0]],
          [0.42, [0.2, 0.3, 0.0]],
          [0.52, [0.08, 0.36, 0.2]],
          [0.7, [0.08, 0.36, 0.2]],
          [0.86, [0.18, 0.31, 0.05]],
          [1, WRIST],
        ] as const);
        const wristR = keys(p, [
          [0, mx(WRIST)],
          [0.25, [-0.2, 0.34, 0.13]],
          [0.52, [-0.2, 0.34, 0.16]],
          [0.7, [-0.2, 0.34, 0.16]],
          [0.86, [-0.2, 0.33, 0.13]],
          [1, mx(WRIST)],
        ] as const);
        const shL = scl([0.01, 0.0, 0.05], thrust);
        const shR = scl([0.0, 0.0, 0.03], thrust);
        const armL = reach(ARM_L, sub(wristL, shL), add(ELBOW, scl([0.12, 0.0, -0.3], set)));
        const armR = reach(ARM_R, sub(wristR, shR), add(mx(ELBOW), scl([-0.12, 0.0, -0.3], set)));
        const stakeDir = keys(p, [
          [0, STK_D0],
          [0.25, norm([0.15, -0.05, 1])],
          [0.52, norm([0.0, 0.0, 1])],
          [0.7, norm([0.0, 0.0, 1])],
          [1, STK_D0],
        ] as const);
        const swordDir = keys(p, [
          [0, SW_D0],
          [0.25, norm([-0.4, 0.1, 0.9])],
          [0.86, norm([-0.4, 0.1, 0.9])],
          [1, SW_D0],
        ] as const);
        return {
          hips: { rotate: [0, 6 * set, 0] },
          spine: { rotate: [2 * set + 6 * thrust, 0, 0] },
          chest: { rotate: [2 * thrust, 4 * set, 0] },
          neck: { rotate: [-2 * thrust, 0, 0] },
          head: { rotate: [-3 * thrust, -4 * set, 0] },
          'upperarm.L': { move: shL, rotate: armL.upper },
          'forearm.L': { rotate: armL.lower },
          'hand.L': { rotate: stakeTurn(armL, stakeDir) },
          'upperarm.R': { move: shR, rotate: armR.upper },
          'forearm.R': { rotate: armR.lower },
          'hand.R': { rotate: swordTurn(armR, swordDir) },
          'leg.L': { rotate: [-3 * set, -6 * set, 3 * set] },
          'leg.R': { rotate: [3 * set, -6 * set, -3 * set] },
        };
      },
    });

    // ------------------------------------------------------------------ victory: the sword raised high
    const V_WRIST: V3 = [-0.235, 0.49, 0.1];
    const V_DIR = norm([-0.85, 0.55, 0.1]);
    const HIP_WRIST: V3 = [0.19, 0.3, 0.02];
    k.animation('victory', {
      duration: 1.2,
      loop: false,
      pose: (_t, p) => {
        const raise = keys(p, [[0, 0], [0.24, 1]] as const);
        const hop = keys(p, [[0.06, 0], [0.17, 1], [0.28, 0]] as const);
        const pump = keys(p, [[0.2, 0], [0.3, 1], [0.4, 0], [0.5, 1], [0.62, 0]] as const);
        const look = keys(p, [[0.08, 0], [0.24, 1], [0.5, 1], [0.75, 0]] as const);
        const proud = keys(p, [[0.55, 0], [0.8, 1]] as const);
        const wristR = add(lerp(mx(WRIST), V_WRIST, raise), [0, -0.03 * pump, 0]);
        const toHip = keys(p, [[0.1, 0], [0.4, 1]] as const);
        const wristL = lerp(WRIST, HIP_WRIST, toHip);
        const armR = reach(ARM_R, wristR, add(mx(ELBOW), scl([-0.15, 0.1, -0.2], raise)));
        const armL = reach(ARM_L, wristL, add(ELBOW, scl([0.22, 0.1, -0.2], toHip)));
        const swordD = norm(lerp(SW_D0, V_DIR, raise));
        const stakeD = norm(lerp(STK_D0, [0.5, -0.25, 0.85], toHip));
        return {
          hips: { move: [0, 0.03 * hop, 0] },
          spine: { rotate: [-3 * proud + 2 * pump, 0, 5 * raise] },
          chest: { rotate: [-6 * proud + 3 * pump - 3 * hop, 0, 3 * raise] },
          neck: { rotate: [-4 * proud, 0, 0] },
          head: { rotate: [-8 * look - 6 * proud, 12 * look, 5 * raise] },
          'upperarm.R': { rotate: armR.upper },
          'forearm.R': { rotate: armR.lower },
          'hand.R': { rotate: swordTurn(armR, swordD) },
          'upperarm.L': { rotate: armL.upper },
          'forearm.L': { rotate: armL.lower },
          'hand.L': { rotate: stakeTurn(armL, stakeD) },
          'leg.L': { rotate: [-6 * hop, 0, 5 * proud] },
          'leg.R': { rotate: [4 * hop, 0, -5 * proud] },
          'foot.L': { rotate: [12 * hop, 0, -5 * proud] },
          'foot.R': { rotate: [12 * hop, 0, 5 * proud] },
        };
      },
    });
  },
});
