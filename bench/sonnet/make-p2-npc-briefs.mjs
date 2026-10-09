// Writes bench/sonnet/briefs/<name>.md for the P2 NPC rows and, with --mockups, one mmx mockup per
// NPC in docs/npc-mockups/<name>_001.jpg (skipped when it exists).
//   node bench/sonnet/make-p2-npc-briefs.mjs [--mockups] [names...]
// Track: measure/tracks/asset_p2_npcs_20260928. Data: bench/sonnet/p2-npc-data.mjs.
import { writeFileSync, existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { NPCS } from './p2-npc-data.mjs';

const run = promisify(execFile);
const root = new URL('../../', import.meta.url).pathname;

// The mockup style: the clay-toy chibi suffix, with the humanoid kind's face (big glossy eyes).
const STYLE =
  'Cute chunky chibi 3D game character for a fantasy RPG, full body, standing, front three-quarter view, big head about one third of the height, big round glossy eyes with white highlights, small button nose, rosy cheeks, friendly face, plain warm beige studio background, soft studio lighting, matte clay toy look, rounded soft forms, no text.';

const HOLD = `Two-hand hold: set \`hold: { elbow, wrist }\` on the kind (see assets/baker.ts: elbow [0.165, 0.325, 0.035], wrist [0.185, 0.295, 0.13]; move them for a higher or lower hold). The kind then keeps both fists on the item in every clip and keeps it level. Build the item in the rest pose between the fists, tagged \`.bone('hand.R')\`, so \`./forge check\` tests it as a held item.`;
// A one-hand item on the fist's grip bone. The character's right hand is on the viewer's left.
const IN_HAND = (side, item) =>
  `${side === 'R' ? 'Right' : 'Left'} hand (the viewer's ${side === 'R' ? 'left' : 'right'} in the mockup): ${item}. Make it a body with the body option \`bone: 'knife.${side}'\` (the fist's grip bone; read the \`GRIP\` and \`ITEM_DIR\` notes in the kind: at rest a held item points forward and 20 degrees up). Build it in the rest pose at the ${side === 'R' ? 'right fist (x < 0)' : 'left fist (x > 0)'}.`;

// Start values for a one-arm pose (left-side coordinates; the kind mirrors R). Tested on 2026-10-09.
const POSES = {
  up: { elbow: [0.2, 0.34, 0.02], wrist: [0.25, 0.42, 0.07], text: 'raised beside the head' },
  out: { elbow: [0.17, 0.335, 0.05], wrist: [0.2, 0.33, 0.15], text: 'held out in front at chest height' },
};
const POSE = (n) => {
  const sides = ['R', 'L'].filter((s) => n[`up${s}`]);
  if (!sides.length) return '';
  const entries = sides.map((s) => `${s}: { elbow: [${POSES[n[`up${s}`]].elbow.join(', ')}], wrist: [${POSES[n[`up${s}`]].wrist.join(', ')}] }`).join(', ');
  const what = sides.map((s) => `the ${s === 'R' ? 'right' : 'left'} hand ${POSES[n[`up${s}`]].text}`).join(' and ');
  return `\nArm pose: the mockup shows ${what}. Set \`pose: { ${entries} }\` on the kind (left-side values; the kind mirrors R). Tune the values until the fist matches the mockup, and keep the fist and the item 0.04 m or more from the head. A posed arm keeps its pose in every clip. Build sleeves and cuffs with \`h.perArm\` so that they follow each arm, and build the item at the posed grip (\`h.arms.R.GRIP\` mirrored to x < 0 for the right hand, \`h.arms.L.GRIP\` for the left) in the orientation of the mockup.`;
};

function brief(n) {
  const hands = [n.right && IN_HAND('R', n.right), n.left && IN_HAND('L', n.left)].filter(Boolean);
  const held = n.hold
    ? `${HOLD} The item: ${n.hold}.`
    : hands.length
      ? `${hands.join('\n')}${POSE(n)}\n\`./forge check\` must end with \`result ok\`.`
      : 'Hands: empty, relaxed fists (the kind default).';
  return `# ${n.name} (${n.id}) -> assets/${n.name}.ts

${n.one} About ${n.height ?? '1.0'} m to the top of the ${n.top ?? 'hat or hair'}, faces +Z, stands on y = 0. Bar 7.5/10 (character). Rated G.
Role: ${n.role}

Mockup: docs/npc-mockups/${n.name}_001.jpg. Set \`reference\` to that path and LOOK at it with the Read tool before the first edit. Match it:
${n.look}

Palette: ${n.palette}
Variant slots: skin, hair, eyes (the options of assets/avatar-base.ts), and cloth (the main garment: ${n.cloth} first as the default, then three more options in the role's dye family; no pure primary red, green, or blue). Presets: the default and one more look.

Base: \`humanoidAsset\` in assets/parts/humanoid-kind.ts. Read its header, \`HumanoidKind\`, and \`HumanoidShape\`. Worked example: assets/baker.ts (a hat on the head bone, hair under a hat, long sleeves with cuffs, an apron from a torso shell, trousers, socks, shoes, a face expression in \`paintSkin\`, a two-hand \`hold\`). Build this role's own clothes and props. Do not copy the baker's look.
${held}

Construction rules (from the baker and the P1 characters):
- Hair: chain locks or a cap with soft edges (smoothIntersect 0.02 or more). A hard-cut slab under a hat fails review. Under a hat, show hair at the temples and the nape.
- A hat brim is at least 1.5x the crown radius. Put a hat on the head with a local pose helper and tag it \`.bone('head')\`.
- Clothes: grow the torso (\`h.torso.round(t)\`), cut with \`h.band\` or half-spaces, and tag with \`h.weighted\`. Sleeves follow \`h.joints\` (SHOULDER, ELBOW, WRIST). Skirts and coat tails end above the knee joint (y 0.13) unless the mockup shows a long robe; a long robe needs leg clearance in walk and run.
- Held items are 0.03 m thick or more. Flames and glows: a full-brightness base color with emissive 0.5 to 0.7. Mid greens render lime: use darker greens.
- Face: the kind's face. Change the expression in \`paintSkin\` when the mockup shows a different one (the baker paints a grin and arched brows over the defaults). A beard or a mustache is its own body on the head bone.
- Keep the kind's clips. Check the cheer and attack strips: nothing may pass through the head or tear.

Checks: \`./forge check ${n.name}\` ends with \`result ok\` (or "no held items to check" when the hands are empty) and \`ground ok\`; no \`warning:\` lines; under 65,000 triangles.
Builds: run every forge command as \`FORGE_WORKERS=2 flock /tmp/forge-build.lock ./forge ...\` (the machine has little memory; the lock queues the builds of all agents; wait for it).
Only create or edit assets/${n.name}.ts. Never commit. Finish with one \`./forge all ${n.name}\`.
`;
}

const args = process.argv.slice(2);
const mockups = args.includes('--mockups');
const names = args.filter((a) => !a.startsWith('--'));
const rows = names.length ? NPCS.filter((n) => names.includes(n.name)) : NPCS;
if (names.length && rows.length !== names.length) throw new Error(`unknown names: ${names.filter((x) => !NPCS.some((n) => n.name === x))}`);

for (const n of rows) {
  if (existsSync(`${root}assets/${n.name}.ts`)) console.log(`note: assets/${n.name}.ts exists`);
  writeFileSync(`${root}bench/sonnet/briefs/${n.name}.md`, brief(n));
}
console.log(`briefs: ${rows.length}`);

if (mockups) {
  const jobs = rows
    .filter((n) => !existsSync(`${root}docs/npc-mockups/${n.name}_001.jpg`))
    .map(async (n) => {
      const out = `${root}docs/npc-mockups/${n.name}_001.jpg`;
      for (let i = 0; i < 3 && !existsSync(out); i++) {
        try {
          await run('mmx', ['image', 'generate', '--prompt', `${n.mock} ${STYLE}`, '--aspect-ratio', '4:3', '--out', out, '--quiet'], { timeout: 240000 });
        } catch (e) {
          console.log(`retry ${n.name}: ${String(e.message).split('\n')[0]}`);
        }
      }
      console.log(`${existsSync(out) ? 'mockup' : 'FAILED'} ${n.name}`);
    });
  await Promise.all(jobs);
}
