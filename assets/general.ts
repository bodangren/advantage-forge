import { profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * General — Chibi Quest court NPC (catalog `npcs/court-and-faction/general`), about 1.0 m to the top
 * of the plume, faces +Z. Target: docs/npc-mockups/general_001.jpg. Built on the humanoid kind.
 *
 * Role: a castle NPC who plans the defense and gives battle quests; seen at the war room and the wall
 *   in 3D and as a 128 px sprite. The black bicorne with its white plume and the brass telescope read first.
 * One idea: a proud, kind old soldier whose wide black hat, gold epaulettes, and held-out brass
 *   telescope stand out of a red coat and white trousers.
 * Shape language: round and soft (a chubby face, big ears, a puffed coat) with the hat and the tube as the hard forms.
 * Palette (60/30/10): coat #a83a30 (cloth slot), white #f0ece4 (vest, trousers, cuffs), black #2a2428 (hat,
 *   boots, stock); gold #e0b040 (epaulettes, buttons, cockade, medals); sash #2f4a8a; plume #f6f1ea; hair #a8a4a0.
 * Value plan: the dark hat frames the light face; the red coat is the mass; the gold and the brass tube are the accent.
 * Bodies: skin, nose, ears, hat, plume, hair, braid, coat, vest, sash, white, gold, medals, pants, boots, telescope.
 * Rig: the humanoid kind's skeleton and clips; the arms keep their poses (the telescope hand out front,
 *   the left fist on the hip). The telescope is rigid on `knife.R`.
 */

const C = {
  white: '#f0ece4',
  black: '#2a2428',
  hat: '#2a2428',
  plume: '#f6f1ea',
  gold: '#e0b040',
  silver: '#c8ccd4',
  sash: '#2f4a8a',
  brass: '#c8a040',
  trim: '#e0b040',
  mouth: '#8a2e2a',
  teeth: '#fbf6ee',
};

export default humanoidAsset({
  name: 'general',
  description: 'A proud, kind old general in a red coat, gold epaulettes, and a plumed bicorne hat, holding out a brass telescope.',
  reference: 'docs/npc-mockups/general_001.jpg',
  variants: {
    skin: { light: '#e8b48e', fair: '#f2c7a4', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { gray: '#a8a4a0', brown: '#5a301d', black: '#231a17', blond: '#c4974a', auburn: '#8e3b1c', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { crimson: '#a83a30', burgundy: '#7a2f3c', midnight: '#34426a', olive: '#55633a' },
  },
  presets: {
    veteran: { skin: 'tan', hair: 'silver', eyes: 'hazel', cloth: 'olive' },
  },
  hair: false,
  undershirt: false,
  // Cream breeches (review 3: the mockup shows them between the coat tails and the boots).
  pants: '#eadfc4',
  shoes: false,
  lashes: false,
  // The right hand (x < 0) holds the telescope out at chest height; the left fist rests on the hip, elbow out.
  pose: {
    R: { elbow: [0.17, 0.335, 0.05] as const, wrist: [0.2, 0.33, 0.15] as const },
    L: { elbow: [0.2, 0.31, -0.03] as const, wrist: [0.15, 0.25, 0.04] as const },
  },

  // A wide, warm grin with round corners and one white tooth band, soft cheek lines, and the kind's brows
  // painted over with skin (the white bushy brows are geometry).
  paintSkin(skin, h) {
    // A broad closed smile with the corners up (review 3: the old arc was small, flat, and partly under the nose).
    const y = 0.508;
    const mouth = sdf.extrude(profile.arc(0.07, 0.012, 214, 326), 0.3).at(0, y + 0.07, 0.1);
    const oldBrows = sdf.extrude(profile.arc(0.1, 0.036, 54, 126), 0.3).at(0.1, 0.622, 0.1).mirror('x');
    // Smile lines run from the nose wings down around the mouth corners.
    const smileLine = sdf.extrude(profile.arc(0.075, 0.005, 300, 346), 0.3).at(-0.012, 0.6, 0.1);
    const smileLines = smileLine.mirror('x');
    const crow = (s: number) => sdf.capsule([s * 0.158, 0.6, 0.1], [s * 0.166, 0.588, 0.1], 0.0035).union(sdf.capsule([s * 0.158, 0.596, 0.1], [s * 0.17, 0.598, 0.1], 0.0035));
    const lines = smileLines.union(crow(1), crow(-1));
    return skin
      .paintWhere(oldBrows, h.tint.skin!, 0.002)
      .paintWhere(lines.intersect(sdf.halfSpace([0, 0, -1], -0.05)), h.tint.blush!, 0.003)
      .paintWhere(mouth, h.tint.mouth!, 0.002);
  },

  extra(k, h) {
    const { SHOULDER, ANKLE, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x', 0);
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];
    const hairColor = k.tint('hair');
    const skinColor = k.tint('skin');
    const coatColor = h.tint.shirt ?? '#a83a30';

    // ------------------------------------------------------------------ a rounder nose and bigger ears
    const noseZ = h.faceZ(0, 0.566);
    k.body('nose', sdf.sphere(0.03).at(0, 0.558, noseZ - 0.009).bone('head'), { color: skinColor, roughness: 0.55, detail: 0.004, textureDensity: 2 });
    const ear = sdf
      // Review 3: large, round ears.
      .ellipsoid([0.056, 0.09, 0.072])
      .subtract(sdf.sphere(0.036).at(0.032, 0, 0.014))
      .rotateY(-14)
      .at(0.22, 0.622, -0.012)
      .bone('head');
    k.body('ears', pair(ear), { color: skinColor, roughness: 0.55, detail: 0.004 });

    // White bushy brows: a chain of soft lobes over each eye, arched, with a wild outer tuft.
    const browPts: Array<[number, number, number]> = [
      [0.056, 0.698, 0],
      [0.078, 0.708, 0],
      [0.1, 0.712, 0],
      [0.122, 0.708, 0],
      [0.144, 0.697, 0],
    ];
    const browChain = sdf.chain(
      browPts.map(([x, y], i): [number, number, number, number] => [x, y, h.faceZ(x, y) + 0.004, [0.011, 0.013, 0.014, 0.013, 0.011][i]!]),
      0.01,
    );
    const tuft = sdf.chain(
      [
        [0.14, 0.698, h.faceZ(0.14, 0.698) + 0.008, 0.01],
        [0.158, 0.702, h.faceZ(0.152, 0.702) + 0.006, 0.008],
        [0.168, 0.714, h.faceZ(0.152, 0.714) + 0.006, 0.006],
      ],
      0.006,
    );
    k.body('brows', sdf.smoothUnion(0.008, browChain, tuft).mirror('x', 0).bone('head'), { color: '#f2eee8', roughness: 0.8, detail: 0.004, textureDensity: 2 });

    // ------------------------------------------------------------------ the hat: a tall rounded shako, a short front brim, a plume
    // Review 3: the old wide bicorne with side points read as a flat cap with bulging sides.
    const hairPose = (s: sdf.Shape) => s.rotateX(-6).at(0, HEAD_Y, 0);
    const hatPose = (s: sdf.Shape) => s.rotateX(-6).at(0, HEAD_Y + 0.02, 0);
    const crownProfile = profile.polygon(
      [
        [0, 0.335],
        [0.08, 0.33],
        [0.145, 0.305],
        [0.185, 0.255],
        [0.204, 0.18],
        [0.212, 0.1],
        [0.216, 0.045],
        [0, 0.045],
      ],
      { smooth: true, samples: 6 },
    );
    const crown = sdf.revolve(crownProfile).scale([1.06, 1, 0.98]);
    const band = sdf.ellipsoid([0.238, 0.024, 0.218]).at(0, 0.058, 0);
    const brim = sdf.ellipsoid([0.16, 0.014, 0.085]).rotateX(8).at(0, 0.05, 0.2).intersect(sdf.halfSpace([0, 0, -1], -0.1));
    const hat = hatPose(sdf.smoothUnion(0.016, crown, band, brim)).bone('head');
    k.body('hat', hat, { color: C.hat, roughness: 0.6, detail: 0.005 });

    // The gold cockade with a dark center on the front fold, and the white plume fan on top.
    const starPts: Array<[number, number]> = Array.from({ length: 10 }, (_, i) => {
      const r = i % 2 === 0 ? 0.03 : 0.0125;
      const a = (Math.PI / 5) * i;
      return [r * Math.sin(a), r * Math.cos(a) + 0.002];
    });
    const star = sdf.extrude(profile.polygon(starPts), 0.06);
    const slopeZ = (y: number) => sdf.raycast(crown, [0, y, 1], [0, 0, -1])?.[2] ?? 0.2;
    const cy = 0.2;
    const lean = (Math.atan2(slopeZ(cy - 0.03) - slopeZ(cy + 0.03), 0.06) * 180) / Math.PI;
    const cockade = sdf
      .smoothUnion(0.004, sdf.cylinder(0.04, 0.016, 0.006).rotateX(90), sdf.cylinder(0.032, 0.026, 0.006).rotateX(90).at(0, 0, 0.004))
      .paintWhere(star, '#c8281e', 0.001)
      .rotateX(-lean)
      .at(0, cy, slopeZ(cy) + 0.002);
    k.body('cockade', hatPose(cockade).bone('head'), { color: C.gold, roughness: 0.4, metalness: 0.6, detail: 0.003 });
    const feather = (a: number, len: number, w: number) =>
      sdf.ellipsoid([w, len, 0.02]).at(0, len * 0.85, 0).rotateZ(a).at(0, 0.315, 0.0);
    const plume = sdf.smoothUnion(
      0.012,
      feather(-40, 0.05, 0.02),
      feather(-20, 0.06, 0.022),
      feather(0, 0.066, 0.024),
      feather(20, 0.06, 0.022),
      feather(40, 0.05, 0.02),
      sdf.sphere(0.03).at(0, 0.322, 0.0),
    );
    k.body('plume', hatPose(plume).bone('head'), { color: C.plume, roughness: 0.9, detail: 0.004 });

    // ------------------------------------------------------------------ gray hair: a close cap, temple locks, nape lobes, a braid
    const onHead = (azDeg: number, y: number, out: number): [number, number, number] => {
      const a = (azDeg * Math.PI) / 180;
      const e = Math.sqrt(Math.max(0, 1 - (y / 0.2) ** 2));
      return [(0.205 * e + out) * Math.sin(a), y, (0.19 * e + out) * Math.cos(a)];
    };
    const lock = (az: number, y0: number, len: number, r: number) =>
      sdf.chain(
        [
          [...onHead(az, y0, 0.006), r],
          [...onHead(az, y0 - len * 0.5, 0.012), r * 0.95],
          [...onHead(az, y0 - len, 0.01), r * 0.7],
        ],
        0.01,
      );
    const hairShell = sdf.ellipsoid([0.212, 0.206, 0.197]);
    const capBack = hairShell.smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], 0.06)).smoothIntersect(0.03, sdf.halfSpace([0, 0, 1], -0.02));
    const tips = sdf.union(
      ...[-78, -58, -38, -19, 0, 19, 38, 58, 78].map((a) => sdf.sphere(0.034).at(0.18 * Math.sin((a * Math.PI) / 180), -0.05, -0.16 * Math.cos((a * Math.PI) / 180))),
    );
    const temple = sdf.union(lock(62, 0.07, 0.15, 0.021), lock(76, 0.075, 0.17, 0.022), lock(90, 0.07, 0.15, 0.021), lock(104, 0.06, 0.12, 0.02)).mirror('x', 0);
    const hairBack = hairPose(sdf.smoothUnion(0.015, capBack, tips, temple)).bone('head');
    k.body('hair', hairBack, { color: hairColor, roughness: 0.6, detail: 0.005 });
    // The braid hangs from the nape down the back, over the right shoulder blade: knotted lobes, a ribbon.
    const braidPts: Array<[number, number, number, number]> = [
      [-0.05, 0.57, -0.168, 0.034],
      [-0.06, 0.52, -0.168, 0.032],
      [-0.065, 0.475, -0.165, 0.03],
      [-0.07, 0.43, -0.158, 0.028],
      [-0.072, 0.39, -0.15, 0.026],
      [-0.074, 0.355, -0.142, 0.022],
    ];
    const braid = sdf.union(...braidPts.map(([x, y, z, r]) => sdf.ellipsoid([r, r * 1.15, r]).at(x, y, z)), sdf.chain(braidPts, 0.012));
    k.body('braid', braid.bone('chest'), { color: hairColor, roughness: 0.6, detail: 0.004 });
    k.body('ribbon', sdf.torus(0.022, 0.008).rotateX(90).at(-0.074, 0.345, -0.142).bone('chest'), { color: '#2a2428', roughness: 0.8, detail: 0.003 });

    // ------------------------------------------------------------------ the red coat: torso, flared tails, long sleeves, an open front
    const coatTorso = h.torso.round(0.012);
    const tailsOuter = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.3],
            [0.134, 0.3],
            [0.15, 0.25],
            [0.168, 0.2],
            [0.182, 0.15],
            [0.19, 0.112],
            [0.19, 0.1],
            [0, 0.1],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.82]);
    const notch = sdf.box([0.1, 0.34, 0.4], 0.01).at(0, 0.33, 0.21).intersect(sdf.halfSpace([0, -1, 0], -0.12));
    // Review 3: the tails reach the knees, and the front is cut away below the waist to show the breeches.
    const cutaway = sdf.box([0.25, 0.2, 0.4], 0.03).at(0, 0.13, 0.2);
    const coatBody = sdf.smoothUnion(0.01, coatTorso, tailsOuter).subtract(notch.intersect(sdf.halfSpace([0, 1, 0], 0.43))).smoothSubtract(0.01, cutaway);
    const sleeve = h.perArm((j) =>
      sdf.smoothUnion(
        0.015,
        sdf.cone(lerp(SHOULDER, j.ELBOW, -0.12), j.ELBOW, 0.048, 0.044).bone('upperarm.L'),
        sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.8), 0.044, 0.04).bone('forearm.L'),
      ),
    );
    const edge = sdf.box([0.012, 0.4, 0.5]).at(0.05, 0.3, 0.2).mirror('x', 0);
    const coat = sdf
      .smoothUnion(0.012, h.weighted(coatBody), sleeve)
      .paintWhere(edge, C.trim, 0.002)
      .paintWhere(h.band(0.09, 0.118), C.trim, 0.002);
    k.body('coat', coat, { color: coatColor, roughness: 0.85, detail: 0.005 });
    // A standing collar around the neck, in red; the black stock sits inside it.
    k.body('collar', sdf.torus(0.08, 0.019).scale([1, 1, 0.9]).at(0, 0.428, -0.012).bone('chest'), { color: coatColor, roughness: 0.85, detail: 0.004 });
    k.body('stock', sdf.torus(0.076, 0.026).scale([1, 1, 0.95]).at(0, 0.45, 0.0).bone('chest'), { color: C.black, roughness: 0.8, detail: 0.004 });

    // ------------------------------------------------------------------ the white vest and the filler between the coat tails
    const vestBody = sdf
      .smoothUnion(0.01, h.torso.round(0.007), tailsOuter.round(-0.014))
      .intersect(sdf.box([0.13, 0.26, 0.5]).at(0, 0.35, 0.2));
    k.body('vest', h.weighted(vestBody), { color: C.white, roughness: 0.85, detail: 0.004 });
    // The breeches top: covers the waist between the short vest and the legs.
    k.body('breeches', h.weighted(h.torso.round(0.004).intersect(h.band(0.15, 0.24))), { color: '#eadfc4', roughness: 0.85, detail: 0.005 });
    // White cuffs on both sleeves (a dark band at the wrist), and the white trousers come from the kind.
    const cuff = h.perArm((j) => sdf.cone(lerp(j.ELBOW, j.WRIST, 0.7), lerp(j.ELBOW, j.WRIST, 1.0), 0.047, 0.047).round(0.003).bone('forearm.L'));
    k.body('cuffs', cuff, { color: C.white, roughness: 0.85, detail: 0.004 });

    // ------------------------------------------------------------------ the blue sash across the chest
    const sashSlab = sdf.box([0.7, 0.062, 0.7]).rotateZ(40).at(0.005, 0.34, 0);
    // Front only (review 3: a piece showed on the back near the hem).
    const sashShell = h.torso.round(0.02).subtract(h.torso.round(0.008)).intersect(sashSlab).intersect(sdf.halfSpace([0, 0, -1], -0.01));
    k.body('sash', h.weighted(sashShell), { color: C.sash, roughness: 0.7, detail: 0.004 });

    // ------------------------------------------------------------------ gold: epaulettes with fringe, buttons, a knot, medals
    const epaulette = h.perArm(() =>
      sdf.smoothUnion(
        0.006,
        sdf.ellipsoid([0.062, 0.03, 0.056]).rotateZ(-24).at(0.14, 0.425, 0),
        ...[-0.04, -0.02, 0, 0.02, 0.04].map((dz) => sdf.capsule([0.178, 0.41, dz], [0.186, 0.392, dz], 0.006)),
      ).bone('upperarm.L'),
    );
    const vestZ = (y: number) => sdf.raycast(h.torso.round(0.007), [0, y, 1], [0, 0, -1])?.[2] ?? 0.1;
    const buttons = sdf.union(...[0.205, 0.255, 0.305].map((y) => sdf.sphere(0.014).at(0, y, vestZ(y) + 0.004)));
    const knotZ = sdf.raycast(h.torso.round(0.02), [0.04, 0.31, 1], [0, 0, -1])?.[2] ?? 0.1;
    const knot = sdf.smoothUnion(
      0.004,
      sdf.ellipsoid([0.026, 0.014, 0.01]).rotateZ(30).at(0.065, 0.335, knotZ + 0.002),
      sdf.ellipsoid([0.026, 0.014, 0.01]).rotateZ(-30).at(0.015, 0.325, knotZ + 0.002),
      sdf.sphere(0.012).at(0.04, 0.33, knotZ + 0.004),
    );
    k.body('gold', sdf.union(epaulette, buttons.bone('chest'), knot.bone('chest')), { color: C.gold, roughness: 0.4, metalness: 0.7, detail: 0.003 });
    const medalAt = (x: number, y: number, c: string) => {
      const z = sdf.raycast(coatTorso, [x, y, 1], [0, 0, -1])?.[2] ?? 0.1;
      return { shape: sdf.cylinder(0.016, 0.008, 0.003).rotateX(90).at(x, y, z + 0.003), c };
    };
    const medals = [medalAt(-0.095, 0.385, C.gold), medalAt(-0.062, 0.39, C.silver), medalAt(-0.03, 0.395, C.gold)];
    k.body('medals', sdf.union(...medals.map((m) => m.shape)).bone('chest').paintWhere(medals[1]!.shape, C.silver, 0.001), {
      color: C.gold,
      roughness: 0.35,
      metalness: 0.8,
      detail: 0.003,
    });

    // ------------------------------------------------------------------ tall black boots with folded cuffs
    const bootShape = sdf
      .smoothUnion(
        0.025,
        sdf.ellipsoid([0.058, 0.046, 0.104]).at(0, 0.044, 0.044),
        sdf.cylinder(0.054, 0.11, 0.014).at(0, 0.055, 0),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const sole = bootShape.round(0.004).intersect(sdf.halfSpace([0, 1, 0], 0.014)).intersect(sdf.halfSpace([0, -1, 0], 0));
    const boot = sdf.union(bootShape, sole.paint('#1a1416')).rotateY(8).at(ANKLE[0], 0, 0).bone('foot.L');
    const fold = sdf.cylinder(0.062, 0.03, 0.012).at(0, 0.112, 0).rotateY(8).at(ANKLE[0], 0, 0).bone('shin.L');
    k.body('boots', pair(boot), { color: C.black, roughness: 0.5, detail: 0.005 });
    k.body('boot-folds', pair(fold), { color: '#3a3236', roughness: 0.55, detail: 0.004 });

    // ------------------------------------------------------------------ the brass telescope in the right fist
    // Built at the posed grip (x < 0), pointing out to the right and forward and a little up.
    const g = h.arms.R.GRIP;
    const dirV = [-0.82, 0.26, 0.5];
    const dl = Math.hypot(...dirV);
    const d = dirV.map((v) => v / dl) as [number, number, number];
    const at = (t: number): [number, number, number] => [-g[0] + d[0] * t, g[1] + d[1] * t, g[2] + d[2] * t];
    // One straight tapered tube, 0.22 m long: the eyepiece end at t = -0.08, the wide end at t = 0.14.
    const t0 = -0.08;
    const t1 = 0.14;
    const rad = (t: number) => 0.016 + ((t - t0) / (t1 - t0)) * 0.012;
    const tube = sdf.cone(at(t0), at(t1), rad(t0), rad(t1)).round(0.002);
    // Review 3: a brass tube (the two dark rings read as stripes), a wide flared end, and one dark grip band.
    const flare = sdf.cone(at(t1 - 0.01), at(t1 + 0.012), rad(t1), rad(t1) + 0.011).round(0.002);
    const lip = sdf.cone(at(t1 + 0.01), at(t1 + 0.018), rad(t1) + 0.011, rad(t1) + 0.011).round(0.002);
    const mouth = sdf.cone(at(t1 + 0.004), at(t1 + 0.04), rad(t1) + 0.003, rad(t1) + 0.003);
    const eyeLip = sdf.cone(at(t0 - 0.004), at(t0 + 0.008), rad(t0) + 0.004, rad(t0) + 0.004).round(0.002);
    k.body('telescope', sdf.smoothUnion(0.003, tube, flare, lip, eyeLip).smoothSubtract(0.002, mouth), { color: C.brass, roughness: 0.35, metalness: 0.8, bone: 'knife.R', detail: 0.003 });
    const grip = sdf.cone(at(-0.03), at(0.03), rad(-0.03) + 0.003, rad(0.03) + 0.003).round(0.002);
    k.body('scope-grip', grip, { color: '#2a2220', roughness: 0.6, bone: 'knife.R', detail: 0.003 });
    // A dark lens deep in the wide end.
    k.body('lens', sdf.cone(at(t1 - 0.002), at(t1 + 0.006), rad(t1) + 0.002, rad(t1) + 0.002), { color: '#10181a', roughness: 0.12, bone: 'knife.R', detail: 0.003 });
  },
});
