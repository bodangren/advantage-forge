import { describe, expect, it, vi } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { AudioBus } from '../../src/apk3d/audio/bus.js';

// Covers spec AC9: the 2D game hosts set the sound map and preload at start.
// Red: case 1 fails with ENOENT for the generated map, case 2 finds 0 of 29
// hosts, and cases 3 to 5 fail on the absent helper module. No static import of
// either new module, so the missing files fail cases, not collection.

const OGG_TYPE = 'audio/ogg; codecs="vorbis"';

interface WireFn {
  (audio: unknown, soundBase: string | undefined, gameEvents: string[]): boolean;
}

const loadWire = async (): Promise<WireFn> => {
  const mod = (await import('../../src/apk3d/audio/chibi.js')) as unknown as {
    wireChibiSounds: WireFn;
  };
  return mod.wireChibiSounds;
};

interface MappedEvent {
  event: string;
  entry: string;
}

const readMappedEvents = (): MappedEvent[] => {
  const lines = readFileSync('docs/sound-event-map.tsv', 'utf8').trim().split('\n');
  return lines
    .slice(1)
    .map((line) => line.split('\t'))
    .filter((fields) => fields[1] !== 'synth')
    .map((fields) => ({ event: fields[0]!, entry: fields[1]!.replace(/^chibi\//, '') }));
};

const readHostPaths = (): string[] =>
  readdirSync('src/games', { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join('src/games', entry.name, 'view2d', 'game.ts'))
    .filter((path) => {
      try {
        readFileSync(path);
        return true;
      } catch {
        return false;
      }
    });

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
  start(): void {}
  stop(): void {}
}

class FakeGain extends FakeNode {
  gain = new FakeParam();
}

class FakeBuffer {
  getChannelData(_channel: number): Float32Array {
    return new Float32Array(8);
  }
}

class FakeBufferSource extends FakeNode {
  buffer: unknown = null;
  onended: unknown = null;
  start(): void {}
  stop(): void {}
}

class FakeFilter extends FakeNode {
  type = 'lowpass';
  frequency = new FakeParam();
}

class FakeAudioContext {
  state = 'running';
  currentTime = 0;
  sampleRate = 48000;
  destination = {};
  async decodeAudioData(): Promise<FakeBuffer> {
    return new FakeBuffer();
  }
  createOscillator(): FakeOscillator {
    return new FakeOscillator();
  }
  createGain(): FakeGain {
    return new FakeGain();
  }
  createBufferSource(): FakeBufferSource {
    return new FakeBufferSource();
  }
  createBuffer(): FakeBuffer {
    return new FakeBuffer();
  }
  createBiquadFilter(): FakeFilter {
    return new FakeFilter();
  }
  async resume(): Promise<void> {}
  async suspend(): Promise<void> {}
  async close(): Promise<void> {}
}

class FakeAudio {
  canPlayType(type: string): string {
    return type === OGG_TYPE ? 'probably' : '';
  }
}

const fetchMock = vi.fn();
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
  defineGlobal('navigator', {});
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

const flush = async () => {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
};

describe('audio wiring', () => {
  it('maps the 31 tsv events to set entries in the generated module', () => {
    const mapped = readMappedEvents();
    expect(mapped.length).toBe(31);
    const setNames: string[] = JSON.parse(readFileSync('sounds/sets/chibi.json', 'utf8')).sounds.map(
      (sound: { name: string }) => sound.name,
    );
    const gen = readFileSync('src/apk3d/audio/chibi-events.gen.ts', 'utf8');
    const parsed: Record<string, string> = {};
    for (const line of gen.split('\n')) {
      const match = /^\s*"?([A-Za-z0-9_-]+)"?\s*:\s*["']([^"']+)["']/.exec(line);
      if (match) parsed[match[1]!] = match[2]!;
    }
    expect(Object.keys(parsed).length).toBe(31);
    const expected: Record<string, string> = Object.fromEntries(mapped.map((row) => [row.event, row.entry]));
    expect(parsed).toEqual(expected);
    for (const entry of Object.values(parsed)) {
      expect(setNames).toContain(entry);
    }
  });

  it('calls wireChibiSounds once in each of the 29 game hosts', () => {
    const hosts = readHostPaths();
    expect(hosts.length).toBe(29);
    for (const host of hosts) {
      const text = readFileSync(host, 'utf8');
      const calls = text.split('wireChibiSounds(').length - 1;
      expect(calls, `${host} holds ${calls} wireChibiSounds( calls`).toBe(1);
    }
  });

  it('sets the map and preloads the mapped subset', async () => {
    const wireChibiSounds = await loadWire();
    const bus = { useSoundFiles: vi.fn(), preload: vi.fn() };
    wireChibiSounds(bus, '/demo/', ['tap', 'tap', 'hit', 'victory']);
    const expected: Record<string, string> = Object.fromEntries(
      readMappedEvents().map((row) => [row.event, row.entry]),
    );
    expect(bus.useSoundFiles).toHaveBeenCalledTimes(1);
    expect(bus.useSoundFiles).toHaveBeenCalledWith({ base: '/demo/audio/chibi/', events: expected });
    expect(bus.preload).toHaveBeenCalledTimes(1);
    expect(bus.preload).toHaveBeenCalledWith(['tap', 'victory']);
  });

  it('makes no bus calls without a sound base', async () => {
    const wireChibiSounds = await loadWire();
    const bus = { useSoundFiles: vi.fn(), preload: vi.fn() };
    const result = wireChibiSounds(bus, undefined, ['tap']);
    expect(bus.useSoundFiles).not.toHaveBeenCalled();
    expect(bus.preload).not.toHaveBeenCalled();
    expect(result).toBe(false);
  });

  it('fetches the file url once on a real bus and fetches nothing for synth events', async () => {
    const wireChibiSounds = await loadWire();
    fetchMock.mockReset();
    fetchMock.mockImplementation(async () => ({
      ok: true,
      status: 200,
      arrayBuffer: async () => new ArrayBuffer(8),
    }));
    installHarness();
    try {
      const audio = new AudioBus();
      audio.unlock();
      wireChibiSounds(audio, '/x/', ['tap']);
      await flush();
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const urls = fetchMock.mock.calls.map((call) => call[0] as string);
      expect(urls).toEqual(['/x/audio/chibi/tap.ogg']);
      audio.play('hit');
      await flush();
      expect(fetchMock).toHaveBeenCalledTimes(1);
    } finally {
      restoreHarness();
    }
  });
});
