# Sound library

The sound library holds recorded CC0 sounds for the Chibi Quest assets and the games. The track is
`measure/tracks/audio_sfx_library_20261013/`.

## Files

| Path | Content | In git |
| --- | --- | --- |
| `docs/sound-effects-list.tsv` | The wanted sounds: one row for each sound | yes |
| `audio/sources/oga-cc0.json` | The source catalog: 1521 CC0 entries of OpenGameArt (metadata) | yes |
| `audio/<category>/<name>-<n>.mp3` | The takes | yes (music: owner decision) |
| `audio/manifest/<category>.tsv` | One row for each take: source, file, span, author, license | yes |
| `out/audio-source/<slug>/` | Raw downloads, unpacked | no |
| `scripts/sfx-review.html` | The review page (served by `review`) | yes |
| `audio/review.tsv`, `audio/review-notes.tsv` | The owner decisions and notes | yes |
| `out/audio-review/submissions/` | Each submission as JSON | no |

## The list

Columns of `docs/sound-effects-list.tsv`:

- `id`: `category/name`. Categories: ui, answer, reward, battle, magic, hero, npc, enemy, monster,
  wildlife, ambience, world, item, vehicle, music.
- `description`: what the sound is.
- `used_by`: catalog IDs (`family/group/name`, `*` for a whole group) and game events
  (`game:<event>`, the names that the games pass to `sfx`).
- `takes`: how many variations the games need (footsteps and hits need more than one).
- `length`: `short`, `medium`, `long`, `loop`, or `music` (limits below).
- `priority`: P0 = a current game event or a P0 scene uses it; P1 = the catalog families of the
  first sets; P2 = the rest.

One row serves many assets. For example, `monster/beast-growl` serves the dire wolf, the dire bear,
the owlbear, and the shadow hound.

## The tool

```bash
node scripts/sfx-library.mjs search growl beast            # rank catalog entries (sound effects)
node scripts/sfx-library.mjs search battle --music         # rank music entries
node scripts/sfx-library.mjs entry goblins-sound-pack      # license, description, files
node scripts/sfx-library.mjs fetch goblins-sound-pack      # download, unpack, list audio files
node scripts/sfx-library.mjs probe "goblins-sound-pack/goblins_0/goblin-1.wav"   # the sounds in a file
node scripts/sfx-library.mjs take enemy/goblin-chatter "goblins-sound-pack/goblins_0/goblin-1.wav" --start 0.1 --end 0.9
node scripts/sfx-library.mjs rows enemy/goblin-chatter enemy/orc-grunt   # rows: takes found/wanted, class, description
node scripts/sfx-library.mjs status enemy/                 # takes found for each row
node scripts/sfx-library.mjs rebuild magic/                # process the takes again (after a change to the processing)
node scripts/sfx-library.mjs review                        # review server on http://127.0.0.1:4178/
node scripts/sfx-library.mjs apply-review <file.json>      # apply a saved submission again
node scripts/sfx-library.mjs renumber magic/               # give a new number to a take that reuses a rejected file name
```

A take is processed the same way every time:

1. Decode the span (`--start`, `--end`) at 44.1 kHz: mono for effects, stereo for loops and music.
2. Effects: cut the quiet start and end (40 dB under the loudest 10 ms), fade in 3 ms and out 15 ms
   (120 ms when `--end` cuts the sound, 2 s for music).
   Loops: fold the tail into the head (equal-power crossfade of up to 1.5 s), so the file loops
   without a seam. A source that already loops (a drum loop) takes `--seamless`: the tool keeps
   the span as it is, because a fold breaks the beat. The manifest column `loop` is then `source`.
3. Level to the RMS target of the class, with the peak at -1 dBFS or lower.
4. Encode to MP3 (VBR). An effect of 0.5 s is about 5 KB.

| Length class | Seconds | RMS target |
| --- | --- | --- |
| short | 0.03 to 1.5 | -16 dBFS |
| medium | 0.2 to 4 | -16 dBFS |
| long | 0.5 to 12 | -17 dBFS |
| loop | 8 to 90 | -26 dBFS |
| music | 20 to 300 | -18 dBFS |

The tool refuses a take that is outside its class, a span that another take (of any row) uses, more than
`takes + 2` takes for a row, and an entry without CC0. When an entry description names attribution
or a third-party source (for example freesound.org), the tool stops until the agent reads the
description and repeats the take with `--checked` and a `--note`. The span check compares the
file name without its extension, so a second path or a second format of one file is the same sound.

## Content rules

The audience is grades 3 to 6, rated G. No gore or blood sounds, no realistic screams of pain or
fear, no crying, no guns or modern weapons, no spoken words in any language (voices are
non-verbal), and no horror-level sounds. Monsters and undead sound silly or dramatic, not
frightening. The style is warm, clear cartoon fantasy.

## Review

The agents cannot hear the files. They choose by title, tags, description, file name, length,
and the sound spans that `probe` finds. The owner listens to every take.

1. Run `node scripts/sfx-library.mjs review`. The server listens on 127.0.0.1 only.
2. Open http://127.0.0.1:4178/ in Chrome. The page is local; no data goes to a remote service.
3. Play each take and press Approve or Reject. Type a note on a row to ask for a different sound.
4. Press Submit. The server writes the submission to `out/audio-review/submissions/` and applies it.

When the server applies a submission, it removes each rejected take and logs its source span in
`audio/review.tsv`. The tool refuses that span later, and it never gives that take number again.
Approvals go to the same log, and notes go to `audio/review-notes.tsv`. The `rows` command shows
the notes to the agents. The page loads new takes every 15 seconds, while no sound plays.
`drop <id> <take>` removes a take by hand.

Two agents can write to the same manifest. Each manifest write takes a lock directory
(`<manifest>.lock`), so one write cannot remove a row of the other write.

## Game use (later)

The games keep the synthesized AudioBus sounds until an integration track maps each game event
to a row, chooses the format (MP3 plays in every target browser), and sets a preload budget for
old phones.
