/**
 * Minimal HTML → ADF converter. Used to run the rule engine over real-world
 * pages during validation, and by the public checker on the site. It models the
 * subset of ADF the engine reasons about; anything else becomes a paragraph.
 */

const VOID = new Set(['br', 'hr', 'img', 'input', 'meta', 'link', 'source', 'col']);
const SKIP = new Set(['script', 'style', 'noscript', 'svg', 'head', 'nav', 'footer', 'iframe']);

/** Tokenises HTML into a tree without a DOM. Good enough for well-formed pages. */
export function parseHtml(html) {
  const root = { tag: '#root', attrs: {}, children: [] };
  const stack = [root];
  const rx = /<!--[\s\S]*?-->|<\/([a-zA-Z0-9-]+)\s*>|<([a-zA-Z0-9-]+)((?:\s+[^<>"']+(?:=(?:"[^"]*"|'[^']*'|[^\s"'<>]+))?)*)\s*(\/?)>|([^<]+)/g;
  let m;
  while ((m = rx.exec(html))) {
    const [full, closeTag, openTag, attrStr, selfClose, text] = m;
    if (full.startsWith('<!--')) continue;
    if (closeTag) {
      for (let i = stack.length - 1; i > 0; i--) {
        if (stack[i].tag === closeTag.toLowerCase()) { stack.length = i; break; }
      }
    } else if (openTag) {
      const tag = openTag.toLowerCase();
      const node = { tag, attrs: parseAttrs(attrStr ?? ''), children: [] };
      stack[stack.length - 1].children.push(node);
      if (!VOID.has(tag) && !selfClose) stack.push(node);
    } else if (text) {
      const decoded = decode(text);
      if (decoded.trim() || /\s/.test(decoded)) {
        stack[stack.length - 1].children.push({ tag: '#text', text: decoded });
      }
    }
  }
  return root;
}

function parseAttrs(s) {
  const attrs = {};
  const rx = /([a-zA-Z0-9_:-]+)(?:=("([^"]*)"|'([^']*)'|([^\s"'<>]+)))?/g;
  let m;
  while ((m = rx.exec(s))) attrs[m[1].toLowerCase()] = decode(m[3] ?? m[4] ?? m[5] ?? '');
  return attrs;
}

function decode(s) {
  return s
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&amp;/g, '&');
}

function colourFromStyle(style, prop) {
  const m = new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*([^;]+)`, 'i').exec(style ?? '');
  if (!m) return null;
  const v = m[1].trim();
  return /^(#|rgb)/i.test(v) ? v : null;
}

/** Inline content of an element, carrying marks down. */
function inline(node, marks = []) {
  const out = [];
  for (const child of node.children ?? []) {
    if (child.tag === '#text') {
      const text = child.text.replace(/\s+/g, ' ');
      if (text) out.push(marks.length ? { type: 'text', text, marks: [...marks] } : { type: 'text', text });
      continue;
    }
    if (SKIP.has(child.tag)) continue;
    if (child.tag === 'br') { out.push({ type: 'hardBreak' }); continue; }
    if (child.tag === 'img') { out.push(mediaInline(child)); continue; }
    const next = [...marks];
    if (child.tag === 'a' && child.attrs.href) next.push({ type: 'link', attrs: { href: child.attrs.href } });
    if (child.tag === 'strong' || child.tag === 'b') next.push({ type: 'strong' });
    if (child.tag === 'em' || child.tag === 'i') next.push({ type: 'em' });
    if (child.tag === 'code') next.push({ type: 'code' });
    if (child.tag === 'u') next.push({ type: 'underline' });
    const fg = colourFromStyle(child.attrs?.style, 'color');
    const bg = colourFromStyle(child.attrs?.style, 'background-color');
    if (fg) next.push({ type: 'textColor', attrs: { color: fg } });
    if (bg) next.push({ type: 'backgroundColor', attrs: { color: bg } });
    out.push(...inline(child, next));
  }
  return out;
}

function mediaInline(node) {
  const attrs = { type: 'file', id: node.attrs.src ?? 'external' };
  if (node.attrs.alt !== undefined) attrs.alt = node.attrs.alt;
  return { type: 'mediaInline', attrs };
}

function mediaSingle(node) {
  const attrs = { type: 'external', id: node.attrs.src ?? 'external', url: node.attrs.src };
  if (node.attrs.alt !== undefined) attrs.alt = node.attrs.alt;
  return { type: 'mediaSingle', attrs: { layout: 'center' }, content: [{ type: 'media', attrs }] };
}

/** Block-level conversion. */
function blocks(node) {
  const out = [];
  for (const child of node.children ?? []) {
    if (child.tag === '#text') {
      const text = child.text.trim();
      if (text) out.push({ type: 'paragraph', content: [{ type: 'text', text }] });
      continue;
    }
    if (SKIP.has(child.tag)) continue;
    const tag = child.tag;
    if (/^h[1-6]$/.test(tag)) {
      out.push({ type: 'heading', attrs: { level: Number(tag[1]) }, content: inline(child) });
    } else if (tag === 'p') {
      const content = inline(child);
      if (content.length) out.push({ type: 'paragraph', content });
    } else if (tag === 'ul' || tag === 'ol') {
      const items = (child.children ?? []).filter((c) => c.tag === 'li').map((li) => ({
        type: 'listItem',
        content: blocks(li).length ? blocks(li) : [{ type: 'paragraph', content: inline(li) }],
      }));
      if (items.length) out.push({ type: tag === 'ul' ? 'bulletList' : 'orderedList', content: items });
    } else if (tag === 'table') {
      const rows = [];
      for (const section of [child, ...(child.children ?? [])]) {
        for (const tr of (section.children ?? []).filter((c) => c.tag === 'tr')) {
          const cells = (tr.children ?? []).filter((c) => c.tag === 'td' || c.tag === 'th').map((c) => ({
            type: c.tag === 'th' ? 'tableHeader' : 'tableCell',
            attrs: {
              ...(c.attrs.colspan ? { colspan: Number(c.attrs.colspan) } : {}),
              ...(c.attrs.rowspan ? { rowspan: Number(c.attrs.rowspan) } : {}),
              ...(colourFromStyle(c.attrs.style, 'background-color') ? { background: colourFromStyle(c.attrs.style, 'background-color') } : {}),
            },
            content: blocks(c).length ? blocks(c) : [{ type: 'paragraph', content: inline(c) }],
          }));
          if (cells.length) rows.push({ type: 'tableRow', content: cells });
        }
      }
      if (rows.length) out.push({ type: 'table', attrs: { layout: 'default' }, content: rows });
    } else if (tag === 'img') {
      out.push(mediaSingle(child));
    } else if (tag === 'blockquote') {
      out.push({ type: 'blockquote', content: blocks(child) });
    } else if (tag === 'pre') {
      out.push({ type: 'codeBlock', attrs: {}, content: inline(child) });
    } else if (tag === 'hr') {
      out.push({ type: 'rule' });
    } else if (tag === 'details') {
      const summary = (child.children ?? []).find((c) => c.tag === 'summary');
      out.push({
        type: 'expand',
        attrs: { title: summary ? inline(summary).map((n) => n.text ?? '').join('') : '' },
        content: blocks(child),
      });
    } else {
      out.push(...blocks(child));
    }
  }
  return out;
}

export function htmlToAdf(html) {
  const body = /<body[^>]*>([\s\S]*)<\/body>/i.exec(html)?.[1] ?? html;
  const main = /<(?:main|article)[^>]*>([\s\S]*?)<\/(?:main|article)>/i.exec(body)?.[1] ?? body;
  const tree = parseHtml(main);
  return { version: 1, type: 'doc', content: blocks(tree) };
}

export function titleOf(html) {
  return decode(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? '').trim();
}
