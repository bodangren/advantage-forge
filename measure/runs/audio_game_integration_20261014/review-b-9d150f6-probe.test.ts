// Review B round 3 security probe for Phase 3 (audit head 9d150f62).
// Run: node node_modules/vitest/vitest.mjs run --config measure/runs/audio_game_integration_20261014/review-b-9d150f6-vitest.config.mjs
// Carries the round-2 harness and adds delta cases for the b000b91e..9d150f62 change:
// per-event invalidation in useSoundFiles (F1), the try/catch unlock pulse (F2),
// the late-decode storage guard in decodeData, and bounded state across map swaps.
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

const okResponse = () => ({
  ok: true,
  status: 200,
  arrayBuffer: async () => new ArrayBuffer(8),
});

beforeEach(() => {
  FakeAudioContext.instances = [];
  FakeAudioContext.throwOnCreateBuffer = false;
  decodedBuffers.length = 0;
  fetchMock.mockReset();
  fetchMock.mockImplementation(async () => okResponse());
  installHarness();
  return restoreHarness;
});

describe('Review B probe round 3: delta b000b91e..9d150f62 security', () => {
  it('D1: useSoundFiles(null) after a decode clears the stale buffer (F1 fix)', async () => {
    const bus = new AudioBus();
    asFilesBus(bus).useSoundFiles({ base: '/audio/chibi/', events: { tap: 'tap' } });
    bus.unlock();
    bus.play('tap');
    await flush();
    expect(gameSourceStarts()).toBe(0); // first play ran the synth and started the fetch
    bus.play('tap');
    await flush();
    expect(gameSourceStarts()).toBe(1); // decoded buffer now plays
    asFilesBus(bus).useSoundFiles(null);
    bus.play('tap');
    await flush();
    expect(gameSourceStarts(), 'a cleared event must not play its stale file').toBe(1);
    expect(oscStarts(), 'a cleared event falls back to the synth recipe').toBeGreaterThan(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('D2: a swap to a map without the event clears the buffer and starts no fetch', async () => {
    const bus = new AudioBus();
    asFilesBus(bus).useSoundFiles({ base: '/audio/chibi/', events: { tap: 'tap' } });
    bus.unlock();
    bus.play('tap');
    await flush();
    bus.play('tap');
    await flush();
    expect(gameSourceStarts()).toBe(1);
    asFilesBus(bus).useSoundFiles({ base: '/audio/chibi/', events: { correct: 'right' } });
    bus.play('tap');
    await flush();
    expect(gameSourceStarts(), 'an unmapped event must not play its stale file').toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('D3: alternating swaps never retry a failed event and keep one fetch per entry', async () => {
    fetchMock.mockImplementation(async () => ({ ok: false, status: 404 }));
    const bus = new AudioBus();
    const mapA = { base: '/audio/chibi/', events: { tap: 'tap' } };
    const mapB = { base: '/audio/chibi/', events: { tap: 'tap2' } };
    asFilesBus(bus).useSoundFiles(mapA);
    bus.unlock();
    bus.play('tap'); // fails, marked
    await flush();
    for (let i = 0; i < 6; i += 1) {
      asFilesBus(bus).useSoundFiles(i % 2 === 0 ? mapB : mapA);
      bus.play('tap');
      await flush();
    }
    expect(fetchMock, 'a failed event is not retried across swaps').toHaveBeenCalledTimes(1);
    expect(oscStarts()).toBeGreaterThan(0);
  });

  it('D4: a decode that lands after its mapping vanished stores no buffer', async () => {
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
    asFilesBus(bus).useSoundFiles({ base: '/audio/chibi/', events: { correct: 'right' } });
    resolveFetch!(okResponse());
    await flush();
    bus.play('tap'); // unmapped: synth, and the vanished event starts no fetch
    await flush();
    expect(gameSourceStarts()).toBe(0);
    expect(fetchUrls()).toEqual(['/audio/chibi/tap.ogg']); // only the original fetch
  });

  it('D5: a late fetch after dispose decodes nowhere and stores nothing playable', async () => {
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
    const ctx = FakeAudioContext.instances[0]!;
    bus.dispose();
    resolveFetch!(okResponse());
    await flush();
    expect(ctx.decodes, 'the closed context takes no decode').toBe(0);
    expect(gameSourceStarts()).toBe(0);
  });

  it('D6: a throwing pulse never blocks resume or leaves the context unusable (F2 fix)', async () => {
    FakeAudioContext.throwOnCreateBuffer = true;
    const bus = new AudioBus();
    asFilesBus(bus).useSoundFiles({ base: '/audio/chibi/', events: { tap: 'tap' } });
    expect(() => bus.unlock()).not.toThrow();
    const ctx = FakeAudioContext.instances[0]!;
    expect(ctx.resumes).toBe(1);
    // The bus stays usable: a play runs the synth recipe through the master gain.
    expect(() => bus.play('tap')).not.toThrow();
    expect(oscStarts()).toBeGreaterThan(0);
  });

  it('D7: wiring one equal map twice still fetches once (unchanged events keep state)', async () => {
    const bus = new AudioBus();
    const map = { base: '/audio/chibi/', events: { tap: 'tap' } };
    asFilesBus(bus).useSoundFiles(map);
    bus.unlock();
    bus.play('tap');
    await flush();
    asFilesBus(bus).useSoundFiles(map);
    bus.play('tap');
    await flush();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(gameSourceStarts()).toBe(1);
  });

  it('D8: a changed entry refetches once on the next play and does not loop', async () => {
    const bus = new AudioBus();
    asFilesBus(bus).useSoundFiles({ base: '/audio/chibi/', events: { tap: 'tap' } });
    bus.unlock();
    bus.play('tap');
    await flush();
    bus.play('tap');
    await flush();
    expect(gameSourceStarts()).toBe(1);
    asFilesBus(bus).useSoundFiles({ base: '/audio/chibi/', events: { tap: 'tap2' } });
    bus.play('tap');
    await flush();
    bus.play('tap');
    await flush();
    expect(fetchUrls()).toEqual(['/audio/chibi/tap.ogg', '/audio/chibi/tap2.ogg']);
    expect(gameSourceStarts()).toBe(2);
  });
});
