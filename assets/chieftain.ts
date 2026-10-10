import { noise, profile, rgb, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Chieftain — Chibi Quest wilderness NPC (catalog `npcs/wilderness/chieftain`), about 1.0 m to the top
 * of the hair and circlet, faces +Z. Target: docs/npc-mockups/chieftain_001.jpg. Built on the humanoid kind.
 *
 * Role: the leader of a highland village who gives alliance quests; seen at the hill village and the
 *   longhouse in 3D and as a 128 px sprite. The red hair, the green cloak with its cream fur, and the
 *   tall staff with the bronze sun must read.
 * One idea: a proud, kind girl chieftain whose dark green fur-trimmed cloak flares around a rust tunic,
 *   holding a staff topped with a bronze sun.
 * Shape language: round and soft (braids, fur, cloak), with the spiked sun disc as the one sharp form.
 * Palette (60/30/10): cloak #2f4a3a (cloth slot) and tunic #9a4a2a; fur #ece0c8; hair #a8401c;
 *   bronze #c08a3a (circlet, brooch, buckle, sun); gold band #e0b040; belt and boots #5a3a24;
 *   trousers #6b4a2c; staff #7a4a2c.
 * Value plan: the dark cloak frames the warm tunic; the cream fur and the bronze are the light accents;
 *   the sun disc is the focal point beside the red hair.
 * Bodies: skin, hair, braids, braid-rings, bronze, sun, mantle, fur, tunic, belt, trousers, boots, staff.
 * Rig: the humanoid kind's skeleton and clips. The right arm holds the staff in a rest pose (`pose.R`);
 *   the staff and the sun are rigid on `knife.R`. The cloak hangs behind on the `cloak` bone.
 */

const C = {
  fur: '#ece0c8',
  tunic: '#74311f',
  tunicDark: '#55231a',
  band: '#e0b040',
  belt: '#5a3a24',
  trousers: '#6b4a2c',
  boot: '#5a3a24',
  bootSole: '#33210f',
  bronze: '#c08a3a',
  staff: '#7a4a2c',
  staffDark: '#5c3620',
};

export default humanoidAsset({
  name: 'chieftain',
  description: 'A proud, kind highland chieftain with red braids and a fur-trimmed green cloak, holding a staff topped with a bronze sun.',
  reference: 'docs/npc-mockups/chieftain_001.jpg',
  variants: {
    skin: { light: '#e8b48e', fair: '#f2c7a4', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { ginger: '#a8401c', brown: '#5a301d', black: '#231a17', blond: '#c4974a', silver: '#b8b4c4' },
    eyes: { blue: '#2f6aa8', green: '#3d7a35', brown: '#6e4020', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { pine: '#2f4a3a', heather: '#5a3f5c', woad: '#35505f', umber: '#6a4a30' },
  },
  presets: {
    highland: { skin: 'light', hair: 'ginger', eyes: 'blue', cloth: 'pine' },
    moor: { skin: 'tan', hair: 'brown', eyes: 'green', cloth: 'heather' },
  },
  hair: false,
  undershirt: false,
  pants: false,
  shoes: false,
  lashes: true,
  // The right hand holds the staff at her side: the forearm points forward, so the fist grips upright.
  pose: { R: { elbow: [0.195, 0.335, 0.03], wrist: [0.23, 0.355, 0.123] } },

  // A warm, confident smile with round corners (a little wider and higher than the default).
  paintSkin(skin, h) {
    const smile = sdf.extrude(profile.arc(0.07, 0.013, 237, 303), 0.3).at(0, 0.53 + 0.07, 0.1);
    // A few freckles on each cheek, in a darker shade of the skin.
    const dots = sdf.union(
      ...[
        [0.095, 0.575],
        [0.115, 0.588],
        [0.135, 0.576],
        [0.105, 0.56],
        [0.128, 0.558],
      ].flatMap(([x, y]) => [x!, -x!].map((xx) => h.onFace(sdf.sphere(0.006), xx, y!))),
    );
    return skin.paintWhere(smile, h.tint.mouth!, 0.002).paintWhere(dots, h.tint.blush!, 0.003);
  },

  extra(k, h) {
    const { SHOULDER, ANKLE, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const hairColor = k.tint('hair');
    type V3 = readonly [number, number, number];
    const lerp = (a: V3, b: V3, t: number): [number, number, number] => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
    const pt = (x: number, y: number, lift = 0.004): [number, number, number] => [x, y, h.faceZ(Math.abs(x), y) + lift];
    const furBump = (x: number, y: number, z: number) => 0.004 * noise.fbm(x * 45, y * 45, z * 45, 2);

    // ------------------------------------------------------------------ hair: a close cap, a parted fringe of locks, side locks, nape lobes
    const skull = sdf.ellipsoid([0.219, 0.214, 0.205]).at(0, HEAD_Y + 0.004, -0.006);
    const faceCut = sdf.ellipsoid([0.25, 0.17, 0.22]).at(0, 0.6, 0.15);
    const earCut = pair(sdf.ellipsoid([0.05, 0.1, 0.08]).at(0.215, 0.6, 0.04));
    const cap = skull.smoothSubtract(0.015, faceCut, earCut).smoothIntersect(0.03, sdf.halfSpace([0, -1, 0], -0.585));
    // Fringe locks: from the center part at the crown, sweeping out and down over the temples.
    const fringeLock = (s: number, t: number, i: number) => {
      const tipX = 0.035 + 0.16 * t;
      const tipY = 0.805 - 0.11 * Math.pow(t, 1.3);
      const wob = 0.012 * (i % 2 ? 1 : -1);
      return sdf.chain(
        [
          [...pt(s * 0.012, 0.84, 0.0), 0.032],
          [...pt(s * (tipX * 0.55 + 0.02) + wob, tipY + 0.05, 0.012), 0.032],
          [...pt(s * tipX, tipY, 0.014), 0.026],
        ],
        0.012,
      );
    };
    const locks: sdf.Shape[] = [];
    [0, 0.25, 0.5, 0.75, 1].forEach((t, i) => {
      locks.push(fringeLock(1, t, i), fringeLock(-1, t, i + 1));
    });
    const sideLock = (z: number, y: number) =>
      pair(
        sdf.chain(
          [
            [0.19, y + 0.05, z + 0.04, 0.03],
            [0.208, y, z, 0.028],
            [0.2, y - 0.07, z - 0.04, 0.024],
          ],
          0.012,
        ),
      );
    const side = sdf.union(sideLock(0.06, 0.67), sideLock(0.01, 0.645), sideLock(-0.045, 0.62));
    const nape = sdf.union(
      ...[-75, -50, -25, 0, 25, 50, 75].map((a) => sdf.sphere(0.032).at(0.18 * Math.sin((a * Math.PI) / 180), 0.585, -0.17 * Math.cos((a * Math.PI) / 180))),
    );
    const hair = sdf
      .smoothUnion(0.012, cap, nape, side, ...locks)
      .paintFn((x, y, z, base) => (Math.sin(x * 80 + z * 35 - y * 30) > 0.78 ? rgb(k.tint('hair', -0.2)) : base))
      .paintWhere(sdf.box([0.006, 0.3, 0.6]).at(0, 0.85, 0.1), k.tint('hair', -0.35), 0.002);
    k.body('hair', hair.bone('head'), { color: hairColor, roughness: 0.6, detail: 0.005 });

    // ------------------------------------------------------------------ two thick braids over the shoulders
    const braid = (s: number) => {
      const spine: [number, number, number, number][] = [
        [0.192 * s, 0.585, -0.05, 0.032],
        [0.2 * s, 0.53, -0.005, 0.034],
        [0.205 * s, 0.483, 0.045, 0.035],
        [0.2 * s, 0.442, 0.085, 0.033],
        [0.19 * s, 0.4, 0.105, 0.03],
      ];
      const beads = spine.slice(1).map(([x, y, z, r], i) => sdf.ellipsoid([r * 1.08, r * 1.02, r * 1.2]).rotateZ((i % 2 ? 34 : -34) * s).at(x, y, z));
      const core = sdf.chain(spine.map(([x, y, z, r]) => [x, y, z, r * 0.82] as [number, number, number, number]), 0.03);
      const tuft = [-0.034, 0, 0.034].map((dx, i) =>
        sdf.chain(
          [
            [(0.19 + dx * 0.3) * s, 0.378, 0.105, 0.021],
            [(0.19 + dx * 0.9) * s, 0.35, 0.112, 0.02],
            [(0.19 + dx * 1.5) * s, 0.325 + 0.006 * (i === 1 ? -1 : 1), 0.117, 0.014],
          ],
          0.012,
        ),
      );
      return sdf.smoothUnion(0.006, core, ...beads, ...tuft);
    };
    k.body('braids', sdf.union(braid(1), braid(-1)).bone('chest'), { color: hairColor, roughness: 0.6, detail: 0.004 });
    const ring = (s: number) => sdf.torus(0.033, 0.0095).rotateX(8).at(0.19 * s, 0.388, 0.107);
    k.body('braid-rings', sdf.union(ring(1), ring(-1)).bone('chest'), { color: C.bronze, roughness: 0.4, metalness: 0.7, detail: 0.005 });

    // ------------------------------------------------------------------ bronze: circlet with a boss, brooch, belt buckle
    const circlet = sdf.torus(0.206, 0.0075).scale([1, 1, 0.945]).rotateX(-6).at(0, 0.745, -0.008);
    const bossAt = pt(0, 0.752, 0.009);
    const boss = sdf
      .smoothUnion(0.004, sdf.cylinder(0.026, 0.01, 0.004).rotateX(90), sdf.torus(0.019, 0.005).at(0, 0, 0.004))
      .at(bossAt[0], bossAt[1], bossAt[2] + 0.002);
    const torsoZ = (y: number, r = 0.01) => sdf.raycast(h.torso.round(r), [0, y, 1], [0, 0, -1])?.[2] ?? 0.1;
    const brooch = sdf
      .smoothUnion(0.004, sdf.cylinder(0.024, 0.01, 0.003).rotateX(90), sdf.torus(0.017, 0.004).at(0, 0, 0.004))
      .at(0, 0.385, torsoZ(0.385, 0.014) + 0.002);
    const buckle = sdf
      .smoothUnion(0.005, sdf.cylinder(0.056, 0.014, 0.005).rotateX(90), sdf.torus(0.042, 0.0075).at(0, 0, 0.007))
      .at(0, 0.251, torsoZ(0.251) + 0.003);
    k.body('bronze', sdf.union(circlet.bone('head'), boss.bone('head'), brooch.bone('chest'), buckle.bone('spine')), {
      color: C.bronze,
      roughness: 0.38,
      metalness: 0.7,
      detail: 0.004,
    });

    // ------------------------------------------------------------------ tunic: rust, long sleeves, a skirt to above the knee, a woven hem band
    const sleeves = h.perArm((j) =>
      sdf.smoothUnion(
        0.015,
        sdf.cone(lerp(SHOULDER, j.ELBOW, -0.1), j.ELBOW, 0.05, 0.046).bone('upperarm.L'),
        sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.88), 0.046, 0.043).bone('forearm.L'),
      ),
    );
    const skirtOuter = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.305],
            [0.139, 0.305],
            [0.15, 0.27],
            [0.162, 0.225],
            [0.174, 0.19],
            [0.18, 0.162],
            [0, 0.162],
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
            [0.148, 0.225],
            [0.16, 0.19],
            [0.166, 0.15],
            [0, 0.15],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.78]);
    const tunic = sdf
      .smoothUnion(0.012, h.weighted(h.torso), sleeves, h.weighted(skirtOuter.subtract(skirtInner)))
      .paintFn((x, y, z, base) => {
        if (y > 0.168 && y < 0.212) {
          const u = (Math.atan2(x, z) * 11) / Math.PI;
          const v = (y - 0.168) * 24;
          const d = Math.abs(u - Math.round(u)) + Math.abs(v - Math.round(v));
          return rgb(d < 0.42 ? C.band : C.tunicDark);
        }
        return base;
      });
    k.body('tunic', tunic, { color: C.tunic, roughness: 0.88, detail: 0.007, bump: (x, y, z) => 0.0012 * Math.sin(x * 140 + z * 90) * Math.sin(y * 130) });

    // The belt: a leather band with a round buckle and .
    const belt = h.torso.round(0.01).intersect(h.band(0.239, 0.263));
    k.body('belt', h.weighted(belt), { color: C.belt, roughness: 0.7, detail: 0.004 });

    // ------------------------------------------------------------------ the cloak: a flared cape behind, open at the front, with cream fur
    const cloakCone = (pts: [number, number][]) => sdf.revolve(profile.polygon(pts, { smooth: true, samples: 8 })).scale([1, 1, 0.82]).at(0, 0, -0.01);
    const outer = cloakCone([
      [0, 0.47],
      [0.125, 0.47],
      [0.235, 0.36],
      [0.285, 0.24],
      [0.31, 0.14],
      [0, 0.14],
    ]);
    const inner = cloakCone([
      [0, 0.49],
      [0.109, 0.49],
      [0.219, 0.36],
      [0.269, 0.24],
      [0.294, 0.12],
      [0, 0.12],
    ]);
    // The front edge is a tilted plane: it reaches round the sides low down and the back only near the shoulders.
    const N: V3 = [0, 0.568, 0.823];
    const OFF = 0.205;
    const cloakShell = outer.subtract(inner).intersect(sdf.halfSpace(N, OFF));
    const folds = (x: number, y: number, z: number) => 0.003 * Math.sin(Math.atan2(z, x) * 9) * Math.min(1, Math.max(0, (0.4 - y) / 0.25));
    k.body('mantle', cloakShell.displace(0.003, folds).bone('cloak'), {
      color: h.tint.shirt ?? '#2f4a3a',
      roughness: 0.92,
      detail: 0.006,
      bump: (x, y, z) => 0.0025 * noise.fbm(x * 40, y * 40, z * 40, 2),
    });

    // The fur: a thick collar, the cloak's hem and front edges, the cuffs, the boot cuffs.
    const collar = sdf.torus(0.104, 0.037).scale([1.12, 1, 0.96]).at(0, 0.437, 0.0).bone('chest');
    const fatShell = cloakShell.round(0.012);
    const hemFur = fatShell.intersect(sdf.halfSpace([0, 1, 0], 0.152)).bone('cloak');
    const edgeFur = fatShell
      .intersect(sdf.halfSpace(N, OFF + 0.004))
      .intersect(sdf.halfSpace([-N[0], -N[1], -N[2]], 0.016 - OFF))
      .bone('cloak');
    const cuffs = h.perArm((j) => sdf.cone(lerp(j.ELBOW, j.WRIST, 0.74), lerp(j.ELBOW, j.WRIST, 1.03), 0.049, 0.052).round(0.004).bone('forearm.L'));
    const tunicHem = h.weighted(skirtOuter.round(0.008).intersect(h.band(0.15, 0.178)));
    const bootCuff = sdf.torus(0.05, 0.024).scale([1, 1, 1]).at(ANKLE[0], 0.108, 0.002).bone('shin.L');
    k.body('fur', sdf.union(collar, hemFur, edgeFur, cuffs, tunicHem, pair(bootCuff)), { color: C.fur, roughness: 0.95, detail: 0.007, bump: furBump });

    // ------------------------------------------------------------------ brown trousers and boots
    const trouserLeg = sdf.smoothUnion(
      0.012,
      sdf.capsule(h.joints.HIP, h.joints.KNEE, 0.05).bone('leg.L'),
      sdf.cone(h.joints.KNEE, [ANKLE[0], 0.1, 0.002], 0.048, 0.046).bone('shin.L'),
    );
    k.body('trousers', sdf.smoothUnion(0.03, sdf.ellipsoid([0.118, 0.052, 0.088]).at(0, 0.2, 0).bone('hips'), pair(trouserLeg)), { color: C.trousers, roughness: 0.85 });
    const boot = sdf
      .smoothUnion(0.026, sdf.cylinder(0.05, 0.08, 0.016).at(0, 0.04, 0), sdf.ellipsoid([0.057, 0.05, 0.1]).at(0, 0.048, 0.045))
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.017), C.bootSole, 0.003)
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.65, detail: 0.004 });

    // ------------------------------------------------------------------ the staff: a knotted wooden pole with a bronze sun
    // Held upright through the right fist, leaning out a little so the sun clears the head; its foot is 3 cm above the ground.
    const g = h.arms.R.GRIP;
    const grip: V3 = [-g[0], g[1], g[2]];
    const lean = (7 * Math.PI) / 180;
    const dir: V3 = [-Math.sin(lean), Math.cos(lean), 0];
    const footY = 0.085;
    const footT = (footY - grip[1]) / dir[1];
    const foot: V3 = [grip[0] + dir[0] * footT, footY, grip[2]];
    const poleLen = 0.93;
    const at = (t: number): [number, number, number] => [foot[0] + dir[0] * t, foot[1] + dir[1] * t, foot[2]];
    const top = at(poleLen);
    const poleR = 0.0185;
    const wobble = (t: number) => 0.0008 * Math.sin(t * 11);
    const polePts: [number, number, number, number][] = [];
    for (let t = 0; t <= poleLen + 0.0001; t += poleLen / 12) {
      const p = at(t);
      polePts.push([p[0] + wobble(t), p[1], p[2], poleR * (1 + 0.1 * Math.sin(t * 23 + 1))]);
    }
    const knots = [0.2, 0.46, 0.7].map((t) => sdf.ellipsoid([0.026, 0.03, 0.026]).at(...at(t)));
    const pole = sdf.smoothUnion(0.012, sdf.chain(polePts, 0.012), ...knots);
    // The crown block under the sun and a pointed foot cap.
    const block = sdf.smoothUnion(
      0.01,
      sdf.cone(at(poleLen - 0.06), at(poleLen + 0.04), 0.03, 0.036),
      sdf.ellipsoid([0.04, 0.03, 0.04]).at(...at(poleLen + 0.055)),
      sdf.torus(0.034, 0.009).at(...at(poleLen - 0.05)),
    );
    const foot2 = sdf.sphere(0.02).at(...at(0.002));
    k.body('staff', sdf.smoothUnion(0.01, pole, block, foot2), {
      color: C.staff,
      roughness: 0.75,
      bone: 'knife.R',
      detail: 0.004,
      bump: (x, y, z) => 0.0025 * Math.sin(y * 110 + Math.sin(x * 70 + z * 70) * 2),
    });

    // The sun: a large thick ring with a hole and fourteen tapered rays, facing forward, about 0.3 m across.
    const center = at(poleLen + 0.14);
    const rays = Array.from({ length: 14 }, (_, i) => {
      const a = (i * Math.PI * 2) / 14;
      return sdf.cone([0.092 * Math.cos(a), 0.092 * Math.sin(a), 0], [0.148 * Math.cos(a), 0.148 * Math.sin(a), 0], 0.02, 0.005);
    });
    const sunDisc = sdf.smoothUnion(0.006, sdf.torus(0.075, 0.03).rotateX(90).scale([1, 1, 0.6]), sdf.torus(0.075, 0.018).rotateX(90).at(0, 0, 0.012), ...rays);
    k.body('sun', sunDisc.at(center[0], center[1], center[2]), {
      color: C.bronze,
      roughness: 0.38,
      metalness: 0.7,
      bone: 'knife.R',
      detail: 0.004,
    });
  },
});
