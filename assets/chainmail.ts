import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — chainmail shirt on an invisible torso (equipment/armor/chainmail).
 *
 * Role: equipment item for the Chibi Quest heroes; must read at 128 px.
 * Size: 0.7 m tall overall; chest ~0.52 m wide; hem on y = 0, centered on Y, front toward +Z.
 * One idea: a heavy grey ring-mail shirt that stands on its own like a torso is inside —
 *   short puffy sleeves angled down, a round neck with a dark leather collar, a straight
 *   leather-bound hem.
 * Shape language: round dominant (revolved torso, rounded crown, soft sleeve blends);
 *   square secondary (straight hem, flat leather bands).
 * Palette (60/30/10): iron #4a4f55 (dominant), shaded grey #363a3f / highlight #a8acb1;
 *   dark leather #5c3a22 with #8a5a35 mottle for collar, cuffs, hem band (warm accent).
 * Materials: iron mail (rough 0.5, metal 0.7) with ring pattern in the bump; leather
 *   (rough 0.65) trim.
 * Detail: ring-mail bump lattice everywhere on the mail, broad soft tonal drift in the paint,
 *   dark neck and sleeve openings. Focal point: the leather collar at the neck.
 * Rig/animation: none (static equipment).
 */

const IRON = rgb('#4a4f55');
const DARK = rgb('#363a3f');
const HI = rgb('#a8acb1');
const LEATHER = rgb('#8a5a35');
const LEATHER_DARK = rgb('#5c3a22');

const PITCH = 0.013; // ring pitch in meters

const ss = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// Staggered ring-mail lattice in (u, v) surface coordinates. Used ONLY for the bump (normal
// map) — never for paint, so the mesh never gets paint seams. The woven sine crosshatch with a
// per-row phase shift reads as interlocking rings; the annulus term deepens the ring holes.
function mailWire(u: number, v: number) {
  const row = Math.floor(v / PITCH);
  const uu = (u / PITCH + (row % 2 ? 0.5 : 0)) * Math.PI;
  const vv = (v / PITCH) * Math.PI;
  const weave = Math.abs(Math.sin(uu)) * Math.abs(Math.sin(vv));
  const i = Math.floor(u / PITCH + (row % 2 ? 0.5 : 0));
  const lx = u / PITCH + (row % 2 ? 0.5 : 0) - i - 0.5;
  const ly = v / PITCH - row - 0.5;
  const d = Math.hypot(lx, ly);
  const hole = 1 - ss(0.12, 0.24, d);
  return Math.max(weave, 0) * (1 - 0.5 * hole);
}

// Paint for the iron mail. Kept SOFT at mesh-edge scale (no gradient tighter than ~1 cm): any
// paint gradient narrower than a mesh edge is treated as a hard paint seam and shatters the
// mesh into patches, which blocks triangle reduction. The rings live in the bump.
function mailPaint(x: number, y: number, z: number, base: typeof IRON) {
  let c = base;
  // Broad tonal drift so the grey is not flat: coarse + mid mottle, all smooth.
  c = mixRgb(c, DARK, 0.2 * (0.5 + 0.5 * noise.fbm(x * 4.5, y * 4.5, z * 4.5, 2)));
  c = mixRgb(c, HI, 0.2 * (0.5 + 0.5 * noise.fbm(x * 14 + 9, y * 14, z * 14, 2)));
  // Slightly darker toward the hem, lighter on the shoulders.
  c = mixRgb(c, DARK, 0.16 * ss(0.18, 0.04, y));
  c = mixRgb(c, HI, 0.14 * ss(0.42, 0.58, y));
  return c;
}

// Shared bump: the ring lattice, slightly raised wires.
const mailBump = (u: number, v: number) => 0.0012 * mailWire(u, v);

export default defineAsset({
  name: 'chainmail',
  description:
    'Grey ring-mail shirt with short sleeves, a leather collar, cuffs, and hem band, standing as on an invisible torso.',
  detail: 0.005,
  reference: 'docs/item-mockups/chainmail-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------- mail shirt (iron)
    // Revolved chibi torso: straight hem on the ground, wide belly, shoulder slope, a flatter
    // crown with a round neck. Short tapered sleeves blend into the shoulders with a soft fillet.
    const torso = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.02],
            [0.205, 0.02],
            [0.235, 0.04],
            [0.252, 0.075],
            [0.258, 0.14],
            [0.25, 0.22],
            [0.24, 0.29],
            [0.226, 0.36],
            [0.208, 0.44],
            [0.184, 0.5],
            [0.158, 0.555],
            [0.128, 0.6],
            [0.098, 0.63],
            [0.075, 0.652],
            [0.058, 0.662],
            [0, 0.668],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.52]);

    // Sleeves: tapered tubes on a downward-outward axis, cut square at the cuff end.
    // Local frame: axis d from a, in-plane normal e, arc coordinate u = phi * sleeve radius.
    const a: [number, number, number] = [0.12, 0.575, 0];
    const d: [number, number, number] = [0.96, -0.28, 0];
    const len = 0.145;
    const b: [number, number, number] = [
      a[0] + d[0] * len,
      a[1] + d[1] * len,
      a[2] + d[2] * len,
    ];
    const cutOffset = d[0] * b[0] + d[1] * b[1] + d[2] * b[2];
    const sleeveR = sdf
      .cone(a, b, 0.085, 0.075)
      .smoothIntersect(0.004, sdf.halfSpace(d, cutOffset - 0.002));

    // Round neck opening, cut down from above so a rim remains under the collar.
    const neckCut = sdf.cylinder(0.058, 0.24, 0.008).at(0, 0.72, 0);

    const mail = torso
      .smoothUnion(0.03, sleeveR, sleeveR.mirror('x', 0))
      .smoothSubtract(0.005, neckCut);

    const sleeveFrame = (x: number, y: number, z: number) => {
      const sx = x >= 0 ? 1 : -1;
      const wx = x - a[0] * sx;
      const ax = wx * d[0] * sx + (y - a[1]) * d[1] + z * d[2];
      const e = -wx * d[1] * sx + (y - a[1]) * d[0]; // radial component along in-plane normal
      const phi = Math.atan2(z, e);
      return { u: phi * 0.08, v: ax, ax };
    };
    const paint = (x: number, y: number, z: number, base: typeof IRON) => {
      let c = mailPaint(x, y, z, base);
      if (Math.abs(x) > 0.09) {
        // Sleeve zone: dark inside the opening, near the flat cut.
        c = mixRgb(c, DARK, 0.75 * ss(len - 0.03, len - 0.006, sleeveFrame(x, y, z).ax));
      } else if (y > 0.6) {
        // Dark inside the neck hole.
        c = mixRgb(c, DARK, 0.85 * ss(0.075, 0.055, Math.hypot(x, z)));
      }
      return c;
    };
    const bump = (x: number, y: number, z: number) => {
      let u: number;
      let v: number;
      if (Math.abs(x) > 0.09 && y > 0.44) {
        ({ u, v } = sleeveFrame(x, y, z));
      } else {
        u = Math.atan2(z, x) * Math.hypot(x, z);
        v = y;
      }
      return mailBump(u, v) + 0.0006 * noise.fbm(x * 9, y * 9, z * 9, 2);
    };
    k.body('mail', mail.paintFn(paint), {
      color: IRON,
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.005,
      maxTriangles: 4300,
      textureDensity: 2,
      bump,
    });

    // ------------------------------------------------------------- leather trim
    // Collar ring around the neck, a cuff on each sleeve end, a hem band at the bottom.
    const collar = sdf.torus(0.052, 0.017).at(0, 0.652, 0);
    // Sleeve cuff: torus axis (initially +Y) rotated onto the sleeve axis d.
    const cuff = sdf.torus(0.076, 0.012).rotateZ(-106).at(b[0] - 0.003, b[1] + 0.002, b[2]);
    const hemBand = mail
      .round(0.0035)
      .smoothIntersect(0.005, sdf.box([0.6, 0.07, 0.34], 0.012).at(0, 0.05, 0));
    const leather = sdf
      .union(collar, cuff, cuff.mirror('x', 0), hemBand)
      .paintFn((x, y, z, base) => {
        const mottle = 0.5 + 0.5 * noise.fbm(x * 30, y * 30, z * 30, 2);
        let c = mixRgb(base, LEATHER, 0.32 * mottle);
        c = mixRgb(c, LEATHER_DARK, 0.3 * ss(0.045, 0.02, y)); // worn lower hem edge
        return c;
      });
    k.body('leather', leather, {
      color: LEATHER_DARK,
      roughness: 0.65,
      metalness: 0,
      detail: 0.005,
      maxTriangles: 1100,
      bump: (x, y, z) => 0.001 * noise.fbm(x * 38, y * 38, z * 38, 2),
    });
  },
});
