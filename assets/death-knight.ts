import { defineAsset, mixRgb, motion, noise, profile, rgb, sdf, THREE } from '../src/index.js';

/**
 * Death knight — Chibi Quest P1 dungeon enemy (catalog `enemies/undead/death-knight`), about
 * 1.02 m to the tips of its horns, faces +Z. Target: docs/enemy-mockups/death-knight_001.jpg (one
 * front view). Built on assets/skeleton-knight.ts (the same rig with knee bones, weapon hand, and
 * clips); the sword and shield became one big runed greatsword.
 *
 * Role: an undead champion, tougher than the skeleton knight; seen in 3D and as a 128 px sprite.
 * One idea: two icy-blue eyes glaring out of the angry visor slit of a closed, horned black
 *   helmet, over spiked black plate, a dark purple cape, and a greatsword with glowing runes.
 * Proportions: the skeleton knight's (helmet center 0.69, shoulders 0.44 with pauldrons, belt
 *   0.25, knees 0.13); the helmet peak at 0.99, the horn tips at about 1.02.
 * Shape language: a round heavy helmet and body with sharp accents everywhere (the horns, the
 *   crest point between the eyes, the pauldron and knee spikes, the toothed blade, the torn hem).
 * Palette (60/30/10): black plate #2b2c32 with cold worn edges #5d606b; dark purple cloth and
 *   knit #4b2d6b; the icy-blue glow #7cf4ff of the eyes and the runes as the accent.
 * Value plan: the glowing eyes in the black helmet are the focal point; the runes on the dark
 *   blade are the second light; the purple cape and scarf frame the black armor.
 * Bodies: knit (under-layer, sleeves, neck), eyes (emissive), helmet, horns, breastplate,
 *   pauldrons, bracers, gauntlets, belt, tasset, skirt, cape, scarf, leggings, greaves, sword,
 *   runes (emissive), hilt, grip, studs.
 * Rig: the skeleton knight's (chibi rig with shin bones) plus `weapon` (a child of `hand.R`).
 *   Clips: idle, walk, run, attack (a two-handed overhead chop), hit, death (a collapse into a
 *   heap), rise (the heap pulls itself together).
 */

const C = {
  plate: '#40424a',
  plateDark: '#222328',
  edge: '#6b6f7b',
  sheen: '#4a4458',
  horn: '#3a3b42',
  void: '#07070a',
  glow: '#7cf4ff',
  glowBase: '#0d2c36',
  cloth: '#4b2d6b',
  clothDark: '#301c47',
  knit: '#3d2659',
  legKnit: '#2a1c3a',
  blade: '#2a2b31',
  bladeEdge: '#4d515c',
  sole: '#141417',
};

type V3 = readonly [number, number, number];

const RAD = Math.PI / 180;
const pair = (s: sdf.Shape) => s.mirror('x');
const hard = (s: sdf.Shape) => s.mirror('x', 0);
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const add = (a: V3, b: V3, s = 1): V3 => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};

// Joints. The right hand holds the greatsword low in front, point down; the left hangs in a fist.
// The forearms are a little longer than the skeleton knight's, so both hands reach the grip.
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW_R: V3 = [-0.19, 0.335, 0.03];
const WRIST_R: V3 = [-0.226, 0.292, 0.112];
const ELBOW_L: V3 = [0.175, 0.335, 0];
const WRIST_L: V3 = [0.205, 0.282, 0.092];
const HIP: V3 = [0.068, 0.195, 0];
const ANKLE: V3 = [0.098, 0.07, 0];
const KNEE: V3 = [0.083, 0.1325, 0]; // the knee: splits the leg (shin.L takes the weight below it)
// The ends of the flat bottom of the left sabaton (y = 0), measured on the SDF: heel and toe.
const SOLE_HEEL: V3 = [0.095, 0, -0.017];
const SOLE_TOE: V3 = [0.111, 0, 0.098];

// The greatsword: the blade points down, forward, and out; the right fist closes at the pommel
// end, and the long grip runs forward to the guard (room for the left fist in the attack).
const FIST_R = add(WRIST_R, norm([WRIST_R[0] - ELBOW_R[0], WRIST_R[1] - ELBOW_R[1], WRIST_R[2] - ELBOW_R[2]]), 0.04);
const GRIP_DIR = norm([-0.5, -0.4, 0.77]);
const GUARD = add(FIST_R, GRIP_DIR, 0.11);
// rotateY (a roll about the blade), then rotateZ, then rotateX turn local +Y into GRIP_DIR; the
// roll makes the flat face sideways (its normal level), so the blade shows its runes to the front.
const SWORD_Z = Math.asin(-GRIP_DIR[0]) / RAD;
const SWORD_X = Math.atan2(GRIP_DIR[2], GRIP_DIR[1]) / RAD;
const SWORD_ROLL = Math.atan2(Math.sin(SWORD_X * RAD), Math.sin(SWORD_Z * RAD) * Math.cos(SWORD_X * RAD)) / RAD;
const swordPose = (s: sdf.Shape) => s.rotateY(SWORD_ROLL).rotateZ(SWORD_Z).rotateX(SWORD_X).at(...GUARD);
/** The blade's flat normal at rest (local +Z through swordPose). */
const FLAT: V3 = (() => {
  const [a, b, r] = [SWORD_Z * RAD, SWORD_X * RAD, SWORD_ROLL * RAD];
  const x1 = Math.sin(r) * Math.cos(a);
  const y1 = Math.sin(r) * Math.sin(a);
  const z1 = Math.cos(r);
  return norm([x1, y1 * Math.cos(b) - z1 * Math.sin(b), y1 * Math.sin(b) + z1 * Math.cos(b)]);
})();

/** A plated fist in the sword's local frame: a palm and four thick curled fingers around the grip. */
const gauntletFistLocal = () =>
  sdf.smoothUnion(
    0.007,
    sdf.ellipsoid([0.034, 0.044, 0.034]).at(-0.013, -0.046, -0.006),
    ...[0, 1, 2, 3].map((i) => {
      const y = -0.02 - i * 0.02;
      return sdf.chain(
        [
          [-0.02, y, 0.022, 0.0125],
          [0.013, y - 0.002, 0.028, 0.0118],
          [0.025, y - 0.004, 0.0, 0.011],
        ],
        0.004,
      );
    }),
    sdf.chain(
      [
        [-0.03, -0.03, 0.014, 0.013],
        [-0.01, -0.012, 0.027, 0.011],
        [0.013, -0.012, 0.027, 0.0095],
      ],
      0.004,
    ),
  );

/** A plated fist hanging from the wrist `w`, fingers curled toward +Z. */
const gauntletFistAt = (w: V3) =>
  sdf.smoothUnion(
    0.007,
    sdf.ellipsoid([0.037, 0.039, 0.033]).at(w[0] + 0.006, w[1] - 0.036, w[2]),
    ...[0, 1, 2, 3].map((i) => {
      const x = w[0] - 0.02 + i * 0.014;
      return sdf.chain(
        [
          [x, w[1] - 0.05, w[2] + 0.018, 0.012],
          [x, w[1] - 0.072, w[2] + 0.03, 0.011],
          [x, w[1] - 0.066, w[2] + 0.046, 0.0105],
        ],
        0.004,
      );
    }),
    sdf.chain(
      [
        [w[0] + 0.032, w[1] - 0.026, w[2] + 0.014, 0.0125],
        [w[0] + 0.026, w[1] - 0.047, w[2] + 0.037, 0.0105],
      ],
      0.004,
    ),
  );

export default defineAsset({
  name: 'death-knight',
  description:
    'Chibi death knight enemy: glowing icy-blue eyes in the visor slit of a closed, horned black helmet, spiked black plate, a tattered dark purple cape, and a big black greatsword with glowing runes.',
  detail: 0.005,
  reference: 'docs/enemy-mockups/death-knight_001.jpg',
  // Color slots for individual knights (the first option is the default look).
  variants: {
    // The cape, the scarf, the trim, and the knit under the plate: dark, deep dyes.
    cloth: { purple: C.cloth, blood: '#6a1e25', teal: '#1d4a4d' },
    // The eyes and the runes: a magic glow, so these stay bright.
    glow: { icy: C.glow, green: '#8dff6e', red: '#ff5040' },
  },
  presets: {
    nightfall: { cloth: 'purple', glow: 'icy' },
    bloodsworn: { cloth: 'blood', glow: 'red' },
    plaguebound: { cloth: 'teal', glow: 'green' },
  },

  build(k) {
    // The slot colors (see variants): shades of a slot keep their exact default color and follow
    // the slot when a game recolors it.
    const SLOT = {
      glow: k.tint('glow'),
      glowBase: k.tint('glow', { color: C.glowBase, follow: 1 }),
      cloth: k.tint('cloth'),
      clothDark: k.tint('cloth', { color: C.clothDark, follow: 1 }),
      knit: k.tint('cloth', { color: C.knit, follow: 1 }),
      legKnit: k.tint('cloth', { color: C.legKnit, follow: 1 }),
    };
    // A faint cold sheen in blotches over the black plate.
    const sheen = (s: sdf.Shape, f = 30) =>
      s.paintFn((x, y, z, base) => (noise.fbm(x * f, y * f, z * f, 3) > 0.32 ? mixRgb(base, rgb(C.sheen), 0.3) : base));
    const plateBump = (x: number, y: number, z: number) => 0.0008 * noise.fbm(x * 70, y * 70, z * 70, 2);
    const dents = (s: sdf.Shape, a = 0.0025, f = 11) => s.displace(a, (x, y, z) => noise.fbm(x * f, y * f, z * f, 2));
    const knitBump = (x: number, y: number, z: number) => {
      const u = Math.atan2(z, x) * 36;
      const v = y * 170 + (Math.floor(u / Math.PI) % 2) * Math.PI * 0.5;
      return 0.0014 * Math.abs(Math.sin(u)) * Math.abs(Math.sin(v));
    };
    const spike = (a: V3, b: V3, r: number) => sdf.cone(a, b, r, 0.002);
    const PLATE = { color: C.plate, roughness: 0.5, metalness: 0.35, bump: plateBump };

    // ------------------------------------------------------------------ skeleton (rig)
    k.skeleton({
      hips: { at: [0, 0.2, 0] },
      spine: { parent: 'hips', at: [0, 0.26, 0] },
      chest: { parent: 'spine', at: [0, 0.33, 0] },
      neck: { parent: 'chest', at: [0, 0.43, -0.01] },
      head: { parent: 'neck', at: [0, 0.48, -0.01] },
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
      weapon: { parent: 'hand.R', at: GUARD },
    });

    // ------------------------------------------------------------------ closed horned helmet
    // A tall egg with a peak, a tapered crest plate that comes down the front to a point between the eyes,
    // angry brow plates, and two slanted visor slits; the slits are black inside, with the eyes.
    const helmEgg = sdf.ellipsoid([0.225, 0.24, 0.215]).at(0, 0.69, -0.005);
    const helmSolid = sdf
      .smoothUnion(0.05, helmEgg, sdf.cone([0, 0.8, -0.012], [0, 0.972, -0.012], 0.13, 0.006))
      .intersect(sdf.halfSpace([0, -1, 0], -0.49));
    const SZ = sdf.raycast(helmSolid, [0.09, 0.64, 1], [0, 0, -1])![2];
    const crest = helmSolid
      .round(0.012)
      .intersect(sdf.extrude(profile.polygon([[-0.045, 1.2], [0.045, 1.2], [0.028, 0.7], [0, 0.598], [-0.028, 0.7]]), 0.8));
    const browL = helmSolid
      .round(0.009)
      .intersect(sdf.extrude(profile.polygon([[0.02, 0.657], [0.16, 0.684], [0.206, 0.732], [0.158, 0.704], [0.02, 0.679]]), 0.8).at(0, 0, 0.4));
    const rimBand = helmEgg.round(0.011).subtract(helmEgg.round(-0.02)).intersect(sdf.box([0.6, 0.036, 0.6]).at(0, 0.508, 0));
    const slitL = sdf.extrude(profile.polygon([[0.024, 0.607], [0.152, 0.632], [0.163, 0.673], [0.028, 0.65]]), 0.3).at(0, 0, SZ + 0.105);
    const slits = hard(slitL);
    const helm = sheen(
      dents(sdf.smoothUnion(0.006, helmSolid, crest, hard(browL)), 0.002, 9)
        .union(rimBand)
        .smoothSubtract(0.004, slits),
    )
      .paintWhere(slits.round(0.005), C.void, 0.005)
      // Worn edges: the lower rim, the crest's ridge line, and the brow plates' upper edges.
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.5), C.edge, 0.004)
      .paintWhere(sdf.box([0.012, 0.8, 0.8]).at(0, 1.0, 0), C.edge, 0.004)
      .paintWhere(hard(browL.round(0.002).intersect(sdf.halfSpace([0, -1, 0], -0.69))), C.edge, 0.004);
    k.body('helmet', helm, { ...PLATE, bone: 'head', textureDensity: 2 });

    // The eyes: slanted glowing slivers deep in the slits (a dark base color, an icy glow).
    const eyeL = sdf.ellipsoid([0.045, 0.02, 0.02]).rotateZ(11).at(0.09, 0.64, SZ - 0.03);
    k.body('eyes', hard(eyeL), { color: SLOT.glowBase, roughness: 0.3, emissive: SLOT.glow, emissiveIntensity: 2.4, bone: 'head' });

    // Big curved horns: out from the sides of the helmet, then up, the tips turning in.
    const hornL = sdf
      .chain(
        [
          [0.16, 0.745, -0.01, 0.05],
          [0.25, 0.77, -0.005, 0.046],
          [0.305, 0.83, 0.0, 0.039],
          [0.325, 0.905, 0.005, 0.03],
          [0.31, 0.97, 0.01, 0.02],
          [0.27, 1.02, 0.012, 0.007],
        ],
        0.01,
      )
      .paintFn((x, y, _z, base) => (Math.sin(y * 150 + Math.abs(x) * 70) > 0.75 ? mixRgb(base, rgb(C.plateDark), 0.5) : base));
    k.body('horns', hard(hornL), { color: C.horn, roughness: 0.45, bone: 'head', detail: 0.004 });

    // ------------------------------------------------------------------ torso: knit under a breastplate
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
    // Purple knit: the body, the sleeves between the pauldrons and the vambraces, and the neck.
    const knit = sdf.union(
      torso.bone('spine'),
      sdf.capsule(SHOULDER, ELBOW_L, 0.03).bone('upperarm.L'),
      sdf.capsule(mx(SHOULDER), ELBOW_R, 0.03).bone('upperarm.R'),
      sdf.cylinder(0.052, 0.1, 0.01).at(0, 0.47, -0.012).bone('neck'),
    );
    k.body('knit', knit, { color: SLOT.knit, roughness: 0.9, bump: knitBump });
    // The breastplate: the torso grown and cut to a band, a raised ridge down the front, two
    // chevron lame lines.
    const ridge = torso.round(0.019).intersect(sdf.box([0.02, 0.17, 0.3], 0.008).at(0, 0.37, 0.15));
    const chevron = (y: number) =>
      sdf.extrude(profile.polygon([[-0.14, y + 0.04], [0, y], [0.14, y + 0.04], [0.14, y + 0.052], [0, y + 0.012], [-0.14, y + 0.052]]), 0.4).at(0, 0, 0.2);
    const plate = sheen(dents(torso.round(0.012).smoothIntersect(0.006, sdf.box([0.5, 0.19, 0.5], 0.01).at(0, 0.372, 0))).smoothUnion(0.006, ridge))
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.287), C.edge, 0.003)
      .paintWhere(sdf.union(chevron(0.3), chevron(0.345)), C.edge, 0.003)
      .paintWhere(ridge.round(0.002).intersect(sdf.halfSpace([0, 0, -1], -0.118)), C.edge, 0.004);
    k.body('breastplate', plate.bone('spine'), PLATE);

    // ------------------------------------------------------------------ spiked pauldrons (two lames each)
    const lame = (s: number) =>
      sdf
        .ellipsoid([0.1 * s, 0.066 * s, 0.096 * s])
        .intersect(sdf.halfSpace([0, -1, 0], 0.016 * s))
        .round(0.003)
        .paintWhere(sdf.halfSpace([0, 1, 0], -0.016 * s + 0.007), C.edge, 0.002);
    const pauldronSpikes = sdf.union(
      spike([-0.03, 0.05, -0.03], [-0.035, 0.125, -0.04], 0.018),
      spike([0.015, 0.058, 0.015], [0.02, 0.14, 0.02], 0.02),
      spike([0.06, 0.04, 0.0], [0.1, 0.105, 0.0], 0.017),
      spike([0.09, -0.02, 0.03], [0.16, -0.005, 0.045], 0.016),
    );
    const pauldronPose = (s: sdf.Shape) => s.rotateZ(-26).at(0.158, 0.432, 0);
    const pauldrons = pair(pauldronPose(sdf.union(lame(1), lame(1.14).at(0, -0.034, 0), pauldronSpikes)).bone('upperarm.L'));
    k.body('pauldrons', sheen(pauldrons), PLATE);

    // ------------------------------------------------------------------ vambraces with an outward spike
    const bracer = (e: V3, w: V3, side: number) =>
      sdf
        .smoothUnion(
          0.006,
          sdf.cone(lerp(e, w, 0.2), lerp(e, w, 1.0), 0.041, 0.049).round(0.003),
          spike(add(lerp(e, w, 0.5), [side * 0.035, 0, 0]), add(lerp(e, w, 0.45), [side * 0.08, 0.02, -0.01]), 0.016),
        )
        .paintWhere(sdf.sphere(0.022).at(...lerp(e, w, 1.04)), C.edge, 0.004);
    const bracers = sdf.union(bracer(ELBOW_L, WRIST_L, 1).bone('forearm.L'), bracer(ELBOW_R, WRIST_R, -1).bone('forearm.R'));
    k.body('bracers', sheen(bracers), PLATE);
    // Black gauntlets: the right one closed on the grip, the left one a fist.
    const gauntlets = sdf.union(swordPose(gauntletFistLocal().at(0, -0.06, 0)).bone('hand.R'), gauntletFistAt(WRIST_L).bone('hand.L'));
    k.body('gauntlets', gauntlets, { ...PLATE, detail: 0.004 });

    // ------------------------------------------------------------------ belt, tasset, knit skirt
    const beltY = 0.252;
    const belt = torso.round(0.013).smoothIntersect(0.005, sdf.box([0.5, 0.046, 0.5], 0.006).at(0, beltY, 0));
    k.body('belt', sheen(belt).bone('spine'), { color: C.plateDark, roughness: 0.55, metalness: 0.3 });
    const beltZ = sdf.raycast(belt, [0, beltY, 1], [0, 0, -1])![2];
    const buckle = sdf
      .union(sdf.box([0.062, 0.052, 0.014], 0.006).subtract(sdf.box([0.034, 0.026, 0.03], 0.005)), sdf.box([0.008, 0.03, 0.01], 0.003).at(0.002, 0, 0.004))
      .at(0, beltY, beltZ + 0.004);
    // A pointed plate hangs from the belt over the front, with a raised rim.
    const tassetOutline = profile.polygon([[-0.05, 0.236], [0.05, 0.236], [0.05, 0.16], [0, 0.112], [-0.05, 0.16]]);
    const tasset = sdf
      .union(sdf.extrude(tassetOutline, 0.012, 0.004), sdf.extrude(profile.offsetProfile(tassetOutline, -0.012), 0.02, 0.004))
      .rotateX(-8)
      .at(0, 0, beltZ + 0.006)
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.13), C.edge, 0.004);
    k.body('tasset', sheen(tasset).bone('hips'), PLATE);
    // Two knit skirt flaps with torn hems, each following its leg (the cape covers the back).
    const flap = sdf
      .extrude(
        profile.polygon([
          [0.004, 0.262],
          [0.085, 0.262],
          [0.09, 0.108],
          [0.07, 0.126],
          [0.052, 0.09],
          [0.03, 0.116],
          [0.004, 0.1],
        ]),
        0.014,
        0.005,
      )
      .rotateX(-8)
      .at(0, 0, 0.122);
    k.body('skirt', pair(flap.bone('leg.L')), { color: SLOT.knit, roughness: 0.9, bump: knitBump });

    // ------------------------------------------------------------------ the tattered cape
    // A thin flared shell behind the back with a torn hem; low down it wraps forward around the
    // sides (seen from the front), tucked under the scarf at the top.
    const capeSolid = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.56],
            [0.1, 0.55],
            [0.11, 0.47],
            [0.13, 0.4],
            [0.16, 0.3],
            [0.21, 0.16],
            [0.27, 0.06],
            [0.29, 0.015],
            [0, 0.015],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.9]);
    const capeOutline = profile.polygon([
      [-0.3, 0.5],
      [0.3, 0.5],
      [0.3, 0.08],
      [0.25, 0.022],
      [0.2, 0.085],
      [0.15, 0.02],
      [0.1, 0.07],
      [0.05, 0.022],
      [0.0, 0.075],
      [-0.05, 0.02],
      [-0.1, 0.07],
      [-0.15, 0.022],
      [-0.2, 0.085],
      [-0.25, 0.02],
      [-0.3, 0.08],
    ]);
    const capeFront = sdf.halfSpace(norm([0, 0.3, 1]), 0.05 / Math.hypot(0.3, 1)); // z <= 0.05 - 0.3 y
    const cape = capeSolid.shell(0.009).intersect(sdf.extrude(capeOutline, 0.5).at(0, 0, -0.2)).intersect(capeFront);
    const capeTagged = sdf.union(
      cape.intersect(sdf.halfSpace([0, -1, 0], -0.33)).bone('chest'),
      cape.intersect(sdf.halfSpace([0, 1, 0], 0.33)).bone('spine'),
    );
    k.body('cape', capeTagged.paintWhere(sdf.halfSpace([0, 1, 0], 0.18), SLOT.clothDark, 0.04), { color: SLOT.cloth, roughness: 0.85 });

    // ------------------------------------------------------------------ knit scarf
    const scarfRing = sdf
      .revolve(
        profile.polygon(
          [
            [0.05, 0.505],
            [0.1, 0.5],
            [0.136, 0.474],
            [0.146, 0.446],
            [0.12, 0.43],
            [0.085, 0.452],
            [0.05, 0.468],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.92]);
    const drape = torso
      .round(0.022)
      .subtract(torso.round(0.008))
      .intersect(
        sdf
          .extrude(
            profile.polygon([
              [-0.105, 0.47],
              [0.105, 0.47],
              [0.03, 0.4],
              [0.0, 0.385],
              [-0.03, 0.4],
            ]),
            0.4,
          )
          .at(0, 0, 0.2),
      );
    k.body('scarf', sdf.smoothUnion(0.012, scarfRing, drape), { color: SLOT.cloth, roughness: 0.9, bone: 'chest', bump: knitBump });

    // ------------------------------------------------------------------ legs: knit leggings, spiked knee cops, greaves, sabatons
    const leggings = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.112, 0.05, 0.084]).at(0, 0.2, 0).bone('hips'),
      pair(sdf.capsule([HIP[0], 0.2, 0], [0.095, 0.1, 0.004], 0.046).bone('leg.L')),
    );
    k.body('leggings', leggings, { color: SLOT.legKnit, roughness: 0.9, bump: knitBump });
    const knee = sdf
      .smoothUnion(0.008, sdf.ellipsoid([0.056, 0.034, 0.05]).at(0.095, 0.11, 0.022), spike([0.096, 0.115, 0.05], [0.098, 0.135, 0.1], 0.022))
      .paintWhere(sdf.halfSpace([0, 0, -1], -0.07), C.edge, 0.004)
      .bone('leg.L');
    const greave = sdf.cone([0.096, 0.098, 0.006], [0.098, 0.06, 0.004], 0.05, 0.053).bone('leg.L');
    const sabatonFoot = sdf
      .smoothUnion(0.03, sdf.cylinder(0.053, 0.06, 0.02).at(0, 0.05, 0), sdf.ellipsoid([0.058, 0.05, 0.106]).at(0, 0.045, 0.046))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const toeLines = sdf.union(
      sdf.box([0.2, 0.006, 0.2]).rotateX(-30).at(0, 0.075, 0.06),
      sdf.box([0.2, 0.006, 0.2]).rotateX(-40).at(0, 0.058, 0.1),
    );
    const sabaton = sabatonFoot
      .smoothSubtract(0.003, toeLines.intersect(sdf.halfSpace([0, 0, -1], -0.04)))
      .paintWhere(sdf.halfSpace([0, 0, -1], -0.14), C.edge, 0.004)
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.012), C.sole)
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('greaves', sheen(pair(sdf.union(sdf.smoothUnion(0.01, greave, knee), sabaton))), PLATE);

    // ------------------------------------------------------------------ the runed greatsword in the right hand
    // Local frame: the guard at the origin, the blade up (+Y), the flat facing +Z. A broad black
    // blade with a diamond section, two pairs of hooked teeth near the guard, a long point, and
    // glowing runes down the middle of both flats.
    const bladeOutline = profile.polygon(
      [
        [-0.04, 0.0],
        [0.04, 0.0],
        [0.04, 0.03],
        [0.065, 0.05],
        [0.048, 0.064],
        [0.048, 0.092],
        [0.066, 0.11],
        [0.05, 0.124],
        [0.05, 0.29],
        [0.0, 0.365],
        [-0.05, 0.29],
        [-0.05, 0.124],
        [-0.066, 0.11],
        [-0.048, 0.092],
        [-0.048, 0.064],
        [-0.065, 0.05],
        [-0.04, 0.03],
      ],
      { smooth: false },
    );
    const T = 0.012;
    const W = 0.075;
    const bevel = (sx: number, sz: number) => sdf.halfSpace(norm([sx * T, 0, sz * W]), (T * W) / Math.hypot(T, W));
    const bladeLocal = sdf
      .extrude(bladeOutline, 0.024)
      .intersect(bevel(1, 1))
      .intersect(bevel(-1, 1))
      .intersect(bevel(1, -1))
      .intersect(bevel(-1, -1))
      .round(0.0012)
      .paintWhere(sdf.union(sdf.halfSpace([-1, 0, 0], -0.038), sdf.halfSpace([1, 0, 0], -0.038)), C.bladeEdge, 0.004);
    k.body('sword', swordPose(bladeLocal), { color: C.blade, roughness: 0.4, metalness: 0.7, detail: 0.003, bone: 'weapon' });
    const glyph = (pts: [number, number][], y: number) => sdf.extrude(profile.polygon(pts), 0.028).at(0, y, 0);
    const runesLocal = sdf.union(
      glyph([[0, -0.016], [0.01, 0], [0, 0.016], [-0.01, 0]], 0.065),
      glyph([[-0.011, -0.01], [0, 0.002], [0.011, -0.01], [0.011, 0.002], [0, 0.014], [-0.011, 0.002]], 0.115),
      sdf.union(sdf.extrude(profile.rect([0.006, 0.032], 0.002), 0.028), sdf.extrude(profile.rect([0.022, 0.006], 0.002), 0.028).at(0, 0.005, 0)).at(0, 0.165, 0),
      glyph([[0, -0.016], [0.01, 0], [0, 0.016], [-0.01, 0]], 0.215),
      glyph([[-0.011, 0.01], [0, -0.002], [0.011, 0.01], [0.011, -0.002], [0, -0.014], [-0.011, -0.002]], 0.262),
    );
    k.body('runes', swordPose(runesLocal), {
      color: SLOT.glowBase,
      roughness: 0.3,
      emissive: SLOT.glow,
      emissiveIntensity: 2.2,
      detail: 0.002,
      bone: 'weapon',
    });
    // The guard: a heavy block with two arms that hook toward the blade; a round pommel.
    const guardLocal = sdf.smoothUnion(
      0.006,
      sdf.chain(
        [
          [-0.104, 0.034, 0, 0.008],
          [-0.078, 0.004, 0, 0.015],
          [0.078, 0.004, 0, 0.015],
          [0.104, 0.034, 0, 0.008],
        ],
        0.006,
      ),
      sdf.box([0.07, 0.032, 0.034], 0.008),
    );
    const pommelLocal = sdf.sphere(0.023).at(0, -0.168, 0);
    k.body('hilt', swordPose(sdf.union(guardLocal, pommelLocal)), { color: C.blade, roughness: 0.4, metalness: 0.7, detail: 0.004, bone: 'weapon' });
    const gripLocal = sdf
      .capsule([0, -0.155, 0], [0, -0.01, 0], 0.017)
      .paintFn((_x, y, z, base) => (Math.sin(y * 260 + Math.atan2(z, _x) * 1) > 0.55 ? rgb(C.plateDark) : base));
    k.body('grip', swordPose(gripLocal), { color: SLOT.clothDark, roughness: 0.8, detail: 0.004, bone: 'weapon' });
    k.body('studs', buckle.bone('spine'), { color: C.edge, roughness: 0.4, metalness: 0.8, detail: 0.0035 });

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop, keys, reach, orient, edgeUp, quat, euler, follow } = motion;
    const LEG = 0.19;

    k.animation('idle', {
      duration: 2.4,
      pose: (_t, p) => ({
        hips: { move: [0, -0.003 * bump(p), 0] },
        chest: { rotate: [2 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        // A slow, menacing head turn.
        head: { rotate: [0, 6 * wave(p, 1, 0.25), 3 * wave(p, 1, 0.1)] },
        'upperarm.R': { rotate: [2 * wave(p, 1, 0.1), 0, -1.5 * bump(p)] },
        'forearm.R': { rotate: [-3 * bump(p), 0, 0] },
      }),
    });

    // The free arm swings; the sword arm swings little, so the long blade stays off the ground. The
    // legs come from motion.gait: planted stance sabatons, a knee lift in the swing, heel strike and
    // toe-off. `step` is the foot travel, `footLift` the swing height, `duty` the share of the cycle
    // a foot is down (the run has a flight between steps), `bob` the hips bob. The gait phase runs a
    // quarter cycle behind the clip, so the left heel strikes at p = 0.25, when the left arm is back.
    const stride = (duration: number, step: number, footLift: number, duty: number, bob: number, armSwing: number, lean: number) => ({
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
          heel: SOLE_HEEL,
          toe: SOLE_TOE,
          hips: { at: [0, 0.2, 0], rotate: hipsTurn },
        });
        return {
          ...legs.pose,
          hips: { move: [0, legs.hipsY, 0] as const, rotate: hipsTurn },
          spine: { rotate: [lean, 0, 0] as const },
          chest: { rotate: [lean * 0.5, -9 * s, 0] as const },
          head: { rotate: [-lean + 2 * wave(p, 2, 0.3), 5 * s, 1.5 * wave(p, 1, 0.2)] as const },
          'upperarm.L': { rotate: [armSwing * 0.5 * s, 0, 3] as const },
          'forearm.L': { rotate: [-armSwing * 0.2 * Math.max(0, -s), 0, 0] as const },
          // The sword arm lifts against the lean, so the blade keeps its height.
          'upperarm.R': { rotate: [-1.5 * lean - 2 - armSwing * 0.08 * s, 0, -4] as const },
        };
      },
    });
    // A heavy march: short steps with a low swing; the run is quicker with a flight phase.
    k.animation('walk', stride(0.95, 0.1, 0.025, 0.6, 0.006, 28, 3));
    k.animation('run', stride(0.58, 0.14, 0.04, 0.42, 0.025, 50, 12));

    // A two-handed overhead chop, solved by targets. The right wrist follows keys in the chest's
    // rest frame (reach); the blade follows its own keys (orient), and edgeUp turns the flat so
    // the edge leads. The chibi arms are short and the horned helmet is huge, so the wind-up leans
    // the upper body back and to the left and raises the sword high on the right, the blade always
    // in front of the horns, its tip above the crown. It holds, then comes down in front in 0.12 s
    // as the left fist closes on the grip behind the right one and the front foot steps in. The cut
    // ends low in front, holds, and recovers.
    const ease = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    const ARM_R = { root: mx(SHOULDER), mid: ELBOW_R, end: WRIST_R };
    const ARM_L = { root: SHOULDER, mid: ELBOW_L, end: WRIST_L };
    const GRIP_L = add(GUARD, GRIP_DIR, -0.045); // where the left fist closes on the grip, ahead of the right (rest)
    const bladeKeys = [
      [0, GRIP_DIR],
      [0.14, norm([-0.55, 0.15, 0.82])], // the blade comes up forward
      [0.26, norm([-0.4, 0.75, 0.52])],
      [0.34, norm([-0.3, 0.9, 0.3])], // the top: up on the right, in front of the horn
      [0.44, norm([-0.28, 0.92, 0.26])], // the hold
      [0.49, norm([-0.2, 0.75, 0.63])], // over and forward
      [0.52, norm([-0.1, 0.25, 0.96])],
      [0.555, norm([0.0, -0.08, 1])], // the impact: forward
      [0.6, norm([0.1, -0.18, 0.98])], // the follow-through, low in front, the tip off the floor
      [0.76, norm([0.1, -0.17, 0.98])],
      [0.88, norm([-0.4, -0.25, 0.88])],
      [1, GRIP_DIR],
    ] as const;
    const bladeAt = (p: number) => keys(p, bladeKeys, 'spline');
    k.animation('attack', {
      duration: 1.1,
      loop: false,
      pose: (_t, p) => {
        const wind = ease(0, 0.32, p) * (1 - ease(0.44, 0.53, p));
        const cut = ease(0.47, 0.58, p) * (1 - ease(0.78, 1, p));
        const grab = ease(0.44, 0.54, p) * (1 - ease(0.8, 0.95, p));
        const wrist = keys(
          p,
          [
            [0, WRIST_R],
            [0.14, [-0.232, 0.4, 0.1]],
            [0.26, [-0.245, 0.5, 0.06]],
            [0.34, [-0.25, 0.54, 0.04]],
            [0.44, [-0.25, 0.54, 0.03]],
            [0.49, [-0.2, 0.49, 0.1]],
            [0.52, [-0.12, 0.42, 0.14]],
            [0.555, [-0.05, 0.34, 0.15]],
            [0.6, [-0.03, 0.33, 0.15]],
            [0.76, [-0.03, 0.33, 0.15]],
            [0.88, [-0.16, 0.29, 0.13]],
            [1, WRIST_R],
          ] as const,
          'spline',
        );
        // The elbow points out to the right in the wind-up, then out and down through the chop.
        const pole = keys(p, [[0, ELBOW_R], [0.3, [-0.4, 0.4, 0.0]], [0.46, [-0.4, 0.4, 0.04]], [0.56, [-0.3, 0.25, 0.08]], [0.78, [-0.3, 0.25, 0.08]], [1, ELBOW_R]] as const);
        // The shoulder shrugs up in the wind-up; reach solves from the raised shoulder.
        const shrug: V3 = [0, 0.03 * wind, 0];
        const arm = reach(ARM_R, add(wrist, shrug, -1), add(pole, shrug, -1));
        // Fallback flat: at rest it faces the left side; through the swing too.
        const side = norm(keys(p, [[0, FLAT], [0.2, [1, 0, 0.2]], [0.8, [1, 0, 0.2]], [1, FLAT]] as const));
        const hand = orient([arm.upper, arm.lower], { dir: GRIP_DIR, up: FLAT }, { dir: norm(bladeAt(p)), up: edgeUp(bladeAt, p, side) });
        // The left fist closes on the grip behind the right one for the chop (solved in the chest's frame).
        const gripNow = add(follow([mx(SHOULDER), ELBOW_R, WRIST_R], [arm.upper, arm.lower, hand], GRIP_L), shrug);
        const ikL = reach(ARM_L, add(gripNow, [-0.006, 0.036, -0.018]), add(ELBOW_L, [0.12, -0.08, -0.04]));
        const freeU: V3 = [-24 * wind, 0, 16 * wind];
        const freeL: V3 = [-20 * wind, 0, 0];
        // The helmet jolts on the impact and settles.
        const bob = keys(p, [[0, 0], [0.56, 0], [0.62, 1], [0.72, -0.45], [0.82, 0.15], [0.92, 0]] as const);
        return {
          hips: { move: [0, -legDrop(LEG, 20 * cut) - 0.004 * wind, 0.03 * cut - 0.012 * wind], rotate: [0, -8 * wind + 12 * cut, 0] },
          // The upper body leans back and to the left, away from the raised sword, then drives down.
          spine: { rotate: [-7 * wind + 10 * cut, 0, -5 * wind] },
          chest: { rotate: [-6 * wind + 6 * cut, -8 * wind + 8 * cut, -6 * wind] },
          // The helmet turns toward the sword (the right horn goes back) and tips away from it.
          head: { rotate: [5 * wind - 12 * cut + 5 * bob, -14 * wind - 8 * cut, -8 * wind + 2 * bob] },
          'upperarm.R': { move: shrug, rotate: arm.upper },
          'forearm.R': { rotate: arm.lower },
          'hand.R': { rotate: hand },
          'upperarm.L': { rotate: lerp(freeU, ikL.upper, grab) },
          'forearm.L': { rotate: lerp(freeL, ikL.lower, grab) },
          // The front (left) foot steps in; the back leg pushes.
          'leg.L': { rotate: [3 * wind - 20 * cut, 0, 0] },
          'foot.L': { rotate: [-3 * wind + 20 * cut, 0, 0] },
          'leg.R': { rotate: [-3 * wind + 14 * cut, 0, 0] },
          'foot.R': { rotate: [3 * wind - 14 * cut, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ hit: a blow from the front
    // The chest snaps back and the helmet rocks on its neck. The hips give way over the planted
    // left foot and the right foot steps back, then all returns quickly.
    const DEG = Math.PI / 180;
    const SHIN = 0.125; // hip joint to ankle joint, in the Y-Z plane
    /** The leg angle (degrees) that keeps a foot on its rest spot when the hips move `back` meters. */
    const plant = (back: number) => Math.asin(Math.max(-1, Math.min(1, back / SHIN))) / DEG;
    k.animation('hit', {
      duration: 0.4,
      loop: false,
      pose: (_t, p) => {
        const h = keys(p, [[0, 0], [0.14, 1], [0.3, 0.8], [0.8, 0]] as const);
        const rattle = keys(p, [[0.06, 0], [0.14, 1], [0.22, -0.8], [0.3, 0.55], [0.38, -0.35], [0.46, 0.18], [0.56, 0]] as const);
        const lift = keys(p, [[0.04, 0], [0.13, 1], [0.24, 0], [0.5, 0], [0.62, 0.7], [0.74, 0]] as const);
        const back = 0.03 * h;
        const lean = plant(back);
        return {
          hips: { move: [0, -legDrop(SHIN, lean), -back], rotate: [0, 5 * h, 0] },
          spine: { rotate: [-6 * h, 0, 0] },
          chest: { rotate: [-12 * h, 6 * h, 2 * h] },
          neck: { rotate: [-8 * h + 2 * rattle, 0, 0] },
          head: { rotate: [-14 * h + 4 * rattle, 5 * rattle, 5 * rattle - 3 * h] },
          // The free arm flings out; the sword arm drops back a little.
          'upperarm.L': { rotate: [-6 * h, 0, 14 * h] },
          'forearm.L': { rotate: [-8 * h, 0, 0] },
          'upperarm.R': { rotate: [-4 * h, 0, -12 * h] },
          'forearm.R': { rotate: [8 * h, 0, 0] },
          'leg.L': { rotate: [-lean, 0, 0] },
          'foot.L': { rotate: [lean, 0, 0] },
          'leg.R': { rotate: [lean + 16 * lift, 0, 0] },
          'foot.R': { rotate: [-lean - 16 * lift, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ death: a stagger, then a collapse into a heap
    // The blow snaps the chest back and rocks the helmet; the knight sways, and its sword hand sags
    // and lets go. Then the knees buckle: the legs splay out in a V, the hips drop onto them, and the
    // spine folds forward into a heap. The `weapon` bone is placed in world space under its posed
    // parents.
    const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
    /** 0 to 1 from `a` to `b`, speeding up like a drop. */
    const fall = (a: number, b: number, x: number) => clamp01((x - a) / (b - a)) ** 2;
    const TRUNK: readonly V3[] = [[0, 0.2, 0], [0, 0.26, 0], [0, 0.33, 0]]; // hips, spine, chest pivots
    const SWORD_CHAIN: readonly V3[] = [...TRUNK, mx(SHOULDER), ELBOW_R, WRIST_R];
    const vec = (a: V3) => new THREE.Vector3(a[0], a[1], a[2]);
    const arr = (v: THREE.Vector3): V3 => [v.x, v.y, v.z];
    const chainQ = (rots: readonly V3[]) => rots.reduce((q, r) => q.multiply(quat(r)), new THREE.Quaternion());
    /** The move and rotate that put a bone's pivot (now at `now`) at `at` with the world turn `turn`. */
    const place = (parentQ: THREE.Quaternion, now: V3, at: V3, turn: THREE.Quaternion) => {
      const inv = parentQ.clone().invert();
      return { move: arr(vec(add(at, now, -1)).applyQuaternion(inv)), rotate: euler(inv.multiply(turn)) };
    };
    // Where the sword comes to rest: the guard; the blade lies flat, out to the right front.
    const SWORD_DOWN: V3 = [-0.34, 0.026, 0.3];
    const SWORD_TURN = quat(orient([], { dir: GRIP_DIR, up: FLAT }, { dir: norm([-0.6, 0, 0.8]), up: [0, 1, 0] }));
    const SPLAY = 70; // the legs' final splay, degrees
    k.animation('death', {
      duration: 1.4,
      loop: false,
      pose: (_t, p) => {
        const hitB = keys(p, [[0, 0], [0.06, 1], [0.16, 0.5], [0.3, 0.15], [0.36, 0]] as const);
        const rattle = keys(p, [[0.03, 0], [0.08, 1], [0.13, -0.8], [0.18, 0.6], [0.23, -0.35], [0.28, 0.15], [0.33, 0]] as const);
        const wob = keys(p, [[0.1, 0], [0.2, 1], [0.3, -0.4], [0.36, 0]] as const);
        const sag = keys(p, [[0.16, 0], [0.32, 1]] as const);
        // The collapse: the legs splay and the hips drop, faster and faster, to the impact at 0.52.
        const c = fall(0.3, 0.52, p);
        const bounce = keys(p, [[0.52, 0], [0.57, 1], [0.63, 0]] as const);
        const slump = keys(p, [[0.3, 0], [0.46, 0.6], [0.56, 1.12], [0.64, 1]] as const);
        const droop = keys(p, [[0.56, 0], [0.8, 1]] as const);
        const phi = SPLAY * c;
        const back = 0.03 * hitB;
        const lean = plant(back) * (1 - c);
        // The hips stay as high as the splayed feet need (the inner edge of each sole on the ground).
        const hipsY = 0.2 + 0.028 * Math.sin(phi * DEG) + 0.195 * (Math.cos(phi * DEG) - 1) + 0.005 * c;
        const hipsMove: V3 = [0, hipsY - 0.2 - legDrop(SHIN, lean) + 0.012 * bounce, -back * (1 - c) - 0.015 * c];
        const hipsR: V3 = [0, 10 * c, 0];
        const spineR: V3 = [-6 * hitB + 4 * sag + 24 * slump, 0, 5 * wob + 4 * slump];
        const chestR: V3 = [-12 * hitB + 3 * sag + 22 * slump, 6 * hitB + 6 * slump, 3 * wob + 6 * slump];
        const neckR: V3 = [-8 * hitB + 2 * rattle + 6 * slump, 0, 0];
        // The helmet stays on: it rocks, then sags to one side on the heap.
        const headR: V3 = [-16 * hitB + 4 * rattle + 6 * sag + 4 * slump, 6 * rattle + 10 * droop, 5 * rattle + 8 * wob - 16 * droop];
        // Limp arms: they fling in the blow, sag, then hang from the folded chest.
        const uaL: V3 = [-10 * hitB - 34 * slump, 0, 14 * hitB + 10 * slump];
        const faL: V3 = [-10 * hitB + 14 * slump, 0, 0];
        const uaR: V3 = [-4 * hitB - 34 * slump, 0, -12 * hitB - 10 * slump];
        const faR: V3 = [-6 * hitB - 16 * sag, 0, 0]; // the forearm lifts, so the long blade stays off the floor
        // The sword: the hand opens at 0.34 and the sword drops and lands flat at 0.48.
        const handRots = [hipsR, spineR, chestR, uaR, faR, [0, 0, 0] as V3];
        const handQ = chainQ(handRots);
        const guardNow = add(follow(SWORD_CHAIN, handRots, GUARD), hipsMove);
        const sw = fall(0.34, 0.48, p);
        const swT = keys(p, [[0.34, 0], [0.45, 1]] as const);
        const swB = keys(p, [[0.48, 0], [0.52, 1], [0.56, 0]] as const);
        const weapon = place(handQ, guardNow, add(lerp(guardNow, SWORD_DOWN, sw), [0, 0.015 * swB, 0]), handQ.clone().slerp(SWORD_TURN, swT));
        return {
          hips: { move: hipsMove, rotate: hipsR },
          spine: { rotate: spineR },
          chest: { rotate: chestR },
          neck: { rotate: neckR },
          head: { rotate: headR },
          'upperarm.L': { rotate: uaL },
          'forearm.L': { rotate: faL },
          'upperarm.R': { rotate: uaR },
          'forearm.R': { rotate: faR },
          weapon,
          // The legs splay out and forward in a V; the feet stay flat through the stagger.
          'leg.L': { rotate: [-lean, -28 * c, phi] },
          'leg.R': { rotate: [-lean, 28 * c, -phi] },
          'foot.L': { rotate: [lean, 0, 0] },
          'foot.R': { rotate: [lean, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ rise: the heap pulls itself together
    // The spawn clip. It starts on the last frame of `death` (the heap, the sword on the ground).
    // A short beat, then a shudder runs through the armor (0.45 s in all). The stand-up takes about
    // 0.85 s in three held stages: the torso sits up from the heap with both arms pushing on the
    // floor and the helmet lifts; the body leans forward and to the right into a crouch over the
    // half-closed legs, the right hand still on the floor; then it stands, and the sword flies up
    // into the hand. A sway and a slow nod settle it into the rest pose, ready to fight.
    // Times are in seconds. The heap values are the end of `death`.
    const RISE_D = 1.8;
    const SWORD_NEAR: V3 = [-0.26, 0.026, 0.22]; // the sword skids up to the planted right hand
    const FLOOR_L: V3 = [0.25, 0.075, 0.06]; // the planted wrists (the fists touch the floor)
    const FLOOR_R: V3 = [-0.2, 0.075, 0.12];
    const POLE_L = add(ELBOW_L, [0.2, 0, -0.08]); // the elbows point out and back (chest rest frame)
    const POLE_R = add(ELBOW_R, [-0.12, 0, -0.1]);
    /** Maps a world point into the chest's rest frame (where `reach` solves). */
    const toChest = (rots: readonly V3[], hipsMove: V3) => {
      const inv = chainQ(rots).invert();
      const at = add(follow([TRUNK[0]!, TRUNK[1]!], [rots[0]!, rots[1]!], TRUNK[2]!), hipsMove);
      return (w: V3): V3 => add(arr(vec(add(w, at, -1)).applyQuaternion(inv)), TRUNK[2]!);
    };
    k.animation('rise', {
      duration: RISE_D,
      loop: false,
      pose: (_t, p) => {
        const s = p * RISE_D;
        // Two off-beat shudders (a flip every 0.054 s): they grow, peak, and die out.
        const r = keys(s, [[0.08, 0], [0.134, 0.6], [0.188, -0.9], [0.242, 1], [0.296, -0.9], [0.35, 0.7], [0.404, -0.4], [0.45, 0]] as const, 'linear');
        const r2 = keys(s, [[0.107, 0], [0.161, -0.7], [0.215, 1], [0.269, -0.9], [0.323, 0.8], [0.377, -0.5], [0.431, 0.25], [0.47, 0]] as const, 'linear');
        // The stages: heap (to 0.42), sit (0.72), crouch (0.98 to 1.06), stand (1.3, a little past upright), rest (1.42).
        const spineK = keys(s, [[0.42, [28, 0, 4]], [0.72, [14, 0, 2]], [0.98, [26, 0, 12]], [1.06, [26, 0, 12]], [1.3, [-3, 0, 0]], [1.42, [0, 0, 0]]] as const);
        const chestK = keys(s, [[0.42, [25, 6, 6]], [0.72, [16, 3, 2]], [0.98, [26, 0, 10]], [1.06, [26, 0, 10]], [1.3, [-2, 0, 0]], [1.42, [0, 0, 0]]] as const);
        const neckK = keys(s, [[0.42, [6, 0, 0]], [0.72, [4, 0, 0]], [0.98, [3, 0, 0]], [1.3, [0, 0, 0]]] as const);
        // The helmet starts sagged on the heap, lifts, looks up at the player in the crouch, and
        // stays level against the lean.
        const headK = keys(s, [[0.42, [10, 10, -16]], [0.72, [-6, 0, -2]], [0.98, [-20, 0, -14]], [1.06, [-20, 0, -14]], [1.32, [0, 0, 0]]] as const);
        const c = keys(s, [[0.72, 1], [0.98, 0.72], [1.06, 0.72], [1.3, 0]] as const);
        const plantA = ease(0.38, 0.5, s);
        const relL = ease(0.8, 1.0, s);
        const relR = ease(1.06, 1.28, s);
        const catchL = keys(s, [[1.2, 0], [1.26, 1], [1.38, 0]] as const);
        const catchR = keys(s, [[1.3, 0], [1.36, 1], [1.48, 0]] as const);
        const sway = keys(s, [[1.42, 0], [1.52, 4], [1.64, -1.5], [1.76, 0]] as const);
        const nod = keys(s, [[1.46, 0], [1.56, 6], [1.66, -2], [1.76, 0]] as const);
        // The legs close from the death's V; the hips stay as high as the splayed feet need.
        const phi = SPLAY * c;
        const hipsY = 0.2 + 0.028 * Math.sin(phi * DEG) + 0.195 * (Math.cos(phi * DEG) - 1) + 0.005 * c;
        const hipsMove: V3 = [0, hipsY - 0.2, -0.015 * c];
        const hipsR: V3 = [0, 10 * c + 2 * r2, 0];
        const spineR = add(spineK, [3 * r, 0, 3 * r2]);
        const chestR = add(chestK, [sway, 3 * r, -2 * r2]);
        const neckR = neckK;
        const headR = add(headK, [nod + 2 * r, 2 * r2, 0]);
        // The limp arms of the heap plant on the floor (solved in the chest's frame) and push, then
        // come up to the rest pose: the left arm first; the right (sword) one leaves the floor last.
        const inChest = toChest([hipsR, spineR, chestR], hipsMove);
        const ikL = reach(ARM_L, inChest(FLOOR_L), POLE_L);
        const ikR = reach(ARM_R, inChest(FLOOR_R), POLE_R);
        const uaL = add(lerp(lerp([-34, 0, 10], ikL.upper, plantA), [0, 0, 0], relL), [5 * r2, 0, 3 * r2]);
        const faL = add(lerp(lerp([14, 0, 0], ikL.lower, plantA), [0, 0, 0], relL), [6 * catchL, 0, 0]);
        const uaR = add(lerp(lerp([-34, 0, -10], ikR.upper, plantA), [0, 0, 0], relR), [5 * r, 0, -3 * r]);
        const faR = add(lerp(lerp([30, 0, 0], ikR.lower, plantA), [0, 0, 0], relR), [8 * catchR, 0, 0]);
        // The sword jitters, skids up to the planted hand, and rises into it as the hand leaves the floor.
        const handRots = [hipsR, spineR, chestR, uaR, faR, [0, 0, 0] as V3];
        const handQ = chainQ(handRots);
        const guardNow = add(follow(SWORD_CHAIN, handRots, GUARD), hipsMove);
        const sw = ease(1.04, 1.3, s);
        const swArc = Math.sin(Math.PI * clamp01((s - 1.04) / 0.26));
        const swordGround = add(lerp(SWORD_DOWN, SWORD_NEAR, ease(0.8, 0.98, s)), [0, 0.006 * Math.abs(r), 0]);
        const swordAt = add(lerp(swordGround, guardNow, sw), [0, 0.16 * swArc, 0]);
        const swordTurn = quat([0, 4 * r2 - 12 * ease(0.8, 0.98, s), 0]).multiply(SWORD_TURN).slerp(handQ, ease(1.1, 1.3, s));
        const weapon = place(handQ, guardNow, swordAt, swordTurn);
        return {
          hips: { move: hipsMove, rotate: hipsR },
          spine: { rotate: spineR },
          chest: { rotate: chestR },
          neck: { rotate: neckR },
          head: { rotate: headR },
          'upperarm.L': { rotate: uaL },
          'forearm.L': { rotate: faL },
          'upperarm.R': { rotate: uaR },
          'forearm.R': { rotate: faR },
          weapon,
          'leg.L': { rotate: [0, -28 * c + 3 * r, phi] },
          'leg.R': { rotate: [0, 28 * c - 3 * r2, -phi] },
        };
      },
    });
  },
});
