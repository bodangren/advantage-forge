import { defineAsset, motion, noise, profile, rgb, sdf, THREE } from '../src/index.js';

/**
 * Raider — Chibi Quest enemy (catalog `enemies/humanoid/raider`), about 0.94 m to the helmet top,
 * faces +Z. Target: docs/enemy-mockups/raider_001.jpg. Built on the brigand's rig (the bandit
 * skeleton with knee bones), so the human enemies read as one set.
 *
 * Role: a northern human enemy, seen in 3D and as a 128 px sprite; the helmet with its nose guard,
 *   the blond beard, the fur collar and the big round shield must read at that size.
 * One idea: a snarling blond-bearded northman under an iron dome helmet, a grey wolf fur collar on
 *   his shoulders, an axe in the right hand and a big round iron shield on the left arm.
 * Shape language: square and heavy (helmet, shield, jerkin) with a round face and a huge beard.
 * Palette (60/30/10): iron greys (helmet #6a6c70, shield #6e7076) and leather browns (jerkin
 *   #5a3a26, belt #3a2a1e); the blond beard #d8a850 is the accent and the face's focal point.
 * Bodies: skin, brows, helmet, brow band, rivets, beard, fur, sleeves, tunic, jerkin, straps, kilt,
 *   trousers, boots, leather (belt, tabs, wraps), iron buckle, axe, shield, shield rim, boss.
 * Rig: the brigand skeleton. The axe is rigid on `hand.R`, the shield on `forearm.L`.
 *   Clips: idle, walk, run, attack (an overhead chop), hit, death, taunt (pumps the axe twice).
 */

const C = {
  skin: '#f0c8a0',
  nose: '#e09a80',
  eyeWhite: '#f2ece2',
  irisRim: '#1c120c',
  iris: '#2a1a10',
  pupil: '#0e0a08',
  lid: '#16100c',
  mouth: '#2a0e10',
  lip: '#b8685a',
  teeth: '#f0ece0',
  helmet: '#6a6c70',
  rivet: '#8a8c90',
  band: '#4e5054',
  beard: '#d8a850',
  beardShade: '#b08838',
  fur: '#7a7a74',
  furShade: '#5a5a56',
  furTip: '#9a9a94',
  jerkin: '#5a3a26',
  jerkinLit: '#7a5236',
  jerkinDark: '#3e281a',
  sleeve: '#6a6a64',
  kilt: '#6a6a64',
  leather: '#3a2a1e',
  wrap: '#4a3222',
  trousers: '#3a3a40',
  boot: '#4a3020',
  sole: '#2a2018',
  axeHead: '#7a7c84',
  axeEdge: '#b9c0c8',
  haft: '#5a3a24',
  shield: '#6e7076',
  shieldRim: '#4e5054',
  boss: '#8a8c90',
  iron: '#6a6c70',
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
  name: 'raider',
  description: 'Chibi raider enemy: an iron dome helmet with a riveted brow band and a nose guard, a snarling face under a huge blond beard, a grey wolf fur collar, a leather jerkin, a bearded axe and a big round iron shield.',
  detail: 0.006,
  reference: 'docs/enemy-mockups/raider_001.jpg',
  variants: {
    beard: { blond: C.beard, red: '#b0522a', black: '#24201c' },
    fur: { grey: C.fur, brown: '#5a4a3a', white: '#c8c4bc' },
    jerkin: { brown: C.jerkin, black: '#2a2622', green: '#4a5a34' },
  },
  presets: {
    northman: { beard: 'blond', fur: 'grey', jerkin: 'brown' },
    firebeard: { beard: 'red', fur: 'brown', jerkin: 'green' },
    nightwolf: { beard: 'black', fur: 'white', jerkin: 'black' },
  },

  build(k) {
    const T = {
      beard: k.tint('beard'),
      beardShade: k.tint('beard', { color: C.beardShade, follow: 1 }),
      fur: k.tint('fur'),
      furShade: k.tint('fur', { color: C.furShade, follow: 1 }),
      furTip: k.tint('fur', { color: C.furTip, follow: 1 }),
      jerkin: k.tint('jerkin'),
      jerkinLit: k.tint('jerkin', { color: C.jerkinLit, follow: 1 }),
      jerkinDark: k.tint('jerkin', { color: C.jerkinDark, follow: 1 }),
    };
    // The axe grip (the fist center of the right hand) and the shield's grip point.
    const FIST_R: V3 = [WRIST_R[0] - 0.007, WRIST_R[1] - 0.038, WRIST_R[2] + 0.004];
    const FIST_L: V3 = [WRIST_L[0] + 0.007, WRIST_L[1] - 0.038, WRIST_L[2] + 0.004];
    const AXE_RP = 38; // the rest pitch of the haft, degrees above horizontal (before the lean)
    const LEAN = -0.6; // the sideways lean of the haft: it points out to the right
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
    // A big nose.
    const nose = sdf.ellipsoid([0.046, 0.041, 0.045]).at(0, NOSE_Y, faceZ(0, NOSE_Y) - 0.006).bone('head');
    const ears = pair(sdf.ellipsoid([0.02, 0.04, 0.03]).at(0.2, 0.625, 0.0)).bone('head');
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
    // Wide white eyes with small dark pupils under a heavy glare.
    const eyeWhite = pair(at(sdf.ellipsoid([0.034, 0.032, 0.07]), EYE[0], EYE[1]));
    // The pupils sit 0.006 m toward the character's right (-X) in both eyes: a sideways glare.
    const gaze = (s: sdf.Shape, dy: number) => sdf.union(at(s, EYE[0] - 0.006, EYE[1] + dy), at(s, -EYE[0] - 0.006, EYE[1] + dy));
    const irisRim = gaze(sdf.ellipsoid([0.027, 0.029, 0.07]), -0.003);
    const iris = gaze(sdf.ellipsoid([0.023, 0.0255, 0.07]), -0.004);
    const pupil = gaze(sdf.ellipsoid([0.017, 0.0187, 0.07]), -0.002);
    const lid = pair(
      sdf
        .extrude(
          profile.polygon([
            [EYE[0] - 0.06, EYE[1] + 0.0],
            [EYE[0] + 0.06, EYE[1] + 0.026],
            [EYE[0] + 0.06, EYE[1] + 0.09],
            [EYE[0] - 0.06, EYE[1] + 0.09],
          ]),
          0.3,
        )
        .at(0, 0, 0.1),
    );
    // A dark lid edge along the lowered upper lid.
    const lidLine = pair(
      sdf
        .extrude(
          profile.polygon([
            [EYE[0] - 0.06, EYE[1] - 0.004],
            [EYE[0] + 0.06, EYE[1] + 0.022],
            [EYE[0] + 0.06, EYE[1] + 0.027],
            [EYE[0] - 0.06, EYE[1] + 0.001],
          ]),
          0.3,
        )
        .at(0, 0, 0.1),
    );
    const shine = sdf.union(...[EYE[0], -EYE[0]].map((x) => at(sdf.sphere(0.006), x + 0.009, EYE[1] + 0.004)));
    // Thick blond brows: the inner ends dip hard toward the nose. Raised 0.008 m above the skin.
    const browXs = [0.035, 0.065, 0.1, 0.13, 0.175];
    const browC = (x: number) => 0.652 + 0.364 * (x - 0.045);
    const browH = (x: number) => 0.0145 - 0.004 * ((x - 0.035) / 0.14);
    const browArch = (x: number) => 0.003 * Math.sin(((x - 0.035) / 0.14) * Math.PI);
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
    const browBody = head.round(0.008).subtract(head.round(-0.012)).intersect(brows);
    // The open, snarling mouth: a cavity in the face, cut through the beard too. A light teeth strip
    // sits inside it.
    const MOUTH_Y = 0.512;
    const mouthZ = faceZ(0, MOUTH_Y);
    // A wide grin: an arc slot 0.14 m across whose ends curve up.
    const MOUTH_R = 0.14;
    const cavity = sdf.extrude(profile.arc(MOUTH_R, 0.022, 240, 300), 0.1, 0.004).at(0, MOUTH_Y + MOUTH_R, mouthZ - 0.02);
    const teeth = sdf.box([0.05, 0.012, 0.01], 0.003).at(0, MOUTH_Y + 0.005, mouthZ - 0.006);
    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.02, nose)
      .smoothUnion(0.012, ears)
      .union(armL, armR)
      .subtract(cavity)
      .paintWhere(nose.round(0.006), C.nose, 0.01)
      .paintWhere(eyeWhite, C.eyeWhite)
      .paintWhere(irisRim, C.irisRim)
      .paintWhere(iris, C.iris)
      .paintWhere(pupil, C.pupil)
      .paintWhere(shine, '#ffffff')
      .paintWhere(lid.intersect(eyeWhite.round(0.004)), C.skin)
      .paintWhere(lidLine.intersect(eyeWhite.round(0.004)), C.lid)
      .paintWhere(cavity.round(0.012), C.lip)
      .paintWhere(cavity.round(0.002), C.mouth, 0.004);
    k.body('skin', skin, { color: C.skin, roughness: 0.55, textureDensity: 2, detail: 0.004 });
    k.body('teeth', teeth.bone('head'), { color: C.teeth, roughness: 0.4, detail: 0.003 });
    k.body('brows', browBody.bone('head'), { color: T.beard, roughness: 0.85, detail: 0.004 });

    // ------------------------------------------------------------------ iron dome helmet
    const HZ = -0.005;
    const dome = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.945],
            [0.07, 0.94],
            [0.14, 0.918],
            [0.19, 0.878],
            [0.214, 0.82],
            [0.222, 0.76],
            [0.222, 0.735],
            [0, 0.735],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.95])
      .at(0, 0, HZ);
    // The crown strap over the top, and the nose guard: a flat plate that tapers down the forehead.
    const strapUp = dome
      .round(0.01)
      .subtract(dome)
      .intersect(
        sdf.extrude(
          profile.polygon([
            [-0.034, 0.73],
            [0.034, 0.73],
            [0.026, 0.99],
            [-0.026, 0.99],
          ]),
          0.6,
        ),
      );
    const guard = head
      .round(0.011)
      .subtract(head.round(0.001))
      .intersect(
        sdf
          .extrude(
            profile.polygon([
              [-0.034, 0.77],
              [0.034, 0.77],
              [0.021, 0.626],
              [-0.021, 0.626],
            ]),
            0.3,
          )
          .at(0, 0, 0.2),
      );
    k.body('helmet', sdf.union(dome, strapUp, guard).bone('head'), {
      color: C.helmet,
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.005,
      bump: (x, y, z) => 0.0005 * noise.fbm(x * 70, y * 70, z * 70, 2),
    });
    // The brow band: a straight ring 0.026 m tall at the base of the dome, with eight rivets.
    const BAND_Y = 0.752;
    const RING_R = 0.232;
    const band = sdf
      .cylinder(RING_R, 0.026, 0.007)
      .subtract(sdf.cylinder(0.196, 0.2))
      .scale([1, 1, 0.95])
      .at(0, BAND_Y, HZ);
    k.body('brow-band', band.bone('head'), { color: C.band, roughness: 0.5, metalness: 0.7, detail: 0.006 });
    const ringPt = (deg: number): V3 => {
      const a = (deg * Math.PI) / 180;
      return [RING_R * Math.sin(a), BAND_Y, HZ + 0.95 * RING_R * Math.cos(a)];
    };
    const rivets = sdf.union(...[-105, -75, -45, -15, 15, 45, 75, 105].map((d) => sdf.sphere(0.0095).at(...ringPt(d))));
    k.body('rivets', rivets.bone('head'), { color: C.rivet, roughness: 0.4, metalness: 0.75, detail: 0.004 });

    // ------------------------------------------------------------------ beard and hair
    const bib = sdf.ellipsoid([0.16, 0.13, 0.1]).at(0, 0.45, 0.085);
    const tuft = sdf.ellipsoid([0.085, 0.08, 0.075]).at(0, 0.36, 0.1);
    const lobes = pair(sdf.ellipsoid([0.07, 0.085, 0.08]).at(0.135, 0.545, 0.06));
    const mustache = pair(sdf.ellipsoid([0.075, 0.03, 0.045]).at(0.055, 0.548, mouthZ + 0.014).rotateZ(10));
    const beardBase = sdf.smoothUnion(0.04, bib, tuft, lobes, mustache);
    const beardZ = (x: number, y: number) => sdf.raycast(beardBase, [x, y, 1], [0, 0, -1])?.[2] ?? 0.12;
    // Five combed strand lobes: vertical ridges on the front of the bib.
    const strands = sdf.union(
      ...[-0.08, -0.04, 0, 0.04, 0.08].map((x) => sdf.capsule([x, 0.45, beardZ(x, 0.45) - 0.008], [x, 0.35, beardZ(x, 0.35) - 0.008], 0.015)),
    );
    // A moustache lobe: a chain that sweeps out and down over the beard on each side.
    const mustLobe = pair(
      sdf.chain(
        [
          [0.012, 0.553, beardZ(0.012, 0.553) - 0.004, 0.012],
          [0.05, 0.55, beardZ(0.05, 0.55) - 0.004, 0.012],
          [0.095, 0.536, beardZ(0.095, 0.536) - 0.004, 0.012],
          [0.13, 0.512, beardZ(0.13, 0.512) - 0.004, 0.011],
        ],
        0.01,
      ),
    );
    const beardFront = sdf
      .smoothUnion(0.012, beardBase, strands, mustLobe)
      .subtract(sdf.ellipsoid([0.045, 0.05, 0.1]).at(0, 0.61, 0.2)) // the nose and cheeks stay bare
      .subtract(cavity.round(0.012));
    // Blond hair at the back and the sides of the head, under the helmet band; it blends into the beard.
    const hairShell = sdf.smoothSubtract(
      0.02,
      head.round(0.012).subtract(head).intersect(sdf.box([0.5, 0.16, 0.26]).at(0, 0.66, -0.1).round(0.01)),
      sdf.box([0.5, 0.5, 0.3]).at(0, 0.6, 0.17).scale([0.7, 1, 1]),
    );
    const beardShape = beardFront.smoothUnion(0.02, hairShell).displace(0.005, (x, y, z) => noise.fbm(x * 30, y * 10, z * 30, 2));
    const strandPhase = (x: number, y: number, z: number) => (x + z * 0.5) * 150 + noise.noise3(x * 20, y * 6, z * 20) * 4;
    const beard = beardShape.paintFn((x, y, z, base) => (Math.sin(strandPhase(x, y, z)) > 0.75 ? rgb(T.beardShade) : base));
    k.body('beard', beard.bone('head'), {
      color: T.beard,
      roughness: 0.85,
      bump: (x, y, z) => 0.0022 * Math.sin(strandPhase(x, y, z)),
    });

    // ------------------------------------------------------------------ tunic, fur collar, jerkin
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
    k.body('tunic', torso.bone('spine'), { color: C.sleeve, roughness: 0.9, bump: (x, y, z) => 0.0008 * Math.sin(x * 500) * Math.sin(y * 500 + z * 100) });
    // Cloth sleeves on the upper arms.
    const sleeve = (s: V3, e: V3, tag: string) => sdf.cone([s[0] * 0.85, 0.405, 0], lerp(s, e, 0.6), 0.05, 0.045).bone(tag);
    k.body('sleeves', sdf.union(sleeve(SHOULDER, ELBOW_L, 'upperarm.L'), sleeve(mx(SHOULDER), ELBOW_R, 'upperarm.R')), {
      color: C.sleeve,
      roughness: 0.9,
      bump: (x, y, z) => 0.0008 * Math.sin(x * 500) * Math.sin(y * 500 + z * 100),
    });
    // The wolf fur collar: a thick ring over both shoulders with a ragged lower edge.
    const furFn = (x: number, y: number, z: number) => noise.fbm(x * 45, y * 45, z * 45, 2) * (1 + Math.max(0, (0.44 - y) * 18));
    // The ring sits high (y 0.47) with its front 0.02 m lower than the back; eight clumps sit on
    // its outer edge at alternating heights so two grey mounds rise beside the beard.
    const furRing = sdf.torus(0.15, 0.055).scale([1.06, 1, 0.85]);
    const furClumps = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
      const a = (i * 45 * Math.PI) / 180;
      return sdf
        .ellipsoid([0.06, 0.04, 0.04])
        .rotateY(i * 45)
        .at(1.06 * 0.2 * Math.sin(a), i % 2 === 0 ? 0.022 : -0.014, 0.85 * 0.2 * Math.cos(a));
    });
    const fur = sdf
      .smoothUnion(0.02, furRing, ...furClumps)
      .rotateX(7)
      .at(0, 0.47, -0.03)
      .displace(0.01, furFn)
      .paintFn((x, y, z, base) => {
        const n = noise.fbm(x * 60 + 3, y * 60, z * 60, 2);
        return n > 0.3 || y > 0.475 ? rgb(T.furTip) : n < -0.28 ? rgb(T.furShade) : base;
      })
      .bone('chest');
    const furStrand = (x: number, y: number, z: number) => Math.sin((Math.atan2(x, z) * 60 + y * 30) + noise.noise3(x * 25, y * 25, z * 25) * 3);
    k.body('fur', fur, { color: T.fur, roughness: 1, detail: 0.0075, bump: (x, y, z) => 0.0028 * furStrand(x, y, z) });
    // The jerkin: a closed leather shell over the tunic, with cross-stitch marks in the normal map.
    const HEM = 0.2;
    const jerkin = torso
      .round(0.012)
      .subtract(torso.round(0.001))
      .intersect(sdf.halfSpace([0, 1, 0], 0.44))
      .intersect(sdf.halfSpace([0, -1, 0], -HEM))
      .subtract(pair(sdf.ellipsoid([0.06, 0.07, 0.07]).at(0.13, 0.38, 0)))
      .paintFn((x, y, z, base) => (Math.abs(noise.fbm(x * 38, y * 20, z * 38, 2)) < 0.04 || y < 0.212 ? rgb(T.jerkinDark) : base));
    const cross = (x: number, y: number, cx: number, cy: number, s: number) => {
      const dx = x - cx;
      const dy = y - cy;
      if (Math.abs(dx) > s || Math.abs(dy) > s) return 0;
      return Math.exp(-(((dx - dy) / 0.0022) ** 2)) + Math.exp(-(((dx + dy) / 0.0022) ** 2));
    };
    // Two diagonal grooves 0.012 m wide cross the right chest, and a row of small crosses runs lower.
    const stitch = (x: number, y: number, z: number) => {
      if (z < 0.02) return 0;
      const dx = x - 0.055;
      const dy = y - 0.365;
      let s = 0;
      if (Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05) s += Math.exp(-(((dx - dy) / 0.0085) ** 2)) + Math.exp(-(((dx + dy) / 0.0085) ** 2));
      for (let i = -3; i <= 3; i++) s += cross(x, y, i * 0.03, 0.275, 0.011);
      return s;
    };
    k.body('jerkin', jerkin.bone('chest'), {
      color: T.jerkin,
      roughness: 0.65,
      bump: (x, y, z) => 0.0007 * noise.fbm(x * 90, y * 90, z * 90, 2) - 0.003 * stitch(x, y, z),
    });
    // A raised strap 0.026 m wide crosses the chest from the left shoulder to the right hip.
    const chestStrap = torso
      .round(0.016)
      .subtract(torso.round(-0.01))
      .intersect(sdf.box([0.026, 0.8, 0.7], 0.004).rotateZ(-37).at(-0.005, 0.32, 0))
      .intersect(sdf.halfSpace([0, 1, 0], 0.44))
      .intersect(sdf.halfSpace([0, -1, 0], -0.2))
      .intersect(sdf.halfSpace([0, 0, -1], -0.03));
    k.body('straps', chestStrap.bone('chest'), {
      color: T.jerkinLit,
      roughness: 0.6,
      detail: 0.005,
      bump: (x, y, z) => 0.0007 * noise.fbm(x * 90, y * 90, z * 90, 2),
    });
    // The kilt flap: a short cloth panel over the trousers, under the belt.
    const kilt = sdf
      .revolve(
        profile.polygon([
          [0.125, 0.235],
          [0.147, 0.235],
          [0.162, 0.148],
          [0.148, 0.148],
        ]),
      )
      .scale([1, 1, 0.8])
      .round(0.004)
      .intersect(sdf.box([0.19, 0.2, 0.2]).at(0, 0.19, 0.12));
    k.body('kilt', kilt.bone('spine'), { color: C.kilt, roughness: 0.9, detail: 0.005, bump: (x, y, z) => 0.0008 * Math.sin(x * 400) * Math.sin(y * 60 + z * 40) });

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

    // ------------------------------------------------------------------ leather: belt, tabs, wraps
    const beltY = 0.232;
    const belt = torso
      .round(0.014)
      .smoothIntersect(0.006, sdf.box([0.5, 0.06, 0.5], 0.006).at(0, beltY, 0))
      .subtract(torso.round(-0.012));
    // Hanging tabs: one on each hip and one in front of the kilt.
    const tab = (deg: number, w: number, len: number, shape: sdf.Shape = torso) => {
      const a = (deg * Math.PI) / 180;
      const p = sdf.surfacePoint(shape, [Math.sin(a) * 0.3, 0.2, Math.cos(a) * 0.3], 0.006);
      return sdf.box([w, len, 0.009], 0.004).rotateX(4).rotateY(deg).at(p[0], beltY - 0.012 - len / 2 + 0.01, p[2]);
    };
    const tabs = sdf.union(tab(-68, 0.046, 0.11), tab(70, 0.046, 0.11), tab(0, 0.03, 0.09, kilt), tab(-46, 0.04, 0.06), tab(46, 0.04, 0.06));
    const wrapRings = (e: V3, w: V3, tag: string) => {
      const d = new THREE.Vector3(w[0] - e[0], w[1] - e[1], w[2] - e[2]).normalize();
      const rings = [0.3, 0.42, 0.54, 0.66, 0.78, 0.9].map((t) => {
        const c = lerp(e, w, t);
        const r = 0.036 - 0.004 * t + 0.006;
        const a: V3 = [c[0] - d.x * 0.009, c[1] - d.y * 0.009, c[2] - d.z * 0.009];
        const b: V3 = [c[0] + d.x * 0.009, c[1] + d.y * 0.009, c[2] + d.z * 0.009];
        return sdf.cone(a, b, r, r).round(0.004);
      });
      return sdf.union(...rings).bone(tag);
    };
    k.body(
      'leather',
      sdf.union(belt.bone('spine'), tabs.bone('spine'), wrapRings(ELBOW_R, WRIST_R, 'forearm.R'), wrapRings(ELBOW_L, WRIST_L, 'forearm.L')),
      { color: C.leather, roughness: 0.6, detail: 0.005 },
    );
    const beltZ = sdf.raycast(belt, [0, beltY, 1], [0, 0, -1])![2];
    const buckle = sdf
      .union(
        sdf.cylinder(0.036, 0.014, 0.004).rotateX(90),
        sdf.sphere(0.017).scale([1, 1, 0.55]).at(0, 0, 0.008).paint('#8a8c90'),
      )
      .at(0, beltY, beltZ + 0.004);
    k.body('iron', buckle.bone('spine'), { color: C.iron, roughness: 0.4, metalness: 0.75, detail: 0.004 });

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
    // In the rest pose the haft points forward, out and up: the same frame (haftDir, edgeDir of the
    // rest pitch AXE_RP) that the clips use, so the axe head hangs at chest height. The Euler angles
    // turn the upright model (haft +Y, edge +X) into that frame.
    const rpRad = (AXE_RP * Math.PI) / 180;
    const restD = new THREE.Vector3(LEAN - 0.55 * Math.sin(rpRad), Math.sin(rpRad), Math.cos(rpRad) * 0.95).normalize();
    const restE = new THREE.Vector3(0, -Math.cos(rpRad), Math.sin(rpRad));
    restE.sub(restD.clone().multiplyScalar(restE.dot(restD))).normalize();
    const restEuler = new THREE.Euler().setFromRotationMatrix(new THREE.Matrix4().makeBasis(restE, restD, restE.clone().cross(restD)), 'XYZ');
    const toDeg = (r: number) => (r * 180) / Math.PI;
    const axePose = (s: sdf.Shape) => s.rotateZ(toDeg(restEuler.z)).rotateY(toDeg(restEuler.y)).rotateX(toDeg(restEuler.x)).at(...FIST_R);
    k.body('axe-head', axePose(axeHeadLocal), { color: C.axeHead, roughness: 0.4, metalness: 0.8, detail: 0.003, bone: 'hand.R' });
    k.body('axe-haft', axePose(haftLocal), { color: C.haft, roughness: 0.75, detail: 0.004, bone: 'hand.R' });

    // ------------------------------------------------------------------ the round iron shield on the left arm
    // Built with its face normal along +Y and its center at the origin, turned to face out and a
    // little forward, with the grip bar (0.058 m behind the disc) through the left fist.
    const SH_YAW = 30;
    const shN = [Math.cos((SH_YAW * Math.PI) / 180), 0, Math.sin((SH_YAW * Math.PI) / 180)] as const;
    const BUCK: V3 = [FIST_L[0] + shN[0] * 0.058, FIST_L[1], FIST_L[2] + shN[2] * 0.058];
    const shieldPose = (s: sdf.Shape) => s.rotateZ(-90).rotateY(-SH_YAW).at(...BUCK);
    const disc = sdf.cylinder(0.16, 0.02, 0.006).paintFn((x, y, z, base) => (Math.abs(Math.hypot(x, z) - 0.09) < 0.004 ? rgb('#5c5e64') : base));
    const shRim = sdf.torus(0.152, 0.014);
    const boss = sdf.sphere(0.03).scale([1, 0.8, 1]).at(0, 0.012, 0);
    const grip = sdf.union(
      sdf.capsule([0, -0.058, -0.045], [0, -0.058, 0.045], 0.009),
      sdf.capsule([0, -0.058, -0.04], [0, -0.01, -0.04], 0.008),
      sdf.capsule([0, -0.058, 0.04], [0, -0.01, 0.04], 0.008),
    );
    k.body('shield', shieldPose(disc), { color: C.shield, roughness: 0.55, metalness: 0.6, bump: (x, y, z) => 0.0007 * noise.fbm(x * 60, y * 60, z * 60, 2), detail: 0.005, bone: 'forearm.L' });
    k.body('shield-rim', shieldPose(shRim), { color: C.shieldRim, roughness: 0.5, metalness: 0.7, detail: 0.005, bone: 'forearm.L' });
    k.body('shield-boss', shieldPose(sdf.union(boss, grip)), { color: C.boss, roughness: 0.4, metalness: 0.8, detail: 0.004, bone: 'forearm.L' });

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
    const haftDir = (a: number): V3 => norm([LEAN - 0.55 * Math.max(0, Math.sin(a * DEG)), Math.sin(a * DEG), Math.cos(a * DEG) * 0.95]);
    const edgeDir = (a: number): V3 => [0, -Math.cos(a * DEG), Math.sin(a * DEG)];
    const REST_D = haftDir(AXE_RP);
    const REST_E = edgeDir(AXE_RP);
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
            [0, AXE_RP],
            [0.14, 40],
            [0.28, 125],
            [0.4, 140],
            [0.46, 128],
            [0.5, 96],
            [0.55, 40],
            [0.6, 4],
            [0.7, -2],
            [0.86, 6],
            [1, AXE_RP],
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
          // The shield arm guards: it comes up and forward in the wind-up, and drops for the cut.
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
    // shield arm pumping against the chest.
    k.animation('taunt', {
      duration: 1.5,
      loop: false,
      pose: (_t, p) => {
        const up = keys(p, [[0, 0], [0.16, 1], [0.8, 1], [1, 0]] as const);
        const pump = keys(p, [[0.16, 0], [0.28, 1], [0.4, 0], [0.52, 1], [0.64, 0], [0.76, 0.3], [0.85, 0]] as const);
        const wrist = lerp(WRIST_R, [-0.28, 0.46 + 0.03 * pump, 0.02], up);
        const a = 88 + 16 * pump - 12 * (1 - up);
        const { arm, hand } = axeArm(wrist, AXE_RP * (1 - up) + a * up, lerp(POLE_REST_R, [-0.5, 0.3, -0.2], up));
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
