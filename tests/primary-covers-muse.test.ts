import { describe, expect, it } from 'vitest';
import { attemptOf, fileNameFor, parseArgs, readRows, spendOf } from '../scripts/primary-covers-muse.mjs';

const REQUESTS = {
  request: 'levels-5-9-cover-art',
  count: 2,
  hard_stop_usd_total: 0.4,
  requests: [
    { id: 'quest-5', output_file: 'cover-wide-quest-5-1920x1280.png' },
    { id: 'quest-6.1', output_file: 'cover-wide-quest-6.1-1920x1280.png' },
  ],
};

describe('the primary cover run options', () => {
  it('reads the request file, the folders, and the money', () => {
    const options = parseArgs([
      '--requests',
      'a/requests.json',
      '--refs',
      'b',
      '--out',
      'c',
      '--ids',
      'quest-5, quest-6.1',
      '--max-tries',
      '2',
      '--cap',
      '0.4',
      '--margin',
      '0.01',
    ]);
    expect(options.requests).toBe('a/requests.json');
    expect(options.refs).toBe('b');
    expect(options.out).toBe('c');
    expect(options.ids).toEqual(['quest-5', 'quest-6.1']);
    expect(options.maxTries).toBe(2);
    expect(options.cap).toBe(0.4);
    expect(options.margin).toBe(0.01);
    expect(options.dryRun).toBe(false);
  });

  it('keeps the cap of 0.40 USD and the work folder of the run', () => {
    const options = parseArgs(['--requests', 'a/requests.json']);
    expect(options.cap).toBe(0.4);
    expect(options.out).toBe('out/primary-covers/levels-5-9');
    expect(options.maxTries).toBe(3);
  });

  it('names no file of a dry run', () => {
    expect(parseArgs(['--requests', 'a/requests.json', '--dry-run']).dryRun).toBe(true);
  });
});

describe('the cost rows of the run', () => {
  it('sums the cost of every row', () => {
    const rows = [
      { time: '1', prompt_id: 'quest-5', attempt: 1, cost: 0.01 },
      { time: '2', prompt_id: 'quest-6.1', attempt: 1, cost: 0.02 },
    ];
    expect(spendOf(rows)).toBeCloseTo(0.03, 6);
  });

  it('counts the attempt of one prompt id', () => {
    const rows = [
      { time: '1', prompt_id: 'quest-5', attempt: 1, cost: 0.01 },
      { time: '2', prompt_id: 'quest-6.1', attempt: 1, cost: 0.01 },
      { time: '3', prompt_id: 'quest-5', attempt: 2, cost: 0.01 },
    ];
    expect(attemptOf(rows, 'quest-5')).toBe(3);
    expect(attemptOf(rows, 'quest-6.1')).toBe(2);
    expect(attemptOf(rows, 'quest-9.3')).toBe(1);
  });

  it('reads no row of a missing cost file', () => {
    expect(readRows('/tmp/opencode/no-such-cost-file.tsv')).toEqual([]);
  });
});

describe('the file name of one attempt', () => {
  it('keeps the output name of the request for the first attempt', () => {
    expect(fileNameFor(REQUESTS.requests[0]!, 1)).toBe('cover-wide-quest-5-1920x1280.png');
  });

  it('adds the attempt number to a later attempt', () => {
    expect(fileNameFor(REQUESTS.requests[1]!, 2)).toBe('cover-wide-quest-6.1-1920x1280-try2.png');
  });
});
