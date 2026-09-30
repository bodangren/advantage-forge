import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Sling (equipment/ranged-weapons/sling), matched to docs/item-mockups/sling-mock.jpg.
 * Role: equipment pickup. Size: 0.5 m wide, 0.55 m tall, upright on y = 0, facing +Z.
 * One idea: a fat round leather pouch with a grey stone in its open top and a wide strap arching over it.
 * Shape language: round. Palette: leather #c8683a, pale trim #e8c880, stone #8a9298 with #b0b6bc top.
 * Materials: leather (pouch, strap), trim (rim, buckle), stone.
 */

export default defineAsset({
  name: 'sling',
  description: 'A fat upright leather sling pouch holding a grey stone, with an arched strap and a pale buckle.',
  detail: 0.007,
  reference: 'docs/item-mockups/sling-mock.jpg',
  texture: { size: 512 },

  build(k) {
    const pouch = sdf
      .sphere(0.22)
      .at(0, 0.22, 0)
      .intersect(sdf.box([1, 0.34, 1]).at(0, 0.17, 0))
      .subtract(sdf.sphere(0.17).at(0, 0.3, 0));
    const strap = sdf
      .torus(0.18, 0.03)
      .rotateX(90)
      .scale([1, 1, 1.8])
      .at(0, 0.34, 0)
      .intersect(sdf.box([1, 0.3, 1]).at(0, 0.49, 0));
    const leather = sdf.smoothUnion(0.01, pouch, strap).paintFn((x, y, z, base) =>
      mixRgb(base, rgb('#a85428'), 0.25 * (0.5 + 0.5 * noise.fbm(x * 30, y * 30, z * 30, 2))),
    );
    k.body('leather', leather, { color: '#c8683a', roughness: 0.7, metalness: 0 });

    const rim = sdf.torus(0.19, 0.025).at(0, 0.34, 0);
    const buckle = sdf.smoothUnion(
      0.005,
      sdf.box([0.1, 0.12, 0.04], 0.018).rotateY(-20).at(-0.08, 0.16, 0.2),
      sdf.cylinder(0.02, 0.03).rotateX(90).at(-0.08, 0.16, 0.222),
    );
    k.body('trim', sdf.union(rim, buckle), { color: '#e8c880', roughness: 0.5, metalness: 0.1 });

    const stone = sdf
      .sphere(0.13)
      .at(0, 0.36, 0)
      .displace(0.01, (x, y, z) => noise.fbm(x * 20, y * 20, z * 20, 2))
      .paintFn((_x, y, _z, base) => mixRgb(rgb('#8a9298'), rgb('#b0b6bc'), Math.min(1, Math.max(0, (y - 0.4) / 0.08))));
    k.body('stone', stone, { color: '#8a9298', roughness: 0.9, metalness: 0 });
  },
});
