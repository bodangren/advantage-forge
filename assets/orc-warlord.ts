import { defineAsset, motion, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Orc warlord — Chibi Quest enemy (catalog `enemies/humanoid/orc-warlord`), about 1.15 m to the
 * tip of its crest, faces +Z. Target: docs/enemy-mockups/orc-warlord_001.jpg (one front view).
 * Built on the orc warrior (same rig with knee bones, same clips, the weapon in `hand.R`).
 *
 * Role: a chieftain boss, seen in 3D and as a 128 px sprite; the horns, the crest, the spiked
 *   pauldrons, and the double axe must read.
 * One idea: a black iron helmet with two big bone horns and a red crest over a scowling green face,
 *   huge spiked pauldrons, and a double-headed axe held across the belly in both fists.
 * Shape language: massive and square (pauldrons, tabard, boots, axe plates) with sharp accents
 *   (horns, spikes, tusks, axe horns).
 * Palette (60/30/10): black iron #2c2c30 (lit #46464c), green skin #5f8a2e, leather and fur browns;
 *   accents: bone horns #d9cfa8, red crest #b83a2e, red marks #b02a22, yellow eyes #ffd23a.
 * Value plan: the glowing eyes under the dark helmet brim and the pale tusks are the focal point;
 *   the black pauldrons and the bone horns frame the head.
 * Bodies: skin, eyes (emissive), beard, tusks, helmet, horns, crest, iron (pauldron domes, belt,
 *   studs, emblem, bracers, tabard), spikes, fur trims, leather (harness, belt, bracer cuffs),
 *   boots with straps and skull bosses, loincloth, axe (head plates and haft).
 * Rig: the orc warrior's. The arms rest bent forward so both fists hold the haft in front of the
 *   belly; the pauldrons follow the upper arms; the crest follows the `knot` bone.
 *   Clips: idle, walk, run, attack, attack2, roar, hit, death.
 */

const C = {
  skin: '#4f7a28',
  skinDark: '#3d6020',
  lid: '#2a4416',
  mouth: '#2a1a14',
  eye: '#ffd23a',
  pupil: '#141010',
  iron: '#2c2c30',
  ironLit: '#46464c',
  bone: '#d9cfa8',
  crest: '#b83a2e',
  beard: '#7a3a22',
  fur: '#5a4632',
  furDark: '#3e2f20',
  leather: '#5a3a24',
  leatherDark: '#3a2416',
  paint: '#b02a22',
  wood: '#5a3a22',
  boot: '#34302e',
  skull: '#cfc6ac',
  tusk: '#f1e6c8',
};

type V3 = readonly [number, number, number];

const pair = (s: sdf.Shape) => s.mirror('x');
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};

// Joints: wide shoulders; the arms rest bent forward (the forearms slope forward) so the fists hold the axe haft.
const SHOULDER: V3 = [0.22, 0.52, 0];
const ELBOW: V3 = [0.31, 0.4, 0.08];
const WRIST: V3 = [0.345, 0.3, 0.2];
const HIP: V3 = [0.1, 0.25, 0];
const ANKLE: V3 = [0.155, 0.075, 0];
const KNEE: V3 = [0.1275, 0.1625, 0]; // the knee: splits the leg (shin.L takes the weight below it)
// The ends of the flat bottom of the left boot (y = 0), measured on the SDF: heel and toe.
const SOLE_HEEL: V3 = [0.155, 0, -0.03];
const SOLE_TOE: V3 = [0.17, 0, 0.11];
const HEAD_Y = 0.72;

/** A big fist hanging from the wrist `w`; `s` mirrors it for the right hand. */
const fistAt = (w: V3, s: 1 | -1) => {
  const o = (dx: number, dy: number, dz: number): V3 => [w[0] + dx * s, w[1] + dy, w[2] + dz];
  return sdf.smoothUnion(
    0.022,
    sdf.ellipsoid([0.066, 0.068, 0.07]).at(...o(0.006, -0.06, 0.006)),
    sdf.capsule(o(-0.016, -0.092, 0.05), o(-0.01, -0.058, 0.07), 0.028), // curled fingers
    sdf.cone(o(0.036, -0.036, 0.042), o(0.004, -0.05, 0.08), 0.027, 0.021), // thumb
  );
};

const smooth01 = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export default defineAsset({
  name: 'orc-warlord',
  description: 'Chibi orc warlord boss: a black iron helmet with bone horns and a red crest, glowing eyes, big tusks, a red-brown beard, huge spiked pauldrons, and a double-headed battle axe.',
  detail: 0.006,
  reference: 'docs/enemy-mockups/orc-warlord_001.jpg',
  variants: {
    skin: { green: C.skin, grey: '#6f7a6a', brown: '#7a5a3a' },
    crest: { red: C.crest, black: '#222222', white: '#e8e0d0' },
    paint: { red: C.paint, white: '#e8e0d0', blue: '#2f4f8a' },
  },
  presets: {
    bloodfang: { skin: 'green', crest: 'red', paint: 'red' },
    ashen: { skin: 'grey', crest: 'black', paint: 'white' },
    frostbite: { skin: 'brown', crest: 'white', paint: 'blue' },
  },

  build(k) {
    const T = {
      skin: k.tint('skin'),
      skinDark: k.tint('skin', { color: C.skinDark, follow: 1 }),
      mouth: k.tint('skin', { color: C.mouth, follow: 0.5 }),
      crest: k.tint('crest'),
      paint: k.tint('paint'),
    };
    const shadeOf = (body: string, shade: string) => {
      const a = rgb(body);
      const b = rgb(shade);
      return [b[0] - a[0], b[1] - a[1], b[2] - a[2]] as const;
    };
    const plus = (c: readonly [number, number, number], d: readonly [number, number, number], t = 1) =>
      [c[0] + d[0] * t, c[1] + d[1] * t, c[2] + d[2] * t] as const;
    const KNOT: V3 = [0, 0.99, -0.012];
    // ------------------------------------------------------------------ skeleton
    k.skeleton({
      hips: { at: [0, 0.26, 0] },
      spine: { parent: 'hips', at: [0, 0.34, 0] },
      chest: { parent: 'spine', at: [0, 0.44, 0] },
      neck: { parent: 'chest', at: [0, 0.54, -0.01] },
      head: { parent: 'neck', at: [0, 0.58, -0.01] },
      knot: { parent: 'head', at: KNOT, tail: [0, 1.13, -0.03] },
      'upperarm.L': { parent: 'chest', at: SHOULDER },
      'forearm.L': { parent: 'upperarm.L', at: ELBOW },
      'hand.L': { parent: 'forearm.L', at: WRIST },
      'upperarm.R': { parent: 'chest', at: mx(SHOULDER) },
      'forearm.R': { parent: 'upperarm.R', at: mx(ELBOW) },
      'hand.R': { parent: 'forearm.R', at: mx(WRIST) },
      'leg.L': { parent: 'hips', at: HIP },
      'shin.L': { parent: 'leg.L', at: KNEE, split: 0.015 },
      'foot.L': { parent: 'shin.L', at: ANKLE },
      'leg.R': { parent: 'hips', at: mx(HIP) },
      'shin.R': { parent: 'leg.R', at: mx(KNEE), split: 0.015 },
      'foot.R': { parent: 'shin.R', at: mx(ANKLE) },
    });

    // ------------------------------------------------------------------ head
    const head = sdf
      .smoothUnion(
        0.05,
        sdf.ellipsoid([0.19, 0.2, 0.18]).at(0, HEAD_Y, -0.01),
        sdf.ellipsoid([0.178, 0.09, 0.14]).at(0, 0.58, 0.05), // the wide underbite jaw
        pair(sdf.sphere(0.078).at(0.108, 0.645, 0.078)), // cheeks
        sdf.ellipsoid([0.17, 0.046, 0.075]).at(0, 0.752, 0.118), // a heavy brow shelf
        pair(sdf.chain([[0.115, 0.752, 0.15, 0.03], [0.07, 0.738, 0.185, 0.03], [0.018, 0.716, 0.19, 0.026]], 0.01)), // brow ridges, low at the nose
      )
      .bone('head');
    const faceZ = (x: number, y: number) => (sdf.raycast(head, [Math.min(x, 0.17), Math.max(y, 0.53), 1], [0, 0, -1]) ?? sdf.raycast(head, [0.1, 0.6, 1], [0, 0, -1])!)[2];
    const nose = sdf.ellipsoid([0.046, 0.032, 0.032]).at(0, 0.655, faceZ(0, 0.655) - 0.008).bone('head');
    const ears = pair(
      sdf
        .cone([0.15, 0.7, -0.01], [0.245, 0.765, -0.045], 0.05, 0.008)
        .smoothSubtract(0.006, sdf.cone([0.16, 0.705, 0.012], [0.235, 0.76, -0.02], 0.028, 0.004))
        .bone('head'),
    );
    const neck = sdf.capsule([0, 0.5, -0.01], [0, 0.62, -0.01], 0.095).bone('neck');

    // ------------------------------------------------------------------ torso, arms, legs
    const trunk = sdf.smoothUnion(
      0.06,
      sdf.ellipsoid([0.2, 0.16, 0.15]).at(0, 0.47, 0).bone('chest'),
      sdf.ellipsoid([0.17, 0.13, 0.14]).at(0, 0.35, 0.02).bone('spine'),
      pair(sdf.sphere(0.1).at(0.155, 0.545, -0.02).bone('chest')), // traps
      pair(sdf.ellipsoid([0.088, 0.062, 0.05]).at(0.076, 0.48, 0.1).bone('chest')), // pecs
    );
    const belly = sdf.smoothUnion(0.06, sdf.ellipsoid([0.2, 0.16, 0.15]).at(0, 0.47, 0), sdf.ellipsoid([0.17, 0.13, 0.14]).at(0, 0.35, 0.02));
    const abs = pair(
      sdf.union(
        ...[0.405, 0.365].map((y, i) => {
          const p = sdf.raycast(belly, [0.036, y, 1], [0, 0, -1])!;
          return sdf.ellipsoid([0.03 - i * 0.002, 0.018, 0.016]).at(p[0], p[1], p[2] - 0.006);
        }),
      ),
    ).bone('spine');
    const armAt = (s: 1 | -1) => {
      const sh: V3 = s > 0 ? SHOULDER : mx(SHOULDER);
      const el: V3 = s > 0 ? ELBOW : mx(ELBOW);
      const wr: V3 = s > 0 ? WRIST : mx(WRIST);
      const side = s > 0 ? 'L' : 'R';
      return sdf.smoothUnion(
        0.03,
        sdf.cone(sh, el, 0.09, 0.075).bone(`upperarm.${side}`),
        sdf.ellipsoid([0.07, 0.08, 0.068]).at(...lerp(sh, el, 0.5)).bone(`upperarm.${side}`), // biceps
        sdf.cone(el, wr, 0.075, 0.068).bone(`forearm.${side}`),
        fistAt(wr, s).bone(`hand.${side}`),
      );
    };
    const legs = pair(sdf.capsule([HIP[0], 0.26, 0], [ANKLE[0], 0.1, 0.01], 0.078).bone('leg.L'));

    // ------------------------------------------------------------------ face
    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const EYE: V3 = [0.074, 0.69, 0];
    const MOUTH_Y = 0.604;
    const mouth = sdf.extrude(profile.arc(0.06, 0.013, 45, 135), 0.4).at(0, MOUTH_Y - 0.06, 0.2);
    const nostrils = pair(sdf.sphere(0.009).at(0.02, 0.64, faceZ(0, 0.64) + 0.012));
    const eyeSockets = pair(sdf.ellipsoid([0.056, 0.044, 0.09]).at(EYE[0], EYE[1] - 0.004, faceZ(EYE[0], EYE[1]) - 0.02));
    const skin = sdf
      .smoothUnion(0.04, head, neck)
      .smoothUnion(0.015, nose, ears)
      .smoothUnion(0.05, trunk)
      .smoothUnion(0.012, abs)
      .union(armAt(1), armAt(-1))
      .smoothUnion(0.03, legs)
      .paintWhere(eyeSockets, '#1a2410', 0.004)
      .paintWhere(mouth, T.mouth, 0.003)
      .paintWhere(nostrils, T.mouth, 0.004)
      .paintWhere(pair(sdf.extrude(profile.rect([0.006, 0.08], 0.003), 0.4).rotateZ(-8).at(0.055, 0.35, 0.2)), T.skinDark, 0.01);
    k.body('skin', skin, { color: T.skin, roughness: 0.55, textureDensity: 2 });

    // Small glowing eyes under the brim: a slanted upper lid cuts each one (a scowl).
    const lidL = sdf
      .extrude(
        profile.polygon([
          [EYE[0] - 0.06, EYE[1] + 0.008],
          [EYE[0] + 0.06, EYE[1] + 0.034],
          [EYE[0] + 0.06, EYE[1] + 0.08],
          [EYE[0] - 0.06, EYE[1] + 0.08],
        ]),
        0.4,
      )
      .at(0, 0, 0.2);
    const eyeBall = pair(sdf.ellipsoid([0.04, 0.03, 0.05]).at(EYE[0], EYE[1], faceZ(EYE[0], EYE[1]) - 0.036));
    const pupil = pair(sdf.ellipsoid([0.011, 0.024, 0.06]).at(EYE[0] - 0.004, EYE[1] - 0.002, faceZ(EYE[0], EYE[1]) - 0.036));
    k.body('eyes', eyeBall.subtract(pair(lidL)).paintWhere(pupil, C.pupil, 0.002).bone('head'), {
      color: C.eye,
      emissive: C.eye,
      emissiveIntensity: 1.4,
      roughness: 0.3,
      detail: 0.004,
      textureDensity: 2,
    });

    // ------------------------------------------------------------------ beard: a big red-brown spade with sideburns
    const jawFront = faceZ(0, 0.52);
    const beardStrands = (x: number, y: number) => Math.sin(x * 80 + Math.sin(y * 30) * 1.5);
    const beard = sdf
      .smoothUnion(
        0.03,
        sdf.ellipsoid([0.125, 0.045, 0.06]).at(0, 0.52, jawFront - 0.04),
        sdf.cone([0, 0.515, jawFront - 0.035], [0, 0.4, jawFront + 0.035], 0.1, 0.022),
      )
      .displace(0.004, beardStrands);
    const sideburnPath = [
      [0.18, 0.66],
      [0.165, 0.6],
      [0.13, 0.56],
      [0.09, 0.535],
    ].map(([x, y], i) => [x!, y!, faceZ(x!, y!), 0.014 + i * 0.008] as [number, number, number, number]);
    const sideburns = pair(head.round(0.014).intersect(sdf.chain(sideburnPath, 0.02)).subtract(head.round(-0.004)));
    const beardDark = shadeOf(C.beard, '#4e2414');
    k.body(
      'beard',
      sdf
        .smoothUnion(0.02, beard, sideburns)
        .bone('head')
        .paintFn((x, y, z, base) => plus(base, beardDark, smooth01(0.2, 1, beardStrands(x, y)) * 0.8)),
      { color: C.beard, roughness: 0.85, detail: 0.005 },
    );

    // ------------------------------------------------------------------ tusks: big, rising from the lower jaw corners past the upper lip
    const tuskPath = [
      [0.07, 0.535, 0.032, -0.006],
      [0.076, 0.575, 0.026, 0.026],
      [0.082, 0.612, 0.017, 0.036],
      [0.088, 0.648, 0.008, 0.036],
    ].map(([x, y, r, lift]) => [x!, y!, faceZ(x!, y!) + lift!, r!] as [number, number, number, number]);
    const tusks = pair(sdf.chain(tuskPath, 0.014));
    const tuskRoot = rgb('#b9a57a');
    const tuskTip = rgb(C.tusk);
    k.body(
      'tusks',
      tusks.bone('head').paintFn((_x, y) => {
        const t = smooth01(0.54, 0.64, y);
        return [tuskRoot[0] + (tuskTip[0] - tuskRoot[0]) * t, tuskRoot[1] + (tuskTip[1] - tuskRoot[1]) * t, tuskRoot[2] + (tuskTip[2] - tuskRoot[2]) * t];
      }),
      { color: C.tusk, roughness: 0.4, detail: 0.004 },
    );

    // ------------------------------------------------------------------ helmet: a black iron bowl, nose bar, cheek guards, horns, crest
    const HC: V3 = [0, 0.752, -0.012];
    const HR = 0.228;
    // Solid above a plane that runs high at the brow and low at the nape.
    const rimN = norm([0, -1, 0.55]);
    const rimPlane = sdf.halfSpace(rimN, rimN[1] * 0.6927);
    const bowl = sdf
      .sphere(HR)
      .at(...HC)
      .subtract(sdf.sphere(HR - 0.016).at(HC[0], HC[1] - 0.004, HC[2]))
      .intersect(rimPlane);
    const bowlAt = (az: number, elev: number, out = 0): V3 => {
      const a = (az * Math.PI) / 180;
      const e = (elev * Math.PI) / 180;
      const r = HR + out;
      return [HC[0] + r * Math.cos(e) * Math.sin(a), HC[1] + r * Math.sin(e), HC[2] + r * Math.cos(e) * Math.cos(a)];
    };
    // A central ridge from the brow over the top to the nape.
    const ridge = sdf
      .chain(
        [20, 45, 70, 95, 120, 145].map((el) => {
          const p = bowlAt(0, el < 90 ? el : el, 0);
          // elevation over the top: 20..90 on the front side, then the back side (az 180)
          if (el <= 90) return [p[0], p[1], p[2], 0.014] as [number, number, number, number];
          const q = bowlAt(180, 180 - el, 0);
          return [q[0], q[1], q[2], 0.014] as [number, number, number, number];
        }),
        0.01,
      )
      .scale([1.5, 1, 1]);
    const barTop: V3 = [0, 0.79, bowlAt(0, 10, 0)[2] - 0.004];
    const barBot: V3 = [0, 0.678, faceZ(0, 0.678) + 0.022];
    const noseBar = sdf.capsule(barTop, barBot, 0.016).scale([1.7, 1, 1]);
    const cheekRegion = sdf.box([0.11, 0.1, 0.14], 0.02).at(0.185, 0.665, 0.0);
    const cheekGuards = pair(head.round(0.02).subtract(head.round(-0.002)).intersect(cheekRegion));
    const rivets = sdf.union(
      ...[-62, -38, -14, 14, 38, 62].map((az) => sdf.sphere(0.0085).at(...bowlAt(az, 24, 0.002))),
      ...[-62, 62].map((az) => sdf.sphere(0.0085).at(...bowlAt(az, 24, 0.002))),
    );
    const cheekRivets = pair(sdf.union(sdf.sphere(0.008).at(0.208, 0.685, 0.03), sdf.sphere(0.008).at(0.208, 0.645, 0.03)));
    const spikeBase = bowlAt(0, 90, 0);
    const crownSpike = sdf.union(
      sdf.cylinder(0.034, 0.02, 0.006).at(spikeBase[0], spikeBase[1] + 0.005, spikeBase[2]),
      sdf.cone([spikeBase[0], spikeBase[1], spikeBase[2]], [spikeBase[0], spikeBase[1] + 0.07, spikeBase[2] - 0.004], 0.026, 0.005),
    );
    // Value plan for the iron: a #46464c-to-#6a6a72 gradient toward the top, and thin #8a8a92 rim strips.
    const gradD = shadeOf(C.iron, '#6a6a72');
    const rimD = shadeOf(C.iron, '#8a8a92');
    const helmet = sdf
      .union(bowl, ridge, noseBar, cheekGuards, crownSpike)
      .round(0.002)
            .paintFn((x, y, z, base) => {
        const rd = (y - (0.6927 + 0.55 * z)) * 0.876; // height above the rim
        if (rd < 0.014) return plus(base, rimD, 0.6);
        return plus(base, gradD, 0.22 + 0.6 * smooth01(0.78, 0.98, y) + 0.12 * noise.fbm(x * 14, y * 14, z * 14, 2));
      })
      .bone('head');
    k.body('helmet', helmet, { color: C.iron, roughness: 0.5, metalness: 0.5, detail: 0.005 });
    k.body('helmet-studs', sdf.union(rivets, cheekRivets).bone('head'), { color: '#5a5a62', roughness: 0.4, metalness: 0.7, detail: 0.004 });

    // Two big curved bone horns sweeping out and up.
    const horn = sdf.chain(
      [
        [0.18, 0.815, -0.012, 0.05],
        [0.25, 0.845, -0.012, 0.045],
        [0.293, 0.915, -0.012, 0.035],
        [0.298, 0.99, -0.012, 0.024],
        [0.272, 1.05, -0.012, 0.013],
        [0.25, 1.078, -0.012, 0.006],
      ],
      0.02,
    );
    const boneDark = shadeOf(C.bone, '#a89c70');
    k.body(
      'horns',
      pair(horn)
        .bone('head')
        .paintFn((x, y, _z, base) => plus(base, boneDark, (1 - smooth01(0.82, 0.94, y)) * 0.9 + Math.max(0, noise.fbm(x * 30, y * 30, 0, 2)) * 0.4)),
      { color: C.bone, roughness: 0.55, detail: 0.005, bump: (x, y, z) => 0.0015 * noise.fbm(x * 40, y * 12, z * 40, 2) },
    );

    // The red horsehair crest on the central spike: a tall plume with feathery tips.
    const crestBase: V3 = [KNOT[0], 1.03, -0.02];
    const plume = sdf
      .smoothUnion(
        0.02,
        sdf.ellipsoid([0.034, 0.07, 0.05]).at(crestBase[0], 1.09, crestBase[2]),
        sdf.cone([0, 1.03, -0.02], [0, 1.12, -0.03], 0.034, 0.024),
        ...[-0.03, -0.015, 0, 0.015, 0.03].map((dx, i) =>
          sdf.cone([dx * 0.5, 1.09, -0.02], [dx * 1.6, 1.16 + (i === 2 ? 0.012 : i % 2 === 0 ? 0.004 : 0), -0.04 - Math.abs(dx) * 0.6], 0.018, 0.003),
        ),
      )
      .at(0, 0, 0);
    k.body('crest', plume.bone('knot'), {
      color: T.crest,
      roughness: 0.9,
      detail: 0.004,
      bump: (x, y, z) => 0.002 * Math.sin(x * 260 + Math.sin(y * 60) * 2) * noise.fbm(x * 30, y * 30, z * 30, 2),
    });

    // ------------------------------------------------------------------ leather: bracer cuffs, chest harness, belt
    const bracerParts = (e: V3, w: V3, s: 1 | -1) => {
      const d = norm(sub(w, e));
      const along = (x: number, y: number, z: number) => (x - e[0]) * d[0] + (y - e[1]) * d[1] + (z - e[2]) * d[2];
      const creases = (x: number, y: number, z: number) => Math.sin(along(x, y, z) * 70 + noise.fbm(x * 12, y * 12, z * 12, 2) * 1.2);
      const cuff = sdf
        .smoothUnion(
          0.01,
          sdf.cone(lerp(e, w, 0.02), lerp(e, w, 1.0), 0.1, 0.088),
          sdf.cone(lerp(e, w, 0.0), lerp(e, w, 0.14), 0.108, 0.102), // the rolled top edge
        )
        .displace(0.003, creases, 1.3)
        .round(0.002);
      // The iron plate band with a spike at the elbow and three studs.
      const plate = sdf.cone(lerp(e, w, 0.32), lerp(e, w, 0.62), 0.106, 0.098).round(0.004);
      const root = lerp(e, w, 0.32);
      const spike = sdf.cone([root[0] + s * 0.075, root[1] + 0.06, root[2]], [root[0] + s * 0.1, root[1] + 0.165, root[2] - 0.01], 0.032, 0.004);
      const studs = sdf.union(
        ...[0.38, 0.47, 0.56].map((t) => {
          const c = lerp(e, w, t);
          return sdf.sphere(0.0115).at(c[0] + s * 0.1, c[1] + 0.006, c[2] + 0.01);
        }),
      );
      return { cuff, iron: sdf.union(plate, spike, studs) };
    };
    const bL = bracerParts(ELBOW, WRIST, 1);
    const bR = bracerParts(mx(ELBOW), mx(WRIST), -1);
    const bracers = sdf.union(bL.cuff.bone('forearm.L'), bR.cuff.bone('forearm.R'));
    const trunkShape = sdf.smoothUnion(0.06, sdf.ellipsoid([0.2, 0.16, 0.15]).at(0, 0.47, 0), sdf.ellipsoid([0.17, 0.13, 0.14]).at(0, 0.35, 0.02));
    // Two crossed harness straps over the chest.
    const strapA = trunkShape.round(0.012).smoothIntersect(0.006, sdf.box([0.8, 0.05, 0.8], 0.006).rotateZ(-34).at(0, 0.44, 0));
    const strapB = trunkShape.round(0.012).smoothIntersect(0.006, sdf.box([0.8, 0.045, 0.8], 0.006).rotateZ(34).at(0, 0.44, 0));
    const beltY = 0.33;
    const belt = trunkShape.round(0.018).smoothIntersect(0.006, sdf.box([0.6, 0.07, 0.6], 0.008).at(0, beltY, 0));
    const beltBand = (grow: number, h: number, y: number) => trunkShape.round(grow).smoothIntersect(0.004, sdf.box([0.6, h, 0.6], 0.004).at(0, y, 0));
    k.body(
      'leather',
      sdf.union(
        bracers,
        strapA.bone('chest'),
        strapB.bone('chest'),
        belt.bone('spine').paintWhere(beltBand(0.03, 0.012, beltY + 0.024), C.leatherDark, 0.003).paintWhere(beltBand(0.03, 0.012, beltY - 0.024), C.leatherDark, 0.003),
      ),
      { color: C.leather, roughness: 0.6 },
    );

    // ------------------------------------------------------------------ iron: pauldrons, studs, emblem, tabard, bracers
    const PA: V3 = [0.185, 0.125, 0.17];
    const dome = (s: number) =>
      sdf
        .ellipsoid([PA[0] * s, PA[1] * s, PA[2] * s])
        .intersect(sdf.halfSpace([0, -1, 0], 0.016 * s))
        .round(0.004);
    const pauldronPose = (s: sdf.Shape) => s.rotateZ(-20).at(0.275, 0.575, -0.005);
    const pauldronLocal = sdf.union(dome(1), dome(1.13).at(0, -0.055, 0));
    // Spikes: rooted on the dome, along its normal.
    const spikesLocal = sdf.union(
      ...[
        [0.1, 0.0, 0.13, 0.036],
        [0.04, 0.12, 0.1, 0.03],
        [0.04, -0.12, 0.1, 0.03],
      ].map(([x, z, len, r]) => {
        const y = PA[1] * Math.sqrt(Math.max(0, 1 - (x! / PA[0]) ** 2 - (z! / PA[2]) ** 2));
        const nx = x! / PA[0] ** 2;
        const ny = y / PA[1] ** 2;
        const nz = z! / PA[2] ** 2;
        const l = Math.hypot(nx, ny, nz);
        const d: V3 = [nx / l, ny / l, nz / l];
        return sdf.cone([x! - d[0] * 0.012, y - d[1] * 0.012, z! - d[2] * 0.012], [x! + d[0] * len!, y + d[1] * len!, z! + d[2] * len!], r!, 0.004);
      }),
    );
    // A row of rivets around the front of the lower plate.
    const RA2 = PA[0] * 1.13;
    const RC2 = PA[2] * 1.13;
    const rivetRow = sdf.union(
      ...[-84, -63, -42, -21, 0, 21, 42, 63, 84, 105].map((deg) => {
        const a = (deg * Math.PI) / 180;
        return sdf.sphere(0.012).at(0.99 * RA2 * Math.sin(a), -0.045, 0.99 * RC2 * Math.cos(a));
      }),
      ...[-56, -28, 0, 28, 56].map((deg) => {
        const a = (deg * Math.PI) / 180;
        return sdf.sphere(0.012).at(0.97 * PA[0] * Math.sin(a), 0.03, 0.97 * PA[2] * Math.cos(a));
      }),
    );
    const pauldronPaint = (x: number, y: number, z: number, base: readonly [number, number, number]) => {
      if (y < -0.058) return plus(base, rimD, 0.6);
      return plus(base, gradD, 0.2 + 0.65 * smooth01(-0.02, 0.1, y) + 0.12 * noise.fbm(x * 14, y * 14, z * 14, 2));
    };
    const paldronFur = (x: number, y: number, z: number) =>
      0.55 * Math.sin(Math.atan2(x, z) * 18 + noise.fbm(x * 40, y * 20, z * 40, 2) * 3) + 0.45 * noise.fbm(x * 70, y * 30, z * 70, 2);
    const furTrimLocal = sdf.torus(0.19, 0.03).scale([1.03, 1, 0.95]).at(0, -0.078, 0).displace(0.008, paldronFur, 2);
    const ironBump = (x: number, y: number, z: number) => 0.0008 * noise.fbm(x * 60, y * 60, z * 60, 2);

    // Belt studs (small spikes), the emblem, and the tabard plate.
    const stud = (a: number, y: number) => {
      const from: V3 = [Math.sin(a), y, Math.cos(a)];
      const p = sdf.raycast(belt, from, [-Math.sin(a), 0, -Math.cos(a)])!;
      const n: V3 = [Math.sin(a), 0, Math.cos(a)];
      return sdf.cone([p[0] - n[0] * 0.006, p[1], p[2] - n[2] * 0.006], [p[0] + n[0] * 0.016, p[1], p[2] + n[2] * 0.016], 0.0135, 0.003);
    };
    const studs = sdf.union(...[-75, -55, -35, 35, 55, 75].map((deg) => stud((deg * Math.PI) / 180, beltY)));
    const beltZ = sdf.raycast(belt, [0, beltY, 1], [0, 0, -1])![2];
    const emblem = sdf
      .union(
        sdf.cylinder(0.058, 0.016, 0.006).rotateX(90),
        sdf.cylinder(0.046, 0.024, 0.008).rotateX(90),
        ...[0, 60, 120, 180, 240, 300].map((a) => sdf.sphere(0.008).at(0.052 * Math.cos((a * Math.PI) / 180), 0.052 * Math.sin((a * Math.PI) / 180), 0.006)),
      )
      .paintWhere(sdf.cylinder(0.041, 0.1).rotateX(90).at(0, 0, 0.02), T.paint, 0.002)
      .paintWhere(
        sdf.union(
          ...[0, 60, 120].map((a) => sdf.extrude(profile.rect([0.075, 0.007], 0.002), 0.1).rotateZ(a).at(0, 0, 0.02)),
        ),
        C.leatherDark,
        0.002,
      )
      .at(0, beltY, beltZ + 0.008);
    // The tabard plate hangs from the belt over the loincloth; a red hand print is painted on it.
    const TAB_Y = 0.228;
    const TAB_Z = 0.192;
    const handPrint = sdf.union(
      sdf.extrude(profile.rect([0.046, 0.046], 0.012), 0.1).at(0, -0.024, 0),
      ...[
        [-0.026, 0.018, 0.05, -12],
        [-0.009, 0.03, 0.058, -4],
        [0.009, 0.03, 0.058, 4],
        [0.026, 0.018, 0.05, 12],
      ].map(([x, y, h, r]) => sdf.extrude(profile.rect([0.011, h!], 0.005), 0.1).rotateZ(r!).at(x!, y!, 0)),
      sdf.extrude(profile.rect([0.013, 0.045], 0.005), 0.1).rotateZ(-62).at(-0.04, -0.012, 0),
    );
    const tabard = sdf
      .extrude(
        profile.polygon([
          [-0.078, 0.1],
          [0.078, 0.1],
          [0.078, -0.035],
          [0.0, -0.11],
          [-0.078, -0.035],
        ]),
        0.022,
        0.007,
      )
      .paintWhere(handPrint.at(0, -0.006, 0), T.paint, 0.002)
      .paintWhere(sdf.extrude(profile.rect([0.16, 0.01], 0.003), 0.1).at(0, 0.075, 0), C.leatherDark, 0.002)
      .at(0, TAB_Y, TAB_Z);
    const tabardRivets = sdf.union(
      ...[[-0.058, 0.082], [0.058, 0.082], [-0.052, -0.03], [0.052, -0.03], [0, -0.075]].map(([x, y]) => sdf.sphere(0.0095).at(x!, TAB_Y + y!, TAB_Z + 0.013)),
    );
    // Studs along the harness straps.
    const strapStuds = sdf.union(
      ...[-0.12, -0.04, 0.04, 0.12].flatMap((t) =>
        [-34, 34].map((ang) => {
          const a = (ang * Math.PI) / 180;
          const p = sdf.surfacePoint(ang < 0 ? strapA : strapB, [t * Math.cos(a), 0.44 + t * Math.sin(a) * 1, 0.3], 0.002);
          return sdf.sphere(0.0095).at(...p);
        }),
      ),
    );
    const pauldrons = pair(pauldronPose(pauldronLocal.paintFn(pauldronPaint).union(rivetRow)).bone('upperarm.L'));
    k.body('iron', sdf.union(pauldrons, emblem.bone('spine'), tabard.bone('hips'), bL.iron.bone('forearm.L'), bR.iron.bone('forearm.R')), {
      color: C.iron,
      roughness: 0.5,
      metalness: 0.5,
      bump: ironBump,
    });
    k.body('iron-studs', sdf.union(tabardRivets.bone('hips'), studs.bone('spine'), strapStuds.bone('chest')), { color: C.ironLit, roughness: 0.4, metalness: 0.7, detail: 0.005, maxTriangles: 1800 });
    k.body('spikes', pair(pauldronPose(spikesLocal).bone('upperarm.L')), { color: '#5a5a62', roughness: 0.4, metalness: 0.6, detail: 0.005, maxTriangles: 2400 });
    k.body('pauldron-fur', pair(pauldronPose(furTrimLocal).bone('upperarm.L')).paintFn((x, y, z, base) => (paldronFur(Math.abs(x) - 0.275, y, z) > 0.3 ? rgb(C.furDark) : base)), {
      color: C.fur,
      roughness: 0.95,
      maxTriangles: 4000,
      bump: (x, y, z) => 0.002 * noise.fbm(x * 90, y * 90, z * 90, 2),
    });

    // ------------------------------------------------------------------ the double-headed battle axe (rigid on hand.R)
    // The haft runs along X through both fists in front of the belly; a plate with two horns and a
    // worn edge sits at each end.
    const GRIP: V3 = [-WRIST[0] - 0.006, WRIST[1] - 0.064, WRIST[2] + 0.035];
    const HAFT_X0 = -0.45;
    const HAFT_X1 = 0.4;
    const headPlate = (xEnd: number, s: 1 | -1) => {
      const P = (u: number, v: number): [number, number] => [xEnd + s * u, GRIP[1] + v];
      const outline = profile.polygon(
        [
          [-0.05, -0.05],
          [0.02, -0.075],
          [0.06, -0.12],
          [0.11, -0.16],
          [0.168, -0.178], // the lower horn
          [0.162, -0.12],
          [0.13, -0.07],
          [0.116, 0],
          [0.13, 0.07],
          [0.162, 0.12],
          [0.168, 0.178], // the upper horn
          [0.11, 0.16],
          [0.06, 0.12],
          [0.02, 0.075],
          [-0.05, 0.05],
        ].map(([u, v]) => P(u!, v!)),
        { smooth: true, samples: 4 },
      );
      const plate = sdf.extrude(outline, 0.034, 0.01).at(0, 0, GRIP[2]);
      const edgeBand = sdf.box([0.09, 0.6, 0.3]).at(xEnd + s * 0.148, GRIP[1], GRIP[2]);
      const collar = sdf.cylinder(0.036, 0.06, 0.008).rotateZ(90).at(xEnd + s * 0.005, GRIP[1], GRIP[2]);
      const tip = sdf.cone([xEnd + s * 0.03, GRIP[1], GRIP[2]], [xEnd + s * 0.22, GRIP[1], GRIP[2]], 0.024, 0.004);
      const bolt = sdf.union(sdf.cylinder(0.024, 0.012, 0.004).rotateX(90).at(xEnd + s * 0.075, GRIP[1] + 0.005, GRIP[2] + 0.02), sdf.sphere(0.013).at(xEnd + s * 0.075, GRIP[1] + 0.005, GRIP[2] + 0.027));
      return plate.paintWhere(edgeBand, '#8a8a92', 0.004).union(collar, tip, bolt);
    };
    const axeHeads = sdf.union(headPlate(HAFT_X1, 1), headPlate(HAFT_X0, -1));
    k.body('axe-head', axeHeads, { color: C.iron, roughness: 0.45, metalness: 0.55, bump: ironBump, bone: 'hand.R', detail: 0.004 });
    k.body('haft', sdf.capsule([HAFT_X0, GRIP[1], GRIP[2]], [HAFT_X1, GRIP[1], GRIP[2]], 0.022), {
      color: C.wood,
      roughness: 0.75,
      bone: 'hand.R',
      detail: 0.004,
      bump: (x, y, z) => 0.0008 * noise.fbm(x * 200, y * 30, z * 30, 2),
    });

    // ------------------------------------------------------------------ loincloth (a torn fur-leather kilt)
    const skirtCone = (grow: number, top: number) =>
      sdf
        .revolve(
          profile.polygon([
            [0, top],
            [0.182 + grow, top],
            [0.182 + grow, 0.33],
            [0.21 + grow, 0.26],
            [0.238 + grow, 0.235],
            [0, 0.235],
          ]),
        )
        .scale([1, 1, 0.72])
        .at(0, 0, 0.018);
    const clothFolds = (x: number, y: number, z: number) =>
      Math.sin(Math.atan2(x, z) * 11 + noise.fbm(x * 12, y * 4, z * 12, 2) * 2) * Math.min(1, Math.max(0, (0.31 - y) / 0.12));
    const tearCut = (i: number, w: number, top: number) =>
      sdf
        .extrude(
          profile.polygon([
            [-w, 0.08],
            [w, 0.08],
            [0, top],
          ]),
          0.3,
        )
        .at(0, 0, 0.25)
        .rotateY(i);
    const tears = sdf.union(
      ...Array.from({ length: 11 }, (_, i) =>
        tearCut(i * 32.7 + (noise.random(i, 7, 1) - 0.5) * 14, 0.026 + noise.random(i, 7, 2) * 0.018, 0.21 + noise.random(i, 7, 3) * 0.06),
      ),
      ...Array.from({ length: 7 }, (_, i) => tearCut(i * 51.4 + 17, 0.007, 0.2 + noise.random(i, 8, 3) * 0.04)),
    );
    const skirt = skirtCone(0, 0.33)
      .subtract(skirtCone(-0.013, 0.45))
      .displace(0.009, clothFolds, 1.5)
      .subtract(tears);
    const furDarkD = shadeOf(C.fur, C.furDark);
    const loincloth = sdf
      .union(
        skirt.intersect(sdf.halfSpace([0, -1, 0], -0.25)).bone('hips'),
        skirt.intersect(sdf.halfSpace([0, 1, 0], 0.3)).intersect(sdf.halfSpace([-1, 0, 0], 0)).bone('leg.L'),
        skirt.intersect(sdf.halfSpace([0, 1, 0], 0.3)).intersect(sdf.halfSpace([1, 0, 0], 0)).bone('leg.R'),
      )
      .paintFn((x, y, z, base) => {
        const a = Math.atan2(x, z);
        const streak = noise.fbm(a * 7, y * 5, 0.3, 2);
        const hem = Math.min(1, Math.max(0, (0.27 - y) / 0.08));
        const t = Math.min(1, Math.max(0, hem * 0.7 + (streak > 0.15 ? 0.45 : streak < -0.3 ? -0.2 : 0)));
        return plus(base, furDarkD, t);
      });
    k.body('loincloth', loincloth, { color: C.fur, roughness: 0.92, maxTriangles: 5500, bump: (x, y, z) => 0.002 * noise.fbm(x * 90, y * 60, z * 90, 2) });

    // ------------------------------------------------------------------ boots: iron-black leather, fur tops, red straps, skull bosses
    const footLocal = sdf
      .smoothUnion(0.02, sdf.ellipsoid([0.1, 0.075, 0.14]).at(0, 0.056, 0.04), sdf.ellipsoid([0.085, 0.056, 0.06]).at(0, 0.056, 0.135))
      .rotateY(14)
      .at(ANKLE[0], 0, 0);
    // A tall iron boot: a rounded box 0.16 wide, 0.2 deep, up to y 0.22.
    const shaftBox = sdf.box([0.16, 0.2, 0.2], 0.04).at(ANKLE[0] - 0.002, 0.12, 0.015);
    const bootShape = sdf
      .smoothUnion(0.02, footLocal.bone('foot.L'), shaftBox.bone('shin.L'))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const bootLit = shadeOf(C.boot, '#5a5a62');
    k.body(
      'boots',
      pair(bootShape).paintFn((x, y, z, base) => plus(base, bootLit, 0.25 + 0.5 * smooth01(0.1, 0.22, y) + 0.15 * noise.fbm(x * 20, y * 20, z * 20, 2))),
      {
        color: C.boot,
        roughness: 0.55,
        metalness: 0.4,
        bump: (x, y, z) => 0.0015 * noise.fbm(x * 60, y * 60, z * 60, 2),
      },
    );
    const tufts = (x: number, y: number, z: number) => {
      const a = Math.atan2(x - ANKLE[0], z);
      return 0.55 * Math.sin(a * 14 + noise.fbm(x * 40, y * 20, z * 40, 2) * 3) + 0.45 * noise.fbm(x * 70, y * 30, z * 70, 2);
    };
    const furWrap = pair(
      sdf
        .smoothUnion(0.02, sdf.box([0.19, 0.05, 0.23], 0.024).at(ANKLE[0] - 0.002, 0.222, 0.015), sdf.box([0.175, 0.04, 0.215], 0.02).at(ANKLE[0] - 0.002, 0.19, 0.015))
        .displace(0.011, tufts, 2)
        .bone('shin.L'),
    );
    k.body('boot-fur', furWrap.paintFn((x, y, z, base) => (tufts(Math.abs(x), y, z) > 0.25 ? rgb(C.furDark) : base)), {
      color: C.fur,
      roughness: 0.95,
      maxTriangles: 4000,
      bump: (x, y, z) => 0.002 * noise.fbm(x * 90, y * 90, z * 90, 2),
    });
    // Red straps around the shaft and across the foot.
    const boxBand = (y: number) => shaftBox.round(0.006).intersect(sdf.box([0.4, 0.018, 0.4]).at(0, y, 0));
    const straps = pair(
      sdf
        .union(
          boxBand(0.075),
          boxBand(0.115),
          sdf.box([0.024, 0.012, 0.15], 0.004).rotateY(14).at(ANKLE[0] + 0.03, 0.118, 0.07),
        )
        .bone('shin.L'),
    );
    k.body('boot-straps', straps, { color: T.paint, roughness: 0.6, detail: 0.005, maxTriangles: 3000 });
    // A skull boss on the front of each boot, with a spike on its crown.
    const skullLocal = sdf
      .smoothUnion(
        0.012,
        sdf.ellipsoid([0.037, 0.042, 0.035]),
        sdf.ellipsoid([0.024, 0.02, 0.022]).at(0, -0.042, 0.01),
        sdf.cone([0, 0.03, 0], [0, 0.105, -0.008], 0.022, 0.004),
      )
      .subtract(sdf.sphere(0.0135).at(0.0175, -0.004, 0.036), sdf.sphere(0.0135).at(-0.0175, -0.004, 0.036), sdf.ellipsoid([0.006, 0.01, 0.01]).at(0, -0.03, 0.034));
    const skulls = pair(skullLocal.scale(1.25).rotateX(-8).at(ANKLE[0], 0.14, 0.146).bone('shin.L'));
    k.body('skulls', skulls, { color: C.skull, roughness: 0.65, detail: 0.004 });

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop } = motion;
    const LEG = 0.19;

    k.animation('idle', {
      duration: 2.6,
      pose: (_t, p) => ({
        hips: { move: [0, -0.004 * bump(p), 0] },
        chest: { rotate: [3 * wave(p), 0, 0], scale: [1 + 0.015 * bump(p), 1, 1 + 0.015 * bump(p)] },
        neck: { rotate: [-2 * wave(p), 0, 0] },
        head: { rotate: [0, 6 * wave(p, 1, 0.25), 2 * wave(p, 1, 0.1)] },
        knot: { rotate: [4 * wave(p, 1, 0.4), 0, 4 * wave(p, 1, 0.3)] },
        'upperarm.L': { rotate: [2 * wave(p, 1, 0.1), 0, 4 * bump(p)] },
        'upperarm.R': { rotate: [2 * wave(p, 1, 0.1), 0, 1.5 * bump(p)] },
        'forearm.L': { rotate: [-5 * bump(p), 0, 0] },
      }),
    });

    // A heavy, rolling walk: the weight shifts from side to side at each step.
    // The legs come from motion.gait: planted stance feet, a knee lift in the swing, heel strike
    // and toe-off. `step` is the foot travel, `footLift` the swing height, `duty` the share of the
    // cycle a foot is down (a run has a flight between steps), `bob` the hips bob. The gait phase
    // runs a quarter cycle behind the clip, so the left heel strikes at p = 0.25, when the left arm
    // is back. The hips' turn and sway go to gait, so the planted feet do not slide.
    // `carry` bends the axe arm (degrees) on its back swing, so the axe head stays above the floor.
    const stride = (
      duration: number,
      step: number,
      footLift: number,
      duty: number,
      bob: number,
      armSwing: number,
      lean: number,
      sway: number,
      carry = 0,
    ) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        const hipsTurn = [0, 6 * s, sway * s] as const;
        const legs = motion.gait(p - 0.25, { hip: HIP, knee: KNEE, ankle: ANKLE }, {
          stride: step,
          lift: footLift,
          duty,
          bob,
          roll: 8,
          heel: SOLE_HEEL,
          toe: SOLE_TOE,
          hips: { at: [0, 0.26, 0], rotate: hipsTurn },
        });
        return {
          ...legs.pose,
          hips: { move: [0, legs.hipsY, 0] as const, rotate: hipsTurn },
          spine: { rotate: [lean, 0, -sway * 0.6 * s] as const },
          chest: { rotate: [lean * 0.5, -10 * s, 0] as const },
          head: { rotate: [-lean, 5 * s, 0] as const },
          knot: { rotate: [lean + 6 * wave(p, 2, 0.2), 0, 6 * wave(p, 2, 0.1)] as const },
          'upperarm.L': { rotate: [armSwing * s, 0, 4] as const },
          'upperarm.R': { rotate: [-armSwing * 0.6 * s, 0, 1.5] as const },
          'forearm.L': { rotate: [-armSwing * 0.4 - armSwing * 0.3 * Math.max(0, -s), 0, 0] as const },
          ...(carry > 0 && {
            'forearm.R': { rotate: [-carry * (1 - s), 0, 0] as const },
            'hand.R': { rotate: [-carry * 0.5 * (1 - s), 0, 0] as const },
          }),
        };
      },
    });
    // A heavy brute: long, planted steps with a low swing; the run has a short flight.
    k.animation('walk', stride(1.0, 0.11, 0.025, 0.62, 0.008, 20, 4, 4, 14));
    k.animation('run', stride(0.6, 0.16, 0.045, 0.42, 0.03, 36, 12, 3, 20));

    // ------------------------------------------------------------------ attack: a heavy overhead chop, solved by targets
    // Plan (in the chest's rest frame): the axe swings back and up behind the right shoulder, the
    // orc coils back onto the rear foot and holds; then the hips and the chest drive forward, the
    // front foot steps in, and the axe comes over the top in the plane beside the head and chops
    // into a target's body in front of the orc (the head about 0.4 m high and 0.45 m forward). The
    // edge leads the whole way (the flat faces sideways). An impact shake, a follow-through down and
    // across the body that slows to a stop above the floor, and a slow recovery.
    const { keys, reach, orient } = motion;
    const DEG = Math.PI / 180;
    // The axe as built by axePose: the haft from the grip to the head (local -Y) and the flat's normal (local +Z).
    // The axe at rest: the haft runs along X across the belly; `dir` points from the right fist to the far head.
    const AXE = { dir: [1, 0, 0] as V3, up: [0, 0, 1] as V3 };
    const SIDE: V3 = [-1, 0, 0];
    const ARM_R = { root: mx(SHOULDER), mid: mx(ELBOW), end: mx(WRIST) };
    const ARM_L = { root: SHOULDER, mid: ELBOW, end: WRIST };
    const deg = (r: number) => r / DEG;
    // A damped shake after `at`, with `n` swings in `len` of the clip.
    const shake = (p: number, at: number, len: number, n: number) =>
      p < at ? 0 : Math.exp((-(p - at) / len) * 3) * Math.sin(((p - at) / len) * Math.PI * n);

    k.animation('attack', {
      duration: 1.25,
      loop: false,
      pose: (_t, p) => {
        const wrist = keys(
          p,
          [
            [0, mx(WRIST)],
            [0.07, [-0.37, 0.4, 0]], // lifts and swings out, so the head clears the floor
            [0.13, [-0.35, 0.42, -0.08]],
            [0.25, [-0.34, 0.57, -0.12]],
            [0.34, [-0.345, 0.7, -0.09]],
            [0.43, [-0.35, 0.715, -0.1]], // the hold: coiled at the top, out beside the head
            [0.48, [-0.31, 0.67, 0.07]],
            [0.52, [-0.29, 0.64, 0.13]],
            [0.56, [-0.24, 0.55, 0.14]], // impact at body height
            [0.62, [-0.12, 0.46, 0.24]], // the follow-through: down and across the body
            [0.7, [-0.04, 0.5, 0.32]],
            [0.78, [-0.04, 0.5, 0.32]], // stopped in front of the belly, the head above the floor
            [0.9, [-0.28, 0.44, 0.15]],
            [1, mx(WRIST)],
          ] as const,
          'spline',
        );
        const axeAt = (q: number) =>
          keys(
            q,
            [
              [0, AXE.dir],
              [0.07, [-0.2, 0.05, -0.95]], // swings out and back, level
              [0.13, [-0.1, 0.0, -1]], // straight back past the hip
              [0.25, [-0.1, 0.05, -1]], // straight back
              [0.34, [-0.1, 0.78, -0.62]], // up and back behind the shoulder
              [0.43, [-0.08, 0.66, -0.75]], // the head sags back in the hold
              [0.48, [0.0, 0.98, 0.2]], // over the top
              [0.52, [0.03, 0.75, 0.66]], // forward and up
              [0.56, [0.05, 0.28, 1]], // level in front: impact (the chest leans it down a little)
              [0.62, [0.45, 0.0, 0.89]], // down and across
              [0.7, [0.62, 0.15, 0.78]],
              [0.78, [0.62, 0.15, 0.78]],
              [0.9, [0.3, -0.05, 0.95]],
              [1, AXE.dir],
            ] as const,
            'spline',
          );
        const up = norm(keys(p, [[0, AXE.up], [0.14, SIDE], [0.8, SIDE], [1, AXE.up]] as const, 'smooth'));
        const arm = reach(ARM_R, wrist, keys(p, [[0, [-0.8, 0.3, 0]], [0.34, [-0.7, 0.55, 0.3]], [0.56, [-0.7, 0.3, -0.2]], [1, [-0.8, 0.3, 0]]] as const, 'smooth'));
        const hand = orient([arm.upper, arm.lower], AXE, { dir: norm(axeAt(p)), up });
        // The off hand points at the target in the wind-up, then pulls back hard as the axe falls.
        const offWrist = keys(p, [[0, WRIST], [0.36, [0.31, 0.42, 0.19]], [0.45, [0.32, 0.42, 0.2]], [0.56, [0.34, 0.36, -0.12]], [0.7, [0.34, 0.34, -0.08]], [1, WRIST]] as const, 'smooth');
        const off = reach(ARM_L, offWrist, [0.8, 0.2, -0.3]);
        const sh = shake(p, 0.56, 0.16, 5);
        const hipsY = keys(p, [[0, 0], [0.36, -9], [0.44, -10], [0.52, 7], [0.58, 9], [0.72, 6], [1, 0]] as const);
        const spineX = keys(p, [[0, 0], [0.36, -8], [0.44, -9], [0.52, 6], [0.58, 7], [0.72, 6], [1, 0]] as const);
        const chestX = keys(p, [[0, 0], [0.36, -6], [0.44, -7], [0.52, 4], [0.58, 5], [0.72, 5], [1, 0]] as const) + 3 * sh;
        const chestY = keys(p, [[0, 0], [0.36, -18], [0.44, -20], [0.52, 9], [0.58, 12], [0.72, 9], [1, 0]] as const);
        // The weight goes back onto the rear foot, then forward: the front (left) foot steps in.
        const hipsZ = keys(p, [[0, 0], [0.36, -0.018], [0.44, -0.02], [0.54, 0.035], [0.72, 0.035], [1, 0]] as const);
        const stepL = keys(p, [[0, 0], [0.34, -6], [0.44, -8], [0.53, -24], [0.74, -22], [1, 0]] as const);
        const legR = deg(Math.atan2(hipsZ, 0.19));
        const legL = stepL + legR;
        const drop = keys(p, [[0, 0], [0.4, 0.005], [0.56, 0.02], [0.62, 0.024], [0.74, 0.018], [1, 0]] as const);
        return {
          hips: { move: [0, -Math.max(legDrop(LEG, legL), legDrop(LEG, legR)) - drop - 0.004 * sh, hipsZ], rotate: [0, hipsY, 0] },
          spine: { rotate: [spineX, 0, 0] },
          chest: { rotate: [chestX, chestY, 0] },
          // The head keeps its eyes on the target.
          head: { rotate: [-(spineX + chestX) * 0.55 - 3 * sh, -(chestY + hipsY) * 0.7, 0] },
          knot: { rotate: [-spineX - chestX * 1.2 + 10 * sh, 0, -chestY * 0.4] },
          'upperarm.R': { rotate: arm.upper },
          'forearm.R': { rotate: arm.lower },
          'hand.R': { rotate: hand },
          'upperarm.L': { rotate: off.upper },
          'forearm.L': { rotate: off.lower },
          'leg.L': { rotate: [legL, -hipsY, 0] },
          'leg.R': { rotate: [legR, -hipsY, 0] },
          'foot.L': { rotate: [-legL - spineX * 0, 0, 0] },
          'foot.R': { rotate: [-legR, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ attack2: a shoulder charge with the pauldron, then a backhand swipe
    // Plan: the orc sinks into a wide stance (the left foot steps back), turns the pauldron
    // shoulder at the target, and tucks the head down behind it; the axe is held across the belly.
    // Two heavy steps (left, then right) carry the hips about 0.3 m forward, and the spiked
    // pauldron rams into the target's chest; a short hold with a shake. Then the body unwinds and
    // the axe swings backhand across the front at the target's waist, the edge leading, out to the
    // right. Two steps back to rest. The feet are solved: a planted foot keeps its world position,
    // the swing foot lifts, and the hips drop so the lowest sole stays on the floor.
    const { edgeUp } = motion;
    const UP: V3 = [0, 1, 0];
    const LEG_Y = HIP[1] - ANKLE[1]; // hip joint to ankle (the ankle is straight below the hip in z)
    const ease = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    type Step = readonly [number, number, number, number]; // phase start, phase end, from z, to z
    const footAt = (steps: readonly Step[], p: number) => {
      let z = 0;
      let lift = 0;
      for (const [a, b, from, to] of steps) {
        if (p >= a) z = from + (to - from) * ease(a, b, p);
        if (p > a && p < b) lift = 0.03 * Math.sin(((p - a) / (b - a)) * Math.PI);
      }
      return { z, lift };
    };
    // The leg angle (degrees, +X swings back) that puts the ankle at world z `footZ`, and the hips
    // drop that keeps that ankle at its rest height. `side` is 1 for the left leg, -1 for the right.
    const legTo = (footZ: number, hipsZ: number, hipsY: number, side: 1 | -1) => {
      const hipZ = hipsZ - side * HIP[0] * Math.sin(hipsY * DEG);
      const a = Math.asin(Math.max(-0.95, Math.min(0.95, (hipZ - footZ) / LEG_Y)));
      return { rot: deg(a), drop: LEG_Y * (1 - Math.cos(a)) };
    };
    const STEPS_L: readonly Step[] = [[0.02, 0.13, 0, -0.2], [0.16, 0.26, -0.2, 0.12], [0.85, 0.95, 0.12, 0]];
    const STEPS_R: readonly Step[] = [[0.26, 0.36, 0, 0.28], [0.72, 0.83, 0.28, 0]];
    // The axe (in the chest's rest frame): across the belly with the head to the left in the
    // charge, cocked further left, then level and forward at contact, out to the right after.
    const swipeAt = (q: number) =>
      keys(
        q,
        [
          [0, AXE.dir],
          [0.15, [0.85, 0, 0.53]],
          [0.36, [0.85, 0, 0.53]],
          [0.45, [0.85, 0, 0.53]],
          [0.49, [0.9, 0, 0.3]], // cocked: the head to the left
          [0.54, [0.35, 0, 0.93]],
          [0.58, [-0.3, 0, 0.95]], // contact: level and forward
          [0.62, [-0.8, 0, 0.55]],
          [0.66, [-0.95, 0, 0]], // the follow-through, out to the right
          [0.72, [-0.92, 0, 0]],
          [0.86, [-0.3, 0, 0.9]],
          [1, AXE.dir],
        ] as const,
        'spline',
      );

    k.animation('attack2', {
      duration: 1.15,
      loop: false,
      pose: (_t, p) => {
        const sh = shake(p, 0.36, 0.1, 5);
        const hipsY = keys(p, [[0, 0], [0.15, 14], [0.45, 14], [0.48, 15], [0.66, -10], [0.72, -10], [0.9, 0]] as const);
        const spineY = keys(p, [[0, 0], [0.15, 14], [0.45, 14], [0.48, 15], [0.66, -10], [0.72, -10], [0.92, 0]] as const);
        const chestY = keys(p, [[0, 0], [0.15, 22], [0.36, 24], [0.45, 24], [0.48, 27], [0.66, -18], [0.72, -18], [0.95, 0]] as const);
        const turn = hipsY + spineY + chestY;
        // The lean toward the target (world +Z); the spine splits it over its X and Z axes because
        // the hips are turned.
        const lean = keys(p, [[0, 0], [0.15, 14], [0.26, 15], [0.36, 20], [0.45, 18], [0.48, 14], [0.66, 6], [0.72, 6], [0.95, 0]] as const);
        const dip = keys(p, [[0, 0], [0.15, 4], [0.36, 8], [0.45, 7], [0.6, 0]] as const); // the pauldron shoulder drops into the ram
        const headX = keys(p, [[0, 0], [0.15, 2], [0.36, -4], [0.45, -4], [0.6, -6], [0.72, -4], [1, 0]] as const);
        const fL = footAt(STEPS_L, p);
        const fR = footAt(STEPS_R, p);
        const hipsZ = (fL.z + fR.z) / 2 + keys(p, [[0, 0], [0.3, 0], [0.36, 0.02], [0.45, 0.015], [0.6, 0.02], [0.72, 0]] as const);
        const legL = legTo(fL.z, hipsZ, hipsY, 1);
        const legR = legTo(fR.z, hipsZ, hipsY, -1);
        const wrist = keys(
          p,
          [
            [0, mx(WRIST)],
            [0.15, [-0.18, 0.4, 0.2]], // tucked: the fist in front of the right side of the belly
            [0.36, [-0.17, 0.4, 0.21]],
            [0.45, [-0.17, 0.4, 0.21]],
            [0.49, [-0.13, 0.41, 0.2]], // cocked across the belly
            [0.54, [-0.36, 0.42, 0.28]],
            [0.58, [-0.42, 0.41, 0.3]], // contact in front
            [0.62, [-0.46, 0.41, 0.2]],
            [0.66, [-0.52, 0.38, 0.1]],
            [0.72, [-0.52, 0.38, 0.1]],
            [0.86, [-0.38, 0.32, 0.12]],
            [1, mx(WRIST)],
          ] as const,
          'spline',
        );
        const pole = keys(p, [[0, [-0.8, 0.2, -0.3]], [0.45, [-0.8, 0.2, -0.3]], [0.54, [-0.7, 0.4, 0.3]], [0.66, [-0.6, 0.3, -0.2]], [1, [-0.8, 0.3, 0]]] as const);
        const arm = reach(ARM_R, wrist, pole);
        const flat = norm(keys(p, [[0, AXE.up], [0.15, UP], [0.72, UP], [0.98, AXE.up]] as const));
        const up = p > 0.45 && p < 0.72 ? edgeUp(swipeAt, p, UP) : flat;
        const hand = orient([arm.upper, arm.lower], AXE, { dir: norm(swipeAt(p)), up });
        // The off arm braces forward, pulls back to drive the charge, and swings out in the swipe.
        const offWrist = keys(p, [[0, WRIST], [0.15, [0.3, 0.38, 0.14]], [0.3, [0.32, 0.37, -0.12]], [0.45, [0.32, 0.37, -0.12]], [0.6, [0.36, 0.4, 0.1]], [0.72, [0.36, 0.4, 0.1]], [1, WRIST]] as const);
        const off = reach(ARM_L, offWrist, [0.8, 0.2, -0.3]);
        const h = hipsY * DEG;
        return {
          hips: { move: [0, -Math.min(legL.drop + fL.lift, legR.drop + fR.lift), hipsZ], rotate: [0, hipsY, 0] },
          spine: { rotate: [lean * Math.cos(h), spineY, lean * Math.sin(h)] },
          chest: { rotate: [3 * sh, chestY, dip + 2 * sh] },
          // The head stays down behind the pauldron, but the eyes turn toward the target.
          head: { rotate: [headX - 3 * sh, -turn * 0.7, 0] },
          knot: { rotate: [-lean * 0.8 + 12 * sh, 0, -chestY * 0.4] },
          'upperarm.R': { rotate: arm.upper },
          'forearm.R': { rotate: arm.lower },
          'hand.R': { rotate: hand },
          'upperarm.L': { rotate: off.upper },
          'forearm.L': { rotate: off.lower },
          'leg.L': { rotate: [legL.rot, -hipsY, 0], move: [0, fL.lift, 0] },
          'leg.R': { rotate: [legR.rot, -hipsY, 0], move: [0, fR.lift, 0] },
          'foot.L': { rotate: [-legL.rot, 0, 0] },
          'foot.R': { rotate: [-legR.rot, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ roar: a war cry with the axe raised
    k.animation('roar', {
      duration: 1.8,
      loop: false,
      pose: (_t, p) => {
        const rise = keys(p, [[0, 0], [0.16, -0.5], [0.3, 1], [0.8, 1], [1, 0]] as const);
        const lift = Math.max(0, rise);
        const crouch = Math.max(0, -rise);
        // Seven quick trembles while it roars (odd, so the strip does not freeze on them).
        const tremble = p > 0.3 && p < 0.82 ? wave((p - 0.3) / 0.52, 7) * Math.sin(((p - 0.3) / 0.52) * Math.PI) : 0;
        const axeWrist = keys(p, [[0, mx(WRIST)], [0.16, [-0.32, 0.3, 0.2]], [0.3, [-0.34, 0.62, 0.34]], [0.8, [-0.34, 0.62, 0.34]], [1, mx(WRIST)]] as const, 'smooth');
        const arm = reach(ARM_R, axeWrist, [-0.8, 0.2, -0.2]);
        const axeDir = norm(keys(p, [[0, AXE.dir], [0.16, AXE.dir], [0.3, [1, 0.05, 0]], [0.8, [1, 0.05, 0]], [1, AXE.dir]] as const, 'smooth'));
        const axeUp = norm(keys(p, [[0, AXE.up], [0.3, [0, 0, 1]], [0.8, [0, 0, 1]], [1, AXE.up]] as const, 'smooth'));
        const hand = orient([arm.upper, arm.lower], AXE, { dir: axeDir, up: axeUp });
        const fist = reach(ARM_L, keys(p, [[0, WRIST], [0.16, [0.32, 0.3, 0.2]], [0.3, [0.34, 0.62, 0.34]], [0.8, [0.34, 0.62, 0.34]], [1, WRIST]] as const, 'smooth'), [0.8, 0.2, -0.2]);
        return {
          hips: { move: [0, -0.025 * crouch - 0.003 * Math.abs(tremble), 0] },
          spine: { rotate: [10 * crouch - 6 * lift, 0, 0] },
          chest: { rotate: [8 * crouch - 10 * lift + 1.5 * tremble, 2 * tremble, 0], scale: [1 + 0.04 * lift, 1, 1 + 0.03 * lift] },
          neck: { rotate: [6 * crouch - 8 * lift, 0, 0] },
          head: { rotate: [8 * crouch - 12 * lift + 2 * tremble, 3 * tremble, 0] },
          knot: { rotate: [-12 * crouch + 18 * lift + 8 * tremble, 0, 6 * tremble] },
          'upperarm.R': { rotate: arm.upper },
          'forearm.R': { rotate: arm.lower },
          'hand.R': { rotate: hand },
          'upperarm.L': { rotate: fist.upper },
          'forearm.L': { rotate: fist.lower },
          'leg.L': { rotate: [0, 0, 4 * lift] },
          'leg.R': { rotate: [0, 0, -4 * lift] },
        };
      },
    });

    // ------------------------------------------------------------------ hit: snap back from a blow, a step back, recover
    k.animation('hit', {
      duration: 0.45,
      loop: false,
      pose: (_t, p) => {
        const r = keys(p, [[0, 0], [0.16, 1], [0.38, 0.8], [1, 0]] as const);
        const back = -0.025 * r;
        const legL = deg(Math.atan2(back, 0.19));
        return {
          hips: { move: [0, -legDrop(LEG, 12 * r), back], rotate: [0, 5 * r, 0] },
          spine: { rotate: [-8 * r, 0, 3 * r] },
          chest: { rotate: [-9 * r, 7 * r, 0] },
          neck: { rotate: [-5 * r, 0, 0] },
          head: { rotate: [-14 * r, -9 * r, 6 * r] },
          knot: { rotate: [18 * r, 0, -10 * r] },
          'upperarm.L': { rotate: [12 * r, 0, 24 * r] },
          'forearm.L': { rotate: [-22 * r, 0, 0] },
          'upperarm.R': { rotate: [10 * r, 0, 4 * r] },
          'forearm.R': { rotate: [-12 * r, 0, 0] },
          'leg.L': { rotate: [legL, 0, 0] },
          'foot.L': { rotate: [-legL, 0, 0] },
          'leg.R': { rotate: [12 * r, 0, 0] }, // a small step back
          'foot.R': { rotate: [-12 * r, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ death: stagger back, topple, lie on the back
    k.animation('death', {
      duration: 1.5,
      loop: false,
      pose: (_t, p) => {
        const fall = keys(p, [[0, 0], [0.2, -8], [0.4, 3], [0.54, -40], [0.66, -88], [0.72, -84], [0.8, -88], [1, -88]] as const);
        const hipsY = keys(p, [[0, 0], [0.4, 0], [0.54, -0.006], [0.66, -0.05], [0.72, -0.038], [0.8, -0.05], [1, -0.05]] as const);
        const hipsZ = keys(p, [[0, 0], [0.2, -0.035], [0.4, -0.02], [0.66, -0.13], [1, -0.13]] as const);
        const legs = keys(p, [[0, 0], [0.2, 4], [0.4, -3], [0.54, 36], [0.66, 50], [1, 50]] as const);
        const stepR = keys(p, [[0, 0], [0.2, 14], [0.4, 4], [0.54, 0], [1, 0]] as const);
        const spill = keys(p, [[0, 0], [0.54, 0], [0.62, 1], [1, 1]] as const);
        return {
          hips: { move: [0, hipsY, hipsZ], rotate: [fall, keys(p, [[0, 0], [0.2, 8], [0.66, -6], [1, -6]] as const), 0] },
          spine: { rotate: [keys(p, [[0, 0], [0.2, -10], [0.4, 8], [0.56, 6], [0.66, -4], [1, 0]] as const), 0, 0] },
          chest: { rotate: [keys(p, [[0, 0], [0.2, -8], [0.4, 6], [0.66, -2], [1, 0]] as const), keys(p, [[0, 0], [0.2, 10], [0.5, -6], [1, 0]] as const), 0] },
          neck: { rotate: [keys(p, [[0, 0], [0.2, -8], [0.4, 8], [0.6, 16], [0.7, -6], [0.8, 0], [1, 0]] as const), 0, 0] },
          head: { rotate: [keys(p, [[0, 0], [0.2, -14], [0.4, 10], [0.6, 14], [0.7, -10], [0.8, 0], [1, 0]] as const), keys(p, [[0, 0], [0.7, 0], [0.9, 28], [1, 28]] as const), 0] },
          knot: { rotate: [keys(p, [[0, 0], [0.2, 16], [0.4, -10], [0.66, 30], [0.76, -10], [1, 0]] as const), 0, 12 * spill] },
          'upperarm.L': { rotate: [keys(p, [[0, 0], [0.2, 12], [0.4, -8], [0.58, -55], [0.7, 30], [1, 34]] as const), 0, keys(p, [[0, 0], [0.2, 28], [0.4, 12], [0.58, 40], [0.7, 60], [1, 62]] as const)] },
          'forearm.L': { rotate: [keys(p, [[0, 0], [0.2, -30], [0.58, -20], [0.7, -6], [1, -8]] as const), 0, 0] },
          'upperarm.R': { rotate: [keys(p, [[0, 0], [0.2, 10], [0.4, -6], [0.58, -45], [0.7, 30], [1, 34]] as const), 0, keys(p, [[0, 0], [0.2, 2], [0.4, 2], [0.58, -8], [0.7, -14], [1, -15]] as const)] },
          'forearm.R': { rotate: [keys(p, [[0, 0], [0.2, -20], [0.58, -15], [0.7, 0], [1, 0]] as const), 0, 0] },
          'hand.R': { rotate: [0, 0, 0] },
          'leg.L': { rotate: [legs + keys(p, [[0, 0], [0.2, -6], [0.4, 0]] as const), 0, 6 * spill] },
          'leg.R': { rotate: [legs + stepR, 0, -8 * spill] },
          'foot.L': { rotate: [-keys(p, [[0, 0], [0.4, 0], [0.66, 12], [1, 12]] as const), 0, 0] },
          'foot.R': { rotate: [-stepR * 0.8, 0, 0] },
        };
      },
    });
  },
});
