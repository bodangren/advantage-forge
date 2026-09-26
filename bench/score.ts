/**
 * Combine the technical checks and the visual judge into score.json.
 *
 *   total = gate ? 0.3 * tech + 0.7 * visual - 10 * (contract violated) : 0
 *
 * visual maps each 1-5 criterion to 0-100 and weights brief fidelity x2 and silhouette and
 * proportion x1.5. A failed gate (no asset, build failure) is a valid zero. A missing judge makes
 * the record invalid (total null) rather than a misleading partial score.
 *
 *   tsx bench/score.ts <run-dir>
 */
import { join } from 'node:path';
import { CRITERIA, type Scores } from './judge.js';
import { readJson, readJsonIf, writeJson } from './lib.js';
import type { Brief } from './prompt.js';

const WEIGHTS: Record<string, number> = { brief_fidelity: 2, silhouette: 1.5, proportion_appeal: 1.5 };

const runDir = process.argv[2];
if (!runDir) throw new Error('usage: score.ts <run-dir>');
const brief = readJson<Brief>(join(runDir, 'brief.json'));
const meta = readJsonIf<Record<string, unknown>>(join(runDir, 'meta.json')) ?? {};
const tech = readJson<{
  gate: boolean;
  gate_reason: string | null;
  tech_score: number;
  violations: string[];
}>(join(runDir, 'tech.json'));
const judge = readJsonIf<{ scores: Scores | null; judge?: unknown }>(join(runDir, 'judge.json'));

let visual: number | null = null;
if (judge?.scores) {
  let sum = 0;
  let wsum = 0;
  for (const [id] of CRITERIA) {
    if (id === 'motion' && !brief.rig) continue;
    const v = judge.scores[id];
    if (typeof v !== 'number') continue;
    const w = WEIGHTS[id] ?? 1;
    sum += ((v - 1) / 4) * 100 * w;
    wsum += w;
  }
  visual = wsum ? Math.round((10 * sum) / wsum) / 10 : null;
}

const penalty = tech.violations.length ? 10 : 0;
const valid = !tech.gate || visual !== null;
const total = !tech.gate
  ? 0
  : visual === null
    ? null
    : Math.max(0, Math.round(10 * (0.3 * tech.tech_score + 0.7 * visual - penalty)) / 10);

writeJson(join(runDir, 'score.json'), {
  schema: 1,
  run: meta,
  brief: brief.id,
  category: brief.category,
  valid,
  blocked_by_gate: !tech.gate,
  gate_reason: tech.gate_reason,
  tech: tech.tech_score,
  visual,
  contract_violations: tech.violations.length,
  total,
  judge_scores: judge?.scores ?? null,
});
console.log(
  `scored ${runDir}: total ${total} (tech ${tech.tech_score}, visual ${visual}, violations ${tech.violations.length})`,
);
