import { defineAsset, profile, sdf } from '../src/index.js';

/**
 * Design note — the sun (Chibi Sprouts props).
 *
 * Role: a song-video prop for weeks 2 and 3; must read at 128 px.
 * Size: 0.50 m across and 0.12 m deep, with ten rays 0.10 m long; stands on y = 0 with the
 *   lowest ray tip on the ground, so the disc's centre is at y = 0.35.
 * One idea: a thick bright yellow disc with rounded rays and a happy face on the front.
 * Shape language: round, with soft cone rays around the rim.
 * Palette: yellow #f6c936 (disc and rays), dark brown #3a2a1e (eyes and smile), soft pink
 *   #f29a7a (cheeks).
 * Materials: flat painted yellow (roughness 0.8), emissive #f6c936 at 0.4.
 * Rig/animation: none (static prop).
 */

const DEG = Math.PI / 180;

const CY = 0.35; // the disc's centre height; the lowest ray tip touches y = 0
const R = 0.25; // the disc's radius
const D = 0.12; // the disc's depth
const EDGE = 0.03; // the rounded edge
const RAYS = 10; // the rays around the rim
const RAY_LEN = 0.1; // the ray length past the rim
const TIP = 0.008; // the cone's tip cap; the cap reaches past the tip point

export default defineAsset({
  name: 'sun',
  description: 'A big bright yellow sun disc with ten rounded rays and a happy face painted on the front.',
  detail: 0.008,
  texture: { size: 1024 },

  build(k) {
    // The disc: a cylinder with a rounded edge, turned to face +Z.
    let shape = sdf.cylinder(R - EDGE, D - 2 * EDGE).round(EDGE).rotateX(90);

    // The rays: ten rounded cones in the disc's plane, one of them straight down.
    for (let i = 0; i < RAYS; i++) {
      const a = (-90 + (i * 360) / RAYS) * DEG;
      const inner = R - 0.04;
      const outer = R + RAY_LEN - TIP;
      const base: [number, number, number] = [Math.cos(a) * inner, Math.sin(a) * inner, 0];
      const tip: [number, number, number] = [Math.cos(a) * outer, Math.sin(a) * outer, 0];
      shape = shape.smoothUnion(0.032, sdf.cone(base, tip, 0.035, TIP));
    }

    // The face: painted shapes that pass through the front face.
    const eyes = sdf.ellipsoid([0.0175, 0.025, 0.03]).at(0.07, 0.04, 0.05).mirror('x');
    const smile = sdf.extrude(profile.arc(0.09, 0.016, 200, 340), 0.1).at(0, -0.01, 0.05);
    const cheeks = sdf.ellipsoid([0.03, 0.03, 0.03]).at(0.12, -0.02, 0.05).mirror('x');

    const painted = shape
      .paintWhere(eyes, '#3a2a1e', 0.004)
      .paintWhere(smile, '#3a2a1e', 0.004)
      .paintWhere(cheeks, '#f29a7a', 0.012);

    k.body('sun', painted.at(0, CY, 0), {
      color: '#f6c936',
      emissive: '#f6c936',
      emissiveIntensity: 0.4,
      roughness: 0.8,
      textureDensity: 1.5,
    });
  },
});
