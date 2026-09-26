import { describe, expect, it } from 'vitest';
import { defineAsset } from '../src/asset.js';
import { checkClips } from '../src/clip-check.js';
import { sdf } from '../src/index.js';

// A head on a neck, and a stick held out to the right; one clip swings the stick through the
// head, the other swings it low in front.
const swinger = defineAsset({
  name: 'swinger',
  detail: 0.01,
  texture: false,
  build(k) {
    k.skeleton({
      chest: { at: [0, 0.3, 0] },
      head: { parent: 'chest', at: [0, 0.45, 0] },
      'hand.R': { parent: 'chest', at: [-0.2, 0.3, 0] },
    });
    k.body('skin', sdf.union(sdf.sphere(0.12).at(0, 0.3, 0).bone('chest'), sdf.sphere(0.15).at(0, 0.6, 0).bone('head')), {});
    k.body('stick', sdf.capsule([-0.2, 0.3, 0], [0.3, 0.3, 0], 0.02), { bone: 'hand.R' });
    // Rotating hand.R about Z lifts the stick's far end; at +30 degrees it crosses the head.
    k.animation('through', { duration: 1, loop: false, pose: (_t, p) => ({ 'hand.R': { rotate: [0, 0, 60 * p] } }) });
    k.animation('clear', { duration: 1, loop: false, pose: (_t, p) => ({ 'hand.R': { rotate: [0, 60 * p, 0] } }) });
  },
});

describe('clip clearance', () => {
  it('finds a held item that passes through the head, and passes a clip that stays clear', async () => {
    const r = await checkClips(swinger, { fps: 30 });
    expect(r.items.map((i) => i.name)).toEqual(['stick']);
    const through = r.clips.find((c) => c.name === 'through')!;
    const clear = r.clips.find((c) => c.name === 'clear')!;
    expect(through.contacts.some((c) => c.region === 'head' && c.depth > 0.05)).toBe(true);
    expect(clear.contacts.filter((c) => c.region === 'head')).toEqual([]);
    // The report measures the closest approach: contact in one clip, nothing near in the other.
    expect(through.closest!.distance).toBeLessThanOrEqual(0);
    expect(clear.closest).toBeNull();
    expect(r.ok).toBe(false);
  });
});
