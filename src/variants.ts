import { rgb, type ColorInput, type Rgb } from './sdf/color.js';

/**
 * Color slots for individual characters: slot name to { option: color }; the first option is the
 * default. At most four slots (one per channel of the tint mask: R, G, B, A in order).
 */
export type VariantSlots = Readonly<Record<string, Readonly<Record<string, ColorInput>>>>;
/** Named combinations of slot options, baked as preset textures and sprite sets. */
export type VariantPresets = Readonly<Record<string, Readonly<Record<string, string>>>>;

export interface Slot {
  readonly name: string;
  /** The tint mask channel: 0 R, 1 G, 2 B, 3 A. */
  readonly channel: number;
  readonly default: string;
  /** Linear colors of the options (the default among them). */
  readonly options: Readonly<Record<string, Rgb>>;
}

/**
 * The slot table of an asset. The base texture keeps the default colors; the tint mask marks
 * where each slot is; a game recolors a slot by multiplying the masked texels by
 * option / default (per channel), which is 1 for the default option.
 */
export function slotTable(variants: VariantSlots | undefined): Slot[] {
  const entries = Object.entries(variants ?? {});
  if (entries.length > 4) throw new Error(`At most 4 color slots (the tint mask has 4 channels); found ${entries.length}.`);
  return entries.map(([name, options], channel) => {
    const colors = Object.entries(options).map(([k, v]) => [k, rgb(v)] as const);
    if (colors.length === 0) throw new Error(`Color slot '${name}' has no options.`);
    return { name, channel, default: colors[0]![0], options: Object.fromEntries(colors) };
  });
}

/** Check that presets name known slots and options. */
export function checkPresets(slots: readonly Slot[], presets: VariantPresets | undefined): void {
  for (const [preset, choice] of Object.entries(presets ?? {}))
    for (const [slot, option] of Object.entries(choice)) {
      const s = slots.find((x) => x.name === slot);
      if (!s) throw new Error(`Preset '${preset}' names unknown slot '${slot}'. Slots: ${slots.map((x) => x.name).join(', ')}.`);
      if (!(option in s.options))
        throw new Error(`Preset '${preset}' names unknown ${slot} option '${option}'. Options: ${Object.keys(s.options).join(', ')}.`);
    }
}

/** The per-channel multiplier that turns a slot's default color into `option`. */
export function ratio(slot: Slot, option: string): Rgb {
  const d = slot.options[slot.default]!;
  const o = slot.options[option]!;
  return [o[0] / Math.max(d[0], 1e-4), o[1] / Math.max(d[1], 1e-4), o[2] / Math.max(d[2], 1e-4)];
}

const toLinear = (b: number): number => {
  const c = b / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};
const toByte = (c: number): number => {
  const v = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(Math.max(0, c), 1 / 2.4) - 0.055;
  return Math.max(0, Math.min(255, Math.round(v * 255)));
};

/**
 * Recolor a base color atlas (sRGB bytes, 3 per texel) with a preset, in linear light, as a game
 * shader would: each texel is multiplied by 1 + sum over slots of mask * (option / default - 1).
 * For a texel in one slot this is mix(1, ratio, mask). A soft edge between two slots (a dome that
 * blends the body into a highlight) gets the blend of the two ratios; a product of the per-slot
 * factors kept a large share of the old color there (a grey top on a recolored slime).
 */
export function recolor(
  base: Uint8Array,
  mask: Uint8Array,
  slots: readonly Slot[],
  choice: Readonly<Record<string, string>>,
): Uint8Array {
  const out = new Uint8Array(base.length);
  const ratios = slots.map((s) => ratio(s, choice[s.name] ?? s.default));
  const n = base.length / 3;
  for (let i = 0; i < n; i++) {
    let fr = 1;
    let fg = 1;
    let fb = 1;
    slots.forEach((s, k) => {
      const m = mask[i * 4 + s.channel]! / 255;
      if (m === 0) return;
      const q = ratios[k]!;
      fr += (q[0] - 1) * m;
      fg += (q[1] - 1) * m;
      fb += (q[2] - 1) * m;
    });
    out[i * 3] = toByte(toLinear(base[i * 3]!) * Math.max(0, fr));
    out[i * 3 + 1] = toByte(toLinear(base[i * 3 + 1]!) * Math.max(0, fg));
    out[i * 3 + 2] = toByte(toLinear(base[i * 3 + 2]!) * Math.max(0, fb));
  }
  return out;
}
