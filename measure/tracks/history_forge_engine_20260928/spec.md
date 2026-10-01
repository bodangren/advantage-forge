# History: Rebuild Forge as a code-first SDF asset engine

## Purpose

Replace the previous catalog-first asset system with a TypeScript SDF source pipeline and Forge CLI.

## Acceptance criteria

- The ledger assigns each rework commit to one owner track.
- The track names the delivered scope supported by the commit subjects and paths.
- The record does not infer historical acceptance from source presence.

## Evidence

- [history-commit-map.tsv](../../../measure/evidence/history-commit-map.tsv)
- [AGENTS.md](../../../AGENTS.md)
- [PLAN.md](../../../bench/overnight/PLAN.md)
- [fantasy-world-asset-catalog.md](../../../docs/fantasy-world-asset-catalog.md)

## Path policy

Existing design, code, script, source, and output paths remain stable. This track adds Measure records.
