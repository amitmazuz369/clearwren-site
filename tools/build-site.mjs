/** Assembles the static site from fragments in site/src, injecting the shared
 *  shell and the generated rule table. No framework, no build-time network. */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'site', 'src');
const out = join(root, 'site');

const NAV = [
  ['/', 'Product'],
  ['/checks.html', 'What it checks'],
  ['/pricing.html', 'Pricing'],
  ['/docs.html', 'Docs'],
  ['/security.html', 'Security'],
  ['/support.html', 'Support'],
];

const LOGO = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <circle cx="12" cy="12" r="10.25" stroke="currentColor" stroke-width="1.6"/>
  <path d="M7.4 12.3l3.1 3.1 6.1-6.6" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

function shell({ title, description, body, path }) {
  const nav = NAV.map(([href, label]) =>
    `<a href="${href}"${href === path ? ' aria-current="page"' : ''}>${label}</a>`).join('\n        ');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${description}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:type" content="website">
<link rel="stylesheet" href="/assets/style.css">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><circle cx='12' cy='12' r='10' fill='none' stroke='%231c5d99' stroke-width='2'/><path d='M7.4 12.3l3.1 3.1 6.1-6.6' fill='none' stroke='%231c5d99' stroke-width='2'/></svg>">
</head>
<body>
<header class="site">
  <div class="wrap">
    <a class="brand" href="/">${LOGO} Clearwren</a>
    <nav class="site">
        ${nav}
    </nav>
  </div>
</header>
<main>
  <div class="wrap">
${body}
  </div>
</main>
<footer class="site">
  <div class="wrap">
    <span>© ${new Date().getFullYear()} Clearwren</span>
    <a href="/privacy.html">Privacy</a>
    <a href="/terms.html">Terms</a>
    <a href="/security.html">Security</a>
    <a href="/support.html">Support</a>
    <span class="spacer"></span>
    <a href="mailto:support@clearwren.com">support@clearwren.com</a>
  </div>
</footer>
</body>
</html>
`;
}

const rulesTable = existsSync(join(out, 'assets', 'rules.html'))
  ? readFileSync(join(out, 'assets', 'rules.html'), 'utf8')
  : '';

let built = 0;
for (const file of readdirSync(src).filter((f) => f.endsWith('.html'))) {
  const raw = readFileSync(join(src, file), 'utf8');
  const meta = /^<!--\s*([\s\S]*?)-->/.exec(raw);
  const fields = Object.fromEntries(
    (meta?.[1] ?? '').split('\n').map((l) => l.split(':')).filter((p) => p.length >= 2)
      .map(([k, ...v]) => [k.trim(), v.join(':').trim()]),
  );
  const body = raw.replace(/^<!--[\s\S]*?-->\s*/, '').replace('{{RULES_TABLE}}', rulesTable);
  const path = file === 'index.html' ? '/' : `/${file}`;
  writeFileSync(join(out, file), shell({
    title: fields.title ?? 'Clearwren',
    description: fields.description ?? '',
    body,
    path,
  }));
  built++;
}
console.log(`built ${built} pages`);
