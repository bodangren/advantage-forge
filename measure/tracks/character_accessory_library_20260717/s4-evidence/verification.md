# Phase S4 Verification

Date: 2026-07-19

## Deterministic public-tool acceptance

Final root:
[`public-final-candidate-20260719T075230Z`](public-final-candidate-20260719T075230Z/summary.json)

| Loadout  | Calls | Equipped idle revision                                                      | Equipped action revision                                                    | Result |
| -------- | ----: | --------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------ |
| Guard    |    43 | `revision.4df756071666df9827b41217dceb6a703433931b94854945b5354db5678aba59` | `revision.9e8d887e7c55e543bae648d5a98de7ffdc963c02446b1725e56ec55d686f2aac` | pass   |
| Traveler |    37 | `revision.20df1e0fddce2e9bc589e9ed4d226b015446a92d5c1c24c68122b50ff5e7ab7e` | `revision.01c72e7d0706ca2576954b82f7934541cdc2fc739c7cae3d5e18d82f695a6bfc` | pass   |
| Ranger   |    43 | `revision.32a10f1cd7ac9d5dcd0a2e6023db7d3b21378abadec530652861f3232da770c2` | `revision.2644fedc0de2208f3002ea083e3d53b1a7f93d16fd67777b9291531c93767f12` | pass   |
| Caster   |    43 | `revision.214f2d84102a78cbbb81c8d06cca6a73ec886336c15c03985daef7b37ef26c59` | `revision.eefd8112aea7b290e3b6f6d3d6d5eeafd1d366568c8b9fbe45164db14ba72920` | pass   |

Each run used public MCP calls only, preserved its transcript, and covered
baseline, equipped idle, equipped action, and action-pose unequipped revisions.
All named accessory features passed width, visible area, occlusion, material
separation, clipping, ground-anchor, direction-order, and measured framing
checks in every intended direction.

The first measured-framing run intentionally remains a failed audit record: it
proved that the previous constant-zero value was not evidence. The final metric
is the absolute occupied-height deviation from the eight-direction median, and
the browser suite independently recomputes that value.

Earlier refinement runs briefly experimented with relaxed occlusion/material
thresholds and direction exclusions. An independent contract audit rejected
that approach. Those outputs are superseded and are not acceptance evidence;
the final run restores the original 0.8 occlusion ceiling, 0.05 OKLab minimum,
and all eight intended directions for every required accessory feature.

The workflow skill's `verify-artifacts.mjs` and pinned Three.js
`inspect-glb.mjs` passed for all eight final equipped idle/action GLBs.

## Fresh LLM acceptance

- [Ranger/Caster K3 report](llm-final-ranger-caster-20260719T062928Z/final-report.md):
  103 `forge_*` calls, zero non-Forge calls, and 20/20 exact dry-run/apply
  pairs. Both verdicts are partial. Ranger lacked an action GLB after four MCP
  timeouts. Caster completed both GLBs but exposed the baseline-equipment versus
  target-archetype cleanup seam. Direct image/3D review was unavailable to both
  Forge-only clients.
- [Guard/Traveler K3 report](llm-final-guard-traveler-20260719T062741Z/blocked-report.md):
  four bounded, unique OpenCode clients created no session and made zero calls.
  Guard recorded a K3 `ReleaseError: token mismatch`; later Guard and Traveler
  clients stalled at `init`. Their acceptance is Blocked, not failed Forge work.
- A safer unique-XDG Luna wrapper passed permission preflight with only the
  Forge MCP and every shell/file/browser/edit/task tool disabled. The external
  run was then stopped because risk-informed approval is required before
  sending repository-derived prompts and MCP responses to the provider. Its
  status is preserved as preflight-only / Not Assessed.

The K3 runs used explicit deny-all client configuration and their ledgers prove
that no non-Forge tool was called. A later audit found that OpenCode `--pure`
does not by itself remove globally installed agent definitions, so future runs
must use a unique `XDG_CONFIG_HOME`, a local `coder-*-forge-only` wrapper, a
resolved-permission preflight, and a non-Forge ledger rejection.

## Automated gates

- `pnpm install --frozen-lockfile`: pass.
- `pnpm test:coverage`: 34 files, 222 tests; 93.1% statements, 80.97% branches,
  97.57% functions, 93.6% lines.
- `pnpm typecheck`: pass.
- `pnpm lint`: ESLint and dependency-cruiser pass; 56 modules and 107
  dependencies, zero violations.
- `pnpm test`: 34 files and 222 tests pass.
- `pnpm build`: pass; Vite reports only the existing large-chunk warning.
- `pnpm reference:build`: pass after preserving its ignored transient revision
  outputs outside the worktree.
- `pnpm generate` and `pnpm doctor`: pass; generated facts current.
- `pnpm test:browser`: 2/2 pass, including native feature/framing evidence and
  inspector render/export behavior.
- `git diff --check`: pass.
- Monolithic `pnpm check`: formatting stopped on user-owned untracked benchmark
  JSON/Markdown and OpenCode state. Its substantive component gates were run
  separately and passed without rewriting those files.

## Phase verdict

Automated S4 acceptance passes. Overall phase acceptance remains **partial and
awaiting owner review** because visual polish is incomplete, Guard/Traveler
fresh-LLM sessions were blocked at client startup, direct exact-revision 3D
inspection is unavailable, and external engine import is Not Assessed.
