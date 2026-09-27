# The Chibi Quest showcase video

A 3 minute 36 second walkthrough of the world for a YouTube preview of the education apps,
made for students in grades 3 to 6. It uses the three sample maps (the Chibi Quest hamlet, the
Old Oak Forest, and the Sunken Vault) and all 28 characters with their own animation clips.

## The story

| Time | Chapter | What happens |
| --- | --- | --- |
| 0:00 | The mystery treasure chest | Candlelight in the vault; the chest is a mimic. |
| 0:10 | Welcome to Chibi Quest | A flight over the village and the title. |
| 0:20 | Meet the heroes | Seven heroes, each with a name card and a signature move. |
| 0:55 | Make your hero yours | The color presets change one hero; a math quest (3 × 3 × 3 × 3 = 81 looks). |
| 1:10 | Village quests | The farmer (3 rows of 4 pumpkins), the blacksmith (unscramble SWORD), the guard (a riddle). |
| 1:50 | The Old Oak Forest | A dire wolf, a horned boar, a slime, a goblin camp, a giant spider, the druid's nature quest. |
| 2:27 | The Sunken Vault | Skeletons and zombies rise, armor awakens, bats and an imp, the altar guards, teamwork, a number door. |
| 3:07 | Boss battle | The fire dragon lands, the seven heroes team up, the dragon flies away. |
| 3:18 | Coming soon | Heroes and villagers celebrate; the end card. |

Each quest shows its question with time to read, then a 3-2-1 countdown so viewers can answer out
loud, then the answer with a check mark (`out/showcase/youtube.md` lists the skill and grades).

## Files

| File | Role |
| --- | --- |
| `showcase.html`, `src/showcase/main.ts` | The page: loads the maps and the cast, renders any moment with `seek(t)`. |
| `src/showcase/script.ts` | The whole tour as data: shots, actors and their clips, text, narration, sounds, music. |
| `src/showcase/types.ts` | The script's types. |
| `src/showcase/showcase.css`, `src/showcase/fonts/` | The on-screen text; Fredoka (SIL Open Font License, `OFL.txt`). |
| `scripts/showcase.ts` | Stills, scouting, and the video recorder (Playwright frames piped to ffmpeg). |
| `scripts/showcase-audio.ts` | The soundtrack: music per mood and sound effects, synthesized, -15 LUFS. |

## Commands

```bash
node --import tsx scripts/showcase-audio.ts                  # out/showcase/soundtrack.wav (15 s)
node --import tsx scripts/showcase.ts record                 # the video, about 45 min on this machine
node --import tsx scripts/showcase.ts frames 12 30.5 80      # stills at these seconds
node --import tsx scripts/showcase.ts views views.json       # planning cameras: [{ name, set, pos, look, fov?, mood?, t? }]
node --import tsx scripts/showcase.ts scripts                # captions, voice-over script, YouTube notes only
node --import tsx scripts/showcase.ts serve                  # then open showcase.html?play (real time, with sound)
```

`pnpm dev` also serves `showcase.html?play`.

Output in `out/showcase/`: `chibi-quest-tour.mp4` (1920 x 1080, 30 fps, with sound),
`chibi-quest-tour.silent.mp4`, `soundtrack.wav`, `chibi-quest-tour.srt` (narration captions),
`voiceover.md` (the narration script with times), and `youtube.md` (title, description,
chapters, learning moments).

## Editing the tour

- Times in `script.ts` are written in the original timeline; `PAUSES` at the end inserts reading
  time (for the hook and before each quest countdown) and shifts everything after it. Add time
  there, not by hand.
- Coordinates are set-local meters of each map (`scenes/*.ts`): +X east, +Z south, yaw 0 faces
  south. `face(from, to)` turns an actor toward a point; `leftOf(cam, subject, m)` keeps a subject
  left of the quest card.
- The forest's border trees stand at z = -7 and 7 and x = 9; keep cameras inside that ring. In
  the vault, check pillars and arches with a still before a long camera move.
- A one-shot clip holds its last frame; `hold(t, clip)` shows a clip's first frame (a closed mimic,
  a bone heap before it rises). `pop: true` makes an actor bounce in when it appears.
- After a change, render stills of the changed moments before a full recording.

The narration is a script for a human voice; the video has music and sound effects but no
voice. Record the voice-over from `voiceover.md` and mix it over `chibi-quest-tour.mp4`, or over
the silent video together with `soundtrack.wav`.
