import { mixRgb, motion, profile, rgb, sdf } from '../src/index.js';
import type { AnimationDef, AssetContext } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Hermit — Chibi Quest wilderness NPC (catalog `npcs/wilderness/hermit`), about 1.0 m to the top of
 * the hood, faces +Z. Target: docs/npc-mockups/hermit_001.jpg. Built on the humanoid kind
 * (assets/parts/humanoid-kind.ts), dressed in `extra`.
 *
 * Role: a forest NPC at the hut who gives riddles and herb quests; kind, never scary. Seen in 3D and
 *   as a 128 px sprite: the white beard, the hood, the tall gnarled stick, and the bowl of berries.
 * One idea: a wise old man with a huge white beard and big ears in a brown hood, a gnarled stick in
 *   one hand and a bowl of red berries held out in the other.
 * Shape language: round and soft (beard, hood, nose, ears, berries) with the stick as the one tall form.
 * Palette (60/30/10): robe #6b4a2c with a tan hem #b89a6a and a green sash #3f5a44; hair, brows, and
 *   beard #ece8e0; rope #c8a870; pouch #7a4a2c; sandals #8a6a3a; stick #5a3a24; bowl #9a6a3a;
 *   berries #b02a30 (the accent).
 * Value plan: the white beard is the lightest mass and sits on the dark brown robe; the red berries
 *   are the one saturated spot.
 * Bodies: skin, nose, ears, hood, cowl, hair, brows, beard, robe, patches, strap, pouch, cuffs, rope,
 *   sandals, toes, stick, bowl, berries.
 * Rig: the humanoid kind's skeleton and clips. The left arm holds out the bowl (`pose`); the bowl is
 *   rigid on `knife.L`, the stick on `knife.R`.
 */

const C = {
  patchGreen: '#3f5a44',
  patchTan: '#b89a6a',
  rope: '#c8a870',
  pouch: '#7a4a2c',
  pouchFlap: '#6a3e24',
  sandal: '#8a6a3a',
  stick: '#5a3a24',
  bowl: '#9a6a3a',
  bowlIn: '#6a4424',
  berry: '#b02a30',
  gap: '#8a2e2a',
  teeth: '#fbf6ee',
};

type V3 = readonly [number, number, number];

const hermitBase = humanoidAsset({
  name: 'hermit',
  description: 'A kind, wise old hermit in a patched hooded robe with a long white beard, a gnarled stick, and a bowl of red berries.',
  reference: 'docs/npc-mockups/hermit_001.jpg',
  variants: {
    skin: { light: '#e8b48e', fair: '#f2c7a4', tan: '#d49a72', brown: '#8a5a3e' },
    hair: { white: '#ece8e0', silver: '#b8b4c4', brown: '#5a301d', auburn: '#8e3b1c' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a' },
    cloth: { brown: '#6b4a2c', olive: '#5a5a34', ochre: '#8a6a3a', umber: '#5a4440' },
  },
  presets: {
    hut: { skin: 'light', hair: 'white', eyes: 'brown', cloth: 'brown' },
    sage: { skin: 'tan', hair: 'silver', eyes: 'green', cloth: 'olive' },
  },
  hair: false,
  undershirt: false,
  pants: false,
  shoes: false,
  lashes: false,
  pose: {
    L: { elbow: [0.2, 0.37, 0.05], wrist: [0.25, 0.4, 0.17] },
    R: { elbow: [0.2, 0.33, 0.07], wrist: [0.3, 0.29, 0.16] },
  },

  // Old skin: the kind's brows are painted out (bushy brows are their own body), and a small open
  // smile sits in the gap between the mustache and the beard.
  paintSkin(skin, h) {
    const oldBrows = sdf.extrude(profile.arc(0.1, 0.034, 54, 126), 0.3).at(0.1, 0.622, 0.1).mirror('x');
    const oldSmile = sdf.extrude(profile.arc(0.07, 0.02, 241, 299), 0.3).at(0, 0.6, 0.1);
    const smile = sdf.extrude(profile.arc(0.05, 0.012, 232, 308), 0.3).at(0, 0.578, 0.1);
    const mouth = h.onFace(sdf.ellipsoid([0.03, 0.012, 0.08]), 0, 0.532);
    const teeth = mouth.intersect(sdf.halfSpace([0, -1, 0], -0.532)).intersect(sdf.box([0.05, 0.1, 1]).at(0, 0.532, 0));
    return skin
      .paintWhere(oldBrows, h.tint.skin!, 0.002)
      .paintWhere(oldSmile, h.tint.skin!, 0.002)
      .paintWhere(smile, C.gap, 0.002)
      .paintWhere(mouth, C.gap, 0.002)
      .paintWhere(teeth, C.teeth, 0.002);
  },

  extra(k, h) {
    const { SHOULDER, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];
    const strands = (x: number, y: number, z: number) => 0.003 * Math.sin(x * 160 + y * 120 + Math.sin(z * 60 + x * 30) * 2);
    const cloth = (x: number, y: number, z: number) => 0.0022 * Math.sin(x * 90 + y * 40) * Math.sin(z * 80 - y * 30);
    const hairColor = k.tint('hair');
    const headPose = (s: sdf.Shape) => s.at(0, HEAD_Y, 0).bone('head');
    const robeTint = h.tint.shirt!;
    const tanTint = k.tint('cloth', { color: C.patchTan, follow: 0.4 });
    const greenTint = k.tint('cloth', { color: C.patchGreen, follow: 0.4 });

    // ------------------------------------------------------------------ big round nose and big pointed ears (skin tint)
    const noseZ = h.faceZ(0, 0.566);
    k.body('nose', sdf.sphere(0.058).at(0, 0.58, noseZ + 0.026).bone('head'), { color: k.tint('skin'), roughness: 0.5, detail: 0.004, textureDensity: 2 });
    const ear = pair(
      sdf
        .cone([0, 0, 0], [0.14, 0.125, 0], 0.066, 0.01)
        .scale([1, 1, 0.42])
        .rotateY(-22)
        .at(0.185, 0.6, -0.04),
    );
    k.body('ears', ear.bone('head'), { color: k.tint('skin'), roughness: 0.55, detail: 0.005, textureDensity: 2 });

    // ------------------------------------------------------------------ the hood: a shell around the head, open at the face
    const hoodOuter = sdf.ellipsoid([0.233, 0.212, 0.218]).at(0, 0.004, -0.014);
    const hoodInner = sdf.ellipsoid([0.208, 0.203, 0.194]).at(0, 0, 0);
    const shellHood = hoodOuter.subtract(hoodInner);
    const opening = sdf.ellipsoid([0.168, 0.185, 0.25]).at(0, -0.095, 0.22);
    const side = shellHood.intersect(sdf.box([0.8, 0.5, 0.8]).at(0, 0.18, 0)).smoothSubtract(0.02, opening);
    const front = side.intersect(sdf.halfSpace([0, -1, 0], 0.07)).intersect(sdf.halfSpace([0, 0, -1], 0.03));
    const back = shellHood.intersect(sdf.halfSpace([0, 0, 1], -0.03)).intersect(sdf.halfSpace([0, -1, 0], 0.2)).intersect(sdf.box([0.8, 0.8, 0.8]).at(0, 0.3 - 0.2, 0));
    // Soft bunched cloth at the back of the head: a rounded fold that falls toward the shoulders, no point.
    const fold = sdf.ellipsoid([0.19, 0.17, 0.1]).at(0, -0.06, -0.13).intersect(sdf.halfSpace([0, 0, 1], -0.05));
    const hood = sdf.smoothUnion(0.04, front, back, fold);
    k.body('hood', headPose(hood), { color: robeTint, roughness: 0.92, detail: 0.006, bump: cloth });

    // The cowl: a soft roll around the neck and a hanging pocket at the back (the hood's drape).
    const roll = sdf.torus(0.098, 0.034).scale([1, 1, 0.95]).at(0, 0.455, -0.016);
    const pocket = sdf.ellipsoid([0.15, 0.115, 0.075]).at(0, 0.4, -0.115);
    const mantleOuter = sdf.ellipsoid([0.188, 0.095, 0.155]).at(0, 0.393, -0.025);
    const mantle = mantleOuter
      .subtract(sdf.ellipsoid([0.15, 0.085, 0.12]).at(0, 0.37, -0.02))
      .subtract(sdf.cylinder(0.085, 0.3).at(0, 0.45, -0.01))
      .smoothIntersect(0.025, sdf.halfSpace([0, 0, 1], 0.05).intersect(sdf.box([0.6, 0.6, 0.6]).at(0, 0.4, 0)));
    k.body('cowl', h.weighted(sdf.smoothUnion(0.03, roll, pocket, mantle)), { color: robeTint, roughness: 0.92, detail: 0.005, bump: cloth });

    // ------------------------------------------------------------------ white hair: locks at the temples, all inside the hood
    const temple = (s: 1 | -1, z: number, drop: number, r: number) =>
      sdf.chain(
        [
          [0.17 * s, 0.01, z + 0.03, r],
          [0.19 * s, -0.03, z, r * 0.95],
          [0.198 * s, -0.03 - drop * 0.6, z - 0.01, r * 0.7],
          [0.19 * s, -0.03 - drop, z - 0.012, r * 0.4],
        ],
        0.012,
      );
    const locks = [temple(1, 0.06, 0.05, 0.026), temple(-1, 0.06, 0.05, 0.026), temple(1, -0.02, 0.09, 0.026), temple(-1, -0.02, 0.09, 0.026), temple(1, -0.1, 0.07, 0.026), temple(-1, -0.1, 0.07, 0.026)];
    const hairShade = (x: number, y: number, z: number, base: ReturnType<typeof rgb>) =>
      mixRgb(base, rgb('#8a8680'), 0.22 * (0.5 + 0.5 * Math.sin(x * 130 + y * 90 + Math.sin(z * 50) * 2.5)));
    k.body('hair', headPose(sdf.smoothUnion(0.012, ...locks).paintFn(hairShade)), { color: hairColor, roughness: 0.7, detail: 0.005, bump: strands });

    // ------------------------------------------------------------------ bushy white brows, arched, with swept outer ends
    const browLine = (s: 1 | -1) => {
      const pts: [number, number, number][] = [
        [0.045, 0.7, 0.017],
        [0.078, 0.722, 0.021],
        [0.114, 0.726, 0.021],
        [0.15, 0.71, 0.018],
        [0.178, 0.69, 0.013],
      ];
      return sdf.chain(pts.map(([x, y, r]) => [x * s, y, h.faceZ(x, y) + 0.006, r] as [number, number, number, number]), 0.01);
    };
    k.body('brows', sdf.union(browLine(1), browLine(-1)).bone('head'), { color: k.tint('hair', -0.06), roughness: 0.7, detail: 0.005, bump: strands });

    // ------------------------------------------------------------------ the long white beard (head above the chin, chest below)
    const faceShell = h.head.round(0.03).smoothIntersect(0.02, sdf.halfSpace([0, 0, -1], 0.02));
    const lower = faceShell.smoothIntersect(0.02, sdf.halfSpace([0, 1, 0], 0.5));
    const burn = faceShell.smoothIntersect(0.02, sdf.ellipsoid([0.06, 0.11, 0.1]).at(0.158, 0.54, 0.06));
    const chinMass = sdf.ellipsoid([0.125, 0.07, 0.1]).at(0, 0.468, 0.085);
    const mustLock = (s: 1 | -1) =>
      sdf.chain(
        [
          [0.02 * s, 0.552, h.faceZ(0.02, 0.552) + 0.004, 0.018],
          [0.05 * s, 0.552, h.faceZ(0.05, 0.552) + 0.008, 0.021],
          [0.088 * s, 0.553, h.faceZ(0.08, 0.553) + 0.012, 0.021],
          [0.12 * s, 0.566, h.faceZ(0.1, 0.56) + 0.006, 0.018],
          [0.145 * s, 0.586, h.faceZ(0.12, 0.57) + 0.0, 0.013],
        ],
        0.012,
      );
    const upperBeard = sdf.smoothUnion(0.02, lower, pair(burn), chinMass, mustLock(1), mustLock(-1)).bone('head');
    // The flowing lower beard: a tapering mass on the chest and long locks of uneven length.
    const mass = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.112, 0.1, 0.05]).at(0, 0.42, 0.112),
      sdf.ellipsoid([0.07, 0.1, 0.04]).at(0, 0.34, 0.128),
      sdf.chain(
        [
          [0, 0.32, 0.132, 0.045],
          [0, 0.29, 0.14, 0.03],
          [0.004, 0.262, 0.145, 0.012],
        ],
        0.02,
      ),
    );
    const beardLock = (x: number, end: number, sway: number, r: number) =>
      sdf.chain(
        [
          [x, 0.48, 0.1, r],
          [x * 0.95 + sway * 0.4, (0.48 + end) / 2 + 0.02, 0.138, r * 0.95],
          [x * 0.8 + sway, end, 0.148, r * 0.5],
        ],
        0.014,
      );
    const lockSet = [
      beardLock(-0.095, 0.38, -0.012, 0.03),
      beardLock(-0.062, 0.31, 0.01, 0.032),
      beardLock(-0.028, 0.275, -0.008, 0.032),
      beardLock(0.008, 0.262, 0.01, 0.032),
      beardLock(0.044, 0.285, -0.01, 0.032),
      beardLock(0.076, 0.33, 0.012, 0.03),
      beardLock(0.1, 0.395, 0.0, 0.028),
    ];
    const lowerBeard = sdf.smoothUnion(0.018, mass, ...lockSet).bone('chest');
    const beardShade = (x: number, y: number, z: number, base: ReturnType<typeof rgb>) =>
      mixRgb(base, rgb('#8a8680'), 0.3 * (0.5 + 0.5 * Math.sin(x * 140 + y * 60 + Math.sin(z * 45 + y * 20) * 2.5)));
    k.body('beard', sdf.smoothUnion(0.02, upperBeard, lowerBeard).paintFn(beardShade), { color: hairColor, roughness: 0.75, detail: 0.005, bump: strands, textureDensity: 2 });

    // ------------------------------------------------------------------ the long robe: shell, wide sleeves, hem
    const robeProfile = (d: number) =>
      sdf
        .revolve(
          profile.polygon(
            [
              [0, 0.5],
              [0.07 + d, 0.49],
              [0.108 + d, 0.455],
              [0.128 + d, 0.4],
              [0.136 + d, 0.34],
              [0.14 + d, 0.29],
              [0.152 + d, 0.24],
              [0.17 + d, 0.19],
              [0.188 + d, 0.14],
              [0.196 + d, 0.1],
              [0, 0.09],
            ],
            { smooth: true, samples: 8 },
          ),
        )
        .scale([1, 1, 0.84]);
    const robeOuter = robeProfile(0);
    const hemCut = sdf.box([0.7, 0.4, 0.7]).at(0, 0.1 + 0.2, 0); // keeps y >= 0.1
    const robeShell = robeOuter.subtract(robeProfile(-0.014)).intersect(hemCut).intersect(sdf.halfSpace([0, 1, 0], 0.458)).round(0.002);
    const sleeve = (j: { ELBOW: V3; WRIST: V3 }) =>
      sdf.smoothUnion(
        0.015,
        sdf.cone(lerp(SHOULDER, j.ELBOW, -0.1), j.ELBOW, 0.052, 0.054).bone('upperarm.L'),
        sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.92), 0.054, 0.062).bone('forearm.L'),
      );
    const robe = sdf
      .smoothUnion(0.012, h.weighted(robeShell), h.perArm(sleeve))
      .paintWhere(h.band(0.09, 0.15), tanTint, 0.004)
      .paintWhere(h.band(0.275, 0.33).intersect(sdf.ellipsoid([0.17, 0.5, 0.16]).at(0, 0.3, 0)), greenTint, 0.004);
    k.body('robe', robe, { color: robeTint, roughness: 0.92, detail: 0.005, bump: cloth });

    // Raised patches (green and tan) on the skirt, thin squares that follow the surface.
    const robeSkin = robeOuter.round(0.005).subtract(robeOuter.round(-0.006)).intersect(hemCut);
    const patchAt = (x: number, y: number, w: number, hgt: number, rot: number) =>
      h.weighted(robeSkin.intersect(sdf.box([w, hgt, 0.6], 0.006).rotateZ(rot).at(x, y, 0.3)));
    k.body('patch-green', patchAt(0.085, 0.2, 0.06, 0.054, 5), { color: C.patchGreen, roughness: 0.9, detail: 0.003, bump: cloth });
    k.body('patch-tan', patchAt(0.03, 0.375, 0.05, 0.05, -4), { color: C.patchTan, roughness: 0.9, detail: 0.003, bump: cloth });

    // Tan cuffs at the wrists and a green patch on the left sleeve.
    const cuffs = h.perArm((j) => sdf.cone(lerp(j.ELBOW, j.WRIST, 0.72), lerp(j.ELBOW, j.WRIST, 1.0), 0.0625, 0.0635).round(0.003).bone('forearm.L'));
    k.body('cuffs', cuffs, { color: tanTint, roughness: 0.95, detail: 0.006, bump: cloth });

    // ------------------------------------------------------------------ rope belt with a knot, a tassel, and a pouch on a strap
    const rope = (x: number, y: number, z: number) => 0.003 * Math.sin(Math.atan2(z, x) * 90 + y * 40);
    const ring = sdf.torus(0.154, 0.0125).scale([1, 1, 0.84]).at(0, 0.262, 0);
    const knot = sdf.sphere(0.022).at(0.03, 0.262, 0.142);
    const tail = sdf.chain(
      [
        [0.03, 0.262, 0.142, 0.011],
        [0.034, 0.23, 0.15, 0.0105],
        [0.034, 0.2, 0.154, 0.0105],
      ],
      0.008,
    );
    const tassel = sdf.smoothUnion(0.01, sdf.ellipsoid([0.02, 0.026, 0.02]).at(0.034, 0.178, 0.156), sdf.capsule([0.034, 0.2, 0.154], [0.034, 0.19, 0.154], 0.012));
    k.body('rope', h.weighted(sdf.smoothUnion(0.006, ring, knot, tail, tassel)), { color: C.rope, roughness: 0.95, detail: 0.004, bump: rope });

    const strapShell = robeOuter.round(0.007).subtract(robeOuter.round(-0.002)).intersect(hemCut);
    const strapBox = sdf.box([0.03, 0.34, 0.6]).rotateZ(-9).at(-0.1, 0.32, 0.3);
    k.body('strap', h.weighted(strapShell.intersect(strapBox).intersect(sdf.halfSpace([0, -1, 0], -0.2))), { color: C.pouch, roughness: 0.8, detail: 0.003 });
    const pouchBox = sdf.box([0.074, 0.082, 0.042], 0.014).rotateZ(-6).at(-0.124, 0.19, 0.118);
    const flap = sdf.box([0.08, 0.034, 0.048], 0.012).rotateZ(-6).at(-0.124, 0.22, 0.12);
    const buckle = sdf.sphere(0.01).at(-0.126, 0.208, 0.145);
    k.body('pouch', h.weighted(sdf.smoothUnion(0.006, pouchBox, flap)), { color: C.pouch, roughness: 0.75, detail: 0.003, bump: cloth });
    k.body('pouch-tie', h.weighted(buckle), { color: C.rope, roughness: 0.6, detail: 0.003 });

    // ------------------------------------------------------------------ bare feet in simple sandals
    const [ax] = h.joints.ANKLE;
    const sole = sdf.ellipsoid([0.05, 0.012, 0.105]).at(0, 0.011, 0.04).intersect(sdf.halfSpace([0, -1, 0], 0));
    const strapOver = sdf.torus(0.042, 0.0095).rotateX(90).scale([1, 1, 1]).at(0, 0.02, 0.03).intersect(sdf.halfSpace([0, -1, 0], -0.012));
    const heel = sdf.torus(0.04, 0.009).rotateX(90).at(0, 0.024, -0.02).intersect(sdf.halfSpace([0, -1, 0], -0.012));
    const sandal = sdf.smoothUnion(0.006, sole, strapOver, heel).at(ax, 0, 0).bone('foot.L');
    k.body('sandals', pair(sandal), { color: C.sandal, roughness: 0.8, detail: 0.004, bump: cloth });
    const toes = sdf.union(
      ...[-0.021, -0.01, 0.002, 0.013, 0.023].map((dx, i) => sdf.ellipsoid([0.0115 - i * 0.0005 + (i === 0 ? 0.003 : 0), 0.011, 0.014]).at(ax + dx + 0.004, 0.024, 0.098 - Math.abs(dx) * 0.2)),
    );
    k.body('toes', pair(toes.bone('foot.L')), { color: k.tint('skin'), roughness: 0.55, detail: 0.004, textureDensity: 2 });

    // ------------------------------------------------------------------ the gnarled walking stick (right hand, x < 0)
    const gR = h.arms.R.GRIP;
    const sx = -gR[0];
    const sz = gR[2] + 0.006;
    const topY = 0.9;
    const stickBase = sdf.chain(
      [
        [sx, 0.085, sz, 0.0205],
        [sx + 0.004, 0.2, sz - 0.003, 0.0195],
        [sx - 0.003, 0.4, sz + 0.004, 0.021],
        [sx + 0.005, 0.62, sz - 0.002, 0.0195],
        [sx - 0.002, 0.8, sz, 0.021],
        [sx, topY - 0.05, sz + 0.002, 0.025],
      ],
      0.012,
    );
    const knots = sdf.union(
      sdf.sphere(0.028).at(sx + 0.006, 0.31, sz - 0.004),
      sdf.sphere(0.026).at(sx - 0.008, 0.52, sz + 0.004),
      sdf.sphere(0.027).at(sx + 0.008, 0.71, sz - 0.002),
    );
    const prongL = sdf.chain(
      [
        [sx, topY - 0.06, sz, 0.026],
        [sx - 0.016, topY - 0.012, sz - 0.004, 0.022],
        [sx - 0.02, topY + 0.03, sz - 0.006, 0.017],
      ],
      0.012,
    );
    const prongR = sdf.chain(
      [
        [sx, topY - 0.06, sz, 0.024],
        [sx + 0.018, topY - 0.02, sz + 0.004, 0.018],
        [sx + 0.03, topY + 0.012, sz + 0.012, 0.013],
      ],
      0.012,
    );
    const twig = sdf.chain(
      [
        [sx + 0.004, 0.44, sz + 0.006, 0.014],
        [sx + 0.03, 0.47, sz + 0.02, 0.0095],
      ],
      0.008,
    );
    const stick = sdf.smoothUnion(0.012, stickBase, knots, prongL, prongR, twig);
    const wood = (x: number, y: number, z: number) => 0.0025 * Math.sin(y * 150 + Math.sin(x * 200 + z * 180) * 1.4);
    k.body('stick', stick.bone('knife.R'), { color: C.stick, roughness: 0.82, detail: 0.003, bump: wood });

    // ------------------------------------------------------------------ the bowl of berries (left hand, x > 0)
    const gL = h.arms.L.GRIP;
    const bx = gL[0];
    const by = gL[1] + 0.04;
    const bz = gL[2] + 0.015;
    const bowlOuter = sdf.revolve(
      profile.polygon(
        [
          [0, 0],
          [0.02, 0.0],
          [0.036, 0.009],
          [0.05, 0.03],
          [0.054, 0.046],
          [0.047, 0.046],
          [0.0, 0.012],
        ],
        { smooth: true, samples: 6 },
      ),
    );
    const bowlRim = sdf.torus(0.0505, 0.0055).at(0, 0.046, 0);
    const bowlShape = sdf.smoothUnion(0.004, bowlOuter, bowlRim);
    const grain = (x: number, y: number, z: number) => 0.0022 * Math.sin(y * 260 + Math.sin(x * 90 + z * 60) * 1.5);
    k.body('bowl', bowlShape.at(bx, by, bz).bone('knife.L'), { color: C.bowl, roughness: 0.8, detail: 0.003, bump: grain });

    // A heap of berries: rings of small spheres, with a few on top.
    const pile: [number, number, number][] = [
      [0, 0.054, 0],
      [0.026, 0.05, 0.004],
      [-0.026, 0.05, -0.004],
      [0.004, 0.05, 0.027],
      [-0.004, 0.05, -0.027],
      [0.02, 0.05, 0.02],
      [-0.02, 0.05, -0.02],
      [0.02, 0.05, -0.02],
      [-0.02, 0.05, 0.02],
      [0.012, 0.068, 0.006],
      [-0.012, 0.068, -0.008],
      [0.002, 0.066, 0.014],
      [-0.005, 0.066, -0.016],
      [0.04, 0.046, 0.008],
      [-0.04, 0.046, -0.008],
      [0.0, 0.08, 0.0],
    ];
    const berries = sdf.union(...pile.map(([x, y, z]) => sdf.sphere(0.0165).at(x, y, z)));
    const berryShade = (x: number, y: number, z: number, base: ReturnType<typeof rgb>) => mixRgb(base, rgb('#e04a50'), 0.25 * (0.5 + 0.5 * Math.sin(x * 400 + z * 300 + y * 200)));
    k.body('berries', berries.at(bx, by, bz).bone('knife.L').paintFn(berryShade), { color: C.berry, roughness: 0.35, detail: 0.004 });
  },
});

// The robe hides the legs, so the walk gets more body motion: a hip bounce, a hip sway, and a counter-roll
// of the chest and the head. The kind's clips stay; this wrapper adds to the walk pose only.
type PoseOut = ReturnType<AnimationDef['pose']>;
const addPose = (pose: PoseOut, bone: string, rotate: readonly [number, number, number], move?: readonly [number, number, number]): PoseOut => {
  const old = pose[bone] ?? {};
  const r = old.rotate ?? [0, 0, 0];
  const m = old.move ?? [0, 0, 0];
  return {
    ...pose,
    [bone]: {
      ...old,
      rotate: [r[0] + rotate[0], r[1] + rotate[1], r[2] + rotate[2]],
      ...(move ? { move: [m[0] + move[0], m[1] + move[1], m[2] + move[2]] } : {}),
    },
  };
};

export default {
  ...hermitBase,
  build(k: AssetContext) {
    const wrapped = new Proxy(k, {
      get(target, prop, receiver) {
        if (prop !== 'animation') return Reflect.get(target, prop, receiver);
        return (name: string, def: AnimationDef) => {
          if (name !== 'walk') return target.animation(name, def);
          return target.animation(name, {
            ...def,
            pose: (t: number, p: number) => {
              let pose = def.pose(t, p);
              const s = motion.wave(p);
              const step = motion.wave(p, 2, 0.25);
              pose = addPose(pose, 'hips', [0, 0, 5 * s], [0.014 * s, 0.014 * step, 0]);
              pose = addPose(pose, 'spine', [-2.5 * step, 0, -6 * s]);
              pose = addPose(pose, 'chest', [0, 0, 3 * s]);
              pose = addPose(pose, 'head', [2.5 * step, 0, -2 * s]);
              return pose;
            },
          });
        };
      },
    });
    hermitBase.build(wrapped);
  },
};
