import { describe, expect, it, vi } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { AudioBus } from '../../src/apk3d/audio/bus.js';
import { CHIBI_EVENTS } from '../../src/apk3d/audio/chibi-events.gen.js';
import { chibiPreload, chibiSoundFiles, wireChibiSounds } from '../../src/apk3d/audio/chibi.js';

// Adversarial round for Phase 3 wiring (spec AC9). The reviews pinned the helper contract
// and the 29 host lists; this file attacks the edges they left open: preload lists with
// duplicates and synth names, a sound base without a trailing slash, a double wire call,
// and the host-list parser of tests/apk3d/audio-wiring.test.ts against tricky host
// shapes (computed keys, nested braces, sprite plays, and play calls in comments or
// strings). One fixture case pins a parser defect and stays failing until Green fixes
// the parser (F3 in measure/runs/audio_game_integration_20261014/adversarial-p3-*.json).

const OGG_TYPE = 'audio/ogg; codecs="vorbis"';

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

// The extraction rules of tests/apk3d/audio-wiring.test.ts case 6, copied exactly, so a
// change there cannot drift from this file without failing a fixture below.
function playedEventsOf(text: string): Set<string> {
  const played = new Set<string>();
  for (const call of text.matchAll(/audio\.play\(([^;]*?)\)/gs)) {
    let args = call[1]!;
    const branch = args.indexOf('?');
    if (branch >= 0) args = args.slice(branch);
    for (const literal of args.matchAll(/'([a-z][a-z-]*)'/g)) played.add(literal[1]!);
  }
  const sfx = text.match(/const SFX[^=]*=\s*\{([^}]*)\}/s);
  if (sfx) for (const literal of sfx[1]!.matchAll(/'([^'"]+)'/g)) played.add(literal[1]!);
  return played;
}

/** The host text without comments, so a play call that exists only in a comment shows as a difference. */
function stripComments(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

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

describe('audio wiring, adversarial', () => {
  it('deduplicates the preload list and drops synth and unknown names in first-play order', () => {
    expect(chibiPreload(['tap', 'tap', 'hit', 'victory'])).toEqual(['tap', 'victory']);
    expect(chibiPreload(['victory', 'tap', 'correct'])).toEqual(['victory', 'tap', 'correct']);
    expect(chibiPreload([])).toEqual([]);
    expect(chibiPreload(['hit', 'aura'])).toEqual([]);
  });

  it('appends the folder with one trailing slash for a conforming sound base', () => {
    const files = chibiSoundFiles('/demo/');
    expect(files.base).toBe('/demo/audio/chibi/');
    expect(files.events).toEqual(CHIBI_EVENTS);
    expect(Object.keys(files.events)).toHaveLength(31);
    // A base without a trailing slash violates the contract; the helper does not repair it.
    expect(chibiSoundFiles('/demo').base).toBe('/demoaudio/chibi/');
  });

  it('wires twice without a hidden guard and still fetches each file once on a real bus', async () => {
    const bus = { useSoundFiles: vi.fn(), preload: vi.fn() };
    expect(wireChibiSounds(bus, '', ['tap'])).toBe(false);
    expect(bus.useSoundFiles).not.toHaveBeenCalled();
    expect(wireChibiSounds(bus, '/demo/', ['tap', 'tap'])).toBe(true);
    expect(wireChibiSounds(bus, '/demo/', ['tap'])).toBe(true);
    expect(bus.useSoundFiles).toHaveBeenCalledTimes(2);
    expect(bus.preload).toHaveBeenCalledTimes(2);
    expect(bus.preload).toHaveBeenLastCalledWith(['tap']);

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
      wireChibiSounds(audio, '/x/', ['tap', 'tap']);
      wireChibiSounds(audio, '/x/', ['tap']);
      await flush();
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock.mock.calls.map((call) => call[0] as string)).toEqual(['/x/audio/chibi/tap.ogg']);
    } finally {
      restoreHarness();
    }
  });

  it('finds no play call inside a comment or a string in any of the 29 hosts', () => {
    const hosts = readHostPaths();
    expect(hosts.length).toBe(29);
    const offenders: string[] = [];
    for (const host of hosts) {
      const text = readFileSync(host, 'utf8');
      const raw = playedEventsOf(text);
      const clean = playedEventsOf(stripComments(text));
      const onlyInComments = [...raw].filter((event) => !clean.has(event));
      if (onlyInComments.length > 0) offenders.push(`${host}: [${onlyInComments.join(', ')}]`);
    }
    expect(offenders.join('\n')).toBe('');
  });

  it('finds no nested brace inside any host SFX object', () => {
    // A nested object would close the SFX match early and hide later values from the
    // extraction, so an event played through them would slip out of the wire list.
    const offenders: string[] = [];
    for (const host of readHostPaths()) {
      const text = readFileSync(host, 'utf8');
      const sfx = text.match(/const SFX[^=]*=\s*\{([^}]*)\}/s);
      if (sfx && sfx[1]!.includes('{')) offenders.push(host);
    }
    expect(offenders.join('\n')).toBe('');
  });

  it('requires a literal event list in every host wire call, with no indirection', () => {
    const misses: string[] = [];
    for (const host of readHostPaths()) {
      const text = readFileSync(host, 'utf8');
      if (!/wireChibiSounds\(\s*audio\s*,[^,]*,\s*\[[^\]]*\]/.test(text)) misses.push(host);
    }
    expect(misses.join('\n')).toBe('');
  });

  it('extracts only audio plays, both ternary branches, and computed-key SFX values', () => {
    const fixture = [
      "sprite.anims.play('run');",
      "audio.play(ok ? 'correct' : 'wrong');",
      "const SFX = { [kind]: 'tap', hit: 'hit' };",
      'audio.play(SFX[kind]);',
    ].join('\n');
    expect([...playedEventsOf(fixture)].sort()).toEqual(['correct', 'hit', 'tap', 'wrong']);
  });

  it('ignores play calls that live in comments or strings', () => {
    // Defect F3: the wiring parser scans comments and strings, so a commented-out or
    // quoted audio.play counts as a played event and forces a useless preload entry.
    const fixture = [
      "// audio.play('ghost')",
      "/* audio.play('specter') */",
      'const hint = "call audio.play(\'wisp\') to debug";',
      "audio.play('tap');",
    ].join('\n');
    expect([...playedEventsOf(fixture)].sort()).toEqual(['tap']);
  });
});
