import { profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';
import type { ArmJoints } from './parts/humanoid-kind.js';

/**
 * Tax collector — Chibi Quest settlement NPC (catalog `npcs/settlement/tax-collector`), about 1.05 m
 * to the top of the top hat, faces +Z. Target: docs/npc-mockups/tax-collector_001.jpg. Built on the
 * humanoid kind.
 *
 * Role: the town hall NPC who collects the town fee and gives counting quests; seen in 3D and as a
 *   128 px sprite. The tall hat, the big curled mustache, the open ledger, and the gold coin box must read.
 * One idea: a fussy, prim little man whose tall black hat and swept mustache sit over a gray pinstripe
 *   waistcoat, with a ledger in one hand and a coin box held up in the other.
 * Shape language: square and upright (hat, coat, ledger) with round forms in the face and the mustache.
 * Palette (60/30/10): near black #2a2428 (hat, trousers, shoes) and coat #3a3c44; waistcoat #6a6870 with
 *   #4a4448 stripes; shirt #f6f1ea; accents plum band #6a3a4a, gold #c8a040 (spectacles, coins).
 * Value plan: the dark hat and coat frame the light face and the pale shirt; the gold coins are the accent.
 * Bodies: skin, nose, hair, mustache, spectacles, hat, band, coat, waistcoat, shirt, tie, shoes, ledger, box, coins.
 * Rig: the humanoid kind's skeleton and clips. Both arms keep a held pose (ledger left, coin box right).
 */

const C = {
  hat: '#2a2428',
  band: '#6a3a4a',
  waist: '#6a6870',
  stripe: '#4a4448',
  shirt: '#f6f1ea',
  dark: '#2a2428',
  gold: '#c8a040',
  ledger: '#c8a040',
  page: '#f0e6cc',
  ink: '#6a5a48',
  box: '#c8a040',
  mouth: '#a4503f',
  coatStripe: '#5a5c66',
  cover: '#6a2a2a',
  coverDark: '#4a1c1c',
  coinGold: '#e8c050',
};

export default humanoidAsset({
  name: 'tax-collector',
  description: 'A fussy, prim tax collector in a tall top hat and tailcoat, with an open ledger and a small coin box.',
  reference: 'docs/npc-mockups/tax-collector_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { black: '#16110f', dark: '#4a3a30', auburn: '#8e3b1c', silver: '#b8b4c4', blond: '#c4974a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { charcoal: '#222228', wine: '#5a2e3e', fir: '#2f4a3c', navy: '#2e3a5a' },
  },
  presets: {
    plum: { skin: 'light', hair: 'silver', eyes: 'hazel', cloth: 'wine' },
  },
  hair: false,
  undershirt: false,
  pants: C.dark,
  shoes: false,
  lashes: false,
  // Left (the viewer's right): the ledger held out at chest height. Right (the viewer's left): the coin
  // box raised beside the shoulder, clear of the head.
  pose: {
    L: { elbow: [0.17, 0.335, 0.05], wrist: [0.2, 0.33, 0.15] },
    R: { elbow: [0.215, 0.345, 0.045], wrist: [0.25, 0.43, 0.1] },
  },

  // A prim, surprised face: raised arched brows over the kind's eyes, a small smile under the mustache.
  paintSkin(skin, h) {
    const oldBrows = sdf.extrude(profile.arc(0.1, 0.036, 54, 126), 0.3).at(0.1, 0.622, 0.1).mirror('x');
    // One raised, higher arched brow (the viewer's right, +X) and one lower brow, for a fussy look.
    const brows = sdf.union(
      sdf.extrude(profile.arc(0.065, 0.017, 52, 128), 0.3).at(0.103, 0.675, 0.1),
      sdf.extrude(profile.arc(0.065, 0.017, 52, 128), 0.3).at(-0.103, 0.652, 0.1),
    );
    const oldSmile = sdf.extrude(profile.arc(0.07, 0.016, 236, 304), 0.3).at(0, 0.6, 0.1);
    const smile = sdf.extrude(profile.arc(0.04, 0.009, 238, 302), 0.3).at(0, 0.538, 0.1);
    return skin
      .paintWhere(oldBrows, h.tint.skin!, 0.002)
      .paintWhere(oldSmile, h.tint.skin!, 0.002)
      .paintWhere(brows, h.tint.brow!, 0.002)
      .paintWhere(smile, C.mouth, 0.002);
  },

  extra(k, h) {
    const { SHOULDER, HIP, KNEE, ANKLE, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];
    const hairColor = k.tint('hair');
    const skinColor = h.tint.skin!;
    const coatColor = h.tint.shirt!;

    // ------------------------------------------------------------------ top hat
    const hatPose = (s: sdf.Shape) => s.rotateX(-5).at(0, HEAD_Y, 0);
    const crown = sdf
      .revolve(
        profile.polygon([
          [0, 0.14],
          [0.146, 0.14],
          [0.14, 0.25],
          [0.128, 0.355],
          [0.12, 0.375],
          [0, 0.375],
        ]),
      )
      .round(0.008);
    const brim = sdf
      .revolve(
        profile.polygon([
          [0.1, 0.132],
          [0.236, 0.138],
          [0.256, 0.158],
          [0.236, 0.168],
          [0.1, 0.164],
        ]),
      )
      .round(0.006);
    k.body('hat', hatPose(sdf.smoothUnion(0.01, crown, brim)).bone('head'), { color: C.hat, roughness: 0.55, detail: 0.005 });
    const band = sdf
      .revolve(
        profile.polygon([
          [0.1, 0.15],
          [0.153, 0.15],
          [0.15, 0.205],
          [0.1, 0.205],
        ]),
      )
      .round(0.004);
    k.body('band', hatPose(band).bone('head'), { color: C.band, roughness: 0.7, detail: 0.004 });

    // ------------------------------------------------------------------ hair: a small cap and separate locks
    const lockOf = (deg: number, y0: number, y1: number, r: number) => {
      const a = (deg * Math.PI) / 180;
      const p = (rad: number, y: number, rr: number) => [rad * Math.sin(a), y, rad * 0.94 * Math.cos(a), rr] as [number, number, number, number];
      return sdf.chain([p(0.2, y0, r), p(0.205, (y0 + y1) / 2, r * 0.95), p(0.196, y1, r * 0.7)], 0.008);
    };
    const locks = sdf.union(
      ...[-62, 62].map((d) => lockOf(d, 0.1, -0.045, 0.024)),
      ...[-80, 80].map((d) => lockOf(d, 0.09, -0.03, 0.026)),
      ...[-100, 100, -122, 122, -146, 146, -168, 168, 180].map((d) => lockOf(d, 0.08, -0.06, 0.028)),
    );
    const shell = sdf.ellipsoid([0.211, 0.206, 0.196]);
    const cap = shell.smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], 0.07)).smoothIntersect(0.02, sdf.halfSpace([0, 0, 1], 0.07));
    k.body('hair', hatPose(sdf.smoothUnion(0.03, cap, locks)).bone('head'), { color: hairColor, roughness: 0.6, detail: 0.005 });

    // ------------------------------------------------------------------ the nose, the mustache, the spectacles
    const noseY = 0.566;
    const nose = sdf.ellipsoid([0.036, 0.032, 0.034]).at(0, noseY + 0.002, h.faceZ(0, noseY) + 0.004).bone('head');
    k.body('nose', nose, { color: skinColor, roughness: 0.55, detail: 0.004 });

    const fz = (x: number, y: number) => h.faceZ(x, y);
    const must = (s: number) =>
      sdf.chain(
        [
          [s * 0.01, 0.562, fz(0.01, 0.562) + 0.008, 0.022],
          [s * 0.05, 0.554, fz(0.05, 0.554) + 0.006, 0.022],
          [s * 0.09, 0.56, fz(0.09, 0.56) + 0.003, 0.02],
          [s * 0.118, 0.588, fz(0.118, 0.588) + 0.0, 0.016],
        ],
        0.014,
      );
    const mustache = sdf.smoothUnion(0.01, must(1), must(-1)).bone('head');
    k.body('mustache', mustache, { color: hairColor, roughness: 0.6, detail: 0.004 });


    // ------------------------------------------------------------------ shirt: collar, cuffs, and a tie
    const collar = sdf.torus(0.062, 0.02).scale([1, 1, 0.95]).at(0, 0.452, -0.012).bone('chest');
    const cuffs = h.perArm((j: ArmJoints) =>
      sdf.cone(lerp(j.ELBOW, j.WRIST, 0.8), lerp(j.ELBOW, j.WRIST, 1.02), 0.04, 0.039).round(0.002).bone('forearm.L'),
    );
    const chestFront = h.torso.round(0.004).intersect(sdf.box([0.1, 0.2, 0.4]).at(0, 0.385, 0.2));
    k.body('shirt', sdf.union(collar, cuffs, h.weighted(chestFront)), { color: C.shirt, roughness: 0.85, detail: 0.004 });
    const tie = sdf
      .extrude(
        profile.polygon([
          [-0.012, 0],
          [0.012, 0],
          [0.018, -0.07],
          [0, -0.085],
          [-0.018, -0.07],
        ]),
        0.03,
        0.003,
      )
      .at(0, 0.45, 0.097)
      .bone('chest');
    k.body('tie', tie, { color: C.dark, roughness: 0.6, detail: 0.004 });

    // ------------------------------------------------------------------ waistcoat: striped, with buttons
    const vest = h.torso.round(0.009).intersect(sdf.box([0.5, 0.3, 0.6]).at(0, 0.3, 0));
    const vestCut = vest.subtract(sdf.box([0.05, 0.1, 0.3], 0.01).at(0, 0.44, 0.15));
    const stripes = sdf.union(...Array.from({ length: 13 }, (_, i) => sdf.box([0.0035, 0.5, 0.9]).at(-0.12 + i * 0.02, 0.3, 0)));
    k.body('waistcoat', h.weighted(vestCut).paintWhere(stripes, C.stripe, 0.0012), { color: C.waist, roughness: 0.8, detail: 0.004 });
    const buttons = sdf.union(
      ...[0.255, 0.3, 0.345].map((y) => {
        const hit = sdf.raycast(vest, [0, y, 1], [0, 0, -1]);
        return sdf.sphere(0.011).at(0, y, (hit ? hit[2] : 0.1) + 0.004);
      }),
    );
    k.body('buttons', buttons.bone('chest'), { color: C.dark, roughness: 0.4, detail: 0.003 });

    // ------------------------------------------------------------------ the tailcoat: sleeves, open front, tails
    const sleeves = h.perArm((j: ArmJoints) =>
      sdf.smoothUnion(
        0.015,
        sdf.cone(lerp(SHOULDER, j.ELBOW, -0.1), j.ELBOW, 0.049, 0.045).bone('upperarm.L'),
        sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.84), 0.045, 0.043).bone('forearm.L'),
      ),
    );
    const body = h.torso.round(0.017).intersect(sdf.box([0.5, 0.3, 0.6]).at(0, 0.34, 0));
    // The open front: a wedge cut over the waistcoat, wider at the waist than at the neck.
    const opening = sdf.extrude(
      profile.polygon([
        [-0.03, 0.46],
        [0.03, 0.46],
        [0.075, 0.3],
        [0.07, 0.18],
        [-0.07, 0.18],
        [-0.075, 0.3],
      ]),
      0.4,
    ).at(0, 0, 0.2);
    const tailsOuter = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.3],
            [0.14, 0.3],
            [0.156, 0.25],
            [0.172, 0.2],
            [0.184, 0.16],
            [0.188, 0.135],
            [0, 0.135],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.85]);
    const tailsInner = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.31],
            [0.122, 0.31],
            [0.138, 0.25],
            [0.154, 0.2],
            [0.166, 0.16],
            [0.17, 0.125],
            [0, 0.125],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.82]);
    const tails = tailsOuter.subtract(tailsInner).intersect(sdf.halfSpace([0, 0, 1], 0.03)).smoothSubtract(0.01, sdf.box([0.012, 0.3, 0.3]).at(0, 0.1, -0.15).round(0.004));
    const coat = sdf.smoothUnion(0.012, h.weighted(body), h.weighted(tails), sleeves).subtract(opening);
    // Pinstripes: thin pale lines down the coat body and tails.
    const coatStripes = sdf.union(...Array.from({ length: 14 }, (_, i) => sdf.box([0.004, 0.5, 0.9]).at(-0.156 + i * 0.024, 0.3, 0)));
    k.body('coat', coat.paintWhere(coatStripes, C.coatStripe, 0.0012), { color: coatColor, roughness: 0.85, detail: 0.005 });

    // ------------------------------------------------------------------ shoes: glossy black with a toe and a heel
    const shoe = sdf
      .smoothUnion(
        0.025,
        sdf.ellipsoid([0.054, 0.04, 0.095]).at(0, 0.04, 0.04),
        sdf.sphere(0.05).at(0, 0.05, -0.012),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    const sole = sdf.ellipsoid([0.057, 0.042, 0.1]).at(0, 0.036, 0.04).intersect(sdf.halfSpace([0, 1, 0], 0.014)).rotateY(12).at(ANKLE[0], 0, 0).bone('foot.L');
    k.body('shoes', pair(sdf.union(shoe, sole)), { color: C.dark, roughness: 0.25, detail: 0.004 });

    // ------------------------------------------------------------------ the ledger (left hand) and the coin box (right hand)
    const gl = h.arms.L.GRIP;
    // An open book: a brown leather cover behind, a spine, and two cream page blocks in a shallow V.
    const place = (sh: sdf.Shape) => sh.scale(1.3).rotateX(-25).at(gl[0] + 0.01, gl[1] + 0.075, gl[2] + 0.02).bone('knife.L');
    const cover = sdf.union(
      sdf.box([0.168, 0.116, 0.012], 0.005).at(0, 0, -0.016),
      sdf.cylinder(0.0105, 0.116, 0.003).at(0, 0, -0.008),
    );
    k.body('ledger', place(cover), { color: C.cover, roughness: 0.7, detail: 0.004 });
    const pageBlock = (sgn: number) => sdf.box([0.071, 0.104, 0.022], 0.004).rotateY(sgn * 9).at(sgn * 0.0385, 0, 0.002);
    const pages = sdf
      .union(pageBlock(1), pageBlock(-1))
      .paintWhere(sdf.union(...[0.036, 0.018, 0, -0.018, -0.036].map((y) => sdf.box([0.1, 0.0045, 0.2]).at(0, y, 0))), C.ink, 0.001);
    k.body('ledger-pages', place(pages), { color: C.page, roughness: 0.85, detail: 0.003 });

    const gr = h.arms.R.GRIP;
    const gx = -gr[0];
    const boxPart = sdf
      .box([0.1, 0.07, 0.07], 0.01)
      .subtract(sdf.box([0.034, 0.006, 0.01]).at(0, 0.035, 0))
      .at(gx, gr[1] + 0.032, gr[2] + 0.02)
      .bone('knife.R');
    k.body('box', boxPart, { color: C.box, roughness: 0.35, metalness: 0.7, detail: 0.004 });
    const coin = (dx: number, dz: number) => sdf.cylinder(0.019, 0.007, 0.002).rotateX(10).at(gx + dx, gr[1] + 0.072, gr[2] + 0.02 + dz);
    k.body('coins', sdf.union(coin(-0.025, 0.01), coin(0.02, -0.012), coin(0.0, 0.025)).bone('knife.R'), {
      color: C.coinGold,
      roughness: 0.25,
      metalness: 0.8,
      detail: 0.003,
    });
    void HIP;
    void KNEE;
  },
});
