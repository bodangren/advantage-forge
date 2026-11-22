import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AudioBus } from '../../src/apk3d/audio/bus.js';

// Covers spec AC4 with a fake window.AudioContext and a fake fetch. No audio device, no network.
// The ten cases call useSoundFiles or preload, so each one fails on that call while the API is
// absent, and none fails on a parse error.

const OGG_TYPE = 'audio/ogg; codecs="vorbis"';
const MPEG_TYPE = 'audio/mpeg';
const BASE = '/audio/chibi/';
const ENTRY = 'right';
const OGG_URL = `${BASE}${ENTRY}.ogg`;
const MP3_URL = `${BASE}${ENTRY}.mp3`;

interface FilesMap {
  base: string;
  events: Record<string, string>;
}

interface BusWithFiles {
  useSoundFiles(files: FilesMap | null): void;
  preload(events: string[]): void;
}

const asFilesBus = (bus: AudioBus): BusWithFiles => bus as unknown as BusWithFiles;

const filesMap = (): FilesMap => ({ base: BASE, events: { correct: ENTRY } });

class FakeParam {
  calls: { method: string; args: unknown[] }[] = [];
  value = 0;
  setValueAtTime(...args: unknown[]) {
    this.calls.push({ method: 'setValueAtTime', args });
  }
  exponentialRampToValueAtTime(...args: unknown[]) {
    this.calls.push({ method: 'exponentialRampToValueAtTime', args });
  }
  setTargetAtTime(...args: unknown[]) {
    this.calls.push({ method: 'setTargetAtTime', args });
  }
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
  stops = 0;
  start() {
    this.starts += 1;
  }
  stop() {
    this.stops += 1;
  }
}

class FakeGain extends FakeNode {
  gain = new FakeParam();
}

class FakeBuffer {
  duration = 0.1;
  getChannelData(_channel: number): Float32Array {
    return new Float32Array(8);
  }
}

class FakeBufferSource extends FakeNode {
  buffer: FakeBuffer | null = null;
  starts = 0;
  stops = 0;
  start() {
    this.starts += 1;
  }
  stop() {
    this.stops += 1;
  }
}

class FakeFilter extends FakeNode {
  type = 'lowpass';
  frequency = new FakeParam();
}

type DecodeImpl = (data: ArrayBuffer) => Promise<FakeBuffer>;

class FakeAudioContext {
  static instances: FakeAudioContext[] = [];
  state = 'running';
  currentTime = 0;
  sampleRate = 48000;
  destination = {};
  oscillators: FakeOscillator[] = [];
  gains: FakeGain[] = [];
  sources: FakeBufferSource[] = [];
  decodes = 0;
  resumes = 0;
  suspends = 0;
  closes = 0;
  decodeImpl: DecodeImpl = async () => new FakeBuffer();
  constructor() {
    FakeAudioContext.instances.push(this);
  }
  createOscillator() {
    const node = new FakeOscillator();
    this.oscillators.push(node);
    return node;
  }
  createGain() {
    const node = new FakeGain();
    this.gains.push(node);
    return node;
  }
  createBufferSource() {
    const node = new FakeBufferSource();
    this.sources.push(node);
    return node;
  }
  createBuffer() {
    return new FakeBuffer();
  }
  createBiquadFilter() {
    return new FakeFilter();
  }
  async decodeAudioData(data: ArrayBuffer): Promise<FakeBuffer> {
    this.decodes += 1;
    return this.decodeImpl(data);
  }
  async resume() {
    this.resumes += 1;
  }
  async suspend() {
    this.suspends += 1;
  }
  async close() {
    this.closes += 1;
  }
}

const audioQueries: string[] = [];
let audioConstructions = 0;
let oggAnswer = '';
let mp3Answer = '';

class FakeAudio {
  constructor() {
    audioConstructions += 1;
  }
  canPlayType(type: string): string {
    audioQueries.push(type);
    if (type === OGG_TYPE) return oggAnswer;
    if (type === MPEG_TYPE) return mp3Answer;
    return '';
  }
}

const fetchMock = vi.fn();
let fetchImpl: (url: string) => Promise<unknown> = async () => ({
  ok: true,
  status: 200,
  arrayBuffer: async () => new ArrayBuffer(8),
});

const savedDescriptors: Record<string, PropertyDescriptor | undefined> = {};
const GLOBAL_KEYS = ['window', 'navigator', 'Audio', 'fetch'] as const;

function defineGlobal(key: string, value: unknown) {
  // Assignment fails for getter-only globals such as Node's navigator, so define the property.
  Object.defineProperty(globalThis, key, {
    value,
    writable: true,
    configurable: true,
    enumerable: false,
  });
}

function installHarness() {
  for (const key of GLOBAL_KEYS) {
    savedDescriptors[key] = Object.getOwnPropertyDescriptor(globalThis, key);
  }
  defineGlobal('window', {
    AudioContext: FakeAudioContext,
    webkitAudioContext: undefined,
    setInterval,
    clearInterval,
  });
  defineGlobal('navigator', { audioSession: { type: 'playback' } });
  defineGlobal('Audio', FakeAudio);
  defineGlobal('fetch', fetchMock);
}

function restoreHarness() {
  for (const key of GLOBAL_KEYS) {
    const descriptor = savedDescriptors[key];
    if (descriptor === undefined) delete (globalThis as Record<string, unknown>)[key];
    else Object.defineProperty(globalThis, key, descriptor);
  }
}

beforeEach(() => {
  FakeAudioContext.instances = [];
  audioQueries.length = 0;
  audioConstructions = 0;
  oggAnswer = '';
  mp3Answer = '';
  fetchImpl = async () => ({
    ok: true,
    status: 200,
    arrayBuffer: async () => new ArrayBuffer(8),
  });
  fetchMock.mockReset();
  fetchMock.mockImplementation((url: string) => fetchImpl(url));
  installHarness();
  return restoreHarness;
});

const flush = async () => {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
};

const oscStarts = () => FakeAudioContext.instances.reduce((sum, ctx) => sum + ctx.oscillators.length, 0);
const sourceStarts = () =>
  FakeAudioContext.instances.reduce((sum, ctx) => sum + ctx.sources.reduce((n, s) => n + s.starts, 0), 0);
const sourceStops = () =>
  FakeAudioContext.instances.reduce((sum, ctx) => sum + ctx.sources.reduce((n, s) => n + s.stops, 0), 0);
const decodeCalls = () => FakeAudioContext.instances.reduce((sum, ctx) => sum + ctx.decodes, 0);
const fetchUrls = (): string[] => fetchMock.mock.calls.map((call) => call[0] as string);

describe('AudioBus file playback', () => {
  it('picks the ogg file when canPlayType answers probably for ogg', async () => {
    oggAnswer = 'probably';
    mp3Answer = '';
    const bus = new AudioBus();
    asFilesBus(bus).useSoundFiles(filesMap());
    bus.unlock();
    bus.unlock();
    expect(audioConstructions).toBe(2);
    expect(audioQueries).toEqual([OGG_TYPE, MPEG_TYPE]);
    await bus.play('correct');
    await flush();
    expect(fetchUrls()).toEqual([OGG_URL]);
  });

  it('picks the mp3 file when ogg is empty and mp3 answers maybe', async () => {
    oggAnswer = '';
    mp3Answer = 'maybe';
    const bus = new AudioBus();
    asFilesBus(bus).useSoundFiles(filesMap());
    bus.unlock();
    expect(audioConstructions).toBe(2);
    expect(audioQueries).toEqual([OGG_TYPE, MPEG_TYPE]);
    await bus.play('correct');
    await flush();
    expect(fetchUrls()).toEqual([MP3_URL]);
  });

  it('runs the synth recipe and starts no fetch when both answers are empty', async () => {
    oggAnswer = '';
    mp3Answer = '';
    const bus = new AudioBus();
    asFilesBus(bus).useSoundFiles(filesMap());
    bus.unlock();
    await bus.play('correct');
    await flush();
    expect(fetchMock).toHaveBeenCalledTimes(0);
    expect(decodeCalls()).toBe(0);
    expect(oscStarts()).toBeGreaterThan(0);
  });

  it('runs the synth recipe and starts one fetch on the first mapped play', async () => {
    oggAnswer = 'probably';
    const bus = new AudioBus();
    asFilesBus(bus).useSoundFiles(filesMap());
    bus.unlock();
    await bus.play('correct');
    await flush();
    expect(oscStarts()).toBeGreaterThan(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchUrls()).toEqual([OGG_URL]);
  });

  it('starts one buffer source and no synth recipe once the buffer is decoded', async () => {
    oggAnswer = 'probably';
    const bus = new AudioBus();
    asFilesBus(bus).useSoundFiles(filesMap());
    bus.unlock();
    await bus.play('correct');
    await flush();
    const afterFirst = oscStarts();
    expect(afterFirst).toBeGreaterThan(0);
    await bus.play('correct');
    await flush();
    expect(oscStarts()).toBe(afterFirst);
    expect(sourceStarts()).toBe(1);
  });

  it('starts one fetch for three plays of the same event', async () => {
    oggAnswer = 'probably';
    const bus = new AudioBus();
    asFilesBus(bus).useSoundFiles(filesMap());
    bus.unlock();
    await bus.play('correct');
    await bus.play('correct');
    await bus.play('correct');
    await flush();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(decodeCalls()).toBe(1);
  });

  it('marks the event after a rejected fetch, a non-ok status, or a rejected decode', async () => {
    oggAnswer = 'probably';
    const modes = ['rejected-fetch', 'non-ok', 'rejected-decode'] as const;
    for (const mode of modes) {
      fetchMock.mockClear();
      FakeAudioContext.instances = [];
      if (mode === 'rejected-fetch') fetchImpl = async () => Promise.reject(new Error('down'));
      if (mode === 'non-ok') fetchImpl = async () => ({ ok: false, status: 404 });
      const bus = new AudioBus();
      asFilesBus(bus).useSoundFiles(filesMap());
      bus.unlock();
      const ctx = FakeAudioContext.instances[0]!;
      if (mode === 'rejected-decode') ctx.decodeImpl = async () => Promise.reject(new Error('bad'));
      await bus.play('correct');
      await flush();
      await bus.play('correct');
      await flush();
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(oscStarts()).toBeGreaterThan(0);
    }
  });

  it('preloads without playing any sound', async () => {
    oggAnswer = 'probably';
    const bus = new AudioBus();
    asFilesBus(bus).useSoundFiles(filesMap());
    bus.unlock();
    asFilesBus(bus).preload(['correct']);
    await flush();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchUrls()).toEqual([OGG_URL]);
    expect(decodeCalls()).toBe(1);
    expect(sourceStarts()).toBe(0);
    expect(oscStarts()).toBe(0);
  });

  it('runs the synth recipe with no fetch for an event without a mapping', async () => {
    oggAnswer = 'probably';
    const bus = new AudioBus();
    asFilesBus(bus).useSoundFiles(filesMap());
    bus.unlock();
    await bus.play('hit');
    await flush();
    expect(fetchMock).toHaveBeenCalledTimes(0);
    expect(oscStarts()).toBeGreaterThan(0);
    asFilesBus(bus).useSoundFiles(null);
    await bus.play('correct');
    await flush();
    expect(fetchMock).toHaveBeenCalledTimes(0);
    expect(oscStarts()).toBeGreaterThan(0);
  });

  it('stops each playing buffer and closes the context on dispose', async () => {
    oggAnswer = 'probably';
    const bus = new AudioBus();
    asFilesBus(bus).useSoundFiles(filesMap());
    bus.unlock();
    await bus.play('correct');
    await flush();
    await bus.play('correct');
    await flush();
    expect(sourceStarts()).toBe(1);
    bus.dispose();
    expect(sourceStops()).toBe(1);
    expect(FakeAudioContext.instances[0]!.closes).toBe(1);
  });
});
