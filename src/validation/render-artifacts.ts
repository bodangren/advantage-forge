export interface RenderAcceptanceProfile {
  readonly directions: 1 | 4 | 8;
  readonly minimumFeaturePixels: number;
  readonly requiredFeaturePartIds: readonly string[];
  readonly directionOrder?: readonly string[];
  readonly requiredAccessoryFeatures?: readonly {
    readonly id: string;
    readonly partId: string;
    readonly templateId: string;
    readonly intendedDirections: readonly string[];
    readonly minimumPixelArea: number;
    readonly minimumWidthPixels: number;
    readonly maximumOcclusionRatio: number;
    readonly minimumOklabDistance: number;
  }[];
  readonly framing?: {
    readonly minimumTopMarginPixels: number;
    readonly maximumCenterDeviationPixels: number;
    readonly maximumHeightDeviationPixels: number;
  };
}

interface FrameMetrics {
  readonly occupiedPixelCount?: unknown;
  readonly transparentPixelCount?: unknown;
  readonly clippedEdges?: unknown;
  readonly groundAnchorDeviationPixels?: unknown;
  readonly requiredFeatureEvidence?: unknown;
  readonly framingEvidence?: unknown;
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
  if (profile.directionOrder !== undefined) {
    const received = frames.map((value, index) => {
      const frame = record(value);
      return typeof frame?.['direction'] === 'string'
        ? frame['direction']
        : `frame[${index}]`;
    });
    if (
      received.length !== profile.directionOrder.length ||
      received.some(
        (direction, index) => direction !== profile.directionOrder?.[index],
      )
    )
      issues.push(
        `frame directions must be exactly ${profile.directionOrder.join(', ')}; received ${received.join(', ')}`,
      );
  }
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
    if (profile.requiredAccessoryFeatures !== undefined) {
      for (const required of profile.requiredAccessoryFeatures) {
        if (!required.intendedDirections.includes(direction)) continue;
        const samePart = evidence.filter(
          (candidate) => candidate?.['partId'] === required.partId,
        );
        const feature = samePart.find(
          (candidate) =>
            candidate?.['featureId'] === required.id &&
            candidate['templateId'] === required.templateId,
        );
        if (feature === undefined && samePart.length > 0)
          issues.push(
            `${direction}: required feature ${required.id} must identify template ${required.templateId}`,
          );
        if (feature === undefined) {
          issues.push(
            `${direction}: required feature ${required.id} evidence is missing`,
          );
          continue;
        }
        if (
          typeof feature['visiblePixelArea'] !== 'number' ||
          feature['visiblePixelArea'] < required.minimumPixelArea
        )
          issues.push(
            `${direction}: required feature ${required.id} visible area must be at least ${required.minimumPixelArea}px`,
          );
        if (
          typeof feature['silhouetteWidthPixels'] !== 'number' ||
          feature['silhouetteWidthPixels'] < required.minimumWidthPixels
        )
          issues.push(
            `${direction}: required feature ${required.id} must be at least ${required.minimumWidthPixels}px wide`,
          );
        if (
          typeof feature['occlusionRatio'] !== 'number' ||
          feature['occlusionRatio'] > required.maximumOcclusionRatio
        )
          issues.push(
            `${direction}: required feature ${required.id} occlusion ratio must be at most ${required.maximumOcclusionRatio}`,
          );
        if (
          typeof feature['materialOklabDistance'] !== 'number' ||
          feature['materialOklabDistance'] < required.minimumOklabDistance
        )
          issues.push(
            `${direction}: required feature ${required.id} OKLab distance must be at least ${required.minimumOklabDistance}`,
          );
      }
      if (profile.framing !== undefined) {
        const framing = record(metrics.framingEvidence);
        if (
          typeof framing?.['topMarginPixels'] !== 'number' ||
          framing['topMarginPixels'] < profile.framing.minimumTopMarginPixels
        )
          issues.push(
            `${direction}: top margin must be at least ${profile.framing.minimumTopMarginPixels}px`,
          );
        if (
          typeof framing?.['centerDeviationPixels'] !== 'number' ||
          framing['centerDeviationPixels'] >
            profile.framing.maximumCenterDeviationPixels
        )
          issues.push(
            `${direction}: center deviation must be at most ${profile.framing.maximumCenterDeviationPixels}px`,
          );
        if (
          typeof framing?.['heightDeviationPixels'] !== 'number' ||
          framing['heightDeviationPixels'] >
            profile.framing.maximumHeightDeviationPixels
        )
          issues.push(
            `${direction}: height deviation must be at most ${profile.framing.maximumHeightDeviationPixels}px`,
          );
      }
      continue;
    }
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
