# Storytime song renders (option C)

The owner decided on 2026-10-23 (S27) that the Chibi Sprouts song videos are full in-scene
renders: the cast stands on the classroom rug, with real perspective and shadows, and plays
its clips on the song timeline. Forge renders the silent video. Workbooks muxes the audio and
overlays the lyrics, the inset, and the screens.

## Inputs

1. **Workbooks' `spec.json`**, unchanged (`../Workbooks/video/storytime-song/public/l2/w01/spec.json`):
   `duration`, `lines[].start/end` (song seconds), `lines[].actors` (the singers),
   `lines[].gesture` (text: `point to self`, `point forward`, `wave`, `clap`, `nod`, `hands out`),
   `lines[].scene`. Keys the recorder does not read are ignored.
2. **Storytime's `stage.json`** (`~/Desktop/primary-parity-progress/storytime-stage/l2/w01/stage.json`):

```json
{
  "scene": "classroom",
  "marks": { "Pip": { "x": -0.55, "z": 0.45, "yaw": 0 } },
  "camera": [{ "at": 0, "az": 0, "el": 12, "dist": 4.8, "tx": 0, "tz": -0.1 }],
  "cameraPortrait": [],
  "moves": [{ "actor": "Nan", "at": 30, "to": { "x": 0.2, "z": 0 }, "clip": "walk" }]
}
```

Two optional switches: `"sun": "high"` (the classroom.png light, short contact shadows; the
default) or `"side"` (from the camera's left, long shadows on the rug, some hair shadow on the
faces), and `"dog": "howl"` (Pip sings with the howl clip; the default) or `"quiet"` (idle, a sit
on a nod).

Stage space is the rug: x to the right, z toward the camera, the rug centre is (0, 0), yaw 0
faces the camera. The classroom map puts the rug at world (0, 0, 3); an outdoor map puts the same
(0, 0) on its ground. Camera keys use the same space for `tx` and `tz`; `ty` (default 0.4 m) and
`fov` (default 32) are optional. A key holds until the next key's time and eases to it from its
own time, so two keys with the same values hold a shot. `cameraPortrait` serves the 1080x1920
cut; without it the landscape keys apply.

### Sets, cuts, props, and pictures (contract v2, 2026-10-24)

The owner's notes on the week 2, 3, 6 cuts (2026-10-24): the objects a song names must be in the
picture, and one sustained take feels lifeless. A stage file can therefore name a set for each
scene name of the spec and cut between them:

```json
{
  "sets": {
    "classroom": { "map": "classroom", "marks": {}, "camera": [], "props": [], "pictures": [] },
    "park": { "map": "meadow", "sun": "side", "marks": { "Pip": { "x": 0.3, "z": 0.2 } }, "camera": [] },
    "sky": { "map": "meadow", "camera": [{ "at": 0, "az": 0, "el": -25, "dist": 3, "tx": 0, "tz": 0, "ty": 2.2 }] }
  },
  "cuts": [{ "at": 0, "set": "sky" }, { "at": 9.5, "set": "park" }],
  "props": [{ "asset": "apple", "x": -0.5, "z": 0.3, "scale": 1.5, "from": 19.2, "to": 23.1 }],
  "pictures": [{ "file": "pictures/apple.png", "x": 0, "y": 1.3, "z": -2.2, "w": 0.6, "from": 4.6, "to": 8.0 }]
}
```

- A cut is a hard switch at `at`: new room, new marks, new camera, new props. The clips and the
  mouths continue. Default cuts: one at every line whose `scene` differs from the line before
  (the spec names `sky`, `classroom`, `park`, `meadow`); `cuts` overrides them. A scene name with
  no set falls back to the top-level stage with a warning; a stage file without `sets` is one shot
  for the whole song, as before. Consecutive cuts on the same set are one shot.
- A set: `map` (a file in `scenes/maps/`; `classroom`, `meadow`, `grassland`, `lake-shore`, ...
  there is no park map, use `meadow`), `origin` (`[x, z]` world metres where the stage (0, 0)
  sits) and `heading` (degrees the stage turns; stage +z is the camera side). The defaults are
  `MAP_ORIGINS` in `src/song/timeline.ts`: the rug for the classroom, a clear patch with a clear
  camera corridor for the meadow (7, 5 facing 180), the grassland (0, 0 facing 180), and the lake
  shore (-4, 4 facing 45, a tight 1.5 m stage with the water behind the cast); any other map uses
  the rug origin. `light` (`interior` or `outdoor`; default from the map), `sun`,
  `marks` (an actor without one uses the top-level mark, or its row place), `camera` and
  `cameraPortrait` (default: the top-level keys), `props`, `pictures`. The top-level `props` and
  `pictures` belong to the top-level stage as a set.
- Outdoor light: a pale blue backdrop (#cfe6f4), a cool hemisphere, the sun from the front left
  (`src/song/main.ts`, `LIGHT`). A sky shot looks up: `el` below zero puts the eye under the
  target, `ty` raises the target; the backdrop is the sky. A sun or a cloud is a picture.
- A prop: `asset` (any built `out/<asset>/<asset>.glb`), `x`, `z`, `y`, `yaw`, `scale`, `from`,
  `to` (default: the shot span; a prop never shows outside its shot), `clip` (a rigged animal
  loops it; default `idle` when the GLB has one), `count` and `spacing` (n copies along x),
  `held` (the actor; the prop follows the `hand` bone, `R` default, or `bone` by name; a dog has
  no hands, so Pip holds a prop on the `jaw` bone, then `head`; `offset` metres and `rotate`
  degrees adjust the grip). Built props that fit the songs: apple, apple-tree, cherry-tree, oak-tree,
  wildflowers, flower-petal, fruit-basket, bread, cat, dog, pigeon, messenger-bird, fish, frog,
  rabbit, sheep, cow, pig, horse, notice-board, signpost. Not built: duck, kite, ball, grape, sun,
  cloud, easel.
- A picture: `file` (relative to the stage file; the recorder serves that folder at `/stage/`;
  PNG, JPG, WebP), `x`, `y`, `z` (the centre), `w` (metres; `h` from the image ratio), `yaw`,
  `from`, `to`, `card` (a white card with a dark border behind it), `unlit` (flat colours, no
  shadow). The classroom back wall face is at rug z -6.98; a `notice-board` prop with pictures 2 cm
  in front of it is the board.
- `moves` stay top-level; a move belongs to the shot in force at its time and ends at that set's
  mark yaw. A move that runs past a cut gets a warning.

Rules (`src/song/timeline.ts`):

- Actors: `CAST` maps spec names to assets (`Pip` = `sprout-pip` and so on). An unknown actor stops
  the render. Everyone with a mark stands in the scene; an actor without a mark stands in a row on
  the rug centre line at 0.7 m spacing, in order of first appearance.
- Clips: a singer plays the line's gesture clip in a loop from the line start, and `idle` from the
  line end (no idle between two lines closer than 0.3 s). Unknown gesture text gives `gesture-idle`
  and a warning. Pip (a dog) sings with `howl` and sits for a `nod`. A missing clip in a GLB falls
  back to `idle` with a note in `render.txt`.
- Moves: the actor walks at 0.45 m/s with the `walk` clip, turns toward the target, and returns
  to the mark's yaw and the line clip on arrival.
- Clips cross-fade over 0.22 s; a cut does not restart them.
- Singing: each actor's `sings` are the word times of its lines (`segments[].words`, or the line
  span without them). The mouth opens in 60 ms at a word, closes over 90 ms at its end, and pulses
  about 3.5 times a second on words longer than 0.45 s. Eyes blink for 0.14 s about every 3.4 s,
  offset per actor.

The singing face is the kind option `sing: true` (`assets/parts/humanoid-kind.ts`): an open-mouth
body (dark, with a tongue) rigid on a `mouth` bone and skin-coloured eyelids rigid on an
`eyelids` bone, both children of `head`. At rest they sit 3 cm inside the head (`SING_DEPTH`),
so every other render shows the painted face; the song page moves the bones out by `SING_OUT`
(`src/song/timeline.ts`: 0.046 m for the mouth, 0.038 m for the eyelids, since the real face
sits about 1 cm outside the head ellipsoid at the mouth) after the mixer, since no clip poses
them. `--query mouthOut=0.05&lidOut=0.04` on the recorder overrides the travel for tuning. The
seven Sprout humanoids set it; Pip (a dog) sings with the howl clip. The chibi head is 0.41 m
wide, so the 8 cm mouth reads as about a fifth of the face.

## Commands

```bash
L=~/Desktop/primary-parity-progress/heavy.lock
SPEC=../Workbooks/video/storytime-song/public/l2/w01/spec.json
STAGE=~/Desktop/primary-parity-progress/storytime-stage/l2/w01/stage.json
OUT=out/chibi-sprouts/r1/week1/song
flock $L node --import tsx scripts/song-record.ts sheet  $SPEC $STAGE --out $OUT --count 12     # sheet.png, 12 stills
flock $L node --import tsx scripts/song-record.ts stills $SPEC $STAGE --out $OUT --at 11.4,20    # still-<t>.png
flock $L node --import tsx scripts/song-record.ts record $SPEC $STAGE --out $OUT --fps 24        # song.mp4
flock $L node --import tsx scripts/song-record.ts record $SPEC $STAGE --out $OUT --portrait      # song-phone.mp4
```

Output: `song.mp4` 1920x1080, H.264 yuv420p, no sound, video t = song t, length = `duration`.
The page server serves `out/` at `/out/` and the stage file's folder at `/stage/` (pictures).
`--name song-cut2` names a cut (`song-cut2.mp4`, `song-cut2-sheet.png`); `--from s --to s`
records a part; `--frames` keeps the JPEG frames. Every run appends the timeline, the page
notes, and the timing to `render.txt`. Never import an asset or kind module into the page: it
pulls the Node build code into the browser and the page never becomes ready.

The page is `song.html` (`src/song/main.ts`): the scene page's light sets, every room of the
timeline from `scenes/maps/<map>.ts` (loaded once, one visible per shot), the actors as skinned
clones with an animation mixer, props and pictures per shot, and
`window.__song.load(timeline)` and `seek(t)` for the recorder. Every singer needs the gesture
clips (`sproutGestures(k, h)` in the asset's `extra`); the GLBs come from `out/<asset>/`.

Cost (2012 quad-core, software GL, under the lock): the page loads in about 45 s with 7 actors;
a still takes 1 to 2 s; the week 1 song (78 s, 1881 frames at 24 fps) renders in about 6 min at
1 GB RSS.
