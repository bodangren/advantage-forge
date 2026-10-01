# Chibi Quest battle teaser videos

Status: in progress. The plan records execution state. The storyboard document retains design detail.

## Phase 1: Storyboards

- [x] Task: Save both storyboards with the owner decisions in `docs/guild-battle-teaser.md`.

## Phase 2: Page and choreography

- [x] Task: Generate the roster and build the battlefield page with both formats.
  - `scripts/battle.ts roster`: 15 heroes, 58 enemies, 8 monsters; frozen copy in `out/battle/cast/`.
    Not committed at copy time (crowd only, no close-ups): banshee, highwayman, living-statue,
    mercenary, ogre-brute, plague-bearer, raider, wood-golem.
  - The page loads all 172 units (50 heroes, 121 horde, 1 slime) in about 4 minutes.
- [x] Task: Write the shared choreography and both shot lists; review stills of every shot.
  - Reviewed 16:9 stills at 3.0, 8.0, 14.5, and 17.0 s: title, horde front (front light, counter,
    name tags) are good. S3 ends too high: the horde reads small and flat; lower and closer.
  - 2026-09-30 08:40: the still run for the other shots was stopped by Claude Code because the
    system was low on memory (concurrent `forge all` builds). Not restarted, as instructed.
  - 2026-09-30 11:10: owner update: 68 enemy kinds (was 54). `ENEMY_KINDS = 68`; the repo has
    69 enemy models with a GLB. S3 end moved lower and closer: (11, 5.8, 13), was (7.5, 10.5, 15).
    The cast must be copied again after witch, evil-priest, and cult-leader finish.
  - 2026-09-30 11:33: cast copied again (15 heroes, 69 enemies, 8 monsters; 92 GLBs, all valid).
    Crowd only: living-statue, ogre-brute, wood-golem. The page loads 69 enemy kinds.
  - 2026-09-30 12:30: reviewed stills of every shot in both formats (18 in 16:9, 30 in 9:16).
    Counter reads "ศัตรู 68 แบบ"; S3 is good. Fixes, all checked with new stills:
    - S2 and S4 moved past the end of the front rank; the last 1-2 s showed an empty field. The
      trucks now stop at the rank ends (S2 z -7.5 to 2.6, S4 z -6.2 to 1.3; were -9.5 to 9.5).
    - 9:16 parade: the Orc Warlord covered the Giant Spider and the Ghoul; a front-rank hat
      covered the Mage and the Archer. A portrait now hides the units in the camera's lane
      (`Shot.hide`), and all ranks use the same close framing.
    - 9:16 Ghost: its name tag overlapped the counter. The Ghost now sits higher in the frame.
    - End card: the card covered the slime's face. 16:9 looks right of the slime (look x 2.2);
      9:16 card moved up (top 33%, was 39.5%) and the camera tilts up (look y 2.1, was 0.95).

## Phase 3: Sound

- [x] Task: Generate the Thai voice-over with mmx and mix it with the jingle and sound effects.
  - `out/battle/vo/vo1..vo5.mp3` and `out/battle/soundtrack.wav` (-13 LUFS). Not yet reviewed by ear.
  - 2026-09-30 11:10: vo2 made again for 68 ("ศัตรูหกสิบแปดแบบ รอท้าทายอยู่ค่ะ", 3.84 s); the
    54 take is in `out/battle/vo-archive/`. Soundtrack rebuilt: -13.0 LUFS, peak -1.5 dBFS.

## Phase 4: Record and review

- [x] Task: Record the 16:9 and 9:16 videos and review contact sheets of both.
  - The first 16:9 run in a Claude background task stopped at the 2 h limit (frame 240 of
    1350): the forge builds made it slow (up to 14.9 s per frame). The owner recorded both
    formats in a terminal.
  - 16:9: `out/battle/chibi-quest-battle-16x9.mp4` (17:07), 1920 x 1080, 1350 frames, 45.0 s, AAC.
  - 9:16: `out/battle/chibi-quest-battle-9x16.mp4` (19:29), 1080 x 1920, 1350 frames, 45.0 s, AAC.
  - `sheet-16x9.png` and `sheet-9x16.png` agree with the still review; no new defects.
  - Open: the owner listens to the audio and checks the Thai (voice-over, counters, end card,
    and the publishing copy).
- [x] Task: Title, description, and thumbnail.
  - Copy: `docs/guild-battle-teaser.md`, "Publishing" (v1.2).
  - Thumbnail: `out/battle/thumb-16x9.jpg` (1280 x 720, 0.32 MB): the leap at 36.15 s from a
    closer camera, with the leaders turned toward it (`?cam=...&turn=30,65`), and the dressing
    from `thumb.html`.
  - Reels cover: `out/battle/thumb-9x16.jpg` (1080 x 1920, 0.51 MB), made from the same still
    (no second 3D render): the orc warlord above a diagonal cut, the knight below it.
- [ ] Task: Owner review of the audio and the Thai text (voice-over, counters, end card, and the
  publishing copy). (Added 2026-10-02: the open item of the recording task, as a task.)
