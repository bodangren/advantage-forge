// Checker probe: do the 47 unit 1 reuse files meet the color print checks? Read only.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';

const ROOT = resolve(new URL('../../..', import.meta.url).pathname);
const doc = JSON.parse(readFileSync(resolve(ROOT, 'docs/storytime/l2-unit2/rows.json'), 'utf8'));
const rows = (Array.isArray(doc) ? doc : doc.rows).filter((r) => r.reuse?.source && /-v\d+\.png$/.test(r.reuse.source));
const list = JSON.parse(readFileSync('/home/daniebo/Desktop/Workbooks/content/storytime/drafts/l2/print/pictures-u2.json', 'utf8'));
const listRows = new Map((Array.isArray(list) ? list : list.rows).map((r) => [r.id, r]));
const summary = {};
let bad = 0;
for (const r of rows) {
  const lr = listRows.get(r.id);
  const want = lr ? `${lr.width}x${lr.height}` : '?';
  for (const [role, rel] of [['color', r.reuse.source], ['line', r.reuse.source.replace(/-v(\d+)\.png$/, '-line-v$1.png')]]) {
    const m = await sharp(resolve(ROOT, rel)).metadata();
    const key = `${role} ${m.format} ${m.width}x${m.height} alpha=${m.hasAlpha} ch=${m.channels} depth=${m.depth} space=${m.space} palette=${m.isPalette} want=${want}`;
    summary[key] = (summary[key] ?? 0) + 1;
    if (`${m.width}x${m.height}` !== want) {
      bad++;
      console.log('SIZE MISMATCH', r.id, role, rel, `${m.width}x${m.height}`, 'want', want);
    }
  }
}
for (const [k, v] of Object.entries(summary)) console.log(v, k);
console.log('rows', rows.length, 'size mismatches', bad);
