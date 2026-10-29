/**
 * The Castle Defense rules: the sentence building, the path and the build spots, the placement,
 * the wave in steps, the posts that are gone, the evidence, and the core imports.
 * Row ids (S1, L1, W1, ...) come from the track test strategy. The defaults Q1 to Q4 of the
 * strategy are assumptions: a wrong word costs a heart (Q1), a build on a built spot raises it one
 * level (Q2), the core holds 6 spots (Q3), and a level-n tower gives min(n, hitsLeft) hits to one
 * attacker with no spread (Q4).
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { storyGameEvidenceSchema } from '../../../src/apk3d/contracts/index.js';
import { createRng } from '../../../src/apk3d/sim/index.js';
import * as core from '../../../src/games/castle-defense/core/index.js';
import {
  CASTLE_DEFENSE_EVENT_TYPES,
  HITS,
  TUNING,
  attackersOf,
  bareWord,
  choicesOf,
  createCastleDefense,
  evidenceItemsOf,
  evidenceOf,
  resultsOf,
  shiftOf,
  wordKey,
  type CastleDefenseEvent,
  type CastleDefenseState,
  type Spot,
} from '../../../src/games/castle-defense/core/index.js';
import { nextCommand } from '../../../src/games/castle-defense/qc/bot.js';
import {
  SHORT_STORY,
  STORY,
  buildOn,
  buildSentence,
  create,
  narrowestSpot,
  ofType,
  pathOf,
  pickRight,
  pickWrong,
  playToEnd,
  playWith,
  spotsOf,
  types,
  widestSpot,
  type BuildTrace,
} from './helpers.js';

type WaveStepEvent = Extract<CastleDefenseEvent, { type: 'waveStep' }>;
type ThroughEvent = Extract<CastleDefenseEvent, { type: 'attackerThrough' }>;

// ---------------------------------------------------------------- the wave trace

/** An attacker the test follows through the events of one `build`. */
interface Live {
  id: string;
  at: number;
  hits: number;
}

interface StepTrace {
  event: WaveStepEvent;
  /** Living attackers that have not got through, at the start of the step. */
  start: Live[];
  /** Living attackers after the move and before the shots; an attacker at the castle is not in it. */
  moved: Live[];
  throughs: ThroughEvent[];
}

/** Follows the attackers through the events of one `build`: the moves, the shots, and the breaches. */
function stepsOf(trace: BuildTrace): { steps: StepTrace[]; left: Live[] } {
  const pathLength = pathOf(trace.before).length;
  let live: Live[] = trace.before.attackers.filter((a) => a.hits > 0).map((a) => ({ id: a.id, at: a.at, hits: a.hits }));
  const steps: StepTrace[] = [];
  for (const e of trace.out) {
    if (e.type === 'waveStep') {
      const start = live.map((a) => ({ ...a }));
      for (const m of e.moves) {
        const a = live.find((x) => x.id === m.enemyId);
        if (a) a.at = m.at;
      }
      const moved = live.filter((a) => a.at < pathLength).map((a) => ({ ...a }));
      for (const s of e.shots) {
        const a = live.find((x) => x.id === s.enemyId);
        if (a) a.hits = s.hitsLeft;
      }
      live = live.filter((a) => a.hits > 0);
      steps.push({ event: e, start, moved, throughs: [] });
    } else if (e.type === 'attackerThrough') {
      live = live.filter((a) => a.id !== e.enemyId);
      steps.at(-1)?.throughs.push(e);
    }
  }
  return { steps, left: live };
}

const builtSpots = (state: CastleDefenseState): Spot[] => spotsOf(state).filter((s) => s.level > 0);

/** The runs the wave rows check: towers on the narrowest spot (breaches), the widest spot, and spots by wave. */
function waveTraces(): BuildTrace[] {
  const runs = [
    playWith(create(5), narrowestSpot),
    playWith(create(5), widestSpot),
    playWith(create(11), (s) => (s.wave - 1) % 6),
    playWith(create(3, true), (s) => 5 - ((s.wave - 1) % 6)),
  ];
  const builds = runs.flatMap((r) => r.builds);
  expect(builds.length, 'build commands in the wave runs').toBeGreaterThan(0);
  for (const b of builds) expect(types(b.out)[0], 'the first event of a build').toBe('towerBuilt');
  return builds;
}

function allSteps(traces: BuildTrace[]): { trace: BuildTrace; step: StepTrace }[] {
  const out = traces.flatMap((trace) => stepsOf(trace).steps.map((step) => ({ trace, step })));
  expect(out.length, 'waveStep events').toBeGreaterThan(0);
  expect(out.some((x) => x.step.event.shots.length > 0), 'at least one shot').toBe(true);
  return out;
}

/** Plays wave 1 (or wave 2 after a tower on `firstSpot`) and places the tower on `spot`; returns the result. */
function waveResult(seed: number, spot: number, firstSpot?: number): string {
  const sim = create(seed);
  sim.dispatch({ type: 'start' });
  if (firstSpot !== undefined) {
    buildSentence(sim);
    expect(types(buildOn(sim, firstSpot))[0]).toBe('towerBuilt');
  }
  buildSentence(sim);
  const out = buildOn(sim, spot);
  expect(types(out)[0], `build on spot ${spot}`).toBe('towerBuilt');
  return `${ofType(out, 'attackerThrough').length} through, ${sim.state.hearts} hearts`;
}

// ---------------------------------------------------------------- content (guard)

describe('content (guard)', () => {
  it('the waves are story sentences, each once, in a seeded order, at most maxWaves', () => {
    const shift = shiftOf(STORY, createRng(3), TUNING.maxWaves);
    expect(shift).toHaveLength(TUNING.maxWaves);
    expect(new Set(shift.map((s) => s.id)).size).toBe(shift.length);
    for (const s of shift) {
      const src = STORY.sentences.find((x) => x.id === s.id)!;
      expect(s.words).toEqual(src.words);
      expect(s).toMatchObject({ wrongs: 0, started: false, cleared: false });
    }
    expect(shiftOf(STORY, createRng(3), 6).map((s) => s.id)).toEqual(shift.map((s) => s.id));
    expect(shiftOf(STORY, createRng(4), 6).map((s) => s.id)).not.toEqual(shift.map((s) => s.id));
    expect(shiftOf(SHORT_STORY, createRng(1), 6)).toHaveLength(SHORT_STORY.sentences.length);
  });

  it('attackers cycle: two soldiers, three tanks, one boss, with the legacy hit points', () => {
    expect(attackersOf(1).map((a) => a.type)).toEqual(['soldier', 'soldier']);
    expect(attackersOf(2).map((a) => a.type)).toEqual(['tank', 'tank', 'tank']);
    expect(attackersOf(3).map((a) => [a.type, a.kind])).toEqual([['boss', 'dragon-fire']]);
    expect(attackersOf(4).map((a) => a.type)).toEqual(['soldier', 'soldier']);
    expect(attackersOf(2)[0]!.hits).toBe(HITS.tank);
    expect(new Set([1, 2, 3, 4].flatMap((w) => attackersOf(w).map((a) => a.id))).size).toBe(8);
  });
});

// ---------------------------------------------------------------- sentence building (FR-1)

describe('sentence building', () => {
  it('S1 the card holds 3 words, or 2 in Helper mode; exactly one is right; no punctuation', () => {
    const shift = shiftOf(STORY, createRng(2), 6);
    const rng = createRng(9);
    for (let w = 0; w < shift.length; w++) {
      for (let i = 0; i < shift[w]!.words.length; i++) {
        const choices = choicesOf(shift, w, i, 3, rng);
        expect(choices).toHaveLength(3);
        expect(choices.filter((c) => c.right)).toHaveLength(1);
        expect(choices.find((c) => c.right)!.word).toBe(bareWord(shift[w]!.words[i]!));
        expect(new Set(choices.map((c) => wordKey(c.word))).size).toBe(3);
        expect(choices.every((c) => !c.blocked)).toBe(true);
      }
    }
    expect(create(5, true).state.step!.choices).toHaveLength(TUNING.helperChoices);
    expect(create(5).state.step!.choices).toHaveLength(TUNING.choices);
  });

  it('S2 a right word joins the sentence, scores coins that grow with the streak, and shows the next step', () => {
    const sim = create(5);
    sim.dispatch({ type: 'start' });
    const sentence = sim.state.shift[0]!;
    const a = pickRight(sim);
    expect(types(a)).toEqual(['picked', 'scored', 'stepShown']);
    expect(ofType(a, 'picked')[0]).toMatchObject({ correct: true, streak: 1, index: 0 });
    expect(sim.state.built).toEqual([sentence.words[0]]);
    expect(sim.state.step!.index).toBe(1);
    expect(ofType(pickRight(sim), 'scored')[0]!.coins).toBe(TUNING.coins + TUNING.streakCoins);
    expect(sim.state.shift[0]!.started).toBe(true);
  });

  it('S3 (assumption Q1) a wrong word shuts and costs one heart; the strike names no hero', () => {
    const sim = create(5);
    sim.dispatch({ type: 'start' });
    pickRight(sim);
    const built = [...sim.state.built];
    const ids = sim.state.attackers.map((a) => a.id);
    const events = pickWrong(sim);
    expect(types(events)).toEqual(['picked', 'attackerStrike', 'stepShown']);
    expect(ofType(events, 'picked')[0]).toMatchObject({ correct: false, streak: 0 });
    const strike = ofType(events, 'attackerStrike')[0]!;
    expect(ids).toContain(strike.enemyId);
    expect(strike.hearts).toBe(TUNING.hearts - 1);
    expect(strike, 'attackerStrike has no hero').not.toHaveProperty('hero');
    expect(sim.state.hearts).toBe(TUNING.hearts - 1);
    expect(sim.state.built).toEqual(built);
    expect(sim.state.streak).toBe(0);
    expect(sim.state.step!.index).toBe(1);
    expect(sim.state.step!.choices.filter((c) => c.blocked)).toHaveLength(1);
    const blocked = sim.state.step!.choices.find((c) => c.blocked)!;
    expect(types(sim.dispatch({ type: 'pick', choice: blocked.index }))).toEqual(['rejected']);
    expect(sim.state.shift[0]!.wrongs).toBe(1);
  });

  it('S4 at 0 hearts from wrong words the heroes rest and the hearts return; there is no game over', () => {
    const sim = create(6);
    sim.dispatch({ type: 'start' });
    let rested = false;
    for (let i = 0; i < 30 && sim.state.stage === 'collect' && sim.state.phase === 'playing'; i++) {
      const wrongLeft = sim.state.step!.choices.some((c) => !c.right && !c.blocked);
      const events = wrongLeft ? pickWrong(sim) : pickRight(sim);
      if (ofType(events, 'rest').length) {
        rested = true;
        expect(types(events)).toEqual(['picked', 'attackerStrike', 'rest', 'stepShown']);
        expect(sim.state.hearts).toBe(sim.state.maxHearts);
      }
      expect(sim.state.hearts).toBeGreaterThan(0);
    }
    expect(rested).toBe(true);
    expect(sim.state.phase).toBe('playing');
  });

  it('S5 commands before start and pick in the place stage are rejected and change no state', () => {
    const sim = create(5);
    const fresh = sim.snapshot();
    expect(types(sim.dispatch({ type: 'pick', choice: 0 }))).toEqual(['rejected']);
    expect(types(buildOn(sim, 0))).toEqual(['rejected']);
    expect(sim.snapshot()).toEqual(fresh);
    const events = sim.dispatch({ type: 'start' });
    expect(types(events)).toEqual(['waveAppeared', 'stepShown']);
    expect(ofType(events, 'waveAppeared')[0]).toMatchObject({ wave: 1, waveCount: sim.state.waveCount });
    expect(ofType(events, 'waveAppeared')[0]!.attackers).toHaveLength(2);
    expect(types(sim.dispatch({ type: 'start' }))).toEqual(['rejected']);
    buildSentence(sim);
    expect(sim.state.stage).toBe('place');
    expect(sim.state.step).toBeNull();
    const placing = sim.snapshot();
    expect(types(sim.dispatch({ type: 'pick', choice: 0 }))).toEqual(['rejected']);
    expect(sim.snapshot()).toEqual(placing);
  });
});

// ---------------------------------------------------------------- layout (FR-2)

describe('layout', () => {
  it('L1 (assumption Q3) the core holds 6 build spots, ids 0 to 5, all empty', () => {
    const spots = spotsOf(create(5).state);
    expect(spots).toHaveLength(6);
    expect(spots.map((s) => s.spot)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(spots.every((s) => s.level === 0)).toBe(true);
  });

  it('L2 the path has at least 2 steps; each range is not empty and inside the path', () => {
    const state = create(5).state;
    const path = pathOf(state);
    expect(path.length).toBeGreaterThanOrEqual(2);
    const spots = spotsOf(state);
    expect(spots.length).toBeGreaterThan(0);
    for (const s of spots) {
      expect(s.covers.length, `spot ${s.spot} covers`).toBeGreaterThan(0);
      for (const i of s.covers) {
        expect(Number.isInteger(i)).toBe(true);
        expect(i).toBeGreaterThanOrEqual(0);
        expect(i).toBeLessThanOrEqual(path.length - 1);
      }
    }
  });

  it('L3 the spots differ: two ranges have a different length, and one path step is outside some range', () => {
    const state = create(5).state;
    const path = pathOf(state);
    const spots = spotsOf(state);
    expect(spots.length).toBeGreaterThan(1);
    expect(new Set(spots.map((s) => s.covers.length)).size).toBeGreaterThanOrEqual(2);
    expect(spots.some((s) => path.some((_, i) => !s.covers.includes(i)))).toBe(true);
  });

  it('L4 the layout is core data: equal for the seeds 1 to 4 and for Helper mode', () => {
    const first = create(1).state;
    const path = pathOf(first);
    const spots = spotsOf(first);
    expect(path.length).toBeGreaterThan(0);
    expect(spots.length).toBeGreaterThan(0);
    for (const [seed, helper] of [[2, false], [3, false], [4, false], [1, true], [4, true]] as const) {
      const state = create(seed, helper).state;
      expect(pathOf(state)).toEqual(path);
      expect(spotsOf(state)).toEqual(spots);
    }
  });
});

// ---------------------------------------------------------------- placement (FR-3)

describe('placement', () => {
  it('P1 the built sentence offers the spots; build(spot) raises that spot only', () => {
    const sim = create(5);
    sim.dispatch({ type: 'start' });
    const built = ofType(buildSentence(sim), 'sentenceBuilt')[0]!;
    expect(built.spots).toEqual(spotsOf(sim.state));
    expect(built, 'sentenceBuilt has no posts').not.toHaveProperty('posts');
    const out = buildOn(sim, 3);
    const tower = ofType(out, 'towerBuilt')[0];
    expect(tower).toMatchObject({ spot: 3, level: 1, coins: TUNING.towerCoins });
    expect(tower, 'towerBuilt has no post').not.toHaveProperty('post');
    expect(spotsOf(sim.state).map((s) => s.level)).toEqual([0, 0, 0, 1, 0, 0]);
  });

  it('P2 (assumption Q2) a second build on a built spot raises it to level 2', () => {
    const sim = create(5);
    sim.dispatch({ type: 'start' });
    buildSentence(sim);
    expect(ofType(buildOn(sim, 2), 'towerBuilt')[0]).toMatchObject({ spot: 2, level: 1 });
    buildSentence(sim);
    expect(ofType(buildOn(sim, 2), 'towerBuilt')[0]).toMatchObject({ spot: 2, level: 2 });
    expect(spotsOf(sim.state).find((s) => s.spot === 2)!.level).toBe(2);
    expect(spotsOf(sim.state).filter((s) => s.level > 0)).toHaveLength(1);
    expect(sim.state.towersBuilt).toBe(2);
  });

  it('P3 (assumption Q3) a spot outside 0 to 5 is rejected and changes nothing; spot 5 builds', () => {
    const sim = create(5);
    sim.dispatch({ type: 'start' });
    buildSentence(sim);
    const placing = sim.snapshot();
    for (const spot of [-1, 6, 99]) {
      expect(types(buildOn(sim, spot)), `spot ${spot}`).toEqual(['rejected']);
      expect(sim.snapshot()).toEqual(placing);
    }
    expect(types(buildOn(sim, 5))[0]).toBe('towerBuilt');
  });
});

// ---------------------------------------------------------------- the wave in steps (FR-4, FR-5)

describe('the wave in steps', () => {
  it('W1 every shot comes from a built spot and hits an attacker inside its range', () => {
    for (const { trace, step } of allSteps(waveTraces())) {
      const built = builtSpots(trace.after);
      for (const shot of step.event.shots) {
        const spot = built.find((s) => s.spot === shot.spot);
        expect(spot, `shot from spot ${shot.spot}`).toBeDefined();
        expect(spot!.covers).toContain(shot.at);
      }
    }
  });

  it('W2 on each step each built spot with a living attacker in range shoots exactly once, in spot order', () => {
    for (const { trace, step } of allSteps(waveTraces())) {
      const cur = step.moved.map((a) => ({ ...a }));
      const built = [...builtSpots(trace.after)].sort((a, b) => a.spot - b.spot);
      expect(built.length).toBeGreaterThan(0);
      for (const spot of built) {
        const inRange = cur.filter((a) => a.hits > 0 && spot.covers.includes(a.at));
        const own = step.event.shots.filter((s) => s.spot === spot.spot);
        expect(own.length, `shots of spot ${spot.spot} on step ${step.event.step}`).toBe(inRange.length > 0 ? 1 : 0);
        for (const s of own) {
          const target = cur.find((a) => a.id === s.enemyId);
          if (target) target.hits = s.hitsLeft;
        }
      }
      expect(step.event.shots.map((s) => s.spot)).toEqual([...step.event.shots.map((s) => s.spot)].sort((a, b) => a - b));
    }
  });

  it('W3 a tower shoots the front attacker in its range (the highest at)', () => {
    for (const { trace, step } of allSteps(waveTraces())) {
      const cur = step.moved.map((a) => ({ ...a }));
      for (const shot of step.event.shots) {
        const spot = spotsOf(trace.after).find((s) => s.spot === shot.spot)!;
        const inRange = cur.filter((a) => a.hits > 0 && spot.covers.includes(a.at));
        expect(inRange.length).toBeGreaterThan(0);
        const target = cur.find((a) => a.id === shot.enemyId);
        expect(target, `target ${shot.enemyId}`).toBeDefined();
        expect(target!.hits).toBeGreaterThan(0);
        expect(target!.at).toBe(Math.max(...inRange.map((a) => a.at)));
        target!.hits = shot.hitsLeft;
      }
    }
  });

  it('W4 (assumption Q4) a level-n tower gives min(n, hitsLeft) hits to one attacker', () => {
    for (const { trace, step } of allSteps(waveTraces())) {
      const cur = step.moved.map((a) => ({ ...a }));
      for (const shot of step.event.shots) {
        const level = spotsOf(trace.after).find((s) => s.spot === shot.spot)!.level;
        const target = cur.find((a) => a.id === shot.enemyId)!;
        expect(shot.hits).toBe(Math.min(level, target.hits));
        expect(shot.hitsLeft).toBe(target.hits - shot.hits);
        expect(shot.fell).toBe(shot.hitsLeft === 0);
        target.hits = shot.hitsLeft;
      }
    }
    // A level-2 tower against a 3-hit tank: one shot gives 2 hits.
    const sim = create(5);
    sim.dispatch({ type: 'start' });
    buildSentence(sim);
    const spot = widestSpot(sim.state);
    buildOn(sim, spot);
    buildSentence(sim);
    expect(sim.state.attackers.every((a) => a.type === 'tank')).toBe(true);
    const shots = ofType(buildOn(sim, spot), 'waveStep').flatMap((e) => e.shots);
    expect(shots.length).toBeGreaterThan(0);
    expect(shots.some((s) => s.spot === spot && s.hits === 2)).toBe(true);
  });

  it('W5 the events of build follow the order; the towers shoot after the move', () => {
    const order = /^towerBuilt( waveStep( attackerThrough( rest)?)*)+ waveCleared( waveAppeared stepShown| victory)$/;
    const traces = waveTraces();
    for (const trace of traces) expect(types(trace.out).join(' ')).toMatch(order);
    for (const { step } of allSteps(traces)) {
      for (const shot of step.event.shots) {
        const target = step.moved.find((a) => a.id === shot.enemyId);
        expect(target, `target ${shot.enemyId} after the move`).toBeDefined();
        expect(shot.at).toBe(target!.at);
      }
    }
  });

  it('W5 the event order note at the top of core/sim.ts names the wave steps', () => {
    const source = readFileSync(join(process.cwd(), 'src', 'games', 'castle-defense', 'core', 'sim.ts'), 'utf8');
    const note = source.slice(0, source.indexOf('*/'));
    expect(note).toContain('Event order');
    expect(note).toContain('waveStep');
    expect(note).toContain('attackerThrough');
    expect(note).not.toContain('volley');
  });

  it('W6 each step moves each attacker on the path one step; the step count has a bound', () => {
    const traces = waveTraces();
    for (const trace of traces) {
      const pathLength = pathOf(trace.before).length;
      const { steps } = stepsOf(trace);
      expect(steps.length).toBeGreaterThan(0);
      expect(steps.length).toBeLessThanOrEqual(pathLength + trace.before.attackers.length + 1);
      for (const step of steps) {
        const moves = [...step.event.moves].sort((a, b) => a.enemyId.localeCompare(b.enemyId));
        const start = [...step.start].sort((a, b) => a.id.localeCompare(b.id));
        expect(moves.map((m) => m.enemyId)).toEqual(start.map((a) => a.id));
        moves.forEach((m, i) => expect(m.at, `move of ${m.enemyId}`).toBe(start[i]!.at + 1));
      }
    }
  });

  it('W7 a breach costs one heart; the attacker leaves the path and gets no later shot', () => {
    const traces = waveTraces();
    let breaches = 0;
    for (const trace of traces) {
      const pathLength = pathOf(trace.before).length;
      let hearts = trace.before.hearts;
      const gone = new Set<string>();
      let lastAt = new Map<string, number>();
      for (const e of trace.out) {
        if (e.type === 'waveStep') {
          for (const m of e.moves) expect(gone.has(m.enemyId), `move of ${m.enemyId} after its breach`).toBe(false);
          for (const s of e.shots) expect(gone.has(s.enemyId), `shot at ${s.enemyId} after its breach`).toBe(false);
          lastAt = new Map(e.moves.map((m) => [m.enemyId, m.at]));
        } else if (e.type === 'attackerThrough') {
          breaches += 1;
          expect(e.hearts).toBe(hearts - 1);
          expect(lastAt.get(e.enemyId), `${e.enemyId} reaches the castle`).toBe(pathLength);
          hearts = e.hearts;
          gone.add(e.enemyId);
        } else if (e.type === 'rest') {
          hearts = e.hearts;
        }
      }
      expect(trace.after.hearts).toBe(hearts);
    }
    expect(breaches, 'attackerThrough events').toBeGreaterThan(0);
  });

  it('W8 a breach at 0 hearts is followed by the rest; the hearts return; no game over', () => {
    let rests = 0;
    for (const seed of [5, 6, 7]) {
      const sim = create(seed);
      const { builds } = playWith(sim, narrowestSpot, { lowerHeartsTo: 1 });
      expect(builds.length).toBeGreaterThan(0);
      for (const b of builds) {
        b.out.forEach((e, i) => {
          if (e.type !== 'attackerThrough' || e.hearts !== 0) return;
          rests += 1;
          expect(b.out[i + 1]).toEqual({ type: 'rest', hearts: b.after.maxHearts });
        });
        expect(b.after.hearts).toBeGreaterThan(0);
        expect(['playing', 'victory']).toContain(b.after.phase);
      }
      expect(sim.state.phase).toBe('victory');
    }
    expect(rests, 'breaches at 0 hearts').toBeGreaterThan(0);
  });

  it('W9 a wave ends when no attacker is left on the path; the sentence is cleared, also after a breach', () => {
    let withBreach = 0;
    for (const trace of waveTraces()) {
      const { left } = stepsOf(trace);
      expect(left, 'attackers left at waveCleared').toEqual([]);
      expect(ofType(trace.out, 'waveCleared')).toHaveLength(1);
      expect(trace.after.shift[trace.before.wave - 1]!.cleared).toBe(true);
      if (ofType(trace.out, 'attackerThrough').length > 0) withBreach += 1;
      if (trace.after.phase === 'playing') expect(trace.after.wave).toBe(trace.before.wave + 1);
    }
    expect(withBreach, 'waves with a breach').toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------- the placement changes the result (FR-6)

describe('the placement changes the result', () => {
  it('F1 seed 5, wave 1: the six spots give at least 2 different results', () => {
    const results = [0, 1, 2, 3, 4, 5].map((spot) => waveResult(5, spot));
    expect(new Set(results).size, results.join(' | ')).toBeGreaterThanOrEqual(2);
  });

  it('F2 seed 5, wave 2 (3 tanks) with a tower on spot 0: the six spots give at least 2 different results', () => {
    const results = [0, 1, 2, 3, 4, 5].map((spot) => waveResult(5, spot, 0));
    expect(new Set(results).size, results.join(' | ')).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------- the posts are gone (FR-7)

describe('the posts are gone', () => {
  it('X1 the state has no posts key', () => {
    const sim = create(5);
    expect('posts' in sim.state).toBe(false);
    expect('posts' in sim.snapshot()).toBe(false);
  });

  it('X2 the core exports no POSTS and no keeperOf', () => {
    expect('POSTS' in core).toBe(false);
    expect('keeperOf' in core).toBe(false);
  });

  it('X3 there is no volley event type, and a full run emits no volley', () => {
    expect(CASTLE_DEFENSE_EVENT_TYPES as readonly string[]).not.toContain('volley');
    const sim = create(2, false, SHORT_STORY);
    const events = playToEnd(sim);
    expect(sim.state.phase).toBe('victory');
    expect(events.length).toBeGreaterThan(0);
    expect(events.filter((e) => (e.type as string) === 'volley')).toHaveLength(0);
    for (const e of events) expect(CASTLE_DEFENSE_EVENT_TYPES).toContain(e.type);
  });

  it('the run is won when every sentence has a tower; the victory is the last event (guard)', () => {
    const sim = create(2, false, SHORT_STORY);
    const events = playToEnd(sim);
    expect(sim.state.phase).toBe('victory');
    expect(types(events).at(-1)).toBe('victory');
    expect(ofType(events, 'victory')).toHaveLength(1);
    expect(sim.dispatch({ type: 'start' })).toEqual([]);
  });

  it('with no sentence the run starts won (guard)', () => {
    const sim = createCastleDefense([], { seed: 1, helper: false });
    expect(sim.state.phase).toBe('victory');
    expect(sim.state.waveCount).toBe(0);
  });

  it('accepts the APK SentenceInput too (guard)', () => {
    const input = [
      { term: 'Pip is a brave puppy.', translation: 'พิปเป็นลูกหมา' },
      { term: 'One', translation: 'x' },
      { term: 'She sees a red car now', translation: 'y' },
      { term: 'We like to play', translation: '' },
    ];
    const sim = createCastleDefense(input, { seed: 1, helper: false });
    expect(sim.state.waveCount).toBe(3);
    expect(sim.state.shift.map((s) => s.id).sort()).toEqual(['s-1', 's-3', 's-4']);
    playToEnd(sim);
    expect(sim.state.phase).toBe('victory');
  });
});

// ---------------------------------------------------------------- evidence (FR-8)

describe('evidence', () => {
  it('E1 one sentence item per started sentence; wrong words count as attempts; no speed in the score', () => {
    const sim = create(5);
    sim.dispatch({ type: 'start' });
    pickWrong(sim);
    pickWrong(sim);
    buildSentence(sim);
    // The bot places the tower, so this guard row does not depend on the build command shape.
    sim.dispatch(nextCommand(sim.state)!);
    buildSentence(sim);
    const slow = resultsOf(sim.state, STORY, 5, 10_000_000);
    const fast = resultsOf(sim.state, STORY, 5, 1);
    expect(slow.results).toEqual(fast.results);
    const evidence = evidenceOf(sim.state, STORY, 5, 1000);
    expect(storyGameEvidenceSchema.parse(evidence)).toEqual(evidence);
    expect(evidence.items).toHaveLength(2);
    expect(evidence.items[0]).toMatchObject({ itemKind: 'sentence', attempts: 3, correctFirstTry: false, solved: true });
    expect(evidence.items[1]).toMatchObject({ attempts: 1, correctFirstTry: false, solved: false });
    expect(evidence.practice).toContain(evidence.items[0]!.label);
  });

  it('E2 the spot changes the heart losses, not the evidence', () => {
    const wide = create(5);
    const narrow = create(5);
    const a = playWith(wide, widestSpot);
    const b = playWith(narrow, narrowestSpot);
    expect(wide.state.phase).toBe('victory');
    expect(narrow.state.phase).toBe('victory');
    const lostWide = ofType(a.events, 'attackerThrough').length;
    const lostNarrow = ofType(b.events, 'attackerThrough').length;
    expect(lostNarrow, 'heart losses on the narrowest spot').not.toBe(lostWide);
    expect(evidenceItemsOf(narrow.state)).toEqual(evidenceItemsOf(wide.state));
    expect(evidenceOf(narrow.state, STORY, 5, 1)).toEqual(evidenceOf(wide.state, STORY, 5, 1));
  });

  it('E3 a run with breaches and no wrong word: every sentence is correct on the first try', () => {
    const sim = create(5);
    const { events } = playWith(sim, narrowestSpot);
    expect(sim.state.phase).toBe('victory');
    expect(ofType(events, 'attackerThrough').length, 'attackerThrough events').toBeGreaterThan(0);
    expect(ofType(events, 'attackerStrike')).toHaveLength(0);
    const evidence = evidenceOf(sim.state, STORY, 5, 1);
    expect(storyGameEvidenceSchema.parse(evidence)).toEqual(evidence);
    expect(evidence.items).toHaveLength(sim.state.waveCount);
    for (const item of evidence.items) expect(item).toMatchObject({ attempts: 1, correctFirstTry: true, solved: true });
  });

  it('E4 each item id and label come from the story sentence; each id is unique', () => {
    const sim = create(3);
    playToEnd(sim);
    const items = evidenceItemsOf(sim.state);
    expect(items.length).toBeGreaterThan(0);
    expect(new Set(items.map((i) => i.itemId)).size).toBe(items.length);
    for (const item of items) expect(STORY.sentences.some((s) => s.id === item.itemId && s.text === item.label)).toBe(true);
  });
});

// ---------------------------------------------------------------- architecture guard

describe('architecture', () => {
  it('A-core the core imports only the contracts, the sim kit, and itself, and reads no clock', () => {
    const root = process.cwd();
    const dir = join(root, 'src', 'games', 'castle-defense', 'core');
    const files = readdirSync(dir).filter((f) => f.endsWith('.ts'));
    for (const name of ['content.ts', 'evidence.ts', 'index.ts', 'sim.ts', 'types.ts']) expect(files).toContain(name);
    const allowed = [join(root, 'src', 'apk3d', 'contracts'), join(root, 'src', 'apk3d', 'sim'), dir];
    let imports = 0;
    for (const file of files) {
      const source = readFileSync(join(dir, file), 'utf8');
      const specs = [
        ...source.matchAll(/^(?:import|export)\b[^;'"=():]*?\bfrom\s+['"]([^'"]+)['"]/gm),
        ...source.matchAll(/^import\s+['"]([^'"]+)['"]/gm),
      ].map((m) => m[1]!);
      if (file === 'sim.ts') expect(specs.length, 'imports of sim.ts').toBeGreaterThan(0);
      imports += specs.length;
      for (const spec of specs) {
        expect(spec.startsWith('.'), `${file} imports ${spec}`).toBe(true);
        const target = resolve(dir, spec);
        expect(allowed.some((a) => target === a || target.startsWith(a + '/')), `${file} imports ${relative(root, target)}`).toBe(true);
      }
      expect(source, `${file} reads a clock or Math.random`).not.toMatch(/Math\.random|Date\.now|performance\.now|setTimeout|setInterval/);
    }
    expect(imports, 'import lines in core/').toBeGreaterThan(0);
  });
});
