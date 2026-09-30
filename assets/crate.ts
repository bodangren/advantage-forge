import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note: classic wooden crate (props/containers/crate), tavern set.
 * Role: background storage prop for the chibi tavern; must read at 128 px.
 * Size: 0.54 x 0.41 x 0.44 m (X, Y, Z), stands on y = 0, faces +Z.
 * One idea: a stout slatted crate: plank faces inside a chunky frame, with a
 *   diagonal brace on every side. No overhanging lid, no latch.
 * Shape language: square dominant, soft bevels secondary.
 * Palette: planks #b98450 (dominant), frame #7a4e2a (darker), shaded foot
 *   #4e2f18, small dark iron #4a4f55 corner brackets as the accent.
 * Materials: wood (roughness 0.8), worn iron (roughness 0.5, metalness 0.7).
 *   Grain in bump; plank gaps are real 0.006 m shallow cuts.
 * Detail: primary box + posts + battens; secondary braces, brackets;
 *   tertiary grain. Focal point: the front diagonal brace.
 * Rig/animation: none.
 */

const PLANK = rgb('#b98450');
const FRAME = rgb('#7a4e2a');
const LIGHT = rgb('#d6a561');
const DARK = rgb('#4e2f18');
const IRON = '#3a3a3e';

const W = 0.54;
const H = 0.41;
const D = 0.44;
const F = 0.05; // frame member width
const INSET = 0.012; // planks sit behind the frame

const foot = (y: number) => {
  const t = Math.min(1, Math.max(0, y / H));
  return 0.3 * (1 - t) * (1 - t);
};

export default defineAsset({
  name: 'crate',
  description: 'Classic wooden crate: plank faces in a post-and-batten frame with diagonal braces and iron corner brackets.',
  detail: 0.006,
  reference: 'docs/tavern-mockups/tavern-quest_001.jpg',
  texture: { size: 1024 },

  build(k) {
    // ---- planks: inset box with shallow horizontal gaps
    const core = sdf.box([W - 2 * INSET, H - 0.006, D - 2 * INSET], 0.008).at(0, (H - 0.006) / 2, 0);
    const zoneLo = F;
    const zoneHi = H - F;
    const n = 4;
    const pitch = (zoneHi - zoneLo) / n;
    const gaps: ReturnType<typeof sdf.box>[] = [];
    for (let i = 1; i < n; i++) {
      const ring = sdf
        .box([W + 0.1, 0.008, D + 0.1])
        .subtract(sdf.box([W - 2 * INSET - 0.012, 0.02, D - 2 * INSET - 0.012]))
        .at(0, zoneLo + i * pitch, 0);
      gaps.push(ring);
    }
    const tp = (D - 2 * F) / n;
    for (let i = 1; i < n; i++) {
      gaps.push(sdf.box([W - 2 * F + 0.02, 0.016, 0.008]).at(0, H - 0.006, -(D - 2 * F) / 2 + i * tp));
    }
    const planks = core.subtract(...gaps).paintFn((x, y, z) => {
      const b = y > H - 0.02 ? 10 + Math.floor((z + (D - 2 * F) / 2) / tp) : Math.floor((y - zoneLo) / pitch);
      const tint = noise.random(b, 7) * 0.3;
      const g = 0.5 + 0.5 * noise.noise3(x * 6, y * 60, z * 6 + b);
      let c = mixRgb(PLANK, LIGHT, 0.05 + 0.25 * tint + 0.15 * g);
      c = mixRgb(c, DARK, foot(y));
      return c;
    });
    k.body('planks', planks, {
      color: '#b98450',
      roughness: 0.8,
      metalness: 0,
      textureDensity: 2,
      maxTriangles: 3000,
      bump: (x, y, z) => 0.0015 * noise.fbm(x * 8, y * 70, z * 8, 2) + 0.001 * noise.fbm(x * 30, y * 30, z * 30, 2),
    });

    // ---- frame: posts, top and bottom battens, diagonal braces
    const post = sdf.box([F, H, F], 0.01).at(W / 2 - F / 2, H / 2, D / 2 - F / 2);
    const posts = post.mirror('x', 0).mirror('z', 0);
    const batten = (y: number) =>
      sdf.box([W, F, D], 0.01).subtract(sdf.box([W - 2 * F + 0.02, F + 0.02, D - 2 * F + 0.02])).at(0, y, 0);
    const battens = sdf.union(batten(F / 2), batten(H - F / 2));

    const ix = W - 2 * F + 0.02;
    const iz = D - 2 * F + 0.02;
    const iy = H - 2 * F + 0.02;
    const T = 0.022;
    const brace = (span: number, sign: number, side: boolean, off: number) => {
      const len = Math.hypot(span, iy);
      const ang = (Math.atan2(iy, span) * 180) / Math.PI * sign;
      let s = sdf.box([len, 0.045, T], 0.008).rotateZ(ang);
      s = side ? s.rotateY(90).at(off, H / 2, 0) : s.at(0, H / 2, off);
      return s;
    };
    const braces = sdf
      .union(
        brace(ix, 1, false, D / 2 - T / 2),
        brace(ix, -1, false, -(D / 2 - T / 2)),
        brace(iz, 1, true, W / 2 - T / 2),
        brace(iz, -1, true, -(W / 2 - T / 2)),
      )
      .union(
        sdf
          .box([Math.hypot(ix, iz), T, 0.045], 0.008)
          .rotateY((Math.atan2(iz, ix) * 180) / Math.PI)
          .at(0, H - T / 2, 0),
      )
      .intersect(sdf.box([W, H, D]).at(0, H / 2, 0));
    const frame = sdf.union(posts, battens, braces).paintFn((x, y, z) => {
      const g = 0.5 + 0.5 * noise.noise3(x * 30, y * 8, z * 30);
      return mixRgb(mixRgb(FRAME, PLANK, 0.1 + 0.25 * g), DARK, foot(y));
    });
    k.body('frame', frame, {
      color: '#7a4e2a',
      roughness: 0.82,
      metalness: 0,
      textureDensity: 1.5,
      maxTriangles: 2200,
      bump: (x, y, z) => 0.0015 * noise.fbm(x * 30, y * 6, z * 30, 2),
    });

    // ---- iron corner brackets on the front and back faces
    const corner = (y: number, dy: number) => {
      const cy = y - dy * 0.012;
      return sdf.union(
        sdf.box([0.075, 0.02, 0.012], 0.003).at(W / 2 - 0.0375, cy, D / 2 - 0.004),
        sdf.box([0.02, 0.075, 0.012], 0.003).at(W / 2 - 0.012, y - dy * 0.0375, D / 2 - 0.004),
        sdf.sphere(0.008).at(W / 2 - 0.05, cy, D / 2 - 0.006),
        sdf.sphere(0.008).at(W / 2 - 0.012, y - dy * 0.05, D / 2 - 0.006),
      );
    };
    const all = sdf.union(corner(H, 1), corner(0, -1));
    const iron = all
      .mirror('x', 0)
      .mirror('z', 0)
      .paintFn((x, y, z) => mixRgb(rgb('#3a3a3e'), rgb('#6a6a72'), 0.5 * (0.5 + 0.5 * noise.noise3(x * 18, y * 18, z * 18))));
    k.body('iron', iron, { color: IRON, roughness: 0.5, metalness: 0.7, detail: 0.005, maxTriangles: 1000 });
  },
});
