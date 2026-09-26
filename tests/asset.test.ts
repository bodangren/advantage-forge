import { NodeIO } from '@gltf-transform/core';
import { describe, expect, it } from 'vitest';
import { buildAsset, defineAsset } from '../src/asset.js';
import { toGlb } from '../src/gltf.js';
import { sdf } from '../src/index.js';

const asset = defineAsset({
  name: 'test-asset',
  detail: 0.01,
  texture: false,
  build(k) {
    k.body('base', sdf.cylinder(0.2, 0.1, 0.02).at(0, 0.05, 0), { color: '#808080' });
    k.group('arm', { at: [0, 0.1, 0], rotate: [0, 0, 30] }, (g) => {
      g.body('arm.segment', sdf.capsule([0, 0, 0], [0, 0.3, 0], 0.04).paint('#ff0000'), { metalness: 1 });
    });
  },
});

describe('asset build and GLB export', () => {
  it('keeps names, hierarchy, pivots, materials, and vertex colors', async () => {
    const { root, stats } = await buildAsset(asset);
    expect(stats.bodies.map((b) => b.name)).toEqual(['base', 'arm.segment']);
    expect(stats.bounds.min[1]).toBeGreaterThan(-0.01);

    const doc = await new NodeIO().readBinary(await toGlb(root));
    const nodes = doc.getRoot().listNodes();
    const arm = nodes.find((n) => n.getName() === 'arm')!;
    expect(arm.getTranslation()[1]).toBeCloseTo(0.1);
    expect(arm.listChildren().map((n) => n.getName())).toEqual(['arm.segment']);
    const prim = nodes
      .find((n) => n.getName() === 'arm.segment')!
      .getMesh()!
      .listPrimitives()[0]!;
    expect(prim.getAttribute('COLOR_0')).not.toBeNull();
    expect(prim.getAttribute('NORMAL')).not.toBeNull();
    expect(prim.getMaterial()!.getMetallicFactor()).toBe(1);
    const color = prim.getAttribute('COLOR_0')!.getElement(0, []);
    expect(color[0]).toBeCloseTo(1, 2);
    expect(color[1]).toBeCloseTo(0, 2);
  });

  it('unwraps into one atlas and bakes textures', async () => {
    const textured = defineAsset({ ...asset, texture: { size: 256 } });
    const { root, stats } = await buildAsset(textured);
    expect(stats.texture?.size).toBe(256);
    const doc = await new NodeIO().readBinary(await toGlb(root));
    expect(doc.getRoot().listTextures()).toHaveLength(3);
    for (const node of doc.getRoot().listNodes()) {
      const prim = node.getMesh()?.listPrimitives()[0];
      if (!prim) continue;
      expect(prim.getAttribute('COLOR_0')).toBeNull();
      const uv = prim.getAttribute('TEXCOORD_0')!;
      const tangent = prim.getAttribute('TANGENT')!;
      for (let i = 0; i < uv.getCount(); i++) {
        const [u, v] = uv.getElement(i, []) as number[];
        expect(u).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
        const [x, y, z, w] = tangent.getElement(i, []) as number[];
        expect(Math.hypot(x!, y!, z!)).toBeCloseTo(1, 3);
        expect(Math.abs(w!)).toBe(1);
      }
      const mat = prim.getMaterial()!;
      expect(mat.getBaseColorTexture()).not.toBeNull();
      expect(mat.getNormalTexture()).not.toBeNull();
      expect(mat.getOcclusionTexture()).not.toBeNull();
    }
    const png = doc.getRoot().listTextures()[0]!.getImage()!;
    expect([...png.subarray(1, 4)].map((c) => String.fromCharCode(c)).join('')).toBe('PNG');
  });

  it('keeps glow brighter than 1 with KHR_materials_emissive_strength', async () => {
    const { KHRMaterialsEmissiveStrength, EmissiveStrength } = await import('@gltf-transform/extensions');
    const glowing = defineAsset({
      name: 'glow',
      texture: false,
      build(k) {
        k.body('eye', sdf.sphere(0.05).at(0, 0.05, 0), {
          color: '#ff5a2a',
          emissive: '#ff5a2a',
          emissiveIntensity: 2.5,
        });
      },
    });
    const { root } = await buildAsset(glowing);
    const doc = await new NodeIO()
      .registerExtensions([KHRMaterialsEmissiveStrength])
      .readBinary(await toGlb(root));
    const mat = doc.getRoot().listMaterials()[0]!;
    expect(Math.max(...mat.getEmissiveFactor())).toBeCloseTo(1, 5);
    const ext = mat.getExtension<InstanceType<typeof EmissiveStrength>>('KHR_materials_emissive_strength');
    expect(ext?.getEmissiveStrength()).toBeCloseTo(2.5, 3);
  });

  it('rejects duplicate part names', async () => {
    const bad = defineAsset({
      name: 'bad',
      build(k) {
        k.body('a', sdf.sphere(0.1));
        k.body('a', sdf.sphere(0.1));
      },
    });
    await expect(buildAsset(bad)).rejects.toThrow(/Duplicate part name 'a'/);
  });
});
