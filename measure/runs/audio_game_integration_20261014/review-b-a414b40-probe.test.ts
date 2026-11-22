// Review B round 6 security probe for Phase 3 (audit head a414b406).
// Run: node node_modules/vitest/vitest.mjs run --config measure/runs/audio_game_integration_20261014/review-b-a414b40-vitest.config.mjs
// Closure checks for the round-5 F1: the T6k local hasOwn helper must run with Object.hasOwn
// deleted, survive a map whose own key is hasOwnProperty or whose prototype is null, and the
// isCurrent own-guard must drop a completion whose remap left the event with only an inherited
// entry of equal value.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AudioBus } from '../../../src/apk3d/audio/bus.js';
import { chibiPreload, wireChibiSounds } from '../../../src/apk3d/audio/chibi.js';

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
  onended: unknown = null;
  start(): void {
    this.starts += 1;
  }
  stop(): void {}
}

class FakeFilter extends FakeNode {
  type = 'lowpass';
  frequency = new FakeParam();
}

const decodedBuffers: FakeBuffer[] = [];

class FakeAudioContext {
  static instances: FakeAudioContext[] = [];
  state: string = 'running';
  currentTime = 0;
  sampleRate = 48000;
  destination = {};
  oscillators: FakeOscillator[] = [];
  sources: FakeBufferSource[] = [];
  decodes = 0;
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
  async resume(): Promise<void> {}
  async suspend(): Promise<void> {}
  async close(): Promise<void> {
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

const okResponse = () => ({
  ok: true,
  status: 200,
  arrayBuffer: async () => new ArrayBuffer(8),
});

beforeEach(() => {
  FakeAudioContext.instances = [];
  decodedBuffers.length = 0;
  fetchMock.mockReset();
  fetchMock.mockImplementation(async () => okResponse());
  installHarness();
  return restoreHarness;
});

// iOS 15.0-15.3 and Chrome WebView 80-92 lack this static method; the probe deletes it
// the same way the committed compatibility pins do.
function withoutNativeHasOwn<T>(operation: () => T): T {
  const descriptor = Object.getOwnPropertyDescriptor(Object, 'hasOwn')!;
  Reflect.deleteProperty(Object, 'hasOwn');
  try {
    return operation();
  } finally {
    Object.defineProperty(Object, 'hasOwn', descriptor);
  }
}

describe('Review B probe round 6: F1 closure (T6k local hasOwn helper)', () => {
  it('H1: wiring, preload, and play run with Object.hasOwn deleted', async () => {
    const bus = new AudioBus();
    const wired = withoutNativeHasOwn(() =>
      wireChibiSounds(bus, '/demo/', ['tap', 'constructor', 'toString']),
    );
    expect(wired).toBe(true);
    bus.unlock();
    await flush();
    expect(fetchUrls()).toEqual(['/demo/audio/chibi/tap.ogg']);
    bus.play('tap');
    await flush();
    bus.play('tap');
    await flush();
    expect(gameStarts(), 'each play starts the decoded file').toBe(2);
    // Direct bus preload and play with the static method still absent.
    const bus2 = new AudioBus();
    withoutNativeHasOwn(() => asFilesBus(bus2).useSoundFiles({ base: '/a/', events: { hit: 'hit' } }));
    withoutNativeHasOwn(() => asFilesBus(bus2).preload(['hit']));
    withoutNativeHasOwn(() => bus2.unlock());
    await flush();
    withoutNativeHasOwn(() => bus2.play('hit'));
    await flush();
    expect(fetchUrls(), 'no request throws without the static method').toContain('/a/hit.ogg');
  });

  it('H2: a map with an own hasOwnProperty key and a null-prototype map both work', async () => {
    const bus = new AudioBus();
    asFilesBus(bus).useSoundFiles({
      base: '/a/',
      events: { hasOwnProperty: 'right' },
    });
    bus.unlock();
    bus.play('hasOwnProperty');
    await flush();
    bus.play('hasOwnProperty');
    await flush();
    expect(fetchUrls(), 'an own hasOwnProperty key maps normally').toEqual(['/a/right.ogg']);
    const bus2 = new AudioBus();
    const nullProto = Object.assign(Object.create(null), { tap: 'tap' }) as Record<string, string>;
    asFilesBus(bus2).useSoundFiles({ base: '/b/', events: nullProto });
    bus2.unlock();
    bus2.play('tap');
    await flush();
    bus2.play('tap');
    await flush();
    expect(fetchUrls(), 'a null-prototype map works').toContain('/b/tap.ogg');
    expect(oscStarts()).toBeGreaterThan(0);
  });

  it('H3: a remap that leaves only an inherited equal entry drops the in-flight completion', async () => {
    let resolveFetch: ((value: unknown) => void) | null = null;
    fetchMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
    );
    const bus = new AudioBus();
    const inner = internals(bus);
    asFilesBus(bus).useSoundFiles({ base: '/a/', events: { tap: 'tap' } });
    bus.unlock();
    bus.play('tap'); // load starts for /a/tap.ogg
    await flush();
    // Same key and value, but now inherited through the prototype: not a mapping.
    const inherited = Object.assign(Object.create({ tap: 'tap' }), {}) as Record<string, string>;
    asFilesBus(bus).useSoundFiles({ base: '/a/', events: inherited });
    resolveFetch!(okResponse());
    fetchMock.mockImplementation(async () => okResponse());
    await flush();
    expect(inner.buffers.size, 'an inherited equal entry installs no buffer').toBe(0);
    expect(inner.failed.size).toBe(0);
    expect(inner.loading.size).toBe(0);
    bus.play('tap'); // unmapped: synth recipe, and no fetch starts
    await flush();
    expect(fetchMock, 'the inherited event starts no fetch').toHaveBeenCalledTimes(1);
    expect(oscStarts(), 'the inherited event falls back to synth').toBeGreaterThan(0);
  });
});

const gameStarts = (): number =>
  FakeAudioContext.instances
    .flatMap((ctx) => ctx.sources.filter((s) => decodedBuffers.includes(s.buffer as FakeBuffer)))
    .reduce((sum, s) => sum + s.starts, 0);
