# Implementation plan: vendor the three.js VFX builder and debug profiler skills

Track: `vendor_threejs_vfx_skills_20261128`. Lane: light. One phase.
The request comes from Daniel on 2026-11-28 (Google Task cTVvUmg0U2haRzVxZVF3Vg, relayed by the PM).
No spec, no review, and no gate. The card rides on the Magic Defense track and adds no track in progress.

The source is `github.com/majidmanzarpour/threejs-game-skills` at commit `8cbda8bbfeb9b47b4c683bc32edb9bf04e3e16e2`.
The licence is MIT. The vendor folders are `.claude/skills/threejs-aaa-vfx-builder/` and `.claude/skills/threejs-debug-profiler/`.
The two generator skills stay out because they call paid generation services.

## Phase 1: The vendoring

- [x] Task: Vendor the two skills at commit 8cbda8bbfeb9 with the MIT licence and the source line. Evidence: `858b93af`

## Standing decisions

Magic Defense spell effects after the current remediation round closes: use threejs-aaa-vfx-builder, device floor iOS 15.0+/WebView 80+, low-end fallback where WebGL2 is missing, frame time checked with threejs-debug-profiler on the compact layout. The orchestrator copies this into the next Magic Defense Red and Green briefs.

## Vendored files

- `.claude/skills/threejs-aaa-vfx-builder/` holds the skill folder, the MIT licence, and `VENDORED.md`.
- `.claude/skills/threejs-debug-profiler/` holds the skill folder, the MIT licence, and `VENDORED.md`.
- `.claude/skills/THIRD-PARTY-threejs-game-skills-LICENSE` holds the shared licence copy.
- The safety scan of the two folders found no network call, no remote fetch, no key or environment variable, no paid service, no shell or install script, no postinstall hook, and no minified or binary file.
