/** The game constants. The arc uses meters and seconds. */
export const TUNING = {
  lanes: 3,
  helperLanes: 2,
  wordsPerWave: 5,
  coins: 10,
  streakCoins: 5,
  maxStreakBonus: 25,
  maxCourage: 5,
  restCourage: 3,
  aim: { minAngle: 0, maxAngle: 80, minPower: 10, maxPower: 100 },
  arc: { origin: { x: 1, y: 3 }, gravity: 9.8, dt: 0.1, maxSpeed: 22, maxSteps: 100 },
} as const;
