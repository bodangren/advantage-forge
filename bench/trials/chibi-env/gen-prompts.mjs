#!/usr/bin/env node
// Generate one prompt file per asset from manifest.tsv.
//   node gen-prompts.mjs
// Output: prompts/<file>.prompt.md — same shape as bench/trials/well.prompt.md.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const rows = readFileSync(join(here, "manifest.tsv"), "utf8")
  .split("\n").filter(Boolean).slice(1)
  .map((l) => l.split("\t"))
  .map(([id, file, model, description]) => ({ id, file, model, description }));

const refs = {
  architecture: "architecture.md",
  nature: "vegetation.md",
  props: "props.md",
};
const mockups = new Set(["pine-tree", "bush", "wildflowers", "boulder", "barn"]);

mkdirSync(join(here, "prompts"), { recursive: true });
for (const r of rows) {
  const family = r.id.split("/")[0];
  const ref = refs[family] ?? "props.md";
  const concept = mockups.has(r.file)
    ? `\nConcept image, in \`reference/\`:\n- \`reference/${r.file}.jpg\`: the target look for this asset. Match the shapes, proportions, and colors. It is a style guide, not a trace: keep the geometry simple enough to model with primitives.\n`
    : "";
  const prompt = `You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset \`${r.file}\` (catalog id \`${r.id}\`) as \`assets/${r.file}.ts\`.

Description: ${r.description}
${concept}
Art direction (Chibi Quest): rounded chunky forms, bright cheerful colors, soft edges, and a silhouette that reads at 128 px sprite size.

Instructions:
- Before modeling, read AGENTS.md (the API and the workflow) and the skill at \`.claude/skills/forge-assets/SKILL.md\`, with its \`references/${ref}\` and \`references/materials-and-color.md\`.
- Units are meters. Stand the asset on y = 0 and face +Z.
- Only create or edit \`assets/${r.file}.ts\` (helper files named \`assets/_${r.file}-*.ts\` are allowed). Do not change any other file.
- Iterate: \`./forge render ${r.file} --fast\` writes \`out/${r.file}/render.png\`; look at it if you can view images. Also run \`./forge inspect ${r.file} --fast\` for a text report of part visibility, silhouette, values, and colors.
- Finish with \`./forge all ${r.file}\` and make sure the build prints no \`warning:\` lines.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.
`;
  writeFileSync(join(here, "prompts", `${r.file}.prompt.md`), prompt);
}
console.log(`wrote ${rows.length} prompts to ${join(here, "prompts")}`);
