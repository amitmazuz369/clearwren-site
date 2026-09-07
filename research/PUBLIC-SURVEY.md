# Measuring Confluence accessibility from public sites

**Status: technically proven, not yet a study.** `research/public-survey.mjs` runs.

## What was settled on 2026-09-07

No data exists anywhere on the accessibility of documentation published in Confluence.
We own the engine that measures it, so the only question was whether we could reach
real-world content. We can.

Public Confluence Cloud sites serve the **v2 REST API anonymously**, and it returns page
bodies in `atlas_doc_format` — the exact input the engine was built for. No HTML
conversion, no fidelity loss. A measurement of a public space is as accurate as one we
would produce for a paying customer.

Verified against `uconn.atlassian.net`, a public university:

- `robots.txt` explicitly allows `/wiki/` and states `Crawl-delay: 1`.
- `/wiki/api/v2/spaces` returns spaces anonymously.
- `/wiki/api/v2/spaces/<id>/pages?body-format=atlas_doc_format` returns ADF bodies.
- `audit()` and `rollUp()` run unmodified over the result.

## The first run, and why its number must not be published

30 pages, one institution: 90% with no level A or AA failure, average score 98/100.

That looks like good news and it is almost certainly an artefact. The harness took the
first ten pages of each space, and those are landing pages — short, few images, no
tables. The content that fails sits deeper, in procedures and how-to guides.

Publishing "universities are 90% accessible" would be as wrong, and as damaging to us, as
publishing an inflated figure. A vendor whose numbers do not survive checking has nothing
left to sell.

## What a defensible study needs

1. **Many institutions**, not one. A single site measures that site.
2. **Depth-aware page selection.** Random across the whole tree, or explicitly stratified
   by depth. Never the first N.
3. **A stated method**, published alongside the number: how sites were found, how pages
   were chosen, sample size, dates, engine version.
4. **Aggregate reporting only.** No institution named, ever. WebAIM measures a million
   sites and names none; that is both the ethical and the useful choice. Naming one turns
   a research asset into a hostile act.
5. **Rate limits honoured**, per each site's own `robots.txt`.

## Why it is worth doing

WebAIM is the name everyone in this field cites because it publishes the number nobody
else has. The same position is open for documentation platforms, and we are the only ones
holding both the engine and the reason to care.
