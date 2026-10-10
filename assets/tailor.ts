import { profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Tailor — Chibi Quest settlement NPC (catalog `npcs/settlement/tailor`), about 1.0 m to the top of
 * the hair, faces +Z. Target: docs/npc-mockups/tailor_001.jpg. Built on the humanoid kind.
 *
 * Role: the tailor shop NPC (sells and dyes clothes), seen in 3D and as a 128 px sprite. The big
 *   silver scissors raised in the right hand and the red spool in the left hand must read.
 * One idea: a neat, smiling girl with a black bob who holds up oversize scissors and a spool of thread.
 * Shape language: round and soft (puffed sleeves, bob, spool), with the long scissors as the one hard form.
 * Palette (60/30/10): dark gray #4a4448 (skirt, bib) and black hair #231a17; teal #2a6a6a (blouse, the
 *   cloth slot); yellow tape #e0c040; red accents #c84040 (bow, pincushion) and thread #b03a5a.
 * Value plan: black hair and dark skirt frame the light face; the yellow tape and the silver scissors are
 *   the focal points; the red spool is the accent.
 * Bodies: skin (smile), blouse, skirt, tape, hair, bow, shoes, scissors, grips, spool, thread, cushion.
 * Rig: the humanoid kind's skeleton and clips. Both arms keep a held pose in every clip (a `pose`):
 *   the right fist raises the scissors beside the head, the left fist holds the spool out.
 */

const POSE_R = { elbow: [0.2, 0.34, 0.02], wrist: [0.25, 0.42, 0.07] } as const;
const POSE_L = { elbow: [0.2, 0.31, 0.03], wrist: [0.265, 0.29, 0.1] } as const;

const C = {
  hair: '#231a17',
  pin: '#c84040',
  tape: '#e0c040',
  tapeMark: '#2a2428',
  skirt: '#4a4448',
  seam: '#38323a',
  shoe: '#2a2428',
  steel: '#c8ccd4',
  grip: '#2a2428',
  wood: '#9a6a3a',
  thread: '#b03a5a',
  cushion: '#c84040',
  band: '#4a4448',
  mouth: '#8a2e2a',
  tongue: '#d8706a',
  teeth: '#fbf6ee',
};

export default humanoidAsset({
  name: 'tailor',
  description: 'A neat, friendly tailor girl with a black bob, a yellow measuring tape, big silver scissors, and a spool of red thread.',
  reference: 'docs/npc-mockups/tailor_001.jpg',
  variants: {
    skin: { light: '#e8b48e', fair: '#f2c7a4', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { black: '#231a17', brown: '#5a301d', blond: '#c4974a', auburn: '#8e3b1c', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { teal: '#2a6a6a', plum: '#7a3f62', indigo: '#3a4a80', saffron: '#b8862c' },
  },
  presets: {
    indigo: { skin: 'tan', hair: 'auburn', eyes: 'green', cloth: 'indigo' },
  },
  hair: false,
  undershirt: false,
  pants: false,
  shoes: false,
  pose: { L: POSE_L, R: POSE_R },

  // A bright open smile with round corners and one band of teeth, and thicker arched brows.
  paintSkin(skin, h) {
    const y = 0.538;
    const grin = profile.polygon(
      [
        [-0.05, 0.012],
        [-0.028, 0.003],
        [0, 0.0],
        [0.028, 0.003],
        [0.05, 0.012],
        [0.043, -0.01],
        [0.022, -0.026],
        [0, -0.031],
        [-0.022, -0.026],
        [-0.043, -0.01],
      ],
      { smooth: true, samples: 6 },
    );
    const mouth = h.onFace(sdf.extrude(grin, 0.3), 0, y);
    const teeth = mouth.intersect(sdf.halfSpace([0, -1, 0], -(y - 0.009))).intersect(sdf.box([0.056, 0.1, 1]).at(0, y, 0));
    const tongue = h.onFace(sdf.ellipsoid([0.022, 0.012, 0.08]), 0, y - 0.026);
    const oldBrows = sdf.extrude(profile.arc(0.1, 0.036, 54, 126), 0.3).at(0.1, 0.622, 0.1).mirror('x');
    const brows = sdf.extrude(profile.arc(0.07, 0.016, 55, 125), 0.3).at(0.1, 0.657, 0.1).mirror('x');
    return skin
      .paintWhere(oldBrows, h.tint.skin!, 0.002)
      .paintWhere(brows, h.tint.brow!, 0.002)
      .paintWhere(mouth, C.mouth)
      .paintWhere(tongue.intersect(mouth), C.tongue, 0.004)
      .paintWhere(teeth, C.teeth, 0.002);
  },

  extra(k, h) {
    const { SHOULDER, ANKLE, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    type P3 = [number, number, number];
    const lerp = (a: readonly number[], b: readonly number[], t: number): P3 => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];

    // ------------------------------------------------------------------ blouse: the torso and puffed sleeves
    const puffArm = h.perArm((j) =>
      sdf.smoothUnion(
        0.02,
        sdf.ellipsoid([0.062, 0.058, 0.06]).at(...lerp(SHOULDER, j.ELBOW, 0.42)).bone('upperarm.L'),
        sdf.cone(lerp(SHOULDER, j.ELBOW, 0.3), lerp(SHOULDER, j.ELBOW, 0.92), 0.055, 0.047).bone('upperarm.L'),
      ),
    );
    const collarBand = h.band(0.43, 0.455);
    const blouse = sdf.smoothUnion(0.012, h.weighted(h.torso), puffArm).paintWhere(collarBand, h.tint.trim!, 0.003);
    k.body('blouse', blouse, { color: h.tint.shirt!, roughness: 0.85, detail: 0.005 });

    // ------------------------------------------------------------------ skirt and pinafore bib (dark gray)
    const skirtShape = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.3],
            [0.136, 0.3],
            [0.14, 0.27],
            [0.155, 0.235],
            [0.175, 0.205],
            [0.192, 0.18],
            [0.19, 0.17],
            [0, 0.17],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.9]);
    const shell = h.torso.round(0.012).subtract(h.torso.round(-0.003));
    const bib = shell.intersect(sdf.box([0.17, 0.15, 0.4], 0.01).at(0, 0.34, 0.2));
    const strap = shell
      .intersect(sdf.box([0.036, 0.5, 0.6]).at(0.07, 0.4, 0))
      .intersect(sdf.halfSpace([0, -1, 0], -0.3))
      .intersect(sdf.halfSpace([0, 1, 0], 0.46))
      .bone('chest');
    const hemBand = sdf.halfSpace([0, 1, 0], 0.188).intersect(sdf.box([0.6, 0.1, 0.6]).at(0, 0.17, 0));
    const skirt = sdf
      .smoothUnion(0.01, h.weighted(bib), pair(strap), h.weighted(skirtShape))
      .paintWhere(h.band(0.288, 0.3), C.seam, 0.002)
      .paintWhere(hemBand, C.seam, 0.003);
    k.body('skirt', skirt, { color: C.skirt, roughness: 0.9, detail: 0.005, bump: (x, y, z) => 0.0025 * Math.sin(Math.atan2(x, z) * 14 + y * 4) });

    // ------------------------------------------------------------------ measuring tape: a ring on the shoulders and two ends down the front
    const ring = shell.intersect(h.band(0.412, 0.452));
    const front = (x0: number, x1: number, yTop: number, yBot: number) => sdf.box([x1 - x0, yTop - yBot, 0.4], 0.004).at((x0 + x1) / 2, (yTop + yBot) / 2, 0.2);
    const tapeShell = h.torso.round(0.0175).subtract(h.torso.round(0.008));
    const endA = tapeShell.intersect(front(-0.05, -0.006, 0.45, 0.296));
    const endB = tapeShell.intersect(front(0.006, 0.05, 0.45, 0.325));
    const tape = sdf
      .smoothUnion(0.004, ring.round(0.002), endA, endB)
      .paintFn((x, y, z, base) => (Math.abs(((y * 1000) % 14) / 14 - 0.5) > 0.4 && z > 0.02 && y < 0.41 ? ([0x2a / 255, 0x24 / 255, 0x28 / 255] as const) : base));
    k.body('tape', h.weighted(tape), { color: C.tape, roughness: 0.6, detail: 0.003, textureDensity: 2 });

    // ------------------------------------------------------------------ hair: a smooth black bob with side-swept bangs
    const headPose = (s: sdf.Shape) => s.at(0, HEAD_Y, 0).bone('head');
    const shellH = sdf.ellipsoid([0.214, 0.208, 0.2]);
    const RX = 0.224;
    const RY = 0.218;
    const RZ = 0.21;
    // A point on the hair shell at x and y (z from the ellipsoid, front side).
    const onShell = (x: number, y: number): P3 => [x, y, RZ * Math.sqrt(Math.max(0.02, 1 - (x / RX) ** 2 - (y / RY) ** 2)) - 0.002];
    const capTop = shellH.smoothIntersect(0.025, sdf.halfSpace([0, -1, 0], -0.09));
    // The bob: one smooth mass behind and beside the head, round at the lower edge, with the ears free.
    const bobMass = sdf
      .ellipsoid([0.236, 0.22, 0.226])
      .at(0, 0.0, -0.012)
      .smoothIntersect(0.04, sdf.halfSpace([0, -1, 0], 0.105))
      .smoothIntersect(0.04, sdf.halfSpace([0, 0, 1], 0.075));
    const earHole = sdf.ellipsoid([0.07, 0.055, 0.05]).at(0.215, -0.07, -0.012).mirror('x', 0);
    const bob = sdf.smoothSubtract(0.02, bobMass, earHole);
    // The side-swept bangs: three thick sweeps from a part on the viewer's right across the forehead to
    // the viewer's left temple, and a short lock on the right temple.
    const sweep = (pts: [number, number][], r0: number, r1: number) =>
      sdf.chain(pts.map(([x, y], i) => [...onShell(x, y), r0 + ((r1 - r0) * i) / (pts.length - 1)] as [number, number, number, number]), 0.02);
    const bangs = [
      sweep([[0.08, 0.2], [-0.02, 0.14], [-0.11, 0.1], [-0.19, 0.04]], 0.04, 0.032),
      sweep([[0.11, 0.17], [0.03, 0.115], [-0.06, 0.095], [-0.14, 0.07]], 0.036, 0.03),
      sweep([[0.15, 0.13], [0.17, 0.08], [0.2, 0.02]], 0.034, 0.028),
    ];
    const hairShape = headPose(sdf.smoothUnion(0.025, capTop, bob, ...bangs));
    k.body('hair', hairShape, { color: k.tint('hair'), roughness: 0.5, detail: 0.005 });

    // The red bow on the top left of the head (the viewer's left).
    const bowLoop = (s: number) => sdf.ellipsoid([0.04, 0.012, 0.02]).at(s * 0.04, 0, 0).rotateZ(s * 24);
    const bowShape = sdf
      .smoothUnion(0.006, bowLoop(-1), bowLoop(1), sdf.sphere(0.016), sdf.cone([0, 0, 0], [0.02, -0.03, 0.01], 0.008, 0.005), sdf.cone([0, 0, 0], [-0.03, -0.025, -0.005], 0.008, 0.005))
      .rotateZ(18)
      .at(-0.1, 0.19, 0.06);
    k.body('bow', headPose(bowShape), { color: C.pin, roughness: 0.55, detail: 0.003 });

    // ------------------------------------------------------------------ black shoes
    const shoe = sdf
      .smoothUnion(0.025, sdf.ellipsoid([0.054, 0.032, 0.1]).at(0, 0.032, 0.04), sdf.ellipsoid([0.046, 0.04, 0.046]).at(0, 0.04, -0.005))
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('shoes', pair(shoe), { color: C.shoe, roughness: 0.45 });

    // ------------------------------------------------------------------ the big scissors in the right fist
    // Built in the plane of the viewer: dark finger loops above the fist, a pivot, and two long closed
    // blades that point down and in, as in the mockup. The loops lean out (x < 0), away from the head.
    const gR = h.arms.R.GRIP;
    const scissorPose = (s: sdf.Shape) => s.at(0, -0.06, 0).scale(1.5).rotateZ(198).at(-gR[0] + 0.004, gR[1] + 0.005, gR[2] + 0.03);
    const LOOP = 0.026;
    const loopsOf = (s: number) => sdf.torus(LOOP, 0.0125).rotateX(90).scale([0.85, 1.1, 1]).at(s * 0.03, 0.005, 0);
    const handleBar = (s: number) => sdf.capsule([s * 0.03, 0.03, 0], [0, 0.088, 0], 0.0125);
    const blade = (s: number) =>
      sdf.extrude(
        profile.polygon([
          [-s * 0.002, 0.082],
          [-s * 0.02, 0.092],
          [-s * 0.018, 0.15],
          [-s * 0.008, 0.27],
          [s * 0.002, 0.285],
          [s * 0.012, 0.15],
          [s * 0.009, 0.088],
        ]),
        0.026,
        0.003,
      ).at(0, 0, -0.013);
    const pivot = sdf.cylinder(0.015, 0.05, 0.004).rotateX(90).at(0, 0.09, 0);
    const loops = sdf.union(loopsOf(-1), loopsOf(1));
    const metal = sdf.smoothUnion(0.006, handleBar(-1), handleBar(1), blade(1), blade(-1), pivot);
    k.body('scissors', scissorPose(metal), { color: C.steel, roughness: 0.3, metalness: 0.8, bone: 'knife.R', detail: 0.003 });
    k.body('scissor-grips', scissorPose(loops), { color: C.grip, roughness: 0.6, metalness: 0.1, bone: 'knife.R', detail: 0.003 });

    // ------------------------------------------------------------------ the spool of red thread in the left fist
    // A large spool: the fist closes on its core, the flanges stand out above and below, a thread tail rises from the top.
    const gL = h.arms.L.GRIP;
    const sc: P3 = [gL[0], gL[1] - 0.02, gL[2] + 0.01];
    const flange = (dy: number) => sdf.cylinder(0.058, 0.012, 0.004).at(sc[0], sc[1] + dy, sc[2]);
    const core = sdf.cylinder(0.026, 0.09, 0.002).at(...sc);
    k.body('spool', sdf.union(flange(-0.041), flange(0.041), core), { color: C.wood, roughness: 0.7, bone: 'knife.L', detail: 0.003 });
    const wound = sdf.cylinder(0.05, 0.07, 0.005).at(...sc);
    k.body('thread', wound, {
      color: C.thread,
      roughness: 0.85,
      bone: 'knife.L',
      detail: 0.003,
      bump: (x, y) => 0.002 * Math.sin(y * 400),
    });
    const tail = sdf.chain(
      [
        [sc[0], sc[1] + 0.045, sc[2], 0.007],
        [sc[0] + 0.004, sc[1] + 0.1, sc[2] + 0.004, 0.006],
        [sc[0] + 0.025, sc[1] + 0.15, sc[2] + 0.03, 0.006],
        [sc[0] + 0.058, sc[1] + 0.165, sc[2] + 0.07, 0.006],
      ],
      0.004,
    );
    k.body('thread-tail', tail, { color: C.thread, roughness: 0.85, bone: 'knife.L', detail: 0.003 });

    // ------------------------------------------------------------------ the red pincushion on the left wrist
    const jL = h.arms.L;
    const wristBand = sdf.cone(lerp(jL.ELBOW, jL.WRIST, 0.74), lerp(jL.ELBOW, jL.WRIST, 0.96), 0.042, 0.043).round(0.002).bone('forearm.L');
    k.body('wrist-band', wristBand, { color: C.band, roughness: 0.8, detail: 0.004 });
    const cu = lerp(jL.ELBOW, jL.WRIST, 0.85);
    const cushion = sdf.ellipsoid([0.026, 0.02, 0.026]).at(cu[0], cu[1] + 0.05, cu[2]).bone('forearm.L');
    const pins = sdf.union(
      ...[
        [-0.012, 0.008],
        [0.006, -0.01],
        [0.014, 0.012],
      ].map(([dx, dz]) => sdf.capsule([cu[0] + dx!, cu[1] + 0.058, cu[2] + dz!], [cu[0] + dx! * 1.6, cu[1] + 0.088, cu[2] + dz! * 1.6], 0.004)),
    ).bone('forearm.L');
    k.body('cushion', cushion, { color: C.cushion, roughness: 0.85, detail: 0.003 });
    k.body('pins', pins, { color: '#e8e4dc', roughness: 0.4, metalness: 0.5, detail: 0.003 });
  },
});
