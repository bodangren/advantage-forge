import { profile, rgb, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Baker (f5) — Chibi Quest settlement NPC (catalog `npcs/settlement/baker`), about 1.0 m to the top of
 * the chef hat, faces +Z. Target: docs/npc-mockups/baker_001.jpg. Built on the humanoid kind (the avatar
 * base's face and skeleton) with no hair, no undershirt, and no trousers of the kind's own.
 *
 * Role: a town NPC (the bakery), seen in 3D and as a 128 px sprite; the tall hat, the cream apron, the
 *   tray with two loaves, and the open smile must read.
 * One idea: a round, happy baker under a tall puffy chef hat, carrying a tray of bread at hip height.
 * Shape language: round and soft (the hat's puff, the loaves, the cheeks), with the flat square tray.
 * Palette (60/30/10): cream #f3ead6 hat, cuffs, socks; brown #8a5a3a shirt; cream #e8dcc0 apron;
 *   dark trousers #4a3428; tan shoes #c89a6a; wooden tray #9a6a3a; loaves #c88a3a with #e0a850 tops.
 * Value plan: the cream hat frames the light face (focal point); the brown shirt and the cream apron
 *   are the two big masses; the dark trousers ground the body.
 * Bodies: skin, hat (rigid on the head), hair tuft (rigid on the head), shirt (long sleeves, cream
 *   cuffs), apron (bib and skirt, two straps), shorts with cream socks, shoes, tray, loaves.
 * Rig: the humanoid kind's skeleton and clips (idle, walk, run, attack, hit, rest, cheer, cast). The
 *   tray is skinned to `knife.L` and `knife.R` (the grips in each fist), so both hands carry it.
 */

const C = {
  hat: '#f3ead6',
  hair: '#5a301d',
  apron: '#e8dcc0',
  trousers: '#4a3428',
  tray: '#9a6a3a',
  loaf: '#c88a3a',
  loafTop: '#e0a850',
  sesame: '#f6efd8',
  cream: '#f3ead6',
  mouth: '#7a2a26',
  teeth: '#fbf6ee',
};

type V3 = readonly [number, number, number];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

export default humanoidAsset({
  name: 'baker-f5',
  description:
    'Chibi village baker NPC: a tall puffy white chef hat with a brown hair tuft, a wide open smile, a brown shirt with cream cuffs, a cream bib apron, short brown trousers with cream socks, and a wooden tray with two loaves.',
  reference: 'docs/npc-mockups/baker_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { brown: '#5a301d', black: '#231a17', blond: '#c4974a', auburn: '#8e3b1c', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { brown: '#8a5a3a', sky: '#5f84ad', linen: '#cdbb94', moss: '#64773f', rose: '#a35d68', slate: '#5a6270' },
  },
  presets: {
    default: { skin: 'fair', hair: 'brown', eyes: 'brown', cloth: 'brown' },
    moss: { skin: 'tan', hair: 'black', eyes: 'hazel', cloth: 'moss' },
  },
  hair: false,
  undershirt: false,
  pants: false,
  shoes: '#c89a6a',
  // A wide open smile: the lower half of an ellipse with white teeth, over the kind's thin smile.
  paintSkin(skin) {
    const MOUTH_Y = 0.545;
    const open = sdf
      .extrude(profile.circle(0.044), 0.3)
      .scale([1, 0.78, 1])
      .at(0, MOUTH_Y, 0.1)
      .intersect(sdf.halfSpace([0, 1, 0], MOUTH_Y));
    const teeth = sdf.box([0.03, 0.008, 0.3], 0.002).at(0, MOUTH_Y - 0.003, 0.1).intersect(open);
    return skin.paintWhere(open, C.mouth).paintWhere(teeth, C.teeth);
  },
  extra(k, h) {
    const { SHOULDER, ELBOW, WRIST, HIP, KNEE, ANKLE, GRIP, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const detail = 0.006;

    // ------------------------------------------------------------------ chef hat: a band at the brow line and a puffed top
    const band = sdf.ellipsoid([0.225, 0.22, 0.21]).at(0, HEAD_Y, 0).intersect(h.band(0.772, 0.832)).round(0.006);
    const puff = sdf.ellipsoid([0.2, 0.16, 0.19]).at(0, 0.85, -0.012);
    const hat = sdf.smoothUnion(0.03, band, puff);
    k.body('hat', hat, { color: C.hat, roughness: 0.85, detail, bone: 'head' });

    // A little brown hair tuft on the band at the front, just above the forehead.
    const front = sdf.raycast(band, [0, 0.815, 1], [0, 0, -1]);
    const tz = front ? front[2] : 0.15;
    const tuft = sdf.smoothUnion(
      0.008,
      sdf.ellipsoid([0.04, 0.03, 0.034]).at(-0.016, 0.836, tz + 0.01),
      sdf.ellipsoid([0.034, 0.04, 0.032]).rotateZ(-20).at(0.02, 0.846, tz + 0.014),
      sdf.ellipsoid([0.028, 0.028, 0.026]).at(0.0, 0.872, tz + 0.002),
    );
    k.body('hair', tuft, { color: k.tint('hair'), roughness: 0.6, detail: 0.004, bone: 'head' });

    // ------------------------------------------------------------------ shirt: a long-sleeved brown shirt with cream rolled cuffs
    const shirtTorso = h.weighted(h.torso.round(0.004));
    const sleeveL = sdf.union(
      sdf.cone(SHOULDER, ELBOW, 0.046, 0.042).bone('upperarm.L'),
      sdf.cone(ELBOW, WRIST, 0.042, 0.037).bone('forearm.L'),
    );
    const cuffL = sdf
      .cone(lerp(ELBOW, WRIST, 0.8), lerp(ELBOW, WRIST, 0.96), 0.047, 0.045)
      .round(0.003)
      .paint(C.cream)
      .bone('forearm.L');
    const shirt = sdf.union(sdf.smoothUnion(0.012, shirtTorso, pair(sleeveL)), pair(cuffL));
    k.body('shirt', shirt, { color: h.tint.shirt ?? '#8a5a3a', roughness: 0.85, detail });

    // ------------------------------------------------------------------ apron: a cream bib and skirt with two straps
    // A shell of a flattened body of revolution, cut by the apron outline on the front (z >= 0).
    const apronBase = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.34],
            [0.12, 0.34],
            [0.128, 0.28],
            [0.138, 0.22],
            [0.148, 0.165],
            [0.152, 0.135],
            [0, 0.135],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.8]);
    const apronOutline = profile.polygon(
      [
        [-0.1, 0.33],
        [0.1, 0.33],
        [0.118, 0.25],
        [0.15, 0.135],
        [-0.15, 0.135],
        [-0.118, 0.25],
      ],
      { smooth: false },
    );
    const apronPanel = apronBase
      .round(0.011)
      .subtract(apronBase.round(0.005))
      .intersect(sdf.extrude(apronOutline, 0.6, 0.008).at(0, 0, 0.3));
    const straps = pair(sdf.capsule([0.075, 0.322, 0.112], [0.05, 0.425, 0.1], 0.011));
    const apron = h.weighted(sdf.union(apronPanel, straps));
    k.body('apron', apron, { color: C.apron, roughness: 0.9, detail });

    // ------------------------------------------------------------------ short trousers to the knee, with cream socks
    const shortsLeg = sdf.capsule(HIP, [KNEE[0], KNEE[1] + 0.015, 0], 0.05).bone('leg.L');
    const shorts = sdf.smoothUnion(0.03, sdf.ellipsoid([0.118, 0.056, 0.09]).at(0, 0.2, 0).bone('hips'), pair(shortsLeg));
    const sock = sdf.cone([KNEE[0], 0.104, 0], [ANKLE[0], 0.078, 0], 0.042, 0.04).paint(C.cream).bone('shin.L');
    k.body('shorts', sdf.union(shorts, pair(sock)), { color: C.trousers, roughness: 0.85, detail });

    // ------------------------------------------------------------------ the tray with two loaves
    // The tray is skinned to the two grips: each half follows its own fist, and the middle blends.
    const TRAY_Y = 0.2;
    const TRAY_Z = 0.14;
    const board = sdf.box([0.5, 0.022, 0.2], 0.007).at(0, TRAY_Y, TRAY_Z);
    const railL = sdf.capsule(GRIP, [GRIP[0] + 0.01, TRAY_Y - 0.004, TRAY_Z - 0.04], 0.013);
    const trayHalfL = sdf.union(board.intersect(sdf.halfSpace([-1, 0, 0], 0)), railL).bone('knife.L');
    const tray = trayHalfL.mirror('x');
    k.body('tray', tray, { color: C.tray, roughness: 0.7, detail });

    const loafA = sdf.ellipsoid([0.075, 0.05, 0.07]).at(-0.1, TRAY_Y + 0.06, TRAY_Z).bone('knife.R');
    const loafB = sdf.ellipsoid([0.07, 0.048, 0.065]).at(0.09, TRAY_Y + 0.058, TRAY_Z - 0.01).bone('knife.L');
    const loaves = sdf.union(loafA, loafB).paintFn((x, y, z, base) => {
      if (x < -0.02) return Math.sin(x * 160) * Math.sin(z * 160) > 0.92 ? rgb(C.sesame) : base; // the sesame loaf
      return y > TRAY_Y + 0.07 ? rgb(C.loafTop) : base;
    });
    k.body('loaves', loaves, { color: C.loaf, roughness: 0.8, detail });
  },
});
