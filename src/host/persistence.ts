/**
 * What the standalone site remembers on this device: unlocked hero looks and the last choices.
 * Only this module touches browser storage (games never persist); in the APK the app backend
 * owns this. Storage can be blocked (private windows), so every call is safe to fail.
 */
const KEY = 'chibi-quest';

export interface Saved {
  /** Hero id to the chosen color preset. */
  looks: Record<string, string>;
  /** Hero id to the color presets the student has unlocked (3-star rewards). */
  unlocked: Record<string, string[]>;
  /** The hero the student plays. */
  hero?: string | undefined;
  level?: string | undefined;
  story?: string | undefined;
  game?: string | undefined;
  helper?: boolean | undefined;
  /** True: play games in 2D where they have a 2D view. */
  flat?: boolean | undefined;
}

function read(): Saved {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<Saved>;
    // Looks saved by the first demo version.
    const old = JSON.parse(localStorage.getItem('chibi-quest-looks') ?? '{}') as Record<string, string>;
    const looks = { ...old, ...(raw.looks ?? {}) };
    // A look chosen before unlocks were tracked counts as unlocked.
    const unlocked: Record<string, string[]> = { ...(raw.unlocked ?? {}) };
    for (const [hero, look] of Object.entries(looks)) if (look !== 'default' && !unlocked[hero]?.includes(look)) unlocked[hero] = [...(unlocked[hero] ?? []), look];
    return { ...raw, looks, unlocked };
  } catch {
    return { looks: {}, unlocked: {} };
  }
}

let cache: Saved | null = null;

export function load(): Saved {
  cache ??= read();
  return cache;
}

export function save(change: Partial<Saved>): void {
  cache = { ...load(), ...change };
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // The change still applies for this visit.
  }
}
