import { defineAsset, motion, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Orc warrior — Chibi Quest enemy (catalog `enemies/humanoid/orc-warrior`), about 1.05 m to the
 * top of its topknot, faces +Z. Target: docs/enemy-mockups/orc-warrior_001.jpg (made with mmx;
 * one front view).
 *
 * Role: a tough melee enemy, bigger than the goblins, seen in 3D and as a 128 px sprite; the
 *   tusks, the brow, and the spiked pauldron must read.
 * One idea: a stocky brute that is all shoulders and arms, with a heavy scowl, huge tusks, and a
 *   spiked iron pauldron, on short legs and big bare feet.
 * Proportions (from the mockup): topknot 1.05, hairline 0.84, eyes 0.68, tusk tips 0.66, beard
 *   point 0.46, shoulders 0.55, belt 0.33, loincloth hem 0.16, fists 0.24 at x 0.35.
 * Shape language: round and massive (shoulders, arms, fists, belly, head) with sharp accents for
 *   menace (tusks, pauldron spikes, axe, ear tips, torn loincloth).
 * Palette (60/30/10): green skin #7aa23e; brown leather #6e3f24 and fur #6a4a30; black hair and
 *   beard; red loincloth and hair band #b83a2e; iron #5a6068; yellow eyes #f2c230 as the accent.
 * Value plan: the yellow eyes under the black brows and the cream tusks are the strongest
 *   contrast (focal point); the dark pauldron and the red loincloth are the second masses.
 * Bodies: skin, hair (hair combed back in thick strands to the topknot, sideburns, beard, brows),
 *   tusks, iron (pauldron, buckle, axe head), spikes, leather (flared bracers, strap, belt),
 *   loincloth (a torn, shaggy red wrap), fur (shaggy shin wraps), band, haft.
 * Rig: chibi humanoid with wide joints plus `knot` (the topknot tail); the axe is rigid on
 *   `hand.R`, the pauldron follows `upperarm.R`. Clips: idle, walk, run, attack (a heavy overhead
 *   chop solved by targets: a big wind-up behind the shoulder, a hold, the body drives the axe
 *   down in front, an impact with a shake, a follow-through), attack2 (a shoulder charge: a low,
 *   wide stance with the pauldron shoulder turned at the target, two heavy steps, a ram with the
 *   spiked pauldron and a shake; then the body unwinds into a backhand axe swipe at waist height,
 *   the edge leading; two steps back), roar (a war cry), hit, death.
 */

const C = {
  skin: '#6a7a2a',
  skinDark: '#4a5a1c',
  eye: '#f2c230',
  pupil: '#141010',
  lid: '#2a3a18',
  mouth: '#2a1a14',
  hair: '#1e1a18',
  tusk: '#f1e6c8',
  iron: '#5a6068',
  ironLight: '#8a9098',
  leather: '#6e3f24',
  leatherDark: '#4a2a18',
  red: '#96302a',
  redDark: '#5a1a15',
  fur: '#6a4a30',
  furDark: '#4a3220',
  wood: '#7a4a2a',
  band: '#d03a30',
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

// Joints: wide shoulders, arms hanging out from the body, a wide stance.
const SHOULDER: V3 = [0.22, 0.52, 0];
const ELBOW: V3 = [0.31, 0.4, 0.02];
const WRIST: V3 = [0.345, 0.3, 0.05];
const HIP: V3 = [0.1, 0.25, 0];
const ANKLE: V3 = [0.155, 0.075, 0];
const KNEE: V3 = [0.1275, 0.1625, 0]; // the knee: splits the leg (shin.L takes the weight below it)
// The ends of the flat bottom of the left bare foot (y = 0), measured on the SDF: heel and toe.
// The foot turns out 14 degrees, so the toe point sits outboard of the heel.
const SOLE_HEEL: V3 = [0.155, 0, -0.022];
const SOLE_TOE: V3 = [0.169, 0, 0.09];
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

export default defineAsset({
  name: 'orc-warrior',
  description: 'Chibi orc warrior enemy: huge shoulders, big tusks, a black topknot and beard, a spiked iron pauldron, leather bracers, and a hand axe.',
  detail: 0.005,
  reference: 'docs/enemy-mockups/orc-warrior_001.jpg',
  // Color slots for individual orcs (the first option is the default look).
  variants: {
    eyes: { yellow: C.eye, red: '#d8321e', orange: '#f0861c' },
    hair: { black: C.hair, brown: '#2c1c12', red: '#40140f' },
    skin: { green: C.skin, olive: '#4a5220', grey: '#6e7868' },
    // Tribal dyes: blood red, soot black, undyed hide. No bright blue on an orc.
    clothing: { red: C.red, black: '#2e2019', hide: '#7a6040' },
  },
  presets: {
    bloodfang: { eyes: 'red', hair: 'red', skin: 'green', clothing: 'black' },
    bog: { eyes: 'yellow', hair: 'brown', skin: 'olive', clothing: 'hide' },
    ashen: { eyes: 'orange', hair: 'brown', skin: 'grey', clothing: 'black' },
  },

  build(k) {
    // The slot colors (see variants): shades of a slot keep their exact default color and follow
    // the slot when a game recolors it; the mouth and the nostrils follow the skin halfway.
    const T = {
      eye: k.tint('eyes'),
      hair: k.tint('hair'),
      skin: k.tint('skin'),
      skinDark: k.tint('skin', { color: C.skinDark, follow: 1 }),
      lid: k.tint('skin', { color: C.lid, follow: 1 }),
      mouth: k.tint('skin', { color: C.mouth, follow: 0.5 }),
      red: k.tint('clothing'),
      band: k.tint('clothing', { color: C.band, follow: 1 }),
    };
    // A paintFn shade that follows its slot: the old color as an offset from the body color, so
    // the default look keeps the exact old color and the slot mask stays full under it.
    const shadeOf = (body: string, shade: string) => {
      const a = rgb(body);
      const b = rgb(shade);
      return [b[0] - a[0], b[1] - a[1], b[2] - a[2]] as const;
    };
    const KNOT: V3 = [0, 0.978, -0.04];
    // ------------------------------------------------------------------ skeleton
    k.skeleton({
      hips: { at: [0, 0.26, 0] },
      spine: { parent: 'hips', at: [0, 0.34, 0] },
      chest: { parent: 'spine', at: [0, 0.44, 0] },
      neck: { parent: 'chest', at: [0, 0.54, -0.01] },
      head: { parent: 'neck', at: [0, 0.58, -0.01] },
      knot: { parent: 'head', at: KNOT, tail: [0.06, 0.97, -0.1] },
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
        sdf.ellipsoid([0.16, 0.038, 0.065]).at(0, 0.748, 0.12), // a heavy brow shelf
      )
      .bone('head');
    const faceZ = (x: number, y: number) => sdf.raycast(head, [x, y, 1], [0, 0, -1])![2];
    const nose = sdf.ellipsoid([0.046, 0.032, 0.032]).at(0, 0.655, faceZ(0, 0.655) - 0.008).bone('head');
    // Pointed ears, swept out and up.
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
    // Six blocky abdominal muscles on the belly, set on its surface.
    const belly = sdf.smoothUnion(0.06, sdf.ellipsoid([0.2, 0.16, 0.15]).at(0, 0.47, 0), sdf.ellipsoid([0.17, 0.13, 0.14]).at(0, 0.35, 0.02));
    const abs = pair(
      sdf.union(
        ...[0.405, 0.365, 0.325].map((y, i) => {
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
    // Big bare feet with four round toes.
    const footLocal = sdf
      .smoothUnion(
        0.02,
        sdf.ellipsoid([0.078, 0.052, 0.11]).at(0, 0.045, 0.035),
        ...[-0.045, -0.015, 0.015, 0.045].map((x, i) => sdf.sphere(0.024 - i * 0.001).at(x, 0.03, 0.135 - Math.abs(x) * 0.3)),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const feet = pair(footLocal.rotateY(14).at(ANKLE[0], 0, 0).bone('foot.L'));

    // ------------------------------------------------------------------ face paint
    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const EYE: V3 = [0.074, 0.69, 0];
    const eyeBall = pair(at(sdf.ellipsoid([0.049, 0.041, 0.07]), EYE[0], EYE[1]));
    const pupil = pair(at(sdf.ellipsoid([0.02, 0.025, 0.07]), EYE[0] - 0.008, EYE[1] - 0.004));
    // The upper lid cuts across each eye on a slant, low at the inner end: a scowl.
    const lidL = sdf
      .extrude(
        profile.polygon([
          [EYE[0] - 0.06, EYE[1] + 0.014],
          [EYE[0] + 0.06, EYE[1] + 0.04],
          [EYE[0] + 0.06, EYE[1] + 0.08],
          [EYE[0] - 0.06, EYE[1] + 0.08],
        ]),
        0.4,
      )
      .at(0, 0, 0.2);
    const lids = pair(lidL);
    const shine = sdf.union(
      ...[EYE[0], -EYE[0]].map((x) => at(sdf.sphere(0.008), x - 0.002, EYE[1] + 0.004)),
    );
    const MOUTH_Y = 0.604;
    // A scowling upper lip over the underbite: a downturned line whose corners run under the tusk roots.
    const mouth = sdf.extrude(profile.arc(0.06, 0.013, 45, 135), 0.4).at(0, MOUTH_Y - 0.06, 0.2);
    const nostrils = pair(sdf.sphere(0.009).at(0.02, 0.64, faceZ(0, 0.64) + 0.012));
    const skin = sdf
      .smoothUnion(0.04, head, neck)
      .smoothUnion(0.015, nose, ears)
      .smoothUnion(0.05, trunk)
      .smoothUnion(0.012, abs)
      .union(armAt(1), armAt(-1))
      .smoothUnion(0.03, legs)
      .union(feet)
      .paintWhere(eyeBall, T.eye, 0.002)
      .paintWhere(pupil, C.pupil, 0.002)
      .paintWhere(shine, '#ffffff', 0.002)
      .paintWhere(lids.intersect(eyeBall.round(0.006)), T.lid, 0.002)
      .paintWhere(mouth, T.mouth, 0.003)
      .paintWhere(nostrils, T.mouth, 0.004)
      .paintWhere(pair(sdf.extrude(profile.rect([0.006, 0.08], 0.003), 0.4).rotateZ(-8).at(0.055, 0.35, 0.2)), T.skinDark, 0.01); // belly lines
    k.body('skin', skin, { color: T.skin, roughness: 0.55, textureDensity: 2 });

    // ------------------------------------------------------------------ hair, beard, brows (black)
    // Thick hair combed back: a full cap over the skull, high at the front hairline, pulled up
    // over the ears, cut in thick rounded strands that all run to the base of the topknot.
    // The hairline: high on the forehead, over the ears at the sides, down to the nape at the back.
    const hairlineY = (z: number) => 0.79 + (z > 0 ? 0.35 : 0.85) * z;
    const hairRegion = sdf.smoothUnion(0.03, sdf.halfSpace([0, -1, 0.35], -0.79 / Math.hypot(1, 0.35)), sdf.halfSpace([0, -1, 0.85], -0.79 / Math.hypot(1, 0.85)));
    const hairCap = sdf
      .smoothUnion(0.04, head.round(0.016), sdf.ellipsoid([0.16, 0.085, 0.13]).at(0, 0.86, 0.01))
      .smoothIntersect(0.012, hairRegion)
      .smoothSubtract(0.01, sdf.ellipsoid([0.2, 0.1, 0.2]).at(0, 0.66, 0.1));
    const KNOT_BASE: V3 = [0, 0.93, -0.035];
    const smooth01 = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    // Strands are meridians around the axis from the knot's base to the face: each one runs from
    // the hairline up and back to the knot, on the sides as well as in front. `strandAt` gives the
    // strand coordinate and the distance from that axis.
    const AX = norm(sub([0, 0.62, 0.16], KNOT_BASE));
    const E2: V3 = [0, AX[2], -AX[1]];
    const strandAt = (x: number, y: number, z: number) => {
      const q: V3 = [x - KNOT_BASE[0], y - KNOT_BASE[1], z - KNOT_BASE[2]];
      const a = q[0] * AX[0] + q[1] * AX[1] + q[2] * AX[2];
      const px = q[0] - a * AX[0];
      const py = q[1] - a * AX[1];
      const pz = q[2] - a * AX[2];
      const r = Math.hypot(px, py, pz);
      const ang = Math.atan2(px, -(py * E2[1] + pz * E2[2]));
      return { u: ((ang + 0.12 * Math.sin(r * 30)) * 9) / Math.PI, r };
    };
    // Positive in the grooves (the surface moves in), negative on the strand crowns.
    const strands = (x: number, y: number, z: number) => {
      const { u, r } = strandAt(x, y, z);
      const f = Math.abs(u - Math.floor(u) - 0.5);
      // Broad, softly rounded locks with narrow grooves between them (clay-like combed hair).
      return (smooth01(0.28, 0.5, f) * 1.2 - 0.2 - 0.25 * (1 - 4 * f * f)) * smooth01(0.03, 0.08, r);
    };
    // The hair thins out toward the hairline, so its edge lies close on the skin (no bowl rim).
    const hairTaper = (_x: number, y: number, z: number) => 1 - smooth01(0, 0.05, y - hairlineY(z));
    const bun = sdf.smoothUnion(
      0.02,
      sdf.sphere(0.054).at(KNOT[0], KNOT[1], KNOT[2]),
      sdf.cone([0, 0.915, -0.03], [KNOT[0], KNOT[1], KNOT[2]], 0.045, 0.038),
    );
    const tail = sdf.chain(
      [
        [KNOT[0] + 0.02, KNOT[1] + 0.02, KNOT[2] - 0.03, 0.032],
        [KNOT[0] + 0.065, KNOT[1] + 0.03, KNOT[2] - 0.07, 0.024],
        [KNOT[0] + 0.105, KNOT[1] + 0.0, KNOT[2] - 0.095, 0.011],
      ],
      0.01,
    );
    // A wide, pointed beard that hangs from the chin, joined to sideburns that run up the jaw to the
    // temples. Its top stays well under the mouth, so a band of green chin shows the frown line.
    const jawFront = faceZ(0, 0.52);
    const beardStrands = (x: number, y: number, z: number) => Math.sin(x * 90 + Math.sin(y * 30) * 1.5);
    const beard = sdf
      .smoothUnion(
        0.025,
        sdf.ellipsoid([0.104, 0.034, 0.05]).at(0, 0.51, jawFront - 0.035),
        sdf.cone([0, 0.5, jawFront - 0.033], [0, 0.435, jawFront - 0.012], 0.064, 0.016),
      )
      .displace(0.003, beardStrands);
    const sideburnPath = [
      [0.178, 0.675],
      [0.16, 0.615],
      [0.125, 0.568],
      [0.085, 0.545],
    ].map(([x, y], i) => [x!, y!, faceZ(x!, y!), 0.012 + i * 0.007] as [number, number, number, number]);
    const sideburns = pair(head.round(0.012).intersect(sdf.chain(sideburnPath, 0.02)).subtract(head.round(-0.004)));
    // Thick brows over the eyes; the inner ends dip toward the nose.
    const browAt = (x: number, y: number): V3 => [x, y, faceZ(Math.abs(x), y) - 0.006];
    const brows = pair(
      sdf.chain(
        [
          [...browAt(EYE[0] + 0.062, EYE[1] + 0.064), 0.018],
          [...browAt(EYE[0] + 0.008, EYE[1] + 0.047), 0.023],
          [...browAt(EYE[0] - 0.05, EYE[1] + 0.022), 0.019],
        ],
        0.008,
      ),
    );
    const hairDark = shadeOf(C.hair, '#0c0a0a');
    const hairShine = shadeOf(C.hair, '#3a3a40');
    const plus = (c: readonly [number, number, number], d: readonly [number, number, number]) => [c[0] + d[0], c[1] + d[1], c[2] + d[2]] as const;
    const hair = sdf
      .union(
        sdf.smoothUnion(0.015, hairCap.displace(0.01, strands, 2.4).displace(0.013, hairTaper, 1.3), bun).bone('head'),
        tail.bone('knot'),
        sdf.smoothUnion(0.02, beard, sideburns).bone('head'),
        brows.bone('head'),
      )
      // The grooves go darker and the strand crowns catch a cool sheen, so the combing reads.
      .paintFn((x, y, z, base) => {
        if (y < 0.76) return base;
        const g = strands(x, y, z);
        if (g > 0.55) return plus(base, hairDark);
        if (g < -0.36) return plus(base, hairShine);
        return base;
      });
    k.body('hair', hair, { color: T.hair, roughness: 0.45, detail: 0.004 });
    // The red band that ties the topknot.
    k.body('band', sdf.torus(0.047, 0.014).at(0, 0.952, -0.035).bone('head'), { color: T.band, roughness: 0.7, detail: 0.004 });

    // ------------------------------------------------------------------ tusks
    // The owner asked for this: the tusks hang down from under the upper lip.
    // Big tusks are teeth of the upper jaw: each comes out of the mouth from under the upper lip
    // (its root is sunk behind the lip and cut at the lip line) and hangs down over the lower
    // jaw, a little out and forward at the tip.
    const tuskPath = [
      [0.046, MOUTH_Y - 0.002, 0.021, -0.008],
      [0.052, MOUTH_Y - 0.028, 0.022, 0.01],
      [0.06, MOUTH_Y - 0.056, 0.017, 0.021],
      [0.066, MOUTH_Y - 0.08, 0.01, 0.03],
    ].map(([x, y, r, lift]) => [x!, y!, faceZ(x!, y!) + lift!, r!] as [number, number, number, number]);
    const tusks = pair(sdf.chain(tuskPath, 0.012).intersect(sdf.halfSpace([0, 1, 0], MOUTH_Y - 0.002)));
    // Ivory, warmer and darker at the root, pale at the blunt tip.
    const tuskRoot = rgb('#b9a57a');
    const tuskTip = rgb(C.tusk);
    k.body(
      'tusks',
      tusks.bone('head').paintFn((x, y) => {
        const t = 1 - smooth01(MOUTH_Y - 0.078, MOUTH_Y, y);
        return [tuskRoot[0] + (tuskTip[0] - tuskRoot[0]) * t, tuskRoot[1] + (tuskTip[1] - tuskRoot[1]) * t, tuskRoot[2] + (tuskTip[2] - tuskRoot[2]) * t];
      }),
      { color: C.tusk, roughness: 0.4 },
    );

    // ------------------------------------------------------------------ leather: bracers, chest strap, belt
    // Flared leather cuffs: wide at the elbow with a rolled top edge, soft creases, a dark seam.
    const bracer = (e: V3, w: V3) => {
      const d = norm(sub(w, e));
      const along = (x: number, y: number, z: number) => (x - e[0]) * d[0] + (y - e[1]) * d[1] + (z - e[2]) * d[2];
      const creases = (x: number, y: number, z: number) => Math.sin(along(x, y, z) * 70 + noise.fbm(x * 12, y * 12, z * 12, 2) * 1.2);
      const cuff = sdf
        .smoothUnion(
          0.01,
          sdf.cone(lerp(e, w, 0.06), lerp(e, w, 1.0), 0.1, 0.086),
          sdf.cone(lerp(e, w, 0.0), lerp(e, w, 0.14), 0.108, 0.102), // the rolled top edge
        )
        .displace(0.003, creases, 1.3)
        .round(0.002);
      const band = (t: number) => sdf.cone(lerp(e, w, t - 0.03), lerp(e, w, t + 0.03), 0.2, 0.2);
      return cuff.paintWhere(band(0.18), C.leatherDark, 0.004).paintWhere(band(0.86), C.leatherDark, 0.004);
    };
    const bracers = sdf.union(bracer(ELBOW, WRIST).bone('forearm.L'), bracer(mx(ELBOW), mx(WRIST)).bone('forearm.R'));
    const trunkShape = sdf.smoothUnion(0.06, sdf.ellipsoid([0.2, 0.16, 0.15]).at(0, 0.47, 0), sdf.ellipsoid([0.17, 0.13, 0.14]).at(0, 0.35, 0.02));
    // The strap runs from the right shoulder, under the pauldron, down to the left hip.
    const strap = trunkShape.round(0.012).smoothIntersect(0.006, sdf.box([0.8, 0.05, 0.8], 0.006).rotateZ(-32).at(0, 0.44, 0));
    const beltY = 0.33;
    const belt = trunkShape.round(0.016).smoothIntersect(0.006, sdf.box([0.6, 0.06, 0.6], 0.008).at(0, beltY, 0));
    k.body('leather', sdf.union(bracers, strap.bone('chest'), belt.bone('spine')), { color: C.leather, roughness: 0.6 });

    // ------------------------------------------------------------------ iron: pauldron, buckle, strap rivets, axe head
    const lame = (s: number) =>
      sdf
        .ellipsoid([0.12 * s, 0.075 * s, 0.11 * s])
        .intersect(sdf.halfSpace([0, -1, 0], 0.016 * s))
        .round(0.004);
    const pauldronPose = (s: sdf.Shape) => s.scale(1.24).rotateZ(28).at(-0.252, 0.578, -0.005);
    const pauldronLocal = sdf.union(lame(1), lame(1.12).at(0, -0.04, 0));
    const pauldron = pauldronPose(pauldronLocal);
    // Spikes on the upper lame, in its local frame: rooted on the dome, along the dome's normal.
    const [RA, RB, RC] = [0.12, 0.075, 0.11];
    const spikesLocal = sdf.union(
      ...[
        [-0.055, 0.0],
        [0.0, 0.0],
        [0.055, 0.0],
        [-0.03, -0.05],
        [0.03, -0.05],
      ].map(([x, z]) => {
        const y = RB * Math.sqrt(Math.max(0, 1 - (x! / RA) ** 2 - (z! / RC) ** 2));
        const nx = x! / RA ** 2;
        const ny = y / RB ** 2;
        const nz = z! / RC ** 2;
        const l = Math.hypot(nx, ny, nz);
        const d: V3 = [nx / l, ny / l, nz / l];
        return sdf.cone([x! - d[0] * 0.01, y - d[1] * 0.01, z! - d[2] * 0.01], [x! + d[0] * 0.075, y + d[1] * 0.075, z! + d[2] * 0.075], 0.021, 0.003);
      }),
    );
    const spikes = pauldronPose(spikesLocal);
    const beltZ = sdf.raycast(belt, [0, beltY, 1], [0, 0, -1])![2];
    const buckle = sdf
      .union(
        sdf.cylinder(0.05, 0.016, 0.006).rotateX(90),
        sdf.sphere(0.022).scale([1, 1, 0.6]).at(0, 0, 0.01),
        ...[0, 90, 180, 270].map((a) => sdf.sphere(0.008).at(0.035 * Math.cos((a * Math.PI) / 180 + 0.785), 0.035 * Math.sin((a * Math.PI) / 180 + 0.785), 0.009)),
      )
      .at(0, beltY, beltZ + 0.006);
    const strapRivets = sdf.union(
      ...[0.2, 0.45, 0.7].map((t) => {
        const p = sdf.surfacePoint(strap, [-0.16 + t * 0.32, 0.54 - t * 0.2, 0.3], 0.002);
        return sdf.sphere(0.009).at(...p);
      }),
    );

    // The axe: local frame with the grip at the origin, the haft down (-Y), the blade out to -X.
    // A large crescent blade: a narrow neck on the haft, horns that curl up and down, and a wide
    // convex edge (an arc about EDGE_C). A bright band of worn iron follows the edge.
    // (A lens that thins the blade toward the edge breaks the triangle reduction; keep it flat.)
    const EDGE_C: [number, number] = [-0.05, -0.165];
    const EDGE_R = 0.168;
    const edgeRing = (r: number) => sdf.cylinder(r, 0.4).rotateX(90).at(EDGE_C[0], EDGE_C[1], 0);
    const axeHead = sdf
      .extrude(
        profile.polygon(
          [
            [0.014, -0.135],
            [-0.035, -0.145],
            [-0.085, -0.125],
            [-0.135, -0.085],
            [-0.17, -0.045], // the upper horn
            [-0.2, -0.085],
            [-0.217, -0.145],
            [-0.212, -0.205],
            [-0.195, -0.25],
            [-0.165, -0.285], // the lower horn
            [-0.115, -0.266],
            [-0.07, -0.25],
            [-0.035, -0.245],
            [0.014, -0.245],
          ],
          { smooth: true, samples: 4 },
        ),
        0.024,
        0.007,
      )
      .union(sdf.cone([0.01, -0.19, 0], [0.075, -0.188, 0], 0.02, 0.004)) // back spike
      .paintWhere(edgeRing(EDGE_R + 0.03).subtract(edgeRing(EDGE_R - 0.022)), C.ironLight, 0.004);
    const GRIP: V3 = [-WRIST[0] - 0.006, WRIST[1] - 0.064, WRIST[2] + 0.02];
    const axePose = (s: sdf.Shape) => s.scale(1.14).rotateZ(-12).rotateX(-40).at(...GRIP);
    const ironBump = (x: number, y: number, z: number) => 0.0008 * noise.fbm(x * 60, y * 60, z * 60, 2);
    k.body('iron', sdf.union(pauldron.bone('upperarm.R'), buckle.bone('spine'), strapRivets.bone('chest')), {
      color: C.iron,
      roughness: 0.5,
      metalness: 0.75,
      bump: ironBump,
    });
    k.body('axe-head', axePose(axeHead), { color: C.iron, roughness: 0.45, metalness: 0.8, bump: ironBump, bone: 'hand.R', detail: 0.004 });
    k.body('spikes', spikes.bone('upperarm.R'), { color: C.iron, roughness: 0.4, metalness: 0.8, detail: 0.004 });
    k.body('haft', axePose(sdf.cylinder(0.019, 0.3, 0.006).at(0, -0.09, 0)), {
      color: C.wood,
      roughness: 0.75,
      bone: 'hand.R',
      bump: (x, y, z) => 0.0008 * noise.fbm(x * 30, y * 200, z * 30, 2),
    });

    // ------------------------------------------------------------------ loincloth and fur shin wraps
    // A torn red wrap around the hips: a flared shell under the belt, with soft vertical folds, a
    // ragged hem of V tears and slits, and darker, frayed streaks toward the hem.
    const skirtCone = (grow: number, top: number) =>
      sdf
        .revolve(
          profile.polygon([
            [0, top],
            [0.182 + grow, top],
            [0.182 + grow, 0.33],
            [0.21 + grow, 0.26],
            [0.238 + grow, 0.165],
            [0, 0.165],
          ]),
        )
        .scale([1, 1, 0.84])
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
    // The darker streaks and hem follow the clothing slot (an offset from the body color).
    const redDark = shadeOf(C.red, C.redDark);
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
        const t = Math.min(1, Math.max(0, hem * 0.75 + (streak > 0.15 ? 0.45 : streak < -0.3 ? -0.25 : 0)));
        return [base[0] + redDark[0] * t, base[1] + redDark[1] * t, base[2] + redDark[2] * t];
      });
    k.body('loincloth', loincloth, { color: T.red, roughness: 0.88 });
    // Shaggy fur wraps on the shins: tufts that hang down, with a ragged lower edge.
    const tufts = (x: number, y: number, z: number) => {
      const a = Math.atan2(x - ANKLE[0], z);
      return 0.55 * Math.sin(a * 14 + noise.fbm(x * 40, y * 20, z * 40, 2) * 3) + 0.45 * noise.fbm(x * 70, y * 30, z * 70, 2);
    };
    const furWrap = pair(
      sdf
        .smoothUnion(0.02, sdf.cylinder(0.096, 0.08, 0.03).at(ANKLE[0] - 0.004, 0.14, 0.008), sdf.torus(0.084, 0.022).at(ANKLE[0] - 0.004, 0.104, 0.008))
        .displace(0.011, tufts, 2)
        .bone('leg.L'),
    );
    k.body('fur', furWrap.paintFn((x, y, z, base) => (tufts(x < 0 ? -x : x, y, z) > 0.25 ? rgb(C.furDark) : base)), {
      color: C.fur,
      roughness: 0.95,
    });

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
        'upperarm.R': { rotate: [2 * wave(p, 1, 0.1), 0, -4 * bump(p)] },
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
          'upperarm.R': { rotate: [-armSwing * 0.6 * s, 0, -4] as const },
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
    const rotXv = (v: V3, d: number): V3 => [v[0], v[1] * Math.cos(d * DEG) - v[2] * Math.sin(d * DEG), v[1] * Math.sin(d * DEG) + v[2] * Math.cos(d * DEG)];
    const rotZv = (v: V3, d: number): V3 => [v[0] * Math.cos(d * DEG) - v[1] * Math.sin(d * DEG), v[0] * Math.sin(d * DEG) + v[1] * Math.cos(d * DEG), v[2]];
    // The axe as built by axePose: the haft from the grip to the head (local -Y) and the flat's normal (local +Z).
    const AXE = { dir: rotXv(rotZv([0, -1, 0], -12), -40), up: rotXv(rotZv([0, 0, 1], -12), -40) };
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
            [0.7, [-0.04, 0.4, 0.3]],
            [0.78, [-0.04, 0.4, 0.3]], // stopped in front of the left knee, the head above the floor
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
              [0.07, [-0.45, -0.75, 0.1]], // out to the side
              [0.13, [-0.15, -0.75, -0.6]], // swings back past the leg
              [0.25, [-0.1, 0.05, -1]], // straight back
              [0.34, [-0.1, 0.78, -0.62]], // up and back behind the shoulder
              [0.43, [-0.08, 0.66, -0.75]], // the head sags back in the hold
              [0.48, [0.0, 0.98, 0.2]], // over the top
              [0.52, [0.03, 0.75, 0.66]], // forward and up
              [0.56, [0.05, 0.28, 1]], // level in front: impact (the chest leans it down a little)
              [0.62, [0.45, -0.2, 0.87]], // down and across
              [0.7, [0.62, -0.4, 0.68]],
              [0.78, [0.62, -0.41, 0.68]],
              [0.9, [0, -0.3, 0.95]],
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
          [0.15, [0.55, -0.35, 0.75]],
          [0.36, [0.55, -0.3, 0.78]],
          [0.45, [0.55, -0.3, 0.78]],
          [0.49, [0.78, -0.12, 0.42]], // cocked: the head to the left
          [0.54, [0.35, -0.12, 0.93]],
          [0.58, [-0.3, -0.12, 0.95]], // contact: level and forward
          [0.62, [-0.8, -0.1, 0.55]],
          [0.66, [-0.95, -0.1, 0]], // the follow-through, out to the right
          [0.72, [-0.92, -0.2, 0]],
          [0.86, [-0.6, -0.6, 0.3]],
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
            [0.54, [-0.2, 0.42, 0.22]],
            [0.58, [-0.27, 0.41, 0.18]], // contact in front
            [0.62, [-0.33, 0.41, 0.1]],
            [0.66, [-0.36, 0.4, 0]],
            [0.72, [-0.36, 0.39, 0]],
            [0.86, [-0.36, 0.33, 0.04]],
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
        const axeWrist = keys(p, [[0, mx(WRIST)], [0.16, [-0.3, 0.33, 0.08]], [0.3, [-0.38, 0.66, 0.06]], [0.8, [-0.38, 0.66, 0.06]], [1, mx(WRIST)]] as const, 'smooth');
        const arm = reach(ARM_R, axeWrist, [-0.8, 0.2, -0.2]);
        const axeDir = norm(keys(p, [[0, AXE.dir], [0.16, AXE.dir], [0.3, [-0.35, 0.93, 0.1]], [0.8, [-0.35, 0.93, 0.1]], [1, AXE.dir]] as const, 'smooth'));
        const axeUp = norm(keys(p, [[0, AXE.up], [0.3, [0, -0.1, 1]], [0.8, [0, -0.1, 1]], [1, AXE.up]] as const, 'smooth'));
        const hand = orient([arm.upper, arm.lower], AXE, { dir: axeDir, up: axeUp });
        const fist = reach(ARM_L, keys(p, [[0, WRIST], [0.16, [0.28, 0.33, 0.1]], [0.3, [0.38, 0.64, 0.06]], [0.8, [0.38, 0.64, 0.06]], [1, WRIST]] as const, 'smooth'), [0.8, 0.2, -0.2]);
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
          'upperarm.R': { rotate: [10 * r, 0, -18 * r] },
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
          'upperarm.R': { rotate: [keys(p, [[0, 0], [0.2, 10], [0.4, -6], [0.58, -45], [0.7, 30], [1, 34]] as const), 0, keys(p, [[0, 0], [0.2, -22], [0.4, -10], [0.58, -35], [0.7, -58], [1, -60]] as const)] },
          'forearm.R': { rotate: [keys(p, [[0, 0], [0.2, -20], [0.58, -15], [0.7, 0], [1, 0]] as const), 0, 0] },
          'hand.R': { rotate: [keys(p, [[0, 0], [0.62, 0], [0.8, 40], [1, 40]] as const), 0, 0] },
          'leg.L': { rotate: [legs + keys(p, [[0, 0], [0.2, -6], [0.4, 0]] as const), 0, 6 * spill] },
          'leg.R': { rotate: [legs + stepR, 0, -8 * spill] },
          'foot.L': { rotate: [-keys(p, [[0, 0], [0.4, 0], [0.66, 12], [1, 12]] as const), 0, 0] },
          'foot.R': { rotate: [-stepR * 0.8, 0, 0] },
        };
      },
    });
  },
});
