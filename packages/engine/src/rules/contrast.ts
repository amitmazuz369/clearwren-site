import type { Rule, Issue, AdfNode } from '../types.js';
import { truncate, mark } from '../adf.js';
import {
  parseColor, contrastRatio, requiredRatio, isLargeText,
  CONFLUENCE_DEFAULT_TEXT, CONFLUENCE_DEFAULT_BACKGROUND, PANEL_BACKGROUNDS, HEADING_PX, BODY_PX,
} from '../color.js';

const CONTRAST_MIN: { criterion: string; name: string; level: 'AA' } = {
  criterion: '1.4.3', name: 'Contrast (Minimum)', level: 'AA',
};

interface Ctx { bg: string; fontPx: number; bold: boolean }

/** Background Confluence paints behind this node, if it sets one. */
function nodeBackground(node: AdfNode): string | null {
  if (node.type === 'panel') {
    const t = String(node.attrs?.['panelType'] ?? 'info');
    if (t === 'custom') {
      const c = node.attrs?.['panelColor'];
      return typeof c === 'string' ? c : null;
    }
    return PANEL_BACKGROUNDS[t] ?? null;
  }
  if (node.type === 'tableCell' || node.type === 'tableHeader') {
    const c = node.attrs?.['background'];
    return typeof c === 'string' ? c : null;
  }
  return null;
}

/**
 * Walks the document carrying the inherited background colour and font size so
 * each text run can be measured against what is actually behind it.
 */
function collectTextRuns(node: AdfNode, ctx: Ctx, path: number[], out: Array<{ node: AdfNode; path: number[]; ctx: Ctx }>): void {
  let next: Ctx = ctx;
  const bg = nodeBackground(node);
  if (bg) next = { ...next, bg };
  if (node.type === 'heading') {
    const level = Number(node.attrs?.['level'] ?? 1);
    next = { ...next, fontPx: HEADING_PX[level] ?? BODY_PX, bold: true };
  }
  if (node.type === 'text') {
    out.push({ node, path, ctx: next });
    return;
  }
  const kids = node.content ?? [];
  for (let i = 0; i < kids.length; i++) {
    const child = kids[i];
    if (child) collectTextRuns(child, next, [...path, i], out);
  }
}

function evaluate(level: 'AA' | 'AAA', doc: AdfNode) {
  const runs: Array<{ node: AdfNode; path: number[]; ctx: Ctx }> = [];
  collectTextRuns(doc, { bg: CONFLUENCE_DEFAULT_BACKGROUND, fontPx: BODY_PX, bold: false }, [], runs);
  const findings: Array<{ path: number[]; text: string; ratio: number; required: number; fg: string; bg: string; large: boolean }> = [];
  for (const run of runs) {
    const text = (run.node.text ?? '').trim();
    if (!text) continue;
    const fgMark = mark(run.node, 'textColor')?.attrs?.['color'];
    const bgMark = mark(run.node, 'backgroundColor')?.attrs?.['color'];
    // Nothing to check when the author left both colours at the Confluence default.
    if (!fgMark && !bgMark) continue;
    const fgHex = typeof fgMark === 'string' ? fgMark : CONFLUENCE_DEFAULT_TEXT;
    const bgHex = typeof bgMark === 'string' ? bgMark : run.ctx.bg;
    const fg = parseColor(fgHex);
    const bg = parseColor(bgHex);
    if (!fg || !bg) continue;
    const bold = run.ctx.bold || (run.node.marks ?? []).some((m) => m.type === 'strong');
    const large = isLargeText(run.ctx.fontPx, bold);
    const ratio = contrastRatio(fg, bg);
    const required = requiredRatio(level, large);
    if (ratio < required) {
      findings.push({ path: run.path, text, ratio, required, fg: fgHex, bg: bgHex, large });
    }
  }
  return findings;
}

export const contrastMinimum: Rule = {
  id: 'contrast-minimum',
  title: 'Text contrast is below the WCAG AA minimum',
  why: 'Low-contrast text is unreadable for many people with low vision, and for anyone on a dim screen or in sunlight.',
  howToFix: 'Pick a darker text colour or a lighter background until the pair reaches 4.5:1 (3:1 for large headings).',
  wcag: [CONTRAST_MIN],
  section508: ['502.3.1'],
  severity: 'critical',
  confidence: 'certain',
  run(ctx): Issue[] {
    return evaluate('AA', ctx.doc).map((f) => ({
      ruleId: 'contrast-minimum',
      severity: 'critical' as const,
      confidence: 'certain' as const,
      path: f.path,
      location: 'Coloured text',
      evidence: truncate(f.text, 60),
      data: { ratio: f.ratio, required: f.required, foreground: f.fg, background: f.bg, largeText: f.large },
    }));
  },
};

/**
 * Sentences that point at content purely by its colour ("the items in red")
 * leave colour-blind readers with no way to identify what is meant.
 */
export const colourOnlyMeaning: Rule = {
  id: 'colour-only-meaning',
  title: 'Instructions rely on colour alone',
  why: 'A reader who cannot distinguish the colour, or who is using a screen reader, has no way to tell which items you mean.',
  howToFix: 'Add a second cue alongside the colour — a label, an icon, or bold text — and refer to that instead.',
  wcag: [{ criterion: '1.4.1', name: 'Use of Color', level: 'A' }],
  severity: 'moderate',
  confidence: 'review',
  run(ctx): Issue[] {
    const out: Issue[] = [];
    const rx = /\b(in|the|marked|highlighted|shown|coloured|colored)\s+(red|green|blue|yellow|orange|purple|grey|gray)\b|\b(red|green|blue|yellow|orange|purple)\s+(items?|rows?|cells?|entries|text|ones|boxes)\b/i;
    const runs: Array<{ node: AdfNode; path: number[]; ctx: Ctx }> = [];
    collectTextRuns(ctx.doc, { bg: CONFLUENCE_DEFAULT_BACKGROUND, fontPx: BODY_PX, bold: false }, [], runs);
    for (const r of runs) {
      const t = r.node.text ?? '';
      if (rx.test(t)) {
        out.push({ ruleId: 'colour-only-meaning', severity: 'moderate', confidence: 'review', path: r.path, location: 'Text', evidence: truncate(t, 70) });
      }
    }
    return out;
  },
};

export const contrastRules: Rule[] = [contrastMinimum, colourOnlyMeaning];
