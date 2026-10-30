/**
 * Adversarial rows for the Paladin's Twin Soul Phase 1 rules core (test-strategy section 10).
 *
 * Groups: hostile commands (state stays the same, no counter grows), the `ask` payload of the
 * driver (no field tells the view which shade holds the word), determinism (seed and noise), and
 * rows for the rules of section 4 that only one existing row checks (ids, courage, misses,
 * first try, points). Every loop has a step limit that throws. No row reads text by a match.
 */
import { describe, expect, it } from 'vitest';
import { evidenceOf } from '../../../src/games/paladins-twin-soul/core/index.js';
import { TwinSoulPlayer, type Presentation } from '../../../src/games/paladins-twin-soul/view/driver.js';
import { nextStrike } from '../../../src/games/paladins-twin-soul/qc/bot.js';
import { SHORT_STORY, STORY, captorOf, create, loose, ofType, playToEnd, send, strike, wrongShade, wrongStrike, type Ev } from './helpers.js';

const LIMIT = 500;

function guard(count: number, what: string): void {
  if (count >= LIMIT) throw new Error(`step limit ${LIMIT} reached: ${what}`);
}

const started = (seed: number, helper = false, story = STORY) => {
  const sim = create(seed, helper, story);
  send(sim, { type: 'start' });
  return sim;
};

const raw = (sim: ReturnType<typeof create>, command: unknown): Ev[] => loose(sim.dispatch(command as never));

const seeds = (n: number): number[] => Array.from({ length: n }, (_, i) => i + 1);

describe('ADV hostile commands: a rejected event or the documented response, state unchanged', () => {
  const FIRST_WAVE_ID = 'w1s1';

  /** Strike commands with a shade the core must reject. */
  const badShades: [string, unknown][] = [
    ['undefined', undefined],
    ['null', null],
    ['a number', 42],
    ['NaN', Number.NaN],
    ['a negative number', -1],
    ['an index past the end', 99],
    ['an object', {}],
    ['an array with a real id', [FIRST_WAVE_ID]],
    ['an object that prints as a real id', { toString: () => FIRST_WAVE_ID }],
    ['__proto__', '__proto__'],
    ['constructor', 'constructor'],
    ['the empty string', ''],
    ['a real id with a leading space', ` ${FIRST_WAVE_ID}`],
    ['a real id in upper case', FIRST_WAVE_ID.toUpperCase()],
    ['a real id with a null byte', `${FIRST_WAVE_ID}\u0000`],
    ['wave zero', 'w0s1'],
    ['a future wave', 'w2s1'],
  ];

  it.each(badShades)('a strike with %s gives one strikeRejected and keeps the state', (_name, shade) => {
    const sim = started(3);
    const before = sim.snapshot();
    const events = raw(sim, { type: 'strike', shade });
    expect(events).toHaveLength(1);
    expect(events[0]!.type).toBe('strikeRejected');
    expect(sim.snapshot()).toEqual(before);
  });

  const badTypes: [string, unknown][] = [
    ['an unknown type', { type: 'bogus', shade: FIRST_WAVE_ID }],
    ['no fields', {}],
    ['a type in upper case', { type: 'STRIKE', shade: FIRST_WAVE_ID }],
    ['a type that is an array', { type: ['strike'], shade: FIRST_WAVE_ID }],
    ['a type that is a number', { type: 7, shade: FIRST_WAVE_ID }],
    ['a second start', { type: 'start' }],
  ];

  it.each(badTypes)('%s gives no event and keeps the state', (_name, command) => {
    const sim = started(3);
    const before = sim.snapshot();
    expect(raw(sim, command)).toEqual([]);
    expect(sim.snapshot()).toEqual(before);
  });

  it('a strike with a missing shade field gives one strikeRejected', () => {
    const sim = started(3);
    const before = sim.snapshot();
    const events = raw(sim, { type: 'strike' });
    expect(events.map((e) => e.type)).toEqual(['strikeRejected']);
    expect(sim.snapshot()).toEqual(before);
  });

  it('an extra field changes nothing: the events and the state equal those of the plain command', () => {
    const plain = started(8);
    const extra = started(8);
    const shade = wrongShade(plain)!;
    const a = strike(plain, shade);
    const b = raw(extra, { type: 'strike', shade, extra: 'x', damage: 99, courage: 0, score: 1e9 });
    expect(b).toEqual(a);
    expect(extra.snapshot()).toEqual(plain.snapshot());
    expect(raw(extra, { type: 'start', extra: true })).toEqual([]);
  });

  it('a frozen command is read and not changed', () => {
    const sim = started(8);
    const shade = captorOf(sim).id;
    const command = Object.freeze({ type: 'strike', shade });
    expect(raw(sim, command).map((e) => e.type)).toContain('soulFreed');
    expect(command).toEqual({ type: 'strike', shade });
  });

  it('200 rejected commands in a row give 200 rejections and leave the state and the later events unchanged', () => {
    const noisy = started(11);
    const clean = started(11);
    const before = noisy.snapshot();
    const mix: unknown[] = [
      { type: 'strike', shade: 'nope' },
      { type: 'strike', shade: Number.NaN },
      { type: 'strike', shade: -1 },
      { type: 'strike' },
    ];
    let rejected = 0;
    for (let i = 0; i < 200; i++) {
      guard(i + 1, '200 rejected');
      const events = raw(noisy, mix[i % mix.length]);
      expect(events.map((e) => e.type)).toEqual(['strikeRejected']);
      rejected += 1;
    }
    expect(rejected).toBe(200);
    expect(noisy.snapshot()).toEqual(before);
    expect(noisy.state.courage).toBe(5);
    expect(noisy.state.misses).toBe(0);
    // The next real strikes behave as in a run that never saw the 200 commands.
    const a = wrongStrike(noisy);
    const b = wrongStrike(clean);
    expect(a).toEqual(b);
    expect(noisy.snapshot()).toEqual(clean.snapshot());
  });

  it('200 strikes on one faded shade give 200 rejections and do not cost courage or count a miss', () => {
    const sim = started(12);
    const shade = wrongShade(sim)!;
    strike(sim, shade);
    const before = sim.snapshot();
    for (let i = 0; i < 200; i++) {
      guard(i + 1, 'faded shade strikes');
      expect(strike(sim, shade).map((e) => e.type)).toEqual(['strikeRejected']);
    }
    expect(sim.snapshot()).toEqual(before);
  });

  it('stale ids of a finished wave are rejected in every later wave', () => {
    const sim = started(5);
    let previous: string[] = [];
    let waves = 0;
    for (let i = 0; i < LIMIT && sim.state.phase === 'playing'; i++) {
      if (previous.length > 0) {
        waves += 1;
        const before = sim.snapshot();
        for (const id of previous) {
          expect(strike(sim, id).map((e) => e.type)).toEqual(['strikeRejected']);
        }
        expect(sim.snapshot()).toEqual(before);
      }
      previous = sim.state.shades.map((s) => s.id);
      strike(sim, captorOf(sim).id);
      if (i === LIMIT - 1) guard(LIMIT, 'stale ids');
    }
    expect(sim.state.phase).toBe('victory');
    expect(waves).toBe(STORY.vocabulary.length - 1);
  });

  it('a strike or start after the run ended gives no event and changes nothing', () => {
    const sim = create(4);
    const events = playToEnd(sim);
    expect(events.length).toBeGreaterThan(0);
    expect(sim.state.phase).toBe('victory');
    const before = sim.snapshot();
    const ids = ['w1s1', 'w2s1', 'w13s1', 'nope'];
    for (const shade of ids) expect(strike(sim, shade)).toEqual([]);
    expect(raw(sim, { type: 'start' })).toEqual([]);
    expect(raw(sim, { type: 'strike' })).toEqual([]);
    expect(sim.tick()).toEqual([]);
    expect(sim.snapshot()).toEqual(before);
  });

  it('a strike before start gives no event and changes nothing', () => {
    const sim = create(4);
    const before = sim.snapshot();
    expect(strike(sim, 'w1s1')).toEqual([]);
    expect(sim.snapshot()).toEqual(before);
    expect(before.started).toBe(false);
  });
});

describe('ADV the ask payload of the driver tells nothing about the captor (Review C)', () => {
  interface Asked {
    payload: { translation: string; shades: Record<string, unknown>[]; retry: boolean };
    captorIndex: number;
    captorKind: unknown;
    wave: number;
  }

  /** Plays the whole driver; the choice reads the state, the payload is recorded as the view sees it. */
  async function driven(seed: number, wrongsPerWave: number, helper: boolean, story = STORY) {
    const sim = create(seed, helper, story);
    const asked: Asked[] = [];
    const capturedArgs: number[] = [];
    const dives: { diverIsCaptor: boolean }[] = [];
    let wave = -1;
    let wrongsLeft = 0;
    let asks = 0;
    const impl: Record<string, (...args: never[]) => unknown> = {
      async ask(payload: Asked['payload']) {
        asks += 1;
        guard(asks, 'driver asks');
        if (sim.state.targetIndex !== wave) {
          wave = sim.state.targetIndex;
          wrongsLeft = wrongsPerWave;
        }
        const captor = captorOf(sim);
        const shown = payload.shades;
        asked.push({
          payload: structuredClone(payload),
          captorIndex: shown.findIndex((s) => s.id === captor.id),
          captorKind: captor.kind,
          wave: wave + 1,
        });
        const wrong = wrongsLeft > 0 ? wrongShade(sim) : null;
        if (wrong) wrongsLeft -= 1;
        const c = nextStrike(sim.state);
        return wrong ?? (c?.type === 'strike' ? c.shade : '');
      },
      captured: (...args: never[]) => void capturedArgs.push(args.length),
      shadeDived: async (shade: string) => {
        dives.push({ diverIsCaptor: shade === captorOf(sim).id });
      },
    };
    const presentation = new Proxy(impl, {
      get(target, key) {
        if (typeof key !== 'string' || key === 'then') return undefined;
        return key in target ? target[key] : async () => undefined;
      },
    }) as unknown as Presentation;
    const player = new TwinSoulPlayer({
      sim,
      story: { id: story.id, level: story.level },
      seed,
      presentation,
      complete: () => undefined,
      now: () => 0,
    });
    await player.start();
    return { sim, asked, capturedArgs, dives };
  }

  it('every payload has the keys translation, shades, retry; every shade has id, term, and kind only', async () => {
    let payloads = 0;
    for (const [story, helper] of [[STORY, false], [STORY, true], [SHORT_STORY, false]] as const) {
      for (const seed of seeds(6)) {
        const { asked } = await driven(seed, 2, helper, story);
        for (const a of asked) {
          payloads += 1;
          expect(Object.keys(a.payload).sort()).toEqual(['retry', 'shades', 'translation']);
          for (const shade of a.payload.shades) expect(Object.keys(shade).sort()).toEqual(['id', 'kind', 'term']);
          const text = JSON.stringify(a.payload);
          for (const name of ['wordId', 'itemId', 'captor', 'captured', 'target', 'fallen', 'attempts', 'solved']) {
            expect(Object.keys(JSON.parse(text)).concat(a.payload.shades.flatMap((s) => Object.keys(s)))).not.toContain(name);
          }
        }
      }
    }
    expect(payloads).toBeGreaterThan(100);
  });

  it('the shade ids carry only the wave and the slot, in formation order, with no suffix', async () => {
    const { asked } = await driven(9, 1, false);
    expect(asked.length).toBeGreaterThan(0);
    for (const a of asked) {
      let last = 0;
      for (const shade of a.payload.shades) {
        const m = /^w(\d+)s(\d+)$/.exec(String(shade.id));
        expect(m).not.toBeNull();
        expect(Number(m![1])).toBe(a.wave);
        expect(Number(m![2])).toBeGreaterThan(last);
        last = Number(m![2]);
      }
    }
  });

  it('the captor takes at least four places and all three kinds in the first ask of 30 seeds', async () => {
    const places = new Set<number>();
    const kinds = new Set<unknown>();
    const firstIds: string[] = [];
    for (const seed of seeds(30)) {
      const { asked } = await driven(seed, 0, false);
      const first = asked[0]!;
      expect(first.captorIndex).toBeGreaterThanOrEqual(0);
      places.add(first.captorIndex);
      kinds.add(first.captorKind);
      firstIds.push(String(first.payload.shades[first.captorIndex]!.id));
    }
    expect(places.size).toBeGreaterThanOrEqual(4);
    expect(kinds.size).toBe(3);
    expect(new Set(firstIds).size).toBeGreaterThanOrEqual(4);
  });

  it('the captor place in the payload is not the same place in every ask of a run (later waves too)', async () => {
    const pooled = new Set<number>();
    let asks = 0;
    for (const seed of seeds(10)) {
      const { asked } = await driven(seed, 0, false);
      for (const a of asked) {
        asks += 1;
        pooled.add(a.captorIndex);
      }
    }
    expect(asks).toBe(10 * STORY.vocabulary.length);
    expect(pooled.size).toBeGreaterThanOrEqual(5);
  });

  it('after a fade the captor is neither first nor last by rule: its place stays unpredictable', async () => {
    const places = new Set<number>();
    for (const seed of seeds(30)) {
      const { asked } = await driven(seed, 1, false);
      const retry = asked.find((a) => a.payload.retry);
      expect(retry).toBeDefined();
      places.add(retry!.captorIndex);
    }
    expect(places.size).toBeGreaterThanOrEqual(3);
  });

  it('captured() gets no argument, and a dive hits the captor in some runs and a decoy in others', async () => {
    let captorDives = 0;
    let decoyDives = 0;
    for (const seed of seeds(30)) {
      const { capturedArgs, dives } = await driven(seed, 1, false);
      expect(capturedArgs.length).toBeGreaterThan(0);
      expect(capturedArgs.every((n) => n === 0)).toBe(true);
      for (const d of dives) {
        if (d.diverIsCaptor) captorDives += 1;
        else decoyDives += 1;
      }
    }
    expect(captorDives).toBeGreaterThan(0);
    expect(decoyDives).toBeGreaterThan(0);
  });
});

describe('ADV determinism', () => {
  /** A scripted run: 1 to 4 wrong strikes per wave, then the captor. `noise` adds rejected commands and ticks. */
  function scripted(seed: number, noise: boolean, story = STORY) {
    const sim = create(seed, false, story);
    const events: Ev[] = [];
    const noiseOut: Ev[] = [];
    const noisy = () => {
      if (!noise) return;
      for (let k = 0; k < 3; k++) noiseOut.push(...strike(sim, `nope${k}`));
      noiseOut.push(...loose(sim.tick()));
      noiseOut.push(...raw(sim, { type: 'bogus' }));
    };
    noisy();
    events.push(...send(sim, { type: 'start' }));
    let wave = -1;
    let wrongsLeft = 0;
    let steps = 0;
    while (sim.state.phase === 'playing') {
      guard(steps, 'scripted run');
      steps += 1;
      if (sim.state.targetIndex !== wave) {
        wave = sim.state.targetIndex;
        wrongsLeft = 1 + (wave % 4);
      }
      noisy();
      const w = wrongsLeft > 0 ? wrongShade(sim) : null;
      if (w) {
        wrongsLeft -= 1;
        events.push(...strike(sim, w));
      } else {
        events.push(...strike(sim, captorOf(sim).id));
      }
    }
    return { sim, events, noiseOut, snapshot: sim.snapshot() };
  }

  it('the same seed and the same commands give the same events, snapshot, and evidence', () => {
    const a = scripted(21, false);
    const b = scripted(21, false);
    expect(a.events.length).toBeGreaterThan(50);
    expect(b.events).toEqual(a.events);
    expect(b.snapshot).toEqual(a.snapshot);
    const story = { id: STORY.id, level: STORY.level };
    expect(evidenceOf(b.sim.state, story, 21, 1234)).toEqual(evidenceOf(a.sim.state, story, 21, 1234));
  });

  it('rejected commands, unknown types, and ticks draw no random number: the run is the same with and without them', () => {
    for (const seed of [3, 14, 27]) {
      const quiet = scripted(seed, false);
      const noisy = scripted(seed, true);
      expect(noisy.noiseOut.length).toBeGreaterThan(0);
      expect(noisy.noiseOut.every((e) => e.type === 'strikeRejected')).toBe(true);
      expect(noisy.events).toEqual(quiet.events);
      expect(noisy.snapshot).toEqual(quiet.snapshot);
    }
  });

  it('a different seed changes the target order and the formation, and no rule number', () => {
    const base = scripted(1, false);
    const firstWave = (events: Ev[]) => JSON.stringify(ofType(events, 'waveShown')[0]);
    const orderOf = (events: Ev[]) => ofType(events, 'waveShown').map((e) => e.itemId).join(',');
    const courageOf = (events: Ev[]) => ofType(events, 'shadeDived').map((e) => e.courage);
    let differing = 0;
    for (const seed of seeds(10).slice(1)) {
      const other = scripted(seed, false);
      if (orderOf(other.events) !== orderOf(base.events)) differing += 1;
      expect(firstWave(other.events)).not.toBe('');
      expect(courageOf(other.events)).toEqual(courageOf(base.events));
      expect(ofType(other.events, 'rest').length).toBe(ofType(base.events, 'rest').length);
      expect(other.snapshot.score).toBe(base.snapshot.score);
      expect(other.snapshot.misses).toBe(base.snapshot.misses);
      expect(other.snapshot.twins).toBe(base.snapshot.twins);
    }
    expect(differing).toBeGreaterThanOrEqual(7);
    expect(ofType(base.events, 'rest').length).toBeGreaterThan(0);
  });
});

describe('ADV rules that one existing row checks', () => {
  it('shade ids are unique in a whole run and every wave k uses the prefix wk', () => {
    const sim = started(6);
    const ids: string[] = [];
    let wave = 0;
    for (let i = 0; i < LIMIT && sim.state.phase === 'playing'; i++) {
      wave += 1;
      const prefix = `w${wave}s`;
      expect(sim.state.shades.every((s) => s.id.startsWith(prefix))).toBe(true);
      expect(sim.state.shades.map((s) => s.id)).toEqual(sim.state.shades.map((_, j) => `${prefix}${j + 1}`));
      ids.push(...sim.state.shades.map((s) => s.id));
      strike(sim, captorOf(sim).id);
      if (i === LIMIT - 1) guard(LIMIT, 'unique ids');
    }
    expect(wave).toBe(STORY.vocabulary.length);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('courage follows the dive events over two rests, and the state agrees with the last event', () => {
    const sim = started(9);
    const dived: number[] = [];
    const rests: number[] = [];
    const wrongsByWave = [5, 3];
    for (const wrongs of wrongsByWave) {
      for (let i = 0; i < wrongs; i++) {
        const events = wrongStrike(sim);
        const dive = ofType(events, 'shadeDived')[0]!;
        dived.push(dive.courage);
        const rest = ofType(events, 'rest')[0];
        if (rest) rests.push(rest.courage);
        expect(sim.state.courage).toBe(rest ? rest.courage : dive.courage);
      }
      strike(sim, captorOf(sim).id);
    }
    expect(dived).toEqual([4, 3, 2, 1, 0, 2, 1, 0]);
    expect(rests).toEqual([3, 3]);
    expect(sim.state.courage).toBe(3);
    expect(sim.state.phase).toBe('playing');
  });

  it('misses counts every wrong strike of the run, and nothing else', () => {
    const sim = started(10);
    let expected = 0;
    for (const wrongs of [3, 2, 0, 4]) {
      for (let i = 0; i < wrongs; i++) {
        wrongStrike(sim);
        expected += 1;
        expect(sim.state.misses).toBe(expected);
      }
      strike(sim, 'nope');
      strike(sim, captorOf(sim).id);
      expect(sim.state.misses).toBe(expected);
    }
    expect(expected).toBe(9);
  });

  it('firstTry, wordId of a fade, points, twins, and the evidence agree after retries', () => {
    const sim = started(13);
    const freed: Ev[] = [];
    const itemIds: string[] = [];
    for (const wrongs of [2, 0, 1, 0]) {
      const word = sim.state.target!.itemId;
      itemIds.push(word);
      for (let i = 0; i < wrongs; i++) {
        const shade = wrongShade(sim)!;
        const wordIdOfShade = sim.state.shades.find((s) => s.id === shade)!.wordId;
        const fade = ofType(strike(sim, shade), 'shadeFaded')[0]!;
        expect(fade.wordId).toBe(wordIdOfShade);
        expect(fade.wordId).not.toBe(word);
      }
      const events = strike(sim, captorOf(sim).id);
      const soul = ofType(events, 'soulFreed')[0]!;
      expect(soul.itemId).toBe(word);
      expect(soul.firstTry).toBe(wrongs === 0);
      freed.push(soul);
    }
    expect(freed.map((e) => e.firstTry)).toEqual([false, true, false, true]);
    expect(freed.map((e) => e.twins)).toEqual([1, 2, 3, 4]);
    expect(freed.map((e) => e.points)).toEqual([100, 100, 100, 100]);
    expect(sim.state.score).toBe(freed.reduce((sum, e) => sum + e.points, 0));
    expect(sim.state.score).toBe(100 * sim.state.twins);
    const evidence = evidenceOf(sim.state, { id: STORY.id, level: STORY.level }, 13, 0);
    expect(evidence.items.map((i) => i.itemId)).toEqual(itemIds);
    expect(evidence.items.map((i) => i.attempts)).toEqual([3, 1, 2, 1]);
    expect(evidence.items.map((i) => i.correctFirstTry)).toEqual([false, true, false, true]);
  });

  it('a rest never ends the run: after the rest the wave ends with the captor and the next wave is full', () => {
    const sim = started(15);
    for (let i = 0; i < 5; i++) wrongStrike(sim);
    expect(sim.state.courage).toBe(3);
    const events = strike(sim, captorOf(sim).id);
    expect(ofType(events, 'soulFreed')).toHaveLength(1);
    expect(sim.state.shades.length).toBe(6);
    expect(sim.state.shades.every((s) => !s.fallen)).toBe(true);
    expect(sim.state.courage).toBe(3);
  });
});
