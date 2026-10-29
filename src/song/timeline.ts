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
/** A Forge asset placed in a set for a time span, or held by an actor. */
export interface Prop {
  asset: string;
  x?: number;
  z?: number;
  y?: number;
  yaw?: number;
  scale?: number;
  from?: number;
  to?: number;
  /** A clip to loop (default `idle` when the GLB has one). */
  clip?: string;
  /** n copies in a row along x from `x`, `spacing` metres apart (default 0.4). */
  count?: number;
  spacing?: number;
  /** The actor who holds it on the `hand` bone (`R` default); `offset` metres and `rotate` degrees adjust the grip. */
  held?: string;
  hand?: 'L' | 'R';
  /** The bone that holds it (default `hand.<hand>`; a dog gets `jaw`, then `head`). */
  bone?: string;
  offset?: [number, number, number];
  rotate?: [number, number, number];
}
/** A flat card with an image file (relative to the stage file) in a set for a time span. */
export interface Picture {
  file: string;
  x: number;
  y: number;
  z: number;
  w: number;
  h?: number;
  yaw?: number;
  from?: number;
  to?: number;
  /** A white card with a dark border behind the image. */
  card?: boolean;
  /** Flat colours, no scene light (a sun in the sky). */
  unlit?: boolean;
}
/** One set: the picture for a scene name of the spec (a room, marks, camera, props, pictures). */
export interface SetDef {
  map?: string;
  /** Where the stage (0, 0) sits in the map (world x, z) and the stage heading (degrees): `MAP_ORIGINS` by default. */
  origin?: [number, number];
  heading?: number;
  light?: 'interior' | 'outdoor';
  sun?: 'high' | 'side';
  marks?: Record<string, Mark>;
  camera?: CameraKey[];
  cameraPortrait?: CameraKey[];
  props?: Prop[];
  pictures?: Picture[];
}
export interface Cut {
  at: number;
  set: string;
}
export interface Stage {
  scene?: string;
  marks?: Record<string, Mark>;
  camera?: CameraKey[];
  cameraPortrait?: CameraKey[];
  moves?: Move[];
  props?: Prop[];
  pictures?: Picture[];
  /** Sets keyed by the spec's scene names; the top-level stage serves a scene name without one. */
  sets?: Record<string, SetDef>;
  /** Hard cuts between sets; default: one at every line whose scene differs from the line before. */
  cuts?: Cut[];
  /** The sun: `high` (the classroom.png light, short contact shadows) or `side` (from the camera's left, long shadows on the rug). */
  sun?: 'high' | 'side';
  /** Pip's singing: `howl` (head up, mouth open) or `quiet` (idle with a sit on a nod). */
  dog?: 'howl' | 'quiet';
  /** `white`: no room is shown and the backdrop is plain white (a book picture on a white page). */
  backdrop?: 'white';
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
  /** A cut: the actor is here from t with no walk or turn into this key. */
  jump?: boolean;
}
export interface PropTrack {
  asset: string;
  x: number;
  z: number;
  y: number;
  yaw: number;
  scale: number;
  from: number;
  to: number;
  clip?: string;
  held?: { actor: string; hand: 'L' | 'R'; bone?: string; offset: [number, number, number]; rotate: [number, number, number] };
}
export interface PictureTrack {
  file: string;
  x: number;
  y: number;
  z: number;
  w: number;
  h?: number;
  yaw: number;
  from: number;
  to: number;
  card: boolean;
  unlit: boolean;
}
/** One shot of the song: a set in force from `from` to `to`. */
export interface Shot {
  set: string;
  from: number;
  to: number;
  map: string;
  /** The stage (0, 0, 0) in world metres and the stage heading in degrees (stage +z turned about +y). */
  origin: [number, number, number];
  heading: number;
  light: 'interior' | 'outdoor';
  sun: 'high' | 'side';
  camera: CameraKey[];
  cameraPortrait: CameraKey[];
  props: PropTrack[];
  pictures: PictureTrack[];
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
  sun: 'high' | 'side';
  actors: ActorTrack[];
  camera: CameraKey[];
  cameraPortrait: CameraKey[];
  /** The shots in song order; `scene`, `sun`, `camera`, `cameraPortrait` above are the first shot's. */
  shots: Shot[];
  /** Every map the page must load, in order of first use. */
  maps: string[];
  warnings: string[];
  /** `white`: the page hides every room and clears to plain white. */
  backdrop?: 'white';
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
  // Weeks 2 to 6 (bench/sonnet/sprouts/prompts/b7-gestures-2.md).
  'point up': 'gesture-point-up',
  reach: 'gesture-reach',
  'count fingers': 'gesture-count-fingers',
  sway: 'gesture-sway',
  look: 'gesture-look',
  hop: 'gesture-hop',
  'stretch up': 'gesture-stretch-up',
  eat: 'gesture-eat',
  'hug self': 'gesture-hug-self',
  bow: 'gesture-bow',
  listen: 'gesture-listen',
  stamp: 'gesture-stamp',
  march: 'gesture-march',
};
/** Pip is a dog: he sings his lines with the howl clip and sits for a nod. */
const DOG_GESTURES: Record<string, string> = { nod: 'sit' };
const DOG_SING = 'howl';
const DOGS = new Set(['sprout-pip']);

export const RUG: readonly [number, number, number] = [0, 0, 3];
/**
 * Where the stage sits in each map and which way it faces: a clear 4 m floor for the cast and a
 * clear 5.5 m corridor for the camera (`bench/sonnet/sprouts/map-scan` in the plan). Other maps
 * use the rug origin and heading 0; a set's `origin` and `heading` override.
 */
export const MAP_ORIGINS: Record<string, { origin: [number, number, number]; heading: number }> = {
  classroom: { origin: [RUG[0], RUG[1], RUG[2]], heading: 0 },
  meadow: { origin: [7, 0, 5], heading: 180 },
  grassland: { origin: [0, 0, 0], heading: 180 },
  'lake-shore': { origin: [-4, 0, 4], heading: 45 }, // a tight stage (1.5 m) with the water behind the cast
};
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

export function clipFor(asset: string, gesture: string | undefined, dog: 'howl' | 'quiet' = 'howl'): { clip: string; warning?: string } {
  const key = (gesture ?? '').trim().toLowerCase();
  if (DOGS.has(asset)) return { clip: DOG_GESTURES[key] ?? (dog === 'quiet' ? IDLE : DOG_SING) };
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

  // Sets and cuts: the top-level stage is the set for a scene name without one.
  const top: SetDef = {};
  if (stage.scene) top.map = stage.scene;
  if (stage.sun) top.sun = stage.sun;
  if (stage.marks) top.marks = stage.marks;
  if (stage.camera) top.camera = stage.camera;
  if (stage.cameraPortrait) top.cameraPortrait = stage.cameraPortrait;
  if (stage.props) top.props = stage.props;
  if (stage.pictures) top.pictures = stage.pictures;
  const sets = stage.sets ?? {};
  const setFor = (name: string): SetDef => {
    const def = sets[name];
    if (def) return def;
    if (Object.keys(sets).length && !warnings.includes(`no set "${name}": the top-level stage serves it`)) warnings.push(`no set "${name}": the top-level stage serves it`);
    return top;
  };
  let cuts: Cut[] = stage.cuts ? [...stage.cuts].sort((a, b) => a.at - b.at) : [];
  if (!stage.cuts) {
    let prev: string | undefined;
    for (const line of lines) {
      if (line.scene && line.scene !== prev) cuts.push({ at: line.start, set: line.scene });
      if (line.scene) prev = line.scene;
    }
  }
  if (!cuts.length) cuts = [{ at: 0, set: stage.scene ?? 'classroom' }];
  if (cuts[0]!.at > 0) cuts.unshift({ at: 0, set: cuts[0]!.set });
  // Consecutive cuts on the same set def (two scene names on the top-level stage) are one shot.
  const resolved: { name: string; def: SetDef; at: number }[] = [];
  for (const cut of cuts) {
    const def = setFor(cut.set);
    const last = resolved[resolved.length - 1];
    if (last && last.def === def) continue;
    resolved.push({ name: cut.set, def, at: cut.at });
  }
  const defaultCamera = stage.camera?.length ? stage.camera : [DEFAULT_CAMERA];
  const shots: Shot[] = resolved.map(({ name, def, at }, i) => {
    const from = at;
    const to = resolved[i + 1]?.at ?? spec.duration;
    const map = def.map ?? stage.scene ?? 'classroom';
    const camera = [...(def.camera?.length ? def.camera : defaultCamera)].sort((a, b) => a.at - b.at);
    const portraitKeys = def.cameraPortrait?.length ? def.cameraPortrait : camera;
    const span = <T extends { from?: number; to?: number }>(p: T): { from: number; to: number } => ({ from: Math.max(from, p.from ?? from), to: Math.min(to, p.to ?? to) });
    const props: PropTrack[] = (def.props ?? []).flatMap((p) => {
      const { from: f, to: e } = span(p);
      if (e <= f) return [];
      const base: PropTrack = { asset: p.asset, x: p.x ?? 0, z: p.z ?? 0, y: p.y ?? 0, yaw: p.yaw ?? 0, scale: p.scale ?? 1, from: f, to: e, ...(p.clip ? { clip: p.clip } : {}) };
      if (p.held) {
        if (!ids.includes(p.held)) warnings.push(`prop ${p.asset}: no actor "${p.held}" holds it; placed on the ground`);
        else base.held = { actor: p.held, hand: p.hand ?? 'R', ...(p.bone ? { bone: p.bone } : {}), offset: p.offset ?? [0, 0, 0], rotate: p.rotate ?? [0, 0, 0] };
      }
      const n = Math.max(1, Math.round(p.count ?? 1));
      return Array.from({ length: n }, (_, k) => ({ ...base, x: base.x + k * (p.spacing ?? 0.4) }));
    });
    const pictures: PictureTrack[] = (def.pictures ?? []).flatMap((p) => {
      const { from: f, to: e } = span(p);
      if (e <= f) return [];
      return [{ file: p.file, x: p.x, y: p.y, z: p.z, w: p.w, ...(p.h ? { h: p.h } : {}), yaw: p.yaw ?? 0, from: f, to: e, card: p.card ?? false, unlit: p.unlit ?? false }];
    });
    const frame = MAP_ORIGINS[map] ?? { origin: [RUG[0], RUG[1], RUG[2]], heading: 0 };
    return {
      set: name,
      from,
      to,
      map,
      origin: def.origin ? [def.origin[0], frame.origin[1], def.origin[1]] : frame.origin,
      heading: def.heading ?? frame.heading,
      light: def.light ?? (INTERIOR.has(map) ? 'interior' : 'outdoor'),
      sun: def.sun ?? stage.sun ?? 'high',
      camera,
      cameraPortrait: [...portraitKeys].sort((a, b) => a.at - b.at),
      props,
      pictures,
    };
  });
  const maps = [...new Set(shots.map((s) => s.map))];

  const actors: ActorTrack[] = ids.map((id) => {
    const asset = CAST[id]!;
    const rowMark: Mark = { x: rowX(unmarked.indexOf(id)), z: 0, yaw: 0 };
    const markIn = (def: SetDef): Mark => def.marks?.[id] ?? marks[id] ?? rowMark;
    const path: PathKey[] = [];
    resolved.forEach(({ def, at }, i) => {
      const mark = markIn(def);
      path.push({ t: at, x: mark.x, z: mark.z, yaw: mark.yaw ?? 0, ...(i > 0 ? { jump: true } : {}) });
    });

    // Line cues: the gesture clip from the line start, idle from the line end.
    const cues: Cue[] = [{ t: 0, clip: IDLE }];
    const mine = lines.filter((line) => (line.actors ?? []).includes(id));
    mine.forEach((line, i) => {
      const { clip, warning } = clipFor(asset, line.gesture, stage.dog ?? 'howl');
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
    // A move belongs to the shot in force at its time; the walk ends at the shot's mark yaw.
    const moves = (stage.moves ?? []).filter((m) => m.actor === id).sort((a, b) => a.at - b.at);
    let busyUntil = 0;
    for (const move of moves) {
      const shotIndex = Math.max(0, resolved.findIndex((r, i) => move.at >= r.at && (i + 1 >= resolved.length || move.at < resolved[i + 1]!.at)));
      const cutAt = resolved[shotIndex + 1]?.at ?? spec.duration;
      let i = path.length - 1;
      while (i > 0 && path[i]!.t > move.at) i--;
      const from = path[i]!;
      const dx = move.to.x - from.x;
      const dz = move.to.z - from.z;
      const dist = Math.hypot(dx, dz);
      const dur = Math.max(0.1, dist / WALK_SPEED);
      if (move.at < busyUntil) warnings.push(`${id}: a move at ${move.at}s starts before the previous move ends (${busyUntil.toFixed(2)}s)`);
      if (move.at + dur > cutAt) warnings.push(`${id}: the move at ${move.at}s runs past the cut at ${cutAt.toFixed(2)}s`);
      busyUntil = move.at + dur;
      const yaw = dist > 1e-6 ? (Math.atan2(dx, dz) * 180) / Math.PI : from.yaw;
      const restYaw = markIn(resolved[shotIndex]!.def).yaw ?? 0;
      path.splice(i + 1, 0, { t: move.at, x: from.x, z: from.z, yaw }, { t: move.at + dur, x: move.to.x, z: move.to.z, yaw: restYaw });
      const after = activeClip(cues, move.at + dur);
      cues.push({ t: move.at, clip: move.clip ?? 'walk' }, { t: move.at + dur, clip: after });
      cues.sort(byTime);
    }
    path.sort(byTime);
    return { id, asset, path, cues, sings };
  });

  const first = shots[0]!;
  return {
    duration: spec.duration, scene: first.map, sun: first.sun, actors, camera: first.camera, cameraPortrait: first.cameraPortrait, shots, maps, warnings,
    ...(stage.backdrop === 'white' ? { backdrop: 'white' as const } : {}),
  };
}

/** Maps lit as a bright interior; every other map is outdoors (sky backdrop). */
const INTERIOR = new Set(['classroom', 'tavern', 'blacksmith', 'library', 'inn', 'bakery', 'general-store', 'guild-hall', 'archive', 'apothecary', 'alchemy-lab']);

/** The shot in force at t (the last shot that starts at or before t). */
export function shotAt(tl: Pick<Timeline, 'shots'>, t: number): Shot {
  let shot = tl.shots[0]!;
  for (const s of tl.shots) if (s.from <= t) shot = s;
  return shot;
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

/** A stage frame: where stage (0, 0) sits in the world and which way stage +z points. */
export interface Frame {
  origin: readonly [number, number, number];
  heading: number;
}
const RUG_FRAME: Frame = { origin: RUG, heading: 0 };

/** Stage (x, z) in world metres for a frame. */
export function toWorld(frame: Frame, x: number, z: number): [number, number] {
  const h = (frame.heading * Math.PI) / 180;
  return [frame.origin[0] + x * Math.cos(h) + z * Math.sin(h), frame.origin[2] - x * Math.sin(h) + z * Math.cos(h)];
}

/** The camera as world coordinates: the eye and the target. */
export function cameraWorld(c: Required<CameraKey>, frame: Frame = RUG_FRAME): { eye: [number, number, number]; target: [number, number, number]; fov: number } {
  const az = ((c.az + frame.heading) * Math.PI) / 180;
  const el = (c.el * Math.PI) / 180;
  const [wx, wz] = toWorld(frame, c.tx, c.tz);
  const target: [number, number, number] = [wx, frame.origin[1] + c.ty, wz];
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
  if (i > 0 && !a.jump) {
    const prev = path[i - 1]!;
    yaw = lerpYaw(prev.yaw, a.yaw, smooth(clamp01((t - (a.t - 0.18)) / 0.36)));
  }
  if (!b || t <= a.t || b.jump) return { x: a.x, z: a.z, yaw };
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
  const shots = tl.shots.map(
    (s) =>
      `shot ${s.set} ${s.from.toFixed(2)}-${s.to.toFixed(2)} s: map ${s.map} at ${s.origin[0]},${s.origin[2]} heading ${s.heading}, ${s.light} light, sun ${s.sun}, ${s.camera.length} camera keys` +
      (s.props.length ? `, props ${s.props.map((p) => `${p.asset}${p.held ? `@${p.held.actor}` : ''} ${p.from.toFixed(1)}-${p.to.toFixed(1)}`).join(', ')}` : '') +
      (s.pictures.length ? `, pictures ${s.pictures.map((p) => `${p.file} ${p.from.toFixed(1)}-${p.to.toFixed(1)}`).join(', ')}` : ''),
  );
  return [`scene ${tl.scene}, sun ${tl.sun}, ${tl.duration.toFixed(2)} s, ${tl.shots.length} shots, maps ${tl.maps.join(' ')}`, ...shots, ...rows, ...tl.warnings.map((w) => `warning: ${w}`)].join('\n');
}
