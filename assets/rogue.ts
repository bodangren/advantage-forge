import { defineAsset, motion, profile, rgb, sdf, THREE } from '../src/index.js';

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
 * Rig: chibi skeleton plus a `cloak` bone for the cape; the daggers are rigid on `knife.L`/`knife.R`,
 *   children of the hands. The death clip drops both daggers; the victory clip flips the right one.
 *   Clips idle, walk, run, attack, attack2 (a spinning slash), hit, death, victory.
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
      cloak: { parent: 'chest', at: [0, 0.41, -0.13] },
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
    // Skinned, not rigid: the cap over each shoulder follows the upper arm, so a raised arm lifts it
    // like a pauldron instead of going through it. The collar and the front and back panels stay on
    // the chest. A band around the cap is in both tagged parts, so it takes half of each bone and the
    // cloth stretches over a wide band instead of to a point. The tagged parts only set the weights:
    // the union with the whole mantle keeps the surface exactly as it was.
    const capZone = sdf.ellipsoid([0.1, 0.13, 0.085]).at(0.26, 0.33, 0);
    const bandZone = sdf.ellipsoid([0.135, 0.165, 0.13]).at(0.26, 0.33, 0);
    const mantleSkin = sdf.union(
      mantle,
      pair(mantle.intersect(bandZone).bone('upperarm.L')),
      mantle.subtract(hard(capZone)).bone('chest'),
    );
    k.body('mantle', mantleSkin, { color: C.hood, roughness: 0.85 });

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
    // The blade in the hand is about 30 percent longer and 15 percent wider than the sheath outline,
    // so it reads as a blade at 128 px; the guard, the grip, and the pommel keep their size.
    const GUARD = 0.034;
    const longBlade = sdf.extrude(
      profile.polygon(
        [
          [-0.0185, 0],
          [0.0185, 0],
          [0.014, -0.105],
          [0, -0.153],
          [-0.014, -0.105],
        ],
        { smooth: false },
      ),
      0.017,
      0.005,
    );
    const handBlade = sdf.union(
      longBlade.rotateZ(180).at(0, GUARD, 0).paint(C.blade),
      sdf.box([0.052, 0.012, 0.024], 0.004).at(0, GUARD, 0).paint(C.gold), // guard
      sdf.sphere(0.013).at(0, -0.04, 0).paint(C.gold), // pommel
    );
    const handGrip = sdf.capsule([0, -0.032, 0], [0, GUARD, 0], 0.011);
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
        cloak: { rotate: [3 * wave(p, 1, 0.3), 0, 0] },
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
        const legs = motion.gait(p, { hip: HIP, knee: KNEE, ankle: ANKLE }, {
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
          cloak: { rotate: [flow + 4 * wave(p, 2, 0.15), 0, 3 * s] as const },
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
          cloak: { rotate: [12 * lag, 0, 4 * lag] },
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
          cloak: {
            rotate: [10 * hitB - 8 * flat - 12 * crumple, 0, 5 * wob],
            scale: [1 + 0.12 * flat, 1 - 0.15 * crumple, 1 - 0.6 * flat],
          },
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
          cloak: { rotate: [0.4 * lean + 34 * flare, -12 * flare, 0], scale: [1 + 0.12 * flare, 1, 1 + 0.08 * flare] },
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
    const crossR: V3 = [-0.05, 0.3, 0.13]; // at full reach; inside the mantle's front edge
    const crossL: V3 = [0.08, 0.29, 0.105]; // behind the right fist, so the blades pass without touching
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
      dir: [[0, vicR.rest.dir], [0.52, vicR.rest.dir], [0.72, [0.85, 0.25, 0.45]], [1, [0.85, 0.25, 0.45]]] as [number, V3][],
      up: [[0, vicR.rest.up], [0.52, vicR.rest.up], [0.72, CROSS_UP], [1, CROSS_UP]] as [number, V3][],
    };
    // The left blade swings forward, not up, on its way in, so it passes under the mantle's edge.
    const vicKeysL = {
      wrist: [[0, vicL.chain.end], [0.5, vicL.chain.end], [0.72, crossL], [1, crossL]] as [number, V3][],
      pole: [[0, vicL.pole], [0.5, vicL.pole], [0.72, vicL.low], [1, vicL.low]] as [number, V3][],
      dir: [[0, vicL.rest.dir], [0.5, vicL.rest.dir], [0.6, [0.35, 0.1, 0.93]], [0.72, [-0.85, 0.25, 0.45]], [1, [-0.85, 0.25, 0.45]]] as [number, V3][],
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
          cloak: { rotate: [3 * c + 2 * watch, 0, 0] },
          'foot.L': { rotate: [0, 14 * c, 0] },
          ...r.bones,
          ...l.bones,
          'knife.R': { move: [d.x, d.y, d.z], rotate: euler(spin) },
        };
      },
    });
  },
});
