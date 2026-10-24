import { defineAsset, mixRgb, motion, rgb, sdf } from '../src/index.js';

/**
 * Design note — Fireball (fx-geometry/magic/fireball).
 * Role: reusable projectile and magic effect; the focal core must read at 128 px.
 * Size: 0.4 m core, under 1 m deep, lowest flame at y = 0; faces +Z with its trail toward -Z.
 * One idea: a brilliant round heart pulls a short, asymmetric flame curl behind it.
 * Shape language: a round primary mass with swept triangular flames and one hooked tip.
 * Palette: pale yellow #ffe08a focal light, orange #ff9a3c mids, red-orange #e54b1b and deep red #8f1d17 lows.
 * Materials: opaque emissive core; inner flames 0.9 opacity, outer flames 0.78; roughness 0.3, metalness 0.
 * Details: dominant core, unequal curled tongues, hot-to-dark paint; the core is the focal point.
 * Rig/clips: root and trail bones; one seamless 1.2 s fly pulse without world translation.
 */

const CORE = [0, 0.26, 0.16] as const;
const PALE = rgb('#ffe08a');
const ORANGE = rgb('#ff9a3c');
const RED_ORANGE = rgb('#e54b1b');
const DEEP_RED = rgb('#8f1d17');
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export default defineAsset({
  name: 'fireball',
  description: 'A bright spherical fire core with an asymmetric curled flame trail.',
  detail: 0.009,
  texture: { size: 1024 },

  build(k) {
    k.skeleton({
      root: { at: CORE },
      trail: { parent: 'root', at: [0.03, 0.29, -0.08] },
    });

    const core = sdf.sphere(0.2).at(...CORE).paintFn((_x, _y, z) => {
      const heat = 0.2 + 0.8 * clamp01((z + 0.04) / 0.4);
      return mixRgb(ORANGE, PALE, heat);
    });
    k.body('core', core, {
      color: '#e54b1b',
      roughness: 0.3,
      metalness: 0,
      emissive: '#ffe08a',
      emissiveIntensity: 1.4,
      opacity: 1,
      detail: 0.009,
      maxTriangles: 2400,
      paintWeight: 2,
      bone: 'root',
    });

    const curl = sdf.chain(
      [
        [0.02, 0.26, 0.04, 0.12],
        [0.06, 0.27, -0.13, 0.095],
        [0.12, 0.37, -0.3, 0.062],
        [0.08, 0.43, -0.43, 0.035],
        [-0.02, 0.4, -0.5, 0.018],
        [-0.09, 0.32, -0.47, 0.003],
      ],
      0.015,
    );
    const upper = sdf.cone([-0.1, 0.34, 0.04], [-0.26, 0.46, -0.25], 0.08, 0.004);
    const cheek = sdf.cone([0.14, 0.23, -0.02], [0.25, 0.3, -0.29], 0.07, 0.003);
    const low = sdf.cone([-0.11, 0.15, 0.19], [-0.18, 0.1, -0.02], 0.04, 0.004);
    const inner = sdf.union(upper, low).paintFn((_x, _y, z) => {
      const t = clamp01((z + 0.3) / 0.5);
      return t < 0.65 ? mixRgb(RED_ORANGE, ORANGE, t / 0.65) : mixRgb(ORANGE, PALE, (t - 0.65) / 0.35);
    });
    k.body('inner-flames', inner, {
      color: '#e54b1b',
      roughness: 0.3,
      metalness: 0,
      emissive: '#ff9a3c',
      emissiveIntensity: 1.2,
      opacity: 0.9,
      detail: 0.008,
      maxTriangles: 2200,
      paintWeight: 2,
      bone: 'trail',
    });

    const lower = sdf.cone([0.035, 0.16, 0.03], [0.13, 0.012, -0.22], 0.07, 0.006);
    const outer = sdf.union(curl, cheek, lower).paintFn((_x, _y, z) => {
      const t = 0.15 + 0.85 * clamp01((z + 0.51) / 0.59);
      return mixRgb(DEEP_RED, RED_ORANGE, t);
    });
    k.body('outer-flames', outer, {
      color: '#8f1d17',
      roughness: 0.3,
      metalness: 0,
      emissive: '#e54b1b',
      emissiveIntensity: 0.9,
      opacity: 0.78,
      detail: 0.009,
      maxTriangles: 4000,
      paintWeight: 2,
      bone: 'trail',
    });

    k.animation('fly', {
      duration: 1.2,
      ground: false,
      pose: (_t, p) => {
        const pulse = 0.92 + 0.08 * motion.bump(p);
        const lag = 0.94 + 0.06 * motion.bump(p, 1, 0.25);
        return {
          root: { scale: [pulse, pulse, pulse] },
          trail: { scale: [lag, lag, lag] },
        };
      },
    });
  },
});
