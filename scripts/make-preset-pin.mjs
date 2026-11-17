#!/usr/bin/env node
/**
 * Build tests/fixtures/preset-pin.json: the recolour contract of every asset that declares color
 * variants and presets, taken from the current src/variants.ts.
 *
 * Usage: ./node_modules/.bin/tsx scripts/make-preset-pin.mjs
 *
 * The pin holds, for each asset, preset, and slot:
 *   - option: the chosen option name,
 *   - ratio: option / default per channel from src/variants.ts ratio(),
 *   - default: the slot default recoloured to the option (hex, sRGB),
 *   - shade: the slot default darkened by 25 % (k.tint shade -0.25) recoloured to the option.
 * tests/preset-colour.test.ts recomputes the same table and fails when a value changes beyond
 * 1/255, unless the change is listed in its INTENDED_CHANGES allow-list.
 *
 * This is a pin, not a contract repair: it records what the code does today so a fix can show
 * exactly which assets, presets, and slots it moves.
 */
import { readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { ratio, recolor, slotTable } from '../src/variants.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ASSETS = path.join(ROOT, 'assets');
const OUT = path.join(ROOT, 'tests', 'fixtures', 'preset-pin.json');

const toByte = (c) => {
  const v = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(Math.max(0, c), 1 / 2.4) - 0.055;
  return Math.max(0, Math.min(255, Math.round(v * 255)));
};
export const hex = (rgb) => '#' + rgb.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
export const linearToBytes = (rgb) => rgb.map(toByte);
/** The sRGB bytes a slot default becomes after `recolor` with one option, mask fully on. */
export function recolourOne(slot, option, linear) {
  const mask = new Uint8Array(4);
  mask[slot.channel] = 255;
  const base = Uint8Array.from(linearToBytes(linear));
  const out = recolor(base, mask, [slot], { [slot.name]: option });
  return hex([out[0], out[1], out[2]]);
}
/** k.tint(slot, -0.25): mix the slot color toward black by 0.25, in linear light. */
export const darken = (linear, amount = 0.25) => linear.map((v) => v * (1 - amount));

/** Every top-level asset module that declares variants and presets, as a pin table. */
export async function buildPin() {
  const files = readdirSync(ASSETS).filter((f) => f.endsWith('.ts')).sort();
  const assets = {};
  for (const file of files) {
    const mod = await import(pathToFileURL(path.join(ASSETS, file)).href);
    const def = mod.default;
    if (!def?.variants && !def?.presets) continue;
    if (!def.variants || !def.presets) continue;
    const slots = slotTable(def.variants);
    const presets = {};
    for (const [preset, choice] of Object.entries(def.presets)) {
      const slotsOut = {};
      for (const slot of slots) {
        const option = choice[slot.name] ?? slot.default;
        const defColor = slot.options[slot.default];
        const r = ratio(slot, option);
        slotsOut[slot.name] = {
          option,
          ratio: r.map((v) => Math.round(v * 1e6) / 1e6),
          default: recolourOne(slot, option, defColor),
          shade: recolourOne(slot, option, darken(defColor)),
        };
      }
      presets[preset] = slotsOut;
    }
    assets[def.name ?? file.replace(/\.ts$/, '')] = { file, presets };
  }
  return { note: 'Pinned by scripts/make-preset-pin.mjs from src/variants.ts at the commit that added it. Do not edit by hand.', assets };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const pin = await buildPin();
  writeFileSync(OUT, JSON.stringify(pin, null, 2) + '\n');
  const assets = Object.keys(pin.assets);
  const presets = assets.reduce((n, a) => n + Object.keys(pin.assets[a].presets).length, 0);
  const slots = assets.reduce(
    (n, a) => n + Object.values(pin.assets[a].presets).reduce((m, p) => m + Object.keys(p).length, 0),
    0,
  );
  console.log(`wrote ${path.relative(ROOT, OUT)}: ${assets.length} assets, ${presets} presets, ${slots} preset slots`);
}
