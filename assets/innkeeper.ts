import * as THREE from 'three';
import { defineAsset, motion, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Innkeeper — Chibi Quest settlement NPC (catalog `npcs/settlement/innkeeper`), about 1.0 m to the
 * top of her hair bun, faces +Z. Target: docs/npc-mockups/innkeeper_001.jpg (made with mmx; one
 * front view). Built on the farmer (the rogue's head and skeleton, with the adventurer's face).
 *
 * Role: a town NPC (the tavern), seen in 3D and as a 128 px sprite; the bun, the green dress, the
 *   white apron, and the foaming tankard on its tray must read.
 * One idea: a cheerful, round innkeeper with her hair up in a bun and a white bow, in a sage-green
 *   dress and a white apron, carrying a big foaming tankard on a wooden tray.
 * Proportions: the rogue's (head center 0.675, eyes 0.628, shoulders 0.385, waist 0.27); the bun to
 *   1.0; the skirt hem at 0.13; the tray at 0.31, out at her right hand.
 * Shape language: round and soft everywhere (bun, puffed sleeves, bell skirt, barrel tankard), with
 *   the flat disc of the tray.
 * Palette (60/30/10): sage green #92ad6c (dress); cream #f3ead6 (apron, collar, cuffs, socks, bow);
 *   chestnut hair and brown shoes and tray; honey #e2aa4a tankard and white foam.
 * Value plan: the light face framed by the dark hair is the focal point; the green dress and the
 *   white apron are the two big masses; the white foam is the second accent.
 * Bodies: skin, hair, ribbon, dress, apron, leggings, shoes, tray, tankard, foam.
 * Rig: the rogue's skeleton; the tray and the tankard are rigid on `hand.R`, kept level in every
 *   clip. Clips: idle, walk, run, work (serving: she offers the tankard with a small bow), talk, wave.
 */

const C = {
  skin: '#f2c7a4',
  blush: '#f08a7c',
  eyeWhite: '#f6f1ea',
  irisRim: '#1e120a',
  iris: '#6e2c1e',
  irisLow: '#b0503a',
  pupil: '#110d0b',
  lid: '#1c130f',
  brow: '#5a3020',
  mouth: '#7a2a26',
  tongue: '#d8706a',
  teeth: '#fbf6ee',
  hair: '#6a3a22',
  hairDark: '#4a2616',
  dress: '#8fa86e',
  dressDark: '#6f8a4e',
  cream: '#f3ead6',
  ribbon: '#f8f2e6',
  legging: '#4a3a32',
  shoe: '#7a4a2c',
  sole: '#3e2618',
  strap: '#c89a48',
  tray: '#8a5a36',
  tankard: '#e2aa4a',
  hoop: '#7a4a2c',
  foam: '#fbf7ec',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.105, 0.628] as const;
const pair = (s: sdf.Shape) => s.mirror('x');
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// Joints: the right forearm points forward with the tray flat on the palm; the left arm hangs a
// little out from the side, the hand open.
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW_L: V3 = [0.19, 0.334, 0.014];
const WRIST_L: V3 = [0.24, 0.27, 0.045];
const ELBOW_R: V3 = [-0.185, 0.312, -0.015];
const WRIST_R: V3 = [-0.252, 0.29, 0.06];
const HIP: V3 = [0.068, 0.195, 0];
const ANKLE: V3 = [0.098, 0.07, 0];
const KNEE: V3 = [0.083, 0.1325, 0]; // the knee: splits the leg (shin.L takes the weight below it)
// The tray's center, on the bottom face (it rests on the right palm).
const TRAY: V3 = [-0.275, 0.309, 0.112];

const HIPS_P: V3 = [0, 0.2, 0];
const ease = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** A relaxed open hand hanging from the wrist `w`: the palm turned in, the thumb forward. */
const openHand = (w: V3) =>
  sdf.smoothUnion(
    0.014,
    sdf.ellipsoid([0.021, 0.044, 0.036]).rotateZ(16).at(w[0] + 0.012, w[1] - 0.036, w[2] + 0.006),
    sdf.cone([w[0] - 0.004, w[1] - 0.018, w[2] + 0.028], [w[0] + 0.0, w[1] - 0.042, w[2] + 0.05], 0.013, 0.01), // thumb
  );
/** A flat hand, palm up, under the tray: the fingers point along the forearm. */
const trayHand = (w: V3) =>
  sdf.smoothUnion(
    0.014,
    sdf.ellipsoid([0.034, 0.014, 0.046]).rotateY(-38).at(w[0] - 0.017, w[1] + 0.005, w[2] + 0.034),
    sdf.cone([w[0] + 0.008, w[1] + 0.0, w[2] + 0.02], [w[0] + 0.02, w[1] + 0.008, w[2] + 0.05], 0.013, 0.01), // thumb
  );

export default defineAsset({
  name: 'innkeeper',
  description: 'Chibi innkeeper NPC: a hair bun with a white bow, a sage-green dress, a white apron, and a foaming tankard on a wooden tray.',
  detail: 0.005,
  reference: 'docs/npc-mockups/innkeeper_001.jpg',
  // Color slots for individual innkeepers (the first option is the default look). The clothing slot
  // is the dress; the apron, the collar, the cuffs, the bow, and the tankard keep their colors.
  variants: {
    eyes: { brown: C.iris, blue: '#2f6aa8', green: '#3d7a35' },
    hair: { brown: C.hair, blond: '#c4974a', auburn: '#8a4228' },
    skin: { fair: C.skin, tan: '#d49a72', brown: '#8a5a3e' },
    // Tavern dyes in the sage's soft, faded family: wine red, walnut brown, ochre.
    clothing: { green: C.dress, wine: '#9c5a5c', walnut: '#8c6a4c', ochre: '#bf9a52' },
  },
  presets: {
    alewife: { eyes: 'green', hair: 'auburn', skin: 'fair', clothing: 'wine' },
    hostess: { eyes: 'blue', hair: 'blond', skin: 'tan', clothing: 'ochre' },
    landlady: { eyes: 'brown', hair: 'brown', skin: 'brown', clothing: 'walnut' },
  },

  build(k) {
    // The slot colors (see variants): shades of a slot follow it when a game recolors the slot.
    const T = {
      iris: k.tint('eyes'),
      irisLow: k.tint('eyes', { color: C.irisLow, follow: 1 }),
      hair: k.tint('hair'),
      hairDark: k.tint('hair', { color: C.hairDark, follow: 1 }),
      brow: k.tint('hair', { color: C.brow, follow: 1 }),
      skin: k.tint('skin'),
      blush: k.tint('skin', { color: C.blush, follow: 0.5 }),
      nose: k.tint('skin', { color: '#f0a090', follow: 0.5 }),
      mouth: k.tint('skin', { color: C.mouth, follow: 0.5 }),
      tongue: k.tint('skin', { color: C.tongue, follow: 0.5 }),
      dress: k.tint('clothing'),
      dressDark: k.tint('clothing', { color: C.dressDark, follow: 1 }),
    };
    // ------------------------------------------------------------------ skeleton
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
    });

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
    const nose = sdf.ellipsoid([0.022, 0.018, 0.016]).at(0, 0.57, faceZ(0, 0.57) - 0.002).bone('head');
    const ears = pair(
      sdf
        .ellipsoid([0.03, 0.048, 0.034])
        .subtract(sdf.sphere(0.019).at(0.018, 0, 0.008))
        .rotateY(-15)
        .at(0.2, 0.61, -0.005)
        .bone('head'),
    );
    const neck = sdf.capsule([0, 0.42, -0.01], [0, 0.52, -0.01], 0.05).bone('neck');
    const armL = sdf.smoothUnion(
      0.02,
      sdf.cone(SHOULDER, ELBOW_L, 0.04, 0.036).bone('upperarm.L'),
      sdf.cone(ELBOW_L, WRIST_L, 0.036, 0.031).bone('forearm.L'),
      openHand(WRIST_L).bone('hand.L'),
    );
    const armR = sdf.smoothUnion(
      0.02,
      sdf.cone(mx(SHOULDER), ELBOW_R, 0.04, 0.036).bone('upperarm.R'),
      sdf.cone(ELBOW_R, WRIST_R, 0.036, 0.031).bone('forearm.R'),
      trayHand(WRIST_R).bone('hand.R'),
    );

    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const eyeWhite = pair(at(sdf.ellipsoid([0.052, 0.056, 0.07]), EYE[0], EYE[1]));
    const irisRim = pair(at(sdf.ellipsoid([0.042, 0.049, 0.07]), EYE[0], EYE[1] - 0.004));
    const iris = pair(at(sdf.ellipsoid([0.036, 0.043, 0.07]), EYE[0], EYE[1] - 0.006));
    const irisLow = iris.intersect(sdf.halfSpace([0, 1, 0], EYE[1] - 0.02));
    const pupil = pair(at(sdf.ellipsoid([0.026, 0.029, 0.07]), EYE[0], EYE[1] + 0.002));
    // A bold upper lash line with two flicks at the outer corner.
    const lid = pair(
      sdf.union(
        sdf.extrude(profile.arc(0.05, 0.015, 12, 168), 0.3).at(EYE[0], EYE[1] - 0.004, 0.1),
        sdf.box([0.024, 0.008, 0.3], 0.003).rotateZ(28).at(EYE[0] + 0.058, EYE[1] + 0.022, 0.1),
        sdf.box([0.02, 0.007, 0.3], 0.003).rotateZ(55).at(EYE[0] + 0.046, EYE[1] + 0.04, 0.1),
      ),
    );
    const shine = sdf.union(
      ...[EYE[0], -EYE[0]].flatMap((x) => [at(sdf.sphere(0.012), x + 0.016, EYE[1] + 0.019), at(sdf.sphere(0.006), x - 0.014, EYE[1] - 0.022)]),
    );
    const brows = pair(sdf.extrude(profile.arc(0.1, 0.018, 62, 116), 0.3).at(0.1, 0.735 - 0.1, 0.1));
    // A wide open smile: a half ellipse with the upper teeth and the tongue.
    const MOUTH_Y = 0.55;
    const mouthOpen = sdf
      .extrude(profile.circle(0.042), 0.3)
      .scale([1, 0.74, 1])
      .at(0, MOUTH_Y, 0.1)
      .intersect(sdf.halfSpace([0, 1, 0], MOUTH_Y));
    const teeth = sdf.box([0.028, 0.008, 0.3], 0.002).at(0, MOUTH_Y - 0.004, 0.1).intersect(mouthOpen);
    const tongue = sdf.extrude(profile.circle(0.018), 0.3).at(0, MOUTH_Y - 0.043, 0.1).intersect(mouthOpen);
    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.012, nose, ears)
      .union(armL, armR)
      .paintWhere(pair(at(sdf.sphere(0.042), 0.14, 0.565)), T.blush, 0.032)
      .paintWhere(eyeWhite, C.eyeWhite)
      .paintWhere(irisRim, C.irisRim)
      .paintWhere(iris, T.iris)
      .paintWhere(irisLow, T.irisLow, 0.012)
      .paintWhere(pupil, C.pupil)
      .paintWhere(lid, C.lid)
      .paintWhere(shine, '#ffffff')
      .paintWhere(brows, T.brow)
      .paintWhere(mouthOpen, T.mouth)
      .paintWhere(teeth, C.teeth)
      .paintWhere(tongue, T.tongue, 0.004)
      .paintWhere(sdf.sphere(0.02).at(0, 0.57, faceZ(0, 0.57) + 0.03), T.nose, 0.015); // a rosy nose tip
    k.body('skin', skin, { color: T.skin, roughness: 0.55, textureDensity: 2 });

    // ------------------------------------------------------------------ hair: a cap, swept bangs, side locks, a top bun
    const cap = sdf
      .ellipsoid([HEAD[0] + 0.014, HEAD[1] + 0.016, HEAD[2] + 0.014])
      .at(0, HEAD_Y + 0.01, -0.012)
      .smoothSubtract(0.015, sdf.ellipsoid([0.25, 0.17, 0.23]).at(0, 0.62, 0.15));
    // Bangs parted in the middle and swept out to both sides, ending in points above the ears.
    const wing = sdf.chain(
      [
        [0.012, 0.875, 0.1, 0.04],
        [0.08, 0.845, 0.122, 0.042],
        [0.15, 0.79, 0.105, 0.036],
        [0.205, 0.745, 0.065, 0.026],
        [0.245, 0.722, 0.03, 0.011],
      ],
      0.02,
    );
    const centerLock = sdf.cone([0.005, 0.86, 0.14], [-0.012, 0.772, 0.182], 0.03, 0.011);
    // Two locks that fall from the part onto the forehead, one on each side of the center lock.
    const foreLock = sdf.chain(
      [
        [0.03, 0.865, 0.13, 0.03],
        [0.07, 0.8, 0.163, 0.024],
        [0.085, 0.765, 0.158, 0.012],
      ],
      0.01,
    );
    // Side locks in front of the ears, down to the jaw, curling in at the tips.
    const sideLock = sdf.chain(
      [
        [0.18, 0.75, 0.06, 0.034],
        [0.205, 0.65, 0.07, 0.03],
        [0.205, 0.57, 0.06, 0.022],
        [0.182, 0.515, 0.055, 0.012],
      ],
      0.015,
    );
    const bun = sdf
      .smoothUnion(
        0.03,
        sdf.ellipsoid([0.108, 0.074, 0.094]).at(0, 0.938, -0.03),
        pair(sdf.ellipsoid([0.062, 0.052, 0.064]).rotateZ(-22).at(0.075, 0.915, -0.03)),
      )
      .paintFn((x, y, z, base) => (Math.sin(Math.atan2(x, z + 0.03) * 6 + y * 90) > 0.9 ? rgb(T.hairDark) : base));
    const hair = sdf
      .smoothUnion(0.02, cap, pair(wing), centerLock, pair(foreLock), pair(sideLock))
      .paintFn((x, y, z, base) => (Math.sin(x * 70 + z * 30 - y * 40) > 0.93 ? rgb(T.hairDark) : base))
      .smoothUnion(0.025, bun);
    k.body('hair', hair.bone('head'), { color: T.hair, roughness: 0.6, detail: 0.004 });

    // ------------------------------------------------------------------ ribbon: the bow on the bun and a headband
    const bow = sdf.smoothUnion(
      0.006,
      pair(sdf.ellipsoid([0.038, 0.022, 0.016]).rotateZ(12).at(0.036, 0.952, 0.062)),
      sdf.sphere(0.015).at(0, 0.95, 0.07),
    );
    const band = cap
      .round(0.006)
      .smoothIntersect(0.003, sdf.box([0.7, 0.7, 0.022], 0.004).rotateX(22).at(0, 0.78, 0.02))
      .intersect(sdf.halfSpace([0, -1, 0], -0.64));
    k.body('ribbon', sdf.union(bow, band).bone('head'), { color: C.ribbon, roughness: 0.7, detail: 0.004 });

    // ------------------------------------------------------------------ dress: a bodice, puffed sleeves, a pleated bell skirt
    const bodice = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.47],
            [0.07, 0.465],
            [0.107, 0.44],
            [0.128, 0.4],
            [0.136, 0.35],
            [0.13, 0.3],
            [0.125, 0.27],
            [0.12, 0.25],
            [0, 0.25],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.82]);
    const skirtBase = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.29],
            [0.128, 0.29],
            [0.133, 0.265],
            [0.146, 0.23],
            [0.158, 0.19],
            [0.166, 0.155],
            [0.167, 0.138],
            [0.157, 0.13],
            [0, 0.13],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.86]);
    const pleats = (x: number, y: number, z: number) => Math.sin(Math.atan2(x, z) * 11) * Math.min(1, Math.max(0, (0.27 - y) / 0.1));
    const skirt = skirtBase.displace(0.005, pleats);
    const puff = (s: V3, e: V3, tag: string) =>
      sdf
        .smoothUnion(0.02, sdf.ellipsoid([0.056, 0.05, 0.054]).at(...lerp([s[0] * 0.95, 0.395, 0], e, 0.3)), sdf.cone([s[0] * 0.85, 0.405, 0], lerp(s, e, 0.8), 0.05, 0.046))
        .bone(tag);
    const dress = sdf
      .union(
        bodice.intersect(sdf.halfSpace([0, -1, 0], -0.33)).bone('chest'),
        bodice.intersect(sdf.halfSpace([0, 1, 0], 0.33)).bone('spine'),
        skirt.bone('hips'),
        puff(SHOULDER, ELBOW_L, 'upperarm.L'),
        puff(mx(SHOULDER), ELBOW_R, 'upperarm.R'),
      )
      .paintFn((x, y, z, base) => (y < 0.25 && pleats(x, y, z) < -0.75 ? rgb(T.dressDark) : base));
    k.body('dress', dress, { color: T.dress, roughness: 0.85 });

    // ------------------------------------------------------------------ apron, collar, and sleeve cuffs (cream linen)
    const apronOutline = profile.polygon(
      [
        [-0.09, 0.27],
        [0.09, 0.27],
        [0.118, 0.16],
        [0.1, 0.145],
        [0.06, 0.152],
        [0.02, 0.142],
        [-0.02, 0.15],
        [-0.06, 0.142],
        [-0.1, 0.15],
        [-0.118, 0.16],
      ],
      { smooth: false },
    );
    const panel = skirtBase
      .round(0.011)
      .subtract(skirtBase.round(0.005))
      .smoothIntersect(0.004, sdf.extrude(apronOutline, 0.6, 0.008).at(0, 0, 0.3))
      .intersect(sdf.halfSpace([0, 0, -1], 0));
    const waistband = bodice
      .round(0.008)
      .subtract(bodice.round(0.001))
      .smoothIntersect(0.004, sdf.box([0.5, 0.026, 0.5], 0.006).at(0, 0.272, 0));
    const collar = sdf.smoothUnion(
      0.01,
      sdf.torus(0.052, 0.011).at(0, 0.45, -0.006),
      pair(sdf.ellipsoid([0.04, 0.013, 0.032]).rotateX(35).rotateZ(-20).at(0.036, 0.424, 0.086)),
    );
    const cuff = (s: V3, e: V3, tag: string) => sdf.cone(lerp(s, e, 0.74), lerp(s, e, 0.92), 0.046, 0.045).round(0.005).bone(tag);
    const apron = sdf.union(
      panel.bone('hips'),
      waistband.bone('spine'),
      collar.bone('chest'),
      cuff(SHOULDER, ELBOW_L, 'upperarm.L'),
      cuff(mx(SHOULDER), ELBOW_R, 'upperarm.R'),
    );
    k.body('apron', apron, { color: C.cream, roughness: 0.9 });

    // ------------------------------------------------------------------ leggings with cream sock cuffs
    const legs = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.11, 0.055, 0.085]).at(0, 0.2, 0).bone('hips'),
      pair(
        sdf
          .smoothUnion(
            0.008,
            sdf.capsule([HIP[0], 0.2, 0], [0.096, 0.06, 0.004], 0.042),
            sdf.cylinder(0.048, 0.034, 0.012).at(0.096, 0.083, 0.004).paint(C.cream), // the rolled sock
          )
          .bone('leg.L'),
      ),
    );
    k.body('leggings', legs, { color: C.legging, roughness: 0.85 });

    // ------------------------------------------------------------------ shoes: low, round, with a gold strap
    const shoeFoot = sdf
      .smoothUnion(0.03, sdf.cylinder(0.05, 0.064, 0.018).at(0, 0.034, 0), sdf.ellipsoid([0.056, 0.045, 0.098]).at(0, 0.04, 0.042))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const strap = sdf.box([0.2, 0.2, 0.02], 0.004).rotateX(-28).at(0, 0.07, 0.036).intersect(sdf.halfSpace([0, -1, 0], -0.03));
    const shoe = shoeFoot
      .paintWhere(strap, C.strap, 0.002)
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.014), C.sole)
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('shoes', pair(shoe), { color: C.shoe, roughness: 0.55 });

    // ------------------------------------------------------------------ the tray and the tankard (rigid on the right hand)
    // Local frame: the tray's bottom center at the origin; the tankard stands in its middle.
    const trayPose = (s: sdf.Shape) => s.at(...TRAY);
    const trayShape = sdf.union(sdf.cylinder(0.092, 0.014, 0.005).at(0, 0.007, 0), sdf.torus(0.087, 0.0065).at(0, 0.015, 0));
    const TK = 0.012; // (x 1.15 = 0.014) // the tankard's base on the tray
    const barrel = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0],
            [0.05, 0],
            [0.056, 0.012],
            [0.062, 0.06],
            [0.059, 0.11],
            [0.053, 0.126],
            [0, 0.126],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .at(0, TK, 0);
    const hoops = barrel.round(0.004).smoothIntersect(
      0.003,
      sdf.union(sdf.box([0.3, 0.014, 0.3]).at(0, TK + 0.03, 0), sdf.box([0.3, 0.012, 0.3]).at(0, TK + 0.1, 0)),
    );
    const handle = sdf
      .torus(0.03, 0.009)
      .rotateX(90)
      .at(0.058, TK + 0.068, 0)
      .intersect(sdf.halfSpace([-1, 0, 0], -0.05))
      .rotateY(-35);
    const big = (s: sdf.Shape) => s.scale(1.15);
    k.body('tray', trayPose(sdf.union(trayShape, big(sdf.union(hoops, handle)))), { color: C.tray, roughness: 0.6, detail: 0.004, bone: 'hand.R' });
    k.body('tankard', trayPose(big(barrel).paintFn((x, _y, z, base) => (Math.sin(Math.atan2(x, z) * 14) > 0.93 ? [base[0] * 0.82, base[1] * 0.78, base[2] * 0.7] : base))), { color: C.tankard, roughness: 0.45, detail: 0.004, bone: 'hand.R' });
    const foam = sdf
      .smoothUnion(
        0.018,
        sdf.ellipsoid([0.066, 0.028, 0.066]).at(0, TK + 0.13, 0),
        sdf.sphere(0.032).at(0.018, TK + 0.152, 0.012),
        sdf.sphere(0.026).at(-0.026, TK + 0.148, -0.014),
        sdf.capsule([0.056, TK + 0.12, 0.024], [0.064, TK + 0.086, 0.026], 0.013),
        sdf.capsule([-0.04, TK + 0.12, 0.046], [-0.045, TK + 0.092, 0.05], 0.011),
        sdf.capsule([0.008, TK + 0.12, 0.06], [0.01, TK + 0.098, 0.064], 0.01),
      )
      .displace(0.003, (x, y, z) => noise.fbm(x * 80, y * 80, z * 80, 2));
    k.body('foam', trayPose(big(foam)), { color: C.foam, roughness: 0.9, detail: 0.004, bone: 'hand.R' });

    // ------------------------------------------------------------------ animation
    const { wave, bump, reach, orient } = motion;
    const ARM_L = { root: SHOULDER, mid: ELBOW_L, end: WRIST_L };
    const ARM_R = { root: mx(SHOULDER), mid: ELBOW_R, end: WRIST_R };
    // The hand's rotation that keeps the tray level in the world, given the rotations above it
    // (hips, spine, chest, upper arm, forearm).
    const level = (body: readonly V3[], arm: readonly V3[]): V3 => {
      let q = new THREE.Quaternion();
      for (const r of body) q = q.multiply(motion.quat(r));
      const inv = q.invert();
      const up = new THREE.Vector3(0, 1, 0).applyQuaternion(inv);
      const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(inv);
      return orient([...arm], { dir: [0, 1, 0], up: [0, 0, 1] }, { dir: [up.x, up.y, up.z], up: [fwd.x, fwd.y, fwd.z] });
    };

    k.animation('idle', {
      duration: 2.4,
      pose: (_t, p) => {
        const chest: V3 = [2.5 * wave(p), 0, 0];
        const upper: V3 = [1 * wave(p, 1, 0.1), 0, -1 * bump(p)];
        return {
          hips: { move: [0, -0.003 * bump(p), 0] },
          chest: { rotate: chest },
          neck: { rotate: [-1.5 * wave(p), 0, 0] },
          // A slow, easy look around the room.
          head: { rotate: [1.5 * wave(p, 3), 7 * wave(p, 1, 0.25), 2 * wave(p, 1, 0.1)] },
          'upperarm.L': { rotate: [2 * wave(p, 1, 0.1), 0, 3 * bump(p)] },
          'forearm.L': { rotate: [-5 * bump(p), 0, 0] },
          'upperarm.R': { rotate: upper },
          'hand.R': { rotate: level([chest], [upper]) },
        };
      },
    });

    // A careful tavern walk. The legs come from motion.gait: planted stance feet, a knee lift in the
    // swing, heel strike and toe-off. The gait phase runs a quarter cycle behind the clip, so the left
    // heel strikes at p = 0.25, when the left arm is back. The sole points are the shoe's heel and toe.
    // The tray arm swings little and the hand keeps the tray level.
    const stride = (duration: number, step: number, lift: number, duty: number, hop: number, armSwing: number, lean: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        const hipsTurn = [0, 7 * s, 0] as const;
        const legs = motion.gait(p - 0.25, { hip: HIP, knee: KNEE, ankle: ANKLE }, {
          stride: step,
          lift,
          duty,
          bob: hop,
          roll: 10,
          heel: [0.092, 0, -0.022],
          toe: [0.112, 0, 0.078],
          hips: { at: HIPS_P, rotate: hipsTurn },
        });
        const spine: V3 = [lean, 0, 0];
        const chest: V3 = [lean * 0.5, -10 * s, 0];
        const upper: V3 = [-armSwing * 0.12 * s, 0, -3];
        return {
          ...legs.pose,
          hips: { move: [0, legs.hipsY, 0] as const, rotate: hipsTurn },
          spine: { rotate: spine },
          chest: { rotate: chest },
          head: { rotate: [-lean, 5 * s, 0] as const },
          'upperarm.L': { rotate: [armSwing * s, 0, 6] as const },
          'forearm.L': { rotate: [-armSwing * 0.5 - armSwing * 0.4 * Math.max(0, -s), 0, 0] as const },
          'upperarm.R': { rotate: upper },
          'hand.R': { rotate: level([hipsTurn, spine, chest], [upper]) },
        };
      },
    });
    k.animation('walk', stride(0.9, 0.1, 0.025, 0.6, 0.006, 24, 3));
    k.animation('run', stride(0.58, 0.13, 0.035, 0.42, 0.02, 40, 8));

    // Work: serving a drink, a 2.4 s loop. She brings the tray forward to offer the tankard, bows a
    // little with a nod, and opens the left hand to the drink ("enjoy!"), then draws the tray back.
    //   0.00-0.08 rest   0.08-0.36 the tray comes forward and up   0.2-0.42 the bow and the nod
    //   0.3-0.5 the left hand opens toward the tankard   0.58-0.92 back to the rest pose.
    // The wrist targets are in the chest's rest frame, so the bow and the turn carry the arms.
    const OFFER_R: V3 = [-0.225, 0.32, 0.14];
    const OPEN_L: V3 = [0.13, 0.3, 0.14];
    k.animation('work', {
      duration: 2.4,
      pose: (_t, p) => {
        const offer = ease(0.08, 0.36, p) * (1 - ease(0.62, 0.92, p));
        const bow = ease(0.2, 0.42, p) * (1 - ease(0.58, 0.8, p));
        const open = ease(0.28, 0.5, p) * (1 - ease(0.6, 0.86, p));
        const spine: V3 = [4 * bow, 7 * offer, 0];
        const chest: V3 = [3 * bow, 6 * offer, 0];
        const armR = reach(ARM_R, lerp(WRIST_R, OFFER_R, offer), [-0.45, 0.2, -0.2]);
        const armL = reach(ARM_L, lerp(WRIST_L, OPEN_L, open), [0.45, 0.2, -0.15]);
        return {
          hips: { move: [0, -0.002 * bow, 0] },
          spine: { rotate: spine },
          chest: { rotate: chest },
          neck: { rotate: [3 * bow, 0, 0] },
          // The chest turns the tray side forward; the head turns back to the guest, nods, and tilts to her
          // left, away from the tankard.
          head: { rotate: [5 * bow, -10 * offer, -5 * offer] },
          'upperarm.R': { rotate: armR.upper },
          'forearm.R': { rotate: armR.lower },
          'hand.R': { rotate: level([spine, chest], [armR.upper, armR.lower]) },
          'upperarm.L': { rotate: armL.upper },
          'forearm.L': { rotate: armL.lower },
          'hand.L': { rotate: [-30 * open, 50 * open, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ villager clips: talk and wave
    // Talk: a friendly chat with someone in front. She nods and turns her head, and the left hand
    // makes two palm-up points in front of the chest. The tray stays level on her right hand.
    k.animation('talk', {
      duration: 2.2,
      pose: (_t, p) => {
        const beat = bump(p, 2, 0.1);
        const sweep = wave(p, 1, 0.1);
        const wrist: V3 = [0.13 + 0.04 * sweep, 0.315 + 0.035 * beat, 0.14 + 0.01 * wave(p, 2)];
        const arm = reach(ARM_L, wrist, [0.35, 0.2, -0.12]);
        const spine: V3 = [1.5, 0, -1.5 - 0.7 * wave(p, 1, 0.3)];
        const chest: V3 = [1.2 * beat, 0, 0];
        return {
          hips: { move: [0, -0.002 * bump(p, 2), 0] },
          spine: { rotate: spine },
          chest: { rotate: chest },
          neck: { rotate: [-1.5, 0, 0] },
          head: { rotate: [4 * bump(p, 2, 0.2) - 1.5, 8 * wave(p, 1, 0.35), -2 - 1.5 * bump(p, 1, 0.1)] },
          'upperarm.L': { rotate: arm.upper },
          'forearm.L': { rotate: arm.lower },
          'hand.L': { rotate: [-8 - 8 * beat, 30 + 14 * sweep, 0] },
          'hand.R': { rotate: level([spine, chest], []) },
        };
      },
    });

    // Wave: a greeting. The left hand comes up out to the side, beside the cheek, waves two and a half
    // times, and comes down. The tray arm stays still.
    const RAISED: V3 = [0.245, 0.46, 0.09];
    const POLE_REST: V3 = [0.43, 0.535, 0];
    const POLE_UP: V3 = [0.45, 0.22, -0.1];
    k.animation('wave', {
      duration: 1.2,
      loop: false,
      pose: (_t, p) => {
        const up = ease(0.02, 0.24, p) * (1 - ease(0.8, 1, p));
        const waving = ease(0.18, 0.28, p) * (1 - ease(0.72, 0.82, p));
        const side = waving * Math.sin(((p - 0.2) / 0.6) * Math.PI * 5);
        const bulge = Math.sin(Math.PI * up);
        const wrist: V3 = [
          WRIST_L[0] + (RAISED[0] - WRIST_L[0]) * up + 0.05 * bulge + 0.022 * side,
          WRIST_L[1] + (RAISED[1] - WRIST_L[1]) * up - 0.02 * bulge - 0.006 * Math.abs(side),
          WRIST_L[2] + (RAISED[2] - WRIST_L[2]) * up + 0.02 * bulge,
        ];
        const arm = reach(ARM_L, wrist, lerp(POLE_REST, POLE_UP, up));
        return {
          neck: { rotate: [-2 * up, 0, 0] },
          head: { rotate: [-3 * up + 3 * bump(p, 1), 6 * up, -5 * up] },
          'upperarm.L': { rotate: arm.upper },
          'forearm.L': { rotate: arm.lower },
          'hand.L': { rotate: [-10 * up, 60 * up, 28 * side] },
        };
      },
    });
  },
});

