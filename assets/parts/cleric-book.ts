import { profile, sdf, type Part } from '../../src/index.js';

/**
 * Cleric holy book (part of `assets/cleric.ts`; standalone `assets/cleric-book.ts`).
 *
 * A big dark leather book with cream page edges, gold corner caps, a gold spine band, and two
 * gold cover bands, and a glowing gold cross on the front cover (`clericBookCross`, a second part
 * on its own bone, because a clip scales it up out of the book).
 * Class: hand-held (held like a shield). Local frame: the origin is the center of the closed book,
 * upright: 0.20 m wide (X, the spine toward -X), 0.26 m tall (Y), 0.078 m thick (Z, the front
 * cover toward +Z).
 * Bodies: book, book-gold (bone `hand.L`); holy-cross (bone `relic`), in the same local frame.
 * Tint slots: none.
 */

const C = {
  gold: '#e0b040',
  cover: '#4a3326',
  pages: '#efe4c6',
  holy: '#ffd45a',
};

export function clericBook(): Part {
  const coverShape = sdf.box([0.2, 0.26, 0.078], 0.012);
  const pagesCut = sdf.box([0.21, 0.24, 0.056]).at(0.012, 0, 0);
  const bookLocal = sdf
    .union(coverShape.subtract(pagesCut), sdf.box([0.192, 0.24, 0.056], 0.004).at(0.004, 0, 0).paint(C.pages))
    .paintFn((x, y, z, base) => (Math.abs(z) < 0.027 && x > 0.085 && Math.sin(y * 900) > 0.6 ? [base[0] * 0.85, base[1] * 0.85, base[2] * 0.85] : base));
  const corner = (sx: number, sy: number) =>
    sdf.box([0.036, 0.036, 0.082], 0.006).subtract(sdf.box([0.042, 0.042, 0.058]).at(-sx * 0.012, -sy * 0.012, 0)).at(sx * 0.09, sy * 0.12, 0);
  const bookGold = sdf.union(
    corner(1, 1),
    corner(1, -1),
    corner(-1, 1),
    corner(-1, -1),
    sdf.box([0.022, 0.25, 0.082], 0.006).at(-0.098, 0, 0), // spine band
    sdf.box([0.13, 0.016, 0.006], 0.003).at(0.02, 0.1, 0.04), // two cover bands
    sdf.box([0.13, 0.016, 0.006], 0.003).at(0.02, -0.1, 0.04),
  );
  return {
    name: 'cleric-book',
    bodies: [
      { name: 'book', shape: bookLocal, options: { color: C.cover, roughness: 0.7 }, bone: 'hand.L' },
      { name: 'book-gold', shape: bookGold, options: { color: C.gold, roughness: 0.3, metalness: 0.9 }, bone: 'hand.L' },
    ],
  };
}

/** The glowing cross on the front cover, in the book's local frame. */
export function clericBookCross(): Part {
  const crossP = (w: number, h: number, t: number) =>
    sdf.union(sdf.extrude(profile.rect([t, h], t * 0.3), 0.4), sdf.extrude(profile.rect([w, t], t * 0.3), 0.4).at(0, h * 0.18, 0));
  return {
    name: 'cleric-book-cross',
    bodies: [
      {
        name: 'holy-cross',
        shape: crossP(0.09, 0.14, 0.026).scale([1, 1, 0.024]).at(0.005, 0.0, 0.04),
        options: { color: C.gold, roughness: 0.3, metalness: 0.6, emissive: C.holy, emissiveIntensity: 0.45 },
        bone: 'relic',
      },
    ],
  };
}
