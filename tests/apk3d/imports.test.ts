/**
 * The import rules of section 4 of docs/apk3d-cartridge.md, checked over every import line of
 * src/apk3d, src/games, and src/host. Same-folder imports and CSS imports are always allowed.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();

/**
 * Module ids: `apk3d/<sub>`; `games/<game>/<part>` where part is core, view (view/ and every
 * other game file), index, manifest, strings, or briefing; `host`; a library by package name.
 */
type ModuleId = string;

/**
 * Allowed targets per source rule. `games/STAR/<part>` matches any game; `games/self/<part>`
 * the importing game; `games/self/*` any part of it; `apk3d/*` any kit folder. A target with
 * `dynamic:` in front is allowed through `import()` only.
 */
const RULES: Record<string, readonly ModuleId[]> = {
  'apk3d/contracts': ['zod'],
  'apk3d/sim': ['apk3d/contracts'],
  'apk3d/stage': ['apk3d/contracts', 'apk3d/sim', 'three'],
  'apk3d/hud': ['apk3d/contracts', 'apk3d/sim', 'apk3d/stage', 'three'],
  'apk3d/audio': ['apk3d/contracts', 'apk3d/sim', 'three'],
  'apk3d/i18n': ['apk3d/contracts'],
  'apk3d/device': ['apk3d/contracts'],
  'apk3d/view2d': ['apk3d/contracts', 'apk3d/sim'],
  'apk3d/factory': [
    'apk3d/contracts',
    'apk3d/sim',
    'apk3d/stage',
    'apk3d/hud',
    'apk3d/audio',
    'apk3d/device',
    'apk3d/i18n',
    'three',
    'phaser',
  ],
  'apk3d/qc': [
    'apk3d/contracts',
    'apk3d/sim',
    'apk3d/stage',
    'apk3d/hud',
    'apk3d/audio',
    'apk3d/device',
    'apk3d/i18n',
    'three',
  ],
  'games/STAR/core': ['apk3d/contracts', 'apk3d/sim'],
  'games/STAR/manifest': ['apk3d/contracts'],
  'games/STAR/strings': ['apk3d/contracts'],
  'games/STAR/briefing': ['apk3d/contracts'],
  'games/STAR/view': ['games/self/*', 'apk3d/*', 'three', 'phaser'],
  'games/STAR/index': ['games/self/*', 'apk3d/*'],
  host: ['apk3d/*', 'three', 'games/STAR/manifest', 'games/STAR/strings', 'dynamic:games/STAR/index'],
};

/**
 * Imports that break the table today and are scheduled for removal; each names its task. A new
 * violation anywhere else still fails the test.
 */
const TRANSITIONAL: readonly { file: string; specifier: string; until: string }[] = [
  {
    file: 'src/games/monster-encounters/view/battle-stage.ts',
    specifier: '../../../../scenes/sunken-vault.js',
    until: 'task 12/13 puts the vault set into a model pack (FRONTEND)',
  },
];

const walk = (dir: string): string[] => {
  if (!existsSync(dir)) return [];
  let files: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) files = files.concat(walk(path));
    else if (path.endsWith('.ts') && !path.endsWith('.d.ts')) files.push(path);
  }
  return files;
};

export interface ImportUse {
  specifier: string;
  /** True for `import('x')` (lazy code). */
  dynamic: boolean;
}

/** `import ... from 'x'`, `export ... from 'x'`, `import 'x'`, and `import('x')`. */
const IMPORT_LINE =
  /(?:^|\n)\s*(?:import|export)\b[^'"\n]*?\bfrom\s*['"]([^'"]+)['"]|(?:^|\n)\s*import\s*['"]([^'"]+)['"]|\bimport\(\s*['"]([^'"]+)['"]\s*\)/g;

export function importsOf(source: string): ImportUse[] {
  return [...source.matchAll(IMPORT_LINE)].map((m) => ({
    specifier: (m[1] ?? m[2] ?? m[3])!,
    dynamic: m[3] !== undefined,
  }));
}

/** The module id of a source file under src/. */
export function moduleOf(file: string): ModuleId {
  const parts = relative(join(ROOT, 'src'), file).split(sep);
  if (parts[0] === 'apk3d') return `apk3d/${parts[1] ?? ''}`;
  if (parts[0] === 'host') return 'host';
  if (parts[0] === 'games' && parts[1]) {
    const game = parts[1];
    const rest = parts.slice(2).join('/');
    if (rest === 'index.ts') return `games/${game}/index`;
    if (rest === 'manifest.ts') return `games/${game}/manifest`;
    if (rest === 'strings.en.ts') return `games/${game}/strings`;
    if (rest === 'briefing.ts') return `games/${game}/briefing`;
    if (parts[2] === 'core') return `games/${game}/core`;
    return `games/${game}/view`;
  }
  return parts.join('/');
}

/** The module id of an import specifier seen from `file`. */
export function targetOf(
  file: string,
  specifier: string,
): { kind: 'css' | 'library' | 'module'; id: ModuleId } {
  if (/\.css$/.test(specifier)) return { kind: 'css', id: specifier };
  if (!specifier.startsWith('.')) {
    const name = specifier.startsWith('@')
      ? specifier.split('/').slice(0, 2).join('/')
      : specifier.split('/')[0]!;
    return { kind: 'library', id: name };
  }
  const target = resolve(dirname(file), specifier).replace(/\.js$/, '.ts');
  return { kind: 'module', id: moduleOf(target) };
}

/** True when `source` may import `target` (statically, or dynamically when `dynamic`). */
export function allowed(source: ModuleId, target: ModuleId, dynamic = false): boolean {
  if (source === target) return true;
  const game = /^games\/([^/]+)\//.exec(source)?.[1];
  const rule = RULES[game ? source.replace(`games/${game}/`, 'games/STAR/') : source];
  if (!rule) return false;
  return rule.some((entry) => {
    const dynamicOnly = entry.startsWith('dynamic:');
    if (dynamicOnly && !dynamic) return false;
    const pattern = (dynamicOnly ? entry.slice('dynamic:'.length) : entry).replace(
      'games/self/',
      `games/${game}/`,
    );
    if (pattern.endsWith('/*')) return target.startsWith(pattern.slice(0, -1));
    if (pattern.startsWith('games/STAR/'))
      return /^games\/[^/]+\//.test(target) && target.endsWith(pattern.slice('games/STAR'.length));
    return target === pattern;
  });
}

describe('import rules', () => {
  const files = ['src/apk3d', 'src/games', 'src/host'].flatMap((dir) => walk(join(ROOT, dir)));

  it('scans the kit', () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it('every import obeys the rule table of section 4', () => {
    const problems: string[] = [];
    for (const file of files) {
      const source = moduleOf(file);
      const path = relative(ROOT, file);
      for (const { specifier, dynamic } of importsOf(readFileSync(file, 'utf8'))) {
        const target = targetOf(file, specifier);
        if (target.kind === 'css') continue;
        if (TRANSITIONAL.some((t) => t.file === path && t.specifier === specifier)) continue;
        if (!allowed(source, target.id, dynamic)) {
          problems.push(
            `${path} (${source}) imports '${specifier}' (${target.id}${dynamic ? ', dynamic' : ''})`,
          );
        }
      }
    }
    expect(problems).toEqual([]);
  });

  it('classifies files and specifiers', () => {
    const at = (p: string) => join(ROOT, 'src', p);
    expect(moduleOf(at('apk3d/hud/root.ts'))).toBe('apk3d/hud');
    expect(moduleOf(at('games/potion-rush/core/sim.ts'))).toBe('games/potion-rush/core');
    expect(moduleOf(at('games/potion-rush/view/game.ts'))).toBe('games/potion-rush/view');
    expect(moduleOf(at('games/potion-rush/qc/bot.ts'))).toBe('games/potion-rush/view');
    expect(moduleOf(at('games/potion-rush/briefing.ts'))).toBe('games/potion-rush/briefing');
    expect(moduleOf(at('games/potion-rush/manifest.ts'))).toBe('games/potion-rush/manifest');
    expect(moduleOf(at('games/potion-rush/strings.en.ts'))).toBe('games/potion-rush/strings');
    expect(moduleOf(at('games/potion-rush/index.ts'))).toBe('games/potion-rush/index');
    expect(moduleOf(at('host/selector.ts'))).toBe('host');
    expect(targetOf(at('apk3d/hud/root.ts'), '../stage/stage.js')).toEqual({
      kind: 'module',
      id: 'apk3d/stage',
    });
    expect(targetOf(at('apk3d/hud/root.ts'), './hud.css')).toEqual({ kind: 'css', id: './hud.css' });
    expect(targetOf(at('host/registry.ts'), '../games/potion-rush/manifest.js')).toEqual({
      kind: 'module',
      id: 'games/potion-rush/manifest',
    });
    expect(targetOf(at('apk3d/stage/loader.ts'), 'three/addons/loaders/GLTFLoader.js')).toEqual({
      kind: 'library',
      id: 'three',
    });
    expect(targetOf(at('apk3d/contracts/apk.ts'), 'zod')).toEqual({ kind: 'library', id: 'zod' });
    expect(
      importsOf(
        `import { z } from 'zod';\nimport './x.css';\nexport * from './y.js';\nconst m = await import('./z.js');`,
      ),
    ).toEqual([
      { specifier: 'zod', dynamic: false },
      { specifier: './x.css', dynamic: false },
      { specifier: './y.js', dynamic: false },
      { specifier: './z.js', dynamic: true },
    ]);
  });

  it('applies the table: allowed and forbidden pairs', () => {
    expect(allowed('apk3d/contracts', 'zod')).toBe(true);
    expect(allowed('apk3d/contracts', 'three')).toBe(false);
    expect(allowed('apk3d/sim', 'apk3d/contracts')).toBe(true);
    expect(allowed('apk3d/sim', 'apk3d/stage')).toBe(false);
    expect(allowed('apk3d/hud', 'apk3d/stage')).toBe(true);
    expect(allowed('apk3d/stage', 'apk3d/hud')).toBe(false);
    expect(allowed('apk3d/i18n', 'apk3d/contracts')).toBe(true);
    expect(allowed('apk3d/device', 'apk3d/stage')).toBe(false);
    expect(allowed('apk3d/factory', 'apk3d/device')).toBe(true);
    expect(allowed('apk3d/stage', 'games/potion-rush/core')).toBe(false);
    expect(allowed('apk3d/qc', 'host')).toBe(false);
    expect(allowed('apk3d/hud', 'node:fs')).toBe(false);
    // Games.
    expect(allowed('games/potion-rush/core', 'apk3d/sim')).toBe(true);
    expect(allowed('games/potion-rush/core', 'apk3d/stage')).toBe(false);
    expect(allowed('games/potion-rush/core', 'host')).toBe(false);
    expect(allowed('games/potion-rush/manifest', 'apk3d/contracts')).toBe(true);
    expect(allowed('games/potion-rush/manifest', 'apk3d/stage')).toBe(false);
    expect(allowed('games/potion-rush/strings', 'apk3d/contracts')).toBe(true);
    expect(allowed('games/potion-rush/briefing', 'apk3d/contracts')).toBe(true);
    expect(allowed('games/potion-rush/briefing', 'games/potion-rush/core')).toBe(false);
    expect(allowed('games/potion-rush/view', 'games/potion-rush/core')).toBe(true);
    expect(allowed('games/potion-rush/view', 'games/potion-rush/manifest')).toBe(true);
    expect(allowed('games/potion-rush/view', 'games/dragon-flight/core')).toBe(false);
    expect(allowed('games/potion-rush/view', 'apk3d/hud')).toBe(true);
    expect(allowed('games/potion-rush/view', 'three')).toBe(true);
    expect(allowed('games/potion-rush/view', 'zod')).toBe(false);
    expect(allowed('games/potion-rush/index', 'games/potion-rush/view')).toBe(true);
    expect(allowed('games/potion-rush/index', 'apk3d/factory')).toBe(true);
    expect(allowed('games/potion-rush/index', 'games/dragon-flight/view')).toBe(false);
    // Host: manifests and strings statically, game code only through import().
    expect(allowed('host', 'apk3d/device')).toBe(true);
    expect(allowed('host', 'three')).toBe(true);
    expect(allowed('host', 'games/potion-rush/manifest')).toBe(true);
    expect(allowed('host', 'games/potion-rush/strings')).toBe(true);
    expect(allowed('host', 'games/potion-rush/index')).toBe(false);
    expect(allowed('host', 'games/potion-rush/index', true)).toBe(true);
    expect(allowed('host', 'games/potion-rush/view', true)).toBe(false);
    expect(allowed('host', 'games/potion-rush/core')).toBe(false);
    expect(allowed('host', 'games/potion-rush/core')).toBe(false);
  });
});
