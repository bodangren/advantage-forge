#!/usr/bin/env node
// Generate round-2 masonry re-roll prompts. Every prompt embeds the canon wall's measured
// masonry (docs/dungeon-mockups/masonry.md) and points at mockups/masonry-canon.png, which
// the scheduler copies into each trial workspace as reference/masonry-canon.png.
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
mkdirSync(join(here, "prompts-r2"), { recursive: true });

const MASONRY = `MASONRY CANON — the critical requirement. \`reference/masonry-canon.png\` is the canonical dungeon wall. Your stonework must read as THE SAME WALL built by the same hand:
- Exactly 2 block courses per 1.2 m of height (course height 0.60 m). Never more, smaller courses.
- Blocks about 0.55 m long (half-blocks at run ends), deep rounded pillow bevels of about 0.04 m.
- Joints recessed about 0.03 m, deep navy #2a3547. Block faces #4a5d75, slightly convex; worn tops #7a8ba0.
- Moss: small #3fae9a clumps at the BASE only — never a blob on top.
- Stone roughness 0.9, metalness 0. Keep the whole asset economical (the canon wall is 2,626 triangles).
FORBIDDEN: brick courses smaller than the canon, crazy-paving cells, smooth stacked drums, lighter smooth voussoirs.`;

const TASKS = {
  "wall-corner": {
    cap: 6000,
    body: `A corner piece: two 2 m wall runs meeting at a right angle, each exactly 2 courses of canon blocks on the same 0.4 m thick footprint. Clean right-angle silhouette from above. Optional: one small candle sconce on the inner face is allowed but keep it minimal — the masonry is the asset.`,
  },
  stairs: {
    cap: 6000,
    body: `A flight of five chunky stone steps descending over a 2 m run, top step about 0.9 m up. The side cheeks are canon-block masonry (2 courses visible on the tall end). Treads are smooth slabs about 0.18 m tall with worn pale #7a8ba0 tops. NO crazy-paving texture anywhere — that was the round-1 failure.`,
  },
  door: {
    cap: 6000,
    body: `A heavy wooden dungeon door set in a masonry jamb: opening about 1.0 m wide and 1.6 m tall. The jamb and round arch are built from canon blocks — the arch ring in radial segments of the same 0.60 m course height, jambs stacked from whole blocks, keystone slightly proud. The door itself: vertical warm-brown planks #8a5a35, two black iron hinge bands with studs, a small iron ring handle. Wood roughness 0.8, iron metalness 0.8.`,
  },
  arch: {
    cap: 6000,
    body: `A 2 m wall segment with a wide arched opening about 1.0 m wide and 1.6 m tall, built entirely in canon blocks: radial arch ring segments of the same 0.60 m course height, slightly proud keystone, deep slate shadow #2a3547 inside the opening. Moss only at the base — round 1 put a green blob on top, which read as slime; do not repeat that.`,
  },
  pillar: {
    cap: 6000,
    body: `A chunky dungeon pillar about 1.4 m tall: square base plinth and square capital, shaft built from canon block courses 0.60 m tall (two full courses plus the plinths) — NOT smooth stacked drums, which was the round-1 failure. Same blocks, bevels, joints, and moss-at-base as the canon wall.`,
  },
  "torch-sconce": {
    cap: 4000,
    body: `A wall-mounted iron torch sconce on a 0.4 m wide, 1.2 m tall stub of canon-block wall (2 courses) so the asset stands alone on y = 0. Iron bracket and ring (metalness 0.8), short wooden handle, teardrop flame with emissive #ff9a3c at intensity about 2 — the brightest, warmest point of the kit. Paint a soft warm glow onto the stub stones around the flame. Clean stub top (round 1 had a broken top; keep this one intact).`,
  },
  "wall-alcove": {
    cap: 8000,
    body: `A 2 m wall segment, exactly 2 canon courses (0.60 m each), 0.4 m thick, with ONE arched niche cut into the +Z face: about 0.5 m wide, 0.7 m tall, 0.25 m deep, arched top from radial segments of the same course height, jamb of whole blocks either side. The niche interior paints deep slate #2a3547 and stays EMPTY (dressing assets slot in at assembly). Round-1 failure to avoid: it built 4-5 courses of smaller, lighter blocks with a smooth voussoir arch and an unrequested window sill, and stood taller than the kit. Match the canon plate exactly.`,
  },
};

for (const [file, t] of Object.entries(TASKS)) {
  const prompt = `You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset \`${file}\` as \`assets/${file}.ts\`. This is a round-2 RE-ROLL: a round-1 version exists but its stonework did not match the batch. Geometry guidance: ${t.body}

${MASONRY}

Overall mood reference: \`reference/dungeon-quest_002.jpg\` (chunky rounded stone, warm torch accents, teal moss). The masonry canon plate overrides it wherever they disagree on block details.

Instructions:
- Before modeling, read AGENTS.md and the skill at \`.claude/skills/forge-assets/SKILL.md\`, with \`references/architecture.md\` and \`references/materials-and-color.md\`.
- Units are meters. Stand the asset on y = 0 and face +Z.
- Only create or edit \`assets/${file}.ts\`. Do not change any other file.
- Iterate: \`./forge render ${file} --fast\` and look at \`out/${file}/render.png\`; compare your blocks against \`reference/masonry-canon.png\` — same course count, same block size, same bevel, same joints. Also run \`./forge inspect ${file} --fast\` for a text report.
- Finish with \`./forge all ${file}\` and make sure the build prints no \`warning:\` lines.
- Keep the whole asset under ${t.cap.toLocaleString("en-US")} triangles.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.
`;
  writeFileSync(join(here, "prompts-r2", `${file}.prompt.md`), prompt);
}
console.log(`wrote ${Object.keys(TASKS).length} re-roll prompts to prompts-r2/`);
