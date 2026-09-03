import type { Rule, Issue, AdfNode } from '../types.js';
import { findAll, trimmedText, truncate, textOf, walk } from '../adf.js';

const INFO_REL: { criterion: string; name: string; level: 'A' } = {
  criterion: '1.3.1', name: 'Info and Relationships', level: 'A',
};

export const pageTitleNondescriptive: Rule = {
  id: 'page-title-nondescriptive',
  title: 'Page title does not describe the page',
  why: 'The title is the first thing a screen reader announces and the label the page carries in search, tabs and link lists.',
  howToFix: 'Rename the page to something that identifies its topic without the surrounding context.',
  wcag: [{ criterion: '2.4.2', name: 'Page Titled', level: 'A' }],
  section508: ['502.3.1'],
  severity: 'moderate',
  confidence: 'certain',
  run(ctx): Issue[] {
    const t = (ctx.meta.title ?? '').trim();
    if (!t) return [];
    const bad = /^(untitled|new page|copy of |page \d+|test|draft|tbd|todo|wip|\(?copy\)?|meeting notes?$|notes?$)/i.test(t) || t.length < 3;
    if (!bad) return [];
    return [{ ruleId: 'page-title-nondescriptive', severity: 'moderate', confidence: 'certain', path: [], location: 'Page title', evidence: truncate(t, 70) }];
  },
};

export const pageTitleDuplicate: Rule = {
  id: 'page-title-duplicate',
  title: 'Another page in this space has the same title',
  why: 'Identical titles are impossible to tell apart in search results, breadcrumbs and link lists.',
  howToFix: 'Make the title unique, for example by naming the team, product or year it belongs to.',
  wcag: [{ criterion: '2.4.2', name: 'Page Titled', level: 'A' }],
  severity: 'advisory',
  confidence: 'certain',
  run(ctx): Issue[] {
    const t = (ctx.meta.title ?? '').trim().toLowerCase();
    if (!t || !ctx.meta.siblingTitles?.length) return [];
    const dupes = ctx.meta.siblingTitles.filter((s) => s.trim().toLowerCase() === t).length;
    if (dupes === 0) return [];
    return [{ ruleId: 'page-title-duplicate', severity: 'advisory', confidence: 'certain', path: [], location: 'Page title', evidence: truncate(ctx.meta.title ?? '', 70), data: { duplicates: dupes } }];
  },
};

export const expandNoTitle: Rule = {
  id: 'expand-no-title',
  title: 'Collapsible section has no label',
  why: 'An unlabelled expand is announced only as a button, so a keyboard user cannot tell what opening it will reveal.',
  howToFix: 'Type a short label into the collapsible section’s title field.',
  wcag: [{ criterion: '2.4.6', name: 'Headings and Labels', level: 'AA' }, { criterion: '4.1.2', name: 'Name, Role, Value', level: 'A' }],
  severity: 'moderate',
  confidence: 'certain',
  run(ctx): Issue[] {
    const out: Issue[] = [];
    for (const { node, path } of findAll(ctx.doc, (n) => n.type === 'expand' || n.type === 'nestedExpand')) {
      const title = String(node.attrs?.['title'] ?? '').trim();
      if (!title) out.push({ ruleId: 'expand-no-title', severity: 'moderate', confidence: 'certain', path, location: 'Collapsible section' });
    }
    return out;
  },
};

export const embedNoLabel: Rule = {
  id: 'embed-no-label',
  title: 'Embedded content has no accessible name',
  why: 'Embedded frames are announced by their title; without one, a screen-reader user hears only "frame".',
  howToFix: 'Add a title or a short line of text above the embed saying what it contains.',
  wcag: [{ criterion: '4.1.2', name: 'Name, Role, Value', level: 'A' }, { criterion: '2.4.1', name: 'Bypass Blocks', level: 'A' }],
  severity: 'moderate',
  confidence: 'review',
  run(ctx): Issue[] {
    const out: Issue[] = [];
    for (const { node, path } of findAll(ctx.doc, (n) => n.type === 'embedCard' || n.type === 'blockCard')) {
      const label = String(node.attrs?.['title'] ?? node.attrs?.['name'] ?? '').trim();
      if (label) continue;
      out.push({ ruleId: 'embed-no-label', severity: 'moderate', confidence: 'review', path, location: 'Embedded content', evidence: truncate(String(node.attrs?.['url'] ?? ''), 70) });
    }
    return out;
  },
};

export const allCapsRun: Rule = {
  id: 'all-caps-run',
  title: 'Long run of capital letters',
  why: 'Some screen readers spell out all-caps words letter by letter, and blocks of capitals are slower for everyone to read.',
  howToFix: 'Use sentence case and apply bold or a heading if you need the text to stand out.',
  wcag: [{ criterion: '3.1.5', name: 'Reading Level', level: 'AAA' }],
  severity: 'advisory',
  confidence: 'review',
  run(ctx): Issue[] {
    const out: Issue[] = [];
    for (const { node, path } of walk(ctx.doc)) {
      if (node.type !== 'text') continue;
      const t = node.text ?? '';
      const letters = t.replace(/[^A-Za-z]/g, '');
      if (letters.length >= 25 && letters === letters.toUpperCase()) {
        out.push({ ruleId: 'all-caps-run', severity: 'advisory', confidence: 'review', path, location: 'Text', evidence: truncate(t, 60) });
      }
    }
    return out;
  },
};

export const justifiedText: Rule = {
  id: 'justified-text',
  title: 'Text is justified',
  why: 'Justified text creates uneven rivers of white space that people with dyslexia find hard to track.',
  howToFix: 'Set the paragraph alignment back to left (or right for right-to-left languages).',
  wcag: [{ criterion: '1.4.8', name: 'Visual Presentation', level: 'AAA' }],
  severity: 'advisory',
  confidence: 'certain',
  run(ctx): Issue[] {
    const out: Issue[] = [];
    for (const { node, path } of walk(ctx.doc)) {
      const align = (node.marks ?? []).find((m) => m.type === 'alignment')?.attrs?.['align'];
      if (align === 'justify') out.push({ ruleId: 'justified-text', severity: 'advisory', confidence: 'certain', path, location: 'Paragraph', evidence: truncate(trimmedText(node), 60) });
    }
    return out;
  },
};

export const emptyHardBreakSpacing: Rule = {
  id: 'spacing-hard-breaks',
  title: 'Blank lines used for spacing',
  why: 'A screen reader announces every empty line, so stacks of them are read out as meaningless pauses.',
  howToFix: 'Delete the blank lines and use a divider or a heading to separate the sections.',
  wcag: [INFO_REL],
  severity: 'advisory',
  confidence: 'review',
  run(ctx): Issue[] {
    const out: Issue[] = [];
    const top = ctx.doc.content ?? [];
    let run = 0;
    let start = -1;
    for (let i = 0; i <= top.length; i++) {
      const node = top[i];
      const empty = node?.type === 'paragraph' && !trimmedText(node);
      if (empty) {
        if (run === 0) start = i;
        run++;
      } else {
        if (run >= 3) out.push({ ruleId: 'spacing-hard-breaks', severity: 'advisory', confidence: 'review', path: [start], location: 'Blank lines', data: { count: run } });
        run = 0;
      }
    }
    return out;
  },
};

export const longParagraph: Rule = {
  id: 'long-paragraph',
  title: 'Very long paragraph',
  why: 'A screen reader reads a paragraph as one unbroken block, and long blocks are hard to follow or re-find.',
  howToFix: 'Break the paragraph into shorter ones, or turn the steps inside it into a list.',
  wcag: [{ criterion: '3.1.5', name: 'Reading Level', level: 'AAA' }],
  severity: 'advisory',
  confidence: 'review',
  run(ctx): Issue[] {
    const out: Issue[] = [];
    for (const { node, path } of findAll(ctx.doc, 'paragraph')) {
      const t = trimmedText(node);
      if (t.length > 1200) out.push({ ruleId: 'long-paragraph', severity: 'advisory', confidence: 'review', path, location: 'Paragraph', evidence: truncate(t, 60), data: { length: t.length } });
    }
    return out;
  },
};

/**
 * Confluence sets one language for the whole page, so a passage in a different
 * script is announced by a screen reader in the wrong voice.
 */
export const mixedLanguage: Rule = {
  id: 'mixed-language',
  title: 'Passage in a different script',
  why: 'A screen reader keeps using the page language, so text in another script is read with the wrong pronunciation rules.',
  howToFix: 'Move the passage to its own page in that language, or add a note naming the language for readers.',
  wcag: [{ criterion: '3.1.2', name: 'Language of Parts', level: 'AA' }],
  severity: 'moderate',
  confidence: 'review',
  run(ctx): Issue[] {
    const scripts = {
      hebrew: /[֐-׿]/g,
      arabic: /[؀-ۿ]/g,
      cyrillic: /[Ѐ-ӿ]/g,
      cjk: /[一-鿿぀-ヿ가-힯]/g,
      greek: /[Ͱ-Ͽ]/g,
    } as const;
    const full = textOf(ctx.doc);
    const latin = (full.match(/[A-Za-z]/g) ?? []).length;
    const out: Issue[] = [];
    for (const [name, rx] of Object.entries(scripts)) {
      const hits = (full.match(rx) ?? []).length;
      if (hits < 40) continue;
      const dominant = hits > latin;
      // Only flag a minority script: a page written entirely in it is fine.
      if (dominant || hits > latin * 0.6) continue;
      // A stray name or citation is not a passage. Require a run long enough to
      // be read aloud as one, so single foreign words stay quiet.
      const runs = full.match(new RegExp(`(?:${rx.source}|\\s|[\\p{P}]){8,}`, 'gu')) ?? [];
      const passages = runs.filter((r) => (r.match(rx) ?? []).length >= 8).length;
      if (passages === 0) continue;
      out.push({ ruleId: 'mixed-language', severity: 'moderate', confidence: 'review', path: [], location: 'Page', data: { script: name, characters: hits, passages } });
    }
    return out;
  },
};



/**
 * Two headings with identical text give a screen-reader user two identical
 * entries in the heading list, with nothing to choose between them.
 */
export const headingDuplicateText: Rule = {
  id: 'heading-duplicate-text',
  title: 'Two headings have the same text',
  why: 'Screen-reader users navigate by jumping between headings; identical headings are impossible to tell apart in that list.',
  howToFix: 'Make each heading say what distinguishes its section — “Setup on Windows” and “Setup on macOS” rather than “Setup” twice.',
  wcag: [{ criterion: '2.4.6', name: 'Headings and Labels', level: 'AA' }],
  severity: 'advisory',
  confidence: 'certain',
  run(ctx): Issue[] {
    const seen = new Set<string>();
    const out: Issue[] = [];
    // Scoped to the enclosing section: repeating "Steps" under three different
    // top-level headings is a normal documentation shape, while repeating it
    // twice inside one section is the ambiguity this rule is about.
    const ancestors: Array<{ level: number; text: string }> = [];
    for (const { node, path } of findAll(ctx.doc, 'heading')) {
      const level = Number(node.attrs?.['level'] ?? 1);
      const text = trimmedText(node);
      while (ancestors.length && ancestors[ancestors.length - 1]!.level >= level) ancestors.pop();
      if (!text) { ancestors.push({ level, text }); continue; }
      const key = `${ancestors.map((a) => a.text).join('>')}|${text.toLowerCase()}`;
      if (seen.has(key)) {
        out.push({
          ruleId: 'heading-duplicate-text',
          severity: 'advisory',
          confidence: 'certain',
          path,
          location: 'Heading',
          evidence: truncate(text, 60),
        });
      } else {
        seen.add(key);
      }
      ancestors.push({ level, text });
    }
    return out;
  },
};

/**
 * A status lozenge carries meaning through its colour. When its text is empty or
 * a bare symbol, the colour is the only cue there is.
 */
export const statusColourOnly: Rule = {
  id: 'status-colour-only',
  title: 'Status lozenge has no readable text',
  why: 'A lozenge is announced by its text; with none, its colour is the only thing carrying the meaning and a screen reader conveys nothing.',
  howToFix: 'Give the lozenge a word — “Done”, “Blocked”, “At risk” — so the meaning survives without the colour.',
  wcag: [
    { criterion: '1.4.1', name: 'Use of Color', level: 'A' },
    { criterion: '1.1.1', name: 'Non-text Content', level: 'A' },
  ],
  severity: 'serious',
  confidence: 'certain',
  run(ctx): Issue[] {
    const out: Issue[] = [];
    for (const { node, path } of findAll(ctx.doc, 'status')) {
      const text = String(node.attrs?.['text'] ?? '').trim();
      if (text && /[\p{L}\p{N}]/u.test(text)) continue;
      out.push({
        ruleId: 'status-colour-only',
        severity: 'serious',
        confidence: 'certain',
        path,
        location: 'Status lozenge',
        data: { colour: node.attrs?.['color'] ?? null },
      });
    }
    return out;
  },
};

export const contentRules: Rule[] = [
  pageTitleNondescriptive, pageTitleDuplicate, expandNoTitle, embedNoLabel,
  allCapsRun, justifiedText, emptyHardBreakSpacing, longParagraph, mixedLanguage,
  headingDuplicateText, statusColourOnly,
];
