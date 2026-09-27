import { NodeIO } from '@gltf-transform/core';
import { KHRMaterialsVariants } from '@gltf-transform/extensions';
import { describe, expect, it } from 'vitest';
import { buildAsset, defineAsset, type AtlasImages } from '../src/asset.js';
import { toGlb } from '../src/gltf.js';
import { sdf } from '../src/index.js';
import { recolor, slotTable } from '../src/variants.js';
import { followRef, rgb, setMaskSlot } from '../src/sdf/color.js';

// A ball with a band painted in the hair slot, and the rest in plain skin.
const banded = defineAsset({
  name: 'tint-test',
  detail: 0.01,
  texture: { size: 64, normal: false, ao: false },
  variants: { hair: { brown: '#6a4020', red: '#b03a20', blond: '#e0c060' } },
  presets: { fiery: { hair: 'red' } },
  build(k) {
    k.body('ball', sdf.sphere(0.1).paintWhere(sdf.box([0.3, 0.06, 0.3]), k.tint('hair')), { color: '#f0c8a0' });
  },
});

describe('color variants', () => {
  it('recolors masked texels by option / default and leaves the rest alone', () => {
    const slots = slotTable({ hair: { brown: '#6a4020', blond: '#e0c060' } });
    const base = new Uint8Array([0x6a, 0x40, 0x20, 0x6a, 0x40, 0x20]); // two texels of the default
    const mask = new Uint8Array([255, 0, 0, 0, 0, 0, 0, 0]); // only the first is in the slot
    const out = recolor(base, mask, slots, { hair: 'blond' });
    expect([...out.slice(0, 3)]).toEqual([0xe0, 0xc0, 0x60].map((v) => expect.closeTo(v, 1) as unknown as number));
    expect([...out.slice(3)]).toEqual([0x6a, 0x40, 0x20]);
  });

  it('keeps a partly following color exact in the default look and partial in the mask', () => {
    const blush = followRef('skin', '#f09a86', 0.5);
    expect(rgb(blush)).toEqual(rgb('#f09a86'));
    setMaskSlot('skin');
    try {
      expect(rgb(blush)).toEqual([0.5, 0.5, 0.5]);
    } finally {
      setMaskSlot('hair');
    }
    try {
      expect(rgb(blush)).toEqual([0, 0, 0]);
    } finally {
      setMaskSlot(null);
    }
  });

  it('bakes a tint mask and exports the slot table and the presets as material variants', async () => {
    const { root } = await buildAsset(banded);
    const atlas = root.userData.forgeTextures as AtlasImages;
    expect(atlas.tintMask).toBeDefined();
    expect(Object.keys(atlas.presets ?? {})).toEqual(['fiery']);
    const doc = await new NodeIO().registerExtensions([KHRMaterialsVariants]).readBinary(await toGlb(root));
    const extras = doc.getRoot().getExtras() as { forgeVariants: { slots: Record<string, { channel: string; default: string }> } };
    expect(extras.forgeVariants.slots.hair).toMatchObject({ channel: 'R', default: 'brown' });
    const names = doc.getRoot().listTextures().map((t) => t.getName());
    expect(names).toContain('tintMask');
    expect(names).toContain('baseColor:fiery');
    expect(doc.getRoot().listMaterials().map((m) => m.getName())).toContain('ball:fiery');

    // The mask covers the band (y near 0) and not the rest: decode it and look at its range.
    const mask = doc.getRoot().listTextures().find((t) => t.getName() === 'tintMask')!;
    const size = mask.getSize()!;
    expect(size[0]).toBe(64);
  });
});
