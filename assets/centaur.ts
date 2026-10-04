import { motion, noise, profile, sdf } from '../src/index.js';
import type { BonePose } from '../src/index.js';
import { horseAsset, HIPS_AT, SPINE_AT } from './parts/horse-kind.js';

/**
 * Centaur — Chibi Quest monster (catalog `monsters/fey-and-spirit/centaur`), a young centaur archer
 * about 1.3 m tall to the ear tips, faces +Z. Target: docs/monster-mockups/centaur_001.jpg (made
 * with mmx from the horse mockup).
 *
 * The horse of `assets/horse.ts` (body, legs, tail, rig, and clips from `assets/parts/horse-kind.ts`)
 * with `head: false`, and a chibi boy's upper body in the same chestnut coat rising from the horse's
 * chest: a big round head with tall horse ears, big glossy black eyes, thick dark brows, a small pink
 * nose, and a wide smile; messy dark brown hair with a swoop on top and locks down to the shoulders;
 * short arms with round fists. A green saddle blanket with a leather girth covers the horse's back,
 * and a wrap of the same cloth hides the waist. A small golden bow is in the left hand and a golden
 * arrow in the right; the attack draws and looses.
 * Role: a proud archer of the plains and the woods (friend or foe); the big head with horse ears, the
 *   green blanket, and the golden bow read at 128 px.
 * Palette (60/30/10): chestnut #a95f36 coat and skin; dark brown #3a2418 hair, tail, and brows; green
 *   #4e9a48 blanket; gold #e0b040 bow and arrow as the accent.
 * Bodies added: upper (the boy's body in the coat), eyes, hair, strap (with the quiver), blanket,
 * girth, bow-limbs, bowstring, golden-arrow.
 * Bones added: `waist`, `chest`, `face`, `upperarm`, `forearm`, and `hand` (L and R), `bow` (on
 * `hand.L`) with `string.top` and `string.bot`, `arrow` (on `hand.R`). Clips: the horse's walk, run,
 * idle, rear, neigh, hit, and death with poses for the upper body, and an attack (a bow shot).
 */
type V3 = [number, number, number];
const mx = (v: V3): V3 => [-v[0], v[1], v[2]];

const WAIST: V3 = [0, 0.63, 0.15];
const CHEST: V3 = [0, 0.73, 0.16];
const NECK: V3 = [0, 0.83, 0.17];
const HEAD_C: V3 = [0, 1.03, 0.2];
const HEAD_R: V3 = [0.205, 0.19, 0.18];
const SHOULDER: V3 = [0.1, 0.79, 0.155];
const ELBOW: V3 = [0.17, 0.7, 0.19];
const WRIST: V3 = [0.17, 0.66, 0.29];
const FIST: V3 = [0.17, 0.655, 0.315];
const BOW_HALF = 0.15; // grip to tip
const BRACE = 0.05; // the string behind the grip
const BOW_TILT = -10; // the bottom limb forward, clear of the horse's chest
/** A point of the bow's frame (the grip at the origin, the limbs along Y) in the rest pose. */
const bowPt = (y: number, z: number): V3 => {
  const a = (BOW_TILT * Math.PI) / 180;
  return [FIST[0], FIST[1] + y * Math.cos(a) - z * Math.sin(a), FIST[2] + y * Math.sin(a) + z * Math.cos(a)];
};
/** The arrow from its nock behind the right fist to its point. */
const NOCK = 0.04;
const POINT = 0.26;

export default horseAsset({
  name: 'centaur',
  description: 'Chibi centaur monster: a chestnut pony body with a boy upper body in the same coat, a big round head with tall horse ears, big glossy black eyes, thick brows, a small pink nose, a wide smile, messy dark brown hair, a green saddle blanket with a leather girth, and a small golden bow and arrow; horse rig with arm and bow bones.',
  reference: 'docs/monster-mockups/centaur_001.jpg',
  variants: {
    coat: { chestnut: '#a95f36', bay: '#7e4428', dun: '#b99566' },
    mane: { dark: '#3a2418', black: '#221a18', auburn: '#7a3a20' },
    eyes: { black: '#1a1210', brown: '#4a2a18', green: '#2e5a2a' },
    cloth: { green: '#4e9a48', blue: '#3a6aa8', red: '#b0403a' },
  },
  presets: {
    bay: { coat: 'bay', mane: 'black', eyes: 'brown', cloth: 'red' },
    dun: { coat: 'dun', mane: 'auburn', eyes: 'green', cloth: 'blue' },
  },
  colors: { mane: '#3a2418', hoof: '#2a201c' },
  head: false,
  halter: false,
  blaze: false,
  socks: false,
  bones: {
    waist: { parent: 'spine', at: WAIST },
    chest: { parent: 'waist', at: CHEST },
    face: { parent: 'chest', at: NECK, tail: [0, 1.24, 0.2] },
    'upperarm.L': { parent: 'chest', at: SHOULDER },
    'forearm.L': { parent: 'upperarm.L', at: ELBOW },
    'hand.L': { parent: 'forearm.L', at: WRIST, tail: FIST },
    'upperarm.R': { parent: 'chest', at: mx(SHOULDER) },
    'forearm.R': { parent: 'upperarm.R', at: mx(ELBOW) },
    'hand.R': { parent: 'forearm.R', at: mx(WRIST), tail: mx(FIST) },
    bow: { parent: 'hand.L', at: FIST, tail: bowPt(BOW_HALF, 0) },
    'string.top': { parent: 'bow', at: bowPt(BOW_HALF, -BRACE), tail: bowPt(0, -BRACE) },
    'string.bot': { parent: 'bow', at: bowPt(-BOW_HALF, -BRACE), tail: bowPt(0, -BRACE) },
    arrow: { parent: 'hand.R', at: mx(FIST), tail: [-FIST[0], FIST[1], FIST[2] + 0.2] },
  },
  probes: [
    {
      bone: 'face',
      chain: [['hips', HIPS_AT], ['spine', SPINE_AT], ['waist', WAIST], ['chest', CHEST], ['face', NECK]],
      points: [-1, 0, 1].flatMap((a) => [-1, 0, 1].flatMap((b) => [-1, 0, 1].filter((c) => a || b || c).map((c) => {
        const l = Math.hypot(a, b, c);
        return [HEAD_C[0] + (HEAD_R[0] + 0.01) * (a / l), HEAD_C[1] + (HEAD_R[1] + 0.01) * (b / l), HEAD_C[2] + (HEAD_R[2] + 0.01) * (c / l)] as V3;
      }))),
    },
  ],
  extra(k, horse) {
    const coat = horse.tint.coat;
    const hairC = horse.tint.mane;
    // ------------------------------------------------------------------ the boy's body in the coat
    // A root inside the horse's chest, so the waist grows out of it with a fillet and no seam.
    const horseChest = sdf.ellipsoid([0.15, 0.12, 0.15]).at(0, 0.53, 0.1).bone('spine');
    const belly = sdf.ellipsoid([0.095, 0.09, 0.08]).at(0, 0.66, 0.17).bone('waist');
    const chest = sdf.ellipsoid([0.1, 0.075, 0.075]).at(0, 0.75, 0.16).bone('chest');
    const neck = sdf.capsule([0, 0.79, 0.165], [0, 0.88, 0.18], 0.042).bone('face');
    const skull = sdf.smoothUnion(
      0.04,
      sdf.ellipsoid(HEAD_R).at(...HEAD_C),
      sdf.sphere(0.1).at(0.085, 0.965, 0.25).mirror('x'), // round cheeks
      sdf.ellipsoid([0.06, 0.04, 0.04]).at(0, 0.98, 0.345), // a soft snout under the nose
    );
    const faceHit = (x: number, y: number) => sdf.raycast(skull, [x, y, 2], [0, 0, -1])! as V3;
    // Tall horse ears, tipped outward, with a darker cupped inside.
    const earLocal = sdf
      .chain([[0, 0, 0, 0.04], [0, 0.07, 0, 0.045], [0, 0.155, 0, 0.007]], 0.03)
      .scale([1, 1, 0.55])
      .smoothSubtract(0.008, sdf.ellipsoid([0.027, 0.065, 0.027]).at(0, 0.08, 0.026));
    const ear = earLocal
      .paintWhere(sdf.ellipsoid([0.032, 0.075, 0.036]).at(0, 0.08, 0.022), horse.tone('coat', '#7a3e24'), 0.006)
      .rotateX(-8)
      .rotateZ(-24)
      .at(0.135, 1.16, 0.18);
    const arm = (s: 'L' | 'R') => {
      const m = (v: V3) => (s === 'L' ? v : mx(v));
      return sdf.union(
        sdf.smoothUnion(0.02, sdf.cone(m(SHOULDER), m(ELBOW), 0.04, 0.034).bone(`upperarm.${s}`)),
        sdf.cone(m(ELBOW), m(WRIST), 0.034, 0.03).bone(`forearm.${s}`),
        sdf.sphere(0.038).at(...m(FIST)).bone(`hand.${s}`),
      );
    };
    const upperShape = sdf.smoothUnion(
      0.03,
      horseChest,
      sdf.smoothUnion(0.04, belly, chest),
      neck,
      skull.bone('face'),
      sdf.smoothUnion(0.012, arm('L'), arm('R')),
    ).smoothUnion(0.012, ear.mirror('x').bone('face'));

    // Face paint: thick brows, a pink nose, a wide smile with teeth, and rosy cheeks.
    const eyeAt = (x: number) => {
      const h = faceHit(x, 1.035);
      return [h[0], h[1], h[2] - 0.022] as V3;
    };
    const EC = eyeAt(0.085);
    const front = sdf.halfSpace([0, 0, -1], -0.2);
    const brows = sdf.extrude(profile.arc(0.07, 0.017, 62, 112), 0.3).at(EC[0], EC[1] - 0.004, 0.35).mirror('x').intersect(front);
    const noseAt = faceHit(0, 0.99);
    const nose = sdf.ellipsoid([0.022, 0.015, 0.016]).at(noseAt[0], noseAt[1], noseAt[2] - 0.006);
    const mouth = sdf.extrude(profile.arc(0.06, 0.02, 236, 304), 0.3).at(0, 1.0, 0.35).intersect(front);
    const teeth = sdf.extrude(profile.arc(0.054, 0.009, 242, 298), 0.3).at(0, 1.001, 0.35).intersect(front);
    const cheeks = sdf.capsule([0.125, 0.965, 0.2], [0.125, 0.965, 0.6], 0.032).mirror('x');
    const upper = sdf
      .smoothUnion(0.006, upperShape, nose.bone('face'))
      .paintWhere(nose.round(0.004), horse.tone('coat', '#d88a7a', 0.4), 0.004)
      .paintWhere(cheeks, horse.tone('coat', '#c8704a', 0.5), 0.02)
      .paintWhere(brows, hairC, 0.002)
      .paintWhere(mouth, '#4a1e18', 0.002)
      .paintWhere(teeth, '#fbf6ee', 0.002);
    k.body('upper', upper, { color: coat, roughness: 0.65, detail: 0.004, textureDensity: 2 });

    // Eyes: big glossy domes, almost all black iris, with a white shine.
    const EYE_R = 0.046;
    const cyl = (r: number, dx: number, dy: number) => sdf.cylinder(r, 1).rotateX(90).at(EC[0] + dx, EC[1] + dy, 0).intersect(sdf.halfSpace([0, 0, -1], -EC[2]));
    const eye = sdf
      .sphere(EYE_R)
      .at(...EC)
      .paintWhere(cyl(0.036, -0.002, -0.002), horse.tint.eye, 0.002)
      .paintWhere(sdf.sphere(0.011).at(EC[0] + 0.014, EC[1] + 0.014, EC[2] + Math.sqrt(EYE_R ** 2 - 0.014 ** 2 * 2)), '#ffffff', 0.002);
    k.body('eyes', eye.mirror('x'), { color: '#fbf8f2', roughness: 0.12, detail: 0.003, textureDensity: 2, bone: 'face' });

    // Hair: a cap over the top and the back of the head (the hairline slopes from the forehead down
    // to the nape), a messy swoop on top, and locks behind the ears down to the shoulders.
    const cap = skull
      .round(0.014)
      .intersect(sdf.halfSpace([0, -0.821, 0.572], -0.738));
    const swoop = sdf.smoothUnion(
      0.02,
      // The fringe sweeps over the forehead to the right, and a short tuft curls to the left.
      sdf.chain([[0.03, 1.2, 0.1, 0.05], [-0.01, 1.235, 0.22, 0.048], [-0.07, 1.2, 0.32, 0.04], [-0.12, 1.13, 0.34, 0.026], [-0.15, 1.08, 0.31, 0.012]], 0.02),
      sdf.chain([[0.0, 1.2, 0.1, 0.045], [0.06, 1.235, 0.2, 0.04], [0.11, 1.2, 0.3, 0.03], [0.14, 1.14, 0.31, 0.014]], 0.02),
      sdf.chain([[-0.02, 1.2, 0.0, 0.045], [-0.08, 1.235, 0.06, 0.032], [-0.15, 1.19, 0.1, 0.014]], 0.02),
    );
    const lock = sdf.chain([[0.15, 1.0, 0.12, 0.05], [0.16, 0.88, 0.11, 0.042], [0.15, 0.8, 0.12, 0.022]], 0.02);
    const nape = sdf.chain([[0, 0.97, 0.04, 0.075], [0, 0.87, 0.07, 0.055], [0, 0.8, 0.09, 0.03]], 0.02);
    const hair = sdf
      .smoothUnion(0.02, cap, swoop, nape, lock.mirror('x'))
      .displace(0.002, (x, y, z) => noise.fbm(x * 40, y * 14, z * 40, 2))
      .bone('face');
    k.body('hair', hair, { color: hairC, roughness: 0.6, detail: 0.004 });

    // A leather strap across the chest from the right shoulder to the left hip, and a small quiver on
    // the back with golden fletchings.
    const torso = sdf.smoothUnion(0.04, belly, chest);
    const strap = torso.round(0.008).subtract(torso.round(-0.002)).intersect(sdf.box([0.5, 0.032, 0.5]).rotateZ(40).at(0, 0.71, 0.16));
    const quiverPose = (sh: sdf.Shape) => sh.rotateX(-12).rotateZ(-28).at(0.02, 0.76, 0.045);
    const quiver = quiverPose(sdf.cylinder(0.036, 0.2, 0.01).subtract(sdf.cylinder(0.028, 0.1).at(0, 0.1, 0)));
    const fletch = quiverPose(
      sdf.union(...[-0.014, 0, 0.014].map((dx, i) => sdf.box([0.004, 0.04, 0.026], 0.002).rotateY(i * 50).at(dx, 0.12 + 0.01 * (i % 2), 0.004 * i))),
    );
    k.body('strap', sdf.union(strap, quiver, fletch.paint('#e0b040')).bone('chest'), { color: horse.tone('mane', '#5a3420'), roughness: 0.55, detail: 0.004 });

    // ------------------------------------------------------------------ blanket and girth
    const barrel = sdf.smoothUnion(0.07, sdf.ellipsoid([0.2, 0.18, 0.22]).at(0, 0.5, 0.06), sdf.ellipsoid([0.2, 0.18, 0.21]).at(0, 0.51, -0.26));
    const hem = (x: number, y: number, z: number) => 0.012 * Math.sin(z * 40) + 0.004 * noise.fbm(x * 30, y * 30, z * 30, 2);
    const blanketShape = barrel
      .round(0.012)
      .subtract(barrel.round(-0.004))
      .intersect(sdf.box([0.6, 0.36, 0.36]).at(0, 0.62, -0.1).displace(1, hem));
    const blanket = sdf.union(
      blanketShape.intersect(sdf.halfSpace([0, 0, -1], 0.1)).bone('spine'),
      blanketShape.intersect(sdf.halfSpace([0, 0, 1], -0.1)).bone('hips'),
    );
    // A wrap of the same cloth around the waist, where the boy grows out of the horse's chest.
    const join = sdf.smoothUnion(0.05, belly, sdf.ellipsoid([0.2, 0.18, 0.22]).at(0, 0.5, 0.06));
    const wrap = join
      .round(0.012)
      .subtract(join.round(-0.004))
      .intersect(sdf.box([0.32, 0.065, 0.32]).at(0, 0.615, 0.17).displace(1, (x, _y, z) => 0.006 * Math.sin(Math.atan2(z - 0.17, x) * 7)))
      .bone('waist');
    const cloth = k.tint('cloth');
    k.body('blanket', sdf.union(blanket, wrap), { color: cloth, roughness: 0.8, detail: 0.005 });
    const girth = barrel.round(0.02).subtract(barrel.round(0.004)).intersect(sdf.box([0.6, 0.6, 0.045]).at(0, 0.5, -0.05));
    const buckle = sdf.box([0.012, 0.05, 0.05], 0.006).subtract(sdf.box([0.05, 0.026, 0.026])).at(...(sdf.raycast(barrel, [1, 0.5, -0.05], [-1, 0, 0])! as V3)).at(0.02, 0, 0);
    k.body('girth', sdf.union(girth, buckle.paint('#e0b040')).bone('spine'), { color: horse.tone('mane', '#5a3420'), roughness: 0.55, detail: 0.004 });

    // ------------------------------------------------------------------ bow, string, and arrow
    // The bow in its frame: the grip at the origin, the limbs along Y curving back toward the
    // string at -Z, little curled tips.
    const limb = sdf.chain([[0, 0, 0, 0.015], [0, 0.08, -0.008, 0.012], [0, 0.14, -0.03, 0.009], [0, BOW_HALF, -BRACE, 0.006], [0, BOW_HALF + 0.015, -BRACE + 0.012, 0.005]], 0.006);
    const bowLocal = sdf.smoothUnion(0.008, limb.mirror('y'), sdf.cylinder(0.02, 0.06, 0.008).paint(horse.tone('mane', '#6a3a22')));
    const gold = '#e0b040';
    k.body('bow-limbs', bowLocal.rotateX(BOW_TILT).at(...FIST), { color: gold, roughness: 0.35, metalness: 0.6, detail: 0.003, bone: 'bow' });
    const sTop = bowPt(BOW_HALF, -BRACE);
    const sMid = bowPt(0, -BRACE);
    const sBot = bowPt(-BOW_HALF, -BRACE);
    k.body('bowstring', sdf.union(sdf.capsule(sTop, sMid, 0.0035).bone('string.top'), sdf.capsule(sBot, sMid, 0.0035).bone('string.bot')), {
      color: '#f2e8cc',
      roughness: 0.6,
      detail: 0.002,
    });
    const tip: V3 = [-FIST[0], FIST[1], FIST[2] + POINT];
    const arrow = sdf.union(
      sdf.capsule([-FIST[0], FIST[1], FIST[2] - NOCK], tip, 0.006),
      sdf.cone(tip, [tip[0], tip[1], tip[2] + 0.04], 0.016, 0.002),
      // The fletching: two crossed vanes at the back of the shaft.
      sdf.union(sdf.box([0.003, 0.032, 0.045], 0.001), sdf.box([0.032, 0.003, 0.045], 0.001)).at(-FIST[0], FIST[1], FIST[2] - NOCK + 0.03),
    );
    k.body('golden-arrow', arrow, { color: gold, roughness: 0.35, metalness: 0.6, detail: 0.003, bone: 'arrow' });

    // ------------------------------------------------------------------ attack: a bow shot
    // The arms are short, so the boy shoots with the bow on its side in front of his chest: the body
    // turns a little to the right, the bow hand pushes the bow out and turns it flat, the draw hand
    // nocks the arrow and pulls the string back to his chest; a short hold; the arrow flies and the
    // string snaps; the arms settle. The arm angles were solved (forward kinematics over a grid) so
    // the bow fist sits at (0.02, 0.76, 0.40) and the draw fist on the string 8 cm behind its rest
    // line; each hand turns back by its arm's turn, so the arrow points straight ahead.
    const { keys, wave } = motion;
    const AT = {
      bowUpper: [-39, 0, -24],
      bowFore: [5, 0, 0],
      bowHand: [24, 34, 112],
      nockUpper: [-42, 0, 75],
      nockFore: [35, 0, 0],
      nockHand: [0, -31, -57],
      drawUpper: [-129, 0, 84],
      drawFore: [125, 0, 20],
      drawHand: [0, -47, 32],
    } as const;
    const PULL = 0.08;
    const mix = (a: readonly number[], b: readonly number[], t: number) => a.map((v, i) => v + (b[i]! - v) * t) as V3;
    const ZERO: V3 = [0, 0, 0];
    k.animation('attack', {
      duration: 1.4,
      loop: false,
      pose: (_t, p) => {
        const raise = keys(p, [[0, 0], [0.2, 1], [0.8, 1], [1, 0]]);
        const nock = keys(p, [[0.05, 0], [0.24, 1], [0.82, 1], [1, 0]]);
        const draw = keys(p, [[0.24, 0], [0.46, 1], [0.58, 1], [0.6, 0]]);
        const flick = keys(p, [[0.58, 0], [0.62, 1], [0.76, 0]]);
        const shot = keys(p, [[0.58, 0], [0.6, 0.05], [0.72, 1]], 'linear');
        const gone = p > 0.585 && p < 0.9;
        const snap = keys(p, [[0.58, 0], [0.6, 1], [0.66, -0.4], [0.72, 0]]);
        const strAng = (Math.asin((PULL * draw) / BOW_HALF) * 180) / Math.PI + 5 * snap;
        const dUpper = mix(mix(ZERO, AT.nockUpper, nock), AT.drawUpper, draw);
        return {
          spine: { rotate: [-2 * draw, 0, 0] },
          waist: { rotate: [-3 * draw + 2 * flick, -15 * raise, 0] },
          chest: { rotate: [0, -5 * raise, 0] },
          face: { rotate: [6 * raise, 18 * raise, 0] },
          tail: { rotate: [6 * wave(p, 2), 0, 12 * wave(p, 2, 0.3)] },
          'upperarm.L': { rotate: mix(ZERO, AT.bowUpper, raise) },
          'forearm.L': { rotate: mix(ZERO, AT.bowFore, raise) },
          'hand.L': { rotate: mix(ZERO, AT.bowHand, raise) },
          'upperarm.R': { rotate: [dUpper[0] - 14 * flick, dUpper[1], dUpper[2]] },
          'forearm.R': { rotate: mix(mix(ZERO, AT.nockFore, nock), AT.drawFore, draw) },
          'hand.R': { rotate: mix(mix(ZERO, AT.nockHand, nock), AT.drawHand, draw) },
          'string.top': { rotate: [strAng, 0, 0] },
          'string.bot': { rotate: [-strAng, 0, 0] },
          arrow: gone ? { move: [0, 0, 2.5 * shot], scale: [1 - 0.9 * shot, 1 - 0.9 * shot, 1 - 0.9 * shot] } : {},
        };
      },
    });
  },
  pose(clip, p) {
    const { wave, keys, bump } = motion;
    const arms = (l: number, r: number, bend = 0): Record<string, BonePose> => ({
      'upperarm.L': { rotate: [l, 0, 0] },
      'upperarm.R': { rotate: [r, 0, 0] },
      'forearm.L': { rotate: [-bend, 0, 0] },
      'forearm.R': { rotate: [-bend, 0, 0] },
    });
    if (clip === 'walk' || clip === 'run') {
      const n = clip === 'run' ? 1 : 2;
      const s = clip === 'run' ? 16 : 8;
      return {
        waist: { rotate: [clip === 'run' ? 6 : 2, 0, 0] },
        chest: { rotate: [2 * wave(p, n, 0.2), 4 * wave(p), 0] },
        face: { rotate: [-3 * wave(p, n, 0.35), -3 * wave(p), 2 * wave(p, 1, 0.2)] },
        ...arms(s * wave(p), -s * wave(p), clip === 'run' ? 20 : 0),
      };
    }
    if (clip === 'idle') {
      return {
        chest: { rotate: [1.5 * wave(p, 2), 0, 0] },
        face: { rotate: [2 * wave(p, 1, 0.3), 8 * wave(p, 1, 0.1), 3 * wave(p)] },
        ...arms(3 * wave(p, 2), 3 * wave(p, 2, 0.5)),
      };
    }
    if (clip === 'rear') {
      // Rearing: the boy leans forward over the horse and raises the bow high in triumph.
      const up = keys(p, [[0, 0], [0.1, 0], [0.3, 1], [0.6, 1], [0.76, 0], [1, 0]]);
      return {
        waist: { rotate: [26 * up, 0, 0] },
        face: { rotate: [-14 * up, 0, 0] },
        'upperarm.L': { rotate: [-150 * up, 0, -20 * up] },
        'forearm.L': { rotate: [60 * up, 0, 0] },
        'upperarm.R': { rotate: [-40 * up, 0, 20 * up] },
        'forearm.R': { rotate: [-30 * up, 0, 0] },
      };
    }
    if (clip === 'neigh') {
      // A cheer: the head tosses back and the right fist pumps twice.
      const toss = keys(p, [[0, 0], [0.12, 0.3], [0.26, 1], [0.5, 1], [0.66, 0], [1, 0]]);
      const pump = keys(p, [[0.2, 0], [0.3, 1], [0.6, 1], [0.7, 0]]) * (0.7 + 0.3 * wave(p, 6));
      return {
        chest: { rotate: [-6 * toss, 0, 0] },
        face: { rotate: [-18 * toss, 0, 6 * toss] },
        'upperarm.R': { rotate: [-120 * pump, 0, -20 * pump] },
        'forearm.R': { rotate: [-40 * pump, 0, 0] },
      };
    }
    if (clip === 'hit') {
      const h = keys(p, [[0, 0], [0.15, 1], [0.34, 0.85], [1, 0]]);
      return {
        waist: { rotate: [-12 * h, -6 * h, 0] },
        face: { rotate: [-16 * h, 0, 8 * h] },
        ...arms(-30 * h, -30 * h, 40 * h),
      };
    }
    if (clip === 'death') {
      // The boy slumps forward, the head drops, and the arms go limp.
      const slump = keys(p, [[0.2, 0], [0.5, 1]]);
      const recoil = keys(p, [[0, 0], [0.06, 1], [0.16, 0.3], [0.26, 0]]);
      return {
        waist: { rotate: [-14 * recoil + 22 * slump, 0, 0] },
        chest: { rotate: [10 * slump, 0, 0] },
        face: { rotate: [-12 * recoil + 20 * slump, 0, -10 * slump] },
        // The bow arm swings out and up (the horse lies on its right side), clear of the chest.
        'upperarm.L': { rotate: [-30 * slump, 0, 50 * slump] },
        'forearm.L': { rotate: [10 * slump + 6 * bump(p, 1), 0, 0] },
        'upperarm.R': { rotate: [-40 * slump, 0, -10 * slump] },
        'forearm.R': { rotate: [10 * slump, 0, 0] },
      };
    }
    return {};
  },
});
