import { profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Cobbler — Chibi Quest settlement NPC (catalog `npcs/settlement/cobbler`), about 1.0 m to the top
 * of the head, faces +Z. Target: docs/npc-mockups/cobbler_001.jpg. Built on the humanoid kind.
 *
 * Role: the village shoemaker NPC (the village shop); seen in 3D and as a 128 px sprite. The bald
 *   head with fluffy white side hair, the white mustache, the big round nose, the red shoe, and the
 *   hammer must read.
 * One idea: an old bald cobbler whose fluffy white side curls and big mustache frame a happy face,
 *   with a little red shoe in one raised hand and a hammer in the other.
 * Shape language: round and soft (head, curls, shoe, shoes), with the straight leather apron and the
 *   round-headed hammer as the harder forms.
 * Palette (60/30/10): leather #6b4226 apron, cream #f0ead8 shirt, dark green #3f5040 trousers;
 *   white #f0ece4 hair and mustache; red #b03a3a shoe as the accent; grey #6a6e78 hammer.
 * Value plan: the white hair frames the light face (focal point); the dark apron and trousers hold
 *   the body; the red shoe is the one saturated spot.
 * Bodies: skin (smile), hair (side spirals), brows, mustache, nose, shirt, cuffs, apron, buttons, trousers,
 *   shoes, red shoe, sole, hammer head, hammer handle.
 * Rig: the humanoid kind's skeleton and clips. Both arms keep a raised pose (`pose`); the shoe is
 *   rigid on `knife.R` and the hammer on `knife.L`.
 */

const C = {
  cream: '#f0ead8',
  cuff: '#e0d6bc',
  shoe: '#5a3a24',
  shoeSole: '#3a2416',
  pants: '#59603e',
  brass: '#c8a040',
  red: '#b03a3a',
  redSole: '#3a2a20',
  lace: '#e8dcc0',
  steel: '#6a6e78',
  handle: '#8a5a35',
};

export default humanoidAsset({
  name: 'cobbler',
  description: 'An old village cobbler with white side hair, a white mustache, in a leather apron, holding up a little red shoe and a small hammer.',
  reference: 'docs/npc-mockups/cobbler_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { white: '#f0ece4', silver: '#b8b4c4', brown: '#5a301d', black: '#231a17', blond: '#c4974a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { leather: '#6b4226', tan: '#8a6a3a', oxblood: '#6a3030', indigo: '#3f4a5e' },
  },
  presets: {
    traveler: { skin: 'tan', hair: 'silver', eyes: 'hazel', cloth: 'oxblood' },
  },
  hair: false,
  lashes: false,
  undershirt: false,
  pants: false,
  shoes: false,
  pose: {
    L: { elbow: [0.19, 0.345, 0.03], wrist: [0.215, 0.43, 0.09] },
    R: { elbow: [0.19, 0.345, 0.03], wrist: [0.215, 0.43, 0.09] },
  },

  // The kind's brows are painted over with skin (bushy white brows are a body) and a small open smile.
  paintSkin(skin, h) {
    const oldBrows = sdf.extrude(profile.arc(0.1, 0.036, 54, 126), 0.3).at(0.1, 0.622, 0.1).mirror('x');
    const my = 0.512;
    const grin = profile.polygon(
      [
        [-0.036, 0.009],
        [-0.018, 0.002],
        [0, 0.0],
        [0.018, 0.002],
        [0.036, 0.009],
        [0.028, -0.008],
        [0.014, -0.018],
        [0, -0.021],
        [-0.014, -0.018],
        [-0.028, -0.008],
      ],
      { smooth: true, samples: 6 },
    );
    const mouth = h.onFace(sdf.extrude(grin, 0.3), 0, my);
    const tongue = h.onFace(sdf.ellipsoid([0.014, 0.008, 0.08]), 0, my - 0.015);
    return skin
      .paintWhere(oldBrows, h.tint.skin!, 0.002)
      .paintWhere(mouth, '#8a2e2a', 0.002)
      .paintWhere(tongue.intersect(mouth), '#d8706a', 0.003);
  },

  extra(k, h) {
    const { SHOULDER, HIP, KNEE, ANKLE } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];
    const hairColor = k.tint('hair');

    // ------------------------------------------------------------------ hair: a bald top, a spiral curl at each side
    const curl = (sd: number) => {
      // A strip of hair along the temple (sd = +1 on the left, x > 0) that winds into a flat spiral coil.
      const strip = sdf.ellipsoid([0.026, 0.085, 0.05]).at(0.19 * sd, 0.665, -0.01);
      const cx = 0.242;
      const cy = 0.64;
      const turns = 1.3;
      const n = 22;
      const pts: [number, number, number, number][] = Array.from({ length: n + 1 }, (_, i) => {
        const t = i / n;
        const a = 1.2 + t * turns * 2 * Math.PI;
        const r = 0.046 - 0.037 * t;
        return [(cx + r * Math.cos(a)) * sd, cy + r * Math.sin(a), -0.012, 0.0125 - 0.002 * t];
      });
      const coil = sdf.chain(pts, 0.004);
      const root = sdf.capsule([0.205 * sd, 0.68, -0.012], [(cx + 0.05 * Math.cos(1.2)) * sd, cy + 0.05 * Math.sin(1.2), -0.012], 0.016);
      return sdf.smoothUnion(0.012, strip, coil, root);
    };
    const hair = sdf.smoothUnion(0.01, curl(1), curl(-1)).bone('head');
    k.body('hair', hair, { color: hairColor, roughness: 0.7, detail: 0.004, bump: (x, y, z) => 0.002 * Math.sin(x * 120 + y * 90) * Math.cos(z * 100) });

    // ------------------------------------------------------------------ bushy white brows
    const browAt = (x: number, y: number) => [x, y, h.faceZ(Math.abs(x), y) + 0.006] as const;
    const brow = sdf.smoothUnion(
      0.012,
      sdf.capsule(browAt(0.062, 0.7), browAt(0.1, 0.718), 0.0125),
      sdf.capsule(browAt(0.1, 0.718), browAt(0.15, 0.706), 0.0135),
      sdf.capsule(browAt(0.15, 0.706), browAt(0.168, 0.688), 0.0095),
    );
    k.body('brows', sdf.union(brow, brow.mirror('x', 0)).bone('head'), { color: hairColor, roughness: 0.7, detail: 0.003 });

    // ------------------------------------------------------------------ mustache: a wide drooping pair with lifted tips
    const my = 0.552;
    const mz = (x: number) => h.faceZ(x, my) + 0.012;
    const half = sdf.smoothUnion(
      0.014,
      sdf.capsule([0.006, my + 0.002, mz(0.006)], [0.04, my - 0.008, mz(0.04)], 0.0185),
      sdf.capsule([0.04, my - 0.008, mz(0.04)], [0.078, my + 0.004, mz(0.078)], 0.0165),
      sdf.capsule([0.078, my + 0.004, mz(0.078)], [0.1, my + 0.022, mz(0.1)], 0.0125),
    );
    k.body('mustache', sdf.smoothUnion(0.012, half, half.mirror('x', 0)).bone('head'), { color: hairColor, roughness: 0.65, detail: 0.003 });

    // ------------------------------------------------------------------ a large round nose
    const noseY = 0.58;
    const nose = sdf.ellipsoid([0.031, 0.028, 0.03]).at(0, noseY, h.faceZ(0, noseY) + 0.014);
    k.body('nose', nose.bone('head'), { color: k.tint('skin'), roughness: 0.55, detail: 0.004 });

    // ------------------------------------------------------------------ shirt: cream, sleeves rolled to the elbow
    const sleeves = h.perArm((j) =>
      sdf.smoothUnion(
        0.012,
        sdf.cone(lerp(SHOULDER, j.ELBOW, -0.1), j.ELBOW, 0.047, 0.043).bone('upperarm.L'),
        sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.3), 0.043, 0.042).bone('forearm.L'),
      ),
    );
    const shirt = sdf.smoothUnion(0.012, h.weighted(h.torso), sleeves);
    k.body('shirt', shirt, { color: C.cream, roughness: 0.88 });
    const cuffs = h.perArm((j) => sdf.cone(lerp(j.ELBOW, j.WRIST, 0.18), lerp(j.ELBOW, j.WRIST, 0.36), 0.049, 0.05).round(0.004).bone('forearm.L'));
    const collar = sdf
      .smoothUnion(0.01, sdf.torus(0.062, 0.018).at(0, 0.452, -0.008), pair(sdf.ellipsoid([0.032, 0.012, 0.03]).rotateZ(-20).rotateX(-25).at(0.04, 0.446, 0.052)))
      .bone('chest');
    k.body('cuffs', sdf.union(cuffs, collar), { color: C.cuff, roughness: 0.9, detail: 0.004 });

    // ------------------------------------------------------------------ leather apron: bib, straps with buttons, long front panel
    const shell = h.torso.round(0.013).subtract(h.torso.round(-0.003));
    const bib = shell.intersect(sdf.box([0.17, 0.17, 0.4], 0.016).at(0, 0.33, 0.2));
    const strap = shell
      .intersect(sdf.box([0.036, 0.5, 0.6]).at(0.07, 0.4, 0))
      .intersect(sdf.halfSpace([0, -1, 0], -0.3))
      .intersect(sdf.halfSpace([0, 1, 0], 0.5))
      .bone('chest');
    const skirtOuter = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.3],
            [0.134, 0.3],
            [0.148, 0.26],
            [0.158, 0.22],
            [0.17, 0.19],
            [0.176, 0.15],
            [0, 0.15],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.8]);
    const innerS = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.31],
            [0.12, 0.31],
            [0.134, 0.26],
            [0.144, 0.22],
            [0.156, 0.19],
            [0.162, 0.14],
            [0, 0.14],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.78]);
    const panel = skirtOuter.subtract(innerS).intersect(sdf.box([0.27, 0.16, 0.4], 0.02).at(0, 0.228, 0.2));
    const apron = sdf
      .smoothUnion(0.01, h.weighted(bib), pair(strap), h.weighted(panel))
      .paintWhere(h.band(0.288, 0.3), '#4f3020', 0.002);
    k.body('apron', apron, { color: h.tint.shirt ?? '#6b4226', roughness: 0.62, detail: 0.005 });

    const torsoR = h.torso.round(0.012);
    const buttons = sdf.union(
      ...[0.07, -0.07].map((x) => {
        const z = sdf.raycast(torsoR, [x, 0.372, 1], [0, 0, -1])![2];
        return sdf.sphere(0.0125).at(x, 0.372, z + 0.003);
      }),
    );
    k.body('buttons', buttons.bone('chest'), { color: C.brass, roughness: 0.35, metalness: 0.85, detail: 0.003 });

    // ------------------------------------------------------------------ wide olive trousers and brown shoes
    const trouserLeg = sdf.smoothUnion(
      0.012,
      sdf.capsule(HIP, KNEE, 0.058).bone('leg.L'),
      sdf.cone(KNEE, [ANKLE[0], 0.1, 0.002], 0.058, 0.056).bone('shin.L'),
    );
    k.body('trousers', sdf.smoothUnion(0.03, sdf.ellipsoid([0.13, 0.058, 0.094]).at(0, 0.2, 0).bone('hips'), pair(trouserLeg)), {
      color: C.pants,
      roughness: 0.88,
    });
    const shoeFoot = sdf
      .smoothUnion(0.025, sdf.ellipsoid([0.058, 0.044, 0.1]).at(0, 0.04, 0.04), sdf.sphere(0.052).at(0, 0.052, -0.005))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const soleBand = shoeFoot.round(0.004).intersect(sdf.halfSpace([0, 1, 0], 0.014)).intersect(sdf.halfSpace([0, -1, 0], 0));
    const shoe = sdf.union(shoeFoot, soleBand.paint(C.shoeSole)).rotateY(12).at(ANKLE[0], 0, 0).bone('foot.L');
    k.body('shoes', pair(shoe), { color: C.shoe, roughness: 0.6 });

    // ------------------------------------------------------------------ held items
    const gR = h.arms.R.GRIP;
    const gL = h.arms.L.GRIP;

    // The red shoe (right hand, x < 0), 0.15 m long and 0.07 m tall with its raised heel. Built with the toe
    // along +X, the sole at the bottom, and the width along Z; turned so the toe dips toward the body.
    const upperSide = profile.polygon(
      [
        [-0.07, 0.004],
        [-0.075, 0.03],
        [-0.066, 0.062],
        [-0.04, 0.066],
        [-0.016, 0.054],
        [0.004, 0.048],
        [0.03, 0.04],
        [0.058, 0.034],
        [0.076, 0.022],
        [0.07, 0.004],
      ],
      { smooth: true, samples: 6 },
    );
    const plan = sdf.ellipsoid([0.09, 0.12, 0.037]).at(0.004, 0.03, 0);
    const opening = sdf.ellipsoid([0.034, 0.024, 0.025]).at(-0.04, 0.066, 0);
    const upper = sdf
      .extrude(upperSide, 0.08, 0.004)
      .at(0, 0, 0)
      .intersect(plan)
      .subtract(opening)
      .paintWhere(opening.round(0.004), '#3a1c1c', 0.002);
    const soleSlab = sdf.box([0.152, 0.014, 0.074], 0.006).at(0.004, 0.003, 0).intersect(sdf.ellipsoid([0.082, 0.1, 0.038]).at(0.004, 0.0, 0));
    const heelBlock = sdf.box([0.04, 0.024, 0.058], 0.006).at(-0.052, -0.012, 0);
    const shoeOrient = (s: sdf.Shape) => s.rotateZ(-30).at(-gR[0] - 0.024, gR[1] - 0.04, gR[2]);
    k.body('red-shoe', shoeOrient(upper).bone('knife.R'), { color: C.red, roughness: 0.5, detail: 0.003 });
    k.body('red-sole', shoeOrient(sdf.smoothUnion(0.004, soleSlab, heelBlock)).bone('knife.R'), { color: C.redSole, roughness: 0.8, detail: 0.003 });
    // Three laces across the instep, each set on the upper surface by a probe.
    const laceBars = sdf.union(
      ...[-0.012, 0.006, 0.024].map((x) => {
        const y = sdf.raycast(upper, [x, 0.2, 0], [0, -1, 0])?.[1] ?? 0.045;
        return sdf.capsule([x, y + 0.002, -0.026], [x, y + 0.002, 0.026], 0.0045);
      }),
    );
    k.body('laces', shoeOrient(laceBars).bone('knife.R'), { color: C.lace, roughness: 0.8, detail: 0.003 });

    // The hammer (left hand, x > 0), 0.2 m long: a wooden handle through the fist, a round steel head
    // with a flat face on the outer side and a small peen on the inner side.
    const hammerLocal = (() => {
      const handleS = sdf.capsule([0, -0.075, 0], [0, 0.11, 0], 0.0175);
      const head = sdf.smoothUnion(
        0.008,
        sdf.cylinder(0.03, 0.04, 0.008).rotateZ(90).at(0.026, 0.118, 0), // the round face on the outer side
        sdf.cone([-0.01, 0.118, 0], [-0.052, 0.118, 0], 0.024, 0.013), // the peen
        sdf.cylinder(0.024, 0.05, 0.008).rotateZ(90).at(-0.004, 0.118, 0), // the neck
      );
      return { handleS, head };
    })();
    const hammerOrient = (s: sdf.Shape) => s.rotateZ(-34).rotateX(-12).at(gL[0] + 0.022, gL[1] - 0.026, gL[2] + 0.0);
    k.body('hammer-handle', hammerOrient(hammerLocal.handleS).bone('knife.L'), { color: C.handle, roughness: 0.75, detail: 0.003 });
    k.body('hammer-head', hammerOrient(hammerLocal.head).bone('knife.L'), { color: C.steel, roughness: 0.4, metalness: 0.75, detail: 0.003 });
  },
});
