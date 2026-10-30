/**
 * Adversarial rows for the Phase 1 rules core of Archer's Revenge.
 *
 * The rows answer the hostile inputs of the track test strategy, section 5, and the open items
 * of Review A: RA-AR-3 (the bot cache must follow a moved layout), RA-AR-4 (the rows for
 * `angle: 1e308`, `angle: true`, and an extra field), and RA-AR-5 (a path with no contact).
 * The file reads the core and the bot. It changes no source file.
 */
import { describe, expect, it } from 'vitest';
import {
  TUNING,
  createArchersRevenge,
  layoutOf,
  pathOf,
  shotOf,
  type ArchersRevengeEvent,
  type Layout,
  type Shot,
} from '../../../src/games/archers-revenge/core/index.js';
import { aimForLane } from '../../../src/games/archers-revenge/qc/bot.js';

const WORDS = [
  { term: 'cat', translation: 'แมว' },
  { term: 'dog', translation: 'หมา' },
  { term: 'bird', translation: 'นก' },
];

/** A started run with three lanes. */
const started = () => {
  const sim = createArchersRevenge(WORDS, { seed: 3, helper: false });
  sim.dispatch({ type: 'start' });
  return sim;
};

/** The first grid pair that hits the target of `lane`, in the R13 order. An oracle of the core. */
const firstHittingPair = (layout: Layout, lane: number): { angle: number; power: number } | null => {
  for (let angle = 0; angle <= 80; angle++) {
    for (let power = 10; power <= 100; power++) {
      const contact = shotOf(layout, [], angle, power).contact;
      if (contact.kind === 'target' && contact.index === lane) return { angle, power };
    }
  }
  return null;
};

// ---------------------------------------------------------------- ADV-AR-1: the hostile command values

describe('ADV-AR-1: the hostile command values of the strategy, section 5', () => {
  it('angle -0 gives the path of 0, by Object.is for each point, and no point is a negative zero', () => {
    let paths = 0;
    let points = 0;
    for (const lanes of [2, 3]) {
      const layout = layoutOf(lanes);
      for (const power of [10, 50, 100]) {
        const minus = pathOf(layout, -0, power);
        const zero = pathOf(layout, 0, power);
        expect(minus.length).toBe(zero.length);
        for (let i = 0; i < minus.length; i++) {
          expect(Object.is(minus[i]!.x, zero[i]!.x), `x at point ${i}, lanes ${lanes}, power ${power}`).toBe(true);
          expect(Object.is(minus[i]!.y, zero[i]!.y), `y at point ${i}, lanes ${lanes}, power ${power}`).toBe(true);
          expect(Object.is(minus[i]!.x, -0), `x at point ${i} is a negative zero`).toBe(false);
          expect(Object.is(minus[i]!.y, -0), `y at point ${i} is a negative zero`).toBe(false);
          points += 1;
        }
        paths += 1;
      }
    }
    expect(paths).toBe(6);
    expect(points).toBeGreaterThan(paths);
  });

  it('a fire command with angle -0 gives the same events as angle 0, and the event carries +0', () => {
    const run = (angle: number) => {
      const sim = started();
      const events = sim.dispatch({ type: 'fire', angle, power: 50 } as never) as ArchersRevengeEvent[];
      return { events, shots: sim.state.shots };
    };
    const minus = run(-0);
    const zero = run(0);
    expect(minus.shots).toBe(1);
    expect(minus.events.length).toBeGreaterThan(0);
    expect(minus.events).toStrictEqual(zero.events);
    for (const event of minus.events) {
      const angle = (event as { angle?: number }).angle;
      expect(angle).toBe(0);
      expect(Object.is(angle, -0)).toBe(false);
    }
  });

  const HOSTILE: [string, unknown, unknown][] = [
    ['angle 1e308', 1e308, 50],
    ['angle true', true, 50],
    ['angle false', false, 50],
    ['power string', 45, '50'],
    ['angle string', '45', 50],
    ['angle NaN', Number.NaN, 50],
    ['power NaN', 45, Number.NaN],
    ['angle Infinity', Number.POSITIVE_INFINITY, 50],
    ['power Infinity', 45, Number.POSITIVE_INFINITY],
    ['angle 45.5', 45.5, 50],
    ['power 45.5', 45, 45.5],
    ['power -1', 45, -1],
    ['angle -1', -1, 50],
    ['power 101', 45, 101],
    ['angle 81', 81, 50],
    ['angle null', null, 50],
    ['power null', 45, null],
    ['angle undefined', undefined, 50],
    ['power undefined', 45, undefined],
  ];

  it.each(HOSTILE)('a fire command with %s is rejected and changes no state', (_name, angle, power) => {
    const sim = started();
    const before = sim.snapshot();
    expect(sim.dispatch({ type: 'fire', angle, power } as never)).toEqual([{ type: 'rejected', command: 'fire' }]);
    expect(sim.snapshot()).toEqual(before);
    expect(sim.state.shots).toBe(0);
  });

  it('a fire command with no fields is rejected and changes no state', () => {
    const sim = started();
    const before = sim.snapshot();
    expect(sim.dispatch({ type: 'fire' } as never)).toEqual([{ type: 'rejected', command: 'fire' }]);
    expect(sim.snapshot()).toEqual(before);
    expect(sim.state.shots).toBe(0);
  });

  it('a fire command with an extra field gives the same events as the command without it', () => {
    const run = (command: Record<string, unknown>) => {
      const sim = started();
      const events = sim.dispatch(command as never);
      return { events, snapshot: sim.snapshot() };
    };
    const plain = run({ type: 'fire', angle: 45, power: 50 });
    const extra = run({ type: 'fire', angle: 45, power: 50, extra: 'x', lane: 0, nested: { a: 1 } });
    expect(plain.events.length).toBeGreaterThan(0);
    expect(extra.events).toStrictEqual(plain.events);
    expect(extra.snapshot).toEqual(plain.snapshot);
    const carried = JSON.stringify(extra.events);
    expect(carried.includes('extra')).toBe(false);
    expect(carried.includes('nested')).toBe(false);
  });

  it('a fire command before the start is rejected and changes no state', () => {
    const sim = createArchersRevenge(WORDS, { seed: 3, helper: false });
    const before = sim.snapshot();
    expect(sim.dispatch({ type: 'fire', angle: 45, power: 50 } as never)).toEqual([{ type: 'rejected', command: 'fire' }]);
    expect(sim.snapshot()).toEqual(before);
    expect(sim.state.shots).toBe(0);
  });
});

// ---------------------------------------------------------------- ADV-AR-2: the QC hook surface of section 9

describe('ADV-AR-2: the QC hook surface of the strategy, section 9', () => {
  it('a hostile command never changes the state', () => {
    const sim = started();
    const before = sim.snapshot();
    const commands: unknown[] = [
      null,
      undefined,
      42,
      'fire',
      [],
      { type: 'nope' },
      { type: 'fire' },
      { type: 'fire', angle: 45 },
      { type: 'fire', power: 50 },
    ];
    for (const command of commands) {
      let error: unknown = null;
      try {
        sim.dispatch(command as never);
      } catch (thrown) {
        error = thrown;
      }
      if (error !== null) expect(error).toBeInstanceOf(TypeError);
      expect(sim.snapshot()).toEqual(before);
      expect(sim.state.shots).toBe(0);
    }
    expect(commands.length).toBe(9);
  });

  it('a command that is not an object gives no event and no state change', () => {
    const sim = started();
    const before = sim.snapshot();
    for (const command of [null, undefined]) {
      let events: unknown = null;
      let error: unknown = null;
      try {
        events = sim.dispatch(command as never);
      } catch (thrown) {
        error = thrown;
      }
      expect(error === null || error instanceof TypeError).toBe(true);
      if (error === null) expect(events).toEqual([]);
      expect(sim.snapshot()).toEqual(before);
    }
  });
});

// ---------------------------------------------------------------- ADV-AR-3: a path with no contact

describe('ADV-AR-3: a path with no contact', () => {
  it('a path that leaves the scene ends at the edge of the scene', () => {
    const layout = layoutOf(3);
    let edge: Shot | null = null;
    for (let angle = 0; angle <= 80 && edge === null; angle++) {
      for (let power = 10; power <= 100; power++) {
        const shot = shotOf(layout, [], angle, power);
        if (shot.contact.kind === 'edge') {
          edge = shot;
          break;
        }
      }
    }
    expect(edge, 'a grid pair that leaves the scene').not.toBeNull();
    const last = edge!.points[edge!.points.length - 1]!;
    expect(last.x).toBe(layout.width);
    expect(Object.is(last.x, edge!.contact.x)).toBe(true);
    expect(Object.is(last.y, edge!.contact.y)).toBe(true);
    expect(edge!.points.length).toBeLessThan(TUNING.arc.maxSteps);
  });

  it('a layout with no reachable contact never returns a shot without a contact', () => {
    const open: Layout = { lanes: 1, width: 10000, groundY: -10000, hills: [], towers: [], targets: [] };
    let outcome = 'shot';
    try {
      const shot = shotOf(open, [], 45, 50);
      outcome = shot.contact.kind === 'edge' ? 'edge' : 'shot';
    } catch (error) {
      outcome = 'threw';
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain('step limit');
    }
    expect(['threw', 'edge']).toContain(outcome);
  });
});

// ---------------------------------------------------------------- ADV-AR-4: the bot cache

describe('ADV-AR-4: the bot cache of the bot module', () => {
  it('the bot aim follows a layout with a moved target box', () => {
    const original = layoutOf(3);
    const moved = layoutOf(3);
    moved.targets[0] = { x0: 8, x1: 9, y0: 7, y1: 8.2 };
    const aim = aimForLane(moved, 0);
    expect(aim).not.toBeNull();
    const contact = shotOf(moved, [], aim!.angle, aim!.power).contact;
    expect(contact.kind).toBe('target');
    expect(contact.index).toBe(0);
    expect(contact.x).toBeGreaterThanOrEqual(moved.targets[0]!.x0);
    expect(contact.x).toBeLessThanOrEqual(moved.targets[0]!.x1);
    expect(contact.y).toBeGreaterThanOrEqual(moved.targets[0]!.y0);
    expect(contact.y).toBeLessThanOrEqual(moved.targets[0]!.y1);
    const stale = aimForLane(original, 0);
    expect(stale).not.toBeNull();
    const staleContact = shotOf(moved, [], stale!.angle, stale!.power).contact;
    expect(staleContact.kind === 'target' && staleContact.index === 0).toBe(false);
    expect(aim).toEqual(firstHittingPair(moved, 0));
  });
});
