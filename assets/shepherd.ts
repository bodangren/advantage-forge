import { noise, profile, rgb, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Shepherd — Chibi Quest farm NPC (catalog `npcs/settlement/shepherd`), about 1.0 m to the top of the
 * straw hat, faces +Z. Target: docs/npc-mockups/shepherd_001.jpg. Built on the humanoid kind.
 *
 * Role: a farm NPC who keeps sheep and asks for help with lost lambs; seen in 3D and as a 128 px
 *   sprite. The wide hat, the two braids, the woolly shawl, and the tall curled crook must read.
 * One idea: a cheerful girl under a very wide straw hat, holding a crook taller than she is.
 * Shape language: round and soft (hat, braids, wool shawl), the thin curled crook is the one long line.
 * Palette (60/30/10): cream #f0e6cc / #ece4d4 (blouse, shawl, socks); sage-teal #86aa9e (skirt, cloth
 *   slot); browns #7a5a3a (vest), #6b4226 (boots), #8a6a3a (crook), straw #d8b870, blue accent #3a6ab0
 *   (hat ribbon, braid ties: soft teal #68a3a0); hair #a8784a.
 * Value plan: the light straw hat and cream shawl frame the face; the brown vest and boots anchor the
 *   body; the teal ribbon, braid ties and the sage-teal skirt are the accent.
 * Bodies: skin, hair, braids, braid-ties, hat, ribbon, blouse, shawl, vest, studs, skirt, socks, boots, crook.
 * Rig: the humanoid kind's skeleton and clips. The right arm holds the crook in a rest pose (`pose.R`,
 *   forearm forward, fist level); the crook is rigid on `knife.R`.
 */

const C = {
  blouse: '#f0e6cc',
  cuff: '#e0d4b4',
  shawl: '#ece4d4',
  vest: '#7a5a3a',
  vestDark: '#5f4428',
  lace: '#e6d8b8',
  lacePit: '#bfae88',
  stud: '#b89a58',
  sock: '#f6f1ea',
  boot: '#6b4226',
  bootSole: '#3e2616',
  bootCuff: '#8a5a34',
  straw: '#d8b870',
  strawDark: '#b8934e',
  ribbon: '#68a3a0',
  crook: '#5a3a24',
  mouth: '#a4503f',
};

export default humanoidAsset({
  name: 'shepherd',
  description: 'A cheerful shepherd girl with long braids, a wide straw hat, and a woolly shawl, holding a tall curled crook.',
  reference: 'docs/npc-mockups/shepherd_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { chestnut: '#a8784a', brown: '#5a301d', black: '#231a17', blond: '#c4974a', auburn: '#8e3b1c', silver: '#b8b4c4' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { sage: '#86aa9e', heather: '#9a86b0', rose: '#c08a94', ochre: '#c8a468' },
  },
  presets: {
    meadow: { skin: 'tan', hair: 'auburn', eyes: 'green', cloth: 'heather' },
  },
  hair: false,
  undershirt: false,
  pants: false,
  shoes: false,
  // The right hand holds the crook out at her side: the forearm points forward, so the fist grips upright.
  pose: { R: { elbow: [0.2, 0.355, 0.02], wrist: [0.28, 0.37, 0.078] } },

  // A warm, small smile with round corners, painted over the default one (a little wider and higher).
  paintSkin(skin, h) {
    const smile = sdf.extrude(profile.arc(0.07, 0.013, 238, 302), 0.3).at(0, 0.53 + 0.07, 0.1);
    return skin.paintWhere(smile, h.tint.mouth!, 0.002);
  },

  extra(k, h) {
    const { SHOULDER, ANKLE, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const hairColor = k.tint('hair');
    const trim = k.tint('cloth', { color: '#6a8c82', follow: 1 });
    type V3 = readonly [number, number, number];
    const lerp = (a: V3, b: V3, t: number): [number, number, number] => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
    const pt = (x: number, y: number, lift = 0.004): [number, number, number] => [x, y, h.faceZ(Math.abs(x), y) + lift];

    // ------------------------------------------------------------------ hair: a close cap, fringe locks, side locks, nape lobes
    const skull = sdf.ellipsoid([0.217, 0.212, 0.202]).at(0, HEAD_Y + 0.004, -0.006);
    const faceCut = sdf.ellipsoid([0.25, 0.15, 0.22]).at(0, 0.585, 0.15);
    const earCut = pair(sdf.ellipsoid([0.05, 0.1, 0.08]).at(0.215, 0.6, 0.04));
    const cap = skull
      .smoothSubtract(0.015, faceCut, earCut)
      .smoothIntersect(0.03, sdf.halfSpace([0, -1, 0], -0.585));
    // Fringe locks: from the part at the crown, down over the forehead, sweeping out to the temples.
    const fringeLock = (s: number, t: number, i: number) => {
      const tipX = 0.02 + 0.17 * t;
      const tipY = 0.748 - 0.05 * Math.pow(t, 1.5);
      const wob = 0.012 * (i % 2 ? 1 : -1);
      return sdf.chain(
        [
          [...pt(s * 0.012, 0.835, 0.0), 0.03],
          [...pt(s * (tipX * 0.55 + 0.02) + wob, tipY + 0.05, 0.01), 0.03],
          [...pt(s * tipX, tipY, 0.012), 0.024],
        ],
        0.012,
      );
    };
    const locks: sdf.Shape[] = [];
    [0, 0.22, 0.45, 0.72, 1].forEach((t, i) => {
      locks.push(fringeLock(1, t, i), fringeLock(-1, t, i + 1));
    });
    const sideLock = (z: number, y: number) =>
      pair(
        sdf.chain(
          [
            [0.188, y + 0.05, z + 0.04, 0.028],
            [0.206, y, z, 0.026],
            [0.2, y - 0.06, z - 0.04, 0.024],
          ],
          0.012,
        ),
      );
    const side = sdf.union(sideLock(0.05, 0.655), sideLock(0.0, 0.63), sideLock(-0.05, 0.61));
    const nape = sdf.union(
      ...[-75, -50, -25, 0, 25, 50, 75].map((a) => sdf.sphere(0.03).at(0.18 * Math.sin((a * Math.PI) / 180), 0.585, -0.17 * Math.cos((a * Math.PI) / 180))),
    );
    const hair = sdf
      .smoothUnion(0.012, cap, nape, side, ...locks)
      .paintFn((x, y, z, base) => (Math.sin(x * 70 + z * 30 - y * 25) > 0.8 ? rgb(k.tint('hair', -0.22)) : base));
    k.body('hair', hair.bone('head'), { color: hairColor, roughness: 0.6, detail: 0.005 });

    // ------------------------------------------------------------------ two long braids over the shoulders
    const braid = (s: number) => {
      const spine: [number, number, number, number][] = [
        [0.192 * s, 0.585, -0.05, 0.03],
        [0.202 * s, 0.535, -0.01, 0.032],
        [0.22 * s, 0.49, 0.035, 0.033],
        [0.24 * s, 0.455, 0.06, 0.031],
        [0.258 * s, 0.425, 0.07, 0.028],
      ];
      const beads = spine.slice(1).map(([x, y, z, r], i) => sdf.ellipsoid([r * 1.08, r * 1.02, r * 1.2]).rotateZ((i % 2 ? 34 : -34) * s).at(x, y, z));
      const core = sdf.chain(spine.map(([x, y, z, r]) => [x, y, z, r * 0.82] as [number, number, number, number]), 0.03);
      // The braid ends flare out to the sides, past the shoulder.
      const tuft = [0, 1, 2].map((i) =>
        sdf.chain(
          [
            [0.258 * s, 0.405, 0.07 + 0.006 * (i - 1), 0.02],
            [(0.268 + 0.012 * i) * s, 0.375, 0.074 + 0.012 * (i - 1), 0.019],
            [(0.275 + 0.03 * i) * s, 0.338 + 0.012 * i, 0.08 + 0.02 * (i - 1), 0.013],
          ],
          0.012,
        ),
      );
      return sdf.smoothUnion(0.006, core, ...beads, ...tuft);
    };
    k.body('braids', sdf.union(braid(1), braid(-1)).bone('chest'), { color: hairColor, roughness: 0.6, detail: 0.004 });
    const tie = (s: number) => sdf.torus(0.03, 0.009).rotateZ(17 * s).at(0.259 * s, 0.407, 0.07);
    k.body('braid-ties', sdf.union(tie(1), tie(-1)).bone('chest'), { color: C.ribbon, roughness: 0.7, detail: 0.004 });

    // ------------------------------------------------------------------ straw hat: shallow crown, wide soft brim, ribbon and bow
    // Local frame: the brim's center at the origin; the hat sits tilted back a little.
    const hatPose = (s: sdf.Shape) => s.rotateX(-5).at(0, 0.775, -0.01);
    const crown = sdf.ellipsoid([0.205, 0.135, 0.195]).at(0, 0.055, 0).intersect(sdf.halfSpace([0, -1, 0], -0.01));
    const brim = sdf
      .revolve(
        profile.polygon(
          [
            [0.12, 0.03],
            [0.22, 0.028],
            [0.28, 0.016],
            [0.315, -0.006],
            [0.302, -0.02],
            [0.22, -0.006],
            [0.12, 0.0],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.95]);
    const weave = (x: number, y: number, z: number) => 0.0009 * Math.sin(Math.atan2(z, x) * 80) * Math.sin(Math.hypot(x, z) * 280 + y * 300);
    const hatShape = sdf
      .smoothUnion(0.02, crown, brim)
      .paintFn((x, y, z, base) => (Math.sin(Math.atan2(z, x) * 36 + Math.hypot(x, z) * 55) > 0.82 && y < 0.02 ? rgb(C.strawDark) : base));
    k.body('hat', hatPose(hatShape).bone('head'), { color: C.straw, roughness: 0.85, detail: 0.005, bump: weave });

    const band = sdf.torus(0.194, 0.019).scale([1, 1, 0.955]).at(0, 0.043, 0);
    const bowAt = (a: number) => [0.192 * Math.sin((a * Math.PI) / 180), 0.052, 0.182 * Math.cos((a * Math.PI) / 180)] as const;
    const bowP = bowAt(42);
    const bow = sdf
      .smoothUnion(
        0.006,
        sdf.sphere(0.016),
        sdf.ellipsoid([0.034, 0.02, 0.011]).rotateZ(22).at(0.032, 0.008, 0),
        sdf.ellipsoid([0.034, 0.02, 0.011]).rotateZ(-22).at(-0.032, 0.008, 0),
        sdf.box([0.017, 0.05, 0.008], 0.004).rotateZ(14).at(0.012, -0.034, 0),
        sdf.box([0.017, 0.046, 0.008], 0.004).rotateZ(-18).at(-0.014, -0.033, 0),
      )
      .rotateY(42)
      .at(bowP[0] + 0.006, bowP[1] + 0.004, bowP[2] + 0.008);
    k.body('ribbon', hatPose(sdf.smoothUnion(0.005, band, bow)).bone('head'), { color: C.ribbon, roughness: 0.75, detail: 0.005 });

    // ------------------------------------------------------------------ blouse: long sleeves, cuffs, a laced front
    const sleeves = h.perArm((j) =>
      sdf.smoothUnion(
        0.015,
        sdf.cone(lerp(SHOULDER, j.ELBOW, -0.1), j.ELBOW, 0.049, 0.045).bone('upperarm.L'),
        sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.9), 0.045, 0.042).bone('forearm.L'),
      ),
    );
    const cuffs = h.perArm((j) => sdf.cone(lerp(j.ELBOW, j.WRIST, 0.72), lerp(j.ELBOW, j.WRIST, 1.02), 0.046, 0.05).round(0.003).bone('forearm.L'));
    const blouse = sdf
      .smoothUnion(0.012, h.weighted(h.torso), sleeves)
      .paintFn((x, y, z, base) => {
        // The lace panel at the front: a pale strip with a grid of small dark pits.
        if (Math.abs(x) < 0.055 && y > 0.25 && y < 0.37 && z > 0) {
          const pit = Math.sin(x * 330) * Math.sin(y * 330) > 0.55;
          return rgb(pit ? C.lacePit : C.lace);
        }
        return base;
      });
    k.body('blouse', blouse, { color: C.blouse, roughness: 0.88, });
    k.body('cuffs', cuffs, { color: C.cuff, roughness: 0.9, detail: 0.004 });

    // ------------------------------------------------------------------ vest: two brown front panels with studs
    const shell = h.torso.round(0.012).subtract(h.torso.round(-0.003));
    const vestCut = shell
      .intersect(sdf.box([0.4, 0.14, 0.5]).at(0, 0.335, 0))
      .subtract(sdf.box([0.1, 0.2, 0.2], 0.01).at(0, 0.34, 0.12))
      ;
    const vest = h.weighted(vestCut).paintWhere(h.band(0.282, 0.292), C.vestDark, 0.002);
    k.body('vest', vest, { color: C.vest, roughness: 0.75, detail: 0.004, bump: (x, y, z) => 0.0015 * noise.fbm(x * 60, y * 60, z * 60, 2) });
    const studAt = (x: number, y: number) => {
      const z = sdf.raycast(h.torso.round(0.012), [x, y, 1], [0, 0, -1])?.[2] ?? 0.1;
      return sdf.sphere(0.0105).scale([1, 1, 0.6]).at(x, y, z + 0.001);
    };
    const studs = sdf.union(...[0.31, 0.355].flatMap((y) => [studAt(0.078, y), studAt(-0.078, y)]));
    k.body('studs', studs.bone('chest'), { color: C.stud, roughness: 0.4, metalness: 0.4, detail: 0.003 });

    // ------------------------------------------------------------------ woolly shawl: a thick rolled collar over the shoulders
    const roll = sdf.torus(0.1, 0.04).scale([1.12, 1, 0.92]).at(0, 0.44, 0.0);
    const drape = h.torso
      .round(0.026)
      .smoothIntersect(0.02, sdf.box([0.6, 0.075, 0.6]).at(0, 0.425, 0));
    const shoulders = pair(sdf.ellipsoid([0.07, 0.04, 0.075]).at(0.115, 0.415, 0.0));
        const shawl = sdf.smoothUnion(0.03, roll, drape, shoulders);
    k.body('shawl', h.weighted(shawl), {
      color: C.shawl,
      roughness: 0.95,
      detail: 0.005,
      bump: (x, y, z) => 0.0022 * Math.sin(y * 95 + noise.fbm(x * 14, y * 14, z * 14, 2) * 2.5),
    });

    // ------------------------------------------------------------------ skirt: light blue, above the knee, a button placket
    const skirtOuter = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.305],
            [0.139, 0.305],
            [0.15, 0.27],
            [0.16, 0.225],
            [0.171, 0.19],
            [0.178, 0.165],
            [0, 0.165],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.8]);
    const skirtInner = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.315],
            [0.125, 0.315],
            [0.136, 0.27],
            [0.146, 0.225],
            [0.157, 0.19],
            [0.164, 0.155],
            [0, 0.155],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.78]);
    const skirt = h
      .weighted(skirtOuter.subtract(skirtInner))
      .paintWhere(h.band(0.287, 0.306), trim, 0.002)
      .paintWhere(h.band(0.165, 0.18), trim, 0.002)
      .paintWhere(sdf.box([0.006, 0.3, 0.5]).at(0, 0.23, 0.2), trim, 0.001);
    k.body('skirt', skirt, { color: h.tint.shirt ?? '#7a9ac0', roughness: 0.85, detail: 0.006 });
    const skirtZ = (y: number) => sdf.raycast(skirtOuter, [0, y, 1], [0, 0, -1])?.[2] ?? 0.12;
    const skirtStuds = sdf.union(...[0.26, 0.225, 0.19].map((y) => sdf.sphere(0.01).scale([1, 1, 0.6]).at(0, y, skirtZ(y) * 1 + 0.0005)));
    k.body('skirt-studs', skirtStuds.bone('hips'), { color: C.stud, roughness: 0.4, metalness: 0.4, detail: 0.003 });

    // ------------------------------------------------------------------ white socks and brown boots
    const sockLeg = sdf.smoothUnion(
      0.006,
      sdf.cone([ANKLE[0], 0.075, 0.002], [ANKLE[0], 0.113, 0.002], 0.044, 0.042).bone('shin.L'),
      sdf.torus(0.042, 0.0105).at(ANKLE[0], 0.117, 0.002).bone('shin.L'),
    );
    k.body('socks', pair(sockLeg), { color: C.sock, roughness: 0.92, detail: 0.004 });
    const boot = sdf
      .smoothUnion(0.026, sdf.cylinder(0.05, 0.088, 0.016).at(0, 0.044, 0), sdf.ellipsoid([0.057, 0.05, 0.1]).at(0, 0.048, 0.045))
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.017), C.bootSole, 0.003)
      .paintWhere(sdf.halfSpace([0, -1, 0], -0.082), C.bootCuff, 0.003)
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.65, detail: 0.004 });

    // ------------------------------------------------------------------ the crook
    // 1.0 m long, 0.033 thick, held upright through the right fist; the foot hangs 7.5 cm above the ground so the rest and run clips never sink it; it leans out 5 degrees. The hook curls outward (x < 0), away from the head.
    const g = h.arms.R.GRIP;
    const grip: V3 = [-g[0], g[1], g[2]];
    const lean = (5 * Math.PI) / 180;
    const dir: V3 = [-Math.sin(lean), Math.cos(lean), 0];
    const footT = (0.075 - grip[1]) / dir[1];
    const foot: V3 = [grip[0] + dir[0] * footT, 0.075, grip[2]];
    const R0 = 0.09;
    const poleLen = 0.82;
    const topAt = (t: number): [number, number] => [foot[0] + dir[0] * t, foot[1] + dir[1] * t];
    const [px, py] = topAt(poleLen);
    const poleR = 0.0165;
    // The hook: a spiral turning counter-clockwise (seen from +Z), up and out over the top, one full turn.
    const hookPts: [number, number, number, number][] = [];
    const cx = px - R0;
    const cy = py;
    for (let a = 0; a <= 380; a += 15) {
      const rad = (a * Math.PI) / 180;
      const r = R0 * (1 - 0.5 * (a / 380));
      hookPts.push([cx + r * Math.cos(rad), cy + r * Math.sin(rad), foot[2], poleR * (1 - 0.1 * (a / 380))]);
    }
    const pole = sdf.capsule([foot[0], foot[1], foot[2]], [px, py, foot[2]], poleR);
    const hook = sdf.chain(hookPts, 0.012);
    const crook = sdf.smoothUnion(0.01, pole, hook);
    k.body('crook', crook, {
      color: C.crook,
      roughness: 0.55,
      bone: 'knife.R',
      detail: 0.004,
    });
  },
});
