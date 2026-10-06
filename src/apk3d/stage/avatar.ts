/**
 * The student's avatar as a game body (docs/avatar-system.md, section 11; track
 * avatar_in_games_20261006). The host passes the launch avatar in the session options; the kit
 * loads its pack files and composes one avatar for each actor. A game that shows one hero calls
 * `playerBody`: it gets the avatar, or the fixed hero when there is no avatar or it does not load.
 */
import { avatarModelOf, composeAvatar, loadoutErrors, type AvatarModel, type AvatarPiece, type ComposedAvatar, type LoadedGltf } from '../avatar/compose.js';
import { AVATAR_PACK_VERSION } from '../avatar/pack.js';
import { AVATAR_CLIP_ALIASES, DEFAULT_HAIR, pieceDyes, type AvatarCatalog, type AvatarCatalogItem } from '../avatar/launch.js';
import type { APKDiagnosticInput, LaunchAvatar } from '../contracts/index.js';
import type { GLTF, ModelLoader } from './loader.js';

/** A body that composes a new copy of the student's avatar for each actor. */
export interface AvatarBody {
  readonly kind: 'avatar';
  readonly avatar: LaunchAvatar;
  /** The pack version the files came from (the launch version, or the current one when that is not served). */
  readonly version: string;
  /** Clip names of the base, as the actor knows them (with the hero names of `AVATAR_CLIP_ALIASES`). */
  readonly aliases: Readonly<Record<string, string>>;
  compose(): ComposedAvatar;
}

/** The body of a hero actor: a hero GLB, or the student's avatar. */
export type ActorBody = GLTF | AvatarBody;

export const isAvatarBody = (body: ActorBody): body is AvatarBody => (body as AvatarBody).kind === 'avatar';

const models = new WeakMap<GLTF, Promise<AvatarModel>>();

/** The avatar model of a loaded GLB, read once (its tint mask loads once). */
function modelOf(gltf: GLTF): Promise<AvatarModel> {
  let m = models.get(gltf);
  if (!m) {
    m = avatarModelOf(gltf as unknown as LoadedGltf);
    models.set(gltf, m);
  }
  return m;
}

/** The catalog of the launch version, or of the current version when the launch one is not served. */
async function catalogOf(loader: ModelLoader, version: string): Promise<{ catalog: AvatarCatalog; version: string }> {
  const read = async (v: string) => ({ catalog: (await loader.json(`${loader.avatarRoot}/${v}/catalog.json`)) as AvatarCatalog, version: v });
  try {
    return await read(version);
  } catch (error) {
    if (version === AVATAR_PACK_VERSION) throw error;
    return read(AVATAR_PACK_VERSION);
  }
}

/**
 * Loads the pack files of a launch avatar (the catalog, the base, every worn piece with its capped
 * and tucked forms) and checks that it composes. Throws when a file fails or the loadout is not
 * valid; `playerBody` turns that into the fixed hero.
 */
export async function loadAvatarBody(loader: ModelLoader, avatar: LaunchAvatar): Promise<AvatarBody> {
  const { catalog, version } = await catalogOf(loader, avatar.catalogVersion);
  const root = `${loader.avatarRoot}/${version}/`;
  const items = new Map(catalog.items.map((i) => [i.id, i]));
  const model = async (file: string) => modelOf(await loader.load(root + file));
  const pieceOf = async (id: string, dye: string | null): Promise<AvatarPiece> => {
    const item: AvatarCatalogItem | undefined = items.get(id);
    if (!item) throw new Error(`no piece '${id}' in avatar pack ${version}`);
    const [full, capped, tucked] = await Promise.all([model(item.files.model), item.files.capped ? model(item.files.capped) : null, item.files.tucked ? model(item.files.tucked) : null]);
    return { id, model: full, ...(capped ? { capped } : {}), ...(tucked ? { tucked } : {}), dyes: pieceDyes(item.dyes, dye) };
  };
  const [base, pieces, defaultHair] = await Promise.all([
    model(catalog.base.file),
    Promise.all(avatar.pieces.map((p) => pieceOf(p.itemId, p.dye))),
    pieceOf(DEFAULT_HAIR, null),
  ]);
  const errors = loadoutErrors(pieces);
  if (errors.length > 0) throw new Error(`avatar loadout: ${errors.join('; ')}`);
  const clips = new Set(base.animations.map((c) => c.name));
  const aliases = Object.fromEntries(Object.entries(AVATAR_CLIP_ALIASES).filter(([from, to]) => !clips.has(from) && clips.has(to)));
  const loadout = { tints: avatar.tints, pieces, defaultHair };
  // Compose once now, so a loadout the composer rejects falls back before the game starts.
  composeAvatar(base, loadout);
  return { kind: 'avatar', avatar, version, aliases, compose: () => composeAvatar(base, loadout) };
}

/**
 * The body of the player's hero: the student's avatar when the session has one and it loads, else
 * the fixed hero `hero` (loaded through the edition). A failed avatar sends a `warning` diagnostic;
 * the game never stops for it.
 */
export async function playerBody(
  loader: ModelLoader,
  avatar: LaunchAvatar | undefined,
  hero: string,
  diagnostic: (event: APKDiagnosticInput) => void,
): Promise<ActorBody> {
  if (avatar) {
    try {
      return await loadAvatarBody(loader, avatar);
    } catch (error) {
      diagnostic({
        level: 'warning',
        code: 'apk3d/avatar-fallback',
        message: `The avatar did not load; the game shows the ${hero}.`,
        details: { reason: error instanceof Error ? error.message : String(error), classId: avatar.classId, catalogVersion: avatar.catalogVersion },
      });
    }
  }
  return loader.load(loader.modelPath(hero));
}
