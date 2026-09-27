/**
 * A floating joystick for arena games: the student holds a finger (or the mouse) anywhere on the
 * play area and drags toward where the character should go; a knob shows the direction. On a
 * computer, WASD and the arrow keys steer too. The joystick reports a direction of length 0 to 1
 * in screen terms (x to the right, y down); the game turns it into world directions.
 */
export interface JoystickOptions {
  /** Drag distance in pixels for full speed. */
  radius?: number;
  /** Called with the new direction whenever it changes (0, 0 when released). */
  change(x: number, y: number): void;
}

export interface Joystick {
  dispose(): void;
}

const KEYS: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  a: [-1, 0],
  d: [1, 0],
  w: [0, -1],
  s: [0, 1],
};

/** Attaches a joystick to `surface` (the HUD layer); controls inside it keep their taps. */
export function attachJoystick(surface: HTMLElement, options: JoystickOptions): Joystick {
  const radius = options.radius ?? 56;
  const base = document.createElement('div');
  base.className = 'joystick';
  base.innerHTML = '<i></i>';
  const knob = base.firstElementChild as HTMLElement;
  surface.append(base);
  let id: number | null = null;
  let ox = 0;
  let oy = 0;
  let last: [number, number] = [0, 0];
  const held = new Set<string>();

  const emit = (x: number, y: number): void => {
    if (Math.abs(x - last[0]) < 0.02 && Math.abs(y - last[1]) < 0.02) return;
    last = [x, y];
    options.change(x, y);
  };

  const down = (e: PointerEvent): void => {
    // Buttons and tags keep their own taps.
    if (id !== null || (e.target as HTMLElement).closest('button, a, input, .card')) return;
    id = e.pointerId;
    ox = e.clientX;
    oy = e.clientY;
    const r = surface.getBoundingClientRect();
    base.style.left = `${ox - r.left}px`;
    base.style.top = `${oy - r.top}px`;
    knob.style.transform = 'translate(-50%, -50%)';
    base.classList.add('on');
    surface.setPointerCapture?.(e.pointerId);
  };
  const move = (e: PointerEvent): void => {
    if (e.pointerId !== id) return;
    let dx = e.clientX - ox;
    let dy = e.clientY - oy;
    const len = Math.hypot(dx, dy);
    if (len > radius) {
      dx = (dx / len) * radius;
      dy = (dy / len) * radius;
    }
    knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    // A small dead zone, then a linear ramp to full speed.
    const k = len < 8 ? 0 : Math.min(1, len / radius);
    emit(len ? (dx / Math.hypot(dx, dy)) * k : 0, len ? (dy / Math.hypot(dx, dy)) * k : 0);
  };
  const up = (e: PointerEvent): void => {
    if (e.pointerId !== id) return;
    id = null;
    base.classList.remove('on');
    emit(0, 0);
  };
  const keyState = (): void => {
    let x = 0;
    let y = 0;
    for (const k of held) {
      const v = KEYS[k];
      if (v) {
        x += v[0];
        y += v[1];
      }
    }
    const len = Math.hypot(x, y) || 1;
    emit(x / len, y / len);
  };
  const keydown = (e: KeyboardEvent): void => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (!KEYS[key]) return;
    e.preventDefault();
    held.add(key);
    keyState();
  };
  const keyup = (e: KeyboardEvent): void => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (!held.delete(key)) return;
    keyState();
  };
  surface.style.touchAction = 'none';
  surface.addEventListener('pointerdown', down);
  surface.addEventListener('pointermove', move);
  surface.addEventListener('pointerup', up);
  surface.addEventListener('pointercancel', up);
  window.addEventListener('keydown', keydown);
  window.addEventListener('keyup', keyup);
  return {
    dispose() {
      surface.removeEventListener('pointerdown', down);
      surface.removeEventListener('pointermove', move);
      surface.removeEventListener('pointerup', up);
      surface.removeEventListener('pointercancel', up);
      window.removeEventListener('keydown', keydown);
      window.removeEventListener('keyup', keyup);
      surface.style.touchAction = '';
      base.remove();
    },
  };
}
