import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { rgb, type Rgb } from '../src/sdf/color.js';
import { ratio, recolor, slotTable, type Slot } from '../src/variants.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ASSETS = path.join(ROOT, 'assets');
const PIN_PATH = path.join(ROOT, 'tests', 'fixtures', 'preset-pin.json');

/**
 * Preset entries the fix must move. Green fills this list only with entries its fix changes, each
 * with a reason. An empty list means the pin must not move at all.
 */
const INTENDED_CHANGES: readonly { asset: string; preset: string; slot: string; reason: string }[] = [];

const toByte = (c: number): number => {
  const v = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(Math.max(0, c), 1 / 2.4) - 0.055;
  return Math.max(0, Math.min(255, Math.round(v * 255)));
};
const linearToBytes = (color: Rgb): number[] => [toByte(color[0]), toByte(color[1]), toByte(color[2])];
/** k.tint(slot, -0.25): mix the slot color toward black by 0.25, in linear light. */
const darken = (color: Rgb): Rgb => [color[0] * 0.75, color[1] * 0.75, color[2] * 0.75];
const hex = (bytes: readonly number[]): string =>
  '#' + bytes.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const byteDiff = (a: string, b: string): number => {
  const parse = (s: string) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
  const x = parse(a);
  const y = parse(b);
  return Math.max(...[0, 1, 2].map((i) => Math.abs(x[i]! - y[i]!)));
};
/** The sRGB bytes a slot color becomes after `recolor` with one option, mask fully on. */
function recolourOne(slot: Slot, option: string, color: Rgb): string {
  const mask = new Uint8Array(4);
  mask[slot.channel] = 255;
  const out = recolor(Uint8Array.from(linearToBytes(color)), mask, [slot], { [slot.name]: option });
  return hex([out[0]!, out[1]!, out[2]!]);
}

describe('preset colour contract: a texel at the slot default becomes the option', () => {
  // The saturated default of the ball and the kite panel A slots (sRGB #d9443a), with the ball
  // and kite options. A channel near zero in the default (the blue of yellow) makes this the
  // hardest case for a recolour formula.
  const slot: Slot = {
    name: 'panel',
    channel: 0,
    default: 'red',
    options: {
      red: rgb('#d9443a'),
      yellow: rgb('#f2c230'),
      orange: rgb('#e8892c'),
      green: rgb('#4f9a4a'),
      purple: rgb('#7b4a9e'),
      blue: rgb('#3f6fa8'),
      white: rgb('#f4f1ea'),
    },
  };

  it('recolours the exact default to the option within 3/255', () => {
    const failures: string[] = [];
    for (const option of Object.keys(slot.options)) {
      const out = recolourOne(slot, option, rgb('#d9443a'));
      const target = hex(linearToBytes(slot.options[option]!));
      const error = byteDiff(out, target);
      if (error > 3) failures.push(`${slot.name}/${option}: got ${out}, expected ${target} (${error}/255)`);
    }
    expect(failures, failures.join('\n')).toEqual([]);
  });

  it('recolours the -0.25 shade to the option shade within 6/255', () => {
    const failures: string[] = [];
    for (const option of Object.keys(slot.options)) {
      const target = hex(linearToBytes(darken(slot.options[option]!)));
      const out = recolourOne(slot, option, darken(slot.options.red!));
      const error = byteDiff(out, target);
      if (error > 6) failures.push(`${slot.name}/${option}: got ${out}, expected ${target} (${error}/255)`);
    }
    expect(failures, failures.join('\n')).toEqual([]);
  });
});

describe('preset colour contract: the baked preset atlases land on their option', () => {
  // The measuring script reads out/<asset>/textures and exits 1 when a preset slot drifts more
  // than 8/255. ball and kite are the two known drifted assets (acceptance findings N1, N2);
  // paint-splash and paint-pot are the clean controls.
  it('scripts/preset-colour-check.mjs exits 0 for ball, kite, paint-splash, paint-pot', () => {
    const assets = ['ball', 'kite', 'paint-splash', 'paint-pot'];
    let output = '';
    let status = 0;
    try {
      output = execFileSync(process.execPath, ['scripts/preset-colour-check.mjs', ...assets], {
        cwd: ROOT,
        encoding: 'utf8',
        timeout: 120_000,
      });
    } catch (error) {
      const e = error as { status?: number; stdout?: string; stderr?: string; message: string };
      status = e.status ?? 1;
      output = `${e.stdout ?? ''}${e.stderr ?? ''}${e.message}`;
    }
    expect(status, `preset-colour-check failed:\n${output}`).toBe(0);
  });
});

describe('preset colour contract: the pinned table of every variant asset', () => {
  const pin = JSON.parse(readFileSync(PIN_PATH, 'utf8')) as {
    assets: Record<string, { file: string; presets: Record<string, Record<string, { option: string; ratio: number[]; default: string; shade: string }>> }>;
  };

  it('keeps every pinned asset, preset, and slot, and reports each change by name', async () => {
    const pinAssetNames = new Set(Object.keys(pin.assets));
    const pinSlots = Object.values(pin.assets).reduce(
      (n, a) => n + Object.values(a.presets).reduce((m, p) => m + Object.keys(p).length, 0),
      0,
    );
    expect(pinAssetNames.size, 'the pin must cover the variant assets').toBeGreaterThan(300);
    expect(pinSlots, 'the pin must cover the preset slots').toBeGreaterThan(3000);
    const seen = new Set<string>();
    let compared = 0;
    const changes: string[] = [];
    const files = readdirSync(ASSETS)
      .filter((f) => f.endsWith('.ts'))
      .sort();
    for (const file of files) {
      const mod = (await import(pathToFileURL(path.join(ASSETS, file)).href)) as {
        default?: { name?: string; variants?: Record<string, unknown>; presets?: Record<string, unknown> };
      };
      const def = mod.default;
      if (!def?.variants || !def.presets) continue;
      const name = def.name ?? file.replace(/\.ts$/, '');
      const pinned = pin.assets[name];
      if (!pinned) {
        changes.push(`${name}: asset is not in the pin (regenerate with scripts/make-preset-pin.mjs)`);
        continue;
      }
      seen.add(name);
      const slots = slotTable(def.variants as Parameters<typeof slotTable>[0]);
      for (const [preset, choice] of Object.entries(def.presets as Record<string, Record<string, string>>)) {
        const pinPreset = pinned.presets[preset];
        if (!pinPreset) {
          changes.push(`${name}/${preset}: preset is not in the pin`);
          continue;
        }
        for (const slot of slots) {
          const option = choice[slot.name] ?? slot.default;
          const entry = pinPreset[slot.name];
          if (!entry) {
            changes.push(`${name}/${preset}/${slot.name}: slot is not in the pin`);
            continue;
          }
          const intended = INTENDED_CHANGES.some((c) => c.asset === name && c.preset === preset && c.slot === slot.name);
          const notes: string[] = [];
          if (entry.option !== option) notes.push(`option ${entry.option} -> ${option}`);
          const currentRatio = ratio(slot, option);
          for (let c = 0; c < 3; c++)
            if (Math.abs(currentRatio[c]! - entry.ratio[c]!) > 1 / 255)
              notes.push(`ratio[${'rgb'[c]}] ${entry.ratio[c]!.toFixed(3)} -> ${currentRatio[c]!.toFixed(3)}`);
          const defaultHex = recolourOne(slot, option, slot.options[slot.default]!);
          if (byteDiff(defaultHex, entry.default) > 1) notes.push(`default ${entry.default} -> ${defaultHex}`);
          const shadeHex = recolourOne(slot, option, darken(slot.options[slot.default]!));
          if (byteDiff(shadeHex, entry.shade) > 1) notes.push(`shade ${entry.shade} -> ${shadeHex}`);
          if (notes.length && !intended) changes.push(`${name}/${preset}/${slot.name}: ${notes.join('; ')}`);
          compared++;
        }
        for (const slot of Object.keys(pinPreset))
          if (!slots.some((s) => s.name === slot)) changes.push(`${name}/${preset}/${slot}: slot is gone from the asset`);
      }
    }
    for (const name of pinAssetNames) if (!seen.has(name)) changes.push(`${name}: pinned asset is gone from assets/`);
    expect(compared, 'every pinned preset slot must be compared').toBe(pinSlots);
    expect(changes, `preset pin changed:\n${changes.join('\n')}`).toEqual([]);
  }, 240_000);
});
