import { defineAsset, sdf } from '../src/index.js';

/**
 * Design note: wooden weapon rack, background tavern/barracks prop.
 * Size 1.6 w x 0.5 d x 1.5 h, on y=0, faces +Z. Idea: chunky A-frame ends holding a fan of weapons.
 * Palette: wood #8a5a30, steel #aab2bd, leather #5a3a20. Materials: wood, steel, leather.
 */
const STEEL = '#aab2bd';
const LEATHER = '#5a3a20';
const WOOD = '#8a5a30';

export default defineAsset({
  name: 'weapon-rack',
  description: 'Wooden weapon rack with two A-frame ends, notched rails, swords, spears, a shield and an axe.',
  detail: 0.006,
  texture: { size: 1024 },
  build(k) {
    // A-frame end post: two slanted legs plus a cross brace and top cap, at x = +-0.72
    const end = (sx: number) => {
      const legF = sdf.capsule([0, 0.04, 0.2], [0, 1.4, 0.03], 0.045);
      const legB = sdf.capsule([0, 0.04, -0.2], [0, 1.4, -0.03], 0.045);
      const brace = sdf.box([0.08, 0.07, 0.34], 0.015).at(0, 0.3, 0);
      const cap = sdf.box([0.1, 0.09, 0.16], 0.02).at(0, 1.43, 0);
      const foot = sdf.box([0.1, 0.05, 0.5], 0.02).at(0, 0.025, 0);
      return sdf.smoothUnion(0.015, legF, legB, brace, cap, foot).at(sx, 0, 0);
    };
    let frame = sdf.union(end(0.72), end(-0.72));
    const rail = (y: number, z: number) => {
      let r = sdf.box([1.48, 0.07, 0.07], 0.015).at(0, y, z);
      for (let i = 0; i < 7; i++) r = r.subtract(sdf.box([0.045, 0.03, 0.1]).at(-0.6 + i * 0.2, y + 0.035, z));
      return r;
    };
    frame = sdf.union(frame, rail(0.75, 0.13), rail(1.1, 0.09));
    k.body('wood', frame, { color: WOOD, roughness: 0.82 });

    const tilt = (s: ReturnType<typeof sdf.box>, x: number) => s.rotateZ(0).at(x, 0, 0.05);
    void tilt;
    const steel: ReturnType<typeof sdf.box>[] = [];
    const leather: ReturnType<typeof sdf.box>[] = [];
    // swords: blade, guard, grip, pommel; hilt up, blade through lower rail
    [-0.5, -0.3, -0.1].forEach((x) => {
      const z = 0.14;
      const blade = sdf.box([0.07, 0.55, 0.025], 0.008).at(x, 1.08, z);
      const tipC = sdf.cone([x, 1.34, z], [x, 1.42, z], 0.035, 0.0);
      const guard = sdf.box([0.2, 0.04, 0.045], 0.012).at(x, 0.8, z);
      const grip = sdf.cylinder(0.022, 0.16).at(x, 0.68, z);
      const pom = sdf.sphere(0.035).at(x, 0.58, z);
      steel.push(blade as never, tipC as never, guard as never, pom as never);
      leather.push(grip as never);
    });
    // spears: long shaft + leaf tip
    [0.25, 0.5].forEach((x, i) => {
      const shaft = sdf.cylinder(0.02, 1.4).at(x, 0.7, 0.12 - i * 0.03);
      const tip = sdf.cone([x, 1.42, 0.12 - i * 0.03], [x, 1.62, 0.12 - i * 0.03], 0.04, 0.0);
      leather.push(shaft as never);
      steel.push(tip as never);
    });
    k.body('steel', sdf.union(...(steel as never[])), { color: STEEL, roughness: 0.35, metalness: 0.85 });
    k.body('leather', sdf.union(...(leather as never[])), { color: LEATHER, roughness: 0.8 });

    // round shield leaned on the base, front
    const shield = sdf.smoothUnion(0.01,
      sdf.cylinder(0.26, 0.05, 0.015).rotateX(90),
      sdf.sphere(0.07).at(0, 0, 0.03)).rotateX(-15).at(-0.42, 0.28, 0.1);
    k.body('shield', shield, { color: '#a8452f', roughness: 0.6 });
    k.body('shield-rim', sdf.torus(0.26, 0.022).rotateX(75).at(-0.42, 0.28, 0.1), { color: STEEL, roughness: 0.4, metalness: 0.8 });

    // small axe hung on the left end post
    const axeHandle = sdf.cylinder(0.022, 0.55).at(0.77, 0.9, 0.1);
    const axeHead = sdf.box([0.04, 0.3, 0.16], 0.015).at(0.77, 1.05, 0.19);
    k.body('axe-handle', axeHandle, { color: LEATHER, roughness: 0.8 });
    k.body('axe-head', axeHead, { color: STEEL, roughness: 0.35, metalness: 0.85 });
  },
});
