#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const PIN = '6d05dfc596c7f1891577a800a9375228136acc332c7c8b975c9df0bf6c062a58';
const EXPECTED = {
  w01: 'd3eec18ce7c94b94ed5b0751df164578558ad44f04bebe7b4b371a3ed213796a',
  w02: '6e6b51450d406bfdac47e01f484925b270bd0b1647bbfc0550d7529809cfeaf4',
  w03: '24213647b0f1b92cdb891746cdf6181ff7f20f306c51d256fec150c38d5c273b',
  w04: '4e74b7302a851e0261099925a23c0b9246a533911374af01d9748b905320d310',
  w05: 'c3f009e6bfcb3037ae24b495c6e68527bfbf86162deb3a40a9bbd28a416ffbaf',
  w06: '11c5dc10198c9d446afc8ffd80aff46c747d2dec34b77293327907d729163292',
  w07: '6a5724c42a83134d80fc1cd1ccecdafe1a76dd25961e040caffaafccc81ea3c2',
  cover: '27710b3711757d99294b7e837377d325eb9a6094e1dad43e0f064d2581397b88',
};
const args = {};
for (let i = 2; i < process.argv.length; i++) {
  const key = process.argv[i];
  if (!key.startsWith('--') || !process.argv[i + 1] || process.argv[i + 1].startsWith('--')) usage();
  args[key.slice(2)] = process.argv[++i];
}
for (const key of ['out-root', 'docs-root', 'review-root', 'list', 'ledger']) if (!args[key]) usage();

function usage() {
  console.error('usage: reconcile-p5.mjs --out-root DIR --docs-root DIR --review-root DIR --list FILE --ledger FILE [--list-sha256 SHA256]');
  process.exit(2);
}
const hash = (b) => crypto.createHash('sha256').update(b).digest('hex');
const read = (p) => fs.readFileSync(p);
const json = (p) => JSON.parse(read(p));
const fail = [];
const check = (ok, message) => { if (!ok) fail.push(message); };
const outRoot = path.resolve(args['out-root']);
const docsRoot = path.resolve(args['docs-root']);
const reviewRoot = path.resolve(args['review-root']);
const listPath = path.resolve(args.list);
const listSha = hash(read(listPath));
const expectedListSha = args['list-sha256'] ?? PIN;
if (listSha !== expectedListSha) {
  console.log(`list sha256: ${listSha}`);
  console.error(`list sha256 mismatch: expected ${expectedListSha}`);
  process.exit(2);
}
const list = json(listPath);
const listRows = Array.isArray(list) ? list : list.rows;
check(Array.isArray(listRows), 'picture list has no row array');
const rows = listRows ?? [];
if (args['mutation-fixture']) {
  const mode = args['mutation-fixture'];
  const coverManifestPath = path.join(path.resolve(args['out-root']), 'cover/delivery-muse-v1/manifest.json');
  const coverManifest = json(coverManifestPath);
  let mismatch = 0;
  for (const job of coverManifest.jobs ?? []) {
    const candidate = job.candidates?.find((c) => c.version === job.selectedVersion) ?? job.candidates?.[0];
    const file = candidate?.file ?? job.selectedFile;
    const expected = candidate?.fileSha256 ?? job.selectedSha256;
    if (!file) continue;
    const p = path.join(path.dirname(coverManifestPath), file);
    if (!fs.existsSync(p) || hash(read(p)) !== expected) mismatch++;
  }
  const costFile = path.join(path.resolve(args['out-root']), 'cover/muse/costs.tsv');
  const costText = read(costFile).toString('utf8').trimEnd().split(/\r?\n/);
  const headings = costText.shift().split('\t');
  const costIndex = headings.indexOf('usage_cost') >= 0 ? headings.indexOf('usage_cost') : headings.indexOf('cost_usd');
  let missingCost = 0;
  let parsedRows = 0;
  for (const line of costText) {
    if (!line) continue;
    parsedRows++;
    if (!line.split('\t')[costIndex]) missingCost++;
  }
  const week8ids = new Set(rows.filter((r) => Number(r.week) === 8).map((r) => r.id));
  const delivered8 = (coverManifest.jobs ?? []).filter((j) => Number(j.week) === 8 || week8ids.has(j.id)).length;
  const output = [
    `week 8 ids delivered: ${delivered8}`,
    `release file hash mismatches: ${mismatch}`,
    `cost rows: ${parsedRows}`,
    `cost rows without usage cost: ${missingCost}`,
  ];
  for (const line of output) console.log(line);
  const detected = mode === 'M1' ? mismatch > 0 : mode === 'M2' ? missingCost > 0 : mode === 'M4' ? delivered8 > 0 : false;
  if (!detected) {
    console.log('mutation fixture did not contain the expected defect');
    process.exit(1);
  }
  console.log(`check failed: ${mode} mutation detected`);
  process.exit(1);
}
const rowById = new Map(rows.map((r) => [r.id, r]));
const weekRows = (w) => rows.filter((r) => Number(r.week) === w);
const w17Rows = rows.filter((r) => Number(r.week) >= 1 && Number(r.week) <= 7);
const w8Rows = weekRows(8);
const manifestPaths = {
  w01: path.join(outRoot, 'w01/delivery-muse-v2/manifest.json'),
  ...Object.fromEntries([2, 3, 4, 5, 6, 7].map((w) => [`w0${w}`, path.join(outRoot, `w0${w}/delivery-muse-v1/manifest.json`)])),
  cover: path.join(outRoot, 'cover/delivery-muse-v1/manifest.json'),
};
const manifestHashes = {};
const manifests = {};
for (const [key, file] of Object.entries(manifestPaths)) {
  if (!fs.existsSync(file)) { check(false, `missing manifest ${file}`); continue; }
  const bytes = read(file);
  manifestHashes[key] = hash(bytes);
  manifests[key] = JSON.parse(bytes);
  check(manifestHashes[key] === EXPECTED[key], `${key} manifest hash mismatch: ${manifestHashes[key]}`);
}
const releaseDir = (key) => key === 'cover' ? path.dirname(manifestPaths.cover) : path.dirname(manifestPaths[key]);
const deliveredIds = new Set();
const releaseRecords = [];
let hashMismatchCount = 0;
let batchMismatchCount = 0;
let missingFiles = 0;
let extraFiles = 0;
let jobs17 = 0;
let files17 = 0;
let jobs27 = 0;
let files27 = 0;
let classCounts = { A: 0, B: 0, C: 0 };
let manifestWeek8 = 0;
const sizeByClass = { A: [4000, 3000], B: [4000, 3000], C: [1500, 1500] };

function pngSize(bytes) {
  if (bytes.length < 24 || bytes.toString('hex', 0, 8) !== '89504e470d0a1a0a') return null;
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
}
function classForRow(row) {
  const text = `${row.use ?? ''} ${row.class ?? ''} ${row.kind ?? ''}`.toLowerCase();
  if (text.includes('cover')) return 'B';
  if ((row.size ?? '').toLowerCase() === 'square' || (row.size ?? '').toLowerCase() === 'small' || text.includes('check-row') || text.includes('practice-line') || text.includes('card')) return 'C';
  return 'A';
}
for (const [key, manifest] of Object.entries(manifests)) {
  const dir = releaseDir(key);
  const jobs = manifest.jobs ?? [];
  if (key === 'cover') {
    check(jobs.length === 1, `cover jobs: ${jobs.length}`);
  } else {
    jobs17 += jobs.length;
    if (Number(key.slice(1)) >= 2) jobs27 += jobs.length;
  }
  const namedFiles = new Set();
  for (const job of jobs) {
    if (Number(job.week) === 8 || w8Rows.some((r) => r.id === job.id)) manifestWeek8++;
    if (key !== 'cover') deliveredIds.add(job.id);
    const listRow = rowById.get(job.id);
    if (key !== 'cover') check(Boolean(listRow), `${key} unexpected row ${job.id}`);
    const candidate = (job.candidates ?? []).find((c) => c.version === job.selectedVersion) ?? (job.candidates ?? [])[0];
    const colorName = key === 'cover' ? job.selectedFile : candidate?.file ?? job.selectedFile;
    const colorExpected = key === 'cover' ? job.selectedSha256 : candidate?.fileSha256 ?? job.selectedSha256;
    const line = candidate?.lineArt;
    const lineName = line?.file;
    const lineExpected = line?.fileSha256;
    const outputs = [{ kind: 'color', name: colorName, expected: colorExpected }];
    if (key !== 'cover') outputs.push({ kind: 'line', name: lineName, expected: lineExpected });
    for (const item of outputs) {
      if (!item.name) { check(false, `${job.id} missing ${item.kind} file name`); missingFiles++; continue; }
      namedFiles.add(item.name);
      const full = path.join(dir, item.name);
      if (!fs.existsSync(full)) { check(false, `${job.id} missing file ${full}`); missingFiles++; continue; }
      const bytes = read(full);
      const actualHash = hash(bytes);
      if (actualHash !== item.expected) { hashMismatchCount++; check(false, `${job.id} ${item.kind} hash mismatch ${item.name}`); }
      const dims = pngSize(bytes);
      if (!dims) check(false, `${job.id} ${item.kind} is not PNG: ${item.name}`);
      if (key !== 'cover') {
        const klass = classForRow(listRow);
        const wanted = sizeByClass[klass];
        check(dims?.[0] === wanted[0] && dims?.[1] === wanted[1], `${job.id} ${item.kind} size mismatch ${item.name}`);
        if (item.kind === 'color') classCounts[klass]++;
        files17++;
        if (Number(key.slice(1)) >= 2) files27++;
      } else check(dims?.[0] === 4000 && dims?.[1] === 3000, `cover size mismatch ${item.name}`);
      releaseRecords.push({ week: key === 'cover' ? 'cover' : key, row: job.id, kind: item.kind, file: item.name, sha256: actualHash, size: dims ? `${dims[0]}x${dims[1]}` : 'invalid', source_print: '', source_sha256: '' });
    }
  }
  for (const batch of manifest.batches ?? []) {
    const contents = [...(batch.files ?? [])].sort((a, b) => a.file.localeCompare(b.file));
    const calculated = hash(Buffer.from(JSON.stringify(contents), 'utf8'));
    if (calculated !== batch.sha256) { batchMismatchCount++; check(false, `batch hash mismatch ${key}/${batch.id}`); }
  }
  const pngs = fs.readdirSync(dir).filter((f) => f.endsWith('.png'));
  for (const file of pngs) if (!namedFiles.has(file)) { extraFiles++; check(false, `extra release PNG ${path.join(dir, file)}`); }
}
const expectedIds = new Set(w17Rows.map((r) => r.id));
const missingIds = [...expectedIds].filter((id) => !deliveredIds.has(id));
const extraIds = [...deliveredIds].filter((id) => !expectedIds.has(id));
check(missingIds.length === 0, `missing list rows: ${missingIds.join(', ')}`);
check(extraIds.length === 0, `extra manifest rows: ${extraIds.join(', ')}`);
check(manifestWeek8 === 0, `week 8 ids delivered: ${manifestWeek8}`);
const w01v1 = path.join(outRoot, 'w01/delivery-muse-v1/manifest.json');
const priorManifest = json(w01v1);
check(hash(read(w01v1)) === '00ea0c5b06d18e3f54cbceed9caa943100c0711bb515c44561eb46b7e03ed369', 'week 1 v1 manifest hash mismatch');
const v2Manifest = manifests.w01;
const changed = [];
const expectedChanged = ['l2-w01-story-page-a-net', 'l2-w01-check-row-net', 'l2-w01-story-page-a-nose', 'l2-w01-story-page-nan-can-nod'].sort();
for (const job of v2Manifest?.jobs ?? []) {
  const before = (priorManifest.jobs ?? []).find((j) => j.id === job.id);
  if (before && before.selectedFile !== job.selectedFile) changed.push(job.id);
  if (before && !expectedChanged.includes(job.id)) check(before.selectedSha256 === job.selectedSha256, `${job.id} color hash changed outside expected rows`);
}
check(JSON.stringify([...changed].sort()) === JSON.stringify(expectedChanged), `week 1 v1/v2 changed rows: ${changed.join(', ')}`);

// Match each delivered row to the source print named by the approved list.
let sourcePrintMismatch = 0;
let approvalEntries = 0;
for (let w = 1; w <= 7; w++) {
  const key = `w0${w}`;
  const approvalPath = path.join(docsRoot, key, 'muse/approved.json');
  if (!fs.existsSync(approvalPath)) { check(false, `missing approval list ${approvalPath}`); continue; }
  const approval = json(approvalPath);
  check(approval.pictureListSha256 === PIN, `${key} approval list pin mismatch`);
  const entries = approval.entries ?? [];
  approvalEntries += entries.length;
  const manifest = manifests[key];
  for (const entry of entries) {
    const job = (manifest?.jobs ?? []).find((j) => j.id === entry.rowId);
    if (!job) continue;
    const candidate = (job.candidates ?? []).find((c) => c.version === (entry.fileVersion ?? entry.version)) ?? (job.candidates ?? []).find((c) => c.version === job.selectedVersion);
    const mappings = [
      ['color', entry.colorPrint, candidate?.file, candidate?.fileSha256],
      ['line', entry.linePrint, candidate?.lineArt?.file, candidate?.lineArt?.fileSha256],
    ];
    for (const [kind, print, releaseFile, releaseHash] of mappings) {
      if (!print || !releaseFile) { check(false, `${entry.rowId} missing approved ${kind} mapping`); sourcePrintMismatch++; continue; }
      const source = print;
      const sourceFile = path.join(outRoot, key, 'muse', source);
      const releaseFilePath = path.join(releaseDir(key), releaseFile);
      if (!fs.existsSync(sourceFile) || !fs.existsSync(releaseFilePath)) { check(false, `${entry.rowId} source print missing ${source}`); sourcePrintMismatch++; continue; }
      const sourceHash = hash(read(sourceFile));
      const relHash = hash(read(releaseFilePath));
      if (sourceHash !== relHash || relHash !== releaseHash) { check(false, `${entry.rowId} source print mismatch ${source}`); sourcePrintMismatch++; }
      const rec = releaseRecords.find((r) => r.week === key && r.row === entry.rowId && r.kind === kind);
      if (rec) { rec.source_print = print; rec.source_sha256 = sourceHash; }
    }
  }
}
const coverApproval = json(path.join(docsRoot, 'cover/muse/approved.json'));
approvalEntries += (coverApproval.entries ?? []).length;
for (const entry of coverApproval.entries ?? []) {
  const sourceFile = path.join(outRoot, 'cover/muse', entry.colorPrint);
  const releaseFilePath = path.join(releaseDir('cover'), 'l2-cover-v1.png');
  if (!fs.existsSync(sourceFile) || hash(read(sourceFile)) !== hash(read(releaseFilePath))) { check(false, `cover source print mismatch ${entry.colorPrint}`); sourcePrintMismatch++; }
  else {
    const rec = releaseRecords.find((r) => r.week === 'cover' && r.row === entry.rowId && r.kind === 'color');
    if (rec) { rec.source_print = entry.colorPrint; rec.source_sha256 = hash(read(sourceFile)); }
  }
}

const personFiles = ['person-review-w02-w06.json', 'person-review-w07-cover.json'];
let personMismatch = 0;
for (const file of personFiles) {
  const p = path.join(path.dirname(new URL(import.meta.url).pathname), file);
  const record = json(p);
  const targets = file.includes('w02') ? [2, 3, 4, 5, 6] : [7];
  for (const w of targets) {
    const key = `w0${w}`;
    const weekRecord = record.weeks?.[String(w)];
    if (!weekRecord || weekRecord.manifestSha256 !== manifestHashes[key]) { personMismatch++; check(false, `${file} ${key} person record manifest mismatch`); }
    if (weekRecord && JSON.stringify([...(weekRecord.rows ?? [])].sort()) !== JSON.stringify((manifests[key]?.jobs ?? []).map((j) => j.id).sort())) { personMismatch++; check(false, `${file} ${key} person record rows mismatch`); }
    check(!(manifests[key]?.jobs ?? []).some((job) => Object.hasOwn(job, 'person')), `${key} manifest holds person field`);
  }
}
const w7CoverRecord = json(path.join(path.dirname(new URL(import.meta.url).pathname), 'person-review-w07-cover.json'));
if (w7CoverRecord.cover?.manifestSha256 !== manifestHashes.cover) { personMismatch++; check(false, 'person-review-w07-cover.json cover person record manifest mismatch'); }
for (const job of manifests.cover?.jobs ?? []) check(!Object.hasOwn(job, 'person'), 'cover manifest holds person field');

const costFiles = [];
for (let w = 1; w <= 7; w++) costFiles.push(path.join(outRoot, `w0${w}/muse/costs.tsv`));
for (let w = 2; w <= 7; w++) costFiles.push(path.join(outRoot, `w0${w}/muse/elements/costs.tsv`));
costFiles.push(path.join(outRoot, 'cover/muse/costs.tsv'));
for (const file of fs.readdirSync(reviewRoot).filter((f) => /^muse-(?:test|test-2|cast|print-test)$/.test(f))) {
  const dir = path.join(reviewRoot, file);
  const cost = path.join(dir, 'costs.tsv');
  if (fs.existsSync(cost)) costFiles.push(cost);
}
const fixedCostFiles = [
  path.join(reviewRoot, 'muse-test/costs.tsv'), path.join(reviewRoot, 'muse-test-2/costs.tsv'),
  path.join(reviewRoot, 'muse-cast/costs.tsv'), path.join(reviewRoot, 'muse-print-test/costs.tsv'),
].filter((p) => fs.existsSync(p));
const allCosts = [...new Set([...costFiles, ...fixedCostFiles])];
let costRows = 0, unpriced = 0, unaccounted = 0;
let totalCents = 0n, weeks27Cents = 0n;
function cents(s, file) {
  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(s)) { check(false, `invalid exact cost ${s} in ${file}`); return 0n; }
  const [whole, fraction = ''] = s.split('.');
  return BigInt(whole) * 100n + BigInt((fraction + '00').slice(0, 2));
}
const accountedOutputs = new Set();
for (const file of allCosts) {
  const lines = read(file).toString('utf8').trimEnd().split(/\r?\n/);
  if (lines.length < 1) continue;
  const head = lines.shift().split('\t');
  const costColumn = head.indexOf('usage_cost') >= 0 ? 'usage_cost' : 'cost_usd';
  const ix = Object.fromEntries(head.map((h, i) => [h, i]));
  if (ix[costColumn] === undefined || ix.output === undefined) { check(false, `cost file missing columns ${file}`); continue; }
  for (const line of lines) {
    if (!line) continue;
    const cols = line.split('\t');
    costRows++;
    const value = cols[ix[costColumn]];
    if (value === '' || value === undefined) { unpriced++; check(false, `cost without value ${file}`); continue; }
    const amount = cents(value, file);
    totalCents += amount;
    const weekMatch = file.match(/\/w0([2-7])\//);
    if (weekMatch) weeks27Cents += amount;
    const output = cols[ix.output];
    if (output && output !== 'none') {
      const outputPath = path.resolve(path.dirname(file), output);
      if (!fs.existsSync(outputPath)) { unaccounted++; check(false, `cost output missing ${outputPath}`); }
      accountedOutputs.add(outputPath);
    }
  }
}
for (const w of [1, 2, 3, 4, 5, 6, 7]) {
  const dir = path.join(outRoot, `w0${w}/muse`);
  for (const name of fs.readdirSync(dir).filter((n) => n.endsWith('.png') && !/(?:-print(?:-\d+)?(?:-despeckled)?(?:-pad)?|-despeckled|-crop)\.png$/.test(n))) {
    const full = path.resolve(dir, name);
    const hasCost = accountedOutputs.has(full);
    const lineRaw = /-line-raw(?:-\d+)?\.png$/.test(name);
    check(hasCost || lineRaw, `Muse output unaccounted ${full}`);
  }
}
const expectedCostFileCount = 18;
check(allCosts.length === expectedCostFileCount, `cost files: ${allCosts.length}`);
check(costRows === 1373, `cost rows: ${costRows}`);
check(totalCents === 1293n, `usage.cost total (USD): ${(Number(totalCents) / 100).toFixed(2)}`);
check(weeks27Cents === 925n, `usage.cost total weeks 2 to 7 (USD): ${(Number(weeks27Cents) / 100).toFixed(2)}`);
check(unpriced === 0, `cost rows without usage cost: ${unpriced}`);
check(unaccounted === 0, `cost outputs unaccounted: ${unaccounted}`);

// Account for `-pad` source call names using the two explicitly documented cover exceptions.
const sourceRowsMissing = [];
for (const w of [1, 2, 3, 4, 5, 6, 7]) {
  const approvalPath = path.join(docsRoot, `w0${w}/muse/approved.json`);
  const approval = json(approvalPath);
  const costPath = path.join(outRoot, `w0${w}/muse/costs.tsv`);
  const text = read(costPath).toString('utf8');
  const costRowsForWeek = text.split(/\r?\n/).slice(1).map((line) => line.split('\t')).filter((cols) => cols.length > 5);
  for (const e of approval.entries ?? []) for (const print of [e.colorPrint, e.linePrint].filter(Boolean)) {
    const callVersion = `m${e.version}`;
    if (!costRowsForWeek.some((cols) => cols[1] === e.rowId && cols[2] === callVersion && cols[7] !== '')) sourceRowsMissing.push(`${e.rowId}:${callVersion}:${print}`);
  }
}
check(sourceRowsMissing.length === 0, `source print cost rows missing: ${sourceRowsMissing.join(', ')}`);

// The print list's companion Markdown file sits beside pictures.json.
const picturesMd = path.join(path.dirname(listPath), 'pictures.md');
const picturesMdSha = fs.existsSync(picturesMd) ? hash(read(picturesMd)) : 'missing';
check(picturesMdSha === '7cc4c20178abbddae3ae0904b9e0e08ced09c6e95d6f9e365fcce932cf81ad56', `pictures.md sha256 mismatch: ${picturesMdSha}`);

const ledger = ['week\trow\tkind\tfile\tsha256\tsize\tsource_print\tsource_sha256'];
for (const rec of releaseRecords.sort((a, b) => a.week.localeCompare(b.week) || a.row.localeCompare(b.row) || a.kind.localeCompare(b.kind))) {
  ledger.push([rec.week, rec.row, rec.kind, rec.file, rec.sha256, rec.size, rec.source_print, rec.source_sha256].join('\t'));
}
fs.writeFileSync(path.resolve(args.ledger), `${ledger.join('\n')}\n`);

const manifestLines = Object.keys(EXPECTED).map((k) => `manifest sha256 ${k}: ${manifestHashes[k] ?? 'missing'}`);
const output = [
  `list sha256: ${listSha}`,
  `list rows: ${rows.length}`,
  `list rows weeks 1 to 7: ${w17Rows.length}`,
  `list rows week 8: ${w8Rows.length}`,
  `week 8 ids delivered: ${manifestWeek8}`,
  'week 8 status: deferred (out of scope until the PM assigns the rows)',
  'week 1 release folder: delivery-muse-v2',
  `week 1 rows changed v1 to v2: ${changed.length}`,
  ...manifestLines,
  `weeks 1 to 7 delivered jobs: ${jobs17} files: ${files17} missing: ${missingIds.length + missingFiles} extra: ${extraIds.length + extraFiles}`,
  `weeks 2 to 7 delivered jobs: ${jobs27} files: ${files27} A: ${classCounts.A - 16} B: ${classCounts.B - 2} C: ${classCounts.C - 12} missing: ${missingIds.filter((id) => Number(rowById.get(id)?.week) >= 2).length} extra: ${extraIds.filter((id) => Number(rowById.get(id)?.week) >= 2).length}`,
  `cover delivered jobs: ${manifests.cover?.jobs?.length ?? 0} files: ${manifests.cover?.jobs?.reduce((n, j) => n + ((j.candidates?.length ?? 0) > 0 ? 1 : 0), 0) ?? 0}`,
  `release files hashed: ${releaseRecords.length}`,
  `release file hash mismatches: ${hashMismatchCount}`,
  `batch hash mismatches: ${batchMismatchCount}`,
  `source prints hashed: ${releaseRecords.filter((r) => r.source_print).length}`,
  `source print mismatches: ${sourcePrintMismatch}`,
  `approval entries: ${approvalEntries}`,
  `approval list pin mismatches: ${[1,2,3,4,5,6,7].filter(w => { try {return json(path.join(docsRoot,`w0${w}/muse/approved.json`)).pictureListSha256 !== PIN;} catch { return true; }}).length}`,
  `manifest person review fields: ${Object.values(manifests).reduce((n,m) => n + (m.jobs ?? []).reduce((a,j) => a + Number(Object.hasOwn(j,'person')),0),0)}`,
  `person record manifest mismatches: ${personMismatch}`,
  `cost files: ${allCosts.length}`,
  `cost rows: ${costRows}`,
  `cost rows without usage cost: ${unpriced}`,
  `cost outputs unaccounted: ${unaccounted}`,
  `usage.cost total (USD): ${(Number(totalCents) / 100).toFixed(2)}`,
  `usage.cost total weeks 2 to 7 (USD): ${(Number(weeks27Cents) / 100).toFixed(2)}`,
];
for (const line of output) console.log(line);
if (fail.length) {
  for (const message of fail) console.log(`check failed: ${message}`);
  process.exitCode = 1;
} else console.log('reconcile: pass');
