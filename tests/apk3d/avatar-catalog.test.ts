import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { STARTER_SETS } from '../../src/apk3d/avatar/starters.js';

const [header, ...lines] = readFileSync('docs/avatar-catalog.tsv', 'utf8').trim().split('\n');
const cols = header!.split('\t');
const rows = lines.map((line) => Object.fromEntries(line.split('\t').map((v, i) => [cols[i]!, v])) as Record<string, string>);

describe('the avatar catalog', () => {
  it('gives every piece a GP price or marks it as a reward', () => {
    for (const r of rows) {
      if (r.override === 'reward') expect(r.price, r.id).toBe('reward');
      else expect(Number.isFinite(Number(r.price)) && r.price !== '', r.id).toBe(true);
    }
  });

  it('keeps the reward pieces of the app emblems out of the shop and out of the starter sets', () => {
    const rewards = rows.filter((r) => r.override === 'reward').map((r) => r.id);
    expect(rewards).toContain('apprentice-wand');
    for (const set of STARTER_SETS) for (const id of set.pieces) expect(rewards, `${set.id}: ${id}`).not.toContain(id);
  });
});
