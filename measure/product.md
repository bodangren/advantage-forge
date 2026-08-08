# Initial Concept

Create a purpose-specific, LLM-first semantic 3D/raster producer for stylized fantasy assets. Forge owns reusable parameterized parts, versioned semantic assets, transparent frames, and GLB delivery; it deliberately avoids Blender, general-purpose DCC backends, and downstream-app assembly.

# Product Definition

## Vision

Fantasy Asset Forge turns a fantasy brief into a versioned semantic asset document, deterministic 3D assembly, and consistent source delivery outputs. It is a specialized asset compiler and workshop designed around LLM tool use, not a human modeling interface with automation added afterward. Pixel Art Generator is the named downstream educational-app pack assembler and consumes Forge only through Forge's public MCP surface.

## Core Problem

General 3D applications expose thousands of stateful concepts that make LLM-driven creation difficult to constrain, reproduce, validate, and maintain. Text-to-3D generators can produce isolated meshes, but do not provide a reliable semantic workflow for local edits, style consistency, attachment points, repeatable variants, or sprite production.

## Target User

The primary user is a small fantasy RPG game team or technical creator who wants an LLM to produce coherent low-poly assets and sprite-ready views through explicit, auditable operations. Direct human inspection is supported, but the main authoring workflow is LLM-to-domain-tools.

## Product Principles

1. **Semantic source of truth:** Assets are stored as typed, human-readable documents containing named parts, parameters, ports, materials, poses, and render profiles.
2. **LLM-first operations:** Tools operate on fantasy-domain concepts and stable IDs, never anonymous vertices or simulated UI gestures.
3. **Small deterministic engine:** The runtime owns a constrained geometry and assembly grammar; it does not embed Blender or recreate a general DCC.
4. **Profiled original art direction:** Registered novel work uses `cute_chibi_v1` as its default profile. The secondary `heroic_stylized_v1` is project-owned and uses only broad readability ideas—exaggerated silhouettes, material/value separation, and restrained detail. Profile metadata does not substitute for visual acceptance.
5. **3D and sprites from one build:** The preview, GLB export, and sprite renderer evaluate the same asset document.
6. **Local edits over regeneration:** A request to change a forearm, roof, sword, or branch patches the relevant part without rebuilding unrelated content.
7. **Evidence-driven completion:** Structural validation and fixed-resolution visual contact sheets are required before an output is considered successful.
8. **Portable public interchange:** Forge delivers static source artifacts and closed, digest-pinned manifests through public MCP; downstream applications do not import Forge source, invoke internal handlers, use absolute paths, or share mutable filesystems with Forge.

## Style and Originality Direction

- `cute_chibi_v1` is the default profile for registered novel work.
- `heroic_stylized_v1` is secondary, original, and project-owned. It may use broad readability principles only; copied franchise characters, symbols, costumes, names, or distinctive combinations are explicitly prohibited.
- On acceptance, profile review will record originality and provenance evidence. It will not make legal guarantees.

## Normative Coordinate System

- World space is right-handed and measured in meters.
- +X is east/right, +Y is up, and +Z is north/forward.
- Transforms serialize position as XYZ, rotation as quaternion XYZW, and scale as XYZ.
- Direction labels describe camera positions around the asset: N is viewed from +Z, E from +X, S from -Z, and W from -X.
- Reference assets rest on the Y=0 ground plane. Sprite output normalizes visible ground contact to the render profile's declared bottom padding row.
- Negative scale is permitted only for explicit mirrored subassemblies; mirrored instances swap left/right handedness metadata.

## MVP Outcome and Current Direction

An LLM can create and revise a rustic fantasy adventurer assembled from rigid parametric parts, equip it with a sword and shield, pose it, render an eight-direction transparent sprite contact sheet, and export a GLB. The same engine also assembles one crate, one tree, and one cottage module set to demonstrate that the part-and-port abstraction is reusable across characters, props, vegetation, and structures.

This is the historical rustic baseline; it is not rewritten by the new direction. Static Forge-to-Pixel Art Generator public-MCP interchange is technically accepted, and bounded novel-identity initialization, registered-grammar composition, revision safety, and static public delivery are implemented for the advertised humanoid and banded-container archetypes. Bounded single-clip rigid temporal rendering, derived atlas production, exact source-GLB binding, and public manifest/chunk retrieval are now mechanically implemented and deterministic on the pinned host. The current motion proof and all novel guard candidates remain visually rejected. Novel-character acceptance still requires an owner-approved provenance-bound generated reference target and side-by-side Kimi convergence; the five production clips and downstream educational-app pack assembly remain later gates.

## Public Delivery and Downstream Boundary

- The accepted static shared base contract is exactly `forge-asset-interchange-manifest/v1`. It is closed-schema, canonically serialized, SHA-256 digest-pinned, and portable, carrying artifact digests, source revisions, profile ID/version, dimensions/media type, roles, and evidence references.
- Forge preserves individual transparent 128x128 PNG frames and GLBs as independently required source-delivery artifacts. The public temporal render-artifact contract now binds individual frames, deterministic derived atlas metadata/bytes, and the exact source GLB in one digest-bound delivery. Atlas-only delivery cannot satisfy the source contract, and the broader multi-clip delivery metadata contract still requires reconciliation before pack admission.
- The downstream educational completeness validation contract is exactly `education-app-pack-profile/v1`; complete pack assembly remains blocked on animation output and accepted production inputs.
- Pixel Art Generator is the downstream educational-app pack assembler. Its static adapter now validates and stages Forge public-MCP artifacts against a code-owned acceptance binding, while final-art admission remains fail-closed pending delivery-resolution review. It may not recompute Forge animation atlases, import Forge source, call internal handlers, use absolute paths, or share mutable filesystem state.
- Existing contact sheets remain review evidence, not atlas or educational-pack delivery.

## MVP Capabilities

- Versioned asset documents with schema validation and stable semantic identifiers.
- A bounded procedural shape set: box, beveled box, wedge, prism, cylinder, cone, ellipsoid, capsule, extruded profile, lathed profile, tube path, and flat card.
- Parts with typed parameters, material slots, transforms, connection ports, compatibility rules, and bounds.
- Rigid accessories declare one of six equipment slots, attachment ownership, handedness, compatible anatomy and archetypes, layer/intersection limits, pose compatibility, triangle budgets, and delivery-resolution feature evidence.
- Assemblies with parent-child transforms, port connections, mirroring, rigid joints, poses, and deterministic variants.
- A fixed fantasy palette and material families for wood, stone, iron, bronze, leather, cloth, skin, foliage, bone, and crystal.
- A rustic-human MVP kit for humanoid parts, seventeen static accessories, crate, tree, and cottage modules.
- A domain tool API suitable for MCP and in-process tool calling.
- Browser-based 3D inspection and fixed orthographic preview rendering.
- Transparent one-, four-, and eight-direction sprite output plus contact sheets.
- GLB export and mechanical validation of schema, ports, bounds, ground contact, scale, triangle budget, and frame occupancy.

## Current Authoring Boundary

The public `inspect_capabilities` preflight is the executable source for this boundary:

- Supported creation includes the four committed reference identities plus deterministic initialization of bounded rustic-humanoid and banded-container novel identities. Initialized novel identities expose provenance, lineage, completeness, and missing requirements and cannot validate, render, export, or enter interchange until complete.
- Supported static character equipment is exactly the seventeen registered sword, shield, head, hand, body, back, and waist templates. Their identities, geometry, ports, materials, bounds, budgets, and required-feature contracts are inspectable.
- Compatibility-filtered accessory discovery and task-level public equip, replace, swap-hand, recolor, and unequip operations are exposed through the public tool surface (`accessory_discover`, `accessory_equip`, `accessory_replace`, `accessory_swap_hand`, `accessory_recolor`, `accessory_unequip`) with dry-run/apply envelopes and revision preconditions. Generic semantic operations still require exact template, part, and port knowledge.
- The four reference loadouts — guard, traveler, ranger, caster — plus a sword-plus-round-shield regression have deterministic public-MCP reconstructions, exact-revision interactive 3D evidence, native 128×128 contact-sheet matrices, and reload-verified GLB artifacts. Pixel identity evidence is limited to documented physically observable directions; attachment and validation remain eight-directional.
- Supported static motion state includes rigid pose snapshots. The public temporal subset additionally accepts one bounded semantic rigid clip through `render_preview.animation`, samples interpolation into individual frames, creates a deterministic derived atlas, binds the exact source GLB, and exposes all bytes through public retrieval. It remains partial: the proof motion is rejected, the five-clip set and batch delivery are missing, and the GLB itself is not animated.
- Supported outputs are directional transparent PNG frames, a review contact sheet, reload-verified GLB, and the mechanically implemented temporal frame/atlas/source-GLB delivery. A static contact sheet is evidence, not an animation atlas contract.
- Bounded completed identities are supported only for the two advertised archetypes and registered grammar. Broad `asset.new_identity` remains partial because arbitrary anatomy, templates, generators, and raw mesh operations remain unavailable rather than hidden behind source or file access.
- Mechanical completion is not novel-character visual acceptance. An accepted character requires a provenance-bound generated turnaround/reference target covering front, three-quarter, side, and back views unless the owner approves a reduced set, explicit owner approval before modeling, and side-by-side Kimi convergence. The generator/provider is unresolved and MMX is not implicitly authorized.
- The pinned Three.js `GLTFLoader` passes as a representative format importer with direct scale, orientation, node, material, and error evidence. Unity, Godot, and gameplay-runtime integration remain Not Assessed.
- A fresh third-party `kimi-for-coding/k3` authoring run on this host produced no session, no Forge call, and no provider evidence and remains **Not Assessed**. The deterministic public-MCP reproduction plus independent LLM/browser review is the approved substitute evidence for the S4 closure; registry readers must not infer that the K3 external-authoring path passed.

## Explicitly Out of Scope

- Blender, Maya, Houdini, Godot, Unity, or another DCC/game engine as a backend.
- Arbitrary vertex, edge, face, sculpting, UV-painting, or topology-editing tools.
- Photorealism, authored texture painting, general shader graphs, fluids, particles, weather, or physics.
- Skeletal skinning, weight painting, inverse kinematics, cloth, hair simulation, or deforming animation.
- Dragons, quadrupeds, wings, tentacles, and arbitrary creature anatomy.
- Complete terrain or level generation, building interiors, and general scene composition.
- General-purpose importing, plug-ins, scripting, arbitrary code execution, and non-GLB 3D export formats.
- Multiple art styles, camera systems, or fantasy culture motif families in the current MVP. The planned named profiles remain bounded by the originality/provenance direction above.
- A full graphical modeling editor; the visual surface is for inspection, comparison, and approval.

## Success Criteria

- The complete reference asset set builds from committed documents with no manual scene edits.
- Rebuilding the same document and seed produces equivalent scene structure and output framing.
- The LLM can make localized parameter and assembly edits through documented tools without raw mesh access.
- The adventurer can produce at least three proportion variants, two rigid poses, equipped and unequipped states, eight directional sprites, and a GLB without engine code changes.
- The crate, tree, and cottage demonstrate reuse of the same part, port, material, validation, and render systems.
- At 128x128 output, required silhouette features remain at least three pixels wide and all sprites share a stable ground anchor and framing contract.
- Automated contract and geometry tests exceed 80% coverage, and reference renders pass explicit human visual verification before track closeout.

## Future Consideration, Not Commitment

- Additional fantasy motifs such as dwarven, elven, orcish, undead, and enchanted forest.
- Rigid-part animation clips and derived atlases for walk, attack, hurt, and death cycles.
- Robust mesh booleans where layered closed meshes are insufficient.
- Skeletal deformation, texture baking, more creature families, and engine-specific exporters only after MVP evidence justifies them.
