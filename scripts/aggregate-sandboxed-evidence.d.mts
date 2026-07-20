export interface LoadoutResult {
  loadoutId: string;
  sessionId: string | null;
  verdict: string;
  category: string;
  idleRevisionId: string | null;
  actionRevisionId: string | null;
  expectedRevisionId: string | null;
  artifactAuditPath: string;
  glbAuditPath: string;
  elapsedSeconds: number | null;
  forgeCalls: number;
  nonForgeCalls: number;
}

export interface EvidenceSummary {
  ok: boolean;
  completedLoadoutCount: number;
  infrastructureNotAssessedCount: number;
  productFailureCount: number;
  totalForgeCalls: number;
  loadoutCount: number;
  loadoutResults: LoadoutResult[];
}

export declare function aggregateEvidence(root: string): Promise<EvidenceSummary>;
