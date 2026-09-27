/**
 * Screens and the "whoosh": one screen shows at a time; moving forward slides the new screen in
 * from the right (back: from the left) with one sound. Hash routes give phones a working back
 * button: `#/`, `#/read/<story>`, `#/play/<game>/<story>`, `#/results`, `#/boss`.
 */
export type Route =
  | { name: 'select' }
  | { name: 'read'; story: string }
  | { name: 'play'; game: string; story: string }
  | { name: 'results' }
  | { name: 'boss' };

export function parseRoute(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  if (parts[0] === 'read' && parts[1]) return { name: 'read', story: parts[1] };
  if (parts[0] === 'play' && parts[1] && parts[2]) return { name: 'play', game: parts[1], story: parts[2] };
  if (parts[0] === 'results') return { name: 'results' };
  if (parts[0] === 'boss') return { name: 'boss' };
  return { name: 'select' };
}

export function routeHash(r: Route): string {
  switch (r.name) {
    case 'select':
      return '#/';
    case 'read':
      return `#/read/${encodeURIComponent(r.story)}`;
    case 'play':
      return `#/play/${encodeURIComponent(r.game)}/${encodeURIComponent(r.story)}`;
    default:
      return `#/${r.name}`;
  }
}

const ORDER: Route['name'][] = ['select', 'read', 'play', 'results', 'boss'];

/** Switches visible screens with a short slide; resolves when the new screen is in place. */
export class Screens {
  private current: HTMLElement | null = null;

  constructor(private readonly whoosh: () => void) {}

  show(el: HTMLElement, from: Route['name'] | null, to: Route['name']): Promise<void> {
    const old = this.current;
    this.current = el;
    if (old === el) return Promise.resolve();
    const forward = from === null || ORDER.indexOf(to) >= ORDER.indexOf(from);
    const dx = forward ? 48 : -48;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (from !== null) this.whoosh();
    if (old) {
      if (reduce) old.classList.remove('on');
      else {
        const a = old.animate([{ transform: 'none', opacity: 1 }, { transform: `translateX(${-dx}px)`, opacity: 0 }], { duration: 180, easing: 'ease-in' });
        a.onfinish = () => old !== this.current && old.classList.remove('on');
      }
    }
    el.classList.add('on');
    if (reduce || from === null) return Promise.resolve();
    return el.animate([{ transform: `translateX(${dx}px)`, opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 260, easing: 'cubic-bezier(.2,.8,.2,1)', delay: 60, fill: 'backwards' }).finished.then(() => undefined);
  }

  /** Hides every screen (a game takes the whole page). */
  hideAll(): void {
    this.current?.classList.remove('on');
    this.current = null;
  }
}
