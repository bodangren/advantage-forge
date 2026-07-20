export type LoadoutId = 'guard' | 'traveler' | 'ranger' | 'caster';

export declare const SUPPORTED_LOADOUTS: readonly LoadoutId[];

export declare function isSupportedLoadout(loadoutId: string): boolean;

export interface ClientConfig {
  $schema?: string;
  instructions: string[];
  permission: Record<string, 'allow' | 'deny'>;
  mcp: {
    forge: {
      type: 'local';
      command: string[];
      enabled: boolean;
      environment: { FORGE_INSPECTOR_URL: string };
      timeout: number;
    };
  };
}

export declare function buildClientConfig(options: {
  repo: string;
  runtimeDir: string;
  workspaceDir?: string;
}): ClientConfig;

export declare function buildPrompt(options: { loadoutId: LoadoutId }): string;

export type RunVerdict = 'pass' | 'partial' | 'fail' | 'blocked' | 'not-assessed';
export type RunCategory = 'product' | 'infrastructure';

export interface RunClassification {
  verdict: RunVerdict;
  category: RunCategory;
}

export declare function classifyRun(run: {
  toolCount: number;
  nonForgeToolCount: number;
  sessionId: string | null;
  code: number | null;
  signal: string | null;
  finalClientResponsePresent: boolean;
}): RunClassification;
