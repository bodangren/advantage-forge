import { profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Butcher — Chibi Quest settlement NPC (catalog `npcs/settlement/butcher`), about 1.0 m to the top of
 * the flat cap, faces +Z. Target: docs/npc-mockups/butcher_001.jpg. Built on the humanoid kind.
 *
 * Role: the market NPC who sells meat; seen in 3D and as a 128 px sprite. The curled mustache, the
 *   red-and-white striped apron, and the raised string of sausages must read.
 * One idea: a big, friendly butcher whose black curled mustache and round nose sit under a tan flat
 *   cap, with a striped apron and a loop of sausages held up beside his head.
 * Shape language: round and soft (face, nose, sausages, boots), with the straight apron panel as the
 *   one flat form.
 * Palette (60/30/10): shirt #f6f1ea and apron #f0ece4 (light, 60 percent), trousers #3a3438 and boots
 *   #2a2428 (dark), stripes #b04a4a (the cloth slot) with a cap #c8a878 and red trim #b03a3a;
 *   sausages #b0603a as the accent.
 * Value plan: the dark mustache and hair against the light face and cap; the striped apron on the
 *   dark trousers; the warm sausages against the white shirt.
 * Bodies: skin, nose, mustache, hair, tuft, cap, trim, shirt, cuffs, apron, trousers, boots, sausages, ends.
 * Rig: the humanoid kind's skeleton and clips. The right arm is raised and keeps its pose; the left
 *   fist rests on the hip. The sausages are rigid on the grip bone `knife.R`.
 */

const C = {
  cap: '#c8a878',
  capTrim: '#b03a3a',
  shirt: '#f6f1ea',
  apron: '#f0ece4',
  pants: '#3a3438',
  pantsCuff: '#4a4448',
  boot: '#2a2428',
  sausage: '#b0603a',
  sausageEnd: '#8a4a2a',
};

// Three loops of small links (0.052 m long, 0.032 m thick): the leg length, the bend radius, and the offset.
const LOOPS = [
  { legs: 0.17, bend: 0.027, dx: 0.0, dz: 0.0 },
  { legs: 0.2, bend: 0.03, dx: -0.01, dz: 0.036 },
  { legs: 0.14, bend: 0.025, dx: 0.012, dz: -0.036 },
] as const;
const LINK = { length: 0.052, r: 0.016 };

export default humanoidAsset({
  name: 'butcher',
  description: 'A big, friendly butcher with a curled mustache, a flat cap, and a striped apron, holding up a string of sausages.',
  reference: 'docs/npc-mockups/butcher_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { black: '#231a17', brown: '#5a301d', blond: '#c4974a', auburn: '#8e3b1c', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { brick: '#b04a4a', indigo: '#4a5a86', pine: '#3f6a4a', ochre: '#b8862f' },
  },
  presets: {
    market: { skin: 'tan', hair: 'brown', eyes: 'green', cloth: 'indigo' },
  },
  hair: false,
  undershirt: false,
  pants: false,
  shoes: false,
  lashes: false,
  // The right arm raised beside the head (the viewer's left); the left fist rests on the hip.
  pose: {
    R: { elbow: [0.2, 0.34, 0.02], wrist: [0.25, 0.42, 0.07] },
    L: { elbow: [0.215, 0.305, -0.045], wrist: [0.185, 0.24, 0.02] },
  },

  // The kind's straight brows are painted over with skin; thick brows are their own body in `extra`.
  paintSkin(skin, h) {
    const oldBrows = sdf.extrude(profile.arc(0.1, 0.03, 54, 126), 0.3).at(0.1, 0.622, 0.1).mirror('x');
    return skin.paintWhere(oldBrows, h.tint.skin!, 0.002);
  },

  extra(k, h) {
    const { SHOULDER, HEAD_Y, HIP, KNEE, ANKLE } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const hairColor = k.tint('hair');
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];

    // ------------------------------------------------------------------ brows: thick and kindly, the inner ends a little high
    const bz = (x: number, y: number) => h.faceZ(x, y) + 0.002;
    const brow = pair(
      sdf.smoothUnion(
        0.01,
        sdf.capsule([0.05, 0.714, bz(0.05, 0.714)], [0.1, 0.717, bz(0.1, 0.717)], 0.0125),
        sdf.capsule([0.1, 0.717, bz(0.1, 0.717)], [0.152, 0.696, bz(0.152, 0.696)], 0.0115),
      ),
    );
    k.body('brows', brow.bone('head'), { color: hairColor, roughness: 0.6, detail: 0.003 });

    // ------------------------------------------------------------------ nose: big and round, in skin tint
    const nz = h.faceZ(0, 0.572);
    k.body('nose', sdf.ellipsoid([0.043, 0.038, 0.04]).at(0, 0.572, nz + 0.004).bone('head'), {
      color: h.tint.skin!,
      roughness: 0.55,
      detail: 0.004,
      textureDensity: 2,
    });

    // ------------------------------------------------------------------ mustache: a thick curled pair on the head bone
    const my = 0.534;
    const mz = (x: number) => h.faceZ(x, my) + 0.006;
    const pt = (x: number, y: number, dz = 0.004): [number, number, number] => [x, y, mz(x) + dz];
    const side = sdf.smoothUnion(
      0.016,
      sdf.capsule(pt(0.004, my + 0.006), pt(0.04, my - 0.01), 0.02),
      sdf.capsule(pt(0.04, my - 0.01), pt(0.08, my - 0.004), 0.0175),
      sdf.capsule(pt(0.08, my - 0.004), pt(0.106, my + 0.026, 0.006), 0.0145),
      sdf.capsule(pt(0.106, my + 0.026, 0.006), pt(0.094, my + 0.05, 0.008), 0.0118),
      sdf.capsule(pt(0.094, my + 0.05, 0.008), pt(0.076, my + 0.044, 0.01), 0.0098),
    );
    k.body('mustache', sdf.smoothUnion(0.012, side, side.mirror('x', 0)).bone('head'), { color: hairColor, roughness: 0.6, detail: 0.003 });

    // ------------------------------------------------------------------ flat cap: a puffed crown, a red band, a red visor
    const capPose = (s: sdf.Shape) => s.rotateX(3).at(0, HEAD_Y + 0.012, 0);
    const crown = sdf
      .smoothUnion(
        0.03,
        sdf.ellipsoid([0.228, 0.112, 0.222]).at(0, 0.138, -0.01),
        sdf.ellipsoid([0.2, 0.07, 0.19]).at(0, 0.178, 0.02), // the flattened top, leaning forward
        sdf.ellipsoid([0.2, 0.08, 0.12]).at(0, 0.15, -0.1), // a soft puff at the back
        sdf.sphere(0.017).at(0, 0.248, 0.02), // the button
      )
      .intersect(sdf.halfSpace([0, -1, 0], -0.05));
    k.body('cap', capPose(crown).bone('head'), {
      color: C.cap,
      roughness: 0.9,
      detail: 0.005,
      bump: (x, y, z) => 0.0025 * Math.sin(x * 70 + z * 45) * Math.cos(y * 55),
    });
    const band = sdf.torus(0.198, 0.026).scale([1, 1, 0.95]).at(0, 0.068, -0.005);
    const visor = sdf
      .smoothUnion(0.02, sdf.ellipsoid([0.2, 0.022, 0.13]).at(0, 0.062, 0.165), sdf.ellipsoid([0.16, 0.03, 0.1]).at(0, 0.066, 0.15))
      .intersect(sdf.halfSpace([0, 0, -1], -0.1));
    k.body('trim', capPose(sdf.smoothUnion(0.015, band, visor)).bone('head'), { color: C.capTrim, roughness: 0.75, detail: 0.004 });

    // ------------------------------------------------------------------ hair: curled fringe and side locks under the band, back and nape
    const curl = (x0: number, s: number) =>
      sdf.chain(
        [
          [x0, 0.06, 0.172, 0.022],
          [x0 + 0.014 * s, 0.072, 0.184, 0.02],
          [x0 + 0.03 * s, 0.062, 0.196, 0.017],
          [x0 + 0.034 * s, 0.044, 0.194, 0.013],
        ],
        0.01,
      );
    const fringe = sdf.smoothUnion(
      0.012,
      sdf.ellipsoid([0.11, 0.03, 0.03]).at(0, 0.056, 0.17),
      curl(-0.09, -1),
      curl(-0.045, 1),
      curl(0, -1),
      curl(0.045, 1),
      curl(0.09, -1),
    );
    const sideburn = pair(
      sdf.chain(
        [
          [0.172, 0.095, 0.05, 0.026],
          [0.18, 0.04, 0.056, 0.02],
          [0.183, -0.02, 0.064, 0.017],
          [0.18, -0.052, 0.07, 0.014],
        ],
        0.012,
      ),
    );
    const hairShell = sdf.ellipsoid([0.212, 0.206, 0.197]);
    // The nape: three rows of small overlapping curls (round tufts), not a row of drips.
    const curlAt = (a: number, y: number, r: number, rad: number) =>
      sdf.sphere(r).at(rad * Math.sin((a * Math.PI) / 180), y, -rad * 0.93 * Math.cos((a * Math.PI) / 180));
    const tips = sdf.union(
      ...[-96, -80, -64, -48, -32, -16, 0, 16, 32, 48, 64, 80, 96].map((a) => curlAt(a, -0.045, 0.036, 0.172)),
      ...[-88, -72, -56, -40, -24, -8, 8, 24, 40, 56, 72, 88].map((a) => curlAt(a, -0.062, 0.03, 0.166)),
    );
    const back = hairShell.smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], 0.045)).smoothIntersect(0.03, sdf.halfSpace([0, 0, 1], -0.02));
    const hair = capPose(sdf.smoothUnion(0.02, back, tips, fringe, sideburn)).bone('head');
    k.body('hair', hair, { color: hairColor, roughness: 0.6, detail: 0.004 });

    // ------------------------------------------------------------------ shirt: short sleeves rolled into cuffs
    const sleeves = h.perArm((j) =>
      sdf.smoothUnion(
        0.012,
        sdf.cone(lerp(SHOULDER, j.ELBOW, -0.1), j.ELBOW, 0.049, 0.048).bone('upperarm.L'),
        sdf.sphere(0.05).at(...j.ELBOW).bone('upperarm.L'),
      ),
    );
    const shirt = sdf.smoothUnion(0.012, h.weighted(h.torso), sleeves);
    k.body('shirt', shirt, { color: C.shirt, roughness: 0.85 });
    // The rolled cuff wraps the elbow, so no skin shows through at the bend.
    const cuffs = h.perArm((j) =>
      sdf
        .smoothUnion(
          0.01,
          sdf.cone(lerp(SHOULDER, j.ELBOW, 0.68), j.ELBOW, 0.056, 0.058).bone('upperarm.L'),
          sdf.sphere(0.058).at(...j.ELBOW).bone('forearm.L'),
          sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.22), 0.058, 0.055).bone('forearm.L'),
        )
        .round(0.006),
    );
    const collar = sdf.torus(0.06, 0.018).at(0, 0.452, -0.008).bone('chest');
    const button = sdf.sphere(0.011).at(0, 0.4, sdf.raycast(h.torso, [0, 0.4, 1], [0, 0, -1])![2] + 0.002).bone('chest');
    k.body('cuffs', sdf.union(cuffs, collar), { color: C.shirt, roughness: 0.9, detail: 0.004 });
    k.body('button', button, { color: '#d8d0c0', roughness: 0.4, detail: 0.003 });

    // ------------------------------------------------------------------ apron: red straps, a red waistband, a striped panel
    const outer = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.3],
            [0.138, 0.3],
            [0.15, 0.25],
            [0.156, 0.21],
            [0.166, 0.185],
            [0.178, 0.14],
            [0.184, 0.12],
            [0, 0.12],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.8]);
    const inner = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.31],
            [0.124, 0.31],
            [0.136, 0.25],
            [0.142, 0.21],
            [0.152, 0.185],
            [0.165, 0.14],
            [0.172, 0.108],
            [0, 0.108],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.78]);
    const panel = outer.subtract(inner).intersect(sdf.box([0.25, 0.2, 0.4], 0.018).at(0, 0.21, 0.2));
    const wrap = h.torso.round(0.012).subtract(h.torso.round(-0.003));
    const waist = wrap.intersect(h.band(0.262, 0.292));
    const strap = pair(
      wrap
        .intersect(sdf.box([0.036, 0.5, 0.6]).at(0.078, 0.38, 0))
        .intersect(sdf.halfSpace([0, -1, 0], -0.28))
        .intersect(sdf.halfSpace([0, 1, 0], 0.445)),
    );
    const stripes = sdf.union(...[-0.105, -0.075, -0.045, -0.015, 0.015, 0.045, 0.075, 0.105].map((x) => sdf.box([0.017, 0.4, 1]).at(x, 0.2, 0)));
    const red = h.tint.shirt!;
    k.body('apron', sdf.smoothUnion(0.008, h.weighted(panel), h.weighted(waist), strap.bone('chest')), { color: C.apron, roughness: 0.9, detail: 0.005 });
    // The red parts are solid bodies, so they stay red at any size: the stripes of the whole panel, the waistband, the straps.
    const redStripes = h.weighted(panel.round(0.002).intersect(stripes).intersect(h.band(0.1, 0.262)));
    const redBands = sdf.smoothUnion(0.006, h.weighted(waist.round(0.002)), strap.round(0.002).bone('chest'));
    k.body('stripes', sdf.smoothUnion(0.004, redStripes, redBands), { color: red, roughness: 0.85, detail: 0.004 });

    // ------------------------------------------------------------------ trousers with turned cuffs, and short black boots
    const trouserLeg = sdf.smoothUnion(
      0.012,
      sdf.capsule(HIP, KNEE, 0.05).bone('leg.L'),
      sdf.cone(KNEE, [ANKLE[0], 0.108, 0.002], 0.048, 0.047).bone('shin.L'),
    );
    const turn = sdf.cylinder(0.057, 0.03, 0.012).at(ANKLE[0], 0.12, 0.002).bone('shin.L');
    k.body('trousers', sdf.smoothUnion(0.03, sdf.ellipsoid([0.118, 0.052, 0.088]).at(0, 0.2, 0).bone('hips'), pair(trouserLeg)), {
      color: C.pants,
      roughness: 0.85,
    });
    k.body('cuffs-legs', pair(turn), { color: C.pantsCuff, roughness: 0.9, detail: 0.004 });
    const shoe = sdf.smoothUnion(0.025, sdf.ellipsoid([0.06, 0.046, 0.104]).at(0, 0.042, 0.042), sdf.sphere(0.053).at(0, 0.054, -0.005));
    const shaft = sdf.cylinder(0.052, 0.08, 0.014).at(0, 0.065, 0);
    const boot = sdf
      .smoothUnion(0.02, shoe, shaft)
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.45 });

    // ------------------------------------------------------------------ the bunch of sausages in the raised right fist (x < 0)
    // Three loops of small links: down one leg, around a half circle, back up the other leg. The
    // joints between the links are painted darker.
    const g = h.arms.R.GRIP;
    const { length, r } = LINK;
    const top = g[1] + 0.012;
    const links: sdf.Shape[] = [];
    const ends: sdf.Shape[] = [];
    for (const loop of LOOPS) {
      const cx = -g[0] - 0.006 + loop.dx;
      const gz = g[2] + 0.012 + loop.dz;
      const { legs, bend } = loop;
      const arcLen = Math.PI * bend;
      const total = 2 * legs + arcLen;
      const at = (s: number): [number, number, number] => {
        if (s <= legs) return [cx - bend, top - s, gz];
        if (s <= legs + arcLen) {
          const a = (s - legs) / bend; // 0..pi around the bottom
          return [cx - bend * Math.cos(a), top - legs - bend * Math.sin(a), gz];
        }
        return [cx + bend, top - legs + (s - legs - arcLen), gz];
      };
      const n = Math.floor(total / length);
      const step = total / n;
      for (let i = 0; i < n; i++) {
        const a = at(i * step + r * 0.5);
        const b = at((i + 1) * step - r * 0.5);
        links.push(sdf.smoothUnion(0.005, sdf.capsule(a, b, r), sdf.ellipsoid([r * 1.1, 0.026, r * 1.1]).at(...lerp(a, b, 0.5))));
        ends.push(sdf.sphere(0.011).at(...at(i * step)));
      }
    }
    const sausages = sdf.smoothUnion(0.003, ...links);
    k.body('sausages', sausages.paintWhere(sdf.union(...ends), C.sausageEnd, 0.003).bone('knife.R'), {
      color: C.sausage,
      roughness: 0.5,
      detail: 0.004,
    });
  },
});
