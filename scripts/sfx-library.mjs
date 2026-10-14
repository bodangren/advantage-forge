#!/usr/bin/env node
// Sound library tool (docs/sound-library.md). The wanted sounds are rows of
// docs/sound-effects-list.tsv; every take comes from a catalog entry of audio/sources/ with a
// license that the owner permits (CC0, CC-BY, OGA-BY, the bought ElvGames packs).
//
//   node scripts/sfx-library.mjs catalog                   # cached pages -> audio/sources/oga-cc0.json, oga-by.json
//   node scripts/sfx-library.mjs elvgames                  # the ElvGames zip files -> audio/sources/elvgames.json
//   node scripts/sfx-library.mjs find <site> <words...>    # live search of commons, soundbible, or opengameart; adds the hits with a permitted license
//   node scripts/sfx-library.mjs search <words...> [--music] [--limit n] [--site opengameart|elvgames]
//   node scripts/sfx-library.mjs entry <slug>              # title, author, license, description, files
//   node scripts/sfx-library.mjs fetch <slug> [--max-mb n] # download, unpack, list audio files
//   node scripts/sfx-library.mjs files <slug> [filter]     # audio files of a fetched entry
//   node scripts/sfx-library.mjs probe <file>              # length, level, and the sounds in a file
//   node scripts/sfx-library.mjs take <id> <file> [--start s] [--end s] [--note text] [--force] [--checked] [--seamless]
//   node scripts/sfx-library.mjs drop <id> <take>
//   node scripts/sfx-library.mjs miss <id> <reason...>
//   node scripts/sfx-library.mjs status [id-prefix]
//   node scripts/sfx-library.mjs rows <id...>               # the rows to fill: takes found/wanted, length, description
//   node scripts/sfx-library.mjs rebuild [id-prefix]          # process every take again from its source
//   node scripts/sfx-library.mjs page                      # out/audio-review/index.html
//   node scripts/sfx-library.mjs review [--port 4178]      # local review page for the owner (approve, reject, submit)
//   node scripts/sfx-library.mjs apply-review <review.json> # drop rejected takes, record approvals and notes
//   node scripts/sfx-library.mjs credits                   # audio/CREDITS.md from the manifests
//
// Raw downloads stay in out/audio-source/<slug>/ (not in git). A take is cut, trimmed, leveled,
// and encoded to MP3 in audio/<category>/<name>-<n>.mp3, with one manifest row in
// audio/manifest/<category>.tsv that names the source entry, file, span, author, and license.
import { createWriteStream, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, renameSync, rmSync, statfsSync, unlinkSync, writeFileSync, appendFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { homedir } from 'node:os';
import { basename, dirname, extname, join, relative, resolve, sep } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LIST = join(ROOT, 'docs/sound-effects-list.tsv');
const LIB = join(ROOT, 'audio');
const SOURCES = join(LIB, 'sources');
const CATALOG = join(SOURCES, 'oga-cc0.json');
const CREDITS = join(LIB, 'CREDITS.md');
/** The folder of the bought asset packs (the ElvGames zip files). */
const ASSET_PACKS = process.env.ASSET_PACKS ?? join(homedir(), 'Desktop', 'Asset Packs');
const MANIFESTS = join(LIB, 'manifest');
const SRC = join(ROOT, 'out/audio-source');
const PAGES = join(SRC, 'pages');
const REVIEW = join(ROOT, 'out/audio-review');
const SUBMISSIONS = join(ROOT, 'out/audio-review/submissions');
const REVIEW_LOG = join(LIB, 'review.tsv');
const REVIEW_NOTES = join(LIB, 'review-notes.tsv');

const RATE = 44100;
/** Allowed take length in seconds per length class of the list. */
const LENGTH = { short: [0.03, 1.5], medium: [0.2, 4], long: [0.5, 12], loop: [8, 90], music: [20, 300] };
/** Target RMS level (dBFS) per length class; the peak never passes -1 dBFS. */
const LEVEL = { short: -16, medium: -16, long: -17, loop: -26, music: -18 };
const PEAK = 10 ** (-1 / 20);
const AUDIO_EXT = new Set(['.wav', '.ogg', '.oga', '.mp3', '.flac', '.aif', '.aiff', '.m4a', '.opus', '.webm', '.wma', '.mod', '.xm', '.it', '.s3m']);
const ARCHIVE_EXT = /\.(zip|rar|7z|tar|tgz|tar\.gz|tar\.bz2|tar\.xz)$/i;
/** The licenses the owner permits (2026-10-14), best first. Not permitted: NC, ND, SA, GPL, personal use. */
const PERMITTED = ['CC0', 'Public domain', 'CC-BY 4.0', 'CC-BY 3.0', 'OGA-BY 4.0', 'OGA-BY 3.0', 'ElvGames'];
/** Licenses that need no credit line. */
const NO_CREDIT = new Set(['CC0', 'Public domain']);
const USER_AGENT = 'AdvantageForgeSoundLibrary/1.0 (https://github.com/bodangren/advantage-forge)';
const licenseOf = (e) => PERMITTED.find((l) => e.licenses.includes(l)) ?? null;
/** A CC0 entry whose description names attribution or another source needs a check before a take. */
const LICENSE_FLAG = /freesound\.org|cc-by|cc by\b|creative commons attribution|attribution required|must credit/i;
/** An attribution entry is checked only for third-party sources and the licenses that are not permitted. */
const THIRD_PARTY = /freesound\.org|non-?commercial|\bby-nc|share-?alike|\bby-sa/i;
const flagOf = (e) => (NO_CREDIT.has(licenseOf(e)) ? LICENSE_FLAG : THIRD_PARTY);
const pageUrl = (e) => e.url ?? 'https://opengameart.org/content/' + e.slug;
const MIN_FREE_GB = 4;

const argv = process.argv.slice(2);
const cmd = argv[0];
const flags = {};
const args = [];
for (let i = 1; i < argv.length; i++) {
  const a = argv[i];
  if (a.startsWith('--')) {
    const key = a.slice(2);
    const boolFlag = ['music', 'force', 'checked', 'seamless'].includes(key);
    flags[key] = boolFlag ? true : argv[++i];
  } else args.push(a);
}

function fail(message) {
  console.error('error: ' + message);
  process.exit(1);
}

// ---------- the list and the catalog ----------

function readList() {
  const [head, ...lines] = readFileSync(LIST, 'utf8').trim().split('\n');
  const cols = head.split('\t');
  return lines.map((l) => Object.fromEntries(l.split('\t').map((v, i) => [cols[i], v]))).map((r) => ({ ...r, takes: Number(r.takes) }));
}

function rowOf(id) {
  const row = readList().find((r) => r.id === id);
  if (!row) fail(`"${id}" is not a row of docs/sound-effects-list.tsv`);
  return row;
}

let catalogCache = null;
/** All catalog files of audio/sources/ (one for each site), as one list of entries. */
function catalog() {
  if (!catalogCache) {
    if (!existsSync(CATALOG)) fail('no catalog; run: node scripts/sfx-library.mjs catalog');
    const entries = readdirSync(SOURCES)
      .filter((f) => f.endsWith('.json'))
      .sort()
      .flatMap((f) => JSON.parse(readFileSync(join(SOURCES, f), 'utf8')).entries.map((e) => ({ site: 'opengameart', ...e })));
    catalogCache = { entries };
  }
  return catalogCache;
}

function entryOf(slug) {
  const e = catalog().entries.find((x) => x.slug === slug);
  if (!e) fail(`"${slug}" is not in the catalog (use the slug that search prints)`);
  return e;
}

const decode = (s) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&#0?39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();

function field(html, name) {
  const i = html.indexOf(`field-name-${name} `);
  if (i < 0) return '';
  const end = html.indexOf('<div class="field field-name-', i + 10);
  return html.slice(i, end < 0 ? i + 20000 : end);
}

const fieldItems = (block) => [...block.matchAll(/<div class="field-item[^"]*"[^>]*>([\s\S]*?)<\/div>/g)].map((m) => decode(m[1].replace(/<[^>]+>/g, ' ')));

function parsePage(slug, html) {
  const title = decode((html.match(/property="dc:title"><h2>([\s\S]*?)<\/h2>/) || [])[1] || '');
  const author = decode((field(html, 'author-submitter').match(/<a href="\/users\/[^"]*">([^<]*)<\/a>/) || [])[1] || '');
  const date = decode((field(html, 'post-date').match(/field-item even">([^<]*)</) || [])[1] || '');
  const type = fieldItems(field(html, 'field-art-type'));
  const description = decode(field(html, 'body').replace(/<\/p>|<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, ' ')).slice(0, 1500);
  const files = [...field(html, 'field-art-files').matchAll(/<a href="([^"]+)" type="([^";]*)(?:; length=(\d+))?"[^>]*>([^<]*)<\/a>/g)].map((m) => ({
    name: decode(m[4]),
    url: m[1],
    bytes: m[3] ? Number(m[3]) : null,
  }));
  return {
    slug,
    title,
    author,
    date,
    type: type.includes('Music') ? 'music' : 'sfx',
    licenses: fieldItems(field(html, 'field-art-licenses')),
    tags: fieldItems(field(html, 'field-art-tags')),
    description,
    files,
  };
}

async function getPage(slug) {
  const file = join(PAGES, slug + '.html');
  if (existsSync(file)) return readFileSync(file, 'utf8');
  const res = await fetchRetry('https://opengameart.org/content/' + slug, 60000);
  const html = await res.text();
  mkdirSync(PAGES, { recursive: true });
  writeFileSync(file, html);
  return html;
}

async function buildCatalog() {
  const listDir = join(SRC, 'lists');
  const lists = readdirSync(listDir).filter((f) => f.endsWith('.tsv'));
  const slugs = new Map();
  for (const f of lists) {
    for (const line of readFileSync(join(listDir, f), 'utf8').trim().split('\n')) {
      const slug = line.split('\t')[0].replace(/^\/content\//, '');
      if (!slugs.has(slug)) slugs.set(slug, []);
      slugs.get(slug).push(basename(f, '.tsv'));
    }
  }
  const entries = [];
  const failed = [];
  for (const [slug, from] of slugs) {
    try {
      const e = parsePage(slug, await getPage(slug));
      if (!licenseOf(e)) failed.push(`${slug}: no permitted license (${e.licenses.join(', ')})`);
      else entries.push({ ...e, lists: from });
    } catch (err) {
      failed.push(`${slug}: ${err}`);
    }
  }
  entries.sort((a, b) => a.slug.localeCompare(b.slug));
  const built = new Date().toISOString().slice(0, 10);
  const cc0 = entries.filter((e) => licenseOf(e) === 'CC0');
  writeCatalog(CATALOG, { source: 'https://opengameart.org (CC0 entries)', built, entries: cc0 });
  writeCatalog(join(SOURCES, 'oga-by.json'), { source: 'https://opengameart.org (CC-BY and OGA-BY entries)', built, entries: entries.filter((e) => licenseOf(e) !== 'CC0') });
  for (const f of failed) console.log('skipped ' + f);
}

function writeCatalog(path, out) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(out, null, 0).replace(/\},\{"slug"/g, '},\n{"slug"') + '\n');
  const music = out.entries.filter((e) => e.type === 'music').length;
  console.log(`catalog: ${out.entries.length} entries (${out.entries.length - music} sfx, ${music} music) -> ${relative(ROOT, path)}`);
}

/** The ElvGames packs: the sound effects of each zip file in ASSET_PACKS, WAV files only (each sound is also MP3 and OGG). */
const ELVGAMES = [
  { zip: 'Sound Effects.zip', root: 'Sound Effects/' },
  { zip: 'Platformer World.zip', root: 'Platformer World/Platformer World/', only: 'Sound Effects/' },
];

function buildElvCatalog() {
  const entries = [];
  for (const pack of ELVGAMES) {
    const zip = join(ASSET_PACKS, pack.zip);
    if (!existsSync(zip)) fail(`${pack.zip} is not in ${ASSET_PACKS} (set ASSET_PACKS)`);
    const listing = run('unzip', ['-l', zip]).stdout.toString().split('\n');
    const groups = new Map();
    for (const line of listing) {
      const m = /^\s*(\d+)\s+\S+\s+\S+\s+(.+)$/.exec(line);
      if (!m || !m[2].startsWith(pack.root) || !m[2].includes('/WAV/') || extname(m[2]).toLowerCase() !== '.wav') continue;
      const rest = m[2].slice(pack.root.length);
      if (pack.only && !rest.startsWith(pack.only)) continue;
      const folder = pack.only ? pack.only : rest.split('/')[0] + '/';
      if (!groups.has(folder)) groups.set(folder, []);
      groups.get(folder).push({ name: m[2], url: null, bytes: Number(m[1]) });
    }
    for (const [folder, files] of groups) {
      const name = pack.only ? basename(pack.zip, '.zip') : folder.slice(0, -1).replace(/ - Universal Sound Effects$/, '');
      entries.push({
        slug: 'elvgames-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        site: 'elvgames',
        title: name,
        author: 'ElvGames & Pegonthetrack',
        date: '',
        type: 'sfx',
        licenses: ['ElvGames'],
        tags: name.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2),
        description: 'A bought ElvGames pack (license: https://elvgames.itch.io/terms): commercial use and changes permitted; credit ElvGames & Pegonthetrack and state that the sound is modified.',
        files,
        url: 'https://elvgames.itch.io',
        local: { zip: pack.zip, prefix: pack.root + folder },
      });
    }
  }
  entries.sort((a, b) => a.slug.localeCompare(b.slug));
  writeCatalog(join(SOURCES, 'elvgames.json'), { source: 'ElvGames packs bought by the owner (local zip files)', built: new Date().toISOString().slice(0, 10), entries });
}

// ---------- search and entries ----------

function fetchedFiles(slug) {
  const f = join(SRC, slug, 'files.json');
  return existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null;
}

function search(words) {
  const terms = words.map((w) => w.toLowerCase()).filter(Boolean);
  if (!terms.length) fail('usage: search <words...> [--music] [--limit n] [--site opengameart|elvgames]');
  const type = flags.music ? 'music' : 'sfx';
  const limit = Number(flags.limit ?? 8);
  const scored = [];
  for (const e of catalog().entries) {
    if (e.type !== type || (flags.site && e.site !== flags.site)) continue;
    const title = e.title.toLowerCase();
    const tags = e.tags.map((t) => t.toLowerCase());
    const desc = e.description.toLowerCase();
    const names = [...e.files.map((f) => f.name), ...(fetchedFiles(e.slug) ?? []).map((f) => f.path)].map((n) => n.toLowerCase());
    let score = 0;
    let hits = 0;
    const matched = new Set();
    for (const t of terms) {
      let s = 0;
      if (title.includes(t)) s += 4;
      if (tags.includes(t)) s += 3;
      else if (tags.some((x) => x.includes(t))) s += 1.5;
      const fm = names.filter((n) => basename(n).includes(t));
      if (fm.length) {
        s += 2;
        fm.slice(0, 3).forEach((n) => matched.add(n));
      }
      if (desc.includes(t)) s += 1;
      if (s) hits++;
      score += s;
    }
    if (hits) scored.push({ e, score: score * hits, matched: [...matched].slice(0, 4) });
  }
  scored.sort((a, b) => b.score - a.score);
  for (const { e, matched } of scored.slice(0, limit)) printEntry(e, matched);
  if (!scored.length) console.log('no match');
}

function printEntry(e, matched = []) {
  const mb = e.files.reduce((s, f) => s + (f.bytes ?? 0), 0) / 1e6;
  const got = fetchedFiles(e.slug) ? ' [fetched]' : '';
  const lic = licenseOf(e) === 'CC0' ? '' : ` | ${licenseOf(e)}`;
  console.log(`${e.slug}${got} | ${mb.toFixed(1)} MB | ${e.title.slice(0, 50)} | ${e.tags.slice(0, 5).join(', ')}${lic}`);
  if (matched.length) console.log(`    files: ${matched.join(' ; ')}`);
}

function showEntry(slug) {
  const e = entryOf(slug);
  const mb = e.files.reduce((s, f) => s + (f.bytes ?? 0), 0) / 1e6;
  console.log(`${e.title} (${e.type}) by ${e.author}, ${e.date}`);
  console.log(pageUrl(e));
  console.log(`licenses: ${e.licenses.join(', ')} (a take uses ${licenseOf(e) ?? 'none: not permitted'})`);
  console.log(`tags: ${e.tags.join(', ')}`);
  if (flagOf(e).test(e.description)) console.log('LICENSE NOTE: the description names another source or license; read it before a take (--checked).');
  console.log(`description: ${e.description}`);
  console.log(`files (${mb.toFixed(1)} MB):`);
  for (const f of e.files) console.log(`  ${f.name}  ${((f.bytes ?? 0) / 1e6).toFixed(2)} MB`);
  if (fetchedFiles(slug)) console.log(`fetched: yes (files ${slug})`);
}

// ---------- other sites ----------

/** Adds entries to a site's catalog file (an entry with the same slug is replaced). */
function addEntries(file, source, found) {
  const path = join(SOURCES, file);
  const old = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')).entries : [];
  const slugs = new Set(found.map((e) => e.slug));
  const entries = [...old.filter((e) => !slugs.has(e.slug)), ...found].sort((a, b) => a.slug.localeCompare(b.slug));
  mkdirSync(SOURCES, { recursive: true });
  writeFileSync(path, JSON.stringify({ source, built: new Date().toISOString().slice(0, 10), entries }, null, 0).replace(/\},\{"slug"/g, '},\n{"slug"') + '\n');
  catalogCache = null;
}

const slugOf = (prefix, text) => prefix + '-' + text.toLowerCase().replace(/\.[a-z0-9]+$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
const plain = (html) => decode(String(html ?? '').replace(/<[^>]+>/g, ' '));

/** Wikimedia Commons: audio files, the license from the file's metadata. */
async function findCommons(words) {
  const LICENSES = { CC0: 'CC0', 'Public domain': 'Public domain', 'CC BY 4.0': 'CC-BY 4.0', 'CC BY 3.0': 'CC-BY 3.0' };
  const q = new URLSearchParams({ action: 'query', generator: 'search', gsrnamespace: '6', gsrsearch: `filetype:audio ${words.join(' ')}`, gsrlimit: '30', prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiextmetadatafilter: 'LicenseShortName|Artist|ImageDescription', format: 'json' });
  const res = await fetchRetry('https://commons.wikimedia.org/w/api.php?' + q, 60000);
  const pages = Object.values((await res.json()).query?.pages ?? {}).sort((a, b) => a.index - b.index);
  const found = [];
  let skipped = 0;
  for (const p of pages) {
    const ii = p.imageinfo?.[0];
    const meta = ii?.extmetadata ?? {};
    const license = LICENSES[meta.LicenseShortName?.value];
    if (!ii || !license) {
      skipped++;
      continue;
    }
    const name = p.title.replace(/^File:/, '');
    // Pronunciation recordings (Lingua Libre, "En-us-word.ogg") are spoken words, which the content rules exclude.
    if (/^LL-Q|^[A-Za-z]{2,3}-[A-Za-z]{2}-|^[A-Za-z]{2}-[^ ]+\.(ogg|wav|mp3|flac)$/.test(name)) {
      skipped++;
      continue;
    }
    found.push({
      slug: slugOf('commons', name),
      site: 'commons',
      title: name.replace(/\.[a-z0-9]+$/i, ''),
      author: plain(meta.Artist?.value).slice(0, 120) || 'unknown',
      date: '',
      type: 'sfx',
      licenses: [license],
      tags: [],
      description: plain(meta.ImageDescription?.value).slice(0, 600),
      files: [{ name, url: ii.url, bytes: ii.size ?? null }],
      url: ii.descriptionurl ?? 'https://commons.wikimedia.org/wiki/' + encodeURIComponent(p.title),
    });
  }
  addEntries('commons.json', 'Wikimedia Commons audio files (CC0, public domain, CC BY 3.0 and 4.0)', found);
  return { found, skipped };
}

/** SoundBible: the search page lists sound pages; each page names its license and author. */
async function findSoundBible(words) {
  const LICENSES = { 'Attribution 3.0': 'CC-BY 3.0', 'Public Domain': 'Public domain' };
  const page = async (path) => {
    const file = join(SRC, 'pages-soundbible', path.replace(/[^A-Za-z0-9.-]+/g, '_'));
    if (existsSync(file)) return readFileSync(file, 'utf8');
    const html = await (await fetchRetry('https://soundbible.com/' + path, 60000)).text();
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, html);
    return html;
  };
  const list = await page('search.php?q=' + encodeURIComponent(words.join(' ')));
  const links = [...new Set([...list.matchAll(/href='(\d+)-([^']+)\.html'/g)].map((m) => `${m[1]}-${m[2]}.html`))].slice(0, 12);
  const found = [];
  let skipped = 0;
  for (const link of links) {
    const html = await page(link);
    const id = link.split('-')[0];
    const license = LICENSES[plain((/License<\/h5>\s*<p>([\s\S]*?)<\/p>/.exec(html) ?? [])[1])];
    if (!license) {
      skipped++;
      continue;
    }
    const title = link.slice(id.length + 1, -5).replace(/-/g, ' ');
    found.push({
      slug: slugOf('soundbible', link.slice(0, -5)),
      site: 'soundbible',
      title,
      author: plain((/<meta name="author" content="([^"]*)"/.exec(html) ?? [])[1]) || 'unknown',
      date: '',
      type: 'sfx',
      licenses: [license],
      tags: [],
      description: plain((/<meta name="description" content="([^"]*)"/.exec(html) ?? [])[1]).slice(0, 600),
      files: [{ name: title.replace(/ /g, '_') + '.wav', url: `https://soundbible.com/grab.php?id=${id}&type=wav`, save: title.replace(/ /g, '_') + '.wav', bytes: null }],
      url: 'https://soundbible.com/' + link,
    });
  }
  addEntries('soundbible.json', 'SoundBible sounds (Attribution 3.0 and public domain)', found);
  return { found, skipped };
}

/** OpenGameArt: the keyword search for sound effects (or music), every entry page parsed; permitted licenses only. */
async function findOpenGameArt(words) {
  const type = flags.music ? '12' : '13';
  const q = `keys=${encodeURIComponent(words.join(' '))}&field_art_type_tid%5B%5D=${type}&sort_by=count&sort_order=DESC&items_per_page=48`;
  const html = await (await fetchRetry('https://opengameart.org/art-search-advanced?' + q, 120000)).text();
  const slugs = [...new Set([...html.matchAll(/<span class="art-preview-title"><a href="\/content\/([^"]+)"/g)].map((m) => m[1]))].slice(0, 24);
  const known = new Set(catalog().entries.map((e) => e.slug));
  const found = [];
  let skipped = 0;
  for (const slug of slugs) {
    if (known.has(slug)) continue;
    const e = parsePage(slug, await getPage(slug));
    if (!licenseOf(e)) {
      skipped++;
      continue;
    }
    found.push({ ...e, lists: ['find'] });
    // The list keeps the entry when `catalog` builds the OpenGameArt catalog files again.
    mkdirSync(join(SRC, 'lists'), { recursive: true });
    appendFileSync(join(SRC, 'lists', 'find.tsv'), `/content/${slug}\t${e.title}\n`);
  }
  const cc0 = found.filter((e) => licenseOf(e) === 'CC0');
  const by = found.filter((e) => licenseOf(e) !== 'CC0');
  if (cc0.length) addEntries(basename(CATALOG), 'https://opengameart.org (CC0 entries)', cc0);
  if (by.length) addEntries('oga-by.json', 'https://opengameart.org (CC-BY and OGA-BY entries)', by);
  return { found, skipped, known: slugs.filter((x) => known.has(x)).length };
}

async function find(site, words) {
  const finders = { commons: findCommons, soundbible: findSoundBible, opengameart: findOpenGameArt };
  if (!finders[site] || !words.length) fail('usage: find <commons|soundbible|opengameart> <words...> [--music]');
  const { found, skipped, known } = await finders[site](words);
  for (const e of found) printEntry(e);
  console.log(`${found.length} new entries with a permitted license${skipped ? `, ${skipped} skipped (license not permitted)` : ''}${known ? `, ${known} already in the catalog (use search)` : ''}`);
}

// ---------- download and unpack ----------

async function fetchRetry(url, timeoutMs) {
  let last;
  for (let attempt = 0; attempt < 4; attempt++) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: ctl.signal, headers: { 'user-agent': USER_AGENT } });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return Object.assign(res, { clear: () => clearTimeout(timer) });
    } catch (err) {
      clearTimeout(timer);
      last = err;
      await new Promise((r) => setTimeout(r, 3000 * (attempt + 1)));
    }
  }
  throw new Error(`${url}: ${last}`);
}

async function download(url, dest) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetchRetry(url, 600000);
    const tmp = dest + '.part';
    try {
      await pipeline(Readable.fromWeb(res.body), createWriteStream(tmp));
      res.clear();
      renameSync(tmp, dest);
      return;
    } catch (err) {
      res.clear();
      rmSync(tmp, { force: true });
      if (attempt === 2) throw err;
    }
  }
}

function run(bin, binArgs, opts = {}) {
  const r = spawnSync(bin, binArgs, { maxBuffer: 1 << 30, ...opts });
  if (r.error) throw r.error;
  return r;
}

function unpack(archive, into) {
  mkdirSync(into, { recursive: true });
  const lower = archive.toLowerCase();
  let r;
  if (lower.endsWith('.zip')) r = run('unzip', ['-qq', '-o', archive, '-d', into]);
  else if (lower.endsWith('.rar')) r = run('unrar', ['x', '-o+', '-inul', archive, into + sep]);
  else r = run('7z', ['x', '-y', '-bso0', '-bsp0', '-o' + into, archive]);
  // A .tar.gz unpacks to a .tar first.
  for (const f of readdirSync(into)) if (f.toLowerCase().endsWith('.tar')) {
    run('7z', ['x', '-y', '-bso0', '-bsp0', '-o' + into, join(into, f)]);
    rmSync(join(into, f), { force: true });
  }
  if (r.status !== 0 && r.status !== 1) console.log(`warning: unpack of ${basename(archive)} exited ${r.status}`);
}

/** Removes Mac metadata and links, and anything that escaped the entry folder. */
function clean(dir, base) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = lstatSync(p);
    if (st.isSymbolicLink() || name === '__MACOSX' || name === '.DS_Store' || name.startsWith('._')) {
      rmSync(p, { recursive: true, force: true });
      continue;
    }
    if (!realpathSync(p).startsWith(base + sep)) {
      rmSync(p, { recursive: true, force: true });
      continue;
    }
    if (st.isDirectory()) clean(p, base);
  }
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = lstatSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (st.isFile()) out.push(p);
  }
  return out;
}

function probeInfo(file) {
  const r = run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration:stream=channels,sample_rate', '-of', 'json', file]);
  if (r.status !== 0) return null;
  try {
    const j = JSON.parse(r.stdout.toString());
    const s = (j.streams ?? [])[0] ?? {};
    const seconds = Number(j.format?.duration);
    return Number.isFinite(seconds) ? { seconds: Math.round(seconds * 100) / 100, channels: s.channels ?? null, rate: Number(s.sample_rate) || null } : null;
  } catch {
    return null;
  }
}

async function fetchEntry(slug) {
  const e = entryOf(slug);
  const dir = join(SRC, slug);
  if (fetchedFiles(slug)) return listFiles(slug, '');
  const maxMb = Math.min(Number(flags['max-mb'] ?? 60), 300);
  const mb = e.files.reduce((s, f) => s + (f.bytes ?? 0), 0) / 1e6;
  if (mb > maxMb) fail(`${slug} is ${mb.toFixed(0)} MB; the limit is ${maxMb} MB (--max-mb n raises it, up to 300)`);
  const fs = statfsSync(ROOT);
  if ((fs.bavail * fs.bsize) / 1e9 < MIN_FREE_GB + mb / 1000) fail(`less than ${MIN_FREE_GB} GB of free disk space; stop and report`);
  const lock = join(dir, '.lock');
  mkdirSync(dir, { recursive: true });
  const holder = () => {
    try {
      const pid = Number(readFileSync(join(lock, 'pid'), 'utf8'));
      process.kill(pid, 0);
      return pid;
    } catch {
      return null;
    }
  };
  try {
    mkdirSync(lock);
  } catch {
    // A lock whose process is gone (a fetch killed by a timeout) is taken over.
    if (!holder()) rmSync(lock, { recursive: true, force: true });
    else for (let i = 0; i < 120 && !fetchedFiles(slug) && holder(); i++) await new Promise((r) => setTimeout(r, 5000));
    if (fetchedFiles(slug)) return listFiles(slug, '');
    try {
      mkdirSync(lock);
    } catch {
      fail(`${slug} is still being fetched by another process; try again later`);
    }
  }
  writeFileSync(join(lock, 'pid'), String(process.pid));
  const dl = join(dir, '_dl');
  try {
    if (e.local) unpackLocal(e, dir);
    else await downloadEntry(e, dir, dl);
    const base = realpathSync(dir);
    clean(dir, base);
    // One level of archives inside archives.
    for (const p of walk(dir)) if (!p.startsWith(dl + sep) && ARCHIVE_EXT.test(p)) {
      unpack(p, p.replace(ARCHIVE_EXT, ''));
      rmSync(p, { force: true });
    }
    clean(dir, base);
    const files = [];
    for (const p of walk(dir)) {
      if (p.startsWith(dl + sep) || !AUDIO_EXT.has(extname(p).toLowerCase())) continue;
      files.push({ path: relative(dir, p), ...(probeInfo(p) ?? { seconds: null, channels: null, rate: null }) });
    }
    files.sort((a, b) => a.path.localeCompare(b.path));
    writeFileSync(join(dir, 'files.json'), JSON.stringify(files, null, 1));
  } finally {
    rmSync(lock, { recursive: true, force: true });
  }
  listFiles(slug, '');
}

async function downloadEntry(e, dir, dl) {
  mkdirSync(dl, { recursive: true });
  // Four downloads at a time; a file kept from an earlier, interrupted fetch is not downloaded again.
  // `save` names a file whose URL does not end in its name (a download script).
  const queue = e.files.map((f) => ({ url: f.url, dest: join(dl, f.save ?? basename(decodeURIComponent(new URL(f.url).pathname))) }));
  const worker = async () => {
    for (let job = queue.shift(); job; job = queue.shift()) {
      const done = join(dir, basename(job.dest));
      if (!ARCHIVE_EXT.test(job.dest) && existsSync(done)) continue;
      if (!existsSync(job.dest)) await download(job.url, job.dest);
      if (ARCHIVE_EXT.test(job.dest)) unpack(job.dest, join(dir, basename(job.dest).replace(ARCHIVE_EXT, '')));
      else renameSync(job.dest, done);
    }
  };
  await Promise.all([worker(), worker(), worker(), worker()]);
}

/** Unpacks the files of a local entry (a folder of a bought zip file in ASSET_PACKS). */
function unpackLocal(e, dir) {
  const zip = join(ASSET_PACKS, e.local.zip);
  if (!existsSync(zip)) fail(`${e.local.zip} is not in ${ASSET_PACKS} (set ASSET_PACKS)`);
  const r = run('unzip', ['-qq', '-o', zip, ...e.files.map((f) => f.name), '-d', dir]);
  if (r.status !== 0) fail(`unzip of ${e.local.zip} exited ${r.status}: ${r.stderr.toString().slice(0, 300)}`);
}

function listFiles(slug, filter) {
  const files = fetchedFiles(slug);
  if (!files) fail(`${slug} is not fetched; run: fetch ${slug}`);
  const f = filter.toLowerCase();
  const shown = files.filter((x) => x.path.toLowerCase().includes(f));
  console.log(`${shown.length} audio file(s) in out/audio-source/${slug}/ (path, seconds, channels):`);
  for (const x of shown.slice(0, 40)) console.log(`  ${slug}/${x.path}  ${x.seconds ?? '?'} s  ${x.channels ?? '?'}ch`);
  if (shown.length > 40) console.log(`  ... ${shown.length - 40} more; narrow with: files ${slug} <filter>`);
}

// ---------- audio processing ----------

function resolveSource(file) {
  const candidates = [resolve(file), join(SRC, file)];
  const p = candidates.find((c) => existsSync(c));
  if (!p) fail(`no such file: ${file}`);
  const real = realpathSync(p);
  const base = realpathSync(SRC);
  if (!real.startsWith(base + sep)) fail('the file must be inside out/audio-source/<slug>/ (fetch the entry first)');
  const slug = relative(base, real).split(sep)[0];
  return { path: real, slug, rel: relative(join(base, slug), real) };
}

function decodePcm(file, channels, start, end) {
  const a = ['-v', 'error'];
  if (start != null) a.push('-ss', String(start));
  if (end != null) a.push('-to', String(end));
  a.push('-i', file, '-f', 'f32le', '-ac', String(channels), '-ar', String(RATE), '-');
  const r = run('ffmpeg', a);
  if (r.status !== 0) fail(`ffmpeg cannot read ${basename(file)}: ${r.stderr.toString().slice(0, 300)}`);
  const buf = r.stdout;
  return new Float32Array(buf.buffer, buf.byteOffset, Math.floor(buf.byteLength / 4));
}

/** RMS per 10 ms frame of the mixed-down signal. */
function frameRms(pcm, channels) {
  const step = Math.round(RATE / 100);
  const frames = Math.floor(pcm.length / channels / step);
  const out = new Float32Array(frames);
  for (let f = 0; f < frames; f++) {
    let s = 0;
    for (let i = f * step * channels; i < (f + 1) * step * channels; i++) s += pcm[i] * pcm[i];
    out[f] = Math.sqrt(s / (step * channels));
  }
  return out;
}

const db = (x) => (x > 0 ? 20 * Math.log10(x) : -Infinity);

function peakOf(pcm) {
  let p = 0;
  for (let i = 0; i < pcm.length; i++) p = Math.max(p, Math.abs(pcm[i]));
  return p;
}

function rmsOf(pcm) {
  let s = 0;
  for (let i = 0; i < pcm.length; i++) s += pcm[i] * pcm[i];
  return Math.sqrt(s / Math.max(1, pcm.length));
}

/** Sounds in a file: spans above -35 dB of the loudest frame, gaps under 0.25 s merged. */
function segments(pcm, channels) {
  const rms = frameRms(pcm, channels);
  const top = Math.max(...rms, 1e-9);
  const thr = Math.max(top * 10 ** (-35 / 20), 1e-4);
  const spans = [];
  let cur = null;
  rms.forEach((v, f) => {
    if (v >= thr) {
      if (cur && f - cur.end <= 25) cur.end = f;
      else spans.push((cur = { start: f, end: f }));
    }
  });
  return spans.filter((s) => s.end - s.start >= 4).map((s) => ({ start: s.start / 100, end: (s.end + 1) / 100 }));
}

function probe(file) {
  const { path, slug, rel } = resolveSource(file);
  const pcm = decodePcm(path, 1, null, null);
  const seconds = pcm.length / RATE;
  console.log(`${slug}/${rel}: ${seconds.toFixed(2)} s, peak ${db(peakOf(pcm)).toFixed(1)} dBFS, rms ${db(rmsOf(pcm)).toFixed(1)} dBFS`);
  const segs = segments(pcm, 1);
  console.log(`${segs.length} sound(s) (start-end s):`);
  for (const s of segs.slice(0, 40)) console.log(`  ${s.start.toFixed(2)}-${s.end.toFixed(2)}  (${(s.end - s.start).toFixed(2)} s)`);
  if (segs.length > 40) console.log(`  ... ${segs.length - 40} more`);
}

/** Cuts leading and trailing quiet (-40 dB under the loudest frame); keeps 5 ms before, 40 ms after. */
function trim(pcm, channels) {
  const rms = frameRms(pcm, channels);
  const top = Math.max(...rms, 1e-9);
  const thr = top * 10 ** (-40 / 20);
  let a = rms.findIndex((v) => v >= thr);
  let b = rms.length - 1;
  while (b > 0 && rms[b] < thr) b--;
  if (a < 0) return pcm;
  const step = RATE / 100;
  const from = Math.max(0, Math.floor(a * step - RATE * 0.005));
  const to = Math.min(pcm.length / channels, Math.ceil((b + 1) * step + RATE * 0.04));
  return pcm.slice(from * channels, to * channels);
}

function fade(pcm, channels, inSec, outSec) {
  const n = pcm.length / channels;
  const fi = Math.min(n, Math.round(inSec * RATE));
  const fo = Math.min(n, Math.round(outSec * RATE));
  for (let i = 0; i < fi; i++) for (let c = 0; c < channels; c++) pcm[i * channels + c] *= i / fi;
  for (let i = 0; i < fo; i++) for (let c = 0; c < channels; c++) pcm[(n - 1 - i) * channels + c] *= i / fo;
}

/** Folds the tail into the head with an equal-power crossfade, so the take loops without a seam. */
function makeLoop(pcm, channels) {
  const n = pcm.length / channels;
  const xf = Math.round(Math.min(1.5, n / RATE / 10) * RATE);
  const out = pcm.slice(0, (n - xf) * channels);
  for (let i = 0; i < xf; i++) {
    const t = i / xf;
    const gIn = Math.sqrt(t);
    const gOut = Math.sqrt(1 - t);
    for (let c = 0; c < channels; c++) out[i * channels + c] = pcm[i * channels + c] * gIn + pcm[(n - xf + i) * channels + c] * gOut;
  }
  return out;
}

function level(pcm, target) {
  const peak = peakOf(pcm);
  const rms = rmsOf(pcm);
  if (!peak) return 0;
  const gain = Math.min(PEAK / peak, 10 ** (target / 20) / Math.max(rms, 1e-9));
  for (let i = 0; i < pcm.length; i++) pcm[i] *= gain;
  return gain;
}

function encode(pcm, channels, out, quality) {
  mkdirSync(dirname(out), { recursive: true });
  const input = Buffer.from(pcm.buffer, pcm.byteOffset, pcm.byteLength);
  const r = run('ffmpeg', ['-v', 'error', '-y', '-f', 'f32le', '-ar', String(RATE), '-ac', String(channels), '-i', '-', '-c:a', 'libmp3lame', '-q:a', String(quality), out], { input });
  if (r.status !== 0) fail('ffmpeg encode failed: ' + r.stderr.toString().slice(0, 300));
}

/**
 * The processing of one take: decode the span, then fold a loop, or trim an effect and fade it.
 * A span cut with --end fades out over 120 ms (2 s for music), so a cut never ends abruptly.
 * A seamless loop is a source that already loops (a drum loop): folding it would break the beat.
 */
function render(cls, path, startArg, endArg, seamless = false) {
  const channels = cls === 'loop' || cls === 'music' ? 2 : 1;
  const start = startArg != null && startArg !== '' ? Number(startArg) : null;
  const end = endArg != null && endArg !== '' ? Number(endArg) : null;
  let pcm = decodePcm(path, channels, start, end);
  if (cls === 'loop') {
    if (!seamless) pcm = makeLoop(pcm, channels);
  } else {
    pcm = trim(pcm, channels);
    fade(pcm, channels, 0.003, cls === 'music' ? (end != null ? 2 : 0.05) : end != null ? 0.12 : 0.015);
  }
  level(pcm, LEVEL[cls]);
  return { pcm, channels, seconds: pcm.length / channels / RATE };
}

/** Processes every take of the manifest again from its source span (after a change to render). */
function rebuild(prefix) {
  const list = readList();
  let done = 0;
  for (const r of allManifest().filter((x) => x.take !== '-' && x.id.startsWith(prefix))) {
    const row = list.find((x) => x.id === r.id);
    const src = join(SRC, r.source, r.source_file);
    if (!row || !existsSync(src)) {
      console.log(`skipped ${r.id} #${r.take}: ${row ? 'source file gone (fetch ' + r.source + ')' : 'row gone'}`);
      continue;
    }
    const { pcm, channels } = render(row.length, src, r.start, r.end, r.loop === 'source');
    encode(pcm, channels, join(LIB, r.file), row.length === 'music' ? 6 : 5);
    done++;
  }
  console.log(`rebuilt ${done} take(s)`);
}

// ---------- manifest ----------

const MANIFEST_COLS = ['id', 'take', 'file', 'seconds', 'source', 'source_file', 'start', 'end', 'author', 'license', 'url', 'note', 'loop'];

function manifestPath(id) {
  return join(MANIFESTS, id.split('/')[0] + '.tsv');
}

function readManifest(path) {
  if (!existsSync(path)) return [];
  const [, ...lines] = readFileSync(path, 'utf8').trim().split('\n');
  return lines.filter(Boolean).map((l) => Object.fromEntries(l.split('\t').map((v, i) => [MANIFEST_COLS[i], v])));
}

function writeManifest(path, rows) {
  mkdirSync(dirname(path), { recursive: true });
  const clean = (v) => String(v ?? '').replace(/[\t\n]/g, ' ');
  writeFileSync(path, [MANIFEST_COLS.join('\t'), ...rows.map((r) => MANIFEST_COLS.map((c) => clean(r[c])).join('\t'))].join('\n') + '\n');
}

/** Runs fn while holding the manifest lock of a category (agents of one category may run at the same time). */
function withManifest(id, fn) {
  const lock = manifestPath(id) + '.lock';
  mkdirSync(MANIFESTS, { recursive: true });
  for (let i = 0; ; i++) {
    try {
      mkdirSync(lock);
      break;
    } catch {
      if (i > 200) rmSync(lock, { recursive: true, force: true }); // older than ~20 s: a crashed writer
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100);
    }
  }
  try {
    return fn(readManifest(manifestPath(id)));
  } finally {
    rmSync(lock, { recursive: true, force: true });
  }
}

function allManifest() {
  if (!existsSync(MANIFESTS)) return [];
  return readdirSync(MANIFESTS)
    .filter((f) => f.endsWith('.tsv'))
    .flatMap((f) => readManifest(join(MANIFESTS, f)));
}

function take(id, file) {
  const row = rowOf(id);
  const { path, slug, rel } = resolveSource(file);
  const e = entryOf(slug);
  const license = licenseOf(e);
  if (!license) fail(`${slug} has no permitted license (${e.licenses.join(', ')})`);
  if (flagOf(e).test(e.description) && !flags.checked)
    fail(`the description of ${slug} names another source or license. Read it (entry ${slug}); if the file is ${license}, repeat with --checked and say why in --note`);
  const mpath = manifestPath(id);
  const rows = readManifest(mpath);
  const mine = rows.filter((r) => r.id === id && r.take !== '-');
  if (mine.length >= row.takes + 2) fail(`${id} already has ${mine.length} takes (wanted ${row.takes}); drop a weak one first`);
  // Two spans of one file are the same sound when they overlap by half of the shorter span.
  // A missing start is 0 and a missing end is the end of the file.
  const span = (start, end) => [start === '' || start == null ? 0 : Number(start), end === '' || end == null ? Infinity : Number(end)];
  const [a0, a1] = span(flags.start, flags.end);
  // A one-shot cut from a background loop has another use, so only spans of the same kind clash.
  const bed = (cls) => cls === 'loop' || cls === 'music';
  // One file can have two paths (an archive unpacked twice) or two formats (OGG/hit.ogg and
  // WAV/hit.wav), so the file name without its extension names the sound.
  const stem = (f) => basename(f).replace(/\.[^.]+$/, '').toLowerCase();
  const same = (r) => {
    if (r.source !== slug || stem(r.source_file) !== stem(rel)) return false;
    if (bed(rowOf(r.id).length) !== bed(row.length)) return false;
    const [b0, b1] = span(r.start, r.end);
    const lo = Math.max(a0, b0), hi = Math.min(a1, b1);
    if (hi <= lo) return false;
    const short = Math.min(a1 - a0, b1 - b0);
    return !Number.isFinite(short) || hi - lo >= short / 2;
  };
  if (mine.some(same)) fail('this span is already a take of ' + id);
  const other = allManifest().find((r) => r.id !== id && r.take !== '-' && same(r));
  if (other) fail(`this span is already take ${other.take} of ${other.id}; choose another file`);
  const rejected = readReviewLog().find((r) => r.decision === 'reject' && same(r));
  if (rejected) fail(`the owner rejected this span for ${rejected.id}; choose another file`);

  const cls = row.length;
  if (flags.seamless && cls !== 'loop') fail('--seamless is only for a "loop" row');
  const { pcm, channels, seconds } = render(cls, path, flags.start, flags.end, flags.seamless);
  const [lo, hi] = LENGTH[cls];
  if ((seconds < lo || seconds > hi) && !flags.force)
    fail(`the take is ${seconds.toFixed(2)} s; a "${cls}" sound is ${lo} to ${hi} s. Cut it with --start/--end (see probe), or pick another file`);
  if (!peakOf(pcm)) fail('the take is silent');

  const logged = readReviewLog().filter((r) => r.id === id).map((r) => Number(r.take));
  const n = Math.max(0, ...logged, ...rows.filter((r) => r.id === id && r.take !== '-').map((r) => Number(r.take))) + 1;
  const [category, name] = id.split('/');
  const out = join(LIB, category, `${name}-${n}.mp3`);
  encode(pcm, channels, out, cls === 'music' ? 6 : 5);
  const entry = {
    id,
    take: n,
    file: relative(LIB, out),
    seconds: seconds.toFixed(2),
    source: slug,
    source_file: rel,
    start: flags.start ?? '',
    end: flags.end ?? '',
    author: e.author,
    license,
    url: pageUrl(e),
    note: flags.note ?? '',
    loop: flags.seamless ? 'source' : '',
  };
  withManifest(id, (fresh) => writeManifest(mpath, [...fresh.filter((r) => !(r.id === id && r.take === '-')), entry]));
  console.log(`take ${id} #${n}: audio/${relative(LIB, out)} ${seconds.toFixed(2)} s from ${slug}/${rel} (${mine.length + 1} of ${row.takes} wanted)`);
}

function drop(id, n) {
  const mpath = manifestPath(id);
  withManifest(id, (rows) => {
    const r = rows.find((x) => x.id === id && x.take === String(n));
    if (!r) fail(`${id} has no take ${n}`);
    rmSync(join(LIB, r.file), { force: true });
    writeManifest(mpath, rows.filter((x) => x !== r));
    // The log keeps the number, so a new take never gets the name of a dropped file.
    appendTsv(REVIEW_LOG, LOG_COLS, { date: new Date().toISOString().slice(0, 10), id, take: r.take, file: r.file, decision: 'drop', source: r.source, source_file: r.source_file, start: r.start, end: r.end });
  });
  console.log(`dropped ${id} #${n}`);
}

function miss(id, reason) {
  rowOf(id);
  if (!reason) fail('usage: miss <id> <reason...>');
  const mpath = manifestPath(id);
  withManifest(id, (fresh) => {
    if (fresh.some((r) => r.id === id && r.take !== '-')) return; // a row with a take is not missing
    writeManifest(mpath, [...fresh.filter((r) => !(r.id === id && r.take === '-')), { id, take: '-', note: reason }]);
  });
  console.log(`marked ${id} as missing: ${reason}`);
}

function rowsCmd(ids) {
  const man = allManifest();
  for (const r of readList().filter((x) => ids.some((i) => x.id === i || (i.endsWith('/') && x.id.startsWith(i))))) {
    const n = man.filter((m) => m.id === r.id && m.take !== '-').length;
    console.log(`${r.id} | ${r.priority} | ${r.length} | ${n}/${r.takes} | ${r.description}`);
    const note = ownerNotes().get(r.id);
    if (note) console.log(`    owner note: ${note}`);
  }
}

function status(prefix) {
  const rows = readList().filter((r) => r.id.startsWith(prefix));
  const man = allManifest();
  let full = 0;
  let some = 0;
  let missing = 0;
  let open = 0;
  for (const r of rows) {
    const takes = man.filter((m) => m.id === r.id && m.take !== '-');
    const m = man.find((x) => x.id === r.id && x.take === '-');
    const tag = takes.length >= r.takes ? 'full' : takes.length ? 'some' : m ? 'MISS' : 'open';
    if (tag === 'full') full++;
    else if (tag === 'some') some++;
    else if (tag === 'MISS') missing++;
    else open++;
    console.log(`${r.id}\t${r.priority}\t${r.length}\t${takes.length}/${r.takes}\t${tag}${m ? '\t' + m.note : ''}`);
  }
  console.log(`rows ${rows.length}: full ${full}, some ${some}, missing ${missing}, open ${open}`);
}

// ---------- review page ----------

function page() {
  const rows = readList();
  const man = allManifest();
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const cats = [...new Set(rows.map((r) => r.id.split('/')[0]))];
  const filled = rows.filter((r) => man.some((m) => m.id === r.id && m.take !== '-')).length;
  let html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sound Library Review</title><style>
:root{--bg:#f7f5f0;--fg:#1d1b18;--muted:#6b665d;--line:#ddd6c8;--miss:#a33;--card:#fff}
@media (prefers-color-scheme:dark){:root{--bg:#191816;--fg:#ece8df;--muted:#a39d91;--line:#3a3731;--miss:#e77;--card:#22201d}}
body{margin:0;padding:16px;background:var(--bg);color:var(--fg);font:14px/1.45 system-ui,sans-serif}
h1{font-size:20px;margin:0 0 4px}h2{font-size:16px;margin:28px 0 8px;border-bottom:1px solid var(--line);padding-bottom:4px}
nav a{margin-right:10px;color:inherit}.row{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:8px 10px;margin:6px 0}
.id{font-weight:600}.meta{color:var(--muted);font-size:12px}.takes{display:flex;flex-wrap:wrap;gap:10px;margin-top:6px}
.take{font-size:12px;color:var(--muted)}.take audio{display:block;height:32px;max-width:100%}.miss{color:var(--miss);font-size:12px}
</style></head><body><h1>Sound library review</h1><p class="meta">${filled} of ${rows.length} rows have at least one take. Each take names its license; audio/CREDITS.md lists them. Built ${new Date().toISOString().slice(0, 16).replace('T', ' ')}.</p><nav>${cats.map((c) => `<a href="#${c}">${c}</a>`).join('')}</nav>`;
  for (const c of cats) {
    html += `<h2 id="${c}">${c}</h2>`;
    for (const r of rows.filter((x) => x.id.startsWith(c + '/'))) {
      const takes = man.filter((m) => m.id === r.id && m.take !== '-');
      const m = man.find((x) => x.id === r.id && x.take === '-');
      html += `<div class="row"><span class="id">${esc(r.id)}</span> <span class="meta">${r.priority} · ${r.length} · ${takes.length}/${r.takes} · ${esc(r.description)}</span><div class="takes">`;
      for (const t of takes)
        html += `<div class="take"><audio controls preload="none" src="../../audio/${esc(t.file)}"></audio>#${t.take} ${t.seconds} s · <a href="${esc(t.url)}">${esc(t.source)}</a> (${esc(t.author)}${t.license === 'CC0' ? '' : ', ' + esc(t.license)})${t.note ? ' · ' + esc(t.note) : ''}</div>`;
      if (!takes.length && m) html += `<span class="miss">missing: ${esc(m.note)}</span>`;
      html += '</div></div>';
    }
  }
  html += '</body></html>\n';
  mkdirSync(REVIEW, { recursive: true });
  writeFileSync(join(REVIEW, 'index.html'), html);
  console.log(`wrote ${relative(ROOT, join(REVIEW, 'index.html'))} (${filled}/${rows.length} rows with takes)`);
}

// ---------- owner review ----------

const LOG_COLS = ['date', 'id', 'take', 'file', 'decision', 'source', 'source_file', 'start', 'end'];

function readTsv(path, cols) {
  if (!existsSync(path)) return [];
  const [, ...lines] = readFileSync(path, 'utf8').trim().split('\n');
  return lines.filter(Boolean).map((l) => Object.fromEntries(l.split('\t').map((v, i) => [cols[i], v])));
}

function appendTsv(path, cols, row) {
  if (!existsSync(path)) writeFileSync(path, cols.join('\t') + '\n');
  appendFileSync(path, cols.map((c) => String(row[c] ?? '').replace(/[\t\n]/g, ' ')).join('\t') + '\n');
}

const readReviewLog = () => readTsv(REVIEW_LOG, LOG_COLS);

/** The latest owner note for each row. */
function ownerNotes() {
  return new Map(readTsv(REVIEW_NOTES, ['date', 'id', 'note']).map((r) => [r.id, r.note]));
}

/** Applies a review.json from the review page: rejected takes go, approvals and notes are logged. */
function applyReview(file) {
  const review = JSON.parse(readFileSync(file, 'utf8'));
  const date = (review.submitted_at ?? new Date().toISOString()).slice(0, 16).replace('T', ' ');
  const log = readReviewLog();
  const man = allManifest();
  let dropped = 0;
  let approved = 0;
  let unknown = 0;
  for (const d of review.decisions ?? []) {
    const m = man.find((r) => r.id === d.id && r.file === d.file && r.take !== '-');
    if (!m) {
      unknown++;
      continue;
    }
    if (d.decision === 'reject') {
      appendTsv(REVIEW_LOG, LOG_COLS, { date, id: m.id, take: m.take, file: m.file, decision: 'reject', source: m.source, source_file: m.source_file, start: m.start, end: m.end });
      withManifest(m.id, (rows) => writeManifest(manifestPath(m.id), rows.filter((r) => !(r.id === m.id && r.take === m.take))));
      rmSync(join(LIB, m.file), { force: true });
      dropped++;
    } else if (d.decision === 'approve' && !log.some((r) => r.file === m.file && r.decision === 'approve')) {
      appendTsv(REVIEW_LOG, LOG_COLS, { date, id: m.id, take: m.take, file: m.file, decision: 'approve', source: m.source, source_file: m.source_file, start: m.start, end: m.end });
      approved++;
    }
  }
  const notes = Object.entries(review.notes ?? {});
  for (const [id, note] of notes) appendTsv(REVIEW_NOTES, ['date', 'id', 'note'], { date, id, note });
  console.log(`review of ${date}: ${approved} approved, ${dropped} rejected and dropped, ${notes.length} notes${unknown ? `, ${unknown} unknown takes skipped` : ''}`);
  for (const [id, note] of notes) console.log(`  note ${id}: ${note}`);
  return { approved, dropped, notes: notes.length, unknown };
}

/** The rows and takes for the review page; `sig` changes when a take, a miss, or a review changes. */
function reviewData() {
  const list = readList();
  const man = allManifest();
  const approvedFiles = new Set(readReviewLog().filter((r) => r.decision === 'approve').map((r) => r.file));
  const rows = list.map((r) => {
    const miss = man.find((m) => m.id === r.id && m.take === '-');
    const takes = man
      .filter((m) => m.id === r.id && m.take !== '-')
      .sort((x, y) => Number(x.take) - Number(y.take))
      .map((m) => ({ k: m.file, n: Number(m.take), s: m.seconds, src: m.source, a: m.author, lic: m.license === 'CC0' ? undefined : m.license, url: m.url, note: m.note || undefined, r: approvedFiles.has(m.file) ? 'approve' : undefined, f: 'audio/' + m.file }));
    return { id: r.id, d: r.description, u: r.used_by, p: r.priority, l: r.length, w: r.takes, miss: miss?.note, takes };
  });
  const sig = String(rows.reduce((n, r) => n + r.takes.length * 31 + (r.miss ? 7 : 0), 0)) + ':' + approvedFiles.size + ':' + man.length;
  return { built: new Date().toISOString().slice(0, 16).replace('T', ' '), sig, rows };
}

/**
 * The owner's review page on http://localhost:<port>/: the page, data.json, the audio files, and
 * POST /review, which saves the submission in out/audio-review/submissions/ and applies it.
 */
function serve() {
  const port = Number(flags.port ?? 4178);
  const send = (res, code, type, body) => {
    res.writeHead(code, { 'content-type': type, 'cache-control': 'no-store' });
    res.end(body);
  };
  createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    try {
      if (req.method === 'POST' && url.pathname === '/review') {
        let body = '';
        req.on('data', (c) => (body += c));
        req.on('end', () => {
          try {
            JSON.parse(body);
            mkdirSync(SUBMISSIONS, { recursive: true });
            const file = join(SUBMISSIONS, new Date().toISOString().replace(/[:.]/g, '-') + '.json');
            writeFileSync(file, body);
            const result = applyReview(file);
            console.log(`review received: ${relative(ROOT, file)}`);
            send(res, 200, 'application/json', JSON.stringify(result));
          } catch (err) {
            send(res, 400, 'text/plain', String(err.message ?? err));
          }
        });
        return;
      }
      if (url.pathname === '/' || url.pathname === '/index.html') return send(res, 200, 'text/html; charset=utf-8', readFileSync(join(ROOT, 'scripts/sfx-review.html')));
      if (url.pathname === '/data.json') return send(res, 200, 'application/json', JSON.stringify(reviewData()));
      if (url.pathname.startsWith('/audio/')) {
        const file = resolve(LIB, decodeURIComponent(url.pathname.slice('/audio/'.length)));
        if (!file.startsWith(LIB + sep) || !file.endsWith('.mp3') || !existsSync(file)) return send(res, 404, 'text/plain', 'not found');
        const data = readFileSync(file);
        const range = /bytes=(\d*)-(\d*)/.exec(req.headers.range ?? '');
        if (range) {
          const from = range[1] ? Number(range[1]) : 0;
          const to = range[2] ? Number(range[2]) : data.length - 1;
          res.writeHead(206, { 'content-type': 'audio/mpeg', 'cache-control': 'no-store', 'accept-ranges': 'bytes', 'content-range': `bytes ${from}-${to}/${data.length}`, 'content-length': to - from + 1 });
          return res.end(data.subarray(from, to + 1));
        }
        res.writeHead(200, { 'content-type': 'audio/mpeg', 'cache-control': 'no-store', 'accept-ranges': 'bytes', 'content-length': data.length });
        return res.end(data);
      }
      send(res, 404, 'text/plain', 'not found');
    } catch (err) {
      send(res, 500, 'text/plain', String(err.message ?? err));
    }
  }).listen(port, '127.0.0.1', () => console.log(`review page: http://localhost:${port}/`));
}

/** Renumbers takes whose file name was used by a rejected take (a bug before the numbering fix). */
function renumber(prefix) {
  const log = readReviewLog();
  const rejectedFiles = new Set(log.filter((r) => r.decision === 'reject').map((r) => r.file));
  for (const cat of [...new Set(readList().map((r) => r.id.split('/')[0]))].filter((c) => c.startsWith(prefix.split('/')[0]))) {
    const mpath = join(MANIFESTS, cat + '.tsv');
    const rows = readManifest(mpath);
    let changed = 0;
    for (const r of rows) {
      if (r.take === '-' || !rejectedFiles.has(r.file) || !r.id.startsWith(prefix)) continue;
      const used = [...rows.filter((x) => x.id === r.id && x.take !== '-').map((x) => Number(x.take)), ...log.filter((x) => x.id === r.id).map((x) => Number(x.take))];
      const n = Math.max(0, ...used) + 1;
      const name = r.id.split('/')[1];
      const file = `${cat}/${name}-${n}.mp3`;
      renameSync(join(LIB, r.file), join(LIB, file));
      console.log(`${r.file} -> ${file}`);
      r.take = String(n);
      r.file = file;
      changed++;
    }
    if (changed) writeManifest(mpath, rows);
  }
}

// ---------- credits ----------

/**
 * Writes audio/CREDITS.md from the manifests: the lines for a credits screen (every attribution
 * source and the ElvGames packs), then every take by license. Every take is modified by the tool.
 */
function credits() {
  const takes = allManifest().filter((r) => r.take !== '-');
  const bySlug = new Map(catalog().entries.map((e) => [e.slug, e]));
  const title = (r) => bySlug.get(r.source)?.title ?? r.source;
  const cell = (v) => String(v ?? '').replace(/\|/g, '\\|');
  const of = (pred) => takes.filter(pred).sort((a, b) => a.file.localeCompare(b.file));
  const attribution = of((r) => !NO_CREDIT.has(r.license) && r.license !== 'ElvGames');
  const elv = of((r) => r.license === 'ElvGames');
  const cc0 = of((r) => NO_CREDIT.has(r.license));
  const sources = [...new Map(attribution.map((r) => [r.source, r])).values()].sort((a, b) => title(a).localeCompare(title(b)));
  const out = [
    '# Sound credits',
    '',
    'This file lists the source of every sound in `audio/`. `node scripts/sfx-library.mjs credits` writes it',
    'from the manifests; do not edit it by hand.',
    '',
    'Every file is modified: the tool cut it from the source, removed the quiet start and end, leveled it,',
    'and encoded it as MP3 (a loop also gets a cross-fade at the seam, unless the source already loops).',
    '',
    '## Lines for a credits screen',
    '',
  ];
  if (elv.length) out.push('- Sound effects by ElvGames & Pegonthetrack (https://elvgames.itch.io), modified.');
  for (const r of sources) out.push(`- "${title(r)}" by ${r.author}, ${r.license}, ${r.url}, modified.`);
  if (!elv.length && !sources.length) out.push('No take needs a credit: every take is CC0.');
  out.push('', `## Attribution licenses (${attribution.length} files)`, '', '| File | Source | Author | License |', '| --- | --- | --- | --- |');
  for (const r of attribution) out.push(`| ${cell(r.file)} | [${cell(title(r))}](${r.url}) | ${cell(r.author)} | ${r.license} |`);
  out.push('', `## ElvGames (${elv.length} files)`, '', 'Bought by the owner; license: https://elvgames.itch.io/terms.', '', '| File | Pack | Source file |', '| --- | --- | --- |');
  for (const r of elv) out.push(`| ${cell(r.file)} | ${cell(title(r))} | ${cell(basename(r.source_file))} |`);
  out.push('', `## CC0 and public domain (${cc0.length} files)`, '', 'No attribution needed; listed with thanks.', '', '| File | Source | Author |', '| --- | --- | --- |');
  for (const r of cc0) out.push(`| ${cell(r.file)} | [${cell(title(r))}](${r.url}) | ${cell(r.author)} |`);
  writeFileSync(CREDITS, out.join('\n') + '\n');
  console.log(`wrote ${relative(ROOT, CREDITS)}: ${attribution.length} attribution, ${elv.length} ElvGames, ${cc0.length} CC0 takes`);
}

// ---------- main ----------

switch (cmd) {
  case 'catalog':
    await buildCatalog();
    break;
  case 'elvgames':
    buildElvCatalog();
    break;
  case 'find':
    await find(args[0], args.slice(1));
    break;
  case 'credits':
    credits();
    break;
  case 'search':
    search(args);
    break;
  case 'entry':
    showEntry(args[0] ?? fail('usage: entry <slug>'));
    break;
  case 'fetch':
    await fetchEntry(args[0] ?? fail('usage: fetch <slug> [--max-mb n]'));
    break;
  case 'files':
    listFiles(args[0] ?? fail('usage: files <slug> [filter]'), args[1] ?? '');
    break;
  case 'probe':
    probe(args[0] ?? fail('usage: probe <file>'));
    break;
  case 'take':
    if (args.length < 2) fail('usage: take <id> <file> [--start s] [--end s] [--note text] [--force] [--checked] [--seamless]');
    take(args[0], args[1]);
    break;
  case 'drop':
    drop(args[0], args[1]);
    break;
  case 'miss':
    miss(args[0], args.slice(1).join(' '));
    break;
  case 'rebuild':
    rebuild(args[0] ?? '');
    break;
  case 'renumber':
    renumber(args[0] ?? fail('usage: renumber <category/>'));
    break;
  case 'rows':
    rowsCmd(args);
    break;
  case 'status':
    status(args[0] ?? '');
    break;
  case 'review':
    serve();
    break;
  case 'apply-review':
    applyReview(args[0] ?? fail('usage: apply-review <review.json>'));
    break;
  case 'page':
    page();
    break;
  default:
    console.error(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 20).map((l) => l.replace(/^\/\/ ?/, '')).join('\n'));
    process.exit(2);
}
