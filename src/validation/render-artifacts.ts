export interface RenderAcceptanceProfile {
  readonly directions: 1 | 4 | 8;
  readonly minimumFeaturePixels: number;
  readonly requiredFeaturePartIds: readonly string[];
}

interface FrameMetrics {
  readonly occupiedPixelCount?: unknown;
  readonly transparentPixelCount?: unknown;
  readonly clippedEdges?: unknown;
  readonly groundAnchorDeviationPixels?: unknown;
  readonly requiredFeatureEvidence?: unknown;
}

function record(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : undefined;
}

/** Returns every mechanical failure that must block a committed reference build. */
export function validateRenderArtifactAcceptance(
  input: unknown,
  profile: RenderAcceptanceProfile,
): readonly string[] {
  const result = record(input);
  if (!result || !Array.isArray(result['frames']))
    return ['render result must contain a frames array'];
  const frames = result['frames'];
  const issues: string[] = [];
  if (frames.length !== profile.directions)
    issues.push(
      `expected ${profile.directions} frames but received ${frames.length}`,
    );
  for (const [index, value] of frames.entries()) {
    const frame = record(value);
    const direction =
      typeof frame?.['direction'] === 'string'
        ? frame['direction']
        : `frame[${index}]`;
    const metrics = record(frame?.['metrics']) as FrameMetrics | undefined;
    if (!metrics) {
      issues.push(`${direction}: metrics are missing`);
      continue;
    }
    if (
      typeof metrics.occupiedPixelCount !== 'number' ||
      metrics.occupiedPixelCount <= 0
    )
      issues.push(`${direction}: frame is empty`);
    if (
      typeof metrics.transparentPixelCount !== 'number' ||
      metrics.transparentPixelCount <= 0
    )
      issues.push(`${direction}: frame has no transparent pixels`);
    if (!Array.isArray(metrics.clippedEdges) || metrics.clippedEdges.length > 0)
      issues.push(`${direction}: frame is clipped`);
    if (metrics.groundAnchorDeviationPixels !== 0)
      issues.push(`${direction}: ground anchor deviation must be zero`);
    if (!Array.isArray(metrics.requiredFeatureEvidence)) {
      issues.push(`${direction}: required feature evidence is missing`);
      continue;
    }
    const evidence = metrics.requiredFeatureEvidence.map(record);
    const seenPartIds = new Set<string>();
    for (const [evidenceIndex, feature] of evidence.entries()) {
      const partId = feature?.['partId'];
      if (typeof partId !== 'string') {
        issues.push(
          `${direction}: required feature evidence[${evidenceIndex}] is malformed`,
        );
        continue;
      }
      if (seenPartIds.has(partId))
        issues.push(
          `${direction}: required feature evidence duplicates ${partId}`,
        );
      seenPartIds.add(partId);
      if (!profile.requiredFeaturePartIds.includes(partId))
        issues.push(
          `${direction}: required feature evidence includes unexpected ${partId}`,
        );
    }
    for (const partId of profile.requiredFeaturePartIds) {
      const feature = evidence.find(
        (candidate) => candidate?.['partId'] === partId,
      );
      if (!feature) {
        issues.push(
          `${direction}: required feature evidence is missing ${partId}`,
        );
        continue;
      }
      if (
        typeof feature['silhouetteWidthPixels'] !== 'number' ||
        feature['silhouetteWidthPixels'] < profile.minimumFeaturePixels ||
        feature['passes'] !== true
      )
        issues.push(
          `${direction}: required feature ${partId} must be at least ${profile.minimumFeaturePixels}px`,
        );
    }
  }
  return issues;
}

export function assertRenderArtifactAcceptance(
  input: unknown,
  profile: RenderAcceptanceProfile,
  label: string,
): void {
  const issues = validateRenderArtifactAcceptance(input, profile);
  if (issues.length > 0)
    throw new Error(`${label} failed pixel acceptance: ${issues.join('; ')}`);
}
