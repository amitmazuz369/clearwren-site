import { htmlToAdf, titleOf } from './html-to-adf.mjs';
import { audit } from '../packages/engine/dist/src/index.js';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = process.argv[2] ?? join(dirname(fileURLToPath(import.meta.url)), '..', 'research', 'pages');
const totals = {};
let pages = 0;
for (const file of readdirSync(dir).filter((f) => f.endsWith('.html'))) {
  const html = readFileSync(join(dir, file), 'utf8');
  const adf = htmlToAdf(html);
  const result = audit(adf, { meta: { title: titleOf(html) } });
  pages++;
  console.log(`\n=== ${file}  (score ${result.score}, ${result.stats.words} words, ${result.stats.images} img, ${result.stats.tables} tables, ${result.stats.links} links)`);
  const byRule = {};
  for (const i of result.issues) byRule[i.ruleId] = (byRule[i.ruleId] ?? 0) + 1;
  for (const [id, n] of Object.entries(byRule).sort((a, b) => b[1] - a[1])) {
    totals[id] = (totals[id] ?? 0) + n;
    const sample = result.issues.find((i) => i.ruleId === id);
    console.log(`   ${String(n).padStart(4)}  ${id.padEnd(26)} e.g. ${JSON.stringify(sample.evidence ?? sample.data ?? '')}`.slice(0, 170));
  }
}
console.log(`\n########## ${pages} pages, totals by rule ##########`);
for (const [id, n] of Object.entries(totals).sort((a, b) => b[1] - a[1])) {
  console.log(`${String(n).padStart(5)}  ${id}`);
}
