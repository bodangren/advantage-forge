# Lessons Learned

> Curated working memory. Keep this file at or below 50 lines.

## Architecture & Design

- (2026-07-17, fantasy_asset_mvp_20260717) The canonical artifact is a semantic asset document; generated Three.js scenes, GLBs, and PNGs are build outputs.
- (2026-07-17, fantasy_asset_mvp_20260717) Blender was rejected because its operational and conceptual surface contradicts the constrained LLM-first product.
- (2026-07-17, fantasy_asset_mvp_20260717) Shared abstractions are parameters, ports, transforms, variants, poses, and rendering; domain kits may use distinct part templates.

## Recurring Gotchas

- Large previews can conceal unreadable features; always verify at the committed sprite resolution.
- “Fantasy RPG” is still unbounded unless art style, camera, asset families, and exclusions remain explicit.

## Patterns That Worked Well

- Define one reference vertical slice and require every proposed capability to justify itself against that slice.
- Prefer intersecting closed parts over adding general mesh booleans before a concrete asset requires subtraction.

## Planning Improvements

- Record estimate changes after the first implemented story; there is no delivery history yet.
