import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note — round wooden shield (equipment/armor/round-shield).
 *
 * Role: hero gear for the chibi party (the dwarf cleric's style); seen as an icon, a pickup,
 *   and in a hand, so the face must read at 128 px.
 * Size: 0.6 m diameter, 0.08 m thick, standing on its rim on y = 0, face toward +Z.
 * One idea: a chunky honey-oak round shield whose face is all about the center — a bold
 *   blue painted ring around a big dark domed iron boss, hugged by a riveted iron rim.
 * Shape language: round dominant (disc, domed boss, rim torus); square secondary only in
 *   the straight plank seams and the leather grip bar on the back.
 * Palette: honey oak #b5814a (dominant), warm brown #8a5a35 + pale cut wood #c9a06a
 *   (plank tints and seams); iron #4a4f55 with shadow #363a3f and highlight #a8acb1;
 *   one accent: painted blue ring #2f6aa8; leather grip #7a4827.
 * Materials: wood (roughness 0.82), worn iron (roughness 0.5, metalness 0.7), leather
 *   (roughness 0.7). Grain and seams in `bump`; plank color in `paintFn`.
 * Detail: primary domed disc + rim band + boss; secondary blue ring, 8 rim rivets, grip
 *   bar + 2 iron rivet discs on the back; tertiary plank seams, grain. Focal point: boss
 *   and blue ring. Rig/animation: none (static item).
 */

const CY = 0.3; // disc center height = rim radius, so it stands on its rim
const R_DISC = 0.3;
const R_SPHERE = 0.5; // gentle 10 mm dome cap in the middle of the face
const Z_SPHERE = -0.45;
const THICK = 0.08;

const WOOD_HONEY = rgb('#b5814a');
const WOOD_BROWN = rgb('#8a5a35');
const WOOD_PALE = rgb('#c9a06a');
const WOOD_SEAM = rgb('#54331b');
const BLUE = '#2f6aa8';

const IRON = rgb('#4a4f55');
const IRON_DARK = rgb('#363a3f');
const IRON_HI = rgb('#a8acb1');

const PLANKS = 8;

export default defineAsset({
  name: 'round-shield',
  description:
    'Round honey-oak shield with radial planks, a riveted iron rim, a blue painted ring, and a domed iron boss; leather grip on the back.',
  detail: 0.005,
  reference: 'docs/item-mockups/round-shield-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ wooden disc
    // A slab intersected with a big offset sphere: flat rim-to-rim faces with a soft
    // 10 mm dome cap in the center where the boss sits.
    const slab = sdf.box([R_DISC * 2, R_DISC * 2, THICK], 0.004);
    const domeSphere = sdf.sphere(R_SPHERE).at(0, CY, Z_SPHERE);
    const disc = sdf.intersect(slab.at(0, CY, 0), domeSphere);

    const plankPaint = (x: number, y: number, z: number) => {
      const dx = x;
      const dy = y - CY;
      const r = Math.hypot(dx, dy);
      const a = Math.atan2(dy, dx);
      // 8 planks; the offset puts a seam straight up, as in the mock.
      const u = ((a + Math.PI) / (Math.PI * 2)) * PLANKS;
      const idx = Math.floor(u);
      const f = u - idx;
      const edge = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * f), 6);
      const tint = noise.random(idx, 5, 2);
      const grain =
        0.5 + 0.5 * noise.fbm(Math.cos(a) * r * 44, Math.sin(a) * r * 44, z * 6, 2);
      const patch = 0.5 + 0.5 * noise.fbm(x * 4, y * 4, z * 4, 2);
      let c = mixRgb(WOOD_HONEY, WOOD_PALE, 0.05 + 0.42 * tint);
      c = mixRgb(c, WOOD_BROWN, 0.26 * patch);
      c = mixRgb(c, WOOD_PALE, 0.12 * grain);
      // The rim band shadows the outer edge of the planks.
      c = mixRgb(c, WOOD_BROWN, 0.3 * Math.min(1, Math.max(0, (r - 0.22) / 0.09)));
      c = mixRgb(c, WOOD_SEAM, 0.85 * edge);
      return c;
    };
    const plankBump = (x: number, y: number, z: number) => {
      const dy = y - CY;
      const a = Math.atan2(dy, x);
      const r = Math.hypot(x, dy);
      const u = ((a + Math.PI) / (Math.PI * 2)) * PLANKS;
      const f = u - Math.floor(u);
      const edge = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * f), 6);
      return (
        -0.0026 * edge +
        0.0012 * noise.fbm(Math.cos(a) * r * 40, Math.sin(a) * r * 40, z * 8, 2)
      );
    };
    const blueRingStencil = sdf.torus(0.115, 0.048).rotateX(90).at(0, CY, 0.04);
    k.body(
      'wood',
      disc.paintFn(plankPaint).paintWhere(blueRingStencil, BLUE, 0.01),
      {
        color: '#b5814a',
        roughness: 0.82,
        metalness: 0,
        detail: 0.006,
        textureDensity: 2,
        paintWeight: 2,
        bump: plankBump,
        maxTriangles: 3400,
      },
    );

    // ------------------------------------------------------------------ iron: boss, rim, rivets
    const boss = sdf.sphere(0.082).scale([1, 1, 0.85]).at(0, CY, 0.045);
    const rim = sdf.torus(0.28, 0.02).rotateX(90).at(0, CY, 0);
    const rivets = [];
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2 + Math.PI / 8;
      rivets.push(
        sdf
          .sphere(0.0115)
          .at(Math.cos(ang) * 0.28, CY + Math.sin(ang) * 0.28, 0.024),
      );
    }
    // Two rivet discs on the back that pin the leather grip.
    for (const sx of [-1, 1]) {
      rivets.push(
        sdf.cylinder(0.016, 0.016, 0.004).rotateX(90).at(sx * 0.08, CY, -0.045),
      );
    }
    const ironPaint = (x: number, y: number, z: number) => {
      let c = mixRgb(IRON_DARK, IRON, Math.min(1, Math.max(0, (y - 0.05) / 0.45)));
      // Soft highlight across the top of the boss.
      const top = Math.min(1, Math.max(0, (y - 0.325) / 0.07));
      c = mixRgb(c, IRON_HI, 0.7 * top * top * (z > 0 ? 1 : 0));
      return c;
    };
    k.body('iron', sdf.union(boss, rim, ...rivets).paintFn(ironPaint), {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.005,
      maxTriangles: 1700,
    });

    // ------------------------------------------------------------------ leather grip (back)
    const gripBar = sdf.box([0.19, 0.05, 0.03], 0.013).at(0, CY, -0.064);
    k.body('grip', gripBar, {
      color: '#7a4827',
      roughness: 0.7,
      metalness: 0,
      detail: 0.005,
      maxTriangles: 500,
      bump: (x, y, z) => 0.0009 * noise.fbm(x * 70, y * 70, z * 70, 2),
    });
  },
});
