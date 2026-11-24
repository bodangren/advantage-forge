import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import { existsSync, lstatSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, afterAll } from 'vitest';
import sharp from 'sharp';

// The checkout under test comes from this module, never from a hard-coded path.
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const HEAVY_RUN =
  process.env.HEAVY_RUN_PATH ?? resolve(ROOT, '..', '..', 'advantage-pr', 'scripts', 'jobs', 'heavy-run.sh');
const PID = process.pid;
const PIN_NAME = `_flat-render-pin-${PID}`;
const FIXTURE_PATH = join(ROOT, 'assets', `${PIN_NAME}.ts`);
const OUT_DIR = join(ROOT, 'out', PIN_NAME);
const FLAT_DIR = join(OUT_DIR, 'flat');
const FRONT_PNG = join(FLAT_DIR, 'front-level.png');
const SIDE_PNG = join(FLAT_DIR, 'side-level.png');

const BODY_HEX = '#3f8fd0';
const BLOCK_HEX = '#e0a030';

function pinSource(): string {
  return `import { defineAsset, sdf } from '../src/index.js';

export default defineAsset({
  name: '${PIN_NAME}',
  texture: false,
  build(k) {
    k.body('body', sdf.box([0.4, 1.0, 0.2]).at(0, 0.5, 0), { color: '${BODY_HEX}' });
    k.body('block', sdf.box([0.2, 0.05, 0.05]).at(0, 0.9, 0.125), { color: '${BLOCK_HEX}' });
  },
});
`;
}

let created = false;
let renderResult: SpawnSyncReturns<string> | null = null;

// The one ownership check: exclusive creation, or the named collision error.
function createExclusive(targetPath: string, body: string): void {
  try {
    writeFileSync(targetPath, body, { flag: 'wx' });
  } catch (error) {
    const e = error as NodeJS.ErrnoException;
    if (e.code === 'EEXIST') throw new Error(`fixture path exists: ${targetPath}`);
    throw error;
  }
}

function createFixture(body: string): void {
  createExclusive(FIXTURE_PATH, body);
  created = true;
}

function removeOutDir(): void {
  const st = lstatSync(OUT_DIR, { throwIfNoEntry: false });
  if (!st || !st.isDirectory()) return;
  const real = realpathSync(OUT_DIR);
  const outRoot = realpathSync(join(ROOT, 'out'));
  if (dirname(real) !== outRoot) return;
  if (!basename(real).startsWith('_flat-render-pin-')) return;
  rmSync(real, { recursive: true, force: true });
}

function removeOwned(): void {
  if (created) {
    rmSync(FIXTURE_PATH, { force: true });
    created = false;
  }
  removeOutDir();
}

function runForge(args: string): SpawnSyncReturns<string> {
  return spawnSync('bash', [HEAVY_RUN, '-c', `./forge ${args}`], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 600_000,
    env: { ...process.env, HEAVY_MIN_AVAIL_MB: '1500' },
  });
}

function ensureRendered(): SpawnSyncReturns<string> {
  if (!created) createFixture(pinSource());
  if (!renderResult) {
    renderResult = runForge(
      `render ${PIN_NAME} --fast --views front-level,side-level --ortho --flat --bg none --size 256`,
    );
  }
  return renderResult;
}

async function pixel(pngPath: string, col: number, row: number): Promise<[number, number, number, number]> {
  const { data, info } = await sharp(pngPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const idx = (row * info.width! + col) * 4;
  return [data[idx!]!, data[idx! + 1]!, data[idx! + 2]!, data[idx! + 3]!];
}

async function maskRows(
  pngPath: string,
): Promise<{ top: number; bottom: number; height: number; width: number }> {
  const { data, info } = await sharp(pngPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const width = info.width!;
  const height = info.height!;
  let top = -1;
  let bottom = -1;
  for (let row = 0; row < height; row += 1) {
    for (let col = 0; col < width; col += 1) {
      if (data[(row * width + col) * 4 + 3]! >= 128) {
        if (top === -1) top = row;
        bottom = row;
        break;
      }
    }
  }
  return { top, bottom, height: bottom - top + 1, width };
}

function hexToRgb(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

afterAll(() => {
  removeOwned();
});

describe('render options (orthographic flat pin)', () => {
  it('fails closed when the actual fixture path already exists', { timeout: 600_000 }, () => {
    expect(existsSync(FIXTURE_PATH)).toBe(false);
    writeFileSync(FIXTURE_PATH, '// planted collision\n', { flag: 'wx' });
    const before = readFileSync(FIXTURE_PATH, 'utf8');
    let failure = '';
    try {
      ensureRendered();
    } catch (error) {
      failure = (error as Error).message;
    }
    expect(failure).toBe(`fixture path exists: ${FIXTURE_PATH}`);
    expect(readFileSync(FIXTURE_PATH, 'utf8')).toBe(before);
    expect(renderResult).toBeNull();
    expect(existsSync(OUT_DIR)).toBe(false);
    rmSync(FIXTURE_PATH, { force: true });
    expect(existsSync(FIXTURE_PATH)).toBe(false);
  });

  it('writes both flat views at 256x256', { timeout: 600_000 }, async () => {
    expect(existsSync(join(ROOT, 'src', 'cli', 'forge.ts'))).toBe(true);
    expect(existsSync(join(ROOT, 'package.json'))).toBe(true);
    expect(existsSync(HEAVY_RUN), `missing runner ${HEAVY_RUN}`).toBe(true);
    const result = ensureRendered();
    expect(result.status, result.stderr || result.stdout).toBe(0);
    for (const pngPath of [FRONT_PNG, SIDE_PNG]) {
      expect(existsSync(pngPath), `missing ${pngPath}`).toBe(true);
    }
    for (const pngPath of [FRONT_PNG, SIDE_PNG]) {
      const meta = await sharp(pngPath).metadata();
      expect(meta.width).toBe(256);
      expect(meta.height).toBe(256);
    }
  });

  it('leaves the corner pixel transparent', { timeout: 600_000 }, async () => {
    ensureRendered();
    expect(existsSync(FRONT_PNG), `missing ${FRONT_PNG}`).toBe(true);
    const [, , , a] = await pixel(FRONT_PNG, 0, 0);
    expect(a).toBe(0);
  });

  it('renders the body colour within 1 of 255', { timeout: 600_000 }, async () => {
    ensureRendered();
    expect(existsSync(FRONT_PNG), `missing ${FRONT_PNG}`).toBe(true);
    const meta = await sharp(FRONT_PNG).metadata();
    const [rr, gg, bb] = hexToRgb(BODY_HEX);
    const [r, g, b, a] = await pixel(FRONT_PNG, Math.floor(meta.width! / 2), Math.floor(meta.height! / 2));
    expect(a).toBeGreaterThanOrEqual(250);
    expect(Math.abs(r - rr)).toBeLessThanOrEqual(1);
    expect(Math.abs(g - gg)).toBeLessThanOrEqual(1);
    expect(Math.abs(b - bb)).toBeLessThanOrEqual(1);
  });

  it('renders the block colour within 1 of 255', { timeout: 600_000 }, async () => {
    ensureRendered();
    expect(existsSync(FRONT_PNG), `missing ${FRONT_PNG}`).toBe(true);
    const meta = await sharp(FRONT_PNG).metadata();
    const [rr, gg, bb] = hexToRgb(BLOCK_HEX);
    const [r, g, b, a] = await pixel(FRONT_PNG, Math.floor(meta.width! / 2), Math.floor(meta.height! * 0.12));
    expect(a).toBeGreaterThanOrEqual(250);
    expect(Math.abs(r - rr)).toBeLessThanOrEqual(1);
    expect(Math.abs(g - gg)).toBeLessThanOrEqual(1);
    expect(Math.abs(b - bb)).toBeLessThanOrEqual(1);
  });

  it('keeps both view heights within 2 px', { timeout: 600_000 }, async () => {
    ensureRendered();
    expect(existsSync(FRONT_PNG), `missing ${FRONT_PNG}`).toBe(true);
    expect(existsSync(SIDE_PNG), `missing ${SIDE_PNG}`).toBe(true);
    const front = await maskRows(FRONT_PNG);
    const side = await maskRows(SIDE_PNG);
    expect(Math.abs(front.height - side.height)).toBeLessThanOrEqual(2);
  });

  it(
    'places the side block left of centre by 0.02 m ppm or more (decision j)',
    { timeout: 600_000 },
    async () => {
      ensureRendered();
      expect(existsSync(SIDE_PNG), `missing ${SIDE_PNG}`).toBe(true);
      const { data, info } = await sharp(SIDE_PNG).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      const width = info.width!;
      const height = info.height!;
      const [rr, gg, bb] = hexToRgb(BLOCK_HEX);
      let minCol = width;
      for (let row = 0; row < height; row += 1) {
        for (let col = 0; col < width; col += 1) {
          const idx = (row * width + col) * 4;
          if (
            data[idx + 3]! >= 250 &&
            Math.abs(data[idx]! - rr) <= 1 &&
            Math.abs(data[idx + 1]! - gg) <= 1 &&
            Math.abs(data[idx + 2]! - bb) <= 1
          ) {
            if (col < minCol) minCol = col;
          }
        }
      }
      expect(minCol).toBeLessThan(width);
      const ppm = 256 / 1.1;
      expect(width / 2 - minCol).toBeGreaterThanOrEqual(0.02 * ppm);
    },
  );

  it('writes the named view without --ortho and rejects --flat without --fast', { timeout: 600_000 }, () => {
    if (!created) createFixture(pinSource());
    const named = runForge(`render ${PIN_NAME} --views front-level --size 128 --bg none --fast`);
    expect(named.status, named.stderr || named.stdout).toBe(0);
    expect(existsSync(join(OUT_DIR, 'views', 'front-level.png'))).toBe(true);
    const flat = runForge(`render ${PIN_NAME} --views front-level --flat --bg none --size 128`);
    expect(flat.status).not.toBe(0);
    expect(`${flat.stderr || ''}${flat.stdout || ''}`).toContain('--flat needs --fast and --bg none');
  });

  it('protects an existing fixture path and leaves no fixture behind', { timeout: 600_000 }, () => {
    const probePath = join(ROOT, 'assets', `${PIN_NAME}-probe.ts`);
    let probeFailure = '';
    try {
      createExclusive(probePath, pinSource());
    } catch (error) {
      probeFailure = (error as Error).message;
    }
    expect(probeFailure).toBe('');
    const before = readFileSync(probePath, 'utf8');
    let secondFailure = '';
    try {
      createExclusive(probePath, pinSource());
    } catch (error) {
      secondFailure = (error as Error).message;
    }
    expect(secondFailure).toBe(`fixture path exists: ${probePath}`);
    expect(readFileSync(probePath, 'utf8')).toBe(before);
    rmSync(probePath, { force: true });
    const result = ensureRendered();
    expect(result.status, result.stderr || result.stdout).toBe(0);
    removeOwned();
    expect(existsSync(FIXTURE_PATH)).toBe(false);
    expect(existsSync(OUT_DIR)).toBe(false);
    expect(created).toBe(false);
  });
});
