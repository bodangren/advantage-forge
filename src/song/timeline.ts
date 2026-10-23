/**
 * The song timeline: Workbooks' `spec.json` (lines, times, singers, gesture per line) plus
 * Storytime's `stage.json` (marks on the rug, camera keys, moves) become one plain timeline that
 * the song page plays (`src/song/main.ts`) and the recorder steps through (`scripts/song-record.ts`).
 * Pure data, no three.js: `tests/song-timeline.test.ts` covers it.
 *
 * Stage space is the rug: x to the right, z toward the camera, the rug centre is (0, 0), yaw 0
 * faces the camera (+Z, the asset front). The classroom map puts the rug at world `RUG`.
 * Camera keys use the same space for `tx`, `tz` (`ty` optional, default `TARGET_Y`).
 */

export interface SpecWord {
  text?: string;
  start: number;
  end: number;
}
export interface SpecLine {
  text: string;
  gesture?: string;
  start: number;
  end: number;
  actors?: string[];
  scene?: string;
  /** Word times from the song (Workbooks' karaoke timing). */
  segments?: { start: number; end: number; words?: SpecWord[] }[];
}
export interface Spec {
  title?: string;
  duration: number;
  lines: SpecLine[];
}
export interface Mark {
  x: number;
  z: number;
  yaw?: number;
}
export interface CameraKey {
  at: number;
  az: number;
  el: number;
  dist: number;
  tx: number;
  tz: number;
  ty?: number;
  fov?: number;
}
export interface Move {
  actor: string;
  at: number;
  to: { x: number; z: number };
  clip?: string;
}
export interface Stage {
  scene?: string;
  marks?: Record<string, Mark>;
  camera?: CameraKey[];
  cameraPortrait?: CameraKey[];
  moves?: Move[];
}

export interface Cue {
  t: number;
  clip: string;
}
export interface PathKey {
  t: number;
  x: number;
  z: number;
  yaw: number;
}
export interface Sing {
  start: number;
  end: number;
}
export interface ActorTrack {
  id: string;
  asset: string;
  path: PathKey[];
  cues: Cue[];
  /** The words this actor sings (the mouth opens on each); from the line span when a line has no word times. */
  sings: Sing[];
}
export interface Timeline {
  duration: number;
  scene: string;
  actors: ActorTrack[];
  camera: CameraKey[];
  cameraPortrait: CameraKey[];
  warnings: string[];
}

/** Spec actor names to Forge assets. */
export const CAST: Record<string, string> = {
  Pip: 'sprout-pip',
  Nan: 'sprout-nan',
  Pat: 'sprout-pat',
  May: 'sprout-may',
  Sam: 'sprout-sam',
  Mia: 'sprout-mia',
  Ben: 'sprout-ben',
  Adventurer: 'sprout-adventurer',
};
/** Spec gesture text to the humanoid gesture clips (`assets/parts/sprout-gestures.ts`). */
export const GESTURES: Record<string, string> = {
  'point to self': 'gesture-point-to-self',
  'point forward': 'gesture-point-forward',
  wave: 'gesture-wave',
  clap: 'gesture-clap',
  nod: 'gesture-nod',
  'hands out': 'gesture-hands-out',
  idle: 'gesture-idle',
};
/** Pip is a dog: he sings his lines with the howl clip and sits for a nod. */
const DOG_GESTURES: Record<string, string> = { nod: 'sit' };
const DOG_SING = 'howl';
const DOGS = new Set(['sprout-pip']);

export const RUG: readonly [number, number, number] = [0, 0, 3];
export const TARGET_Y = 0.4;
export const DEFAULT_FOV = 32;
export const WALK_SPEED = 0.45; // m/s, the age-5 walk
export const ROW_SPACING = 0.7;
export const BLEND = 0.22; // s, the cross-fade between clips
const SAME_LINE_GAP = 0.3; // s, no idle between two lines of one singer closer than this
const DEFAULT_CAMERA: CameraKey = { at: 0, az: 0, el: 12, dist: 4.8, tx: 0, tz: 0 };

export const IDLE = 'idle';
/**
 * How far the song page moves the singing-face bones out of the head (metres). The bodies rest
 * `SING_DEPTH` (0.03, humanoid-kind.ts) inside the head ellipsoid; the real face (cheeks, chin)
 * sits about 1 cm further out at the mouth, so the mouth travels further than the eyelids.
 */
export const SING_OUT = { mouth: 0.046, eyelids: 0.038 } as const;

export function clipFor(asset: string, gesture: string | undefined): { clip: string; warning?: string } {
  const key = (gesture ?? '').trim().toLowerCase();
  if (DOGS.has(asset)) return { clip: DOG_GESTURES[key] ?? DOG_SING };
  if (!key) return { clip: GESTURES.idle! };
  const clip = GESTURES[key];
  if (clip) return { clip };
  return { clip: GESTURES.idle!, warning: `unknown gesture "${gesture}" on ${asset}: idle` };
}

const byTime = <T extends { t: number }>(a: T, b: T): number => a.t - b.t;

/** The clip a track's line cues name at time t (the last cue at or before t). */
function activeClip(cues: readonly Cue[], t: number): string {
  let clip = IDLE;
  for (const c of cues) if (c.t <= t + 1e-9) clip = c.clip;
  return clip;
}

export function buildTimeline(spec: Spec, stage: Stage): Timeline {
  const warnings: string[] = [];
  const lines = [...spec.lines].sort((a, b) => a.start - b.start);
  const marks = stage.marks ?? {};

  // Actors: everyone with a mark, then everyone named in a line, in order of first appearance.
  const ids: string[] = [];
  const seen = new Set<string>();
  const add = (id: string): void => {
    if (seen.has(id)) return;
    seen.add(id);
    ids.push(id);
  };
  for (const id of Object.keys(marks)) add(id);
  for (const line of lines) for (const id of line.actors ?? []) add(id);
  for (const id of ids) if (!CAST[id]) throw new Error(`song: no asset for the actor "${id}" (known: ${Object.keys(CAST).join(', ')})`);

  // Unmarked actors stand in a row on the rug centre line, in order of first appearance.
  const unmarked = ids.filter((id) => !marks[id]);
  const rowX = (i: number): number => (i - (unmarked.length - 1) / 2) * ROW_SPACING;

  const actors: ActorTrack[] = ids.map((id) => {
    const asset = CAST[id]!;
    const mark = marks[id] ?? { x: rowX(unmarked.indexOf(id)), z: 0, yaw: 0 };
    const path: PathKey[] = [{ t: 0, x: mark.x, z: mark.z, yaw: mark.yaw ?? 0 }];

    // Line cues: the gesture clip from the line start, idle from the line end.
    const cues: Cue[] = [{ t: 0, clip: IDLE }];
    const mine = lines.filter((line) => (line.actors ?? []).includes(id));
    mine.forEach((line, i) => {
      const { clip, warning } = clipFor(asset, line.gesture);
      if (warning) warnings.push(`line "${line.text}": ${warning}`);
      cues.push({ t: line.start, clip });
      const next = mine[i + 1];
      if (!next || next.start - line.end >= SAME_LINE_GAP) cues.push({ t: line.end, clip: IDLE });
    });
    cues.sort(byTime);
    const sings: Sing[] = mine.flatMap((line) => {
      const words = (line.segments ?? []).flatMap((seg) => seg.words ?? []).filter((w) => w.end > w.start);
      return words.length ? words.map((w) => ({ start: w.start, end: w.end })) : [{ start: line.start, end: line.end }];
    });
    sings.sort((a, b) => a.start - b.start);

    // Moves: walk from the current place to the target at the walk speed, then resume the line clip.
    const moves = (stage.moves ?? []).filter((m) => m.actor === id).sort((a, b) => a.at - b.at);
    for (const move of moves) {
      const from = path[path.length - 1]!;
      const dx = move.to.x - from.x;
      const dz = move.to.z - from.z;
      const dist = Math.hypot(dx, dz);
      const dur = Math.max(0.1, dist / WALK_SPEED);
      if (move.at < from.t) warnings.push(`${id}: a move at ${move.at}s starts before the previous move ends (${from.t.toFixed(2)}s)`);
      const yaw = dist > 1e-6 ? (Math.atan2(dx, dz) * 180) / Math.PI : from.yaw;
      path.push({ t: move.at, x: from.x, z: from.z, yaw }, { t: move.at + dur, x: move.to.x, z: move.to.z, yaw: marks[id]?.yaw ?? 0 });
      const after = activeClip(cues, move.at + dur);
      cues.push({ t: move.at, clip: move.clip ?? 'walk' }, { t: move.at + dur, clip: after });
      cues.sort(byTime);
    }
    return { id, asset, path, cues, sings };
  });

  const camera = [...(stage.camera?.length ? stage.camera : [DEFAULT_CAMERA])].sort((a, b) => a.at - b.at);
  const cameraPortrait = [...(stage.cameraPortrait?.length ? stage.cameraPortrait : camera)].sort((a, b) => a.at - b.at);
  const scene = stage.scene ?? lines.find((l) => l.scene)?.scene ?? 'classroom';
  return { duration: spec.duration, scene, actors, camera, cameraPortrait, warnings };
}

export const smooth = (x: number): number => x * x * (3 - 2 * x);
export const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;

/** The camera at t: keys hold, then ease (smoothstep) to the next key between the two times. */
export function cameraAt(keys: readonly CameraKey[], t: number): Required<CameraKey> {
  const fill = (k: CameraKey): Required<CameraKey> => ({ ...k, ty: k.ty ?? TARGET_Y, fov: k.fov ?? DEFAULT_FOV });
  if (keys.length === 0) return fill(DEFAULT_CAMERA);
  let i = 0;
  while (i + 1 < keys.length && keys[i + 1]!.at <= t) i++;
  const a = fill(keys[i]!);
  const b = keys[i + 1] ? fill(keys[i + 1]!) : null;
  if (!b || t <= a.at) return a;
  const u = smooth(clamp01((t - a.at) / (b.at - a.at)));
  return {
    at: t,
    az: lerp(a.az, b.az, u),
    el: lerp(a.el, b.el, u),
    dist: lerp(a.dist, b.dist, u),
    tx: lerp(a.tx, b.tx, u),
    ty: lerp(a.ty, b.ty, u),
    tz: lerp(a.tz, b.tz, u),
    fov: lerp(a.fov, b.fov, u),
  };
}

/** The camera as world coordinates: the eye and the target. */
export function cameraWorld(c: Required<CameraKey>): { eye: [number, number, number]; target: [number, number, number]; fov: number } {
  const az = (c.az * Math.PI) / 180;
  const el = (c.el * Math.PI) / 180;
  const target: [number, number, number] = [RUG[0] + c.tx, RUG[1] + c.ty, RUG[2] + c.tz];
  const eye: [number, number, number] = [
    target[0] + c.dist * Math.sin(az) * Math.cos(el),
    target[1] + c.dist * Math.sin(el),
    target[2] + c.dist * Math.cos(az) * Math.cos(el),
  ];
  return { eye, target, fov: c.fov };
}

/** Where an actor stands at t (rug space), linear between path keys; the yaw turns over 0.36 s around a key. */
export function placeAt(path: readonly PathKey[], t: number): { x: number; z: number; yaw: number } {
  let i = 0;
  while (i + 1 < path.length && path[i + 1]!.t <= t) i++;
  const a = path[i]!;
  const b = path[i + 1];
  let yaw = a.yaw;
  if (i > 0) {
    const prev = path[i - 1]!;
    yaw = lerpYaw(prev.yaw, a.yaw, smooth(clamp01((t - (a.t - 0.18)) / 0.36)));
  }
  if (!b || t <= a.t) return { x: a.x, z: a.z, yaw };
  const u = (t - a.t) / (b.t - a.t);
  if (b.yaw !== a.yaw) yaw = lerpYaw(yaw, b.yaw, smooth(clamp01((t - (b.t - 0.18)) / 0.36)));
  return { x: lerp(a.x, b.x, u), z: lerp(a.z, b.z, u), yaw };
}

function lerpYaw(a: number, b: number, u: number): number {
  const d = ((((b - a) % 360) + 540) % 360) - 180;
  return a + d * u;
}

/** The clip mix at t: the current cue at weight w and, during the blend, the previous cue at 1 - w. */
export function mixAt(cues: readonly Cue[], t: number): { clip: string; start: number; w: number; prev?: { clip: string; start: number } } {
  let i = 0;
  while (i + 1 < cues.length && cues[i + 1]!.t <= t) i++;
  const cur = cues[i] ?? { t: 0, clip: IDLE };
  const w = i > 0 ? smooth(clamp01((t - cur.t) / BLEND)) : 1;
  const prev = i > 0 && w < 1 ? cues[i - 1]! : undefined;
  return { clip: cur.clip, start: cur.t, w, ...(prev && prev.clip !== cur.clip ? { prev: { clip: prev.clip, start: prev.t } } : {}) };
}

/**
 * How open the mouth is at t (0 closed, 1 open): it opens in 60 ms at each word, closes over 90 ms
 * at the word end, and pulses on long words (about 3.5 beats a second, as syllables).
 */
export function mouthAt(sings: readonly Sing[], t: number): number {
  for (const w of sings) {
    if (t < w.start - 0.03) break;
    if (t > w.end + 0.09) continue;
    const open = smooth(clamp01((t - w.start + 0.03) / 0.06)) * smooth(clamp01((w.end + 0.09 - t) / 0.09));
    const pulse = w.end - w.start > 0.45 ? 0.7 + 0.3 * Math.abs(Math.cos(Math.PI * 3.5 * (t - w.start))) : 1;
    return open * pulse;
  }
  return 0;
}

/** How closed the eyes are at t (0 open, 1 shut): a 0.14 s blink about every 3.4 s, offset per actor. */
export function blinkAt(seed: number, t: number): number {
  const period = 3.4 + 0.7 * ((seed * 7919) % 11) / 11;
  const phase = ((t + seed * 1.37) % period) / period;
  const u = phase * period;
  return u < 0.14 ? Math.sin((Math.PI * u) / 0.14) : 0;
}

/** A short text report of a timeline for the render log. */
export function describe(tl: Timeline): string {
  const rows = tl.actors.map((a) => `${a.id} (${a.asset}): at ${a.path[0]!.x},${a.path[0]!.z} yaw ${a.path[0]!.yaw}; ${a.cues.length - 1} cues`);
  return [`scene ${tl.scene}, ${tl.duration.toFixed(2)} s, ${tl.camera.length} camera keys, ${tl.cameraPortrait.length} portrait keys`, ...rows, ...tl.warnings.map((w) => `warning: ${w}`)].join('\n');
}
