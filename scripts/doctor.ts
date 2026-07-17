import { readFile, readdir } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import process from 'node:process';

const ROOT = resolve(import.meta.dirname, '..');
const SRC = join(ROOT, 'src');
const DOMAIN = new Set([
  'contracts',
  'document',
  'geometry',
  'assembly',
  'fantasy-kit',
  'scene',
  'render',
  'export',
  'validation',
]);
const ADAPTERS = new Set(['tools', 'mcp', 'inspector']);

async function files(directory: string): Promise<string[]> {
  const output: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) output.push(...(await files(path)));
    else if (['.ts', '.tsx', '.js', '.mjs'].includes(extname(entry.name)))
      output.push(path);
  }
  return output;
}

async function boundaryViolations(): Promise<string[]> {
  const violations: string[] = [];
  for (const file of await files(SRC)) {
    const source = await readFile(file, 'utf8');
    const moduleName = relative(SRC, file).split(/[\\/]/)[0] ?? '';
    for (const match of source.matchAll(
      /(?:from\s+|import\s*\()['"]([^'"]+)['"]/g,
    )) {
      const target = match[1] ?? '';
      if (
        moduleName === 'contracts' &&
        (target.startsWith('node:') ||
          target === 'three' ||
          target.startsWith('@modelcontextprotocol'))
      )
        violations.push(
          `${relative(ROOT, file)}: contracts imported ${target}`,
        );
      for (const adapter of ADAPTERS)
        if (DOMAIN.has(moduleName) && target.includes(`/${adapter}/`))
          violations.push(
            `${relative(ROOT, file)}: domain module imported adapter ${adapter}`,
          );
      const crossModule = target.match(
        /\.\.\/(contracts|document|geometry|assembly|fantasy-kit|scene|render|export|validation|tools|mcp|inspector)\/(.+)/,
      );
      if (
        crossModule &&
        crossModule[2] !== 'index.js' &&
        !(crossModule[1] === 'document' && crossModule[2] === 'browser.js')
      )
        violations.push(
          `${relative(ROOT, file)}: cross-module import bypasses ${crossModule[1]}/index.ts`,
        );
    }
  }
  return violations;
}

async function main(): Promise<void> {
  const violations = await boundaryViolations();
  const generated = spawnSync(
    process.execPath,
    ['--import', 'tsx', 'scripts/generate.ts', '--check'],
    { cwd: ROOT, encoding: 'utf8' },
  );
  if (generated.status !== 0)
    violations.push(
      generated.stderr.trim() ||
        generated.stdout.trim() ||
        'Generated facts check failed.',
    );
  const packageJson = JSON.parse(
    await readFile(join(ROOT, 'package.json'), 'utf8'),
  ) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  const dependencies = Object.keys({
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  });
  for (const banned of ['blender', 'bpy', 'react', 'babylonjs'])
    if (dependencies.some((name) => name.toLowerCase().includes(banned)))
      violations.push(`Out-of-scope dependency declared: ${banned}`);
  if (violations.length > 0) {
    console.error(
      [
        'Architecture doctor failed:',
        ...violations.map((violation) => `- ${violation}`),
      ].join('\n'),
    );
    process.exitCode = 1;
  } else {
    console.log('Architecture doctor passed.');
  }
}

await main();
