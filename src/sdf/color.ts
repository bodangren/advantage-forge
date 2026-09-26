/** Linear-space RGB triple. Vertex colors in glTF are linear, so all blending happens here. */
export type Rgb = readonly [number, number, number];

/** Anything accepted where a color is expected: `'#rrggbb'`, `'#rgb'`, or a linear RGB triple. */
export type ColorInput = string | Rgb;

const srgbToLinear = (c: number): number => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

/** Convert a hex sRGB string (or pass through a linear triple) to linear RGB. */
export function rgb(input: ColorInput): Rgb {
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
