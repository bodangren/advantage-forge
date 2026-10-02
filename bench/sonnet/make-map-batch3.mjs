// Writes briefs (bench/sonnet/briefs/map-p2-<slug>.md) and make-map-mocks3.sh for P2 map batch 3.
import { writeFileSync, existsSync } from 'node:fs';
import { M3 } from './map-batch3-data.mjs';
const has = (n) => existsSync(`out/${n}/${n}.glb`);
let sh = `#!/usr/bin/env bash
# mmx mockups for P2 map batch 3 -> docs/map-mockups/<slug>.jpg. Usage: make-map-mocks3.sh [slug ...]
cd "$(dirname "$0")/../.." || exit 1
S="Cute chibi 3D game map diorama for a fantasy RPG, isometric three-quarter overhead view from about 45 degrees, the whole map as one floating tile-based diorama on a plain warm beige studio background, matte clay toy look, rounded chunky forms, soft bevels, cheerful saturated palette, soft studio lighting, no characters larger than a few small figures, no text, no UI."
declare -A P
`;
for (const [slug, , title, size, d, d2, light, story, reuse] of M3) {
  sh += `P[${slug}]=${JSON.stringify(story)}\n`;
  const names = reuse.split(',').map((s) => s.trim()).filter(has);
  writeFileSync(`bench/sonnet/briefs/map-p2-${slug}.md`, `# ${title} -> scenes/maps/${slug}.ts

Read \`bench/sonnet/briefs/map-p2-rules.md\` first. Slug: \`${slug}\`. P2 bar: 7.0 of 10.

Mockup: \`docs/map-mockups/${slug}.jpg\` (the layout and style anchor; one view, so infer the rest).
Generator: \`scripts/design-${slug}.mjs\`. Output: \`scenes/maps/${slug}.ts\` and \`docs/map-mockups/${slug}.md\`.
Lighting group (set by the orchestrator): ${light}.
Size: ${size}.
Shot distances: 3q \`dist=${d}\`, top \`dist=${d2}\`.

What the map holds: ${story}

Pieces likely to fit (all exist in \`out/\`; others may exist too): ${names.join(', ')}.

Final shots: \`docs/map-mockups/${slug}-3q.png\` and \`docs/map-mockups/${slug}-top.png\`.
`);
}
sh += `for slug in "\${@:-\${!P[@]}}"; do
  out="docs/map-mockups/$slug.jpg"
  [ -f "$out" ] || timeout 240 mmx image generate --prompt "\${P[$slug]} $S" --aspect-ratio 4:3 --out "$out" --quiet > /dev/null 2>&1
  echo "$slug $([ -f "$out" ] && echo ok || echo FAILED)"
done
`;
writeFileSync('bench/sonnet/make-map-mocks3.sh', sh, { mode: 0o755 });
console.log(M3.length, 'briefs');
