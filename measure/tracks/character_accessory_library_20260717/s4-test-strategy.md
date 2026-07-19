# Phase S4 Test Strategy — Character Readability

> Phase-scoped test strategy for `character_accessory_library_20260717` Phase S4
> (Verify Character Readability). Phases S1–S3 are closed and out of scope.
> Owner directive: do **not** reopen accepted visual remediation
> (`076199f`); retry only the fresh sandboxed LLM criterion. The plan still
> forbids waiving acceptance criteria.

## 1. Status of the phase at the strategy baseline

- Implementation, deterministic public-MCP harness, visual fidelity, exact-revision
  Kimi 3D review, artifacts, browser tests, build, lint, typecheck, doctor,
  coverage, generate, and `reference:build` all pass at `076199f`.
- The single open Must-level criterion is a *fresh* sandboxed MCP-capable LLM
  workflow for Guard, Traveler, Ranger, and Caster, using only the
  repository-local `fantasy-asset-workflow` skill and the public Forge MCP
  surface. The previous risk-disclosed `kimi-for-coding/k3` run passed its
  Forge-only isolation preflight but produced zero events, zero sessions, and
  zero Forge calls before the 624-second zero-progress cutoff.
- The owner has explicitly authorized `coder-*` subagents for one-off tasks
  and remediation; this is **not** authorization to weaken acceptance.

## 2. Testing pyramid for this evidence-only completion

| Layer             | Owned by this strategy | Where it runs                                     |
| ----------------- | ---------------------- | ------------------------------------------------- |
| Unit / contract   | yes (gate verification) | `pnpm test`, focused vitest targets              |
| Pixel / fixture   | yes (gate verification) | `pnpm test:browser`, deterministic harness       |
| Reference build   | yes (gate verification) | `pnpm reference:build`                           |
| Sandbox LLM       | yes (definitive gate)   | Fresh OpenCode client + forge MCP runtime        |
| Independent audit | yes (gate verification) | `verify-artifacts.mjs`, `inspect-glb.mjs`         |

No new product code is expected; this strategy is gate-verification plus a
bounded sandbox-LLM retry.

## 3. Shared fixtures, mocks, and live-proof expectations

- **Live fixtures**: the four committed loadouts (Guard, Traveler, Ranger,
  Caster) plus the sword-plus-round-shield regression; built by
  `node scripts/build-accessory-loadouts.mjs <evidence-root>` driven by public
  Forge MCP calls. The deterministic Node harness is a *preflight*, never a
  substitute for the LLM run.
- **Independent audits** (live, not mocks):
  - `.agents/skills/fantasy-asset-workflow/scripts/verify-artifacts.mjs`
    against every render manifest + GLB manifest pair;
  - `.agents/skills/fantasy-asset-workflow/scripts/inspect-glb.mjs` against
    every GLB manifest;
  - exact-revision Kimi 3D review of every idle/action revision;
  - browser native-frame evidence at 128×128 for the ordered accessory and
    material checks.
- **Mocks** are forbidden inside the sandboxed LLM run. Inside product tests,
  the only sanctioned mocks are MCP transport and `LocalBrowserArtifactService`
  fakes used by handler tests; the harness substitutes no live MCP server.
- **Artifact vs. live behavior**: PNG/GLB hash assertions are evidence
  *primitives*, not acceptance gates by themselves. Every artifact assertion
  must be paired with a live-behavior gate (browser pixel test, GLB importer
  audit, or deterministic harness call).

## 4. Cross-phase edges and dependencies

- S4 depends on the closed S1 grammar, S2 catalog, and S3 public workflow.
  No new S1–S3 contract changes are permitted; if a retry surfaces a contract
  gap, stop and re-open a remediation task rather than edit S1–S3 in place.
- The sandboxed LLM must consume the *same* canonical prompt as the prior
  attempt so the run is reproducible against the recorded `prompt.txt` /
  `prompt.md` SHA-256.
- The four loadouts' `baselineRevisionId` is created during the LLM run, not
  pre-seeded; that keeps the run genuinely fresh.

## 5. Architecture guardrails

- `fantasy-kit` remains template data and composition; no parallel equipment
  engine.
- `contracts` stays free of Three.js, filesystem, browser, and MCP imports.
- Adapters (`tools`, `mcp`, `inspector`) may depend inward on domain tools;
  domain modules never import adapters (enforced by `pnpm doctor`).
- `MCP_RESPONSE_BYTE_LIMIT = 64 KiB`; the sandboxed run must never bypass it.
- Public Forge tools only — no internal handlers, no source reads, no
  network/file/image/shell tools in the sandbox.

## 6. Phase S4 gate plan

### RED_TEST_COMMAND (targeted, bounded)

Run in order; each command must fail for the expected reason, not because of
aggregate noise:

```bash
pnpm exec vitest run tests/fantasy-kit/accessory-catalog.test.ts \
  tests/fantasy-kit/accessory-loadouts.test.ts \
  tests/fantasy-kit/accessory-usage.test.ts \
  tests/services/browser-artifacts.test.ts \
  tests/tools/accessory-workflows.test.ts
pnpm test:coverage
pnpm typecheck
pnpm lint
pnpm build
pnpm test:browser
pnpm reference:build
pnpm generate
pnpm doctor
```

These are **gate-verification** commands; they must remain green at the
strategy baseline. The single remaining Red surface is the sandboxed LLM run
described below.

### GREEN_TEST_COMMAND (sandboxed fresh LLM)

The orchestrator must execute exactly this sequence; any deviation must be
recorded as a deviation note:

```bash
# 1. Spawn one fresh OpenCode client per loadout in an isolated runtime dir
node scripts/run-sandboxed-llm.mjs --loadout guard   --out measure/tracks/character_accessory_library_20260717/s4-evidence/sandboxed-llm-<UTC>/guard
node scripts/run-sandboxed-llm.mjs --loadout traveler --out measure/tracks/character_accessory_library_20260717/s4-evidence/sandboxed-llm-<UTC>/traveler
node scripts/run-sandboxed-llm.mjs --loadout ranger   --out measure/tracks/character_accessory_library_20260717/s4-evidence/sandboxed-llm-<UTC>/ranger
node scripts/run-sandboxed-llm.mjs --loadout caster   --out measure/tracks/character_accessory_library_20260717/s4-evidence/sandboxed-llm-<UTC>/caster

# 2. Independent audits (must run after each LLM run, not before)
for L in guard traveler ranger caster; do
  node .agents/skills/fantasy-asset-workflow/scripts/verify-artifacts.mjs \
    --render-manifest measure/tracks/character_accessory_library_20260717/s4-evidence/sandboxed-llm-<UTC>/$L/equipped-idle/render-manifest.json \
    --glb-manifest     measure/tracks/character_accessory_library_20260717/s4-evidence/sandboxed-llm-<UTC>/$L/equipped-idle/glb-manifest.json \
    --expected-asset   adventurer.rustic \
    --expected-revision "$(jq -r .idleRevisionId measure/tracks/character_accessory_library_20260717/s4-evidence/sandboxed-llm-<UTC>/$L/result.json)"
  node .agents/skills/fantasy-asset-workflow/scripts/inspect-glb.mjs \
    --glb-manifest     measure/tracks/character_accessory_library_20260717/s4-evidence/sandboxed-llm-<UTC>/$L/equipped-idle/glb-manifest.json \
    --expected-asset   adventurer.rustic \
    --expected-revision "$(jq -r .idleRevisionId measure/tracks/character_accessory_library_20260717/s4-evidence/sandboxed-llm-<UTC>/$L/result.json)"
done

# 3. Aggregate summary
node scripts/aggregate-sandboxed-evidence.mjs \
  measure/tracks/character_accessory_library_20260717/s4-evidence/sandboxed-llm-<UTC>
```

`scripts/run-sandboxed-llm.mjs` (to be authored by the implementing coder
subagent, mirroring `measure/tracks/character_accessory_library_20260717/s4-evidence/llm-final-guard-traveler-20260719T062741Z/run-opencode.mjs`)
must:

- Use `--pure`, deny-all permissions, allow `forge_*` only.
- Spawn `node --import tsx src/mcp/stdio.ts` from a unique `/tmp/faf-*` runtime
  with `FORGE_INSPECTOR_URL` set, so each run is isolated and reproducible.
- Copy the workflow skill into the client workspace and pin
  `workflow/SKILL.md` + `workflow/references/*.md` as instructions.
- Persist `prompt.md`, `opencode-config.json`, raw `events.jsonl`, raw
  `stderr.log`, `tool-ledger.json`, `semantic-comparisons.json`,
  `client-final-response.md`, `visual-review-status.json`, `run-metadata.json`,
  and a `sha256sums.txt`.

### Closeout gate

The phase closeout is permitted **only** when all of these are true and the
evidence is bound to the candidate commit:

1. Four loadouts (`guard`, `traveler`, `ranger`, `caster`) each produced a
   completed OpenCode session, ≥ 1 `forge_*` call, and a non-empty
   `client-final-response.md` whose verdict is `pass` or `partial` (never
   `blocked` / `fail` / `not-assessed`).
2. Every loadout's equipped-idle and equipped-action revisions pass
   `verify-artifacts.mjs` and `inspect-glb.mjs` against the run's own
   `expectedRevisionId`.
3. Every dry-run/apply pair is identical except for `dryRun`, with the same
   operator envelope (`ok`, `affectedIds`, `summary`).
4. `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`,
   `pnpm test:browser`, `pnpm reference:build`, `pnpm generate`, `pnpm doctor`
   all pass at the strategy baseline `ddff848`.
5. `scripts/build-accessory-loadouts.mjs` produces zero issues for all four
   loadouts under the deterministic harness (regression guard).
6. `git status --porcelain` is clean after excluding `.opencode/`,
   `benchmark-evidence/`, `approval-and-benchmark.md`, `benchmark-report.md`,
   and the untracked `s4-evidence/**` directories — those are owner-owned and
   must not be staged or reformatted.
7. The committed `metadata.json` reflects the evidence root and the closeout
   `final-summary.json` enumerates every loadout's session id, revision ids,
   audit results, and SHA-256 inventory.

The monolithic `pnpm check` is **not** a closeout gate for this phase because
its `format:check` scans unrelated user-owned benchmark and historical
evidence files; the substantive gates are run individually.

## 7. Sandbox LLM retry — bounded retries, model freshness, infra vs. product

The orchestrator is permitted **at most two** fresh sandboxed runs (one
initial, one retry) per loadout before escalating. Each retry must change at
least one isolation variable:

1. Use a different `/tmp/faf-*` client workspace and runtime directory.
2. Use a different OpenCode `XDG_*`/config profile and `--pure` invocation.
3. Optionally switch the provider/model to a non-`k3` sandboxed LLM that
   satisfies the isolation contract.

Bounded per-loadout wall-clock budget: 900 s elapsed; per-run first-event
observation window: 240 s; if no event has been emitted, mark the run
`blocked / not-assessed` and proceed to the next loadout. If two consecutive
runs for the same loadout both time out before any event, the criterion for
that loadout is `Not Assessed` and phase acceptance cannot pass.

### Distinguishing infrastructure failure from product failure

| Symptom in the run metadata                                          | Verdict                                                |
| -------------------------------------------------------------------- | ------------------------------------------------------ |
| Zero events, zero sessions, zero tool calls                          | **Infrastructure** — `not-assessed`, retry permitted   |
| Session started, ≥ 1 `forge_*` call, but a tool envelope returns `ok:false` with a typed issue | **Product** — fail the loadout; do **not** retry infra |
| `release failed` / `token mismatch` / dependency install error before session | **Infrastructure** — `not-assessed`, retry permitted   |
| Session started, ≥ 1 `forge_*` call, then client looped or hallucinated non-forge tool | **Product** — fail the loadout, but record the hallucination as evidence |
| External provider rate-limited or 5xx mid-run                        | **Infrastructure** — record status, retry once         |

Only **Product** failures count against the Must-level criterion. Three or
more consecutive infrastructure failures across the four loadouts escalate to
the orchestrator and freeze the phase as `blocked-fresh-llm-infrastructure`.

### Model freshness and isolation

- The wrapper config must set `permission: { "*": "deny", "forge_*": "allow" }`
  and instruct the client to *never* read or search files, run shell
  commands, edit source, construct canonical JSON, post-process images, or
  use network tools.
- The wrapper config is the only `opencode.json` allowed in the runtime; it
  must be reproducible byte-for-byte from `run-metadata.json`.
- `risk-disclosed` external-provider approval (already given for `k3`) is
  required for any new external provider swap; record the disclosure file
  SHA-256 in `run-metadata.json`.

## 8. Anti-pattern coverage per gate

Every test in this strategy must have a falsification condition.

| Anti-pattern | Defense                                                                                   |
| ------------ | ----------------------------------------------------------------------------------------- |
| **A3** — unlabeled numeric evidence | Aggregate harness parses explicit `expectedFeatures[*].minimumPixelArea`, `minimumWidthPixels`, `maximumOcclusionRatio`, and `minimumOklabDistance` by labeled integer; rejects bare digit matches in acceptance. |
| **A4** — vacuous pass when nothing is complete | Closeout refuses to mark S4 complete while any of Guard/Traveler/Ranger/Caster is `Not Assessed`; `pnpm` checks the four-loadout harness, the pixel contract, and the artifact verifier each independently. |
| **A5** — plan claims exceed executed test reality | `verification.md` records the exact exit status of every command listed; `final-summary.json` is regenerated by `aggregate-sandboxed-evidence.mjs`, never hand-edited; `git status --porcelain` is checked at the end. |
| **A6** — registry overstates resolved capability | `metadata.json` stays `in_progress` and the track stays `in_progress` in `measure/tracks.md` until the fresh-LLM criterion is satisfied; `product.md#current-authoring-boundary` keeps the limitation language verbatim. |
| **A7** — over-broad refutation filter | The visual-review filter excludes only typed tool envelopes with explicit `Not Assessed` codes; it never matches bare English tokens. |
| **A8** — ambiguous legacy `[ ]` markers | Plan uses `[x]` for closed, `[~]` for active, `[b]` for deferred; the deferred items must keep `(deferred:orchestrator)` until evidence closes. |
| **A9** — tests retain active paths after archival | No archived-track test paths; archive happens only after final acceptance passes. |
| **A10** — generated facts drift | `pnpm generate` and `pnpm doctor` are required closeout gates and fail on stale `measure/generated/*`. |

The browser harness owner (Review C) and the UX auditor (UX) own durable
Playwright E2E coverage of the inspector and ordered native-frame evidence;
this strategy does **not** duplicate that ownership.

## 9. Review applicability for this evidence-only completion

| Role                       | Applicable | Why                                                                                                              |
| -------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------- |
| **Review A** (correctness, architecture) | yes | Verify the closeout gate commands really run against `076199f`+1 and the strategy's referenced symbols exist. |
| **Review B** (security, data) | yes (narrow) | Audit the sandboxed LLM wrapper for permission leaks, allow-listed tool patterns, and accidental file-read fallback. |
| **Review C** (UX/API)       | yes (narrow) | Confirm the four-loadout browser evidence is unchanged and pixel contract thresholds still hold. |
| **Adversarial**            | yes (narrow) | Confirm A3–A6 defenses: refutation by changing `minimumPixelArea`, removing a dry-run/apply pair, omitting a loadout, or hand-editing `final-summary.json` must fail the gate. |
| **UX browser**             | yes (narrow) | Already produced ten exact-revision Kimi 3D states + five-loadout contact sheets; this run only re-binds to the fresh-LLM artifacts. |

Security and adversarial reviewers must run their tests against the **fresh**
sandbox-LLM evidence root, not against the deterministic harness output.

## 10. Orchestrator hand-off and `phase_base_sha` capture

- The strategy commit must precede the orchestrator's `phase_base_sha`
  capture. The exact capture point is **immediately after the strategy commit
  is recorded in `git log` and before any fresh-LLM, remediation, or
  acceptance work begins**; it is the SHA of the strategy commit itself.
- Any SHA recorded in `verification.md`, `final-summary.json`, or the
  orchestrator audit that predates this strategy commit is invalid and must
  be rejected as evidence (A5).
- The owner-owned dirty paths `.opencode/`, `benchmark-evidence/`,
  `approval-and-benchmark.md`, `benchmark-report.md`, and the untracked
  `measure/tracks/character_accessory_library_20260717/s4-evidence/**`
  directories are **never** included in the strategy commit, the closeout
  commit, or the `phase_base_sha` provenance chain.

## 11. RED_TEST_COMMAND and GREEN_TEST_COMMAND — final form

```
RED_TEST_COMMAND = pnpm exec vitest run tests/fantasy-kit/accessory-catalog.test.ts tests/fantasy-kit/accessory-loadouts.test.ts tests/fantasy-kit/accessory-usage.test.ts tests/services/browser-artifacts.test.ts tests/tools/accessory-workflows.test.ts && pnpm test:coverage && pnpm typecheck && pnpm lint && pnpm build && pnpm test:browser && pnpm reference:build && pnpm generate && pnpm doctor && node scripts/build-accessory-loadouts.mjs measure/tracks/character_accessory_library_20260717/s4-evidence/red-preflight
GREEN_TEST_COMMAND = node scripts/run-sandboxed-llm.mjs --loadout guard && node scripts/run-sandboxed-llm.mjs --loadout traveler && node scripts/run-sandboxed-llm.mjs --loadout ranger && node scripts/run-sandboxed-llm.mjs --loadout caster && for L in guard traveler ranger caster; do node .agents/skills/fantasy-asset-workflow/scripts/verify-artifacts.mjs --render-manifest measure/tracks/character_accessory_library_20260717/s4-evidence/sandboxed-llm-$L/$L/equipped-idle/render-manifest.json --glb-manifest measure/tracks/character_accessory_library_20260717/s4-evidence/sandboxed-llm-$L/$L/equipped-idle/glb-manifest.json --expected-asset adventurer.rustic --expected-revision "$(jq -r .idleRevisionId measure/tracks/character_accessory_library_20260717/s4-evidence/sandboxed-llm-$L/$L/result.json)"; node .agents/skills/fantasy-asset-workflow/scripts/inspect-glb.mjs --glb-manifest measure/tracks/character_accessory_library_20260717/s4-evidence/sandboxed-llm-$L/$L/equipped-idle/glb-manifest.json --expected-asset adventurer.rustic --expected-revision "$(jq -r .idleRevisionId measure/tracks/character_accessory_library_20260717/s4-evidence/sandboxed-llm-$L/$L/result.json)"; done && node scripts/aggregate-sandboxed-evidence.mjs measure/tracks/character_accessory_library_20260717/s4-evidence/sandboxed-llm-$L && pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm test:browser && pnpm reference:build && pnpm generate && pnpm doctor
```

The phase **is not** declared passed here. Acceptance is owned by the
independent phase-acceptance auditor after these gates produce real, recorded
output against `phase_base_sha`.