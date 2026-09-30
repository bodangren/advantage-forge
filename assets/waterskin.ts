import { defineAsset, mixRgb, rgb, sdf } from '../src/index.js';

/**
 * Waterskin (items/consumables/waterskin), matched to docs/item-mockups/waterskin-mock.jpg.
 * Role: pickup icon. Size: 0.2 m wide, 0.26 m tall, standing upright on y = 0, front toward +Z.
 * One idea: a round leather bag with a ruffled collar, a tilted spout and cork, and a strap through two rings.
 * Palette: leather #b07a48, shadow #7a4e2a, seam and strap #5a3820, cork #c9a06a.
 * Materials: leather (rough 0.8), collar, dark leather seam and strap, spout, cork.
 */
const LEATHER = rgb('#b07a48');
const SHADOW = rgb('#7a4e2a');
const clamp = (v: number, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);
const floor = sdf.halfSpace([0, -1, 0], 0).intersect(sdf.box([1, 0.6, 1]).at(0, 0.3, 0));
const CY = 0.105;
const RAD = [0.1, 0.11, 0.09];
// A point on the bag surface (lifted a little) in a given direction.
const surf = (dx: number, dy: number, dz: number, lift = 1.05): [number, number, number] => {
  const t = 1 / Math.sqrt((dx / RAD[0]) ** 2 + (dy / RAD[1]) ** 2 + (dz / RAD[2]) ** 2);
  return [dx * t * lift, CY + dy * t * lift, dz * t * lift];
};

export default defineAsset({
  name: 'waterskin',
  description: 'A round leather waterskin with a ruffled collar, a tilted wood spout with cork, a side seam, and a strap through two rings.',
  detail: 0.0045,
  reference: 'docs/item-mockups/waterskin-mock.jpg',
  texture: { size: 512 },

  build(k) {
    const bag = sdf.ellipsoid(RAD as [number, number, number]).at(0, CY, 0).intersect(floor);
    k.body(
      'bag',
      bag.paintFn((x, y) => mixRgb(SHADOW, LEATHER, clamp((y - 0.07) / 0.06))),
      { color: '#b07a48', roughness: 0.8, metalness: 0, maxTriangles: 1400 },
    );
    const collar = sdf
      .torus(0.03, 0.012)
      .at(0, 0.208, 0)
      .displace(0.004, (x, y, z) => Math.sin(Math.atan2(z, x) * 6));
    k.body('collar', collar, { color: '#b07a48', roughness: 0.8, metalness: 0, maxTriangles: 500 });

    const seam = bag
      .round(0.003)
      .intersect(sdf.box([0.007, 0.5, 0.5]).at(0.04, 0.15, 0));
    k.body('seam', seam, { color: '#5a3820', roughness: 0.8, metalness: 0, maxTriangles: 500 });

    const s = Math.sin((30 * Math.PI) / 180);
    const c = Math.cos((30 * Math.PI) / 180);
    const base: [number, number, number] = [0, 0.2, 0];
    const tip: [number, number, number] = [0.05 * s, 0.2 + 0.05 * c, 0];
    k.body('spout', sdf.capsule(base, tip, 0.012), { color: '#8a5a30', roughness: 0.8, metalness: 0, maxTriangles: 400 });
    k.body(
      'cork',
      sdf.cylinder(0.015, 0.02, 0.005).rotateZ(-30).at(tip[0] + 0.008 * s, tip[1] + 0.008 * c, 0),
      { color: '#c9a06a', roughness: 0.85, metalness: 0, maxTriangles: 300 },
    );

    const A = surf(0.7, 0.6, 0.25);
    const B = surf(-0.75, -0.5, 0.45);
    const pts: [number, number, number, number][] = [];
    for (let i = 0; i <= 10; i++) {
      const u = i / 10;
      const p = surf(
        A[0] + (B[0] - A[0]) * u,
        A[1] - CY + (B[1] - A[1]) * u,
        A[2] + (B[2] - A[2]) * u + 0.04 * Math.sin(Math.PI * u),
        1.03,
      );
      pts.push([p[0], p[1], p[2], 0.006]);
    }
    const strap = sdf.chain(pts, 0.004);
    const rings = sdf.union(
      sdf.torus(0.013, 0.004).rotateY(90).at(A[0], A[1], A[2]),
      sdf.torus(0.013, 0.004).rotateY(90).at(B[0], B[1], B[2]),
    );
    k.body('strap', sdf.union(strap, rings), { color: '#5a3820', roughness: 0.75, metalness: 0, maxTriangles: 900 });
  },
});
