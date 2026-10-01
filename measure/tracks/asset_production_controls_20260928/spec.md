# Harden production coordination

## Purpose

Make trial isolation, resource limits, and source ownership explicit. Preserve the current scheduler and review paths.

## Acceptance criteria

- Trials cannot overwrite unrelated project sources.
- Concurrent runs respect measured memory and build capacity.
- Failed providers and held jobs have explicit retry conditions.
- Commits contain only the assigned paths.

## Sources

- [bench/overnight/PLAN.md](../../../bench/overnight/PLAN.md)
- [bench/overnight/scheduler.sh](../../../bench/overnight/scheduler.sh)
- [bench/overnight/graft.sh](../../../bench/overnight/graft.sh)

## Scope control

Existing paths remain stable. Catalog IDs define scope; filename matches indicate source coverage only.
