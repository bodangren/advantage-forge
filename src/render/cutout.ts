/**
 * The alpha path of a cut-out render. WebGL gives a premultiplied RGBA buffer (the colors of
 * uncovered samples are 0). A cut-out PNG needs straight alpha: each output pixel averages the
 * supersampled block, its alpha is the mean coverage, and its color is the color of the covered
 * samples only (sum of premultiplied color / sum of alpha). No matte and no halo.
 */

/** Read a block of the supersampled render buffer (the signature of `gl.readPixels`). */
export type ReadStrip = (x: number, y: number, width: number, height: number, dst: Uint8Array) => void;

/**
 * Read the supersampled render buffer in horizontal strips and join them into one buffer.
 *
 * One read of the whole buffer can lose a row: on this machine a 3072 x 3072 read of a sun
 * cut-out returned the row at 1364 empty, while a short read of the same row returned its
 * pixels. The PNG then showed a 1 px row of alpha 170 of 255 across the model (2 of the 3
 * supersample rows). Strips of `stripRows` rows keep each read short.
 */
export function readStrips(width: number, height: number, read: ReadStrip, stripRows = 64): Uint8Array {
  const out = new Uint8Array(width * height * 4);
  const step = Math.max(1, Math.floor(stripRows));
  for (let y = 0; y < height; y += step) {
    const rows = Math.min(step, height - y);
    const strip = new Uint8Array(width * rows * 4);
    read(0, y, width, rows, strip);
    out.set(strip, y * width * 4);
  }
  return out;
}

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

/**
 * Bodies the song page moves (the singing face: the skin eyelids and the open mouth). A cut-out
 * hides them when the clip never poses their bones: the eyelid discs sit 3 cm inside the face
 * but reach past the head sides, so they poke through the hair in back views (turn-back,
 * turn-side). The song page renders through its own path, so it keeps them.
 */
export const SING_BODY_NAMES: readonly string[] = ['eyelid-skin', 'mouth-open'];

/** False when a cut-out with `hideSing` hides this body: it belongs to the singing face. */
export function singBodyVisible(bodyName: string, hideSing: boolean): boolean {
  return !hideSing || !SING_BODY_NAMES.includes(bodyName);
}
