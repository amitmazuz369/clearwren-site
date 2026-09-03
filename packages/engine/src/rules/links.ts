import type { Rule, Issue, AdfNode } from '../types.js';
import { walk, truncate, mark } from '../adf.js';

const LINK_PURPOSE: { criterion: string; name: string; level: 'A' } = {
  criterion: '2.4.4', name: 'Link Purpose (In Context)', level: 'A',
};
const LINK_ONLY: { criterion: string; name: string; level: 'AAA' } = {
  criterion: '2.4.9', name: 'Link Purpose (Link Only)', level: 'AAA',
};

export interface LinkRun { href: string; text: string; path: number[] }

/** Adjacent text nodes sharing one href are a single link to the user. */
export function collectLinks(doc: AdfNode): LinkRun[] {
  const runs: LinkRun[] = [];
  for (const { node, path } of walk(doc)) {
    const kids = node.content;
    if (!kids) continue;
    let cur: LinkRun | null = null;
    for (let i = 0; i < kids.length; i++) {
      const child = kids[i]!;
      const href = child.type === 'text' ? (mark(child, 'link')?.attrs?.['href'] as string | undefined) : undefined;
      if (href) {
        if (cur && cur.href === href) cur.text += child.text ?? '';
        else {
          if (cur) runs.push(cur);
          cur = { href, text: child.text ?? '', path: [...path, i] };
        }
      } else if (cur) {
        runs.push(cur);
        cur = null;
      }
    }
    if (cur) runs.push(cur);
  }
  return runs.map((r) => ({ ...r, text: r.text.replace(/\s+/g, ' ').trim() }));
}

const VAGUE = new Set([
  'click here', 'click', 'here', 'this', 'this page', 'this link', 'link', 'more', 'read more',
  'learn more', 'see more', 'details', 'more details', 'more info', 'more information', 'info',
  'download', 'go', 'continue', 'view', 'see', 'open', 'page', 'document', 'doc', 'file',
  'לחץ כאן', 'כאן', 'קרא עוד', 'למידע נוסף', 'לחצו כאן',
]);

export const linkNondescriptive: Rule = {
  id: 'link-nondescriptive',
  title: 'Link text does not say where it goes',
  why: 'Screen-reader users often pull up a list of every link on the page; a list of "click here" entries is unusable.',
  howToFix: 'Rewrite the link text to name the destination, for example "2026 onboarding checklist" instead of "click here".',
  wcag: [LINK_PURPOSE],
  section508: ['502.3.1'],
  severity: 'serious',
  confidence: 'certain',
  run(ctx): Issue[] {
    return collectLinks(ctx.doc)
      .filter((l) => VAGUE.has(l.text.toLowerCase().replace(/[.!?:,]+$/, '')))
      .map((l) => ({
        ruleId: 'link-nondescriptive',
        severity: 'serious' as const,
        confidence: 'certain' as const,
        path: l.path,
        location: 'Link',
        evidence: truncate(l.text, 60),
        data: { href: l.href },
      }));
  },
};

export const linkRawUrl: Rule = {
  id: 'link-raw-url',
  title: 'Bare URL used as link text',
  why: 'A screen reader reads a raw URL character by character, which is slow and tells the listener very little.',
  howToFix: 'Replace the URL with a short phrase describing the page it opens.',
  wcag: [LINK_PURPOSE],
  severity: 'moderate',
  confidence: 'certain',
  run(ctx): Issue[] {
    return collectLinks(ctx.doc)
      .filter((l) => /^(https?:\/\/|www\.)/i.test(l.text) && l.text.length > 30)
      .map((l) => ({
        ruleId: 'link-raw-url',
        severity: 'moderate' as const,
        confidence: 'certain' as const,
        path: l.path,
        location: 'Link',
        evidence: truncate(l.text, 60),
        data: { href: l.href },
      }));
  },
};

export const linkEmpty: Rule = {
  id: 'link-empty',
  title: 'Link has no readable text',
  why: 'A link with no text is announced only as its URL, or skipped entirely.',
  howToFix: 'Add link text, or if the link wraps an image, give the image alt text.',
  wcag: [LINK_PURPOSE, { criterion: '4.1.2', name: 'Name, Role, Value', level: 'A' }],
  severity: 'critical',
  confidence: 'certain',
  run(ctx): Issue[] {
    return collectLinks(ctx.doc)
      .filter((l) => l.text.length === 0)
      .map((l) => ({
        ruleId: 'link-empty',
        severity: 'critical' as const,
        confidence: 'certain' as const,
        path: l.path,
        location: 'Link',
        data: { href: l.href },
      }));
  },
};

export const linkAmbiguousDuplicate: Rule = {
  id: 'link-ambiguous-duplicate',
  title: 'Same link text points to different pages',
  why: 'Two links reading "guidelines" that lead to different pages are indistinguishable in a screen reader’s link list.',
  howToFix: 'Make each link text unique, for example "security guidelines" and "brand guidelines".',
  wcag: [LINK_PURPOSE, LINK_ONLY],
  severity: 'moderate',
  confidence: 'certain',
  run(ctx): Issue[] {
    const byText = new Map<string, Set<string>>();
    const first = new Map<string, LinkRun>();
    for (const l of collectLinks(ctx.doc)) {
      const key = l.text.toLowerCase();
      if (!key) continue;
      if (!byText.has(key)) { byText.set(key, new Set()); first.set(key, l); }
      byText.get(key)!.add(normalise(l.href));
    }
    const out: Issue[] = [];
    for (const [key, hrefs] of byText) {
      if (hrefs.size < 2) continue;
      const l = first.get(key)!;
      out.push({
        ruleId: 'link-ambiguous-duplicate',
        severity: 'moderate',
        confidence: 'certain',
        path: l.path,
        location: 'Link',
        evidence: truncate(l.text, 60),
        data: { targets: [...hrefs] },
      });
    }
    return out;
  },
};

function normalise(href: string): string {
  return href.replace(/[#?].*$/, '').replace(/\/+$/, '').toLowerCase();
}

export const linkRules: Rule[] = [linkNondescriptive, linkRawUrl, linkEmpty, linkAmbiguousDuplicate];
