// Review B round 5 security probe for Phase 3 (audit head 8a088305).
// Run: node node_modules/vitest/vitest.mjs run --config measure/runs/audio_game_integration_20261014/review-b-8a08830-vitest.config.mjs
// Narrow scope for the T6i delta (1b7312f4): Object.hasOwn guards in bus.ts requestFile and
// chibi.ts chibiPreload must close the junk-URL path for inherited names (constructor,
// toString, __proto__, hasOwnProperty) in every lookup, without breaking own mappings.
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

const INHERITED = ['constructor', 'toString', 'hasOwnProperty', '__proto__', 'valueOf'];

describe('Review B probe round 5: T6i own-property guard (inherited-name junk URLs)', () => {
  it('G1: the bus builds no URL and plays synth for every inherited name', async () => {
    const bus = new AudioBus();
    asFilesBus(bus).useSoundFiles({ base: '/audio/chibi/', events: { tap: 'tap' } });
    for (const name of INHERITED) bus.defineSfx(name, (s) => s.tone(440, 0.1, 'sine', 0.1));
    bus.unlock();
    for (const name of INHERITED) bus.play(name);
    await flush();
    asFilesBus(bus).preload(INHERITED);
    await flush();
    expect(fetchMock, 'an inherited name starts no network request').not.toHaveBeenCalled();
    expect(oscStarts(), 'each inherited name falls back to its synth recipe').toBe(INHERITED.length);
    // Sanity: the mapped event still loads and plays through the same map.
    bus.play('tap');
    await flush();
    bus.play('tap');
    await flush();
    expect(fetchUrls()).toEqual(['/audio/chibi/tap.ogg']);
  });

  it('G2: chibiPreload and wireChibiSounds drop inherited names before the bus sees them', async () => {
    const bus = new AudioBus();
    for (const name of INHERITED) bus.defineSfx(name, (s) => s.tone(440, 0.1, 'sine', 0.1));
    expect(chibiPreload(['constructor', 'tap', 'toString', ...INHERITED, 'tap'])).toEqual(['tap']);
    const preloadSpy = vi.spyOn(bus, 'preload');
    expect(
      wireChibiSounds(bus, '/demo/', ['constructor', 'toString', 'hasOwnProperty', '__proto__', 'tap']),
    ).toBe(true);
    expect(preloadSpy.mock.calls).toEqual([[['tap']]]);
    bus.unlock();
    await flush();
    for (const name of INHERITED) bus.play(name);
    await flush();
    bus.play('tap');
    await flush();
    bus.play('tap');
    await flush();
    expect(fetchUrls(), 'only the mapped event ever fetches').toEqual(['/demo/audio/chibi/tap.ogg']);
    expect(oscStarts(), 'inherited names still sound their recipes').toBe(INHERITED.length);
  });

  it('G3: an own __proto__ entry from JSON stays a legitimate mapping', async () => {
    const bus = new AudioBus();
    // JSON.parse makes __proto__ an own data property; the guard must not ban own mappings.
    const map = JSON.parse('{"base":"/a/","events":{"__proto__":"tap","tap":"tap"}}') as FilesMap;
    asFilesBus(bus).useSoundFiles(map);
    bus.unlock();
    bus.play('__proto__');
    await flush();
    expect(fetchUrls(), 'an own __proto__ mapping builds its normal URL').toContain('/a/tap.ogg');
    expect(fetchUrls()).toHaveLength(1);
    bus.play('tap');
    await flush();
    bus.play('__proto__');
    await flush();
    expect(fetchUrls(), 'each own event fetches exactly once').toHaveLength(2);
  });

  it('G4: absent ordinary names still fetch nothing and keep the guard cheap', async () => {
    const bus = new AudioBus();
    bus.defineSfx('ghost', (s) => s.tone(300, 0.1, 'sine', 0.1));
    asFilesBus(bus).useSoundFiles({ base: '/audio/chibi/', events: { tap: 'tap' } });
    bus.unlock();
    bus.play('ghost');
    bus.play('missing');
    await flush();
    expect(fetchMock, 'absent names never fetched, before or after the guard').not.toHaveBeenCalled();
    expect(oscStarts()).toBe(1);
  });
});
