import { pathToFileURL } from 'node:url';
import { parentPort, workerData } from 'node:worker_threads';
import { collectBodies, type AssetDefinition } from './asset.js';
import { makeContext, runTask, transferables, type Task } from './tasks.js';

const port = parentPort!;
const { source } = workerData as { source: string };
const def = ((await import(pathToFileURL(source).href)) as { default: AssetDefinition }).default;
const { root, pending } = await collectBodies(def);
const ctx = makeContext(def, root, pending);

port.on('message', async ({ i, task }: { i: number; task: Task }) => {
  try {
    const result = await runTask(task, ctx);
    port.postMessage({ i, result }, transferables(result));
  } catch (error) {
    port.postMessage({ i, error: (error as Error).message });
  }
});
port.postMessage('ready');
