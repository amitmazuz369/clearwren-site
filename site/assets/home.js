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

  /* ---------- live lab ---------- */
  const EXAMPLE = [
    '## Before your first day',
    '#### Accounts and tools',
    '**Your first week**',
    '![](IMG_2041.png)',
    'Booking a trip? [click here](https://intranet.example/travel-policy)',
    'PLEASE SUBMIT ALL FORMS BEFORE FRIDAY NOON',
    '| Day | Session |',
    '| Monday | Welcome breakfast |',
    '| Tuesday | Security training |',
  ].join('\n');
  const ALT = ['New starters at the welcome breakfast', 'Floor plan of the third floor', 'Diagram of the onboarding steps'];
  const BAD_LINK = /^(here|click here|read more|more|link|this|this link|go|details|learn more)$/i;
  const BAD_ALT = /^(image|img|photo|picture|graphic|screenshot|untitled|pic)[\s_-]*\d*$|\.(png|jpe?g|gif|svg|webp)$|^(img|dsc|screenshot)[\s_-]?\d+/i;
  const DAYS = /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|may|june|july|august|september|october|november|december)\b/g;
  const sentence = (s) => s.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g, (c) => c.toUpperCase()).replace(DAYS, (w) => w[0].toUpperCase() + w.slice(1));
  const slugLabel = (u) => {
    const seg = (u.split(/[?#]/)[0].split('/').filter(Boolean).pop() || '').replace(/\.\w+$/, '');
    let w = '';
    try { w = decodeURIComponent(seg); } catch { w = seg; }
    w = w.replace(/[-_]+/g, ' ').trim();
    return w && !/^https?:$/.test(w) && !/\./.test(w) ? w[0].toUpperCase() + w.slice(1) : 'Linked page';
  };

  function analyze(src) {
    const L = src.split('\n');
    const out = [];
    let prev = 1; // Confluence supplies the page title as the H1.
    let altN = 0;
    const add = (id, line, fix, extra) => { if (RULE[id]) out.push({ id, line, fix, extra }); };
    L.forEach((raw, i) => {
      const line = raw.trimEnd();
      let m;
      if ((m = line.match(/^(#{1,6})\s*(.*)$/))) {
        const lvl = m[1].length; const text = m[2].trim();
        if (!text) add('heading-empty', i, (A) => A.splice(i, 1));
        else if (lvl === 1) add('heading-h1-in-body', i, (A) => { A[i] = `## ${text}`; });
        else if (lvl > prev + 1) { const p = prev; add('heading-skipped-level', i, (A) => { A[i] = `${'#'.repeat(p + 1)} ${text}`; }, `H${p} to H${lvl}`); }
        if (text) prev = Math.max(lvl, 2);
        return;
      }
      if ((m = line.match(/^\s*\*\*([^*]{1,80})\*\*:?\s*$/))) {
        const t = m[1].trim(); const lv = Math.min(Math.max(prev, 2), 6);
        add('fake-heading', i, (A) => { A[i] = `${'#'.repeat(lv)} ${t}`; });
        return;
      }
      if (/^\s*\|/.test(line)) {
        if (!/^\s*\|/.test(L[i - 1] || '') && !/^\s*\|?\s*:?-{3,}/.test(L[i + 1] || '')) {
          const cols = Math.max(1, line.split('|').length - 2);
          add('table-no-header', i, (A) => A.splice(i + 1, 0, `|${' --- |'.repeat(cols)}`));
        }
        return;
      }
      for (const im of line.matchAll(/!\[([^\]]*)\]\(([^)]*)\)/g)) {
        const alt = im[1].trim(); const whole = im[0]; const srcU = im[2]; const sug = ALT[altN++ % ALT.length];
        const rep = (A) => { A[i] = A[i].replace(whole, `![${sug}](${srcU})`); };
        if (!alt) add('img-alt-missing', i, rep);
        else if (BAD_ALT.test(alt)) add('img-alt-meaningless', i, rep);
        else if (/^(an? )?(image|picture|photo) of /i.test(alt)) {
          const clean = alt.replace(/^(an? )?(image|picture|photo) of /i, '').replace(/^\w/, (c) => c.toUpperCase());
          add('img-alt-redundant', i, (A) => { A[i] = A[i].replace(whole, `![${clean}](${srcU})`); });
        }
      }
      for (const lk of line.matchAll(/(^|[^!])\[([^\]]*)\]\(([^)]*)\)/g)) {
        const text = lk[2].trim(); const url = lk[3]; const whole = `[${lk[2]}](${url})`;
        const rep = (A) => { A[i] = A[i].replace(whole, `[${slugLabel(url)}](${url})`); };
        if (!text) add('link-empty', i, rep);
        else if (BAD_LINK.test(text)) add('link-nondescriptive', i, rep, `“${text}”`);
        else if (/^https?:\/\//i.test(text)) add('link-raw-url', i, rep);
      }
      const plain = line.replace(/\[[^\]]*\]\([^)]*\)/g, ' ');
      if (/(\b[A-Z][A-Z'’]+\b[\s,.!:]+){4,}\b[A-Z][A-Z'’]+\b/.test(plain)) add('all-caps-run', i, (A) => { A[i] = sentence(A[i]); });
    });
    return out;
  }

  const IMG_ICON = '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 17-5-5-9 8"/></svg>';
  const inline = (s) => esc(s)
    .replace(/!\[([^\]]*)\]\(([^)]*)\)/g, (_, a) => `</span><span class="x-pv-img">${IMG_ICON}<span>${a ? `Description: ${a}` : 'No description'}</span></span><span>`)
    .replace(/\[([^\]]*)\]\(([^)]*)\)/g, (_, t) => `<span class="x-pv-a">${t || '&nbsp;&nbsp;&nbsp;'}</span>`)
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');

  function render(src, finds, glowLine) {
    const L = src.split('\n');
    const byLine = {};
    finds.forEach((f, k) => { (byLine[f.line] ||= []).push({ n: k + 1, rv: kindOf(RULE[f.id]) === 'review' }); });
    const cls = (i) => {
      const f = byLine[i]; let c = '';
      if (f) c += ` x-flag${f.every((x) => x.rv) ? ' rv' : ''}" data-n="${f.map((x) => x.n).join(',')}`;
      if (i === glowLine) c += ' x-glow';
      return c;
    };
    let h = '<div class="x-pv-crumb">Onboarding / New starters</div><div class="x-pv-title">Welcome to the team</div>';
    for (let i = 0; i < L.length; i++) {
      const line = L[i]; let m;
      if (!line.trim()) continue;
      if ((m = line.match(/^(#{1,6})\s*(.*)$/))) { h += `<div class="x-pv-h${m[1].length}${cls(i)}">${inline(m[2]) || '&nbsp;'}</div>`; continue; }
      if (/^\s*\|/.test(line)) {
        const start = i; const rows = [];
        while (i < L.length && /^\s*\|/.test(L[i])) rows.push(L[i++]);
        i--;
        const hasHead = rows.length > 1 && /^\s*\|?\s*:?-{3,}/.test(rows[1]);
        const cells = (r) => r.split('|').slice(1, -1).map((c) => inline(c.trim()));
        let t = `<table class="${cls(start).trim()}">`;
        rows.forEach((r, k) => {
          if (hasHead && k === 1) return;
          const tag = hasHead && k === 0 ? 'th' : 'td';
          t += `<tr>${cells(r).map((c) => `<${tag}>${c}</${tag}>`).join('')}</tr>`;
        });
        h += `${t}</table>`;
        continue;
      }
      h += `<div class="x-pv-p${cls(i)}"><span>${inline(line)}</span></div>`;
    }
    return h;
  }

  const src = $('#x-src'); const pv = $('#x-pv'); const list = $('#x-findings');
  let peak = 0; let statusT; let celebrated = false; let finds = [];
  function run(glowLine) {
    finds = analyze(src.value);
    peak = Math.max(peak, finds.length);
    const fails = finds.filter((f) => kindOf(RULE[f.id]) === 'fail').length;
    pv.innerHTML = render(src.value, finds, glowLine);
    pv.setAttribute('aria-label', `Preview of your page, ${finds.length} item${finds.length === 1 ? '' : 's'} flagged`);
    list.innerHTML = finds.map((f, k) => {
      const r = RULE[f.id]; const kind = kindOf(r); const [c, , lv] = r.wcag[0];
      return `<li class="x-finding${kind === 'review' ? ' rv' : ''}" style="--i:${k}"><span class="x-n" aria-hidden="true">${k + 1}</span><div><span class="x-t">${esc(r.title)}</span><span class="x-meta"><span class="x-kind">${kind === 'fail' ? 'Fail' : 'Review'}</span> · line ${f.line + 1} · WCAG ${c} (${lv})${f.extra ? ` · ${esc(f.extra)}` : ''}</span></div><button class="x-fixbtn" data-k="${k}" aria-label="Fix ${esc(r.title)}, line ${f.line + 1}">Fix</button></li>`;
    }).join('');
    const fixed = peak - finds.length; const pct = peak ? Math.round((fixed / peak) * 100) : 100;
    $('#x-ring').style.background = `conic-gradient(var(--x-pass) ${pct}%, var(--border) 0)`;
    $('#x-ring-n').textContent = finds.length;
    $('#x-score-t').textContent = finds.length ? `${finds.length} finding${finds.length === 1 ? '' : 's'}` : 'All clear';
    $('#x-score-s').textContent = finds.length ? `${fails} fail, ${finds.length - fails} to review · ${fixed} of ${peak} fixed` : (peak ? `${peak} of ${peak} fixed` : 'Nothing flagged');
    $('#x-pv-count').textContent = finds.length ? `${finds.length} flagged` : '';
    $('#x-clear').classList.toggle('on', !finds.length);
    $('#x-fixall').hidden = !finds.length;
    clearTimeout(statusT);
    statusT = setTimeout(() => { $('#x-lab-status').textContent = finds.length ? `${finds.length} finding${finds.length === 1 ? '' : 's'}` : 'All clear, nothing flagged'; }, 700);
    if (!finds.length && peak && !celebrated) { celebrated = true; confetti($('#x-clear')); }
    if (finds.length) celebrated = false;
  }
  function applyFix(f) { const A = src.value.split('\n'); f.fix(A); src.value = A.join('\n'); run(f.line); }
  list.addEventListener('click', (e) => {
    const b = e.target.closest('.x-fixbtn'); if (!b) return;
    applyFix(finds[+b.dataset.k]);
    ($('.x-fixbtn', list) || $('#x-reset')).focus({ preventScroll: true });
  });
  let fixing = false;
  async function fixAll() {
    if (fixing) return; fixing = true;
    for (let n = 0; n < 30; n++) {
      const f = analyze(src.value)[0]; if (!f) break;
      applyFix(f);
      if (!still()) await new Promise((r) => setTimeout(r, 380));
    }
    fixing = false;
    $('#x-reset').focus({ preventScroll: true });
  }
  $('#x-fixall').addEventListener('click', fixAll);
  src.addEventListener('input', () => run());
  const reset = () => { src.value = EXAMPLE; peak = 0; run(); };
  $('#x-reset').addEventListener('click', reset);
  reset();

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
  let fg = '#9aa4b2'; let bg = '#ffffff';
  const floor2 = (r) => Math.floor(r * 100) / 100; // never round a 4.49 up to a pass
  function cx(animate = true) {
    const r = ratio(fg, bg);
    const prev = $('#x-cx-prev'); prev.style.color = fg; prev.style.background = bg;
    $('#x-fg').value = fg; $('#x-bg').value = bg;
    if (document.activeElement !== $('#x-fg-hex')) $('#x-fg-hex').value = fg;
    if (document.activeElement !== $('#x-bg-hex')) $('#x-bg-hex').value = bg;
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
  $('#x-presets').innerHTML = PRESETS.map(([n, f, b]) => `<button class="x-chip" aria-pressed="false" data-fg="${f}" data-bg="${b}"><span class="x-sw" style="background:${b};color:${f}" aria-hidden="true">Aa</span>${n}</button>`).join('');
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
    $('#x-m-upd').style.color = fixedOn ? '#505f79' : '#a5adba';
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
  bars.innerHTML = `<h3>Most common problems to expect</h3>${S.top.map(([t]) => `<div class="x-bar"><div class="x-lb"><span>${esc(t)}</span><span>0 pages</span></div><div class="x-trk"><i></i></div></div>`).join('')}<p class="x-small" style="margin:0">Expected pages affected, from the share of study pages with each problem. A page can have several. Advisory items are left out.</p>`;
  function est() {
    const n = Math.max(1, Math.min(200000, +$('#x-pages-n').value || 1));
    countTo($('#x-est-total'), (n * S.failing) / S.pages, { dur: 600 });
    $$('.x-bar', bars).forEach((b, i) => {
      const v = (n * S.top[i][1]) / S.pages;
      b.querySelector('.x-lb span:last-child').textContent = `about ${fmt(v)} pages`;
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
  const go = (sel) => () => $(sel).scrollIntoView({ behavior: still() ? 'auto' : 'smooth' });
  const ITEMS = [
    ...[['Live lab', '#x-lab'], ['Contrast lab', '#contrast'], ['Simulator', '#simulator'], ['Coverage map', '#coverage'], ['Space estimate', '#estimate'], ['How it works', '#how']].map(([t, h]) => ({ t, hint: 'section', go: go(h) })),
    ...critKeys.map((c) => ({ t: `${c} ${CRIT[c][0]}`, hint: `WCAG ${CRIT[c][1]}`, go: () => { filterLvl('all'); openCrit(c, true); } })),
    ...DATA.rules.map((r) => ({ t: r.title, hint: r.wcag.map((w) => w[0]).join(', '), go: () => { filterLvl('all'); openCrit(r.wcag[0][0], true); } })),
    { t: 'Run “Fix everything” in the live lab', hint: 'demo', go: () => { go('#x-lab')(); reset(); setTimeout(fixAll, still() ? 0 : 600); } },
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
    const a = document.activeElement;
    const typing = a && (/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) || a.isContentEditable);
    if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey)) { e.preventDefault(); openPal(); }
  });
})();
