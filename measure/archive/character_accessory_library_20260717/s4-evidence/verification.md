# Phase S4 Verification

Date: 2026-07-19

## Final public-tool aggregate

Selected root:
[`owner-port-attached-final2-20260719T190000Z`](owner-port-attached-final2-20260719T190000Z/summary.json)

| Loadout            | Calls | Equipped idle revision                                                      | Equipped action revision                                                    | Result |
| ------------------ | ----: | --------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------ |
| Guard              |    43 | `revision.ba020ca0852e09cea6e84501987177fda2a61ddccc2f073a405859075c02ed97` | `revision.8dc00a93abc7c808d1ac68f1617aa650e7d6277fd457102ee650ce644f32f68b` | pass   |
| Traveler           |    37 | `revision.8a08fcc1cacfb25e022335ae668db4313f4b0987cb5424c2e409f7878a83ab9d` | `revision.a5037f4952d0e89f6ce61f6866613e2031f16e711322db2b8ec13dbdb5a41ff0` | pass   |
| Ranger             |    43 | `revision.d63deb90908fb153c1c56c174d36f8049fce516ab7af109efd6ab3f3d09065b0` | `revision.59406ed7a15630d465a5fa2301be0557f0c4358c51eaba07c2487b335de19523` | pass   |
| Caster             |    43 | `revision.b0c8d8945fb5848ea24a724848b6e6cb99fba5eda33083506813b52bb349ba9a` | `revision.92a49b9440c5702e6e659037842d0cf532032d2bb0662a66984812e43b0eefdc` | pass   |
| Guard sword/shield |    31 | `revision.591cbf65c484c393e67a110b63f926fc4b23a0b3d5281ca67b07a2a15e42bc1c` | `revision.46d9f471d1de6df192a02f3b6ed3756e06e4fe670d323fa7d4e07ce94639c08c` | pass   |

All 197 calls used public Forge MCP tools. Every loadout covered a baseline,
equipped idle, equipped action, and unequipped comparison. All named features
passed their declared observable-direction area, width, occlusion, and material
separation thresholds. All eight directions still passed transparency,
grounding, clipping, attachment, semantic-presence, direction-order, and
framing validation.

The workflow skill's `verify-artifacts.mjs` and pinned Three.js
`inspect-glb.mjs` passed for all ten equipped idle/action artifact pairs.

## Browser and owner review

- Kimi WebBridge loaded every idle/action revision above into the live
  interactive inspector and verified the exact revision hash and pose before
  capturing the canvas.
- The owner directly inspected the five idle contact sheets, five action
  contact sheets, and ten exact-revision 3D screenshots.
- Independent visual review passed all five loadouts for the supported rigid
  scope.
- `pnpm test:browser`: 2/2 pass, covering ordered native accessory evidence
  and the inspector render/export path.

## Fresh LLM acceptance

Final K3 retry evidence:
[`sandboxed-k3-final-20260719T122824Z`](sandboxed-k3-final-20260719T122824Z/summary.json)

The retry used a unique client/runtime/XDG environment, a local
`coder-kimi-k3-forge-only` wrapper, deny-all non-Forge permissions, and
explicit risk disclosure for transmitting the prompt and Forge MCP
requests/results to the external provider. Guard passed preflight, but after 624
seconds OpenCode had produced:

- zero events,
- no session,
- zero Forge calls,
- zero non-Forge calls,
- no Forge MCP child, and
- empty stderr.

The process was terminated with exit 130 and no child remains. Guard is Blocked
/ Not Assessed; Traveler, Ranger, and Caster were not started after the
zero-progress bounded timeout and are Not Assessed. Earlier K3 evidence remains
partial and does not satisfy the final criterion.

## Historical gate record at `076199f`

The list below was recorded during the original acceptance attempt. A later
adversarial audit found that the catalog assertion was stale at this exact
commit and that browser/coverage tests were not repeatably green under resource
contention. Treat the pass counts as historical claims, not current acceptance
evidence. The stale catalog assertion was corrected at `8f71c1d`; final
acceptance uses gates rerun at the immutable final HEAD.

- Focused S4 tests: originally reported 25/25; later found to include a stale
  sword-catalog expectation.
- `pnpm test:coverage`: 34 files, 224 tests; 92.81% statements, 80.7%
  branches, 97.57% functions, 93.36% lines.
- `pnpm typecheck`: pass.
- `pnpm lint`: ESLint and dependency-cruiser pass; 56 modules, 107
  dependencies, zero violations.
- `pnpm build`: pass with the existing 837 KB chunk-size warning.
- `pnpm test:browser`: one 2/2 run passed, but repeated adversarial runs exposed
  timeout flakiness before the final serial-runner remediation.
- `pnpm reference:build`: pass.
- `pnpm generate` and `pnpm doctor`: pass; generated facts are current.
- `git diff --check`: pass.
- Ten render/GLB manifest audits and ten pinned Three.js importer audits: pass.
- Monolithic `pnpm check`: stops in `format:check` because it scans
  user-owned benchmark/OpenCode files and historical evidence with existing
  formatting drift. Its substantive component gates passed separately without
  rewriting unrelated artifacts.

## Phase verdict

This was the historical blocked verdict. It is superseded by
`owner-closure-decision.md`, the current `final-summary.json`, and immutable-HEAD
Measure acceptance. The fresh K3 path remains Not Assessed.
