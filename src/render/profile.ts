export const SPRITE_DIRECTIONS = [
  'N',
  'NE',
  'E',
  'SE',
  'S',
  'SW',
  'W',
  'NW',
] as const;

export type SpriteDirection = (typeof SPRITE_DIRECTIONS)[number];

export interface SpriteRenderProfile {
  readonly id: string;
  readonly widthPixels: number;
  readonly heightPixels: number;
  readonly elevationDegrees: number;
  readonly directions: 1 | 4 | 8;
  readonly paddingPixels: number;
  readonly transparent: true;
  readonly minimumFeaturePixels: number;
}

export const MVP_RENDER_PROFILE: SpriteRenderProfile = Object.freeze({
  id: 'fantasy.sprite.orthographic.v1',
  widthPixels: 128,
  heightPixels: 128,
  elevationDegrees: 30,
  directions: 8,
  paddingPixels: 6,
  transparent: true,
  minimumFeaturePixels: 3,
});

const DIRECTION_YAW_DEGREES: Readonly<Record<SpriteDirection, number>> =
  Object.freeze({
    N: 0,
    NE: 45,
    E: 90,
    SE: 135,
    S: 180,
    SW: 225,
    W: 270,
    NW: 315,
  });

export function directionsForCount(
  count: 1 | 4 | 8,
): readonly SpriteDirection[] {
  switch (count) {
    case 1:
      return ['S'];
    case 4:
      return ['N', 'E', 'S', 'W'];
    case 8:
      return SPRITE_DIRECTIONS;
  }
}

export function yawRadiansForDirection(direction: SpriteDirection): number {
  return (DIRECTION_YAW_DEGREES[direction] * Math.PI) / 180;
}

export function validateRenderProfile(
  profile: SpriteRenderProfile,
): readonly string[] {
  const issues: string[] = [];
  if (!profile.id.trim()) {
    issues.push('id must not be empty');
  }
  if (
    !Number.isInteger(profile.widthPixels) ||
    profile.widthPixels < 16 ||
    profile.widthPixels > 2048
  ) {
    issues.push('widthPixels must be an integer between 16 and 2048');
  }
  if (
    !Number.isInteger(profile.heightPixels) ||
    profile.heightPixels < 16 ||
    profile.heightPixels > 2048
  ) {
    issues.push('heightPixels must be an integer between 16 and 2048');
  }
  if (
    !Number.isFinite(profile.elevationDegrees) ||
    profile.elevationDegrees <= 0 ||
    profile.elevationDegrees >= 90
  ) {
    issues.push('elevationDegrees must be greater than 0 and less than 90');
  }
  if (![1, 4, 8].includes(profile.directions)) {
    issues.push('directions must be 1, 4, or 8');
  }
  if (
    !Number.isInteger(profile.paddingPixels) ||
    profile.paddingPixels < 0 ||
    profile.paddingPixels * 2 >=
      Math.min(profile.widthPixels, profile.heightPixels)
  ) {
    issues.push('paddingPixels must leave a positive drawable frame');
  }
  if (
    !Number.isInteger(profile.minimumFeaturePixels) ||
    profile.minimumFeaturePixels < 1
  ) {
    issues.push('minimumFeaturePixels must be a positive integer');
  }
  return issues;
}
