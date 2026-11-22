// Review B round 4 security probe for Phase 3 (audit head e3405e70).
// Run: node node_modules/vitest/vitest.mjs run --config measure/runs/audio_game_integration_20261014/review-b-e3405e7-vitest.config.mjs
// Carries the round-3 harness and adds delta cases for the 9d150f62..e3405e70 change
// (2fb45ba3): loads bind to their starting URL via isCurrent(name, url); stale fetch or
// decode completions are dropped (no buffer, no failure mark); pendingDecode carries the URL.
// Scope: dropped completions free their bytes (no growth across repeated remaps), no retry
// loop, no failure mark on a dropped stale load, dispose still releases everything.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AudioBus } from '../../../src/apk3d/audio/bus.js';

const OGG_TYPE = 'audio/ogg; codecs="vorbis"';

interface FilesMap {
  base: string;
  events: Record<string, string>;
}

const asFilesBus = (
  bus: AudioBus,
): {
  useSoundFiles(files: FilesMap | null): void;
  preload(events: string[]): void;
} =>
  bus as unknown as {
    useSoundFiles(files: FilesMap | null): void;
    preload(events: string[]): void;
  };

// Direct view of the private retention structures, so a dropped completion is proven
// freed by size, not only by behavior.
const internals = (bus: AudioBus) =>
  bus as unknown as {
    buffers: Map<string, unknown>;
    pendingDecode: Map<string, { data: ArrayBuffer; url: string }>;
    loading: Set<string>;
    failed: Set<string>;
  };

class FakeParam {
  value = 0;
  setValueAtTime(): void {}
  exponentialRampToValueAtTime(): void {}
  setTargetAtTime(): void {}
}

class FakeNode {
  connect<T>(destination: T): T {
    return destination;
  }
}

class FakeOscillator extends FakeNode {
  type: OscillatorType = 'sine';
  frequency = new FakeParam();
  starts = 0;
  start(): void {
    this.starts += 1;
  }
  stop(): void {}
}

class FakeGain extends FakeNode {
  gain = new FakeParam();
}

class FakeBuffer {
  duration = 0.1;
  getChannelData(): Float32Array {
    return new Float32Array(8);
  }
}

class FakeBufferSource extends FakeNode {
  buffer: unknown = null;
  starts = 0;
  stops = 0;
  onended: unknown = null;
  start(): void {
    this.starts += 1;
  }
  stop(): void {
    this.stops += 1;
  }
  end(): void {
    if (typeof this.onended === 'function') (this.onended as () => void)();
  }
}

class FakeFilter extends FakeNode {
  type = 'lowpass';
  frequency = new FakeParam();
}

const decodedBuffers: FakeBuffer[] = [];

class FakeAudioContext {
  static instances: FakeAudioContext[] = [];
  static throwOnCreateBuffer = false;
  // When set, decodeAudioData delegates to this impl so a test can hold a decode pending.
  static decodeImpl: (() => Promise<FakeBuffer>) | null = null;
  state: string = 'running';
  currentTime = 0;
  sampleRate = 48000;
  destination = {};
  oscillators: FakeOscillator[] = [];
  sources: FakeBufferSource[] = [];
  decodes = 0;
  resumes = 0;
  closes = 0;
  constructor() {
    FakeAudioContext.instances.push(this);
  }
  createOscillator(): FakeOscillator {
    const node = new FakeOscillator();
    this.oscillators.push(node);
    return node;
  }
  createGain(): FakeGain {
    return new FakeGain();
  }
  createBufferSource(): FakeBufferSource {
    const node = new FakeBufferSource();
    this.sources.push(node);
    return node;
  }
  createBuffer(): FakeBuffer {
    if (FakeAudioContext.throwOnCreateBuffer) throw new Error('strict engine');
    return new FakeBuffer();
  }
  createBiquadFilter(): FakeFilter {
    return new FakeFilter();
  }
  async decodeAudioData(): Promise<FakeBuffer> {
    this.decodes += 1;
    if (FakeAudioContext.decodeImpl) return FakeAudioContext.decodeImpl();
    const buffer = new FakeBuffer();
    decodedBuffers.push(buffer);
    return buffer;
  }
  async resume(): Promise<void> {
    this.resumes += 1;
  }
  async suspend(): Promise<void> {}
  async close(): Promise<void> {
    this.closes += 1;
    this.state = 'closed';
  }
}

class FakeAudio {
  canPlayType(type: string): string {
    return type === OGG_TYPE ? 'probably' : '';
  }
}

const fetchMock = vi.fn();
const savedDescriptors: Record<string, PropertyDescriptor | undefined> = {};

function defineGlobal(key: string, value: unknown): void {
  Object.defineProperty(globalThis, key, {
    value,
    writable: true,
    configurable: true,
    enumerable: false,
  });
}

function installHarness(): void {
  for (const key of ['window', 'navigator', 'Audio', 'fetch']) {
    savedDescriptors[key] = Object.getOwnPropertyDescriptor(globalThis, key);
  }
  defineGlobal('window', {
    AudioContext: FakeAudioContext,
    webkitAudioContext: undefined,
    setInterval,
    clearInterval,
  });
  defineGlobal('navigator', {});
  defineGlobal('Audio', FakeAudio);
  defineGlobal('fetch', fetchMock);
}

function restoreHarness(): void {
  for (const key of ['window', 'navigator', 'Audio', 'fetch']) {
    const descriptor = savedDescriptors[key];
    if (descriptor === undefined) delete (globalThis as Record<string, unknown>)[key];
    else Object.defineProperty(globalThis, key, descriptor);
  }
}

const flush = async (): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
};

const fetchUrls = (): string[] => fetchMock.mock.calls.map((call) => call[0] as string);
const oscStarts = (): number =>
  FakeAudioContext.instances.reduce((sum, ctx) => sum + ctx.oscillators.length, 0);
const gameSources = (): FakeBufferSource[] =>
  FakeAudioContext.instances.flatMap((ctx) =>
    ctx.sources.filter((s) => decodedBuffers.includes(s.buffer as FakeBuffer)),
  );
// Game-source starts: a source that played a decoded file. The unlock pulse owns
// a silent source and never counts.
const gameSourceStarts = (): number => gameSources().reduce((sum, s) => sum + s.starts, 0);
const startedBuffers = (): unknown[] =>
  gameSources()
    .filter((s) => s.starts > 0)
    .map((s) => s.buffer);

const okResponse = () => ({
  ok: true,
  status: 200,
  arrayBuffer: async () => new ArrayBuffer(8),
});

beforeEach(() => {
  FakeAudioContext.instances = [];
  FakeAudioContext.throwOnCreateBuffer = false;
  FakeAudioContext.decodeImpl = null;
  decodedBuffers.length = 0;
  fetchMock.mockReset();
  fetchMock.mockImplementation(async () => okResponse());
  installHarness();
  return restoreHarness;
});

describe('Review B probe round 4: delta 9d150f62..e3405e70 security (stale load rejection)', () => {
  it('E1: a stale fetch that resolves after an entry change stores nothing and frees its bytes', async () => {
    let resolveFetch: ((value: unknown) => void) | null = null;
    fetchMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
    );
    const bus = new AudioBus();
    asFilesBus(bus).useSoundFiles({ base: '/audio/chibi/', events: { tap: 'tap' } });
    bus.unlock();
    bus.play('tap');
    await flush();
    asFilesBus(bus).useSoundFiles({ base: '/audio/chibi/', events: { tap: 'tap2' } });
    resolveFetch!(okResponse());
    fetchMock.mockImplementation(async () => okResponse());
    await flush();
    const stale = decodedBuffers[0]!;
    const inner = internals(bus);
    expect(inner.buffers.size, 'a stale completion installs no buffer').toBe(0);
    expect(inner.loading.size, 'no loading marker survives the drop').toBe(0);
    expect(inner.failed.size, 'a stale success marks no failure').toBe(0);
    bus.play('tap'); // synth now, and the new file is fetched exactly once
    await flush();
    bus.play('tap');
    await flush();
    expect(fetchUrls(), 'the next play fetches the new file once, no loop').toEqual([
      '/audio/chibi/tap.ogg',
      '/audio/chibi/tap2.ogg',
    ]);
    expect(gameSourceStarts(), 'the new file plays').toBe(1);
    expect(startedBuffers(), 'no source ever starts the stale buffer').not.toContain(stale);
  });

  it('E2: a stale fetch failure after an entry change marks no failure', async () => {
    let rejectFetch: ((error: Error) => void) | null = null;
    fetchMock.mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          rejectFetch = reject;
        }),
    );
    const bus = new AudioBus();
    asFilesBus(bus).useSoundFiles({ base: '/audio/chibi/', events: { tap: 'tap' } });
    bus.unlock();
    bus.play('tap');
    await flush();
    asFilesBus(bus).useSoundFiles({ base: '/audio/chibi/', events: { tap: 'tap2' } });
    rejectFetch!(new Error('down'));
    fetchMock.mockImplementation(async () => okResponse());
    await flush();
    const inner = internals(bus);
    expect(inner.failed.size, 'a stale failure marks nothing').toBe(0);
    expect(inner.loading.size).toBe(0);
    bus.play('tap'); // the new mapping must still be loadable
    await flush();
    expect(fetchUrls()).toEqual(['/audio/chibi/tap.ogg', '/audio/chibi/tap2.ogg']);
    bus.play('tap');
    await flush();
    expect(gameSourceStarts(), 'the new file plays after the stale failure').toBe(1);
  });

  it('E3: a stale decode failure after an entry change marks no failure', async () => {
    let resolveDecode: ((buffer: FakeBuffer) => void) | null = null;
    let rejectDecode: ((error: Error) => void) | null = null;
    FakeAudioContext.decodeImpl = () =>
      new Promise<FakeBuffer>((resolve, reject) => {
        resolveDecode = resolve;
        rejectDecode = reject;
      });
    const bus = new AudioBus();
    asFilesBus(bus).useSoundFiles({ base: '/audio/chibi/', events: { tap: 'tap' } });
    bus.unlock();
    bus.play('tap');
    await flush();
    expect(FakeAudioContext.instances[0]!.decodes, 'the old load reached the decode').toBe(1);
    asFilesBus(bus).useSoundFiles({ base: '/audio/chibi/', events: { tap: 'tap2' } });
    rejectDecode!(new Error('bad audio'));
    FakeAudioContext.decodeImpl = null;
    await flush();
    const inner = internals(bus);
    expect(inner.failed.size, 'a stale decode failure marks nothing').toBe(0);
    expect(inner.buffers.size).toBe(0);
    bus.play('tap'); // synth now, and the new file is fetched exactly once
    await flush();
    expect(fetchUrls()).toEqual(['/audio/chibi/tap.ogg', '/audio/chibi/tap2.ogg']);
    bus.play('tap');
    await flush();
    expect(gameSourceStarts(), 'the new file plays after the stale decode failure').toBe(1);
    expect(resolveDecode, 'harness kept both decode controls').not.toBeNull();
  });

  it('E4: a remap storm with an in-flight load grows no state and starts no retry', async () => {
    let resolveFetch: ((value: unknown) => void) | null = null;
    fetchMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
    );
    const bus = new AudioBus();
    const inner = internals(bus);
    asFilesBus(bus).useSoundFiles({ base: '/audio/chibi/', events: { tap: 'tap' } });
    bus.unlock();
    bus.play('tap');
    await flush();
    // 61 remaps, no plays: a remap must never start a fetch or pile up state.
    // The odd count leaves the event on 'tap2', so the original in-flight load ends stale.
    for (let i = 0; i < 61; i += 1) {
      asFilesBus(bus).useSoundFiles({
        base: '/audio/chibi/',
        events: { tap: i % 2 === 0 ? 'tap2' : 'tap' },
      });
    }
    expect(fetchMock, 'remaps alone never refetch').toHaveBeenCalledTimes(1);
    expect(inner.buffers.size, 'no buffer accumulates across the storm').toBe(0);
    expect(inner.pendingDecode.size, 'no bytes accumulate across the storm').toBe(0);
    expect(inner.loading.size, 'no loading marker survives its invalidation').toBe(0);
    expect(inner.failed.size).toBe(0);
    resolveFetch!(okResponse());
    fetchMock.mockImplementation(async () => okResponse());
    await flush();
    expect(inner.buffers.size, 'the dropped stale completion installed nothing').toBe(0);
    bus.play('tap'); // 61st remap left tap on 'tap2'
    await flush();
    expect(fetchUrls(), 'exactly one fetch follows the storm').toEqual([
      '/audio/chibi/tap.ogg',
      '/audio/chibi/tap2.ogg',
    ]);
    bus.play('tap');
    await flush();
    expect(gameSourceStarts(), 'the new file plays with no loop').toBe(1);
    expect(inner.buffers.size).toBe(1);
    expect(inner.loading.size).toBe(0);
  });

  it('E5: preload bytes bound to their URL decode to nothing after a pre-unlock remap', async () => {
    const bus = new AudioBus();
    asFilesBus(bus).useSoundFiles({ base: '/audio/chibi/', events: { tap: 'tap' } });
    asFilesBus(bus).preload(['tap']); // fetch resolves with no context: bytes wait in pendingDecode
    await flush();
    const inner = internals(bus);
    expect(inner.pendingDecode.size, 'the preload bytes wait for the first unlock').toBe(1);
    expect(inner.pendingDecode.get('tap')!.url).toBe('/audio/chibi/tap.ogg');
    asFilesBus(bus).useSoundFiles({ base: '/audio/chibi/', events: { tap: 'tap2' } });
    expect(inner.pendingDecode.size, 'the remap frees the stale bytes').toBe(0);
    bus.unlock();
    await flush();
    expect(FakeAudioContext.instances[0]!.decodes, 'no stale decode runs at unlock').toBe(0);
    bus.play('tap');
    await flush();
    bus.play('tap');
    await flush();
    expect(fetchUrls(), 'the play fetches the current file once').toEqual([
      '/audio/chibi/tap.ogg',
      '/audio/chibi/tap2.ogg',
    ]);
    expect(gameSourceStarts(), 'the current file plays').toBe(1);
    // Regression: without a remap, preloaded bytes decode at unlock and play with no refetch.
    fetchMock.mockReset();
    fetchMock.mockImplementation(async () => okResponse());
    decodedBuffers.length = 0;
    const bus2 = new AudioBus();
    asFilesBus(bus2).useSoundFiles({ base: '/audio/chibi/', events: { tap: 'tap' } });
    asFilesBus(bus2).preload(['tap']);
    await flush();
    bus2.unlock();
    await flush();
    expect(FakeAudioContext.instances[1]!.decodes, 'current preloaded bytes decode at unlock').toBe(1);
    bus2.play('tap');
    await flush();
    expect(gameSourceStarts(), 'the preloaded file plays with no new fetch').toBe(1);
    expect(fetchUrls(), 'one fetch total').toEqual(['/audio/chibi/tap.ogg']);
  });

  it('E6: dispose releases the URL-bound pendingDecode bytes and everything else', async () => {
    const bus = new AudioBus();
    const inner = internals(bus);
    asFilesBus(bus).useSoundFiles({ base: '/audio/chibi/', events: { tap: 'tap' } });
    asFilesBus(bus).preload(['tap']);
    await flush();
    expect(inner.pendingDecode.size).toBe(1);
    bus.dispose();
    expect(inner.pendingDecode.size, 'dispose releases the waiting bytes').toBe(0);
    expect(inner.buffers.size).toBe(0);
    expect(inner.loading.size).toBe(0);
    expect(inner.failed.size).toBe(0);
    bus.unlock(); // a fresh context: the disposed bus holds nothing to decode
    await flush();
    expect(FakeAudioContext.instances[0]!.decodes, 'no decode waits after dispose').toBe(0);
    bus.play('tap');
    await flush();
    expect(fetchUrls(), 'the preload and the play each fetch cleanly').toEqual([
      '/audio/chibi/tap.ogg',
      '/audio/chibi/tap.ogg',
    ]);
  });

  it('E7: an unchanged event keeps its buffer through a storm that remaps other events', async () => {
    const bus = new AudioBus();
    const inner = internals(bus);
    asFilesBus(bus).useSoundFiles({
      base: '/audio/chibi/',
      events: { tap: 'tap', correct: 'right' },
    });
    bus.unlock();
    bus.play('tap');
    await flush();
    bus.play('tap');
    await flush();
    expect(gameSourceStarts()).toBe(1);
    for (let i = 0; i < 30; i += 1) {
      asFilesBus(bus).useSoundFiles({
        base: '/audio/chibi/',
        events: { tap: 'tap', correct: i % 2 === 0 ? 'right2' : 'right' },
      });
    }
    bus.play('tap');
    await flush();
    expect(fetchUrls(), 'the untouched event never refetches').toEqual(['/audio/chibi/tap.ogg']);
    expect(gameSourceStarts(), 'the untouched event keeps playing its file').toBe(2);
    expect(inner.buffers.size).toBe(1);
    expect(inner.failed.size).toBe(0);
  });
});
