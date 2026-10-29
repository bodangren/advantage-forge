/**
 * The Archer's Revenge rules: the aim command, the arc, the hit test, waves, shields, courage,
 * and the evidence. Row ids R1 to R17 refer to the track test strategy, section 4. The owner
 * assumptions Q1 to Q3 are spec defaults; a different answer from the owner changes the row.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { storyGameEvidenceSchema } from '../../../src/apk3d/contracts/index.js';
import { createRng } from '../../../src/apk3d/sim/index.js';
import * as core from '../../../src/games/archers-revenge/core/index.js';
import {
  ARCHERS_REVENGE_EVENT_TYPES,
  TUNING,
  createArchersRevenge,
  evidenceOf,
  formationOf,
  resultsOf,
  roundOf,
  targetsOf,
  waveSizes,
  wordsOf,
} from '../../../src/games/archers-revenge/core/index.js';
import {
  ANGLES,
  FIXED_PAIRS,
  GRID_SIZE,
  LAYOUT_LANES,
  POWERS,
  SHORT_STORY,
  STORY,
  create,
  fire,
  layoutOfState,
  missPair,
  needAim,
  needTuning,
  numbersOf,
  ofType,
  pairFor,
  playToEnd,
  rightLane,
  sameNumbers,
  shootMiss,
  shootRight,
  shootWrong,
  types,
  wrongLane,
  type AimCore,
  type Box,
  type ContactKind,
  type Layout,
  type Point,
} from './helpers.js';

const SEEDS = Array.from({ length: 30 }, (_, i) => i + 1);
const CORE_DIR = join(process.cwd(), 'src', 'games', 'archers-revenge', 'core');
const BOT_FILE = join(process.cwd(), 'src', 'games', 'archers-revenge', 'qc', 'bot.ts');

/** Every `.ts` file below a folder. */
function filesIn(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? filesIn(path) : path.endsWith('.ts') ? [path] : [];
  });
}

/** D5, from the exported constants and the exported table: point `i` of the arc. */
function closedPoint(A: AimCore, angle: number, power: number, i: number): Point {
  const { origin, gravity, dt, maxSpeed } = A.TUNING.arc;
  const speed = (maxSpeed * power) / 100;
  const vx = speed * A.SIN_DEG[90 - angle]!;
  const vy = speed * A.SIN_DEG[angle]!;
  const t = i * dt;
  return { x: origin.x + vx * t, y: origin.y + vy * t - (gravity * t * t) / 2 };
}

/** The second reference of R4: the same arc with the engine sine and cosine (test side only). */
function mathPoint(A: AimCore, angle: number, power: number, i: number): Point {
  const { origin, gravity, dt, maxSpeed } = A.TUNING.arc;
  const speed = (maxSpeed * power) / 100;
  const rad = (angle * Math.PI) / 180;
  const t = i * dt;
  return { x: origin.x + speed * Math.cos(rad) * t, y: origin.y + speed * Math.sin(rad) * t - (gravity * t * t) / 2 };
}

// ---------------------------------------------------------------- the R7 oracle (Liang-Barsky)

/** The smallest `s` in [0, 1] where `a + s (b - a)` is inside the closed box, or null. */
function segmentBox(a: Point, b: Point, box: Box): number | null {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  let t0 = 0;
  let t1 = 1;
  const clip = (p: number, q: number): boolean => {
    if (p === 0) return q >= 0;
    const r = q / p;
    if (p < 0) {
      if (r > t1) return false;
      if (r > t0) t0 = r;
    } else {
      if (r < t0) return false;
      if (r < t1) t1 = r;
    }
    return true;
  };
  if (clip(-dx, a.x - box.x0) && clip(dx, box.x1 - a.x) && clip(-dy, a.y - box.y0) && clip(dy, box.y1 - a.y)) return t0;
  return null;
}

interface OracleHit {
  kind: ContactKind;
  index: number;
  s: number;
}

/** Every contact of one segment with the layout: boxes, the ground line, and the scene edge. */
function oracleHits(layout: Layout, blocked: readonly number[], a: Point, b: Point): OracleHit[] {
  const hits: OracleHit[] = [];
  layout.targets.forEach((box, lane) => {
    const s = segmentBox(a, b, box);
    if (s !== null) hits.push({ kind: blocked.includes(lane) ? 'shut' : 'target', index: lane, s });
  });
  layout.towers.forEach((box, index) => {
    const s = segmentBox(a, b, box);
    if (s !== null) hits.push({ kind: 'tower', index, s });
  });
  layout.hills.forEach((box, index) => {
    const s = segmentBox(a, b, box);
    if (s !== null) hits.push({ kind: 'ground', index, s });
  });
  if (a.y <= layout.groundY) hits.push({ kind: 'ground', index: -1, s: 0 });
  else if (b.y <= layout.groundY) hits.push({ kind: 'ground', index: -1, s: (a.y - layout.groundY) / (a.y - b.y) });
  if (a.x >= layout.width) hits.push({ kind: 'edge', index: -1, s: 0 });
  else if (b.x >= layout.width) hits.push({ kind: 'edge', index: -1, s: (layout.width - a.x) / (b.x - a.x) });
  return hits;
}

const inside = (p: Point, box: Box): boolean => p.x >= box.x0 && p.x <= box.x1 && p.y >= box.y0 && p.y <= box.y1;
const boxesOf = (layout: Layout): Box[] => [...layout.targets, ...layout.towers, ...layout.hills];

// ---------------------------------------------------------------- content (existing rows)

describe('content', () => {
  it('targets every story word once, in a seeded order, in evenly sized waves', () => {
    const targets = targetsOf(STORY, createRng(3), TUNING.wordsPerWave);
    expect(targets).toHaveLength(STORY.vocabulary.length);
    expect(new Set(targets.map((t) => t.id)).size).toBe(STORY.vocabulary.length);
    for (const t of targets) {
      const w = STORY.vocabulary.find((v) => v.id === t.id)!;
      expect([t.term, t.translation]).toEqual([w.term, w.translation]);
      expect(t).toMatchObject({ attempts: 0, correctFirstTry: false, solved: false });
    }
    expect(targetsOf(STORY, createRng(3), 5).map((t) => t.id)).toEqual(targets.map((t) => t.id));
    expect(targetsOf(STORY, createRng(4), 5).map((t) => t.id)).not.toEqual(targets.map((t) => t.id));
  });

  it('waveSizes spreads the words evenly', () => {
    expect(waveSizes(11, 5)).toEqual([4, 4, 3]);
    expect(waveSizes(10, 5)).toEqual([5, 5]);
    expect(waveSizes(6, 5)).toEqual([3, 3]);
    expect(waveSizes(4, 5)).toEqual([4]);
    expect(waveSizes(0, 5)).toEqual([]);
  });

  it('accepts the APK VocabularyInput too', () => {
    const input = [{ term: 'cat', translation: 'แมว' }, { term: '', translation: 'x' }, { term: 'dog', translation: 'หมา' }, { term: 'fish', translation: 'ปลา' }];
    expect(wordsOf(input).map((w) => w.id)).toEqual(['w-1', 'w-3', 'w-4']);
    const sim = createArchersRevenge(input, { seed: 1, helper: false });
    expect(sim.state.targetCount).toBe(3);
    playToEnd(sim);
    expect(sim.state.phase).toBe('victory');
  });

  it('a formation alternates the monster kinds, and ids are unique per wave and lane', () => {
    const a = formationOf(1, 3);
    expect(a.map((e) => e.kind)).toEqual(['mimic', 'skeleton', 'mimic']);
    expect(formationOf(2, 3).map((e) => e.kind)).toEqual(['skeleton', 'mimic', 'skeleton']);
    expect(new Set([...a, ...formationOf(2, 3)].map((e) => e.id)).size).toBe(6);
  });

  it('a round carries the right word once and distinct other words', () => {
    const targets = targetsOf(STORY, createRng(2), 5);
    const enemies = formationOf(1, 3);
    const rng = createRng(9);
    for (const t of targets) {
      const round = roundOf(targets, t.id, enemies, rng);
      expect(round.prompt).toBe(t.translation);
      expect(round.lanes).toHaveLength(3);
      expect(round.lanes.filter((l) => l.wordId === t.id)).toHaveLength(1);
      expect(new Set(round.lanes.map((l) => l.term.toLowerCase())).size).toBe(3);
      expect(round.lanes.every((l) => !l.blocked)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------- the aim command (R1, R2)

describe('the aim command', () => {
  it('R1: fire(angle, power) replaces fire(lane); a lane command is rejected after start', () => {
    const sim = create(5);
    sim.dispatch({ type: 'start' });
    const before = sim.snapshot();
    expect(sim.dispatch({ type: 'fire', lane: 0 } as never)).toEqual([{ type: 'rejected', command: 'fire' }]);
    expect(sim.snapshot()).toEqual(before);
    const events = fire(sim, 45, 50);
    expect(['shot', 'missed']).toContain(events[0]?.type);
    expect(sim.state.shots).toBe(1);
  });

  it('R2: TUNING.aim exports the bounds of D2', () => {
    expect(needTuning().aim).toEqual({ minAngle: 0, maxAngle: 80, minPower: 10, maxPower: 100 });
  });

  it.each([
    [0, 10],
    [0, 100],
    [80, 10],
    [80, 100],
  ])('R2: the bounds are valid: angle %i power %i gives shot or missed', (angle, power) => {
    const sim = create(5);
    sim.dispatch({ type: 'start' });
    const events = fire(sim, angle, power);
    expect(events.length).toBeGreaterThan(0);
    expect(['shot', 'missed']).toContain(events[0]!.type);
    expect(sim.state.shots).toBe(1);
  });

  const BAD: [string, unknown, unknown][] = [
    ['angle -1', -1, 50],
    ['angle 81', 81, 50],
    ['angle 45.5', 45.5, 50],
    ['power 9', 45, 9],
    ['power 101', 45, 101],
    ['power 0', 45, 0],
    ['angle NaN', Number.NaN, 50],
    ['power NaN', 45, Number.NaN],
    ['angle Infinity', Number.POSITIVE_INFINITY, 50],
    ['power Infinity', 45, Number.POSITIVE_INFINITY],
    ['angle string', '45', 50],
    ['power string', 45, '50'],
    ['angle missing', undefined, 50],
    ['power missing', 45, undefined],
  ];

  it.each(BAD)('R2: %s is rejected and changes no state', (_name, angle, power) => {
    needTuning();
    const sim = create(5);
    sim.dispatch({ type: 'start' });
    const before = sim.snapshot();
    const command: Record<string, unknown> = { type: 'fire' };
    if (angle !== undefined) command.angle = angle;
    if (power !== undefined) command.power = power;
    expect(sim.dispatch(command as never)).toEqual([{ type: 'rejected', command: 'fire' }]);
    expect(sim.snapshot()).toEqual(before);
    expect(sim.state.shots).toBe(0);
  });
});

// ---------------------------------------------------------------- the arc (R3, R4, R5)

describe('the arc', () => {
  it('R3: SIN_DEG has 91 frozen entries, 0 to 1, strictly rising, within 1e-12 of the sine', () => {
    const { SIN_DEG } = needAim('SIN_DEG');
    expect(SIN_DEG).toHaveLength(91);
    expect(Object.isFrozen(SIN_DEG)).toBe(true);
    expect(SIN_DEG[0]).toBe(0);
    expect(SIN_DEG[90]).toBe(1);
    for (let d = 1; d <= 90; d++) expect(SIN_DEG[d]!, `SIN_DEG[${d}] rises`).toBeGreaterThan(SIN_DEG[d - 1]!);
    const worst = Math.max(...SIN_DEG.map((v, d) => Math.abs(v - Math.sin((d * Math.PI) / 180))));
    expect(worst).toBeLessThanOrEqual(1e-12);
  });

  it('R4: TUNING.arc has a positive gravity, a positive step, a positive speed, and a whole step limit', () => {
    const { arc } = needTuning();
    expect(arc.gravity).toBeGreaterThan(0);
    expect(arc.dt).toBeGreaterThan(0);
    expect(arc.maxSpeed).toBeGreaterThan(0);
    expect(Number.isInteger(arc.maxSteps) && arc.maxSteps > 0).toBe(true);
    expect(Number.isFinite(arc.origin.x) && Number.isFinite(arc.origin.y)).toBe(true);
  });

  it.each(LAYOUT_LANES)('R4: %i lanes: every point before the contact is the closed form at t = i * dt', (lanes) => {
    const A = needAim('SIN_DEG', 'layoutOf', 'shotOf');
    needTuning();
    const layout = A.layoutOf(lanes);
    let checked = 0;
    for (const { angle, power } of FIXED_PAIRS) {
      const { points } = A.shotOf(layout, [], angle, power);
      expect(points.length, `angle ${angle} power ${power} has points`).toBeGreaterThanOrEqual(2);
      expect(points[0]).toEqual(A.TUNING.arc.origin);
      for (let i = 0; i < points.length - 1; i++) {
        const want = closedPoint(A, angle, power, i);
        const ref = mathPoint(A, angle, power, i);
        const p = points[i]!;
        expect(Math.abs(p.x - want.x), `angle ${angle} power ${power} point ${i} x`).toBeLessThanOrEqual(1e-9);
        expect(Math.abs(p.y - want.y), `angle ${angle} power ${power} point ${i} y`).toBeLessThanOrEqual(1e-9);
        expect(Math.abs(p.x - ref.x), `angle ${angle} power ${power} point ${i} x (Math reference)`).toBeLessThanOrEqual(1e-9);
        expect(Math.abs(p.y - ref.y), `angle ${angle} power ${power} point ${i} y (Math reference)`).toBeLessThanOrEqual(1e-9);
        checked += 1;
      }
    }
    expect(checked).toBeGreaterThan(FIXED_PAIRS.length);
  });

  it('R5 part A (artifact): no core file and not the bot names an engine-dependent function, a clock, or **', () => {
    const files = [...filesIn(CORE_DIR), BOT_FILE];
    expect(files.length).toBeGreaterThan(4);
    const banned: [string, RegExp][] = [
      ['Math function', /\bMath\s*\.\s*(sin|cos|tan|asin|acos|atan|atan2|sinh|cosh|tanh|asinh|acosh|atanh|exp|expm1|log|log2|log10|log1p|pow|sqrt|hypot|cbrt|random)\b/],
      ['** operator', /[\w)\]]\s*\*\*\s*[\w(]/],
      ['Date', /\bDate\b/],
      ['performance', /\bperformance\b/],
    ];
    const found: string[] = [];
    for (const file of files) {
      const lines = readFileSync(file, 'utf8').split('\n');
      lines.forEach((line, i) => {
        for (const [name, re] of banned) if (re.test(line)) found.push(`${file.slice(process.cwd().length + 1)}:${i + 1} ${name}: ${line.trim()}`);
      });
    }
    expect(found).toEqual([]);
    // Not vacuous: the scan must cover the file that holds the sine table (D4).
    const tableFiles = filesIn(CORE_DIR).filter((f) => /\bSIN_DEG\b/.test(readFileSync(f, 'utf8')));
    expect(tableFiles.length, 'a core file defines SIN_DEG').toBeGreaterThan(0);
  });

  describe('R5 part B (live): the core runs with throwing Math stubs', () => {
    const STUBBED = [
      'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2', 'sinh', 'cosh', 'tanh',
      'exp', 'expm1', 'log', 'log2', 'log10', 'log1p', 'pow', 'sqrt', 'hypot', 'cbrt', 'random',
    ] as const;

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('a fresh import under the stubs plays a bot run to victory and gives the same paths by Object.is', async () => {
      // The reference paths of the normal import, before the stubs. The export check comes after
      // the stubbed run, so the Red run also proves that a fresh import under the stubs works.
      const A = core as unknown as Partial<AimCore>;
      const reference =
        typeof A.pathOf === 'function' && typeof A.layoutOf === 'function'
          ? LAYOUT_LANES.map((lanes) => {
              const layout = A.layoutOf!(lanes);
              return FIXED_PAIRS.map(({ angle, power }) => numbersOf(A.pathOf!(layout, angle, power)));
            })
          : [];

      for (const name of STUBBED) {
        vi.spyOn(Math, name).mockImplementation(() => {
          throw new Error(`Math.${name} called`);
        });
      }
      let error: unknown = null;
      let phase = '';
      let fresh: Record<string, unknown> = {};
      let paths: number[][][] = [];
      try {
        vi.resetModules();
        fresh = (await import('../../../src/games/archers-revenge/core/index.js')) as unknown as Record<string, unknown>;
        const bot = await import('../../../src/games/archers-revenge/qc/bot.js');
        const make = fresh.createArchersRevenge as typeof createArchersRevenge;
        const sim = make(SHORT_STORY, { seed: 3, helper: false });
        sim.dispatch({ type: 'start' });
        for (let i = 0; i < 400 && sim.state.phase === 'playing'; i++) {
          const c = bot.nextCommand(sim.state);
          if (!c) break;
          sim.dispatch(c);
        }
        phase = sim.state.phase;
        const F = fresh as unknown as AimCore;
        if (typeof F.pathOf === 'function' && typeof F.layoutOf === 'function') {
          paths = LAYOUT_LANES.map((lanes) => {
            const layout = F.layoutOf(lanes);
            return FIXED_PAIRS.map(({ angle, power }) => numbersOf(F.pathOf(layout, angle, power)));
          });
        }
      } catch (e) {
        error = e;
      } finally {
        vi.restoreAllMocks();
      }
      expect(error).toBeNull();
      expect(phase).toBe('victory');
      needAim('layoutOf', 'pathOf', 'SIN_DEG');
      expect(fresh.pathOf, 'fresh core export pathOf').toBeDefined();
      expect(fresh.SIN_DEG, 'fresh core export SIN_DEG').toBeDefined();
      expect(paths).toHaveLength(LAYOUT_LANES.length);
      expect(reference).toHaveLength(LAYOUT_LANES.length);
      paths.forEach((perLayout, l) =>
        perLayout.forEach((nums, p) => expect(sameNumbers(nums, reference[l]![p]!), `layout ${LAYOUT_LANES[l]} pair ${p}`).toBe(true)),
      );
    });
  });
});

// ---------------------------------------------------------------- the hit test (R7, R12)

describe('the hit test', () => {
  it.each(LAYOUT_LANES)('R7: %i lanes: the layout is sane and the bow origin is outside every box', (lanes) => {
    const A = needAim('layoutOf');
    const { origin } = needTuning().arc;
    const layout = A.layoutOf(lanes);
    expect(layout.lanes).toBe(lanes);
    expect(layout.targets).toHaveLength(lanes);
    expect(layout.towers.length).toBeGreaterThan(0);
    expect(layout.width).toBeGreaterThan(origin.x);
    expect(origin.y).toBeGreaterThan(layout.groundY);
    for (const box of boxesOf(layout)) {
      expect(box.x1).toBeGreaterThan(box.x0);
      expect(box.y1).toBeGreaterThan(box.y0);
      expect(inside(origin, box)).toBe(false);
    }
  });

  it.each(LAYOUT_LANES)(
    'R7: %i lanes: on the full grid the core contact is the first contact of a segment oracle',
    (lanes) => {
      const A = needAim('layoutOf', 'shotOf', 'SIN_DEG');
      const { maxSteps } = needTuning().arc;
      const layout = A.layoutOf(lanes);
      const failures: string[] = [];
      const kinds = new Map<ContactKind, number>();
      let checked = 0;
      for (const angle of ANGLES) {
        for (const power of POWERS) {
          const at = `angle ${angle} power ${power}`;
          const { points, contact } = A.shotOf(layout, [], angle, power);
          checked += 1;
          kinds.set(contact.kind, (kinds.get(contact.kind) ?? 0) + 1);
          const n = points.length;
          if (n < 2) {
            failures.push(`${at}: ${n} points`);
            continue;
          }
          if (n - 1 > maxSteps) failures.push(`${at}: ${n - 1} steps, above maxSteps ${maxSteps}`);
          for (let k = 0; k + 2 < n; k++) {
            const early = oracleHits(layout, [], points[k]!, points[k + 1]!);
            if (early.length > 0) {
              failures.push(`${at}: segment ${k} already touches ${early.map((h) => h.kind).join(',')}`);
              break;
            }
          }
          const next = closedPoint(A, angle, power, n - 1);
          const hits = oracleHits(layout, [], points[n - 2]!, next);
          if (hits.length === 0) {
            failures.push(`${at}: the oracle finds no contact on the last segment`);
            continue;
          }
          const first = Math.min(...hits.map((h) => h.s));
          const firsts = hits.filter((h) => h.s <= first + 1e-9);
          const sameBox = firsts.some(
            (h) => h.kind === contact.kind && (contact.kind === 'ground' || contact.kind === 'edge' || h.index === contact.index),
          );
          if (!sameBox) failures.push(`${at}: core ${contact.kind}#${contact.index}, oracle ${firsts.map((h) => `${h.kind}#${h.index}`).join(',')}`);
          const a = points[n - 2]!;
          const want = { x: a.x + first * (next.x - a.x), y: a.y + first * (next.y - a.y) };
          if (Math.abs(contact.x - want.x) > 1e-6 || Math.abs(contact.y - want.y) > 1e-6) failures.push(`${at}: contact point off the oracle point`);
          const last = points[n - 1]!;
          if (!Object.is(last.x, contact.x) || !Object.is(last.y, contact.y)) failures.push(`${at}: the last point is not the contact point`);
        }
      }
      expect(checked).toBe(GRID_SIZE);
      expect(failures.slice(0, 10)).toEqual([]);
      expect(kinds.get('shut') ?? 0).toBe(0);
      for (const kind of ['target', 'tower', 'ground', 'edge'] as const) expect(kinds.get(kind) ?? 0, `grid pairs with contact ${kind}`).toBeGreaterThan(0);
    },
    120_000,
  );

  it.each(LAYOUT_LANES)('R12: %i lanes: every lane has a hitting pair, also with the other lanes shut', (lanes) => {
    const A = needAim('layoutOf', 'shotOf');
    const layout = A.layoutOf(lanes);
    expect(layout.targets).toHaveLength(lanes);
    for (let lane = 0; lane < lanes; lane++) {
      const others = Array.from({ length: lanes }, (_, i) => i).filter((i) => i !== lane);
      let open = 0;
      let alone = 0;
      for (const angle of ANGLES) {
        for (const power of POWERS) {
          const c = A.shotOf(layout, [], angle, power).contact;
          if (c.kind === 'target' && c.index === lane) open += 1;
          const d = A.shotOf(layout, others, angle, power).contact;
          if (d.kind === 'target' && d.index === lane) alone += 1;
        }
      }
      expect(open, `lane ${lane} open`).toBeGreaterThan(0);
      expect(alone, `lane ${lane} with the other lanes shut`).toBeGreaterThan(0);
    }
  }, 120_000);
});

// ---------------------------------------------------------------- the run (R8 to R11, existing rows)

describe('the run', () => {
  it('start shows the first formation and the first prompt, once', () => {
    const sim = create(5);
    expect(types(fire(sim, 45, 50))).toEqual(['rejected']);
    const events = sim.dispatch({ type: 'start' });
    expect(types(events)).toEqual(['waveAppeared', 'roundShown']);
    expect(ofType(events, 'waveAppeared')[0]).toMatchObject({ wave: 1, waveCount: sim.state.waveCount });
    expect(ofType(events, 'waveAppeared')[0]!.enemies).toHaveLength(TUNING.lanes);
    expect(types(sim.dispatch({ type: 'start' }))).toEqual(['rejected']);
  });

  it('R11: Helper mode has 2 lanes and the 2-lane layout', () => {
    const A = needAim('layoutOf');
    const sim = create(5, true);
    expect(sim.state.enemies).toHaveLength(TUNING.helperLanes);
    expect(sim.state.round!.lanes).toHaveLength(TUNING.helperLanes);
    expect(layoutOfState(sim)).toEqual(A.layoutOf(TUNING.helperLanes));
    expect(layoutOfState(create(5))).toEqual(A.layoutOf(TUNING.lanes));
  });

  it('R10: a right arrow scores coins that grow with the streak and shows the next prompt', () => {
    const sim = create(5);
    sim.dispatch({ type: 'start' });
    const first = sim.state.round!.wordId;
    const lane = rightLane(sim);
    const pair = pairFor(sim, lane);
    const a = fire(sim, pair.angle, pair.power);
    expect(types(a).slice(0, 2)).toEqual(['shot', 'scored']);
    expect(ofType(a, 'shot')[0]).toMatchObject({ correct: true, streak: 1, lane, angle: pair.angle, power: pair.power });
    expect(ofType(a, 'scored')[0]!.coins).toBe(TUNING.coins);
    expect(types(a).at(-1)).toBe('roundShown');
    expect(sim.state.targets.find((t) => t.id === first)).toMatchObject({ solved: true, attempts: 1, correctFirstTry: true });
    expect(sim.state.round!.wordId).not.toBe(first);
    expect(ofType(shootRight(sim), 'scored')[0]!.coins).toBe(TUNING.coins + TUNING.streakCoins);
    for (let i = 0; i < 4 && sim.state.phase === 'playing'; i++) shootRight(sim);
    expect(sim.state.bestStreak).toBeGreaterThan(2);
  });

  it('R10: a wrong arrow bounces off, the enemy strikes, the lane shuts, and the same prompt stays', () => {
    const sim = create(5);
    sim.dispatch({ type: 'start' });
    const word = sim.state.round!.wordId;
    const lane = wrongLane(sim);
    const pair = pairFor(sim, lane);
    const events = fire(sim, pair.angle, pair.power);
    expect(types(events)).toEqual(['shot', 'enemyStrike', 'roundShown']);
    expect(ofType(events, 'shot')[0]).toMatchObject({ correct: false, lane, angle: pair.angle, power: pair.power, streak: 0 });
    expect(sim.state.courage).toBe(TUNING.maxCourage - 1);
    expect(sim.state.round!.wordId).toBe(word);
    expect(sim.state.round!.lanes.find((l) => l.lane === lane)!.blocked).toBe(true);
    expect(sim.state.targets.find((t) => t.id === word)).toMatchObject({ attempts: 1, correctFirstTry: false, solved: false });
    expect(sim.state.streak).toBe(0);
    shootRight(sim);
    expect(sim.state.targets.find((t) => t.id === word)).toMatchObject({ attempts: 2, correctFirstTry: false, solved: true });
  });

  it.each(['ground', 'tower', 'edge'] as const)('R8 (assumption Q3: a miss is no attempt): a %s miss changes only shots', (kind) => {
    const sim = create(5);
    sim.dispatch({ type: 'start' });
    shootRight(sim);
    const before = sim.snapshot();
    const pair = missPair(sim, kind);
    const events = fire(sim, pair.angle, pair.power);
    expect(types(events)).toEqual(['missed']);
    expect(ofType(events, 'missed')[0]).toMatchObject({ angle: pair.angle, power: pair.power, kind });
    const after = sim.snapshot();
    expect(after.shots).toBe(before.shots + 1);
    expect({ ...after, shots: before.shots }).toEqual(before);
  });

  it('R8 (assumption Q3): a miss keeps the streak: two right hits, one miss, then a right hit scores the third streak step', () => {
    const sim = create(5);
    sim.dispatch({ type: 'start' });
    shootRight(sim);
    shootRight(sim);
    expect(sim.state.streak).toBe(2);
    const missed = shootMiss(sim, 'ground');
    expect(types(missed)).toEqual(['missed']);
    expect(sim.state.streak).toBe(2);
    const scored = ofType(shootRight(sim), 'scored')[0]!;
    expect(scored.coins).toBe(TUNING.coins + 2 * TUNING.streakCoins);
    expect(sim.state.streak).toBe(3);
  });

  it('R9 (assumption Q1: a shut target is a miss): the arrow stops at the shut box, no attempt and no courage loss', () => {
    const A = needAim('shotOf');
    const sim = create(5);
    sim.dispatch({ type: 'start' });
    const lane = wrongLane(sim);
    const pair = pairFor(sim, lane);
    fire(sim, pair.angle, pair.power);
    expect(sim.state.round!.lanes.find((l) => l.lane === lane)!.blocked).toBe(true);
    const layout = layoutOfState(sim);
    const open = A.shotOf(layout, [], pair.angle, pair.power);
    const shut = A.shotOf(layout, [lane], pair.angle, pair.power);
    expect(shut.contact).toMatchObject({ kind: 'shut', index: lane });
    expect(sameNumbers(numbersOf(shut.points), numbersOf(open.points))).toBe(true);
    const before = sim.snapshot();
    const events = fire(sim, pair.angle, pair.power);
    expect(types(events)).toEqual(['missed']);
    const missed = ofType(events, 'missed')[0]!;
    expect(missed).toMatchObject({ angle: pair.angle, power: pair.power, kind: 'shut' });
    expect([missed.x, missed.y]).toEqual([open.contact.x, open.contact.y]);
    const after = sim.snapshot();
    expect(after.shots).toBe(before.shots + 1);
    expect({ ...after, shots: before.shots }).toEqual(before);
  });

  it.each(LAYOUT_LANES)('R11 (assumption Q2: the full arc to the first contact): %i lanes: pathOf equals the shot points', (lanes) => {
    const A = needAim('layoutOf', 'shotOf', 'pathOf');
    const layout = A.layoutOf(lanes);
    for (const { angle, power } of FIXED_PAIRS) {
      const shot = A.shotOf(layout, [], angle, power);
      const path = A.pathOf(layout, angle, power);
      expect(sameNumbers(numbersOf(path), numbersOf(shot.points)), `angle ${angle} power ${power}`).toBe(true);
      expect(path.at(-1)).toEqual({ x: shot.contact.x, y: shot.contact.y });
    }
  });

  it('R11: pathOf and shotOf leave the simulation state equal', () => {
    const A = needAim('shotOf', 'pathOf');
    const sim = create(5, true);
    sim.dispatch({ type: 'start' });
    const before = sim.snapshot();
    const layout = layoutOfState(sim);
    for (const { angle, power } of FIXED_PAIRS) {
      A.pathOf(layout, angle, power);
      A.shotOf(layout, [0], angle, power);
    }
    expect(sim.snapshot()).toEqual(before);
  });

  it('R10: the right lane never shuts, so every prompt can be solved', () => {
    const sim = create(5);
    sim.dispatch({ type: 'start' });
    while (sim.state.round!.lanes.some((l) => l.wordId !== sim.state.round!.wordId && !l.blocked) && sim.state.courage > 0) shootWrong(sim);
    const round = sim.state.round!;
    expect(round.lanes.find((l) => l.wordId === round.wordId)!.blocked).toBe(false);
    expect(types(shootRight(sim))).toContain('scored');
  });

  it('R10: courage at 0 means a rest back to 3, never a game over', () => {
    const sim = create(5);
    sim.dispatch({ type: 'start' });
    let rested = false;
    for (let i = 0; i < 60 && sim.state.phase === 'playing'; i++) {
      const round = sim.state.round!;
      if (round.lanes.every((l) => l.wordId === round.wordId || l.blocked)) {
        shootRight(sim);
        continue;
      }
      const events = shootWrong(sim);
      if (ofType(events, 'rest').length) {
        rested = true;
        expect(types(events)).toEqual(['shot', 'enemyStrike', 'rest', 'roundShown']);
        expect(ofType(events, 'rest')[0]!.courage).toBe(TUNING.restCourage);
        expect(sim.state.courage).toBe(TUNING.restCourage);
        expect(sim.state.phase).toBe('playing');
      }
    }
    expect(rested).toBe(true);
    expect(sim.state.courage).toBeGreaterThan(0);
  });

  it('R10: the formation falls when the words of the wave are done, and the next wave marches in', () => {
    const sim = create(6);
    sim.dispatch({ type: 'start' });
    const size = sim.state.waveSize;
    expect(sim.state.waveCount).toBeGreaterThan(1);
    const firstIds = sim.state.enemies.map((e) => e.id);
    let last: ReturnType<typeof shootRight> = [];
    for (let i = 0; i < size; i++) last = shootRight(sim);
    expect(types(last)).toEqual(['shot', 'scored', 'waveCleared', 'waveAppeared', 'roundShown']);
    expect(ofType(last, 'waveCleared')[0]!.enemies.map((e) => e.id)).toEqual(firstIds);
    expect(sim.state.wave).toBe(2);
    expect(sim.state.waveDone).toBe(0);
    expect(sim.state.enemies.map((e) => e.id)).not.toEqual(firstIds);
  });

  it.each(SEEDS)('seed %i: every word is hit exactly once to win, with mistakes and misses', (seed) => {
    const sim = create(seed, seed % 2 === 0, SHORT_STORY);
    sim.dispatch({ type: 'start' });
    let guard = 0;
    while (sim.state.phase === 'playing' && guard++ < 300) {
      const round = sim.state.round!;
      if (seed % 3 === 0 && round.lanes.some((l) => l.wordId !== round.wordId && !l.blocked)) shootWrong(sim);
      if (seed % 5 === 0) shootMiss(sim, 'ground');
      shootRight(sim);
    }
    expect(sim.state.phase).toBe('victory');
    expect(sim.state.round).toBeNull();
    expect(sim.state.targets.every((t) => t.solved)).toBe(true);
    expect(sim.state.courage).toBeGreaterThan(0);
  });

  it('commands after the victory do nothing', () => {
    const sim = create(2, false, SHORT_STORY);
    playToEnd(sim);
    expect(fire(sim, 45, 50)).toEqual([]);
    expect(sim.dispatch({ type: 'start' })).toEqual([]);
  });

  it('D10: only declared event types appear, and missed is declared', () => {
    expect(ARCHERS_REVENGE_EVENT_TYPES).toContain('missed');
    const events = playToEnd(create(4));
    expect(events.every((e) => (ARCHERS_REVENGE_EVENT_TYPES as readonly string[]).includes(e.type))).toBe(true);
  });

  it('an empty input is a won run', () => {
    const sim = createArchersRevenge([], { seed: 1, helper: false });
    expect(sim.state.phase).toBe('victory');
    expect(sim.dispatch({ type: 'start' })).toEqual([]);
  });
});

// ---------------------------------------------------------------- evidence (R16)

describe('evidence', () => {
  it('R16: one item per word; attempts count only word-target hits; misses and shut hits add nothing', () => {
    const sim = create(8, false, SHORT_STORY);
    sim.dispatch({ type: 'start' });
    // Word 1: a ground miss, then the right target.
    const first = sim.state.round!.wordId;
    shootMiss(sim, 'ground');
    shootRight(sim);
    // Word 2: a wrong target, a shut miss on that lane, a tower miss, then the right target.
    const second = sim.state.round!.wordId;
    const lane = wrongLane(sim);
    shootWrong(sim);
    shootMiss(sim, 'shut', lane);
    shootMiss(sim, 'tower');
    shootRight(sim);
    while (sim.state.phase === 'playing') shootRight(sim);
    expect(sim.state.shots).toBe(SHORT_STORY.vocabulary.length + 4);
    const evidence = evidenceOf(sim.state, SHORT_STORY, 8, 12_345);
    expect(storyGameEvidenceSchema.parse(evidence)).toEqual(evidence);
    expect(evidence.items).toHaveLength(SHORT_STORY.vocabulary.length);
    expect(evidence.items.find((i) => i.itemId === first)).toMatchObject({ attempts: 1, correctFirstTry: true, solved: true });
    expect(evidence.items.find((i) => i.itemId === second)).toMatchObject({ attempts: 2, correctFirstTry: false, solved: true });
    expect(evidence.items.filter((i) => i.correctFirstTry)).toHaveLength(SHORT_STORY.vocabulary.length - 1);
    expect(evidence.items.reduce((n, i) => n + i.attempts, 0)).toBe(SHORT_STORY.vocabulary.length + 1);
    const { results, outcome } = resultsOf(sim.state, SHORT_STORY, 8, 12_345);
    expect(results.score).toBe(sim.state.coins);
    expect(results.correctAnswers).toBe(SHORT_STORY.vocabulary.length);
    expect(outcome).toBe('victory');
  });
});

// ---------------------------------------------------------------- the core boundary (R17)

describe('the core boundary', () => {
  it('R17 (artifact, guard): core files import only contracts, sim, and other core files', () => {
    const files = filesIn(CORE_DIR);
    expect(files.length).toBeGreaterThan(0);
    const specifier = /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)['"]([^'"]+)['"]/g;
    const allowed = (s: string): boolean =>
      (s.startsWith('./') && !s.slice(2).includes('..')) || s.startsWith('../../../apk3d/contracts/') || s.startsWith('../../../apk3d/sim/');
    const all: string[] = [];
    const bad: string[] = [];
    for (const file of files) {
      for (const m of readFileSync(file, 'utf8').matchAll(specifier)) {
        all.push(m[1]!);
        if (!allowed(m[1]!)) bad.push(`${file.slice(process.cwd().length + 1)}: ${m[1]}`);
      }
    }
    expect(all.length).toBeGreaterThan(0);
    expect(bad).toEqual([]);
    expect(Object.keys(core).length).toBeGreaterThan(0);
  });
});
