import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import avatarBase from '../../assets/avatar-base.js';
import { STARTER_SETS } from '../../src/apk3d/avatar/starters.js';

const rows = new Map(
  readFileSync('docs/avatar-catalog.tsv', 'utf8')
    .trim()
    .split('\n')
    .slice(1)
    .map((l) => l.split('\t'))
    .map(([id, slot, tier, twoHanded, status]) => [id!, { slot: slot!, tier: Number(tier), twoHanded: twoHanded === '1', status: status! }]),
);

describe('starter sets', () => {
  it('has 15 classes with ready tier 1 pieces, one per slot, the hair style first', () => {
    expect(STARTER_SETS).toHaveLength(15);
    expect(new Set(STARTER_SETS.map((s) => s.id)).size).toBe(15);
    for (const set of STARTER_SETS) {
      const pieces = set.pieces.map((id) => ({ id, row: rows.get(id) }));
      for (const { id, row } of pieces) {
        expect(row, `${set.id}: ${id}`).toBeDefined();
        expect(row!.status, `${set.id}: ${id}`).toBe('ready');
        expect(row!.tier, `${set.id}: ${id}`).toBe(1);
      }
      expect(pieces[0]!.row!.slot, set.id).toBe('hair');
      const slots = pieces.map((p) => p.row!.slot);
      expect(new Set(slots).size, `${set.id}: one piece per slot`).toBe(slots.length);
      if (pieces.some((p) => p.row!.twoHanded)) expect(slots, `${set.id}: two hands`).not.toContain('offhand');
    }
  });

  it('uses color options of the avatar base', () => {
    for (const set of STARTER_SETS)
      for (const [slot, option] of Object.entries(set.tints)) expect(Object.keys(avatarBase.variants![slot]!), `${set.id}: ${slot}`).toContain(option);
  });
});
