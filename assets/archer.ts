import { defineAsset, motion, profile, rgb, sdf } from '../src/index.js';

/**
 * Archer — Chibi Quest hero (catalog `heroes/martial/archer`), 1.0 m tall, faces +Z.
 * Target: docs/hero-mockups/archer_001.jpg (one front view; side and back are designed here).
 * Built on the rogue's body, face, and skeleton, so the heroes read as one set.
 *
 * Role: player hero, seen in 3D and as a 128 px sprite, so the face, hood, and bow must read.
 * One idea: a leaf-green felt hood with a long floppy point and pointed elf ears poking out
 *   frames a big-eyed, cheerful face; a big recurve bow breaks the outline on the left.
 * Proportions (from the mockup): hood crown 1.0, hood point tip 0.64 at x -0.34, ear tips
 *   0.71 at x +-0.33, eyes 0.63, chin 0.48, shoulders 0.38, belt 0.25, tunic hem 0.15,
 *   boot cuffs 0.085. The hood and head are about half of the height.
 * Shape language: round and soft (hood dome, cheeks, fists, boots), with points for the
 *   forest (hood point, ear tips, arrow fletching, bow tips, hem notch).
 * Palette (60/30/10): leaf green cloth #5e8c32 / tunic #4f7a2b; brown leather #7c4327;
 *   gold #dca83a accent. Skin #f2c7a4, hair #4a2a18, cream leggings #cdb994.
 * Value plan: the dark inside of the hood frames the light face (focal point); the dark bow
 *   and quiver are the second contrast; gold buckle and fletching are the small accents.
 * Bodies: skin, hair, hood, cowl, tunic, sleeves, cuffs, leather, gold, quiver, arrows,
 *   pants (with the sock roll), boots, bow, bowstring.
 * Rig: the rogue's chibi skeleton plus `hoodtip` for the floppy point; the bow is rigid on the
 *   left hand, the quiver on the chest. Clips: idle, walk, run.
 */

const C = {
  skin: '#f2c7a4',
  earInner: '#eaa98e',
  blush: '#f09a86',
  freckle: '#cf8a66',
  eyeWhite: '#f6f1ea',
  irisRim: '#2e1a10',
  iris: '#6e4020',
  irisLow: '#b07a34',
  pupil: '#141a18',
  lid: '#1c130f',
  brow: '#3e2416',
  mouth: '#b0504a',
  hair: '#4a2a18',
  hood: '#5e8c32',
  hoodInside: '#26401a',
  tunic: '#4f7a2b',
  tunicDark: '#3f6523',
  stitch: '#d9c79a',
  cuff: '#e3d8bd',
  leather: '#7c4327',
  leatherDark: '#4e2b1b',
  gold: '#dca83a',
  quiver: '#8a4a2a',
  shaft: '#b98c55',
  fletch: '#d9ae48',
  pants: '#cdb994',
  sock: '#e6dcc4',
  boot: '#7a4326',
  sole: '#4a2c1c',
  bow: '#6a3a20',
  grip: '#3b2a22',
  string: '#e6d8b0',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.105, 0.628] as const; // x (each side), y
const pair = (s: sdf.Shape) => s.mirror('x');
const hard = (s: sdf.Shape) => s.mirror('x', 0);

// Joints. The right arm hangs like the rogue's; the left (bow) arm is held out from the body,
// so the bow clears the cowl, the boot, and the ground.
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW: V3 = [0.18, 0.332, 0.012];
const WRIST: V3 = [0.205, 0.238, 0.03];
const ELBOW_L: V3 = [0.198, 0.342, 0];
const WRIST_L: V3 = [0.268, 0.31, 0.04];
const HIP: V3 = [0.068, 0.195, 0];
const ANKLE: V3 = [0.098, 0.07, 0];
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];

/** The fist: palm, a finger roll at the front, and a thumb over it, placed from the wrist. */
const fistAt = (w: V3, s: 1 | -1) => {
  const o = (dx: number, dy: number, dz: number): V3 => [w[0] + dx * s, w[1] + dy, w[2] + dz];
  return sdf.smoothUnion(
    0.018,
    sdf.ellipsoid([0.042, 0.047, 0.048]).at(...o(0.008, -0.042, 0.004)),
    sdf.capsule(o(-0.01, -0.064, 0.033), o(-0.006, -0.042, 0.046), 0.019),
    sdf.cone(o(0.022, -0.025, 0.028), o(0.001, -0.036, 0.053), 0.018, 0.014),
  );
};
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

export default defineAsset({
  name: 'archer',
  description: 'Chibi archer hero with a floppy leaf-green hood, elf ears, a quiver, and a recurve bow.',
  detail: 0.005,
  reference: 'docs/hero-mockups/archer_001.jpg',

  build(k) {
    // ------------------------------------------------------------------ skeleton
    k.skeleton({
      hips: { at: [0, 0.2, 0] },
      spine: { parent: 'hips', at: [0, 0.26, 0] },
      chest: { parent: 'spine', at: [0, 0.33, 0] },
      neck: { parent: 'chest', at: [0, 0.43, -0.01] },
      head: { parent: 'neck', at: [0, 0.48, -0.01] },
      hoodtip: { parent: 'head', at: [-0.15, 0.88, -0.09], tail: [-0.34, 0.64, -0.1] },
      'upperarm.L': { parent: 'chest', at: SHOULDER },
      'forearm.L': { parent: 'upperarm.L', at: ELBOW_L },
      'hand.L': { parent: 'forearm.L', at: WRIST_L },
      'upperarm.R': { parent: 'chest', at: mx(SHOULDER) },
      'forearm.R': { parent: 'upperarm.R', at: mx(ELBOW) },
      'hand.R': { parent: 'forearm.R', at: mx(WRIST) },
      'leg.L': { parent: 'hips', at: HIP },
      'foot.L': { parent: 'leg.L', at: ANKLE },
      'leg.R': { parent: 'hips', at: mx(HIP) },
      'foot.R': { parent: 'leg.R', at: mx(ANKLE) },
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
    const nose = sdf.ellipsoid([0.02, 0.016, 0.015]).at(0, 0.566, faceZ(0, 0.566) - 0.004).bone('head');

    // Elf ears: a flat leaf with a hollow, from the side of the head out and up through the hood.
    const earLocal = sdf
      .smoothUnion(
        0.02,
        sdf.ellipsoid([0.044, 0.042, 0.017]).at(0.03, 0, 0),
        sdf.cone([0.035, 0.004, 0], [0.19, 0.036, 0], 0.034, 0.007).scale([1, 1, 0.55]),
      )
      .smoothSubtract(
        0.006,
        sdf.cone([0.03, 0, 0.012], [0.16, 0.03, 0.008], 0.025, 0.004).scale([1, 1, 0.6]),
      );
    const earPose = (s: sdf.Shape) => s.rotateZ(28).rotateY(10).at(0.17, 0.622, -0.012);
    const ear = earPose(earLocal);
    const earHollow = earPose(sdf.cone([0.035, 0, 0.02], [0.16, 0.03, 0.014], 0.027, 0.006));
    const ears = pair(ear.bone('head'));
    const neck = sdf.capsule([0, 0.42, -0.01], [0, 0.52, -0.01], 0.05).bone('neck');

    // Arms: short upper arm (hidden by the sleeve), forearm inside the bracer, a fist.
    const armL = sdf.smoothUnion(
      0.02,
      sdf.cone(SHOULDER, ELBOW_L, 0.04, 0.036).bone('upperarm.L'),
      sdf.cone(ELBOW_L, WRIST_L, 0.036, 0.032).bone('forearm.L'),
      fistAt(WRIST_L, 1).bone('hand.L'),
    );
    const armR = sdf.smoothUnion(
      0.02,
      sdf.cone(mx(SHOULDER), mx(ELBOW), 0.04, 0.036).bone('upperarm.R'),
      sdf.cone(mx(ELBOW), mx(WRIST), 0.036, 0.032).bone('forearm.R'),
      fistAt(mx(WRIST), -1).bone('hand.R'),
    );

    // Face paint: stencils cross the face along Z, so they always meet the curved surface.
    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const eyeWhite = pair(at(sdf.ellipsoid([0.052, 0.056, 0.07]), EYE[0], EYE[1]));
    const irisRim = pair(at(sdf.ellipsoid([0.042, 0.049, 0.07]), EYE[0], EYE[1] - 0.004));
    const iris = pair(at(sdf.ellipsoid([0.036, 0.043, 0.07]), EYE[0], EYE[1] - 0.006));
    const irisLow = iris.intersect(sdf.halfSpace([0, 1, 0], EYE[1] - 0.02));
    const pupil = pair(at(sdf.ellipsoid([0.026, 0.029, 0.07]), EYE[0], EYE[1] + 0.002));
    const lid = pair(sdf.extrude(profile.arc(0.05, 0.012, 15, 165), 0.3).at(EYE[0], EYE[1] - 0.004, 0.1));
    // Both highlights sit up and to the +X side: one light for the whole face.
    const shine = sdf.union(
      ...[EYE[0], -EYE[0]].flatMap((x) => [
        at(sdf.sphere(0.012), x + 0.016, EYE[1] + 0.019),
        at(sdf.sphere(0.006), x - 0.014, EYE[1] - 0.022),
      ]),
    );
    // Thick, friendly brows: raised and a little arched.
    const brows = pair(sdf.extrude(profile.arc(0.12, 0.024, 62, 112), 0.3).at(0.102, 0.727 - 0.12, 0.1));
    const smile = sdf.extrude(profile.arc(0.08, 0.013, 236, 304), 0.3).at(0, 0.527 + 0.08, 0.1);
    const blush = pair(at(sdf.sphere(0.034), 0.135, 0.56));
    const freckles = pair(
      sdf.union(
        ...(
          [
            [0.118, 0.575],
            [0.14, 0.582],
            [0.156, 0.568],
            [0.132, 0.558],
          ] as const
        ).map(([x, y]) => at(sdf.sphere(0.0055), x, y)),
      ),
    );

    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.012, nose, ears)
      .union(armL, armR)
      .paintWhere(pair(earHollow), C.earInner, 0.006)
      .paintWhere(blush, C.blush, 0.03)
      .paintWhere(freckles, C.freckle, 0.003)
      .paintWhere(eyeWhite, C.eyeWhite)
      .paintWhere(irisRim, C.irisRim)
      .paintWhere(iris, C.iris)
      .paintWhere(irisLow, C.irisLow, 0.012)
      .paintWhere(pupil, C.pupil)
      .paintWhere(lid, C.lid)
      .paintWhere(shine, '#ffffff')
      .paintWhere(brows, C.brow)
      .paintWhere(smile, C.mouth);
    k.body('skin', skin, { color: C.skin, roughness: 0.55, textureDensity: 2 });

    // ------------------------------------------------------------------ hood with the floppy point
    const dome = sdf.ellipsoid([0.262, 0.27, 0.255]).at(0, 0.69, -0.022);
    // The point leaves the crown on the right (-X) and flops down beside the head, behind the ear.
    const point = sdf
      .chain(
        [
          [-0.06, 0.9, 0, 0.12],
          [-0.17, 0.925, 0, 0.085],
          [-0.265, 0.87, 0, 0.056],
          [-0.325, 0.78, 0, 0.035],
          [-0.345, 0.69, 0, 0.019],
          [-0.336, 0.635, 0, 0.008],
        ],
        0.03,
      )
      .scale([1, 1, 0.62])
      .at(0, 0, -0.095);
    const hoodOuter = sdf.smoothUnion(0.06, dome.bone('head'), point.bone('hoodtip'));
    const cavity = sdf.ellipsoid([0.236, 0.238, 0.228]).at(0, 0.682, -0.015);
    const opening = sdf.ellipsoid([0.236, 0.228, 0.42]).at(0, 0.675, 0.3);
    // A thick rolled rim around the face opening.
    const rim = dome
      .round(0.016)
      .subtract(cavity.round(-0.004))
      .intersect(opening.round(0.038))
      .subtract(opening);
    // A raised seam over the crown, from the brow to the nape.
    const seam = dome
      .round(0.006)
      .subtract(dome.round(-0.01))
      .intersect(sdf.box([0.014, 0.4, 0.8], 0.005).at(0, 0.82, -0.05))
      .intersect(sdf.halfSpace([0, 0, 1], 0.1))
      .subtract(opening.round(0.02));
    const hood = sdf
      .smoothUnion(0.012, hoodOuter.subtract(cavity).smoothSubtract(0.02, opening), rim.bone('head'), seam.bone('head'))
      .subtract(pair(ear.round(0.0015))) // tight slits where the ears come through
      .intersect(sdf.halfSpace([0, -1, 0], -0.44))
      .paintWhere(cavity.round(0.006), C.hoodInside, 0.012);
    k.body('hood', hood, { color: C.hood, roughness: 0.9 });

    // ------------------------------------------------------------------ hair (inside the hood)
    // The hair fills the cavity and comes forward into the face opening, but not past the rim.
    const insideHood = cavity.round(-0.003).union(opening.round(-0.012).intersect(dome.round(0.008)));
    // Tilted so the hairline rises on +X (the part) and the big lock covers the other side.
    const faceMask = sdf.ellipsoid([0.25, 0.16, 0.23]).rotateZ(12).at(0.02, 0.622, 0.14);
    const cap = sdf
      .ellipsoid([HEAD[0] + 0.012, HEAD[1] + 0.014, HEAD[2] + 0.012])
      .at(0, HEAD_Y + 0.008, -0.01)
      .smoothSubtract(0.015, faceMask);
    // One big lock swept from the part across the forehead, and a curl falling the other way.
    const swoop = sdf.chain(
      [
        [0.11, 0.87, 0.1, 0.052],
        [0.03, 0.872, 0.165, 0.058],
        [-0.055, 0.84, 0.19, 0.052],
        [-0.11, 0.782, 0.2, 0.04],
        [-0.13, 0.728, 0.205, 0.028],
        [-0.126, 0.682, 0.198, 0.014],
      ],
      0.025,
    );
    const curl = sdf.chain(
      [
        [0.05, 0.862, 0.165, 0.044],
        [0.112, 0.818, 0.176, 0.038],
        [0.152, 0.768, 0.162, 0.025],
        [0.162, 0.732, 0.148, 0.011],
      ],
      0.02,
    );
    const tufts = pair(sdf.cone([0.178, 0.73, 0.09], [0.192, 0.645, 0.108], 0.03, 0.01));
    const grooves = sdf.union(
      sdf.capsule([0.1, 0.9, 0.2], [-0.09, 0.81, 0.265], 0.008),
      sdf.capsule([0.06, 0.93, 0.15], [-0.13, 0.86, 0.235], 0.008),
    );
    const hair = sdf
      .smoothUnion(0.02, cap, swoop, curl, tufts)
      .smoothSubtract(0.006, grooves)
      .intersect(insideHood);
    k.body('hair', hair, { color: C.hair, roughness: 0.6, detail: 0.004, bone: 'head' });

    // ------------------------------------------------------------------ tunic and sleeves
    const torso = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.47],
            [0.07, 0.465],
            [0.105, 0.44],
            [0.125, 0.4],
            [0.13, 0.34],
            [0.125, 0.29],
            [0.134, 0.25],
            [0.148, 0.212],
            [0.158, 0.178],
            [0.161, 0.163],
            [0.15, 0.153],
            [0, 0.153],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.78]);
    // A notch at the front of the hem, a running stitch above it, and a darker hem band.
    const notch = sdf
      .extrude(
        profile.polygon([
          [-0.026, 0.135],
          [0.026, 0.135],
          [0, 0.222],
        ]),
        0.3,
      )
      .at(0, 0, 0.15);
    const stitch = rgb(C.stitch);
    const hemStitch = (x: number, y: number, z: number) =>
      Math.abs(y - 0.178) < 0.0035 && Math.sin(Math.atan2(z, x) * 50) > 0.15;
    const tunic = torso
      .smoothSubtract(0.008, notch)
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.169), C.tunicDark)
      .paintFn((x, y, z, base) => (hemStitch(x, y, z) ? stitch : base));
    k.body('tunic', tunic.bone('spine'), { color: C.tunic, roughness: 0.85 });

    // Short green sleeves to above the elbow, with the cream shirt cuff rolled below them.
    const sleeveL = sdf.cone([0.11, 0.405, 0], lerp(SHOULDER, ELBOW_L, 0.8), 0.047, 0.044).bone('upperarm.L');
    const sleeveR = sdf.cone([-0.11, 0.405, 0], lerp(mx(SHOULDER), mx(ELBOW), 0.8), 0.047, 0.044).bone('upperarm.R');
    k.body('sleeves', sdf.union(sleeveL, sleeveR), { color: C.tunic, roughness: 0.85 });
    const cuffL = sdf.cone(lerp(SHOULDER, ELBOW_L, 0.72), lerp(SHOULDER, ELBOW_L, 1.08), 0.047, 0.046).round(0.004);
    const cuffR = sdf.cone(lerp(mx(SHOULDER), mx(ELBOW), 0.72), lerp(mx(SHOULDER), mx(ELBOW), 1.08), 0.047, 0.046).round(0.004);
    k.body('cuffs', sdf.union(cuffL.bone('upperarm.L'), cuffR.bone('upperarm.R')), { color: C.cuff, roughness: 0.9 });

    // ------------------------------------------------------------------ cowl (the hood's shoulder cape)
    const cowlSolid = sdf
      .revolve(
        profile.polygon(
          [
            [0.07, 0.49],
            [0.12, 0.468],
            [0.158, 0.435],
            [0.178, 0.398],
            [0.182, 0.372],
            [0.165, 0.37],
            [0.16, 0.395],
            [0.14, 0.425],
            [0.105, 0.448],
            [0.064, 0.468],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.84])
      // Soft folds toward the edge.
      .displace(0.005, (x, y, z) => Math.sin(Math.atan2(z, x) * 7) * Math.min(1, Math.max(0, (0.45 - y) / 0.07)));
    // The two hood sides meet in a V under the chin.
    const vee = sdf
      .extrude(
        profile.polygon([
          [-0.04, 0.36],
          [0.04, 0.36],
          [0, 0.45],
        ]),
        0.4,
      )
      .at(0, 0, 0.22);
    const cowl = cowlSolid.smoothSubtract(0.01, vee);
    k.body('cowl', cowl, { color: C.hood, roughness: 0.9, bone: 'chest' });

    // ------------------------------------------------------------------ leather: belt, baldric, bracers, pouch
    const beltY = 0.252;
    const belt = torso.round(0.01).smoothIntersect(0.006, sdf.box([0.5, 0.05, 0.5], 0.006).at(0, beltY, 0));
    // The quiver strap runs from the right shoulder, under the cowl, down to the left hip.
    const baldric = torso
      .round(0.008)
      .smoothIntersect(0.005, sdf.box([0.7, 0.034, 0.7], 0.005).rotateZ(-38).at(0.01, 0.35, 0));
    const bracer = (e: V3, w: V3) => sdf.cone(lerp(e, w, 0.32), lerp(e, w, 1.04), 0.04, 0.047).round(0.003);
    const bracers = sdf.union(bracer(ELBOW_L, WRIST_L).bone('forearm.L'), bracer(mx(ELBOW), mx(WRIST)).bone('forearm.R'));
    // A pouch on the right hip, hung from the belt, with a darker flap.
    const pouchAt = sdf.surfacePoint(belt, [-0.11, 0.24, 0.12], 0);
    const pouchBody = sdf.box([0.056, 0.066, 0.036], 0.012).rotateY(-38);
    const pouchFlap = sdf.box([0.062, 0.03, 0.042], 0.01).rotateY(-38).at(0, 0.024, 0.002);
    const pouch = sdf
      .union(pouchBody, pouchFlap.paint(C.leatherDark))
      .at(pouchAt[0] - 0.012, pouchAt[1] - 0.034, pouchAt[2] + 0.004);
    k.body('leather', sdf.union(belt.bone('spine'), baldric.bone('spine'), bracers, pouch.bone('spine')), {
      color: C.leather,
      roughness: 0.6,
    });

    // ------------------------------------------------------------------ gold: buckle, strap buckle, flap stud, boot studs
    const beltZ = sdf.raycast(belt, [0, beltY, 1], [0, 0, -1])![2];
    const buckle = sdf
      .union(
        sdf.box([0.056, 0.046, 0.012], 0.005).subtract(sdf.box([0.034, 0.026, 0.03], 0.003)),
        sdf.box([0.008, 0.03, 0.01], 0.003).at(0.004, 0, 0.004), // the prong
      )
      .at(0, beltY, beltZ + 0.004);
    const strapBuckleAt = sdf.surfacePoint(baldric, [-0.052, 0.39, 0.2], 0.002);
    const strapBuckle = sdf
      .box([0.03, 0.036, 0.008], 0.004)
      .subtract(sdf.box([0.016, 0.02, 0.03], 0.002))
      .rotateZ(-38)
      .at(...strapBuckleAt);
    const flapStud = sdf.sphere(0.009).at(pouchAt[0] - 0.012, pouchAt[1] - 0.018, pouchAt[2] + 0.03);
    const bootStuds = pair(sdf.sphere(0.009).at(0.06, 0.07, 0.012).rotateY(12).at(ANKLE[0], 0, 0).bone('foot.L'));
    k.body('gold', sdf.union(buckle.bone('spine'), strapBuckle.bone('spine'), flapStud.bone('spine'), bootStuds), {
      color: C.gold,
      roughness: 0.32,
      metalness: 0.9,
    });

    // ------------------------------------------------------------------ quiver and arrows (on the back)
    // Local frame: bottom of the quiver at the origin, the mouth up +Y.
    const QUIVER_LEN = 0.24;
    const quiverPose = (s: sdf.Shape) => s.rotateX(-10).rotateZ(50).at(0.02, 0.27, -0.16);
    const tube = sdf.cone([0, 0, 0], [0, QUIVER_LEN, 0], 0.036, 0.046).round(0.004);
    const quiverShape = sdf
      .union(
        tube.subtract(sdf.cylinder(0.04, 0.1).at(0, QUIVER_LEN + 0.04, 0)),
        sdf.torus(0.046, 0.009).at(0, QUIVER_LEN - 0.006, 0).paint(C.leatherDark), // rolled mouth
        sdf.cylinder(0.044, 0.026, 0.008).at(0, 0.12, 0).paint(C.leatherDark), // strap band
      )
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.025), C.leatherDark);
    k.body('quiver', quiverPose(quiverShape).bone('chest'), { color: C.quiver, roughness: 0.6 });

    // Five arrows fanned in the mouth; only the shafts and the gold fletching show.
    const vane = sdf.extrude(
      profile.polygon([
        [0, -0.004],
        [0.017, 0.012],
        [0.016, 0.046],
        [0, 0.062],
        [-0.016, 0.046],
        [-0.017, 0.012],
      ]),
      0.008,
      0.003,
    );
    const fletching = sdf.union(vane, vane.rotateY(90));
    const arrowTips = [
      [-0.022, 0.012, 0.42],
      [0.004, 0.022, 0.45],
      [0.026, 0.006, 0.425],
      [-0.008, -0.018, 0.44],
      [0.018, -0.014, 0.41],
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
          .at(...lerp(base, top, 0.84));
        return sdf.union(sdf.capsule(base, top, 0.0055), f.paint(C.fletch));
      }),
    );
    k.body('arrows', quiverPose(arrows).bone('chest'), { color: C.shaft, roughness: 0.7, detail: 0.004 });

    // ------------------------------------------------------------------ legs, socks, boots
    const pants = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.115, 0.05, 0.085]).at(0, 0.2, 0).bone('hips'),
      pair(sdf.capsule([HIP[0], 0.2, 0], [0.094, 0.12, 0.004], 0.046).bone('leg.L')),
    );
    // A pale sock roll shows between the leggings and the boot cuff.
    const sockRoll = pair(sdf.cylinder(0.052, 0.02, 0.009).at(0.095, 0.096, 0.004).bone('leg.L'));
    k.body('pants', pants.smoothUnion(0.006, sockRoll.paint(C.sock)), { color: C.pants, roughness: 0.85 });

    // Ankle boot built at the ankle's ground point, then turned out a little, with a folded cuff.
    const bootFoot = sdf
      .smoothUnion(
        0.035,
        sdf.cylinder(0.048, 0.064, 0.02).at(0, 0.052, 0),
        sdf.ellipsoid([0.056, 0.05, 0.1]).at(0, 0.048, 0.045),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const sole = bootFoot.round(0.005).intersect(sdf.halfSpace([0, 1, 0], 0.018)).intersect(sdf.halfSpace([0, -1, 0], 0));
    const bootCuff = sdf.cone([0, 0.06, 0], [0, 0.08, 0], 0.052, 0.058).round(0.005);
    const boot = sdf
      .union(bootFoot, sole.paint(C.sole), bootCuff)
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.6 });

    // ------------------------------------------------------------------ recurve bow in the left hand
    // Local frame: grip at the origin, limbs along Y, the back of the bow toward +Z, the string
    // behind it at -Z. Each limb bends back toward the string, then the tip curls forward.
    const limb = (len: number, sign: 1 | -1) =>
      sdf.chain(
        [
          [0, 0, 0, 0.017],
          [0, 0.22 * len * sign, -0.007, 0.0135],
          [0, 0.48 * len * sign, -0.03, 0.0115],
          [0, 0.72 * len * sign, -0.056, 0.0098],
          [0, 0.88 * len * sign, -0.066, 0.0086],
          [0, 0.97 * len * sign, -0.052, 0.0078],
          [0, 1.02 * len * sign, -0.026, 0.0072],
          [0, 1.03 * len * sign, 0.0, 0.0068],
          [0, 1.015 * len * sign, 0.02, 0.0064],
        ],
        0.01,
      );
    const UPPER = 0.33;
    const LOWER = 0.21;
    const bowLocal = sdf
      .union(limb(UPPER, 1), limb(LOWER, -1))
      .paintWhere(sdf.box([0.1, 0.07, 0.1]), C.grip);
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
        head: { rotate: [0, 5 * wave(p, 1, 0.25), 2 * wave(p, 1, 0.1)] },
        hoodtip: { rotate: [3 * wave(p, 1, 0.4), 0, 4 * wave(p, 1, 0.35)] },
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
      flop: number,
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
          // The hood point bounces twice per cycle, a little after the steps.
          hoodtip: { rotate: [flop * wave(p, 2, 0.2), 0, flop * 0.8 * wave(p, 2, 0.1)] as const },
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
    k.animation('walk', stride(0.9, 26, 28, 3, 0, 6, 12, 8));
    k.animation('run', stride(0.56, 40, 50, 12, 0.03, 12, 19, 6));
  },
});
