/** The page's one audio bus; every tap and key unlocks it (see the kit's `installAudioUnlock`). */
import { AudioBus, installAudioUnlock } from '../../apk3d/audio/index.js';

export const sound = new AudioBus();
installAudioUnlock(sound);
