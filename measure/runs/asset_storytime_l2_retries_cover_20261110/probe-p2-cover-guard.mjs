// Probe P2-C: dry guard check against the REAL restored cover cost file (no call, no key).
// runGuards must refuse a 7th cover color call: count 6 (max 6), spend 0.06 of 0.10.
// Usage: node measure/runs/asset_storytime_l2_retries_cover_20261110/probe-p2-cover-guard.mjs
import * as guards from '../../../scripts/storytime-muse-guards.mjs';

const REPO = '/home/daniebo/Desktop/advantage-forge';
const COVER_ID = 'l2-u1-cover-quest-teacher-front';
const COVER_DIR = 'out/storytime/covers/teacher-front/muse';

const ctx = { spec: { id: COVER_ID, outDir: COVER_DIR } };
const res = guards.runGuards(REPO, [ctx], 'color', {});

console.log(JSON.stringify({
  run: res.run,
  refused: res.refused,
  code: res.code,
  spend: res.spend,
  message: res.message,
}, null, 2));

const ok = res.refused === true
  && res.code === 3
  && Math.abs(res.spend - 0.06) < 1e-9
  && String(res.message).includes('count 6 (max 6)');
console.log(ok ? 'PASS: the guard refuses a 7th cover call against the real cost file.' : 'FAIL: guard did not refuse as expected.');
process.exit(ok ? 0 : 1);
