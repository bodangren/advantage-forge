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
