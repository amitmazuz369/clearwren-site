/** Wider re-run of the public Confluence accessibility survey.
 *
 *  Adds a second tranche of sites to the original seven, chosen to break the
 *  education skew the first study declared as its main limitation: the new sites
 *  are open-source software projects, research-computing centres and a clinical
 *  terminology body. All serve /wiki/ anonymously with Crawl-delay: 1, verified
 *  2026-09-08. Nothing published names an institution.
 *
 *  Output goes to a dated file; it does not touch survey-aggregate.json or the
 *  published study. Deciding whether to republish is a separate step.
 */
import { surveySite } from './public-survey.mjs';
import { writeFileSync } from 'node:fs';

const ORIGINAL = [
  'uconn.atlassian.net',
  'su-support.atlassian.net',
  'mcgill-public-kb.atlassian.net',
  'uwaterloo.atlassian.net',
  'ucsb-engr.atlassian.net',
  'apiit.atlassian.net',
  'ithelpcentre.atlassian.net',
];
const ADDED = [
  'openmrs.atlassian.net',
  'apereo.atlassian.net',
  'samvera.atlassian.net',
  'pawsey.atlassian.net',
  'snomed.atlassian.net',
  'openlmis.atlassian.net',
];
const SITES = [...ORIGINAL, ...ADDED];
const PER_SITE = Number(process.argv[2] ?? 100);

const out = [];
for (const [i, site] of SITES.entries()) {
  process.stdout.write(`[${i + 1}/${SITES.length}] ${site} ... `);
  try {
    const r = await surveySite(site, PER_SITE);
    if (!r) { console.log('no public pages'); continue; }
    out.push({ label: `site-${String(i + 1).padStart(2, '0')}`, tranche: i < ORIGINAL.length ? 'original' : 'added', ...r });
    console.log(`${r.sampled} pages, ${Math.round(100 * r.all.conformantPages / r.all.pages)}% clean, avg ${r.all.averageScore}`);
  } catch (e) { console.log(`unreachable (${e.message})`); }
}

function aggregate(rows) {
  const tot = rows.reduce((a, s) => {
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
  return {
    sitesMeasured: rows.length,
    pagesMeasured: tot.pages,
    pagesClean: tot.clean,
    percentClean: Math.round((100 * tot.clean) / Math.max(1, tot.pages)),
    averageScore: Math.round(tot.scoreSum / Math.max(1, tot.pages)),
    counts: tot.counts,
    byRule: [...tot.byRule.values()].sort((a, b) => b.pages - a.pages),
  };
}

const summary = {
  generatedAt: new Date().toISOString(),
  all: aggregate(out),
  original: aggregate(out.filter((s) => s.tranche === 'original')),
  added: aggregate(out.filter((s) => s.tranche === 'added')),
  perSite: out.map((s) => ({
    label: s.label, tranche: s.tranche, poolSize: s.poolSize, sampled: s.sampled,
    percentClean: Math.round((100 * s.all.conformantPages) / s.all.pages),
    averageScore: s.all.averageScore,
  })),
};
const stamp = new Date().toISOString().slice(0, 10);
writeFileSync(`survey-aggregate-${stamp}-wide.json`, JSON.stringify(summary, null, 2));

const s = summary.all;
console.log(`\n=== ${s.sitesMeasured} sites, ${s.pagesMeasured} pages ===`);
console.log(`clean: ${s.percentClean}%   average score: ${s.averageScore}/100`);
console.log(`original 7: ${summary.original.percentClean}% clean over ${summary.original.pagesMeasured} pages`);
console.log(`added 6:    ${summary.added.percentClean}% clean over ${summary.added.pagesMeasured} pages`);
console.log(`critical ${s.counts.critical} / serious ${s.counts.serious} / moderate ${s.counts.moderate} / advisory ${s.counts.advisory}`);
console.log('\nmost widespread failures (by pages affected):');
for (const r of s.byRule.slice(0, 10)) {
  console.log(`  ${String(r.pages).padStart(4)} pages, ${String(r.sites).padStart(2)} sites  ${r.severity.padEnd(8)} ${r.title}`);
}
