import { describe, expect, it } from 'vitest';
import { BOSS_HP, BOSS_NAME, CLASS_SIZE, simulateClassBoss } from '../../src/demo/core/classBoss.js';

describe('simulateClassBoss', () => {
  it('reports a class of 30 with 60% to 80% played and 5 to 25 damage each', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const r = simulateClassBoss(seed, 8);
      expect(r.bossName).toBe(BOSS_NAME);
      expect(r.maxHp).toBe(BOSS_HP);
      expect(r.classSize).toBe(CLASS_SIZE);
      expect(r.played).toBeGreaterThanOrEqual(Math.round(29 * 0.6) + 1);
      expect(r.played).toBeLessThanOrEqual(Math.round(29 * 0.8) + 1);
      expect(r.hpBefore).toBeGreaterThanOrEqual(0);
      expect(r.hpBefore).toBeLessThanOrEqual(BOSS_HP - (r.played - 1) * 5);
      expect(r.hpBefore).toBeGreaterThanOrEqual(BOSS_HP - (r.played - 1) * 25);
      expect(r.hpAfter).toBe(Math.max(0, r.hpBefore - 8));
      expect(r.yourDamage).toBe(8);
      expect(r.defeated).toBe(r.hpAfter === 0);
    }
  });

  it('lists the student first among the last five helpers, with distinct names', () => {
    const r = simulateClassBoss(123, 6);
    expect(r.helpers.length).toBe(5);
    expect(r.helpers[0]).toEqual({ name: 'You', damage: 6 });
    const names = r.helpers.map((h) => h.name);
    expect(new Set(names).size).toBe(5);
    for (const h of r.helpers.slice(1)) {
      expect(h.damage).toBeGreaterThanOrEqual(5);
      expect(h.damage).toBeLessThanOrEqual(25);
    }
  });

  it('does not rank helpers by damage', () => {
    // Across many seeds the four classmates are not always in descending order.
    const sorted = Array.from({ length: 40 }, (_, seed) =>
      simulateClassBoss(seed, 2).helpers.slice(1),
    ).filter((h) => h.every((c, i) => i === 0 || h[i - 1]!.damage >= c.damage));
    expect(sorted.length).toBeLessThan(40);
  });

  it('is deterministic per seed', () => {
    expect(simulateClassBoss(77, 10)).toEqual(simulateClassBoss(77, 10));
    expect(simulateClassBoss(77, 10).hpBefore).not.toBe(simulateClassBoss(78, 10).hpBefore);
  });

  it('clamps negative damage to zero and never goes below zero hp', () => {
    expect(simulateClassBoss(5, -3).yourDamage).toBe(0);
    const r = simulateClassBoss(5, 100000);
    expect(r.hpAfter).toBe(0);
    expect(r.defeated).toBe(true);
  });
});
