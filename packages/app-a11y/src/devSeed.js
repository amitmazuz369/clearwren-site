/**
 * Development-only web trigger. Seeds the seven fixture pages from
 * docs/test-pages.md into the demo site, audits each one, and reports which
 * expected findings appeared and which did not.
 *
 * This module is removed from the manifest before the production submission.
 */
import api, { route } from '@forge/api';
import { audit } from '@clearwren/a11y-engine';
import { getSpaceByKey, listSpaces, parseAdf } from './lib/confluence.js';

const text = (t, marks) => (marks ? { type: 'text', text: t, marks } : { type: 'text', text: t });
const para = (...content) => ({ type: 'paragraph', content });
const heading = (level, t) => ({ type: 'heading', attrs: { level }, content: [text(t)] });
const link = (t, href) => text(t, [{ type: 'link', attrs: { href } }]);
const coloured = (t, colour) => text(t, [{ type: 'textColor', attrs: { color: colour } }]);
const media = (attrs) => ({
  type: 'mediaSingle',
  attrs: { layout: 'center' },
  content: [{ type: 'media', attrs: { type: 'external', url: 'https://example.com/x.png', id: 'seed-1', ...attrs } }],
});
const cell = (t, header, attrs = {}) => ({
  type: header ? 'tableHeader' : 'tableCell',
  attrs,
  content: [para(text(t))],
});
const row = (...cells) => ({ type: 'tableRow', content: cells });
const table = (...rows) => ({ type: 'table', attrs: { layout: 'default' }, content: rows });
const doc = (...content) => ({ version: 1, type: 'doc', content });

/** Each fixture names the rules it is built to trip. */
const FIXTURES = [
  {
    title: 'Onboarding',
    expect: ['heading-h1-in-body', 'fake-heading', 'img-alt-missing', 'link-nondescriptive', 'table-no-header', 'fake-list', 'contrast-minimum'],
    body: doc(
      heading(1, 'Onboarding'),
      para(text('Before your first day', [{ type: 'strong' }])),
      para(text('Read the handbook and '), link('click here', 'https://example.com/it'), text(' to request a laptop.')),
      media({}),
      table(row(cell('Item'), cell('Owner')), row(cell('Laptop'), cell('IT'))),
      para(coloured('Contact the people team with questions.', '#A5ADBA')),
      para(text('- badge')),
      para(text('- parking pass')),
      para(text('- desk key')),
    ),
  },
  {
    title: 'Release notes 2026',
    // No nested-table case: ADF forbids it and Confluence strips it on save.
    expect: ['table-merged-cells', 'table-layout', 'table-empty-header', 'table-no-header'],
    body: doc(
      heading(2, 'Releases'),
      table(
        row(cell('Version', true, { colspan: 2 }), cell('', true)),
        row(cell('2.1'), cell('June'), cell('shipped')),
      ),
      table(row(cell('Notes'))),
      {
        type: 'table',
        attrs: { layout: 'default' },
        content: [row({
          type: 'tableCell',
          attrs: {},
          content: [table(row(cell('inner'), cell('cells')))],
        })],
      },
    ),
  },
  {
    title: 'Architecture',
    expect: ['heading-skipped-level', 'img-alt-meaningless', 'expand-no-title', 'img-alt-too-long'],
    body: doc(
      heading(2, 'Overview'),
      heading(4, 'Data flow'),
      media({ alt: 'diagram.png' }),
      media({ alt: 'A network diagram that has been described at extreme length. '.repeat(4) }),
      { type: 'expand', attrs: { title: '' }, content: [para(text('Hidden detail.'))] },
    ),
  },
  {
    title: 'Style guide',
    expect: [],
    body: doc(
      heading(2, 'Writing'),
      para(text('Use sentence case for headings and keep paragraphs short.')),
      heading(3, 'Images'),
      media({ alt: 'The editor toolbar with the alt text option highlighted' }),
      table(row(cell('Element', true), cell('Rule', true)), row(cell('Heading'), cell('Sentence case'))),
      para(text('See the '), link('accessibility checklist', 'https://clearwren.com/guide-checklist.html'), text(' for the full list.')),
    ),
  },
  {
    title: 'Policy',
    expect: ['link-ambiguous-duplicate', 'link-raw-url', 'long-paragraph'],
    body: doc(
      heading(2, 'Policy'),
      para(link('guidelines', 'https://example.com/security')),
      para(link('guidelines', 'https://example.com/brand')),
      para(link('https://example.com/a/very/long/url/that/nobody/should/read/aloud', 'https://example.com/a/very/long/url/that/nobody/should/read/aloud')),
      para(text('This clause repeats at length. '.repeat(45))),
    ),
  },
  {
    title: 'Copy of Untitled',
    expect: ['page-title-nondescriptive'],
    body: doc(para(text('Placeholder content.'))),
  },
];

/** Idempotent: creates the fixture, or overwrites it if a previous run left one. */
async function upsertPage(spaceId, title, body) {
  const existing = await findPageByTitle(spaceId, title);
  const payload = {
    spaceId,
    status: 'current',
    title,
    body: { representation: 'atlas_doc_format', value: JSON.stringify(body) },
  };
  const res = existing
    ? await api.asApp().requestConfluence(route`/wiki/api/v2/pages/${existing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          ...payload,
          id: existing.id,
          version: { number: (existing.version?.number ?? 1) + 1, message: 'fixture refresh' },
        }),
      })
    : await api.asApp().requestConfluence(route`/wiki/api/v2/pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
  const raw = await res.text();
  if (!res.ok) return { title, error: `${res.status}: ${raw.slice(0, 200)}` };
  return { title, id: JSON.parse(raw).id, replaced: Boolean(existing) };
}

async function findPageByTitle(spaceId, title) {
  const res = await api.asApp().requestConfluence(
    route`/wiki/api/v2/spaces/${spaceId}/pages?title=${title}&limit=1`,
    { headers: { Accept: 'application/json' } },
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data?.results?.[0] ?? null;
}

/** Creates a space to hold the fixtures when the demo site has none. */
async function ensureSpace() {
  const { spaces } = await listSpaces();
  const existing = spaces.find((s) => s.type === 'global') ?? spaces[0];
  if (existing) return { space: existing, created: false };

  const res = await api.asApp().requestConfluence(route`/wiki/api/v2/spaces`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ name: 'Clearwren Test Content', key: 'CWTEST' }),
  });
  const body = await res.text();
  if (!res.ok) return { space: null, created: false, error: `${res.status}: ${body.slice(0, 300)}` };
  return { space: JSON.parse(body), created: true };
}

export async function devSeed() {
  const listing = await listSpaces();
  const ensured = await ensureSpace();
  const target = ensured.space;
  if (!target) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': ['application/json'] },
      body: JSON.stringify({
        error: 'no space available',
        spacesSeen: listing.spaces?.length ?? 0,
        spaceSample: (listing.spaces ?? []).slice(0, 3),
        createError: ensured.error ?? null,
      }, null, 2),
    };
  }

  const results = [];
  for (const fixture of FIXTURES) {
    const created = await upsertPage(target.id, fixture.title, fixture.body);
    if (created.error) { results.push({ title: fixture.title, error: created.error, ok: false }); continue; }
    // Read it back through the same path the app uses, so the test covers extraction too.
    const page = await (await api.asApp().requestConfluence(
      route`/wiki/api/v2/pages/${created.id}?body-format=atlas_doc_format`,
      { headers: { Accept: 'application/json' } },
    )).json();
    const adf = parseAdf(page);
    const result = adf ? audit(adf, { meta: { id: String(page.id), title: page.title } }) : null;
    const found = result ? [...new Set(result.issues.map((i) => i.ruleId))].sort() : [];
    const missing = fixture.expect.filter((r) => !found.includes(r));
    const unexpected = found.filter((r) => !fixture.expect.includes(r));
    results.push({
      title: fixture.title,
      pageId: created.id,
      score: result?.score ?? null,
      conformant: result?.conformant ?? null,
      found,
      missing,
      unexpected,
      ok: missing.length === 0,
    });
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': ['application/json'] },
    body: JSON.stringify({
      space: { id: target.id, key: target.key, name: target.name, created: ensured.created },
      allExpectedFound: results.every((r) => r.ok),
      results,
    }, null, 2),
  };
}
