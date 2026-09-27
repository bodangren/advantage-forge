/**
 * The showcase tour is one script (script.ts) of plain data: camera shots, actors with clip cues,
 * on-screen text, narration lines, sound cues, and music moods. The page (main.ts) renders any
 * moment of it with seek(t), so a recorder can step through it frame by frame, and the audio
 * builder reads the same cues.
 */

export type V3 = readonly [number, number, number];

/** The three sample maps, each placed at its own offset in one scene. */
export type SetName = 'hamlet' | 'forest' | 'vault';

/** Lighting moods. */
export type Mood = 'day' | 'golden' | 'dusk' | 'vault';

export interface CamKey {
  t: number;
  /** Camera position, set-local meters. */
  pos: V3;
  /** Look-at point, set-local meters. */
  look: V3;
  fov?: number;
}

export interface Shot {
  start: number;
  end: number;
  set: SetName;
  mood: Mood;
  /** Keys in absolute seconds; the camera passes through them on a smooth curve. */
  keys: CamKey[];
  /** Camera shake strength (meters) as [t, strength] pairs; 0 between them. */
  shake?: readonly (readonly [number, number])[];
}

export interface PathKey {
  t: number;
  at: V3;
  /** Degrees around Y; 0 faces +Z (south). Omitted: keep the previous yaw. */
  yaw?: number;
}

export interface ClipCue {
  t: number;
  clip: string;
  /** Loop the clip (idle, walk, run, fly). One-shot clips hold their last frame. */
  loop?: boolean;
  speed?: number;
  /** Start this many seconds into the clip. */
  offset?: number;
}

export interface Actor {
  id: string;
  asset: string;
  set: SetName;
  /** Visible from..to (absolute seconds). */
  show: readonly [number, number];
  path: PathKey[];
  clips: ClipCue[];
  scale?: number;
  /** Pop in with a bouncy scale when it appears. */
  pop?: boolean;
  /** Color preset changes over time (the recolored atlas from textures/baseColor.<preset>.png). */
  presets?: readonly { t: number; preset: string | null }[];
}

export type CaptionKind = 'title' | 'banner' | 'lower' | 'tag' | 'quest' | 'bubble' | 'endcard';

export interface Caption {
  start: number;
  end: number;
  kind: CaptionKind;
  text: string;
  sub?: string;
  /** Quest cards: the answer appears at this time with a check mark. */
  answerAt?: number;
  answer?: string;
  /** Tags and bubbles float above this actor. */
  actor?: string;
  /** Extra height above the actor's origin for a tag or bubble (meters). */
  lift?: number;
  /** Titles and end cards: vertical center in percent of the screen height (default 44). */
  top?: number;
  /** Accent color for a banner or tag. */
  color?: string;
}

export interface Fade {
  /** Middle of the fade: the screen is fully covered here. */
  t: number;
  /** Seconds from clear to covered (and covered to clear). */
  half: number;
  color: string;
}

export type SfxKind =
  | 'whoosh'
  | 'pop'
  | 'sparkle'
  | 'chomp'
  | 'roar'
  | 'howl'
  | 'boom'
  | 'tick'
  | 'correct'
  | 'swoosh'
  | 'clang'
  | 'zap'
  | 'fanfare'
  | 'rumble'
  | 'screech';

export interface Sfx {
  t: number;
  kind: SfxKind;
  gain?: number;
}

export type MusicMood = 'mystery' | 'bright' | 'heroes' | 'village' | 'forest' | 'vault' | 'battle' | 'finale';

export interface MusicCue {
  start: number;
  end: number;
  mood: MusicMood;
}

export interface Narration {
  start: number;
  end: number;
  /** The narrator's line (voice-over script and subtitle file). */
  text: string;
}

/** A YouTube chapter (the description's timestamp list). */
export interface Chapter {
  t: number;
  title: string;
}

/** A learning moment: what the quest practices, for teachers and the video description. */
export interface Lesson {
  t: number;
  quest: string;
  skill: string;
  grades: string;
}

export interface Tour {
  title: string;
  duration: number;
  chapters: Chapter[];
  lessons: Lesson[];
  shots: Shot[];
  actors: Actor[];
  captions: Caption[];
  fades: Fade[];
  sfx: Sfx[];
  music: MusicCue[];
  narration: Narration[];
}
