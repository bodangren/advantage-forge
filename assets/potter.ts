import { profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Potter — Chibi Quest settlement NPC (catalog `npcs/settlement/potter`), about 1.0 m to the top of
 * the top-knot bun, faces +Z. Target: docs/npc-mockups/potter_001.jpg. Built on the humanoid kind.
 *
 * Role: a craft NPC who sells pots and jars (the pottery), seen in 3D and as a 128 px sprite; the
 *   orange vase held up in both hands is the focal point.
 * One idea: a calm young potter with a swept dark top-knot who proudly holds up a fresh orange vase.
 * Shape language: round and soft (vase, bun, rolled cuffs), with the apron as the one flat panel.
 * Palette (60/30/10): mustard shirt #d0a030, brown apron #7a5a3a, grey trousers #6a6870; the clay
 *   vase #c8703a is the accent, with a blue hair band #3a6ab0 as the small second accent.
 * Value plan: dark hair against the light face; the bright vase over the dark brown apron.
 * Bodies: skin (clay smudges on cheeks and forearms), ears, hair, bun, band, shirt, rolls, apron,
 *   pants, cuffs, clogs, vase.
 * Rig: the humanoid kind's skeleton and clips with a two-hand `hold` on the vase (rigid on `hand.R`).
 */

// The two-hand hold (left arm; the right mirrors it): the fists grip the sides of the vase.
const HOLD_ELBOW = [0.17, 0.337, 0.04] as const;
const HOLD_WRIST = [0.125, 0.327, 0.135] as const;
// The vase: base center and height; it stands upright between the fists.
const VASE = { x: 0, y: 0.212, z: 0.2, s: 1.12 };

const C = {
  clay: '#b8683a',
  apron: '#7a5a3a',
  apronSeam: '#5e4326',
  pants: '#908e97',
  cuff: '#a6a4ac',
  clog: '#6b4226',
  clogSole: '#4a2c18',
  vase: '#c8703a',
  ring: '#a8582a',
  inside: '#6a3418',
  band: '#3a6ab0',
  hair: '#4a2e1c',
};

export default humanoidAsset({
  name: 'potter',
  description: 'A calm, smiling potter in a mustard shirt and a clay-stained apron, holding up a fresh orange vase.',
  reference: 'docs/npc-mockups/potter_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { umber: '#3a2216', black: '#231a17', blond: '#c4974a', auburn: '#8e3b1c', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { mustard: '#d0a030', terracotta: '#b5603c', olive: '#8a8a42', woad: '#5a6a88' },
  },
  presets: {
    kiln: { skin: 'tan', hair: 'black', eyes: 'hazel', cloth: 'terracotta' },
  },
  hair: false,
  undershirt: false,
  pants: false,
  shoes: false,
  hold: { elbow: HOLD_ELBOW, wrist: HOLD_WRIST },

  // Clay smudges on the cheeks (low and outside the eyes) and on the bare forearms.
  paintSkin(skin, h) {
    const { ELBOW, WRIST } = h.joints;
    const smudge = (x: number, y: number, a: number) =>
      sdf.union(
        h.onFace(sdf.ellipsoid([0.024, 0.014, 0.08]).rotateZ(a), x, y),
        h.onFace(sdf.ellipsoid([0.012, 0.01, 0.08]).rotateZ(-a), x + 0.012 * Math.sign(x || 1), y - 0.014),
      );
    const cheeks = sdf.union(smudge(-0.14, 0.545, 25), smudge(0.136, 0.548, -30));
    const arm = (t: number, dx: number, dy: number, r: number) =>
      sdf.ellipsoid([r, r * 0.7, r * 1.1]).at(
        ELBOW[0] + (WRIST[0] - ELBOW[0]) * t + dx,
        ELBOW[1] + (WRIST[1] - ELBOW[1]) * t + dy,
        ELBOW[2] + (WRIST[2] - ELBOW[2]) * t,
      );
    const forearms = sdf.union(arm(0.62, 0.0, 0.0, 0.03), arm(0.8, 0.012, 0.012, 0.02), arm(0.5, -0.01, -0.01, 0.015)).mirror('x', 0);
    return skin.paintWhere(cheeks, C.clay, 0.004).paintWhere(forearms, C.clay, 0.006);
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

    // ------------------------------------------------------------------ hair: a snug cap, locks, and a top-knot bun
    const headPose = (s: sdf.Shape) => s.at(0, HEAD_Y, 0);
    const R = [0.214, 0.208, 0.2] as const; // the lock shell, just outside the skull
    // A point on the lock shell: yaw (0 front, + toward +X), pitch (0 level, 90 crown), and a lift.
    const on = (yaw: number, pitch: number, rad: number, lift = 0): [number, number, number, number] => {
      const y = (yaw * Math.PI) / 180;
      const p = (pitch * Math.PI) / 180;
      const l = 1 + lift;
      return [Math.sin(y) * Math.cos(p) * R[0] * l, Math.sin(p) * R[1] * l + 0.008, Math.cos(y) * Math.cos(p) * R[2] * l - 0.01, rad];
    };
    const lock = (pts: [number, number, number, number][], blend = 0.014) => sdf.chain(pts, blend);

    // The cap hugs the skull; its hairline slopes up toward the forehead and leaves the ears free.
    const shell = sdf.ellipsoid([0.211, 0.205, 0.196]).at(0, 0.008, -0.01);
    const cap = shell.smoothIntersect(0.02, sdf.halfSpace([0, -1, 0.5], 0.01)).smoothIntersect(0.025, sdf.halfSpace([0, -1, 0], 0.075));

    // The fringe: three sleek locks sweep from the part (viewer's left) over the forehead to the
    // temple on the viewer's right, and one short lock hangs in front of the ear on the left.
    const fringe = [
      lock([on(-36, 68, 0.03, 0.01), on(-8, 58, 0.034, 0.03), on(24, 42, 0.032, 0.03), on(56, 24, 0.028, 0.02), on(80, 8, 0.022, 0.01)]),
      lock([on(-26, 60, 0.028, 0.01), on(2, 48, 0.031, 0.03), on(30, 32, 0.029, 0.028), on(62, 14, 0.024, 0.015)]),
      lock([on(-12, 52, 0.026, 0.01), on(14, 40, 0.028, 0.026), on(40, 24, 0.025, 0.022)]),
      lock([on(-66, 40, 0.026, 0.01), on(-76, 18, 0.024, 0.02), on(-74, -4, 0.018, 0.015)]),
    ];
    // The back and the nape: the hair behind the ears comes down to the nape in three broad locks.
    const backCap = shell.smoothIntersect(0.02, sdf.halfSpace([0, 0, 1], -0.06)).smoothIntersect(0.025, sdf.halfSpace([0, -1, 0], 0.07));
    const backLocks = [-42, 0, 42].map((yaw) =>
      lock([on(180 + yaw, 52, 0.036, 0.0), on(180 + yaw, 28, 0.04, 0.018), on(180 + yaw, 4, 0.038, 0.018), on(180 + yaw, -14, 0.03, 0.01)], 0.02),
    );
    const hairShape = headPose(sdf.smoothUnion(0.016, cap, backCap, ...fringe, ...backLocks)).bone('head');
    k.body('hair', hairShape, { color: hairColor, roughness: 0.6, detail: 0.005 });


    // The top-knot: a neat coil of two rings on a round base, leaning a little to the viewer's left, with a blue band.
    const knotAt = [-0.025, 0.205, -0.07] as const;
    const kc = (dx: number, dy: number, dz: number) => [knotAt[0] + dx, knotAt[1] + dy, knotAt[2] + dz] as const;
    const knot = sdf.smoothUnion(
      0.016,
      sdf.sphere(0.048).at(...kc(0, 0.025, 0)),
      sdf.torus(0.034, 0.024).rotateX(12).at(...kc(0, 0.064, 0)),
      sdf.torus(0.027, 0.021).rotateX(-12).at(...kc(0, 0.1, 0)),
      sdf.sphere(0.028).at(...kc(0, 0.12, 0)),
    );
    k.body('bun', headPose(knot).bone('head'), { color: hairColor, roughness: 0.6, detail: 0.005 });
    const band = sdf.torus(0.046, 0.0145).at(...kc(0, 0.034, 0));
    k.body('band', headPose(band).bone('head'), { color: C.band, roughness: 0.7, detail: 0.004 });

    // ------------------------------------------------------------------ larger ears (the mockup's)
    const ear = sdf
      .ellipsoid([0.02, 0.054, 0.036])
      .subtract(sdf.sphere(0.017).at(0.013, 0.004, 0.006))
      .rotateZ(-14)
      .rotateY(-14)
      .at(0.208, 0.633, -0.012);
    k.body('ears', pair(ear.bone('head')), { color: k.tint('skin'), roughness: 0.55, detail: 0.004, textureDensity: 2 });

    // ------------------------------------------------------------------ shirt: mustard, sleeves rolled twice
    const rollColor = k.tint('cloth', { color: '#b8892a', follow: 1 });
    const sleeves = h.perArm((j) => {
      const mid = lerp(j.ELBOW, j.WRIST, 0.12);
      return sdf.smoothUnion(
        0.012,
        sdf.cone(lerp(SHOULDER, j.ELBOW, -0.1), j.ELBOW, 0.048, 0.044).bone('upperarm.L'),
        sdf.cone(j.ELBOW, mid, 0.044, 0.046).bone('forearm.L'),
      );
    });
    const shirt = sdf.smoothUnion(0.012, h.weighted(h.torso), sleeves).paintWhere(h.band(0.447, 0.5), rollColor, 0.003);
    k.body('shirt', shirt, { color: h.tint.shirt!, roughness: 0.85 });
    const rolls = h.perArm((j) => {
      const a = lerp(j.ELBOW, j.WRIST, 0.12);
      const b = lerp(j.ELBOW, j.WRIST, 0.3);
      const c = lerp(j.ELBOW, j.WRIST, 0.44);
      return sdf.smoothUnion(
        0.006,
        sdf.cone(a, b, 0.05, 0.052).round(0.004).bone('forearm.L'),
        sdf.cone(lerp(j.ELBOW, j.WRIST, 0.29), c, 0.049, 0.05).round(0.004).bone('forearm.L'),
      );
    });
    k.body('rolls', rolls, { color: rollColor, roughness: 0.85, detail: 0.004 });

    // ------------------------------------------------------------------ apron: bib, straps, an A-line skirt panel
    const shell2 = h.torso.round(0.014).subtract(h.torso.round(-0.003));
    const front = (x: number, y0: number, y1: number) => sdf.box([2 * x, y1 - y0, 0.4], 0.01).at(0, (y0 + y1) / 2, 0.2);
    const bib = shell2.intersect(front(0.088, 0.255, 0.42));
    const strap = shell2
      .intersect(sdf.box([0.036, 0.5, 0.6]).at(0.076, 0.4, 0))
      .intersect(sdf.halfSpace([0, -1, 0], -0.3))
      .intersect(sdf.halfSpace([0, 1, 0], 0.5))
      .bone('chest');
    const skirtOuter = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.29],
            [0.14, 0.29],
            [0.158, 0.25],
            [0.172, 0.21],
            [0.178, 0.19],
            [0.182, 0.15],
            [0.184, 0.138],
            [0, 0.138],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.8]);
    const skirtInner = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.3],
            [0.126, 0.3],
            [0.144, 0.25],
            [0.158, 0.21],
            [0.164, 0.19],
            [0.168, 0.15],
            [0.17, 0.128],
            [0, 0.128],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.78]);
    const skirt = skirtOuter.subtract(skirtInner).intersect(sdf.box([0.31, 0.25, 0.4], 0.02).at(0, 0.2, 0.2));
    const stain = (x: number, y: number, rx: number, ry: number, a: number) => sdf.ellipsoid([rx, ry, 0.3]).rotateZ(a).at(x, y, 0.15);
    const stains = sdf.union(
      stain(-0.07, 0.19, 0.018, 0.012, 20),
      stain(0.06, 0.2, 0.016, 0.01, -30),
      stain(0.01, 0.16, 0.03, 0.007, 5),
      stain(-0.1, 0.225, 0.01, 0.016, -10),
      stain(0.1, 0.178, 0.012, 0.008, 40),
    );
    const apron = sdf
      .smoothUnion(0.008, h.weighted(bib), pair(strap), h.weighted(skirt))
      .paintWhere(h.band(0.262, 0.274), C.apronSeam, 0.002)
      .paintWhere(h.band(0.147, 0.157), C.apronSeam, 0.002)
      .paintWhere(stains, C.clay, 0.006);
    k.body('apron', apron, {
      color: C.apron,
      roughness: 0.9,
      detail: 0.005,
      bump: (x, y, z) => 0.0025 * Math.sin(x * 70 + y * 20) * Math.cos(z * 60 + y * 30),
    });

    // ------------------------------------------------------------------ grey trousers with rolled cuffs, brown clogs
    const trouserLeg = sdf.smoothUnion(
      0.012,
      sdf.capsule(HIP, KNEE, 0.05).bone('leg.L'),
      sdf.cone(KNEE, [ANKLE[0], 0.115, 0.002], 0.048, 0.047).bone('shin.L'),
    );
    k.body('pants', sdf.smoothUnion(0.03, sdf.ellipsoid([0.118, 0.052, 0.088]).at(0, 0.2, 0).bone('hips'), pair(trouserLeg)), {
      color: C.pants,
      roughness: 0.85,
    });
    const cuff = sdf.cylinder(0.056, 0.04, 0.016).at(ANKLE[0], 0.122, 0.002).bone('shin.L');
    k.body('cuffs', pair(cuff), { color: C.cuff, roughness: 0.9, detail: 0.004 });

    const clog = sdf
      .smoothUnion(0.03, sdf.ellipsoid([0.058, 0.04, 0.105]).at(0, 0.04, 0.04), sdf.sphere(0.052).at(0, 0.05, -0.008))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const clogSole = clog.round(0.004).intersect(sdf.halfSpace([0, 1, 0], 0.017)).intersect(sdf.halfSpace([0, -1, 0], 0));
    const clogPlaced = sdf.union(clog, clogSole.paint(C.clogSole)).rotateY(12).at(ANKLE[0], 0, 0).bone('foot.L');
    k.body('clogs', pair(clogPlaced), { color: C.clog, roughness: 0.65 });

    // ------------------------------------------------------------------ the vase, held upright between the fists
    const vaseProfile = profile.polygon(
      [
        [0, 0.0],
        [0.034, 0.0],
        [0.05, 0.014],
        [0.064, 0.048],
        [0.067, 0.076],
        [0.056, 0.108],
        [0.036, 0.13],
        [0.03, 0.148],
        [0.036, 0.166],
        [0.05, 0.182],
        [0.043, 0.184],
        [0.0, 0.178],
      ],
      { smooth: true, samples: 8 },
    );
    const body = sdf.revolve(vaseProfile);
    const mouth = sdf.cylinder(0.027, 0.05, 0.004).at(0, 0.18, 0);
    const handle = sdf.chain(
      [
        [0.034, 0.154, 0, 0.013],
        [0.072, 0.164, 0, 0.015],
        [0.098, 0.138, 0, 0.016],
        [0.09, 0.106, 0, 0.016],
        [0.064, 0.09, 0, 0.014],
      ],
      0.01,
    );
    const ringY = (y0: number, y1: number) => sdf.box([0.5, y1 - y0, 0.5]).at(0, (y0 + y1) / 2, 0);
    const vase = sdf
      .smoothUnion(0.012, body, handle)
      .subtract(mouth)
      .paintWhere(ringY(0.05, 0.062), C.ring, 0.002)
      .paintWhere(ringY(0.088, 0.1), C.ring, 0.002)
      .paintWhere(ringY(0.118, 0.126), C.ring, 0.002)
      .paintWhere(sdf.cylinder(0.03, 0.05).at(0, 0.18, 0), C.inside, 0.002)
      .scale(VASE.s)
      .at(VASE.x, VASE.y, VASE.z)
      .bone('hand.R');
    k.body('vase', vase, {
      color: C.vase,
      roughness: 0.7,
      detail: 0.004,
      bump: (x, y, z) => 0.0015 * Math.sin(y * 150) + 0.001 * Math.sin(x * 90 + z * 70),
    });
  },
});
