#!/usr/bin/env node
/**
 * Ground truth for the preset colour contract (docs/color-variants.md): a texel that equals a
 * slot's default colour must become the preset option when it is recoloured.
 *
 * Usage: node scripts/preset-colour-check.mjs <asset> [<asset> ...]
 *
 * For each asset this reads out/<asset>/textures/tint-mask.png, baseColor.png, and every
 * baseColor.<preset>.png, and the slot table from the GLB extras (forgeVariants). The slot table
 * is the same data the bake used; reading it from the GLB avoids a second copy of src/variants.ts
 * in a plain Node script.
 *
 * Per preset and slot it reports, over texels where that slot's mask channel is at least 0.98 and
 * no other channel is above 0.02:
 *   - the option hex (the contract target),
 *   - the mean preset hex and the mean default hex,
 *   - the anchor count: texels whose default texel is within 6/255 of the slot default per channel,
 *   - anchor error: the max per-channel error (0..255) of the preset texel against the option,
 *     over the anchor texels,
 *   - formula residual: the max per-channel error of the preset texel against the formula from
 *     src/variants.ts applied to the default texel (mask included), over every eligible texel.
 *     A residual near 0 means the drift comes from the stored texels (shading or soft mask), not
 *     from the recolour formula.
 *
 * Exit codes: 0 when no slot drifts, 1 when a slot drifts, 2 when an input is missing.
 *
 * Drift is above 8/255 for a slot when the anchor error is above 8/255. When the slot has fewer
 * than 16 anchor texels (the surface is shaded away from its default over the whole slot), the
 * mean preset colour against the option decides instead, with the same 8/255 limit.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LIMIT = 8;
const ANCHOR = 6;
const MASK_IN = 0.98;
const MASK_OUT = 0.02;

const toLinear = (b) => {
  const c = b / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};
const toByte = (c) => {
  const v = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(Math.max(0, c), 1 / 2.4) - 0.055;
  return Math.max(0, Math.min(255, Math.round(v * 255)));
};
const linearToBytes = (rgb) => rgb.map(toByte);
const hex = (rgb) => '#' + rgb.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const optionHex = (linear) => hex(linearToBytes(linear));

function glbJson(file) {
  const buf = readFileSync(file);
  if (buf.readUInt32LE(0) !== 0x46546c67) throw new Error(`${file}: not a GLB`);
  const length = buf.readUInt32LE(12);
  return JSON.parse(buf.subarray(20, 20 + length).toString('utf8'));
}

function slotTableFor(asset) {
  const glb = path.join(ROOT, 'out', asset, `${asset}.glb`);
  if (!existsSync(glb)) throw new Error(`missing ${path.relative(ROOT, glb)}`);
  const table = glbJson(glb).extras?.forgeVariants;
  if (!table?.slots) throw new Error(`${path.relative(ROOT, glb)} has no extras.forgeVariants slot table`);
  const slots = Object.entries(table.slots).map(([name, slot]) => ({
    name,
    channel: { R: 0, G: 1, B: 2, A: 3 }[slot.channel] ?? 0,
    default: slot.default,
    options: slot.options,
  }));
  return { slots, presets: table.presets ?? {} };
}

async function rawPng(file) {
  if (!existsSync(file)) throw new Error(`missing ${path.relative(ROOT, file)}`);
  const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height, channels: info.channels };
}

async function checkAsset(asset) {
  const texDir = path.join(ROOT, 'out', asset, 'textures');
  const maskPng = await rawPng(path.join(texDir, 'tint-mask.png'));
  const basePng = await rawPng(path.join(texDir, 'baseColor.png'));
  if (maskPng.channels !== 4) throw new Error(`${asset}: tint-mask.png has ${maskPng.channels} channels, expected 4`);
  if (basePng.channels !== 3) throw new Error(`${asset}: baseColor.png has ${basePng.channels} channels, expected 3`);
  const { slots, presets } = slotTableFor(asset);
  const n = maskPng.width * maskPng.height;
  if (maskPng.width * maskPng.height !== basePng.width * basePng.height) throw new Error(`${asset}: mask and base size differ`);
  const base = basePng.data;
  const mask = maskPng.data;

  const presetNames = Object.keys(presets);
  if (presetNames.length === 0) {
    console.log(`\n## ${asset}: no presets in the GLB; nothing to check`);
    return [];
  }
  const presetRaw = {};
  for (const name of presetNames) presetRaw[name] = await rawPng(path.join(texDir, `baseColor.${name}.png`));

  const failures = [];
  for (const preset of presetNames) {
    const raw = presetRaw[preset];
    if (raw.width * raw.height !== n) throw new Error(`${asset}: baseColor.${preset}.png size differs`);
    const choice = presets[preset] ?? {};
    const rows = [];
    for (const slot of slots) {
      const option = choice[slot.name] ?? slot.default;
      const def = slot.options[slot.default];
      const opt = slot.options[option];
      if (!def || !opt) throw new Error(`${asset}: slot ${slot.name} lacks option ${option}`);
      const defBytes = linearToBytes(def);
      const optBytes = linearToBytes(opt);
      const ratio = [0, 1, 2].map((c) => opt[c] / Math.max(def[c], 1e-4));

      let count = 0;
      let anchors = 0;
      const sumDefault = [0, 0, 0];
      const sumPreset = [0, 0, 0];
      let anchorError = 0;
      let residual = 0;
      for (let i = 0; i < n; i++) {
        let eligible = mask[i * 4 + slot.channel] >= Math.round(MASK_IN * 255);
        if (eligible)
          for (let c = 0; c < 4; c++)
            if (c !== slot.channel && mask[i * 4 + c] > MASK_OUT * 255) {
              eligible = false;
              break;
            }
        if (!eligible) continue;
        count++;
        const d = [base[i * 3], base[i * 3 + 1], base[i * 3 + 2]];
        const p = [raw.data[i * 3], raw.data[i * 3 + 1], raw.data[i * 3 + 2]];
        for (let c = 0; c < 3; c++) {
          sumDefault[c] += d[c];
          sumPreset[c] += p[c];
        }
        // The formula of src/variants.ts recolor: mix(1, option/default, mask) in linear light.
        const m = mask[i * 4 + slot.channel] / 255;
        for (let c = 0; c < 3; c++) {
          const expected = toByte(toLinear(d[c]) * Math.max(0, 1 + (ratio[c] - 1) * m));
          residual = Math.max(residual, Math.abs(expected - p[c]));
        }
        const isAnchor = [0, 1, 2].every((c) => Math.abs(d[c] - defBytes[c]) <= ANCHOR);
        if (isAnchor) {
          anchors++;
          for (let c = 0; c < 3; c++) anchorError = Math.max(anchorError, Math.abs(p[c] - optBytes[c]));
        }
      }
      if (count === 0) {
        rows.push({ slot: slot.name, option, count: 0, note: 'no fully masked texel (soft mask or no surface)' });
        continue;
      }
      const meanDefault = sumDefault.map((v) => v / count);
      const meanPreset = sumPreset.map((v) => v / count);
      const meanError = Math.max(...[0, 1, 2].map((c) => Math.abs(meanPreset[c] - optBytes[c])));
      const decided = anchors >= 16 ? anchorError : meanError;
      const basis = anchors >= 16 ? `anchor error ${anchorError}` : `no anchors (${anchors}); mean error ${meanError}`;
      const bad = decided > LIMIT;
      if (bad) failures.push(`${asset}/${preset}/${slot.name}`);
      rows.push({
        slot: slot.name,
        option,
        optionHex: hex(optBytes),
        meanDefault: hex(meanDefault),
        meanPreset: hex(meanPreset),
        count,
        anchors,
        anchorError,
        meanError,
        residual,
        basis,
        bad,
      });
    }
    console.log(`\n## ${asset} preset "${preset}" (${rows.length} slot${rows.length === 1 ? '' : 's'})`);
    console.log('slot       option   opt hex  mean default  mean preset  texels  anchors  anchor err  mean err  formula res  verdict');
    for (const r of rows) {
      if (r.note) {
        console.log(`${r.slot.padEnd(10)} ${r.option.padEnd(8)} ${''.padEnd(8)} ${''.padEnd(13)} ${''.padEnd(12)} ${String(r.count).padStart(6)}  ${r.note}`);
        continue;
      }
      console.log(
        `${r.slot.padEnd(10)} ${r.option.padEnd(8)} ${r.optionHex.padEnd(8)} ${r.meanDefault.padEnd(13)} ${r.meanPreset.padEnd(12)} ${String(r.count).padStart(6)}  ${String(r.anchors).padStart(7)}  ${String(r.anchorError).padStart(10)}  ${String(r.meanError).padStart(8)}  ${String(r.residual).padStart(11)}  ${r.bad ? 'DRIFT' : 'ok'} (${r.basis})`,
      );
    }
  }
  if (failures.length)
    console.log(`\n${asset}: ${failures.length} drifting slot(s) over ${LIMIT}/255: ${failures.join(', ')}`);
  else console.log(`\n${asset}: every preset slot lands on its option within ${LIMIT}/255`);
  return failures;
}

const assets = process.argv.slice(2);
if (assets.length === 0) {
  console.error('usage: node scripts/preset-colour-check.mjs <asset> [<asset> ...]');
  process.exit(2);
}
const all = [];
try {
  for (const asset of assets) all.push(...(await checkAsset(asset)));
} catch (error) {
  console.error(`preset-colour-check: ${error.message}`);
  process.exit(2);
}
if (all.length) {
  console.log(`\nDRIFT: ${all.join(', ')}`);
  process.exit(1);
}
console.log('\nresult ok: every checked preset slot lands on its option');
