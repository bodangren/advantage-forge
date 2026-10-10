import { noise, profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Guild master — Chibi Quest court-and-faction NPC (catalog `npcs/court-and-faction/guild-master`),
 * about 0.9 m to the bald crown, faces +Z. Target: docs/npc-mockups/guild-master_001.jpg. Built on the
 * humanoid kind.
 *
 * Role: the crafting guild hall NPC who gives rank quests; seen in 3D and as a 128 px sprite, so the
 *   raised brass key, the round red laughing face, and the fur-trimmed coat must read.
 * One idea: a plump, jolly man whose fat brown fur-trimmed coat, mustard waistcoat, and big gold
 *   chain frame a raised brass key.
 * Shape language: round and soft (belly, face, sideburns, purse), with the key as the one hard form.
 * Palette (60/30/10): coat #6b3e22 with cream fur #ece0c8; mustard waistcoat #c8982a; dark trousers
 *   #3a3c44; the gold #e0b040 and brass #c8a040 are the accent; skin #f2c7a4 with red blush.
 * Value plan: the dark brown coat frames the bright waistcoat; the pale fur outlines it; gold on top.
 * Bodies: skin, hair locks, chops, mustache, nose, coat, fur, waistcoat, belt, chain, buttons,
 *   trousers, shoes, buckles, key, purse.
 * Rig: the humanoid kind's skeleton and clips; the right arm is posed raised with the key rigid on
 *   `knife.R`; the purse is rigid on `knife.L` and hangs from the left fist.
 */

const C = {
  hair: '#6b3e22',
  fur: '#ece0c8',
  vest: '#dca024',
  belt: '#5a3a24',
  gold: '#e0b040',
  darkChain: '#3a2a1e',
  brass: '#c8a040',
  pants: '#3a3c44',
  shoe: '#2a2428',
  buckle: '#c8ccd4',
  purse: '#7a4a2c',
  tie: '#c8a870',
  mouth: '#8a2e2a',
  tongue: '#d8706a',
  teeth: '#fbf6ee',
};

export default humanoidAsset({
  name: 'guild-master',
  description: 'A plump, jolly guild master in a fur-trimmed brown coat and a gold chain of office, holding up a brass key and a coin purse.',
  reference: 'docs/npc-mockups/guild-master_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { chestnut: '#6b3e22', black: '#231a17', blond: '#c4974a', auburn: '#8e3b1c', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { walnut: '#6b3e22', wine: '#6e2c3a', forest: '#3a4a30', navy: '#38445e' },
  },
  presets: {
    vintner: { skin: 'tan', hair: 'silver', eyes: 'hazel', cloth: 'wine' },
  },
  hair: false,
  lashes: false,
  undershirt: false,
  pants: false,
  shoes: false,
  // The right hand raised beside the head with the key (the kind mirrors the R pose).
  pose: { L: { elbow: [0.27, 0.35, 0.05], wrist: [0.325, 0.295, 0.12] }, R: { elbow: [0.245, 0.355, 0.02], wrist: [0.31, 0.435, 0.07] } },

  // A hearty laugh: a wide open mouth with round corners and one tooth band, arched bushy brows, and
  // a red flush on the cheeks and forehead.
  paintSkin(skin, h) {
    const y = 0.522;
    const grin = profile.polygon(
      [
        [-0.072, 0.018],
        [-0.038, 0.004],
        [0, 0.0],
        [0.038, 0.004],
        [0.072, 0.018],
        [0.06, -0.018],
        [0.032, -0.042],
        [0, -0.05],
        [-0.032, -0.042],
        [-0.06, -0.018],
      ],
      { smooth: true, samples: 6 },
    );
    const mouth = h.onFace(sdf.extrude(grin, 0.3), 0, y);
    const teeth = mouth.intersect(sdf.halfSpace([0, -1, 0], -(y - 0.012))).intersect(sdf.box([0.085, 0.1, 1]).at(0, y, 0));
    const tongue = h.onFace(sdf.ellipsoid([0.034, 0.018, 0.08]), 0, y - 0.04);
    const oldBrows = sdf.extrude(profile.arc(0.1, 0.036, 54, 126), 0.3).at(0.1, 0.622, 0.1).mirror('x');
    const brows = sdf.extrude(profile.arc(0.075, 0.022, 52, 122), 0.3).at(0.1, 0.664, 0.1).mirror('x');
    const eyeZone = sdf.union(h.onFace(sdf.ellipsoid([0.066, 0.07, 0.2]), 0.105, 0.628), h.onFace(sdf.ellipsoid([0.066, 0.07, 0.2]), -0.105, 0.628));
    const flush = sdf
      .union(h.onFace(sdf.ellipsoid([0.075, 0.06, 0.2]), 0.1, 0.565), h.onFace(sdf.ellipsoid([0.075, 0.06, 0.2]), -0.1, 0.565), h.onFace(sdf.ellipsoid([0.06, 0.04, 0.2]), 0, 0.6))
      .subtract(eyeZone);
    return skin
      .paintWhere(oldBrows, h.tint.skin!, 0.002)
      .paintWhere(flush, h.tint.blush!, 0.03)
      .paintWhere(brows, h.tint.brow!, 0.002)
      .paintWhere(mouth, C.mouth)
      .paintWhere(tongue.intersect(mouth), C.tongue, 0.004)
      .paintWhere(teeth, C.teeth, 0.002);
  },

  extra(k, h) {
    const { SHOULDER, HIP, KNEE, ANKLE, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const sep = (s: sdf.Shape) => s.mirror('x', 0);
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];
    const hairColor = k.tint('hair');
    const skinTint = k.tint('skin');

    // ------------------------------------------------------------------ head: nose, hair locks, chops, mustache
    const noseY = 0.576;
    const nose = sdf.ellipsoid([0.031, 0.027, 0.03]).at(0, noseY, h.faceZ(0, noseY) + 0.002).bone('head');
    k.body('nose', nose, { color: k.tint('skin', { color: '#d8604e', follow: 0.5 }), roughness: 0.5, detail: 0.004 });

    // Brown hair at the sides and the nape only (the crown is bald): a thin band, then curled locks.
    const skull = sdf.ellipsoid([0.212, 0.206, 0.196]).at(0, HEAD_Y + 0.002, -0.004);
    const sideBand = skull
      .smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], -0.61))
      .smoothIntersect(0.04, sdf.halfSpace([0, 1, 0], 0.7))
      .smoothSubtract(0.02, sdf.ellipsoid([0.15, 0.2, 0.2]).at(0, 0.68, 0.17))
      .smoothSubtract(0.03, sdf.ellipsoid([0.11, 0.2, 0.12]).at(0, 0.66, -0.2))
      .smoothSubtract(0.015, sdf.ellipsoid([0.06, 0.07, 0.07]).at(0.2, 0.61, -0.01).mirror('x', 0));
    // Ram-horn curls: a thick sweep out from the temple, up, and round to a hooked tip, plus a lower lock.
    const curl = (pts: [number, number, number, number][]) => sdf.chain(pts, 0.014);
    const locks = sdf.smoothUnion(
      0.012,
      curl([[0.17, 0.675, 0.01, 0.034], [0.215, 0.7, 0.01, 0.034], [0.25, 0.72, 0.01, 0.03], [0.275, 0.705, 0.01, 0.026], [0.28, 0.672, 0.01, 0.021], [0.262, 0.652, 0.01, 0.015], [0.242, 0.655, 0.01, 0.01]]),
      curl([[0.17, 0.635, 0.025, 0.03], [0.215, 0.64, 0.025, 0.028], [0.25, 0.625, 0.025, 0.022], [0.272, 0.6, 0.025, 0.016], [0.268, 0.585, 0.025, 0.011]]),
    );
    const hairAll = sdf.smoothUnion(0.02, sideBand, pair(locks)).bone('head');
    k.body('hair', hairAll, { color: hairColor, roughness: 0.6, detail: 0.004, bump: (x, y, z) => 0.002 * Math.sin(y * 150 + x * 30 + z * 20) });

    // The mutton-chop sideburns: a thick curled band from the temple down to the jaw, its own body.
    const headSurf = h.head.round(0.016);
    const chopZone = (s: sdf.Shape) => s;
    const chopPatch = chopZone(sdf.ellipsoid([0.035, 0.085, 0.07]).at(0.19, 0.6, 0.055)).smoothUnion(0.025, sdf.ellipsoid([0.04, 0.045, 0.06]).at(0.16, 0.53, 0.08));
    const chopBase = headSurf.smoothIntersect(0.015, chopPatch);
    const chopLobes = sdf.smoothUnion(
      0.012,
      ...[0.63, 0.6, 0.57, 0.54, 0.51].map((y, i) => sdf.sphere(0.024 - i * 0.001).at(0.185 - i * 0.012, y, 0.055 + i * 0.016)),
      sdf.sphere(0.02).at(0.12, 0.488, 0.115),
    );
    const chopCurl = sdf.chain(
      [[0.19, 0.625, 0.04, 0.026], [0.19, 0.585, 0.062, 0.03], [0.178, 0.55, 0.078, 0.033], [0.158, 0.52, 0.09, 0.034], [0.135, 0.505, 0.095, 0.033]],
      0.02,
    );
    const chops = sdf.smoothUnion(0.02, chopBase, chopLobes, chopCurl).bone('head');
    k.body('chops', pair(chops), { color: hairColor, roughness: 0.6, detail: 0.004, bump: (x, y, z) => 0.0025 * Math.sin(y * 170 + x * 20 + z * 10) });

    // The mustache: thick and bushy above the laugh.
    const my = 0.558;
    const mz = (x: number, yy = my) => h.faceZ(x, yy) + 0.006;
    const mSide = sdf.smoothUnion(
      0.014,
      sdf.capsule([0.0, my - 0.002, mz(0.0)], [0.04, my - 0.012, mz(0.04)], 0.0185),
      sdf.capsule([0.04, my - 0.012, mz(0.04)], [0.08, my - 0.014, mz(0.08)], 0.0165),
      sdf.capsule([0.08, my - 0.014, mz(0.08)], [0.118, my - 0.01, mz(0.118)], 0.0135),
      sdf.sphere(0.0125).at(0.136, my - 0.002, mz(0.136, my - 0.002)),
    );
    k.body('mustache', sdf.smoothUnion(0.012, mSide, sep(mSide)).bone('head'), { color: hairColor, roughness: 0.6, detail: 0.003 });

    // The full beard: a thick band along the jaw from the chops around the chin, with a bushy lower mass.
    const beardPts: [number, number, number, number][] = [
      [0.15, 0.545, 0.05, 0.03],
      [0.133, 0.505, 0.095, 0.033],
      [0.1, 0.468, 0.13, 0.036],
      [0.055, 0.44, 0.15, 0.037],
      [0.0, 0.43, 0.155, 0.037],
    ];
    const beardSide = sdf.chain(beardPts, 0.02);
    const beardMass = sdf.ellipsoid([0.1, 0.055, 0.055]).at(0, 0.435, 0.125);
    const beardTuft = sdf.sphere(0.036).at(0, 0.416, 0.13);
    const beard = sdf.smoothUnion(0.025, beardSide, beardSide.mirror('x', 0), beardMass, beardTuft);
    k.body('beard', beard.bone('head'), { color: hairColor, roughness: 0.6, detail: 0.004, bump: (x, y, z) => 0.0025 * Math.sin(x * 130 + y * 40 + z * 20) });

    // A ruddy flush: the cheeks in a warm red, as thin shells over the head.
    const cheeks = sdf.ellipsoid([0.06, 0.045, 0.09]).at(0.115, 0.57, 0.1).mirror('x', 0);
    const ruddy = h.head.round(0.003).smoothIntersect(0.012, cheeks);
    k.body('ruddy', ruddy.bone('head'), { color: k.tint('skin', { color: '#d96858', follow: 0.5 }), roughness: 0.55, detail: 0.004 });

    // ------------------------------------------------------------------ the coat: velvet to the thigh, a plump belly, open at the front
    // A plump torso: the belly and hips widen 1.25 times in width and depth, the shoulders stay.
    const plump = (t: sdf.Shape, g: number) => t.smoothUnion(0.05, t.scale([g, 1, g]).smoothIntersect(0.05, sdf.halfSpace([0, 1, 0], 0.4)));
    const coatBelly = sdf.ellipsoid([0.255, 0.175, 0.255]).at(0, 0.27, 0.045);
    const skirt = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.3],
            [0.19, 0.3],
            [0.222, 0.24],
            [0.236, 0.19],
            [0.242, 0.15],
            [0, 0.15],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.94]);
    const coatSolid = sdf
      .smoothUnion(0.05, plump(h.torso.round(0.028), 1.25), coatBelly, skirt)
      .intersect(sdf.box([0.9, 0.312, 0.9]).at(0, 0.306, 0));
    const opening = sdf.box([0.2, 0.5, 0.4], 0.01).at(0, 0.26, 0.2);
    const coatShell = coatSolid.subtract(opening);
    const sleeve = h.perArm((j) =>
      sdf.smoothUnion(
        0.015,
        sdf.cone(lerp(SHOULDER, j.ELBOW, -0.1), j.ELBOW, 0.066, 0.06).bone('upperarm.L'),
        sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.9), 0.06, 0.056).bone('forearm.L'),
      ),
    );
    const coat = sdf.smoothUnion(0.015, h.weighted(coatShell), sleeve);
    k.body('coat', coat, {
      color: h.tint.shirt ?? '#6b3e22',
      roughness: 0.85,
      detail: 0.005,
    });

    // Cream fur trim: the collar, both front edges, the hem, and the cuffs.
    const collar = sdf.torus(0.1, 0.031).scale([1, 1, 0.9]).at(0, 0.452, -0.012);
    const lapel = coatSolid
      .round(0.016)
      .intersect(sep(sdf.box([0.05, 0.34, 0.6], 0.012).at(0.125, 0.3, 0.3)))
      .intersect(sdf.halfSpace([0, 1, 0], 0.46));
    const hem = coatSolid.round(0.016).intersect(sdf.box([0.9, 0.045, 0.9]).at(0, 0.172, 0)).subtract(opening.round(-0.002));
    const furCuff = h.perArm((j) => sdf.cone(lerp(j.ELBOW, j.WRIST, 0.58), lerp(j.ELBOW, j.WRIST, 0.9), 0.064, 0.066).round(0.006).bone('forearm.L'));
    const fur = sdf.smoothUnion(0.01, h.weighted(sdf.smoothUnion(0.012, collar, lapel, hem)), furCuff);
    k.body('fur', fur, {
      color: C.fur,
      roughness: 0.97,
      detail: 0.004,
      bump: (x, y, z) => 0.004 * noise.fbm(x * 90, y * 90, z * 90, 2),
    });

    // Brass buttons on the coat fronts.
    const buttons = sdf.union(
      ...[0.37, 0.27].map((y) => {
        const x = 0.178;
        const z = sdf.raycast(coatSolid.round(0.0), [x, y, 1], [0, 0, -1])![2];
        return sdf.sphere(0.014).at(x, y, z + 0.002);
      }),
    );
    k.body('buttons', sep(buttons).bone('chest'), { color: C.gold, roughness: 0.35, metalness: 0.8, detail: 0.003 });

    // ------------------------------------------------------------------ waistcoat, belt, chain, medallion
    const vestBelly = sdf.ellipsoid([0.215, 0.155, 0.222]).at(0, 0.262, 0.045);
    const vNeck = sdf.extrude(profile.polygon([[-0.06, 0.5], [0.06, 0.5], [0, 0.4]]), 0.3).at(0, 0, 0.15);
    const vestRay = sdf.smoothUnion(0.04, plump(h.torso.round(0.012), 1.2), vestBelly);
    const vestSolid = vestRay.intersect(sdf.box([0.8, 0.3, 0.8]).at(0, 0.3, 0)).subtract(vNeck);
    const vest = h.weighted(vestSolid);
    k.body('waistcoat', vest, {
      color: C.vest,
      roughness: 0.8,
      detail: 0.005,
      bump: (x, y, z) => 0.0015 * Math.sin(x * 160) * Math.cos(y * 150 + z * 40),
    });
    const beltY = 0.222;
    const belt = vestSolid.round(0.008).intersect(h.band(beltY - 0.02, beltY + 0.02));
    const buckleZ = sdf.raycast(vestSolid, [0, beltY, 1], [0, 0, -1])![2];
    const buckle = sdf.cylinder(0.03, 0.014, 0.005).rotateX(90).at(0, beltY, buckleZ + 0.006);
    const boss = sdf.cylinder(0.019, 0.012, 0.005).rotateX(90).at(0, beltY, buckleZ + 0.014);
    k.body('belt', h.weighted(belt), { color: C.belt, roughness: 0.7, detail: 0.004 });
    k.body('buckle', sdf.smoothUnion(0.006, buckle, boss).bone('spine'), { color: C.gold, roughness: 0.35, metalness: 0.8, detail: 0.003 });

    // The chain of office: a thick gold chain from the collar over the lapels to a big round medallion.
    const coatRay = coatSolid.round(0.016);
    const zAt = (shape: sdf.Shape, x: number, y: number) => sdf.raycast(shape, [x, y, 1], [0, 0, -1])?.[2] ?? -1;
    const cz = (x: number, y: number) => Math.max(zAt(vestRay, x, y), x > 0.098 ? zAt(coatRay, x, y) : -1, 0.05) + 0.012;
    const chainPts = [[0.13, 0.445], [0.112, 0.408], [0.086, 0.372], [0.054, 0.346], [0.02, 0.338]] as const;
    const chainSide = sdf.chain(chainPts.map(([x, y]) => [x, y, cz(x, y), 0.0125] as [number, number, number, number]), 0.006);
    const chain = sdf.smoothUnion(0.006, chainSide, chainSide.mirror('x', 0));
    const medY = 0.296;
    const medZ = sdf.raycast(vestRay, [0, medY, 1], [0, 0, -1])![2];
    const medal = sdf.smoothUnion(
      0.006,
      sdf.cylinder(0.05, 0.02, 0.008).rotateX(90).at(0, medY, medZ + 0.008),
      sdf.cylinder(0.034, 0.02, 0.007).rotateX(90).at(0, medY, medZ + 0.016),
      sdf.sphere(0.014).at(0, medY + 0.052, medZ + 0.008),
    );
    k.body('chain', chain.bone('chest'), { color: C.gold, roughness: 0.35, metalness: 0.8, detail: 0.003 });
    k.body('medal', medal.bone('chest'), { color: C.gold, roughness: 0.3, metalness: 0.8, detail: 0.003 });

    // ------------------------------------------------------------------ trousers and buckled shoes
    const trouserLeg = sdf.smoothUnion(
      0.012,
      sdf.capsule(HIP, KNEE, 0.052).bone('leg.L'),
      sdf.cone(KNEE, [ANKLE[0], 0.1, 0.002], 0.05, 0.047).bone('shin.L'),
    );
    k.body('trousers', sdf.smoothUnion(0.03, sdf.ellipsoid([0.12, 0.052, 0.09]).at(0, 0.2, 0).bone('hips'), pair(trouserLeg)), {
      color: C.pants,
      roughness: 0.85,
    });
    const shoe = sdf
      .smoothUnion(0.025, sdf.ellipsoid([0.058, 0.044, 0.1]).at(0, 0.04, 0.04), sdf.sphere(0.052).at(0, 0.052, -0.005))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    k.body('shoes', pair(shoe.rotateY(12).at(ANKLE[0], 0, 0).bone('foot.L')), { color: C.shoe, roughness: 0.55 });
    const buckleFrame = sdf
      .box([0.054, 0.036, 0.02], 0.004)
      .subtract(sdf.box([0.03, 0.016, 0.2], 0.002))
      .rotateX(-36)
      .at(0, 0.074, 0.095);
    k.body('buckles', pair(buckleFrame.rotateY(12).at(ANKLE[0], 0, 0).bone('foot.L')), { color: C.buckle, roughness: 0.3, metalness: 0.8, detail: 0.003 });

    // ------------------------------------------------------------------ the brass key (right fist, x < 0)
    // Built along local X (the bit toward -X, the bow toward +X), turned so the bow is up, then moved to the posed grip.
    const gr = h.arms.R.GRIP;
    // Built at the grip: the ring above the fist, the shaft out to the side (-X), the toothed bit at its end.
    const keyAt = (s: sdf.Shape) => s.rotateZ(8).at(-gr[0], gr[1], gr[2]);
    const ringY = 0.042;
    const bow = sdf.torus(0.04, 0.0145).rotateX(90).at(0, ringY, 0);
    const bowLobes = sdf.union(
      ...[90, 52, 128].map((a) => sdf.sphere(0.019).at(Math.cos((a * Math.PI) / 180) * 0.052, ringY + Math.sin((a * Math.PI) / 180) * 0.052, 0)),
    );
    const shaft = sdf.capsule([-0.04, ringY, 0], [-0.215, ringY, 0], 0.0175);
    const collarA = sdf.cylinder(0.026, 0.014, 0.004).rotateZ(90).at(-0.075, ringY, 0);
    const collarB = sdf.cylinder(0.022, 0.012, 0.004).rotateZ(90).at(-0.1, ringY, 0);
    const plate = sdf.box([0.085, 0.1, 0.03], 0.004).at(-0.2, 0, 0);
    const bit = plate.subtract(sdf.box([0.016, 0.05, 0.1]).at(-0.18, -0.04, 0)).subtract(sdf.box([0.016, 0.05, 0.1]).at(-0.22, -0.04, 0));
    const key = sdf.smoothUnion(0.006, bow, bowLobes, shaft, collarA, collarB, bit);
    k.body('key', keyAt(key), { color: C.brass, roughness: 0.35, metalness: 0.8, detail: 0.0035, bone: 'knife.R' });

    // ------------------------------------------------------------------ the coin purse (left fist, x > 0)
    const gl = h.arms.L.GRIP;
    const sack = sdf.smoothUnion(
      0.02,
      sdf.ellipsoid([0.05, 0.047, 0.05]).at(gl[0], gl[1] - 0.062, gl[2]),
      sdf.cone([gl[0], gl[1] - 0.025, gl[2]], [gl[0], gl[1] + 0.015, gl[2]], 0.024, 0.018),
      sdf.sphere(0.026).at(gl[0] - 0.012, gl[1] + 0.024, gl[2] + 0.004),
      sdf.sphere(0.022).at(gl[0] + 0.014, gl[1] + 0.022, gl[2] - 0.004),
    );
    k.body('purse', sack, { color: C.purse, roughness: 0.7, detail: 0.004, bone: 'knife.L', bump: (x, y, z) => 0.002 * noise.fbm(x * 60, y * 60, z * 60, 2) });
    const tie = sdf.torus(0.022, 0.0085).at(gl[0], gl[1] - 0.022, gl[2]);
    k.body('purseTie', tie, { color: C.tie, roughness: 0.8, detail: 0.003, bone: 'knife.L' });
  },
});
