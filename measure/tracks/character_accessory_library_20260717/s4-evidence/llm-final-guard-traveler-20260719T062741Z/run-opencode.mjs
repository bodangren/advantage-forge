import { execFileSync, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { resolve } from 'node:path';

const RUN_ID = '20260719T062741Z';
const repo = resolve(import.meta.dirname, '../../../../..');
const evidenceRoot = import.meta.dirname;
const loadoutId = process.argv[2];
const attemptId = process.argv[3] ?? 'final';

const loadouts = {
  guard: {
    archetype: 'guard',
    accessories:
      'equipment.helmet.iron in head, equipment.spear in main-hand, equipment.shield.kite in off-hand, and equipment.armor.mail in body',
  },
  traveler: {
    archetype: 'traveler',
    accessories:
      'equipment.hood.cloth in head, equipment.staff in main-hand, and equipment.backpack in back',
  },
};

if (!(loadoutId in loadouts)) {
  throw new Error('Usage: node run-opencode.mjs <guard|traveler>');
}

const run = loadouts[loadoutId];
const evidenceDir = resolve(evidenceRoot, loadoutId);
const clientDir = `/tmp/faf-s4-${RUN_ID}-${loadoutId}-${attemptId}-client`;
const runtimeDir = `/tmp/faf-s4-${RUN_ID}-${loadoutId}-${attemptId}-runtime`;
const prompt = `Use only the configured Fantasy Asset Forge MCP tools and the supplied workflow instructions. Do not read or search project files, run shell commands, construct canonical asset JSON, edit source, post-process images, or use network tools.

Build and audit the ${loadoutId} reference loadout on a newly created adventurer. The exact requested loadout is ${run.accessories}. Use archetypeId ${run.archetype} for every accessory discovery and mutation.

First inspect the exact runtime capabilities needed for the adventurer reference, accessory discovery and task-level operations, immutable revision comparison, static rigid poses, eight-direction transparent 128x128 sprites, a labeled contact sheet, and GLB. List the kit, create the adventurer reference, and record its baseline revision. Inspect its overview, parts, poses, and renderProfiles with bounded public calls. Render the untouched baseline.

Plan the whole loadout through search_accessories. For each requested slot, select the exact requested templateId from the public result and inspect that template. Treat the returned usage, placement, intended orientation, visual checks, required features, compatibility, and complete exampleOperation as authoritative. Never invent a part ID, port, transform, rotation, material, or operation. If a slot is occupied, use the returned replacement operation; do not work around it. Dry-run each complete exampleOperation against the current revision, verify its affected IDs, then replay it byte-for-byte with only dryRun changed from true to false. Record every returned part ID and revision.

With all requested accessories equipped in idle pose, inspect parts and renderProfiles, compare the baseline revision to the equipped-idle revision, validate, render, and export GLB. Assess the returned eight-frame metrics against each selected candidate's public requiredFeatures and visualChecks, but do not claim you visually opened an image.

Then dry-run the action pose and replay the identical request with only dryRun false. Record the action revision, compare idle to action, validate, render all eight directions, and export GLB. After that, unequip every accessory part added for this loadout, one at a time using revision-bound dry-run/apply pairs. Record the unequipped revision, compare action to unequipped, validate, render, and export GLB.

Report the chronological revision lineage; exact affected and preserved IDs; every dry-run/apply pair; accessory feature and directional metric findings; validation and returned artifact paths; retries or corrections; unsupported capabilities; and limitations. Explicitly label interactive 3D review, contact-sheet visual review, actual 128x128 visual review, independent artifact verification, representative importer testing, and external game-engine import Not Assessed because this source-free authoring client has no browser, image, shell, or file-reading tools. A successful render call is not visual inspection. Give an honest pass, partial, fail, or blocked client verdict.`;

await mkdir(evidenceDir, { recursive: true });
await mkdir(clientDir, { recursive: true });
await mkdir(runtimeDir, { recursive: true });
await cp(resolve(repo, '.agents/skills/fantasy-asset-workflow'), resolve(clientDir, 'workflow'), {
  recursive: true,
});

const config = {
  $schema: 'https://opencode.ai/config.json',
  instructions: ['workflow/SKILL.md', 'workflow/references/*.md'],
  permission: { '*': 'deny', 'forge_*': 'allow' },
  mcp: {
    forge: {
      type: 'local',
      command: [
        'env',
        '-C',
        runtimeDir,
        resolve(repo, 'node_modules/.bin/tsx'),
        resolve(repo, 'src/mcp/stdio.ts'),
      ],
      enabled: true,
      environment: { FORGE_INSPECTOR_URL: 'http://127.0.0.1:4173' },
      timeout: 30000,
    },
  },
};

const promptSha256 = sha(prompt);
await writeFile(resolve(clientDir, 'opencode.json'), `${JSON.stringify(config, null, 2)}\n`);
await writeFile(resolve(clientDir, 'prompt.txt'), `${prompt}\n`);
await writeFile(resolve(evidenceDir, 'opencode-config.json'), `${JSON.stringify(config, null, 2)}\n`);
await writeFile(
  resolve(evidenceDir, 'prompt.md'),
  `# ${loadoutId} source-free authoring request\n\nSHA-256 of the exact request: \`${promptSha256}\`\n\n${prompt}\n`,
);

const startedAt = new Date();
const args = [
  'run',
  '--pure',
  '--format',
  'json',
  '--model',
  'kimi-for-coding/k3',
  '--title',
  `S4 ${loadoutId} source-free MCP acceptance`,
  prompt,
];
const eventsPath = resolve(evidenceDir, 'events.jsonl');
const stderrPath = resolve(evidenceDir, 'stderr.log');
const child = spawn('opencode', args, { cwd: clientDir, env: process.env });
child.stdout.pipe(createWriteStream(eventsPath));
child.stderr.pipe(createWriteStream(stderrPath));
const { code, signal } = await new Promise((done) =>
  child.on('close', (childCode, childSignal) => done({ code: childCode, signal: childSignal })),
);
const endedAt = new Date();

const rawEvents = await readFile(eventsPath, 'utf8');
const events = rawEvents
  .split('\n')
  .filter(Boolean)
  .map((line) => JSON.parse(line));
const sessionId = events.find((event) => typeof event.sessionID === 'string')?.sessionID ?? null;
let sessionExportStatus = 'not-assessed';
if (sessionId !== null) {
  try {
    const session = execFileSync('opencode', ['export', sessionId], {
      cwd: clientDir,
      encoding: 'utf8',
      maxBuffer: 100 * 1024 * 1024,
    });
    await writeFile(resolve(evidenceDir, 'session.json'), session);
    sessionExportStatus = 'completed';
  } catch (error) {
    await writeFile(resolve(evidenceDir, 'session-export-error.txt'), String(error));
    sessionExportStatus = 'failed';
  }
}

const toolEvents = events.filter((event) => event.type === 'tool_use');
const calls = toolEvents.map((event, index) => {
  const state = event.part?.state ?? {};
  let envelope = null;
  try {
    envelope = typeof state.output === 'string' ? JSON.parse(state.output) : null;
  } catch {}
  return {
    sequence: index + 1,
    callId: event.part?.callID ?? null,
    tool: event.part?.tool ?? null,
    startedAt: state.time?.start ? new Date(state.time.start).toISOString() : null,
    elapsedOffsetSeconds: state.time?.start
      ? Number(((state.time.start - startedAt.getTime()) / 1000).toFixed(3))
      : null,
    durationMs:
      state.time?.start && state.time?.end ? state.time.end - state.time.start : null,
    input: state.input ?? null,
    resultStatus: state.status ?? null,
    ok: envelope?.ok ?? null,
    revisionId: envelope?.revisionId ?? null,
    affectedIds: envelope?.affectedIds ?? [],
    summary: envelope?.summary ?? null,
    issues: envelope?.issues ?? [],
    rawOutput: state.output ?? null,
  };
});
const nonForgeTools = calls.filter((call) => !String(call.tool).startsWith('forge_'));
const dryRunApplyPairs = [];
for (let index = 0; index < calls.length - 1; index += 1) {
  const dry = calls[index];
  const apply = calls[index + 1];
  if (dry.input?.dryRun === true && apply.input?.dryRun === false && dry.tool === apply.tool) {
    const dryInput = structuredClone(dry.input);
    const applyInput = structuredClone(apply.input);
    delete dryInput.dryRun;
    delete applyInput.dryRun;
    dryRunApplyPairs.push({
      dryRunSequence: dry.sequence,
      applySequence: apply.sequence,
      identicalExceptDryRun: JSON.stringify(dryInput) === JSON.stringify(applyInput),
    });
  }
}
const comparisons = calls
  .filter((call) => call.tool === 'forge_compare_revisions')
  .map((call) => ({ sequence: call.sequence, input: call.input, output: parseJson(call.rawOutput) }));
const textEvents = events.filter((event) => event.type === 'text' && event.part?.text);
const finalClientResponse = textEvents.at(-1)?.part?.text ?? 'Not assessed: no final text event was emitted.';

await writeFile(
  resolve(evidenceDir, 'tool-ledger.json'),
  `${JSON.stringify(
    {
      sessionId,
      toolCount: calls.length,
      nonForgeTools: nonForgeTools.map(({ sequence, tool }) => ({ sequence, tool })),
      dryRunApplyPairs,
      calls,
    },
    null,
    2,
  )}\n`,
);
await writeFile(resolve(evidenceDir, 'semantic-comparisons.json'), `${JSON.stringify(comparisons, null, 2)}\n`);
await writeFile(resolve(evidenceDir, 'client-final-response.md'), `# Client conclusion\n\n${finalClientResponse}\n`);
await writeFile(
  resolve(evidenceDir, 'visual-review-status.json'),
  `${JSON.stringify(
    {
      authoringClientStatus: 'not-assessed',
      reason:
        'The isolated client exposed only forge_* tools and had no browser, image, shell, or file-reading tool. Render metrics are not direct visual inspection.',
      interactive3d: 'not-assessed',
      contactSheetVisualReview: 'not-assessed',
      native128pxVisualReview: 'not-assessed',
      independentArtifactVerification: 'not-assessed',
      representativeImporter: 'not-assessed',
      externalGameEngineImport: 'not-assessed',
    },
    null,
    2,
  )}\n`,
);

const gitStatus = execFileSync('git', ['status', '--porcelain=v1'], { cwd: repo, encoding: 'utf8' });
const trackedDiff = execFileSync('git', ['diff', '--binary', 'HEAD'], {
  cwd: repo,
  encoding: 'utf8',
  maxBuffer: 100 * 1024 * 1024,
});
const metadata = {
  client: 'OpenCode',
  clientVersion: execFileSync('opencode', ['--version'], { encoding: 'utf8' }).trim(),
  candidateCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim(),
  workingTreeStatusAtEnd: gitStatus.split('\n').filter(Boolean),
  trackedWorkingTreeDiffSha256AtEnd: sha(trackedDiff),
  candidateKind: 'working-tree candidate with uncommitted production changes',
  clientWorkspace: clientDir,
  serverRuntime: runtimeDir,
  startedAt: startedAt.toISOString(),
  endedAt: endedAt.toISOString(),
  elapsedSeconds: Number(((endedAt - startedAt) / 1000).toFixed(3)),
  code,
  signal,
  provider: 'kimi-for-coding',
  model: 'k3',
  sessionId,
  promptSha256,
  invocation: ['opencode', ...args.slice(0, -1), '<exact prompt in prompt.md>'],
  builtInPermissionDefault: 'deny',
  allowedToolPattern: 'forge_*',
  configuredMcpServers: ['forge'],
  toolCount: calls.length,
  nonForgeToolCount: nonForgeTools.length,
  sessionExportStatus,
  finalClientResponsePresent: textEvents.length > 0,
};
await writeFile(resolve(evidenceDir, 'run-metadata.json'), `${JSON.stringify(metadata, null, 2)}\n`);

const inventoryFiles = [
  'prompt.md',
  'opencode-config.json',
  'events.jsonl',
  'stderr.log',
  ...(sessionExportStatus === 'completed' ? ['session.json'] : []),
  'tool-ledger.json',
  'semantic-comparisons.json',
  'client-final-response.md',
  'visual-review-status.json',
  'run-metadata.json',
];
const inventory = [];
for (const file of inventoryFiles) {
  const bytes = await readFile(resolve(evidenceDir, file));
  inventory.push(`${sha(bytes)}  ${file}`);
}
await writeFile(resolve(evidenceDir, 'sha256sums.txt'), `${inventory.join('\n')}\n`);

console.log(JSON.stringify({ loadoutId, code, signal, sessionId, toolCount: calls.length, nonForgeToolCount: nonForgeTools.length }));
if (code !== 0 || nonForgeTools.length > 0) process.exitCode = 1;

function sha(value) {
  return createHash('sha256').update(value).digest('hex');
}

function parseJson(value) {
  try {
    return typeof value === 'string' ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}
