# Chibi Quest battle teaser videos

Status: in progress. The plan records execution state. The storyboard document retains design detail.

## Phase 1: Storyboards

- [x] Task: Save both storyboards with the owner decisions in `docs/guild-battle-teaser.md`. Commit 421debdf.

## Phase 2: Page and choreography

- [x] Task: Generate the roster and build the battlefield page with both formats. Commit 421debdf.
  - `scripts/battle.ts roster`: 15 heroes, 58 enemies, 8 monsters; frozen copy in `out/battle/cast/`.
    Not committed at copy time (crowd only, no close-ups): banshee, highwayman, living-statue,
    mercenary, ogre-brute, plague-bearer, raider, wood-golem.
  - The page loads all 172 units (50 heroes, 121 horde, 1 slime) in about 4 minutes.
- [x] Task: Write the shared choreography and both shot lists; review stills of every shot. Commit 421debdf.
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
  - Evidence 2026-11-27: `src/showcase/battle/script.ts` holds the shared choreography and both
    shot lists. `docs/guild-battle-teaser.md` names that file in its files table. The stills are
    `out/battle/frames/16x9-t<seconds>.png` (18) and `out/battle/frames/9x16-t<seconds>.png` (30).
    The contact sheets are `out/battle/sheet-16x9.png` and `out/battle/sheet-9x16.png`. Commit
    `421debdf` shipped the choreography, the shot lists, and the documents. The v1.1 changelog
    entry records the still-review fixes.

## Phase 3: Sound

- [x] Task: Generate the Thai voice-over with mmx and mix it with the jingle and sound effects. Commit 421debdf.
  - `out/battle/vo/vo1..vo5.mp3` and `out/battle/soundtrack.wav` (-13 LUFS). Not yet reviewed by ear.
  - 2026-09-30 11:10: vo2 made again for 68 ("ศัตรูหกสิบแปดแบบ รอท้าทายอยู่ค่ะ", 3.84 s); the
    54 take is in `out/battle/vo-archive/`. Soundtrack rebuilt: -13.0 LUFS, peak -1.5 dBFS.

## Phase 4: Record and review

- [x] Task: Record the 16:9 and 9:16 videos and review contact sheets of both. Commit 421debdf.
  - The first 16:9 run in a Claude background task stopped at the 2 h limit (frame 240 of
    1350): the forge builds made it slow (up to 14.9 s per frame). The owner recorded both
    formats in a terminal.
  - 16:9: `out/battle/chibi-quest-battle-16x9.mp4` (17:07), 1920 x 1080, 1350 frames, 45.0 s, AAC.
  - 9:16: `out/battle/chibi-quest-battle-9x16.mp4` (19:29), 1080 x 1920, 1350 frames, 45.0 s, AAC.
  - `sheet-16x9.png` and `sheet-9x16.png` agree with the still review; no new defects.
  - Open: the owner listens to the audio and checks the Thai (voice-over, counters, end card,
    and the publishing copy).
- [x] Task: Title, description, and thumbnail. Commit 421debdf.
  - Copy: `docs/guild-battle-teaser.md`, "Publishing" (v1.2).
  - Thumbnail: `out/battle/thumb-16x9.jpg` (1280 x 720, 0.32 MB): the leap at 36.15 s from a
    closer camera, with the leaders turned toward it (`?cam=...&turn=30,65`), and the dressing
    from `thumb.html`.
  - Reels cover: `out/battle/thumb-9x16.jpg` (1080 x 1920, 0.51 MB), made from the same still
    (no second 3D render): the orc warlord above a diagonal cut, the knight below it.
- [x] Task: Remove future wording; re-render; replace in Drive (PM 2026-11-27).
  - Source after the owner said the teaser claimed a launch that is already live. Commits on
    master: `39a77fe0` (docs, plan, `main.ts`, `thumb.ts`, `timeline.ts`), `b1f240a5`
    (`docs/showcase.md`, `scripts/showcase.ts`, `src/showcase/script.ts`), and `26e68494`
    (regenerated status). Branch `teaser-live` has no commit that is not on master.
  - PM check before the upload: voice at 38.5 s transcribed "เล่นได้แล้ว ใน ไพรมารี แอดแวนเทจนะคะ";
    end card and both thumbnails read "เล่นได้แล้ว"; no "เร็ว ๆ นี้" and no "soon".
  - Drive upload in place, md5 sums match the local files. Ids `1bPS-jxeSzgGchx8EywHyUBYXAJKpI7R2`,
    `17o-yXfT0zavH6hkJkMFsNwv24pFVSP6r`, `1Zj_liKv1lu9vIbS8imJkP4wTviYpa58y`,
    `15yVh-Ip3BjmT3V6jxI26McmMU5nLTZ5I`. REVIEW doc `1VeOyvw5rSKh1yT1cDEBNefa-G3ElDUXxVxHcl7EbT-0`.
  - Local sources (sha256): `vo5.mp3` `fb25c4e53671734e67e320240478c0ec8b47d20667cda83ffc78b7ee7d785fcf`
    (65,652 B); `soundtrack.wav` `dc936d60c6118a01b12782e71123208096da3a807d8e0a23d1680ba97d11849e`
    (7,938,078 B).
  - Rendered files in `teaser-live/out/battle/`, sha256 and size:
    - `chibi-quest-battle-16x9.mp4` `0724bfb161841c99f0754e2ae85f782064ef7d1e273c38d2a6fffa2a71794416`
      (69,381,973 B).
    - `chibi-quest-battle-9x16.mp4` `3f88dcc6b4eeec3e49f7ac2c3e86290f391f75286c6cb3318035ca85305f833a`
      (50,493,249 B).
    - `chibi-quest-battle-16x9.silent.mp4`
      `8b4851199642bf68392ec25378b7e96778a142358587a58daa108d69ce124422` (68,254,673 B).
    - `chibi-quest-battle-9x16.silent.mp4`
      `b8e9dc4bfa58e4913c71146642c2a7b7b52df899f48cdf7c3bc586d93ac6a915` (49,365,741 B).
- [~] Task: Owner review of the audio and the Thai text (voice-over, counters, end card, and the
  publishing copy). (Added 2026-10-02: the open item of the recording task, as a task.)
  2026-11-27: the live wording is in the media and in Drive. Only the Thai check waits.
- [b] Thai check of the new wording. Owner: Daniel. deferred:thai Task Zks3LWVIbk1mQmFTX0NNNQ.
- [ ] Task: Publish the teaser after the owner passes the audio and Thai check. The copy waits in
  `docs/guild-battle-teaser.md` ("Publishing").
