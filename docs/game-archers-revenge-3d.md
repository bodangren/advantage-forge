# Archer's Revenge (2D and 3D): game design

Status: rewrite, 2026-10-03. Source: the monorepo cartridge
`../reading-advantage-monorepo/packages/game-cartridges/src/archers-revenge.ts` (and its test)
and the matching advantage-games originals.

## 1. The game in one paragraph

A formation of enemies stands in the Sunken Vault. Each enemy hides behind a shield that shows an
English word. The card shows one Thai meaning. The student taps the word with that meaning, and the
archer (the Wizard) shoots that enemy. A right arrow breaks the shield. A wrong arrow bounces off.

## 2. What stays from the legacy game

| Legacy | Now |
| --- | --- |
| a Thai target above a formation of enemies with English words | the same: the card shows the meaning, the shields show the words |
| one enemy is open, the others are shielded distractors | one lane carries the right word, the other lanes carry other words |
| aim a column, fire an arrow | tap a word: the archer aims at that lane and shoots |
| a shielded hit makes the enemy fire back | a wrong arrow bounces off, and the enemy strikes (courage -1) |
| waves of 15 enemies | waves of about 5 words (spread evenly); the whole formation falls at the end |

## 3. What changes (owner rules)

- No game over and no timer. The legacy formation descent, the enemy shots in flight, the target
  rotation timer, the hit points, and the defeat phase are gone. Courage at 0 means the team rests
  and returns with 3.
- Lanes: 3 on the shared battle stage (it has 3 monster spots), 2 in Helper mode. Legacy had 5
  columns.
- A wrong arrow shuts its lane for the same meaning, so a student cannot tap at random without
  limit. The right lane never shuts.
- Speed never gives XP. The score is coins (10 per hit, +5 per right arrow in a row, up to +25).

## 4. Rules (core)

- Commands: `start`, `fire(lane)`.
- Events: `waveAppeared`, `roundShown`, `shot`, `scored`, `enemyStrike`, `rest`, `waveCleared`,
  `rejected`, `victory`.
- Evidence: one `word` item per story word. `attempts` = arrows shot while the word was the prompt;
  `correctFirstTry` = the first arrow hit the right lane.
- Bot: `qc/bot.ts` shoots the lane that carries the prompt's word.

## 5. Screens

- 3D: the shared battle stage (`src/games/shared/battle`); skeletons and mimics alternate by lane. The
  word shields are HTML labels anchored over the enemies (Thai stays crisp); the card holds the
  meaning and one button per lane.
- 2D: Phaser `BattleStage2D`; shields are Phaser tags over the sprites; the meaning and the lane
  buttons are on `Card2D`.
- One event driver (`view/driver.ts`) plays the core events for both views.
