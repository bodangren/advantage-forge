import { describe, expect, it } from 'vitest';

// Intentionally import the production scripts that do not yet exist.
// The Red phase proves the contract surface is missing.
import {
  SUPPORTED_LOADOUTS,
  isSupportedLoadout,
  buildClientConfig,
  buildPrompt,
  classifyRun,
} from '../../scripts/run-sandboxed-llm.mjs';

describe('run-sandboxed-llm contract', () => {
  it('supports exactly the four required loadouts', () => {
    expect(SUPPORTED_LOADOUTS).toEqual([
      'guard',
      'traveler',
      'ranger',
      'caster',
    ]);
    for (const loadoutId of SUPPORTED_LOADOUTS) {
      expect(isSupportedLoadout(loadoutId)).toBe(true);
    }
    expect(isSupportedLoadout('guard-sword-shield')).toBe(false);
    expect(isSupportedLoadout('merchant')).toBe(false);
  });

  it('denies all permissions and allowlists only forge_*', () => {
    const repo = '/workspace/fantasy-asset-forge';
    const runtimeDir = '/tmp/faf-runtime';
    const config = buildClientConfig({ repo, runtimeDir });

    expect(config.permission).toEqual({ '*': 'deny', 'forge_*': 'allow' });

    const allowedPatterns = Object.entries(config.permission)
      .filter(([, value]) => value === 'allow')
      .map(([key]) => key);
    expect(allowedPatterns).toEqual(['forge_*']);

    const deniedPatterns = Object.entries(config.permission)
      .filter(([, value]) => value === 'deny')
      .map(([key]) => key);
    expect(deniedPatterns).toContain('*');
  });

  it('pins only the workflow skill instructions and a local forge MCP server', () => {
    const repo = '/workspace/fantasy-asset-forge';
    const runtimeDir = '/tmp/faf-runtime';
    const config = buildClientConfig({ repo, runtimeDir });

    expect(config.instructions).toEqual([
      'workflow/SKILL.md',
      'workflow/references/*.md',
    ]);

    expect(config.mcp).toBeDefined();
    expect(Object.keys(config.mcp)).toEqual(['forge']);

    const forge = config.mcp.forge;
    expect(forge.type).toBe('local');
    expect(forge.enabled).toBe(true);
    expect(forge.command).toContain('tsx');
    expect(
      forge.command.some((part: string) =>
        part.endsWith('src/mcp/stdio.ts'),
      ),
    ).toBe(true);
    expect(forge.environment.FORGE_INSPECTOR_URL).toMatch(
      /^http:\/\/127\.0\.0\.1:/,
    );
    expect(forge.timeout).toBeLessThanOrEqual(30000);
  });

  it('mentions the exact loadout accessories and forbids non-Forge tooling in the prompt', () => {
    const prompt = buildPrompt({ loadoutId: 'guard' });

    expect(prompt).toMatch(/guard/);
    expect(prompt).toMatch(/equipment\.helmet\.iron/);
    expect(prompt).toMatch(/equipment\.spear/);
    expect(prompt).toMatch(/equipment\.shield\.kite/);
    expect(prompt).toMatch(/equipment\.armor\.mail/);
    expect(prompt).toMatch(/Do not read or search project files/i);
    expect(prompt).toMatch(/forge_\*/i);
  });

  it('classifies zero-event infrastructure runs as not-assessed, not pass/fail', () => {
    const run = classifyRun({
      toolCount: 0,
      nonForgeToolCount: 0,
      sessionId: null,
      code: null,
      signal: null,
      finalClientResponsePresent: false,
    });

    expect(run.verdict).toBe('not-assessed');
    expect(run.category).toBe('infrastructure');
  });

  it('classifies a completed Forge-only session with a final response as product-assessable', () => {
    const run = classifyRun({
      toolCount: 3,
      nonForgeToolCount: 0,
      sessionId: 'sess-123',
      code: 0,
      signal: null,
      finalClientResponsePresent: true,
    });

    expect(run.category).toBe('product');
    expect(run.verdict).not.toBe('not-assessed');
  });

  it('classifies any non-Forge call as a product failure', () => {
    const run = classifyRun({
      toolCount: 3,
      nonForgeToolCount: 1,
      sessionId: 'sess-123',
      code: 0,
      signal: null,
      finalClientResponsePresent: true,
    });

    expect(run.category).toBe('product');
    expect(run.verdict).toBe('fail');
  });
});
