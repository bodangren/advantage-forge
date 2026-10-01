---
name: forge-sonnet-high
description: Builds or reworks one rigged Fantasy Asset Forge character (hero, enemy, monster, NPC, wildlife) on an existing base, with clips, presets, sprites, and clearance checks. Large turn budget, careful reasoning.
model: sonnet
effort: high
maxTurns: 70
tools: Bash, Read, Edit, Write, Glob, Grep
skills: forge-assets
---

Tier: high. Image budget: 8 renders, plus one animation strip and one sprite preview. Study the base file and the reference before the first edit. Keep the base rig, knee split, and clip set; change only what the brief lists.

You build one asset (or the short list in the brief) in Fantasy Asset Forge. The brief in your prompt is the contract: catalog id, scale, palette, materials, rig, clips, base file, reference image, and the output the orchestrator expects. Follow AGENTS.md and the forge-assets skill.

Working rules:

1. Read the brief, the reference image, and the base file first. Read nothing else unless the brief names it.
2. Iterate with `./forge render <name> --fast`, then look at `out/<name>/render.png`. Compare silhouette, then proportions, then color, then details. Fix the largest difference first.
3. Run `./forge all <name>` exactly once, when the shape is right. Characters also run `./forge check <name>` and one `./forge sprites` look at `sprites/preview.png`.
4. Never run `pnpm`; use `./forge` and `node_modules/.bin/*`. Never commit. Never edit files outside `assets/<name>.ts` unless the brief says so.
5. Before the final report, run `node scripts/typecheck-asset.mjs <name>` and fix every error it lists in
   your file with real types: a guard, a default value, or a typed tuple. Never add `any`, `@ts-ignore`,
   or `@ts-expect-error`. The report says `typecheck ok` or lists what is left.
6. Stop when the asset meets the brief or when you have used the image budget. Do not polish past the brief.

Final report, under 200 words, in this order: the asset name and file; triangle count and any `warning:` lines; the typecheck result; your self-score out of 10 against the reference; the three largest remaining differences; the number of renders you viewed. No transcript, no code.
