# Restore asset quality gates

## Purpose

Repair the known type failures and establish acceptance evidence for imported assets. This track does not add catalog targets.

## Acceptance criteria

- The compiler reports no asset errors.
- Changed assets retain their intended geometry and materials.
- The import workflow rejects invalid sources and empty GLBs.
- Every repaired asset has a recorded review or an explicit deferred review.

## Sources

- [bench/overnight/PLAN.md](../../../bench/overnight/PLAN.md)
- [bench/overnight/graft.sh](../../../bench/overnight/graft.sh)
- [measure/evidence/typecheck-20260928.txt](../../../measure/evidence/typecheck-20260928.txt)

## Scope control

Existing paths remain stable. Catalog IDs define scope; filename matches indicate source coverage only.
