import { defineAsset, mixRgb, rgb, sdf } from '../src/index.js';

/**
 * Design note - feather (catalog `items/crafting/feather`).
 * Role: crafting pickup icon. Size: 0.28 m tall, stands on y = 0, faces +Z.
 * One idea: a plume leaning at 70 degrees on a pebble, blue-grey tip.
 * Shape language: soft elongated ellipse. Palette: vane #f8f6f0, quill #f0e8d8, tip #a8c0d0.
 * Materials: quill, vane, pebble. Focal point: the vane tip.
 */
const VANE = rgb('#f8f6f0');
const TIP = rgb('#a8c0d0');
const LINE = rgb('#dcd6c6');

export default defineAsset({
  name: 'feather',
  description: 'A white plume with a blue-grey tip leaning on a pebble.',
  reference: 'docs/item-mockups/feather-mock.jpg',
  detail: 0.004,
  texture: { size: 1024 },
  build(k) {
    k.group('plume', { at: [-0.06, 0.05, 0], rotate: [0, 0, -20] }, (g) => {
      g.body('quill', sdf.capsule([0, 0, 0], [0, 0.12, 0], 0.013), {
        color: rgb('#f0e8d8'),
        roughness: 0.6,
      });
      let vane = sdf.ellipsoid([0.06, 0.13, 0.016]).at(0, 0.17, 0);
      vane = vane.subtract(
        sdf.sphere(0.015).at(0.062, 0.14, 0),
        sdf.sphere(0.015).at(-0.06, 0.2, 0),
      );
      vane = vane.paintFn((x, y, z, base) => {
        let c = VANE;
        c = mixRgb(c, TIP, Math.min(1, Math.max(0, (y - 0.22) / 0.07)));
        c = mixRgb(c, LINE, Math.max(0, 1 - Math.abs(x) / 0.008) * 0.9);
        return c;
      });
      g.body('vane', vane, { color: VANE, roughness: 0.7 });
    });
    k.body('pebble', sdf.ellipsoid([0.05, 0.035, 0.04]).at(-0.075, 0.03, 0.005).displace(0.003, (x, y, z) => Math.sin(x * 90) * Math.cos(z * 80)), {
      color: rgb('#7c7770'),
      roughness: 0.9,
    });
  },
});
