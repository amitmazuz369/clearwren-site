/** Runs our own rule engine over our own built site. If we ship accessibility
 *  checking, our pages had better pass the checks we sell. */
import { htmlToAdf, titleOf } from './html-to-adf.mjs';
import { audit } from '../packages/engine/dist/src/index.js';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const dir = 'site';
let failed = 0;
for (const file of readdirSync(dir).filter((f) => f.endsWith('.html'))) {
  const html = readFileSync(join(dir, file), 'utf8');
  const r = audit(htmlToAdf(html), { meta: { title: titleOf(html) } });
  // Our own pages legitimately use one H1, which Confluence would supply itself.
  // A guide may also quote a bad example on purpose; those pages declare which
  // rule they expect to trip, so the exemption is visible in the source.
  const allowed = new Set(
    [...html.matchAll(/<!--\s*selfcheck-allow:\s*([a-z0-9-]+)\s*-->/g)].map((m) => m[1]),
  );
  const issues = r.issues.filter((i) => i.ruleId !== 'heading-h1-in-body' && !allowed.has(i.ruleId));
  const flag = issues.length ? 'ISSUES' : 'clean ';
  if (issues.length) failed++;
  console.log(`${flag} ${String(r.score).padStart(3)}  ${file}`);
  for (const i of issues) {
    console.log(`         ${i.severity.padEnd(9)} ${i.ruleId.padEnd(26)} ${JSON.stringify(i.evidence ?? i.data ?? '')}`.slice(0, 160));
  }
}
console.log(failed ? `\n${failed} page(s) with findings` : '\nall pages clean');
