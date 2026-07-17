# Verification: LLM Authoring Workflow Hardening

## Phase S1: Expose Complete Current State

Status: automated verification passed; explicit owner confirmation pending.

### Automated evidence

| Check                                               | Result                                                                                                                                              |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Red test run                                        | Expected failure: `inspect_asset` rejected section paging and `compareRevisions` did not exist                                                      |
| Focused handler and MCP tests                       | Pass; exact current state, deterministic paging, connection port state, immutable reads, semantic comparison, and the 64 KiB MCP budget are covered |
| Full unit suite                                     | Pass: 19 files, 161 tests                                                                                                                           |
| Full coverage                                       | Pass: 94.19% statements, 83.69% branches, 96.49% functions, 94.77% lines                                                                            |
| New semantic-diff module coverage                   | Pass: 98.78% statements, 96.22% branches, 100% functions, 98.70% lines                                                                              |
| `pnpm typecheck`                                    | Pass                                                                                                                                                |
| `pnpm lint`                                         | Pass; no dependency violations across 51 modules and 85 dependencies                                                                                |
| `pnpm generate`                                     | Pass; architecture, routes, and public tool catalog regenerated                                                                                     |
| `pnpm doctor`                                       | Pass                                                                                                                                                |
| `env CI=true pnpm check` in an isolated clean clone | Pass; formatting, typecheck, lint, 161 tests, generated-fact freshness, and doctor                                                                  |
| `pnpm check` in the working checkout                | Not used as clean proof: it stops at Prettier because the supplied untracked benchmark dossier contains 11 pre-existing formatting mismatches       |
| Browser/actual-resolution visual review             | Not applicable to S1; this phase changes read-only semantic inspection and comparison, not rendering or artifacts                                   |

### Scope evidence

- `inspect_asset` now has an overview plus bounded `parts`, `connections`, `variants`, `poses`, and `renderProfiles` sections.
- Part inspection distinguishes authored base state from active variant/pose effective state and includes resolved world transforms and port definitions.
- `compare_revisions` reports deterministic field-level changes, affected semantic IDs, preserved semantic IDs, totals, truncation, and `nextOffset`.
- Unknown fields, missing revision IDs, and out-of-range pages return actionable structured issues.
- No response exposes raw positions, normals, indices, shell, filesystem, Blender, or arbitrary-code controls.
- This phase adds no accessories, novel identities, temporal animation, atlas generation, or new geometry.

### Owner manual verification procedure

Using the repository MCP server and its existing `adventurer.rustic` revision history:

1. List tools and confirm `inspect_asset` and `compare_revisions` are public read-only operations.
2. Call `inspect_asset` with `section: "parts"` and `limit: 100`; confirm the 19-part page reports authored and effective shape, transform, material, visibility, handedness, joint, world-transform, and port state without raw geometry.
3. Call `inspect_asset` with `section: "connections"` and `limit: 1`; confirm `total`, `truncated`, and `nextOffset`, then inspect both endpoint part/port IDs, port frames/tags/acceptance/cardinality, and joint state.
4. Inspect `variants`, `poses`, and `renderProfiles`; confirm active IDs remain visible in every response and the returned values are sufficient to preserve current state.
5. Compare base revision `revision.710000881f0fa51b34ea4aa206228240c60d45121d07b0c176403f13288398f1` to current revision `revision.53818aadc04450183639f332da418f42f95a2047847d6fcfdf40cc3f1e831523`; confirm localized field changes and preserved IDs are both reported.
6. Request a second page using `nextOffset`, then try an out-of-range offset and an unknown field; confirm deterministic continuation and actionable rejection.

Owner decision requested: approve Phase S1, or identify a concrete inspection/comparison gap before the S1 checkpoint.
