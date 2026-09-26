import { defineAsset, motion, profile, rgb, sdf } from '../src/index.js';

/**
 * Rogue — Chibi Quest hero (catalog `heroes/martial/rogue`), 1.0 m tall, faces +Z.
 * Target: docs/hero-mockups/rogue_001.jpg (one front view; side and back are designed here).
 *
 * Role: player hero, seen in 3D and as a 128 px sprite, so the face and the hood must read.
 * One idea: a big soft teal hood frames a big-eyed, sly-sweet face; the hood is the silhouette.
 * Proportions (from the mockup): hood peak 1.0, eyes 0.63, chin 0.48, shoulders 0.38, belt 0.25,
 *   tunic hem 0.17, boot tops 0.11. The hood and head are about half of the height.
 * Shape language: round and soft (hood dome, cheeks, fists, boots), with small points for
 *   mischief (hood tip, diamond clasp, dagger tips, cape hem).
 * Palette (60/30/10): teal cloth #3c7672 / tunic #33625d; brown leather #8a4b2b; gold #dca83a
 *   accent. Skin #f2c7a4, hair #6c3b23, dark pants #2f2b28, grey knit sleeves #9a9486.
 * Value plan: the dark inside of the hood frames the light face (focal point); gold clasp and
 *   ring buckle are the second contrast; the cape is the darkest large mass.
 * Bodies: skin, hair, hood, mantle, cape, tunic, sleeves, leather, gold, pants, wraps, boots,
 *   sheaths (empty, at the hips), and a dagger and a grip in each hand (reverse grip).
 * Rig: chibi skeleton plus a `cloak` bone for the cape; clips idle, walk, run, attack.
 */

const C = {
  skin: '#f2c7a4',
  blush: '#f09a86',
  eyeWhite: '#f6f1ea',
  irisRim: '#2e1a10',
  iris: '#6e4020',
  irisLow: '#a8702f',
  pupil: '#141a18',
  lid: '#1c130f',
  brow: '#5a3422',
  mouth: '#a4503f',
  hair: '#5a301d',
  hood: '#2f625e',
  hoodInside: '#16302e',
  tunic: '#2a534f',
  stitch: '#cdb08a',
  knit: '#9a9486',
  leather: '#7c4327',
  leatherDark: '#4e2b1b',
  gold: '#dca83a',
  pants: '#2f2b28',
  boot: '#743d22',
  sole: '#4a2c1c',
  sheath: '#bf9a6c',
  grip: '#3b2a22',
  blade: '#c9d1d6',
};

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.105, 0.628] as const; // x (each side), y
const pair = (s: sdf.Shape) => s.mirror('x');
const hard = (s: sdf.Shape) => s.mirror('x', 0);

export default defineAsset({
  name: 'rogue',
  description: 'Chibi rogue hero with a big teal hood, gold clasp, leather bracers, and twin daggers.',
  detail: 0.005,
  reference: 'docs/hero-mockups/rogue_001.jpg',

  build(k) {
    // ------------------------------------------------------------------ skeleton
    const SHOULDER = [0.13, 0.385, 0] as const;
    const ELBOW = [0.18, 0.332, 0.012] as const;
    const WRIST = [0.205, 0.238, 0.03] as const;
    const HIP = [0.068, 0.195, 0] as const;
    const ANKLE = [0.098, 0.07, 0] as const;
    const mx = (p: readonly [number, number, number]) => [-p[0], p[1], p[2]] as const;
    k.skeleton({
      hips: { at: [0, 0.2, 0] },
      spine: { parent: 'hips', at: [0, 0.26, 0] },
      chest: { parent: 'spine', at: [0, 0.33, 0] },
      neck: { parent: 'chest', at: [0, 0.43, -0.01] },
      head: { parent: 'neck', at: [0, 0.48, -0.01] },
      cloak: { parent: 'chest', at: [0, 0.41, -0.13] },
      'upperarm.L': { parent: 'chest', at: SHOULDER },
      'forearm.L': { parent: 'upperarm.L', at: ELBOW },
      'hand.L': { parent: 'forearm.L', at: WRIST },
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
    const ears = pair(
      sdf
        .ellipsoid([0.026, 0.044, 0.032])
        .subtract(sdf.sphere(0.017).at(0.016, 0, 0.006))
        .rotateY(-12)
        .at(0.2, 0.61, -0.01)
        .bone('head'),
    );
    const neck = sdf.capsule([0, 0.42, -0.01], [0, 0.52, -0.01], 0.05).bone('neck');

    // Arms: short upper arm (hidden by sleeve and mantle), forearm inside the bracer, a fist.
    const arm = sdf.smoothUnion(
      0.02,
      sdf.cone(SHOULDER, ELBOW, 0.04, 0.036).bone('upperarm.L'),
      sdf.cone(ELBOW, WRIST, 0.036, 0.032).bone('forearm.L'),
    );
    const fist = sdf
      .smoothUnion(
        0.018,
        sdf.ellipsoid([0.038, 0.043, 0.044]).at(0.212, 0.2, 0.034), // palm and closed fingers
        sdf.capsule([0.196, 0.18, 0.06], [0.2, 0.2, 0.072], 0.017), // finger roll at the front
        sdf.cone([0.225, 0.215, 0.055], [0.206, 0.205, 0.078], 0.016, 0.013), // thumb over the fingers
      )
      .bone('hand.L');
    const arms = pair(sdf.smoothUnion(0.02, arm, fist));

    // Face paint: stencils cross the face along Z, so they always meet the curved surface.
    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const eyeWhite = pair(at(sdf.ellipsoid([0.052, 0.055, 0.07]), EYE[0], EYE[1]));
    const irisRim = pair(at(sdf.ellipsoid([0.041, 0.048, 0.07]), EYE[0], EYE[1] - 0.004));
    const iris = pair(at(sdf.ellipsoid([0.035, 0.042, 0.07]), EYE[0], EYE[1] - 0.006));
    const irisLow = iris.intersect(sdf.halfSpace([0, 1, 0], EYE[1] - 0.02));
    const pupil = pair(at(sdf.ellipsoid([0.027, 0.03, 0.07]), EYE[0], EYE[1] + 0.004));
    const lid = pair(sdf.extrude(profile.arc(0.05, 0.011, 18, 165), 0.3).at(EYE[0], EYE[1] - 0.004, 0.1));
    const lash = pair(
      sdf
        .extrude(
          profile.polygon([
            [0, 0],
            [0.022, 0.016],
            [0.026, 0.01],
            [0.004, -0.008],
          ]),
          0.3,
        )
        .at(EYE[0] + 0.043, EYE[1] + 0.012, 0.1),
    );
    // Both highlights sit up and to the +X side: one light for the whole face.
    const shine = sdf.union(
      ...[EYE[0], -EYE[0]].flatMap((x) => [
        at(sdf.sphere(0.012), x + 0.016, EYE[1] + 0.019),
        at(sdf.sphere(0.006), x - 0.014, EYE[1] - 0.022),
      ]),
    );
    const brows = pair(sdf.extrude(profile.arc(0.1, 0.022, 58, 122), 0.3).at(0.1, 0.722 - 0.1, 0.1));
    const smile = sdf.extrude(profile.arc(0.07, 0.01, 241, 299), 0.3).at(0, 0.53 + 0.07, 0.1);
    const blush = pair(at(sdf.sphere(0.032), 0.135, 0.56));

    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.012, nose, ears)
      .union(arms)
      .paintWhere(blush, C.blush, 0.03)
      .paintWhere(eyeWhite, C.eyeWhite)
      .paintWhere(irisRim, C.irisRim)
      .paintWhere(iris, C.iris)
      .paintWhere(irisLow, C.irisLow, 0.012)
      .paintWhere(pupil, C.pupil)
      .paintWhere(lid, C.lid)
      .paintWhere(lash, C.lid)
      .paintWhere(shine, '#ffffff')
      .paintWhere(brows, C.brow)
      .paintWhere(smile, C.mouth);
    k.body('skin', skin, { color: C.skin, roughness: 0.55, textureDensity: 2 });

    // ------------------------------------------------------------------ hood
    const hoodOuter = sdf.smoothUnion(
      0.07,
      sdf.ellipsoid([0.285, 0.275, 0.272]).at(0, 0.685, -0.025),
      sdf.cone([0, 0.9, -0.05], [0, 0.99, -0.085], 0.12, 0.022), // the soft point on top
    );
    const cavity = sdf.ellipsoid([0.247, 0.235, 0.235]).at(0, 0.68, -0.015);
    const opening = sdf.ellipsoid([0.25, 0.23, 0.42]).at(0, 0.68, 0.3);
    // A thick rolled rim around the face opening.
    const rim = hoodOuter
      .round(0.018)
      .subtract(cavity.round(-0.004))
      .intersect(opening.round(0.04))
      .subtract(opening);
    // A raised seam over the crown: a thin skin of the hood, cut to a strip, not into the face.
    const seam = hoodOuter
      .round(0.006)
      .subtract(hoodOuter.round(-0.01))
      .intersect(sdf.box([0.014, 0.4, 0.8], 0.005).at(0, 0.82, -0.05))
      .intersect(sdf.halfSpace([0, 0, 1], 0.1)) // the hood's front skin passes in front of the face
      .subtract(opening.round(0.02));
    const hood = sdf
      .smoothUnion(0.012, hoodOuter.subtract(cavity).smoothSubtract(0.02, opening), rim, seam)
      .intersect(sdf.halfSpace([0, -1, 0], -0.43))
      .paintWhere(cavity.round(0.006), C.hoodInside, 0.012);
    k.body('hood', hood, { color: C.hood, roughness: 0.85, bone: 'head' });

    // ------------------------------------------------------------------ hair (inside the hood)
    const insideHood = cavity.round(-0.003);
    // Tilted so the hairline rises on +X (the part) and the big lock covers the other side.
    const faceMask = sdf.ellipsoid([0.25, 0.16, 0.23]).rotateZ(14).at(0.02, 0.62, 0.14);
    const cap = sdf
      .ellipsoid([HEAD[0] + 0.012, HEAD[1] + 0.014, HEAD[2] + 0.012])
      .at(0, HEAD_Y + 0.008, -0.01)
      .smoothSubtract(0.015, faceMask);
    // The fringe: one big lock swept from the part (on +X) across to the right brow, and a
    // smaller curl falling the other way. Thick, so it reads at sprite size.
    const swoop = sdf.chain(
      [
        [0.12, 0.865, 0.1, 0.055],
        [0.035, 0.872, 0.17, 0.066],
        [-0.05, 0.842, 0.2, 0.06],
        [-0.105, 0.785, 0.214, 0.046],
        [-0.13, 0.725, 0.212, 0.032],
        [-0.128, 0.672, 0.205, 0.016],
      ],
      0.025,
    );
    const curl = sdf.chain(
      [
        [0.04, 0.862, 0.165, 0.046],
        [0.105, 0.822, 0.18, 0.04],
        [0.152, 0.768, 0.165, 0.026],
        [0.168, 0.735, 0.15, 0.011],
      ],
      0.02,
    );
    const tufts = pair(sdf.cone([0.185, 0.73, 0.09], [0.2, 0.635, 0.105], 0.03, 0.01));
    // Two shallow grooves along the sweep split the fringe into locks.
    const grooves = sdf.union(
      sdf.capsule([0.1, 0.885, 0.16], [-0.09, 0.8, 0.245], 0.007),
      sdf.capsule([0.05, 0.9, 0.12], [-0.13, 0.84, 0.21], 0.007),
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
    // Tan running stitch just above the hem, and two darker embroidered chevrons on the chest.
    const stitch = rgb(C.stitch);
    const hemStitch = (x: number, y: number, z: number) =>
      Math.abs(y - 0.182) < 0.0035 && Math.sin(Math.atan2(z, x) * 46) > 0.15;
    const chevron = hard(
      sdf
        .extrude(
          profile.polygon([
            [0, 0.03],
            [0.045, -0.005],
            [0.045, -0.018],
            [0, 0.017],
            [-0.045, -0.018],
            [-0.045, -0.005],
          ]),
          0.3,
        )
        .at(0.058, 0.35, 0.1),
    );
    const tunic = torso
      .paintWhere(chevron, '#22433f')
      .paintFn((x, y, z, base) => (hemStitch(x, y, z) ? stitch : base));
    k.body('tunic', tunic.bone('spine'), { color: C.tunic, roughness: 0.8 });
    const sleeves = pair(sdf.cone([0.11, 0.405, 0], [0.18, 0.34, 0.012], 0.047, 0.042).bone('upperarm.L'));
    k.body('sleeves', sleeves, { color: C.knit, roughness: 0.95 });

    // ------------------------------------------------------------------ mantle (shoulder cape) with the collar
    const mantleSolid = sdf
      .revolve(
        profile.polygon(
          [
            [0.07, 0.482],
            [0.13, 0.458],
            [0.19, 0.412],
            [0.228, 0.35],
            [0.245, 0.292],
            [0.226, 0.288],
            [0.21, 0.343],
            [0.175, 0.4],
            [0.12, 0.44],
            [0.064, 0.462],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.82]);
    // Open in front below the collar band, so the tunic shows.
    const frontGap = sdf
      .extrude(
        profile.polygon([
          [-0.09, 0.405],
          [0.09, 0.405],
          [0.17, 0.25],
          [-0.17, 0.25],
        ]),
        0.4,
      )
      .at(0, 0, 0.22);
    const mantle = mantleSolid.smoothSubtract(0.01, frontGap);
    k.body('mantle', mantle, { color: C.hood, roughness: 0.85, bone: 'chest' });

    // ------------------------------------------------------------------ cape (behind, to the ankles)
    // A cone of cloth open at the top and the hem. Both walls get the same fold displacement, so
    // the folds bend the cloth instead of eating through it.
    const folds = (x: number, y: number, z: number) =>
      Math.sin(Math.atan2(z, x) * 6) * Math.min(1, Math.max(0, (0.38 - y) / 0.26));
    const capeCone = (r0: number, r1: number, y0: number, y1: number) =>
      sdf
        .revolve(
          profile.polygon([
            [0, y0],
            [r0, y0],
            [r1, y1],
            [0, y1],
          ]),
        )
        .scale([1, 1, 0.85])
        .displace(0.012, folds);
    const capeShell = capeCone(0.185, 0.29, 0.42, 0.075)
      .subtract(capeCone(0.163, 0.268, 0.44, 0.06))
      .at(0, 0, -0.03)
      .intersect(sdf.halfSpace([0, 0, 1], -0.03));
    // A darker hem band with the same tan running stitch as the tunic gives the back a finish.
    const cape = capeShell
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.11), '#244d49')
      .paintFn((x, y, z, base) => (Math.abs(y - 0.122) < 0.0035 && Math.sin(Math.atan2(z, x) * 70) > 0.15 ? stitch : base));
    k.body('cape', cape.bone('cloak'), { color: C.hood, roughness: 0.85 });

    // ------------------------------------------------------------------ leather: belt, strap, bracers
    const beltY = 0.252;
    const belt = torso.round(0.01).smoothIntersect(0.006, sdf.box([0.5, 0.055, 0.5], 0.006).at(0, beltY, 0));
    const strap = torso
      .round(0.008)
      .smoothIntersect(0.005, sdf.box([0.6, 0.034, 0.6], 0.005).rotateZ(-24).at(0.02, 0.345, 0));
    const bracer = sdf
      .cone([0.182, 0.348, 0.012], [0.207, 0.232, 0.031], 0.047, 0.06)
      .round(0.004)
      .bone('forearm.L');
    k.body('leather', sdf.union(belt.bone('spine'), strap.bone('spine'), pair(bracer)), {
      color: C.leather,
      roughness: 0.6,
    });

    // ------------------------------------------------------------------ gold: clasp, studs, buckle, bracer bars, key
    const collarZ = (x: number, y: number) => sdf.raycast(mantle, [x, y, 1], [0, 0, -1])![2];
    const clasp = sdf
      .box([0.042, 0.042, 0.03], 0.006)
      .rotateZ(45)
      .scale([1, 1.2, 1])
      .at(0, 0.415, collarZ(0, 0.415) + 0.004);
    const studs = hard(sdf.sphere(0.013).at(0.078, 0.422, collarZ(0.078, 0.422)));
    const beltZ = sdf.raycast(belt, [0, beltY, 1], [0, 0, -1])![2];
    const buckle = sdf
      .union(
        sdf.torus(0.033, 0.01).rotateX(90),
        sdf.box([0.01, 0.034, 0.012], 0.004).at(0.004, 0.012, 0.004).rotateZ(-20), // the prong
      )
      .at(0, beltY, beltZ + 0.006);
    const bars = pair(
      sdf.union(
        ...[0.32, 0.29, 0.26].map((y, i) => {
          const p = sdf.surfacePoint(bracer, [0.26, y, 0.05 + i * 0.004], 0.002);
          return sdf.capsule([p[0] - 0.012, p[1], p[2]], [p[0] + 0.004, p[1], p[2] + 0.01], 0.006);
        }),
      ).bone('forearm.L'),
    );
    const key = sdf
      .union(
        sdf.capsule([0.215, 0.2, 0.04], [0.268, 0.172, 0.05], 0.0065),
        sdf.torus(0.016, 0.0055).rotateX(90).at(0.284, 0.162, 0.05),
        sdf.box([0.012, 0.016, 0.006], 0.002).at(0.225, 0.186, 0.044),
      )
      .bone('hand.L');
    // A small square buckle high on the strap, over the right side of the chest.
    const strapBuckleAt = sdf.surfacePoint(strap, [-0.062, 0.381, 0.2], 0.002);
    const strapBuckle = sdf
      .box([0.03, 0.036, 0.008], 0.004)
      .subtract(sdf.box([0.016, 0.02, 0.03], 0.002))
      .rotateZ(-24)
      .at(...strapBuckleAt);
    const bootStuds = pair(
      sdf
        .sphere(0.011)
        .at(0.056, 0.1, 0.012)
        .rotateY(12)
        .at(ANKLE[0], 0, 0)
        .bone('foot.L'),
    );
    k.body(
      'gold',
      sdf.union(clasp.bone('chest'), studs.bone('chest'), strapBuckle.bone('spine'), buckle.bone('spine'), bars, key, bootStuds),
      { color: C.gold, roughness: 0.32, metalness: 0.9 },
    );

    // ------------------------------------------------------------------ legs, wraps, boots
    const pants = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.115, 0.05, 0.085]).at(0, 0.2, 0).bone('hips'),
      pair(sdf.capsule([HIP[0], 0.2, 0], [0.094, 0.11, 0.004], 0.05).bone('leg.L')),
    );
    k.body('pants', pants, { color: C.pants, roughness: 0.85 });
    const wraps = pair(sdf.cylinder(0.058, 0.044, 0.02).at(0.095, 0.118, 0.004).bone('leg.L'));
    k.body('wraps', wraps, { color: C.hood, roughness: 0.85 });

    // Boot built at the ankle's ground point, then turned out a little.
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
      .union(bootFoot, sole.paint(C.sole), bootCuff.paint(C.leatherDark))
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.6 });

    // ------------------------------------------------------------------ empty sheaths at the hips
    // The dagger outline in its local frame: top edge at the guard (y = 0), the point down.
    const bladeOutline = sdf.extrude(
      profile.polygon(
        [
          [-0.016, 0],
          [0.016, 0],
          [0.012, -0.08],
          [0, -0.118],
          [-0.012, -0.08],
        ],
        { smooth: false },
      ),
      0.016,
      0.005,
    );
    // Empty scabbards: the outline alone, with a dark throat band where the blade went in.
    const sheath = bladeOutline.paintWhere(sdf.box([0.1, 0.014, 0.1]).at(0, -0.004, 0), C.leatherDark);
    const sheaths = hard(sheath.rotateZ(20).rotateX(8).at(0.132, 0.228, 0.07)).bone('spine');
    k.body('sheaths', sheaths, { color: C.sheath, roughness: 0.65 });

    // ------------------------------------------------------------------ daggers in the hands (reverse grip)
    // Local frame: origin at the grip center, the blade up (+Y), the pommel down, flat facing +Z.
    // In the hand the blade leaves the fist on the outside, below the bracer cuff, and runs up and
    // back beside the forearm; the gold pommel shows under the thumb at the front of the fist.
    const GUARD = 0.034;
    const handBlade = sdf.union(
      bladeOutline.rotateZ(180).at(0, GUARD, 0).paint(C.blade),
      sdf.box([0.052, 0.012, 0.024], 0.004).at(0, GUARD, 0).paint(C.gold), // guard
      sdf.sphere(0.013).at(0, -0.04, 0).paint(C.gold), // pommel
    );
    const handGrip = sdf.capsule([0, -0.032, 0], [0, GUARD, 0], 0.011);
    const GRIP = { at: [0.232, 0.172, 0.022] as const, lean: 42, back: 20, roll: 20 };
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
        bone: `hand.${tag}`,
      });
      k.body(`daggerGrip.${tag}`, inHand(handGrip, side), { color: C.grip, roughness: 0.6, bone: `hand.${tag}` });
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
        cloak: { rotate: [3 * wave(p, 1, 0.3), 0, 0] },
        'upperarm.L': { rotate: [2 * wave(p, 1, 0.1), 0, 3 * bump(p)] },
        'upperarm.R': { rotate: [2 * wave(p, 1, 0.1), 0, -3 * bump(p)] },
        'forearm.L': { rotate: [-5 * bump(p), 0, 0] },
        'forearm.R': { rotate: [-5 * bump(p), 0, 0] },
      }),
    });

    const stride = (duration: number, legSwing: number, armSwing: number, lean: number, hop: number, flow: number) => ({
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
          // The cape trails behind and flutters twice per cycle, a little after the steps.
          cloak: { rotate: [flow + 4 * wave(p, 2, 0.15), 0, 3 * s] as const },
          'leg.L': { rotate: [-legSwing * s, 0, 0] as const },
          'leg.R': { rotate: [legSwing * s, 0, 0] as const },
          'foot.L': { rotate: [legSwing * 0.55 * s + 12 * Math.max(0, -s), 0, 0] as const },
          'foot.R': { rotate: [-legSwing * 0.55 * s + 12 * Math.max(0, s), 0, 0] as const },
          'upperarm.L': { rotate: [armSwing * s, 0, 6] as const },
          'upperarm.R': { rotate: [-armSwing * s, 0, -6] as const },
          'forearm.L': { rotate: [-armSwing * 0.5 - armSwing * 0.4 * Math.max(0, -s), 0, 0] as const },
          'forearm.R': { rotate: [-armSwing * 0.5 - armSwing * 0.4 * Math.max(0, s), 0, 0] as const },
        };
      },
    });
    k.animation('walk', stride(0.9, 26, 28, 3, 0, 6));
    k.animation('run', stride(0.56, 40, 50, 12, 0.03, 22));

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
          cloak: { rotate: [keys(p, [[0, 0], [0.22, 5], [0.38, 12], [0.5, 14], [0.62, 8], [1, 0]] as const), 0, 0] },
          'leg.L': { rotate: [legX, 0, legZ] },
          'leg.R': { rotate: [-legX, 0, -legZ] },
          'foot.L': { rotate: [-legX, 0, -legZ] },
          'foot.R': { rotate: [legX, 0, legZ] },
          ...armR(p),
          ...armL(p),
        };
      },
    });
  },
});
