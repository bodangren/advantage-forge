/** The QC bot plays every demo story to victory through the public commands (rows B1 to B3). */
import { describe, expect, it } from 'vitest';
import { storyGameEvidenceSchema } from '../../../src/apk3d/contracts/index.js';
import { createCastleDefense, resultsOf, type CastleDefenseEvent, type CastleDefenseState } from '../../../src/games/castle-defense/core/index.js';
import { nextCommand } from '../../../src/games/castle-defense/qc/bot.js';
import { STORY_IDS, buildSentence, loadStory, ofType, playToEnd, spotsOf, widestSpot } from './helpers.js';

/** The events of each `build`: from its `towerBuilt` to its `waveCleared`. */
function waves(events: readonly CastleDefenseEvent[]): CastleDefenseEvent[][] {
  const out: CastleDefenseEvent[][] = [];
  let current: CastleDefenseEvent[] | null = null;
  for (const e of events) {
    if (e.type === 'towerBuilt') current = [];
    if (current) current.push(e);
    if (e.type === 'waveCleared' && current) {
      out.push(current);
      current = null;
    }
  }
  return out;
}

describe('bot', () => {
  it.each(STORY_IDS.flatMap((id) => [1, 2, 3, 4].map((seed) => [id, seed, seed % 2 === 0] as const)))(
    'B1 %s seed %i helper %s: victory, a wave in steps per sentence, one evidence item per sentence',
    (id, seed, helper) => {
      const story = loadStory(id);
      const sim = createCastleDefense(story, { seed, helper });
      const events = playToEnd(sim);
      expect(sim.state.phase).toBe('victory');
      expect(sim.state.shift.every((s) => s.cleared && s.wrongs === 0)).toBe(true);
      expect(ofType(events, 'rejected')).toHaveLength(0);
      expect(ofType(events, 'attackerStrike')).toHaveLength(0);
      expect(ofType(events, 'victory')).toHaveLength(1);
      expect(ofType(events, 'waveCleared')).toHaveLength(sim.state.waveCount);
      expect(ofType(events, 'towerBuilt')).toHaveLength(sim.state.waveCount);
      const perWave = waves(events);
      expect(perWave).toHaveLength(sim.state.waveCount);
      for (const wave of perWave) expect(ofType(wave, 'waveStep').length, 'waveStep events of a wave').toBeGreaterThan(0);
      expect(sim.state.coins).toBeGreaterThan(0);
      const { evidence, results, outcome } = resultsOf(sim.state, story, seed, 60_000);
      expect(storyGameEvidenceSchema.parse(evidence)).toEqual(evidence);
      expect(evidence.items).toHaveLength(sim.state.waveCount);
      expect(evidence.items.every((i) => i.itemKind === 'sentence' && i.solved && i.correctFirstTry && i.attempts === 1)).toBe(true);
      expect(new Set(evidence.items.map((i) => i.itemId)).size).toBe(evidence.items.length);
      expect(evidence.items.every((i) => story.sentences.some((s) => s.id === i.itemId && s.text === i.label))).toBe(true);
      expect(results.score).toBe(sim.state.coins);
      expect(outcome).toBe('victory');
    },
  );

  it('uses every sentence of a story that has six or fewer (guard)', () => {
    const sim = createCastleDefense(loadStory('the-school-garden'), { seed: 1, helper: false });
    playToEnd(sim);
    expect(resultsOf(sim.state, loadStory('the-school-garden'), 1, 1).evidence.items).toHaveLength(6);
  });

  it('B2 in the place stage the bot picks the spot with the most path steps, the lowest index on a tie', () => {
    const sim = createCastleDefense(loadStory('pip-is-brave'), { seed: 1, helper: false });
    sim.dispatch({ type: 'start' });
    buildSentence(sim);
    expect(sim.state.stage).toBe('place');
    expect(spotsOf(sim.state).length).toBeGreaterThan(0);
    expect(nextCommand(sim.state)).toEqual({ type: 'build', spot: widestSpot(sim.state) });

    // The rule reads the ranges only: a tie goes to the lowest index, and a built level does not count.
    const place = sim.snapshot();
    const withSpots = (spots: CastleDefenseState['spots']): CastleDefenseState => ({ ...place, spots });
    const tie = withSpots([
      { spot: 0, covers: [0], level: 0 },
      { spot: 1, covers: [1, 2, 3], level: 2 },
      { spot: 2, covers: [3, 4, 5], level: 0 },
      { spot: 3, covers: [2], level: 0 },
    ]);
    expect(nextCommand(tie)).toEqual({ type: 'build', spot: 1 });
    const last = withSpots([
      { spot: 0, covers: [0, 1], level: 0 },
      { spot: 1, covers: [1], level: 0 },
      { spot: 2, covers: [2, 3, 4, 5], level: 1 },
    ]);
    expect(nextCommand(last)).toEqual({ type: 'build', spot: 2 });
  });

  it('B3 starts the run first, picks the right word, builds a tower, and returns null when the run is over', () => {
    const sim = createCastleDefense(loadStory('pip-is-brave'), { seed: 1, helper: false });
    expect(nextCommand(sim.state)).toEqual({ type: 'start' });
    sim.dispatch({ type: 'start' });
    const c = nextCommand(sim.state);
    expect(c).toMatchObject({ type: 'pick' });
    expect(sim.state.step!.choices.find((x) => x.index === (c as { choice: number }).choice)!.right).toBe(true);
    while (sim.state.stage === 'collect') sim.dispatch(nextCommand(sim.state)!);
    expect(nextCommand(sim.state)).toMatchObject({ type: 'build' });
    playToEnd(sim);
    expect(nextCommand(sim.state)).toBeNull();
  });
});
