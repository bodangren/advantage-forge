import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { collectBodies, type AssetDefinition } from '../src/asset.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const NAME = 'sprout-grandma-kim';
const PRESET = 'grandma';
const PHASE_BASE_SHA = 'b48c3df3235d69337aecc90da7db6cd178455eed';
const ASSET_FILE = join(ROOT, 'assets', `${NAME}.ts`);
const BASE_FILE = join(ROOT, 'assets', 'parts', 'humanoid-kim.ts');
const SCRIPT = join(ROOT, 'scripts', 'proportion-check.mjs');
const TSX = join(ROOT, 'node_modules', '.bin', 'tsx');
const RECORD_FILE = join(ROOT, 'out', 'chibi-sprouts', 'cast', `${NAME}-measure.json`);
const STATS_FILE = join(ROOT, 'out', NAME, 'stats.json');
const GLB_FILE = join(ROOT, 'out', NAME, `${NAME}.glb`);
const FLAT_FRONT = join(ROOT, 'out', NAME, 'flat', 'front-level.png');
const FLAT_SIDE = join(ROOT, 'out', NAME, 'flat', 'side-level.png');
const BASE_BODIES = ['head-skin', 'torso-skin', 'arms-skin', 'legs-skin', 'feet-skin', 'hands'];
const BONE_NAMES = [
  'hips',
  'spine',
  'chest',
  'neck',
  'head',
  'upperarm.L',
  'forearm.L',
  'hand.L',
  'upperarm.R',
  'forearm.R',
  'hand.R',
  'leg.L',
  'shin.L',
  'foot.L',
  'leg.R',
  'shin.R',
  'foot.R',
];
const ABSOLUTE_JOINTS: Record<string, readonly [number, number, number]> = {
  hips: [0, 0.585, 0],
  spine: [0, 0.75, 0],
  chest: [0, 0.9, 0],
  neck: [0, 1.075, 0],
  head: [0, 1.178, 0],
  'upperarm.L': [0.143, 0.9937, 0],
  'forearm.L': [0.156, 0.803, 0.006],
  'hand.L': [0.176, 0.601, 0.015],
  'upperarm.R': [-0.143, 0.9937, 0],
  'forearm.R': [-0.156, 0.803, 0.006],
  'hand.R': [-0.176, 0.601, 0.015],
  'leg.L': [0.075, 0.585, 0],
  'shin.L': [0.082, 0.324, 0],
  'foot.L': [0.085, 0.045, 0.02],
  'leg.R': [-0.075, 0.585, 0],
  'shin.R': [-0.082, 0.324, 0],
  'foot.R': [-0.085, 0.045, 0.02],
};

type TableRow = { name: string; lo: number; hi: number };
const KIM_TABLE: TableRow[] = [
  { name: 'heightInHeads', lo: 3.54, hi: 3.74 },
  { name: 'armToTorso', lo: 1.25, hi: 1.41 },
  { name: 'legShare', lo: 0.36, hi: 0.42 },
  { name: 'headToShoulders', lo: 1.11, hi: 1.27 },
  { name: 'wrist', lo: -0.16, hi: 0.04 },
  { name: 'fingertips', lo: 0.41, hi: 0.61 },
  { name: 'eyeLine', lo: 0.59, hi: 0.65 },
  { name: 'eyeHeight', lo: 0.09, hi: 0.13 },
  { name: 'spacingHead', lo: 0.35, hi: 0.41 },
  { name: 'eyeWidthFace', lo: 0.22, hi: 0.24 },
  { name: 'spacingFace', lo: 0.44, hi: 0.5 },
];
type AdultModule = {
  default: AssetDefinition;
  castMeta?: { faceMarks?: Record<string, `#${string}`> };
};
type GlbJson = {
  nodes: Array<{ name?: string; translation?: number[]; children?: number[]; mesh?: number }>;
  skins: Array<{ joints: number[] }>;
  animations: Array<{ name?: string }>;
};
type Box = { x0: number; y0: number; x1: number; y1: number };

function moduleUrl(file: string): string {
  return pathToFileURL(file).href;
}

async function loadAsset(): Promise<AdultModule> {
  expect(existsSync(ASSET_FILE), `asset ${NAME}: not built: ${ASSET_FILE}`).toBe(true);
  return (await import(moduleUrl(ASSET_FILE))) as AdultModule;
}

function runMeasure(): { status: number | null; output: string } {
  const result = spawnSync(
    TSX,
    [SCRIPT, '--asset', NAME, '--table', 'kim', '--record', `out/chibi-sprouts/cast/${NAME}-measure.json`],
    {
      cwd: ROOT,
      encoding: 'utf8',
      timeout: 300_000,
      env: { ...process.env, HEAVY_MIN_AVAIL_MB: '1500' },
    },
  );
  return {
    status: result.status,
    output: `${result.stdout || ''}\n${result.stderr || ''}${result.error?.message || ''}`,
  };
}

function readRecord(): any {
  expect(existsSync(RECORD_FILE), `record ${NAME}: not built: ${RECORD_FILE}`).toBe(true);
  return JSON.parse(readFileSync(RECORD_FILE, 'utf8'));
}

function firstColour(slot: unknown): string {
  const value = Object.values((slot ?? {}) as Record<string, unknown>)[0];
  expect(typeof value, 'the first variant option must be a hex colour').toBe('string');
  return value as string;
}

function hexRgb(hex: string): [number, number, number] {
  expect(hex).toMatch(/^#[0-9a-f]{6}$/i);
  return [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
}

async function countColour(file: string, hex: string, box?: Box): Promise<number> {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const target = hexRgb(hex);
  const x0 = Math.max(0, Math.floor(box?.x0 ?? 0));
  const y0 = Math.max(0, Math.floor(box?.y0 ?? 0));
  const x1 = Math.min(info.width - 1, Math.ceil(box?.x1 ?? info.width - 1));
  const y1 = Math.min(info.height - 1, Math.ceil(box?.y1 ?? info.height - 1));
  let count = 0;
  for (let y = y0; y <= y1; y += 1) {
    for (let x = x0; x <= x1; x += 1) {
      const i = (y * info.width + x) * info.channels;
      if (data[i + 3]! < 128) continue;
      const distance = Math.max(...[0, 1, 2].map((c) => Math.abs(data[i + c]! - target[c]!)));
      if (distance <= 12) count += 1;
    }
  }
  return count;
}

function readGlb(): GlbJson {
  expect(existsSync(GLB_FILE), `asset ${NAME}: not built: ${GLB_FILE}`).toBe(true);
  const bytes = readFileSync(GLB_FILE);
  expect(bytes.readUInt32LE(0), 'GLB magic').toBe(0x46546c67);
  const jsonLength = bytes.readUInt32LE(12);
  return JSON.parse(bytes.subarray(20, 20 + jsonLength).toString('utf8')) as GlbJson;
}

function worldPosition(json: GlbJson, name: string): number[] | null {
  const parents = new Map<number, number>();
  json.nodes.forEach((node, index) => {
    for (const child of node.children ?? []) parents.set(child, index);
  });
  let index = json.nodes.findIndex((node) => node.name === name);
  if (index < 0) return null;
  const position = [0, 0, 0];
  const seen = new Set<number>();
  while (index >= 0 && !seen.has(index)) {
    seen.add(index);
    const translation = json.nodes[index]?.translation ?? [0, 0, 0];
    for (let c = 0; c < 3; c += 1) position[c] = position[c]! + (translation[c] ?? 0);
    index = parents.get(index) ?? -1;
  }
  return position;
}

function gitShow(path: string): string {
  const result = spawnSync('git', ['show', `${PHASE_BASE_SHA}:${path}`], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 30_000,
  });
  expect(result.status, result.stderr || result.error?.message || `git show ${path}`).toBe(0);
  return result.stdout;
}

describe(`${NAME} adult pin`, () => {
  it('measures eleven Kim rows, both palms, and the high white bun', { timeout: 300_000 }, async () => {
    const result = runMeasure();
    expect(result.status, result.output).toBe(0);
    expect(result.output).not.toContain('eye components:');
    const record = readRecord();
    const mod = (await import(moduleUrl(SCRIPT))) as { TABLES: { kim: TableRow[] } };
    const table = mod.TABLES.kim;
    expect(table).toEqual(KIM_TABLE);
    expect(Object.keys(record.rows)).toEqual([...table.map((row) => row.name), 'lit']);
    for (const row of table) {
      expect(record.rows[row.name].value, row.name).toBeGreaterThanOrEqual(row.lo);
      expect(record.rows[row.name].value, row.name).toBeLessThanOrEqual(row.hi);
      expect(record.rows[row.name].lo, row.name).toBe(row.lo);
      expect(record.rows[row.name].hi, row.name).toBe(row.hi);
      expect(record.rows[row.name].pass, row.name).toBe(true);
    }
    expect(record.asset).toBe(NAME);
    expect(record.base).toBe('humanoid-kim');
    expect(record.palms.L.ok).toBe(true);
    expect(record.palms.R.ok).toBe(true);
    expect(record.guards).toEqual([]);

    const asset = await loadAsset();
    const hair = firstColour(asset.default.variants?.hair);
    const hairRgb = hexRgb(hair);
    expect(Math.min(...hairRgb), 'Grandma default hair is white').toBeGreaterThan(200);
    expect(
      Math.max(...hairRgb) - Math.min(...hairRgb),
      'Grandma hair stays neutral white',
    ).toBeLessThanOrEqual(20);
    const crown = record.detail.projectedCrownRow;
    expect(record.detail.crownRow, 'the bun mask top sits above the skull crown').toBeLessThan(crown);
    expect(record.guards).not.toContain('GUARD top on mask');
    expect(record.rows.lit.front.crown, 'the lit front keeps the bun above the band').toBeLessThan(crown);
    const frontBun = await countColour(FLAT_FRONT, hair, {
      x0: 0,
      x1: record.imageSize - 1,
      y0: 0,
      y1: crown - 1,
    });
    const sideBun = await countColour(FLAT_SIDE, hair, {
      x0: 0,
      x1: record.imageSize - 1,
      y0: 0,
      y1: crown - 1,
    });
    expect(frontBun, 'white bun pixels above the projected crown').toBeGreaterThan(0);
    expect(sideBun, 'white bun pixels in the side silhouette').toBeGreaterThan(0);
  });

  it(
    'keeps the adult base, absolute landmarks, face layer, and built inventory',
    { timeout: 300_000 },
    async () => {
      const asset = await loadAsset();
      const base = (await import(moduleUrl(BASE_FILE))) as any;
      expect(base.BASE_CROWN_Y).toBe(1.5);
      expect(base.BASE_CHIN_Y).toBe(1.088);
      expect(readFileSync(BASE_FILE, 'utf8')).toBe(gitShow('assets/parts/humanoid-kim.ts'));

      const source = readFileSync(ASSET_FILE, 'utf8');
      expect(source).toMatch(
        /import\s*\{[^}]*\bbuildKim\b[^}]*\}\s*from\s*['"]\.\/parts\/humanoid-kim\.js['"]/,
      );
      expect(source).toMatch(/import\s*\{[^}]*\bKIM\b[^}]*\}\s*from\s*['"]\.\/parts\/humanoid-kim\.js['"]/);
      expect(source).toContain('buildKim(k)');
      expect(source).toContain('.round(0.002)');
      expect(source).toContain('sdf.extrude(');
      expect(source).toContain('.paintWhere(');

      const collected = await collectBodies(asset.default);
      expect(collected.skeleton).not.toBeNull();
      expect(Object.keys(collected.skeleton!).sort()).toEqual([...BONE_NAMES].sort());
      for (const [bone, expected] of Object.entries(ABSOLUTE_JOINTS)) {
        const actual = collected.skeleton![bone]!.at;
        for (let c = 0; c < 3; c += 1) expect(actual[c], `${bone}[${c}]`).toBeCloseTo(expected[c]!, 6);
      }
      expect([...collected.animations.keys()]).toEqual(['idle']);

      expect(existsSync(STATS_FILE), `asset ${NAME}: not built: ${STATS_FILE}`).toBe(true);
      const stats = JSON.parse(readFileSync(STATS_FILE, 'utf8'));
      expect(stats.name).toBe(NAME);
      expect(stats.bones).toBe(17);
      expect(stats.animations).toEqual([{ name: 'idle', duration: 2.4 }]);
      const bodyNames = stats.bodies.map((body: { name: string }) => body.name);
      expect(new Set(bodyNames).size).toBe(bodyNames.length);
      for (const body of BASE_BODIES)
        expect(bodyNames.filter((name: string) => name === body)).toHaveLength(1);

      const skin = firstColour(asset.default.variants?.skin);
      const hair = firstColour(asset.default.variants?.hair);
      const faceLayers = collected.pending.filter(
        (body) =>
          body.name !== 'head-skin' && body.options.textureDensity === 2 && body.options.color === skin,
      );
      expect(faceLayers, 'one skin face layer with textureDensity 2').toHaveLength(1);
      const hairBodies = collected.pending.filter(
        (body) => body.name.toLowerCase().includes('hair') && body.options.color === hair,
      );
      expect(hairBodies.length, 'one default-colour hair body').toBeGreaterThan(0);
      const identityBodies = collected.pending.filter(
        (body) =>
          !BASE_BODIES.includes(body.name) && !faceLayers.includes(body) && !hairBodies.includes(body),
      );
      expect(identityBodies.length, 'clothing and silhouette bodies').toBeGreaterThan(0);
      for (const body of collected.pending) {
        expect(body.name, 'mouth, glasses, and moustache stay paint').not.toMatch(
          /(^|[-_.])(mouth|glasses|moustache)([-_.]|$)/i,
        );
      }

      const glb = readGlb();
      const jointNames = glb.skins[0]!.joints.map((index) => glb.nodes[index]?.name);
      expect(jointNames.sort()).toEqual([...BONE_NAMES].sort());
      expect(glb.animations.map((animation) => animation.name)).toEqual(['idle']);
      for (const [bone, expected] of Object.entries(ABSOLUTE_JOINTS)) {
        const actual = worldPosition(glb, bone);
        expect(actual, `built joint ${bone}`).not.toBeNull();
        for (let c = 0; c < 3; c += 1)
          expect(actual![c], `built joint ${bone}[${c}]`).toBeCloseTo(expected[c]!, 6);
      }
    },
  );

  it(
    'pins the Grandma identity, castMeta, and preset without moving existing values',
    { timeout: 300_000 },
    async () => {
      const asset = await loadAsset();
      const source = readFileSync(ASSET_FILE, 'utf8').toLowerCase();
      for (const term of ['bun', 'cheek', 'smile', 'stud', 'cardigan', 'dress', 'skirt', 'flats']) {
        expect(source, `Grandma identity term ${term}`).toContain(term);
      }
      expect(asset.castMeta, 'Grandma exports castMeta').toBeDefined();
      expect(asset.castMeta?.faceMarks ?? {}).toEqual({});
      expect(Object.keys(asset.default.presets ?? {})).toEqual([PRESET]);

      const pin = JSON.parse(readFileSync(join(ROOT, 'tests', 'fixtures', 'preset-pin.json'), 'utf8'));
      const baseline = JSON.parse(gitShow('tests/fixtures/preset-pin.json'));
      for (const [name, entry] of Object.entries(baseline.assets) as Array<[string, unknown]>) {
        expect(pin.assets[name], `preset changed: ${name}`).toEqual(entry);
      }
      const entry = pin.assets[NAME];
      expect(entry, `preset pin missing: ${NAME}`).toBeDefined();
      expect(entry.file).toBe(`${NAME}.ts`);
      expect(Object.keys(entry.presets)).toEqual([PRESET]);
      const variants = asset.default.variants ?? {};
      expect(Object.keys(entry.presets[PRESET]).sort()).toEqual(Object.keys(variants).sort());
      for (const [slot, options] of Object.entries(variants)) {
        const expected = asset.default.presets?.[PRESET]?.[slot] ?? Object.keys(options)[0];
        expect(entry.presets[PRESET][slot].option, `${NAME}/${PRESET}/${slot}`).toBe(expected);
      }
    },
  );
});
