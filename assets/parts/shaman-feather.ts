import { mixRgb, rgb, sdf, profile, type Part } from '../../src/index.js';

/**
 * Shaman held feather (part of `assets/shaman.ts`; standalone `assets/shaman-feather.ts`).
 *
 * A 0.32 m cream feather with a brown tip and a quill. Class: hand-held. Local frame: the origin
 * is the grip on the quill, the quill along +Y, the vane face toward +Z. Body: feather (bone `hand.L`).
 * Tint slots: none. The host poses it with its own `featherPose`.
 */

const C = { hide: '#4a3428', fur: '#e8dcc0', quill: '#3a2618' };
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/**
 * A flat feather outline, base at the origin, tip at +Y (length len, half width w): a notched
 * vane like barbs, and a bare quill stub at the base.
 */
export const featherShape = (len: number, w: number, thick = 0.012) => {
  const n = 10;
  const right: [number, number][] = [];
  for (let i = 1; i < n; i++) {
    const f = i / n;
    const v = Math.max(0, (f - 0.1) / 0.9);
    const hw = Math.max(0.004, w * Math.pow(Math.sin(Math.PI * Math.pow(v, 0.6)), 0.7));
    right.push([hw * (i % 2 ? 0.85 : 1), f * len]);
  }
  const pts: [number, number][] = [[0.004, 0], ...right, [0, len], ...right.map(([x, y]) => [-x, y] as [number, number]).reverse(), [-0.004, 0]];
  return sdf.extrude(profile.polygon(pts), thick, 0.0035);
};

export function shamanFeather(): Part {
    // ------------------------------------------------------------------ the large feather (left hand)
    // 0.28 m long, 0.06 m wide: a cream vane with a brown tip and a brown quill that runs through the fist.
    const bigFeather = sdf
      .union(
        featherShape(0.32, 0.048, 0.016).paintFn((_x, y, _z, base) => (y > 0.23 ? mixRgb(base, rgb(C.hide), clamp01((y - 0.23) / 0.04)) : base)),
        sdf.capsule([0, -0.14, 0], [0, 0.31, 0], 0.0062).paint(C.quill),
      )
      .at(0, 0.1, 0); // the fist grips low on the quill, so the vane rises beside the shoulder
    

  return {
    name: 'shaman-feather',
    bodies: [{ name: 'feather', shape: bigFeather, options: { color: C.fur, roughness: 0.75, detail: 0.004 }, bone: 'hand.L' }],
  };
}
