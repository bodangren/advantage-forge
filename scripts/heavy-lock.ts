/**
 * The machine's shared lock for heavy jobs (agreed with the monorepo session, 2026-10-19): one heavy
 * job at a time across Forge and the monorepo, such as a release build, a monorepo test run, or an
 * app build. `holdHeavyLock()` runs the current script again under `flock <lock>`, unless an
 * ancestor process holds the lock already: a caller that wrapped the command in flock does not
 * wait for itself.
 *
 * $HEAVY_LOCK sets the lock file (default ~/Desktop/primary-parity-progress/heavy.lock). Where its
 * folder does not exist (another machine), or off Linux, the script runs without a lock.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

export const HEAVY_LOCK = process.env.HEAVY_LOCK ?? join(homedir(), 'Desktop', 'primary-parity-progress', 'heavy.lock');

/**
 * The PIDs that hold a flock on the file with this inode, from the text of /proc/locks
 * ("1: FLOCK  ADVISORY  WRITE 4242 103:02:917514 0 EOF"). A waiting lock ("1: -> FLOCK ...") holds nothing.
 */
export function lockHolders(locks: string, inode: number): number[] {
  return locks.split('\n').flatMap((line) => {
    const m = /^\d+:\s+FLOCK\s+\S+\s+\S+\s+(\d+)\s+[0-9a-f]+:[0-9a-f]+:(\d+)\s/.exec(line);
    return m && Number(m[2]) === inode ? [Number(m[1])] : [];
  });
}

/** This process and its ancestors, from /proc. */
function lineage(): number[] {
  const out: number[] = [];
  for (let pid = process.pid; pid > 1 && out.length < 64; ) {
    out.push(pid);
    try {
      pid = Number(/^PPid:\s+(\d+)/m.exec(readFileSync(`/proc/${pid}/status`, 'utf8'))?.[1] ?? 0);
    } catch {
      break;
    }
  }
  return out;
}

/** Returns when this process may run its heavy work; otherwise it runs again under flock and exits. */
export function holdHeavyLock(lock: string = HEAVY_LOCK): void {
  if (process.platform !== 'linux' || !existsSync(dirname(lock))) return;
  if (!existsSync(lock)) writeFileSync(lock, '');
  const holders = lockHolders(readFileSync('/proc/locks', 'utf8'), statSync(lock).ino);
  const mine = lineage();
  if (holders.some((pid) => mine.includes(pid))) return;
  if (holders.length) console.log(`heavy job: waiting for ${lock} (held by pid ${holders.join(', ')})`);
  const r = spawnSync('flock', [lock, process.execPath, ...process.execArgv, process.argv[1]!, ...process.argv.slice(2)], { stdio: 'inherit' });
  process.exit(r.status ?? 1);
}
