import { sdf } from '../../src/index.js';
import type { AssetContext } from '../../src/index.js';
import type { HorseShape } from './horse-kind.js';

/**
 * Tack for the horse kinds (`assets/parts/horse-kind.ts`): a riding saddle on a cloth blanket and
 * a pack saddle with loads. Every piece fits over the horse's trunk (a grown shell of it, cut by a
 * box), so it skins with the chest and the rump like the coat.
 */

type V3 = readonly [number, number, number];

export interface SaddleOptions {
  /** The blanket cloth color (usually a slot tint). */
  readonly blanket: string;
  /** The trim along the blanket edge. */
  readonly trim: string;
  /** Saddle leather. */
  readonly leather: string;
  /** The metal of the stirrups and the buckles. */
  readonly metal: string;
  /** Blanket depth down the sides (default 0.16 m below the back). */
  readonly drop?: number;
  /** Stirrups (default true). */
  readonly stirrups?: boolean;
  /** A breast strap round the front of the chest (default true). */
  readonly breast?: boolean;
}

/** The middle of the saddle seat on the back of the horse kind. */
export const SADDLE_AT: V3 = [0, 0.69, -0.09];

export function saddle(k: AssetContext, horse: HorseShape, o: SaddleOptions): void {
  const trunk = horse.trunk;
  const drop = o.drop ?? 0.16;
  const [, sy, sz] = SADDLE_AT;
  // The blanket: a shell over the back, its corners rounded, with a trim along the edge.
  const cut = (w: V3, at: V3, r: number) => sdf.box([w[0], w[1], w[2]], r).at(at[0], at[1], at[2]);
  const blanketBox: V3 = [0.6, drop + 0.2, 0.36];
  const blanketAt: V3 = [0, sy + 0.1 - (drop + 0.2) / 2, sz];
  const blanket = trunk.round(0.012).smoothIntersect(0.01, cut(blanketBox, blanketAt, 0.05));
  const inner = cut([0.6, drop + 0.2 - 0.06, 0.36 - 0.06], [0, blanketAt[1] + 0.03, sz], 0.04);
  k.body('blanket', blanket.paintWhere(sdf.box([0.8, 1, 1]).at(0, sy, sz).subtract(inner), o.trim, 0.004), {
    color: o.blanket,
    roughness: 0.85,
    detail: 0.005,
  });
  // The seat with a raised pommel in front and a curled cantle behind, and a leather flap on each
  // side over the blanket.
  const seat = trunk.round(0.032).smoothIntersect(0.012, cut([0.32, 0.14, 0.3], [0, sy + 0.03, sz], 0.035));
  const pommel = sdf.ellipsoid([0.07, 0.055, 0.045]).at(0, sy + 0.045, sz + 0.145).bone('spine');
  const cantle = sdf.capsule([-0.09, sy + 0.055, sz - 0.135], [0.09, sy + 0.055, sz - 0.135], 0.034).bone('hips');
  const flaps = trunk.round(0.022).smoothIntersect(0.008, cut([0.6, 0.17, 0.18], [0, sy - 0.13, sz + 0.02], 0.035));
  k.body('saddle', sdf.smoothUnion(0.02, seat, pommel, cantle).union(flaps), { color: o.leather, roughness: 0.5, detail: 0.004 });
  // The girth under the belly, and the stirrups hanging from the seat.
  const girth = trunk.round(0.008).intersect(cut([0.6, 0.6, 0.05], [0, 0.42, sz + 0.06], 0.01));
  // The breast strap: a band round the front of the chest, lower in front, from flap to flap.
  const breast = trunk
    .round(0.008)
    .subtract(trunk.round(-0.01))
    .intersect(sdf.box([0.6, 0.032, 0.5], 0.008).rotateX(18).at(0, 0.5, 0.12))
    .intersect(sdf.box([0.6, 0.6, 0.3]).at(0, 0.5, 0.2));
  k.body('girth', o.breast === false ? girth : girth.union(breast), { color: o.leather, roughness: 0.55, detail: 0.004 });
  if (o.stirrups !== false) {
    const side = sdf.raycast(trunk, [1, sy - 0.14, sz + 0.02], [-1, 0, 0])!;
    const x = side[0] + 0.03;
    const strap = sdf.box([0.012, 0.16, 0.026], 0.004).at(x, sy - 0.22, sz + 0.02);
    const iron = sdf.torus(0.03, 0.007).rotateZ(90).at(x, sy - 0.32, sz + 0.02).union(sdf.box([0.016, 0.01, 0.05], 0.004).at(x, sy - 0.355, sz + 0.02));
    k.body('stirrup-straps', strap.mirror('x'), { color: o.leather, roughness: 0.55, detail: 0.004, bone: 'spine' });
    k.body('stirrups', iron.mirror('x'), { color: o.metal, roughness: 0.35, metalness: 0.8, detail: 0.003, bone: 'spine' });
  }
}

export interface PackOptions {
  /** The pad cloth under the frame (usually a slot tint). */
  readonly pad: string;
  /** The wooden frame. */
  readonly wood: string;
  /** The wicker baskets. */
  readonly wicker: string;
  /** The rolled blanket on top. */
  readonly roll: string;
  /** Straps. */
  readonly leather: string;
}

/** A pack saddle: a cloth pad, a wooden cross-buck frame, a wicker basket on each side, and a blanket roll on top. */
export function packSaddle(k: AssetContext, horse: HorseShape, o: PackOptions): void {
  const trunk = horse.trunk;
  const [, sy, sz] = SADDLE_AT;
  const pad = trunk.round(0.012).smoothIntersect(0.01, sdf.box([0.6, 0.3, 0.32], 0.05).at(0, sy - 0.04, sz));
  k.body('pad', pad, { color: o.pad, roughness: 0.85, detail: 0.005 });
  // The frame: two crossed bars in front and behind, joined by a rail along the top.
  const cross = (z: number) =>
    sdf.union(
      sdf.capsule([-0.1, sy - 0.03, z], [0.05, sy + 0.1, z], 0.016),
      sdf.capsule([0.1, sy - 0.03, z], [-0.05, sy + 0.1, z], 0.016),
    );
  const frame = sdf.union(cross(sz + 0.11), cross(sz - 0.11), sdf.capsule([0, sy + 0.065, sz - 0.14], [0, sy + 0.065, sz + 0.14], 0.014));
  k.body('pack-frame', frame, { color: o.wood, roughness: 0.7, detail: 0.004, bone: 'spine' });
  // The baskets hang on each side from the frame: woven bands and a leather strap round the middle.
  const side = sdf.raycast(trunk, [1, sy - 0.13, sz], [-1, 0, 0])!;
  const bx = side[0] + 0.065;
  const basket = sdf.box([0.11, 0.17, 0.22], 0.025).at(bx, sy - 0.14, sz);
  const woven = basket.paintFn((x, y, z, c) => {
    const row = Math.floor((y - sy) / 0.022);
    const col = Math.floor(z / 0.03);
    const dark = (row + col) % 2 === 0 ? 0.82 : 1;
    return [c[0] * dark, c[1] * dark, c[2] * dark];
  });
  const rim = sdf.box([0.125, 0.022, 0.235], 0.01).at(bx, sy - 0.06, sz);
  k.body('baskets', sdf.union(woven, rim).mirror('x'), { color: o.wicker, roughness: 0.8, detail: 0.004, bone: 'spine' });
  const band = basket.round(0.004).intersect(sdf.box([0.4, 0.024, 0.4]).at(bx, sy - 0.15, sz));
  // The roll: a blanket rolled along the back, tied with two straps.
  const roll = sdf.cylinder(0.05, 0.3, 0.02).rotateZ(90).at(0, sy + 0.13, sz);
  const ties = roll.round(0.004).intersect(sdf.union(sdf.box([0.024, 0.2, 0.2]).at(0.08, sy + 0.13, sz), sdf.box([0.024, 0.2, 0.2]).at(-0.08, sy + 0.13, sz)));
  k.body('pack-roll', roll, { color: o.roll, roughness: 0.85, detail: 0.004, bone: 'spine' });
  k.body('pack-straps', sdf.union(band.mirror('x'), ties), { color: o.leather, roughness: 0.6, detail: 0.004, bone: 'spine' });
}
