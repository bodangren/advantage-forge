import { defineAsset, mixRgb, noise, rgb, sdf, profile, type Vec3 } from '../src/index.js';

/**
 * items/crafting/dragon-scale. Role: crafting pickup, 128 px sprite. Size ~0.3 m tall, propped at 70 deg.
 * One idea: a shield of overlapping red scales in a dark leathery spiked rim with gold studs.
 * Palette: red #c8302a, low edge #8e1e1a, rim #5a3a2e, gold #d4a93a, wedge #2a2024.
 * Materials: face, scales (metal 0.3), rim (rough 0.8), gold studs (metal 1), wedge.
 */
const RED = rgb('#c8302a');
const RED_DARK = rgb('#8e1e1a');
const FACE = rgb('#a82228');

export default defineAsset({
  name: 'dragon-scale',
  description: 'A big red dragon scale shield of overlapping scales, spiked leather rim, gold studs, propped on a wedge.',
  reference: 'docs/item-mockups/dragon-scale-mock.jpg',
  detail: 0.004,
  texture: { size: 1024 },
  build(k) {
    const outline = profile.polygon(
      [[-0.11, 0.12], [-0.06, 0.135], [0.06, 0.135], [0.11, 0.12], [0.1, 0], [0.06, -0.08], [0, -0.13], [-0.06, -0.08], [-0.1, 0]],
      { smooth: true },
    );
    const pose = (s: ReturnType<typeof sdf.sphere>) => s.rotateX(-20).at(0, 0.165, 0.02);
    const face = sdf.extrude(outline, 0.03, 0.006);
    const outer = sdf.extrude(profile.offsetProfile(outline, 0.02), 0.046, 0.006);
    const rim = sdf.subtract(outer, sdf.extrude(outline, 0.3));

    // scales: four rows of overlapping discs, clipped to the face
    const rows = [0.09, 0.04, -0.01, -0.06];
    const discs = rows.flatMap((y, r) => {
      const xs = r % 2 === 0 ? [-0.07, 0, 0.07] : r === 3 ? [-0.03, 0.03] : [-0.105, -0.035, 0.035, 0.105];
      return xs.map((x) => sdf.sphere(0.045).scale([1, 1, 0.25]).at(x, y, 0.01));
    });
    const scales = sdf
      .union(...discs)
      .intersect(sdf.extrude(profile.offsetProfile(outline, -0.004), 0.3))
      .paintFn((x, y) => {
        const r = Math.max(0, Math.min(3, Math.round((0.09 - y) / 0.05)));
        const dy = y - (0.09 - 0.05 * r);
        const u = Math.max(0, Math.min(1, (-0.012 - dy) / 0.014));
        return mixRgb(RED, RED_DARK, u);
      });

    // spikes and studs, placed on the rim by ray
    const at = (deg: number): { p: Vec3; d: Vec3 } => {
      const a = (deg * Math.PI) / 180;
      const d: Vec3 = [Math.cos(a), Math.sin(a), 0];
      const p = sdf.raycast(outer, [d[0] * 1, d[1] * 1, 0], [-d[0], -d[1], 0]) ?? [d[0] * 0.12, d[1] * 0.12, 0];
      return { p, d };
    };
    const spikes = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
      const { p, d } = at(22.5 + 45 * i);
      return sdf.cone(
        [p[0] - d[0] * 0.01, p[1] - d[1] * 0.01, 0],
        [p[0] + d[0] * 0.03, p[1] + d[1] * 0.03, 0],
        0.016,
        0.005,
      );
    });
    const studs = [0, 1, 2, 3, 4, 5].map((i) => {
      const { p, d } = at(15 + 60 * i + (i > 2 ? 0 : 0));
      return sdf.sphere(0.012).at(p[0] - d[0] * 0.01, p[1] - d[1] * 0.01, 0.022);
    });

    k.body('face', pose(face), { color: FACE, roughness: 0.4, metalness: 0.3, detail: 0.005, maxTriangles: 500 });
    k.body('scales', pose(scales), { color: RED, roughness: 0.35, metalness: 0.3, detail: 0.005, maxTriangles: 1400 });
    k.body('rim', pose(sdf.smoothUnion(0.006, rim, ...spikes)), { color: rgb('#5a3a2e'), roughness: 0.8, detail: 0.005, maxTriangles: 1500, bump: (x, y, z) => 0.0008 * noise.noise3(x * 70, y * 70, z * 70) });
    k.body('studs', pose(sdf.union(...studs)), { color: rgb('#d4a93a'), roughness: 0.35, metalness: 1, detail: 0.004, maxTriangles: 400 });
    k.body('wedge', sdf.box([0.14, 0.06, 0.07], 0.01).at(0, 0.03, -0.09), { color: rgb('#2a2024'), roughness: 0.9, detail: 0.005 });
  },
});
