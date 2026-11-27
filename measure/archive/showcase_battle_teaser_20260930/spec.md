# Chibi Quest battle teaser videos

## Purpose

Make a 45-second teaser that shows how many Chibi Quest characters exist: the enemy horde,
the heroes, and their charge. Deliver a 16:9 and a 9:16 version from one choreography.

## Owner decisions (2026-09-30)

- Chibi Quest is branded for Primary Advantage and Tutor Advantage.
- On-screen numbers: 68 kinds of enemies (54 at first; owner update 2026-09-30) and 15 heroes. The necromancer is an enemy.
- Music is the Reading Advantage jingle. The voice is Thai TTS from `mmx speech`
  (`Thai_Optimistic_girl`, `speech-2.8-hd`).
- The key light is never behind the subject.

## Scope

- The storyboards in [docs/guild-battle-teaser.md](../../../docs/guild-battle-teaser.md).
- A new page and scripts beside the existing showcase: `battle.html`, `src/showcase/battle/`,
  `scripts/battle.ts`, `scripts/battle-audio.ts`.
- Output in `out/battle/`.

## Exclusions

- No change to the existing tour (`showcase.html`, `src/showcase/main.ts`, `script.ts`,
  `scripts/showcase*.ts`).
- No change to asset sources or to other tracks' files.
- No publication. The owner reviews the videos and the Thai voice-over first.

## Acceptance criteria

- Both videos render at 30 fps with sound: 1920 x 1080 and 1080 x 1920, 45 s each.
- Every enemy model with a GLB appears in the horde; at least 68 kinds are on screen.
- Text in the 9:16 version stays inside the Reels safe band.
- No sun-behind-subject shots in the army sections.
- The end card names Primary Advantage and Tutor Advantage and gives no launch date.
- Contact sheets of both videos are reviewed and recorded in the plan.
