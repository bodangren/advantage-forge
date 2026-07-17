import { describe, expect, it } from 'vitest';
import { LocalBrowserArtifactService } from '../../src/services/index.js';

describe('local browser artifact service', () => {
  it('rejects output paths outside the active workspace', () => {
    expect(
      () =>
        new LocalBrowserArtifactService({
          workspaceRoot: '/tmp/forge',
          outputDirectory: '../escape',
        }),
    ).toThrow(/inside the active workspace/);
  });
  it('accepts a workspace-contained output directory without starting a browser', () => {
    expect(
      new LocalBrowserArtifactService({
        workspaceRoot: '/tmp/forge',
        outputDirectory: 'artifacts',
      }),
    ).toBeInstanceOf(LocalBrowserArtifactService);
  });
});
