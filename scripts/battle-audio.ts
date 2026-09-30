/**
 * The battle teaser soundtrack: two sections of the Reading Advantage jingle, the Thai
 * voice-over (mmx speech), and synthesized sound effects, mixed to -14 LUFS.
 *
 *   node --import tsx scripts/battle-audio.ts voice [--force]   out/battle/vo/<id>.mp3 (mmx)
 *   node --import tsx scripts/battle-audio.ts                   out/battle/soundtrack.wav
 *
 * JINGLE=<path> overrides the jingle (default: ../advantage-pr/assets/video-assets/music/
 * reading-advantage-jingle.mp3). Deterministic apart from the voice generation.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { MUSIC, SFX, SLOW, T, VOICE, type SfxKind } from '../src/showcase/battle/timeline.js';

const ROOT = process.cwd();
const DIR = join(ROOT, 'out', 'battle');
const VO_DIR = join(DIR, 'vo');
const JINGLE = process.env.JINGLE ?? join(ROOT, '..', 'advantage-pr', 'assets', 'video-assets', 'music', 'reading-advantage-jingle.mp3');
const VOICE_ID = 'Thai_Optimistic_girl';
const MODEL = 'speech-2.8-hd';

const SR = 44100;
const N = Math.ceil((T.end + 0.5) * SR);
const TAU = Math.PI * 2;

// ---------------------------------------------------------------- voice
function voice(force: boolean): void {
  mkdirSync(VO_DIR, { recursive: true });
  for (const v of VOICE) {
    const out = join(VO_DIR, `${v.id}.mp3`);
    if (existsSync(out) && !force) {
      console.log(`voice  ${out} (kept)`);
      continue;
    }
    execFileSync('mmx', ['speech', 'synthesize', '--text', v.text, '--voice', VOICE_ID, '--model', MODEL, ...(v.speed ? ['--speed', String(v.speed)] : []), '--out', out, '--quiet'], { stdio: 'inherit' });
    console.log(`voice  ${out}`);
  }
}

/** Decode any audio file to float samples at SR (mono or stereo). */
function decode(file: string, channels: 1 | 2): Float32Array {
  const buf = execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-ac', String(channels), '-ar', String(SR), '-f', 'f32le', '-'], { maxBuffer: 1 << 30 });
  return new Float32Array(buf.buffer, buf.byteOffset, buf.length / 4);
}

/** The first and last sample above the threshold: the speech without its silence. */
function trim(x: Float32Array): Float32Array {
  const thr = 0.015;
  let a = 0;
  while (a < x.length && Math.abs(x[a]!) < thr) a++;
  let b = x.length - 1;
  while (b > a && Math.abs(x[b]!) < thr) b--;
  return x.subarray(Math.max(0, a - Math.round(0.02 * SR)), Math.min(x.length, b + Math.round(0.08 * SR)));
}

// ---------------------------------------------------------------- the mix buffers
const L = new Float32Array(N);
const R = new Float32Array(N);
let seed = 424242;
function rand(): number {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const noise = (): number => rand() * 2 - 1;
const midi = (m: number): number => 440 * Math.pow(2, (m - 69) / 12);

function put(t0: number, dur: number, gain: number, pan: number, voiceFn: (t: number, i: number) => number): void {
  const s0 = Math.max(0, Math.floor(t0 * SR));
  const n = Math.min(N - s0, Math.floor(dur * SR));
  const gl = gain * Math.cos(((pan + 1) * Math.PI) / 4);
  const gr = gain * Math.sin(((pan + 1) * Math.PI) / 4);
  for (let i = 0; i < n; i++) {
    const v = voiceFn(i / SR, i);
    L[s0 + i]! += v * gl;
    R[s0 + i]! += v * gr;
  }
}
function env(t: number, dur: number, attack: number, release: number): number {
  if (t < attack) return t / attack;
  if (t > dur - release) return Math.max(0, (dur - t) / release);
  return 1;
}
function bell(t0: number, f: number, gain: number, pan = 0): void {
  put(t0, 1.6, gain, pan, (t) => (Math.sin(TAU * f * t) + 0.35 * Math.sin(TAU * 2.76 * f * t) * Math.exp(-t * 6)) * Math.exp(-t * 2.8) * Math.min(1, t / 0.002));
}
function kick(t0: number, gain: number): void {
  let ph = 0;
  put(t0, 0.45, gain, 0, (t) => {
    ph += (45 + 110 * Math.exp(-t * 28)) / SR;
    return Math.sin(TAU * ph) * Math.exp(-t * 7);
  });
}
function whoosh(t0: number, g: number, dur = 0.7): void {
  let lp = 0;
  put(t0, dur, g, 0, (t) => {
    const u = t / dur;
    const a = Math.sin(Math.PI * u) ** 2;
    lp += (0.03 + 0.25 * a) * (noise() - lp);
    return lp * a * 2.2;
  });
}

// ---------------------------------------------------------------- sound effects
const FX: Record<SfxKind, (t: number, g: number, dur: number) => void> = {
  whoosh: (t, g) => whoosh(t, 0.5 * g),
  swoosh: (t, g) => whoosh(t, 0.4 * g, 0.3),
  rumble: (t, g) => {
    let lp = 0;
    put(t, 2.2, 0.55 * g, 0, (x) => {
      lp += 0.012 * (noise() - lp);
      return lp * 7 * env(x, 2.2, 0.15, 1.2);
    });
  },
  growl: (t, g) => {
    let lp = 0;
    let ph = 0;
    put(t, 1.3, 0.35 * g, 0.25, (x) => {
      ph += (70 + 12 * Math.sin(TAU * 9 * x)) / SR;
      const saw = (ph % 1) * 2 - 1;
      lp += 0.06 * (saw * 0.7 + noise() * 0.5 - lp);
      return lp * 2 * env(x, 1.3, 0.1, 0.6);
    });
  },
  roar: (t, g) => {
    let lp = 0;
    let ph = 0;
    put(t, 2.1, 0.5 * g, 0.15, (x) => {
      const f = 90 + 28 * Math.sin(TAU * 6 * x) - 25 * x;
      ph += f / SR;
      const saw = (ph % 1) * 2 - 1;
      lp += 0.09 * (saw * 0.8 + noise() * 0.65 - lp);
      return lp * 2.3 * env(x, 2.1, 0.07, 0.9);
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
  clang: (t, g) => {
    const pan = rand() * 0.8 - 0.4;
    put(t, 0.9, 0.16 * g, pan, (x) => ([523, 1307, 2210, 3450] as const).reduce((a, f, i) => a + Math.sin(TAU * f * (1 + rand() * 0.0005) * x) * Math.exp(-x * (4 + i * 3)), 0));
  },
  horn: (t, g) => {
    // A war horn: two notes, a fifth apart, with a slow swell.
    for (const [f, off] of [[98, 0], [147, 0.02]] as const) {
      let lp = 0;
      let ph = 0;
      put(t + off, 1.7, 0.22 * g, off ? 0.15 : -0.15, (x) => {
        ph += (f * (1 + 0.004 * Math.sin(TAU * 5.5 * x))) / SR;
        const saw = (ph % 1) * 2 - 1;
        lp += 0.05 * (saw - lp);
        return lp * 2.4 * env(x, 1.7, 0.25, 0.5);
      });
    }
  },
  stampede: (t, g, dur) => {
    // Hundreds of feet: random low thumps, denser and louder toward the clash, over a rumble.
    let lp = 0;
    put(t, dur, 0.35 * g, 0, (x) => {
      lp += 0.01 * (noise() - lp);
      return lp * 6 * Math.min(1, x / 1.2) * (0.6 + 0.4 * (x / dur));
    });
    const steps = Math.round(dur * 26);
    for (let i = 0; i < steps; i++) {
      const at = t + rand() * dur;
      const k = (at - t) / dur;
      let ph = 0;
      put(at, 0.12, (0.06 + 0.06 * k) * g, rand() * 1.6 - 0.8, (x) => {
        ph += (55 + 60 * Math.exp(-x * 40)) / SR;
        return (Math.sin(TAU * ph) + noise() * 0.25) * Math.exp(-x * 30);
      });
    }
  },
  slowdown: (t, g, dur) => {
    // Slow motion: a deep falling tone and a swell of air that grows into the impact.
    let ph = 0;
    put(t, dur, 0.3 * g, 0, (x) => {
      ph += (70 - 30 * (x / dur)) / SR;
      return Math.sin(TAU * ph) * Math.min(1, x / 0.3) * 0.8;
    });
    let lp = 0;
    put(t, dur, 0.5 * g, 0, (x) => {
      const u = x / dur;
      lp += (0.01 + 0.2 * u * u) * (noise() - lp);
      return lp * 2.4 * u * u;
    });
  },
  impact: (t, g) => {
    let ph = 0;
    put(t, 2.2, 0.75 * g, 0, (x) => {
      ph += (28 + 90 * Math.exp(-x * 9)) / SR;
      return Math.sin(TAU * ph) * Math.exp(-x * 1.8) + noise() * 0.35 * Math.exp(-x * 9);
    });
    kick(t, 0.9 * g);
    for (let i = 0; i < 5; i++) FX.clang(t + i * 0.015, 1.4 * g, 0);
    let lp = 0;
    put(t, 1.6, 0.35 * g, 0, (x) => {
      lp += 0.08 * (noise() - lp);
      return lp * 2 * Math.exp(-x * 3);
    });
  },
  boing: (t, g) => {
    let ph = 0;
    put(t, 0.22, 0.25 * g, 0, (x) => {
      ph += (220 + 520 * Math.min(1, x / 0.1)) / SR;
      return Math.sin(TAU * ph) * Math.exp(-x * 14) * Math.min(1, x / 0.004);
    });
  },
  sparkle: (t, g) => {
    const pent = [0, 2, 4, 7, 9];
    for (let i = 0; i < 8; i++) bell(t + i * 0.06, midi(84 + pent[Math.floor(rand() * 5)]! + (i > 3 ? 12 : 0)), 0.07 * g, rand() * 1.4 - 0.7);
  },
  wind: (t, g, dur) => {
    let lp = 0;
    let lp2 = 0;
    put(t, dur, 0.4 * g, 0, (x) => {
      const gust = 0.6 + 0.4 * Math.sin(TAU * 0.23 * x) * Math.sin(TAU * 0.11 * x + 1);
      lp += 0.02 * (noise() - lp);
      lp2 += 0.3 * (lp - lp2);
      return (lp - lp2 * 0.5) * 3 * gust * env(x, dur, 0.8, 1.5);
    });
  },
};

// ---------------------------------------------------------------- the mix
function soundtrack(): void {
  // Voice first: its placement decides where the music ducks.
  const vo = new Float32Array(N);
  const spans: [number, number][] = [];
  for (const v of VOICE) {
    const file = join(VO_DIR, `${v.id}.mp3`);
    if (!existsSync(file)) throw new Error(`missing ${file}: run "battle-audio.ts voice" first`);
    const x = trim(decode(file, 1));
    const s0 = Math.round(v.t * SR);
    for (let i = 0; i < x.length && s0 + i < N; i++) vo[s0 + i]! += x[i]! * 1.0;
    spans.push([v.t, v.t + x.length / SR]);
    console.log(`voice  ${v.id} at ${v.t.toFixed(2)} s, ${(x.length / SR).toFixed(2)} s long`);
  }

  // The jingle sections with their gain curve.
  const jingle = decode(JINGLE, 2);
  const jl = (i: number): number => jingle[i * 2] ?? 0;
  const jr = (i: number): number => jingle[i * 2 + 1] ?? 0;
  const duck = (t: number): number => {
    let d = 0;
    for (const [a, b] of spans) {
      if (t > a - 0.3 && t < b + 0.45) d = Math.max(d, Math.min(1, (t - (a - 0.3)) / 0.3, (b + 0.45 - t) / 0.45));
    }
    return 1 - 0.58 * d;
  };
  const base = (t: number): number => {
    if (t < T.charge - 0.4) return 0.55;
    if (t < T.charge) return 0.55 + 0.35 * ((t - (T.charge - 0.4)) / 0.4);
    if (t < T.slow) return 0.9;
    if (t < T.impact) return 0.9 - 0.25 * ((t - T.slow) / (T.impact - T.slow));
    return 0.6;
  };
  let lpL = 0;
  let lpR = 0;
  for (const m of MUSIC) {
    const a = Math.round(m.from * SR);
    const b = Math.min(N, Math.round(m.to * SR));
    const src = Math.round(m.src * SR);
    for (let i = a; i < b; i++) {
      const t = i / SR;
      let g = base(t) * duck(t);
      g *= Math.min(1, (t - m.from) / 0.25 + (m.from === 0 ? 1 : 0)); // fade in (not at the very start)
      g *= Math.min(1, (m.to - t) / (m.to === T.impact ? 0.02 : 1.6)); // a hard cut at the impact, a soft end
      let l = jl(src + i - a);
      let r = jr(src + i - a);
      // Slow motion: the music sinks into a low-pass.
      if (t >= T.slow && t < T.impact) {
        const k = (t - T.slow) / (T.impact - T.slow);
        const c = 0.9 - 0.82 * Math.sqrt(k) * (1 - SLOW);
        lpL += c * (l - lpL);
        lpR += c * (r - lpR);
        l = lpL;
        r = lpR;
      } else {
        lpL = l;
        lpR = r;
      }
      L[i]! += l * g;
      R[i]! += r * g;
    }
  }
  for (const s of SFX) FX[s.kind](s.t, s.gain ?? 1, s.dur ?? 1);
  for (let i = 0; i < N; i++) {
    L[i]! += vo[i]!;
    R[i]! += vo[i]!;
  }

  // Soft-limit, write 16-bit PCM, and normalize the loudness for video platforms.
  let peak = 0;
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    const f = t > T.end - 0.5 ? Math.max(0, (T.end + 0.05 - t) / 0.55) : 1;
    L[i] = Math.tanh(L[i]! * f);
    R[i] = Math.tanh(R[i]! * f);
    peak = Math.max(peak, Math.abs(L[i]!), Math.abs(R[i]!));
  }
  const norm = peak > 0 ? 0.95 / peak : 1;
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
  mkdirSync(DIR, { recursive: true });
  const raw = join(DIR, 'soundtrack.raw.wav');
  writeFileSync(raw, Buffer.concat([header, data]));
  const out = join(DIR, 'soundtrack.wav');
  const ff = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', raw, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-ar', String(SR), '-t', String(T.end), out], { stdio: 'inherit' });
  if (ff.status !== 0) throw new Error('ffmpeg loudnorm failed');
  rmSync(raw);
  console.log(`audio  ${out}  ${T.end.toFixed(1)} s`);
}

const [cmd, ...rest] = process.argv.slice(2);
if (cmd === 'voice') voice(rest.includes('--force'));
else soundtrack();
