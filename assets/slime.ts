import { defineAsset, mixRgb, motion, noise, profile, rgb, sdf } from '../src/index.js';
import type { Rgb } from '../src/index.js';

/**
 * Slime — Chibi Quest monster (catalog `monsters/small/slime`), about 0.49 m tall and 0.66 m wide,
 * faces +Z. Target: docs/monster-mockups/slime_001.png (the slime king on the Chibi Quest enemy
 * sheet; the plain slime leaves out the king's crown, cape, and chain).
 *
 * Role: the first, weakest monster, seen in 3D and as a 128 px sprite; the face must read.
 * One idea: a glossy green jelly with a grumpy glare, a head dome sitting on a wider
 *   belly that settles into a puddle with round drips, and little bubbles floating around it.
 * Shape language: all round and soft (dome, belly, drips, bubbles), with the heavy slanted brow
 *   ridges and the frown as the only hard accents.
 * Palette: ONE constant, `SLIME` (#52c832). Every other color is mixed from it (lighter top,
 *   darker base and puddle, pale bubbles, dark brows and mouth, lime irises), so the P2 fire, ice,
 *   and poison slimes only change that constant. White eyes with dark pupils are the focal point.
 * Value plan: the white eyes, the dark pupils, and the dark frown on the mid-green face are the
 *   strongest contrast; the lighter top and the darker puddle give the jelly its volume.
 * Bodies: jelly (glossy, a faint glow, with bubbles painted under its skin), eyes, bubbles (three
 *   floating, a little see-through).
 * Rig: `core` (root, on the ground: squash and stretch), `top` (the dome's jiggle and the face),
 *   `bubble1` to `bubble3` (the floating bubbles; their poses cancel the core's squash and travel,
 *   so they float on their own).
 *   Clips: idle (wobble, bubbles drift), walk (hops), attack (a heavy body slam), hit (a squashed
 *   recoil and jiggle), death (it melts into a puddle and the bubbles pop).
 */

/** The one slime color. Change it for the color variants; everything else follows. */
const SLIME = '#52c832';

const base = rgb(SLIME);
const white = rgb('#f4faf0');
const black = rgb('#0c140a');
const lime = rgb('#e8ff6a');
const tone = (to: Rgb, t: number) => mixRgb(base, to, t);
const C = {
  jelly: base,
  top: tone(white, 0.45),
  low: tone(black, 0.35),
  core: tone(black, 0.3),
  bubble: tone(white, 0.6),
  inner: tone(white, 0.22),
  white,
  irisRim: tone(black, 0.6),
  iris: mixRgb(tone(lime, 0.55), white, 0.15),
  irisLow: tone(lime, 0.8),
  pupil: black,
  brow: tone(black, 0.2),
  crease: tone(black, 0.55),
  mouth: tone(black, 0.75),
};

type V3 = readonly [number, number, number];
const pair = (s: sdf.Shape) => s.mirror('x');
const mix3 = (a: Rgb, b: Rgb, t: number): Rgb => mixRgb(a, b, Math.min(1, Math.max(0, t)));

// The floating bubbles: rest centers and radii.
const BUBBLES: { at: V3; r: number }[] = [
  { at: [0.37, 0.36, 0.06], r: 0.042 },
  { at: [-0.35, 0.24, -0.08], r: 0.032 },
  { at: [0.12, 0.6, -0.17], r: 0.024 },
];

export default defineAsset({
  name: 'slime',
  description: 'Chibi green slime monster: a glossy see-through jelly with a grumpy glare, a head dome on a wider belly, round drips at its base, and floating bubbles.',
  detail: 0.005,
  reference: 'docs/monster-mockups/slime_001.png',

  build(k) {
    const bones: Record<string, { parent?: string; at: V3; tail?: V3 }> = {
      core: { at: [0, 0, 0] },
      top: { parent: 'core', at: [0, 0.2, 0], tail: [0, 0.49, 0] },
    };
    BUBBLES.forEach((b, i) => (bones[`bubble${i + 1}`] = { parent: 'core', at: b.at }));
    k.skeleton(bones);

    // ------------------------------------------------------------------ the jelly
    // A head dome on a wider belly, sagging into a puddle whose rim has round lobes like drips.
    const dome = sdf.ellipsoid([0.25, 0.25, 0.23]).at(0, 0.24, 0.01);
    const belly = sdf.ellipsoid([0.3, 0.15, 0.275]).at(0, 0.125, 0.005);
    const body = sdf.smoothUnion(0.07, dome, belly);
    const lobes = sdf.union(
      ...Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2 + 0.3;
        const r = 0.29 + 0.03 * Math.sin(i * 2.7);
        return sdf.sphere(0.052 + 0.016 * Math.sin(i * 1.9)).at(Math.sin(a) * r, 0.038, Math.cos(a) * r * 0.92);
      }),
    );
    const puddle = sdf.smoothUnion(0.04, sdf.ellipsoid([0.31, 0.05, 0.285]).at(0, 0.03, 0), lobes);
    const faceHit = (x: number, y: number) => sdf.raycast(dome, [x, y, 1], [0, 0, -1])!;
    const surf = (x: number, y: number, z: number, lift: number) => sdf.surfacePoint(body, [x, y, z], lift);
    // Blisters bulge out of the belly and the back, so the side and back views are not a plain dome.
    const blisters = sdf.union(
      ...[
        [0.24, 0.14, 0.17, 0.034],
        [-0.26, 0.12, 0.15, 0.028],
        [0.2, 0.3, -0.14, 0.03],
        [-0.14, 0.4, -0.15, 0.026],
        [-0.26, 0.2, -0.12, 0.036],
        [0.1, 0.16, -0.26, 0.032],
        [0.27, 0.22, -0.04, 0.024],
      ].map(([x, y, z, r]) => sdf.sphere(r!).at(...surf(x!, y!, z!, -r! * 0.35))),
    );
    // Heavy brow ridges of jelly, slanted down toward the middle: a glare.
    const EYE_X = 0.105;
    const EYE_Y = 0.25;
    const browAt = (x: number, y: number, lift: number): V3 => {
      const h = faceHit(x, y);
      return [h[0], h[1], h[2] + lift];
    };
    const ridges = pair(
      sdf.chain(
        [
          [...browAt(EYE_X + 0.09, EYE_Y + 0.08, -0.012), 0.026],
          [...browAt(EYE_X + 0.025, EYE_Y + 0.076, -0.004), 0.034],
          [...browAt(EYE_X - 0.045, EYE_Y + 0.044, -0.008), 0.026],
          [...browAt(EYE_X - 0.07, EYE_Y + 0.03, -0.016), 0.014],
        ],
        0.012,
      ),
    );
    const jellyShape = sdf
      .smoothUnion(0.05, body.bone('top'), puddle.bone('core'))
      .smoothUnion(0.012, blisters.bone('top'))
      .smoothUnion(0.018, ridges.bone('top'))
      .intersect(sdf.halfSpace([0, -1, 0], 0));

    // Bubbles inside the jelly, near the surface (paint stencils that cross it).
    const insideAt: [number, number, number, number][] = [
      [0.16, 0.1, 0.24, 0.024],
      [-0.24, 0.28, 0.06, 0.02],
      [0.06, 0.42, -0.14, 0.018],
      [-0.08, 0.16, -0.24, 0.022],
      [0.22, 0.3, -0.02, 0.016],
    ];
    const innerBubbles = sdf.union(...insideAt.map(([x, y, z, r]) => sdf.sphere(r).at(...surf(x, y, z, -r * 0.4))));
    const glints = sdf.union(...insideAt.map(([x, y, z, r]) => sdf.sphere(r * 0.35).at(...surf(x + r * 0.4, y + r * 0.5, z, -r * 0.1))));

    // Face paint: a bold, wide frown, and a dark crease under each brow ridge.
    const MOUTH_Y = EYE_Y - 0.1;
    const mouth = sdf.extrude(profile.arc(0.07, 0.022, 58, 122), 0.5).at(0, MOUTH_Y - 0.07, 0.2);
    const crease = pair(
      sdf.chain(
        [
          [...browAt(EYE_X + 0.075, EYE_Y + 0.056, 0), 0.008],
          [...browAt(EYE_X + 0.015, EYE_Y + 0.052, 0), 0.01],
          [...browAt(EYE_X - 0.05, EYE_Y + 0.02, 0), 0.008],
        ],
        0.004,
      ),
    );
    const jelly = jellyShape
      // Lighter toward the top, darker toward the puddle, with soft mottling inside the jelly.
      .paintFn((x, y, z, c) => {
        const t = (y - 0.24) / 0.22;
        const b = (0.1 - y) / 0.1;
        const m = 0.5 + 0.5 * noise.fbm(x * 9, y * 9, z * 9, 2);
        let out = mix3(c, C.top, t * 0.6);
        out = mix3(out, C.low, b * 0.65);
        return mix3(out, C.top, (m - 0.5) * 0.25);
      })
      .paintWhere(blisters.round(0.003), C.inner, 0.016)
      // Bubbles seen inside the jelly: soft pale discs with a bright glint.
      .paintWhere(innerBubbles, C.inner, 0.01)
      .paintWhere(glints, C.bubble, 0.002)
      .paintWhere(crease, C.crease, 0.004)
      .paintWhere(mouth, C.mouth, 0.002);
    k.body('jelly', jelly, { color: C.jelly, roughness: 0.2, emissive: C.jelly, emissiveIntensity: 0.16, textureDensity: 1.5 });

    // ------------------------------------------------------------------ eyes: big glossy bulbs set into the dome
    const eyeHit = faceHit(EYE_X, EYE_Y);
    const EYE_R = 0.074;
    const eyeC: V3 = [EYE_X, EYE_Y, eyeHit[2] - 0.022];
    const disc = (r: number, dx: number, dy: number) => sdf.cylinder(r, 1).rotateX(90).at(eyeC[0] + dx, eyeC[1] + dy, 0);
    // Everything is built for the left eye and mirrored; the irises look a little inward.
    const eyeLocal = sdf
      .sphere(EYE_R)
      .at(...eyeC)
      .paintWhere(disc(0.053, -0.01, -0.01), C.irisRim, 0.002)
      .paintWhere(disc(0.046, -0.01, -0.01), C.iris, 0.002)
      .paintWhere(disc(0.046, -0.01, -0.01).intersect(sdf.halfSpace([0, 1, 0], eyeC[1] - 0.03)), C.irisLow, 0.014)
      .paintWhere(disc(0.028, -0.012, -0.008), C.pupil, 0.002)
      .paintWhere(sdf.sphere(0.015).at(eyeC[0] + 0.006, eyeC[1] + 0.012, eyeC[2] + EYE_R), C.white, 0.002)
      .paintWhere(sdf.sphere(0.008).at(eyeC[0] - 0.028, eyeC[1] - 0.028, eyeC[2] + EYE_R), C.white, 0.002)
      // A heavy upper lid in jelly green cuts the top of each eye on a slant: a glare.
      .paintWhere(
        // Solid above the slanted line y = eyeY + 0.024 + 0.4 (x - eyeX): the lid.
        sdf.halfSpace([0.4 / Math.hypot(0.4, 1), -1 / Math.hypot(0.4, 1), 0], (0.4 * eyeC[0] - (eyeC[1] + 0.024)) / Math.hypot(0.4, 1)).intersect(
          sdf.sphere(EYE_R + 0.01).at(...eyeC),
        ),
        C.brow,
        0.002,
      );
    k.body('eyes', pair(eyeLocal).bone('top'), { color: C.white, roughness: 0.1, textureDensity: 2 });

    // ------------------------------------------------------------------ floating bubbles, each on its own bone
    const bubbles = sdf.union(
      ...BUBBLES.map((b, i) =>
        sdf
          .sphere(b.r)
          .at(...b.at)
          .paintWhere(sdf.sphere(b.r * 0.32).at(b.at[0] + b.r * 0.35, b.at[1] + b.r * 0.45, b.at[2] + b.r * 0.7), C.white, 0.002)
          .bone(`bubble${i + 1}`),
      ),
    );
    k.body('bubbles', bubbles, { color: C.bubble, roughness: 0.05, emissive: C.jelly, emissiveIntensity: 0.3, opacity: 0.75, detail: 0.004 });

    // ------------------------------------------------------------------ animation
    const { wave, bump, keys } = motion;
    const TAU = Math.PI * 2;
    type P = Record<string, { rotate?: V3; move?: V3; scale?: V3 }>;
    type Core = { move?: V3; scale?: V3 };
    /**
     * The bubbles drift on their own: slow bobs and small circles, each out of step, plus `lag`
     * (world meters). They hang on `core`, so their poses cancel the core's move and scale.
     */
    const drift = (p: number, cycles: number, amp: number, core: Core, lag: V3 = [0, 0, 0], grow: number[] = [1, 1, 1]): P => {
      const out: P = {};
      const cm = core.move ?? [0, 0, 0];
      const cs = core.scale ?? [1, 1, 1];
      BUBBLES.forEach((b, i) => {
        const o = i * 0.31;
        const want: V3 = [
          b.at[0] + amp * 0.4 * wave(p, cycles, o + 0.25) + lag[0],
          b.at[1] + amp * wave(p, cycles, o) + lag[1],
          b.at[2] + amp * 0.4 * wave(p, cycles, o) + lag[2],
        ];
        const g = grow[i] ?? 1;
        out[`bubble${i + 1}`] = {
          move: [(want[0] - cm[0]) / cs[0] - b.at[0], (want[1] - cm[1]) / cs[1] - b.at[1], (want[2] - cm[2]) / cs[2] - b.at[2]],
          scale: [g / cs[0], g / cs[1], g / cs[2]],
        };
      });
      return out;
    };

    k.animation('idle', {
      duration: 2.0,
      pose: (_t, p) => {
        const w = wave(p, 2);
        const core: Core = { scale: [1 + 0.03 * w, 1 - 0.04 * w, 1 + 0.03 * w] };
        return {
          core,
          top: { rotate: [3 * wave(p, 1, 0.2), 0, 4 * wave(p, 1, 0.1)] },
          ...drift(p, 1, 0.025, core),
        } as P;
      },
    });

    // Hops: a stretch on the way up, a squash on landing; the dome and the bubbles lag behind.
    const hop = (duration: number, height: number, squash: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = Math.sin(TAU * p);
        const up = Math.max(0, s); // airborne in the first half
        const down = Math.max(0, -s); // on the ground, squashing, in the second half
        const sx = 1 + squash * down - 0.07 * up;
        const sy = 1 - squash * 1.3 * down + 0.14 * up;
        const lagUp = height * Math.max(0, Math.sin(TAU * (p - 0.12)));
        const core: Core = { move: [0, height * up, 0], scale: [sx, sy, sx] };
        return {
          core,
          top: { rotate: [-8 * Math.cos(TAU * p), 0, 3 * wave(p, 1, 0.3)] },
          ...drift(p, 1, 0.015, core, [0, lagUp * 0.8, 0]),
        } as P;
      },
    });
    k.animation('walk', hop(0.8, 0.09, 0.14));

    // A heavy body slam. Anticipation: it sinks low and wide and rocks back (hold). Launch: it
    // stretches tall and leaps forward, the top leading. Impact: it hits the ground flat and wide
    // with a big splat, then jiggles back up. The bubbles fly after it, a little late.
    k.animation('attack', {
      duration: 1.0,
      loop: false,
      pose: (_t, p) => {
        const sy = keys(p, [[0, 1], [0.24, 0.62], [0.34, 0.6], [0.42, 1.34], [0.5, 1.12], [0.56, 0.46], [0.64, 0.62], [0.72, 1.12], [0.8, 0.94], [0.88, 1.03], [1, 1]] as const);
        const sxz = 1 / Math.sqrt(sy); // keep the volume
        const up = keys(p, [[0, 0], [0.36, 0], [0.47, 0.2], [0.55, 0], [1, 0]] as const, 'spline');
        const fwd = keys(p, [[0, 0], [0.24, -0.03], [0.36, -0.03], [0.55, 0.16], [0.72, 0.16], [1, 0]] as const);
        const lean = keys(p, [[0, 0], [0.24, -12], [0.36, -12], [0.44, 16], [0.54, 24], [0.62, -6], [0.74, 4], [1, 0]] as const);
        const lag: V3 = [0, keys(p, [[0.4, 0], [0.56, 0.12], [0.68, 0], [1, 0]] as const), keys(p, [[0.36, 0], [0.64, 0.14], [0.8, 0.15], [1, 0]] as const)];
        const core: Core = { move: [0, Math.max(0, up), fwd], scale: [sxz * (1 + 0.12 * Math.max(0, 0.9 - sy)), sy, sxz] };
        return {
          core,
          top: { rotate: [lean, 0, 3 * wave(p, 3, 0.1) * bump(p)] },
          ...drift(p, 1, 0.012, core, lag),
        } as P;
      },
    });

    // Hit: squashed from the front, it rocks back and jiggles, then settles.
    k.animation('hit', {
      duration: 0.45,
      loop: false,
      pose: (_t, p) => {
        const h = keys(p, [[0, 0], [0.16, 1], [1, 0]] as const);
        const j = Math.sin(p * TAU * 2.5) * (1 - p) * 0.08;
        const core: Core = { move: [0, 0, -0.03 * h], scale: [1 + 0.12 * h + j, 1 - 0.1 * h - j, 1 - 0.18 * h + j] };
        return {
          core,
          top: { rotate: [-16 * h + 30 * j, 0, 6 * j] },
          ...drift(p, 1, 0.02, core, [0, 0.02 * h, -0.05 * h]),
        } as P;
      },
    });

    // Death: a last shudder, then the jelly melts into a wide puddle, the face sinking into it,
    // and the floating bubbles swell and pop, one after another.
    k.animation('death', {
      duration: 1.4,
      loop: false,
      pose: (_t, p) => {
        const shake = Math.sin(p * TAU * 7) * (1 - Math.min(1, p / 0.2)) * Math.min(1, p / 0.05);
        const melt = keys(p, [[0.15, 0], [0.75, 1]] as const);
        const sy = 1 - 0.84 * melt;
        const sxz = 1 + 0.75 * melt;
        const core: Core = { scale: [sxz + 0.04 * shake, sy - 0.04 * shake, sxz + 0.04 * shake] };
        const grow = BUBBLES.map((_, i) => {
          const p0 = 0.3 + i * 0.12;
          return keys(p, [[p0, 1], [p0 + 0.08, 1.5], [p0 + 0.11, 0.02]] as const);
        });
        return {
          core,
          top: { rotate: [8 * melt, 0, 8 * shake], scale: [1 + 0.1 * melt, 1 - 0.3 * melt, 1 + 0.1 * melt] },
          ...drift(p, 1, 0.012, core, [0, 0, 0], grow),
        } as P;
      },
    });
  },
});
