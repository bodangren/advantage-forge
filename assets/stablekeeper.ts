import * as THREE from 'three';
import { profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Stablekeeper — Chibi Quest settlement NPC (catalog `npcs/settlement/stablekeeper`), about 1.0 m to
 * the top of the hair, faces +Z. Target: docs/npc-mockups/stablekeeper_001.jpg. Built on the humanoid kind.
 *
 * Role: the stable NPC (rents and cares for horses), seen in 3D and as a 128 px sprite; the black
 *   beard with the big smile, the red bandana, and the two raised props must read small.
 * One idea: a sturdy, cheerful man with a curly black mop and a full beard who holds up an iron
 *   horseshoe in one fist and a wooden horse brush in the other.
 * Shape language: round and soft (curls, beard, overalls) with the horseshoe arc as the one hard form.
 * Palette (60/30/10): leather overalls #6b4a2c and black hair, beard, and boots (#231a17, #2a2428);
 *   cream shirt #f0e6cc; accent red bandana #b03a3a; iron #6a6870; wood #9a6a3a with dark bristles.
 * Value plan: the black beard and hair frame the light face; the cream sleeves separate the brown
 *   overalls from the skin; the red bandana is the one saturated spot.
 * Bodies: skin (grin), hair, beard, brows, ears, nose, shirt, cuffs, bandana, overalls, pants, buttons,
 *   boots, horseshoe, brush (wood and bristles).
 * Rig: the humanoid kind's skeleton and clips; both arms keep a raised rest pose (`pose`), the
 *   horseshoe is rigid on `knife.R` and the brush on `knife.L`.
 */

const C = {
  shirt: '#f0e6cc',
  cuff: '#e0d3b0',
  bandana: '#b03a3a',
  bandanaDark: '#8e2c2e',
  strap: '#573a22',
  button: '#2a2428',
  boot: '#2a2428',
  bootSole: '#17120f',
  iron: '#6a6870',
  wood: '#9a6a3a',
  bristle: '#3a2a20',
  mouth: '#8a2e2a',
  tongue: '#d8706a',
  teeth: '#fbf6ee',
};

// The arms keep these rest poses (left-side values; the kind mirrors the right arm).
const POSE_R = { elbow: [0.2, 0.34, 0.02], wrist: [0.25, 0.42, 0.07] } as const;
const POSE_L = { elbow: [0.215, 0.342, 0.02], wrist: [0.292, 0.42, 0.055] } as const;

export default humanoidAsset({
  name: 'stablekeeper',
  description: 'A sturdy, cheerful stablekeeper with a curly black mop, a full beard, and a red bandana, holding up a horseshoe and a horse brush.',
  reference: 'docs/npc-mockups/stablekeeper_001.jpg',
  variants: {
    skin: { tan: '#d49a72', fair: '#f2c7a4', light: '#e8b48e', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { black: '#231a17', brown: '#5a301d', auburn: '#8e3b1c', blond: '#c4974a', silver: '#b8b4c4' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { leather: '#6b4a2c', rust: '#8a4a30', olive: '#5e6b3c', indigo: '#3f5670' },
  },
  presets: {
    paddock: { skin: 'light', hair: 'brown', eyes: 'green', cloth: 'olive' },
  },
  hair: false,
  undershirt: false,
  pants: false,
  shoes: false,
  lashes: false,
  pose: { L: POSE_L, R: POSE_R },

  // A big open grin (a crescent with a tooth band) and thick arched brows: the kind's brows are
  // painted over with skin and the real brows are built in `extra`.
  paintSkin(skin, h) {
    const y = 0.532;
    const grin = profile.polygon(
      [
        [-0.078, 0.024],
        [-0.045, 0.006],
        [0, 0.001],
        [0.045, 0.006],
        [0.078, 0.024],
        [0.066, -0.006],
        [0.035, -0.027],
        [0, -0.033],
        [-0.035, -0.027],
        [-0.066, -0.006],
      ],
      { smooth: true, samples: 6 },
    );
    const mouth = h.onFace(sdf.extrude(grin, 0.3), 0, y);
    const teeth = mouth.intersect(sdf.halfSpace([0, -1, 0], -(y - 0.011))).intersect(sdf.box([0.1, 0.1, 1]).at(0, y, 0));
    const tongue = h.onFace(sdf.ellipsoid([0.03, 0.012, 0.08]), 0, y - 0.027);
    const oldBrows = sdf.extrude(profile.arc(0.1, 0.036, 54, 126), 0.3).at(0.1, 0.622, 0.1).mirror('x');
    return skin
      .paintWhere(oldBrows, h.tint.skin!, 0.002)
      .paintWhere(mouth, C.mouth)
      .paintWhere(tongue.intersect(mouth), C.tongue, 0.004)
      .paintWhere(teeth, C.teeth, 0.002);
  },

  extra(k, h) {
    const { SHOULDER, HIP, KNEE, ANKLE, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x', 0);
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];
    const hairColor = k.tint('hair');
    const skinColor = h.tint.skin ?? '#d49a72';

    // ------------------------------------------------------------------ black swept hair
    // A small cap that hugs the skull (the forehead and the ears stay free), long smooth locks that
    // sweep from the fringe over the crown to the nape, short side locks above the ears, and a quiff.
    const faceMask = sdf.ellipsoid([0.17, 0.15, 0.2]).at(0, 0.6, 0.2);
    const cap = sdf
      .ellipsoid([0.205, 0.2, 0.193])
      .at(0, HEAD_Y + 0.002, -0.006)
      .smoothSubtract(0.02, faceMask)
      .smoothIntersect(0.025, sdf.halfSpace([0, -1, 0], -0.612));
    const surf = (az: number, el: number, out: number): [number, number, number] => {
      const a = (az * Math.PI) / 180;
      const e = (el * Math.PI) / 180;
      return [(0.215 + out) * Math.sin(a) * Math.cos(e), HEAD_Y + (0.211 + out) * Math.sin(e), -0.006 + (0.2 + out) * Math.cos(a) * Math.cos(e)];
    };
    // A lock: points on the skull (azimuth from +Z, elevation) with a radius each, a little proud of the cap.
    const lock = (pts: [number, number, number][]) =>
      sdf.chain(pts.map(([az, el, r]) => [...surf(az, el * 0.86, r * 0.35), r * 0.68] as [number, number, number, number]), 0.02);
    const locks = [
      // over the crown, front to back, each one twisting to the viewer's left (-x)
      lock([[-62, 30, 0.036], [-48, 55, 0.046], [-100, 80, 0.046], [-170, 55, 0.044], [-178, 22, 0.034], [-175, 2, 0.024]]),
      lock([[-30, 34, 0.04], [-24, 58, 0.05], [-78, 82, 0.05], [-160, 66, 0.048], [-170, 30, 0.036], [-168, 6, 0.026]]),
      lock([[0, 38, 0.042], [4, 62, 0.052], [-40, 86, 0.052], [-150, 72, 0.05], [-165, 38, 0.038], [-160, 10, 0.028]]),
      lock([[30, 36, 0.04], [30, 60, 0.05], [20, 84, 0.05], [-130, 80, 0.048], [160, 50, 0.04], [168, 16, 0.03]]),
      lock([[58, 30, 0.036], [56, 55, 0.046], [86, 78, 0.046], [150, 62, 0.044], [162, 30, 0.034], [166, 6, 0.026]]),
      // short locks above the ears and down the sides, curling back
      lock([[-92, 14, 0.04], [-82, 40, 0.046], [-110, 62, 0.044], [-140, 46, 0.036]]),
      lock([[94, 14, 0.04], [84, 40, 0.046], [112, 62, 0.044], [142, 46, 0.036]]),
      lock([[-120, 4, 0.04], [-140, 24, 0.044], [-165, 16, 0.034]]),
      lock([[122, 4, 0.04], [142, 24, 0.044], [166, 16, 0.034]]),
    ];
    // The quiff: a thick lock that rises from the fringe and sweeps over to the left, ending in a curl.
    const quiff = sdf.chain(
      [
        [0.07, 0.78, 0.14, 0.04],
        [0.03, 0.825, 0.135, 0.045],
        [-0.04, 0.85, 0.1, 0.04],
        [-0.1, 0.855, 0.04, 0.032],
        [-0.15, 0.83, -0.01, 0.02],
      ],
      0.02,
    );
    const curl = sdf.chain(
      [
        [-0.1, 0.855, 0.04, 0.03],
        [-0.16, 0.84, 0.0, 0.022],
        [-0.185, 0.8, -0.04, 0.015],
        [-0.17, 0.775, -0.05, 0.01],
      ],
      0.015,
    );
    const hair = sdf.smoothUnion(0.03, cap, ...locks, quiff, curl).bone('head');
    k.body('hair', hair, { color: hairColor, roughness: 0.55, detail: 0.004, textureDensity: 1 });

    // ------------------------------------------------------------------ thick arched brows (a shell on the face)
    const browShell = h.head
      .round(0.011)
      .subtract(h.head.round(-0.004))
      .intersect(
        sdf
          .extrude(
            profile.polygon(
              [
                [0.034, 0.718],
                [0.07, 0.746],
                [0.115, 0.758],
                [0.16, 0.74],
                [0.176, 0.69],
                [0.15, 0.692],
                [0.115, 0.706],
                [0.075, 0.696],
                [0.045, 0.676],
              ],
              { smooth: true, samples: 5 },
            ),
            0.3,
          )
          .at(0, 0, 0.1)
          .mirror('x', 0),
      );
    k.body('brows', browShell, { color: hairColor, roughness: 0.6, detail: 0.003 });

    // ------------------------------------------------------------------ nose and ears (skin tint)
    const noseZ = h.faceZ(0, 0.574);
    const nose = sdf.ellipsoid([0.03, 0.026, 0.028]).at(0, 0.575, noseZ + 0.003).bone('head');
    const bigEar = sdf
      .ellipsoid([0.03, 0.056, 0.04])
      .subtract(sdf.sphere(0.021).at(0.019, 0, 0.008))
      .rotateY(-14)
      .at(0.212, 0.616, -0.012);
    k.body('face-parts', sdf.smoothUnion(0.01, nose, sdf.union(bigEar, bigEar.mirror('x', 0)).bone('head')), {
      color: skinColor,
      roughness: 0.55,
      detail: 0.004,
      textureDensity: 2,
    });

    // ------------------------------------------------------------------ short black beard with an open mouth
    // A shell of the head, grown 0.016, cut to a beard outline (sideburns to the ears, the cheek line
    // under the eyes, the chin), with a hole for the grin and a mustache over the mouth.
    const beardOutline = profile.polygon(
      [
        [0, 0.566],
        [0.05, 0.568],
        [0.1, 0.565],
        [0.15, 0.585],
        [0.19, 0.628],
        [0.205, 0.67],
        [0.218, 0.66],
        [0.214, 0.6],
        [0.19, 0.52],
        [0.13, 0.46],
        [0.06, 0.435],
        [0, 0.43],
        [-0.06, 0.435],
        [-0.13, 0.46],
        [-0.19, 0.52],
        [-0.214, 0.6],
        [-0.218, 0.66],
        [-0.205, 0.67],
        [-0.19, 0.628],
        [-0.15, 0.585],
        [-0.1, 0.565],
        [-0.05, 0.568],
      ],
      { smooth: true, samples: 5 },
    );
    const beardShell = h.head.round(0.017).intersect(sdf.extrude(beardOutline, 0.8)).intersect(sdf.halfSpace([0, 0, -1], 0.02));
    const chin = sdf.ellipsoid([0.09, 0.052, 0.075]).at(0, 0.492, 0.088);
    const stache = sdf.union(
      sdf.ellipsoid([0.046, 0.016, 0.022]).rotateZ(-12).at(0.04, 0.559, noseZ - 0.006),
      sdf.ellipsoid([0.046, 0.016, 0.022]).rotateZ(12).at(-0.04, 0.559, noseZ - 0.006),
    );
    const mouthHole = sdf.ellipsoid([0.09, 0.038, 0.4]).at(0, 0.526, 0.1);
    const beard = sdf
      .smoothUnion(0.02, beardShell, chin.intersect(sdf.halfSpace([0, 0, -1], -0.0)), stache)
      .smoothSubtract(0.008, mouthHole)
      .bone('head');
    k.body('beard', beard, { color: hairColor, roughness: 0.6, detail: 0.004, textureDensity: 1.5 });

    // ------------------------------------------------------------------ cream shirt with sleeves rolled to the elbow
    const sleeves = h.perArm((j) => sdf.cone(lerp(SHOULDER, j.ELBOW, -0.1), lerp(j.ELBOW, j.WRIST, 0.03), 0.05, 0.047).bone('upperarm.L'));
    const shirt = sdf.smoothUnion(0.012, h.weighted(h.torso), sleeves);
    k.body('shirt', shirt, { color: C.shirt, roughness: 0.88 });
    const rolls = h.perArm((j) => sdf.cone(lerp(j.ELBOW, j.WRIST, -0.05), lerp(j.ELBOW, j.WRIST, 0.2), 0.058, 0.053).round(0.007).bone('forearm.L'));
    k.body('cuffs', rolls, { color: C.cuff, roughness: 0.9, detail: 0.004 });

    // ------------------------------------------------------------------ red bandana: a neck band and a triangular flap
    const torsoShell = h.torso.round(0.02).subtract(h.torso.round(-0.002));
    const bandBand = torsoShell.intersect(h.band(0.428, 0.5));
    const flapOutline = profile.polygon(
      [
        [-0.13, 0.5],
        [0.13, 0.5],
        [0.112, 0.43],
        [0.0, 0.31],
        [-0.112, 0.43],
      ],
      { smooth: false },
    );
    const flapShell = h.torso.round(0.03).subtract(h.torso.round(0.009));
    const flap = flapShell.intersect(sdf.extrude(flapOutline, 0.6, 0.004).at(0, 0, 0.3)).intersect(sdf.halfSpace([0, 0, -1], -0.0));
    const knotZ = sdf.raycast(flapShell, [0, 0.455, 0.6], [0, 0, -1])?.[2] ?? 0.1;
    const knot = sdf
      .smoothUnion(
        0.008,
        sdf.ellipsoid([0.03, 0.022, 0.022]).at(0, 0.452, knotZ + 0.004),
        sdf.ellipsoid([0.02, 0.012, 0.012]).rotateZ(35).at(0.034, 0.44, knotZ),
        sdf.ellipsoid([0.02, 0.012, 0.012]).rotateZ(-35).at(-0.034, 0.44, knotZ),
      )
      .bone('chest');
    const bandana = sdf
      .smoothUnion(0.01, h.weighted(bandBand), h.weighted(flap), knot)
      .paintWhere(h.band(0.428, 0.438), C.bandanaDark, 0.003);
    k.body('bandana', bandana, { color: C.bandana, roughness: 0.85, detail: 0.004 });

    // ------------------------------------------------------------------ leather overalls: bib, straps, waist, trousers
    const front = (x: number, y0: number, y1: number) => sdf.box([2 * x, y1 - y0, 0.5], 0.012).at(0, (y0 + y1) / 2, 0.25);
    const bib = torsoShell.round(0.002).intersect(front(0.09, 0.25, 0.4));
    const strap = torsoShell
      .intersect(sdf.box([0.036, 0.5, 0.7]).at(0.075, 0.39, 0))
      .intersect(sdf.halfSpace([0, -1, 0], -0.33))
      .intersect(sdf.halfSpace([0, 1, 0], 0.52));
    const waist = h.torso.round(0.012).subtract(h.torso.round(-0.003)).intersect(h.band(0.17, 0.285));
    const overalls = sdf
      .smoothUnion(0.008, h.weighted(bib), pair(strap.bone('chest')), h.weighted(waist))
      .paintWhere(h.band(0.246, 0.256), C.strap, 0.002);
    k.body('overalls', overalls, {
      color: h.tint.shirt ?? '#6b4a2c',
      roughness: 0.78,
      bump: (x, y, z) => 0.0016 * Math.sin(x * 80 + Math.sin(y * 50)) * Math.cos(z * 60),
    });
    const trouserLeg = sdf.smoothUnion(
      0.012,
      sdf.capsule(HIP, KNEE, 0.056).bone('leg.L'),
      sdf.cone(KNEE, [ANKLE[0], 0.11, 0.002], 0.054, 0.05).bone('shin.L'),
    );
    k.body('pants', sdf.smoothUnion(0.03, sdf.ellipsoid([0.12, 0.054, 0.09]).at(0, 0.2, 0).bone('hips'), pair(trouserLeg)), {
      color: h.tint.shirt ?? '#6b4a2c',
      roughness: 0.78,
      bump: (x, y, z) => 0.0016 * Math.sin(x * 80 + Math.sin(y * 50)) * Math.cos(z * 60),
    });
    // Big dark buttons where the straps meet the bib.
    const bibZ = (x: number, y: number) => sdf.raycast(bib, [x, y, 0.5], [0, 0, -1])?.[2] ?? 0.1;
    const button = (x: number) => sdf.cylinder(0.019, 0.012, 0.004).rotateX(90).at(x, 0.335, bibZ(Math.abs(x), 0.335) + 0.001).bone('chest');
    k.body('buttons', sdf.union(button(0.07), button(-0.07)), { color: C.button, roughness: 0.45, metalness: 0.2, detail: 0.003 });

    // ------------------------------------------------------------------ tall black boots with rolled tops
    const boot = sdf
      .smoothUnion(
        0.026,
        sdf.cylinder(0.056, 0.1, 0.02).at(0, 0.055, 0).bone('shin.L'),
        sdf.ellipsoid([0.068, 0.054, 0.11]).at(0, 0.05, 0.045).bone('foot.L'),
        sdf.sphere(0.06).at(0, 0.058, 0.0).bone('foot.L'),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const bootCuff = sdf.cylinder(0.066, 0.03, 0.014).at(0, 0.098, 0.002).bone('shin.L');
    const sole = sdf.ellipsoid([0.072, 0.02, 0.117]).at(0, 0.008, 0.045).intersect(sdf.halfSpace([0, -1, 0], 0)).bone('foot.L');
    const bootShape = sdf.smoothUnion(0.01, boot, bootCuff).union(sole.paint(C.bootSole)).rotateY(10).at(ANKLE[0], 0, 0);
    k.body('boots', pair(bootShape), { color: C.boot, roughness: 0.65, detail: 0.005 });

    // ------------------------------------------------------------------ the held props
    // The fist centers (the kind's fist ellipsoid turned with its forearm); the props pass through them.
    const v3 = (p: readonly number[]) => new THREE.Vector3(p[0], p[1], p[2]);
    const fistOf = (j: { ELBOW: readonly number[]; WRIST: readonly number[] }): [number, number, number] => {
      const turn = new THREE.Quaternion().setFromUnitVectors(
        v3([0.205, 0.238, 0.03]).sub(v3([0.18, 0.332, 0.012])).normalize(),
        v3(j.WRIST).sub(v3(j.ELBOW)).normalize(),
      );
      const f = v3([0.212, 0.2, 0.034]).sub(v3([0.205, 0.238, 0.03])).applyQuaternion(turn);
      return [j.WRIST[0]! + f.x, j.WRIST[1]! + f.y, j.WRIST[2]! + f.z];
    };
    const fr = fistOf(h.arms.R);
    const GR: [number, number, number] = [-fr[0], fr[1], fr[2]];
    const GL = fistOf(h.arms.L);

    // Horseshoe: a flat arch 0.18 m across and 0.04 m thick, the open side down and turned toward the
    // body, held by its lower heel; the arch rises beside the fist, away from the head.
    const SHOE_R = 0.056;
    const SHOE_TURN = 78;
    const SHOE_GAP = 38;
    const shoeFlat = sdf.extrude(profile.arc(SHOE_R, 0.045, -SHOE_GAP, 180 + SHOE_GAP), 0.04, 0.008);
    const heel = { x: -SHOE_R * Math.cos((SHOE_GAP * Math.PI) / 180), y: -SHOE_R * Math.sin((SHOE_GAP * Math.PI) / 180) };
    const a = (SHOE_TURN * Math.PI) / 180;
    const heelAt = { x: heel.x * Math.cos(a) - heel.y * Math.sin(a), y: heel.x * Math.sin(a) + heel.y * Math.cos(a) };
    // Nail holes: six dark dots along the arch, painted on the front face.
    const nails = sdf.union(
      ...[-10, 25, 65, 115, 155, 190].map((deg) => {
        const t = (deg * Math.PI) / 180;
        return sdf.cylinder(0.0065, 0.15, 0).rotateX(90).at(SHOE_R * Math.cos(t), SHOE_R * Math.sin(t), 0);
      }),
    );
    const shoe = shoeFlat
      .paintWhere(nails, '#2a2a30', 0.0006)
      .rotateZ(SHOE_TURN)
      .at(GR[0] - heelAt.x - 0.022, GR[1] - heelAt.y + 0.01, GR[2]);
    k.body('horseshoe', shoe, { color: C.iron, roughness: 0.4, metalness: 0.7, bone: 'knife.R', detail: 0.003 });

    // Horse brush: a rounded oval wooden back on a handle, with a darker bristle block under it
    // (a little wider than the back, so a dark rim shows); about 0.18 m tall, held upright and turned
    // a little so that the bristles face out and back.
    const brushPose = (sh: sdf.Shape) => sh.rotateY(-28).at(...GL);
    const handle = sdf.capsule([0, -0.055, 0], [0, 0.08, 0], 0.02);
    const back = sdf.ellipsoid([0.046, 0.068, 0.021]).at(0, 0.145, 0);
    const rim = sdf.torus(0.044, 0.01).scale([1.0, 1.5, 1]).rotateX(90).at(0, 0.145, 0.03);
    const wood = sdf.smoothUnion(0.014, handle, back, rim);
    k.body('brush', brushPose(wood), { color: C.wood, roughness: 0.7, bone: 'knife.L', detail: 0.004 });
    const bristleBlock = sdf.ellipsoid([0.048, 0.072, 0.02]).at(0, 0.145, 0.034).smoothUnion(0.01, sdf.box([0.07, 0.11, 0.03], 0.015).at(0, 0.145, 0.034));
    const bristles = bristleBlock.displace(0.0045, (x, y) => Math.sin(x * 230) * Math.sin(y * 230));
    k.body('bristles', brushPose(bristles), { color: C.bristle, roughness: 0.95, bone: 'knife.L', detail: 0.003 });
  },
});
