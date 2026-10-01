import { sdf, type Part } from '../../src/index.js';

/**
 * Mage spellbook (part of `assets/mage.ts`; standalone `assets/mage-spellbook.ts`).
 *
 * A small leather-bound book: pages on the three open edges, gold corner caps and a gold clasp
 * on the fore-edge.
 * Class: hand-held (on the open palm). Local frame: the origin is the center of the closed book,
 * standing upright: 0.10 m wide (X, the fore-edge toward +X, the spine toward -X), 0.13 m tall
 * (Y), 0.04 m thick (Z, the front cover toward +Z).
 * Bodies: book, book-gold (bone `hand.L`).
 * Tint slots: none.
 */

const C = {
  gold: '#dcae4a',
  cover: '#6e2c24',
  page: '#eee2c4',
};

export function mageSpellbook(): Part {
  const cover = sdf.box([0.1, 0.13, 0.04], 0.005);
  const book = cover.paintWhere(sdf.box([0.1, 0.16, 0.028]).at(0.01, 0, 0), C.page);
  const corners = sdf.union(sdf.box([0.032, 0.032, 0.06]).at(0.05, 0.065, 0), sdf.box([0.032, 0.032, 0.06]).at(0.05, -0.065, 0)).mirror('x', 0);
  const bookGold = sdf.union(cover.round(0.0025).intersect(corners), sdf.box([0.024, 0.018, 0.048], 0.003).at(0.05, 0, 0));
  return {
    name: 'mage-spellbook',
    bodies: [
      { name: 'book', shape: book, options: { color: C.cover, roughness: 0.65, detail: 0.003 }, bone: 'hand.L' },
      { name: 'book-gold', shape: bookGold, options: { color: C.gold, roughness: 0.32, metalness: 0.9, detail: 0.003 }, bone: 'hand.L' },
    ],
  };
}
