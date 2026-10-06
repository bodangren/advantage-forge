import { describe, expect, it } from 'vitest';
import { avatarClassIdSchema, launchAvatarSchema, readLaunchAvatar, type LaunchAvatar } from '../../src/apk3d/contracts/index.js';
import { AVATAR_PACK_VERSION } from '../../src/apk3d/avatar/pack.js';
import { STARTER_SETS } from '../../src/apk3d/avatar/starters.js';

/** A starter set as the host would pass it: the hair style and the pieces, each in its own colors. */
const launchOf = (set: (typeof STARTER_SETS)[number]): LaunchAvatar =>
  ({ catalogVersion: AVATAR_PACK_VERSION, classId: set.id, tints: set.tints, pieces: set.pieces.map((itemId) => ({ itemId, dye: null })) }) as LaunchAvatar;

describe('the launch avatar (copy of game-contracts launchAvatarSchema)', () => {
  it('has the 15 starter classes, in the starter order', () => {
    expect(avatarClassIdSchema.options).toEqual(STARTER_SETS.map((s) => s.id));
  });

  it.each(STARTER_SETS.map((s) => [s.id, s] as const))('accepts the %s starter set', (_, set) => {
    expect(launchAvatarSchema.parse(launchOf(set))).toEqual(launchOf(set));
  });

  it('accepts a dye and an empty loadout', () => {
    const avatar = { ...launchOf(STARTER_SETS[0]!), pieces: [] };
    expect(readLaunchAvatar(avatar)).toEqual({ avatar });
    const dyed = { ...avatar, pieces: [{ itemId: 'iron-helmet', dye: 'gold' }] };
    expect(readLaunchAvatar(dyed)).toEqual({ avatar: dyed });
  });

  it('rejects what the monorepo schema rejects, with the path in the reason', () => {
    const good = launchOf(STARTER_SETS[0]!);
    const bad: [unknown, RegExp][] = [
      [{ ...good, classId: 'pirate' }, /^classId:/],
      [{ ...good, tints: { ...good.tints, hair: 'green' } }, /^tints\.hair:/],
      [{ ...good, tints: { ...good.tints, extra: 'x' } }, /^tints:/],
      [{ ...good, catalogVersion: '1.0' }, /^catalogVersion:/],
      [{ ...good, pieces: [{ itemId: '', dye: null }] }, /^pieces\.0\.itemId:/],
      [{ ...good, pieces: [{ itemId: 'crown' }] }, /^pieces\.0\.dye:/],
      [{ ...good, hero: 'knight' }, /^avatar:/],
      [null, /^avatar:/],
    ];
    for (const [value, reason] of bad) {
      const read = readLaunchAvatar(value);
      expect('error' in read && read.error).toMatch(reason);
    }
  });
});
