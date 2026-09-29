import { defineAsset, motion, noise, profile, rgb, sdf, THREE } from '../src/index.js';

/**
 * Brigand — Chibi Quest enemy (catalog `enemies/humanoid/brigand`), about 0.95 m to the top of the
 * hood, faces +Z. Target: docs/enemy-mockups/brigand_001.jpg. Built on the bandit's rig (the
 * rogue's skeleton with knee bones), so the human enemies read as one set.
 *
 * Role: a tougher human enemy, seen in 3D and as a 128 px sprite; the hood, the beard, the axe and
 *   the buckler read at that size.
 * One idea: a scowling bearded outlaw under a big olive hood, with an axe in the right hand and a
 *   round buckler on the left arm.
 * Shape language: square and heavy (hood, jerkin, buckler) with round face and beard.
 * Palette (60/30/10): hood green #6a7a4a, leather browns (jerkin #6a4a30, beard #6a4028), grey
 *   tunic #6a6660; brass #c9a24a as the accent; the red nose is the face's focal point.
 * Bodies: skin, mouth, hood, cap band, rivets, beard, tunic, mail, jerkin, plates, trousers,
 *   boots, leather (belt, strap, pouch, tabs, wraps), brass, steel, axe, buckler.
 * Rig: the bandit's skeleton without the knot and the sack. The axe is rigid on `hand.R`, the
 *   buckler on `forearm.L`.
 *   Clips: idle, walk, run, attack (an overhead chop), hit, death, taunt (pumps the axe twice).
 */

const C = {
  skin: '#e8c49a',
  nose: '#d4786a',
  eyeWhite: '#f2ece2',
  irisRim: '#1c120c',
  iris: '#2a1a10',
  pupil: '#0e0a08',
  lid: '#16100c',
  brow: '#2a2420',
  mark: '#8a5a45',
  mouth: '#2a0e10',
  lip: '#b8685a',
  hood: '#6a7a4a',
  hoodShade: '#4e5a34',
  band: '#2e2a26',
  rivet: '#7a7a80',
  beard: '#6a4028',
  beardLit: '#8a5a3a',
  tunic: '#6a6660',
  jerkin: '#6b4a2e',
  jerkinLit: '#7a5a3c',
  jerkinDark: '#4e3520',
  mail: '#7a7a74',
  leather: '#4a3222',
  wrap: '#5a3a26',
  brass: '#c9a24a',
  trousers: '#3a3a40',
  boot: '#4a3a2c',
  sole: '#2a2018',
  axeHead: '#6e7580',
  axeEdge: '#b9c0c8',
  haft: '#5a3a24',
  wood: '#7a5a3a',
  iron: '#4a4a50',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.1, 0.628] as const;
const pair = (s: sdf.Shape) => s.mirror('x');
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW_R: V3 = [-0.18, 0.332, 0.012];
const WRIST_R: V3 = [-0.205, 0.238, 0.03];
const ELBOW_L: V3 = [0.19, 0.335, 0.02];
const WRIST_L: V3 = [0.218, 0.262, 0.07];
const HIP: V3 = [0.068, 0.195, 0];
const ANKLE: V3 = [0.098, 0.07, 0];
const KNEE: V3 = [0.083, 0.1325, 0];
const SOLE_HEEL: V3 = [0.093, 0, -0.024];
const SOLE_TOE: V3 = [0.108, 0, 0.085];

/** A fist hanging from the wrist `w`; `s` mirrors it for the right hand. Its grip runs along Z. */
const fistAt = (w: V3, s: 1 | -1) => {
  const o = (dx: number, dy: number, dz: number): V3 => [w[0] + dx * s, w[1] + dy, w[2] + dz];
  return sdf.smoothUnion(
    0.018,
    sdf.ellipsoid([0.038, 0.043, 0.044]).at(...o(0.007, -0.038, 0.004)),
    sdf.capsule(o(-0.009, -0.058, 0.03), o(-0.005, -0.038, 0.042), 0.017),
    sdf.cone(o(0.02, -0.023, 0.025), o(0.001, -0.033, 0.048), 0.016, 0.013),
  );
};

export default defineAsset({
  name: 'brigand',
  description: 'Chibi brigand enemy: an olive hood over a riveted skullcap band, an angry bearded face with a red nose, a leather jerkin over a padded tunic, a hand axe and a round buckler.',
  detail: 0.006,
  reference: 'docs/enemy-mockups/brigand_001.jpg',
  variants: {
    hood: { green: C.hood, brown: '#6a4a30', black: '#2a2a2e' },
    jerkin: { brown: C.jerkin, black: '#2a2622', red: '#7a2a22' },
    beard: { brown: C.beard, black: '#24201c', grey: '#8a8a80' },
  },
  presets: {
    forester: { hood: 'green', jerkin: 'brown', beard: 'brown' },
    raider: { hood: 'brown', jerkin: 'black', beard: 'black' },
    reaver: { hood: 'black', jerkin: 'red', beard: 'grey' },
  },

  build(k) {
    const T = {
      hood: k.tint('hood'),
      hoodShade: k.tint('hood', { color: C.hoodShade, follow: 1 }),
      jerkin: k.tint('jerkin'),
      jerkinLit: k.tint('jerkin', { color: C.jerkinLit, follow: 1 }),
      jerkinDark: k.tint('jerkin', { color: C.jerkinDark, follow: 1 }),
      beard: k.tint('beard'),
      beardLit: k.tint('beard', { color: C.beardLit, follow: 1 }),
    };
    // The axe grip (the fist center of the right hand) and the buckler's center.
    const FIST_R: V3 = [WRIST_R[0] - 0.007, WRIST_R[1] - 0.038, WRIST_R[2] + 0.004];
    const AXE_YAW = 32; // the haft points forward and a little out
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
      'upperarm.R': { parent: 'chest', at: mx(SHOULDER) },
      'forearm.R': { parent: 'upperarm.R', at: ELBOW_R },
      'hand.R': { parent: 'forearm.R', at: WRIST_R },
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
        pair(sdf.sphere(0.1).at(0.095, 0.575, 0.072)),
        sdf.ellipsoid([0.11, 0.055, 0.085]).at(0, 0.53, 0.058),
      )
      .bone('head');
    const faceZ = (x: number, y: number) => sdf.raycast(head, [x, y, 1], [0, 0, -1])![2];
    const NOSE_Y = 0.582;
    const nose = sdf.ellipsoid([0.038, 0.034, 0.036]).at(0, NOSE_Y, faceZ(0, NOSE_Y) - 0.008).bone('head');
    const neck = sdf.capsule([0, 0.42, -0.01], [0, 0.52, -0.01], 0.05).bone('neck');
    const armL = sdf.smoothUnion(
      0.02,
      sdf.cone(SHOULDER, ELBOW_L, 0.04, 0.036).bone('upperarm.L'),
      sdf.cone(ELBOW_L, WRIST_L, 0.036, 0.032).bone('forearm.L'),
      fistAt(WRIST_L, 1).bone('hand.L'),
    );
    const armR = sdf.smoothUnion(
      0.02,
      sdf.cone(mx(SHOULDER), ELBOW_R, 0.04, 0.036).bone('upperarm.R'),
      sdf.cone(ELBOW_R, WRIST_R, 0.036, 0.032).bone('forearm.R'),
      fistAt(WRIST_R, -1).bone('hand.R'),
    );

    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    // Small dark eyes under a heavy glare.
    const eyeWhite = pair(at(sdf.ellipsoid([0.034, 0.032, 0.07]), EYE[0], EYE[1]));
    const irisRim = pair(at(sdf.ellipsoid([0.027, 0.029, 0.07]), EYE[0], EYE[1] - 0.003));
    const iris = pair(at(sdf.ellipsoid([0.023, 0.0255, 0.07]), EYE[0], EYE[1] - 0.004));
    const pupil = pair(at(sdf.ellipsoid([0.017, 0.0187, 0.07]), EYE[0], EYE[1] - 0.002));
    const lid = pair(
      sdf
        .extrude(
          profile.polygon([
            [EYE[0] - 0.06, EYE[1] + 0.008],
            [EYE[0] + 0.06, EYE[1] + 0.034],
            [EYE[0] + 0.06, EYE[1] + 0.09],
            [EYE[0] - 0.06, EYE[1] + 0.09],
          ]),
          0.3,
        )
        .at(0, 0, 0.1),
    );
    const lidLine = pair(sdf.extrude(profile.arc(0.034, 0.008, 20, 160), 0.3).at(EYE[0], EYE[1] - 0.003, 0.1));
    const shine = sdf.union(...[EYE[0], -EYE[0]].map((x) => at(sdf.sphere(0.006), x + 0.009, EYE[1] + 0.004)));
    // Heavy black brows: the inner ends dip hard toward the nose.
    // Brows 0.018 m thick, tilted 18 degrees down toward the nose, resting on the upper lid.
    const browXs = [0.04, 0.07, 0.1, 0.13, 0.172];
    const browC = (x: number) => 0.648 + 0.33 * (x - 0.045);
    const browH = (x: number) => 0.009 - 0.003 * ((x - 0.04) / 0.132);
    const browArch = (x: number) => 0.003 * Math.sin(((x - 0.04) / 0.132) * Math.PI);
    const brows = pair(
      sdf
        .extrude(
          profile.polygon(
            [
              ...browXs.map((x): [number, number] => [x, browC(x) + browH(x) + browArch(x)]),
              ...browXs.slice().reverse().map((x): [number, number] => [x, browC(x) - browH(x)]),
            ],
            { smooth: true, samples: 4 },
          ),
          0.3,
        )
        .at(0, 0, 0.1),
    );
    // A scar on the forehead above the right brow (screen left).
    const scar = sdf.union(
      sdf.extrude(profile.rect([0.007, 0.036], 0.002), 0.3).rotateZ(-5).at(-0.072, 0.712, 0.1),
      sdf.extrude(profile.rect([0.02, 0.005], 0.002), 0.3).rotateZ(8).at(-0.072, 0.722, 0.1),
      sdf.extrude(profile.rect([0.018, 0.005], 0.002), 0.3).rotateZ(-8).at(-0.072, 0.703, 0.1),
    );
    // The open, snarling mouth: a cavity in the face, cut through the beard too.
    const MOUTH_Y = 0.512;
    const mouthZ = faceZ(0, MOUTH_Y);
    const cavity = sdf.ellipsoid([0.04, 0.02, 0.05]).at(0, MOUTH_Y, mouthZ + 0.006);
    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.02, nose)
      .union(armL, armR)
      .subtract(cavity)
      .paintWhere(nose.round(0.006), C.nose, 0.01)
      .paintWhere(eyeWhite, C.eyeWhite)
      .paintWhere(irisRim, C.irisRim)
      .paintWhere(iris, C.iris)
      .paintWhere(pupil, C.pupil)
      .paintWhere(shine, '#ffffff')
      .paintWhere(lid.intersect(eyeWhite.round(0.004)), C.skin)
      .paintWhere(lidLine.intersect(sdf.halfSpace([0, -1, 0], -(EYE[1] - 0.002))), C.lid)
      .paintWhere(brows, C.brow)
      .paintWhere(scar, C.mark, 0.002)
      .paintWhere(cavity.round(0.012), C.lip)
      .paintWhere(cavity.round(0.002), C.mouth, 0.004);
    k.body('skin', skin, { color: C.skin, roughness: 0.55, textureDensity: 2, detail: 0.004 });

    // ------------------------------------------------------------------ hood and skullcap band
    // A wide hood: a dome on the skull, a crown, and a cape over the shoulders; open at the face.
    // The cape: one rounded shell that drapes over the shoulders at the back and the sides.
    const cape = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.62],
            [0.17, 0.6],
            [0.215, 0.54],
            [0.232, 0.47],
            [0.226, 0.425],
            [0, 0.42],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.9])
      .at(0, 0, -0.03);
    const hoodOuter = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.232, 0.212, 0.222]).at(0, 0.7, -0.02),
      sdf.ellipsoid([0.21, 0.09, 0.2]).at(0, 0.835, -0.02),
      cape,
    );
    const openingPoly = profile.polygon([
      [-0.165, 0.752],
      [0.165, 0.752],
      [0.178, 0.6],
      [0.185, 0.52],
      [0.205, 0.46],
      [0.205, 0.35],
      [-0.205, 0.35],
      [-0.205, 0.46],
      [-0.185, 0.52],
      [-0.178, 0.6],
    ]);
    const opening = sdf.extrude(openingPoly, 0.5).at(0, 0, 0.25);
    const openingBig = sdf.extrude(profile.offsetProfile(openingPoly, 0.016), 0.5).at(0, 0, 0.25);
    const hoodInner = hoodOuter.round(-0.018);
    // A raised rim 0.015 m thick frames the face opening.
    const hoodRim = hoodOuter.round(0.007).subtract(hoodInner).intersect(openingBig).subtract(opening);
    const hoodShell = hoodOuter
      .subtract(hoodInner)
      .subtract(opening)
      .smoothUnion(0.006, hoodRim)
      .intersect(sdf.halfSpace([0, -1, 0], -0.42));
    // A seam ridge along the crown and a tucked peak at the back of it.
    const ridge = sdf.chain(
      [
        [0, 0.91, 0.13, 0.014],
        [0, 0.93, 0.0, 0.02],
        [0, 0.92, -0.14, 0.024],
        [0, 0.88, -0.22, 0.016],
      ],
      0.02,
    );
    const hood = hoodShell
      .smoothUnion(0.02, ridge)
      .paintWhere(head.round(0.024), T.hoodShade, 0.008)
      .paintFn((x, y, z, base) => (y > 0.8 && Math.abs(x) < 0.0035 && z > -0.2 ? rgb(T.hoodShade) : base));
    k.body('hood', hood.bone('head'), { color: T.hood, roughness: 0.9, bump: (x, y, z) => 0.0005 * Math.sin(x * 600) * Math.sin((y + z) * 600) });
    // The band: a leather ring at the brow that lies over the hood's front edge, with six rivets
    // and a metal plate at each temple.
    const BAND_Y = 0.765;
    const bandRing = sdf.torus(0.213, 0.023).scale([1.05, 0.95, 0.95]).at(0, BAND_Y, -0.03);
    k.body('cap', bandRing.bone('head'), { color: C.band, roughness: 0.6, detail: 0.004 });
    const ringPt = (deg: number): V3 => {
      const a = (deg * Math.PI) / 180;
      return [1.05 * 0.235 * Math.sin(a), BAND_Y, -0.03 + 0.95 * 0.237 * Math.cos(a)];
    };
    const rivets = sdf.union(
      ...[-62, -38, -14, 14, 38, 62].map((d) => sdf.sphere(0.0085).at(...ringPt(d))),
      ...[-1, 1].map((s) => sdf.box([0.016, 0.06, 0.055], 0.005).rotateY(s * 10).at(s * 0.245, BAND_Y - 0.004, 0.02)),
    );
    k.body('rivets', rivets.bone('head'), { color: C.rivet, roughness: 0.4, metalness: 0.75, detail: 0.004 });

    // ------------------------------------------------------------------ beard
    const bib = sdf.ellipsoid([0.125, 0.125, 0.09]).at(0, 0.445, 0.1);
    const lobes = pair(sdf.ellipsoid([0.08, 0.08, 0.085]).at(0.115, 0.545, 0.075));
    const mustache = pair(sdf.ellipsoid([0.05, 0.02, 0.035]).at(0.04, 0.55, mouthZ + 0.002).rotateZ(-8));
    const beardShape = sdf
      .smoothUnion(0.035, bib, lobes, mustache)
      .subtract(sdf.ellipsoid([0.04, 0.04, 0.1]).at(0, 0.6, 0.2)) // the nose and cheeks stay bare
      .subtract(cavity.round(0.012))
      .displace(0.004, (x, y, z) => noise.fbm(x * 30, y * 10, z * 30, 2));
    const beard = beardShape.paintFn((x, y, z, base) => {
      const s = Math.sin((x + z * 0.6) * 210 + noise.noise3(x * 24, y * 7, z * 24) * 5);
      return s > 0.8 ? rgb(T.beardLit) : base;
    });
    k.body('beard', beard.bone('head'), {
      color: T.beard,
      roughness: 0.85,
      bump: (x, y, z) => 0.0016 * Math.sin((x + z * 0.6) * 210 + noise.noise3(x * 24, y * 7, z * 24) * 5),
    });

    // ------------------------------------------------------------------ tunic, mail, jerkin
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
            [0.13, 0.25],
            [0.138, 0.21],
            [0.14, 0.196],
            [0.13, 0.186],
            [0, 0.186],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.8]);
    k.body('tunic', torso.bone('spine'), { color: C.tunic, roughness: 0.9, bump: (x, y, z) => 0.0008 * Math.sin(x * 500) * Math.sin(y * 500 + z * 100) });
    // Chainmail on the upper arms (a dimple bump).
    const mail = (s: V3, e: V3, tag: string) => sdf.cone([s[0] * 0.85, 0.405, 0], lerp(s, e, 0.95), 0.05, 0.043).bone(tag);
    // A mail collar band, 0.03 m tall, at the neck line above the jerkin.
    const collar = sdf.torus(0.108, 0.0165).scale([1, 0.92, 0.82]).at(0, 0.448, -0.005).bone('chest');
    k.body('mail', sdf.union(mail(SHOULDER, ELBOW_L, 'upperarm.L'), mail(mx(SHOULDER), ELBOW_R, 'upperarm.R'), collar), {
      color: C.mail,
      roughness: 0.5,
      metalness: 0.6,
      bump: (x, y, z) => 0.0011 * Math.abs(Math.sin((x + z) * 520)) * Math.abs(Math.sin(y * 520 + (x - z) * 260)),
    });
    // The jerkin: a leather shell over the tunic, open at the front, with a torn hem.
    const HEM = 0.188;
    const notches = sdf.union(
      ...[-150, -115, -80, -45, -15, 15, 45, 80, 115, 150, 180].map((a) => sdf.box([0.03, 0.03, 0.12]).rotateZ(45).at(0, HEM, 0.125).rotateY(a)),
    );
    const jerkin = torso
      .round(0.012)
      .subtract(torso.round(0.001))
      .intersect(sdf.halfSpace([0, 1, 0], 0.44))
      .intersect(sdf.halfSpace([0, -1, 0], -HEM))
      .subtract(notches)
      .smoothSubtract(
        0.006,
        sdf
          .extrude(
            profile.polygon([
              [-0.05, 0.47],
              [0.05, 0.47],
              [0.075, 0.18],
              [-0.075, 0.18],
            ]),
            0.4,
          )
          .at(0, 0, 0.2),
      )
      .subtract(pair(sdf.ellipsoid([0.06, 0.07, 0.07]).at(0.13, 0.38, 0)))
      .paintFn((x, y, z, base) => (Math.abs(noise.fbm(x * 38, y * 20, z * 38, 2)) < 0.04 || y < 0.205 ? rgb(T.jerkinDark) : base));
    // Stitch lines on the front: three rows of dashes, grooved into the normal map only.
    const stitch = (x: number, y: number, z: number) => {
      if (z < 0.02) return 0;
      const dash = Math.sin(x * 260) > -0.2 ? 1 : 0;
      return [0.345, 0.315, 0.285].reduce((sum, y0) => sum + dash * Math.exp(-(((y - y0) / 0.0025) ** 2)), 0);
    };
    k.body('jerkin', jerkin.bone('chest'), {
      color: T.jerkin,
      roughness: 0.65,
      bump: (x, y, z) => 0.0007 * noise.fbm(x * 90, y * 90, z * 90, 2) - 0.0016 * stitch(x, y, z),
    });
    // Shoulder plates: two stacked caps over each shoulder joint.
    const plate = pair(
      sdf
        .smoothUnion(
          0.008,
          sdf.ellipsoid([0.062, 0.026, 0.06]).rotateZ(-22).at(0.15, 0.428, 0),
          sdf.ellipsoid([0.048, 0.024, 0.046]).rotateZ(-22).at(0.155, 0.442, 0),
        )
        .bone('upperarm.L'),
    );
    k.body('plates', plate, { color: T.jerkinLit, roughness: 0.55, detail: 0.005 });

    // ------------------------------------------------------------------ trousers, boots
    const trousers = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.118, 0.055, 0.088]).at(0, 0.205, 0).bone('hips'),
      pair(
        sdf
          .smoothUnion(
            0.01,
            sdf.capsule([HIP[0], 0.2, 0], [0.096, 0.12, 0.004], 0.05),
            sdf.cylinder(0.057, 0.034, 0.012).at(0.096, 0.112, 0.004).paint('#2e2e34'),
          )
          .bone('leg.L'),
      ),
    );
    k.body('trousers', trousers, { color: C.trousers, roughness: 0.85 });
    const bootFoot = sdf
      .smoothUnion(0.035, sdf.cylinder(0.052, 0.08, 0.02).at(0, 0.05, 0), sdf.ellipsoid([0.06, 0.052, 0.104]).at(0, 0.048, 0.045))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const bootStraps = bootFoot
      .round(0.003)
      .smoothIntersect(0.003, sdf.union(sdf.box([0.2, 0.012, 0.2]).at(0, 0.075, 0), sdf.box([0.2, 0.012, 0.2]).rotateX(-25).at(0, 0.06, 0.07)));
    const boot = bootFoot
      .union(bootStraps.paint(C.sole))
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.016), C.sole)
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.75, bump: (x, y, z) => 0.0008 * noise.fbm(x * 80, y * 80, z * 80, 2) });

    // ------------------------------------------------------------------ leather: belt, strap, pouch, tabs, wraps
    const beltY = 0.235;
    const belt = torso.round(0.014).smoothIntersect(0.006, sdf.box([0.5, 0.052, 0.5], 0.006).at(0, beltY, 0));
    // The diagonal strap runs from the right shoulder (screen left) to the left hip.
    const strapSlab = sdf.box([0.042, 0.7, 0.7], 0.006).rotateZ(52).at(0.005, 0.35, 0);
    const strap = torso.round(0.011).smoothIntersect(0.004, strapSlab).intersect(sdf.halfSpace([0, -1, 0], -0.2));
    const pouchAt = sdf.surfacePoint(belt, [0.085, beltY - 0.03, 0.15], 0);
    const pouch = sdf
      .union(sdf.box([0.056, 0.07, 0.034], 0.012), sdf.box([0.062, 0.03, 0.04], 0.01).at(0, 0.024, 0.002).paint(C.wrap))
      .rotateY(32)
      .at(pouchAt[0] + 0.004, pouchAt[1] - 0.04, pouchAt[2] + 0.008);
    // Three leather tabs hang from the belt.
    const tab = (deg: number, w: number, len: number) => {
      const a = (deg * Math.PI) / 180;
      const p = sdf.surfacePoint(torso, [Math.sin(a) * 0.3, 0.2, Math.cos(a) * 0.3], 0.006);
      return sdf.box([w, len, 0.009], 0.004).rotateX(4).rotateY(deg).at(p[0], beltY - 0.012 - len / 2 + 0.01, p[2]);
    };
    const tabs = sdf.union(tab(-60, 0.036, 0.11), tab(-32, 0.03, 0.085), tab(72, 0.034, 0.1));
    const wrapRings = (e: V3, w: V3, tag: string) => {
      const d = new THREE.Vector3(w[0] - e[0], w[1] - e[1], w[2] - e[2]).normalize();
      const rings = [0.34, 0.46, 0.58, 0.7, 0.82].map((t, i) => {
        const c = lerp(e, w, t);
        const r = 0.036 - 0.004 * t + 0.006;
        const a: V3 = [c[0] - d.x * 0.008, c[1] - d.y * 0.008, c[2] - d.z * 0.008];
        const b: V3 = [c[0] + d.x * 0.008 + i * 0, c[1] + d.y * 0.008, c[2] + d.z * 0.008];
        return sdf.cone(a, b, r, r).round(0.004);
      });
      return sdf.union(...rings).bone(tag);
    };
    const knifeAt = sdf.surfacePoint(belt, [-0.08, beltY, 0.15], 0);
    const knifeSheath = sdf
      .union(sdf.box([0.024, 0.075, 0.016], 0.006).at(0, -0.045, 0), sdf.cylinder(0.011, 0.05, 0.004).at(0, 0.02, 0).paint(C.haft))
      .rotateZ(-8)
      .at(knifeAt[0], knifeAt[1] + 0.005, knifeAt[2] + 0.012);
    k.body(
      'leather',
      sdf.union(
        belt.bone('spine'),
        strap.bone('chest'),
        pouch.bone('spine'),
        tabs.bone('spine'),
        knifeSheath.bone('spine'),
        wrapRings(ELBOW_R, WRIST_R, 'forearm.R'),
        wrapRings(ELBOW_L, WRIST_L, 'forearm.L'),
      ),
      { color: C.leather, roughness: 0.6, detail: 0.005 },
    );
    const beltZ = sdf.raycast(belt, [0, beltY, 1], [0, 0, -1])![2];
    const strapAt = sdf.surfacePoint(strap, [0.005, 0.35, 0.3], 0.0);
    const buckleBig = sdf
      .union(sdf.box([0.07, 0.05, 0.014], 0.006).subtract(sdf.box([0.046, 0.03, 0.03], 0.004)), sdf.box([0.008, 0.034, 0.012], 0.003).at(0.004, 0, 0.002))
      .at(0, beltY, beltZ + 0.006);
    const buckleStrap = sdf
      .union(sdf.box([0.044, 0.04, 0.012], 0.005).subtract(sdf.box([0.026, 0.02, 0.03], 0.004)), sdf.box([0.007, 0.026, 0.01], 0.003).at(0.002, 0, 0.003))
      .rotateZ(-38)
      .at(strapAt[0], strapAt[1], strapAt[2] + 0.005);
    const knifeBlade = sdf.cone([0, -0.02, 0], [0, -0.13, 0], 0.011, 0.002).scale([1, 1, 0.4]).rotateZ(-8).at(knifeAt[0], knifeAt[1] + 0.005, knifeAt[2] + 0.02);
    k.body('brass', sdf.union(buckleBig.bone('spine'), buckleStrap.bone('chest')), { color: C.brass, roughness: 0.4, metalness: 0.85, detail: 0.004 });
    void knifeBlade;

    // ------------------------------------------------------------------ the axe in the right hand
    // Built upright (haft along Y, edge toward +X), turned so the haft runs along +Z and the edge
    // faces down, then yawed out a little around the fist.
    // A bearded axe head: a flat plate 0.11 m tall (0.125 with the beard) and 0.09 m wide, with a
    // curved edge, a beard that hooks down toward the butt, a socket collar and a flat poll.
    const YC = 0.24;
    const axeOutline = profile.polygon(
      [
        [0.006, YC + 0.056],
        [0.05, YC + 0.063],
        [0.088, YC + 0.05],
        [0.102, YC + 0.02],
        [0.105, YC],
        [0.102, YC - 0.02],
        [0.09, YC - 0.045],
        [0.06, YC - 0.062],
        [0.035, YC - 0.08],
        [0.02, YC - 0.092],
        [0.014, YC - 0.07],
        [0.006, YC - 0.04],
      ],
      { smooth: true, samples: 3 },
    );
    const edgeX = (y: number) => 0.106 - 4.5 * (y - YC) * (y - YC);
    const axeHeadLocal = sdf
      .union(
        sdf.extrude(axeOutline, 0.012, 0.003),
        sdf.cylinder(0.016, 0.025, 0.004).at(0, YC, 0),
        sdf.box([0.034, 0.03, 0.022], 0.005).at(-0.024, YC, 0),
      )
      .paintFn((x, y, z, base) => (x > edgeX(y) - 0.011 && x > 0.04 ? rgb(C.axeEdge) : base))
      .at(0, -YC, 0)
      .scale(1.15)
      .at(0, YC + 0.005, 0);
    const haftLocal = sdf.union(sdf.capsule([0, -0.035, 0], [0, 0.32, 0], 0.0155), sdf.sphere(0.019).at(0, -0.04, 0).scale([1, 0.7, 1]));
    const axePose = (s: sdf.Shape) => s.rotateX(90).rotateZ(-90).rotateY(-AXE_YAW).at(...FIST_R);
    k.body('axe-head', axePose(axeHeadLocal), { color: C.axeHead, roughness: 0.4, metalness: 0.8, detail: 0.003, bone: 'hand.R' });
    k.body('axe-haft', axePose(haftLocal), { color: C.haft, roughness: 0.75, detail: 0.004, bone: 'hand.R' });

    // ------------------------------------------------------------------ the buckler on the left arm
    const BUCK: V3 = [0.29, 0.25, 0.055];
    const bucklerPose = (s: sdf.Shape) => s.rotateZ(-90).rotateY(-35).at(...BUCK);
    const disc = sdf
      .cylinder(0.118, 0.024, 0.008)
      .paintFn((x, y, z, base) => (Math.abs(Math.sin(z * 55)) < 0.06 ? rgb('#5a3e24') : base));
    const rim = sdf.torus(0.115, 0.012).at(0, 0.0, 0);
    const boss = sdf.ellipsoid([0.04, 0.026, 0.04]).at(0, 0.02, 0);
    const grip = sdf.capsule([0, -0.026, -0.04], [0, -0.026, 0.04], 0.009);
    k.body('buckler', bucklerPose(disc), { color: C.wood, roughness: 0.8, bump: (x, y, z) => 0.0008 * noise.fbm(x * 40, y * 40, z * 200, 2), detail: 0.005, bone: 'forearm.L' });
    k.body('buckler-iron', bucklerPose(sdf.union(rim, boss, grip)), { color: C.iron, roughness: 0.45, metalness: 0.8, detail: 0.004, bone: 'forearm.L' });

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop, keys, reach, orient, quat, follow, euler } = motion;
    void quat;
    void follow;
    void euler;
    const LEG = 0.19;
    const norm = (a: V3): V3 => {
      const l = Math.hypot(a[0], a[1], a[2]);
      return [a[0] / l, a[1] / l, a[2] / l];
    };
    const add = (a: V3, b: V3, s = 1): V3 => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
    const DEG = Math.PI / 180;
    const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
    const ease = (a: number, b: number, x: number) => {
      const t = clamp01((x - a) / (b - a));
      return t * t * (3 - 2 * t);
    };
    const ARM_L = { root: SHOULDER, mid: ELBOW_L, end: WRIST_L };
    const ARM_R = { root: mx(SHOULDER), mid: ELBOW_R, end: WRIST_R };

    // The axe frame: the haft direction for a pitch a (degrees; 0 = forward, 90 = straight up,
    // 150 = up and back), and the edge direction (the swing direction of the head).
    const LEAN = -0.6;
    const haftDir = (a: number): V3 => norm([LEAN - 0.55 * Math.max(0, Math.sin(a * DEG)), Math.sin(a * DEG), Math.cos(a * DEG) * 0.95]);
    const edgeDir = (a: number): V3 => [0, -Math.cos(a * DEG), Math.sin(a * DEG)];
    const REST_D = haftDir(0);
    const REST_E = edgeDir(0);
    const POLE_REST_R: V3 = add(mx(SHOULDER), add(ELBOW_R, mx(SHOULDER), -1), 4);
    /** The right arm and hand that put the wrist at `wrist` with the axe pitched `a`. */
    const axeArm = (wrist: V3, a: number, pole: V3) => {
      const arm = reach(ARM_R, wrist, pole);
      const hand = orient([arm.upper, arm.lower], { dir: REST_D, up: REST_E }, { dir: haftDir(a), up: edgeDir(a) });
      return { arm, hand };
    };

    k.animation('idle', {
      duration: 2.4,
      pose: (_t, p) => ({
        hips: { move: [0, -0.003 * bump(p), 0] },
        chest: { rotate: [2.5 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        head: { rotate: [0, 9 * wave(p, 1, 0.25), 2 * wave(p, 1, 0.1)] },
        'upperarm.L': { rotate: [2 * wave(p, 1, 0.1), 0, 3 * bump(p)] },
        'upperarm.R': { rotate: [2 * wave(p, 1, 0.1), 0, -3 * bump(p)] },
        'forearm.L': { rotate: [-4 * bump(p), 0, 0] },
        'forearm.R': { rotate: [-3 * bump(p), 0, 0] },
      }),
    });

    const stride = (duration: number, step: number, footLift: number, duty: number, bob: number, armSwing: number, lean: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        const hipsTurn = [0, 6 * s, 0] as const;
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
          chest: { rotate: [lean * 0.5, -9 * s, 0] as const },
          head: { rotate: [-lean, 4 * s, 0] as const },
          'upperarm.L': { rotate: [armSwing * 0.45 * s, 0, 6] as const },
          'forearm.L': { rotate: [-12, 0, 0] as const },
          'upperarm.R': { rotate: [-armSwing * 0.4 * s, 0, -6] as const },
          'forearm.R': { rotate: [-18 - armSwing * 0.2, 0, 0] as const },
        };
      },
    });
    // A heavy, steady tread; the run is quick with a flight phase.
    k.animation('walk', stride(0.95, 0.1, 0.025, 0.6, 0.006, 22, 3));
    k.animation('run', stride(0.6, 0.145, 0.045, 0.4, 0.028, 40, 11));

    // Attack: an overhead chop with the right hand. The wrist follows its keys, the haft follows
    // its pitch. Wind-up: the chest turns right and the axe rises high over the right shoulder
    // with the head back, for a short hold. Cut: the head comes over and down in front as the left
    // foot steps in. Follow-through: the head stops low and forward, then recovers to rest.
    k.animation('attack', {
      duration: 0.85,
      loop: false,
      pose: (_t, p) => {
        const wrist = keys(
          p,
          [
            [0, WRIST_R],
            [0.14, [-0.24, 0.35, 0.03]],
            [0.28, [-0.285, 0.47, -0.03]],
            [0.4, [-0.29, 0.485, -0.045]],
            [0.46, [-0.275, 0.48, 0.0]],
            [0.52, [-0.2, 0.42, 0.11]],
            [0.57, [-0.15, 0.36, 0.165]],
            [0.66, [-0.145, 0.345, 0.165]],
            [0.86, [-0.19, 0.29, 0.12]],
            [1, WRIST_R],
          ] as const,
          'spline',
        );
        const a = keys(
          p,
          [
            [0, 0],
            [0.14, 30],
            [0.28, 125],
            [0.4, 140],
            [0.46, 128],
            [0.5, 96],
            [0.55, 40],
            [0.6, 4],
            [0.7, -2],
            [0.86, -6],
            [1, 0],
          ] as const,
          'spline',
        );
        const pole = keys(p, [[0, POLE_REST_R], [0.28, [-0.55, 0.3, -0.25]], [0.42, [-0.55, 0.3, -0.2]], [0.52, [-0.45, 0.1, 0.4]], [0.75, [-0.4, 0.0, 0.4]], [1, POLE_REST_R]] as const);
        const { arm, hand } = axeArm(wrist, a, pole);
        const wind = ease(0, 0.28, p) * (1 - ease(0.4, 0.5, p));
        const cut = ease(0.41, 0.55, p) * (1 - ease(0.72, 1, p));
        return {
          hips: { move: [-0.012 * wind + 0.01 * cut, -legDrop(LEG, 16 * cut) - 0.006 * wind, 0.035 * cut - 0.012 * wind], rotate: [0, -8 * wind + 18 * cut, 0] },
          spine: { rotate: [-5 * wind + 10 * cut, 6 * cut, 0] },
          chest: { rotate: [-5 * wind + 5 * cut, -14 * wind + 16 * cut, 0] },
          head: { rotate: [-2 * wind + 4 * cut, 6 * wind - 12 * cut, 0] },
          'upperarm.R': { rotate: arm.upper },
          'forearm.R': { rotate: arm.lower },
          'hand.R': { rotate: hand },
          // The buckler arm guards: it comes up and forward in the wind-up, and drops for the cut.
          'upperarm.L': { rotate: [-16 * wind - 6 * cut, 0, 6 * wind] },
          'forearm.L': { rotate: [-30 * wind - 12 * cut, 0, 0] },
          'leg.L': { rotate: [-6 * wind - 22 * cut, 0, 0] },
          'leg.R': { rotate: [-3 * wind + 12 * cut, 0, 0] },
          'foot.L': { rotate: [6 * wind + 16 * cut, 0, 0] },
          'foot.R': { rotate: [3 * wind - 8 * cut, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ hit: a blow from the front
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
        return {
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
          'upperarm.R': { rotate: [-10 * h, 0, -14 * h] },
          'forearm.R': { rotate: [-6 * h, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ death: a stagger, then a fall on the back
    const LIE = 86;
    const LIE_Y = 0.13;
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
        const back = 0.022 * hitB;
        const lean = plant(back);
        const a = tilt * DEG;
        const hipsY = Math.max(LIE_Y, 0.2 * Math.cos(a) + HEEL * Math.sin(a));
        const hipsMove: V3 = [0, hipsY - 0.2 - legDrop(SHIN, lean), -HEEL - 0.2 * Math.sin(a) + HEEL * Math.cos(a) - back];
        const legs = 16 * clamp01((tilt - 70) / 16);
        const standR = add(add(add(WRIST_R, [-0.05, 0.02, -0.05], hitB), [0, -0.07, -0.03], sag), [-0.07, 0, 0.04], fly);
        const armR = reach(ARM_R, lerp(standR, [-0.235, 0.27, -0.09], land), lerp(ELBOW_R, [-0.3, 0.3, -0.05], land));
        const standL = add(add(add(WRIST_L, [0.05, 0.04, 0.02], hitB), [0, -0.02, 0.03], sag), [0.07, 0.06, 0.04], fly);
        const armL = reach(ARM_L, lerp(standL, [0.29, 0.34, 0.03], land), lerp(ELBOW_L, [0.35, 0.36, 0.03], land));
        return {
          hips: { move: hipsMove, rotate: [-tilt, 0, 0] },
          spine: { rotate: [-8 * hitB + 6 * sag, 0, 4 * wob] },
          chest: { rotate: [-10 * hitB + 5 * sag, 6 * hitB, 5 * wob] },
          neck: { rotate: [-8 * hitB + 5 * sag + 8 * land, 0, 0] },
          head: { rotate: [-16 * hitB + 8 * sag + 10 * land, -8 * hitB + 30 * land, 8 * wob] },
          'upperarm.L': { rotate: armL.upper },
          'forearm.L': { rotate: armL.lower },
          'upperarm.R': { rotate: armR.upper },
          'forearm.R': { rotate: armR.lower },
          'leg.L': { rotate: [-lean + legs, 0, 8 * land] },
          'leg.R': { rotate: [-lean + legs, 0, -8 * land] },
          'foot.L': { rotate: [lean, 20 * land, 0] },
          'foot.R': { rotate: [lean, -20 * land, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ taunt: the axe pumped twice
    // He raises the axe over his head and shakes it twice with a roar (the head thrown back), the
    // buckler arm pumping against the chest.
    k.animation('taunt', {
      duration: 1.5,
      loop: false,
      pose: (_t, p) => {
        const up = keys(p, [[0, 0], [0.16, 1], [0.8, 1], [1, 0]] as const);
        const pump = keys(p, [[0.16, 0], [0.28, 1], [0.4, 0], [0.52, 1], [0.64, 0], [0.76, 0.3], [0.85, 0]] as const);
        const wrist = lerp(WRIST_R, [-0.28, 0.46 + 0.03 * pump, 0.02], up);
        const a = 88 + 16 * pump - 12 * (1 - up);
        const { arm, hand } = axeArm(wrist, up < 0.02 ? 0 : lerp([0, 0, 0], [a, 0, 0], up)[0]!, lerp(POLE_REST_R, [-0.5, 0.3, -0.2], up));
        return {
          spine: { rotate: [-4 * up + 2 * pump, 0, 0] },
          chest: { rotate: [-5 * up + 3 * pump, -4 * up, 0] },
          neck: { rotate: [-5 * up, 0, 0] },
          head: { rotate: [-10 * up - 4 * pump, 6 * wave(p, 2, 0.2) * up, 4 * up] },
          'upperarm.R': { rotate: arm.upper },
          'forearm.R': { rotate: arm.lower },
          'hand.R': { rotate: hand },
          'upperarm.L': { rotate: [-18 * up - 6 * pump, 0, 16 * up] },
          'forearm.L': { rotate: [-28 * up - 8 * pump, 0, 0] },
        };
      },
    });
  },
});
