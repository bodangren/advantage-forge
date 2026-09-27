/**
 * Pointer drag for touch and mouse: the student drags an element (a word ingredient) and drops it
 * on a target (a cauldron). A short press without movement is a tap, not a drag, so the same
 * element also works with taps. The dragged copy follows the pointer; the original stays in place
 * until the game moves or removes it.
 */
export interface DragHandlers {
  /** A press and release with no drag. */
  tap?(): void;
  start?(): void;
  /** The pointer position in viewport pixels during the drag. */
  move?(x: number, y: number): void;
  /** Where the drag ended, in viewport pixels. */
  drop(x: number, y: number): void;
}

const THRESHOLD = 6;

/** Makes `el` draggable; returns a function that removes the behavior. */
export function makeDraggable(el: HTMLElement, on: DragHandlers): () => void {
  el.style.touchAction = 'none';
  let startX = 0;
  let startY = 0;
  let offX = 0;
  let offY = 0;
  let id: number | null = null;
  let ghost: HTMLElement | null = null;

  const down = (e: PointerEvent): void => {
    if (id !== null || (e.pointerType === 'mouse' && e.button !== 0)) return;
    id = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    const r = el.getBoundingClientRect();
    offX = e.clientX - r.left;
    offY = e.clientY - r.top;
    el.setPointerCapture(e.pointerId);
  };
  const move = (e: PointerEvent): void => {
    if (e.pointerId !== id) return;
    if (!ghost) {
      if (Math.hypot(e.clientX - startX, e.clientY - startY) < THRESHOLD) return;
      const r = el.getBoundingClientRect();
      ghost = el.cloneNode(true) as HTMLElement;
      ghost.classList.add('drag-ghost');
      Object.assign(ghost.style, { position: 'fixed', left: '0', top: '0', width: `${r.width}px`, height: `${r.height}px`, margin: '0', pointerEvents: 'none', zIndex: '50' });
      document.body.append(ghost);
      el.classList.add('dragging');
      on.start?.();
    }
    ghost.style.transform = `translate(${e.clientX - offX}px, ${e.clientY - offY}px) scale(1.08)`;
    on.move?.(e.clientX, e.clientY);
  };
  const up = (e: PointerEvent): void => {
    if (e.pointerId !== id) return;
    id = null;
    if (ghost) {
      ghost.remove();
      ghost = null;
      el.classList.remove('dragging');
      if (e.type === 'pointerup') on.drop(e.clientX, e.clientY);
    } else if (e.type === 'pointerup') on.tap?.();
  };
  el.addEventListener('pointerdown', down);
  el.addEventListener('pointermove', move);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  return () => {
    el.removeEventListener('pointerdown', down);
    el.removeEventListener('pointermove', move);
    el.removeEventListener('pointerup', up);
    el.removeEventListener('pointercancel', up);
    ghost?.remove();
  };
}

/** True when the viewport point is inside the element's box (grown by `pad` pixels). */
export function hit(el: Element, x: number, y: number, pad = 0): boolean {
  const r = el.getBoundingClientRect();
  return x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad;
}
