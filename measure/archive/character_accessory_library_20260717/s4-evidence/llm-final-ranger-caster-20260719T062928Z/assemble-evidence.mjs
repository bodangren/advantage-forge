import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname);
const runs = [
  {
    id: 'ranger',
    sessionId: 'ses_086eb8a99ffeM5eVVflQpzvssT',
    startedAt: '2026-07-19T06:32:44.397Z',
    endedAt: '2026-07-19T06:47:28.054Z',
    candidateCommit: '2fcbd31e0728163d5f04601066e09fad21ddb2f8',
    candidateRelevantDiffSha256:
      '680c9ba5b848a2b934af6b098087c7f44c0405ccea65113963b8930d35c692e2',
    diffHashScope: [
      'src/fantasy-kit/accessories.ts',
      'src/fantasy-kit/loadouts.ts',
      'src/contracts/schemas.ts',
    ],
    clientVerdict: 'partial',
    independentArtifactAudits: {
      equippedIdle: {
        artifactVerifier: 'pass',
        representativeThreeJsImporter: 'pass',
      },
      equippedAction: {
        artifactVerifier: 'not-assessed',
        representativeThreeJsImporter: 'not-assessed',
        reason: 'The LLM run did not produce an action GLB after four MCP timeouts.',
      },
    },
    correctionSummary: [
      'Initial shield unequip with archetype ranger was rejected; runtime guidance required retrying that response-derived shield part under archetype adventurer.',
      'Equipped-action export_asset timed out four times; no action GLB was claimed.',
    ],
  },
  {
    id: 'caster',
    sessionId: 'ses_086ddf094ffebgXzREdKAT1C3Q',
    startedAt: '2026-07-19T06:47:41.874Z',
    endedAt: '2026-07-19T06:57:12.836Z',
    candidateCommit: '2fcbd31e0728163d5f04601066e09fad21ddb2f8',
    candidateRelevantDiffSha256:
      'bea3b130b86a6f5c1fb9c4d60f7dcd247e5d469bf319e6594ba3f6fc3d8b83a3',
    diffHashScope: [
      'src/fantasy-kit/accessories.ts',
      'src/fantasy-kit/loadouts.ts',
      'src/contracts/schemas.ts',
      'src/render/sprites.ts',
      'src/export/glb.ts',
    ],
    clientVerdict: 'partial',
    independentArtifactAudits: {
      equippedIdle: {
        artifactVerifier: 'pass',
        representativeThreeJsImporter: 'pass',
      },
      equippedAction: {
        artifactVerifier: 'pass',
        representativeThreeJsImporter: 'pass',
      },
    },
    correctionSummary: [
      'Initial staff replacement under archetype caster was rejected because the still-equipped default shield is caster-incompatible.',
      'Shield unequip under archetype caster was also rejected; runtime guidance required removing that response-derived shield part under archetype adventurer before caster operations could continue.',
    ],
  },
];

const summaries = [];
for (const run of runs) {
  const runRoot = resolve(root, run.id);
  const lines = (await readFile(resolve(runRoot, 'events.jsonl'), 'utf8'))
    .trim()
    .split('\n')
    .filter(Boolean);
  const events = lines.map((line) => JSON.parse(line));
  const texts = events
    .filter((event) => event.type === 'text')
    .map((event) => event.part.text);
  const toolEvents = events.filter((event) => event.type === 'tool_use');
  const calls = toolEvents.map((event, index) => callRecord(event, index + 1));
  const dryRunApplyPairs = pairCalls(calls);
  const nonForgeTools = calls
    .filter(({ tool }) => !tool.startsWith('forge_'))
    .map(({ tool }) => tool);
  const rejectedCalls = calls
    .filter(({ ok }) => ok !== true)
    .map(({ sequence, callId, tool, summary, error }) => ({
      sequence,
      callId,
      tool,
      summary,
      error,
    }));
  const paths = [...new Set(calls.flatMap(({ envelope }) => artifactPaths(envelope)))];
  const prompt = await readFile(resolve(runRoot, 'prompt.txt'));
  const config = await readFile(resolve(runRoot, 'opencode-config.json'));
  const started = Date.parse(run.startedAt);
  const ended = Date.parse(run.endedAt);
  const metadata = {
    client: 'OpenCode',
    clientVersion: '1.18.3',
    provider: 'kimi-for-coding',
    model: 'k3',
    candidateCommit: run.candidateCommit,
    candidateRelevantDiffSha256: run.candidateRelevantDiffSha256,
    diffHashScope: run.diffHashScope,
    candidateIdentityCaveat:
      'The candidate was a dirty Measure implementation worktree. The tracked commit and explicitly scoped pre-launch diff hash are both recorded; runtime responses and immutable artifact revisions are authoritative for observed behavior.',
    clientWorkspace: `/tmp/faf-s4-k3-${run.id}-20260719T062928Z-client`,
    runtimeWorkspace: `/tmp/faf-s4-k3-${run.id}-20260719T062928Z-runtime`,
    startedAt: run.startedAt,
    endedAt: run.endedAt,
    elapsedSeconds: (ended - started) / 1000,
    code: 0,
    signal: null,
    sessionId: run.sessionId,
    promptSha256: sha256(prompt),
    configSha256: sha256(config),
    invocation: [
      'opencode',
      'run',
      '--pure',
      '--format',
      'json',
      '--model',
      'kimi-for-coding/k3',
      '--title',
      `Fantasy Asset Forge S4 ${capital(run.id)} acceptance`,
      '<exact prompt.txt bytes>',
    ],
    builtInPermissionDefault: 'deny',
    allowedToolPattern: 'forge_*',
    configuredMcpServers: ['forge'],
    sourceFreeClientWorkspace: true,
    eventCount: events.length,
    toolCount: calls.length,
    nonForgeToolCount: nonForgeTools.length,
    rejectedToolCount: rejectedCalls.length,
    dryRunApplyPairCount: dryRunApplyPairs.length,
    exactDryRunApplyPairCount: dryRunApplyPairs.filter(
      ({ identicalExceptDryRun }) => identicalExceptDryRun,
    ).length,
    correctionSummary: run.correctionSummary,
    clientVerdict: run.clientVerdict,
    independentArtifactAudits: run.independentArtifactAudits,
    visualReviewStatus: 'Not Assessed',
    visualReviewReason:
      'The deny-all client exposed only forge_* tools, so it could record returned metrics and paths but could not directly open the interactive 3D view, contact sheet, native PNGs, or an independent GLB importer.',
  };
  const ledger = {
    sessionId: run.sessionId,
    toolCount: calls.length,
    nonForgeTools,
    rejectedCalls,
    dryRunApplyPairs,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    calls: calls.map(({ envelope: _envelope, ...call }) => call),
  };
  const visualStatus = {
    sessionId: run.sessionId,
    interactive3d: 'Not Assessed',
    contactSheet: 'Not Assessed',
    native128pxFrames: 'Not Assessed',
    independentGlbImporter:
      'Assessed independently only for GLBs that the LLM run produced; see independentArtifactAudits.',
    artifactVerifier:
      'Assessed independently only for complete render/GLB pairs that the LLM run produced; see independentArtifactAudits.',
    independentArtifactAudits: run.independentArtifactAudits,
    returnedMetricEvidence:
      'Recorded in raw tool responses and client-final-report.md; metric evidence is not treated as direct visual observation.',
    reason: metadata.visualReviewReason,
  };
  const clientReport = `${texts.at(-1)?.trim() ?? 'No final client report was emitted.'}\n`;
  await writeJson(resolve(runRoot, 'tool-ledger.json'), ledger);
  await writeJson(resolve(runRoot, 'run-metadata.json'), metadata);
  await writeJson(resolve(runRoot, 'visual-review-status.json'), visualStatus);
  await writeFile(resolve(runRoot, 'client-final-report.md'), clientReport);
  summaries.push({
    loadoutId: run.id,
    sessionId: run.sessionId,
    clientVerdict: run.clientVerdict,
    toolCount: calls.length,
    nonForgeToolCount: nonForgeTools.length,
    rejectedToolCount: rejectedCalls.length,
    dryRunApplyPairCount: dryRunApplyPairs.length,
    exactDryRunApplyPairCount: dryRunApplyPairs.filter(
      ({ identicalExceptDryRun }) => identicalExceptDryRun,
    ).length,
    artifactPaths: paths,
    corrections: run.correctionSummary,
    visualReviewStatus: 'Not Assessed',
    independentArtifactAudits: run.independentArtifactAudits,
  });
}

await writeJson(resolve(root, 'summary.json'), {
  model: 'kimi-for-coding/k3',
  isolation: 'two independent deny-all OpenCode clients exposing only forge_*',
  deterministicHarnessClaimedAsLlm: false,
  runs: summaries,
});

function callRecord(event, sequence) {
  const { part } = event;
  const { state } = part;
  let envelope;
  if (state.status === 'completed') envelope = parseJson(state.output);
  else envelope = parseJson(state.error);
  const started = state.time?.start;
  const ended = state.time?.end;
  return {
    sequence,
    callId: part.callID,
    tool: part.tool,
    startedAt:
      typeof started === 'number' ? new Date(started).toISOString() : null,
    durationMs:
      typeof started === 'number' && typeof ended === 'number'
        ? ended - started
        : null,
    input: state.input,
    resultStatus: state.status,
    ok: envelope?.ok === true,
    revisionId: envelope?.revisionId ?? null,
    affectedIds: envelope?.affectedIds ?? [],
    summary:
      envelope?.summary ??
      (typeof state.error === 'string' ? state.error : 'Tool call failed.'),
    issues: envelope?.issues ?? [],
    error: state.status === 'error' ? state.error : null,
    envelope,
  };
}

function pairCalls(calls) {
  const used = new Set();
  const pairs = [];
  for (const dry of calls) {
    if (dry.input?.dryRun !== true || dry.ok !== true) continue;
    const dryBase = withoutDryRun(dry.input);
    const apply = calls.find(
      (candidate) =>
        candidate.sequence > dry.sequence &&
        !used.has(candidate.sequence) &&
        candidate.tool === dry.tool &&
        candidate.input?.dryRun === false &&
        candidate.ok === true &&
        canonical(withoutDryRun(candidate.input)) === canonical(dryBase),
    );
    if (apply === undefined) continue;
    used.add(apply.sequence);
    pairs.push({
      dryRunSequence: dry.sequence,
      applySequence: apply.sequence,
      tool: dry.tool,
      identicalExceptDryRun: true,
      expectedRevisionId: dry.input.expectedRevisionId ?? null,
      dryRunRevisionId: dry.revisionId,
      applyRevisionId: apply.revisionId,
    });
  }
  return pairs;
}

function withoutDryRun(input) {
  const copy = globalThis.structuredClone(input);
  delete copy.dryRun;
  return copy;
}

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value !== null && typeof value === 'object')
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`)
      .join(',')}}`;
  return JSON.stringify(value);
}

function artifactPaths(value) {
  const paths = [];
  visit(value);
  return paths;
  function visit(current, key = '') {
    if (typeof current === 'string') {
      if (/path$/i.test(key) && current.startsWith('/')) paths.push(current);
      return;
    }
    if (Array.isArray(current)) {
      for (const item of current) visit(item, key);
      return;
    }
    if (current !== null && typeof current === 'object')
      for (const [childKey, child] of Object.entries(current))
        visit(child, childKey);
  }
}

function parseJson(value) {
  if (typeof value !== 'string') return undefined;
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function capital(value) {
  return `${value[0].toUpperCase()}${value.slice(1)}`;
}

async function writeJson(path, value) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}
