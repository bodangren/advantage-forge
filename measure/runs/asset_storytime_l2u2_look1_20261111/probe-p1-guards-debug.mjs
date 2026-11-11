import { mkdirSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import * as guards from '../../../scripts/storytime-muse-guards.mjs';

const HEADER = 'time\trow\tversion\tkind\tinputs\toutput\tsize\tusage_cost\tnote';
const HAT_PIP = 'l2-w10-story-page-put-on-your-hat-pip';
const START = guards.U2_LOOK_TRY.startTime;
const row = (id, kind, time, cost = '0.01', note = 'ok') =>
  `${time}\t${id}\tm1\t${kind}\tin\t${id}.png\t1500x1500\t${cost}\t${note}`;
const spec = (id) => ({ spec: { id, outDir: 'out/storytime/l2/unit2/w10/muse' } });
const root = mkdtempSync(path.join(os.tmpdir(), 'l2look1-accept2-'));
const write = (rel, rows) => {
  const f = path.join(root, rel);
  mkdirSync(path.dirname(f), { recursive: true });
  writeFileSync(f, `${HEADER}\n${rows.join('\n')}\n`);
};
write('w10/muse/costs.tsv', [row(HAT_PIP, 'color', START)]);
const r = guards.runGuards(root, [spec(HAT_PIP)], 'color');
console.log(JSON.stringify(r, null, 1));
rmSync(root, { recursive: true, force: true });
