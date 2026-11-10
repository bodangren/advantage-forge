// Probe P1-A: the frozen guard constants keep their values between 4c950a1d and 6ec8ef66.
// Usage: node measure/runs/asset_storytime_l2_retries_cover_20261110/probe-p1-constants.mjs
// It reads the two blob versions with git show (run from the repository root).

import { execFileSync } from 'node:child_process';

const show = (sha, path) =>
  execFileSync('git', ['show', `${sha}:${path}`], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

const extract = (src, name) => {
  const forms = [
    new RegExp(`export const ${name} = \\{(.|\n)*?\n\};`),
    new RegExp(`export const ${name} = \\[(.|\n)*?\n\];`),
  ];
  for (const re of forms) {
    const m = src.match(re);
    if (m) return m[0];
  }
  return null;
};

const oldSrc = show('4c950a1d', 'scripts/storytime-muse-guards.mjs');
const newSrc = show('6ec8ef66', 'scripts/storytime-muse-guards.mjs');

const names = ['U2_RUN', 'U2_FW_RUN', 'CARD_RUN', 'CARD_LINE_RETRY', 'TRY_EXCEPTIONS'];
let bad = 0;
for (const name of names) {
  const a = extract(oldSrc, name);
  const b = extract(newSrc, name);
  if (a === null || b === null) {
    console.log(`${name}: MISSING`);
    bad += 1;
  } else if (a !== b) {
    console.log(`${name}: CHANGED`);
    bad += 1;
  } else {
    console.log(`${name}: UNCHANGED`);
  }
}
process.exit(bad ? 1 : 0);
