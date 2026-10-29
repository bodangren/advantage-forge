/**
 * The Paladin's Twin Soul rules: a chapel shooter. Waves, shades, the holy bolt, the dive, rest,
 * shade kinds, and evidence. No battle monster takes part.
 *
 * Contract names (test-strategy.md section 5, the defaults; Red picked no other name):
 * - `SHADE_KINDS = ['specter', 'wraith', 'ghost']`; `Shade` and `ShadeShown` gain `kind`.
 * - `boltFired { shade }`: the first event of each accepted strike.
 * - `shadeFaded { shade, wordId }` replaces `shadeFell`.
 * - `shadeDived { shade, courage }` replaces `monsterStrike`; the diver returns to its place.
 * - Wrong strike: boltFired, shadeFaded, shadeDived, [rest].
 * - Right strike: boltFired, soulFreed, shadesScattered, then waveShown, captured or victory.
 * - Removed: `monster`, `monsterIndex`, `heroTurn` (state); `monsterAppeared`, `monsterDefeated`,
 *   `heroStrike`, `monsterStrike` (events); `MONSTER_KINDS`, `monstersOf`, `HEROES` (exports).
 *
 * Assumptions (open questions of the strategy, section 9; the defaults apply until Daniel decides):
 * - Q1: a standing shade from a seeded draw dives after a wrong strike. The captor is in the draw.
 *   Courage falls by 1. The diver returns to its place.
 * - Q2: no view marks the captor before a right strike. The captor shares its kind with decoys.
 * - Q3: shade kinds come from a balanced seeded order (each kind twice in a six-shade wave).
 *
 * New exports are read as namespace members (`core.SHADE_KINDS`), so a missing export fails its
 * own assertion and the suite still loads.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { storyGameEvidenceSchema } from '../../../src/apk3d/contracts/index.js';
import { createRng } from '../../../src/apk3d/sim/index.js';
import * as coreNs from '../../../src/games/paladins-twin-soul/core/index.js';
import {
  TUNING,
  TWIN_SOUL_EVENT_TYPES,
  createTwinSoul,
  evidenceOf,
  resultsOf,
  shadesOf,
  targetsOf,
  wordsOf,
} from '../../../src/games/paladins-twin-soul/core/index.js';
import {
  KINDS,
  SHORT_STORY,
  STORY,
  STORY_IDS,
  captorOf,
  create,
  loadStory,
  mixedRun,
  ofType,
  playToEnd,
  send,
  shadesNow,
  strike,
  types,
  wrongShade,
  wrongStrike,
  type Ev,
} from './helpers.js';

const core = coreNs as unknown as Record<string, unknown>;
const SEEDS = Array.from({ length: 30 }, (_, i) => i + 1);
const MONSTER_EVENTS = ['monsterAppeared', 'monsterDefeated', 'heroStrike', 'monsterStrike'];

const started = (seed: number, helper = false, story = STORY) => {
  const sim = create(seed, helper, story);
  const startEvents = send(sim, { type: 'start' });
  return { sim, startEvents };
};

describe('content (kept rows)', () => {
  it('targets every story word once, in a seeded order', () => {
    const targets = targetsOf(STORY, createRng(3));
    expect(targets).toHaveLength(STORY.vocabulary.length);
    expect(new Set(targets.map((t) => t.id)).size).toBe(STORY.vocabulary.length);
    expect(targetsOf(STORY, createRng(3)).map((t) => t.id)).toEqual(targets.map((t) => t.id));
    expect(targetsOf(STORY, createRng(4)).map((t) => t.id)).not.toEqual(targets.map((t) => t.id));
  });

  it('accepts the APK VocabularyInput too', () => {
    expect(wordsOf([{ term: 'cat', translation: 'แมว' }, { term: '', translation: 'x' }, { term: 'dog', translation: 'หมา' }])).toEqual([
      { id: 'w-1', term: 'cat', translation: 'แมว' },
      { id: 'w-3', term: 'dog', translation: 'หมา' },
    ]);
    const sim = createTwinSoul([{ term: 'cat', translation: 'แมว' }, { term: 'dog', translation: 'หมา' }], { seed: 1, helper: false });
    expect(sim.state.shades).toHaveLength(2);
    playToEnd(sim);
    expect(sim.state.phase).toBe('victory');
  });

  it('a run with no words is over before it starts', () => {
    const sim = createTwinSoul([], { seed: 1, helper: false });
    expect(sim.state.phase).toBe('victory');
    expect(sim.state.shades).toEqual([]);
    expect(sim.dispatch({ type: 'start' })).toEqual([]);
  });

  it('shades: one captor and distinct decoy terms, seeded', () => {
    const targets = targetsOf(STORY, createRng(1));
    const shades = shadesOf(targets, targets[0]!.id, 5, 1, createRng(5));
    expect(shades).toHaveLength(6);
    expect(shades.filter((s) => s.wordId === targets[0]!.id)).toHaveLength(1);
    expect(new Set(shades.map((s) => s.term.toLowerCase())).size).toBe(6);
    expect(shadesOf(targets, targets[0]!.id, 5, 1, createRng(5))).toEqual(shades);
  });

  it('a strike before start does nothing', () => {
    const sim = create(2);
    expect(sim.dispatch({ type: 'strike', shade: sim.state.shades[0]!.id })).toEqual([]);
  });
});

describe('T1 no monster', () => {
  it.each([1, 2, 3])('T1 seed %i: the state has no monster, monsterIndex, or heroTurn key', (seed) => {
    const keys = Object.keys(create(seed).state);
    expect(keys).not.toContain('monster');
    expect(keys).not.toContain('monsterIndex');
    expect(keys).not.toContain('heroTurn');
  });

  it('T1: TWIN_SOUL_EVENT_TYPES lists no monster event and lists the bolt, the fade, and the dive', () => {
    for (const type of MONSTER_EVENTS) expect(TWIN_SOUL_EVENT_TYPES).not.toContain(type);
    expect(TWIN_SOUL_EVENT_TYPES).not.toContain('shadeFell');
    for (const type of ['boltFired', 'shadeFaded', 'shadeDived']) expect(TWIN_SOUL_EVENT_TYPES).toContain(type);
  });

  it('T1: the core exports no MONSTER_KINDS, monstersOf, or HEROES', () => {
    const names = Object.keys(core);
    expect(names).not.toContain('MONSTER_KINDS');
    expect(names).not.toContain('monstersOf');
    expect(names).not.toContain('HEROES');
  });

  it('T1: start shows the wave and the capture only (no monster enters)', () => {
    const sim = create(2);
    const events = send(sim, { type: 'start' });
    expect(types(events)).toEqual(['waveShown', 'captured']);
    const wave = ofType(events, 'waveShown')[0]!;
    expect(wave.shades.map((x: Ev) => x.id)).toEqual(sim.state.shades.map((x) => x.id));
    expect(ofType(events, 'captured')[0]!.shade).toBe(captorOf(sim).id);
    expect(sim.dispatch({ type: 'start' })).toEqual([]);
  });

  it.each([11, 12, 13])('T1 seed %i: a mixed run (right, wrong, rejected) emits no monster event', (seed) => {
    const sim = create(seed);
    const { strikes, events } = mixedRun(sim);
    expect(sim.state.phase).toBe('victory');
    // The run holds every kind of strike, so the check is not vacuous.
    expect(strikes.some((s) => !s.valid)).toBe(true);
    expect(strikes.some((s) => s.valid && !s.events.some((e) => e.type === 'soulFreed'))).toBe(true);
    expect(ofType(events, 'soulFreed').length).toBe(sim.state.targetCount);
    for (const type of MONSTER_EVENTS) expect(ofType(events, type)).toHaveLength(0);
    for (const e of events) expect(TWIN_SOUL_EVENT_TYPES).toContain(e.type);
  });
});

describe('T2 right strike', () => {
  it('T2: the bolt frees the soul, the other shades scatter, and the next wave comes', () => {
    const { sim } = started(4);
    const first = sim.state.target!.itemId;
    const captor = captorOf(sim);
    const others = shadesNow(sim).filter((s) => s.id !== captor.id && !s.fallen).map((s) => s.id);
    const events = strike(sim, captor.id);
    expect(types(events)).toEqual(['boltFired', 'soulFreed', 'shadesScattered', 'waveShown', 'captured']);
    expect(TUNING.pointsPerSoul).toBe(100);
    expect(ofType(events, 'soulFreed')[0]).toMatchObject({ shade: captor.id, itemId: first, firstTry: true, twins: 1, points: 100 });
    expect(ofType(events, 'shadesScattered')[0]!.shades).toEqual(others);
    expect(sim.state.twins).toBe(1);
    expect(sim.state.score).toBe(100);
    expect(sim.state.targetIndex).toBe(1);
    expect(sim.state.shades.every((s) => s.id.startsWith('w2s'))).toBe(true);
    expect(ofType(events, 'waveShown')[0]!.shades.every((s: Ev) => s.id.startsWith('w2s'))).toBe(true);
    expect(sim.state.targets[0]).toMatchObject({ attempts: 1, correctFirstTry: true, solved: true });
  });

  it('T2: after a wrong strike, the scatter list holds neither the captor nor the faded shade', () => {
    const { sim } = started(5);
    const faded = wrongShade(sim)!;
    const wrong = wrongStrike(sim);
    expect(types(wrong)[0]).toBe('boltFired');
    const captor = captorOf(sim);
    const events = strike(sim, captor.id);
    expect(types(events).slice(0, 3)).toEqual(['boltFired', 'soulFreed', 'shadesScattered']);
    const scattered: string[] = ofType(events, 'shadesScattered')[0]!.shades;
    expect(scattered).not.toContain(captor.id);
    expect(scattered).not.toContain(faded);
    expect(scattered).toHaveLength(4);
    expect(ofType(events, 'soulFreed')[0]!.firstTry).toBe(false);
    expect(sim.state.targets[0]).toMatchObject({ attempts: 2, correctFirstTry: false, solved: true });
  });

  it('T2: the last right strike ends with victory, not a new wave', () => {
    const last = create(6, false, SHORT_STORY);
    send(last, { type: 'start' });
    let events: Ev[] = [];
    const strikeLimit = SHORT_STORY.vocabulary.length + 5;
    let strikes = 0;
    while (last.state.phase === 'playing' && strikes < strikeLimit) {
      events = strike(last, captorOf(last).id);
      strikes += 1;
    }
    if (last.state.phase !== 'victory') {
      throw new Error(
        `T2: the run stayed in phase "${last.state.phase}" after ${strikeLimit} right strikes; expected victory`,
      );
    }
    expect(types(events)).toEqual(['boltFired', 'soulFreed', 'shadesScattered', 'victory']);
    expect(last.state.twins).toBe(SHORT_STORY.vocabulary.length);
    expect(last.state.score).toBe(100 * SHORT_STORY.vocabulary.length);
  });
});

describe('T3 wrong strike', () => {
  it('T3: the bolt fades a wrong shade, a shade dives, and courage falls by one', () => {
    const { sim } = started(3);
    const shade = wrongShade(sim)!;
    const wordId = shadesNow(sim).find((s) => s.id === shade)!.wordId;
    const events = strike(sim, shade);
    expect(types(events)).toEqual(['boltFired', 'shadeFaded', 'shadeDived']);
    expect(ofType(events, 'boltFired')[0]).toEqual({ type: 'boltFired', shade });
    expect(ofType(events, 'shadeFaded')[0]).toEqual({ type: 'shadeFaded', shade, wordId });
    expect(ofType(events, 'shadeDived')[0]!.courage).toBe(TUNING.maxCourage - 1);
    expect(sim.state.courage).toBe(TUNING.maxCourage - 1);
    expect(sim.state.shades.find((x) => x.id === shade)!.fallen).toBe(true);
    expect(sim.state.targetIndex).toBe(0);
    expect(sim.state.misses).toBe(1);
    expect(sim.state.targets[0]).toMatchObject({ attempts: 1, correctFirstTry: false, solved: false });
  });

  it('T3: the faded shade stays out for the rest of the wave', () => {
    const { sim } = started(3);
    const first = wrongShade(sim)!;
    strike(sim, first);
    const events = wrongStrike(sim);
    expect(types(events)).toEqual(['boltFired', 'shadeFaded', 'shadeDived']);
    expect(sim.state.shades.find((x) => x.id === first)!.fallen).toBe(true);
    expect(sim.state.courage).toBe(TUNING.maxCourage - 2);
    expect(sim.state.misses).toBe(2);
    expect(sim.state.targetIndex).toBe(0);
  });
});

describe('T4 the dive (assumption Q1: a seeded standing shade dives, the captor is in the draw)', () => {
  it.each(SEEDS)('T4 Q1 seed %i: a standing shade dives, keeps its place, and stands again', (seed) => {
    const { sim } = started(seed);
    const order = sim.state.shades.map((s) => s.id);
    const struck = wrongShade(sim)!;
    const standing = sim.state.shades.filter((s) => !s.fallen && s.id !== struck).map((s) => s.id);
    const events = strike(sim, struck);
    const dives = ofType(events, 'shadeDived');
    expect(dives).toHaveLength(1);
    const diver: string = dives[0]!.shade;
    expect(diver).not.toBe(struck);
    expect(standing).toContain(diver);
    expect(sim.state.shades.map((s) => s.id)).toEqual(order);
    expect(sim.state.shades.find((s) => s.id === diver)!.fallen).toBe(false);
  });

  it('T4 Q1: over 30 seeds, the first diver takes 3 or more formation places', () => {
    const places = new Set<number>();
    for (const seed of SEEDS) {
      const { sim } = started(seed);
      const events = wrongStrike(sim);
      const diver = ofType(events, 'shadeDived')[0]?.shade;
      places.add(sim.state.shades.findIndex((s) => s.id === diver));
    }
    places.delete(-1);
    expect(places.size).toBeGreaterThanOrEqual(3);
  });

  it.each([1, 2, 3, 4, 5])('T4 Q1 seed %i: no faded shade dives, and the captor dives when it stands alone', (seed) => {
    const { sim } = started(seed, false, SHORT_STORY);
    const captor = captorOf(sim).id;
    const faded = new Set<string>();
    const divers: string[] = [];
    // A five-shade wave: four decoys fade, then only the captor stands. Ten strikes is a safe limit.
    const strikeLimit = 10;
    while (wrongShade(sim)) {
      if (divers.length >= strikeLimit) {
        throw new Error(
          `T4: a wrong shade still stands after ${strikeLimit} wrong strikes; the faded shade did not stay out (M9)`,
        );
      }
      const struck = wrongShade(sim)!;
      faded.add(struck);
      const dive = ofType(strike(sim, struck), 'shadeDived')[0];
      expect(dive).toBeDefined();
      expect(faded.has(dive!.shade)).toBe(false);
      divers.push(dive!.shade);
    }
    expect(divers).toHaveLength(SHORT_STORY.vocabulary.length - 1);
    // Only the captor stands at the last wrong strike, so the captor dives.
    expect(divers.at(-1)).toBe(captor);
    expect(captorOf(sim).fallen).toBe(false);
  });
});

describe('T5 shade kinds (assumption Q3: a balanced seeded order)', () => {
  it('T5 Q3: SHADE_KINDS is specter, wraith, ghost', () => {
    expect(core.SHADE_KINDS).toEqual(KINDS);
  });

  it.each([1, 2, 3])('T5 Q3 seed %i: every shade has a kind, and the state and waveShown agree by id', (seed) => {
    const { sim, startEvents } = started(seed);
    const fromState = new Map(shadesNow(sim).map((s) => [s.id, s.kind]));
    const shown: Ev[] = ofType(startEvents, 'waveShown')[0]!.shades;
    for (const s of shown) {
      expect(KINDS).toContain(s.kind);
      expect(fromState.get(s.id)).toBe(s.kind);
    }
    for (const kind of fromState.values()) expect(KINDS).toContain(kind);
  });

  it('T5 Q3: the same seed gives the same kinds; over 30 seeds the first-wave kinds differ', () => {
    const kindsOf = (seed: number) => shadesNow(create(seed)).map((s) => s.kind);
    expect(kindsOf(9)).toEqual(kindsOf(9));
    expect(kindsOf(9).every((k) => KINDS.includes(k as string))).toBe(true);
    const sequences = new Set(SEEDS.map((seed) => JSON.stringify(kindsOf(seed))));
    expect(sequences.size).toBeGreaterThan(1);
  });

  it('T5 Q3: one run shows all three kinds', () => {
    const events = playToEnd(create(2));
    const kinds = new Set(ofType(events, 'waveShown').flatMap((w) => w.shades.map((s: Ev) => s.kind)));
    expect([...kinds].sort()).toEqual([...KINDS].sort());
  });
});

describe('T6 the captor looks like the other shades (FR-7, assumption Q2)', () => {
  it('T6 Q2: over 30 seeds, the captor kind takes all three values', () => {
    const kinds = new Set(SEEDS.map((seed) => captorOf(create(seed)).kind));
    expect([...kinds].sort()).toEqual([...KINDS].sort());
  });

  it.each([1, 2, 3])('T6 Q2 seed %i: each kind appears twice in every six-shade wave', (seed) => {
    const events = playToEnd(create(seed));
    const waves = ofType(events, 'waveShown').filter((w) => w.shades.length === 6);
    expect(waves.length).toBe(STORY.vocabulary.length);
    for (const w of waves) {
      for (const kind of KINDS) expect(w.shades.filter((s: Ev) => s.kind === kind)).toHaveLength(2);
    }
  });

  it('T6 Q2 (pass at Red, catches M24): over 30 seeds, the captor takes 4 or more formation places', () => {
    const places = new Set(SEEDS.map((seed) => {
      const sim = create(seed);
      return sim.state.shades.findIndex((s) => s.id === captorOf(sim).id);
    }));
    expect(places.size).toBeGreaterThanOrEqual(4);
  });
});

describe('T7 evidence', () => {
  it('T7: attempts count accepted strikes only; dives and rejected strikes do not count', () => {
    const { sim } = started(12);
    const a = wrongStrike(sim);
    const faded = sim.state.shades.find((s) => s.fallen)!.id;
    expect(types(strike(sim, faded))).toEqual(['strikeRejected']);
    expect(types(strike(sim, 'nope'))).toEqual(['strikeRejected']);
    const b = wrongStrike(sim);
    // Two dives happened in this wave; they must not count as attempts.
    expect(ofType([...a, ...b], 'shadeDived')).toHaveLength(2);
    strike(sim, captorOf(sim).id);
    expect(sim.state.targets[0]).toMatchObject({ attempts: 3, correctFirstTry: false, solved: true });
    strike(sim, captorOf(sim).id);
    expect(sim.state.targets[1]).toMatchObject({ attempts: 1, correctFirstTry: true, solved: true });
  });

  it('T7: one item per story word, parsed by the contract; speed is not used', () => {
    const sim = create(12, false, STORY);
    send(sim, { type: 'start' });
    const wrong = wrongStrike(sim);
    expect(types(wrong)).toEqual(['boltFired', 'shadeFaded', 'shadeDived']);
    playToEnd(sim);
    const slow = evidenceOf(sim.state, STORY, 12, 9_999_999);
    const fast = evidenceOf(sim.state, STORY, 12, 1);
    expect(storyGameEvidenceSchema.parse(slow)).toEqual(slow);
    expect(slow.items).toHaveLength(STORY.vocabulary.length);
    expect(new Set(slow.items.map((i) => i.itemId))).toEqual(new Set(STORY.vocabulary.map((v) => v.id)));
    for (const item of slow.items) {
      expect(Object.keys(item).sort()).toEqual(['attempts', 'correctFirstTry', 'itemId', 'itemKind', 'label', 'solved']);
      expect(item.itemKind).toBe('word');
    }
    expect({ ...slow, durationMs: 0 }).toEqual({ ...fast, durationMs: 0 });
    const missed = slow.items.filter((i) => !i.correctFirstTry);
    expect(missed).toHaveLength(1);
    expect(missed[0]!.attempts).toBe(2);
    expect(slow.practice.length).toBe(missed.length);
    const { results, outcome } = resultsOf(sim.state, STORY, 12, 1000);
    expect(results.score).toBe(sim.state.score);
    expect(outcome).toBe('victory');
  });
});

describe('T11 wave shape (pass at Red, catches M35 and M36)', () => {
  it.each(SEEDS.slice(0, 5))('T11 seed %i: one wave per word, six shades, one captor, distinct terms', (seed) => {
    const sim = create(seed);
    const events = playToEnd(sim);
    const waves = ofType(events, 'waveShown');
    expect(waves).toHaveLength(sim.state.targetCount);
    for (const w of waves) {
      expect(w.shades).toHaveLength(6);
      expect(w.shades.filter((s: Ev) => s.wordId === w.itemId)).toHaveLength(1);
      expect(new Set(w.shades.map((s: Ev) => String(s.term).toLowerCase())).size).toBe(6);
    }
  });

  it('T11: Helper mode has four shades per wave', () => {
    const events = playToEnd(create(1, true));
    const waves = ofType(events, 'waveShown');
    expect(waves.length).toBe(STORY.vocabulary.length);
    for (const w of waves) expect(w.shades).toHaveLength(4);
    expect(TUNING.decoys + 1).toBe(6);
    expect(TUNING.helperDecoys + 1).toBe(4);
  });

  it.each(STORY_IDS)('T11 %s: the first wave has a formation with one captor', (id) => {
    const sim = create(1, false, loadStory(id));
    const s = sim.state;
    expect(s.shades).toHaveLength(Math.min(TUNING.decoys, s.targetCount - 1) + 1);
    expect(s.shades.filter((x) => x.wordId === s.target!.itemId)).toHaveLength(1);
    expect(s.target!.translation).toBe(s.targets[0]!.translation);
  });
});

describe('T12 rest', () => {
  it('T12: five wrong strikes give dive courage 4, 3, 2, 1, 0, then one rest with 3; no game over', () => {
    const { sim } = started(6);
    const all: Ev[] = [];
    let last: Ev[] = [];
    for (let i = 0; i < TUNING.maxCourage; i++) {
      last = wrongStrike(sim);
      all.push(...last);
    }
    expect(ofType(all, 'shadeDived').map((e) => e.courage)).toEqual([4, 3, 2, 1, 0]);
    expect(ofType(all, 'rest')).toEqual([{ type: 'rest', courage: 3 }]);
    expect(types(last)).toEqual(['boltFired', 'shadeFaded', 'shadeDived', 'rest']);
    expect(TUNING.restCourage).toBe(3);
    expect(sim.state.courage).toBe(3);
    expect(sim.state.phase).toBe('playing');
    // The captor still stands: the wave can always end.
    expect(captorOf(sim).fallen).toBe(false);
    expect(ofType(strike(sim, captorOf(sim).id), 'soulFreed')).toHaveLength(1);
  });
});

describe('T13 the holy bolt', () => {
  it.each([21, 22, 23])('T13 seed %i: each accepted strike fires exactly one bolt first, at the struck shade', (seed) => {
    const { strikes } = mixedRun(create(seed));
    const accepted = strikes.filter((s) => s.valid);
    expect(accepted.length).toBeGreaterThan(0);
    for (const s of accepted) {
      expect(s.events[0]).toEqual({ type: 'boltFired', shade: s.shade });
      expect(ofType(s.events, 'boltFired')).toHaveLength(1);
    }
  });

  it('T13 (pass at Red, catches M40 and M42): a rejected strike gives only strikeRejected and changes nothing', () => {
    const { sim } = started(3);
    const shade = wrongShade(sim)!;
    strike(sim, shade);
    const before = sim.snapshot();
    expect(types(strike(sim, shade))).toEqual(['strikeRejected']);
    expect(types(strike(sim, 'nope'))).toEqual(['strikeRejected']);
    expect(sim.snapshot()).toEqual(before);
  });
});

describe('T15 static guard', () => {
  it('T15: no core file names a battle monster or the hero turn', () => {
    const dir = join(process.cwd(), 'src', 'games', 'paladins-twin-soul', 'core');
    const files = readdirSync(dir).filter((f) => f.endsWith('.ts'));
    expect(files.length).toBeGreaterThan(0);
    const hits: string[] = [];
    for (const file of files) {
      const lines = readFileSync(join(dir, file), 'utf8').split('\n');
      lines.forEach((line, i) => {
        if (/skeleton|mimic|dragon-fire|heroTurn|monster/i.test(line)) hits.push(`${file}:${i + 1}`);
      });
    }
    expect(hits).toEqual([]);
  });
});
