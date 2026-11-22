import { beforeEach, expect, it, vi } from 'vitest';
import { AudioBus } from '../../src/apk3d/audio/bus.js';
import { wireChibiSounds } from '../../src/apk3d/audio/chibi.js';

const base = '/demo/audio/chibi/';
const fetchUrls: string[] = [];
const names = ['constructor', 'toString', '__proto__', 'hasOwnProperty', 'valueOf', '', '/', '..', '?'];

beforeEach(() => {
  fetchUrls.length = 0;
  vi.stubGlobal(
    'Audio',
    class {
      canPlayType(type: string): CanPlayTypeResult {
        return type === 'audio/ogg; codecs="vorbis"' ? 'probably' : '';
      }
    },
  );
  vi.stubGlobal('fetch', async (url: string) => {
    fetchUrls.push(url);
    return { ok: true, arrayBuffer: async () => new ArrayBuffer(8) };
  });
  return () => vi.unstubAllGlobals();
});

// A load that started under an own mapping resolves on microtasks, so three ticks flush
// the fetch, the array buffer, and the decode.
const flush = async () => {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
};

// iOS 15.0–15.3 and Chrome WebView 80–92 lack this API. Restore it before Vitest runs assertions.
function withoutNativeHasOwn<T>(operation: () => T): T {
  const descriptor = Object.getOwnPropertyDescriptor(Object, 'hasOwn')!;
  Reflect.deleteProperty(Object, 'hasOwn');
  try {
    return operation();
  } finally {
    Object.defineProperty(Object, 'hasOwn', descriptor);
  }
}

it('wires a Chibi host on the supported browser range without native Object.hasOwn', () => {
  const bus = new AudioBus();
  // A mapped first event enters the helper from ordinary host startup.
  expect(withoutNativeHasOwn(() => wireChibiSounds(bus, '/demo/', ['tap', ...names, 'tap']))).toBe(true);
  expect(fetchUrls).toEqual([`${base}tap.ogg`]);
});

it('preloads an own event on the supported browser range without native Object.hasOwn', () => {
  const bus = new AudioBus();
  const events = { hasOwnProperty: 'right' };
  bus.useSoundFiles({ base, events });
  withoutNativeHasOwn(() => bus.preload(['toString', 'hasOwnProperty']));
  expect(fetchUrls).toEqual([`${base}right.ogg`]);
});

it('wires only exact mapped names from an event list with inherited and odd names', () => {
  const bus = new AudioBus();
  const preload = vi.spyOn(bus, 'preload');
  expect(wireChibiSounds(bus, '/demo/', [...names, 'tap', ...names, 'correct', 'tap'])).toBe(true);
  expect(preload.mock.calls).toEqual([[['tap', 'correct']]]);
  expect(fetchUrls).toEqual([`${base}tap.ogg`, `${base}right.ogg`]);
});

it.each(['null prototype', 'normal prototype'])('preloads own keys on a map with a %s', (kind) => {
  const entries = names.map((name, index) => [name, `take-${index}`] as const);
  const events =
    kind === 'null prototype'
      ? (Object.assign(Object.create(null), Object.fromEntries(entries)) as Record<string, string>)
      : Object.fromEntries(entries);
  const bus = new AudioBus();
  bus.useSoundFiles({ base, events });
  bus.preload(['absent', ...names, ...names]);
  expect(fetchUrls).toEqual(entries.map(([, entry]) => `${base}${entry}.ogg`));
});

it('rejects an inherited string entry even when another entry is own', () => {
  const events = Object.create({ tap: 'wrong' }) as Record<string, string>;
  events.correct = 'right';
  const bus = new AudioBus();
  bus.useSoundFiles({ base, events });
  bus.preload(['tap', ...names, 'correct']);
  expect(fetchUrls).toEqual([`${base}right.ogg`]);
});

it('drops a pending load when the event is remapped to an inherited-only entry', async () => {
  // Spec AC4 rule 6 with the T6i own-property guard: the current map decides the file. A load
  // that started under an own mapping must not install after a remap leaves only an inherited
  // entry with the same value. The old file never plays, and no fetch follows for the name.
  // `custom` has no synth recipe, so a silent test needs no oscillator fake.
  const started: unknown[] = [];
  const decoded = {};
  class FakeCtx {
    state = 'running';
    currentTime = 0;
    destination = {};
    async decodeAudioData(): Promise<AudioBuffer> {
      return decoded as AudioBuffer;
    }
    createGain() {
      return { gain: { value: 0 }, connect() {} };
    }
    createBufferSource() {
      return {
        buffer: null as unknown,
        connect() {},
        start() {
          started.push(this.buffer);
        },
      };
    }
    createBuffer() {
      return {};
    }
    resume() {}
    close() {}
  }
  vi.stubGlobal('window', { AudioContext: FakeCtx });
  try {
    const bus = new AudioBus();
    bus.useSoundFiles({ base, events: { custom: 'tap' } });
    bus.preload(['custom']);
    const inherited = Object.create({ custom: 'tap' }) as Record<string, string>;
    bus.useSoundFiles({ base, events: inherited });
    await flush();
    expect(fetchUrls).toEqual([`${base}tap.ogg`]);
    bus.unlock();
    await flush();
    await bus.play('custom');
    await flush();
    const staleStarts = started.filter((buffer) => buffer === decoded);
    expect(staleStarts, 'the stale load installs nothing to play').toEqual([]);
    expect(fetchUrls, 'no fetch follows for the inherited name').toEqual([`${base}tap.ogg`]);
  } finally {
    vi.unstubAllGlobals();
  }
});
