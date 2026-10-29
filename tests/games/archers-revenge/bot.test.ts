/**
 * The QC bot plays every demo story to victory through the public commands. Row id R13 refers
 * to the track test strategy, section 4: the bot aims with the core shot function and fires the
 * first grid pair (angle ascending, then power ascending) that hits the right target.
 */
import { describe, expect, it } from 'vitest';
import { storyGameEvidenceSchema } from '../../../src/apk3d/contracts/index.js';
import { createArchersRevenge, resultsOf } from '../../../src/games/archers-revenge/core/index.js';
import { nextCommand } from '../../../src/games/archers-revenge/qc/bot.js';
import { STORY_IDS, aimAt, blockedOf, contactOf, layoutOfState, loadStory, needAim, ofType, playToEnd, rightLane } from './helpers.js';

describe('bot', () => {
  it.each(STORY_IDS.flatMap((id) => [1, 2, 3].map((seed) => [id, seed, seed % 2 === 0] as const)))(
    'R13: %s seed %i helper %s: victory, one evidence item per word, no miss, no rejected command',
    (id, seed, helper) => {
      needAim('shotOf');
      const story = loadStory(id);
      const sim = createArchersRevenge(story, { seed, helper });
      const events = playToEnd(sim);
      expect(sim.state.phase).toBe('victory');
      expect(sim.state.targets.every((t) => t.solved && t.correctFirstTry && t.attempts === 1)).toBe(true);
      expect(ofType(events, 'missed')).toHaveLength(0);
      expect(ofType(events, 'rejected')).toHaveLength(0);
      expect(ofType(events, 'enemyStrike')).toHaveLength(0);
      expect(ofType(events, 'shot')).toHaveLength(story.vocabulary.length);
      expect(ofType(events, 'shot').every((e) => Number.isInteger(e.angle) && Number.isInteger(e.power))).toBe(true);
      expect(ofType(events, 'victory')).toHaveLength(1);
      expect(ofType(events, 'waveCleared')).toHaveLength(sim.state.waveCount);
      expect(sim.state.coins).toBeGreaterThan(0);
      const { evidence, results, outcome } = resultsOf(sim.state, story, seed, 60_000);
      expect(storyGameEvidenceSchema.parse(evidence)).toEqual(evidence);
      expect(evidence.items).toHaveLength(story.vocabulary.length);
      expect(new Set(evidence.items.map((i) => i.itemId))).toEqual(new Set(story.vocabulary.map((v) => v.id)));
      expect(evidence.items.every((i) => i.itemKind === 'word' && i.solved)).toBe(true);
      expect(results.correctAnswers).toBe(story.vocabulary.length);
      expect(results.score).toBe(sim.state.coins);
      expect(outcome).toBe('victory');
    },
    120_000,
  );

  it.each([false, true])('R13: helper %s: the bot starts first, fires the first hitting pair in grid order, and is repeatable', (helper) => {
    needAim('shotOf');
    const sim = createArchersRevenge(loadStory('pip-is-brave'), { seed: 1, helper });
    expect(nextCommand(sim.state)).toEqual({ type: 'start' });
    sim.dispatch({ type: 'start' });
    for (let step = 0; step < 4 && sim.state.phase === 'playing'; step++) {
      const c = nextCommand(sim.state) as unknown as Record<string, unknown>;
      expect(Object.keys(c).sort()).toEqual(['angle', 'power', 'type']);
      expect(c.type).toBe('fire');
      expect(Number.isInteger(c.angle) && Number.isInteger(c.power)).toBe(true);
      expect(nextCommand(sim.state)).toEqual(c);
      const lane = rightLane(sim);
      const contact = contactOf(layoutOfState(sim), blockedOf(sim), c.angle as number, c.power as number);
      expect(contact).toMatchObject({ kind: 'target', index: lane });
      expect(aimAt(sim, (k) => k.kind === 'target' && k.index === lane)).toEqual({ angle: c.angle, power: c.power });
      sim.dispatch(c as never);
    }
    playToEnd(sim);
    expect(nextCommand(sim.state)).toBeNull();
  });

  it('R13: after a wrong hit the bot still fires the first pair that hits the right target', () => {
    needAim('shotOf');
    const sim = createArchersRevenge(loadStory('pip-is-brave'), { seed: 2, helper: false });
    sim.dispatch({ type: 'start' });
    const round = sim.state.round!;
    const wrong = round.lanes.find((l) => l.wordId !== round.wordId)!.lane;
    const pair = aimAt(sim, (k) => k.kind === 'target' && k.index === wrong);
    expect(pair).not.toBeNull();
    sim.dispatch({ type: 'fire', ...pair! } as never);
    expect(blockedOf(sim)).toEqual([wrong]);
    const c = nextCommand(sim.state) as unknown as { angle: number; power: number };
    const lane = rightLane(sim);
    expect(aimAt(sim, (k) => k.kind === 'target' && k.index === lane)).toEqual({ angle: c.angle, power: c.power });
  });
});
