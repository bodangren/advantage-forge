/**
 * The battle teaser timeline, shared by the page (main.ts) and the soundtrack builder
 * (scripts/battle-audio.ts). Every cut sits on a beat of the Reading Advantage jingle.
 * See docs/guild-battle-teaser.md.
 */

/** The jingle's beat (seconds) and its first beat. */
export const BEAT = 0.742;
export const BEAT0 = 0.41;
export const beat = (k: number): number => +(BEAT0 + BEAT * k).toFixed(3);

/** Video times of the parts (seconds). */
export const T = {
  horde: beat(7), // 5.604
  hordeReveal: beat(15), // 11.54
  heroes: beat(23), // 17.476
  heroesReady: beat(31), // 23.412
  charge: beat(36), // 27.122
  slow: beat(46), // 34.542
  impact: beat(49), // 36.768
  after: beat(50), // 37.51
  endcard: 39.3,
  end: 45,
} as const;

/** Slow motion from T.slow to the impact. */
export const SLOW = 0.3;

/** World time (actors, dust) for a video time: slow motion before the impact, normal after it. */
export function worldTime(t: number): number {
  if (t < T.slow || t >= T.impact) return t;
  return T.slow + (t - T.slow) * SLOW;
}

/** World time of the impact: the leaders meet here. */
export const IMPACT = T.slow + (T.impact - T.slow) * SLOW;

/** Both armies start to run on this beat (world time). */
export const RUN = T.charge;

/** The heroes raise their weapons on this beat (world time). */
export const READY = beat(34); // 25.638

/** The dragon's roars (world time); the soundtrack uses the same times. */
export const DRAGON_ROARS = [beat(22) + 0.05, beat(38)]; // 16.78 (the last cut of the 9:16 parade), 28.61
export const DRAGON_TAKEOFF = beat(39) + 0.2;

/** Owner decisions (2026-09-30): the numbers on screen. */
export const ENEMY_KINDS = 68;
export const HERO_CLASSES = 15;

/** Thai voice-over (mmx speech, Thai_Optimistic_girl, speech-2.8-hd). Drafts for native review. */
export const VOICE = [
  { id: 'vo1', t: 1.55, text: 'ขอแนะนำ ชิบิ เควสต์ค่ะ' },
  { id: 'vo2', t: 8.3, text: 'ศัตรูหกสิบแปดแบบ รอท้าทายอยู่ค่ะ' },
  { id: 'vo3', t: 18.9, text: 'ฮีโร่สิบห้าคลาส พร้อมออกผจญภัยค่ะ' },
  { id: 'vo4', t: 24.15, text: 'พร้อมหรือยังคะ' },
  { id: 'vo5', t: 38.55, text: 'เร็ว ๆ นี้ ใน ไพรมารี แอดแวนเทจ และ ทิวเตอร์ แอดแวนเทจนะคะ' },
] as { id: string; t: number; text: string; speed?: number }[];

/** Jingle sections: video from..to plays the jingle from `src` seconds. */
export const MUSIC = [
  { from: 0, to: T.impact, src: 0 },
  { from: T.after, to: T.end, src: beat(131) }, // 97.61: the song's own fade-out
] as const;

export type SfxKind = 'whoosh' | 'swoosh' | 'rumble' | 'roar' | 'fanfare' | 'clang' | 'horn' | 'stampede' | 'slowdown' | 'impact' | 'boing' | 'sparkle' | 'wind' | 'growl';

/** Sound effects (video time). */
export const SFX: { t: number; kind: SfxKind; gain?: number; dur?: number }[] = [
  { t: 0.05, kind: 'whoosh', gain: 0.5 },
  { t: T.horde - 0.05, kind: 'rumble', gain: 0.7 },
  { t: T.horde + 0.25, kind: 'growl', gain: 0.6 },
  { t: DRAGON_ROARS[0]!, kind: 'roar', gain: 1 },
  { t: T.heroes, kind: 'fanfare', gain: 0.9 },
  { t: READY, kind: 'clang', gain: 1.1 },
  { t: READY + 0.12, kind: 'clang', gain: 0.8 },
  { t: T.charge - 0.35, kind: 'horn', gain: 1 },
  { t: T.charge, kind: 'stampede', gain: 1, dur: T.slow - T.charge },
  { t: DRAGON_ROARS[1]!, kind: 'roar', gain: 0.8 },
  { t: beat(39), kind: 'whoosh', gain: 0.6 },
  { t: beat(42), kind: 'whoosh', gain: 0.6 },
  { t: beat(44), kind: 'whoosh', gain: 0.9 },
  { t: T.slow, kind: 'slowdown', gain: 1, dur: T.impact - T.slow },
  { t: T.impact, kind: 'impact', gain: 1.2 },
  { t: T.after, kind: 'wind', gain: 0.5, dur: T.end - T.after },
  { t: T.endcard, kind: 'sparkle', gain: 0.9 },
];

/** The slime's hops in the aftermath (video time); each lands with a boing. */
export const SLIME_HOPS = { from: T.after + 0.4, to: 40.9, every: 0.62 };
for (let t = SLIME_HOPS.from + 0.3; t < SLIME_HOPS.to; t += SLIME_HOPS.every) SFX.push({ t, kind: 'boing', gain: 0.45 });
