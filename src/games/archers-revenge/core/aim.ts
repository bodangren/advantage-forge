/** Fixed geometry and segment contacts. Every path point uses the closed form at i * dt. */
import { TUNING } from './tuning.js';
import type { Box, Contact, ContactKind, Layout, Point, Shot } from './types.js';

/** Sine for whole degrees from 0 to 90. These literals do not depend on the runtime engine. */
export const SIN_DEG: readonly number[] = Object.freeze([
  0, 0.01745240643728351, 0.03489949670250097, 0.052335956242943835, 0.0697564737441253,
  0.08715574274765817, 0.10452846326765347, 0.12186934340514748, 0.13917310096006544, 0.15643446504023087,
  0.17364817766693033, 0.1908089953765448, 0.20791169081775934, 0.224951054343865, 0.24192189559966773,
  0.25881904510252074, 0.27563735581699916, 0.29237170472273677, 0.3090169943749474, 0.3255681544571567,
  0.3420201433256687, 0.35836794954530027, 0.374606593415912, 0.39073112848927377, 0.4067366430758002,
  0.42261826174069944, 0.4383711467890774, 0.45399049973954675, 0.4694715627858908, 0.48480962024633706,
  0.49999999999999994, 0.5150380749100542, 0.5299192642332049, 0.5446390350150271, 0.5591929034707469,
  0.573576436351046, 0.5877852522924731, 0.6018150231520483, 0.6156614753256583, 0.6293203910498374,
  0.6427876096865393, 0.6560590289905073, 0.6691306063588582, 0.6819983600624985, 0.6946583704589973,
  0.7071067811865475, 0.7193398003386511, 0.7313537016191705, 0.7431448254773942, 0.754709580222772,
  0.766044443118978, 0.7771459614569709, 0.788010753606722, 0.7986355100472928, 0.8090169943749475,
  0.8191520442889918, 0.8290375725550417, 0.838670567945424, 0.848048096156426, 0.8571673007021123,
  0.8660254037844386, 0.8746197071393957, 0.8829475928589269, 0.8910065241883678, 0.898794046299167,
  0.9063077870366499, 0.9135454576426009, 0.9205048534524404, 0.9271838545667874, 0.9335804264972017,
  0.9396926207859083, 0.9455185755993167, 0.9510565162951535, 0.9563047559630354, 0.9612616959383189,
  0.9659258262890683, 0.9702957262759965, 0.9743700647852352, 0.9781476007338056, 0.981627183447664,
  0.984807753012208, 0.9876883405951378, 0.9902680687415704, 0.992546151641322, 0.9945218953682733,
  0.9961946980917455, 0.9975640502598242, 0.9986295347545738, 0.9993908270190958, 0.9998476951563913,
  1,
]);

/** Fresh layout data keeps callers and simulation snapshots independent. */
export function layoutOf(lanes: number): Layout {
  const targets = Array.from({ length: lanes }, (_, lane): Box => {
    const x = 8 + lane * 6;
    const y = [4, 5, 3][lane]!;
    return { x0: x, x1: x + 1, y0: y, y1: y + 1.2 };
  });
  return {
    lanes,
    width: 28,
    groundY: 0,
    hills: [{ x0: -2, x1: 1.5, y0: 0, y1: 2 }],
    towers: targets.map((box) => ({ x0: box.x0, x1: box.x1, y0: 0, y1: box.y0 - 0.2 })),
    targets,
  };
}

/** The entry fraction of a segment through two rectangle slabs, or null. */
function segmentBox(a: Point, b: Point, box: Box): number | null {
  let enter = 0;
  let leave = 1;
  for (const [start, delta, low, high] of [
    [a.x, b.x - a.x, box.x0, box.x1],
    [a.y, b.y - a.y, box.y0, box.y1],
  ] as const) {
    if (delta === 0) {
      if (start < low || start > high) return null;
    } else {
      const t0 = (low - start) / delta;
      const t1 = (high - start) / delta;
      enter = Math.max(enter, Math.min(t0, t1));
      leave = Math.min(leave, Math.max(t0, t1));
      if (enter > leave) return null;
    }
  }
  return enter;
}

/** The first contact on one segment. Ties prefer a target, then a tower, then the ground. */
function firstContact(layout: Layout, blocked: readonly number[], a: Point, b: Point): Contact | null {
  let first = Infinity;
  let contact: Contact | null = null;
  const consider = (s: number | null, kind: ContactKind, index: number): void => {
    if (s === null || s >= first) return;
    first = s;
    contact = { kind, index, x: a.x + s * (b.x - a.x), y: a.y + s * (b.y - a.y) };
  };
  layout.targets.forEach((box, index) => consider(segmentBox(a, b, box), blocked.includes(index) ? 'shut' : 'target', index));
  layout.towers.forEach((box, index) => consider(segmentBox(a, b, box), 'tower', index));
  layout.hills.forEach((box, index) => consider(segmentBox(a, b, box), 'ground', index));
  if (a.y <= layout.groundY) consider(0, 'ground', -1);
  else if (b.y <= layout.groundY) consider((a.y - layout.groundY) / (a.y - b.y), 'ground', -1);
  if (a.x >= layout.width) consider(0, 'edge', -1);
  else if (b.x >= layout.width) consider((layout.width - a.x) / (b.x - a.x), 'edge', -1);
  return contact;
}

/** One pure shot. The final point is the first contact, not the next arc sample. */
export function shotOf(layout: Layout, blockedLanes: readonly number[], angle: number, power: number): Shot {
  const { origin, gravity, dt, maxSpeed, maxSteps } = TUNING.arc;
  const speed = maxSpeed * power / 100;
  const vx = speed * SIN_DEG[90 - angle]!;
  const vy = speed * SIN_DEG[angle]!;
  const points: Point[] = [{ ...origin }];
  for (let i = 1; i <= maxSteps; i++) {
    const t = i * dt;
    const next = { x: origin.x + vx * t, y: origin.y + vy * t - gravity * t * t / 2 };
    const contact = firstContact(layout, blockedLanes, points[points.length - 1]!, next);
    if (contact) {
      points.push({ x: contact.x, y: contact.y });
      return { points, contact };
    }
    points.push(next);
  }
  throw new Error('The arc exceeded the step limit without a contact.');
}

/** The full helper path shares the shot calculation. Shut targets keep the same geometry. */
export function pathOf(layout: Layout, angle: number, power: number): Point[] {
  return shotOf(layout, [], angle, power).points;
}
