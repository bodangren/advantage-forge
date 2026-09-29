import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note - plain brown cloth robe (equipment/armor/cloth-robe).
 * Role: equipment display piece, reads at 128 px. Size 1.0 m, on y = 0, faces +Z.
 * One idea: a chunky friar robe with big turned-back cuffs and a fat twisted rope belt.
 * Shape language: round and soft. Palette: brown #8a5a35, walnut #6b4226, rope #c9a06a/#b5814a.
 * Materials: cloth, cuffs (walnut), rope. Rig: none.
 */
const BROWN = rgb('#8a5a35');
const WALNUT = rgb('#6b4226');
const ROPE = rgb('#c9a06a');
const ROPE_DARK = rgb('#b5814a');
const ss = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export default defineAsset({
  name: 'cloth-robe',
  description: 'Plain brown chibi cloth robe on an invisible body: bell body, wide cuffed sleeves, rope belt, folded hood.',
  detail: 0.006,
  reference: 'bench/overnight/refs/p1-gear/cloth-robe-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    const bell = profile.polygon(
      [
        [0, 1.0], [0.05, 1.0], [0.1, 0.98], [0.15, 0.93], [0.18, 0.86], [0.19, 0.8],
        [0.2, 0.7], [0.22, 0.58], [0.24, 0.46], [0.275, 0.3], [0.305, 0.15],
        [0.32, 0.06], [0.32, 0.03], [0.3, 0.018], [0, 0.016],
      ],
      { smooth: true, samples: 14 },
    );
    const core = sdf.revolve(bell).intersect(sdf.halfSpace([0, 1, 0], 1.0));
    const sleeveL = sdf.cone([0.17, 0.9, 0], [0.42, 0.56, 0.05], 0.1, 0.09).round(0.01);
    const sleeves = sleeveL.mirror('x', 0);
    const hood = sdf.ellipsoid([0.22, 0.12, 0.13]).rotateX(-15).at(0, 0.93, -0.14);
    const collar = sdf.torus(0.15, 0.04).scale([1, 0.6, 1]).at(0, 0.98, 0);
    const wrapAt = (s: sdf.Shape) => s.rotateZ(3.8).at(0.01, 0.5, 0);
    const strip = wrapAt(sdf.box([0.07, 0.93, 0.7], 0.03).at(0, 0.025, 0.3)).intersect(
      sdf.smoothUnion(0.03, core, collar).round(0.012),
    );
    const base = sdf
      .smoothUnion(0.03, core, sleeves)
      .smoothUnion(0.02, hood, collar)
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const body = base
      .smoothUnion(0.01, strip)
      .displace(0.01, (x, y, z) => {
        const a = Math.atan2(z, x);
        return Math.sin(a * 5 + 0.4) * (1 - ss(0.0, 0.3, y)) * 0.8;
      })
      .paintFn((x, y, z) => {
        let c = mixRgb(BROWN, WALNUT, 0.6 * ss(0.3, 0.03, y));
        const p = 0.5 + 0.5 * noise.fbm(x * 4, y * 4, z * 4, 2);
        return mixRgb(c, WALNUT, 0.15 * p);
      })
      .paintWhere(wrapAt(sdf.box([0.01, 0.86, 0.9], 0.004).at(0.04, 0.085, 0.3)), WALNUT, 0.004);
    k.body('robe', body, {
      color: '#8a5a35', roughness: 0.9, metalness: 0, detail: 0.007, maxTriangles: 2100,
      bump: (x, y, z) => 0.0015 * noise.fbm(x * 40, y * 40, z * 40, 2),
    });

    const cuffPose = (sh: sdf.Shape) => sh.rotateZ(36).rotateY(-8).at(0.42, 0.56, 0.05).mirror('x', 0);
    k.body('cuffs', cuffPose(sdf.cylinder(0.12, 0.08, 0.03).at(0, 0.0, 0)), {
      color: '#8a5a35', roughness: 0.9, metalness: 0, detail: 0.006, maxTriangles: 1000,
    });
    k.body('cuff-inner', cuffPose(sdf.cylinder(0.098, 0.02, 0.008).at(0, -0.036, 0)), {
      color: '#6b4226', roughness: 0.9, metalness: 0, detail: 0.005, maxTriangles: 600,
    });

    const Y = 0.5;
    const belt = sdf.torus(0.215, 0.028).scale([1, 0.9, 1]).at(0, Y, 0);
    const knot = sdf.sphere(0.045).at(0, Y, 0.235);
    const ends = sdf.union(
      sdf.chain([[0.01, Y - 0.03, 0.25, 0.022], [0.03, 0.38, 0.265, 0.02], [0.045, 0.28, 0.27, 0.019], [0.07, 0.22, 0.27, 0.018]], 0.01),
      sdf.chain([[-0.01, Y - 0.03, 0.25, 0.022], [-0.04, 0.4, 0.265, 0.02], [-0.06, 0.3, 0.27, 0.019], [-0.09, 0.24, 0.27, 0.018]], 0.01),
    );
    const strand = (x: number, y: number, z: number) => {
      const a = Math.atan2(z, x);
      const b = Math.atan2((y - Y) / 0.9, Math.hypot(x, z) - 0.215);
      return Math.sin(3 * b + 22 * a);
    };
    const rope = sdf.union(belt, knot, ends).paintFn((x, y, z) =>
      mixRgb(ROPE, ROPE_DARK, 0.5 * (0.5 + 0.5 * noise.fbm(x * 18, y * 18, z * 18, 2))),
    );
    k.body('rope', rope, {
      color: '#c9a06a', roughness: 0.9, metalness: 0, detail: 0.005, maxTriangles: 900,
      bump: (x, y, z) => 0.0012 * Math.max(0, strand(x, y, z)),
    });
  },
});
