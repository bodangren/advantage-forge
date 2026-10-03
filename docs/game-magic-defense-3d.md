# Magic Defense (2D and 3D): game design

Status: rewrite, 2026-10-03. Source: the monorepo cartridge
`../reading-advantage-monorepo/packages/game-cartridges/src/magic-defense.ts` (and its test)
and the matching advantage-games originals.

## 1. The game in one paragraph

Enemy casters stand in front of three castles in the Sunken Vault. A missile falls on one castle
and shows a Thai meaning. The card offers English spell words. The student taps the word with that
meaning, and the Wizard breaks the missile with a counter spell. A wrong word fails, and the
missile hurts its castle.

## 2. What stays from the legacy game

| Legacy | Now |
| --- | --- |
| a falling missile carries a Thai meaning | the missile label over the casting enemy and the card show the meaning |
| choose the English answer from 3 choices | 3 spell words (2 in Helper mode) |
| 3 castles with 3 health each | 3 castles with 3 hearts each (2 castles in Helper mode) |
| a wrong answer hurts the target castle | the missile hits its castle (-1 heart) |
| mana +10 per right answer; a full meter calls the storm | the same; the storm mends every castle |
| score 100 per right answer | coins: 10 per right word, +5 per word in a row, up to +25 |

## 3. What changes (owner rules)

- No game over and no timer. The legacy 60 s timer, the 8 s fall, the spawn timer, the
  castles-fallen defeat, and the typing mode are gone. When every castle has fallen, the heroes rest
  and the castles stand again with full hearts.
- The storm no longer clears falling missiles (none fall by themselves). It mends all castles.
- A failed spell word shuts for the same missile, so a student cannot tap at random without limit.
  The right word never shuts.
- A fallen castle is not a target again until the rest.
- Speed never gives XP. The score is coins.

## 4. Rules (core)

- Commands: `start`, `cast(choice)`, `storm`.
- Events: `waveAppeared`, `roundShown`, `cast`, `scored`, `castleHit`, `rest`, `stormCast`,
  `waveCleared`, `rejected`, `victory`.
- Waves of about 5 words (spread evenly). The whole formation falls at the end of a wave.
- Evidence: one `word` item per story word. `attempts` = spells chosen while the word was the
  missile; `correctFirstTry` = the first spell was the right word.
- Bot: `qc/bot.ts` casts the right word.

## 5. Screens

- 3D: the shared battle stage (`src/games/shared/battle`). Castle i is guarded by hero i (Knight,
  Wizard, Cleric) and faced by caster i (skeleton or mimic). The HTML label over the caster shows
  the meaning; the card holds the meaning and the spell buttons; the status bar shows the hearts
  of each castle and the Storm button.
- 2D: Phaser `BattleStage2D`; the label is a Phaser tag, the spell buttons are on `Card2D`, and
  the storm is an icon in the status bar.
- One event driver (`view/driver.ts`) plays the core events for both views.
