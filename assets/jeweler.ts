import { mixRgb, profile, rgb, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Jeweler — Chibi Quest settlement NPC (catalog `npcs/settlement/jeweler`), about 1.0 m to the top
 * of the hair, faces +Z. Target: docs/npc-mockups/jeweler_001.jpg. Built on the humanoid kind
 * (assets/parts/humanoid-kind.ts), dressed in `extra`.
 *
 * Role: the jewelry shop NPC (gems and rings), seen in 3D and as a 128 px sprite; the gold monocle,
 *   the black beard, and the sparkling blue gem held up beside the head must read.
 * One idea: a delighted, neat man with a big black beard and a gold monocle who holds a huge blue gem
 *   on a gold handle up to the light, and a small red ring box in the other hand.
 * Shape language: round and soft (hair, beard, vest) with the faceted gem as the one hard, sharp form.
 * Palette (60/30/10): purple #5a3a7a (vest), near-black #231a17 / #2a2428 (hair, beard, trousers,
 *   shoes), white #f6f1ea (shirt); gold #e0b040 (buttons, chain, handle, buckle); the blue gem #3a8ad8
 *   is the accent, the red box #a03040 the second accent.
 * Value plan: the dark hair and beard frame the light face; the light shirt shows in the vest V; the
 *   glowing gem is the brightest spot and sits beside the face.
 * Bodies: skin, hair, beard, mustache, nose, monocle, shirt, collar, vest, trim, buttons, chain,
 *   trousers, belt, buckle, shoes, gem, gem-frame, handle, box, cushion, ring.
 * Rig: the humanoid kind's skeleton and clips. The right arm holds a raised pose (`pose.R`); the gem is
 *   rigid on `knife.R` and the ring box on `knife.L`.
 */

const C = {
  hair: '#231a17',
  gold: '#e0b040',
  shirt: '#f6f1ea',
  cuff: '#e6dfd2',
  pants: '#2a2428',
  belt: '#3a2c26',
  gem: '#3a8ad8',
  gemLight: '#8ad0f4',
  box: '#a03040',
  boxIn: '#c04858',
  lens: '#a8d8e8',
  monocle: '#c8a040',
  mouth: '#8a2e2a',
};

type V3 = readonly [number, number, number];

export default humanoidAsset({
  name: 'jeweler',
  description: 'A delighted jeweler with a gold monocle and a black beard in a purple velvet vest, holding up a sparkling blue gem and a ring box.',
  reference: 'docs/npc-mockups/jeweler_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { black: '#231a17', brown: '#5a301d', silver: '#b8b4c4', auburn: '#8e3b1c', blond: '#c4974a', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { purple: '#5a3a7a', burgundy: '#7a3048', indigo: '#44427a', spruce: '#2f5a5e' },
  },
  presets: {
    velvet: { skin: 'fair', hair: 'black', eyes: 'brown', cloth: 'purple' },
    atelier: { skin: 'tan', hair: 'silver', eyes: 'hazel', cloth: 'burgundy' },
  },
  hair: false,
  undershirt: false,
  pants: C.pants,
  shoes: false,
  lashes: false,
  // The right hand raised beside the head with the gem; the left forearm points forward and holds the ring box.
  pose: {
    R: { elbow: [0.215, 0.335, 0.025], wrist: [0.275, 0.41, 0.075] },
    L: { elbow: [0.19, 0.33, 0.04], wrist: [0.215, 0.31, 0.135] },
  },

  // Bold black brows and a closed, friendly smile under the mustache (review 3: the open mouth read as fangs).
  paintSkin(skin, h) {
    const smile = h.onFace(sdf.extrude(profile.arc(0.062, 0.015, 220, 320), 0.3).at(0, 0.062, 0), 0, 0.503);
    const oldBrows = sdf.extrude(profile.arc(0.1, 0.036, 54, 126), 0.3).at(0.1, 0.622, 0.1).mirror('x');
    // Heavy brows that arch up and fall at the outer ends.
    const brow = sdf.extrude(profile.arc(0.075, 0.027, 64, 116), 0.3).at(0.108, 0.627, 0.1);
    const brows = sdf.union(brow, brow.mirror('x'));
    return skin
      .paintWhere(oldBrows, h.tint.skin!, 0.002)
      .paintWhere(brows, C.hair, 0.002)
      .paintWhere(smile, C.mouth, 0.002);
  },

  extra(k, h) {
    const { SHOULDER, HEAD_Y, EYE, ANKLE } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];
    const headPose = (s: sdf.Shape) => s.at(0, HEAD_Y, 0).bone('head');
    const hairColor = k.tint('hair');

    // ------------------------------------------------------------------ hair: one smooth shell, swept back
    // Review 3: the tall ridged locks read as a knit cap. One low pompadour volume over the front of the
    // crown, the sides fuller above the ears, the strands only in the normal map.
    const shell = sdf.ellipsoid([0.216, 0.21, 0.2]);
    const faceMask = sdf.ellipsoid([0.16, 0.16, 0.14]).at(0, -0.06, 0.205);
    // Short sides: the cap stops above the ears (ear top is at local y -0.02).
    const crown = shell.smoothIntersect(0.05, sdf.halfSpace([0, -1, 0], -0.035)).smoothSubtract(0.012, faceMask);
    const back = shell.smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], 0.11)).smoothIntersect(0.03, sdf.halfSpace([0, 0, 1], -0.07));
    const pomp = sdf.ellipsoid([0.15, 0.085, 0.14]).rotateX(-14).at(0, 0.165, 0.07).smoothSubtract(0.02, faceMask);
    const puff = (sg: 1 | -1) => sdf.ellipsoid([0.04, 0.06, 0.09]).at(0.182 * sg, 0.06, -0.02);
    const hair = sdf.smoothUnion(0.025, crown, back, pomp, puff(1), puff(-1));
    k.body('hair', headPose(hair), {
      color: hairColor,
      roughness: 0.4,
      detail: 0.005,
      bump: (x, y, z) => 0.0012 * Math.sin(x * 95 + Math.max(0, z - 0.1) * 30),
    });

    // ------------------------------------------------------------------ the beard (its own body) and the mustache
    const faceZ = h.faceZ;
    const beardBase = h.head.round(0.016);
    const jaw = sdf.ellipsoid([0.26, 0.105, 0.3]).at(0, 0.488, 0); // jaw and chin
    const burn = pair(sdf.ellipsoid([0.035, 0.07, 0.09]).at(0.185, 0.57, 0.035)); // sideburns in front of the ears
    const mouthHole = sdf.ellipsoid([0.09, 0.058, 0.4]).at(0, 0.534, 0.0);
    // A narrow band along the jaw: it ends below the cheeks with a soft edge.
    const band = jaw.smoothIntersect(0.03, sdf.halfSpace([0, 1, 0], 0.572));
    const beardShell = beardBase
      .smoothIntersect(0.03, sdf.smoothUnion(0.03, band, burn))
      .smoothIntersect(0.06, sdf.ellipsoid([0.3, 0.3, 0.2]).at(0, 0.5, 0.11))
      .smoothSubtract(0.014, mouthHole);
    const tipZ = faceZ(0, 0.49) + 0.01;
    // Review 3: a short, round, full chin (no point).
    const chin = sdf.ellipsoid([0.1, 0.045, 0.05]).at(0, 0.472, tipZ - 0.03);
    const beard = sdf.smoothUnion(0.03, beardShell, chin).bone('head');
    k.body('beard', beard, { color: hairColor, roughness: 0.55, detail: 0.004 });

    const stache = (s: 1 | -1) =>
      sdf.chain(
        [
          [0.004 * s, 0.562, faceZ(0, 0.562) + 0.01, 0.0125],
          [0.03 * s, 0.564, faceZ(0.03, 0.564) + 0.012, 0.013],
          [0.062 * s, 0.553, faceZ(0.062, 0.553) + 0.01, 0.011],
          [0.088 * s, 0.564, faceZ(0.088, 0.564) + 0.006, 0.009],
          [0.092 * s, 0.582, faceZ(0.092, 0.582) + 0.004, 0.0075],
        ],
        0.012,
      );
    k.body('mustache', sdf.smoothUnion(0.01, stache(1), stache(-1)).bone('head'), { color: hairColor, roughness: 0.5, detail: 0.003 });

    // A big round nose, a little pinker than the face (the mockup).
    const noseTint = k.tint('skin', { color: '#e8908a', follow: 0.55 });
    k.body('nose', sdf.sphere(0.037).at(0, 0.566, faceZ(0, 0.566) + 0.002).bone('head'), { color: noseTint, roughness: 0.5, detail: 0.003 });

    // ------------------------------------------------------------------ the gold monocle over the left eye (x > 0)
    const mz = faceZ(EYE[0], EYE[1]) + 0.02;
    const monoclePose = (s: sdf.Shape) => s.rotateY(18).at(EYE[0] + 0.004, EYE[1] + 0.004, mz).bone('head');
    const rim = sdf.torus(0.056, 0.0075).rotateX(90);
    const lens = sdf.cylinder(0.055, 0.007).rotateX(90);
    const arm = sdf.capsule([0.056, 0.012, 0], [0.108, 0.03, -0.075], 0.0075);
    k.body('monocle', monoclePose(sdf.smoothUnion(0.006, rim, arm)), { color: C.monocle, roughness: 0.3, metalness: 0.85, detail: 0.003 });
    k.body('lens', monoclePose(lens), { color: C.lens, roughness: 0.08, opacity: 0.2, detail: 0.004 });

    // ------------------------------------------------------------------ white shirt with long sleeves
    const sleeve = (j: { ELBOW: V3; WRIST: V3 }) =>
      sdf.smoothUnion(
        0.015,
        sdf.cone(lerp(SHOULDER, j.ELBOW, -0.1), j.ELBOW, 0.047, 0.043).bone('upperarm.L'),
        sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.92), 0.043, 0.04).bone('forearm.L'),
      );
    const shirtBody = h.torso.round(0.003).intersect(sdf.halfSpace([0, -1, 0], -0.215));
    const collar = sdf.torus(0.06, 0.017).at(0, 0.452, -0.012).bone('chest');
    k.body('shirt', sdf.smoothUnion(0.012, h.weighted(shirtBody), h.perArm(sleeve), collar), { color: C.shirt, roughness: 0.8 });
    const cuffs = h.perArm((j) => sdf.cone(lerp(j.ELBOW, j.WRIST, 0.7), lerp(j.ELBOW, j.WRIST, 0.99), 0.0455, 0.0465).round(0.002).bone('forearm.L'));
    k.body('cuffs', cuffs, { color: C.cuff, roughness: 0.85, detail: 0.004 });

    // ------------------------------------------------------------------ purple velvet vest with a V front
    const vestOuter = h.torso.round(0.012);
    const vestShell = vestOuter.subtract(h.torso.round(-0.002)).intersect(h.band(0.256, 0.452));
    const vee = sdf.extrude(
      profile.polygon([
        [0, 0.335],
        [-0.052, 0.5],
        [0.052, 0.5],
      ]),
      0.5,
    ).at(0, 0, 0.25);
    const vestShade = k.tint('cloth', { color: '#3f2858', follow: 1 });
    const vest = h.weighted(vestShell.subtract(vee)).paintWhere(h.band(0.256, 0.272), vestShade, 0.003);
    k.body('vest', vest, { color: h.tint.shirt!, roughness: 0.95, detail: 0.004, bump: (x, y, z) => 0.0015 * Math.sin(x * 140 + z * 90) * Math.cos(y * 120) });

    // Gold buttons down the front and a watch chain that drapes from the neckline to the big buttons.
    const vestZ = (x: number, y: number) => sdf.raycast(vestOuter, [x, y, 1], [0, 0, -1])![2];
    const btn = (x: number, y: number, r: number) => sdf.sphere(r).at(x, y, vestZ(x, y) + 0.001);
    const buttons = sdf.union(btn(0.07, 0.3, 0.0145), btn(-0.07, 0.3, 0.0145), btn(0, 0.318, 0.0095), btn(0, 0.292, 0.0095));
    k.body('buttons', buttons.bone('chest'), { color: C.gold, roughness: 0.3, metalness: 0.85, detail: 0.003 });
    const swag = (s: 1 | -1) => {
      const pts: [number, number][] = [
        [0.062, 0.436],
        [0.082, 0.395],
        [0.092, 0.35],
        [0.082, 0.318],
        [0.07, 0.3],
      ];
      return sdf.chain(pts.map(([x, y]) => [x * s, y, vestZ(x, y) + 0.005, 0.0065] as [number, number, number, number]), 0.01);
    };
    k.body('chain', sdf.union(swag(1), swag(-1)).bone('chest'), { color: C.gold, roughness: 0.3, metalness: 0.85, detail: 0.003 });

    // ------------------------------------------------------------------ trousers: a waist band, a belt and a gold buckle
    const waist = h.weighted(h.torso.round(0.005).intersect(h.band(0.15, 0.248)));
    k.body('trousers', waist, { color: C.pants, roughness: 0.8, detail: 0.005 });
    const beltBand = h.weighted(h.torso.round(0.01).subtract(h.torso.round(-0.002)).intersect(h.band(0.224, 0.256)));
    k.body('belt', beltBand, { color: C.belt, roughness: 0.6, detail: 0.004 });
    const beltZ = sdf.raycast(h.torso.round(0.01), [0, 0.24, 1], [0, 0, -1])![2];
    const buckle = sdf.box([0.06, 0.04, 0.016], 0.007).at(0, 0.24, beltZ + 0.002).subtract(sdf.box([0.036, 0.018, 0.02], 0.004).at(0, 0.24, beltZ + 0.004));
    k.body('buckle', buckle.bone('hips'), { color: C.gold, roughness: 0.3, metalness: 0.85, detail: 0.003 });

    // ------------------------------------------------------------------ shiny black shoes
    const shoe = sdf
      .smoothUnion(0.025, sdf.ellipsoid([0.058, 0.044, 0.104]).at(0, 0.042, 0.042), sdf.sphere(0.052).at(0, 0.052, -0.005))
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('shoes', pair(shoe), { color: C.pants, roughness: 0.15, metalness: 0.1 });

    // ------------------------------------------------------------------ the gem on a gold handle (right hand, x < 0)
    const gR = h.arms.R.GRIP;
    const gemAt: V3 = [-gR[0], gR[1] + 0.065, gR[2]];
    const inR = (s: sdf.Shape) => s.rotateZ(8).at(...gemAt).bone('knife.R');
    // The handle runs from below the fist up to the frame; the frame ring and the gem sit above.
    const handle = sdf.union(
      sdf.cylinder(0.0145, 0.12, 0.004).at(0, -0.015, 0),
      sdf.cylinder(0.02, 0.014, 0.004).at(0, 0.052, 0), // ferrule
      sdf.sphere(0.019).at(0, -0.078, 0), // pommel
    );
    k.body('gem-handle', inR(handle), { color: C.gold, roughness: 0.3, metalness: 0.85, detail: 0.003 });
    const GY = 0.127; // gem center above the gem origin
    // A cut gem: an octagon outline (0.11 x 0.14) and two rings of slanted facets that meet in a table.
    const outline = sdf.intersect(sdf.box([0.11, 0.14, 0.1], 0.004), sdf.box([0.11, 0.14, 0.1], 0.004).rotateZ(40).scale(0.88));
    const facet = (nx: number, ny: number, sz: 1 | -1) => {
      const v: V3 = [nx * 0.5, ny * 0.36, sz * 0.86];
      const l = Math.hypot(...v);
      return sdf.halfSpace([v[0] / l, v[1] / l, v[2] / l], 0.028 / l);
    };
    const cuts = ([1, -1] as const).flatMap((sz) => [facet(1, 0, sz), facet(-1, 0, sz), facet(0, 1, sz), facet(0, -1, sz), facet(0.7, 0.7, sz), facet(-0.7, 0.7, sz), facet(0.7, -0.7, sz), facet(-0.7, -0.7, sz)]);
    const cut = cuts.reduce((acc, c) => acc.intersect(c), outline);
    const dark = rgb('#2a62b8');
    const mid = rgb(C.gem);
    const light = rgb(C.gemLight);
    // Each facet gets its own value (by the side of the gem it faces), and the table is the lightest.
    const gem = cut
      .paintFn((x, y, z) => {
        const u = x / 0.055;
        const v = y / 0.07;
        if (Math.abs(u) < 0.42 && Math.abs(v) < 0.42) return light;
        const t = Math.atan2(v, u) / (Math.PI / 4);
        const side = ((Math.round(t) % 8) + 8) % 8;
        return side % 2 === 0 ? (z > 0 ? mid : dark) : z > 0 ? mixRgb(mid, light, 0.5) : mid;
      })
      .at(0, GY, 0);
    k.body('gem', inR(gem), { color: C.gem, roughness: 0.1, metalness: 0.3, emissive: C.gem, emissiveIntensity: 0.4, flat: true, detail: 0.003 });
    const frame = sdf.torus(0.062, 0.0085).rotateX(90).scale([0.93, 1.17, 1]).at(0, GY, 0);
    k.body('gem-frame', inR(frame), { color: C.gold, roughness: 0.3, metalness: 0.85, detail: 0.003 });

    // ------------------------------------------------------------------ the ring box (left hand, x > 0)
    const gL = h.arms.L.GRIP;
    const boxAt: V3 = [gL[0], gL[1] + 0.055, gL[2] + 0.02];
    // The box is held open on the fist and tilts toward the viewer.
    const inL = (s: sdf.Shape) => s.rotateX(22).at(...boxAt).bone('knife.L');
    const base = sdf.box([0.1, 0.04, 0.078], 0.01).subtract(sdf.box([0.078, 0.04, 0.056], 0.006).at(0, 0.014, 0));
    // The lid stands open, hinged at the back edge and tilted back.
    const lid = sdf.box([0.1, 0.045, 0.014], 0.006).at(0, 0.0225, 0).rotateX(-28).at(0, 0.02, -0.039);
    k.body('box', inL(sdf.smoothUnion(0.006, base, lid)), { color: C.box, roughness: 0.95, detail: 0.003, bump: (x, y, z) => 0.0012 * Math.sin(x * 220 + z * 180) });
    const cushion = sdf.box([0.074, 0.02, 0.052], 0.008).at(0, 0.002, 0);
    k.body('cushion', inL(cushion), { color: C.boxIn, roughness: 0.95, detail: 0.003 });
    const ring = sdf.torus(0.017, 0.006).rotateZ(90).at(0, 0.026, 0.0);
    const stone = sdf.sphere(0.0085).at(0, 0.044, 0);
    k.body('ring', inL(sdf.smoothUnion(0.004, ring, stone)), { color: C.gold, roughness: 0.25, metalness: 0.9, detail: 0.0028 });
  },
});
