import { profile, sdf } from '../src/index.js';
import type { Rgb } from '../src/sdf/color.js';
import { humanoidAsset } from './parts/humanoid-kind.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Dwarf citizen — Chibi Quest NPC (catalog `npcs/fantasy-peoples/dwarf-citizen`), about 0.9 m to the
 * top of the cap, faces +Z. Target: docs/npc-mockups/dwarf-citizen_001.jpg. Built on the humanoid
 * kind, then scaled to 0.9 (the dwarf is short and broad: the tunic carries the width).
 *
 * Role: a gem trader of the dwarf hold; the huge braided red beard, the big nose, and the raised
 *   blue gem must read at 128 px.
 * One idea: a cheerful barrel of a dwarf behind a huge red beard with two ringed braids.
 * Shape language: round and soft (beard, nose, belly), with the square buckle and the hammer head as
 *   the hard forms.
 * Palette (60/30/10): red #b0502a (hair, beard); moss #4a6a3a (tunic); browns #6b4226 cap, #5a3a24
 *   belt, #6b4a2c trousers, #3a2a24 boots; accent gold #e0b040 (rings, buckle) and the blue gem #3a7ad0.
 * Value plan: the bright red beard against the dark green tunic is the focal point; the gem is the
 *   one cold accent.
 * Bodies: skin, cap, hair (locks), beard, braids, gold, nose, ears, tunic, leather, trousers, boots,
 *   toecaps, gem, hammer head, hammer handle.
 * Rig: the humanoid kind's skeleton and clips; the right arm keeps a raised pose with the gem on
 *   `knife.R`, the hammer is rigid on `knife.L`.
 */

const C = {
  cap: '#6b4226',
  belt: '#5a3a24',
  pants: '#6b4a2c',
  boot: '#3a2a24',
  steel: '#a8acb4',
  gold: '#e0b040',
  gem: '#3a7ad0',
  handle: '#7a4a2c',
  red: '#b0502a',
  mouth: '#8a2e2a',
  tongue: '#d8706a',
  teeth: '#fbf6ee',
};

const base = humanoidAsset({
  name: 'dwarf-citizen',
  description: 'A cheerful stocky dwarf townsman with a huge braided red beard and a brown cap, holding up a blue gem and a small hammer.',
  reference: 'docs/npc-mockups/dwarf-citizen_001.jpg',
  variants: {
    skin: { light: '#e8b48e', fair: '#f2c7a4', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { red: '#b0502a', auburn: '#8e3b1c', brown: '#5a301d', black: '#231a17', blond: '#c4974a', silver: '#b8b4c4' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { moss: '#4a6a3a', russet: '#8a4a30', slate: '#4a5870', plum: '#6a4a68' },
  },
  presets: {
    deepdelver: { skin: 'tan', hair: 'brown', eyes: 'hazel', cloth: 'slate' },
  },
  hair: false,
  lashes: false,
  undershirt: false,
  pants: false,
  shoes: false,
  // The right arm raised beside the head with the gem in the fist.
  pose: { R: { elbow: [0.2, 0.34, 0.02], wrist: [0.25, 0.42, 0.07] } },

  // A wide, hearty grin with one band of teeth, thick arched brows, and a lower mouth than the default.
  paintSkin(skin, h) {
    const y = 0.527;
    const grin = profile.polygon(
      [
        [-0.056, 0.016],
        [-0.03, 0.005],
        [0, 0.0],
        [0.03, 0.005],
        [0.056, 0.016],
        [0.047, -0.012],
        [0.024, -0.032],
        [0, -0.038],
        [-0.024, -0.032],
        [-0.047, -0.012],
      ],
      { smooth: true, samples: 6 },
    );
    const mouth = h.onFace(sdf.extrude(grin, 0.3), 0, y);
    const teeth = mouth.intersect(sdf.halfSpace([0, -1, 0], -(y - 0.012))).intersect(sdf.box([0.066, 0.1, 1]).at(0, y, 0));
    const tongue = h.onFace(sdf.ellipsoid([0.026, 0.014, 0.08]), 0, y - 0.03);
    const oldBrows = sdf.extrude(profile.arc(0.1, 0.036, 54, 126), 0.3).at(0.1, 0.622, 0.1).mirror('x');
    const brows = sdf.extrude(profile.arc(0.07, 0.02, 52, 118), 0.3).at(0.1, 0.656, 0.1).mirror('x');
    return skin
      .paintWhere(oldBrows, h.tint.skin!, 0.002)
      .paintWhere(brows, h.tint.brow!, 0.002)
      .paintWhere(mouth, C.mouth)
      .paintWhere(tongue.intersect(mouth), C.tongue, 0.004)
      .paintWhere(teeth, C.teeth, 0.002);
  },

  extra(k, h) {
    const { SHOULDER, HIP, KNEE, ANKLE, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const hard = (s: sdf.Shape) => s.mirror('x', 0);
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];
    const hairColor = k.tint('hair');
    const skinColor = k.tint('skin');

    // A point on the head surface at an angle around Y (0 = front, 90 = the left side, 180 = back).
    const surf = (aDeg: number, y: number, lift = 0): [number, number, number] => {
      const a = (aDeg * Math.PI) / 180;
      const hit = sdf.raycast(h.head, [0.6 * Math.sin(a), y, 0.6 * Math.cos(a)], [-Math.sin(a), 0, -Math.cos(a)]);
      const p = hit ?? [0.2 * Math.sin(a), y, 0.19 * Math.cos(a)];
      return [p[0]! + lift * Math.sin(a), y, p[2]! + lift * Math.cos(a)];
    };

    // ------------------------------------------------------------------ cap: a tall brown dome, a rolled brim, ear flaps
    const capPose = (s: sdf.Shape) => s.rotateX(-8).at(0, HEAD_Y, 0);
    const dome = sdf.ellipsoid([0.224, 0.225, 0.212]).at(0, 0.05, -0.005).intersect(sdf.halfSpace([0, -1, 0], -0.055));
    const brim = sdf.torus(0.203, 0.03).scale([1, 1, 0.94]).at(0, 0.066, 0);
    const flaps = hard(sdf.ellipsoid([0.04, 0.052, 0.075]).rotateZ(-8).at(0.205, 0.04, -0.01));
    const cap = capPose(sdf.smoothUnion(0.022, dome, brim, flaps)).bone('head');
    k.body('cap', cap, {
      color: C.cap,
      roughness: 0.85,
      detail: 0.005,
      bump: (x, y, z) => 0.0025 * Math.sin(x * 70 + z * 50) * Math.cos(y * 60),
    });

    // Gold swirls on the crown, following the dome.
    const domeY = (x: number, z: number) => 0.05 + 0.225 * Math.sqrt(Math.max(0, 1 - (x / 0.224) ** 2 - ((z + 0.005) / 0.212) ** 2)) + 0.003;
    const swirlPts: [number, number][] = [
      [0.1, 0.1],
      [0.14, 0.04],
      [0.1, -0.01],
      [0.05, 0.03],
      [0.07, 0.08],
      [0.02, 0.1],
      [-0.03, 0.06],
    ];
    const swirl = sdf.chain(
      swirlPts.map(([x, z], i): [number, number, number, number] => [x, domeY(x, z), z, 0.017 - i * 0.0009]),
      0.006,
    );
    const swirls = capPose(hard(swirl)).bone('head');

    // ------------------------------------------------------------------ hair: locks at the nape and the temples under the cap
    const nape = [118, 132, 146, 160, 174, 188, 202, 216, 230, 244].map((a) => {
      const s = surf(a, 0.725, 0.004);
      const m = surf(a, 0.64, 0.016);
      const t = surf(a + (a > 180 ? 4 : -4), 0.56, 0.02);
      return sdf.chain(
        [
          [s[0], s[1], s[2], 0.034],
          [m[0], m[1], m[2], 0.032],
          [t[0], t[1], t[2], 0.016],
        ],
        0.012,
      );
    });
    const temples = [78, 62].map((a) => {
      const s = surf(a, 0.725, 0.004);
      const m = surf(a - 4, 0.66, 0.012);
      const t = surf(a - 10, 0.585, 0.018);
      return sdf.chain(
        [
          [s[0], s[1], s[2], 0.03],
          [m[0], m[1], m[2], 0.026],
          [t[0], t[1], t[2], 0.014],
        ],
        0.01,
      );
    });
    const hair = sdf.smoothUnion(0.012, sdf.union(...nape), hard(sdf.union(...temples)));
    k.body('hair', hair.bone('head'), {
      color: hairColor,
      roughness: 0.6,
      detail: 0.004,
      bump: (x, y, z) => 0.002 * Math.sin((x + z) * 120 + y * 40),
    });

    // ------------------------------------------------------------------ nose and ears (skin tint)
    const nz = h.faceZ(0, 0.585);
    k.body('nose', sdf.ellipsoid([0.043, 0.038, 0.038]).at(0, 0.585, nz + 0.016).bone('head'), { color: skinColor, roughness: 0.55, detail: 0.004 });
    const ears = pair(sdf.ellipsoid([0.034, 0.052, 0.042]).subtract(sdf.sphere(0.02).at(0.02, 0, 0.008)).rotateY(-12).at(0.208, 0.61, -0.01).bone('head'));
    k.body('ears', ears, { color: skinColor, roughness: 0.55, detail: 0.004 });

    // ------------------------------------------------------------------ beard: mustache, jaw, fan of locks, two braids
    const my = 0.558;
    const mz = (x: number, y = my) => h.faceZ(x, y) + 0.005;
    const mustSide = sdf.smoothUnion(
      0.014,
      sdf.capsule([0.0, my, mz(0)], [0.04, my - 0.008, mz(0.04)], 0.019),
      sdf.capsule([0.04, my - 0.008, mz(0.04)], [0.08, my + 0.004, mz(0.08)], 0.017),
      sdf.capsule([0.08, my + 0.004, mz(0.08)], [0.108, my + 0.026, mz(0.105, my + 0.026)], 0.014),
      sdf.sphere(0.014).at(0.112, my + 0.036, mz(0.108, my + 0.036)),
    );
    const mustache = sdf.smoothUnion(0.012, mustSide, mustSide.mirror('x', 0));

    // The jaw: sideburns from the temple down around the cheek to the chin, below the grin.
    const jawPts = [
      [98, 0.65, 0.026],
      [90, 0.6, 0.034],
      [80, 0.54, 0.036],
      [55, 0.475, 0.036],
      [28, 0.455, 0.034],
      [0, 0.45, 0.034],
    ] as const;
    const jawSide = sdf.chain(
      jawPts.map(([a, y, r]): [number, number, number, number] => {
        const p = surf(a, y, r * 0.55);
        return [p[0], p[1], p[2], r];
      }),
      0.02,
    );
    const jaw = sdf.smoothUnion(0.02, jawSide, jawSide.mirror('x', 0));

    // The center fan: five thick locks that swell forward and end in points above the belt.
    const fanLock = (x: number, tip: number) =>
      sdf.chain(
        [
          [x * 0.8, 0.465, 0.12, 0.034],
          [x * 0.95, 0.42, 0.19 - Math.abs(x) * 0.3, 0.04],
          [x * 1.05, (0.42 + tip) / 2, 0.205 - Math.abs(x) * 0.3, 0.036],
          [x * 1.0, tip, 0.205 - Math.abs(x) * 0.25, 0.012],
        ],
        0.014,
      );
    const fan = sdf.smoothUnion(0.012, fanLock(0, 0.36), pair(fanLock(0.045, 0.37)), pair(fanLock(0.088, 0.39)));

    const beard = sdf.smoothUnion(0.02, mustache, jaw, fan);
    k.body('beard', beard.bone('head'), {
      color: hairColor,
      roughness: 0.65,
      detail: 0.004,
      bump: (x, y, z) => 0.003 * Math.sin(x * 230 + Math.sin(y * 40) * 2) * Math.cos(z * 90 + y * 60),
    });

    // The braids: a chain of twisted links from the cheek down in front of the shoulder, ending in a tuft.
    const braidPath: [number, number, number][] = [
      [0.13, 0.52, 0.09],
      [0.126, 0.47, 0.14],
      [0.12, 0.44, 0.17],
      [0.118, 0.4, 0.175],
    ];
    const along = (t: number): [number, number, number] => {
      const f = t * (braidPath.length - 1);
      const i = Math.min(braidPath.length - 2, Math.floor(f));
      return lerp(braidPath[i]!, braidPath[i + 1]!, f - i);
    };
    const links = Array.from({ length: 9 }, (_, i) => {
      const t = i / 8;
      const p = along(t);
      const r = 0.032 - 0.012 * t * t;
      const s = i % 2 === 0 ? 1 : -1;
      return sdf.ellipsoid([r, 0.024, r * 0.95]).rotateZ(26 * s).at(p[0] + 0.009 * s * (1 - 0.5 * t), p[1], p[2]);
    });
    const tuft = sdf.smoothUnion(0.01, sdf.sphere(0.02).at(0.116, 0.385, 0.176), sdf.cone([0.118, 0.395, 0.176], [0.112, 0.35, 0.18], 0.022, 0.006));
    const braid = sdf.smoothUnion(0.006, ...links, tuft);
    k.body('braids', hard(braid).bone('head'), {
      color: hairColor,
      roughness: 0.65,
      detail: 0.004,
      bump: (x, y, z) => 0.002 * Math.sin(x * 160 + y * 120 + z * 40),
    });

    // Gold rings on the braids, and the swirls on the cap.
    const ringAt = along(0.8);
    const ring = hard(sdf.torus(0.03, 0.009).scale([1, 1, 0.95]).at(ringAt[0], ringAt[1], ringAt[2]));
    const ringUp = along(0.3);
    const ring2 = hard(sdf.torus(0.036, 0.007).scale([1, 1, 0.95]).at(ringUp[0], ringUp[1], ringUp[2]));
    k.body('rings', sdf.union(ring, ring2).bone('head'), { color: C.gold, roughness: 0.35, metalness: 0.8, detail: 0.003 });
    k.body('swirls', swirls, { color: C.gold, roughness: 0.35, metalness: 0.8, detail: 0.003 });

    // ------------------------------------------------------------------ tunic: broad, moss green, to mid-thigh, with sleeves
    const tunicBody = h.torso.round(0.014).scale([1.08, 1, 1.0]);
    const flare = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.3],
            [0.14, 0.3],
            [0.158, 0.25],
            [0.17, 0.2],
            [0.18, 0.15],
            [0, 0.15],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.84]);
    const sleeve = h.perArm((j) =>
      sdf.smoothUnion(
        0.018,
        sdf.cone(lerp(SHOULDER, j.ELBOW, -0.12), j.ELBOW, 0.056, 0.052).bone('upperarm.L'),
        sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.9), 0.052, 0.049).bone('forearm.L'),
      ),
    );
    const tunic = sdf
      .smoothUnion(0.016, h.weighted(tunicBody.smoothUnion(0.03, flare).intersect(sdf.halfSpace([0, -1, 0], -0.15))), sleeve)
      .paintWhere(h.band(0.15, 0.162), '#3a5530', 0.004);
    k.body('tunic', tunic, { color: h.tint.shirt ?? '#4a6a3a', roughness: 0.85, bump: (x, y, z) => 0.0015 * Math.sin(x * 140 + y * 20) * Math.cos(z * 120) });

    // ------------------------------------------------------------------ belt, buckle, leather cuffs
    const beltCore = h.torso.round(0.014).scale([1.08, 1, 1.0]).smoothUnion(0.03, flare);
    const beltShape = beltCore.round(0.012).intersect(h.band(0.2, 0.262));
    const cuff = h.perArm((j) => sdf.cone(lerp(j.ELBOW, j.WRIST, 0.6), lerp(j.ELBOW, j.WRIST, 0.96), 0.058, 0.06).round(0.004).bone('forearm.L'));
    const bz = sdf.raycast(beltShape, [0, 0.231, 1], [0, 0, -1])?.[2] ?? 0.16;
    k.body('leather', sdf.union(h.weighted(beltShape), cuff), {
      color: C.belt,
      roughness: 0.7,
      detail: 0.004,
      bump: (x, y, z) => 0.0015 * Math.sin(x * 90 + z * 70) * Math.cos(y * 100),
    });
    const buckleFrame = sdf.box([0.1, 0.07, 0.022], 0.008).subtract(sdf.box([0.068, 0.04, 0.05], 0.004));
    const prong = sdf.box([0.012, 0.045, 0.014], 0.004).at(0.012, 0, 0);
    const studs = sdf.union(
      ...[-0.1, -0.075, 0.075, 0.1].map((x) => {
        const z = sdf.raycast(beltShape, [x, 0.231, 1], [0, 0, -1])?.[2] ?? bz - 0.01;
        return sdf.sphere(0.0105).at(x, 0.231, z + 0.001);
      }),
    );
    k.body('buckle', sdf.union(sdf.union(buckleFrame, prong).at(0, 0.231, bz + 0.003), studs).bone('hips'), {
      color: C.gold,
      roughness: 0.35,
      metalness: 0.8,
      detail: 0.003,
    });

    // ------------------------------------------------------------------ trousers and heavy boots with steel toe caps
    const trouserLeg = sdf.smoothUnion(
      0.012,
      sdf.capsule(HIP, KNEE, 0.056).bone('leg.L'),
      sdf.cone(KNEE, [ANKLE[0], 0.1, 0.002], 0.054, 0.052).bone('shin.L'),
    );
    k.body('trousers', sdf.smoothUnion(0.03, sdf.ellipsoid([0.125, 0.056, 0.092]).at(0, 0.2, 0).bone('hips'), pair(trouserLeg)), {
      color: C.pants,
      roughness: 0.85,
    });
    const boot = sdf
      .smoothUnion(0.025, sdf.ellipsoid([0.064, 0.05, 0.108]).at(0, 0.048, 0.04), sdf.sphere(0.058).at(0, 0.06, -0.005), sdf.cylinder(0.056, 0.05, 0.012).at(0, 0.085, 0))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const toeCap = boot
      .round(0.005)
      .intersect(sdf.halfSpace([0, 0, -1], -0.1))
      .intersect(sdf.halfSpace([0, 1, 0], 0.062));
    const place = (s: sdf.Shape) => s.rotateY(12).at(ANKLE[0], 0, 0).bone('foot.L');
    k.body('boots', pair(place(boot)), { color: C.boot, roughness: 0.55 });
    k.body('toecaps', pair(place(toeCap)), { color: C.steel, roughness: 0.35, metalness: 0.8, detail: 0.004 });

    // ------------------------------------------------------------------ the gem (right fist, x < 0), held up
    const gR = h.arms.R.GRIP;
    const gx = -gR[0];
    const facets = [
      [0, 1, 0],
      [0.9, 0.5, 0.2],
      [-0.8, 0.6, 0.4],
      [0.3, 0.6, 0.9],
      [-0.4, 0.5, -0.9],
      [0.6, 0.4, -0.7],
      [0.95, -0.2, -0.2],
      [-0.95, -0.1, 0.1],
      [0.2, -0.5, 0.9],
      [-0.3, -0.6, -0.8],
      [0.5, -0.9, 0.1],
      [0, 0.2, 1],
      [0.1, 0.1, -1],
    ].map((n) => {
      const l = Math.hypot(n[0]!, n[1]!, n[2]!);
      return sdf.halfSpace([n[0]! / l, n[1]! / l, n[2]! / l], 0.042);
    });
    const gemShape = facets.reduce((acc, f) => acc.intersect(f), sdf.sphere(0.065));
    const gem = gemShape
      .scale([1, 1.15, 1]).at(gx, gR[1] + 0.058, gR[2] + 0.01)
      .paintFn((x, y, z, c): Rgb => {
        const v = 0.78 + 0.5 * Math.abs(Math.sin(x * 190 + y * 130 + z * 110));
        return [Math.min(1, c[0] * v), Math.min(1, c[1] * (0.85 + 0.3 * v)), Math.min(1, c[2] * (0.85 + 0.25 * v))];
      })
      .bone('knife.R');
    k.body('gem', gem, { color: C.gem, roughness: 0.15, metalness: 0.1, flat: true, detail: 0.003 });

    // ------------------------------------------------------------------ the hammer (left fist, x > 0)
    const gL = h.arms.L.GRIP;
    const ang = (25 * Math.PI) / 180;
    const d: [number, number, number] = [0, Math.sin(ang), Math.cos(ang)];
    const at = (t: number): [number, number, number] => [gL[0], gL[1] + d[1] * t, gL[2] + d[2] * t];
    const handleShape = sdf.smoothUnion(
      0.006,
      sdf.capsule(at(-0.04), at(0.1), 0.021),
      sdf.sphere(0.024).at(...at(-0.04)),
    );
    k.body('hammer-handle', handleShape.bone('knife.L'), { color: C.handle, roughness: 0.75, detail: 0.003 });
    const headC = at(0.112);
    const hammerHead = sdf
      .box([0.1, 0.065, 0.065], 0.01)
      .rotateX(90 - 25)
      .at(...headC);
    k.body('hammer-head', hammerHead.bone('knife.L'), { color: C.steel, roughness: 0.35, metalness: 0.8, detail: 0.003 });
  },
});

export default scaleAsset(base, 0.9);
