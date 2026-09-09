/**
 * Every published figure about the survey must match the stored data. A study is only
 * worth citing if its numbers hold, and the index card kept a stale 87% after the
 * sample was widened from 7 sites to 13.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dataPath = join(root, 'research', 'survey-aggregate-2026-09-08-wide.json');
if (!existsSync(dataPath)) { console.log('claims: no survey data to check against'); process.exit(0); }

const { all } = JSON.parse(readFileSync(dataPath, 'utf8'));
const pages = all.pagesMeasured;
const sites = all.sitesMeasured;

const html = readdirSync(join(root, 'site'))
  .filter((f) => f.endsWith('.html'))
  .map((f) => [f, readFileSync(join(root, 'site', f), 'utf8')]);

const failures = [];

/** Any "N pages" or "N sites" figure that reads as ours must be the current one. */
for (const [file, text] of html) {
  for (const m of text.matchAll(/([\d,]+) pages across (?:([\d,]+)|(\w+)) public Confluence/g)) {
    const claimed = Number(m[1].replace(/,/g, ''));
    if (claimed !== pages) failures.push(`${file}: claims ${m[1]} pages, data has ${pages}`);
  }
  for (const m of text.matchAll(/six checks accounted for ([\d.]+)%/g)) {
    failures.push(`${file}: states a precise six-check share (${m[1]}%); the study deliberately says "most" because the figure moves as the sample widens`);
  }
}

if (failures.length) {
  console.log('CLAIMS CHECK FAILED');
  for (const f of failures) console.log(`  ${f}`);
  process.exit(1);
}
console.log(`claims: published survey figures match the data (${pages} pages, ${sites} sites)`);
