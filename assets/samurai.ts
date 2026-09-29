import { defineAsset, mixRgb, motion, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Samurai — Chibi Quest hero (catalog `heroes/martial/samurai`), about 0.95 m to the top of the
 * helmet crest, faces +Z. Target: docs/hero-mockups/samurai_001.jpg (one front view; side and back
 * are designed here; the mockup's beard is skipped: every hero on this set is beardless). Built on
 * the paladin (the knight's body, face, and skeleton), so the heroes read as a set.
 *
 * Role: player hero, seen in 3D and as a 128 px sprite, so the crest, the face, and the red cuirass
 * must read.
 * One idea: a red lacquered kabuto with a huge gold crescent crest and a black topknot over the same
 *   young face, a red scale cuirass and red guards over dark blue sleeves and wide hakama, a katana in
 *   the right hand held low, a short wakizashi at the left hip under the left hand.
 * Proportions: crest tips 0.95, eyes 0.63, chin 0.48, shoulders 0.44 (sode), sash 0.25, hakama hem
 *   0.09; the helmet wings reach 0.28 to each side.
 * Palette (60/30/10): lacquer red #b8332a with #7d1f18 (dominant); indigo #2f3f66 with #1f2a47 (mid);
 *   gold #e0b040 (crest, fins, sword fittings only). Skin #f2c7a4, hair #1a1714, steel #c3c8cf,
 *   grip wrap #2a2320, sandal straps #6e3f28.
 * Value plan: the red helmet and cuirass and the pale face are the focal masses; the dark blue
 *   sleeves and hakama frame them; gold is only the crest, the fins, and the sword fittings.
 * Bodies: skin, hair, helmet, helmet-trim, kabuto-gold, kimono, sleeves, cuirass, sode,
 *   sode-trim, bracers, hands, sash, kusazuri, hakama, sandals, straps, katana, katana-gold,
 *   katana-grip, wakizashi, wakizashi-gold.
 * Rig: the knight's skeleton; the `plume` bone sways the topknot. The katana is rigid on the right
 *   hand, the wakizashi rigid on the spine. Clips: idle, walk, run, attack (a horizontal katana slash
 *   from right to left), attack2 (an overhead two-handed cut), hit, death (he falls on his back),
 *   victory (the katana upright beside the head).
 */

const C = {
  skin: '#f2c7a4',
  blush: '#f09a86',
  eyeWhite: '#f6f1ea',
  irisRim: '#10202c',
  iris: '#5a3720',
  irisLow: '#8a5a3a',
  pupil: '#0d1114',
  lid: '#16100c',
  brow: '#2a2320',
  mouth: '#a4503f',
  hair: '#1a1714',
  hairDark: '#2e2824',
  red: '#b8332a',
  redDark: '#7d1f18',
  indigo: '#2f3f66',
  indigoDark: '#1f2a47',
  gold: '#e0b040',
  steel: '#c3c8cf',
  grip: '#2a2320',
  gripLight: '#4a3f38',
  strap: '#6e3f28',
  sole: '#3a2a24',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.105, 0.628] as const; // x (each side), y
const pair = (s: sdf.Shape) => s.mirror('x');
const hard = (s: sdf.Shape) => s.mirror('x', 0);

// Joints. The right forearm carries the katana low, the left forearm rests on the wakizashi hilt.
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW_R: V3 = [-0.19, 0.335, -0.005];
const WRIST_R: V3 = [-0.215, 0.3, 0.1];
const ELBOW_L: V3 = [0.175, 0.335, 0];
const WRIST_L: V3 = [0.2, 0.29, 0.085];
const HIP: V3 = [0.068, 0.195, 0];
const ANKLE: V3 = [0.098, 0.07, 0];
const KNEE: V3 = [0.083, 0.1325, 0]; // the knee: splits the leg (shin.L takes the weight below it)
const HEEL: V3 = [0.096, 0, -0.008];
const TOE: V3 = [0.117, 0, 0.09];
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

const rad = Math.PI / 180;
const rotX = (p: V3, d: number): V3 => {
  const c = Math.cos(d * rad);
  const s = Math.sin(d * rad);
  return [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c];
};
const rotZ = (p: V3, d: number): V3 => {
  const c = Math.cos(d * rad);
  const s = Math.sin(d * rad);
  return [p[0] * c - p[1] * s, p[0] * s + p[1] * c, p[2]];
};
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};

/** A fist hanging from the wrist at the origin: palm, a finger roll at the front, a thumb. */
const fistLocal = (s: 1 | -1) =>
  sdf.smoothUnion(
    0.018,
    sdf.ellipsoid([0.04, 0.045, 0.046]).at(0.007 * s, -0.04, 0.004),
    sdf.capsule([-0.009 * s, -0.061, 0.031], [-0.005 * s, -0.04, 0.044], 0.018),
    sdf.cone([0.021 * s, -0.024, 0.026], [0.001 * s, -0.035, 0.05], 0.017, 0.0135),
  );
const HAND_R = { pitch: -70, roll: -30 };
const HAND_L = { pitch: -62, roll: 26 };
const handPose = (h: { pitch: number; roll: number }, w: V3) => (s: sdf.Shape) => s.rotateX(h.pitch).rotateZ(h.roll).at(...w);
const handPoint = (h: { pitch: number; roll: number }, w: V3, p: V3) => add(rotZ(rotX(p, h.pitch), h.roll), w);

// The katana at rest: the blade points back, out, and down. Its local frame has the grip center at
// the origin, the blade toward -Y, the flat facing +Z; the pose turns local -Y onto KDIR.
const KDIR = norm([-0.45, -0.42, -0.78]);
const KA = Math.asin(-KDIR[2]) / rad; // rotateX
const KB = Math.atan2(KDIR[0], -KDIR[1]) / rad; // rotateZ
const KFLAT = rotZ(rotX([0, 0, 1], KA), KB); // the flat's normal at rest

/** Lacquered scale rows for the cuirass and the guards (normal map only). */
const scales = (x: number, y: number, z: number) => {
  const s = 0.024;
  const row = Math.floor(y / s);
  const arcLen = Math.atan2(x, z) * 0.13;
  const u = (arcLen + (row & 1) * (s / 2)) / s;
  const fx = u - Math.floor(u) - 0.5;
  const fy = y / s - row;
  const d = Math.hypot(fx * 1.1, (fy - 0.25) * 0.9);
  return 0.0016 * Math.max(0, 1 - d * 1.5);
};

export default defineAsset({
  name: 'samurai',
  description: 'Chibi samurai hero with a red kabuto and gold crescent crest, a red scale cuirass, indigo hakama, a katana, and a wakizashi.',
  detail: 0.005,
  reference: 'docs/hero-mockups/samurai_001.jpg',
  // Color slots for individual samurai (the first option is the default look). The armor slot is
  // all the lacquer: helmet, cuirass, guards, bracers, sash, sandals. The gold, the indigo cloth,
  // and the steel keep their colors.
  variants: {
    eyes: { brown: C.iris, black: '#241a18', green: '#3d7a45' },
    hair: { black: C.hair, brown: '#4a2e1c', auburn: '#8e3b1c' },
    skin: { fair: C.skin, tan: '#d49a72', brown: '#8a5a3e' },
    armor: { red: C.red, black: '#2a2222', green: '#2f5a3a', indigo: '#2f3f66' },
  },
  presets: {
    crimson: { eyes: 'brown', hair: 'black', skin: 'fair', armor: 'red' },
    ronin: { eyes: 'black', hair: 'black', skin: 'tan', armor: 'black' },
    ranger: { eyes: 'green', hair: 'brown', skin: 'tan', armor: 'green' },
    daimyo: { eyes: 'brown', hair: 'auburn', skin: 'fair', armor: 'indigo' },
  },

  build(k) {
    const T = {
      iris: k.tint('eyes'),
      irisLow: k.tint('eyes', { color: C.irisLow, follow: 1 }),
      hair: k.tint('hair'),
      hairDark: k.tint('hair', { color: C.hairDark, follow: 1 }),
      brow: k.tint('hair', { color: C.brow, follow: 1 }),
      skin: k.tint('skin'),
      blush: k.tint('skin', { color: C.blush, follow: 0.5 }),
      mouth: k.tint('skin', { color: C.mouth, follow: 0.5 }),
      armor: k.tint('armor'),
      armorDark: k.tint('armor', { color: C.redDark, follow: 1 }),
      armorRow: k.tint('armor', { color: '#8f2620', follow: 1 }),
    };
    // ------------------------------------------------------------------ skeleton
    const PLUME_AT: V3 = [0.0, 0.9, -0.03]; // the root of the topknot
    k.skeleton({
      hips: { at: [0, 0.2, 0] },
      spine: { parent: 'hips', at: [0, 0.26, 0] },
      chest: { parent: 'spine', at: [0, 0.33, 0] },
      neck: { parent: 'chest', at: [0, 0.43, -0.01] },
      head: { parent: 'neck', at: [0, 0.48, -0.01] },
      plume: { parent: 'head', at: PLUME_AT, tail: [0, 0.96, -0.03] },
      'upperarm.L': { parent: 'chest', at: SHOULDER },
      'forearm.L': { parent: 'upperarm.L', at: ELBOW_L },
      'hand.L': { parent: 'forearm.L', at: WRIST_L },
      'upperarm.R': { parent: 'chest', at: mx(SHOULDER) },
      'forearm.R': { parent: 'upperarm.R', at: ELBOW_R },
      'hand.R': { parent: 'forearm.R', at: WRIST_R },
      'leg.L': { parent: 'hips', at: HIP },
      'shin.L': { parent: 'leg.L', at: KNEE, split: 0.015 },
      'foot.L': { parent: 'shin.L', at: ANKLE },
      'leg.R': { parent: 'hips', at: mx(HIP) },
      'shin.R': { parent: 'leg.R', at: mx(KNEE), split: 0.015 },
      'foot.R': { parent: 'shin.R', at: mx(ANKLE) },
    });

    // ------------------------------------------------------------------ head and face
    const head = sdf
      .smoothUnion(
        0.06,
        sdf.ellipsoid(HEAD).at(0, HEAD_Y, 0),
        pair(sdf.sphere(0.1).at(0.095, 0.575, 0.072)), // round cheeks
        sdf.ellipsoid([0.11, 0.055, 0.085]).at(0, 0.53, 0.058), // soft chin
      )
      .bone('head');
    const faceZ = (x: number, y: number) => sdf.raycast(head, [x, y, 1], [0, 0, -1])![2];
    const nose = sdf.ellipsoid([0.02, 0.016, 0.015]).at(0, 0.566, faceZ(0, 0.566) - 0.004).bone('head');
    const ears = pair(
      sdf
        .ellipsoid([0.026, 0.044, 0.032])
        .subtract(sdf.sphere(0.017).at(0.016, 0, 0.006))
        .rotateY(-12)
        .at(0.2, 0.61, -0.01)
        .bone('head'),
    );
    const neck = sdf.capsule([0, 0.42, -0.01], [0, 0.52, -0.01], 0.05).bone('neck');

    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const eyeWhite = pair(at(sdf.ellipsoid([0.052, 0.056, 0.07]), EYE[0], EYE[1]));
    const irisRim = pair(at(sdf.ellipsoid([0.042, 0.049, 0.07]), EYE[0], EYE[1] - 0.004));
    const iris = pair(at(sdf.ellipsoid([0.036, 0.043, 0.07]), EYE[0], EYE[1] - 0.006));
    const irisLow = iris.intersect(sdf.halfSpace([0, 1, 0], EYE[1] - 0.022));
    const pupil = pair(at(sdf.ellipsoid([0.028, 0.032, 0.07]), EYE[0], EYE[1] + 0.001));
    const lid = pair(sdf.extrude(profile.arc(0.05, 0.012, 15, 165), 0.3).at(EYE[0], EYE[1] - 0.004, 0.1));
    const shine = sdf.union(
      ...[EYE[0], -EYE[0]].flatMap((x) => [
        at(sdf.sphere(0.012), x + 0.016, EYE[1] + 0.019),
        at(sdf.sphere(0.006), x - 0.014, EYE[1] - 0.022),
      ]),
    );
    // Thick, level brows, a little lower at the inner ends: a steady, determined look.
    const brows = pair(sdf.extrude(profile.arc(0.16, 0.026, 70, 106), 0.3).at(0.1, 0.71 - 0.16, 0.1).rotateZ(-6));
    const smile = sdf.extrude(profile.arc(0.07, 0.011, 250, 290), 0.3).at(0, 0.528 + 0.07, 0.1);
    const blush = pair(at(sdf.sphere(0.034), 0.135, 0.56));
    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.012, nose, ears)
      .paintWhere(blush, T.blush, 0.03)
      .paintWhere(eyeWhite, C.eyeWhite)
      .paintWhere(irisRim, C.irisRim)
      .paintWhere(iris, T.iris)
      .paintWhere(irisLow, T.irisLow, 0.012)
      .paintWhere(pupil, C.pupil)
      .paintWhere(lid, C.lid)
      .paintWhere(shine, '#ffffff')
      .paintWhere(brows, T.brow)
      .paintWhere(smile, T.mouth);
    k.body('skin', skin, { color: T.skin, roughness: 0.55, textureDensity: 2 });

    // ------------------------------------------------------------------ hair: sideburns, back, topknot
    const hp = (x: number, y: number, z: number, r: number, lift = 0.2): [number, number, number, number] => {
      const s = sdf.surfacePoint(head, [x * 3, HEAD_Y + (y - HEAD_Y) * 3, z * 3], r * lift);
      return [s[0], s[1], s[2], r];
    };
    const temples = pair(sdf.chain([hp(0.19, 0.735, 0.05, 0.026), hp(0.2, 0.71, 0.06, 0.024), hp(0.205, 0.64, 0.065, 0.011)], 0.015));
        // The topknot: a bun of two stacked lobes on top of the helmet, between the crest horns.
    const bun = sdf.smoothUnion(0.014, sdf.sphere(0.034).at(0, 0.905, -0.03), sdf.sphere(0.026).at(0, 0.925, -0.03)).bone('plume');
    const hair = sdf.smoothUnion(0.02, temples.bone('head'), bun);
    k.body('hair', hair, { color: T.hair, roughness: 0.6, detail: 0.004 });

    // ------------------------------------------------------------------ kabuto: bowl, brim, wings, neck guard
    const dome = sdf
      .ellipsoid([HEAD[0] + 0.022, HEAD[1] + 0.024, HEAD[2] + 0.022])
      .at(0, HEAD_Y + 0.012, -0.008)
      .intersect(sdf.halfSpace([0, -1, 0], -0.738));
    const rimBand = dome.round(0.012).intersect(sdf.box([1, 0.05, 1]).at(0, 0.77, 0));
    // The neck guard flares out behind and to the sides; the ears and the face stay open.
    const guardShape = sdf
      .revolve(
        profile.polygon(
          [
            [0.205, 0.75],
            [0.232, 0.7],
            [0.255, 0.63],
            [0.268, 0.585],
            [0.25, 0.575],
            [0.236, 0.625],
            [0.212, 0.69],
            [0.19, 0.735],
          ],
          { smooth: true, samples: 4 },
        ),
      )
      .scale([1, 1, 0.95])
      .at(0, 0, -0.012)
      .intersect(sdf.halfSpace([0, 0, 1], -0.045));
    const wing = sdf.ellipsoid([0.014, 0.1, 0.07]).rotateZ(16).at(0.243, 0.672, -0.02);
    const wings = pair(wing);
    const helmet = sdf.smoothUnion(0.012, dome, rimBand, guardShape, wings).paintWhere(sdf.halfSpace([0, 1, 0], 0.53), T.armorDark, 0.01);
    k.body('helmet', helmet.bone('head'), { color: T.armor, roughness: 0.35, metalness: 0.15, bump: scales });
    // Trim: the dark ridge over the crown, a lower edge on the guard and the wings, the cord bead.
    const guardEdge = guardShape.round(0.005).intersect(sdf.box([1, 0.022, 1]).at(0, 0.585, 0));
    const wingEdge = pair(wing.round(0.005).subtract(wing.scale([0.96, 0.9, 0.9]).round(0.003)).intersect(sdf.box([1, 0.03, 1]).at(0.26, 0.6, 0)));
    const bead = sdf.sphere(0.014).at(0, 0.898, 0.0);
    k.body('helmet-trim', sdf.union(guardEdge, wingEdge, bead).bone('head'), { color: T.armorDark, roughness: 0.4, metalness: 0.15 });

    // The black lacquer bowl on top, from the brow band up, with a ring of small gold rivets on its lower edge.
    const bowl = dome.round(0.004).intersect(sdf.halfSpace([0, -1, 0], -0.795));
    k.body('helmet-bowl', bowl.bone('head'), { color: '#1e1a18', roughness: 0.35, metalness: 0.15 });
    const rivets = sdf.union(
      ...[-90, -60, -30, 0, 30, 60, 90].map((a) => {
        const s = sdf.surfacePoint(bowl, [0.3 * Math.sin(a * rad), 0.806, 0.3 * Math.cos(a * rad) - 0.008], 0.004);
        return sdf.sphere(0.006).at(s[0], s[1], s[2]);
      }),
    );
    // The gold crescent crest: two horns curving up and out from a leaf at the brow; small fins at the sides.
    const crescent = sdf
      .extrude(profile.circle(0.21), 0.06, 0.01)
      .subtract(sdf.extrude(profile.circle(0.19), 0.2).at(0, 0.116, 0))
      .scale([1, 0.55, 1]);
    const boss = sdf.ellipsoid([0.026, 0.055, 0.026]).at(0, -0.1, 0.008);
    const crest = sdf.smoothUnion(0.01, crescent, boss).rotateX(-14).at(0, 0.912, 0.15);
    const fin = (a: number, z: number) =>
      sdf.ellipsoid([0.03, 0.05, 0.009]).at(0, 0.042, 0).rotateY(30).rotateZ(a).at(0.236, 0.752, z);
    const fins = hard(sdf.smoothUnion(0.006, fin(-8, 0.0), fin(-30, 0.005), fin(-52, 0.01)));
    k.body('kabuto-gold', sdf.union(crest, fins, rivets).bone('head'), { color: C.gold, roughness: 0.3, metalness: 0.9, detail: 0.004 });

    // ------------------------------------------------------------------ torso: kimono, cuirass, sash
    const torso = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.47],
            [0.07, 0.465],
            [0.105, 0.44],
            [0.125, 0.4],
            [0.13, 0.34],
            [0.124, 0.29],
            [0.13, 0.25],
            [0.138, 0.2],
            [0.14, 0.165],
            [0.132, 0.152],
            [0, 0.152],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.78]);
    k.body('kimono', torso.round(0.003), { color: C.indigo, roughness: 0.85, bone: 'chest' });

    // Every second scale row is darker (the rows match the bump pattern).
    const scaleRows = sdf.union(
      ...[11, 13, 15, 17].map((row) => sdf.box([1, 0.024, 1]).at(0, (row + 0.5) * 0.024, 0)),
    );
    const cuirass = torso
      .round(0.012)
      .intersect(sdf.halfSpace([0, -1, 0], -0.262))
      .intersect(sdf.halfSpace([0, 1, 0], 0.412))
      .paintFn((x, y, z, base) => (scales(x, y, z) > 0.0003 ? base : mixRgb(base, rgb('#3a0e0a'), 0.28)))
      .paintWhere(scaleRows, T.armorRow, 0.002)
      .paintWhere(sdf.box([1, 0.022, 1]).at(0, 0.402, 0), T.armorDark, 0.004)
      .paintWhere(sdf.box([1, 0.02, 1]).at(0, 0.272, 0), T.armorDark, 0.004);
    k.body('cuirass', cuirass, { color: T.armor, roughness: 0.35, metalness: 0.15, bone: 'chest', bump: scales });
    // The red cord sash, with a knot at the front and two hanging tails.
    const beltY = 0.252;
    const belt = torso.round(0.027).smoothIntersect(0.005, sdf.box([0.5, 0.046, 0.5], 0.006).at(0, beltY, 0));
    const beltZ = sdf.raycast(belt, [0, beltY, 1], [0, 0, -1])![2];
    const knot = sdf.ellipsoid([0.03, 0.024, 0.018]).at(0, beltY, beltZ + 0.004);
    const tail = (s: number) =>
      sdf.chain(
        [
          [0.012 * s, beltY - 0.01, beltZ + 0.012, 0.012],
          [0.03 * s, beltY - 0.05, beltZ + 0.016, 0.011],
          [0.042 * s, beltY - 0.1, beltZ + 0.012, 0.008],
        ],
        0.01,
      );
    k.body('sash', sdf.smoothUnion(0.01, belt, knot, tail(1), tail(-1)).bone('spine'), { color: T.armorDark, roughness: 0.6 });

    // Kusazuri: red skirt plates hang over each hip; the front and the back center stay open.
    const kusa = sdf
      .revolve(
        profile.polygon(
          [
            [0.142, 0.26],
            [0.166, 0.19],
            [0.176, 0.16],
            [0.163, 0.153],
            [0.15, 0.2],
            [0.128, 0.25],
          ],
          { smooth: true, samples: 4 },
        ),
      )
      .scale([1, 1, 0.86])
      .intersect(sdf.box([0.09, 0.3, 0.5], 0.02).at(0.135, 0.19, 0));
    k.body('kusazuri', pair(kusa.bone('leg.L')), { color: T.armor, roughness: 0.35, metalness: 0.15, bump: scales });

    // ------------------------------------------------------------------ sleeves, sode, bracers, hands
    const sleeve = (s: V3, e: V3, tag: string) => sdf.cone(s, lerp(s, e, 1.14), 0.066, 0.06).bone(tag);
    k.body('sleeves', sdf.union(sleeve(SHOULDER, ELBOW_L, 'upperarm.L'), sleeve(mx(SHOULDER), ELBOW_R, 'upperarm.R')), {
      color: C.indigo,
      roughness: 0.85,
    });
    const lame = (s: number) =>
      sdf
        .ellipsoid([0.1 * s, 0.066 * s, 0.096 * s])
        .intersect(sdf.halfSpace([0, -1, 0], 0.016 * s))
        .round(0.003);
    const sodePose = (s: sdf.Shape) => s.rotateZ(-26).at(0.158, 0.432, 0);
    k.body('sode', pair(sodePose(sdf.union(lame(0.85), lame(0.97).at(0, -0.03, 0))).bone('upperarm.L')), {
      color: T.armor,
      roughness: 0.35,
      metalness: 0.15,
      bump: scales,
    });
    const edge = (s: number, y: number) =>
      lame(s)
        .round(0.003)
        .smoothIntersect(0.004, sdf.box([0.4, 0.014, 0.4]).at(0, -0.009 * s, 0))
        .at(0, y, 0);
    k.body('sode-trim', pair(sodePose(sdf.union(edge(0.85, 0), edge(0.97, -0.03))).bone('upperarm.L')), {
      color: T.armorDark,
      roughness: 0.4,
      metalness: 0.15,
    });

    // Red forearm guards: banded lacquer over the forearm.
    const bracer = (e: V3, w: V3) => sdf.cone(lerp(e, w, 0.15), lerp(e, w, 1.02), 0.043, 0.049).round(0.003);
    const bands = (x: number, y: number, z: number) => {
      const [e, w] = x < 0 ? [ELBOW_R, WRIST_R] : [ELBOW_L, WRIST_L];
      const d = norm(sub(w, e));
      const t = (x - e[0]) * d[0] + (y - e[1]) * d[1] + (z - e[2]) * d[2];
      return 0.0016 * Math.max(0, Math.sin(t * 480));
    };
    k.body('bracers', sdf.union(bracer(ELBOW_L, WRIST_L).bone('forearm.L'), bracer(ELBOW_R, WRIST_R).bone('forearm.R')), {
      color: T.armor,
      roughness: 0.35,
      metalness: 0.15,
      bump: bands,
    });
    const fistR = handPose(HAND_R, WRIST_R)(fistLocal(-1));
    const fistL = handPose(HAND_L, WRIST_L)(fistLocal(1));
    k.body('hands', sdf.union(fistL.bone('hand.L'), fistR.bone('hand.R')), { color: T.skin, roughness: 0.55, detail: 0.004 });

    // ------------------------------------------------------------------ hakama and sandals
    const hakama = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.125, 0.06, 0.092]).at(0, 0.2, 0).bone('hips'),
      pair(sdf.cone([HIP[0], 0.2, 0], [0.097, 0.088, 0.005], 0.076, 0.09).bone('leg.L')),
    );
    const hakamaPleats = (x: number, y: number, z: number) => 0.0022 * Math.sin(Math.atan2(z, x - Math.sign(x) * 0.095) * 7) * Math.min(1, (0.22 - y) / 0.1);
    k.body('hakama', hakama.paintWhere(sdf.halfSpace([0, 1, 0], 0.115), C.indigoDark, 0.03), {
      color: C.indigo,
      roughness: 0.85,
      bump: hakamaPleats,
    });
    const sandalFoot = sdf
      .smoothUnion(0.03, sdf.cylinder(0.052, 0.06, 0.02).at(0, 0.05, 0), sdf.ellipsoid([0.058, 0.05, 0.102]).at(0, 0.045, 0.045))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const footPose = (s: sdf.Shape) => s.rotateY(12).at(ANKLE[0], 0, 0);
    const sandal = sandalFoot.paintWhere(sdf.halfSpace([0, 1, 0], 0.02), C.sole, 0.004);
    k.body('sandals', pair(footPose(sandal).bone('foot.L')), { color: T.armor, roughness: 0.4, metalness: 0.1 });
    const sp = (x: number, y: number, z: number, r: number): [number, number, number, number] => {
      const s = sdf.surfacePoint(sandalFoot, [x, y, z], 0.002);
      return [s[0], s[1], s[2], r];
    };
    const straps = sdf.union(
      sdf.chain([sp(-0.06, 0.06, 0.03, 0.008), sp(0, 0.13, 0.03, 0.008), sp(0.06, 0.06, 0.03, 0.008)], 0.006),
      sdf.chain([sp(0, 0.1, 0.12, 0.007), sp(0.02, 0.11, 0.07, 0.008), sp(0.05, 0.07, 0.04, 0.008)], 0.006),
      sdf.chain([sp(0, 0.1, 0.12, 0.007), sp(-0.02, 0.11, 0.07, 0.008), sp(-0.05, 0.07, 0.04, 0.008)], 0.006),
    );
    k.body('straps', pair(footPose(straps).bone('foot.L')), { color: C.strap, roughness: 0.7, detail: 0.004 });

    // ------------------------------------------------------------------ wakizashi at the left hip
    const saya = sdf.capsule([0.186, 0.2, -0.14], [0.19, 0.243, 0.1], 0.02).scale([1, 1, 1]);
    const hiltW = sdf.capsule([0.19, 0.247, 0.1], [0.198, 0.262, 0.185], 0.0155);
    const wakiDark = sdf.union(saya, hiltW).paintWhere(hiltW.round(0.002), C.gripLight, 0.004);
    k.body('wakizashi', wakiDark.bone('spine'), { color: C.grip, roughness: 0.45, detail: 0.004 });
    const tsubaW = sdf.cylinder(0.026, 0.008, 0.003).rotateX(90).rotateY(4).at(0.19, 0.247, 0.108);
    const kashiraW = sdf.sphere(0.0175).at(0.199, 0.263, 0.192);
    const chapeW = sdf.ellipsoid([0.022, 0.022, 0.014]).at(0.186, 0.2, -0.148);
    const bandW = sdf.cylinder(0.0225, 0.012, 0.003).rotateX(90).at(0.189, 0.235, 0.05);
    k.body('wakizashi-gold', sdf.union(tsubaW, kashiraW, chapeW, bandW).bone('spine'), {
      color: C.gold,
      roughness: 0.3,
      metalness: 0.9,
      detail: 0.004,
    });

    // ------------------------------------------------------------------ katana in the right hand
    // Local frame: the grip center at the origin, the blade toward -Y, the flat facing +Z. A long
    // wrapped grip, a round gold guard, and a gently curved blade. The pose turns the blade to KDIR.
    const BLADE_W = 0.036;
    const curve = (y: number) => -0.024 * Math.pow((-y - 0.08) / 0.34, 2); // the tip bends toward the back
    const ys = [-0.08, -0.15, -0.23, -0.31, -0.375];
    const bladePts: [number, number][] = [
      ...ys.map((y) => [-BLADE_W / 2 + curve(y), y] as [number, number]),
      [curve(-0.42) - 0.004, -0.42],
      ...[...ys].reverse().map((y) => [BLADE_W / 2 + curve(y) - (y < -0.35 ? 0.008 : 0), y] as [number, number]),
    ];
    const blade = sdf
      .extrude(profile.polygon(bladePts), 0.011, 0.0035)
      .paintWhere(sdf.box([0.014, 0.6, 0.2]).at(0.006, -0.25, 0), '#a9b0ba', 0.004);
    const tsuba = sdf.cylinder(0.036, 0.009, 0.003).scale([1, 1, 0.8]).at(0, -0.076, 0);
    const habaki = sdf.box([0.03, 0.03, 0.02], 0.006).at(0, -0.094, 0);
    const kashira = sdf.smoothUnion(0.006, sdf.ellipsoid([0.02, 0.014, 0.017]).at(0, 0.108, 0), sdf.cylinder(0.019, 0.01, 0.003).at(0, 0.096, 0));
    const tsuka = sdf
      .cylinder(0.0155, 0.17, 0.005)
      .scale([1.12, 1, 0.9])
      .at(0, 0.01, 0)
      .paintFn((x, y, z, base) => {
        const w = Math.sin((x + z) * 220 + y * 210) * Math.sin((x - z) * 220 - y * 210);
        return w > 0.2 ? mixRgb(base, rgb(C.gripLight), Math.min(0.9, w * 1.3)) : base;
      });
    const GRIP = handPoint(HAND_R, WRIST_R, [-0.007, -0.04, 0.004]);
    const katanaPose = (s: sdf.Shape) => s.rotateX(KA).rotateZ(KB).at(...GRIP);
    k.body('katana', katanaPose(blade), { color: C.steel, roughness: 0.28, metalness: 0.9, detail: 0.003, bone: 'hand.R' });
    k.body('katana-gold', katanaPose(sdf.union(tsuba, habaki, kashira)), {
      color: C.gold,
      roughness: 0.3,
      metalness: 0.9,
      detail: 0.003,
      bone: 'hand.R',
    });
    k.body('katana-grip', katanaPose(tsuka), {
      color: C.grip,
      roughness: 0.75,
      detail: 0.004,
      bone: 'hand.R',
      bump: (x, y, z) => 0.0008 * noise.noise3(x * 90, y * 90, z * 90),
    });

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop } = motion;
    const { keys, reach, orient, edgeUp } = motion;
    const LEG = 0.19;
    // The topknot sways less than a plume.
    const curl = (x: number, y: number, z: number) => [0.35 * x, 0.35 * y, 0.35 * z] as const;
    const ease = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };

    k.animation('idle', {
      duration: 2.4,
      pose: (_t, p) => ({
        hips: { move: [0, -0.003 * bump(p), 0] },
        chest: { rotate: [2.5 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        head: { rotate: [0, 4 * wave(p, 1, 0.25), 1.5 * wave(p, 1, 0.1)] },
        plume: { rotate: curl(3 * wave(p, 1, 0.4), 0, 4 * wave(p, 1, 0.3)) },
        'upperarm.R': { rotate: [2 * wave(p, 1, 0.1), 0, -2 * bump(p)] },
        'forearm.R': { rotate: [-4 * bump(p), 0, 0] },
      }),
    });

    // Walk and run: motion.gait plants the sandals; the gait phase runs a quarter cycle behind the
    // clip. The right arm swings little, and the wrist turns back against its swing, so the katana
    // keeps its low angle and the tip stays off the ground. The left hand stays on the wakizashi.
    const stride = (duration: number, step: number, footLift: number, duty: number, bob: number, armSwing: number, lean: number, flow: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        const hipsTurn = [0, 7 * s, 0] as const;
        const legs = motion.gait(p - 0.25, { hip: HIP, knee: KNEE, ankle: ANKLE }, {
          stride: step,
          lift: footLift,
          duty,
          bob,
          roll: 10,
          heel: HEEL,
          toe: TOE,
          hips: { at: [0, 0.2, 0], rotate: hipsTurn },
        });
        return {
          ...legs.pose,
          hips: { move: [0, legs.hipsY, 0] as const, rotate: hipsTurn },
          spine: { rotate: [lean, 0, 0] as const },
          chest: { rotate: [lean * 0.5, -9 * s, 0] as const },
          head: { rotate: [-lean, 4 * s, 0] as const },
          plume: { rotate: curl(flow * 0.5 + 5 * wave(p, 2, 0.2), 0, 4 * wave(p, 2, 0.1)) },
          'upperarm.L': { rotate: [armSwing * 0.1 * s, 0, 3] as const },
          'upperarm.R': { rotate: [-armSwing * 0.35 * s, 0, -6] as const },
          'forearm.R': { rotate: [-armSwing * 0.1 * Math.max(0, s), 0, 0] as const },
          'hand.R': { rotate: [armSwing * (0.35 * s + 0.1 * Math.max(0, s)), 0, 6] as const },
        };
      },
    });
    k.animation('walk', stride(0.9, 0.09, 0.02, 0.62, 0.005, 28, 3, 6));
    k.animation('run', stride(0.56, 0.13, 0.04, 0.42, 0.025, 50, 12, 22));

    // Shared rig data for the solved clips.
    const poleOf = (root: V3, mid: V3, end: V3) => {
      const t = norm(sub(end, root));
      const e = sub(mid, root);
      const d = e[0] * t[0] + e[1] * t[1] + e[2] * t[2];
      const side = norm([e[0] - d * t[0], e[1] - d * t[1], e[2] - d * t[2]]);
      return add(root, [side[0] * 0.6, side[1] * 0.6, side[2] * 0.6]);
    };
    const ARM_R = { root: mx(SHOULDER), mid: ELBOW_R, end: WRIST_R };
    const ARM_L = { root: SHOULDER, mid: ELBOW_L, end: WRIST_L };
    const POLE_REST = poleOf(mx(SHOULDER), ELBOW_R, WRIST_R);
    const POLE_REST_L = poleOf(SHOULDER, ELBOW_L, WRIST_L);
    // A blade direction from a yaw (0 = forward, + toward the left) and a pitch (up), in degrees.
    const dirOf = (yaw: number, pitch: number): V3 => [
      Math.sin(yaw * rad) * Math.cos(pitch * rad),
      Math.sin(pitch * rad),
      Math.cos(yaw * rad) * Math.cos(pitch * rad),
    ];

    // attack: a horizontal slash from right to left, solved by targets. The wrist and the blade
    // follow keys in the chest's rest frame; the chest turns on top, so the keyed yaw is 18 degrees
    // short of the world yaw. Wind-up: the hips and chest turn right, the katana goes out and back
    // on the right. Cut: the body unwinds, the blade sweeps level across the front at the height
    // of the sash to the far left, holds, and returns. The left hand stays near the wakizashi.
    const slashKeys = [
      [0, KDIR],
      [0.14, dirOf(-75, 0)],
      [0.3, dirOf(-105, 0)],
      [0.4, dirOf(-104, 0)],
      [0.46, dirOf(-60, -2)],
      [0.52, dirOf(-10, -3)],
      [0.58, dirOf(35, -3)],
      [0.64, dirOf(62, -3)],
      [0.74, dirOf(66, -3)],
      [0.9, dirOf(15, -20)],
      [1, KDIR],
    ] as const;
    const slashAt = (p: number) => keys(p, slashKeys, 'spline');
    k.animation('attack', {
      duration: 0.8,
      loop: false,
      pose: (_t, p) => {
        const wrist = keys(
          p,
          [
            [0, WRIST_R],
            [0.14, [-0.255, 0.36, 0.05]],
            [0.3, [-0.27, 0.375, -0.02]],
            [0.4, [-0.27, 0.375, -0.025]],
            [0.46, [-0.22, 0.37, 0.05]],
            [0.52, [-0.13, 0.365, 0.13]],
            [0.58, [-0.06, 0.365, 0.14]],
            [0.64, [-0.02, 0.365, 0.12]],
            [0.74, [-0.02, 0.365, 0.12]],
            [1, WRIST_R],
          ] as const,
          'spline',
        );
        const dir = norm(slashAt(p));
        const pole = keys(p, [
          [0, POLE_REST],
          [0.14, [-0.6, 0.2, -0.2]],
          [0.4, [-0.6, 0.25, -0.15]],
          [0.48, [-0.5, 0.05, 0.4]],
          [0.75, [-0.5, 0.05, 0.4]],
          [1, POLE_REST],
        ] as const);
        const arm = reach(ARM_R, wrist, pole);
        const hand = orient([arm.upper, arm.lower], { dir: KDIR, up: KFLAT }, { dir, up: edgeUp(slashAt, p, KFLAT) });
        const wind = ease(0, 0.3, p) * (1 - ease(0.4, 0.5, p));
        const cut = ease(0.44, 0.62, p) * (1 - ease(0.74, 1, p));
        const step = 22 * cut;
        const push = ease(0.06, 0.16, p) * (1 - ease(0.86, 1, p)) + 0.4 * ease(0.38, 0.44, p) * (1 - ease(0.52, 0.58, p));
        return {
          hips: { move: [0, -legDrop(LEG, step) - 0.004 * wind, 0.02 * cut - 0.01 * wind], rotate: [0, -6 * wind + 8 * cut, 0] },
          spine: { rotate: [-3 * wind + 5 * cut, 0, 0] },
          chest: { rotate: [-2 * wind + 3 * cut, -18 * wind + 18 * cut, 0] },
          head: { rotate: [-2 * wind - 2 * cut, 5 * wind - 8 * cut, 0] },
          plume: { rotate: curl(8 * wind - 16 * cut, 0, -4 * wind + 6 * cut) },
          // The shoulder moves forward and out, so the arm and the grip stay clear of the cuirass.
          'upperarm.R': { rotate: arm.upper, move: [-0.02 * push, 0, 0.065 * push] },
          'forearm.R': { rotate: arm.lower },
          'hand.R': { rotate: hand },
          'upperarm.L': { rotate: [8 * wind - 6 * cut, 0, 2 * wind] },
          'leg.L': { rotate: [-step, 0, 0] },
          'leg.R': { rotate: [step, 0, 0] },
          'foot.L': { rotate: [step, 0, 0] },
          'foot.R': { rotate: [-step, 0, 0] },
        };
      },
    });

    // hit: a blow from the front. The head and chest snap back, the right foot steps back and
    // returns, the topknot lags.
    k.animation('hit', {
      duration: 0.4,
      loop: false,
      pose: (_t, p) => {
        const h = keys(p, [[0, 0], [0.14, 1], [0.34, 0.6], [1, 0]] as const);
        const step = keys(p, [[0.04, 0], [0.24, 1], [0.58, 1], [0.9, 0]] as const);
        const lift = bump(Math.min(1, Math.max(0, (p - 0.04) / 0.2))) + bump(Math.min(1, Math.max(0, (p - 0.58) / 0.32)));
        const jolt = keys(p, [[0, 0], [0.1, 1], [0.3, 0.15], [0.5, -0.2], [0.78, 0]] as const, 'spline');
        const lag = keys(p, [[0, 0], [0.12, 0.3], [0.26, 1], [0.48, -0.45], [0.72, 0.15], [1, 0]] as const, 'spline');
        const back = 0.03 * step;
        const plant = Math.asin(back / LEG) / rad; // the left foot stays planted as the hips move back
        return {
          hips: { move: [0, -legDrop(LEG, plant), -back], rotate: [0, 5 * h, 0] },
          spine: { rotate: [-7 * h, 0, 0] },
          chest: { rotate: [-9 * h, 6 * h, -3 * h] },
          neck: { rotate: [-5 * h, 0, 0] },
          head: { rotate: [-12 * h, -6 * h, 3 * h] },
          plume: { rotate: curl(16 * lag, 0, 5 * lag) },
          'upperarm.R': { rotate: [8 * h, 0, -10 * h] },
          'forearm.R': { rotate: [-12 * h, 0, 0] },
          'upperarm.L': { rotate: [6 * jolt, 0, 6 * jolt] },
          'forearm.L': { rotate: [10 * jolt, 0, 0] },
          'leg.L': { rotate: [-plant, 0, 0] },
          'leg.R': { rotate: [plant + 8 * lift, 0, 0] },
          'foot.L': { rotate: [plant, 0, 0] },
          'foot.R': { rotate: [-plant - 8 * lift, 0, 0] },
        };
      },
    });

    // death: the blow snaps him back, he staggers a step, then topples onto his back. The big head
    // holds the body up, so the hips stay high and the neck bends a little forward. The sword arm
    // falls out to the right with the katana flat on the ground; the left arm falls to his side.
    const D = {
      tilt: 86, // the hips' final tilt back (90 = flat)
      drop: 0.045, // how far the hips come down
      back: 0.15, // how far the hips land behind the start
      neck: 9, // the neck and the head bend forward, so the helmet clears the ground
      head: 12,
      leg: 34, // the legs lie back down to the ground
      wristR: [-0.27, 0.35, -0.075] as V3,
      bladeR: norm([-0.9, -0.2, -0.3]),
      wristL: [0.19, 0.235, 0.05] as V3,
      poleL: [0.5, 0.3, -0.3] as V3,
    };
    k.animation('death', {
      duration: 1.4,
      loop: false,
      pose: (_t, p) => {
        const hitB = keys(p, [[0, 0], [0.07, 1], [0.2, 0.4], [0.3, 0]] as const);
        const stag = keys(p, [[0.04, 0], [0.22, 1]] as const);
        const f = keys(p, [[0.26, 0], [0.68, 1]] as const);
        const g = f * f; // the fall starts slowly and ends fast
        const stand = 1 - g;
        const land = bump(Math.min(1, Math.max(0, (p - 0.66) / 0.14)));
        const lag = keys(p, [[0, 0], [0.1, 0.8], [0.3, -0.3], [0.5, 0.6], [0.7, -1], [0.82, -0.6], [1, -0.7]] as const, 'spline');

        const wristR = keys(p, [[0, WRIST_R], [0.1, [-0.27, 0.34, 0.08]], [0.36, [-0.28, 0.37, 0.03]], [0.74, D.wristR]] as const);
        const poleR = keys(p, [[0, POLE_REST], [0.2, [-0.6, 0.3, -0.1]], [0.74, [-0.6, 0.4, -0.35]]] as const);
        const armR = reach(ARM_R, wristR, poleR);
        const blade = norm(keys(p, [[0, KDIR], [0.1, norm([-0.75, -0.1, 0.48])], [0.4, norm([-0.85, -0.15, 0.3])], [0.74, D.bladeR]] as const));
        const flatUp = norm(keys(p, [[0, KFLAT], [0.4, KFLAT], [0.74, [0, 0, 1]]] as const));
        const hand = orient([armR.upper, armR.lower], { dir: KDIR, up: KFLAT }, { dir: blade, up: flatUp });

        const wristL = keys(p, [[0, WRIST_L], [0.1, [0.28, 0.3, 0.06]], [0.36, [0.27, 0.31, 0.03]], [0.76, D.wristL]] as const);
        const poleL = keys(p, [[0, POLE_REST_L], [0.2, [0.6, 0.3, -0.1]], [0.76, D.poleL]] as const);
        const armL = reach(ARM_L, wristL, poleL);

        const plant = Math.asin((0.03 * stag * stand) / LEG) / rad;
        const legL = -plant + D.leg * g * g;
        const sole = D.tilt * g - D.leg * g * g;
        const toes = keys(p, [[0.56, 0], [0.76, 1]] as const);
        return {
          hips: {
            move: [0, -legDrop(LEG, plant) * stand - D.drop * g + 0.014 * Math.sin(Math.PI * f) + 0.012 * land, -0.03 * stag - D.back * g],
            rotate: [-4 * hitB - 4 * stag * stand - D.tilt * g, 0, 0],
          },
          spine: { rotate: [-6 * hitB + 5 * stag * stand, 0, 0] },
          chest: { rotate: [-8 * hitB + 4 * stag * stand, 5 * hitB, 3 * stag * stand] },
          neck: { rotate: [-5 * hitB + D.neck * g, 0, 0] },
          head: { rotate: [-12 * hitB + D.head * g, 22 * g, 0] },
          plume: { rotate: curl(18 * lag - 22 * toes, 0, 6 * lag) },
          'upperarm.R': { rotate: armR.upper },
          'forearm.R': { rotate: armR.lower },
          'hand.R': { rotate: hand },
          'upperarm.L': { rotate: armL.upper },
          'forearm.L': { rotate: armL.lower },
          'leg.L': { rotate: [legL, 0, 6 * g] },
          'leg.R': { rotate: [plant + 10 * stag * stand + (D.leg + 2) * g * g, 0, -6 * g] },
          'foot.L': { rotate: [plant + sole * (1 - toes) + 16 * toes, 0, 0] },
          'foot.R': { rotate: [-plant - 10 * stag * stand + sole * (1 - toes) + 16 * toes, 0, 0] },
        };
      },
    });

    // attack2: an overhead two-handed cut. The katana swings up on the right, out beside the head,
    // then comes to a high guard in front (the tip up and forward, clear of the face); the cut
    // drives it down and forward. The left hand joins the grip above the right hand.
    const overKeys = [
      [0, KDIR],
      [0.16, dirOf(-75, 5)],
      [0.3, dirOf(-45, 50)],
      [0.42, dirOf(-12, 42)],
      [0.5, dirOf(-5, 38)],
      [0.6, dirOf(-3, -12)],
      [0.7, dirOf(-3, -20)],
      [0.8, dirOf(-3, -22)],
      [0.92, dirOf(-30, -20)],
      [1, KDIR],
    ] as const;
    const overAt = (p: number) => keys(p, overKeys, 'spline');
    k.animation('attack2', {
      duration: 0.9,
      loop: false,
      pose: (_t, p) => {
        const wrist = keys(
          p,
          [
            [0, WRIST_R],
            [0.16, [-0.26, 0.4, 0.04]],
            [0.3, [-0.24, 0.44, 0.06]],
            [0.42, [-0.12, 0.43, 0.13]],
            [0.5, [-0.08, 0.43, 0.16]],
            [0.6, [-0.06, 0.4, 0.17]],
            [0.7, [-0.06, 0.35, 0.17]],
            [0.8, [-0.06, 0.35, 0.17]],
            [0.92, [-0.2, 0.34, 0.08]],
            [1, WRIST_R],
          ] as const,
          'spline',
        );
        const dir = norm(overAt(p));
        const pole = keys(p, [
          [0, POLE_REST],
          [0.16, [-0.6, 0.2, -0.2]],
          [0.42, [-0.6, 0.15, -0.1]],
          [0.6, [-0.5, 0.05, 0.4]],
          [0.85, [-0.5, 0.05, 0.4]],
          [1, POLE_REST],
        ] as const);
        const armR = reach(ARM_R, wrist, pole);
        const up = edgeUp(overAt, p, KFLAT);
        const handR = orient([armR.upper, armR.lower], { dir: KDIR, up: KFLAT }, { dir, up });
        // The left hand rides the grip above the right hand.
        const grip = ease(0.06, 0.24, p) * (1 - ease(0.9, 1, p));
        const target = add(wrist, [-dir[0] * 0.075 + 0.03, -dir[1] * 0.075 - 0.04, -dir[2] * 0.075]);
        const wristL = lerp(WRIST_L, [Math.max(target[0], 0.045), target[1], Math.max(target[2] + 0.02, 0.15)], grip);
        const poleL = lerp(POLE_REST_L, [0.75, 0.15, 0.2], grip);
        const armL = reach(ARM_L, wristL, poleL);
        const handL = orient([armL.upper, armL.lower], { dir: KDIR, up: KFLAT }, { dir, up });
        const wind = ease(0.1, 0.42, p) * (1 - ease(0.5, 0.56, p));
        const cut = ease(0.5, 0.68, p) * (1 - ease(0.8, 1, p));
        const step = 24 * cut;
        const push = ease(0.06, 0.16, p) * (1 - ease(0.96, 1, p)) + 0.35 * ease(0.74, 0.82, p) * (1 - ease(0.94, 0.98, p));
        return {
          hips: { move: [0, -legDrop(LEG, step) - 0.005 * wind, 0.025 * cut - 0.012 * wind], rotate: [0, -6 * wind + 4 * cut, 0] },
          spine: { rotate: [-6 * wind + 9 * cut, 0, 0] },
          chest: { rotate: [-4 * wind + 7 * cut, -6 * wind + 4 * cut, 0] },
          head: { rotate: [-3 * wind - 3 * cut, 0, 0] },
          plume: { rotate: curl(10 * wind - 18 * cut, 0, 4 * wind) },
          'upperarm.R': { rotate: armR.upper, move: [-0.02 * push, 0, 0.065 * push] },
          'forearm.R': { rotate: armR.lower },
          'hand.R': { rotate: handR },
          'upperarm.L': { rotate: armL.upper, move: [0.0, 0, 0.065 * push] },
          'forearm.L': { rotate: armL.lower },
          'hand.L': { rotate: [0, 0, 0] },
          'leg.L': { rotate: [-step, 0, 0] },
          'leg.R': { rotate: [step, 0, 0] },
          'foot.L': { rotate: [step, 0, 0] },
          'foot.R': { rotate: [-step, 0, 0] },
        };
      },
    });

    // victory: the katana goes out to the right and up, upright beside the head (the blade leans
    // out, clear of the wing); a proud nod, and he holds the pose with the chin up.
    const WIN = {
      wrist: [-0.298, 0.458, 0.04] as V3,
      blade: norm([-0.22, 0.97, 0.1]),
    };
    k.animation('victory', {
      duration: 1.2,
      loop: false,
      pose: (_t, p) => {
        const r = ease(0, 0.3, p);
        const nod = keys(p, [[0.42, 0], [0.54, 1], [0.68, -0.4], [0.8, 0]] as const);
        const pride = ease(0.6, 0.8, p);
        const look = r * (1 - ease(0.42, 0.6, p));
        const lag = keys(p, [[0, 0], [0.14, -0.6], [0.3, 0.7], [0.42, -0.3], [0.56, -0.8], [0.7, 0.9], [0.84, -0.35], [1, 0.1]] as const, 'spline');
        const sway = keys(p, [[0, 0], [0.18, -0.5], [0.34, 0.6], [0.5, -0.3], [0.66, 0.45], [0.82, -0.15], [1, 0.05]] as const, 'spline');
        const wristR = keys(
          p,
          [
            [0, WRIST_R],
            [0.12, [-0.27, 0.37, 0.1]],
            [0.26, [-0.296, 0.462, 0.042]],
            [0.32, [-0.298, 0.466, 0.04]],
            [0.42, WIN.wrist],
          ] as const,
          'spline',
        );
        const poleR = keys(p, [[0, POLE_REST], [0.12, [-0.6, 0.1, -0.1]], [0.3, [-0.6, 0.15, -0.25]]] as const);
        const armR = reach(ARM_R, wristR, poleR);
        const blade = norm(
          keys(p, [[0, KDIR], [0.12, norm([-0.85, 0.2, 0.48])], [0.26, norm([-0.26, 0.95, 0.14])], [0.32, norm([-0.18, 0.98, 0.1])], [0.42, WIN.blade]] as const, 'spline'),
        );
        const flatUp = norm(keys(p, [[0, KFLAT], [0.12, [0.5, 0.3, 0.8]], [0.26, [0.2, 0.05, 1]]] as const));
        const hand = orient([armR.upper, armR.lower], { dir: KDIR, up: KFLAT }, { dir: blade, up: flatUp });
        const stance = 4 * r;
        return {
          hips: { move: [0, -legDrop(LEG, stance), 0], rotate: [0, 0, 0] },
          spine: { rotate: [-4 * r, 0, -3 * r] },
          chest: { rotate: [-2 * r, 0, -6 * r] },
          neck: { rotate: [3 * nod, 0, 0] },
          head: { rotate: [-6 * look + 10 * nod - 5 * pride, -10 * look, 0] },
          plume: { rotate: curl(12 * lag, 0, 6 * sway) },
          // The right shoulder lifts a little (a shrug), so the katana goes higher.
          'upperarm.R': { rotate: armR.upper, move: [0, 0.015 * r, 0] },
          'forearm.R': { rotate: armR.lower },
          'hand.R': { rotate: hand },
          'upperarm.L': { rotate: [-6 * r, 0, 4 * r] },
          'leg.L': { rotate: [0, 0, stance] },
          'leg.R': { rotate: [0, 0, -stance] },
          'foot.L': { rotate: [0, 0, -stance] },
          'foot.R': { rotate: [0, 0, stance] },
        };
      },
    });
  },
});
