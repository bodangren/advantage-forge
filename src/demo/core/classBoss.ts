/**
 * The class boss: a simulated class of 30 shares one weekly dragon. The student's correct answers
 * add damage to the class total. It shows asynchronous co-op; nothing is ranked.
 */
import { createRng } from './rng.js';
import type { ClassBossReport, Classmate } from './types.js';

export const CLASS_SIZE = 30;
export const BOSS_NAME = 'Ember, the Fire Dragon';
export const BOSS_HP = 600;
/** The student's damage = correct answers x this. */
export const DAMAGE_PER_CORRECT = 2;
const HELPERS_SHOWN = 5;

/** Thai nicknames in Latin letters. More than the class size, so a seed picks a different mix. */
// prettier-ignore
const NICKNAMES = [
  'Ploy', 'Bank', 'Mint', 'Nam', 'Fah', 'Beam', 'Nook', 'Ice', 'Gift', 'Boss',
  'Praew', 'Tang', 'Mook', 'Pim', 'Aom', 'Kwan', 'Fern', 'Oat', 'Toey', 'Bell',
  'Nong', 'Nan', 'Pae', 'Earn', 'Bua', 'Fluke', 'Cake', 'Mild', 'Ohm', 'Gun',
  'Tle', 'Poom', 'Prim', 'Kaew', 'Bright', 'Champ', 'Dew', 'Jane', 'Noey', 'Petch',
];

/**
 * Report on the boss after the student's contribution. `yourDamage` is the student's damage this
 * quest (`correctAnswers * DAMAGE_PER_CORRECT`). The same seed gives the same class and week.
 */
export function simulateClassBoss(seed: number, yourDamage: number): ClassBossReport {
  const rng = createRng(seed);
  const you: Classmate = { name: 'You', damage: Math.max(0, Math.floor(yourDamage)) };
  // 29 classmates with distinct names; the student is the 30th.
  const names = rng.sample(NICKNAMES, CLASS_SIZE - 1);
  // About 60% to 80% of the class has played this week, each dealing 5 to 25 damage.
  const playedCount = Math.round((CLASS_SIZE - 1) * (0.6 + rng.next() * 0.2));
  const classmates: Classmate[] = names.map((name, i) => ({
    name,
    damage: i < playedCount ? rng.range(5, 25) : 0,
  }));
  // Play order this week (who helped most recently), not damage order.
  const played = rng.shuffle(classmates.filter((c) => c.damage > 0));

  const classDamage = played.reduce((sum, c) => sum + c.damage, 0);
  const hpBefore = Math.max(0, BOSS_HP - classDamage);
  const hpAfter = Math.max(0, hpBefore - you.damage);
  return {
    bossName: BOSS_NAME,
    maxHp: BOSS_HP,
    hpBefore,
    hpAfter,
    yourDamage: you.damage,
    classSize: CLASS_SIZE,
    played: played.length + 1,
    helpers: [you, ...played.slice(0, HELPERS_SHOWN - 1)],
    defeated: hpAfter === 0,
  };
}
