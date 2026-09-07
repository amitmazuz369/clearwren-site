/**
 * Feasibility harness: can we measure real-world Confluence accessibility from
 * public sites? Reads only what robots.txt allows, at the crawl-delay it states,
 * and reports in aggregate. No institution is named in anything published.
 */
import { audit, rollUp } from '/Users/amitmazuz369/clearwren/packages/engine/dist/src/index.js';

const SITE = process.argv[2];
const LIMIT = Number(process.argv[3] ?? 25);
const CRAWL_DELAY_MS = 1000;           // uconn robots.txt states Crawl-delay: 1
const UA = 'ClearwrenAccessibilityResearch/0.1 (+https://clearwren.com)';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const get = async (path) => {
  const res = await fetch(`https://${SITE}${path}`, { headers: { Accept: 'application/json', 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${res.status} on ${path}`);
  return res.json();
};

const spaces = (await get('/wiki/api/v2/spaces?limit=5')).results ?? [];
console.log(`public spaces reachable: ${spaces.length}`);

const results = [];
for (const space of spaces) {
  if (results.length >= LIMIT) break;
  await wait(CRAWL_DELAY_MS);
  let pages = [];
  try {
    pages = (await get(`/wiki/api/v2/spaces/${space.id}/pages?limit=10&body-format=atlas_doc_format`)).results ?? [];
  } catch { continue; }
  for (const page of pages) {
    if (results.length >= LIMIT) break;
    const raw = page?.body?.atlas_doc_format?.value;
    if (!raw) continue;
    let adf;
    try { adf = JSON.parse(raw); } catch { continue; }
    const r = audit(adf, { title: page.title, pageId: String(page.id) });
    results.push(r);
  }
}

// rollUp takes { result } entries, the same shape the app stores per page.
const report = rollUp(results.map((r) => ({ result: r })));

console.log(`\npages measured        : ${report.pages}`);
console.log(`pages with no A/AA fail: ${report.conformantPages} (${Math.round(100 * report.conformantPages / Math.max(1, report.pages))}%)`);
console.log(`average score          : ${report.averageScore}/100`);
console.log(`critical/serious/moderate/advisory: ${report.counts.critical}/${report.counts.serious}/${report.counts.moderate}/${report.counts.advisory}`);
console.log('\ntop failures by frequency:');
for (const r of report.byRule.slice(0, 8)) {
  console.log(`  ${String(r.issues).padStart(4)} across ${String(r.pages).padStart(3)} pages  ${r.severity.padEnd(8)} ${r.title}`);
}
