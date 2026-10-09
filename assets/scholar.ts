import { profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Scholar — Chibi Quest settlement NPC (catalog `npcs/settlement/scholar`), about 1.0 m to the top of
 * the square cap, faces +Z. Target: docs/npc-mockups/scholar_001.jpg. Built on the humanoid kind.
 *
 * Role: an academy NPC (lore, reading quests), seen in 3D and as a 128 px sprite; the big round
 *   glasses, the square cap with its tassel, and the thick red open book must read.
 * One idea: a bright young scholar peeking over a big red book, in round glasses and a flat square cap.
 * Shape language: round and soft (curls, glasses, face), with the flat cap board and the book as the
 *   two hard forms.
 * Palette (60/30/10): navy #2f3f6a robe, #232a44 cap; skin #8a5a3e, black hair #231a17; book cover
 *   #7a3a2a, pages #f0e6cc; gold #e0b040 (tassel, robe edges, collar) as the accent; shoes #4a3424.
 * Value plan: the dark cap and hair frame the face; the red book is the large mid-value focal block
 *   in front of the navy robe; gold lines lead the eye down the front.
 * Bodies: skin (open smile), glasses, cap, hair, bun, robe, trim, sleeve cuffs, gold, pants, shoes, book.
 * Rig: the humanoid kind's skeleton and clips with a two-hand `hold`; the book is rigid on `hand.R`.
 */

// The two-hand hold (left arm; the right mirrors it): the fists grip the outer edges of the book.
const HOLD_ELBOW = [0.17, 0.315, 0.035] as const;
const HOLD_WRIST = [0.165, 0.31, 0.105] as const;
// The book: the spine center, the width of one cover, the height, and the opening angle of each cover.
const BOOK = { y: 0.318, z: 0.25, w: 0.2, h: 0.17, open: 34, tilt: 6 };

const C = {
  hair: '#231a17',
  glass: '#3a2a22',
  gold: '#e0b040',
  wine: '#4a2430',
  pants: '#232a44',
  shoe: '#4a3424',
  cover: '#7a3a2a',
  coverDark: '#62301f',
  pages: '#f0e6cc',
  pageLine: '#d8c9a4',
  mouth: '#8a2e2a',
  tongue: '#d8706a',
  teeth: '#fbf6ee',
};

export default humanoidAsset({
  name: 'scholar',
  description: 'A bright young scholar in a navy robe, round glasses, and a square cap with a gold tassel, reading a thick red book.',
  reference: 'docs/npc-mockups/scholar_001.jpg',
  variants: {
    skin: { brown: '#8a5a3e', fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', deep: '#5e3b28' },
    hair: { black: '#231a17', brown: '#5a301d', auburn: '#8e3b1c', blond: '#c4974a', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { indigo: '#2f3f6a', plum: '#5e3358', teal: '#2f5a68', burgundy: '#6a2f3f' },
  },
  presets: {
    default: { skin: 'brown', hair: 'black', eyes: 'brown', cloth: 'indigo' },
    sunny: { skin: 'tan', hair: 'brown', eyes: 'green', cloth: 'plum' },
  },
  hair: false,
  undershirt: false,
  pants: C.pants,
  shoes: C.shoe,
  lashes: false,
  hold: { elbow: HOLD_ELBOW, wrist: HOLD_WRIST },

  // An excited open smile with round corners and one tooth band, and thin arched brows above the glasses.
  paintSkin(skin, h) {
    const y = 0.536;
    const grin = profile.polygon(
      [
        [-0.05, 0.014],
        [-0.028, 0.004],
        [0, 0.001],
        [0.028, 0.004],
        [0.05, 0.014],
        [0.042, -0.01],
        [0.021, -0.03],
        [0, -0.035],
        [-0.021, -0.03],
        [-0.042, -0.01],
      ],
      { smooth: true, samples: 6 },
    );
    const mouth = h.onFace(sdf.extrude(grin, 0.3), 0, y);
    const teeth = mouth.intersect(sdf.halfSpace([0, -1, 0], -(y - 0.012))).intersect(sdf.box([0.056, 0.1, 1]).at(0, y, 0));
    const tongue = h.onFace(sdf.ellipsoid([0.022, 0.013, 0.08]), 0, y - 0.028);
    const oldBrows = sdf.extrude(profile.arc(0.1, 0.036, 54, 126), 0.3).at(0.1, 0.622, 0.1).mirror('x');
    const brows = sdf.extrude(profile.arc(0.075, 0.014, 56, 124), 0.3).at(0.1, 0.652, 0.1).mirror('x');
    return skin
      .paintWhere(oldBrows, h.tint.skin!, 0.002)
      .paintWhere(brows, h.tint.brow!, 0.002)
      .paintWhere(mouth, C.mouth)
      .paintWhere(tongue.intersect(mouth), C.tongue, 0.004)
      .paintWhere(teeth, C.teeth, 0.002);
  },

  extra(k, h) {
    const { SHOULDER, HEAD_Y, EYE, ANKLE } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];
    const hairColor = k.tint('hair');
    const clothMain = h.tint.shirt!;
    const capColor = k.tint('cloth', { color: '#232a44', follow: 1 });
    const darkCloth = k.tint('cloth', { color: '#232a44', follow: 1 });
    const D = Math.PI / 180;

    // ------------------------------------------------------------------ glasses: two round rings, a bridge, arms
    // Each ring lies on the face: it turns to the slope of the face surface at the eye.
    const ring = (x: number) => {
      const e = 0.01;
      const dzdx = (h.faceZ(x + e, EYE[1]) - h.faceZ(x - e, EYE[1])) / (2 * e);
      const dzdy = (h.faceZ(x, EYE[1] + e) - h.faceZ(x, EYE[1] - e)) / (2 * e);
      return sdf
        .torus(0.064, 0.0075)
        .rotateX(90)
        .rotateX(Math.atan(dzdy) / D)
        .rotateY(Math.atan2(-dzdx, 1) / D)
        .at(x, EYE[1] + 0.002, h.faceZ(x, EYE[1]) + 0.01);
    };
    const zB = h.faceZ(0.04, 0.64) + 0.012;
    const bridge = sdf.capsule([-0.046, 0.646, zB], [0.046, 0.646, zB], 0.0075);
    const xo = EYE[0] + 0.062;
    const armL = sdf.capsule([xo, 0.636, h.faceZ(xo, 0.636) + 0.006], [0.206, 0.636, 0.0], 0.0075);
    const glasses = sdf.union(sdf.union(ring(EYE[0]), ring(-EYE[0])), bridge, pair(armL)).bone('head');
    k.body('glasses', glasses, { color: C.glass, roughness: 0.45, detail: 0.003 });

    // ------------------------------------------------------------------ hair: a small cap, a fringe of curls, temple curls, a bun
    const headPose = (s: sdf.Shape) => s.at(0, HEAD_Y, 0);
    const hairShell = sdf.ellipsoid([0.211, 0.205, 0.196]);
    const dome = hairShell.intersect(sdf.halfSpace([0, -1, 0], 0.0));
    const nape = hairShell.intersect(sdf.halfSpace([0, -1, 0], 0.07)).intersect(sdf.halfSpace([0, 0, 1], -0.07));
    const faceMask = sdf.box([0.3, 0.17, 0.3], 0.01).at(0, -0.01, 0.19);
    const hairBase = sdf.smoothSubtract(0.02, sdf.smoothUnion(0.03, dome, nape), faceMask);
    // Curls across the forehead, sitting on the face surface.
    const curlLobe = (x: number, dy: number, r: number, s: number) => {
      const y0 = HEAD_Y + dy;
      const z = h.faceZ(Math.min(0.12, Math.abs(x)), y0) - 0.012;
      return sdf.chain(
        [
          [x - 0.022 * s, dy + 0.012, z - 0.004, r],
          [x, dy, z + 0.004, r * 1.05],
          [x + 0.024 * s, dy - 0.004, z, r * 0.85],
          [x + 0.03 * s, dy + 0.008, z - 0.006, r * 0.6],
        ],
        0.012,
      );
    };
    const fringe = [
      curlLobe(-0.125, 0.07, 0.03, 1),
      curlLobe(-0.075, 0.088, 0.03, -1),
      curlLobe(-0.025, 0.086, 0.028, 1),
      curlLobe(0.03, 0.09, 0.03, -1),
      curlLobe(0.08, 0.086, 0.03, 1),
      curlLobe(0.128, 0.072, 0.03, -1),
    ];
    // Temple curls beside the glasses, hanging down in front of the ear.
    const temple = (s: number) =>
      sdf.chain(
        [
          [0.164 * s, 0.07, 0.07, 0.034],
          [0.178 * s, 0.03, 0.062, 0.03],
          [0.18 * s, -0.01, 0.052, 0.026],
          [0.176 * s, -0.04, 0.044, 0.02],
        ],
        0.014,
      );
    // Nape curls at the back.
    const napeCurls = [-0.11, -0.04, 0.04, 0.11].map((x, i) => sdf.sphere(0.034).at(x, -0.062 - (i % 2) * 0.006, -0.158));
    const hairShape = headPose(sdf.smoothUnion(0.012, hairBase, ...fringe, temple(1), temple(-1), ...napeCurls)).bone('head');
    k.body('hair', hairShape, { color: hairColor, roughness: 0.6, detail: 0.005, bump: (x, y, z) => 0.003 * Math.sin(x * 70 + y * 40) * Math.cos(z * 60) });

    // The bun: a round puff of twisted curls at the back, peeking out beside the cap board.
    const twist = (c: readonly [number, number, number], r: number) => sdf.sphere(r).at(...c);
    const bun = sdf
      .smoothUnion(
        0.02,
        twist([-0.2, 0.15, -0.1], 0.07),
        twist([-0.235, 0.115, -0.07], 0.058),
        twist([-0.17, 0.2, -0.13], 0.06),
        twist([-0.19, 0.1, -0.15], 0.056),
        twist([-0.14, 0.145, -0.17], 0.05),
      )
      .displace(0.004, (x, y, z) => Math.sin(x * 120 + z * 90) * Math.cos(y * 100));
    k.body('bun', headPose(bun).bone('head'), { color: hairColor, roughness: 0.6, detail: 0.005 });

    // ------------------------------------------------------------------ the square cap
    const capPose = (s: sdf.Shape) => s.rotateX(-5).at(0, HEAD_Y, 0);
    const skull = sdf.ellipsoid([0.216, 0.216, 0.202]).intersect(sdf.halfSpace([0, -1, 0], -0.108));
    const board = sdf.box([0.4, 0.034, 0.4], 0.014).rotateY(20).rotateZ(-7).at(0.0, 0.232, -0.01);
    const button = sdf.sphere(0.017).at(0, 0.254, -0.01);
    const capShape = capPose(sdf.smoothUnion(0.012, skull, board, button)).bone('head');
    k.body('cap', capShape, { color: capColor, roughness: 0.85, detail: 0.005, bump: (x, y, z) => 0.002 * Math.sin(x * 80 + z * 60) });

    // The tassel: a cord over the board corner and a gold bundle hanging at the viewer's right.
    const cord = sdf.chain(
      [
        [0, 0.262, -0.01, 0.008],
        [0.09, 0.248, 0.0, 0.007],
        [0.17, 0.228, 0.03, 0.007],
        [0.232, 0.196, 0.062, 0.008],
        [0.242, 0.16, 0.07, 0.01],
      ],
      0.008,
    );
    const tassel = sdf.smoothUnion(
      0.01,
      sdf.ellipsoid([0.016, 0.036, 0.016]).at(0.242, 0.115, 0.07),
      sdf.sphere(0.013).at(0.242, 0.158, 0.07),
      sdf.cone([0.242, 0.09, 0.07], [0.242, 0.07, 0.07], 0.012, 0.005),
    );
    k.body('gold', capPose(sdf.union(cord, tassel)).bone('head'), { color: C.gold, roughness: 0.4, metalness: 0.4, detail: 0.003 });

    // ------------------------------------------------------------------ robe: torso, wide sleeves, a long skirt
    const sleeve = h.perArm((j) =>
      sdf.smoothUnion(
        0.02,
        sdf.cone(lerp(SHOULDER, j.ELBOW, -0.12), j.ELBOW, 0.06, 0.066).bone('upperarm.L'),
        sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.62), 0.066, 0.074).bone('forearm.L'),
      ),
    );
    const cuff = h.perArm((j) =>
      sdf.cone(lerp(j.ELBOW, j.WRIST, 0.4), lerp(j.ELBOW, j.WRIST, 0.66), 0.071, 0.078).round(0.006).bone('forearm.L'),
    );
    const skirt = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.3],
            [0.138, 0.3],
            [0.15, 0.26],
            [0.17, 0.2],
            [0.195, 0.14],
            [0.207, 0.108],
            [0.2, 0.098],
            [0, 0.098],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.9]);
    // The front panel (wine) between two gold edges, from the collar to the hem.
    const stripe = (x: number, w: number) => sdf.box([w, 0.5, 0.6]).at(x, 0.27, 0.3);
    const robe = sdf
      .smoothUnion(0.014, h.weighted(h.torso.round(0.014)), sleeve, h.weighted(skirt))
      .paintWhere(sdf.box([0.07, 0.5, 0.6]).at(0, 0.27, 0.3), C.wine, 0.004)
      .paintWhere(pair(stripe(0.05, 0.016)), C.gold, 0.002)
      .paintWhere(h.band(0.098, 0.116), darkCloth, 0.004);
    k.body('robe', robe, { color: clothMain, roughness: 0.9, detail: 0.005, bump: (x, y, z) => 0.003 * Math.sin(y * 70 + Math.atan2(x, z) * 9) });
    k.body('cuffs', cuff, { color: darkCloth, roughness: 0.9, detail: 0.004 });

    // The gold collar.
    const collar = sdf.torus(0.066, 0.016).scale([1, 1, 0.95]).at(0, 0.452, -0.012).bone('chest');
    k.body('trim', collar, { color: C.gold, roughness: 0.4, metalness: 0.4, detail: 0.004 });

    // ------------------------------------------------------------------ the open book
    // Spine toward the viewer, each cover swung back toward the reader, the pages up and tilted to the face.
    const { y: by, z: bz, w: bw, h: bh, open, tilt } = BOOK;
    const half = (s: 1 | -1) => {
      const cover = sdf.box([bw, bh, 0.014], 0.004).at(s * (bw / 2 + 0.012), 0, 0.0);
      const pages = sdf.box([bw - 0.016, bh - 0.012, 0.034], 0.004).at(s * (bw / 2 + 0.008), 0.0, -0.025);
      return { cover, pages };
    };
    const pose = (sh: sdf.Shape, s: 1 | -1) => sh.rotateY(s * open).rotateX(tilt).at(0, by, bz);
    const hl = half(1);
    const hr = half(-1);
    const covers = sdf.smoothUnion(
      0.006,
      pose(hl.cover, 1),
      pose(hr.cover, -1),
      sdf.box([0.034, bh, 0.034], 0.012).rotateX(tilt).at(0, by, bz - 0.002),
    );
    const spineBands = sdf.union(
      ...[bh / 2 - 0.016, -bh / 2 + 0.016].map((dy) => sdf.box([0.04, 0.012, 0.045], 0.003).rotateX(tilt).at(0, by + dy, bz - 0.002)),
    );
    const bookCover = covers
      .paintWhere(spineBands, C.gold, 0.002)
      .paintWhere(pair(sdf.box([0.1, 0.07, 0.4], 0.01).rotateY(0).at(0.1, by, bz)), C.coverDark, 0.01);
    k.body('book', bookCover.bone('hand.R'), { color: C.cover, roughness: 0.7, detail: 0.004, bump: (x, y, z) => 0.002 * Math.sin(x * 140 + y * 110) });
    const pageBlock = sdf.smoothUnion(0.004, pose(hl.pages, 1), pose(hr.pages, -1));
    const pageLines = sdf.union(
      ...[-0.04, -0.02, 0, 0.02, 0.04].map((dy) => sdf.box([0.4, 0.002, 0.4]).at(0, by + dy + 0.04, bz)),
    );
    k.body('pages', pageBlock.paintWhere(pageLines, C.pageLine, 0.001).bone('hand.R'), { color: C.pages, roughness: 0.85, detail: 0.004 });

    void ANKLE;
  },
});
