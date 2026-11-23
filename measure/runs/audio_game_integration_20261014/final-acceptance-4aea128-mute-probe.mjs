// Final acceptance probe (4aea128): the mutation probe left B09 alive (no committed test
// records where a decoded file source connects). This probe checks the live behavior of the real
// src/apk3d/audio/bus.ts with a recording fake context: a file source connects to the master
// gain, the master gain feeds the destination, and setMuted(true) drives the master gain to 0.
// Run from the repository root: node measure/runs/audio_game_integration_20261014/final-acceptance-4aea128-mute-probe.mjs
import { AudioBus } from '../../../src/apk3d/audio/bus.ts';

class RecNode {
  constructor(kind) {
    this.kind = kind;
    this.connections = [];
  }
  connect(destination) {
    this.connections.push(destination);
    return destination;
  }
}
class RecParam {
  constructor() {
    this.value = 1;
    this.calls = [];
  }
  setValueAtTime(...args) {
    this.calls.push(['setValueAtTime', ...args]);
  }
  exponentialRampToValueAtTime(...args) {
    this.calls.push(['exponentialRampToValueAtTime', ...args]);
  }
  setTargetAtTime(...args) {
    this.calls.push(['setTargetAtTime', ...args]);
  }
}
class RecContext {
  constructor() {
    this.state = 'running';
    this.currentTime = 0;
    this.sampleRate = 48000;
    this.destination = new RecNode('destination');
    this.gains = [];
    this.sources = [];
  }
  createGain() {
    const node = new RecNode('gain');
    node.gain = new RecParam();
    this.gains.push(node);
    return node;
  }
  createBufferSource() {
    const node = new RecNode('source');
    node.buffer = null;
    node.starts = 0;
    node.start = () => {
      node.starts += 1;
    };
    node.stop = () => {};
    this.sources.push(node);
    return node;
  }
  createBuffer() {
    return { kind: 'synth-or-pulse-buffer' };
  }
  createOscillator() {
    const node = new RecNode('oscillator');
    node.frequency = new RecParam();
    node.start = () => {};
    node.stop = () => {};
    return node;
  }
  createBiquadFilter() {
    const node = new RecNode('filter');
    node.frequency = new RecParam();
    return node;
  }
  async decodeAudioData() {
    return { kind: 'decoded-file-buffer' };
  }
  async resume() {}
  async suspend() {}
  async close() {}
}

let ctxRef = null;
globalThis.window = {
  AudioContext: class extends RecContext {
    constructor() {
      super();
      ctxRef = this;
    }
  },
  setInterval,
  clearInterval,
};
Object.defineProperty(globalThis, 'navigator', { value: {}, configurable: true });
globalThis.Audio = class {
  canPlayType(type) {
    return type.startsWith('audio/ogg') ? 'probably' : '';
  }
};
globalThis.fetch = async () => ({ ok: true, status: 200, arrayBuffer: async () => new ArrayBuffer(8) });

const tick = () => new Promise((resolve) => setTimeout(resolve, 5));
const results = [];
const check = (name, ok) => {
  results.push(ok);
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
};

const bus = new AudioBus();
bus.useSoundFiles({ base: '/demo/audio/chibi/', events: { correct: 'right' } });
bus.unlock();
bus.preload(['correct']);
await tick();
const ctx = ctxRef;
const master = ctx.gains[0];
check('the first gain created by unlock is the master gain and feeds the destination', master.connections[0] === ctx.destination);
const before = ctx.sources.length;
bus.play('correct');
const fileSources = ctx.sources.slice(before).filter((s) => s.buffer && s.buffer.kind === 'decoded-file-buffer');
check('play of a decoded event starts exactly one file source', fileSources.length === 1 && fileSources[0].starts === 1);
check('that file source connects to the master gain, not to the destination', fileSources[0].connections[0] === master && !fileSources[0].connections.includes(ctx.destination));
bus.setMuted(true);
const muteCall = master.gain.calls.find((c) => c[0] === 'setTargetAtTime');
check('setMuted(true) drives the master gain target to 0', Boolean(muteCall) && muteCall[1] === 0);
bus.setMuted(false);
const unmuteCall = master.gain.calls.filter((c) => c[0] === 'setTargetAtTime').pop();
check('setMuted(false) restores the master gain target to 0.8', unmuteCall && unmuteCall[1] === 0.8);

// A non-OK status with a body that would decode is the case B05 left alive.
let decodes = 0;
globalThis.fetch = async () => ({ ok: false, status: 404, arrayBuffer: async () => new ArrayBuffer(8) });
const bus2 = new AudioBus();
bus2.useSoundFiles({ base: '/demo/audio/chibi/', events: { correct: 'right' } });
bus2.unlock();
const ctx2 = ctxRef;
ctx2.decodeAudioData = async () => {
  decodes += 1;
  return { kind: 'decoded-file-buffer' };
};
bus2.play('correct');
await tick();
bus2.play('correct');
await tick();
const decodedSources = ctx2.sources.filter((s) => s.buffer && s.buffer.kind === 'decoded-file-buffer' && s.starts > 0);
check('a 404 response with a decodable body is never decoded and never plays as a file', decodes === 0 && decodedSources.length === 0);

console.log(results.every(Boolean) ? 'RESULT: all probe checks hold on the live bus.ts' : 'RESULT: a probe check failed');
process.exitCode = results.every(Boolean) ? 0 : 1;
