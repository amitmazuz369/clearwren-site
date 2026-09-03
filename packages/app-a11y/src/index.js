import Resolver from '@forge/resolver';
import { Queue } from '@forge/events';
import { audit, rollUp, ALL_RULES, RULES_BY_ID } from '@clearwren/a11y-engine';
import {
  getPage, getSpaceByKey, listSpaces, listSpacePages, parseAdf, updatePageAdf,
} from './lib/confluence.js';
import {
  getSettings, saveSettings, savePageResult, getPageResult, listPageSummaries,
  saveSpaceReport, getSpaceReport, listScannedSpaces, setScanProgress, getScanProgress,
} from './lib/store.js';

const scanQueue = new Queue({ key: 'space-scan' });
const resolver = new Resolver();

/** Everything the UI needs to know about the caller's entitlement. */
function licenseState(context) {
  const license = context?.license;
  return {
    active: Boolean(license?.isActive),
    // Atlassian grants a free licence on sites of ten users or fewer, so an
    // inactive licence here means an unlicensed trial rather than a small site.
    type: license?.type ?? 'unknown',
    trialEndDate: license?.trialEndDate ?? null,
  };
}

async function auditPage(page, settings, siblingTitles) {
  const adf = parseAdf(page);
  if (!adf) return null;
  return audit(adf, {
    meta: { id: String(page.id), title: page.title, siblingTitles },
    decorativeMediaIds: settings.decorativeMediaIds,
    disabledRules: settings.disabledRules,
    targetLevel: settings.targetLevel,
  });
}

resolver.define('rules', () =>
  ALL_RULES.map(({ id, title, why, howToFix, wcag, severity, confidence, section508 }) => ({
    id, title, why, howToFix, wcag, severity, confidence, section508: section508 ?? [],
  })),
);

resolver.define('scanCurrentPage', async ({ context }) => {
  const pageId = context?.extension?.content?.id;
  const spaceKey = context?.extension?.space?.key;
  if (!pageId) throw new Error('No page in context');
  const settings = await getSettings(spaceKey);
  const page = await getPage(pageId);
  const result = await auditPage(page, settings);
  if (!result) {
    return { unsupported: true, license: licenseState(context) };
  }
  const summary = await savePageResult(spaceKey ?? 'unknown', page, result);
  return {
    summary,
    issues: result.issues,
    criteria: result.criteria,
    license: licenseState(context),
    title: page.title,
  };
});

resolver.define('getStoredPage', async ({ context, payload }) => {
  const pageId = payload?.pageId ?? context?.extension?.content?.id;
  const spaceKey = payload?.spaceKey ?? context?.extension?.space?.key;
  const stored = await getPageResult(pageId, spaceKey);
  return { ...stored, license: licenseState(context) };
});

resolver.define('startSpaceScan', async ({ context, payload }) => {
  const license = licenseState(context);
  if (!license.active) return { started: false, reason: 'unlicensed', license };
  const spaceKey = payload?.spaceKey ?? context?.extension?.space?.key;
  if (!spaceKey) throw new Error('No space in context');
  const space = await getSpaceByKey(spaceKey);
  if (!space) throw new Error(`Space ${spaceKey} not found`);
  const progress = {
    spaceKey,
    spaceId: String(space.id),
    startedAt: new Date().toISOString(),
    scanned: 0,
    cursor: null,
    done: false,
  };
  await setScanProgress(spaceKey, progress);
  await scanQueue.push({ spaceKey, spaceId: String(space.id), cursor: null });
  return { started: true, progress, license };
});

resolver.define('scanProgress', async ({ payload }) => getScanProgress(payload.spaceKey));

resolver.define('spaceReport', async ({ context, payload }) => {
  const spaceKey = payload?.spaceKey ?? context?.extension?.space?.key;
  const [report, progress] = await Promise.all([getSpaceReport(spaceKey), getScanProgress(spaceKey)]);
  return { spaceKey, report, progress, license: licenseState(context) };
});

resolver.define('spacePages', async ({ context, payload }) => {
  const spaceKey = payload?.spaceKey ?? context?.extension?.space?.key;
  const pages = await listPageSummaries(spaceKey);
  pages.sort((a, b) => a.score - b.score);
  return pages.slice(0, payload?.limit ?? 100);
});

resolver.define('siteReport', async ({ context }) => {
  const keys = await listScannedSpaces();
  const reports = [];
  for (const key of keys) {
    const report = await getSpaceReport(key);
    if (report) reports.push(report);
  }
  reports.sort((a, b) => a.averageScore - b.averageScore);
  const totals = reports.reduce(
    (acc, r) => {
      acc.pages += r.pages;
      acc.conformantPages += r.conformantPages;
      for (const k of Object.keys(acc.counts)) acc.counts[k] += r.counts?.[k] ?? 0;
      return acc;
    },
    { pages: 0, conformantPages: 0, counts: { critical: 0, serious: 0, moderate: 0, advisory: 0 } },
  );
  const averageScore = reports.length
    ? Math.round(reports.reduce((s, r) => s + r.averageScore * r.pages, 0) / Math.max(1, totals.pages))
    : 100;
  return { spaces: reports, totals: { ...totals, averageScore }, license: licenseState(context) };
});

resolver.define('getSettings', async ({ payload }) => getSettings(payload?.spaceKey));

resolver.define('saveSettings', async ({ payload }) => saveSettings(payload.settings, payload.spaceKey));

resolver.define('markDecorative', async ({ payload }) => {
  const settings = await getSettings();
  const ids = new Set(settings.decorativeMediaIds ?? []);
  ids.add(payload.mediaId);
  return saveSettings({ decorativeMediaIds: [...ids] });
});

/** Writes alt text straight into the page body at the audited node path. */
resolver.define('applyAltText', async ({ context, payload }) => {
  const pageId = payload.pageId ?? context?.extension?.content?.id;
  const page = await getPage(pageId);
  const adf = parseAdf(page);
  if (!adf) throw new Error('Page body could not be read');
  const node = nodeAtPath(adf, payload.path);
  if (!node || (node.type !== 'media' && node.type !== 'mediaInline')) {
    throw new Error('That image is no longer where it was when the page was scanned. Re-run the check.');
  }
  node.attrs = { ...(node.attrs ?? {}), alt: payload.alt };
  await updatePageAdf(page, adf, 'Alt text added with Clearwren Accessibility');
  return { ok: true };
});

function nodeAtPath(root, path) {
  let cur = root;
  for (const i of path ?? []) {
    cur = cur?.content?.[i];
    if (!cur) return null;
  }
  return cur;
}

/** Publishes the conformance report as a Confluence page, for audit evidence. */
resolver.define('publishReportPage', async ({ context, payload }) => {
  const license = licenseState(context);
  if (!license.active) return { ok: false, reason: 'unlicensed' };
  const spaceKey = payload.spaceKey ?? context?.extension?.space?.key;
  const report = await getSpaceReport(spaceKey);
  if (!report) return { ok: false, reason: 'no-report' };
  const space = await getSpaceByKey(spaceKey);
  const adf = buildReportAdf(report, payload.targetLevel ?? 'AA');
  const api = (await import('@forge/api')).default;
  const { route } = await import('@forge/api');
  const res = await api.asUser().requestConfluence(route`/wiki/api/v2/pages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      spaceId: space.id,
      status: 'current',
      title: `Accessibility conformance report — ${spaceKey} — ${new Date().toISOString().slice(0, 10)}`,
      body: { representation: 'atlas_doc_format', value: JSON.stringify(adf) },
    }),
  });
  if (!res.ok) return { ok: false, reason: `create-failed-${res.status}` };
  const created = await res.json();
  return { ok: true, pageId: created.id, url: created?._links?.webui ?? null };
});

function text(t) { return { type: 'text', text: String(t) }; }
function para(t) { return { type: 'paragraph', content: [text(t)] }; }
function heading(level, t) { return { type: 'heading', attrs: { level }, content: [text(t)] }; }
function cell(t, header) {
  return { type: header ? 'tableHeader' : 'tableCell', attrs: {}, content: [para(t)] };
}

function buildReportAdf(report, level) {
  const rows = [
    { type: 'tableRow', content: [cell('Check', true), cell('Pages affected', true), cell('Occurrences', true), cell('Severity', true), cell('WCAG', true)] },
    ...report.byRule.map((r) => {
      const rule = RULES_BY_ID[r.ruleId];
      const wcag = rule ? rule.wcag.map((w) => `${w.criterion} (${w.level})`).join(', ') : '';
      return { type: 'tableRow', content: [cell(r.title), cell(r.pages), cell(r.issues), cell(r.severity), cell(wcag)] };
    }),
  ];
  return {
    version: 1,
    type: 'doc',
    content: [
      { type: 'panel', attrs: { panelType: 'info' }, content: [para(`Generated by Clearwren Accessibility on ${new Date().toISOString().slice(0, 10)} against WCAG 2.2 level ${level}.`)] },
      heading(2, 'Summary'),
      para(`${report.pages} pages checked. ${report.conformantPages} pages had no level A or AA failure. Average page score ${report.averageScore} out of 100.`),
      para(`Critical: ${report.counts.critical} · Serious: ${report.counts.serious} · Moderate: ${report.counts.moderate} · Advisory: ${report.counts.advisory}`),
      heading(2, 'Findings by check'),
      { type: 'table', attrs: { isNumberColumnEnabled: false, layout: 'default' }, content: rows },
      heading(2, 'Method'),
      para('Each page body was parsed and evaluated against deterministic rules mapped to WCAG 2.2 success criteria. Automated checking cannot confirm every criterion; items marked for review need a person to confirm them.'),
    ],
  };
}

export const handler = resolver.getDefinitions();

/* ---------------------------------------------------------------------- */
/* Queue consumer: walks a space one batch of pages at a time.             */
/* ---------------------------------------------------------------------- */

const consumer = new Resolver();

consumer.define('scan-batch', async ({ payload }) => {
  const { spaceKey, spaceId, cursor } = payload;
  const settings = await getSettings(spaceKey);
  const { pages, next } = await listSpacePages(spaceId, cursor);
  const titles = pages.map((p) => p.title ?? '');
  let scanned = 0;
  for (const page of pages) {
    const result = await auditPage(page, settings, titles);
    if (!result) continue;
    await savePageResult(spaceKey, page, result);
    scanned++;
  }
  const progress = (await getScanProgress(spaceKey)) ?? { spaceKey, spaceId, scanned: 0 };
  progress.scanned = (progress.scanned ?? 0) + scanned;
  progress.cursor = next;
  progress.done = !next;
  progress.updatedAt = new Date().toISOString();
  await setScanProgress(spaceKey, progress);

  if (next) {
    await scanQueue.push({ spaceKey, spaceId, cursor: next });
    return { continued: true, scanned };
  }
  await finaliseSpaceReport(spaceKey);
  return { continued: false, scanned };
});

async function finaliseSpaceReport(spaceKey) {
  const summaries = await listPageSummaries(spaceKey);
  const asResults = summaries.map((s) => ({
    pageId: s.pageId,
    result: {
      score: s.score,
      conformant: s.conformant,
      issues: Object.entries(s.ruleCounts ?? {}).flatMap(([ruleId, n]) =>
        Array.from({ length: n }, () => ({
          ruleId,
          severity: RULES_BY_ID[ruleId]?.severity ?? 'moderate',
          confidence: RULES_BY_ID[ruleId]?.confidence ?? 'certain',
          path: [],
          location: '',
        })),
      ),
    },
  }));
  const report = rollUp(asResults);
  const worst = [...summaries].sort((a, b) => a.score - b.score).slice(0, 20)
    .map(({ pageId, title, score, counts }) => ({ pageId, title, score, counts }));
  await saveSpaceReport(spaceKey, {
    spaceKey,
    ...report,
    worstPages: worst,
    generatedAt: new Date().toISOString(),
  });
}

export const scanConsumer = consumer.getDefinitions();

/* ---------------------------------------------------------------------- */
/* Weekly re-scan of every space that has been scanned at least once.      */
/* ---------------------------------------------------------------------- */

export async function weeklyScan() {
  const keys = await listScannedSpaces();
  for (const spaceKey of keys) {
    try {
      const space = await getSpaceByKey(spaceKey);
      if (!space) continue;
      await setScanProgress(spaceKey, {
        spaceKey, spaceId: String(space.id), startedAt: new Date().toISOString(), scanned: 0, cursor: null, done: false,
      });
      await scanQueue.push({ spaceKey, spaceId: String(space.id), cursor: null });
    } catch (err) {
      console.error(`weekly rescan failed for ${spaceKey}`, err);
    }
  }
  return { queued: keys.length };
}

export { listSpaces };
