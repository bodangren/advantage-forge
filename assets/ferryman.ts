import { profile, noise, rgb, sdf, type Rgb } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Ferryman — Chibi Quest wilderness NPC (catalog `npcs/wilderness/ferryman`), about 1.0 m to the top
 * of the straw hat, faces +Z. Target: docs/npc-mockups/ferryman_001.jpg. Built on the humanoid kind.
 *
 * Role: a river NPC who carries the player across and tells river legends; seen at river crossings
 *   in 3D and as a 128 px sprite. The wide hat, the big gray beard, the pole, and the lantern read.
 * One idea: a kindly old river man, all hat and whiskers, with a long pole in one hand and a glowing
 *   paper lantern in the other.
 * Shape language: round and soft (hat, beard, lantern), with the long thin pole as the one hard line.
 * Palette (60/30/10): straw #d8c08a (hat), faded blue #6a8aa8 (shirt), dark gray #4a4448 (trousers);
 *   gray hair and beard #a8a4a0; brown sash #7a5a3a, pole #8a6a3a; warm lantern #f0d8a0 / glow #ffc060.
 * Value plan: the pale hat and beard frame the face; the blue shirt and dark trousers carry the body;
 *   the lantern glow is the accent.
 * Bodies: skin, nose, ears, hair, brows, mustache, beard, hat, shirt, cuffs, sash, pants, sandals,
 *   toes, pole, lantern, lantern-caps.
 * Rig: the humanoid kind's skeleton and clips. The pole is rigid on `knife.R`, the lantern on `knife.L`.
 */

const C = {
  hat: '#c8ae74',
  hatBand: '#94743f',
  sash: '#7a5a3a',
  pants: '#4a4448',
  sandal: '#c8a870',
  pole: '#8a6a3a',
  lantern: '#ffbe70',
  glow: '#ff9a30',
  rib: '#c0702a',
  cap: '#4a3022',
  smile: '#b4584a',
};

const rad = Math.PI / 180;

export default humanoidAsset({
  name: 'ferryman',
  description: 'A calm old ferryman in a wide straw hat with a long gray beard, holding a long punting pole and a small paper lantern.',
  reference: 'docs/npc-mockups/ferryman_001.jpg',
  variants: {
    skin: { light: '#e8b48e', fair: '#f2c7a4', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { gray: '#a8a4a0', brown: '#5a301d', black: '#231a17', blond: '#c4974a', auburn: '#8e3b1c', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { teal: '#3f6a6a', indigo: '#46608a', linen: '#c8b892', madder: '#a8624e' },
  },
  presets: {
    delta: { skin: 'tan', hair: 'silver', eyes: 'hazel', cloth: 'madder' },
  },
  // Both arms keep the held pose in every clip, so the pole and the lantern never swing into the head or the body.
  pose: {
    L: { elbow: [0.18, 0.332, 0.012] as const, wrist: [0.205, 0.238, 0.03] as const },
    R: { elbow: [0.18, 0.332, 0.012] as const, wrist: [0.205, 0.238, 0.03] as const },
  },
  hair: false,
  undershirt: false,
  pants: false,
  shoes: false,
  lashes: false,

  // A gentle smile below the mustache, and bushy arched brows (the brow bodies sit over the face).
  paintSkin(skin, h) {
    const oldBrows = sdf.extrude(profile.arc(0.1, 0.036, 54, 126), 0.3).at(0.1, 0.622, 0.1).mirror('x');
    const oldSmile = sdf.extrude(profile.arc(0.07, 0.024, 234, 306), 0.3).at(0, 0.6, 0.1);
    const smile = sdf.extrude(profile.arc(0.06, 0.012, 236, 304), 0.3).at(0, 0.568, 0.1);
    return skin
      .paintWhere(oldBrows, h.tint.skin!, 0.002)
      .paintWhere(oldSmile, h.tint.skin!, 0.002)
      .paintWhere(smile, C.smile, 0.002);
  },

  extra(k, h) {
    const { SHOULDER, ELBOW, WRIST, HIP, KNEE, ANKLE, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    type V3 = readonly [number, number, number];
    type P4 = [number, number, number, number];
    const lerp = (a: V3, b: V3, t: number): [number, number, number] => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
    // A point on the face surface at (x, y), lifted out by `lift`.
    const pt = (x: number, y: number, lift = 0.004): [number, number, number] => [x, y, h.faceZ(Math.abs(x), y) + lift];
    const hairColor = k.tint('hair');
    const hairDark = k.tint('hair', -0.22);
    const strands = (x: number, y: number, z: number, base: Rgb) => (Math.sin(x * 140 + z * 40 + Math.sin(y * 50) * 2) > 0.7 ? rgb(hairDark) : base);

    // ------------------------------------------------------------------ nose and ears (bigger, in the skin tint)
    const nose = sdf.ellipsoid([0.03, 0.027, 0.03]).at(0, 0.572, h.faceZ(0, 0.572) + 0.002).bone('head');
    k.body('nose', nose, { color: h.tint.skin!, roughness: 0.55, detail: 0.004, textureDensity: 2 });
    const ear = pair(
      sdf
        .ellipsoid([0.03, 0.054, 0.04])
        .subtract(sdf.sphere(0.02).at(0.019, 0, 0.008))
        .rotateY(-16)
        .at(0.204, 0.62, -0.006)
        .bone('head'),
    );
    k.body('ears', ear, { color: h.tint.skin!, roughness: 0.55, detail: 0.004 });

    // ------------------------------------------------------------------ hair: a close cap, temple tufts, nape lobes, a few forehead curls
    const skull = sdf.ellipsoid([0.213, 0.207, 0.197]).at(0, HEAD_Y + 0.003, -0.004);
    const faceCut = sdf.ellipsoid([0.25, 0.17, 0.22]).at(0, 0.6, 0.15);
    const earCut = pair(sdf.ellipsoid([0.05, 0.1, 0.08]).at(0.215, 0.6, 0.04));
    const cap = skull.smoothSubtract(0.015, faceCut, earCut).smoothIntersect(0.03, sdf.halfSpace([0, -1, 0], -0.59));
    const tuft = (z: number, y: number, len: number, r: number) =>
      pair(
        sdf.chain(
          [
            [0.185, y + 0.03, z + 0.03, r],
            [0.212, y, z, r * 0.95],
            [0.222, y - len * 0.5, z - 0.018, r * 0.8],
            [0.212, y - len, z - 0.03, r * 0.5],
          ],
          0.012,
        ),
      );
    const temples = sdf.union(tuft(0.075, 0.715, 0.055, 0.03), tuft(0.03, 0.71, 0.07, 0.032), tuft(-0.02, 0.7, 0.075, 0.03), tuft(-0.065, 0.69, 0.07, 0.03));
    const nape = sdf.union(
      ...[-80, -58, -36, -12, 12, 36, 58, 80].map((a, i) =>
        sdf.chain(
          [
            [0.17 * Math.sin(a * rad), 0.66, -0.15 * Math.cos(a * rad), 0.032],
            [0.186 * Math.sin(a * rad), 0.6, -0.162 * Math.cos(a * rad), 0.032],
            [0.18 * Math.sin(a * rad), 0.565 - (i % 2) * 0.012, -0.16 * Math.cos(a * rad), 0.02],
          ],
          0.012,
        ),
      ),
    );
    const curl = (x: number, y: number, s: number) =>
      sdf.chain(
        [
          [...pt(x, y + 0.012, 0.004), 0.017],
          [...pt(x + 0.02 * s, y + 0.022, 0.014), 0.016],
          [...pt(x + 0.036 * s, y + 0.006, 0.016), 0.013],
        ],
        0.008,
      );
    const curls = sdf.union(curl(-0.045, 0.745, -1), curl(-0.005, 0.755, 1), curl(0.03, 0.75, -1), curl(0.062, 0.742, 1));
    const hair = sdf.smoothUnion(0.012, cap, temples, nape, curls).paintFn(strands);
    k.body('hair', hair.bone('head'), { color: hairColor, roughness: 0.65, detail: 0.005 });

    // Bushy arched brows over the eyes.
    const brow = pair(
      sdf.chain(
        [
          [...pt(0.03, 0.714, 0.01), 0.013],
          [...pt(0.07, 0.726, 0.012), 0.016],
          [...pt(0.115, 0.726, 0.01), 0.016],
          [...pt(0.152, 0.704, 0.006), 0.012],
        ],
        0.012,
      ),
    );
    k.body('brows', brow.bone('head'), { color: hairColor, roughness: 0.65, detail: 0.004 });

    // ------------------------------------------------------------------ long mustache (its own body)
    const mustLock = (s: number, dy: number, rr: number) =>
      sdf.chain(
        [
          [...pt(0.012 * s, 0.552 + dy, 0.014), 0.028 * rr],
          [...pt(0.055 * s, 0.546 + dy, 0.016), 0.031 * rr],
          [...pt(0.105 * s, 0.522 + dy, 0.02), 0.027 * rr],
          [...pt(0.15 * s, 0.498 + dy, 0.02), 0.021 * rr],
          [0.19 * s, 0.505 + dy, pt(0.15, 0.5, 0.026)[2] - 0.004, 0.016 * rr],
          [0.21 * s, 0.535 + dy, pt(0.15, 0.5, 0.026)[2] - 0.016, 0.011 * rr],
        ],
        0.016,
      );
    const mustache = sdf.smoothUnion(0.01, mustLock(1, 0, 1), mustLock(-1, 0, 1), mustLock(1, 0.016, 0.8), mustLock(-1, 0.016, 0.8)).paintFn(strands);
    k.body('mustache', mustache.bone('head'), { color: hairColor, roughness: 0.65, detail: 0.004 });

    // ------------------------------------------------------------------ the long beard: cheek whiskers and hanging locks
    const whisker = (s: number) =>
      sdf.chain(
        [
          [0.19 * s, 0.6, 0.02, 0.026],
          [...pt(0.158 * s, 0.56, 0.01), 0.03],
          [...pt(0.11 * s, 0.512, 0.012), 0.034],
          [...pt(0.05 * s, 0.482, 0.014), 0.036],
        ],
        0.02,
      );
    const lock = (x: number, len: number, w: number, zz = 0) =>
      sdf.chain(
        [
          [x, 0.5, 0.09 + zz, w],
          [x * 1.05, 0.5 - len * 0.35, 0.11 + zz, w * 1.05],
          [x * 0.85, 0.5 - len * 0.7, 0.118 + zz, w * 0.7],
          [x * 0.5, 0.5 - len, 0.112 + zz, w * 0.22],
        ],
        0.016,
      );
    const beardCore = sdf.smoothUnion(0.03, sdf.ellipsoid([0.11, 0.05, 0.085]).at(0, 0.49, 0.075), whisker(1), whisker(-1));
    const beard = sdf
      .smoothUnion(0.014, beardCore, lock(0, 0.155, 0.052), lock(0.04, 0.12, 0.034), lock(-0.04, 0.13, 0.034), lock(0.075, 0.085, 0.03, -0.01), lock(-0.075, 0.09, 0.03, -0.01))
      .paintFn(strands);
    k.body('beard', beard.bone('head'), { color: hairColor, roughness: 0.7, detail: 0.004, bump: (x, y, z) => 0.0025 * Math.sin(x * 150 + z * 30 + y * 12) });

    // ------------------------------------------------------------------ the wide straw hat: a low cone with a wide, drooping brim
    const hatPose = (s: sdf.Shape) => s.rotateX(-9).at(0, HEAD_Y + 0.012, 0);
    const hatShape = sdf.revolve(
      profile.polygon([
        [0, 0.272],
        [0.05, 0.268],
        [0.11, 0.246],
        [0.16, 0.19],
        [0.192, 0.126],
        [0.208, 0.103],
        [0.28, 0.088],
        [0.34, 0.074],
        [0.352, 0.066],
        [0.34, 0.058],
        [0.28, 0.072],
        [0.2, 0.088],
        [0, 0.088],
      ]),
    ).round(0.004);
    const weave = (x: number, y: number, z: number) => 0.0022 * Math.sin(Math.hypot(x, z) * 260) + 0.0015 * Math.sin(Math.atan2(x, z) * 60 + y * 20);
    const hatBand = sdf.box([0.6, 0.024, 0.6]).at(0, 0.115, 0).intersect(sdf.cylinder(0.222, 0.5));
    const hat = hatPose(hatShape.paintWhere(hatBand, C.hatBand, 0.004)).bone('head');
    k.body('hat', hat, { color: C.hat, roughness: 0.92, detail: 0.005, bump: weave });

    // ------------------------------------------------------------------ the shirt: loose, faded blue, rolled sleeves
    const upper = sdf.cone(lerp(SHOULDER, ELBOW, -0.1), ELBOW, 0.052, 0.049).bone('upperarm.L');
    const fore = sdf.cone(ELBOW, lerp(ELBOW, WRIST, 0.5), 0.049, 0.048).bone('forearm.L');
    const sleeve = sdf.smoothUnion(0.015, upper, fore);
    const shirtTorso = h.torso.round(0.012).intersect(sdf.halfSpace([0, -1, 0], -0.215));
    const shirt = sdf.smoothUnion(0.012, h.weighted(shirtTorso), pair(sleeve));
    k.body('shirt', shirt, { color: h.tint.shirt ?? '#6a8aa8', roughness: 0.88, bump: (x, y, z) => 0.0025 * noise.fbm(x * 40, y * 40, z * 40, 2) });

    // The rolled cuffs and the open collar (a darker shade of the shirt).
    const cuff = sdf.cone(lerp(ELBOW, WRIST, 0.44), lerp(ELBOW, WRIST, 0.56), 0.053, 0.054).round(0.006).bone('forearm.L');
    const collar = sdf.torus(0.062, 0.02).scale([1, 1, 0.9]).at(0, 0.452, -0.012).bone('chest');
    k.body('cuffs', sdf.union(pair(cuff), collar), { color: k.tint('cloth', -0.18), roughness: 0.9, detail: 0.004 });

    // ------------------------------------------------------------------ the brown cloth sash with a rope knot
    const sash = h
      .torso.round(0.022)
      .intersect(h.band(0.222, 0.272));
    const torsoZ = sdf.raycast(h.torso.round(0.022), [0, 0.247, 1], [0, 0, -1])?.[2] ?? 0.12;
    const knot = sdf.smoothUnion(
      0.012,
      sdf.sphere(0.03).at(-0.07, 0.25, torsoZ + 0.006),
      sdf.chain(
        [
          [-0.07, 0.235, torsoZ + 0.012, 0.014],
          [-0.085, 0.2, torsoZ + 0.004, 0.013],
          [-0.08, 0.17, torsoZ - 0.01, 0.011],
        ],
        0.008,
      ),
      sdf.chain(
        [
          [-0.06, 0.24, torsoZ + 0.012, 0.014],
          [-0.045, 0.205, torsoZ + 0.005, 0.012],
          [-0.05, 0.175, torsoZ - 0.008, 0.01],
        ],
        0.008,
      ),
    );
    const sashAll = sdf.smoothUnion(0.01, h.weighted(sash), knot.bone('spine')).paintFn((x, y, z, base) => (Math.sin(y * 260 + x * 30) > 0.8 ? rgb('#5e4228') : base));
    k.body('sash', sashAll, { color: C.sash, roughness: 0.95, detail: 0.004, bump: (x, y, z) => 0.003 * noise.fbm(x * 60, y * 60, z * 60, 2) });

    // ------------------------------------------------------------------ dark trousers rolled to the shins
    const pantsTorso = h.torso.round(0.006).smoothIntersect(0.012, sdf.halfSpace([0, 1, 0], 0.245));
    const trouserLeg = sdf.smoothUnion(
      0.012,
      sdf.capsule(HIP, KNEE, 0.052).bone('leg.L'),
      sdf.cone(KNEE, [0.0895, 0.1, 0.0], 0.05, 0.054).bone('shin.L'),
    );
    const rolled = sdf.cylinder(0.059, 0.034, 0.013).at(0.0895, 0.108, 0).bone('shin.L');
    k.body('pants', sdf.smoothUnion(0.03, h.weighted(pantsTorso), pair(sdf.smoothUnion(0.008, trouserLeg, rolled))), {
      color: C.pants,
      roughness: 0.9,
      bump: (x, y, z) => 0.002 * noise.fbm(x * 45, y * 45, z * 45, 2),
    });

    // ------------------------------------------------------------------ straw sandals and bare toes
    const sandal = sdf
      .smoothUnion(
        0.01,
        sdf.ellipsoid([0.05, 0.014, 0.105]).at(0, 0.013, 0.04),
        sdf.torus(0.034, 0.008).rotateX(90).scale([1, 1.25, 1]).at(0, 0.026, -0.005),
        sdf.torus(0.034, 0.008).rotateX(90).scale([1, 1.25, 1]).at(0, 0.026, 0.06),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('sandals', pair(sandal), { color: C.sandal, roughness: 0.95, detail: 0.004, bump: (x, y, z) => 0.002 * Math.sin(x * 220) * Math.cos(z * 140) });
    const toes = sdf
      .union(
        ...[-0.026, -0.009, 0.009, 0.026].map((dx, i) => sdf.ellipsoid([0.011, 0.01, 0.013]).at(dx, 0.03, 0.098 - Math.abs(dx) * 0.2 - (i === 0 ? 0 : 0))),
      )
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('toes', pair(toes), { color: h.tint.skin!, roughness: 0.55, detail: 0.004 });

    // ------------------------------------------------------------------ the punting pole (right fist, x < 0)
    // 1.1 m long, 0.034 m thick, upright and leaning out 15 degrees so it clears the brim; the fist
    // grips it at the grip center and its foot rests 0.03 m above the ground.
    const grip: V3 = [-0.232, 0.185, 0.034];
    const lean = 21 * rad;
    const dir: V3 = [-Math.sin(lean), Math.cos(lean), 0];
    const footLen = (grip[1] - 0.03) / Math.cos(lean);
    const foot: V3 = [grip[0] - dir[0] * footLen, 0.03, grip[2]];
    const top: V3 = [foot[0] + dir[0] * 1.1, foot[1] + dir[1] * 1.1, foot[2]];
    const pole = sdf.capsule(foot, top, 0.017).bone('knife.R');
    k.body('pole', pole, {
      color: C.pole,
      roughness: 0.8,
      detail: 0.004,
      bump: (x, y, z) => 0.0025 * Math.sin(y * 70 + Math.sin(x * 90 + z * 90) * 2),
    });

    // ------------------------------------------------------------------ the paper lantern (left fist, x > 0)
    const lc: V3 = [0.234, 0.092, 0.024];
    const lanternShape = sdf
      .ellipsoid([0.075, 0.062, 0.075])
      .at(...lc)
      .paintFn((x, y, z, base) => {
        const a = Math.atan2(z - lc[2], x - lc[0]);
        return Math.sin(a * 8 + Math.PI / 8) > 0.93 || Math.abs(y - lc[1]) > 0.053 ? rgb(C.rib) : base;
      })
      .bone('knife.L');
    k.body('lantern', lanternShape, { color: C.lantern, roughness: 0.6, emissive: C.glow, emissiveIntensity: 0.8, detail: 0.004, flat: true });
    const lanternCaps = sdf.union(
      sdf.cylinder(0.036, 0.016, 0.005).at(lc[0], lc[1] + 0.06, lc[2]),
      sdf.cylinder(0.036, 0.016, 0.005).at(lc[0], lc[1] - 0.06, lc[2]),
      sdf.capsule([lc[0], lc[1] + 0.06, lc[2]], [lc[0], 0.172, lc[2]], 0.0095),
    );
    k.body('lantern-caps', lanternCaps.bone('knife.L'), { color: C.cap, roughness: 0.7, detail: 0.003 });
  },
});
