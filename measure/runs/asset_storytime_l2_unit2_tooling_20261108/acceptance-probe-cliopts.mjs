import { U2_RUN, cliGuardOptions } from '../../../scripts/storytime-muse-guards.mjs';

const o = cliGuardOptions({ u2CapUsd: '99', tries: '2', from: '1' });
console.log('keys', Object.keys(o).join(','), 'hasOwn u2CapUsd', Object.hasOwn(o, 'u2CapUsd'), 'capUsd', U2_RUN.capUsd);
const none = cliGuardOptions();
console.log('no args keys', Object.keys(none).length);
