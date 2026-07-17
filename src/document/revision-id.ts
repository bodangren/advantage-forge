import { createHash } from 'node:crypto';

import type { AssetDocument } from '../contracts/index.js';
import { canonicalSerialize } from './canonical.js';

/** Returns a deterministic revision identity derived only from canonical document bytes. */
export function contentRevisionId(document: AssetDocument): string {
  return `revision.${createHash('sha256')
    .update(canonicalSerialize(document))
    .digest('hex')}`;
}
