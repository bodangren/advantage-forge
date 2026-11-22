import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AudioBus } from '../../src/apk3d/audio/bus.js';
import { chibiSoundFiles } from '../../src/apk3d/audio/chibi.js';

// Adversarial round for Phase 3 (spec AC4). The reviews pinned the eleven main cases;
// this file attacks the edges they left open: odd canPlayType answers, lifecycle order
// (unlock before the map, play before unlock), map swaps and clears, a base without a
// trailing slash, late fetch resolution after dispose(), play during a pending decode,
// preload of unmapped and duplicate names, and the unlock pulse when createBuffer throws.
// Two cases pin real defects and stay failing until Green fixes the bus (F1, F2 in
// measure/runs/audio_game_integration_20261014/adversarial-p3-*.json).

const OGG_TYPE = 'audio/ogg; codecs="vorbis"';
const MPEG_TYPE = 'audio/mpeg';
const BASE = '/audio/chibi/';
const ENTRY = 'right';
const OGG_URL = `${BASE}${ENTRY}.ogg`;

interface FilesMap {
  base: string;
  events: Record<string, string>;
}

interface BusWithFiles {
  useSoundFiles(files: FilesMap | null): void;
  preload(events: string[]): void;
}

const asFilesBus = (bus: AudioBus): BusWithFiles => bus as unknown as BusWithFiles;

const filesMap = (events: Record<string, string> = { correct: ENTRY }): FilesMap => ({
  base: BASE,
  events,
});

class FakeParam {
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
  calls: { method: string; args: unknown[] }[] = [];
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
  start() {
    this.starts += 1;
  }
  stop() {
    // The synth recipes stop each tone; the count is not asserted.
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
  /** When true, createBuffer throws, like an older engine with a strict buffer path. */
  static throwOnCreateBuffer = false;
  state = 'running';
  currentTime = 0;
  sampleRate = 48000;
  destination = {};
  oscillators: FakeOscillator[] = [];
  gains: FakeGain[] = [];
  sources: FakeBufferSource[] = [];
  decodes = 0;
  resumes = 0;
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
    if (FakeAudioContext.throwOnCreateBuffer) throw new Error('createBuffer unsupported');
    return new FakeBuffer();
  }
  createBiquadFilter() {
    return new FakeFilter();
  }
  async decodeAudioData(data: ArrayBuffer): Promise<FakeBuffer> {
    this.decodes += 1;
    const buffer = await this.decodeImpl(data);
    decodedBuffers.push(buffer);
    return buffer;
  }
  async resume() {
    this.resumes += 1;
  }
  async suspend() {
    // Not asserted in this file.
  }
  async close() {
    this.closes += 1;
  }
}

const audioQueries: string[] = [];
let audioConstructions = 0;
let oggAnswer = '';
let mp3Answer = '';
const decodedBuffers: FakeBuffer[] = [];

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
  FakeAudioContext.throwOnCreateBuffer = false;
  decodedBuffers.length = 0;
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
const gameSourceStarts = () =>
  FakeAudioContext.instances.reduce(
    (sum, ctx) =>
      sum +
      ctx.sources.filter((s) => s.starts > 0 && s.buffer !== null && decodedBuffers.includes(s.buffer))
        .length,
    0,
  );
const decodeCalls = () => FakeAudioContext.instances.reduce((sum, ctx) => sum + ctx.decodes, 0);
const fetchUrls = (): string[] => fetchMock.mock.calls.map((call) => call[0] as string);
const okResponse = () => ({
  ok: true,
  status: 200,
  arrayBuffer: async () => new ArrayBuffer(8),
});

describe('AudioBus file playback, adversarial', () => {
  it('treats a canPlayType no answer as non-empty, so the first answer wins', async () => {
    // Real browsers never return 'no' (only '', 'maybe', 'probably'), but an odd engine
    // answer is non-empty, and rule 1 says the first non-empty answer wins.
    oggAnswer = 'no';
    mp3Answer = 'probably';
    const bus = new AudioBus();
    asFilesBus(bus).useSoundFiles(filesMap());
    bus.unlock();
    await bus.play('correct');
    await flush();
    expect(fetchUrls()).toEqual([OGG_URL]);
  });

  it('treats a whitespace canPlayType answer as non-empty and picks that format', async () => {
    oggAnswer = ' ';
    mp3Answer = 'probably';
    const bus = new AudioBus();
    asFilesBus(bus).useSoundFiles(filesMap());
    bus.unlock();
    await bus.play('correct');
    await flush();
    expect(fetchUrls()).toEqual([OGG_URL]);
  });

  it('picks ogg when both answers are maybe, asking each type once', async () => {
    oggAnswer = 'maybe';
    mp3Answer = 'maybe';
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

  it('unlocks before the map is set and still fetches the file after the map arrives', async () => {
    oggAnswer = 'probably';
    const bus = new AudioBus();
    bus.unlock();
    expect(audioConstructions).toBe(2);
    // A play before the map runs the synth recipe and starts no fetch.
    await bus.play('correct');
    await flush();
    expect(fetchMock).toHaveBeenCalledTimes(0);
    expect(oscStarts()).toBe(4);
    asFilesBus(bus).useSoundFiles(filesMap());
    await bus.play('correct');
    await flush();
    expect(fetchUrls()).toEqual([OGG_URL]);
  });

  it('ignores a play before the first unlock and fetches after the unlock', async () => {
    oggAnswer = 'probably';
    const bus = new AudioBus();
    asFilesBus(bus).useSoundFiles(filesMap());
    await bus.play('correct');
    await flush();
    expect(fetchMock).toHaveBeenCalledTimes(0);
    expect(oscStarts()).toBe(0);
    bus.unlock();
    expect(sourceStarts()).toBe(1);
    await bus.play('correct');
    await flush();
    expect(fetchUrls()).toEqual([OGG_URL]);
    expect(oscStarts()).toBe(4);
  });

  it('lets the second useSoundFiles call replace the first, with no event merge', async () => {
    oggAnswer = 'probably';
    const bus = new AudioBus();
    asFilesBus(bus).useSoundFiles(filesMap());
    asFilesBus(bus).useSoundFiles(filesMap({ correct: 'wrong' }));
    bus.unlock();
    await bus.play('correct');
    await flush();
    expect(fetchUrls()).toEqual([`${BASE}wrong.ogg`]);
    // An event of the first map that the second map lacks stays unmapped: synth, no fetch.
    asFilesBus(bus).useSoundFiles(filesMap({ tap: 'tap' }));
    await bus.play('correct');
    await flush();
    expect(fetchUrls()).toEqual([`${BASE}wrong.ogg`]);
    expect(oscStarts(), 'the replaced event falls back to the synth recipe').toBeGreaterThan(0);
  });

  it('rejects the stale decode when the map is swapped mid-flight', async () => {
    // Spec AC4: the current map decides the file — a fetch or decode that started under the
    // old mapping must not install its buffer after useSoundFiles() remapped the event.
    oggAnswer = 'probably';
    let resolveFetch: ((value: unknown) => void) | null = null;
    fetchImpl = () =>
      new Promise((resolve) => {
        resolveFetch = resolve;
      });
    const bus = new AudioBus();
    asFilesBus(bus).useSoundFiles(filesMap());
    bus.unlock();
    await bus.play('correct');
    asFilesBus(bus).useSoundFiles(filesMap({ correct: 'wrong' }));
    resolveFetch!(okResponse());
    await flush();
    const stale = decodedBuffers[0]!;
    expect(gameSourceStarts(), 'the stale decode stores nothing to play').toBe(0);
    await bus.play('correct');
    await flush();
    expect(fetchUrls(), 'the next play fetches the new file').toEqual([OGG_URL, `${BASE}wrong.ogg`]);
    await bus.play('correct');
    await flush();
    expect(gameSourceStarts(), 'the next play plays the new file').toBe(1);
    const stalePlays = FakeAudioContext.instances.reduce(
      (sum, ctx) => sum + ctx.sources.filter((s) => s.starts > 0 && s.buffer === stale).length,
      0,
    );
    expect(stalePlays, 'no source ever starts the buffer decoded from the old file').toBe(0);
  });

  it('rejects the stale fetch that resolves after the map changed', async () => {
    // Spec AC4: the current map decides the file — a fetch that resolves after useSoundFiles()
    // changed the mapping stores nothing, and exactly one fetch for the new file follows.
    oggAnswer = 'probably';
    const bus = new AudioBus();
    asFilesBus(bus).useSoundFiles(filesMap());
    bus.unlock();
    const ctx = FakeAudioContext.instances[0]!;
    let resolveDecode: ((buffer: FakeBuffer) => void) | null = null;
    ctx.decodeImpl = () =>
      new Promise<FakeBuffer>((resolve) => {
        resolveDecode = resolve;
      });
    await bus.play('correct');
    await flush();
    expect(decodeCalls(), 'the old fetch reached the pending decode').toBe(1);
    asFilesBus(bus).useSoundFiles(filesMap({ correct: 'wrong' }));
    const stale = new FakeBuffer();
    resolveDecode!(stale);
    ctx.decodeImpl = async () => new FakeBuffer();
    await flush();
    expect(gameSourceStarts(), 'the stale fetch stores nothing to play').toBe(0);
    await bus.play('correct');
    await flush();
    expect(fetchUrls(), 'exactly one fetch for the new file follows').toEqual([OGG_URL, `${BASE}wrong.ogg`]);
    await bus.play('correct');
    await flush();
    expect(gameSourceStarts(), 'the next play plays the new file').toBe(1);
    const stalePlays = FakeAudioContext.instances.reduce(
      (sum, c) => sum + c.sources.filter((s) => s.starts > 0 && s.buffer === stale).length,
      0,
    );
    expect(stalePlays, 'no source ever starts the buffer decoded from the old file').toBe(0);
  });

  it('clears every event to the synth recipe when the map is cleared after a decode', async () => {
    // Defect F1: the decoded buffer survives useSoundFiles(null), so the cleared event
    // still plays the file. The method contract says null "clears them with null so every
    // event uses the synth recipe", and AC4 rule 6 sends unmapped events to the synth.
    oggAnswer = 'probably';
    const bus = new AudioBus();
    asFilesBus(bus).useSoundFiles(filesMap());
    bus.unlock();
    await bus.play('correct');
    await flush();
    expect(decodeCalls()).toBe(1);
    const oscAfterDecode = oscStarts();
    asFilesBus(bus).useSoundFiles(null);
    await bus.play('correct');
    await flush();
    expect(gameSourceStarts(), 'a cleared event must not play its stale file').toBe(0);
    expect(oscStarts(), 'a cleared event falls back to the synth recipe').toBe(oscAfterDecode + 4);
    // The same defect shows when the new map simply lacks the event.
    asFilesBus(bus).useSoundFiles(filesMap({ tap: 'tap' }));
    await bus.play('correct');
    await flush();
    expect(gameSourceStarts(), 'an unmapped event must not play its stale file').toBe(0);
    expect(oscStarts()).toBe(oscAfterDecode + 8);
  });

  it('builds the URL by literal concat, so a base without a trailing slash shows in the URL', async () => {
    // The SoundFiles contract requires a trailing slash on base. The bus does not repair
    // a violating base; this pins that no silent normalization hides the violation.
    oggAnswer = 'probably';
    const bus = new AudioBus();
    asFilesBus(bus).useSoundFiles({ base: '/audio/chibi', events: { correct: ENTRY } });
    bus.unlock();
    await bus.play('correct');
    await flush();
    expect(fetchUrls()).toEqual(['/audio/chibiright.ogg']);
    // The helper appends the folder with one trailing slash on its own.
    expect(chibiSoundFiles('/demo/').base).toBe('/demo/audio/chibi/');
    expect(chibiSoundFiles('/demo').base).toBe('/demoaudio/chibi/');
  });

  it('never decodes on the disposed context when a fetch resolves after dispose', async () => {
    oggAnswer = 'probably';
    let resolveFetch: ((value: unknown) => void) | null = null;
    fetchImpl = () =>
      new Promise((resolve) => {
        resolveFetch = resolve;
      });
    const bus = new AudioBus();
    asFilesBus(bus).useSoundFiles(filesMap());
    bus.unlock();
    await bus.play('correct');
    bus.dispose();
    expect(FakeAudioContext.instances[0]!.closes).toBe(1);
    resolveFetch!(okResponse());
    await flush();
    expect(decodeCalls(), 'the closed context takes no decode').toBe(0);
    expect(gameSourceStarts()).toBe(0);
    // The late bytes wait in pendingDecode: a later unlock decodes them with no new fetch.
    bus.unlock();
    await flush();
    expect(decodeCalls()).toBe(1);
    await bus.play('correct');
    await flush();
    expect(gameSourceStarts()).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('swallows a fetch rejection that arrives after dispose', async () => {
    oggAnswer = 'probably';
    let rejectFetch: ((error: Error) => void) | null = null;
    fetchImpl = () =>
      new Promise((_resolve, reject) => {
        rejectFetch = reject;
      });
    const bus = new AudioBus();
    asFilesBus(bus).useSoundFiles(filesMap());
    bus.unlock();
    await bus.play('correct');
    bus.dispose();
    rejectFetch!(new Error('down'));
    await flush();
    expect(FakeAudioContext.instances[0]!.closes).toBe(1);
    expect(decodeCalls()).toBe(0);
  });

  it('plays the synth on each play during a pending decode, then marks the event on decode failure', async () => {
    oggAnswer = 'probably';
    const bus = new AudioBus();
    asFilesBus(bus).useSoundFiles(filesMap());
    bus.unlock();
    const ctx = FakeAudioContext.instances[0]!;
    let rejectDecode: ((error: Error) => void) | null = null;
    ctx.decodeImpl = () =>
      new Promise((_resolve, reject) => {
        rejectDecode = reject;
      });
    await bus.play('correct');
    await bus.play('correct');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(oscStarts(), 'each play before the decode runs the synth recipe').toBe(8);
    rejectDecode!(new Error('bad'));
    await flush();
    await bus.play('correct');
    await flush();
    expect(fetchMock, 'a failed event is tried once').toHaveBeenCalledTimes(1);
    expect(decodeCalls()).toBe(1);
    expect(oscStarts(), 'the marked event keeps the synth recipe').toBe(12);
    expect(gameSourceStarts()).toBe(0);
  });

  it('preloads mapped events once and skips unmapped and duplicate names', async () => {
    oggAnswer = 'probably';
    const bus = new AudioBus();
    asFilesBus(bus).useSoundFiles(filesMap({ tap: 'tap', correct: ENTRY }));
    bus.unlock();
    asFilesBus(bus).preload(['tap', 'tap', 'ghost', 'correct', 'ghost']);
    await flush();
    expect(fetchUrls()).toEqual([`${BASE}tap.ogg`, OGG_URL]);
    expect(decodeCalls()).toBe(2);
    expect(gameSourceStarts()).toBe(0);
  });

  it('decodes a preloaded file on the first unlock and plays it with no synth', async () => {
    oggAnswer = 'probably';
    const bus = new AudioBus();
    asFilesBus(bus).useSoundFiles(filesMap());
    asFilesBus(bus).preload(['correct']);
    await flush();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(decodeCalls(), 'no context exists before the first unlock').toBe(0);
    bus.unlock();
    await flush();
    expect(decodeCalls()).toBe(1);
    await bus.play('correct');
    await flush();
    expect(gameSourceStarts()).toBe(1);
    expect(oscStarts(), 'the decoded file replaces the synth recipe').toBe(0);
  });

  it('keeps a failed event on the synth recipe across a map swap', async () => {
    // AC4 rule 5: the bus tries each event once. A swap to a map with another entry for
    // the same event does not retry it.
    oggAnswer = 'probably';
    const bus = new AudioBus();
    asFilesBus(bus).useSoundFiles(filesMap());
    bus.unlock();
    const ctx = FakeAudioContext.instances[0]!;
    ctx.decodeImpl = async () => Promise.reject(new Error('bad'));
    await bus.play('correct');
    await flush();
    asFilesBus(bus).useSoundFiles(filesMap({ correct: 'wrong' }));
    await bus.play('correct');
    await flush();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(oscStarts()).toBe(8);
    expect(gameSourceStarts()).toBe(0);
  });

  it('still unlocks when the silent pulse buffer cannot be created', () => {
    // Defect F2: an older engine whose createBuffer throws leaves unlock() throwing, so
    // the gesture handler breaks and the context never resumes. The unlock must survive.
    oggAnswer = 'probably';
    FakeAudioContext.throwOnCreateBuffer = true;
    const bus = new AudioBus();
    asFilesBus(bus).useSoundFiles(filesMap());
    expect(() => bus.unlock(), 'unlock must not throw when the pulse buffer fails').not.toThrow();
    const ctx = FakeAudioContext.instances[0]!;
    expect(ctx.resumes, 'the context still resumes').toBe(1);
    expect(ctx.gains.length, 'the master gain still exists').toBeGreaterThan(0);
  });
});
