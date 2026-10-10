import { profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Shrine keeper — Chibi Quest wilderness NPC (catalog `npcs/wilderness/shrine-keeper`), about 1.0 m
 * to the top of the hair, faces +Z. Target: docs/npc-mockups/shrine-keeper_001.jpg. Built on the
 * humanoid kind.
 *
 * Role: a mountain shrine NPC who blesses travelers and gives spirit quests; seen in 3D and as a
 *   128 px sprite. The raised bell wand and the glowing bowl are the focal points.
 * One idea: a gentle boy in white and pale blue who holds up a belled wand in one hand and a bowl of
 *   softly glowing water in the other, under a swoop of black hair.
 * Shape language: round and soft (wide sleeves, bow, bowl), with the thin wand as the one long line.
 * Palette (60/30/10): white robe #f6f1ea; pale blue trousers #8ab0d0 and sash #6a9ac0; black hair
 *   #231a17; accents: brass bells #c8a040 and the water #6ac0e8 (emissive).
 * Value plan: black hair over the light face on top, white robe in the middle, pale blue below; the
 *   glowing water is the brightest saturated spot.
 * Bodies: skin, hair, pin, robe, collar, cuffs, sash, bow, pants, socks, sandals, wand, bells, bowl,
 *   water, wisp.
 * Rig: the humanoid kind's skeleton and clips. Both arms keep their pose in every clip; the wand is
 *   rigid on `knife.R` and the bowl on `knife.L`.
 */

// Left-side values; the kind mirrors R to the right arm. The right hand is raised beside the head,
// the left hand held out in front at chest height.
const POSE = {
  R: { elbow: [0.2, 0.34, 0.02], wrist: [0.25, 0.42, 0.07] },
  L: { elbow: [0.17, 0.335, 0.05], wrist: [0.2, 0.33, 0.15] },
} as const;

const C = {
  robe: '#f6f1ea',
  fold: '#ddd5c8',
  trouser: '#86aea6',
  sash: '#6a9ac0',
  sock: '#f6f1ea',
  sandal: '#9a6a3a',
  wand: '#6e4a2a',
  brass: '#c8a040',
  stone: '#8a8c94',
  stoneDark: '#6e7078',
  water: '#6ac0e8',
  wisp: '#bfeef0',
  pin: '#f6f1ea',
};

type P3 = [number, number, number];

export default humanoidAsset({
  name: 'shrine-keeper',
  description: 'A gentle young shrine keeper in white and pale blue robes, holding up a belled wand and a stone bowl of glowing water.',
  reference: 'docs/npc-mockups/shrine-keeper_001.jpg',
  variants: {
    skin: { light: '#e8b48e', fair: '#f2c7a4', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { ink: '#1b1716', darkbrown: '#3a2418', black: '#231a17', brown: '#5a301d', blond: '#c4974a', auburn: '#8e3b1c', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { teal: '#86aea6', sky: '#8ab0d0', mist: '#a8bcc8', lavender: '#b4b0d0' },
  },
  presets: {
    meadow: { skin: 'tan', hair: 'brown', eyes: 'green', cloth: 'sky' },
  },
  hair: false,
  undershirt: false,
  pants: false,
  shoes: false,
  lashes: false,
  pose: POSE,

  extra(k, h) {
    const { SHOULDER, ANKLE, HIP, KNEE, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const lerp = (a: readonly number[], b: readonly number[], t: number): P3 => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];
    const cloth = h.tint.shirt!;

    // ------------------------------------------------------------------ hair: black locks over a small cap
    const headPose = (s: sdf.Shape) => s.at(0, HEAD_Y, 0).bone('head');
    const lock = (pts: [number, number, number, number][]) => sdf.chain(pts, 0.006);
    const shellH = sdf.ellipsoid([0.214, 0.208, 0.2]);
    const capTop = shellH.smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], -0.06));
    const capBack = shellH.smoothIntersect(0.04, sdf.halfSpace([0, -1, 0], 0.035)).smoothIntersect(0.03, sdf.halfSpace([0, 0, 1], -0.02));
    const capSides = shellH
      .smoothIntersect(0.015, sdf.halfSpace([0, -1, 0], 0.02))
      .smoothIntersect(0.015, sdf.halfSpace([-1, 0, 0], -0.15).mirror('x'))
      .smoothIntersect(0.015, sdf.halfSpace([0, 0, 1], 0.11));
    const nape = sdf.smoothUnion(
      0.04,
      ...[-66, -44, -22, 0, 22, 44, 66].map((a) => sdf.sphere(0.04).at(0.172 * Math.sin((a * Math.PI) / 180), -0.03, -0.162 * Math.cos((a * Math.PI) / 180))),
    );
    const locks = sdf.smoothUnion(
      0.012,
      // the fringe: six separate swept locks that end in sharp points at different heights
      lock([[-0.15, 0.17, 0.05, 0.036], [-0.13, 0.14, 0.13, 0.03], [-0.1, 0.1, 0.176, 0.02], [-0.075, 0.066, 0.19, 0.006]]),
      lock([[-0.08, 0.19, 0.06, 0.036], [-0.06, 0.15, 0.135, 0.03], [-0.035, 0.1, 0.184, 0.02], [-0.0, 0.07, 0.197, 0.006]]),
      lock([[-0.01, 0.2, 0.06, 0.036], [0.01, 0.16, 0.135, 0.03], [0.04, 0.11, 0.182, 0.02], [0.075, 0.095, 0.192, 0.006]]),
      lock([[0.06, 0.2, 0.05, 0.034], [0.09, 0.16, 0.12, 0.028], [0.12, 0.12, 0.16, 0.018], [0.16, 0.1, 0.168, 0.006]]),
      lock([[0.13, 0.17, 0.04, 0.034], [0.17, 0.125, 0.09, 0.026], [0.19, 0.075, 0.1, 0.018], [0.2, 0.03, 0.09, 0.008]]),
      // the viewer's-left side lock past the ear
      lock([[-0.14, 0.17, 0.04, 0.034], [-0.18, 0.125, 0.09, 0.026], [-0.2, 0.075, 0.095, 0.018], [-0.205, 0.03, 0.085, 0.008]]),
      // crown spikes that stand up and sweep to the viewer's left, on top of the head (no side lumps)
      lock([[-0.02, 0.19, 0.0, 0.034], [-0.08, 0.235, 0.0, 0.026], [-0.15, 0.25, 0.0, 0.016], [-0.21, 0.235, 0.0, 0.005]]),
      lock([[0.03, 0.195, -0.03, 0.034], [-0.02, 0.24, -0.04, 0.026], [-0.09, 0.26, -0.05, 0.016], [-0.15, 0.255, -0.05, 0.005]]),
      lock([[0.07, 0.19, 0.02, 0.03], [0.07, 0.24, 0.03, 0.022], [0.04, 0.275, 0.03, 0.012], [0.0, 0.29, 0.03, 0.005]]),
      lock([[0.0, 0.18, -0.08, 0.034], [-0.04, 0.22, -0.1, 0.024], [-0.1, 0.235, -0.12, 0.014], [-0.15, 0.225, -0.12, 0.005]]),
    );
    const hairLocal = sdf.smoothUnion(0.025, capTop, capBack, capSides, nape, locks);
    k.body('hair', headPose(hairLocal), { color: k.tint('hair'), roughness: 0.5, detail: 0.005 });
    // A small white hair clip at the viewer's right temple, placed on the hair surface.
    const pinY = sdf.raycast(hairLocal, [0.135, 0.4, 0.085], [0, -1, 0])?.[1] ?? 0.14;
    const pin = sdf
      .smoothUnion(0.004, sdf.ellipsoid([0.034, 0.011, 0.011]).rotateZ(30), sdf.ellipsoid([0.03, 0.011, 0.011]).rotateZ(-35).at(0.004, -0.014, 0))
      .rotateX(-35)
      .at(0.135, pinY - 0.004, 0.09);
    k.body('pin', headPose(pin), { color: C.pin, roughness: 0.6, detail: 0.003 });

    // ------------------------------------------------------------------ white robe top with wide sleeves
    const notch = sdf.ellipsoid([0.04, 0.075, 0.07]).rotateX(-20).at(0, 0.455, 0.09);
    const torsoRobe = h.torso.round(0.014).intersect(h.band(0.16, 0.5)).smoothSubtract(0.01, notch);
    const sleeves = h.perArm((j) => {
      const mid = lerp(j.ELBOW, j.WRIST, 0.45);
      return sdf.smoothUnion(
        0.025,
        sdf.cone(lerp(SHOULDER, j.ELBOW, -0.1), j.ELBOW, 0.058, 0.068).bone('upperarm.L'),
        sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.8), 0.064, 0.082).bone('forearm.L'),
        // the hanging drape of the wide sleeve below the forearm
        sdf.ellipsoid([0.05, 0.11, 0.055]).at(mid[0], mid[1] - 0.1, mid[2]).bone('forearm.L'),
      );
    });
    const robe = sdf
      .smoothUnion(0.015, h.weighted(torsoRobe), sleeves)
      .paintFn((x, y, z, base) => {
        // a darker fold line for the crossed front (the left panel over the right) and the hem
        const lapel = Math.abs(x - 0.05 + (y - 0.4) * 0.5) < 0.004 && z > 0.05 && y > 0.29 && y < 0.46 ? 1 : 0;
        return lapel ? ([0xdd / 255, 0xd5 / 255, 0xc8 / 255] as const) : base;
      });
    k.body('robe', robe, {
      color: C.robe,
      roughness: 0.9,
      detail: 0.005,
      bump: (x, y, z) => 0.0025 * Math.sin(x * 70 + y * 20) * Math.cos(z * 60),
    });

    // The pale blue under-collar (a V at the neck) and the cuffs of the wide sleeves.
    const vee = sdf
      .smoothUnion(0.008, h.torso.round(0.006).intersect(sdf.ellipsoid([0.052, 0.088, 0.08]).rotateX(-20).at(0, 0.455, 0.09)), sdf.torus(0.056, 0.015).at(0, 0.478, -0.012))
      .bone('chest');
    const cuffs = h.perArm((j) => sdf.cone(lerp(j.ELBOW, j.WRIST, 0.76), lerp(j.ELBOW, j.WRIST, 0.82), 0.082, 0.084).round(0.003).bone('forearm.L'));
    k.body('collar', vee, { color: cloth, roughness: 0.9, detail: 0.004 });
    k.body('cuffs', cuffs, { color: C.fold, roughness: 0.9, detail: 0.004 });

    // ------------------------------------------------------------------ sash with a bow
    const sashBase = h.torso.round(0.024);
    const sash = h.weighted(sashBase.smoothIntersect(0.006, h.band(0.238, 0.288)));
    k.body('sash', sash, { color: k.tint('cloth', -0.14), roughness: 0.85, detail: 0.004 });
    const bz = sdf.raycast(sashBase, [0, 0.262, 1], [0, 0, -1])?.[2] ?? 0.12;
    const bow = sdf
      .smoothUnion(
        0.012,
        sdf.sphere(0.024).at(0, 0.262, bz + 0.006),
        sdf.ellipsoid([0.042, 0.03, 0.02]).rotateZ(20).at(-0.05, 0.275, bz + 0.002),
        sdf.ellipsoid([0.042, 0.03, 0.02]).rotateZ(-20).at(0.05, 0.275, bz + 0.002),
        sdf.ellipsoid([0.024, 0.06, 0.016]).rotateZ(8).at(-0.018, 0.2, bz + 0.004),
        sdf.ellipsoid([0.024, 0.056, 0.016]).rotateZ(-10).at(0.02, 0.204, bz + 0.006),
      )
      .bone('spine');
    k.body('bow', bow, { color: k.tint('cloth', -0.14), roughness: 0.85, detail: 0.004 });

    // ------------------------------------------------------------------ wide trousers, white socks, wooden sandals
    const trouserLeg = sdf.smoothUnion(
      0.02,
      sdf.capsule(HIP, KNEE, 0.064).bone('leg.L'),
      sdf.cone(KNEE, [ANKLE[0], 0.112, 0.002], 0.064, 0.062).bone('shin.L'),
    );
    k.body('pants', sdf.smoothUnion(0.03, sdf.ellipsoid([0.115, 0.058, 0.086]).at(0, 0.2, 0).bone('hips'), pair(trouserLeg)), {
      color: cloth,
      roughness: 0.85,
      detail: 0.005,
    });
    const sockFoot = sdf.ellipsoid([0.04, 0.033, 0.068]).at(0, 0.044, 0.035);
    const sock = sdf
      .smoothUnion(0.012, sockFoot, sdf.cylinder(0.036, 0.1, 0.01).at(0, 0.098, 0).bone('shin.L'))
      .rotateY(10)
      .at(ANKLE[0], 0, 0);
    k.body('socks', pair(sock.bone('foot.L')), { color: C.sock, roughness: 0.9, detail: 0.004 });
    const sandal = (() => {
      const sole = sdf.ellipsoid([0.05, 0.03, 0.1]).at(0, 0, 0.036).intersect(sdf.halfSpace([0, 1, 0], 0.014)).intersect(sdf.halfSpace([0, -1, 0], 0));
      const wrap = sockFoot.round(0.007).subtract(sockFoot.round(0.0));
      const strapA = wrap.intersect(sdf.box([0.2, 0.2, 0.016]).at(0, 0.05, 0.03));
      const strapB = wrap.intersect(sdf.box([0.2, 0.2, 0.014]).at(0, 0.05, 0.075));
      return sdf.smoothUnion(0.006, sole, strapA, strapB).rotateY(10).at(ANKLE[0], 0, 0).bone('foot.L');
    })();
    k.body('sandals', pair(sandal), { color: C.sandal, roughness: 0.75, detail: 0.0035 });

    // ------------------------------------------------------------------ the bell wand, built at the raised right grip
    const gr = h.arms.R.GRIP;
    const g: P3 = [-gr[0], gr[1], gr[2]]; // the right fist is at x < 0
    const dir = (() => {
      const v: P3 = [-0.22, 1, 0.06];
      const n = Math.hypot(...v);
      return [v[0] / n, v[1] / n, v[2] / n] as P3;
    })();
    const along = (t: number): P3 => [g[0] + dir[0] * t, g[1] + dir[1] * t, g[2] + dir[2] * t];
    const side = (t: number, s: number, d: number): P3 => {
      const p = along(t);
      return [p[0] + s * d, p[1], p[2]];
    };
    const stubTipA = side(0.36, -1, 0.05);
    const stubTipB = side(0.2, 1, 0.04);
    const wand = sdf.smoothUnion(
      0.006,
      sdf.capsule(along(-0.24), along(0.42), 0.0165),
      sdf.sphere(0.021).at(...along(0.425)),
      // the crossbar near the top and a short side stub that carry the cords
      sdf.capsule(side(0.36, 1, 0.05), stubTipA, 0.011),
      sdf.capsule(along(0.2), stubTipB, 0.009),
    );
    k.body('wand', wand.bone('knife.R'), {
      color: C.wand,
      roughness: 0.8,
      detail: 0.003,
      bump: (x, y, z) => 0.0015 * Math.sin(y * 140 + x * 40) * Math.cos(z * 80),
    });
    const bell = (c: P3) =>
      sdf.smoothUnion(
        0.004,
        sdf.ellipsoid([0.0185, 0.0165, 0.0185]).at(c[0], c[1] - 0.012, c[2]),
        sdf.capsule([c[0], c[1] + 0.004, c[2]], [c[0], c[1] + 0.022, c[2]], 0.004),
      );
    const bells = sdf.union(
      bell([stubTipA[0], stubTipA[1] - 0.012, stubTipA[2]]),
      bell([stubTipB[0], stubTipB[1] - 0.012, stubTipB[2]]),
      bell(side(0.28, 0, 0)).at(0, 0.0, 0),
    );
    k.body('bells', bells.bone('knife.R'), { color: C.brass, roughness: 0.35, metalness: 0.7, detail: 0.003 });

    // ------------------------------------------------------------------ the stone bowl of glowing water, at the left fist
    const G = h.arms.L.GRIP;
    const bc: P3 = [G[0], G[1] + 0.05, G[2] + 0.03];
    const bowl = sdf
      .revolve(
        profile.polygon(
          [
            [0, -0.02],
            [0.026, -0.02],
            [0.04, -0.012],
            [0.05, 0.004],
            [0.052, 0.022],
            [0.044, 0.024],
            [0.042, 0.008],
            [0.03, -0.002],
            [0, -0.002],
          ],
          { smooth: true, samples: 5 },
        ),
      )
      .at(...bc);
    const foot = sdf.cylinder(0.026, 0.01, 0.004).at(bc[0], bc[1] - 0.02, bc[2]);
    k.body('bowl', sdf.smoothUnion(0.006, bowl, foot).bone('knife.L'), {
      color: C.stone,
      roughness: 0.9,
      detail: 0.003,
      bump: (x, y, z) => 0.0015 * Math.sin(x * 120 + z * 90) * Math.cos(y * 110),
    });
    k.body('water', sdf.cylinder(0.043, 0.012, 0.005).at(bc[0], bc[1] + 0.011, bc[2]).bone('knife.L'), {
      color: C.water,
      emissive: C.water,
      emissiveIntensity: 0.5,
      roughness: 0.2,
      detail: 0.003,
    });
    const wisp = sdf.chain(
      [
        [bc[0], bc[1] + 0.02, bc[2], 0.018],
        [bc[0] + 0.012, bc[1] + 0.055, bc[2] - 0.004, 0.015],
        [bc[0] - 0.008, bc[1] + 0.09, bc[2] + 0.004, 0.012],
        [bc[0] + 0.012, bc[1] + 0.125, bc[2], 0.008],
        [bc[0], bc[1] + 0.15, bc[2] + 0.004, 0.004],
      ],
      0.01,
    );
    k.body('wisp', wisp.bone('knife.L'), {
      color: C.wisp,
      emissive: C.wisp,
      emissiveIntensity: 0.5,
      opacity: 0.7,
      roughness: 0.3,
      detail: 0.003,
    });
  },
});
