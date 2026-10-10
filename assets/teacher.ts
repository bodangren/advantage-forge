import { profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Teacher — Chibi Quest settlement NPC (catalog `npcs/settlement/teacher`), about 1.0 m to the top
 * of the hair, faces +Z. Target: docs/npc-mockups/teacher_001.jpg. Built on the humanoid kind.
 *
 * Role: the school NPC who teaches lessons and gives reading quests; seen in 3D and as a 128 px sprite.
 *   The raised pointer, the red apple, the big glasses, and the blue bow must read.
 * One idea: a kind girl in a mustard cardigan whose raised pointer stick and held-out red apple
 *   frame a big-eyed, bespectacled smile.
 * Shape language: round and soft (hair locks, braid, cardigan, apple), with the thin pointer as the
 *   one hard form.
 * Palette (60/30/10): mustard cardigan #c8982a and brown skirt #6b4a2c (the body), white blouse
 *   #f6f1ea, auburn hair #8e3b1c; blue bow #3a5a9a and red apple #c03a30 as the accents.
 * Value plan: the light blouse and the glasses frame the face; the dark skirt anchors the base; the
 *   apple is the strongest color point.
 * Bodies: skin, hair, braid, glasses, blouse, collar, bow, cardigan, cuffs, skirt, shoes, pointer,
 *   apple, stem, leaf.
 * Rig: the humanoid kind's skeleton and clips. Both arms keep a held pose; the pointer is rigid on
 *   `knife.R` and the apple on `knife.L`.
 */

const C = {
  hair: '#8e3b1c',
  glasses: '#4a3a2a',
  blouse: '#f6f1ea',
  bow: '#3a5a9a',
  skirt: '#8e4c2a',
  belt: '#74401f',
  shoe: '#4a3424',
  sole: '#2e1f15',
  pointer: '#9a6a3a',
  knob: '#5e3f22',
  apple: '#c03a30',
  appleHi: '#e06450',
  stem: '#4a3424',
  leaf: '#3f6a44',
};

export default humanoidAsset({
  name: 'teacher',
  description: 'A kind teacher with a side braid and a mustard cardigan, raising a pointer stick and holding a red apple.',
  reference: 'docs/npc-mockups/teacher_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { auburn: '#8e3b1c', brown: '#5a301d', black: '#231a17', blond: '#c4974a', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { mustard: '#c8982a', russet: '#a8582e', plum: '#84506a', moss: '#64773f' },
  },
  presets: {
    classic: { skin: 'fair', hair: 'auburn', eyes: 'brown', cloth: 'mustard' },
    plum: { skin: 'tan', hair: 'black', eyes: 'hazel', cloth: 'plum' },
  },
  hair: false,
  undershirt: false,
  pants: false,
  shoes: false,
  // The right hand raised beside the head (the pointer); the left hand out in front (the apple).
  pose: {
    R: { elbow: [0.2, 0.34, 0.02], wrist: [0.25, 0.42, 0.07] },
    L: { elbow: [0.17, 0.335, 0.05], wrist: [0.2, 0.33, 0.15] },
  },

  // Thin arched brows over the big glasses and a warm, wide smile with round corners.
  paintSkin(skin, h) {
    const oldBrows = sdf.extrude(profile.arc(0.1, 0.036, 54, 126), 0.3).at(0.1, 0.622, 0.1).mirror('x');
    const brows = sdf.extrude(profile.arc(0.075, 0.012, 56, 124), 0.3).at(0.1, 0.65, 0.1).mirror('x');
    const oldSmile = sdf.extrude(profile.arc(0.07, 0.02, 234, 306), 0.3).at(0, 0.53 + 0.07, 0.1);
    const smile = sdf.extrude(profile.arc(0.07, 0.014, 238, 302), 0.3).at(0, 0.53 + 0.07, 0.1);
    return skin
      .paintWhere(oldBrows, h.tint.skin!, 0.002)
      .paintWhere(oldSmile, h.tint.skin!, 0.003)
      .paintWhere(brows, h.tint.brow!, 0.002)
      .paintWhere(smile, h.tint.mouth!, 0.002);
  },

  extra(k, h) {
    const { SHOULDER, ANKLE, HEAD_Y, EYE } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];
    const rad = Math.PI / 180;

    // ------------------------------------------------------------------ hair: a cap, a swept fringe, a roll, side and back locks
    const hairColor = k.tint('hair');
    // A point above the skull: azimuth th (0 = front, + toward +x), elevation ph, radius factor f.
    const sk = (th: number, ph: number, f: number, r: number): [number, number, number, number] => [
      0.205 * f * Math.cos(ph * rad) * Math.sin(th * rad),
      HEAD_Y + 0.2 * f * Math.sin(ph * rad),
      0.19 * f * Math.cos(ph * rad) * Math.cos(th * rad),
      r,
    ];
    const shell = sdf.ellipsoid([0.209, 0.202, 0.194]).at(0, HEAD_Y, 0);
    const slope = sdf.halfSpace([0, -0.7071, 0.7071], -0.395);
    const earHole = sdf.ellipsoid([0.06, 0.07, 0.065]).at(0.2, 0.612, -0.005).mirror('x', 0);
    const cap = sdf.ellipsoid([0.211, 0.204, 0.196]).at(0, HEAD_Y, 0).smoothIntersect(0.03, slope);
    // Back and side locks: separate wavy strands from the crown down to the shoulder line.
    const lock = (th: number, endY: number, sway: number, r: number) => {
      const top = sk(th, 64, 1.04, r);
      const mid = sk(th, 22, 1.07, r + 0.002);
      const low = sk(th, -14, 1.07, r + 0.003);
      const tx = Math.cos(th * rad); // tangent direction (x part) at this azimuth
      const tz = -Math.sin(th * rad);
      const yA = HEAD_Y - 0.16;
      const yB = (yA + endY) / 2;
      const pt = (f: number, y: number, w: number, rr: number): [number, number, number, number] => [low[0] * f + tx * w, y, low[2] * f + tz * w, rr];
      return sdf.chain([top, mid, low, pt(0.94, yA, sway, r + 0.002), pt(0.86, yB, -sway * 1.4, r), pt(0.8, endY, sway * 1.2, r * 0.55)], 0.01);
    };
    const locks: sdf.Shape[] = [];
    const lockSpec: [number, number, number][] = [[124, 0.5, 0.01], [144, 0.46, -0.012], [164, 0.52, 0.012]];
    for (const [th, e, w] of lockSpec) for (const s of [1, -1]) locks.push(lock(s * th, e, w, 0.03));
    locks.push(lock(180, 0.47, 0.012, 0.031));
    // The fringe: broad swept locks plus short side bangs that frame the face; the parting is on the viewer's left.
    const bang = (th0: number, th1: number, ph1: number, r: number, f = 1.05) =>
      sdf.chain([sk(th0, 66, f, r), sk((th0 + th1) / 2, 54, f + 0.004, r + 0.003), sk(th1, ph1, f - 0.004, r - 0.006)], 0.02);
    const fringe = [
      bang(-30, 76, 30, 0.036),
      bang(-24, 56, 38, 0.036),
      bang(-16, 34, 44, 0.035),
      bang(-26, -44, 42, 0.034, 1.048),
      bang(-22, -74, 30, 0.032),
    ];
    const tuft = (th: number, th1: number, ph1: number, r: number) =>
      sdf.chain([sk(th, 74, 1.04, r), sk((th + th1) / 2, 52, 1.07, r), sk(th1, ph1, 1.075, r * 0.7)], 0.012);
    const bangs = [tuft(-40, -52, 37, 0.03), tuft(-10, -16, 35, 0.03), tuft(18, 26, 36, 0.03), tuft(40, 52, 35, 0.029)];
    // The roll on top, on the viewer's left of the parting, and the tuft that curls from it.
    const roll = sdf.smoothUnion(
      0.025,
      sdf.ellipsoid([0.06, 0.036, 0.05]).rotateZ(-22).rotateY(18).at(-0.095, 0.85, 0.05),
      sdf.ellipsoid([0.04, 0.032, 0.036]).rotateZ(14).at(-0.135, 0.825, 0.07),
    );
    const temples = [1, -1].map((s) =>
      sdf.chain([sk(s * 62, 52, 1.06, 0.03), sk(s * 76, 30, 1.07, 0.028), sk(s * 84, 4, 1.07, 0.026), sk(s * 86, -18, 1.06, 0.021)], 0.012),
    );
    // The side parting: a shallow groove from the crown toward the forehead, on the viewer's left.
    const p3 = (th: number, ph: number, f: number): [number, number, number] => {
      const [x, y, z] = sk(th, ph, f, 0);
      return [x, y, z];
    };
    const parting = sdf.capsule(p3(-26, 84, 1.0), p3(-26, 52, 1.1), 0.0045);
    const hair = sdf
      .smoothUnion(0.012, cap, ...locks, ...fringe, ...bangs, roll, ...temples)
      .smoothSubtract(0.012, earHole)
      .smoothSubtract(0.004, parting)
      .bone('head');
    k.body('hair', hair, { color: hairColor, roughness: 0.55, detail: 0.004 });

    // ------------------------------------------------------------------ the braid on the pointer side (-x)
    const braidYs = [0.53, 0.49, 0.45, 0.41, 0.37, 0.33, 0.29];
    const braidParts = braidYs.map((y, i) => {
      const t = i / (braidYs.length - 1);
      const r = 0.046 - i * 0.0028;
      const tilt = i % 2 === 0 ? 26 : -26;
      return sdf.ellipsoid([r * 1.05, r * 0.92, r * 0.95]).rotateZ(tilt).at(-0.118 + 0.038 * t, y, 0.035 + 0.09 * Math.min(1, t * 1.6));
    });
    const braidRoot = sdf.chain([[-0.17, 0.62, -0.05, 0.038], [-0.15, 0.575, -0.03, 0.038], [-0.125, 0.53, 0.035, 0.04]], 0.012).bone('head');
    const braidLow = sdf.smoothUnion(0.016, ...braidParts, sdf.chain([[-0.08, 0.29, 0.125, 0.026], [-0.077, 0.245, 0.126, 0.016]], 0.006)).bone('chest');
    const braid = sdf.smoothUnion(0.012, braidRoot, braidLow);
    k.body('braid', braid, { color: hairColor, roughness: 0.55, detail: 0.004 });
    // The hair tie.
    k.body('tie', sdf.torus(0.02, 0.008).rotateX(90).at(-0.079, 0.272, 0.127).bone('chest'), { color: C.bow, roughness: 0.7, detail: 0.003 });

    // ------------------------------------------------------------------ glasses: big rounded rims on the face
    const ex = EYE[0];
    const ey = EYE[1];
    const RX = 0.066;
    const RY = 0.058;
    const rr = 0.0115;
    const gap = 0.008;
    const onFace = (x: number, y: number): [number, number, number] => [x, y, h.faceZ(Math.abs(x), y) + gap + rr];
    const rim = (sx: number) => {
      const pts = Array.from({ length: 32 }, (_, i) => {
        const a = (2 * Math.PI * i) / 32;
        const sq = 0.85; // a rounded square: flatten the circle toward the corners
        const c = Math.cos(a);
        const s = Math.sin(a);
        return onFace(sx * ex + RX * Math.sign(c) * Math.pow(Math.abs(c), sq), ey - 0.002 + RY * Math.sign(s) * Math.pow(Math.abs(s), sq));
      });
      return sdf.union(...pts.map((p, i) => sdf.capsule(p, pts[(i + 1) % pts.length]!, rr)));
    };
    const bridge = sdf.union(
      sdf.capsule(onFace(-(ex - RX), ey + 0.006), onFace(0, ey + 0.016), 0.0095),
      sdf.capsule(onFace(0, ey + 0.016), onFace(ex - RX, ey + 0.006), 0.0095),
    );
    const armPts: [number, number, number][] = [onFace(ex + RX, ey + 0.004)];
    for (let i = 1; i <= 7; i++) {
      const z = armPts[0]![2] - (i * (armPts[0]![2] + 0.005)) / 7;
      const hit = sdf.raycast(h.head, [1, ey + 0.004, z], [-1, 0, 0]);
      if (hit) armPts.push([hit[0] + gap + 0.0085, ey + 0.004, z]);
    }
    const arm = (sx: number) =>
      sdf.union(...armPts.slice(0, -1).map((p, i) => sdf.capsule([sx * p[0], p[1], p[2]], [sx * armPts[i + 1]![0], armPts[i + 1]![1], armPts[i + 1]![2]], 0.0085)));
    k.body('glasses', sdf.union(rim(1), rim(-1), bridge, arm(1), arm(-1)).bone('head'), { color: C.glasses, roughness: 0.35, detail: 0.003 });

    // ------------------------------------------------------------------ white blouse, collar, and the blue bow
    const sleeveEnds = h.perArm((j) =>
      sdf.smoothUnion(0.012, sdf.cone(lerp(j.ELBOW, j.WRIST, 0.7), lerp(j.ELBOW, j.WRIST, 1.0), 0.04, 0.038).bone('forearm.L')),
    );
    k.body('blouse', sdf.smoothUnion(0.01, h.weighted(h.torso.round(0.004)), sleeveEnds), { color: C.blouse, roughness: 0.85 });
    const collarRing = sdf.torus(0.064, 0.016).scale([1, 1, 0.92]).at(0, 0.452, -0.01);
    const flap = (s: 1 | -1) => sdf.ellipsoid([0.034, 0.012, 0.045]).rotateZ(-22 * s).rotateX(-14).at(0.045 * s, 0.446, 0.06);
    k.body('collar', sdf.union(collarRing, flap(1), flap(-1)).bone('chest'), { color: C.blouse, roughness: 0.85, detail: 0.004 });
    const torsoZ = (y: number) => sdf.raycast(h.torso.round(0.02), [0, y, 1], [0, 0, -1])![2];
    const bowZ = torsoZ(0.425) + 0.006;
    const loop = (s: 1 | -1) =>
      sdf.smoothUnion(
        0.008,
        sdf.ellipsoid([0.034, 0.022, 0.014]).rotateZ(-14 * s).at(0.04 * s, 0.428 + 0.004, bowZ),
        sdf.ellipsoid([0.02, 0.012, 0.01]).rotateZ(-14 * s).at(0.045 * s, 0.428 + 0.004, bowZ + 0.005),
      );
    const tail = (s: 1 | -1) => sdf.ellipsoid([0.012, 0.03, 0.007]).rotateZ(14 * s).at(0.018 * s, 0.395, bowZ - 0.001);
    const knot = sdf.ellipsoid([0.02, 0.019, 0.016]).at(0, 0.428, bowZ + 0.002);
    k.body('bow', sdf.smoothUnion(0.006, loop(1), loop(-1), tail(1), tail(-1), knot).bone('chest'), { color: C.bow, roughness: 0.7, detail: 0.003 });

    // ------------------------------------------------------------------ mustard cardigan: open front, long sleeves, cuffs
    const body = h.torso
      .round(0.02)
      .intersect(sdf.halfSpace([0, 1, 0], 0.4 + 0.045))
      .intersect(sdf.halfSpace([0, -1, 0], -0.196));
    // The open front: a trapezoid (narrow at the collar, wider at the hem) cut through the front.
    const gapShape = sdf.extrude(profile.polygon([[-0.026, 0.46], [0.026, 0.46], [0.056, 0.19], [-0.056, 0.19]], { smooth: false }), 0.4).at(0, 0, 0.2);
    const cardiBody = h.weighted(body.smoothSubtract(0.006, gapShape));
    const cardiSleeves = h.perArm((j) =>
      sdf.smoothUnion(
        0.016,
        sdf.cone(lerp(SHOULDER, j.ELBOW, -0.1), j.ELBOW, 0.052, 0.049).bone('upperarm.L'),
        sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.86), 0.049, 0.046).bone('forearm.L'),
      ),
    );
    const cloth = h.tint.shirt!;
    k.body('cardigan', sdf.smoothUnion(0.012, cardiBody, cardiSleeves), { color: cloth, roughness: 0.88, detail: 0.005 });
    const cuffs = h.perArm((j) => sdf.cone(lerp(j.ELBOW, j.WRIST, 0.74), lerp(j.ELBOW, j.WRIST, 0.99), 0.052, 0.052).round(0.003).bone('forearm.L'));
    // Two patch pockets on the skirt-side hem of the fronts.
    const pocket = (s: 1 | -1) => {
      const x = 0.1 * s;
      const y = 0.225;
      const z = sdf.raycast(body, [x, y, 1], [0, 0, -1])?.[2] ?? 0.1;
      return sdf.ellipsoid([0.03, 0.026, 0.01]).at(x, y, z - 0.002).bone('spine');
    };
    k.body('cuffs', sdf.union(cuffs, pocket(1), pocket(-1)), { color: k.tint('cloth', -0.12), roughness: 0.88, detail: 0.004 });

    // ------------------------------------------------------------------ long brown skirt with a belt, to the shins
    const skirtProfile = profile.polygon(
      [
        [0, 0.3],
        [0.126, 0.3],
        [0.13, 0.27],
        [0.142, 0.22],
        [0.168, 0.17],
        [0.19, 0.125],
        [0.2, 0.108],
        [0.198, 0.1],
        [0, 0.1],
      ],
      { smooth: true, samples: 8 },
    );
    const skirt = sdf
      .revolve(skirtProfile)
      .scale([1, 1, 0.82])
      .displace(0.005, (x, y, z) => (y < 0.15 ? Math.sin(Math.atan2(x, z) * 9) * (0.15 - y) * 5 : 0))
      .paintWhere(h.band(0.268, 0.292), C.belt, 0.002)
      .paintWhere(h.band(0.1, 0.116), '#8a4824', 0.004);
    k.body('skirt', h.weighted(skirt), { color: C.skirt, roughness: 0.88, detail: 0.005 });

    // ------------------------------------------------------------------ brown shoes with a toe cap, a heel, and a strap
    const shoe = sdf
      .smoothUnion(
        0.025,
        sdf.ellipsoid([0.058, 0.044, 0.1]).at(0, 0.04, 0.04),
        sdf.sphere(0.052).at(0, 0.052, -0.005),
        sdf.cylinder(0.05, 0.075, 0.014).at(0, 0.07, 0),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const toeCap = sdf.ellipsoid([0.05, 0.03, 0.05]).at(0, 0.04, 0.11);
    const heel = sdf.box([0.07, 0.025, 0.05], 0.008).at(0, 0.0125, -0.04).paint(C.sole);
    const strap = sdf.torus(0.052, 0.009).scale([1.05, 1, 1.1]).at(0, 0.09, 0.03);
    const shoes = sdf
      .union(shoe.paintWhere(toeCap, '#5e4430', 0.006), strap, heel)
      .intersect(sdf.halfSpace([0, -1, 0], 0.12))
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('shoes', pair(shoes), { color: C.shoe, roughness: 0.55 });

    // ------------------------------------------------------------------ the pointer, in the right fist
    const gR = h.arms.R.GRIP;
    const gp: [number, number, number] = [-gR[0], gR[1], gR[2]];
    const dir = (() => {
      const v = [-0.42, 0.9, -0.1];
      const l = Math.hypot(v[0]!, v[1]!, v[2]!);
      return [v[0]! / l, v[1]! / l, v[2]! / l] as const;
    })();
    const at = (t: number): [number, number, number] => [gp[0] + dir[0] * t, gp[1] + dir[1] * t, gp[2] + dir[2] * t];
    const pointer = sdf.smoothUnion(
      0.006,
      sdf.capsule(at(-0.065), at(0.17), 0.016),
      sdf.cone(at(0.17), at(0.238), 0.016, 0.009),
      sdf.sphere(0.021).at(...at(-0.07)),
    );
    k.body('pointer', pointer.bone('knife.R').paintWhere(sdf.sphere(0.03).at(...at(-0.072)), C.knob, 0.004), { color: C.pointer, roughness: 0.6, detail: 0.003 });

    // ------------------------------------------------------------------ the apple, in the left hand
    const gL = h.arms.L.GRIP;
    const ac: [number, number, number] = [gL[0] + 0.002, gL[1] + 0.052, gL[2] + 0.012];
    const apple = sdf
      .smoothUnion(
        0.02,
        sdf.ellipsoid([0.042, 0.039, 0.041]).at(ac[0], ac[1], ac[2]),
        sdf.ellipsoid([0.036, 0.034, 0.036]).at(ac[0], ac[1] - 0.008, ac[2]),
      )
      .smoothSubtract(0.008, sdf.ellipsoid([0.012, 0.012, 0.012]).at(ac[0], ac[1] + 0.04, ac[2]))
      .bone('knife.L');
    k.body('apple', apple.paintWhere(sdf.sphere(0.02).at(ac[0] + 0.016, ac[1] + 0.014, ac[2] + 0.03), C.appleHi, 0.012), { color: C.apple, roughness: 0.22, detail: 0.003 });
    const stem = sdf.chain([[ac[0], ac[1] + 0.03, ac[2], 0.0065], [ac[0] + 0.002, ac[1] + 0.052, ac[2], 0.0055], [ac[0] + 0.012, ac[1] + 0.066, ac[2] - 0.002, 0.0045]], 0.003).bone('knife.L');
    k.body('stem', stem, { color: C.stem, roughness: 0.8, detail: 0.002 });
    const leaf = sdf
      .ellipsoid([0.026, 0.0045, 0.012])
      .rotateZ(-16)
      .rotateY(-30)
      .at(ac[0] - 0.026, ac[1] + 0.054, ac[2] + 0.004)
      .bone('knife.L');
    k.body('leaf', leaf, { color: C.leaf, roughness: 0.6, detail: 0.003 });
  },
});
