/** The battle family's shared stage: its 2D file list and the games that use it stay in step. */
import { describe, expect, it } from 'vitest';
import { manifest as archersRevenge } from '../../../src/games/archers-revenge/manifest.js';
import { manifest as castleDefense } from '../../../src/games/castle-defense/manifest.js';
import { manifest as magicDefense } from '../../../src/games/magic-defense/manifest.js';
import { manifest as paladinsTwinSoul } from '../../../src/games/paladins-twin-soul/manifest.js';
import { manifest as rpgBattle } from '../../../src/games/rpg-battle/manifest.js';
import { manifest as runeMatch } from '../../../src/games/rune-match/manifest.js';
import { battleFiles2D } from '../../../src/games/shared/battle/stage2d.js';

const STAGE_GAMES = { archersRevenge, castleDefense, magicDefense, paladinsTwinSoul, rpgBattle, runeMatch };

describe('shared battle stage', () => {
  it('every game on the stage binds its hall and the party (the files every encounter plays)', () => {
    for (const [id, manifest] of Object.entries(STAGE_GAMES)) {
      expect(manifest.requiredAssetBindings, id).toEqual(expect.arrayContaining(battleFiles2D([])));
    }
  });
});
