# Resolve dependency launcher reconciliation

## Purpose

Resolve the pnpm launcher failure without disrupting concurrent asset and game work.

## Acceptance criteria

- The declared package manager runs checks without unexpected dependency replacement.
- The dependency state and supported runtime are documented.
- The direct commands remain documented until the launcher passes.

## Sources

- [package.json](../../../package.json)
- [pnpm-lock.yaml](../../../pnpm-lock.yaml)
- [measure/evidence/baseline-20260928.md](../../../measure/evidence/baseline-20260928.md)

## Scope control

Existing paths remain stable. This track changes only the documentation or tooling identified in its specification.
