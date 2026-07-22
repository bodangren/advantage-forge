# Test Strategy — Engine Interop Evidence, Phase S1

> Phase-scoped test strategy for `engine_interop_evidence_20260719` Phase S1
> (Define Interop Target Matrix). Phases S2–S3 are scoped but explicitly out of
> the S1 verification surface; their strategies are owned by later revisions.
> Owner directive: produce a strategy that defines the matrix contract, fails
> the right tests for the right reasons, and explicitly prevents manual-only
> placeholders from being reported as automated passes.

> Owner directive: the unrelated untracked `.opencode/` directory must be
> preserved. This strategy commit must not stage, format, or otherwise touch
> `.opencode/`, `benchmark-evidence/`, `approval-and-benchmark.md`,
> `benchmark-report.md`, or any user-owned ad-hoc evidence. They are excluded
> from `git status --porcelain` acceptance as well.

> Strategy model preference: prefer OpenAI reasoning (e.g. `gpt-5.6-terra` /
> `gpt-5.6-sol`) for design and review work; do not depend on Kimi or
> Volcengine. This is an authoring preference, not a contract gate, but the
> matrix's manual-only placeholder must record it when the author is not
> in-scope.

## 1. Status of the phase at the strategy baseline

- The phase spec (`spec.md#story-s1`), plan (`plan.md` Phase S1), and the
  archive-of-completed-tracks precedent (`measure/archive/...`) all exist at
  `86efee18cd81d40a79ef5c4035ee2a78d333219d`. No `test-strategy.md` exists
  yet for this track.
- `measure/product.md` currently reports `integration.game_engine_import` as
  `not-assessed` (see `measure/generated/capability-catalog.md`). This phase
  defines the matrix that S2 will execute against and S3 will gate on; it does
  not yet claim any external importer as passing.
- The track's out-of-scope list (animated GLB, skeletal content, performance
  benchmarks, new export formats) must remain unchanged; S1 only adds a
  *contract*, not new artifacts.
- The corrective Strategy commit that lands this `test-strategy.md` is what
  defines the phase baseline (§10). Pre-existing commit `86efee1` is the
  pre-Strategy head and is **not** the immutable phase baseline for Red.

## 2. Testing pyramid for this contract-defining phase

| Layer                | Owned by this strategy | Where it runs                                       |
| -------------------- | ---------------------- | --------------------------------------------------- |
| Contract / schema    | yes (the work product) | Focused vitest targets under `tests/interop/`       |
| Fixture / coverage   | yes                    | `pnpm test`, `pnpm test:coverage`                   |
| Documentation        | partial                | `pnpm generate`, `pnpm doctor`, generated catalog   |
| Browser              | no                     | Not applicable — S1 is a pure contract phase        |
| Live external import | no                     | Owned by Phase S2; S1 only declares the targets     |

No new product code is expected to run during S1. The implementation surface
is a typed Zod schema, a JSON loader, a coverage resolver, and the matrix
document itself plus a small text-coverage report.

## 3. Shared fixtures, mocks, and live-proof expectations

- **Live fixtures**: the four committed reference assets (`adventurer.rustic`,
  `cottage.rustic`, `crate.rustic`, `tree.rustic`) discoverable through
  `referenceDocuments` (`src/fantasy-kit/index.ts`) and their artifact roots
  under `artifacts/reference/<assetId>/revision.<sha>/`. The matrix's
  artifact-coverage test resolves these from the live module surface; it
  must not hardcode a list that drifts if a fifth reference is added.
- **Schema/contract fixtures**: typed Zod schemas for `InteropTarget`,
  `PassCriterion`, `AvailabilityClass`, `ManualPlaceholder`,
  `InteropTargetMatrix`, plus a deterministic fixture matrix used to exercise
  rejection of unknown fields, missing importer/version, missing pass criteria,
  manual-only placeholders masquerading as automated, and artifact-coverage
  gaps.
- **Mocks**: vitest module mocks are permitted only for filesystem access
  inside the matrix loader when it is exercised by a "clean clone" determinism
  test. The harness must never mock the live `referenceDocuments` export or
  the live `readFile` for `glb-manifest.json` / `render-manifest.json`
  availability — those are real evidence and the test asserts they exist.
- **Artifact vs. live behavior distinction**:
  - *Artifact tests* — JSON schema validation, version digest recomputation,
    placeholder format parsing, and documented rejection paths — are
    **artifact tests**. They prove the matrix is well-formed and digest-stable,
    not that any external importer works.
  - *Live behavior tests* — the coverage resolver actually walking
    `referenceDocuments` and matching each artifact type against at least one
    `automatable` target — are the only live-behavior gate in S1. S2 owns
    the importer-side live behavior.
- **Forbid live external calls**: no host network, no global installer, no
  `godot --headless`, no `gltf_validator`, no Unity CLI in this phase. S1 only
  probes host *availability* and records the result; it does not execute an
  importer. The availability probe is a single deterministic `command -v` /
  `PATH` scan recorded as a structured `AvailabilityProbeResult`, with a
  structured `manual_only` placeholder when the binary is absent.

## 4. Cross-phase edges and dependencies

- S1 is a pure contract phase. It must not execute any importer, must not
  rewrite the existing GLB / contact-sheet evidence under `artifacts/reference/`,
  and must not change any code path under `src/export/`, `src/scene/`,
  `src/render/`, `src/document/`, `src/fantasy-kit/`, `src/validation/`,
  `src/contracts/schemas.ts` (except by adding the new
  `interopTargetMatrixSchema` / `interopTargetSchema` Zod exports inside the
  closed contracts module), or `src/services/`.
- S2 will read the committed matrix document and emit evidence under a
  versioned directory; the matrix MUST carry a top-level
  `schemaVersion` (label, integer) and a SHA-256 digest of the canonical
  payload so S2 / S3 can fail closed on stale or tampered copies.
- S3 will gate exports on the matrix; S1 must make the
  `automatable` / `manual_only` distinction a typed enum, not a string, so
  the gate cannot drift via free text.

## 5. Architecture guardrails

- `src/contracts/` must remain free of `node:fs`, `node:path`, `three`,
  `@modelcontextprotocol`, and adapter imports — even for the new matrix
  schema. The filesystem loader lives next to the matrix module, not inside
  `contracts`. `pnpm doctor` enforces this.
- `fantasy-kit` is template data; the matrix module is **not** a kit
  template. It must not import from `fantasy-kit` either, since the matrix
  declares *what counts as a passing importer*, not a fantasy asset.
- The matrix and its loader may depend on `node:fs`, `node:path`,
  `node:crypto` only. They may not import `three`, `playwright`, or any
  adapter module. Cross-module imports must enter through `src/<module>/index.ts`
  per `dependency-cruiser`.
- New dependencies are forbidden. `gltf-validator`, `@gltf-transform/cli`,
  `godot`, and Unity-CLI binaries are **not** added; the matrix documents
  availability probes for them but installs nothing.
- `measure/generated/capability-catalog.md` is generated. S1 adds the
  `integration.game_engine_import` capability row **only via `pnpm
  generate`** after the matrix is committed; no hand edit.

## 6. Phase S1 gate plan

### Sub-task 1: Draft the interop target matrix contract

#### RED_TEST_COMMAND (targeted, bounded)

```bash
pnpm exec vitest run tests/interop/interop-target-matrix.test.ts \
  tests/interop/interop-target-coverage.test.ts \
  tests/interop/interop-target-placeholder.test.ts \
  tests/interop/interop-target-digest.test.ts
```

Each test must fail for the expected reason, not aggregate noise:

| Test file                              | Expected failure before implementation                                |
| -------------------------------------- | --------------------------------------------------------------------- |
| `interop-target-matrix.test.ts`        | `interopTargetMatrixSchema` / `interopTargetSchema` do not exist      |
| `interop-target-coverage.test.ts`      | `resolveInteropCoverage(referenceDocuments, matrix)` does not exist   |
| `interop-target-placeholder.test.ts`   | `parseManualPlaceholder` does not exist                               |
| `interop-target-digest.test.ts`        | `canonicalMatrixDigest` / `verifyMatrixDigest` do not exist           |

#### GREEN_TEST_COMMAND (closeout gate, single-block)

```bash
pnpm exec vitest run tests/interop/interop-target-matrix.test.ts \
  tests/interop/interop-target-coverage.test.ts \
  tests/interop/interop-target-placeholder.test.ts \
  tests/interop/interop-target-digest.test.ts && \
pnpm test && pnpm test:coverage && pnpm typecheck && pnpm lint && \
pnpm generate && pnpm doctor && \
git diff --exit-code -- measure/generated
```

`pnpm check` is **not** a closeout gate for S1 because its `format:check`
walks unrelated user-owned files; the substantive gates are run individually.

#### Closeout acceptance (per workflow.md §"Phase Completion Verification")

1. Schema, loader, placeholder parser, digest helpers, and coverage resolver
   all pass; coverage on the new `src/interop/` module ≥ 95 % statements
   (above the project's 80 % bar, because the module is the entire
   foundation of S2 and S3 and has no other consumers to dilute it).
2. Full unit suite green; coverage ≥ 80 % project-wide.
3. `pnpm typecheck`, `pnpm lint`, `pnpm generate`, `pnpm doctor` all pass;
   `pnpm generate` must report a clean `measure/generated/capability-catalog.md`
   diff because the new matrix row is generated, not hand-edited.
4. The committed matrix file `measure/tracks/engine_interop_evidence_20260719/s1-evidence/interop-target-matrix.json`
   (and its sidecar `.sha256`) parse, validate, and digest-verify against
   the helper that S2/S3 will reuse.
5. `measure/product.md` and `measure/tech-stack.md` carry the interop target
   matrix declaration (§7).
6. `git status --porcelain` excludes `.opencode/`, `benchmark-evidence/`,
   `approval-and-benchmark.md`, `benchmark-report.md`, and any untracked
   `s1-evidence/raw-probe/` directory created by the availability probe.

### Sub-task 2: Write failing matrix schema and coverage tests

This sub-task **is** the Red work. There is no separate Red command — the
tests live in the same files named above. They must:

1. Reject a target missing `importer`, `version`, `availability`, or
   `passCriteria` (typed-enum rejection, not string-equality).
2. Reject a target whose `availability === 'manual_only'` and which omits
   `manualPlaceholder`. (A6 — registry overstates resolved capability.)
3. Reject a `manualPlaceholder` that does not include a labeled
   `verificationOwner`, a labeled `procedureStepCount`, and a labeled
   `recordedAt` ISO date; the test parses each by its label, not by digit
   position. (A3 — unlabeled numeric evidence.)
4. Reject an `automatable` target that contains `manualPlaceholder`
   (the two states are exclusive).
5. Reject an unknown field at the matrix root, the target level, and the
   placeholder level; the rejection path is a typed `UNKNOWN_FIELD` envelope.
6. Assert that `resolveInteropCoverage(referenceDocuments, matrix)` reports
   each of `adventurer.rustic`, `cottage.rustic`, `crate.rustic`,
   `tree.rustic` as covered by at least one `automatable` target for every
   artifact type the reference actually emits (GLB and transparent PNG
   contact-sheet frames). The test resolves the live `referenceDocuments`
   module; it must not hardcode the list. The test must fail loudly when a
   fifth reference is added without matrix coverage.
7. Assert that a target whose `availability === 'manual_only'` can never be
   reported as `covered: 'automated'` by the coverage resolver — even if
   the target claims `passCriteria`. This is the A6 guard test.
8. Assert that the canonical digest of the matrix is stable under
   key-order normalization, version-label reformatting (`"1.0"` ↔ `"1.0.0"`),
   and trailing whitespace differences inside string fields; and that the
   digest changes when any `passCriteria[*].name`, `importer.version`, or
   `targetId` changes.
9. Assert that the matrix loader fails closed on missing digest sidecar,
   mismatched digest, or a non-existent matrix file. (A5 — plan claims
   exceed executed test reality.)
10. Assert that the per-target `passCriteria[*].verificationCommand` is
    rejected when it begins with a banned prefix (host network access,
    `sudo`, `curl`, `wget`, `npm i -g`, `pip install`, `apt-get install`,
    `docker run`, etc.). The filter is an explicit allowlist of
    `node`, `pnpm`, `bash`, `python3`, `npx <package>`, plus the binary
    the target declares; it does **not** use bare English exclusions like
    `"never"` or `"do not"`. (A7 — over-broad refutation filter.)

### Sub-task 3: Commit the matrix and update product docs

#### Closeout gate (per workflow.md)

1. `measure/tracks/engine_interop_evidence_20260719/s1-evidence/interop-target-matrix.json`
   and `.sha256` are committed.
2. `measure/product.md` declares the matrix under a new subsection
   "Interop Target Matrix (S1 declaration)".
3. `measure/tech-stack.md` declares the matrix under a new subsection
   "Interop Evidence Layer".
4. `pnpm generate` regenerates `measure/generated/capability-catalog.md`
   and the change is committed alongside the matrix and doc updates. The
   generated `integration.game_engine_import` row must report
   `not-assessed` until S2 produces automated evidence; the matrix MUST
   not be used to flip it to `partial` or `supported` in S1.
5. `pnpm doctor` passes; no stale generated facts.

## 7. Documentation contract for product / tech-stack updates

The two doc updates are evidence, not free-form prose. They must:

- State the matrix by reference: `measure/tracks/engine_interop_evidence_20260719/s1-evidence/interop-target-matrix.json`
  (relative path, never absolute, never a clone-root path).
- State the matrix's `schemaVersion` and SHA-256 digest inline, computed by
  the helper that S2/S3 will reuse.
- Distinguish `automatable` from `manual_only` for every declared target
  using the typed enum, never a string match.
- Cite `tests/interop/` by directory and name the specific test files.
- Add a one-line "evidence dossier" pointer that S2 will extend (the
  dossier will live under the same track directory in S2).

The updates do not widen the MVP scope; they only declare the matrix that
will prove the existing exports.

## 8. Intentionally-red aggregate-suite handling

The full `pnpm test` and `pnpm check` aggregates **must remain red until S1
closes**. The Red tests live in `tests/interop/`, and the focused
`RED_TEST_COMMAND` is the first segment of the GREEN block. There is no
expectation that running the full suite in the middle of a S1 implementation
passes — the orchestrator must run the focused command until it turns green,
then run the full suite once as the closeout gate. This is intentional and
must not be masked by `it.skip` or `.todo()` markers; the Red contract is
the proof that the contract work is necessary.

## 9. Architecture guardrails (re-stated as gates)

- `dependency-cruiser src --config dependency-cruiser.config.mjs` must pass.
  The new `src/interop/` module may import `node:fs`, `node:path`,
  `node:crypto`, `node:child_process` (read-only `command -v` / `which`
  probe only), and `zod`; nothing else from the project's `src/`.
- `pnpm doctor` must pass. No new dependencies in `package.json`; no
  `bpy`, `blender`, `react`, or `babylonjs` anywhere.
- The matrix document lives at the relative path above and uses forward
  slashes; the portability helper from `scripts/reference-evidence.ts` is
  reused for any embedded path (none expected in S1, but reserved).
- The new tests under `tests/interop/` follow the same boundary rules as
  the rest of the suite; no Three.js import in test code, no MCP client
  import, no Playwright import.

## 10. Risk classification

| Sub-task                                       | Risk     | Why                                                                                                                  |
| ---------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------- |
| Draft the interop target matrix contract      | medium   | Defines every pass/fail bar for S2/S3; a sloppy schema here forces rework in later phases.                          |
| Write failing matrix schema and coverage tests| medium   | The A3 / A5 / A6 / A7 guards are the entire falsifiability surface for the matrix; miscoverage leaks false passes. |
| Commit the matrix and update product docs      | low      | The doc edits are bounded text inserts with a typed cross-reference; the digest sidecar pins identity.               |
| **Phase S1 overall**                          | medium   | No runtime code or external tool is executed; risk concentrates in schema correctness and the honesty guarantees.   |

Phase S1 is **not** `low` because it is the foundation for S2 and S3; a
permissive matrix here would let S3 silently flip the
`integration.game_engine_import` capability row to `supported` on
unsupported evidence. The strategy's defense against that is the
`automatable` ↔ `manual_only` typed enum plus the coverage-resolver guard.

## 11. Review applicability for S1

| Role                       | Applicable | Why                                                                                                            |
| -------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| **Security review**        | yes (narrow) | Audit the `verificationCommand` allowlist (sub-task 2 test #10), the `manualPlaceholder` rejection (sub-task 2 test #2 / #3), and confirm no new dependency, no network call, no host-write side effect is added. |
| **UX/API review**          | no         | S1 defines no new public tool, no schema change to existing public operations, no UI surface.                  |
| **Adversarial testing**    | yes (narrow) | Attempt to (a) report a `manual_only` target as `automated`; (b) smuggle an unlabeled integer (`123`) as a "count" in `passCriteria`; (c) drop the digest sidecar; (d) use a bare-English filter to suppress a real `passCriteria` failure. Each attempt must be rejected by the Red tests above. |
| **Browser review**         | no         | S1 does not change rendering, export, or inspector code paths.                                                |

## 12. Anti-pattern coverage per gate

Every test in this strategy must have a falsification condition.

| Anti-pattern | Defense                                                                                   |
| ------------ | ----------------------------------------------------------------------------------------- |
| **A1** — substring state | Schema rejects state transitions via the typed `availability` enum and `passCriteria[*].verificationCommand` allowlist; the test never falls back to a `text.includes('automated')` substring check. |
| **A3** — unlabeled numeric evidence | `manualPlaceholder.procedureStepCount` and the coverage resolver's "targets covering this artifact" count parse labeled integers; the Red test fails when a digit appears in a non-labeled position. |
| **A5** — plan claims exceed test reality | The matrix loader digest-checks itself; the `pnpm doctor` and `pnpm generate` gates refuse stale `measure/generated/capability-catalog.md`; closeout requires real focused-test green output, not a `pnpm check` artifact. |
| **A6** — registry overstates resolved capability | The coverage resolver rejects `availability === 'manual_only'` from being reported as `covered: 'automated'`; the matrix digest is required by S3 to flip the capability row, and S1 does not flip it. |
| **A7** — over-broad refutation filter | The `verificationCommand` allowlist is an explicit per-binary list, not a `text.includes('never')` filter; the Red test asserts a real banned command (`curl https://x/y`) is rejected while the declared binary's own command is accepted. |
| **A8** — ambiguous `[ ]` markers | S1 plan tasks use `[x]` for closed, `[~]` for active, `[b]` with `(deferred:<owner>)` for deferred; this strategy does not amend the plan, only observes it. |
| **A9** — tests retain active paths after archival | No `measure/tracks/<archived-id>` paths are referenced; the archive-vs-active helper from the existing track precedent is reused if S1 introduces any evidence path that survives closeout. |
| **A10** — generated facts drift | `pnpm generate` + `git diff --exit-code -- measure/generated` + `pnpm doctor` are all S1 closeout gates; `measure/generated/capability-catalog.md` change is committed atomically with the matrix. |

## 13. Orchestrator hand-off and `phase_base_sha` capture

- The immutable `phase_base_sha` for any subsequent S2 / S3 Red phase work
  is captured **only after the corrective Strategy commit that lands this
  `test-strategy.md`**. The capture point is `git rev-parse HEAD`
  immediately after the strategy commit and before any further S1
  implementation, harness build, or acceptance work begins. The capture is
  recorded in:
  - `measure/tracks/engine_interop_evidence_20260719/s1-evidence/phase-acceptance.json`
    (the S1 phase acceptance artifact, schema `version: 1`),
  - `measure/tracks/engine_interop_evidence_20260719/verification.md`
    (the S1 verification section), and
  - the matrix sidecar
    `measure/tracks/engine_interop_evidence_20260719/s1-evidence/interop-target-matrix.sha256`
    (the digest of the committed matrix JSON).
- `86efee18cd81d40a79ef5c4035ee2a78d333219d` is the *pre-Strategy* head
  (the archive move of `character_accessory_library_20260717` plus the
  2026-07-21 review). It is **not** the active phase baseline for Red; the
  baseline is the corrective Strategy commit. Any audit SHA that predates
  the corrective Strategy commit is invalid evidence (A5).
- The strategy text deliberately avoids baking a future SHA; it refers only
  symbolically to "the corrective Strategy commit / HEAD at capture time."
  The orchestrator must read that commit SHA from `git rev-parse HEAD` at
  capture time and substitute it into the closeout JSON / verification
  document / matrix sidecar.
- The owner-owned untracked paths `.opencode/`, `benchmark-evidence/`,
  `approval-and-benchmark.md`, `benchmark-report.md`, and any untracked
  `measure/tracks/engine_interop_evidence_20260719/s1-evidence/raw-probe/`
  directory are **never** included in the strategy commit, the matrix
  commit, the S1 closeout commit, or the `phase_base_sha` provenance chain.
  `git status --porcelain` is the final closeout check.

## 14. RED_TEST_COMMAND and GREEN_TEST_COMMAND — final form

```
RED_TEST_COMMAND = pnpm exec vitest run tests/interop/interop-target-matrix.test.ts tests/interop/interop-target-coverage.test.ts tests/interop/interop-target-placeholder.test.ts tests/interop/interop-target-digest.test.ts
GREEN_TEST_COMMAND = pnpm exec vitest run tests/interop/interop-target-matrix.test.ts tests/interop/interop-target-coverage.test.ts tests/interop/interop-target-placeholder.test.ts tests/interop/interop-target-digest.test.ts && pnpm test && pnpm test:coverage && pnpm typecheck && pnpm lint && pnpm generate && pnpm doctor && git diff --exit-code -- measure/generated
```

The phase **is not** declared passed here. Acceptance is owned by the
independent phase-acceptance auditor after these gates produce real, recorded
output against `phase_base_sha`.

## 15. Notes distinguishing artifact / documentation tests from live behavior

- **Artifact tests** (`interop-target-matrix.test.ts`,
  `interop-target-placeholder.test.ts`, `interop-target-digest.test.ts`):
  validate the schema, parse the placeholder, recompute the digest. They
  are necessary but not sufficient; their green status alone does not
  certify that the matrix *means* anything to S2.
- **Live behavior tests** (`interop-target-coverage.test.ts`): walks the
  live `referenceDocuments` export and proves that every committed
  reference maps to at least one `automatable` target. This is the only
  S1 test that observes a live module surface; the rest are pure
  artifact round-trips.
- **Documentation tests** (sub-task 3): there is no automated "doc
  parser" test for `measure/product.md` / `measure/tech-stack.md` — they
  are human-readable text inserts with a typed cross-reference. The
  generated-facts gate (`pnpm generate` + diff) is the automated
  surrogate that catches accidental hand edits to
  `measure/generated/capability-catalog.md`.
- **No live external importer call** occurs in S1. Probes of `command -v
  godot`, `command -v gltf-validator`, etc. are the only host-shell
  invocations; their stdout is parsed as structured JSON and recorded in
  the matrix document, never executed against a real asset.

---

MEASURE_AGENT_RESULT:
  role: measure-strategy
  track: engine_interop_evidence_20260719
  phase: Phase S1: Define Interop Target Matrix
  strategy_file: measure/tracks/engine_interop_evidence_20260719/test-strategy.md
  red_test_command: pnpm exec vitest run tests/interop/interop-target-matrix.test.ts tests/interop/interop-target-coverage.test.ts tests/interop/interop-target-placeholder.test.ts tests/interop/interop-target-digest.test.ts
  green_test_command: pnpm exec vitest run tests/interop/interop-target-matrix.test.ts tests/interop/interop-target-coverage.test.ts tests/interop/interop-target-placeholder.test.ts tests/interop/interop-target-digest.test.ts && pnpm test && pnpm test:coverage && pnpm typecheck && pnpm lint && pnpm generate && pnpm doctor && git diff --exit-code -- measure/generated
  risk_classification:
    overall: medium
    sub_task_1: medium
    sub_task_2: medium
    sub_task_3: low
  applicability:
    security: true
    ux_api: false
    adversarial: true
    browser: false
  anti_patterns_covered: [A1, A3, A5, A6, A7, A8, A9, A10]
  phase_base_sha_capture:
    capture_point: "after corrective Strategy commit that lands this test-strategy.md; before any S1 implementation, harness build, or acceptance work"
    capture_method: "git rev-parse HEAD recorded in s1-evidence/phase-acceptance.json, verification.md, and interop-target-matrix.sha256"
    pre_strategy_head_sha: 86efee18cd81d40a79ef5c4035ee2a78d333219d
    pre_strategy_head_role: "pre-Strategy head (character_accessory_library_20260717 archive + 2026-07-21 review); NOT the active phase baseline for Red"
  preserved_untracked_paths: [.opencode/, benchmark-evidence/, approval-and-benchmark.md, benchmark-report.md, measure/tracks/engine_interop_evidence_20260719/s1-evidence/raw-probe/]
  implementation_changes: none
  plan_changes: none
  spec_changes: none
  model_preference: prefer OpenAI reasoning (gpt-5.6-terra/sol); do not depend on Kimi or Volcengine