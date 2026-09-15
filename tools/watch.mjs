/**
 * Daily health and integrity check for everything Clearwren depends on.
 * Prints a report and exits non-zero if anything needs a person. Every check
 * here fails silently in real life, which is why it is checked on a schedule.
 */
import { execSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';

const sh = (cmd) => { try { return execSync(cmd, { encoding: 'utf8', timeout: 30000 }).trim(); } catch { return ''; } };
// DNS lookups feed the integrity checks; a single timeout must not read as "records gone".
// Retry a few times and only trust an empty answer after it stays empty.
const dig = (args) => {
  for (let i = 0; i < 4; i++) {
    const out = sh(`dig +tries=2 +time=5 ${args}`);
    if (out) return out;
  }
  return '';
};
const findings = [];
const ok = [];
const report = (severity, line) => (severity === 'ok' ? ok : findings).push(line);

const NS = 'dns1.registrar-servers.com';
const DOMAIN = 'clearwren.com';

/* --- the site --- */
const code = sh(`curl -s -o /dev/null -m 25 -w '%{http_code}' --resolve ${DOMAIN}:443:185.199.108.153 https://${DOMAIN}/`);
report(code === '200' ? 'ok' : 'bad', `site returns ${code || 'nothing'}`);

const certEnd = sh(`echo | openssl s_client -connect 185.199.108.153:443 -servername ${DOMAIN} 2>/dev/null | openssl x509 -noout -enddate`).replace('notAfter=', '');
if (certEnd) {
  const days = Math.round((Date.parse(certEnd) - Date.now()) / 86400000);
  report(days > 14 ? 'ok' : 'bad', `TLS certificate expires in ${days} days (${certEnd})`);
} else report('bad', 'could not read the TLS certificate');

/* --- DNS integrity: the site, and the mail that Atlassian and customers use --- */
const a = dig(`@${NS} ${DOMAIN} A +short`).split('\n').filter(Boolean);
report(a.length === 4 ? 'ok' : 'bad', `${a.length} A records (expected 4)`);

const mx = dig(`@${NS} ${DOMAIN} MX +short`).split('\n').filter(Boolean);
report(mx.length === 3 ? 'ok' : 'bad', `${mx.length} MX records (expected 3) — mail silently stops if these go`);

const txt = dig(`@${NS} ${DOMAIN} TXT +short`);
const spfCount = (txt.match(/v=spf1/g) ?? []).length;
report(spfCount === 1 ? 'ok' : 'bad', `${spfCount} SPF records (exactly 1 is valid; two invalidate each other)`);
report(txt.includes('zoho-verification') ? 'ok' : 'bad', 'Zoho domain verification record present');
report(dig(`@${NS} zmail._domainkey.${DOMAIN} TXT +short`).includes('DKIM1') ? 'ok' : 'bad', 'DKIM key present');

/* --- a nameserver change is what a domain hijack looks like --- */
const ns = dig(`+short ${DOMAIN} NS`).split('\n').filter(Boolean).sort().join(',');
report(ns === 'dns1.registrar-servers.com.,dns2.registrar-servers.com.' ? 'ok' : 'bad',
  `nameservers: ${ns || 'none'}`);

/* --- domain expiry: it takes the site, the mail and the listing links with it --- */
// whois servers rate-limit and stall; retry before calling the date unreadable.
let expiry;
for (let i = 0; i < 3 && !expiry; i++) {
  expiry = sh(`whois ${DOMAIN} | grep -iE 'Registry Expiry Date|Registrar Registration Expiration Date' | head -1`)
    .match(/(\d{4}-\d{2}-\d{2}T[\d:.]+Z)/)?.[1];
}
if (expiry) {
  const days = Math.round((Date.parse(expiry) - Date.now()) / 86400000);
  report(days > 30 ? 'ok' : 'bad', `domain expires in ${days} days (${expiry.slice(0, 10)})`);
} else report('bad', 'could not read the domain expiry date');

/* --- the published site is the one we built ---
 * Comparing only the homepage title let two whole guides sit built-but-unpublished
 * for five days without ever failing this check. Every page in site/ (bar the
 * sitemap, which carries a build date and always differs) must match byte for byte. */
const localPages = readdirSync('site').filter((f) => f.endsWith('.html')).sort();
const stale = [];
let unreadable = 0;
for (const file of localPages) {
  const local = readFileSync(`site/${file}`, 'utf8').trim();
  const path = file === 'index.html' ? '' : file;
  const live = sh(`curl -s -m 25 --resolve ${DOMAIN}:443:185.199.108.153 https://${DOMAIN}/${path}`);
  if (!live) { unreadable++; continue; }
  if (live !== local) stale.push(file);
}
if (unreadable === localPages.length) report('bad', 'could not read any live page');
else report(stale.length === 0 ? 'ok' : 'bad',
  stale.length === 0
    ? `live site matches the built source (${localPages.length} pages)`
    : `${stale.length} page(s) built but not live: ${stale.join(', ')}`);

/* --- the app listing, once it exists --- */
const listing = sh(`curl -s -m 25 'https://marketplace.atlassian.com/rest/2/addons?text=clearwren&hosting=cloud&limit=5'`);
if (listing.includes('"count"')) {
  const n = Number(JSON.parse(listing).count ?? 0);
  report('ok', n > 0 ? `app is listed and searchable on the Marketplace (${n} result${n === 1 ? '' : 's'})` : 'app not yet public on the Marketplace (expected until approval)');
}

/* --- the competitor: tell me when they gain traction or move on price --- */
const RIVAL = 'com.technofystore.accesslens.confluence';
const rival = sh(`curl -s -m 25 'https://marketplace.atlassian.com/rest/2/addons/${RIVAL}/versions/latest'`);
if (rival.startsWith('{')) {
  const v = JSON.parse(rival);
  const price = sh(`curl -s -m 25 'https://marketplace.atlassian.com/rest/2/addons/${RIVAL}/pricing/cloud/live'`);
  let per = null;
  try {
    const items = JSON.parse(price).items ?? [];
    const t = items.find(i => i.unitCount === 100);
    if (t) per = t.amount / 100;
  } catch { /* pricing shape can change; the version line still reports */ }
  const moved = per !== null && Math.abs(per - 7.5) > 0.01;
  report(moved ? 'bad' : 'ok',
    `AccessLens at v${v.name} (${v.release?.date ?? 'undated'}), ` +
    (per === null ? 'price unreadable' : `$${per.toFixed(2)}/user` + (moved ? ' — PRICE MOVED, ours is $3.35' : ' — unchanged')));
} else report('bad', 'could not read the competitor listing');

/* --- our own site's contrast, both themes ---
 * We sell accessibility. A buyer running axe on clearwren.com and finding failures
 * ends the conversation, and two such failures shipped unnoticed on 2026-09-08. */
try {
  const out = sh('node tools/contrast-check.mjs 2>&1');
  report(out.includes('pass') ? 'ok' : 'bad', out.split('\n')[0] || 'contrast check produced no output');
} catch (e) {
  report('bad', `our own site fails a contrast check: ${String(e.message ?? e).split('\n').slice(0, 3).join(' ')}`);
}

/* --- published figures still match the data behind them --- */
try {
  const out = sh('node tools/claims-check.mjs 2>&1');
  report(out.includes('match the data') ? 'ok' : 'bad', out.split('\n')[0] || 'claims check produced no output');
} catch (e) {
  report('bad', `a published figure no longer matches the data: ${String(e.message ?? e).split('\n').slice(0, 3).join(' ')}`);
}

/* --- Instagram: the token is alive and still points at @clearwren ---
 * It lives in ~/.config/clearwren/instagram.env and only clearwren-morning refreshes it.
 * If it dies, Instagram posting stops silently, so a dead token must reach the phone. */
try {
  const { readFileSync: readCred } = await import('node:fs');
  const cred = Object.fromEntries(
    readCred(`${process.env.HOME}/.config/clearwren/instagram.env`, 'utf8').split('\n')
      .filter((l) => l && !l.startsWith('#') && l.includes('='))
      .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
  const res = await fetch('https://graph.instagram.com/v23.0/me?fields=username&access_token='
    + encodeURIComponent(cred.IG_ACCESS_TOKEN ?? ''));
  const me = await res.json();
  report(me.username === 'clearwren' ? 'ok' : 'bad', me.username === 'clearwren'
    ? 'Instagram token valid for @clearwren'
    : `Instagram token not working: ${me.error?.message ?? `HTTP ${res.status}`}`);
} catch (e) {
  report('bad', `could not check the Instagram token: ${String(e.message ?? e).slice(0, 120)}`);
}

console.log('CLEARWREN DAILY CHECK — ' + new Date().toISOString().slice(0, 16).replace('T', ' '));
for (const line of ok) console.log(`  ok    ${line}`);
for (const line of findings) console.log(`  FAIL  ${line}`);
console.log(findings.length ? `\n${findings.length} problem(s) need attention` : '\nall clear');
process.exit(findings.length ? 1 : 0);
