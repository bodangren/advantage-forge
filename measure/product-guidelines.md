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

## Visual Output Guidelines

- Favor silhouette readability and clear material separation over physical realism.
- Use flat or restrained toon shading with one documented lighting rig.
- Preserve consistent orthographic framing, ground anchor, transparent background, and light direction.
- Permit intersecting closed parts when the supported views remain correct; internal hidden geometry is not an MVP defect.
- Exaggerate small fantasy features when required to remain legible at output resolution.
- Never approve an asset solely from a large 3D viewport render.

## Scope Guardrails

- A proposed capability belongs in the MVP only if the reference adventurer, crate, tree, cottage, sprite output, or GLB export cannot satisfy its acceptance criteria without it.
- New part templates should be data definitions unless the existing geometry grammar is demonstrably insufficient.
- A new geometry generator requires at least two committed reference uses or a documented replacement of a more complex feature.
- A new dependency requires an update to `tech-stack.md` before implementation.
- Optional content packs, additional styles, and general editing affordances remain deferred until the initial track is verified.
