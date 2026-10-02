import { defineAsset, mixRgb, motion, noise, profile, rgb, sdf, THREE } from '../src/index.js';

/**
 * Assassin — Chibi Quest enemy (catalog `enemies/humanoid/assassin`), about 1.0 m tall, faces +Z.
 * Target: docs/enemy-mockups/assassin_001.jpg. Built on the rogue base (rig, knees, clips).
 *
 * Role: a dungeon and city enemy seen in 3D and as a 128 px sprite; the hood, the mask, the pale
 *   angry eyes, the red sash, and the two blades must read small.
 * One idea: a huge deep pointed hood that shadows a narrow angry glare above a grey knit mask.
 * Shape language: round and heavy for the hood and the gloves, with sharp accents (the hood peak,
 *   the curved blades, the pointed tassets).
 * Palette (60/30/10): black-grey cloth #2e2c2c and dark leather #24232a; steel #8a8c92 buckles and
 *   blades; red sash #b83a30 as the one accent, pale eyes #d8e0e0 as the focal point.
 * Value plan: the dark hood frames a small light band (eyes, forehead skin); the mask is the mid
 *   grey; lit leather #363540 on straps and guards separates them from the jerkin.
 * Bodies: skin, mask, hair, hood, jerkin, sleeves, gloves, harness, guards, bracers, sash, clasp,
 *   tassets, buckles, pants, boots, and a blade and a grip in each hand (reverse grip).
 * Rig: the rogue skeleton without the cloak bone; the daggers are rigid on `knife.L`/`knife.R`.
 *   Clips idle, walk, run, attack, attack2, hit, death, victory.
 */

const C = {
  skin: '#f0c8a0',
  eyeWhite: '#d8e0e0',
  pupil: '#2a2a2a',
  rim: '#8a2a26',
  lid: '#1c1416',
  hair: '#1a1816',
  hood: '#2e2c2c',
  hoodLit: '#3e3c3c',
  hoodShade: '#1e1c1c',
  mask: '#5a5858',
  maskLit: '#6a6868',
  maskEdge: '#242224',
  leather: '#26252a',
  strap: '#24232a',
  leatherLit: '#383740',
  leatherMid: '#2c2b30',
  seam: '#1a191e',
  buckle: '#8a8c92',
  sash: '#b83a30',
  sashShade: '#7a2a22',
  clasp: '#3a3a40',
  pants: '#26252a',
  boot: '#1a1a1e',
  sole: '#101013',
  blade: '#8a8c92',
  edge: '#c0c4c8',
  grip: '#2a2a2e',
};

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.092, 0.648] as const; // x (each side), y
const EYE_TILT = 17; // degrees: the outer end rises, so the glare points down to the nose
const pair = (s: sdf.Shape) => s.mirror('x');
const hard = (s: sdf.Shape) => s.mirror('x', 0);

export default defineAsset({
  name: 'assassin',
  description: 'Chibi hooded assassin with a knit mask, a red sash, black leather, and twin curved daggers.',
  detail: 0.006,
  reference: 'docs/enemy-mockups/assassin_001.jpg',
  variants: {
    sash: { red: C.sash, blue: '#2a4a7a', gold: '#c8a030' },
    hood: { black: C.hood, navy: '#22283a', forest: '#22302a' },
    eyes: { pale: C.eyeWhite, green: '#6ad0a0', gold: '#d8b040' },
  },
  presets: {
    nightblade: { sash: 'blue', hood: 'navy', eyes: 'pale' },
    viper: { sash: 'gold', hood: 'forest', eyes: 'green' },
    sellsword: { sash: 'gold', hood: 'black', eyes: 'gold' },
  },

  build(k) {
    const T = {
      hood: k.tint('hood'),
      hoodLit: k.tint('hood', { color: C.hoodLit, follow: 1 }),
      hoodShade: k.tint('hood', { color: C.hoodShade, follow: 1 }),
      sash: k.tint('sash'),
      sashShade: k.tint('sash', { color: C.sashShade, follow: 1 }),
      eyes: k.tint('eyes'),
    };
    // ------------------------------------------------------------------ skeleton
    const SHOULDER = [0.13, 0.385, 0] as const;
    const ELBOW = [0.18, 0.332, 0.012] as const;
    const WRIST = [0.205, 0.238, 0.03] as const;
    const HIP = [0.068, 0.195, 0] as const;
    const ANKLE = [0.098, 0.07, 0] as const;
    const KNEE = [0.083, 0.1325, 0] as const; // the knee: splits the leg (shin.L takes the weight below it)
    const mx = (p: readonly [number, number, number]) => [-p[0], p[1], p[2]] as const;
    // The left dagger's grip center in the fist, and its turn (see inHand below).
    const GRIP = { at: [0.232, 0.172, 0.022] as const, lean: 42, back: 20, roll: 20 };
    k.skeleton({
      hips: { at: [0, 0.2, 0] },
      spine: { parent: 'hips', at: [0, 0.26, 0] },
      chest: { parent: 'spine', at: [0, 0.33, 0] },
      neck: { parent: 'chest', at: [0, 0.43, -0.01] },
      head: { parent: 'neck', at: [0, 0.48, -0.01] },
      'upperarm.L': { parent: 'chest', at: SHOULDER },
      'forearm.L': { parent: 'upperarm.L', at: ELBOW },
      'hand.L': { parent: 'forearm.L', at: WRIST },
      'upperarm.R': { parent: 'chest', at: mx(SHOULDER) },
      'forearm.R': { parent: 'upperarm.R', at: mx(ELBOW) },
      'hand.R': { parent: 'forearm.R', at: mx(WRIST) },
      'knife.L': { parent: 'hand.L', at: GRIP.at },
      'knife.R': { parent: 'hand.R', at: mx(GRIP.at) },
      'leg.L': { parent: 'hips', at: HIP },
      'shin.L': { parent: 'leg.L', at: KNEE, split: 0.015 },
      'foot.L': { parent: 'shin.L', at: ANKLE },
      'leg.R': { parent: 'hips', at: mx(HIP) },
      'shin.R': { parent: 'leg.R', at: mx(KNEE), split: 0.015 },
      'foot.R': { parent: 'shin.R', at: mx(ANKLE) },
    });

    // ------------------------------------------------------------------ head and face
    const head = sdf
      .smoothUnion(
        0.06,
        sdf.ellipsoid(HEAD).at(0, HEAD_Y, 0),
        pair(sdf.sphere(0.1).at(0.095, 0.575, 0.072)), // round cheeks
        sdf.ellipsoid([0.11, 0.055, 0.085]).at(0, 0.53, 0.058), // soft chin
      )
      .bone('head');
    const faceZ = (x: number, y: number) => sdf.raycast(head, [x, y, 1], [0, 0, -1])![2];
    const ears = pair(
      sdf
        .ellipsoid([0.026, 0.044, 0.032])
        .subtract(sdf.sphere(0.017).at(0.016, 0, 0.006))
        .rotateY(-12)
        .at(0.2, 0.61, -0.01)
        .bone('head'),
    );
    const neck = sdf.capsule([0, 0.42, -0.01], [0, 0.52, -0.01], 0.05).bone('neck');

    // Narrow angry eyes: a red rim, a pale white, a dark upper lid, a centered pupil, red corner strokes,
    // and thick brows that slope down toward the nose.
    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const eyeShape = (rx: number, ry: number, dx = 0, dy = 0) =>
      sdf.ellipsoid([rx, ry, 0.07]).at(dx, dy, 0).rotateZ(EYE_TILT);
    const EG = 1.2; // the eye whites are 1.2x the first pass
    const eyeRim = pair(at(eyeShape(0.056 * EG, 0.0245 * EG), EYE[0], EYE[1]));
    const eyeWhiteOne = at(eyeShape(0.048 * EG, 0.019 * EG), EYE[0], EYE[1]);
    const eyeWhite = pair(eyeWhiteOne);
    const eyeLidOne = at(eyeShape(0.05 * EG, 0.0205 * EG, 0, 0.004).subtract(eyeShape(0.05 * EG, 0.0205 * EG, 0, -0.011 * EG)), EYE[0], EYE[1]);
    const eyeLid = pair(eyeLidOne);
    const pupilOne = at(sdf.ellipsoid([0.0155 * 1.12, 0.018 * 1.12, 0.07]), EYE[0], EYE[1] - 0.0005);
    const pupil = pair(pupilOne);
    const cornerAt: [number, number] = [EYE[0] + 0.056 * EG * Math.cos((EYE_TILT * Math.PI) / 180), EYE[1] + 0.056 * EG * Math.sin((EYE_TILT * Math.PI) / 180)];
    const corners = pair(
      sdf
        .union(
          sdf.extrude(profile.rect([0.012, 0.0045], 0.002), 0.3).rotateZ(EYE_TILT + 22).at(cornerAt[0] + 0.006, cornerAt[1] + 0.007, 0.1),
          sdf.extrude(profile.rect([0.01, 0.0045], 0.002), 0.3).rotateZ(EYE_TILT - 30).at(cornerAt[0] + 0.004, cornerAt[1] - 0.007, 0.1),
        ),
    );
    const brows = pair(
      sdf.extrude(profile.rect([0.062, 0.016], 0.006), 0.3).rotateZ(EYE_TILT).at(EYE[0] + 0.004, EYE[1] + 0.042, 0.1),
    );
    const shine = pair(at(sdf.sphere(0.0045), EYE[0] - 0.003, EYE[1] + 0.004));

    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.012, ears)
      .paintWhere(eyeRim, C.rim)
      .paintWhere(eyeWhite, T.eyes)
      .paintWhere(pupil, C.pupil)
      .paintWhere(eyeLid, C.lid)
      .paintWhere(corners, C.rim)
      .paintWhere(brows, C.hair)
      .paintWhere(shine, '#ffffff');
    // A thin pale skin over the eye whites, lightly emissive so the whites stay pale under the hood rim.
    const eyeGlow = pair(
      head
        .round(0.0015)
        .intersect(eyeWhiteOne)
        .subtract(pupilOne, eyeLidOne),
    ).bone('head');
    k.body('eyes', eyeGlow, {
      color: T.eyes,
      emissive: T.eyes,
      emissiveIntensity: 0.3,
      roughness: 0.4,
      detail: 0.003,
      bone: 'head',
    });
    k.body('skin', skin, { color: C.skin, roughness: 0.55, textureDensity: 2, detail: 0.004 });

    // The knit mask over the nose and the mouth, a dark folded band along its top edge.
    const noseBridge = sdf.ellipsoid([0.032, 0.045, 0.032]).at(0, 0.572, faceZ(0, 0.572) + 0.002).bone('head');
    const maskBox = sdf.box([0.6, 0.118, 0.5], 0.02).at(0, 0.53, 0.25);
    const mask = head
      .round(0.011)
      .smoothIntersect(0.008, maskBox)
      .smoothUnion(0.015, noseBridge)
      .paintFn((x, y, z, base) =>
        y > 0.583 ? rgb(C.maskEdge) : y > 0.5 && z > 0.05 ? mixRgb(rgb(C.mask), rgb(C.maskLit), Math.max(0, Math.min(1, (y - 0.5) * 8 * (1 - Math.abs(x) * 3)))) : base,
      );
    const knit = (x: number, y: number, z: number) =>
      0.0007 * Math.sin((y + x + z) * 620) * Math.sin((y - x - z) * 620);
    k.body('mask', mask, { color: C.mask, roughness: 0.95, detail: 0.004, textureDensity: 2, bump: knit });

    // ------------------------------------------------------------------ hood
    const hoodOuter = sdf.smoothUnion(
      0.07,
      sdf.ellipsoid([0.29, 0.285, 0.3]).at(0, 0.685, -0.02),
      sdf.cone([0, 0.88, -0.06], [0, 0.985, 0.0], 0.125, 0.022), // the point leans 0.04 m forward over the brow
    );
    const cavity = sdf.ellipsoid([0.247, 0.235, 0.25]).at(0, 0.68, -0.012);
    // The face opening starts just above the eyes, so the hood edge shadows the brows.
    const opening = sdf.ellipsoid([0.235, 0.125, 0.42]).at(0, 0.62, 0.285);
    // A thick rolled rim around the face opening: it juts forward and shadows the eyes.
    const rim = hoodOuter
      .round(0.01)
      .subtract(cavity.round(-0.004))
      .intersect(opening.round(0.03))
      .subtract(opening);
    // Two soft folds on each side, from the peak down to the collar: chains of shallow grooves
    // that follow the hood's surface.
    const foldLine = (z: number, side: 1 | -1) => {
      const pts: [number, number, number, number][] = [];
      for (const y of [0.52, 0.6, 0.68, 0.76, 0.84, 0.91]) {
        const hit = sdf.raycast(hoodOuter, [side, y, z], [-side, 0, 0]);
        if (hit) pts.push([hit[0], hit[1], hit[2], 0.011]);
      }
      return sdf.chain(pts, 0.01);
    };
    const folds = sdf.union(foldLine(-0.11, 1), foldLine(0.02, 1), foldLine(-0.11, -1), foldLine(0.02, -1));
    const hoodShell = hoodOuter.smoothSubtract(0.02, folds);
    // The back seam.
    const seam = hoodOuter
      .round(0.006)
      .subtract(hoodOuter.round(-0.01))
      .intersect(sdf.box([0.014, 0.4, 0.8], 0.005).at(0, 0.86, -0.05))
      .intersect(sdf.halfSpace([0, 0, 1], 0.1))
      .subtract(opening.round(0.02));
    // A thick rolled collar under the chin, around the neck and the bottom of the mask.
    const collar = sdf.torus(0.11, 0.025).scale([1.2, 1, 0.95]).at(0, 0.485, 0.035);
    const hood = sdf
      .smoothUnion(0.012, hoodShell.subtract(cavity).smoothSubtract(0.02, opening), rim, seam, collar)
      .intersect(sdf.halfSpace([0, -1, 0], -0.43))
      .paintWhere(sdf.ellipsoid([0.2, 0.16, 0.2]).at(0.08, 0.9, -0.03), T.hoodLit, 0.09)
      .paintWhere(cavity.round(0.006), T.hoodShade, 0.012);
    const weaveHood = (x: number, y: number, z: number) => 0.0004 * noise.noise3(x * 90, y * 90, z * 90);
    k.body('hood', hood, { color: T.hood, roughness: 0.9, bone: 'head', bump: weaveHood });

    // ------------------------------------------------------------------ hair fringe (under the hood edge)
    const insideHood = cavity.round(-0.003);
    const faceMask = sdf.ellipsoid([0.25, 0.115, 0.23]).at(0, 0.615, 0.15);
    const cap = sdf
      .ellipsoid([HEAD[0] + 0.012, HEAD[1] + 0.014, HEAD[2] + 0.012])
      .at(0, HEAD_Y + 0.008, -0.01)
      .smoothSubtract(0.015, faceMask);
    // Five black drips hang from the hood edge over the forehead: [x, lowest y].
    const drip = (x: number, tip: number) => {
      const top = tip + 0.035;
      return sdf.cone(
        [x, top, faceZ(Math.abs(x), top) + 0.004],
        [x, tip + 0.006, faceZ(Math.abs(x), tip + 0.006) + 0.007],
        0.015,
        0.006,
      );
    };
    const drips = sdf.union(drip(-0.11, 0.696), drip(-0.055, 0.686), drip(0, 0.69), drip(0.055, 0.684), drip(0.11, 0.697));
    const hair = sdf.smoothUnion(0.018, cap, drips).intersect(insideHood);
    k.body('hair', hair, { color: C.hair, roughness: 0.6, detail: 0.004, bone: 'head' });

    // ------------------------------------------------------------------ jerkin and sleeves
    const torso = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.47],
            [0.07, 0.465],
            [0.105, 0.44],
            [0.125, 0.4],
            [0.13, 0.34],
            [0.124, 0.29],
            [0.132, 0.25],
            [0.142, 0.2],
            [0.148, 0.174],
            [0.138, 0.162],
            [0, 0.162],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.78]);
    // Vertical panel seams: paint one step darker, and a groove in bump.
    const SEAMS = [-0.075, 0, 0.075];
    const seamNear = (x: number) => Math.min(...SEAMS.map((s) => Math.abs(x - s)));
    const jerkin = torso
      .paintWhere(sdf.ellipsoid([0.115, 0.085, 0.2]).at(0, 0.375, 0.12), C.leatherLit, 0.04)
      .paintFn((x, y, _z, base) => (y < 0.44 && seamNear(x) < 0.0032 ? rgb(C.seam) : base));
    const jerkinBump = (x: number, y: number) => (y < 0.44 ? -0.0016 * Math.exp(-((seamNear(x) / 0.004) ** 2)) : 0);
    k.body('jerkin', jerkin.bone('spine'), { color: C.leather, roughness: 0.65, bump: jerkinBump });
    const sleeve = sdf.smoothUnion(
      0.02,
      sdf.cone([0.11, 0.405, 0], ELBOW, 0.047, 0.042).bone('upperarm.L'),
      sdf.cone(ELBOW, WRIST, 0.037, 0.033).bone('forearm.L'),
    );
    k.body('sleeves', pair(sleeve), { color: C.leather, roughness: 0.8 });

    // ------------------------------------------------------------------ harness, guards, bracers
    const beltY = 0.252;
    const strapBand = (angle: number) =>
      torso.round(0.008).smoothIntersect(0.005, sdf.box([0.6, 0.027, 0.6], 0.005).rotateZ(angle).at(0.02, 0.345, 0));
    const harness = hard(strapBand(-24));
    const strapBuckle = (x: number, y: number, angle: number) => {
      const p = sdf.surfacePoint(harness, [x, y, 0.25], 0.002);
      return sdf
        .box([0.03, 0.034, 0.009], 0.004)
        .subtract(sdf.box([0.016, 0.02, 0.03], 0.002))
        .rotateZ(angle)
        .rotateY(x > 0 ? 24 : -24)
        .at(...p);
    };
    const buckles = sdf.union(
      strapBuckle(-0.07, 0.385, -24),
      strapBuckle(0.07, 0.385, 24),
      strapBuckle(0.07, 0.323, -24),
      strapBuckle(-0.07, 0.323, 24),
    );
    // Two stacked plates on each shoulder.
    const guards = pair(
      sdf
        .union(
          sdf.ellipsoid([0.066, 0.02, 0.062]).rotateZ(-28).at(0.148, 0.428, 0).paint(C.leatherLit),
          sdf.ellipsoid([0.076, 0.021, 0.068]).rotateZ(-30).at(0.168, 0.4, 0).paint(C.leatherMid),
        )
        .bone('upperarm.L'),
    );
    // Segmented bracers: three stacked short cones per forearm.
    const lerp3 = (a: readonly [number, number, number], b: readonly [number, number, number], t: number) =>
      [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t] as [number, number, number];
    const bElbow = [0.186, 0.345, 0.014] as const;
    const bWrist = [0.207, 0.232, 0.031] as const;
    const bracerSeg = (t0: number, t1: number) => {
      const r = (t: number) => 0.046 + (0.06 - 0.046) * t - 0.005;
      return sdf
        .cone(lerp3(bElbow, bWrist, t0 + 0.02), lerp3(bElbow, bWrist, t1 - 0.02), r(t0), r(t1))
        .round(0.005)
        .paint(t0 === 0 ? C.leatherMid : t0 > 0.5 ? C.leatherLit : C.leatherMid);
    };
    const bracer = sdf
      .union(bracerSeg(0, 0.34), bracerSeg(0.33, 0.67), bracerSeg(0.66, 1))
      .bone('forearm.L');
    k.body('harness', harness.bone('spine').paint(C.strap), { color: C.strap, roughness: 0.55 });
    k.body('guards', guards, { color: C.leatherLit, roughness: 0.6 });
    k.body('bracers', pair(bracer), { color: C.leatherMid, roughness: 0.6 });

    // Gloves.
    const fist = sdf
      .smoothUnion(
        0.018,
        sdf.ellipsoid([0.04, 0.045, 0.046]).at(0.212, 0.2, 0.034), // palm and closed fingers
        sdf.capsule([0.196, 0.18, 0.06], [0.2, 0.2, 0.074], 0.018), // finger roll at the front
        sdf.cone([0.225, 0.215, 0.055], [0.206, 0.205, 0.08], 0.017, 0.014), // thumb over the fingers
      )
      .at(-0.212, -0.2, -0.034)
      .scale(1.15)
      .at(0.212, 0.2, 0.034);
    const glove = sdf
      .union(
        fist,
        sdf.torus(0.045, 0.01).rotateZ(10.7).at(0.207, 0.226, 0.033).paint(C.leatherLit), // the wrist cuff
      )
      .bone('hand.L');
    k.body('gloves', pair(glove), { color: C.leather, roughness: 0.7 });

    // ------------------------------------------------------------------ red sash, clasp, tassets
    const belt = torso.round(0.012).smoothIntersect(0.006, sdf.box([0.5, 0.064, 0.5], 0.008).at(0, beltY, 0));
    const sash = belt.paintWhere(sdf.halfSpace([0, 1, 0], beltY - 0.018), T.sashShade, 0.008);
    k.body('sash', sash.bone('spine'), { color: T.sash, roughness: 0.85 });
    const beltZ = sdf.raycast(belt, [0, beltY, 1], [0, 0, -1])![2];
    const dot = (x: number, y: number) => sdf.sphere(0.0035).at(x, beltY + y, beltZ + 0.011);
    const clasp = sdf
      .cylinder(0.03, 0.016, 0.004)
      .rotateX(90)
      .at(0, beltY, beltZ + 0.004)
      .paintWhere(sdf.union(dot(0.009, 0.009), dot(-0.009, 0.009), dot(0.009, -0.009), dot(-0.009, -0.009)), '#5a5a62');
    k.body('clasp', clasp.bone('spine'), { color: C.clasp, roughness: 0.4, metalness: 0.6 });

    // Hip tassets: pointed leather flaps that hang from the sash, two on each hip.
    const flapOutline = profile.polygon(
      [
        [-0.035, 0.055],
        [0.035, 0.055],
        [0.035, -0.025],
        [0, -0.055],
        [-0.035, -0.025],
      ],
      { smooth: false },
    );
    const flap = (x: number, y: number, yaw: number) => {
      const p = sdf.surfacePoint(torso, [x, y, 0.3], 0.006);
      return sdf.extrude(flapOutline, 0.012, 0.004).paint(C.leatherLit).rotateY(yaw).at(p[0], y, p[2]);
    };
    const tassets = pair(sdf.union(flap(0.085, 0.192, 30), flap(0.13, 0.19, 58)).bone('spine'));
    k.body('tassets', tassets, { color: C.leatherLit, roughness: 0.65 });
    const flapRing = (x: number, y: number, yaw: number) => {
      const p = sdf.surfacePoint(torso, [x, y, 0.3], 0.02);
      return sdf.torus(0.011, 0.0035).rotateY(yaw).at(p[0], y, p[2]);
    };
    // Silver: strap buckles and a ring on each front flap.
    k.body('buckles', sdf.union(buckles.bone('spine'), pair(flapRing(0.085, 0.17, 30)).bone('spine')), {
      color: C.buckle,
      roughness: 0.32,
      metalness: 0.8,
    });

    // ------------------------------------------------------------------ legs and boots
    const pants = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.115, 0.05, 0.085]).at(0, 0.2, 0).bone('hips'),
      pair(sdf.capsule([HIP[0], 0.2, 0], [0.094, 0.11, 0.004], 0.05).bone('leg.L')),
    );
    k.body('pants', pants, { color: C.pants, roughness: 0.85 });

    // Soft boots, built at the ankle's ground point, then turned out a little.
    const bootFoot = sdf
      .smoothUnion(
        0.035,
        sdf.cylinder(0.05, 0.09, 0.02).at(0, 0.07, 0),
        sdf.ellipsoid([0.058, 0.055, 0.1]).at(0, 0.052, 0.045),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const sole = bootFoot.round(0.005).intersect(sdf.halfSpace([0, 1, 0], 0.018)).intersect(sdf.halfSpace([0, -1, 0], 0));
    const bootCuff = sdf.cylinder(0.057, 0.032, 0.013).at(0, 0.1, 0);
    const boot = sdf
      .union(bootFoot, sole.paint(C.sole), bootCuff.paint(C.leatherMid))
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.7 });

    // ------------------------------------------------------------------ curved daggers (reverse grip)
    // Local frame: origin at the grip center, the blade up (+Y) curving toward +X, flat facing +Z.
    const GUARD = 0.034;
    const BLADE = 0.24;
    const curveX = (t: number) => 0.06 * t * t;
    const halfW = (t: number) => 0.0175 * (1 - t) ** 0.7 + 0.0025;
    const spine: [number, number][] = [];
    const edgeLine: [number, number][] = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      spine.push([curveX(t) - halfW(t), GUARD + BLADE * t]);
      edgeLine.push([curveX(t) + halfW(t), GUARD + BLADE * t]);
    }
    const bladeProfile = profile.polygon([...spine, ...edgeLine.reverse()], { smooth: false });
    const handBlade = sdf
      .union(
        sdf
          .extrude(bladeProfile, 0.014, 0.004)
          .paintFn((x, y, _z, base) => {
            const t = Math.min(1, Math.max(0, (y - GUARD) / BLADE));
            return x > curveX(t) + halfW(t) * 0.25 ? rgb(C.edge) : base;
          }),
        sdf.box([0.05, 0.011, 0.024], 0.004).at(0.004, GUARD, 0).paint(C.clasp), // guard
        sdf.sphere(0.01).at(0, -0.058, 0).paint(C.clasp), // pommel
      );
    const handGrip = sdf.capsule([0, -0.05, 0], [0, GUARD, 0], 0.011);
    const inHand = (s: sdf.Shape, side: 1 | -1) =>
      s
        .rotateY(GRIP.roll * side)
        .rotateZ(-GRIP.lean * side)
        .rotateX(-GRIP.back)
        .at(GRIP.at[0] * side, GRIP.at[1], GRIP.at[2]);
    for (const [side, tag] of [
      [1, 'L'],
      [-1, 'R'],
    ] as const) {
      k.body(`dagger.${tag}`, inHand(handBlade, side), {
        color: C.blade,
        roughness: 0.3,
        metalness: 0.85,
        bone: `knife.${tag}`,
        detail: 0.004,
      });
      k.body(`daggerGrip.${tag}`, inHand(handGrip, side), { color: C.grip, roughness: 0.6, bone: `knife.${tag}` });
    }

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop } = motion;
    const LEG = 0.19;

    k.animation('idle', {
      duration: 2.4,
      pose: (_t, p) => ({
        hips: { move: [0, -0.003 * bump(p), 0] },
        chest: { rotate: [2.5 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        head: { rotate: [0, 5 * wave(p, 1, 0.25), 2 * wave(p, 1, 0.1)] },
        'upperarm.L': { rotate: [2 * wave(p, 1, 0.1), 0, 3 * bump(p)] },
        'upperarm.R': { rotate: [2 * wave(p, 1, 0.1), 0, -3 * bump(p)] },
        'forearm.L': { rotate: [-5 * bump(p), 0, 0] },
        'forearm.R': { rotate: [-5 * bump(p), 0, 0] },
      }),
    });

    // The legs come from motion.gait: planted stance feet, a knee lift in the swing, heel strike
    // and toe-off. `step` is the foot travel, `lift` the swing height, `duty` the share of the
    // cycle a foot is down (a run has a flight between steps), `hop` the hips bob.
    const stride = (duration: number, step: number, lift: number, duty: number, armSwing: number, lean: number, hop: number, flow: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        const hipsTurn = [0, 7 * s, 0] as const;
        const legs = motion.gait(p - 0.25, { hip: HIP, knee: KNEE, ankle: ANKLE }, { // left heel strike at 0.25, with the left arm back
          stride: step,
          lift,
          duty,
          bob: hop,
          roll: 10,
          heel: [ANKLE[0], 0, -0.045],
          toe: [ANKLE[0], 0, 0.11],
          hips: { at: [0, 0.2, 0], rotate: hipsTurn },
        });
        return {
          ...legs.pose,
          hips: { move: [0, legs.hipsY, 0] as const, rotate: hipsTurn },
          spine: { rotate: [lean, 0, 0] as const },
          chest: { rotate: [lean * 0.5, -11 * s, 0] as const },
          head: { rotate: [-lean, 5 * s, 0] as const },
          // The cape trails behind and flutters twice per cycle, a little after the steps.
          'upperarm.L': { rotate: [armSwing * s, 0, 6] as const },
          'upperarm.R': { rotate: [-armSwing * s, 0, -6] as const },
          'forearm.L': { rotate: [-armSwing * 0.5 - armSwing * 0.4 * Math.max(0, -s), 0, 0] as const },
          'forearm.R': { rotate: [-armSwing * 0.5 - armSwing * 0.4 * Math.max(0, s), 0, 0] as const },
        };
      },
    });
    k.animation('walk', stride(0.9, 0.1, 0.025, 0.6, 28, 3, 0.006, 6));
    k.animation('run', stride(0.56, 0.15, 0.045, 0.4, 50, 12, 0.03, 22));

    // Attack: a fast reverse-grip double slash, solved by targets. Each wrist follows keys in the
    // chest's rest frame (reach); each blade follows its own direction keys (orient), and edgeUp
    // turns the flat so the edge leads. She coils low to her right with both fists at the hips;
    // the torso unwinds and carries the right fist across the front from right to left, the blade
    // trailing flat with the edge out; the torso winds back into the left fist's mirror slash while
    // the right fist returns to its hip; the left foot steps in; then back to rest. The paths stay
    // at chest height, in front of the mantle, beside the cape, and far below the hood.
    const { keys, reach, orient, edgeUp } = motion;
    type V3 = readonly [number, number, number];
    const norm = (a: V3): V3 => {
      const l = Math.hypot(a[0], a[1], a[2]);
      return [a[0] / l, a[1] / l, a[2] / l];
    };
    // The blade's rest direction (local +Y) and its flat's normal (local +Z), turned as inHand turns them.
    const turn = (v: V3, axis: 0 | 1 | 2, deg: number): V3 => {
      const c = Math.cos((deg * Math.PI) / 180);
      const s = Math.sin((deg * Math.PI) / 180);
      const [x, y, z] = v;
      if (axis === 0) return [x, y * c - z * s, y * s + z * c];
      if (axis === 1) return [x * c + z * s, y, -x * s + z * c];
      return [x * c - y * s, x * s + y * c, z];
    };
    const inHandDir = (v: V3, side: 1 | -1) => turn(turn(turn(v, 1, GRIP.roll * side), 2, -GRIP.lean * side), 0, -GRIP.back);
    const SLASH_UP = norm([0, 1, 0.3]); // in a slash the flat faces up, so one edge faces out
    // One arm's part of the combo. The keys are written for the right arm (x < 0); the left arm
    // uses their mirror. `s` is the phase where this arm's slash starts.
    const slashArm = (side: 1 | -1, s: number) => {
      const m = (v: V3): V3 => [side === 1 ? -v[0] : v[0], v[1], v[2]];
      const tag = side === 1 ? 'L' : 'R';
      const chain = { root: m(mx(SHOULDER)), mid: m(mx(ELBOW)), end: m(mx(WRIST)) };
      const rest = { dir: inHandDir([0, 1, 0], side), up: inHandDir([0, 0, 1], side) };
      const wristKeys: [number, V3][] = [
        [0, chain.end],
        [0.22, m([-0.21, 0.255, 0.005])], // drawn back at the hip
        [s, m([-0.215, 0.26, 0])],
        [s + 0.04, m([-0.235, 0.3, 0.075])], // out at the side, rising
        [s + 0.08, m([-0.14, 0.33, 0.155])], // in front, chest high
        [s + 0.12, m([-0.06, 0.34, 0.15])], // across the front
        [s + 0.16, m([-0.09, 0.33, 0.15])],
        [s + 0.19, m([-0.16, 0.27, 0.12])], // drops below the mantle's hem on the way back
        [s + 0.23, m([-0.21, 0.27, 0.03])], // back at the hip, clear of the other arm
        [0.66, m([-0.21, 0.26, 0.025])],
        [1, chain.end],
      ];
      const bladeKeys: [number, V3][] = [
        [0, rest.dir],
        [0.22, m([-0.72, 0.6, -0.35])], // up and back beside the forearm
        [s, m([-0.74, 0.56, -0.37])],
        [s + 0.04, m([-0.9, 0.15, -0.42])], // lies down flat, trailing the fist
        [s + 0.08, m([-0.97, 0, -0.22])],
        [s + 0.12, m([-0.95, -0.02, 0.2])],
        [s + 0.16, m([-0.9, 0, 0.35])], // the fist stops and the blade swings on a little
        [s + 0.19, m([-0.92, 0.12, 0.2])],
        [s + 0.23, m([-0.78, 0.45, -0.4])],
        [0.66, m([-0.72, 0.6, -0.33])],
        [1, rest.dir],
      ];
      const upKeys: [number, V3][] = [
        [0, rest.up],
        [s, rest.up],
        [s + 0.05, SLASH_UP],
        [s + 0.16, SLASH_UP],
        [s + 0.24, rest.up],
        [1, rest.up],
      ];
      const poleKeys: [number, V3][] = [
        [0, m([-0.58, 0.6, -0.015])], // the rest bend plane
        [0.22, m([-0.6, 0.25, -0.3])], // elbow out and back
        [s, m([-0.6, 0.25, -0.3])],
        [s + 0.06, m([-0.55, 0.45, -0.05])], // elbow out to the side for the sweep
        [s + 0.16, m([-0.55, 0.45, -0.05])],
        [s + 0.22, m([-0.6, 0.25, -0.3])],
        [0.66, m([-0.6, 0.25, -0.3])],
        [1, m([-0.58, 0.6, -0.015])],
      ];
      const bladeAt = (q: number) => norm(keys(q, bladeKeys, 'spline'));
      return (p: number) => {
        const arm = reach(chain, keys(p, wristKeys, 'spline'), keys(p, poleKeys));
        const up = edgeUp(bladeAt, p, keys(p, upKeys));
        const hand = orient([arm.upper, arm.lower], rest, { dir: bladeAt(p), up });
        return {
          [`upperarm.${tag}`]: { rotate: arm.upper },
          [`forearm.${tag}`]: { rotate: arm.lower },
          [`hand.${tag}`]: { rotate: hand },
        };
      };
    };
    const armR = slashArm(-1, 0.27);
    const armL = slashArm(1, 0.38);
    const rad = Math.PI / 180;
    k.animation('attack', {
      duration: 0.85,
      loop: false,
      pose: (_t, p) => {
        // +Y turns the front toward her left: coil right, unwind left (slash 1), wind right (slash 2).
        const hipsY = keys(p, [[0, 0], [0.22, -12], [0.27, -12], [0.39, 14], [0.41, 14], [0.5, -12], [0.58, -10], [1, 0]] as const);
        const chestY = keys(p, [[0, 0], [0.22, -20], [0.27, -20], [0.38, 22], [0.41, 22], [0.49, -22], [0.58, -18], [1, 0]] as const);
        const lean = keys(p, [[0, 0], [0.22, 9], [0.3, 7], [0.45, 9], [0.58, 7], [1, 0]] as const);
        // The low stance: the legs spread, then the left (front) foot steps in and the hips follow.
        const legX = keys(p, [[0, 0], [0.22, -8], [0.3, -9], [0.4, -17], [0.62, -17], [1, 0]] as const);
        const legZ = keys(p, [[0, 0], [0.22, 10], [0.4, 6], [0.62, 6], [1, 0]] as const);
        const stepZ = keys(p, [[0, 0], [0.22, -0.01], [0.3, -0.008], [0.4, 0.028], [0.62, 0.028], [1, 0]] as const);
        const drop = LEG * (1 - Math.cos(legX * rad) * Math.cos(legZ * rad));
        return {
          hips: { move: [0, -drop, stepZ], rotate: [0, hipsY, 0] },
          spine: { rotate: [lean, 0, 0] },
          chest: { rotate: [lean / 3, chestY, 0] },
          head: { rotate: [-0.6 * lean, -0.55 * (hipsY + chestY), 0] },
          'leg.L': { rotate: [legX, 0, legZ] },
          'leg.R': { rotate: [-legX, 0, -legZ] },
          'foot.L': { rotate: [-legX, 0, -legZ] },
          'foot.R': { rotate: [legX, 0, legZ] },
          ...armR(p),
          ...armL(p),
        };
      },
    });

    // ------------------------------------------------------------------ hit: a blow from the front
    // The chest snaps back and the right foot steps back, then all returns quickly. The head (and so
    // the hood) whips back a beat after the chest and overshoots a little; the cape swings late. The
    // arms fly a little forward and out, so the daggers stay outside the body and far below the hood.
    const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
    k.animation('hit', {
      duration: 0.4,
      loop: false,
      pose: (_t, p) => {
        const h = keys(p, [[0, 0], [0.14, 1], [0.34, 0.6], [1, 0]] as const);
        const whip = keys(p, [[0, 0], [0.2, 1], [0.4, 0.5], [0.6, -0.2], [0.82, 0]] as const, 'spline');
        const step = keys(p, [[0.04, 0], [0.24, 1], [0.58, 1], [0.9, 0]] as const);
        const lift = bump(clamp01((p - 0.04) / 0.2)) + bump(clamp01((p - 0.58) / 0.32));
        const lag = keys(p, [[0, 0], [0.12, 0.3], [0.28, 1], [0.5, -0.45], [0.74, 0.15], [1, 0]] as const, 'spline');
        const back = 0.03 * step;
        const lean = Math.asin(back / LEG) / rad; // the left foot stays planted as the hips move back
        return {
          hips: { move: [0, -legDrop(LEG, lean), -back], rotate: [0, 5 * h, 0] },
          spine: { rotate: [-7 * h, 0, 0] },
          chest: { rotate: [-9 * h, 6 * h, -3 * h] },
          neck: { rotate: [-4 * whip, 0, 0] },
          head: { rotate: [-10 * whip, -6 * whip, 4 * whip] },
          'upperarm.L': { rotate: [-12 * h, 0, 16 * h] },
          'forearm.L': { rotate: [-16 * h, 0, 0] },
          'upperarm.R': { rotate: [-8 * h, 0, -14 * h] },
          'forearm.R': { rotate: [-12 * h, 0, 0] },
          'leg.L': { rotate: [-lean, 0, 0] },
          'leg.R': { rotate: [lean + 8 * lift, 0, 0] },
          'foot.L': { rotate: [lean, 0, 0] },
          'foot.R': { rotate: [-lean - 8 * lift, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ death: a stagger, then a fall on the back
    // The blow snaps her back; she slumps forward and wobbles over planted feet, then tips back over
    // her heels and lands on her back. The big hood and the cape hold the upper body up, so the neck
    // bends forward and the head turns to the side. The cape swings toward the legs and flattens
    // under her. The arms fly out and fall to the ground at her sides (targets solved in the chest's
    // rest frame); the fists open and each dagger, on its `knife` bone, drops and lies flat on the
    // floor beside its hand.
    const { follow, quat, euler } = motion;
    const add = (a: V3, b: V3, s = 1): V3 => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
    const lerp = (a: V3, b: V3, t: number): V3 => add(a, add(b, a, -1), t);
    const LIE = 78; // the hips' final tilt back, degrees
    const LIE_Y = 0.178; // the hips' height when she lies on her back
    const HEEL = 0.05; // the back of the boot, behind the ankle's ground point
    const FIST_Y = 0.03; // the fist center on the ground
    const BEND_NECK = 10; // the neck and the head bend forward, so the hood props the head up like a pillow
    const BEND_HEAD = 12;
    const TURN = 22; // the head turns toward her left
    const HIPS0: V3 = [0, 0.2, 0];
    const TRUNK: readonly V3[] = [HIPS0, [0, 0.26, 0], [0, 0.33, 0]];
    const END: V3 = [0, LIE_Y - 0.2, -HEEL - 0.2 * Math.sin(LIE * rad) + HEEL * Math.cos(LIE * rad)];
    const toWorld = (v: V3): V3 => add(add(HIPS0, END), turn(add(v, HIPS0, -1), 0, -LIE));
    const toBody = (w: V3): V3 => add(HIPS0, turn(add(w, add(HIPS0, END), -1), 0, LIE));
    const LEG_DOWN = Math.asin(clamp01((LIE_Y - 0.035) / 0.165)) / rad - (90 - LIE); // the legs lie down to the floor
    type Weights = { hitB: number; sag: number; fly: number; land: number; loose: number };
    const deathArm = (side: 1 | -1) => {
      const f = (v: V3): V3 => [v[0] * side, v[1], v[2]];
      const tag = side === 1 ? 'L' : 'R';
      const chain = { root: f(SHOULDER), mid: f(ELBOW), end: f(GRIP.at) }; // the hand stays straight
      const joints: readonly V3[] = [...TRUNK, chain.root, chain.mid, f(WRIST)];
      const shoulderW = toWorld(chain.root);
      const span = Math.sqrt(Math.max(0, 0.23 ** 2 - (shoulderW[1] - FIST_Y) ** 2));
      const out = norm([0.93 * side, 0, 0.37]);
      const fistW: V3 = [shoulderW[0] + out[0] * span, FIST_Y, shoulderW[2] + out[2] * span];
      const fistEnd = toBody(fistW);
      // The dagger lies flat beside the fist, the pommel toward the hand and the point out and down the body.
      const knifeAt: V3 = [fistW[0] + 0.095 * side, 0.015, fistW[2] + 0.05];
      const dropKeys: [number, V3][] = [
        [0.44, add(knifeAt, [0, 0.12, 0])],
        [0.6, knifeAt],
        [0.65, add(knifeAt, [0, 0.015, 0])],
        [0.7, knifeAt],
      ];
      const rest = { dir: inHandDir([0, 1, 0], side), up: inHandDir([0, 0, 1], side) };
      const dropTurn = quat(orient([], rest, { dir: norm([0.6 * side, 0, 0.8]), up: [0, 1, 0] }));
      return (p: number, trunk: readonly V3[], move: V3, w: Weights) => {
        const stand = add(add(add(chain.end, f([0.05, 0.05, 0.05]), w.hitB), [0, -0.03, 0.02], w.sag), f([0.08, 0.06, 0.03]), w.fly);
        const arm = reach(chain, lerp(stand, fistEnd, w.land), lerp(f([0.58, 0.6, -0.015]), f([0.6, 0.45, 0.1]), w.land));
        const rots: V3[] = [...trunk, arm.upper, arm.lower, [0, 0, 0]];
        const handQ = rots.slice(0, 5).reduce((q, r) => q.multiply(quat(r)), new THREE.Quaternion());
        const inv = handQ.clone().invert();
        const held = add(follow(joints, rots, chain.end), move);
        const d = new THREE.Vector3(...add(lerp(held, keys(p, dropKeys), w.loose), held, -1)).applyQuaternion(inv);
        return {
          [`upperarm.${tag}`]: { rotate: arm.upper },
          [`forearm.${tag}`]: { rotate: arm.lower },
          [`knife.${tag}`]: { move: [d.x, d.y, d.z] as V3, rotate: euler(inv.clone().multiply(handQ.clone().slerp(dropTurn, w.loose))) },
        };
      };
    };
    const deathL = deathArm(1);
    const deathR = deathArm(-1);
    k.animation('death', {
      duration: 1.4,
      loop: false,
      pose: (_t, p) => {
        const hitB = keys(p, [[0, 0], [0.07, 1], [0.18, 0.5], [0.3, 0.2], [0.4, 0]] as const);
        const sag = keys(p, [[0.1, 0], [0.26, 1], [0.36, 0.8], [0.5, 0]] as const);
        const wob = keys(p, [[0.12, 0], [0.22, 1], [0.32, -0.6], [0.42, 0]] as const);
        const u = clamp01((p - 0.36) / 0.24); // the fall speeds up to the impact
        const bounce = keys(p, [[0.6, 0], [0.66, 1], [0.73, 0]] as const);
        const tilt = LIE * u * u - 4 * bounce;
        const fly = keys(p, [[0.36, 0], [0.5, 1], [0.62, 0.2], [0.7, 0]] as const);
        const land = keys(p, [[0.44, 0], [0.62, 1]] as const);
        const loose = keys(p, [[0.44, 0], [0.6, 1]] as const);
        const settle = keys(p, [[0.56, 0], [0.8, 1]] as const);
        const flat = keys(p, [[0.4, 0], [0.62, 1]] as const);
        const crumple = keys(p, [[0.42, 0], [0.56, 1], [0.72, 1], [0.9, 0]] as const);
        // The stagger: the hips give way backward over planted feet.
        const back = 0.022 * hitB;
        const lean = Math.asin(back / LEG) / rad;
        // The fall: a rigid tip over the back of the heels, until the hips reach their lying height.
        const a = tilt * rad;
        const hipsY = Math.max(LIE_Y, 0.2 * Math.cos(a) + HEEL * Math.sin(a));
        const hipsMove: V3 = [0, hipsY - 0.2 - legDrop(LEG, lean), -HEEL - 0.2 * Math.sin(a) + HEEL * Math.cos(a) - back];
        const hipsR: V3 = [-tilt, 0, 0];
        const spineR: V3 = [-8 * hitB + 6 * sag, 0, 4 * wob];
        const chestR: V3 = [-10 * hitB + 5 * sag, 6 * hitB, 5 * wob];
        const legs = LEG_DOWN * clamp01((tilt - LIE + 18) / 18);
        const w = { hitB, sag, fly, land, loose };
        return {
          hips: { move: hipsMove, rotate: hipsR },
          spine: { rotate: spineR },
          chest: { rotate: chestR },
          neck: { rotate: [-8 * hitB + 5 * sag + BEND_NECK * land, 0, 0] },
          head: { rotate: [-14 * hitB + 8 * sag + BEND_HEAD * land, -8 * hitB + TURN * settle, 8 * wob] },
          'leg.L': { rotate: [-lean + legs, 0, 8 * land] },
          'leg.R': { rotate: [-lean + legs, 0, -8 * land] },
          'foot.L': { rotate: [lean + 10 * settle, 18 * settle, 0] },
          'foot.R': { rotate: [lean + 10 * settle, -18 * settle, 0] },
          ...deathL(p, [hipsR, spineR, chestR], hipsMove, w),
          ...deathR(p, [hipsR, spineR, chestR], hipsMove, w),
        };
      },
    });

    // ------------------------------------------------------------------ arm posing for attack2 and victory
    // One arm from a wrist target, an elbow pole, the blade's direction, and the flat's normal, all in
    // the chest's rest frame (as in the attack). Keys are written for the right arm (x < 0); `m`
    // mirrors them for the left arm.
    const armRig = (side: 1 | -1) => {
      const m = (v: V3): V3 => [side === 1 ? -v[0] : v[0], v[1], v[2]];
      const tag = side === 1 ? 'L' : 'R';
      const chain = { root: m(mx(SHOULDER)), mid: m(mx(ELBOW)), end: m(mx(WRIST)) };
      const rest = { dir: inHandDir([0, 1, 0], side), up: inHandDir([0, 0, 1], side) };
      const solve = (wrist: V3, pole: V3, dir: V3, up: V3) => {
        const arm = reach(chain, wrist, pole);
        const hand = orient([arm.upper, arm.lower], rest, { dir: norm(dir), up: norm(up) });
        const rots: V3[] = [arm.upper, arm.lower, hand];
        return {
          rots,
          bones: {
            [`upperarm.${tag}`]: { rotate: arm.upper },
            [`forearm.${tag}`]: { rotate: arm.lower },
            [`hand.${tag}`]: { rotate: hand },
          },
        };
      };
      return {
        m,
        chain,
        rest,
        pole: m([-0.58, 0.6, -0.015]), // the rest bend plane
        back: m([-0.6, 0.25, -0.3]), // elbow out and back
        side: m([-0.55, 0.45, -0.05]), // elbow out to the side
        low: m([-0.3, 0.12, 0.08]), // elbow down, under the mantle
        solve,
      };
    };

    // ------------------------------------------------------------------ attack2: a spinning slash
    // She crouches and coils to her right with both fists drawn back at the hips, then spins one full
    // turn to her left (+Y) on the spot with a small hop, the chest a little ahead of the hips. Both
    // fists go out at chest height with the blades flat and pointing out, so the steel sweeps a circle
    // around her, outside the mantle and the cape and far below the hood. The cape lags and flares out
    // with the spin. She lands in the crouch, facing forward, and rises to her stance.
    const spinArm = (side: 1 | -1) => {
      const a = armRig(side);
      const { m } = a;
      const out = m([-0.25, 0.355, 0.075]); // the wrist, out at chest height (the fist hangs a little lower)
      const coil = m([-0.62, 0.3, -0.14]); // elbow out and a little back, so the bracer stays out of the mantle
      const outDir = m([-0.95, 0.1, -0.28]); // the blade out and flat, trailing a little
      const wristKeys: [number, V3][] = [
        [0, a.chain.end],
        [0.18, m([-0.21, 0.255, 0.005])], // drawn back at the hip in the crouch
        [0.24, m([-0.215, 0.26, 0])],
        [0.34, out],
        [0.64, out],
        [0.76, m([-0.21, 0.265, 0.025])],
        [1, a.chain.end],
      ];
      const bladeKeys: [number, V3][] = [
        [0, a.rest.dir],
        [0.18, m([-0.72, 0.6, -0.35])], // up and back beside the forearm
        [0.24, m([-0.74, 0.56, -0.37])],
        [0.34, outDir],
        [0.64, outDir],
        [0.76, m([-0.76, 0.5, -0.38])],
        [1, a.rest.dir],
      ];
      const upKeys: [number, V3][] = [
        [0, a.rest.up],
        [0.24, a.rest.up],
        [0.34, [0, 1, 0]], // the flat faces up, so the edges cut around the circle
        [0.64, [0, 1, 0]],
        [0.76, a.rest.up],
        [1, a.rest.up],
      ];
      const poleKeys: [number, V3][] = [
        [0, a.pole],
        [0.18, coil],
        [0.24, coil],
        [0.34, a.side], // elbow out to the side
        [0.64, a.side],
        [0.76, coil],
        [1, a.pole],
      ];
      return (p: number) => a.solve(keys(p, wristKeys), keys(p, poleKeys), keys(p, bladeKeys), keys(p, upKeys)).bones;
    };
    const spinR = spinArm(-1);
    const spinL = spinArm(1);
    k.animation('attack2', {
      duration: 0.85,
      loop: false,
      pose: (_t, p) => {
        const hipsY = keys(p, [[0, 0], [0.18, -20], [0.24, -20], [0.66, 360], [1, 360]] as const);
        const lead = keys(p, [[0, 0], [0.18, -22], [0.24, -22], [0.36, 22], [0.56, 16], [0.7, 0], [1, 0]] as const);
        const lean = keys(p, [[0, 0], [0.18, 12], [0.28, 7], [0.45, 3], [0.68, 9], [0.78, 9], [1, 0]] as const);
        const legZ = keys(p, [[0, 0], [0.18, 13], [0.28, 9], [0.42, 3], [0.56, 3], [0.68, 13], [0.8, 13], [1, 0]] as const);
        const hop = 0.03 * keys(p, [[0.28, 0], [0.45, 1], [0.62, 0]] as const);
        const flare = keys(p, [[0.24, 0], [0.42, 1], [0.64, 1], [0.82, 0.15], [1, 0]] as const);
        const drop = LEG * (1 - Math.cos(legZ * rad));
        return {
          hips: { move: [0, hop - drop, 0], rotate: [0, hipsY, 0] },
          spine: { rotate: [lean, 0, 0] },
          chest: { rotate: [lean / 3, lead, 0] },
          head: { rotate: [-0.6 * lean, -0.6 * lead, 0] },
          'leg.L': { rotate: [0, 0, legZ] },
          'leg.R': { rotate: [0, 0, -legZ] },
          'foot.L': { rotate: [0, 0, -legZ] },
          'foot.R': { rotate: [0, 0, legZ] },
          ...spinR(p),
          ...spinL(p),
        };
      },
    });

    // ------------------------------------------------------------------ victory: a knife flip, then crossed daggers
    // She dips the right fist and flicks it up: the right dagger (bone `knife.R`) leaves the hand,
    // rises out to her right side, flips once about the world X axis, and drops back into the fist.
    // The flight stays outside the hood's widest point. Then she crosses the daggers in front of her
    // chest (the blades point a little up and across, the right blade in front, the blades tilt
    // forward and stay below the clasp and the collar; the elbows stay down under the mantle), leans
    // back a little, and tilts her head with a sly look. She holds the pose to the end.
    const vicR = armRig(-1);
    const vicL = armRig(1);
    const CROSS_UP: V3 = [0, -0.45, 1]; // the flats face forward, so both blades read at full width
    const crossR: V3 = [-0.06, 0.29, 0.165]; // at full reach; inside the mantle's front edge
    const crossL: V3 = [0.08, 0.285, 0.135]; // behind the right fist, so the blades pass without touching
    const vicKeysR = {
      wrist: [
        [0, vicR.chain.end],
        [0.08, [-0.215, 0.235, 0.075]], // the fist dips
        [0.15, [-0.235, 0.3, 0.1]], // and flicks up: the dagger leaves the hand
        [0.38, [-0.235, 0.3, 0.1]],
        [0.44, [-0.225, 0.272, 0.09]], // the catch gives a little
        [0.52, [-0.225, 0.28, 0.09]],
        [0.72, crossR],
        [1, crossR],
      ] as [number, V3][],
      pole: [[0, vicR.pole], [0.08, vicR.back], [0.52, vicR.back], [0.72, vicR.low], [1, vicR.low]] as [number, V3][],
      dir: [[0, vicR.rest.dir], [0.52, vicR.rest.dir], [0.6, [0.2, -0.15, 0.96]], [0.72, [0.9, 0.05, 0.45]], [1, [0.9, 0.05, 0.45]]] as [number, V3][],
      up: [[0, vicR.rest.up], [0.52, vicR.rest.up], [0.72, CROSS_UP], [1, CROSS_UP]] as [number, V3][],
    };
    // The left blade swings forward, not up, on its way in, so it passes under the mantle's edge.
    const vicKeysL = {
      wrist: [[0, vicL.chain.end], [0.5, vicL.chain.end], [0.72, crossL], [1, crossL]] as [number, V3][],
      pole: [[0, vicL.pole], [0.5, vicL.pole], [0.72, vicL.low], [1, vicL.low]] as [number, V3][],
      dir: [[0, vicL.rest.dir], [0.5, vicL.rest.dir], [0.6, [0.35, 0.1, 0.93]], [0.72, [-0.9, 0.05, 0.45]], [1, [-0.9, 0.05, 0.45]]] as [number, V3][],
      up: [[0, vicL.rest.up], [0.5, vicL.rest.up], [0.72, CROSS_UP], [1, CROSS_UP]] as [number, V3][],
    };
    const FLIGHT = [0.15, 0.39] as const; // the dagger is in the air between these phases
    k.animation('victory', {
      duration: 1.2,
      loop: false,
      pose: (_t, p) => {
        const c = keys(p, [[0.46, 0], [0.72, 1]] as const);
        const sly = keys(p, [[0.62, 0], [0.8, 1]] as const);
        const watch = keys(p, [[0.06, 0], [0.18, 1], [0.34, 1], [0.48, 0]] as const);
        const hipsR: V3 = [0, -10 * c, 0];
        const spineR: V3 = [-3 * c, 0, 0];
        const chestR: V3 = [-3 * c, 7 * c, 0];
        const at = (ks: typeof vicKeysR) => [keys(p, ks.wrist), keys(p, ks.pole), keys(p, ks.dir), keys(p, ks.up)] as const;
        const r = vicR.solve(...at(vicKeysR));
        const l = vicL.solve(...at(vicKeysL));
        // The flying dagger: a world offset and a world spin, turned into the hand's frame.
        const u = clamp01((p - FLIGHT[0]) / (FLIGHT[1] - FLIGHT[0]));
        const air = 4 * u * (1 - u);
        const inv = [hipsR, spineR, chestR, ...r.rots].reduce((q, x) => q.multiply(quat(x)), new THREE.Quaternion()).invert();
        const d = new THREE.Vector3(-0.09 * air, 0.3 * air, 0.02 * air).applyQuaternion(inv);
        const spin = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0).applyQuaternion(inv), 2 * Math.PI * u);
        return {
          hips: { rotate: hipsR },
          spine: { rotate: spineR },
          chest: { rotate: chestR },
          neck: { rotate: [3 * sly, 0, 0] },
          head: { rotate: [-14 * watch + 4 * sly, -10 * watch - 8 * sly, 12 * sly] },
          'foot.L': { rotate: [0, 14 * c, 0] },
          ...r.bones,
          ...l.bones,
          'knife.R': { move: [d.x, d.y, d.z], rotate: euler(spin) },
        };
      },
    });
  },
});
