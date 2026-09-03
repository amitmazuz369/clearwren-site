/** Atlassian Document Format node (structural subset we care about). */
export interface AdfNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: AdfNode[];
  marks?: AdfMark[];
  text?: string;
}

export interface AdfMark {
  type: string;
  attrs?: Record<string, unknown>;
}

/** WCAG conformance level of the success criterion a rule maps to. */
export type WcagLevel = 'A' | 'AA' | 'AAA';

/**
 * How much the issue blocks a user. `critical` and `serious` fail the audit,
 * `moderate` degrades the score, `advisory` is best-practice only and never
 * fails a conformance claim.
 */
export type Severity = 'critical' | 'serious' | 'moderate' | 'advisory';

/** Whether the finding is machine-decidable or needs a human to confirm. */
export type Confidence = 'certain' | 'review';

export interface WcagRef {
  /** e.g. "1.1.1" */
  criterion: string;
  /** e.g. "Non-text Content" */
  name: string;
  level: WcagLevel;
}

export interface RuleMeta {
  id: string;
  title: string;
  /** One sentence a non-expert can act on. */
  why: string;
  howToFix: string;
  wcag: WcagRef[];
  severity: Severity;
  confidence: Confidence;
  /** Section 508 / EN 301 549 clause references, for the conformance report. */
  section508?: string[];
}

export interface Issue {
  ruleId: string;
  severity: Severity;
  confidence: Confidence;
  /** Index path from the document root, e.g. [3, 0, 1]. */
  path: number[];
  /** Short human-readable pointer, e.g. 'Heading "Setup steps"'. */
  location: string;
  /** The offending content, trimmed for display. */
  evidence?: string;
  /** Rule-specific detail, e.g. measured contrast ratio. */
  data?: Record<string, unknown>;
}

export interface PageMeta {
  id?: string;
  title?: string;
  spaceKey?: string;
  /** Titles of other pages in the same space, for duplicate-title detection. */
  siblingTitles?: string[];
}

export interface RuleContext {
  doc: AdfNode;
  meta: PageMeta;
  /** Media ids the space admin marked as decorative (legitimately alt-free). */
  decorativeMediaIds: Set<string>;
  /** Rule ids the admin switched off for this space. */
  disabledRules: Set<string>;
}

export interface Rule extends RuleMeta {
  run(ctx: RuleContext): Issue[];
}

export interface RuleResult extends RuleMeta {
  issues: Issue[];
}

export interface AuditResult {
  /** 0-100. 100 means no issues weighted above advisory. */
  score: number;
  /** true when no critical/serious issue of level A or AA remains. */
  conformant: boolean;
  counts: Record<Severity, number>;
  issues: Issue[];
  /** Per-criterion roll-up used by the conformance report. */
  criteria: CriterionResult[];
  rules: RuleResult[];
  stats: { nodes: number; words: number; images: number; tables: number; links: number };
  engineVersion: string;
}

export interface CriterionResult {
  criterion: string;
  name: string;
  level: WcagLevel;
  status: 'pass' | 'fail' | 'review' | 'not-applicable';
  issueCount: number;
}
