// Review B round 2 security probe for Phase 3 (audit head b000b91e).
// Run: node node_modules/vitest/vitest.mjs run --config measure/runs/audio_game_integration_20261014/review-b-b000b91-vitest.config.mjs
// Carries every case of the 13c7b85c probe and adds: the unlock pulse is bounded
// to one source per context and untracked by dispose, and unlock stays non-throwing
// on the suspended and closed-context paths. S6 now counts game sources only,
// because the unlock pulse owns a silent source in the same fake context.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
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
  state: string = 'running';
  currentTime = 0;
  sampleRate = 48000;
  destination = {};
  oscillators: FakeOscillator[] = [];
  sources: FakeBufferSource[] = [];
  decodes = 0;
  decodeReject = false;
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
    return new FakeBuffer();
  }
  createBiquadFilter(): FakeFilter {
    return new FakeFilter();
  }
  async decodeAudioData(): Promise<FakeBuffer> {
    this.decodes += 1;
    if (this.decodeReject) throw new Error('bad decode');
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
// A game source plays a decoded file. The unlock pulse owns a silent source, so it never counts.
const gameSources = (): FakeBufferSource[] =>
  FakeAudioContext.instances.flatMap((ctx) =>
    ctx.sources.filter((s) => decodedBuffers.includes(s.buffer as FakeBuffer)),
  );
const pulseSources = (): FakeBufferSource[] =>
  FakeAudioContext.instances.flatMap((ctx) =>
    ctx.sources.filter(
      (s) => s.starts > 0 && s.buffer !== null && !decodedBuffers.includes(s.buffer as FakeBuffer),
    ),
  );

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

describe('Review B probe round 2: AudioBus file playback security', () => {
  it('S1: event names with URL metacharacters never reach a fetch URL', async () => {
    const bus = new AudioBus();
    asFilesBus(bus).useSoundFiles({ base: '/demo/audio/chibi/', events: { tap: 'tap' } });
    bus.unlock();
    bus.play('tap');
    await flush();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    for (const hostile of [
      '../admin',
      '..%2f..%2fadmin',
      '?query=1',
      '#frag',
      'https://evil.example/x',
      "a' OR '1'='1",
      'a\nb',
      'tap\x00.ogg',
    ]) {
      bus.play(hostile);
      asFilesBus(bus).preload([hostile]);
    }
    await flush();
    expect(fetchUrls()).toEqual(['/demo/audio/chibi/tap.ogg']);
  });

  it('S2: entry values flow verbatim into the URL (caller-trust boundary)', async () => {
    const bus = new AudioBus();
    asFilesBus(bus).useSoundFiles({ base: '/demo/audio/chibi/', events: { x: '../../admin' } });
    bus.unlock();
    asFilesBus(bus).preload(['x']);
    await flush();
    expect(fetchUrls()).toEqual(['/demo/audio/chibi/../../admin.ogg']);
  });

  it('S2b: an absolute or protocol-relative base is not restricted by the bus', async () => {
    const absolute = new AudioBus();
    asFilesBus(absolute).useSoundFiles({ base: 'https://evil.example/a/', events: { tap: 'tap' } });
    absolute.unlock();
    asFilesBus(absolute).preload(['tap']);
    await flush();
    expect(fetchUrls()).toEqual(['https://evil.example/a/tap.ogg']);

    fetchMock.mockClear();
    const protoRel = new AudioBus();
    asFilesBus(protoRel).useSoundFiles({ base: '//evil.example/b/', events: { tap: 'tap' } });
    protoRel.unlock();
    asFilesBus(protoRel).preload(['tap']);
    await flush();
    expect(fetchUrls()).toEqual(['//evil.example/b/tap.ogg']);
  });

  it('S3: a failing event is tried exactly once under a play burst', async () => {
    fetchMock.mockImplementation(async () => ({ ok: false, status: 500 }));
    const bus = new AudioBus();
    asFilesBus(bus).useSoundFiles({ base: '/audio/chibi/', events: { tap: 'tap' } });
    bus.unlock();
    for (let i = 0; i < 10; i += 1) bus.play('tap');
    asFilesBus(bus).preload(['tap', 'tap', 'tap']);
    await flush();
    for (let i = 0; i < 5; i += 1) bus.play('tap');
    await flush();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(oscStarts()).toBeGreaterThan(0);
  });

  it('S4: dispose before the first unlock clears pending decodes', async () => {
    const bus = new AudioBus();
    asFilesBus(bus).useSoundFiles({ base: '/audio/chibi/', events: { tap: 'tap' } });
    asFilesBus(bus).preload(['tap']);
    await flush();
    bus.dispose();
    bus.unlock();
    await flush();
    expect(FakeAudioContext.instances[0]!.decodes).toBe(0);
    // A disposed bus re-fetches on a later unlock: dispose clears the caches by design.
    bus.play('tap');
    await flush();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(FakeAudioContext.instances[0]!.decodes).toBe(1);
  });

  it('S5: no failure mode throws into the game loop', async () => {
    const modes: Record<string, unknown> = {
      reject: async () => Promise.reject(new Error('down')),
      nonOk: async () => ({ ok: false, status: 404 }),
      badBuffer: async () => ({
        ok: true,
        status: 200,
        arrayBuffer: async () => Promise.reject(new Error('bad')),
      }),
      malformed: async () => ({ noOk: true }),
    };
    for (const [mode, impl] of Object.entries(modes)) {
      fetchMock.mockReset();
      fetchMock.mockImplementation(impl as () => Promise<unknown>);
      FakeAudioContext.instances = [];
      decodedBuffers.length = 0;
      const bus = new AudioBus();
      asFilesBus(bus).useSoundFiles({ base: '/audio/chibi/', events: { tap: 'tap' } });
      bus.unlock();
      expect(() => bus.play('tap')).not.toThrow();
      expect(() => asFilesBus(bus).preload(['tap'])).not.toThrow();
      await flush();
      bus.play('tap');
      await flush();
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(oscStarts(), `mode ${mode} falls back to synth`).toBeGreaterThan(0);
    }
    fetchMock.mockReset();
    fetchMock.mockImplementation(async () => okResponse());
    FakeAudioContext.instances = [];
    decodedBuffers.length = 0;
    const bus = new AudioBus();
    asFilesBus(bus).useSoundFiles({ base: '/audio/chibi/', events: { tap: 'tap' } });
    bus.unlock();
    FakeAudioContext.instances[0]!.decodeReject = true;
    bus.play('tap');
    await flush();
    bus.play('tap');
    await flush();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(oscStarts()).toBeGreaterThan(0);
  });

  it('S6: ended game sources are untracked, and dispose stops the live ones only', async () => {
    const bus = new AudioBus();
    asFilesBus(bus).useSoundFiles({ base: '/audio/chibi/', events: { tap: 'tap' } });
    bus.unlock();
    bus.play('tap');
    await flush();
    bus.play('tap');
    await flush();
    bus.play('tap');
    await flush();
    bus.play('tap');
    await flush();
    const games = gameSources();
    expect(games.length).toBe(3);
    expect(pulseSources().length).toBe(1);
    games[0]!.end();
    bus.dispose();
    expect(games[0]!.stops).toBe(0);
    expect(games[1]!.stops).toBe(1);
    expect(games[2]!.stops).toBe(1);
  });

  it('S7: the committed generated map values are all set names', () => {
    const setNames: string[] = JSON.parse(readFileSync('sounds/sets/chibi.json', 'utf8')).sounds.map(
      (sound: { name: string }) => sound.name,
    );
    const tsv = readFileSync('docs/sound-event-map.tsv', 'utf8').trim().split('\n').slice(1);
    for (const line of tsv) {
      const [event, source] = line.split('\t');
      if (source === 'synth') continue;
      const entry = source!.replace(/^chibi\//, '');
      expect(setNames, `entry of ${event}`).toContain(entry);
      expect(entry).toMatch(/^[a-z-]+$/);
    }
  });

  it('S8: the unlock pulse is one silent source per context and stays untracked by dispose', async () => {
    const bus = new AudioBus();
    asFilesBus(bus).useSoundFiles({ base: '/audio/chibi/', events: { tap: 'tap' } });
    bus.unlock();
    bus.unlock();
    await flush();
    const pulses = pulseSources();
    expect(pulses.length).toBe(1);
    expect(FakeAudioContext.instances.length).toBe(1);
    bus.play('tap');
    await flush();
    expect(pulseSources().length).toBe(1);
    bus.dispose();
    expect(pulses[0]!.stops).toBe(0);
    bus.unlock();
    await flush();
    expect(FakeAudioContext.instances.length).toBe(2);
    expect(pulseSources().length).toBe(2);
  });

  it('S9: unlock on a suspended or closed context never throws', async () => {
    const bus = new AudioBus();
    bus.unlock();
    const ctx = FakeAudioContext.instances[0]!;
    const resumesBefore = ctx.resumes;
    bus.suspend();
    ctx.state = 'suspended';
    expect(() => bus.unlock()).not.toThrow();
    expect(ctx.resumes, 'a suspended bus does not resume').toBe(resumesBefore);
    // A context whose state reads closed takes the resume path and stays non-throwing.
    ctx.state = 'closed';
    expect(() => bus.unlock()).not.toThrow();
    bus.dispose();
    expect(() => bus.unlock()).not.toThrow();
    await flush();
    expect(FakeAudioContext.instances.length).toBe(2);
  });
});
