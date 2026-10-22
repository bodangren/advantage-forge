/**
 * The alpha path of a cut-out render. WebGL gives a premultiplied RGBA buffer (the colors of
 * uncovered samples are 0). A cut-out PNG needs straight alpha: each output pixel averages the
 * supersampled block, its alpha is the mean coverage, and its color is the color of the covered
 * samples only (sum of premultiplied color / sum of alpha). No matte and no halo.
 */

/**
 * Resolve a premultiplied supersampled RGBA buffer to a straight-alpha RGBA buffer.
 * @param src premultiplied RGBA, `width * ss` by `height * ss`
 * @param flipY the source rows run bottom to top (WebGL readPixels)
 */
export function resolveStraight(
  src: ArrayLike<number>,
  width: number,
  height: number,
  ss: number,
  flipY = false,
): Uint8Array {
  const sw = width * ss;
  const out = new Uint8Array(width * height * 4);
  const n = ss * ss;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let j = 0; j < ss; j++) {
        const row = y * ss + j;
        const sy = flipY ? height * ss - 1 - row : row;
        for (let i = 0; i < ss; i++) {
          const o = (sy * sw + x * ss + i) * 4;
          r += src[o]!;
          g += src[o + 1]!;
          b += src[o + 2]!;
          a += src[o + 3]!;
        }
      }
      const d = (y * width + x) * 4;
      if (a <= 0) continue;
      const k = 255 / a;
      out[d] = Math.min(255, Math.round(r * k));
      out[d + 1] = Math.min(255, Math.round(g * k));
      out[d + 2] = Math.min(255, Math.round(b * k));
      out[d + 3] = Math.round(a / n);
    }
  }
  return out;
}
