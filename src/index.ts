/**
 * The asset authoring API. Asset files import everything from here:
 *
 *   import { defineAsset, sdf, profile, noise } from '../src/index.js';
 */
import * as sdf from './sdf/shapes.js';
import * as profile from './sdf/profile.js';
import * as noise from './sdf/noise.js';
import * as motion from './motion.js';

export { defineAsset } from './asset.js';
export type { AssetContext, AssetDefinition, BodyOptions, GroupOptions } from './asset.js';
export { Sdf } from './sdf/core.js';
export type { Vec3 } from './sdf/core.js';
export { rgb, mixRgb } from './sdf/color.js';
export type { Rgb, ColorInput } from './sdf/color.js';
export { sdf, profile, noise, motion };
export type { SkeletonDef, BoneDef, Pose, BonePose, AnimationDef } from './rig.js';
export * as THREE from 'three';
