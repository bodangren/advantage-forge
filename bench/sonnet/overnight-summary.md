# Sonnet 5.5 orchestration summary

Generated from bench/sonnet/log.tsv on 2026-10-01. One row per asset; passes count every logged pass (builds, feedback passes, reworks, orchestrator edits); tokens are the subagent tokens of those passes.

Assets: 176. Accepted: 169. Skipped: 6. Other (deferred or open): 1. Subagent tokens: 19,736,377.


## Batch 1: the 20 open queue rows (2026-09-29 to 09-30)

The goal's queue (bench/overnight/queue.tsv and queue-hold.tsv, ivy and farmhouse already done). Sources are committed on 2026-09-29 unless noted; tokens are the subagent tokens of every logged pass.

| asset | tier | passes | tokens | score | bar | result |
|---|---|---|---|---|---|---|
| greenhouse | medium | 2 | 68,372 | 7.2 | 7 | accepted (1ca8311) |
| yurt | medium | 2 | 52,936 | 7.5 | 7 | accepted (7af3a6c) |
| pier | medium | 1 | 46,021 | 7.0 | 7 | accepted (8f99088) |
| cave-mouth | medium | 2 | 43,525 | 7.0 | 7 | accepted (8f99088) |
| city-wall | medium | 2 | 67,065 | 7.0 | 7 | accepted (6344cdc) |
| rampart | medium | 2 | 59,945 | 7.0 | 7 | accepted (47db000) |
| greenhouse-dome | medium | 1 | 38,863 | 7.3 | 7 | accepted (3aa7bae) |
| cliff-face | medium, then high | 4 | 126,344 | 6.5 | 7 | skipped |
| ancient-tree | medium | 2 | 51,069 | 7.0 | 7 | accepted (421c1e6) |
| roots | medium | 4 | 68,164 | 7.0 | 7 | accepted (72a4f9c) |
| watermill | medium | 2 | 63,626 | 7.3 | 7 | accepted (421c1e6) |
| cloth-robe | low | 3 | 43,589 | 7.0 | 7 | accepted (7af3a6c) |
| mantle | low, then medium | 3 | 80,751 | 7.0 | 7 | accepted (7af3a6c) |
| townhouse | medium | 1 | 49,637 | 7.3 | 7 | accepted (99d32a0) |
| longhouse | medium | 1 | 54,161 | 7.0 | 7 | accepted (72a4f9c) |
| crypt-chapel | medium | 1 | 48,362 | 7.3 | 7 | accepted (bab55d5) |
| scale-armor | medium | 3 | 62,168 | 7.3 | 7 | accepted (4c18eb9) |
| studded-leather | medium | 4 | 52,870 | 7.0 | 7 | accepted (e695565) |
| vines | medium | 1 | 43,535 | 7.2 | 7 | accepted (f46e543) |
| plate-armor | medium | 2 | 67,780 | 7.5 | 7 | accepted (e695565) |

Batch 1 result: 19 of 20 accepted, 1 skipped (cliff-face at 6.5 after a medium build, two feedback passes and a fresh high rework: the grass cap and ledge mats stayed plain, and the textured build reduced the rock to 302 triangles while the fast build reported 5,350; the rock body is usable, source left uncommitted). Batch 1 subtotal: 1,188,783 tokens. The queue then emptied and the run continued with the P1 enemies by game need (runs 2 and 3), the equipment fits, the static rework wave, the P2 items, the P3 vehicles and the 32 P1 heroes (run 4), all in the tables above.

## Per batch

| batch | assets | accepted | tokens |
|---|---|---|---|
| 1 | 7 | 7 | 570,668 |
| 2 | 4 | 4 | 216,556 |
| 3 | 4 | 3 | 284,440 |
| 4 | 4 | 4 | 215,786 |
| 5 | 4 | 4 | 226,353 |
| fit1 | 4 | 4 | 146,064 |
| fit2 | 4 | 4 | 146,488 |
| fit3 | 2 | 2 | 61,866 |
| E1 | 4 | 3 | 801,043 |
| R1 | 3 | 2 | 262,386 |
| enemies | 1 | 1 | 130,217 |
| run2 | 19 | 19 | 3,086,953 |
| run3 | 18 | 17 | 3,845,376 |
| run4 | 98 | 95 | 9,742,181 |

## Per asset

| asset | class | tier | batch | passes | tokens | score | bar | result |
|---|---|---|---|---|---|---|---|---|
| farmhouse | structure | medium | 1 | 3 | 55,739 | 7.5 | 7 | accepted |
| ivy | plant | medium | 1 | 3 | 80,592 | 7.5 | 7 | accepted |
| samurai | hero | high | 1 | 2 | 188,689 | 8.2 | 8 | accepted |
| mantle | armor | medium | 1 | 3 | 80,751 | 7.0 | 7 | accepted |
| cloth-robe | armor | low | 1 | 3 | 43,589 | 7.0 | 7 | accepted |
| yurt | structure | medium | 1 | 2 | 52,936 | 7.5 | 7 | accepted |
| greenhouse | structure | medium | 1 | 2 | 68,372 | 7.2 | 7 | accepted |
| cave-mouth | terrain | medium | 2 | 2 | 43,525 | 7.0 | 7 | accepted |
| pier | structure | medium | 2 | 1 | 46,021 | 7.0 | 7 | accepted |
| city-wall | structure | medium | 2 | 2 | 67,065 | 7.0 | 7 | accepted |
| rampart | structure | medium | 2 | 2 | 59,945 | 7.0 | 7 | accepted |
| greenhouse-dome | structure | medium | 3 | 1 | 38,863 | 7.3 | 7 | accepted |
| ancient-tree | plant | medium | 3 | 2 | 51,069 | 7.0 | 7 | accepted |
| roots | plant | medium | 3 | 4 | 68,164 | 7.0 | 7 | accepted |
| watermill | structure | medium | 4 | 2 | 63,626 | 7.3 | 7 | accepted |
| cliff-face | terrain | high | 3 | 4 | 126,344 | 6.5 | 7 | skipped |
| townhouse | structure | medium | 4 | 1 | 49,637 | 7.3 | 7 | accepted |
| crypt-chapel | structure | medium | 4 | 1 | 48,362 | 7.3 | 7 | accepted |
| longhouse | structure | medium | 4 | 1 | 54,161 | 7.0 | 7 | accepted |
| scale-armor | armor | medium | 5 | 3 | 62,168 | 7.3 | 7 | accepted |
| studded-leather | armor | medium | 5 | 4 | 52,870 | 7.0 | 7 | accepted |
| vines | plant | medium | 5 | 1 | 43,535 | 7.2 | 7 | accepted |
| plate-armor | armor | medium | 5 | 2 | 67,780 | 7.5 | 7 | accepted |
| iron-helmet | armor-fit | medium | fit1 | 1 | 32,941 | fit-ok | 7.5 | accepted |
| steel-helmet | armor-fit | medium | fit1 | 1 | 35,654 | fit-ok | 7 | accepted |
| belt | armor-fit | medium | fit1 | 1 | 36,200 | fit-ok | 7 | accepted |
| chainmail | armor-fit | medium | fit1 | 1 | 41,269 | fit-ok | 7 | accepted |
| horned-helmet | armor-fit | medium | fit2 | 1 | 33,791 | fit-ok | 7 | accepted |
| cloth-hood | armor-fit | medium | fit2 | 1 | 34,823 | fit-ok | 7 | accepted |
| leather-cap | armor-fit | medium | fit2 | 1 | 30,665 | fit-ok | 7 | accepted |
| leather-armor | armor-fit | medium | fit2 | 1 | 47,209 | fit-ok | 7.5 | accepted |
| crown | armor-fit | medium | fit3 | 1 | 34,440 | fit-ok | 7 | accepted |
| circlet | armor-fit | medium | fit3 | 1 | 27,426 | fit-ok | 7 | accepted |
| goblin-king | enemy | high | E1 | 2 | 173,443 | 8.0 | 8 | accepted |
| orc-archer | enemy | high | E1 | 3 | 186,751 | 8.0 | 8 | accepted |
| ogre-brute | enemy | high | E1 | 3 | 241,959 | 7.8 | 8 | skipped |
| orc-shaman | enemy | high | E1 | 2 | 198,890 | 8.0 | 8 | accepted |
| wood-golem | enemy-rework | high | R1 | 3 | 120,760 | 7.5 | 8 | skipped |
| minotaur-guard | enemy-rework | high | R1 | 3 | 66,143 | 8.0 | 8 | accepted |
| mummy | enemy-rework | high | R1 | 2 | 75,483 | 8.0 | 8 | accepted |
| dark-knight | character | high | enemies | 2 | 130,217 | 8.0 | 8 | accepted |
| wight | character | high | run2 | 3 | 244,384 | 8.0 | 8 | accepted |
| revenant | character | high | run2 | 2 | 192,527 | 8.0 | 8 | accepted |
| bandit-captain | character | high | run2 | 3 | 248,432 | 8.0 | 8 | accepted |
| orc-warlord | character | high | run2 | 2 | 197,402 | 8.0 | 8 | accepted |
| banshee | character | high | run3 | 5 | 330,069 | 8.0 | 8 | accepted |
| iron-golem | character | high | run2 | 2 | 118,659 | 8.0 | 8 | accepted |
| gargoyle | character | high | run2 | 2 | 143,795 | 8.0 | 8 | accepted |
| specter | character | high | run2 | 3 | 184,461 | 8.0 | 8 | accepted |
| poltergeist | character | high | run2 | 2 | 105,054 | 8.0 | 8 | accepted |
| gnoll-warrior | character | high | run2 | 2 | 206,339 | 8.0 | 8 | accepted |
| plague-bearer | character | high | run3 | 4 | 364,585 | 8.0 | 8 | accepted |
| troll-guard | character | high | run2 | 2 | 186,234 | 8.0 | 8 | accepted |
| vampire-lord | character | high | run2 | 1 | 86,474 | 8.0 | 8 | accepted |
| clay-golem | character | high | run2 | 2 | 92,817 | 8.0 | 8 | accepted |
| crystal-golem | character | high | run2 | 2 | 106,289 | 8.0 | 8 | accepted |
| kobold-sorcerer | character | high | run2 | 1 | 132,483 | 8.0 | 8 | accepted |
| living-statue | character | high | run3 | 7 | 449,923 | 7.8 | 8 | pending-owner |
| clockwork-sentry | character | high | run2 | 2 | 140,021 | 8.0 | 8 | accepted |
| gnoll-hunter | character | high | run2 | 3 | 248,492 | 8.0 | 8 | accepted |
| kobold-trapper | character | high | run2 | 2 | 142,089 | 8.0 | 8 | accepted |
| clockwork-soldier | character | high | run2 | 2 | 183,278 | 8.0 | 8 | accepted |
| animated-weapon | character | high | run2 | 2 | 127,723 | 8.0 | 8 | accepted |
| brigand | character | high | run3 | 2 | 159,379 | 8.0 | 8 | accepted |
| raider | character | high | run3 | 2 | 135,595 | 8.0 | 8 | accepted |
| highwayman | character | high | run3 | 2 | 183,899 | 8.0 | 8 | accepted |
| mercenary | character | high | run3 | 4 | 337,753 | 7.9 | 8 | accepted |
| assassin | character | high | run3 | 3 | 200,763 | 8.0 | 8 | accepted |
| deserter | character | high | run3 | 2 | 135,533 | 8.0 | 8 | accepted |
| smuggler | character | high | run3 | 2 | 169,932 | 8.0 | 8 | accepted |
| pirate | character | high | run3 | 2 | 192,894 | 8.0 | 8 | accepted |
| pirate-captain | character | high | run3 | 3 | 254,083 | 8.0 | 8 | accepted |
| hunter-rival | character | high | run3 | 2 | 171,071 | 8.0 | 8 | accepted |
| dark-mage | character | high | run3 | 2 | 133,524 | 8.0 | 8 | accepted |
| warlock | character | high | run3 | 2 | 160,331 | 8.0 | 8 | accepted |
| cult-leader | character | high | run3 | 2 | 149,634 | 8.0 | 8 | accepted |
| witch | character | high | run3 | 2 | 151,268 | 8.0 | 8 | accepted |
| evil-priest | character | high | run3 | 2 | 165,140 | 8.0 | 8 | accepted |
| silo | structure | medium | run4 | 2 | 58,346 | 7.2 | 7 | accepted |
| wall-gate | structure | medium | run4 | 2 | 83,621 | 7.3 | 7 | accepted |
| alchemist | hero | high | run4 | 3 | 178,702 | 8.0 | 8 | accepted |
| sorcerer | hero | high | run4 | 2 | 175,081 | 8.0 | 8 | accepted |
| dragoon | hero | high | run4 | 2 | 258,028 | 8.0 | 8 | accepted |
| palm-tree | tree | high | run4 | 3 | 106,801 | 7.0 | 7 | accepted |
| beast-rider | hero | high | run4 | 2 | 176,316 | 8.0 | 8 | accepted |
| giant-crystal | terrain | medium | run4 | 2 | 55,862 | 7.2 | 7 | accepted |
| warrior | hero | high | run4 | 2 | 158,393 | 8.0 | 8 | accepted |
| healer | hero | high | run4 | 3 | 238,501 | 8.0 | 8 | accepted |
| scout | hero | high | run4 | 3 | 227,098 | 8.0 | 8 | accepted |
| hunter | hero | high | run4 | 2 | 225,132 | 8.0 | 8 | accepted |
| fighter | hero | high | run4 | 2 | 154,205 | 8.0 | 8 | accepted |
| berserker | hero | high | run4 | 2 | 267,595 | 8.0 | 8 | accepted |
| summoner | hero | high | run4 | 3 | 242,582 | 7.8 | 8 | skipped |
| elementalist | hero | high | run4 | 2 | 144,262 | 8.0 | 8 | accepted |
| duelist | hero | high | run4 | 2 | 183,929 | 8.0 | 8 | accepted |
| gladiator | hero | high | run4 | 2 | 181,476 | 8.0 | 8 | accepted |
| guardian | hero | high | run4 | 3 | 230,677 | 8.0 | 8 | accepted |
| mana-potion+stamina-potion+strength-potion | item | medium | run4 | 3 | 88,827 | 7.0/7.0/7.0 | 7 | accepted |
| health-potion | item | medium | run4 | 2 | 50,231 | 7.5 | 7.5 | accepted |
| shield-maiden | hero | high | run4 | 2 | 171,919 | 8.0 | 8 | accepted |
| key-gold+key-bronze+key-skeleton | item | medium | run4 | 2 | 58,068 | 6.7 | 7 | skipped |
| key-bronze+key-skeleton | item | high | run4 | 1 | 55,516 | 6.9 | 7 | skipped |
| speed-potion+antidote+resistance-potion | item | medium | run4 | 1 | 46,044 | 7.3/7.0/7.3 | 7 | accepted |
| speed-potion+resistance-potion | item | medium | run4 | 1 | 11,218 | 7.3/7.3 | 7 | accepted |
| silver-coin+copper-coin+ancient-key | item | medium | run4 | 1 | 48,525 | 7.0/7.2/7.0 | 7 | accepted |
| invisibility-potion+elixir+poison-bottle | item | medium | run4 | 1 | 52,835 | 7.1/7.1/7.1 | 7 | accepted |
| silver-coin+ancient-key | item | medium | run4 | 1 | 11,887 | 7.0/7.0 | 7 | accepted |
| bread-ration+waterskin+coin-purse | item | medium | run4 | 1 | 53,290 | 7.0/7.0/7.3 | 7 | accepted |
| bread-ration+waterskin | item | medium | run4 | 1 | 13,934 | 7.0/7.0 | 7 | accepted |
| saw+tongs | static-rework | medium | run4 | 1 | 42,941 | 7.0/7.2 | 7 | accepted |
| gibbet | static-rework | medium | run4 | 1 | 34,180 | 7.2 | 7 | accepted |
| bellows | static-rework | medium | run4 | 1 | 41,355 | 7.3 | 7 | accepted |
| spike-trap+stalactite | static-rework | medium | run4 | 1 | 49,024 | 7.3/7.2 | 7 | accepted |
| lava-rock | static-rework | medium | run4 | 2 | 42,941 | 7.0 | 7 | accepted |
| ruin-column+stairs-stone | static-rework | medium | run4 | 1 | 44,896 | 7.3/7.5 | 7 | accepted |
| willow-tree+sand-dune | static-rework | medium | run4 | 1 | 46,209 | 7.2/7.0 | 7 | accepted |
| roof-slate+roof-thatch | static-rework | medium | run4 | 1 | 57,080 | 7.3/7.0 | 7 | accepted |
| pit-trap | static-rework | medium | run4 | 1 | 34,286 | 7.2 | 7 | accepted |
| magic-rune | static-rework | medium | run4 | 1 | 29,199 | 7.2 | 7 | accepted |
| glaive+greaves | static-rework | medium | run4 | 1 | 43,135 | 7.3/7.0 | 7 | accepted |
| fishing-pole+fishing-rod | static-rework | medium | run4 | 1 | 39,485 | 7.2/7.2 | 7 | accepted |
| amulet+mining-pick+spear | static-rework | medium | run4 | 1 | 51,250 | 7.5/7.5/7.2 | 7 | accepted |
| lute | static-rework | medium | run4 | 1 | 38,458 | 7.3 | 7 | accepted |
| staff | static-rework | medium | run4 | 1 | 35,834 | 7.2 | 7 | accepted |
| gloves+scabbard | static-rework | medium | run4 | 1 | 46,405 | 7.3/7.2 | 7 | accepted |
| grimoire+throwing-axe | static-rework | medium | run4 | 1 | 40,793 | 7.5/7.3 | 7 | accepted |
| javelin+rune-stone+sickle | static-rework | medium | run4 | 1 | 46,846 | 7.3/7.2/7.0 | 7 | accepted |
| gloves | static-rework | medium | run4 | 1 | 7,096 | 7.3 | 7 | accepted |
| earring+pendant+sling | static-rework | medium | run4 | 1 | 49,204 | 7.2/7.5/7.3 | 7 | accepted |
| sickle | static-rework | medium | run4 | 1 | 6,310 | 7.0 | 7 | accepted |
| ancient-scroll+magic-scroll+treasure-map+map-fragment | item | medium | run4 | 1 | 56,043 | 7.0/7.0/7.0/7.0 | 7 | accepted |
| wood-log+plank | item | medium | run4 | 1 | 35,014 | 7.3/7.0 | 7 | accepted |
| copper-ore+gold-ore+silver-ore | item | medium | run4 | 1 | 52,321 | 7.0/7.0/7.2 | 7 | accepted |
| treasure-map+map-fragment | item | medium | run4 | 1 | 85,633 | 7.0/7.0 | 7 | accepted |
| gem-ruby+gem-emerald+gem-sapphire+crystal-shard | item | medium | run4 | 1 | 69,246 | 7.0/7.3/7.0/7.3 | 7 | accepted |
| monster-bone+monster-claw+monster-fang+dragon-scale | item | medium | run4 | 1 | 42,451 | 7.2/7.2/7.0/7.0 | 7 | accepted |
| letter-sealed+quest-document+royal-seal+rune-tablet | item | medium | run4 | 1 | 52,150 | 7.2/7.0/7.0/7.2 | 7 | accepted |
| shell+feather+cloth+thread+wool | item | medium | run4 | 1 | 53,041 | 7.0/7.0/7.0/7.2/7.0 | 7 | accepted |
| healing-herb+herb-root+flower-petal+mushroom-cap | item | medium | run4 | 1 | 56,674 | 7.0/7.2/7.0/7.2 | 7 | accepted |
| monster-claw+dragon-scale | item | medium | run4 | 1 | 58,566 | 7.2/7.0 | 7 | accepted |
| rune-tablet | item | medium | run4 | 1 | 0 | 7.2 | 7 | accepted |
| wool | item | medium | run4 | 1 | 59,457 | 7.0 | 7 | accepted |
| flower-petal | item | medium | run4 | 1 | 64,002 | 7.0 | 7 | accepted |
| relic-orb+artifact-idol+ration | item | medium | run4 | 1 | 56,218 | 7.0/7.0/7.0 | 7 | accepted |
| leather+hide+bandage | item | medium | run4 | 1 | 48,419 | 7.0/7.0/7.2 | 7 | accepted |
| merchant-cart | vehicle | medium | run4 | 1 | 42,780 | 7.0 | 7 | accepted |
| handcart | vehicle | medium | run4 | 1 | 53,152 | 7.0 | 7 | accepted |
| caravan-wagon | vehicle | medium | run4 | 1 | 0 | 7.3 | 7 | accepted |
| rowboat | vehicle | medium | run4 | 1 | 80,728 | 7.0 | 7 | accepted |
| fishing-boat | vehicle | medium | run4 | 1 | 51,779 | 7.0 | 7 | accepted |
| covered-wagon | vehicle | medium | run4 | 1 | 39,725 | 7.2 | 7 | accepted |
| riverboat | vehicle | high | run4 | 1 | 56,219 | 7.0 | 7 | accepted |
| sleigh | vehicle | medium | run4 | 1 | 0 | 7.0 | 7 | accepted |
| flying-carpet | vehicle | medium | run4 | 1 | 34,930 | 7.2 | 7 | accepted |
| war-wagon | vehicle | medium | run4 | 1 | 40,754 | 7.0 | 7 | accepted |
| merchant-ship | vehicle | high | run4 | 1 | 69,294 | 7.0 | 7 | accepted |
| longship | vehicle | high | run4 | 1 | 135,806 | 7.3 | 7 | accepted |
| balloon-basket | vehicle | high | run4 | 1 | 38,976 | 7.5 | 7 | accepted |
| airship | vehicle | high | run4 | 1 | 42,376 | 7.0 | 7 | accepted |
| pirate-ship | vehicle | high | run4 | 1 | 99,604 | 7.3 | 7 | accepted |
| rune-smith | hero | high | run4 | 2 | 317,971 | 8.0 | 8 | accepted |
| oracle | hero | high | run4 | 2 | 263,038 | 8.0 | 8 | accepted |
| enchanter | hero | high | run4 | 2 | 284,041 | 8.0 | 8 | accepted |
| artificer | hero | high | run4 | 2 | 368,993 | 8.0 | 8 | accepted |
| spear-warden | hero | high | run4 | 2 | 220,784 | 8.0 | 8 | accepted |
| swashbuckler | hero | high | run4 | 2 | 161,921 | 8.0 | 8 | accepted |
| apprentice | hero | high | run4 | 3 | 146,528 | 8.0 | 8 | accepted |
| shaman | hero | high | run4 | 2 | 31,832 | 8.0 | 8 | accepted |
| captain | hero | high | run4 | 2 | 156,587 | 8.0 | 8 | accepted |
| caravan-guard | hero | high | run4 | 3 | 186,963 | 8.0 | 8 | accepted |
| explorer | hero | high | run4 | 2 | 168,559 | 8.0 | 8 | accepted |
| monster-hunter | hero | high | run4 | 2 | 231,928 | 8.0 | 8 | accepted |
| noble-champion | hero | high | run4 | 2 | 227,967 | 8.0 | 8 | accepted |
| sailor | hero | high | run4 | 2 | 162,099 | 8.0 | 8 | accepted |
| pilgrim | hero | high | run4 | 2 | 202,021 | 8.0 | 8 | accepted |
| treasure-hunter | hero | high | run4 | 2 | 199,763 | 8.0 | 8 | accepted |

## Skipped assets

- cliff-face: score 6.5 against bar 7; fresh high agent reworked the grass only: cap a thick plank, ledge mats small, wedges plain; SKIPPED after 4 passes (medium 78789 + high 47555 = 126344); rock body usable; lesson: the textured build reduces the rock to 302 tris while --fast reports 5350, so maxError 0.04 hides facets
- ogre-brute: score 7.8 against bar 8; v3 same agent: v1 arm lengths restored, belly paint strengthened, 72346 tris, check ok; the hanging arm still reaches the hem and the shading is faint; 7.8 after three passes: SKIPPED (below the character bar); source left uncommitted, review entry added for the owner
- wood-golem: score 7.5 against bar 8; rework pass 3: eyes proud with painted sockets, raised petal sigil core, 70148 tris; eyes still small flecks in the front sprites; 3.8 -> 7.5 after three passes (120760 tokens), below the bar; source untracked (other session), review entry updated
- summoner: score 7.8 against bar 8; fresh high hair rework (second retry): 16 locks over the whole skull, wider circlet; front and three-quarter read as a swept mane, side and back read as crossing ropes; 57,234 tris; check ok over 5 cm; source left uncommitted for the owner
- key-gold+key-bronze+key-skeleton (grouped agent row): key-gold accepted 7.0; key-bronze accepted 7.0; key-skeleton skipped 6.8. Only the skipped item counts as a skip.
- key-bronze+key-skeleton (grouped agent row): key-bronze accepted 7.0; key-skeleton skipped 6.8. Only the skipped item counts as a skip.

## Other outcomes

- living-statue: pending-owner; rework 3 (marble): off-white base, two-scale ridge veins, grain bump, chipped rim and pauldron, rounded dome; marble now reads; sprite tone separation weak; 7.8
