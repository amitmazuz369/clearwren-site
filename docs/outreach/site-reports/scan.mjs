/**
 * Page-level accessibility snapshot of one public Confluence Cloud site, for a
 * private report sent to that organisation only.
 *
 * Same manners as the survey: anonymous v2 API, the site's own robots.txt
 * crawl-delay, a random sample from the whole public page pool. Keeps only what
 * the engine is CERTAIN about at WCAG level A/AA with critical or serious
 * severity — a report sent to an institution cannot contain a guess.
 *
 * Usage: node docs/outreach/site-reports/scan.mjs <host> [sample=80]
 */
import { audit, RULES_BY_ID } from '../../../packages/engine/dist/src/index.js';
import { mkdirSync, writeFileSync } from 'node:fs';

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
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
}

async function pool(site, delay, cap = 2000) {
  const out = [];
  let path = '/wiki/api/v2/pages?limit=250&status=current';
  while (path && out.length < cap) {
    let d;
    try { d = await get(site, path); } catch { break; }
    for (const p of d.results ?? []) out.push(String(p.id));
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

/** A finding goes in the report only if it would fail an A/AA conformance claim. */
function isBlocking(issue) {
  if (issue.confidence !== 'certain') return false;
  if (issue.severity !== 'critical' && issue.severity !== 'serious') return false;
  return Boolean(RULES_BY_ID[issue.ruleId]?.wcag.some((w) => w.level !== 'AAA'));
}

export async function scanPage(site, id) {
  const d = await get(site, `/wiki/api/v2/pages/${id}?body-format=atlas_doc_format`);
  const raw = d?.body?.atlas_doc_format?.value;
  if (!raw) return null;
  const r = audit(JSON.parse(raw), { meta: { title: d.title } });
  return {
    id: String(d.id),
    title: d.title,
    url: `https://${site}/wiki${d._links?.webui ?? `/pages/viewpage.action?pageId=${d.id}`}`,
    score: r.score,
    conformant: r.conformant,
    blocking: r.issues.filter(isBlocking).map((i) => ({
      ruleId: i.ruleId, severity: i.severity, location: i.location, evidence: i.evidence ?? null,
    })),
  };
}

export async function scanSite(site, n = 80) {
  const delay = await crawlDelayMs(site);
  const ids = await pool(site, delay);
  const pages = [];
  for (const id of sample(ids, Math.min(n, ids.length))) {
    await wait(delay);
    try {
      const p = await scanPage(site, id);
      if (p) pages.push(p);
    } catch { /* restricted or removed between listing and fetch */ }
  }
  const byRule = new Map();
  for (const p of pages) {
    const seen = new Set();
    for (const i of p.blocking) {
      const row = byRule.get(i.ruleId) ?? { ruleId: i.ruleId, title: RULES_BY_ID[i.ruleId]?.title ?? i.ruleId, severity: i.severity, pages: 0, issues: 0 };
      row.issues++;
      if (!seen.has(i.ruleId)) { row.pages++; seen.add(i.ruleId); }
      byRule.set(i.ruleId, row);
    }
  }
  return {
    site,
    scannedAt: new Date().toISOString(),
    crawlDelayMs: delay,
    poolSize: ids.length,
    sampled: pages.length,
    pagesWithBlocking: pages.filter((p) => !p.conformant).length,
    byRule: [...byRule.values()].sort((a, b) => b.pages - a.pages || b.issues - a.issues),
    pages,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const site = process.argv[2];
  const n = Number(process.argv[3] ?? 80);
  const r = await scanSite(site, n);
  const dir = new URL('./data/', import.meta.url);
  mkdirSync(dir, { recursive: true });
  writeFileSync(new URL(`${site.replace(/\W/g, '-')}.json`, dir), JSON.stringify(r, null, 2));
  console.log(`${site}: pool ${r.poolSize}, scanned ${r.sampled}, ${r.pagesWithBlocking} with A/AA failures`);
  for (const x of r.byRule.slice(0, 6)) console.log(`  ${String(x.pages).padStart(3)} pages  ${String(x.issues).padStart(4)} issues  ${x.title}`);
}
