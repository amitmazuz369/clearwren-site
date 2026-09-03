/**
 * Generates one reference page per WCAG success criterion the engine covers.
 * The prose is written per criterion; the list of checks under each one comes
 * from the engine, so the reference cannot drift from the product.
 */
import { ALL_RULES } from '../packages/engine/dist/src/index.js';
import { writeFileSync } from 'node:fs';

const PROSE = {
  '1.1.1': {
    lede: 'Anything that is not text — an image, a chart, an icon, a diagram — needs a text alternative that serves the same purpose.',
    inConfluence: `Confluence makes this easy to get wrong because pasting a screenshot never asks for a
description. A page of numbered steps where each step is a screenshot is, to a screen-reader
user, a page of numbered nothing. Diagrams are the harder case: the alternative has to carry
the relationships the picture shows, not the fact that a picture exists.`,
    fix: `Click the image, use the alt text option in the image toolbar, and write what a reader
would lose if the image were removed. For a chart, that is the finding. For a screenshot,
it is the state of the interface and what is highlighted. Genuinely decorative images —
dividers, repeated brand marks — should be marked as decorative so they are skipped rather
than described.`,
  },
  '1.2.1': {
    lede: 'Pre-recorded audio-only and video-only content needs an alternative that presents the same information.',
    inConfluence: `Embedded walkthroughs and screen recordings are common in documentation and almost never
have one. A silent screen recording of a workflow is video-only content: someone who cannot
see it has no route to the information at all.`,
    fix: `Put the same steps on the page in writing, next to the recording. This is worth deciding
before you record, because writing the steps afterwards is what never happens.`,
  },
  '1.2.2': {
    lede: 'Pre-recorded video with audio needs captions.',
    inConfluence: `A recorded demo narrated by a colleague is the usual case. Auto-generated captions from the
hosting platform are a reasonable start, but they need correcting for product names and
jargon — which is exactly the vocabulary the viewer came for.`,
    fix: `Enable and correct captions on the hosting platform, and link a transcript from the page.
A checker can tell you a video is present; it cannot tell whether its captions are accurate,
so this one always ends with a person.`,
  },
  '1.3.1': {
    lede: 'Structure that is conveyed visually has to be conveyed in the markup too, so it survives when the visual presentation is gone.',
    inConfluence: `This is the criterion most documentation fails, and it fails in four familiar ways: bold
text used as a heading, typed dashes used as a list, a table with no header row, and heading
levels that skip. All four look right on screen and carry nothing underneath. A screen-reader
user navigating a long page by headings simply never sees the sections that were bolded
rather than marked up.`,
    fix: `Apply real heading levels from the text style menu, real lists from the toolbar, and turn
on the header row in tables. It takes seconds per page, and it is the single highest-value
change available in most Confluence spaces.`,
  },
  '1.4.1': {
    lede: 'Colour must never be the only way information is conveyed.',
    inConfluence: `Status tables are where this shows up: a green cell means done, a red cell means blocked,
and nothing says so in words. Status lozenges with no text are the same problem in a smaller
package. Prose like “the rows in red need approval” carries it into the writing itself.`,
    // This page necessarily quotes a colour-only instruction as its example.
    selfcheckAllow: 'colour-only-meaning',
    fix: `Add a second cue that does not depend on sight — a word in the cell, a labelled lozenge,
a column called Status. Then refer to that label in the surrounding text rather than to the
colour.`,
  },
  '1.4.3': {
    lede: 'Text needs a contrast ratio of at least 4.5:1 against its background, or 3:1 for large text.',
    inConfluence: `Two patterns cause almost all failures. The first is the soft grey people choose for
captions and notes, which usually lands near 2.8:1. The second is invisible to the author:
a coloured table cell or a custom panel colour behind text that was left at the default,
which can easily fall below the threshold without anyone changing the text colour at all.`,
    fix: `Darken the text or lighten the background until the pair clears 4.5:1. Large text — 24px,
or 18.66px and bold — only needs 3:1, which in Confluence covers H1 headings. Measuring
matters here: contrast is not something the eye judges reliably, particularly on a good
monitor in a bright room.`,
  },
  '1.4.8': {
    lede: 'A set of presentation requirements for blocks of text, including that text is not justified.',
    inConfluence: `Level AAA, so it is not part of a normal AA conformance claim, but justified text is worth
avoiding anyway: the uneven word spacing creates vertical rivers of white space that readers
with dyslexia find hard to track.`,
    fix: `Set paragraph alignment back to the start of the line — left for left-to-right languages,
right for Hebrew and Arabic.`,
  },
  '2.4.1': {
    lede: 'There has to be a way to skip past blocks of content that repeat across pages.',
    inConfluence: `Confluence provides the page furniture, so most of this criterion is Atlassian's
responsibility. What lands on the author is embedded content: an unlabelled frame is a block
a keyboard user has to enter to find out what it is.`,
    fix: `Give embeds a title, or introduce them with a line of text saying what they contain.`,
  },
  '2.4.2': {
    lede: 'Pages need titles that describe their topic or purpose.',
    inConfluence: `The page title is the first thing a screen reader announces, and it is what the page
carries into search results, breadcrumbs and every link to it. “Copy of Untitled”, “Meeting
notes” and “Page 1” all fail the test, which is whether the title still identifies the page
when read on its own.`,
    fix: `Rename the page so it works out of context. If two pages in a space share a title, add
what distinguishes them — the team, the product, the year.`,
  },
  '2.4.4': {
    lede: 'The purpose of a link has to be clear from its text, or from its immediate context.',
    inConfluence: `Screen-reader users often bring up a list of every link on a page and move through it.
A page whose links read “click here”, “here”, “this page” and “more” produces a list with no
information in it. Bare URLs are the other half of the problem: read out character by
character, they are slow and tell the listener almost nothing.`,
    fix: `Write the destination into the link text: “the 2026 onboarding checklist” rather than
“click here”. Two links with the same text must not lead to different places.`,
  },
  '2.4.6': {
    lede: 'Headings and labels have to describe the topic or purpose of what they introduce.',
    inConfluence: `An empty heading, a heading that runs to three lines, or a collapsible section with no
title all fail here. Headings are a navigation surface, not decoration: they are read as a
list, out of context, by people deciding where to jump.`,
    fix: `Keep headings short and specific, give every collapsible section a label, and delete
headings that exist only for spacing.`,
  },
  '2.4.9': {
    lede: 'The purpose of a link can be determined from the link text alone.',
    inConfluence: `Level AAA — a stricter version of 2.4.4, where surrounding context no longer counts. It is
worth knowing about because it is the standard a link list is actually read under.`,
    fix: `Make each link text self-contained and unique within the page.`,
  },
  '3.1.2': {
    lede: 'Passages in a different language need to be marked as such.',
    inConfluence: `Confluence sets one language for the page, so a Hebrew paragraph inside an English page is
announced by a screen reader using English pronunciation rules, which renders it
unintelligible. Multilingual documentation sites hit this constantly.`,
    fix: `Put substantial content in another language on its own page in that language, rather than
mixing scripts within one page. Where a mixed page is unavoidable, say in the text which
language the passage is in so a reader can switch tools.`,
  },
  '3.1.5': {
    lede: 'Provide a simpler alternative where text requires reading ability beyond lower secondary level.',
    inConfluence: `Level AAA, and rarely claimed. It is still a useful lens on documentation: paragraphs the
length of a screen, blocks of capitals, and sentences carrying four clauses are harder for
everyone and disproportionately harder for readers with cognitive disabilities.`,
    fix: `Break long paragraphs, turn embedded steps into lists, and use sentence case rather than
capitals for emphasis.`,
  },
  '4.1.2': {
    lede: 'Interface components need a name, a role and a value that assistive technology can determine.',
    inConfluence: `Most of this belongs to Atlassian. What an author controls is the naming of the components
they insert: a collapsible section with no title is a button with no name, an embed with no
title is a frame with no name, and a link wrapping an image with no alt text is a link with
no name.`,
    fix: `Name every expand, embed and image-only link. If you cannot say what it is in three words,
that is usually a sign the component is doing too much.`,
  },
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const slug = (c) => `wcag-${c.replace(/\./g, '-')}.html`;

const byCriterion = new Map();
for (const rule of ALL_RULES) {
  for (const w of rule.wcag) {
    if (!byCriterion.has(w.criterion)) byCriterion.set(w.criterion, { ...w, rules: [] });
    byCriterion.get(w.criterion).rules.push(rule);
  }
}

const index = [];
for (const [criterion, info] of [...byCriterion.entries()].sort()) {
  const prose = PROSE[criterion];
  if (!prose) continue;
  const checks = info.rules.map((r) =>
    `    <li><strong>${esc(r.title)}</strong> — ${esc(r.why)}</li>`).join('\n');
  const allow = prose.selfcheckAllow ? `\n<!-- selfcheck-allow: ${prose.selfcheckAllow} -->` : '';
  const page = `<!--
title: WCAG ${criterion} ${info.name} in Confluence — level ${info.level}
description: ${esc(prose.lede)} What it means for Confluence pages, and how to fix it.
-->${allow}
<p class="muted"><a href="/wcag.html">WCAG reference</a> → ${criterion}</p>
<h1>${criterion} ${esc(info.name)} <span class="muted">(level ${info.level})</span></h1>
<p class="lede">${esc(prose.lede)}</p>

<div class="prose">
  <h2>How it shows up in Confluence</h2>
  <p>${esc(prose.inConfluence).replace(/\n/g, ' ')}</p>

  <h2>What to do about it</h2>
  <p>${esc(prose.fix).replace(/\n/g, ' ')}</p>

  <h2>What Clearwren checks for this criterion</h2>
  <ul class="checks">
${checks}
  </ul>
  <p><a class="btn btn-primary" href="/checker.html">Check a page against these</a></p>
</div>
`;
  writeFileSync(new URL(`../site/src/${slug(criterion)}`, import.meta.url), page);
  index.push({ criterion, ...info });
}

const cards = index.map((i) =>
  `  <div class="card">
    <h2 class="card-title"><a href="/${slug(i.criterion)}">${i.criterion} ${esc(i.name)}</a></h2>
    <p>Level ${i.level} · ${i.rules.length} check${i.rules.length === 1 ? '' : 's'}</p>
  </div>`).join('\n');

writeFileSync(new URL('../site/src/wcag.html', import.meta.url), `<!--
title: WCAG 2.2 in Confluence — a reference by success criterion
description: What each WCAG success criterion means for Confluence pages, how it typically fails in documentation, and how to fix it.
-->
<h1>WCAG 2.2 in Confluence</h1>
<p class="lede">
  One page per success criterion that shows up in Confluence content, written for the people
  who write the pages rather than for the people who build the platform.
</p>
<div class="grid">
${cards}
</div>
<p class="muted">
  These are the criteria automated checking can reach from page content. The full standard has
  87 success criteria; the rest concern the platform itself or depend on human judgement.
</p>
`);

console.log(`generated ${index.length} criterion pages plus the index`);
