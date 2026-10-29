/**
 * The QC bot plays every demo story to victory through the public commands.
 * Row H13 comes from the track test strategy
 * (measure/tracks/game_magic_defense_rebuild_20261029/test-strategy.md, section 4).
 */
import { describe, expect, it } from 'vitest';
import { storyGameEvidenceSchema } from '../../../src/apk3d/contracts/index.js';
import { createMagicDefense, resultsOf } from '../../../src/games/magic-defense/core/index.js';
import { nextCommand } from '../../../src/games/magic-defense/qc/bot.js';
import { STORY_IDS, active, loadStory, ofType, playToEnd } from './helpers.js';

describe('bot', () => {
  it.each(STORY_IDS.flatMap((id) => [1, 2, 3].map((seed) => [id, seed, seed % 2 === 0] as const)))(
    'H13: %s seed %i helper %s: victory, one evidence item per word, one thrown missile per word, no rejected command',
    (id, seed, helper) => {
      const story = loadStory(id);
      const sim = createMagicDefense(story, { seed, helper });
      const events = playToEnd(sim);
      expect(sim.state.phase).toBe('victory');
      expect(sim.state.targets.every((t) => t.solved && t.correctFirstTry && t.attempts === 1)).toBe(true);
      expect(ofType(events, 'rejected')).toHaveLength(0);
      expect(ofType(events, 'castleHit')).toHaveLength(0);
      expect(ofType(events, 'victory')).toHaveLength(1);
      expect(ofType(events, 'waveCleared')).toHaveLength(sim.state.waveCount);
      const thrown = ofType(events, 'missileThrown').map((e) => e.missile.wordId);
      expect(thrown, 'one missileThrown event per story word').toHaveLength(story.vocabulary.length);
      expect(new Set(thrown), 'every story word is thrown once').toEqual(new Set(story.vocabulary.map((v) => v.id)));
      expect(sim.state.coins).toBeGreaterThan(0);
      expect(sim.state.castles.every((h) => h === sim.state.maxCastleHealth)).toBe(true);
      const { evidence, results, outcome } = resultsOf(sim.state, story, seed, 60_000);
      expect(storyGameEvidenceSchema.parse(evidence)).toEqual(evidence);
      expect(evidence.items).toHaveLength(story.vocabulary.length);
      expect(new Set(evidence.items.map((i) => i.itemId))).toEqual(new Set(story.vocabulary.map((v) => v.id)));
      expect(evidence.items.every((i) => i.itemKind === 'word' && i.solved)).toBe(true);
      expect(results.correctAnswers).toBe(story.vocabulary.length);
      expect(results.score).toBe(sim.state.coins);
      expect(outcome).toBe('victory');
    },
  );

  it('H13: starts the run first, casts the right word of the active missile from the state alone, and returns null when the run is over', () => {
    const sim = createMagicDefense(loadStory('pip-is-brave'), { seed: 1, helper: false });
    expect(nextCommand(sim.state)).toEqual({ type: 'start' });
    sim.dispatch({ type: 'start' });
    let casts = 0;
    for (let i = 0; sim.state.phase === 'playing'; i++) {
      if (i >= 400) throw new Error('the run did not end in 400 steps');
      const c = nextCommand(structuredClone(sim.state));
      expect(nextCommand(sim.state), 'the bot reads the state alone').toEqual(c);
      expect(c).toMatchObject({ type: 'cast' });
      const choice = sim.state.round!.choices.find((x) => x.index === (c as { choice: number }).choice)!;
      expect(choice.wordId, 'the bot casts the right word of the active missile').toBe(active(sim).wordId);
      sim.dispatch(c!);
      casts += 1;
    }
    expect(casts).toBe(sim.state.targetCount);
    expect(nextCommand(sim.state)).toBeNull();
  });
});
