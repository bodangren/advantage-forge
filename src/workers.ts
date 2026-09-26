import { availableParallelism } from 'node:os';
import { Worker } from 'node:worker_threads';
import { runTask, type Task, type TaskContext, type TaskResult } from './tasks.js';

/** Runs tasks on worker threads (or in-process when threads are unavailable or not wanted). */
export interface Pool {
  run(tasks: readonly Task[]): Promise<TaskResult[]>;
  close(): Promise<void>;
}

/**
 * Open a pool. Worker threads re-import the asset module at `source`, because shapes are closures
 * and cannot be sent between threads. Without a source, or with FORGE_WORKERS=1, tasks run here.
 */
export async function openPool(ctx: TaskContext, source: string | undefined, jobs: number): Promise<Pool> {
  const size = Math.min(
    jobs,
    Number(process.env.FORGE_WORKERS ?? Math.max(1, Math.floor(availableParallelism() / 2))),
  );
  if (!source || size <= 1) return localPool(ctx);
  const workers: Worker[] = [];
  try {
    await Promise.all(
      Array.from({ length: size }, () => {
        const worker = new Worker(new URL('./mesh-worker.ts', import.meta.url), {
          workerData: { source },
          execArgv: ['--import', 'tsx'],
        });
        workers.push(worker);
        return new Promise<void>((resolve, reject) => {
          worker.once('message', () => resolve());
          worker.once('error', reject);
        });
      }),
    );
  } catch (error) {
    await Promise.all(workers.map((w) => w.terminate()));
    if (/ERR_MODULE_NOT_FOUND|Cannot find (module|package)/.test((error as Error).message))
      return localPool(ctx);
    throw error;
  }
  return {
    run(tasks) {
      const results: TaskResult[] = new Array(tasks.length);
      let next = 0;
      let done = 0;
      return new Promise((resolve, reject) => {
        if (tasks.length === 0) return resolve(results);
        const listeners: (() => void)[] = [];
        const finish = (error?: Error) => {
          listeners.forEach((off) => off());
          if (error) reject(error);
          else resolve(results);
        };
        for (const worker of workers) {
          const feed = () => {
            if (next < tasks.length) {
              const i = next++;
              worker.postMessage({ i, task: tasks[i] });
            }
          };
          const onMessage = (msg: { i: number; result?: TaskResult; error?: string }) => {
            if (msg.error !== undefined) return finish(new Error(msg.error));
            results[msg.i] = msg.result!;
            if (++done === tasks.length) finish();
            else feed();
          };
          const onError = (e: Error) => finish(e);
          worker.on('message', onMessage);
          worker.on('error', onError);
          listeners.push(() => {
            worker.off('message', onMessage);
            worker.off('error', onError);
          });
          feed();
        }
      });
    },
    async close() {
      await Promise.all(workers.map((w) => w.terminate()));
    },
  };
}

function localPool(ctx: TaskContext): Pool {
  return {
    async run(tasks) {
      const out: TaskResult[] = [];
      for (const task of tasks) out.push(await runTask(task, ctx));
      return out;
    },
    async close() {},
  };
}
