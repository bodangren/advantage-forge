import { beforeEach, expect, it, vi } from 'vitest';
import { setImmediate } from 'node:timers/promises';
import { AudioBus } from '../../src/apk3d/audio/bus.js';
import { wireChibiSounds } from '../../src/apk3d/audio/chibi.js';

const ogg = 'audio/ogg; codecs="vorbis"';
const mpeg = 'audio/mpeg';
const base = '/audio/chibi/';
const aUrl = `${base}tap.ogg`;
const bUrl = `${base}other.ogg`;
const map = (entry: string, folder = base) => ({ base: folder, events: { tap: entry } });

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}

type Decoded = { url: string };

class FakeSource {
  buffer: Decoded | null = null;
  onended: (() => void) | null = null;
  connect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
}

class FakeContext {
  static instances: FakeContext[] = [];
  static firstDecode: Promise<Decoded> | null = null;
  state = 'suspended';
  currentTime = 0;
  destination = {};
  sources: FakeSource[] = [];
  tones = vi.fn();
  createOscillator = () => ({
    frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    connect: (node: unknown) => node,
    start: this.tones,
    stop: vi.fn(),
  });
  createGain() {
    const gain = { value: 0, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() };
    return { gain, connect: (node: unknown) => node };
  }
  createBufferSource() {
    const source = new FakeSource();
    this.sources.push(source);
    return source;
  }
  createBuffer = () => ({ url: 'silent pulse' });
  decodeAudioData = vi.fn(async (bytes: ArrayBuffer): Promise<Decoded> => ({ url: urlOf(bytes) }));
  resume = vi.fn(async () => {
    this.state = 'running';
  });
  close = vi.fn(async () => {
    this.state = 'closed';
  });
  constructor() {
    if (FakeContext.firstDecode) {
      const decode = FakeContext.firstDecode;
      this.decodeAudioData.mockImplementationOnce(() => decode);
      FakeContext.firstDecode = null;
    }
    FakeContext.instances.push(this);
  }
}

// Encode the URL in the test bytes to distinguish stale and current decodes.
const urlOf = (bytes: ArrayBuffer) => new TextDecoder().decode(bytes);
const response = (url: string) => new Response(url);
const fetchFile = vi.fn(async (url: string) => response(url));
const canPlayType = vi.fn((type: string) => (type === ogg ? 'probably' : ''));
const fetchUrls = () => fetchFile.mock.calls.map(([url]) => url);
const decodedUrls = (ctx: FakeContext) => ctx.decodeAudioData.mock.calls.map(([bytes]) => urlOf(bytes));
const playedUrls = (ctx: FakeContext) =>
  ctx.sources
    .filter((source) => source.start.mock.calls.length > 0 && source.buffer?.url !== 'silent pulse')
    .map((source) => source.buffer?.url);

// Only the memory tests need the private collections. Playback uses the public API.
const cache = (bus: AudioBus) =>
  bus as unknown as {
    pendingDecode: ReadonlyMap<string, unknown>;
    buffers: ReadonlyMap<string, unknown>;
    loading: ReadonlySet<string>;
    failed: ReadonlySet<string>;
    sources: ReadonlySet<unknown>;
  };

beforeEach(() => {
  FakeContext.instances = [];
  FakeContext.firstDecode = null;
  fetchFile.mockReset().mockImplementation(async (url) => response(url));
  canPlayType.mockClear();
  vi.stubGlobal('window', { AudioContext: FakeContext, setInterval, clearInterval });
  vi.stubGlobal('navigator', {});
  vi.stubGlobal(
    'Audio',
    class {
      canPlayType = canPlayType;
    },
  );
  vi.stubGlobal('fetch', fetchFile);
  return () => vi.unstubAllGlobals();
});

it('installs the first A decode when A is current again after A to B to A', async () => {
  const bus = new AudioBus();
  bus.useSoundFiles(map('tap'));
  bus.unlock();
  const ctx = FakeContext.instances[0]!;
  const firstA = deferred<Decoded>();
  ctx.decodeAudioData.mockImplementationOnce(() => firstA.promise);
  bus.play('tap');
  await setImmediate();
  expect(decodedUrls(ctx)).toEqual([aUrl]);
  expect(ctx.tones).toHaveBeenCalledTimes(1);

  bus.useSoundFiles(map('other'));
  bus.preload(['tap']);
  await setImmediate();
  expect(decodedUrls(ctx)).toEqual([aUrl, bUrl]);
  bus.useSoundFiles(map('tap'));
  firstA.resolve({ url: aUrl });
  await setImmediate();

  expect(playedUrls(ctx)).toEqual([]);
  bus.play('tap');
  expect(playedUrls(ctx)).toEqual([aUrl]);
  expect(ctx.tones).toHaveBeenCalledTimes(1);
  expect(fetchUrls()).toEqual([aUrl, bUrl]);
  bus.dispose();
});

it('invalidates a decoded file when only the base changes', async () => {
  const bus = new AudioBus();
  const events = { tap: 'tap' };
  const nextBase = '/next/audio/chibi/';
  const nextUrl = `${nextBase}tap.ogg`;
  bus.useSoundFiles({ base, events });
  bus.unlock();
  const ctx = FakeContext.instances[0]!;
  bus.preload(['tap']);
  await setImmediate();
  bus.play('tap');
  expect(playedUrls(ctx)).toEqual([aUrl]);

  bus.useSoundFiles({ base: nextBase, events });
  expect(fetchUrls()).toEqual([aUrl]);
  bus.play('tap');
  expect(playedUrls(ctx)).toEqual([aUrl]);
  expect(ctx.tones).toHaveBeenCalledTimes(1);
  await setImmediate();
  bus.play('tap');
  expect(fetchUrls()).toEqual([aUrl, nextUrl]);
  expect(decodedUrls(ctx)).toEqual([aUrl, nextUrl]);
  expect(playedUrls(ctx)).toEqual([aUrl, nextUrl]);
  bus.dispose();
});

// TD-44: late finding F1 (adversarial-p3-09f808bd), skipped by PM decision 2026-11-22; reopen when a host rewires or passes dynamic event names
it.skip('keeps the current preload when stale bytes arrive last before unlock', async () => {
  const bus = new AudioBus();
  const stale = deferred<Response>();
  fetchFile.mockImplementationOnce(() => stale.promise);
  bus.useSoundFiles(map('tap'));
  bus.preload(['tap']);
  bus.useSoundFiles(map('other'));
  bus.preload(['tap']);
  await setImmediate();
  expect(fetchUrls()).toEqual([aUrl, bUrl]);
  expect(FakeContext.instances).toHaveLength(0);

  stale.resolve(response(aUrl));
  await setImmediate();
  bus.unlock();
  const ctx = FakeContext.instances[0]!;
  await setImmediate();
  expect(playedUrls(ctx)).toEqual([]);
  bus.play('tap');
  bus.play('tap');
  expect(fetchUrls()).toEqual([aUrl, bUrl]);
  expect.soft(playedUrls(ctx), 'both plays use the current preload, not the synth').toEqual([bUrl, bUrl]);
  expect.soft(decodedUrls(ctx)).toEqual([bUrl]);
  expect(ctx.tones).not.toHaveBeenCalled();
  bus.dispose();
});

it('keeps the newer preload in flight when the old decode completes first', async () => {
  const bus = new AudioBus();
  bus.useSoundFiles(map('tap'));
  bus.unlock();
  const ctx = FakeContext.instances[0]!;
  const a = deferred<Decoded>();
  const b = deferred<Decoded>();
  ctx.decodeAudioData.mockImplementationOnce(() => a.promise).mockImplementationOnce(() => b.promise);
  bus.preload(['tap']);
  await setImmediate();
  bus.useSoundFiles(map('other'));
  bus.preload(['tap']);
  await setImmediate();
  expect(decodedUrls(ctx)).toEqual([aUrl, bUrl]);

  a.resolve({ url: aUrl });
  await setImmediate();
  bus.play('tap');
  bus.preload(['tap']);
  expect(playedUrls(ctx)).toEqual([]);
  expect(ctx.tones).toHaveBeenCalledTimes(1);
  expect(fetchUrls()).toEqual([aUrl, bUrl]);

  b.resolve({ url: bUrl });
  await setImmediate();
  bus.play('tap');
  expect(playedUrls(ctx)).toEqual([bUrl]);
  expect(ctx.tones).toHaveBeenCalledTimes(1);
  bus.dispose();
});

// TD-44: late finding F2 (adversarial-p3-09f808bd), skipped by PM decision 2026-11-22; reopen when a host rewires or passes dynamic event names
it.skip('keeps a pending decode from a disposed context out of the next bus and context', async () => {
  const oldBus = new AudioBus();
  oldBus.useSoundFiles(map('tap'));
  oldBus.unlock();
  const oldCtx = FakeContext.instances[0]!;
  const late = deferred<Decoded>();
  oldCtx.decodeAudioData.mockImplementationOnce(() => late.promise);
  oldBus.preload(['tap']);
  await setImmediate();
  expect(decodedUrls(oldCtx)).toEqual([aUrl]);
  oldBus.dispose();
  expect(oldCtx.close).toHaveBeenCalledTimes(1);

  const newBus = new AudioBus();
  newBus.useSoundFiles(map('tap'));
  newBus.unlock();
  const newCtx = FakeContext.instances[1]!;
  newBus.preload(['tap']);
  await setImmediate();
  // The decoder had handed off this result before the old context closed.
  const oldBuffer = { url: aUrl };
  late.resolve(oldBuffer);
  await setImmediate();
  expect(playedUrls(oldCtx)).toEqual([]);
  newBus.play('tap');
  expect(playedUrls(newCtx)).toEqual([aUrl]);
  expect(newCtx.sources[1]!.buffer).not.toBe(oldBuffer);
  expect(decodedUrls(newCtx)).toEqual([aUrl]);
  newBus.dispose();

  // Unlock can create a new context on the original bus after disposal.
  oldBus.unlock();
  const reopened = FakeContext.instances[2]!;
  oldBus.play('tap');
  expect(reopened.sources[1]?.buffer, 'the disposed context must not supply the sound').not.toBe(oldBuffer);
  expect(reopened.tones, 'the reopened bus needs a fresh load').toHaveBeenCalledTimes(1);
  expect(playedUrls(reopened)).toEqual([]);
  await setImmediate();
  oldBus.play('tap');
  expect(fetchUrls()).toEqual([aUrl, aUrl, aUrl]);
  expect(playedUrls(reopened)).toEqual([aUrl]);
  expect(reopened.sources[1]!.buffer).not.toBe(oldBuffer);
  oldBus.dispose();
});

it('unlocks twice while queued bytes decode without a second context, decode, or pulse', async () => {
  const bus = new AudioBus();
  const decode = deferred<Decoded>();
  bus.useSoundFiles(map('tap'));
  bus.preload(['tap']);
  await setImmediate();
  expect(FakeContext.instances).toHaveLength(0);
  expect(fetchUrls()).toEqual([aUrl]);
  FakeContext.firstDecode = decode.promise;
  bus.unlock();
  bus.unlock();
  const ctx = FakeContext.instances[0]!;
  expect(FakeContext.instances).toHaveLength(1);
  expect(decodedUrls(ctx)).toEqual([aUrl]);
  expect(ctx.resume).toHaveBeenCalledTimes(1);
  expect(ctx.sources).toHaveLength(1);
  expect(ctx.sources[0]!.start).toHaveBeenCalledTimes(1);
  expect(ctx.sources[0]!.buffer?.url).toBe('silent pulse');
  expect(canPlayType.mock.calls).toEqual([[ogg], [mpeg]]);

  bus.play('tap');
  expect(playedUrls(ctx)).toEqual([]);
  expect(ctx.tones).toHaveBeenCalledTimes(1);
  decode.resolve({ url: aUrl });
  await setImmediate();
  bus.play('tap');
  expect(playedUrls(ctx)).toEqual([aUrl]);
  expect(ctx.tones).toHaveBeenCalledTimes(1);
  expect(fetchUrls()).toEqual([aUrl]);
  bus.dispose();
});

it('bounds queued bytes and decoded buffers by the mapped events, not the event stream', async () => {
  const bus = new AudioBus();
  const names = Array.from({ length: 256 }, (_, i) => `mapped-${i}`);
  const unknown = Array.from({ length: 2048 }, (_, i) => `synth-${i}`);
  const events = Object.fromEntries(names.map((name) => [name, name]));
  const urls = names.map((name) => `${base}${name}.ogg`);
  bus.useSoundFiles({ base, events });
  bus.preload([...unknown, ...names, ...names]);
  await setImmediate();
  const state = cache(bus);
  expect(fetchUrls()).toEqual(urls);
  expect([...state.pendingDecode.keys()]).toEqual(names);
  expect(state.loading.size).toBe(names.length);

  bus.unlock();
  const ctx = FakeContext.instances[0]!;
  await setImmediate();
  expect(decodedUrls(ctx)).toEqual(urls);
  expect([...state.buffers.keys()]).toEqual(names);
  expect(state.pendingDecode.size).toBe(0);
  expect(state.loading.size).toBe(0);
  expect(state.failed.size).toBe(0);
  expect(playedUrls(ctx)).toEqual([]);

  const survivor = names[0]!;
  bus.useSoundFiles({ base, events: { [survivor]: survivor } });
  expect([...state.buffers.keys()]).toEqual([survivor]);
  bus.defineSfx(names[1]!, (s) => s.tone(440, 0.1, 'sine', 0.1));
  for (const name of [...names, ...unknown]) bus.play(name);
  expect(playedUrls(ctx)).toEqual([urls[0]]);
  expect(ctx.tones).toHaveBeenCalledTimes(1);
  expect(fetchUrls()).toEqual(urls);
  expect(state.sources.size).toBe(1);
  ctx.sources[1]!.onended?.();
  expect(state.sources.size).toBe(0);
  bus.dispose();
  expect(state.buffers.size).toBe(0);
});

it.each([
  { kind: 'ordinary absent names', absent: ['hit', 'ghost'] },
  { kind: 'inherited object names', absent: ['constructor', 'toString'] },
])('wires a real bus without fetching $kind', async ({ absent }) => {
  const bus = new AudioBus();
  const tapUrl = '/demo/audio/chibi/tap.ogg';
  fetchFile.mockImplementation(async (url) =>
    url === tapUrl ? response(url) : new Response(null, { status: 404 }),
  );
  for (const event of absent) bus.defineSfx(event, (s) => s.tone(440, 0.1, 'sine', 0.1));
  const preload = vi.spyOn(bus, 'preload');
  expect(wireChibiSounds(bus, '/demo/', [absent[0]!, 'tap', ...absent, 'tap'])).toBe(true);
  bus.unlock();
  const ctx = FakeContext.instances[0]!;
  await setImmediate();
  expect(playedUrls(ctx)).toEqual([]);
  bus.play('tap');
  for (const event of absent) bus.play(event);
  expect(playedUrls(ctx), 'only mapped events play a file').toEqual([tapUrl]);
  expect(ctx.tones).toHaveBeenCalledTimes(absent.length);
  expect.soft(fetchUrls(), 'absent names must not start any network request').toEqual([tapUrl]);
  expect(preload.mock.calls).toEqual([[['tap']]]);
  bus.dispose();
});
