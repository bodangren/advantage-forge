import { defineAsset, mixRgb, motion, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Mimic — Chibi Quest dungeon monster: the treasure chest (assets/treasure-chest.ts) come alive.
 * About 0.72 m wide and 0.85 m to the top of its open lid, faces +Z. Target:
 * docs/monster-mockups/mimic_001.jpg (made with mmx, with the chest render as the reference).
 *
 * Role: a trap enemy that waits as loot, seen in 3D and as a 128 px sprite; closed it must match
 *   the real chest, open the teeth, the eyes, and the tongue must read.
 * One idea: the same plank-and-iron chest, its lid gaping like a jaw full of big white fangs, two
 *   glowing yellow eyes under the lid, and a fat purple tongue lolling over the front.
 * Proportions: the chest's body (0.72 x 0.46 x 0.3) on stubby iron claw feet (lifted 0.08); the
 *   lid open 62 degrees at rest; corner fangs 0.12 long, the other teeth 0.05 to 0.07.
 * Shape language: the chest's square, sturdy block, broken by sharp triangles (teeth, claws) and
 *   one soft, round form (the tongue).
 * Palette (60/30/10): the chest's wood #7d4a27 and iron #3d4047; a dark maroon mouth #4a1216 and
 *   red flesh #a8242a; ivory teeth #f2ead8; a lavender tongue #c070c8 and yellow eyes #ffc21a as
 *   the accents, with the gold lock.
 * Value plan: the light teeth and the glowing eyes on the dark mouth are the strongest contrast
 *   (focal point); the tongue is the second.
 * Bodies: chest-wood, iron, lid-wood, lid-iron, lock, mouth (flesh), teeth, tongue, eyes, pupils, feet.
 * Rig: base, body, lid, teeth.upper, teeth.lower, tongue1-3, fleg/bleg.L/R. Clips: idle (the lid
 *   breathes, the tongue sways), walk (a waddle on four feet), attack (open wide, lunge, slam),
 *   reveal (a closed chest rattles, then springs open).
 */

type V3 = readonly [number, number, number];

const W = 0.72; // width (X)
const D = 0.46; // depth (Z)
const H = 0.3; // body height
const LIFT = 0.08; // the feet lift the chest
const TOP = LIFT + H;
const LID_R = D / 2;
const HINGE: V3 = [0, TOP, -D / 2];
const OPEN = 62; // degrees the lid stands open in the rest pose

/** Moves a point of the closed lid to where it is in the open rest pose. */
const lidPoint = (p: V3): V3 => {
  const t = (-OPEN * Math.PI) / 180;
  const y = p[1] - HINGE[1];
  const z = p[2] - HINGE[2];
  return [p[0], HINGE[1] + y * Math.cos(t) - z * Math.sin(t), HINGE[2] + y * Math.sin(t) + z * Math.cos(t)];
};
const lidPose = (s: sdf.Shape) => s.at(0, -HINGE[1], -HINGE[2]).rotateX(-OPEN).at(...HINGE);

const wood = rgb('#7d4a27');
const woodDark = rgb('#4e2c13');
const C = {
  iron: '#3d4047',
  gold: '#d9a93a',
  mouth: '#4a1216',
  flesh: '#a8242a',
  tooth: '#f2ead8',
  toothBase: '#d8c8a8',
  tongue: '#c070c8',
  tongueDark: '#94489c',
  eye: '#ffc21a',
  pupil: '#1a0e08',
};

/** Planks: horizontal boards with dark gaps and a per-board tint, plus grain (the chest's). */
const planks =
  (boardHeight: number, axis: 'y' | 'x') =>
  (x: number, y: number, z: number): readonly [number, number, number] => {
    const v = axis === 'y' ? y : x;
    const board = Math.floor(v / boardHeight);
    const f = v / boardHeight - board;
    const gap = f < 0.06 || f > 0.94 ? 0.75 : 0;
    const tint = noise.random(board, 3) * 0.35;
    const grain = 0.5 + 0.5 * noise.noise3(x * 6, y * 60, z * 6 + board);
    return mixRgb(wood, woodDark, Math.min(1, 0.15 + tint + 0.25 * grain + gap));
  };

const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};
const along = (p: V3, d: V3, s: number): V3 => [p[0] + d[0] * s, p[1] + d[1] * s, p[2] + d[2] * s];

/** A tooth from `base` along `dir`; a curved fang bends its tip toward `bend`. */
const tooth = (base: V3, dir: V3, len: number, r: number, bend: V3 = [0, 0, 0]) => {
  const mid = along(along(base, dir, len * 0.5), bend, len * 0.15);
  const tip = along(along(base, dir, len), bend, len * 0.45);
  return sdf.chain(
    [
      [...base, r],
      [...mid, r * 0.62],
      [...tip, 0.003],
    ],
    0.004,
  );
};

const FEET: V3[] = [
  [W / 2 - 0.07, LIFT, D / 2 - 0.07],
  [-(W / 2 - 0.07), LIFT, D / 2 - 0.07],
  [W / 2 - 0.07, LIFT, -(D / 2 - 0.07)],
  [-(W / 2 - 0.07), LIFT, -(D / 2 - 0.07)],
];
const FEET_BONES = ['fleg.L', 'fleg.R', 'bleg.L', 'bleg.R'];

// The tongue: from the flesh inside, over the front rim, and down the front; the tip curls out.
const TONGUE: [number, number, number, number][] = [
  [-0.05, TOP - 0.05, -0.04, 0.042],
  [-0.08, TOP + 0.025, 0.1, 0.042],
  [-0.1, TOP + 0.036, 0.215, 0.04],
  [-0.11, TOP - 0.035, 0.29, 0.039],
  [-0.11, TOP - 0.14, 0.296, 0.036],
  [-0.1, TOP - 0.23, 0.29, 0.03],
  [-0.085, TOP - 0.268, 0.314, 0.022],
  [-0.08, TOP - 0.25, 0.338, 0.015],
];

export default defineAsset({
  name: 'mimic',
  description: 'Chibi mimic dungeon monster: the treasure chest come alive, its lid a gaping jaw of big white fangs, glowing yellow eyes under the lid, a fat purple tongue, and iron claw feet.',
  detail: 0.006,
  reference: 'docs/monster-mockups/mimic_001.jpg',

  build(k) {
    const LID_FRONT = lidPoint([0, TOP, D / 2 - 0.02]);
    k.skeleton({
      base: { at: [0, 0, 0] },
      body: { parent: 'base', at: [0, LIFT, 0] },
      lid: { parent: 'body', at: HINGE },
      'teeth.upper': { parent: 'lid', at: LID_FRONT },
      'teeth.lower': { parent: 'body', at: [0, TOP, D / 2 - 0.04] },
      tongue1: { parent: 'body', at: [TONGUE[0]![0], TONGUE[0]![1], TONGUE[0]![2]] },
      tongue2: { parent: 'tongue1', at: [TONGUE[2]![0], TONGUE[2]![1], TONGUE[2]![2]] },
      tongue3: { parent: 'tongue2', at: [TONGUE[3]![0], TONGUE[3]![1], TONGUE[3]![2]], tail: [TONGUE[7]![0], TONGUE[7]![1], TONGUE[7]![2]] },
      ...Object.fromEntries(FEET.map((f, i) => [FEET_BONES[i]!, { parent: 'body', at: [f[0], LIFT + 0.02, f[2]] as V3 }])),
    });

    // ------------------------------------------------------------------ body: the chest's open box, lifted
    const outer = sdf.box([W, H, D], 0.018).at(0, LIFT + H / 2, 0);
    const hollow = sdf.box([W - 0.07, H, D - 0.07], 0.01).at(0, LIFT + H / 2 + 0.05, 0);
    const body = outer
      .subtract(hollow)
      .displace(0.0025, (x, y, z) => noise.fbm(x * 30, y * 30, z * 30, 2))
      .paintFn((x, y, z) => planks(0.075, 'y')(x, y - LIFT, z))
      .paintWhere(hollow.round(0.004), C.mouth, 0.01);
    k.body('chest-wood', body, { color: '#8a5530', roughness: 0.8, bone: 'body' });

    // Iron: corner guards wrap each vertical edge; two straps run over the front and back.
    const shellOf = (s: sdf.Shape, t: number) => s.round(t).subtract(s.round(-0.002));
    const skin = shellOf(outer, 0.009);
    const corners = skin.intersect(
      sdf
        .box([0.11, H + 0.02, 0.11], 0.01)
        .at(W / 2, LIFT + H / 2, D / 2)
        .mirror('x', 0)
        .mirror('z', 0),
    );
    const straps = skin.intersect(
      sdf
        .box([0.06, H + 0.02, D + 0.1], 0.01)
        .at(W * 0.3, LIFT + H / 2, 0)
        .mirror('x', 0),
    );
    const studs = sdf.union(
      ...[0.06, 0.15, 0.24].flatMap((y) => [W * 0.3, W / 2 - 0.035].map((x) => sdf.sphere(0.011).at(x, LIFT + y, D / 2 + 0.008))),
    );
    // Below the rim only: the box's top face is the open mouth.
    const belowRim = sdf.halfSpace([0, 1, 0], TOP - 0.004);
    k.body('iron', sdf.union(corners.intersect(belowRim), straps.intersect(belowRim), studs.mirror('x', 0)).mirror('z', 0), {
      color: C.iron,
      roughness: 0.42,
      metalness: 0.85,
      bone: 'body',
    });

    // ------------------------------------------------------------------ lid: the chest's half cylinder, opened on its hinge
    const arc = (r: number, ry: number, drop: number) =>
      profile.polygon(
        Array.from({ length: 25 }, (_, i) => {
          const a = (Math.PI * i) / 24;
          return [Math.cos(a) * r, Math.sin(a) * ry - drop] as [number, number];
        }),
      );
    const lidSolid = sdf.extrude(arc(LID_R, LID_R * 0.72, 0), W, 0.018).rotateY(90).at(0, TOP, 0);
    const lidHollow = sdf
      .extrude(arc(LID_R - 0.035, LID_R * 0.72 - 0.035, 0.02), W - 0.07, 0.01)
      .rotateY(90)
      .at(0, TOP, 0);
    // The planks first, then the dark mouth inside (paintFn replaces every earlier color).
    const lid = lidSolid
      .subtract(lidHollow)
      .displace(0.0025, (x, y, z) => noise.fbm(x * 30, y * 30, z * 30, 2))
      .paintFn((x, y, z) => {
        const angle = Math.atan2((y - TOP) / 0.72, z);
        return planks(0.26, 'y')(x, angle * 0.5, z);
      })
      .paintWhere(lidHollow.round(0.004), C.mouth, 0.01);
    k.body('lid-wood', lidPose(lid), { color: '#8a5530', roughness: 0.8, bone: 'lid' });
    // Only the dome: the open underside of the lid has no bands.
    const lidBands = shellOf(lidSolid, 0.009).intersect(sdf.halfSpace([0, -1, 0], -(TOP + 0.004))).intersect(
      sdf.union(
        sdf
          .box([0.06, 0.4, D + 0.1], 0.01)
          .at(W * 0.3, TOP + 0.1, 0)
          .mirror('x', 0),
        sdf
          .box([0.05, 0.4, D + 0.1], 0.01)
          .at(W / 2 - 0.06, TOP + 0.1, 0)
          .mirror('x', 0),
      ),
    );
    k.body('lid-iron', lidPose(lidBands), { color: C.iron, roughness: 0.42, metalness: 0.85, bone: 'lid' });
    const lock = sdf
      .extrude(
        profile.polygon(
          [
            [0, 0.07],
            [0.055, 0.05],
            [0.06, -0.02],
            [0, -0.075],
            [-0.06, -0.02],
            [-0.055, 0.05],
          ],
          { smooth: true },
        ),
        0.02,
        0.006,
      )
      .at(0, TOP - 0.01, D / 2 + 0.012)
      .paintWhere(sdf.extrude(profile.rect([0.012, 0.03], 0.006), 0.1).at(0, TOP - 0.025, D / 2), '#1a1206')
      .paintWhere(sdf.sphere(0.011).at(0, TOP - 0.004, D / 2 + 0.03), '#1a1206');
    k.body('lock', lidPose(lock), { color: C.gold, roughness: 0.3, metalness: 1, bone: 'lid' });

    // ------------------------------------------------------------------ mouth: red flesh inside the chest
    const flesh = sdf
      .ellipsoid([W / 2 - 0.05, 0.075, D / 2 - 0.05])
      .at(0, TOP - 0.06, -0.01)
      .displace(0.012, (x, y, z) => noise.fbm(x * 18, y * 18, z * 18, 3))
      .intersect(hollow.round(-0.002));
    k.body('mouth', flesh.bone('body'), { color: C.flesh, roughness: 0.45, bump: (x, y, z) => 0.0008 * noise.fbm(x * 60, y * 60, z * 60, 2) });

    // ------------------------------------------------------------------ teeth
    // Upper: along the lid's front edge, pointing down and a little forward; big fangs at the corners.
    const downFwd = norm([0, -0.87, 0.5]);
    const upperTeeth = sdf.union(
      ...[-0.2, -0.12, -0.04, 0.04, 0.12, 0.2].map((x, i) =>
        tooth(lidPoint([x, TOP + 0.004, D / 2 - 0.022]), downFwd, i === 0 || i === 5 ? 0.075 : 0.065, 0.026),
      ),
      ...[-0.29, 0.29].map((x) => tooth(lidPoint([x, TOP + 0.004, D / 2 - 0.024]), downFwd, 0.13, 0.034, [-Math.sign(x) * 0.2, 0, 0.6])),
    );
    // Lower: along the front rim, pointing up; the tongue passes through the gap on the right side.
    const upFwd = norm([0, 0.95, 0.3]);
    const lowerTeeth = sdf.union(
      ...[-0.2, 0.0, 0.1, 0.2].map((x) => tooth([x, TOP - 0.006, D / 2 - 0.042], upFwd, 0.055, 0.024)),
      ...[-0.29, 0.29].map((x) => tooth([x, TOP - 0.006, D / 2 - 0.044], upFwd, 0.12, 0.032, [-Math.sign(x) * 0.15, 0, 0.2])),
    );
    k.body(
      'teeth',
      sdf.union(upperTeeth.bone('teeth.upper'), lowerTeeth.bone('teeth.lower')).paintFn((x, y, z, base) => base),
      { color: C.tooth, roughness: 0.3, detail: 0.004 },
    );

    // ------------------------------------------------------------------ tongue: two lobes with a groove down the middle
    const tongueBones = ['tongue1', 'tongue1', 'tongue2', 'tongue3', 'tongue3', 'tongue3', 'tongue3'];
    const lobe = (dx: number) =>
      sdf.smoothUnion(
        0.012,
        ...TONGUE.slice(0, -1).map((a, i) => {
          const b = TONGUE[i + 1]!;
          return sdf
            .chain(
              [
                [a[0] + dx, a[1], a[2], a[3]],
                [b[0] + dx, b[1], b[2], b[3]],
              ],
              0.004,
            )
            .bone(tongueBones[i]!);
        }),
      );
    const tongue = sdf
      .smoothUnion(0.02, lobe(0.026), lobe(-0.026))
      .paintFn((x, _y, _z, base) => (Math.abs(x + 0.1) < 0.007 ? [base[0] * 0.78, base[1] * 0.7, base[2] * 0.8] : base));
    k.body('tongue', tongue, { color: C.tongue, roughness: 0.3, bump: (x, y, z) => 0.0006 * noise.fbm(x * 90, y * 90, z * 90, 2) });

    // ------------------------------------------------------------------ eyes: glowing yellow ovals under the lid, slit pupils
    const EYE_X = 0.15;
    const eyeC = lidPoint([EYE_X, TOP + 0.05, 0.03]);
    const eyes = sdf.union(...[1, -1].map((s) => sdf.ellipsoid([0.05, 0.064, 0.04]).at(s * eyeC[0], eyeC[1], eyeC[2])));
    k.body('eyes', eyes.bone('lid'), { color: C.eye, roughness: 0.25, emissive: C.eye, emissiveIntensity: 0.6 });
    const pupils = sdf.union(
      ...[1, -1].map((s) =>
        sdf
          .ellipsoid([0.012, 0.038, 0.01])
          .at(s * (eyeC[0] - 0.012), eyeC[1] - 0.004, eyeC[2] + 0.034)
          .paintWhere(sdf.sphere(0.008).at(s * (eyeC[0] - 0.004) + 0.012, eyeC[1] + 0.024, eyeC[2] + 0.04), '#ffffff', 0.002),
      ),
    );
    k.body('pupils', pupils.bone('lid'), { color: C.pupil, roughness: 0.2, detail: 0.003 });

    // ------------------------------------------------------------------ feet: stubby iron claws under the corners
    const foot = (f: V3) =>
      sdf.smoothUnion(
        0.012,
        sdf.cylinder(0.04, 0.05, 0.012).at(f[0], LIFT - 0.012, f[2]),
        sdf.ellipsoid([0.05, 0.03, 0.05]).at(f[0], 0.03, f[2] + 0.01),
        ...[-0.03, 0, 0.03].map((dx) =>
          sdf.chain(
            [
              [f[0] + dx, 0.03, f[2] + 0.03, 0.017],
              [f[0] + dx * 1.3, 0.022, f[2] + 0.07, 0.012],
              [f[0] + dx * 1.4, 0.002, f[2] + 0.088, 0.004],
            ],
            0.004,
          ),
        ),
      );
    k.body('feet', sdf.union(...FEET.map((f, i) => foot(f).bone(FEET_BONES[i]!))), { color: C.iron, roughness: 0.45, metalness: 0.8 });

    // ------------------------------------------------------------------ animation
    const { wave, bump } = motion;
    const ease = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };

    // Idle: the lid breathes, the tongue sways, the eyes (on the lid) bob.
    k.animation('idle', {
      duration: 2.2,
      pose: (_t, p) => ({
        body: { scale: [1 + 0.01 * bump(p), 1 - 0.012 * bump(p), 1 + 0.01 * bump(p)] },
        lid: { rotate: [-5 * wave(p), 0, 0] },
        tongue1: { rotate: [2 * wave(p, 1, 0.2), 3 * wave(p, 1, 0.1), 0] },
        tongue2: { rotate: [4 * wave(p, 1, 0.3), 0, 4 * wave(p, 1, 0.25)] },
        tongue3: { rotate: [8 * wave(p, 1, 0.4), 0, 8 * wave(p, 1, 0.35)] },
      }),
    });

    // Walk: a waddle on the four feet in diagonal pairs; the chest rocks, the lid flaps, the tongue flops.
    k.animation('walk', {
      duration: 0.6,
      pose: (_t, p) => {
        const s = wave(p);
        return {
          body: { move: [0, 0.012 * bump(p, 2), 0], rotate: [0, 4 * s, 5 * s] },
          lid: { rotate: [-6 * bump(p, 2, 0.1), 0, 0] },
          'fleg.L': { rotate: [-25 * s, 0, 0] },
          'bleg.R': { rotate: [-25 * s, 0, 0] },
          'fleg.R': { rotate: [25 * s, 0, 0] },
          'bleg.L': { rotate: [25 * s, 0, 0] },
          tongue2: { rotate: [6 * wave(p, 2, 0.2), 0, 6 * s] },
          tongue3: { rotate: [12 * wave(p, 2, 0.3), 0, 12 * wave(p, 1, 0.15)] },
        };
      },
    });

    // Attack: open wide and rear back, lunge forward, slam the lid shut, recover.
    k.animation('attack', {
      duration: 0.9,
      loop: false,
      pose: (_t, p) => {
        const wide = ease(0, 0.3, p) * (1 - ease(0.36, 0.44, p));
        const lunge = ease(0.34, 0.46, p) * (1 - ease(0.62, 1, p));
        const shut = ease(0.38, 0.46, p) * (1 - ease(0.6, 0.9, p));
        return {
          body: { move: [0, 0.03 * lunge, -0.04 * wide + 0.14 * lunge], rotate: [-10 * wide + 12 * lunge, 0, 0] },
          lid: { rotate: [-28 * wide + (OPEN - 2) * shut, 0, 0] },
          'teeth.lower': { scale: [1, 1 - 0.5 * shut, 1] },
          'teeth.upper': { scale: [1, 1 - 0.5 * shut, 1] },
          tongue1: { rotate: [-10 * wide, 0, 0], scale: [1 - 0.5 * shut, 1 - 0.5 * shut, 1 - 0.5 * shut] },
          tongue3: { rotate: [-20 * wide + 20 * lunge, 0, 0] },
          'fleg.L': { rotate: [-20 * lunge, 0, 0] },
          'fleg.R': { rotate: [-20 * lunge, 0, 0] },
          'bleg.L': { rotate: [20 * lunge, 0, 0] },
          'bleg.R': { rotate: [20 * lunge, 0, 0] },
        };
      },
    });

    // Reveal: it sits on the ground as a closed chest, rattles, then springs up and gapes open.
    k.animation('reveal', {
      duration: 1.4,
      loop: false,
      pose: (_t, p) => {
        const hidden = 1 - ease(0.55, 0.7, p);
        const rattle = ease(0.15, 0.25, p) * (1 - ease(0.45, 0.55, p)) * wave(p, 9);
        const spring = ease(0.55, 0.66, p) * (1 - ease(0.72, 1, p));
        const tuck = Math.max(0.05, 1 - hidden);
        return {
          body: { move: [0, -LIFT * hidden + 0.06 * spring, 0], rotate: [0, 0, 3 * rattle] },
          lid: { rotate: [OPEN * hidden - 18 * spring - 4 * Math.abs(rattle), 0, 0] },
          'teeth.upper': { scale: [tuck, tuck, tuck] },
          'teeth.lower': { scale: [tuck, tuck, tuck] },
          tongue1: { scale: [tuck, tuck, tuck] },
          'fleg.L': { scale: [1, tuck, 1] },
          'fleg.R': { scale: [1, tuck, 1] },
          'bleg.L': { scale: [1, tuck, 1] },
          'bleg.R': { scale: [1, tuck, 1] },
        };
      },
    });
  },
});
