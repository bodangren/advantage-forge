import { profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Inquisitor — Chibi Quest court NPC (catalog `npcs/court-and-faction/inquisitor`), about 1.05 m to the
 * top of the hat, faces +Z. Target: docs/npc-mockups/inquisitor_001.jpg. Built on the humanoid kind.
 *
 * Role: the court's truth-seeker who checks the facts in mystery quests (strict but fair), seen at the
 *   court hall in 3D and as a 128 px sprite; the wide hat with the eye clasp, the glasses, the gray
 *   mustache and goatee, the lantern, and the red law book must read.
 * One idea: a stern but fair little official under a wide gray hat with a silver eye on its band,
 *   holding a glowing lantern of truth in one hand and a thick red book of laws in the other.
 * Shape language: round and soft (nose, beard, hat), with the book and the buckle as the hard forms.
 * Palette (60/30/10): gray #6a6870 (hat, coat; the `cloth` slot), white #f0ece4 (hat band, cuffs, collar),
 *   dark #2a2428 (belt, shoes, glasses); accents: red book #6a2a2a with gold #e0b040 corners and the
 *   soft glow #f0f4ff of the silver #c8ccd4 lantern.
 * Value plan: the pale band and the lantern glow against the gray; the red book is the one warm accent.
 * Bodies: skin (big nose, small smile), hat, band, clasp, hair, brows, mustache, goatee, glasses, coat,
 *   vest, belt, buckle, collar, cuffs, lantern, glow, book, pages, corners.
 * Rig: the humanoid kind's skeleton and clips; both arms are posed (the lantern held out, the book at
 *   the chest) and keep the pose in every clip. The lantern is rigid on `knife.R`, the book on `knife.L`.
 */

const C = {
  hat: '#6a6870',
  band: '#f0ece4',
  collar: '#f0ece4',
  silver: '#c8ccd4',
  glow: '#f0f4ff',
  dark: '#2a2428',
  vest: '#cdb98f',
  vestPanel: '#e6dcc4',
  under: '#2a2830',
  smile: '#6e2e26',
  book: '#6a2a2a',
  bookDark: '#5a2222',
  pages: '#e8dcc0',
  gold: '#e0b040',
};

const ARM = { elbow: [0.17, 0.335, 0.05], wrist: [0.2, 0.33, 0.15] } as const;

export default humanoidAsset({
  name: 'inquisitor',
  description: 'A stern but fair court inquisitor in a wide gray hat and gray coat, holding a lantern of truth and a thick red book of laws.',
  reference: 'docs/npc-mockups/inquisitor_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { gray: '#8a8890', silver: '#b8b4c4', brown: '#5a301d', black: '#231a17' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { slate: '#6a6870', taupe: '#7a6c60', steel: '#5a6a7a', mauve: '#6e5c70' },
  },
  presets: {
    default: { skin: 'fair', hair: 'gray', eyes: 'brown', cloth: 'slate' },
    dusk: { skin: 'tan', hair: 'silver', eyes: 'hazel', cloth: 'steel' },
  },
  hair: false,
  undershirt: false,
  pants: C.under,
  shoes: C.dark,
  lashes: false,
  pose: { L: ARM, R: ARM },

  // A big round nose in the skin tint, a calm small smile below the mustache.
  paintSkin(skin, h) {
    const noseZ = h.faceZ(0, 0.566) + 0.012;
    const nose = sdf.ellipsoid([0.058, 0.052, 0.06]).at(0, 0.572, noseZ + 0.014).bone('head');
    const oldBrows = sdf.extrude(profile.arc(0.1, 0.036, 54, 126), 0.3).at(0.1, 0.622, 0.1).mirror('x');
    const oldSmile = sdf.extrude(profile.arc(0.07, 0.016, 236, 304), 0.3).at(0, 0.6, 0.1);
    const smile = sdf.extrude(profile.arc(0.05, 0.012, 232, 308), 0.3).at(0, 0.488 + 0.05, 0.1);
    return skin
      .smoothUnion(0.012, nose)
      .paintWhere(oldBrows, h.tint.skin!, 0.002)
      .paintWhere(oldSmile, h.tint.skin!, 0.002)
      .paintWhere(smile, C.smile, 0.002);
  },

  extra(k, h) {
    const { SHOULDER, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];
    const surf = (shape: sdf.Shape, x: number, y: number): number | null => {
      const hit = sdf.raycast(shape, [x, y, 1], [0, 0, -1]);
      return hit ? hit[2] : null;
    };
    const cloth = h.tint.shirt!;
    const hairColor = k.tint('hair');

    // ------------------------------------------------------------------ the wide hat (local frame: the head center)
    const hatPose = (s: sdf.Shape) => s.at(0, HEAD_Y, 0).bone('head');
    const crown = sdf
      .revolve(
        profile.polygon([
          [0, 0.09],
          [0.232, 0.09],
          [0.23, 0.15],
          [0.186, 0.3],
          [0.172, 0.318],
          [0, 0.318],
        ]),
      )
      .round(0.01);
    const brim = sdf.cylinder(0.37, 0.022, 0.01).at(0, 0.125, 0).scale([1, 1, 0.96]);
    const hat = sdf.smoothUnion(0.014, crown, brim);
    k.body('hat', hatPose(hat), { color: cloth, roughness: 0.88, detail: 0.005, bump: (x, y, z) => 0.002 * Math.sin(x * 70 + z * 50) * Math.cos(y * 60) });
    // The pale band: a ring cut from a slightly larger crown.
    const band = crown.round(0.007).intersect(sdf.box([1, 0.052, 1]).at(0, 0.18, 0));
    k.body('band', hatPose(band), { color: C.band, roughness: 0.85, detail: 0.004 });
    // The silver eye clasp on the band: a lens with a dark pupil.
    const clasp = sdf.ellipsoid([0.04, 0.026, 0.016]).at(0, 0.18, 0.238);
    k.body('clasp', hatPose(clasp), { color: C.silver, roughness: 0.3, metalness: 0.85, detail: 0.003 });
    k.body('pupil', hatPose(sdf.sphere(0.014).scale([1, 1, 0.6]).at(0, 0.18, 0.251)), { color: C.dark, roughness: 0.4, detail: 0.003 });

    // ------------------------------------------------------------------ gray hair: a small cap and separate locks
    const R3 = [0.214, 0.206, 0.198] as const;
    const cap = sdf.ellipsoid([...R3]).at(0, 0.012, -0.008);
    const faceMask = sdf.ellipsoid([0.19, 0.17, 0.24]).at(0, -0.03, 0.2).smoothUnion(0.03, sdf.ellipsoid([0.3, 0.16, 0.2]).at(0, -0.18, 0.1));
    const onCap = (az: number, el: number, out = 1.1): [number, number, number] => {
      const a = (az * Math.PI) / 180;
      const e = (el * Math.PI) / 180;
      return [R3[0] * out * Math.cos(e) * Math.sin(a), 0.012 + R3[1] * out * Math.sin(e), -0.008 + R3[2] * out * Math.cos(e) * Math.cos(a)];
    };
    const wave = (r0: number, ...arc: [number, number][]) =>
      sdf.chain(
        arc.map(([az, el], i) => {
          const p = onCap(az, el);
          return [p[0], p[1], p[2], r0 * (1 - 0.12 * i)] as [number, number, number, number];
        }),
        0.012,
      );
    const locks: sdf.Shape[] = [];
    for (const sx of [1, -1]) {
      locks.push(wave(0.044, [sx * 68, 44], [sx * 74, 28], [sx * 80, 12]));
      locks.push(wave(0.046, [sx * 84, 38], [sx * 90, 20], [sx * 94, 2]));
      locks.push(wave(0.046, [sx * 102, 36], [sx * 102, 18], [sx * 100, -2]));
      locks.push(wave(0.05, [sx * 122, 34], [sx * 118, 16], [sx * 112, -4]));
    }
    for (const az of [145, 180, 215]) locks.push(wave(0.056, [az, 38], [az, 22], [az, 6]));
    const hair = sdf
      .smoothUnion(0.01, cap.smoothSubtract(0.02, faceMask), ...locks)
      .smoothIntersect(0.01, sdf.ellipsoid([0.34, 0.33, 0.3]).at(0, 0.06, -0.02));
    k.body('hair', sdf.union(hair).at(0, HEAD_Y, 0).bone('head'), { color: hairColor, roughness: 0.7, detail: 0.005 });

    // ------------------------------------------------------------------ brows, mustache, goatee (hair tint)
    const onFace = (x: number, y: number, lift: number): [number, number, number] => [x, y, h.faceZ(x, y) + lift];
    const brow = (s: number) =>
      sdf.chain(
        [onFace(0.04, 0.69, 0.006), onFace(0.09, 0.706, 0.006), onFace(0.14, 0.692, 0.004), onFace(0.168, 0.672, 0.0)].map(
          ([x, y, z], i) => [s * x, y, z, [0.012, 0.0125, 0.011, 0.009][i]!] as [number, number, number, number],
        ),
        0.008,
      );
    k.body('brows', sdf.smoothUnion(0.006, brow(1), brow(-1)).bone('head'), { color: hairColor, roughness: 0.7, detail: 0.004 });
    const must = (s: number) =>
      sdf.chain(
        [
          [0.008, 0.538, h.faceZ(0.008, 0.538) + 0.018, 0.016],
          [0.036, 0.536, h.faceZ(0.036, 0.536) + 0.016, 0.015],
          [0.066, 0.525, h.faceZ(0.066, 0.525) + 0.008, 0.012],
          [0.088, 0.512, h.faceZ(0.088, 0.512) + 0.002, 0.008],
        ].map(([x, y, z, r]) => [s * x!, y!, z!, r!] as [number, number, number, number]),
        0.01,
      );
    k.body('mustache', sdf.smoothUnion(0.008, must(1), must(-1)).bone('head'), { color: hairColor, roughness: 0.75, detail: 0.004 });
    const gz = (y: number) => h.faceZ(0, 0.495) - Math.max(0, 0.495 - y) * 0.5;
    const goatee = sdf.chain(
      [
        [0, 0.49, gz(0.49) + 0.016, 0.034],
        [0, 0.468, gz(0.468) + 0.026, 0.04],
        [0, 0.445, gz(0.445) + 0.034, 0.03],
        [0, 0.422, gz(0.422) + 0.032, 0.016],
        [0, 0.398, gz(0.398) + 0.03, 0.005],
      ],
      0.012,
    ).scale([1.15, 1, 1]);
    k.body('goatee', goatee.bone('head'), { color: hairColor, roughness: 0.75, detail: 0.004 });

    // ------------------------------------------------------------------ thin rectangular glasses
    const ex = h.joints.EYE[0];
    const ey = h.joints.EYE[1];
    const ez = h.faceZ(ex, ey);
    const rim = (s: number) =>
      sdf
        .extrude(profile.rect([0.118, 0.09], 0.024), 0.012)
        .subtract(sdf.extrude(profile.rect([0.092, 0.064], 0.014), 0.05))
        .rotateY(-s * 16)
        .at(s * ex, ey - 0.002, ez + 0.022);
    const bridge = sdf.capsule([-0.05, ey + 0.012, ez + 0.03], [0.05, ey + 0.012, ez + 0.03], 0.008);
    const sideX = (y: number, z: number) => sdf.raycast(h.head, [1, y, z], [-1, 0, 0])?.[0] ?? 0.2;
    const armPts: [number, number, number][] = [ez - 0.02, ez - 0.06, ez - 0.1, ez - 0.14].map((z, i) => [sideX(ey + 0.01, z) + 0.01, ey + 0.012 - i * 0.002, z]);
    const armStart: [number, number, number] = [ex + 0.056, ey + 0.004, ez - 0.002];
    const arm = (s: number) => {
      const pts = [armStart, ...armPts];
      return sdf.union(...pts.slice(1).map((q, i) => sdf.capsule([s * pts[i]![0], pts[i]![1], pts[i]![2]], [s * q[0], q[1], q[2]], 0.0075)));
    };
    k.body('glasses', sdf.smoothUnion(0.005, rim(1), rim(-1), bridge).union(arm(1), arm(-1)).bone('head'), {
      color: C.dark,
      roughness: 0.35,
      metalness: 0.1,
      detail: 0.003,
    });

    // ------------------------------------------------------------------ gray coat: torso, flared skirt, sleeves
    const bell = (pts: [number, number][]) => sdf.revolve(profile.polygon([[0, pts[0]![1]], ...pts, [0, pts[pts.length - 1]![1]]], { smooth: true, samples: 8 })).scale([1, 1, 0.88]);
    const coatSkirt = bell([[0.138, 0.3], [0.15, 0.25], [0.172, 0.19], [0.2, 0.14]]).bone('hips');
    const sleeves = h.perArm((j) =>
      sdf.smoothUnion(
        0.02,
        sdf.cone(lerp(SHOULDER, j.ELBOW, -0.1), j.ELBOW, 0.052, 0.054).bone('upperarm.L'),
        sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.88), 0.054, 0.058).bone('forearm.L'),
      ),
    );
    const opening = sdf
      .extrude(
        profile.polygon([
          [-0.065, 0.47],
          [0.065, 0.47],
          [0.1, 0.1],
          [-0.1, 0.1],
        ]),
        0.4,
      )
      .at(0, 0, 0.2);
    const coat = sdf
      .smoothUnion(0.02, h.weighted(h.torso.round(0.014)), coatSkirt)
      .smoothUnion(0.012, sleeves)
      .smoothSubtract(0.008, opening)
      .paintFn((x, y, z, base) => {
        const a = Math.atan2(x, z);
        const f = Math.max(0, Math.sin(a * 7 + Math.sin(y * 9) * 0.6) - 0.3) * Math.min(1, Math.max(0, (0.28 - y) / 0.1)) * 0.25;
        return [base[0] * (1 - f), base[1] * (1 - f), base[2] * (1 - f)] as const;
      });
    k.body('coat', coat, {
      color: cloth,
      roughness: 0.9,
      detail: 0.005,
      bump: (x, y, z) => 0.003 * Math.sin(Math.atan2(x, z) * 9 + y * 6) * Math.min(1, Math.max(0, (0.26 - y) * 8)),
    });

    // The dark vest under the open coat (a pale panel under the belt) and a dark under-skirt.
    const vest = h.weighted(h.torso.round(0.006)).paintWhere(h.band(0.2, 0.262), C.vestPanel, 0.004);
    k.body('vest', vest, { color: C.vest, roughness: 0.85, detail: 0.005 });
    const under = bell([[0.126, 0.3], [0.136, 0.24], [0.15, 0.17], [0.158, 0.14]]).intersect(sdf.halfSpace([0, 1, 0], 0.2)).bone('hips');
    k.body('underskirt', under, { color: C.under, roughness: 0.9, detail: 0.005 });

    // The black belt with a silver buckle.
    const belt = h.weighted(h.torso.round(0.016).intersect(h.band(0.262, 0.292)));
    k.body('belt', belt, { color: C.dark, roughness: 0.6, detail: 0.004 });
    const bz = surf(h.torso.round(0.016), 0, 0.277) ?? 0.1;
    const buckle = sdf
      .box([0.066, 0.05, 0.014], 0.006)
      .subtract(sdf.box([0.034, 0.024, 0.1]))
      .at(0, 0.277, bz + 0.004)
      .bone('chest');
    k.body('buckle', buckle, { color: C.silver, roughness: 0.3, metalness: 0.85, detail: 0.003 });

    // ------------------------------------------------------------------ white collar and cuffs
    const collar = sdf
      .torus(0.088, 0.026)
      .scale([1, 0.85, 0.95])
      .at(0, 0.44, -0.016)
      .smoothSubtract(0.01, sdf.box([0.08, 0.2, 0.2]).at(0, 0.43, 0.14))
      .bone('chest');
    k.body('collar', collar, { color: C.collar, roughness: 0.9, detail: 0.004 });
    const cuffs = h.perArm((j) => {
      const d = [j.WRIST[0] - j.ELBOW[0], j.WRIST[1] - j.ELBOW[1], j.WRIST[2] - j.ELBOW[2]];
      const len = Math.hypot(d[0]!, d[1]!, d[2]!);
      const n: [number, number, number] = [d[0]! / len, d[1]! / len, d[2]! / len];
      const at = (t: number) => lerp(j.ELBOW, j.WRIST, t);
      const dot = (p: readonly number[]) => n[0] * p[0]! + n[1] * p[1]! + n[2] * p[2]!;
      return sdf
        .cone(at(0.6), at(1.1), 0.062, 0.062)
        .intersect(sdf.halfSpace(n, dot(at(0.9))))
        .intersect(sdf.halfSpace([-n[0], -n[1], -n[2]], -dot(at(0.8))))
        .round(0.002)
        .bone('forearm.L');
    });
    k.body('cuffs', cuffs, { color: C.band, roughness: 0.9, detail: 0.004 });

    // ------------------------------------------------------------------ the lantern, right hand (x < 0)
    // Built upright at the grip: a stem through the fist, a base cup, four posts round a glowing glass,
    // a cap, and a ring on top.
    const gr = h.arms.R.GRIP;
    const GR = [-gr[0], gr[1], gr[2]] as const;
    const stem = sdf.capsule([0, -0.03, 0], [0, 0.05, 0], 0.0115);
    const baseCup = sdf.cylinder(0.044, 0.02, 0.008).at(0, 0.058, 0);
    const posts = sdf.union(
      ...[0, 90, 180, 270].map((a) => {
        const r = (a * Math.PI) / 180;
        return sdf.capsule([0.04 * Math.sin(r), 0.066, 0.04 * Math.cos(r)], [0.04 * Math.sin(r), 0.136, 0.04 * Math.cos(r)], 0.005);
      }),
    );
    const lanternCap = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.128],
            [0.046, 0.128],
            [0.044, 0.138],
            [0.03, 0.156],
            [0.012, 0.166],
            [0, 0.168],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .round(0.002);
    const ring = sdf.torus(0.016, 0.0045).rotateX(90).at(0, 0.18, 0);
    const lantern = sdf.smoothUnion(0.006, stem, baseCup, posts, lanternCap, ring).scale(1.4).at(GR[0] - 0.014, GR[1] - 0.014, GR[2] + 0.004);
    k.body('lantern', lantern, { color: C.silver, roughness: 0.3, metalness: 0.85, detail: 0.003, bone: 'knife.R' });
    const glass = sdf.cylinder(0.034, 0.066, 0.01).at(0, 0.098, 0).scale(1.4).at(GR[0] - 0.014, GR[1] - 0.014, GR[2] + 0.004);
    k.body('glow', glass, { color: '#ffd45a', roughness: 0.3, emissive: '#ffcc50', emissiveIntensity: 0.9, detail: 0.004, bone: 'knife.R' });

    // ------------------------------------------------------------------ the law book, left hand (x > 0)
    const G = h.arms.L.GRIP;
    const W = 0.14;
    const H = 0.18;
    const T = 0.05;
    const boardT = 0.01;
    const frontBoard = sdf.box([W, H, boardT], 0.004).at(0, 0, T / 2 - boardT / 2);
    const backBoard = sdf.box([W, H, boardT], 0.004).at(0, 0, -T / 2 + boardT / 2);
    const spine = sdf.box([0.018, H, T], 0.007).at(-W / 2 + 0.009, 0, 0);
    const cover = sdf.smoothUnion(0.003, frontBoard, backBoard, spine);
    const pages = sdf.box([W - 0.016, H - 0.014, T - 0.014], 0.003).at(0.003, 0, 0);
    const corners = sdf.union(
      ...[
        [1, 1],
        [1, -1],
      ].map(([sx, sy]) =>
        sdf.box([0.036, 0.036, T + 0.008], 0.004).at(sx! * (W / 2 - 0.012), sy! * (H / 2 - 0.012), 0),
      ),
    );
    const bookAt = (s: sdf.Shape) => s.rotateY(-32).rotateZ(-12).at(G[0] + 0.02, G[1] + 0.02, G[2] + 0.04);
    k.body('book', bookAt(cover), { color: C.book, roughness: 0.75, detail: 0.004, bone: 'knife.L' });
    k.body('pages', bookAt(pages), { color: C.pages, roughness: 0.9, detail: 0.004, bone: 'knife.L' });
    k.body('corners', bookAt(corners), { color: C.gold, roughness: 0.4, metalness: 0.7, detail: 0.003, bone: 'knife.L' });
  },
});
