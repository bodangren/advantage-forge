import { describe, expect, it } from 'vitest';
import { buildAsset, defineAsset, type AssetContext } from '../src/asset.js';
import { addPart, mapTint, sdf, type Part, type PartTint } from '../src/index.js';

/** A two-body test part: a cap on the `head` bone and a pin on the `pin` bone, with one tint slot. */
const testPart = (tint: PartTint): Part => ({
  name: 'test-part',
  bodies: [
    { name: 'cap', shape: sdf.sphere(0.1), options: { color: tint('trim') }, bone: 'head' },
    { name: 'pin', shape: sdf.capsule([0, 0.1, 0], [0, 0.25, 0], 0.04), options: { color: '#808080' }, bone: 'pin' },
  ],
});

/** Records the k.body calls of a host. */
function recorder(slots: readonly string[]): { k: AssetContext; calls: { name: string; bone?: string; color?: unknown; y: number }[] } {
  const calls: { name: string; bone?: string; color?: unknown; y: number }[] = [];
  const k = {
    body: (name: string, shape: sdf.Shape, options: { bone?: string; color?: unknown } = {}) =>
      calls.push({ name, bone: options.bone, color: options.color, y: shape.dist(0, 1, 0) }),
    tint: (slot: string) => {
      if (!slots.includes(slot)) throw new Error(`no slot ${slot}`);
      return `tint:${slot}`;
    },
  } as unknown as AssetContext;
  return { k, calls };
}

describe('equipment parts', () => {
  it('adds the bodies in order, posed, with mapped bones', () => {
    const { k, calls } = recorder(['livery']);
    addPart(k, testPart(mapTint(k, { trim: 'livery' })), { pose: (s) => s.at(0, 1, 0), bones: { pin: 'head' } });
    expect(calls.map((c) => c.name)).toEqual(['cap', 'pin']);
    expect(calls.map((c) => c.bone)).toEqual(['head', 'head']);
    expect(calls[0]!.color).toBe('tint:livery');
    // The pose moved the cap's center to y = 1: the distance there is minus the radius.
    expect(calls[0]!.y).toBeCloseTo(-0.1, 6);
  });

  it('drops every bone for a static asset', () => {
    const { k, calls } = recorder(['trim']);
    addPart(k, testPart(mapTint(k)), { bones: null });
    expect(calls.map((c) => c.bone)).toEqual([undefined, undefined]);
    expect(calls[0]!.color).toBe('tint:trim');
  });

  it('builds as a standalone asset with the part slot as a variant', async () => {
    const asset = defineAsset({
      name: 'test-part-item',
      detail: 0.02,
      texture: false,
      variants: { trim: { red: '#c93a32', blue: '#2f58b8' } },
      build(k) {
        addPart(k, testPart(k.tint), { pose: (s) => s.at(0, 0.1, 0), bones: null });
      },
    });
    const { stats } = await buildAsset(asset);
    expect(stats.bodies.map((b) => b.name)).toEqual(['cap', 'pin']);
    expect(stats.bounds.min[1]).toBeGreaterThan(-0.01);
  });
});
