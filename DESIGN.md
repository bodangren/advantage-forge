---
version: alpha
name: Guild Workshop
description: A canvas-first creative tool with Figma-inspired structural clarity, adapted into a restrained fantasy workshop palette and compact LLM-operation surfaces.
source_reference: https://github.com/voltagent/awesome-design-md/tree/main/design-md/figma
---

# Visual Theme & Atmosphere

The product should feel like a precise digital workbench, not an RPG menu and not a generic AI chat application. The asset canvas is the visual center. Surrounding chrome is compact, neutral, and tool-like; fantasy character comes from material swatches, reference renders, and a small set of workshop colors rather than parchment textures, ornate borders, glowing runes, or decorative medieval typography.

The design adapts the Figma-derived system's strong monochrome structure, clear taxonomy, and confident color blocks. It differs by using subdued material colors tied to the asset domain and by optimizing for a dense creation workspace rather than a marketing page.

# Color Palette & Roles

| Token           |     Value | Role                                 |
| --------------- | --------: | ------------------------------------ |
| `canvas`        | `#171815` | Main application background          |
| `panel`         | `#22231F` | Sidebars, tool output, inspector     |
| `panel-raised`  | `#2B2C27` | Selected cards and dialogs           |
| `viewport`      | `#B9B5A8` | Neutral 3D preview ground/background |
| `ink`           | `#F2EFE6` | Primary text on dark surfaces        |
| `ink-muted`     | `#AAA79D` | Secondary metadata                   |
| `hairline`      | `#3B3C35` | Dividers and inactive borders        |
| `forge-amber`   | `#D99A43` | Primary action and active revision   |
| `moss`          | `#7E9B62` | Valid state and vegetation family    |
| `arcane-violet` | `#9782C8` | LLM proposal and pending patch       |
| `iron-blue`     | `#6E8792` | Structural metadata and 3D export    |
| `warning`       | `#D27355` | Validation warning                   |
| `error`         | `#E05D54` | Failed build or invalid contract     |

Use `forge-amber` for a single primary action per surface. Domain colors label material families and output types; they must not become decorative gradients. Validation colors always retain their semantic meaning.

# Typography Rules

- Use Inter Variable for interface and reading text.
- Use JetBrains Mono for asset IDs, schema paths, measurements, tool names, seeds, and validation output.
- Interface body: 14px/20px, weight 400.
- Inspector label: 12px/16px, weight 550, uppercase only for short taxonomy labels.
- Panel title: 16px/22px, weight 600.
- Asset title: 24px/30px, weight 600.
- Numeric measurements use tabular figures.
- Do not use fantasy display fonts, serif body text, or oversized marketing typography inside the application.

# Component Styling

- Buttons use 6px radii, 1px borders, and 32px default height. Primary buttons use `forge-amber` with dark text; secondary buttons remain dark with a hairline border.
- Asset and revision cards use flat surfaces with borders, not floating shadows. Selection is shown by border and background change.
- Inspector controls align labels, current values, units, and reset affordances in predictable rows.
- Tool calls appear as collapsible operation cards containing intent, affected IDs, structured result, validation state, and revision link.
- Contact sheets use a checkerboard transparency field, fixed frame cells, direction labels, and an optional silhouette overlay.
- Validation rows lead with status, then rule ID, asset path, actual value, and correction guidance.
- The chat composer is subordinate to the canvas; it must not consume more than one third of horizontal space on desktop.

# Layout Principles

- Desktop-first three-region workspace: asset/revision rail, central canvas, inspector/tool history.
- The central canvas receives at least 50% of available width and remains visible while inspecting tool results.
- Use an 8px spacing system with 4px for tightly related micro-controls.
- Keep primary creation actions near the current asset context; avoid global floating action buttons.
- Support canvas modes for 3D, eight-direction contact sheet, 128x128 actual-size preview, and before/after comparison.
- On narrow screens, collapse side panels into drawers, but do not claim mobile authoring support for the MVP.

# Depth & Elevation

- Use surface tone and hairlines for hierarchy.
- Reserve a single soft shadow level for dialogs and transient menus.
- Avoid glassmorphism, backdrop blur, glowing borders, gradient surfaces, and stacked card shadows.
- The 3D canvas may use a soft ground shadow inside the rendered scene; this is asset content, not interface elevation.

# Do's and Don'ts

## Do

- Keep asset previews large and operational metadata legible.
- Show stable IDs and revision evidence close to visual output.
- Use fantasy colors as restrained semantic signals.
- Show actual-resolution sprites without smoothing when requested.
- Preserve keyboard access, visible focus, and sufficient contrast.

## Don't

- Do not resemble an MMORPG inventory screen.
- Do not use parchment, woodgrain UI panels, rivets, ornamental frames, or rune decoration.
- Do not make chat the entire product.
- Do not hide validation failures behind a generic success toast.
- Do not use color alone to communicate status.

# Responsive Behavior

- Primary supported width is 1280px and above.
- Between 900px and 1279px, allow either side panel to collapse while preserving the canvas.
- Below 900px, provide inspection and approval only; creation controls may move into drawers.
- Minimum interactive target is 36px on desktop and 44px in narrow inspection mode.
- Contact sheets scroll or zoom as a unit; individual frames never reflow into an ambiguous direction order.

# Agent Prompt Guide

When generating UI, describe it as a “canvas-first fantasy asset workshop with precise dark tool chrome.” Use Inter and JetBrains Mono, 6px controls, flat bordered panels, amber primary action, violet LLM proposal state, moss validation success, and no ornamental fantasy decoration. Always render the 3D or sprite result as the dominant element and place structured operation evidence next to it.
