import { describe, expect, it } from 'vitest';
import { sunkenVaultPlaces as scenePlaces } from '../../scenes/sunken-vault.js';
import { sunkenVaultPlaces as gamePlaces } from '../../src/games/shared/battle/vault-places.js';

describe('vault places', () => {
  it('the battle games read the same Sunken Vault as the scene (scripts/design-sunken-vault.mjs writes both)', () => {
    expect(gamePlaces()).toEqual(scenePlaces());
    expect(gamePlaces().length).toBeGreaterThan(200);
  });
});
