import type { Rule, Issue, AdfNode } from '../types.js';
import { findAll, trimmedText, truncate, textOf } from '../adf.js';

const INFO_REL: { criterion: string; name: string; level: 'A' } = {
  criterion: '1.3.1', name: 'Info and Relationships', level: 'A',
};
const HEADINGS_LABELS: { criterion: string; name: string; level: 'AA' } = {
  criterion: '2.4.6', name: 'Headings and Labels', level: 'AA',
};

function headings(doc: AdfNode) {
  return findAll(doc, 'heading').map(({ node, path }) => ({
    node,
    path,
    level: Number(node.attrs?.['level'] ?? 1),
    text: trimmedText(node),
  }));
}

export const headingSkippedLevel: Rule = {
  id: 'heading-skipped-level',
  title: 'Heading level is skipped',
  why: 'Screen-reader users navigate by heading level; a jump from H2 straight to H4 makes the page look like it has missing sections.',
  howToFix: 'Step heading levels down one at a time — an H2 section contains H3 subsections, not H4.',
  wcag: [INFO_REL],
  section508: ['502.3.1'],
  severity: 'serious',
  confidence: 'certain',
  run(ctx): Issue[] {
    const out: Issue[] = [];
    let prev = 0;
    for (const h of headings(ctx.doc)) {
      if (prev !== 0 && h.level > prev + 1) {
        out.push({
          ruleId: 'heading-skipped-level',
          severity: 'serious',
          confidence: 'certain',
          path: h.path,
          location: `Heading H${h.level}`,
          evidence: truncate(h.text, 70),
          data: { level: h.level, previousLevel: prev },
        });
      }
      prev = h.level;
    }
    return out;
  },
};

export const headingEmpty: Rule = {
  id: 'heading-empty',
  title: 'Heading has no text',
  why: 'An empty heading is announced as a heading with nothing in it, which breaks navigation by headings.',
  howToFix: 'Give the heading text, or convert the empty line back to a normal paragraph.',
  wcag: [INFO_REL, HEADINGS_LABELS],
  severity: 'serious',
  confidence: 'certain',
  run(ctx): Issue[] {
    return headings(ctx.doc)
      .filter((h) => !h.text)
      .map((h) => ({
        ruleId: 'heading-empty',
        severity: 'serious' as const,
        confidence: 'certain' as const,
        path: h.path,
        location: `Heading H${h.level}`,
      }));
  },
};

export const headingH1InBody: Rule = {
  id: 'heading-h1-in-body',
  title: 'H1 used inside the page body',
  why: 'Confluence already renders the page title as the only H1, so a second H1 in the body gives the page two competing titles.',
  howToFix: 'Demote body headings to start at H2.',
  wcag: [INFO_REL],
  severity: 'moderate',
  confidence: 'certain',
  run(ctx): Issue[] {
    return headings(ctx.doc)
      .filter((h) => h.level === 1)
      .map((h) => ({
        ruleId: 'heading-h1-in-body',
        severity: 'moderate' as const,
        confidence: 'certain' as const,
        path: h.path,
        location: 'Heading H1',
        evidence: truncate(h.text, 70),
      }));
  },
};

export const headingTooLong: Rule = {
  id: 'heading-too-long',
  title: 'Heading reads as a paragraph',
  why: 'Long headings are hard to scan in a screen reader’s heading list, which is how many users find their way around a page.',
  howToFix: 'Shorten the heading to a label and move the explanation into the text below it.',
  wcag: [HEADINGS_LABELS],
  severity: 'advisory',
  confidence: 'certain',
  run(ctx): Issue[] {
    return headings(ctx.doc)
      .filter((h) => h.text.length > 120)
      .map((h) => ({
        ruleId: 'heading-too-long',
        severity: 'advisory' as const,
        confidence: 'certain' as const,
        path: h.path,
        location: `Heading H${h.level}`,
        evidence: truncate(h.text, 70),
        data: { length: h.text.length },
      }));
  },
};

/**
 * A short paragraph whose text is entirely bold (or entirely a larger coloured
 * run) and which is followed by body content is almost always a heading the
 * author styled by hand.
 */
export const fakeHeading: Rule = {
  id: 'fake-heading',
  title: 'Bold text used instead of a heading',
  why: 'Bold text looks like a heading but is not one, so it never appears in the heading list a screen-reader user navigates by.',
  howToFix: 'Select the line and apply a real heading level from the text-style menu.',
  wcag: [INFO_REL],
  section508: ['502.3.1'],
  severity: 'serious',
  confidence: 'review',
  run(ctx): Issue[] {
    const out: Issue[] = [];
    const top = ctx.doc.content ?? [];
    for (let i = 0; i < top.length; i++) {
      const node = top[i];
      if (!node || node.type !== 'paragraph') continue;
      const kids = (node.content ?? []).filter((c) => c.type !== 'hardBreak');
      if (kids.length === 0) continue;
      const allBold = kids.every(
        (c) => c.type === 'text' && (c.marks ?? []).some((m) => m.type === 'strong' || m.type === 'underline'),
      );
      if (!allBold) continue;
      const text = trimmedText(node);
      if (!text || text.length > 80) continue;
      if (/[.!?]\s*$/.test(text)) continue; // a bolded sentence is not a heading
      const next = top[i + 1];
      if (!next || next.type === 'heading') continue;
      out.push({
        ruleId: 'fake-heading',
        severity: 'serious',
        confidence: 'review',
        path: [i],
        location: 'Paragraph',
        evidence: truncate(text, 70),
      });
    }
    return out;
  },
};

/** Consecutive paragraphs that start with a bullet or number character. */
export const fakeList: Rule = {
  id: 'fake-list',
  title: 'Dashes or numbers used instead of a list',
  why: 'A hand-typed list is read as loose sentences, so a screen-reader user never hears how many items there are or where the list ends.',
  howToFix: 'Select the lines and apply a bulleted or numbered list.',
  wcag: [INFO_REL],
  severity: 'moderate',
  confidence: 'review',
  run(ctx): Issue[] {
    const out: Issue[] = [];
    const top = ctx.doc.content ?? [];
    const marker = /^\s*([-*•‣▪·]|\(?\d{1,2}[.)])\s+\S/;
    let runStart = -1;
    let runLen = 0;
    const flush = (endIdx: number) => {
      if (runLen >= 2 && runStart >= 0) {
        const first = top[runStart];
        out.push({
          ruleId: 'fake-list',
          severity: 'moderate',
          confidence: 'review',
          path: [runStart],
          location: 'Paragraphs',
          evidence: first ? truncate(trimmedText(first), 70) : undefined,
          data: { items: runLen, endIndex: endIdx },
        });
      }
      runStart = -1;
      runLen = 0;
    };
    for (let i = 0; i < top.length; i++) {
      const node = top[i];
      const isMarked = node?.type === 'paragraph' && marker.test(textOf(node));
      if (isMarked) {
        if (runStart < 0) runStart = i;
        runLen++;
      } else {
        flush(i - 1);
      }
    }
    flush(top.length - 1);
    return out;
  },
};

export const headingRules: Rule[] = [
  headingSkippedLevel, headingEmpty, headingH1InBody, headingTooLong, fakeHeading, fakeList,
];
