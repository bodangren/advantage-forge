import { noise, profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Peddler — Chibi Quest settlement NPC (catalog `npcs/settlement/peddler`), about 1.1 m to the top of
 * the floppy hat, faces +Z, stands on y = 0. Target: docs/npc-mockups/peddler_001.jpg. Built on the
 * humanoid kind.
 *
 * Role: a traveling NPC who sells odd items on the roads; seen in 3D and as a 128 px sprite. The huge
 *   hung backpack, the floppy purple hat, the big mustache and goatee, and the gold teapot must read.
 * One idea: a chatty peddler whose backpack is taller than his head and jingles with pots, a cup, a
 *   lantern, and ribbons, while he holds out a shiny gold teapot.
 * Shape language: round and soft (hat, coat, pots), a few square forms (pack frame, pouches).
 * Palette (60/30/10): coat orange #d07a30 with brown patches, pack tan #a8743e and leather brown
 *   #6b4226 (60 percent warm earth); purple hat #6a3a7a (30); gold #e0b040 (teapot, bell) and the
 *   ribbons red, blue, and gold are the accent.
 * Value plan: the gold teapot and the bell are the lightest points; the purple hat is the darkest
 *   saturated mass over the light face; the pack is a calm mid-value frame behind.
 * Bodies: skin, nose, hair, mustache, goatee, hat, band, bell, shirt, jacket, cuffs, straps, belt,
 *   pouches, buckle, trousers, boots, bootcuffs, pack, frame, pots, lantern, ribbons, teapot.
 * Rig: the humanoid kind's skeleton and clips with the right arm posed forward; the pack and its
 *   hangings are rigid on `chest`, the teapot is rigid on `knife.R`.
 */

const C = {
  hat: '#a085c0',
  band: '#c89a4a',
  gold: '#e0b040',
  shirt: '#e6d6a8',
  cuff: '#e0cc9a',
  patch: '#9a5a2a',
  leather: '#6b4226',
  pants: '#6b4a32',
  boot: '#5a3a24',
  bootCuff: '#8a6240',
  pack: '#a8743e',
  packTop: '#b98a50',
  steel: '#8a8e98',
  copper: '#b8683a',
  frame: '#6b4226',
  iron: '#4a4a52',
  glow: '#f4c860',
  nose: '#d8584e',
  ribRed: '#b03a3a',
  ribBlue: '#3a6ab0',
  ribGold: '#e0b040',
  mouth: '#8a2e2a',
  teeth: '#fbf6ee',
};

export default humanoidAsset({
  name: 'peddler',
  description:
    'A chatty traveling peddler in a floppy purple hat and a patched orange coat, with a huge backpack hung with pots, a lantern, and ribbons, holding out a shiny gold teapot.',
  reference: 'docs/npc-mockups/peddler_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { brown: '#6b3e22', black: '#231a17', blond: '#c4974a', auburn: '#8e3b1c', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { orange: '#d07a30', brick: '#a8503a', saffron: '#d8a838', indigo: '#4a5a7a' },
  },
  presets: {
    roadside: { skin: 'tan', hair: 'auburn', eyes: 'green', cloth: 'indigo' },
  },
  hair: false,
  lashes: false,
  undershirt: false,
  pants: false,
  shoes: false,
  // The right hand held out in front at chest height; the teapot hangs from the fist.
  pose: { R: { elbow: [0.17, 0.345, 0.05], wrist: [0.2, 0.355, 0.15] }, L: { elbow: [0.215, 0.32, -0.03], wrist: [0.19, 0.26, 0.03] } },

  // Thick arched brows and a small open mouth under the mustache (painted over the defaults).
  paintSkin(skin, h) {
    const y = 0.511;
    const s = 0.5;
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
      ].map(([px, py]) => [px! * s, py! * s] as [number, number]),
      { smooth: true, samples: 6 },
    );
    const mouth = h.onFace(sdf.extrude(grin, 0.3), 0, y);
    const teeth = mouth.intersect(sdf.halfSpace([0, -1, 0], -(y - 0.004))).intersect(sdf.box([0.04, 0.1, 1]).at(0, y, 0));
    const oldBrows = sdf.extrude(profile.arc(0.1, 0.036, 54, 126), 0.3).at(0.1, 0.622, 0.1).mirror('x');
    const brows = sdf.extrude(profile.arc(0.07, 0.022, 52, 122), 0.3).at(0.1, 0.655, 0.1).mirror('x');
    return skin
      .paintWhere(oldBrows, h.tint.skin!, 0.002)
      .paintWhere(brows, h.tint.brow!, 0.002)
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
    const hairColor = k.tint('hair');
    const headPose = (s: sdf.Shape) => s.at(0, HEAD_Y, 0);

    // ------------------------------------------------------------------ nose: big, round, rosy
    const noseZ = h.faceZ(0, 0.574);
    k.body('nose', sdf.ellipsoid([0.034, 0.028, 0.03]).at(0, 0.574, noseZ - 0.004).bone('head'), {
      color: k.tint('skin', { color: C.nose, follow: 0.15 }),
      roughness: 0.5,
      detail: 0.003,
    });

    // ------------------------------------------------------------------ hat: floppy purple, a wide brim, a bell at the tip
    const crown = sdf
      .chain(
        [
          [0, 0.07, 0, 0.206],
          [0.005, 0.14, -0.012, 0.196],
          [0.02, 0.19, -0.04, 0.158],
          [0.05, 0.225, -0.07, 0.118],
          [0.1, 0.25, -0.095, 0.09],
          [0.16, 0.26, -0.11, 0.072],
          [0.22, 0.245, -0.115, 0.058],
          [0.27, 0.215, -0.11, 0.047],
          [0.305, 0.185, -0.1, 0.038],
        ],
        0.06,
      )
      .intersect(sdf.halfSpace([0, -1, 0], -0.09));
    // Slow lumps on the crown: soft felt, not a stiff bucket.
    const crownSoft = crown.displace(0.006, (x, y, z) => noise.fbm(x * 7 + 3, y * 7, z * 7, 2));
    const brim = sdf
      .revolve(
        profile.polygon(
          [
            [0.14, 0.165],
            [0.21, 0.155],
            [0.27, 0.135],
            [0.315, 0.112],
            [0.322, 0.096],
            [0.305, 0.092],
            [0.26, 0.108],
            [0.2, 0.12],
            [0.14, 0.122],
          ],
          { smooth: true, samples: 5 },
        ),
      )
      .scale([1, 1, 0.94])
      .rotateX(6)
      .at(0, 0, 0.012);
    const hatShape = headPose(sdf.smoothUnion(0.02, crownSoft, brim).rotateZ(-3)).bone('head');
    k.body('hat', hatShape, { color: C.hat, roughness: 0.9, detail: 0.005, bump: (x, y, z) => 0.003 * Math.sin(x * 70 + z * 50) * Math.cos(y * 60) });

    // The band around the crown base, with a small buckle at the front, and the bell at the tip.
    const band = crown.round(0.014).intersect(sdf.box([1, 0.04, 1]).at(0, 0.17, 0));
    const bandZ = sdf.raycast(crown.round(0.014), [0, 0.17, 1], [0, 0, -1])![2];
    const buckle = sdf.box([0.058, 0.05, 0.014], 0.004).subtract(sdf.box([0.036, 0.028, 0.03])).at(0.0, 0.17, bandZ + 0.002);
    const button = sdf.cylinder(0.034, 0.016, 0.005).rotateZ(90).at(0.19, 0.17, -0.02);
    k.body('band', headPose(sdf.smoothUnion(0.004, band, buckle, button).rotateZ(-3)).bone('head'), { maxTriangles: 2000, color: C.band, roughness: 0.6, detail: 0.003 });
    const bell = sdf.smoothUnion(0.006, sdf.sphere(0.028).at(0.34, 0.125, -0.095), sdf.capsule([0.34, 0.15, -0.095], [0.315, 0.18, -0.098], 0.009));
    k.body('bell', headPose(bell.rotateZ(-3)).bone('head'), { color: C.gold, roughness: 0.3, metalness: 0.8, detail: 0.003 });

    // ------------------------------------------------------------------ hair: temple and nape locks and a fringe curl under the hat
    const lock = (pts: [number, number, number, number][]) => sdf.chain(pts, 0.012);
    const fringe = [
      lock([[-0.05, 0.088, 0.162, 0.018], [-0.05, 0.07, 0.178, 0.015], [-0.034, 0.066, 0.18, 0.012]]),
      lock([[0.0, 0.09, 0.166, 0.02], [0.004, 0.072, 0.182, 0.016], [0.02, 0.07, 0.184, 0.012], [0.026, 0.082, 0.18, 0.01]]),
      lock([[0.05, 0.088, 0.16, 0.018], [0.056, 0.072, 0.174, 0.015], [0.072, 0.07, 0.172, 0.012]]),
    ];
    const temple = (x: number) => [
      lock([[x, 0.07, 0.05, 0.026], [x * 1.01, 0.02, 0.07, 0.022], [x * 1.02, -0.03, 0.065, 0.016]]),
      lock([[x * 0.97, 0.07, -0.04, 0.026], [x * 1.0, 0.0, -0.05, 0.026], [x * 0.98, -0.07, -0.06, 0.018]]),
    ];
    const hairShell = sdf.ellipsoid([0.212, 0.207, 0.198]);
    const back = hairShell
      .smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], 0.05))
      .smoothIntersect(0.02, sdf.halfSpace([0, 1, 0], 0.11))
      .smoothIntersect(0.03, sdf.halfSpace([0, 0, 1], 0.0));
    const tips = sdf.union(
      ...[-75, -50, -25, 0, 25, 50, 75].map((a) => sdf.sphere(0.026).at(0.18 * Math.sin((a * Math.PI) / 180), -0.062, -0.17 * Math.cos((a * Math.PI) / 180))),
    );
    const hair = sdf.smoothUnion(0.012, back, tips, ...fringe, ...temple(0.188), ...temple(-0.188));
    k.body('hair', headPose(hair).bone('head'), { maxTriangles: 4500, color: hairColor, roughness: 0.6, detail: 0.004 });

    // ------------------------------------------------------------------ mustache and goatee (own bodies)
    // A wide handlebar mustache: thick at the lip, sweeping out past the cheeks, the ends curled up.
    const my = 0.551;
    const mz = (x: number, y: number) => h.faceZ(Math.min(x, 0.15), y) + 0.006;
    const stache = sdf.chain(
      [
        [0, my + 0.002, mz(0, my), 0.017],
        [0.035, my - 0.001, mz(0.035, my), 0.018],
        [0.075, my - 0.004, mz(0.075, my), 0.018],
        [0.115, my - 0.004, mz(0.115, my) + 0.004, 0.015],
        [0.15, my + 0.006, mz(0.15, my) + 0.012, 0.011],
        [0.172, my + 0.026, mz(0.15, my) + 0.016, 0.009],
        [0.168, my + 0.044, mz(0.15, my) + 0.016, 0.007],
      ],
      0.012,
    );
    const mustache = stache.mirror('x', 0.012);
    k.body('mustache', mustache.bone('head'), { color: hairColor, roughness: 0.6, detail: 0.003 });

    // A long forked beard of locks: a pointed goatee that splits in two, and a thin lock that hangs
    // from each mustache corner down past the chin. The smile shows between mustache and goatee.
    const chinZ = h.faceZ(0, 0.49);
    const lockB = (pts: [number, number, number, number][]) => sdf.chain(pts, 0.01);
    const fork = (sx: number) =>
      lockB([
        [sx * 0.012, 0.47, chinZ - 0.004, 0.024],
        [sx * 0.02, 0.44, chinZ + 0.012, 0.022],
        [sx * 0.03, 0.4, chinZ + 0.024, 0.016],
        [sx * 0.04, 0.365, chinZ + 0.032, 0.01],
        [sx * 0.046, 0.342, chinZ + 0.036, 0.005],
      ]);
    const side = (sx: number) => {
      const z0 = h.faceZ(0.07, 0.535);
      return lockB([
        [sx * 0.07, 0.535, z0 + 0.002, 0.012],
        [sx * 0.08, 0.5, z0 + 0.01, 0.013],
        [sx * 0.084, 0.455, z0 + 0.018, 0.011],
        [sx * 0.088, 0.418, z0 + 0.022, 0.008],
        [sx * 0.09, 0.396, z0 + 0.024, 0.004],
      ]);
    };
    const chinTuft = sdf.ellipsoid([0.038, 0.02, 0.03]).at(0, 0.473, chinZ - 0.012);
    const goatee = sdf.union(sdf.smoothUnion(0.012, chinTuft, fork(1), fork(-1)), side(1), side(-1));
    k.body('goatee', goatee.bone('head'), { color: hairColor, roughness: 0.6, detail: 0.003 });

    // ------------------------------------------------------------------ shirt: cream, seen through the open coat
    const shirtShape = h.weighted(h.torso.round(0.004)).intersect(sdf.halfSpace([0, -1, 0], -0.17));
    const collarShirt = sdf.torus(0.056, 0.016).at(0, 0.455, -0.008).bone('chest');
    k.body('shirt', sdf.smoothUnion(0.01, shirtShape, collarShirt), { color: C.shirt, roughness: 0.9, detail: 0.005 });

    // ------------------------------------------------------------------ jacket: orange, open in front, long sleeves, patches
    const skirtOuter = sdf
      .revolve(
        profile.polygon(
          [[0, 0.3], [0.138, 0.3], [0.15, 0.25], [0.158, 0.21], [0.168, 0.18], [0.176, 0.15], [0.178, 0.14], [0, 0.14]],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.8]);
    const skirtInner = sdf
      .revolve(
        profile.polygon(
          [[0, 0.31], [0.126, 0.31], [0.138, 0.25], [0.146, 0.21], [0.156, 0.18], [0.164, 0.15], [0.166, 0.13], [0, 0.13]],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.78]);
    const jacketOuter = h.torso.round(0.014).intersect(sdf.halfSpace([0, 1, 0], 0.5)).union(skirtOuter);
    const shellTop = h.torso.round(0.014).subtract(h.torso.round(-0.002)).intersect(sdf.halfSpace([0, -1, 0], -0.28));
    const shellBottom = skirtOuter.subtract(skirtInner);
    const slit = sdf.extrude(profile.polygon([[-0.03, 0.472], [0.03, 0.472], [0.062, 0.12], [-0.062, 0.12]]), 0.5).at(0, 0, 0.25);
    const body = sdf.smoothUnion(0.01, shellTop, shellBottom).subtract(slit);
    const collar = sdf.torus(0.066, 0.02).at(0, 0.455, -0.012).bone('chest');
    const sleeve = h.perArm((j) =>
      sdf.smoothUnion(
        0.014,
        sdf.cone(lerp(SHOULDER, j.ELBOW, -0.1), j.ELBOW, 0.05, 0.047).bone('upperarm.L'),
        sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.8), 0.047, 0.045).bone('forearm.L'),
      ),
    );
    const patchBox = (x: number, y: number, z: number, s: number) => sdf.box([s, s, s], 0.004).at(x, y, z);
    const jacket = sdf
      .smoothUnion(0.01, h.weighted(body), sleeve, collar)
      .paintWhere(patchBox(-0.075, 0.2, 0.15, 0.052), C.patch, 0.002)
      .paintWhere(patchBox(0.09, 0.34, 0.07, 0.04), C.patch, 0.002)
      .paintWhere(patchBox(-0.215, 0.33, 0.045, 0.04), C.patch, 0.002)
      .paintWhere(patchBox(0.21, 0.2, 0.02, 0.04), C.patch, 0.002);
    k.body('jacket', jacket, { maxTriangles: 6000, color: h.tint.shirt ?? '#d07a30', roughness: 0.85, detail: 0.005, bump: (x, y, z) => 0.0015 * Math.sin(x * 90 + y * 60) * Math.cos(z * 80) });

    // Wide cream cuffs at the wrists.
    const cuffs = h.perArm((j) => sdf.cone(lerp(j.ELBOW, j.WRIST, 0.66), j.WRIST, 0.054, 0.056).round(0.004).bone('forearm.L'));
    k.body('cuffs', cuffs, { maxTriangles: 1200, color: C.cuff, roughness: 0.9, detail: 0.004 });

    // Pack straps over the shoulders and under the arms: leather bands on the coat and short links to the pack.
    const strapShell = h.torso.round(0.024).subtract(h.torso.round(0.008)).intersect(sdf.halfSpace([0, -1, 0], -0.27));
    const strapBands = sdf.union(sdf.box([0.034, 0.5, 1.0]).at(0.082, 0.37, 0), sdf.box([0.034, 0.5, 1.0]).at(-0.082, 0.37, 0)).intersect(sdf.halfSpace([0, 1, 0], 0.47));
    const strapLink = pair(sdf.capsule([0.1, 0.29, -0.08], [0.17, 0.29, -0.2], 0.016).bone('chest'));
    k.body('straps', sdf.union(h.weighted(strapShell.intersect(strapBands)), strapLink), { maxTriangles: 2000, color: C.leather, roughness: 0.7, detail: 0.004 });

    // ------------------------------------------------------------------ belt, buckle, and two pouches
    const belt = sdf.cylinder(0.164, 0.03, 0.006).subtract(sdf.cylinder(0.146, 0.05)).scale([1, 1, 0.8]).at(0, 0.25, 0);
    k.body('belt', h.weighted(belt), { maxTriangles: 1000, color: C.leather, roughness: 0.7, detail: 0.004 });
    const buckle2 = sdf.box([0.05, 0.04, 0.014], 0.004).subtract(sdf.box([0.03, 0.02, 0.03])).at(0, 0.25, 0.133);
    k.body('buckle', buckle2.bone('spine'), { color: '#c8a040', roughness: 0.35, metalness: 0.85, detail: 0.003 });
    const pouchZ = (x: number, y: number) => sdf.raycast(jacketOuter, [x, y, 1], [0, 0, -1])![2];
    const pouch = (x: number) => {
      const z = pouchZ(x, 0.205) + 0.014;
      const sack = sdf.box([0.062, 0.07, 0.036], 0.012).at(x, 0.205, z);
      const flap = sdf.box([0.066, 0.03, 0.04], 0.01).at(x, 0.232, z + 0.004);
      return sdf.smoothUnion(0.004, sack, flap);
    };
    k.body('pouches', sdf.union(pouch(0.1), pouch(-0.1)).bone('spine'), { color: C.leather, roughness: 0.75, detail: 0.004 });

    // ------------------------------------------------------------------ trousers and worn boots with turned cuffs
    const trouserLeg = sdf.smoothUnion(
      0.012,
      sdf.capsule(HIP, KNEE, 0.05).bone('leg.L'),
      sdf.cone(KNEE, [ANKLE[0], 0.12, 0.002], 0.048, 0.046).bone('shin.L'),
    );
    k.body('trousers', sdf.smoothUnion(0.03, sdf.ellipsoid([0.118, 0.052, 0.088]).at(0, 0.2, 0).bone('hips'), pair(trouserLeg)), { color: C.pants, roughness: 0.85 });
    const shoe = sdf.smoothUnion(0.025, sdf.ellipsoid([0.058, 0.044, 0.1]).at(0, 0.04, 0.04), sdf.sphere(0.052).at(0, 0.052, -0.005));
    const shaft = sdf.cylinder(0.053, 0.1, 0.014).at(0, 0.07, 0);
    const boot = sdf
      .smoothUnion(0.02, shoe, shaft)
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.65 });
    const bootCuff = sdf.cylinder(0.062, 0.034, 0.012).subtract(sdf.cylinder(0.044, 0.05)).at(ANKLE[0], 0.12, 0).bone('shin.L');
    k.body('bootcuffs', pair(bootCuff), { maxTriangles: 1000, color: C.bootCuff, roughness: 0.8, detail: 0.004 });

    // ------------------------------------------------------------------ the huge backpack
    // A tan bundle on a wooden frame, taller than the head, with a rolled blanket and a sack on top.
    const PZ = -0.25;
    const bundle = sdf.smoothUnion(
      0.04,
      sdf.box([0.42, 0.43, 0.2], 0.06).at(0, 0.435, PZ),
      sdf.ellipsoid([0.16, 0.09, 0.1]).at(0, 0.71, PZ + 0.01),
      sdf.cylinder(0.065, 0.4, 0.02).rotateZ(90).at(0, 0.67, PZ - 0.02), // the rolled blanket
      sdf.box([0.1, 0.26, 0.09], 0.03).at(0.2, 0.42, PZ + 0.02), // a side pocket on each side
      sdf.box([0.1, 0.26, 0.09], 0.03).at(-0.2, 0.42, PZ + 0.02),
    );
    const bundlePainted = bundle
      .paintWhere(sdf.box([1, 0.03, 1]).at(0, 0.44, 0), C.leather, 0.003)
      .paintWhere(sdf.box([1, 0.03, 1]).at(0, 0.63, 0), C.leather, 0.003)
      .paintWhere(sdf.sphere(0.1).at(0, 0.73, PZ + 0.01), C.packTop, 0.04).paintWhere(sdf.box([1, 0.12, 0.13]).at(0, 0.67, PZ - 0.02), C.packTop, 0.01);
    k.body('pack', bundlePainted.bone('chest'), {
      color: C.pack,
      roughness: 0.9,
      detail: 0.006,
      bump: (x, y, z) => 0.003 * Math.sin(x * 110 + y * 30) * Math.cos(z * 100 + y * 50),
    });
    const frame = sdf.union(
      sdf.capsule([0.192, 0.22, PZ - 0.0], [0.192, 0.83, PZ - 0.0], 0.015).mirror('x', 0),
      sdf.capsule([-0.2, 0.82, PZ], [0.2, 0.82, PZ], 0.014),
      sdf.box([0.42, 0.028, 0.24], 0.01).at(0, 0.27, PZ + 0.0),
      sdf.capsule([-0.19, 0.25, PZ + 0.1], [0.19, 0.25, PZ + 0.1], 0.012),
    );
    k.body('frame', frame.bone('chest'), { color: C.frame, roughness: 0.75, detail: 0.005 });

    // ------------------------------------------------------------------ pots, a cup, and a lantern hung on the pack
    const cord = (x: number, y0: number, y1: number, z: number) => sdf.capsule([x, y0, z], [x, y1, z], 0.006);
    const pot = (x: number, y: number, z: number, r: number, ht: number) =>
      sdf.smoothUnion(
        0.01,
        sdf.ellipsoid([r, ht, r]).at(x, y, z),
        sdf.cylinder(r * 0.62, 0.014, 0.004).at(x, y + ht * 0.96, z),
        sdf.torus(r * 0.7, 0.006).rotateX(90).at(x, y + ht * 1.25, z), // the carrying loop
      );
    const copperPots = sdf.union(
      pot(0.245, 0.5, PZ + 0.02, 0.055, 0.05),
      cord(0.245, 0.575, 0.62, PZ + 0.02),
      pot(0.1, 0.56, PZ - 0.14, 0.05, 0.045),
      cord(0.1, 0.63, 0.69, PZ - 0.14),
    );
    k.body('copperpots', copperPots.bone('chest'), { maxTriangles: 1800, color: C.copper, roughness: 0.4, metalness: 0.6, detail: 0.004 });
    const cup = sdf.cylinder(0.026, 0.06, 0.005).at(0.215, 0.3, PZ + 0.1);
    const steelPots = sdf.union(
      pot(-0.245, 0.51, PZ + 0.02, 0.06, 0.055),
      cord(-0.245, 0.6, 0.62, PZ + 0.02),
      pot(-0.08, 0.5, PZ - 0.14, 0.065, 0.06),
      cord(-0.08, 0.6, 0.65, PZ - 0.14),
      cup,
      cord(0.215, 0.33, 0.4, PZ + 0.1),
    );
    k.body('steelpots', steelPots.bone('chest'), { maxTriangles: 2400, color: C.steel, roughness: 0.4, metalness: 0.7, detail: 0.004 });

    // A little lantern with an iron frame and a glowing glass.
    const LX = -0.235;
    const LY = 0.3;
    const LZ = PZ + 0.04;
    const lampFrame = sdf.union(
      sdf.cylinder(0.034, 0.014, 0.005).at(LX, LY - 0.04, LZ),
      sdf.cylinder(0.028, 0.014, 0.005).at(LX, LY + 0.04, LZ),
      sdf.torus(0.014, 0.005).at(LX, LY + 0.062, LZ),
      ...[[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([a, b]) => sdf.capsule([LX + a! * 0.026, LY - 0.04, LZ + b! * 0.026], [LX + a! * 0.022, LY + 0.04, LZ + b! * 0.022], 0.005)),
      cord(LX, LY + 0.065, 0.46, LZ),
    );
    k.body('lanternframe', lampFrame.bone('chest'), { maxTriangles: 1000, color: C.iron, roughness: 0.5, metalness: 0.6, detail: 0.003 });
    k.body('lanternglow', sdf.ellipsoid([0.026, 0.038, 0.026]).at(LX, LY, LZ).bone('chest'), {
      color: C.glow,
      roughness: 0.3,
      emissive: C.glow,
      emissiveIntensity: 0.6,
      detail: 0.003,
    });

    // Ribbons: red, blue, and gold strips hanging from the pack's bottom edge and sides.
    const ribbon = (x: number, z: number, len: number, sway: number, color: string, r = 0.013) =>
      sdf
        .chain(
          [
            [x, 0.26, z, r],
            [x + sway * 0.3, 0.26 - len * 0.35, z, r],
            [x + sway, 0.26 - len * 0.7, z - 0.01, r * 0.9],
            [x + sway * 1.3, 0.26 - len, z - 0.015, r * 0.7],
          ],
          0.01,
        )
        .paint(color);
    const ribbons = sdf.union(
      ribbon(0.13, PZ + 0.1, 0.2, 0.02, C.ribRed),
      ribbon(0.17, PZ + 0.08, 0.17, 0.03, C.ribGold),
      ribbon(-0.13, PZ + 0.1, 0.21, -0.02, C.ribBlue),
      ribbon(-0.17, PZ + 0.08, 0.16, -0.03, C.ribRed),
      ribbon(0.05, PZ + 0.1, 0.15, 0.01, C.ribBlue),
      ribbon(-0.05, PZ + 0.11, 0.18, -0.01, C.ribGold),
      ribbon(0.2, PZ - 0.02, 0.2, 0.02, C.ribBlue),
    );
    k.body('ribbons', ribbons.bone('chest'), { maxTriangles: 2500, color: C.ribRed, roughness: 0.8, detail: 0.004 });

    // ------------------------------------------------------------------ the gold teapot in the right fist (x < 0)
    // A round gold pot with a lid and a knob, a spout, and a handle loop, held out beside the fist at chest height.
    const g = h.arms.R.GRIP;
    const gx = -g[0];
    const cx = gx - 0.09;
    const cy = g[1] + 0.012;
    const cz = g[2] + 0.025;
    const potBody = sdf.ellipsoid([0.068, 0.058, 0.068]).at(cx, cy, cz);
    // A raised lid with a rim, a dome, and a big round knob.
    const lid = sdf.smoothUnion(
      0.008,
      sdf.torus(0.04, 0.008).at(cx, cy + 0.05, cz),
      sdf.ellipsoid([0.044, 0.03, 0.044]).at(cx, cy + 0.058, cz),
      sdf.capsule([cx, cy + 0.08, cz], [cx, cy + 0.096, cz], 0.009),
      sdf.sphere(0.02).at(cx, cy + 0.104, cz),
    );
    // A long spout that leaves low on the outer side and curves up to an open tip.
    const spout = sdf
      .chain(
        [
          [cx - 0.05, cy - 0.018, cz, 0.03],
          [cx - 0.095, cy + 0.0, cz, 0.019],
          [cx - 0.128, cy + 0.035, cz, 0.014],
          [cx - 0.142, cy + 0.06, cz, 0.014],
        ],
        0.015,
      )
      .subtract(sdf.capsule([cx - 0.146, cy + 0.05, cz], [cx - 0.15, cy + 0.08, cz], 0.007));
    // A big handle loop on the fist side (the fist holds it), seen as a ring from the front.
    const handle = sdf.torus(0.046, 0.012).rotateX(90).at(cx + 0.072, cy + 0.008, cz);
    const teapot = sdf.smoothUnion(0.01, potBody, lid, spout, handle).bone('knife.R');
    k.body('teapot', teapot, { maxTriangles: 2800, color: C.gold, roughness: 0.22, metalness: 0.7, detail: 0.003, bump: (x, y, z) => 0.002 * Math.sin(Math.atan2(z - cz, x - cx) * 10) });

    // ------------------------------------------------------------------ colorful goods on top of the pack
    const TOP = 0.8;
    const blanket = sdf
      .cylinder(0.058, 0.36, 0.016)
      .rotateZ(90)
      .at(0, TOP + 0.055, PZ - 0.03)
      .paintWhere(sdf.box([0.05, 1, 1]).at(0.07, 1, PZ), C.ribRed, 0.004)
      .paintWhere(sdf.box([0.05, 1, 1]).at(-0.07, 1, PZ), C.ribRed, 0.004)
      .paintWhere(sdf.box([0.035, 1, 1]).at(0.0, 1, PZ), C.ribBlue, 0.004)
      .paintWhere(sdf.box([0.03, 1, 1]).at(0.14, 1, PZ), C.ribGold, 0.004)
      .paintWhere(sdf.box([0.03, 1, 1]).at(-0.14, 1, PZ), C.ribGold, 0.004);
    k.body('blanket', blanket.bone('chest'), { maxTriangles: 1500, color: '#e8d4a0', roughness: 0.9, detail: 0.004 });
    const sprig = (x: number, lean: number) =>
      sdf.smoothUnion(
        0.008,
        sdf.chain([[x, TOP, PZ + 0.05, 0.007], [x + lean * 0.5, TOP + 0.07, PZ + 0.06, 0.006], [x + lean, TOP + 0.13, PZ + 0.07, 0.005]], 0.01),
        sdf.ellipsoid([0.02, 0.012, 0.03]).rotateZ(lean * 200).at(x + lean * 0.7, TOP + 0.1, PZ + 0.07),
        sdf.ellipsoid([0.018, 0.011, 0.028]).rotateZ(lean * 200).at(x + lean * 1.1, TOP + 0.14, PZ + 0.08),
      );
    k.body('sprigs', sdf.union(sprig(0.09, 0.03), sprig(0.12, -0.02), sprig(0.15, 0.05)).bone('chest'), { maxTriangles: 1000, color: '#3d6a35', roughness: 0.8, detail: 0.003 });
    const jug = sdf.smoothUnion(
      0.012,
      sdf.ellipsoid([0.04, 0.05, 0.04]).at(-0.12, TOP + 0.05, PZ + 0.07),
      sdf.cylinder(0.016, 0.04, 0.005).at(-0.12, TOP + 0.108, PZ + 0.07),
      sdf.torus(0.022, 0.007).rotateX(90).at(-0.12, TOP + 0.075, PZ + 0.07 - 0.0).scale([1, 1, 1]).at(0.0, 0.0, 0.0),
    );
    k.body('jug', jug.bone('chest'), { maxTriangles: 1000, color: C.gold, roughness: 0.25, metalness: 0.7, detail: 0.003 });
  },
});
