import { profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Librarian — Chibi Quest settlement NPC (catalog `npcs/settlement/librarian`), about 0.95 m to the
 * top of the hair bun, faces +Z. Target: docs/npc-mockups/librarian_001.jpg. Built on the humanoid kind.
 *
 * Role: a town NPC (the library), seen in 3D and as a 128 px sprite; the half-moon glasses, the silver
 *   bun, and the tall stack of books must read.
 * One idea: a kind older woman with gold half-moon glasses who hugs a stack of four old books.
 * Shape language: round and soft (bun, curls, cardigan), with the stack of books as the one hard form.
 * Palette (60/30/10): gray-blue cardigan #6a7a9a and dark green skirt #2f4a3a; cream blouse #f0ead8 and
 *   silver hair #c8c4cc; gold glasses #c8a040; books red #a03a3a, blue #3a5a9a, green #3f6a44, brown #7a4a2c.
 * Value plan: the light hair and face over the mid cardigan; the dark skirt grounds it; the gold
 *   glasses and the colored books are the accents.
 * Bodies: skin, hair, bun, glasses, chain, blouse, lace, cardigan, cuffs, skirt, books, pages.
 * Rig: the humanoid kind's skeleton and clips with a two-hand `hold`: the fists on the sides of the
 *   stack in the rest pose and in every clip. The books are rigid on `hand.R`.
 */

// The two-hand hold (left arm; the right mirrors it): elbows bent, the fists on the sides of the stack.
const HOLD_ELBOW = [0.165, 0.33, 0.03] as const;
const HOLD_WRIST = [0.13, 0.32, 0.16] as const;
// The stack: center x, center z, the width and depth of the books, and the bottom height.
const STACK = { z: 0.205, d: 0.15, y0: 0.2 };

const C = {
  hair: '#a4a6aa',
  frame: '#2c2428',
  gold: '#c8a040',
  blouse: '#f0ead8',
  lace: '#fbf6ee',
  skirt: '#2f4a3a',
  skirtTrim: '#243a2e',
  stocking: '#4a4650',
  shoe: '#5a3a24',
  pages: '#f1e6c8',
  pocket: '#7c9a8c',
};

const BOOKS = [
  { color: '#6a4228', w: 0.214, h: 0.054, yaw: 2, dx: 0.002 },
  { color: '#d98e2c', w: 0.2, h: 0.05, yaw: -3, dx: -0.004 },
  { color: '#b3402e', w: 0.208, h: 0.056, yaw: 3, dx: 0.004 },
  { color: '#8a5a34', w: 0.196, h: 0.054, yaw: -2, dx: -0.002 },
] as const;

export default humanoidAsset({
  name: 'librarian',
  description: 'A kind older librarian with gold half-moon glasses and a gray-blue cardigan, carrying a tall stack of books.',
  reference: 'docs/npc-mockups/librarian_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { silver: '#a4a6aa', white: '#f0ece4', brown: '#5a301d', auburn: '#8e3b1c' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { sage: '#9db3a8', bluegray: '#6a7a9a', heather: '#8a6a86', fawn: '#a08a68' },
  },
  presets: {
    archivist: { skin: 'tan', hair: 'white', eyes: 'hazel', cloth: 'heather' },
  },
  hair: false,
  undershirt: false,
  pants: C.stocking,
  shoes: C.shoe,
  lashes: false,
  hold: { elbow: HOLD_ELBOW, wrist: HOLD_WRIST },

  // A gentle smile: the kind's smile stays; the brows are thinner, higher, and rounder.
  paintSkin(skin, h) {
    const oldBrows = sdf.extrude(profile.arc(0.1, 0.036, 54, 126), 0.3).at(0.1, 0.622, 0.1).mirror('x');
    const brows = sdf.extrude(profile.arc(0.07, 0.011, 56, 124), 0.3).at(0.1, 0.664, 0.1).mirror('x');
    return skin.paintWhere(oldBrows, h.tint.skin!, 0.002).paintWhere(brows, h.tint.brow!, 0.002);
  },

  extra(k, h) {
    const { SHOULDER, ELBOW, WRIST, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];
    const hairColor = k.tint('hair');
    const cardigan = h.tint.shirt ?? '#9db3a8';
    const trim = k.tint('cloth', { color: C.pocket, follow: 1 });

    // ------------------------------------------------------------------ hair: a small cap, swept locks, temple curls, a bun
    const headPose = (s: sdf.Shape) => s.at(0, HEAD_Y, 0);
    const faceMask = sdf.ellipsoid([0.15, 0.135, 0.12]).at(0, -0.068, 0.175);
    const lowCut = sdf.halfSpace([0, -1, 0.586], 0.06 / 1.159);
    const earCut = pair(sdf.ellipsoid([0.05, 0.06, 0.05]).at(0.2, -0.065, -0.01));
    const cap = sdf.ellipsoid([0.209, 0.203, 0.194]).smoothIntersect(0.03, lowCut).smoothSubtract(0.03, faceMask, earCut);
    // A lock follows the skull from (azimuth, elevation) to (azimuth, elevation), degrees, lifted off it.
    const rad = Math.PI / 180;
    const onSkull = (az: number, el: number, lift: number): [number, number, number] => [
      (0.205 + lift) * Math.cos(el * rad) * Math.sin(az * rad),
      (0.2 + lift) * Math.sin(el * rad),
      (0.19 + lift) * Math.cos(el * rad) * Math.cos(az * rad),
    ];
    const lock = (az0: number, el0: number, az1: number, el1: number, r: number) =>
      sdf.chain(
        [0, 0.33, 0.66, 1].map((t) => {
          const [x, y, z] = onSkull(az0 + (az1 - az0) * t, el0 + (el1 - el0) * t, r * 0.55);
          return [x, y, z, r * (1 - 0.22 * t)] as [number, number, number, number];
        }),
        0.012,
      );
    const locks = pair(
      sdf.union(
        lock(8, 64, 72, 42, 0.03),
        lock(3, 72, 48, 60, 0.028),
        lock(16, 54, 88, 26, 0.027),
        lock(22, 68, 102, 50, 0.028),
        lock(42, 74, 122, 58, 0.028),
        lock(62, 64, 138, 42, 0.03),
        lock(92, 52, 150, 26, 0.03),
        lock(112, 32, 160, -8, 0.03),
        lock(132, 52, 172, 12, 0.03),
      ),
    );
    // Curls that frame the face: a stack of three puffs at each temple, down to the ear.
    const curls = pair(
      sdf.smoothUnion(
        0.015,
        sdf.sphere(0.036).at(0.176, 0.045, 0.055),
        sdf.sphere(0.034).at(0.19, -0.002, 0.04),
        sdf.sphere(0.031).at(0.186, -0.048, 0.03),
      ),
    );
    // The bun: a round knot at the back of the crown, wrapped with three coils.
    const coils = [-1, 0, 1].map((i) =>
      sdf.chain(
        [
          [-0.07, 0.15 + i * 0.03, -0.14, 0.018],
          [-0.03, 0.2 + i * 0.03, -0.19, 0.02],
          [0.03, 0.2 + i * 0.03, -0.19, 0.02],
          [0.07, 0.15 + i * 0.03, -0.14, 0.018],
        ],
        0.012,
      ),
    );
    const bun = sdf.smoothUnion(0.012, sdf.sphere(0.075).at(0, 0.19, -0.13), ...coils);
    const hairShape = headPose(sdf.smoothUnion(0.012, cap, locks, curls, bun)).bone('head');
    k.body('hair', hairShape, { color: hairColor, roughness: 0.6, detail: 0.005 });

    // ------------------------------------------------------------------ round dark glasses (the mockup), off the skin
    const GL = 0.016; // the frame stands this far off the face
    const surf = (x: number, y: number, lift = GL): [number, number, number] => [x, y, h.faceZ(Math.min(Math.abs(x), 0.165), y) + lift];
    const ring = (side: 1 | -1) => {
      const cx = 0.105 * side;
      const pts: [number, number, number, number][] = [];
      for (let a = 0; a <= 360; a += 20) {
        const t = (a * Math.PI) / 180;
        const [x, y, z] = surf(cx + 0.074 * Math.cos(t), 0.632 + 0.078 * Math.sin(t));
        pts.push([x, y, z, 0.0085]);
      }
      return sdf.chain(pts, 0.004);
    };
    const bridge = sdf.chain(
      [-0.035, -0.012, 0.012, 0.035].map((x) => {
        const [px, py, pz] = surf(x, 0.655, GL + 0.004);
        return [px, py, pz, 0.0075] as [number, number, number, number];
      }),
      0.005,
    );
    const arm = pair(
      sdf.chain(
        [
          [0.179, 0.64, h.faceZ(0.165, 0.64) + GL - 0.004, 0.0065],
          [0.2, 0.64, 0.06, 0.0065],
          [0.215, 0.64, 0.0, 0.0065],
          [0.208, 0.63, -0.01, 0.0065],
        ],
        0.005,
      ),
    );
    k.body('glasses', sdf.smoothUnion(0.004, ring(1), ring(-1), bridge, arm).bone('head'), {
      color: C.frame,
      roughness: 0.4,
      metalness: 0.2,
      detail: 0.0035,
    });
    // The chain: from each temple arm down past the neck to a loop on the chest.
    const strand = pair(
      sdf.chain(
        [
          [0.208, 0.63, -0.012, 0.0045],
          [0.15, 0.56, -0.01, 0.0045],
          [0.1, 0.5, 0.02, 0.0045],
          [0.082, 0.455, 0.07, 0.0045],
          [0.06, 0.425, 0.098, 0.0045],
          [0.025, 0.405, 0.112, 0.0045],
        ],
        0.004,
      ),
    );
    k.body('chain', sdf.smoothUnion(0.004, strand).bone('neck'), { color: C.gold, roughness: 0.35, metalness: 0.75, detail: 0.003 });

    // ------------------------------------------------------------------ blouse: the torso, a collar, and a lace ruff
    const blouse = h.weighted(h.torso.round(0.004).smoothIntersect(0.01, h.band(0.152, 0.47)));
    k.body('blouse', blouse, { color: C.blouse, roughness: 0.85, detail: 0.005 });
    const ruffPts = Array.from({ length: 16 }, (_, i) => {
      const a = (i / 16) * Math.PI * 2;
      return sdf.sphere(0.0125).at(0.07 * Math.sin(a), 0.452, -0.012 + 0.066 * Math.cos(a));
    });
    const lace = sdf.smoothUnion(0.006, sdf.torus(0.064, 0.015).scale([1, 1, 0.96]).at(0, 0.452, -0.012), ...ruffPts);
    k.body('lace', lace.bone('chest'), { color: C.lace, roughness: 0.9, detail: 0.004 });

    // ------------------------------------------------------------------ the long open coat (the mockup): sleeves, lapels, a front opening
    const flare = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.32],
            [0.14, 0.32],
            [0.155, 0.26],
            [0.172, 0.2],
            [0.192, 0.16],
            [0.2, 0.15],
            [0, 0.15],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.9]);
    const sleeve = h.perArm((j) =>
      sdf.smoothUnion(
        0.015,
        sdf.cone(lerp(SHOULDER, j.ELBOW, -0.1), j.ELBOW, 0.049, 0.045).bone('upperarm.L'),
        sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.84), 0.045, 0.043).bone('forearm.L'),
      ),
    );
    const cuffs = h.perArm((j) => sdf.cone(lerp(j.ELBOW, j.WRIST, 0.66), lerp(j.ELBOW, j.WRIST, 0.86), 0.0475, 0.0485).round(0.002).bone('forearm.L'));
    const bodyCard = h.torso.round(0.013).smoothIntersect(0.01, h.band(0.185, 0.485));
    const opening = sdf
      .extrude(
        profile.polygon([
          [-0.052, 0.5],
          [0.052, 0.5],
          [0.05, 0.12],
          [-0.05, 0.12],
        ]),
        0.3,
      )
      .at(0, 0, 0.17);
    const lapel = pair(sdf.ellipsoid([0.034, 0.05, 0.02]).rotateZ(-22).at(0.065, 0.435, 0.085).bone('chest'));
    const collar = sdf.torus(0.082, 0.02).scale([1, 1, 0.9]).at(0, 0.442, -0.014).bone('chest');
    const pocket = pair(sdf.box([0.05, 0.05, 0.03], 0.012).rotateY(-18).rotateZ(-6).at(0.166, 0.195, 0.1).bone('hips'));
    const coatShape = sdf
      .smoothUnion(0.02, h.weighted(bodyCard), h.weighted(flare), sleeve)
      .smoothSubtract(0.01, opening)
      .smoothUnion(0.012, lapel, collar)
      .paintWhere(h.band(0.15, 0.168), trim, 0.004);
    k.body('coat', sdf.smoothUnion(0.006, coatShape, pocket), {
      color: cardigan,
      roughness: 0.92,
      detail: 0.005,
      bump: (x, y, z) => 0.0012 * Math.sin((x + 1.3 * y + z) * 150),
    });
    k.body('cuffs', cuffs, { color: trim, roughness: 0.9, detail: 0.004 });

    // ------------------------------------------------------------------ the long dark green skirt
    const skirtShape = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.3],
            [0.13, 0.3],
            [0.14, 0.255],
            [0.158, 0.2],
            [0.182, 0.15],
            [0.205, 0.075],
            [0, 0.075],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.9]);
    k.body('skirt', h.weighted(skirtShape).paintWhere(h.band(0.075, 0.093), C.skirtTrim, 0.004), {
      color: C.skirt,
      roughness: 0.9,
      detail: 0.005,
      bump: (x, y, z) => 0.002 * Math.sin(Math.atan2(x, z) * 36) * (0.6 + 0.4 * y),
    });

    // ------------------------------------------------------------------ the stack of four books between the fists
    const covers: sdf.Shape[] = [];
    const pages: sdf.Shape[] = [];
    let y = STACK.y0;
    for (const b of BOOKS) {
      const cy = y + b.h / 2;
      const place = (s: sdf.Shape) => s.rotateY(b.yaw).at(b.dx, cy, STACK.z);
      const cover = sdf.box([b.w, b.h, STACK.d], 0.008);
      // The cover boards and the spine in the book's color.
      const spine = sdf.box([b.w, b.h, 0.022], 0.007).at(0, 0, STACK.d / 2 - 0.011);
      const bands = sdf.union(...[-0.06, -0.02, 0.02, 0.06].map((x) => sdf.box([0.01, b.h + 0.01, 0.05], 0.002).at(x, 0, STACK.d / 2)));
      const boards = sdf.union(sdf.box([b.w, 0.012, STACK.d], 0.005).at(0, b.h / 2 - 0.006, 0), sdf.box([b.w, 0.012, STACK.d], 0.005).at(0, -b.h / 2 + 0.006, 0), spine);
      void cover;
      covers.push(place(boards.paintWhere(bands, C.gold, 0.002).paint(b.color)));
      pages.push(place(sdf.box([b.w + 0.016, b.h - 0.014, STACK.d - 0.01], 0.003).at(0, 0, -0.012)));
      y += b.h + 0.001;
    }
    k.body('books', sdf.union(...covers).bone('hand.R'), { color: BOOKS[0].color, roughness: 0.7, detail: 0.003 });
    k.body('pages', sdf.union(...pages).bone('hand.R'), { color: C.pages, roughness: 0.9, detail: 0.003 });
    void WRIST;
    void ELBOW;
  },
});
