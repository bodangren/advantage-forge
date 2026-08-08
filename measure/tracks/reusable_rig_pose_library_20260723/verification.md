# Verification: Reusable Rig, Pose, and Clip Libraries

Recorded through `2026-07-23T02:51:54Z`. This is automated repair and S3-core evidence, not S1/S2/S3 acceptance or track closeout.

## Fourth independent audit corrections and repairs

- The prior evidence overclaimed approval immutability composition: recomputing an outer `libraryId` could bless a stale nested generated approval receipt. Outer raw identity remains first, then every nested receipt is verified in library verification, compatibility validation, and both memory and file repository boundaries.
- Immutable publication and current-pointer cleanup now guard close, unlink, and directory-sync failures. A primary structured domain error is preserved; secondary cleanup errors are retained as suppressed detail, while outward `code`, `path`, and `message` remain logical and path-safe.
- Hierarchy-depth and aggregate total-DOF budget refinements carry stable Zod `params.domainCode = BUDGET_EXCEEDED` metadata. Domain parsing prioritizes those custom aggregate issues and reports `BUDGET_EXCEEDED` at the exact budget field.
- Mirror-unavailable errors in compatibility and authoring now address the exact numeric pose/channel/contact/equipment field instead of embedding prose or part IDs in paths.

## Fifth compiler checkpoint correction

- The prior final strict-typecheck claim was invalidated when the budget mapper was edited afterward with dot access on Zod's index-signature `params`. The mapper now uses strict bracket access at both `domainCode` reads, and the actual project command `tsc -b --pretty false` passes.
- Existing hierarchy-depth and total-DOF tests continue to assert the stable custom `BUDGET_EXCEEDED` params and domain mapping.

## Automated evidence

- Focused repaired slice: `4/4` files, `54/54` tests passed.
- Strict TypeScript: passed.
- Scoped Prettier check for all repaired source and tests: passed.
- ESLint and dependency boundaries: passed; `90` modules and `227` dependencies cruised with no violations.
- Architecture doctor: passed.
- Current full coverage is not green. The owned one-worker attempt was terminated after unrelated suites developed broad timeouts under load `16.41/16.71/12.51`, only `636 MiB` free RAM, and `5.7 GiB` swap use. This is environment-red evidence, not a passing gate.
- Isolated affected files: authoring-review artifacts `5/5`, legacy animation authoring `12/12`, handlers `16/16`, browser artifacts `10/10`, and humanoid geometry `1/1` passed. Novel-file composition remained `1/2` with a `30.187s` timeout against `30s`; novel composition remained `9/10` with a `15.581s` timeout against `15s`. Neither produced an assertion mismatch, and no timeout was changed.
- Rig v2 coverage: `95.65/93.10/97.36/96.46`.
- Pose-library coverage: `94.78/90.90/97.72/95.96`.
- Reusable authoring coverage: `97.50/94.28/100/97.40`.
- Repository coverage: `89.28/82.54/96.82/90.37`.
- Domain-error coverage: `100/78.26/100/100`.
- Generated-facts path-plus-NUL-plus-bytes aggregate digest: `6ded75a895908d43a70826a25f23f53c65866396116dcb7709ba43bfd4e3d1cf`.
- Immutable delivery claim: `a3f6a13bafc25b4c879dfdb59e09fa4914662fb6e192f6007484e5650982e40b` over `82` implementation files; exact claim slice `12/12` passed.
- `git diff --check`: passed before this evidence update and must be rerun after it.

## Sixth S1/S2 checkpoint and isolated S3 core

- The sixth independent S1/S2 checkpoint reported no findings: the repaired `4/4` file slice remains `54/54` green with strict TypeScript, focused ESLint, and diff hygiene passing.
- S3 began red-first: both new test suites initially failed to import the absent clip-library contract and evaluator modules.
- The mechanically green S3 core now defines bounded arbitrary clip libraries, canonical identities, exact source binding, reusable pose lookup, sparse/rest fill, linear and right-continuous step evaluation, explicit terminal samples, half-open loop/seam policy, root-anchor enforcement, continuity hooks, ordered multi-DOF pivot composition, exact assembly-hierarchy binding, and deterministic partial retries.
- The first independent S3 audit found three medium defects: malformed runtime batch members could escape structured failure, budget classification could lose precedence to a simultaneous compatibility issue, and mirror hooks could reference a valid reciprocal pair unused by the owning clip. All three were repaired with exact regressions and the independent confirmation pass closed every finding.
- S3 focused command: `npx vitest run tests/contracts/clip-library-v2.test.ts tests/animation/clip-library-v2.test.ts --maxWorkers=1`; result `2/2` files and `7/7` tests passed.
- Legacy compatibility command: `npx vitest run tests/animation/rigid-animation.test.ts tests/animation/authoring.test.ts tests/contracts/temporal-batch-interchange.test.ts --maxWorkers=1`; result `3/3` files and `19/19` tests passed.
- Strict TypeScript and architecture doctor passed after replacing the ambiguous wildcard export with explicit V2-named aliases and routing cross-module imports through the established barrels.
- Full `npm run lint` passed; dependency-cruiser examined `92` modules and `234` dependencies with no violations. Focused ESLint over the seven owned source/test integration files also passed independently.
- Generated architecture, routes, kit, tool, capability, and output facts were refreshed.
- Immutable delivery claim was rebound to `dd6a48f74ebc37bea5036a2b1592a2a8ea35f10d027109d65a4b94e586c303f3` over `84` implementation files. The freshness gate is green and the exact claim slice passes `12/12`.
- `git diff --check` passed before this Measure update and must be rerun after it.
- Full coverage was not rerun under the still-recorded constrained-load caveat. The isolated S3 core is mechanically green; public authoring, browser rendering, MCP replay, visual admission, Pixel ingestion, downstream validation, manual verification, commits, and Measure closeout remain incomplete.

## Open gates

- A current full coverage pass is pending. S1 and S2 remain `in_progress` despite the green sixth compiler/runtime checkpoint.
- Manual verification and user-authorized checkpoint handling are pending.
- Shared handler/catalog/MCP authoring and render wiring remains pending after the mechanically green S3 core; it requires a reviewed public API design and exclusive shared-file ownership transfer.
- Predecessor S14 Kimi visual acceptance, Pixel consumption, downstream browser-visible acceptance, and final Measure closeout remain incomplete.
- The repository-wide Prettier traversal reports pre-existing formatting warnings in archived/evidence JSON outside this track; those unrelated files were preserved.
