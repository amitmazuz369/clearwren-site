/** Runs the survey across a seed list of public sites and writes one aggregate.
 *  Sites are stored by an opaque label; nothing published ever names an institution. */
import { surveySite } from './public-survey.mjs';
import { writeFileSync } from 'node:fs';

const SITES = [
  'uconn.atlassian.net',
  'su-support.atlassian.net',
  'mcgill-public-kb.atlassian.net',
  'uwaterloo.atlassian.net',
  'ucsb-engr.atlassian.net',
  'apiit.atlassian.net',
  'ithelpcentre.atlassian.net',
];
const PER_SITE = Number(process.argv[2] ?? 100);

const out = [];
for (const [i, site] of SITES.entries()) {
  process.stdout.write(`[${i + 1}/${SITES.length}] ${site} ... `);
  try {
    const r = await surveySite(site, PER_SITE);
    if (!r) { console.log('no public pages'); continue; }
    out.push({ label: `site-${String(i + 1).padStart(2, '0')}`, ...r });
    console.log(`${r.sampled} pages, ${Math.round(100 * r.all.conformantPages / r.all.pages)}% clean, avg ${r.all.averageScore}`);
  } catch (e) { console.log(`unreachable (${e.message})`); }
}

const tot = out.reduce((a, s) => {
  a.pages += s.all.pages; a.clean += s.all.conformantPages;
  a.scoreSum += s.all.averageScore * s.all.pages;
  for (const k of Object.keys(a.counts)) a.counts[k] += s.all.counts[k];
  for (const r of s.all.byRule) {
    const e = a.byRule.get(r.ruleId) ?? { ...r, pages: 0, issues: 0, sites: 0 };
    e.issues += r.issues; e.pages += r.pages; e.sites++;
    a.byRule.set(r.ruleId, e);
  }
  return a;
}, { pages: 0, clean: 0, scoreSum: 0, counts: { critical: 0, serious: 0, moderate: 0, advisory: 0 }, byRule: new Map() });

const summary = {
  generatedAt: new Date().toISOString(),
  sitesMeasured: out.length,
  pagesMeasured: tot.pages,
  pagesClean: tot.clean,
  percentClean: Math.round((100 * tot.clean) / Math.max(1, tot.pages)),
  averageScore: Math.round(tot.scoreSum / Math.max(1, tot.pages)),
  counts: tot.counts,
  byRule: [...tot.byRule.values()].sort((a, b) => b.pages - a.pages),
  perSite: out.map((s) => ({
    label: s.label, poolSize: s.poolSize, sampled: s.sampled,
    percentClean: Math.round((100 * s.all.conformantPages) / s.all.pages),
    averageScore: s.all.averageScore,
  })),
};
writeFileSync('survey-aggregate.json', JSON.stringify(summary, null, 2));

console.log(`\n=== ${summary.sitesMeasured} sites, ${summary.pagesMeasured} pages ===`);
console.log(`clean: ${summary.percentClean}%   average score: ${summary.averageScore}/100`);
console.log(`critical ${tot.counts.critical} / serious ${tot.counts.serious} / moderate ${tot.counts.moderate} / advisory ${tot.counts.advisory}`);
console.log('\nmost widespread failures (by pages affected):');
for (const r of summary.byRule.slice(0, 10)) {
  console.log(`  ${String(r.pages).padStart(4)} pages, ${String(r.sites).padStart(2)} sites  ${r.severity.padEnd(8)} ${r.title}`);
}
