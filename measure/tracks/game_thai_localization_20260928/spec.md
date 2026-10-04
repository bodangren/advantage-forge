# Review Thai story content

## Purpose

Review generated Thai glosses and localization content before the APK port uses those story packs.

## Acceptance criteria

- A qualified Thai reviewer checks every generated gloss.
- Unreviewed text remains labeled and cannot be presented as approved.
- Terminology and reading level follow the owner content policy.
- Review evidence points to each changed story pack.

## Open decisions

Waiting for the owner (2026-10-04). Each item has a proposal.

1. The port no longer uses Forge story packs. Since 4 October 2026 the games in Primary Advantage
   read the student's saved flashcards, with the translations the app already holds (track
   `game_flashcard_input_20261004`), and there is no story picker. The app code reads no file of
   `public/stories/`. Proposal: close this track as superseded for the port. The Forge demo keeps
   its stories with the generated glosses marked as generated (TD-12 stays open for the demo).
2. The game strings (briefings, hints such as "Drag to move", and HUD labels) exist only in
   English. Proposal: a new track adds Thai strings for the briefings and hints, never for the
   words that the student practices; a Thai reviewer checks them.


## Evidence

- [apk-port.md](../../../docs/apk-port.md)
- [apk-2d3d-program.md](../../../docs/apk-2d3d-program.md)

## Path policy

Existing design, code, script, source, and output paths remain stable. This track adds Measure records.
