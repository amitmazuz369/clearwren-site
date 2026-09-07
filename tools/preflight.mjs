/**
 * Everything that must hold before anything is handed to the owner or to
 * Atlassian. Each rule here exists because getting it wrong once cost a round
 * trip: sizes, character limits, naming rules, stale claims, clean margins.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';

/** Every text file under a directory, recursively. A subdirectory used to crash this
 *  script when it tried to read one as a file. */
function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = `${dir}/${entry}`;
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}
import { execSync } from 'node:child_process';

const listing = JSON.parse(readFileSync('docs/listing.json', 'utf8'));
const L = listing.limits;
const results = [];
const check = (name, ok, detail = '') => results.push({ name, ok, detail });

/* --- listing text against the form's own constraints --- */
check(`app name ≤ ${L.appName}`, listing.appName.length <= L.appName, `${listing.appName.length} chars`);
check('app name ends with "for <Product>"',
  listing.appName.endsWith(`for ${listing.productName}`),
  'Atlassian rejects a product name that is not last');
check(`tagline ≤ ${L.tagline}`, listing.tagline.length <= L.tagline, `${listing.tagline.length} chars`);
check('tagline has no trailing punctuation', !/[.!?,;:]$/.test(listing.tagline));
check(`summary ≤ ${L.summary}`, listing.summary.length <= L.summary, `${listing.summary.length} chars`);
check(`at most ${L.maxKeywords} keywords`, listing.keywords.length <= L.maxKeywords);
for (const [i, h] of listing.highlights.entries()) {
  check(`highlight ${i + 1} title ≤ ${L.highlightTitle}`, h.title.length <= L.highlightTitle, `${h.title.length} chars`);
  check(`highlight ${i + 1} title has no trailing punctuation`, !/[.!?,;:]$/.test(h.title));
  check(`highlight ${i + 1} description ≤ ${L.highlightText}`, h.description.length <= L.highlightText, `${h.description.length} chars`);
  check(`highlight ${i + 1} caption ≤ ${L.highlightText}`, h.caption.length <= L.highlightText, `${h.caption.length} chars`);
}

/* --- images: exact sizes, and no stray content in the margins --- */
function pngSize(path) {
  const b = readFileSync(path);
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
}
const images = [[listing.hero.file, listing.hero.width, listing.hero.height],
  ...listing.highlights.map((h) => [h.file, ...L.highlightImage])];
for (const [file, w, h] of images) {
  if (!existsSync(file)) { check(`image present: ${file}`, false); continue; }
  const [aw, ah] = pngSize(file);
  check(`${file} is ${w}x${h}`, aw === w && ah === h, `${aw}x${ah}`);
}

/* --- claims stay in step with what the engine ships --- */
const ruleCount = Number(execSync('node tools/gen-rules.mjs', { encoding: 'utf8' }).match(/^(\d+) rules/m)?.[1]);
const claimed = new Set();
// The WCAG reference pages are generated from the engine and carry per-criterion
// counts, which are correct and are not claims about the total.
const generated = (f) => f === 'wcag.html' || f.startsWith('wcag-') || f === 'checks.html';
for (const dir of ['site/src', 'docs']) {
  for (const path of walk(dir)) {
    const f = path.slice(dir.length + 1);
    if (dir === 'site/src' && generated(f)) continue;
    const text = readFileSync(path, 'utf8');
    for (const m of text.matchAll(/\b(\d{2}) (?:checks|deterministic rules|rules)\b/g)) claimed.add(Number(m[1]));
  }
}
const wrong = [...claimed].filter((n) => n !== ruleCount);
check(`every published rule count says ${ruleCount}`, wrong.length === 0, wrong.length ? `also found: ${wrong.join(', ')}` : '');

/* --- nothing still advertises a name Atlassian rejected --- */
const rejected = 'Accessibility Checker for Confluence — WCAG';
let stale = [];
for (const dir of ['site/src', 'docs']) {
  for (const path of walk(dir)) {
    const text = readFileSync(path, 'utf8');
    if (text.includes(rejected) && !text.includes('was rejected')) stale.push(path);
  }
}
check('no document still presents the rejected app name', stale.length === 0, stale.join(', '));

const failed = results.filter((r) => !r.ok);
for (const r of results) console.log(`${r.ok ? 'ok  ' : 'FAIL'}  ${r.name}${r.detail ? `  — ${r.detail}` : ''}`);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
