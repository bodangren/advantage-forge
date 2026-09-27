import { defineAsset, sdf, profile, noise, mixRgb, rgb } from '../src/index.js';

// Design note (market apple, props/food/apple):
// - Role: tiny cozy-market pickup/prop; must read at 128 px sprite.
// - Size: ~0.12 m across, stands on y = 0, faces +Z (radially symmetric).
// - One idea: a plump shiny red apple with a stem dip, short stem, one leaf.
// - Shape language: round/chunky dominant; pointed leaf tip as secondary.
// - Palette: red #d92b1f (60), highlight #ff7a55, stem #6b4426, leaf #4f9a3a.
// - Materials: apple glossy (rough 0.35), stem wood (0.85), leaf satin (0.55).
// - Detail: revolved body with stem bowl; cone stem; extruded pointed leaf.
// - Rig/animation: none (static prop).

const RED = rgb('#d92b1f');
const RED_DARK = rgb('#a3150e');
const HIGHLIGHT = rgb('#ff8a63');
const STEM_C = '#6b4426';
const LEAF_C = '#4f9a3a';
const LEAF_LIGHT = rgb('#7ec850');

export default defineAsset({
  name: 'apple',
  description: 'A single shiny red apple with a short stem and one green leaf.',
  detail: 0.002,
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------ body
    // Revolved apple: plump sides, rounded base, rim + dipped stem bowl.
    const appleProfile = profile.polygon(
      [
        [0, 0.007],
        [0.03, 0.007],
        [0.052, 0.016],
        [0.06, 0.035],
        [0.061, 0.055],
        [0.056, 0.078],
        [0.044, 0.095],
        [0.028, 0.103],
        [0.016, 0.102],
        [0.01, 0.094],
        [0, 0.092],
      ],
      { smooth: true, samples: 12 },
    );
    const apple = sdf
      .revolve(appleProfile)
      .paintFn((x, y, z, base) => {
        // Soft shiny highlight toward front-left-top, warm shade at the base,
        // darker stem bowl.
        const d = (x * 0.55 + y * 0.45 + z * 0.7) / 0.09;
        const hi = Math.max(0, Math.min(1, (d - 0.35) / 0.6));
        const shade = Math.max(0, Math.min(1, (0.03 - y) / 0.03));
        const r = Math.hypot(x, z);
        const bowl = y > 0.086 && r < 0.022 ? 1 - r / 0.022 : 0;
        const varn = 0.5 + 0.5 * noise.fbm(x * 40, y * 40, z * 40, 2);
        let c = mixRgb(RED, HIGHLIGHT, hi * hi * 0.6);
        c = mixRgb(c, RED_DARK, shade * 0.55 + bowl * 0.45);
        return mixRgb(c, RED, varn * 0.1);
      });
    k.body('apple', apple, {
      color: '#d92b1f',
      roughness: 0.35,
      metalness: 0,
      textureDensity: 2,
      paintWeight: 2,
    });

    // ------------------------------------------------------------ stem
    // Short brown stem rising from the bowl, tilted slightly toward +X.
    const stemBase: [number, number, number] = [0, 0.09, 0];
    const stemTop: [number, number, number] = [0.008, 0.128, 0.002];
    const stem = sdf.smoothUnion(
      0.003,
      sdf.cone(stemBase, stemTop, 0.006, 0.0035),
      sdf.sphere(0.004).at(stemTop[0], stemTop[1], stemTop[2]),
    );
    k.body('stem', stem, { color: STEM_C, roughness: 0.85, metalness: 0 });

    // ------------------------------------------------------------ leaf
    // Small pointed leaf reaching toward +X, tilted up, base at the stem.
    // Outline starts at the base (x = 0) so it grows out of one side only.
    const outline = profile.polygon(
      [
        [0, 0],
        [0.012, 0.015],
        [0.033, 0.014],
        [0.056, 0],
        [0.033, -0.014],
        [0.012, -0.015],
      ],
      { smooth: true, samples: 8 },
    );
    const leaf = sdf
      .extrude(outline, 0.005, 0.002)
      .at(0, 0, -0.0025)
      .rotateX(-90)
      .rotateY(-15)
      .rotateZ(22)
      .rotateX(28)
      .at(0.006, 0.117, 0.002)
      .paintFn((x, y, z, base) => {
        // Lighter toward the leaf tip.
        const t = Math.max(0, Math.min(1, (x - 0.006) / 0.055));
        return mixRgb(base, LEAF_LIGHT, t * 0.45 + 0.08);
      });
    k.body('leaf', leaf, { color: LEAF_C, roughness: 0.55, metalness: 0 });
  },
});
