import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note — heavy iron chain prop, two readings in one (dungeon/prop/chains).
 *
 * Role: dungeon set-dressing prop; must read at 128 px sprite (chunky links).
 * Size: ~1.0 m wide, ~0.97 m tall; wall stub at back (z < 0), stands on y = 0, faces +Z.
 * One idea: thick forged links in two states — a coiled pile on the floor and
 *   one short length hanging from a stub wall hook.
 * Shape language: round dominant (chunky torus links, rounded stone), square
 *   secondary (blocky wall stub + capstone give the sturdy dungeon read).
 * Palette: dark worn iron #3d4047 (dominant) with rust brown #8a5a35 patches;
 *   dungeon stone mid #4a5d75, shadow #2a3547, worn pale top #7a8ba0.
 *   Value plan: dark iron mass against mid stone, pale capstone on top.
 * Materials: iron (roughness 0.55, metalness 0.8); stone (roughness 0.9).
 *   No emissive (no light source on this prop). Bump only for surface texture.
 * Detail: primary wall stub + capstone + hook; secondary pile links (8) +
 *   hanging links (5); tertiary rust/stone variation in paint + bump.
 * Rig/animation: none (static prop).
 */

const IRON = rgb('#3d4047');
const IRON_DARK = rgb('#23262c');
const RUST = rgb('#8a5a35');
const RUST_DARK = rgb('#5a3a26');
const STONE_MID = rgb('#4a5d75');
const STONE_DARK = rgb('#2a3547');
const STONE_PALE = rgb('#7a8ba0');

// Pile link ring, hanging link ring: chunky tube so holes survive meshing.
const PILE_R = 0.052;
const PILE_TUBE = 0.017;
const HANG_R = 0.042;
const HANG_TUBE = 0.015;

export default defineAsset({
  name: 'chains',
  description:
    'Heavy iron chain prop: a coiled pile of chunky rusted links on the ground and a short length hanging from a hook on a small dungeon wall stub.',
  detail: 0.006,
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------ ironwork
    // Coiled pile: bottom ring of flat links + smaller tilted top layer.
    const pileCx = -0.18;
    const pileCz = 0.14;
    const pileLinks = [];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.35;
      const px = pileCx + Math.cos(a) * 0.115;
      const pz = pileCz + Math.sin(a) * 0.1;
      const yaw = (a * 180) / Math.PI + 18 + (i % 2) * 24;
      const tilt = i % 2 === 0 ? 6 : -8;
      pileLinks.push(
        sdf
          .torus(PILE_R, PILE_TUBE)
          .rotateX(tilt)
          .rotateY(yaw)
          .at(px, 0.028, pz),
      );
    }
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + 1.1;
      const px = pileCx + Math.cos(a) * 0.055;
      const pz = pileCz + Math.sin(a) * 0.05;
      const yaw = (a * 180) / Math.PI + 40 * i;
      const tilt = 18 + 10 * i;
      pileLinks.push(
        sdf
          .torus(PILE_R, PILE_TUBE)
          .rotateX(tilt)
          .rotateY(yaw)
          .at(px, 0.088, pz),
      );
    }
    // One link draped over the pile edge, leaning outward.
    pileLinks.push(
      sdf
        .torus(PILE_R, PILE_TUBE)
        .rotateX(58)
        .rotateY(30)
        .at(pileCx + 0.16, 0.075, pileCz + 0.06),
    );

    // Hanging length: 4 links alternating planes, top link through the hook.
    // The hook sits on the wall's front face; the strand hangs free of it.
    const hangX = 0.26;
    const hangZ = 0.05;
    const topY = 0.44;
    const pitch = 0.078;
    const hangLinks = [];
    for (let i = 0; i < 4; i++) {
      const link =
        i % 2 === 0
          ? sdf.torus(HANG_R, HANG_TUBE).rotateX(90) // ring faces +Z
          : sdf.torus(HANG_R, HANG_TUBE).rotateZ(90); // ring faces +X
      hangLinks.push(
        link
          .rotateY(i * 6) // slight natural twist down the strand
          .at(hangX, topY - i * pitch, hangZ),
      );
    }

    // Wall hook: plate + horizontal peg + upturned tip the top link hangs on.
    const hookY = 0.5;
    const hookPlate = sdf.cylinder(0.052, 0.035, 0.01).rotateX(90).at(hangX, hookY, -0.06);
    const hookPeg = sdf
      .cylinder(0.02, 0.16, 0.008)
      .rotateX(90)
      .at(hangX, hookY, 0.0);
    const hookTip = sdf.capsule(
      [hangX, hookY, 0.07],
      [hangX, hookY + 0.055, 0.09],
      0.017,
    );
    const hookKnob = sdf.sphere(0.024).at(hangX, hookY + 0.058, 0.091);

    const ironShape = sdf.union(...pileLinks, ...hangLinks, hookPlate, hookPeg, hookTip, hookKnob);

    const rustPaint = (x: number, y: number, z: number) => {
      const patch = 0.5 + 0.5 * noise.fbm(x * 9, y * 9, z * 9, 3);
      const speckle = 0.5 + 0.5 * noise.fbm(x * 34, y * 34, z * 34, 2);
      let c = mixRgb(IRON_DARK, IRON, 0.35 + 0.45 * speckle);
      const rustAmt = Math.min(1, Math.max(0, (patch - 0.42) / 0.4));
      c = mixRgb(c, mixRgb(RUST_DARK, RUST, speckle), 0.6 * rustAmt);
      // Grime toward the ground.
      c = mixRgb(c, IRON_DARK, 0.3 * Math.min(1, Math.max(0, (0.12 - y) / 0.12)));
      return c;
    };
    k.body('chains', ironShape.paintFn(rustPaint), {
      color: '#3d4047',
      roughness: 0.55,
      metalness: 0.8,
      detail: 0.0045,
      paintWeight: 2,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 30, y * 30, z * 30, 2),
      maxTriangles: 3000,
    });

    // ------------------------------------------------------------ wall stub
    // Small dungeon wall run the hook is mounted on, with a pale capstone.
    const wallShape = sdf
      .box([0.44, 0.6, 0.3], 0.045)
      .at(0.26, 0.3, -0.22)
      .displace(0.002, (x, y, z) => noise.fbm(x * 7, y * 7, z * 7, 2));
    const capShape = sdf.box([0.5, 0.09, 0.36], 0.03).at(0.26, 0.635, -0.22);

    const stonePaint = (x: number, y: number, z: number) => {
      const patch = 0.5 + 0.5 * noise.fbm(x * 6, y * 6, z * 6, 2);
      let c = mixRgb(STONE_DARK, STONE_MID, 0.15 + 0.4 * patch);
      // Worn pale tops: lighten high, sun-struck surfaces.
      c = mixRgb(c, STONE_PALE, 0.5 * Math.min(1, Math.max(0, (y - 0.48) / 0.2)));
      // Dark mortar shadow line where blocks meet.
      const seam = Math.exp(-Math.pow((y - 0.3) / 0.018, 2));
      c = mixRgb(c, STONE_DARK, 0.6 * seam);
      return c;
    };
    const stoneBump = (x: number, y: number, z: number) => {
      const seam = Math.exp(-Math.pow((y - 0.3) / 0.012, 2));
      return -0.004 * seam + 0.0015 * noise.fbm(x * 22, y * 22, z * 22, 2);
    };
    k.body('wall-stub', wallShape.paintFn(stonePaint), {
      color: '#4a5d75',
      roughness: 0.9,
      metalness: 0,
      detail: 0.009,
      bump: stoneBump,
      maxTriangles: 700,
    });
    k.body('capstone', capShape.paintFn(stonePaint), {
      color: '#7a8ba0',
      roughness: 0.9,
      metalness: 0,
      detail: 0.009,
      bump: stoneBump,
      maxTriangles: 300,
    });
  },
});
