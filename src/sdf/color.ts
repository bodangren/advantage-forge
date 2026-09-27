/** Linear-space RGB triple. Vertex colors in glTF are linear, so all blending happens here. */
export type Rgb = readonly [number, number, number];

/** Anything accepted where a color is expected: `'#rrggbb'`, `'#rgb'`, or a linear RGB triple. */
export type ColorInput = string | Rgb;

const srgbToLinear = (c: number): number => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

// ---------------------------------------------------------------- color slots (variants)
//
// An asset names its recolorable colors (eyes, hair, skin, clothing) as slots and uses
// `k.tint(slot, shade)` in place of a hex color. Normally a slot reference is the slot's default
// color; while the engine bakes a slot's mask, colors of that slot are white and every other
// color is black, so the bake records where (and how much of) the surface belongs to the slot.

const TINT = /^tint:([^:]+):(-?[0-9.]+)$/;
const FOLLOW = /^tint:([^:]+):follow:([0-9.]+):(#?[0-9a-fA-F]{3,6})$/;
let slotColors = new Map<string, Rgb>();
let maskSlot: string | null = null;

/** A color reference to a slot, darkened (shade < 0) or lightened (shade > 0) by |shade|. */
export function tintRef(slot: string, shade = 0): string {
  return `tint:${slot}:${Math.max(-1, Math.min(1, shade))}`;
}

/**
 * A fixed color that partly follows a slot: exactly `color` in the default look, but `follow`
 * (0 to 1) of the slot's recoloring applies to it (a blush or lips that should darken with a
 * darker skin, but stay pink).
 */
export function followRef(slot: string, color: string, follow: number): string {
  return `tint:${slot}:follow:${Math.max(0, Math.min(1, follow))}:${color}`;
}

/** The slots' default colors, used while an asset builds. */
export function setSlotColors(colors: ReadonlyMap<string, Rgb>): void {
  slotColors = new Map(colors);
}

/** While set, rgb() gives white for this slot's colors and black for every other color. */
export function setMaskSlot(slot: string | null): void {
  maskSlot = slot;
}


/** Convert a hex sRGB string (or pass through a linear triple) to linear RGB. */
export function rgb(input: ColorInput): Rgb {
  if (typeof input === 'string') {
    const f = FOLLOW.exec(input);
    if (f) {
      if (maskSlot !== null) {
        const v = f[1] === maskSlot ? Number(f[2]) : 0;
        return [v, v, v];
      }
      return rgb(f[3]!);
    }
    const m = TINT.exec(input);
    if (m) {
      const slot = m[1]!;
      if (maskSlot !== null) return slot === maskSlot ? [1, 1, 1] : [0, 0, 0];
      const base = slotColors.get(slot);
      if (!base) throw new Error(`Unknown color slot '${slot}'. Add it to the asset's variants.`);
      const shade = Number(m[2]);
      return shade >= 0 ? mixRgb(base, [1, 1, 1], shade) : mixRgb(base, [0, 0, 0], -shade);
    }
  }
  if (maskSlot !== null) return [0, 0, 0];
  if (typeof input !== 'string') return input;
  let hex = input.trim().replace(/^#/, '');
  if (hex.length === 3)
    hex = hex
      .split('')
      .map((ch) => ch + ch)
      .join('');
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) throw new Error(`Invalid color '${input}'. Use '#rrggbb'.`);
  const n = parseInt(hex, 16);
  return [
    srgbToLinear(((n >> 16) & 255) / 255),
    srgbToLinear(((n >> 8) & 255) / 255),
    srgbToLinear((n & 255) / 255),
  ];
}

export function mixRgb(a: Rgb, b: Rgb, t: number): Rgb {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}
