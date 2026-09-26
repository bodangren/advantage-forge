import { defineAsset, mixRgb, motion, noise, rgb, sdf } from '../src/index.js';

/**
 * Stylized oak, about 3.3 m tall: flared roots, a twisting trunk that forks into three limbs,
 * and a canopy of big soft leaf masses (dark underneath, sunlit on top). Sways in the wind.
 */

const bark = rgb('#6b4a33');
const barkDark = rgb('#3b271a');
const moss = rgb('#5d7a35');
const leafDark = rgb('#2f5a2a');
const leaf = rgb('#4f8a3a');
const leafLight = rgb('#9cc45a');

export default defineAsset({
  name: 'oak-tree',
  description: 'Stylized oak with flared roots, forked trunk, and a lumpy sunlit canopy; sways in the wind.',
  detail: 0.014,
  texture: { size: 1024 },

  build(k) {
    k.skeleton({
      root: { at: [0, 0, 0] },
      trunk: { parent: 'root', at: [0, 0.8, 0] },
      crown: { parent: 'trunk', at: [0.08, 1.65, 0.02] },
    });

    // ------------------------------------------------------------------ wood
    const trunk = sdf.chain(
      [
        [0, -0.05, 0, 0.3],
        [0.04, 0.8, 0.02, 0.21],
        [0.1, 1.45, 0.05, 0.17],
        [0.08, 1.7, 0.02, 0.15],
      ],
      0.08,
    );
    const roots = sdf.union(
      ...Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2 + 0.3;
        const r = 0.42 + noise.random(i, 1) * 0.12;
        return sdf.cone([0, 0.55, 0], [Math.cos(a) * r, 0.0, Math.sin(a) * r], 0.17, 0.07);
      }),
    );
    const limbs = sdf.union(
      sdf.chain(
        [
          [0.08, 1.62, 0.02, 0.13],
          [-0.35, 2.05, 0.08, 0.09],
          [-0.65, 2.35, 0.12, 0.06],
        ],
        0.04,
      ),
      sdf.chain(
        [
          [0.08, 1.62, 0.02, 0.13],
          [0.5, 2.0, -0.12, 0.09],
          [0.8, 2.3, -0.2, 0.06],
        ],
        0.04,
      ),
      sdf.chain(
        [
          [0.08, 1.65, 0.02, 0.12],
          [0.05, 2.2, 0.3, 0.08],
          [0.0, 2.55, 0.42, 0.05],
        ],
        0.04,
      ),
    );
    // Bark: vertical ridges (noise stretched along Y), darker in the grooves, moss on the north side.
    const ridges = (x: number, y: number, z: number) => noise.fbm(x * 22, y * 3, z * 22, 3);
    const wood = sdf
      .smoothUnion(0.12, trunk.bone('trunk'), roots.bone('root'))
      .smoothUnion(0.08, limbs.bone('crown'))
      .intersect(sdf.halfSpace([0, -1, 0], 0.02))
      .displace(0.018, ridges)
      .paintFn((x, y, z) => {
        const groove = Math.max(0, -ridges(x, y, z));
        const base = mixRgb(bark, barkDark, Math.min(1, groove * 1.6 + 0.1));
        const mossy =
          Math.max(0, Math.min(1, (-z - 0.1) * 3)) *
          Math.max(0, 1 - y / 0.9) *
          (0.5 + 0.5 * noise.fbm(x * 6, y * 6, z * 6));
        return mixRgb(base, moss, mossy * 0.55);
      });
    k.body('wood', wood, { color: '#6b4a33', roughness: 0.9 });

    // ------------------------------------------------------------------ canopy
    // Distinct leaf clumps with small blends, so each reads as its own mass and a few gaps show
    // the limbs. Each clump is lit on its own: bright top, dark underside (the stylized-tree look).
    const clumps: (readonly [number, number, number, number])[] = [
      [0.0, 2.75, 0.0, 0.62],
      [-0.72, 2.4, 0.15, 0.48],
      [0.82, 2.35, -0.22, 0.5],
      [0.05, 2.4, 0.62, 0.46],
      [0.12, 2.35, -0.66, 0.44],
      [-0.45, 2.95, -0.3, 0.44],
      [0.45, 3.0, 0.3, 0.42],
      [-0.4, 2.6, 0.55, 0.38],
      [0.55, 2.55, 0.55, 0.36],
      [-0.55, 2.55, -0.62, 0.36],
    ];
    const nearest = (x: number, y: number, z: number) => {
      let best = clumps[0]!;
      let bd = Infinity;
      for (const c of clumps) {
        const d = Math.hypot(x - c[0], y - c[1], z - c[2]) - c[3];
        if (d < bd) {
          bd = d;
          best = c;
        }
      }
      return best;
    };
    const canopy = sdf
      .smoothUnion(0.12, ...clumps.map(([x, y, z, r]) => sdf.sphere(r).at(x, y, z)))
      .displace(0.06, (x, y, z) => noise.fbm(x * 2.5, y * 2.5, z * 2.5, 2, 4))
      .displace(0.022, (x, y, z) => noise.noise3(x * 11, y * 11, z * 11, 5))
      .paintFn((x, y, z) => {
        const c = nearest(x, y, z);
        const local = Math.max(0, Math.min(1, ((y - c[1]) / c[3]) * 0.6 + 0.45)); // 0 underside, 1 top
        const global = Math.max(0, Math.min(1, (y - 2.0) / 1.2));
        const t = local * 0.7 + global * 0.3;
        const patch = 0.5 + 0.5 * noise.fbm(x * 4, y * 4, z * 4, 2, 7);
        const base = mixRgb(leafDark, leaf, Math.min(1, t * 1.3));
        return mixRgb(base, leafLight, Math.max(0, t - 0.55) * 1.8 * (0.6 + 0.4 * patch));
      })
      .bone('crown');
    k.body('leaves', canopy, { color: '#4f8a3a', roughness: 0.75, detail: 0.02 });

    // ------------------------------------------------------------------ wind
    const { wave } = motion;
    k.animation('sway', {
      duration: 4,
      pose: (_t, p) => ({
        trunk: { rotate: [0.8 * wave(p, 1, 0.1), 0, 1.2 * wave(p)] },
        crown: { rotate: [1.2 * wave(p, 2, 0.3), 1.5 * wave(p, 1, 0.2), 2 * wave(p, 1, 0.15)] },
      }),
    });
  },
});
