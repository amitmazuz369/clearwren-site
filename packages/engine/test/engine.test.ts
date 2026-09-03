import test from 'node:test';
import assert from 'node:assert/strict';
import { audit, ALL_RULES, rollUp } from '../src/index.js';
import { doc, p, t, h, link, image, table, coloured } from './helpers.js';

const ids = (r: ReturnType<typeof audit>) => r.issues.map((i) => i.ruleId);

test('rule ids are unique and every rule has fix guidance', () => {
  const seen = new Set<string>();
  for (const r of ALL_RULES) {
    assert.ok(!seen.has(r.id), `duplicate rule id ${r.id}`);
    seen.add(r.id);
    assert.ok(r.why.length > 20, `${r.id} missing why`);
    assert.ok(r.howToFix.length > 20, `${r.id} missing howToFix`);
    assert.ok(r.wcag.length > 0, `${r.id} has no WCAG mapping`);
  }
});

test('a clean page scores 100 and is conformant', () => {
  const d = doc(
    h(2, 'Overview'),
    p(t('This page explains how to request access to the reporting database.')),
    h(3, 'Request steps'),
    { type: 'bulletList', content: [{ type: 'listItem', content: [p(t('Open the access request form'))] }] },
    image({ alt: 'Screenshot of the access request form with the team field highlighted' }),
    table([[p(t('Field'))], [p(t('Team name'))]], true),
    p(link('access request form', 'https://example.com/form')),
  );
  const r = audit(d, { meta: { title: 'Requesting reporting access' } });
  assert.equal(r.issues.length, 0, JSON.stringify(r.issues));
  assert.equal(r.score, 100);
  assert.equal(r.conformant, true);
});

test('missing alt text is critical and fails conformance', () => {
  const r = audit(doc(image({})), { meta: { title: 'Guide' } });
  assert.deepEqual(ids(r), ['img-alt-missing']);
  assert.equal(r.conformant, false);
  assert.equal(r.score, 85);
});

test('decorative images are exempt', () => {
  const r = audit(doc(image({ id: 'deco-1' })), { decorativeMediaIds: ['deco-1'] });
  assert.deepEqual(ids(r), []);
});

test('a caption counts as the text alternative', () => {
  const withCaption = {
    type: 'mediaSingle',
    content: [
      { type: 'media', attrs: { type: 'file', id: 'm9' } },
      { type: 'caption', content: [t('Access request form, annotated')] },
    ],
  };
  const r = audit(doc(withCaption as never));
  assert.equal(ids(r).includes('img-alt-missing'), false);
});

test('filename-style alt text is caught', () => {
  for (const alt of ['screenshot', 'image1', 'Screen Shot 2026-01-02 at 10.11.12', 'diagram.png', 'IMG_0421']) {
    const r = audit(doc(image({ alt })));
    assert.ok(ids(r).includes('img-alt-meaningless'), `expected meaningless alt for ${alt}`);
  }
});

test('good alt text passes', () => {
  const r = audit(doc(image({ alt: 'Bar chart showing support tickets falling from 900 to 300 over six months' })));
  assert.deepEqual(ids(r), []);
});

test('skipped heading levels are reported once per jump', () => {
  const r = audit(doc(h(2, 'One'), h(4, 'Two'), h(5, 'Three')));
  assert.deepEqual(ids(r), ['heading-skipped-level']);
});

test('h1 inside the body is flagged', () => {
  const r = audit(doc(h(1, 'Title again')));
  assert.ok(ids(r).includes('heading-h1-in-body'));
});

test('bold paragraph followed by content reads as a fake heading', () => {
  const bold = p(t('Setup steps', [{ type: 'strong' }]));
  const r = audit(doc(bold, p(t('First, open the console.'))));
  assert.ok(ids(r).includes('fake-heading'));
});

test('a bolded full sentence is not treated as a heading', () => {
  const bold = p(t('Do not delete this table.', [{ type: 'strong' }]));
  const r = audit(doc(bold, p(t('It is used by finance.'))));
  assert.equal(ids(r).includes('fake-heading'), false);
});

test('hand-typed bullets are detected', () => {
  const r = audit(doc(p(t('- first item')), p(t('- second item')), p(t('- third item'))));
  const issue = r.issues.find((i) => i.ruleId === 'fake-list');
  assert.ok(issue);
  assert.equal(issue!.data!['items'], 3);
});

test('vague link text is flagged, descriptive text is not', () => {
  const bad = audit(doc(p(link('click here', 'https://example.com/a'))));
  assert.ok(ids(bad).includes('link-nondescriptive'));
  const good = audit(doc(p(link('quarterly security report', 'https://example.com/a'))));
  assert.equal(ids(good).includes('link-nondescriptive'), false);
});

test('adjacent text nodes with one href count as a single link', () => {
  const d = doc({
    type: 'paragraph',
    content: [
      t('click ', [{ type: 'link', attrs: { href: 'https://example.com' } }]),
      t('here', [{ type: 'link', attrs: { href: 'https://example.com' } }]),
    ],
  });
  const r = audit(d);
  assert.equal(r.issues.filter((i) => i.ruleId === 'link-nondescriptive').length, 1);
});

test('the same link text pointing at two targets is ambiguous', () => {
  const r = audit(doc(
    p(link('guidelines', 'https://example.com/security')),
    p(link('guidelines', 'https://example.com/brand')),
  ));
  assert.ok(ids(r).includes('link-ambiguous-duplicate'));
});

test('tables need a header row', () => {
  const without = audit(doc(table([[p(t('a')), p(t('b'))], [p(t('1')), p(t('2'))]])));
  assert.ok(ids(without).includes('table-no-header'));
  const with_ = audit(doc(table([[p(t('a')), p(t('b'))], [p(t('1')), p(t('2'))]], true)));
  assert.equal(ids(with_).includes('table-no-header'), false);
});

test('merged cells are reported for review', () => {
  const d = doc({
    type: 'table',
    content: [{
      type: 'tableRow',
      content: [
        { type: 'tableHeader', attrs: { colspan: 2 }, content: [p(t('Span'))] },
        { type: 'tableHeader', attrs: {}, content: [p(t('Other'))] },
      ],
    }],
  });
  const r = audit(d);
  const issue = r.issues.find((i) => i.ruleId === 'table-merged-cells');
  assert.ok(issue);
  assert.equal(issue!.confidence, 'review');
});

test('contrast is measured against the effective background', () => {
  // #949494 on white is 2.85:1 — below the 4.5:1 body-text minimum.
  const r = audit(doc(p(coloured('Low contrast note', '#949494'))));
  const issue = r.issues.find((i) => i.ruleId === 'contrast-minimum');
  assert.ok(issue, JSON.stringify(r.issues));
  assert.ok((issue!.data!['ratio'] as number) < 4.5);
});

test('dark text on a light panel passes contrast', () => {
  const panel = { type: 'panel', attrs: { panelType: 'info' }, content: [p(coloured('Readable', '#172B4D'))] };
  const r = audit(doc(panel as never));
  assert.equal(ids(r).includes('contrast-minimum'), false);
});

test('white text on a dark table cell passes', () => {
  const d = doc({
    type: 'table',
    content: [{
      type: 'tableRow',
      content: [{ type: 'tableHeader', attrs: { background: '#172B4D' }, content: [p(coloured('Status', '#FFFFFF'))] }],
    }],
  });
  const r = audit(d);
  assert.equal(ids(r).includes('contrast-minimum'), false);
});

test('large headings use the 3:1 threshold', () => {
  // #767676 on white is 4.54:1 — passes as large text, fails as body text.
  const heading = { type: 'heading', attrs: { level: 1 }, content: [coloured('Section', '#8A8A8A')] };
  const body = p(coloured('Section', '#8A8A8A'));
  const rh = audit(doc(heading as never));
  const rb = audit(doc(body));
  assert.equal(rh.issues.filter((i) => i.ruleId === 'contrast-minimum').length, 0);
  assert.equal(rb.issues.filter((i) => i.ruleId === 'contrast-minimum').length, 1);
});

test('untitled pages are flagged', () => {
  const r = audit(doc(p(t('content'))), { meta: { title: 'Copy of Untitled' } });
  assert.ok(ids(r).includes('page-title-nondescriptive'));
});

test('criteria roll-up marks unrelated criteria not-applicable', () => {
  const r = audit(doc(p(t('Just words, nothing else.'))), { meta: { title: 'Plain page' } });
  const nonText = r.criteria.find((c) => c.criterion === '1.1.1');
  assert.equal(nonText?.status, 'not-applicable');
  const contrast = r.criteria.find((c) => c.criterion === '1.4.3');
  assert.equal(contrast?.status, 'not-applicable');
});

test('failing criteria are marked fail with a count', () => {
  const r = audit(doc(image({}), image({})));
  const c = r.criteria.find((x) => x.criterion === '1.1.1');
  assert.equal(c?.status, 'fail');
  assert.equal(c?.issueCount, 2);
});

test('a malformed document does not throw', () => {
  const weird = { type: 'doc', content: [{ type: 'paragraph' }, { type: 'table' }, { type: 'media' }] };
  assert.doesNotThrow(() => audit(weird as never));
});

test('roll-up aggregates pages and ranks rules by frequency', () => {
  const a = audit(doc(image({})));
  const b = audit(doc(image({}), p(link('click here', 'https://x.test'))));
  const r = rollUp([{ pageId: '1', result: a }, { pageId: '2', result: b }]);
  assert.equal(r.pages, 2);
  assert.equal(r.conformantPages, 0);
  assert.equal(r.byRule[0]!.ruleId, 'img-alt-missing');
  assert.equal(r.byRule[0]!.pages, 2);
});

test('colour-only wording is caught but colour descriptions are not', () => {
  const flagged = audit(doc(p(t('Anything marked in red still needs approval.'))));
  assert.ok(flagged.issues.some((i) => i.ruleId === 'colour-only-meaning'));
  const rows = audit(doc(p(t('The red rows are blocked.'))));
  assert.ok(rows.issues.some((i) => i.ruleId === 'colour-only-meaning'));
  const describing = audit(doc(p(t('Whether the grey caption text has enough contrast.'))));
  assert.equal(describing.issues.some((i) => i.ruleId === 'colour-only-meaning'), false);
});

test('mergeCriteria takes the worst outcome across pages and counts them', async () => {
  const { mergeCriteria } = await import('../src/index.js');
  const merged = mergeCriteria([
    { '1.1.1': 'pass', '1.4.3': 'not-applicable' },
    { '1.1.1': 'fail', '1.4.3': 'review' },
    { '1.1.1': 'fail', '1.4.3': 'pass' },
  ]);
  const nonText = merged.find((c) => c.criterion === '1.1.1');
  assert.equal(nonText?.status, 'fail');
  assert.equal(nonText?.issueCount, 2);
  assert.equal(nonText?.name, 'Non-text Content');
  const contrast = merged.find((c) => c.criterion === '1.4.3');
  assert.equal(contrast?.status, 'review');
});

test('default text on a standard info panel still passes', () => {
  const panel = { type: 'panel', attrs: { panelType: 'info' }, content: [p(t('Remember to file the ticket.'))] };
  const r = audit(doc(panel as never));
  assert.equal(r.issues.some((i) => i.ruleId === 'contrast-minimum'), false, JSON.stringify(r.issues));
});

test('default text on a dark custom panel is caught', () => {
  const panel = { type: 'panel', attrs: { panelType: 'custom', panelColor: '#253858' }, content: [p(t('Unreadable on this background.'))] };
  const r = audit(doc(panel as never));
  const issue = r.issues.find((i) => i.ruleId === 'contrast-minimum');
  assert.ok(issue, 'expected a contrast failure for default text on a dark panel');
  assert.ok((issue!.data!['ratio'] as number) < 4.5);
});

test('default text in a dark table cell is caught', () => {
  const d = doc({
    type: 'table',
    content: [{
      type: 'tableRow',
      content: [{ type: 'tableCell', attrs: { background: '#403294' }, content: [p(t('Blocked'))] }],
    }],
  });
  const r = audit(d);
  assert.ok(r.issues.some((i) => i.ruleId === 'contrast-minimum'));
});

test('a pale table cell with default text passes', () => {
  const d = doc({
    type: 'table',
    content: [{
      type: 'tableRow',
      content: [{ type: 'tableCell', attrs: { background: '#E3FCEF' }, content: [p(t('Done'))] }],
    }],
  });
  const r = audit(d);
  assert.equal(r.issues.some((i) => i.ruleId === 'contrast-minimum'), false);
});

test('a status lozenge without text relies on colour alone', () => {
  const bare = doc(p({ type: 'status', attrs: { text: '', color: 'green' } }));
  assert.ok(audit(bare).issues.some((i) => i.ruleId === 'status-colour-only'));
  const labelled = doc(p({ type: 'status', attrs: { text: 'Done', color: 'green' } }));
  assert.equal(audit(labelled).issues.some((i) => i.ruleId === 'status-colour-only'), false);
});

test('repeated heading text in the same section is reported once per repeat', () => {
  const r = audit(doc(h(2, 'Setup'), p(t('a')), h(2, 'Setup'), p(t('b')), h(2, 'Setup')));
  assert.equal(r.issues.filter((i) => i.ruleId === 'heading-duplicate-text').length, 2);
});

test('the same subheading under different sections is not a duplicate', () => {
  const r = audit(doc(
    h(2, 'Windows'), h(3, 'Steps'), p(t('a')),
    h(2, 'macOS'), h(3, 'Steps'), p(t('b')),
  ));
  assert.equal(r.issues.some((i) => i.ruleId === 'heading-duplicate-text'), false);
});

test('a page is never its own duplicate title', () => {
  const own = audit(doc(p(t('content'))), {
    meta: { title: 'Setup', siblingTitles: ['Onboarding', 'Policy'] },
  });
  assert.equal(own.issues.some((i) => i.ruleId === 'page-title-duplicate'), false);
  const clash = audit(doc(p(t('content'))), {
    meta: { title: 'Setup', siblingTitles: ['Onboarding', 'setup'] },
  });
  assert.ok(clash.issues.some((i) => i.ruleId === 'page-title-duplicate'));
});
