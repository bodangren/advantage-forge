# Sound library sources: ElvGames packs, CC-BY sites, and credits

## Purpose

The first track (`audio_sfx_library_20261013`) filled the sound list with CC0 takes from
OpenGameArt only. After four review rounds, 89 rows have no take, mostly farm animals and
non-verbal voices, and 95 rows have fewer takes than wanted. This track adds more sources and
the licenses that the owner permits, and it records the credits that these licenses need.

## Owner decisions (2026-10-14)

- "We should expand to more sites or more restrictive licenses to get more choices."
- Permitted licenses: CC0, CC-BY 3.0 and 4.0, OGA-BY 3.0 and 4.0. Not permitted: NC, ND, SA,
  GPL, and personal-use licenses.
- The ElvGames sound packs in `~/Desktop/Asset Packs/` are bought. Their takes go into this
  public repository (the owner accepts the risk of the terms "may not be ... distributed in any
  way except as an integral part of the project").
- Music in git: yes (decided in the first track).

## ElvGames license (`License.txt` in the packs, https://elvgames.itch.io/terms)

- Personal and commercial projects; the assets may be edited and modified.
- "Credits to ElvGames & Pegonthetrack" (the terms page does not make credits mandatory; we
  credit them). A modified asset must be stated as modified.
- Not permitted: use on training or generative AI, crypto or NFT projects, resale of the packs.
  The pipeline gives no audio to an AI model; agents choose by file names and probe spans.

## Scope

- Catalog: every source has a catalog file in `audio/sources/` (one JSON file for each site).
  `search` searches all of them; an entry records its site, license, author, and URL.
- `take` accepts a permitted license only and records it in the manifest.
- `credits` writes `audio/CREDITS.md` from the manifest: every take with author, license, source
  URL, and the statement that the tool changed the sound (trimmed, leveled, encoded as MP3).
- Sources, in order: the ElvGames packs (local zip files), SoundBible and Wikimedia Commons (no
  account needed), OpenGameArt CC-BY and OGA-BY entries, Freesound (needs an API key from the owner).
- Search agents for the miss rows and the rows with fewer takes than wanted; owner review rounds
  on the local review page.

## Exclusions

- Game integration (a later track).
- New recordings or sound design.

## Acceptance criteria

1. Every take has a permitted license, an author, and a source URL in the manifest.
2. `audio/CREDITS.md` lists every take that is not CC0, and it is current with the manifest.
3. The miss rows were searched in the new sources; each row has a take or a reason.
4. The owner reviewed every new take.
