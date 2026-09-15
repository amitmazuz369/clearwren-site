/**
 * Turns a site scan (data/<site>.json) into three things for one organisation:
 * a one-page report (HTML + PDF), a short email draft, and a verification log.
 *
 * Nothing here is sent. The owner reads, decides and sends.
 *
 * Before anything is written, every example page is re-checked live: the page must
 * still be public, and every failure the report names must still be there. A report
 * that points an accessibility office at a problem that is not on the page is worse
 * than no report.
 *
 * Usage: node docs/outreach/site-reports/render.mjs <host>
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { RULES_BY_ID } from '../../../packages/engine/dist/src/index.js';
import { scanPage } from './scan.mjs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const UA = 'ClearwrenAccessibilityResearch/0.1 (+https://clearwren.com)';

const SOURCES = {
  ada: { label: 'Federal Register, 20 April 2026, document 2026-07663', url: 'https://www.federalregister.gov/documents/2026/04/20/2026-07663/extension-of-compliance-dates-for-nondiscrimination-on-the-basis-of-disability-accessibility-of-web' },
  aoda: { label: 'Government of Ontario, “How to make websites accessible”', url: 'https://www.ontario.ca/page/how-make-websites-accessible' },
};

const HOOK = {
  ada: (o) => `As a public university, ${o.short} is covered by the US Department of Justice's ADA Title II rule, which sets WCAG 2.1 level AA as the standard for web content. Since the April 2026 extension, the compliance date for state and local government entities serving a population of 50,000 or more — which generally includes state universities — is 26 April 2027.`,
  aoda: (o) => `Ontario's AODA requires designated public sector organizations, such as ${o.short}, to make public web content posted since 2012 meet WCAG 2.0 level AA. That requirement has applied since 1 January 2021, with exceptions only for live captions and pre-recorded audio description.`,
};

const ORGS = {
  'uconn.atlassian.net': { org: 'University of Connecticut', short: 'UConn', greeting: 'Hello IT Accessibility team,', hook: 'ada' },
  'ucsb-engr.atlassian.net': { org: 'UC Santa Barbara, Engineering Computing Infrastructure', short: 'UC Santa Barbara', greeting: 'Hello ECI team,', hook: 'ada' },
  'su-support.atlassian.net': { org: 'Salisbury University', short: 'Salisbury University', greeting: 'Hello,', hook: 'ada' },
  'uwaterloo.atlassian.net': { org: 'University of Waterloo', short: 'the University of Waterloo', greeting: 'Hello,', hook: 'aoda' },
};

/** How each failure reads inside a sentence, where a table title would sound robotic. */
const IN_PROSE = {
  'img-alt-missing': 'images with no alternative text',
  'img-alt-meaningless': 'alternative text that does not describe the image',
  'table-no-header': 'tables without a header row',
  'link-nondescriptive': 'links whose text does not say where they go',
  'contrast-minimum': 'text below the WCAG AA contrast minimum',
  'heading-skipped-level': 'skipped heading levels',
  'fake-heading': 'bold text used instead of headings',
};

const NUMBER_WORDS = ['no', 'one', 'two', 'three', 'four', 'five'];

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const pct = (a, b) => Math.round((100 * a) / Math.max(1, b));
const lower = (s) => s.charAt(0).toLowerCase() + s.slice(1);
const clip = (s, n = 36) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

function summarise(blocking) {
  const byRule = new Map();
  for (const i of blocking) byRule.set(i.ruleId, [...(byRule.get(i.ruleId) ?? []), i]);
  return [...byRule.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .map(([id, items]) => {
      const n = items.length;
      let text = `${RULES_BY_ID[id]?.title ?? id}${n > 1 ? ` (${n})` : ''}`;
      // Alt text that is a file name is the most persuasive single example there is.
      const ev = items.find((i) => typeof i.evidence === 'string' && i.evidence.trim())?.evidence;
      if (id === 'img-alt-meaningless' && ev) text += `, e.g. “${clip(ev)}”`;
      return text;
    });
}

/** Examples: most failures first, but no two pages led by the same failure type if avoidable. */
function candidates(pages) {
  // A page titled "C" is real, but in a report to a stranger it reads like a glitch.
  const failing = pages
    .filter((p) => p.blocking.length && p.title.trim().length >= 4)
    .sort((a, b) => b.blocking.length - a.blocking.length);
  const lead = (p) => summarise(p.blocking)[0].split(' (')[0];
  const seen = new Set();
  const varied = [];
  const rest = [];
  for (const p of failing) (seen.has(lead(p)) ? rest : (seen.add(lead(p)), varied)).push(p);
  return [...varied, ...rest];
}

async function publiclyReachable(url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow', signal: AbortSignal.timeout(20000) });
    return { status: res.status, ok: res.ok && !/\/login/.test(res.url) };
  } catch (e) {
    return { status: 0, ok: false, error: String(e) };
  }
}

async function verifiedExamples(site, pages, want = 5) {
  const out = [];
  const log = [];
  for (const p of candidates(pages)) {
    if (out.length >= want) break;
    await new Promise((r) => setTimeout(r, 1100));
    const reach = await publiclyReachable(p.url);
    let live = null;
    try { live = await scanPage(site, p.id); } catch { /* removed or restricted since the scan */ }
    const claimed = [...new Set(p.blocking.map((i) => i.ruleId))];
    const found = new Set((live?.blocking ?? []).map((i) => i.ruleId));
    const ok = reach.ok && live && claimed.every((id) => found.has(id));
    log.push({ id: p.id, url: p.url, reachable: reach, claimed, stillPresent: [...found], ok: Boolean(ok) });
    if (ok) out.push(live);
  }
  return { examples: out, log };
}

function reportHtml(o, s, examples, top, host) {
  const poolText = s.poolSize >= 2000 ? 'at least 2,000' : s.poolSize.toLocaleString('en-GB');
  const date = new Date(s.scannedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const fix = RULES_BY_ID[top[0]?.ruleId];
  const src = SOURCES[o.hook];
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Accessibility snapshot — ${esc(o.org)}</title>
<style>
@page { size: A4; margin: 14mm 16mm 12mm; }
body { font: 10pt/1.42 -apple-system, "Segoe UI", Helvetica, Arial, sans-serif; color: #1b1f24; margin: 0; }
h1 { font-size: 16pt; margin: 0 0 2pt; letter-spacing: -0.01em; }
.sub { color: #57606a; margin: 0 0 10pt; }
h2 { font-size: 11pt; margin: 11pt 0 3pt; }
p { margin: 0 0 6pt; }
.big { font-size: 12.5pt; margin: 6pt 0 4pt; }
.big b { font-size: 14.5pt; }
table { border-collapse: collapse; width: 100%; margin: 2pt 0; }
th, td { text-align: left; padding: 2.5pt 6pt 2.5pt 0; border-bottom: 1px solid #d0d7de; vertical-align: top; }
th { font-weight: 600; color: #57606a; font-size: 9pt; }
td.n, th.n { text-align: right; white-space: nowrap; }
ol { padding-left: 16pt; margin: 2pt 0; }
li { margin: 0 0 3pt; }
a { color: #0a58ca; text-decoration: none; }
.issues { color: #57606a; display: block; }
.note { color: #57606a; font-size: 8.5pt; border-top: 1px solid #d0d7de; padding-top: 5pt; margin-top: 10pt; }
</style></head><body>
<h1>Accessibility snapshot</h1>
<p class="sub">${esc(o.org)} · public Confluence pages at ${esc(host)} · ${esc(date)}</p>

<p>We checked a random sample of ${s.sampled} pages from ${esc(host)}, drawn from ${poolText} that anyone can open without logging in. Each page went through automated checks mapped to WCAG success criteria at levels A and AA. Only failures the checks can confirm with certainty are counted.</p>

<p class="big"><b>${s.pagesWithBlocking} of ${s.sampled}</b> pages (${pct(s.pagesWithBlocking, s.sampled)}%) have at least one such failure.</p>

<h2>What comes up most</h2>
<table><thead><tr><th>Failure</th><th class="n">Pages</th><th class="n">Instances</th></tr></thead><tbody>
${top.map((r) => `<tr><td>${esc(r.title)}</td><td class="n">${r.pages}</td><td class="n">${r.issues}</td></tr>`).join('\n')}
</tbody></table>

<h2>${NUMBER_WORDS[examples.length] ? NUMBER_WORDS[examples.length].replace(/^./, (c) => c.toUpperCase()) : examples.length} pages to start with</h2>
<ol>
${examples.map((p) => `<li><a href="${esc(p.url)}">${esc(p.title)}</a><span class="issues">${esc(summarise(p.blocking).join(' · '))}</span></li>`).join('\n')}
</ol>

${fix ? `<h2>Fixing the most common one</h2><p><b>${esc(fix.title)}.</b> ${esc(fix.howToFix)}</p>` : ''}

<h2>Why it matters</h2>
<p>${esc(HOOK[o.hook](o))} Every failure in this report maps to a success criterion that already exists in WCAG 2.0 and 2.1.</p>

<p><b>Want the rest?</b> Reply and we will send the complete page-by-page list for this sample, at no cost.</p>

<p class="note">What this is not: automated checks find part of what WCAG asks for and cannot establish conformance on their own, and a sample is not an audit. Pages were read through Confluence's public API, following the site's robots.txt crawl delay. Source for the rule above: <a href="${esc(src.url)}">${esc(src.label)}</a>.<br>
Clearwren · accessibility checks for Confluence Cloud · clearwren.com · partners@clearwren.com</p>
</body></html>`;
}

function emailText(o, s, top, host, examples) {
  const hookLine = o.hook === 'ada'
    ? 'With the ADA Title II date for state universities now set at 26 April 2027'
    : 'Since AODA has required WCAG 2.0 level AA on public web content since 2021';
  const most = IN_PROSE[top[0].ruleId] ?? lower(top[0].title);
  const n = examples.length;
  return `Subject: Accessibility snapshot of ${host}

${o.greeting}

I ran a random sample of ${s.sampled} public pages on ${host} through automated WCAG checks. ${s.pagesWithBlocking} of them have at least one failure the checks can confirm with certainty, most often ${most}.

${hookLine}, I thought the attached one-page summary might be useful. It has the numbers and ${NUMBER_WORDS[n] ?? n} pages that are a good place to start.

If you would like the full page-by-page list, reply and I will send it, at no cost.

Amit Mazuz
Clearwren, accessibility checks for Confluence Cloud
clearwren.com

[POSTAL ADDRESS: required before sending, see README]
If you would rather not hear from us, reply "no" and we will not write again.
`;
}

/** Words a vendor must not use about someone else's legal position. */
const FORBIDDEN = /non-?complian|violat|illegal|lawsuit|sued|liab|conformant|fail(s|ed)? to comply/i;

/** Page count from the PDF's own page objects. Skia writes them uncompressed. */
function pdfPages(path) {
  const raw = readFileSync(path).toString('latin1');
  return (raw.match(/\/Type\s*\/Page(?!s)/g) ?? []).length;
}

export async function render(host) {
  const o = ORGS[host];
  if (!o) throw new Error(`No organisation entry for ${host}`);
  const here = new URL('./', import.meta.url);
  const s = JSON.parse(readFileSync(new URL(`data/${host.replace(/\W/g, '-')}.json`, here), 'utf8'));
  const top = s.byRule.slice(0, 4);
  const { examples, log } = await verifiedExamples(host, s.pages);

  const html = reportHtml(o, s, examples, top, host);
  const email = emailText(o, s, top, host, examples);

  const dir = new URL(`reports/${host.replace(/\W/g, '-')}/`, here);
  mkdirSync(dir, { recursive: true });
  const htmlPath = fileURLToPath(new URL('report.html', dir));
  const pdfPath = fileURLToPath(new URL('report.pdf', dir));
  writeFileSync(htmlPath, html);
  writeFileSync(new URL('email.txt', dir), email);
  execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-pdf-header-footer', `--print-to-pdf=${pdfPath}`, `file://${htmlPath}`], { stdio: 'ignore' });

  const problems = [];
  if (FORBIDDEN.test(html.replace(/<[^>]+>/g, ' ')) || FORBIDDEN.test(email)) problems.push('forbidden legal wording');
  if (!examples.length) problems.push('no verified example pages');
  if (!email.includes(`${s.pagesWithBlocking} of them`) || !html.includes(`${s.pagesWithBlocking} of ${s.sampled}`)) problems.push('email and report numbers disagree');
  const pages = pdfPages(pdfPath);
  if (pages !== 1) problems.push(`PDF is ${pages} pages, must be 1`);

  writeFileSync(new URL('verification.json', dir), JSON.stringify({ host, renderedAt: new Date().toISOString(), pdfPages: pages, problems, examples: log }, null, 2));
  return { host, sampled: s.sampled, failing: s.pagesWithBlocking, examples: examples.length, rejected: log.filter((l) => !l.ok).length, pdfPages: pages, problems };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(await render(process.argv[2])));
}
