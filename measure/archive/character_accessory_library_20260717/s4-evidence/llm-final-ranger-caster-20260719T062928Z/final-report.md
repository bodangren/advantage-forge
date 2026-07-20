# S4 source-free Kimi acceptance: Ranger and Caster

## Outcome

Two fresh OpenCode 1.18.3 clients ran `kimi-for-coding/k3` in separate client and runtime workspaces. Each client used `--pure`, denied all built-in permissions, and allowed only the configured `forge_*` MCP surface. The raw streams contain 103 public forge calls, zero non-forge calls, and 20 successful dry-run/apply pairs whose inputs are identical except for `dryRun`.

Both client verdicts are **partial**. Neither deterministic Node harness output nor another session is represented as LLM evidence.

## Ranger

- Session: `ses_086eb8a99ffeM5eVVflQpzvssT`
- Calls: 53 forge, 0 non-forge; 10/10 exact dry-run/apply pairs.
- Lineage: fresh baseline to equipped idle to equipped action to action-pose unequipped.
- Equipped idle: semantic comparison, validation, eight-frame metrics, render, and GLB succeeded. The independent artifact verifier and pinned Three.js GLTFLoader audit both pass.
- Equipped action: semantic comparison, validation, and all eight frames succeeded, but `export_asset` timed out four times. No action GLB was produced or substituted.
- Correction: the initial shield could not be unequipped under archetype `ranger`; the client followed runtime guidance and retried that response-derived part under archetype `adventurer`.
- Verdict: **partial** because the equipped-action GLB is missing and direct 3D/contact-sheet/native-frame visual review was unavailable to the forge-only client.

## Caster

- Session: `ses_086ddf094ffebgXzREdKAT1C3Q`
- Calls: 50 forge, 0 non-forge; 10/10 exact dry-run/apply pairs.
- Lineage: fresh baseline to equipped idle to equipped action to action-pose unequipped.
- Equipped idle and action: semantic comparisons, validation, all eight-frame metrics, renders, and GLBs succeeded. The independent artifact verifier and pinned Three.js GLTFLoader audit pass for both GLB-producing revisions.
- Corrections: the returned staff replacement failed while the default shield remained because that shield is not Caster-compatible. Unequipping the shield under archetype `caster` also failed. Runtime guidance required removing the response-derived default shield under archetype `adventurer` before Caster operations could proceed. Both rejected envelopes remain in the ledger.
- Verdict: **partial** because direct 3D/contact-sheet/native-frame visual review was unavailable to the forge-only client. The semantic and artifact subset passes after the documented compatibility correction.

## Workflow finding

The target-archetype transition has a public cleanup seam: a fresh adventurer starts with equipment that may be incompatible with the requested archetype, but target-archetype validation can reject both the requested replacement and removal of the incompatible default item. Guidance should explicitly say to clear incompatible baseline equipment under the baseline `adventurer` archetype before switching to the requested loadout archetype, or the operation contract should permit response-derived unequip without validating unrelated current equipment against the target archetype.

## Visual and integration boundary

The LLM clients correctly marked the interactive 3D view, contact-sheet imagery, native 128x128 image inspection, audit scripts, and independent importer as Not Assessed because their allowed surface contained only forge tools. After the clients exited, the audit-only verifier and Three.js GLTFLoader were run independently for every complete render/GLB pair and their JSON reports are preserved. Direct visual review remains Not Assessed in this bundle. Unity, Godot, and gameplay-runtime import remain Not Assessed; temporal animation, atlases, cloth physics, gameplay inventory, novel identity/anatomy, and raw mesh authoring remain unsupported.

## Candidate identity caveat

The clients ran against the live dirty S4 implementation worktree at their respective launch times. Both metadata files record tracked commit `2fcbd31e0728163d5f04601066e09fad21ddb2f8` plus a pre-launch hash over the listed relevant modified files. The shared worktree changed between Ranger and Caster while other approved S4 work continued, so the scoped diff hashes differ. Runtime capability responses, raw public calls, immutable revision IDs, and artifact hashes are authoritative for what each client observed.

## Preserved evidence

Each run directory contains the exact prompt and hash, deny-all config and hash, raw JSON events, empty stderr log, native OpenCode session export, ordered tool ledger, run metadata, client final report, source-free client inventory, runtime artifact hashes, explicit visual-review status, and independent artifact/importer reports. `summary.json` provides the machine-readable cross-run index.
