/**
 * Visual judge: a vision model scores the rendered turnaround, sprites, and animation strips
 * against the brief with the forge-assets rubric. Runs several independent samples and keeps the
 * median per criterion.
 *
 *   tsx bench/judge.ts <run-dir>
 *
 * JUDGE_CMD=claude (default) uses the Claude Code CLI; JUDGE_MODEL picks the model;
 * JUDGE_SAMPLES sets the number of samples (default 3).
 */
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { readJson, writeJson } from './lib.js';
import type { Brief } from './prompt.js';

export const CRITERIA = [
  [
    'brief_fidelity',
    'Brief fidelity',
    'misses the brief or key requested features',
    'the requested object with most features',
    'everything the brief asks for, clearly, in the intended style',
  ],
  [
    'silhouette',
    'Silhouette',
    'unreadable blob or box from some views',
    'readable from the front, weak from the side',
    'identifiable as a black cutout from every view; a signature outline feature',
  ],
  [
    'proportion_appeal',
    'Proportion and appeal',
    'accidental or awkward proportions',
    'correct but timid',
    'the defining trait is exaggerated; a clear big/medium/small rhythm; appealing',
  ],
  [
    'shape_language',
    'Shape language',
    'contradicts the intended character',
    'matches in the main forms',
    'every form supports the intended character (friendly, sturdy, dangerous)',
  ],
  [
    'value_color',
    'Value and color',
    'flat, muddy, or many competing colors',
    'coherent palette, weak focal contrast',
    'clear value plan, harmonious palette, accent at the focal point',
  ],
  [
    'materials',
    'Materials',
    'everything reads as one material',
    'materials distinguishable',
    'each material reads distinctly (value, hue, roughness, metal)',
  ],
  [
    'detail_hierarchy',
    'Detail hierarchy',
    'noise everywhere or no detail',
    'details present but evenly spread',
    'detail concentrated at the focal point with calm rest areas',
  ],
  [
    'technical_visual',
    'Technical cleanliness',
    'holes, parts poking through, floating parts, broken surfaces',
    'minor intersections or artifacts',
    'clean surfaces, parts attached, nothing poking through',
  ],
  [
    'readability_128',
    'Readability at 128 px (sprites image)',
    'key features vanish in the sprites',
    'recognizable but the focal point is lost',
    'identity and focal point read in every direction',
  ],
  [
    'motion',
    'Motion (animation strips)',
    'feet slide or sink, parts detach, no clear motion',
    'readable but stiff or too subtle',
    'weight, overlap, planted contacts, clear readable motion',
  ],
] as const;

export type Scores = Partial<Record<(typeof CRITERIA)[number][0], number | null>>;

function prompt(brief: Brief, images: string[]): string {
  const rubric = CRITERIA.filter(([id]) => brief.rig || id !== 'motion')
    .map(([id, name, one, three, five]) => `- ${id} (${name}): 1 = ${one}; 3 = ${three}; 5 = ${five}.`)
    .join('\n');
  return `You are an experienced game art director reviewing a stylized 3D game asset made by an AI model.

The brief was: "${brief.brief}"
Category: ${brief.category}.

Look at every one of these image files (use the Read tool on each, in this directory):
${images.map((i) => `- ${i}`).join('\n')}

render.png is a textured turnaround (front, three-quarter, side, back). sprites/preview.png shows the asset as 128 px pixel-art sprites in 8 directions, enlarged. Files in anim/ are animation strips: rows are camera views, columns are poses over time.

Score each criterion from 1 to 5 (integers; 2 and 4 are between the anchors). Judge what you see, not what the brief promised. Be strict and consistent: 3 is a competent but unremarkable result, 5 is ready to ship in a good indie game.

${rubric}

Answer with a single JSON object and nothing else:
{"scores": {${CRITERIA.filter(([id]) => brief.rig || id !== 'motion')
    .map(([id]) => `"${id}": n`)
    .join(', ')}}, "summary": "one or two sentences", "top_problems": ["...", "...", "..."]}`;
}

function runClaude(text: string, cwd: string): string {
  const model = process.env.JUDGE_MODEL ?? 'claude-opus-5-5';
  const r = spawnSync(
    process.env.JUDGE_CMD ?? 'claude',
    ['-p', '--output-format', 'json', '--model', model, '--allowedTools', 'Read', '--max-turns', '20', text],
    { cwd, encoding: 'utf8', timeout: 10 * 60_000, maxBuffer: 64 * 1024 * 1024 },
  );
  if (r.status !== 0) throw new Error(`judge failed (${r.status}): ${(r.stderr || r.stdout).slice(0, 500)}`);
  const envelope = JSON.parse(r.stdout) as { result?: string };
  return envelope.result ?? r.stdout;
}

function parse(answer: string): { scores: Scores; summary: string; top_problems: string[] } {
  const m = answer.match(/\{[\s\S]*\}/);
  if (!m) throw new Error(`judge answer has no JSON: ${answer.slice(0, 300)}`);
  return JSON.parse(m[0]) as { scores: Scores; summary: string; top_problems: string[] };
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2]! : (s[s.length / 2 - 1]! + s[s.length / 2]!) / 2;
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const runDir = process.argv[2];
  if (!runDir) throw new Error('usage: judge.ts <run-dir>');
  const brief = readJson<Brief>(join(runDir, 'brief.json'));
  const tech = readJson<{ gate: boolean; images: string[] }>(join(runDir, 'tech.json'));
  if (!tech.gate) {
    writeJson(join(runDir, 'judge.json'), { schema: 1, skipped: 'gate failed', scores: null });
    console.log('judge skipped: gate failed');
  } else {
    const n = Number(process.env.JUDGE_SAMPLES ?? 3);
    const samples: ReturnType<typeof parse>[] = [];
    const errors: string[] = [];
    // Judge from a directory outside the repo, holding only the images, so no project
    // CLAUDE.md/AGENTS.md or other context reaches the judge.
    const room = mkdtempSync(join(tmpdir(), 'forge-judge-'));
    for (const img of tech.images) {
      mkdirSync(dirname(join(room, img)), { recursive: true });
      cpSync(join(runDir, 'artifacts', 'out', img), join(room, img));
    }
    try {
      for (let i = 0; i < n; i++) {
        try {
          samples.push(parse(runClaude(prompt(brief, tech.images), room)));
        } catch (e) {
          errors.push((e as Error).message);
        }
      }
    } finally {
      rmSync(room, { recursive: true, force: true });
    }

    const scores: Scores = {};
    for (const [id] of CRITERIA) {
      const xs = samples.map((s) => s.scores[id]).filter((v): v is number => typeof v === 'number');
      scores[id] = xs.length ? median(xs) : null;
    }
    writeJson(join(runDir, 'judge.json'), {
      schema: 1,
      judge: {
        cmd: process.env.JUDGE_CMD ?? 'claude',
        model: process.env.JUDGE_MODEL ?? 'claude-opus-5-5',
        samples: samples.length,
        errors,
      },
      scores: samples.length ? scores : null,
      samples,
    });
    console.log(`judged ${runDir}: ${samples.length}/${n} samples`, scores);
  }
}
