# Product Guidelines

## Product Voice

- Use concrete workshop language: part, port, assembly, pose, palette, build, preview, validate, and export.
- Describe exactly what changed and which asset IDs were affected.
- Prefer measurable statements such as “the sword silhouette is four pixels wide at 128x128” over subjective assurances.
- Treat LLM output as a proposal that must compile and validate, not as authoritative state.
- Avoid anthropomorphic progress messages, vague creative claims, and decorative fantasy prose in operational surfaces.

## Interaction Principles

1. **Intent before mutation:** Show the interpreted asset target and proposed semantic patch before destructive or broad changes.
2. **Stable identity:** Every addressable asset, part, port, pose, material slot, and render profile has a stable ID.
3. **Localized revision:** Preserve unaffected document nodes and explicitly report the patch scope.
4. **Preview at delivery resolution:** Always make the 128x128 result available alongside any enlarged preview.
5. **Evidence beside claims:** Display validation results, triangle counts, frame occupancy, and before/after contact sheets with the changed asset.
6. **No hidden scene state:** If behavior cannot be reconstructed from the asset document, declared style profile, tool version, and seed, it is a defect.
7. **Failure is actionable:** Errors identify the invalid path, violated rule, actual value, expected value, and likely correction.

## LLM Tool Guidelines

- Expose task-level fantasy asset operations rather than rendering-engine or triangle-level controls.
- Tool schemas must reject unknown fields and invalid part/port combinations.
- Read operations must be cheap enough for the LLM to inspect before editing.
- Write operations return a structured patch summary, validation status, and revision identifier.
- Broad regeneration is never the automatic fallback for a failed local edit.
- Arbitrary code execution and raw filesystem access are prohibited tool capabilities.
- Downstream consumers, including Pixel Art Generator, use public MCP only. They must not import Forge source, call internal handlers, use absolute paths, or rely on a shared mutable filesystem.

## Visual Output Guidelines

- Favor silhouette readability and clear material separation over physical realism.
- Use flat or restrained toon shading with one documented lighting rig.
- Preserve consistent orthographic framing, ground anchor, transparent background, and light direction.
- Permit intersecting closed parts when the supported views remain correct; internal hidden geometry is not an MVP defect.
- Exaggerate small fantasy features when required to remain legible at output resolution.
- Never approve an asset solely from a large 3D viewport render.
- Before modeling a novel character for visual acceptance, preserve a provenance-bound generated turnaround/reference target covering front, three-quarter, side, and back views, or an owner-approved reduced view set. Obtain explicit owner approval first, then require side-by-side Kimi convergence evidence. Mechanical validity or transform-only compacting is not visual-identity proof.
- If no approved built-in image generator is callable, stop and report the dependency. Do not silently use MMX or another provider.
- Registered novel work uses `cute_chibi_v1` as its default profile. `heroic_stylized_v1` is secondary, original, and project-owned; apply only exaggerated silhouettes, material/value separation, and restrained detail as broad readability ideas. These profile contracts do not substitute for visual acceptance.
- Do not copy franchise characters, symbols, costumes, names, or distinctive combinations. Record originality/provenance review evidence; do not promise legal clearance or guarantees.

## Delivery and Interchange Guidelines

- The implemented base interchange manifest uses the exact ID `forge-asset-interchange-manifest/v1`, is closed-schema and canonically serialized, and pins a SHA-256 digest.
- The manifest identifies source revisions, profile ID/version, artifact digests, dimensions/media type, roles, and evidence references using portable identities.
- Forge preserves individual transparent 128x128 PNG frames and GLBs as independently required source delivery. Contact sheets are derived review artifacts. The mechanically implemented `forge-temporal-render-artifacts/v1` path now delivers timed source frames, a Forge-derived atlas, and exact source GLB through public digest-bound chunks. Atlas-only delivery remains invalid; Pixel validates and stages Forge bytes without recomputing its atlas. No mechanical result becomes pack art until motion and every frame pass Kimi review.
- The downstream completeness profile uses the exact implemented validation-contract ID `education-app-pack-profile/v1`; complete pack assembly remains blocked on animation output and accepted production inputs.

## Scope Guardrails

- A proposed capability belongs in the MVP only if the reference adventurer, crate, tree, cottage, sprite output, or GLB export cannot satisfy its acceptance criteria without it.
- New part templates should be data definitions unless the existing geometry grammar is demonstrably insufficient.
- A new geometry generator requires at least two committed reference uses or a documented replacement of a more complex feature.
- A new dependency requires an update to `tech-stack.md` before implementation.
- Optional content packs, additional styles, and general editing affordances remain deferred until their planned track is verified. Archived rustic work is historical evidence and is not rewritten to simulate these planned capabilities.
