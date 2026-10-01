import { noise, sdf, type Part, type PartTint } from '../../src/index.js';

/**
 * Warlock grimoire and its flame (parts of `assets/warlock.ts`; standalone `assets/warlock-book.ts`).
 *
 * A dark leather book with a pale page block, a carved brown emblem on the cover, and gold corner
 * caps and a gold clasp, and a green flame (`warlockBookFlame`, a second part on bone `orb`).
 * Local frame of `warlockBook`: the origin is the center of the closed book, upright: 0.10 m wide
 * (X), 0.13 m tall (Y), 0.04 m thick (Z, the cover toward +Z). The host turns it with `bookPose`.
 * Local frame of `warlockBookFlame`: the origin is the flame base, upright (the host keeps it upright).
 * Bodies: book, book-emblem, book-gold (bone `hand.L`); flame (bone `orb`).
 * Tint slots: flame (the flame colors).
 */

const C = {
  gold: '#c9a24a',
  cover: '#3a2a22',
  emblem: '#5a4a3a',
  page: '#b8a888',
  flame: '#40ff80',
  flameBase: '#106030',
};

const hard = (s: sdf.Shape) => s.mirror('x', 0);

/** A curling flame at the origin: a tall center tongue and three side tongues that curl out and up. */
const flame = () =>
  sdf.smoothUnion(
    0.02,
    sdf.chain(
      [
        [0, 0, 0, 0.034],
        [0.006, 0.05, 0, 0.022],
        [0.024, 0.1, 0, 0.009],
        [0.05, 0.135, 0, 0.003],
      ],
      0.02,
    ),
    sdf.chain(
      [
        [-0.034, 0.0, 0, 0.02],
        [-0.06, 0.03, 0.004, 0.012],
        [-0.072, 0.07, 0.006, 0.006],
        [-0.062, 0.1, 0.006, 0.0035],
      ],
      0.012,
    ),
    sdf.chain(
      [
        [0.036, 0.0, 0, 0.02],
        [0.062, 0.028, 0, 0.012],
        [0.078, 0.062, 0.004, 0.006],
        [0.092, 0.09, 0.004, 0.0035],
      ],
      0.012,
    ),
    sdf.chain(
      [
        [0.0, 0.004, 0.022, 0.02],
        [0.006, 0.036, 0.046, 0.012],
        [-0.014, 0.072, 0.056, 0.006],
        [-0.03, 0.1, 0.05, 0.0035],
      ],
      0.012,
    ),
  );

export function warlockBook(): Part {
    const cover = sdf.box([0.1, 0.13, 0.04], 0.005);
    const bookShape = cover.paintWhere(sdf.box([0.1, 0.16, 0.028]).at(0.01, 0, 0), C.page);
    const emblem = sdf
      .smoothUnion(
        0.004,
        sdf.ellipsoid([0.026, 0.034, 0.008]).at(0, -0.006, 0.02),
        sdf.chain(
          [
            [0, 0.03, 0.02, 0.006],
            [0, 0.02, 0.022, 0.008],
          ],
          0.004,
        ),
      )
      .subtract(hard(sdf.ellipsoid([0.006, 0.004, 0.01]).at(0.011, 0.002, 0.03)))
      .subtract(sdf.box([0.024, 0.005, 0.02]).at(0, -0.02, 0.03));
    const corners = sdf.union(sdf.box([0.032, 0.032, 0.06]).at(0.05, 0.065, 0), sdf.box([0.032, 0.032, 0.06]).at(0.05, -0.065, 0)).mirror('x', 0);
    const bookGold = sdf.union(cover.round(0.0025).intersect(corners), sdf.box([0.024, 0.018, 0.048], 0.003).at(0.05, 0, 0));
  return {
    name: 'warlock-book',
    bodies: [
      { name: 'book', shape: bookShape, options: { color: C.cover, roughness: 0.65, detail: 0.003 }, bone: 'hand.L' },
      { name: 'book-emblem', shape: emblem, options: { color: C.emblem, roughness: 0.6, detail: 0.003 }, bone: 'hand.L' },
      { name: 'book-gold', shape: bookGold, options: { color: C.gold, roughness: 0.35, metalness: 0.8, detail: 0.003 }, bone: 'hand.L' },
    ],
  };
}

/** The flame above the book, upright, origin at its base. The host places it with `.at(...FLAME_AT)`. */
export function warlockBookFlame(tint: PartTint): Part {
  const T = { flame: tint('flame'), flameBase: tint('flame', { color: C.flameBase, follow: 1 }) };
  const flameShape = flame()
    .rotateZ(-10)
    .displace(0.008, (x, y, z) => noise.fbm(x * 12, y * 12, z * 12, 2));
  return {
    name: 'warlock-book-flame',
    bodies: [
      {
        name: 'flame',
        shape: flameShape,
        options: { color: T.flameBase, emissive: T.flame, emissiveIntensity: 1.6, opacity: 0.8, roughness: 0.4, detail: 0.0035 },
        bone: 'orb',
      },
    ],
  };
}
