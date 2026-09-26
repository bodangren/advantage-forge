import { defineAsset, motion, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Farmer — Chibi Quest settlement NPC (catalog `npcs/settlement/farmer`), about 1.02 m to the top
 * of his hat, faces +Z. Target: docs/npc-mockups/farmer_001.jpg (made with mmx; one front view).
 * Built on the rogue's head and skeleton, with the adventurer's face.
 *
 * Role: a town NPC (the fields), seen in 3D and as a 128 px sprite; the hat, the plaid, the
 *   overalls, and the pitchfork must read.
 * One idea: a cheerful, rosy-cheeked farmer under a wide straw hat, chewing a stalk of straw, in
 *   red plaid and patched blue overalls, with a tall pitchfork at his side.
 * Proportions: the rogue's (head center 0.675, eyes 0.628, shoulders 0.385, waist 0.25); the hat
 *   brim at 0.8 and 0.29 wide; the pitchfork from the ground to 0.9.
 * Shape language: round and soft (face, hat crown, boots) with the long straight lines of the
 *   pitchfork and the flat hat brim.
 * Palette (60/30/10): red plaid #c2362e and denim #5a7ea8; straw #e0c080 (hat, stalk); brown
 *   boots and hair; brass buttons #d8a840.
 * Value plan: the light face under the hat's shadow, with rosy cheeks, is the focal point; the red
 *   shirt and blue overalls are the two big masses.
 * Bodies: skin, hair, hat, straw, shirt, overalls, brass, boots, fork-haft, fork-tines.
 * Rig: the rogue's skeleton; the pitchfork is rigid on `hand.R`. Clips: idle, walk, run, work
 *   (pitching hay).
 */

const C = {
  skin: '#f2c7a4',
  blush: '#f08a7c',
  eyeWhite: '#f6f1ea',
  irisRim: '#1e120a',
  iris: '#4a2c1a',
  irisLow: '#7a4a26',
  pupil: '#110d0b',
  lid: '#1c130f',
  brow: '#5a3422',
  mouth: '#8a3a30',
  hair: '#6b3f24',
  hairDark: '#4e2c18',
  straw: '#e0c080',
  strawDark: '#b8964e',
  hatBand: '#8a5a30',
  plaid: '#c2362e',
  plaidDark: '#7e1e1a',
  plaidLight: '#e8a898',
  denim: '#5a7ea8',
  denimDark: '#46668c',
  patch: '#c8b48a',
  brass: '#d8a840',
  boot: '#6e4228',
  sole: '#3e2618',
  wood: '#9a6a3a',
  iron: '#7a8088',
};

type V3 = readonly [number, number, number];

const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const EYE = [0.105, 0.628] as const;
const pair = (s: sdf.Shape) => s.mirror('x');
const hard = (s: sdf.Shape) => s.mirror('x', 0);
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// Joints: the right hand holds the pitchfork upright at his side; the left arm hangs relaxed.
const SHOULDER: V3 = [0.13, 0.385, 0];
const ELBOW_L: V3 = [0.18, 0.332, 0.012];
const WRIST_L: V3 = [0.205, 0.238, 0.03];
const ELBOW_R: V3 = [-0.19, 0.33, 0.03];
const WRIST_R: V3 = [-0.215, 0.27, 0.08];
const HIP: V3 = [0.068, 0.195, 0];
const ANKLE: V3 = [0.098, 0.07, 0];
const GRIP: V3 = [WRIST_R[0] - 0.012, WRIST_R[1] - 0.038, WRIST_R[2] + 0.014];

/** A relaxed fist hanging from the wrist `w`. */
const fistAt = (w: V3) =>
  sdf.smoothUnion(
    0.018,
    sdf.ellipsoid([0.038, 0.043, 0.044]).at(w[0] + 0.007, w[1] - 0.038, w[2] + 0.004),
    sdf.capsule([w[0] - 0.009, w[1] - 0.058, w[2] + 0.03], [w[0] - 0.005, w[1] - 0.038, w[2] + 0.042], 0.017),
    sdf.cone([w[0] + 0.02, w[1] - 0.023, w[2] + 0.025], [w[0] + 0.001, w[1] - 0.033, w[2] + 0.048], 0.016, 0.013),
  );
/** A fist wrapped around a vertical haft at `g`: the fingers curl around the front. */
const gripFist = (g: V3) =>
  sdf.smoothUnion(
    0.014,
    sdf.ellipsoid([0.036, 0.044, 0.036]).at(g[0] - 0.012, g[1], g[2] - 0.004),
    sdf.capsule([g[0] - 0.02, g[1] - 0.02, g[2] + 0.022], [g[0] + 0.018, g[1] - 0.02, g[2] + 0.022], 0.016),
    sdf.capsule([g[0] - 0.02, g[1] + 0.006, g[2] + 0.024], [g[0] + 0.018, g[1] + 0.006, g[2] + 0.024], 0.016),
    sdf.cone([g[0] - 0.026, g[1] + 0.02, g[2] + 0.01], [g[0] + 0.012, g[1] + 0.03, g[2] + 0.02], 0.014, 0.011), // thumb on top
  );

export default defineAsset({
  name: 'farmer',
  description: 'Chibi farmer NPC: a wide straw hat, a straw stalk in his mouth, a red plaid shirt, patched blue overalls, boots, and a pitchfork.',
  detail: 0.005,
  reference: 'docs/npc-mockups/farmer_001.jpg',

  build(k) {
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
      'foot.L': { parent: 'leg.L', at: ANKLE },
      'leg.R': { parent: 'hips', at: mx(HIP) },
      'foot.R': { parent: 'leg.R', at: mx(ANKLE) },
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
    const nose = sdf.ellipsoid([0.024, 0.02, 0.018]).at(0, 0.57, faceZ(0, 0.57) - 0.002).bone('head');
    const ears = pair(
      sdf
        .ellipsoid([0.03, 0.048, 0.034])
        .subtract(sdf.sphere(0.019).at(0.018, 0, 0.008))
        .rotateY(-15)
        .at(0.2, 0.61, -0.005)
        .bone('head'),
    );
    const neck = sdf.capsule([0, 0.42, -0.01], [0, 0.52, -0.01], 0.05).bone('neck');
    const armL = sdf.smoothUnion(
      0.02,
      sdf.cone(SHOULDER, ELBOW_L, 0.04, 0.036).bone('upperarm.L'),
      sdf.cone(ELBOW_L, WRIST_L, 0.036, 0.032).bone('forearm.L'),
      fistAt(WRIST_L).bone('hand.L'),
    );
    const armR = sdf.smoothUnion(
      0.02,
      sdf.cone(mx(SHOULDER), ELBOW_R, 0.04, 0.036).bone('upperarm.R'),
      sdf.cone(ELBOW_R, WRIST_R, 0.036, 0.032).bone('forearm.R'),
      gripFist(GRIP).bone('hand.R'),
    );

    const at = (s: sdf.Shape, x: number, y: number) => s.at(x, y, faceZ(Math.abs(x), y));
    const eyeWhite = pair(at(sdf.ellipsoid([0.052, 0.056, 0.07]), EYE[0], EYE[1]));
    const irisRim = pair(at(sdf.ellipsoid([0.042, 0.049, 0.07]), EYE[0], EYE[1] - 0.004));
    const iris = pair(at(sdf.ellipsoid([0.036, 0.043, 0.07]), EYE[0], EYE[1] - 0.006));
    const irisLow = iris.intersect(sdf.halfSpace([0, 1, 0], EYE[1] - 0.02));
    const pupil = pair(at(sdf.ellipsoid([0.026, 0.029, 0.07]), EYE[0], EYE[1] + 0.002));
    const lid = pair(sdf.extrude(profile.arc(0.05, 0.012, 15, 165), 0.3).at(EYE[0], EYE[1] - 0.004, 0.1));
    const shine = sdf.union(
      ...[EYE[0], -EYE[0]].flatMap((x) => [at(sdf.sphere(0.012), x + 0.016, EYE[1] + 0.019), at(sdf.sphere(0.006), x - 0.014, EYE[1] - 0.022)]),
    );
    const brows = pair(sdf.extrude(profile.arc(0.1, 0.02, 60, 118), 0.3).at(0.1, 0.725 - 0.1, 0.1));
    const smile = sdf.extrude(profile.arc(0.06, 0.01, 245, 295), 0.3).at(0, 0.53 + 0.06, 0.1);
    const skin = sdf
      .smoothUnion(0.03, head, neck)
      .smoothUnion(0.012, nose, ears)
      .union(armL, armR)
      .paintWhere(pair(at(sdf.sphere(0.04), 0.14, 0.565)), C.blush, 0.03)
      .paintWhere(eyeWhite, C.eyeWhite)
      .paintWhere(irisRim, C.irisRim)
      .paintWhere(iris, C.iris)
      .paintWhere(irisLow, C.irisLow, 0.012)
      .paintWhere(pupil, C.pupil)
      .paintWhere(lid, C.lid)
      .paintWhere(shine, '#ffffff')
      .paintWhere(brows, C.brow)
      .paintWhere(smile, C.mouth)
      .paintWhere(sdf.sphere(0.022).at(0, 0.57, faceZ(0, 0.57) + 0.03), '#f0a090', 0.015); // a rosy nose tip
    k.body('skin', skin, { color: C.skin, roughness: 0.55, textureDensity: 2 });

    // ------------------------------------------------------------------ straw stalks in the mouth
    const mouthZ = faceZ(0, 0.54);
    const stalk = (dy: number, tilt: number, len: number) =>
      sdf.capsule([-len * 0.5, dy - tilt, 0], [len * 0.5, dy + tilt, 0], 0.0055).at(0.01, 0.542, mouthZ + 0.012);
    const straw = sdf.union(stalk(0, 0.012, 0.19), stalk(0.007, -0.004, 0.17), stalk(-0.007, 0.02, 0.16), stalk(0.003, 0.03, 0.15), stalk(-0.004, -0.012, 0.18));
    k.body('straw', straw.bone('head'), { color: C.straw, roughness: 0.8, detail: 0.003 });

    // ------------------------------------------------------------------ hair under the hat
    const cap = sdf
      .ellipsoid([HEAD[0] + 0.012, HEAD[1] + 0.014, HEAD[2] + 0.012])
      .at(0, HEAD_Y + 0.008, -0.01)
      .smoothSubtract(0.015, sdf.ellipsoid([0.25, 0.155, 0.23]).at(0, 0.61, 0.14));
    // A thick swept fringe from under the brim, and sideburns.
    const fringe = sdf.chain(
      [
        [0.12, 0.8, 0.12, 0.045],
        [0.03, 0.79, 0.18, 0.05],
        [-0.07, 0.765, 0.19, 0.042],
        [-0.13, 0.72, 0.17, 0.026],
      ],
      0.02,
    );
    const sideburns = pair(sdf.cone([0.185, 0.73, 0.06], [0.195, 0.64, 0.08], 0.03, 0.012));
    const hair = sdf
      .smoothUnion(0.02, cap, fringe, sideburns)
      .paintFn((x, y, z, base) => (Math.sin(x * 60 + z * 25 - y * 30) > 0.85 ? rgb(C.hairDark) : base));
    k.body('hair', hair.bone('head'), { color: C.hair, roughness: 0.6, detail: 0.004 });

    // ------------------------------------------------------------------ straw hat: a round crown and a wide, soft brim
    // Local frame: the brim's center at the origin; the hat sits tilted back a little.
    const hatPose = (s: sdf.Shape) => s.rotateX(-8).at(0, 0.79, -0.015);
    const crown = sdf.ellipsoid([0.2, 0.13, 0.19]).at(0, 0.06, 0).intersect(sdf.halfSpace([0, -1, 0], -0.01));
    const brim = sdf
      .revolve(
        profile.polygon(
          [
            [0.12, 0.028],
            [0.24, 0.022],
            [0.33, 0.012],
            [0.355, -0.002],
            [0.34, -0.014],
            [0.24, -0.004],
            [0.12, 0.0],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.95]);
    const band = crown.round(0.006).smoothIntersect(0.004, sdf.box([0.6, 0.03, 0.6], 0.004).at(0, 0.032, 0));
    const weave = (x: number, y: number, z: number) => 0.0008 * Math.sin(Math.atan2(z, x) * 90) * Math.sin(Math.hypot(x, z) * 300 + y * 300);
    const hat = sdf
      .smoothUnion(0.02, crown, brim)
      .union(band.paint(C.hatBand))
      .paintFn((x, y, z, base) => (Math.sin(Math.atan2(z, x) * 40 + Math.hypot(x, z) * 60) > 0.85 && y < 0.02 ? rgb(C.strawDark) : base));
    k.body('hat', hatPose(hat).bone('head'), { color: C.straw, roughness: 0.85, bump: weave });

    // ------------------------------------------------------------------ plaid shirt
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
            [0.136, 0.21],
            [0.13, 0.196],
            [0, 0.196],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.8]);
    const sleeve = (s: V3, e: V3, tag: string) =>
      sdf
        .smoothUnion(
          0.012,
          sdf.cone([s[0] * 0.85, 0.405, 0], lerp(s, e, 1.02), 0.048, 0.045),
          sdf.cone(lerp(s, e, 0.9), lerp(s, e, 1.12), 0.05, 0.05).round(0.004), // rolled cuff
        )
        .bone(tag);
    const dark = rgb(C.plaidDark);
    const light = rgb(C.plaidLight);
    const plaid = (x: number, y: number, z: number) => {
      const u = Math.atan2(x, z) * 0.16 + x * 0.3;
      const a = Math.abs(Math.sin(y * 110)) < 0.25;
      const b = Math.abs(Math.sin(u * 110 + z * 20)) < 0.25;
      const thin = Math.abs(Math.sin(y * 110 + 1.4)) < 0.06 || Math.abs(Math.sin(u * 110 + z * 20 + 1.4)) < 0.06;
      return { a, b, thin };
    };
    const shirt = sdf
      .union(torso.bone('spine'), sleeve(SHOULDER, ELBOW_L, 'upperarm.L'), sleeve(mx(SHOULDER), ELBOW_R, 'upperarm.R'))
      .paintFn((x, y, z, base) => {
        const { a, b, thin } = plaid(x, y, z);
        if (a && b) return dark;
        if (a || b) return [base[0] * 0.8, base[1] * 0.75, base[2] * 0.75];
        return thin ? light : base;
      });
    k.body('shirt', shirt, { color: C.plaid, roughness: 0.85 });

    // ------------------------------------------------------------------ overalls: bib, straps, legs with patches and cuffs
    const bibOutline = profile.polygon(
      [
        [-0.075, 0.405],
        [0.075, 0.405],
        [0.1, 0.25],
        [-0.1, 0.25],
      ],
      { smooth: false },
    );
    const shell = (r: number) => torso.round(r).subtract(torso.round(0.001));
    const bib = shell(0.011).smoothIntersect(0.004, sdf.extrude(bibOutline, 0.6, 0.01).at(0, 0, 0.3)).intersect(sdf.halfSpace([0, 0, -1], 0));
    // The straps: from the bib's top corners over the shoulders, crossing to the back waist.
    const strapCols = sdf.union(sdf.box([0.03, 1, 1], 0.005).at(0.065, 0, 0), sdf.box([0.03, 1, 1], 0.005).at(-0.065, 0, 0));
    const straps = shell(0.013)
      .smoothIntersect(0.004, strapCols)
      .intersect(sdf.union(sdf.halfSpace([0, -1, 0], -0.39), sdf.halfSpace([0, 0, 1], 0).intersect(sdf.halfSpace([0, -1, 0], -0.24))));
    const waist = shell(0.011).smoothIntersect(0.006, sdf.box([0.5, 0.06, 0.5], 0.008).at(0, 0.225, 0));
    const pocket = sdf.extrude(profile.rect([0.07, 0.05], 0.01), 0.4).at(0, 0.34, 0.2);
    const legs = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.12, 0.06, 0.09]).at(0, 0.2, 0).bone('hips'),
      pair(
        sdf
          .smoothUnion(
            0.01,
            sdf.capsule([HIP[0], 0.2, 0], [0.096, 0.115, 0.004], 0.052),
            sdf.cylinder(0.058, 0.03, 0.012).at(0.096, 0.108, 0.004).paint(C.denimDark), // rolled cuff
          )
          .bone('leg.L'),
      ),
    );
    const patches = sdf.union(
      sdf.extrude(profile.rect([0.04, 0.034], 0.004), 0.4).rotateZ(8).at(0.09, 0.14, 0.2),
      sdf.extrude(profile.rect([0.036, 0.03], 0.004), 0.4).rotateZ(-6).at(-0.1, 0.16, 0.2),
    );
    const overalls = sdf
      .union(bib.bone('chest'), straps.bone('chest'), waist.bone('spine'), legs)
      .paintWhere(pocket.subtract(pocket.round(-0.005)), C.denimDark, 0.002)
      .paintWhere(patches, C.patch, 0.002)
      .paintFn((x, y, z, base) => (Math.sin((x + y) * 400) > 0.9 ? [base[0] * 0.92, base[1] * 0.92, base[2] * 0.95] : base)); // denim twill
    k.body('overalls', overalls, { color: C.denim, roughness: 0.85 });
    const buttons = hard(sdf.sphere(0.012).at(...sdf.surfacePoint(bib, [0.062, 0.392, 0.3], 0.004)));
    k.body('brass', buttons.bone('chest'), { color: C.brass, roughness: 0.35, metalness: 0.85, detail: 0.004 });

    // ------------------------------------------------------------------ boots
    const bootFoot = sdf
      .smoothUnion(0.035, sdf.cylinder(0.052, 0.085, 0.02).at(0, 0.052, 0), sdf.ellipsoid([0.06, 0.052, 0.104]).at(0, 0.048, 0.045))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const boot = bootFoot
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.016), C.sole)
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.6 });

    // ------------------------------------------------------------------ the pitchfork
    // Local frame: the grip at the origin, the haft along +Y, the tines at the top.
    const TOP = 0.62;
    const haft = sdf.capsule([0, -GRIP[1] + 0.02, 0], [0, TOP, 0], 0.016);
    const tine = (x: number) =>
      sdf.chain(
        [
          [x, TOP + 0.02, 0, 0.01],
          [x * 1.25, TOP + 0.1, 0.004, 0.009],
          [x * 1.25, TOP + 0.17, 0.012, 0.004],
        ],
        0.004,
      );
    const tines = sdf.union(
      sdf.capsule([-0.048, TOP + 0.02, 0], [0.048, TOP + 0.02, 0], 0.012),
      sdf.cone([0, TOP - 0.03, 0], [0, TOP + 0.03, 0], 0.016, 0.012), // the socket
      tine(-0.04),
      tine(0),
      tine(0.04),
    );
    const forkPose = (s: sdf.Shape) => s.rotateZ(4).at(...GRIP);
    k.body('fork-haft', forkPose(haft), { color: C.wood, roughness: 0.7, detail: 0.004, bone: 'hand.R' });
    k.body('fork-tines', forkPose(tines), { color: C.iron, roughness: 0.4, metalness: 0.75, detail: 0.003, bone: 'hand.R' });

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop } = motion;
    const LEG = 0.19;

    k.animation('idle', {
      duration: 2.4,
      pose: (_t, p) => ({
        hips: { move: [0, -0.003 * bump(p), 0] },
        chest: { rotate: [2.5 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        // A slow, easy look around, chewing on the straw.
        head: { rotate: [1.5 * wave(p, 3), 7 * wave(p, 1, 0.25), 2 * wave(p, 1, 0.1)] },
        'upperarm.L': { rotate: [2 * wave(p, 1, 0.1), 0, 3 * bump(p)] },
        'upperarm.R': { rotate: [1 * wave(p, 1, 0.1), 0, -1 * bump(p)] },
        'forearm.L': { rotate: [-5 * bump(p), 0, 0] },
      }),
    });

    const stride = (duration: number, legSwing: number, armSwing: number, lean: number, hop: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        return {
          hips: {
            move: [0, -legDrop(LEG, legSwing * s) + hop * bump(p, 2, 0.25), 0] as const,
            rotate: [0, 7 * s, 0] as const,
          },
          spine: { rotate: [lean, 0, 0] as const },
          chest: { rotate: [lean * 0.5, -10 * s, 0] as const },
          head: { rotate: [-lean, 5 * s, 0] as const },
          'leg.L': { rotate: [-legSwing * s, 0, 0] as const },
          'leg.R': { rotate: [legSwing * s, 0, 0] as const },
          'foot.L': { rotate: [legSwing * 0.55 * s + 12 * Math.max(0, -s), 0, 0] as const },
          'foot.R': { rotate: [-legSwing * 0.55 * s + 12 * Math.max(0, s), 0, 0] as const },
          'upperarm.L': { rotate: [armSwing * s, 0, 6] as const },
          // The fork arm swings little, so the fork stays clear of the ground and the legs.
          'upperarm.R': { rotate: [-armSwing * 0.25 * s, 0, -4] as const },
          'forearm.L': { rotate: [-armSwing * 0.5 - armSwing * 0.4 * Math.max(0, -s), 0, 0] as const },
          'hand.R': { rotate: [armSwing * 0.2 * s, 0, 0] as const },
        };
      },
    });
    k.animation('walk', stride(0.9, 24, 26, 3, 0));
    k.animation('run', stride(0.58, 36, 44, 10, 0.025));

    // Work: dig the fork in forward and low, lift a load, and toss it up and to the side.
    const ease = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    k.animation('work', {
      duration: 1.4,
      pose: (_t, p) => {
        const dig = ease(0, 0.3, p) * (1 - ease(0.45, 0.65, p));
        const toss = ease(0.45, 0.65, p) * (1 - ease(0.72, 1, p));
        return {
          hips: { move: [0, -0.012 * dig, 0], rotate: [0, -10 * dig + 16 * toss, 0] },
          spine: { rotate: [14 * dig - 6 * toss, 0, 0] },
          chest: { rotate: [4 * dig, 10 * dig - 14 * toss, 0] },
          head: { rotate: [-6 * dig + 4 * toss, 0, 0] },
          // Dig: the hand comes up and forward and the fork tips over, tines down into the hay.
          // Toss: the arm lifts high in front with the fork upright.
          // The three X angles add up to the fork's tilt: about 120 degrees in the dig, 15 in the toss.
          'upperarm.R': { rotate: [-35 * dig - 95 * toss, 0, 10 * toss] },
          'forearm.R': { rotate: [15 * dig - 30 * toss, 0, 0] },
          'hand.R': { rotate: [140 * (dig + toss), 0, 0] },
          'upperarm.L': { rotate: [-40 * dig - 30 * toss, 0, -20 * dig] },
          'forearm.L': { rotate: [-40 * dig - 30 * toss, 0, 0] },
        };
      },
    });
  },
});
