/** Only the three vocabulary challenge games of the selector declare a class challenge. */
import { describe, expect, it } from 'vitest';
import { GAMES } from '../../src/host/registry.js';

describe('class challenge games', () => {
  it('only Hero vs. Zombie, Dragon Flight, and Dragon Rider declare a challenge', () => {
    const declared = GAMES.filter((g) => g.manifest?.challenge).map((g) => g.id).sort();
    expect(declared).toEqual(['dragon-flight', 'dragon-rider', 'hero-vs-zombie']);
  });
});
