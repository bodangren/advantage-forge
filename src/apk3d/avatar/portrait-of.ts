/**
 * The student's portrait in a 2D view (docs/avatar-system.md, sections 9 and 11; track
 * avatar_in_games_20261006): the layers of the launch avatar from the pack, recolored and stacked
 * as the 3D composer colors the avatar, and a round face icon for the HUD. Browser only.
 */
import type { LaunchAvatar } from '../contracts/avatar.js';
import { DEFAULT_HAIR, fromServedVersion, pieceDyes, type AvatarCatalog } from './launch.js';
import { PORTRAIT_SIZE, portraitPixels, portraitPlan, recolorLayer, stackLayers, type PortraitItem } from './portrait.js';

/** The pack's `portraits.json`, the field a client reads. */
interface PortraitIndex {
  readonly layers: Readonly<Record<string, { readonly color: string; readonly mask: string }>>;
}

/** The URL folder of the avatar pack versions in the apps (a 2D view's default). */
export const APP_AVATAR_URL = '/packs/avatar';

/**
 * The face in a portrait as fractions of its size: the center and the side of a square. Measured
 * on the base layer of the 2026-10-04 portraits (head rows 174 to 305 of 512, centered at x 258).
 */
export const PORTRAIT_FACE = { cx: 0.505, cy: 0.47, side: 0.37 } as const;

async function json(url: string): Promise<unknown> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.json() as Promise<unknown>;
}

/**
 * The portrait of a launch avatar as RGBA pixels (PORTRAIT_SIZE square). `root` is the URL folder
 * of the pack versions (`/packs/avatar` in the apps). Throws when a file or a layer is missing.
 */
export async function avatarPortrait(root: string, avatar: LaunchAvatar): Promise<{ pixels: Uint8ClampedArray; version: string }> {
  const { value: catalog, version } = await fromServedVersion(avatar.catalogVersion, async (v) => (await json(`${root}/${v}/catalog.json`)) as AvatarCatalog);
  const dir = `${root}/${version}/`;
  const index = (await json(`${dir}portraits.json`)) as PortraitIndex;
  const items = new Map(catalog.items.map((i) => [i.id, i]));
  const itemOf = (id: string, dye: string | null): PortraitItem => {
    const item = items.get(id);
    if (!item?.equip) throw new Error(`no piece '${id}' in avatar pack ${version}`);
    return { id, slot: item.slot, hides: item.equip.hides, hair: item.equip.hair, table: item.dyes, dyes: pieceDyes(item.dyes, dye) };
  };
  const plan = portraitPlan({
    base: catalog.base.variants,
    tints: avatar.tints,
    pieces: avatar.pieces.map((p) => itemOf(p.itemId, p.dye)),
    defaultHair: itemOf(DEFAULT_HAIR, null),
  });
  const layers = await Promise.all(
    plan.map(async ({ layer, scales }) => {
      const files = index.layers[layer];
      if (!files) throw new Error(`no portrait layer '${layer}' in avatar pack ${version}`);
      const [color, mask] = await Promise.all([portraitPixels(dir + files.color), portraitPixels(dir + files.mask)]);
      return recolorLayer(color, mask, scales);
    }),
  );
  return { pixels: stackLayers(layers), version };
}

/** The face of a portrait in a circle, `size` pixels square, on a transparent canvas (a Phaser texture source). */
export function portraitIcon(pixels: Uint8ClampedArray, size = 96): HTMLCanvasElement {
  const full = document.createElement('canvas');
  full.width = full.height = PORTRAIT_SIZE;
  full.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(pixels), PORTRAIT_SIZE, PORTRAIT_SIZE), 0, 0);
  const side = PORTRAIT_FACE.side * PORTRAIT_SIZE;
  const icon = document.createElement('canvas');
  icon.width = icon.height = size;
  const g = icon.getContext('2d')!;
  g.beginPath();
  g.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  g.fillStyle = '#f3e4c3';
  g.fill();
  g.clip();
  g.drawImage(full, PORTRAIT_FACE.cx * PORTRAIT_SIZE - side / 2, PORTRAIT_FACE.cy * PORTRAIT_SIZE - side / 2, side, side, 0, 0, size, size);
  return icon;
}
