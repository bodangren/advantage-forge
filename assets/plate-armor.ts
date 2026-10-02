import { defineAsset, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note - steel breastplate with gold piping (equipment/armor/plate-armor).
 * Role: equipment item icon / display piece; must read at 128 px.
 * Size: 0.6 m tall, 0.6 m wide, hem on y = 0, front toward +Z, no body.
 * One idea: matte grey steel chunky plate wearing fat gold piping and diamond bosses.
 * Shape language: round dominant, diamond accents secondary.
 * Palette: steel #8d9096 / #a8acb1 / #5f6369, gold #d4a93a (accent), belt #5c3a22.
 * Materials: steel, gold, leather belt. Focal point: gold diamond boss on the chest.
 * Fit rework 2026-10-02: arm cuffs are taller and wider (r 0.1, h 0.22, y 0.5) so upper arms stay inside; neck hole 0.135.
 */
// The faulds hang 5.2 cm below the torso hem (the chest socket, y = 0 in the model frame); LIFT
// stands the display on y = 0, and the origin moves with it so the worn fit does not change.
const LIFT = 0.052;
const STEEL = rgb('#8d9096');
const GOLD = rgb('#d4a93a');

export default defineAsset({
  name: 'plate-armor',
  description: 'Chibi steel breastplate with gold piping, pauldrons, cuffs, and faulds.',
  detail: 0.005,
  reference: 'bench/overnight/refs/p1-gear/plate-armor-mock.jpg',
  texture: { size: 1024 },
  equip: { slot: 'chest', fitScale: 2, origin: [0, LIFT, 0], hides: ['undershirt'] },

  build(k) {
    const Z = 0.78;
    // Torso contract v2 (shell 0.56 x 0.64 x 0.44): chest plate above y 0.24, faulds below.
    const chestRev = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.636],
            [0.14, 0.636],
            [0.21, 0.576],
            [0.25, 0.496],
            [0.26, 0.376],
            [0.248, 0.276],
            [0.26, 0.196],
            [0.276, 0.096],
            [0.28, 0.026],
            [0.264, 0],
            [0, 0],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .round(0.004)
      .scale([1, 1, Z]);
    const neckHole = sdf.cylinder(0.135, 0.2).scale([1, 1, Z]).at(0, 0.72, 0);
    const ridge = sdf.cone([0, 0.5, 0.197], [0, 0.36, 0.197], 0.016, 0.008);
    const faulds = chestRev.smoothUnion(0.008, ridge).subtract(neckHole);
    const chest = faulds;

    // Belt band with rivets.
    const belt = sdf.cylinder(0.262, 0.05, 0.015).scale([1, 1, Z]).at(0, 0.24, 0);
    const beltRivets = sdf.union(
      ...[-0.15, -0.07, 0.07, 0.15].map((x) =>
        sdf.sphere(0.014).at(x, 0.24, Z * Math.sqrt(0.262 * 0.262 - x * x) + 0.004),
      ),
    );

    // Pauldrons: tilted shells that hug the shoulder.
    const torsoBig = chestRev.scale(0.98);
    const tf = (sh: ReturnType<typeof sdf.sphere>, s: number) => sh.rotateZ(-28 * s).at(0.29 * s, 0.57, 0);
    const dome = sdf
      .ellipsoid([0.18, 0.125, 0.165])
      .intersect(sdf.box([0.5, 0.18, 0.5]).at(0, 0.05, 0))
      .round(0.006);
    const pauldron = (s: number) => tf(dome, s).subtract(torsoBig);
    const cuff = (s: number) => sdf.cylinder(0.1, 0.22, 0.02).at(0.31 * s, 0.5, 0);

    // Front bosses are gold; steel body gets everything else.
    const steel = sdf.union(chest, faulds, belt, beltRivets, pauldron(1), pauldron(-1), cuff(1), cuff(-1));
    const groove = (y: number, w: number) => Math.exp(-(((y - 0) / w) ** 2));
    k.body('steel', steel.at(0, LIFT, 0), {
      color: STEEL,
      roughness: 0.45,
      metalness: 0.75,
      detail: 0.006,
      maxTriangles: 5000,
      bump: (_x, y) => (y < 0.21 ? -0.003 * (groove(y - 0.14, 0.008) + groove(y - 0.07, 0.008)) : 0),
    });

    // Gold.
    const diamond = (sz: number) => sdf.box([sz, sz, sz * 0.5], sz * 0.2).rotateZ(45);
    const neck = sdf.torus(0.135, 0.03).scale([1, 1, Z]).at(0, 0.635, 0);
    const boss = diamond(0.1).at(0, 0.385, Z * 0.26 + 0.004);
    const rivets = sdf.union(
      sdf.sphere(0.028).scale([1, 0.85, 0.6]).at(0.12, 0.31, 0.172),
      sdf.sphere(0.028).scale([1, 0.85, 0.6]).at(-0.12, 0.31, 0.172),
    );
    const rim = (s: number) => tf(sdf.torus(0.165, 0.025).scale([1, 1, 0.95]).at(0, -0.04, 0), s).subtract(chestRev.scale(0.97));
    const rivetTop = (s: number) => tf(sdf.sphere(0.028).at(0, 0.125, 0.02), s);
    const cuffRing = (s: number) => sdf.torus(0.092, 0.02).at(0.31 * s, 0.4, 0);
    const hem = sdf.torus(0.272, 0.017).scale([1, 1, Z]).at(0, 0.02, 0);
    const fauldDia = diamond(0.075).at(0, 0.105, Z * 0.274 + 0.002);
    const gold = sdf.union(neck, boss, rivets, rim(1), rim(-1), rivetTop(1), rivetTop(-1), cuffRing(1), cuffRing(-1), hem, fauldDia);
    k.body('gold', gold.at(0, LIFT, 0), { color: GOLD, roughness: 0.3, metalness: 1, detail: 0.004, maxTriangles: 1700 });
  },
});
