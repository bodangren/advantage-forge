import { profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Archaeologist — Chibi Quest wilderness NPC (catalog `npcs/wilderness/archaeologist`), about 1.0 m to
 * the top of the sun helmet, faces +Z, stands on y = 0. Target: docs/npc-mockups/archaeologist_001.jpg.
 * Built on the humanoid kind.
 *
 * Role: a ruins NPC who studies relics and gives exploration quests; seen at dig sites in 3D and as a
 *   128 px sprite; the helmet, the raised magnifier, the clay tablet, and the open smile must read.
 * One idea: an excited young digger whose big cream sun helmet and brass magnifying glass frame a
 *   wide-eyed grin, with a cracked carved tablet offered on the other hand.
 * Shape language: round and soft (dome, cheeks, boots), with the flat tablet and the ring of the
 *   magnifier as the two crisp forms.
 * Palette (60/30/10): khaki #b8a478 / #a8946a (shirt, shorts) and cream #e8dcc0 (helmet); leather
 *   browns #7a4a2c (satchel), #5a3a24 (boots), #6b4226 (band); auburn hair #8e3b1c; accent brass
 *   #c8a040 with a pale lens #c8e0e8 and a terracotta tablet #b07a50 with #7a4a30 marks.
 * Value plan: the light helmet over the light face is the focal point; khaki mid values; dark brown
 *   boots, belt, and strap anchor the bottom; the brass and tablet are the accents.
 * Bodies: skin (open smile), hat, band, hair locks, shirt, pockets, belt, shorts, boots, satchel,
 *   strap, magnifier, lens, tablet.
 * Rig: the humanoid kind's skeleton and clips; both arms keep a held pose in every clip. The magnifier
 *   is rigid on `knife.R` and the tablet on `knife.L`.
 */

const C = {
  hat: '#e8dcc0',
  band: '#6b4226',
  hair: '#8e3b1c',
  shorts: '#a8946a',
  leather: '#7a4a2c',
  boot: '#5a3a24',
  sole: '#35231a',
  brass: '#c8a040',
  lens: '#c8e0e8',
  handle: '#4a3426',
  tablet: '#b07a50',
  mark: '#7a4a30',
  mouth: '#8a2e2a',
  tongue: '#d8706a',
  teeth: '#fbf6ee',
};

export default humanoidAsset({
  name: 'archaeologist',
  description: 'An excited young archaeologist in a cream sun helmet, holding up a brass magnifying glass and a cracked clay tablet.',
  reference: 'docs/npc-mockups/archaeologist_001.jpg',
  variants: {
    skin: { tan: '#d49a72', fair: '#f2c7a4', light: '#e8b48e', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { auburn: '#8e3b1c', brown: '#5a301d', black: '#231a17', blond: '#c4974a', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { khaki: '#b8a478', sand: '#cdb98a', olive: '#8a8a58', clay: '#a8643c' },
  },
  presets: {
    dusk: { skin: 'brown', hair: 'black', eyes: 'hazel', cloth: 'olive' },
  },
  hair: false,
  undershirt: false,
  pants: false,
  shoes: false,
  pose: {
    R: { elbow: [0.21, 0.36, 0.03], wrist: [0.255, 0.45, 0.08] },
    L: { elbow: [0.17, 0.335, 0.05], wrist: [0.2, 0.33, 0.15] },
  },

  // An excited open smile: a wide crescent with round corners, one band of teeth, a tongue; the kind's
  // brows are painted over with skin and higher arched brows read as eager.
  paintSkin(skin, h) {
    const y = 0.538;
    const grin = profile.polygon(
      [
        [-0.056, 0.014],
        [-0.03, 0.003],
        [0, 0.0],
        [0.03, 0.003],
        [0.056, 0.014],
        [0.046, -0.012],
        [0.023, -0.03],
        [0, -0.036],
        [-0.023, -0.03],
        [-0.046, -0.012],
      ],
      { smooth: true, samples: 6 },
    );
    const mouth = h.onFace(sdf.extrude(grin, 0.3), 0, y);
    const teeth = mouth.intersect(sdf.halfSpace([0, -1, 0], -(y - 0.011))).intersect(sdf.box([0.064, 0.1, 1]).at(0, y, 0));
    const tongue = h.onFace(sdf.ellipsoid([0.026, 0.014, 0.08]), 0, y - 0.03);
    const oldBrows = sdf.extrude(profile.arc(0.1, 0.036, 54, 126), 0.3).at(0.1, 0.622, 0.1).mirror('x');
    const brows = sdf.extrude(profile.arc(0.07, 0.013, 55, 125), 0.3).at(0.1, 0.657, 0.1).mirror('x');
    return skin
      .paintWhere(oldBrows, h.tint.skin!, 0.002)
      .paintWhere(brows, h.tint.brow!, 0.002)
      .paintWhere(mouth, C.mouth)
      .paintWhere(tongue.intersect(mouth), C.tongue, 0.004)
      .paintWhere(teeth, C.teeth, 0.002);
  },

  extra(k, h) {
    const { SHOULDER, HIP, KNEE, ANKLE, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const pairHard = (s: sdf.Shape) => s.mirror('x', 0);
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];
    const hairColor = k.tint('hair');
    const cloth = h.tint.shirt ?? '#b8a478';
    const clothDark = k.tint('cloth', -0.16);

    // ------------------------------------------------------------------ sun helmet: a dome and a brim all around
    const hatPose = (s: sdf.Shape) => s.rotateX(-6).at(0, HEAD_Y, 0);
    const dome = sdf.ellipsoid([0.228, 0.19, 0.22]).at(0, 0.095, 0).intersect(sdf.halfSpace([0, -1, 0], -0.052));
    const brim = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.095],
            [0.2, 0.095],
            [0.27, 0.086],
            [0.322, 0.066],
            [0.326, 0.052],
            [0.31, 0.046],
            [0.26, 0.058],
            [0.19, 0.062],
            [0, 0.062],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.94]);
    const hat = hatPose(sdf.smoothUnion(0.02, dome, brim)).bone('head');
    k.body('hat', hat, { color: C.hat, roughness: 0.88, detail: 0.005, bump: (x, y, z) => 0.0025 * Math.sin(x * 70 + z * 50) * Math.cos(y * 60) });
    const bandShape = hatPose(dome.round(0.007).intersect(sdf.box([1, 0.036, 1]).at(0, 0.118, 0))).bone('head');
    k.body('band', bandShape, { color: C.band, roughness: 0.75, detail: 0.004 });

    // ------------------------------------------------------------------ hair: a cap that hugs the skull and separate locks
    const hairShell = sdf.ellipsoid([0.212, 0.206, 0.196]).at(0, HEAD_Y, 0);
    const skullCap = hairShell
      .smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], -(HEAD_Y + 0.045)))
      .smoothUnion(
        0.02,
        hairShell.smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], -(HEAD_Y - 0.07))).smoothIntersect(0.02, sdf.halfSpace([0, 0, 1], -0.03)),
      );
    // Fringe locks across the forehead: they start at the cap and end in rounded tips above the brows.
    const faceZ = (x: number, y: number) => h.faceZ(Math.min(0.17, Math.abs(x)), y);
    const fringeX = [-0.165, -0.125, -0.085, -0.045, -0.005, 0.035, 0.075, 0.115, 0.155];
    const fringe = fringeX.map((x, i) => {
      const len = 0.052 + 0.01 * Math.sin(i * 2.1);
      const top = HEAD_Y + 0.115;
      const sweep = x < 0 ? -0.018 : 0.012;
      const zTop = faceZ(x, top) + 0.002;
      const zEnd = faceZ(x + sweep, top - len) + 0.012;
      return sdf.chain(
        [
          [x, top, zTop, 0.03],
          [x + sweep * 0.4, top - len * 0.5, (zTop + zEnd) / 2 + 0.006, 0.03],
          [x + sweep, top - len, zEnd, 0.024],
        ],
        0.012,
      );
    });
    // Temple locks beside the face (the right one longer and curled, as in the mockup).
    const temple = (sx: number, long: number) =>
      sdf.chain(
        [
          [sx * 0.19, HEAD_Y + 0.05, 0.03, 0.03],
          [sx * 0.205, HEAD_Y - 0.01, 0.045, 0.026],
          [sx * 0.208, HEAD_Y - 0.07 - 0.04 * long, 0.04, 0.022],
          [sx * 0.19, HEAD_Y - 0.12 - 0.07 * long, 0.052, 0.016],
        ],
        0.012,
      );
    // A short ponytail: a tie at the back of the skull and a swept tail with a curl.
    const tie = sdf.torus(0.03, 0.012).rotateX(60).at(0, HEAD_Y - 0.01, -0.195);
    const tail = sdf.chain(
      [
        [0, HEAD_Y - 0.005, -0.2, 0.034],
        [0, HEAD_Y - 0.03, -0.255, 0.036],
        [0.01, HEAD_Y - 0.095, -0.285, 0.03],
        [0.025, HEAD_Y - 0.155, -0.275, 0.018],
      ],
      0.02,
    );
    const napeLocks = [-0.12, -0.06, 0.06, 0.12].map((x) =>
      sdf.chain(
        [
          [x, HEAD_Y - 0.01, -0.17, 0.028],
          [x * 1.15, HEAD_Y - 0.07, -0.17, 0.024],
          [x * 1.2, HEAD_Y - 0.115, -0.15, 0.015],
        ],
        0.012,
      ),
    );
    const hairAll = sdf
      .smoothUnion(0.012, skullCap, ...fringe, temple(1, 0), temple(-1, 1), tail, ...napeLocks)
      .smoothUnion(0.004, tie)
      .bone('head');
    k.body('hair', hairAll, {
      color: hairColor,
      roughness: 0.6,
      detail: 0.004,
      bump: (x, y, z) => 0.002 * Math.sin(x * 120 + y * 40) * Math.cos(z * 90),
    });

    // ------------------------------------------------------------------ khaki shirt: rolled short sleeves and a collar
    const sleeves = h.perArm((j) => sdf.cone(lerp(SHOULDER, j.ELBOW, -0.12), lerp(j.ELBOW, j.WRIST, 0.12), 0.049, 0.045).bone('upperarm.L'));
    const shirt = sdf.smoothUnion(0.012, h.weighted(h.torso.intersect(sdf.halfSpace([0, -1, 0], -0.225))), sleeves);
    k.body('shirt', shirt, { color: cloth, roughness: 0.85 });
    const rolls = h.perArm((j) => sdf.cone(lerp(j.ELBOW, j.WRIST, 0.02), lerp(j.ELBOW, j.WRIST, 0.16), 0.0495, 0.0505).round(0.004).bone('upperarm.L'));
    const collar = sdf.union(
      sdf.ellipsoid([0.04, 0.022, 0.014]).rotateZ(-34).at(0.036, 0.452, 0.066),
      sdf.ellipsoid([0.04, 0.022, 0.014]).rotateZ(34).at(-0.036, 0.452, 0.066),
      sdf.torus(0.06, 0.016).scale([1, 1, 0.82]).at(0, 0.452, -0.012),
    ).bone('chest');
    k.body('trim', sdf.union(rolls, collar), { color: clothDark, roughness: 0.9, detail: 0.004 });

    // Two chest pockets with flaps and brass buttons, on the torso surface.
    const tz = (x: number, y: number) => sdf.raycast(h.torso.round(0.002), [x, y, 1], [0, 0, -1])?.[2] ?? 0.1;
    const pocketAt = (x: number) => {
      const z = tz(x, 0.345);
      const flapZ = tz(x, 0.375);
      return sdf.union(
        sdf.box([0.052, 0.046, 0.012], 0.004).rotateX(-12).at(x, 0.342, z + 0.001),
        sdf.box([0.056, 0.02, 0.014], 0.005).rotateX(-12).at(x, 0.372, flapZ + 0.003),
      );
    };
    k.body('pockets', sdf.union(pocketAt(0.062), pocketAt(-0.062)).bone('chest'), { color: cloth, roughness: 0.88, detail: 0.004 });
    const button = (x: number) => sdf.sphere(0.0075).at(x, 0.364, tz(x, 0.364) + 0.012);
    const midButtons = [0.4, 0.31].map((y) => sdf.sphere(0.0085).at(0, y, tz(0, y) + 0.004));
    k.body('buttons', sdf.union(button(0.062), button(-0.062), ...midButtons).bone('chest'), { color: C.brass, roughness: 0.3, metalness: 0.9, detail: 0.003 });

    // ------------------------------------------------------------------ belt, buckle, shorts
    const belt = h.weighted(h.torso.round(0.01).intersect(h.band(0.222, 0.254)));
    k.body('belt', belt, { color: C.band, roughness: 0.65, detail: 0.004 });
    const buckleZ = tz(0, 0.238) + 0.012;
    const buckle = sdf.box([0.052, 0.04, 0.01], 0.004).subtract(sdf.box([0.03, 0.022, 0.05], 0.003)).at(0, 0.238, buckleZ).bone('hips');
    k.body('buckle', buckle, { color: C.brass, roughness: 0.3, metalness: 0.9, detail: 0.003 });

    const shortLeg = sdf.capsule(HIP, [KNEE[0], 0.14, 0.004], 0.054).intersect(sdf.halfSpace([0, -1, 0], -0.158)).round(0.003).bone('leg.L');
    const pelvis = h.weighted(h.torso.round(0.008).intersect(sdf.halfSpace([0, -1, 0], -0.158)).intersect(sdf.halfSpace([0, 1, 0], 0.245)));
    const shortsShape = sdf.smoothUnion(0.025, pelvis, pair(shortLeg));
    const hem = sdf.halfSpace([0, 1, 0], 0.172);
    k.body('shorts', shortsShape.paintWhere(hem, k.tint('cloth', { color: '#8f7c52', follow: 1 }), 0.003), { color: C.shorts, roughness: 0.86 });

    // ------------------------------------------------------------------ tall brown boots: shaft, cuff, toe, sole, laces
    const shaft = sdf.cylinder(0.052, 0.06, 0.014).at(ANKLE[0], 0.088, 0.0).bone('shin.L');
    const cuffBoot = sdf.torus(0.05, 0.014).at(ANKLE[0], 0.12, 0.0).bone('shin.L');
    const footB = sdf
      .smoothUnion(0.025, sdf.ellipsoid([0.058, 0.042, 0.104]).at(ANKLE[0], 0.042, 0.04), sdf.sphere(0.052).at(ANKLE[0], 0.058, -0.004))
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .bone('foot.L');
    const toeCap = sdf.ellipsoid([0.05, 0.03, 0.05]).at(ANKLE[0], 0.034, 0.1).bone('foot.L');
    const laces = sdf.union(
      ...[0.06, 0.085, 0.11].map((y) => sdf.box([0.07, 0.008, 0.012], 0.003).rotateZ(y > 0.09 ? 6 : -6).at(ANKLE[0], y, 0.052)),
    ).bone('shin.L');
    const strap = sdf.torus(0.0525, 0.007).at(ANKLE[0], 0.078, 0).bone('shin.L');
    const boot = sdf
      .union(sdf.smoothUnion(0.015, shaft, cuffBoot, footB, toeCap).paintWhere(sdf.halfSpace([0, 1, 0], 0.011), C.sole, 0.003).rotateY(8), laces, strap)
      .at(0, 0, 0);
    k.body('boots', pairHard(boot), { color: C.boot, roughness: 0.62, detail: 0.004 });

    // ------------------------------------------------------------------ satchel: a strap from the shoulder, a bag at the hip
    // The mockup (viewer's view) runs the strap from the viewer's right shoulder (x > 0) to the bag on the viewer's left (x < 0).
    const shell = h.torso.round(0.012).subtract(h.torso.round(-0.003));
    const slab = sdf.box([0.036, 0.8, 0.8]).rotateZ(-47).at(-0.012, 0.325, 0);
    const strapShape = h.weighted(shell.intersect(slab).intersect(sdf.halfSpace([0, -1, 0], -0.19)).intersect(sdf.halfSpace([0, 1, 0], 0.465)));
    k.body('strap', strapShape, { color: C.leather, roughness: 0.7, detail: 0.004 });
    const bagAt = (s: sdf.Shape) => s.rotateZ(-4).at(-0.19, 0.165, 0.03);
    const bagBody = sdf.box([0.09, 0.14, 0.19], 0.028);
    const flap = sdf
      .box([0.098, 0.08, 0.198], 0.024)
      .at(0, 0.04, 0)
      .intersect(sdf.halfSpace([0, 1, 0], 0.105));
    const clasp = sdf.box([0.01, 0.034, 0.03], 0.004).at(-0.047, 0.012, 0.02);
    const loop = sdf.torus(0.016, 0.0055).rotateZ(90).at(-0.05, 0.03, 0.02);
    const bagLeather = bagAt(sdf.smoothUnion(0.01, bagBody, flap)).bone('hips');
    k.body('satchel', bagLeather.paintWhere(bagAt(sdf.box([0.4, 0.004, 0.4]).at(0, 0.0, 0)), k.tint('cloth', { color: '#5e381f', follow: 0 }), 0.004), {
      color: C.leather,
      roughness: 0.62,
      detail: 0.004,
      bump: (x, y, z) => 0.002 * noiseGrain(x, y, z),
    });
    k.body('clasp', bagAt(sdf.union(clasp, loop)).bone('hips'), { color: C.brass, roughness: 0.3, metalness: 0.9, detail: 0.003 });

    // ------------------------------------------------------------------ right hand (x < 0): a brass magnifying glass raised beside the face
    const gr = h.arms.R.GRIP;
    const GR = [-gr[0], gr[1], gr[2]] as const;
    // Built along +Y from the grip: a dark handle through the fist, a brass collar, a ring 0.08 m across.
    const handle = sdf.cylinder(0.0135, 0.12, 0.004).at(0, 0.03, 0);
    const pommel = sdf.sphere(0.0165).at(0, -0.03, 0);
    const collarM = sdf.cone([0, 0.07, 0], [0, 0.105, 0], 0.017, 0.0105);
    const ring = sdf.torus(0.05, 0.0065).rotateX(90).scale([1, 1, 1.6]).at(0, 0.165, 0);
    const spokes = sdf.union(
      sdf.capsule([0, 0.1, 0], [0, 0.118, 0], 0.0085),
      sdf.capsule([0.006, 0.112, 0], [0.04, 0.14, 0], 0.007),
      sdf.capsule([-0.006, 0.112, 0], [-0.04, 0.14, 0], 0.007),
    );
    const lensPlate = sdf.cylinder(0.05, 0.004).rotateX(90).at(0, 0.165, 0);
    const magAt = (s: sdf.Shape) => s.rotateX(8).rotateZ(36).at(GR[0], GR[1], GR[2]);
    k.body('magnifier', magAt(sdf.union(handle.union(pommel).paint(C.handle), ring, spokes, collarM)), { color: C.brass, roughness: 0.3, metalness: 0.9, detail: 0.003, bone: 'knife.R' });
    k.body('lens', magAt(lensPlate), { color: C.lens, roughness: 0.05, metalness: 0.1, opacity: 0.55, detail: 0.003, bone: 'knife.R' });

    // ------------------------------------------------------------------ left hand (x > 0): a small cracked clay tablet with carved marks
    const gl = h.arms.L.GRIP;
    const W = 0.12;
    const Hh = 0.088;
    const T = 0.03;
    const slabShape = sdf
      .box([W, Hh, T], 0.006)
      .subtract(sdf.box([0.03, 0.03, 0.05]).rotateZ(45).at(W / 2 + 0.002, Hh / 2 + 0.002, 0)) // a chipped corner
      .subtract(sdf.box([0.004, 0.05, 0.02]).rotateZ(24).at(0.012, 0.004, T / 2)); // a crack groove
    const markBox = (x: number, y: number, w: number, hgt: number, rot = 0) => sdf.box([w, hgt, 0.2], 0.001).rotateZ(rot).at(x, y, 0);
    const marks = sdf.union(
      markBox(-0.03, 0.022, 0.016, 0.005),
      markBox(-0.008, 0.022, 0.005, 0.016),
      markBox(0.014, 0.024, 0.014, 0.005, 20),
      markBox(-0.026, -0.002, 0.005, 0.014),
      markBox(-0.008, -0.004, 0.018, 0.005),
      markBox(0.018, -0.002, 0.005, 0.014),
      markBox(-0.03, -0.026, 0.012, 0.005, -15),
      markBox(-0.006, -0.026, 0.005, 0.012),
      markBox(0.016, -0.026, 0.016, 0.005),
      markBox(0.034, 0.002, 0.005, 0.005),
    ).intersect(sdf.box([W - 0.012, Hh - 0.012, 0.2]));
    const crack = sdf.box([0.0035, 0.07, 0.2]).rotateZ(24).at(0.012, 0.004, 0);
    const tabletAt = (s: sdf.Shape) => s.rotateX(-14).rotateY(-4).at(gl[0] - 0.008, gl[1] + 0.05, gl[2] + 0.02);
    k.body('tablet', tabletAt(slabShape.paintWhere(marks, C.mark, 0.0015).paintWhere(crack, '#5a3420', 0.0015)), {
      color: C.tablet,
      roughness: 0.92,
      detail: 0.003,
      textureDensity: 2,
      bump: (x, y, z) => 0.0025 * noiseGrain(x * 1.3, y * 1.3, z * 1.3),
      bone: 'knife.L',
    });
  },
});

// Cheap deterministic grain for the leather and clay bumps.
function noiseGrain(x: number, y: number, z: number): number {
  return Math.sin(x * 210 + Math.sin(y * 150)) * Math.cos(z * 180 + y * 90) * 0.5 + Math.sin((x + y + z) * 400) * 0.25;
}
