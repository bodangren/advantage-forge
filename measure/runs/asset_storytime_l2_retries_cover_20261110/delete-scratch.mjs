// Task 8 of Phase 2. The scratch delete of D13.
// It lists the scratch first, then deletes it, then checks that it is gone.
import { existsSync, readdirSync, rmSync, statSync } from 'node:fs';

const targets = [
  { path: '/tmp/opencode/l2rc', note: 'the scratch folder of D13' },
  { path: '/tmp/opencode/l2rc-sumtest', note: 'the scratch of the MANIFEST check of this step' },
  { path: '/tmp/judge-u2rc', note: 'the judge scratch of the PM of 2026-11-10' },
];

console.log('## The list');
for (const t of targets) {
  if (!existsSync(t.path)) {
    console.log(`${t.path}\tmissing\t${t.note}`);
    continue;
  }
  let files = 0;
  let bytes = 0;
  const walk = (p) => {
    for (const name of readdirSync(p)) {
      const full = `${p}/${name}`;
      const s = statSync(full);
      if (s.isDirectory()) walk(full);
      else {
        files += 1;
        bytes += s.size;
      }
    }
  };
  walk(t.path);
  console.log(`${t.path}\t${files} files\t${bytes} bytes\t${t.note}`);
}

console.log('## The staging folders under out/');
const roots = ['out/storytime/covers', 'out/storytime/l2/unit2'];
let staging = [];
for (const root of roots) {
  if (!existsSync(root)) continue;
  const walk = (p) => {
    for (const name of readdirSync(p)) {
      const full = `${p}/${name}`;
      if (!statSync(full).isDirectory()) continue;
      const low = name.toLowerCase();
      if (low.includes('stage') || low.includes('tmp')) staging.push(full);
      walk(full);
    }
  };
  walk(root);
}
console.log(staging.length ? staging.join('\n') : 'none');

console.log('## The delete');
for (const t of targets) {
  if (!existsSync(t.path)) {
    console.log(`${t.path}\talready gone`);
    continue;
  }
  rmSync(t.path, { recursive: true, force: true });
  console.log(`${t.path}\tdeleted\t${existsSync(t.path) ? 'STILL THERE' : 'gone'}`);
}

console.log('## The kept files');
const kept = [
  'out/storytime/covers/teacher-front/muse/costs.tsv',
  'out/storytime/covers/teacher-front/muse/l2-u1-cover-quest-teacher-front-m6-color-print.png',
  'out/storytime-review/judge/cover/l2-u1-cover-quest-teacher-front-m6-zones.png',
  'measure/runs/asset_storytime_l2_retries_cover_20261110/spend-log.tsv',
  'measure/runs/asset_storytime_l2_retries_cover_20261110/judge-cover-r2.json',
  'measure/runs/asset_storytime_l2_retries_cover_20261110/judge-cover-second-r2.json',
  '/home/daniebo/Desktop/handoff/storytime-l2u2-book-pictures-retry1',
  '/home/daniebo/Desktop/handoff/storytime-cover-teacher-front-forge',
];
for (const k of kept) console.log(`${existsSync(k) ? 'kept' : 'MISSING'}\t${k}`);
