/**
 * The two armies of the battle teaser: who stands where, how everyone moves, and which clip
 * plays when. Everything is a pure function of the roster and world time, so every frame is
 * repeatable. The horde stands east (+X) and faces west; the heroes stand west and face east.
 */
import { DRAGON_ROARS, DRAGON_TAKEOFF, IMPACT, READY, RUN, T, beat } from './timeline.js';

export type V3 = readonly [number, number, number];

export interface RosterEntry {
  name: string;
  side: 'hero' | 'enemy' | 'monster';
  group: string;
  height: number;
  width: number;
  depth: number;
  clips: string[];
  presets: string[];
  committed: boolean;
}

export interface Cue {
  /** World time. */
  t: number;
  clip: string;
  loop?: boolean;
  /** Play the clip at the speed that matches the unit's ground speed (no foot sliding). */
  stride?: boolean;
  /** A one-shot clip that returns to the idle loop when it ends. */
  back?: boolean;
  /** Scale a one-shot clip so that `at` of it (0..1) plays at world time `fit`. */
  fit?: number;
  at?: number;
  speed?: number;
  offset?: number;
}

export type UnitKind = 'ground' | 'float' | 'fly' | 'leader' | 'dragon' | 'slime';

export interface Unit {
  id: string;
  asset: string;
  preset: string | null;
  side: 'hero' | 'enemy';
  kind: UnitKind;
  /** Home position on the ground (x, z). */
  x: number;
  z: number;
  yaw: number;
  scale: number;
  /** Scaled height (meters). */
  height: number;
  rank: number;
  /** Delay after RUN before this unit starts to run. */
  delay: number;
  hover: number;
  seed: number;
  /** English display name for name tags. */
  label: string;
  committed: boolean;
  cues: Cue[];
}

// ---------------------------------------------------------------- the field
/** Ground height: a low hill behind the heroes and a rise behind the horde. */
export function ground(x: number, z: number): number {
  const hill = 1.7 * Math.exp(-((x + 31) ** 2 / 42 + z ** 2 / 320));
  const rise = 1.3 * Math.exp(-((x - 40) ** 2 / 36 + (z + 2) ** 2 / 90));
  return hill + rise;
}

/** Ground speed of a running army (m/s) and the time to reach it. */
export const ACCEL = 0.5;
/** Front ranks start here and reach +-1.35 m at the impact. */
export const FRONT = 20.2;
export const LEADER_FRONT = 19.35;
export const SPEED = (FRONT - 1.35) / (IMPACT - RUN - ACCEL / 2);
/** The leaders jump for this long (world time) before the impact. */
export const LEAP = 0.55;

/** Distance run after `u` seconds of running. */
function runDistance(u: number, speed: number): number {
  if (u <= 0) return 0;
  if (u < ACCEL) return (speed * u * u) / (2 * ACCEL);
  return speed * (u - ACCEL / 2);
}

/** The x of a side's front rank (both armies are symmetric). */
export function frontX(side: 'hero' | 'enemy', tau: number): number {
  const d = runDistance(tau - RUN, SPEED);
  return side === 'hero' ? -FRONT + d : FRONT - d;
}

export interface Pose {
  x: number;
  y: number;
  z: number;
  yaw: number;
  visible: boolean;
}

const DRAGON_PERCH: V3 = [39, 0, -3.5];
const BOULDER_TOP = 1.15; // the boulder at 1.6x

/** A unit's position at world time tau (video time t decides visibility). */
export function unitPose(u: Unit, tau: number, t: number): Pose {
  if (u.kind === 'slime') return slimePose(t);
  const visible = t < T.impact;
  if (u.kind === 'dragon') return { ...dragonPose(tau), visible };
  const dir = u.side === 'hero' ? 1 : -1;
  const speed = u.kind === 'fly' ? SPEED * 1.12 : SPEED;
  const x = u.x + dir * runDistance(tau - RUN - u.delay, speed);
  let y = ground(x, u.z);
  if (u.kind === 'float') y += u.hover + 0.12 * Math.sin(tau * 1.9 + u.seed * 7);
  if (u.kind === 'fly') y += u.hover + 0.25 * Math.sin(tau * 2.6 + u.seed * 5);
  if (u.kind === 'leader') {
    const p = (tau - (IMPACT - LEAP)) / LEAP;
    if (p > 0) y += 0.95 * Math.sin((Math.PI / 2) * Math.min(1, p));
  }
  return { x, y, z: u.z, yaw: u.yaw, visible };
}

function catmull(p0: number, p1: number, p2: number, p3: number, s: number): number {
  const s2 = s * s;
  return 0.5 * (2 * p1 + (-p0 + p2) * s + (2 * p0 - 5 * p1 + 4 * p2 - p3) * s2 + (-p0 + 3 * p1 - 3 * p2 + p3) * s2 * s);
}

/** The dragon: perched on a boulder behind the horde, then a flight over the battle. */
const DRAGON_PATH: { t: number; p: V3 }[] = [
  { t: DRAGON_TAKEOFF, p: [DRAGON_PERCH[0], ground(DRAGON_PERCH[0], DRAGON_PERCH[2]) + BOULDER_TOP, DRAGON_PERCH[2]] },
  { t: DRAGON_TAKEOFF + 1.4, p: [33, 5.5, -2.5] },
  { t: beat(43), p: [16, 8.5, -0.5] },
  { t: IMPACT, p: [2, 8, 1.5] },
  { t: IMPACT + 1, p: [-8, 8, 2.5] },
];

function dragonPose(tau: number): Omit<Pose, 'visible'> {
  const k = DRAGON_PATH;
  if (tau <= k[0]!.t) return { x: k[0]!.p[0], y: k[0]!.p[1], z: k[0]!.p[2], yaw: -90 };
  let i = 0;
  while (i < k.length - 2 && tau >= k[i + 1]!.t) i++;
  const a = k[i]!;
  const b = k[i + 1]!;
  const s = Math.min(1, Math.max(0, (tau - a.t) / (b.t - a.t)));
  const p0 = (k[i - 1] ?? a).p;
  const p3 = (k[i + 2] ?? b).p;
  const at = [0, 1, 2].map((j) => catmull(p0[j]!, a.p[j]!, b.p[j]!, p3[j]!, s)) as unknown as V3;
  // Face the direction of flight.
  const ahead = [0, 1, 2].map((j) => catmull(p0[j]!, a.p[j]!, b.p[j]!, p3[j]!, Math.min(1, s + 0.02))) as unknown as V3;
  const dx = ahead[0] - at[0];
  const dz = ahead[2] - at[2];
  const yaw = Math.hypot(dx, dz) > 1e-4 ? (Math.atan2(dx, dz) * 180) / Math.PI : -90;
  return { x: at[0], y: at[1], z: at[2], yaw };
}

/** The aftermath: one slime hops across the empty field toward the camera. */
export const SLIME = { from: [-0.6, -12.5] as const, to: [0.15, 3.6] as const, t0: T.after + 0.4, t1: 40.9 };

function slimePose(t: number): Pose {
  const u = Math.min(1, Math.max(0, (t - SLIME.t0) / (SLIME.t1 - SLIME.t0)));
  const x = SLIME.from[0] + (SLIME.to[0] - SLIME.from[0]) * u;
  const z = SLIME.from[1] + (SLIME.to[1] - SLIME.from[1]) * u;
  return { x, y: ground(x, z), z, yaw: 0, visible: t >= T.after };
}

// ---------------------------------------------------------------- the formations
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const LABELS: Record<string, string> = { 'dragon-fire': 'Fire Dragon' };
export const labelOf = (name: string): string =>
  LABELS[name] ?? name.split('-').map((w) => w[0]!.toUpperCase() + w.slice(1)).join(' ');

/** Big brutes stand taller so the back of the horde reads as a wall. */
const SCALE: Record<string, number> = {
  'ogre-brute': 1.2,
  'troll-guard': 1.3,
  'iron-golem': 1.35,
  'stone-golem': 1.4,
  'crystal-golem': 1.35,
  'clay-golem': 1.35,
  'wood-golem': 1.35,
  'bone-golem': 1.3,
  'minotaur-guard': 1.3,
  'orc-warlord': 1.2,
  'orc-shaman': 1.1,
  'gnoll-warrior': 1.1,
  'dire-wolf': 1.25,
  'giant-spider': 1.4,
  'giant-rat': 1.15,
  gargoyle: 1.1,
  'dragon-fire': 2.6,
};

const FLOATERS = new Set(['ghost', 'poltergeist', 'wraith', 'specter', 'banshee']);
const FLYERS = new Set(['gargoyle', 'giant-bat', 'imp']);
/** Front-rank elites of the horde (name tags in 16:9, parade in 9:16). */
export const ENEMY_ELITES = ['goblin-king', 'lich', 'vampire-lord', 'minotaur-guard'];
/** Front-rank heroes with name tags. */
export const HERO_ELITES = ['paladin', 'samurai', 'barbarian', 'rogue'];
const HERO_ROLE: Record<string, number> = {
  knight: 0, paladin: 0, samurai: 0, barbarian: 0, monk: 0, rogue: 0, adventurer: 0,
  cleric: 1, priest: 1, bard: 1, druid: 1,
  archer: 2, ranger: 2, mage: 2, wizard: 2,
};

const GROUND_ENEMIES_TARGET = 100;
const HEROES_TARGET = 50;

/** Every look of a model: the base colors first, then each preset. */
function looks(e: RosterEntry): (string | null)[] {
  return [null, ...e.presets];
}

/** Evenly spaced files, symmetric around z = 0 (a lane stays open at z = 0 behind the leader). */
function files(count: number, spacing: number): number[] {
  return Array.from({ length: count }, (_, i) => (i - (count - 1) / 2) * spacing);
}

export interface Army {
  units: Unit[];
  byId: Map<string, Unit>;
  /** Enemy kinds on screen (the enemies family: at least ENEMY_KINDS). */
  enemyKinds: number;
}

export function buildArmy(roster: RosterEntry[]): Army {
  const rand = rng(20260930);
  const units: Unit[] = [];
  let serial = 0;
  const entry = new Map(roster.map((e) => [e.name, e]));
  const make = (e: RosterEntry, preset: string | null, side: 'hero' | 'enemy', kind: UnitKind, x: number, z: number, rank: number): Unit => {
    const scale = SCALE[e.name] ?? 1;
    const u: Unit = {
      id: `${side === 'hero' ? 'h' : 'e'}${serial++}-${e.name}${preset ? `.${preset}` : ''}`,
      asset: e.name,
      preset,
      side,
      kind,
      x: x + (kind === 'leader' ? 0 : (rand() - 0.5) * 0.22),
      z: z + (kind === 'leader' ? 0 : (rand() - 0.5) * 0.22),
      yaw: (side === 'hero' ? 90 : -90) + (kind === 'leader' ? 0 : (rand() - 0.5) * 16),
      scale,
      height: e.height * scale,
      rank,
      delay: 0,
      hover: 0,
      seed: rand(),
      label: labelOf(e.name),
      committed: e.committed,
      cues: [],
    };
    units.push(u);
    return u;
  };

  // ---- the horde
  const enemies = roster.filter((e) => e.side === 'enemy' || e.side === 'monster');
  const groundKinds = enemies.filter(
    (e) => !FLOATERS.has(e.name) && !FLYERS.has(e.name) && e.name !== 'dragon-fire' && e.name !== 'slime' && (e.clips.includes('run') || e.clips.includes('walk')),
  );
  // One of every kind first, then more looks round-robin until the target.
  const picks: { e: RosterEntry; preset: string | null }[] = groundKinds.map((e) => ({ e, preset: null }));
  const extra = groundKinds.filter((e) => e.presets.length > 0).sort(() => rand() - 0.5);
  for (let round = 0; picks.length < GROUND_ENEMIES_TARGET && round < 4; round++)
    for (const e of extra) {
      if (picks.length >= GROUND_ENEMIES_TARGET) break;
      const p = e.presets[round];
      if (p) picks.push({ e, preset: p });
    }
  const leader = entry.get('orc-warlord')!;
  const elites = ENEMY_ELITES.map((n) => picks.find((p) => p.e.name === n && p.preset === null)!).filter(Boolean);
  const rest = picks.filter((p) => !elites.includes(p) && !(p.e.name === leader.name && p.preset === null));
  rest.sort((a, b) => a.e.height * (SCALE[a.e.name] ?? 1) - b.e.height * (SCALE[b.e.name] ?? 1) + (rand() - 0.5) * 0.12);
  make(leader, null, 'enemy', 'leader', LEADER_FRONT, 0, 0);
  // Rank 0: the elites at fixed files, the smallest kinds between them.
  const rank0 = files(12, 1.3);
  const eliteFiles = [rank0[1]!, rank0[4]!, rank0[7]!, rank0[10]!];
  let x = FRONT;
  let queue = [...rest];
  for (const z of rank0) {
    const i = eliteFiles.indexOf(z);
    if (i >= 0 && elites[i]) make(elites[i]!.e, null, 'enemy', 'ground', x, z, 0);
    else {
      // Only committed models in the front rank: they are seen close.
      const k = Math.max(0, queue.findIndex((p) => p.e.committed));
      const [p] = queue.splice(k, 1);
      make(p!.e, p!.preset, 'enemy', 'ground', x, z, 0);
    }
  }
  let rank = 1;
  while (queue.length > 0) {
    const size = Math.max(...queue.slice(0, 12).map((p) => Math.max(p.e.width, p.e.depth) * (SCALE[p.e.name] ?? 1)));
    const count = size > 1.7 ? 8 : size > 1.3 ? 10 : 12;
    const spacing = count === 12 ? 1.3 : count === 10 ? 1.56 : 1.95;
    x += size > 1.3 ? 1.75 : 1.4;
    const row = queue.splice(0, count);
    const zs = files(row.length === count ? count : row.length, spacing);
    row.forEach((p, i) => make(p.e, p.preset, 'enemy', 'ground', x, zs[i]!, rank));
    rank++;
  }
  const backX = x;
  // Ghosts and wraiths float over the middle ranks; bats, imps, and gargoyles fly higher.
  const floatPicks: { name: string; n: number }[] = [
    { name: 'ghost', n: 3 }, { name: 'wraith', n: 2 }, { name: 'specter', n: 2 }, { name: 'poltergeist', n: 2 }, { name: 'banshee', n: 1 },
  ];
  const flyPicks: { name: string; n: number }[] = [{ name: 'gargoyle', n: 3 }, { name: 'giant-bat', n: 4 }, { name: 'imp', n: 3 }];
  let f = 0;
  for (const { name, n } of floatPicks) {
    const e = entry.get(name);
    if (!e) continue;
    for (let i = 0; i < n; i++, f++) {
      const u = make(e, looks(e)[i % looks(e).length]!, 'enemy', 'float', FRONT + 3 + ((f * 3.7) % (backX - FRONT - 4)), -6 + ((f * 5.3) % 12), 90);
      u.hover = 1.35 + rand() * 0.6;
    }
  }
  f = 0;
  for (const { name, n } of flyPicks) {
    const e = entry.get(name);
    if (!e) continue;
    for (let i = 0; i < n; i++, f++) {
      const u = make(e, looks(e)[i % looks(e).length]!, 'enemy', 'fly', FRONT + 4 + ((f * 4.1) % (backX - FRONT)), -7 + ((f * 6.7) % 14), 91);
      u.hover = 3.4 + rand() * 1.8;
    }
  }
  const dragon = entry.get('dragon-fire');
  if (dragon) make(dragon, null, 'enemy', 'dragon', DRAGON_PERCH[0], DRAGON_PERCH[2], 99);

  // ---- the heroes
  const heroes = roster.filter((e) => e.side === 'hero');
  const knight = entry.get('knight')!;
  make(knight, null, 'hero', 'leader', -LEADER_FRONT, 0, 0);
  const heroPicks: { e: RosterEntry; preset: string | null }[] = [];
  for (const e of heroes) for (const p of looks(e)) if (!(e.name === 'knight' && p === null)) heroPicks.push({ e, preset: p });
  const byRole = [0, 1, 2].map((r) => heroPicks.filter((p) => (HERO_ROLE[p.e.name] ?? 1) === r).sort(() => rand() - 0.5));
  // The tagged elites (base colors) always make the cut.
  for (const name of [...HERO_ELITES].reverse()) {
    const i = byRole[0]!.findIndex((p) => p.e.name === name && p.preset === null);
    if (i >= 0) byRole[0]!.unshift(...byRole[0]!.splice(i, 1));
  }
  // 49 heroes in ranks: 20 melee, 13 support, 16 ranged (as many as there are looks).
  const want = [20, 13, 16];
  const chosen = byRole.map((list, r) => list.slice(0, want[r]));
  const deficit = HEROES_TARGET - 1 - chosen.flat().length;
  if (deficit > 0) chosen[0] = [...chosen[0]!, ...byRole[0]!.slice(want[0], want[0]! + deficit)];
  const heroQueue = [...chosen[0]!, ...chosen[1]!, ...chosen[2]!];
  const heroFiles = files(10, 1.3);
  const heroEliteFiles = [heroFiles[1]!, heroFiles[3]!, heroFiles[6]!, heroFiles[8]!];
  for (let r = 0; heroQueue.length > 0; r++) {
    const hx = -FRONT - r * 1.4;
    const row = heroQueue.splice(0, 10);
    const zs = files(row.length, 1.3);
    if (r === 0) {
      // Elites at their files, the others in the gaps.
      const others = row.slice(HERO_ELITES.length);
      let o = 0;
      for (let i = 0; i < 10; i++) {
        const j = heroEliteFiles.indexOf(heroFiles[i]!);
        const p = j >= 0 ? row[j] : others[o++];
        if (p) make(p.e, p.preset, 'hero', 'ground', hx, heroFiles[i]!, 0);
      }
    } else row.forEach((p, i) => make(p.e, p.preset, 'hero', 'ground', hx, zs[i]!, r));
  }

  // ---- delays: the front ranks start on the beat, the ranks behind a little later
  for (const u of units) {
    if (u.kind === 'leader' || u.rank === 0) u.delay = 0;
    else if (u.kind === 'ground') u.delay = Math.min(0.5, u.rank * 0.04 + rand() * 0.18);
    else u.delay = rand() * 0.5;
  }

  const byId = new Map(units.map((u) => [u.id, u]));
  const enemyKinds = new Set(units.filter((u) => u.side === 'enemy' && entry.get(u.asset)?.side === 'enemy').map((u) => u.asset)).size;
  return { units, byId, enemyKinds };
}

// ---------------------------------------------------------------- clips
function gestureOf(e: RosterEntry | undefined, side: 'hero' | 'enemy'): string | null {
  const c = e?.clips ?? [];
  const order = side === 'hero' ? ['victory', 'attack2', 'attack'] : ['taunt', 'roar', 'attack2', 'attack'];
  return order.find((x) => c.includes(x)) ?? null;
}

/**
 * The clip cues of every unit: idle with a few gestures while the camera shows its army, the
 * parade gestures, the heroes' "ready", the run, and the leaders' jump.
 * `spotlight` maps a unit id to a world time for a gesture (the 9:16 parade cuts).
 */
export function assignClips(army: Army, roster: RosterEntry[], spotlight: Map<string, number>): void {
  const rand = rng(7);
  const entry = new Map(roster.map((e) => [e.name, e]));
  for (const u of army.units) {
    const e = entry.get(u.asset);
    const clips = e?.clips ?? [];
    const cues: Cue[] = [{ t: -10, clip: u.kind === 'fly' ? 'fly' : 'idle', loop: true, offset: u.seed * 3 }];
    const gesture = gestureOf(e, u.side);
    const spot = spotlight.get(u.id);
    if (u.kind === 'dragon') {
      cues.push({ t: DRAGON_ROARS[0]!, clip: 'roar', back: true });
      cues.push({ t: DRAGON_ROARS[1]!, clip: 'roar', back: true });
      cues.push({ t: DRAGON_TAKEOFF, clip: 'fly', loop: true });
      u.cues = cues;
      continue;
    }
    if (u.kind === 'slime') {
      cues.push({ t: SLIME.t0, clip: 'walk', loop: true });
      cues.push({ t: SLIME.t1, clip: 'idle', loop: true });
      u.cues = cues;
      continue;
    }
    if (spot !== undefined && gesture) cues.push({ t: spot, clip: gesture, back: true });
    else if (gesture && u.kind !== 'fly' && rand() < 0.35) {
      const window = u.side === 'enemy' ? [T.horde + 0.3, T.heroes - 1.2] : [T.heroes + 0.3, READY - 1.4];
      cues.push({ t: window[0]! + rand() * (window[1]! - window[0]!), clip: gesture, back: true });
    }
    // The heroes raise their weapons; the horde answers.
    if (u.side === 'hero' && clips.includes('victory')) cues.push({ t: READY + rand() * 0.2, clip: 'victory' });
    if (u.side === 'enemy' && u.kind === 'ground' && gesture && gesture !== 'attack' && rand() < 0.6)
      cues.push({ t: READY + 0.35 + rand() * 0.3, clip: gesture, back: true });
    // The charge.
    const start = RUN + u.delay;
    if (u.kind === 'fly') cues.push({ t: start, clip: 'fly', loop: true, speed: 1.3 });
    else {
      const run = clips.includes('run') ? 'run' : 'walk';
      cues.push({ t: start, clip: run, loop: true, stride: true, offset: u.seed });
    }
    if (u.kind === 'leader') cues.push({ t: IMPACT - LEAP, clip: 'attack', fit: IMPACT, at: 0.55 });
    cues.sort((a, b) => a.t - b.t);
    u.cues = cues;
  }
}

/** The aftermath slime (not part of either army). */
export function slimeUnit(roster: RosterEntry[]): Unit | null {
  const e = roster.find((r) => r.name === 'slime');
  if (!e) return null;
  return {
    id: 'slime', asset: 'slime', preset: null, side: 'enemy', kind: 'slime', x: SLIME.from[0], z: SLIME.from[1], yaw: 0, scale: 1.15,
    height: e.height * 1.15, rank: 0, delay: 0, hover: 0, seed: 0.3, label: 'Slime', committed: e.committed,
    cues: [{ t: -10, clip: 'idle', loop: true }, { t: SLIME.t0, clip: 'walk', loop: true }, { t: SLIME.t1, clip: 'idle', loop: true }],
  };
}
