import { profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Acolyte — Chibi Quest settlement NPC (catalog `npcs/settlement/acolyte`), about 1.0 m to the top
 * of the hair, faces +Z. Target: docs/npc-mockups/acolyte_001.jpg. Built on the humanoid kind.
 *
 * Role: a temple NPC who helps the priest and heals; seen in 3D and as a 128 px sprite. The white
 *   robe with the gold-edged tabard, the calm round face, and the lit candle on its brass dish read.
 * One idea: a calm young boy in a long white robe who holds out one small flame.
 * Shape language: round and soft (bell robe, wide sleeves, round dish), a few straight gold lines.
 * Palette (60/30/10): robe white #f0ece4 with #d8d0c4 folds; tabard cream #ece0c4 (the cloth slot);
 *   gold trim and sun #e0b040; rope #8a6a3a; sandals #6b4226; the flame #ffb040 is the accent.
 * Value plan: the white robe is the large light mass; the dark hair and brown sandals frame it; the
 *   gold edges and the glowing flame are the focal points.
 * Bodies: skin, robe, collar, tabard, gold, rope, sandals, dish, candle, flame.
 * Rig: the humanoid kind's skeleton and clips. The left arm holds the dish out in every clip (a
 *   one-arm `pose`); the right arm swings. The skirt is rigid on the hips and ends at the ankle.
 */

const POSE_L = { elbow: [0.17, 0.335, 0.05], wrist: [0.2, 0.33, 0.15] } as const;

const C = {
  robe: '#f3e8d0',
  fold: '#d8c8a8',
  gold: '#e0b040',
  rope: '#7a5530',
  sandal: '#6b4226',
  candle: '#f6f1ea',
  flame: '#ffc050',
  dish: '#c8a040',
};

export default humanoidAsset({
  name: 'acolyte',
  description: 'A calm young temple acolyte in a white robe and a gold-trimmed tabard, holding out a lit candle on a brass dish.',
  reference: 'docs/npc-mockups/acolyte_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { chocolate: '#4a2a1a', chestnut: '#8a5a35', black: '#231a17', blond: '#c4974a', auburn: '#8e3b1c', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { ivory: '#ece0c4', sand: '#d8c090', blush: '#dcb4a4', sage: '#b4bf98' },
  },
  presets: {
    dawn: { skin: 'tan', hair: 'black', eyes: 'hazel', cloth: 'sage' },
  },
  hair: false,
  undershirt: false,
  pants: false,
  shoes: false,
  lashes: false,
  pose: { L: POSE_L },

  extra(k, h) {
    const { SHOULDER, ANKLE, HIP, KNEE } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];

    // ------------------------------------------------------------------ robe: torso, bell skirt, wide sleeves
    const bell = (r0: number, r1: number, r2: number, r3: number) =>
      sdf
        .revolve(
          profile.polygon(
            [
              [0, 0.3],
              [r0, 0.3],
              [r1, 0.24],
              [r2, 0.16],
              [r3, 0.082],
              [0, 0.082],
            ],
            { smooth: true, samples: 8 },
          ),
        )
        .scale([1, 1, 0.88]);
    const skirt = bell(0.138, 0.158, 0.198, 0.232).bone('hips');
    const robeOuter = sdf.smoothUnion(0.02, h.torso.round(0.014), bell(0.138, 0.158, 0.198, 0.232));
    const sleeves = h.perArm((j) =>
      sdf.smoothUnion(
        0.02,
        sdf.cone(lerp(SHOULDER, j.ELBOW, -0.1), j.ELBOW, 0.052, 0.056).bone('upperarm.L'),
        sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.88), 0.056, 0.068).bone('forearm.L'),
      ),
    );
    const robeBody = sdf
      .smoothUnion(0.02, h.weighted(h.torso.round(0.014)), skirt)
      .smoothUnion(0.012, sleeves)
      .paintFn((x, y, z, base) => {
        if (y > 0.26) return base;
        const a = Math.atan2(x, z);
        const f = Math.max(0, Math.sin(a * 6 + Math.sin(y * 9) * 0.6) - 0.35) * Math.min(1, (0.26 - y) / 0.1) * 0.9;
        const fold = [0xd8 / 255, 0xc8 / 255, 0xa8 / 255] as const;
        return [base[0] + (fold[0] - base[0]) * f, base[1] + (fold[1] - base[1]) * f, base[2] + (fold[2] - base[2]) * f] as const;
      });
    k.body('robe', robeBody, {
      color: C.robe,
      roughness: 0.9,
      detail: 0.005,
      bump: (x, y, z) => 0.003 * Math.sin(Math.atan2(x, z) * 9 + y * 6) * Math.min(1, Math.max(0, (0.28 - y) * 8)),
    });

    // The high rolled collar and the cuff rims of the wide sleeves.
    const collar = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.4],
            [0.125, 0.4],
            [0.122, 0.43],
            [0.118, 0.452],
            [0.108, 0.472],
            [0.09, 0.485],
            [0, 0.485],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.85])
      .intersect(sdf.halfSpace([0, 1, 0.6], 0.498))
      .at(0, 0, -0.01)
      .bone('chest');
    const cuffs = h.perArm((j) => sdf.cone(lerp(j.ELBOW, j.WRIST, 0.82), lerp(j.ELBOW, j.WRIST, 0.9), 0.067, 0.07).round(0.003).bone('forearm.L'));
    k.body('collar', sdf.union(collar, cuffs), { color: '#e4d4b2', roughness: 0.9, detail: 0.004 });

    // ------------------------------------------------------------------ tabard: front and back panels and shoulder straps
    const shell = robeOuter.round(0.014).subtract(robeOuter.round(-0.0005));
    const panel = (z: number) => sdf.box([0.17, 0.28, 0.5], 0.01).at(0, 0.27, z);
    const strap = sdf.box([0.034, 0.3, 0.6]).at(0.07, 0.56, 0);
    const tabardShape = shell
      .intersect(sdf.smoothUnion(0.004, panel(0.25), panel(-0.25), pair(strap).intersect(sdf.halfSpace([0, 1, 0], 0.5))))
      .intersect(sdf.halfSpace([0, 1, 0], 0.5));
    const edges = sdf.union(
      sdf.box([0.014, 0.52, 1]).at(0.078, 0.37, 0),
      sdf.box([0.014, 0.52, 1]).at(-0.078, 0.37, 0),
      sdf.box([0.17, 0.016, 1]).at(0, 0.138, 0),
    );
    const tabard = h.weighted(tabardShape).paintWhere(edges, C.gold, 0.001);
    k.body('tabard', tabard, { color: h.tint.shirt!, roughness: 0.85, detail: 0.005 });


    // The gold star below the belt, placed on the tabard surface.
    const starPts: [number, number][] = [];
    for (let i = 0; i < 16; i++) {
      const r = i % 2 === 0 ? 0.032 : 0.013;
      starPts.push([r * Math.sin((i * Math.PI) / 8), r * Math.cos((i * Math.PI) / 8)]);
    }
    const starY = 0.192;
    const starZ = sdf.raycast(tabardShape, [0, starY, 1], [0, 0, -1])?.[2] ?? 0.14;
    const star = sdf
      .smoothUnion(0.004, sdf.extrude(profile.polygon(starPts), 0.016).at(0, starY, starZ), sdf.sphere(0.017).scale([1, 1, 0.6]).at(0, starY, starZ + 0.002))
      .bone('hips');

    // ------------------------------------------------------------------ rope belt with a gold medallion
    const rope = sdf.torus(0.15, 0.011).scale([1, 1, 0.97]).at(0, 0.258, 0).bone('spine');
    const beltZ = sdf.raycast(rope, [0, 0.258, 1], [0, 0, -1])?.[2] ?? 0.13;
    k.body('rope', rope, { color: C.rope, roughness: 0.9, detail: 0.004 });
    const medal = sdf.cylinder(0.024, 0.014, 0.005).rotateX(90).at(0, 0.258, beltZ + 0.002).bone('spine');
    k.body('gold', sdf.union(star, medal), { color: C.gold, roughness: 0.4, metalness: 0.6, detail: 0.003 });

    // ------------------------------------------------------------------ hair: dark wavy locks over a small cap
    const headPose = (s: sdf.Shape) => s.at(0, h.joints.HEAD_Y, 0).bone('head');
    const lock = (pts: [number, number, number, number][]) => sdf.chain(pts, 0.014);
    const shellH = sdf.ellipsoid([0.214, 0.208, 0.2]);
    const capTop = shellH.smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], -0.075));
    const capBack = shellH.smoothIntersect(0.04, sdf.halfSpace([0, -1, 0], 0.035)).smoothIntersect(0.03, sdf.halfSpace([0, 0, 1], -0.02));
    const capSides = shellH
      .smoothIntersect(0.015, sdf.halfSpace([0, -1, 0], 0.02))
      .smoothIntersect(0.015, sdf.halfSpace([-1, 0, 0], -0.15).mirror('x'))
      .smoothIntersect(0.015, sdf.halfSpace([0, 0, 1], 0.11));
    // soft rounded lobes along the nape
    const nape = sdf.smoothUnion(
      0.045,
      ...[-66, -44, -22, 0, 22, 44, 66].map((a) => sdf.sphere(0.042).at(0.172 * Math.sin((a * Math.PI) / 180), -0.022, -0.162 * Math.cos((a * Math.PI) / 180))),
    );
    const locks = sdf.smoothUnion(
      0.022,
      // the part sits above the viewer's left brow; a thick wave sweeps from it over the forehead to the right
      lock([[-0.1, 0.17, 0.07, 0.04], [-0.06, 0.16, 0.13, 0.042], [0.0, 0.14, 0.165, 0.04], [0.08, 0.11, 0.172, 0.036], [0.14, 0.085, 0.15, 0.03]]),
      // the curl at the end of the wave
      lock([[0.14, 0.085, 0.15, 0.03], [0.17, 0.065, 0.13, 0.026], [0.18, 0.045, 0.11, 0.022], [0.165, 0.035, 0.115, 0.018]]),
      // a second layer, higher, that rolls up and back
      lock([[-0.12, 0.17, 0.02, 0.04], [-0.04, 0.2, 0.08, 0.042], [0.05, 0.19, 0.1, 0.038], [0.12, 0.15, 0.09, 0.03]]),
      // rounded crown volume with one loose wave at the viewer's left
      lock([[-0.02, 0.2, -0.04, 0.04], [-0.1, 0.21, -0.02, 0.036], [-0.15, 0.185, 0.0, 0.03]]),
      lock([[-0.15, 0.185, 0.0, 0.03], [-0.19, 0.15, 0.03, 0.026], [-0.2, 0.11, 0.06, 0.022]]),
      // loose curls beside the viewer's left cheek and at the right temple
      lock([[-0.175, 0.09, 0.09, 0.03], [-0.195, 0.035, 0.09, 0.026], [-0.19, -0.005, 0.07, 0.022], [-0.17, -0.02, 0.08, 0.018]]),
      lock([[0.175, 0.09, 0.09, 0.026], [0.19, 0.04, 0.085, 0.022], [0.18, 0.01, 0.09, 0.018]]),
    );
    const hairShape = headPose(sdf.smoothUnion(0.025, capTop, capBack, capSides, nape, locks));
    k.body('hair', hairShape, { color: k.tint('hair'), roughness: 0.55, detail: 0.005 });

    // ------------------------------------------------------------------ sandals: a flat sole and straps over the bare foot
    const sandal = (() => {
      const sole = sdf.ellipsoid([0.046, 0.03, 0.09]).at(0, 0, 0.035).intersect(sdf.halfSpace([0, 1, 0], 0.016)).intersect(sdf.halfSpace([0, -1, 0], 0));
      const foot = sdf.ellipsoid([0.034, 0.03, 0.06]).at(0, 0.04, 0.035);
      const skin = foot.round(0.009).subtract(foot.round(0.001));
      const strapA = skin.intersect(sdf.box([0.2, 0.2, 0.02]).at(0, 0.05, 0.02));
      const strapB = skin.intersect(sdf.box([0.2, 0.2, 0.02]).at(0, 0.05, 0.072));
      return sdf.smoothUnion(0.006, sole, strapA, strapB).rotateY(12).at(ANKLE[0], 0, 0).bone('foot.L');
    })();
    k.body('sandals', pair(sandal), { color: C.sandal, roughness: 0.7, detail: 0.0035 });

    // ------------------------------------------------------------------ the flat dish, the candle, and the flame
    // Built at the posed left grip, level: a round dish on the palm, the candle on the dish.
    const G = h.arms.L.GRIP;
    const dc: [number, number, number] = [G[0], G[1] + 0.05, G[2] + 0.03];
    const dishShape = sdf
      .revolve(
        profile.polygon(
          [
            [0, -0.012],
            [0.03, -0.012],
            [0.05, -0.006],
            [0.064, 0.006],
            [0.066, 0.014],
            [0.058, 0.015],
            [0.05, 0.006],
            [0, 0.003],
          ],
          { smooth: true, samples: 5 },
        ),
      )
      .at(...dc);
    k.body('dish', dishShape.bone('knife.L'), { color: C.dish, roughness: 0.35, metalness: 0.7, detail: 0.003 });
    const cy = dc[1] + 0.004;
    k.body('candle', sdf.cylinder(0.022, 0.08, 0.006).at(dc[0], cy + 0.04, dc[2]).bone('knife.L'), { color: C.candle, roughness: 0.6, detail: 0.003 });
    const fy = cy + 0.096;
    k.body(
      'flame',
      sdf
        .smoothUnion(0.008, sdf.ellipsoid([0.022, 0.027, 0.022]).at(dc[0], fy + 0.004, dc[2]), sdf.cone([dc[0], fy, dc[2]], [dc[0], fy + 0.062, dc[2]], 0.019, 0.002))
        .bone('knife.L'),
      { color: C.flame, emissive: C.flame, emissiveIntensity: 0.7, roughness: 0.5, detail: 0.003 },
    );
    k.body(
      'core',
      sdf.smoothUnion(0.005, sdf.ellipsoid([0.012, 0.016, 0.012]).at(dc[0], fy, dc[2] + 0.012), sdf.cone([dc[0], fy, dc[2] + 0.012], [dc[0], fy + 0.035, dc[2] + 0.012], 0.011, 0.002)).bone('knife.L'),
      { color: '#fff2b8', emissive: '#fff2b8', emissiveIntensity: 0.7, roughness: 0.5, detail: 0.003 },
    );
    void HIP;
    void KNEE;
  },
});
