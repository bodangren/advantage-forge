# Project workflow

The track plan owns execution status. The Measure index resolves project context.
This workflow adapts Measure to an existing asset and game repository.

## Start work

1. Read the Measure index and project status.
2. Read the relevant track specification and plan.
3. Read the debt registry and lessons.
4. Check Git status before editing shared files.
5. Mark the selected task `[~]` before implementation.
6. Record the task owner and paths when work runs concurrently.

Use `[ ]` for pending tasks, `[~]` for active tasks, and `[x]` for completed tasks.
Metadata uses `new`, `in_progress`, and `completed`.
Historical tracks describe delivered scope at the recorded revision.
They do not certify the current working tree.

## Define new work

1. Create a bounded track before implementation.
2. Add its specification, plan, metadata, and index.
3. Record scope, exclusions, acceptance criteria, dependencies, and evidence.
4. Register the track in the master list.
5. Map relevant catalog IDs or legacy plans to the track.

Future work uses contracts, tests, implementation, and verification in that order.
Documentation work uses acceptance criteria, edits, and verification.
Asset work uses a design contract, visual checks, production, and export review.
Existing owner decisions provide planning authority. New product decisions require explicit resolution in the track.

## Code changes

1. Define or update the affected contract.
2. Add a focused failing behavior test where the change warrants one.
3. Implement the change.
4. Run the relevant tests and type checks.
5. Record the affected callers and integration boundaries.
6. Run the Measure generator and doctor.

New logic targets more than 80% coverage when coverage tooling is available.
Do not invent a coverage result when the tooling did not run.
Documentation-only changes need structural checks rather than application tests.
Known baseline failures remain open debt; they do not become successful checks.

## Asset changes

1. Read the Forge asset skill and relevant kit requirements.
2. Record scale, silhouette, palette, materials, and required clips.
3. Render the source with `./forge render <name> --fast`.
4. Review the image and record the three largest differences.
5. Correct the largest difference first.
6. Run `./forge all <name>` after the shape review passes.
7. Review the final render and sprite preview.
8. Run `./forge check <name>` for held equipment and animation clearance.
9. Record source revision, export evidence, warnings, and review limits.

Source presence, a completed trial, and a numerical score do not independently establish acceptance.
Production tracks can group batches, but each asset needs an acceptance record.

## Game changes and ports

1. Preserve one rules core for both renderers.
2. Verify deterministic replay and learning evidence.
3. Test actual touch or pointer input in both views.
4. Record browser screenshots and observed outcomes.
5. Follow the port track dependencies before changing the monorepo.
6. Link monorepo commits and pull requests in the owning track.

A local cartridge remains separate from a completed monorepo port.
A planned deployment remains separate from a verified deployment.

## Concurrent work and commits

1. Assign separate files or tracks to concurrent workers.
2. Preserve unrelated edits and staged files.
3. Review the exact diff before committing.
4. Commit only explicitly selected paths.
5. Include the track ID in the commit message.
6. Record the commit and verification in the track plan.

Use Git notes when they add evidence beyond the committed track record.
Never fabricate retrospective notes or user approvals.
Keep existing source, output, script, and design paths stable.
Obtain owner approval before changing any path that callers, tools, or users depend on.

## Completion

1. Check every acceptance criterion against evidence.
2. Record any deferred work in an owning track.
3. Update debt and lessons without exceeding their context budgets.
4. Update the plan, metadata, registry, and project status.
5. Run `./measure/generate.sh`.
6. Run `./measure/doctor.sh`.
7. Commit the completed scope and generated facts.

Use scope-specific verification. A passing Measure doctor does not certify application tests, asset quality, or deployment.
User review remains required where the task explicitly requires it.
Routine documentation migration does not add an approval gate.

## Commands

```bash
./measure/generate.sh
./measure/doctor.sh
./scripts/measure/check_context_budget.sh
node node_modules/typescript/bin/tsc --noEmit
node node_modules/vitest/vitest.mjs run
node node_modules/vitest/vitest.mjs run tests/apk3d/imports.test.ts --maxWorkers=1
```

The Measure CI workflow runs tooling tests and structural checks without installing application dependencies.
The local doctor also runs the existing architecture boundary tests.

The direct compiler and test commands use the installed dependencies.
They avoid the pnpm launcher issue recorded in the debt registry.
Do not reinstall dependencies during concurrent work without coordination.
