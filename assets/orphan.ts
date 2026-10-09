import { profile, rgb, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Orphan — Chibi Quest settlement NPC (catalog `npcs/settlement/orphan`), about 0.92 m to the top of
 * the cap, faces +Z. Target: docs/npc-mockups/orphan_001.jpg. Built on the humanoid kind (worked
 * example: assets/baker.ts; the one-arm pose and the hair locks follow assets/courier.ts).
 *
 * Role: a town NPC kid who knows every alley and gives small quests; seen in the streets in 3D and
 *   as a 128 px sprite. The wide patched cap, the grin with the tooth gap, the striped scarf, and
 *   the white paper boat held out in the left hand must read.
 * One idea: a cheeky kid in a coat that is too big, grinning and holding up a paper boat.
 * Shape language: round and soft (cap, cheeks, coat), with the boat as the one folded, angular form.
 * Palette (60/30/10): coat #4a6a3a (the cloth slot) with #7a5a3a patches; cap #7a5a3a with a #9a7a4a
 *   patch; scarf #b03a3a and #f0ead8; trousers #7a7880; boots #6b4226; hair #6b3e22; the white
 *   boat #f6f1ea is the accent and the focal point.
 * Value plan: the dark cap and hair frame the light face; the mid green coat holds the body; the
 *   white boat and the cream scarf stripes are the lightest values.
 * Bodies: skin (grin, freckles), cap, hair, shirt, coat, patches, cuffs, scarf, buttons, trousers,
 *   boots, boat.
 * Rig: the humanoid kind's skeleton and clips. The left arm keeps the held `pose`; the boat is
 *   rigid on `knife.L`.
 */

const C = {
  cap: '#7a5a3a',
  capPatch: '#d8c8a0',
  patch: '#7a5a3a',
  cuff: '#b9ad8c',
  shirt: '#566a68',
  belt: '#8a5a3a',
  scarfRed: '#b03a3a',
  scarfCream: '#f0ead8',
  scarfBrown: '#5a3a28',
  pants: '#6f6a64',
  pantsCuff: '#8c8478',
  boot: '#6b4226',
  sole: '#3a2418',
  button: '#c8a040',
  freckle: '#c88a6a',
  mouth: '#8a2e2a',
  tongue: '#d8706a',
  teeth: '#fbf6ee',
  boat: '#f6f1ea',
  boatFold: '#d6cfc0',
  mast: '#7a5a3a',
};

export default humanoidAsset({
  name: 'orphan',
  description: 'A cheerful, cheeky town kid in a patched newsboy cap and an oversized green coat, grinning and holding up a paper boat.',
  reference: 'docs/npc-mockups/orphan_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { brown: '#6b3e22', black: '#231a17', blond: '#c4974a', auburn: '#8e3b1c', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { moss: '#4a6a3a', umber: '#6a4a3a', faded: '#4a5a78', wine: '#7a3f4a' },
  },
  presets: {
    scamp: { skin: 'tan', hair: 'auburn', eyes: 'hazel', cloth: 'faded' },
  },
  pose: { L: { elbow: [0.215, 0.36, 0.04], wrist: [0.265, 0.405, 0.125] } },
  lashes: false,
  hair: false,
  undershirt: false,
  pants: false,
  shoes: false,

  // The big grin: round corners, one white tooth band with a gap between the two front teeth, and
  // freckles on the cheeks and the nose. The kind's brows are painted over with thicker, arched ones.
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
    // One white tooth band, no gap (two separate front teeth read as fangs at 128 px); the kind's
    // smile arc is covered with skin, or it darkens the lower lip.
    const oldSmile = sdf.extrude(profile.arc(0.07, 0.018, 236, 304), 0.3).at(0, 0.6, 0.1);
    const tongue = h.onFace(sdf.ellipsoid([0.026, 0.014, 0.08]), 0, y - 0.03);
    const oldBrows = sdf.extrude(profile.arc(0.1, 0.036, 54, 126), 0.3).at(0.1, 0.622, 0.1).mirror('x');
    const brows = sdf.extrude(profile.arc(0.07, 0.016, 55, 125), 0.3).at(0.1, 0.657, 0.1).mirror('x');
    const dots: [number, number][] = [
      [0.072, 0.556],
      [0.098, 0.564],
      [0.124, 0.556],
      [0.088, 0.538],
      [0.114, 0.542],
      [0.138, 0.536],
      [0.016, 0.585],
    ];
    const freckles = sdf.union(...dots.flatMap(([x, yy]) => [h.onFace(sdf.sphere(0.0065), x!, yy!), h.onFace(sdf.sphere(0.0065), -x!, yy!)]));
    return skin
      .paintWhere(oldBrows, h.tint.skin!, 0.002)
      .paintWhere(oldSmile, h.tint.skin!, 0.002)
      .paintWhere(brows, h.tint.brow!, 0.002)
      .paintWhere(freckles, C.freckle, 0.002)
      .paintWhere(mouth, C.mouth)
      .paintWhere(tongue.intersect(mouth), C.tongue, 0.004)
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
    const coatColor = h.tint.shirt ?? '#4a6a3a';

    // ------------------------------------------------------------------ the newsboy cap: low, wide, puffy
    const headPose = (s: sdf.Shape) => s.at(0, HEAD_Y, 0);
    const crown = sdf
      .smoothUnion(
        0.04,
        sdf.ellipsoid([0.265, 0.12, 0.26]).at(0, 0.125, -0.01),
        sdf.ellipsoid([0.235, 0.13, 0.205]).at(0, 0.075, -0.07), // the low back over the nape
      )
      .intersect(sdf.halfSpace([0, -1, 0.24], -0.03)); // the rim: higher at the front, lower at the back
    const bill = sdf
      .smoothUnion(0.01, sdf.ellipsoid([0.13, 0.014, 0.1]).at(0, 0, 0.0), sdf.box([0.12, 0.02, 0.06], 0.01).at(0, 0.004, -0.05))
      .rotateX(-7)
      .at(0, 0.088, 0.225);
    const button = sdf.sphere(0.017).at(0, 0.243, -0.008);
    const capSolid = headPose(sdf.smoothUnion(0.02, crown, bill, button));
    // The patch on the crown (a rotated square that crosses the surface) and the seams.
    const patchBox = sdf.box([0.09, 0.4, 0.07], 0.008).rotateZ(-18).rotateX(22).rotateY(20).at(0.1, HEAD_Y + 0.2, 0.06);
    const patchSide = sdf.box([0.4, 0.06, 0.07], 0.008).rotateZ(10).at(-0.19, HEAD_Y + 0.1, 0.05);
    const patchBack = sdf.box([0.07, 0.4, 0.06], 0.008).rotateY(30).rotateZ(-14).at(0.14, HEAD_Y + 0.17, -0.12);
    const seams = sdf.union(
      sdf.box([0.006, 0.6, 0.6]).at(0, HEAD_Y, 0),
      sdf.box([0.006, 0.6, 0.6]).rotateY(60).at(0, HEAD_Y, 0),
      sdf.box([0.006, 0.6, 0.6]).rotateY(-60).at(0, HEAD_Y, 0),
    ).intersect(sdf.halfSpace([0, -1, 0], -(HEAD_Y + 0.16)));
    k.body(
      'cap',
      capSolid
        .paintWhere(seams, '#5f4428', 0.002)
        .paintWhere(patchBox, C.capPatch, 0.002)
        .paintWhere(patchSide, C.capPatch, 0.002)
        .paintWhere(patchBack, C.capPatch, 0.002)
        .paintWhere(sdf.sphere(0.02).at(0, HEAD_Y + 0.243, -0.008), '#5f4428', 0.003)
        .bone('head'),
      { color: C.cap, roughness: 0.9, detail: 0.005, bump: (x, y, z) => 0.003 * Math.sin(x * 70 + z * 50) * Math.cos(y * 60 + x * 20) },
    );

    // ------------------------------------------------------------------ messy hair: chain locks under the cap
    const hp = headPose;
    const hairCap = hp(
      sdf
        .ellipsoid([0.211, 0.205, 0.195])
        .smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], -0.01))
        .smoothIntersect(0.03, sdf.halfSpace([0, 0, 1], 0.02)),
    );
    const lock = (pts: number[][], r = 0.012) =>
      hp(sdf.chain(pts.map((p) => [p[0]!, p[1]!, p[2]!, p[3]!]) as [number, number, number, number][], r));
    const temples = pair(
      lock([
        [0.186, 0.085, 0.06, 0.03],
        [0.194, 0.03, 0.05, 0.027],
        [0.194, -0.02, 0.035, 0.023],
        [0.19, -0.062, 0.02, 0.014],
      ]),
    );
    // Fringe: curled locks that come out below the cap rim and sweep across the forehead.
    const rim = (deg: number, y: number, r = 1): [number, number, number] => {
      const a = (deg * Math.PI) / 180;
      return [0.2 * r * Math.sin(a), y, 0.19 * r * Math.cos(a)];
    };
    const curl = (deg: number, y0: number, drop: number, flick: number, radius: number) => {
      const a = rim(deg, y0);
      const b = rim(deg + flick * 0.5, y0 - drop * 0.55, 1.02);
      const c = rim(deg + flick, y0 - drop, 1.04);
      return lock([[a[0], a[1], a[2], radius], [b[0], b[1], b[2], radius * 0.85], [c[0], c[1], c[2], radius * 0.4]], 0.012);
    };
    const fringe = [
      curl(-70, 0.09, 0.07, -18, 0.026),
      curl(-52, 0.085, 0.05, 22, 0.024),
      curl(-32, 0.088, 0.075, -20, 0.025),
      curl(-12, 0.082, 0.04, 24, 0.022),
      curl(6, 0.084, 0.06, -26, 0.024),
      curl(24, 0.082, 0.045, 22, 0.022),
      curl(44, 0.086, 0.07, -20, 0.025),
      curl(60, 0.088, 0.052, 24, 0.024),
      curl(74, 0.09, 0.075, -16, 0.026),
    ];
    // The nape: a ragged row of short locks of different lengths at the back.
    const nape = [-0.15, -0.1, -0.05, 0, 0.05, 0.1, 0.15].map((x, i) =>
      lock([[x, 0.02, -0.15, 0.04], [x * 1.02, -0.035, -0.158, 0.038], [x * 1.04, -0.06 - (i % 2) * 0.014, -0.152, 0.03]], 0.02),
    );
    k.body(
      'hair',
      sdf
        .smoothUnion(0.02, hairCap, temples, sdf.smoothUnion(0.01, ...fringe), ...nape)
        .subtract(capSolid.round(0.003))
        .bone('head'),
      { color: hairColor, roughness: 0.6, detail: 0.005 },
    );

    // ------------------------------------------------------------------ the shirt under the open coat
    const shirt = h
      .weighted(h.torso.round(0.003).intersect(sdf.halfSpace([0, -1, 0], -0.205)))
      .paintWhere(h.band(0.236, 0.266), C.belt, 0.002);
    k.body('shirt', shirt, { color: C.shirt, roughness: 0.85 });

    // ------------------------------------------------------------------ the oversized green coat
    const sleeves = h.perArm((j) =>
      sdf.smoothUnion(
        0.015,
        sdf.cone(lerp(SHOULDER, j.ELBOW, -0.12), j.ELBOW, 0.064, 0.06).bone('upperarm.L'),
        sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.9), 0.06, 0.057).bone('forearm.L'),
      ),
    );
    // A long, wide coat to mid-thigh: the torso grown by 4 cm and a flared skirt to just above the knee joint.
    const skirt = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.155],
            [0.2, 0.155],
            [0.185, 0.2],
            [0.16, 0.26],
            [0, 0.26],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.86]);
    const coatBody = sdf
      .smoothUnion(0.03, h.torso.round(0.04), skirt)
      .intersect(sdf.halfSpace([0, -1, 0], -0.155))
      .intersect(sdf.halfSpace([0, 1, 0], 0.452));
    const opening = sdf.box([0.062, 0.4, 0.3]).at(0, 0.28, 0.245).intersect(sdf.halfSpace([0, 0, -1], -0.094));
    const coat = sdf
      .smoothUnion(0.012, h.weighted(coatBody.subtract(opening)), sleeves)
      .paintWhere(h.band(0.155, 0.185), '#3d5a2f', 0.004);
    const coatShape = coat;
    k.body('coat', coat, {
      color: coatColor,
      roughness: 0.9,
      detail: 0.005,
      bump: (x, y, z) => 0.002 * Math.sin(x * 60 + y * 40) * Math.cos(z * 55),
    });

    // The patches: a raised square on the lower front (the viewer's left) and one on the elbow of the hanging arm.
    const frontPatch = h.weighted(coatBody.round(0.006).intersect(sdf.box([0.075, 0.07, 0.4], 0.012).rotateZ(6).at(-0.11, 0.215, 0.2)));
    const elbowPatch = sleeves
      .round(0.006)
      .intersect(sdf.box([0.06, 0.07, 0.07], 0.012).rotateZ(-8).at(-0.222, 0.34, 0.015));
    k.body('patches', sdf.union(frontPatch, elbowPatch), { color: C.patch, roughness: 0.9, detail: 0.004 });

    // Rolled cuffs: a slim lighter band above each fist (a thick cuff over the fist reads as a mitten).
    const cuffs = h.perArm((j) => sdf.cone(lerp(j.ELBOW, j.WRIST, 0.66), lerp(j.ELBOW, j.WRIST, 0.9), 0.056, 0.056).round(0.004).bone('forearm.L'));
    k.body('cuffs', cuffs, { color: C.cuff, roughness: 0.9, detail: 0.004 });

    // Two brass buttons on the coat front edge and a stand-up collar behind the scarf.
    const btn = (y: number) => {
      const z = sdf.raycast(coatBody.subtract(opening), [-0.045, y, 1], [0, 0, -1])?.[2] ?? 0.11;
      return sdf.sphere(0.012).at(-0.045, y, z).bone('chest');
    };
    k.body('buttons', sdf.union(btn(0.38), btn(0.31), btn(0.24)), { color: C.button, roughness: 0.4, metalness: 0.7, detail: 0.004 });

    // ------------------------------------------------------------------ the striped scarf
    const ring = sdf.torus(0.077, 0.034).scale([1, 1, 0.95]).at(0, 0.443, -0.004);
    const knot = sdf.ellipsoid([0.045, 0.04, 0.032]).rotateZ(-15).at(0.04, 0.42, 0.072);
    // The tail starts at the knot and hangs close to the coat front: each point sits 1.4 cm over the coat surface.
    const coatFront = coatBody.subtract(opening);
    const onCoat = (x: number, y: number, r: number): [number, number, number, number] => [x, y, (sdf.raycast(coatFront, [x, y, 1], [0, 0, -1])?.[2] ?? 0.12) + 0.008, r];
    const tail = sdf
      .chain([onCoat(0.05, 0.4, 0.03), onCoat(0.056, 0.34, 0.03), onCoat(0.06, 0.26, 0.03), onCoat(0.062, 0.19, 0.029)], 0.01)
      .intersect(coatFront.round(0.02));
    const red = rgb(C.scarfRed);
    const brown = rgb(C.scarfBrown);
    const cream = rgb(C.scarfCream);
    const scarf = sdf
      .smoothUnion(0.02, ring, knot, tail)
      .paintFn((x, y, z) => {
        const stripe = y < 0.4 ? Math.floor((0.4 - y) / 0.03) : Math.floor(((Math.atan2(x, z) + Math.PI) / (2 * Math.PI)) * 22);
        return stripe % 2 === 0 ? cream : y < 0.25 ? red : brown;
      });
    k.body('scarf', scarf.bone('chest'), { color: C.scarfCream, roughness: 0.9, detail: 0.004, bump: (x, y, z) => 0.002 * Math.sin(y * 150 + x * 20) });

    // ------------------------------------------------------------------ short gray trousers with rolled cuffs
    const trouserLeg = sdf.smoothUnion(
      0.012,
      sdf.capsule(HIP, KNEE, 0.052).bone('leg.L'),
      sdf.cone(KNEE, [ANKLE[0], 0.118, 0.002], 0.05, 0.05).bone('shin.L'),
    );
    const pantsCuff = sdf.torus(0.054, 0.018).at(ANKLE[0], 0.118, 0.002).bone('shin.L');
    k.body(
      'trousers',
      sdf.smoothUnion(0.03, sdf.ellipsoid([0.118, 0.052, 0.088]).at(0, 0.2, 0).bone('hips'), pair(trouserLeg)),
      { color: C.pants, roughness: 0.85 },
    );
    k.body('waist', h.weighted(h.torso.round(0.008).intersect(h.band(0.15, 0.222))), { color: C.pants, roughness: 0.85 });
    k.body('pantsCuffs', pair(pantsCuff), { color: C.pantsCuff, roughness: 0.9, detail: 0.004 });

    // ------------------------------------------------------------------ worn brown boots
    const shaft = sdf.cone([ANKLE[0], 0.112, 0.002], [ANKLE[0], 0.05, 0.002], 0.052, 0.05).bone('shin.L');
    const foot = sdf
      .smoothUnion(0.025, sdf.ellipsoid([0.058, 0.044, 0.104]).at(0, 0.042, 0.042), sdf.sphere(0.05).at(0, 0.052, -0.005))
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    const boot = sdf
      .smoothUnion(0.02, shaft, foot)
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .paintWhere(h.band(-0.2, 0.014), C.sole, 0.002);
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.7, bump: (x, y, z) => 0.0015 * Math.sin(x * 90 + z * 70 + y * 40) });

    // ------------------------------------------------------------------ the paper boat in the left hand
    const GL = h.arms.L.GRIP;
    const inHand = (s: sdf.Shape) => s.scale(1.4).rotateY(-8).rotateZ(-5).at(GL[0] + 0.018, GL[1] + 0.056, GL[2] + 0.0);
    const hullPts = profile.polygon(
      [
        [-0.06, 0.018],
        [-0.04, -0.026],
        [0.04, -0.026],
        [0.06, 0.018],
        [0.028, 0.006],
        [-0.028, 0.006],
      ],
      {},
    );
    const hull = sdf.extrude(hullPts, 0.056, 0.008);
    const sail = sdf.extrude(profile.polygon([[-0.036, 0.006], [0.036, 0.006], [0.004, 0.058]], {}), 0.03, 0.006);
    const boat = sdf
      .smoothUnion(0.008, hull, sail)
      .paintWhere(sdf.box([0.004, 0.2, 0.2]).at(0, 0, 0), C.boatFold, 0.002)
      .paintWhere(sdf.box([0.2, 0.004, 0.4]).at(0, -0.006, 0), C.boatFold, 0.002);
    k.body('boat', inHand(boat).bone('knife.L'), { color: C.boat, roughness: 0.85, detail: 0.003 });
    const mast = sdf.capsule([0.004, 0.0, 0], [0.012, 0.078, 0], 0.005);
    const flag = sdf.extrude(profile.polygon([[0.012, 0.078], [0.04, 0.07], [0.012, 0.056]], {}), 0.012, 0.003);
    k.body('mast', inHand(mast).bone('knife.L'), { color: C.mast, roughness: 0.8, detail: 0.003 });
    k.body('flag', inHand(flag).bone('knife.L'), { color: C.boat, roughness: 0.85, detail: 0.003 });
    void coatShape;
  },
});
