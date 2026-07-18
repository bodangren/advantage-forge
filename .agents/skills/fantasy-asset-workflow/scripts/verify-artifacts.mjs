#!/usr/bin/env node

import { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';
import { readFile, realpath, stat } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import process from 'node:process';

const DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function parseArguments(values) {
  const known = new Set([
    '--render-manifest',
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
    renderManifestPath: parsed['--render-manifest'],
    glbManifestPath: parsed['--glb-manifest'],
    expectedAssetId: parsed['--expected-asset'],
    expectedRevisionId: parsed['--expected-revision'],
  };
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

async function readJson(path, label) {
  let parsed;
  try {
    parsed = JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    throw new Error(`${label} is not readable JSON: ${error.message}`, {
      cause: error,
    });
  }
  assert(isRecord(parsed), `${label} must contain a JSON object`);
  return parsed;
}

async function containedFile(baseDirectory, manifestValue, label) {
  assert(
    typeof manifestValue === 'string' && manifestValue.length > 0,
    `${label} path is missing`,
  );
  const candidate = isAbsolute(manifestValue)
    ? manifestValue
    : resolve(baseDirectory, manifestValue);
  const resolved = await realpath(candidate);
  const fromBase = relative(baseDirectory, resolved);
  assert(
    fromBase !== '..' &&
      !fromBase.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`) &&
      !isAbsolute(fromBase),
    `${label} escapes its revision artifact directory`,
  );
  assert((await stat(resolved)).isFile(), `${label} is not a file`);
  return resolved;
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

async function inspectPng(path, label, expectedWidth, expectedHeight) {
  const bytes = await readFile(path);
  assert(bytes.length >= 24, `${label} is too short to be a PNG`);
  assert(
    bytes.subarray(0, 8).equals(PNG_SIGNATURE),
    `${label} has an invalid PNG signature`,
  );
  assert(
    bytes.toString('ascii', 12, 16) === 'IHDR',
    `${label} has no leading IHDR chunk`,
  );
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  assert(
    width === expectedWidth && height === expectedHeight,
    `${label} is ${width}x${height}; expected ${expectedWidth}x${expectedHeight}`,
  );
  return { path, bytes: bytes.length, width, height, sha256: sha256(bytes) };
}

function assertIdentity(manifest, expectedAssetId, expectedRevisionId, label) {
  assert(
    manifest.assetId === expectedAssetId,
    `${label} assetId does not match ${expectedAssetId}`,
  );
  assert(
    manifest.revisionId === expectedRevisionId,
    `${label} revisionId does not match ${expectedRevisionId}`,
  );
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  assert(
    /^revision\.[a-f0-9]{64}$/.test(options.expectedRevisionId),
    'Expected revision must be a content-addressed revision ID',
  );

  const renderManifestPath = await realpath(options.renderManifestPath);
  const glbManifestPath = await realpath(options.glbManifestPath);
  const renderDirectory = await realpath(dirname(renderManifestPath));
  const glbDirectory = await realpath(dirname(glbManifestPath));
  assert(
    renderDirectory === glbDirectory,
    'Render and GLB manifests must describe the same revision directory',
  );

  const [renderManifest, glbManifest] = await Promise.all([
    readJson(renderManifestPath, 'Render manifest'),
    readJson(glbManifestPath, 'GLB manifest'),
  ]);
  assertIdentity(
    renderManifest,
    options.expectedAssetId,
    options.expectedRevisionId,
    'Render manifest',
  );
  assertIdentity(
    glbManifest,
    options.expectedAssetId,
    options.expectedRevisionId,
    'GLB manifest',
  );

  assert(
    renderManifest.width === 128 && renderManifest.height === 128,
    'Render manifest must declare native 128x128 frames',
  );
  assert(
    renderManifest.directions === 8,
    'Render manifest must declare eight directions',
  );
  assert(
    renderManifest.transparent === true,
    'Render manifest must declare transparency',
  );
  assert(
    Array.isArray(renderManifest.frames) && renderManifest.frames.length === 8,
    'Render manifest must list exactly eight frames',
  );

  const files = [];
  for (const [index, direction] of DIRECTIONS.entries()) {
    const frame = renderManifest.frames[index];
    assert(isRecord(frame), `Frame ${index} must be an object`);
    assert(
      frame.direction === direction,
      `Frame ${index} must be direction ${direction}`,
    );
    assert(isRecord(frame.metrics), `Frame ${direction} metrics are missing`);
    assert(
      Array.isArray(frame.metrics.clippedEdges) &&
        frame.metrics.clippedEdges.length === 0,
      `Frame ${direction} reports clipping`,
    );
    assert(
      frame.metrics.groundAnchorDeviationPixels === 0,
      `Frame ${direction} has a non-zero ground-anchor deviation`,
    );
    const path = await containedFile(
      renderDirectory,
      frame.path,
      `Frame ${direction}`,
    );
    files.push({
      kind: 'directional-frame',
      direction,
      ...(await inspectPng(path, `Frame ${direction}`, 128, 128)),
    });
  }

  const contactSheetPath = await containedFile(
    renderDirectory,
    renderManifest.contactSheetPath,
    'Contact sheet',
  );
  const contactBytes = await readFile(contactSheetPath);
  assert(
    contactBytes.length >= 24 &&
      contactBytes.subarray(0, 8).equals(PNG_SIGNATURE),
    'Contact sheet is not a PNG',
  );
  const contactWidth = contactBytes.readUInt32BE(16);
  const contactHeight = contactBytes.readUInt32BE(20);
  assert(
    contactWidth > 0 && contactHeight > 0,
    'Contact sheet has invalid dimensions',
  );
  files.push({
    kind: 'contact-sheet',
    path: contactSheetPath,
    bytes: contactBytes.length,
    width: contactWidth,
    height: contactHeight,
    sha256: sha256(contactBytes),
  });

  assert(glbManifest.format === 'glb', 'GLB manifest format must be glb');
  assert(glbManifest.unit === 'meter', 'GLB manifest unit must be meter');
  assert(
    glbManifest.materialNamesMatch === true,
    'GLB material names did not survive reload',
  );
  assert(
    glbManifest.bounds?.matches === true,
    'GLB bounds did not survive reload',
  );
  for (const field of [
    'transformMismatchCount',
    'scaleMismatchCount',
    'textureCount',
    'unsupportedMaterialCount',
    'unsupportedShaderCount',
    'skinCount',
    'cameraCount',
    'lightCount',
    'animationCount',
  ]) {
    assert(glbManifest[field] === 0, `GLB manifest ${field} must be zero`);
  }

  const glbPath = await containedFile(glbDirectory, glbManifest.glbPath, 'GLB');
  const glbBytes = await readFile(glbPath);
  assert(glbBytes.length >= 12, 'GLB is shorter than its header');
  assert(glbBytes.toString('ascii', 0, 4) === 'glTF', 'GLB magic is invalid');
  assert(glbBytes.readUInt32LE(4) === 2, 'GLB version must be 2');
  assert(
    glbBytes.readUInt32LE(8) === glbBytes.length,
    'GLB header byte length does not match the file',
  );
  assert(
    glbManifest.byteLength === glbBytes.length,
    'GLB manifest byteLength does not match the file',
  );
  files.push({
    kind: 'glb',
    path: glbPath,
    bytes: glbBytes.length,
    sha256: sha256(glbBytes),
  });

  process.stdout.write(
    `${JSON.stringify(
      {
        ok: true,
        assetId: options.expectedAssetId,
        revisionId: options.expectedRevisionId,
        renderManifestPath,
        glbManifestPath,
        files,
      },
      null,
      2,
    )}\n`,
  );
}

main().catch((error) => {
  process.stderr.write(
    `${JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) })}\n`,
  );
  process.exitCode = 1;
});
