# Sound library sources: ElvGames packs, CC-BY sites, and credits

Status: shelved, not done (PM 2026-11-27); reopen by moving it back. The plan records execution state. `docs/sound-library.md` retains design detail.

## Phase 1: Tool

- [x] Task: Merge all catalog files of `audio/sources/`; record site, license, and URL for each entry. `search --site` filters one site.
- [x] Task: Permit CC0, public domain, CC-BY 3.0/4.0, OGA-BY 3.0/4.0, and the ElvGames license in `take`; record the license in the manifest. Public domain has fewer conditions than CC0, so it is permitted too. Evidence: `42197a4a` (recorded when marked done; it added `audio/CREDITS.md`).
- [x] Task: Add the ElvGames packs as a local source (WAV files only): `elvgames` writes `audio/sources/elvgames.json` (8 packs, 268 sounds); `fetch` unzips one pack from `$ASSET_PACKS`.
- [x] Task: Add `credits` (writes `audio/CREDITS.md`).

## Phase 2: More sites

- [x] Task: Add SoundBible and Wikimedia Commons: `find <site> <words>` searches live and adds the hits with a permitted license to the site's catalog (Commons pronunciation files are skipped: spoken words). Tested: `wildlife/rooster#1` from SoundBible (CC-BY 3.0).
- [x] Task: OpenGameArt CC-BY and OGA-BY entries: `find opengameart <words>` (a keyword search, not a full crawl) adds them to `oga-by.json` and to the list that `catalog` rebuilds from.
- [x] Task: Freesound (needs an API key from the owner). Closed by PM decision 2026-11-27 (owner PM): no Freesound key exists in our secrets or env files, and nobody waits for one. The missing effects come from `mmx` at 0 USD on the MiniMax plan, or from CC0 sounds already on disk.
  - The installed `mmx` 1.0.29 calls audio as `mmx speech synthesize` (models `speech-2.8-hd`, `speech-2.6`, `speech-02`). It has no `music` resource, so the skill command `mmx music generate` needs a CLI update. `mmx quota show` reports plan call counts, not USD.
  - CC0 sounds on disk: `audio/manifest/*.tsv` holds the takes. `audio/sources/oga-cc0.json` (1521 CC0 entries), `oga-by.json`, and `elvgames.json` (268 local sounds) hold the sources. `node scripts/sfx-library.mjs status` reports 356 rows: 204 full, 115 some, 37 missing, 0 open.
  - This decision covers the 37 missing rows: ambience/castle, ambience/fireplace, ambience/magic-hum, ambience/ship, ambience/smithy, ambience/snow, ambience/windmill, enemy/chant, hero/armor-move, hero/footstep-water, hero/whistle, item/craft-success, monster/fire-roar, monster/frost-breath, monster/giant-step, monster/ice-crackle, monster/shadow-whoosh, npc/bellows, npc/crowd-gasp, npc/greet, npc/grindstone, npc/hand-drum, npc/loom, npc/shop-bell, vehicle/airship, vehicle/carpet, vehicle/cart, vehicle/rowboat, vehicle/sleigh-bells, wildlife/bird-flutter, wildlife/hooves-gallop, wildlife/horse-snort, world/candle-out, world/ladder, world/notice-board, world/portal-open, world/rope. It covers the 115 rows with fewer takes than wanted too.
  - No new task needs a key. No generation runs in this session.

## Phase 3: Fill and review

- [x] Task: Fix the slow live search: a finished request kept the process alive until its timeout (60 s for each `find`, 120 s for OpenGameArt). The timer is now `unref`; SoundBible loads four pages at a time. A Commons search takes about 10 s, a SoundBible search about 20 s.
- [ ] Task: Search agents for the miss rows (farm animals, voices first), then the rows with fewer takes than wanted. Round A (2026-10-14, 4 Haiku agents and the orchestrator): 20 new takes (farm animals, owl, hawk, wolf howl, splash, bubbles, rune, fizzle, child laugh, crowd cheer, fey giggle, river, waterfall, ocean, library). The P0 row `ambience/library` now has a take. Round B (4 Haiku agents): 25 new takes: second ElvGames takes for 6 P0 and P1 rows (chest open, thunder, fire cast, fire impact, wind, confirm), NPC work sounds (axe chop, coins, broom), voices (cheer, hmm, gasp, throat clear, chant, giggle), and wild animals (bee, crocodile, dolphin, fox, pigeon, seal, critter, squirrel). Several animal takes are stand-ins (coyote for fox, orca for dolphin, alligator for crocodile); the owner decides in review. Round C (4 Haiku agents): 17 new takes for rows without a take (chains, crystal, anvil, bells, mug clink, gong, whip, deer, lute, crystal chime, magic horse, sail, watermill, fountain, lava, market). The orchestrator dropped 4 takes (`drop` in `audio/review.tsv`): an animal roar for the flame row, a catcall whistle (rated G), an 8-bit ladder climb, and the ghostly hum that an earlier check rejected. Total 502 takes.
- [ ] Task: Owner review rounds; update the credits file.
- [ ] Task: Update `docs/sound-library.md`; run `./measure/generate.sh` and `./measure/doctor.sh`; close the track.
