import { defineAsset, motion, noise, profile, sdf, THREE } from '../src/index.js';

/**
 * Animated armor — Chibi Quest dungeon enemy: an empty, haunted suit of plate, about 0.98 m to
 * the helm crown and 1.05 m to the plume tip, faces +Z. Target:
 * docs/enemy-mockups/animated-armor_001.jpg (made with mmx; one front view). Built on the
 * knight's body and skeleton, so the armored characters share one build.
 *
 * Role: a slow, tough dungeon guard, seen in 3D and as a 128 px sprite; the black visor with its
 *   two glowing eyes must read at once.
 * One idea: a huge round great helm with nothing inside but darkness and two cyan eyes, over a
 *   dark, rusty suit with a purple scarf and cape and a broad, chipped sword held low.
 * Proportions: the knight's joints (shoulders 0.385, belt 0.25, knees 0.12); the helm from 0.48
 *   to 0.94 (half-width 0.24), its brass band at 0.73, the eyes at 0.67, the face plate below.
 * Shape language: round and heavy (helm dome, pauldrons, knee cops, sabatons), with sharp accents
 *   for menace (claw fingers, the sword, the torn cape).
 * Palette (60/30/10): dark tarnished steel #6b7079 with rust; purple cloth #5a3a7a; tarnished
 *   brass #a8864a; the glowing cyan eyes #3ff0e0 as the accent on black #0b0d12.
 * Value plan: the cyan eyes on the black visor are the strongest contrast (focal point); the
 *   purple scarf under the helm is the second.
 * Bodies: void, eyes, helm, face-plate, cheek-plates, brass, rivets, plume-cloth, scarf, cape, tabard, cuirass, mail,
 *   pauldrons, gauntlets, belt, legs, greaves, sword, hilt, grip.
 * Rig: the knight's skeleton with `cloak` and `plume`; the sword rigid on `hand.R`. Clips: idle
 *   (the helm and hands drift, loose on nothing), walk, run, attack (a diagonal slash), awaken
 *   (the spawn: an empty display piece rattles, its eyes light, and it rises into the rest pose).
 */

const C = {
  steel: '#6b7079',
  steelDark: '#4c5159',
  rust: '#8a4e2e',
  brass: '#a8864a',
  rivet: '#9aa0a8',
  mail: '#4a4f56',
  void: '#0b0d12',
  eye: '#3ff0e0',
  purple: '#5a3a7a',
  purpleDark: '#3e2656',
  cape: '#3a2656',
  capeDark: '#221433',
  leather: '#3a2a22',
  blade: '#4c525a',
  bladeEdge: '#7a8088',
  bladeFuller: '#3a3f46',
};

type V3 = readonly [number, number, number];

const pair = (s: sdf.Shape) => s.mirror('x');
const hard = (s: sdf.Shape) => s.mirror('x', 0);
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};
const along = (p: V3, d: V3, s: number): V3 => [p[0] + d[0] * s, p[1] + d[1] * s, p[2] + d[2] * s];
/** Turns local +Y toward `d` (rotateZ, then rotateX) and moves the origin to `p`. */
const alignY = (s: sdf.Shape, d: V3, p: V3) => {
  const n = norm(d);
  return s
    .rotateZ((Math.asin(-n[0]) * 180) / Math.PI)
    .rotateX((Math.atan2(n[2], n[1]) * 180) / Math.PI)
    .at(...p);
};

/**
 * Rust and wear on dark steel: fine rust specks that gather in patches, thin light scratches, and
 * a few worn, brighter spots. Fine enough to read as texture, not as blotches.
 * `heavy` (0 to 1) adds a second, lower-frequency noise that gathers the specks into larger rust
 * patches with a faint rust stain around them. Where that noise is low, the steel stays clean, so
 * the dark steel stays the main value (about 7 % rust, 7 % half rust, 9 % stain on the helm dome).
 */
type Rgb = readonly [number, number, number];
const RUST: Rgb = [0.46, 0.25, 0.14];
const toRust = (base: Rgb, t: number): Rgb => [base[0] * (1 - t) + RUST[0] * t, base[1] * (1 - t) + RUST[1] * t, base[2] * (1 - t) + RUST[2] * t];
const wear =
  (heavy: number) =>
  (x: number, y: number, z: number, base: Rgb): Rgb => {
    const patch = noise.fbm(x * 7, y * 7, z * 7, 2);
    const speck = noise.fbm(x * 70, y * 70, z * 70, 2);
    const gather = heavy * Math.max(0, noise.fbm(x * 4.5 + 7.3, y * 4.5, z * 4.5 - 3.1, 2) + 0.08);
    const v = speck + patch * 0.6 + gather * 1.3;
    if (v > 0.72) return RUST;
    if (v > 0.56) return toRust(base, 0.35);
    // Scratches: thin lines on a slant, only in some places.
    const sc = Math.abs(Math.sin(x * 150 + y * 90 - z * 60 + noise.fbm(x * 12, y * 12, z * 12, 2) * 4));
    if (sc > 0.994 - 0.003 * heavy && patch < 0.1 + 0.15 * heavy) return [base[0] * 1.35, base[1] * 1.35, base[2] * 1.35];
    // A faint, dark rust stain around the patches (tarnish, not bright orange).
    if (gather > 0.18 && patch > 0) {
      const c = toRust(base, 0.16);
      return [c[0] * 0.88, c[1] * 0.88, c[2] * 0.88];
    }
    if (patch < -0.42) return [base[0] * 1.12, base[1] * 1.12, base[2] * 1.12];
    return base;
  };
const rusty = wear(0);
const rustMid = wear(0.6);
const rustHeavy = wear(1);
const dents = (x: number, y: number, z: number) => 0.001 * noise.fbm(x * 40, y * 40, z * 40, 2);

// Joints (the knight's shoulders and legs). The right forearm points forward and holds the sword
// low across the body; the left hand is an open claw held out to the side.
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW_R: V3 = [-0.2, 0.33, 0.0];
const WRIST_R: V3 = [-0.215, 0.29, 0.1];
const ELBOW_L: V3 = [0.19, 0.33, 0.0];
const WRIST_L: V3 = [0.24, 0.29, 0.075];
const HIP: V3 = [0.068, 0.195, 0];
const ANKLE: V3 = [0.098, 0.07, 0];
const KNEE: V3 = [0.083, 0.1325, 0]; // the knee: splits the leg (shin.L takes the weight below it)
// The ends of the flat bottom of the left sabaton (y = 0), measured on the SDF: heel and toe.
const HEEL: V3 = [0.096, 0, -0.013];
const TOE: V3 = [0.111, 0, 0.095];

// The sword: its grip center is inside the right fist; the blade runs across the body, down to
// the left and forward.
const FIST_R = along(WRIST_R, norm(sub(WRIST_R, ELBOW_R)), 0.045);
const BLADE_DIR = norm([0.8, -0.45, 0.4]);
const swordPose = (s: sdf.Shape) => alignY(s, [-BLADE_DIR[0], -BLADE_DIR[1], -BLADE_DIR[2]], FIST_R);

export default defineAsset({
  name: 'animated-armor',
  description: 'Chibi animated armor dungeon enemy: an empty, rusty suit of plate with a huge round great helm, black inside with two glowing cyan eyes, a purple scarf and cape, and a broad chipped sword.',
  detail: 0.005,
  reference: 'docs/enemy-mockups/animated-armor_001.jpg',

  build(k) {
    const HELM_C: V3 = [0, 0.685, -0.01];
    const PLUME_AT: V3 = [0, 0.935, -0.01];
    k.skeleton({
      hips: { at: [0, 0.2, 0] },
      spine: { parent: 'hips', at: [0, 0.26, 0] },
      chest: { parent: 'spine', at: [0, 0.33, 0] },
      neck: { parent: 'chest', at: [0, 0.43, -0.01] },
      head: { parent: 'neck', at: [0, 0.48, -0.01] },
      plume: { parent: 'head', at: PLUME_AT, tail: [0.02, 1.05, -0.03] },
      cloak: { parent: 'chest', at: [0, 0.41, -0.13] },
      // The eye glow on its own bone, so the death can put it out; the sword on its own bone, so
      // it can fall from the hand.
      glow: { parent: 'head', at: [0, 0.678, 0.17] },
      weapon: { parent: 'hand.R', at: FIST_R },
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

    // ------------------------------------------------------------------ great helm: a dome with a black visor opening
    // A tall kettle helm: a dome over nearly straight sides (the ellipsoid stretched in the middle).
    const helmOuter = sdf.ellipsoid([0.24, 0.215, 0.235]).elongate(0, 0.045, 0).at(...HELM_C);
    const helmInner = sdf.ellipsoid([0.222, 0.197, 0.217]).elongate(0, 0.045, 0).at(...HELM_C);
    const helmBottom = sdf.halfSpace([0, -1, 0], -0.48);
    const BAND_Y = 0.735;
    const PLATE_TOP = 0.632;
    // The visor: a wide dark window across the front between the brass band and the face plate.
    const visor = sdf
      .extrude(
        profile.polygon(
          [
            [-0.175, BAND_Y - 0.018],
            [0.175, BAND_Y - 0.018],
            [0.19, 0.68],
            [0.182, PLATE_TOP + 0.01],
            [-0.182, PLATE_TOP + 0.01],
            [-0.19, 0.68],
          ],
          { smooth: true, samples: 4 },
        ),
        0.5,
        0.008,
      )
      .at(0, 0, 0.27);
    const helm = helmOuter
      .subtract(helmInner)
      .smoothSubtract(0.006, visor)
      .intersect(helmBottom)
      .paintWhere(helmInner.round(0.005), C.steelDark, 0.01)
      .paintFn(rustHeavy);
    k.body('helm', helm, { color: C.steel, roughness: 0.5, metalness: 0.75, bone: 'head', bump: dents });

    // Nothing inside: a black void fills the helm, with two glowing eyes on it.
    const voidShape = sdf.ellipsoid([0.2, 0.17, 0.19]).elongate(0, 0.04, 0).at(HELM_C[0], HELM_C[1] - 0.01, HELM_C[2] + 0.005).intersect(helmBottom);
    k.body('void', voidShape.bone('head'), { color: C.void, roughness: 1 });
    const EYE_Y = 0.678;
    const eyeZ = (x: number) => sdf.raycast(voidShape, [x, EYE_Y, 1], [0, 0, -1])![2];
    // Oval eyes, tilted a little (inner ends lower): a cold glare.
    const eyes = sdf.union(...[1, -1].map((s) => sdf.ellipsoid([0.036, 0.027, 0.014]).rotateZ(s * 10).at(s * 0.078, EYE_Y, eyeZ(0.078) - 0.004)));
    k.body('eyes', eyes, { color: C.eye, roughness: 0.2, emissive: C.eye, emissiveIntensity: 1.6, bone: 'glow' });

    // The face plate (bevor): a curved plate over the lower front, standing proud of the helm,
    // with a rolled top edge and three pairs of breathing slots.
    const plateRegion = sdf.box([0.44, PLATE_TOP - 0.48, 0.3], 0.006).at(0, (PLATE_TOP + 0.48) / 2, 0.14);
    const plateShell = helmOuter.round(0.014).subtract(helmOuter.round(-0.004)).smoothIntersect(0.006, plateRegion);
    const plateRim = helmOuter
      .round(0.022)
      .subtract(helmOuter.round(0.004))
      .smoothIntersect(0.004, sdf.box([0.44, 0.016, 0.3], 0.006).at(0, PLATE_TOP - 0.006, 0.14));
    // Four pairs of small square breathing holes, as in the mockup.
    const slots = sdf.union(
      ...[-0.126, -0.046, 0.046, 0.126].flatMap((c) => [c - 0.014, c + 0.014].map((x) => sdf.box([0.018, 0.028, 0.4], 0.003).at(x, 0.58, 0.2))),
    );
    const facePlate = sdf
      .smoothUnion(0.006, plateShell, plateRim)
      .intersect(helmBottom)
      .subtract(slots.intersect(sdf.halfSpace([0, 1, 0], 0.61)))
      .paintFn(rustMid);
    k.body('face-plate', facePlate, { color: C.steel, roughness: 0.5, metalness: 0.75, bone: 'head', bump: dents });
    // Hinge plates on the cheeks, beside the visor. They follow the helm at the top and flare out
    // at the bottom (the helm surface pushed out by up to 2.8 cm below y = 0.66). The lower edge
    // stops at y = 0.532, so the plate stays clear of the sword fist's path in the attack.
    const cheekBase = helmOuter.displace(0.028, (_x, y) => {
      const t = Math.min(1, Math.max(0, (0.66 - y) / 0.15));
      return -t * t;
    });
    const cheeks = hard(
      cheekBase
        .round(0.01)
        .subtract(cheekBase.round(-0.004))
        .smoothIntersect(0.006, sdf.box([0.08, 0.188, 0.2], 0.01).rotateY(-40).at(0.2, 0.626, 0.1))
        .intersect(helmBottom),
    ).paintFn(rustMid);
    k.body('cheek-plates', cheeks, { color: C.steel, roughness: 0.5, metalness: 0.75, bone: 'head', bump: dents });

    // Brass: the brow band, a strip over the crown, and a diamond plate at the front.
    const shellOf = (s: sdf.Shape, out: number, inn: number) => s.round(out).subtract(s.round(-inn));
    const band = shellOf(helmOuter, 0.012, 0.012).smoothIntersect(0.005, sdf.box([0.8, 0.042, 0.8], 0.008).at(0, BAND_Y + 0.004, 0));
    const strip = shellOf(helmOuter, 0.012, 0.012)
      .smoothIntersect(0.005, sdf.box([0.052, 0.5, 0.8], 0.008).at(0, 0.98, 0))
      .intersect(sdf.halfSpace([0, -1, 0], -BAND_Y));
    // The brow: a raised brass ridge along the lower edge of the band. It follows the dome over the
    // visor slit, overhangs the slit a little, and turns down at its ends toward the cheek plates.
    const BROW_OUT = 0.024;
    const brow = shellOf(helmOuter, BROW_OUT, 0.004).smoothIntersect(
      0.004,
      sdf
        .extrude(
          profile.polygon([
            [-0.2, BAND_Y - 0.003],
            [0.2, BAND_Y - 0.003],
            [0.208, 0.696],
            [0.19, 0.692],
            [0.178, BAND_Y - 0.026],
            [-0.178, BAND_Y - 0.026],
            [-0.19, 0.692],
            [-0.208, 0.696],
          ]),
          0.3,
          0.004,
        )
        .at(0, 0, 0.27),
    );
    // The diamond and its rivet stand on the brow's front face, which is proud of the band.
    const bandHit = sdf.raycast(band, [0, BAND_Y + 0.004, 1], [0, 0, -1])!;
    const bandFront: V3 = [bandHit[0], bandHit[1], bandHit[2] + BROW_OUT - 0.012];
    const diamond = sdf
      .extrude(
        profile.polygon([
          [0, 0.045],
          [0.042, 0],
          [0, -0.045],
          [-0.042, 0],
        ]),
        0.018,
        0.005,
      )
      .rotateX(-8)
      .at(bandFront[0], bandFront[1], bandFront[2] - 0.002);
    k.body('brass', sdf.union(band, brow, strip, diamond).bone('head'), {
      color: C.brass,
      roughness: 0.45,
      metalness: 0.8,
      bump: dents,
      detail: 0.004,
    });
    // Rivets along the band (above the brow), the strip, the cheek plates, and in the diamond.
    const onBand = Array.from({ length: 12 }, (_, i) => {
      const a = ((i - 5.5) / 5.5) * 150 * (Math.PI / 180);
      const hit = sdf.raycast(band.round(0.001), [Math.sin(a), BAND_Y + 0.01, Math.cos(a) - 0.01], [-Math.sin(a), 0, -Math.cos(a)]);
      return hit && Math.abs(Math.sin(a)) > 0.12 ? sdf.sphere(0.009).at(...hit) : null;
    }).filter((s): s is sdf.Shape => s !== null);
    const onStrip = [0.8, 0.86, 0.91].map((y) => sdf.sphere(0.009).at(...sdf.raycast(strip.round(0.001), [0, y, 1], [0, 0, -1])!));
    const onCheeks = hard(
      sdf.union(...[0.57, 0.64, 0.7].map((y) => sdf.sphere(0.009).at(...sdf.raycast(cheekBase.round(0.011), [1, y, 0.12], [-1, 0, 0])!))),
    );
    k.body('rivets', sdf.union(...onBand, ...onStrip, onCheeks, sdf.sphere(0.01).at(bandFront[0], bandFront[1], bandFront[2] + 0.018)).bone('head'), {
      color: C.rivet,
      roughness: 0.4,
      metalness: 0.8,
      detail: 0.0035,
    });

    // A small twisted purple plume on the crown.
    const plume = sdf
      .smoothUnion(
        0.012,
        sdf.chain(
          [
            [PLUME_AT[0], PLUME_AT[1] - 0.01, PLUME_AT[2], 0.022],
            [0.004, PLUME_AT[1] + 0.05, -0.02, 0.026],
            [0.012, PLUME_AT[1] + 0.1, -0.03, 0.012],
          ],
          0.01,
        ),
        sdf.chain(
          [
            [PLUME_AT[0], PLUME_AT[1], PLUME_AT[2], 0.018],
            [-0.02, PLUME_AT[1] + 0.06, -0.005, 0.018],
            [-0.018, PLUME_AT[1] + 0.09, 0.0, 0.006],
          ],
          0.01,
        ),
      )
      .paintFn((x, y, z, base) => (Math.sin(Math.atan2(z + 0.01, x) * 5 + y * 90) > 0.5 ? [base[0] * 0.75, base[1] * 0.75, base[2] * 0.75] : base));
    k.body('plume-cloth', plume, { color: C.purple, roughness: 0.85, detail: 0.004, bone: 'plume' });

    // ------------------------------------------------------------------ torso: cuirass and mail (the knight's)
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
            [0.138, 0.2],
            [0.14, 0.165],
            [0.132, 0.152],
            [0, 0.152],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.78]);
    const ridge = sdf.capsule([0, 0.43, 0.105], [0, 0.29, 0.112], 0.014).scale([0.8, 1, 1]);
    // Two lames across the lower breastplate.
    const lames = sdf.union(
      ...[0.3, 0.272].map((y) => torso.round(0.02).subtract(torso.round(0.01)).smoothIntersect(0.004, sdf.box([0.5, 0.022, 0.5], 0.006).at(0, y, 0))),
    );
    const cuirass = torso
      .round(0.014)
      .smoothUnion(0.02, ridge)
      .smoothUnion(0.004, lames)
      .intersect(sdf.halfSpace([0, -1, 0], -0.258))
      .intersect(sdf.halfSpace([0, 1, 0], 0.47))
      .paintFn(rusty);
    k.body('cuirass', cuirass, { color: C.steel, roughness: 0.5, metalness: 0.75, bone: 'chest', bump: dents });
    const rings = (x: number, y: number, z: number) => {
      const u = Math.atan2(z, x) * 30;
      const v = y * 190 + (Math.floor(u / Math.PI) % 2) * Math.PI * 0.5;
      return 0.0012 * Math.abs(Math.sin(u)) * Math.abs(Math.sin(v));
    };
    const skirt = torso.round(0.006).smoothIntersect(0.006, sdf.box([0.5, 0.086, 0.5], 0.01).at(0, 0.219, 0));
    const sleeve = (s: V3, e: V3, tag: string) => sdf.cone(s, lerp(s, e, 1.12), 0.046, 0.043).bone(tag);
    const leggings = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.112, 0.05, 0.084]).at(0, 0.2, 0).bone('hips'),
      pair(sdf.capsule([HIP[0], 0.2, 0], [0.095, 0.1, 0.004], 0.046).bone('leg.L')),
    );
    k.body(
      'mail',
      sdf.union(skirt.bone('hips'), sleeve(SHOULDER, ELBOW_L, 'upperarm.L'), sleeve(mx(SHOULDER), ELBOW_R, 'upperarm.R'), leggings),
      { color: C.mail, roughness: 0.55, metalness: 0.7, bump: rings },
    );

    // ------------------------------------------------------------------ pauldrons: two riveted lames each
    const lame = (s: number) =>
      sdf
        .ellipsoid([0.1 * s, 0.066 * s, 0.096 * s])
        .intersect(sdf.halfSpace([0, -1, 0], 0.016 * s))
        .round(0.003);
    const pauldronPose = (s: sdf.Shape) => s.rotateZ(-26).at(0.162, 0.436, 0);
    const pauldronLocal = sdf.union(lame(1.06), lame(1.2).at(0, -0.036, 0));
    k.body('pauldrons', pair(pauldronPose(pauldronLocal).bone('upperarm.L')).paintFn(rustHeavy), {
      color: C.steel,
      roughness: 0.5,
      metalness: 0.75,
      bump: dents,
    });
    const pauldronRivets = pair(
      pauldronPose(sdf.union(...[-50, -15, 20, 55].map((a) => sdf.sphere(0.009).at(0.108 * Math.sin((a * Math.PI) / 180) * 1.2, -0.034, 0.1 * Math.cos((a * Math.PI) / 180) * 1.2)))).bone('upperarm.L'),
    );

    // ------------------------------------------------------------------ gauntlets: vambraces, a sword fist, and an open claw
    const vambrace = (e: V3, w: V3) => sdf.cone(lerp(e, w, 0.15), lerp(e, w, 1.02), 0.042, 0.05).round(0.003);
    // The right fist is built around the sword grip, in the sword's frame (grip along Y).
    const fistLocal = sdf.smoothUnion(
      0.012,
      sdf.ellipsoid([0.044, 0.05, 0.046]).at(0.004, 0, -0.004),
      sdf.capsule([-0.012, 0.03, 0.036], [-0.012, -0.03, 0.036], 0.018), // the finger roll
      sdf.cone([0.03, 0.024, 0.014], [0.012, 0.03, 0.044], 0.016, 0.013), // the thumb over the grip
    );
    // The left hand: an open claw with pointed finger plates, reaching forward.
    const dirL = norm(sub(WRIST_L, ELBOW_L));
    const clawL = (() => {
      const palm = along(WRIST_L, dirL, 0.035);
      const fingers = [-0.024, -0.008, 0.008, 0.024].map((dz, i) => {
        const root: V3 = [palm[0] + 0.012, palm[1] - 0.012, palm[2] + dz];
        const mid: V3 = [root[0] + 0.022, root[1] - 0.03, root[2] + 0.016 + dz * 0.2];
        const tip: V3 = [mid[0] + 0.004, mid[1] - 0.032, mid[2] + 0.018];
        return sdf.chain(
          [
            [...root, 0.012],
            [...mid, 0.011],
            [...tip, i === 0 ? 0.003 : 0.003],
          ],
          0.004,
        );
      });
      const thumb = sdf.chain(
        [
          [palm[0] - 0.02, palm[1] - 0.01, palm[2] + 0.03, 0.012],
          [palm[0] - 0.024, palm[1] - 0.04, palm[2] + 0.05, 0.003],
        ],
        0.004,
      );
      return sdf.smoothUnion(0.01, sdf.ellipsoid([0.034, 0.03, 0.04]).at(...palm), ...fingers, thumb);
    })();
    const gauntlets = sdf
      .union(
        sdf.smoothUnion(0.012, vambrace(ELBOW_L, WRIST_L).bone('forearm.L'), clawL.bone('hand.L')),
        sdf.smoothUnion(0.012, vambrace(ELBOW_R, WRIST_R).bone('forearm.R'), swordPose(fistLocal).bone('hand.R')),
      )
      .paintFn(rusty);
    k.body('gauntlets', gauntlets, { color: C.steel, roughness: 0.5, metalness: 0.75, bump: dents });

    // ------------------------------------------------------------------ belt, tassets, torn tabard
    const beltY = 0.252;
    const belt = cuirass.round(0.004).smoothIntersect(0.005, sdf.box([0.5, 0.04, 0.5], 0.006).at(0, beltY, 0));
    k.body('belt', belt.bone('spine'), { color: C.leather, roughness: 0.65 });
    const beltRivets = sdf.union(
      ...[-60, -30, 0, 30, 60].map((a) => {
        const r = (a * Math.PI) / 180;
        return sdf.sphere(0.009).at(...sdf.surfacePoint(belt, [Math.sin(r) * 0.3, beltY, Math.cos(r) * 0.3], 0.001));
      }),
    );
    const hipShell = torso.round(0.02).subtract(torso.round(0.004));
    const tassetL = hipShell.smoothIntersect(0.008, sdf.box([0.1, 0.1, 0.3], 0.02).rotateZ(10).at(0.105, 0.19, 0.08)).bone('leg.L');
    k.body('tassets', pair(tassetL).paintFn(rusty), { color: C.steel, roughness: 0.5, metalness: 0.75, bump: dents });
    const flapL = sdf
      .extrude(
        profile.polygon([
          [0.002, 0.262],
          [0.062, 0.262],
          [0.074, 0.11],
          [0.058, 0.086],
          [0.046, 0.108],
          [0.03, 0.078],
          [0.016, 0.1],
          [0.003, 0.084],
        ]),
        0.014,
        0.005,
      )
      .rotateX(-8)
      .at(0, 0, 0.128);
    k.body('tabard', pair(flapL.bone('leg.L')).paintWhere(sdf.halfSpace([0, 1, 0], 0.13), C.purpleDark, 0.03), { color: C.purple, roughness: 0.85 });

    // ------------------------------------------------------------------ scarf and torn cape (the knight's, in purple)
    const scarfRing = sdf
      .revolve(
        profile.polygon(
          [
            [0.05, 0.51],
            [0.1, 0.502],
            [0.14, 0.476],
            [0.152, 0.446],
            [0.128, 0.43],
            [0.09, 0.452],
            [0.05, 0.47],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.92]);
    const drape = cuirass
      .round(0.012)
      .subtract(cuirass.round(-0.002))
      .intersect(
        sdf
          .extrude(
            profile.polygon([
              [-0.12, 0.47],
              [0.12, 0.47],
              [0.03, 0.38],
              [0, 0.37],
              [-0.03, 0.385],
            ]),
            0.4,
          )
          .at(0, 0, 0.2),
      );
    const scarf = sdf
      .smoothUnion(0.012, scarfRing, drape)
      .paintFn((x, y, z, base) => (Math.sin(Math.atan2(z, x) * 9 + y * 60) > 0.75 ? [base[0] * 0.8, base[1] * 0.8, base[2] * 0.8] : base));
    k.body('scarf', scarf, { color: C.purple, roughness: 0.85, bone: 'chest' });
    const folds = (x: number, y: number, z: number) => Math.sin(Math.atan2(z, x) * 6) * Math.min(1, Math.max(0, (0.4 - y) / 0.26));
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
    const tears = sdf.union(
      ...Array.from({ length: 7 }, (_, i) => {
        const a = -70 + i * 23 + (noise.random(i, 4, 1) - 0.5) * 10;
        const h = 0.05 + noise.random(i, 4, 2) * 0.05;
        return sdf
          .extrude(
            profile.polygon([
              [-0.03, 0.05],
              [0.03, 0.05],
              [0, 0.09 + h],
            ]),
            0.8,
          )
          .rotateY(180 + a);
      }),
    );
    const cape = capeCone(0.19, 0.285, 0.44, 0.07)
      .subtract(capeCone(0.168, 0.263, 0.46, 0.05))
      .at(0, 0, -0.025)
      .intersect(sdf.halfSpace([0, 0, 1], -0.02))
      .subtract(tears)
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.14), C.capeDark, 0.05);
    k.body('cape', cape.bone('cloak'), { color: C.cape, roughness: 0.88 });

    // ------------------------------------------------------------------ legs: knee cops, greaves, sabatons (the knight's)
    const knee = sdf.ellipsoid([0.058, 0.034, 0.052]).at(0.095, 0.11, 0.022).bone('leg.L');
    const greave = sdf.cone([0.096, 0.098, 0.006], [0.098, 0.06, 0.004], 0.05, 0.054).bone('leg.L');
    const sabatonFoot = sdf
      .smoothUnion(0.03, sdf.cylinder(0.054, 0.06, 0.02).at(0, 0.05, 0), sdf.ellipsoid([0.062, 0.052, 0.108]).at(0, 0.046, 0.045))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const toeLines = sdf.union(
      sdf.box([0.2, 0.006, 0.2]).rotateX(-30).at(0, 0.075, 0.06),
      sdf.box([0.2, 0.006, 0.2]).rotateX(-40).at(0, 0.058, 0.1),
    );
    const sabaton = sabatonFoot
      .smoothSubtract(0.003, toeLines.intersect(sdf.halfSpace([0, 0, -1], -0.04)))
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.012), C.steelDark)
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('greaves', pair(sdf.union(sdf.smoothUnion(0.01, greave, knee), sabaton)).paintFn(rusty), {
      color: C.steel,
      roughness: 0.5,
      metalness: 0.75,
      bump: dents,
    });
    k.body('trim-rivets', sdf.union(pauldronRivets, beltRivets.bone('spine')), { color: C.rivet, roughness: 0.4, metalness: 0.8, detail: 0.0035 });

    // ------------------------------------------------------------------ broad, chipped sword in the right fist
    // Local frame: the grip center at the origin, the blade toward -Y, the flat facing +Z.
    const BW = 0.078;
    const chip = (y: number, side: 1 | -1, r: number) => sdf.sphere(r).at((side * BW) / 2, y, 0);
    const bladeLocal = sdf
      .extrude(
        profile.polygon([
          [-BW / 2, -0.07],
          [BW / 2, -0.07],
          [BW / 2 - 0.004, -0.46],
          [0, -0.52],
          [-BW / 2 + 0.004, -0.46],
        ]),
        0.018,
        0.004,
      )
      .subtract(sdf.box([0.018, 0.03, 0.1], 0.003).at(0, -0.1, 0)) // the square hole below the guard
      .subtract(chip(-0.24, 1, 0.012), chip(-0.33, -1, 0.01), chip(-0.4, 1, 0.009))
      .paintWhere(sdf.box([0.2, 1, 0.2]).at(0, -0.3, 0).subtract(sdf.box([BW - 0.022, 1, 0.3]).at(0, -0.3, 0)), C.bladeEdge, 0.004)
      .paintWhere(sdf.box([0.012, 0.34, 0.3], 0.004).at(0, -0.29, 0), C.bladeFuller, 0.004) // a dark fuller down the middle
      .paintFn(rusty);
    k.body('sword', swordPose(bladeLocal), {
      color: C.blade,
      roughness: 0.5,
      metalness: 0.65,
      detail: 0.0035,
      bone: 'weapon',
      bump: dents,
    });
    const guard = sdf.box([0.15, 0.022, 0.03], 0.009).at(0, -0.082, 0);
    const pommel = sdf.cylinder(0.024, 0.02, 0.007).rotateX(90).at(0, 0.098, 0);
    k.body('hilt', swordPose(sdf.union(guard, pommel)), { color: C.brass, roughness: 0.45, metalness: 0.8, detail: 0.004, bone: 'weapon' });
    k.body('grip', swordPose(sdf.cylinder(0.016, 0.18, 0.004).at(0, 0.006, 0)), { color: C.leather, roughness: 0.75, detail: 0.004, bone: 'weapon' });

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop } = motion;
    const LEG = 0.19;

    // Idle: nothing holds the pieces together, so the helm and the hands drift a little on their own.
    // (The awaken clip blends this drift in at its end, so the pose is a function.)
    const IDLE = 2.6;
    const idlePose = (p: number): Record<string, { move?: V3; rotate?: V3 }> => ({
      hips: { move: [0, -0.003 * bump(p), 0] },
      chest: { rotate: [2 * wave(p), 0, 0] },
      head: { move: [0, 0.012 * wave(p, 1, 0.2), 0], rotate: [3 * wave(p, 1, 0.35), 6 * wave(p, 1, 0.1), 3 * wave(p, 2, 0.2)] },
      plume: { rotate: [4 * wave(p, 1, 0.4), 0, 4 * wave(p, 1, 0.3)] },
      cloak: { rotate: [3 * wave(p, 1, 0.3), 0, 0] },
      'hand.L': { move: [0.006 * wave(p, 1, 0.5), 0.008 * wave(p, 1, 0.1), 0], rotate: [8 * wave(p, 1, 0.3), 0, 0] },
      'hand.R': { move: [0, 0.005 * wave(p, 1, 0.6), 0] },
      'upperarm.L': { rotate: [3 * wave(p, 1, 0.1), 0, 2 * bump(p)] },
    });
    k.animation('idle', { duration: IDLE, pose: (_t, p) => idlePose(p) });

    // A heavy, clanking stride: the helm lags each step and settles late.
    // `carry` (the run): the forward lean and the deep steps put a low blade into the floor, so the
    // fist comes up to the belt and the blade turns back and up to a flatter line across the front.
    const CARRY_WRIST: V3 = [-0.23, 0.345, 0.11];
    const CARRY_BLADE = norm([0.86, -0.2, 0.36]);
    const carryArm = motion.reach({ root: mx(SHOULDER), mid: ELBOW_R, end: WRIST_R }, CARRY_WRIST, [-0.6, 0, -0.2]);
    const carryHand = motion.orient([carryArm.upper, carryArm.lower], { dir: BLADE_DIR, up: norm([0, 0.66, 0.75]) }, { dir: CARRY_BLADE, up: norm([0, 0.66, 0.75]) });
    // The legs come from motion.gait: planted stance sabatons, a knee lift in the swing, heel strike
    // and toe-off. `step` is the foot travel, `footLift` the swing height, `duty` the share of the
    // cycle a foot is down (the run has a flight between steps), `bob` the hips bob. The gait phase
    // runs a quarter cycle behind the clip, so the left heel strikes at p = 0.25, when the left arm
    // is back. The hips' sway goes to gait, so the planted feet do not slide.
    const SWORD_RAISE = 10;
    const stride = (
      duration: number,
      step: number,
      footLift: number,
      duty: number,
      bob: number,
      armSwing: number,
      lean: number,
      flow: number,
      carry = false,
    ) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        const hipsTurn = [0, 7 * s, 0] as const;
        const legs = motion.gait(p - 0.25, { hip: HIP, knee: KNEE, ankle: ANKLE }, {
          stride: step,
          lift: footLift,
          duty,
          bob,
          roll: 8,
          heel: HEEL,
          toe: TOE,
          hips: { at: [0, 0.2, 0], rotate: hipsTurn },
        });
        // The sword arm: a small swing about the shoulder on top of the carry. In the walk the arm
        // is raised a little: the lean and the back swing put the low blade tip into the floor,
        // and the planted feet no longer lift the body clear of it.
        const swingR = motion.euler(motion.quat([-3 * s, 0, -2]).multiply(motion.quat(carryArm.upper)));
        const armR = carry
          ? {
              'upperarm.R': { rotate: swingR },
              'forearm.R': { rotate: carryArm.lower },
              'hand.R': { rotate: carryHand },
            }
          : { 'upperarm.R': { rotate: [-armSwing * 0.2 * s - SWORD_RAISE, 0, -4] as const } };
        return {
          ...legs.pose,
          hips: { move: [0, legs.hipsY, 0] as const, rotate: hipsTurn },
          spine: { rotate: [lean, 0, 0] as const },
          chest: { rotate: [lean * 0.5, -8 * s, 0] as const },
          head: { move: [0, 0.008 * bump(p, 2, 0.35), 0] as const, rotate: [-lean + 3 * wave(p, 2, 0.35), 5 * s, 2 * wave(p, 1, 0.3)] as const },
          plume: { rotate: [flow * 0.5 + 5 * wave(p, 2, 0.2), 0, 4 * wave(p, 2, 0.1)] as const },
          cloak: { rotate: [flow + 4 * wave(p, 2, 0.15), 0, 3 * s] as const },
          'upperarm.L': { rotate: [armSwing * 0.6 * s, 0, 4] as const },
          'forearm.L': { rotate: [-armSwing * 0.3 * Math.max(0, -s), 0, 0] as const },
          ...armR,
        };
      },
    });
    // A heavy, clanking suit: short steps, a low swing, long stances.
    k.animation('walk', stride(1.0, 0.09, 0.02, 0.64, 0.005, 24, 3, 6));
    k.animation('run', stride(0.62, 0.13, 0.035, 0.44, 0.02, 40, 10, 20, true));

    // A diagonal slash, solved by targets. The wrist follows keys in the chest's rest frame
    // (reach); the blade follows its own keys. The chibi arm is short and the helm is huge, so the
    // path goes around the helm: in the backswing the arm goes straight out to the side, below the
    // cheek plate, and the blade stands up beside the helm (the tip shows in the front view); the
    // blade comes forward on the right, pointing up and out, then sweeps down and across the front
    // below the helm's rim to the low left. edgeUp turns the flat so the edge leads.
    const { keys, reach, orient, edgeUp } = motion;
    const ARM_R = { root: mx(SHOULDER), mid: ELBOW_R, end: WRIST_R };
    const ARM_L = { root: SHOULDER, mid: ELBOW_L, end: WRIST_L };
    const FLAT = norm([0, 0.66, 0.75]); // the blade's flat normal at rest (from swordPose)
    const bladeKeys = [
      [0, BLADE_DIR],
      [0.12, norm([0.1, -0.5, 0.86])], // down in front, the tip clear of the floor
      [0.22, norm([-0.9, 0.1, 0.35])], // out to the right
      [0.32, norm([-0.6, 0.74, -0.2])], // up and out, the tip beside the helm in the front view
      [0.4, norm([-0.62, 0.76, -0.14])], // the hold at the top: the tip at the helm's crown height
      [0.45, norm([-0.55, 0.55, 0.62])], // comes forward on the right, up and out
      [0.49, norm([-0.2, 0.2, 0.96])], // level, pointing forward, under the helm's rim
      [0.53, norm([0.55, -0.2, 0.8])], // sweeping across the front to the left
      [0.58, norm([0.82, -0.36, 0.44])], // low left, past the rest pose
      [1, BLADE_DIR],
    ] as const;
    const bladeAt = (p: number) => keys(p, bladeKeys, 'spline');
    const ease = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    k.animation('attack', {
      duration: 0.95,
      loop: false,
      pose: (_t, p) => {
        const wrist = keys(
          p,
          [
            [0, WRIST_R],
            [0.12, [-0.24, 0.3, 0.06]],
            [0.22, [-0.3, 0.39, -0.01]],
            [0.32, [-0.31, 0.44, -0.02]], // the arm straight out to the side, below the cheek plate
            [0.4, [-0.316, 0.45, -0.028]],
            [0.45, [-0.31, 0.43, 0.06]],
            [0.49, [-0.2, 0.39, 0.17]],
            [0.53, [-0.19, 0.36, 0.2]],
            [0.58, [-0.2, 0.32, 0.2]],
            [0.7, [-0.21, 0.31, 0.19]],
            [1, WRIST_R],
          ] as const,
          'spline',
        );
        const dir = norm(bladeAt(p));
        // The elbow points out to the side in the wind-up, then out and forward through the cut, so
        // the forearm stays in front of the breastplate.
        const pole = keys(p, [[0, [-0.6, 0.1, -0.2]], [0.3, [-0.8, 0.25, -0.1]], [0.45, [-0.8, 0.25, -0.05]], [0.52, [-0.9, 0.05, 0.3]], [0.8, [-0.9, 0.05, 0.3]], [1, [-0.6, 0.1, -0.2]]] as const);
        const arm = reach(ARM_R, wrist, pole);
        const hand = orient([arm.upper, arm.lower], { dir: BLADE_DIR, up: FLAT }, { dir, up: edgeUp(bladeAt, p, FLAT) });
        const wind = ease(0, 0.32, p) * (1 - ease(0.42, 0.5, p));
        const cut = ease(0.43, 0.56, p) * (1 - ease(0.7, 1, p));
        return {
          hips: { move: [0, -legDrop(LEG, 14 * cut) - 0.006 * wind, 0.03 * cut - 0.01 * wind], rotate: [0, -12 * wind + 16 * cut, 0] },
          spine: { rotate: [-4 * wind + 10 * cut, 0, 0] },
          chest: { rotate: [-3 * wind + 4 * cut, -18 * wind + 22 * cut, 0] },
          head: { rotate: [-3 * wind + 4 * cut, 14 * wind - 16 * cut, 0] },
          plume: { rotate: [-8 * wind + 14 * cut, 0, 0] },
          'upperarm.R': { rotate: arm.upper },
          'forearm.R': { rotate: arm.lower },
          'hand.R': { rotate: hand },
          // The empty left claw swings back for balance, then forward.
          'upperarm.L': { rotate: [18 * wind - 14 * cut, 0, 10 * wind] },
          'leg.L': { rotate: [4 * wind - 20 * cut, 0, 0] },
          'leg.R': { rotate: [-4 * wind + 12 * cut, 0, 0] },
          'foot.L': { rotate: [12 * cut, 0, 0] },
          cloak: { rotate: [6 * cut, 0, 0] },
        };
      },
    });

    // Hit: the blow knocks the loose helm up and back off the collar; it clanks down again.
    k.animation('hit', {
      duration: 0.42,
      loop: false,
      pose: (_t, p) => {
        const r = keys(p, [[0, 0], [0.15, 1], [0.36, 0.7], [1, 0]] as const);
        const pop = keys(p, [[0, 0], [0.12, 1], [0.34, 0], [0.44, 0.3], [0.56, 0], [1, 0]] as const);
        const back = -0.022 * r;
        const legL = (Math.atan2(back, 0.19) * 180) / Math.PI;
        return {
          hips: { move: [0, -legDrop(LEG, 12 * r), back], rotate: [0, 6 * r, 0] },
          spine: { rotate: [-7 * r, 0, 3 * r] },
          chest: { rotate: [-8 * r, 8 * r, 0] },
          head: { move: [0, 0.035 * pop, -0.015 * pop], rotate: [-14 * r, -10 * r, 7 * pop] },
          plume: { rotate: [16 * r, 0, -8 * r] },
          glow: { scale: [1 + 0.3 * r, 1 + 0.3 * r, 1] },
          cloak: { rotate: [6 * r, 0, 0] },
          'hand.R': { rotate: [-8 * r, 0, 0] },
          'upperarm.L': { rotate: [12 * r, 0, 24 * r] },
          'forearm.L': { rotate: [-18 * r, 0, 0] },
          'upperarm.R': { rotate: [10 * r, 0, -14 * r] },
          'hand.L': { move: [0.01 * pop, 0.012 * pop, 0] },
          'leg.L': { rotate: [legL, 0, 0] },
          'foot.L': { rotate: [-legL, 0, 0] },
          'leg.R': { rotate: [12 * r, 0, 0] },
          'foot.R': { rotate: [-12 * r, 0, 0] },
        };
      },
    });

    // Death: the eyes flicker, the suit shudders, then it falls apart into a pile of loose armor:
    // the hips drop, the legs splay, the arms fall off to the sides, the helm tumbles off the
    // collar and lands on the ground in front, and the glow goes out. The helm is placed by world
    // targets: its pivot and turn are converted into the neck's posed frame.
    const { quat, euler } = motion;
    const SPINE_AT: V3 = [0, 0.26, 0];
    const CHEST_AT: V3 = [0, 0.33, 0];
    const NECK_AT: V3 = [0, 0.43, -0.01];
    const HEAD_AT: V3 = [0, 0.48, -0.01];
    // Forward kinematics with moves: where a bone's pivot is and how its parent's frame is turned.
    // `joints` are the rest pivots from the root down to the parent, `rots` and `moves` their pose
    // (each move is in its own parent's frame), `child` the rest pivot of the bone to place.
    const fk = (joints: readonly V3[], rots: readonly V3[], moves: readonly V3[], child: V3) => {
      const q = new THREE.Quaternion();
      const pos = new THREE.Vector3(joints[0]![0] + moves[0]![0], joints[0]![1] + moves[0]![1], joints[0]![2] + moves[0]![2]);
      for (let i = 0; i < joints.length; i++) {
        q.multiply(quat(rots[i]!));
        const next = i + 1 < joints.length ? joints[i + 1]! : child;
        const mv = i + 1 < joints.length ? moves[i + 1]! : ([0, 0, 0] as V3);
        pos.add(new THREE.Vector3(next[0] - joints[i]![0] + mv[0], next[1] - joints[i]![1] + mv[1], next[2] - joints[i]![2] + mv[2]).applyQuaternion(q));
      }
      return { at: [pos.x, pos.y, pos.z] as V3, q };
    };
    // The pose (move, rotate) that puts a bone's pivot at `want` with the world turn `turn`,
    // blended from its attached pose (`attached`, local) by `loose` (0 attached, 1 free).
    const release = (frame: { at: V3; q: THREE.Quaternion }, attached: THREE.Quaternion, want: V3, turn: THREE.Quaternion, loose: number, lift = 0) => {
      const inv = frame.q.clone().invert();
      const w: V3 = [
        frame.at[0] + (want[0] - frame.at[0]) * loose,
        frame.at[1] + lift * (1 - loose) + (want[1] - frame.at[1]) * loose,
        frame.at[2] + (want[2] - frame.at[2]) * loose,
      ];
      const d = new THREE.Vector3(w[0] - frame.at[0], w[1] - frame.at[1], w[2] - frame.at[2]).applyQuaternion(inv);
      return { move: [d.x, d.y, d.z] as V3, rotate: euler(inv.multiply(frame.q.clone().multiply(attached).slerp(turn, loose))) };
    };
    const HIPS_AT: V3 = [0, 0.2, 0];
    const CLOAK_AT: V3 = [0, 0.41, -0.13];
    const Z3: V3 = [0, 0, 0];
    // The cape's pivot on the floor behind the pile, and its turn: hanging down becomes lying back.
    const CAPE_DOWN_AT: V3 = [0, 0.018, -0.11];
    const CAPE_FLAT = quat([0, 12, 0]).multiply(quat([90, 0, 0]));
    // The sword lying flat on the ground, pointing forward and a little to the right.
    const SWORD_DOWN = quat(orient([], { dir: BLADE_DIR, up: FLAT }, { dir: norm([-0.35, 0, 0.94]), up: [0, 1, 0] }));
    k.animation('death', {
      duration: 1.5,
      loop: false,
      pose: (_t, p) => {
        const shudder = p > 0.12 && p < 0.36 ? wave((p - 0.12) / 0.24, 5) * Math.sin(((p - 0.12) / 0.24) * Math.PI) : 0;
        const glow = keys(p, [[0, 1], [0.05, 0.35], [0.09, 1], [0.2, 0.9], [0.25, 0.25], [0.3, 0.85], [0.6, 0.7], [0.66, 0.2], [0.7, 0.55], [0.8, 0.02], [1, 0.02]] as const);
        const drop = keys(p, [[0, 0], [0.36, 0], [0.5, 1], [0.55, 0.9], [0.6, 1], [1, 1]] as const);
        const off = keys(p, [[0, 0], [0.4, 0], [0.56, 1], [1, 1]] as const);
        const hipsMove: V3 = [0, -0.135 * drop, -0.03 * drop];
        const hipsR: V3 = [-6 * drop, 12 * drop, 3 * drop + 2 * shudder];
        const spineR: V3 = [keys(p, [[0, 0], [0.1, -8], [0.36, -4], [0.52, 14], [0.6, 18], [1, 18]] as const) + 2 * shudder, 0, 0];
        const chestR: V3 = [keys(p, [[0, 0], [0.1, -6], [0.36, -3], [0.52, 12], [0.62, 16], [1, 16]] as const), 3 * shudder, -5 * drop];
        const neckR: V3 = [0, 0, 0];
        // The helm: on the collar until 0.4 (it lifts a little as the body sinks), then it falls
        // off forward, hits the ground in front at 0.58, bounces, and rolls onto its side.
        const loose = keys(p, [[0, 0], [0.4, 0], [0.58, 1], [1, 1]] as const);
        const frame = fk([HIPS_AT, SPINE_AT, CHEST_AT, NECK_AT], [hipsR, spineR, chestR, neckR], [hipsMove, Z3, Z3, Z3], HEAD_AT);
        const pop = keys(p, [[0, 0], [0.34, 0], [0.4, 0.05], [0.45, 0.06]] as const);
        const attached = quat([keys(p, [[0, 0], [0.1, -14], [0.36, -6], [0.45, 10]] as const), 0, 4 * shudder]);
        const land = keys(p, [[0.4, [0.0, 0.45, 0.06]], [0.5, [0.03, 0.3, 0.24]], [0.58, [0.05, 0.115, 0.32]], [0.64, [0.06, 0.14, 0.34]], [0.72, [0.07, 0.116, 0.36]], [1, [0.07, 0.116, 0.36]]] as const, 'spline');
        const turn = quat(keys(p, [[0.4, [10, 0, 0]], [0.5, [30, 10, -10]], [0.58, [-8, 18, -20]], [0.64, [-14, 20, -14]], [0.72, [-20, 24, -30]], [1, [-20, 25, -31]]] as const));
        const head = release(frame, attached, land, turn, loose, pop);
        // The cape: it flies up behind as the suit drops, slips off the collar, and settles flat on
        // the floor behind the pile (turned flat and squashed thin, as the wizard's cloak does).
        const capeFrame = fk([HIPS_AT, SPINE_AT, CHEST_AT], [hipsR, spineR, chestR], [hipsMove, Z3, Z3], CLOAK_AT);
        const capeAttached = quat([keys(p, [[0, 0], [0.36, -6], [0.42, 16], [0.5, 46], [1, 46]] as const), 0, 0]);
        const capeLoose = keys(p, [[0, 0], [0.46, 0], [0.64, 0.96], [0.68, 1], [1, 1]] as const);
        const flat = keys(p, [[0, 0], [0.5, 0], [0.66, 1], [1, 1]] as const);
        const cloak = { ...release(capeFrame, capeAttached, CAPE_DOWN_AT, CAPE_FLAT, capeLoose), scale: [1 + 0.15 * flat, 1, 1 - 0.88 * flat] as V3 };
        // The sword slips out of the fist as the arm drops and falls flat on the ground at the right.
        const armRMove: V3 = [-0.05 * off, -0.08 * off, -0.02 * off];
        const armRRot: V3 = [keys(p, [[0, 0], [0.1, 10], [0.4, 0], [0.56, 25], [1, 28]] as const), 0, keys(p, [[0, 0], [0.1, -18], [0.4, -8], [0.56, -70], [0.64, -62], [1, -66]] as const)];
        const foreRRot: V3 = [keys(p, [[0, 0], [0.5, 10], [1, 10]] as const), 0, 0];
        const handRRot: V3 = [0, 0, 0];
        const swordFrame = fk([HIPS_AT, SPINE_AT, CHEST_AT, mx(SHOULDER), ELBOW_R, WRIST_R], [hipsR, spineR, chestR, armRRot, foreRRot, handRRot], [hipsMove, Z3, Z3, armRMove, Z3, Z3], FIST_R);
        const swordLoose = keys(p, [[0, 0], [0.36, 0], [0.5, 1], [1, 1]] as const);
        const swordLand = keys(p, [[0.36, [-0.3, 0.2, 0.12]], [0.5, [-0.32, 0.024, 0.14]], [0.55, [-0.32, 0.05, 0.15]], [0.6, [-0.33, 0.024, 0.15]], [1, [-0.33, 0.024, 0.15]]] as const);
        const weapon = release(swordFrame, quat([keys(p, [[0, 0], [0.1, -14], [0.36, -12], [0.44, -30]] as const), 0, 0]), swordLand, SWORD_DOWN, swordLoose);
        return {
          hips: { move: hipsMove, rotate: hipsR },
          spine: { rotate: spineR },
          chest: { rotate: chestR },
          head,
          glow: { scale: [glow, glow, glow] },
          plume: { rotate: [keys(p, [[0, 0], [0.44, -20], [0.6, 30], [0.72, -10], [1, 0]] as const), 0, 0] },
          cloak,
          // The arms come off at the shoulders and fall to the sides.
          'upperarm.L': { move: [0.05 * off, -0.08 * off, -0.02 * off], rotate: [keys(p, [[0, 0], [0.1, 12], [0.4, 0], [0.56, 20], [1, 24]] as const), 0, keys(p, [[0, 0], [0.1, 22], [0.4, 10], [0.56, 72], [0.64, 64], [1, 68]] as const)] },
          'forearm.L': { rotate: [keys(p, [[0, 0], [0.1, -20], [0.5, 10], [1, 12]] as const), 0, 0] },
          'hand.L': { rotate: [keys(p, [[0, 0], [0.5, 0], [0.7, 30], [1, 30]] as const), 0, 0] },
          'upperarm.R': { move: armRMove, rotate: armRRot },
          'forearm.R': { rotate: foreRRot },
          'hand.R': { rotate: handRRot },
          weapon,
          'leg.L': { rotate: [keys(p, [[0, 0], [0.36, 0], [0.54, -24], [1, -26]] as const), 0, keys(p, [[0, 0], [0.36, 0], [0.54, 70], [0.6, 64], [1, 66]] as const)] },
          'leg.R': { rotate: [keys(p, [[0, 0], [0.36, 0], [0.54, -14], [1, -16]] as const), 0, keys(p, [[0, 0], [0.36, 0], [0.54, -72], [0.6, -66], [1, -68]] as const)] },
          'foot.L': { rotate: [keys(p, [[0, 0], [0.4, 0], [0.56, 20], [1, 20]] as const), 0, keys(p, [[0, 0], [0.4, 0], [0.56, -40], [1, -40]] as const)] },
          'foot.R': { rotate: [keys(p, [[0, 0], [0.4, 0], [0.56, 12], [1, 12]] as const), 0, keys(p, [[0, 0], [0.4, 0], [0.56, 40], [1, 40]] as const)] },
        };
      },
    });

    // Awaken (the spawn clip): the suit stands as an empty display piece, the helm low and turned
    // aside, the arms hanging, the sword tip on the floor in front, the eyes out. A rattle runs
    // through the plates (the helm first), the eyes flare up, then the helm lifts and turns to the
    // player, the shoulders rise, the sword comes up into the rest grip, and the idle drift starts
    // (the last frame is the first frame of idle). The blade direction is solved from the posed
    // fist at every frame, so the tip rests on the floor (never in it) until the arm lifts it.
    const AWAKEN = 2.0;
    const HANG_R = reach(ARM_R, [-0.245, 0.232, 0.045], [-0.3, 0.3, -0.4]);
    const HANG_L = reach(ARM_L, [0.245, 0.245, 0.04], [0.3, 0.3, -0.4]);
    const toward = (a: V3, b: V3, t: number) => euler(quat(a).slerp(quat(b), t));
    const addV = (a: V3, b: V3, s = 1): V3 => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
    const rattle = (p: number, a: number, b: number, cycles: number, offset = 0) => {
      if (p <= a || p >= b) return 0;
      const x = (p - a) / (b - a);
      return wave(x, cycles, offset) * Math.sin(x * Math.PI);
    };
    const SWORD_LEN = 0.52; // the grip center to the tip
    const TIP_Y = 0.013; // the tip's center line: the blade's half-thickness above the floor
    const DOWN_DIR = norm([0.3, -0.8, 0.6]); // steeper than the floor allows, so the tip rests on it
    const onFloor = (fist: V3, d: V3): V3 => {
      const minY = (TIP_Y - fist[1]) / SWORD_LEN;
      if (d[1] >= minY) return d;
      const y = Math.max(-1, minY);
      const s = Math.sqrt(1 - y * y) / (Math.hypot(d[0], d[2]) || 1);
      return [d[0] * s, y, d[2] * s];
    };
    const ARM_R_JOINTS: V3[] = [HIPS_AT, SPINE_AT, CHEST_AT, mx(SHOULDER), ELBOW_R, WRIST_R];
    k.animation('awaken', {
      duration: AWAKEN,
      loop: false,
      pose: (t, p) => {
        // The rattle: the helm first, then the plates of the body.
        const helmR = rattle(p, 0.12, 0.3, 4);
        const bodyR = rattle(p, 0.16, 0.34, 4, 0.25);
        const glow = keys(p, [[0, 0.001], [0.3, 0.001], [0.41, 1.3], [0.52, 1]] as const);
        const rise = ease(0.42, 0.64, p); // the slump straightens
        const shoulders = ease(0.46, 0.64, p);
        const lift = ease(0.5, 0.84, p); // the arms and the sword
        const hipsR: V3 = [0, 0, 1.2 * bodyR];
        const spineR: V3 = [4 * (1 - rise), 0, 0];
        const chestR: V3 = [5 * (1 - rise) + 2 * bodyR, 2.5 * bodyR, bodyR];
        const sag: V3 = [0, -0.012 * (1 - shoulders), 0];
        const upR = addV(toward(HANG_R.upper, Z3, lift), [2 * bodyR, 0, -1.5 * bodyR]);
        const loR = toward(HANG_R.lower, Z3, lift);
        const upL = addV(toward(HANG_L.upper, Z3, lift), [-2 * bodyR, 0, 1.5 * bodyR]);
        const loL = toward(HANG_L.lower, Z3, lift);
        // The sword: from the floor in front, up and across into the rest grip.
        const want = norm(keys(p, [[0, DOWN_DIR], [0.5, DOWN_DIR], [0.68, norm([0.3, -0.25, 0.92])], [0.86, BLADE_DIR]] as const, 'spline'));
        const up = norm(keys(p, [[0, [0, 1, 0]], [0.5, [0, 1, 0]], [0.86, FLAT]] as const));
        const parents = [hipsR, spineR, chestR, upR, loR];
        let dir = want;
        for (let i = 0; i < 3; i++) {
          const hand = orient(parents, { dir: BLADE_DIR, up: FLAT }, { dir, up });
          const fist = fk(ARM_R_JOINTS, [...parents, hand], [Z3, Z3, Z3, sag, Z3, Z3], FIST_R).at;
          dir = onFloor(fist, want);
        }
        const handR = orient(parents, { dir: BLADE_DIR, up: FLAT }, { dir, up });
        const pose: Record<string, { move?: V3; rotate?: V3; scale?: V3 }> = {
          hips: { rotate: hipsR },
          spine: { rotate: spineR },
          chest: { rotate: chestR },
          head: {
            move: [0, keys(p, [[0, -0.02], [0.42, -0.02], [0.58, 0.012], [0.72, 0]] as const) + 0.006 * helmR, keys(p, [[0, 0.008], [0.42, 0.008], [0.6, 0]] as const)],
            rotate: [
              keys(p, [[0, 9], [0.42, 9], [0.58, -5], [0.74, 0]] as const) + 4 * helmR,
              keys(p, [[0, -14], [0.46, -14], [0.66, 4], [0.78, 0]] as const),
              keys(p, [[0, 5], [0.42, 5], [0.6, 0]] as const) + 8 * helmR,
            ],
          },
          glow: { scale: [glow, glow, glow] },
          plume: { rotate: [keys(p, [[0, -8], [0.2, -8], [0.5, -4], [0.62, 10], [0.76, -4], [0.9, 0]] as const) + 7 * helmR, 0, 5 * rattle(p, 0.14, 0.32, 3, 0.1)] },
          cloak: { rotate: [keys(p, [[0, 0], [0.45, 0], [0.62, 6], [0.8, 0]] as const) + 2 * bodyR, 0, 0] },
          'upperarm.R': { move: sag, rotate: upR },
          'forearm.R': { rotate: loR },
          'hand.R': { rotate: handR },
          'upperarm.L': { move: sag, rotate: upL },
          'forearm.L': { rotate: loL },
          'hand.L': { move: [0.004 * bodyR, 0.003 * rattle(p, 0.18, 0.34, 5), 0], rotate: [6 * bodyR, 0, 0] },
        };
        // The idle drift fades in; at the last frame the pose is idle's first frame.
        const drift = idlePose((t - AWAKEN) / IDLE);
        const w = ease(0.7, 1, p);
        for (const [bone, v] of Object.entries(drift)) {
          const b = (pose[bone] ??= {});
          if (v.move) b.move = addV(b.move ?? Z3, v.move, w);
          if (v.rotate) b.rotate = addV(b.rotate ?? Z3, v.rotate, w);
        }
        return pose;
      },
    });
  },
});
