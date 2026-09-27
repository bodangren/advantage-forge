import { defineAsset, sdf, noise, rgb, mixRgb } from '../src/index.js';

// Design note (8 lines):
// - Role: cozy chibi market/farm prop; must read as a pumpkin at 128 px sprite size.
// - Size: ~0.45 m across, ~0.35 m tall; stands on y = 0, faces +Z.
// - The one idea: a plump ribbed orange ball with a chunky green stem.
// - Shape language: round and soft dominant (friendly); short tapered stem secondary.
// - Palette: flesh orange #e8821e (60), groove #b34a12 (30 dark), stem green #4f8a3a,
//   stem dark #2f5a2a, top glow #f6a93f light (accent in dimple ring).
// - Materials: pumpkin flesh (rough 0.6), green stem/calyx (rough 0.8).
// - Detail: 8 soft vertical lobes, darker grooves, dimpled top, flat base, bent stem.
// - Rig/animation: none (static prop).

const LOBES = 8;
const orange = rgb('#e8821e');
const grooveBrown = rgb('#93400d');
const topLight = rgb('#f6a93f');
const stemGreen = rgb('#4f8a3a');
const stemDark = rgb('#2f5a2a');

// 0 at a groove, 1 at a lobe middle.
function lobeFn(x: number, z: number): number {
  return 0.5 + 0.5 * Math.cos(LOBES * Math.atan2(z, x));
}

function sstep(a: number, b: number, v: number): number {
  const t = Math.max(0, Math.min(1, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

// Fade ribbing near the poles (top dimple, flat base) so those areas stay smooth.
function ribFade(x: number, y: number, z: number): number {
  const r = Math.hypot(x, z);
  const radial = sstep(0.0, 0.1, r);
  const low = sstep(0.005, 0.1, y);
  const high = 1 - sstep(0.2, 0.27, y);
  return Math.min(radial, Math.min(low, high));
}

function lobeIndex(x: number, z: number): number {
  const a = Math.atan2(z, x) / (2 * Math.PI) + 0.5;
  return Math.floor(a * LOBES) % LOBES;
}

export default defineAsset({
  name: 'pumpkin',
  description: 'Round ribbed orange pumpkin with a short green stem.',
  detail: 0.005,
  build(k) {
    const BODY_CY = 0.13;
    const RX = 0.212;
    const RY = 0.14;

    // Plump ribbed body: squashed ellipsoid, grooves pushed in, lobes out.
    const flesh = sdf
      .ellipsoid([RX, RY, RX])
      .at(0, BODY_CY, 0)
      .displace(0.024, (x, y, z) => {
        const g = 1 - lobeFn(x, z); // 1 in grooves
        return (g - 0.42) * 1.1 * ribFade(x, y, z);
      })
      // Dimpled top for the stem to sit in.
      .smoothSubtract(0.02, sdf.sphere(0.07).at(0, 0.285, 0))
      // Slight flat spot at the base: cut below y = 0 (kept finite by the box).
      .intersect(sdf.box([1, 0.6, 1]).at(0, 0.3, 0))
      .paintFn((x, y, z, base) => {
        const g = 1 - lobeFn(x, z);
        const fade = ribFade(x, y, z);
        // Deep warm grooves, lighter lobe crowns, gentle top-to-bottom gradient.
        let c = mixRgb(orange, grooveBrown, Math.min(1, g * 1.25) * (0.35 + 0.65 * fade));
        const crown = Math.max(0, lobeFn(x, z) - 0.6) / 0.4;
        c = mixRgb(c, topLight, crown * 0.35 * fade);
        const t = Math.max(0, Math.min(1, (y - 0.02) / 0.26));
        c = mixRgb(mixRgb(grooveBrown, c, 0.55 + 0.45 * t), c, 0.7);
        // Subtle per-lobe tint so lobes read as separate forms.
        const tint = noise.random(lobeIndex(x, z), 3) - 0.5;
        c = mixRgb(c, tint > 0 ? topLight : grooveBrown, Math.abs(tint) * 0.22);
        // Faint speckle for organic feel, kept off the groove floors.
        const sp = noise.fbm(x * 30, y * 30, z * 30, 2) * 0.5 + 0.5;
        c = mixRgb(c, grooveBrown, sp * 0.06 * fade);
        return c;
      });
    k.body('pumpkin', flesh, {
      color: '#e8821e',
      roughness: 0.6,
      detail: 0.005,
      paintWeight: 2,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 30, y * 30, z * 30, 2),
    });

    // Star calyx: a squashed 5-lobed disc hugging the dimple under the stem.
    const calyx = sdf
      .ellipsoid([0.058, 0.019, 0.058])
      .at(0, 0.262, 0)
      .displace(0.012, (x, y, z) => {
        const r = Math.hypot(x, z);
        if (r < 1e-4) return 0;
        return (0.5 - 0.5 * Math.cos(5 * Math.atan2(z, x))) * Math.min(1, r / 0.04) - 0.2;
      })
      .paintFn((x, y, z, base) => {
        const tip = Math.min(1, Math.hypot(x, z) / 0.06);
        return mixRgb(stemDark, stemGreen, 0.4 + 0.4 * tip);
      });

    // Short thick stem: tapered, slightly bent toward +X/+Z, with woody ridges.
    const stem = sdf
      .cone([0, 0.25, 0], [0.02, 0.335, 0.011], 0.038, 0.019)
      .displace(0.004, (x, y, z) => {
        const r = Math.hypot(x - 0.01, z - 0.005);
        return (0.5 + 0.5 * Math.cos(7 * Math.atan2(z - 0.005, x - 0.01))) * 0.6 - 0.3;
      })
      .smoothUnion(0.015, calyx)
      .smoothUnion(0.012, sdf.sphere(0.02).at(0.02, 0.335, 0.011))
      .paintFn((x, y, z, base) => {
        const ridge = 0.5 + 0.5 * Math.cos(7 * Math.atan2(z - 0.005, x - 0.01));
        let c = mixRgb(stemGreen, stemDark, ridge * 0.55);
        const t = Math.max(0, Math.min(1, (y - 0.25) / 0.09));
        c = mixRgb(c, stemDark, t * 0.3);
        return c;
      });
    k.body('stem', stem, { color: '#4f8a3a', roughness: 0.8, detail: 0.004 });
  },
});
