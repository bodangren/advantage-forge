import { noise, profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Miller — Chibi Quest settlement NPC (catalog `npcs/settlement/miller`), about 1.0 m to the top of
 * the cap, faces +Z. Target: docs/npc-mockups/miller_001.jpg. Built on the humanoid kind.
 *
 * Role: the farm and mill NPC who sells flour and grain; seen at the windmill in 3D and as a 128 px
 *   sprite. The soft cream cap, the big brown beard, and the fat flour sack must read.
 * One idea: a round, flour-dusted miller with a bushy brown beard and a fat tied sack on his shoulder,
 *   one hand on the sack and the other raised in a wave.
 * Shape language: round and soft (cap, beard, sack, puffed trousers), with the belt and the buckle as
 *   the small hard forms.
 * Palette (60/30/10): cream and white (cap #ece0c4, smock #f0ece4 with #d8d0c4 folds, sack #e8dcc0),
 *   tan trousers #c8a878, brown #6b3e22 (hair, beard), #6b4226 (belt, straps), #5a3a24 (boots).
 * Value plan: the light cap, smock, and sack frame the dark beard, which is the focal point of the face.
 * Bodies: skin, nose, ears, beard, mustache, hair, cap, smock, cuffs, belt, straps, buckle, trousers, boots, sack, print, tie.
 *   boots, sack, tie.
 * Rig: the humanoid kind's skeleton and clips; both arms keep a raised pose. The sack is rigid on the
 *   grip bone `knife.R`.
 */

const C = {
  cap: '#ece0c4',
  fold: '#d8d0c4',
  belt: '#6b4226',
  buckle: '#b8b09c',
  pants: '#c8a878',
  boot: '#5a3a24',
  sole: '#3a2416',
  sack: '#e8dcc0',
  sackTie: '#8a6a3a',
  wheat: '#b08c54',
  mouth: '#8a2e2a',
  teeth: '#fbf6ee',
};

const WAVE = { elbow: [0.21, 0.36, 0.02], wrist: [0.25, 0.45, 0.05] } as const;
// The other fist rests at the belt, in front of the hip.
const BELT = { elbow: [0.175, 0.31, 0.02], wrist: [0.135, 0.27, 0.1] } as const;

export default humanoidAsset({
  name: 'miller',
  description: 'A round, flour-dusted miller in a soft cap and a white smock, with a brown beard and a fat flour sack on his shoulder.',
  reference: 'docs/npc-mockups/miller_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { brown: '#6b3e22', black: '#231a17', blond: '#c4974a', auburn: '#8e3b1c', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { linen: '#ece1c8', oat: '#dcc9a2', sage: '#bfc7a0', clay: '#d4a890' },
  },
  presets: {
    harvest: { skin: 'tan', hair: 'auburn', eyes: 'green', cloth: 'oat' },
  },
  hair: false,
  lashes: false,
  undershirt: false,
  pants: false,
  shoes: false,
  pose: { L: WAVE, R: BELT },

  // A wide open grin with one band of teeth and thick arched brows.
  paintSkin(skin, h) {
    const y = 0.522;
    const grin = profile.polygon(
      [
        [-0.046, 0.012],
        [-0.025, 0.003],
        [0, 0.0],
        [0.025, 0.003],
        [0.046, 0.012],
        [0.038, -0.01],
        [0.019, -0.024],
        [0, -0.029],
        [-0.019, -0.024],
        [-0.038, -0.01],
      ],
      { smooth: true, samples: 6 },
    );
    const mouth = h.onFace(sdf.extrude(grin, 0.3), 0, y);
    const teeth = mouth.intersect(sdf.halfSpace([0, -1, 0], -(y - 0.008))).intersect(sdf.box([0.056, 0.1, 1]).at(0, y, 0));
    const oldBrows = sdf.extrude(profile.arc(0.1, 0.036, 54, 126), 0.3).at(0.1, 0.622, 0.1).mirror('x');
    const brows = sdf.extrude(profile.arc(0.07, 0.017, 52, 122), 0.3).at(0.1, 0.652, 0.1).mirror('x');
    return skin
      .paintWhere(oldBrows, h.tint.skin!, 0.002)
      .paintWhere(brows, h.tint.brow!, 0.002)
      .paintWhere(mouth, C.mouth, 0.002)
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
    const HP = (s: sdf.Shape) => s.rotateX(-6).at(0, HEAD_Y, 0);

    // ------------------------------------------------------------------ bigger ears and a round nose (skin tint)
    const ear = sdf
      .ellipsoid([0.03, 0.054, 0.04])
      .subtract(sdf.sphere(0.02).at(0.019, 0, 0.008))
      .rotateY(-12)
      .at(0.205, 0.612, -0.008)
      .bone('head');
    const nose = sdf.sphere(0.034).at(0, 0.575, h.faceZ(0, 0.575) - 0.01).bone('head');
    k.body('ears', pair(ear), { color: k.tint('skin'), roughness: 0.55, detail: 0.004 });
    k.body('nose', nose, { color: k.tint('skin', { color: '#eba48c', follow: 0.6 }), roughness: 0.5, detail: 0.004, textureDensity: 2 });

    // ------------------------------------------------------------------ beard: a shell over the jaw, sideburns, a chin tuft
    const my = 0.552;
    const skull = h.head.round(0.016).subtract(h.head.round(0.002));
    const lower = sdf.union(
      sdf.box([0.6, 0.3, 0.6]).at(0, my - 0.15, 0.3),
      sdf.halfSpace([-0.3304, 0.9439, 0], 0.5 * 0.9439).intersect(sdf.box([0.5, 0.5, 0.6]).at(0.25, 0.6, 0.2)),
      sdf.halfSpace([0.3304, 0.9439, 0], 0.5 * 0.9439).intersect(sdf.box([0.5, 0.5, 0.6]).at(-0.25, 0.6, 0.2)),
    ).intersect(sdf.box([0.6, 0.62, 0.6]).at(0, 0.7, 0.28)).intersect(sdf.halfSpace([0, 1, 0], 0.76));
    const sideburn = sdf.box([0.07, 0.2, 0.12], 0.03).at(0.205, 0.65, 0.02).mirror('x', 0);
    const mouthHole = sdf.ellipsoid([0.058, 0.032, 0.4]).at(0, 0.522, 0);
    const jaw = skull.smoothIntersect(0.012, sdf.union(lower, sideburn)).subtract(mouthHole);
    const chinZ = h.faceZ(0, 0.5);
    const chin = sdf.smoothUnion(
      0.02,
      sdf.ellipsoid([0.082, 0.04, 0.056]).at(0, 0.482, chinZ - 0.005),
      sdf.ellipsoid([0.05, 0.034, 0.04]).at(0, 0.462, chinZ + 0.012),
    ).subtract(mouthHole);
    const beardShape = sdf.smoothUnion(0.012, jaw, chin).bone('head');
    // No flour dots on the beard: at 128 px they read as spots (review 2).
    const beard = beardShape;
    k.body('beard', beard, {
      color: hairColor,
      roughness: 0.65,
      detail: 0.004,
      bump: (x, y, z) => 0.003 * Math.sin(x * 190 + Math.sin(y * 70 + z * 50) * 2.2) * Math.cos(y * 160 + z * 90),
    });

    // The mustache: thick and bushy above the mouth, with curled tips.
    const mz = (x: number, yy = my) => h.faceZ(x, yy) + 0.006;
    const side = sdf.smoothUnion(
      0.014,
      sdf.capsule([0.0, my, mz(0.0)], [0.036, my - 0.006, mz(0.036)], 0.0185),
      sdf.capsule([0.036, my - 0.006, mz(0.036)], [0.07, my - 0.004, mz(0.07)], 0.0165),
      sdf.capsule([0.07, my - 0.004, mz(0.07)], [0.092, my + 0.012, mz(0.092)], 0.0135),
    );
    k.body('mustache', sdf.smoothUnion(0.012, side, side.mirror('x', 0)).bone('head'), {
      color: hairColor,
      roughness: 0.65,
      detail: 0.003,
    });

    // ------------------------------------------------------------------ cap: soft cream, low and wide, slouched to one side
    const dome = sdf
      .ellipsoid([0.228, 0.15, 0.212])
      .at(0, 0.075, -0.008)
      .intersect(sdf.halfSpace([0, -0.97, 0.2425], -0.0364));
    // The cap is a cloth shell that hugs the head (no shelf under the brim), with a soft fold on one side.
    const cavity = sdf.ellipsoid([0.206, 0.202, 0.192]);
    const slouch = sdf.smoothUnion(
      0.05,
      sdf.ellipsoid([0.14, 0.06, 0.14]).at(-0.07, 0.185, -0.03),
      sdf.sphere(0.065).at(-0.14, 0.15, -0.06),
      sdf.sphere(0.055).at(0.075, 0.175, -0.02),
    );
    const cap = HP(sdf.smoothUnion(0.03, dome, slouch).smoothSubtract(0.01, cavity)).bone('head');
    k.body('cap', cap, { color: C.cap, roughness: 0.92, detail: 0.005, bump: (x, y, z) => 0.0018 * noise.fbm(x * 24, y * 24, z * 24, 2) });

    // ------------------------------------------------------------------ hair: a small cap, temple locks, a forehead curl
    const hairShell = sdf.ellipsoid([0.212, 0.206, 0.196]);
    // Back locks: eleven rounded locks hang from the hair cap to the nape.
    const radiusAt = (y: number) => 0.2 * Math.sqrt(Math.max(0.05, 1 - (y / 0.206) ** 2)) + 0.004;
    const backLocks = sdf.union(
      ...Array.from({ length: 11 }, (_, n) => {
        const a = ((-80 + 16 * n) * Math.PI) / 180;
        const at = (y: number, rr: number): [number, number, number, number] => [radiusAt(y) * Math.sin(a), y, -radiusAt(y) * Math.cos(a), rr];
        return sdf.chain([at(-0.03, 0.026), at(-0.08, 0.025), at(-0.13 - 0.008 * Math.cos(a * 2), 0.02)], 0.01);
      }),
    );
    // A band of hair under the cap brim, with a scalloped lower edge: no gap shows between cap and face.
    const bandY = (x: number) => 0.045 - 0.006 * Math.abs(x) * 6;
    const bangs = hairShell
      .intersect(sdf.box([0.5, 0.055, 0.5]).at(0, 0.068, 0.25))
      .smoothUnion(
        0.012,
        ...Array.from({ length: 9 }, (_, n) => {
          const x = -0.14 + 0.035 * n;
          const y = bandY(x) + 0.004;
          return sdf.sphere(0.02).at(x, y, 0.193 * Math.sqrt(Math.max(0.05, 1 - (y / 0.203) ** 2 - (x / 0.208) ** 2)) - 0.004);
        }),
      );
    const back = hairShell.smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], 0.06)).smoothIntersect(0.03, sdf.halfSpace([0, 0, 1], -0.02));
    const lock = (x: number, z: number, y0: number, y1: number, r: number) =>
      sdf.chain(
        [
          [x, y0, z, r],
          [x * 1.01, (y0 + y1) / 2, z + 0.004, r * 1.05],
          [x * 0.98, y1, z + 0.008, r * 0.8],
        ],
        0.01,
      );
    const temple = (s: number) =>
      sdf.smoothUnion(
        0.012,
        lock(s * 0.19, 0.03, 0.02, 0.1, 0.026),
        lock(s * 0.185, 0.07, 0.02, 0.095, 0.024),
        lock(s * 0.178, 0.105, 0.04, 0.095, 0.02),
      );
    const curl = (x0: number, s: number) =>
      sdf.chain(
        [
          [x0, 0.052, 0.172, 0.022],
          [x0 + 0.012 * s, 0.07, 0.19, 0.02],
          [x0 + 0.03 * s, 0.068, 0.2, 0.016],
          [x0 + 0.034 * s, 0.05, 0.194, 0.011],
        ],
        0.01,
      );
    const fringe = sdf.smoothUnion(0.014, sdf.ellipsoid([0.06, 0.028, 0.03]).at(-0.012, 0.056, 0.168), curl(-0.05, -1), curl(-0.012, 1), curl(0.03, 1));
    const hair = HP(sdf.smoothUnion(0.012, back, backLocks, bangs, temple(1), temple(-1), fringe)).bone('head');
    k.body('hair', hair, { color: hairColor, roughness: 0.6, detail: 0.004 });

    // ------------------------------------------------------------------ smock: a round white shirt with rolled sleeves
    const upper = h.perArm((j) => sdf.cone(lerp(SHOULDER, j.ELBOW, -0.1), lerp(j.ELBOW, j.WRIST, 0.14), 0.048, 0.045).bone('upperarm.L'));
    // A round belly: the smock, belt, and waist follow it.
    const belly0 = sdf.ellipsoid([0.138, 0.1, 0.118]).at(0, 0.235, 0.04);
    const body = sdf.smoothUnion(0.04, h.torso, belly0);
    const smockPaint = k.tint('cloth', { color: C.fold, follow: 1 });
    const placket = sdf.box([0.008, 0.2, 0.5]).at(0, 0.36, 0.2);
    const folds = sdf.union(
      ...[-0.07, -0.035, 0.035, 0.07].map((x) => sdf.box([0.006, 0.05, 0.6]).rotateZ(x * 150).at(x, 0.225, 0.2)),
    );
    const smock = sdf
      .smoothUnion(0.012, h.weighted(body.intersect(sdf.halfSpace([0, -1, 0], -0.2))), upper)
      .paintWhere(placket, smockPaint, 0.002)
      .paintWhere(folds, smockPaint, 0.003)
      .paintWhere(h.band(0.206, 0.216), smockPaint, 0.003);
    k.body('smock', smock, { color: h.tint.shirt ?? '#ece1c8', roughness: 0.88, detail: 0.005 });
    const cuff = h.perArm((j) => sdf.cone(lerp(j.ELBOW, j.WRIST, -0.06), lerp(j.ELBOW, j.WRIST, 0.2), 0.052, 0.053).round(0.005).bone('forearm.L'));
    const collar = sdf.torus(0.062, 0.018).at(0, 0.452, -0.01).bone('chest');
    k.body('cuffs', sdf.union(cuff, collar), { color: h.tint.shirt ?? '#ece1c8', roughness: 0.92, detail: 0.004 });

    // ------------------------------------------------------------------ belt, buckle, and straps
    const beltShell = body.round(0.01).subtract(body.round(-0.004)).intersect(h.band(0.238, 0.268));
    k.body('belt', h.weighted(beltShell), { color: C.belt, roughness: 0.7, detail: 0.005 });
    const bz = sdf.raycast(body, [0, 0.253, 1], [0, 0, -1])![2];
    const buckle = sdf.box([0.058, 0.04, 0.012], 0.005).subtract(sdf.box([0.036, 0.022, 0.03], 0.003)).at(0, 0.253, bz + 0.012).bone('spine');
    k.body('buckle', buckle, { color: C.buckle, roughness: 0.35, metalness: 0.8, detail: 0.003 });
    const strapShell = body.round(0.014).subtract(body.round(-0.002));
    const strap = strapShell
      .intersect(sdf.box([0.03, 0.2, 0.7]).at(0.07, 0.36, 0))
      .intersect(sdf.halfSpace([0, -1, 0], -0.25));
    k.body('straps', h.weighted(pair(strap)), { color: C.belt, roughness: 0.7, detail: 0.004 });

    // ------------------------------------------------------------------ puffed tan trousers and brown boots
    const trouserLeg = sdf.smoothUnion(
      0.02,
      sdf.capsule([HIP[0], 0.17, HIP[2]], KNEE, 0.066).bone('leg.L'),
      sdf.sphere(0.07).at(KNEE[0], 0.128, 0.012).bone('shin.L'), // the baggy knee
      sdf.cone(KNEE, [ANKLE[0], 0.12, 0.002], 0.066, 0.056).bone('shin.L'),
    );
    const waist = h.weighted(body.round(0.012).intersect(h.band(0.15, 0.25)));
    k.body('trousers', sdf.smoothUnion(0.03, waist, pair(trouserLeg)), {
      color: C.pants,
      roughness: 0.85,
    });
    const shoe = sdf.smoothUnion(0.025, sdf.ellipsoid([0.058, 0.044, 0.1]).at(0, 0.04, 0.04), sdf.sphere(0.052).at(0, 0.052, -0.005));
    const shaft = sdf.cylinder(0.052, 0.07, 0.012).at(0, 0.075, 0.0);
    const bootRim = sdf.torus(0.05, 0.011).at(0, 0.107, 0);
    const sole = shoe.round(0.004).intersect(sdf.halfSpace([0, 1, 0], 0.016)).intersect(sdf.halfSpace([0, -1, 0], 0));
    const boot = sdf
      .union(sdf.smoothUnion(0.02, shoe, shaft, bootRim).intersect(sdf.halfSpace([0, -1, 0], 0)), sole.paint(C.sole))
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.6 });


    // ------------------------------------------------------------------ the flour sack: big, soft, tied, carried on the back
    // A fat cloth sack nearly as large as the torso rides on the back (the chest bone), its tied neck
    // leaning over the right shoulder (x < 0), well behind and below the head. The mark faces backward.
    const sackLocal = (s: sdf.Shape) => s.rotateZ(14).at(-0.2, 0.3, -0.13);
    const belly = sdf.smoothUnion(
      0.05,
      sdf.ellipsoid([0.14, 0.155, 0.115]).at(0, -0.01, 0),
      sdf.ellipsoid([0.11, 0.11, 0.095]).at(0.01, 0.07, 0.0),
      sdf.sphere(0.08).at(-0.08, -0.09, -0.03),
    );
    const neck = sdf.cone([0, 0.14, 0], [0, 0.205, 0], 0.072, 0.034);
    const flap = (dx: number, dz: number, bend: number) =>
      sdf.chain(
        [
          [0, 0.2, 0, 0.028],
          [dx * 0.45, 0.225, dz * 0.45, 0.03],
          [dx, 0.23 + bend, dz, 0.022],
        ],
        0.014,
      );
    const sackShape = sdf.smoothUnion(0.02, belly, neck, flap(0.08, -0.03, 0.0), flap(-0.07, 0.03, 0.01), flap(0.0, -0.075, 0.015));
    // The wheat mark on the back face (z < 0): a stalk with grain pairs.
    const wz = -0.113;
    const mark = sdf.union(
      sdf.capsule([0.0, -0.1, wz], [0.0, 0.03, wz], 0.01),
      ...[-0.07, -0.03, 0.01].flatMap((yy) => [
        sdf.ellipsoid([0.014, 0.028, 0.03]).rotateZ(35).at(0.026, yy, wz),
        sdf.ellipsoid([0.014, 0.028, 0.03]).rotateZ(-35).at(-0.026, yy, wz),
      ]),
      sdf.ellipsoid([0.014, 0.028, 0.03]).at(0, 0.06, wz),
    );
    const sack = sackLocal(sackShape);
    // The mark is a thin raised print on the sack surface, its own body in the wheat color.
    k.body('print', sackLocal(sackShape.round(0.004).intersect(mark)).bone('chest'), { color: C.wheat, roughness: 0.95, detail: 0.003 });
    k.body('sack', sack.bone('chest'), {
      color: C.sack,
      roughness: 0.95,
      detail: 0.005,
      bump: (x, y, z) => 0.0022 * noise.fbm(x * 22, y * 22, z * 22, 2) + 0.0012 * Math.sin(y * 70 + noise.noise3(x * 8, y * 8, z * 8) * 3),
    });
    const tie = sackLocal(sdf.torus(0.05, 0.013).at(0, 0.172, 0));
    k.body('tie', tie.bone('chest'), { color: C.sackTie, roughness: 0.85, detail: 0.003 });
  },
});
