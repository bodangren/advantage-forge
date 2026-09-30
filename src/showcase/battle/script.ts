/**
 * The two shot lists of the battle teaser (16:9 and 9:16) over one shared choreography
 * (army.ts), plus the on-screen text. Shot and caption times are video seconds; actor times
 * are world seconds (see worldTime in timeline.ts). See docs/guild-battle-teaser.md.
 */
import { frontX, ground, type Army, type Unit, type V3 } from './army.js';
import { BANNER } from './field.js';
import { beat, ENEMY_KINDS, HERO_CLASSES, T, worldTime } from './timeline.js';

export type Format = '16x9' | '9x16';

export interface Light {
  /** 'camera': the sun sits behind the camera, `az` degrees to its right and `el` degrees up. */
  key: 'camera' | V3;
  az?: number;
  el?: number;
  keyColor: string;
  keyIntensity: number;
  hemi: [string, string, number];
  /** A weak back light that outlines the subjects. */
  rim: [string, number];
  /** Sky gradient: zenith, horizon. */
  sky: [string, string];
  fog: [string, number, number];
  exposure: number;
  dust: string;
  /** Half size of the shadow box (meters). */
  shadow: number;
}

export interface CamKey {
  t: number;
  pos: V3;
  look: V3;
  fov?: number;
  up?: V3;
}

export interface Shot {
  name: string;
  start: number;
  end: number;
  light: Light;
  keys: CamKey[];
  shake?: [number, number][];
  black?: boolean;
  /** Units (ids) hidden for the shot: the ones that stand between the camera and a portrait. */
  hide?: string[];
}

export type CaptionKind = 'title' | 'counter' | 'tag' | 'endcard';

export interface Caption {
  start: number;
  end: number;
  kind: CaptionKind;
  text?: string;
  /** Tags float above this unit. */
  unit?: string;
  /** Counters: label before and after the number, the target, and when the count runs. */
  pre?: string;
  post?: string;
  to?: number;
  countFrom?: number;
  countTo?: number;
  accent?: string;
  /** Layout slot (CSS class): 'corner' (16:9 top left), 'band' (9:16 center band). */
  slot?: string;
}

export interface Fade {
  t: number;
  half: number;
  color: string;
}

export interface Script {
  format: Format;
  shots: Shot[];
  captions: Caption[];
  fades: Fade[];
}

// ---------------------------------------------------------------- lighting
const L: Record<string, Light> = {
  title: { key: [0.35, 0.72, 0.6], keyColor: '#fff1dc', keyIntensity: 2.7, hemi: ['#d8ecff', '#6d8f45', 0.8], rim: ['#ffffff', 0], sky: ['#4f9ee6', '#e8f5ff'], fog: ['#dcecf7', 50, 190], exposure: 1.05, dust: '#e8dcc4', shadow: 26 },
  horde: { key: 'camera', az: 32, el: 38, keyColor: '#e2e8ff', keyIntensity: 2.7, hemi: ['#9aa8e0', '#3b3448', 0.9], rim: ['#c9b3ff', 1.4], sky: ['#34406b', '#b8a1c9'], fog: ['#ab9abf', 34, 130], exposure: 1.02, dust: '#b8aab8', shadow: 26 },
  heroes: { key: 'camera', az: -30, el: 36, keyColor: '#ffd9a3', keyIntensity: 3.0, hemi: ['#ffe8c8', '#5d7a3a', 0.8], rim: ['#fff2d0', 1.1], sky: ['#4b9be0', '#ffe3bd'], fog: ['#f5dfc4', 45, 170], exposure: 1.05, dust: '#e2cfa8', shadow: 26 },
  charge: { key: [0.18, 0.78, 0.6], keyColor: '#fff0dc', keyIntensity: 2.8, hemi: ['#dbe8ff', '#5d6f45', 0.85], rim: ['#ffffff', 0], sky: ['#5b8fd0', '#f1dcc8'], fog: ['#e6dcd4', 50, 190], exposure: 1.05, dust: '#d9c7a6', shadow: 44 },
  chargeCam: { key: 'camera', az: 25, el: 40, keyColor: '#fff0dc', keyIntensity: 2.8, hemi: ['#dbe8ff', '#5d6f45', 0.85], rim: ['#fff4e0', 0.9], sky: ['#5b8fd0', '#f1dcc8'], fog: ['#e6dcd4', 45, 170], exposure: 1.05, dust: '#d9c7a6', shadow: 24 },
  after: { key: 'camera', az: 40, el: 24, keyColor: '#ffcf96', keyIntensity: 2.6, hemi: ['#ffe0bd', '#6d6a45', 0.85], rim: ['#fff0d0', 0.9], sky: ['#b0927e', '#f6d8b0'], fog: ['#ecd2ae', 10, 75], exposure: 1.05, dust: '#e6cfa6', shadow: 20 },
};
const BLACK: Light = { ...L.title!, sky: ['#000000', '#000000'] };

// ---------------------------------------------------------------- helpers
const heroFront = (t: number): number => frontX('hero', worldTime(t));
const hordeFront = (t: number): number => frontX('enemy', worldTime(t));
const lin = (a: number, b: number, n: number): number[] => Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1));

/** A camera that travels with an army: keys at several times of the shot. */
function follow(start: number, end: number, f: (t: number) => { pos: V3; look: V3; fov?: number; up?: V3 }): CamKey[] {
  return lin(start, end, 5).map((t) => ({ t, ...f(t) }));
}

function findUnit(army: Army, asset: string, want: (u: Unit) => boolean = () => true): Unit | undefined {
  return army.units
    .filter((u) => u.asset === asset && want(u))
    .sort((a, b) => a.rank - b.rank || Math.abs(a.z) - Math.abs(b.z) || (a.preset ? 1 : 0) - (b.preset ? 1 : 0))[0];
}

/** The 9:16 parades: which unit each cut shows (one cut per beat). Shared: the gestures play in both formats. */
export function parades(army: Army): { enemies: { unit: Unit; start: number; end: number }[]; heroes: { unit: Unit; start: number; end: number }[] } {
  const front = army.units.filter((u) => u.side === 'enemy' && u.kind === 'ground' && u.rank === 0 && u.committed);
  const small = front.filter((u) => !['goblin-king', 'lich', 'vampire-lord', 'minotaur-guard'].includes(u.asset)).sort((a, b) => Math.abs(a.z) - Math.abs(b.z));
  const pick = (asset: string): Unit | undefined => findUnit(army, asset, (u) => u.side === 'enemy');
  const e = [
    small[0], pick('goblin-king'), small[1], pick('lich'),
    findUnit(army, 'ghost', (u) => u.kind === 'float'), pick('vampire-lord'), small[2],
    pick('minotaur-guard'), army.units.find((u) => u.side === 'enemy' && u.kind === 'leader'), army.units.find((u) => u.kind === 'dragon'),
  ].filter((u): u is Unit => !!u);
  const h = [
    army.units.find((u) => u.side === 'hero' && u.kind === 'leader'),
    findUnit(army, 'paladin', (u) => u.side === 'hero'),
    findUnit(army, 'samurai', (u) => u.side === 'hero'),
    findUnit(army, 'mage', (u) => u.side === 'hero'),
    findUnit(army, 'archer', (u) => u.side === 'hero'),
  ].filter((u): u is Unit => !!u);
  return {
    enemies: e.map((unit, i) => ({ unit, start: beat(13 + i), end: beat(14 + i) })),
    heroes: h.map((unit, i) => ({ unit, start: beat(28 + i), end: beat(29 + i) })),
  };
}

/** Gesture times for the parade units (world time = video time before the charge). */
export function spotlight(army: Army): Map<string, number> {
  const p = parades(army);
  const m = new Map<string, number>();
  for (const c of [...p.enemies, ...p.heroes]) if (c.unit.kind !== 'dragon') m.set(c.unit.id, c.start + 0.06);
  return m;
}

// ---------------------------------------------------------------- shared text
function endcard(slot: string): Caption {
  return { start: T.endcard, end: T.end + 1, kind: 'endcard', slot };
}

function commonFades(): Fade[] {
  return [
    { t: T.impact, half: 0.09, color: '#ffffff' },
    { t: T.after, half: 0.4, color: '#000000' },
    { t: T.end + 0.05, half: 0.55, color: '#000000' },
  ];
}

// ---------------------------------------------------------------- 16:9
function wide(army: Army): Script {
  const elites = ['goblin-king', 'lich', 'vampire-lord', 'minotaur-guard'].map((n) => findUnit(army, n, (u) => u.side === 'enemy' && u.rank === 0));
  const heroTags = ['paladin', 'samurai', 'barbarian', 'rogue'].map((n) => findUnit(army, n, (u) => u.side === 'hero' && u.rank === 0 && u.preset === null));
  const knight = army.units.find((u) => u.side === 'hero' && u.kind === 'leader')!;
  const tag = (u: Unit | undefined, start: number, end: number, accent: string): Caption[] => (u ? [{ start, end, kind: 'tag', unit: u.id, text: u.label, accent }] : []);

  const shots: Shot[] = [
    { name: 'S1 title', start: 0, end: T.horde, light: L.title!, keys: [
      { t: 0, pos: [-1.5, 17, 26], look: [0, 15, -30], fov: 42 },
      { t: 3.7, pos: [1.6, 4.2, 8], look: [0, 2.2, BANNER[2]], fov: 40 },
      { t: T.horde, pos: [2.3, 1.7, -3.2], look: [0, 1.3, BANNER[2]], fov: 38 },
    ] },
    { name: 'S2 horde front', start: T.horde, end: T.hordeReveal, light: L.horde!, keys: [
      { t: T.horde, pos: [15, 1.05, -7.5], look: [20.8, 0.85, -5.2], fov: 36 },
      { t: T.hordeReveal, pos: [15, 1.05, 2.6], look: [20.8, 0.85, 4.9], fov: 36 },
    ] },
    { name: 'S3 horde reveal', start: T.hordeReveal, end: T.heroes, light: L.horde!, keys: [
      { t: T.hordeReveal, pos: [14.4, 1.4, 10.5], look: [21, 1.1, 6], fov: 38 },
      { t: 14.2, pos: [12.8, 3.6, 11.8], look: [24.5, 1.4, 2], fov: 40 },
      { t: T.heroes, pos: [11, 5.8, 13], look: [28, 2.3, -1.5], fov: 42 },
    ] },
    { name: 'S4 heroes front', start: T.heroes, end: T.heroesReady, light: L.heroes!, keys: [
      { t: T.heroes, pos: [-15, 1.05, -6.2], look: [-20.8, 0.95, -3.9], fov: 36 },
      { t: T.heroesReady, pos: [-15, 1.05, 1.3], look: [-20.8, 0.95, 3.6], fov: 36 },
    ] },
    { name: 'S5 ready', start: T.heroesReady, end: T.charge, light: L.heroes!, keys: [
      { t: T.heroesReady, pos: [-13.2, 0.32, -5.8], look: [-22, 1.9, 1], fov: 42 },
      { t: T.charge, pos: [-14.4, 0.36, -4.4], look: [-22, 2.0, 1], fov: 42 },
    ] },
    { name: 'S6 charge wide', start: T.charge, end: beat(39), light: L.charge!, keys: [
      { t: T.charge, pos: [0, 21, 47], look: [0, 0, -2], fov: 44 },
      { t: beat(39), pos: [0, 17, 40], look: [0, 0, -2], fov: 44 },
    ] },
    { name: 'S7 horde run', start: beat(39), end: beat(42), light: { ...L.horde!, key: 'camera', az: 28, el: 40 }, shake: [[beat(39), 0.02], [beat(42), 0.035]],
      keys: follow(beat(39), beat(42), (t) => {
        const f = hordeFront(t);
        const k = (t - beat(39)) / (beat(42) - beat(39));
        return { pos: [f - 6.4 + 1.6 * k, 0.45, 1.7], look: [f + 1.5, 0.95, -0.4], fov: 44 };
      }) },
    { name: 'S8 heroes run', start: beat(42), end: beat(44), light: { ...L.heroes!, key: 'camera', az: -28, el: 40 }, shake: [[beat(42), 0.03], [beat(44), 0.04]],
      keys: follow(beat(42), beat(44), (t) => {
        const f = heroFront(t);
        const k = (t - beat(42)) / (beat(44) - beat(42));
        return { pos: [f + 6.2 - 1.4 * k, 0.45, -1.7], look: [f - 1.5, 0.95, 0.4], fov: 44 };
      }) },
    { name: 'S9 closing', start: beat(44), end: T.slow, light: L.charge!, keys: [
      { t: beat(44), pos: [-3, 12.5, 18], look: [1.5, 0.6, -1], fov: 48 },
      { t: T.slow, pos: [-1.5, 10.5, 15], look: [1, 0.6, -1], fov: 48 },
    ] },
    { name: 'S10 leap', start: T.slow, end: T.impact, light: L.charge!, shake: [[T.impact - 0.4, 0], [T.impact, 0.03]], keys: [
      { t: T.slow, pos: [0.15, 1.1, 5.4], look: [0, 1.2, 0], fov: 40 },
      { t: T.impact, pos: [0.05, 1.25, 4.4], look: [0, 1.35, 0], fov: 40 },
    ] },
    { name: 'black', start: T.impact, end: T.after, light: BLACK, black: true, keys: [{ t: T.impact, pos: [0, 1, 5], look: [0, 1, 0] }] },
    { name: 'S11 after', start: T.after, end: T.end + 1, light: L.after!, keys: [
      { t: T.after, pos: [1.5, 0.42, 7.2], look: [2.2, 0.6, -8], fov: 40 },
      { t: T.end, pos: [1.0, 0.38, 6.3], look: [2.2, 0.6, -8], fov: 40 },
    ] },
  ];

  const captions: Caption[] = [
    { start: 0.9, end: T.horde - 0.1, kind: 'title', text: 'CHIBI QUEST' },
    { start: T.horde + 0.5, end: T.heroes - 0.05, kind: 'counter', slot: 'corner', pre: 'ศัตรู', post: 'แบบ', to: ENEMY_KINDS, countFrom: T.horde + 0.8, countTo: 9.6, accent: '#7a3fd6' },
    ...elites.flatMap((u, i) => tag(u, T.horde + 0.3 + i * 0.25, T.hordeReveal - 0.1, '#7a3fd6')),
    { start: T.heroes + 0.45, end: T.charge - 0.05, kind: 'counter', slot: 'corner', pre: 'ฮีโร่', post: 'คลาส', to: HERO_CLASSES, countFrom: T.heroes + 0.7, countTo: 20.3, accent: '#e08a12' },
    ...tag(knight, T.heroes + 0.3, T.heroesReady - 0.1, '#e08a12'),
    ...heroTags.flatMap((u, i) => tag(u, T.heroes + 0.4 + i * 0.25, T.heroesReady - 0.1, '#e08a12')),
    endcard('wide'),
  ];
  return { format: '16x9', shots, captions, fades: commonFades() };
}

// ---------------------------------------------------------------- 9:16
function tall(army: Army): Script {
  const p = parades(army);
  const UP: V3 = [1, 0, 0];

  /** A head-to-toe portrait of one unit from the front, with a slow push in. */
  const portrait = (u: Unit, start: number, end: number, light: Light): Shot => {
    const dir = u.side === 'enemy' ? -1 : 1; // the camera stands in front of the unit
    const g = ground(u.x, u.z);
    const h = u.height;
    const top = u.kind === 'float' ? u.hover : 0;
    const back = u.kind === 'dragon' ? 6.2 : 1.55 + 1.25 * h;
    const lift = u.kind === 'dragon' ? 2.4 : 0.5 * h;
    const cy = g + top + h * 0.5;
    // A floater sits higher in the frame, so that its name tag clears the counter.
    const at = u.kind === 'dragon' ? [u.x, g + 1.15 + h * 0.5, u.z] : [u.x, u.kind === 'float' ? cy - 0.25 * h : cy, u.z];
    // The units in the camera's lane (the leader in front of the front rank, the ranks in
    // front of a back-rank hero) would cover the portrait.
    const hide = u.kind === 'dragon' ? [] : army.units.filter((v) => {
      if (v === u || v.side !== u.side || !['ground', 'leader', 'float'].includes(v.kind)) return false;
      const s = dir * (v.x - u.x);
      return s > 0.3 && s < back + 0.6 && Math.abs(v.z - (u.z + 0.2)) < 0.9;
    }).map((v) => v.id);
    return {
      name: `parade ${u.label}`, start, end, light, hide,
      keys: [
        { t: start, pos: [at[0]! + dir * back, g + top + lift, u.z + 0.35], look: [at[0]!, at[1]!, at[2]!], fov: 40 },
        { t: end, pos: [at[0]! + dir * back * 0.9, g + top + lift, u.z + 0.3], look: [at[0]!, at[1]!, at[2]!], fov: 40 },
      ],
    };
  };

  const shots: Shot[] = [
    { name: 'V1 title', start: 0, end: T.horde, light: L.title!, keys: [
      { t: 0, pos: [0, 18, 26], look: [0, 30, -40], fov: 62 },
      { t: 3.7, pos: [1, 5, 9], look: [0, 2.4, BANNER[2]], fov: 58 },
      { t: T.horde, pos: [1.2, 1.8, -2.8], look: [0, 1.5, BANNER[2]], fov: 56 },
    ] },
    { name: 'V2 horde wall', start: T.horde, end: beat(13), light: L.horde!, keys: [
      { t: T.horde, pos: [18.1, 0.5, -3.1], look: [20.3, 0.62, -3.25], fov: 50 },
      { t: 7.9, pos: [16, 2.6, -2.4], look: [24, 1.3, -2.6], fov: 52 },
      { t: beat(13), pos: [12.2, 7.6, -1.6], look: [30, 2.6, -3], fov: 54 },
    ] },
    ...p.enemies.map((c) => portrait(c.unit, c.start, c.end, L.horde!)),
    { name: 'V4 heroes', start: T.heroes, end: beat(28), light: L.heroes!, keys: [
      { t: T.heroes, pos: [-21.6, 3.5, 2.6], look: [-26.5, 2.0, 0.6], fov: 50 },
      { t: beat(28), pos: [-17.5, 0.95, 0.35], look: [-19.4, 0.85, 0], fov: 50 },
    ] },
    ...p.heroes.map((c) => portrait(c.unit, c.start, c.end, L.heroes!)),
    { name: 'V6 ready', start: beat(33), end: T.charge, light: L.heroes!, keys: [
      { t: beat(33), pos: [-21.0, 0.6, 0], look: [-8, 1.35, 0], fov: 52 },
      { t: T.charge, pos: [-20.8, 0.55, 0], look: [-8, 1.3, 0], fov: 52 },
    ] },
    { name: 'V7 top-down', start: T.charge, end: beat(39), light: L.charge!, keys: [
      { t: T.charge, pos: [0, 38, 0.01], look: [0, 0, 0], fov: 62, up: UP },
      { t: beat(39), pos: [0, 33, 0.01], look: [0, 0, 0], fov: 62, up: UP },
    ] },
    { name: 'V8 into the horde', start: beat(39), end: beat(42), light: L.chargeCam!, shake: [[beat(39), 0.02], [beat(42), 0.03]],
      keys: follow(beat(39), beat(42), (t) => {
        const f = heroFront(t);
        return { pos: [f - 0.85, 0.62, 0], look: [f + 12, 1.6, 0], fov: 56 };
      }) },
    { name: 'V9 into the heroes', start: beat(42), end: beat(44), light: { ...L.chargeCam!, az: -25 }, shake: [[beat(42), 0.025], [beat(44), 0.035]],
      keys: follow(beat(42), beat(44), (t) => {
        const f = hordeFront(t);
        return { pos: [f + 0.9, 0.7, 0], look: [f - 12, 1.5, 0], fov: 56 };
      }) },
    { name: 'V10 top-down close', start: beat(44), end: T.slow, light: L.charge!, keys: [
      { t: beat(44), pos: [0, 15, 0.01], look: [0, 0, 0], fov: 60, up: UP },
      { t: T.slow, pos: [0, 12.5, 0.01], look: [0, 0, 0], fov: 60, up: UP },
    ] },
    { name: 'V11 leap', start: T.slow, end: T.impact, light: L.chargeCam!, shake: [[T.impact - 0.4, 0], [T.impact, 0.03]], keys: [
      { t: T.slow, pos: [-3.9, 0.3, 0.35], look: [0.8, 1.7, 0], fov: 58 },
      { t: T.impact, pos: [-2.9, 0.34, 0.3], look: [0.6, 1.9, 0], fov: 58 },
    ] },
    { name: 'black', start: T.impact, end: T.after, light: BLACK, black: true, keys: [{ t: T.impact, pos: [0, 1, 5], look: [0, 1, 0] }] },
    { name: 'V12 after', start: T.after, end: T.end + 1, light: L.after!, keys: [
      { t: T.after, pos: [0.35, 0.34, 6.4], look: [0, 2.1, -9], fov: 56 },
      { t: T.end, pos: [0.3, 0.32, 5.8], look: [0, 2.1, -9], fov: 56 },
    ] },
  ];
  shots.sort((a, b) => a.start - b.start);

  const captions: Caption[] = [
    { start: 0.9, end: T.horde - 0.1, kind: 'title', text: 'CHIBI QUEST', slot: 'band' },
    { start: T.horde + 0.4, end: T.heroes - 0.05, kind: 'counter', slot: 'band', pre: 'ศัตรู', post: 'แบบ', to: ENEMY_KINDS, countFrom: T.horde + 0.7, countTo: 9.6, accent: '#7a3fd6' },
    ...p.enemies.map((c): Caption => ({ start: c.start + 0.05, end: c.end, kind: 'tag', unit: c.unit.id, text: c.unit.label, accent: '#7a3fd6' })),
    { start: T.heroes + 0.4, end: beat(33) - 0.05, kind: 'counter', slot: 'band', pre: 'ฮีโร่', post: 'คลาส', to: HERO_CLASSES, countFrom: T.heroes + 0.7, countTo: 20.3, accent: '#e08a12' },
    ...p.heroes.map((c): Caption => ({ start: c.start + 0.05, end: c.end, kind: 'tag', unit: c.unit.id, text: c.unit.label, accent: '#e08a12' })),
    endcard('tall'),
  ];
  return { format: '9x16', shots, captions, fades: commonFades() };
}

export function makeScript(format: Format, army: Army): Script {
  return format === '9x16' ? tall(army) : wide(army);
}
