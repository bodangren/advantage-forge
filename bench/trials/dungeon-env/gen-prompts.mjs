#!/usr/bin/env node
// Generate one prompt file per dungeon component from docs/dungeon-mockups/components.tsv.
//   node gen-prompts.mjs
// Output: prompts/<file>.prompt.md — same shape as the chibi-env prompts-r3 files.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const doc = join(here, "../../../docs/dungeon-mockups");

// id suffix in components.tsv -> { desc, playbook, cap }
const SPEC = {
  floor: {
    desc:
      "A 2 x 2 m modular stone floor tile: walking surface flush at y = 0.08 like the hamlet ground tiles, cool gray slabs laid in a visible grid with darker grout lines, pale worn slab tops, and a wet sheen (roughness dipping low in patches via paintFn). Soft beveled edges so tiles mate edge-to-edge with no lip. Subtle surface variation with noise via the bump option, not displace. Clear at 128 px sprite size. No rig or animation.",
    playbook: "architecture.md", cap: 8000,
  },
  "floor-cracked": {
    desc:
      "A 2 x 2 m cracked variant of the dungeon floor tile: same conventions as the plain floor (flush top at y = 0.08, cool gray grid, wet sheen) plus one jagged crack across the slab, a missing corner chunk exposing dark soil beneath, and two or three small rubble bits resting in the break. The crack is painted and bumped, not displaced through the tile. Clear at 128 px. No rig or animation.",
    playbook: "architecture.md", cap: 8000,
  },
  wall: {
    desc:
      "A 2 m long straight dungeon wall segment, about 1.2 m tall and 0.4 m thick: two courses of big rounded stone blocks with chunky bevels, deep slate shadows in the joints, mid blue-gray block faces, pale worn tops, and a few moss specks near the base. This is the batch style anchor for all dungeon stone: make the blocks big, friendly, and readable from above. No rig or animation.",
    playbook: "architecture.md", cap: 8000,
  },
  "wall-corner": {
    desc:
      "An L-shaped corner piece of the dungeon wall: two 2 m wall runs meeting at a right angle, identical block courses, bevels, joint shadows, and moss placement as the straight wall segment. The outer corner silhouette must read as a clean right angle from above. No rig or animation.",
    playbook: "architecture.md", cap: 8000,
  },
  "wall-alcove": {
    desc:
      "A 2 m dungeon wall segment with one arched niche cut into its +Z face: the niche is about 0.5 m wide, 0.7 m tall, and 0.25 m deep, with an arched top matching the dungeon arch asset's profile. The niche interior paints in the deep slate shadow color and stays EMPTY (dressing assets slot in at assembly time). Same block courses and bevels as the plain wall around it. No rig or animation.",
    playbook: "architecture.md", cap: 8000,
  },
  arch: {
    desc:
      "A 2 m dungeon wall segment with a wide arched doorway opening: about 1.0 m wide and 1.6 m tall, smooth jamb stones, a slightly proud keystone at the crown, and deep slate shadow inside the opening. Same block courses, bevels, and moss placement as the plain wall. The opening must read as a dark hole from map view. No rig or animation.",
    playbook: "architecture.md", cap: 8000,
  },
  door: {
    desc:
      "A heavy wooden dungeon door with iron fittings, sized to sit inside the arch opening (about 0.95 m wide, 1.5 m tall): vertical planks in warm brown wood, two iron hinge bands and a stud grid, a small iron ring handle, and a slightly recessed sit inside a shallow stone jamb stub so it stands alone on y = 0. Wood roughness about 0.8, iron metalness 0.8. Clear at 128 px. No rig or animation.",
    playbook: "architecture.md", cap: 6000,
  },
  gate: {
    desc:
      "A rusted iron portcullis gate, about 1.2 m wide and 1.6 m tall: six or seven vertical bars with pointed lower tips, two horizontal cross braces, a simple lift ring at the top, and rust-tone paint variation over dark iron. All iron metalness 0.8, roughness about 0.5. Bars chunky enough to read at 128 px. No rig or animation.",
    playbook: "architecture.md", cap: 6000,
  },
  stairs: {
    desc:
      "A short flight of dungeon stairs: five chunky stone steps descending over a 2 m run, each step a beveled slab in the dungeon stone palette, with low side cheek walls in the wall's block language. The top step surface sits about 0.9 m above the bottom. Reads clearly from three-quarter view. No rig or animation.",
    playbook: "architecture.md", cap: 6000,
  },
  pillar: {
    desc:
      "A chunky dungeon stone pillar about 1.4 m tall (map scale): a wide square base plinth, a rounded column shaft with two or three block courses, and a wider square capital. Same stone palette, joint shadows, and moss specks as the wall. Strong simple silhouette from every side. No rig or animation.",
    playbook: "architecture.md", cap: 6000,
  },
  rubble: {
    desc:
      "A pile of fallen dungeon masonry: six to ten rounded blocks and pebbles tumbled into a mound about 0.8 m wide and 0.4 m tall, one half-buried block edge, a dusting of moss on the shaded side. Stone palette matches the wall; shapes chunky and readable at 128 px. No rig or animation.",
    playbook: "architecture.md", cap: 4000,
  },
  "torch-sconce": {
    desc:
      "A wall-mounted iron torch sconce with a burning flame, mounted on a small dungeon wall stub (a 0.4 m wide, 1.2 m tall piece of the wall's stone language) so the asset stands alone on y = 0: iron bracket and ring in dark metal, a short wooden handle, and a teardrop flame with emissive color #ff9a3c at intensity about 2. The flame is the brightest, warmest point of the whole dungeon kit; let a soft warm glow paint the stub stones around it. No rig or animation.",
    playbook: "architecture.md", cap: 4000,
  },
  brazier: {
    desc:
      "A standing iron brazier about 0.7 m tall: a wide dish bowl on three chunky tripod legs with a small ring rim, filled with glowing coals and one or two small emissive flames (#ff9a3c, intensity about 2). Dark iron metalness 0.8 with rust paint variation; warm glow paint on the bowl rim. Clear at 128 px. No rig or animation.",
    playbook: "props.md", cap: 4000,
  },
  "candle-cluster": {
    desc:
      "A cluster of three to five chunky melted candles on a flat stone shard: warm ivory wax bodies with drip lumps, tiny emissive teardrop flames (#ff9a3c, intensity about 2), and one slightly bent or toppled candle for story. Total footprint under 0.3 m. Clear at 128 px. No rig or animation.",
    playbook: "props.md", cap: 3000,
  },
  chains: {
    desc:
      "A heavy iron chain prop in two readings in one asset: a coiled pile of chain on the ground and one short length hanging from a small wall stub hook. Links are chunky torus segments thick enough to read at 128 px, dark iron with rust paint variation, metalness 0.8. No rig or animation.",
    playbook: "props.md", cap: 4000,
  },
  "bone-pile": {
    desc:
      "A pile of cartoon dungeon bones: four or five big chunky femurs and ribs crossed in a mound about 0.5 m wide, with two stylized skulls (big round craniums, simple dark eye sockets) resting on top. Bleached warm ivory #e8dcc0 with a faint soil stain near the base. Rounded, friendly shapes; not gory. Clear at 128 px. No rig or animation.",
    playbook: "props.md", cap: 4000,
  },
  sarcophagus: {
    desc:
      "A stone sarcophagus about 1.9 m long, 0.7 m wide, and 0.8 m tall: a tapered coffin box on two low plinths, a heavy lid slid slightly ajar revealing a dark interior slot, carved band lines, and a simple emblem recess on the lid. Dungeon stone palette with deeper shadow inside the gap and moss specks on the shaded end. No rig or animation.",
    playbook: "props.md", cap: 6000,
  },
  "cell-bars": {
    desc:
      "A 2 m frontage section of a dungeon prison cell: six or seven vertical iron bars between a low stone base curb and a top iron rail, with two chunky stone posts at the ends and one bar bent slightly outward. Iron dark with rust variation, metalness 0.8; stone matches the wall palette. Bars thick enough to read at 128 px. No rig or animation.",
    playbook: "architecture.md", cap: 5000,
  },
  "hanging-cage": {
    desc:
      "A small iron prison cage hanging from a chain: a rounded birdcage-shaped cage about 0.5 m tall and 0.4 m wide with six or eight curved vertical bars, a hinged little door ajar, a pointed top ring, and a short chain stub above it. Dark iron with rust paint, metalness 0.8. Interior dark. Hangs so the cage bottom sits about 1.0 m above y = 0 with the chain rising out of frame; keep the whole asset inside a 2 m tall bound. No rig or animation.",
    playbook: "props.md", cap: 4000,
  },
  altar: {
    desc:
      "A stone ritual altar about 1.2 m wide, 0.8 m deep, and 0.9 m tall: a thick slab top on two stepped plinths, a carved rune band across the front face with the runes emissive teal #3fae9a at intensity about 0.4, and two candle spots on top with tiny emissive flames. Stone matches the wall; the runes and flames are the focal accent. No rig or animation.",
    playbook: "props.md", cap: 5000,
  },
  cauldron: {
    desc:
      "A witch's cauldron over a small log fire: a rounded blackened iron pot about 0.6 m wide on three stub legs, a brew surface emissive green-teal #3fae9a at intensity about 0.8 with one or two bubbles, embers between the logs emissive #ff9a3c, and a wooden stirring stick leaning in. Iron metalness 0.8. Clear at 128 px. No rig or animation.",
    playbook: "props.md", cap: 4000,
  },
  "mushroom-cluster": {
    desc:
      "A cluster of five to seven chunky dungeon mushrooms on a low moss patch: fat stems and rounded caps in cool blue-gray and teal tones, the largest cap about 0.12 m across, with a faint emissive teal glow (#3fae9a, intensity about 0.3) on the cap undersides. Damp, friendly, readable at 128 px. No rig or animation.",
    playbook: "vegetation.md", cap: 3000,
  },
  "crystal-cluster": {
    desc:
      "A cluster of three to five teal crystal spikes on a small rock base: the tallest crystal about 0.45 m, faceted flat-shaded geometry (flat: true, roughness about 0.1), emissive teal #3fae9a at intensity about 0.4 so the cluster glows softly in the dark. Rock base matches the wall stone. Strong angular silhouette against the rounded dungeon language. No rig or animation.",
    playbook: "vegetation.md", cap: 3000,
  },
  "moss-tuft": {
    desc:
      "A low patch of dungeon moss tufts: a soft rounded mound about 0.4 m across with three or four grassy tuft clumps, teal-green #3fae9a mixed toward deep slate green, hugging the ground with a flush profile like the hamlet wildflowers. Simple ground dressing; clear at 128 px. No rig or animation.",
    playbook: "vegetation.md", cap: 2000,
  },
  "gold-pile": {
    desc:
      "A mound of dungeon treasure gold: a low pile of chunky overlapping coins about 0.5 m wide and 0.25 m tall, two or three simple goblets and a gem or two poking out, warm gold #f4c542 with brighter sparkle highlights painted via paintFn, metalness about 0.9 and roughness about 0.3. The second warm accent of the kit after torchlight. Clear at 128 px. No rig or animation.",
    playbook: "props.md", cap: 4000,
  },
  walkway: {
    desc:
      "A 2 m wooden plank walkway for crossing flooded dungeon floor: six or seven warm brown planks (#8a5a35) with visible grain via bump, two edge stringer beams, a slight arch so the middle sits about 0.06 m higher, and dark water line staining near both ends. Stands flush at y = 0. Clear at 128 px. No rig or animation.",
    playbook: "props.md", cap: 3000,
  },
};

const rows = readFileSync(join(doc, "components.tsv"), "utf8")
  .split("\n").filter(Boolean).slice(1)
  .map((l) => l.split("\t"))
  .map(([id]) => ({ id, file: id.split("/").pop() }));

const PALETTE = `- Stone: deep slate shadows #2a3547, mid blue-gray blocks #4a5d75, pale worn tops #7a8ba0; floor slabs cool gray with darker grout.
- Warm light: flame and ember emissive #ff9a3c (the kit's warm accent), soft glow painted onto nearby stone.
- Secondaries: moss and crystal teal-green #3fae9a, treasure gold #f4c542, wood brown #8a5a35.
- Mood: cool dark stone base, small warm pools of light. Squint test: flames must be the brightest, warmest points.`;

mkdirSync(join(here, "prompts"), { recursive: true });
for (const r of rows) {
  const spec = SPEC[r.file];
  if (!spec) throw new Error(`no SPEC entry for ${r.file}`);
  const prompt = `You are working in the Fantasy Asset Forge repository (the current directory). It turns TypeScript asset files into textured 3D models, renders, and pixel-art sprites.

Task: create the asset \`${r.file}\` (catalog id \`${r.id}\`) as \`assets/${r.file}.ts\`.

Description: ${spec.desc}

Style anchors — this is the critical requirement. Every dungeon asset must look like it belongs to the SAME game. Two concept images are in \`reference/\`:
- \`reference/dungeon-quest_002.jpg\`: the batch style anchor. Match its chunky rounded stone-block language, its cool slate palette, its warm torchlight accents, and its prop vocabulary.
- \`reference/dungeon-quest_001.jpg\`: the top-down tile reference for grid rhythm and wall runs.
They are style guides, not traces: keep geometry simple enough to model with primitives.

Art direction (dungeon treatment of Chibi Quest): rounded chunky forms, soft bevels everywhere, silhouettes that read at 128 px, and a cool-dark stone world warmed by small emissive light sources. Palette contract:
${PALETTE}

Emissive rules: flame, embers, and candle fires use \`emissive\` with color #ff9a3c and intensity around 2. Crystals, brew, and runes use #3fae9a at 0.3 to 0.8. Never bake brightness into plain paint — light sources must be emissive bodies.

Instructions:
- Before modeling, read AGENTS.md (the API and the workflow) and the skill at \`.claude/skills/forge-assets/SKILL.md\`, with its \`references/${spec.playbook}\` and \`references/materials-and-color.md\`.
- Units are meters. Stand the asset on y = 0 and face +Z${r.file.startsWith("floor") || r.file === "moss-tuft" || r.file === "walkway" ? ", walking surface flush at y = 0.08" : ""}.
- Only create or edit \`assets/${r.file}.ts\` (helper files named \`assets/_${r.file}-*.ts\` are allowed). Do not change any other file.
- Iterate: \`./forge render ${r.file} --fast\` writes \`out/${r.file}/render.png\`; look at it if you can view images. Also run \`./forge inspect ${r.file} --fast\` for a text report of part visibility, silhouette, values, and colors.
- Finish with \`./forge all ${r.file}\` and make sure the build prints no \`warning:\` lines.
- Keep the whole asset under ${spec.cap.toLocaleString("en-US")} triangles in the final build.
- You have about 40 minutes. A finished, clean asset beats an ambitious broken one.
`;
  writeFileSync(join(here, "prompts", `${r.file}.prompt.md`), prompt);
}
console.log(`wrote ${rows.length} prompts to ${join(here, "prompts")}`);
