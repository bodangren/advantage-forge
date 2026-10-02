import { defineAsset, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Coral reef cluster (nature/underwater): about 1 m wide, 0.8 m tall, on y = 0, on a 0.9 m sand base.
 * One idea: a candy-bright chibi clump, a tall hot pink staghorn in the middle, ringed by a yellow
 * brain dome, orange-red tubes, and a violet plate fan. Round, chunky, saturated.
 * Palette: sand #e8d3a0, pink #ff4f9a (slot 'coral'), yellow #ffd23a, orange-red #ff6a3a, violet #9b5cf0.
 */

type P3 = [number, number, number];
const branch = (pts: [number, number, number, number][]) => sdf.chain(pts, 0.03);

export default defineAsset({
  name: 'coral-reef-cluster',
  description: 'A bright chibi coral clump: pink staghorn, yellow brain dome, orange tube cluster, and violet plate fan on a sand base.',
  detail: 0.006,
  texture: { size: 1024 },
  variants: { coral: { pink: '#ff4f9a', orange: '#ff8a2a', violet: '#a45cf0' } },

  build(k) {
    const sand = sdf
      .cylinder(0.45, 0.07, 0.03)
      .at(0, 0.035, 0)
      .scale([1, 1, 0.92])
      .displace(0.006, (x, y, z) => noise.fbm(x * 8, y * 8, z * 8, 2));
    k.body('sand', sand.paint('#e8d3a0'), { color: '#e8d3a0', roughness: 0.95, metalness: 0, bump: (x, y, z) => 0.5 * noise.fbm(x * 30, y * 30, z * 30, 2) });

    const bumps = (shape: ReturnType<typeof sdf.sphere>) =>
      shape.displace(0.006, (x, y, z) => Math.max(0, noise.noise3(x * 55, y * 55, z * 55)));

    // Staghorn: thick trunk with three forks, tall, center-back.
    const stag = sdf.smoothUnion(
      0.03,
      branch([[-0.05, 0.05, -0.05, 0.075], [-0.06, 0.25, -0.06, 0.06], [-0.08, 0.5, -0.07, 0.05], [-0.1, 0.72, -0.06, 0.035]]),
      branch([[-0.06, 0.25, -0.06, 0.055], [0.06, 0.42, -0.08, 0.045], [0.14, 0.6, -0.07, 0.035], [0.17, 0.74, -0.06, 0.028]]),
      branch([[-0.08, 0.45, -0.07, 0.045], [-0.2, 0.55, -0.05, 0.04], [-0.27, 0.66, -0.04, 0.03]]),
      branch([[0.06, 0.42, -0.08, 0.04], [0.02, 0.58, -0.02, 0.032], [0.0, 0.7, 0.0, 0.026]]),
    );
    k.body('staghorn', bumps(stag as never).paint(k.tint('coral')), { color: k.tint('coral'), roughness: 0.6, metalness: 0 });

    // Brain dome, front-left.
    const brain = sdf
      .sphere(0.19)
      .scale([1, 0.7, 1])
      .at(-0.2, 0.12, 0.18);
    const grooveCol = (x: number, y: number, z: number) =>
      Math.abs(Math.sin(x * 45 + Math.sin(z * 38) * 1.6 + y * 18)) < 0.35;
    k.body('brain', brain.paintFn((x, y, z, base) => (grooveCol(x, y, z) ? rgb('#e08a1a') : base)), {
      color: '#ffd23a',
      roughness: 0.6,
      metalness: 0,
      maxTriangles: 8000,
      bump: (x, y, z) => 0.6 * noise.fbm(x * 40, y * 40, z * 40, 2),
    });

    // Tube cluster, front-right: seven open tubes of mixed height.
    const tubeData: [number, number, number, number][] = [
      [0.22, 0.2, 0.2, 0.055], [0.33, 0.12, 0.13, 0.05], [0.12, 0.1, 0.28, 0.045],
      [0.3, 0.1, 0.3, 0.04], [0.4, 0.08, 0.22, 0.035], [0.18, 0.08, 0.1, 0.035], [0.25, 0.05, 0.4, 0.03],
    ];
    const tubes = sdf.smoothUnion(
      0.02,
      ...tubeData.map(([x, h, z, r]) => {
        const t = sdf.cylinder(r, h + 0.1, 0.012).at(x, (h + 0.1) / 2 + 0.03, z);
        return t.subtract(sdf.cylinder(r * 0.55, 0.06).at(x, h + 0.1, z));
      }),
    );
    k.body('tubes', tubes.paint('#ff6a3a'), { color: '#ff6a3a', roughness: 0.6, metalness: 0 });

    // Violet plate fan, back-right, standing edge-on and tilted.
    const plateShape = profile.polygon(
      [[0, 0], [-0.2, 0.12], [-0.25, 0.3], [-0.13, 0.43], [0, 0.4], [0.13, 0.44], [0.25, 0.3], [0.2, 0.12]] as [number, number][],
      { smooth: true },
    );
    const plate = sdf.extrude(plateShape, 0.05, 0.02).rotateY(-25).rotateZ(8).at(0.3, 0.06, -0.12);
    const ribs = sdf.union(
      ...Array.from({ length: 5 }, (_, i) => sdf.capsule([0.3 + (i - 2) * 0.01, 0.1, -0.1] as P3, [0.3 + (i - 2) * 0.09, 0.4, -0.1] as P3, 0.02)),
    );
    void ribs;
    k.body('plate', plate.paintFn((x, y, z, base) => (Math.sin((x * 1.0 + z * 0.5) * 90) > 0.6 ? rgb('#c590ff') : base)), {
      color: '#9b5cf0',
      roughness: 0.6,
      metalness: 0,
      maxTriangles: 8000,
    });

    // Small accent blobs: little pink-yellow knobs on the sand.
    const knobs = sdf.union(
      sdf.sphere(0.05).at(-0.38, 0.09, -0.05),
      sdf.sphere(0.035).at(-0.3, 0.08, -0.2),
      sdf.sphere(0.04).at(0.02, 0.09, 0.38),
    );
    k.body('knobs', knobs.paint('#ff9ac8'), { color: '#ff9ac8', roughness: 0.6, metalness: 0 });
  },
});
