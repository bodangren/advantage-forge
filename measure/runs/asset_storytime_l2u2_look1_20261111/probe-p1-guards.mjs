// Acceptance probe for U2_LOOK_TRY (FR-2, FR-3). Fixture cost files live in os.tmpdir only.
import { mkdirSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import * as guards from '../../../scripts/storytime-muse-guards.mjs';

const HEADER = 'time\trow\tversion\tkind\tinputs\toutput\tsize\tusage_cost\tnote';
const TSHIRT = 'l2-w10-story-page-put-on-your-t-shirt';
const HAT_PIP = 'l2-w10-story-page-put-on-your-hat-pip';
const START = guards.U2_LOOK_TRY.startTime;
const row = (id, kind, time, cost = '0.01', note = 'ok') =>
  `${time}\t${id}\tm1\t${kind}\tin\t${id}.png\t1500x1500\t${cost}\t${note}`;
const spec = (id) => ({ spec: { id, outDir: 'out/storytime/l2/unit2/w10/muse' } });
const root = mkdtempSync(path.join(os.tmpdir(), 'l2look1-accept-'));
const write = (rel, rows) => {
  const f = path.join(root, rel);
  mkdirSync(path.dirname(f), { recursive: true });
  writeFileSync(f, `${HEADER}\n${rows.join('\n')}\n`);
};

// A: a 4th color try of the listed id is refused.
write('w10/muse/costs.tsv', [
  row(TSHIRT, 'color', '2026-11-10T20:00:00Z'), // before startTime, ignored
  row(TSHIRT, 'color', START),
  row(TSHIRT, 'color', '2026-11-11T00:30:00Z'),
  row(TSHIRT, 'color', '2026-11-11T00:40:00Z'),
]);
let r = guards.runGuards(root, [spec(TSHIRT)], 'color');
console.log('A 4th color try refused:', r.refused === true, '|', r.message);

// B: spend over the 0.10 cap (with margin) is refused.
write('w10/muse/costs.tsv', [
  row(TSHIRT, 'color', START, '0.095'),
]);
r = guards.runGuards(root, [spec(TSHIRT)], 'color');
console.log('B over-cap refused:', r.refused === true, '|', r.message);
write('w10/muse/costs.tsv', [row(TSHIRT, 'color', START, '0.09')]);
r = guards.runGuards(root, [spec(TSHIRT)], 'color');
console.log('B exact cap allowed:', r.refused === false);

// C: an unlisted id keeps the normal rule (hat-pip color has 0 tries of the look start).
write('w10/muse/costs.tsv', [row(HAT_PIP, 'color', START)]);
r = guards.runGuards(root, [spec(HAT_PIP)], 'color');
console.log('C unlisted id allowed under normal rule:', r.refused === false);
write('w10/muse/costs.tsv', [
  row(HAT_PIP, 'color', '2026-11-08T00:00:00Z'),
  row(HAT_PIP, 'color', '2026-11-08T01:00:00Z'),
  row(HAT_PIP, 'color', '2026-11-08T02:00:00Z'),
]);
r = guards.runGuards(root, [spec(HAT_PIP)], 'color');
console.log('C unlisted id 4th try refused by normal rule:', r.refused === true, '|', r.message);

// D: cliGuardOptions strips u2LookCapUsd.
const stripped = guards.cliGuardOptions({ u2LookCapUsd: 5, u2CapUsd: 5, coverCapUsd: 5 });
console.log('D u2LookCapUsd stripped:', !('u2LookCapUsd' in stripped), 'others stripped:',
  !('u2CapUsd' in stripped) && !('coverCapUsd' in stripped));

// E: no split CARD_RUN literal in the guards file.
import { readFileSync } from 'node:fs';
const src = readFileSync(new URL('../../../scripts/storytime-muse-guards.mjs', import.meta.url), 'utf8');
const suspicious = /CARD_\s*RUN|RUN\.?\s*card|cardRun/i.test(src.replace(/CARD_RUN/g, ''));
console.log('E no split card literal:', !suspicious);

rmSync(root, { recursive: true, force: true });
