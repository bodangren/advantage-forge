# Sound library sources: ElvGames packs, CC-BY sites, and credits

Status: in progress. The plan records execution state. `docs/sound-library.md` retains design detail.

## Phase 1: Tool

- [x] Task: Merge all catalog files of `audio/sources/`; record site, license, and URL for each entry. `search --site` filters one site.
- [x] Task: Permit CC0, public domain, CC-BY 3.0/4.0, OGA-BY 3.0/4.0, and the ElvGames license in `take`; record the license in the manifest. Public domain has fewer conditions than CC0, so it is permitted too.
- [x] Task: Add the ElvGames packs as a local source (WAV files only): `elvgames` writes `audio/sources/elvgames.json` (8 packs, 268 sounds); `fetch` unzips one pack from `$ASSET_PACKS`.
- [x] Task: Add `credits` (writes `audio/CREDITS.md`).

## Phase 2: More sites

- [x] Task: Add SoundBible and Wikimedia Commons: `find <site> <words>` searches live and adds the hits with a permitted license to the site's catalog (Commons pronunciation files are skipped: spoken words). Tested: `wildlife/rooster#1` from SoundBible (CC-BY 3.0).
- [x] Task: OpenGameArt CC-BY and OGA-BY entries: `find opengameart <words>` (a keyword search, not a full crawl) adds them to `oga-by.json` and to the list that `catalog` rebuilds from.
- [ ] Task: Freesound (needs an API key from the owner).

## Phase 3: Fill and review

- [x] Task: Fix the slow live search: a finished request kept the process alive until its timeout (60 s for each `find`, 120 s for OpenGameArt). The timer is now `unref`; SoundBible loads four pages at a time. A Commons search takes about 10 s, a SoundBible search about 20 s.
- [ ] Task: Search agents for the miss rows (farm animals, voices first), then the rows with fewer takes than wanted. Round A (2026-10-14, 4 Haiku agents and the orchestrator): 20 new takes (farm animals, owl, hawk, wolf howl, splash, bubbles, rune, fizzle, child laugh, crowd cheer, fey giggle, river, waterfall, ocean, library). The P0 row `ambience/library` now has a take. Next slices: NPC work sounds, wild animals, voices that are still open, and more ElvGames takes for the rows with fewer takes than wanted.
- [ ] Task: Owner review rounds; update the credits file.
- [ ] Task: Update `docs/sound-library.md`; run `./measure/generate.sh` and `./measure/doctor.sh`; close the track.
