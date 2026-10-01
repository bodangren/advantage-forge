#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  collectTracks,
  catalogEntries,
  blueprintEntries,
  exists,
  fileLineCount,
  freshnessErrors,
  localMarkdownLinkErrors,
  parseRegistry,
  projectRoot,
  readScopeMap,
  validateMetadata,
} from './common.mjs';

function usage() {
  console.error('Usage: node measure/tools/doctor.mjs [--bootstrap] [--structural-only] [--root PATH]');
}

function optionsFor(argv) {
  const options = { bootstrap: false, structuralOnly: false, root: undefined };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--bootstrap') options.bootstrap = true;
    else if (argument === '--structural-only') options.structuralOnly = true;
    else if (argument === '--root') options.root = argv[++index];
    else {
      usage();
      return null;
    }
  }
  options.root = projectRoot(options.root);
  return options;
}

function requiredTrackFileErrors(root, track) {
  const errors = [];
  for (const file of ['index.md', 'metadata.json', 'spec.md', 'plan.md']) {
    if (!exists(root, `${track.base}/${file}`)) errors.push(`${track.base}/${file}: missing required track file`);
  }
  return errors;
}

function coreContextErrors(root) {
  const errors = [];
  for (const path of [
    'measure/index.md',
    'measure/product.md',
    'measure/product-guidelines.md',
    'measure/tech-stack.md',
    'measure/workflow.md',
    'measure/tracks.md',
    'measure/config.json',
    'measure/status.md',
    'measure/lessons-learned.md',
    'measure/tech-debt.md',
  ]) {
    if (!exists(root, path)) errors.push(`${path}: missing core Measure file`);
  }
  return errors;
}

function trackErrors(root) {
  const errors = [];
  if (!exists(root, 'measure/tracks')) {
    errors.push('measure/tracks: missing tracks directory');
    return errors;
  }
  const tracks = collectTracks(root);
  const ids = new Map();
  for (const track of tracks) {
    errors.push(...requiredTrackFileErrors(root, track), ...validateMetadata(track));
    const id = track.metadata?.track_id;
    if (typeof id === 'string') {
      if (ids.has(id)) errors.push(`${track.base}: duplicate track_id ${id}`);
      else ids.set(id, track);
      if (track.directory !== id) errors.push(`${track.base}: directory must match track_id ${id}`);
    }
    if (!exists(root, `${track.base}/plan.md`)) continue;
    if (track.tasks.total === 0) errors.push(`${track.base}/plan.md: plan needs a task marker`);
    if (track.metadata?.status === 'completed' && track.tasks.completed !== track.tasks.total) {
      errors.push(`${track.base}/plan.md: completed track has an unchecked task`);
    }
    if (track.metadata?.status === 'new' && (track.tasks.completed > 0 || track.tasks.in_progress > 0)) {
      errors.push(`${track.base}/plan.md: new track has started tasks`);
    }
    if (track.metadata?.status === 'in_progress' && track.tasks.total > 0 && track.tasks.completed === track.tasks.total) {
      errors.push(`${track.base}/plan.md: in_progress track has no unchecked task`);
    }
  }
  const registry = parseRegistry(root);
  errors.push(...registry.errors);
  const registryEntries = new Map();
  for (const entry of registry.entries) {
    if (registryEntries.has(entry.id)) errors.push(`measure/tracks.md: duplicate registry track ${entry.id}`);
    else registryEntries.set(entry.id, entry);
    const track = ids.get(entry.id);
    if (!track) {
      errors.push(`measure/tracks.md: registry track ${entry.id} has no metadata`);
      continue;
    }
    if (track.metadata.status !== entry.status) {
      errors.push(`measure/tracks.md: ${entry.id} registry status differs from metadata`);
    }
  }
  for (const id of ids.keys()) {
    if (!registryEntries.has(id)) errors.push(`measure/tracks.md: missing registry link for ${id}`);
  }
  for (const [id, track] of ids) {
    const dependencies = track.metadata.dependencies;
    if (!Array.isArray(dependencies)) continue;
    const seen = new Set();
    for (const dependency of dependencies) {
      if (seen.has(dependency)) errors.push(`${track.base}/metadata.json: duplicate dependency ${dependency}`);
      seen.add(dependency);
      if (dependency === id) errors.push(`${track.base}/metadata.json: track cannot depend on itself`);
      const dependencyTrack = ids.get(dependency);
      if (!dependencyTrack) errors.push(`${track.base}/metadata.json: unknown dependency ${dependency}`);
      else if (track.metadata.status === 'completed' && dependencyTrack.metadata.status !== 'completed') {
        errors.push(`${track.base}/metadata.json: completed track depends on unfinished ${dependency}`);
      }
    }
  }
  const visiting = new Set();
  const visited = new Set();
  const visit = (id, trail) => {
    if (visiting.has(id)) {
      errors.push(`measure/tracks: dependency cycle ${[...trail, id].join(' -> ')}`);
      return;
    }
    if (visited.has(id)) return;
    visiting.add(id);
    const dependencies = ids.get(id)?.metadata.dependencies ?? [];
    for (const dependency of dependencies) if (ids.has(dependency)) visit(dependency, [...trail, id]);
    visiting.delete(id);
    visited.add(id);
  };
  for (const id of ids.keys()) visit(id, []);
  return errors;
}

function scopeMapErrors(root) {
  const scope = readScopeMap(root);
  if (!scope.present) return [];
  const errors = [...scope.errors];
  let catalog = [];
  let blueprints = [];
  try {
    catalog = catalogEntries(root);
    blueprints = blueprintEntries(root);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
    return errors;
  }
  const trackIds = new Set(
    collectTracks(root)
      .map((track) => track.metadata?.track_id)
      .filter((id) => typeof id === 'string'),
  );
  const duplicateRows = new Set();
  for (const row of scope.rows) {
    const key = `${row.kind}\t${row.source_id}`;
    if (duplicateRows.has(key)) errors.push(`measure/scope-map.tsv: duplicate ${row.kind} source_id ${row.source_id}`);
    duplicateRows.add(key);
    if (!['asset', 'scene'].includes(row.kind)) errors.push(`measure/scope-map.tsv: invalid kind ${row.kind}`);
    if (!exists(root, row.source_path)) errors.push(`measure/scope-map.tsv: source path is missing: ${row.source_path}`);
    if (!trackIds.has(row.track_id)) errors.push(`measure/scope-map.tsv: unknown track_id ${row.track_id}`);
  }
  const exactCoverage = (kind, entries, idField, expectedPath) => {
    const identifiers = entries.map((entry) => entry[idField]);
    const expected = new Set(entries.map((entry) => entry[idField]));
    for (const id of expected) {
      if (identifiers.filter((candidate) => candidate === id).length > 1) {
        errors.push(`${expectedPath}: duplicate ${idField} ${id}`);
      }
    }
    const rows = scope.rows.filter((row) => row.kind === kind);
    const mapped = new Set(rows.map((row) => row.source_id));
    for (const id of expected) if (!mapped.has(id)) errors.push(`measure/scope-map.tsv: missing ${kind} row for ${id}`);
    for (const row of rows) {
      if (!expected.has(row.source_id)) errors.push(`measure/scope-map.tsv: ${kind} row has unknown source_id ${row.source_id}`);
      if (row.source_path !== expectedPath) errors.push(`measure/scope-map.tsv: ${kind} row must link ${expectedPath}`);
    }
  };
  exactCoverage('asset', catalog, 'id', 'docs/fantasy-world-asset-catalog.tsv');
  exactCoverage('scene', blueprints, 'scene_id', 'docs/fantasy-world-scene-blueprints.tsv');
  return errors;
}

function memoryErrors(root) {
  const errors = [];
  for (const name of ['lessons-learned.md', 'tech-debt.md']) {
    const path = join(root, 'measure', name);
    const lines = fileLineCount(path);
    if (lines === null) errors.push(`measure/${name}: missing bounded memory file`);
    else if (lines > 50) errors.push(`measure/${name}: ${lines} lines exceeds 50`);
  }
  return errors;
}

function run(command, args, root) {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', env: { ...process.env, MEASURE_ROOT: root } });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  return result.status === 0;
}

function gitFactsAreClean(root) {
  const result = spawnSync('git', ['diff', '--exit-code', '--', 'measure/generated/'], {
    cwd: root,
    encoding: 'utf8',
  });
  if (result.status === 0) return true;
  if (result.stdout) process.stderr.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  return false;
}

const options = optionsFor(process.argv.slice(2));
if (!options) {
  process.exitCode = 2;
} else {
  if (options.bootstrap) {
    const generator = join(options.root, 'measure', 'tools', 'generate.mjs');
    if (!existsSync(generator) || !run(process.execPath, [generator, '--root', options.root], options.root)) {
      process.exitCode = 1;
    }
  }
  if (!process.exitCode) {
    const errors = [
      ...trackErrors(options.root),
      ...coreContextErrors(options.root),
      ...scopeMapErrors(options.root),
      ...memoryErrors(options.root),
      ...localMarkdownLinkErrors(options.root),
      ...freshnessErrors(options.root),
    ];
    if (errors.length) {
      for (const error of errors) console.error(`error: ${error}`);
      process.exitCode = 1;
    }
  }
  if (!process.exitCode && !options.structuralOnly) {
    console.log('Boundary check: reusing tests/apk3d/imports.test.ts.');
    const vitest = join(options.root, 'node_modules', 'vitest', 'vitest.mjs');
    if (!existsSync(vitest) || !run(process.execPath, [vitest, 'run', 'tests/apk3d/imports.test.ts', '--maxWorkers=1'], options.root)) {
      process.exitCode = 1;
    }
    if (!process.exitCode && !gitFactsAreClean(options.root)) {
      console.error('error: committed generated facts differ from the working tree');
      process.exitCode = 1;
    }
  }
  if (!process.exitCode) console.log('Measure doctor found no structural errors.');
}
