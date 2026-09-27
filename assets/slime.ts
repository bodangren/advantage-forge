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
 *   darker base and puddle, pale bubbles, dark brows and mouth, lime irises). White eyes with dark
 *   pupils are the focal point.
 * Variants: slot `jelly` (the body and its dark tones), slot `highlight` (the light top and the
 *   floating bubbles), and slot `eyes` (lime, amber, frost), with the presets fire, ice, and poison.
 *   The mixed tones join a slot in `build` as exact colors that follow it. The light tones have
 *   their own slot: the game recolors by multiplying, and green's small red and blue channels
 *   would blow a light tone out to pink or violet if it followed the jelly.
 * Value plan: the white eyes, the dark pupils, and the dark frown on the mid-green face are the
 *   strongest contrast; the lighter top and the darker puddle give the jelly its volume.
 * Bodies: jelly (glossy, a faint glow, with bubbles painted under its skin), eyes, bubbles (three
 *   floating, a little see-through), acid-glob (the spit shot; hidden outside the spit).
 * Rig: `core` (root, on the ground: squash and stretch), `top` (the dome's jiggle and the face),
 *   `bubble1` to `bubble3` (the floating bubbles; their poses cancel the core's squash and travel,
 *   so they float on their own), `eye.L` and `eye.R` (children of `top`, so the eyes can close),
 *   `glob` (under `core`; the acid glob, hidden at scale 0.001 inside the body outside the spit).
 *   Clips: idle (wobble, bubbles drift), walk (hops), attack (a leaping body slam and a hop back),
 *   hit (a squashed recoil and jiggle), death (a wobble, then it melts into a puddle, the eyes
 *   sink, and the bubbles pop), spit (it squashes and swells its cheeks, stretches up and forward,
 *   and spits an acid glob about 1 m forward in an arc, then jiggles back to rest).
 */

/** The one slime color; the default option of the `jelly` slot. Everything else is mixed from it. */
const SLIME = '#52c832';

const base = rgb(SLIME);
/** A linear color as an sRGB '#rrggbb' string (for `k.tint(..., { color })`, which takes hex). */
const toHex = (c: Rgb): string =>
  '#' +
  c
    .map((v) => {
      const l = Math.min(1, Math.max(0, v));
      const s = l <= 0.0031308 ? l * 12.92 : 1.055 * Math.pow(l, 1 / 2.4) - 0.055;
      return Math.round(s * 255)
        .toString(16)
        .padStart(2, '0');
    })
    .join('');
/** A color pushed away from its own gray: the acid glob is a little more saturated than the body. */
const saturate = (c: Rgb, t: number): Rgb => {
  const g = (c[0] + c[1] + c[2]) / 3;
  const f = (v: number) => Math.min(1, Math.max(0, g + (v - g) * (1 + t)));
  return [f(c[0]), f(c[1]), f(c[2])];
};
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
  // A little blue (saturate clamps it to 0), so the glob can recolor to an ice or poison jelly.
  acid: ((c: Rgb): Rgb => [c[0], c[1], Math.max(c[2], base[2] * 0.65)])(saturate(base, 0.35)),
  acidTop: saturate(tone(white, 0.3), 0.35),
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

// The acid glob's bone: deep inside the belly, where it hides at scale 0.001 outside the spit.
const GLOB_AT: V3 = [0, 0.17, 0.08];
const GLOB_R = 0.037;

export default defineAsset({
  name: 'slime',
  description: 'Chibi green slime monster: a glossy see-through jelly with a grumpy glare, a head dome on a wider belly, round drips at its base, and floating bubbles.',
  detail: 0.005,
  reference: 'docs/monster-mockups/slime_001.png',
  variants: {
    jelly: { green: SLIME, fire: '#b8340a', ice: '#58b8ec', poison: '#46244f' },
    highlight: { green: toHex(C.top), fire: '#ffa010', ice: '#c8e6fa', poison: '#703070' },
    eyes: { lime: toHex(C.iris), amber: '#ffb43c', frost: '#a8e4ff' },
  },
  presets: {
    fire: { jelly: 'fire', highlight: 'fire', eyes: 'amber' },
    ice: { jelly: 'ice', highlight: 'ice', eyes: 'frost' },
    poison: { jelly: 'poison', highlight: 'poison', eyes: 'lime' },
  },

  build(k) {
    // The slot colors (see variants). Each mixed tone keeps its exact default color and follows
    // its slot: the body tones follow the jelly (the paler glints only mostly), and the light top
    // and the floating bubbles follow the highlight.
    const jellyTone = (c: Rgb, follow: number) => k.tint('jelly', { color: toHex(c), follow });
    const T = {
      jelly: k.tint('jelly'),
      top: k.tint('highlight'),
      low: jellyTone(C.low, 1),
      bubble: k.tint('highlight', { color: toHex(C.bubble), follow: 1 }),
      inner: jellyTone(C.inner, 0.85),
      brow: jellyTone(C.brow, 1),
      crease: jellyTone(C.crease, 1),
      mouth: jellyTone(C.mouth, 1),
      irisRim: jellyTone(C.irisRim, 1),
      acid: jellyTone(C.acid, 1),
      acidTop: jellyTone(C.acidTop, 0.8),
      iris: k.tint('eyes'),
      irisLow: k.tint('eyes', { color: toHex(C.irisLow), follow: 1 }),
    };
    // The paint functions mix linear colors made here, so the slot mask follows them too.
    const topRgb = rgb(T.top);
    const lowRgb = rgb(T.low);
    const acidTopRgb = rgb(T.acidTop);

    const bones: Record<string, { parent?: string; at: V3; tail?: V3 }> = {
      core: { at: [0, 0, 0] },
      top: { parent: 'core', at: [0, 0.2, 0], tail: [0, 0.49, 0] },
    };
    BUBBLES.forEach((b, i) => (bones[`bubble${i + 1}`] = { parent: 'core', at: b.at }));
    // Each eye on its own bone at its center, so the death clip can close and sink the eyes.
    bones['eye.L'] = { parent: 'top', at: [0.105, 0.25, 0.196] };
    bones['eye.R'] = { parent: 'top', at: [-0.105, 0.25, 0.196] };
    bones.glob = { parent: 'core', at: GLOB_AT };
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
        let out = mix3(c, topRgb, t * 0.6);
        out = mix3(out, lowRgb, b * 0.65);
        return mix3(out, topRgb, (m - 0.5) * 0.25);
      })
      .paintWhere(blisters.round(0.003), T.inner, 0.016)
      // Bubbles seen inside the jelly: soft pale discs with a bright glint.
      .paintWhere(innerBubbles, T.inner, 0.01)
      .paintWhere(glints, T.bubble, 0.002)
      .paintWhere(crease, T.crease, 0.004)
      .paintWhere(mouth, T.mouth, 0.002);
    k.body('jelly', jelly, { color: T.jelly, roughness: 0.2, emissive: T.jelly, emissiveIntensity: 0.16, textureDensity: 1.5 });

    // ------------------------------------------------------------------ eyes: big glossy bulbs set into the dome
    const eyeHit = faceHit(EYE_X, EYE_Y);
    const EYE_R = 0.074;
    const eyeC: V3 = [EYE_X, EYE_Y, eyeHit[2] - 0.022];
    const disc = (r: number, dx: number, dy: number) => sdf.cylinder(r, 1).rotateX(90).at(eyeC[0] + dx, eyeC[1] + dy, 0);
    // Everything is built for the left eye and mirrored; the irises look a little inward.
    const eyeLocal = sdf
      .sphere(EYE_R)
      .at(...eyeC)
      .paintWhere(disc(0.053, -0.01, -0.01), T.irisRim, 0.002)
      .paintWhere(disc(0.046, -0.01, -0.01), T.iris, 0.002)
      .paintWhere(disc(0.046, -0.01, -0.01).intersect(sdf.halfSpace([0, 1, 0], eyeC[1] - 0.03)), T.irisLow, 0.014)
      .paintWhere(disc(0.028, -0.012, -0.008), C.pupil, 0.002)
      .paintWhere(sdf.sphere(0.015).at(eyeC[0] + 0.006, eyeC[1] + 0.012, eyeC[2] + EYE_R), C.white, 0.002)
      .paintWhere(sdf.sphere(0.008).at(eyeC[0] - 0.028, eyeC[1] - 0.028, eyeC[2] + EYE_R), C.white, 0.002)
      // A heavy upper lid in jelly green cuts the top of each eye on a slant: a glare.
      .paintWhere(
        // Solid above the slanted line y = eyeY + 0.024 + 0.4 (x - eyeX): the lid.
        sdf.halfSpace([0.4 / Math.hypot(0.4, 1), -1 / Math.hypot(0.4, 1), 0], (0.4 * eyeC[0] - (eyeC[1] + 0.024)) / Math.hypot(0.4, 1)).intersect(
          sdf.sphere(EYE_R + 0.01).at(...eyeC),
        ),
        T.brow,
        0.002,
      );
    k.body('eyes', pair(eyeLocal.bone('eye.L')), { color: C.white, roughness: 0.1, textureDensity: 2 });

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
    k.body('bubbles', bubbles, { color: T.bubble, roughness: 0.05, emissive: T.jelly, emissiveIntensity: 0.3, opacity: 0.75, detail: 0.004 });

    // ------------------------------------------------------------------ acid glob: the spit shot
    // A blob of the slime's own jelly, 7.4 cm across, with a short tail that trails behind it in
    // flight (-Z), a lighter top, and a white glint. It rides `glob` and hides outside the spit.
    const glob = sdf
      .smoothUnion(0.018, sdf.sphere(GLOB_R), sdf.sphere(GLOB_R * 0.55).at(0, 0.004, -GLOB_R * 0.95))
      .displace(0.002, (x, y, z) => noise.noise3(x * 60, y * 60, z * 60))
      .paintFn((_x, y, _z, c) => mix3(c, acidTopRgb, (y / GLOB_R) * 0.7))
      .paintWhere(sdf.sphere(GLOB_R * 0.28).at(GLOB_R * 0.3, GLOB_R * 0.55, GLOB_R * 0.75), C.white, 0.002)
      .at(...GLOB_AT);
    k.body('acid-glob', glob, { bone: 'glob', color: T.acid, roughness: 0.08, emissive: T.acid, emissiveIntensity: 0.3, opacity: 0.85, detail: 0.003 });

    // ------------------------------------------------------------------ animation
    const { wave, bump, keys } = motion;
    const TAU = Math.PI * 2;
    type P = Record<string, { rotate?: V3; move?: V3; scale?: V3 }>;
    type Core = { move?: V3; scale?: V3 };
    const HIDE = { scale: [0.001, 0.001, 0.001] as V3 }; // the acid glob, outside the spit
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
          glob: HIDE,
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
          glob: HIDE,
          ...drift(p, 1, 0.015, core, [0, lagUp * 0.8, 0]),
        } as P;
      },
    });
    k.animation('walk', hop(0.8, 0.09, 0.14));

    // A leaping body slam. Anticipation: it sinks deep and wide and rocks back (hold). Launch: it
    // stretches tall and leaps in an arc, 0.35 m forward and 0.25 m up, tilted along the arc.
    // Impact: a hard splat, wide and flat, held for a moment, then a jiggle. Recovery: a small hop
    // back to the start, so it never slides on the floor. The bubbles fly after it, a little late.
    const JUMP = { from: 0.33, to: 0.52, fwd: 0.35, up: 0.25 };
    const BACK = { from: 0.79, to: 0.9, up: 0.07 };
    const arc = (p: number, a: number, b: number) => Math.min(1, Math.max(0, (p - a) / (b - a)));
    const slamTravel = (p: number): { fwd: number; up: number; tilt: number } => {
      if (p > JUMP.from && p < JUMP.to) {
        const s = arc(p, JUMP.from, JUMP.to);
        return { fwd: JUMP.fwd * s, up: JUMP.up * 4 * s * (1 - s), tilt: 14 * Math.sin(TAU * s) };
      }
      if (p > BACK.from && p < BACK.to) {
        const s = arc(p, BACK.from, BACK.to);
        return { fwd: JUMP.fwd * (1 - s), up: BACK.up * 4 * s * (1 - s), tilt: -6 * Math.sin(TAU * s) };
      }
      return { fwd: p >= JUMP.to && p <= BACK.from ? JUMP.fwd : 0, up: 0, tilt: 0 };
    };
    k.animation('attack', {
      duration: 1.2,
      loop: false,
      pose: (_t, p) => {
        const sy = keys(p, [
          [0, 1], [0.18, 0.5], [0.27, 0.48], // deep squash, held
          [0.31, 1.02], [0.34, 1.36], [0.42, 1.14], [0.49, 1.24], // launch stretch, apex, fall stretch
          [0.525, 0.4], [0.59, 0.43], // hard splat, held about 0.08 s
          [0.64, 1.16], [0.69, 0.9], [0.73, 1.05], // jiggle
          [0.77, 0.84], [0.8, 1.1], [0.87, 1.05], [0.9, 0.84], [0.95, 1.03], [1, 1], // hop back
        ] as const);
        const sxz = 1 / Math.sqrt(sy); // keep the volume
        const { fwd, up, tilt } = slamTravel(p);
        const lean = keys(p, [[0, 0], [0.18, -14], [0.29, -14], [0.36, 18], [0.49, 22], [0.56, 8], [0.64, -8], [0.72, 4], [0.8, -5], [0.9, 3], [1, 0]] as const);
        const late = slamTravel(p - 0.05);
        const lag: V3 = [0, late.up * 0.8, late.fwd];
        const core: Core & { rotate: V3 } = {
          move: [0, up, fwd],
          rotate: [tilt, 0, 0],
          scale: [sxz * (1 + 0.24 * Math.max(0, 0.9 - sy)), sy, sxz * (1 + 0.12 * Math.max(0, 0.9 - sy))],
        };
        return {
          core,
          top: { rotate: [lean, 0, 3 * wave(p, 3, 0.1) * bump(p)] },
          glob: HIDE,
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
          glob: HIDE,
          ...drift(p, 1, 0.02, core, [0, 0.02 * h, -0.05 * h]),
        } as P;
      },
    });

    // Death: a strong last wobble, then the jelly melts into a low puddle. The puddle keeps a
    // soft dome: a flatter squash bends the skinned normals into radial streaks. The eyes
    // close and sink into the jelly, and the floating bubbles swell and pop, one after another.
    k.animation('death', {
      duration: 1.4,
      loop: false,
      pose: (_t, p) => {
        const shake = keys(p, [[0, 0], [0.05, 1], [0.11, -1], [0.17, 0.85], [0.23, -0.6], [0.29, 0.3], [0.34, 0]] as const);
        const melt = keys(p, [[0.2, 0], [0.8, 1]] as const);
        const sy = 1 - 0.68 * melt;
        const sxz = 1 + 0.5 * melt;
        const core: Core = { scale: [sxz + 0.13 * shake, sy - 0.14 * shake, sxz + 0.13 * shake] };
        const grow = BUBBLES.map((_, i) => {
          const p0 = 0.3 + i * 0.12;
          return keys(p, [[p0, 1], [p0 + 0.08, 1.5], [p0 + 0.11, 0.02]] as const);
        });
        // The eyes squint shut and shrink into the jelly: hidden before the puddle settles.
        const e = keys(p, [[0.22, 1], [0.45, 0.6], [0.68, 0.04]] as const);
        const eye = { move: [0, -0.01 * (1 - e), -0.03 * (1 - e)] as V3, scale: [e, e * Math.min(1, 0.4 + e), e] as V3 };
        return {
          core,
          top: { rotate: [6 * melt, 0, 10 * shake], scale: [1 + 0.04 * melt, 1, 1 + 0.04 * melt] },
          'eye.L': eye,
          'eye.R': eye,
          glob: HIDE,
          ...drift(p, 1, 0.012, core, [0, 0, 0], grow),
        } as P;
      },
    });

    // Spit (1.1 s): a ranged acid spit. Anticipation: it squashes down and swells its cheeks (the
    // body widens, the top leans back), and the eyes squint. The spit: a fast stretch up and
    // forward, and an acid glob shoots from the frown about 1 m forward and a little up, then falls
    // in an arc (0.3 s), wobbling, and is gone. Recovery: a jiggle back to rest. The core never
    // moves, so the slime does not slide.
    const RELEASE = 0.4;
    const FLIGHT = 0.3 / 1.1;
    const MOUTH: V3 = [0, 0.16, 0.285];
    const TOP_AT: V3 = [0, 0.2, 0];
    const spitBody = (p: number) => {
      const cheek = keys(p, [[0, 0], [0.26, 1], [0.35, 1.05], [0.39, 0], [1, 0]] as const);
      const reach = keys(p, [[0, 0], [0.34, 0], [0.4, 1], [0.46, 0.85], [0.55, 0], [1, 0]] as const);
      const sy = keys(p, [
        [0, 1], [0.26, 0.82], [0.35, 0.79], // squash, held
        [0.4, 1.24], [0.46, 1.18], // the stretch at the spit
        [0.53, 0.86], [0.61, 1.09], [0.7, 0.95], [0.8, 1.03], [0.9, 0.99], [1, 1], // jiggle
      ] as const);
      const lean = keys(p, [[0, 0], [0.26, -13], [0.35, -15], [0.4, 10], [0.46, 12], [0.54, -7], [0.63, 5], [0.73, -2.5], [0.85, 1], [1, 0]] as const);
      const v = 1 / Math.sqrt(sy); // keep the volume
      const core: V3 = [v * (1 + 0.1 * cheek), sy, v * (1 + 0.05 * cheek) + 0.08 * reach];
      // The dome swells wide in the anticipation and stretches forward at the spit.
      const top: V3 = [1 + 0.08 * cheek - 0.04 * reach, 1 - 0.03 * cheek + 0.03 * reach, 1 + 0.06 * cheek + 0.1 * reach];
      return { core, top, lean, reach };
    };
    // Where the frown is in the world (the top turns about its joint), so the glob leaves from it.
    const mouthAt = (p: number): V3 => {
      const b = spitBody(p);
      const a = (b.lean * Math.PI) / 180;
      const dy = (MOUTH[1] - TOP_AT[1]) * b.top[1];
      const dz = (MOUTH[2] - TOP_AT[2]) * b.top[2];
      const y = TOP_AT[1] + dy * Math.cos(a) - dz * Math.sin(a);
      const z = TOP_AT[2] + dy * Math.sin(a) + dz * Math.cos(a) + 0.02 * b.reach;
      return [0, y * b.core[1], z * b.core[2]];
    };
    const LAUNCH = mouthAt(RELEASE);
    const L0: V3 = [0, LAUNCH[1], LAUNCH[2] + 0.025];
    const LAND_Y = 0.04;
    const RISE = 0.64; // the arc: about 0.12 m above the mouth at its top
    const globPath = (f: number): V3 => [0, L0[1] + (LAND_Y - L0[1]) * f + RISE * f * (1 - f), L0[2] + 1.0 * f];
    const globPitch = (f: number) => (-Math.atan2(LAND_Y - L0[1] + RISE * (1 - 2 * f), 1.0) * 180) / Math.PI;
    k.animation('spit', {
      duration: 1.1,
      loop: false,
      pose: (_t, p) => {
        const b = spitBody(p);
        const core: Core = { scale: b.core };
        // The eyes squint in the anticipation, open wide at the spit, then settle.
        const e = keys(p, [[0, 1], [0.24, 0.5], [0.35, 0.45], [0.4, 1.12], [0.5, 1.08], [0.62, 1], [1, 1]] as const);
        const eye = { scale: [1 + 0.06 * Math.max(0, 1 - e), e, 1] as V3 };
        // The glob: it flies its own world path (the core's scale is cancelled), pointed along the
        // arc, wobbling, and it shrinks away as it lands.
        let glob: { move?: V3; rotate?: V3; scale: V3 } = HIDE;
        const f = (p - RELEASE) / FLIGHT;
        if (f >= 0 && f <= 1) {
          const at = globPath(f);
          const cs = b.core;
          const g = keys(f, [[0, 0.45], [0.1, 1.15], [0.2, 1], [0.86, 1], [1, 0.001]] as const);
          const w = 0.14 * Math.sin(TAU * 3.5 * f) * (1 - 0.5 * f);
          const flat = keys(f, [[0.86, 1], [1, 0.35]] as const);
          glob = {
            move: [at[0] / cs[0] - GLOB_AT[0], at[1] / cs[1] - GLOB_AT[1], at[2] / cs[2] - GLOB_AT[2]],
            rotate: [globPitch(f), 0, 0],
            scale: [(g * (1 + w)) / cs[0], (g * (1 - w) * flat) / cs[1], (g * 1.12) / cs[2]],
          };
        }
        return {
          core,
          top: { move: [0, 0, 0.02 * b.reach], rotate: [b.lean, 0, 2.5 * wave(p, 3, 0.1) * bump(p)], scale: b.top },
          'eye.L': eye,
          'eye.R': eye,
          glob,
          ...drift(p, 1, 0.015, core, [0, 0.03 * b.reach, 0.02 * b.reach]),
        } as P;
      },
    });
  },
});
