import { noise, profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Elf citizen - Chibi Quest NPC (catalog `npcs/fantasy-peoples/elf-citizen`), about 1.0 m to the top
 * of the hair crest, faces +Z. Target: docs/npc-mockups/elf-citizen_001.jpg. Built on the humanoid kind.
 *
 * Role: a moon-garden keeper of the elf glade who gives nature errands, seen in 3D and as a 128 px
 *   sprite; the long pointed ears, the silver hair, and the glowing blue bell lantern must read.
 * One idea: a gentle elf girl in a leaf-green tunic dress with wide sleeves, holding a big glowing
 *   bell flower up beside her head like a lantern.
 * Shape language: round and soft (hair locks, sleeves, bell), with the pointed ears and leaves as
 *   the secondary sharp forms.
 * Palette (60/30/10): leaf green #3f6a44 (dress) with cream leaves #ece0c8; silver-blond #e6dcb0
 *   (hair); browns #6b4a2c (vine belt) and #7a5a3a (boots); accent glowing blue #7ab8f0 (bell).
 * Value plan: the pale hair frames the face; the dark green dress carries the light bell and the
 *   cream leaves; the bell is the brightest, most saturated part.
 * Bodies: skin, ears, hair (locks), crest, circlet, dress, belt, boots, stem, bell.
 * Rig: the humanoid kind's skeleton and clips; the right arm is posed up (lantern) and keeps its
 *   pose in every clip; the stem and the bell are rigid on knife.R.
 */

const C = {
  leaf: '#ece0c8',
  belt: '#6b4a2c',
  boot: '#7a5a3a',
  circlet: '#c8ccd4',
  stem: '#4a6a3a',
  bell: '#7ab8f0',
  bellRim: '#bfe4ff',
  clapper: '#e6f4ff',
};

// The right fist is raised beside the head; the left arm hangs and keeps the clip motion.
const POSE_R = { elbow: [0.2, 0.34, 0.02], wrist: [0.25, 0.42, 0.07] } as const;

export default humanoidAsset({
  name: 'elf-citizen',
  description: 'A gentle elf of the moon gardens in a leaf-green tunic dress, with long silver hair, holding up a glowing blue bell flower.',
  reference: 'docs/npc-mockups/elf-citizen_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { platinum: '#e6dcb0', silver: '#b8b4c4', blond: '#c4974a', brown: '#5a301d', black: '#231a17', auburn: '#8e3b1c', teal: '#2f6f6a' },
    eyes: { hazel: '#8a6a2a', brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', violet: '#6a4a9a' },
    cloth: { leaf: '#3f6a44', dusk: '#4a6a8a', plum: '#7a5070', ochre: '#a8803a' },
  },
  presets: {
    glade: { skin: 'fair', hair: 'platinum', eyes: 'hazel', cloth: 'leaf' },
    moon: { skin: 'light', hair: 'silver', eyes: 'violet', cloth: 'dusk' },
  },
  hair: false,
  undershirt: false,
  pants: false,
  shoes: C.boot,
  pose: { R: POSE_R },

  extra(k, h) {
    const { SHOULDER, ELBOW, HEAD_Y, ANKLE } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const rad = Math.PI / 180;
    type P4 = [number, number, number, number];
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];
    const hairColor = k.tint('hair');
    const skinColor = h.tint.skin ?? '#f2c7a4';
    const clothColor = h.tint.shirt ?? '#3f6a44';
    const headPose = (s: sdf.Shape) => s.at(0, HEAD_Y, 0);

    // A point on the head surface at an angle around Y (0 = front, 90 = the left side, 180 = back).
    const surf = (aDeg: number, y: number, lift = 0): [number, number, number] => {
      const a = aDeg * rad;
      const hit = sdf.raycast(h.head, [0.6 * Math.sin(a), y, 0.6 * Math.cos(a)], [-Math.sin(a), 0, -Math.cos(a)]);
      const p = hit ?? [0.2 * Math.sin(a), y, 0.19 * Math.cos(a)];
      return [p[0]! + lift * Math.sin(a), y, p[2]! + lift * Math.cos(a)];
    };

    // ------------------------------------------------------------------ long pointed ears (skin tint)
    const earShell = sdf
      .smoothUnion(
        0.01,
        sdf.cone([0, 0, 0], [0.105, 0.075, -0.035], 0.034, 0.006),
        sdf.ellipsoid([0.026, 0.04, 0.03]).at(-0.004, -0.004, 0),
      )
      .scale([1, 1, 0.5])
      .at(0.19, 0.598, -0.008)
      .bone('head');
    k.body('ears', pair(earShell), { color: skinColor, roughness: 0.55, detail: 0.004 });

    // ------------------------------------------------------------------ hair: a cap, a parted fringe, and long locks
    const lock = (pts: P4[], kk = 0.012) => sdf.chain(pts, kk);
    const onFace = (x: number, y: number, dz: number, r: number): P4 => [x, y, h.faceZ(x, y) + dz, r];
    const hairCap = sdf
      .ellipsoid([0.217, 0.212, 0.2])
      .smoothIntersect(0.02, sdf.halfSpace([0, 0, 1], 0.14))
      .smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], 0.09))
      .smoothSubtract(0.025, sdf.ellipsoid([0.165, 0.19, 0.13]).at(0, -0.075, 0.115))
      .smoothSubtract(0.02, sdf.ellipsoid([0.07, 0.075, 0.07]).at(0.215, -0.05, 0.0).mirror('x', 0));
    // The part is at the center: one side swept to each temple.
    const fringeA = lock([
      onFace(0.012, 0.84, 0.024, 0.034),
      onFace(-0.05, 0.828, 0.026, 0.036),
      onFace(-0.115, 0.8, 0.026, 0.034),
      onFace(-0.168, 0.75, 0.02, 0.032),
      onFace(-0.19, 0.7, 0.008, 0.03),
    ], 0.014);
    const fringeB = lock([
      onFace(-0.012, 0.84, 0.024, 0.034),
      onFace(0.05, 0.828, 0.026, 0.036),
      onFace(0.115, 0.8, 0.026, 0.034),
      onFace(0.168, 0.75, 0.02, 0.032),
      onFace(0.19, 0.7, 0.008, 0.03),
    ], 0.014);

    // The long locks: they leave the head behind the ears and fall behind the shoulders to the waist.
    const angles = [108, 126, 144, 162, 180, 198, 216, 234, 252];
    const longLocks = angles.map((a, i) => {
      const s = Math.sin(a * rad);
      const c = Math.cos(a * rad);
      const w = i % 2 === 0 ? 1 : 0.94;
      const p0 = surf(a, 0.735, 0.004);
      const p1 = surf(a, 0.62, 0.014);
      return lock(
        [
          [p0[0], p0[1], p0[2], 0.034],
          [p1[0], p1[1], p1[2], 0.036],
          [0.125 * s * w, 0.47, -0.075 + 0.04 * c, 0.03],
          [0.118 * s * w, 0.38, -0.145 + 0.012 * c, 0.027],
          [0.115 * s, 0.31, -0.155 + 0.01 * c, 0.022],
          [0.112 * s, 0.27 + 0.015 * (i % 3), -0.155 + 0.01 * c, 0.012],
        ],
        0.014,
      );
    });
    const crestA = lock([
      [0.0, 0.855, 0.045, 0.036],
      [-0.014, 0.9, 0.05, 0.03],
      [0.008, 0.943, 0.052, 0.022],
      [0.05, 0.968, 0.046, 0.011],
    ], 0.012);
    const crestB = lock([
      [0.04, 0.855, 0.0, 0.032],
      [0.07, 0.9, 0.002, 0.026],
      [0.105, 0.93, 0.012, 0.018],
      [0.135, 0.935, 0.025, 0.01],
    ], 0.01);
    const hairShape = sdf.union(sdf.smoothUnion(0.02, headPose(hairCap), fringeA, fringeB, crestA, crestB), ...longLocks);
    k.body('hair', hairShape.bone('head'), {
      color: hairColor,
      roughness: 0.55,
      detail: 0.005,
      bump: (x, y, z) => 0.0025 * noise.fbm(x * 40, y * 30, z * 40, 2) + 0.003 * Math.sin(x * 160),
    });

    // ------------------------------------------------------------------ circlet with a leaf (on the hair surface)
    const ringPts: P4[] = [];
    for (let th = -100; th <= 100; th += 20) {
      const f = Math.abs(th) / 100;
      const y = HEAD_Y + 0.2 * Math.sin((44 - 26 * f * f) * rad);
      const a = th * rad;
      const hit = sdf.raycast(hairShape, [0.7 * Math.sin(a), y, 0.7 * Math.cos(a)], [-Math.sin(a), 0, -Math.cos(a)]);
      if (hit) ringPts.push([hit[0] + 0.004 * Math.sin(a), y, hit[2] + 0.004 * Math.cos(a), 0.0075]);
    }
    const frontHit = ringPts.reduce((best, p) => (p[2] > best[2] ? p : best), ringPts[0] ?? ([0, 0.81, 0.17, 0.0075] as P4));
    const leafProfile = profile.polygon(
      [
        [0, -0.012],
        [0.014, 0.004],
        [0.011, 0.024],
        [0, 0.044],
        [-0.011, 0.024],
        [-0.014, 0.004],
      ],
      { smooth: true, samples: 5 },
    );
    const crownLeaf = sdf.extrude(leafProfile, 0.008, 0.003).rotateX(-14).at(frontHit[0], frontHit[1] + 0.006, frontHit[2] + 0.002);
    const circlet = sdf.smoothUnion(0.004, sdf.chain(ringPts, 0.004), crownLeaf).bone('head');
    k.body('circlet', circlet, { color: C.circlet, roughness: 0.35, metalness: 0.8, detail: 0.003 });

    // ------------------------------------------------------------------ dress: bodice, wide sleeves, flared skirt
    const vNeck = sdf.extrude(profile.polygon([[-0.05, 0.5], [0.05, 0.5], [0.0, 0.405]]), 0.6).at(0, 0, 0.3);
    const bodice = h.torso.round(0.016).smoothIntersect(0.01, h.band(0.22, 0.468)).smoothSubtract(0.01, vNeck);
    const sleeveOf = (j: { ELBOW: readonly [number, number, number]; WRIST: readonly [number, number, number] }) => {
      const upper = sdf.cone(lerp(SHOULDER, j.ELBOW, -0.1), j.ELBOW, 0.05, 0.052).bone('upperarm.L');
      const fore = sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.72), 0.054, 0.066).bone('forearm.L');
      return sdf.smoothUnion(0.02, upper, fore);
    };
    const skirtProfile = profile.polygon(
      [
        [0, 0.31],
        [0.13, 0.31],
        [0.14, 0.27],
        [0.158, 0.225],
        [0.19, 0.18],
        [0.212, 0.15],
        [0.222, 0.136],
        [0.216, 0.126],
        [0, 0.126],
      ],
      { smooth: true, samples: 8 },
    );
    const skirtOuter = sdf.revolve(skirtProfile).scale([1, 1, 0.94]);
    const skirt = skirtOuter
      .subtract(skirtOuter.round(-0.02))
      .smoothIntersect(0.01, sdf.halfSpace([0, 1, 0], 0.325));
    // Cream leaves painted on the skirt front (lens shapes pushed through the surface along Z).
    const leafStencil = (x: number, y: number, rot: number, s: number) => sdf.extrude(leafProfile, 0.3).scale(s).rotateZ(rot).at(x, y, 0.17);
    const leaves = sdf.union(
      leafStencil(-0.09, 0.215, 28, 1.3),
      leafStencil(0.07, 0.19, -24, 1.25),
      leafStencil(0.005, 0.235, 4, 1.0),
      leafStencil(0.12, 0.25, -38, 1.0),
      leafStencil(-0.04, 0.165, 18, 1.0),
      leafStencil(-0.14, 0.16, 40, 1.0),
      leafStencil(0.13, 0.155, -30, 0.9),
    );
    const dress = sdf
      .union(h.weighted(bodice), h.perArm((j) => sleeveOf(j)), h.weighted(skirt))
      .paintWhere(leaves, C.leaf, 0.003);
    k.body('dress', dress, {
      color: clothColor,
      roughness: 0.85,
      detail: 0.005,
      bump: (x, y, z) => 0.002 * Math.sin(Math.atan2(x, z) * 14) * (y < 0.3 ? 1 : 0.3),
    });

    // ------------------------------------------------------------------ vine belt, wrapped twice
    const vineA = sdf.torus(0.133, 0.016).scale([1, 1, 0.8]).at(0, 0.268, -0.002);
    const vineB = sdf.torus(0.133, 0.015).scale([1, 1, 0.8]).rotateX(7).rotateZ(-4).at(0, 0.292, -0.002);
    const knot = sdf.ellipsoid([0.03, 0.022, 0.016]).at(0.03, 0.278, 0.112);
    const belt = sdf.smoothUnion(0.008, vineA, vineB, knot);
    k.body('belt', h.weighted(belt), {
      color: C.belt,
      roughness: 0.8,
      detail: 0.004,
      bump: (x, y, z) => 0.004 * Math.sin(Math.atan2(x, z) * 16 + y * 160),
    });

    // ------------------------------------------------------------------ soft boots: a shaft and a rolled cuff
    const shaft = sdf
      .smoothUnion(
        0.008,
        sdf.cone([ANKLE[0], 0.07, 0.0], [ANKLE[0], 0.116, 0.0], 0.046, 0.044),
        sdf.torus(0.045, 0.011).at(ANKLE[0], 0.118, 0.0),
      )
      .bone('shin.L');
    k.body('boots', pair(shaft), { color: C.boot, roughness: 0.75, detail: 0.004 });

    // ------------------------------------------------------------------ the glowing bell flower lantern (right fist)
    const gl = h.arms.R.GRIP;
    const G: [number, number, number] = [-gl[0], gl[1], gl[2]];
    const at = (x: number, y: number, z: number, r: number): P4 => [G[0] + x, G[1] + y, G[2] + z, r];
    const stem = sdf.smoothUnion(
      0.006,
      sdf.chain(
        [
          at(-0.05, -0.12, 0.02, 0.006),
          at(-0.04, -0.14, 0.0, 0.007),
          at(-0.012, -0.075, 0.004, 0.008),
          at(0.0, -0.02, 0.0, 0.0095),
          at(-0.004, 0.05, 0.0, 0.0095),
          at(-0.05, 0.14, 0.0, 0.0085),
          at(-0.115, 0.23, 0.0, 0.0085),
        ],
        0.01,
      ),
      sdf.ellipsoid([0.026, 0.006, 0.012]).rotateZ(35).at(G[0] - 0.03, G[1] + 0.08, G[2] + 0.01), // a small stem leaf
    );
    k.body('stem', stem.bone('knife.R'), { color: C.stem, roughness: 0.7, detail: 0.003 });

    const bellOuter = sdf.revolve(
      profile.polygon(
        [
          [0, 0.1],
          [0.022, 0.098],
          [0.04, 0.085],
          [0.05, 0.062],
          [0.058, 0.032],
          [0.07, 0.008],
          [0.074, -0.002],
          [0, -0.002],
        ],
        { smooth: true, samples: 6 },
      ),
    );
    const bellInner = sdf.revolve(
      profile.polygon(
        [
          [0, 0.088],
          [0.018, 0.086],
          [0.034, 0.074],
          [0.042, 0.054],
          [0.049, 0.03],
          [0.06, 0.006],
          [0.062, -0.03],
          [0, -0.03],
        ],
        { smooth: true, samples: 6 },
      ),
    );
    const bellShell = bellOuter
      .subtract(bellInner)
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.016).intersect(sdf.box([0.3, 0.3, 0.3]).at(0, 0, 0)), C.bellRim, 0.01);
    // The bell hangs from the stem tip, tilted a little; the clapper hangs inside it.
    const bellAt = (s: sdf.Shape) => s.scale(1.35).rotateZ(-7).at(G[0] - 0.115, G[1] + 0.23 - 0.135, G[2]);
    k.body('bell', bellAt(bellShell), { color: C.bell, roughness: 0.3, emissive: C.bell, emissiveIntensity: 0.6, detail: 0.004, bone: 'knife.R' });
    const clapper = sdf.smoothUnion(0.004, sdf.capsule([0, 0.092, 0], [0, 0.03, 0], 0.005), sdf.sphere(0.016).at(0, 0.016, 0));
    k.body('clapper', bellAt(clapper), { color: C.clapper, roughness: 0.3, emissive: C.clapper, emissiveIntensity: 0.7, detail: 0.003, bone: 'knife.R' });
  },
});
