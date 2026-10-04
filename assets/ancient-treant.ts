import { noise, sdf } from '../src/index.js';
import { ogreAsset } from './parts/ogre-kind.js';

/**
 * Ancient treant — Chibi Quest monster (catalog `monsters/giant-and-ancient/ancient-treant`), an old
 * giant tree about 1.6 m tall to the top of its branches, faces +Z. Target:
 * docs/monster-mockups/ancient-treant_001.jpg (made with mmx from the treant mockup).
 *
 * The ogre brute (`assets/ogre-brute.ts`; body, head, rig, and clips from `assets/parts/ogre-kind.ts`)
 * at giant scale as an old treant: grey-brown bark skin with raised bark ridges down the trunk, a
 * broad wooden nose and a stern frown, a long beard and side locks of green moss, a skirt of bark,
 * a crown of bare branches with clusters of orange autumn leaves, small orange mushrooms on the
 * shoulders, and a knotted log for a club.
 * Role: an old guardian of the deep woods; the branch crown with orange leaves and the moss beard
 *   read at 128 px.
 * Palette (60/30/10): grey-brown #6e604e bark; green #6a9a3a moss; orange #e8803a leaves and
 *   mushrooms as the accent.
 * Bodies added: bark ridges (on the trunk), branch crown and leaves (rigid on the head), mushrooms
 * (on the chest), log club (on `hand.R`).
 */
type V3 = [number, number, number];

export default ogreAsset({
  name: 'ancient-treant',
  description: 'Chibi ancient treant monster: an old giant tree creature with grey-brown bark skin and bark ridges, a broad wooden nose, a stern frown, a long green moss beard, a bark skirt, a crown of bare branches with orange autumn leaves, small orange mushrooms on its shoulders, and a knotted log club.',
  reference: 'docs/monster-mockups/ancient-treant_001.jpg',
  scale: 1.45,
  headScale: 1.15,
  variants: {
    skin: { bark: '#6e604e', oak: '#6a4c32', ash: '#8a8478' },
    cloth: { bark: '#6a5a48', root: '#5a4030', lichen: '#7a8064' },
    leather: { root: '#4a3a2a', dark: '#2e241a', pale: '#8a7a60' },
    mane: { moss: '#6a9a3a', lichen: '#9aaa6a', rust: '#a8743a' },
  },
  presets: {
    oak: { skin: 'oak', cloth: 'root', leather: 'dark', mane: 'rust' },
    ash: { skin: 'ash', cloth: 'lichen', leather: 'pale', mane: 'lichen' },
  },
  colors: { skinDark: '#54483a', skinLight: '#867664', lid: '#54483a', mouth: '#3a2a1e', redDark: '#4a3a2a', hide: '#6a5a48' },
  nose: 'human',
  tusks: 0,
  mane: { beard: true, locks: true, back: false, tuft: false },
  weapon(_k, o) {
    // A knotted log: a thick branch up from the grip, two knots, and a short broken twig.
    const log = sdf.chain(
      [
        [0, -0.1, 0, 0.03],
        [0.005, 0.1, 0, 0.036],
        [-0.005, 0.24, 0, 0.044],
        [0, 0.35, 0, 0.05],
      ],
      0.02,
    );
    const knots = sdf.union(sdf.sphere(0.022).at(0.035, 0.17, 0.01), sdf.sphere(0.022).at(-0.04, 0.28, -0.01));
    const twig = sdf.cone([0.03, 0.22, 0], [0.09, 0.28, 0.02], 0.012, 0.005);
    const wood = sdf.smoothUnion(0.015, log, knots, twig).displace(0.004, (x, y, z) => noise.fbm(x * 24, y * 8, z * 24, 3));
    o.put('log-club', o.weapon(wood), { color: o.tone('skin', '#6a5a46'), roughness: 0.85, bone: 'hand.R', detail: 0.005, bump: (x, y, z) => 0.0015 * noise.fbm(x * 40, y * 12, z * 40, 2) });
  },
  extra(_k, o) {
    const dark = o.tone('skin', '#5e5040');
    // Bark ridges: a thin shell over the trunk where vertical slabs at many angles cross it, so the
    // ridges run down the body and wander a little.
    const shell = o.trunk.round(0.009).subtract(o.trunk.round(-0.002));
    const slabs = sdf.union(...Array.from({ length: 9 }, (_, i) => sdf.box([0.013, 2, 2]).rotateY(i * 20 + 7)));
    const ridges = shell
      .intersect(slabs.displace(0.01, (x, y, z) => noise.fbm(x * 8, y * 6, z * 8, 2)))
      .intersect(sdf.box([1, 0.5, 1]).at(0, 0.48, 0));
    o.put('bark-ridges', ridges, { color: dark, roughness: 0.9, detail: 0.004 });
    // A crown of bare branches on the top of the head, forked, with clusters of orange leaves.
    const top = (x: number, z: number): V3 => sdf.raycast(o.headShape, [x, 2, z], [0, -1, 0])! as V3;
    const leaf = o.tone('mane', '#e8803a', 0.2);
    const branches: sdf.Shape[] = [];
    const clusters: sdf.Shape[] = [];
    (
      [
        [-0.06, 0.0, -0.14, 0.17, 0.02],
        [0.06, 0.0, 0.14, 0.18, 0.01],
        [0, -0.05, 0.0, 0.21, -0.1],
        [-0.035, 0.035, -0.07, 0.15, 0.1],
        [0.04, -0.035, 0.09, 0.15, -0.08],
        [0.0, 0.04, 0.02, 0.13, 0.11],
      ] as const
    ).forEach(([x, z, dx, h, dz], i) => {
      const r = top(x, z);
      const mid: V3 = [r[0] + dx * 0.5, r[1] + h * 0.55, r[2] + dz * 0.5];
      const tip: V3 = [r[0] + dx, r[1] + h, r[2] + dz];
      const fork: V3 = [mid[0] - dx * 0.6 + (i % 2 ? 0.03 : -0.03), mid[1] + h * 0.35, mid[2] + 0.02];
      branches.push(
        sdf.chain([[r[0], r[1] - 0.015, r[2], 0.028], [...mid, 0.019], [...tip, 0.009]], 0.01),
        sdf.chain([[...mid, 0.014], [...fork, 0.006]], 0.008),
      );
      for (const [p, s] of [[tip, 1.7], [fork, 1.3]] as const) {
        clusters.push(
          sdf.union(
            ...Array.from({ length: 5 }, (_, j) => {
              const a = j * 1.7 + i;
              return sdf.ellipsoid([0.022 * s, 0.012 * s, 0.018 * s]).rotateY((a * 180) / Math.PI).at(p[0] + Math.cos(a) * 0.016 * s, p[1] + 0.006 * (j % 2), p[2] + Math.sin(a) * 0.016 * s);
            }),
          ),
        );
      }
    });
    o.put('branches', o.head(sdf.union(...branches)).bone('head'), { color: dark, roughness: 0.85, detail: 0.004 });
    o.put('leaves', o.head(sdf.union(...clusters)).bone('head'), { color: leaf, roughness: 0.7, detail: 0.003 });
    // Small orange mushrooms on the shoulders.
    const shroom = (p: V3, s: number) =>
      sdf.smoothUnion(
        0.004,
        sdf.cylinder(0.008 * s, 0.025 * s).at(p[0], p[1] + 0.012 * s, p[2]).paint('#f2e8d4'),
        sdf.ellipsoid([0.022 * s, 0.012 * s, 0.022 * s]).at(p[0], p[1] + 0.026 * s, p[2]),
      );
    const SH = o.joints.SH;
    const shoulder = (x: number, z: number): V3 => sdf.raycast(o.trunk, [x, 2, z], [0, -1, 0]) as V3;
    const shrooms = sdf.union(
      shroom(shoulder(SH[0] - 0.04, 0.02), 1.2),
      shroom(shoulder(SH[0] - 0.08, -0.02), 0.8),
      shroom(shoulder(-SH[0] + 0.06, 0.0), 1),
    );
    o.put('mushrooms', shrooms.bone('chest'), { color: leaf, roughness: 0.6, detail: 0.003 });
  },
});
