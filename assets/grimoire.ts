import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Grimoire (equipment/magic-weapons/grimoire): an open spell book 0.42 m wide lying flat on y = 0.
 * One idea: dark red leather covers with iron corners, open pages with drawn red runes, a glowing
 * green sigil on the right page, and a ribbon bookmark. Palette: cover #7a1e22 / #5a1418, pages
 * #f2e3c2 / lines #c9b28a, runes #8a2a1a, iron #4f545a, sigil glow #5cf55c on a dark base #0a2a0a.
 * No mockup: the mmx image showed a closed box.
 */

const PAGE = rgb('#f2e3c2');
const LINE = rgb('#c9b28a');
const RUNE = rgb('#8a2a1a');

export default defineAsset({
  name: 'grimoire',
  description: 'An open grimoire: dark red leather covers with iron corners, pages with red runes, a glowing green sigil, and a ribbon.',
  detail: 0.003,
  texture: { size: 1024 },

  build(k) {
    const cover = (s: number) => sdf.box([0.2, 0.012, 0.28], 0.004).rotateZ(s * 4).at(s * 0.104, 0.008, 0);
    k.body(
      'covers',
      sdf.union(cover(1), cover(-1), sdf.cylinder(0.016, 0.28, 0.004).rotateX(90).at(0, 0.008, 0)).paintFn((x, y, z) =>
        mixRgb(rgb('#7a1e22'), rgb('#5a1418'), 0.2 + 0.4 * (0.5 + 0.5 * noise.fbm(x * 40, y * 40, z * 40, 2))),
      ),
      { color: '#7a1e22', roughness: 0.6, metalness: 0 },
    );
    // Page blocks: each side bulges up toward the spine and slopes down to the fore-edge.
    const pages = (s: number) =>
      sdf
        .box([0.19, 0.03, 0.265], 0.006)
        .at(s * 0.1, 0.03, 0)
        .smoothUnion(0.02, sdf.ellipsoid([0.06, 0.035, 0.13]).at(s * 0.035, 0.04, 0))
        .intersect(sdf.halfSpace([-s * 0.12, 1, 0], 0.052));
    k.body(
      'pages',
      sdf.union(pages(1), pages(-1)).paintFn((x, y, z) => {
        if (y < 0.04) return mixRgb(PAGE, LINE, Math.pow(0.5 + 0.5 * Math.cos(y * 1400), 6));
        const rune = Math.abs(Math.sin(x * 140) * Math.sin(z * 90)) > 0.93 && Math.abs(z) < 0.11 && x < -0.03;
        return rune ? RUNE : PAGE;
      }),
      { color: '#f2e3c2', roughness: 0.85, metalness: 0, textureDensity: 2 },
    );
    const corners = [];
    for (const sx of [1, -1]) for (const sz of [1, -1]) corners.push(sdf.box([0.04, 0.02, 0.04], 0.004).at(sx * 0.19, 0.01, sz * 0.125));
    k.body('iron', sdf.union(...corners), { color: '#4f545a', roughness: 0.5, metalness: 0.75 });
    // Sigil: a ring and a triangle lying on the right page.
    const ring = sdf.torus(0.045, 0.004).at(0.1, 0.05, 0);
    const tri = [0, 1, 2].map((i) => {
      const a = (i * 2 * Math.PI) / 3 - Math.PI / 2;
      const b = ((i + 1) * 2 * Math.PI) / 3 - Math.PI / 2;
      return sdf.capsule([0.1 + Math.cos(a) * 0.04, 0.05, Math.sin(a) * 0.04], [0.1 + Math.cos(b) * 0.04, 0.05, Math.sin(b) * 0.04], 0.0035);
    });
    k.body('sigil', sdf.union(ring, ...tri), { color: '#0a2a0a', roughness: 0.3, metalness: 0, emissive: '#5cf55c', emissiveIntensity: 1.8, detail: 0.002 });
    k.body('ribbon', sdf.box([0.012, 0.003, 0.2], 0.001).rotateX(8).at(0.01, 0.03, 0.2), { color: '#c0302a', roughness: 0.6, metalness: 0 });
  },
});
