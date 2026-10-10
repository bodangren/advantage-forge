import { noise, profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Commander — Chibi Quest castle NPC (catalog `npcs/court-and-faction/commander`), about 1.0 m to the
 * top of the hair, faces +Z. Target: docs/npc-mockups/commander_001.jpg. Built on the humanoid kind.
 *
 * Role: the castle commander who leads the defenders and gives defense quests, seen in the castle yard
 *   and the war room in 3D and as a 128 px sprite; the big beard, the steel pauldrons over the blue
 *   cape, and the rolled map held out must read.
 * One idea: a steady, kind commander with a thick black beard and broad steel shoulders, offering a
 *   big rolled battle map with one hand and resting the other fist on his sword hilt.
 * Shape language: square and sturdy (plates, boots, coat), softened by the round beard and hair spikes.
 * Palette (60/30/10): dark coat #2a3450 and trousers #3a3c44; royal cape #2f4a8a; steel #a8acb4;
 *   leather #5a3a24 / #4a3424; accents: parchment #ece0c4 with a #8a6a4a cord, gold hilt #c8a040.
 * Value plan: the light steel plates and the pale map against the dark coat and beard are the
 *   focal points; the blue cape frames the figure from behind.
 * Bodies: skin, hair, beard, coat, cape, strap, belt, steel, gold, scabbard, trousers, boots, map, cord.
 * Rig: the humanoid kind's skeleton and clips; both arms keep a pose; the map is rigid on `knife.R`.
 */

const C = {
  coat: '#2a3450',
  steel: '#a8acb4',
  belt: '#5a3a24',
  scabbard: '#4a3424',
  hilt: '#c8a040',
  pants: '#3a3c44',
  boot: '#4a3424',
  bootFold: '#5e4230',
  hairGray: '#8a8890',
  map: '#d2b27c',
  mapEdge: '#b08a52',
  mapLine: '#5a3e22',
  cord: '#8a6a4a',
  mouth: '#8a2e2a',
  teeth: '#fbf6ee',
};

export default humanoidAsset({
  name: 'commander',
  description: 'A steady, kind army commander with a thick black beard, steel pauldrons, and a blue cape, holding out a rolled battle map.',
  reference: 'docs/npc-mockups/commander_001.jpg',
  variants: {
    skin: { light: '#e8b48e', fair: '#f2c7a4', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { ink: '#2a2428', brown: '#5a301d', auburn: '#8e3b1c', silver: '#b8b4c4' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { royal: '#2f4a8a', wine: '#6a2a3a', teal: '#1f5a64', slate: '#3e4252' },
  },
  presets: {
    marshal: { skin: 'tan', hair: 'brown', eyes: 'hazel', cloth: 'wine' },
  },
  hair: false,
  undershirt: false,
  pants: C.pants,
  shoes: false,
  lashes: false,
  // The right hand holds the map out in front at chest height; the left fist rests near the sword hilt.
  pose: {
    R: { elbow: [0.17, 0.335, 0.05] as const, wrist: [0.2, 0.33, 0.15] as const },
    L: { elbow: [0.2, 0.31, -0.03] as const, wrist: [0.15, 0.25, 0.04] as const },
  },

  // A calm, confident smile under the mustache and level, thick, arched brows.
  paintSkin(skin, h) {
    const y = 0.526;
    const grin = profile.polygon(
      [
        [-0.05, 0.014],
        [-0.026, 0.005],
        [0, 0.002],
        [0.026, 0.005],
        [0.05, 0.014],
        [0.044, 0.002],
        [0.022, -0.012],
        [0, -0.016],
        [-0.022, -0.012],
        [-0.044, 0.002],
      ],
      { smooth: true, samples: 6 },
    );
    const mouth = h.onFace(sdf.extrude(grin, 0.3), 0, y);
    const teeth = mouth.intersect(sdf.halfSpace([0, -1, 0], -(y - 0.003))).intersect(sdf.box([0.05, 0.1, 1]).at(0, y, 0));
    const oldSmile = sdf.extrude(profile.arc(0.07, 0.016, 238, 302), 0.3).at(0, 0.6, 0.1);
    const oldBrows = sdf.extrude(profile.arc(0.1, 0.036, 54, 126), 0.3).at(0.1, 0.622, 0.1).mirror('x');
    return skin
      .paintWhere(oldSmile, h.tint.skin!, 0.002)
      .paintWhere(oldBrows, h.tint.skin!, 0.002)
      .paintWhere(mouth, C.mouth)
      .paintWhere(teeth, C.teeth, 0.002);
  },

  extra(k, h) {
    const { SHOULDER, KNEE, ANKLE, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x', 0);
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];
    const hairColor = k.tint('hair');
    const gray = k.tint('hair', { color: C.hairGray, follow: 0.5 });
    const coatColor = k.tint('cloth', { color: C.coat, follow: 0.3 });

    // ------------------------------------------------------------------ hair: spiky locks over a close cap
    const CEN = [0, HEAD_Y, 0] as const;
    const RAD = [0.207, 0.2, 0.192] as const;
    const skullAt = (ux: number, uy: number, uz: number, s: number): [number, number, number] => [
      CEN[0] + RAD[0] * ux * s,
      CEN[1] + RAD[1] * uy * s,
      CEN[2] + RAD[2] * uz * s,
    ];
    const skull = sdf.ellipsoid([RAD[0] + 0.004, RAD[1] + 0.004, RAD[2] + 0.004]).at(0, HEAD_Y + 0.004, -0.006);
    const window = sdf.ellipsoid([0.19, 0.2, 0.26]).at(0, 0.6, 0.2);
    const topCap = skull.smoothSubtract(0.02, window).smoothIntersect(0.015, sdf.halfSpace([0, -1, 0], -0.68));
    const backCap = skull.smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], -0.6)).smoothIntersect(0.03, sdf.halfSpace([0, 0, 1], -0.05));
    // Short messy tufts: each stays within 3 cm of the skull and sweeps sideways along it.
    const dirOf = (phiDeg: number, elevDeg: number): [number, number, number] => {
      const phi = (phiDeg * Math.PI) / 180;
      const e = (Math.min(elevDeg, 84) * Math.PI) / 180;
      return [Math.cos(e) * Math.sin(phi), Math.sin(e), Math.cos(e) * Math.cos(phi)];
    };
    const spike = (phiDeg: number, elevDeg: number, len: number, r: number, drift: number) => {
      const u = dirOf(phiDeg, elevDeg);
      const tip = dirOf(phiDeg + drift * 500 + 12, elevDeg + len * 60 - 5);
      const p0 = skullAt(u[0], u[1], u[2], 0.9);
      const p1 = skullAt(u[0], u[1], u[2], 1.02);
      const p2 = skullAt(tip[0], tip[1], tip[2], 1.06 + len * 0.3);
      return sdf.chain(
        [
          [...p0, r * 0.9],
          [...p1, r * 0.8],
          [...p2, r * 0.4],
        ],
        0.012,
      );
    };
    const lockSet: [number, number, number, number, number][] = [];
    const rnd = (i: number, j: number) => noise.random(i, j, 7);
    for (let i = 0; i < 8; i++) lockSet.push([-72 + i * 20 + (rnd(i, 1) - 0.5) * 14, 50 + 12 * rnd(i, 2), 0.04 + 0.075 * rnd(i, 3), 0.02 + 0.005 * rnd(i, 4), (rnd(i, 5) - 0.5) * 0.05]);
    for (let i = 0; i < 6; i++) lockSet.push([-135 + i * 54 + (rnd(i, 6) - 0.5) * 20, 66 + 10 * rnd(i, 7), 0.06 + 0.1 * rnd(i, 8), 0.02 + 0.005 * rnd(i, 9), (rnd(i, 10) - 0.5) * 0.06]);
    for (let i = 0; i < 3; i++) lockSet.push([-150 + i * 150 + (rnd(i, 11) - 0.5) * 30, 56 + 8 * rnd(i, 12), 0.05 + 0.05 * rnd(i, 13), 0.02, (rnd(i, 14) - 0.5) * 0.04]);
    const locks = lockSet.map(([a, b, c, d, e]) => spike(a, b, c, d, e));
    const streaks = sdf.union(locks[1]!, locks[4]!, locks[9]!, locks[11]!, locks[15]!);
    const temple = sdf.union(
      ...[-1, 1].flatMap((sx) =>
        [0.0, 0.03].map((dz, i) =>
          sdf.chain(
            [
              [sx * 0.187, 0.7, 0.03 + dz, 0.02],
              [sx * 0.196, 0.66, 0.025 + dz, 0.017],
              [sx * 0.2, 0.655 - 0.01 * i, 0.03 + dz, 0.009],
            ],
            0.01,
          ),
        ),
      ),
    );
    const hair = sdf
      .smoothUnion(0.014, topCap, backCap, temple, ...locks)
      .paintWhere(streaks, gray, 0.004)
      .bone('head');
    k.body('hair', hair, { color: hairColor, roughness: 0.6, detail: 0.0048, bump: (x, y, z) => 0.0015 * noise.fbm(x * 90, y * 90, z * 90, 2) });

    // ------------------------------------------------------------------ beard: a thick short beard with a mustache, its own body
    const fz = (x: number, y: number) => {
      const ax = Math.min(Math.abs(x), 0.19);
      for (let yy = Math.max(y, 0.5); yy < 0.7; yy += 0.01) {
        const z = sdf.raycast(h.head, [ax, yy, 1], [0, 0, -1])?.[2];
        if (z !== undefined) return z - 0.02 * Math.max(0, yy - y > 0 ? (yy - y) / 0.05 : 0);
      }
      return 0.1;
    };
    const lowerRegion = sdf.smoothUnion(
      0.02,
      sdf.box([0.5, 0.1, 0.5]).at(0, 0.515, 0),
      pair(sdf.box([0.035, 0.1, 0.2]).at(0.2, 0.575, 0.06)),
    );
    const beardShell = h.head
      .round(0.027)
      .intersect(lowerRegion)
      .smoothIntersect(0.07, sdf.halfSpace([0.35, 0, -1], -0.03))
      .subtract(sdf.ellipsoid([0.072, 0.028, 0.11]).at(0, 0.527, fz(0, 0.527) + 0.02));
    const lobe = (x: number, drop: number, r: number) =>
      sdf.chain(
        [
          [x, 0.488, fz(x, 0.488) + 0.002, r * 0.9],
          [x * 0.85, 0.47, fz(x, 0.47) + 0.012, r],
          [x * 0.6, 0.455 - drop, fz(x * 0.6, 0.47) + 0.026, r * 0.7],
          [x * 0.4, 0.425 - drop, fz(x * 0.4, 0.45) + 0.034, r * 0.3],
        ],
        0.012,
      );
    const chin = sdf.union(lobe(-0.12, 0, 0.026), lobe(-0.08, 0.006, 0.03), lobe(-0.04, 0.012, 0.03), lobe(0, 0.016, 0.03), lobe(0.04, 0.012, 0.03), lobe(0.08, 0.006, 0.03), lobe(0.12, 0, 0.026));
    const stache = pair(
      sdf.chain(
        [
          [0.004, 0.558, fz(0, 0.558) + 0.012, 0.016],
          [0.03, 0.552, fz(0.03, 0.552) + 0.012, 0.018],
          [0.066, 0.536, fz(0.066, 0.536) + 0.01, 0.016],
          [0.086, 0.52, fz(0.086, 0.52) + 0.006, 0.012],
        ],
        0.012,
      ),
    );
    const grayLobes = sdf.union(lobe(-0.08, 0.006, 0.03), pair(sdf.ellipsoid([0.012, 0.03, 0.05]).at(0.19, 0.55, 0.07)));
    const beardColor = k.tint('hair', { color: '#1e1618', follow: 0.9 });
    const beard = sdf
      .smoothUnion(0.014, beardShell, chin, stache)
      .paintWhere(grayLobes, k.tint('hair', { color: '#5a5660', follow: 0.5 }), 0.012)
      .bone('head');
    k.body('beard', beard, { color: beardColor, roughness: 0.7, detail: 0.004, bump: (x, y, z) => 0.0007 * noise.fbm(x * 40, y * 40, z * 40, 2) });

    // Thick dark brows: a flat stroke of the hair color sitting on the brow ridge.
    const browZ = (x: number, y: number) => sdf.raycast(h.head, [x, y, 1], [0, 0, -1])?.[2] ?? 0.17;
    const browPts: [number, number][] = [[0.024, 0.698], [0.056, 0.7], [0.088, 0.69], [0.114, 0.668]];
    const brow = pair(sdf.chain(browPts.map(([x, y], i) => [x, y, browZ(x, y) - 0.004, [0.012, 0.015, 0.016, 0.011][i]!] as [number, number, number, number]), 0.01).bone('head'));
    k.body('brows', brow, { color: beardColor, roughness: 0.7, detail: 0.004 });

    // ------------------------------------------------------------------ the padded coat: long sleeves, a hem to the thigh
    const sleeve = h.perArm((j) =>
      sdf.smoothUnion(
        0.015,
        sdf.cone(lerp(SHOULDER, j.ELBOW, -0.12), j.ELBOW, 0.05, 0.046).bone('upperarm.L'),
        sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.95), 0.046, 0.043).bone('forearm.L'),
      ),
    );
    const skirt = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.23],
            [0.137, 0.23],
            [0.145, 0.2],
            [0.158, 0.17],
            [0.168, 0.145],
            [0, 0.145],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.8]);
    const coatBody = sdf.smoothUnion(0.012, h.weighted(h.torso.round(0.014)), sleeve, h.weighted(skirt)).intersect(sdf.halfSpace([0, 1, 0], 0.456).intersect(sdf.box([0.8, 1, 0.8]).at(0, 0.3, 0)).union(sleeve));
    const quilt = (x: number, y: number, z: number) => 0.0035 * Math.abs(Math.sin(y * 95)) * (0.6 + 0.4 * Math.sin((x + z) * 70));
    k.body('coat', coatBody.paintWhere(h.band(0.145, 0.155), '#202a42', 0.004), { color: coatColor, roughness: 0.85, detail: 0.005, bump: quilt });

    // ------------------------------------------------------------------ the cape: from the shoulders down the back to the knees
    const capeOuter = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.462],
            [0.126, 0.462],
            [0.168, 0.4],
            [0.185, 0.3],
            [0.215, 0.2],
            [0.262, 0.135],
            [0, 0.135],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.88]);
    const capeInner = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.48],
            [0.112, 0.48],
            [0.154, 0.4],
            [0.171, 0.3],
            [0.201, 0.2],
            [0.248, 0.12],
            [0, 0.12],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.88]);
    const capeCut = sdf.box([0.7, 0.5, 0.4]).at(0, 0.3, -0.27); // keeps z < -0.07: the back and the far sides
    const capeFold = (x: number, y: number, z: number) => 0.004 * Math.sin(Math.atan2(x, -z) * 14) * (0.4 + (0.5 - y));
    const cape = capeOuter.subtract(capeInner).intersect(capeCut).round(0.002);
    k.body('cape', cape.bone('cloak'), { color: k.tint('cloth'), roughness: 0.85, detail: 0.005, bump: capeFold });

    // ------------------------------------------------------------------ steel: pauldrons, a gorget, bracers, elbow plates, knee plates
    const pauldron = pair(sdf.ellipsoid([0.088, 0.05, 0.08]).rotateZ(-26).at(0.162, 0.42, 0).bone('chest'));
    const pauldronRim = pair(sdf.torus(0.066, 0.008).scale([1, 1, 0.95]).rotateZ(-24).at(0.158, 0.4, 0).bone('chest'));
    const gorget = sdf.torus(0.07, 0.016).scale([1, 1, 0.84]).at(0, 0.446, -0.005).bone('chest');
    const bracer = h.perArm((j) => sdf.cone(lerp(j.ELBOW, j.WRIST, 0.4), lerp(j.ELBOW, j.WRIST, 0.93), 0.05, 0.047).round(0.003).bone('forearm.L'));
    const cop = h.perArm((j) => sdf.ellipsoid([0.04, 0.04, 0.042]).at(j.ELBOW[0] + 0.01, j.ELBOW[1], j.ELBOW[2] - 0.004).bone('forearm.L'));
    const knee = pair(sdf.ellipsoid([0.044, 0.042, 0.03]).at(KNEE[0], KNEE[1] + 0.004, 0.044).bone('leg.L'));
    const rivets = pair(sdf.sphere(0.009).at(0.19, 0.43, 0.045).bone('chest'));
    k.body('steel', sdf.union(pauldron, pauldronRim, gorget, bracer, cop, knee, rivets), { color: C.steel, roughness: 0.4, metalness: 0.8, detail: 0.005 });

    // ------------------------------------------------------------------ the baldric, the belt, and the sword
    const torsoShell = h.torso.round(0.02).subtract(h.torso.round(0.004));
    const strap = h.weighted(torsoShell.intersect(sdf.box([0.042, 0.62, 0.7]).rotateZ(48).at(0.01, 0.325, 0)).intersect(h.band(0.225, 0.45)));
    k.body('strap', strap, { color: C.belt, roughness: 0.7, detail: 0.004 });
    const belt = h.torso.round(0.026).subtract(h.torso.round(0.006)).intersect(h.band(0.2, 0.238));
    const beltZ = sdf.raycast(h.torso.round(0.026), [0, 0.219, 1], [0, 0, -1])?.[2] ?? 0.14;
    const buckle = sdf.box([0.06, 0.04, 0.014], 0.006).subtract(sdf.box([0.034, 0.02, 0.05])).at(0, 0.219, beltZ + 0.002);
    k.body('belt', h.weighted(belt), { color: C.belt, roughness: 0.7, detail: 0.004 });
    k.body('buckle', buckle.bone('hips'), { color: C.steel, roughness: 0.4, metalness: 0.8, detail: 0.003 });
    // The hilt stands at the left hip under the fist, the scabbard hangs down and back.
    const gL = h.arms.L.GRIP;
    const hiltGrip = sdf.capsule([gL[0] + 0.01, 0.222, gL[2] - 0.045], [gL[0] + 0.012, gL[1] + 0.03, gL[2] - 0.03], 0.014);
    const guard = sdf.box([0.075, 0.014, 0.02], 0.005).rotateY(-20).at(gL[0] + 0.005, 0.226, gL[2] - 0.05);
    const pommel = sdf.sphere(0.02).at(gL[0] + 0.012, gL[1] + 0.036, gL[2] - 0.028);
    k.body('gold', sdf.union(hiltGrip, guard, pommel).bone('hips'), { color: C.hilt, roughness: 0.4, metalness: 0.6, detail: 0.003 });
    const scabbard = sdf
      .smoothUnion(0.005, sdf.cone([0.17, 0.215, -0.06], [0.2, 0.068, -0.17], 0.026, 0.017), sdf.sphere(0.018).at(0.2, 0.066, -0.17), sdf.torus(0.024, 0.008).rotateX(70).at(0.175, 0.19, -0.07))
      .bone('hips');
    k.body('scabbard', scabbard, { color: C.scabbard, roughness: 0.7, detail: 0.004 });

    // ------------------------------------------------------------------ plain tall boots with folded cuffs
    const bootShape = sdf
      .smoothUnion(0.025, sdf.ellipsoid([0.058, 0.046, 0.104]).at(0, 0.044, 0.044), sdf.cylinder(0.054, 0.12, 0.014).at(0, 0.055, 0))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const sole = bootShape.round(0.004).intersect(sdf.halfSpace([0, 1, 0], 0.014)).intersect(sdf.halfSpace([0, -1, 0], 0));
    const boot = sdf.union(bootShape, sole.paint('#2a1c14')).rotateY(8).at(ANKLE[0], 0, 0).bone('foot.L');
    const fold = sdf.cylinder(0.063, 0.034, 0.014).at(0, 0.098, 0).rotateY(8).at(ANKLE[0], 0, 0).bone('shin.L');
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.6, detail: 0.005 });
    k.body('boot-folds', pair(fold), { color: C.bootFold, roughness: 0.65, detail: 0.004 });

    // ------------------------------------------------------------------ the rolled map in the right fist
    // The rest grip points forward and 20 degrees up; the posed forearm turns it. The map follows the
    // grip axis, tilted outward so that it reads from the front, with the fist near one end.
    const gR = h.arms.R.GRIP;
    const wr = h.arms.R.WRIST;
    const el = h.arms.R.ELBOW;
    const e0 = [0.18, 0.332, 0.012];
    const w0 = [0.205, 0.238, 0.03];
    const unit = (v: number[]): [number, number, number] => {
      const l = Math.hypot(v[0]!, v[1]!, v[2]!);
      return [v[0]! / l, v[1]! / l, v[2]! / l];
    };
    const sub = (a: readonly number[], b: readonly number[]) => [a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!];
    const f0 = unit(sub(w0, e0));
    const f1 = unit(sub(wr, el));
    // The rotation axis and angle that take the hanging forearm to the posed one (Rodrigues).
    const cr = [f0[1] * f1[2] - f0[2] * f1[1], f0[2] * f1[0] - f0[0] * f1[2], f0[0] * f1[1] - f0[1] * f1[0]];
    const sinA = Math.hypot(cr[0]!, cr[1]!, cr[2]!);
    const cosA = f0[0] * f1[0] + f0[1] * f1[1] + f0[2] * f1[2];
    const ax = unit(cr);
    const rot = (v: [number, number, number]): [number, number, number] => {
      const d = ax[0] * v[0] + ax[1] * v[1] + ax[2] * v[2];
      const c = [ax[1] * v[2] - ax[2] * v[1], ax[2] * v[0] - ax[0] * v[2], ax[0] * v[1] - ax[1] * v[0]];
      return [0, 1, 2].map((i) => v[i]! * cosA + c[i]! * sinA + ax[i]! * d * (1 - cosA)) as [number, number, number];
    };
    const itemDir = rot([0, Math.sin(Math.PI / 9), Math.cos(Math.PI / 9)]);
    // Tilt the map from the grip axis toward the outside of the body (+X in left coordinates), then mirror to the right hand.
    const axis = unit([itemDir[0] + 0.55, itemDir[1] * 0.3 + 0.05, itemDir[2] + 0.3]);
    const L = 0.24;
    const a0: [number, number, number] = [gR[0] - axis[0] * 0.07, gR[1] - axis[1] * 0.07, gR[2] - axis[2] * 0.07];
    const mp = (p: [number, number, number]): [number, number, number] => [-p[0], p[1], p[2]];
    const R0 = 0.036;
    const R1 = 0.05;
    const at = (t: number, off = 0): [number, number, number] =>
      mp([a0[0] + axis[0] * (L * t + off), a0[1] + axis[1] * (L * t + off), a0[2] + axis[2] * (L * t + off)]);
    // A paper roll that flares at the far end, hollow so that the spiral shows.
    const outer = sdf.cone(at(0), at(1), R0, R1).round(0.003);
    const hollow = sdf.cone(at(0.55), at(1.05), R0 * 0.35, R1 * 0.7);
    const paper = outer.subtract(hollow);
    // The curled edge: a ridge along the roll that lifts away at the open end.
    const side = unit([-axis[2], 0, -axis[0]]);
    const ridgePt = (t: number, lift: number): [number, number, number, number] => {
      const q = at(t);
      const rr = R0 + (R1 - R0) * t + 0.008 + lift;
      return [q[0] + side[0] * rr * 0.8, q[1] + rr * 0.6, q[2] + side[2] * rr * 0.8, 0.011 - 0.004 * t];
    };
    const ridge = sdf.chain([ridgePt(0.12, 0), ridgePt(0.45, 0.002), ridgePt(0.78, 0.016), ridgePt(1.0, 0.04)], 0.008);
    const mapShape = sdf.smoothUnion(0.008, paper, ridge).paintWhere(ridge, C.mapEdge, 0.006);
    const inner = sdf.cone(at(0.6), at(1.0), R0 * 0.4, R1 * 0.75).round(0.002);
    const line = (t: number) => sdf.cone(at(t, -0.005), at(t, 0.005), R1 + 0.02, R1 + 0.02);
    k.body('map', mapShape.paintWhere(inner, C.mapEdge, 0.006).paintWhere(line(0.72), C.mapLine, 0.002).paintWhere(line(0.88), C.mapLine, 0.002), { color: C.map, roughness: 0.85, bone: 'knife.R', detail: 0.003 });
    // The cord: one thin tie around the roll.
    const band = (t: number) => sdf.cone(at(t, -0.008), at(t, 0.008), R0 + (R1 - R0) * t + 0.003, R0 + (R1 - R0) * t + 0.003).round(0.002);
    k.body('cord', band(0.3), { color: C.cord, roughness: 0.8, bone: 'knife.R', detail: 0.003 });
  },
});
