// sprout base scrapped 2026-11-23 (Daniel)
import { describe, expect, it } from 'vitest';
import { ADULT, AGE5 } from '../assets/parts/humanoid-kind.js';
import { gestureTargets } from '../assets/parts/sprout-gestures.js';

/**
 * The Sprout gesture goals name points of the body in child space. `gestureTargets(AGE5)` must
 * reproduce every authored number, so the shipped children keep their exact poses; `P = ADULT`
 * moves each goal to the same place on the grown-up body (in front of the chest, at the jaw,
 * on the hip) instead of inside the belly.
 */
describe.skip('sprout gestures (adult-aware targets) — sprout base scrapped 2026-11-23 (Daniel)', () => {
  const child = gestureTargets(AGE5);

  it('keeps the child clap plane and hand gap', () => {
    expect(child.clap.y).toBeCloseTo(0.3, 9);
    expect(child.clap.z).toBeCloseTo(0.12, 9);
    expect(child.clap.halfScale).toBe(1);
  });

  it('keeps the child touch points', () => {
    expect(child.neck[0]).toBe(-0.058);
    expect(child.neck[1]).toBeCloseTo(0.452, 9);
    expect(child.neck[2]).toBe(0.063);
    expect(child.count[0]).toBe(-0.16);
    expect(child.count[1]).toBeCloseTo(0.43, 9);
    expect(child.count[2]).toBe(0.13);
    expect(child.eat[0]).toBe(-0.06);
    expect(child.eat[1]).toBeCloseTo(0.45, 9);
    expect(child.eat[2]).toBe(0.16);
    expect(child.listen[0]).toBe(-0.2);
    expect(child.listen[1]).toBeCloseTo(0.4, 9);
    expect(child.listen[2]).toBe(0.05);
  });

  it('keeps the child chest and hip points', () => {
    expect(child.self[0]).toBeCloseTo(-0.055, 9);
    expect(child.self[1]).toBeCloseTo(0.315, 9);
    expect(child.self[2]).toBeCloseTo(0.15, 9);
    expect(child.hip[0]).toBeCloseTo(-0.14, 9);
    expect(child.hip[1]).toBeCloseTo(0.21, 9);
    expect(child.hip[2]).toBe(0.03);
    expect(child.hugR[0]).toBeCloseTo(0.035, 9);
    expect(child.hugR[1]).toBeCloseTo(0.33, 9);
    expect(child.hugR[2]).toBeCloseTo(0.165, 9);
    expect(child.hugL[0]).toBeCloseTo(0.035, 9);
    expect(child.hugL[1]).toBeCloseTo(0.3, 9);
    expect(child.hugL[2]).toBeCloseTo(0.14, 9);
  });

  it('moves each adult goal to the same place on the grown-up body', () => {
    const adult = gestureTargets(ADULT);
    for (const point of [
      adult.neck,
      adult.self,
      adult.count,
      adult.hip,
      adult.eat,
      adult.hugR,
      adult.hugL,
      adult.listen,
    ])
      for (const v of point) expect(Number.isFinite(v)).toBe(true);
    // Hands meet in front of the adult chest, above the child plane.
    expect(adult.clap.y).toBeGreaterThan(0.55);
    expect(adult.clap.z).toBeGreaterThan(0.12);
    expect(adult.clap.halfScale).toBeCloseTo(1.5, 9);
    expect(adult.headF).toBeCloseTo(0.8, 9);
    expect(child.headF).toBe(1);
    // Touch points ride up with the head: the throat, the jaw, the chin, the cheek.
    expect(adult.neck[1]).toBeGreaterThan(0.85);
    expect(adult.count[1]).toBeGreaterThan(0.83);
    expect(adult.eat[1]).toBeGreaterThan(0.85);
    expect(adult.listen[1]).toBeGreaterThan(0.8);
    // The chest and hip points ride up with the torso.
    expect(adult.self[1]).toBeGreaterThan(0.5);
    expect(adult.hip[1]).toBeGreaterThan(0.35);
    // Lateral offsets stay on the wider torso.
    expect(Math.abs(adult.self[0])).toBeGreaterThan(0.055);
    expect(Math.abs(adult.hip[0])).toBeGreaterThan(0.14);
  });
});
