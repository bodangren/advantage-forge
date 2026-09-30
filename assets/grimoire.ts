import { defineAsset, mixRgb, rgb, sdf } from '../src/index.js';

/**
 * Grimoire (equipment/magic-weapons/grimoire): a chunky chibi spell book, 0.5 m wide and 0.42 m
 * tall, standing on y = 0 facing +Z. Role: magic-weapon pickup/equipment icon, read at 128 px.
 * One idea: a thick open tome propped 35 degrees on a dark walnut lectern wedge, with a big raised
 * glowing green sigil on the right page. Shape language: square and sturdy, soft bevels.
 * Palette: walnut #4a2c18, red leather #7a1e22, pages #f2e3c2, runes #8a2a1a, iron #4f545a,
 * ribbon #b83030, sigil #5cf55c (the accent, emissive).
 * Bodies: lectern, cover, pages (page lines in bump), sigil (+ runes), iron, ribbon.
 * The book is built flat in a local frame, then tilted and set on the lectern.
 * No mockup.
 */

const TILT = 35;
const CENTER: [number, number, number] = [0, 0.25, 0];
const book = (s: ReturnType<typeof sdf.box>) => s.rotateX(TILT).at(...CENTER);
// A page frame: splay 8 degrees, then place at the page center (local y = 0.04).
const pageFrame = (side: number, s: ReturnType<typeof sdf.box>) => book(s.rotateZ(-side * 8).at(side * 0.115, 0.04, 0));

export default defineAsset({
  name: 'grimoire',
  description: 'A chunky open grimoire tilted on a walnut lectern: red leather, fat pages, iron corners, a glowing green sigil, and a ribbon.',
  detail: 0.004,
  texture: { size: 1024 },

  build(k) {
    // Lectern wedge: the top follows the underside of the book.
    const n = [0, Math.cos((TILT * Math.PI) / 180), Math.sin((TILT * Math.PI) / 180)];
    const off = n[1] * CENTER[1] + 0 - 0.016;
    k.body(
      'lectern',
      sdf
        .box([0.36, 0.34, 0.3], 0.02)
        .at(0, 0.17, 0)
        .intersect(sdf.halfSpace([0, n[1], n[2]], off))
        .paintFn((x, y, z) => mixRgb(rgb('#4a2c18'), rgb('#3a2010'), 0.5 + 0.5 * Math.sin(y * 300 + z * 20))),
      { color: '#4a2c18', roughness: 0.75, metalness: 0 },
    );

    k.body(
      'cover',
      book(
        sdf
          .box([0.46, 0.02, 0.32], 0.008)
          .smoothUnion(0.01, sdf.box([0.05, 0.03, 0.32], 0.01).at(0, -0.002, 0)),
      ),
      { color: '#7a1e22', roughness: 0.6, metalness: 0 },
    );

    const page = (s: number) => pageFrame(s, sdf.box([0.21, 0.06, 0.3], 0.012));
    k.body('pages', sdf.union(page(1), page(-1)), {
      color: '#f2e3c2',
      roughness: 0.85,
      metalness: 0,
      bump: (x, y, z) => 0.0012 * Math.max(0, Math.sin((y * 0.82 + z * 0.57) * 900)),
    });

    // Sigil on the right page (+X side) and runes on the left page.
    const on = (s: number, sh: ReturnType<typeof sdf.box>) => pageFrame(s, sh);
    const R = 0.05;
    const pt = (i: number): [number, number, number] => {
      const a = (i * 2 * Math.PI) / 5 + Math.PI / 2;
      return [Math.cos(a) * R, 0.031, Math.sin(a) * R];
    };
    const bars = [0, 1, 2, 3, 4].map((i) => sdf.capsule(pt(i), pt((i + 2) % 5), 0.007));
    const sig = on(1, sdf.union(sdf.torus(0.065, 0.012).at(0, 0.03, 0), ...bars));
    k.body('sigil', sig, {
      color: '#5cf55c',
      roughness: 0.3,
      metalness: 0,
      emissive: '#5cf55c',
      emissiveIntensity: 0.6,
      detail: 0.003,
    });
    const runes = [-0.09, -0.055, -0.02, 0.015, 0.05, 0.085].map((z, i) =>
      on(-1, sdf.box([0.06 - (i % 2) * 0.02, 0.008, 0.012], 0.003).at(-0.005 + (i % 2) * 0.01, 0.033, z * 1.4 - 0.01)),
    );
    k.body('runes', sdf.union(...runes), { color: '#8a2a1a', roughness: 0.6, metalness: 0, detail: 0.003 });

    const corners: ReturnType<typeof sdf.box>[] = [];
    for (const sx of [1, -1])
      for (const sz of [1, -1])
        corners.push(
          book(sdf.box([0.06, 0.028, 0.012], 0.003).at(sx * 0.2, 0, sz * 0.157)),
          book(sdf.box([0.012, 0.028, 0.06], 0.003).at(sx * 0.224, 0, sz * 0.13)),
        );
    k.body('iron', sdf.union(...corners), { color: '#4f545a', roughness: 0.5, metalness: 0.7 });

    k.body('ribbon', book(sdf.box([0.03, 0.006, 0.28], 0.002).at(0.185, 0.072, 0.05)), {
      color: '#b83030',
      roughness: 0.65,
      metalness: 0,
    });
  },
});
