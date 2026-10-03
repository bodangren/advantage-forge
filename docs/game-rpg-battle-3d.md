# RPG Battle (2D and 3D): game design

Status: rewrite, 2026-10-03. Source: the monorepo cartridge
`../reading-advantage-monorepo/packages/game-cartridges/src/rpg-battle.ts` and the advantage-games
originals (`rpgBattle*.ts`, `components/games/vocabulary/rpg-battle/`).

## 1. The game in one paragraph

The Knight, the Wizard, and the Cleric face monsters in the Sunken Vault. A hand of three word
cards shows on the card. Each card has a word, an action (Slash, Blaze, Mend), and a power (basic
or ★ power). The student plays a card and chooses the meaning of its word. A right answer casts the
card: its hero strikes. A wrong answer sends the card back to the hand and the monster strikes.

## 2. What stays from the legacy game

| Legacy | Now |
| --- | --- |
| a word decides a hero's action; the action has a power (basic or power) | the same: each word is a card with an action and a seeded power |
| power actions deal more damage (18 against 10) | a power card hits for 2, a basic card for 1 |
| a streak of right answers adds to the attack | a streak adds coins (+5 per answer in a row, up to +25) |
| the enemy counterattacks | the monster strikes after a wrong answer |
| the battle ends when the enemy falls | the run is won when every word is cast |

## 3. What changes (owner rules)

- No game over. A wrong answer costs 1 courage; at 0 the team rests and returns with 3 (as in
  Monster Encounters). No health bar can end the run.
- No timer. The legacy feedback lock and the typed-answer mode are gone; the answer is a choice
  of 4 meanings (3 in Helper mode).
- Speed never gives XP. The score is coins (cards, power, streak). XP is the apps' rule.
- A word returns until it is right: every word is cast once, so the evidence has one `word` item
  per story word (`attempts`, `correctFirstTry`, `solved`).

## 4. Rules (core)

- Hand: the first 3 words not cast yet, in a seeded order. The actions come in turn (slash, blaze,
  mend), so a hand shows variety. Power is seeded per word (40 percent).
- Commands: `start`, `play(cardId)`, `cancel` (put the card back, no attempt), `answer(optionId)`.
- Cast: the hero of the action strikes. A mend card gives 1 courage back; a power card gives 1
  more. A wrong answer marks the card as a retry.
- Monsters: skeleton, mimic, fire dragon. A monster has the damage of its group of 4 words as HP
  (the dragon takes every word after 8). A blow beyond the HP of a monster carries to the next
  one, so the last card takes the last hit point.
- Bot: plays the first card of the hand and answers with its word (`src/games/rpg-battle/qc/bot.ts`).

## 5. Screens

- 3D: the shared Sunken Vault battle stage (`src/games/shared/battle`); the hand and the question
  are HTML on the kit card (Thai stays crisp). A power card has a gold border.
- 2D: Phaser `BattleStage2D` with the baked vault hall and the `primary-chibi-2d` sprites; the hand
  and the question are on `Card2D`. A back button returns the card.
- One event driver (`view/driver.ts`) plays the core events for both views.
