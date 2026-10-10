import { mixRgb, profile, rgb, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Weaver — Chibi Quest settlement NPC (catalog `npcs/settlement/weaver`), about 1.0 m to the top of
 * the hair bun, faces +Z. Target: docs/npc-mockups/weaver_001.jpg. Built on the humanoid kind.
 *
 * Role: a craft NPC (cloth and yarn), seen in 3D and as a 128 px sprite; the basket of yarn balls,
 *   the striped scarf, and the bun with two knitting needles must read.
 * One idea: a plump, cheerful weaver whose bright yarn basket and striped scarf stand out of a
 *   soft lavender dress and a cream apron.
 * Shape language: round and soft (bun, balls, plump skirt), with thin needles as the spiky accent.
 * Palette (60/30/10): lavender #8a78a8 (dress, 60) with cream #f0e6cc (apron, cuffs, 30); brown hair
 *   #7a5a44 with gray streaks; a wicker basket #a8784a; yarn red, yellow, blue, pink, and cream and a
 *   four-stripe scarf (10).
 * Value plan: the dark hair frames the light face; the basket and scarf carry the strongest colors.
 * Bodies: skin, hair, band, needles, dress, cuffs, apron, bloomers, shoes, scarf, basket, yarn.
 * Rig: the humanoid kind's skeleton and clips with a two-hand `hold`: both fists on the basket rim.
 *   The basket and the yarn are rigid on `hand.R`.
 */

// The two-hand hold (left arm; the right mirrors it): the fists on the basket sides.
const HOLD_ELBOW = [0.205, 0.31, 0.06] as const;
const HOLD_WRIST = [0.155, 0.345, 0.225] as const;
// The basket: its center z, its floor and rim heights.
const BASKET = { z: 0.295, y0: 0.282, y1: 0.4, r0: 0.105, r1: 0.148 };

const C = {
  cream: '#f0e6cc',
  seam: '#c9b88e',
  hairGray: '#a8a0a0',
  hairDark: '#5e4432',
  needle: '#c8a060',
  scarf: ['#c84040', '#e0b040', '#3a6ab0', '#3f6a44'],
  pants: '#f0e6cc',
  shoe: '#5a3a24',
  basket: '#a8784a',
  basketDark: '#7e5430',
  basketLight: '#c49660',
  yarn: ['#c84040', '#e0b040', '#3a6ab0', '#b05a90', '#f0e6cc', '#3f7a44', '#7a4aa8'],
  hemTrim: '#6e5e8a',
};

export default humanoidAsset({
  name: 'weaver',
  description: 'A cheerful, plump weaver in a lavender dress with a striped scarf, carrying a basket of colorful yarn balls.',
  reference: 'docs/npc-mockups/weaver_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { brown: '#7a5a44', black: '#231a17', blond: '#c4974a', auburn: '#8e3b1c', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { lavender: '#8a78a8', plum: '#7a5a82', sage: '#6e8a78', rose: '#a8687a' },
  },
  presets: {
    market: { skin: 'tan', hair: 'auburn', eyes: 'green', cloth: 'sage' },
  },
  hair: false,
  undershirt: false,
  pants: false,
  shoes: false,
  hold: { elbow: HOLD_ELBOW, wrist: HOLD_WRIST },

  // Rosy, wide cheeks as in the mockup.
  paintSkin(skin, h) {
    const cheeks = h.onFace(sdf.sphere(0.04), 0.138, 0.552).mirror('x');
    // Cheerful brows: the kind's straight brows are painted over with skin, and new arched brows
    // rise toward the inner ends.
    const oldBrows = sdf.extrude(profile.arc(0.1, 0.036, 54, 126), 0.3).at(0.1, 0.622, 0.1).mirror('x');
    const brow = sdf.extrude(profile.arc(0.07, 0.016, 52, 128), 0.3).at(0, -0.07, 0).rotateZ(-12).at(0.108, 0.706, 0.1).mirror('x');
    return skin
      .paintWhere(cheeks, h.tint.blush!, 0.035)
      .paintWhere(oldBrows, h.tint.skin!, 0.002)
      .paintWhere(brow, h.tint.brow!, 0.002);
  },

  extra(k, h) {
    const { SHOULDER, ELBOW, WRIST, HIP, KNEE, ANKLE, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];

    // ------------------------------------------------------------------ hair: a snug cap, many locks, a bun
    const headAt = (s: sdf.Shape) => s.at(0, HEAD_Y, 0).bone('head');
    const hairColor = k.tint('hair');
    const shell = sdf.ellipsoid([0.213, 0.208, 0.198]);
    const faceCut = sdf.ellipsoid([0.165, 0.152, 0.3]).at(0, -0.068, 0.1);
    const capTop = shell.smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], 0.012));
    const capBack = shell.smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], 0.06)).smoothIntersect(0.04, sdf.halfSpace([0, 0, -1], 0.06));
    const cap = sdf.smoothUnion(0.02, capTop, capBack).subtract(faceCut);

    const lock = (pts: readonly (readonly [number, number, number, number])[]) => sdf.chain(pts.map((p) => [...p] as [number, number, number, number]), 0.012);
    const mir = (pts: readonly (readonly [number, number, number, number])[]) => pts.map(([x, y, z, r]) => [-x, y, z, r] as const);
    // Fringe: a big center curl that points down, and locks that sweep to each side.
    const centerLock = lock([
      [0.02, 0.2, 0.06, 0.04],
      [0.012, 0.15, 0.14, 0.04],
      [-0.004, 0.1, 0.188, 0.034],
      [-0.016, 0.062, 0.197, 0.016],
    ]);
    const fringeR = [
      [0.03, 0.195, 0.07, 0.036],
      [0.07, 0.15, 0.14, 0.034],
      [0.115, 0.1, 0.15, 0.03],
      [0.15, 0.06, 0.12, 0.018],
    ] as const;
    const fringeR2 = [
      [0.07, 0.2, 0.04, 0.036],
      [0.125, 0.16, 0.1, 0.032],
      [0.165, 0.11, 0.11, 0.028],
      [0.185, 0.05, 0.09, 0.017],
    ] as const;
    const fringeL = [
      [-0.03, 0.2, 0.07, 0.036],
      [-0.06, 0.15, 0.145, 0.032],
      [-0.1, 0.11, 0.16, 0.028],
      [-0.12, 0.08, 0.16, 0.016],
    ] as const;
    const templeR = [
      [0.17, 0.1, 0.09, 0.03],
      [0.19, 0.03, 0.075, 0.028],
      [0.196, -0.04, 0.05, 0.024],
      [0.19, -0.095, 0.04, 0.014],
    ] as const;
    const templeL = mir(templeR);
    // Back locks: soft rounded ends in a row at the nape.
    const nape = [-80, -55, -30, -8, 14, 36, 58, 80].map((a, i) => {
      const r = (a * Math.PI) / 180;
      const x = 0.19 * Math.sin(r);
      const z = -0.176 * Math.cos(r);
      return sdf.sphere(0.046).at(x * 0.95, -0.05 - (i % 2) * 0.006, z * 0.95);
    });
    const bun = sdf.smoothUnion(
      0.03,
      sdf.sphere(0.064).at(0, 0.232, -0.068),
      sdf.sphere(0.046).at(-0.042, 0.258, -0.068),
      sdf.sphere(0.044).at(0.042, 0.254, -0.074),
      sdf.sphere(0.04).at(0.0, 0.272, -0.052),
      sdf.sphere(0.04).at(0.0, 0.25, -0.1),
    );
    const hairShape = sdf.smoothUnion(0.012, cap, centerLock, lock(fringeR), lock(fringeR2), lock(fringeL), lock(templeR), lock(templeL), lock(mir(fringeR2)), bun, ...nape);
    // A soft sheen on the crown instead of streaks.
    const hair = headAt(hairShape).paintFn((_x, y, z, base) => {
      const wy = y - HEAD_Y;
      const t = Math.min(1, Math.max(0, (wy - 0.1) / 0.1)) * Math.min(1, Math.max(0, (z + 0.02) / 0.1));
      return mixRgb(base, rgb('#d8c0a8'), 0.2 * t);
    });
    k.body('hair', hair, { color: hairColor, roughness: 0.6, detail: 0.004, textureDensity: 1.5 });

    // The scrunchie at the bun base and the two knitting needles that cross the bun.
    const scrunch = headAt(sdf.torus(0.052, 0.016).scale([1, 1, 0.95]).at(0, 0.188, -0.07))
      .paintFn((x, _y, z, base) => {
        const i = Math.floor(((Math.atan2(x, z + 0.07) + Math.PI) / (2 * Math.PI)) * 12) % 4;
        return rgb(C.scarf[i]!);
      });
    k.body('band', scrunch, { color: C.scarf[0]!, roughness: 0.85, detail: 0.004 });
    const needle = (sx: number) =>
      sdf.smoothUnion(
        0.01,
        sdf.capsule([-0.03 * sx, 0.232, -0.07], [0.135 * sx, 0.318, -0.09], 0.018),
        sdf.sphere(0.03).at(0.14 * sx, 0.321, -0.09),
      );
    k.body('needles', headAt(sdf.union(needle(1), needle(-1))), { color: C.needle, roughness: 0.5, metalness: 0.1, detail: 0.003 });

    // ------------------------------------------------------------------ dress: plump body, long sleeves, scalloped hem
    const dressBody = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.47],
            [0.085, 0.466],
            [0.13, 0.44],
            [0.16, 0.4],
            [0.175, 0.34],
            [0.176, 0.285],
            [0.18, 0.245],
            [0.196, 0.2],
            [0.206, 0.165],
            [0.206, 0.152],
            [0, 0.152],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.88]);
    const upper = sdf.cone(lerp(SHOULDER, ELBOW, -0.1), ELBOW, 0.05, 0.045).bone('upperarm.L');
    const fore = sdf.cone(ELBOW, lerp(ELBOW, WRIST, 0.86), 0.045, 0.042).bone('forearm.L');
    const sleeve = sdf.smoothUnion(0.015, upper, fore);
    const dress = sdf
      .smoothUnion(0.012, h.weighted(dressBody), pair(sleeve))
      .paintWhere(h.band(0.152, 0.176), C.hemTrim, 0.004);
    k.body('dress', dress, { color: h.tint.shirt ?? '#8a78a8', roughness: 0.85, bump: (x, y, z) => 0.0015 * Math.sin(x * 160) * Math.sin(y * 160 + z * 40) });

    const cuff = sdf.cone(lerp(ELBOW, WRIST, 0.7), lerp(ELBOW, WRIST, 1.0), 0.047, 0.047).round(0.003).bone('forearm.L');
    const sock = sdf.cylinder(0.05, 0.036, 0.012).at(ANKLE[0], 0.1, 0.002).bone('shin.L');
    k.body('cuffs', sdf.union(pair(cuff), pair(sock)), { color: C.cream, roughness: 0.9, detail: 0.004 });

    // ------------------------------------------------------------------ apron: a panel with a seam, waist ties
    const shellD = dressBody.round(0.012).subtract(dressBody.round(-0.003));
    const panel = shellD
      .intersect(sdf.box([0.215, 0.14, 0.6], 0.012).at(0, 0.226, 0.3))
      .intersect(sdf.halfSpace([0, 0, -1], -0.02));
    const waist = shellD.intersect(sdf.box([0.5, 0.026, 0.6]).at(0, 0.292, 0));
    const apron = sdf
      .smoothUnion(0.006, h.weighted(panel), h.weighted(waist))
      .paintWhere(h.band(0.158, 0.172), C.seam, 0.002);
    k.body('apron', apron, { color: C.cream, roughness: 0.9, detail: 0.005 });

    // ------------------------------------------------------------------ bloomers and shoes
    const legCream = sdf.smoothUnion(
      0.012,
      sdf.capsule(HIP, KNEE, 0.05).bone('leg.L'),
      sdf.cone(KNEE, [ANKLE[0], 0.13, 0.002], 0.048, 0.046).bone('shin.L'),
    );
    k.body('bloomers', sdf.smoothUnion(0.03, sdf.ellipsoid([0.118, 0.052, 0.088]).at(0, 0.2, 0).bone('hips'), pair(legCream)), { color: C.pants, roughness: 0.9 });
    const shoe = sdf
      .smoothUnion(0.025, sdf.ellipsoid([0.056, 0.042, 0.1]).at(0, 0.04, 0.04), sdf.sphere(0.05).at(0, 0.05, -0.005))
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('shoes', pair(shoe), { color: C.shoe, roughness: 0.6 });

    // ------------------------------------------------------------------ scarf: four stripes over the shoulders
    const scarfShape = sdf
      .torus(0.128, 0.04)
      .scale([1, 1, 0.84])
      .at(0, 0.438, -0.012)
      .bone('chest')
      .paintFn((x, _y, z, base) => {
        const a = Math.atan2(x, z + 0.012);
        const i = ((Math.floor(((a + Math.PI) / (2 * Math.PI)) * 16) % 4) + 4) % 4;
        return mixRgb(base, rgb(C.scarf[i]!), 1);
      });
    k.body('scarf', scarfShape, { color: C.scarf[0]!, roughness: 0.95, detail: 0.004, bump: (x, y, z) => 0.0025 * Math.sin(y * 220) * Math.sin(Math.atan2(x, z) * 90) });

    // ------------------------------------------------------------------ round cheeks: skin puffs with a blush
    const puff = sdf
      .ellipsoid([0.058, 0.046, 0.046])
      .at(0.122, 0.522, 0.122)
      .paintWhere(sdf.sphere(0.04).at(0.125, 0.522, 0.16), h.tint.blush!, 0.035);
    k.body('cheeks', pair(puff).bone('head'), { color: h.tint.skin!, roughness: 0.55, detail: 0.004, textureDensity: 2 });

    // ------------------------------------------------------------------ the basket and the yarn balls
    const { z: bz, y0, y1, r0, r1 } = BASKET;
    const outer = sdf.revolve(
      profile.polygon(
        [
          [0, y0],
          [r0, y0],
          [(r0 + r1) / 2 + 0.004, (y0 + y1) / 2],
          [r1, y1],
          [0, y1],
        ],
        { smooth: true, samples: 6 },
      ),
    );
    const inner = sdf.revolve(
      profile.polygon(
        [
          [0, y0 + 0.016],
          [r0 - 0.012, y0 + 0.016],
          [r1 - 0.012, y1 + 0.01],
          [0, y1 + 0.01],
        ],
        { smooth: false },
      ),
    );
    const rim = sdf.torus(r1 - 0.002, 0.01).at(0, y1 - 0.002, 0);
    const bandBase = sdf.torus((r0 + r1) / 2 + 0.002, 0.007).at(0, (y0 + y1) / 2, 0).scale([1, 1, 1]);
    const basketShape = sdf
      .smoothUnion(0.006, outer.subtract(inner), rim, bandBase)
      .at(0, 0, bz)
      .bone('hand.R')
      .paintWhere(sdf.torus(r1 - 0.002, 0.014).at(0, y1 - 0.002, bz), C.basketLight, 0.004);
    k.body('basket', basketShape, {
      color: C.basket,
      roughness: 0.85,
      detail: 0.0035,
      bump: (x, y, z) => {
        const a = Math.atan2(x, z - bz);
        const row = Math.floor(y / 0.0165);
        return 0.004 * Math.sin(a * 34 + (row % 2) * Math.PI) * Math.max(0, Math.sin(y * 190)) - 0.001;
      },
    });

    const ballR = 0.036;
    const ballY = y1 - 0.004;
    const ring = 0.088;
    const spots: [number, number, number][] = [
      [0, ballY + 0.016, bz],
      ...[0, 1, 2, 3, 4, 5].map((i): [number, number, number] => {
        const a = (i / 6) * Math.PI * 2 + 0.3;
        return [ring * Math.cos(a), ballY, bz + ring * Math.sin(a)];
      }),
    ];
    const order = [4, 0, 5, 2, 6, 1, 3];
    const balls = spots.map((c, i) => {
      const col = rgb(C.yarn[order[i]!]!);
      const dark = mixRgb(col, rgb('#2a1a20'), 0.28);
      return sdf
        .sphere(ballR)
        .at(c[0], c[1], c[2])
        .paintFn((x, y, z) => {
          const lx = x - c[0];
          const ly = y - c[1];
          const lz = z - c[2];
          return Math.sin((lx * 0.8 + ly * 0.45 + lz * 0.4) * 240) > 0.55 ? dark : col;
        });
    });
    k.body('yarn', sdf.union(...balls).bone('hand.R'), { color: C.yarn[0]!, roughness: 0.95, detail: 0.004, bump: (x, y, z) => 0.002 * Math.sin(x * 300 + y * 200) * Math.sin(z * 260) });
  },
});
