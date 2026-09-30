import { defineAsset, motion, noise, profile, sdf, THREE } from '../src/index.js';

/**
 * Cult leader — Chibi Quest enemy (catalog `enemies/humanoid/cult-leader`), the master of the
 * cultists, about 1.0 m to the tip of the mask crest, faces +Z. Target:
 * docs/enemy-mockups/cult-leader_001.jpg (one front view; the ears are round human ears here).
 * Built on the cultist (the mage rig with knee bones, the enemy clip set, a dagger and a candle).
 *
 * Role: an elite caster of the Sunken Vault; seen in 3D and as a 128 px sprite, the gold horned
 *   mask and the long grey beard read first.
 * One idea: a small bald priest in a tall golden horned mask, with a huge grey moustache and beard,
 *   a crimson cape, a dagger held up in one fist and a black candle on a gold dish in the other.
 * Proportions: the rogue's body (shoulders 0.385, belt 0.27); the head is big (skull 0.31 m wide,
 *   centre at 0.70); the crest tops the figure at about 1.0 m; the hands are raised at the chest.
 * Shape language: soft and round (skull, beard, robe), with sharp gold accents (crest, horns).
 * Palette (60/30/10): black robe #2a2628 and crimson cape #8a2a26; gold #d8b040 is the accent on
 *   the mask, the trim, the medallion, the cuffs, the holder; grey beard #9a9a94.
 * Value plan: the bright gold mask sits on the pale head above the dark robe; the gold columns and
 *   the medallion lead the eye down the robe.
 * Bodies: head (skin), eyes, mask, gem, beard, robe, cape, trim, medallion, belt, plate, hands, legs,
 *   shoes, blade, hilt, guard, candle-wax, candle-holder, candle-flame.
 * Rig: the cultist's skeleton; the dagger is rigid on `dagger` (a child of `hand.R`), the candle on
 *   `candle` (a child of `hand.L`), the flame on `flame` (it flickers by scale).
 *   Clips: idle, walk, run, attack (a raise and a stab), hit, death, taunt (the candle raised).
 */

const C = {
  skin: '#f0d8c8',
  ear: '#e8c8b8',
  robe: '#2a2628',
  robeLit: '#3a3438',
  trim: '#d8b040',
  gem: '#2a2a30',
  hole: '#16141a',
  legs: '#2a2226',
  shoe: '#16141a',
  belt: '#5a3a26',
  steel: '#8a8c92',
  blade: '#6e7076',
  bladeEdge: '#b8bcc4',
  grip: '#2a2628',
  wax: '#1c1a1e',
  flame: '#ff6a30',
  flameBase: '#7a2a10',
};

type V3 = readonly [number, number, number];

const pair = (s: sdf.Shape) => s.mirror('x');
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const add = (a: V3, b: V3, s = 1): V3 => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};

// Joints: both forearms raised in front of the chest, the fists at x = +-0.26 (as in the mockup).
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW_L: V3 = [0.215, 0.32, 0.02];
const WRIST_L: V3 = [0.25, 0.385, 0.075];
const ELBOW_R = mx(ELBOW_L);
const WRIST_R = mx(WRIST_L);
const HIP: V3 = [0.068, 0.195, 0];
const ANKLE: V3 = [0.098, 0.07, 0];
const KNEE: V3 = [0.083, 0.1325, 0];
const SOLE_HEEL: V3 = [0.093, 0, -0.024];
const SOLE_TOE: V3 = [0.108, 0, 0.08];
// The left fist's centre (the candle stands through it); the dagger's grip is its mirror.
const GRIP: V3 = add(WRIST_L, norm(add(WRIST_L, ELBOW_L, -1)), 0.036);
const CANDLE_TOP = GRIP[1] + 0.155;
const FLAME_AT: V3 = [GRIP[0], CANDLE_TOP + 0.008, GRIP[2]];
const HEAD_C: V3 = [0, 0.7, 0];
const UP: V3 = [0, 1, 0];
const FWD: V3 = [0, 0, 1];

/** A fist around the grip point `g`; `s` mirrors it for the right hand. The grip runs along Y. */
const fistAt = (g: V3, s: 1 | -1) => {
  const o = (dx: number, dy: number, dz: number): V3 => [g[0] + dx * s, g[1] + dy, g[2] + dz];
  const fingers = [-0.026, -0.009, 0.008, 0.025].map((dy) => sdf.capsule(o(-0.026, dy, 0.03), o(0.026, dy, 0.03), 0.0105));
  const thumb = sdf.capsule(o(-0.032, 0.012, 0.018), o(-0.01, 0.03, 0.038), 0.012);
  return sdf.smoothUnion(0.007, sdf.ellipsoid([0.038, 0.044, 0.04]).at(...g), ...fingers, thumb);
};

export default defineAsset({
  name: 'cult-leader',
  description: 'Chibi cult leader dungeon enemy: a bald priest in a tall golden horned mask with a crest and a gem, a big grey moustache and beard, a crimson cape with a raised collar over a black robe with gold trim, an eye medallion, a raised dagger, and a black candle on a gold dish.',
  detail: 0.006,
  reference: 'docs/enemy-mockups/cult-leader_001.jpg',
  variants: {
    cape: { crimson: '#8a2a26', purple: '#4a2a5a', black: '#1e1c22' },
    mask: { gold: '#d8b040', silver: '#c0c4c8', bronze: '#a06a30' },
    beard: { grey: '#9a9a94', white: '#d8d4c8', black: '#24201c' },
  },
  presets: {
    'high-priest': { cape: 'crimson', mask: 'gold', beard: 'grey' },
    'void-seer': { cape: 'purple', mask: 'silver', beard: 'white' },
    'ash-prophet': { cape: 'black', mask: 'bronze', beard: 'black' },
  },

  build(k) {
    const T = {
      cape: k.tint('cape'),
      capeLit: k.tint('cape', 0.1),
      capeDark: k.tint('cape', -0.25),
      mask: k.tint('mask'),
      maskLit: k.tint('mask', 0.25),
      maskDark: k.tint('mask', -0.3),
      beard: k.tint('beard'),
      beardLit: k.tint('beard', 0.08),
      beardDark: k.tint('beard', -0.18),
    };
    // ------------------------------------------------------------------ skeleton
    k.skeleton({
      hips: { at: [0, 0.2, 0] },
      spine: { parent: 'hips', at: [0, 0.26, 0] },
      chest: { parent: 'spine', at: [0, 0.33, 0] },
      neck: { parent: 'chest', at: [0, 0.43, -0.01] },
      head: { parent: 'neck', at: [0, 0.48, -0.01] },
      'upperarm.L': { parent: 'chest', at: SHOULDER },
      'forearm.L': { parent: 'upperarm.L', at: ELBOW_L },
      'hand.L': { parent: 'forearm.L', at: WRIST_L },
      candle: { parent: 'hand.L', at: GRIP },
      flame: { parent: 'candle', at: FLAME_AT },
      'upperarm.R': { parent: 'chest', at: mx(SHOULDER) },
      'forearm.R': { parent: 'upperarm.R', at: ELBOW_R },
      'hand.R': { parent: 'forearm.R', at: WRIST_R },
      dagger: { parent: 'hand.R', at: mx(GRIP) },
      'leg.L': { parent: 'hips', at: HIP },
      'shin.L': { parent: 'leg.L', at: KNEE, split: 0.015 },
      'foot.L': { parent: 'shin.L', at: ANKLE },
      'leg.R': { parent: 'hips', at: mx(HIP) },
      'shin.R': { parent: 'leg.R', at: mx(KNEE), split: 0.015 },
      'foot.R': { parent: 'shin.R', at: mx(ANKLE) },
    });

    // ------------------------------------------------------------------ the head: a bald skull, round ears
    const skull = sdf.ellipsoid([0.155, 0.165, 0.15]).at(...HEAD_C);
    const jaw = sdf.ellipsoid([0.125, 0.09, 0.125]).at(0, 0.6, 0.012);
    const neck = sdf.capsule([0, 0.47, 0], [0, 0.6, 0], 0.06);
    const ear = sdf.ellipsoid([0.026, 0.045, 0.034]).rotateZ(-6).at(0.157, 0.693, -0.03);
    const head = sdf
      .smoothUnion(0.03, skull, jaw, neck)
      .smoothUnion(0.008, pair(ear))
      .paintWhere(pair(ear.round(0.003)), C.ear, 0.004)
      .bone('head');
    k.body('skin', head, { color: C.skin, roughness: 0.55, detail: 0.004, textureDensity: 2 });
    const faceZ = (x: number, y: number) => sdf.raycast(skull, [x, y, 1], [0, 0, -1])![2];
    const EYE = [0.064, 0.7] as const;
    // Two round black eyes; they show through the round holes of the mask.
    k.body('eyes', pair(sdf.sphere(0.028).at(EYE[0], EYE[1], faceZ(EYE[0], EYE[1]) - 0.002)), {
      bone: 'head',
      color: C.hole,
      roughness: 0.25,
      detail: 0.004,
    });

    // ------------------------------------------------------------------ the golden mask
    const outer = sdf.ellipsoid([0.169, 0.179, 0.164]).at(...HEAD_C);
    const capShell = outer
      .subtract(skull.round(0.004))
      .intersect(sdf.halfSpace([0, -1, 0], -0.635)) // cut below the nose line
      .intersect(sdf.halfSpace([0, -0.41, -0.912], -0.342)) // cut behind the temples: the back of the skull stays bare
      .subtract(pair(sdf.sphere(0.033).at(EYE[0], EYE[1], faceZ(EYE[0], EYE[1]) + 0.012)))
      .subtract(sdf.torus(0.167, 0.004).scale([1, 1, 0.975]).at(0, 0.742, 0)); // the groove under the brow ridge
    // The brow band: a torus segment across the forehead, blended into the cap.
    const browRidge = sdf
      .torus(0.158, 0.009)
      .scale([1, 1, 0.97])
      .at(0, 0.762, 0)
      .intersect(sdf.halfSpace([0, 0, -1], 0.0));
    const noseTop = sdf.raycast(outer, [0, 0.7, 1], [0, 0, -1])![2];
    // The nose ridge: a rounded strip down the centre from the brow to the beak, following the cap.
    const noseRidge = sdf
      .box([0.02, 0.15, 0.2], 0.008)
      .at(0, 0.665, 0.1 + noseTop * 0.0)
      .intersect(outer.round(0.008));
    const CREST_AT: V3 = [0, 0.8, 0.118];
    const crest = sdf
      .extrude(
        profile.polygon([
          [-0.137, -0.03],
          [-0.112, 0.045],
          [-0.055, 0.12],
          [0, 0.205],
          [0.055, 0.12],
          [0.112, 0.045],
          [0.137, -0.03],
        ]),
        0.045,
        0.008,
      )
      .rotateX(-10)
      .at(...CREST_AT);
    const beak = sdf.cone([0, 0.645, 0.142], [0, 0.585, 0.17], 0.026, 0.008);
    // The cheek plates flare out 0.01 m at the jaw line.
    const plates = pair(sdf.box([0.016, 0.085, 0.066], 0.006).rotateY(-17).rotateZ(14).at(0.15, 0.652, 0.045));
    const horns = pair(
      sdf.chain(
        [
          [0.115, 0.795, 0.07, 0.03],
          [0.176, 0.865, 0.055, 0.021],
          [0.146, 0.945, 0.04, 0.008],
        ],
        0.02,
      ),
    );
    const mask = sdf
      .smoothUnion(0.014, capShell, crest, beak)
      .smoothUnion(0.006, browRidge)
      .smoothUnion(0.008, noseRidge)
      .smoothUnion(0.008, plates, horns)
      .paintWhere(sdf.box([0.5, 0.3, 0.5]).at(0, 0.99, 0.1), T.maskLit, 0.05)
      .paintWhere(sdf.box([0.7, 0.014, 0.7]).at(0, 0.641, 0.3), T.maskDark, 0.005)
      .paintWhere(sdf.box([0.7, 0.01, 0.7]).at(0, 0.742, 0.3), T.maskDark, 0.004)
      .paintWhere(pair(sdf.sphere(0.041).at(EYE[0], EYE[1], faceZ(EYE[0], EYE[1]) + 0.012)), T.maskDark, 0.004);
    k.body('mask', mask.bone('head'), { color: T.mask, roughness: 0.35, metalness: 0.8, detail: 0.004, textureDensity: 2 });
    const crestZ = sdf.raycast(crest, [0, 0.9, 1], [0, 0, -1])![2];
    k.body('gem', sdf.ellipsoid([0.02, 0.033, 0.011]).rotateX(-10).at(0, 0.9, crestZ - 0.004), {
      bone: 'head',
      color: C.gem,
      roughness: 0.25,
      metalness: 0.3,
      detail: 0.003,
    });

    // ------------------------------------------------------------------ the moustache and the long beard
    // The moustache: two separate lobes 0.01 m in front of the beard that sweep out and droop.
    const stache = pair(
      sdf.chain(
        [
          [0.01, 0.618, 0.17, 0.038],
          [0.062, 0.606, 0.178, 0.043],
          [0.112, 0.585, 0.158, 0.037],
          [0.148, 0.553, 0.12, 0.026],
          [0.157, 0.523, 0.09, 0.013],
        ],
        0.02,
      ),
    );
    // The beard: a rounded bib that narrows to a point, with six strand lobes on its front.
    const bib = sdf
      .extrude(
        profile.polygon(
          [
            [-0.1, 0.61],
            [-0.105, 0.55],
            [-0.085, 0.49],
            [-0.05, 0.435],
            [0, 0.395],
            [0.05, 0.435],
            [0.085, 0.49],
            [0.105, 0.55],
            [0.1, 0.61],
          ],
          { smooth: true, samples: 6 },
        ),
        0.08,
        0.03,
      )
      .at(0, 0, 0.125);
    const strands = [-0.066, -0.04, -0.013, 0.013, 0.04, 0.066].map((x) => {
      const top = 0.57 - 0.03 * (1 - Math.abs(x) / 0.066);
      return sdf.capsule([x, top, 0.16], [x * 0.55, top - 0.12, 0.167], 0.014);
    });
    const chinFill = sdf.chain(
      [
        [0, 0.605, 0.11, 0.075],
        [0, 0.565, 0.125, 0.07],
      ],
      0.03,
    );
    const beard = sdf
      .smoothUnion(0.01, bib, ...strands, chinFill)
      .smoothUnion(0.004, stache)
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.46), T.beardDark, 0.03)
      .bone('head');
    k.body('beard', beard, {
      color: T.beard,
      roughness: 0.9,
      detail: 0.004,
      bump: (x, y, z) => 0.0025 * Math.sin(x * 230 + 2.5 * noise.noise3(x * 25, y * 8, z * 25)) + 0.0015 * noise.fbm(x * 100, y * 14, z * 100, 2),
    });

    // ------------------------------------------------------------------ the robe: black, sleeves
    const robeShape = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.47],
            [0.07, 0.465],
            [0.105, 0.44],
            [0.125, 0.4],
            [0.13, 0.34],
            [0.135, 0.29],
            [0.15, 0.22],
            [0.172, 0.16],
            [0.192, 0.115],
            [0.203, 0.095],
            [0.195, 0.085],
            [0, 0.085],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.82]);
    const sleeve = (s: V3, e: V3, w: V3, up: string, fore: string) =>
      sdf.smoothUnion(0.015, sdf.cone([s[0] * 0.85, 0.405, 0], e, 0.05, 0.053).bone(up), sdf.cone(e, lerp(e, w, 0.7), 0.053, 0.056).bone(fore));
    const robe = sdf
      .union(
        robeShape.bone('spine'),
        sleeve(SHOULDER, ELBOW_L, WRIST_L, 'upperarm.L', 'forearm.L'),
        sleeve(mx(SHOULDER), ELBOW_R, WRIST_R, 'upperarm.R', 'forearm.R'),
      )
      .paintWhere(sdf.box([0.6, 0.1, 0.6]).at(0, 0.44, 0), C.robeLit, 0.04);
    k.body('robe', robe, { color: C.robe, roughness: 0.9, bump: (x, y, z) => 0.0008 * noise.fbm(x * 70, y * 30, z * 70, 2) });

    // ------------------------------------------------------------------ the cape: over the shoulders and the back, open at the front
    const capeOuter: [number, number][] = [
      [0.085, 0.48],
      [0.13, 0.47],
      [0.16, 0.44],
      [0.175, 0.39],
      [0.19, 0.33],
      [0.205, 0.25],
      [0.222, 0.17],
      [0.24, 0.095],
    ];
    const capeRing = sdf
      .revolve(profile.polygon([...capeOuter, ...capeOuter.map(([r, y]) => [r - 0.014, y] as [number, number]).reverse()]))
      .scale([1, 1, 0.93])
      .at(0, 0, -0.01);
    const collarRing = sdf
      .revolve(
        profile.polygon([
          [0.165, 0.44],
          [0.153, 0.5],
          [0.143, 0.545],
          [0.124, 0.545],
          [0.133, 0.5],
          [0.146, 0.44],
        ]),
      )
      .scale([1, 1, 0.9]);
    const frontOpen = sdf
      .extrude(
        profile.polygon([
          [-0.078, 0.62],
          [0.078, 0.62],
          [0.19, 0.0],
          [-0.19, 0.0],
        ]),
        0.6,
      )
      .at(0, 0, 0.3);
    const cape = sdf
      .smoothUnion(0.012, capeRing.bone('spine'), collarRing.bone('chest'))
      .subtract(frontOpen)
      .paintWhere(sdf.box([1, 0.08, 1]).at(0, 0.5, 0), T.capeLit, 0.03)
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.16), T.capeDark, 0.07);
    k.body('cape', cape, {
      color: T.cape,
      roughness: 0.85,
      bump: (x, y, z) => 0.0035 * Math.sin(Math.atan2(x, z + 0.01) * 11 + y * 3) + 0.0008 * noise.fbm(x * 60, y * 25, z * 60, 2),
    });

    // ------------------------------------------------------------------ gold trim: front columns, zigzag hem, cuffs
    const robeShell = robeShape.round(0.007).subtract(robeShape.round(-0.004));
    const columns = robeShell
      .intersect(
        pair(
          sdf
            .extrude(
              profile.polygon([
                [0.052, 0.43],
                [0.077, 0.43],
                [0.087, 0.08],
                [0.062, 0.08],
              ]),
              0.4,
            )
            .at(0, 0, 0.2),
        ),
      )
      .bone('spine');
    const teeth: sdf.Shape[] = [];
    for (let a = -105; a <= 105; a += 15) {
      teeth.push(
        sdf
          .extrude(
            profile.polygon([
              [-0.028, 0.075],
              [0.028, 0.075],
              [0.028, 0.105],
              [0, 0.135],
              [-0.028, 0.105],
            ]),
            0.4,
          )
          .at(0, 0, 0.2)
          .rotateY(a),
      );
    }
    const hem = robeShell.intersect(sdf.union(...teeth)).bone('spine');
    // A gold cuff ring: a torus whose axis follows the forearm (rotateX tilts, rotateY turns).
    const cuff = (e: V3, w: V3, fore: string) => {
      const d = norm(add(w, e, -1));
      const ring = (t: number, tube: number) =>
        sdf
          .torus(0.05, tube)
          .rotateX((Math.acos(d[1]) * 180) / Math.PI)
          .rotateY((Math.atan2(d[0], d[2]) * 180) / Math.PI)
          .at(...lerp(e, w, t));
      return sdf.union(ring(0.8, 0.014), ring(0.98, 0.011)).bone(fore);
    };
    k.body('trim', sdf.union(columns, hem, cuff(ELBOW_L, WRIST_L, 'forearm.L'), cuff(ELBOW_R, WRIST_R, 'forearm.R')), {
      color: C.trim,
      roughness: 0.4,
      metalness: 0.7,
      detail: 0.004,
    });

    // ------------------------------------------------------------------ the medallion with an eye, the belt
    const MED_Y = 0.345;
    const medZ = sdf.raycast(robeShape, [0, MED_Y, 1], [0, 0, -1])![2];
    const eyeShape = sdf.extrude(
      profile.polygon(
        [
          [-0.03, 0],
          [-0.015, 0.011],
          [0, 0.014],
          [0.015, 0.011],
          [0.03, 0],
          [0.015, -0.011],
          [0, -0.014],
          [-0.015, -0.011],
        ],
        { smooth: true, samples: 4 },
      ),
      0.2,
    );
    const medallion = sdf
      .smoothUnion(0.004, sdf.cylinder(0.043, 0.014, 0.004).rotateX(90), sdf.torus(0.04, 0.006).rotateX(90).at(0, 0, 0.004), sdf.sphere(0.011).scale([1, 1, 0.5]).at(0, 0, 0.008))
      .paintWhere(eyeShape, C.hole, 0.002)
      .paintWhere(sdf.cylinder(0.0115, 0.3).rotateX(90), C.trim, 0.002)
      .paintWhere(sdf.cylinder(0.0055, 0.3).rotateX(90), C.hole, 0.002)
      .at(0, MED_Y, medZ + 0.004);
    k.body('medallion', medallion, { color: C.trim, roughness: 0.4, metalness: 0.7, bone: 'spine', detail: 0.003, textureDensity: 2 });
    const belt = robeShape.round(0.009).smoothIntersect(0.005, sdf.box([0.7, 0.055, 0.7]).at(0, 0.27, 0));
    k.body('belt', belt, { color: C.belt, roughness: 0.7, bone: 'spine', detail: 0.004 });
    const plateZ = sdf.raycast(robeShape, [0, 0.222, 1], [0, 0, -1])![2];
    k.body('plate', sdf.box([0.038, 0.042, 0.008], 0.003).at(0, 0.222, plateZ + 0.004), { color: C.steel, roughness: 0.4, metalness: 0.8, bone: 'spine', detail: 0.003 });

    // ------------------------------------------------------------------ hands (bare skin), legs, shoes
    const armL = sdf.smoothUnion(
      0.02,
      sdf.cone(SHOULDER, ELBOW_L, 0.04, 0.036).bone('upperarm.L'),
      sdf.cone(ELBOW_L, WRIST_L, 0.036, 0.032).bone('forearm.L'),
      fistAt(GRIP, 1).bone('hand.L'),
    );
    const armR = sdf.smoothUnion(
      0.02,
      sdf.cone(mx(SHOULDER), ELBOW_R, 0.04, 0.036).bone('upperarm.R'),
      sdf.cone(ELBOW_R, WRIST_R, 0.036, 0.032).bone('forearm.R'),
      fistAt(mx(GRIP), -1).bone('hand.R'),
    );
    k.body('hands', sdf.union(armL, armR), { color: C.skin, roughness: 0.55, detail: 0.004 });
    const legs = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.11, 0.05, 0.085]).at(0, 0.205, 0).bone('hips'),
      pair(sdf.smoothUnion(0.01, sdf.capsule([HIP[0], 0.2, 0], KNEE, 0.045).bone('leg.L'), sdf.capsule(KNEE, [ANKLE[0], 0.06, 0], 0.04).bone('shin.L'))),
    );
    k.body('legs', legs, { color: C.legs, roughness: 0.85, detail: 0.007 });
    const shoe = sdf
      .smoothUnion(0.03, sdf.cylinder(0.046, 0.06, 0.015).at(0, 0.035, 0), sdf.ellipsoid([0.054, 0.044, 0.094]).at(0, 0.04, 0.04))
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('shoes', pair(shoe), { color: C.shoe, roughness: 0.55 });

    // ------------------------------------------------------------------ the dagger, held up in the right fist
    // Local frame: the grip at the origin, the blade along +X. The pose stands it up, tilted a little
    // forward and outward. BLADE_DIR and FLAT are the rest directions in the clips' frame (the left
    // arm), so they are the mirror of the world directions.
    const bladeOutline = profile.polygon([
      [0.045, 0.02],
      [0.14, 0.015],
      [0.2, 0.006],
      [0.235, 0],
      [0.2, -0.006],
      [0.14, -0.015],
      [0.045, -0.02],
    ]);
    // World directions of the blade (right hand), for the center groove (a fuller) in the normal map.
    const dagWorld = (v: V3) => {
      const w = new THREE.Vector3(...v)
        .applyAxisAngle(new THREE.Vector3(0, 0, 1), THREE.MathUtils.degToRad(90))
        .applyAxisAngle(new THREE.Vector3(1, 0, 0), THREE.MathUtils.degToRad(10))
        .applyAxisAngle(new THREE.Vector3(0, 0, 1), THREE.MathUtils.degToRad(6));
      return w;
    };
    const dAlong = dagWorld([1, 0, 0]);
    const dAcross = dagWorld([0, 1, 0]);
    const G0 = mx(GRIP);
    const bladeBump = (x: number, y: number, z: number) => {
      const p = new THREE.Vector3(x - G0[0], y - G0[1], z - G0[2]);
      const along = p.dot(dAlong);
      const across = p.dot(dAcross);
      return along > 0.08 ? -0.0035 * Math.exp(-((across / 0.0055) ** 2)) : 0;
    };
    const bladeLocal = sdf.extrude(bladeOutline, 0.014, 0.005).paintWhere(sdf.extrude(profile.offsetProfile(bladeOutline, -0.005), 0.1), C.blade, 0.003);
    const gripLocal = sdf.capsule([-0.05, 0, 0], [0.05, 0, 0], 0.012);
    const guardLocal = sdf.union(sdf.cylinder(0.03, 0.009, 0.003).rotateZ(90).at(0.052, 0, 0), sdf.sphere(0.014).at(-0.056, 0, 0));
    const daggerPose = (s: sdf.Shape) => s.rotateZ(90).rotateX(10).rotateZ(6).at(...mx(GRIP));
    k.body('blade', daggerPose(bladeLocal), { color: C.bladeEdge, roughness: 0.35, metalness: 0.8, detail: 0.003, bone: 'dagger', bump: bladeBump });
    k.body('hilt', daggerPose(gripLocal), { color: C.grip, roughness: 0.7, detail: 0.004, bone: 'dagger' });
    k.body('guard', daggerPose(guardLocal), { color: C.trim, roughness: 0.4, metalness: 0.7, detail: 0.003, bone: 'dagger' });

    // ------------------------------------------------------------------ the black candle on a gold holder, left fist
    k.body('candle-wax', sdf.cylinder(0.02, 0.1, 0.004).at(GRIP[0], GRIP[1] + 0.105, GRIP[2]), { color: C.wax, roughness: 0.5, bone: 'candle', detail: 0.004 });
    const holder = sdf.smoothUnion(
      0.006,
      sdf.cylinder(0.011, 0.13, 0.003).at(GRIP[0], GRIP[1] - 0.01, GRIP[2]), // stem through the fist
      sdf.cylinder(0.04, 0.008, 0.003).at(GRIP[0], GRIP[1] + 0.055, GRIP[2]), // drip cup at the top
      sdf
        .revolve(
          profile.polygon([
            [0, 0],
            [0.03, 0],
            [0.058, 0.008],
            [0.075, 0.026],
            [0.07, 0.027],
            [0.055, 0.012],
            [0.03, 0.008],
            [0, 0.008],
          ]),
        )
        .at(GRIP[0], GRIP[1] - 0.075, GRIP[2]), // the wide dish under the fist
    );
    k.body('candle-holder', holder, { color: C.trim, roughness: 0.4, metalness: 0.7, bone: 'candle', detail: 0.003 });
    const flameShape = sdf.smoothUnion(0.01, sdf.sphere(0.012).at(0, 0.014, 0), sdf.cone([0, 0.016, 0], [0, 0.05, 0], 0.01, 0.001)).at(...FLAME_AT);
    k.body('candle-flame', flameShape, { bone: 'flame', color: C.flameBase, emissive: C.flame, emissiveIntensity: 1.5, roughness: 0.3, detail: 0.003 });

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop, keys, reach, orient, edgeUp, quat, follow, euler, mirrorPose } = motion;
    const LEG = 0.19;
    const DEG = Math.PI / 180;
    /** The flame's flicker; `boost` flares it up. */
    const flicker = (p: number, n: number, boost = 0) => ({
      scale: [1 + 0.08 * wave(p, n, 0.1) + 0.3 * boost, 1 + 0.18 * wave(p, n + 2) + 0.6 * boost, 1 + 0.08 * wave(p, n, 0.3) + 0.3 * boost] as const,
    });

    k.animation('idle', {
      duration: 2.4,
      pose: (_t, p) => ({
        hips: { move: [0, -0.003 * bump(p), 0] },
        chest: { rotate: [2.5 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        // Still and watchful: the hood tilts slowly from side to side.
        head: { rotate: [2 * wave(p, 1, 0.25), 5 * wave(p, 1, 0.4), 4 * wave(p, 1, 0.1)] },
        'upperarm.L': { rotate: [2 * wave(p, 1, 0.1), 0, 3 * bump(p)] },
        'upperarm.R': { rotate: [2 * wave(p, 1, 0.1), 0, -3 * bump(p)] },
        'forearm.L': { rotate: [-3 * bump(p), 0, 0] },
        'forearm.R': { rotate: [-4 * bump(p), 0, 0] },
        flame: flicker(p, 4),
      }),
    });

    // The legs come from motion.gait (see the bandit): the left heel strikes at p = 0.25, when the
    // left arm is back. Short shuffling steps under the robe.
    const stride = (duration: number, step: number, footLift: number, duty: number, bob: number, armSwing: number, lean: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        const hipsTurn = [0, 5 * s, 0] as const;
        const legs = motion.gait(p - 0.25, { hip: HIP, knee: KNEE, ankle: ANKLE }, {
          stride: step,
          lift: footLift,
          duty,
          bob,
          roll: 10,
          heel: SOLE_HEEL,
          toe: SOLE_TOE,
          hips: { at: [0, 0.2, 0], rotate: hipsTurn },
        });
        return {
          ...legs.pose,
          hips: { move: [0, legs.hipsY, 0] as const, rotate: hipsTurn },
          spine: { rotate: [lean, 0, 0] as const },
          chest: { rotate: [lean * 0.5, -8 * s, 0] as const },
          head: { rotate: [-lean, 4 * s, 0] as const },
          'upperarm.L': { rotate: [armSwing * 0.3 * s, 0, 6] as const },
          'upperarm.R': { rotate: [-armSwing * 0.3 * s, 0, -6] as const },
          'forearm.L': { rotate: [-armSwing * 0.25, 0, 0] as const },
          'forearm.R': { rotate: [-armSwing * 0.25, 0, 0] as const },
          flame: flicker(p, 4),
        };
      },
    });
    k.animation('walk', stride(0.95, 0.09, 0.022, 0.62, 0.005, 22, 4));
    k.animation('run', stride(0.58, 0.14, 0.04, 0.4, 0.025, 40, 12));

    // ---------------------------------------------------------------- attack, hit, death: the bandit's clips
    // These are written in the bandit's frame, where the blade is in the LEFT hand (all arm
    // geometry is symmetric), and mirrorPose turns them to the right hand.
    const bladeTurn = (v: V3): V3 => {
      const w = new THREE.Vector3(...v)
        .applyAxisAngle(new THREE.Vector3(0, 0, 1), THREE.MathUtils.degToRad(90))
        .applyAxisAngle(new THREE.Vector3(1, 0, 0), THREE.MathUtils.degToRad(10))
        .applyAxisAngle(new THREE.Vector3(0, 0, 1), THREE.MathUtils.degToRad(6));
      return mx([w.x, w.y, w.z]);
    };
    const BLADE_DIR = bladeTurn([1, 0, 0]);
    const FLAT = bladeTurn([0, 0, 1]);
    const CUT_FLAT = norm([-0.6, 0.75, 0]);
    const ARM_L = { root: SHOULDER, mid: ELBOW_L, end: WRIST_L };
    const ARM_R = { root: mx(SHOULDER), mid: ELBOW_R, end: WRIST_R };
    const bladeKeys = [
      [0, BLADE_DIR],
      [0.12, norm([0.75, 0.62, 0.22])],
      [0.24, norm([0.3, 0.75, -0.6])],
      [0.3, norm([0.28, 0.72, -0.64])],
      [0.39, norm([0.24, 0.7, -0.67])],
      [0.44, norm([0.45, 0.88, 0.1])],
      [0.48, norm([0.58, 0.52, 0.62])],
      [0.51, norm([-0.08, -0.1, 0.99])],
      [0.54, norm([-0.58, -0.52, 0.62])],
      [0.62, norm([-0.68, -0.56, 0.47])],
      [0.72, norm([-0.68, -0.58, 0.45])],
      [0.86, norm([0.35, 0.02, 0.94])],
      [1, BLADE_DIR],
    ] as const;
    const bladeAt = (p: number) => keys(p, bladeKeys, 'spline');
    const ease = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    k.animation('attack', {
      duration: 0.85,
      loop: false,
      pose: (_t, p) => {
        // The wrist keys sit 2 cm further out than the bandit's, clear of the wider hood collar.
        const wrist = keys(
          p,
          [
            [0, WRIST_L],
            [0.12, [0.25, 0.36, 0.04]],
            [0.24, [0.265, 0.47, -0.045]],
            [0.3, [0.27, 0.48, -0.06]],
            [0.39, [0.27, 0.485, -0.065]],
            [0.44, [0.27, 0.475, 0.02]],
            [0.48, [0.2, 0.44, 0.11]],
            [0.51, [0.15, 0.385, 0.16]],
            [0.54, [0.12, 0.335, 0.165]],
            [0.62, [0.11, 0.32, 0.16]],
            [0.72, [0.115, 0.32, 0.16]],
            [0.86, [0.2, 0.3, 0.13]],
            [1, WRIST_L],
          ] as const,
          'spline',
        );
        const dir = norm(bladeAt(p));
        const lead = ease(0.14, 0.3, p) * (1 - ease(0.74, 0.94, p));
        const cutUp = edgeUp(bladeAt, p, CUT_FLAT);
        const up = norm([FLAT[0] + (cutUp[0] - FLAT[0]) * lead, FLAT[1] + (cutUp[1] - FLAT[1]) * lead, FLAT[2] + (cutUp[2] - FLAT[2]) * lead]);
        const POLE_REST: V3 = add(SHOULDER, add(ELBOW_L, SHOULDER, -1), 4);
        const pole = keys(p, [[0, POLE_REST], [0.24, [0.6, 0.35, -0.2]], [0.42, [0.6, 0.35, -0.15]], [0.5, [0.5, 0.05, 0.5]], [0.74, [0.45, -0.05, 0.5]], [1, POLE_REST]] as const);
        const arm = reach(ARM_L, wrist, pole);
        const hand = orient([arm.upper, arm.lower], { dir: BLADE_DIR, up: FLAT }, { dir, up });
        const wind = ease(0, 0.28, p) * (1 - ease(0.4, 0.5, p));
        const cut = ease(0.41, 0.54, p) * (1 - ease(0.72, 1, p));
        // The candle arm reaches forward and out for balance; the hand keeps the candle upright.
        const upperR: V3 = [-18 * wind + 8 * cut, 0, -12 * wind];
        const lowerR: V3 = [-14 * wind, 0, 0];
        const candleUp = orient([upperR, lowerR], { dir: UP, up: FWD }, { dir: UP, up: FWD });
        return mirrorPose({
          hips: { move: [0.012 * wind - 0.01 * cut, -legDrop(LEG, 16 * cut) - 0.006 * wind, 0.035 * cut - 0.012 * wind], rotate: [0, 8 * wind - 18 * cut, 0] },
          spine: { rotate: [-5 * wind + 10 * cut, -6 * cut, 0] },
          chest: { rotate: [-5 * wind + 5 * cut, 14 * wind - 16 * cut, 0] },
          head: { rotate: [-2 * wind + 4 * cut, -8 * wind + 16 * cut, 0] },
          'upperarm.L': { rotate: arm.upper },
          'forearm.L': { rotate: arm.lower },
          'hand.L': { rotate: hand },
          'upperarm.R': { rotate: upperR },
          'forearm.R': { rotate: lowerR },
          'hand.R': { rotate: candleUp },
          'leg.R': { rotate: [-6 * wind - 22 * cut, 0, 0] },
          'leg.L': { rotate: [-3 * wind + 12 * cut, 0, 0] },
          'foot.R': { rotate: [6 * wind + 16 * cut, 0, 0] },
          'foot.L': { rotate: [3 * wind - 8 * cut, 0, 0] },
        });
      },
    });

    // Hit: a blow from the front; the head and the chest snap back, one foot steps back.
    const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
    const SHIN = 0.125;
    const HEEL = 0.06;
    const plant = (back: number) => Math.asin(Math.max(-1, Math.min(1, back / SHIN))) / DEG;
    k.animation('hit', {
      duration: 0.4,
      loop: false,
      pose: (_t, p) => {
        const h = keys(p, [[0, 0], [0.15, 1], [0.32, 0.85], [0.8, 0]] as const);
        const lift = keys(p, [[0.04, 0], [0.13, 1], [0.24, 0], [0.5, 0], [0.62, 0.7], [0.74, 0]] as const);
        const back = 0.028 * h;
        const lean = plant(back);
        return mirrorPose({
          hips: { move: [0, -legDrop(SHIN, lean), -back], rotate: [0, 5 * h, 0] },
          spine: { rotate: [-6 * h, 0, 0] },
          chest: { rotate: [-10 * h, 6 * h, 3 * h] },
          neck: { rotate: [-6 * h, 0, 0] },
          head: { rotate: [-16 * h, -6 * h, -5 * h] },
          'leg.L': { rotate: [-lean, 0, 0] },
          'foot.L': { rotate: [lean, 0, 0] },
          'leg.R': { rotate: [lean + 16 * lift, 0, 0] },
          'foot.R': { rotate: [-lean - 16 * lift, 0, 0] },
          'upperarm.L': { rotate: [-8 * h, 0, 14 * h] },
          'forearm.L': { rotate: [-10 * h, 0, 0] },
          'upperarm.R': { rotate: [-6 * h, 0, -8 * h] },
          'forearm.R': { rotate: [-6 * h, 0, 0] },
        });
      },
    });

    // Death: a stagger, then a fall on the back as one piece; the hand opens and the dagger drops
    // beside it; the candle stays in the other hand. The body keeps its size.
    const LIE = 86;
    const LIE_Y = 0.13;
    const TRUNK: readonly V3[] = [[0, 0.2, 0], [0, 0.26, 0], [0, 0.33, 0]];
    const HAND_CHAIN: readonly V3[] = [...TRUNK, SHOULDER, ELBOW_L, WRIST_L];
    const DROP_AT: V3 = [0.4, 0.028, -0.36];
    const DROP_TURN = quat(orient([], { dir: BLADE_DIR, up: FLAT }, { dir: norm([0.35, -0.05, 1]), up: [0, 1, 0] }));
    k.animation('death', {
      duration: 1.4,
      loop: false,
      pose: (_t, p) => {
        const hitB = keys(p, [[0, 0], [0.07, 1], [0.18, 0.5], [0.3, 0.2], [0.4, 0]] as const);
        const sag = keys(p, [[0.1, 0], [0.26, 1], [0.36, 0.8], [0.5, 0]] as const);
        const wob = keys(p, [[0.12, 0], [0.22, 1], [0.32, -0.6], [0.42, 0]] as const);
        const u = clamp01((p - 0.36) / 0.24);
        const bounce = keys(p, [[0.6, 0], [0.66, 1], [0.73, 0]] as const);
        const tilt = LIE * u * u - 5 * bounce;
        const fly = keys(p, [[0.36, 0], [0.5, 1], [0.62, 0.2], [0.7, 0]] as const);
        const land = keys(p, [[0.44, 0], [0.62, 1]] as const);
        const loose = keys(p, [[0.44, 0], [0.6, 1]] as const);
        const back = 0.022 * hitB;
        const lean = plant(back);
        const a = tilt * DEG;
        const hipsY = Math.max(LIE_Y, 0.2 * Math.cos(a) + HEEL * Math.sin(a));
        const hipsMove: V3 = [0, hipsY - 0.2 - legDrop(SHIN, lean), -HEEL - 0.2 * Math.sin(a) + HEEL * Math.cos(a) - back];
        const legs = 16 * clamp01((tilt - 70) / 16);
        const hipsR: V3 = [-tilt, 0, 0];
        const spineR: V3 = [-8 * hitB + 6 * sag, 0, 4 * wob];
        const chestR: V3 = [-10 * hitB + 5 * sag, 6 * hitB, 5 * wob];
        const standR = add(add(add(WRIST_R, [-0.05, 0.02, -0.05], hitB), [0, -0.07, -0.03], sag), [-0.07, 0, 0.04], fly);
        const armR = reach(ARM_R, lerp(standR, [-0.215, 0.26, -0.07], land), lerp(ELBOW_R, [-0.3, 0.3, -0.05], land));
        const standL = add(add(add(WRIST_L, [0.05, 0.04, 0.02], hitB), [0, -0.02, 0.03], sag), [0.07, 0.06, 0.04], fly);
        const armL = reach(ARM_L, lerp(standL, [0.27, 0.34, -0.07], land), lerp(ELBOW_L, [0.35, 0.36, -0.1], land));
        const handQ = quat(hipsR).multiply(quat(spineR)).multiply(quat(chestR)).multiply(quat(armL.upper)).multiply(quat(armL.lower));
        const held = add(follow(HAND_CHAIN, [hipsR, spineR, chestR, armL.upper, armL.lower, [0, 0, 0]], GRIP), hipsMove);
        const drop = keys(p, [[0.44, add(DROP_AT, [0, 0.12, 0])], [0.6, DROP_AT], [0.65, add(DROP_AT, [0, 0.02, 0])], [0.7, DROP_AT]] as const);
        const inv = handQ.clone().invert();
        const d = new THREE.Vector3(...add(lerp(held, drop, loose), held, -1)).applyQuaternion(inv);
        return mirrorPose({
          hips: { move: hipsMove, rotate: hipsR },
          spine: { rotate: spineR },
          chest: { rotate: chestR },
          neck: { rotate: [-8 * hitB + 5 * sag + 8 * land, 0, 0] },
          head: { rotate: [-16 * hitB + 8 * sag + 10 * land, -8 * hitB + 30 * land, 8 * wob] },
          'upperarm.L': { rotate: armL.upper },
          'forearm.L': { rotate: armL.lower },
          'upperarm.R': { rotate: armR.upper },
          'forearm.R': { rotate: armR.lower },
          dagger: { move: [d.x, d.y, d.z], rotate: euler(inv.clone().multiply(handQ.clone().slerp(DROP_TURN, loose))) },
          'leg.L': { rotate: [-lean + legs, 0, 8 * land] },
          'leg.R': { rotate: [-lean + legs, 0, -8 * land] },
          'foot.L': { rotate: [lean, 20 * land, 0] },
          'foot.R': { rotate: [lean, -20 * land, 0] },
        });
      },
    });

    // ------------------------------------------------------------------ taunt: the chant
    // Played when the cult leader first sees the player. The candle rises out to the left, level with
    // the mask and upright; the cult leader leans back, then nods three times with the chanted lines
    // while the head sways and the flame flares. The dagger hand comes up before the waist. The
    // wrist target is in the chest's rest frame; the hand keeps the candle upright.
    const POLE_REST_L: V3 = add(SHOULDER, add(ELBOW_L, SHOULDER, -1), 4);
    const RAISE_AT: V3 = [0.25, 0.56, 0.17];
    const POLE_RAISE: V3 = [0.55, 0.3, -0.1];
    k.animation('taunt', {
      duration: 2.4,
      loop: false,
      pose: (_t, p) => {
        const raise = keys(p, [[0, 0], [0.16, 1], [0.84, 1], [1, 0]] as const);
        const chant = raise * bump(p, 3);
        const sway = raise * wave(p, 1.5);
        const wrist = lerp(WRIST_L, add(RAISE_AT, [0, 0.02 * chant, 0]), raise);
        const arm = reach(ARM_L, wrist, lerp(POLE_REST_L, POLE_RAISE, raise));
        const hand = orient([arm.upper, arm.lower], { dir: UP, up: FWD }, { dir: UP, up: FWD });
        return {
          spine: { rotate: [-3 * raise, 0, 2 * sway] },
          chest: { rotate: [-3 * raise + 5 * chant, -6 * raise, 2 * sway] },
          neck: { rotate: [-4 * raise + 4 * chant, 0, 0] },
          head: { rotate: [-8 * raise + 8 * chant, 4 * raise, 5 * sway] },
          'upperarm.L': { rotate: arm.upper },
          'forearm.L': { rotate: arm.lower },
          'hand.L': { rotate: hand },
          'upperarm.R': { rotate: [-16 * raise, 0, -6 * raise] },
          'forearm.R': { rotate: [12 * raise - 8 * chant, 0, 0] },
          flame: flicker(p, 8, raise),
        };
      },
    });
  },
});
