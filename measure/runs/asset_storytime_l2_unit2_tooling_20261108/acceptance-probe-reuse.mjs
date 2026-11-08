// Checker probe: do the reuse sources of rows.json fit the delivery writer? Read only.
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(new URL('../../..', import.meta.url).pathname);
const doc = JSON.parse(readFileSync(resolve(ROOT, 'docs/storytime/l2-unit2/rows.json'), 'utf8'));
const rows = Array.isArray(doc) ? doc : doc.rows;
const reuse = rows.filter((r) => r.reuse && r.reuse.source);
console.log('rows', rows.length, 'reuse rows', reuse.length);
const kinds = {};
for (const r of reuse) kinds[r.reuse.kind ?? 'none'] = (kinds[r.reuse.kind ?? 'none'] ?? 0) + 1;
console.log('kinds', JSON.stringify(kinds));
const bad = reuse.filter((r) => !/-v\d+\.png$/.test(r.reuse.source));
console.log('sources without -v<n>.png:', bad.length);
for (const r of bad) console.log(' ', r.id, JSON.stringify(r.reuse));
const missing = [];
for (const r of reuse) {
  const s = r.reuse.source;
  if (!/-v(\d+)\.png$/.test(s)) continue;
  const l = s.replace(/-v(\d+)\.png$/, '-line-v$1.png');
  if (!existsSync(resolve(ROOT, s))) missing.push(`color ${s}`);
  if (!existsSync(resolve(ROOT, l))) missing.push(`line ${l}`);
}
console.log('missing source files:', missing.length);
for (const m of missing.slice(0, 10)) console.log(' ', m);
console.log('first reuse row', JSON.stringify(reuse[0]));
