# Competitor: AccessLens for Confluence (TechnofyStore)

Found 2026-09-04 while mapping Atlassian Community threads. Not present in the
6,166-app Marketplace pull in `research/` — because it did not exist then.

## Facts, from the Marketplace API and listing

| | |
|---|---|
| First version | **2026-08-19** — sixteen days ago |
| Current version | 4.3.0, released **2026-09-04** (today) |
| Hosting | Cloud only. `connect: false` — a Forge app, like ours |
| Trust signal | **Runs on Atlassian** — the same badge we qualified for |
| Installs | **"No installs yet"** |
| Reviews | 0 |
| Pricing | **$7.50 per user/month**; $7.50/month flat at ≤10 users |
| Sibling | AccessLens for Jira, same vendor |

## What it does

From the listing: select spaces in scope, run incremental or full scans, review findings
by severity, page and rule. Each finding carries evidence, location and remediation
guidance. Operational scores, scan history, **time-bound exceptions**, and **CSV/JSON
exports**. Explicitly states it "does not provide WCAG certification".

That is substantially the same product as ours.

## Where we are ahead

1. **Price.** $1.60 vs $7.50 per user (revised down from an initial $3.35 before the
   2026-09-04 submission). At 100 users: $160/month against $750/month.
2. **Free tier.** Free to 10 users; they charge $7.50 there. Free tiers buy install
   counts, and install count is the main ranking and trust signal on a listing with no
   reviews.
3. **The conformance report.** They disclaim certification and sell an issue tracker. We
   produce a dated conformance statement against 15 WCAG 2.2 criteria — the artefact the
   procurement questionnaire actually asks for. This is the differentiator, it is real,
   and the site guides already argue for it.
4. **Contrast measured against the effective background.** Our rule resolves panels and
   coloured table cells rather than assuming the page background, which is the failure
   mode that makes generic checkers wrong on Confluence specifically.

## Where they are ahead

1. **They are live. We are in the approval queue.** A two-to-three week head start, and
   the only item on this list that we cannot close by building something.
2. **CSV/JSON export.** We have none. Given that our whole pitch is evidence you hand to
   a reviewer, this is the most incongruous gap in the product and the first thing to
   build.
3. **Time-bound exceptions.** We have rule-level disabling in settings; they have per-finding
   exceptions with an expiry. A genuine governance feature.
4. **Jira companion**, doubling their surface area on the Marketplace.

## What this changes

Not the thesis. Two brand-new apps with zero installs is a race, not a closed category,
and the deadlines driving demand have not moved. It does change two things:

- The **"only one app in Cloud"** line is retired. It was true when measured and is not
  now. It must not appear in any listing copy or guide.
- Export moves to the front of the build queue, ahead of anything else, because it is
  cheap and it is load-bearing for the positioning.

Re-check this listing weekly: install count, reviews, and whether pricing moves.
