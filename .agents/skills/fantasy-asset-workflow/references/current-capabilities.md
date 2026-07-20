# Current capability boundary

This file is a compact orientation aid. Always call `inspect_capabilities`
during the run because executable runtime facts supersede this summary.

## Supported now

- Fixed reference assets: adventurer, crate, tree, and cottage.
- Localized semantic revisions to registered parts, materials, visibility,
  transforms, connections, variants, static rigid poses, and render profiles.
- Complete bounded semantic inspection and immutable revision comparison.
- Seventeen registered static adventurer accessory templates: sword and round
  shield plus fifteen head, hand, body, back, and waist options.
- Compatibility-filtered accessory discovery with kit-owned placement,
  intended-orientation, usage, material, and native-frame visual-check guidance.
- Revision-safe task operations for equip, replace, move to an empty opposite
  hand, recolor, and unequip. Callers do not author transforms or ports.
- Eight deterministic 128x128 orthographic transparent directional PNGs and a
  labeled review contact sheet.
- Reload-verified GLB 2.0 export in meters.
- Four accepted guard, traveler, ranger, and caster loadouts with deterministic
  public-MCP revision histories and native-resolution readability evidence.

## Unsupported now

- Novel asset identity or arbitrary canonical-document assembly.
- Arbitrary creatures, additional humanoid culture families, deforming anatomy,
  wings, tentacles, quadrupeds, skeletal deformation, and raw mesh editing.
- Cloth/equipment physics, gameplay inventory state, arbitrary uploaded
  accessories, exchange of two occupied hands, and temporally animated gear.
- Temporal clips, interpolation, frame sequences, animation playback/export,
  runtime sprite atlases, and atlas metadata.

## Not assessed now

- Unity, Godot, and gameplay-runtime import. The S4 audit proves scale,
  orientation, nodes, and materials through the pinned Three.js `GLTFLoader`,
  but one representative format importer does not prove a game-engine target.

## Safe response to a gap

Stop before mutation, name the exact unsupported or not-assessed capability, and
quote the runtime guidance. Do not approximate missing equipment with unrelated
parts or route around the public tools. If the request contains an independently
useful supported subset, offer that subset explicitly and wait for acceptance.
