/** T14: the QC bot plays every demo story to victory on the state alone, in both modes. */
import { describe, expect, it } from 'vitest';
import { storyGameEvidenceSchema } from '../../../src/apk3d/contracts/index.js';
import { createTwinSoul, resultsOf } from '../../../src/games/paladins-twin-soul/core/index.js';
import { nextStrike } from '../../../src/games/paladins-twin-soul/qc/bot.js';
import { STORY_IDS, loadStory, ofType, playToEnd } from './helpers.js';

const CASES = STORY_IDS.flatMap((id) => [1, 2, 3].flatMap((seed) => [false, true].map((helper) => [id, seed, helper] as const)));

describe('T14 bot', () => {
  it.each(CASES)('T14 %s seed %i helper %s: victory, one bolt per word, no dive, no monster', (id, seed, helper) => {
    const story = loadStory(id);
    const sim = createTwinSoul(story, { seed, helper });
    const events = playToEnd(sim);
    expect(sim.state.phase).toBe('victory');
    expect(sim.state.targets.every((t) => t.solved && t.correctFirstTry)).toBe(true);
    // The bot strikes the captor only: one bolt per word and no dive.
    expect(ofType(events, 'boltFired')).toHaveLength(story.vocabulary.length);
    expect(ofType(events, 'soulFreed')).toHaveLength(story.vocabulary.length);
    expect(ofType(events, 'shadeDived')).toHaveLength(0);
    expect(ofType(events, 'shadeFaded')).toHaveLength(0);
    expect(ofType(events, 'strikeRejected')).toHaveLength(0);
    for (const type of ['monsterAppeared', 'monsterDefeated', 'heroStrike', 'monsterStrike']) expect(ofType(events, type)).toHaveLength(0);
    expect(ofType(events, 'victory')).toHaveLength(1);
    const { evidence, results, outcome } = resultsOf(sim.state, story, seed, 60_000);
    expect(storyGameEvidenceSchema.parse(evidence)).toEqual(evidence);
    expect(evidence.items).toHaveLength(story.vocabulary.length);
    expect(new Set(evidence.items.map((i) => i.itemId))).toEqual(new Set(story.vocabulary.map((v) => v.id)));
    expect(evidence.items.every((i) => i.itemKind === 'word' && i.solved && i.attempts === 1)).toBe(true);
    expect(results.correctAnswers).toBe(story.vocabulary.length);
    expect(results.score).toBe(sim.state.score);
    expect(outcome).toBe('victory');
  });

  it('T14 (pass at Red, kept row): returns null when the run is over', () => {
    const sim = createTwinSoul(loadStory('the-school-garden'), { seed: 1, helper: false });
    expect(nextStrike(sim.state)).not.toBeNull();
    playToEnd(sim);
    expect(nextStrike(sim.state)).toBeNull();
    expect(sim.dispatch({ type: 'strike', shade: 'w1s1' })).toEqual([]);
  });
});
