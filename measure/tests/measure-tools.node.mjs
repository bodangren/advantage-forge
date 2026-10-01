import assert from 'node:assert/strict';
import { chmodSync, mkdtempSync, mkdirSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { freshnessErrors, localMarkdownLinkErrors, validateMetadata, writeFacts } from '../tools/common.mjs';

const repository = process.cwd();

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'measure-tools-'));
  for (const path of ['measure/generated', 'measure/tracks/asset_quality_20260928', 'assets', 'scenes', 'src/host', 'docs']) {
    mkdirSync(join(root, path), { recursive: true });
  }
  writeFileSync(join(root, 'assets/torch.ts'), 'export default {};\n');
  writeFileSync(join(root, 'scenes/camp.ts'), 'export default {};\n');
  writeFileSync(join(root, 'src/host/main.ts'), 'export {};\n');
  writeFileSync(join(root, 'docs/fantasy-world-asset-catalog.tsv'), 'id\tfamily\tgroup\tpriority\tkind\nprops/torch\tprops\tlight\tP1\tmodel\n');
  writeFileSync(join(root, 'docs/fantasy-world-scene-blueprints.tsv'), 'scene_id\tgroup\tpriority\tstatus\nlocations/camp\toutside\tP1\tplanned\n');
  for (const name of ['index.md', 'product.md', 'product-guidelines.md', 'tech-stack.md', 'workflow.md', 'status.md']) {
    writeFileSync(join(root, 'measure', name), '# Measure\n');
  }
  writeFileSync(join(root, 'measure/config.json'), '{}\n');
  writeFileSync(join(root, 'measure/lessons-learned.md'), 'One lesson.\n');
  writeFileSync(join(root, 'measure/tech-debt.md'), 'No debt.\n');
  writeFileSync(
    join(root, 'measure/tracks/asset_quality_20260928/metadata.json'),
    `${JSON.stringify({
      track_id: 'asset_quality_20260928',
      type: 'chore',
      status: 'in_progress',
      created_at: '2026-09-28',
      updated_at: '2026-09-28',
      description: 'Check asset source coverage.',
      estimated_tasks: null,
      actual_tasks: null,
      deviation_notes: 'None.',
      workstream: 'assets',
      retrospective: false,
      evidence: [],
      dependencies: [],
    }, null, 2)}\n`,
  );
  writeFileSync(join(root, 'measure/tracks/asset_quality_20260928/spec.md'), '# Spec\n');
  writeFileSync(join(root, 'measure/tracks/asset_quality_20260928/plan.md'), '- [~] Check coverage.\n');
  writeFileSync(join(root, 'measure/tracks/asset_quality_20260928/index.md'), '# Track\n');
  writeFileSync(
    join(root, 'measure/tracks.md'),
    '- [~] **Track: Asset quality**\n  *Link: [./tracks/asset_quality_20260928/](./tracks/asset_quality_20260928/)*\n',
  );
  writeFacts(root);
  return root;
}

function run(root, arguments_) {
  return spawnSync(process.execPath, [join(repository, 'measure/tools/doctor.mjs'), '--root', root, ...arguments_], {
    encoding: 'utf8',
  });
}

test('doctor rejects missing registry links', () => {
  const root = fixture();
  try {
    writeFileSync(join(root, 'measure/tracks.md'), '');
    const result = run(root, ['--structural-only']);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /missing registry link/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('metadata rejects an unfinished dependency for a completed track', () => {
  const root = fixture();
  try {
    const metadata = JSON.parse(readFileSync(join(root, 'measure/tracks/asset_quality_20260928/metadata.json'), 'utf8'));
    metadata.status = 'completed';
    metadata.dependencies = ['foundation_20260928'];
    assert.equal(validateMetadata({ base: 'track', metadata }).length, 0);
    writeFileSync(join(root, 'measure/tracks/asset_quality_20260928/metadata.json'), `${JSON.stringify(metadata)}\n`);
    writeFileSync(join(root, 'measure/tracks/asset_quality_20260928/plan.md'), '- [x] Check coverage.\n');
    mkdirSync(join(root, 'measure/tracks/foundation_20260928'));
    writeFileSync(
      join(root, 'measure/tracks/foundation_20260928/metadata.json'),
      `${JSON.stringify({ ...metadata, track_id: 'foundation_20260928', status: 'in_progress', dependencies: [], workstream: 'foundation' })}\n`,
    );
    writeFileSync(join(root, 'measure/tracks/foundation_20260928/spec.md'), '# Spec\n');
    writeFileSync(join(root, 'measure/tracks/foundation_20260928/plan.md'), '- [~] Keep working.\n');
    writeFileSync(join(root, 'measure/tracks/foundation_20260928/index.md'), '# Track\n');
    writeFileSync(
      join(root, 'measure/tracks.md'),
      '- [x] **Track: Asset quality**\n  *Link: [./tracks/asset_quality_20260928/](./tracks/asset_quality_20260928/)*\n\n---\n\n- [~] **Track: Foundation**\n  *Link: [./tracks/foundation_20260928/](./tracks/foundation_20260928/)*\n',
    );
    const result = run(root, ['--structural-only']);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /depends on unfinished/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('freshness comparison reports a stale generated fact', () => {
  const root = fixture();
  try {
    writeFileSync(join(root, 'measure/generated/status.md'), 'stale\n');
    assert.deepEqual(freshnessErrors(root), ['measure/generated/status.md: stale generated fact']);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('context budget uses the final line without a newline', () => {
  const root = fixture();
  try {
    writeFileSync(join(root, 'measure/lessons-learned.md'), Array.from({ length: 51 }, (_, i) => `Line ${i + 1}.`).join('\n'));
    const result = spawnSync(join(repository, 'scripts/measure/check_context_budget.sh'), [], {
      encoding: 'utf8',
      env: { ...process.env, MEASURE_ROOT: root },
    });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /51 lines/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('local links reject a missing target', () => {
  const root = fixture();
  try {
    writeFileSync(join(root, 'measure/lessons-learned.md'), '[Missing](./no-file.md)\n');
    assert.deepEqual(localMarkdownLinkErrors(root), ['measure/lessons-learned.md: broken local link ./no-file.md']);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('scope coverage accepts a planned catalog item without a source file', () => {
  const root = fixture();
  try {
    writeFileSync(
      join(root, 'measure/scope-map.tsv'),
      'kind\tsource_id\tsource_path\ttrack_id\nasset\tprops/torch\tdocs/fantasy-world-asset-catalog.tsv\tasset_quality_20260928\nscene\tlocations/camp\tdocs/fantasy-world-scene-blueprints.tsv\tasset_quality_20260928\n',
    );
    unlinkSync(join(root, 'assets/torch.ts'));
    writeFacts(root);
    const result = run(root, ['--structural-only']);
    assert.equal(result.status, 0, result.stderr);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('metadata accepts a future track date and rejects an impossible date', () => {
  const metadata = {
    track_id: 'future_work_20270228',
    type: 'chore',
    status: 'new',
    created_at: '2026-09-28',
    updated_at: '2026-09-28',
    description: 'Prepare future work.',
    estimated_tasks: null,
    actual_tasks: null,
    deviation_notes: 'None.',
    workstream: 'foundation',
    retrospective: false,
    evidence: [],
    dependencies: [],
  };
  assert.deepEqual(validateMetadata({ base: 'track', metadata }), []);
  metadata.track_id = 'future_work_20270230';
  assert.match(validateMetadata({ base: 'track', metadata }).join('\n'), /real date/);
});

test('shell wrappers pass their repository root outside the repository', () => {
  const root = mkdtempSync(join(tmpdir(), 'measure-wrapper-'));
  try {
    const bin = join(root, 'bin');
    const captured = join(root, 'arguments.txt');
    mkdirSync(bin);
    writeFileSync(join(bin, 'node'), '#!/usr/bin/env bash\nprintf "%s\\n" "$@" > "$MEASURE_CAPTURE"\n');
    chmodSync(join(bin, 'node'), 0o755);
    const result = spawnSync(join(repository, 'measure/generate.sh'), [], {
      cwd: root,
      encoding: 'utf8',
      env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, MEASURE_CAPTURE: captured },
    });
    assert.equal(result.status, 0, result.stderr);
    assert.match(readFileSync(captured, 'utf8'), new RegExp(`--root\\n${repository.replaceAll('/', '\\/')}`));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
