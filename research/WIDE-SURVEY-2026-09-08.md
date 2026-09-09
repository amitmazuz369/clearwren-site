# Wider re-run of the Confluence accessibility survey — 8 September 2026

Doubles the published study: **13 sites, 1,179 pages** (was 7 sites, 582 pages).
Six sites added to break the education skew the published study names as its main
limitation — open-source software projects, a research-computing centre, and a
clinical-terminology body. All serve `/wiki/` anonymously with `Crawl-delay: 1`,
verified today. Method otherwise unchanged: whole public page pool enumerated per
site, random sample of up to 100, engine run over `atlas_doc_format`.

Data: `survey-aggregate-2026-09-08-wide.json`. Runner: `run-survey-v2.mjs`.

## Headline

| | Published study (7 sites) | This run, same 7 sites | This run, 6 new sites | This run, all 13 |
|---|---|---|---|---|
| Pages | 582 | 582 | 597 | 1,179 |
| No A/AA failure | **57%** | **49%** | **65%** | **57%** |
| Average score | 74 | 70 | 75 | 73 |

## What this tells us

1. **The 57% is not precise.** Re-running the *same seven sites* with a fresh random
   sample produced 49%, an 8-point move from sampling noise alone. At 100 pages per
   site the real precision is roughly ±8 points. The published page presents "57%"
   as a point value; it should say "roughly half" and state the sampling error.

2. **The combined 13-site figure lands at 57% again** — but by coincidence, not
   robustness: the original sites came in 8 points lower and the new, cleaner sites
   pulled the average back up. The stable, defensible claim is "between a half and
   two thirds of pages carry no level A or AA failure."

3. **Open-source project docs are cleaner than university knowledge bases** (65% vs
   49%). The mechanism is visible in the rule breakdown: the new sites have far fewer
   images, so far less missing alt text (96 pages affected vs 215), but *more* bare
   URLs used as link text (162 vs 98) and more bold-as-heading (79 vs 50).

4. **Bare URL as link text is now the most widespread failure** — all 13 sites, 260
   of 1,179 pages. Missing alt text is still the largest by volume (1,765 issues) but
   is concentrated on image-heavy sites.

5. **Contrast is savagely concentrated**: 1,350 issues across just 122 pages. Almost
   always one template repeated.

## Recommendation

Republishing at 13 sites / 1,179 pages **strengthens** the study — larger sample,
broader frame, education skew broken — *if* the write-up drops the false precision.
Concrete changes to `site/src/study-confluence-accessibility.html`:

- "582 pages / seven sites" → "1,179 pages / 13 sites"
- "57% carried no level A or AA failure" → "Roughly half — 57% across the full
  sample, 49% when the original seven sites were re-drawn — carried no level A or AA
  failure. Read the number as one-in-two, not as a precise figure."
- Add one paragraph to Method: re-sampling the original seven produced 49%, which
  fixes the sampling error at about ±8 points.
- Site-type split (open-source 65% vs university KB 49%) is a genuine new finding
  worth its own short section.

This is an owner call: it rewrites a published research page and the follow-up
LinkedIn posts. The currently-queued post (8 Sept) cites the live 7-site study and
stays internally consistent — no need to touch it.

---

## 2026-09-09 — rewrite drafted

`study-confluence-accessibility.rev2.html` in this directory is the full proposed
replacement page, built from `survey-aggregate-2026-09-08-wide.json`. It drops the
false precision, adds the software-docs-vs-knowledge-base split, and reframes the
headline as "roughly half". Not built, not deployed — publishing it is the owner
call described above. On approval: copy into `site/src/`, rebuild, deploy from
`clearwren-site`, then reconcile the three queued LinkedIn posts that cite "57%".
