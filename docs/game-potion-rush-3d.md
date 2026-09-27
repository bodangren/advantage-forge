# Potion Rush 3D: game design

Status: design, 2026-09-27 (Claude, FRONTEND). The rules core follows this document (task 15 of
`docs/apk3d-cartridge.md`, BACKEND). Source game: `../advantage-games/src/store/usePotionRushStore.ts`
and `src/components/games/sentence/potion-rush/`.

## 1. The game in one paragraph

The student is the alchemist (the Wizard hero, in the student's unlocked colors) behind three
cauldrons in a busy potion shop. Customers come to the counter, one for each cauldron, and each
customer orders a sentence from the story. Word ingredients float past on an enchanted conveyor.
The student drags the words into the customer's cauldron in the order of the sentence. When the
sentence is complete, the potion glows, and the student taps it to serve the customer. The shift
ends when every order is served.

## 2. What stays from the 2D game

| 2D rule | 3D |
| --- | --- |
| 3 cauldrons, each bound to 1 customer spot | the same; cauldron `i` stands in front of counter spot `i` |
| customers arrive at an interval (patience / 3) | the same interval, from the seed |
| the belt carries only words of open orders (the active word pool) | the same: every open order can always be completed |
| a belt item that leaves the belt returns its word to the pool | the same |
| the first word starts the brew; each next word must be the next word of the sentence | the same (case-insensitive) |
| a complete potion is served with a tap | the same |
| points = the customer's remaining patience | the same, as coins (`score`); never XP |
| the belt speeds up 10% for each served order | 8% for each order, at most +40% |

## 3. What changes (owner decisions and the reading guardrails)

| 2D | 3D | Why |
| --- | --- | --- |
| an angry customer costs 25 reputation; 0 reputation is game over | a customer whose patience runs out sits down at a table ("I will wait here"); the order goes back to the queue, and the customer comes back later. No reputation, no game over | owner decision: no loss, no game over |
| a wrong word puts the cauldron in a warning state; the student must dump it | the cauldron puffs green smoke, and the word jumps back onto the belt. No dump step | grades 3 to 6: one clear rule |
| the day ends after 100 s | the shift ends when every order is served (the story's sentences, 6 to 8, each once) | a clear goal; about 3 to 5 minutes |
| patience shrinks 10% per order | patience never goes below 45 s | slow readers can always finish |
| difficulty easy to extreme | no difficulty setting; Helper mode (below) | owner decision |

Excitement (the genre is time management, so the shop must feel busy):

- **Rush hour:** when 3 customers wait at the same time, the music speeds up, the sign over the
  door flashes "Rush!", and coins for that time are doubled.
- **Moods:** each customer shows a mood bubble: 😊, then 😐 at half patience, then 😤 at a
  quarter (the character plays its `talk`, `taunt`, or `roar` clip). Moods change only the look.
- **Combo:** correct words in a row add sparkles to the cauldron, and the "plop" sound rises in
  pitch. A wrong word resets the combo.
- **Tips:** a customer served while 😊 drops extra coins that fly into the tip jar.

Speed never changes XP, stars, or the evidence (section 7).

## 4. Screen and camera

Portrait 390 x 844 (the first target); the whole screen is the 3D shop, with HTML labels on top.

```
+----------------------------------+
| Served 2/7   🪙 34    📖   🔊     |  status bar (safe area)
|                                  |
|   [order]    [order]   [order]   |  order bubbles over the customers
|    (cust)     (cust)    (cust)   |  counter, shelves, fireplace behind
|  ==========counter=============  |
|    (pot 1)    (pot 2)   (pot 3)  |  cauldrons with a word count: "is  2/3"
|                                  |
|  <- [Pip.] <- [is] <- [This] <-  |  the conveyor: words on ingredients
|          (alchemist, back)       |
+----------------------------------+
```

- Camera: behind and above the alchemist, looking at the counter (`ShotRig`); the conveyor is at
  the bottom, near the thumb. The words ride right to left, the reading direction reversed on
  purpose: the first words of a sentence reach the student first.
- Landscape: the same shot, wider field of view; the status bar stays at the top.
- Word labels are HTML (anchored to the items with `HudRoot.anchor`), 22 px or more, white on a
  dark rounded tag, so they read on a phone.
- The order bubble shows the English sentence. In Helper mode, the next word of each brewing order
  glows, and belt items with that word glow too. A translation line shows when the story has
  one (the APK content has translations; the demo stories do not).

## 5. Controls

- **Drag** a word from the conveyor onto a cauldron (`makeDraggable`; the drop target is the
  cauldron's screen circle plus 24 px).
- **Tap** a word: it flies into the cauldron that needs it next, if exactly one cauldron needs it;
  otherwise it pulses and waits for a drag. Small hands and trackpads can play with taps only.
- **Tap** a glowing potion (or its customer) to serve it.

## 6. Scene and models

| Part | Model | Notes |
| --- | --- | --- |
| alchemist | `wizard` (+ the student's preset) | `attack2` to stir after each word; `victory` at the end |
| customers | `farmer`, `villager`, `innkeeper`, `guard`, `druid`, `orc-warrior`, `goblin-warrior`, `skeleton` | walk in, `talk` to order, `wave` or `salute` to thank, `taunt` or `roar` for 😤 |
| cauldrons | `cauldron` x 3 | a bubbling liquid disk and a colored glow per brew (kit geometry) |
| counter and room | `counter`, `shelf`, `bottle`, `fireplace`, `candle-cluster`, `workbench`, `crate`, `barrel`, `sack`, `wood-floor`, `plaster-wall*`, `timber-wall`, `round-table`, `stool`, `lantern` | a small room, placed in `src/games/potion-rush/view/shop.ts` |
| ingredients on the conveyor | `bottle`, `mushroom`, `apple`, `pumpkin`, `crystal-cluster`, `bread` | scaled to about 0.25 m |
| conveyor | kit geometry: two dark wood rails and a glowing rune strip that scrolls | no new forge asset for the demo |

The `potion-shop` pack holds the room, the cauldrons, the ingredients, and the customers; the
`heroes` pack gives the alchemist. First load stays inside the 4 MB budget: the customers load
after the first order.

## 7. Rules core (task 15) and evidence

Commands in, events out (`Simulation` in `src/apk3d/sim`); positions on the conveyor are 0 to 1
(1 = the right end), so the view maps them onto its 3D path.

| Command | Meaning |
| --- | --- |
| `{ type: 'drop', itemId, cauldron }` | a word into a cauldron (a drag or a tap) |
| `{ type: 'serve', cauldron }` | serve a complete potion |

| Event | Payload |
| --- | --- |
| `customerArrived` | slot, customerId, kind, sentenceId |
| `itemSpawned` / `itemLeft` | itemId, word, ingredient kind |
| `wordAccepted` | cauldron, itemId, index, combo |
| `wordRejected` | cauldron, itemId (the item returns to the belt) |
| `potionReady` | cauldron |
| `potionServed` | cauldron, customerId, coins, tip, rush |
| `moodChanged` | slot, mood (`happy`, `waiting`, `grumpy`) |
| `customerSatDown` / `customerReturned` | slot, customerId |
| `rushStarted` / `rushEnded` | |
| `shiftComplete` | served, coins |

Evidence (`storyGameEvidenceSchema`): one item per sentence, `itemKind: 'sentence'`,
`attempts` = wrong words for that order + 1, `correctFirstTry` = no wrong word, `solved` = served.
A student who leaves early sends outcome `complete` with the items served so far.
Results: XP by the apps' rule, `score` = coins, stars from first-try accuracy.

Tuning (constants in the core): belt speed 0.09 of the belt per second (+8% per order, at most
+40%; Helper mode 25% slower), spawn every 2.1 s, patience 60 s (at least 45 s), 3 slots, shift of
up to 8 orders, rush when 3 slots wait.
