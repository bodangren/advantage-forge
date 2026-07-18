# Phase S4 Kimi acceptance report

## Outcome

The fresh `kimi-for-coding/k3` client completed the seeded workflow through 18 public `forge_*` calls with no built-in, shell, file, source, or network tool calls. All three dry-run/apply pairs were identical except for `dryRun`, no retry or correction was needed, and the immutable lineage is:

1. `revision.8044813bcf514c8bea35331db437de0e5c1a2c7961e7b87ddc9a635b493b355b` - created baseline.
2. `revision.a521b0d40b3edfda8039963cfe0d2d066a079d2d7891d44bca6add739c890618` - torso width broadened from 0.52 to 0.572.
3. `revision.fc7581f73264f0de84a80ebd3fe6630b97a7081373a364b85d10db94b6dd9a1a` - action pose selected.
4. `revision.d5d5b50da9ea46803f99118eb65dddcfebfb4fa1f58ea327ab44316f93ca2679` - unequipped final state.

Kimi's own verdict was **Partial**, correctly refusing to claim visual, verifier, or importer evidence it could not observe. Independent audits close those three gates and therefore make the combined run **Pass for the bounded S4 workflow**.

## Public semantic evidence

- Capability preflight preceded creation and mutation.
- Five bounded inspections obtained overview, all 19 parts, all 6 variants, both poses, and the render profile.
- Baseline-to-broadened comparison changed only `torso` and preserved 81 semantic IDs.
- Independent baseline-to-final comparison reports exactly three field changes: active pose, active variant, and the localized torso shape override. It preserves 81 unrelated semantic IDs.
- Final validation passed at 1,396 / 2,000 triangles with 604 remaining.
- Final render produced eight 128x128 frames and a contact sheet. Final export produced a 54,336-byte GLB.

## Independent artifact and visual audit

- Artifact verifier: Pass. All eight PNGs are native 128x128, hashes are recorded, the contact sheet is 512x292, and the GLB header, size, identity, and policy fields pass.
- Visual review: Pass for the requested result. No visible clipping, consistent grounding and framing, distinct materials, visible torso broadening, a consistent action pose, and no sword/shield in the requested unequipped state. E/W silhouettes are legible but visibly thin.
- Three.js GLTFLoader 0.185.1: Pass. Y-up, meter unit, dimensions 2.284680 x 3.009558 x 0.437639 m, ground Y -0.679558 m, 18 expected semantic nodes, five materials, no missing/unexpected/duplicate nodes, and zero cameras, lights, skins, textures, or animations.

## Reproducibility finding and repair

The exact LLM run used implementation commit `29ff877` and initially left its new revision artifact directory untracked. This was a real S4 failure, not hidden evidence. The final S4 candidate adds a narrow ignore rule for ad-hoc `artifacts/reference/*/revision.*` directories while proving all committed reference manifests remain tracked. The final clean-clone log and empty `git-status.txt` are generated after the evidence commit.

## Honest remaining product gaps

- Only sword and shield are available; helmets, armor shells, alternate weapons, packs, capes, quivers, and other accessories remain unsupported.
- New character identities and arbitrary anatomy remain unsupported.
- Poses are static rigid presets. Temporal animation, clips, sprite atlases, and animated/skinned GLB remain unsupported.
- Three.js GLTFLoader is the only representative importer assessed. Unity, Godot, and gameplay-runtime integration remain Not Assessed.
- This unequipped run does not close the known equipped thin-sword visibility limitation.
