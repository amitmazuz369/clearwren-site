/**
 * Daily health and integrity check for everything Clearwren depends on.
 * Prints a report and exits non-zero if anything needs a person. Every check
 * here fails silently in real life, which is why it is checked on a schedule.
 */
import { execSync } from 'node:child_process';

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

/* --- the published site is the one we built --- */
const localTitle = sh(`grep -o '<title>[^<]*</title>' site/index.html | head -1`);
const liveTitle = sh(`curl -s -m 25 --resolve ${DOMAIN}:443:185.199.108.153 https://${DOMAIN}/ | grep -o '<title>[^<]*</title>' | head -1`);
report(localTitle && localTitle === liveTitle ? 'ok' : 'bad',
  liveTitle ? 'live site matches the built source' : 'could not read the live page');

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

console.log('CLEARWREN DAILY CHECK — ' + new Date().toISOString().slice(0, 16).replace('T', ' '));
for (const line of ok) console.log(`  ok    ${line}`);
for (const line of findings) console.log(`  FAIL  ${line}`);
console.log(findings.length ? `\n${findings.length} problem(s) need attention` : '\nall clear');
process.exit(findings.length ? 1 : 0);
