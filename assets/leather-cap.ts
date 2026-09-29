import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Leather cap (equipment/armor/leather-cap), matched to docs/item-mockups/leather-cap-mock.jpg.
 * Size: 0.43 m wide, 0.18 m tall, 0.55 m deep with the visor (the 1.8x hero fit: inner cavity about 0.19 x 0.15 x 0.20), open at the bottom, sitting on y = 0 with the visor toward +Z.
 * One idea: a rounded brown leather cap of six stitched panels with a band, a short visor, and a
 * brass button on top. Palette: leather #7a4a2a / #5a3520, stitch #d9b07a, brass #d4a93a.
 */

const LEATHER = rgb('#7a4a2a');
const DARK = rgb('#5a3520');
const STITCH = rgb('#d9b07a');
const S = 1.8; // uniform fit scale about the origin

export default defineAsset({
  name: 'leather-cap',
  description: 'A rounded brown leather cap of six stitched panels with a band, a short visor, and a brass button on top.',
  detail: 0.005,
  reference: 'docs/item-mockups/leather-cap-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    const dome = sdf.ellipsoid([0.115, 0.09, 0.12]);
    const up = sdf.halfSpace([0, -1, 0], 0).intersect(sdf.box([1, 1, 1]).at(0, 0.3, 0));
    const crown = dome.subtract(dome.round(-0.008)).intersect(up);
    k.body(
      'crown',
      crown.scale(S).paintFn((px, py, pz) => {
        const x = px / S, y = py / S, z = pz / S;
        const a = Math.atan2(z, x) * (3 / Math.PI);
        const seam = Math.abs(a - Math.round(a));
        const n = 0.5 + 0.5 * noise.fbm(x * 30, y * 30, z * 30, 2);
        let c = mixRgb(LEATHER, DARK, 0.2 * n);
        if (seam < 0.03 && y > 0.02) c = DARK;
        else if (seam < 0.09 && seam > 0.06 && y > 0.03 && Math.sin(y * 500) > 0) c = STITCH;
        return c;
      }),
      { color: '#7a4a2a', roughness: 0.6, metalness: 0, textureDensity: 2 },
    );
    const band = dome.round(0.004).subtract(dome.round(-0.01)).intersect(sdf.box([1, 0.026, 1]).at(0, 0.013, 0));
    const visor = sdf
      .ellipsoid([0.1, 0.009, 0.08])
      .rotateX(-6)
      .at(0, 0.012, 0.1)
      .intersect(sdf.halfSpace([0, 0, -1], -0.07).intersect(sdf.box([1, 1, 1]).at(0, 0, 0.3)));
    k.body('band', sdf.smoothUnion(0.006, band, visor).intersect(up).scale(S), { color: '#5a3520', roughness: 0.6, metalness: 0 });
    k.body('button', sdf.ellipsoid([0.014, 0.008, 0.014]).at(0, 0.09, 0).scale(S), { color: '#d4a93a', roughness: 0.3, metalness: 0.9 });
  },
});
