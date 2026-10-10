import { profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Student — Chibi Quest settlement NPC (catalog `npcs/settlement/student`), about 1.0 m to the top
 * of the cap, faces +Z. Target: docs/npc-mockups/student_001.jpg. Built on the humanoid kind
 * (worked examples: assets/baker.ts, assets/courier.ts).
 *
 * Role: a school NPC who studies with the player; seen at the school and the library in 3D and as a
 *   128 px sprite. The red curls under the green cap, the big grin with freckles, and the raised
 *   chalk slate must read.
 * One idea: a cheerful freckled boy in a dark green cap and a short blue jacket, holding up a small
 *   black slate with a white chalk star.
 * Shape language: round and soft (cap, curls, face, satchel), with the slate as the one hard form.
 * Palette (60/30/10): jacket #2a3a5a (the cloth slot), shorts #6b4a2c, shirt #f6f1ea, socks #7a7880;
 *   cap #2f4a3a; hair #a8502a; tie #3a5a9a; satchel #7a4a2c, shoes #4a3424; slate #2a2c30 in a #9a6a3a
 *   frame with a #f6f1ea star (the accent).
 * Value plan: the dark cap over the light freckled face is the focal point; the dark jacket frames the
 *   white shirt; the white star on the black slate is the second accent.
 * Bodies: skin, ears, cap, hair, shirt, collar, jacket, cuffs, tie, strap, satchel, shorts, socks,
 *   shoes, slate.
 * Rig: the humanoid kind's skeleton and clips. The right arm keeps the raised `pose`; the slate is
 *   rigid on `knife.R`. The strap runs from the right shoulder to the bag at the right hip, as in the
 *   mockup (the brief names the left hip; the mockup wins).
 */

const C = {
  hair: '#a8502a',
  cap: '#2f4a3a',
  capSeam: '#243a2e',
  shirt: '#f6f1ea',
  tie: '#34475f',
  shorts: '#6b4a2c',
  sock: '#827e7c',
  sockBand: '#9c9892',
  shoe: '#4a3424',
  sole: '#2a1c14',
  satchel: '#7a4a2c',
  strap: '#5f3a22',
  brass: '#c8a040',
  slate: '#2a2c30',
  frame: '#9a6a3a',
  chalk: '#f6f1ea',
  freckle: '#c8805a',
  mouth: '#8a2e2a',
  teeth: '#fbf6ee',
};

export default humanoidAsset({
  name: 'student',
  description: 'A cheerful freckled schoolboy in a green cap and a short blue jacket, with a satchel, holding up a slate with a chalk star.',
  reference: 'docs/npc-mockups/student_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { red: '#a8502a', brown: '#5a301d', black: '#231a17', blond: '#c4974a', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { navy: '#262e42', plum: '#4a3358', pine: '#2c4538', wine: '#5a2f3a' },
  },
  presets: {
    bright: { skin: 'tan', hair: 'brown', eyes: 'hazel', cloth: 'wine' },
  },
  pose: { R: { elbow: [0.215, 0.365, 0.05], wrist: [0.255, 0.47, 0.1] } },
  lashes: false,
  hair: false,
  undershirt: false,
  pants: false,
  shoes: false,

  // A big grin with round corners and one white tooth band, thin arched brows, and freckles.
  paintSkin(skin, h) {
    const y = 0.538;
    const grin = profile.polygon(
      [
        [-0.05, 0.01],
        [-0.025, 0.003],
        [0, 0.0],
        [0.025, 0.003],
        [0.05, 0.01],
        [0.058, 0.0],
        [0.05, -0.011],
        [0.03, -0.027],
        [0, -0.034],
        [-0.03, -0.027],
        [-0.05, -0.011],
        [-0.058, 0.0],
      ],
      { smooth: true, samples: 6 },
    );
    const mouth = h.onFace(sdf.extrude(grin, 0.3).scale([0.92, 0.9, 1]).at(0, 0.0, 0), 0, y);
    const teeth = mouth.intersect(sdf.box([0.07, 0.013, 1]).at(0, y - 0.01, 0));
    const oldBrows = sdf.extrude(profile.arc(0.1, 0.036, 54, 126), 0.3).at(0.1, 0.622, 0.1).mirror('x');
    const brows = sdf.extrude(profile.arc(0.07, 0.013, 55, 125), 0.3).at(0.1, 0.657, 0.1).mirror('x');
    const spots: [number, number, number][] = [
      [0.07, 0.572, 0.0058],
      [0.095, 0.585, 0.0052],
      [0.12, 0.575, 0.0058],
      [0.085, 0.558, 0.0052],
      [0.108, 0.56, 0.0056],
      [0.13, 0.55, 0.005],
      [0.06, 0.555, 0.005],
      [0.078, 0.535, 0.0048],
      [0.115, 0.538, 0.005],
      [0.14, 0.572, 0.005],
    ];
    const freckles = sdf.union(...spots.map(([x, yy, r]) => h.onFace(sdf.sphere(r), x, yy))).mirror('x', 0);
    return skin
      .paintWhere(oldBrows, h.tint.skin!, 0.002)
      .paintWhere(brows, h.tint.brow!, 0.002)
      .paintWhere(freckles, C.freckle, 0.002)
      .paintWhere(mouth, C.mouth)
      .paintWhere(teeth, C.teeth, 0.002);
  },

  extra(k, h) {
    const { SHOULDER, HIP, KNEE, ANKLE, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];
    const jacketColor = h.tint.shirt ?? '#262e42';

    // ------------------------------------------------------------------ larger ears
    const bigEar = sdf
      .ellipsoid([0.03, 0.052, 0.036])
      .subtract(sdf.sphere(0.02).at(0.018, 0, 0.007))
      .rotateY(-12)
      .at(0.208, 0.612, -0.01)
      .bone('head');
    k.body('ears', pair(bigEar), { color: k.tint('skin'), roughness: 0.55, detail: 0.004 });

    // ------------------------------------------------------------------ the green cap with a short peak
    const capPose = (s: sdf.Shape) => s.rotateX(-8).at(0, HEAD_Y, 0);
    const dome = sdf
      .smoothUnion(
        0.03,
        sdf.ellipsoid([0.232, 0.15, 0.226]).at(0, 0.07, -0.005),
      )
      .smoothIntersect(0.02, sdf.halfSpace([0, -0.944, 0.33], -0.058))
      .smoothUnion(0.012, sdf.ellipsoid([0.1, 0.014, 0.068]).rotateX(24).at(0, 0.108, 0.208)); // the short peak
    const meridians = sdf.union(...[0, 60, 120].map((a) => sdf.box([0.007, 0.6, 0.6]).rotateY(a).at(0, 0.2, 0)));
    const button = sdf.sphere(0.017).at(0, 0.215, 0);
    const capSolid = capPose(dome);
    const cap = capPose(sdf.smoothUnion(0.012, dome, button).paintWhere(meridians.intersect(sdf.halfSpace([0, -1, 0], -0.1)), C.capSeam, 0.003));
    k.body('cap', cap.bone('head'), { color: C.cap, roughness: 0.9, detail: 0.005, bump: (x, y, z) => 0.003 * Math.sin(x * 55 + z * 35) * Math.cos(y * 45) });

    // ------------------------------------------------------------------ red curls: temples, fringe, nape
    const hairColor = k.tint('hair');
    const hp = (s: sdf.Shape) => capPose(s);
    const hairCap = hp(
      sdf
        .ellipsoid([0.211, 0.205, 0.195])
        .smoothIntersect(0.03, sdf.halfSpace([0, -1, 0], 0.07))
        .smoothIntersect(0.03, sdf.halfSpace([0, 0, 1], 0.01)),
    );
    const lock = (pts: number[][], r = 0.02) => hp(sdf.chain(pts.map((p) => [p[0]!, p[1]!, p[2]!, p[3]!]) as [number, number, number, number][], r));
    const temples = pair(
      lock([
        [0.186, 0.1, 0.08, 0.028],
        [0.194, 0.045, 0.07, 0.026],
        [0.194, 0.0, 0.055, 0.022],
        [0.19, -0.03, 0.045, 0.015],
      ]),
    );
    const rimY = (z: number) => 0.35 * z + 0.07;
    const fringe = (deg: number, len: number, flick: number, radius: number) => {
      const a = (deg * Math.PI) / 180;
      const pt = (dd: number, drop: number, rr: number, grow = 1): number[] => {
        const b = ((deg + dd) * Math.PI) / 180;
        return [0.197 * grow * Math.sin(b), rimY(0.182 * Math.cos(a)) - drop, 0.18 * grow * Math.cos(b), rr];
      };
      return lock([pt(0, 0.0, radius * 0.9, 0.96), pt(flick * 0.6, len * 0.35, radius, 0.99), pt(-flick * 0.3, len * 0.7, radius * 0.95, 1.01), pt(flick * 0.7, len, radius * 0.85, 1.02)], 0.02);
    };
    const bangs = [
      fringe(-70, 0.065, 9, 0.025),
      fringe(-48, 0.052, -10, 0.025),
      fringe(-26, 0.062, 10, 0.025),
      fringe(-6, 0.05, -10, 0.025),
      fringe(16, 0.06, 10, 0.025),
      fringe(38, 0.05, -10, 0.025),
      fringe(60, 0.062, 9, 0.025),
    ];
    const nape = [-0.15, -0.1, -0.05, 0, 0.05, 0.1, 0.15].map((x, i) => {
      const z = -0.15 * Math.sqrt(Math.max(0.2, 1 - (x / 0.2) ** 2));
      return lock([[x, 0.02, z, 0.034], [x * 1.02, -0.035, z - 0.006, 0.032], [x * 1.04, -0.066 - (i % 2) * 0.008, z + 0.002, 0.026]], 0.02);
    });
    k.body(
      'hair',
      sdf
        .smoothUnion(0.02, hairCap, temples, sdf.smoothUnion(0.012, ...bangs).intersect(hp(sdf.halfSpace([0, 0.944, -0.33], 0.06))), ...nape)
        .subtract(capSolid.round(0.004))
        .bone('head'),
      { color: hairColor, roughness: 0.6, detail: 0.005 },
    );

    // ------------------------------------------------------------------ shirt, collar, tie
    const shirt = h.weighted(h.torso.round(0.004));
    k.body('shirt', shirt, { color: C.shirt, roughness: 0.85 });
    const collarRing = sdf.torus(0.058, 0.016).scale([1, 1, 0.95]).at(0, 0.455, -0.008);
    const point = (sx: number) => sdf.box([0.05, 0.012, 0.055], 0.004).rotateZ(-sx * 28).rotateX(-22).at(sx * 0.034, 0.455, 0.056);
    k.body('collar', sdf.union(collarRing, point(1), point(-1)).bone('chest'), { color: C.shirt, roughness: 0.85, detail: 0.004 });

    const tieShell = h.torso.round(0.011);
    const front = sdf.box([0.5, 0.5, 0.4]).at(0, 0.35, 0.2);
    const blade = profile.polygon([[-0.013, 0.43], [0.013, 0.43], [0.024, 0.3], [0, 0.262], [-0.024, 0.3]]);
    const tieZ = (y: number) => sdf.raycast(tieShell, [0, y, 1], [0, 0, -1])![2];
    const knot = sdf.ellipsoid([0.02, 0.016, 0.014]).at(0, 0.443, tieZ(0.443) + 0.002);
    k.body('tie', h.weighted(sdf.smoothUnion(0.006, tieShell.intersect(sdf.extrude(blade, 0.5)).intersect(front), knot)), { color: C.tie, roughness: 0.8, detail: 0.004 });

    // ------------------------------------------------------------------ the short jacket, open at the front
    const opening = profile.polygon([[-0.044, 0.5], [0.044, 0.5], [0.05, 0.24], [-0.05, 0.24]]);
    const jacketBody = h.torso
      .round(0.02)
      .intersect(sdf.halfSpace([0, 1, 0], 0.5))
      .intersect(sdf.halfSpace([0, -1, 0], -0.256))
      .subtract(sdf.extrude(opening, 0.3).at(0, 0, 0.2).round(0.004));
    const sleeves = h.perArm((j) =>
      sdf.smoothUnion(
        0.015,
        sdf.cone(lerp(SHOULDER, j.ELBOW, -0.1), j.ELBOW, 0.05, 0.046).bone('upperarm.L'),
        sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.8), 0.046, 0.044).bone('forearm.L'),
      ),
    );
    k.body('jacket', sdf.smoothUnion(0.012, h.weighted(jacketBody), sleeves), { color: jacketColor, roughness: 0.85, detail: 0.005 });

    // The rolled white cuffs.
    const cuffs = h.perArm((j) => sdf.cone(lerp(j.ELBOW, j.WRIST, 0.78), lerp(j.ELBOW, j.WRIST, 1.0), 0.05, 0.05).round(0.004).bone('forearm.L'));
    k.body('cuffs', cuffs, { color: C.shirt, roughness: 0.9, detail: 0.004 });

    // ------------------------------------------------------------------ satchel on a strap from the right shoulder
    const strapShell = h.torso.round(0.03);
    const chestBox = sdf.box([0.6, 0.24, 0.6]).at(0, 0.36, 0);
    const strapShape = strapShell.intersect(sdf.box([0.034, 0.5, 0.6], 0.006).rotateZ(-14).at(-0.085, 0.36, 0)).intersect(chestBox);
    k.body('strap', h.weighted(strapShape), { color: C.strap, roughness: 0.65, detail: 0.004 });

    const bagPose = (s: sdf.Shape) => s.rotateY(-8).at(-0.192, 0.265, 0.01);
    const bag = sdf.smoothUnion(
      0.01,
      sdf.box([0.075, 0.135, 0.165], 0.025),
      sdf.box([0.082, 0.065, 0.172], 0.02).at(-0.003, 0.05, 0), // the flap
    );
    const bagPainted = bag
      .paintWhere(sdf.box([0.4, 0.008, 0.4]).at(0, 0.017, 0), C.strap, 0.003)
      .paintWhere(sdf.box([0.4, 0.02, 0.016]).at(0, 0.0, 0), C.strap, 0.003);
    k.body('satchel', bagPose(bagPainted).bone('spine'), { color: C.satchel, roughness: 0.7, detail: 0.004, bump: (x, y, z) => 0.002 * Math.sin(x * 70 + y * 50 + z * 30) });
    const clasp = sdf.box([0.012, 0.028, 0.028], 0.004).at(-0.043, 0.012, 0);
    k.body('brass', bagPose(clasp).bone('spine'), { color: C.brass, roughness: 0.4, metalness: 0.7, detail: 0.003 });

    // ------------------------------------------------------------------ brown shorts with a rolled hem
    const shortEnd: [number, number, number] = [0.078, 0.145, 0];
    const shortLeg = sdf.capsule(HIP, shortEnd, 0.05).bone('leg.L').intersect(sdf.halfSpace([0, -1, 0], -(shortEnd[1] - 0.004)));
    const hem = sdf.torus(0.047, 0.012).at(shortEnd[0], shortEnd[1] + 0.006, shortEnd[2]).bone('leg.L');
    const shortTop = h.torso.round(0.014).intersect(sdf.box([0.6, 0.12, 0.6]).at(0, 0.21, 0)).bone('hips');
    k.body('shorts', sdf.smoothUnion(0.03, shortTop, pair(sdf.smoothUnion(0.008, shortLeg, hem))), { color: C.shorts, roughness: 0.85 });

    // ------------------------------------------------------------------ gray socks with a ribbed band, brown shoes
    const sockShape = sdf.cone([ANKLE[0], 0.112, 0.002], [ANKLE[0], 0.05, 0.002], 0.05, 0.047).bone('shin.L');
    const sockBand = sdf.torus(0.05, 0.017).at(ANKLE[0], 0.108, 0.002).bone('shin.L');
    k.body('socks', pair(sdf.smoothUnion(0.006, sockShape, sockBand)).paintWhere(h.band(0.09, 0.126), C.sockBand, 0.004), {
      color: C.sock,
      roughness: 1,
      detail: 0.004,
      bump: (x, y, z) => 0.003 * Math.sin(Math.atan2(z, x - 0.098) * 26) + 0.0015 * Math.sin(y * 150),
    });
    const foot = sdf
      .smoothUnion(0.025, sdf.ellipsoid([0.056, 0.042, 0.102]).at(0, 0.04, 0.042), sdf.sphere(0.05).at(0, 0.05, -0.005))
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    const shoe = foot
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .paintWhere(h.band(-0.2, 0.014), C.sole, 0.002)
      .paintWhere(sdf.box([0.4, 0.014, 0.014]).rotateY(12).at(ANKLE[0], 0.066, 0.05), '#6a4a34', 0.003);
    k.body('shoes', pair(shoe), { color: C.shoe, roughness: 0.6 });

    // ------------------------------------------------------------------ the chalk slate in the right hand
    const GR = h.arms.R.GRIP;
    const W = 0.13;
    const H2 = 0.18;
    const T = 0.03;
    const star = profile.polygon(
      Array.from({ length: 10 }, (_, i): [number, number] => {
        const r = i % 2 === 0 ? 0.03 : 0.0125;
        const a = Math.PI / 2 + (i * Math.PI) / 5;
        return [r * Math.cos(a), r * Math.sin(a)];
      }),
    );
    const board = sdf
      .box([W, H2, T], 0.007)
      .subtract(sdf.box([W - 0.03, H2 - 0.03, 0.012], 0.004).at(0, 0, T / 2))
      .paintWhere(sdf.box([W - 0.028, H2 - 0.028, 0.3]), C.slate, 0.001)
      .paintWhere(sdf.extrude(star, 0.3, 0.001).at(0, 0.02, 0), C.chalk, 0.0015)
      .paintWhere(sdf.box([0.034, 0.007, 0.3], 0.002).rotateZ(-30).at(0.0, -0.038, 0), C.chalk, 0.0015);
    const inHand = (s: sdf.Shape) => s.rotateY(10).rotateZ(8).at(-GR[0] - 0.07, GR[1] + 0.07, GR[2] + 0.03);
    k.body('slate', inHand(board).bone('knife.R'), { color: C.frame, roughness: 0.7, detail: 0.003 });
  },
});
