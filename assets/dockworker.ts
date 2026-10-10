import { noise, profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Dockworker — Chibi Quest wilderness NPC (catalog `npcs/wilderness/dockworker`), about 1.0 m to the
 * top of the knit cap, faces +Z. Target: docs/npc-mockups/dockworker_001.jpg. Built on the humanoid kind.
 *
 * Role: a harbor NPC who loads ships and gives delivery quests; 3D and a 128 px sprite. The red cap,
 *   the big bearded grin, and the wooden crate with rope handles must read.
 * One idea: a broad, cheerful stevedore: a red knit cap over a big brown beard, a blue-white striped
 *   chest, and a crate hugged in both fists.
 * Shape language: round and soft (cap, beard, nose, boots), with the boxy crate as the one hard form.
 * Palette (60/30/10): shirt #f0ece4 with #2a4a7a stripes; trousers #6a6870; boots #2a2428; cap #b03a3a
 *   (the accent); beard and hair #5a3a24; suspenders #6b4226; crate #a8784a, #7a5a3a, rope #c8a870.
 * Value plan: the dark beard against the pale face and shirt is the focal point; the red cap on top and
 *   the mid-brown crate frame it; gray trousers and black boots anchor the base.
 * Bodies: skin, cap, hair, beard, nose, ears, shirt, cuffs, suspenders, trousers, boots, crate, frame, rope.
 * Rig: the humanoid kind's skeleton and clips with a two-hand `hold`; the crate is rigid on `hand.R`.
 */

// The two-hand hold (left arm; the right mirrors it): elbows bent, fists on the crate sides.
const HOLD_ELBOW = [0.158, 0.325, 0.03] as const;
const HOLD_WRIST = [0.163, 0.298, 0.125] as const;
// The crate: size and center.
const CRATE = { w: 0.24, h: 0.17, d: 0.16, y: 0.3, z: 0.2 };

const C = {
  shirt: '#f0ece4',
  cuff: '#e6e0d2',
  cap: '#b03a3a',
  capCuff: '#9a2e30',
  hair: '#5a3a24',
  strap: '#6b4226',
  pants: '#6a6870',
  pantsRoll: '#7e7c86',
  boot: '#2a2428',
  sole: '#161214',
  wood: '#a8784a',
  frame: '#7a5a3a',
  rope: '#c8a870',
  mouth: '#7a2a28',
  tongue: '#d8706a',
  teeth: '#fbf6ee',
};

export default humanoidAsset({
  name: 'dockworker',
  description: 'A big, cheerful dockworker in a red knit cap and a striped shirt, carrying a wooden crate in both arms.',
  reference: 'docs/npc-mockups/dockworker_001.jpg',
  variants: {
    skin: { tan: '#d49a72', fair: '#f2c7a4', light: '#e8b48e', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { brown: '#5a3a24', black: '#231a17', auburn: '#8e3b1c', blond: '#c4974a', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { navy: '#2a4a7a', brick: '#8a3a32', pine: '#2f5a42', ochre: '#b0803a' },
  },
  presets: {
    redhead: { skin: 'fair', hair: 'auburn', eyes: 'green', cloth: 'pine' },
  },
  lashes: false,
  hair: false,
  undershirt: false,
  pants: false,
  shoes: false,
  hold: { elbow: HOLD_ELBOW, wrist: HOLD_WRIST },

  // A big toothy grin with round corners and one white tooth band, thick arched brows, and painted-out
  // default brows. The beard body carries a hole where the mouth is.
  paintSkin(skin, h) {
    const y = 0.53;
    const grin = profile.polygon(
      [
        [-0.06, 0.013],
        [-0.032, 0.004],
        [0, 0.0],
        [0.032, 0.004],
        [0.06, 0.013],
        [0.05, -0.012],
        [0.025, -0.03],
        [0, -0.036],
        [-0.025, -0.03],
        [-0.05, -0.012],
      ],
      { smooth: true, samples: 6 },
    );
    const mouth = h.onFace(sdf.extrude(grin, 0.3), 0, y);
    const teeth = mouth.intersect(sdf.halfSpace([0, -1, 0], -(y - 0.006))).intersect(sdf.box([0.066, 0.1, 1]).at(0, y, 0));
    const tongue = h.onFace(sdf.ellipsoid([0.026, 0.013, 0.08]), 0, y - 0.03);
    const oldBrows = sdf.extrude(profile.arc(0.1, 0.036, 54, 126), 0.3).at(0.1, 0.622, 0.1).mirror('x');
    const brows = sdf.extrude(profile.arc(0.085, 0.022, 52, 122), 0.3).at(0.1, 0.645, 0.1).mirror('x');
    return skin
      .paintWhere(oldBrows, h.tint.skin!, 0.002)
      .paintWhere(brows, h.tint.brow!, 0.002)
      .paintWhere(mouth, C.mouth)
      .paintWhere(tongue.intersect(mouth), C.tongue, 0.004)
      .paintWhere(teeth, C.teeth, 0.002);
  },

  extra(k, h) {
    const { SHOULDER, ELBOW, WRIST, HIP, KNEE, ANKLE, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const rad = Math.PI / 180;
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];
    const hairColor = k.tint('hair');
    // A broad stevedore: the chest and the shoulders are wider than the standard torso.
    const bigTorso = h.torso.scale([1.2, 1, 1.08]);
    const headPose = (s: sdf.Shape) => s.at(0, HEAD_Y, 0);

    // ------------------------------------------------------------------ the red knit cap
    const capPose = (s: sdf.Shape) => s.rotateX(-8).at(0, HEAD_Y, 0);
    const dome = sdf.ellipsoid([0.215, 0.225, 0.205]).at(0, 0.08, -0.01).intersect(sdf.halfSpace([0, -1, 0], -0.07));
    const slouch = sdf.ellipsoid([0.12, 0.09, 0.11]).at(-0.05, 0.2, -0.07);
    const cuffShape = sdf.torus(0.203, 0.04).scale([1, 1, 0.96]).at(0, 0.098, -0.005);
    const cap = capPose(sdf.smoothUnion(0.045, dome, slouch).smoothUnion(0.006, cuffShape).paintWhere(cuffShape.round(0.002), C.capCuff, 0.004)).bone('head');
    const rib = (x: number, _y: number, z: number) => 0.003 * Math.sin(Math.atan2(x, z) * 52);
    k.body('cap', cap, { color: C.cap, roughness: 0.92, detail: 0.005, bump: rib });

    // ------------------------------------------------------------------ hair: a small cap and separate locks
    const skullPt = (aDeg: number, y: number, s: number): [number, number] => {
      const f = Math.sqrt(Math.max(0, 1 - (y / 0.2) ** 2));
      return [0.205 * f * Math.sin(aDeg * rad) * s, 0.19 * f * Math.cos(aDeg * rad) * s];
    };
    const lock = (a: number, y0: number, len: number, r: number) => {
      const p0 = skullPt(a, y0, 1.0);
      const p1 = skullPt(a, y0 - len * 0.5, 1.07);
      const p2 = skullPt(a, y0 - len, 1.05);
      return sdf.chain(
        [
          [p0[0], y0, p0[1], r],
          [p1[0], y0 - len * 0.5, p1[1], r * 0.85],
          [p2[0], y0 - len, p2[1], r * 0.55],
        ],
        0.016,
      );
    };
    const skullCap = sdf
      .ellipsoid([0.205 * 1.03, 0.2 * 1.03, 0.19 * 1.03])
      .smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], 0.1))
      .smoothIntersect(0.03, sdf.halfSpace([0, 0, 1], 0.03))
      .smoothIntersect(0.02, sdf.union(sdf.box([1, 0.11, 1]).at(0, 0.045, 0), sdf.box([1, 0.11, 0.2]).at(0, -0.06, -0.19)));
    const sideLocks = [62, 82, 100, 118].flatMap((a) => [a, -a]).map((a) => lock(a, 0.075, a === 62 || a === -62 ? 0.1 : 0.085, 0.024));
    const backLocks = [135, 155, 180, -155, -135]
      .flatMap((a) => [lock(a, 0.055, 0.15, 0.027), lock(a + (a > 0 ? -9 : 9), 0.0, 0.1, 0.025)]);
    const fringe = ([] as number[]).map((x) => {
      const z = h.faceZ(Math.abs(x), 0.745);
      return sdf.chain(
        [
          [x, 0.075 + 0.02, z - 0.025, 0.02],
          [x * 1.05, 0.075 + 0.0, z - 0.004, 0.018],
          [x * 1.08, 0.075 - 0.012, z + 0.004, 0.012],
        ],
        0.008,
      );
    });
    const hairShape = headPose(sdf.smoothUnion(0.012, skullCap, ...sideLocks, ...backLocks, ...fringe)).bone('head');
    k.body('hair', hairShape, { color: hairColor, roughness: 0.65, detail: 0.005 });

    // ------------------------------------------------------------------ the beard, the mustache, the nose, the ears
    const grinHole = h.onFace(
      sdf.extrude(
        profile.polygon(
          [
            [-0.06, 0.013],
            [-0.032, 0.004],
            [0, 0.0],
            [0.032, 0.004],
            [0.06, 0.013],
            [0.05, -0.012],
            [0.025, -0.03],
            [0, -0.036],
            [-0.025, -0.03],
            [-0.05, -0.012],
          ],
          { smooth: true, samples: 6 },
        ),
        0.3,
      ),
      0,
      0.53,
    ).round(0.005);
    const jaw = sdf.smoothUnion(0.03, h.head.round(0.016), sdf.ellipsoid([0.1, 0.055, 0.08]).at(0, 0.5, 0.045));
    const beardKeep = sdf.union(
      sdf.halfSpace([0, 1, 0], 0.548),
      sdf.chain([[0.19, 0.645, 0.03, 0.026], [0.182, 0.6, 0.045, 0.026], [0.172, 0.55, 0.055, 0.03]], 0.02).mirror('x', 0), // the sideburns, blended into the temple hair
    );
    // A sloped back edge: the beard starts at the ear and runs back along the jawline under the chin.
    const beardZ = sdf.halfSpace([0, 0.45, -0.9], 0.2).intersect(sdf.halfSpace([0, 0, 1], 1));
    const lowerBeard = jaw.smoothIntersect(0.02, beardKeep).smoothIntersect(0.03, beardZ);
    const stache = pair(
      sdf.chain(
        [
          [0.008, 0.555, h.faceZ(0.008, 0.555) + 0.004, 0.017],
          [0.04, 0.557, h.faceZ(0.04, 0.557) + 0.004, 0.017],
          [0.07, 0.55, h.faceZ(0.07, 0.55) + 0.002, 0.014],
        ],
        0.008,
      ),
    );
    const beard = sdf.smoothUnion(0.012, lowerBeard, stache).subtract(grinHole).bone('head');
    k.body('beard', beard, {
      color: hairColor,
      roughness: 0.75,
      detail: 0.005,
      bump: (x, y, z) => 0.003 * noise.fbm(x * 90, y * 90, z * 90, 2),
    });

    const noseZ = h.faceZ(0, 0.572);
    const nose = sdf.ellipsoid([0.031, 0.028, 0.03]).at(0, 0.572, noseZ + 0.006).bone('head');
    const ears = pair(
      sdf
        .ellipsoid([0.034, 0.055, 0.04])
        .subtract(sdf.sphere(0.021).at(0.02, 0, 0.008))
        .rotateY(-12)
        .at(0.205, 0.608, -0.01)
        .bone('head'),
    );
    k.body('nose', sdf.smoothUnion(0.008, nose, ears), { color: h.tint.skin!, roughness: 0.55, detail: 0.004 });

    // ------------------------------------------------------------------ shirt: stripes, a collar, rolled sleeves
    const upper = sdf
      .smoothUnion(
        0.03,
        sdf.cone(lerp(SHOULDER, ELBOW, -0.1), ELBOW, 0.062, 0.054),
        sdf.ellipsoid([0.08, 0.065, 0.075]).at(SHOULDER[0] + 0.012, SHOULDER[1] - 0.012, 0),
      )
      .bone('upperarm.L');
    const foreEnd = lerp(ELBOW, WRIST, 0.5);
    const fore = sdf.cone(ELBOW, foreEnd, 0.054, 0.05).bone('forearm.L');
    const sleeve = sdf.smoothUnion(0.015, upper, fore);
    const stripes = sdf.union(...[0.45, 0.41, 0.37, 0.33, 0.29].map((yc) => h.band(yc - 0.011, yc + 0.011))).intersect(sdf.halfSpace([0, -1, 0], -0.34));
    const shirt = sdf.smoothUnion(0.014, h.weighted(bigTorso.round(0.01)), pair(sleeve)).paintWhere(stripes, h.tint.shirt!, 0.002);
    k.body('shirt', shirt, { color: C.shirt, roughness: 0.88 });

    // The rolled cuffs, the collar.
    const rollCuff = sdf.cone(lerp(ELBOW, WRIST, 0.38), lerp(ELBOW, WRIST, 0.62), 0.06, 0.06).round(0.004).bone('forearm.L');
    const collar = sdf.torus(0.076, 0.02).at(0, 0.454, -0.012).bone('chest');
    k.body('cuffs', sdf.union(pair(rollCuff), collar), { color: C.cuff, roughness: 0.9, detail: 0.004 });

    // Suspenders: two straps over the shoulders to the trouser waist.
    const shell = bigTorso.round(0.024).subtract(bigTorso.round(0.012));
    const strap = shell
      .intersect(sdf.box([0.036, 0.5, 0.6]).at(0.085, 0.4, 0))
      .intersect(sdf.halfSpace([0, -1, 0], -0.262))
      .intersect(sdf.halfSpace([0, 1, 0], 0.462))
      .bone('chest');
    k.body('suspenders', pair(strap), { color: C.strap, roughness: 0.75, detail: 0.004 });

    // ------------------------------------------------------------------ baggy trousers, rolled cuffs, black boots
    const waist = h.weighted(h.torso.scale([1.12, 1, 1.06]).round(0.02).smoothIntersect(0.015, sdf.halfSpace([0, 1, 0], 0.275)));
    const trouserLeg = sdf.smoothUnion(
      0.014,
      sdf.capsule(HIP, KNEE, 0.063).bone('leg.L'),
      sdf.cone(KNEE, [ANKLE[0], 0.13, 0.002], 0.061, 0.058).bone('shin.L'),
    );
    const crotch = sdf.ellipsoid([0.125, 0.06, 0.095]).at(0, 0.18, 0).bone('hips');
    k.body('pants', sdf.smoothUnion(0.03, waist, crotch, pair(trouserLeg)), { color: C.pants, roughness: 0.9 });
    const roll = sdf.cylinder(0.069, 0.034, 0.014).at(ANKLE[0], 0.118, 0.002).bone('shin.L');
    k.body('cuffRoll', pair(roll), { color: C.pantsRoll, roughness: 0.9, detail: 0.004 });

    const bootBody = sdf
      .smoothUnion(
        0.026,
        sdf.cylinder(0.057, 0.09, 0.015).at(0, 0.075, 0),
        sdf.ellipsoid([0.064, 0.052, 0.112]).at(0, 0.048, 0.04),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const sole = bootBody.round(0.004).intersect(sdf.halfSpace([0, 1, 0], 0.017)).intersect(sdf.halfSpace([0, -1, 0], 0));
    const boot = sdf.union(bootBody, sole.paint(C.sole)).rotateY(10).at(ANKLE[0], 0, 0).bone('foot.L');
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.5 });

    // ------------------------------------------------------------------ the crate with rope handles
    const { w, h: ch, d, y: cy, z: cz } = CRATE;
    const slatH = 0.03;
    const slatGap = (ch - 5 * slatH) / 4;
    const slats = sdf.union(
      ...[0, 1, 2, 3, 4].map((i) =>
        sdf.box([w + 0.006, slatH, d + 0.006], 0.006).at(0, cy - ch / 2 + slatH / 2 + i * (slatH + slatGap), cz),
      ),
    );
    const bumpWood = (x: number, y: number, z: number) => 0.0018 * Math.sin(x * 70 + Math.sin(z * 30) + y * 8);
    k.body('crate', slats.bone('hand.R'), { color: C.wood, roughness: 0.8, detail: 0.004, bump: bumpWood });
    const core = sdf.box([w - 0.004, ch, d - 0.004], 0.004).at(0, cy, cz);
    const posts = sdf.union(
      ...[1, -1].flatMap((sx) =>
        [1, -1].map((sz) => sdf.box([0.034, ch + 0.01, 0.034], 0.007).at(sx * (w / 2 - 0.004), cy, cz + sz * (d / 2 - 0.004))),
      ),
    );
    k.body('crateFrame', sdf.union(core, posts).bone('hand.R'), { color: C.frame, roughness: 0.85, detail: 0.004 });
    // Loose rope: a line from each fist and three coils that hang below it.
    const coil = (sx: number) => {
      const x = sx * (w / 2 + 0.036);
      const rings = [0, 55, 110].map((a, i) =>
        sdf.torus(0.03, 0.0095).rotateZ(90).scale([1, 1.5, 1]).rotateY(a).at(x + sx * i * 0.004, 0.205 - i * 0.007, cz - 0.03 + i * 0.008),
      );
      const line = sdf.chain(
        [
          [sx * (w / 2 + 0.012), cy - 0.01, cz - 0.06, 0.0095],
          [x, 0.262, cz - 0.04, 0.0095],
          [x, 0.24, cz - 0.03, 0.0095],
        ],
        0.008,
      );
      return sdf.smoothUnion(0.006, line, ...rings);
    };
    k.body('rope', sdf.union(coil(1), coil(-1)).bone('hand.R'), {
      color: C.rope,
      roughness: 0.95,
      detail: 0.004,
      bump: (x, y, z) => 0.0025 * Math.sin((y + z) * 140),
    });
  },
});
