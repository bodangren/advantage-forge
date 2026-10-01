import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';

export const GENERATED_FILES = [
  'architecture.json',
  'routes.md',
  'status.md',
  'asset-inventory.json',
];

const REQUIRED_METADATA = [
  'track_id',
  'type',
  'status',
  'created_at',
  'updated_at',
  'description',
  'estimated_tasks',
  'actual_tasks',
  'deviation_notes',
  'workstream',
  'retrospective',
  'evidence',
  'dependencies',
];

const TRACK_ID = /^[a-z0-9][a-z0-9_-]*_(\d{8})$/;
const TYPES = new Set(['feature', 'bug', 'chore']);
const STATUSES = new Set(['new', 'in_progress', 'completed']);
const WORKSTREAMS = new Set(['assets', 'games', 'foundation']);
const MARKERS = { ' ': 'new', '~': 'in_progress', x: 'completed' };

export function projectRoot(value) {
  return resolve(value ?? process.env.MEASURE_ROOT ?? process.cwd());
}

export function toPosix(path) {
  return path.split(sep).join('/');
}

export function rootPath(root, path) {
  return toPosix(relative(root, path));
}

export function exists(root, path) {
  return existsSync(join(root, path));
}

export function text(path) {
  return readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
}

export function filesUnder(root, path, predicate = () => true) {
  const start = join(root, path);
  if (!existsSync(start)) return [];
  const found = [];
  const visit = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const current = join(directory, entry.name);
      if (entry.isDirectory()) visit(current);
      else if (entry.isFile() && predicate(current)) found.push(rootPath(root, current));
    }
  };
  visit(start);
  return found.sort();
}

export function directoriesUnder(root, path) {
  const start = join(root, path);
  if (!existsSync(start)) return [];
  return readdirSync(start, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => entry.name)
    .sort();
}

export function readJson(path) {
  return JSON.parse(text(path));
}

export function tableRows(root, path, idColumn) {
  const fullPath = join(root, path);
  if (!existsSync(fullPath)) throw new Error(`${path}: missing table`);
  const lines = text(fullPath).split('\n').filter((line) => line !== '');
  const header = lines.shift()?.split('\t') ?? [];
  const idIndex = header.indexOf(idColumn);
  if (idIndex < 0) throw new Error(`${path}: missing ${idColumn} column`);
  const rows = [];
  for (const [index, line] of lines.entries()) {
    const values = line.split('\t');
    if (values.length !== header.length) throw new Error(`${path}:${index + 2}: invalid table row`);
    rows.push(Object.fromEntries(header.map((key, column) => [key, values[column]])));
  }
  return rows.sort((a, b) => a[idColumn].localeCompare(b[idColumn]));
}

export function catalogEntries(root) {
  return tableRows(root, 'docs/fantasy-world-asset-catalog.tsv', 'id');
}

export function blueprintEntries(root) {
  return tableRows(root, 'docs/fantasy-world-scene-blueprints.tsv', 'scene_id');
}

export function countPlanTasks(plan) {
  const counts = { total: 0, new: 0, in_progress: 0, completed: 0 };
  for (const line of plan.split('\n')) {
    const match = /^\s*(?:[-*]|\d+[.)])\s+\[([ ~x])\]\s+\S/.exec(line);
    if (!match) continue;
    const status = MARKERS[match[1]];
    counts.total += 1;
    counts[status] += 1;
  }
  return counts;
}

export function collectTracks(root) {
  const tracks = [];
  for (const directory of directoriesUnder(root, 'measure/tracks')) {
    const base = join(root, 'measure', 'tracks', directory);
    const metadataPath = join(base, 'metadata.json');
    const planPath = join(base, 'plan.md');
    let metadata;
    let metadataError;
    try {
      metadata = existsSync(metadataPath) ? readJson(metadataPath) : undefined;
    } catch (error) {
      metadataError = error instanceof Error ? error.message : String(error);
    }
    let plan = '';
    if (existsSync(planPath)) plan = text(planPath);
    tracks.push({
      directory,
      base: rootPath(root, base),
      metadata,
      metadataError,
      plan,
      tasks: countPlanTasks(plan),
    });
  }
  return tracks;
}

export function validateMetadata(track) {
  const errors = [];
  const prefix = `${track.base}/metadata.json`;
  if (track.metadataError) return [`${prefix}: invalid JSON (${track.metadataError})`];
  if (!track.metadata || typeof track.metadata !== 'object' || Array.isArray(track.metadata)) {
    return [`${prefix}: metadata must be an object`];
  }
  const metadata = track.metadata;
  for (const key of REQUIRED_METADATA) {
    if (!(key in metadata)) errors.push(`${prefix}: missing ${key}`);
  }
  const trackId = typeof metadata.track_id === 'string' ? TRACK_ID.exec(metadata.track_id) : null;
  const trackDate = trackId?.[1];
  const parsedTrackDate = trackDate ? new Date(`${trackDate.slice(0, 4)}-${trackDate.slice(4, 6)}-${trackDate.slice(6, 8)}T00:00:00Z`) : null;
  const realTrackDate =
    parsedTrackDate &&
    Number.isFinite(parsedTrackDate.valueOf()) &&
    parsedTrackDate.toISOString().slice(0, 10).replaceAll('-', '') === trackDate;
  if (!realTrackDate) {
    errors.push(`${prefix}: track_id must use name_YYYYMMDD with a real date`);
  }
  if (typeof metadata.type !== 'string' || !TYPES.has(metadata.type)) {
    errors.push(`${prefix}: type must be feature, bug, or chore`);
  }
  if (typeof metadata.status !== 'string' || !STATUSES.has(metadata.status)) {
    errors.push(`${prefix}: status must be new, in_progress, or completed`);
  }
  for (const key of ['created_at', 'updated_at', 'description', 'deviation_notes']) {
    if (typeof metadata[key] !== 'string' || metadata[key].trim() === '') {
      errors.push(`${prefix}: ${key} must be a non-empty string`);
    }
  }
  for (const key of ['estimated_tasks', 'actual_tasks']) {
    const value = metadata[key];
    if (value !== null && (!Number.isInteger(value) || value < 0)) {
      errors.push(`${prefix}: ${key} must be a non-negative integer or null`);
    }
  }
  if (typeof metadata.workstream !== 'string' || !WORKSTREAMS.has(metadata.workstream)) {
    errors.push(`${prefix}: workstream must be assets, games, or foundation`);
  }
  if (typeof metadata.retrospective !== 'boolean') errors.push(`${prefix}: retrospective must be a boolean`);
  for (const key of ['evidence', 'dependencies']) {
    if (!Array.isArray(metadata[key]) || metadata[key].some((value) => typeof value !== 'string')) {
      errors.push(`${prefix}: ${key} must be a string array`);
    }
  }
  return errors;
}

export function parseRegistry(root) {
  const path = join(root, 'measure', 'tracks.md');
  if (!existsSync(path)) return { entries: [], errors: ['measure/tracks.md: missing registry'] };
  const source = text(path);
  const entries = [];
  const errors = [];
  const pattern = /^- \[([ ~x])\] \*\*Track: ([^\n*]+)\*\*\n  \*Link: \[\.\/tracks\/([a-z0-9_-]+)\/]\(\.\/tracks\/([a-z0-9_-]+)\/\)\*$/gm;
  for (const match of source.matchAll(pattern)) {
    if (match[3] !== match[4]) {
      errors.push(`measure/tracks.md: registry link target differs for ${match[3]}`);
      continue;
    }
    entries.push({ id: match[3], title: match[2].trim(), status: MARKERS[match[1]] });
  }
  const linesWithTrack = source.split('\n').filter((line) => line.includes('**Track:'));
  if (entries.length !== linesWithTrack.length) {
    errors.push('measure/tracks.md: registry entries must use the standard Track and Link format');
  }
  return { entries, errors };
}

export function readScopeMap(root) {
  const path = join(root, 'measure', 'scope-map.tsv');
  if (!existsSync(path)) return { present: false, rows: [], errors: [] };
  const lines = text(path).split('\n').filter((line) => line.trim() !== '' && !line.startsWith('#'));
  const header = lines.shift();
  const expected = ['kind', 'source_id', 'source_path', 'track_id'];
  if (header !== expected.join('\t')) {
    return { present: true, rows: [], errors: ['measure/scope-map.tsv: header must be kind, source_id, source_path, track_id'] };
  }
  const rows = [];
  const errors = [];
  for (const [index, line] of lines.entries()) {
    const values = line.split('\t');
    if (values.length !== expected.length || values.some((value) => value === '')) {
      errors.push(`measure/scope-map.tsv:${index + 2}: each row needs four tab-separated values`);
      continue;
    }
    const [kind, source_id, source_path, track_id] = values;
    rows.push({ kind, source_id, source_path: toPosix(source_path), track_id });
  }
  return { present: true, rows, errors };
}

function sourceId(path) {
  const name = path.split('/').at(-1) ?? path;
  return name.replace(/\.[^.]+$/, '');
}

function registeredGames(root) {
  const registry = join(root, 'src', 'host', 'registry.ts');
  if (!existsSync(registry)) return new Set();
  return new Set([...text(registry).matchAll(/\.\.\/games\/([^/]+)\/manifest\.js/g)].map((match) => match[1]));
}

function gameEntrypoints(root) {
  const registered = registeredGames(root);
  const gamesRoot = join(root, 'src', 'games');
  if (!existsSync(gamesRoot)) return [];
  return readdirSync(gamesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== 'shared')
    .map((entry) => {
      const name = entry.name;
      const index = `src/games/${name}/index.ts`;
      const manifest = `src/games/${name}/manifest.ts`;
      return {
        id: name,
        index: exists(root, index) ? index : null,
        manifest: exists(root, manifest) ? manifest : null,
        registered: registered.has(name),
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}

function sourceRoots(root) {
  const source = join(root, 'src');
  if (!existsSync(source)) return [];
  return readdirSync(source, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const path = `src/${entry.name}`;
      return { path, typescript_files: filesUnder(root, path, (file) => file.endsWith('.ts')).length };
    })
    .sort((a, b) => a.path.localeCompare(b.path));
}

function mapForId(rows, kind, id) {
  const matches = rows.filter((row) => row.kind === kind && row.source_id === id);
  return matches.length === 1 ? matches[0].track_id : null;
}

export function facts(root) {
  const tracks = collectTracks(root).filter((track) => track.metadata);
  const scope = readScopeMap(root);
  const assets = filesUnder(root, 'assets', (file) => file.endsWith('.ts'));
  const scenes = filesUnder(root, 'scenes', (file) => file.endsWith('.ts'));
  const source = filesUnder(root, 'src', (file) => file.endsWith('.ts'));
  const packs = filesUnder(root, 'demo/public', (file) => file.endsWith('/pack.json'));
  const catalog = catalogEntries(root);
  const blueprints = blueprintEntries(root);
  const hostEntrypoints = [
    ['APK host', 'src/host/main.ts'],
    ['Asset viewer', 'src/viewer/main.ts'],
    ['Scene viewer', 'src/scene/main.ts'],
    ['Showcase', 'src/showcase/main.ts'],
  ]
    .filter(([, path]) => exists(root, path))
    .map(([name, path]) => ({ name, path }));
  const games = gameEntrypoints(root);
  const architecture = {
    schema_version: 1,
    host_registry: exists(root, 'src/host/registry.ts') ? 'src/host/registry.ts' : null,
    entrypoints: hostEntrypoints,
    games,
    source_roots: sourceRoots(root),
  };
  const routes = [
    '# Runtime entrypoints',
    '',
    'This report lists source entrypoints. It does not define URL routes.',
    '',
    '## Host applications',
    '',
    ...(hostEntrypoints.length
      ? hostEntrypoints.map(({ name, path }) => `- ${name}: [\`${path}\`](../../${path})`)
      : ['- No host application entrypoint exists.']),
    '',
    '## Game cartridges',
    '',
    ...(games.length
      ? games.map((game) => {
          const paths = [game.index, game.manifest]
            .filter(Boolean)
            .map((path) => `[\`${path}\`](../../${path})`)
            .join(', ');
          const state = game.registered ? 'registered by the host' : 'not registered by the host';
          return `- ${game.id}: ${paths || 'no cartridge entrypoint'}; ${state}.`;
        })
      : ['- No game cartridge source exists.']),
    '',
  ].join('\n');
  const trackRows = tracks
    .sort((a, b) => a.metadata.track_id.localeCompare(b.metadata.track_id))
    .map((track) => {
      const { metadata, tasks } = track;
      return `| [${metadata.track_id}](../tracks/${metadata.track_id}/) | ${metadata.status} | ${metadata.workstream} | ${tasks.completed}/${tasks.total} | ${metadata.estimated_tasks ?? '—'} | ${metadata.actual_tasks ?? '—'} |`;
    });
  const measuredFeatures = tracks
    .filter((track) => track.metadata.type === 'feature' && track.metadata.status === 'completed')
    .filter((track) => track.metadata.retrospective === false)
    .filter((track) => Number.isInteger(track.metadata.actual_tasks) && Number.isInteger(track.metadata.estimated_tasks))
    .sort((a, b) => b.metadata.updated_at.localeCompare(a.metadata.updated_at))
    .slice(0, 3);
  const actualTotal = measuredFeatures.reduce((total, track) => total + track.metadata.actual_tasks, 0);
  const ratioFeatures = measuredFeatures.filter((track) => track.metadata.estimated_tasks > 0);
  const averageRatio = ratioFeatures.length
    ? ratioFeatures.reduce((total, track) => total + track.metadata.actual_tasks / track.metadata.estimated_tasks, 0) / ratioFeatures.length
    : null;
  const statusCounts = Object.fromEntries(
    [...STATUSES].map((status) => [status, tracks.filter((track) => track.metadata.status === status).length]),
  );
  const workstreamCounts = Object.fromEntries(
    [...WORKSTREAMS].map((workstream) => [workstream, tracks.filter((track) => track.metadata.workstream === workstream).length]),
  );
  const summary = (counts) => Object.entries(counts).map(([name, count]) => `${name}: ${count}`).join('; ');
  const status = [
    '# Measure status',
    '',
    `Tracks: ${tracks.length}.`,
    `Tracks by status: ${summary(statusCounts)}.`,
    `Tracks by workstream: ${summary(workstreamCounts)}.`,
    '',
    '| Track | Status | Workstream | Plan tasks | Estimate | Actual |',
    '| --- | --- | --- | ---: | ---: | ---: |',
    ...(trackRows.length ? trackRows : ['| — | — | — | 0/0 | — | — |']),
    '',
    '## Project health',
    '',
    `Completed feature tracks with comparable estimates and actuals: ${measuredFeatures.length}.`,
    measuredFeatures.length
      ? `Recent feature velocity: ${(actualTotal / measuredFeatures.length).toFixed(2)} tasks per track.`
      : 'Recent feature velocity: unavailable.',
    averageRatio !== null
      ? `Estimate accuracy ratio: ${averageRatio.toFixed(2)}.`
      : 'Estimate accuracy ratio: unavailable.',
    '',
  ].join('\n');
  const catalogInventory = catalog.map((entry) => {
    const sourcePath = `assets/${sourceId(entry.id)}.ts`;
    return {
      source_id: entry.id,
      family: entry.family,
      group: entry.group,
      priority: entry.priority,
      kind: entry.kind,
      source_path: sourcePath,
      source_present: exists(root, sourcePath),
      track_id: mapForId(scope.rows, 'asset', entry.id),
    };
  });
  const blueprintInventory = blueprints.map((entry) => {
    const sourcePath = `scenes/${sourceId(entry.scene_id)}.ts`;
    return {
      source_id: entry.scene_id,
      group: entry.group,
      priority: entry.priority,
      status: entry.status,
      candidate_source_path: sourcePath,
      filename_match: exists(root, sourcePath),
      track_id: mapForId(scope.rows, 'scene', entry.scene_id),
    };
  });
  const countBy = (entries, key) =>
    Object.fromEntries(
      [...new Set(entries.map((entry) => entry[key]))]
        .sort()
        .map((value) => [value, entries.filter((entry) => entry[key] === value).length]),
    );
  const coverage = (entries, field = 'source_present') => ({
    listed: entries.length,
    source_present: entries.filter((entry) => entry[field]).length,
    source_missing: entries.filter((entry) => !entry[field]).length,
  });
  const coverageByPriority = (entries, field = 'source_present') =>
    Object.fromEntries(
      [...new Set(entries.map((entry) => entry.priority))]
        .sort()
        .map((priority) => [priority, coverage(entries.filter((entry) => entry.priority === priority), field)]),
    );
  const sourceFilenameCollisions = (entries) =>
    Object.entries(
      Object.groupBy(entries, (entry) => entry.source_path),
    )
      .filter(([, entriesForPath]) => entriesForPath.length > 1)
      .map(([source_path, entriesForPath]) => ({ source_path, source_ids: entriesForPath.map((entry) => entry.source_id) }));
  const assetInventory = {
    schema_version: 1,
    catalog_note: 'Catalog source presence does not show render, review, or acceptance status.',
    catalog_coverage: {
      ...coverage(catalogInventory),
      by_priority: coverageByPriority(catalogInventory),
      source_filename_collisions: sourceFilenameCollisions(catalogInventory),
    },
    catalog: catalogInventory,
    blueprint_note: 'Blueprint filename matches are hints. They do not prove a scene source is absent.',
    blueprint_coverage: { ...coverage(blueprintInventory, 'filename_match'), by_priority: coverageByPriority(blueprintInventory, 'filename_match') },
    blueprints: blueprintInventory,
    asset_source_coverage: {
      listed: assets.length,
      catalog_matched: assets.filter((path) => catalogInventory.some((entry) => entry.source_path === path)).length,
      off_catalog: assets.filter((path) => !catalogInventory.some((entry) => entry.source_path === path)).length,
    },
    asset_sources: assets.map((path) => ({
      id: sourceId(path),
      source_path: path,
      catalog_source_ids: catalogInventory.filter((entry) => entry.source_path === path).map((entry) => entry.source_id),
    })),
    scene_sources: scenes.map((path) => ({
      id: sourceId(path),
      source_path: path,
      source_present: true,
    })),
    source_files: source.map((path) => ({
      source_path: path,
      source_present: true,
    })),
    pack_files: packs.map((path) => ({
      id: sourceId(dirname(path)),
      source_path: path,
      source_present: true,
    })),
    scope_map: scope.present ? 'measure/scope-map.tsv' : null,
  };
  return new Map([
    ['architecture.json', `${JSON.stringify(architecture, null, 2)}\n`],
    ['routes.md', routes],
    ['status.md', status],
    ['asset-inventory.json', `${JSON.stringify(assetInventory, null, 2)}\n`],
  ]);
}

export function writeFacts(root) {
  const output = join(root, 'measure', 'generated');
  for (const [name, value] of facts(root)) writeFileSync(join(output, name), value);
}

export function freshnessErrors(root) {
  const errors = [];
  const output = join(root, 'measure', 'generated');
  for (const [name, expected] of facts(root)) {
    const path = join(output, name);
    if (!existsSync(path)) {
      errors.push(`measure/generated/${name}: missing generated fact`);
      continue;
    }
    if (text(path) !== expected) errors.push(`measure/generated/${name}: stale generated fact`);
  }
  return errors;
}

export function insideRoot(root, path) {
  const candidate = resolve(path);
  return candidate === root || candidate.startsWith(`${root}${sep}`);
}

export function localMarkdownLinkErrors(root) {
  const errors = [];
  for (const markdown of filesUnder(root, 'measure', (file) => file.endsWith('.md'))) {
    const source = text(join(root, markdown));
    for (const match of source.matchAll(/!?\[[^\]]*\]\(([^)\s]+)(?:\s+[^)]*)?\)/g)) {
      let href = match[1].trim();
      if (href.startsWith('<') && href.endsWith('>')) href = href.slice(1, -1);
      if (!href || href.startsWith('#') || /^(?:https?:|mailto:|tel:)/.test(href)) continue;
      const target = href.split('#')[0];
      if (!target) continue;
      const destination = resolve(dirname(join(root, markdown)), decodeURIComponent(target));
      if (!insideRoot(root, destination) || !existsSync(destination)) {
        errors.push(`${markdown}: broken local link ${href}`);
      }
    }
  }
  return errors;
}

export function fileLineCount(path) {
  if (!existsSync(path)) return null;
  const value = text(path);
  if (value === '') return 0;
  return value.endsWith('\n') ? value.slice(0, -1).split('\n').length : value.split('\n').length;
}

export function registryStatus(marker) {
  return MARKERS[marker];
}

export const measureSchema = { REQUIRED_METADATA, TRACK_ID, TYPES, STATUSES, WORKSTREAMS };
