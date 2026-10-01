# Tech debt registry

Keep this working memory within 50 lines. Track plans contain detailed repair steps.
Severity: Critical, High, Medium, Low. Status: Open or Resolved.
Baseline evidence comes from September 28, 2026; rerun checks before closing an item.

| ID | Date | Track | Item | Severity | Status | Evidence or exit condition |
| --- | --- | --- | --- | --- | --- | --- |
| TD-01 | 2026-09-28 | [Asset quality](./tracks/asset_quality_20260928/) | 139 asset type errors | High | Open | [Compiler output](./evidence/typecheck-20260928.txt); compiler and affected reviews must pass. |
| TD-02 | 2026-09-28 | [Labyrinth](./tracks/game_labyrinth_goblin_king_20260928/) | Two rules failures and one test type error | High | Open | [Test output](./evidence/tests-20260928.txt); focused tests and compiler must pass. |
| TD-03 | 2026-09-28 | [Model packs](./tracks/game_model_packs_20260928/) | Pack generator remains absent; battle view imports the vault scene | High | Open | Generate validated packs and remove the transitional import. |
| TD-04 | 2026-09-28 | [Asset delivery](./tracks/asset_delivery_20260928/) | Export and sprite acceptance lacks a complete source-revision record | Medium | Open | Reconcile source, export, clips, presets, and review evidence. |
| TD-05 | 2026-09-28 | [Scene planning](./tracks/asset_scenes_adventure_20260928/) | Blueprint statuses lag behind scene artifacts | Medium | Open | Reconcile all four scene groups through the scope map. |
| TD-06 | 2026-09-28 | [Production controls](./tracks/asset_production_controls_20260928/) | Trial path escapes and provider failures interrupted production | High | Open | Validate isolation and retry safeguards before restarting batches. |
| TD-07 | 2026-09-28 | [Dependency launcher](./tracks/measure_dependency_launcher_20260928/) | pnpm attempts dependency reconciliation during checks | Medium | Open | Declared scripts run without unexpected dependency replacement. |
| TD-08 | 2026-09-28 | [P0 acceptance](./tracks/asset_p0_acceptance_20260928/) | Review scores and source coverage do not establish final acceptance | Medium | Open | Review accepted renders, sprites, clips, and warnings. |
| TD-09 | 2026-09-28 | [Engine backlog](./tracks/asset_engine_backlog_20260928/) | README lists IK as absent although motion code implements IK helpers | Low | Open | Reconcile capability claims against code. |

| TD-10 | 2026-09-28 | [Asset delivery](./tracks/asset_delivery_20260928/) | Local smoke GLB lacks a source file | Medium | Open | Recover provenance or record an approved retirement decision. |

| TD-11 | 2026-09-28 | [2D parity](./tracks/game_2d_parity_20260928/) | Sprites omit unlocked looks; the fallback lobby uses a plain background | Medium | Open | Verify the agreed fallback presentation and preset behavior. |
| TD-12 | 2026-09-28 | [Thai content](./tracks/game_thai_localization_20260928/) | Generated Thai glosses need human review before the port | High | Open | Record reviewer evidence and localization checks. |
| TD-13 | 2026-09-30 | [Engine backlog](./tracks/asset_engine_backlog_20260928/) | The sprite renderer drops every surface below opacity 0.5 (binary alpha, coverage 0.5 in src/render/pixel.ts), so glass and mist vanish from sprites unless the body opacity is 0.5 or more | Medium | Open | Sprites keep see-through bodies (a hit-based coverage or a per-body sprite opacity) and the potion glass renders at its 3D opacity. |

Planned features remain in tracks. Debt records known deficiencies, shortcuts, and missing verification.
The game roadmap also records preset parity and content-review requirements before port acceptance.
