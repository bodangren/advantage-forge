# Initial Concept

Create a purpose-specific, LLM-first project for building 3D game assets that can also be rendered into 2D sprites. The product is limited to stylized fantasy RPG content, uses reusable parameterized parts for humanoids, structures, trees, equipment, and props, and deliberately avoids Blender or another general-purpose DCC backend.

# Product Definition

## Vision

Fantasy Asset Forge turns a fantasy RPG asset brief into a versioned semantic asset document, a deterministic 3D assembly, and consistent game-ready outputs. It is an asset compiler and workshop designed around LLM tool use, not a human modeling interface with automation added afterward.

## Core Problem

General 3D applications expose thousands of stateful concepts that make LLM-driven creation difficult to constrain, reproduce, validate, and maintain. Text-to-3D generators can produce isolated meshes, but do not provide a reliable semantic workflow for local edits, style consistency, attachment points, repeatable variants, or sprite production.

## Target User

The primary user is a small fantasy RPG game team or technical creator who wants an LLM to produce coherent low-poly assets and sprite-ready views through explicit, auditable operations. Direct human inspection is supported, but the main authoring workflow is LLM-to-domain-tools.

## Product Principles

1. **Semantic source of truth:** Assets are stored as typed, human-readable documents containing named parts, parameters, ports, materials, poses, and render profiles.
2. **LLM-first operations:** Tools operate on fantasy-domain concepts and stable IDs, never anonymous vertices or simulated UI gestures.
3. **Small deterministic engine:** The runtime owns a constrained geometry and assembly grammar; it does not embed Blender or recreate a general DCC.
4. **One coherent art direction:** The MVP supports a single stylized low-poly fantasy visual language and a controlled palette-material system.
5. **3D and sprites from one build:** The preview, GLB export, and sprite renderer evaluate the same asset document.
6. **Local edits over regeneration:** A request to change a forearm, roof, sword, or branch patches the relevant part without rebuilding unrelated content.
7. **Evidence-driven completion:** Structural validation and fixed-resolution visual contact sheets are required before an output is considered successful.

## Normative Coordinate System

- World space is right-handed and measured in meters.
- +X is east/right, +Y is up, and +Z is north/forward.
- Transforms serialize position as XYZ, rotation as quaternion XYZW, and scale as XYZ.
- Direction labels describe camera positions around the asset: N is viewed from +Z, E from +X, S from -Z, and W from -X.
- Reference assets rest on the Y=0 ground plane. Sprite output normalizes visible ground contact to the render profile's declared bottom padding row.
- Negative scale is permitted only for explicit mirrored subassemblies; mirrored instances swap left/right handedness metadata.

## MVP Outcome

An LLM can create and revise a rustic fantasy adventurer assembled from rigid parametric parts, equip it with a sword and shield, pose it, render an eight-direction transparent sprite contact sheet, and export a GLB. The same engine also assembles one crate, one tree, and one cottage module set to demonstrate that the part-and-port abstraction is reusable across characters, props, vegetation, and structures.

## MVP Capabilities

- Versioned asset documents with schema validation and stable semantic identifiers.
- A bounded procedural shape set: box, beveled box, wedge, prism, cylinder, cone, ellipsoid, capsule, extruded profile, lathed profile, tube path, and flat card.
- Parts with typed parameters, material slots, transforms, connection ports, compatibility rules, and bounds.
- Rigid accessories declare one of six equipment slots, attachment ownership, handedness, compatible anatomy and archetypes, layer/intersection limits, pose compatibility, triangle budgets, and delivery-resolution feature evidence.
- Assemblies with parent-child transforms, port connections, mirroring, rigid joints, poses, and deterministic variants.
- A fixed fantasy palette and material families for wood, stone, iron, bronze, leather, cloth, skin, foliage, bone, and crystal.
- A rustic-human MVP kit for humanoid parts, sword, shield, crate, tree, and cottage modules.
- A domain tool API suitable for MCP and in-process tool calling.
- Browser-based 3D inspection and fixed orthographic preview rendering.
- Transparent one-, four-, and eight-direction sprite output plus contact sheets.
- GLB export and mechanical validation of schema, ports, bounds, ground contact, scale, triangle budget, and frame occupancy.

## Current Authoring Boundary

The public `inspect_capabilities` preflight is the executable source for this boundary:

- Supported creation starts from exactly four committed identities: adventurer, crate, tree, and cottage.
- Supported character equipment is exactly the registered static sword and shield. The accessory surface is partial, not a general library.
- Sword and shield use the same closed accessory metadata contract planned for the broader library; contract availability alone does not make unregistered equipment supported.
- Supported motion state is a static rigid pose snapshot. Temporal clips, frame interpolation, animation playback/export, and runtime sprite atlases are unsupported.
- Supported outputs are directional transparent PNG frames, a review contact sheet, and reload-verified GLB. The contact sheet is evidence, not an animation atlas contract.
- New asset identities, unavailable accessories, unsupported anatomy, skeletal deformation, and raw mesh operations are unsupported rather than hidden behind source or file access.
- The pinned Three.js `GLTFLoader` passes as a representative format importer with direct scale, orientation, node, material, and error evidence. Unity, Godot, and gameplay-runtime integration remain Not Assessed.

## Explicitly Out of Scope

- Blender, Maya, Houdini, Godot, Unity, or another DCC/game engine as a backend.
- Arbitrary vertex, edge, face, sculpting, UV-painting, or topology-editing tools.
- Photorealism, authored texture painting, general shader graphs, fluids, particles, weather, or physics.
- Skeletal skinning, weight painting, inverse kinematics, cloth, hair simulation, or deforming animation.
- Dragons, quadrupeds, wings, tentacles, and arbitrary creature anatomy.
- Complete terrain or level generation, building interiors, and general scene composition.
- General-purpose importing, plug-ins, scripting, arbitrary code execution, and non-GLB 3D export formats.
- Multiple art styles, camera systems, or fantasy culture motif families in the MVP.
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
- Rigid-part animation clips and sprite atlases for walk, attack, hurt, and death cycles.
- Robust mesh booleans where layered closed meshes are insufficient.
- Skeletal deformation, texture baking, more creature families, and engine-specific exporters only after MVP evidence justifies them.
