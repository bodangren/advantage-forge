/** Regression pin for a harness mutation made after an input event reaches the page. */
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

type ActionMark = {
  word: number;
  collected: number;
  score: number;
  courage: number;
  roundId: string | null;
  chosen: number | null;
};

type AcceptedAction = (before: ActionMark, after: ActionMark, inputWasSent: boolean) => boolean;

function loadAcceptedAction(): AcceptedAction {
  const source = readFileSync(new URL('../../scripts/old-browser-check.mjs', import.meta.url), 'utf8');
  const start = source.indexOf('function acceptedAction(');
  const end = source.indexOf('\n}\n\nconst result', start);
  if (start < 0 || end < 0) throw new Error('acceptedAction function was not found');
  return new Function(`return (${source.slice(start, end + 2)});`)() as AcceptedAction;
}

it('does not accept a harness-only score change after a page input event', () => {
  const before: ActionMark = {
    word: 0,
    collected: 0,
    score: 0,
    courage: 3,
    roundId: 'round-1',
    chosen: null,
  };
  const after = { ...before, score: 1 };

  expect(loadAcceptedAction()(before, after, true)).toBe(false);
});
