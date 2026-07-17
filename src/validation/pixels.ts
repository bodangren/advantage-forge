export interface PixelBounds {
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
  readonly width: number;
  readonly height: number;
}

export interface PixelMetrics {
  readonly occupiedBounds: PixelBounds | null;
  readonly occupiedPixelCount: number;
  readonly occupiedRatio: number;
  readonly transparentPixelCount: number;
  readonly clippedEdges: readonly ('top' | 'right' | 'bottom' | 'left')[];
  readonly groundPixelY: number | null;
  readonly groundAnchorDeviationPixels: number | null;
  readonly minimumHorizontalRunPixels: number | null;
  readonly minimumVerticalRunPixels: number | null;
}

export interface PixelAnalysisOptions {
  readonly alphaThreshold?: number;
  readonly expectedGroundPixelY?: number;
}

export class InvalidPixelBufferError extends RangeError {
  public constructor(message: string) {
    super(message);
    this.name = 'InvalidPixelBufferError';
  }
}

export function analyzeRgbaPixels(
  pixels: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number,
  options: PixelAnalysisOptions = {},
): PixelMetrics {
  assertDimensions(pixels, width, height);
  const alphaThreshold = options.alphaThreshold ?? 1;
  if (
    !Number.isInteger(alphaThreshold) ||
    alphaThreshold < 0 ||
    alphaThreshold > 255
  ) {
    throw new InvalidPixelBufferError(
      'alphaThreshold must be an integer from 0 to 255.',
    );
  }

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  let occupiedPixelCount = 0;
  const occupied = new Uint8Array(width * height);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const pixelIndex = y * width + x;
      const alpha = pixels[pixelIndex * 4 + 3] ?? 0;
      if (alpha < alphaThreshold) {
        continue;
      }
      occupied[pixelIndex] = 1;
      occupiedPixelCount += 1;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  const occupiedBounds = occupiedPixelCount
    ? {
        minX,
        minY,
        maxX,
        maxY,
        width: maxX - minX + 1,
        height: maxY - minY + 1,
      }
    : null;
  const clippedEdges: Array<'top' | 'right' | 'bottom' | 'left'> = [];
  if (occupiedBounds) {
    if (occupiedBounds.minY === 0) clippedEdges.push('top');
    if (occupiedBounds.maxX === width - 1) clippedEdges.push('right');
    if (occupiedBounds.maxY === height - 1) clippedEdges.push('bottom');
    if (occupiedBounds.minX === 0) clippedEdges.push('left');
  }

  const expectedGroundPixelY = options.expectedGroundPixelY;
  if (
    expectedGroundPixelY !== undefined &&
    (!Number.isInteger(expectedGroundPixelY) ||
      expectedGroundPixelY < 0 ||
      expectedGroundPixelY >= height)
  ) {
    throw new InvalidPixelBufferError(
      'expectedGroundPixelY must address a row inside the frame.',
    );
  }

  const groundPixelY = occupiedBounds?.maxY ?? null;
  return {
    occupiedBounds,
    occupiedPixelCount,
    occupiedRatio: occupiedPixelCount / (width * height),
    transparentPixelCount: width * height - occupiedPixelCount,
    clippedEdges,
    groundPixelY,
    groundAnchorDeviationPixels:
      groundPixelY === null || expectedGroundPixelY === undefined
        ? null
        : groundPixelY - expectedGroundPixelY,
    minimumHorizontalRunPixels: minimumRun(occupied, width, height, true),
    minimumVerticalRunPixels: minimumRun(occupied, width, height, false),
  };
}

function minimumRun(
  occupied: Uint8Array,
  width: number,
  height: number,
  horizontal: boolean,
): number | null {
  const outer = horizontal ? height : width;
  const inner = horizontal ? width : height;
  let minimum = Number.POSITIVE_INFINITY;
  for (let outerIndex = 0; outerIndex < outer; outerIndex += 1) {
    let run = 0;
    for (let innerIndex = 0; innerIndex <= inner; innerIndex += 1) {
      const x = horizontal ? innerIndex : outerIndex;
      const y = horizontal ? outerIndex : innerIndex;
      const set = innerIndex < inner && occupied[y * width + x] === 1;
      if (set) {
        run += 1;
      } else if (run > 0) {
        minimum = Math.min(minimum, run);
        run = 0;
      }
    }
  }
  return Number.isFinite(minimum) ? minimum : null;
}

function assertDimensions(
  pixels: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number,
): void {
  if (
    !Number.isInteger(width) ||
    width <= 0 ||
    !Number.isInteger(height) ||
    height <= 0
  ) {
    throw new InvalidPixelBufferError(
      'width and height must be positive integers.',
    );
  }
  const requiredLength = width * height * 4;
  if (pixels.length !== requiredLength) {
    throw new InvalidPixelBufferError(
      `RGBA buffer length must be ${requiredLength}; received ${pixels.length}.`,
    );
  }
}
