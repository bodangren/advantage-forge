import { HAND_FIT, defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note — buckler (catalog `equipment/armor/buckler`).
 *
 * Role: smithy equipment icon and pickup. It must read at 128 px.
 * Size: 0.35 m diameter, about 0.03 m thick, standing on its rim on y = 0, face toward +Z.
 * One idea: a chunky little round buckler — a domed iron face, a bold raised iron rim
 *   ringed with eight chunky bracket caps and small rivets, a small central boss with a
 *   ring, and a walnut leather handle bar on the back.
 * Shape language: round dominant (disc, domed boss, torus rim, rivet domes).
 *   Square secondary only in the rectangular grip bar.
 * Palette: iron #4a4f55 dominant, #363a3f shadow, #a8acb1 highlight, #c8ccd2 steel edge
 *   (the dome tops catch the lightest value); walnut #6b4226 with #54331d shadow on the
 *   handle.
 * Materials: worn iron (roughness 0.5, metalness 0.7), walnut leather (roughness 0.66).
 *   Subtle forge patches in `paintFn`, leather grain in `bump`. No displacement on metal —
 *   reflections exaggerate it.
 * Detail: domed disc, chunky raised rim, 8 bracket caps, 8 rivets, central boss with ring,
 *   walnut handle bar with two iron pin caps. Focal point: boss + rim.
 * Rig: none. Static item.
 */

const IRON = '#4a4f55';
const IRON_DARK = '#363a3f';
const IRON_HI = '#a8acb1';
const STEEL_EDGE = '#c8ccd2';
const WALNUT = '#6b4226';
const WALNUT_DARK = '#54331d';

const R_DISC = 0.175; // 0.35 m diameter
const CY = R_DISC; // disc center sits at rim radius so it stands on its rim
const FACE_HALF = 0.014; // half-thickness of the face (m); dome is on +Z
const RIM_TUBE = 0.022; // chunky raised rim torus tube radius
const RIM_RING = R_DISC - RIM_TUBE + 0.004;

export default defineAsset({
  name: 'buckler',
  description:
    'Small round buckler with a domed iron face, a chunky raised rim with eight brackets and rivets, a central boss, and a walnut handle on the back.',
  detail: 0.005,
  reference: 'docs/item-mockups/buckler-mock.jpg',
  texture: { size: 1024 },
  equip: { slot: 'offhand', hold: 'shield', fitScale: HAND_FIT, origin: [0, 0.175, -0.02] },

  build(k) {
    // ------------------------------------------------------------------ iron face
    // Half-ellipsoid with a flat back: the dome curves up to FACE_HALF + DOME_H proud.
    // We clip the lower half with a half-space so the back is a clean flat disc.
    const DOME_H = 0.012; // dome rises 12 mm above the flat back
    const faceShape = sdf
      .ellipsoid([R_DISC * 1.02, R_DISC * 1.02, FACE_HALF + DOME_H])
      .at(0, CY, FACE_HALF);
    const flatBack = sdf.halfSpace([0, 0, 1], 0); // solid where z <= 0
    const face = sdf.intersect(faceShape, flatBack).round(0.006);

    const ironPaint = (x: number, y: number, z: number) => {
      // Forge patches: subtle darker mottling across the face.
      const patch = 0.5 + 0.5 * noise.fbm(x * 8, y * 8, z * 4, 2);
      // Top-down light: lighter at the top of the dome.
      const up = Math.min(1, Math.max(0, (y - (CY - 0.05)) / 0.2));
      // Radial darkening toward the rim so the dome reads in 3/4 view.
      const r = Math.hypot(x, y - CY);
      const radial = Math.min(1, Math.max(0, (r - 0.12) / 0.05));
      // Bright catch on the steel-edge dome crest (toward +Z).
      const crest = Math.min(1, Math.max(0, (z - 0.014) / 0.012));
      let c = rgb(IRON);
      c = mixRgb(c, rgb(IRON_DARK), 0.22 * patch);
      c = mixRgb(c, rgb(IRON_HI), 0.32 * up);
      c = mixRgb(c, rgb(IRON_DARK), 0.3 * radial);
      c = mixRgb(c, rgb(STEEL_EDGE), 0.6 * crest);
      return c;
    };
    k.body('face', face.paintFn(ironPaint), {
      color: IRON,
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.006,
      paintWeight: 2,
      maxTriangles: 700,
    });

    // ------------------------------------------------------------------ iron rim torus
    const rim = sdf
      .torus(RIM_RING, RIM_TUBE)
      .rotateX(90)
      .at(0, CY, 0)
      .paintFn((x, y, z) => {
        const ang = Math.atan2(y - CY, x);
        const top = Math.min(1, Math.max(0, (Math.abs(ang) - Math.PI * 0.4) / 0.25));
        let c = rgb(IRON);
        c = mixRgb(c, rgb(IRON_HI), 0.35 * top);
        c = mixRgb(c, rgb(STEEL_EDGE), 0.55 * (z > 0.012 ? 1 : 0));
        return c;
      });
    k.body('rim', rim, {
      color: IRON,
      roughness: 0.45,
      metalness: 0.75,
      detail: 0.005,
      maxTriangles: 600,
    });

    // ------------------------------------------------------------------ 8 chunky rim brackets
    // Rounded boxes riding on top of the rim. Each is short along the tangent, taller in Z,
    // so it reads as a chunky clamp on the rim. Aligned to the local tangent of the ring.
    const brackets: sdf.Shape[] = [];
    const BRACKET_RING = R_DISC - 0.01;
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2 + Math.PI / 8;
      const cx = Math.cos(ang) * BRACKET_RING;
      const cy = CY + Math.sin(ang) * BRACKET_RING;
      brackets.push(
        sdf
          .box([0.03, 0.038, 0.022], 0.008)
          .rotateZ((ang * 180) / Math.PI)
          .at(cx, cy, RIM_TUBE - 0.006),
      );
    }
    k.body(
      'brackets',
      sdf.union(...brackets).paintFn((x, y, z) => {
        // Steel-edge cap on the bracket top (toward +Z) and a worn highlight.
        const crest = Math.min(1, Math.max(0, (z - 0.014) / 0.006));
        let c = rgb(IRON);
        c = mixRgb(c, rgb(IRON_HI), 0.25);
        c = mixRgb(c, rgb(STEEL_EDGE), 0.55 * crest);
        return c;
      }),
      {
        color: IRON,
        roughness: 0.45,
        metalness: 0.75,
        detail: 0.005,
        maxTriangles: 500,
      },
    );

    // ------------------------------------------------------------------ 8 small rivets on the face
    // Sit on the front of the disc, inboard of the rim brackets — visible bumps at game size.
    const rivets: sdf.Shape[] = [];
    const RIVET_R = 0.013;
    const RIVET_RING = R_DISC - 0.05;
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      rivets.push(
        sdf
          .sphere(RIVET_R)
          .scale([1, 1, 0.55])
          .at(Math.cos(ang) * RIVET_RING, CY + Math.sin(ang) * RIVET_RING, 0.018),
      );
    }
    k.body(
      'rivets',
      sdf.union(...rivets).paintFn((x, y, z) => {
        const crest = Math.min(1, Math.max(0, (z - 0.022) / 0.004));
        let c = rgb(IRON);
        c = mixRgb(c, rgb(IRON_HI), 0.3);
        c = mixRgb(c, rgb(STEEL_EDGE), 0.6 * crest);
        return c;
      }),
      {
        color: IRON,
        roughness: 0.4,
        metalness: 0.8,
        detail: 0.0045,
        maxTriangles: 400,
      },
    );

    // ------------------------------------------------------------------ boss + ring rim around it
    const bossCore = sdf.sphere(0.05).scale([1, 1, 0.7]).at(0, CY, 0.018);
    const bossRing = sdf.torus(0.058, 0.012).rotateX(90).at(0, CY, 0.02);
    const boss = sdf
      .smoothUnion(0.006, bossCore, bossRing)
      .paintFn((x, y, z) => {
        const up = Math.min(1, Math.max(0, (y - (CY - 0.018)) / 0.06));
        const crest = Math.min(1, Math.max(0, (z - 0.038) / 0.012));
        let c = rgb(IRON);
        c = mixRgb(c, rgb(IRON_HI), 0.35 * up);
        c = mixRgb(c, rgb(STEEL_EDGE), 0.7 * crest);
        return c;
      });
    k.body('boss', boss, {
      color: IRON,
      roughness: 0.42,
      metalness: 0.8,
      detail: 0.004,
      maxTriangles: 400,
    });

    // ------------------------------------------------------------------ walnut handle (back)
    const handle = sdf
      .box([0.13, 0.038, 0.028], 0.008)
      .at(0, CY, -FACE_HALF - 0.014)
      .paintFn((x, y, z) => {
        const n = 0.5 + 0.5 * noise.fbm(x * 24, y * 18, z * 24, 2);
        const edge = Math.min(1, Math.max(0, (Math.abs(y - CY) - 0.012) / 0.008));
        return mixRgb(rgb(WALNUT), rgb(WALNUT_DARK), 0.35 * n + 0.45 * edge);
      });
    k.body('handle', handle, {
      color: WALNUT,
      roughness: 0.66,
      metalness: 0,
      detail: 0.005,
      maxTriangles: 300,
      bump: (x, y, z) => 0.0009 * noise.fbm(x * 60, y * 30, z * 60, 2),
    });

    // Two iron pin caps on the handle, matching the iron palette so the back reads as a
    // proper leather grip pinned to the disc.
    const pins: sdf.Shape[] = [];
    for (const sx of [-1, 1]) {
      pins.push(
        sdf
          .cylinder(0.013, 0.007, 0.003)
          .rotateX(90)
          .at(sx * 0.054, CY, -FACE_HALF - 0.025),
      );
    }
    k.body('pins', sdf.union(...pins), {
      color: IRON_DARK,
      roughness: 0.45,
      metalness: 0.8,
      detail: 0.004,
      maxTriangles: 200,
    });
  },
});