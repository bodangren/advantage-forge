import { describe, expect, it } from 'vitest';
import { blinkAt, buildTimeline, cameraAt, cameraWorld, clipFor, mixAt, mouthAt, placeAt, RUG, shotAt, TARGET_Y, WALK_SPEED, type Spec, type Stage } from '../src/song/timeline.js';

const spec: Spec = {
  duration: 30,
  lines: [
    {
      text: 'Hello, I am Pip',
      gesture: 'point to self',
      start: 10,
      end: 13,
      actors: ['Pip'],
      segments: [{ start: 10, end: 13, words: [{ text: 'Hello,', start: 10, end: 10.4 }, { text: 'I', start: 10.6, end: 10.7 }, { text: 'am', start: 10.7, end: 10.9 }, { text: 'Pip', start: 11, end: 12 }] }],
    },
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

  it('takes the sun and the quiet dog from the stage', () => {
    expect(tl.sun).toBe('high');
    const quiet = buildTimeline(spec, { ...stage, sun: 'side', dog: 'quiet' });
    expect(quiet.sun).toBe('side');
    expect(quiet.actors[0]!.cues[1]).toEqual({ t: 10, clip: 'idle' });
    expect(clipFor('sprout-pip', 'nod', 'quiet').clip).toBe('sit');
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

describe('sets and cuts', () => {
  const scenes: Spec = {
    duration: 40,
    lines: [
      { text: 'sun', start: 2, end: 6, scene: 'sky', actors: ['Nan'] },
      { text: 'kites', start: 8, end: 12, scene: 'sky', actors: ['Nan'] },
      { text: 'count', start: 14, end: 18, scene: 'classroom', actors: ['Pat'] },
      { text: 'apples', start: 20, end: 24, scene: 'park', actors: ['Pip'] },
    ],
  };

  it('is one shot on the top-level stage without sets', () => {
    const tl = buildTimeline(scenes, stage);
    expect(tl.shots.map((s) => [s.set, s.from, s.to, s.map, s.light])).toEqual([['sky', 0, 40, 'classroom', 'interior']]);
    expect(tl.maps).toEqual(['classroom']);
    expect(tl.warnings).toEqual([]);
    expect(tl.camera).toEqual(stage.camera);
  });

  const sets: Stage = {
    ...stage,
    sets: {
      sky: { map: 'meadow', camera: [{ at: 0, az: 0, el: -25, dist: 3, tx: 0, tz: 0, ty: 2.2 }] },
      park: { map: 'meadow', sun: 'side', marks: { Pip: { x: 0.3, z: 0.2, yaw: 30 } }, props: [{ asset: 'apple-tree', x: -1.8, z: -1.6 }, { asset: 'pigeon', x: 0.5, z: 0, count: 3, spacing: 0.3, from: 10, to: 23 }, { asset: 'apple', held: 'Pip', from: 21 }], pictures: [{ file: 'pictures/sun.png', x: 1, y: 3, z: -3, w: 0.9, to: 50 }] },
    },
  };

  it('cuts at every line whose scene changes and starts at 0', () => {
    const tl = buildTimeline(scenes, sets);
    expect(tl.shots.map((s) => [s.set, s.from, s.to, s.map, s.light])).toEqual([
      ['sky', 0, 14, 'meadow', 'outdoor'],
      ['classroom', 14, 20, 'classroom', 'interior'],
      ['park', 20, 40, 'meadow', 'outdoor'],
    ]);
    expect(tl.maps).toEqual(['meadow', 'classroom']);
    expect(tl.shots[0]!.camera[0]!.ty).toBe(2.2);
    expect(tl.shots[1]!.camera).toEqual(stage.camera);
    expect(tl.shots[2]!.sun).toBe('side');
    expect(tl.warnings.some((w) => w.includes('no set "classroom"'))).toBe(true);
    expect(shotAt(tl, 13.99).set).toBe('sky');
    expect(shotAt(tl, 14).set).toBe('classroom');
  });

  it('takes explicit cuts over the spec scenes', () => {
    const tl = buildTimeline(scenes, { ...sets, cuts: [{ at: 5, set: 'park' }] });
    expect(tl.shots.map((s) => [s.set, s.from, s.to])).toEqual([
      ['park', 0, 40],
    ]);
  });

  it('jumps an actor to the set mark at a cut, with no walk or turn', () => {
    const tl = buildTimeline(scenes, sets);
    const pip = tl.actors.find((a) => a.id === 'Pip')!;
    expect(pip.path).toEqual([
      { t: 0, x: -0.55, z: 0.45, yaw: 0 },
      { t: 14, x: -0.55, z: 0.45, yaw: 0, jump: true },
      { t: 20, x: 0.3, z: 0.2, yaw: 30, jump: true },
    ]);
    expect(placeAt(pip.path, 19.9)).toEqual({ x: -0.55, z: 0.45, yaw: 0 });
    expect(placeAt(pip.path, 20)).toEqual({ x: 0.3, z: 0.2, yaw: 30 });
    expect(placeAt(pip.path, 20.05).yaw).toBe(30);
  });

  it('applies a move inside its shot and ends at the shot mark yaw', () => {
    const tl = buildTimeline(scenes, { ...sets, moves: [{ actor: 'Pip', at: 22, to: { x: 0.3, z: -0.25 } }] });
    const pip = tl.actors.find((a) => a.id === 'Pip')!;
    expect(pip.path.map((k) => k.t)).toEqual([0, 14, 20, 22, 23]);
    expect(pip.path[4]).toMatchObject({ x: 0.3, z: -0.25, yaw: 30 });
    expect(pip.cues.filter((c) => c.clip === 'walk')).toEqual([{ t: 22, clip: 'walk' }]);
  });

  it('expands props by count, clamps them to the shot, and binds a held prop', () => {
    const tl = buildTimeline(scenes, sets);
    const park = tl.shots[2]!;
    expect(park.props.map((p) => [p.asset, p.x, p.from, p.to])).toEqual([
      ['apple-tree', -1.8, 20, 40],
      ['pigeon', 0.5, 20, 23],
      ['pigeon', 0.8, 20, 23],
      ['pigeon', 1.1, 20, 23],
      ['apple', 0, 21, 40],
    ]);
    expect(park.props[4]!.held).toEqual({ actor: 'Pip', hand: 'R', offset: [0, 0, 0], rotate: [0, 0, 0] });
    expect(park.pictures).toEqual([{ file: 'pictures/sun.png', x: 1, y: 3, z: -3, w: 0.9, yaw: 0, from: 20, to: 40, card: false, unlit: false }]);
    expect(tl.shots[0]!.props).toEqual([]);
  });
});

describe('singing', () => {
  const tl = buildTimeline(spec, stage);

  it('takes the word times of a line, or the line span without them', () => {
    expect(tl.actors[0]!.sings).toEqual([
      { start: 10, end: 10.4 },
      { start: 10.6, end: 10.7 },
      { start: 10.7, end: 10.9 },
      { start: 11, end: 12 },
    ]);
    expect(tl.actors[1]!.sings[0]).toEqual({ start: 13.1, end: 16 });
  });

  it('opens the mouth on a word and closes it between words', () => {
    const sings = tl.actors[0]!.sings;
    expect(mouthAt(sings, 5)).toBe(0);
    expect(mouthAt(sings, 10.2)).toBeGreaterThan(0.9);
    expect(mouthAt(sings, 10.52)).toBe(0);
    expect(mouthAt(sings, 11.5)).toBeGreaterThan(0.6);
    expect(mouthAt(sings, 12.3)).toBe(0);
  });

  it('blinks for 0.14 s and keeps the eyes open otherwise', () => {
    const shut = Array.from({ length: 400 }, (_, i) => blinkAt(1, i / 100)).filter((v) => v > 0).length;
    expect(shut).toBeGreaterThan(8);
    expect(shut).toBeLessThan(40);
    const peak = Math.max(...Array.from({ length: 400 }, (_, i) => blinkAt(1, i / 100)));
    expect(peak).toBeGreaterThan(0.95);
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
