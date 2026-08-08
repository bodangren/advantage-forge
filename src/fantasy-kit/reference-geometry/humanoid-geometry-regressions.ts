import type { Bounds, SceneSummary, SceneSummaryPart } from '../../contracts/index.js';

export const HUMANOID_GEOMETRY_THRESHOLDS = Object.freeze({
  minimumHeadGroupHeightRatio: 0.42,
  maximumHeadGroupHeightRatio: 0.5,
  minimumSideToFrontWidthRatio: 0.6,
  maximumContactGap: 0.025,
  minimumContactOverlap: 0.01,
  minimumArmTunicExtension: 0.04,
} as const);

export interface HumanoidGeometryRegressionMetrics {
  readonly headGroupHeightRatio: number;
  readonly headGroupHeight: number;
  readonly totalHeight: number;
  readonly frontProjectedWidth: number;
  readonly sideProjectedWidth: number;
  readonly sideToFrontWidthRatio: number;
  readonly maximumOrnamentDomeGap: number;
  readonly maximumArmChainGap: number;
  readonly minimumArmChainOverlap: number;
  readonly minimumArmFrontProjectionOverlap: number;
  readonly minimumArmSideProjectionOverlap: number;
  readonly armTunicExtension: number;
  readonly maximumBootChainGap: number;
  readonly minimumBootChainOverlap: number;
  readonly minimumBootFrontProjectionOverlap: number;
  readonly minimumBootSideProjectionOverlap: number;
  readonly helmetStudCount: number;
}

export interface HumanoidGeometryRegressionResult {
  readonly valid: boolean;
  readonly metrics: HumanoidGeometryRegressionMetrics;
  readonly failures: readonly string[];
}

const unionBounds = (bounds: readonly Bounds[]): Bounds => ({
  min: [
    Math.min(...bounds.map(({ min }) => min[0])),
    Math.min(...bounds.map(({ min }) => min[1])),
    Math.min(...bounds.map(({ min }) => min[2])),
  ],
  max: [
    Math.max(...bounds.map(({ max }) => max[0])),
    Math.max(...bounds.map(({ max }) => max[1])),
    Math.max(...bounds.map(({ max }) => max[2])),
  ],
});

const gap = (left: Bounds, right: Bounds): number =>
  Math.hypot(
    ...([0, 1, 2] as const).map((axis) =>
      Math.max(
        0,
        left.min[axis] - right.max[axis],
        right.min[axis] - left.max[axis],
      ),
    ),
  );

const requiredPart = (
  parts: ReadonlyMap<string, SceneSummaryPart>,
  id: string,
): SceneSummaryPart | undefined => parts.get(id);

const maximumGap = (
  parts: ReadonlyMap<string, SceneSummaryPart>,
  pairs: readonly (readonly [string, string])[],
): number => {
  const values = pairs.map(([leftId, rightId]) => {
    const left = requiredPart(parts, leftId);
    const right = requiredPart(parts, rightId);
    return left === undefined || right === undefined
      ? Number.POSITIVE_INFINITY
      : gap(left.bounds, right.bounds);
  });
  return Math.max(...values);
};

const minimumOverlap = (
  parts: ReadonlyMap<string, SceneSummaryPart>,
  pairs: readonly (readonly [string, string])[],
  axes: readonly (0 | 1 | 2)[] = [0, 1, 2],
): number =>
  Math.min(
    ...pairs.map(([leftId, rightId]) => {
      const left = requiredPart(parts, leftId);
      const right = requiredPart(parts, rightId);
      if (left === undefined || right === undefined)
        return Number.NEGATIVE_INFINITY;
      return Math.min(
        ...axes.map(
          (axis) =>
            Math.min(left.bounds.max[axis], right.bounds.max[axis]) -
            Math.max(left.bounds.min[axis], right.bounds.min[axis]),
        ),
      );
    }),
  );

export function inspectHumanoidGeometryRegressions(
  scene: Readonly<SceneSummary>,
): HumanoidGeometryRegressionResult {
  const visible = scene.parts.filter(({ visible }) => visible);
  const parts = new Map(visible.map((part) => [part.id, part]));
  const headGroup = visible.filter(
    ({ id }) =>
      id === 'head' ||
      id.startsWith('hair.') ||
      id.startsWith('helmet.') ||
      id.startsWith('face.'),
  );
  const headBounds =
    headGroup.length === 0 ? undefined : unionBounds(headGroup.map(({ bounds }) => bounds));
  const totalHeight = scene.bounds.max[1] - scene.bounds.min[1];
  const frontWidth = scene.bounds.max[0] - scene.bounds.min[0];
  const sideWidth = scene.bounds.max[2] - scene.bounds.min[2];
  const tunic = parts.get('tunic');
  const armIds = [
    'upper-arm.left',
    'forearm.left',
    'hand.left',
    'upper-arm.right',
    'forearm.right',
    'hand.right',
  ] as const;
  const armParts = armIds
    .map((id) => parts.get(id))
    .filter((part): part is SceneSummaryPart => part !== undefined);
  const armBounds =
    armParts.length === 0 ? undefined : unionBounds(armParts.map(({ bounds }) => bounds));
  const helmetStudCount = visible.filter(({ id }) =>
    id.startsWith('helmet.stud.'),
  ).length;
  const armPairs = [
    ['sleeve.cuff.left', 'upper-arm.left'],
    ['upper-arm.left', 'forearm.left'],
    ['forearm.left', 'hand.left'],
    ['sleeve.cuff.right', 'upper-arm.right'],
    ['upper-arm.right', 'forearm.right'],
    ['forearm.right', 'hand.right'],
  ] as const;
  const bootPairs = [
    ['shin.left', 'boot.cuff.left'],
    ['boot.cuff.left', 'foot.left'],
    ['foot.left', 'boot.toe.left'],
    ['foot.left', 'boot.sole.left'],
    ['shin.right', 'boot.cuff.right'],
    ['boot.cuff.right', 'foot.right'],
    ['foot.right', 'boot.toe.right'],
    ['foot.right', 'boot.sole.right'],
  ] as const;
  const headGroupHeight =
    headBounds === undefined ? 0 : headBounds.max[1] - headBounds.min[1];
  const metrics: HumanoidGeometryRegressionMetrics = {
    headGroupHeight,
    totalHeight,
    frontProjectedWidth: frontWidth,
    sideProjectedWidth: sideWidth,
    headGroupHeightRatio:
      headBounds === undefined || totalHeight <= 0
        ? 0
        : headGroupHeight / totalHeight,
    sideToFrontWidthRatio: frontWidth <= 0 ? 0 : sideWidth / frontWidth,
    maximumOrnamentDomeGap: maximumGap(parts, [
      ['helmet.emblem', 'helmet.dome'],
      ['helmet.ridge', 'helmet.dome'],
      ['helmet.stud.left', 'helmet.dome'],
      ['helmet.stud.right', 'helmet.dome'],
    ]),
    maximumArmChainGap: maximumGap(parts, armPairs),
    minimumArmChainOverlap: minimumOverlap(parts, armPairs),
    minimumArmFrontProjectionOverlap: minimumOverlap(parts, armPairs, [0, 1]),
    minimumArmSideProjectionOverlap: minimumOverlap(parts, armPairs, [2, 1]),
    armTunicExtension:
      tunic === undefined || armBounds === undefined
        ? Number.NEGATIVE_INFINITY
        : Math.max(
            tunic.bounds.min[0] - armBounds.min[0],
            armBounds.max[0] - tunic.bounds.max[0],
          ),
    maximumBootChainGap: maximumGap(parts, bootPairs),
    minimumBootChainOverlap: minimumOverlap(parts, bootPairs),
    minimumBootFrontProjectionOverlap: minimumOverlap(parts, bootPairs, [0, 1]),
    minimumBootSideProjectionOverlap: minimumOverlap(parts, bootPairs, [2, 1]),
    helmetStudCount,
  };
  const t = HUMANOID_GEOMETRY_THRESHOLDS;
  const failures: string[] = [];
  if (
    metrics.headGroupHeightRatio < t.minimumHeadGroupHeightRatio ||
    metrics.headGroupHeightRatio > t.maximumHeadGroupHeightRatio
  )
    failures.push('head-group-height-ratio');
  if (metrics.sideToFrontWidthRatio < t.minimumSideToFrontWidthRatio)
    failures.push('side-to-front-width-ratio');
  if (metrics.maximumOrnamentDomeGap > t.maximumContactGap)
    failures.push('ornament-dome-contact');
  if (metrics.maximumArmChainGap > t.maximumContactGap)
    failures.push('arm-chain-contact');
  if (
    metrics.minimumArmChainOverlap < t.minimumContactOverlap ||
    metrics.minimumArmFrontProjectionOverlap < t.minimumContactOverlap ||
    metrics.minimumArmSideProjectionOverlap < t.minimumContactOverlap
  )
    failures.push('arm-chain-overlap');
  if (metrics.armTunicExtension < t.minimumArmTunicExtension)
    failures.push('arms-beyond-tunic');
  if (metrics.maximumBootChainGap > t.maximumContactGap)
    failures.push('boot-chain-contact');
  if (
    metrics.minimumBootChainOverlap < t.minimumContactOverlap ||
    metrics.minimumBootFrontProjectionOverlap < t.minimumContactOverlap ||
    metrics.minimumBootSideProjectionOverlap < t.minimumContactOverlap
  )
    failures.push('boot-chain-overlap');
  if (metrics.helmetStudCount !== 2) failures.push('helmet-stud-count');
  return { valid: failures.length === 0, metrics, failures };
}
