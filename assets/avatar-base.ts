import { addPart, defineAsset, mapTint, motion, profile, sdf } from '../src/index.js';

import { avatarHair } from './parts/avatar-hair.js';

/**
 * Avatar base — the Chibi Quest player avatar (docs/avatar-system.md section 3), 0.94 m tall
 * without hair, faces +Z. Equipment pieces dress it; the base itself wears plain underclothes.
 *
 * Role: every student's avatar, in the shop, on the profile page, and in every game, seen in 3D
 * and as a 128 px sprite. One idea: the hero set's friendly face on a plain, readable body that
 * any helmet, armor, or weapon fits, because every hero shares this skeleton and head.
 * Source: the rogue (`assets/rogue.ts`). The skeleton, the head, the face paint, the arms, and the
 * fists are the rogue's, unchanged, so every hero part and catalog piece fits as it fits a hero.
 * The torso is the hero torso of the chest-armor contract (bench/sonnet/briefs/torso-contract.md).
 * Proportions: eyes 0.63, chin 0.48, shoulders 0.38, belt 0.25, shirt hem 0.152, shoe tops 0.1.
 * Palette: skin #f2c7a4, hair #5a301d, a sky-blue shirt #5f84ad (the one tinted cloth), warm
 *   grey-brown trousers #4a3f36, brown shoes #7a4a2c.
 * Value plan: the dark hair frames the light face (focal point); the mid shirt holds the body; the
 *   dark trousers and shoes ground it.
 * Bodies: skin (head, neck, arms, fists, torso, legs, feet), hair (the `swept` style from
 *   `assets/parts/avatar-hair.ts`), undershirt, pants, shoes.
 * Color slots: skin, hair, eyes, cloth (the shirt). Presets: four looks; the class presets join
 *   with the starter sets (docs/avatar-system.md).
 * Rig: the shared hero skeleton (the rogue's), with `cloak` for back pieces and `knife.L`/`knife.R`
 *   at the grip in each fist (the offhand and mainhand anchors). Clips: idle, walk, run, attack,
 *   hit, rest, cheer, cast.
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
  shirt: '#5f84ad',
  shirtTrim: '#46658a',
  belt: '#6b4a32',
  pants: '#4a3f36',
  shoe: '#7a4a2c',
  sole: '#4a2c1c',
};

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.105, 0.628] as const; // x (each side), y
const pair = (s: sdf.Shape) => s.mirror('x');

export default defineAsset({
  name: 'avatar-base',
  description: 'The Chibi Quest player avatar: the hero face and skeleton in a plain shirt, trousers, and shoes, ready for equipment.',
  detail: 0.005,
  reference: 'docs/hero-mockups/rogue_001.jpg',
  variants: {
    skin: { fair: C.skin, light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { brown: C.hair, black: '#231a17', blond: '#c4974a', auburn: '#8e3b1c', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: C.iris, blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { sky: C.shirt, linen: '#cdbb94', moss: '#64773f', rose: '#a35d68', slate: '#5a6270' },
  },
  presets: {
    sunny: { skin: 'fair', hair: 'blond', eyes: 'blue', cloth: 'rose' },
    forest: { skin: 'tan', hair: 'auburn', eyes: 'green', cloth: 'moss' },
    night: { skin: 'deep', hair: 'black', eyes: 'brown', cloth: 'slate' },
    frost: { skin: 'light', hair: 'silver', eyes: 'violet', cloth: 'linen' },
  },

  build(k) {
    // The slot colors: shades of a slot follow it when a game recolors the slot (as in the rogue).
    const T = {
      iris: k.tint('eyes'),
      irisLow: k.tint('eyes', { color: C.irisLow, follow: 1 }),
      brow: k.tint('hair', { color: C.brow, follow: 1 }),
      skin: k.tint('skin'),
      blush: k.tint('skin', { color: C.blush, follow: 0.5 }),
      mouth: k.tint('skin', { color: C.mouth, follow: 0.5 }),
      shirt: k.tint('cloth'),
      trim: k.tint('cloth', { color: C.shirtTrim, follow: 1 }),
    };

    // ------------------------------------------------------------------ skeleton (the rogue's)
    const SHOULDER = [0.13, 0.385, 0] as const;
    const ELBOW = [0.18, 0.332, 0.012] as const;
    const WRIST = [0.205, 0.238, 0.03] as const;
    const HIP = [0.068, 0.195, 0] as const;
    const ANKLE = [0.098, 0.07, 0] as const;
    const KNEE = [0.083, 0.1325, 0] as const; // the knee: splits the leg (shin.L takes the weight below it)
    const mx = (p: readonly [number, number, number]) => [-p[0], p[1], p[2]] as const;
    // The grip center in each fist: the anchor of the mainhand (knife.R) and offhand (knife.L) slots.
    const GRIP = [0.232, 0.172, 0.022] as const;
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
      'knife.L': { parent: 'hand.L', at: GRIP },
      'knife.R': { parent: 'hand.R', at: mx(GRIP) },
      'leg.L': { parent: 'hips', at: HIP },
      'shin.L': { parent: 'leg.L', at: KNEE, split: 0.015 },
      'foot.L': { parent: 'shin.L', at: ANKLE },
      'leg.R': { parent: 'hips', at: mx(HIP) },
      'shin.R': { parent: 'leg.R', at: mx(KNEE), split: 0.015 },
      'foot.R': { parent: 'shin.R', at: mx(ANKLE) },
    });

    // ------------------------------------------------------------------ head and face (the rogue's)
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

    // Arms: the upper arm under the short sleeve, the bare forearm, and a closed fist that holds a grip.
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

    // The hero torso (the chest-armor contract at 1x). Three tagged bands set the skin weights; the
    // union with the whole torso keeps the surface exactly as it is.
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
    const band = (y0: number, y1: number) => sdf.box([0.6, y1 - y0, 0.6]).at(0, (y0 + y1) / 2, 0);
    const weighted = (s: sdf.Shape) =>
      sdf.union(s, s.intersect(band(0.1, 0.235)).bone('hips'), s.intersect(band(0.215, 0.33)).bone('spine'), s.intersect(band(0.31, 0.5)).bone('chest'));
    const bodySkin = weighted(torso.round(-0.008));

    // Legs: thigh and shin inside the trousers, a foot inside each shoe.
    const leg = sdf.smoothUnion(
      0.015,
      sdf.capsule(HIP, KNEE, 0.04).bone('leg.L'),
      sdf.capsule(KNEE, ANKLE, 0.034).bone('shin.L'),
      sdf.ellipsoid([0.034, 0.03, 0.06]).at(ANKLE[0], 0.04, 0.035).bone('foot.L'),
    );
    const legs = pair(leg);

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
      .union(arms, bodySkin, legs)
      .paintWhere(blush, T.blush, 0.03)
      .paintWhere(eyeWhite, C.eyeWhite)
      .paintWhere(irisRim, C.irisRim)
      .paintWhere(iris, T.iris)
      .paintWhere(irisLow, T.irisLow, 0.012)
      .paintWhere(pupil, C.pupil)
      .paintWhere(lid, C.lid)
      .paintWhere(lash, C.lid)
      .paintWhere(shine, '#ffffff')
      .paintWhere(brows, T.brow)
      .paintWhere(smile, T.mouth);
    k.body('skin', skin, { color: T.skin, roughness: 0.55, textureDensity: 2 });

    // ------------------------------------------------------------------ hair (the default style)
    addPart(k, avatarHair('swept', mapTint(k), { capped: k.worn?.capHair ?? false }), { pose: (s) => s.at(0, HEAD_Y, 0) });

    // ------------------------------------------------------------------ undershirt
    // The hero torso with short sleeves to the elbow, a darker collar and hem, and a painted belt.
    const sleeves = pair(sdf.cone([0.11, 0.405, 0], [0.172, 0.348, 0.01], 0.047, 0.043).bone('upperarm.L'));
    const collar = sdf.halfSpace([0, -1, 0], -0.452);
    const hem = sdf.halfSpace([0, 1, 0], 0.168);
    const belt = band(0.238, 0.264);
    const shirt = sdf
      .smoothUnion(0.012, weighted(torso), sleeves)
      .paintWhere(collar, T.trim, 0.003)
      .paintWhere(hem, T.trim, 0.003)
      .paintWhere(belt, C.belt, 0.002);
    k.body('undershirt', shirt, { color: T.shirt, roughness: 0.85 });

    // ------------------------------------------------------------------ trousers
    const trouserLeg = sdf.smoothUnion(
      0.012,
      sdf.capsule(HIP, KNEE, 0.05).bone('leg.L'),
      sdf.cone(KNEE, [ANKLE[0], 0.085, 0.002], 0.047, 0.043).bone('shin.L'),
    );
    const pants = sdf.smoothUnion(0.03, sdf.ellipsoid([0.118, 0.052, 0.088]).at(0, 0.2, 0).bone('hips'), pair(trouserLeg));
    k.body('pants', pants, { color: C.pants, roughness: 0.85 });

    // ------------------------------------------------------------------ shoes
    // A plain shoe at the ankle's ground point, turned out a little, with a darker sole.
    const shoeFoot = sdf
      .smoothUnion(
        0.03,
        sdf.cylinder(0.05, 0.07, 0.018).at(0, 0.06, 0),
        sdf.ellipsoid([0.056, 0.05, 0.098]).at(0, 0.048, 0.045),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const sole = shoeFoot.round(0.004).intersect(sdf.halfSpace([0, 1, 0], 0.016)).intersect(sdf.halfSpace([0, -1, 0], 0));
    const shoe = sdf.union(shoeFoot, sole.paint(C.sole)).rotateY(12).at(ANKLE[0], 0, 0).bone('foot.L');
    k.body('shoes', pair(shoe), { color: C.shoe, roughness: 0.6 });

    // ------------------------------------------------------------------ animation
    const { wave, bump, keys, reach, orient } = motion;
    const LEG = 0.19;
    const rad = Math.PI / 180;
    type V3 = readonly [number, number, number];

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
        'hand.L': { rotate: steady(armL, [2 * wave(p, 1, 0.1), 0, 3 * bump(p)], [-5 * bump(p), 0, 0]) },
        'hand.R': { rotate: steady(armR, [2 * wave(p, 1, 0.1), 0, -3 * bump(p)], [-5 * bump(p), 0, 0]) },
      }),
    });

    // The rogue's stride: the legs come from motion.gait (planted stance feet, a knee lift in the
    // swing, heel strike, and toe-off); the arms swing against the legs.
    const stride = (duration: number, step: number, lift: number, duty: number, armSwing: number, lean: number, hop: number, flow: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        const hipsTurn = [0, 7 * s, 0] as const;
        const legs = motion.gait(p - 0.25, { hip: HIP, knee: KNEE, ankle: ANKLE }, {
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
          cloak: { rotate: [flow + 4 * wave(p, 2, 0.15), 0, 3 * s] as const },
          'upperarm.L': { rotate: [armSwing * s, 0, 6] as const },
          'upperarm.R': { rotate: [-armSwing * s, 0, -6] as const },
          'forearm.L': { rotate: [-armSwing * 0.5 - armSwing * 0.4 * Math.max(0, -s), 0, 0] as const },
          'forearm.R': { rotate: [-armSwing * 0.5 - armSwing * 0.4 * Math.max(0, s), 0, 0] as const },
          // The wrists take back most of the arm swing, so a held weapon or shield stays steady.
          'hand.L': { rotate: [-0.8 * (armSwing * s - armSwing * 0.5 - armSwing * 0.4 * Math.max(0, -s)), 0, 0] as const },
          'hand.R': { rotate: [-0.8 * (-armSwing * s - armSwing * 0.5 - armSwing * 0.4 * Math.max(0, s)), 0, 0] as const },
        };
      },
    });
    k.animation('walk', stride(0.9, 0.1, 0.025, 0.6, 28, 3, 0.006, 6));
    k.animation('run', stride(0.56, 0.15, 0.045, 0.4, 50, 12, 0.03, 22));

    // One arm from a wrist target and an elbow pole, both in the chest's rest frame. Keys are
    // written for the right arm (x < 0); `m` mirrors them for the left arm.
    // The held item (src/equip.ts, the grip socket): at rest its business end points forward and
    // 20 degrees up and its flat faces outward. `aim` turns the hand so that the item points along
    // `dir` with the flat toward `up` (chest frame, right-arm keys); a shield on the hand turns with it.
    const ITEM_DIR: V3 = [0, Math.sin(20 * rad), Math.cos(20 * rad)];
    const armRig = (side: 1 | -1) => {
      const m = (v: V3): V3 => [side === 1 ? -v[0] : v[0], v[1], v[2]];
      const tag = side === 1 ? 'L' : 'R';
      const chain = { root: m(mx(SHOULDER)), mid: m(mx(ELBOW)), end: m(mx(WRIST)) };
      const item = { dir: ITEM_DIR, up: m([-1, 0, 0]) };
      const pose = (wrist: V3, pole: V3, aim?: { dir: V3; up: V3 }) => {
        const a = reach(chain, wrist, pole);
        return {
          [`upperarm.${tag}`]: { rotate: a.upper },
          [`forearm.${tag}`]: { rotate: a.lower },
          [`hand.${tag}`]: { rotate: aim ? orient([a.upper, a.lower], item, { dir: m(aim.dir), up: m(aim.up) }) : ([0, 0, 0] as V3) },
        };
      };
      return { m, chain, pose, item, rest: m([-0.58, 0.6, -0.015]) };
    };
    const norm = (v: V3): V3 => {
      const l = Math.hypot(...v);
      return [v[0] / l, v[1] / l, v[2] / l];
    };
    /** The rest aim of a right-hand item: forward and 20 degrees up, the flat outward. */
    const AIM_REST = { dir: ITEM_DIR, up: [-1, 0, 0] as V3 };
    /** The wrist turn that keeps a held item (a shield) as it is at rest while the arm moves. */
    const steady = (arm: typeof armR, upper: V3, lower: V3) => orient([upper, lower], arm.item, { dir: arm.m(AIM_REST.dir), up: arm.m(AIM_REST.up) });
    const armR = armRig(-1);
    const armL = armRig(1);
    // A crouch with the feet planted: the thigh swings forward by `a`, the shin back by 2a, and the
    // foot stays flat; the hips drop by the legs' lost height.
    const THIGH = Math.hypot(HIP[0] - KNEE[0], HIP[1] - KNEE[1]);
    const SHIN = Math.hypot(KNEE[0] - ANKLE[0], KNEE[1] - ANKLE[1]);
    const crouch = (a: number) => ({
      drop: (THIGH + SHIN) * (1 - Math.cos(a * rad)),
      bones: {
        'leg.L': { rotate: [-a, 0, 0] as V3 },
        'leg.R': { rotate: [-a, 0, 0] as V3 },
        'shin.L': { rotate: [2 * a, 0, 0] as V3 },
        'shin.R': { rotate: [2 * a, 0, 0] as V3 },
        'foot.L': { rotate: [-a, 0, 0] as V3 },
        'foot.R': { rotate: [-a, 0, 0] as V3 },
      },
    });

    // ------------------------------------------------------------------ attack: a one-handed slash
    // The mainhand (right) fist winds out and back at the side, the torso coils to the right, then
    // unwinds and sweeps the fist across the front at chest height to the left, and returns. A held
    // weapon on `knife.R` follows the fist; the path stays in front of the body and below the chin.
    k.animation('attack', {
      duration: 0.7,
      loop: false,
      pose: (_t, p) => {
        const wrist = keys(p, [
          [0, armR.chain.end],
          [0.25, [-0.26, 0.34, -0.05]], // wound out and back at the side
          [0.33, [-0.27, 0.345, -0.05]],
          [0.43, [-0.16, 0.35, 0.13]], // in front, chest high
          [0.52, [0.0, 0.32, 0.15]], // across the front
          [0.6, [0.05, 0.3, 0.12]], // follow-through
          [0.8, [-0.15, 0.27, 0.07]],
          [1, armR.chain.end],
        ] as [number, V3][], 'spline');
        const pole = keys(p, [
          [0, armR.rest],
          [0.25, [-0.6, 0.25, -0.3]], // elbow out and back
          [0.33, [-0.6, 0.25, -0.3]],
          [0.45, [-0.55, 0.45, -0.05]], // elbow out to the side for the sweep
          [0.6, [-0.4, 0.3, 0.1]],
          [1, armR.rest],
        ] as [number, V3][]);
        // The blade: up and back over the right shoulder in the wind-up, then a flat sweep out in
        // front and across to the left (the flat faces up, so the edge leads), and back to rest.
        const dir = norm(
          keys(p, [
            [0, AIM_REST.dir],
            [0.25, [-0.55, 0.75, -0.35]],
            [0.33, [-0.55, 0.75, -0.35]],
            [0.43, [-0.55, 0.2, 0.8]],
            [0.52, [0.45, 0.05, 0.9]],
            [0.6, [0.85, -0.1, 0.5]],
            [0.8, [0.2, 0.2, 0.95]],
            [1, AIM_REST.dir],
          ] as [number, V3][], 'spline'),
        );
        const up = norm(keys(p, [[0, AIM_REST.up], [0.3, [-0.9, 0.1, 0.4]], [0.43, [0, 1, 0.3]], [0.6, [0, 1, 0.3]], [1, AIM_REST.up]] as [number, V3][]));
        const turn = keys(p, [[0, 0], [0.25, -14], [0.33, -14], [0.52, 16], [0.62, 16], [1, 0]] as const);
        const chestY = keys(p, [[0, 0], [0.25, -18], [0.33, -18], [0.5, 20], [0.62, 20], [1, 0]] as const);
        const lean = keys(p, [[0, 0], [0.25, 3], [0.45, 9], [0.62, 7], [1, 0]] as const);
        const balance = keys(p, [[0, 0], [0.3, 1], [0.62, 1], [1, 0]] as const);
        return {
          hips: { rotate: [0, turn, 0] },
          spine: { rotate: [lean, 0, 0] },
          chest: { rotate: [lean / 3, chestY, 0] },
          head: { rotate: [-0.6 * lean, -0.6 * (turn + chestY), 0] },
          cloak: { rotate: [6 * balance, 0, 0] },
          ...armR.pose(wrist, pole, { dir, up }),
          'upperarm.L': { rotate: [-12 * balance, 0, 14 * balance] },
          'forearm.L': { rotate: [-20 * balance, 0, 0] },
          'hand.L': { rotate: steady(armL, [-12 * balance, 0, 14 * balance], [-20 * balance, 0, 0]) },
          'leg.L': { rotate: [0, -turn, 0] },
          'leg.R': { rotate: [0, -turn, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ hit: a blow from the front (the rogue's)
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
          hips: { move: [0, -motion.legDrop(LEG, lean), -back], rotate: [0, 5 * h, 0] },
          spine: { rotate: [-7 * h, 0, 0] },
          chest: { rotate: [-9 * h, 6 * h, -3 * h] },
          neck: { rotate: [-4 * whip, 0, 0] },
          head: { rotate: [-10 * whip, -6 * whip, 4 * whip] },
          cloak: { rotate: [12 * lag, 0, 4 * lag] },
          'upperarm.L': { rotate: [-12 * h, 0, 16 * h] },
          'forearm.L': { rotate: [-16 * h, 0, 0] },
          'upperarm.R': { rotate: [-8 * h, 0, -14 * h] },
          'forearm.R': { rotate: [-12 * h, 0, 0] },
          'hand.L': { rotate: steady(armL, [-12 * h, 0, 16 * h], [-16 * h, 0, 0]) },
          'hand.R': { rotate: steady(armR, [-8 * h, 0, -14 * h], [-12 * h, 0, 0]) },
          'leg.L': { rotate: [-lean, 0, 0] },
          'leg.R': { rotate: [lean + 8 * lift, 0, 0] },
          'foot.L': { rotate: [lean, 0, 0] },
          'foot.R': { rotate: [-lean - 8 * lift, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ rest: catch the breath at camp
    // A loose crouch with the knees bent, the back rounded, the head down, and the arms hanging
    // forward; slow deep breaths lift the chest and the shoulders. Loops.
    const restLegs = crouch(26);
    k.animation('rest', {
      duration: 3.2,
      pose: (_t, p) => {
        const breath = bump(p);
        return {
          ...restLegs.bones,
          hips: { move: [0, -restLegs.drop, -0.01] },
          spine: { rotate: [12 - 2 * breath, 0, 0] },
          chest: { rotate: [6 - 3 * breath, 0, 0] },
          neck: { rotate: [6, 0, 0] },
          head: { rotate: [8 - 4 * breath, 6, 3] },
          cloak: { rotate: [-4, 0, 0] },
          'upperarm.L': { rotate: [-14 - 3 * breath, 0, 4] },
          'upperarm.R': { rotate: [-14 - 3 * breath, 0, -4] },
          'forearm.L': { rotate: [-18, 0, 0] },
          'forearm.R': { rotate: [-18, 0, 0] },
          'hand.L': { rotate: steady(armL, [-14 - 3 * breath, 0, 4], [-18, 0, 0]) },
          'hand.R': { rotate: steady(armR, [-14 - 3 * breath, 0, -4], [-18, 0, 0]) },
        };
      },
    });

    // ------------------------------------------------------------------ cheer: fists up and a hop
    // A dip, a hop with both fists pumped up beside the cheeks, a landing that gives in the knees.
    // Loops. The wrists stay well outside the cheeks (x 0.31), so held items stay clear of the head.
    const UP: V3 = [-0.31, 0.5, 0.05];
    k.animation('cheer', {
      duration: 0.8,
      pose: (_t, p) => {
        const bend = keys(p, [[0, 0.6], [0.18, 1], [0.32, 0], [0.7, 0], [0.84, 0.8], [1, 0.6]] as const, 'spline');
        const air = clamp01(Math.sin(clamp01((p - 0.3) / 0.45) * Math.PI));
        const legs = crouch(22 * bend);
        const up = keys(p, [[0, 0.75], [0.2, 0.6], [0.4, 1], [0.7, 1], [1, 0.75]] as const, 'spline');
        // A held item rises with the fist: up and a little out, the flat outward, so a crossguard
        // or a shield rim spans front to back beside the head and never toward the cheek.
        const aim = { dir: norm(keys(up, [[0, AIM_REST.dir], [1, [-0.45, 0.88, 0.12]]] as [number, V3][])), up: AIM_REST.up };
        const pumpR = armR.pose(keys(up, [[0, armR.chain.end], [1, UP]] as [number, V3][]), keys(up, [[0, armR.rest], [1, [-0.7, 0.1, 0.2]]] as [number, V3][]), aim);
        const pumpL = armL.pose(keys(up, [[0, armL.chain.end], [1, armL.m(UP)]] as [number, V3][]), keys(up, [[0, armL.rest], [1, armL.m([-0.7, 0.1, 0.2])]] as [number, V3][]), aim);
        return {
          ...legs.bones,
          hips: { move: [0, 0.05 * air - legs.drop, 0] },
          spine: { rotate: [4 * bend - 4 * air, 0, 0] },
          chest: { rotate: [-3 * air, 0, 0] },
          head: { rotate: [-8 * air, 0, 0] },
          cloak: { rotate: [10 * air, 0, 0] },
          ...pumpR,
          ...pumpL,
        };
      },
    });

    // ------------------------------------------------------------------ cast: draw in, then push forward
    // Both fists come in to the chest (the gather), then thrust forward together at chest height with
    // a lean (the release), hold a beat, and return. A wand or a focus on either hand points ahead.
    const GATHER: V3 = [-0.11, 0.31, 0.09];
    const PUSH: V3 = [-0.08, 0.37, 0.155];
    k.animation('cast', {
      duration: 0.9,
      loop: false,
      pose: (_t, p) => {
        const wrist = (a: typeof armR) =>
          keys(p, [[0, a.chain.end], [0.3, a.m(GATHER)], [0.42, a.m(GATHER)], [0.52, a.m(PUSH)], [0.74, a.m(PUSH)], [1, a.chain.end]] as [number, V3][], 'spline');
        const pole = (a: typeof armR) => keys(p, [[0, a.rest], [0.3, a.m([-0.6, -0.2, -0.3])], [0.52, a.m([-0.7, -0.3, 0.1])], [1, a.rest]] as [number, V3][]);
        const lean = keys(p, [[0, 0], [0.3, -5], [0.42, -6], [0.52, 9], [0.74, 8], [1, 0]] as const);
        // Held items point ahead and a little up through the gather and the push.
        const ahead = keys(p, [[0, 0], [0.3, 1], [0.74, 1], [1, 0]] as const);
        const aim = { dir: norm(keys(ahead, [[0, AIM_REST.dir], [1, [0, 0.12, 1]]] as [number, V3][])), up: AIM_REST.up };
        return {
          spine: { rotate: [lean, 0, 0] },
          chest: { rotate: [lean / 2, 0, 0] },
          head: { rotate: [-0.7 * lean, 0, 0] },
          cloak: { rotate: [-lean, 0, 0] },
          ...armR.pose(wrist(armR), pole(armR), aim),
          ...armL.pose(wrist(armL), pole(armL), aim),
        };
      },
    });
  },
});
