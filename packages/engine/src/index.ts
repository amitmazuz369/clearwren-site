import type {
  AdfNode, AuditResult, CriterionResult, Issue, PageMeta, Rule, RuleContext, RuleResult, Severity, WcagLevel,
} from './types.js';
import { findAll, wordCount, walk } from './adf.js';
import { imageRules } from './rules/images.js';
import { headingRules } from './rules/headings.js';
import { linkRules, collectLinks } from './rules/links.js';
import { tableRules } from './rules/tables.js';
import { contrastRules } from './rules/contrast.js';
import { contentRules } from './rules/content.js';

export * from './types.js';
export { parseColor, contrastRatio, luminance } from './color.js';

export const ENGINE_VERSION = '1.0.0';

export const ALL_RULES: Rule[] = [
  ...imageRules, ...headingRules, ...linkRules, ...tableRules, ...contrastRules, ...contentRules,
];

export const RULES_BY_ID: Record<string, Rule> = Object.fromEntries(ALL_RULES.map((r) => [r.id, r]));

/** How much each severity costs against the 0-100 page score. */
export const SEVERITY_WEIGHT: Record<Severity, number> = {
  critical: 15,
  serious: 8,
  moderate: 3,
  advisory: 1,
};

export interface AuditOptions {
  meta?: PageMeta;
  /** Media ids an editor has confirmed are decorative. */
  decorativeMediaIds?: Iterable<string>;
  /** Rule ids switched off for this space or site. */
  disabledRules?: Iterable<string>;
  /** Highest conformance level to report against. Defaults to AA. */
  targetLevel?: WcagLevel;
}

interface ContentFlags {
  images: boolean; tables: boolean; links: boolean; headings: boolean;
  colour: boolean; media: boolean; embeds: boolean; expands: boolean; text: boolean;
}

function contentFlags(doc: AdfNode): ContentFlags {
  let colour = false;
  for (const { node } of walk(doc)) {
    if ((node.marks ?? []).some((m) => m.type === 'textColor' || m.type === 'backgroundColor')) { colour = true; break; }
  }
  return {
    images: findAll(doc, (n) => n.type === 'media' || n.type === 'mediaInline').length > 0,
    tables: findAll(doc, 'table').length > 0,
    links: collectLinks(doc).length > 0,
    headings: findAll(doc, 'heading').length > 0,
    colour,
    media: findAll(doc, 'media').length > 0,
    embeds: findAll(doc, (n) => n.type === 'embedCard' || n.type === 'blockCard').length > 0,
    expands: findAll(doc, (n) => n.type === 'expand' || n.type === 'nestedExpand').length > 0,
    text: wordCount(doc) > 0,
  };
}

/** Which content has to be present for a criterion to be in scope at all. */
const CRITERION_APPLIES: Record<string, (f: ContentFlags) => boolean> = {
  '1.1.1': (f) => f.images || f.media,
  '1.2.1': (f) => f.media || f.embeds,
  '1.2.2': (f) => f.media || f.embeds,
  '1.3.1': (f) => f.text,
  '1.4.1': (f) => f.text,
  '1.4.3': (f) => f.colour,
  '1.4.8': (f) => f.text,
  '2.4.1': (f) => f.embeds,
  '2.4.2': () => true,
  '2.4.4': (f) => f.links,
  '2.4.6': (f) => f.headings || f.expands,
  '2.4.9': (f) => f.links,
  '3.1.2': (f) => f.text,
  '3.1.5': (f) => f.text,
  '4.1.2': (f) => f.embeds || f.expands || f.links,
};

const LEVEL_ORDER: Record<WcagLevel, number> = { A: 1, AA: 2, AAA: 3 };

export function audit(doc: AdfNode, options: AuditOptions = {}): AuditResult {
  const targetLevel = options.targetLevel ?? 'AA';
  const ctx: RuleContext = {
    doc,
    meta: options.meta ?? {},
    decorativeMediaIds: new Set(options.decorativeMediaIds ?? []),
    disabledRules: new Set(options.disabledRules ?? []),
  };

  const rules: RuleResult[] = [];
  const issues: Issue[] = [];
  for (const rule of ALL_RULES) {
    if (ctx.disabledRules.has(rule.id)) continue;
    // Skip rules that only exist to report criteria above the target level.
    if (rule.wcag.every((w) => LEVEL_ORDER[w.level] > LEVEL_ORDER[targetLevel]) && rule.severity !== 'advisory') continue;
    let found: Issue[] = [];
    try {
      found = rule.run(ctx);
    } catch {
      // A malformed document must never take the whole audit down.
      found = [];
    }
    rules.push({ ...rule, issues: found });
    issues.push(...found);
  }

  const counts: Record<Severity, number> = { critical: 0, serious: 0, moderate: 0, advisory: 0 };
  let penalty = 0;
  for (const i of issues) {
    counts[i.severity]++;
    penalty += SEVERITY_WEIGHT[i.severity];
  }
  const score = Math.max(0, Math.min(100, Math.round(100 - penalty)));

  const blocking = issues.filter((i) => {
    if (i.confidence !== 'certain') return false;
    if (i.severity !== 'critical' && i.severity !== 'serious') return false;
    const rule = RULES_BY_ID[i.ruleId];
    return Boolean(rule?.wcag.some((w) => LEVEL_ORDER[w.level] <= LEVEL_ORDER[targetLevel]));
  });

  const flags = contentFlags(doc);
  const criteria = rollUpCriteria(rules, flags, targetLevel);

  return {
    score,
    conformant: blocking.length === 0,
    counts,
    issues,
    criteria,
    rules,
    stats: {
      nodes: [...walk(doc)].length,
      words: wordCount(doc),
      images: findAll(doc, (n) => n.type === 'media' || n.type === 'mediaInline').length,
      tables: findAll(doc, 'table').length,
      links: collectLinks(doc).length,
    },
    engineVersion: ENGINE_VERSION,
  };
}

function rollUpCriteria(rules: RuleResult[], flags: ContentFlags, targetLevel: WcagLevel): CriterionResult[] {
  const map = new Map<string, CriterionResult>();
  for (const rule of rules) {
    for (const w of rule.wcag) {
      if (LEVEL_ORDER[w.level] > LEVEL_ORDER[targetLevel]) continue;
      const applies = CRITERION_APPLIES[w.criterion]?.(flags) ?? true;
      const existing = map.get(w.criterion) ?? {
        criterion: w.criterion,
        name: w.name,
        level: w.level,
        status: applies ? ('pass' as const) : ('not-applicable' as const),
        issueCount: 0,
      };
      if (rule.issues.length && applies) {
        existing.issueCount += rule.issues.length;
        const certain = rule.issues.some((i) => i.confidence === 'certain');
        if (certain) existing.status = 'fail';
        else if (existing.status !== 'fail') existing.status = 'review';
      }
      map.set(w.criterion, existing);
    }
  }
  return [...map.values()].sort((a, b) => compareCriteria(a.criterion, b.criterion));
}

function compareCriteria(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d) return d;
  }
  return 0;
}

/** Aggregate page audits into the numbers a space or site dashboard shows. */
export interface RollUp {
  pages: number;
  conformantPages: number;
  averageScore: number;
  counts: Record<Severity, number>;
  byRule: Array<{ ruleId: string; title: string; severity: Severity; pages: number; issues: number }>;
}

export function rollUp(results: Array<{ pageId: string; result: Pick<AuditResult, 'score' | 'conformant' | 'issues'> }>): RollUp {
  const counts: Record<Severity, number> = { critical: 0, serious: 0, moderate: 0, advisory: 0 };
  const byRule = new Map<string, { ruleId: string; title: string; severity: Severity; pages: number; issues: number }>();
  let scoreSum = 0;
  let conformant = 0;
  for (const { result } of results) {
    scoreSum += result.score;
    if (result.conformant) conformant++;
    const seenHere = new Set<string>();
    for (const i of result.issues) {
      counts[i.severity]++;
      const rule = RULES_BY_ID[i.ruleId];
      const entry = byRule.get(i.ruleId) ?? {
        ruleId: i.ruleId,
        title: rule?.title ?? i.ruleId,
        severity: i.severity,
        pages: 0,
        issues: 0,
      };
      entry.issues++;
      if (!seenHere.has(i.ruleId)) { entry.pages++; seenHere.add(i.ruleId); }
      byRule.set(i.ruleId, entry);
    }
  }
  const order: Severity[] = ['critical', 'serious', 'moderate', 'advisory'];
  return {
    pages: results.length,
    conformantPages: conformant,
    averageScore: results.length ? Math.round(scoreSum / results.length) : 100,
    counts,
    byRule: [...byRule.values()].sort(
      (a, b) => order.indexOf(a.severity) - order.indexOf(b.severity) || b.issues - a.issues,
    ),
  };
}
