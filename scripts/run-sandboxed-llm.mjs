import { execFileSync, spawn } from 'node:child_process';
import console from 'node:console';
import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import { clearTimeout, setTimeout } from 'node:timers';

export const SUPPORTED_LOADOUTS = ['guard', 'traveler', 'ranger', 'caster'];

const LOADOUT_ACCESSORIES = {
  guard: [
    ['equipment.helmet.iron', 'head'],
    ['equipment.spear', 'main-hand'],
    ['equipment.shield.kite', 'off-hand'],
    ['equipment.armor.mail', 'body'],
  ],
  traveler: [
    ['equipment.hood.cloth', 'head'],
    ['equipment.staff', 'main-hand'],
    ['equipment.backpack', 'back'],
  ],
  ranger: [
    ['equipment.spear', 'main-hand'],
    ['equipment.armor.leather', 'body'],
    ['equipment.quiver', 'back'],
    ['equipment.pouch.belt', 'waist'],
  ],
  caster: [
    ['equipment.hood.cloth', 'head'],
    ['equipment.staff', 'main-hand'],
    ['equipment.cape', 'back'],
    ['equipment.pouch.belt', 'waist'],
  ],
};

const DEFAULT_INSPECTOR_URL = 'http://127.0.0.1:4173';
const DEFAULT_MODEL = 'kimi-for-coding/k3';
const DEFAULT_PROVIDER = 'kimi-for-coding';
const FIRST_EVENT_TIMEOUT_MS = 240_000;
const TOTAL_TIMEOUT_MS = 900_000;

/**
 * @param {string} loadoutId
 * @returns {boolean}
 */
export function isSupportedLoadout(loadoutId) {
  return SUPPORTED_LOADOUTS.includes(loadoutId);
}

/**
 * @param {{ repo: string; runtimeDir: string }} options
 * @returns {object}
 */
export function buildClientConfig({
  repo,
  runtimeDir,
  workspaceDir = runtimeDir,
}) {
  return {
    $schema: 'https://opencode.ai/config.json',
    instructions: ['workflow/SKILL.md', 'workflow/references/*.md'],
    permission: { '*': 'deny', 'forge_*': 'allow' },
    mcp: {
      forge: {
        type: 'local',
        command: [
          'env',
          '-C',
          workspaceDir,
          'node',
          '--import',
          'tsx',
          resolve(repo, 'src/mcp/stdio.ts'),
        ],
        enabled: true,
        environment: { FORGE_INSPECTOR_URL: DEFAULT_INSPECTOR_URL },
        timeout: 30000,
      },
    },
  };
}

/**
 * @param {{ loadoutId: string }} options
 * @returns {string}
 */
export function buildPrompt({ loadoutId }) {
  const accessories = LOADOUT_ACCESSORIES[loadoutId];
  if (accessories === undefined) {
    throw new Error(`Unsupported loadout: ${loadoutId}`);
  }
  const accessoryPhrase = accessories
    .map(([templateId, slot]) => `${templateId} in ${slot}`)
    .join(', ');
  return `Use only the configured Fantasy Asset Forge MCP tools (forge_*) and the supplied workflow instructions. Do not read or search project files, run shell commands, construct canonical asset JSON, edit source, post-process images, or use network tools.

Build and audit the ${loadoutId} reference loadout on a newly created adventurer. The exact requested loadout is ${accessoryPhrase}. Use archetypeId ${loadoutId} for every accessory discovery and mutation.

First inspect the exact runtime capabilities needed for the adventurer reference, accessory discovery and task-level operations, immutable revision comparison, static rigid poses, eight-direction transparent 128x128 sprites, a labeled contact sheet, and GLB. List the kit, create the adventurer reference, and record its baseline revision. Inspect its overview, parts, poses, and renderProfiles with bounded public calls. Render the untouched baseline.

Plan the whole loadout through search_accessories. For each requested slot, select the exact requested templateId from the public result and inspect that template. Treat the returned usage, placement, intended orientation, visual checks, required features, compatibility, and complete exampleOperation as authoritative. Never invent a part ID, port, transform, rotation, material, or operation. If a slot is occupied, use the returned replacement operation; do not work around it. Dry-run each complete exampleOperation against the current revision, verify its affected IDs, then replay it byte-for-byte with only dryRun changed from true to false. Record every returned part ID and revision.

With all requested accessories equipped in idle pose, inspect parts and renderProfiles, compare the baseline revision to the equipped-idle revision, validate, render, and export GLB. Assess the returned eight-frame metrics against each selected candidate's public requiredFeatures and visualChecks, but do not claim you visually opened an image.

Then dry-run the action pose and replay the identical request with only dryRun false. Record the action revision, compare idle to action, validate, render all eight directions, and export GLB. After that, unequip every accessory part added for this loadout, one at a time using revision-bound dry-run/apply pairs. Record the unequipped revision, compare action to unequipped, validate, render, and export GLB.

Report the chronological revision lineage; exact affected and preserved IDs; every dry-run/apply pair; accessory feature and directional metric findings; validation and returned artifact paths; retries or corrections; unsupported capabilities; and limitations. Explicitly label interactive 3D review, contact-sheet visual review, actual 128x128 visual review, independent artifact verification, representative importer testing, and external game-engine import Not Assessed because this source-free authoring client has no browser, image, shell, or file-reading tools. A successful render call is not visual inspection. Give an honest pass, partial, fail, or blocked client verdict.`;
}

/**
 * @param {{
 *   toolCount: number;
 *   nonForgeToolCount: number;
 *   sessionId: string | null;
 *   code: number | null;
 *   signal: string | null;
 *   finalClientResponsePresent: boolean;
 * }} run
 * @returns {{ verdict: string; category: string }}
 */
export function classifyRun({
  toolCount,
  nonForgeToolCount,
  sessionId,
  code,
  signal,
  finalClientResponsePresent,
}) {
  const hasAnyEvent =
    toolCount > 0 || sessionId !== null || finalClientResponsePresent;

  if (!hasAnyEvent) {
    return { verdict: 'not-assessed', category: 'infrastructure' };
  }

  if (nonForgeToolCount > 0) {
    return { verdict: 'fail', category: 'product' };
  }

  if (signal !== null) {
    return { verdict: 'blocked', category: 'product' };
  }

  if (code !== 0) {
    return { verdict: 'fail', category: 'product' };
  }

  if (!finalClientResponsePresent) {
    return { verdict: 'partial', category: 'product' };
  }

  return { verdict: 'pass', category: 'product' };
}

function parseArgs(argv) {
  const args = { loadout: undefined, out: undefined, model: DEFAULT_MODEL };
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (flag === '--loadout') {
      args.loadout = argv[index + 1];
      index += 1;
    } else if (flag === '--out') {
      args.out = argv[index + 1];
      index += 1;
    } else if (flag === '--model') {
      args.model = argv[index + 1];
      index += 1;
    }
  }
  return args;
}

async function main() {
  const { loadout: loadoutId, out: evidenceDir, model } = parseArgs(
    process.argv.slice(2),
  );

  if (loadoutId === undefined || evidenceDir === undefined) {
    console.error('Usage: node run-sandboxed-llm.mjs --loadout <id> --out <dir> [--model <model>]');
    process.exitCode = 1;
    return;
  }

  if (!isSupportedLoadout(loadoutId)) {
    console.error(`Unsupported loadout: ${loadoutId}`);
    process.exitCode = 1;
    return;
  }

  const repo = resolve(import.meta.dirname, '..');
  const startedAt = new Date();
  const runTimestamp = startedAt.toISOString().replace(/[:.]/g, '').slice(0, 15);
  const clientDir = `/tmp/faf-s4-${runTimestamp}-${loadoutId}-client`;
  const runtimeDir = `/tmp/faf-s4-${runTimestamp}-${loadoutId}-runtime`;

  const prompt = buildPrompt({ loadoutId });
  const promptSha256 = sha(prompt);
  const config = buildClientConfig({ repo, runtimeDir, workspaceDir: evidenceDir });

  await mkdir(evidenceDir, { recursive: true });
  await mkdir(clientDir, { recursive: true });
  await mkdir(runtimeDir, { recursive: true });
  await cp(resolve(repo, '.agents/skills/fantasy-asset-workflow'), resolve(clientDir, 'workflow'), {
    recursive: true,
  });

  await writeFile(resolve(clientDir, 'opencode.json'), `${JSON.stringify(config, null, 2)}\n`);
  await writeFile(resolve(clientDir, 'prompt.txt'), `${prompt}\n`);
  await writeFile(resolve(evidenceDir, 'opencode-config.json'), `${JSON.stringify(config, null, 2)}\n`);
  await writeFile(
    resolve(evidenceDir, 'prompt.md'),
    `# ${loadoutId} source-free authoring request\n\nSHA-256 of the exact request: \`${promptSha256}\`\n\n${prompt}\n`,
  );

  const args = [
    'run',
    '--pure',
    '--format',
    'json',
    '--model',
    model,
    '--title',
    `S4 ${loadoutId} source-free MCP acceptance`,
    prompt,
  ];
  const eventsPath = resolve(evidenceDir, 'events.jsonl');
  const stderrPath = resolve(evidenceDir, 'stderr.log');
  const child = spawn('opencode', args, {
    cwd: clientDir,
    env: {
      ...process.env,
      HOME: clientDir,
      XDG_CONFIG_HOME: resolve(clientDir, '.config'),
      XDG_CACHE_HOME: resolve(runtimeDir, 'cache'),
      XDG_DATA_HOME: resolve(runtimeDir, 'data'),
      XDG_STATE_HOME: resolve(runtimeDir, 'state'),
    },
  });
  let timeoutReason = null;
  let sawFirstEvent = false;
  const stopChild = (reason) => {
    timeoutReason = reason;
    child.kill('SIGTERM');
    setTimeout(() => {
      if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
    }, 5_000).unref();
  };
  const firstEventTimer = setTimeout(
    () => stopChild('first-event-timeout'),
    FIRST_EVENT_TIMEOUT_MS,
  );
  const totalTimer = setTimeout(
    () => stopChild('total-runtime-timeout'),
    TOTAL_TIMEOUT_MS,
  );
  child.stdout.once('data', () => {
    sawFirstEvent = true;
    clearTimeout(firstEventTimer);
  });
  child.stdout.pipe(createWriteStream(eventsPath));
  child.stderr.pipe(createWriteStream(stderrPath));
  const { code, signal } = await new Promise((done) =>
    child.on('close', (childCode, childSignal) => done({ code: childCode, signal: childSignal })),
  );
  clearTimeout(firstEventTimer);
  clearTimeout(totalTimer);
  const endedAt = new Date();

  const rawEvents = await readFile(eventsPath, 'utf8');
  const malformedEvents = [];
  const events = rawEvents
    .split('\n')
    .filter(Boolean)
    .flatMap((line, index) => {
      try {
        return [JSON.parse(line)];
      } catch (error) {
        malformedEvents.push({ line: index + 1, error: String(error) });
        return [];
      }
    });
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
    } catch {
      // Keep envelope null on parse failure.
    }
    return {
      sequence: index + 1,
      callId: event.part?.callID ?? null,
      tool: event.part?.tool ?? null,
      startedAt: state.time?.start ? new Date(state.time.start).toISOString() : null,
      elapsedOffsetSeconds:
        state.time?.start !== undefined
          ? Number(((state.time.start - startedAt.getTime()) / 1000).toFixed(3))
          : null,
      durationMs:
        state.time?.start !== undefined && state.time?.end !== undefined
          ? state.time.end - state.time.start
          : null,
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
      const dryInput = JSON.parse(JSON.stringify(dry.input));
      const applyInput = JSON.parse(JSON.stringify(apply.input));
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
  const finalClientResponse =
    textEvents.at(-1)?.part?.text ?? 'Not assessed: no final text event was emitted.';

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
  await writeFile(
    resolve(evidenceDir, 'semantic-comparisons.json'),
    `${JSON.stringify(comparisons, null, 2)}\n`,
  );
  await writeFile(
    resolve(evidenceDir, 'client-final-response.md'),
    `# Client conclusion\n\n${finalClientResponse}\n`,
  );
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

  const gitStatus = execFileSync('git', ['status', '--porcelain=v1'], {
    cwd: repo,
    encoding: 'utf8',
  });
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
    provider: DEFAULT_PROVIDER,
    model,
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
    sawFirstEvent,
    timeoutReason,
    malformedEventCount: malformedEvents.length,
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

  console.log(
    JSON.stringify({
      loadoutId,
      code,
      signal,
      sessionId,
      toolCount: calls.length,
      nonForgeToolCount: nonForgeTools.length,
    }),
  );
  if (code !== 0 || nonForgeTools.length > 0) process.exitCode = 1;
}

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

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  await main();
}
