import { defineAsset, motion, profile, sdf } from '../src/index.js';

/**
 * Pixie swarm — Chibi Quest monster (catalog `monsters/small/pixie-swarm`), three tiny pixies that
 * fly as one unit, about 0.7 m tall and 0.8 m wide with the wings, faces +Z. Target:
 * docs/monster-mockups/pixie-swarm_001.jpg (made with mmx from the fairy sprite mockup).
 *
 * Role: a small fey nuisance of the meadows and the woods that comes in a group; the three pastel
 *   colors, the big baby heads, and the butterfly wings read at 128 px.
 * One idea: three baby pixies with big round bald heads, glossy dark eyes, rosy cheeks, and a leaf
 *   clip, in little rompers with straps, on pastel butterfly wings: a blue one in front, a pink one
 *   behind on the left, and a yellow one behind on the right, with sparkles around them.
 * Proportions: the front pixie is 0.42 m from its feet to its leaf clip (the head 0.21 m wide); the
 *   back pixies are 0.8 of that and float higher. In the rest pose the front pixie's feet touch the
 *   ground; the clips lift the swarm into a hover.
 * Shape language: round and soft (friendly); the wings and the four-point sparkles are the accents.
 * Palette (60/30/10): cream skin #f2dcb4; sky #8ec8d8, pink #f0a0c0, and yellow #f0d040 rompers,
 *   with paler wings in the same colors; glossy dark brown eyes and white sparkles as the accent.
 * Bodies: skin, eyes, rompers, wings, clips (the leaf clips), sparkles.
 * Rig: `swarm` (root); per pixie i (1 front, 2 left, 3 right) `body<i>`, `head<i>`, `arm<i>.L/R`,
 *   `wing<i>.L/R`; `spark1` to `spark4` on the root. Clips: idle (hover), fly, attack (the three
 *   dart forward in turn and throw their sparkles), hit, death (they drop and sit on the ground).
 */

type V3 = [number, number, number];

const C = {
  skin: '#f2dcb4',
  cheek: '#f4a49a',
  eye: '#2a1a14',
  brow: '#6a4028',
  mouth: '#8a2e34',
  spark: '#fff6c8',
};

/** Where each pixie stands and its size: the front one low, the two back ones higher and smaller. */
const PIXIES = [
  { slot: 'front', at: [0, 0, 0.1] as V3, s: 1, phase: 0 },
  { slot: 'left', at: [-0.25, 0.17, -0.12] as V3, s: 0.8, phase: 0.33 },
  { slot: 'right', at: [0.25, 0.25, -0.1] as V3, s: 0.8, phase: 0.66 },
] as const;

// The pixie in its own frame: feet on y = 0, the head center at 0.3.
const HEAD_C: V3 = [0, 0.3, 0];
const HEAD_R: V3 = [0.108, 0.098, 0.097];
const BODY_AT: V3 = [0, 0.12, 0];
const NECK: V3 = [0, 0.21, 0];
const SHOULDER: V3 = [0.056, 0.19, 0];
const WING_ROOT: V3 = [0.028, 0.18, -0.045];
const SPARKS: V3[] = [
  [0.2, 0.36, 0.22],
  [-0.17, 0.5, 0.14],
  [0.04, 0.66, -0.06],
  [-0.36, 0.14, 0.02],
];
const HOVER = 0.12;

export default defineAsset({
  name: 'pixie-swarm',
  description: 'Chibi pixie swarm monster: three tiny baby pixies with big round heads, glossy dark eyes, rosy cheeks, and leaf clips, in sky blue, pink, and yellow rompers on pastel butterfly wings, flying together with sparkles around them.',
  detail: 0.004,
  reference: 'docs/monster-mockups/pixie-swarm_001.jpg',
  variants: {
    skin: { cream: C.skin, peach: '#f4c8a4', tan: '#d8a47a' },
    front: { sky: '#8ec8d8', mint: '#9ad4a8', lilac: '#b8a4e0' },
    left: { pink: '#f0a0c0', peach: '#f4b490', lilac: '#c8a8e8' },
    right: { yellow: '#f0d040', mint: '#a8dca0', sky: '#a0c4f0' },
  },
  presets: {
    meadow: { skin: 'peach', front: 'mint', left: 'peach', right: 'yellow' },
    twilight: { skin: 'tan', front: 'lilac', left: 'pink', right: 'sky' },
  },

  build(k) {
    const skin = k.tint('skin');
    const cheek = k.tint('skin', { color: C.cheek, follow: 0.5 });

    // Each pixie's frame: scale and move a local point or shape into the swarm.
    const frames = PIXIES.map((px, n) => {
      const i = n + 1;
      const put = (p: V3): V3 => [px.at[0] + p[0] * px.s, px.at[1] + p[1] * px.s, px.at[2] + p[2] * px.s];
      const place = (sh: sdf.Shape) => sh.scale(px.s).at(...px.at);
      return { ...px, i, put, place, color: k.tint(px.slot), wing: k.tint(px.slot, 0.12) };
    });

    const bones: Record<string, Parameters<typeof k.skeleton>[0][string]> = { swarm: { at: [0, 0.2, 0] } };
    for (const f of frames) {
      const mxp = (p: V3): V3 => [-p[0], p[1], p[2]];
      bones[`body${f.i}`] = { parent: 'swarm', at: f.put(BODY_AT) };
      bones[`head${f.i}`] = { parent: `body${f.i}`, at: f.put(NECK), tail: f.put([0, 0.4, 0]) };
      bones[`arm${f.i}.L`] = { parent: `body${f.i}`, at: f.put(SHOULDER), tail: f.put([0.04, 0.152, 0.078]) };
      bones[`arm${f.i}.R`] = { parent: `body${f.i}`, at: f.put(mxp(SHOULDER)), tail: f.put([-0.04, 0.152, 0.078]) };
      bones[`wing${f.i}.L`] = { parent: `body${f.i}`, at: f.put(WING_ROOT), tail: f.put([0.16, 0.26, -0.1]) };
      bones[`wing${f.i}.R`] = { parent: `body${f.i}`, at: f.put(mxp(WING_ROOT)), tail: f.put([-0.16, 0.26, -0.1]) };
    }
    SPARKS.forEach((p, j) => (bones[`spark${j + 1}`] = { parent: 'swarm', at: p }));
    k.skeleton(bones);

    // ------------------------------------------------------------------ one pixie, in its own frame
    const head = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid(HEAD_R).at(...HEAD_C),
      sdf.ellipsoid([0.075, 0.05, 0.07]).at(0, 0.255, 0.025), // full baby cheeks and chin
    );
    const ears = sdf.ellipsoid([0.018, 0.026, 0.016]).at(0.104, 0.285, 0.0).mirror('x');
    const nose = sdf.ellipsoid([0.013, 0.011, 0.011]).at(...sdf.surfacePoint(head, [0, 0.272, 0.2], -0.003));
    const torso = sdf.smoothUnion(0.02, sdf.ellipsoid([0.06, 0.068, 0.054]).at(0, 0.14, 0.005), sdf.capsule([0, 0.18, 0], NECK, 0.03));
    const armL = sdf.smoothUnion(
      0.012,
      sdf.cone(SHOULDER, [0.066, 0.14, 0.03], 0.02, 0.017),
      sdf.cone([0.066, 0.14, 0.03], [0.045, 0.15, 0.07], 0.017, 0.015),
      sdf.sphere(0.021).at(0.04, 0.152, 0.078),
    );
    // The legs sit in the air: the thighs forward, the shins down, the soles to the front.
    const leg = sdf.smoothUnion(
      0.012,
      sdf.cone([0.032, 0.1, 0.01], [0.036, 0.08, 0.075], 0.024, 0.021),
      sdf.cone([0.036, 0.08, 0.075], [0.038, 0.03, 0.085], 0.021, 0.019),
      sdf.ellipsoid([0.022, 0.03, 0.019]).at(0.039, 0.025, 0.1),
    );
    const eyeAt = sdf.surfacePoint(head, [0.058, 0.29, 0.2], -0.009);
    const browArc = sdf.extrude(profile.arc(0.022, 0.006, 60, 120), 0.3).at(eyeAt[0], eyeAt[1] + 0.004, 0);
    const smile = sdf.extrude(profile.arc(0.026, 0.0075, 238, 302), 0.3).at(0, 0.275, 0);
    const cheeks = sdf.sphere(0.024).at(0.07, 0.258, 0.08).mirror('x');

    const skinLocal = (i: number) =>
      sdf.smoothUnion(
        0.02,
        sdf.smoothUnion(0.006, head, ears, nose).bone(`head${i}`),
        torso.bone(`body${i}`),
        armL.bone(`arm${i}.L`).mirror('x'),
        leg.mirror('x').bone(`body${i}`),
      )
        .paintWhere(cheeks, cheek, 0.012)
        .paintWhere(browArc.mirror('x').intersect(sdf.halfSpace([0, 0, -1], -0.05)), C.brow, 0.002)
        .paintWhere(smile.intersect(sdf.halfSpace([0, 0, -1], -0.05)), C.mouth, 0.002);

    const eyesLocal = (i: number) =>
      sdf
        .sphere(0.016)
        .at(...eyeAt)
        .paintWhere(sdf.sphere(0.0065).at(eyeAt[0] + 0.006, eyeAt[1] + 0.008, eyeAt[2] + 0.014), '#ffffff', 0.001)
        .mirror('x')
        .bone(`head${i}`);

    // The romper: a shell over the hips and the belly, two straps over the shoulders, and a button.
    const romperLocal = (i: number) =>
      sdf
        .smoothUnion(
          0.006,
          torso.round(0.007).intersect(sdf.box([0.3, 0.1, 0.3]).at(0, 0.105, 0)),
          leg.round(0.007).intersect(sdf.box([0.3, 0.05, 0.3]).at(0, 0.085, 0)).intersect(sdf.box([0.3, 0.3, 0.06]).at(0, 0, 0.02)).mirror('x'),
          sdf.capsule([0.026, 0.155, 0.055], [0.036, 0.205, 0.02], 0.007).mirror('x'),
          sdf.capsule([0.036, 0.205, 0.02], [0.036, 0.2, -0.035], 0.007).mirror('x'),
          sdf.sphere(0.013).at(0, 0.158, 0.06),
        )
        .bone(`body${i}`);

    // A butterfly wing: a big upper lobe and a smaller lower lobe, thin, with a pale dot on each lobe,
    // swept back from the shoulder blade (built in the wing frame: X out, Y up).
    const lobes = sdf.smoothUnion(
      0.02,
      sdf.ellipsoid([0.075, 0.055, 0.006]).rotateZ(28).at(0.07, 0.05, 0),
      sdf.ellipsoid([0.05, 0.04, 0.006]).rotateZ(-30).at(0.055, -0.035, 0),
      sdf.ellipsoid([0.02, 0.03, 0.007]).at(0.01, 0, 0),
    );
    const dots = sdf.union(sdf.sphere(0.012).at(0.1, 0.075, 0), sdf.sphere(0.009).at(0.07, -0.045, 0));
    const wingLocal = (i: number) => lobes.paintWhere(dots, '#fbf6ee', 0.002).scale(1.3).rotateY(-22).rotateX(-10).at(...WING_ROOT).bone(`wing${i}.L`).mirror('x');

    // A leaf clip on the right of the head.
    const clipAt = sdf.surfacePoint(head, [0.07, 0.4, 0.02], -0.004);
    const clipLocal = (i: number) =>
      sdf
        .smoothUnion(
          0.004,
          sdf.ellipsoid([0.03, 0.011, 0.018]).rotateZ(35).at(clipAt[0] + 0.014, clipAt[1] + 0.012, clipAt[2]),
          sdf.ellipsoid([0.022, 0.009, 0.014]).rotateZ(70).rotateY(50).at(clipAt[0] - 0.004, clipAt[1] + 0.016, clipAt[2] + 0.01),
        )
        .bone(`head${i}`);

    // ------------------------------------------------------------------ the three pixies
    const all = (fn: (f: (typeof frames)[number]) => sdf.Shape) => sdf.union(...frames.map(fn));
    const colored = (fn: (i: number) => sdf.Shape, color: (f: (typeof frames)[number]) => string) => all((f) => f.place(fn(f.i)).paint(color(f)));
    k.body('skin', all((f) => f.place(skinLocal(f.i))), { color: skin, roughness: 0.6, textureDensity: 2 });
    k.body('eyes', all((f) => f.place(eyesLocal(f.i))), { color: C.eye, roughness: 0.12, detail: 0.003 });
    k.body('rompers', colored(romperLocal, (f) => f.color), { color: frames[0]!.color, roughness: 0.65 });
    k.body('wings', colored(wingLocal, (f) => f.wing), { color: frames[0]!.wing, roughness: 0.5, detail: 0.003 });
    k.body('clips', colored(clipLocal, (f) => f.color), { color: frames[0]!.color, roughness: 0.55, detail: 0.003 });

    // Four-point sparkles around the swarm.
    const star = sdf.union(sdf.ellipsoid([0.022, 0.005, 0.005]), sdf.ellipsoid([0.005, 0.022, 0.005]), sdf.sphere(0.007));
    k.body('sparkles', sdf.union(...SPARKS.map((p, j) => star.rotateZ(j * 20).at(...p).bone(`spark${j + 1}`))), {
      color: C.spark,
      emissive: C.spark,
      emissiveIntensity: 1.6,
      roughness: 0.3,
      detail: 0.002,
    });

    // ------------------------------------------------------------------ animation
    const { wave, keys } = motion;
    type Pose = Record<string, { rotate?: V3; move?: V3; scale?: V3 }>;

    /** One pixie bobbing on its own phase: wings beat (fast), the head tilts, the arms sway. */
    const pixiePose = (f: (typeof frames)[number], p: number, beats: number, flapAmp = 38): Pose => {
      const q = p + f.phase;
      const flap = flapAmp * (0.5 + 0.5 * wave(q, beats));
      return {
        [`body${f.i}`]: { move: [0, 0.025 * wave(q, 1), 0], rotate: [4, 0, 5 * wave(q, 1, 0.25)] },
        [`head${f.i}`]: { rotate: [3 * wave(q, 1, 0.3), 6 * wave(q, 1, 0.1), -6 * wave(q, 1, 0.2)] },
        [`arm${f.i}.L`]: { rotate: [8 * wave(q, 1, 0.4), 0, 6 + 4 * wave(q, 1)] },
        [`arm${f.i}.R`]: { rotate: [8 * wave(q, 1, 0.9), 0, -6 - 4 * wave(q, 1)] },
        [`wing${f.i}.L`]: { rotate: [0, flap, 0] },
        [`wing${f.i}.R`]: { rotate: [0, -flap, 0] },
      };
    };
    const sparkPose = (p: number, out = 0): Pose =>
      Object.fromEntries(
        SPARKS.map((_, j) => {
          const tw = 0.75 + 0.35 * wave(p, 2, j * 0.27);
          return [`spark${j + 1}`, { move: [0.02 * wave(p, 1, j * 0.3), 0.03 * wave(p, 1, j * 0.21) + 0.1 * out, 0.3 * out], rotate: [0, 0, 40 * p + j * 20], scale: [tw, tw, tw] }];
        }),
      );

    // Idle: the swarm hovers; each pixie bobs on its own phase, and the sparkles twinkle.
    k.animation('idle', {
      duration: 1.2,
      pose: (_t, p) => ({
        swarm: { move: [0, HOVER + 0.015 * wave(p, 1), 0] },
        ...Object.assign({}, ...frames.map((f) => pixiePose(f, p, 4))),
        ...sparkPose(p),
      }),
    });

    // Fly: the swarm leans forward and weaves; faster wing beats.
    k.animation('fly', {
      duration: 0.8,
      pose: (_t, p) => ({
        swarm: { move: [0.03 * wave(p, 1), HOVER + 0.03 * wave(p, 2), 0], rotate: [10, 6 * wave(p, 1, 0.25), 0] },
        ...Object.assign({}, ...frames.map((f) => pixiePose(f, p, 4, 46))),
        ...sparkPose(p),
      }),
    });

    // Attack: the pixies dart forward one after another (front, left, right), throw both arms
    // forward, and fly back; the sparkles shoot forward and come back.
    k.animation('attack', {
      duration: 1.1,
      loop: false,
      pose: (_t, p) => {
        const pose: Pose = { swarm: { move: [0, HOVER, 0] } };
        for (const f of frames) {
          const d = keys(p, [[0, 0], [0.1 + f.phase * 0.3, -0.3], [0.22 + f.phase * 0.3, 1], [0.34 + f.phase * 0.3, 0.8], [0.6 + f.phase * 0.3, 0], [1, 0]]);
          const base = pixiePose(f, p, 6, 44);
          pose[`body${f.i}`] = { move: [0, 0.04 * Math.max(0, d), 0.22 * d], rotate: [4 + 18 * d, 0, 0] };
          pose[`head${f.i}`] = { rotate: [-10 * d, 0, 0] };
          pose[`arm${f.i}.L`] = { rotate: [-80 * Math.max(0, d) + 20 * Math.min(0, d), 0, 6] };
          pose[`arm${f.i}.R`] = { rotate: [-80 * Math.max(0, d) + 20 * Math.min(0, d), 0, -6] };
          pose[`wing${f.i}.L`] = base[`wing${f.i}.L`]!;
          pose[`wing${f.i}.R`] = base[`wing${f.i}.R`]!;
        }
        return { ...pose, ...sparkPose(p, keys(p, [[0, 0], [0.25, 0], [0.45, 1], [0.7, 0.4], [1, 0]])) };
      },
    });

    // Hit: the swarm jolts back, the pixies flinch with their wings closed, then hover again.
    k.animation('hit', {
      duration: 0.5,
      loop: false,
      pose: (_t, p) => {
        const h = keys(p, [[0, 0], [0.15, 1], [0.4, 0.7], [1, 0]]);
        const pose: Pose = { swarm: { move: [0, HOVER + 0.02 * h, -0.08 * h], rotate: [-12 * h, 0, 6 * h] } };
        for (const f of frames) {
          const base = pixiePose(f, p, 4);
          pose[`body${f.i}`] = { move: [0, 0, 0], rotate: [4 - 14 * h, 0, (f.i === 2 ? 1 : -1) * 10 * h] };
          pose[`head${f.i}`] = { rotate: [-14 * h, 0, 0] };
          pose[`arm${f.i}.L`] = { rotate: [-50 * h, 0, 30 * h] };
          pose[`arm${f.i}.R`] = { rotate: [-50 * h, 0, -30 * h] };
          pose[`wing${f.i}.L`] = { rotate: [0, (1 - h) * base[`wing${f.i}.L`]!.rotate![1] + 55 * h, 0] };
          pose[`wing${f.i}.R`] = { rotate: [0, -((1 - h) * base[`wing${f.i}.L`]!.rotate![1] + 55 * h), 0] };
        }
        return { ...pose, ...sparkPose(p) };
      },
    });

    // Death: the wings stop, the pixies spin a little and drop, land with a bounce, and sit on the
    // ground side by side in a row, dazed, with the heads and wings drooping; the sparkles fade and fall.
    k.animation('death', {
      duration: 1.5,
      loop: false,
      pose: (_t, p) => {
        const fall = keys(p, [[0, 0], [0.12, -0.15], [0.5, 1], [0.58, 0.92], [0.66, 1]]);
        const pose: Pose = { swarm: { move: [0, HOVER * (1 - fall), 0] } };
        for (const f of frames) {
          const drop = keys(p, [[0.12 + f.phase * 0.1, 0], [0.5 + f.phase * 0.1, 1], [0.58 + f.phase * 0.1, 0.94], [0.66 + f.phase * 0.1, 1]]);
          const spin = keys(p, [[0.1, 0], [0.5 + f.phase * 0.1, 1]]);
          const flap = keys(p, [[0, 1], [0.15, 0]]) * 38 * (0.5 + 0.5 * wave(p, 6));
          pose[`body${f.i}`] = { move: [0.05 * Math.sign(f.at[0]) * drop, -f.at[1] * drop, (0.1 - f.at[2]) * drop], rotate: [6 * drop, 360 * spin * (f.i === 3 ? -1 : 1), 0] };
          pose[`head${f.i}`] = { rotate: [16 * drop, 0, (f.i === 2 ? 12 : -12) * drop] };
          pose[`arm${f.i}.L`] = { rotate: [-20 * drop, 0, 10 * drop] };
          pose[`arm${f.i}.R`] = { rotate: [-20 * drop, 0, -10 * drop] };
          pose[`wing${f.i}.L`] = { rotate: [0, flap - 20 * drop, -25 * drop] };
          pose[`wing${f.i}.R`] = { rotate: [0, -flap + 20 * drop, 25 * drop] };
        }
        const fade = keys(p, [[0.2, 1], [0.8, 0.25]]);
        for (let j = 0; j < SPARKS.length; j++) {
          pose[`spark${j + 1}`] = { move: [0, -0.3 * (1 - fade), 0], scale: [fade, fade, fade] };
        }
        return pose;
      },
    });
  },
});
