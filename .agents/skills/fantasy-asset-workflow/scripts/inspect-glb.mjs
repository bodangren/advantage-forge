#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readFile, realpath, stat } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import process from 'node:process';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function parseArguments(values) {
  const known = new Set([
    '--glb-manifest',
    '--expected-asset',
    '--expected-revision',
  ]);
  const parsed = {};
  for (let index = 0; index < values.length; index += 2) {
    const flag = values[index];
    const value = values[index + 1];
    assert(
      known.has(flag),
      `Unknown or misplaced argument: ${flag ?? '<none>'}`,
    );
    assert(
      value !== undefined && !value.startsWith('--'),
      `Missing value for ${flag}`,
    );
    assert(parsed[flag] === undefined, `Duplicate argument: ${flag}`);
    parsed[flag] = value;
  }
  for (const flag of known)
    assert(parsed[flag] !== undefined, `Missing ${flag}`);
  return {
    manifestPath: parsed['--glb-manifest'],
    expectedAssetId: parsed['--expected-asset'],
    expectedRevisionId: parsed['--expected-revision'],
  };
}

function containedPath(directory, manifestPath) {
  assert(
    typeof manifestPath === 'string' && manifestPath.length > 0,
    'GLB manifest path is missing',
  );
  const candidate = isAbsolute(manifestPath)
    ? manifestPath
    : resolve(directory, manifestPath);
  const path = relative(directory, candidate);
  assert(
    path !== '..' && !path.startsWith('../') && !isAbsolute(path),
    'GLB path escapes its revision artifact directory',
  );
  return candidate;
}

function vector(value) {
  return [value.x, value.y, value.z];
}

function materialList(material) {
  return Array.isArray(material) ? material : [material];
}

function maximumDelta(left, right) {
  return Math.max(
    ...left.map((value, index) => Math.abs(value - right[index])),
  );
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  assert(
    /^revision\.[a-f0-9]{64}$/.test(options.expectedRevisionId),
    'Expected revision must be a content-addressed revision ID',
  );
  const manifestPath = await realpath(options.manifestPath);
  const directory = await realpath(dirname(manifestPath));
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  assert(
    manifest.assetId === options.expectedAssetId,
    'Asset identity mismatch',
  );
  assert(
    manifest.revisionId === options.expectedRevisionId,
    'Revision identity mismatch',
  );
  const glbPath = await realpath(containedPath(directory, manifest.glbPath));
  assert((await stat(glbPath)).isFile(), 'GLB path is not a file');
  const bytes = await readFile(glbPath);
  const arrayBuffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  );
  const loaded = await new GLTFLoader().parseAsync(arrayBuffer, '');
  const bounds = new THREE.Box3().setFromObject(loaded.scene);
  assert(!bounds.isEmpty(), 'Imported GLB has empty bounds');

  const nodeNames = [];
  const materialNames = new Set();
  const textures = new Set();
  let cameraCount = 0;
  let lightCount = 0;
  let skinCount = 0;
  loaded.scene.traverse((object) => {
    if (object.name !== '') nodeNames.push(object.name);
    if (object instanceof THREE.Camera) cameraCount += 1;
    if (object instanceof THREE.Light) lightCount += 1;
    if (object instanceof THREE.SkinnedMesh) skinCount += 1;
    if (!(object instanceof THREE.Mesh)) return;
    for (const material of materialList(object.material)) {
      if (material.name !== '') materialNames.add(material.name);
      for (const value of Object.values(material))
        if (value instanceof THREE.Texture) textures.add(value.uuid);
    }
  });
  const counts = new Map();
  for (const name of nodeNames) counts.set(name, (counts.get(name) ?? 0) + 1);
  const duplicateNodeNames = [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([name]) => name)
    .sort();
  const expectedNodeNames = (manifest.reloadNodeNames ?? [])
    .map((name) => THREE.PropertyBinding.sanitizeNodeName(name))
    .sort();
  const expectedSemanticNodeNames = (manifest.nodeNames ?? [])
    .map((name) => THREE.PropertyBinding.sanitizeNodeName(name))
    .sort();
  const expectedCounts = new Map();
  for (const name of expectedNodeNames)
    expectedCounts.set(name, (expectedCounts.get(name) ?? 0) + 1);
  const missingNodeNames = expectedNodeNames.filter((name, index, names) => {
    const occurrence = names
      .slice(0, index + 1)
      .filter((item) => item === name).length;
    return occurrence > (counts.get(name) ?? 0);
  });
  const unexpectedNodeNames = nodeNames
    .filter((name, index, names) => {
      const occurrence = names
        .slice(0, index + 1)
        .filter((item) => item === name).length;
      return occurrence > (expectedCounts.get(name) ?? 0);
    })
    .sort();
  const semanticNodeCount = expectedSemanticNodeNames.filter(
    (name) => (counts.get(name) ?? 0) > 0,
  ).length;
  const importedMin = vector(bounds.min);
  const importedMax = vector(bounds.max);
  const boundsTolerance = manifest.bounds?.tolerance ?? 0.00001;
  const manifestBoundsDeviation = Math.max(
    maximumDelta(importedMin, manifest.bounds?.reloadMin ?? importedMin),
    maximumDelta(importedMax, manifest.bounds?.reloadMax ?? importedMax),
  );

  const report = {
    ok: true,
    importer: 'Three.js GLTFLoader',
    importerVersion: '0.185.1',
    assetId: manifest.assetId,
    revisionId: manifest.revisionId,
    manifestPath,
    glbPath,
    byteLength: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    up: vector(loaded.scene.up),
    orientation: 'Y-up',
    bounds: {
      min: importedMin,
      max: importedMax,
      size: vector(bounds.getSize(new THREE.Vector3())),
      groundY: bounds.min.y,
      unit: manifest.unit,
      manifestDeviation: manifestBoundsDeviation,
      manifestTolerance: boundsTolerance,
      matchesManifest: manifestBoundsDeviation <= boundsTolerance,
    },
    nodeNames: [...nodeNames].sort(),
    expectedNodeNames,
    semanticNodeCount,
    missingNodeNames,
    unexpectedNodeNames,
    duplicateNodeNames,
    materialNames: [...materialNames].sort(),
    cameraCount,
    lightCount,
    skinCount,
    textureCount: textures.size,
    animationCount: loaded.animations.length,
    errors: [],
    limitations: [
      'Representative Three.js importer only; Godot, Unity, and gameplay runtime import remain Not Assessed.',
    ],
  };
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
});
