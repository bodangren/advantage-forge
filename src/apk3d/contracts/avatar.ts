/**
 * The launch avatar: the student's avatar as a game receives it (docs/avatar-system.md, section 11).
 * The host passes it in the session options; a game never fetches it.
 */
import { z } from 'zod';

// ---------------------------------------------------------------------------------------------
// Source: packages/game-contracts/src/avatar.ts (primary-parity-integration 0dac27db2), the parts
// that `launchAvatarSchema` uses. The monorepo owns the shape: send a change there first.
// ---------------------------------------------------------------------------------------------

/** The 15 hero classes a student can pick: the Forge starter sets. */
export const avatarClassIdSchema = z.enum([
  'knight',
  'wizard',
  'cleric',
  'rogue',
  'ranger',
  'bard',
  'witch',
  'druid',
  'shaman',
  'duelist',
  'swashbuckler',
  'treasure-hunter',
  'explorer',
  'gladiator',
  'shield-maiden',
]);

/** The color options of the avatar base, one enum per color slot. */
export const avatarSkinSchema = z.enum(['fair', 'light', 'tan', 'brown', 'deep']);
export const avatarHairSchema = z.enum(['brown', 'black', 'blond', 'auburn', 'silver', 'teal']);
export const avatarEyesSchema = z.enum(['brown', 'blue', 'green', 'hazel', 'violet']);
export const avatarClothSchema = z.enum(['sky', 'linen', 'moss', 'rose', 'slate']);

/** The student's color choice: an option per color slot of the avatar base. */
export const avatarTintsSchema = z
  .object({
    skin: avatarSkinSchema,
    hair: avatarHairSchema,
    eyes: avatarEyesSchema,
    cloth: avatarClothSchema,
  })
  .strict();

/** The pack version a profile was saved against (`packs/avatar/<version>/`). */
export const avatarCatalogVersionSchema = z.string().regex(/^\d+\.\d+\.\d+$/);

/** A dye preset name of a piece (the Forge color presets). */
export const avatarDyeSchema = z.string().min(1).max(40);

/** The worn piece of one slot. */
export const avatarLoadoutPieceSchema = z.object({ itemId: z.string().min(1), dye: avatarDyeSchema.nullable() }).strict();

/** The avatar a game receives in its launch context (FR-7); the host passes it, a game never fetches it. */
export const launchAvatarSchema = z
  .object({
    catalogVersion: avatarCatalogVersionSchema,
    classId: avatarClassIdSchema,
    tints: avatarTintsSchema,
    pieces: z.array(avatarLoadoutPieceSchema),
  })
  .strict();

export type AvatarClassId = z.infer<typeof avatarClassIdSchema>;
export type AvatarTints = z.infer<typeof avatarTintsSchema>;
export type AvatarLoadoutPiece = z.infer<typeof avatarLoadoutPieceSchema>;
export type LaunchAvatar = z.infer<typeof launchAvatarSchema>;

// ---------------------------------------------------------------------------------------------
// Forge additions (not in game-contracts).
// ---------------------------------------------------------------------------------------------

/**
 * The launch avatar, or the reason it is not valid. A game keeps its fixed hero for an invalid
 * avatar (and reports the reason as a warning); it never stops for it.
 */
export function readLaunchAvatar(value: unknown): { avatar: LaunchAvatar } | { error: string } {
  const result = launchAvatarSchema.safeParse(value);
  if (result.success) return { avatar: result.data };
  return { error: result.error.issues.map((i) => `${i.path.join('.') || 'avatar'}: ${i.message}`).join('; ') };
}
