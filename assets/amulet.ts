import { defineAsset, mixRgb, rgb, sdf, profile, type Rgb } from '../src/index.js';

// Design note — gold four-point star amulet (equipment/accessories/amulet).
//
// Role: equipment pickup and inventory icon; must read at 128 px.
// Size: 0.36 m tall, 0.3 m wide, 0.06 m deep, upright on y = 0, faces +Z.
// One idea: a chunky four-point star medallion holding a deep red oval gem.
// Shape language: diamond and points (dominant), oval bezel and ring (secondary).
// Palette: gold #d4a93a (60%), dark gold #a07a20 in recesses (30%),
//   red gem #b01818 with glow #ff2a2a (10% accent).
// Materials: gold (metal 1, rough 0.35) and gem (rough 0.15, faint emissive).
// Detail: rounded diamond + four triangular points, raised oval bezel with
//   eight dots, oval cabochon, fat bail ring and bead. No chain.
// Rig/animation: none.

const GOLD = rgb('#d4a93a');
const GOLD_DARK = rgb('#a07a20');
const CY = 0.15; // medallion center height
const T = 0.06;

export default defineAsset({
  name: 'amulet',
  description: 'Gold four-point star medallion with a red oval gem and a fat bail ring.',
  detail: 0.0045,
  reference: 'docs/item-mockups/amulet-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    const diamond = sdf.extrude(profile.rect([0.14, 0.14], 0.02), T, 0.015).rotateZ(45);
    const tri = profile.polygon([
      [-0.045, 0],
      [0.045, 0],
      [0, 0.06],
    ]);
    const points: sdf.Shape[] = [];
    for (let i = 0; i < 4; i++) {
      points.push(sdf.extrude(tri, T, 0.012).at(0, 0.085, 0).rotateZ(i * 90));
    }
    const medal = sdf.smoothUnion(0.008, diamond, ...points).at(0, CY, 0);

    const bezelZ = 0.01;
    const bezel = sdf
      .ellipsoid([0.075, 0.095, 0.03])
      .subtract(sdf.ellipsoid([0.062, 0.082, 0.04]))
      .at(0, CY, bezelZ);
    const dots: sdf.Shape[] = [];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
      dots.push(sdf.sphere(0.01).at(Math.cos(a) * 0.075, CY + Math.sin(a) * 0.095, 0.035));
    }
    const bail = sdf.torus(0.035, 0.014).rotateX(90).at(0, 0.324, 0);
    const bead = sdf.sphere(0.017).at(0, 0.292, 0.0);

    const gold = sdf
      .smoothUnion(0.006, medal, bezel, bail, bead)
      .union(...dots)
      .paintFn((x, y, z, base): Rgb => {
        // dark gold in recesses: the flat face between bezel and rim edge
        const dx = Math.abs(x);
        const dy = Math.abs(y - CY);
        const recess = z < 0.031 && z > 0.02 && dx + dy > 0.09 ? 0.7 : 0;
        const edge = z < 0.02 ? 0.25 : 0;
        return mixRgb(GOLD, GOLD_DARK, Math.max(recess, edge));
      });
    k.body('gold', gold, { color: '#d4a93a', roughness: 0.35, metalness: 1, detail: 0.004, maxTriangles: 2600 });

    const gem = sdf.ellipsoid([0.055, 0.075, 0.035]).at(0, CY, 0.02);
    k.body('gem', gem, {
      color: '#b01818',
      roughness: 0.15,
      metalness: 0.05,
      emissive: '#ff2a2a',
      emissiveIntensity: 0.3,
      detail: 0.004,
      textureDensity: 2,
      maxTriangles: 700,
    });
  },
});
