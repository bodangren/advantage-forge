# Project Workflow

## Guiding Principles

1. `plan.md` is the source of truth for implementation status and sequence.
2. Changes to dependencies, runtime architecture, output contracts, or MVP scope must be documented before implementation.
3. Follow contract-first TDD: define schemas, write a failing test, implement the minimum behavior, then refactor.
4. Maintain more than 80% coverage for new domain and adapter code.
5. Generated scenes and outputs never replace the canonical asset document.
6. Prefer non-interactive, CI-aware commands and deterministic seeds.
7. Machine-enforce module boundaries and regenerate architecture facts when public structure changes.
8. Browser-visible sprite and 3D behavior is an acceptance gate; green unit tests alone do not close a rendering phase.

## Standard Task Lifecycle

1. Select the next pending task and mark it `[~]` in the active plan.
2. Define or update the relevant public contract.
3. Write and run tests that fail for the intended reason.
4. Implement the smallest change that makes the tests pass.
5. Refactor without changing behavior and rerun affected tests.
6. Run coverage and maintain the project threshold.
7. Run the architecture generator and doctor checks.
8. Record any deliberate shortcut in `tech-debt.md` after checking its 50-line context budget.
9. Commit the task atomically using the project commit format.
10. Attach a Git note summarizing the task, files, tests, and rationale.
11. Mark the task `[x]`, append the seven-character implementation commit SHA, and commit the plan update.

## Planned Development Commands

These commands become mandatory when Story S1 establishes the implementation scaffold:

```bash
pnpm install
pnpm dev
pnpm test
pnpm test:coverage
pnpm test:browser
pnpm lint
pnpm typecheck
pnpm generate
pnpm doctor
pnpm check
```

`pnpm check` must run formatting verification, type checking, linting, unit tests, architecture generation freshness, and the doctor. Browser rendering verification may run separately when a GPU/browser environment is required, but the active plan must record that distinction.

## Testing Requirements

### Contract Tests

- Every versioned document and domain tool schema has valid, invalid, unknown-field, and migration behavior tests.
- Canonical serialization and revision behavior are deterministic.
- External payloads never reach domain code without validation.

### Geometry and Assembly Tests

- Generators assert finite coordinates, valid indices, expected bounds, winding, normals, and documented parameter limits.
- Port tests cover compatibility, transform resolution, mirroring, connection rejection, and cycle prevention.
- Pose and variant tests prove that unrelated stable IDs remain unchanged.

### Rendering and Export Tests

- Unit tests cover camera ordering, frame layout, anchor calculation, and render-profile validation.
- Browser tests render the committed reference assets at delivery resolution.
- Pixel checks cover transparency, occupied bounds, ground anchor, clipping, and minimum silhouette thickness.
- Exact pixel equality is required only in a pinned reference environment. Cross-hardware acceptance uses structural metrics plus explicit visual review.
- GLB tests load the exported artifact and verify scene nodes, materials, scale, transforms, and absence of unsupported content.

## Architecture and Generated Facts

- `measure/generate.sh` updates `measure/generated/architecture.json` and `measure/generated/routes.md` from the current source tree.
- `measure/doctor.sh` runs module-boundary enforcement and fails if generated facts are stale.
- Adapters (`mcp`, `inspector`) may depend inward on domain tools. Domain modules never import adapters.
- `contracts` has no Three.js, filesystem, browser, or MCP dependency.
- `fantasy-kit` is template data and composition; it may not become a parallel geometry engine.

## Phase Completion Verification and Checkpointing Protocol

At the end of every phase:

1. Announce the exact automated commands before running them.
2. Determine files changed since the previous phase checkpoint and confirm each code file has relevant tests.
3. Run the applicable unit, coverage, type, lint, architecture, and browser checks. Attempt at most two repair passes for a persistent verification failure before stopping for guidance.
4. Read `product.md`, `product-guidelines.md`, the phase specification, and the phase plan to produce a concrete manual verification procedure.
5. For rendering phases, the procedure must include opening the inspector, viewing the 3D result, viewing the contact sheet, viewing sprites at actual resolution, and comparing expected metrics.
6. Pause for explicit user confirmation that the phase meets expectations.
7. Create a phase checkpoint commit and attach a Git note containing automated commands, results, manual steps, and user confirmation.
8. Append `[checkpoint: <sha>]` to the phase heading and commit the plan update.

Each plan phase must end with:

```markdown
- [ ] Task: Measure - User Manual Verification '<Phase Name>' (Protocol in workflow.md)
```

## Quality Gates

- All affected tests pass.
- New domain and adapter code exceeds 80% coverage.
- Strict TypeScript and lint checks pass.
- Module boundaries pass.
- Generated architecture facts are current.
- Public contracts and tool behavior are documented.
- No unsupported dependency or scope expansion was introduced.
- Reference output was reviewed at actual sprite resolution when applicable.
- The plan, metadata, lessons, and tech-debt state accurately describe reality.

## Commit Guidelines

Use Conventional Commits:

```text
<type>(<scope>): <description>
```

Preferred types are `feat`, `fix`, `test`, `refactor`, `docs`, `chore`, and `measure`. Commits remain task-sized. Phase checkpoints use `measure(checkpoint): Complete Phase S<n>`.

## Definition of Done

A task is done only when its contract, failing test evidence, implementation, automated verification, documentation, atomic commit, Git note, and plan status are complete. A phase additionally requires explicit manual verification and a recorded checkpoint. A track is not complete until all acceptance criteria pass, final generated facts are committed, metadata is accurate, and the track is archived through the Measure closeout workflow.
