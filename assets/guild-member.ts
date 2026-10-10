import { profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Guild member — Chibi Quest court-and-faction NPC (catalog `npcs/court-and-faction/guild-member`),
 * about 1.0 m to the top of the hair, faces +Z. Target: docs/npc-mockups/guild-member_001.jpg.
 * Built on the humanoid kind.
 *
 * Role: a guild hall NPC (helps new members, gives crafting errands), seen in 3D and as a 128 px sprite;
 *   the copper hair, the raised banner, the brown package, and the grin must read.
 * One idea: an eager young crafter with a big copper quiff who waves a blue and gold guild banner.
 * Shape language: round and soft (hair locks, face, package), with the flat banner as the one hard form.
 * Palette (60/30/10): dark blue shirt #2a3a5a (cloth slot) and tan trousers #b8a478 frame the brown apron
 *   #6b4226 with a bronze badge #c08a3a; hair #b0582a; banner #2f4a8a with a gold emblem #e0b040.
 * Value plan: the bright copper hair is the focal point; the dark blue and brown mid-values sit below it.
 * Bodies: skin (grin, freckles), hair, shirt, cuffs, apron, belt, badge, pouch, pants, boots, banner, pole,
 *   finial, package, string.
 * Rig: the humanoid kind's skeleton and clips. The right arm is raised in a rest pose (`pose.R`); the
 *   banner is rigid on `knife.R` and the package on `knife.L`.
 */

const C = {
  hair: '#b0582a',
  apron: '#6b4226',
  apronSeam: '#4a2c18',
  belt: '#5a3a24',
  bronze: '#c08a3a',
  bronzeDark: '#7a5220',
  pants: '#b8a478',
  pantsCuff: '#d2c08e',
  boot: '#5a3a24',
  bootSole: '#3a2416',
  lace: '#d8c8a0',
  banner: '#2f4a8a',
  gold: '#e0b040',
  pole: '#8a6a3a',
  paper: '#b8946a',
  paperDark: '#9a774e',
  string: '#ece0c8',
  freckle: '#c8805a',
  mouth: '#8a2e2a',
  tongue: '#d8706a',
  teeth: '#fbf6ee',
  pouch: '#6a4228',
};

const rad = Math.PI / 180;

export default humanoidAsset({
  name: 'guild-member',
  description: 'An eager young guild crafter in a leather work apron, waving a blue and gold guild banner and holding a wrapped package.',
  reference: 'docs/npc-mockups/guild-member_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { copper: '#b0582a', brown: '#5a301d', black: '#231a17', blond: '#c4974a', auburn: '#8e3b1c', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { navy: '#2a3a5a', ochre: '#9a6a2a', plum: '#5a3550', pine: '#2f5a48' },
  },
  presets: {
    forge: { skin: 'tan', hair: 'auburn', eyes: 'green', cloth: 'ochre' },
  },
  hair: false,
  undershirt: false,
  pants: false,
  shoes: false,
  lashes: false,
  pose: { R: { elbow: [0.21, 0.38, 0.03], wrist: [0.27, 0.5, 0.08] } },

  // The grin: round corners and one white tooth band. The kind's thin smile is painted out first.
  // Freckles on both cheeks.
  paintSkin(skin, h) {
    const y = 0.538;
    const oldSmile = sdf.extrude(profile.arc(0.07, 0.03, 236, 304), 0.3).at(0, 0.6, 0.1);
    const grin = profile.polygon(
      [
        [-0.05, 0.012],
        [-0.028, 0.004],
        [0, 0.0],
        [0.028, 0.004],
        [0.05, 0.012],
        [0.041, -0.011],
        [0.021, -0.027],
        [0, -0.031],
        [-0.021, -0.027],
        [-0.041, -0.011],
      ],
      { smooth: true, samples: 6 },
    );
    const mouth = h.onFace(sdf.extrude(grin, 0.3), 0, y);
    const teeth = mouth.intersect(sdf.halfSpace([0, -1, 0], -(y - 0.012))).intersect(sdf.box([0.07, 0.1, 1]).at(0, y, 0));
    const tongue = h.onFace(sdf.ellipsoid([0.022, 0.011, 0.08]), 0, y - 0.025);
    const dots: [number, number][] = [
      [0.085, 0.588],
      [0.103, 0.595],
      [0.12, 0.586],
      [0.094, 0.575],
      [0.113, 0.574],
      [0.13, 0.597],
      [0.075, 0.598],
    ];
    const freckles = sdf.union(...dots.flatMap(([x, fy]) => [x, -x].map((fx) => h.onFace(sdf.ellipsoid([0.0065, 0.0055, 0.06]), fx, fy))));
    return skin
      .paintWhere(oldSmile, h.tint.skin!, 0.002)
      .paintWhere(freckles, C.freckle, 0.002)
      .paintWhere(mouth, C.mouth)
      .paintWhere(tongue.intersect(mouth), C.tongue, 0.004)
      .paintWhere(teeth, C.teeth, 0.002);
  },

  extra(k, h) {
    const { SHOULDER, HIP, KNEE, ANKLE, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];

    // ------------------------------------------------------------------ hair: a small cap and many wavy locks
    const hairPose = (s: sdf.Shape) => s.at(0, HEAD_Y, 0).bone('head');
    const hairColor = k.tint('hair');
    const AX = 0.222;
    const AY = 0.216;
    const AZ = 0.206;
    // A lock follows the hair surface from (az0, el0) to (az1, el1), in degrees (az 0 = front, el 90 = crown).
    const lock = (az0: number, az1: number, el0: number, el1: number, r0: number, r1: number, wave = 0, flick = 0) => {
      const pts: [number, number, number, number][] = [];
      const n = 5;
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const az = (az0 + (az1 - az0) * t + wave * Math.sin(t * Math.PI * 2)) * rad;
        const el = (el0 + (el1 - el0) * t) * rad;
        const s = 1 + 0.02 * Math.sin(t * Math.PI) + flick * t * t;
        pts.push([AX * Math.cos(el) * Math.sin(az) * s, AY * Math.sin(el) * s, AZ * Math.cos(el) * Math.cos(az) * s, r0 + (r1 - r0) * t]);
      }
      return sdf.chain(pts, 0.008);
    };
    const capBase = sdf.ellipsoid([0.213, 0.207, 0.197]).intersect(sdf.halfSpace([0, -1, 0], 0.045));
    const faceMask = sdf.box([0.27, 0.17, 0.2], 0.03).at(0, 0.07 - 0.085, 0.17);
    const cap = capBase.smoothSubtract(0.02, faceMask);
    // The fringe sweeps toward the viewer's right (+x) from a crown quiff.
    const fringe = [
      lock(-75, -52, 70, 36, 0.032, 0.01, 6, 0.06),
      lock(-60, -34, 80, 32, 0.036, 0.01, 10, 0.1),
      lock(-40, -8, 84, 30, 0.04, 0.01, -10, 0.12),
      lock(-20, 18, 86, 32, 0.042, 0.01, 10, 0.12),
      lock(0, 38, 84, 28, 0.042, 0.01, -10, 0.14),
      lock(20, 56, 80, 32, 0.04, 0.01, 10, 0.12),
      lock(45, 74, 72, 36, 0.036, 0.01, -8, 0.1),
    ];
    const quiff = sdf.ellipsoid([0.17, 0.07, 0.16]).at(0, 0.15, 0.0);
    const crown = [quiff, lock(-90, -60, 86, 62, 0.04, 0.026, 6), lock(90, 60, 86, 62, 0.04, 0.026, 6), lock(180, 180, 78, 60, 0.04, 0.03)];
    // Side and back locks, built on one side and mirrored (the fringe stays lopsided).
    const sideLocks = sdf.union(
      lock(92, 100, 58, 8, 0.036, 0.018, 6, 0.03),
      lock(112, 120, 50, -6, 0.036, 0.016, -6, 0.04),
      lock(135, 140, 46, -14, 0.036, 0.016, 6, 0.04),
      lock(158, 160, 40, -20, 0.036, 0.016, -6, 0.035),
    );
    const sideburn = lock(78, 84, 38, 0, 0.026, 0.012, 0, 0.02);
    const backCenter = [lock(180, 180, 40, -22, 0.04, 0.018, 0, 0.03), lock(172, 172, 60, 5, 0.036, 0.02, 4, 0.03)];
    const hair = sdf.smoothUnion(0.008, cap, ...fringe, ...crown, pair(sdf.union(sideLocks, sideburn)), ...backCenter);
    k.body('hair', hairPose(hair), { color: hairColor, roughness: 0.6, detail: 0.004, bump: (x, y, z) => 0.0015 * Math.sin((x + z) * 90 + y * 40) });

    // ------------------------------------------------------------------ shirt: dark blue, sleeves rolled to the forearm
    const upper = h.perArm((j) => sdf.cone(lerp(SHOULDER, j.ELBOW, -0.1), j.ELBOW, 0.047, 0.043).bone('upperarm.L'));
    const foreSleeve = h.perArm((j) => sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.5), 0.043, 0.041).bone('forearm.L'));
    const shirt = sdf.smoothUnion(0.012, h.weighted(h.torso), upper, foreSleeve);
    k.body('shirt', shirt, { color: h.tint.shirt ?? '#2a3a5a', roughness: 0.85 });
    // The rolled cuff and the collar (a soft ring with two points at the front).
    const cuff = h.perArm((j) => sdf.cone(lerp(j.ELBOW, j.WRIST, 0.44), lerp(j.ELBOW, j.WRIST, 0.66), 0.048, 0.047).round(0.004).bone('forearm.L'));
    const collar = sdf.torus(0.062, 0.018).at(0, 0.452, -0.008).bone('chest');
    const flap = pair(sdf.box([0.05, 0.03, 0.012], 0.005).rotateZ(-20).rotateY(-20).at(0.03, 0.44, 0.075)).bone('chest');
    k.body('cuffs', sdf.union(cuff, collar, flap), { color: h.tint.shirt ?? '#2a3a5a', roughness: 0.9, detail: 0.004 });

    // ------------------------------------------------------------------ leather apron: bib, straps, skirt
    const shell = h.torso.round(0.012).subtract(h.torso.round(-0.003));
    const front = (x: number, y0: number, y1: number) => sdf.box([2 * x, y1 - y0, 0.4], 0.01).at(0, (y0 + y1) / 2, 0.2);
    const bib = shell.intersect(front(0.085, 0.255, 0.418));
    const strap = shell
      .intersect(sdf.box([0.034, 0.5, 0.6]).at(0.076, 0.39, 0))
      .intersect(sdf.halfSpace([0, -1, 0], -0.3))
      .intersect(sdf.halfSpace([0, 1, 0], 0.5))
      .bone('chest');
    const skirtProfile = (inset: number) =>
      profile.polygon(
        [
          [0, 0.3],
          [0.138 - inset, 0.3],
          [0.15 - inset, 0.25],
          [0.157 - inset, 0.215],
          [0.164 - inset, 0.195],
          [0.168 - inset, 0.172],
          [0, 0.172],
        ],
        { smooth: true, samples: 8 },
      );
    const skirtOuter = sdf.revolve(skirtProfile(0)).scale([1, 1, 0.8]);
    const skirtInner = sdf.revolve(skirtProfile(0.014)).scale([1, 1, 0.78]).at(0, -0.002, 0);
    const skirt = skirtOuter.subtract(skirtInner).intersect(sdf.box([0.27, 0.27, 0.4], 0.02).at(0, 0.222, 0.2));
    const apron = sdf
      .smoothUnion(0.008, h.weighted(bib), pair(strap), h.weighted(skirt))
      .paintWhere(h.band(0.172, 0.182), C.apronSeam, 0.002)
      .paintWhere(h.band(0.25, 0.262), C.apronSeam, 0.002);
    k.body('apron', apron, { color: C.apron, roughness: 0.7, detail: 0.005, bump: (x, y, z) => 0.0022 * Math.sin(x * 75 + Math.sin(y * 60) * 2) * Math.cos(z * 70 + y * 25) });

    // Bronze buttons where the straps meet the bib.
    const outer = h.torso.round(0.012);
    const buttons = pair(
      sdf.union(
        ...[0.4].map((by) => {
          const bx = 0.076;
          const z = sdf.raycast(outer, [bx, by, 1], [0, 0, -1])![2];
          return sdf.sphere(0.0125).at(bx, by - 0.012, z + 0.002);
        }),
      ),
    );

    // ------------------------------------------------------------------ tool belt, badge, and pouch
    const beltOuter = h.torso.round(0.021);
    const beltShape = beltOuter.subtract(h.torso.round(0.005)).intersect(h.band(0.234, 0.268));
    k.body('belt', h.weighted(beltShape), { color: C.belt, roughness: 0.65, detail: 0.004 });

    const bz = sdf.raycast(beltOuter, [0, 0.251, 1], [0, 0, -1])![2];
    const badge = sdf.smoothUnion(
      0.004,
      sdf.cylinder(0.034, 0.012, 0.004).rotateX(90).at(0, 0.251, bz + 0.002),
      sdf.torus(0.034, 0.006).rotateX(90).at(0, 0.251, bz + 0.006),
    );
    const emblem = sdf.union(sdf.box([0.034, 0.008, 0.1], 0.002).at(0, 0.251, bz), sdf.box([0.008, 0.034, 0.1], 0.002).at(0, 0.251, bz)).intersect(
      sdf.halfSpace([0, 0, -1], -(bz + 0.0035)),
    );
    const badgePaint = badge.paintWhere(emblem, C.bronzeDark, 0.0015);
    k.body('badge', badgePaint.union(buttons).bone('chest'), { color: C.bronze, roughness: 0.38, metalness: 0.8, detail: 0.003 });

    // A leather pouch on the right hip (x < 0) with a flap and a tool handle.
    const pouch = sdf
      .smoothUnion(
        0.01,
        sdf.box([0.06, 0.085, 0.085], 0.016).at(-0.158, 0.2, 0.0),
        sdf.box([0.066, 0.03, 0.09], 0.01).at(-0.158, 0.236, 0.0),
        sdf.capsule([-0.15, 0.24, -0.03], [-0.15, 0.3, -0.05], 0.011), // a tool handle
      )
      .bone('hips');
    k.body('pouch', pouch, { color: C.pouch, roughness: 0.7, detail: 0.004 });

    // ------------------------------------------------------------------ tan trousers with rolled cuffs, brown boots
    const trouserLeg = sdf.smoothUnion(
      0.012,
      sdf.capsule(HIP, KNEE, 0.05).bone('leg.L'),
      sdf.cone(KNEE, [ANKLE[0], 0.122, 0.002], 0.048, 0.046).bone('shin.L'),
    );
    k.body('pants', sdf.smoothUnion(0.03, sdf.ellipsoid([0.118, 0.052, 0.088]).at(0, 0.2, 0).bone('hips'), pair(trouserLeg)), {
      color: C.pants,
      roughness: 0.85,
    });
    const rollCuff = sdf.cylinder(0.054, 0.028, 0.012).at(ANKLE[0], 0.113, 0.002).bone('shin.L');
    k.body('pantsCuff', pair(rollCuff), { color: C.pantsCuff, roughness: 0.9, detail: 0.004 });
    const shaft = sdf.cylinder(0.045, 0.046, 0.012).at(ANKLE[0], 0.094, 0.002);
    const bootBody = sdf
      .smoothUnion(0.025, sdf.ellipsoid([0.058, 0.043, 0.104]).at(0, 0.042, 0.042), sdf.sphere(0.052).at(0, 0.05, -0.005))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const boot = sdf.smoothUnion(0.015, bootBody.rotateY(12).at(ANKLE[0], 0, 0), shaft).bone('foot.L');
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.6 });
    // Laces: three small bars across the instep and a dark sole line.
    const laces = sdf.union(
      ...[0, 1, 2].map((i) => {
        const lz = 0.052 + i * 0.022;
        return sdf.box([0.05, 0.007, 0.007], 0.002).rotateY(12).at(ANKLE[0], 0.078 - i * 0.004, lz);
      }),
    );
    k.body('laces', pair(laces.bone('foot.L')), { color: C.lace, roughness: 0.8, detail: 0.003 });

    // ------------------------------------------------------------------ the guild banner, held up in the right fist (x < 0)
    const gR = h.arms.R.GRIP;
    const px = -gR[0];
    const py = gR[1];
    const pz = gR[2];
    const poleLen = 0.34;
    const poleR = 0.0135;
    const tilt = -8; // leans outward, away from the head
    const poleFrame = (s: sdf.Shape) => s.rotateZ(tilt).at(px, py, pz);
    const poleBase = -0.1; // the pole starts below the fist
    const pole = poleFrame(sdf.capsule([0, poleBase, 0], [0, poleBase + poleLen, 0], poleR));
    k.body('pole', pole.bone('knife.R'), { color: C.pole, roughness: 0.7, detail: 0.003, bump: (x, y, z) => 0.0012 * Math.sin(y * 160 + z * 30) });
    const topY = poleBase + poleLen;
    const finial = poleFrame(sdf.smoothUnion(0.006, sdf.sphere(0.02).at(0, topY + 0.012, 0), sdf.cylinder(0.016, 0.01, 0.004).at(0, topY - 0.008, 0)));
    k.body('finial', finial.bone('knife.R'), { color: C.gold, roughness: 0.3, metalness: 0.85, detail: 0.003 });
    // The cloth: 0.14 m wide, flying outward (-x) from the pole top, with a swallowtail notch and a gold top edge.
    const bw = 0.17;
    const bh = 0.13;
    const clothProfile = profile.polygon(
      [
        [0.004, 0],
        [-bw, 0],
        [-bw + 0.03, -bh / 2],
        [-bw, -bh],
        [0.004, -bh],
      ],
      { smooth: false },
    );
    const clothFlat = sdf.extrude(clothProfile, 0.016, 0.003).at(0, 0, 0);
    const wavy = clothFlat.displace(0.004, (x, y) => Math.sin(x * 38 + y * 10));
    const trim = clothFlat.intersect(sdf.box([0.4, 0.016, 0.4]).at(0, -0.008, 0));
    const emblemStar = sdf
      .extrude(
        profile.polygon([
          [0, 0.026],
          [0.008, 0.008],
          [0.026, 0],
          [0.008, -0.008],
          [0, -0.026],
          [-0.008, -0.008],
          [-0.026, 0],
          [-0.008, 0.008],
        ]),
        0.3,
      )
      .at(-0.06, -bh / 2, 0);
    const cloth = wavy.paintWhere(trim, C.gold, 0.002).paintWhere(emblemStar, C.gold, 0.002);
    // The cloth hangs from the pole just under the finial; its inner edge hugs the pole.
    k.body('banner', poleFrame(cloth.at(-poleR + 0.004, topY - 0.012, 0)).bone('knife.R'), { color: C.banner, roughness: 0.85, detail: 0.003 });

    // ------------------------------------------------------------------ the brown paper package, in the left fist (x > 0)
    const gL = h.arms.L.GRIP;
    const pkgFrame = (s: sdf.Shape) => s.rotateX(-20).at(gL[0] + 0.012, gL[1] + 0.012, gL[2] + 0.05);
    const pkgBox = sdf.box([0.08, 0.1, 0.135], 0.016);
    const pkgBody = sdf.smoothUnion(
      0.012,
      pkgBox,
      sdf.ellipsoid([0.04, 0.05, 0.02]).at(0, 0.005, 0.062), // a puckered fold at the front end
      sdf.ellipsoid([0.04, 0.05, 0.02]).at(0, 0.005, -0.062), // and at the back end
    );
    const fold = sdf.box([0.032, 0.05, 0.01], 0.004).at(0.006, 0.043, 0.0).rotateX(0);
    const pkg = sdf.smoothUnion(0.008, pkgBody, fold.at(0, 0, 0));
    const paperPaint = pkgFrame(pkg.paintWhere(sdf.halfSpace([0, -1, 0], -0.03).intersect(sdf.box([0.2, 0.3, 0.3])), C.paperDark, 0.02));
    k.body('package', paperPaint.bone('knife.L'), { color: C.paper, roughness: 0.9, detail: 0.003, bump: (x, y, z) => 0.0018 * Math.sin(x * 130 + z * 70) * Math.cos(y * 110) });
    // The string: two bands around the package and a knot with two loose ends.
    const around = pkgBody.round(0.004);
    const band = (z: number) => around.intersect(sdf.box([0.3, 0.3, 0.009]).at(0, 0, z));
    const knot = sdf.smoothUnion(
      0.004,
      sdf.sphere(0.011).at(0.0, 0.049, 0.02),
      sdf.capsule([0.0, 0.049, 0.02], [0.022, 0.044, 0.04], 0.004),
      sdf.capsule([0.0, 0.049, 0.02], [-0.02, 0.046, 0.04], 0.004),
    );
    k.body('string', pkgFrame(sdf.smoothUnion(0.003, band(0.02), band(-0.025), knot)).bone('knife.L'), { color: C.string, roughness: 0.85, detail: 0.003 });
  },
});
