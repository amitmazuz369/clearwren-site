import { storage, startsWith } from '@forge/api';

/**
 * Forge storage is a flat key-value store, so keys carry the hierarchy:
 *   cfg:global                  settings for the whole site
 *   cfg:space:<key>             per-space overrides
 *   p:<spaceKey>:<pageId>       one page summary
 *   i:<pageId>                  that page's issue list (capped)
 *   space:<spaceKey>            rolled-up space result
 *   scan:<spaceKey>             in-flight scan progress
 *   sites                       list of scanned space keys
 */

export const DEFAULT_SETTINGS = {
  targetLevel: 'AA',
  disabledRules: [],
  decorativeMediaIds: [],
};

const MAX_STORED_ISSUES = 300;

export async function getSettings(spaceKey) {
  const global = (await storage.get('cfg:global')) ?? {};
  const space = spaceKey ? (await storage.get(`cfg:space:${spaceKey}`)) ?? {} : {};
  return { ...DEFAULT_SETTINGS, ...global, ...space };
}

export async function saveSettings(settings, spaceKey) {
  const key = spaceKey ? `cfg:space:${spaceKey}` : 'cfg:global';
  const current = (await storage.get(key)) ?? {};
  const next = { ...current, ...settings };
  await storage.set(key, next);
  return next;
}

export async function savePageResult(spaceKey, page, result) {
  const ruleCounts = {};
  for (const issue of result.issues) {
    ruleCounts[issue.ruleId] = (ruleCounts[issue.ruleId] ?? 0) + 1;
  }
  const summary = {
    pageId: String(page.id),
    title: page.title ?? '',
    spaceKey,
    score: result.score,
    conformant: result.conformant,
    counts: result.counts,
    ruleCounts,
    stats: result.stats,
    scannedAt: new Date().toISOString(),
    engineVersion: result.engineVersion,
  };
  await storage.set(`p:${spaceKey}:${page.id}`, summary);
  await storage.set(`i:${page.id}`, {
    pageId: String(page.id),
    scannedAt: summary.scannedAt,
    issues: result.issues.slice(0, MAX_STORED_ISSUES),
    truncated: result.issues.length > MAX_STORED_ISSUES,
    criteria: result.criteria,
  });
  return summary;
}

export async function getPageResult(pageId, spaceKey) {
  const [summary, detail] = await Promise.all([
    spaceKey ? storage.get(`p:${spaceKey}:${pageId}`) : null,
    storage.get(`i:${pageId}`),
  ]);
  return { summary: summary ?? null, detail: detail ?? null };
}

export async function listPageSummaries(spaceKey, limit = 500) {
  const out = [];
  let cursor;
  do {
    const query = storage.query().where('key', startsWith(`p:${spaceKey}:`)).limit(20);
    const res = await (cursor ? query.cursor(cursor).getMany() : query.getMany());
    for (const item of res.results) out.push(item.value);
    cursor = res.nextCursor;
  } while (cursor && out.length < limit);
  return out;
}

export async function saveSpaceReport(spaceKey, report) {
  await storage.set(`space:${spaceKey}`, report);
  const index = (await storage.get('sites')) ?? { spaces: [] };
  if (!index.spaces.includes(spaceKey)) {
    index.spaces = [...index.spaces, spaceKey].slice(0, 500);
    await storage.set('sites', index);
  }
}

export async function getSpaceReport(spaceKey) {
  return (await storage.get(`space:${spaceKey}`)) ?? null;
}

export async function listScannedSpaces() {
  const index = (await storage.get('sites')) ?? { spaces: [] };
  return index.spaces;
}

export async function setScanProgress(spaceKey, progress) {
  if (progress === null) await storage.delete(`scan:${spaceKey}`);
  else await storage.set(`scan:${spaceKey}`, progress);
}

export async function getScanProgress(spaceKey) {
  return (await storage.get(`scan:${spaceKey}`)) ?? null;
}
