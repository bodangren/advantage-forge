import { mixRgb, noise, profile, rgb, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Beggar — Chibi Quest settlement NPC (catalog `npcs/settlement/beggar`), about 1.0 m to the top of
 * the hat, faces +Z. Target: docs/npc-mockups/beggar_001.jpg. Built on the humanoid kind
 * (assets/parts/humanoid-kind.ts), dressed in `extra`.
 *
 * Role: a street NPC in the town square who asks for a coin and gives a hint in return; kind and
 *   hopeful. Seen in 3D and as a 128 px sprite: the floppy hat, the big gray beard, the held-out
 *   tin cup, and the patched coat must read.
 * One idea: a hopeful old man with a huge gray beard and a wide floppy hat, holding a dented tin
 *   cup out in front of him and leaning on a short stick.
 * Shape language: round and soft (beard, hat, nose, ears) with the walking stick as the one thin form.
 * Palette (60/30/10): coat #7a5a3a / hat #6a5038 (brown), trousers #6a6870 (gray), gray hair and
 *   beard #a8a4a0; patches #3f5a44 / #4a5a7a / #b89a6a, rope #c8a870, cup #9a9ca4 (the accent).
 * Value plan: the dark hat and coat frame the light gray beard and the face; the pale cup is the
 *   one bright metal spot at chest height.
 * Bodies: skin, nose, ears, hair, brows, beard, hat, hat patch, coat, patches, vest, rope, trousers,
 *   cuffs, shoes, cup, stick.
 * Rig: the humanoid kind's skeleton and clips. The right arm holds out the cup (`pose`); the cup is
 *   rigid on `knife.R`, the stick on `knife.L`.
 */

const C = {
  hair: '#a8a4a0',
  hat: '#6a5038',
  hatBand: '#4e3a28',
  hatPatch: '#8a7050',
  patchGreen: '#3f5a44',
  patchBlue: '#4a5a7a',
  patchTan: '#b89a6a',
  rope: '#c8a870',
  trousers: '#6a6870',
  kneePatch: '#8a7a5a',
  shoe: '#4a3424',
  cup: '#686a72',
  cupBand: '#4e5058',
  cupInside: '#34363c',
  stick: '#5a3e24',
  sleeve: '#2f5c60',
  gap: '#a4503f',
};

type V3 = readonly [number, number, number];

export default humanoidAsset({
  name: 'beggar',
  description: 'A humble, hopeful old man in a patched brown coat and a floppy hat, holding out a dented tin cup.',
  reference: 'docs/npc-mockups/beggar_001.jpg',
  variants: {
    skin: { light: '#e8b48e', fair: '#f2c7a4', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { gray: '#a8a4a0', brown: '#5a301d', black: '#231a17', blond: '#c4974a', auburn: '#8e3b1c', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { brown: '#7a5a3a', oat: '#9a8460', rust: '#8a5238', olive: '#6a6a40' },
  },
  presets: {
    street: { skin: 'light', hair: 'gray', eyes: 'brown', cloth: 'brown' },
    traveler: { skin: 'tan', hair: 'brown', eyes: 'hazel', cloth: 'olive' },
  },
  hair: false,
  undershirt: false,
  pants: false,
  shoes: C.shoe,
  lashes: false,
  pose: {
    R: { elbow: [0.2, 0.375, 0.06], wrist: [0.225, 0.43, 0.15] },
  },

  // Old skin: the kind's brows and smile are painted out (bushy brows and the beard are their own
  // bodies), then a wide gentle smile sits in the gap under the nose.
  paintSkin(skin, h) {
    const oldBrows = sdf.extrude(profile.arc(0.1, 0.034, 54, 126), 0.3).at(0.1, 0.622, 0.1).mirror('x');
    const oldSmile = sdf.extrude(profile.arc(0.07, 0.02, 241, 299), 0.3).at(0, 0.6, 0.1);
    const smile = sdf.extrude(profile.arc(0.1, 0.014, 244, 296), 0.3).at(0, 0.5 + 0.1, 0.1);
    return skin
      .paintWhere(oldBrows, h.tint.skin!, 0.002)
      .paintWhere(oldSmile, h.tint.skin!, 0.002)
      .paintWhere(smile, C.gap, 0.002);
  },

  extra(k, h) {
    const { SHOULDER, HEAD_Y, ELBOW } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];
    void ELBOW;
    const strands = (x: number, y: number, z: number) => 0.003 * Math.sin(x * 160 + y * 120 + Math.sin(z * 60 + x * 30) * 2);
    const felt = (x: number, y: number, z: number) => 0.0025 * Math.sin(x * 70 + z * 50) * Math.cos(y * 60 + x * 20);
    const cloth = (x: number, y: number, z: number) => 0.002 * Math.sin(x * 90 + y * 40) * Math.sin(z * 80 - y * 30);
    const hairColor = k.tint('hair');
    const headPose = (s: sdf.Shape) => s.at(0, HEAD_Y, 0).bone('head');

    // ------------------------------------------------------------------ hat: a floppy felt dome and a drooping brim
    const hatPose = (s: sdf.Shape) => s.rotateZ(3).rotateX(-5).at(0, HEAD_Y, 0);
    const crown = sdf
      .ellipsoid([0.218, 0.19, 0.212])
      .at(0, 0.1, 0)
      .intersect(sdf.halfSpace([0, -1, 0], -0.07))
      .smoothSubtract(0.06, sdf.ellipsoid([0.1, 0.05, 0.1]).at(0.02, 0.292, 0.02))
      .smoothSubtract(0.05, sdf.sphere(0.07).at(0.2, 0.22, 0.02))
      .rotateZ(-7);
    const wave = (x: number, y: number, z: number) => {
      const r = Math.hypot(x, z);
      return Math.sin(Math.atan2(z, x) * 3 + 0.6) * Math.min(1, Math.max(0, (r - 0.2) / 0.08));
    };
    const brim = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.15],
            [0.2, 0.15],
            [0.26, 0.133],
            [0.3, 0.108],
            [0.318, 0.082],
            [0.306, 0.064],
            [0.27, 0.085],
            [0.2, 0.11],
            [0, 0.11],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .displace(0.013, wave)
      .scale([1, 1, 0.97])
      .rotateZ(6);
    const band = sdf.torus(0.208, 0.016).scale([1, 1, 0.97]).at(0, 0.108, 0);
    const hatShape = sdf.smoothUnion(0.035, crown, brim);
    k.body('hat', hatPose(hatShape).bone('head'), { color: C.hat, roughness: 0.92, detail: 0.005, bump: felt });
    k.body('hat-band', hatPose(band).bone('head'), { color: C.hatBand, roughness: 0.9, detail: 0.004, bump: felt });
    // A small square patch on the crown, up and to the right of the front.
    const hatShell = hatShape.round(0.004).subtract(hatShape.round(-0.006));
    const hatPatch = hatShell.intersect(sdf.box([0.05, 0.05, 0.5], 0.006).at(-0.08, 0.27, 0.15).rotateZ(-14));
    k.body('hat-patch', hatPose(hatPatch).bone('head'), { color: C.hatPatch, roughness: 0.9, detail: 0.003, bump: cloth });

    // ------------------------------------------------------------------ big round nose and big ears (the skin tint)
    const noseZ = h.faceZ(0, 0.566);
    const nosePink = (_x: number, _y: number, _z: number, base: ReturnType<typeof rgb>) => mixRgb(base, rgb('#e07a72'), 0.32);
    k.body('nose', sdf.sphere(0.053).at(0, 0.562, noseZ + 0.028).paintFn(nosePink).bone('head'), { color: k.tint('skin'), roughness: 0.5, detail: 0.004, textureDensity: 2 });
    const ear = pair(
      sdf
        .ellipsoid([0.04, 0.066, 0.056])
        .subtract(sdf.sphere(0.026).at(0.026, 0, 0.012))
        .rotateY(-20)
        .at(0.222, 0.628, -0.005),
    );
    k.body('ears', ear.bone('head'), { color: k.tint('skin'), roughness: 0.55, detail: 0.004, textureDensity: 2 });

    // ------------------------------------------------------------------ hair under the hat: a cap, fringe curls, temple and nape locks
    const shell = sdf.ellipsoid([0.212, 0.207, 0.197]);
    const faceMask = sdf.ellipsoid([0.15, 0.135, 0.13]).at(0, -0.05, 0.19);
    const cap = shell.smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], 0.06)).smoothSubtract(0.012, faceMask);
    const fringe = [-0.125, -0.085, -0.045, -0.005, 0.035, 0.075, 0.115].map((x, i) => {
      const s = i % 2 === 0 ? 1 : -1;
      return sdf.chain(
        [
          [x, 0.1, 0.15, 0.02],
          [x * 1.04, 0.092, 0.176, 0.02],
          [x * 1.05 + 0.008 * s, 0.065 - 0.006 * s, 0.182, 0.016],
          [x * 1.04 + 0.016 * s, 0.056, 0.18, 0.011],
        ],
        0.012,
      );
    });
    const temple = (s: 1 | -1, z: number, y: number) =>
      sdf.chain(
        [
          [0.15 * s, 0.07, z + 0.03, 0.026],
          [0.178 * s, 0.01, z, 0.024],
          [0.19 * s, y, z - 0.01, 0.019],
          [0.186 * s, y - 0.03, z - 0.012, 0.013],
        ],
        0.016,
      );
    const temples = [temple(1, 0.085, -0.045), temple(-1, 0.085, -0.045), temple(1, 0.04, -0.07), temple(-1, 0.04, -0.07)];
    const nape = [-70, -48, -24, 0, 24, 48, 70].map((a) => {
      const r = (a * Math.PI) / 180;
      const x = 0.185 * Math.sin(r);
      const z = -0.17 * Math.cos(r);
      return sdf.chain(
        [
          [x, 0.0, z, 0.03],
          [x * 1.02, -0.05, z * 1.02, 0.03],
          [x * 1.02 + 0.01 * Math.cos(r), -0.09, z * 1.02, 0.03],
        ],
        0.018,
      );
    });
    const napeBand = shell
      .round(0.004)
      .smoothIntersect(0.02, sdf.box([0.6, 0.075, 0.6]).at(0, -0.07, 0))
      .smoothIntersect(0.02, sdf.halfSpace([0, 0, 1], -0.02));
    const hairShape = sdf.smoothUnion(0.014, cap, napeBand, ...fringe, ...temples, ...nape);
    const hairShade = (x: number, y: number, z: number, base: ReturnType<typeof rgb>) =>
      mixRgb(base, rgb('#585660'), 0.3 * (0.5 + 0.5 * Math.sin(x * 120 + y * 80 + Math.sin(z * 50) * 2.5)));
    k.body('hair', headPose(hairShape.paintFn(hairShade)), { color: hairColor, roughness: 0.7, detail: 0.005, bump: strands });

    // ------------------------------------------------------------------ bushy gray brows
    const browLine = (s: 1 | -1) => {
      const pts: [number, number, number][] = [
        [0.05, 0.703, 0.014],
        [0.082, 0.716, 0.0165],
        [0.118, 0.714, 0.0165],
        [0.152, 0.7, 0.0135],
        [0.17, 0.686, 0.01],
      ];
      return sdf.chain(pts.map(([x, y, r]) => [x * s, y, h.faceZ(x, y) + 0.004, r] as [number, number, number, number]), 0.01);
    };
    k.body('brows', sdf.union(browLine(1), browLine(-1)).bone('head'), { color: k.tint('hair', -0.12), roughness: 0.7, detail: 0.004, bump: strands });

    // ------------------------------------------------------------------ the scruffy beard (its own body)
    const faceShell = h.head.round(0.03).smoothIntersect(0.02, sdf.halfSpace([0, 0, -1], 0.02));
    const lower = faceShell.smoothIntersect(0.02, sdf.halfSpace([0, 1, 0], 0.487));
    const burn = faceShell.smoothIntersect(0.02, sdf.ellipsoid([0.075, 0.1, 0.1]).at(0.17, 0.53, 0.06));
    const sideburns = pair(burn);
    const chinMass = sdf.ellipsoid([0.125, 0.075, 0.105]).at(0, 0.485, 0.085).bone('head');
    const mustLock = (s: 1 | -1) =>
      sdf.chain(
        [
          [0.012 * s, 0.556, h.faceZ(0.02, 0.556) + 0.002, 0.016],
          [0.045 * s, 0.552, h.faceZ(0.045, 0.552) + 0.004, 0.0185],
          [0.08 * s, 0.545, h.faceZ(0.08, 0.545) + 0.006, 0.0185],
          [0.108 * s, 0.552, h.faceZ(0.108, 0.552) + 0.006, 0.017],
        ],
        0.01,
      );
    const beardLock = (x: number, drop: number, z: number, r: number) =>
      sdf.chain(
        [
          [x, 0.5, z, r],
          [x * 0.92, 0.5 - drop * 0.5, z + 0.012, r * 0.85],
          [x * 0.82 + 0.006, 0.5 - drop, z + 0.016, r * 0.45],
        ],
        0.012,
      );
    const locks = [
      beardLock(-0.09, 0.062, 0.085, 0.03),
      beardLock(-0.05, 0.085, 0.115, 0.03),
      beardLock(-0.01, 0.1, 0.13, 0.032),
      beardLock(0.03, 0.09, 0.125, 0.03),
      beardLock(0.07, 0.07, 0.105, 0.03),
      beardLock(0.1, 0.05, 0.075, 0.026),
    ];
    const mouthCut = sdf.extrude(profile.arc(0.1, 0.024, 244, 296), 0.3).at(0, 0.5 + 0.1, 0.1);
    const beard = sdf.smoothUnion(0.02, lower, sideburns, chinMass, mustLock(1), mustLock(-1), ...locks).subtract(mouthCut);
    const beardShade = (x: number, y: number, z: number, base: ReturnType<typeof rgb>) =>
      mixRgb(base, rgb('#585660'), 0.32 * (0.5 + 0.5 * Math.sin(x * 130 + y * 90 + Math.sin(z * 45) * 2.5)));
    k.body('beard', beard.bone('head').paintFn(beardShade), { color: hairColor, roughness: 0.75, detail: 0.004, bump: strands, textureDensity: 2 });

    // ------------------------------------------------------------------ patched coat: shell, open front, long sleeves
    const coatProfile = (d: number) =>
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
              [0.178 + d, 0.14],
              [0.182 + d, 0.1],
              [0, 0.08],
            ],
            { smooth: true, samples: 8 },
          ),
        )
        .scale([1, 1, 0.84]);
    const coatOuter = coatProfile(0);
    const coatInner = coatProfile(-0.014);
    const opening = sdf.box([0.1, 0.4, 0.3], 0.025).at(0, 0.28, 0.16);
    const rag = (x: number, _y: number, z: number) => Math.sin(Math.atan2(z, x) * 11) * 0.6 + Math.sin(Math.atan2(z, x) * 5 + 1) * 0.4;
    const hemCut = sdf.box([0.7, 0.4, 0.7]).at(0, 0.12 + 0.2, 0).displace(0.012, rag); // keeps y >= about 0.12, ragged
    const coatBody = coatOuter
      .subtract(coatInner)
      .intersect(hemCut)
      .intersect(sdf.halfSpace([0, 1, 0], 0.458))
      .smoothSubtract(0.01, opening.intersect(sdf.halfSpace([0, 1, 0], 0.445)).at(0, 0, 0))
      .round(0.002);
    const sleeve = (j: { ELBOW: V3; WRIST: V3 }) =>
      sdf.smoothUnion(
        0.015,
        sdf.cone(lerp(SHOULDER, j.ELBOW, -0.1), j.ELBOW, 0.05, 0.047).bone('upperarm.L'),
        sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.9), 0.047, 0.044).bone('forearm.L'),
      );
    const collar = sdf.torus(0.066, 0.02).scale([1, 1, 0.9]).at(0, 0.448, -0.012).bone('chest');
    const coat = sdf.smoothUnion(0.012, h.weighted(coatBody), collar);
    const fuzz = (x: number, y: number, z: number) => 0.003 * noise.fbm(x * 40, y * 40, z * 40, 3);
    k.body('coat', coat, { color: h.tint.shirt!, roughness: 0.97, detail: 0.005, bump: fuzz });
    // Teal-green knit sleeves under the open vest coat.
    const knit = (x: number, y: number, z: number) => 0.0025 * Math.sin(x * 160) * Math.sin(y * 160 + z * 100);
    k.body('sleeves', h.perArm(sleeve), { color: C.sleeve, roughness: 0.95, detail: 0.005, bump: knit });

    // The vest under the open coat: a darker shade of the cloth slot.
    const vestShape = h.torso.round(0.006).intersect(sdf.box([0.6, 0.29, 0.6]).at(0, 0.31, 0));
    k.body('vest', h.weighted(vestShape), { color: k.tint('cloth', -0.5), roughness: 0.9, detail: 0.005, bump: cloth });

    // Three raised cloth patches on the coat (green, blue, tan), thin squares that follow the surface.
    const coatSkin = coatOuter.round(0.005).subtract(coatOuter.round(-0.006)).intersect(hemCut);
    const patchAt = (x: number, y: number, w: number, hgt: number, rot: number) =>
      h.weighted(coatSkin.intersect(sdf.box([w, hgt, 0.5], 0.006).rotateZ(rot).at(x, y, 0.25)));
    k.body('patch-green', patchAt(-0.1, 0.2, 0.06, 0.066, 4), { color: C.patchGreen, roughness: 0.9, detail: 0.003, bump: cloth });
    k.body('patch-blue', patchAt(0.095, 0.17, 0.066, 0.06, -5), { color: C.patchBlue, roughness: 0.9, detail: 0.003, bump: cloth });
    k.body('patch-tan', patchAt(-0.105, 0.32, 0.05, 0.054, -4), { color: C.patchTan, roughness: 0.9, detail: 0.003, bump: cloth });

    // Frayed cuffs at the wrists: a lighter shade of the cloth slot.
    const cuffs = h.perArm((j) => sdf.cone(lerp(j.ELBOW, j.WRIST, 0.7), lerp(j.ELBOW, j.WRIST, 1.0), 0.0485, 0.0475).round(0.002).bone('forearm.L'));
    k.body('cuffs', cuffs, { color: k.tint('cloth', 0.22), roughness: 0.95, detail: 0.004, bump: cloth });

    // ------------------------------------------------------------------ rope belt with a knot and two hanging ends
    const rope = (x: number, y: number, z: number) => 0.003 * Math.sin(Math.atan2(z, x) * 90 + y * 40);
    const ring = sdf.torus(0.154, 0.0115).scale([1, 1, 0.84]).at(0, 0.262, 0);
    const knot = sdf.sphere(0.021).at(0.03, 0.262, 0.142);
    const ends = sdf.union(
      sdf.chain(
        [
          [0.03, 0.262, 0.142, 0.011],
          [0.04, 0.23, 0.15, 0.0105],
          [0.046, 0.2, 0.152, 0.0095],
        ],
        0.008,
      ),
      sdf.chain(
        [
          [0.03, 0.262, 0.142, 0.011],
          [0.016, 0.228, 0.152, 0.0105],
          [0.01, 0.204, 0.154, 0.0095],
        ],
        0.008,
      ),
    );
    k.body('rope', h.weighted(sdf.smoothUnion(0.006, ring, knot, ends)), { color: C.rope, roughness: 0.95, detail: 0.003, bump: rope });

    // ------------------------------------------------------------------ baggy gray trousers with a knee patch, ankle wraps, shoes
    const trouserLeg = sdf.smoothUnion(
      0.02,
      sdf.capsule([0.068, 0.2, 0], [0.083, 0.1325, 0], 0.064).bone('leg.L'),
      sdf.cone([0.083, 0.1325, 0], [0.098, 0.1, 0.002], 0.062, 0.056).bone('shin.L'),
    );
    const trousers = sdf.smoothUnion(0.03, sdf.ellipsoid([0.125, 0.06, 0.092]).at(0, 0.2, 0).bone('hips'), pair(trouserLeg));
    const kneeStencil = sdf.box([0.056, 0.05, 0.2], 0.008).at(0.083, 0.135, 0.07).rotateZ(6);
    k.body('trousers', trousers.paintWhere(kneeStencil, C.kneePatch, 0.002), { color: C.trousers, roughness: 0.9, detail: 0.005, bump: cloth });
    const wrap = pair(sdf.cylinder(0.0585, 0.034, 0.012).at(0.098, 0.093, 0.002).bone('shin.L'));
    k.body('wraps', wrap, { color: k.tint('cloth', 0.1), roughness: 0.95, detail: 0.004, bump: cloth });

    // ------------------------------------------------------------------ the dented tin cup (right hand, x < 0)
    const gR = h.arms.R.GRIP;
    const cupH = 0.088;
    const cupAt: V3 = [-gR[0] - 0.004, gR[1] - 0.042, gR[2] + 0.012];
    const cupOuter = sdf.revolve(
      profile.polygon(
        [
          [0, 0],
          [0.036, 0],
          [0.04, 0.005],
          [0.0455, cupH],
          [0.041, cupH],
          [0.0365, 0.014],
          [0, 0.01],
        ],
      ),
    );
    const dents = (x: number, y: number, z: number) => 0.007 * Math.sin(x * 90 + z * 60) * Math.sin(y * 70 + 1) + 0.003 * Math.sin(y * 150 + x * 40);
    const rim = sdf.torus(0.0435, 0.005).at(0, cupH, 0);
    const midBand = sdf.torus(0.043, 0.0042).at(0, 0.04, 0);
    const cupBody = sdf.smoothUnion(0.004, cupOuter, rim);
    const cupPaint = cupBody.paintFn((x, y, z, base) => (y < cupH * 0.98 && y > 0.012 && x * x + z * z < 0.036 * 0.036 ? mixRgb(base, rgb(C.cupInside), 0.9) : base));
    k.body('cup', cupPaint.at(...cupAt).bone('knife.R'), { color: C.cup, roughness: 0.55, metalness: 0.6, detail: 0.003, bump: dents });
    k.body('cup-band', midBand.at(...cupAt).bone('knife.R'), { color: C.cupBand, roughness: 0.4, metalness: 0.7, detail: 0.003 });

    // ------------------------------------------------------------------ the short walking stick (left hand, x > 0)
    const gL = h.arms.L.GRIP;
    const sx = gL[0];
    const sz = gL[2] + 0.004;
    const stickTop = 0.27;
    const stick = sdf.capsule([sx, 0.03 + 0.0185, sz], [sx, stickTop - 0.02, sz], 0.0185).smoothUnion(0.006, sdf.sphere(0.0225).at(sx, stickTop - 0.02, sz));
    const wood = (x: number, y: number, z: number) => 0.0012 * Math.sin(y * 90 + x * 40);
    k.body('stick', stick.bone('knife.L'), { color: C.stick, roughness: 0.8, detail: 0.003, bump: wood });
  },
});
