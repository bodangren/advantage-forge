import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — chunky wooden barrel (props/containers/barrel), tavern style.
 *
 * Role: background storage prop for a cozy hamlet/tavern; must read at 128 px sprite.
 * Size: 0.92 m tall, 0.67 m wide at the belly, stands on y = 0, faces +Z.
 * One idea: a squat barrel with a smooth bulged belly, hugged by four dark iron hoops.
 * Shape language: round dominant (revolved body, round lid and bung), square secondary (hoops).
 * Palette: two alternating stave tones #9a6534 / #86552a (dominant), dark seams #3a2210,
 *   iron hoops #3a3d42, lighter lid #b9844a.
 * Materials: wood (roughness 0.82), iron (roughness 0.45, metalness 0.8).
 * Detail: primary smooth revolved body; secondary 4 hoops with 6 rivets each, inset lid with
 *   three plank lines and a bung; tertiary 16 stave grooves and grain in `bump` only.
 * Rig/animation: none (static prop).
 */

const WOOD_A = rgb('#9a6534');
const WOOD_B = rgb('#86552a');
const WOOD_LIGHT = rgb('#b9844a');
const WOOD_DARK = rgb('#3a2210');
const IRON = '#3a3d42';

const TOP = 0.9; // rim height
const LID_TOP = 0.88; // lid inset 0.02 below the rim
const STAVES = 16;
const HOOPS = [0.08, 0.22, 0.68, 0.82];
const HOOP_W = 0.035;
const rad = (y: number) => 0.325 - 0.03 * Math.pow((y - 0.45) / 0.45, 2);

export default defineAsset({
  name: 'barrel',
  description:
    'Chunky wooden barrel with a smooth bulged body, four dark iron hoops, and an inset lid with a round bung.',
  detail: 0.008,
  texture: { size: 1024 },

  build(k) {
    const pts: [number, number][] = [[0, 0], [0.25, 0], [0.272, 0.012], [0.285, 0.03]];
    for (let y = 0.06; y < 0.87; y += 0.03) pts.push([rad(y), y]);
    pts.push([0.292, 0.88], [0.283, 0.895], [0.27, TOP], [0, TOP]);
    const bodyShape = sdf
      .revolve(profile.polygon(pts))
      .subtract(sdf.cylinder(0.27, 0.05).at(0, TOP, 0));

    const stavePos = (x: number, z: number) => {
      const u = ((Math.atan2(z, x) + Math.PI) / (Math.PI * 2)) * STAVES;
      const idx = Math.floor(u);
      return { idx, f: u - idx };
    };
    const stavePaint = (x: number, y: number, z: number) => {
      const { idx, f } = stavePos(x, z);
      let c = mixRgb(idx % 2 ? WOOD_A : WOOD_B, WOOD_LIGHT, 0.12 * noise.random(idx, 3, 1));
      const grain = 0.5 + 0.5 * noise.fbm(x * 8, y * 40, z * 8, 2);
      c = mixRgb(c, WOOD_DARK, 0.18 * grain);
      const edge = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * f), 10);
      c = mixRgb(c, WOOD_DARK, 0.6 * edge);
      const t = y / TOP;
      return mixRgb(c, WOOD_DARK, 0.25 * (1 - t) * (1 - t));
    };
    const staveBump = (x: number, y: number, z: number) => {
      const { f } = stavePos(x, z);
      const edge = Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * f), 10);
      return -0.004 * edge + 0.0015 * noise.fbm(x * 8, y * 60, z * 8, 2);
    };
    k.body('staves', bodyShape.paintFn(stavePaint), {
      color: '#9a6534',
      roughness: 0.82,
      metalness: 0,
      detail: 0.008,
      paintWeight: 2,
      bump: staveBump,
      maxTriangles: 6000,
    });

    // Hoops: revolved bands following the bulge, proud by 0.012 m, 0.035 m tall.
    const parts: ReturnType<typeof sdf.sphere>[] = [];
    for (const y of HOOPS) {
      const y0 = y - HOOP_W / 2;
      const y1 = y + HOOP_W / 2;
      parts.push(
        sdf
          .revolve(
            profile.polygon([
              [rad(y0) - 0.01, y0],
              [rad(y0) + 0.008, y0],
              [rad(y0) + 0.012, y0 + 0.004],
              [rad(y1) + 0.012, y1 - 0.004],
              [rad(y1) + 0.008, y1],
              [rad(y1) - 0.01, y1],
            ]),
          )
          .round(0.002),
      );
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + (y > 0.4 ? Math.PI / 6 : 0);
        const r = rad(y) + 0.008;
        parts.push(sdf.sphere(0.0155).at(Math.cos(a) * r, y, Math.sin(a) * r));
      }
    }
    k.body('hoops', sdf.union(...parts), {
      color: IRON,
      roughness: 0.45,
      metalness: 0.8,
      detail: 0.006,
      maxTriangles: 7000,
    });

    // Lid inset 0.02 m below the rim, three plank lines along X.
    const lidShape = sdf.cylinder(0.272, 0.03, 0.006).at(0, LID_TOP - 0.015, 0);
    const plank = (x: number) => {
      const f = (x + 0.3) / 0.2 - Math.floor((x + 0.3) / 0.2);
      return Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * f), 14);
    };
    k.body(
      'lid',
      lidShape.paintFn((x, y, z) => {
        const board = 0.5 + 0.5 * noise.fbm(x * 4, 0, z * 40, 2);
        let c = mixRgb(WOOD_LIGHT, WOOD_A, 0.3 + 0.3 * board);
        return mixRgb(c, WOOD_DARK, 0.6 * plank(x));
      }),
      {
        color: '#b9844a',
        roughness: 0.82,
        metalness: 0,
        detail: 0.005,
        maxTriangles: 1200,
        bump: (x, y, z) => -0.004 * plank(x) + 0.0012 * noise.fbm(x * 4, y, z * 40, 2),
      },
    );

    const bung = sdf
      .smoothUnion(
        0.008,
        sdf.cylinder(0.04, 0.03, 0.008).at(0.11, LID_TOP + 0.005, 0.08),
        sdf.sphere(0.022).at(0.11, LID_TOP + 0.015, 0.08),
      )
      .paintWhere(sdf.torus(0.042, 0.008).at(0.11, LID_TOP, 0.08), WOOD_DARK, 0.006);
    k.body('bung', bung, {
      color: '#86552a',
      roughness: 0.82,
      metalness: 0,
      detail: 0.004,
      maxTriangles: 600,
    });
  },
});
