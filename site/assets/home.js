/* Home page: the interactive lab. Everything here is progressive: without JavaScript the page
 * still carries its copy, and the widgets stay hidden. The data (rules, study figures) is
 * written into the page by tools/build-site.mjs from the engine's rule list and the study's
 * stored results, so the numbers on screen cannot drift from the source. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const home = $('#x-home');
  if (!home) return;
  const DATA = JSON.parse($('#x-data').textContent);
  const root = document.documentElement;
  const mq = matchMedia('(prefers-reduced-motion: reduce)');
  const still = () => mq.matches || root.dataset.motion === 'off';
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (n) => Math.round(n).toLocaleString('en-US');

  home.classList.remove('x-js-off');
  $$('.x-js-only', home).forEach((el) => { el.hidden = false; });

  function countTo(el, to, { dur = 1100, dec = 0 } = {}) {
    if (still()) { el.textContent = dec ? to.toFixed(dec) : fmt(to); el.dataset.v = to; return; }
    const from = parseFloat(el.dataset.v || '0') || 0;
    const t0 = performance.now();
    cancelAnimationFrame(el._raf);
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      const v = from + (to - from) * (1 - Math.pow(1 - p, 3));
      el.textContent = dec ? v.toFixed(dec) : fmt(v);
      if (p < 1) el._raf = requestAnimationFrame(step);
    };
    el._raf = requestAnimationFrame(step);
    el.dataset.v = to;
  }

  /* ---------- rules ---------- */
  const RULE = Object.fromEntries(DATA.rules.map((r) => [r.id, r]));
  const CRIT = {};
  for (const r of DATA.rules) for (const [c, name, level] of r.wcag) CRIT[c] = [name, level];
  const critKeys = Object.keys(CRIT).sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
  const checksFor = (c) => DATA.rules.filter((r) => r.wcag.some((w) => w[0] === c));
  /* Same line the engine draws: a certain, non-advisory finding at A or AA is a failure;
   * everything else is marked for a person to review. */
  const kindOf = (r) => (r.confidence === 'certain' && r.severity !== 'advisory' && r.wcag.some((w) => w[2] !== 'AAA') ? 'fail' : 'review');

  /* ---------- hero: motion toggle, spotlight, rotating line, counters ---------- */
  const motionBtn = $('#x-motion');
  motionBtn.addEventListener('click', () => {
    const off = root.dataset.motion !== 'off';
    root.dataset.motion = off ? 'off' : 'on';
    motionBtn.setAttribute('aria-pressed', String(off));
  });
  const hero = $('.x-hero', home);
  hero.addEventListener('pointermove', (e) => {
    if (still()) return;
    const r = hero.getBoundingClientRect();
    hero.style.setProperty('--mx', `${e.clientX - r.left}px`);
    hero.style.setProperty('--my', `${e.clientY - r.top}px`);
  });
  const rot = $('#x-rot');
  const LINES = ['as you write.', 'across whole spaces.', 'for the audit.'];
  rot.setAttribute('aria-hidden', 'true');
  rot.insertAdjacentHTML('beforebegin', '<span class="sr-only">as you write, across whole spaces and for the audit.</span>');
  let ri = 0;
  setInterval(() => {
    if (still() || document.hidden) return;
    rot.classList.add('out');
    setTimeout(() => { ri = (ri + 1) % LINES.length; rot.textContent = LINES[ri]; rot.classList.remove('out'); }, 350);
  }, 2800);
  const statsIO = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    $$('[data-count]', e.target).forEach((b) => { b.dataset.v = '0'; countTo(b, +b.dataset.count, { dur: 1400 }); });
    statsIO.disconnect();
  }), { threshold: 0.4 });
  statsIO.observe($('#x-stats'));

  /* ---------- live lab ----------
   * The findings and the score come from the real engine (assets/checker.js, the same bundle as
   * the free checker): the Markdown is turned into HTML, the HTML into ADF, and the ADF is
   * audited exactly as in the app. Only the "Fix" buttons are demo code: they rewrite the line
   * the engine pointed at. */
  const EXAMPLES = [
    { name: 'Team onboarding', title: 'Welcome to the team', body: [
      '## Before your first day',
      '#### Accounts and tools',
      '**Your first week**',
      '![](IMG_2041.png)',
      'Booking a trip? [click here](https://intranet.example/travel-policy)',
      'Bring a photo ID on your first day.',
      '| Day | Session |',
      '| Monday | Welcome breakfast |',
      '| Tuesday | Security training |'],
      alts: { 'IMG_2041.png': 'New starters at the welcome breakfast' } },
    { name: 'Outage report', title: 'Untitled', goodTitle: 'Email outage report, Tuesday', body: [
      '## Summary',
      'Email was down for 47 minutes on Tuesday morning.',
      '### Timeline',
      '**What happened**',
      '![](screenshot-1.png)',
      'Full log: [https://status.example/incidents/email-outage](https://status.example/incidents/email-outage)',
      '##### Follow-up actions',
      '- Add a second mail relay',
      '- Alert the help desk sooner'],
      alts: { 'screenshot-1.png': 'Mail queue graph: a spike at 9:12 that clears at 9:59' },
      links: { 'https://status.example/incidents/email-outage': 'Full incident log' } },
    { name: 'Course syllabus', title: 'Writing 101 syllabus, spring term', body: [
      '## Course overview',
      'Writing for academic and professional audiences.',
      '#### Weekly schedule',
      '| Week | Topic | Reading |',
      '| 1 | Audience and purpose | Chapter 1 |',
      '| 2 | Paragraphs | Chapter 3 |',
      '**Grading**',
      'Essays 60%, participation 20%, final portfolio 20%.',
      'Submit your work on the [link](https://lms.example/writing-101) page.',
      '![image of the writing center](writing-center.jpg)'],
      links: { 'https://lms.example/writing-101': 'course site' } },
    { name: 'Council meeting', title: 'Meeting notes', goodTitle: 'Council meeting, 3 March: parks budget', body: [
      '## Agenda',
      '1) Approve the minutes',
      '2) Parks budget',
      '3) Public comment',
      '## Decisions',
      'THE PARKS BUDGET WAS APPROVED BY FIVE VOTES TO TWO',
      'The full budget is [here](https://city.example/parks-budget)',
      '![DSC_0042](DSC_0042.jpg)'],
      alts: { 'DSC_0042.jpg': 'Council members voting by show of hands' } },
    { name: 'Release notes', title: 'Release 4.2', body: [
      '## What is new',
      '### Faster search',
      'Search results now load in under a second.',
      '### Dark mode',
      '![dark-mode.png](dark-mode.png)',
      '## Known issues',
      'Exports over 10,000 rows may time out. See [https://docs.example/exports](https://docs.example/exports)',
      '## What is new'],
      alts: { 'dark-mode.png': 'The dashboard in dark mode, with white text on a charcoal background' },
      links: { 'https://docs.example/exports': 'Export limits' } },
    { name: 'Benefits overview', title: 'Copy of Benefits overview', goodTitle: 'Benefits overview', body: [
      '## Health insurance',
      'Cover starts on your first day.',
      '## Pension',
      '**How to enrol**',
      'Fill in the form and send it to HR. [Read more](https://hr.example/pension-form)',
      '| | Employee | Employer |',
      '| --- | --- | --- |',
      '| Contribution | 5% | 7% |'],
      links: { 'https://hr.example/pension-form': 'Pension enrolment form' } },
    { name: 'Lab safety', title: 'Chemistry lab safety rules', body: [
      '## Before you start',
      'Goggles and gloves are required at all times.',
      '### Emergency exits',
      '![](floor-plan-level-2.png)',
      '### Chemical spills',
      'STOP WORK, LEAVE THE ROOM AND CALL THE SAFETY OFFICER AT ONCE',
      '### Contacts',
      'Safety office: [link](https://safety.example/contacts)'],
      alts: { 'floor-plan-level-2.png': 'Floor plan of level 2: exits at both ends of the main corridor' },
      links: { 'https://safety.example/contacts': 'Safety office contacts' } },
    { name: 'Product spec', title: 'Search filters: product spec', body: [
      '# Search filters',
      '## Problem',
      'People cannot narrow results by date.',
      '#### Proposal',
      'Add a date filter to the results page.',
      '**Open questions**',
      '![image of the wireframe](wireframe-v3.png)'] },
    { name: 'Help article', title: 'How to reset your password', body: [
      '## Steps',
      '1) Open the sign-in page',
      '2) Select Forgot password',
      '3) Follow the link in the email',
      '## Still stuck?',
      'Contact support [here](https://help.example/contact) or chat with us [here](https://help.example/chat)'],
      links: { 'https://help.example/contact': 'Contact form', 'https://help.example/chat': 'Live chat' } },
    { name: 'A clean page', title: 'Office opening hours', body: [
      '## Opening hours',
      'Monday to Friday, 8:30 to 17:00.',
      '## How to find us',
      '![Map: the office is next to the central station, entrance on the north side](map.png)',
      'Read the [visitor guide](https://office.example/visitor-guide) before you come.',
      '| Day | Hours |',
      '| --- | --- |',
      '| Saturday | Closed |'] },
  ];
  const BLANK = { name: 'Your own page', title: '', body: [] };
  const MARKER = /^\s*([-*•‣▪·]|\(?\d{1,2}[.)])\s+\S/;
  const DAYS = /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|may|june|july|august|september|october|november|december)\b/g;
  const sentence = (s) => s.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g, (c) => c.toUpperCase()).replace(DAYS, (w) => w[0].toUpperCase() + w.slice(1));
  const slugLabel = (u) => {
    const seg = (u.split(/[?#]/)[0].split('/').filter(Boolean).pop() || '').replace(/\.\w+$/, '');
    let w = '';
    try { w = decodeURIComponent(seg); } catch { w = seg; }
    w = w.replace(/[-_]+/g, ' ').trim();
    return w && !/^https?:$/.test(w) && !/\./.test(w) ? w[0].toUpperCase() + w.slice(1) : 'Linked page';
  };
  const attr = (s) => esc(s);
  const inlineHtml = (s) => esc(s)
    .replace(/!\[([^\]]*)\]\(([^)]*)\)/g, (_, a, u) => `<img src="${u}" alt="${a}">`)
    .replace(/\[([^\]]*)\]\(([^)]*)\)/g, (_, t, u) => `<a href="${u}">${t}</a>`)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|\W)_([^_]+)_(?=\W|$)/g, '$1<em>$2</em>');

  /** Markdown subset to HTML, one top-level element per block, and which line each block starts on. */
  function toHtml(src) {
    const L = src.split('\n'); const blocks = []; let html = '';
    const listRe = { ul: /^\s*[-*]\s+/, ol: /^\s*\d+\.\s+/ };
    for (let i = 0; i < L.length; i++) {
      const line = L[i]; let m;
      if (!line.trim()) continue;
      if ((m = line.match(/^(#{1,6})\s*(.*)$/))) { html += `<h${m[1].length}>${inlineHtml(m[2].trim())}</h${m[1].length}>`; blocks.push({ line: i }); continue; }
      if (/^\s*\|/.test(line)) {
        const start = i; const rows = [];
        while (i < L.length && /^\s*\|/.test(L[i])) rows.push({ text: L[i], line: i++ });
        i--;
        const hasHead = rows.length > 1 && /^\s*\|?\s*:?-{3,}/.test(rows[1].text);
        const body = rows.filter((r, k) => !(hasHead && k === 1));
        html += `<table>${body.map((r, k) => `<tr>${r.text.split('|').slice(1, -1).map((c) => { const t = hasHead && k === 0 ? 'th' : 'td'; return `<${t}>${inlineHtml(c.trim())}</${t}>`; }).join('')}</tr>`).join('')}</table>`;
        blocks.push({ line: start, rows: body.map((r) => r.line) });
        continue;
      }
      const kind = listRe.ul.test(line) ? 'ul' : listRe.ol.test(line) ? 'ol' : null;
      if (kind) {
        const items = [];
        while (i < L.length && listRe[kind].test(L[i])) items.push({ text: L[i].replace(listRe[kind], ''), line: i++ });
        i--;
        html += `<${kind}>${items.map((it) => `<li>${inlineHtml(it.text)}</li>`).join('')}</${kind}>`;
        blocks.push({ line: items[0].line, rows: items.map((it) => it.line) });
        continue;
      }
      html += `<p>${inlineHtml(line)}</p>`;
      blocks.push({ line: i });
    }
    return { html, blocks };
  }
  const lineOf = (issue, blocks) => {
    const b = blocks[issue.path?.[0]];
    if (!b) return -1;
    if (b.rows && issue.path.length > 1 && b.rows[issue.path[1]] !== undefined) return b.rows[issue.path[1]];
    return b.line;
  };
  const prevHeading = (A, i) => { for (let k = i - 1; k >= 0; k--) { const m = A[k].match(/^(#{1,6})\s*\S/); if (m) return m[1].length; } return 1; };

  let current = EXAMPLES[0];
  /** A fix for the line the engine pointed at, or null when only a person can fix it. */
  function fixFor(issue, line) {
    const id = issue.ruleId;
    if (id === 'page-title-nondescriptive') return current.goodTitle ? () => { titleIn.value = current.goodTitle; } : null;
    if (line < 0) return null;
    const rep = (fn) => (A) => { A[line] = fn(A[line], A); };
    switch (id) {
      case 'heading-skipped-level': return rep((s) => s.replace(/^#{1,6}/, '#'.repeat((issue.data?.previousLevel ?? 1) + 1)));
      case 'heading-h1-in-body': return rep((s) => s.replace(/^#\s*/, '## '));
      case 'heading-empty': return (A) => A.splice(line, 1);
      case 'fake-heading': return (A) => { const t = A[line].replace(/\*\*/g, '').replace(/:\s*$/, '').trim(); A[line] = `${'#'.repeat(Math.min(Math.max(prevHeading(A, line), 2), 6))} ${t}`; };
      case 'img-alt-missing':
      case 'img-alt-meaningless': {
        const id = issue.data?.mediaId;
        let done = false;
        return rep((s) => s.replace(/!\[([^\]]*)\]\(([^)]*)\)/g, (m, a, u) => {
          if (done || (id && u !== id)) return m;
          done = true;
          return `![${current.alts?.[u] ?? 'Description of the image'}](${u})`;
        }));
      }
      case 'img-alt-redundant': return rep((s) => s.replace(/!\[(?:an? )?(?:image|picture|photo) of ([^\]]*)\]/i, (_, r) => `![${r[0].toUpperCase()}${r.slice(1)}]`));
      case 'link-nondescriptive': case 'link-empty': case 'link-raw-url': case 'link-ambiguous-duplicate': {
        const href = issue.data?.href;
        return rep((s) => s.replace(/(^|[^!])\[([^\]]*)\]\(([^)]*)\)/g, (m, pre, t, u) => {
          if (href && u !== href) return m;
          if (!href && !(issue.evidence === t || !t || /^https?:/.test(t))) return m;
          return `${pre}[${current.links?.[u] ?? slugLabel(u)}](${u})`;
        }));
      }
      case 'all-caps-run': return rep((s) => sentence(s));
      case 'table-no-header': return (A) => { const cols = Math.max(1, A[line].split('|').length - 2); A.splice(line + 1, 0, `|${' --- |'.repeat(cols)}`); };
      case 'fake-list': return (A) => { for (let k = line; k < A.length && MARKER.test(A[k]); k++) A[k] = A[k].replace(/^\s*\(?(\d{1,2})[.)]\s+/, '$1. ').replace(/^\s*[•‣▪·]\s+/, '- '); };
      case 'table-empty-header': return (A) => { A[line] = A[line].replace(/\|\s*\|/, '| Item |'); };
      case 'heading-duplicate-text': return rep((s) => s.replace(/^(#{1,6}\s*)(.*)$/, (_, h, t) => `${h}${t} (continued)`));
      default: return null;
    }
  }

  const IMG_ICON = '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 17-5-5-9 8"/></svg>';
  const pvInline = (s) => esc(s)
    .replace(/!\[([^\]]*)\]\(([^)]*)\)/g, (_, a) => `</span><span class="x-pv-img">${IMG_ICON}<span>${a ? `Description: ${a}` : 'No description'}</span></span><span>`)
    .replace(/\[([^\]]*)\]\(([^)]*)\)/g, (_, t) => `<span class="x-pv-a">${t || '&nbsp;&nbsp;&nbsp;'}</span>`)
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
  function preview(src, byLine, glowLine, title, titleFlag) {
    const L = src.split('\n');
    const cls = (i) => {
      const f = byLine[i]; let c = '';
      if (f) c += ` x-flag${f.every((x) => x.rv) ? ' rv' : ''}" data-n="${f.map((x) => x.n).join(',')}`;
      if (i === glowLine) c += ' x-glow';
      return c;
    };
    const tf = titleFlag ? ` x-flag${titleFlag.rv ? ' rv' : ''}" data-n="${titleFlag.n}` : '';
    let h = `<div class="x-pv-crumb">Space / Pages</div><div class="x-pv-title${tf}">${esc(title) || '<span class="x-pv-none">No title</span>'}</div>`;
    for (let i = 0; i < L.length; i++) {
      const line = L[i]; let m;
      if (!line.trim()) continue;
      if ((m = line.match(/^(#{1,6})\s*(.*)$/))) { h += `<div class="x-pv-h${m[1].length}${cls(i)}">${pvInline(m[2]) || '&nbsp;'}</div>`; continue; }
      if (/^\s*\|/.test(line)) {
        const rows = []; const lines = [];
        while (i < L.length && /^\s*\|/.test(L[i])) { lines.push(i); rows.push(L[i++]); }
        i--;
        const hasHead = rows.length > 1 && /^\s*\|?\s*:?-{3,}/.test(rows[1]);
        const flagged = lines.find((k) => byLine[k]);
        let t = `<table class="${flagged !== undefined ? cls(flagged).trim() : ''}">`;
        rows.forEach((r, k) => {
          if (hasHead && k === 1) return;
          const tag = hasHead && k === 0 ? 'th' : 'td';
          t += `<tr>${r.split('|').slice(1, -1).map((c) => `<${tag}>${pvInline(c.trim())}</${tag}>`).join('')}</tr>`;
        });
        h += `${t}</table>`;
        continue;
      }
      const li = line.match(/^\s*([-*]|\d+\.)\s+(.*)$/);
      if (li) { h += `<div class="x-pv-li${cls(i)}"><span class="x-pv-bul" aria-hidden="true">${/\d/.test(li[1]) ? li[1] : '•'}</span><span>${pvInline(li[2])}</span></div>`; continue; }
      h += `<div class="x-pv-p${cls(i)}"><span>${pvInline(line)}</span></div>`;
    }
    return h;
  }

  const src = $('#x-src'); const titleIn = $('#x-title'); const pv = $('#x-pv'); const list = $('#x-findings');
  let statusT; let celebrated = false; let shownIssues = []; let lastScore = null;
  const engineReady = () => typeof window.Clearwren?.check === 'function';
  function run(glowLine) {
    if (!engineReady()) return;
    if (!src.value.trim()) {
      pv.innerHTML = preview('', {}, undefined, titleIn.value.trim(), null);
      list.innerHTML = '';
      $('#x-ring').style.background = 'var(--border)'; $('#x-ring-n').textContent = '–'; lastScore = null;
      $('#x-score-t').textContent = 'Waiting for your page';
      $('#x-score-s').textContent = 'Write a title and some content to get a score.';
      $('#x-pv-count').textContent = ''; $('#x-clear').classList.remove('on'); $('#x-fixall').hidden = true;
      return;
    }
    const { html, blocks } = toHtml(src.value);
    const title = titleIn.value.trim();
    const { result } = window.Clearwren.check(html, title);
    shownIssues = result.issues.map((issue) => {
      const r = RULE[issue.ruleId] ?? { title: issue.ruleId, wcag: [] };
      const line = lineOf(issue, blocks);
      const kind = issue.confidence === 'certain' && issue.severity !== 'advisory' && r.wcag.some((w) => w[2] !== 'AAA') ? 'fail' : 'review';
      return { issue, r, line, kind, fix: fixFor(issue, line) };
    });
    const byLine = {}; let titleFlag = null;
    shownIssues.forEach((f, k) => {
      const mark = { n: k + 1, rv: f.kind === 'review' };
      if (f.issue.ruleId.startsWith('page-title')) titleFlag = mark;
      else if (f.line >= 0) (byLine[f.line] ||= []).push(mark);
    });
    pv.innerHTML = preview(src.value, byLine, glowLine, title, titleFlag);
    pv.setAttribute('aria-label', `Preview of your page, ${shownIssues.length} item${shownIssues.length === 1 ? '' : 's'} flagged`);
    list.innerHTML = shownIssues.map((f, k) => {
      const [c, , lv] = f.r.wcag[0] ?? [];
      const where = f.issue.ruleId.startsWith('page-title') ? 'title' : f.line >= 0 ? `line ${f.line + 1}` : esc(f.issue.location ?? '');
      const action = f.fix
        ? `<button class="x-fixbtn" data-k="${k}" aria-label="Fix ${esc(f.r.title)}, ${where}">Fix</button>`
        : `<button class="x-fixbtn x-howbtn" data-how="${k}" aria-label="How to fix ${esc(f.r.title)}, ${where}" aria-expanded="false" aria-controls="x-how-${k}">How</button>`;
      return `<li class="x-finding${f.kind === 'review' ? ' rv' : ''}" style="--i:${k}"><span class="x-n" aria-hidden="true">${k + 1}</span><div><span class="x-t">${esc(f.r.title)}</span><span class="x-meta"><span class="x-kind">${f.kind === 'fail' ? 'Fail' : 'Review'}</span> · ${where}${c ? ` · WCAG ${c} (${lv})` : ' · best practice'}</span><span class="x-howtext" id="x-how-${k}" hidden>${esc(f.r.howToFix ?? '')}</span></div>${action}</li>`;
    }).join('');
    const fails = shownIssues.filter((f) => f.kind === 'fail').length;
    const n = shownIssues.length; const score = result.score;
    const ringColour = score >= 90 ? 'var(--x-pass)' : score >= 70 ? 'var(--x-review)' : 'var(--x-fail)';
    $('#x-ring').style.background = `conic-gradient(${ringColour} ${score}%, var(--border) 0)`;
    const rn = $('#x-ring-n');
    if (lastScore === null || still()) rn.textContent = score; else { rn.dataset.v = lastScore; countTo(rn, score, { dur: 500 }); }
    lastScore = score;
    $('#x-score-t').textContent = n ? `Score ${score} · ${n} finding${n === 1 ? '' : 's'}` : `Score ${score} · all clear`;
    $('#x-score-s').textContent = n ? `${fails} fail, ${n - fails} to review${result.conformant ? ' · no A or AA failure' : ''}` : 'Nothing flagged on this page';
    $('#x-pv-count').textContent = n ? `${n} flagged` : '';
    $('#x-clear').classList.toggle('on', !n);
    $('#x-fixall').hidden = !shownIssues.some((f) => f.fix);
    clearTimeout(statusT);
    statusT = setTimeout(() => { $('#x-lab-status').textContent = `Score ${score}, ${n ? `${n} finding${n === 1 ? '' : 's'}` : 'nothing flagged'}`; }, 700);
    if (!n && !celebrated && current !== EXAMPLES[EXAMPLES.length - 1]) { celebrated = true; confetti($('#x-clear')); }
    if (n) celebrated = false;
  }
  function applyFix(f) {
    const A = src.value.split('\n'); f.fix(A); src.value = A.join('\n');
    run(f.issue.ruleId.startsWith('page-title') ? undefined : f.line);
  }
  list.addEventListener('click', (e) => {
    const how = e.target.closest('.x-howbtn');
    if (how) { const t = $(`#x-how-${how.dataset.how}`); t.hidden = !t.hidden; how.setAttribute('aria-expanded', String(!t.hidden)); return; }
    const b = e.target.closest('.x-fixbtn'); if (!b) return;
    applyFix(shownIssues[+b.dataset.k]);
    ($('.x-fixbtn', list) || $('#x-next')).focus({ preventScroll: true });
  });
  let fixing = false;
  async function fixAll() {
    if (fixing) return; fixing = true;
    for (let n = 0; n < 40; n++) {
      const f = shownIssues.find((x) => x.fix); if (!f) break;
      applyFix(f);
      if (!still()) await new Promise((r) => setTimeout(r, 380));
    }
    fixing = false;
    $('#x-next').focus({ preventScroll: true });
  }
  let ex = 0;
  function load(example) {
    current = example; celebrated = false; lastScore = null;
    titleIn.value = example.title; src.value = example.body.join('\n');
    const own = example === BLANK;
    $('#x-ex-name').textContent = own ? 'Your own page' : `Example ${ex + 1} of ${EXAMPLES.length}: ${example.name}`;
    run();
  }
  $('#x-fixall').addEventListener('click', fixAll);
  src.addEventListener('input', () => run());
  titleIn.addEventListener('input', () => run());
  $('#x-next').addEventListener('click', () => { ex = current === BLANK ? ex : (ex + 1) % EXAMPLES.length; load(EXAMPLES[ex]); });
  $('#x-own').addEventListener('click', () => { load(BLANK); titleIn.focus(); });
  const reset = () => { ex = 0; load(EXAMPLES[0]); };
  if (engineReady()) reset(); else window.addEventListener('load', reset, { once: true });

  function confetti(anchor) {
    if (still()) return;
    const r = anchor.getBoundingClientRect();
    const cols = ['#1c5d99', '#4fd08f', '#8cc2f5', '#f6b13c', '#f97a70'];
    for (let k = 0; k < 36; k++) {
      const d = document.createElement('i');
      d.className = 'x-confetti'; d.style.background = cols[k % 5];
      d.style.left = `${r.left + r.width / 2}px`; d.style.top = `${r.top + 30}px`;
      document.body.appendChild(d);
      const a = Math.random() * Math.PI * 2; const v = 80 + Math.random() * 140;
      d.animate([{ transform: 'translate(0,0) rotate(0)', opacity: 1 }, { transform: `translate(${Math.cos(a) * v}px,${Math.sin(a) * v + 120}px) rotate(${Math.random() * 720}deg)`, opacity: 0 }],
        { duration: 1100 + Math.random() * 500, easing: 'cubic-bezier(.2,.7,.3,1)' }).onfinish = () => d.remove();
    }
  }

  /* ---------- contrast lab ---------- */
  const hex2rgb = (h) => { h = h.replace('#', ''); if (h.length === 3) h = [...h].map((c) => c + c).join(''); return [0, 2, 4].map((k) => parseInt(h.slice(k, k + 2), 16)); };
  const rgb2hex = (a) => `#${a.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')}`;
  const lum = (a) => { const f = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(a[0]) + 0.7152 * f(a[1]) + 0.0722 * f(a[2]); };
  const ratio = (a, b) => { const x = lum(hex2rgb(a)); const y = lum(hex2rgb(b)); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const PRESETS = [['Light grey on white', '#9aa4b2', '#ffffff'], ['Blue on navy', '#1c5d99', '#0a1424'], ['Red on green', '#d92d20', '#12b76a'], ['White on orange', '#ffffff', '#f79009'], ['Our blue on white', '#1c5d99', '#ffffff']];
  let fg = '#1c5d99'; let bg = '#ffffff';
  let cxT;
  const floor2 = (r) => Math.floor(r * 100) / 100; // never round a 4.49 up to a pass
  function cx(animate = true) {
    const r = ratio(fg, bg);
    const prev = $('#x-cx-prev'); prev.style.color = fg; prev.style.background = bg;
    $('#x-fg').value = fg; $('#x-bg').value = bg;
    if (document.activeElement !== $('#x-fg-hex')) $('#x-fg-hex').value = fg;
    if (document.activeElement !== $('#x-bg-hex')) $('#x-bg-hex').value = bg;
    clearTimeout(cxT);
    cxT = setTimeout(() => { $('#x-cx-status').textContent = `Contrast ${floor2(r).toFixed(2)} to 1. ${r >= 4.5 ? 'Passes' : 'Fails'} AA for body text.`; }, 600);
    const el = $('#x-cx-ratio');
    if (animate) countTo(el, floor2(r), { dec: 2, dur: 500 }); else { el.textContent = floor2(r).toFixed(2); el.dataset.v = r; }
    $('#x-cx-fill').style.width = `${Math.min(100, (r / 21) * 100)}%`;
    const B = [['AA, body text', 4.5], ['AA, large text', 3], ['AAA, body text', 7], ['AAA, large text', 4.5]];
    $('#x-cx-badges').innerHTML = B.map(([t, n]) => `<div class="x-badge ${r >= n ? 'ok' : 'no'}"><span>${t}</span><span class="x-res">${r >= n ? 'Pass' : 'Fail'}</span></div>`).join('');
    const fix = $('#x-cx-fix');
    fix.disabled = r >= 4.5;
    fix.textContent = r >= 4.5 ? 'Passes AA for body text' : 'Find the nearest passing colour';
    $$('#x-presets .x-chip').forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.fg === fg && c.dataset.bg === bg)));
  }
  $('#x-presets').innerHTML = PRESETS.map(([n, f, b]) => `<button class="x-chip" aria-pressed="false" data-fg="${f}" data-bg="${b}"><span class="x-sw" style="background:linear-gradient(135deg, ${f} 50%, ${b} 50%)" aria-hidden="true"></span>${n}</button>`).join('');
  $('#x-presets').addEventListener('click', (e) => { const c = e.target.closest('.x-chip'); if (!c) return; fg = c.dataset.fg; bg = c.dataset.bg; cx(); });
  $('#x-fg').addEventListener('input', (e) => { fg = e.target.value; cx(false); });
  $('#x-bg').addEventListener('input', (e) => { bg = e.target.value; cx(false); });
  ['fg', 'bg'].forEach((k) => $(`#x-${k}-hex`).addEventListener('input', (e) => {
    const v = e.target.value.trim();
    if (!/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)) return;
    const h = rgb2hex(hex2rgb(v));
    if (k === 'fg') fg = h; else bg = h;
    cx(false);
  }));
  $('#x-cx-fix').addEventListener('click', () => {
    const darker = lum(hex2rgb(bg)) > 0.18;
    let c = hex2rgb(fg); const path = [];
    for (let s = 0; s < 160 && ratio(rgb2hex(c), bg) < 4.5; s++) {
      c = c.map((v) => (darker ? v * 0.97 - 1 : v + (255 - v) * 0.04 + 1));
      path.push(rgb2hex(c));
    }
    if (ratio(rgb2hex(c), bg) < 4.5) path.push(darker ? '#000000' : '#ffffff');
    if (!path.length) return;
    if (still()) { fg = path[path.length - 1]; cx(); return; }
    let k = 0; const stride = Math.max(1, Math.ceil(path.length / 24));
    const tick = () => {
      if (k < path.length - 1) { fg = path[k]; cx(false); k += stride; requestAnimationFrame(tick); } else { fg = path[path.length - 1]; cx(); }
    };
    tick();
  });
  cx(false);

  /* ---------- simulator ---------- */
  $('#x-mock').innerHTML = `
    <div class="x-mt">Q4 hiring plan</div>
    <div class="x-upd" id="x-m-upd">Last updated by People Ops · 3 min read</div>
    <div class="x-status"><span>Sourcing <i class="x-loz g" id="x-loz1"></i></span><span>Interviews <i class="x-loz r" id="x-loz2"></i></span></div>
    <div class="x-chart"><i style="height:90%;background:#36b37e"></i><i style="height:62%;background:#de350b"></i><i style="height:74%;background:#36b37e"></i><i style="height:40%;background:#de350b"></i></div>
    <div class="x-leg"><span><i style="background:#36b37e"></i>Accepted</span><span><i style="background:#de350b"></i>Declined</span></div>
    <div class="x-form"><div><span class="x-fl" id="x-m-l1">Candidate name</span><div class="x-inp"></div></div><div><span class="x-fl">Referred by</span><div class="x-inp"></div></div></div>
    <div class="x-note" id="x-m-note"></div>
    <div class="x-embed"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></svg><span id="x-m-embed"></span></div>`;
  const SR = {
    bad: [['Heading level 1, Q4 hiring plan'], ['Last updated by People Ops'], ['Sourcing'], ['Interviews'], ['Image', 1], ['Candidate name, edit text'], ['Referred by, edit text'], ['Fields in red are required.', 1], ['Link, click here', 1], ['Frame', 1]],
    good: [['Heading level 1, Q4 hiring plan'], ['Last updated by People Ops'], ['Sourcing, status: on track', 2], ['Interviews, status: blocked', 2], ['Image, offers accepted and declined by month: more accepted than declined in every month', 2], ['Candidate name, required, edit text', 2], ['Referred by, edit text'], ['Required fields are marked with an asterisk.', 2], ['Link, interview guidelines', 2], ['Frame, interview calendar', 2]],
  };
  const EXPL = {
    typ: ['The page as most people see it', 'It looks fine. The problems are invisible here; the next tabs show them.', null],
    deut: ['Red–green colour vision', 'About 1 in 12 men have a colour vision deficiency, most often red–green. The status dots and the chart legend become hard to tell apart.', 'status-colour-only · colour-only-meaning (WCAG 1.4.1)'],
    blur: ['Low vision', 'Blurred, the light grey line under the title is the first thing to go. Low-contrast text was one of the most common failures in our study.', 'contrast-minimum (WCAG 1.4.3)'],
    mono: ['No colour at all', 'Without colour, “fields in red are required” means nothing, and the two status dots look the same.', 'colour-only-meaning (WCAG 1.4.1)'],
    sr: ['What a screen reader announces', 'The chart is just “image”, the link says “click here”, the calendar is just “frame”, and the status dots say nothing at all.', 'img-alt-missing · link-nondescriptive · embed-no-label'],
  };
  let mode = 'typ'; let fixedOn = false; let srTimer;
  const stage = $('#x-stage'); const mock = $('#x-mock');
  function paintMock() {
    [['#x-loz1', 'ON TRACK'], ['#x-loz2', 'BLOCKED']].forEach(([s, t]) => { const l = $(s); l.textContent = fixedOn ? t : ''; l.style.padding = fixedOn ? '0 7px' : '0'; });
    const l1 = $('#x-m-l1');
    l1.innerHTML = fixedOn ? 'Candidate name <span class="x-req">*</span>' : 'Candidate name';
    l1.style.color = fixedOn ? '#172b4d' : '#de350b';
    $('#x-m-note').innerHTML = fixedOn
      ? 'Required fields are marked with an asterisk (<span class="x-req">*</span>). Read the <span class="x-l">interview guidelines</span>.'
      : 'Fields in red are required. More detail <span class="x-l">click here</span>.';
    $('#x-m-embed').textContent = fixedOn ? 'Interview calendar' : '[embedded calendar]';
  }
  function setMode(m) {
    mode = m;
    mock.style.filter = { typ: 'none', deut: 'url(#x-f-deut)', blur: 'blur(2.6px)', mono: 'url(#x-f-mono)', sr: 'none' }[m];
    // The failing grey is shown only in the low-vision demo, so the page itself passes on load.
    $('#x-m-upd').style.color = m === 'blur' && !fixedOn ? '#a5adba' : '#505f79';
    stage.classList.toggle('sr', m === 'sr');
    const [t, p, r] = EXPL[m];
    const after = fixedOn && m !== 'typ' ? ' <strong>After the fixes,</strong> the meaning no longer depends on colour, contrast or sight alone.' : '';
    $('#x-explain').innerHTML = `<h3>${t}</h3><p>${p}${after}</p>${r ? `<span class="x-rule">${r}</span>` : ''}`;
    $('#x-sim-panel').setAttribute('aria-labelledby', `x-t-${m}`);
    clearInterval(srTimer);
    if (m === 'sr') {
      const ol = $('#x-sr-lines');
      ol.innerHTML = SR[fixedOn ? 'good' : 'bad'].map(([t2, k]) => `<li class="${k === 1 ? 'bad' : k === 2 ? 'good' : ''}">${esc(t2)}</li>`).join('');
      const lis = $$('li', ol); let i = 0;
      if (still()) lis.forEach((l) => l.classList.add('on'));
      else srTimer = setInterval(() => { if (i >= lis.length) { clearInterval(srTimer); return; } lis[i++].classList.add('on'); }, 420);
    }
  }
  const tabs = $$('#x-sim-tabs .x-tab');
  function selectTab(i, focus) {
    tabs.forEach((t, k) => { t.setAttribute('aria-selected', String(k === i)); t.tabIndex = k === i ? 0 : -1; });
    if (focus) tabs[i].focus();
    setMode(tabs[i].dataset.mode);
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => selectTab(i));
    t.addEventListener('keydown', (e) => {
      let j = null;
      if (e.key === 'ArrowRight') j = (i + 1) % tabs.length;
      if (e.key === 'ArrowLeft') j = (i - 1 + tabs.length) % tabs.length;
      if (e.key === 'Home') j = 0;
      if (e.key === 'End') j = tabs.length - 1;
      if (j !== null) { e.preventDefault(); selectTab(j, true); }
    });
  });
  $('#x-fixsw').addEventListener('click', (e) => { fixedOn = !fixedOn; e.currentTarget.setAttribute('aria-checked', String(fixedOn)); paintMock(); setMode(mode); });
  paintMock(); setMode('typ');

  /* ---------- coverage ---------- */
  const PRIN = [['1', 'Perceivable'], ['2', 'Operable'], ['3', 'Understandable'], ['4', 'Robust']];
  $('#x-principles').innerHTML = PRIN.map(([n, name]) => {
    const cs = critKeys.filter((c) => c[0] === n);
    if (!cs.length) return '';
    return `<div class="x-prin"><h3>${name}</h3><div class="x-tiles">${cs.map((c) => {
      const k = checksFor(c).length;
      return `<button class="x-tile" data-c="${c}" aria-expanded="false" aria-controls="x-detail"><span class="x-num">${c}</span><span class="x-nm">${esc(CRIT[c][0])}</span><span class="x-lv" aria-hidden="true">${CRIT[c][1]}</span><span class="x-dots" aria-hidden="true">${'<i></i>'.repeat(k)}</span><span class="sr-only">, level ${CRIT[c][1]}, ${k} check${k > 1 ? 's' : ''}</span></button>`;
    }).join('')}</div></div>`;
  }).join('');
  function openCrit(c, focus) {
    $$('.x-tile').forEach((t) => t.setAttribute('aria-expanded', String(t.dataset.c === c)));
    const cs = checksFor(c); const [nm, lv] = CRIT[c];
    $('#x-detail').innerHTML = `<span class="x-tag">Level ${lv}</span><div class="x-dbig">${c}</div><h3>${esc(nm)}</h3><div class="x-small" style="margin-top:6px">${cs.length} check${cs.length > 1 ? 's' : ''} in every scan</div><ul>${cs.map((r, i) => `<li style="--i:${i}"><span class="x-ok" aria-hidden="true">✓</span><span>${esc(r.title)}<code>${r.id}</code></span></li>`).join('')}</ul>`;
    if (focus) {
      const t = $(`.x-tile[data-c="${c}"]`);
      t.scrollIntoView({ block: 'center', behavior: still() ? 'auto' : 'smooth' });
      t.focus({ preventScroll: true });
    }
  }
  $('#x-principles').addEventListener('click', (e) => { const t = e.target.closest('.x-tile'); if (t) openCrit(t.dataset.c); });
  function filterLvl(l) {
    $$('#x-lvl button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.l === l)));
    const vis = critKeys.filter((c) => l === 'all' || CRIT[c][1] === l);
    $$('.x-tile').forEach((t) => t.classList.toggle('dim', !vis.includes(t.dataset.c)));
    const n = DATA.rules.filter((r) => r.wcag.some((w) => vis.includes(w[0]))).length;
    $('#x-cov-count').textContent = `${vis.length} criteria · ${n} checks`;
  }
  $('#x-lvl').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) filterLvl(b.dataset.l); });
  filterLvl('all'); openCrit('1.3.1');

  /* ---------- estimator ---------- */
  const S = DATA.study;
  const bars = $('#x-est-bars');
  bars.innerHTML = `<h3>Most common problems to expect</h3>${S.top.map(([t, , id]) => `<div class="x-bar"><div class="x-lb"><span>${esc(t)}${RULE[id] && kindOf(RULE[id]) === 'review' ? ' <span class="x-revtag">review</span>' : ''}</span><span>0 pages</span></div><div class="x-trk"><i></i></div></div>`).join('')}<p class="x-small" style="margin:0">Expected pages affected, from the share of study pages with each problem. A page can have several. Items marked review need a person to confirm them; advisory items are left out.</p>`;
  let estT;
  function est() {
    const raw = +$('#x-pages-n').value;
    clearTimeout(estT);
    if (!(raw >= 1)) { $('#x-est-status').textContent = 'Enter how many pages your space has.'; return; }
    const n = Math.min(200000, raw);
    countTo($('#x-est-total'), (n * S.failing) / S.pages, { dur: 600 });
    estT = setTimeout(() => { $('#x-est-status').textContent = `About ${fmt((n * S.failing) / S.pages)} of ${fmt(n)} ${n === 1 ? 'page' : 'pages'} likely to have a level A or AA failure.`; }, 700);
    $$('.x-bar', bars).forEach((b, i) => {
      const v = (n * S.top[i][1]) / S.pages;
      b.querySelector('.x-lb > span:last-child').textContent = `about ${fmt(v)} pages`;
      b.querySelector('.x-trk i').style.width = `${(S.top[i][1] / S.top[0][1]) * 100}%`;
    });
  }
  const range = $('#x-pages');
  range.addEventListener('input', () => { $('#x-pages-n').value = range.value; range.setAttribute('aria-valuetext', `${fmt(+range.value)} pages`); est(); });
  $('#x-pages-n').addEventListener('input', (e) => { range.value = Math.min(20000, Math.max(50, +e.target.value || 50)); range.setAttribute('aria-valuetext', `${fmt(+e.target.value || 0)} pages`); est(); });
  const estIO = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { est(); estIO.disconnect(); } }), { threshold: 0.3 });
  estIO.observe($('#estimate'));

  /* ---------- story ---------- */
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  $('#x-device').innerHTML = `
    <div class="x-chrome"><i></i><i></i><i></i></div>
    <div class="x-scene on" data-s="0">
      <b>Welcome to the team</b>
      <div class="x-rows"><div class="x-rowi"><span>Accessibility</span><span class="x-st">score 74 · 3 issues</span></div></div>
      <div class="x-grp"><span class="x-cnt">1</span><span>Image has no alternative text<small>WCAG 1.1.1 · A</small></span><span class="x-pill">Write alt text</span></div>
      <div class="x-grp"><span class="x-cnt">2</span><span>Bold text used instead of a heading<small>WCAG 1.3.1 · A</small></span><span></span></div>
    </div>
    <div class="x-scene" data-s="1">
      <b>Scanning “HR Handbook”</b> <span class="x-small">(example space)</span>
      <div class="x-prog"><i></i></div>
      <div class="x-rows"><div class="x-rowi"><span>Onboarding checklist</span><span class="x-st">score 61</span></div><div class="x-rowi"><span>Benefits overview</span><span class="x-st">score 78</span></div><div class="x-rowi"><span>Leave policy</span><span class="x-st">score 92</span></div><div class="x-rowi"><span>Travel and expenses</span><span class="x-st">checking</span></div></div>
    </div>
    <div class="x-scene" data-s="2">
      <b>Most common problems</b> <span class="x-small">(example space)</span>
      <div class="x-grp"><span class="x-cnt">38</span><span>Image has no alternative text<small>WCAG 1.1.1 · A</small></span><span class="x-pill red">Most pages</span></div>
      <div class="x-grp"><span class="x-cnt">21</span><span>Bold text used instead of a heading<small>WCAG 1.3.1 · A</small></span><span></span></div>
      <div class="x-grp"><span class="x-cnt">9</span><span>Text contrast below the AA minimum<small>WCAG 1.4.3 · AA</small></span><span></span></div>
    </div>
    <div class="x-scene" data-s="3">
      <div class="x-report"><b>Accessibility conformance report</b><div class="x-small" style="margin:2px 0 10px">HR Handbook · published as a Confluence page</div>
        <div class="x-rr"><span>Standard</span><span class="x-mono">WCAG 2.2 AA</span></div>
        <div class="x-rr"><span>Pages checked</span><span class="x-mono">146</span></div>
        <div class="x-rr"><span>Criteria tested</span><span class="x-mono">${critKeys.length}</span></div>
        <div class="x-rr"><span>Report date</span><span class="x-mono">${today}</span></div>
      </div>
    </div>`;
  const steps = $$('.x-step'); const scenes = $$('.x-scene');
  const storyIO = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    const s = +e.target.dataset.scene;
    steps.forEach((x) => x.classList.toggle('on', x === e.target));
    scenes.forEach((x) => x.classList.toggle('on', +x.dataset.s === s));
  }), { rootMargin: '-45% 0px -45% 0px' });
  steps.forEach((s) => storyIO.observe(s));

  /* ---------- search palette ---------- */
  const pal = $('#x-pal'); const q = $('#x-pal-q'); const pl = $('#x-pal-list');
  const go = (sel) => () => {
    const sec = $(sel); sec.scrollIntoView({ behavior: still() ? 'auto' : 'smooth' });
    const h = $('h2[tabindex]', sec); if (h) h.focus({ preventScroll: true });
  };
  const ITEMS = [
    ...[['Live lab', '#lab'], ['Contrast lab', '#contrast'], ['Simulator', '#simulator'], ['Coverage map', '#coverage'], ['Space estimate', '#estimate'], ['How it works', '#how']].map(([t, h]) => ({ t, hint: 'section', go: go(h) })),
    ...critKeys.map((c) => ({ t: `${c} ${CRIT[c][0]}`, hint: `WCAG ${CRIT[c][1]}`, go: () => { filterLvl('all'); openCrit(c, true); } })),
    ...DATA.rules.filter((r) => r.wcag.length).map((r) => ({ t: r.title, hint: r.wcag.map((w) => w[0]).join(', '), go: () => { filterLvl('all'); openCrit(r.wcag[0][0], true); } })),
    { t: 'Run “Fix everything” in the live lab', hint: 'demo', go: () => { go('#lab')(); reset(); setTimeout(fixAll, still() ? 0 : 600); } },
    { t: 'Free checker for one page', hint: 'page', go: () => { location.href = '/checker.html'; } },
  ];
  let shown = []; let act = 0;
  function draw() {
    const s = q.value.trim().toLowerCase();
    shown = ITEMS.filter((it) => !s || `${it.t} ${it.hint}`.toLowerCase().includes(s)).slice(0, 40);
    act = Math.min(act, Math.max(0, shown.length - 1));
    pl.innerHTML = shown.length
      ? shown.map((it, i) => `<li role="option" id="x-po-${i}" aria-selected="${i === act}" data-i="${i}"><span>${esc(it.t)}</span><small>${esc(it.hint)}</small></li>`).join('')
      : '<li role="option" aria-disabled="true" aria-selected="false">No matches</li>';
    if (shown.length) { q.setAttribute('aria-activedescendant', `x-po-${act}`); $(`#x-po-${act}`).scrollIntoView({ block: 'nearest' }); } else q.removeAttribute('aria-activedescendant');
  }
  let opener = null;
  function openPal() {
    if (pal.open || typeof pal.showModal !== 'function') return;
    opener = document.activeElement;
    q.value = ''; act = 0; draw(); pal.showModal(); q.focus();
  }
  function choose(i) { const it = shown[i]; if (!it) return; opener = null; pal.close(); it.go(); }
  if (/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) $('#x-kbd').textContent = '⌘K';
  $('#x-open-pal').addEventListener('click', openPal);
  q.addEventListener('input', () => { act = 0; draw(); });
  q.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); act = Math.min(shown.length - 1, act + 1); draw(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); act = Math.max(0, act - 1); draw(); }
    else if (e.key === 'Enter') { e.preventDefault(); choose(act); }
  });
  pl.addEventListener('click', (e) => { const li = e.target.closest('li[data-i]'); if (li) choose(+li.dataset.i); });
  pal.addEventListener('click', (e) => { if (e.target === pal) pal.close(); });
  pal.addEventListener('close', () => { if (opener && opener.focus) opener.focus({ preventScroll: true }); });
  document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey) && !e.altKey) { e.preventDefault(); openPal(); }
  });
})();
