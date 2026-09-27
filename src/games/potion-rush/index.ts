/** The Potion Rush cartridge: what the host loads (lazily) to play the game. */
import type { ThreeCartridge } from '../../apk3d/factory/index.js';
import { briefing } from './briefing.js';
import { manifest } from './manifest.js';
import strings from './strings.en.js';
import { createGame } from './view/game.js';

export const cartridge: ThreeCartridge = { manifest, strings, briefing, createGame };
