/**
 * Measures the accessibility of documentation published in public Confluence Cloud
 * sites, using the same engine we sell.
 *
 * Method, deliberately stated in the code because it is the part that decides whether
 * the number means anything:
 *
 *   1. Enumerate the whole public page pool for a site, not the first N. The v2 API
 *      returns `parentId`, so depth is knowable: a null parent is a top-level page.
 *   2. Sample at random from that pool. An earlier run took the first ten pages of each
 *      space and reported 90% clean — an artefact, because those are landing pages with
 *      no images and no tables.
 *   3. Report top-level and deeper pages separately, so the artefact is visible rather
 *      than hidden inside an average.
 *   4. Honour each site's own robots.txt crawl-delay.
 *   5. Aggregate only. No institution is ever named in anything published.
 */
import { audit, rollUp } from '../packages/engine/dist/src/index.js';
import { writeFileSync } from 'node:fs';

const UA = 'ClearwrenAccessibilityResearch/0.1 (+https://clearwren.com)';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function crawlDelayMs(site) {
  try {
    const txt = await (await fetch(`https://${site}/robots.txt`, { headers: { 'User-Agent': UA } })).text();
    const m = txt.match(/crawl-delay:\s*([\d.]+)/i);
    return m ? Math.max(1000, Number(m[1]) * 1000) : 1000;
  } catch { return 1000; }
}

async function get(site, path) {
  const res = await fetch(`https://${site}${path}`, {
    headers: { Accept: 'application/json', 'User-Agent': UA },
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

/** Every public page id on the site, with its parent, so depth is known. */
async function pool(site, delay, cap = 2000) {
  const out = [];
  let path = '/wiki/api/v2/pages?limit=250&status=current';
  while (path && out.length < cap) {
    const d = await get(site, path);
    for (const p of d.results ?? []) out.push({ id: String(p.id), title: p.title, topLevel: !p.parentId });
    const next = d._links?.next;
    path = next ? (next.startsWith('/wiki') ? next : `/wiki${next}`) : null;
    if (path) await wait(delay);
  }
  return out;
}

function sample(arr, n) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

export async function surveySite(site, n = 100) {
  const delay = await crawlDelayMs(site);
  const all = await pool(site, delay);
  if (!all.length) return null;
  const chosen = sample(all, Math.min(n, all.length));

  const results = [];
  for (const page of chosen) {
    await wait(delay);
    try {
      const d = await get(site, `/wiki/api/v2/pages/${page.id}?body-format=atlas_doc_format`);
      const raw = d?.body?.atlas_doc_format?.value;
      if (!raw) continue;
      results.push({ topLevel: page.topLevel, result: audit(JSON.parse(raw), { title: d.title, pageId: page.id }) });
    } catch { /* a page can vanish or be restricted between listing and fetch */ }
  }
  if (!results.length) return null;

  const slice = (rs) => (rs.length ? rollUp(rs) : null);
  return {
    poolSize: all.length,
    sampled: results.length,
    crawlDelayMs: delay,
    all: slice(results),
    topLevel: slice(results.filter((r) => r.topLevel)),
    deeper: slice(results.filter((r) => !r.topLevel)),
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const site = process.argv[2];
  const n = Number(process.argv[3] ?? 100);
  const r = await surveySite(site, n);
  if (!r) { console.log('no public pages reachable'); process.exit(1); }
  const pct = (a, b) => `${Math.round((100 * a) / Math.max(1, b))}%`;
  const line = (name, s) => s &&
    console.log(`${name.padEnd(12)} ${String(s.pages).padStart(4)} pages   ${pct(s.conformantPages, s.pages).padStart(4)} clean   avg ${s.averageScore}/100`);
  console.log(`pool ${r.poolSize} public pages, sampled ${r.sampled}, crawl-delay ${r.crawlDelayMs}ms\n`);
  line('all', r.all); line('top-level', r.topLevel); line('deeper', r.deeper);
  console.log('\ntop failures across the sample:');
  for (const x of r.all.byRule.slice(0, 8)) {
    console.log(`  ${String(x.issues).padStart(4)} across ${String(x.pages).padStart(3)} pages  ${x.severity.padEnd(8)} ${x.title}`);
  }
  writeFileSync(`survey-${site.replace(/\W/g, '-')}.json`, JSON.stringify(r, null, 2));
}
