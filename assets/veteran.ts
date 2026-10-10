import { profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Veteran — Chibi Quest court and faction NPC (catalog `npcs/court-and-faction/veteran`), about 1.0 m
 * tall (bald head), faces +Z. Target: docs/npc-mockups/veteran_001.jpg. Built on the humanoid kind.
 *
 * Role: a tavern and barracks NPC who tells war stories; seen in 3D and as a 128 px sprite. The
 *   big gray mustache, the worn blue coat, the cane, and the steel helmet at the hip must read.
 * One idea: a kind old soldier, all mustache and coat, leaning on a cane with his helmet in hand.
 * Shape language: round and soft (bald dome, bulb nose, mustache lobes), with the helmet and the
 *   brass as the few hard forms.
 * Palette (60/30/10): faded blue coat #4a5a7a, gray trousers #6a6870, black boots #2a2428; gray hair
 *   and mustache #a8a4a0; brown belt #5a3a24 and cane #8a6a3a; steel helmet #8a8c94; brass
 *   #c8a040 buttons and medal #e0b040 with a #b03a3a ribbon (the accent).
 * Value plan: the dark mustache-gray against the pale bald head is the focal point; the coat is mid;
 *   the boots are darkest; the brass is the brightest accent.
 * Bodies: skin (bulb nose, scar, smile), ears, brows, mustache, fringe, coat, belt, brass, medal,
 *   ribbon, boots, cane, helmet.
 * Rig: the humanoid kind's skeleton and clips. Both arms hold a pose: the left fist carries the
 *   helmet at the hip, the right fist grips the cane (both items rigid on the knife bones).
 */

const C = {
  hair: '#a8a4a0',
  scar: '#f0c0a8',
  belt: '#5a3a24',
  pants: '#6a6870',
  boot: '#2a2428',
  lace: '#5a5058',
  cane: '#8a6a3a',
  steel: '#8a8c94',
  brass: '#c8a040',
  medal: '#e0b040',
  ribbon: '#b03a3a',
  slot: '#2e2e34',
};

// The arm poses (left-side coordinates; the kind mirrors the right one).
const LEFT_ARM = { elbow: [0.2, 0.31, -0.03], wrist: [0.15, 0.25, 0.04] } as const;
const RIGHT_ARM = { elbow: [0.2, 0.34, 0.04], wrist: [0.19, 0.345, 0.14] } as const;

export default humanoidAsset({
  name: 'veteran',
  description: 'A kind old veteran with a big gray mustache and a worn blue coat, leaning on a cane with his old steel helmet at his hip.',
  reference: 'docs/npc-mockups/veteran_001.jpg',
  variants: {
    skin: { light: '#e8b48e', fair: '#f2c7a4', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { gray: '#a8a4a0', white: '#d8d4cc', brown: '#5a301d', black: '#231a17' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { faded: '#4a5a7a', pine: '#3f5a48', wine: '#6a3a44', khaki: '#7a6a48' },
  },
  presets: {
    default: { skin: 'light', hair: 'gray', eyes: 'brown', cloth: 'faded' },
    barracks: { skin: 'tan', hair: 'white', eyes: 'hazel', cloth: 'pine' },
  },
  hair: false,
  undershirt: false,
  pants: C.pants,
  shoes: false,
  lashes: false,
  pose: { L: LEFT_ARM, R: RIGHT_ARM },

  // A bulb nose, big ears (below), a kind arched smile under the mustache, and a pale scar on the left cheek.
  paintSkin(skin, h) {
    const noseZ = h.faceZ(0, 0.58) + 0.012;
    const nose = sdf.ellipsoid([0.049, 0.045, 0.05]).at(0, 0.578, noseZ + 0.004).bone('head');
    const oldBrows = sdf.extrude(profile.arc(0.1, 0.036, 54, 126), 0.3).at(0.1, 0.622, 0.1).mirror('x');
    const oldSmile = sdf.extrude(profile.arc(0.07, 0.016, 236, 304), 0.3).at(0, 0.6, 0.1);
    const smile = sdf.extrude(profile.arc(0.05, 0.011, 236, 304), 0.3).at(0, 0.502 + 0.05, 0.1);
    const scar = h.onFace(sdf.box([0.055, 0.009, 0.2], 0.003).rotateZ(-62), 0.172, 0.568);
    return skin
      .smoothUnion(0.012, nose)
      .paintWhere(oldBrows, h.tint.skin!, 0.002)
      .paintWhere(oldSmile, h.tint.skin!, 0.002)
      .paintWhere(smile, h.tint.mouth!, 0.002)
      .paintWhere(scar, C.scar, 0.002);
  },

  extra(k, h) {
    const { SHOULDER, ELBOW, WRIST, HEAD_Y } = h.joints;
    void ELBOW;
    void WRIST;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];
    const hairColor = k.tint('hair');
    const skinColor = k.tint('skin');
    const clothDark = k.tint('cloth', -0.28);

    // ------------------------------------------------------------------ ears: a larger shell over each kind ear
    const ear = sdf
      .ellipsoid([0.03, 0.052, 0.04])
      .subtract(sdf.sphere(0.021).at(0.02, 0.004, 0.008))
      .rotateY(-14)
      .at(0.203, 0.612, -0.008)
      .bone('head');
    k.body('ears', pair(ear), { color: skinColor, roughness: 0.55, detail: 0.004 });

    // ------------------------------------------------------------------ bushy brows: arched, never stern
    const zAt = (x: number, y: number) => h.faceZ(x, y);
    const brow = (pts: ReadonlyArray<readonly [number, number, number]>) =>
      sdf.chain(
        pts.map(([x, y, r]) => [x, y, zAt(x, y) + 0.004, r] as [number, number, number, number]),
        0.012,
      );
    const browShape = pair(
      sdf.smoothUnion(
        0.01,
        brow([
          [0.04, 0.686, 0.02],
          [0.075, 0.704, 0.022],
          [0.115, 0.709, 0.021],
          [0.15, 0.696, 0.017],
          [0.172, 0.674, 0.012],
        ]),
        sdf.sphere(0.019).at(0.05, 0.704, zAt(0.05, 0.704) + 0.006),
      ),
    ).bone('head');
    k.body('brows', browShape, { color: hairColor, roughness: 0.7, detail: 0.004 });

    // ------------------------------------------------------------------ mustache: its own body, two big swept lobes
    const stache = pair(
      sdf.chain(
        [
          [0.008, 0.545, 0.024],
          [0.045, 0.538, 0.029],
          [0.085, 0.536, 0.027],
          [0.118, 0.546, 0.021],
          [0.14, 0.566, 0.014],
        ].map(([x, y, r]) => [x!, y!, zAt(x!, y!) + 0.013, r!] as [number, number, number, number]),
        0.02,
      ),
    ).bone('head');
    k.body('mustache', stache, { color: hairColor, roughness: 0.7, detail: 0.004 });

    // ------------------------------------------------------------------ fringe: a thin cap and ragged locks, sides and back
    const HR = [0.205, 0.2, 0.19] as const;
    const P = (th: number, y: number, s: number): [number, number, number] => {
      const f = Math.sqrt(Math.max(0, 1 - ((y - HEAD_Y) / HR[1]) ** 2));
      const a = (th * Math.PI) / 180;
      return [HR[0] * s * f * Math.sin(a), y, -HR[2] * s * f * Math.cos(a)];
    };
    const band = sdf
      .ellipsoid([0.214, 0.209, 0.2])
      .at(0, HEAD_Y, 0)
      .smoothIntersect(0.012, sdf.box([0.6, 0.085, 0.6]).at(0, 0.615, 0))
      .smoothIntersect(0.02, sdf.halfSpace([0, 0, 1], -0.055));
    const locks = [-68, -52, -35, -18, 0, 18, 35, 52, 68].map((th, i) => {
      const low = i % 2 === 0 ? 0.56 : 0.578;
      const [x0, y0, z0] = P(th, 0.655, 0.96);
      const [x1, y1, z1] = P(th, 0.615, 0.97);
      const [x2, y2, z2] = P(th, 0.59, 0.97);
      const [x3, y3, z3] = P(th, low, 0.96);
      return sdf.chain(
        [
          [x0, y0, z0, 0.019],
          [x1, y1, z1, 0.021],
          [x2, y2, z2, 0.019],
          [x3, y3, z3, 0.017],
        ],
        0.014,
      );
    });
    const fringe = sdf.smoothUnion(0.012, band, ...locks).bone('head');
    k.body('fringe', fringe, { color: hairColor, roughness: 0.7, detail: 0.005 });

    // ------------------------------------------------------------------ coat: a worn blue coat to the thigh
    const hem = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.28],
            [0.14, 0.28],
            [0.152, 0.2],
            [0.158, 0.15],
            [0.15, 0.136],
            [0, 0.136],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.78]);
    const sleeves = h.perArm((j) => {
      const upper = sdf.cone(lerp(SHOULDER, j.ELBOW, -0.1), j.ELBOW, 0.047, 0.043).bone('upperarm.L');
      const fore = sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.9), 0.043, 0.04).bone('forearm.L');
      return sdf.smoothUnion(0.015, upper, fore);
    });
    const coatBody = sdf.smoothUnion(0.012, h.weighted(h.torso.round(0.012)), h.weighted(hem));
    const coat = sdf
      .smoothUnion(0.012, coatBody, sleeves)
      .paintWhere(sdf.box([0.07, 0.034, 0.5]).at(0.075, 0.2, 0), clothDark, 0.004)
      .paintWhere(sdf.box([0.07, 0.034, 0.5]).at(-0.075, 0.2, 0), clothDark, 0.004);
    k.body('coat', coat, { color: h.tint.shirt!, roughness: 0.9, detail: 0.005 });

    // The standing collar and the cuffs, in a darker shade of the coat.
    const collar = sdf.torus(0.06, 0.018).at(0, 0.452, -0.012).bone('chest');
    const cuffs = h.perArm((j) =>
      sdf.cone(lerp(j.ELBOW, j.WRIST, 0.72), lerp(j.ELBOW, j.WRIST, 1.0), 0.046, 0.047).round(0.002).bone('forearm.L'),
    );
    k.body('trim', sdf.union(collar, cuffs), { color: clothDark, roughness: 0.9, detail: 0.004 });

    // ------------------------------------------------------------------ belt and brass
    const belt = h.weighted(h.torso.round(0.02).intersect(h.band(0.222, 0.256)));
    k.body('belt', belt, { color: C.belt, roughness: 0.8, detail: 0.004 });

    const coatFront = (x: number, y: number) => sdf.raycast(coat, [x, y, 1], [0, 0, -1])?.[2] ?? 0.12;
    const button = (x: number, y: number) => sdf.sphere(0.0115).scale([1, 1, 0.65]).at(x, y, coatFront(x, y));
    const buckleZ = sdf.raycast(belt, [0, 0.239, 1], [0, 0, -1])?.[2] ?? 0.13;
    const buckle = sdf.box([0.05, 0.036, 0.014], 0.006).at(0, 0.239, buckleZ + 0.002).subtract(sdf.box([0.03, 0.018, 0.1]).at(0, 0.239, buckleZ));
    const prong = sdf.box([0.006, 0.02, 0.016], 0.002).at(0, 0.239, buckleZ + 0.003);
    const epaulette = pair(
      sdf
        .ellipsoid([0.043, 0.01, 0.028])
        .rotateZ(-18)
        .at(0.113, sdf.raycast(coat, [0.113, 0.7, 0], [0, -1, 0])?.[1] ?? 0.43, 0),
    );
    const brass = sdf.union(button(0, 0.425), button(0, 0.37), button(0, 0.31), button(0, 0.28), buckle, prong, epaulette);
    k.body('brass', h.weighted(brass), { color: C.brass, roughness: 0.35, metalness: 0.8, detail: 0.003 });

    // The one shiny medal on the left chest, hung from a short red ribbon.
    const mx = 0.072;
    const my = 0.372;
    const mz = coatFront(mx, my);
    const medal = sdf.union(
      sdf.cylinder(0.022, 0.009, 0.003).rotateX(90).at(mx, my, mz + 0.001),
      sdf.cylinder(0.011, 0.012, 0.003).rotateX(90).at(mx, my, mz + 0.003),
    );
    k.body('medal', h.weighted(medal), { color: C.medal, roughness: 0.25, metalness: 0.9, detail: 0.003 });
    const ribbon = sdf.union(
      sdf.box([0.018, 0.046, 0.008], 0.002).rotateZ(14).at(mx - 0.01, my + 0.04, mz - 0.002),
      sdf.box([0.018, 0.046, 0.008], 0.002).rotateZ(-14).at(mx + 0.01, my + 0.04, mz - 0.002),
    );
    k.body('ribbon', h.weighted(ribbon), { color: C.ribbon, roughness: 0.8, detail: 0.003 });

    // ------------------------------------------------------------------ old black boots with laces
    const { ANKLE } = h.joints;
    const shaft = sdf
      .cylinder(0.053, 0.108, 0.02)
      .at(0, 0.066, 0)
      .paintWhere(sdf.box([0.07, 0.007, 0.2]).at(0, 0.052, 0.07), C.lace, 0.001)
      .paintWhere(sdf.box([0.07, 0.007, 0.2]).at(0, 0.075, 0.07), C.lace, 0.001)
      .paintWhere(sdf.box([0.07, 0.007, 0.2]).at(0, 0.098, 0.07), C.lace, 0.001)
      .rotateY(8)
      .at(ANKLE[0], 0, 0)
      .bone('shin.L');
    const foot = sdf
      .smoothUnion(0.025, sdf.ellipsoid([0.058, 0.05, 0.1]).at(0, 0.047, 0.042), sdf.sphere(0.052).at(0, 0.052, -0.004))
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('boots', pair(sdf.smoothUnion(0.012, shaft, foot)), { color: C.boot, roughness: 0.55, detail: 0.004 });

    // ------------------------------------------------------------------ the cane in the right fist
    const gR = h.arms.R.GRIP;
    const cx = -gR[0];
    const cz = gR[2];
    const top = gR[1] + 0.05;
    const tip = 0.08;
    const shaftC = sdf.capsule([cx, tip, cz], [cx, top, cz], 0.016);
    const crook = sdf.chain(
      [
        [cx, top - 0.01, cz, 0.016],
        [cx, top + 0.02, cz + 0.004, 0.017],
        [cx, top + 0.038, cz + 0.026, 0.017],
        [cx, top + 0.034, cz + 0.055, 0.017],
        [cx, top + 0.012, cz + 0.07, 0.016],
      ],
      0.01,
    );
    const cane = sdf
      .smoothUnion(0.01, shaftC, crook)
      .paintWhere(sdf.box([0.2, 0.05, 0.2]).at(cx, tip + 0.01, cz), C.boot, 0.004)
      .bone('knife.R');
    k.body('cane', cane, {
      color: C.cane,
      roughness: 0.75,
      detail: 0.004,
      bump: (x, y, z) => 0.002 * Math.sin(y * 70 + Math.sin(x * 40 + z * 30)),
    });

    // ------------------------------------------------------------------ the old steel helmet in the left fist
    const gL = h.arms.L.GRIP;
    const outer = sdf.revolve(
      profile.polygon(
        [
          [0, 0.078],
          [0.03, 0.073],
          [0.055, 0.058],
          [0.067, 0.035],
          [0.071, 0.012],
          [0.08, 0.004],
          [0.087, -0.002],
          [0.087, -0.01],
          [0, -0.01],
        ],
        { smooth: true, samples: 6 },
      ),
    );
    const inner = sdf.revolve(
      profile.polygon(
        [
          [0, 0.07],
          [0.027, 0.065],
          [0.048, 0.052],
          [0.059, 0.031],
          [0.063, 0.012],
          [0.063, -0.02],
          [0, -0.02],
        ],
        { smooth: true, samples: 6 },
      ),
    );
    const dentAt: [number, number, number] = [0.0477, 0.0913, 0.0235];
    const helmShell = outer
      .subtract(inner)
      .subtract(sdf.sphere(0.03).at(...dentAt))
      .paintWhere(sdf.cone([0, 0.07, 0], [0, 0.108, 0], 0.016, 0.004), C.brass, 0.002)
      .paintWhere(sdf.union(...[0.055, 0, -0.055].map((z) => sdf.sphere(0.009).at(0.066, 0.03, z))), C.brass, 0.001)
      .paintWhere(sdf.union(...[-0.02, 0, 0.02].map((x) => sdf.box([0.011, 0.008, 0.3]).at(x, 0.045, 0))), C.slot, 0.001);
    const helmet = sdf
      .smoothUnion(0.006, helmShell, sdf.cone([0, 0.074, 0], [0, 0.108, 0], 0.014, 0.003))
      .scale(1.2)
      .rotateZ(-25)
      .at(gL[0] + 0.07, gL[1] - 0.03, gL[2])
      .bone('knife.L');
    k.body('helmet', helmet, { color: C.steel, roughness: 0.5, metalness: 0.7, detail: 0.004 });
  },
});
