/**
 * Sound for the demo, synthesized with Web Audio (no files to download): short effects for the
 * battle and a soft looping vault tune. Everything starts after the first tap (browser rule).
 */
type Sfx = 'tap' | 'correct' | 'wrong' | 'hit' | 'whoosh' | 'spawn' | 'roar' | 'victory' | 'heal' | 'defeat' | 'page';

class Sound {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private timer = 0;
  private nextNote = 0;
  private step = 0;
  private mood: 'calm' | 'battle' | 'boss' | 'none' = 'none';
  muted = false;

  /** Call from a user gesture. */
  unlock(): void {
    if (this.ctx) {
      void this.ctx.resume();
      return;
    }
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.8;
    this.master.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.22;
    this.musicGain.connect(this.master);
  }

  setMuted(m: boolean): void {
    this.muted = m;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.8, this.ctx.currentTime, 0.05);
  }

  private tone(freq: number, dur: number, type: OscillatorType, gain: number, when = 0, slide = 0, dest?: AudioNode): void {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const t = ctx.currentTime + when;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(dest ?? this.master);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  private noise(dur: number, gain: number, cutoff: number, when = 0): void {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const t = ctx.currentTime + when;
    const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = cutoff;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(this.master);
    src.start(t);
  }

  play(s: Sfx): void {
    if (!this.ctx) return;
    switch (s) {
      case 'tap':
        this.tone(700, 0.06, 'sine', 0.15, 0, 0.7);
        break;
      case 'page':
        this.noise(0.12, 0.12, 2400);
        break;
      case 'correct':
        [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.35, 'triangle', 0.18, i * 0.07));
        break;
      case 'wrong':
        this.tone(330, 0.22, 'triangle', 0.16, 0, 0.8);
        this.tone(262, 0.32, 'triangle', 0.14, 0.14, 0.85);
        break;
      case 'hit':
        this.tone(140, 0.25, 'sine', 0.5, 0, 0.4);
        this.noise(0.14, 0.25, 1800);
        break;
      case 'whoosh':
        this.noise(0.35, 0.22, 900);
        break;
      case 'spawn':
        this.tone(110, 0.8, 'sawtooth', 0.12, 0, 0.6);
        this.noise(0.6, 0.12, 500);
        break;
      case 'roar':
        this.tone(95, 1.4, 'sawtooth', 0.25, 0, 0.55);
        this.tone(140, 1.2, 'square', 0.08, 0.05, 0.6);
        this.noise(1.2, 0.3, 700);
        break;
      case 'defeat':
        [392, 330, 262].forEach((f, i) => this.tone(f, 0.25, 'triangle', 0.12, i * 0.09, 0.9));
        break;
      case 'heal':
        [1047, 1319, 1568, 2093].forEach((f, i) => this.tone(f, 0.4, 'sine', 0.08, i * 0.06));
        break;
      case 'victory':
        [523, 659, 784, 1047, 784, 1047].forEach((f, i) => this.tone(f, i === 5 ? 0.9 : 0.28, 'square', 0.1, i * 0.13));
        break;
    }
  }

  /** A soft looping tune: bells over a low drone in the vault; faster for the boss. */
  music(mood: 'calm' | 'battle' | 'boss' | 'none'): void {
    this.mood = mood;
    if (!this.ctx) return;
    if (mood === 'none') {
      window.clearInterval(this.timer);
      this.timer = 0;
      return;
    }
    if (this.timer) return;
    this.nextNote = this.ctx.currentTime + 0.1;
    this.timer = window.setInterval(() => this.schedule(), 100);
  }

  private schedule(): void {
    const ctx = this.ctx;
    if (!ctx || !this.musicGain) return;
    const bpm = this.mood === 'boss' ? 132 : this.mood === 'battle' ? 104 : 80;
    const eighth = 60 / bpm / 2;
    // A minor: i - VI - VII - v, one bar each.
    const chords = [
      [57, 60, 64],
      [53, 57, 60],
      [55, 59, 62],
      [52, 55, 59],
    ];
    while (this.nextNote < ctx.currentTime + 0.3) {
      const when = this.nextNote - ctx.currentTime;
      const bar = Math.floor(this.step / 8) % 4;
      const k = this.step % 8;
      const chord = chords[bar]!;
      const hz = (m: number): number => 440 * Math.pow(2, (m - 69) / 12);
      if (k === 0) this.tone(hz(chord[0]! - 24), eighth * 7.5, 'triangle', 0.35, when, 0, this.musicGain);
      const arp = [0, 1, 2, 1, 0, 2, 1, 2][k]!;
      if (this.mood !== 'calm' || k % 2 === 0) this.tone(hz(chord[arp]! + 12), eighth * 1.6, 'sine', 0.22, when, 0, this.musicGain);
      if (this.mood === 'boss' && (k === 0 || k === 4)) this.tone(70, 0.18, 'sine', 0.6, when, 0.4, this.musicGain);
      this.nextNote += eighth;
      this.step++;
    }
  }
}

export const sound = new Sound();
