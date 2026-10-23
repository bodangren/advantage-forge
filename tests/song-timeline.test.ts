import { describe, expect, it } from 'vitest';
import { buildTimeline, cameraAt, cameraWorld, clipFor, mixAt, placeAt, RUG, TARGET_Y, WALK_SPEED, type Spec, type Stage } from '../src/song/timeline.js';

const spec: Spec = {
  duration: 30,
  lines: [
    { text: 'Hello, I am Pip', gesture: 'point to self', start: 10, end: 13, actors: ['Pip'] },
    { text: 'Hello, I am Nan', gesture: 'point to self', start: 13.1, end: 16, actors: ['Nan'] },
    { text: 'Wave, wave', gesture: 'wave', start: 16, end: 19, actors: ['Nan'] },
    { text: 'Hello class', gesture: 'spin', start: 20, end: 24, actors: ['Pat', 'Nan'] },
  ],
};
const stage: Stage = {
  marks: { Pip: { x: -0.55, z: 0.45 }, Nan: { x: 0.55, z: 0.45, yaw: 0 } },
  camera: [
    { at: 0, az: 0, el: 12, dist: 4.8, tx: 0, tz: 0 },
    { at: 10, az: 0, el: 12, dist: 4.8, tx: 0, tz: 0 },
    { at: 12, az: 20, el: 8, dist: 2.6, tx: -0.55, tz: 0.45 },
  ],
};

describe('buildTimeline', () => {
  const tl = buildTimeline(spec, stage);

  it('lists the marked actors first, then the singers in order of appearance', () => {
    expect(tl.actors.map((a) => a.id)).toEqual(['Pip', 'Nan', 'Pat']);
    expect(tl.actors[0]!.asset).toBe('sprout-pip');
  });

  it('puts an unmarked actor in a row on the rug centre line', () => {
    expect(tl.actors[2]!.path[0]).toEqual({ t: 0, x: 0, z: 0, yaw: 0 });
  });

  it('plays the gesture clip during a line and idle after it', () => {
    const nan = tl.actors[1]!;
    expect(nan.cues).toEqual([
      { t: 0, clip: 'idle' },
      { t: 13.1, clip: 'gesture-point-to-self' },
      { t: 16, clip: 'gesture-wave' },
      { t: 19, clip: 'idle' },
      { t: 20, clip: 'gesture-idle' },
      { t: 24, clip: 'idle' },
    ]);
  });

  it('gives the dog his own clips and warns on an unknown gesture', () => {
    expect(tl.actors[0]!.cues[1]).toEqual({ t: 10, clip: 'howl' });
    expect(clipFor('sprout-pip', 'nod').clip).toBe('sit');
    expect(tl.warnings.some((w) => w.includes('spin'))).toBe(true);
  });

  it('refuses an actor without an asset', () => {
    expect(() => buildTimeline({ duration: 1, lines: [{ text: 'x', start: 0, end: 1, actors: ['Lily'] }] }, {})).toThrow(/Lily/);
  });

  it('walks a move at the walk speed and resumes the line clip after it', () => {
    const moved = buildTimeline(spec, { ...stage, moves: [{ actor: 'Nan', at: 5, to: { x: 0.55, z: -0.45 } }] });
    const nan = moved.actors[1]!;
    const dur = 0.9 / WALK_SPEED;
    expect(nan.path.map((k) => k.t)).toEqual([0, 5, 5 + dur]);
    expect(nan.cues.slice(0, 3)).toEqual([
      { t: 0, clip: 'idle' },
      { t: 5, clip: 'walk' },
      { t: 5 + dur, clip: 'idle' },
    ]);
    const mid = placeAt(nan.path, 5 + dur / 2);
    expect(mid.x).toBeCloseTo(0.55);
    expect(mid.z).toBeCloseTo(0);
    expect(((mid.yaw % 360) + 360) % 360).toBeCloseTo(180);
  });
});

describe('cameraAt', () => {
  it('holds a key, then eases to the next one', () => {
    expect(cameraAt(stage.camera!, 5).dist).toBe(4.8);
    const mid = cameraAt(stage.camera!, 11);
    expect(mid.dist).toBeCloseTo(3.7);
    expect(mid.az).toBeCloseTo(10);
    expect(mid.ty).toBe(TARGET_Y);
    expect(cameraAt(stage.camera!, 20)).toMatchObject({ az: 20, dist: 2.6, tx: -0.55 });
  });

  it('places the eye in world space in front of the rug', () => {
    const { eye, target } = cameraWorld(cameraAt(stage.camera!, 0));
    expect(target).toEqual([RUG[0], TARGET_Y, RUG[2]]);
    expect(eye[2]).toBeCloseTo(RUG[2] + 4.8 * Math.cos((12 * Math.PI) / 180));
    expect(eye[1]).toBeGreaterThan(target[1]);
  });
});

describe('mixAt', () => {
  const cues = [
    { t: 0, clip: 'idle' },
    { t: 10, clip: 'gesture-wave' },
  ];
  it('blends from the previous clip over the blend time', () => {
    expect(mixAt(cues, 5)).toMatchObject({ clip: 'idle', w: 1 });
    const mid = mixAt(cues, 10.11);
    expect(mid.clip).toBe('gesture-wave');
    expect(mid.w).toBeCloseTo(0.5);
    expect(mid.prev?.clip).toBe('idle');
    expect(mixAt(cues, 11).prev).toBeUndefined();
  });
});
