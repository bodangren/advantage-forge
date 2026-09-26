import { defineAsset, motion, noise, profile, sdf } from '../src/index.js';

/**
 * Goblin archer — Chibi Quest enemy (catalog `enemies/humanoid/goblin-archer`), about 0.95 m to
 * the peak of its hood, faces +Z. Target: docs/enemy-mockups/goblin-archer_001.jpg (made with mmx,
 * with the goblin warrior design as the character reference; one front view). Built on the goblin
 * warrior's head, face, body, and skeleton, so the two goblins read as one tribe.
 *
 * Role: a ranged common enemy, seen in 3D and as a 128 px sprite; the hood, ears, and bow read.
 * One idea: a sly goblin peering out of a pointed dark green hood, its huge ears poking out
 *   through slits, with a recurve bow at its side and red-fletched arrows over its shoulder.
 * Proportions: the goblin warrior's (head center 0.7, eyes 0.655, chin 0.51, belt 0.28, hem
 *   0.19); the hood peak rises to 0.95 and the capelet hem sits at 0.36.
 * Shape language: round (head, cheeks, fists, boots) with points for menace (hood peak, ear tips,
 *   dagged capelet hem, fletching, bow tips).
 * Palette (60/30/10): olive-green skin #a0a446; dark hood green #3f4a2e and leather browns
 *   (jerkin #8a5534, straps #5e3820); red fletching #b8302a and orange war paint #d98a3a as the
 *   accents; brass studs and buckles #c8a050.
 * Value plan: the dark hood frames the light face (focal point); the red fletching over the
 *   shoulder is the second accent; the dark pants and boots ground the figure.
 * Bodies: skin, hood, capelet, jerkin, leather, bracers, brass, quiver, arrows, pants, boots,
 *   bow, bowstring.
 * Rig: the warrior's skeleton (ears, no scarf knot); the bow is rigid on `hand.L`, the quiver on
 *   `chest`. Clips: idle, walk, run, attack (raise the bow, draw, loose).
 */

const C = {
  skin: '#a0a446',
  skinDark: '#868a3a',
  earInner: '#7f8436',
  warPaint: '#d98a3a',
  eyeWhite: '#f7f1e6',
  iris: '#5e2812',
  irisLow: '#c4682a',
  pupil: '#1a1416',
  lid: '#1d1a22',
  brow: '#392e2a',
  mouth: '#3a2418',
  hood: '#383d24',
  hoodInside: '#1c2014',
  jerkin: '#8a5534',
  jerkinDark: '#6a3f25',
  leather: '#5e3820',
  bracer: '#8a5a32',
  bracerDark: '#5e3820',
  brass: '#c8a050',
  quiver: '#6e4024',
  quiverDark: '#4a2a18',
  shaft: '#c8a878',
  fletch: '#b8302a',
  pants: '#3e2c26',
  boot: '#7a4a2c',
  cuff: '#8f5f36',
  sole: '#4a2e1e',
  bow: '#7a4a28',
  grip: '#3e2618',
  string: '#e8dcc0',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.7;
const HEAD = [0.205, 0.168, 0.205] as const;
const EYE = [0.108, 0.655] as const; // x (each side), y
const pair = (s: sdf.Shape) => s.mirror('x');
const hard = (s: sdf.Shape) => s.mirror('x', 0);
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// Joints. The right arm hangs relaxed; the left (bow) arm is held out, so the bow clears the
// capelet, the boot, and the ground.
const SHOULDER: V3 = [0.14, 0.405, 0];
const ELBOW_R: V3 = [-0.2, 0.335, 0.01];
const WRIST_R: V3 = [-0.222, 0.262, 0.03];
const ELBOW_L: V3 = [0.215, 0.35, 0.01];
const WRIST_L: V3 = [0.284, 0.318, 0.05];
const HIP: V3 = [0.075, 0.2, 0];
const ANKLE: V3 = [0.108, 0.075, 0];

/** A fist hanging from the wrist `w`; `s` mirrors it for the right hand. Its grip hole runs along Z. */
const fistAt = (w: V3, s: 1 | -1) => {
  const o = (dx: number, dy: number, dz: number): V3 => [w[0] + dx * s, w[1] + dy, w[2] + dz];
  return sdf.smoothUnion(
    0.02,
    sdf.ellipsoid([0.046, 0.05, 0.05]).at(...o(0.008, -0.044, 0.004)),
    sdf.capsule(o(-0.01, -0.068, 0.034), o(-0.006, -0.044, 0.05), 0.02),
    sdf.cone(o(0.024, -0.026, 0.029), o(0.001, -0.038, 0.056), 0.019, 0.015),
  );
};

export default defineAsset({
  name: 'goblin-archer',
  description: 'Chibi goblin archer enemy with a pointed dark green hood, ears through slits, war paint, a quiver, and a recurve bow.',
  detail: 0.005,
  reference: 'docs/enemy-mockups/goblin-archer_001.jpg',

  build(k) {
    const EAR: V3 = [0.165, 0.7, -0.01];
    // ------------------------------------------------------------------ skeleton
    k.skeleton({
      hips: { at: [0, 0.2, 0] },
      spine: { parent: 'hips', at: [0, 0.27, 0] },
      chest: { parent: 'spine', at: [0, 0.35, 0] },
      neck: { parent: 'chest', at: [0, 0.46, -0.01] },
      head: { parent: 'neck', at: [0, 0.51, -0.01] },
      'ear.L': { parent: 'head', at: EAR, tail: [0.37, 0.82, -0.15] },
      'ear.R': { parent: 'head', at: mx(EAR), tail: [-0.37, 0.82, -0.15] },
      'upperarm.L': { parent: 'chest', at: SHOULDER },
      'forearm.L': { parent: 'upperarm.L', at: ELBOW_L },
      'hand.L': { parent: 'forearm.L', at: WRIST_L },
      'upperarm.R': { parent: 'chest', at: mx(SHOULDER) },
      'forearm.R': { parent: 'upperarm.R', at: ELBOW_R },
      'hand.R': { parent: 'forearm.R', at: WRIST_R },
      'leg.L': { parent: 'hips', at: HIP },
      'foot.L': { parent: 'leg.L', at: ANKLE },
      'leg.R': { parent: 'hips', at: mx(HIP) },
      'foot.R': { parent: 'leg.R', at: mx(ANKLE) },
    });

    // ------------------------------------------------------------------ head and ears (the goblin warrior's)
    const head = sdf
      .smoothUnion(
        0.06,
        sdf.ellipsoid(HEAD).at(0, HEAD_Y, -0.005),
        pair(sdf.sphere(0.1).at(0.108, 0.605, 0.062)), // full cheeks
        sdf.ellipsoid([0.15, 0.06, 0.1]).at(0, 0.56, 0.05), // broad jaw
        sdf.ellipsoid([0.07, 0.042, 0.05]).at(0, 0.58, 0.12), // a small muzzle under the nose
      )
      .bone('head');
    const faceZ = (x: number, y: number) => sdf.raycast(head, [x, y, 1], [0, 0, -1])![2];
    // A wider, flatter snout than the warrior's, with big nostrils.
    const nose = sdf.ellipsoid([0.042, 0.029, 0.03]).at(0, 0.6, faceZ(0, 0.6) - 0.007).bone('head');

    // A flat leaf, drawn outward along +X with the base at the origin; the cup faces +Z.
    const earOutline = profile.polygon(
      [
        [-0.05, 0.105],
        [0.05, 0.11],
        [0.15, 0.113],
        [0.225, 0.112],
        [0.258, 0.1],
        [0.225, 0.07],
        [0.17, 0.015],
        [0.105, -0.05],
        [0.04, -0.1],
        [-0.05, -0.125],
      ],
      { smooth: true, samples: 5 },
    );
    const earCup = sdf.extrude(profile.offsetProfile(earOutline, -0.028), 0.03, 0.01).at(0.012, 0.004, 0.02);
    const earLocal = sdf.extrude(earOutline, 0.028, 0.012).smoothSubtract(0.01, earCup);
    // A little longer than the warrior's ears, because the hood covers their base.
    const earPose = (s: sdf.Shape) => s.scale(1.12).rotateY(41).at(...EAR);
    const ears = pair(earPose(earLocal.paintWhere(earCup.round(0.004), C.earInner, 0.008)).bone('ear.L'));
    const neck = sdf.capsule([0, 0.44, -0.01], [0, 0.55, -0.01], 0.056).bone('neck');

    // Arms: bare green upper arms, forearms under bracers, big fists.
    const armL = sdf.smoothUnion(
      0.02,
      sdf.cone(SHOULDER, ELBOW_L, 0.046, 0.04).bone('upperarm.L'),
      sdf.cone(ELBOW_L, WRIST_L, 0.04, 0.036).bone('forearm.L'),
      fistAt(WRIST_L, 1).bone('hand.L'),
    );
    const armR = sdf.smoothUnion(
      0.02,
      sdf.cone(mx(SHOULDER), ELBOW_R, 0.046, 0.04).bone('upperarm.R'),
      sdf.cone(ELBOW_R, WRIST_R, 0.04, 0.036).bone('forearm.R'),
      fistAt(WRIST_R, -1).bone('hand.R'),
    );

    // Face paint: stencils cross the face along Z, so they always meet the curved surface.
    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const eyeWhite = pair(at(sdf.ellipsoid([0.06, 0.062, 0.07]), EYE[0], EYE[1]));
    // The irises look in toward the nose: a sly, scheming glance.
    const IRIS_X = EYE[0] - 0.015;
    const iris = pair(at(sdf.ellipsoid([0.04, 0.05, 0.07]), IRIS_X, EYE[1] - 0.008));
    const irisLow = iris.intersect(sdf.halfSpace([0, 1, 0], EYE[1] - 0.02));
    const pupil = pair(at(sdf.ellipsoid([0.02, 0.029, 0.07]), IRIS_X + 0.002, EYE[1] - 0.002));
    const lid = pair(sdf.extrude(profile.arc(0.062, 0.015, 12, 172), 0.3).at(EYE[0], EYE[1] - 0.002, 0.1));
    const lowLid = pair(sdf.extrude(profile.arc(0.061, 0.005, 200, 340), 0.3).at(EYE[0], EYE[1] + 0.001, 0.1));
    const shine = sdf.union(
      ...[IRIS_X, -IRIS_X].flatMap((x) => [
        at(sdf.sphere(0.012), x + 0.012, EYE[1] + 0.012),
        at(sdf.sphere(0.006), x - 0.012, EYE[1] - 0.026),
      ]),
    );
    // Heavy brows set low over the eyes: a squinting hunter.
    const brows = pair(
      sdf
        .extrude(
          profile.polygon(
            [
              [0.165, 0.748],
              [0.125, 0.758],
              [0.088, 0.742],
              [0.054, 0.716],
              [0.058, 0.698],
              [0.092, 0.716],
              [0.128, 0.73],
              [0.162, 0.734],
            ],
            { smooth: true, samples: 4 },
          ),
          0.3,
        )
        .at(0, 0, 0.1),
    );
    // A wide, closed, satisfied smile.
    const MOUTH_R = 0.16;
    const mouth = sdf.extrude(profile.arc(MOUTH_R, 0.008, 234, 306), 0.3).at(0, 0.542 + MOUTH_R, 0.1);
    // Two orange war-paint streaks on each cheek, sloping down to the outside.
    const streak = (y: number) =>
      sdf
        .extrude(
          profile.polygon(
            [
              [-0.03, 0.006],
              [0.02, 0.009],
              [0.034, 0.0],
              [0.02, -0.007],
              [-0.03, -0.005],
            ],
            { smooth: true, samples: 3 },
          ),
          0.3,
        )
        .rotateZ(-14)
        .at(0.148, y, 0.1);
    const warPaint = pair(sdf.union(streak(0.595), streak(0.571)));
    const noseFront = sdf.raycast(nose, [0, 0.588, 1], [0, 0, -1])![2];
    const nostrils = pair(sdf.ellipsoid([0.009, 0.007, 0.01]).at(0.018, 0.584, noseFront - 0.012));

    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.012, nose)
      .smoothUnion(0.02, ears)
      .union(armL, armR)
      .paintWhere(warPaint, C.warPaint, 0.004)
      .paintWhere(eyeWhite, C.eyeWhite)
      .paintWhere(iris, C.iris)
      .paintWhere(irisLow, C.irisLow, 0.014)
      .paintWhere(pupil, C.pupil)
      .paintWhere(lid, C.lid)
      .paintWhere(lowLid, C.lid)
      .paintWhere(shine, '#ffffff')
      .paintWhere(brows, C.brow)
      .paintWhere(mouth, C.mouth)
      .paintWhere(nostrils, C.mouth, 0.003);
    k.body('skin', skin, { color: C.skin, roughness: 0.55, textureDensity: 2 });

    // ------------------------------------------------------------------ hood (pointed; the ears come out through it)
    const hoodOuter = sdf.smoothUnion(
      0.06,
      sdf.ellipsoid([0.24, 0.205, 0.24]).at(0, 0.72, -0.015),
      sdf.ellipsoid([0.25, 0.13, 0.228]).at(0, 0.585, -0.005), // wraps the cheeks and the jaw
      sdf.cone([0, 0.86, -0.03], [0, 0.985, -0.075], 0.1, 0.012), // the peak
    );
    const cavity = sdf.smoothUnion(0.02, head.round(0.014), sdf.ellipsoid([0.216, 0.184, 0.218]).at(0, 0.706, -0.01));
    // An oval window from the forehead to below the chin; the hood edge frames the cheeks.
    const opening = sdf.ellipsoid([0.192, 0.155, 0.4]).at(0, 0.64, 0.3);
    // A thick rolled rim around the face opening.
    const rim = hoodOuter
      .round(0.016)
      .subtract(cavity.round(-0.004))
      .intersect(opening.round(0.035))
      .subtract(opening);
    const hood = sdf
      .smoothUnion(0.012, hoodOuter.subtract(cavity).smoothSubtract(0.02, opening), rim)
      .intersect(sdf.halfSpace([0, -1, 0], -0.47))
      .paintWhere(cavity.round(0.006), C.hoodInside, 0.012);
    k.body('hood', hood, { color: C.hood, roughness: 0.85, bone: 'head' });

    // ------------------------------------------------------------------ capelet (dagged hem, brass studs)
    const capeletSolid = sdf
      .revolve(
        profile.polygon(
          [
            [0.07, 0.505],
            [0.13, 0.484],
            [0.188, 0.444],
            [0.214, 0.396],
            [0.222, 0.356],
            [0.204, 0.352],
            [0.194, 0.392],
            [0.168, 0.436],
            [0.12, 0.466],
            [0.066, 0.482],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.86]);
    // V cuts from below make pointed dags; each cutter passes through the middle and cuts two.
    const dag = (angle: number) =>
      sdf
        .extrude(
          profile.polygon([
            [-0.036, 0.33],
            [0.036, 0.33],
            [0, 0.392],
          ]),
          0.6,
        )
        .rotateY(angle);
    const capelet = capeletSolid.subtract(sdf.union(...[0, 36, 72, 108, 144].map((a) => dag(a + 18))));
    k.body('capelet', capelet.bone('chest'), { color: C.hood, roughness: 0.85 });

    // ------------------------------------------------------------------ leather jerkin
    const torso = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.5],
            [0.06, 0.498],
            [0.1, 0.482],
            [0.128, 0.452],
            [0.138, 0.4],
            [0.136, 0.34],
            [0.133, 0.3],
            [0.142, 0.26],
            [0.152, 0.236],
            [0.156, 0.222],
            [0.148, 0.212],
            [0, 0.212],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.8]);
    const jerkin = torso
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.234), C.jerkinDark) // a darker hem band
      .paintWhere(sdf.extrude(profile.rect([0.008, 0.2], 0.003), 0.4).at(0, 0.36, 0.2), C.jerkinDark, 0.002); // front seam
    k.body('jerkin', jerkin.bone('spine'), { color: C.jerkin, roughness: 0.65 });

    // ------------------------------------------------------------------ straps: belt and the quiver strap
    const beltY = 0.28;
    const belt = torso.round(0.012).smoothIntersect(0.006, sdf.box([0.5, 0.04, 0.5], 0.006).at(0, beltY, 0));
    // The quiver strap runs from the right shoulder, under the capelet, down to the left hip.
    const strap = torso.round(0.009).smoothIntersect(0.005, sdf.box([0.7, 0.034, 0.7], 0.005).rotateZ(-34).at(0, 0.36, 0));
    k.body('leather', sdf.union(belt, strap).bone('spine'), { color: C.leather, roughness: 0.6 });

    // ------------------------------------------------------------------ bracers
    const bracer = (e: V3, w: V3) =>
      sdf
        .cone(lerp(e, w, 0.3), lerp(e, w, 1.04), 0.045, 0.056)
        .round(0.003)
        .paintWhere(sdf.sphere(0.05).at(...lerp(e, w, 1.2)), C.bracerDark, 0.004);
    const bracers = sdf.union(bracer(ELBOW_L, WRIST_L).bone('forearm.L'), bracer(ELBOW_R, WRIST_R).bone('forearm.R'));
    k.body('bracers', bracers, { color: C.bracer, roughness: 0.6 });

    // ------------------------------------------------------------------ brass: belt buckle, strap buckle, capelet studs
    const beltZ = sdf.raycast(belt, [0, beltY, 1], [0, 0, -1])![2];
    const buckle = sdf
      .union(
        sdf.box([0.066, 0.052, 0.014], 0.007).subtract(sdf.box([0.036, 0.026, 0.03], 0.005)),
        sdf.box([0.008, 0.03, 0.01], 0.003).at(0.002, 0, 0.004),
      )
      .at(0, beltY, beltZ + 0.004);
    const strapBuckleAt = sdf.surfacePoint(strap, [-0.045, 0.39, 0.2], 0.002);
    const strapBuckle = sdf
      .box([0.032, 0.038, 0.01], 0.004)
      .subtract(sdf.box([0.016, 0.02, 0.03], 0.002))
      .rotateZ(-34)
      .at(...strapBuckleAt);
    // Studs along the front of the capelet, just above the dags.
    const studs = sdf.union(
      ...[-60, -35, -12, 12, 35, 60].map((a) => {
        const r = (a * Math.PI) / 180;
        const p = sdf.surfacePoint(capelet, [Math.sin(r) * 0.3, 0.378, Math.cos(r) * 0.3], 0.001);
        return sdf.sphere(0.0085).at(...p);
      }),
    );
    k.body('brass', sdf.union(buckle.bone('spine'), strapBuckle.bone('spine'), studs.bone('chest')), {
      color: C.brass,
      roughness: 0.4,
      metalness: 0.7,
    });

    // ------------------------------------------------------------------ quiver and arrows (on the back)
    // Local frame: bottom of the quiver at the origin, the mouth up +Y. The mouth is at the right
    // shoulder, so the fletching shows over it from the front.
    const QUIVER_LEN = 0.25;
    const quiverPose = (s: sdf.Shape) => s.rotateX(-6).rotateZ(46).at(0.07, 0.2, -0.152);
    const tube = sdf.cone([0, 0, 0], [0, QUIVER_LEN, 0], 0.038, 0.048).round(0.004);
    const quiverShape = sdf
      .union(
        tube.subtract(sdf.cylinder(0.042, 0.1).at(0, QUIVER_LEN + 0.04, 0)),
        sdf.torus(0.048, 0.009).at(0, QUIVER_LEN - 0.006, 0).paint(C.quiverDark), // rolled mouth
        sdf.cylinder(0.046, 0.026, 0.008).at(0, 0.12, 0).paint(C.quiverDark), // strap band
      )
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.025), C.quiverDark);
    k.body('quiver', quiverPose(quiverShape).bone('chest'), {
      color: C.quiver,
      roughness: 0.6,
      bump: (x, y, z) => 0.0006 * noise.fbm(x * 140, y * 140, z * 140, 2),
    });

    // Five arrows fanned in the mouth; only the shafts and the red fletching show.
    const vane = sdf.extrude(
      profile.polygon([
        [0, -0.004],
        [0.019, 0.014],
        [0.018, 0.05],
        [0, 0.066],
        [-0.018, 0.05],
        [-0.019, 0.014],
      ]),
      0.008,
      0.003,
    );
    const fletching = sdf.union(vane, vane.rotateY(90));
    const arrowTips = [
      [-0.024, 0.012, 0.44],
      [0.004, 0.022, 0.47],
      [0.028, 0.006, 0.445],
      [-0.008, -0.018, 0.46],
      [0.018, -0.014, 0.43],
    ] as const;
    const arrows = sdf.union(
      ...arrowTips.map(([x, z, len], i) => {
        const top: V3 = [x * 2.6, len, z * 2.6];
        const base: V3 = [x * 0.6, 0.08, z * 0.6];
        const dir: V3 = [top[0] - base[0], top[1] - base[1], top[2] - base[2]];
        const tilt = (Math.atan2(Math.hypot(dir[0], dir[2]), dir[1]) * 180) / Math.PI;
        const yaw = (Math.atan2(dir[0], dir[2]) * 180) / Math.PI;
        const f = fletching
          .rotateY(i * 37)
          .rotateX(tilt)
          .rotateY(yaw)
          .at(...lerp(base, top, 0.83));
        return sdf.union(sdf.capsule(base, top, 0.006), f.paint(C.fletch));
      }),
    );
    k.body('arrows', quiverPose(arrows).bone('chest'), { color: C.shaft, roughness: 0.7, detail: 0.004 });

    // ------------------------------------------------------------------ pants and boots (the warrior's)
    const pants = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.12, 0.055, 0.09]).at(0, 0.21, 0).bone('hips'),
      pair(sdf.capsule([HIP[0], 0.2, 0], [ANKLE[0], 0.11, 0.004], 0.052).bone('leg.L')),
    );
    k.body('pants', pants, { color: C.pants, roughness: 0.85 });
    const bootFoot = sdf
      .smoothUnion(
        0.04,
        sdf.cylinder(0.062, 0.1, 0.02).at(0, 0.06, -0.01),
        sdf.ellipsoid([0.078, 0.064, 0.13]).at(0, 0.058, 0.035),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const sole = bootFoot.round(0.005).intersect(sdf.halfSpace([0, 1, 0], 0.018)).intersect(sdf.halfSpace([0, -1, 0], 0));
    // A slim folded-down cuff with a small pointed flap at the outside.
    const bootCuff = sdf.smoothUnion(
      0.008,
      sdf.cylinder(0.068, 0.026, 0.01).at(0, 0.104, -0.01),
      sdf.cone([0.05, 0.106, -0.01], [0.078, 0.122, -0.012], 0.016, 0.005),
    );
    const boot = sdf
      .union(bootFoot, sole.paint(C.sole), bootCuff.paint(C.cuff))
      .rotateY(16)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.6 });

    // ------------------------------------------------------------------ recurve bow in the left hand
    // Local frame: grip at the origin, limbs along Y, the back of the bow toward +Z, the string
    // behind it at -Z. Each limb bends back toward the string, then the tip curls forward.
    const limb = (len: number, sign: 1 | -1) =>
      sdf.chain(
        [
          [0, 0, 0, 0.018],
          [0, 0.22 * len * sign, -0.007, 0.0145],
          [0, 0.48 * len * sign, -0.03, 0.0125],
          [0, 0.72 * len * sign, -0.056, 0.0105],
          [0, 0.88 * len * sign, -0.066, 0.0092],
          [0, 0.97 * len * sign, -0.052, 0.0084],
          [0, 1.02 * len * sign, -0.026, 0.0078],
          [0, 1.03 * len * sign, 0.0, 0.0072],
          [0, 1.015 * len * sign, 0.02, 0.0068],
        ],
        0.01,
      );
    const UPPER = 0.3;
    const LOWER = 0.2;
    const bowLocal = sdf.union(limb(UPPER, 1), limb(LOWER, -1)).paintWhere(sdf.box([0.1, 0.075, 0.1]), C.grip);
    const nockTop: V3 = [0, 0.9 * UPPER, -0.072];
    const nockBottom: V3 = [0, -0.9 * LOWER, -0.072];
    const GRIP: V3 = [WRIST_L[0] + 0.008, WRIST_L[1] - 0.044, WRIST_L[2] + 0.004];
    // The back of the bow faces out (+X), so the front view shows the whole curve.
    const bowPose = (s: sdf.Shape) => s.rotateY(100).rotateZ(-8).at(...GRIP);
    k.body('bow', bowPose(bowLocal), { color: C.bow, roughness: 0.55, detail: 0.004, bone: 'hand.L' });
    k.body('bowstring', bowPose(sdf.capsule(nockTop, nockBottom, 0.0035)), {
      color: C.string,
      roughness: 0.8,
      detail: 0.003,
      bone: 'hand.L',
    });

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop } = motion;
    const LEG = 0.19;

    k.animation('idle', {
      duration: 2.4,
      pose: (_t, p) => ({
        hips: { move: [0, -0.003 * bump(p), 0] },
        chest: { rotate: [2.5 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        head: { rotate: [0, 6 * wave(p, 1, 0.25), 2 * wave(p, 1, 0.1)] },
        'ear.L': { rotate: [0, 0, 4 * wave(p, 1, 0.35)] },
        'ear.R': { rotate: [0, 0, -4 * wave(p, 1, 0.35)] },
        'upperarm.L': { rotate: [1.5 * wave(p, 1, 0.1), 0, 2 * bump(p)] },
        'upperarm.R': { rotate: [2 * wave(p, 1, 0.1), 0, -3 * bump(p)] },
        'forearm.R': { rotate: [-5 * bump(p), 0, 0] },
      }),
    });

    // The bow arm swings less than the free arm and lifts out from the body (`lift`, degrees),
    // so the bow tip clears the ground and the boot while the hips drop at each step.
    // The lift also tilts the upper bow limb (above the shoulder) in toward the hood, so the
    // hand turns back by the lift plus `tiltOut` degrees: the bow leans out, clear of the hood.
    const stride = (
      duration: number,
      legSwing: number,
      armSwing: number,
      lean: number,
      hop: number,
      lift: number,
      tiltOut: number,
    ) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        return {
          hips: {
            move: [0, -legDrop(LEG, legSwing * s) + hop * bump(p, 2, 0.25), 0] as const,
            rotate: [0, 7 * s, 0] as const,
          },
          spine: { rotate: [lean, 0, 0] as const },
          chest: { rotate: [lean * 0.5, -11 * s, 0] as const },
          head: { rotate: [-lean, 5 * s, 0] as const },
          // The ears flap twice per cycle, a little after the steps.
          'ear.L': { rotate: [0, lean * 0.8 + 3 * wave(p, 2, 0.2), 7 * wave(p, 2, 0.15)] as const },
          'ear.R': { rotate: [0, -lean * 0.8 - 3 * wave(p, 2, 0.2), -7 * wave(p, 2, 0.15)] as const },
          'leg.L': { rotate: [-legSwing * s, 0, 0] as const },
          'leg.R': { rotate: [legSwing * s, 0, 0] as const },
          'foot.L': { rotate: [legSwing * 0.55 * s + 12 * Math.max(0, -s), 0, 0] as const },
          'foot.R': { rotate: [-legSwing * 0.55 * s + 12 * Math.max(0, s), 0, 0] as const },
          'upperarm.L': { rotate: [armSwing * 0.35 * s, 0, lift] as const },
          'upperarm.R': { rotate: [-armSwing * s, 0, -6] as const },
          'forearm.L': { rotate: [-armSwing * 0.2, 0, 0] as const },
          'forearm.R': { rotate: [-armSwing * 0.5 - armSwing * 0.4 * Math.max(0, s), 0, 0] as const },
          'hand.L': { rotate: [0, 0, -(lift + tiltOut)] as const },
        };
      },
    });
    k.animation('walk', stride(0.9, 26, 28, 3, 0, 10, 8));
    k.animation('run', stride(0.56, 40, 50, 12, 0.03, 16, 6));

    // A shot: turn side-on and raise the bow (aim), pull the right hand back to the cheek (draw),
    // hold, loose with a snap of the right hand and a kick of the bow, then settle back.
    const ease = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    k.animation('attack', {
      duration: 1.0,
      loop: false,
      pose: (_t, p) => {
        const aim = ease(0, 0.28, p) * (1 - ease(0.78, 1, p));
        const draw = ease(0.28, 0.55, p) * (1 - ease(0.64, 0.68, p));
        const loose = ease(0.64, 0.69, p) * (1 - ease(0.72, 1, p));
        return {
          hips: { move: [0, -0.006 * aim, 0], rotate: [0, -40 * aim, 0] },
          spine: { rotate: [0, -12 * aim, 0] },
          chest: { rotate: [-3 * aim - 4 * loose, -6 * aim, 0] },
          // The head keeps looking at the target while the body turns away.
          head: { rotate: [-4 * draw, 52 * aim, 0] },
          'ear.L': { rotate: [0, 12 * loose - 4 * draw, -6 * draw + 8 * loose] },
          'ear.R': { rotate: [0, -12 * loose + 4 * draw, 6 * draw - 8 * loose] },
          // The bow arm swings out to point at the target; the hand keeps the bow upright.
          'upperarm.L': { rotate: [0, 0, 60 * aim + 6 * loose] },
          'forearm.L': { rotate: [12 * aim, 0, 0] },
          'hand.L': { rotate: [0, 0, -56 * aim - 10 * loose] },
          // The right elbow drops a little at the draw, so the bracer stays clear of the hood.
          'upperarm.R': { rotate: [-78 * aim + 6 * draw, 0, 30 * aim - 20 * draw - 18 * loose] },
          'forearm.R': { rotate: [-40 * aim - 55 * draw + 45 * loose, 0, 0] },
          'leg.L': { rotate: [-8 * aim, 0, 6 * aim] },
          'leg.R': { rotate: [8 * aim, 0, -4 * aim] },
        };
      },
    });
  },
});
