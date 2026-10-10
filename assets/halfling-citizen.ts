import { profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Halfling citizen — Chibi Quest fantasy-peoples NPC (catalog `npcs/fantasy-peoples/halfling-citizen`),
 * about 0.85 m to the top of the hair bun, faces +Z. Target: docs/npc-mockups/halfling-citizen_001.jpg.
 *
 * Role: a cheerful hill-village halfling who loves food and gives cooking errands; seen in 3D and as
 *   a 128 px sprite; the big lattice berry pie, the curly hair bun with the green bow, and the big
 *   bare feet must read.
 * One idea: a plump little halfling whose curly chestnut hair, pointed ears, and huge berry pie are
 *   bigger than the rest of her, standing on big bare feet with furry ankles.
 * Shape language: round and soft (curls, cheeks, feet, pie), with the pointed ears as the spikes.
 * Palette (60/30/10): white blouse #f6f1ea and mustard waistcoat #d0a030; green skirt #4a7a44 (cloth slot);
 *   chestnut hair #7a4a2c; the pie: crust #d8a060, berries #8a2a4a, tin #c8ccd4; green ribbon #3f6a44.
 * Built on the humanoid kind (rig, clips) at 0.85 size: everything below is in the kind's units. Both
 *   fists hold the pie (`hold`), and the pie is tilted up toward the viewer on `hand.R`.
 */

// The two-hand hold (left arm; the right mirrors it): the fists on the sides of the pie.
const HOLD_ELBOW = [0.165, 0.328, 0.045] as const;
const HOLD_WRIST = [0.15, 0.298, 0.15] as const;
// The pie: its center, its tilt (the top edge toward the chest), and its radius.
const PIE = { y: 0.28, z: 0.226, tilt: 36, r: 0.15 };

const C = {
  blouse: '#f6f1ea',
  cuff: '#e6dccb',
  vest: '#d0a030',
  vestDark: '#b88a28',
  button: '#6b4226',
  ribbon: '#3f6a44',
  tin: '#c8ccd4',
  crust: '#d8a060',
  crustTop: '#e6b573',
  berry: '#8a2a4a',
  berryHi: '#a8386a',
  mouth: '#8a3a32',
};

type V3 = readonly [number, number, number];

export default scaleAsset(
  humanoidAsset({
    name: 'halfling-citizen',
    description:
      'A cheerful, plump halfling with curly chestnut hair tied up with a green bow, pointed ears, rosy cheeks, a white blouse with puffed sleeves, a mustard waistcoat, a green skirt, and big bare feet with furry ankles, holding a big round lattice berry pie in both hands.',
    reference: 'docs/npc-mockups/halfling-citizen_001.jpg',
    variants: {
      skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
      hair: { chestnut: '#7a4a2c', brown: '#5a301d', auburn: '#8e3b1c', blond: '#c4974a', black: '#231a17' },
      eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
      cloth: { moss: '#4a7a44', rust: '#a5583a', plum: '#7a4a6a', slate: '#4f6578' },
    },
    presets: {
      festival: { skin: 'tan', hair: 'auburn', eyes: 'green', cloth: 'plum' },
    },
    hair: false,
    undershirt: false,
    pants: false,
    shoes: false,
    hold: { elbow: HOLD_ELBOW, wrist: HOLD_WRIST },

    // A big warm closed smile with dimples, and rosy round cheeks.
    paintSkin(skin, h) {
      const oldSmile = sdf.extrude(profile.arc(0.07, 0.03, 236, 304), 0.3).at(0, 0.53 + 0.07, 0.1);
      const smile = h.onFace(sdf.extrude(profile.arc(0.085, 0.018, 241, 299), 0.3), 0, 0.538 + 0.085);
      const dimples = sdf.union(...[-1, 1].map((s) => h.onFace(sdf.sphere(0.0075), s * 0.062, 0.562)));
      const cheeks = sdf.union(...[-1, 1].map((s) => h.onFace(sdf.sphere(0.04), s * 0.138, 0.56)));
      return skin
        .paintWhere(oldSmile, h.tint.skin!, 0.002)
        .paintWhere(cheeks, h.tint.blush!, 0.03)
        .paintWhere(smile, C.mouth, 0.002)
        .paintWhere(dimples, C.mouth, 0.002);
    },

    extra(k, h) {
      const { SHOULDER, ANKLE, HEAD_Y } = h.joints;
      const pair = (s: sdf.Shape) => s.mirror('x');
      const lerp = (a: readonly number[], b: readonly number[], t: number): V3 => [
        a[0]! + (b[0]! - a[0]!) * t,
        a[1]! + (b[1]! - a[1]!) * t,
        a[2]! + (b[2]! - a[2]!) * t,
      ];
      const hairColor = k.tint('hair');
      const rad = Math.PI / 180;

      // ------------------------------------------------------------------ hair: a cap, swept curls, a bun, and a bow
      const headPose = (s: sdf.Shape) => s.at(0, HEAD_Y, 0).bone('head');
      // A point on the head ellipsoid (azimuth from the front, elevation), scaled out by s.
      const hp = (az: number, el: number, s = 1): V3 => [
        0.205 * s * Math.cos(el * rad) * Math.sin(az * rad),
        0.2 * s * Math.sin(el * rad),
        0.19 * s * Math.cos(el * rad) * Math.cos(az * rad),
      ];
      const withR = (p: V3, r: number): [number, number, number, number] => [p[0], p[1], p[2], r];

      const shell = sdf.ellipsoid([0.214, 0.208, 0.2]);
      const top = shell.smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], -0.088));
      const back = shell.smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], 0.035)).smoothIntersect(0.03, sdf.halfSpace([0, 0, 1], 0.04));
      const temples = shell
        .smoothIntersect(0.015, sdf.halfSpace([0, -1, 0], 0.02))
        .smoothIntersect(0.015, sdf.halfSpace([-1, 0, 0], -0.15).mirror('x'))
        .smoothIntersect(0.015, sdf.halfSpace([0, 0, 1], 0.12));
      const cap = sdf.smoothUnion(0.015, top, back, temples);

      // The fringe: ten curled locks swept from a side parting down over the forehead to the temples.
      const fringeAt = [-86, -68, -50, -32, -14, 6, 24, 42, 62, 82];
      const fringe = fringeAt.map((a) => {
        const sgn = a < 0 ? -1 : 1;
        const eEnd = 27 - Math.max(0, Math.abs(a) - 40) * 0.5;
        return sdf.chain(
          [
            withR(hp(a * 0.12, 68, 1.02), 0.035),
            withR(hp(a * 0.55, 46, 1.07), 0.034),
            withR(hp(a * 0.92, (46 + eEnd) / 2, 1.09), 0.031),
            withR(hp(a * 1.0 + sgn * 4, eEnd, 1.1), 0.026),
            withR(hp(a * 1.0 + sgn * 9, eEnd + 4, 1.15), 0.018),
          ],
          0.012,
        );
      });
      // Ringlets hanging in front of the ears, a row of tips at the nape, and loose curls at the back.
      const ringlet = (s: number) =>
        sdf.chain(
          [
            [s * 0.19, 0.03, 0.075, 0.026],
            [s * 0.206, -0.03, 0.08, 0.023],
            [s * 0.214, -0.09, 0.075, 0.02],
            [s * 0.208, -0.14, 0.066, 0.017],
            [s * 0.196, -0.158, 0.074, 0.012],
          ],
          0.01,
        );
      const tips = sdf.union(
        ...[-78, -58, -39, -20, 0, 20, 39, 58, 78].map((a, i) =>
        sdf.sphere(i % 2 ? 0.036 : 0.044).at(0.18 * Math.sin(a * rad), (i % 2 ? -0.03 : -0.016), -0.165 * Math.cos(a * rad)),
      ),
      );
      // The bun on the crown, wrapped in curls.
      const BUN = [0, 0.262, -0.06] as const;
      const bunCurls = [0, 60, 120, 180, 240, 300].map((deg) => {
        const c = Math.cos(deg * rad);
        const s = Math.sin(deg * rad);
        const at = (r: number, y: number, rr: number): [number, number, number, number] => [BUN[0] + r * c, BUN[1] + y, BUN[2] + r * s, rr];
        return sdf.chain([at(0.03, 0.05, 0.03), at(0.075, 0.03, 0.029), at(0.1, -0.015, 0.025), at(0.088, -0.055, 0.018)], 0.01);
      });
      const bun = sdf.smoothUnion(0.02, sdf.sphere(0.082).at(...BUN), sdf.sphere(0.055).at(0, 0.318, -0.05));
      const hair = headPose(
        sdf.smoothUnion(0.012, cap, tips, bun, ...bunCurls, ringlet(1), ringlet(-1), ...fringe),
      );
      k.body('hair', hair, { color: hairColor, roughness: 0.6, detail: 0.005, textureDensity: 1.5, bump: (x, y, z) => 0.004 * Math.sin(x * 95 + Math.sin(y * 70) * 2) * Math.cos(z * 85 + y * 40) });

      // The green bow on the bun.
      const loop = (s: number) => sdf.ellipsoid([0.05, 0.019, 0.026]).rotateZ(s * 18).at(s * 0.05, 0.352, -0.035);
      const bow = headPose(
        sdf.smoothUnion(0.006, loop(1), loop(-1), sdf.sphere(0.02).at(0, 0.348, -0.035), sdf.cone([0.0, 0.345, -0.04], [0.025, 0.3, -0.06], 0.012, 0.008)),
      );
      k.body('bow', bow, { color: C.ribbon, roughness: 0.7, detail: 0.004 });

      // ------------------------------------------------------------------ pointed ears
      const earBase = sdf.cone([0, 0, 0], [0.135, 0.085, 0], 0.036, 0.007).scale([1, 1, 0.38]);
      const earInner = sdf.cone([0.012, 0.004, 0], [0.11, 0.07, 0], 0.022, 0.003).scale([1, 1, 2.5]);
      const ear = pair(
        earBase
          .paintWhere(earInner, h.tint.blush!, 0.006)
          .rotateY(-14)
          .at(0.188, -0.068, -0.012),
      );
      k.body('ears', headPose(ear), { color: h.tint.skin!, roughness: 0.55, detail: 0.004, textureDensity: 1.5 });

      // ------------------------------------------------------------------ blouse with puffed sleeves
      const sleeves = h.perArm((j) =>
        sdf.smoothUnion(
          0.02,
          sdf.cone(lerp(SHOULDER, j.ELBOW, -0.08), j.ELBOW, 0.055, 0.056).bone('upperarm.L'),
          sdf.sphere(0.062).at(...lerp(SHOULDER, j.ELBOW, 0.45)).bone('upperarm.L'),
          sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.92), 0.054, 0.048).bone('forearm.L'),
        ),
      );
      const blouse = sdf.smoothUnion(0.012, h.weighted(h.torso.round(0.005)), sleeves);
      k.body('blouse', blouse, { color: C.blouse, roughness: 0.88, detail: 0.005 });
      const cuffs = h.perArm((j) => sdf.cone(lerp(j.ELBOW, j.WRIST, 0.78), lerp(j.ELBOW, j.WRIST, 1.02), 0.049, 0.05).round(0.003).bone('forearm.L'));
      const collar = sdf.torus(0.06, 0.016).at(0, 0.452, -0.012).bone('chest');
      k.body('cuffs', cuffs, { color: C.cuff, roughness: 0.88, detail: 0.004 });
      k.body('collar', collar, { color: C.ribbon, roughness: 0.8, detail: 0.004 });

      // ------------------------------------------------------------------ mustard waistcoat with a scalloped, flared hem
      const vestTop = h.torso.round(0.012).subtract(h.torso.round(-0.003)).intersect(h.band(0.27, 0.425));
      const peplumOuter = sdf
        .revolve(
          profile.polygon(
            [
              [0, 0.31],
              [0.134, 0.31],
              [0.15, 0.28],
              [0.164, 0.255],
              [0.176, 0.222],
              [0, 0.222],
            ],
            { smooth: true, samples: 8 },
          ),
        )
        .scale([1, 1, 0.82]);
      const peplumInner = sdf
        .revolve(
          profile.polygon(
            [
              [0, 0.32],
              [0.121, 0.32],
              [0.137, 0.28],
              [0.151, 0.255],
              [0.163, 0.216],
              [0, 0.216],
            ],
            { smooth: true, samples: 8 },
          ),
        )
        .scale([1, 1, 0.8]);
      // Scallop notches in the hem, between the lobes.
      const notches = sdf.union(
        ...[-126, -90, -54, -18, 18, 54, 90, 126].map((a) => sdf.sphere(0.02).at(0.19 * Math.sin(a * rad), 0.222, 0.155 * Math.cos(a * rad))),
      );
      const peplum = peplumOuter.subtract(peplumInner).subtract(notches);
      const vOpen = sdf.extrude(profile.polygon([[-0.04, 0.44], [0.04, 0.44], [0, 0.34]]), 0.3).at(0, 0, 0.2);
      const vest = sdf.smoothUnion(0.008, h.weighted(vestTop.subtract(vOpen)), h.weighted(peplum)).paintWhere(h.band(0.222, 0.232), C.vestDark, 0.004);
      k.body('vest', vest, { color: C.vest, roughness: 0.8, detail: 0.0055 });
      // Big brown buttons on the hem lobes.
      const buttonAt = (x: number) => {
        const z = sdf.raycast(vest, [x, 0.25, 1], [0, 0, -1]);
        return sdf.sphere(0.017).at(x, 0.25, (z ? z[2] : 0.12) + 0.004).bone('spine');
      };
      k.body('buttons', sdf.union(buttonAt(0.09), buttonAt(-0.09), buttonAt(0.15), buttonAt(-0.15)), { color: C.button, roughness: 0.6, detail: 0.004 });

      // ------------------------------------------------------------------ green skirt to the knee
      const skirtOuter = sdf
        .revolve(
          profile.polygon(
            [
              [0, 0.27],
              [0.14, 0.27],
              [0.158, 0.235],
              [0.18, 0.2],
              [0.196, 0.17],
              [0.205, 0.142],
              [0, 0.142],
            ],
            { smooth: true, samples: 8 },
          ),
        )
        .scale([1, 1, 0.82]);
      const skirt = skirtOuter.paintWhere(h.band(0.142, 0.156), h.tint.trim!, 0.004);
      k.body('skirt', h.weighted(skirt), { color: h.tint.shirt!, roughness: 0.88, detail: 0.005 });

      // ------------------------------------------------------------------ big bare feet with toes
      const toes = sdf.union(
        sdf.sphere(0.027).at(-0.026, 0.026, 0.158), // big toe (inner side)
        sdf.sphere(0.02).at(-0.002, 0.021, 0.164),
        sdf.sphere(0.018).at(0.02, 0.02, 0.157),
        sdf.sphere(0.016).at(0.038, 0.019, 0.145),
        sdf.sphere(0.014).at(0.052, 0.018, 0.128),
      );
      const foot = sdf
        .smoothUnion(
          0.016,
          sdf.ellipsoid([0.058, 0.042, 0.104]).at(0, 0.04, 0.042),
          sdf.sphere(0.05).at(0, 0.056, -0.012),
          toes,
        )
        .intersect(sdf.halfSpace([0, -1, 0], 0))
        .rotateY(10)
        .at(ANKLE[0], 0, 0)
        .bone('foot.L');
      k.body('feet', pair(foot), { color: h.tint.skin!, roughness: 0.55, detail: 0.005, textureDensity: 1.5 });

      // Curly hair tufts in a ring above each ankle.
      const tuft = (deg: number) => {
        const c = Math.cos(deg * rad);
        const s = Math.sin(deg * rad);
        const at = (r: number, y: number, rr: number): [number, number, number, number] => [r * c, y, r * s, rr];
        return sdf.chain([at(0.03, 0.118, 0.016), at(0.052, 0.112, 0.018), at(0.062, 0.094, 0.016), at(0.052, 0.074, 0.012)], 0.008);
      };
      const ring = sdf.union(...[0, 45, 90, 135, 180, 225, 270, 315].map(tuft), sdf.torus(0.04, 0.018).at(0, 0.105, 0));
      k.body('footfur', pair(ring.at(ANKLE[0], 0, 0).bone('shin.L')), { color: hairColor, roughness: 0.65, detail: 0.006 });

      // ------------------------------------------------------------------ the berry pie in both hands
      // Built flat around its center (up = +Y), then tilted so the lattice faces the viewer and held on hand.R.
      const pieAt = (s: sdf.Shape) => s.rotateX(PIE.tilt).at(0, PIE.y, PIE.z).bone('hand.R');
      const R = PIE.r;
      const tin = sdf.revolve(
        profile.polygon(
          [
            [0, -0.026],
            [R - 0.03, -0.026],
            [R - 0.008, 0.004],
            [R + 0.008, 0.016],
            [R + 0.006, 0.006],
            [0, 0.006],
          ],
          { smooth: false },
        ),
      );
      k.body('pietin', pieAt(tin), { color: C.tin, roughness: 0.4, metalness: 0.8, detail: 0.005 });

      const fill = sdf.smoothUnion(
        0.01,
        sdf.ellipsoid([R - 0.01, 0.026, R - 0.01]).at(0, 0.012, 0),
        ...[-2, -1, 0, 1, 2].flatMap((i) =>
          [-2, -1, 0, 1, 2]
            .filter((j) => Math.hypot(i, j) < 2.5)
            .map((j) => sdf.sphere(0.02).at(i * 0.0475, 0.034, j * 0.0475)),
        ),
      );
      k.body('berries', pieAt(fill.paint(C.berry)), { color: C.berry, roughness: 0.45, detail: 0.005 });

      const bars = (dir: 'x' | 'z', lift: number) =>
        sdf.union(
          ...[-0.07, -0.0235, 0.0235, 0.07].map((p) =>
            (dir === 'x' ? sdf.box([2 * R, 0.014, 0.022], 0.005).at(0, 0.034 + lift, p) : sdf.box([0.022, 0.014, 2 * R], 0.005).at(p, 0.034 + lift, 0)),
          ),
        );
      const lattice = sdf
        .union(bars('x', 0), bars('z', 0.004))
        .intersect(sdf.cylinder(R - 0.002, 0.2, 0.004));
      const crustRing = sdf.torus(R - 0.012, 0.016).at(0, 0.014, 0);
      const crust = sdf.smoothUnion(0.006, lattice, crustRing).paintWhere(sdf.halfSpace([0, -1, 0], -0.036).intersect(sdf.box([1, 1, 1]).at(0, 0.04, 0)), C.crustTop, 0.004);
      k.body('piecrust', pieAt(crust), {
        color: C.crust,
        roughness: 0.78,
        detail: 0.0045,
        bump: (x, y, z) => 0.002 * Math.sin(x * 140 + z * 90) * Math.cos(z * 120 - y * 80),
      });

    },
  }),
  0.85,
);
