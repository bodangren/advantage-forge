/** Green guards for signed zero, small inputs, and a copied bot cache result. */
import { describe, expect, it } from 'vitest';
import { createArchersRevenge, layoutOf, pathOf, TUNING } from '../../../src/games/archers-revenge/core/index.js';
import { aimForLane, nextCommand } from '../../../src/games/archers-revenge/qc/bot.js';

describe('Green aim guards', () => {
  it('signed zero gives the same path and event as zero', () => {
    for (const lanes of [2, 3]) {
      const layout = layoutOf(lanes);
      for (const power of [10, 50, 100]) {
        expect(pathOf(layout, -0, power)).toStrictEqual(pathOf(layout, 0, power));
      }
    }
    const run = (angle: number) => {
      const sim = createArchersRevenge([{ term: 'cat', translation: 'แมว' }], { seed: 1, helper: false });
      sim.dispatch({ type: 'start' });
      return sim.dispatch({ type: 'fire', angle, power: 50 });
    };
    expect(run(-0)).toStrictEqual(run(0));
  });

  it('one distinct term has one reachable target in both modes', () => {
    for (const helper of [false, true]) {
      const sim = createArchersRevenge([{ term: 'cat', translation: 'แมว' }], { seed: 1, helper });
      expect(sim.state.layout.targets).toHaveLength(1);
      sim.dispatch(nextCommand(sim.state)!);
      sim.dispatch(nextCommand(sim.state)!);
      expect(sim.state.phase).toBe('victory');
      expect(sim.state.targets[0]!.attempts).toBe(1);
    }
  });

  it('mutating a returned aim or layout does not change a later bot command', () => {
    const layout = layoutOf(TUNING.lanes);
    const first = aimForLane(layout, 0)!;
    const saved = { ...first };
    first.angle = 80;
    first.power = 10;
    expect(aimForLane(structuredClone(layout), 0)).toEqual(saved);
    layout.targets[0]!.x0 = -100;
    expect(layoutOf(TUNING.lanes).targets[0]!.x0).toBe(8);
  });
});
