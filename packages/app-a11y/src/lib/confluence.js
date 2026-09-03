import api, { route } from '@forge/api';

const MAX_BODY_BYTES = 900_000;

async function getJson(url) {
  const res = await api.asApp().requestConfluence(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Confluence ${res.status} for ${url}: ${body.slice(0, 300)}`);
  }
  return res.json();
}

/** Parse an ADF body that the v2 API returns as a JSON string. */
export function parseAdf(page) {
  const raw = page?.body?.atlas_doc_format?.value;
  if (!raw) return null;
  if (typeof raw === 'object') return raw;
  if (raw.length > MAX_BODY_BYTES) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function getPage(pageId) {
  return getJson(route`/wiki/api/v2/pages/${pageId}?body-format=atlas_doc_format`);
}

export async function getSpaceByKey(spaceKey) {
  const data = await getJson(route`/wiki/api/v2/spaces?keys=${spaceKey}&limit=1`);
  return data?.results?.[0] ?? null;
}

export async function listSpaces(cursor) {
  const url = cursor
    ? route`/wiki/api/v2/spaces?limit=100&cursor=${cursor}`
    : route`/wiki/api/v2/spaces?limit=100`;
  const data = await getJson(url);
  return { spaces: data?.results ?? [], next: nextCursor(data) };
}

/**
 * One page of pages, bodies included. Confluence caps `limit` at 250 but bodies
 * make the response large, so we ask for fewer and let the queue iterate.
 */
export async function listSpacePages(spaceId, cursor, limit = 25) {
  const base = `/wiki/api/v2/spaces/${spaceId}/pages?limit=${limit}&body-format=atlas_doc_format&status=current`;
  const url = cursor ? route([`${base}&cursor=${cursor}`]) : route([base]);
  const data = await getJson(url);
  return { pages: data?.results ?? [], next: nextCursor(data) };
}

function nextCursor(data) {
  const link = data?._links?.next;
  if (!link) return null;
  const match = /[?&]cursor=([^&]+)/.exec(link);
  return match ? decodeURIComponent(match[1]) : null;
}

/** Write a modified ADF body back, bumping the version as Confluence requires. */
export async function updatePageAdf(page, adf, message = 'Accessibility fix applied by Clearwren') {
  const body = {
    id: page.id,
    status: 'current',
    title: page.title,
    spaceId: page.spaceId,
    body: { representation: 'atlas_doc_format', value: JSON.stringify(adf) },
    version: { number: (page.version?.number ?? 1) + 1, message },
  };
  const res = await api.asUser().requestConfluence(route`/wiki/api/v2/pages/${page.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Update failed ${res.status}: ${text.slice(0, 300)}`);
  }
  return res.json();
}

export function pageUrl(page, siteUrl) {
  const path = page?._links?.webui ?? '';
  return path ? `${siteUrl ?? ''}/wiki${path}` : null;
}
