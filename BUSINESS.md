# Clearwren — plan of record

## The goal
A recurring-revenue business, run end to end by the agent, that reaches ₪10,000/month
(~$2,700) and keeps compounding after that.

## The vehicle: paid Forge apps on the Atlassian Marketplace

Chosen after measuring the whole market, not from a shortlist of opinions. The full
public catalogue was pulled from the Marketplace API (6,166 cloud apps) and analysed
locally — see `research/`.

Why this and not Shopify apps, a standalone SaaS, or content:

| Factor | Atlassian Forge | Shopify apps | Own-stack SaaS |
|---|---|---|---|
| Commission | **0% up to $1M lifetime**, then 17% | 0–15% | 0% but Stripe 2.9% |
| Who bills the customer | Atlassian (invoices, tax, dunning) | Shopify | Me |
| Hosting cost | **$0** — Forge runs on Atlassian's infra | mine | mine |
| Catalogue size | 6,166 cloud apps | 17,356 apps | n/a |
| Median app | 11 installs | 725 $/mo median | n/a |
| Buyer | admins with per-seat budgets | merchants | cold |
| Paid acquisition needed | no — marketplace search | increasingly yes | yes |

The structural point: Atlassian collects the money and runs the infrastructure, so the
only things left are *build the product* and *be found* — both of which the agent can do
alone, indefinitely, without a human in the loop.

## The wedge: accessibility compliance for Confluence Cloud

Measured, not guessed. Searching the Marketplace API for `wcag`:

- **hosting=cloud → 1 app** (a VPAT document generator for Jira, 3 installs)
- hosting=server / datacenter → 3 apps, the largest with 21 installs

Accessibility is an **empty category in Confluence Cloud**, while:

- Atlassian itself shipped an accessibility checker for Confluence **Data Center 10.x** —
  it validated the need and left Cloud without it.
- ADA Title II requires WCAG 2.1 AA for US state and local government web content
  (deadline 26 Apr 2027 for populations ≥50,000, 26 Apr 2028 below) — universities,
  school districts, transit agencies and libraries are heavy Confluence users.
- The European Accessibility Act has been in force since 28 Jun 2025; EN 301 549 already
  binds EU public bodies.
- Section 508 binds US federal agencies and their contractors.

Compliance demand has three properties that matter here: a deadline, a budget line, and
a recurring need for *evidence* — which is a subscription, not a one-off purchase.

## Product

**Clearwren Accessibility for Confluence** — checks page content against WCAG 2.2 A/AA.

- Per-page check in the byline, with in-place alt-text fixes.
- Space-wide scan (async queue) and a site-wide roll-up.
- A conformance report published as a Confluence page — the artefact an auditor asks for.
- Weekly automatic re-scan and trend history.
- 32 deterministic rules across images, headings, links, tables, contrast and content.

Runs entirely inside Forge with no outbound calls, which qualifies it for the
**Runs on Atlassian** badge — the trust signal enterprise and public-sector buyers filter on.

## Money

Pricing follows Atlassian's own default table, which they derive as 50% of the Confluence
seat price. Deviating downward was considered and rejected: the buyer here is driven by a
legal deadline, not by price, and a compliance tool priced well under the market reads as a
side project — the opposite of what someone staking a regulatory obligation on it needs.

| Users | Price/user/month | Example bill |
|---|---|---|
| 1–10 | **free** | $0 |
| 11–100 | $3.35 | 50 users → $167.50/mo |
| 101–250 | $2.55 | 200 users → $510/mo |
| 251–1,000 | $1.90 | 600 users → $1,140/mo |
| 1,001–2,500 | $1.75 | |
| tapering to 250,000 | $0.57 | |

The free tier up to ten users is the one deliberate departure from their template, which
charged a $33.50 flat rate there. Early on the scarce resource is installs and reviews, not
revenue from small teams: the ten-person team is not the buyer, but it is the one that
installs, tries it, and writes the first review a university will read.

Annual billing is computed automatically at ten times the monthly rate — two months free.
Resale through Atlassian Solution Partners is enabled, because public-sector buyers are
frequently required to purchase through an approved reseller rather than directly.

Routes to ₪10,000/month (~$2,700):

- 16 customers of about 50 users, **or**
- 5 customers of about 200 users, **or**
- 2 to 3 customers of about 600 users, **or** any mix.

That is roughly half the customer count the earlier, cheaper model required.

If installs are slow after 45 days, the lever is a time-boxed launch promotion through the
Marketplace's own promotions mechanism — not a list-price cut. A promotion expires by
itself; a price cut has to be undone in front of existing customers.

## Portfolio, not one app

The same engine, storage layer and dashboard shell get reused. Each further app compounds
the vendor's ranking, reviews and cross-sell:

1. **Accessibility for Confluence** — building now.
2. **Accessibility for Jira & JSM** — the same engine over portal and issue content.
3. **Link & attachment health** — broken links across spaces.
4. **Content lifecycle** — stale pages, review dates, retention (proven: 1,197 installs at 4.8★ for the nearest incumbent).
5. **Data protection scan** — PII left in pages (proven demand, weak incumbents).

## Sequence

| Phase | Work | Owner |
|---|---|---|
| 1 | Rule engine + Forge app | agent — **done, tests green** |
| 2 | Domain, business email, Atlassian partner account, KYB/KYC, bank details | **owner — blocking** |
| 3 | Register app, deploy to a dev site, end-to-end test | agent |
| 4 | Listing, pricing, screenshots, documentation site | agent |
| 5 | Submit for approval (10–15 business days) | agent |
| 6 | Launch: marketplace SEO, docs content, community answers, review requests | agent |
| 7 | Apps 2–5, one per cycle | agent |

## Risks, and where each one stands

| Risk | State |
|---|---|
| Israel not supported for partner payouts | **Cleared.** Methoda, of Raanana, is a Marketplace vendor with eleven listed apps. Atlassian publishes no country list, so this was verified through an existing partner. |
| Atlassian ships its own Cloud checker and commoditises the wedge | Partly mitigated by scope: their Data Center checker is a single-page editor check. The durable value here is coverage and evidence — space scans, trends, and the dated conformance report — not the per-page check. |
| Empty category means no demand rather than no supply | Countered by the legal deadlines, by Atlassian having built the Data Center checker at all, and by public sector and university use of Confluence. The free checker on the site is also a demand probe: traffic to it is a signal before a single install exists. |
| Marketplace search volume for accessibility is thin | The site, the guides and the free checker exist precisely so acquisition is not solely marketplace search. |
| App review rejection | Reduced by validating the manifest against Atlassian's own schema, by requesting only five scopes, and by making no outbound calls at all. |

## What is being tracked
`research/` holds the raw catalogue and the analysis scripts, so every number above can be
re-derived and re-run as the market moves.
