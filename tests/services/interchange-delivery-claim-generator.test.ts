import { describe, expect, it } from 'vitest';

import { buildInterchangeDeliveryClaim } from '../../scripts/generate-interchange-delivery-claim.js';

describe('interchange delivery-claim generation', () => {
  it('produces identical canonical bytes and covers browser plus renderer inputs', async () => {
    const first = await buildInterchangeDeliveryClaim();
    const second = await buildInterchangeDeliveryClaim();

    expect(second).toEqual(first);
    const claim = JSON.parse(first.serialized) as {
      claim_sha256: string;
      implementation_files: Array<{ path: string }>;
    };
    expect(claim.claim_sha256).toBe(first.claim_sha256);
    expect(claim.implementation_files).toHaveLength(
      first.implementation_file_count,
    );
    expect(claim.implementation_files.map(({ path }) => path)).toEqual(
      expect.arrayContaining([
        'index.html',
        'scripts/replay-public-mcp-interchange.ts',
        'src/animation/rigid-animation.ts',
        'src/inspector/main.ts',
        'src/render/camera.ts',
        'src/scene/compiler.ts',
        'vite.config.ts',
      ]),
    );
  });
});
