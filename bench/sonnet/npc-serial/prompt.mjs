// Write the prompt file for one serial P2 NPC agent run (see method.md).
//
//   node bench/sonnet/npc-serial/prompt.mjs build <name> [note...]
//   node bench/sonnet/npc-serial/prompt.mjs review <cards-dir> <name> [<name> ...]
//
// The agent prompt then only says: "Read <prompt file> and follow it."
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { NPCS } from '../p2-npc-data.mjs';

const ROOT = new URL('../../../', import.meta.url).pathname;
const at = (p) => ROOT + p;
const [mode, ...args] = process.argv.slice(2);
const reviews = JSON.parse(readFileSync(at('docs/character-reviews.json'), 'utf8'));
const npc = (name) => NPCS.find((n) => n.name === name) ?? {};
const mtime = (p) => (existsSync(at(p)) ? statSync(at(p)).mtimeMs : null);

function build(name, note) {
  const src = `assets/${name}.ts`;
  const r = reviews[name];
  const glb = mtime(`out/${name}/${name}.glb`);
  const stale = existsSync(at(src)) && (glb === null || glb < mtime(src));
  const reviewed = r && (!glb || Date.parse(r.reviewedAt) >= glb);
  const lines = [`# Builder task: ${name}`, '', 'Work in /home/daniebo/Desktop/advantage-forge.',
    `The brief is bench/sonnet/briefs/${name}.md. The mockup is docs/npc-mockups/${name}_001.jpg.`, ''];
  if (!existsSync(at(src))) {
    lines.push(`Build the new asset ${src} from the brief.`);
  } else {
    if (stale) lines.push(`The source ${src} exists, but an earlier pass stopped before it finished. First run \`./forge render ${name} --fast\` and look at out/${name}/render.png to see the current state.`);
    else lines.push(`The source ${src} exists. First look at out/${name}/render.png to see the current state.`);
    if (reviewed && r.overall >= 7.5) {
      lines.push('', `An independent reviewer rated it ${r.overall}/10, at the bar. Keep the look: change only what the note below needs.`);
    } else if (reviewed) {
      lines.push('', `An independent reviewer rated it ${r.overall}/10 (bar 7.5). Fix these issues, largest first:`);
      r.issues.forEach((issue, i) => lines.push(`${i + 1}. ${issue}`));
      lines.push('Do every numbered fix. If a fix seems to conflict with the mockup, do the fix and name the conflict in the report.');
    } else {
      lines.push('Then complete the brief: match the mockup in silhouette, then proportions, then color, then details.');
    }
  }
  if (note) lines.push('', note);
  lines.push('', 'Budget: about 25 tool calls and 6 images.',
    '- Read the brief, the mockup, and the source once. Read a kind file (assets/parts/*-kind.ts) only when an option is unclear, and read only the lines you need.',
    '- For a small fix, render with `--views` or `--focus` instead of all views.',
    '- Do not read the source again after an edit.',
    '', 'Rules:',
    `- \`./forge check ${name}\` ends with \`result ok\` and \`ground ok\`.`,
    '- The build prints no `warning:` lines. The asset has fewer than 65,000 triangles.',
    '- Run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...`.',
    `- Edit only ${src}. Never run git.`,
    `- Run \`./forge check ${name}\` before the final \`./forge all ${name}\`. Run no forge command after \`./forge all\`: a \`--fast\` build overwrites the textured GLB. Then run the typecheck from your agent rules.`,
    '- Report in three lines: triangles and warnings, the check result, and what remains.', '');
  const out = `bench/sonnet/npc-serial/prompts/${name}.md`;
  writeFileSync(at(out), lines.join('\n'));
  return out;
}

function review(dir, names) {
  const role = (n) => {
    const d = npc(n);
    const one = (d.one ?? '').replace(/^A /, 'a ').replace(/\.$/, '');
    return `- ${n}: ${(d.role ?? '').split(';')[0]}; ${one}.`;
  };
  const lines = [`# Review task: ${dir}`, '',
    'Work in /home/daniebo/Desktop/advantage-forge. Read measure/tracks/asset_review_audit_20261005/reviewer-brief.md and follow it exactly.',
    `You review a batch of ${names.length} P2 NPC characters (bar 7.5). Do not edit any file except the output JSON. Never run git.`, '',
    `Cards dir: ${dir} (${names.map((n) => n + '.png').join(', ')}). Each mockup is also at docs/npc-mockups/<name>_001.jpg.`, '',
    'Roles (one line each):', ...names.map(role), '',
    'All NPCs are seen in 3D village and town scenes and as 128 px sprites. Rated G.', '',
    'House style note: these NPCs share one humanoid base. Its large glossy eyes are the house style; judge whether the face and expression read, not whether the eye size copies the mockup. The base has fists only (no open hands). In walk the base keeps a posed arm still; that is a known base limit.', '',
    'Work in few steps:',
    '1. Read the reviewer brief.',
    `2. Read all ${names.length} cards in one step, with parallel Read calls.`,
    '3. Open at most two extra images in total, and only when a card does not show a detail clearly. Do not run scripts and do not crop images.',
    '4. Write the JSON with one Write call.', '',
    `Output JSON: ${dir}/review.json`, ''];
  const out = `bench/sonnet/npc-serial/prompts/review-${dir.split('/').pop()}.md`;
  writeFileSync(at(out), lines.join('\n'));
  return out;
}

if (mode === 'build') console.log(build(args[0], args.slice(1).join(' ')));
else if (mode === 'review') console.log(review(args[0], args.slice(1)));
else console.error('usage: prompt.mjs build <name> [note] | review <cards-dir> <name>...');
