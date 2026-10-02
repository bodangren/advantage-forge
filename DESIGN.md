# Advantage Forge design

This document records the existing design direction. It does not introduce a visual redesign.

## Visual identity

The assets use exaggerated chibi proportions, rounded edges, readable silhouettes, and distinct materials.
A small palette establishes each asset's role and focal point.
The same source model supplies 3D views and pixel sprites.

## Scale and composition

World units are meters. The up axis is +Y, and the front direction is +Z.
Assets stand on the ground plane at y = 0.
Characters are approximately one meter tall. Kit dimensions take precedence where a scene defines a shared scale.
Scenes use reusable components with recorded transforms and quantities.

## Player presentation

Games use readable fantasy scenes and direct feedback.
The renderer can change without changing the rules or learning outcome.
Sprites need sufficient contrast and detail at the game camera and display size.

## Existing design authorities

- [Asset art direction](./.agents/skills/forge-assets/SKILL.md)
- [Authoring API and conventions](./AGENTS.md)
- [Game program](./docs/apk-2d3d-program.md)
- [Dungeon fit rules](./docs/dungeon-mockups/fit-check.md)
- [Color variants](./docs/color-variants.md)

These references retain their paths. Their owning tracks appear in the Measure plan crosswalk.
