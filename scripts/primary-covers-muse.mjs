#!/usr/bin/env node
// Primary Advantage cover pictures through Muse (the OpenRouter Image API).
//
//   node scripts/primary-covers-muse.mjs --requests <requests.json> [--refs <folder>] [--out <folder>]
//        [--ids <id,id>] [--max-tries <n>] [--cap <usd>] [--margin <usd>] [--dry-run]
//
// The model is Muse (`meta/muse-image`) and the aspect ratio is 3:2, which gives 1920 x 1280 px.
// The call path is the one of the Quest 5 test of 2026-10-07 and the one of
// `scripts/storytime-muse.mjs`: a POST to https://openrouter.ai/api/v1/images with the prompt, the
// aspect ratio, and the reference pictures as JPEG data URLs. The key is read at run time from the
// Workbooks dashboard env file. It is never printed and never written.
//
// Every paid call is logged in `<out>/costs.tsv`: time, prompt id, attempt, cost, result file,
// result, size, references. The run stops at the cap: a call needs the spend so far plus one margin
// to stay under the cap. A picture gets at most `--max-tries` attempts, and the attempt number is
// the number of earlier rows of that prompt id.
//
// The first attempt of a picture is written with the output file name of the request. A later
// attempt is written with the same name and its attempt number, so an accepted file is never
// overwritten. The work folder holds the files; the caller copies the accepted ones to the
// delivery folder under the output name of the request.
//
// The script writes only inside the work folder. It reads the request file and the reference
// folder, and it never writes in them.
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import sharp from 'sharp';

/** The repository root. Every folder of the call resolves against it. */
const ROOT = resolve(new URL('..', import.meta.url).pathname);

/** The Muse model. The Quest 5 test of 2026-10-07 proved this model and this aspect ratio. */
const MODEL = 'meta/muse-image';

/** The OpenRouter Image API. The same endpoint as `scripts/storytime-muse.mjs`. */
const URL_API = 'https://openrouter.ai/api/v1/images';

/** The head of the cost file. Every column of one paid call. */
const TSV_HEAD = 'time\tprompt_id\tattempt\tcost_usd\tresult_file\tresult\tsize\treferences\tprompt_note\n';

/** The default work folder. It holds the files, the cost file, and the copied references. */
const DEFAULT_OUT = 'out/primary-covers/levels-5-9';

/** The default cap in USD for the whole run. */
const DEFAULT_CAP = 0.4;

/** The default margin in USD. A call needs the spend plus this margin to stay under the cap. */
const DEFAULT_MARGIN = 0.01;

/** The default number of attempts per picture. */
const DEFAULT_MAX_TRIES = 3;

/** The time of one call in ms. The same time as the muse tool. */
const CALL_TIMEOUT_MS = 300000;

/**
 * The key of the OpenRouter env file. The path is the one of the muse tool, and the file names
 * the key with the spelling of the dashboard file.
 */
export const KEY_FILE = 'Desktop/Workbooks/dashboard/.env.local';

/**
 * The key of the OpenRouter account. It is read at run time and never written.
 *
 * @returns {string} the key
 */
export const readKey = () => {
  const text = readFileSync(join(homedir(), KEY_FILE), 'utf8');
  let key = '';
  for (const line of text.split('\n')) {
    const i = line.indexOf('=');
    if (i < 0) continue;
    const name = line.slice(0, i).trim();
    if (name === 'OPENROUTER_API_KEY' || name === 'OPERNROUTER_API_KEY') {
      key = line
        .slice(i + 1)
        .trim()
        .replace(/^["']|["']$/g, '');
    }
  }
  if (!key) throw new Error(`no key in ${KEY_FILE}`);
  return key;
};

/**
 * One reference picture as a JPEG data URL. The encoding is the one of the muse tool: a white
 * background, the long side inside 1600 px, and JPEG quality 88.
 *
 * @param {string} path the file of the reference
 * @returns {Promise<{type: string, image_url: {url: string}}>} the reference of the request body
 */
export const dataUrl = async (path) => {
  const buf = await sharp(resolve(path))
    .flatten({ background: '#ffffff' })
    .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 88 })
    .toBuffer();
  return { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${buf.toString('base64')}` } };
};

/**
 * One Muse call. It returns the picture bytes and the cost of the call, or the error.
 *
 * @param {string} key the OpenRouter key
 * @param {string} prompt the prompt of the picture
 * @param {Array<{type: string, image_url: {url: string}}>} refs the references
 * @param {string} aspect the aspect ratio, 3:2
 * @returns {Promise<{buf?: Buffer, cost: number, error?: string}>} the result of the call
 */
export const callMuse = async (key, prompt, refs, aspect) => {
  const body = { model: MODEL, prompt, aspect_ratio: aspect, input_references: refs };
  let res;
  let text;
  try {
    res = await fetch(URL_API, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(CALL_TIMEOUT_MS),
    });
    text = await res.text();
  } catch (e) {
    return { error: `network error: ${e.cause?.code ?? e.name}`, cost: 0 };
  }
  if (!res.ok) return { error: `HTTP ${res.status}: ${text.slice(0, 200)}`, cost: 0 };
  const json = JSON.parse(text);
  const cost = json.usage?.cost ?? 0;
  const b64 = (json.data ?? []).find((d) => d.b64_json)?.b64_json;
  if (json.error || !b64) return { error: `no image: ${text.slice(0, 200)}`, cost };
  return { buf: Buffer.from(b64, 'base64'), cost };
};

/**
 * The rows of a cost file.
 *
 * @param {string} file the cost file
 * @returns {Array<{time: string, prompt_id: string, attempt: number, cost: number}>} the rows
 */
export const readRows = (file) => {
  if (!existsSync(file)) return [];
  return readFileSync(file, 'utf8')
    .split('\n')
    .filter((line) => line.trim() && !line.startsWith('time\t'))
    .map((line) => {
      const c = line.split('\t');
      return { time: c[0] ?? '', prompt_id: c[1] ?? '', attempt: Number(c[2]) || 0, cost: Number(c[3]) || 0 };
    });
};

/**
 * The spend of the rows of the file.
 *
 * @param {Array<{cost: number}>} rows the rows
 * @returns {number} the sum of the cost column
 */
export const spendOf = (rows) => rows.reduce((s, r) => s + (Number(r.cost) || 0), 0);

/**
 * The attempt number of the next call of one prompt id: the number of its earlier rows plus one.
 *
 * @param {Array<{prompt_id: string, attempt: number}>} rows the rows
 * @param {string} id the prompt id
 * @returns {number} the attempt number
 */
export const attemptOf = (rows, id) => rows.filter((r) => r.prompt_id === id).length + 1;

/**
 * The file name of one attempt. The first attempt keeps the output name of the request. A later
 * attempt adds its number, so an accepted file is never overwritten.
 *
 * @param {{output_file: string}} request the request of the picture
 * @param {number} attempt the attempt number
 * @returns {string} the file name
 */
export const fileNameFor = (request, attempt) =>
  attempt === 1 ? request.output_file : request.output_file.replace(/\.png$/, `-try${attempt}.png`);

/**
 * The options of one call.
 *
 * @param {string[]} argv the arguments
 * @returns {{requests: string, refs: string, out: string, ids: string[], maxTries: number, cap: number, margin: number, dryRun: boolean}} the options
 */
export const parseArgs = (argv) => {
  const options = {
    requests: '',
    refs: '',
    out: DEFAULT_OUT,
    ids: [],
    maxTries: DEFAULT_MAX_TRIES,
    cap: DEFAULT_CAP,
    margin: DEFAULT_MARGIN,
    suffix: '',
    dryRun: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    const value = argv[i + 1];
    if (key === '--requests') {
      options.requests = value ?? '';
      i += 1;
    } else if (key === '--refs') {
      options.refs = value ?? '';
      i += 1;
    } else if (key === '--out') {
      options.out = value ?? DEFAULT_OUT;
      i += 1;
    } else if (key === '--ids') {
      options.ids = (value ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      i += 1;
    } else if (key === '--max-tries') {
      options.maxTries = Number(value ?? DEFAULT_MAX_TRIES);
      i += 1;
    } else if (key === '--cap') {
      options.cap = Number(value ?? DEFAULT_CAP);
      i += 1;
    } else if (key === '--margin') {
      options.margin = Number(value ?? DEFAULT_MARGIN);
      i += 1;
    } else if (key === '--suffix') {
      options.suffix = value ?? '';
      i += 1;
    } else if (key === '--dry-run') {
      options.dryRun = true;
    }
  }
  return options;
};

/**
 * The command of one call. It makes the calls of the list and returns the number of pictures.
 *
 * @param {string[]} argv the arguments
 * @returns {Promise<number>} the number of pictures written
 */
export const main = async (argv = process.argv.slice(2)) => {
  const options = parseArgs(argv);
  if (!options.requests) {
    console.error('error: the call needs --requests');
    return 2;
  }
  const requestsPath = resolve(ROOT, options.requests);
  const spec = JSON.parse(readFileSync(requestsPath, 'utf8'));
  const refsDir = resolve(ROOT, options.refs || dirname(requestsPath));
  const outDir = resolve(ROOT, options.out);
  mkdirSync(outDir, { recursive: true });
  const costFile = join(outDir, 'costs.tsv');
  if (!existsSync(costFile)) writeFileSync(costFile, TSV_HEAD);
  const list = (spec.requests ?? []).filter((r) => !options.ids.length || options.ids.includes(r.id));
  const key = options.dryRun ? '' : readKey();
  let written = 0;
  for (const request of list) {
    const rows = readRows(costFile);
    const attempt = attemptOf(rows, request.id);
    if (attempt > options.maxTries) {
      console.log(`${request.id}: ${attempt - 1} attempts already, skipped`);
      continue;
    }
    const spend = spendOf(rows);
    if (spend + options.margin > options.cap) {
      console.log(`stop: spend ${spend.toFixed(4)} USD plus margin over cap ${options.cap}`);
      break;
    }
    if (options.dryRun) {
      console.log(`${request.id}: attempt ${attempt} of ${request.output_file}`);
      continue;
    }
    const refs = [];
    for (const ref of request.references ?? []) {
      refs.push(await dataUrl(resolve(refsDir, ref.path)));
    }
    const result = await callMuse(
      key,
      options.suffix ? `${request.prompt} ${options.suffix}` : request.prompt,
      refs,
      request.aspect_ratio ?? '3:2',
    );
    const refNames = (request.references ?? []).map((r) => r.path).join(';');
    if (result.error) {
      appendFileSync(
        costFile,
        [
          new Date().toISOString(),
          request.id,
          attempt,
          result.cost,
          'none',
          result.error,
          'none',
          refNames,
          options.suffix ? 'fix clause' : 'requests.json',
        ].join('\t') + '\n',
      );
      console.log(`${request.id} attempt ${attempt} FAILED ${result.error}`);
      continue;
    }
    const png = await sharp(result.buf).removeAlpha().png().toBuffer();
    const meta = await sharp(png).metadata();
    const name = fileNameFor(request, attempt);
    writeFileSync(join(outDir, name), png);
    appendFileSync(
      costFile,
      [
        new Date().toISOString(),
        request.id,
        attempt,
        result.cost,
        name,
        'ok',
        `${meta.width}x${meta.height}`,
        refNames,
        options.suffix ? 'fix clause' : 'requests.json',
      ].join('\t') + '\n',
    );
    written += 1;
    console.log(
      `${request.id} attempt ${attempt} ok ${meta.width}x${meta.height} cost ${result.cost} -> ${name}`,
    );
  }
  const rows = readRows(costFile);
  console.log(`pictures written ${written}, spend ${spendOf(rows).toFixed(4)} USD of cap ${options.cap}`);
  return 0;
};

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  main().then(
    (code) => {
      process.exit(code);
    },
    (error) => {
      console.error(`error: ${error.message}`);
      process.exit(1);
    },
  );
}
