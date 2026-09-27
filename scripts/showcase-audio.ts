/**
 * The showcase soundtrack: procedural music per mood and the sound effects of the tour script,
 * synthesized from scratch (no samples) into out/showcase/soundtrack.wav (44.1 kHz stereo).
 *
 *   node --import tsx scripts/showcase-audio.ts
 *
 * Deterministic: the same script gives the same audio.
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tour } from '../src/showcase/script.js';
import type { MusicMood, SfxKind } from '../src/showcase/types.js';

const SR = 44100;
const N = Math.ceil((tour.duration + 1) * SR);
const L = new Float32Array(N);
const R = new Float32Array(N);

// ---------------------------------------------------------------- basics
let seed = 1234567;
function rand(): number {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const noise = (): number => rand() * 2 - 1;
const midi = (m: number): number => 440 * Math.pow(2, (m - 69) / 12);
const TAU = Math.PI * 2;

/** Mix a mono voice into the stereo buffers. */
function put(t0: number, dur: number, gain: number, pan: number, voice: (t: number, i: number) => number): void {
  const s0 = Math.max(0, Math.floor(t0 * SR));
  const n = Math.min(N - s0, Math.floor(dur * SR));
  const gl = gain * Math.cos(((pan + 1) * Math.PI) / 4);
  const gr = gain * Math.sin(((pan + 1) * Math.PI) / 4);
  for (let i = 0; i < n; i++) {
    const v = voice(i / SR, i);
    L[s0 + i]! += v * gl;
    R[s0 + i]! += v * gr;
  }
}

function env(t: number, dur: number, attack: number, release: number): number {
  if (t < attack) return t / attack;
  if (t > dur - release) return Math.max(0, (dur - t) / release);
  return 1;
}

// ---------------------------------------------------------------- instruments
function pluck(t0: number, f: number, gain: number, pan = 0, tau = 0.28): void {
  let lp = 0;
  put(t0, tau * 5, gain, pan, (t) => {
    const x = Math.sin(TAU * f * t) + Math.sin(TAU * 3 * f * t) / 3 + Math.sin(TAU * 5 * f * t) / 6;
    lp += 0.35 * (x - lp);
    return lp * Math.exp(-t / tau) * Math.min(1, t / 0.003);
  });
}

function bell(t0: number, f: number, gain: number, pan = 0): void {
  put(t0, 2.4, gain, pan, (t) => (Math.sin(TAU * f * t) + 0.45 * Math.sin(TAU * f * 2.76 * t) * Math.exp(-t * 2.5)) * Math.exp(-t * 1.6) * Math.min(1, t / 0.002));
}

function lead(t0: number, f: number, dur: number, gain: number, pan = 0.15): void {
  put(t0, dur + 0.12, gain, pan, (t) => {
    const vib = t > 0.12 ? 1 + 0.006 * Math.sin(TAU * 5.5 * t) : 1;
    const ph = (f * vib * t) % 1;
    const tri = 4 * Math.abs(ph - 0.5) - 1;
    return (0.7 * tri + 0.3 * Math.sin(TAU * f * vib * t)) * env(t, dur + 0.12, 0.02, 0.12);
  });
}

function pad(t0: number, freqs: number[], dur: number, gain: number): void {
  let lp = 0;
  put(t0, dur + 0.5, gain, 0, (t) => {
    let x = 0;
    for (const f of freqs) for (const d of [0.997, 1.003]) x += ((f * d * t) % 1) * 2 - 1;
    lp += 0.04 * (x / (freqs.length * 2) - lp);
    return lp * env(t, dur + 0.5, 0.35, 0.5);
  });
}

function bassNote(t0: number, f: number, dur: number, gain: number): void {
  put(t0, dur, gain, 0, (t) => {
    const ph = (f * t) % 1;
    return ((4 * Math.abs(ph - 0.5) - 1) * 0.6 + Math.sin(TAU * f * t) * 0.6) * env(t, dur, 0.008, 0.06) * Math.exp(-t * 1.2);
  });
}

function kick(t0: number, gain: number): void {
  let ph = 0;
  put(t0, 0.35, gain, 0, (t) => {
    const f = 45 + 110 * Math.exp(-t * 28);
    ph += f / SR;
    return Math.sin(TAU * ph) * Math.exp(-t * 9);
  });
}

function snare(t0: number, gain: number): void {
  let hp = 0;
  let prev = 0;
  put(t0, 0.22, gain, 0.05, (t) => {
    const n = noise();
    hp = 0.7 * (hp + n - prev);
    prev = n;
    return (hp * 0.8 + Math.sin(TAU * 190 * t) * 0.4 * Math.exp(-t * 30)) * Math.exp(-t * 18);
  });
}

function hat(t0: number, gain: number, pan = -0.2): void {
  let hp = 0;
  let prev = 0;
  put(t0, 0.06, gain, pan, (t) => {
    const n = noise();
    hp = 0.5 * (hp + n - prev);
    prev = n;
    return hp * Math.exp(-t * 60);
  });
}

// ---------------------------------------------------------------- music
const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
};

interface Style {
  bpm: number;
  root: number;
  scale: keyof typeof SCALES;
  prog: number[];
  drums: 'none' | 'heart' | 'soft' | 'march' | 'drive';
  arp: 'none' | 'pluck' | 'bell';
  lead: boolean;
  pad: number;
  bass: 'drone' | 'half' | 'quarter' | 'eighth';
  gain: number;
}

const STYLES: Record<MusicMood, Style> = {
  mystery: { bpm: 72, root: 57, scale: 'minor', prog: [0, 5, 3, 4], drums: 'none', arp: 'bell', lead: false, pad: 0.16, bass: 'drone', gain: 0.9 },
  bright: { bpm: 120, root: 60, scale: 'major', prog: [0, 4, 5, 3], drums: 'soft', arp: 'pluck', lead: true, pad: 0.1, bass: 'half', gain: 1 },
  heroes: { bpm: 126, root: 62, scale: 'major', prog: [0, 3, 4, 0], drums: 'march', arp: 'pluck', lead: true, pad: 0.1, bass: 'quarter', gain: 0.9 },
  village: { bpm: 108, root: 65, scale: 'major', prog: [0, 5, 3, 4], drums: 'soft', arp: 'pluck', lead: true, pad: 0.1, bass: 'half', gain: 0.75 },
  forest: { bpm: 104, root: 62, scale: 'dorian', prog: [0, 3, 0, 6], drums: 'soft', arp: 'pluck', lead: true, pad: 0.12, bass: 'quarter', gain: 0.8 },
  vault: { bpm: 84, root: 57, scale: 'minor', prog: [0, 5, 6, 4], drums: 'heart', arp: 'bell', lead: false, pad: 0.14, bass: 'half', gain: 0.8 },
  battle: { bpm: 144, root: 57, scale: 'minor', prog: [0, 5, 3, 4], drums: 'drive', arp: 'pluck', lead: true, pad: 0.12, bass: 'eighth', gain: 1 },
  finale: { bpm: 120, root: 60, scale: 'major', prog: [3, 4, 0, 5], drums: 'march', arp: 'pluck', lead: true, pad: 0.12, bass: 'quarter', gain: 1 },
};

/** Melody motifs: chord tone per eighth note (0 root, 1 third, 2 fifth, 3 octave), -1 rests. */
const MOTIFS = [
  [2, -1, 3, 2, 1, -1, 2, -1],
  [1, 2, 3, -1, 2, 1, 0, -1],
  [3, -1, 2, 1, 2, -1, 3, 3],
  [2, 1, 0, -1, 1, -1, -1, -1],
];

function chordTones(style: Style, degree: number): number[] {
  const sc = SCALES[style.scale];
  return [0, 2, 4].map((k) => {
    const d = degree + k;
    return style.root + sc[d % 7]! + 12 * Math.floor(d / 7);
  });
}

function renderSection(start: number, end: number, mood: MusicMood): void {
  const st = STYLES[mood];
  const beat = 60 / st.bpm;
  const bar = beat * 4;
  const g = st.gain;
  const bars = Math.ceil((end - start) / bar);
  for (let b = 0; b < bars; b++) {
    const t0 = start + b * bar;
    const chord = chordTones(st, st.prog[b % st.prog.length]!);
    const rootHz = midi(chord[0]! - 24);
    // Fade the section in and out so moods cross over smoothly.
    const fade = (t: number): number => Math.min(1, (t - start) / 0.6 + 0.05, (end + 0.4 - t) / 0.8);
    const f = fade(t0);
    if (f <= 0) continue;
    if (st.pad > 0) pad(t0, chord.map((m) => midi(m - 12)), bar, st.pad * g * f);
    // Bass.
    if (st.bass === 'drone') bassNote(t0, rootHz, bar, 0.28 * g * f);
    else {
      const step = st.bass === 'half' ? 2 : st.bass === 'quarter' ? 1 : 0.5;
      for (let k = 0; k < 4 / step; k++) {
        const tk = t0 + k * step * beat;
        if (tk >= end + 0.3) break;
        const alt = st.bass !== 'half' && k % 2 === 1 ? midi(chord[2]! - 24) : rootHz;
        bassNote(tk, alt, step * beat * 0.95, 0.3 * g * fade(tk));
      }
    }
    // Arpeggio.
    if (st.arp !== 'none') {
      const up = [chord[0]!, chord[1]!, chord[2]!, chord[0]! + 12];
      for (let k = 0; k < 8; k++) {
        const tk = t0 + k * beat * 0.5;
        if (tk >= end + 0.2) break;
        const m = up[(k + (b % 2)) % 4]! + (st.arp === 'bell' ? 12 : 0);
        if (st.arp === 'bell') {
          if (k % 2 === 0) bell(tk, midi(m), 0.07 * g * fade(tk), k % 4 === 0 ? -0.3 : 0.3);
        } else pluck(tk, midi(m), 0.08 * g * fade(tk), k % 2 === 0 ? -0.25 : 0.25);
      }
    }
    // Melody.
    if (st.lead) {
      const motif = MOTIFS[b % MOTIFS.length]!;
      const tones = [chord[0]! + 12, chord[1]! + 12, chord[2]! + 12, chord[0]! + 24];
      for (let k = 0; k < 8; k++) {
        const idx = motif[k]!;
        if (idx < 0) continue;
        const tk = t0 + k * beat * 0.5;
        if (tk >= end) break;
        let len = 1;
        while (k + len < 8 && motif[k + len] === -1 && len < 2) len++;
        lead(tk, midi(tones[idx]!), len * beat * 0.5 * 0.9, 0.085 * g * fade(tk));
      }
    }
    // Drums.
    for (let k = 0; k < 8; k++) {
      const tk = t0 + k * beat * 0.5;
      if (tk >= end + 0.1) break;
      const fk = fade(tk) * g;
      switch (st.drums) {
        case 'heart':
          if (k === 0 || k === 1) kick(tk, (k === 0 ? 0.5 : 0.35) * fk);
          break;
        case 'soft':
          if (k === 0 || k === 4) kick(tk, 0.4 * fk);
          if (k === 2 || k === 6) snare(tk, 0.14 * fk);
          hat(tk, 0.05 * fk);
          break;
        case 'march':
          if (k % 2 === 0) kick(tk, 0.45 * fk);
          if (k === 2 || k === 6) snare(tk, 0.22 * fk);
          if (k === 7) snare(tk, 0.12 * fk);
          hat(tk, 0.06 * fk);
          break;
        case 'drive':
          kick(tk, (k % 2 === 0 ? 0.55 : 0.3) * fk);
          if (k === 2 || k === 6) snare(tk, 0.28 * fk);
          hat(tk, 0.08 * fk);
          hat(tk + beat * 0.25, 0.05 * fk, 0.2);
          break;
        default:
      }
    }
  }
}

// ---------------------------------------------------------------- sound effects
function whoosh(t0: number, g: number, dur = 0.7): void {
  let lp = 0;
  put(t0, dur, g, 0, (t) => {
    const u = t / dur;
    const a = Math.sin(Math.PI * u) ** 2;
    lp += (0.03 + 0.25 * a) * (noise() - lp);
    return lp * a * 2.2;
  });
}

const SFX: Record<SfxKind, (t: number, g: number) => void> = {
  whoosh: (t, g) => whoosh(t, 0.5 * g),
  swoosh: (t, g) => whoosh(t, 0.4 * g, 0.3),
  pop: (t, g) => {
    let ph = 0;
    put(t, 0.12, 0.35 * g, 0, (x) => {
      ph += (1000 * Math.exp(-x * 18) + 380) / SR;
      return Math.sin(TAU * ph) * Math.exp(-x * 30);
    });
  },
  tick: (t, g) => put(t, 0.05, 0.3 * g, 0, (x) => Math.sin(TAU * 1600 * x) * Math.exp(-x * 90)),
  correct: (t, g) => {
    [72, 76, 79, 84].forEach((m, i) => bell(t + i * 0.08, midi(m + 12), 0.16 * g, i % 2 ? 0.2 : -0.2));
  },
  sparkle: (t, g) => {
    const pent = [0, 2, 4, 7, 9];
    for (let i = 0; i < 7; i++) bell(t + i * 0.06, midi(84 + pent[Math.floor(rand() * 5)]! + (i > 3 ? 12 : 0)), 0.07 * g, rand() * 1.4 - 0.7);
  },
  chomp: (t, g) => {
    kick(t, 0.5 * g);
    put(t, 0.08, 0.3 * g, 0, () => noise() * 0.5);
    kick(t + 0.14, 0.4 * g);
  },
  boom: (t, g) => {
    let ph = 0;
    put(t, 1.2, 0.45 * g, 0, (x) => {
      ph += (30 + 70 * Math.exp(-x * 10)) / SR;
      return Math.sin(TAU * ph) * Math.exp(-x * 3.2) + noise() * 0.15 * Math.exp(-x * 12);
    });
  },
  rumble: (t, g) => {
    let lp = 0;
    put(t, 1.6, 0.5 * g, 0, (x) => {
      lp += 0.015 * (noise() - lp);
      return lp * 6 * env(x, 1.6, 0.1, 0.9);
    });
  },
  roar: (t, g) => {
    let lp = 0;
    let ph = 0;
    put(t, 1.9, 0.45 * g, 0, (x) => {
      const f = 95 + 25 * Math.sin(TAU * 6 * x) - 30 * x;
      ph += f / SR;
      const saw = (ph % 1) * 2 - 1;
      lp += 0.08 * (saw * 0.8 + noise() * 0.6 - lp);
      return lp * 2.2 * env(x, 1.9, 0.08, 0.8);
    });
  },
  howl: (t, g) => {
    let ph = 0;
    put(t, 2.4, 0.22 * g, 0, (x) => {
      const u = x / 2.4;
      const f = 420 + 330 * Math.sin(Math.PI * Math.min(1, u * 1.4)) + 8 * Math.sin(TAU * 6 * x);
      ph += f / SR;
      return (Math.sin(TAU * ph) + 0.2 * Math.sin(TAU * 2 * ph)) * env(x, 2.4, 0.25, 0.8);
    });
  },
  screech: (t, g) => {
    let ph = 0;
    put(t, 0.7, 0.14 * g, 0.2, (x) => {
      ph += (2300 - 900 * x) / SR;
      return Math.sin(TAU * ph) * (0.6 + 0.4 * Math.sin(TAU * 38 * x)) * env(x, 0.7, 0.02, 0.3);
    });
  },
  clang: (t, g) => {
    put(t, 0.9, 0.16 * g, -0.1, (x) => ([523, 1307, 2210, 3450] as const).reduce((a, f, i) => a + Math.sin(TAU * f * x) * Math.exp(-x * (4 + i * 3)), 0));
  },
  zap: (t, g) => {
    let ph = 0;
    put(t, 0.35, 0.2 * g, 0.1, (x) => {
      ph += (2200 * Math.exp(-x * 9) + 250) / SR;
      return Math.sign(Math.sin(TAU * ph)) * 0.6 * Math.exp(-x * 8);
    });
  },
  fanfare: (t, g) => {
    [60, 64, 67, 72].forEach((m, i) => {
      let lp = 0;
      put(t + i * 0.12, 0.9 - i * 0.1, 0.1 * g, i % 2 ? 0.2 : -0.2, (x) => {
        const f = midi(m + 12);
        let s = 0;
        for (const d of [0.996, 1, 1.004]) s += ((f * d * x) % 1) * 2 - 1;
        lp += 0.12 * (s / 3 - lp);
        return lp * env(x, 0.9 - i * 0.1, 0.02, 0.3);
      });
    });
  },
};

// ---------------------------------------------------------------- render
for (const cue of tour.music) renderSection(cue.start, cue.end, cue.mood);
// Quiet the music a little under the quest cards, so the countdown ticks come through.
const duck = new Float32Array(N).fill(1);
for (const c of tour.captions) {
  if (c.kind !== 'quest') continue;
  const a = Math.floor(c.start * SR);
  const b = Math.min(N, Math.floor(c.end * SR));
  for (let i = a; i < b; i++) {
    // Down to 60% over the first second, back up over the last half second.
    const w = Math.max(0, Math.min(1, (i - a) / SR, (b - i) / SR / 0.5));
    duck[i] = Math.min(duck[i]!, 1 - 0.4 * w);
  }
}
for (let i = 0; i < N; i++) {
  L[i]! *= 0.9 * duck[i]!;
  R[i]! *= 0.9 * duck[i]!;
}
for (const s of tour.sfx) SFX[s.kind](s.t, s.gain ?? 1);

// Fade out at the end, soft-limit, and write 16-bit PCM.
const endFade = tour.duration - 1.6;
let peak = 0;
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const f = t > endFade ? Math.max(0, 1 - (t - endFade) / 1.6) : 1;
  L[i] = Math.tanh(L[i]! * f * 1.2);
  R[i] = Math.tanh(R[i]! * f * 1.2);
  peak = Math.max(peak, Math.abs(L[i]!), Math.abs(R[i]!));
}
const norm = peak > 0 ? 0.92 / peak : 1;
const data = Buffer.alloc(N * 4);
for (let i = 0; i < N; i++) {
  data.writeInt16LE(Math.round(L[i]! * norm * 32767), i * 4);
  data.writeInt16LE(Math.round(R[i]! * norm * 32767), i * 4 + 2);
}
const header = Buffer.alloc(44);
header.write('RIFF', 0);
header.writeUInt32LE(36 + data.length, 4);
header.write('WAVE', 8);
header.write('fmt ', 12);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20);
header.writeUInt16LE(2, 22);
header.writeUInt32LE(SR, 24);
header.writeUInt32LE(SR * 4, 28);
header.writeUInt16LE(4, 32);
header.writeUInt16LE(16, 34);
header.write('data', 36);
header.writeUInt32LE(data.length, 40);
const dir = join(process.cwd(), 'out', 'showcase');
mkdirSync(dir, { recursive: true });
const raw = join(dir, 'soundtrack.raw.wav');
writeFileSync(raw, Buffer.concat([header, data]));
// Loudness for video platforms: about -15 LUFS with 1.5 dB of true-peak headroom.
const out = join(dir, 'soundtrack.wav');
const ff = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', raw, '-af', 'loudnorm=I=-15:TP=-1.5:LRA=11', '-ar', String(SR), out], { stdio: 'inherit' });
if (ff.status !== 0) throw new Error('ffmpeg loudnorm failed');
rmSync(raw);
console.log(`audio  ${out}  ${(N / SR).toFixed(1)} s`);
