import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Well apron — catalog `architecture/landscape-parts/well-apron`: a round cobblestone pad
 * under the hamlet well, 2.4 m across and 0.04 m thick, flush with the ground.
 *
 * - Role: ground dressing under `assets/well.ts`; seen at 128 px as a stone disc with the
 *   well standing on top. Detail budget is low: the cobble pattern does the work.
 * - Size: 2.4 m diameter, top at y = 0.04, bottom on y = 0, centered on the Y axis.
 * - One idea: a fitted ring of light-gray rounded cobbles with a soft rounded edge.
 * - Shape language: round (soft, friendly, flush); the chunky stone rhythm is secondary.
 * - Palette: stone #9c988d, stone dark #67645c, mortar #b3a892 — the exact grays of the
 *   well drum — plus damp #4c4a42 where the well sits and moss #5a6b46 specks.
 * - Materials: one stone body (worley cobble cells, paint + bump, roughness 0.9).
 * - Detail list: soft round pad, cobble cells with mortar gaps and per-stone tint, a damp
 *   contact ring under the well footprint, a few moss specks between the stones.
 * - No rig, no animation.
 */

const R = 1.19; // outer radius (~2.4 m across)
const WELL_R = 0.72; // the well drum footprint at ground level
const STONE_SCALE = 6; // same worley cell size as the well drum (~0.17 m stones)

const C = {
  stone: rgb('#9c988d'),
  stoneDark: rgb('#67645c'),
  mortar: rgb('#b3a892'),
  damp: rgb('#4c4a42'),
  moss: rgb('#5a6b46'),
};

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const smoothstep = (a: number, b: number, t: number) => {
  const s = clamp01((t - a) / (b - a));
  return s * s * (3 - 2 * s);
};

/** Fieldstone recipe copied from `assets/well.ts`, so apron and drum share one masonry. */
const stonePaint = (scale: number) => (x: number, y: number, z: number) => {
  const c = noise.worley(x * scale, y * scale * 1.5, z * scale);
  const border = c.f2 - c.f1;
  const tint = (c.id % 1000) / 1000;
  const stone = mixRgb(C.stone, C.stoneDark, 0.2 + 0.5 * tint);
  return border < 0.07 ? C.mortar : stone;
};
const stoneBump = (scale: number, depth: number) => (x: number, y: number, z: number) => {
  const c = noise.worley(x * scale, y * scale * 1.5, z * scale);
  return -depth * Math.min(1, (c.f2 - c.f1) * 4) + depth * 0.5;
};

export default defineAsset({
  name: 'well-apron',
  description:
    'Round cobblestone apron pad for the hamlet well: 2.4 m across, 0.04 m thick, light-gray cobbles with mortar gaps and moss specks.',
  detail: 0.012,
  texture: { size: 1024 },

  build(k) {
    // Round pad with a soft rounded edge and a very slight crown, no square footprint.
    const padProfile = profile.polygon(
      [
        [0, 0.001],
        [0.9, 0],
        [1.08, 0.004],
        [1.17, 0.016],
        [R, 0.028],
        [1.13, 0.037],
        [0.9, 0.041],
        [0, 0.042],
      ],
      { smooth: true },
    );

    const pad = sdf
      .revolve(padProfile)
      // Cut the smooth profile flush at ground level so the pad always touches y = 0.
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .paintFn((x, y, z) => {
        let c = stonePaint(STONE_SCALE)(x, y, z);

        // Damp contact ring: a narrow band where the drum's wall touches the pad.
        const r = Math.hypot(x, z);
        const damp = Math.max(0, 1 - Math.abs(r - (WELL_R - 0.06)) / 0.2);
        if (damp > 0) c = mixRgb(c, C.damp, 0.3 * damp * damp);

        // Moss specks: only in mortar gaps, only where patches grow, and only as fine dots.
        const gap = noise.worley(x * STONE_SCALE, y * STONE_SCALE * 1.5, z * STONE_SCALE);
        if (gap.f2 - gap.f1 < 0.05) {
          const patch = noise.fbm(x * 3.4, 7.1, z * 3.4, 2);
          const speck = noise.noise3(x * 16, 21, z * 16);
          const north = clamp01((-z + 0.3) * 1.2);
          if (patch > 0.3 - 0.25 * north && speck > 0.3) c = mixRgb(c, C.moss, 0.82);
        }

        // Soft value drop at the outer edge so the disc reads against bright grass.
        const edge = clamp01((r - 1.02) / 0.17);
        c = mixRgb(c, C.stoneDark, 0.22 * edge * edge);

        // Ground contact: the stones darken gently into the earth, with no hard lip.
        if (y < 0.014) c = mixRgb(c, C.damp, 0.4 * (1 - y / 0.014));
        return c;
      });

    k.body('cobbles', pad, {
      color: '#9c988d',
      roughness: 0.9,
      metalness: 0,
      detail: 0.012,
      bump: stoneBump(STONE_SCALE, 0.012),
      maxTriangles: 5400,
    });
  },
});
