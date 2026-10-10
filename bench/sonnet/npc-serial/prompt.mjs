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
  // A builder prompt always follows a review, so the latest review applies (an interrupted pass may
  // leave a build that is newer than the review).
  const reviewed = Boolean(r);
  const lines = [`# Builder task: ${name}`, '', 'Work in /home/daniebo/Desktop/advantage-forge.',
    `The brief is bench/sonnet/briefs/${name}.md. The mockup is docs/npc-mockups/${name}_001.jpg.`, ''];
  if (!existsSync(at(src))) {
    lines.push(`Build the new asset ${src} from the brief.`);
  } else {
    if (stale) lines.push(`The source ${src} exists, but an earlier pass stopped before it finished. First run \`./forge render ${name} --fast\` and look at out/${name}/render.png to see the current state.`);
    else lines.push(`The source ${src} exists. First look at out/${name}/render.png to see the current state.`);
    if (reviewed && r.overall >= 7.0) {
      lines.push('', `An independent reviewer rated it ${r.overall}/10, at the bar. Keep the look: change only what the note below needs.`);
    } else if (reviewed) {
      lines.push('', `An independent reviewer rated it ${r.overall}/10 (bar 7.0). Fix these issues, largest first:`);
      // The still posed arm in walk is a known base limit; a builder cannot fix it.
      const baseLimit = (s) => /known (base )?limit/i.test(s) || (/walk/i.test(s) && /\b(still|stiff|static|frozen|small steps)\b/i.test(s));
      const fixable = r.issues.filter((s) => !baseLimit(s));
      fixable.forEach((issue, i) => lines.push(`${i + 1}. ${issue}`));
      lines.push('Do every numbered fix. If a fix seems to conflict with the mockup, do the fix and name the conflict in the report.');
    } else {
      lines.push('Then complete the brief: match the mockup in silhouette, then proportions, then color, then details.');
    }
  }
  if (note) lines.push('', note);
  const fresh = !existsSync(at(src));
  lines.push('', fresh ? 'Budget: about 35 tool calls and 8 images (a new build).' : 'Budget: about 25 tool calls and 6 images.',
    '- Read the brief, the mockup, and the source once. Read a kind file (assets/parts/*-kind.ts) only when an option is unclear, and read only the lines you need.',
    '- The budget is a limit, not a target: stop when the brief or the fix list is done.',
    '- For a small fix, render with `--views` or `--focus` instead of all views. Do not view animation strips; `./forge check` covers the clips.',
    '- Do not read the source again after an edit.',
    '- View one render after your last edit, before the final check, so the report describes the final shape.',
    '- Critical errors block acceptance (owner rule): hair or a part through a head covering or another part, a held item that points the wrong way or does not touch the hand, a floating part, a hole. Fix every critical error that you see before the final build. For each held item, check in a `--focus` render that the fist grips the handle and that the item points the way the mockup shows it.',
    '- A held pole, spear, or staff: put its foot about 0.06 m above the ground. The rest and run clips lower the chest by 6 to 7 cm, and a lower foot fails the ground check.',
    '- A see-through or thin shell (veil, net, cape, sail): make it 2 cm thick or more. A thinner shell meshes with holes that show as dotted patches.',
    '', 'Rules:',
    `- \`./forge check ${name}\` ends with \`result ok\` and \`ground ok\`.`,
    '- The build prints no `warning:` lines. The asset has fewer than 65,000 triangles.',
    '- Run every forge command as `FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...`.',
    `- Edit only ${src}. Never run git.`,
    '- Keep every color option in `variants` (owner rule). To change a default, put the new option first and keep the old one; drop an old option only when the slot already has four.',
    `- Run the typecheck from your agent rules and \`./forge check ${name}\` before the final \`./forge all ${name}\`. Edit nothing and run no forge command after \`./forge all\`: a later edit makes the build old, and a \`--fast\` build overwrites the textured GLB. Exception: if the textured out/${name}/render.png shows a defect that the fast render did not show, fix it, run the check again, and run \`./forge all\` once more.`,
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
    `You review a batch of ${names.length} P2 NPC characters. Do not edit any file except the output JSON. Never run git.`, '',
    'Bar (owner rule 2026-10-10): an NPC at 7.0 or above is accepted unless the model has a critical error. In each JSON entry, add `"critical": true|false` and `"criticalReason": "<one sentence or empty>"`. Critical errors: hair or another part through a head covering or another part, an accessory or held item that points the wrong way, a floating part, a held item that does not touch the hand, a hole. Style differences from the mockup (hair shape, color, size, expression, proportions) are not critical.', '',
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
