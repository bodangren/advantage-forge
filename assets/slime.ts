import { defineAsset, motion, profile, sdf } from '../src/index.js';

/**
 * Slime — Chibi Quest monster (catalog `monsters/small/slime`), about 0.46 m tall and 0.66 m wide,
 * faces +Z. Target: docs/monster-mockups/slime_001.png (the slime king on the Chibi Quest enemy
 * sheet; the plain slime leaves out the king's crown, cape, and chain).
 *
 * Role: the first, weakest monster, seen in 3D and as a 128 px sprite; the face must read.
 * One idea: a glossy, jiggly green jelly dome with a grumpy face, settling into a puddle with
 *   round drips at its base.
 * Shape language: all round and soft (dome, drips, bubbles), with the angry brows as the only
 *   hard accent.
 * Palette (60/30/10): bright jelly green #52c832, lighter on top #9cf06a, darker at the base
 *   #2e8e22; dark green brows and mouth #1e5a16; white eyes with green irises as the focal point.
 * Value plan: the white eyes with black pupils on the green dome are the strongest contrast.
 * Bodies: jelly (glossy, a faint glow), eyes (whites, irises, pupils, highlights), brows.
 * Rig: `core` at the ground (squash and stretch) and `top` (the dome's jiggle). Clips: idle
 *   (wobble), walk (hops), attack (a leaping body slam). The color is one constant, so the P2
 *   variants (fire, ice, poison) can reuse this file with another palette.
 */

const C = {
  jelly: '#52c832',
  jellyTop: '#9cf06a',
  jellyBase: '#2e8e22',
  bubble: '#b8f88a',
  white: '#f4faf0',
  iris: '#1a5e12',
  irisLow: '#48a82e',
  pupil: '#0e1a0c',
  brow: '#2a7a1c',
  mouth: '#1e4a14',
};

type V3 = readonly [number, number, number];
const pair = (s: sdf.Shape) => s.mirror('x');

export default defineAsset({
  name: 'slime',
  description: 'Chibi green slime monster: a glossy jelly dome with a grumpy face, round drips at its base, and a hop.',
  detail: 0.005,
  reference: 'docs/monster-mockups/slime_001.png',

  build(k) {
    k.skeleton({
      core: { at: [0, 0, 0] },
      top: { parent: 'core', at: [0, 0.2, 0], tail: [0, 0.46, 0] },
    });

    // ------------------------------------------------------------------ the jelly
    // A dome that sags into a wide puddle; the puddle's rim has round lobes like drips.
    const dome = sdf.smoothUnion(
      0.08,
      sdf.ellipsoid([0.27, 0.25, 0.24]).at(0, 0.2, 0),
      sdf.ellipsoid([0.3, 0.12, 0.27]).at(0, 0.1, 0.005),
    );
    const lobes = sdf.union(
      ...Array.from({ length: 9 }, (_, i) => {
        const a = (i / 9) * Math.PI * 2 + 0.3;
        const r = 0.28 + 0.03 * Math.sin(i * 2.7);
        return sdf.sphere(0.055 + 0.015 * Math.sin(i * 1.9)).at(Math.sin(a) * r, 0.04, Math.cos(a) * r * 0.9);
      }),
    );
    const puddle = sdf.smoothUnion(0.04, sdf.ellipsoid([0.3, 0.05, 0.27]).at(0, 0.03, 0), lobes);
    // A few bubbles bulge out of the surface.
    const bumps = sdf.union(
      sdf.sphere(0.034).at(0.2, 0.3, 0.1),
      sdf.sphere(0.026).at(-0.23, 0.22, 0.12),
      sdf.sphere(0.03).at(-0.12, 0.38, -0.1),
    );
    const jellyShape = sdf
      .smoothUnion(0.05, dome.bone('top'), puddle.bone('core'))
      .smoothUnion(0.015, bumps.bone('top'))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const faceZ = (x: number, y: number) => sdf.raycast(dome, [x, y, 1], [0, 0, -1])![2];

    // Face paint: a small frown under the eyes.
    const MOUTH_Y = 0.2;
    const mouth = sdf.extrude(profile.arc(0.045, 0.012, 55, 125), 0.4).at(0, MOUTH_Y - 0.045, 0.2);
    const jelly = jellyShape
      // Lighter toward the top, darker toward the puddle.
      .paintFn((_x, y, _z, base) => {
        const top = [0x9c / 255, 0xf0 / 255, 0x6a / 255] as const;
        const low = [0x2e / 255, 0x8e / 255, 0x22 / 255] as const;
        const t = Math.min(1, Math.max(0, (y - 0.22) / 0.22));
        const b = Math.min(1, Math.max(0, (0.1 - y) / 0.1));
        return [
          base[0] + (top[0] - base[0]) * t * 0.55 + (low[0] - base[0]) * b * 0.6,
          base[1] + (top[1] - base[1]) * t * 0.55 + (low[1] - base[1]) * b * 0.6,
          base[2] + (top[2] - base[2]) * t * 0.55 + (low[2] - base[2]) * b * 0.6,
        ];
      })
      .paintWhere(bumps.round(0.004), C.bubble, 0.01)
      .paintWhere(mouth, C.mouth, 0.003);
    k.body('jelly', jelly, { color: C.jelly, roughness: 0.1, emissive: C.jelly, emissiveIntensity: 0.12, textureDensity: 1.5 });

    // ------------------------------------------------------------------ eyes: glossy bulbs set into the dome
    const EYE_X = 0.092;
    const EYE_Y = 0.245;
    const eyeZ = faceZ(EYE_X, EYE_Y);
    const EYE_R = 0.06;
    const eyeC: V3 = [EYE_X, EYE_Y, eyeZ - 0.022];
    // Everything is built for the left eye and mirrored; the irises look a little inward.
    const eyeLocal = sdf
      .sphere(EYE_R)
      .at(...eyeC)
      .paintWhere(sdf.cylinder(0.042, 1).rotateX(90).at(eyeC[0] - 0.008, eyeC[1] - 0.006, 0), C.iris, 0.002)
      .paintWhere(sdf.cylinder(0.042, 1).rotateX(90).at(eyeC[0] - 0.008, eyeC[1] - 0.006, 0).intersect(sdf.halfSpace([0, 1, 0], eyeC[1] - 0.02)), C.irisLow, 0.01)
      .paintWhere(sdf.cylinder(0.024, 1).rotateX(90).at(eyeC[0] - 0.01, eyeC[1] - 0.004, 0), C.pupil, 0.002)
      .paintWhere(sdf.sphere(0.011).at(eyeC[0] + 0.006, eyeC[1] + 0.016, eyeC[2] + EYE_R), C.white, 0.002)
      // A heavy upper lid in jelly green cuts the top of each eye on a slant: a glare.
      .paintWhere(
        // Solid above the slanted line y = eyeY + 0.026 + 0.35 (x - eyeX): the lid.
        sdf.halfSpace(
          [0.35 / Math.hypot(0.35, 1), -1 / Math.hypot(0.35, 1), 0],
          (0.35 * eyeC[0] - (eyeC[1] + 0.026)) / Math.hypot(0.35, 1),
        ).intersect(sdf.sphere(EYE_R + 0.01).at(...eyeC)),
        C.jelly,
        0.002,
      );
    k.body('eyes', pair(eyeLocal).bone('top'), { color: C.white, roughness: 0.1, textureDensity: 2 });

    // ------------------------------------------------------------------ brows: raised, angry
    const browAt = (x: number, y: number): V3 => [x, y, faceZ(x, y) - 0.008];
    const brows = pair(
      sdf.chain(
        [
          [...browAt(EYE_X + 0.07, EYE_Y + 0.065), 0.022],
          [...browAt(EYE_X + 0.015, EYE_Y + 0.055), 0.028],
          [...browAt(EYE_X - 0.045, EYE_Y + 0.028), 0.022],
        ],
        0.01,
      ),
    );
    k.body('brows', brows.bone('top'), { color: C.brow, roughness: 0.12, emissive: C.brow, emissiveIntensity: 0.1 });

    // ------------------------------------------------------------------ animation
    const { wave } = motion;
    const TAU = Math.PI * 2;

    k.animation('idle', {
      duration: 2.0,
      pose: (_t, p) => {
        const w = wave(p, 2);
        return {
          core: { scale: [1 + 0.03 * w, 1 - 0.04 * w, 1 + 0.03 * w] },
          top: { rotate: [3 * wave(p, 1, 0.2), 0, 4 * wave(p, 1, 0.1)] },
        };
      },
    });

    // Hops: a stretch on the way up, a squash on landing; the dome lags behind.
    const hop = (duration: number, height: number, squash: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = Math.sin(TAU * p);
        const up = Math.max(0, s); // airborne in the first half
        const down = Math.max(0, -s); // on the ground, squashing, in the second half
        const sx = 1 + squash * down - 0.07 * up;
        const sy = 1 - squash * 1.3 * down + 0.14 * up;
        return {
          core: { move: [0, height * up, 0] as const, scale: [sx, sy, sx] as const },
          top: { rotate: [-8 * Math.cos(TAU * p), 0, 3 * wave(p, 1, 0.3)] as const },
        };
      },
    });
    k.animation('walk', hop(0.8, 0.09, 0.14));

    // A body slam: squash down (wind-up), leap forward and up, land flat, recover.
    const ease = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    k.animation('attack', {
      duration: 0.9,
      loop: false,
      pose: (_t, p) => {
        const wind = ease(0, 0.3, p) * (1 - ease(0.3, 0.38, p));
        const air = Math.sin(Math.PI * Math.min(1, Math.max(0, (p - 0.32) / 0.28)));
        const fwd = ease(0.32, 0.6, p) * (1 - ease(0.7, 1, p));
        const land = ease(0.56, 0.62, p) * (1 - ease(0.64, 0.9, p));
        const sx = 1 + 0.2 * wind - 0.1 * air + 0.3 * land;
        const sy = 1 - 0.28 * wind + 0.2 * air - 0.38 * land;
        return {
          core: { move: [0, 0.16 * air, 0.14 * fwd], scale: [sx, sy, sx] },
          top: { rotate: [8 * wind - 12 * air + 6 * land, 0, 0] },
        };
      },
    });
  },
});
