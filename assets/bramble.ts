import { defineAsset, mixRgb, noise, rgb, sdf, type Sdf } from '../src/index.js';

/**
 * Bramble — forest dressing (catalog `forest/dressing/bramble`): 1.5 m wide, 0.9 m tall, on y = 0.
 *
 * Role: impassable hedge clump; a spiky silhouette that reads at the 128 px sprite size.
 * One idea: a dense tangle of sixteen arching thorny canes spraying from and weaving over
 *   one low mound — messier and spikier than a bush, but every form still chunky (chibi).
 * Shape language: arching spikes (danger) dominant; round mound and blob leaves secondary.
 * Palette: deep bramble greens #2f7a3f (mound shade) and #4a9a4f (leaves), sunlit #7ec850
 *   patches; darker brown-green canes #5f6631 over #3f4a22; pale thorn spikes #c9a06a.
 * Materials: matte foliage (roughness 0.8), woody canes (0.85), pale thorns (0.7).
 * Detail list: (1) low lumpy mound, (2) eight tapered arching cane chains, (3) chunky
 *   thorn cones along the canes, (4) sparse lance leaves. Focal point: pale thorns
 *   over the sunlit crown. Rig: none. Animation: none.
 */

type V3 = [number, number, number];
type Node = [number, number, number, number]; // x, y, z, radius

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const unit = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return l < 1e-9 ? [0, 1, 0] : [a[0] / l, a[1] / l, a[2] / l];
};

const leafDeep = rgb('#2f7a3f');
const leafShadow = rgb('#225c30');
const leafMid = rgb('#4a9a4f');
const leafSun = rgb('#7ec850');
const caneMid = rgb('#5f6631');
const caneDark = rgb('#3f4a22');
const thornPale = rgb('#c9a06a');

/** Eight arching canes: thick at the base, spraying out and drooping at the tips. */
const SPRAY_CANES: readonly (readonly Node[])[] = [
  [[0.02, 0.06, 0.08, 0.052], [0.04, 0.38, 0.22, 0.04], [0.08, 0.62, 0.42, 0.028], [0.12, 0.72, 0.62, 0.015]],
  [[-0.04, 0.06, 0.05, 0.052], [-0.26, 0.34, 0.18, 0.04], [-0.5, 0.55, 0.32, 0.027], [-0.68, 0.6, 0.42, 0.014]],
  [[0.05, 0.06, 0.04, 0.052], [0.28, 0.32, 0.16, 0.04], [0.52, 0.5, 0.28, 0.027], [0.7, 0.54, 0.36, 0.014]],
  [[-0.05, 0.06, 0.0, 0.05], [-0.34, 0.3, 0.03, 0.039], [-0.57, 0.44, 0.06, 0.027], [-0.71, 0.46, 0.08, 0.014]],
  [[0.05, 0.06, -0.01, 0.05], [0.34, 0.32, -0.03, 0.039], [0.57, 0.46, -0.06, 0.027], [0.7, 0.48, -0.07, 0.014]],
  [[-0.03, 0.06, -0.05, 0.052], [-0.18, 0.42, -0.22, 0.04], [-0.3, 0.68, -0.38, 0.027], [-0.37, 0.86, -0.5, 0.014]],
  [[0.03, 0.06, -0.05, 0.052], [0.16, 0.44, -0.2, 0.04], [0.26, 0.68, -0.34, 0.027], [0.31, 0.86, -0.44, 0.014]],
  [[0.0, 0.06, 0.0, 0.048], [0.0, 0.38, 0.03, 0.037], [-0.03, 0.6, 0.07, 0.026], [-0.06, 0.74, 0.12, 0.014]],
];

/** Six weaving canes that cross over the heart — the tangle that sells "impassable". */
const CROSS_CANES: readonly (readonly Node[])[] = [
  [[-0.55, 0.05, 0.15, 0.045], [-0.28, 0.5, 0.1, 0.038], [0.05, 0.72, 0.02, 0.028], [0.5, 0.5, -0.1, 0.016]],
  [[0.55, 0.05, 0.2, 0.045], [0.3, 0.48, 0.12, 0.038], [-0.05, 0.7, 0.0, 0.028], [-0.52, 0.46, -0.12, 0.016]],
  [[-0.5, 0.05, -0.2, 0.045], [-0.25, 0.52, -0.1, 0.038], [0.1, 0.68, 0.05, 0.028], [0.48, 0.42, 0.18, 0.016]],
  [[0.5, 0.05, -0.22, 0.045], [0.22, 0.5, -0.12, 0.038], [-0.12, 0.66, 0.02, 0.028], [-0.46, 0.4, 0.2, 0.016]],
  [[-0.2, 0.05, 0.45, 0.042], [-0.1, 0.5, 0.2, 0.036], [0.1, 0.7, -0.1, 0.026], [0.2, 0.44, -0.42, 0.015]],
  [[0.2, 0.05, -0.45, 0.042], [0.1, 0.52, -0.2, 0.036], [-0.1, 0.72, 0.1, 0.026], [-0.22, 0.46, 0.4, 0.015]],
];

/** Two short upright canes that fill the heart. */
const HEART_CANES: readonly (readonly Node[])[] = [
  [[0.0, 0.06, 0.05, 0.05], [0.05, 0.45, 0.0, 0.04], [0.02, 0.8, -0.05, 0.024], [-0.04, 0.95, -0.08, 0.013]],
  [[-0.05, 0.06, -0.05, 0.05], [-0.02, 0.5, 0.05, 0.04], [0.06, 0.75, 0.08, 0.024], [0.12, 0.88, 0.1, 0.013]],
];

const CANES: readonly (readonly Node[])[] = [...SPRAY_CANES, ...CROSS_CANES, ...HEART_CANES];

/** Linear sample of a cane polyline at t in [0, 1]. */
const sampleCane = (cane: readonly Node[], t: number): V3 => {
  const segs = cane.length - 1;
  const f = clamp01(t) * segs;
  const i = Math.min(segs - 1, Math.floor(f));
  const u = f - i;
  const a = cane[i]!;
  const b = cane[i + 1]!;
  return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
};

/** A chunky thorn: short tapered cone from a cane point along a direction. */
const thorn = (base: V3, dir: V3, len: number): Sdf => {
  const tip: V3 = [base[0] + dir[0] * len, base[1] + dir[1] * len, base[2] + dir[2] * len];
  return sdf.cone([base[0], base[1], base[2]], [tip[0], tip[1], tip[2]], 0.022, 0.006);
};

/** One lance leaf: flat tapered blade, base at origin reaching +Y. */
const leafShape = (h: number, w: number): Sdf =>
  sdf.cone([0, 0, 0], [0, h, 0], w, Math.max(0.01, w * 0.2)).scale([1.25, 1, 0.3]);

export default defineAsset({
  name: 'bramble',
  description: 'A thorny bramble thicket, 1.5 m wide: arching canes, pale thorn spikes, sparse deep-green leaves.',
  detail: 0.01,
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ mound
    // Low dark tuft: it fills the gaps between cane bases so the heart reads as shadow.
    const mound = sdf
      .smoothUnion(
        0.06,
        sdf.ellipsoid([0.58, 0.19, 0.44]).at(0, 0.07, 0),
        sdf.ellipsoid([0.38, 0.13, 0.32]).at(-0.2, 0.05, 0.1),
        sdf.ellipsoid([0.36, 0.12, 0.3]).at(0.22, 0.04, -0.08),
        sdf.ellipsoid([0.3, 0.16, 0.26]).at(0.02, 0.08, -0.18),
      )
      .displace(0.03, (x, y, z) => noise.fbm(x * 9, y * 9, z * 9, 2))
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .paintFn((x, y, z) => {
        const t = clamp01(y / 0.18);
        const v = 0.5 + 0.5 * noise.fbm(x * 5, y * 5, z * 5, 2);
        const lit = mixRgb(leafDeep, leafMid, clamp01(t * 0.35 + v * 0.1));
        return mixRgb(leafShadow, lit, clamp01(0.22 + t * 0.35 + (v - 0.5) * 0.25));
      });
    k.body('mound', mound, {
      color: '#2f7a3f',
      roughness: 0.85,
      detail: 0.025,
      maxTriangles: 500,
      paintWeight: 2,
    });

    // ------------------------------------------------------------------ canes
    const canes = sdf
      .smoothUnion(0.025, ...CANES.map((cane) => sdf.chain(cane.map((n) => [...n] as Node), 0.035)))
      .paintFn((x, y, z) => {
        const groove = 0.5 + 0.5 * noise.fbm(x * 9, y * 2.5, z * 9, 2);
        return mixRgb(caneDark, caneMid, clamp01(0.3 + y * 0.9) * (0.6 + 0.4 * groove));
      });
    k.body('canes', canes, {
      color: '#5f6631',
      roughness: 0.85,
      detail: 0.02,
      maxTriangles: 1200,
      paintWeight: 2,
    });

    // ------------------------------------------------------------------ thorns
    // Six spikes per cane, alternating sides, pointing outward and up past the silhouette.
    const thornShapes: Sdf[] = [];
    CANES.forEach((cane, ci) => {
      const ts = [0.22, 0.36, 0.5, 0.64, 0.78, 0.9];
      ts.forEach((t, ti) => {
        const p = sampleCane(cane, t);
        const radial = unit([p[0], 0, p[2]]);
        const side: V3 = unit([-radial[2], 0, radial[0]]);
        const s = (ti % 2 === 0 ? 1 : -1) * (0.5 + 0.5 * noise.random(ci, ti, 3));
        const dir = unit([
          radial[0] * 0.9 + side[0] * s,
          0.55 + 0.3 * noise.random(ci, ti, 5),
          radial[2] * 0.9 + side[2] * s,
        ]);
        thornShapes.push(thorn(p, dir, 0.085 + 0.03 * noise.random(ci, ti, 7)));
      });
    });
    // Extra upward spikes near the cane tips for a hostile crown.
    CANES.forEach((cane, ci) => {
      if (ci % 2 === 0) {
        const p = sampleCane(cane, 0.97);
        thornShapes.push(thorn(p, unit([p[0] * 0.6, 1, p[2] * 0.6]), 0.075));
      }
    });
    const thorns = sdf.union(...thornShapes).paintFn((_x, y, _z, base) =>
      mixRgb(base, thornPale, clamp01((y - 0.2) / 0.5) * 0.6),
    );
    k.body('thorns', thorns, {
      color: '#c9a06a',
      roughness: 0.7,
      detail: 0.01,
      maxTriangles: 1500,
    });

    // ------------------------------------------------------------------ leaves
    // Broad lance leaves riding the canes, tilted to catch the sun; dense mid-cane.
    const leafShapes: Sdf[] = [];
    CANES.forEach((cane, ci) => {
      [0.28, 0.45, 0.62, 0.8].forEach((t, li) => {
        if (li === 2 && ci % 2 === 1) return; // keep the odd cane's third slot open
        const p = sampleCane(cane, t);
        const radial = unit([p[0], 0, p[2]]);
        const lean = 30 + 25 * noise.random(ci, li, 11);
        const spin = noise.random(ci, li, 13) * 360;
        const h = 0.12 + 0.05 * noise.random(ci, li, 17);
        leafShapes.push(
          leafShape(h, 0.055)
            .rotateZ(lean * (li % 2 === 0 ? 1 : -1))
            .rotateY(spin)
            .at(p[0] + radial[0] * 0.04, p[1] + 0.01, p[2] + radial[2] * 0.04),
        );
      });
    });
    const leaves = sdf.smoothUnion(0.01, ...leafShapes).paintFn((x, y, z) => {
      const t = clamp01((y - 0.15) / 0.6);
      const v = 0.5 + 0.5 * noise.fbm(x * 6, y * 6, z * 6, 2);
      return mixRgb(mixRgb(leafDeep, leafMid, 0.55), leafSun, clamp01(t * 0.8 + (v - 0.5) * 0.35));
    });
    k.body('leaves', leaves, {
      color: '#4a9a4f',
      roughness: 0.8,
      detail: 0.012,
      maxTriangles: 1400,
      paintWeight: 2,
      bump: (x, y, z) => 0.002 * noise.fbm(x * 20, y * 20, z * 20, 2),
    });
  },
});
