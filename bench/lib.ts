import { createHash } from 'node:crypto';
import { cpSync, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

export const BENCH = import.meta.dirname;
export const REPO = join(BENCH, '..');

/** Paths never copied into a candidate: VCS, dependencies, outputs, the bench itself, skills. */
export const EXCLUDE = new Set([
  '.git',
  'node_modules',
  'out',
  'bench',
  'docs',
  'dist',
  'coverage',
  '.claude',
  '.agents',
]);

export function sha256(data: string | Uint8Array): string {
  return createHash('sha256').update(data).digest('hex');
}

/** sha256 of every regular file under `root`, keyed by relative path (skipping `skip` names). */
export function hashTree(root: string, skip: ReadonlySet<string> = new Set()): Record<string, string> {
  const out: Record<string, string> = {};
  const walk = (dir: string) => {
    for (const name of readdirSync(dir).sort()) {
      const path = join(dir, name);
      const rel = relative(root, path);
      if (skip.has(rel.split('/')[0]!)) continue;
      const st = lstatSync(path);
      if (st.isSymbolicLink()) out[rel] = 'symlink';
      else if (st.isDirectory()) walk(path);
      else if (st.isFile()) out[rel] = sha256(readFileSync(path));
    }
  };
  walk(root);
  return out;
}

/** One hash for a whole tree (stable across machines). */
export function treeDigest(root: string, skip: ReadonlySet<string> = new Set()): string {
  const h = hashTree(root, skip);
  return sha256(
    Object.keys(h)
      .sort()
      .map((k) => `${k}\0${h[k]}`)
      .join('\n'),
  );
}

export function copyRepo(dest: string): void {
  mkdirSync(dest, { recursive: true });
  for (const name of readdirSync(REPO)) {
    if (EXCLUDE.has(name)) continue;
    cpSync(join(REPO, name), join(dest, name), { recursive: true, verbatimSymlinks: true });
  }
}

export function writeJson(path: string, data: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
}

export function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

export function readJsonIf<T>(path: string): T | null {
  return existsSync(path) ? readJson<T>(path) : null;
}

/** Files a candidate may create or change for brief `id`. */
export function allowed(id: string, rel: string): boolean {
  return rel === `assets/${id}.ts` || (rel.startsWith(`assets/_${id}-`) && rel.endsWith('.ts'));
}
