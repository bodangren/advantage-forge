import { describe, expect, it } from 'vitest';

import {
  MVP_RENDER_PROFILE,
  directionsForCount,
  validateRenderProfile,
  yawRadiansForDirection,
} from '../../src/render/index.js';

describe('sprite render profile', () => {
  it('commits the MVP delivery contract', () => {
    expect(MVP_RENDER_PROFILE).toEqual({
      id: 'fantasy.sprite.orthographic.v1',
      widthPixels: 128,
      heightPixels: 128,
      elevationDegrees: 30,
      directions: 8,
      paddingPixels: 6,
      transparent: true,
      minimumFeaturePixels: 3,
    });
    expect(validateRenderProfile(MVP_RENDER_PROFILE)).toEqual([]);
  });

  it('orders one, four, and eight direction output deterministically', () => {
    expect(directionsForCount(1)).toEqual(['S']);
    expect(directionsForCount(4)).toEqual(['N', 'E', 'S', 'W']);
    expect(directionsForCount(8)).toEqual([
      'N',
      'NE',
      'E',
      'SE',
      'S',
      'SW',
      'W',
      'NW',
    ]);
    expect(yawRadiansForDirection('E')).toBeCloseTo(Math.PI / 2);
    expect(yawRadiansForDirection('NW')).toBeCloseTo((7 * Math.PI) / 4);
  });

  it('reports invalid delivery profiles', () => {
    expect(
      validateRenderProfile({
        ...MVP_RENDER_PROFILE,
        id: '',
        paddingPixels: 64,
        minimumFeaturePixels: 0,
      }),
    ).toEqual([
      'id must not be empty',
      'paddingPixels must leave a positive drawable frame',
      'minimumFeaturePixels must be a positive integer',
    ]);
  });

  it('rejects each bounded camera and frame field', () => {
    expect(
      validateRenderProfile({
        ...MVP_RENDER_PROFILE,
        widthPixels: 15,
        heightPixels: 2049,
        elevationDegrees: 90,
        directions: 2 as 8,
        paddingPixels: -1,
        minimumFeaturePixels: 1.5,
      }),
    ).toEqual([
      'widthPixels must be an integer between 16 and 2048',
      'heightPixels must be an integer between 16 and 2048',
      'elevationDegrees must be greater than 0 and less than 90',
      'directions must be 1, 4, or 8',
      'paddingPixels must leave a positive drawable frame',
      'minimumFeaturePixels must be a positive integer',
    ]);
  });
});
