import { defineAsset, sdf } from '../src/index.js';

// Design note: crystal-shard pickup, about 0.3 m wide and 0.32 m tall, flat rock base on y = 0, faces +Z.
// One idea: a tall slender lavender crystal with a pointed tip, ringed by five leaning crystals, glowing core.
// Palette: #d9c4ff crystal (emissive #f0c8ff), #ff9ef0 core, #6d6f7a rock.
// Materials: crystal (opaque, emissive, flat), core (emissive), rock (rough, flat).

// Six-sided prism with a six-facet pyramid tip. Base at the origin, total height h + apex.
const spike = (r: number, h: number, apex: number) => {
  const inr = r * 0.9;
  const t = Math.atan2(apex, inr * 0.9); // facet normal elevation
  const off = inr * Math.cos(t) + Math.sin(t) * h;
  let s = sdf.cylinder(r * 1.25, h + apex + 0.03).at(0, (h + apex + 0.03) / 2, 0);
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    s = s.intersect(sdf.halfSpace([Math.sin(a), 0, Math.cos(a)], inr));
    s = s.intersect(sdf.halfSpace([Math.cos(t) * Math.sin(a), Math.sin(t), Math.cos(t) * Math.cos(a)], off));
  }
  return s.intersect(sdf.halfSpace([0, -1, 0], 0.01)).round(0.002);
};

// Small crystal at azimuth phi (degrees from +Z toward +X), leaning outward.
const small = (phi: number, radius: number, r: number, total: number, lean: number) => {
  const p = (phi * Math.PI) / 180;
  const dx = Math.sin(p), dz = Math.cos(p);
  return spike(r, total - r * 1.8, r * 1.8)
    .rotateX(lean * dz)
    .rotateZ(-lean * dx)
    .at(dx * radius, 0.045, dz * radius);
};

// Faceted lump: a squashed sphere cut by pseudo-random planes, flat at y = 0.
const lump = (r: number, at: [number, number, number], seed: number, planes: number) => {
  let s = sdf.sphere(r).scale([1, 0.85, 1]);
  for (let i = 0; i < planes; i++) {
    const u = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
    const v = Math.sin(seed * 39.346 + i * 11.135) * 24634.6345;
    const a = (u - Math.floor(u)) * Math.PI * 2;
    const e = 0.2 + (v - Math.floor(v)) * 0.9;
    s = s.intersect(sdf.halfSpace([Math.cos(e) * Math.sin(a), Math.sin(e), Math.cos(e) * Math.cos(a)], r * 0.72));
  }
  return s.intersect(sdf.halfSpace([0, -1, 0], 0.0)).at(...at).round(0.003);
};

export default defineAsset({
  name: 'crystal-shard',
  detail: 0.0045,
  reference: 'docs/item-mockups/crystal-shard-mock.jpg',
  texture: { size: 512 },
  build(k) {
    const main = spike(0.045, 0.2, 0.06).rotateZ(-8).at(0, 0.06, 0);
    const crystal = sdf.union(
      main,
      small(-15, 0.06, 0.026, 0.14, 30),
      small(55, 0.065, 0.02, 0.1, 38),
      small(-70, 0.065, 0.022, 0.11, 35),
      small(160, 0.06, 0.028, 0.13, 28),
      small(-150, 0.06, 0.018, 0.08, 40),
    );
    k.body('crystal', crystal, { color: '#d9c4ff', roughness: 0.15, metalness: 0, emissive: '#f0c8ff', emissiveIntensity: 0.35, flat: true, detail: 0.0045 });
    k.body('core', sdf.sphere(0.03).at(0, 0.1, 0.03), { color: '#ff9ef0', roughness: 0.3, metalness: 0, emissive: '#ff9ef0', emissiveIntensity: 0.7, detail: 0.0045 });

    const rock = sdf.union(lump(0.09, [0, 0, -0.005], 1, 7), lump(0.06, [0.095, 0, 0.045], 2, 6), lump(0.05, [-0.085, 0, 0.05], 3, 6));
    k.body('rock', rock, { color: '#6d6f7a', roughness: 0.9, metalness: 0, flat: true, detail: 0.005 });
  },
});
