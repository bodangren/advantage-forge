import { pathToFileURL } from 'node:url';
import { parentPort, workerData } from 'node:worker_threads';
import { collectBodies, type AssetDefinition } from './asset.js';
import { wearAsset } from './equip.js';
import { makeContext, runTask, transferables, type Task } from './tasks.js';

const port = parentPort!;
const { source, wear } = workerData as { source: string; wear: readonly { name: string; source: string }[] };
const load = async (file: string) => ((await import(pathToFileURL(file).href)) as { default: AssetDefinition }).default;
// A base wearing equipment pieces is dressed here the same way as in the main thread.
const base = await load(source);
const def = wear.length > 0 ? wearAsset(base, await Promise.all(wear.map(async (w) => ({ name: w.name, def: await load(w.source) })))) : base;
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
