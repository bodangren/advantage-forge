/** Monster Encounters plays every encounter of the shared battle stage, so it binds all of its files. */
import { describe, expect, it } from 'vitest';
import { FILES_2D, manifest } from '../../../src/games/monster-encounters/manifest.js';
import { battleFiles2D } from '../../../src/games/shared/battle/stage2d.js';

describe('Monster Encounters on the shared battle stage', () => {
  it('binds every 2D file the stage plays', () => {
    expect([...FILES_2D].sort()).toEqual(battleFiles2D().sort());
    expect(manifest.requiredAssetBindings).toEqual([...FILES_2D]);
  });
});
