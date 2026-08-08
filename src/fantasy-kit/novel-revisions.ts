import {
  NovelRequiredRoleChangeSchema,
  NovelRevisionStateSchema,
  type AssetDocument,
  type NovelRequiredRoleChange,
  type NovelRevisionState,
} from '../contracts/index.js';

import {
  NOVEL_ASSET_ARCHETYPES,
  inspectNovelAssetCompleteness,
} from './novel-identities.js';

const compareText = (left: string, right: string): number =>
  left < right ? -1 : left > right ? 1 : 0;

export function inspectNovelRevisionState(
  document: Readonly<AssetDocument>,
): NovelRevisionState {
  return NovelRevisionStateSchema.parse({
    origin: document.novelIdentity === undefined ? 'reference' : 'novel',
    completeness: inspectNovelAssetCompleteness(document) ?? null,
  });
}

function requiredCounts(
  document: Readonly<AssetDocument>,
): Map<string, number> {
  const archetype = NOVEL_ASSET_ARCHETYPES.find(
    ({ id }) => id === document.novelIdentity?.archetypeId,
  );
  return new Map(
    archetype?.requirements.map(({ role, requiredCount }) => [
      role,
      requiredCount,
    ]) ?? [],
  );
}

function presentCounts(state: NovelRevisionState): Map<string, number> {
  return new Map(
    state.completeness?.presentRoles.map(({ role, presentCount }) => [
      role,
      presentCount,
    ]) ?? [],
  );
}

export function compareNovelRevisionState(
  base: Readonly<AssetDocument>,
  target: Readonly<AssetDocument>,
): {
  readonly baseState: NovelRevisionState;
  readonly targetState: NovelRevisionState;
  readonly requiredRoleChanges: readonly NovelRequiredRoleChange[];
} {
  const baseState = inspectNovelRevisionState(base);
  const targetState = inspectNovelRevisionState(target);
  const baseRequired = requiredCounts(base);
  const targetRequired = requiredCounts(target);
  const basePresent = presentCounts(baseState);
  const targetPresent = presentCounts(targetState);
  const roles = [
    ...new Set([
      ...baseRequired.keys(),
      ...targetRequired.keys(),
      ...basePresent.keys(),
      ...targetPresent.keys(),
    ]),
  ].sort(compareText);
  const requiredRoleChanges = roles.flatMap((role) => {
    const baseRequiredCount = baseRequired.get(role) ?? 0;
    const targetRequiredCount = targetRequired.get(role) ?? 0;
    const basePresentCount = basePresent.get(role) ?? 0;
    const targetPresentCount = targetPresent.get(role) ?? 0;
    const baseSatisfied = basePresentCount >= baseRequiredCount;
    const targetSatisfied = targetPresentCount >= targetRequiredCount;
    if (
      baseRequiredCount === targetRequiredCount &&
      basePresentCount === targetPresentCount &&
      baseSatisfied === targetSatisfied
    )
      return [];
    return [
      NovelRequiredRoleChangeSchema.parse({
        role,
        baseRequiredCount,
        targetRequiredCount,
        basePresentCount,
        targetPresentCount,
        baseSatisfied,
        targetSatisfied,
      }),
    ];
  });
  return { baseState, targetState, requiredRoleChanges };
}
