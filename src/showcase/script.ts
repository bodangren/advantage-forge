/**
 * The Chibi Quest showcase tour: a 3 minute 20 second walkthrough of the world for a YouTube
 * preview aimed at grade 3 to 6 students. One source for the picture (main.ts), the soundtrack
 * (scripts/showcase-audio.ts), the captions file, and the voice-over script.
 *
 * Coordinates are set-local meters (see scenes/*.ts): +X east, +Z south, yaw 0 faces south.
 * The hamlet well is the hamlet origin; the forest and vault maps are centered on their origins.
 */
import type { Actor, Caption, ClipCue, Fade, MusicCue, Narration, SetName, Shot, Sfx, Tour, V3 } from './types.js';

// ---------------------------------------------------------------- helpers
const loop = (t: number, clip: string, speed = 1, offset = 0): ClipCue => ({ t, clip, loop: true, speed, offset });
const once = (t: number, clip: string, speed = 1): ClipCue => ({ t, clip, speed });
/** Hold the first frame of a one-shot clip (a closed mimic, a bone heap before it rises). */
const hold = (t: number, clip: string): ClipCue => ({ t, clip, speed: 0 });

/** Yaw (degrees) that faces from a point toward another. */
function face(from: V3, to: V3): number {
  return (Math.atan2(to[0] - from[0], to[2] - from[2]) * 180) / Math.PI;
}

/**
 * A look point that puts `subject` about `shift` meters left of the frame center, seen from `cam`
 * (quest cards cover the right third of the screen).
 */
function leftOf(cam: V3, subject: V3, shift: number): V3 {
  const fx = subject[0] - cam[0];
  const fz = subject[2] - cam[2];
  const len = Math.hypot(fx, fz) || 1;
  // The screen's right direction on the ground: forward x up.
  const rx = -fz / len;
  const rz = fx / len;
  return [subject[0] + rx * shift, subject[1], subject[2] + rz * shift];
}

function still(id: string, asset: string, set: SetName, show: readonly [number, number], at: V3, yaw: number, clips: ClipCue[], extra: Partial<Actor> = {}): Actor {
  return { id, asset, set, show, path: [{ t: show[0], at, yaw }], clips, ...extra };
}

const actors: Actor[] = [];
const captions: Caption[] = [];
const shots: Shot[] = [];
const sfx: Sfx[] = [];
const narration: Narration[] = [];
const music: MusicCue[] = [];
const fades: Fade[] = [];

const say = (start: number, end: number, text: string): void => void narration.push({ start, end, text });
const fx = (t: number, kind: Sfx['kind'], gain?: number): void => void sfx.push({ t, kind, ...(gain !== undefined ? { gain } : {}) });

/** A quest card with its countdown ticks and the answer chime. */
function quest(start: number, end: number, answerAt: number, text: string, sub: string, answer: string): void {
  captions.push({ start, end, kind: 'quest', text, sub, answerAt, answer });
  fx(start + 0.05, 'pop');
  for (let k = 3; k >= 1; k--) fx(answerAt - k, 'tick');
  fx(answerAt, 'correct');
}

// ================================================================ ACT 0: the hook (vault)
// A treasure chest by the altar, in candlelight. It is a mimic.
const MIMIC: V3 = [-1.7, 0.09, -5.6];
shots.push(
  {
    start: 0,
    end: 5.3,
    set: 'vault',
    mood: 'vault',
    keys: [
      { t: 0, pos: [0.6, 1.8, -2.7], look: [-1.6, 0.45, -5.6], fov: 40 },
      { t: 5.3, pos: [-1.2, 1.0, -3.5], look: [-1.7, 0.4, -5.6], fov: 38 },
    ],
  },
  {
    start: 5.3,
    end: 9.2,
    set: 'vault',
    mood: 'vault',
    keys: [
      { t: 5.3, pos: [-1.5, 0.75, -3.6], look: [-1.7, 0.5, -5.6], fov: 44 },
      { t: 9.2, pos: [-1.35, 0.8, -3.3], look: [-1.7, 0.55, -5.6], fov: 48 },
    ],
    shake: [[5.3, 0], [5.45, 0.06], [6.4, 0.02], [7, 0]],
  },
);
actors.push(still('mimic-hook', 'mimic', 'vault', [0, 9.3], MIMIC, 0, [hold(0, 'reveal'), once(5.3, 'reveal'), loop(8.0, 'idle')]));
captions.push(
  { start: 1.2, end: 4.9, kind: 'banner', text: 'Ooh... a treasure chest!', sub: 'Should we open it?', color: '#b07a2a' },
  { start: 5.6, end: 8.7, kind: 'title', text: "IT'S A MIMIC!", top: 17 },
);
fx(5.3, 'boom');
fx(5.45, 'chomp');
fx(6.6, 'chomp', 0.7);
fades.push({ t: 9.2, half: 0.45, color: '#ffffff' });
say(0.4, 2.9, 'Deep in a dark, spooky vault... something is waiting.');
say(3.0, 5.2, 'Ooh... a treasure chest!');
say(5.5, 8.9, "WHOA! It's a mimic! A treasure chest that bites!");
music.push({ start: 0, end: 5.3, mood: 'mystery' });

// ================================================================ ACT 1: the title (hamlet)
shots.push({
  start: 9.2,
  end: 19.2,
  set: 'hamlet',
  mood: 'day',
  keys: [
    { t: 9.2, pos: [-14, 30, 44], look: [0, 0, 2], fov: 40 },
    { t: 14, pos: [10, 17, 30], look: [0, 0.5, 6] },
    { t: 19.2, pos: [1.5, 3.2, 25], look: [0, 1.1, 14], fov: 38 },
  ],
});
captions.push(
  { start: 9.8, end: 15.6, kind: 'title', text: 'CHIBI QUEST', sub: 'A brand-new world for your learning apps!' },
  { start: 15.9, end: 19, kind: 'banner', text: 'Heroes! Monsters! Puzzles!', sub: 'Learning is the real adventure', color: '#2f9fd8' },
);
fx(9.25, 'whoosh');
fx(9.8, 'sparkle');
fx(15.9, 'pop');
say(9.6, 14.4, 'Welcome to Chibi Quest! A brand-new world that is coming to your learning apps!');
say(14.6, 19.0, "It's full of heroes, monsters, puzzles, and adventure. Let's take a look!");
music.push({ start: 5.3, end: 19.2, mood: 'bright' });

// ================================================================ ACT 2: meet the heroes (south of the bridge)
const HEROES = [
  { id: 'knight', name: 'KNIGHT', line: 'Brave and strong. Protects the team!', move: 'attack2', color: '#d9463b', sound: 'clang' as const },
  { id: 'wizard', name: 'WIZARD', line: 'Casts spells with the power of words!', move: 'attack', color: '#6a3fd1', sound: 'zap' as const },
  { id: 'archer', name: 'ARCHER', line: 'Sharp eyes. Loves shapes and angles!', move: 'attack', color: '#3f9a3a', sound: 'swoosh' as const },
  { id: 'rogue', name: 'ROGUE', line: 'Quick and clever. Finds every secret!', move: 'attack2', color: '#1f8a8a', sound: 'swoosh' as const },
  { id: 'cleric', name: 'CLERIC', line: 'A kind helper who heals friends!', move: 'attack2', color: '#2f7fd8', sound: 'sparkle' as const },
  { id: 'druid', name: 'DRUID', line: 'Talks to plants and animals!', move: 'attack', color: '#5c8a2a', sound: 'sparkle' as const },
  { id: 'adventurer', name: 'ADVENTURER', line: 'Curious and ready for anything!', move: 'attack2', color: '#e08a1f', sound: 'swoosh' as const },
];
const LINE_Z = 15.6;
const heroX = (i: number): number => -3.3 + 1.1 * i;
const INTRO = 22.4; // the first close-up
const EACH = 4;
shots.push(
  {
    start: 19.2,
    end: INTRO,
    set: 'hamlet',
    mood: 'day',
    keys: [
      { t: 19.2, pos: [1.5, 3.2, 25], look: [0, 1.1, 14], fov: 38 },
      { t: INTRO, pos: [0, 1.9, 21.4], look: [0, 0.75, LINE_Z], fov: 38 },
    ],
  },
  {
    start: INTRO,
    end: INTRO + 7 * EACH,
    set: 'hamlet',
    mood: 'day',
    keys: HEROES.flatMap((_, i) => {
      const x = heroX(i);
      const t = INTRO + i * EACH;
      return [
        { t, pos: [x + 0.45, 1.0, LINE_Z + 2.35] as V3, look: [x, 0.62, LINE_Z] as V3, fov: 36 },
        { t: t + EACH - 0.7, pos: [x - 0.25, 0.95, LINE_Z + 2.2] as V3, look: [x, 0.6, LINE_Z] as V3, fov: 36 },
      ];
    }),
  },
  {
    start: INTRO + 7 * EACH,
    end: 54.4,
    set: 'hamlet',
    mood: 'day',
    keys: [
      { t: INTRO + 7 * EACH, pos: [3.2, 1.2, LINE_Z + 2.6], look: [2.4, 0.6, LINE_Z], fov: 36 },
      { t: INTRO + 7 * EACH + 1.4, pos: [0.3, 2.0, LINE_Z + 6.8], look: [0, 0.7, LINE_Z - 0.3], fov: 38 },
      { t: 54.4, pos: [-0.3, 2.2, LINE_Z + 7.2], look: [0, 0.75, LINE_Z - 0.4], fov: 38 },
    ],
  },
);
HEROES.forEach((h, i) => {
  const t = INTRO + i * EACH;
  actors.push(
    still(`line-${h.id}`, h.id, 'hamlet', [19.2, 54.4], [heroX(i), 0, LINE_Z], 0, [
      loop(19.2, 'idle', 1, i * 0.37),
      once(t + 0.35, h.move),
      loop(t + EACH - 0.4, 'idle', 1, i * 0.37),
      once(50.8 + i * 0.08, 'victory'),
    ]),
  );
  captions.push({ start: t + 0.15, end: t + EACH - 0.35, kind: 'lower', text: h.name, sub: h.line, color: h.color });
  fx(t + 0.15, 'pop');
  fx(t + 0.55, h.sound, 0.8);
});
captions.push(
  { start: 19.6, end: INTRO - 0.2, kind: 'banner', text: 'MEET THE HEROES!', color: '#e0452f' },
  { start: 50.9, end: 54.2, kind: 'banner', text: 'Which hero will YOU be?', color: '#6a3fd1' },
);
fx(19.6, 'pop');
fx(50.8, 'fanfare');
say(19.6, 22.2, "First, let's meet the heroes!");
const heroLines = [
  'The brave Knight protects the team.',
  'The Wizard casts spells with the power of words!',
  'The sharp-eyed Archer loves shapes and angles.',
  'The Rogue is quick and clever. No secret can hide!',
  'The kind Cleric heals friends.',
  'The Druid talks to plants and animals.',
  'And the Adventurer is ready for anything!',
];
heroLines.forEach((line, i) => say(INTRO + i * EACH + 0.3, INTRO + (i + 1) * EACH - 0.2, line));
say(50.9, 54.2, 'So... which hero will YOU be?');
music.push({ start: 19.2, end: 54.4, mood: 'heroes' });

// ================================================================ ACT 3: make it yours (color presets)
const LOOKS = [null, 'pathfinder', 'pilgrim', 'wanderer'] as const;
shots.push(
  {
    start: 54.4,
    end: 60.2,
    set: 'hamlet',
    mood: 'day',
    keys: [
      { t: 54.4, pos: [0.6, 1.0, LINE_Z + 2.9], look: [0.3, 0.6, LINE_Z + 0.4], fov: 34 },
      { t: 60.2, pos: [-0.3, 0.95, LINE_Z + 2.5], look: [0.3, 0.6, LINE_Z + 0.4], fov: 34 },
    ],
  },
  {
    start: 60.2,
    end: 66.6,
    set: 'hamlet',
    mood: 'day',
    keys: [
      { t: 60.2, pos: [1.8, 1.4, LINE_Z + 5.6], look: [1.6, 0.6, LINE_Z + 0.4], fov: 42 },
      { t: 66.6, pos: [1.4, 1.35, LINE_Z + 5.2], look: [1.6, 0.6, LINE_Z + 0.4], fov: 42 },
    ],
  },
);
actors.push(
  still('style-main', 'adventurer', 'hamlet', [54.4, 60.2], [0.3, 0, LINE_Z + 0.4], 0, [loop(54.4, 'idle'), once(58.9, 'victory')], {
    presets: [
      { t: 54.4, preset: null },
      { t: 55.7, preset: 'pathfinder' },
      { t: 56.8, preset: 'pilgrim' },
      { t: 57.9, preset: 'wanderer' },
      { t: 59.0, preset: null },
    ],
  }),
);
LOOKS.forEach((preset, i) => {
  const t = 60.4 + i * 0.45;
  actors.push(
    still(`style-${i}`, 'adventurer', 'hamlet', [t, 66.6], [-1.2 + i * 1.0, 0, LINE_Z + 0.4], 0, [once(t, 'victory'), loop(t + 2.6, 'idle', 1, i * 0.3)], {
      pop: true,
      presets: [{ t: 0, preset }],
    }),
  );
  fx(t, 'pop');
});
for (const t of [55.7, 56.8, 57.9, 59.0]) fx(t, 'sparkle', 0.7);
captions.push({ start: 54.8, end: 60, kind: 'banner', text: 'MAKE IT YOURS!', sub: 'Pick the eyes, hair, skin, and clothes', color: '#e05aa8' });
quest(61.4, 66.4, 65.0, 'MATH MAGIC', '3 eye colors × 3 hair colors\n× 3 skin colors × 3 outfits =\nhow many looks?', '3 × 3 × 3 × 3 = 81 looks!');
say(54.8, 60.0, 'Make your hero your own! Pick the eyes, hair, skin, and clothes.');
say(60.4, 64.0, 'Math magic! Three choices for each of those four things. How many different looks is that?');
say(65.0, 66.5, 'Eighty-one looks!');
music.push({ start: 54.4, end: 66.6, mood: 'heroes' });

// ================================================================ ACT 4: the village and its quests
// Drone flight from the bridge up the road to the well.
shots.push({
  start: 66.6,
  end: 71.4,
  set: 'hamlet',
  mood: 'day',
  keys: [
    { t: 66.6, pos: [9, 14, 25], look: [-1, 0, 3], fov: 40 },
    { t: 71.4, pos: [-2.2, 6.2, 11.2], look: [-10.4, 0.5, 8.2], fov: 40 },
  ],
});
captions.push({ start: 67.0, end: 71.0, kind: 'banner', text: 'EXPLORE THE VILLAGE', color: '#2fa84f' });
fx(66.6, 'whoosh');
say(67.0, 71.0, "Now let's explore the village! The villagers have quests for you.");

// The farmer's pumpkins: 3 rows of 4, which pop up on the field with the answer.
const FARMER: V3 = [-10.4, 0, 8.4];
shots.push({
  start: 71.4,
  end: 81.2,
  set: 'hamlet',
  mood: 'day',
  keys: [
    { t: 71.4, pos: [-7.0, 2.6, 11.4], look: leftOf([-7.0, 2.6, 11.4], [-10.9, 0.55, 8.4], 1.3), fov: 42 },
    { t: 81.2, pos: [-7.2, 3.1, 12.0], look: leftOf([-7.2, 3.1, 12.0], [-11.6, 0.45, 8.5], 1.6), fov: 44 },
  ],
});
actors.push(
  still('farmer', 'farmer', 'hamlet', [66.6, 81.2], FARMER, 270, [loop(66.6, 'work'), once(71.5, 'wave'), loop(73.6, 'work'), once(79.0, 'wave'), loop(81, 'idle')]),
);
for (let r = 0; r < 3; r++)
  for (let c = 0; c < 4; c++) {
    const t = 79.1 + (r * 4 + c) * 0.12;
    actors.push(still(`pumpkin-${r}-${c}`, 'pumpkin', 'hamlet', [t, 81.2], [-14.4 + c * 0.95, 0, 7.3 + r * 1.2], (r * 4 + c) * 37, [], { pop: true }));
    if (c === 0) fx(t, 'pop', 0.6);
  }
captions.push({ start: 71.8, end: 74.2, kind: 'bubble', text: 'Can you help me count my pumpkins?', actor: 'farmer', lift: 1.25 });
quest(74.0, 81.0, 78.8, "FARMER'S QUEST", 'The farmer planted 3 rows of pumpkins.\nEach row has 4 pumpkins.\nHow many pumpkins in all?', '3 × 4 = 12 pumpkins!');
say(71.8, 74.0, 'The farmer needs your help!');
say(74.2, 78.4, 'The farmer planted three rows of pumpkins, with four pumpkins in each row. How many pumpkins is that?');
say(78.8, 81.0, 'Twelve! Three times four equals twelve!');

// The blacksmith's word scramble, at the market stalls.
const SMITH: V3 = [5.4, 0, -1.7];
shots.push({
  start: 81.2,
  end: 90.4,
  set: 'hamlet',
  mood: 'day',
  keys: [
    { t: 81.2, pos: [4.1, 1.1, 0.4], look: leftOf([4.1, 1.1, 0.4], [5.4, 0.7, -1.7], 0.7), fov: 38 },
    { t: 90.4, pos: [4.4, 1.05, 0.1], look: leftOf([4.4, 1.05, 0.1], [5.4, 0.7, -1.7], 0.7), fov: 38 },
  ],
});
actors.push(still('smith', 'blacksmith', 'hamlet', [66.6, 90.4], SMITH, 0, [loop(66.6, 'work'), once(81.5, 'wave'), loop(83.4, 'work'), once(87.2, 'wave'), loop(89.2, 'work')]));
captions.push({ start: 81.6, end: 83.8, kind: 'bubble', text: 'My forge needs a magic word!', actor: 'smith', lift: 1.3 });
quest(83.6, 90.2, 87.2, "BLACKSMITH'S QUEST", 'Unscramble the letters\nto forge a new tool:\nD · R · O · W · S', 'SWORD!');
say(81.6, 83.6, 'The blacksmith has a puzzle.');
say(83.8, 87.0, 'Unscramble the letters: D, R, O, W, S. What tool is it?');
say(87.2, 90.2, "It's a SWORD! You're a word wizard!");

// The guard's riddle at the bridge.
const GUARD: V3 = [0.95, 0, 10.2];
shots.push({
  start: 90.4,
  end: 98.8,
  set: 'hamlet',
  mood: 'day',
  keys: [
    { t: 90.4, pos: [2.5, 1.25, 7.6], look: leftOf([2.5, 1.25, 7.6], [0.95, 0.75, 10.2], 0.9), fov: 40 },
    { t: 98.8, pos: [2.2, 1.3, 7.2], look: leftOf([2.2, 1.3, 7.2], [0.95, 0.75, 10.2], 0.9), fov: 40 },
  ],
});
actors.push(still('guard', 'guard', 'hamlet', [66.6, 98.8], GUARD, 180, [loop(66.6, 'idle'), once(90.6, 'salute'), loop(92.6, 'idle'), once(96.6, 'salute'), loop(98.4, 'idle')]));
captions.push({ start: 90.8, end: 93.2, kind: 'bubble', text: 'Halt! Solve my riddle to cross the bridge!', actor: 'guard', lift: 1.35 });
quest(92.8, 98.6, 96.4, "GUARD'S RIDDLE", 'I have hands,\nbut I cannot clap.\nWhat am I?', 'A CLOCK!');
say(90.8, 92.8, 'Halt! The guard has a riddle!');
say(93.0, 96.2, 'I have hands, but I cannot clap. What am I?');
say(96.4, 98.6, 'A clock! Riddle solved!');
fades.push({ t: 98.8, half: 0.4, color: '#ffffff' });
music.push({ start: 66.6, end: 98.8, mood: 'village' });

// ================================================================ ACT 5: the Old Oak Forest
const G = 0.08; // forest ground height
shots.push({
  start: 98.8,
  end: 103.6,
  set: 'forest',
  mood: 'day',
  keys: [
    { t: 98.8, pos: [8, 15, 17], look: [-1, 1, -2], fov: 40 },
    { t: 103.6, pos: [3.4, 2.4, 6.6], look: [-2.2, 2.2, -3.2], fov: 40 },
  ],
});
captions.push({ start: 99.4, end: 103.2, kind: 'banner', text: 'THE OLD OAK FOREST', color: '#3f8a2a' });
fx(98.8, 'whoosh');
say(99.4, 103.2, 'Next stop: the Old Oak Forest!');

// The dire wolf howls in the east glade.
const WOLF: V3 = [6.2, G, 1.3];
shots.push({
  start: 103.6,
  end: 108.6,
  set: 'forest',
  mood: 'day',
  keys: [
    { t: 103.6, pos: [4.6, 0.75, 4.2], look: [6.2, 0.6, 1.3], fov: 38 },
    { t: 108.6, pos: [4.3, 0.6, 3.6], look: [6.2, 0.7, 1.3], fov: 38 },
  ],
});
actors.push(still('wolf', 'dire-wolf', 'forest', [98.8, 108.6], WOLF, face(WOLF, [4.6, G, 4.2]) - 40, [loop(98.8, 'idle'), once(104.4, 'howl'), loop(107.6, 'idle')]));
captions.push({ start: 104.6, end: 107.8, kind: 'bubble', text: 'AWOOOOO!', actor: 'wolf', lift: 1.2 });
fx(104.5, 'howl');
say(103.8, 107.8, 'Listen... do you hear that? A dire wolf is howling!');

// The horned boar charges and the slime hops.
shots.push({
  start: 108.6,
  end: 114.2,
  set: 'forest',
  mood: 'day',
  keys: [
    { t: 108.6, pos: [5.6, 1.3, 5.2], look: [5.0, 0.45, 0.4], fov: 44 },
    { t: 114.2, pos: [4.6, 1.3, 5.0], look: [4.2, 0.45, 0.4], fov: 44 },
  ],
});
actors.push(
  {
    id: 'boar',
    asset: 'horned-boar',
    set: 'forest',
    show: [98.8, 114.2],
    path: [
      { t: 98.8, at: [8.2, G, 0.2], yaw: 270 },
      { t: 109.4, at: [8.2, G, 0.2], yaw: 270 },
      { t: 111.4, at: [2.6, G, 0.2] },
      { t: 112.2, at: [2.2, G, 0.2], yaw: 90 },
    ],
    clips: [loop(98.8, 'idle'), once(108.8, 'taunt'), loop(109.2, 'charge'), once(111.6, 'taunt'), loop(113.2, 'idle')],
  },
  {
    id: 'slime',
    asset: 'slime',
    set: 'forest',
    show: [98.8, 114.2],
    path: [
      { t: 98.8, at: [3.3, G, 2.6], yaw: 120 },
      { t: 109.0, at: [3.3, G, 2.6], yaw: 120 },
      { t: 112.8, at: [4.9, G, 1.6] },
    ],
    clips: [loop(98.8, 'idle'), loop(109.0, 'walk'), once(113.0, 'spit')],
  },
);
captions.push({ start: 109.0, end: 113.9, kind: 'banner', text: 'WILD CREATURES!', sub: 'Some are friendly... some are NOT!', color: '#c0602a' });
fx(109.2, 'rumble', 0.7);
say(109.0, 113.9, 'Wild creatures live here! Watch out for the horned boar... and this bouncy slime!');

// The goblin camp by the burnt-out campfire.
const CAMP: V3 = [6.8, G, -5.4];
shots.push({
  start: 114.2,
  end: 121.4,
  set: 'forest',
  mood: 'day',
  keys: [
    { t: 114.2, pos: [5.0, 1.5, -0.6], look: [6.6, 0.6, -5.2], fov: 42 },
    { t: 121.4, pos: [7.6, 1.6, -0.8], look: [6.6, 0.6, -5.2], fov: 42 },
  ],
});
const campers: [string, string, V3, string][] = [
  ['orc', 'orc-warrior', [6.6, G, -5.3], 'roar'],
  ['gob-warrior', 'goblin-warrior', [5.4, G, -4.2], 'taunt'],
  ['gob-archer', 'goblin-archer', [7.5, G, -3.7], 'attack'],
  ['bandit', 'bandit', [4.5, G, -5.9], 'taunt'],
];
campers.forEach(([id, asset, at, move], i) => {
  const t = 115.2 + i * 1.1;
  actors.push(still(id, asset, 'forest', [114.2, 121.4], at, face(at, [6.4, G, -0.6]), [loop(114.2, 'idle', 1, i * 0.4), once(t, move), loop(t + 2.4, 'idle', 1, i * 0.4)]));
});
captions.push(
  { start: 114.6, end: 118.4, kind: 'banner', text: 'A GOBLIN CAMP!', sub: 'Goblins, a bandit, and a grumpy orc', color: '#7a8a1f' },
  { start: 115.3, end: 117.4, kind: 'bubble', text: 'ROOOAR!', actor: 'orc', lift: 1.5 },
);
fx(115.2, 'roar', 0.5);
fx(116.3, 'swoosh', 0.6);
fx(117.4, 'swoosh', 0.6);
say(114.6, 121.2, 'Oh no, a goblin camp! Goblins, a sneaky bandit, and a very grumpy orc!');

// The giant spider by the river reeds.
const SPIDER: V3 = [-6.4, G, -5.2];
shots.push({
  start: 121.4,
  end: 125.6,
  set: 'forest',
  mood: 'day',
  keys: [
    { t: 121.4, pos: [-4.4, 0.9, -2.6], look: [-6.4, 0.45, -5.2], fov: 38 },
    { t: 125.6, pos: [-4.9, 0.8, -2.9], look: [-6.4, 0.45, -5.2], fov: 38 },
  ],
});
actors.push(still('spider', 'giant-spider', 'forest', [98.8, 125.6], SPIDER, face(SPIDER, [-4.4, G, -2.6]), [loop(98.8, 'idle'), once(122.4, 'spit'), loop(124.8, 'idle')]));
captions.push({ start: 122.2, end: 125.2, kind: 'bubble', text: 'Hsssss!', actor: 'spider', lift: 0.9 });
fx(122.5, 'screech', 0.6);
say(121.6, 125.4, 'And look out for the giant spider!');

// The druid's nature quest at the campfire.
const DRUID: V3 = [-4.5, G, 4.9];
shots.push({
  start: 125.6,
  end: 133.6,
  set: 'forest',
  mood: 'day',
  keys: [
    { t: 125.6, pos: [-2.0, 1.3, 6.6], look: leftOf([-2.0, 1.3, 6.6], [-4.8, 0.6, 4.6], 1.0), fov: 42 },
    { t: 133.6, pos: [-1.8, 1.4, 5.8], look: leftOf([-1.8, 1.4, 5.8], [-4.8, 0.6, 4.6], 1.0), fov: 42 },
  ],
});
actors.push(still('druid', 'druid', 'forest', [98.8, 133.6], DRUID, face(DRUID, [-2.0, G, 6.4]), [loop(98.8, 'idle'), once(126.0, 'attack'), loop(128, 'idle'), once(131.4, 'victory')]));
captions.push({ start: 126.0, end: 128.2, kind: 'bubble', text: 'The forest needs your help!', actor: 'druid', lift: 1.3 });
quest(127.8, 133.4, 131.4, "DRUID'S QUEST", 'What do plants\nneed to grow?\nSunlight · Water · Candy', 'Sunlight and water!');
say(126.0, 127.8, 'A nature quest!');
say(128.0, 131.2, 'What do plants need to grow? Sunlight, water... or candy?');
say(131.4, 133.4, 'Sunlight and water! Sorry, candy.');
fades.push({ t: 133.6, half: 0.45, color: '#0c1118' });
music.push({ start: 98.8, end: 133.6, mood: 'forest' });

// ================================================================ ACT 6: the Sunken Vault
const V = 0.09; // vault floor height
shots.push({
  start: 133.6,
  end: 138.6,
  set: 'vault',
  mood: 'vault',
  keys: [
    { t: 133.6, pos: [1, 9, 15], look: [0.5, 0.5, 2], fov: 42 },
    { t: 138.6, pos: [0.6, 3.2, 7.2], look: [0, 0.8, 0.6], fov: 42 },
  ],
});
captions.push({ start: 134.2, end: 138.2, kind: 'banner', text: 'THE SUNKEN VAULT', sub: 'Only the bravest heroes go in here...', color: '#6a3fd1' });
fx(133.6, 'whoosh');
say(134.2, 138.2, "Now, if you're brave enough... enter the Sunken Vault.");

// Skeleton and zombie rise in a cell, seen between the bars.
shots.push({
  start: 138.6,
  end: 145.4,
  set: 'vault',
  mood: 'vault',
  keys: [
    { t: 138.6, pos: [-6.0, 1.25, 3.2], look: [-9.8, 0.55, 3.0], fov: 42 },
    { t: 145.4, pos: [-6.5, 1.0, 3.1], look: [-9.8, 0.65, 3.0], fov: 42 },
  ],
});
actors.push(
  still('skel-rise', 'skeleton', 'vault', [133.6, 145.4], [-9.4, V, 2.6], face([-9.4, V, 2.6], [-6.0, V, 3.2]), [hold(133.6, 'rise'), once(139.4, 'rise'), loop(141.6, 'idle')]),
  still('zombie', 'zombie', 'vault', [133.6, 145.4], [-10.3, V, 3.5], face([-10.3, V, 3.5], [-6.0, V, 3.2]), [hold(133.6, 'rise'), once(140.4, 'rise'), loop(142.6, 'idle')]),
);
captions.push({ start: 139.2, end: 145.0, kind: 'banner', text: "Uh-oh... they're WAKING UP!", color: '#5a7a3a' });
fx(139.4, 'rumble');
fx(140.4, 'rumble', 0.6);
say(139.2, 145.0, 'Uh-oh. The skeletons and zombies are waking up!');

// The animated armor awakens in the pillared east hall, seen between two pillars.
const ARMOR: V3 = [-2.8, V, 4.3];
shots.push({
  start: 145.4,
  end: 150.4,
  set: 'vault',
  mood: 'vault',
  keys: [
    { t: 145.4, pos: [0.4, 1.2, 4.9], look: [-2.8, 0.95, 4.3], fov: 40 },
    { t: 150.4, pos: [-0.2, 1.0, 4.8], look: [-2.8, 1.0, 4.3], fov: 40 },
  ],
});
actors.push(still('armor', 'animated-armor', 'vault', [133.6, 150.4], ARMOR, face(ARMOR, [0.4, V, 4.9]), [hold(133.6, 'awaken'), once(146.2, 'awaken'), loop(148.4, 'idle')]));
captions.push({ start: 146.0, end: 150.0, kind: 'banner', text: 'Is that armor... MOVING?!', color: '#3a6ab0' });
fx(146.2, 'clang');
fx(147.2, 'clang', 0.7);
say(146.0, 150.0, 'And is that suit of armor... moving?');

// Bats and an imp in the great hall, around the hanging cage.
shots.push({
  start: 150.4,
  end: 154.2,
  set: 'vault',
  mood: 'vault',
  keys: [
    { t: 150.4, pos: [0.3, 1.2, 5.6], look: [0, 1.5, 1.6], fov: 50 },
    { t: 154.2, pos: [-0.3, 1.1, 5.2], look: [0, 1.5, 1.6], fov: 50 },
  ],
});
actors.push(
  {
    id: 'bat1',
    asset: 'giant-bat',
    set: 'vault',
    show: [150.4, 154.2],
    path: [
      { t: 150.4, at: [-2.6, 0.9, 1.4], yaw: 90 },
      { t: 152.2, at: [-0.7, 0.6, 3.0] },
      { t: 154.2, at: [2.4, 1.0, 2.2] },
    ],
    clips: [loop(150.4, 'fly'), once(151.6, 'screech'), loop(152.8, 'fly')],
  },
  {
    id: 'bat2',
    asset: 'giant-bat',
    set: 'vault',
    show: [150.4, 154.2],
    path: [
      { t: 150.4, at: [2.6, 1.2, 0.8], yaw: 250 },
      { t: 154.2, at: [-2.4, 0.9, 2.4] },
    ],
    clips: [loop(150.4, 'fly', 1.1, 0.3)],
  },
  {
    id: 'imp',
    asset: 'imp',
    set: 'vault',
    show: [150.4, 154.2],
    path: [
      { t: 150.4, at: [1.0, 0.1, 3.0], yaw: 200 },
      { t: 154.2, at: [0.7, 0.2, 3.2] },
    ],
    clips: [loop(150.4, 'fly'), once(152.2, 'cast'), loop(153.4, 'fly')],
  },
);
captions.push({ start: 150.6, end: 154.0, kind: 'banner', text: 'Bats! Imps! Oh my!', color: '#8a3a9a' });
fx(151.6, 'screech');
fx(152.3, 'zap', 0.7);
say(150.6, 154.0, 'Bats! Imps! Oh my!');

// The altar room: a skeleton mage, a skeleton archer, and a giant rat.
shots.push({
  start: 154.2,
  end: 158.2,
  set: 'vault',
  mood: 'vault',
  keys: [
    { t: 154.2, pos: [3.2, 1.45, -2.9], look: [0.4, 0.7, -5.8], fov: 46 },
    { t: 158.2, pos: [2.6, 1.35, -2.8], look: [0.2, 0.7, -5.8], fov: 46 },
  ],
});
actors.push(
  still('mage', 'skeleton-mage', 'vault', [154.2, 158.2], [0.2, V, -6.2], face([0.2, V, -6.2], [3.2, V, -2.9]), [loop(154.2, 'idle'), once(155.0, 'attack'), loop(157.2, 'idle')]),
  still('skel-archer', 'skeleton-archer', 'vault', [154.2, 158.2], [-1.8, V, -4.6], face([-1.8, V, -4.6], [3.2, V, -2.9]), [loop(154.2, 'idle', 1, 0.3), once(155.8, 'attack'), loop(157.8, 'idle')]),
  still('rat', 'giant-rat', 'vault', [154.2, 158.2], [1.6, V, -4.4], face([1.6, V, -4.4], [3.4, V, -2.6]), [loop(154.2, 'idle'), once(156.4, 'taunt')]),
);
captions.push({ start: 154.4, end: 158.0, kind: 'banner', text: 'The altar is guarded!', sub: 'A skeleton mage, a skeleton archer, and a giant rat', color: '#4a4a8a' });
fx(155.1, 'zap');
fx(155.9, 'swoosh');
say(154.4, 158.0, 'The altar has guards: a mage, an archer, and a rat!');

// Teamwork: the knight, the wizard, and the cleric beat a skeleton (side view, south of the pillars).
const FOE: V3 = [-2.2, V, 3.8];
shots.push({
  start: 158.2,
  end: 164.0,
  set: 'vault',
  mood: 'vault',
  keys: [
    { t: 158.2, pos: [-0.9, 1.5, 5.8], look: [-0.8, 0.55, 3.4], fov: 52 },
    { t: 164.0, pos: [-0.4, 1.45, 5.8], look: [-0.8, 0.55, 3.4], fov: 52 },
  ],
});
actors.push(
  still('skel-fight', 'skeleton', 'vault', [158.2, 164.0], FOE, 90, [loop(158.2, 'idle'), once(158.9, 'attack'), once(159.8, 'hit'), once(161.0, 'hit'), once(161.9, 'death')]),
  still('v-knight', 'knight', 'vault', [158.2, 164.0], [-0.9, V, 3.8], 270, [loop(158.2, 'idle'), once(159.4, 'attack'), loop(161, 'idle'), once(162.8, 'victory')]),
  still('v-wizard', 'wizard', 'vault', [158.2, 164.0], [0.1, V, 3.0], face([0.1, V, 3.0], FOE), [loop(158.2, 'idle', 1, 0.4), once(160.4, 'attack'), loop(162.2, 'idle'), once(162.9, 'victory')]),
  still('v-cleric', 'cleric', 'vault', [158.2, 164.0], [0.5, V, 3.9], face([0.5, V, 3.9], FOE), [loop(158.2, 'idle', 1, 0.8), once(161.2, 'attack2'), once(163.0, 'victory')]),
);
captions.push({ start: 158.4, end: 163.8, kind: 'banner', text: 'TEAMWORK!', color: '#e0452f' });
fx(159.5, 'clang');
fx(160.5, 'zap');
fx(161.3, 'sparkle');
fx(161.9, 'boom', 0.6);
fx(162.8, 'fanfare', 0.6);
say(158.4, 163.8, 'Time for teamwork! The knight, the wizard, and the cleric work together!');

// The vault door's number puzzle: the team faces the south door.
shots.push({
  start: 164.0,
  end: 171.0,
  set: 'vault',
  mood: 'vault',
  keys: [
    { t: 164.0, pos: [2.9, 1.4, 3.0], look: leftOf([2.9, 1.4, 3.0], [1.0, 0.9, 5.3], 1.0), fov: 48 },
    { t: 171.0, pos: [2.7, 1.5, 2.6], look: leftOf([2.7, 1.5, 2.6], [1.0, 0.9, 5.3], 1.0), fov: 48 },
  ],
});
const doorTeam: [string, string, V3][] = [
  ['d-knight', 'knight', [0.3, V, 4.9]],
  ['d-wizard', 'wizard', [1.0, V, 5.2]],
  ['d-cleric', 'cleric', [1.7, V, 4.9]],
];
doorTeam.forEach(([id, asset, at], i) =>
  actors.push(still(id, asset, 'vault', [164.0, 171.0], at, face(at, [2.9, V, 3.0]), [loop(164.0, 'idle', 1, i * 0.4), once(168.7 + i * 0.12, 'victory')])),
);
quest(164.6, 170.8, 168.6, 'VAULT PUZZLE', 'The magic door opens with\nthe next number:\n2, 4, 6, 8, ?', '10! The door opens!');
say(164.6, 168.4, 'The magic door has a number puzzle. Two, four, six, eight... what comes next?');
say(168.6, 170.8, 'Ten! Counting by twos opens the door!');
fades.push({ t: 171.0, half: 0.45, color: '#000000' });
music.push({ start: 133.6, end: 171.0, mood: 'vault' });

// ================================================================ ACT 7: the dragon (forest at dusk)
// The border trees stand at z = -7 and 7 and x = 9: every camera stays inside that ring.
const LAND: V3 = [1.0, G, -2.2];
const DRAGON_CAM: V3 = [3.4, 1.2, 3.8];
shots.push(
  {
    start: 171.0,
    end: 176.2,
    set: 'forest',
    mood: 'dusk',
    keys: [
      { t: 171.0, pos: DRAGON_CAM, look: [-1.5, 4.8, -7], fov: 46 },
      { t: 173.6, pos: [3.3, 1.2, 3.7], look: [1.0, 2.6, -2.2], fov: 46 },
      { t: 176.2, pos: [3.1, 1.25, 3.4], look: [1.1, 2.0, -2.2], fov: 44 },
    ],
    shake: [[174.2, 0], [174.4, 0.08], [175.6, 0.03], [176.2, 0]],
  },
  {
    start: 176.2,
    end: 182.4,
    set: 'forest',
    mood: 'dusk',
    keys: [
      { t: 176.2, pos: [2.7, 1.35, 2.6], look: [2.6, 1.1, -2.2], fov: 54 },
      { t: 180.4, pos: [2.3, 1.45, 2.4], look: [2.4, 1.2, -2.2], fov: 54 },
      { t: 182.4, pos: [2.3, 1.4, 2.4], look: [3.4, 4.0, -5.0], fov: 56 },
    ],
    shake: [[178.2, 0], [178.3, 0.05], [178.9, 0]],
  },
);
actors.push({
  id: 'dragon',
  asset: 'dragon-fire',
  set: 'forest',
  scale: 3.0,
  show: [171.0, 182.4],
  path: [
    { t: 171.0, at: [-6, 8.5, -12], yaw: 35 },
    { t: 173.6, at: [LAND[0], 1.8, LAND[2]] },
    { t: 174.1, at: LAND, yaw: face(LAND, DRAGON_CAM) },
    { t: 176.3, at: LAND, yaw: 90 },
    { t: 180.6, at: LAND },
    { t: 182.4, at: [8, 9, -12], yaw: 40 },
  ],
  clips: [loop(171.0, 'fly'), once(174.1, 'roar'), loop(176.0, 'idle'), once(178.0, 'attack'), once(179.2, 'hit'), loop(180.6, 'fly')],
});
// The heroes in two rows east of the dragon, facing it.
const battle: V3[] = [
  [3.5, G, -3.4],
  [3.5, G, -2.2],
  [3.5, G, -1.0],
  [4.7, G, -3.9],
  [4.7, G, -2.8],
  [4.7, G, -1.6],
  [4.7, G, -0.5],
];
HEROES.forEach((h, i) => {
  const at = battle[i]!;
  actors.push(
    still(`b-${h.id}`, h.id, 'forest', [176.2, 182.4], at, face(at, LAND), [loop(176.2, 'idle', 1, i * 0.3), once(176.8 + i * 0.28, h.move), loop(179.4, 'idle', 1, i * 0.3), once(181.0 + i * 0.06, 'victory')]),
  );
});
captions.push(
  { start: 174.2, end: 176.0, kind: 'title', text: 'BOSS BATTLE!', top: 17 },
  { start: 176.6, end: 180.2, kind: 'banner', text: 'Work together to win!', color: '#e08a1f' },
  { start: 180.6, end: 182.2, kind: 'banner', text: 'The dragon flies away!', color: '#2fa84f' },
);
fx(171.0, 'whoosh');
fx(174.2, 'roar');
fx(174.2, 'rumble');
for (let i = 0; i < 7; i++) fx(176.9 + i * 0.28, HEROES[i]!.sound, 0.6);
fx(178.2, 'boom');
fx(179.3, 'boom', 0.6);
fx(180.8, 'whoosh');
fx(181.0, 'fanfare');
say(171.2, 174.0, "But wait... what's that in the sky?");
say(174.2, 176.0, 'The Fire Dragon! Boss battle!');
say(176.6, 180.2, 'All seven heroes team up...');
say(180.6, 182.3, 'Hooray, you did it!');
fades.push({ t: 182.4, half: 0.4, color: '#ffffff' });
music.push({ start: 171.0, end: 182.4, mood: 'battle' });

// ================================================================ ACT 8: the finale (south of the bridge, golden hour)
shots.push(
  {
    start: 182.4,
    end: 190.6,
    set: 'hamlet',
    mood: 'golden',
    keys: [
      { t: 182.4, pos: [2.4, 1.3, LINE_Z + 4.6], look: [0, 0.9, LINE_Z - 0.6], fov: 40 },
      { t: 190.6, pos: [-1.8, 1.6, LINE_Z + 5.6], look: [0, 0.9, LINE_Z - 0.6], fov: 40 },
    ],
  },
  {
    start: 190.6,
    end: 200,
    set: 'hamlet',
    mood: 'golden',
    keys: [
      { t: 190.6, pos: [-1.8, 1.6, LINE_Z + 5.6], look: [0, 0.9, LINE_Z - 0.6], fov: 40 },
      { t: 200, pos: [0, 24, 38], look: [0, 0, 4], fov: 40 },
    ],
  },
);
// Heroes in front, villagers behind them.
const party: [string, string, V3, string][] = [
  ['f-knight', 'knight', [-3.0, 0, LINE_Z + 0.3], 'victory'],
  ['f-wizard', 'wizard', [-1.8, 0, LINE_Z + 0.5], 'victory'],
  ['f-archer', 'archer', [-0.6, 0, LINE_Z + 0.6], 'victory'],
  ['f-adventurer', 'adventurer', [0.6, 0, LINE_Z + 0.6], 'victory'],
  ['f-rogue', 'rogue', [1.8, 0, LINE_Z + 0.5], 'victory'],
  ['f-cleric', 'cleric', [3.0, 0, LINE_Z + 0.3], 'victory'],
  ['f-druid', 'druid', [-2.4, 0, LINE_Z - 0.9], 'victory'],
  ['f-farmer', 'farmer', [-1.1, 0, LINE_Z - 1.0], 'wave'],
  ['f-guard', 'guard', [0.2, 0, LINE_Z - 1.05], 'salute'],
  ['f-smith', 'blacksmith', [1.5, 0, LINE_Z - 1.0], 'wave'],
];
party.forEach(([id, asset, at, move], i) => {
  actors.push(
    still(id, asset, 'hamlet', [182.4, 200], at, face(at, [0, 0, LINE_Z + 6]), [
      loop(182.4, 'idle', 1, i * 0.23),
      once(183.4 + i * 0.12, move),
      loop(186.2, 'idle', 1, i * 0.23),
      once(187.4 + (i % 3) * 0.2, move),
      loop(190.2, 'idle', 1, i * 0.23),
    ]),
  );
});
captions.push(
  { start: 183.2, end: 190.2, kind: 'title', text: 'LEARN. EXPLORE. LEVEL UP!', top: 18 },
  { start: 191.4, end: 199.2, kind: 'endcard', text: 'CHIBI QUEST', sub: 'Coming soon to your learning apps!' },
);
fx(182.5, 'sparkle');
fx(183.3, 'fanfare');
fx(191.4, 'sparkle');
say(183.2, 190.2, 'In Chibi Quest, you learn, you explore, and you level up!');
say(191.4, 199.0, 'Chibi Quest is coming soon to your learning apps. See you there, heroes!');
fades.push({ t: 200, half: 0.8, color: '#000000' });
music.push({ start: 182.4, end: 200, mood: 'finale' });

const chapters = [
  { t: 0, title: 'The mystery treasure chest' },
  { t: 9.2, title: 'Welcome to Chibi Quest' },
  { t: 19.2, title: 'Meet the heroes' },
  { t: 54.4, title: 'Make your hero yours' },
  { t: 66.6, title: 'Village quests' },
  { t: 98.8, title: 'The Old Oak Forest' },
  { t: 133.6, title: 'The Sunken Vault' },
  { t: 171.0, title: 'Boss battle: the Fire Dragon' },
  { t: 182.4, title: 'Coming soon' },
];

const lessons = [
  { t: 61.4, quest: 'Math Magic', skill: 'Multiplying several factors: 3 × 3 × 3 × 3 = 81 combinations', grades: '4 to 6' },
  { t: 74.0, quest: "Farmer's Quest", skill: 'Multiplication as equal groups (arrays): 3 rows of 4 = 12', grades: '3' },
  { t: 83.6, quest: "Blacksmith's Quest", skill: 'Spelling and word building: unscramble D-R-O-W-S', grades: '3 to 4' },
  { t: 92.8, quest: "Guard's Riddle", skill: 'Reading comprehension and figurative language (hands of a clock)', grades: '3 to 5' },
  { t: 127.8, quest: "Druid's Quest", skill: 'Life science: what plants need to grow', grades: '3' },
  { t: 164.6, quest: 'Vault Puzzle', skill: 'Number patterns: skip counting by 2', grades: '3' },
];

// ---------------------------------------------------------------- reading pauses
/**
 * Extra seconds inserted at these moments (original times): a slower start for the hook, and time
 * to read each quest before its 3-2-1 countdown (a grade 3 reader needs it). Every time after a
 * pause moves later; camera moves that span a pause simply drift more slowly.
 */
const PAUSES: readonly (readonly [number, number])[] = [
  [2.0, 1.5],
  [61.9, 2.5],
  [74.5, 2.5],
  [84.1, 2.5],
  [93.3, 2.5],
  [128.3, 2.5],
  [165.1, 2.5],
];
const warp = (t: number): number => t + PAUSES.reduce((sum, [at, d]) => sum + (t > at ? d : 0), 0);
for (const s of shots) {
  s.start = warp(s.start);
  s.end = warp(s.end);
  for (const k of s.keys) k.t = warp(k.t);
  if (s.shake) s.shake = s.shake.map(([t, v]) => [warp(t), v] as const);
}
for (const a of actors) {
  a.show = [warp(a.show[0]), warp(a.show[1])];
  for (const k of a.path) k.t = warp(k.t);
  for (const c of a.clips) c.t = warp(c.t);
  if (a.presets) a.presets = a.presets.map((p) => ({ ...p, t: warp(p.t) }));
}
for (const c of captions) {
  c.start = warp(c.start);
  c.end = warp(c.end);
  if (c.answerAt !== undefined) c.answerAt = warp(c.answerAt);
}
for (const f of fades) f.t = warp(f.t);
for (const x of sfx) x.t = warp(x.t);
for (const m of music) {
  m.start = warp(m.start);
  m.end = warp(m.end);
}
for (const n of narration) {
  n.start = warp(n.start);
  n.end = warp(n.end);
}

export const tour: Tour = {
  title: 'Chibi Quest',
  duration: warp(200),
  chapters: chapters.map((c) => ({ ...c, t: warp(c.t) })),
  lessons: lessons.map((l) => ({ ...l, t: warp(l.t) })),
  shots,
  actors,
  captions,
  fades,
  sfx: sfx.sort((a, b) => a.t - b.t),
  music,
  narration,
};
