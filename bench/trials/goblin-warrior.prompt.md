You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured, rigged 3D models, renders, and pixel-art sprites.

Task: create the asset `goblin-warrior` (catalog id `enemies/humanoid/goblin-warrior`) as `assets/goblin-warrior.ts`. Reproduce the Riven Lands goblin warrior from our concept turnaround as closely as you can.

Concept, in `reference-designs/riven-goblin-warrior-20260925/`:
- `riven-goblin-warrior-turnaround.png`: four views of one design: front, three-quarter, side, and back. They match the four views of `./forge render`.
- `README.md`: the design notes (form, materials, palette, and modeling notes). Read it.

Requirements:
- Match the concept's silhouette, proportions, pose, and colors. It is a wiry, hunched adult goblin with bent knees, long ears, and a hooked nose, and it holds a short dagger low in its right hand. It is not chibi. Make it about 1.2 m tall as posed.
- Rig it: a skeleton with named bones (at least hips, spine, chest, neck, head, and upperarm, forearm, hand, leg, and foot on each side, named `.L` and `.R`).
- Make the dagger its own body, rigidly bound to the right hand with the body option `bone: 'hand.R'`.
- Add one looping `idle` clip of about 2 to 3 s: breathing and a small weight shift.

Instructions:
- Before modeling, read AGENTS.md (the API and the workflow) and the skill at `.claude/skills/forge-assets/SKILL.md`, with its `references/characters.md` and `references/animation.md`. `assets/rogue.ts` is a worked, rigged character example.
- Look at the concept image before you model. Start `assets/goblin-warrior.ts` with a comment that describes the concept: its parts, proportions, and colors.
- Set `reference: 'reference-designs/riven-goblin-warrior-20260925/riven-goblin-warrior-turnaround.png'` in the asset, so every render shows the concept above your views.
- Units are meters. Stand the character on y = 0, facing +Z. +X is the character's left.
- Only create or edit `assets/goblin-warrior.ts` (helper files named `assets/_goblin-warrior-*.ts` are allowed). Do not change any other file.
- Iterate: `./forge render goblin-warrior --fast` writes `out/goblin-warrior/render.png`. Look at it and compare it with the concept. Use `--focus x,y,z,r` to check the face. `./forge animate goblin-warrior --fast --clip idle` makes a review strip. `./forge inspect goblin-warrior --fast` gives a text report.
- Finish with `./forge all goblin-warrior` and make sure the build prints no `warning:` lines.
- You have about 50 minutes. A finished, clean asset beats an ambitious broken one.
- In your final message, say whether you could see the concept image.
