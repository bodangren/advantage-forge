import { defineAsset, motion, noise, profile, sdf } from '../src/index.js';

/**
 * Bone golem — Chibi Quest P1 dungeon enemy, about 1 m tall, faces +Z.
 * Target: docs/enemy-mockups/bone-golem_001.jpg (one front view).
 *
 * Base: assets/stone-golem.ts (the same stocky rig, knee bones, and clip set with the two-fist
 *   ground slam; the boulders, moss, and rune are gone, and the arms sit a little closer in).
 * Role: a slow, heavy dungeon construct; at 128 px the big skull with two red glows, the open rib
 *   cage, the shoulder skulls, and the banded club fists must read.
 * One idea: a heap of cream bones lashed together with dark iron: a huge angry skull, an open rib
 *   cage over a dark hollow, bundled long-bone arms with iron bracers and knuckle-bone fists.
 * Proportions: skull top 1.0, eyes 0.8, teeth 0.7, jaw 0.66; ribs 0.63 to 0.39; shoulder skulls
 *   at 0.68 and 0.27 m out; belt plate 0.25 to 0.39; fists 0.14 to 0.38; shin bands 0.1 to 0.18.
 * Palette: cream bone #d6caa0 (slot `bone`); dark iron #48474a (slot `bands`) and rust leather
 *   #7c4631 (follows the bands slot partly); dark hollow #2a1d17; red glow #ff3b1f (slot `glow`)
 *   in dark-red sockets.
 * Bodies: skull (skull and jaw, rigid on the head), shoulders (two skulls, rigid on the chest),
 *   bones (ribs, spine, pelvis, arms, fists, legs, feet), hollow, bands, leather, eyes, pupils.
 * Rig: the stone golem's chibi humanoid. Clips: idle, walk, run, attack (a two-fist ground slam),
 *   attack2 (a shoulder charge and a backhand swipe), roar, hit, death.
 */

const C = {
  bone: '#d6caa0',
  socket: '#221612',
  hollow: '#2a1d17',
  iron: '#48474a',
  leather: '#7c4631',
  glow: '#ff3b1f',
};

type V3 = readonly [number, number, number];
type Rgb = readonly [number, number, number];
type P4 = [number, number, number, number];
type Paint = Parameters<sdf.Shape["paintWhere"]>[1];

const pair = (s: sdf.Shape) => s.mirror('x');
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};
const p4 = (p: V3, r: number): P4 => [p[0], p[1], p[2], r];
const D2R = Math.PI / 180;

// Joints: high, wide shoulders under the shoulder skulls, arms hanging out, a short wide stance.
const SHOULDER: V3 = [0.28, 0.68, -0.03];
const ELBOW: V3 = [0.36, 0.53, 0.01];
const WRIST: V3 = [0.4, 0.4, 0.06];
const FIST: V3 = [0.41, 0.265, 0.085];
const HIP: V3 = [0.13, 0.3, 0];
const KNEE: V3 = [0.16, 0.19, 0.005]; // the knee: splits the leg (shin.L takes the weight below it)
const ANKLE: V3 = [0.18, 0.09, 0.01];
// The ends of the flat bottom of the left foot (y = 0): heel and toe.
const SOLE_HEEL: V3 = [0.18, 0, -0.1];
const SOLE_TOE: V3 = [0.18, 0, 0.15];
const HEAD_O: V3 = [0, 0.84, 0]; // the origin of the big skull (the unit skull is scaled by HEAD_R)
const HEAD_R = 0.165;

/** Turn a shape built around +Y so that its +Y points along `dir`. */
const alongY = (s: sdf.Shape, dir: V3) => {
  let u = norm(dir);
  if (u[1] < 0) u = [-u[0], -u[1], -u[2]];
  return s.rotateX(Math.asin(u[2]) / D2R).rotateZ(Math.atan2(-u[0], u[1]) / D2R);
};

/** A long bone from a to b: a waisted shaft with knobby ends. */
const longBone = (a: V3, b: V3, r: number): sdf.Shape =>
  sdf.chain([p4(a, r * 1.3), p4(lerp(a, b, 0.2), r * 0.95), p4(lerp(a, b, 0.5), r * 0.82), p4(lerp(a, b, 0.8), r * 0.95), p4(b, r * 1.3)], 0.012);

/** A thick ring with rivets, built around +Y at the origin (an iron band around a bone). */
const ring = (r: number, h: number, rivets: number, rz = r): sdf.Shape =>
  sdf.union(
    sdf.cylinder(r, h, h * 0.35).scale([1, 1, rz / r]),
    ...Array.from({ length: rivets }, (_, i) => {
      const a = ((i + 0.5) / rivets) * Math.PI * 2;
      return sdf.sphere(0.0075).at(r * Math.sin(a), 0, rz * Math.cos(a));
    }),
  );

/** Old bone: faint yellow-brown stains over the color underneath. */
const aged = (x: number, y: number, z: number, base: Rgb): Rgb => {
  const n = noise.fbm(x * 16, y * 16, z * 16, 3);
  const f = 1 - 0.1 * Math.max(0, n + 0.1);
  return [base[0] * f, base[1] * f * 0.985, base[2] * f * 0.94];
};
const boneBump = (x: number, y: number, z: number) => 0.0008 * noise.fbm(x * 70, y * 70, z * 70, 2);

// The rib cage: six ribs from the sternum around to the spine, widest in the lower middle,
// drooping at the sides; flatter front to back.
const RIBS = 6;
const CAGE_Z = -0.015;
const ZS = 0.75;
const ribY = (t: number) => 0.625 - 0.215 * t;
const ribRx = (t: number) => 0.1 + 0.075 * Math.sin(Math.PI * (0.1 + 0.65 * t));
/** A point on the rib at `t` (0 top, 1 bottom), `u` from the sternum (0) to the spine (1). */
const ribPoint = (t: number, u: number): P4 => {
  const rx = ribRx(t);
  const a0 = 14 + 16 * t;
  const a = (a0 + (168 - a0) * u) * D2R;
  const y = ribY(t) - 0.045 * Math.sin(a) + 0.03 * u;
  return [rx * Math.sin(a), y, CAGE_Z + rx * ZS * Math.cos(a), 0.0155 * (1 - 0.3 * u)];
};

export default defineAsset({
  name: 'bone-golem',
  description:
    'Chibi bone golem: a hulking construct of cream bones bound with dark iron: a big angry skull with glowing red eyes, smaller skulls on the shoulders, an open rib cage over a dark hollow, bundled long-bone arms with iron bracers and club fists, and short bone legs with banded shins.',
  detail: 0.005,
  reference: 'docs/enemy-mockups/bone-golem_001.jpg',
  // Color slots for individual golems (the first option is the default look).
  variants: {
    bone: { cream: C.bone, ash: '#b9b6ab', aged: '#bd9f63' },
    glow: { red: C.glow, green: '#52e86a', blue: '#3f9dff' },
    bands: { iron: C.iron, rust: '#7e4a2c', bronze: '#8c6a36' },
  },
  presets: {
    ashen: { bone: 'ash', glow: 'blue', bands: 'iron' },
    crypt: { bone: 'aged', glow: 'green', bands: 'rust' },
    ancient: { bone: 'aged', glow: 'red', bands: 'bronze' },
  },

  build(k) {
    // The slot colors (see variants). The rust leather keeps its own hue and follows the bands
    // slot partly.
    const T = {
      bone: k.tint('bone'),
      boneShade: k.tint('bone', -0.3),
      glow: k.tint('glow'),
      glowDark: k.tint('glow', -0.82),
      glowPale: k.tint('glow', 0.6),
      iron: k.tint('bands'),
      leather: k.tint('bands', { color: C.leather, follow: 0.4 }),
    };
    // ------------------------------------------------------------------ skeleton
    k.skeleton({
      hips: { at: [0, 0.3, 0] },
      spine: { parent: 'hips', at: [0, 0.4, 0] },
      chest: { parent: 'spine', at: [0, 0.54, 0] },
      neck: { parent: 'chest', at: [0, 0.72, -0.02] },
      head: { parent: 'neck', at: [0, 0.79, -0.01] },
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

    // ------------------------------------------------------------------ skulls
    /**
     * A skull at unit size (cranium radius 1) facing +Z: cranium, cheekbones, upper teeth, and a
     * jaw; round sockets (angry: slanted tops under a heavy brow), a heart nose, a carved mouth
     * line, and painted gaps between the teeth.
     */
    const unitSkull = (angry: boolean, deep: Paint) => {
      const cranium = sdf.ellipsoid([1.0, 0.86, 0.95]).at(0, 0.12, -0.05);
      const face = sdf.smoothUnion(0.22, cranium, pair(sdf.sphere(0.4).at(0.62, -0.4, 0.4)), sdf.box([0.86, 0.5, 0.62], 0.2).at(0, -0.72, 0.42));
      const fz = (x: number, y: number) => sdf.raycast(face, [x, y, 3], [0, 0, -1])![2];
      const EX = 0.4;
      const EY = -0.3;
      const EZ = fz(EX, EY);
      let socket = sdf.ellipsoid([0.37, 0.34, 0.44]).at(EX, EY, EZ + 0.04);
      let solid = face;
      if (angry) {
        const slant = norm([-0.45, 1, 0]);
        socket = socket.smoothIntersect(0.05, sdf.halfSpace(slant, slant[0] * (EX - 0.25) + slant[1] * (EY + 0.13)));
        const brow = pair(sdf.capsule([EX + 0.32, EY + 0.4, fz(EX + 0.32, EY + 0.4) - 0.1], [EX - 0.32, EY + 0.13, fz(EX - 0.32, EY + 0.13) - 0.07], 0.14));
        solid = solid.smoothUnion(0.1, brow);
      }
      const sockets = pair(socket);
      const nose = pair(sdf.ellipsoid([0.08, 0.15, 0.25]).rotateZ(-22).at(0.07, -0.62, fz(0.07, -0.62) + 0.04));
      const jaw = sdf.smoothUnion(0.1, sdf.box([0.72, 0.3, 0.56], 0.13).at(0, -1.04, 0.38), pair(sdf.capsule([0.5, -1.0, 0.1], [0.62, -0.5, -0.05], 0.12)));
      const mouth = sdf.box([0.66, 0.05, 0.5]).at(0, -0.93, fz(0, -0.8) + 0.08);
      const gap = (x: number, y: number, h: number) => sdf.extrude(profile.rect([0.035, h], 0.01), 1).at(x, y, 0.8);
      const gaps = sdf.union(...[0, 0.18, -0.18, 0.34, -0.34].map((x) => gap(x, -0.845, 0.16)), ...[0.09, -0.09, 0.27, -0.27].map((x) => gap(x, -1.0, 0.13)));
      const shape = solid
        .smoothUnion(0.06, jaw)
        .smoothSubtract(0.04, sockets)
        .smoothSubtract(0.02, nose)
        .smoothSubtract(0.02, mouth)
        .paintWhere(sockets.round(0.12), T.boneShade, 0.1)
        .paintWhere(sockets.round(0.02), deep, 0.03)
        .paintWhere(nose.round(0.03), C.socket, 0.02)
        .paintWhere(mouth.round(0.012), C.socket, 0.015)
        .paintWhere(gaps, C.socket, 0.012);
      return { shape, eye: [EX, EY, EZ] as V3 };
    };

    const head = unitSkull(true, T.glowDark);
    k.body('skull', head.shape.scale(HEAD_R).at(...HEAD_O).paintFn(aged), { color: T.bone, roughness: 0.55, bone: 'head', detail: 0.004, textureDensity: 2, bump: boneBump });

    // Glowing eyes deep in the sockets (emissive on a dark base), a hot pupil in front of each.
    const toHead = (p: V3): V3 => add(HEAD_O, [p[0] * HEAD_R, p[1] * HEAD_R, p[2] * HEAD_R]);
    const glowAt = (s: 1 | -1, dz: number) => toHead([s * (head.eye[0] - 0.02), head.eye[1] - 0.05, head.eye[2] + dz]);
    const eyes = sdf.union(sdf.sphere(0.2 * HEAD_R).at(...glowAt(1, -0.3)), sdf.sphere(0.2 * HEAD_R).at(...glowAt(-1, -0.3)));
    k.body('eyes', eyes, { color: T.glowDark, emissive: T.glow, emissiveIntensity: 0.45, roughness: 0.3, bone: 'head', detail: 0.004 });
    const pupils = sdf.union(sdf.sphere(0.075 * HEAD_R).at(...glowAt(1, -0.13)), sdf.sphere(0.075 * HEAD_R).at(...glowAt(-1, -0.13)));
    k.body('pupils', pupils, { color: T.glow, emissive: T.glowPale, emissiveIntensity: 2.6, roughness: 0.2, bone: 'head', detail: 0.003 });

    // Smaller skulls on the shoulders, looking out and down, their jaws hanging beside the arms.
    const shoulderL = unitSkull(false, C.socket).shape.scale(0.105).rotateY(30).rotateZ(-12).at(0.295, 0.68, 0.0);
    k.body('shoulders', pair(shoulderL).paintFn(aged), { color: T.bone, roughness: 0.55, bone: 'chest', detail: 0.004, textureDensity: 1.5, bump: boneBump });

    // ------------------------------------------------------------------ bones: cage, spine, pelvis, limbs
    const cage = pair(sdf.union(...Array.from({ length: RIBS }, (_, i) => sdf.chain(Array.from({ length: 11 }, (_, j) => ribPoint(i / (RIBS - 1), j / 10)), 0.004))));
    // The sternum: one flat segment at the front end of each rib, a wide top, a point below.
    const sternum = sdf.smoothUnion(
      0.012,
      ...Array.from({ length: RIBS }, (_, i) => {
        const p = ribPoint(i / (RIBS - 1), 0);
        return sdf.ellipsoid([0.026, 0.024, 0.013]).at(0, p[1], p[2] - 0.004);
      }),
      sdf.ellipsoid([0.038, 0.028, 0.015]).at(0, ribY(0) + 0.012, ribPoint(0, 0)[2] - 0.006),
      sdf.ellipsoid([0.013, 0.03, 0.01]).at(0, ribPoint(1, 0)[1] - 0.035, ribPoint(1, 0)[2] - 0.006),
    );
    const scapulae = pair(sdf.extrude(profile.polygon([[-0.06, 0.09], [0.08, 0.08], [-0.01, -0.1]], { smooth: false }), 0.016, 0.006).rotateY(-30).at(0.13, 0.535, -0.14));
    const spineZ = (y: number) => -0.135 + (y - 0.4) * 0.1;
    const vertebra = (y: number) =>
      sdf.union(sdf.cylinder(0.03, 0.024, 0.009).at(0, y, spineZ(y)), sdf.box([0.018, 0.022, 0.05], 0.007).rotateX(-15).at(0, y - 0.004, spineZ(y) - 0.03));
    const backbone = sdf.capsule([0, 0.35, spineZ(0.35)], [0, 0.66, spineZ(0.66)], 0.02);
    const spineUpper = sdf.union(backbone.intersect(sdf.box([0.2, 0.25, 0.4]).at(0, 0.575, 0)), ...[0.47, 0.51, 0.55, 0.59, 0.63].map(vertebra));
    const spineLower = sdf.union(backbone.intersect(sdf.box([0.2, 0.12, 0.4]).at(0, 0.39, 0)), ...[0.35, 0.39, 0.43].map(vertebra));
    const neckBones = sdf.union(sdf.capsule([0, 0.64, -0.11], [0, 0.76, -0.04], 0.026), ...[0.68, 0.72].map((y) => sdf.cylinder(0.034, 0.02, 0.008).rotateX(-30).at(0, y, -0.11 + (y - 0.64) * 0.58)));
    const pelvis = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.12, 0.06, 0.09]).at(0, 0.315, -0.02),
      pair(sdf.ellipsoid([0.075, 0.07, 0.035]).rotateY(-30).at(0.1, 0.35, -0.05)),
      pair(sdf.sphere(0.05).at(...HIP)),
    );

    // Arms: a thick humerus bundled with two thinner long bones, two forearm bones, and a club
    // fist of knuckle bones.
    const fistLocal = () => {
      const fingers = [-0.057, -0.019, 0.019, 0.057].map((z, i) => {
        const s = 1 - 0.06 * Math.abs(i - 1.5);
        return sdf.union(
          sdf.chain([[0.025, -0.01, z, 0.027 * s], [0.018, -0.07, z, 0.027 * s], [-0.028, -0.085, z, 0.024 * s], [-0.052, -0.05, z, 0.021 * s]], 0.008),
          sdf.sphere(0.03 * s).at(0.022, -0.062, z), // the big knuckle
        );
      });
      const thumb = sdf.chain([[-0.035, 0.035, 0.055, 0.028], [-0.058, -0.01, 0.08, 0.025], [-0.05, -0.05, 0.078, 0.021]], 0.008);
      return sdf.smoothUnion(0.012, sdf.ellipsoid([0.065, 0.075, 0.08]).at(0, 0.03, 0), ...fingers, thumb);
    };
    const armL = sdf.union(
      longBone(SHOULDER, ELBOW, 0.052).bone('upperarm.L'),
      longBone(add(lerp(SHOULDER, ELBOW, 0.5), [0.005, 0, 0.042]), add(ELBOW, [0.005, 0.025, 0.04]), 0.026).bone('upperarm.L'),
      longBone(add(lerp(SHOULDER, ELBOW, 0.5), [-0.005, 0, -0.042]), add(ELBOW, [-0.01, 0.025, -0.04]), 0.026).bone('upperarm.L'),
      sdf.sphere(0.042).at(...add(ELBOW, [0.01, 0, -0.035])).bone('forearm.L'), // the elbow point
      longBone(add(ELBOW, [0, 0, 0.022]), add(WRIST, [0, 0, 0.022]), 0.032).bone('forearm.L'),
      longBone(add(ELBOW, [0.005, 0, -0.022]), add(WRIST, [0.005, 0, -0.022]), 0.028).bone('forearm.L'),
      sdf.capsule(WRIST, add(FIST, [0, 0.07, 0]), 0.04).bone('hand.L'),
      fistLocal().scale(1.25).rotateY(-12).at(...FIST).bone('hand.L'),
    );

    // Legs: a lumpy femur, a kneecap, a shin bone, and a blocky foot with three big toes.
    const toes = sdf.union(
      ...[-0.05, 0, 0.05].map((dx, i) => {
        const x = ANKLE[0] + dx;
        const len = i === 1 ? 0.155 : 0.14;
        return sdf.chain([[x, 0.05, 0.02, 0.03], [x + dx * 0.15, 0.04, len - 0.04, 0.028], [x + dx * 0.25, 0.032, len, 0.027]], 0.01);
      }),
    );
    const footL = sdf
      .smoothUnion(0.02, sdf.ellipsoid([0.08, 0.06, 0.1]).at(ANKLE[0], 0.06, 0), sdf.sphere(0.045).at(ANKLE[0], 0.045, -0.06), toes)
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const legL = sdf.union(
      sdf.smoothUnion(
        0.02,
        longBone(add(HIP, [0, 0.02, 0]), add(KNEE, [0, 0.01, 0]), 0.058).bone('leg.L'),
        sdf.sphere(0.035).at(KNEE[0], KNEE[1] + 0.005, KNEE[2] + 0.055).bone('shin.L'), // the kneecap
        longBone(KNEE, ANKLE, 0.04).bone('shin.L'),
      ),
      footL.bone('foot.L'),
    );

    const bones = sdf.union(
      cage.bone('chest'),
      sternum.bone('chest'),
      scapulae.bone('chest'),
      spineUpper.bone('chest'),
      spineLower.bone('spine'),
      neckBones.bone('neck'),
      pelvis.bone('hips'),
      pair(armL),
      pair(legL),
    );
    k.body('bones', bones.paintFn(aged), { color: T.bone, roughness: 0.55, textureDensity: 1.3, bump: boneBump });

    // ------------------------------------------------------------------ the dark hollow inside the ribs
    const hollowProfile = profile.polygon(
      [
        [0, 0.385],
        [0.11, 0.39],
        ...Array.from({ length: RIBS }, (_, i) => [ribRx(i / (RIBS - 1)) - 0.02, ribY(i / (RIBS - 1)) - 0.024] as [number, number]).reverse(),
        [0.08, 0.64],
        [0, 0.645],
      ],
      { smooth: true },
    );
    const hollow = sdf.revolve(hollowProfile).scale([1, 1, ZS]).at(0, 0, CAGE_Z);
    k.body('hollow', hollow, { color: C.hollow, roughness: 0.9, bone: 'chest', detail: 0.007 });

    // ------------------------------------------------------------------ leather: belt plate and side straps
    const WAIST = sdf.ellipsoid([0.165, 0.5, 0.13]).at(0, 0.33, 0);
    const plateOutline = profile.polygon([[-0.14, 0.395], [0.14, 0.395], [0.125, 0.31], [0.075, 0.25], [-0.075, 0.25], [-0.125, 0.31]]);
    const plateBase = WAIST.round(0.03).subtract(WAIST.round(0.008)).intersect(sdf.extrude(plateOutline, 0.4, 0.008).at(0, 0, 0.2));
    const PLATE_Y = 0.318;
    const plateZ = sdf.raycast(plateBase, [0, PLATE_Y, 1], [0, 0, -1])![2];
    const emblem = sdf.union(
      sdf.torus(0.042, 0.008).rotateX(90).at(0, PLATE_Y, plateZ - 0.002),
      sdf.torus(0.022, 0.006).rotateX(90).at(0, PLATE_Y, plateZ - 0.001),
      sdf.sphere(0.014).at(0, PLATE_Y, plateZ - 0.004),
    );
    const plate = plateBase.union(emblem).bone('hips');
    const straps = pair(
      hollow.round(0.042).subtract(hollow.round(0.03)).intersect(sdf.box([0.034, 0.2, 0.3]).rotateZ(-14).at(0.158, 0.575, 0.1)),
    ).bone('chest');
    const leather = sdf.union(plate, straps).paintFn((x, y, z, base) => {
      const n = 1 + 0.12 * noise.fbm(x * 30, y * 30, z * 30, 2);
      return [base[0] * n, base[1] * n, base[2] * n];
    });
    k.body('leather', leather, { color: T.leather, roughness: 0.7 });

    // ------------------------------------------------------------------ bands: iron bracers, weights, waist ring, shin rings
    const e2w = sub(WRIST, ELBOW);
    const bracerL = sdf
      .union(...([[0.36, 0.076], [0.6, 0.082], [0.84, 0.078]] as const).map(([t, r]) => alongY(ring(r, 0.036, 5), e2w).at(...lerp(ELBOW, WRIST, t))))
      .bone('forearm.L');
    const weightL = sdf
      .box([0.09, 0.13, 0.13], 0.03)
      .displace(0.004, (x, y, z) => noise.fbm(x * 20, y * 20, z * 20, 2))
      .union(sdf.sphere(0.011).at(0.043, 0.01, 0))
      .rotateZ(-10)
      .at(0.485, 0.36, 0.075)
      .bone('hand.L');
    const k2a = sub(ANKLE, KNEE);
    const shinBandsL = sdf.union(alongY(ring(0.072, 0.04, 5), k2a).at(...lerp(KNEE, ANKLE, 0.28)), alongY(ring(0.07, 0.04, 5), k2a).at(...lerp(KNEE, ANKLE, 0.72))).bone('shin.L');
    const waistRing = sdf
      .union(
        WAIST.round(0.014).smoothIntersect(0.006, sdf.box([0.6, 0.032, 0.6]).at(0, 0.395, 0)),
        ...Array.from({ length: 10 }, (_, i) => {
          const a = ((i + 0.5) / 10) * Math.PI * 2;
          return sdf.sphere(0.008).at(0.179 * Math.sin(a), 0.395, 0.144 * Math.cos(a));
        }),
        pair(sdf.sphere(0.009).at(0.1, 0.352, sdf.raycast(plateBase, [0.1, 0.352, 1], [0, 0, -1])![2])),
      )
      .bone('hips');
    const bands = sdf.union(pair(sdf.union(bracerL, weightL, shinBandsL)), waistRing);
    k.body('bands', bands, { color: T.iron, roughness: 0.45, metalness: 0.65, detail: 0.0045 });

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop, keys } = motion;
    const LEG = HIP[1] - ANKLE[1];
    const DEG = Math.PI / 180;
    const deg = (r: number) => r / DEG;
    // A damped shake after `at`, with `n` swings in `len` of the clip.
    const shake = (p: number, at: number, len: number, n: number) =>
      p < at ? 0 : Math.exp((-(p - at) / len) * 3) * Math.sin(((p - at) / len) * Math.PI * n);

    k.animation('idle', {
      duration: 2.8,
      pose: (_t, p) => ({
        hips: { move: [0, -0.004 * bump(p), 0] },
        chest: { rotate: [2 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        head: { rotate: [0, 10 * wave(p, 1, 0.25), 0] },
        'upperarm.L': { rotate: [2 * wave(p, 1, 0.1), 0, 3 * bump(p)] },
        'upperarm.R': { rotate: [2 * wave(p, 1, 0.1), 0, -3 * bump(p)] },
        'forearm.L': { rotate: [-4 * bump(p), 0, 0] },
        'forearm.R': { rotate: [-4 * bump(p, 1, 0.3), 0, 0] },
      }),
    });

    // A heavy, rolling walk: the weight shifts from side to side at each step, the fists swing.
    // The legs come from motion.gait (planted stance feet, a knee lift in the swing, heel strike and
    // toe-off); the gait phase runs a quarter cycle behind the clip.
    const stride = (duration: number, step: number, footLift: number, duty: number, bob: number, armSwing: number, lean: number, sway: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        const hipsTurn = [0, 5 * s, sway * s] as const;
        const legs = motion.gait(p - 0.25, { hip: HIP, knee: KNEE, ankle: ANKLE }, {
          stride: step,
          lift: footLift,
          duty,
          bob,
          roll: 8,
          heel: SOLE_HEEL,
          toe: SOLE_TOE,
          hips: { at: [0, 0.3, 0], rotate: hipsTurn },
        });
        return {
          ...legs.pose,
          hips: { move: [0, legs.hipsY, 0] as const, rotate: hipsTurn },
          spine: { rotate: [lean, 0, -sway * 0.6 * s] as const },
          chest: { rotate: [lean * 0.5, -8 * s, 0] as const },
          head: { rotate: [-lean, 5 * s, 0] as const },
          'upperarm.L': { rotate: [armSwing * s, 0, 4] as const },
          'upperarm.R': { rotate: [-armSwing * s, 0, -4] as const },
          'forearm.L': { rotate: [-armSwing * 0.3 - armSwing * 0.3 * Math.max(0, -s), 0, 0] as const },
          'forearm.R': { rotate: [-armSwing * 0.3 - armSwing * 0.3 * Math.max(0, s), 0, 0] as const },
        };
      },
    });
    k.animation('walk', stride(1.1, 0.12, 0.03, 0.62, 0.01, 16, 4, 4));
    k.animation('run', stride(0.7, 0.17, 0.05, 0.45, 0.025, 28, 10, 3));

    // ------------------------------------------------------------------ attack: a two-fist ground slam
    // Both fists swing up and back over the head while the golem rises and leans back; then the
    // trunk folds forward, the knees bend, and both fists drive down into the floor in front of
    // the feet (outside them). An impact shake, a hold, and a slow recovery.
    k.animation('attack', {
      duration: 1.3,
      loop: false,
      pose: (_t, p) => {
        const sh = shake(p, 0.52, 0.2, 5);
        const armX = keys(p, [[0, 0], [0.3, -150], [0.4, -158], [0.5, -70], [0.53, -64], [0.74, -64], [1, 0]] as const, 'smooth');
        const foreX = keys(p, [[0, 0], [0.3, -50], [0.4, -58], [0.5, -8], [0.74, -8], [1, 0]] as const, 'smooth');
        const handX = keys(p, [[0, 0], [0.3, -15], [0.4, -15], [0.5, 12], [0.74, 12], [1, 0]] as const, 'smooth');
        const spineX = keys(p, [[0, 0], [0.3, -6], [0.4, -8], [0.5, 20], [0.53, 22], [0.74, 20], [1, 0]] as const, 'smooth');
        const chestX = keys(p, [[0, 0], [0.3, -10], [0.4, -12], [0.5, 26], [0.53, 28], [0.74, 25], [1, 0]] as const, 'smooth') + 2 * sh;
        const c = keys(p, [[0, 0], [0.16, 0.35], [0.32, 0.05], [0.42, 0], [0.52, 1], [0.74, 0.95], [1, 0]] as const, 'smooth');
        return {
          hips: { move: [0, -0.05 * c - 0.004 * sh, -0.02 * c] },
          spine: { rotate: [spineX, 0, 0] },
          chest: { rotate: [chestX, 0, 0] },
          head: { rotate: [-(spineX + chestX) * 0.55 - 3 * sh, 0, 0] },
          'upperarm.L': { rotate: [armX, 0, 0] },
          'upperarm.R': { rotate: [armX, 0, 0] },
          'forearm.L': { rotate: [foreX, 0, 0] },
          'forearm.R': { rotate: [foreX, 0, 0] },
          'hand.L': { rotate: [handX, 0, 0] },
          'hand.R': { rotate: [handX, 0, 0] },
          'leg.L': { rotate: [-45 * c, 0, 0] },
          'shin.L': { rotate: [80 * c, 0, 0] },
          'foot.L': { rotate: [-35 * c, 0, 0] },
          'leg.R': { rotate: [-45 * c, 0, 0] },
          'shin.R': { rotate: [80 * c, 0, 0] },
          'foot.R': { rotate: [-35 * c, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ attack2: a shoulder charge, then a backhand swipe
    // Plan: the golem sinks into a wide stance (the left foot steps back) and turns the right
    // boulder shoulder at the target; two heavy steps carry it forward into the ram, a short hold
    // with a shake. Then the body unwinds and the right fist swings backhand across the front and
    // out to the right. Two steps back to rest. A planted foot keeps its world position.
    const ease = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    type Step = readonly [number, number, number, number]; // phase start, phase end, from z, to z
    const footAt = (steps: readonly Step[], p: number) => {
      let z = 0;
      let lift = 0;
      for (const [a, b, from, to] of steps) {
        if (p >= a) z = from + (to - from) * ease(a, b, p);
        if (p > a && p < b) lift = 0.03 * Math.sin(((p - a) / (b - a)) * Math.PI);
      }
      return { z, lift };
    };
    const legTo = (footZ: number, hipsZ: number, hipsY: number, side: 1 | -1) => {
      const hipZ = hipsZ - side * HIP[0] * Math.sin(hipsY * DEG);
      const a = Math.asin(Math.max(-0.95, Math.min(0.95, (hipZ - footZ) / LEG)));
      return { rot: deg(a), drop: LEG * (1 - Math.cos(a)) };
    };
    const STEPS_L: readonly Step[] = [[0.02, 0.13, 0, -0.18], [0.16, 0.26, -0.18, 0.1], [0.85, 0.95, 0.1, 0]];
    const STEPS_R: readonly Step[] = [[0.26, 0.36, 0, 0.24], [0.72, 0.83, 0.24, 0]];

    k.animation('attack2', {
      duration: 1.2,
      loop: false,
      pose: (_t, p) => {
        const sh = shake(p, 0.36, 0.1, 5);
        const hipsY = keys(p, [[0, 0], [0.15, 14], [0.45, 14], [0.48, 15], [0.66, -10], [0.72, -10], [0.9, 0]] as const);
        const spineY = keys(p, [[0, 0], [0.15, 12], [0.45, 12], [0.48, 13], [0.66, -10], [0.72, -10], [0.92, 0]] as const);
        const chestY = keys(p, [[0, 0], [0.15, 18], [0.36, 20], [0.45, 20], [0.48, 24], [0.66, -16], [0.72, -16], [0.95, 0]] as const);
        const turn = hipsY + spineY + chestY;
        const lean = keys(p, [[0, 0], [0.15, 12], [0.26, 13], [0.36, 18], [0.45, 16], [0.48, 12], [0.66, 6], [0.72, 6], [0.95, 0]] as const);
        const dip = keys(p, [[0, 0], [0.15, -4], [0.36, -8], [0.45, -7], [0.6, 0]] as const); // the ramming shoulder drops
        const fL = footAt(STEPS_L, p);
        const fR = footAt(STEPS_R, p);
        const hipsZ = (fL.z + fR.z) / 2 + keys(p, [[0, 0], [0.3, 0], [0.36, 0.02], [0.45, 0.015], [0.6, 0.02], [0.72, 0]] as const);
        const legL = legTo(fL.z, hipsZ, hipsY, 1);
        const legR = legTo(fR.z, hipsZ, hipsY, -1);
        // The right fist: tucked in front of the belly in the charge, cocked across, then a
        // backhand swing out to the right at chest height.
        const rX = keys(p, [[0, 0], [0.15, -35], [0.45, -35], [0.49, -50], [0.58, -80], [0.66, -72], [0.72, -60], [0.9, -20], [1, 0]] as const, 'smooth');
        const rZ = keys(p, [[0, 0], [0.15, 12], [0.45, 12], [0.49, 28], [0.58, -10], [0.66, -45], [0.72, -45], [0.9, -10], [1, 0]] as const, 'smooth');
        const rFore = keys(p, [[0, 0], [0.15, -55], [0.45, -55], [0.49, -60], [0.58, -15], [0.66, -10], [0.72, -10], [0.9, -20], [1, 0]] as const, 'smooth');
        // The off arm braces forward, pulls back to drive the charge, and swings out in the swipe.
        const lX = keys(p, [[0, 0], [0.15, -30], [0.3, 15], [0.45, 15], [0.6, -20], [0.72, -20], [1, 0]] as const, 'smooth');
        const lZ = keys(p, [[0, 0], [0.15, 8], [0.45, 8], [0.6, 22], [0.72, 22], [1, 0]] as const, 'smooth');
        const h = hipsY * DEG;
        return {
          hips: { move: [0, -Math.min(legL.drop + fL.lift, legR.drop + fR.lift), hipsZ], rotate: [0, hipsY, 0] },
          spine: { rotate: [lean * Math.cos(h), spineY, lean * Math.sin(h)] },
          chest: { rotate: [3 * sh, chestY, dip + 2 * sh] },
          head: { rotate: [-lean * 0.6 - 3 * sh, -turn * 0.5, 0] },
          'upperarm.R': { rotate: [rX, 0, rZ] },
          'forearm.R': { rotate: [rFore, 0, 0] },
          'upperarm.L': { rotate: [lX, 0, lZ] },
          'forearm.L': { rotate: [-20 * ease(0, 0.15, p) * (1 - ease(0.8, 1, p)), 0, 0] },
          'leg.L': { rotate: [legL.rot, -hipsY, 0], move: [0, fL.lift, 0] },
          'leg.R': { rotate: [legR.rot, -hipsY, 0], move: [0, fR.lift, 0] },
          'foot.L': { rotate: [-legL.rot, 0, 0] },
          'foot.R': { rotate: [-legR.rot, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ roar: both fists raised, the stones tremble
    k.animation('roar', {
      duration: 1.8,
      loop: false,
      pose: (_t, p) => {
        const rise = keys(p, [[0, 0], [0.16, -0.5], [0.3, 1], [0.8, 1], [1, 0]] as const);
        const lift = Math.max(0, rise);
        const crouch = Math.max(0, -rise);
        // Seven quick trembles while it roars (odd, so the strip does not freeze on them).
        const tremble = p > 0.3 && p < 0.82 ? wave((p - 0.3) / 0.52, 7) * Math.sin(((p - 0.3) / 0.52) * Math.PI) : 0;
        return {
          hips: { move: [0, -0.025 * crouch - 0.003 * Math.abs(tremble), 0] },
          spine: { rotate: [10 * crouch - 6 * lift, 0, 0] },
          chest: { rotate: [8 * crouch - 10 * lift + 1.5 * tremble, 2 * tremble, 0] },
          neck: { rotate: [6 * crouch - 6 * lift, 0, 0] },
          head: { rotate: [8 * crouch - 12 * lift + 2 * tremble, 3 * tremble, 0] },
          'upperarm.L': { rotate: [-25 * lift + 10 * crouch, 0, 65 * lift] },
          'upperarm.R': { rotate: [-25 * lift + 10 * crouch, 0, -65 * lift] },
          'forearm.L': { rotate: [-55 * lift - 20 * crouch, 0, 0] },
          'forearm.R': { rotate: [-55 * lift - 20 * crouch, 0, 0] },
          'leg.L': { rotate: [0, 0, 4 * lift] },
          'leg.R': { rotate: [0, 0, -4 * lift] },
        };
      },
    });

    // ------------------------------------------------------------------ hit: snap back from a blow, a step back, recover
    k.animation('hit', {
      duration: 0.45,
      loop: false,
      pose: (_t, p) => {
        const r = keys(p, [[0, 0], [0.16, 1], [0.38, 0.8], [1, 0]] as const);
        const back = -0.025 * r;
        const legL = deg(Math.atan2(back, LEG));
        return {
          hips: { move: [0, -legDrop(LEG, 12 * r), back], rotate: [0, 5 * r, 0] },
          spine: { rotate: [-8 * r, 0, 3 * r] },
          chest: { rotate: [-9 * r, 7 * r, 0] },
          neck: { rotate: [-5 * r, 0, 0] },
          head: { rotate: [-14 * r, -9 * r, 6 * r] },
          'upperarm.L': { rotate: [12 * r, 0, 24 * r] },
          'forearm.L': { rotate: [-22 * r, 0, 0] },
          'upperarm.R': { rotate: [10 * r, 0, -18 * r] },
          'forearm.R': { rotate: [-12 * r, 0, 0] },
          'leg.L': { rotate: [legL, 0, 0] },
          'foot.L': { rotate: [-legL, 0, 0] },
          'leg.R': { rotate: [12 * r, 0, 0] }, // a small step back
          'foot.R': { rotate: [-12 * r, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ death: stagger back, topple, lie on the back
    k.animation('death', {
      duration: 1.5,
      loop: false,
      pose: (_t, p) => {
        const fall = keys(p, [[0, 0], [0.2, -8], [0.4, 3], [0.54, -40], [0.66, -88], [0.72, -84], [0.8, -88], [1, -88]] as const);
        const hipsY = keys(p, [[0, 0], [0.4, 0], [0.54, -0.01], [0.66, -0.1], [0.72, -0.085], [0.8, -0.1], [1, -0.1]] as const);
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
          'leg.L': { rotate: [legs + keys(p, [[0, 0], [0.2, -6], [0.4, 0]] as const), 0, 6 * spill] },
          'leg.R': { rotate: [legs + stepR, 0, -8 * spill] },
          'foot.L': { rotate: [-keys(p, [[0, 0], [0.4, 0], [0.66, 12], [1, 12]] as const), 0, 0] },
          'foot.R': { rotate: [-stepR * 0.8, 0, 0] },
        };
      },
    });
  },
});
