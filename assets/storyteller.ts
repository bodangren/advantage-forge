import { profile, rgb, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Storyteller: Chibi Quest settlement NPC (catalog `npcs/settlement/storyteller`), about 1.0 m to the
 * top of the hair bun, faces +Z. Target: docs/npc-mockups/storyteller_001.jpg. Built on the humanoid kind.
 *
 * Role: the village storyteller (the fire and the inn) who starts story quests; seen in 3D and as a
 *   128 px sprite. The big white bun with the red flower, the round gold glasses, the patchwork shawl,
 *   the open storybook, and the little green dragon must read.
 * One idea: a warm old woman in a loud patchwork shawl who offers a story in one hand (the open book)
 *   and shows a toy dragon in the other.
 * Shape language: round and soft (bun, glasses, shawl drapes, cheeks), with the flat open book and the
 *   dragon's wings as the hard forms that break the outline.
 * Palette (60/30/10): plum dress #6a3a5a; shawl orange #c87a3a with rose #a85a7a, green #3f6a44, and
 *   gold #e0b040 patches; white hair #f0ece4; the accent is the red flower #c84040 and the gold glasses.
 * Value plan: the white hair and the gold glasses frame the face; the busy shawl sits on the quiet
 *   plum dress; the blue book and the green dragon sit at the hands as the focal points.
 * Bodies: skin, nose, ears, hair, flower, glasses, dress, cuffs, shawl, tassels, book, dragon.
 * Rig: the humanoid kind's skeleton and clips; both arms keep the held pose. The book is rigid on
 *   `knife.L`, the dragon on `knife.R`.
 */

const C = {
  hair: '#f0ece4',
  flower: '#e0705a',
  flowerHeart: '#e0b040',
  glasses: '#c8a040',
  shawl: '#bc6638',
  rose: '#c49a4c',
  green: '#6c6e3e',
  gold: '#c49a4c',
  stitch: '#4a3420',
  cuff: '#d8bc94',
  book: '#7a4630',
  page: '#f0e6cc',
  ink: '#8a7a5a',
  dragon: '#3f6a44',
  dragonBelly: '#8aa05a',
  mouth: '#8a2e2a',
  tongue: '#d8706a',
  teeth: '#fbf6ee',
};

type V3 = readonly [number, number, number];
const lerp = (a: V3, b: V3, t: number): [number, number, number] => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

export default humanoidAsset({
  name: 'storyteller',
  description: 'A warm old storyteller with a white bun, round gold glasses, and a patchwork shawl, holding an open storybook and a carved toy dragon.',
  reference: 'docs/npc-mockups/storyteller_001.jpg',
  variants: {
    skin: { peach: '#efbd98', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { white: '#f0ece4', silver: '#b8b4c4', brown: '#5a301d', auburn: '#8e3b1c' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { plum: '#6a3a5a', rust: '#8a4a38', dusk: '#4e5a70', fern: '#4a6a52' },
  },
  presets: {
    hearth: { skin: 'peach', hair: 'white', eyes: 'brown', cloth: 'plum' },
    harvest: { skin: 'brown', hair: 'silver', eyes: 'green', cloth: 'rust' },
  },
  hair: false,
  undershirt: false,
  pants: false,
  shoes: '#5a3a24',
  pose: {
    R: { elbow: [0.2, 0.34, 0.02], wrist: [0.25, 0.42, 0.07] },
    L: { elbow: [0.17, 0.335, 0.05], wrist: [0.2, 0.33, 0.15] },
  },

  // A big open smile with round corners and one tooth band, and arched white brows high above the glasses.
  paintSkin(skin, h) {
    const y = 0.538;
    const grin = profile.polygon(
      [
        [-0.05, 0.012],
        [-0.03, 0.006],
        [0, 0.004],
        [0.03, 0.006],
        [0.05, 0.012],
        [0.054, 0.0],
        [0.042, -0.019],
        [0.022, -0.031],
        [0, -0.035],
        [-0.022, -0.031],
        [-0.042, -0.019],
        [-0.054, 0.0],
      ],
      { smooth: true, samples: 6 },
    );
    const mouth = h.onFace(sdf.extrude(grin, 0.3), 0, y);
    const teeth = mouth.intersect(sdf.halfSpace([0, -1, 0], -(y - 0.011))).intersect(sdf.box([0.07, 0.1, 1]).at(0, y, 0));
    const tongue = h.onFace(sdf.ellipsoid([0.026, 0.014, 0.08]), 0, y - 0.03);
    const oldBrows = sdf.extrude(profile.arc(0.1, 0.036, 54, 126), 0.3).at(0.1, 0.622, 0.1).mirror('x');
    const brows = sdf.extrude(profile.arc(0.07, 0.014, 55, 125), 0.3).at(0.1, 0.665, 0.1).mirror('x');
    return skin
      .paintWhere(oldBrows, h.tint.skin!, 0.002)
      .paintWhere(brows, 'tint:hair:-0.08', 0.002)
      .paintWhere(mouth, C.mouth)
      .paintWhere(tongue.intersect(mouth), C.tongue, 0.004)
      .paintWhere(teeth, C.teeth, 0.002);
  },

  extra(k, h) {
    const { SHOULDER, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const fz = h.faceZ;
    const skinTint = h.tint.skin!;
    const hairTint = k.tint('hair');
    const cloth = h.tint.shirt!;
    const trim = k.tint('cloth', { color: '#4e2a44', follow: 1 });

    // ------------------------------------------------------------------ the face: nose, ears, glasses
    const nose = sdf.ellipsoid([0.03, 0.028, 0.027]).at(0, 0.563, fz(0, 0.563) - 0.002).bone('head');
    k.body('nose', nose, { color: skinTint, roughness: 0.55, detail: 0.004 });
    const ears = pair(sdf.ellipsoid([0.03, 0.052, 0.038]).subtract(sdf.sphere(0.02).at(0.018, 0, 0.006)).rotateY(-12).at(0.212, 0.612, -0.012).bone('head'));
    k.body('ears', ears, { color: skinTint, roughness: 0.55, detail: 0.004 });

    // The glasses follow the face: a thin skin of the head cut by a ring stencil at each eye, a bridge
    // over the nose, and two arms back to the ears. Two small gold drops hang from the ears.
    const skull = h.head.round(0.011).subtract(h.head.round(-0.002));
    const ring = sdf.cylinder(0.067, 1).subtract(sdf.cylinder(0.055, 1.2)).rotateX(90);
    const rings = pair(ring.at(0.105, 0.628, 0.1));
    const frontOnly = sdf.halfSpace([0, 0, -1], -0.01).intersect(sdf.box([0.6, 0.6, 0.6]).at(0, 0.6, 0.3));
    const bridge = sdf.box([0.07, 0.012, 1]).at(0, 0.645, 0);
    const arm = pair(sdf.box([0.06, 0.012, 1]).at(0.19, 0.636, 0).intersect(sdf.halfSpace([0, 0, -1], 0.03)));
    const frames = skull.intersect(sdf.union(rings, bridge, arm)).intersect(frontOnly);
    const drops = pair(sdf.capsule([0.222, 0.568, -0.012], [0.222, 0.545, -0.012], 0.007).bone('head'));
    k.body('glasses', sdf.union(frames.bone('head'), drops), { color: C.glasses, roughness: 0.35, metalness: 0.8, detail: 0.005 });

    // ------------------------------------------------------------------ hair: a cap, many locks, a bun, a flower
    // Every lock follows a meridian of the skull from the hairline over the crown into the bun.
    const A = 0.205 * 1.02;
    const B = 0.2 * 1.02;
    const Cz = 0.19 * 1.02;
    const rad = Math.PI / 180;
    const onSkull = (az: number, lat: number, s = 1): [number, number, number] => [
      A * s * Math.cos(lat * rad) * Math.sin(az * rad),
      B * s * Math.sin(lat * rad),
      Cz * s * Math.cos(lat * rad) * Math.cos(az * rad),
    ];
    const BUN: V3 = [0, 0.235, -0.05];
    const lock = (az: number, lat0: number, r0: number, r1: number) => {
      const pts: [number, number, number, number][] = [];
      const steps = 4;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const lat = lat0 + (76 - lat0) * t;
        const a = az * (1 - 0.55 * t * t);
        const p = onSkull(a, lat, 1.03 + 0.04 * Math.sin(t * Math.PI));
        pts.push([p[0], p[1], p[2], r0 + (r1 - r0) * t]);
      }
      pts.push([BUN[0] + 0.01 * Math.sign(az), BUN[1] - 0.04, BUN[2], 0.03]);
      return sdf.chain(pts, 0.012);
    };
    const locks: sdf.Shape[] = [];
    for (const az of [-76, -60, -44, -28, -14, 0, 14, 28, 44, 60, 76]) {
      locks.push(lock(az, Math.max(16, 54 - 0.4 * Math.abs(az)), 0.022, 0.027));
    }
    for (const az of [-108, -134, -160, 180, 160, 134, 108]) {
      locks.push(lock(az, 8, 0.025, 0.028));
    }
    const capShape = sdf.ellipsoid([0.205 * 1.025, 0.2 * 1.025, 0.19 * 1.025]);
    const faceWindow = sdf.ellipsoid([0.17, 0.14, 0.2]).at(0, -0.03, 0.13);
    const earWindow = pair(sdf.ellipsoid([0.07, 0.09, 0.1]).at(0.2, -0.07, 0));
    // The cap rounds off at the nape (a smooth cut, no flat plane) and clears the face and the ears.
    const cap = capShape
      .smoothSubtract(0.02, faceWindow)
      .smoothSubtract(0.02, earWindow)
      .smoothIntersect(0.04, sdf.halfSpace([0, -1, 0], 0.055));
    // A knot bun: a round core with two thick twisted ropes over it, wrapped at the base in coral.
    const bun = sdf.smoothUnion(
      0.022,
      sdf.ellipsoid([0.088, 0.07, 0.088]).at(...BUN),
      sdf.torus(0.056, 0.03).rotateX(24).rotateY(20).at(BUN[0], BUN[1] + 0.022, BUN[2]),
      sdf.torus(0.052, 0.028).rotateX(-28).rotateY(75).at(BUN[0], BUN[1] - 0.004, BUN[2]),
    );
    const hairShape = sdf.smoothUnion(0.014, cap, bun, ...locks);
    k.body('hair', hairShape.at(0, HEAD_Y, 0).bone('head'), {
      color: hairTint,
      roughness: 0.6,
      detail: 0.005,
      bump: (x, y, z) => 0.0025 * Math.sin(x * 120 + y * 90) * Math.cos(z * 100 + y * 40),
    });

    // The coral wrap at the base of the bun: a thick ring with six soft puffs.
    const puffs = [0, 60, 120, 180, 240, 300].map((a) => sdf.sphere(0.03).at(0.078 * Math.sin(a * rad), 0.012 * (a % 120 === 0 ? 1 : -1), 0.078 * Math.cos(a * rad)));
    const wrapShape = sdf.smoothUnion(0.012, sdf.torus(0.076, 0.024), ...puffs).at(BUN[0], BUN[1] - 0.028, BUN[2]);
    k.body('wrap', wrapShape.at(0, HEAD_Y, 0).bone('head'), { color: C.flower, roughness: 0.85, detail: 0.004 });

    // ------------------------------------------------------------------ dress: plum, long sleeves, a skirt to the shins
    const sleeve = h.perArm((j) =>
      sdf.smoothUnion(
        0.02,
        sdf.cone(lerp(SHOULDER, j.ELBOW, -0.12), j.ELBOW, 0.05, 0.047).bone('upperarm.L'),
        sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.88), 0.047, 0.044).bone('forearm.L'),
      ),
    );
    const skirt = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.3],
            [0.138, 0.3],
            [0.15, 0.26],
            [0.165, 0.2],
            [0.182, 0.14],
            [0.19, 0.108],
            [0.18, 0.1],
            [0, 0.1],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.9]);
    const dress = sdf
      .smoothUnion(0.014, h.weighted(h.torso.round(0.01)), sleeve, h.weighted(skirt))
      .paintWhere(h.band(0.1, 0.122), trim, 0.004)
      .paintWhere(h.band(0.238, 0.268), trim, 0.003);
    k.body('dress', dress, { color: cloth, roughness: 0.9, detail: 0.005, bump: (x, y, z) => 0.002 * Math.sin(y * 80 + Math.atan2(x, z) * 8) });
    const cuff = h.perArm((j) => sdf.cone(lerp(j.ELBOW, j.WRIST, 0.7), lerp(j.ELBOW, j.WRIST, 0.9), 0.048, 0.047).round(0.003).bone('forearm.L'));
    k.body('cuffs', cuff, { color: C.cuff, roughness: 0.9, detail: 0.004 });

    // ------------------------------------------------------------------ shawl: a draped patchwork over the shoulders
    const solid = sdf.smoothUnion(0.02, h.torso, skirt);
    // Soft vertical folds in the cloth; the front opens in a V over the dress.
    const wrap = solid
      .round(0.034)
      .displace(0.007, (x, y, z) => Math.sin(Math.atan2(x, z) * 8 + y * 6))
      .subtract(solid.round(0.012));
    const vOpen = sdf
      .extrude(
        profile.polygon([
          [-0.022, 0.5],
          [0.022, 0.5],
          [0.075, 0.1],
          [-0.075, 0.1],
        ]),
        0.5,
      )
      .at(0, 0, 0.25);
    // A pointed hem: the lowest point is at the back and the front corners; it rises to the sides.
    const HEM = 0.112;
    const SLOPE = 0.26;
    const hemCut = sdf
      .halfSpace([SLOPE, -1, 0], -HEM)
      .intersect(sdf.halfSpace([-SLOPE, -1, 0], -HEM))
      .intersect(sdf.box([0.8, 0.8, 0.8]).at(0, 0.3, 0));
    const wrapBody = wrap.intersect(hemCut).intersect(sdf.halfSpace([0, 1, 0], 0.452)).subtract(vOpen);
    const cape = h.perArm((j) =>
      sdf.cone(lerp(SHOULDER, j.ELBOW, -0.1), lerp(SHOULDER, j.ELBOW, 0.6), 0.07, 0.064).round(0.003).bone('upperarm.L'),
    );
    const scarf = sdf.torus(0.083, 0.03).scale([1, 1, 0.92]).at(0, 0.443, -0.006).bone('chest');
    const shawlShape = sdf.smoothUnion(0.012, h.weighted(wrapBody), cape, scarf);
    const palette = [rgb(C.shawl), rgb(C.rose), rgb(C.green)];
    const stitchColor = rgb(C.stitch);
    const cell = 0.12;
    const shawl = shawlShape.paintFn((x, y, z, base) => {
      if (y > 0.4) return base;
      const u = Math.floor(x / cell);
      const v = Math.floor(y / cell);
      const w = Math.floor(z / cell);
      const r = Math.abs((Math.sin(u * 12.9898 + v * 78.233 + w * 37.719) * 43758.5453) % 1);
      const color = r < 0.34 ? palette[2]! : r < 0.66 ? palette[1]! : palette[0]!;
      const fx = Math.abs((((x / cell) % 1) + 1) % 1 - 0.5);
      const fy = Math.abs((((y / cell) % 1) + 1) % 1 - 0.5);
      return fx > 0.492 || fy > 0.492 ? stitchColor : color;
    });
    k.body('shawl', shawl, {
      color: C.shawl,
      roughness: 0.95,
      detail: 0.005,
      bump: (x, y, z) => 0.003 * Math.sin(x * 90 + z * 20) * Math.cos(y * 85 + z * 30),
    });

    // A fringe along the hem: thin tassels, one every 10 degrees except at the open front.
    const tassels: sdf.Shape[] = [];
    const reach = solid.round(0.024);
    for (let a = -180; a < 180; a += 10) {
      if (Math.abs(a) < 26) continue;
      const dirX = Math.sin(a * rad);
      const dirZ = Math.cos(a * rad);
      const y0 = HEM + SLOPE * Math.abs(dirX * 0.19) + 0.008;
      const hit = sdf.raycast(reach, [dirX * 0.4, y0, dirZ * 0.4], [-dirX, 0, -dirZ]);
      if (!hit) continue;
      tassels.push(sdf.cone([hit[0], y0, hit[2]], [hit[0], y0 - 0.045, hit[2]], 0.008, 0.004));
    }
    if (tassels.length > 0) k.body('tassels', sdf.union(...tassels).bone('hips'), { color: C.gold, roughness: 0.9, detail: 0.003 });

    // ------------------------------------------------------------------ the open storybook (left fist)
    const gl = h.arms.L.GRIP;
    const bookAt = [gl[0] - 0.03, gl[1] + 0.065, gl[2] + 0.015] as const;
    const half = (side: 1 | -1) => {
      const cover = sdf.box([0.092, 0.134, 0.012], 0.004).at(0, 0, -0.008);
      const pages = sdf.box([0.082, 0.122, 0.014], 0.004).at(0, 0, 0.0);
      const lines = sdf.union(...[-0.04, -0.02, 0, 0.02, 0.04].map((yy) => sdf.box([0.06, 0.004, 0.1]).at(0, yy, 0)));
      const pageP = pages.paintWhere(lines, C.ink, 0.001);
      return sdf.union(cover.paint(C.book), pageP.paint(C.page).paintWhere(lines, C.ink, 0.001)).at(side * 0.046, 0, 0).rotateY(-side * 26);
    };
    const bookShape = sdf
      .union(half(1), half(-1), sdf.box([0.018, 0.134, 0.02], 0.006).at(0, 0, -0.02).paint(C.book))
      .scale(1.3)
      .rotateX(-24)
      .at(...bookAt)
      .bone('knife.L');
    k.body('book', bookShape, { color: C.book, roughness: 0.75, detail: 0.004 });

    // ------------------------------------------------------------------ the toy dragon (right fist)
    const gr = h.arms.R.GRIP;
    const dragonLocal = (() => {
      const body = sdf.ellipsoid([0.021, 0.024, 0.04]).at(0, 0.055, -0.005);
      const neck = sdf.chain(
        [
          [0, 0.06, 0.025, 0.018],
          [0, 0.085, 0.037, 0.016],
          [0, 0.104, 0.042, 0.015],
        ],
        0.01,
      );
      const head = sdf.smoothUnion(0.008, sdf.ellipsoid([0.026, 0.021, 0.027]).at(0, 0.112, 0.052), sdf.ellipsoid([0.015, 0.011, 0.02]).at(0, 0.105, 0.076));
      const horns = pair(sdf.cone([0.014, 0.122, 0.044], [0.024, 0.15, 0.03], 0.007, 0.002));
      const eyes = pair(sdf.sphere(0.006).at(0.016, 0.119, 0.066).paint(C.gold));
      const wing = sdf.ellipsoid([0.03, 0.006, 0.034]).at(0.03, 0, 0).rotateZ(30).at(0.01, 0.066, -0.016);
      const wings = pair(wing);
      const tail = sdf.chain(
        [
          [0, 0.05, -0.03, 0.016],
          [0, 0.038, -0.065, 0.012],
          [0, 0.04, -0.095, 0.01],
          [0, 0.06, -0.112, 0.008],
          [0, 0.078, -0.1, 0.006],
        ],
        0.008,
      );
      const spikes = sdf.union(...[-0.02, 0.0, 0.02, -0.05, -0.08].map((z, i) => sdf.cone([0, 0.07 + (i < 3 ? 0.008 : -0.03), z], [0, 0.093 + (i < 3 ? 0 : -0.04), z - 0.006], 0.008, 0.002)));
      const legs = pair(sdf.capsule([0.016, 0.04, 0.014], [0.018, 0.01, 0.022], 0.01));
      return sdf.smoothUnion(0.008, body, neck, head, horns, tail, legs, spikes).union(eyes, wings).paintWhere(sdf.halfSpace([0, -1, 0], -0.05).intersect(sdf.box([0.1, 0.3, 0.05]).at(0, 0.0, 0.03)), C.dragonBelly, 0.01);
    })();
    const dragonShape = dragonLocal.scale(1.2).at(-gr[0] - 0.03, gr[1] - 0.005, gr[2]).bone('knife.R');
    k.body('dragon', dragonShape, { color: C.dragon, roughness: 0.7, detail: 0.003, bump: (x, y, z) => 0.0015 * Math.sin(x * 220 + z * 180) * Math.cos(y * 200) });
  },
});
