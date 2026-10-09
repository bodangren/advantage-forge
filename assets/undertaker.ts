import { profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Undertaker — Chibi Quest settlement NPC (catalog `npcs/settlement/undertaker`), about 1.05 m to the
 * top of the top hat, faces +Z. Target: docs/npc-mockups/undertaker_001.jpg. Built on the humanoid kind.
 *
 * Role: the graveyard keeper who tells gentle ghost legends; seen at the chapel and the cemetery in 3D
 *   and as a 128 px sprite. The tall hat, the white lily, and the blue-glowing lantern must read.
 * One idea: a calm, kind boy in black under a very tall stovepipe hat, with a soft gray scarf, a white
 *   lily in one hand, and a lantern with a blue glow in the other.
 * Shape language: square and upright (the tall hat, the long coat), softened by round buttons, the
 *   soft scarf, and the petals of the lily.
 * Palette (60/30/10): near black #232228 (hat, trousers, shoes) and charcoal #34323c (coat) with
 *   #4a4852 edges; gray #8a8890 scarf and #6a6870 hat band; silver #c8ccd4 buttons; accents: the white
 *   lily #f6f1ea and the blue glow #a8d0ff.
 * Value plan: all dark mass with the pale face, the gray scarf, the white flower, and the glow as the lights.
 * Bodies: skin, hat, hatband, hair, coat, vest, jabot, buttons, scarf, trousers, shoes, stem, lily,
 *   lantern, glow.
 * Rig: the humanoid kind's skeleton and clips. The right arm holds the lily in a posed arm in every
 *   clip (rigid on `knife.R`); the left hand swings and the lantern hangs rigid on `knife.L`.
 */

const C = {
  hat: '#232228',
  band: '#6a6870',
  scarf: '#8a8890',
  edge: '#4a4852',
  button: '#c8ccd4',
  dark: '#232228',
  petal: '#f6f1ea',
  heart: '#e0c040',
  stem: '#36603f',
  iron: '#4a4448',
  glow: '#a8d0ff',
};

export default humanoidAsset({
  name: 'undertaker',
  description: 'A calm, kind undertaker in a tall black hat and a long dark coat, with a gray scarf, a white lily, and a blue-glowing lantern.',
  reference: 'docs/npc-mockups/undertaker_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { black: '#231a17', brown: '#5a301d', blond: '#c4974a', auburn: '#8e3b1c', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { charcoal: '#34323c', plum: '#4a3446', slate: '#3a4452', pine: '#34403a' },
  },
  presets: {
    keeper: { skin: 'fair', hair: 'black', eyes: 'brown', cloth: 'charcoal' },
    dusk: { skin: 'light', hair: 'brown', eyes: 'hazel', cloth: 'plum' },
  },
  hair: false,
  undershirt: false,
  pants: false,
  shoes: false,
  lashes: false,
  // The right hand (x < 0) holds the lily up at the chest; the left hand hangs with the lantern.
  pose: { R: { elbow: [0.17, 0.335, 0.05], wrist: [0.2, 0.33, 0.15] } },

  extra(k, h) {
    const { SHOULDER, HIP, KNEE, ANKLE, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];
    const coatColor = h.tint.shirt!;
    const edge = k.tint('cloth', { color: C.edge, follow: 1 });
    const hairColor = k.tint('hair');

    // ------------------------------------------------------------------ the top hat
    const hatPose = (s: sdf.Shape) => s.rotateX(-5).at(0, HEAD_Y, 0);
    const crown = sdf.revolve(
      profile.polygon(
        [
          [0, 0.09],
          [0.19, 0.09],
          [0.192, 0.2],
          [0.198, 0.34],
          [0.19, 0.372],
          [0.16, 0.378],
          [0, 0.378],
        ],
        { smooth: true, samples: 6 },
      ),
    );
    const brim = sdf.revolve(
      profile.polygon(
        [
          [0.15, 0.08],
          [0.28, 0.086],
          [0.292, 0.098],
          [0.278, 0.108],
          [0.2, 0.102],
          [0.15, 0.106],
        ],
        { smooth: true, samples: 6 },
      ),
    );
    k.body('hat', hatPose(sdf.smoothUnion(0.012, crown, brim)).bone('head'), {
      color: C.hat,
      roughness: 0.75,
      detail: 0.005,
      bump: (x, y, z) => 0.0015 * Math.sin(x * 70 + y * 20) * Math.cos(z * 60),
    });
    const band = sdf.revolve(
      profile.polygon(
        [
          [0.17, 0.1],
          [0.2, 0.1],
          [0.204, 0.13],
          [0.2, 0.165],
          [0.17, 0.165],
        ],
        { smooth: false },
      ),
    );
    k.body('hatband', hatPose(band.round(0.003)).bone('head'), { color: C.band, roughness: 0.8, detail: 0.006 });

    // ------------------------------------------------------------------ hair: a small cap, fringe locks, side locks, nape
    const at = (s: sdf.Shape) => s.at(0, HEAD_Y, 0);
    const shell = sdf.ellipsoid([0.213, 0.208, 0.198]);
    const back = shell.smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], 0.06)).smoothIntersect(0.03, sdf.halfSpace([0, 0, 1], -0.02));
    const frontCap = shell.smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], -0.07)).smoothIntersect(0.02, sdf.halfSpace([0, 0, -1], 0.02));
    const temples = shell
      .smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], 0.03))
      .smoothIntersect(0.02, sdf.halfSpace([-1, 0, 0], -0.155).mirror('x'))
      .smoothIntersect(0.02, sdf.halfSpace([0, 0, 1], 0.07));
    const tips = sdf.union(
      ...[-78, -52, -26, 0, 26, 52, 78].map((a) => sdf.sphere(0.026).at(0.185 * Math.sin((a * Math.PI) / 180), -0.075, -0.17 * Math.cos((a * Math.PI) / 180))),
    );
    const cap = at(sdf.smoothUnion(0.015, back, frontCap, temples, tips));
    // Fringe: spiky locks that hang from under the brim to the brow line, swept to one side.
    const lock = (x: number, tipX: number, tipY: number, r: number) => {
      const zAt = (px: number, py: number) => sdf.raycast(h.head, [Math.abs(px), py, 1], [0, 0, -1])?.[2] ?? 0.05;
      const y0 = HEAD_Y + 0.13;
      const y1 = (y0 + tipY) / 2 + 0.01;
      return sdf.chain(
        [
          [x, y0, zAt(x, y0) - 0.012, r],
          [(x + tipX) / 2, y1, zAt((x + tipX) / 2, y1) + 0.004, r * 0.85],
          [tipX, tipY, zAt(tipX, tipY) + 0.004, r * 0.3],
        ],
        0.012,
      );
    };
    const fringe = sdf.union(
      lock(-0.17, -0.185, 0.745, 0.024),
      lock(-0.12, -0.14, 0.738, 0.026),
      lock(-0.07, -0.085, 0.744, 0.025),
      lock(-0.02, -0.005, 0.722, 0.026),
      lock(0.035, 0.06, 0.736, 0.026),
      lock(0.09, 0.115, 0.742, 0.025),
      lock(0.14, 0.165, 0.738, 0.025),
      lock(0.18, 0.19, 0.748, 0.022),
    );
    // Side locks: a sideburn before the ear and a long lock behind it that curls out at the jaw.
    const sideLock = pair(
      sdf.smoothUnion(
        0.012,
        sdf.chain(
          [
            [0.188, 0.76, 0.06, 0.022],
            [0.192, 0.69, 0.07, 0.019],
            [0.185, 0.63, 0.085, 0.015],
          ],
          0.01,
        ),
        sdf.chain(
          [
            [0.19, 0.76, -0.07, 0.027],
            [0.205, 0.68, -0.07, 0.027],
            [0.208, 0.6, -0.06, 0.026],
            [0.2, 0.55, -0.045, 0.024],
            [0.212, 0.52, -0.035, 0.018],
            [0.228, 0.515, -0.02, 0.011],
          ],
          0.014,
        ),
      ),
    );
    const nape = pair(
      sdf.chain(
        [
          [0.1, 0.62, -0.17, 0.03],
          [0.14, 0.56, -0.15, 0.026],
          [0.17, 0.53, -0.125, 0.017],
          [0.185, 0.52, -0.11, 0.01],
        ],
        0.012,
      ),
    );
    k.body('hair', sdf.smoothUnion(0.012, cap, fringe, sideLock, nape).bone('head'), { color: hairColor, roughness: 0.55, detail: 0.004 });

    // ------------------------------------------------------------------ the long coat
    // The torso with long sleeves and a hollow skirt to just below the knee; the front opens on the vest
    // and the back splits so the legs swing free.
    const sleeve = h.perArm((j) =>
      sdf
        .smoothUnion(
          0.02,
          sdf.cone(lerp(SHOULDER, j.ELBOW, -0.12), j.ELBOW, 0.056, 0.052).bone('upperarm.L'),
          sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.9), 0.052, 0.05).bone('forearm.L'),
        )
        .paintWhere(sdf.capsule(lerp(j.ELBOW, j.WRIST, 0.78), lerp(j.ELBOW, j.WRIST, 1.1), 0.09), edge, 0.002),
    );
    const skirtProfile = (inset: number) =>
      sdf
        .revolve(
          profile.polygon(
            [
              [0, 0.3],
              [0.136 - inset, 0.3],
              [0.146 - inset, 0.26],
              [0.158 - inset, 0.2],
              [0.172 - inset, 0.14],
              [0.18 - inset, 0.098 - (inset > 0 ? 0.02 : 0)],
              [0, 0.098 - (inset > 0 ? 0.02 : 0)],
            ],
            { smooth: true, samples: 8 },
          ),
        )
        .scale([1, 1, 0.95]);
    const skirt = skirtProfile(0).subtract(skirtProfile(0.012));
    const coatTorso = h.torso.round(0.014);
    const opening = sdf.box([0.08, 0.36, 0.3], 0.008).at(0, 0.27, 0.15);
    const openingEdge = sdf.box([0.1, 0.4, 0.4]).at(0, 0.27, 0.2);
    const vent = sdf.box([0.04, 0.11, 0.2], 0.008).at(0, 0.15, -0.16);
    const coatBase = sdf.smoothUnion(0.014, h.weighted(coatTorso), sleeve, h.weighted(skirt)).subtract(opening).subtract(vent);
    const coat = coatBase.paintWhere(openingEdge, edge, 0.002).paintWhere(sdf.box([1, 0.224, 1]).at(0, 0.0, 0), edge, 0.002);
    k.body('coat', coat, {
      color: coatColor,
      roughness: 0.9,
      detail: 0.005,
      bump: (x, y, z) => 0.002 * Math.sin(y * 80 + Math.atan2(x, z) * 10) * Math.cos(x * 30),
    });

    // The vest under the open coat: it also covers the waist at the split back.
    const vestShape = h.weighted(h.torso.round(0.004)).intersect(h.band(0.15, 0.46));
    k.body('vest', vestShape, { color: C.dark, roughness: 0.8, detail: 0.005 });

    // The small white jabot (a ruffled cravat) at the chest, and two tiny buttons below it.
    const vz = (y: number) => sdf.raycast(h.torso.round(0.004), [0, y, 1], [0, 0, -1])?.[2] ?? 0.09;
    const jabot = sdf.smoothUnion(
      0.008,
      sdf.ellipsoid([0.026, 0.02, 0.014]).at(0, 0.405, vz(0.405) + 0.004),
      sdf.ellipsoid([0.02, 0.018, 0.013]).at(-0.012, 0.382, vz(0.382) + 0.003),
      sdf.ellipsoid([0.02, 0.018, 0.013]).at(0.012, 0.382, vz(0.382) + 0.003),
      sdf.ellipsoid([0.014, 0.016, 0.012]).at(0, 0.362, vz(0.362) + 0.003),
    );
    k.body('jabot', jabot.bone('chest'), { color: C.petal, roughness: 0.9, detail: 0.003 });

    // Three big silver buttons on the right panel of the coat (x > 0), on the surface.
    const coatSurface = h.torso.round(0.014);
    const buttonAt = (y: number) => {
      const z = sdf.raycast(coatSurface, [0.07, y, 1], [0, 0, -1])?.[2] ?? 0.1;
      return sdf.ellipsoid([0.022, 0.022, 0.012]).at(0.07, y, z + 0.001);
    };
    k.body('buttons', sdf.union(buttonAt(0.375), buttonAt(0.305), buttonAt(0.235)).bone('chest'), {
      color: C.button,
      roughness: 0.3,
      metalness: 0.8,
      detail: 0.003,
    });

    // ------------------------------------------------------------------ the gray scarf: a neck wrap and one long tail
    const coatOuter = sdf.smoothUnion(0.014, coatTorso, skirtProfile(0));
    const tail = coatOuter
      .round(0.012)
      .subtract(coatOuter.round(0.002))
      .intersect(sdf.box([0.06, 0.34, 0.4], 0.012).at(-0.085, 0.29, 0.2));
    const wrap = sdf.smoothUnion(
      0.02,
      sdf.torus(0.088, 0.034).scale([1, 1, 0.95]).at(0, 0.432, -0.006),
      sdf.ellipsoid([0.158, 0.034, 0.118]).at(0, 0.41, 0.0),
      sdf.ellipsoid([0.115, 0.03, 0.095]).at(0, 0.39, 0.03),
    );
    k.body('scarf', sdf.smoothUnion(0.02, wrap, tail).bone('chest'), {
      color: C.scarf,
      roughness: 0.95,
      detail: 0.005,
      bump: (x, y, z) => 0.0025 * Math.sin(x * 230 + z * 60) * (0.6 + 0.4 * Math.sin(y * 40)),
    });

    // ------------------------------------------------------------------ black trousers and shoes
    const trouserLeg = sdf.smoothUnion(
      0.012,
      sdf.capsule(HIP, KNEE, 0.05).bone('leg.L'),
      sdf.cone(KNEE, [ANKLE[0], 0.085, 0.002], 0.048, 0.044).bone('shin.L'),
    );
    const waist = h.weighted(h.torso.round(0.006)).intersect(h.band(0.14, 0.248));
    k.body('trousers', sdf.smoothUnion(0.03, sdf.ellipsoid([0.118, 0.052, 0.088]).at(0, 0.2, 0).bone('hips'), pair(trouserLeg), waist), {
      color: C.dark,
      roughness: 0.85,
    });
    const shoe = sdf
      .smoothUnion(
        0.022,
        sdf.cylinder(0.05, 0.05, 0.016).at(0, 0.065, 0),
        sdf.ellipsoid([0.056, 0.038, 0.096]).at(0, 0.036, 0.042),
        sdf.ellipsoid([0.04, 0.026, 0.05]).at(0, 0.028, 0.105), // the toe
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .rotateY(10)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('shoes', pair(shoe), { color: C.dark, roughness: 0.35, detail: 0.004 });

    // ------------------------------------------------------------------ the lily, in the right fist
    const gr = h.arms.R.GRIP;
    const g: [number, number, number] = [-gr[0], gr[1], gr[2]];
    const norm = (v: readonly number[]): [number, number, number] => {
      const l = Math.hypot(v[0]!, v[1]!, v[2]!);
      return [v[0]! / l, v[1]! / l, v[2]! / l];
    };
    const along = (a: readonly number[], d: readonly number[], t: number): [number, number, number] => [a[0]! + d[0]! * t, a[1]! + d[1]! * t, a[2]! + d[2]! * t];
    const dir = norm([-0.5, 0.82, 0.28]);
    const stemStart = along(g, dir, -0.045);
    const stemEnd = along(g, dir, 0.1);
    k.body(
      'stem',
      sdf.smoothUnion(0.006, sdf.capsule(stemStart, stemEnd, 0.0085), sdf.cone(along(g, dir, 0.07), along(g, dir, 0.125), 0.012, 0.016)).bone('knife.R'),
      { color: C.stem, roughness: 0.7, detail: 0.003 },
    );
    // The open flower: six petals around a yellow heart, the face turned forward and outward.
    const centre = along(g, dir, 0.125);
    const face = norm([-0.35, 0.2, 0.9]); // the flower's axis
    const ux = norm([face[2], 0, -face[0]]); // across the flower
    const uy: [number, number, number] = [face[1] * ux[2] - face[2] * ux[1], face[2] * ux[0] - face[0] * ux[2], face[0] * ux[1] - face[1] * ux[0]];
    const petal = (deg: number) => {
      const a = (deg * Math.PI) / 180;
      const d = norm([ux[0] * Math.cos(a) + uy[0] * Math.sin(a), ux[1] * Math.cos(a) + uy[1] * Math.sin(a), ux[2] * Math.cos(a) + uy[2] * Math.sin(a)]);
      const p1 = along(along(centre, d, 0.016), face, 0.002);
      const p2 = along(along(centre, d, 0.034), face, 0.009);
      const p3 = along(along(centre, d, 0.05), face, 0.017);
      return sdf.chain([[...centre, 0.008], [...p1, 0.0125], [...p2, 0.0115], [...p3, 0.005]], 0.006);
    };
    const flower = sdf.smoothUnion(0.005, ...[0, 60, 120, 180, 240, 300].map(petal)).paintWhere(sdf.sphere(0.014).at(...along(centre, face, 0.006)), C.heart, 0.004);
    k.body('lily', flower.bone('knife.R'), { color: C.petal, roughness: 0.6, detail: 0.003 });

    // ------------------------------------------------------------------ the lantern, hanging from the left fist
    const lg = h.arms.L.GRIP;
    const lx = lg[0] + 0.005;
    const lz = lg[2] + 0.015;
    const bottom = 0.035;
    const roofBase = 0.135;
    const frame = sdf.smoothUnion(
      0.006,
      sdf.cylinder(0.046, 0.026, 0.008).at(lx, bottom + 0.013, lz), // the base
      sdf.cone([lx, roofBase, lz], [lx, roofBase + 0.026, lz], 0.054, 0.016), // the roof
      sdf.torus(0.017, 0.0085).rotateZ(90).at(lx, roofBase + 0.04, lz), // the ring on the roof
      sdf.chain(
        [
          [lx, roofBase + 0.04, lz, 0.007],
          [lx + 0.01, 0.17, lz, 0.007],
          [lg[0] - 0.012, lg[1] + 0.008, lg[2] + 0.005, 0.008],
        ],
        0.004,
      ), // the bail up into the fist
      ...[0, 90, 180, 270].map((a) => {
        const r = 0.04;
        const px = lx + r * Math.cos((a * Math.PI) / 180);
        const pz = lz + r * Math.sin((a * Math.PI) / 180);
        return sdf.capsule([px, bottom + 0.016, pz], [px, roofBase + 0.002, pz], 0.007);
      }),
    );
    k.body('lantern', frame.bone('knife.L'), { color: C.iron, roughness: 0.5, metalness: 0.6, detail: 0.0045, maxTriangles: 6000 });
    const paneH = roofBase - bottom - 0.03;
    k.body('glow', sdf.cylinder(0.036, paneH, 0.012).at(lx, bottom + 0.022 + paneH / 2, lz).bone('knife.L'), {
      color: C.glow,
      emissive: C.glow,
      emissiveIntensity: 0.5,
      roughness: 0.3,
      detail: 0.004,
    });
  },
});
