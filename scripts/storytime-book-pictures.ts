import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  REDACTED_ERROR_MAX_CHARS,
  redactSecrets,
  runHeavyCommand,
  runStorytimeCli,
} from '../src/storytime/book-pictures.js';
import { holdHeavyLock } from './heavy-lock.js';

const HEAVY_RUN = '/home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh';
const HEAVY_PREFLIGHT = '/home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-preflight.sh';
const INNER_MARKER = 'STORYTIME_BOOK_PICTURES_INNER';

export interface StorytimeWrapperDependencies {
  preflight?: () => number | Promise<number>;
  holdLock?: () => void;
  pipeline?: (argv: string[]) => Promise<number>;
  /** The `spawnSync` seam of the heavy-run call; tests inject it, production defaults to `spawnSync`. */
  spawn?: typeof spawnSync;
  /** RB2-01: the final CLI error boundary; production binds `console.error`. */
  errorLog?: (message: string) => void;
}

/**
 * RB2-01: the final CLI boundary. It returns the exit code, and a rejected pipeline reaches the
 * log only through the same redaction and 500-character limit as the provider ledger errors.
 * Production calls it with no dependencies, so the error log binds `console.error`.
 */
export async function runStorytimeBookPicturesEntry(
  argv: string[],
  dependencies: StorytimeWrapperDependencies = {},
): Promise<number> {
  try {
    const { pipeline, preflight, holdLock, spawn: spawnDependency } = dependencies;
    if (
      pipeline !== undefined &&
      preflight === undefined &&
      holdLock === undefined &&
      spawnDependency === undefined
    ) {
      // An injected pipeline with no wrapper dependency runs directly, so no test starts a
      // process; production enters with no dependencies and keeps the heavy-run wrapper.
      return await pipeline(argv);
    }
    return await runStorytimeBookPictures(argv, dependencies);
  } catch (error) {
    const message = redactSecrets(error instanceof Error ? error.message : String(error)).slice(
      0,
      REDACTED_ERROR_MAX_CHARS,
    );
    const errorLog = dependencies.errorLog ?? ((text: string) => console.error(text));
    errorLog(message.length > 0 ? message : 'The command failed; the error text is redacted.');
    return 1;
  }
}

export async function runStorytimeBookPictures(
  argv: string[],
  dependencies: StorytimeWrapperDependencies = {},
): Promise<number> {
  const pipeline = dependencies.pipeline ?? ((args: string[]) => runStorytimeCli(args));
  if (argv[0] !== 'render' || argv.includes('--dry-run')) return pipeline(argv);
  // The inner run inside heavy-run.sh executes the pipeline directly; the wrapper already holds the lock.
  if (process.env[INNER_MARKER] === '1') return pipeline(argv);
  // Injected dependencies keep the order rule testable: preflight, then lock, then pipeline.
  if (dependencies.preflight !== undefined || dependencies.holdLock !== undefined) {
    return runHeavyCommand({
      preflight:
        dependencies.preflight ?? (() => spawnSync('sh', [HEAVY_PREFLIGHT], { stdio: 'inherit' }).status ?? 1),
      holdLock: dependencies.holdLock ?? holdHeavyLock,
      run: () => pipeline(argv),
      onHold: (status) => console.log(`heavy preflight: hold (${status}); book render stopped`),
    });
  }
  // The PM's one heavy command: heavy-run.sh takes the lock, runs the pre-flight inside the
  // lock with retries, and then runs this command. Never wrap it in a plain flock.
  // RB-01: the argument form. Each CLI argument stays one array element, so bash never
  // expands command substitutions in a render argument. The inner marker travels in `env`.
  const script = fileURLToPath(import.meta.url);
  const spawnSyncFn = dependencies.spawn ?? spawnSync;
  const result = spawnSyncFn(
    'bash',
    [HEAVY_RUN, process.execPath, '--import', 'tsx', script, ...argv],
    { stdio: 'inherit', env: { ...process.env, [INNER_MARKER]: '1' } },
  );
  return result.status ?? 1;
}

const entry = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (entry === import.meta.url) {
  // RB2-01: the production entry reaches the log only through the sanitizing boundary.
  runStorytimeBookPicturesEntry(process.argv.slice(2)).then((code) => {
    process.exitCode = code;
  });
}
